@echo off
setlocal EnableDelayedExpansion
title Personal Finance - Project Launcher

:: Navigate to project root directory
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo ======================================================================
echo                Personal Finance Management System
echo ======================================================================
echo.

:: 1. Validate Python Virtual Environment
set "PYTHON_REL="
if exist "%ROOT_DIR%backend\venv\Scripts\python.exe" (
    set "PYTHON_REL=venv\Scripts\python.exe"
) else if exist "%ROOT_DIR%.venv\Scripts\python.exe" (
    set "PYTHON_REL=..\.venv\Scripts\python.exe"
) else (
    where python >nul 2>nul
    if !errorlevel! equ 0 (
        set "PYTHON_REL=python"
    )
)

if "!PYTHON_REL!"=="" (
    echo [ERROR] Python environment was not found!
    echo Expected: backend\venv\Scripts\python.exe
    echo.
    echo Please make sure the backend virtual environment is set up.
    echo.
    pause
    exit /b 1
)

:: 2. Validate pnpm
set "PNPM_CMD="
where pnpm.cmd >nul 2>nul
if !errorlevel! equ 0 (
    set "PNPM_CMD=pnpm.cmd"
) else (
    where pnpm >nul 2>nul
    if !errorlevel! equ 0 (
        set "PNPM_CMD=pnpm"
    )
)

if "!PNPM_CMD!"=="" (
    echo [ERROR] pnpm is not found in your PATH!
    echo Please ensure pnpm is installed and added to PATH.
    echo.
    pause
    exit /b 1
)

:: 3. Run database migrations
echo [*] Step 1/3: Checking database migrations...
cd /d "%ROOT_DIR%backend"
!PYTHON_REL! manage.py migrate --noinput
if !errorlevel! neq 0 (
    echo [WARNING] Migration check encountered an issue. Continuing to launch...
)
cd /d "%ROOT_DIR%"
echo.

:: 4. Start Backend Server
echo [*] Step 2/3: Starting Django backend (http://127.0.0.1:8000)...
start "Personal Finance - Backend Server (Django)" /d "%ROOT_DIR%backend" cmd /k "!PYTHON_REL! manage.py runserver 127.0.0.1:8000"

:: 5. Start Frontend Dev Server
echo [*] Step 3/3: Starting Vite frontend (http://127.0.0.1:5173)...
start "Personal Finance - Frontend (Vite)" /d "%ROOT_DIR%frontend" cmd /k "!PNPM_CMD! run dev --host 127.0.0.1 --port 5173"

:: 6. Wait for servers to spin up, then open browser
echo.
echo [*] Initializing servers... opening frontend screen in browser window...
ping 127.0.0.1 -n 4 >nul 2>&1
start http://localhost:5173/

echo.
echo ======================================================================
echo   Application successfully started!
echo.
echo   - Frontend UI:  http://localhost:5173/  (Opened in browser)
echo   - Backend API:  http://127.0.0.1:8000/
echo.
echo   Keep the Backend and Frontend command prompt windows open.
echo   To stop the servers, close their command windows (or run stop.bat).
echo ======================================================================
echo.
echo Press any key to close this launcher window (servers remain running)...
pause >nul
