#!/usr/bin/env bash
# Local production server — one URL serves UI + API (good for same Wi‑Fi devices).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
PORT="${PORT:-8000}"

echo "==> Building frontend..."
cd frontend-main
[ -d node_modules ] || npm install
VITE_API_URL= npm run build
cd "$ROOT"

echo "==> Starting on http://0.0.0.0:${PORT}"
cd backend
[ -d .venv ] || python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -q

echo ""
echo "  On this Mac:     http://localhost:${PORT}"
echo "  Other devices:  http://$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}'):${PORT}"
echo "  (Same Wi‑Fi required. Stop ./run.sh first if port ${PORT} is busy.)"
echo ""

exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
