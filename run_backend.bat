@echo off
setlocal
cd /d "%~dp0backend"
title SuShop - Backend Server

set PYTHON_CMD=python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    where py >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set PYTHON_CMD=py
    ) else (
        if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
            set PYTHON_CMD="%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
        )
    )
)

echo Starting SuShop FastAPI Backend on http://127.0.0.1:8000 ...
%PYTHON_CMD% -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
