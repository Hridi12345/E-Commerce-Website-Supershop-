@echo off
setlocal
cd /d "%~dp0frontend"
title SuShop - React Frontend Dev Server

set NPM_CMD=npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files\nodejs\npm.cmd" (
        set NPM_CMD="C:\Program Files\nodejs\npm.cmd"
    )
)

echo Starting SuShop React Frontend on http://localhost:5173 ...
%NPM_CMD% run dev
pause
