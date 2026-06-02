#!/usr/bin/env bash
# Double-click to stop any running Tower Game server.
PORT="${PORT:-8766}"
PIDS="$(lsof -ti :"$PORT" 2>/dev/null || true)"
if [ -z "$PIDS" ]; then
  echo "No Tower Game server running on port $PORT."
else
  echo "Stopping Tower Game server (PID: $PIDS)"
  echo "$PIDS" | xargs kill 2>/dev/null || true
  echo "Stopped."
fi
read -r -p "Press return to close…"
