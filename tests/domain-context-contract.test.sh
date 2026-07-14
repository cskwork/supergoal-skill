#!/usr/bin/env bash
# /supergoal domain-context contract.
# Fails if the skill stops keeping repo-local domain knowledge separate, ignored, and phase-scoped.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
. "$ROOT/tests/support/contract.sh"

echo "=================================================================="
echo " /supergoal domain-context contract   skill: $ROOT"
echo "=================================================================="

assert_file "reference module exists" "reference/domain-context.md"
assert_file "config template exists" "templates/domain-agent/config.json"
assert_file "index template exists" "templates/domain-agent/index.md"
assert_file "freshness template exists" "templates/domain-agent/freshness.md"
assert_file "flow template directory is tracked" "templates/domain-agent/flows/README.md"
assert_text_ci_normalized "skill maps domain-context reference" "SKILL.md" "reference/domain-context.md"
assert_text_ci_normalized "reference defaults to repo-local path" "reference/domain-context.md" 'stored by default in `.domain-agent/`'
assert_text_ci_normalized "reference requires first-run storage prompt" "reference/domain-context.md" "or use another path?"
assert_text_ci_normalized "reference requires gitignore protection" "reference/domain-context.md" 'Add the chosen path to the repo root `.gitignore`'
assert_text_ci_normalized "reference detects docs language" "reference/domain-context.md" "docs language (SKILL.md)"
assert_text_ci_normalized "plan grounding consumes Domain Brief" "reference/plan-grounding.md" 'Read the `## Domain Brief` recorded in `PLAN.md`'
assert_text_ci_normalized "plan grounding walks design tree" "reference/plan-grounding.md" "Build the decision tree"
assert_text_ci_normalized "plan grounding challenges terms" "reference/plan-grounding.md" "Challenge terminology"
assert_text_ci_normalized "domain context keeps code authoritative" "reference/domain-context.md" "Current docs/code always win"
assert_text_ci_normalized "domain context separates vault" "reference/domain-context.md" "separate from the run vault"
assert_text_ci_normalized "domain context names non-vault knowledge" "reference/domain-context.md" "local reusable domain facts"
assert_text_ci_normalized "domain context blocks committing local pack" "reference/domain-context.md" 'Do not commit `.domain-agent/`'
assert_text_ci_normalized "domain context caps selected files" "reference/domain-context.md" "Select at most five domain files"
assert_text_ci_normalized "domain context caps brief size" "reference/domain-context.md" "Keep the Domain Brief under 80 lines"
assert_text_ci_normalized "domain context rejects transcripts" "reference/domain-context.md" "Raw investigation transcripts"
assert_text_ci_normalized "domain context has term capture rules" "reference/domain-context.md" "Terminology updates"
assert_text_ci_normalized "domain context has decision capture rules" "reference/domain-context.md" "hard to reverse, surprising without context"
assert_text_ci_normalized "domain context has light refresh threshold" "reference/domain-context.md" "Light refresh threshold: 5 days"
assert_text_ci_normalized "domain context has full review threshold" "reference/domain-context.md" "Full review threshold: 30 days"
assert_text_ci_normalized "index is router only" "templates/domain-agent/index.md" "Use this file as the router"
assert_text_ci_normalized "glossary template has avoid field" "templates/domain-agent/glossary.md" "Avoid:"
assert_text_ci_normalized "flow template has scenario checks" "templates/domain-agent/flows/README.md" "Scenario Checks"
assert_text_ci_normalized "decisions template has durable-decision gate" "templates/domain-agent/decisions/README.md" "Hard to reverse"
assert_text_ci_normalized "template config carries refresh policy" "templates/domain-agent/config.json" "staleAfterDays"
# Domain Brief actually reaches the dispatched agents (not just the conductor).
assert_text_ci_normalized "explorer consumes the Domain Brief" "agents/explore.md" "use its terms/entry points/flows to route"
assert_text_ci_normalized "debugger consumes the Domain Brief" "agents/debugger.md" "saved invariants/flows/terms in the Domain Brief"
assert_text_ci_normalized "architect consumes the Domain Brief" "agents/architect.md" "Treat the Domain Brief as a routing index"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
