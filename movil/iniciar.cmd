@echo off
rem ============================================================
rem  APLICACION MOVIL - interfaz del cliente (puerto 5174)
rem  Recuerda tener el backend corriendo (puerto 4000).
rem ============================================================
cd /d "%~dp0"
title APP MOVIL (puerto 5174)
echo Iniciando aplicacion movil...
echo   URL: http://localhost:5174/
echo.
npm start
pause
