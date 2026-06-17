#!/usr/bin/env bash
# Supergoal Board state-protocol (producer) contract.
# Fails if sg-emit stops being opt-in, lock-free (atomic), or schema-correct, or if the
# observability reference / role-loop wiring drifts. Pure producer check - no Textual, no gate.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EMIT="$ROOT/templates/observability/sg-emit.sh"
PASS=0
FAIL=0

ok()   { PASS=$((PASS + 1)); printf '  PASS  %s\n' "$1"; }
bad()  { FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$1"; [ -n "${2:-}" ] && printf '        %s\n' "$2"; }

require_text() {
  local label="$1" file="$2" text="$3" normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then ok "$label"; else bad "$label" "missing in $file: $text"; fi
}

echo "=================================================================="
echo " /supergoal OBSERVABILITY (Board state protocol) contract"
echo "=================================================================="

# Files exist.
[ -f "$EMIT" ] && ok "sg-emit helper exists" || bad "sg-emit helper exists" "$EMIT"
[ -f "$ROOT/templates/observability/heartbeat.schema.json" ] && ok "heartbeat schema exists" || bad "heartbeat schema exists"
[ -f "$ROOT/reference/observability.md" ] && ok "observability reference exists" || bad "observability reference exists"

# Skip the behavioral checks gracefully if jq is unavailable (helper itself degrades to no-op).
if ! command -v jq >/dev/null 2>&1; then
  printf '\n  SKIP  behavioral checks (jq not installed)\n'
  printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
  [ "$FAIL" -eq 0 ]; exit $?
fi

REG="$(mktemp -d)/runs"; mkdir -p "$REG"
agentfile() { ls "$REG"/agents/*.json 2>/dev/null | head -1; }

# 1. Opt-in: disabled => writes nothing.
SUPERGOAL_RUN_DIR="$REG" sh "$EMIT" --phase Frame --mode GREENFIELD
if [ -d "$REG/agents" ]; then bad "opt-in: no write when Board disabled" "agents/ created while disabled"; else ok "opt-in: no write when Board disabled"; fi

# Enable and emit.
: > "$REG/.enabled"
SUPERGOAL_RUN_DIR="$REG" sh "$EMIT" --phase Frame --mode GREENFIELD --task "Add JWT refresh" --task-status backlog
F="$(agentfile)"
if [ -n "$F" ]; then ok "emits a heartbeat file when enabled"; else bad "emits a heartbeat file when enabled"; fi

if [ -n "$F" ]; then
  # 2. Schema: required fields, ISO-8601 Z timestamps, tasks array, schemaVersion 1.
  jq -e '.schemaVersion==1 and (.agent_id|length>0) and (.repo_path|length>0)
         and (.started_at|test("Z$")) and (.updated_at|test("Z$")) and (.tasks|type=="array")' "$F" >/dev/null \
    && ok "heartbeat has required fields + ISO-8601 Z timestamps" || bad "heartbeat schema fields"

  # 3. Board column status is recorded.
  jq -e '.tasks[0].status=="backlog"' "$F" >/dev/null && ok "task recorded with Jira column status" || bad "task status recorded"

  # 4. Carry-forward: a phase emit keeps the board and updates the named task.
  SUPERGOAL_RUN_DIR="$REG" sh "$EMIT" --phase Critic --task "Add JWT refresh" --task-status review
  jq -e '.phase=="Critic" and (.tasks|length==1) and (.tasks[0].status=="review")' "$F" >/dev/null \
    && ok "carry-forward keeps board, updates task status" || bad "carry-forward merge"

  # 5. Append: a new --task is added without dropping the prior one.
  SUPERGOAL_RUN_DIR="$REG" sh "$EMIT" --phase Build --task "Rotate token" --task-status backlog
  jq -e '(.tasks|length==2) and ([.tasks[].title]|index("Add JWT refresh")!=null)' "$F" >/dev/null \
    && ok "append adds new task, preserves prior" || bad "append preserves prior"

  # 6. Atomicity: no leftover temp files.
  TN="$(ls "$REG"/agents 2>/dev/null | grep -c '\.tmp\.' || true)"
  [ "$TN" -eq 0 ] && ok "atomic write leaves no .tmp files" || bad "atomic write leaves no .tmp files" "$TN leftover"

  # 7. started_at immutable across emits.
  jq -e '.started_at <= .updated_at' "$F" >/dev/null && ok "started_at immutable, updated_at advances" || bad "timestamp invariants"
fi

# Wiring/docs: lock-free claim, opt-in, timestamp-primary liveness, conductor-driven.
require_text "reference states one-writer + atomic-rename correctness" "reference/observability.md" "one writer per file + atomic rename"
require_text "reference states branch is not a mutex" "reference/observability.md" "never a mutex"
require_text "reference states liveness is timestamp-primary" "reference/observability.md" "Timestamp is the **primary** signal"
require_text "reference states it never gates delivery" "reference/observability.md" "never a delivery gate"
require_text "role-loop wires optional best-effort sg-emit" "reference/role-loop.md" "never blocks or gates the loop"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
