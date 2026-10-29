@echo off
rem ============================================================
rem  BARBERIA RESERVAS - arranca los 3 proyectos en ventanas
rem  separadas: backend (:4000), frontend web (:5173) y
rem  aplicacion movil (:5174).
rem  MongoDB debe estar corriendo (servicio "MongoDB" de Windows).
rem ============================================================
cd /d "%~dp0"

echo ============================================
echo  ABRIENDO:
echo   1. Backend   - puerto 4000
echo   2. Frontend  - puerto 5173
echo   3. App movil - puerto 5174
echo ============================================
echo.

start "" "%~dp0backend\iniciar.cmd"
start "" "%~dp0frontend\iniciar.cmd"
start "" "%~dp0movil\iniciar.cmd"

timeout /t 3 >nul
echo Listo. Abre en el navegador:  http://localhost:5173/
pause
