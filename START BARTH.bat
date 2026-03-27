@echo off
title BARTH Financial Dashboard
cd /d "%~dp0"

echo.
echo === BARTH FINANCIAL DASHBOARD ===
echo.

docker info > nul 2>&1
if %errorlevel% neq 0 (
  echo Docker is not running. Please open Docker Desktop first.
  pause
  exit /b 1
)

echo [1/4] Starting database and backend...
docker compose up -d
echo.

echo [2/4] Waiting for backend...
:wait_loop
curl -s http://localhost:8000/docs > nul 2>&1
if %errorlevel% equ 0 goto backend_ready
timeout /t 2 /nobreak > nul
goto wait_loop
:backend_ready
echo Backend ready at http://localhost:8000
echo.

echo [3/4] Running migrations...
docker compose exec backend alembic upgrade head
echo Migrations done.
echo.

if not exist "frontend\node_modules" (
  echo Installing frontend dependencies...
  cd frontend
  call npm install
  cd ..
)

echo [4/4] Opening browser...
timeout /t 2 /nobreak > nul
start http://localhost:5173

echo.
echo App is running!
echo Frontend - http://localhost:5173
echo Backend  - http://localhost:8000
echo Press Ctrl+C to stop the frontend.
echo.

cd frontend
npm run dev
