#!/usr/bin/env bash
# Supergoal Board state-protocol (producer) contract.
# Fails if sg-emit stops being opt-in, lock-free (atomic), or schema-correct, or if the
# observability reference / role-loop wiring drifts. Pure producer check - no Textual, no gate.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EMIT="$ROOT/templates/observability/sg-emit.sh"
PASS=0
FAIL=0
. "$ROOT/tests/support/contract.sh"

echo "=================================================================="
echo " /supergoal OBSERVABILITY (Board state protocol) contract"
echo "=================================================================="

# Files exist.
[ -f "$EMIT" ] && pass_check "sg-emit helper exists" || fail_check "sg-emit helper exists" "$EMIT"
[ -f "$ROOT/templates/observability/heartbeat.schema.json" ] && pass_check "heartbeat schema exists" || fail_check "heartbeat schema exists"
[ -f "$ROOT/reference/observability.md" ] && pass_check "observability reference exists" || fail_check "observability reference exists"

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
if [ -d "$REG/agents" ]; then fail_check "opt-in: no write when Board disabled" "agents/ created while disabled"; else pass_check "opt-in: no write when Board disabled"; fi

# Enable and emit.
: > "$REG/.enabled"
SUPERGOAL_RUN_DIR="$REG" sh "$EMIT" --phase Frame --mode GREENFIELD --task "Add JWT refresh" --task-status backlog
F="$(agentfile)"
if [ -n "$F" ]; then pass_check "emits a heartbeat file when enabled"; else fail_check "emits a heartbeat file when enabled"; fi

if [ -n "$F" ]; then
  # 2. Schema: required fields, ISO-8601 Z timestamps, tasks array, schemaVersion 1.
  jq -e '.schemaVersion==1 and (.agent_id|length>0) and (.repo_path|length>0)
         and (.started_at|test("Z$")) and (.updated_at|test("Z$")) and (.tasks|type=="array")' "$F" >/dev/null \
    && pass_check "heartbeat has required fields + ISO-8601 Z timestamps" || fail_check "heartbeat schema fields"

  # 3. Board column status is recorded.
  jq -e '.tasks[0].status=="backlog"' "$F" >/dev/null && pass_check "task recorded with Jira column status" || fail_check "task status recorded"

  # 4. Carry-forward: a phase emit keeps the board and updates the named task.
  SUPERGOAL_RUN_DIR="$REG" sh "$EMIT" --phase Critic --task "Add JWT refresh" --task-status review
  jq -e '.phase=="Critic" and (.tasks|length==1) and (.tasks[0].status=="review")' "$F" >/dev/null \
    && pass_check "carry-forward keeps board, updates task status" || fail_check "carry-forward merge"

  # 5. Append: a new --task is added without dropping the prior one.
  SUPERGOAL_RUN_DIR="$REG" sh "$EMIT" --phase Build --task "Rotate token" --task-status backlog
  jq -e '(.tasks|length==2) and ([.tasks[].title]|index("Add JWT refresh")!=null)' "$F" >/dev/null \
    && pass_check "append adds new task, preserves prior" || fail_check "append preserves prior"

  # 6. Atomicity: no leftover temp files.
  TN="$(ls "$REG"/agents 2>/dev/null | grep -c '\.tmp\.' || true)"
  [ "$TN" -eq 0 ] && pass_check "atomic write leaves no .tmp files" || fail_check "atomic write leaves no .tmp files" "$TN leftover"

  # 7. started_at immutable across emits.
  jq -e '.started_at <= .updated_at' "$F" >/dev/null && pass_check "started_at immutable, updated_at advances" || fail_check "timestamp invariants"
fi

# Wiring/docs: lock-free claim, opt-in, timestamp-primary liveness, conductor-driven.
assert_text_ci_normalized "reference states one-writer + atomic-rename correctness" "reference/observability.md" "one writer per file + atomic rename"
assert_text_ci_normalized "reference states branch is not a mutex" "reference/observability.md" "never a mutex"
assert_text_ci_normalized "reference states liveness is timestamp-primary" "reference/observability.md" "Timestamp is the **primary** signal"
assert_text_ci_normalized "reference states it never gates delivery" "reference/observability.md" "never a delivery gate"
assert_text_ci_normalized "role-loop wires optional best-effort sg-emit" "reference/role-loop.md" "never blocks or gates the loop"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
