@echo off
rem ============================================================
rem  Inicializa la base de datos "barberia" con mongosh.
rem  Doble clic para ejecutar (la consola queda abierta para
rem  tomar las capturas de pantalla).
rem ============================================================
cd /d "%~dp0.."

set MONGOSH=mongosh
where mongosh >nul 2>nul
if errorlevel 1 set MONGOSH=%LOCALAPPDATA%\Programs\mongosh\mongosh.exe

echo Ejecutando: %MONGOSH% mongodb://127.0.0.1:27017/barberia --file database\iniciar.js
echo.
"%MONGOSH%" mongodb://127.0.0.1:27017/barberia --file database\iniciar.js
echo.
echo Listo. Ahora puede ejecutar: mongosh  y  use barberia
pause
