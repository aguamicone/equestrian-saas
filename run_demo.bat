@echo off
title Equestrian SaaS Demo Runner
color 0f

echo ===================================================
echo     EQUESTRIAN SAAS PROTOTYPE - LAUNCHER
echo ===================================================
echo.
echo This script will help you run the application locally.
echo.

REM Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Node.js is not found!
    echo.
    echo You verified you installed it, but this terminal cannot see it yet.
    echo Please TRY RESTARTING YOUR COMPUTER to apply the PATH changes.
    echo.
    echo If that fails, download it again from: https://nodejs.org/
    echo.
    pause
    exit /b
)

echo [OK] Node.js found.
echo.
echo STEP 1: Installing dependencies (npm install)...
echo This might take 1-2 minutes. Please wait.
echo.
call npm install
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] npm install failed.
    pause
    exit /b
)

echo.
echo STEP 2: Starting Server...
echo.
echo ---------------------------------------------------
echo  When the server starts, look for "Local: http://localhost:5173"
echo  CTRL + Click that link or open it in your browser.
echo ---------------------------------------------------
echo.
npm run dev

pause
