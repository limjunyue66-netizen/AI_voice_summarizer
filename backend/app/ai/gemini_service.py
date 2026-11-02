import json
import time
import warnings
from pathlib import Path
from fastapi import HTTPException

# Suppress deprecation warnings from legacy google.generativeai namespace
with warnings.catch_warnings():
    warnings.simplefilter("ignore", category=FutureWarning)
    import google.generativeai as genai

from backend.app.config.settings import settings

def detect_working_model(api_key: str, preferred_model: str = "") -> str:
    """
    Queries Gemini ModelService to find an active model supported by this API key.
    """
    genai.configure(api_key=api_key)
    available_models = []
    try:
        for m in genai.list_models():
            methods = getattr(m, "supported_generation_methods", [])
            if "generateContent" in methods:
                available_models.append(m.name)
    except Exception:
        pass

    if not available_models:
        # Fallback to standard names
        return preferred_model or "gemini-3.8-flash"

    # Normalize preferred model
    if preferred_model:
        for m_name in available_models:
            if preferred_model == m_name or f"models/{preferred_model}" == m_name:
                return m_name

    # Priority list (Prefer newest Gemini 3.8 Flash)
    priority_order = [
        "models/gemini-3.8-flash",
        "gemini-3.8-flash",
        "models/gemini-2.5-flash",
        "models/gemini-2.0-flash",
        "models/gemini-1.5-flash",
        "models/gemini-1.5-flash-latest",
        "models/gemini-pro",
    ]

    for p in priority_order:
        if p in available_models:
            return p

    # Fallback to any flash or first available
    for m_name in available_models:
        if "flash" in m_name:
            return m_name

    return available_models[0]


class GeminiService:
    def __init__(self):
        self.active_model_name = ""

    def _ensure_api_key(self):
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "" or "your_" in settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=400,
                detail="Google Gemini API Key is not configured. Please set a valid GEMINI_API_KEY in the backend/.env file."
            )
        genai.configure(api_key=settings.GEMINI_API_KEY.strip())

    def transcribe_audio(self, audio_path: Path) -> dict:
        """
        Transcribes the given audio file using Google Gemini API.
        Returns:
            {
                "detected_language": str,
                "transcript": str
            }
        """
        self._ensure_api_key()

        if not audio_path.exists() or audio_path.stat().st_size == 0:
            raise HTTPException(status_code=400, detail="Audio file for transcription is missing or empty.")

        # Determine MIME type
        ext = audio_path.suffix.lower().strip(".")
        mime_map = {
            "mp3": "audio/mp3",
            "wav": "audio/wav",
            "m4a": "audio/mp4",
            "aac": "audio/aac",
            "flac": "audio/flac",
            "ogg": "audio/ogg",
        }
        mime_type = mime_map.get(ext, "audio/mp3")

        uploaded_file = None
        try:
            working_model_name = detect_working_model(settings.GEMINI_API_KEY, settings.GEMINI_MODEL)
            model = genai.GenerativeModel(model_name=working_model_name)

            prompt = (
                "You are an expert audio transcription system. "
                "Carefully listen to the provided audio file and perform the following tasks:\n"
                "1. Accurately transcribe all spoken words without inventing or assuming any missing content.\n"
                "2. Detect the primary spoken language (e.g. English, Chinese, Malay, Mixed).\n"
                "3. Preserve the original spoken language of the speaker in the transcript.\n"
                "4. Return the result in strictly valid JSON format with keys:\n"
                "   - 'detected_language': string (e.g. 'English', 'Chinese', 'Malay', etc.)\n"
                "   - 'transcript': string (the full transcribed text)\n"
                "Do NOT include markdown backticks or any other text outside the JSON."
            )

            file_size = audio_path.stat().st_size
            # For files under 20MB, pass inline bytes to completely bypass Google File API permissions
            if file_size <= 20 * 1024 * 1024:
                with open(audio_path, "rb") as f:
                    audio_bytes = f.read()

                audio_content = {
                    "mime_type": mime_type,
                    "data": audio_bytes
                }
                response = model.generate_content([audio_content, prompt])
            else:
                # Fallback to Files API for larger recordings
                uploaded_file = genai.upload_file(path=str(audio_path), mime_type=mime_type)
                retries = 30
                while uploaded_file.state.name == "PROCESSING" and retries > 0:
                    time.sleep(2)
                    uploaded_file = genai.get_file(uploaded_file.name)
                    retries -= 1

                if uploaded_file.state.name == "FAILED":
                    raise HTTPException(status_code=500, detail="Gemini failed to process the uploaded audio file.")

                response = model.generate_content([uploaded_file, prompt])
            
            if not response or not response.text:
                raise HTTPException(status_code=500, detail="Empty response returned from Gemini API during transcription.")

            raw_text = response.text.strip()
            # Clean possible markdown wrapping ```json ... ```
            if raw_text.startswith("```"):
                lines = raw_text.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw_text = "\n".join(lines).strip()

            try:
                parsed = json.loads(raw_text)
                detected_lang = parsed.get("detected_language", "Unknown")
                transcript = parsed.get("transcript", "")
            except Exception:
                # Fallback if model didn't return strict JSON
                detected_lang = "Detected from audio"
                transcript = response.text.strip()

            if not transcript:
                raise HTTPException(status_code=400, detail="No intelligible speech could be recognized in the audio.")

            return {
                "detected_language": detected_lang,
                "transcript": transcript
            }

        except HTTPException:
            raise
        except Exception as e:
            err_str = str(e)
            if "API_KEY_INVALID" in err_str or "401" in err_str or "unregistered" in err_str.lower():
                raise HTTPException(status_code=401, detail="Invalid Google Gemini API key. Please check your GEMINI_API_KEY.")
            raise HTTPException(status_code=500, detail=f"Gemini transcription failed: {err_str}")

        finally:
            # Clean up uploaded file from Gemini File API
            if uploaded_file is not None:
                try:
                    genai.delete_file(uploaded_file.name)
                except Exception:
                    pass

gemini_service = GeminiService()
