import subprocess
import os
import shutil
from pathlib import Path
from fastapi import HTTPException
from backend.app.config.settings import settings
from backend.app.utils.file_utils import generate_temp_path

class AudioProcessor:
    def __init__(self):
        self._ffmpeg_path = self._resolve_ffmpeg_path()

    def _resolve_ffmpeg_path(self) -> str:
        """
        Locate ffmpeg executable in order of:
        1. settings.FFMPEG_CUSTOM_PATH
        2. System PATH
        3. imageio_ffmpeg bundled binary
        """
        if settings.FFMPEG_CUSTOM_PATH and Path(settings.FFMPEG_CUSTOM_PATH).is_file():
            return settings.FFMPEG_CUSTOM_PATH

        # Check system PATH
        system_ffmpeg = shutil.which("ffmpeg")
        if system_ffmpeg:
            return system_ffmpeg

        # Try imageio_ffmpeg
        try:
            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            if ffmpeg_exe and Path(ffmpeg_exe).is_file():
                return ffmpeg_exe
        except Exception:
            pass

        return "ffmpeg"

    def is_ffmpeg_available(self) -> bool:
        try:
            res = subprocess.run([self._ffmpeg_path, "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return res.returncode == 0
        except Exception:
            return False

    def process_media_for_gemini(self, input_path: Path, ext: str) -> Path:
        """
        Processes media file:
        - If it is a video (wmv, mp4, webm) or wma, extract and convert audio track to MP3.
        - If it is already a direct audio format (mp3, wav, m4a, aac, flac, ogg),
          validate it and optionally return input_path directly or convert if needed.
        Returns the path to the ready audio file.
        """
        ext = ext.lower().strip(".")
        is_video = ext in settings.SUPPORTED_VIDEO_EXTENSIONS
        needs_conversion = is_video or ext in {"wma"}

        if not needs_conversion:
            # Native audio file - verify non-empty
            if input_path.stat().st_size == 0:
                raise HTTPException(status_code=400, detail="The uploaded audio file is empty.")
            return input_path

        # FFmpeg extraction required
        if not self.is_ffmpeg_available():
            raise HTTPException(
                status_code=500,
                detail="FFmpeg is required to extract audio from video/wma files, but it could not be located on the system."
            )

        output_audio_path = generate_temp_path(input_path.name, custom_ext="mp3")

        cmd = [
            self._ffmpeg_path,
            "-y",                # Overwrite output
            "-i", str(input_path),
            "-vn",               # Disable video recording
            "-acodec", "libmp3lame",
            "-ar", "44100",      # 44.1kHz sample rate
            "-ac", "2",          # Stereo
            "-b:a", "192k",      # 192kbps
            str(output_audio_path)
        ]

        try:
            process = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=False
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Audio extraction process failed to execute: {str(e)}"
            )

        if process.returncode != 0:
            err_msg = process.stderr.lower() if process.stderr else ""
            if "does not contain any stream" in err_msg or "matches no streams" in err_msg:
                raise HTTPException(
                    status_code=400,
                    detail="The uploaded video or media file does not contain a valid audio track."
                )
            raise HTTPException(
                status_code=500,
                detail=f"Audio extraction failed: {process.stderr[-300:] if process.stderr else 'Unknown FFmpeg error'}"
            )

        if not output_audio_path.exists() or output_audio_path.stat().st_size == 0:
            raise HTTPException(
                status_code=400,
                detail="Extracted audio file is empty or missing an audio track."
            )

        return output_audio_path

audio_processor = AudioProcessor()

