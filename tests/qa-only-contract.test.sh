#!/usr/bin/env bash
# /supergoal QA-ONLY contract + gate scenarios.
# Part A asserts the no-code QA mode is wired into the spine, references, and agents.
# Part B drives qa-only-gate.sh through real temp vaults, asserting BOTH exit code AND an output
# substring per case (two independent signals), the same discipline as tests/gate-scenarios.test.sh.

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0; FAIL=0
. "$ROOT/tests/support/contract.sh"

echo "=================================================================="
echo " /supergoal QA-ONLY contract   skill: $ROOT"
echo "=================================================================="

# ---- Part A: wiring ------------------------------------------------------
assert_file "qa-only reference exists"      "reference/qa-only.md"
assert_file "db-access reference exists"    "reference/db-access.md"
assert_file "qa-tester agent exists"        "agents/qa-tester.md"
assert_file "qa-auditor agent exists"       "agents/qa-auditor.md"
assert_file "db-reader agent exists"        "agents/db-reader.md"
assert_file "qa report template exists"     "templates/qa-report.md"
assert_file "qa-only gate exists"           "templates/qa-only-gate.sh"

assert_text_ci_normalized "skill lists QA-ONLY mode"          "SKILL.md" "**QA-ONLY**"
assert_text_ci_normalized "skill maps qa-only reference"       "SKILL.md" "reference/qa-only.md"
assert_text_ci_normalized "skill maps qa-only gate"            "SKILL.md" "templates/qa-only-gate.sh"
assert_text_ci_normalized "readme lists QA-ONLY mode"          "README.md" "**QA-ONLY**"

assert_text_ci_normalized "qa-only vault uses QA.md"           "reference/qa-only.md" '`QA.md` (`## QA` evidence)'
assert_text_ci_normalized "qa-only writes no production code"  "reference/qa-only.md" "writes NO production code"
assert_text_ci_normalized "qa-only is read-only"               "reference/qa-only.md" "read-only except the run folder"
assert_text_ci_normalized "qa-only default cap is 100"         "reference/qa-only.md" "Default \`action_cap\` is **100**"
assert_text_ci_normalized "qa-only separates tester and auditor" "reference/qa-only.md" "two separate read-only subagents: \`qa-tester\` and \`qa-auditor\`"
assert_text_ci_normalized "qa-only tester produces evidence"   "reference/qa-only.md" "\`qa-tester\` produces execution evidence"
assert_text_ci_normalized "qa-only auditor owns verdict"       "reference/qa-only.md" "\`qa-auditor\` owns the independent final verdict"
assert_text_ci_normalized "qa-only audits after cross-check"   "reference/qa-only.md" "Audit — dispatch \`qa-auditor\`"
assert_text_ci_normalized "qa-only persists indexed suite"     "reference/qa-only.md" ".domain-agent/qa/<suite>.md"
assert_text_ci_normalized "qa-only builds impact matrix"       "reference/qa-only.md" "Impact Matrix"
assert_text_ci_normalized "qa-only covers complex scenarios"   "reference/qa-only.md" "complex multi-step scenarios"
assert_text_ci_normalized "qa-only covers before after actions" "reference/qa-only.md" "before/during/after actions"
assert_text_ci_normalized "qa-only checks displayed data"      "reference/qa-only.md" "displayed data accuracy and consistency"
assert_text_ci_normalized "qa-only generalizes web feature families" "reference/qa-only.md" "feature-specific scenario families"
assert_text_ci_normalized "qa-only checks state propagation"   "reference/qa-only.md" "state propagation paths"
assert_text_ci_normalized "qa-only shards independent scenarios" "reference/qa-only.md" "Scenario shards"
assert_text_ci_normalized "qa-only uses shared ledger"         "reference/qa-only.md" "qa/scenario-ledger.md"
assert_text_ci_normalized "qa-only avoids agent cross-talk"    "reference/qa-only.md" "never agent-to-agent"
assert_text_ci_normalized "qa-only keeps one final auditor"    "reference/qa-only.md" "one \`qa-auditor\` owns the final verdict"
assert_text_ci_normalized "qa-only keeps db-reader optional"   "reference/qa-only.md" "optional third evidence role"
assert_text_ci_normalized "qa-only hands UI values to tester"  "reference/qa-only.md" "passes those small values to \`qa-tester\` for UI diffing"
assert_text_ci_normalized "qa-only auditor consumes full ledger" "reference/qa-only.md" "auditor reconciles the complete ledger/evidence"
refute_text_ci_normalized "qa-only no longer exercises via auditor" "reference/qa-only.md" "Drive the app through scenarios via \`qa-auditor\`"
assert_text_ci_normalized "qa-only persists impact coverage"   "reference/qa-only.md" "coverage, uncovered areas, and residual risks"
assert_text_ci_normalized "qa-only gate enforces shared ledger" "templates/qa-only-gate.sh" "scenario-ledger.md"
assert_text_ci_normalized "qa-only gate enforces impact heading" "templates/qa-only-gate.sh" "## Impact coverage"
assert_text_ci_normalized "qa-only gate enforces repro heading" "templates/qa-only-gate.sh" "## Reproduction notes"
assert_text_ci_normalized "qa-only names report anchors"       "reference/qa-only.md" "What worked"
assert_text_ci_normalized "qa-only report matches docs language" "reference/qa-only.md" "docs language (SKILL.md)"
assert_text_ci_normalized "qa-only handoff via qa/expected.md" "reference/qa-only.md" "qa/expected.md"
assert_text_ci_normalized "qa report names impact coverage"    "templates/qa-report.md" "## Impact coverage"
assert_text_ci_normalized "qa report template matches docs language" "templates/qa-report.md" "docs language (SKILL.md)"
assert_text_ci_normalized "qa report names not covered"        "templates/qa-report.md" "## Not covered"
assert_text_ci_normalized "qa report names reproduction notes" "templates/qa-report.md" "## Reproduction notes"
assert_text_ci_normalized "qa report shows reproduce steps"    "templates/qa-report.md" "Reproduce:"

assert_text_ci_normalized "db-access is read-only hard rule"   "reference/db-access.md" "Read-only (hard rule)"
assert_text_ci_normalized "db-access is db-independent"        "reference/db-access.md" "DB-independent abstraction"
assert_text_ci_normalized "db-access never hardcodes creds"    "reference/db-access.md" "NEVER hardcode"
assert_text_ci_normalized "db-access runs in db-reader"        "reference/db-access.md" "dedicated \`db-reader\` subagent"

assert_text_ci_normalized "qa-auditor does not read DB"        "agents/qa-auditor.md" "Do not query the database"
assert_text_ci_normalized "qa-auditor does not drive browser"  "agents/qa-auditor.md" "Do not drive the browser"
refute_text_ci_normalized "qa-auditor has no playwright install" "agents/qa-auditor.md" "npm install -g @playwright/cli"
assert_text_ci_normalized "qa-tester owns browser driver"      "agents/qa-tester.md" "Playwright CLI is the only browser driver"
assert_text_ci_normalized "qa-tester auth via native paths"    "agents/qa-tester.md" "native paths"
refute_text_ci_normalized "playwright reference excludes auditor driver" "reference/playwright-cli.md" "\`qa-tester\`/\`qa-auditor\`"
refute_text_ci_normalized "db reference excludes auditor browser role" "reference/db-access.md" "browser \`qa-auditor\`"
assert_text_ci_normalized "db-reader is select-only"           "agents/db-reader.md" "Read-only ONLY"
assert_text_ci_normalized "db-reader never writes auth to file" "agents/db-reader.md" "NEVER write auth/credentials to any file"

assert_text_ci_normalized "qa.md has native auth policy"       "reference/qa.md" "Authenticated sessions (native playwright-cli)"
assert_text_ci_normalized "domain-context registers qa suites" "reference/domain-context.md" "Reusable QA suites from QA-ONLY runs"
assert_text_ci_normalized "index template has QA Suites"       "templates/domain-agent/index.md" "## QA Suites"
assert_text_ci_normalized "db-reader may write its evidence"   "agents/db-reader.md" "Read, Grep, Glob, Bash, Write"
assert_text_ci_normalized "qa-tester installs pinned playwright-cli" "agents/qa-tester.md" "npm install -g @playwright/cli@0.1.14"
assert_text_ci_normalized "playwright-cli reference records pinned version" "reference/playwright-cli.md" "@playwright/cli@0.1.14"
assert_text_ci_normalized "qa-tester carries the same playwright-cli pin" "agents/qa-tester.md" "@playwright/cli@0.1.14"
assert_text_ci_normalized "qa reference carries the same playwright-cli pin" "reference/qa.md" "@playwright/cli@0.1.14"

# ---- Part B: qa-only-gate.sh scenarios -----------------------------------
GATE="$ROOT/templates/qa-only-gate.sh"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT

run_case() {
  local label="$1" exp="$2" sub="$3"; shift 3
  local out ec ok=1
  out="$("$@" 2>&1)"; ec=$?
  [ "$ec" = "$exp" ] || ok=0
  [ "$sub" = "-" ] || printf '%s' "$out" | grep -qiF -- "$sub" || ok=0
  if [ "$ok" = 1 ]; then PASS=$((PASS+1)); printf '  PASS  %-44s exit=%s\n' "$label" "$ec"
  else FAIL=$((FAIL+1)); printf '  FAIL  %-44s exit=%s (want %s) substr=%q\n        out: %s\n' \
    "$label" "$ec" "$exp" "$sub" "$(printf '%s' "$out" | tr '\n' '|' | cut -c1-160)"; fi
}

# Build a fully-passing browser QA-ONLY vault, then mutate per case.
mkbrowser() {
  local v="$T/$1"; rm -rf "$v"; mkdir -p "$v/qa"
  printf 'QA scope: checkout flow on staging\n' > "$v/brief.md"
  printf '# Scenario ledger\n\n## Impact Matrix\n- direct flow\n\n## Shards\n| Scenario | Status | Evidence |\n|---|---|---|\n| direct-flow | PASS | qa/to-be-1040.png |\n' > "$v/qa/scenario-ledger.md"
  printf '# QA report\n## Impact coverage\n- direct flow, adjacent totals, refresh/reopen\n## What worked\n- login -> PASS\n## What didn'"'"'t\n- none\n## What I discovered\n- nothing\n## Reproduction notes\n- No issues to reproduce.\n## Not covered\n- none\n## How to re-run\n- `.domain-agent/qa/checkout.md`\n' > "$v/report.md"
  printf 'verdict: GREEN\n## QA\nTool: playwright-cli\n- as-is/to-be captured\n' > "$v/QA.md"
  printf 'as-is proof\n' > "$v/qa/as-is-1040.png"; printf 'to-be proof\n' > "$v/qa/to-be-1040.png"
  printf '{ "action_count": 12, "action_cap": 100 }\n' > "$v/state.json"
  echo "$v"
}

echo; echo "SCENARIO — qa-only-gate.sh"
run_case "0.0 missing app-type -> usage (exit 2)"  2 "usage"   bash "$GATE" "$(mkbrowser g0)"
run_case "0.1 bad app-type -> usage (exit 2)"      2 "usage"   bash "$GATE" "$(mkbrowser g0b)" mobile

v=$(mkbrowser g1)
run_case "1.1 full valid browser -> PASS"          0 "QA-ONLY GATE PASS" bash "$GATE" "$v" browser
rm -f "$v/report.md"
run_case "1.2 missing report.md -> blocked"        1 "report.md missing" bash "$GATE" "$v" browser
v=$(mkbrowser g1c)
printf '# QA report\n## Impact coverage\n- direct flow\n## What worked\n- ok\n## What I discovered\n- x\n## Reproduction notes\n- Reproduce: open checkout\n## Not covered\n- y\n## How to re-run\n- y\n' > "$v/report.md"
run_case "1.3 report missing a section -> blocked" 1 "What didn"          bash "$GATE" "$v" browser
v=$(mkbrowser g1d); rm -f "$v/brief.md"
run_case "1.4 missing brief.md -> blocked"         1 "brief.md missing"   bash "$GATE" "$v" browser
v=$(mkbrowser g1e); rm -f "$v/qa/scenario-ledger.md"
run_case "1.5 missing scenario ledger -> blocked"  1 "scenario-ledger.md" bash "$GATE" "$v" browser
v=$(mkbrowser g1f)
printf '# Scenario ledger\n\n## Impact Matrix\n- direct flow\n\n## Shards\n- direct-flow assigned but no outcome yet\n' > "$v/qa/scenario-ledger.md"
run_case "1.6 ledger without scenario outcome -> blocked" 1 "scenario outcome" bash "$GATE" "$v" browser

v=$(mkbrowser g2); printf '{ "action_count": 150, "action_cap": 100 }\n' > "$v/state.json"
run_case "2.1 action_count over cap -> blocked"    1 "exceeds action_cap" bash "$GATE" "$v" browser
v=$(mkbrowser g2b); printf '{ "foo": 1 }\n' > "$v/state.json"
run_case "2.2 no numeric action_count -> blocked"  1 "action_count"       bash "$GATE" "$v" browser
v=$(mkbrowser g3); printf '{ "action_count": 50 }\n' > "$v/state.json"
run_case "3.1 action_cap defaults to 100 -> PASS"  0 "within cap 100"     bash "$GATE" "$v" browser

# Authenticated session: native playwright-cli (named session / state-load / CDP attach), one driver.
v=$(mkbrowser g3b)
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\n- auth via state-load; as-is/to-be captured\n' > "$v/QA.md"
run_case "3.2 native auth session -> PASS"         0 "QA-ONLY GATE PASS"  bash "$GATE" "$v" browser

# DB read-only backstop.
v=$(mkbrowser g4)
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\nDB: mysql (read-only via aidt-mysql-cli)\n- as-is/to-be captured\n' > "$v/QA.md"
run_case "4.1 DB read-only, no writes -> PASS"     0 "every DB: line marked read-only" bash "$GATE" "$v" browser
v=$(mkbrowser g4b)
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\nDB: mysql (via cli)\n- as-is/to-be captured\n' > "$v/QA.md"
run_case "4.2 DB line not read-only -> blocked"    1 "not marked read-only" bash "$GATE" "$v" browser
v=$(mkbrowser g4c)
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\nDB: mysql (read-only via cli)\nran: UPDATE orders SET total=1\n- as-is/to-be captured\n' > "$v/QA.md"
run_case "4.3 DB write SQL recorded -> blocked"    1 "DB write statement"  bash "$GATE" "$v" browser
# Second DB line unmarked rides behind a first read-only line -> must be caught per-line.
v=$(mkbrowser g4d)
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\nDB: postgres (read-only via psql)\nDB: mysql (via cli)\n- as-is/to-be captured\n' > "$v/QA.md"
run_case "4.4 mixed DB lines, one unmarked -> blocked" 1 "not marked read-only" bash "$GATE" "$v" browser
# REPLACE INTO / GRANT are writes too.
v=$(mkbrowser g4e)
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\nDB: mysql (read-only via cli)\nran: REPLACE INTO cache VALUES (1)\n- as-is/to-be captured\n' > "$v/QA.md"
run_case "4.5 REPLACE INTO -> blocked"             1 "DB write statement"  bash "$GATE" "$v" browser
v=$(mkbrowser g4f)
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\nDB: mysql (read-only via cli)\nran: GRANT SELECT ON db.* TO qa\n- as-is/to-be captured\n' > "$v/QA.md"
run_case "4.6 GRANT -> blocked"                    1 "DB write statement"  bash "$GATE" "$v" browser

# CLI app-type: qa-gate.sh needs only ## QA; everything else still enforced.
v=$(mkbrowser g5)
printf 'verdict: GREEN\n## QA\nintegration smoke: bin vs fixture snapshot matches\n' > "$v/QA.md"
run_case "5.1 CLI app + valid report -> PASS"      0 "QA-ONLY GATE PASS"  bash "$GATE" "$v" cli

echo
echo "=================================================================="
printf " RESULT: %d passed, %d failed\n" "$PASS" "$FAIL"
echo "=================================================================="
[ "$FAIL" -eq 0 ]
