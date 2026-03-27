#!/bin/bash
# ─────────────────────────────────────────────
#  BARTH — One-click startup
#  Double-click this file in Finder to launch
# ─────────────────────────────────────────────

# Move to the folder where this script lives
cd "$(dirname "$0")"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        BARTH FINANCIAL DASHBOARD     ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 1. Check Docker is running ──────────────
if ! docker info > /dev/null 2>&1; then
  echo "⚠️  Docker is not running."
  echo "   Please open Docker Desktop first, then run this file again."
  echo ""
  read -p "Press Enter to close..."
  exit 1
fi

# ── 2. Start PostgreSQL + Backend via Docker Compose ──
echo "▶  Starting database & backend..."
docker compose up -d --build

# Wait until backend is responding
echo "⏳  Waiting for backend to be ready..."
for i in $(seq 1 30); do
  if curl -s http://localhost:8000/health > /dev/null 2>&1 || \
     curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo "✅  Backend ready at http://localhost:8000"
    break
  fi
  sleep 2
  if [ $i -eq 30 ]; then
    echo "⚠️  Backend is taking longer than expected — continuing anyway..."
  fi
done

# ── 3. Run migrations ────────────────────────
echo ""
echo "▶  Running database migrations..."
docker compose exec backend alembic upgrade head
echo "✅  Migrations done"

# ── 4. Check Node / npm ──────────────────────
if ! command -v npm &> /dev/null; then
  echo ""
  echo "⚠️  npm not found. Please install Node.js from https://nodejs.org"
  read -p "Press Enter to close..."
  exit 1
fi

# ── 5. Install frontend deps if needed ──────
if [ ! -d "frontend/node_modules" ]; then
  echo ""
  echo "▶  Installing frontend dependencies (first run)..."
  cd frontend && npm install && cd ..
fi

# ── 6. Open browser ─────────────────────────
echo ""
echo "▶  Opening browser..."
sleep 2
open http://localhost:5173 2>/dev/null || true

# ── 7. Start frontend dev server ────────────
echo ""
echo "▶  Starting frontend at http://localhost:5173"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  App is running!"
echo "  Frontend → http://localhost:5173"
echo "  Backend  → http://localhost:8000"
echo "  Press Ctrl+C to stop the frontend"
echo "  (run 'docker compose down' to stop backend)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd frontend && npm run dev
