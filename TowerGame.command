#!/usr/bin/env bash
# Double-click this file in Finder to launch Tower Game.
# (macOS treats .command files as runnable scripts.)
set -e
cd "$(dirname "$0")"
PORT="${PORT:-8766}"
URL="http://localhost:$PORT/"

# If something's already on the port, reuse it (just open the browser).
if lsof -ti :"$PORT" >/dev/null 2>&1; then
  echo "Tower Game already running — opening browser…"
  open "$URL"
  echo
  echo "Close this window when you're done playing."
  echo "(The existing server keeps running.)"
  read -r -p "Press return to close this terminal window…"
  exit 0
fi

echo "Tower Game launcher"
echo "-------------------"
echo "Serving:  $URL"
echo "Quit:     close this terminal window (or Ctrl-C)"
echo

# Open browser after the server is up
(sleep 0.6 && open "$URL") &

# Foreground server so closing the window kills it cleanly
exec python3 -m http.server "$PORT"
