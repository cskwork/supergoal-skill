#!/usr/bin/env bash
# /supergoal WAYFINDER + PROTOTYPE contract.
# Fails if the ticket-frontier route or throwaway prototype route drifts out of
# the router, reference map, README, or landing page.

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

reject_text() {
  local label="$1" file="$2" text="$3"
  local normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"; printf '        forbidden in %s: %s\n' "$file" "$text"
  else
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$label"
  fi
}

echo "=================================================================="
echo " /supergoal WAYFINDER + PROTOTYPE contract   skill: $ROOT"
echo "=================================================================="

require_file "wayfinder reference exists" "reference/wayfinder.md"
require_file "prototype reference exists" "reference/prototype.md"

# Router and public docs expose both modes.
require_text "SKILL routes WAYFINDER" "SKILL.md" "WAYFINDER"
require_text "SKILL points to wayfinder reference" "SKILL.md" "reference/wayfinder.md"
require_text "SKILL routes PROTOTYPE" "SKILL.md" "PROTOTYPE"
require_text "SKILL points to prototype reference" "SKILL.md" "reference/prototype.md"
require_text "README documents WAYFINDER" "README.md" "WAYFINDER"
require_text "README documents PROTOTYPE" "README.md" "PROTOTYPE"
require_text "README.ko documents WAYFINDER" "README.ko.md" "WAYFINDER"
require_text "README.ko documents PROTOTYPE" "README.ko.md" "PROTOTYPE"
require_text "landing counts twelve modes" "docs/index.html" "Twelve modes"
require_text "landing has wayfinder card" "docs/index.html" "WAYFINDER"
require_text "landing has prototype card" "docs/index.html" "PROTOTYPE"

# WAYFINDER preserves the upstream ticket-frontier idea without making it product delivery.
require_text "wayfinder is not product delivery" "reference/wayfinder.md" "writes no product code by default"
require_text "wayfinder supports issue tracker" "reference/wayfinder.md" "native tracker"
require_text "greenfield keeps broad builds in greenfield" "SKILL.md" 'broad/foggy builds first use a `wayfinder/` Frontier Map inside the run vault'
require_text "greenfield frame uses internal scope gate" "SKILL.md" 'GREENFIELD broad/foggy build requests use `reference/wayfinder.md` as an internal scope gate'
require_text "role-loop defines greenfield scope gate" "reference/role-loop.md" "GREENFIELD scope gate"
require_text "role-loop keeps broad greenfield mode" "reference/role-loop.md" 'keep the mode `GREENFIELD`'
require_text "role-loop carries only frontier checks" "reference/role-loop.md" 'carry only that ticket'\''s acceptance checks into `GOAL.md` / `PLAN.md`'
require_text "wayfinder defines greenfield scope gate" "reference/wayfinder.md" "## GREENFIELD scope gate"
require_text "wayfinder keeps user-facing route greenfield" "reference/wayfinder.md" 'keep the top-level mode `GREENFIELD`'
require_text "wayfinder copies only selected ticket checks" "reference/wayfinder.md" 'copy only that ticket'\''s acceptance checks into the delivery `GOAL.md` / `PLAN.md`'
require_text "README explains broad greenfield frontier map" "README.md" "Broad new-app builds stay GREENFIELD"
require_text "README.ko explains broad greenfield frontier map" "README.ko.md" "넓은 새 앱 build는 GREENFIELD에 남기되"
require_text "landing explains broad greenfield frontier map" "docs/index.html" "broad GREENFIELD builds first use an internal wayfinder map"
require_text "wayfinder nests local markdown under run vault" "reference/wayfinder.md" 'current run vault'\''s `wayfinder/` subfolder'
require_text "wayfinder names canonical vault path" "reference/wayfinder.md" "docs/changelog/<YYYY-MM>/<DD-topic>/wayfinder/"
reject_text "wayfinder rejects old standalone docs path" "reference/wayfinder.md" "docs/wayfinder/<slug>"
require_text "wayfinder map has destination" "reference/wayfinder.md" "Destination"
require_text "wayfinder records blocker edges" "reference/wayfinder.md" "Blocked by:"
require_text "wayfinder names frontier" "reference/wayfinder.md" "Frontier"
require_text "wayfinder requires vertical tickets" "reference/wayfinder.md" "vertical slice"
require_text "wayfinder tickets are goal detail slices" "reference/wayfinder.md" '`GOAL.md` detail slice'
require_text "wayfinder tickets name routes" "reference/wayfinder.md" "Route: GREENFIELD|DEBUG|LEGACY|QA-ONLY|REVIEW-ONLY|PROTOTYPE"
require_text "wayfinder owns spec-depth requests" "SKILL.md" "spec / requirements first / break down"
require_text "wayfinder forbids parallel docs spec workflow" "reference/wayfinder.md" 'do not create a parallel `docs/spec/<feature-slug>/` workflow'
require_text "wayfinder keeps glossary depth" "reference/wayfinder.md" "Glossary"
require_text "wayfinder keeps user story depth" "reference/wayfinder.md" "As a [role], I want [feature], so that [benefit]"
require_text "wayfinder keeps EARS depth" "reference/wayfinder.md" "WHEN [event] THEN [system] SHALL [response]"
require_text "wayfinder keeps edge cases" "reference/wayfinder.md" "Edge cases"
require_text "wayfinder keeps decision records" "reference/wayfinder.md" "Decision records"
require_text "wayfinder grills load-bearing decisions" "reference/wayfinder.md" "Grill load-bearing decisions one question at a time"
require_text "wayfinder explores code instead of asking" "reference/wayfinder.md" "inspect the code instead of asking"
require_text "wayfinder depth never replaces ground truth" "reference/wayfinder.md" "never replace ground truth"
require_text "wayfinder works one ticket per session" "reference/wayfinder.md" "one frontier ticket per session"
require_text "wayfinder carries frontier criteria to goal" "reference/wayfinder.md" 'carry only that ticket'\''s acceptance checks into `GOAL.md`'
require_text "wayfinder stops after one ticket" "reference/wayfinder.md" "do not start a second ticket in the same context"
require_text "wayfinder asks for context clear" "reference/wayfinder.md" "clear context before the next ticket"
require_text "wayfinder asks for integration test" "reference/wayfinder.md" "integration test / end-to-end check"

# PROTOTYPE keeps the prototype answer separate from delivery proof.
require_text "prototype is throwaway" "reference/prototype.md" "throwaway proof"
require_text "prototype asks one question" "reference/prototype.md" "answers one question"
require_text "prototype records decision signal" "reference/prototype.md" "Decision signal"
require_text "prototype requires one command or URL" "reference/prototype.md" "one command or one URL"
require_text "prototype forbids production mutations" "reference/prototype.md" "No production migrations"
require_text "prototype has logic path" "reference/prototype.md" "Logic/state prototype"
require_text "prototype has UI variant path" "reference/prototype.md" "three structurally different variants"
require_text "prototype has data API path" "reference/prototype.md" "Data/API prototype"
require_text "prototype captures the answer" "reference/prototype.md" "answer to the question"
require_text "prototype must delete or quarantine" "reference/prototype.md" "Delete or quarantine"
require_text "prototype cannot satisfy delivery done" "reference/prototype.md" 'PROTOTYPE cannot satisfy delivery `Done`'

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
