#!/usr/bin/env bash
# /supergoal QA gate — the literal exit condition for the QA phase (GREENFIELD/LEGACY,
# and any web-bug check in DEBUG). It converts "QA actually drove the app with agent-browser
# and captured user-observable evidence" from prose (reference/qa.md) into a machine-checkable
# backstop. QA was the one phase gate that stayed instruction-only, which let a run silently
# fall back to a headless-Chrome render, skip the as-is/to-be proof, and still pass delivery.
# NEVER edit this script to make a non-compliant QA pass — re-run QA properly instead.
#
# Usage: qa-gate.sh <vault-dir> <browser|cli>
#   <vault-dir>  the run's changelog folder, e.g. docs/changelog/2026-05-30-my-objective
#   browser|cli  app type under test: a browser app (drives a real browser) or a CLI/library
#
# Exit 0 only if:
#   browser: verification.md has a '## QA' section; qa/as-is-* and qa/to-be-* evidence files
#            exist (the user-observable proof, same framing); the '## QA' section records
#            `agent-browser doctor`; the driver is named on a 'Tool:' line; and if that driver
#            is NOT agent-browser, a 'Fallback:' line justifies why agent-browser was impossible
#            (a silent headless-Chrome fallback fails here).
#   cli:     verification.md has a '## QA' section recording an integration smoke (no browser
#            evidence required — CLI/library has no browser).

set -euo pipefail

usage() { echo "usage: qa-gate.sh <vault-dir> <browser|cli>" >&2; exit 2; }
[ $# -ge 2 ] || usage
VAULT="$1"; APPTYPE="$2"
VERIF="$VAULT/verification.md"
QA="$VAULT/qa"
fail() { echo "QA-GATE FAIL: $*" >&2; exit 1; }

case "$APPTYPE" in browser|cli) ;; *) usage ;; esac

echo "== /supergoal QA gate =="
echo "vault: $VAULT  app-type: $APPTYPE"

[ -s "$VERIF" ] || fail "verification.md missing/empty — QA recorded nothing"
grep -qiE '^##[[:space:]]+QA\b' "$VERIF" \
  || fail "verification.md has no '## QA' section — QA evidence was never recorded"

# CLI/library: no browser, so an integration-smoke record under '## QA' is the whole contract.
if [ "$APPTYPE" = cli ]; then
  echo "  ok: ## QA present (CLI/library integration smoke; no browser evidence required)"
  echo "== QA GATE PASS =="
  exit 0
fi

# Browser app from here.
# 1) User-observable proof: as-is/to-be evidence (any extension) under qa/ (reference/qa.md §4).
ls "$QA"/as-is-* >/dev/null 2>&1 \
  || fail "no 'qa/as-is-*' evidence — capture the before state at a fixed route/viewport (reference/qa.md as-is/to-be)"
ls "$QA"/to-be-* >/dev/null 2>&1 \
  || fail "no 'qa/to-be-*' evidence — capture the after state at the same framing as as-is"

# 2) The driver that exercised the app must be named on a 'Tool:' line.
grep -qiF 'agent-browser doctor' "$VERIF" \
  || fail "## QA has no 'agent-browser doctor' preflight — checking iab/Browser targets or Playwright availability is not enough"

# 3) The driver that exercised the app must be named on a 'Tool:' line.
tool_line="$(grep -iE '^[[:space:]]*[-*]?[[:space:]]*Tool:' "$VERIF" | head -1 || true)"
[ -n "$tool_line" ] \
  || fail "## QA has no 'Tool:' line — name the driver that exercised the app (agent-browser, or the fallback)"

# 4) agent-browser is the sanctioned driver; any other driver must justify why agent-browser
#    was impossible on a 'Fallback:' line. This is the silent-headless-Chrome backstop.
if printf '%s' "$tool_line" | grep -qiF 'agent-browser'; then
  echo "  ok: driven by agent-browser"
else
  grep -qiE '^[[:space:]]*[-*]?[[:space:]]*Fallback:' "$VERIF" \
    || fail "QA used a non-agent-browser driver but no 'Fallback:' line justifies why agent-browser was impossible — a silent fallback (e.g. headless-Chrome render) is not allowed"
  echo "  ok: non-agent-browser driver with a recorded Fallback justification"
fi

echo "  ok: as-is/to-be evidence present + driver named"
echo "== QA GATE PASS =="
