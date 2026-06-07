#!/usr/bin/env bash
# /supergoal domain-context contract.
# Fails if the skill stops keeping repo-local domain knowledge separate, ignored, and phase-scoped.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

require_text() {
  local label="$1" file="$2" text="$3"
  local normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    PASS=$((PASS + 1))
    printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf '  FAIL  %s\n' "$label"
    printf '        missing in %s: %s\n' "$file" "$text"
  fi
}

require_file() {
  local label="$1" file="$2"
  if [ -f "$ROOT/$file" ]; then
    PASS=$((PASS + 1))
    printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf '  FAIL  %s\n' "$label"
    printf '        missing file: %s\n' "$file"
  fi
}

echo "=================================================================="
echo " /supergoal domain-context contract   skill: $ROOT"
echo "=================================================================="

require_file "reference module exists" "reference/domain-context.md"
require_file "config template exists" "templates/domain-agent/config.json"
require_file "index template exists" "templates/domain-agent/index.md"
require_file "freshness template exists" "templates/domain-agent/freshness.md"
require_file "flow template directory is tracked" "templates/domain-agent/flows/README.md"
require_text "skill maps domain-context reference" "SKILL.md" "reference/domain-context.md"
require_text "reference defaults to repo-local path" "reference/domain-context.md" 'stored by default in `.domain-agent/`'
require_text "reference requires first-run storage prompt" "reference/domain-context.md" "or use another path?"
require_text "reference requires gitignore protection" "reference/domain-context.md" 'Add the chosen path to the repo root `.gitignore`'
require_text "plan grounding consumes Domain Brief" "reference/plan-grounding.md" 'Read the run `README.md` `## Domain Brief` first'
require_text "plan grounding walks design tree" "reference/plan-grounding.md" "Build the decision tree"
require_text "plan grounding challenges terms" "reference/plan-grounding.md" "Challenge terminology"
require_text "domain context keeps code authoritative" "reference/domain-context.md" "Current docs/code always win"
require_text "domain context separates vault" "reference/domain-context.md" "separate from the run vault"
require_text "domain context names non-vault knowledge" "reference/domain-context.md" "local reusable domain facts"
require_text "domain context blocks committing local pack" "reference/domain-context.md" 'Do not commit `.domain-agent/`'
require_text "domain context caps selected files" "reference/domain-context.md" "Select at most five domain files"
require_text "domain context caps brief size" "reference/domain-context.md" "Keep the Domain Brief under 80 lines"
require_text "domain context rejects transcripts" "reference/domain-context.md" "Raw investigation transcripts"
require_text "domain context has term capture rules" "reference/domain-context.md" "Terminology updates"
require_text "domain context has decision capture rules" "reference/domain-context.md" "hard to reverse, surprising without context"
require_text "domain context has light refresh threshold" "reference/domain-context.md" "Light refresh threshold: 5 days"
require_text "domain context has full review threshold" "reference/domain-context.md" "Full review threshold: 30 days"
require_text "index is router only" "templates/domain-agent/index.md" "Use this file as the router"
require_text "glossary template has avoid field" "templates/domain-agent/glossary.md" "Avoid:"
require_text "flow template has scenario checks" "templates/domain-agent/flows/README.md" "Scenario Checks"
require_text "decisions template has durable-decision gate" "templates/domain-agent/decisions/README.md" "Hard to reverse"
require_text "template config carries refresh policy" "templates/domain-agent/config.json" "staleAfterDays"
# Domain Brief actually reaches the dispatched agents (not just the conductor).
require_text "explorer consumes the Domain Brief" "agents/explore.md" "use its terms/entry points/flows to route"
require_text "debugger consumes the Domain Brief" "agents/debugger.md" "saved invariants/flows/terms in the Domain Brief"
require_text "architect consumes the Domain Brief" "agents/architect.md" "Treat the Domain Brief as a routing index"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
