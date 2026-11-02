@echo off
title "Build and Deploy Frontend"
echo Building frontend and deploying to XAMPP root...
cd frontend
call npm run build
cd ..
if exist assets rmdir /s /q assets
mkdir assets
xcopy /s /e /y frontend\dist\assets\* assets\
copy /y frontend\dist\index.html index.html
echo ========================================================
echo Done! Frontend is updated and ready in XAMPP root.
echo ========================================================
