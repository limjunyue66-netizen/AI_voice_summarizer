import json
import httpx
from fastapi import HTTPException
from backend.app.config.settings import settings

class AgnesService:
    def __init__(self):
        pass

    def _ensure_api_key(self):
        if not settings.AGNES_API_KEY or settings.AGNES_API_KEY.strip() == "" or "your_" in settings.AGNES_API_KEY:
            raise HTTPException(
                status_code=400,
                detail="Agnes AI API Key is not configured. Please set a valid AGNES_API_KEY in the backend/.env file."
            )

    def summarize(self, transcript: str, target_language: str = "English", detected_language: str = "Unknown") -> dict:
        """
        Sends the transcribed text to Agnes AI API to generate a structured summary.
        Expected output structure:
        {
            "overall_summary": str,
            "key_points": list[str],
            "important_details": list[str],
            "main_topics": list[{"topic": str, "description": str}],
            "conclusions": list[str]
        }
        """
        self._ensure_api_key()

        if not transcript or not transcript.strip():
            raise HTTPException(status_code=400, detail="Transcript is empty. Nothing to summarize.")

        # Map language string
        lang_instruction = {
            "english": "English",
            "chinese": "Simplified Chinese (简体中文)",
            "malay": "Malay (Bahasa Melayu)"
        }.get(target_language.lower(), target_language)

        system_prompt = (
            f"You are Agnes AI, an expert analytical summarizer. "
            f"Your task is to analyze the provided recording transcript and produce a highly comprehensive, "
            f"objective, and well-structured summary strictly in {lang_instruction}.\n\n"
            f"Requirements:\n"
            f"1. Preserve the original meaning and core context faithfully without hallucinating or inventing facts.\n"
            f"2. Avoid unnecessary repetition and ensure clear, professional readability.\n"
            f"3. Even if the original transcript is in another language ({detected_language}), the output MUST be strictly in {lang_instruction}.\n"
            f"4. You MUST format your response as valid, pure JSON with exactly the following structure:\n"
            f"```json\n"
            f"{{\n"
            f'  "overall_summary": "Comprehensive explanation of the entire recording.",\n'
            f'  "key_points": ["Key point 1", "Key point 2", ...],\n'
            f'  "important_details": ["Detail 1", "Detail 2", ...],\n'
            f'  "main_topics": [\n'
            f'    {{"topic": "Topic Name", "description": "Discussion details"}},\n'
            f'    ...\n'
            f'  ],\n'
            f'  "conclusions": ["Conclusion 1", "Conclusion 2", ...]\n'
            f"}}\n"
            f"```\n"
            f"Do not include any greeting or conversational filler before or after the JSON."
        )

        user_content = f"Transcript to analyze and summarize:\n\n{transcript}"

        url = f"{settings.AGNES_BASE_URL.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.AGNES_API_KEY.strip()}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.AGNES_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.3
        }

        try:
            with httpx.Client(timeout=90.0) as client:
                response = client.post(url, headers=headers, json=payload)

            if response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid Agnes AI API key. Please check your AGNES_API_KEY.")
            elif response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Agnes AI API returned error (HTTP {response.status_code}): {response.text[:300]}"
                )

            data = response.json()
            choices = data.get("choices", [])
            if not choices or "message" not in choices[0] or "content" not in choices[0]["message"]:
                raise HTTPException(status_code=500, detail="Unexpected response structure from Agnes AI API.")

            raw_text = choices[0]["message"]["content"].strip()

            # Clean markdown code blocks if wrapped
            if raw_text.startswith("```"):
                lines = raw_text.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw_text = "\n".join(lines).strip()

            parsed = json.loads(raw_text)

            # Ensure all required keys exist
            return {
                "overall_summary": parsed.get("overall_summary", ""),
                "key_points": parsed.get("key_points", []),
                "important_details": parsed.get("important_details", []),
                "main_topics": parsed.get("main_topics", []),
                "conclusions": parsed.get("conclusions", [])
            }

        except HTTPException:
            raise
        except json.JSONDecodeError:
            # Fallback parsing in case model generated freeform text
            return {
                "overall_summary": raw_text,
                "key_points": ["Extracted summary available in Overall Summary section."],
                "important_details": [],
                "main_topics": [],
                "conclusions": []
            }
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Agnes AI API: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Agnes AI summarization error: {str(e)}")

agnes_service = AgnesService()

