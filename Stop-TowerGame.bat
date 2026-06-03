@echo off
setlocal EnableDelayedExpansion
set PORT=8766

echo Stopping Tower Game server on port %PORT%...
echo.

set PID_FOUND=
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    set PID_FOUND=%%a
)

if "!PID_FOUND!"=="" (
    echo No Tower Game server found running on port %PORT%.
) else (
    echo Stopping PID !PID_FOUND!...
    taskkill /PID !PID_FOUND! /F >nul 2>&1
    echo Stopped.
)

echo.
pause
