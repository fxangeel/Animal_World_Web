@echo off
cd /d "%~dp0"
echo.
echo ANIMAL WORLD
echo Abre http://127.0.0.1:4173 en tu navegador.
echo Conserva esta ventana abierta mientras trabajas. Para detenerla, presiona Ctrl+C.
echo (Primera vez: ejecuta "npm install" y "npm run db:local" para preparar la base de datos local.)
echo.
call npm run dev
pause
