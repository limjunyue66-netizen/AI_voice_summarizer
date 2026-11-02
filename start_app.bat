@echo off
title AI Voice Summarizer Launcher
echo ========================================================
echo Launching AI Voice Summarizer (Backend + Frontend)...
echo ========================================================
start "AI Voice Summarizer - Backend" cmd /c "run_backend.bat"
timeout /t 3 /nobreak >nul
start "AI Voice Summarizer - Frontend" cmd /c "run_frontend.bat"
timeout /t 2 /nobreak >nul
start http://localhost:5173
echo App launched! Check browser at http://localhost:5173

