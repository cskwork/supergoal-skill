#!/usr/bin/env sh
# Launch the Supergoal Board in a browser - idempotent, fire-and-forget.
#
# The PARENT call returns immediately (never blocks a supergoal run): it enables emission, then
# detaches a child. The child serves, waits for the port INSIDE itself, and opens the browser.
# Re-running is safe: if a live server is already up (pidfile pid alive), it just re-opens the URL.
#
#   bash tui/launch.sh &          # opt-in overlay; returns at once
#   SUPERGOAL_TUI_NO_OPEN=1 ...    # serve but do not open a browser
#
# Env: SUPERGOAL_TUI_PORT (8000), SUPERGOAL_TUI_HOST (127.0.0.1), SUPERGOAL_RUN_DIR.

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SK_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REGDIR="${SUPERGOAL_RUN_DIR:-$HOME/.supergoal/runs}"
HOST="${SUPERGOAL_TUI_HOST:-127.0.0.1}"
PORT="${SUPERGOAL_TUI_PORT:-8000}"
URL="http://$HOST:$PORT"
PIDFILE="$REGDIR/.tui.pid"
LOG="$REGDIR/.tui.log"
PYTHON="${SUPERGOAL_TUI_PYTHON:-python3}"

port_up()  { command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; }
running()  { [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE" 2>/dev/null)" 2>/dev/null; }
open_url() {
  [ "${SUPERGOAL_TUI_NO_OPEN:-0}" = "1" ] && return 0
  if command -v open >/dev/null 2>&1; then open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"
  elif command -v wslview >/dev/null 2>&1; then wslview "$URL"
  fi 2>/dev/null
}

# ---- detached child: serve + wait-for-port + open --------------------------------------------
if [ "${1:-}" = "__child" ]; then
  cd "$SK_ROOT" || exit 0
  "$PYTHON" -m tui.serve >"$LOG" 2>&1 &
  serve_pid=$!
  echo "$serve_pid" > "$PIDFILE"
  i=0
  while [ "$i" -lt 30 ]; do port_up && break; sleep 0.2; i=$((i + 1)); done
  open_url
  wait "$serve_pid" 2>/dev/null
  rm -f "$PIDFILE" 2>/dev/null
  exit 0
fi

# ---- parent: enable emission, idempotent spawn, return at once --------------------------------
mkdir -p "$REGDIR" 2>/dev/null || { echo "launch: cannot create $REGDIR" >&2; exit 0; }
: > "$REGDIR/.enabled"            # turns sg-emit on for this machine

if running; then
  open_url
  echo "Supergoal Board already running at $URL"
  exit 0
fi

nohup "$0" __child >/dev/null 2>&1 &
echo "Supergoal Board starting at $URL  (logs: $LOG)"
exit 0
