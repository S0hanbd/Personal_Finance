@echo off
title Personal Finance - Stop Servers

echo ======================================================================
echo          Stopping Personal Finance Development Servers...
echo ======================================================================
echo.

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo Servers on port 8000 (Backend) and port 5173 (Frontend) have been stopped.
echo.
timeout /t 3 >nul
