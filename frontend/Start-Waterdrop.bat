@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo   Waterdrop Survivor - Local Setup
echo ========================================

echo.
echo Checking Node.js...
node --version >nul 2>&1 || (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Download from https://nodejs.org/ (LTS recommended)
  pause
  exit /b 1
)

echo Installing / updating dependencies...
call npm install
if errorlevel 1 (
  echo.
  echo npm install failed. Try deleting node_modules and package-lock.json then run again.
  pause
  exit /b 1
)

echo.
echo Starting the game (local demo mode - fully playable offline)...
echo (Browser will open automatically)
echo.
call npm start

pause
