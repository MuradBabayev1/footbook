#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"
BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
USE_EXISTING_BACKEND="${USE_EXISTING_BACKEND:-0}"

port_in_use() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not installed. Install Node.js first."
  exit 1
fi

if port_in_use "$BACKEND_PORT" && [[ "$USE_EXISTING_BACKEND" != "1" ]]; then
  echo "Port $BACKEND_PORT is already in use."
  echo "Stop the process on $BACKEND_PORT, or rerun with USE_EXISTING_BACKEND=1."
  echo "Tip: lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN"
  exit 1
fi

if port_in_use "$FRONTEND_PORT"; then
  echo "Port $FRONTEND_PORT is already in use."
  echo "Stop the process on $FRONTEND_PORT, then run this script again."
  echo "Tip: lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN"
  exit 1
fi

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Stopping backend (PID $BACKEND_PID)..."
    kill "$BACKEND_PID" || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if port_in_use "$BACKEND_PORT" && [[ "$USE_EXISTING_BACKEND" == "1" ]]; then
  echo "Using existing backend on port $BACKEND_PORT."
else
  echo "Starting Spring Boot backend..."
  SERVER_PORT="$BACKEND_PORT" ./mvnw spring-boot:run &
  BACKEND_PID=$!
fi

echo "Starting React frontend..."
cd "$ROOT_DIR/frontend-react"
export PORT="$FRONTEND_PORT"
npm start
