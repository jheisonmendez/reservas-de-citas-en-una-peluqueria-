@echo off
rem ============================================================
rem  BACKEND - API REST (puerto 4000) y base de datos MongoDB
rem ============================================================
cd /d "%~dp0"
title BACKEND API (puerto 4000)
echo Iniciando backend...
echo   API:  http://localhost:4000/api/salud
echo   DB:   mongodb://127.0.0.1:27017/barberia
echo.
npm start
pause
