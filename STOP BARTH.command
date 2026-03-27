#!/bin/bash
# ─────────────────────────────────────────────
#  BARTH — Stop all services
# ─────────────────────────────────────────────

cd "$(dirname "$0")"

echo ""
echo "▶  Stopping BARTH backend & database..."
docker compose down
echo "✅  All services stopped."
echo ""
read -p "Press Enter to close..."
