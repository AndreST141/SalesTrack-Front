@echo off
title SalesTrack - Iniciando...

echo ========================================
echo    SalesTrack - Iniciando Sistema
echo ========================================
echo.

echo [1/2] Iniciando Backend (Python)...
start "SalesTrack Backend" cmd /k "cd /d C:\Users\andre\OneDrive\Documentos\SalesTrack-V3\backend_V2 && python app.py"

timeout /t 3 /nobreak > nul

echo [2/2] Iniciando Frontend (React)...
start "SalesTrack Frontend" cmd /k "cd /d C:\Users\andre\OneDrive\Documentos\SalesTrack-V3\frontend_react && npm run dev"

timeout /t 4 /nobreak > nul

echo Abrindo navegador...
start "" "http://localhost:5173"

echo.
echo ========================================
echo    Sistema iniciado com sucesso!
echo ========================================
