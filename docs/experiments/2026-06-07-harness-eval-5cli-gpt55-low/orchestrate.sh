#!/usr/bin/env bash
# Force hermes reasoning_effort=low for the duration of the run (codex/omp take the
# effort from CLI flags; only hermes reads it from config.yaml). Restore on exit.
set -u
EXP="$(cd "$(dirname "$0")" && pwd)"
HCFG="$HOME/.hermes/config.yaml"
BAK="$(mktemp)"

restore() {
  if [ -f "$BAK" ]; then cp "$BAK" "$HCFG"; rm -f "$BAK"; echo "[orchestrate] restored hermes config"; fi
}
trap restore EXIT INT TERM

if [ -f "$HCFG" ]; then
  cp "$HCFG" "$BAK"
  # Unique match: the active agent-level effort (2-space indent). Grok's is 4-space/empty.
  sed -i '' 's/^  reasoning_effort: xhigh$/  reasoning_effort: low/' "$HCFG"
  echo "[orchestrate] hermes reasoning_effort now: $(grep -m1 '^  reasoning_effort:' "$HCFG")"
fi

cd "$EXP"
node run.mjs "$@"
status=$?
echo "[orchestrate] run.mjs exit=$status"
exit $status
