@echo off
title BARTH - Stop Services
cd /d "%~dp0"

echo.
echo Stopping BARTH backend and database...
docker compose down
echo Done.
echo.
pause
