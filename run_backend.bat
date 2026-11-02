@echo off
title AI Voice Summarizer - Backend Server
echo ========================================================
echo Starting AI Voice Summarizer Backend Server (FastAPI)...
echo ========================================================
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
pause

