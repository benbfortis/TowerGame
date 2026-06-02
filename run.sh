#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PORT="${PORT:-8765}"
echo "TowerGame: http://localhost:${PORT}/"
exec python3 -m http.server "$PORT"
