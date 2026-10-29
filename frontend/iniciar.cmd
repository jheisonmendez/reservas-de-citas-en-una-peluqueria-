@echo off
rem ============================================================
rem  FRONTEND WEB - panel del administrador (puerto 5173)
rem  Recuerda tener el backend corriendo (puerto 4000).
rem ============================================================
cd /d "%~dp0"
title FRONTEND WEB (puerto 5173)
echo Iniciando frontend web...
echo   URL: http://localhost:5173/web/
echo.
npm start
pause
