#!/usr/bin/env bash
# /supergoal QA gate — the literal exit condition for the QA phase (GREENFIELD/LEGACY,
# and any web-bug check in DEBUG). It converts "QA actually drove the app with the approved driver
# and captured user-observable evidence" from prose (reference/qa.md) into a machine-checkable
# backstop. QA was the one phase gate that stayed instruction-only, which let a run silently
# fall back to a headless-Chrome render, skip the as-is/to-be proof, and still pass delivery.
# agent-browser is the default; playwright-cli requires a recorded fallback reason.
# NEVER edit this script to make a non-compliant QA pass — re-run QA properly instead.
#
# Usage: qa-gate.sh <vault-dir> <browser|cli>
#   <vault-dir>  the run's changelog folder, e.g. docs/changelog/2026-06/10-my-objective
#   browser|cli  app type under test: a browser app (drives a real browser) or a CLI/library
#
# Exit 0 only if:
#   browser: QA.md has a '## QA' section; qa/as-is-* and qa/to-be-* evidence files
#            exist (the user-observable proof, same framing); and the driver is named on a
#            'Tool:' line naming agent-browser, or playwright-cli plus a concrete 'Fallback:' reason
#            that names why agent-browser could not complete reliable QA.
#   cli:     QA.md has a '## QA' section recording an integration smoke (no browser
#            evidence required — CLI/library has no browser).

set -euo pipefail

usage() { echo "usage: qa-gate.sh <vault-dir> <browser|cli>" >&2; exit 2; }
[ $# -ge 2 ] || usage
VAULT="$1"; APPTYPE="$2"
VERIF="$VAULT/QA.md"
QA="$VAULT/qa"
fail() { echo "QA-GATE FAIL: $*" >&2; exit 1; }

case "$APPTYPE" in browser|cli) ;; *) usage ;; esac

echo "== /supergoal QA gate =="
echo "vault: $VAULT  app-type: $APPTYPE"

[ -s "$VERIF" ] || fail "QA.md missing/empty — QA recorded nothing"
grep -qiE '^##[[:space:]]+QA([[:space:]]|$)' "$VERIF" \
  || fail "QA.md has no '## QA' section — QA evidence was never recorded"
QA_SECTION="$(awk '
  /^[[:space:]]*##[[:space:]]+QA([[:space:]]|$)/ { in_qa = 1; next }
  /^[[:space:]]*##[[:space:]]+/ { if (in_qa) exit }
  in_qa { print }
' "$VERIF")"

# UI/UX contrast enforcement — makes "contrast is computed, not eyeballed" a real gate for BOTH the
# Expressive (taste-skill-v2) and Functional (functional-ui) tiers. It fires when the run declares a
# tier (a 'UI-tier: Expressive|Functional' line in ## QA) OR a pairs file exists. A UI run that omits
# the pair list, or whose palette has a sub-threshold pair, fails here — no silent eyeballed contrast.
PAIRS="$QA/contrast-pairs.json"
ui_tier_line="$(printf '%s\n' "$QA_SECTION" | grep -iE '^[[:space:]]*[-*]?[[:space:]]*UI-tier:' | head -1 || true)"
if printf '%s' "$ui_tier_line" | grep -qiE 'expressive|functional' || [ -f "$PAIRS" ]; then
  [ -f "$PAIRS" ] \
    || fail "UI-tier run but no 'qa/contrast-pairs.json' — enumerate the text/bg pairs (reference/ui-ux.md or reference/functional-ui.md)"
  CONTRAST_GATE="$(dirname "$0")/contrast-gate.mjs"
  [ -f "$CONTRAST_GATE" ] || fail "contrast-gate.mjs not found next to qa-gate.sh"
  node "$CONTRAST_GATE" "$PAIRS" \
    || fail "contrast gate failed on qa/contrast-pairs.json — fix the palette (rewind to Build); never lower the threshold"
  echo "  ok: contrast gate passed for UI run"
fi

# CLI/library: no browser, so an integration-smoke record under '## QA' is the whole contract.
if [ "$APPTYPE" = cli ]; then
  echo "  ok: ## QA present (CLI/library integration smoke; no browser evidence required)"
  echo "== QA GATE PASS =="
  exit 0
fi

# Browser app from here.
# 1) User-observable proof: non-empty as-is/to-be evidence (any extension) under qa/.
require_evidence() {
  local pattern="$1" purpose="$2" found=0 path
  [ -d "$QA" ] || fail "no 'qa/${pattern}' evidence — capture the ${purpose} state at a fixed route/viewport (reference/qa.md as-is/to-be)"
  for path in "$QA"/$pattern; do
    [ -e "$path" ] || [ -L "$path" ] || continue
    [ -f "$path" ] \
      || fail "'qa/${pattern}' evidence match is not a file: ${path}"
    [ -s "$path" ] \
      || fail "empty 'qa/${pattern}' evidence: ${path} — capture a real screenshot/text proof"
    found=1
  done
  [ "$found" = 1 ] \
    || fail "no 'qa/${pattern}' evidence — capture the ${purpose} state at a fixed route/viewport (reference/qa.md as-is/to-be)"
}
require_evidence "as-is-*" "before"
require_evidence "to-be-*" "after"

# 2) The driver record is singular and exact; copied template or conflicting values are not evidence.
tool_lines="$(printf '%s\n' "$QA_SECTION" | grep -iE '^[[:space:]]*[-*]?[[:space:]]*Tool:' || true)"
tool_count="$(printf '%s\n' "$tool_lines" | awk 'NF { count++ } END { print count + 0 }')"
[ "$tool_count" -gt 0 ] \
  || fail "## QA has no 'Tool:' line — name the driver that exercised the app"
[ "$tool_count" -eq 1 ] \
  || fail "## QA must contain exactly one 'Tool:' line"
tool_line="$tool_lines"
tool_value="${tool_line#*:}"
fallback_lines="$(printf '%s\n' "$QA_SECTION" | grep -iE '^[[:space:]]*[-*]?[[:space:]]*Fallback:' || true)"
fallback_count="$(printf '%s\n' "$fallback_lines" | awk 'NF { count++ } END { print count + 0 }')"

# 3) agent-browser has no fallback record. playwright-cli requires one concrete failure/limitation.
if printf '%s' "$tool_value" | grep -qiE '^[[:space:]]*agent-browser[[:space:]]*$'; then
  [ "$fallback_count" -eq 0 ] \
    || fail "agent-browser runs must contain no 'Fallback:' line"
  echo "  ok: driven by agent-browser"
elif printf '%s' "$tool_value" | grep -qiE '^[[:space:]]*playwright-cli[[:space:]]*$'; then
  [ "$fallback_count" -gt 0 ] \
    || fail "playwright-cli is fallback-only — add 'Fallback:' with why agent-browser could not complete reliable QA"
  [ "$fallback_count" -eq 1 ] \
    || fail "playwright-cli runs must contain exactly one 'Fallback:' line"
  fallback_line="$fallback_lines"
  fallback_value="${fallback_line#*:}"
  printf '%s' "$fallback_value" | grep -qiF 'agent-browser' \
    || fail "playwright-cli fallback must name agent-browser and why it could not complete reliable QA"
  fallback_reason="$(printf '%s' "$fallback_value" | sed -E 's/[Aa][Gg][Ee][Nn][Tt]-[Bb][Rr][Oo][Ww][Ss][Ee][Rr]//')"
  printf '%s' "$fallback_reason" | grep -qiE '(because[[:space:]]+[[:alnum:]]|could not[[:space:]]+[[:alnum:]]|cannot[[:space:]]+[[:alnum:]]|unable to[[:space:]]+[[:alnum:]]|failed to[[:space:]]+[[:alnum:]]|failure:[[:space:]]*[[:alnum:]]|limitation:[[:space:]]*[[:alnum:]]|unsupported[[:space:]]+[[:alnum:]]|timed out|timeout[[:space:]]+(on|while|during|at)[[:space:]]+[[:alnum:]]|blocked by[[:space:]]+[[:alnum:]]|not (supported|inspectable|reachable|available|reliable))' \
    || fail "playwright-cli fallback needs a concrete agent-browser limitation/failure reason"
  echo "  ok: driven by playwright-cli with recorded agent-browser fallback"
else
  fail "unsupported browser driver in ## QA 'Tool:' — value must be exactly 'agent-browser' or 'playwright-cli'"
fi

echo "  ok: as-is/to-be evidence present + driver named"
echo "== QA GATE PASS =="
