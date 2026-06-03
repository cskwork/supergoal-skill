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
require_text "skill defaults to repo-local path" "SKILL.md" 'default `.domain-agent/`'
require_text "skill requires first-run storage prompt" "SKILL.md" "ask where to store it"
require_text "skill requires gitignore protection" "SKILL.md" 'add the chosen path to `.gitignore`'
require_text "pipeline invokes on debug" "reference/pipeline.md" "DEBUG Reproduce/Diagnose"
require_text "pipeline invokes on legacy" "reference/pipeline.md" "LEGACY Explore"
require_text "plan grounding consumes Domain Brief" "reference/plan-grounding.md" 'Read the run `README.md` `## Domain Brief` first'
require_text "plan grounding walks design tree" "reference/plan-grounding.md" "Build the decision tree"
require_text "plan grounding challenges terms" "reference/plan-grounding.md" "Challenge terminology"
require_text "domain context keeps code authoritative" "reference/domain-context.md" "Current docs/code always win"
require_text "domain context separates vault" "reference/domain-context.md" "separate from the run vault"
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
require_text "vault names non-vault knowledge" "reference/vault.md" "Repo-local domain knowledge lives outside the vault"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
