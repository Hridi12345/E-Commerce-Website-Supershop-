@echo off
setlocal
cd /d "%~dp0"
title SuShop - Full-Stack Launcher

echo ========================================================
echo   SUSHOP EVERYDAY ESSENTIALS SUPERSHOP & ADMIN PANEL
echo ========================================================
echo.

:: Detect Python
set PYTHON_CMD=python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    where py >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set PYTHON_CMD=py
    ) else (
        if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
            set PYTHON_CMD="%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
        ) else if exist "C:\Python311\python.exe" (
            set PYTHON_CMD="C:\Python311\python.exe"
        )
    )
)

:: Detect NPM
set NPM_CMD=npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files\nodejs\npm.cmd" (
        set NPM_CMD="C:\Program Files\nodejs\npm.cmd"
    )
)

echo 1. Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "SuShop Backend API" cmd /k "cd /d "%~dp0backend" && %PYTHON_CMD% -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo 2. Starting React Frontend on http://localhost:5173 ...
start "SuShop React Frontend" cmd /k "cd /d "%~dp0frontend" && %NPM_CMD% run dev"

echo.
echo Both servers are launching:
echo   - Storefront & Admin: http://localhost:5173
echo   - Backend API Docs:   http://127.0.0.1:8000/docs
echo.
pause
