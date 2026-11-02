import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import warnings
import httpx

with warnings.catch_warnings():
    warnings.simplefilter("ignore", category=FutureWarning)
    import google.generativeai as genai

from backend.app.config.settings import settings
from backend.app.utils.file_utils import (
    validate_uploaded_file,
    generate_temp_path,
    safe_delete_file,
    cleanup_stale_temp_files
)
from backend.app.services.audio_processor import audio_processor
from backend.app.ai.gemini_service import gemini_service
from backend.app.ai.agnes_service import agnes_service
from backend.app.services.pdf_service import pdf_service

router = APIRouter(prefix="/api", tags=["Summarization"])

class PDFDownloadRequest(BaseModel):
    filename: str
    detected_language: str
    summary_language: str
    summary_data: dict
    original_transcript: str = ""

class ApiKeysUpdateRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    agnes_api_key: Optional[str] = None

class TestConnectionRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    agnes_api_key: Optional[str] = None
    test_target: str = "all" # "gemini", "agnes", or "all"

def mask_key(key: str) -> str:
    if not key or len(key) < 8:
        return ""
    return f"{key[:4]}...{key[-4:]}"

@router.get("/settings/get-keys")
def get_api_settings():
    """
    Returns masked keys and configuration status.
    """
    return {
        "gemini_configured": bool(settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("your_")),
        "agnes_configured": bool(settings.AGNES_API_KEY and not settings.AGNES_API_KEY.startswith("your_")),
        "gemini_masked": mask_key(settings.GEMINI_API_KEY),
        "agnes_masked": mask_key(settings.AGNES_API_KEY),
    }

@router.post("/settings/save-keys")
def save_api_keys(payload: ApiKeysUpdateRequest):
    """
    Saves API keys to memory and updates backend/.env file.
    """
    env_file = settings.BASE_DIR / ".env"
    env_lines = []
    if env_file.exists():
        env_lines = env_file.read_text(encoding="utf-8").splitlines()

    updated_gemini = False
    updated_agnes = False

    new_lines = []
    for line in env_lines:
        if line.startswith("GEMINI_API_KEY=") and payload.gemini_api_key is not None:
            new_lines.append(f"GEMINI_API_KEY={payload.gemini_api_key.strip()}")
            settings.GEMINI_API_KEY = payload.gemini_api_key.strip()
            updated_gemini = True
        elif line.startswith("AGNES_API_KEY=") and payload.agnes_api_key is not None:
            new_lines.append(f"AGNES_API_KEY={payload.agnes_api_key.strip()}")
            settings.AGNES_API_KEY = payload.agnes_api_key.strip()
            updated_agnes = True
        else:
            new_lines.append(line)

    if not updated_gemini and payload.gemini_api_key is not None:
        new_lines.append(f"GEMINI_API_KEY={payload.gemini_api_key.strip()}")
        settings.GEMINI_API_KEY = payload.gemini_api_key.strip()

    if not updated_agnes and payload.agnes_api_key is not None:
        new_lines.append(f"AGNES_API_KEY={payload.agnes_api_key.strip()}")
        settings.AGNES_API_KEY = payload.agnes_api_key.strip()

    env_file.write_text("\n".join(new_lines) + "\n", encoding="utf-8")

    return {
        "success": True,
        "message": "API keys saved and applied successfully.",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "agnes_configured": bool(settings.AGNES_API_KEY),
    }

@router.post("/settings/test-connection")
def test_api_connections(payload: TestConnectionRequest):
    """
    Tests live connectivity and authentication with Google Gemini and Agnes AI.
    """
    gemini_key = (payload.gemini_api_key or settings.GEMINI_API_KEY).strip()
    agnes_key = (payload.agnes_api_key or settings.AGNES_API_KEY).strip()

    results = {
        "gemini": {"success": False, "message": "Not tested"},
        "agnes": {"success": False, "message": "Not tested"}
    }

    # Test Gemini
    if payload.test_target in ("gemini", "all"):
        if not gemini_key or gemini_key.startswith("your_"):
            results["gemini"] = {
                "success": False,
                "message": "Gemini API key is empty or not provided."
            }
        else:
            try:
                from backend.app.ai.gemini_service import detect_working_model
                working_model = detect_working_model(gemini_key, "gemini-3.8-flash")
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel(model_name=working_model)
                # Lightweight test ping
                res = model.generate_content("Ping. Reply with 'OK'.")
                if res and res.text:
                    display_name = working_model.replace("models/", "")
                    results["gemini"] = {
                        "success": True,
                        "message": f"Connection successful! Matched working model: {display_name}",
                        "matched_model": display_name
                    }
                    # Automatically update settings model to working model
                    settings.GEMINI_MODEL = display_name
                else:
                    results["gemini"] = {
                        "success": False,
                        "message": "Empty response from Gemini model."
                    }
            except Exception as e:
                err_msg = str(e)
                if "API_KEY_INVALID" in err_msg or "401" in err_msg:
                    results["gemini"] = {
                        "success": False,
                        "message": "Authentication failed: Invalid Gemini API key."
                    }
                else:
                    results["gemini"] = {
                        "success": False,
                        "message": f"Connection error: {err_msg[:200]}"
                    }

    # Test Agnes AI
    if payload.test_target in ("agnes", "all"):
        if not agnes_key or agnes_key.startswith("your_"):
            results["agnes"] = {
                "success": False,
                "message": "Agnes AI API key is empty or not provided."
            }
        else:
            try:
                url = f"{settings.AGNES_BASE_URL.rstrip('/')}/chat/completions"
                headers = {
                    "Authorization": f"Bearer {agnes_key}",
                    "Content-Type": "application/json"
                }
                test_body = {
                    "model": settings.AGNES_MODEL,
                    "messages": [
                        {"role": "user", "content": "Ping test. Reply with 'OK'."}
                    ],
                    "max_tokens": 10
                }
                with httpx.Client(timeout=15.0) as client:
                    resp = client.post(url, headers=headers, json=test_body)

                if resp.status_code == 200:
                    results["agnes"] = {
                        "success": True,
                        "message": "Connection successful! Agnes AI authenticated."
                    }
                elif resp.status_code == 401:
                    results["agnes"] = {
                        "success": False,
                        "message": "Authentication failed: Invalid Agnes AI API key."
                    }
                else:
                    results["agnes"] = {
                        "success": False,
                        "message": f"Agnes API returned HTTP {resp.status_code}: {resp.text[:150]}"
                    }
            except Exception as e:
                results["agnes"] = {
                    "success": False,
                    "message": f"Connection error: {str(e)[:200]}"
                }

    return results

@router.get("/health")
def health_check():
    """
    Health and readiness check for the backend and third-party dependencies.
    """
    cleanup_stale_temp_files()
    ffmpeg_ready = audio_processor.is_ffmpeg_available()
    gemini_configured = bool(settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("your_"))
    agnes_configured = bool(settings.AGNES_API_KEY and not settings.AGNES_API_KEY.startswith("your_"))

    return {
        "status": "healthy",
        "ffmpeg_ready": ffmpeg_ready,
        "gemini_configured": gemini_configured,
        "agnes_configured": agnes_configured,
        "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_MB,
        "supported_audio": sorted(list(settings.SUPPORTED_AUDIO_EXTENSIONS)),
        "supported_video": sorted(list(settings.SUPPORTED_VIDEO_EXTENSIONS))
    }

@router.post("/process")
async def process_media_and_summarize(
    file: UploadFile = File(...),
    language: str = Form("english"),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Main processing workflow:
    1. Validate uploaded file and extension
    2. Save uploaded file to unique temp path
    3. Extract audio via FFmpeg if video or non-standard
    4. Transcribe with Gemini API
    5. Summarize transcript with Agnes AI API
    6. Clean up temporary media files immediately
    """
    ext = validate_uploaded_file(file)

    # Save to temp
    temp_uploaded_path = generate_temp_path(file.filename, custom_ext=ext)
    processed_audio_path = None

    try:
        # Write chunks to disk while verifying file size does not exceed limit
        total_size = 0
        chunk_size = 1024 * 1024 # 1MB chunks

        with open(temp_uploaded_path, "wb") as buffer:
            while chunk := await file.read(chunk_size):
                total_size += len(chunk)
                if total_size > settings.MAX_UPLOAD_SIZE_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
                    )
                buffer.write(chunk)

        if total_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # Process / Extract Audio
        processed_audio_path = audio_processor.process_media_for_gemini(temp_uploaded_path, ext)

        # Transcribe with Gemini
        transcription_result = gemini_service.transcribe_audio(processed_audio_path)
        detected_lang = transcription_result.get("detected_language", "Unknown")
        transcript = transcription_result.get("transcript", "")

        # Summarize with Agnes AI
        summary_result = agnes_service.summarize(
            transcript=transcript,
            target_language=language,
            detected_language=detected_lang
        )

        return {
            "success": True,
            "filename": file.filename,
            "file_size": total_size,
            "format": ext.upper(),
            "detected_language": detected_lang,
            "summary_language": language,
            "transcript": transcript,
            "summary": summary_result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected processing error: {str(e)}")

    finally:
        # Guarantee cleanup of uploaded and converted audio files
        safe_delete_file(temp_uploaded_path)
        if processed_audio_path and processed_audio_path != temp_uploaded_path:
            safe_delete_file(processed_audio_path)

@router.post("/download-pdf")
async def download_summary_pdf(
    req: PDFDownloadRequest,
    background_tasks: BackgroundTasks
):
    """
    Generates and downloads a clean, beautifully formatted PDF report of the summary.
    Cleans up the generated PDF file after sending.
    """
    try:
        pdf_path = pdf_service.generate_summary_pdf(
            filename=req.filename,
            detected_language=req.detected_language,
            summary_language=req.summary_language,
            summary_data=req.summary_data,
            original_transcript=req.original_transcript
        )

        # Cleanup after response finishes streaming
        background_tasks.add_task(safe_delete_file, pdf_path)

        clean_base = Path(req.filename).stem
        download_name = f"Summary_{clean_base}.pdf"

        return FileResponse(
            path=str(pdf_path),
            filename=download_name,
            media_type="application/pdf",
            background=background_tasks
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")

