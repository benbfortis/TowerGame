@echo off
setlocal EnableDelayedExpansion
set PORT=8766
set URL=http://localhost:%PORT%/
cd /d "%~dp0"

echo Tower Game launcher
echo -------------------

:: If something is already listening on the port, just open the browser.
netstat -ano 2>nul | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo Tower Game already running -- opening browser...
    start "" "%URL%"
    echo.
    echo Close this window when you are done playing.
    pause
    exit /b 0
)

echo Serving:  %URL%
echo Quit:     close this window (or Ctrl-C)
echo.

:: Detect Python — prefer python3, fall back to python.
set PYTHON=
for %%P in (python3 python) do (
    if "!PYTHON!"=="" (
        where %%P >nul 2>&1 && set PYTHON=%%P
    )
)
if "!PYTHON!"=="" (
    echo ERROR: Python not found.
    echo Install Python from https://www.python.org/ and make sure it is on your PATH.
    echo.
    pause
    exit /b 1
)

:: Open the browser ~1 s after the server starts.
start "" powershell -NoProfile -Command "Start-Sleep -Milliseconds 800; Start-Process '%URL%'"

:: Run the server in the foreground (close window or Ctrl-C to stop).
!PYTHON! -m http.server %PORT%
pause
