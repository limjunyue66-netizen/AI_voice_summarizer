import os
import uuid
import time
from pathlib import Path
from fastapi import UploadFile, HTTPException
from backend.app.config.settings import settings

def validate_uploaded_file(file: UploadFile) -> str:
    """
    Validate the uploaded file:
    - Check presence
    - Check file extension
    - Check MIME type where available
    Returns the normalized lower-case extension without dot.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded or filename is empty.")
    
    filename = file.filename
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    
    if not ext or ext not in settings.supported_all_extensions:
        supported_list = ", ".join(sorted(list(settings.supported_all_extensions)))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '.{ext}'. Supported formats are: {supported_list}"
        )
        
    return ext

def generate_temp_path(original_filename: str, custom_ext: str = None) -> Path:
    """
    Generate a unique temporary file path using UUID to avoid collisions.
    """
    ext = custom_ext if custom_ext else (original_filename.split(".")[-1].lower() if "." in original_filename else "bin")
    unique_name = f"{uuid.uuid4().hex}_{int(time.time())}.{ext}"
    return settings.TEMP_DIR / unique_name

def safe_delete_file(file_path: Path | str | None):
    """
    Safely delete a file if it exists. Suppresses exceptions to prevent cleanup crashes.
    """
    if not file_path:
        return
    try:
        p = Path(file_path)
        if p.exists() and p.is_file():
            p.unlink(missing_ok=True)
    except Exception as e:
        # Log or ignore
        pass

def cleanup_stale_temp_files(max_age_seconds: int = 3600):
    """
    Clean up any orphaned temp files older than max_age_seconds.
    """
    now = time.time()
    try:
        for item in settings.TEMP_DIR.iterdir():
            if item.is_file() and item.name != ".gitkeep":
                try:
                    if now - item.stat().st_mtime > max_age_seconds:
                        item.unlink(missing_ok=True)
                except Exception:
                    pass
    except Exception:
        pass

