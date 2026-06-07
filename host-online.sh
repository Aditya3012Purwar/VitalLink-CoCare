#!/usr/bin/env bash
# Build and expose the app via ngrok (public URL for any device).
# Fast restart (skips rebuild when dist + venv exist):
#   ./host-online.sh --quick
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

PORT="${PORT:-8000}"
NGROK_LOG="/tmp/pads-ngrok.log"
SERVER_PID=""
NGROK_PID=""
QUICK=0

for arg in "$@"; do
  case "$arg" in
    --quick|-q) QUICK=1 ;;
  esac
done

load_ngrok_token() {
  if [ -n "${NGROK_AUTHTOKEN:-}" ]; then
    NGROK_AUTHTOKEN="$(printf '%s' "$NGROK_AUTHTOKEN" | tr -d '\r')"
    export NGROK_AUTHTOKEN
    return 0
  fi
  if [ -f backend/.env ]; then
    local token
    token="$(grep -E '^NGROK_AUTHTOKEN=' backend/.env 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d '\r' || true)"
    if [ -n "$token" ]; then
      export NGROK_AUTHTOKEN="$token"
      return 0
    fi
  fi
  return 1
}

ensure_ngrok() {
  if command -v ngrok >/dev/null 2>&1; then
    return 0
  fi
  if command -v brew >/dev/null 2>&1; then
    echo "==> Installing ngrok via Homebrew..."
    brew install ngrok/ngrok/ngrok
    return 0
  fi
  echo "ERROR: ngrok not found. Install it:"
  echo "  brew install ngrok/ngrok/ngrok"
  echo "  or download from https://ngrok.com/download"
  exit 1
}

stop_old_servers() {
  pkill -f "uvicorn main:app" 2>/dev/null || true
  pkill -f "ngrok http" 2>/dev/null || true
  sleep 1
  if lsof -ti:"$PORT" >/dev/null 2>&1; then
    lsof -ti:"$PORT" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

get_ngrok_url() {
  curl -sf "http://127.0.0.1:4040/api/tunnels" 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for t in data.get('tunnels', []):
        url = t.get('public_url', '')
        if url.startswith('https://'):
            print(url)
            break
except Exception:
    pass
" 2>/dev/null || true
}

cleanup() {
  [ -n "$NGROK_PID" ] && kill "$NGROK_PID" 2>/dev/null || true
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true
  exit 0
}
trap cleanup EXIT INT TERM

stop_old_servers
ensure_ngrok

if ! load_ngrok_token; then
  echo ""
  echo "ERROR: NGROK_AUTHTOKEN is not set."
  echo ""
  echo "1. Sign up free at https://ngrok.com"
  echo "2. Copy your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "3. Add to backend/.env:"
  echo "     NGROK_AUTHTOKEN=your_token_here"
  echo "   Or run once:"
  echo "     ngrok config add-authtoken YOUR_TOKEN"
  echo ""
  exit 1
fi

ngrok config add-authtoken "$NGROK_AUTHTOKEN" >/dev/null 2>&1 || true

if [ "$QUICK" = 1 ] && [ -f frontend-main/dist/index.html ]; then
  echo "==> Quick mode: skipping frontend build (dist already exists)."
else
  echo "==> Building frontend..."
  cd frontend-main
  [ -d node_modules ] || npm install
  VITE_API_URL= npm run build
  cd "$ROOT"
fi

if [ ! -f frontend-main/dist/index.html ]; then
  echo "ERROR: frontend build failed."
  exit 1
fi

echo "==> Starting server on port $PORT..."
cd backend
[ -d .venv ] || python3 -m venv .venv
source .venv/bin/activate
if [ "$QUICK" = 1 ] && command -v uvicorn >/dev/null 2>&1; then
  echo "==> Quick mode: skipping pip install."
else
  pip install -r requirements.txt -q
fi
uvicorn main:app --host 0.0.0.0 --port "$PORT" &
SERVER_PID=$!
cd "$ROOT"

for _ in $(seq 1 20); do
  curl -sf "http://127.0.0.1:${PORT}/api/health" >/dev/null && break
  sleep 0.25
done

if ! curl -sf "http://127.0.0.1:${PORT}/api/health" >/dev/null; then
  echo "ERROR: Server not responding on port $PORT"
  exit 1
fi

echo "  Local: http://localhost:${PORT}"
echo "==> Starting ngrok tunnel..."

rm -f "$NGROK_LOG"
ngrok http "$PORT" --log=stdout >"$NGROK_LOG" 2>&1 &
NGROK_PID=$!

PUBLIC_URL=""
for i in $(seq 1 25); do
  PUBLIC_URL="$(get_ngrok_url)"
  [ -n "$PUBLIC_URL" ] && break
  if [ "$i" -eq 1 ] || [ $((i % 5)) -eq 0 ]; then
    echo "  Waiting for ngrok URL..."
  fi
  sleep 0.5
done

if [ -z "$PUBLIC_URL" ]; then
  echo ""
  echo "ERROR: ngrok did not return a public URL."
  echo "Check log: $NGROK_LOG"
  tail -30 "$NGROK_LOG" 2>/dev/null || true
  echo ""
  echo "Server still running at http://localhost:${PORT}"
  wait "$SERVER_PID"
  exit 1
fi

echo ""
echo "  Public URL: $PUBLIC_URL"
echo "  ngrok dashboard: http://127.0.0.1:4040"
echo "  Share the public URL — works on phone, tablet, other computers."
echo "  Press Ctrl+C to stop."
echo ""

wait "$NGROK_PID" "$SERVER_PID" 2>/dev/null || wait "$SERVER_PID"
