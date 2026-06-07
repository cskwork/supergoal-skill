#!/usr/bin/env bash
# /supergoal LEARN-DOMAIN contract.
# Fails if LEARN-DOMAIN stops being agentic-discovery, markdown-first, bottom-up, and grounded,
# or if it is no longer distinguished from the human-facing LEARN mode.

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

echo "=================================================================="
echo " /supergoal LEARN-DOMAIN contract   skill: $ROOT"
echo "=================================================================="

# Routing: SKILL.md registers the mode and separates it from LEARN.
require_text "SKILL routes LEARN-DOMAIN mode" "SKILL.md" "LEARN-DOMAIN"
require_text "SKILL maps learn-domain reference" "SKILL.md" "reference/learn-domain.md"
require_text "SKILL registers grounding gate" "SKILL.md" "learn-grounding-gate.mjs"

# Core technique commitments (research-grounded).
require_text "reference rejects embeddings/RAG" "reference/learn-domain.md" "Agentic discovery, not embeddings"
require_text "reference is markdown-first" "reference/learn-domain.md" "Markdown-first persistence"
require_text "reference uses Aider repo-map pattern" "reference/learn-domain.md" "Aider repo-map"
require_text "reference summarizes bottom-up" "reference/learn-domain.md" "Bottom-up hierarchy"
require_text "reference keeps structural index optional" "reference/learn-domain.md" "Optional structural index only"
require_text "reference requires execution-grounded verify" "reference/learn-domain.md" "Execution-grounded verification"
require_text "reference runs the grounding gate" "reference/learn-domain.md" "learn-grounding-gate.mjs"
require_text "reference keeps a scope checkpoint" "reference/learn-domain.md" "Scope checkpoint"
require_text "reference refreshes incrementally" "reference/learn-domain.md" "incremental, not full re-learn"
require_text "reference forbids faked verification" "reference/learn-domain.md" "never fake verification"

# Templates carry the grounding contract the gate enforces.
require_text "code-map has signature section" "templates/domain-agent/code-map.md" "Key Symbols (signatures)"
require_text "invariants carry a Grounding line" "templates/domain-agent/invariants.md" "Grounding:"
require_text "flows carry a Grounding line" "templates/domain-agent/flows/README.md" "Grounding:"

# Onboard stage: one self-contained human HTML handbook, Functional tier, derived from the pack.
require_text "SKILL pipeline adds Onboard stage" "SKILL.md" "Onboard"
require_text "reference describes the onboarding HTML" "reference/learn-domain.md" "onboarding.html"
require_text "reference keeps the handbook human-only" "reference/learn-domain.md" "for humans only"
require_text "reference requires a self-contained file" "reference/learn-domain.md" "self-contained file"
require_text "reference forbids external scripts/CDN" "reference/learn-domain.md" "no external scripts"
require_text "reference renders to the Functional tier" "reference/learn-domain.md" "functional-ui.md"
require_text "reference keeps the pack the source of truth" "reference/learn-domain.md" "source of truth"
require_text "template names the Functional tier" "templates/domain-onboarding.html" "functional-ui.md"
require_text "template forbids external scripts" "templates/domain-onboarding.html" "NO external scripts"
require_text "template carries a verified badge" "templates/domain-onboarding.html" "badge verified"
require_text "template declares color-scheme" "templates/domain-onboarding.html" "color-scheme"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
