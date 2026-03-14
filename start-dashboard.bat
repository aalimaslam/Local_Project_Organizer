@echo off
SETLOCAL EnableDelayedExpansion

echo ========================================
echo   LocalOrg - Starting Developer Console
echo ========================================

:: Detect script directory to allow running from anywhere
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Check if node_modules exists, if not, offer to install
if not exist "node_modules\" (
    echo [!] Root dependencies missing. Installing...
    call npm install
)

if not exist "backend\node_modules\" (
    echo [!] Backend dependencies missing. Installing...
    cd backend && call npm install && cd ..
)

if not exist "frontend\node_modules\" (
    echo [!] Frontend dependencies missing. Installing...
    cd frontend && call npm install && cd ..
)

echo [*] Launching both servers via root package.json...
echo [*] Backend: http://localhost:6001/api
echo [*] Frontend: http://localhost:5173

:: Use the root npm script which uses 'concurrently'
call npm run dev

pause