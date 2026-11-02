import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env file from backend root or parent
backend_root = Path(__file__).resolve().parent.parent.parent
env_file = backend_root / ".env"
load_dotenv(dotenv_path=env_file)

class Settings(BaseModel):
    PROJECT_NAME: str = "AI Voice Summarizer"
    VERSION: str = "1.0.0"
    
    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    AGNES_API_KEY: str = os.getenv("AGNES_API_KEY", "")
    AGNES_BASE_URL: str = os.getenv("AGNES_BASE_URL", "https://apihub.agnes-ai.com/v1")
    AGNES_MODEL: str = os.getenv("AGNES_MODEL", "agnes-2.5-flash")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

    # File uploads
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "250"))
    MAX_UPLOAD_SIZE_BYTES: int = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    
    # Directories
    BASE_DIR: Path = backend_root
    TEMP_DIR: Path = backend_root / "temp"

    # Supported file extensions
    SUPPORTED_AUDIO_EXTENSIONS: set = {"mp3", "wav", "m4a", "aac", "flac", "ogg", "wma"}
    SUPPORTED_VIDEO_EXTENSIONS: set = {"wmv", "mp4", "webm"}

    @property
    def supported_all_extensions(self) -> set:
        return self.SUPPORTED_AUDIO_EXTENSIONS | self.SUPPORTED_VIDEO_EXTENSIONS

    # Custom ffmpeg path if any
    FFMPEG_CUSTOM_PATH: str = os.getenv("FFMPEG_PATH", "")

settings = Settings()
settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)

