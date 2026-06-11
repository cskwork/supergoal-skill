#!/usr/bin/env bash
# /supergoal SPEC-mode contract.
# Fails if the Kiro-style spec workflow (requirements -> design -> tasks under docs/spec/)
# loses its EARS/glossary/user-story format, its phase approvals, its traceability,
# or its integration with the default loop (EARS feeds the critic, tasks drive Build).

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
echo " /supergoal spec contract   skill: $ROOT"
echo "=================================================================="

# SKILL.md wiring (detail lives in reference/spec.md; SKILL.md is a slim router)
require_text "mode table routes SPEC" "SKILL.md" "| SPEC |"
require_text "reference map lists spec" "SKILL.md" "reference/spec.md"

# spec.md contract - documents and location
require_file "spec reference exists" "reference/spec.md"
require_text "spec outputs to docs/spec in the target repo" "reference/spec.md" "docs/spec/<feature-slug>/"
require_text "spec produces three documents" "reference/spec.md" "requirements.md -> design.md -> tasks.md"

# requirements phase format
require_text "spec uses EARS format" "reference/spec.md" "WHEN [event] THEN [system] SHALL [response]"
require_text "spec uses user stories" "reference/spec.md" "As a [role], I want [feature], so that [benefit]"
require_text "spec requires a glossary" "reference/spec.md" "Glossary"
require_text "spec covers edge cases per requirement" "reference/spec.md" "edge cases"
require_text "spec keeps requirements implementation-free" "reference/spec.md" "what, not how"

# phase approvals (lean: one checkpoint per document, pre-approvable)
require_text "spec gates design on requirements approval" "reference/spec.md" "Do not start design until requirements.md is approved"
require_text "spec allows pre-approval" "reference/spec.md" "pre-approve"

# anti-ceremony gate
require_text "spec is opt-in, not default" "reference/spec.md" "Gate - when to spec vs skip"
require_text "spec skips trivial work" "reference/spec.md" "trivial"

# grill protocol - middle ground between autonomous drafting and rubber-stamp approval
require_text "spec grills instead of drafting autonomously" "reference/spec.md" "Grill - crystallize, don't rubber-stamp"
require_text "grill asks one question at a time with recommendation" "reference/spec.md" "one question at a time, each with a recommended answer"
require_text "grill explores code instead of asking" "reference/spec.md" "explore the codebase instead of asking"
require_text "grill challenges terms against existing language" "reference/spec.md" "CONTEXT.md"
require_text "grill sharpens fuzzy terms" "reference/spec.md" "propose a precise canonical term"
require_text "grill stress-tests with concrete scenarios" "reference/spec.md" "concrete scenario"
require_text "grill surfaces code contradictions" "reference/spec.md" "check whether the code agrees"
require_text "grill crystallizes the doc inline" "reference/spec.md" "the moment it settles"
require_text "grill is bounded to load-bearing decisions" "reference/spec.md" "load-bearing, user-only"
require_text "grill has an escape hatch" "reference/spec.md" "draft the rest"
require_text "spec grill replaces the generic interview" "reference/spec.md" "replaces the generic clarifying interview"
require_text "design decisions are grilled as options" "reference/spec.md" "Decision records are grilled"
require_text "decision records need a real trade-off" "reference/spec.md" "hard to reverse"
require_text "grill rejections become ADRs" "reference/spec.md" "offer to record it as an ADR"
require_text "grill ADRs prevent re-suggesting" "reference/spec.md" "don't re-suggest"
require_text "grill ADRs skip ephemeral reasons" "reference/spec.md" "skip ephemeral"

# tasks phase
require_text "tasks carry requirement traceability" "reference/spec.md" "_Requirements:"
require_text "tasks are checkbox-tracked" "reference/spec.md" "- [ ]"
require_text "tasks stay small" "reference/spec.md" "small enough to verify independently"

# integration with the default loop
require_text "tasks drive Build in order" "reference/spec.md" "Build executes tasks.md in order"
require_text "EARS criteria feed the critic" "reference/spec.md" "critic derives its failing tests from the EARS acceptance criteria"
require_text "surfaced requirements flow back into the spec" "reference/spec.md" "surfaced requirement is added to requirements.md as a new numbered requirement"
require_text "spec is a living document" "reference/spec.md" "living document"
require_text "EARS never replaces ground truth" "reference/spec.md" "never replace ground truth"

# templates
require_file "requirements template exists" "templates/spec/requirements.md"
require_text "requirements template has glossary section" "templates/spec/requirements.md" "## Glossary"
require_text "requirements template has EARS criteria" "templates/spec/requirements.md" "SHALL"
require_text "requirements template has out-of-scope section" "templates/spec/requirements.md" "## Out of scope"
require_file "design template exists" "templates/spec/design.md"
require_text "design template has components section" "templates/spec/design.md" "## Components and interfaces"
require_text "design template has decision records" "templates/spec/design.md" "### Decision:"
require_file "tasks template exists" "templates/spec/tasks.md"
require_text "tasks template has traceability" "templates/spec/tasks.md" "_Requirements:"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
