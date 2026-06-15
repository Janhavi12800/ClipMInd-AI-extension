@echo off
echo.
echo TradePrompt AI - Windows Install
echo ================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js nahi mila!
    echo Download karo: https://nodejs.org  ^(LTS version^)
    echo Install karo, phir ye script dubara chalao.
    pause
    exit /b 1
)

echo Node.js: 
node -v
echo.

cd /d "%~dp0.."
cd backend

echo Installing dependencies...
call npm install

if not exist .env (
    echo Creating .env demo mode...
    call npm run setup:demo
)

echo.
echo ========================================
echo   INSTALL COMPLETE!
echo ========================================
echo.
echo Ab ye karo:
echo   1. cd backend
echo   2. npm run dev
echo   3. Chrome: chrome://extensions
echo   4. Load unpacked: extension folder
echo   5. OpenAI API key add karo Settings mein
echo.
pause
