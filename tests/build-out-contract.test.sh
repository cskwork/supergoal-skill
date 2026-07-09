#!/usr/bin/env bash
# /supergoal GREENFIELD build-out contract.
# Fails if the full-app auto-continue route (walking-skeleton ticket 0, conductor loop,
# Smoke ledger, per-ticket run vaults) drifts out of the router or reference files.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

require_file() {
  local label="$1" file="$2"
  if [ -f "$ROOT/$file" ]; then
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"; printf '        missing file: %s\n' "$file"
  fi
}

require_text() {
  local label="$1" file="$2" text="$3"
  local normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"; printf '        missing in %s: %s\n' "$file" "$text"
  fi
}

echo "=================================================================="
echo " /supergoal GREENFIELD build-out contract   skill: $ROOT"
echo "=================================================================="

require_file "build-out reference exists" "reference/build-out.md"

# Router exposes the route.
require_text "SKILL routes build-out" "SKILL.md" "reference/build-out.md"
require_text "SKILL greenfield row auto-continues" "SKILL.md" "full-app builds auto-continue ticket-by-ticket"
require_text "SKILL done includes assembled-app boot" "SKILL.md" "assembled app booting and the Smoke ledger green"

# Auto-continue authorization and one-ticket-per-context preservation.
require_text "build request authorizes progression" "reference/build-out.md" 'do not ask "continue?" between tickets'
require_text "no implementation context crosses tickets" "reference/build-out.md" "no implementation context crosses tickets"
require_text "map is the control object" "reference/build-out.md" "re-read the map"

# Walking skeleton ticket 0.
require_text "ticket 0 fires on empty repo only" "reference/build-out.md" "no manifest/lockfile"
require_text "scaffold uses official generator" "reference/build-out.md" "official CLI generator"
require_text "stack question stays in interview budget" "reference/build-out.md" "ONE stack question with a recommended default"

# Smoke ledger.
require_text "map contract has smoke ledger" "reference/wayfinder.md" "Smoke ledger"
require_text "ledger lines are boot plus proof" "reference/build-out.md" "boot command + proof"
require_text "never weaken checks" "reference/build-out.md" "Never remove or weaken a ticket acceptance check or Smoke-ledger line"
require_text "red ledger blocks next frontier" "reference/build-out.md" "do not select the next frontier while the ledger is red"
require_text "smoke evidence must be fresh" "reference/build-out.md" "produced after the last edit"
require_text "leftover runtime state blocks close" "reference/build-out.md" "leftover runtime state blocks the ticket close"
require_text "conventions recorded at ticket close" "reference/build-out.md" "so later tickets do not re-derive it"

# Vault layout and per-ticket gates.
require_text "per-ticket run vaults" "reference/build-out.md" "runs/<NNN-slug>/"
require_text "per-ticket auto-approved plan" "reference/build-out.md" "build-out: app plan approved at map freeze"
require_text "role-loop names build-out path" "reference/role-loop.md" "reference/build-out.md"
require_text "delivery gate checks assembled boot" "reference/delivery-gate.md" "the assembled app boots from the integration branch"

# Stop conditions and consent boundary.
require_text "two strikes stops the loop" "reference/build-out.md" "two strikes, ask"
require_text "external push needs consent" "reference/build-out.md" "pushing or publishing anywhere external still needs explicit consent"
require_text "commit gate scopes merge consent" "reference/delivery-gate.md" "map-freeze approval covers per-ticket merges"

# Design shell and wayfinder branch.
require_text "ui-ux records design shell" "reference/ui-ux.md" "Design shell"
require_text "wayfinder build-out continues without asking" "reference/wayfinder.md" "continues without asking"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
