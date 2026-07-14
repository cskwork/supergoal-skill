#!/usr/bin/env bash
# /supergoal LEARN-DOMAIN contract.
# Fails if LEARN-DOMAIN stops being agentic-discovery, markdown-first, bottom-up, and grounded,
# or if it is no longer distinguished from the human-facing TEACH mode.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
. "$ROOT/tests/support/contract.sh"

echo "=================================================================="
echo " /supergoal LEARN-DOMAIN contract   skill: $ROOT"
echo "=================================================================="

# Routing: SKILL.md registers the mode and separates it from TEACH.
assert_text_ci_normalized "SKILL routes LEARN-DOMAIN mode" "SKILL.md" "LEARN-DOMAIN"
assert_text_ci_normalized "SKILL maps learn-domain reference" "SKILL.md" "reference/learn-domain.md"
assert_text_ci_normalized "SKILL registers grounding gate" "SKILL.md" "learn-grounding-gate.mjs"

# Core technique commitments (research-grounded).
assert_text_ci_normalized "reference rejects embeddings/RAG" "reference/learn-domain.md" "Agentic discovery, not embeddings"
assert_text_ci_normalized "reference is markdown-first" "reference/learn-domain.md" "Markdown-first persistence"
assert_text_ci_normalized "reference uses Aider repo-map pattern" "reference/learn-domain.md" "Aider repo-map"
assert_text_ci_normalized "reference summarizes bottom-up" "reference/learn-domain.md" "Bottom-up hierarchy"
assert_text_ci_normalized "reference keeps structural index optional" "reference/learn-domain.md" "Optional structural index only"
assert_text_ci_normalized "reference requires execution-grounded verify" "reference/learn-domain.md" "Execution-grounded verification"
assert_text_ci_normalized "reference runs the grounding gate" "reference/learn-domain.md" "learn-grounding-gate.mjs"
assert_text_ci_normalized "reference keeps a scope checkpoint" "reference/learn-domain.md" "Scope checkpoint"
assert_text_ci_normalized "reference refreshes incrementally" "reference/learn-domain.md" "incremental, not full re-learn"
assert_text_ci_normalized "reference forbids faked verification" "reference/learn-domain.md" "never fake verification"

# Templates carry the grounding contract the gate enforces.
assert_text_ci_normalized "code-map has signature section" "templates/domain-agent/code-map.md" "Key Symbols (signatures)"
assert_text_ci_normalized "invariants carry a Grounding line" "templates/domain-agent/invariants.md" "Grounding:"
assert_text_ci_normalized "flows carry a Grounding line" "templates/domain-agent/flows/README.md" "Grounding:"

# Onboard stage: one self-contained human HTML handbook, Functional tier, derived from the pack.
assert_text_ci_normalized "SKILL pipeline adds Onboard stage" "SKILL.md" "Onboard"
assert_text_ci_normalized "reference describes the onboarding HTML" "reference/learn-domain.md" "onboarding.html"
assert_text_ci_normalized "reference keeps the handbook human-only" "reference/learn-domain.md" "for humans only"
assert_text_ci_normalized "reference requires a self-contained file" "reference/learn-domain.md" "self-contained file"
assert_text_ci_normalized "reference forbids external scripts/CDN" "reference/learn-domain.md" "no external scripts"
assert_text_ci_normalized "reference renders to the Functional tier" "reference/learn-domain.md" "functional-ui.md"
assert_text_ci_normalized "reference keeps the pack the source of truth" "reference/learn-domain.md" "source of truth"
assert_text_ci_normalized "reference matches target docs language" "reference/learn-domain.md" "docs language (SKILL.md)"
assert_text_ci_normalized "template names the Functional tier" "templates/domain-onboarding.html" "functional-ui.md"
assert_text_ci_normalized "template forbids external scripts" "templates/domain-onboarding.html" "NO external scripts"
assert_text_ci_normalized "template carries a verified badge" "templates/domain-onboarding.html" "badge verified"
assert_text_ci_normalized "template declares color-scheme" "templates/domain-onboarding.html" "color-scheme"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
