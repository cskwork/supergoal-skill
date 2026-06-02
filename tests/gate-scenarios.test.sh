#!/usr/bin/env bash
# /supergoal — runnable gate scenario suite.
# Converts the prose Tier A matrix in docs/e2e-test-plan.md into an executable, self-verifying
# harness. Every case asserts BOTH the gate's exit code AND a substring of its output, so a
# pass requires two independent signals (guards against silently-wrong gates and fabricated output).
#
# Usage: bash tests/gate-scenarios.test.sh
# Exit 0 only if all cases pass. Run from the repo root.

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT

VALIDATE="$SKILL_DIR/templates/validate-gate.sh"
DELIVERY="$SKILL_DIR/templates/delivery-gate.sh"
HFGATE="$SKILL_DIR/templates/human-feedback-gate.mjs"
BREAKER="$SKILL_DIR/templates/circuit-breaker.mjs"
EX="$SKILL_DIR/examples/url-shortener"

PASS=0; FAIL=0; CASES=""

# run_case <label> <expected-exit> <expected-substr|-> <command...>
run_case() {
  local label="$1" exp="$2" sub="$3"; shift 3
  local out ec ok=1
  out="$("$@" 2>&1)"; ec=$?
  [ "$ec" = "$exp" ] || ok=0
  if [ "$sub" != "-" ]; then printf '%s' "$out" | grep -qiF -- "$sub" || ok=0; fi
  if [ "$ok" = 1 ]; then
    PASS=$((PASS+1)); printf '  PASS  %-46s exit=%s\n' "$label" "$ec"
  else
    FAIL=$((FAIL+1))
    printf '  FAIL  %-46s exit=%s (want %s) substr=%q\n' "$label" "$ec" "$exp" "$sub"
    printf '        out: %s\n' "$(printf '%s' "$out" | tr '\n' '|' | cut -c1-160)"
  fi
}

mkvault() { local d="$T/$1"; rm -rf "$d"; mkdir -p "$d"; echo "$d"; }

# Valid Human Feedback plan.md body (plain above technical, >=20/>=30 words, real Terms def).
write_valid_plan() {
  cat > "$1/plan.md" <<'EOF'
# Plan

## Human Feedback

### Plain-language brief
We will add a click cap so each short link can be limited to a maximum number of redirects,
after which the link stops working and returns a clear error to the visitor instead.

### Technical brief
Add an optional maxRedirects integer column to each stored link record; the redirect handler
increments and compares the hit counter atomically inside the existing mutex and returns HTTP
410 Gone once the cap is reached, leaving all current endpoints and the error envelope unchanged.

### Terms
- click cap: the maximum number of times a short link may be followed before it expires
- 410 Gone: the HTTP status returned when a capped link is exhausted

### Approval request
Approve to proceed to Build, or request changes to scope before any code is written.
EOF
}

write_state() { printf '{ "approval": %s }\n' "$2" > "$1/state.json"; }

# A contract-complete verification.md: GREEN + coverage map + named gaps + regression line.
write_complete_verif() {
  cat > "$1/verification.md" <<'EOF'
claim s1: GREEN — re-ran from clean state
verdict: GREEN

## Coverage
- AC1 (endpoints + error paths): claim s1 GREEN
- SSRF checklist (trailing-dot FQDN, IPv6-mapped, octal/hex IP, NAT64): probed GREEN
Not covered: none — all acceptance criteria + domain checklist items mapped
Regression tests: none (verify-only fixture)
EOF
}

echo "=================================================================="
echo " /supergoal gate scenarios   skill: $SKILL_DIR"
echo " node $(node --version)   bash ${BASH_VERSION%%(*}"
echo "=================================================================="

# ----------------------------------------------------------------------
echo; echo "SCENARIO 1 — validate-gate.sh : adversarial Decision parsing"
# ----------------------------------------------------------------------
v=$(mkvault s1); printf 'b\nDecision: GO\n' > "$v/brief.md"
run_case "1.1 Decision: GO -> PASS"                 0 "VALIDATE GATE PASS" bash "$VALIDATE" "$v"
printf 'b\nDecision: NO-GO\n' > "$v/brief.md"
run_case "1.2 Decision: NO-GO -> blocked"           1 "decision is NO-GO"  bash "$VALIDATE" "$v"
printf 'b\nDecision: NOGO\n' > "$v/brief.md"
run_case "1.3 Decision: NOGO (no hyphen) -> blocked" 1 "decision is NO-GO" bash "$VALIDATE" "$v"
printf 'b\n## Decision: GO\n' > "$v/brief.md"
run_case "1.4 '## Decision: GO' heading -> PASS"    0 "VALIDATE GATE PASS" bash "$VALIDATE" "$v"
printf 'The NO-GO criteria are listed here.\nDecision: GO\n' > "$v/brief.md"
run_case "1.5 prose mentions NO-GO + Decision GO"   0 "VALIDATE GATE PASS" bash "$VALIDATE" "$v"
v2=$(mkvault s1b)
run_case "1.6 missing brief.md -> blocked"          1 "missing/empty"      bash "$VALIDATE" "$v2"
: > "$v2/brief.md"
run_case "1.7 empty brief.md -> blocked"            1 "missing/empty"      bash "$VALIDATE" "$v2"
printf 'just a brief, no decision line\n' > "$v2/brief.md"
run_case "1.8 no Decision line -> blocked"          1 "no 'Decision: GO'"  bash "$VALIDATE" "$v2"
printf 'decision: go\n' > "$v2/brief.md"
run_case "1.9 lowercase decision: go -> PASS"       0 "VALIDATE GATE PASS" bash "$VALIDATE" "$v2"
printf 'Decision: GO\nlater changed\nDecision: NO-GO\n' > "$v2/brief.md"
run_case "1.10 GO then NO-GO -> fail-safe blocked"  1 "decision is NO-GO"  bash "$VALIDATE" "$v2"

# ----------------------------------------------------------------------
echo; echo "SCENARIO 2 — delivery-gate.sh : artifacts + verdict + completeness + test suite"
# ----------------------------------------------------------------------
v=$(mkvault s2)
run_case "2.1 empty vault -> brief missing"         1 "brief.md missing"     bash "$DELIVERY" "$v" true
printf 'b\n' > "$v/brief.md"
run_case "2.2 brief only -> plan missing"           1 "plan.md missing"      bash "$DELIVERY" "$v" true
printf 'p\n' > "$v/plan.md"
run_case "2.3 no verification -> missing"           1 "verification.md missing" bash "$DELIVERY" "$v" true
printf 'no verdict here\n' > "$v/verification.md"
run_case "2.4 no 'verdict: GREEN'"                  1 "no 'verdict: GREEN'"  bash "$DELIVERY" "$v" true
# A5 case (was 'test manually'): GREEN then a later line-start RED fails before completeness.
printf 'verdict: GREEN\n... later ...\nverdict: RED\n' > "$v/verification.md"
run_case "2.5 GREEN then later RED -> RED remains"  1 "verdict: RED"         bash "$DELIVERY" "$v" true
# Completeness contract: GREEN but missing each required section in turn (the false-GREEN guard).
printf 'verdict: GREEN\n' > "$v/verification.md"
run_case "2.5b GREEN, no ## Coverage -> blocked"    1 "no '## Coverage'"     bash "$DELIVERY" "$v" true
printf 'verdict: GREEN\n## Coverage\n- AC1: GREEN\n' > "$v/verification.md"
run_case "2.5c Coverage, no Not-covered -> blocked" 1 "no 'Not covered:'"    bash "$DELIVERY" "$v" true
printf 'verdict: GREEN\n## Coverage\n- AC1: GREEN\nNot covered: none\n' > "$v/verification.md"
run_case "2.5d no Regression line -> blocked"       1 "no 'Regression tests:'" bash "$DELIVERY" "$v" true
# Contract-complete verification for the PASS / downstream-check paths.
write_complete_verif "$v"
printf 'b\nThe NO-GO bar is high.\nDecision: GO\n' > "$v/brief.md"
run_case "2.6 complete + Decision GO + prose NO-GO" 0 "GATE PASS"            bash "$DELIVERY" "$v" true
printf 'b\nDecision: NO-GO\n' > "$v/brief.md"
run_case "2.7 Decision NO-GO -> blocked"            1 "decision is NO-GO"    bash "$DELIVERY" "$v" true
printf 'b\nno decision line (debug/legacy)\n' > "$v/brief.md"
run_case "2.8 no Decision line -> PASS"             0 "GATE PASS"            bash "$DELIVERY" "$v" true
run_case "2.9 valid + test-cmd false -> fail"       1 "test suite did not pass" bash "$DELIVERY" "$v" false
run_case "2.10 valid + test-cmd true -> PASS"       0 "GATE PASS"            bash "$DELIVERY" "$v" true
# 2.11: no test-cmd, run from a clean dir with no detectable runner.
v_clean=$(mkvault s2clean)
cp "$v/brief.md" "$v/plan.md" "$v/verification.md" "$v_clean/" 2>/dev/null
run_case "2.11 no test-cmd, no runner -> blocked"   1 "no test command"     \
  bash -c "cd '$v_clean' && bash '$DELIVERY' . "
# 2.12-2.13: QA backstop — a qa/ dir makes delivery enforce the browser QA gate too.
v_qa=$(mkvault s2qa)
printf 'b\n' > "$v_qa/brief.md"; printf 'p\n' > "$v_qa/plan.md"
write_complete_verif "$v_qa"
mkdir -p "$v_qa/qa"; : > "$v_qa/qa/as-is-1040.png"; : > "$v_qa/qa/to-be-1040.png"
run_case "2.12 qa/ dir, QA non-compliant -> blocked" 1 "QA gate fails"      bash "$DELIVERY" "$v_qa" true
printf 'verdict: GREEN\n## Coverage\n- AC1: GREEN\nNot covered: none\nRegression tests: none\n## QA\nagent-browser doctor: pass\nTool: agent-browser\n' > "$v_qa/verification.md"
run_case "2.13 qa/ dir + compliant QA -> PASS"       0 "GATE PASS"          bash "$DELIVERY" "$v_qa" true

# ----------------------------------------------------------------------
echo; echo "SCENARIO 3 — human-feedback-gate.mjs : briefs, ordering, approval"
# ----------------------------------------------------------------------
v=$(mkvault s3)
write_state "$v" '{"phase":"Build","status":"APPROVED"}'
run_case "3.1 no plan.md -> cannot read"            1 "cannot read"         node "$HFGATE" "$v" Build
write_valid_plan "$v"
run_case "3.6 full valid, target Build -> PASS"     0 "HUMAN FEEDBACK GATE PASS" node "$HFGATE" "$v" Build
run_case "3.5 approved Build, target Fix -> mismatch" 1 "expected 'Fix'"    node "$HFGATE" "$v" Fix
write_state "$v" 'null'
run_case "3.4 approval null -> not APPROVED"        1 "not APPROVED"        node "$HFGATE" "$v" Build
write_state "$v" '{"phase":"Build","status":"APPROVED"}'
# Swap order: technical above plain.
write_valid_plan "$v"
node -e 'const f=process.argv[1];let s=require("fs").readFileSync(f,"utf8");
const p=s.match(/### Plain-language brief[\s\S]*?(?=### Technical)/)[0];
const t=s.match(/### Technical brief[\s\S]*?(?=### Terms)/)[0];
s=s.replace(p,"@@P@@").replace(t,"@@T@@").replace("@@P@@",t).replace("@@T@@",p);
require("fs").writeFileSync(f,s);' "$v/plan.md"
run_case "3.3 plain below technical -> ordering"    1 "must appear above"   node "$HFGATE" "$v" Build
# Empty Human Feedback section -> gate treats empty == missing section.
printf '# Plan\n\n## Human Feedback\n\n## Other\nstuff\n' > "$v/plan.md"
run_case "3.7a empty HF section == missing"         1 "missing 'Human Feedback'" node "$HFGATE" "$v" Build
# HF section has prose but no required ### subsections -> first missing subsection reported.
printf '# Plan\n\n## Human Feedback\nSome intro prose but no subsections.\n\n## Other\nx\n' > "$v/plan.md"
run_case "3.7b HF present, no subsections"          1 "Plain-language brief" node "$HFGATE" "$v" Build
# No Human Feedback section at all.
printf '# Plan\n\n## Scope\nstuff\n' > "$v/plan.md"
run_case "3.2 no Human Feedback section"            1 "missing 'Human Feedback'" node "$HFGATE" "$v" Build
# Thin plain brief (<20 words).
write_valid_plan "$v"
node -e 'const f=process.argv[1];let s=require("fs").readFileSync(f,"utf8");
s=s.replace(/### Plain-language brief\n[\s\S]*?\n\n### Technical/,"### Plain-language brief\nToo short to review.\n\n### Technical");
require("fs").writeFileSync(f,s);' "$v/plan.md"
run_case "3.8 thin plain brief -> too thin"         1 "too thin"            node "$HFGATE" "$v" Build
# Terms with no 'term: definition'.
write_valid_plan "$v"
node -e 'const f=process.argv[1];let s=require("fs").readFileSync(f,"utf8");
s=s.replace(/### Terms\n[\s\S]*?\n\n### Approval/,"### Terms\n- just a bullet with no colon\n\n### Approval");
require("fs").writeFileSync(f,s);' "$v/plan.md"
run_case "3.9 Terms without definition -> fail"     1 "must define at least one term" node "$HFGATE" "$v" Build
run_case "3.10 bad usage (missing phase) -> exit 2" 2 "usage"               node "$HFGATE" "$v"

# ----------------------------------------------------------------------
echo; echo "SCENARIO 4 — circuit-breaker.mjs : trip, threshold, persistence"
# ----------------------------------------------------------------------
v=$(mkvault s4)
printf '{ "circuit_breaker_threshold": 3, "error_signatures": {} }\n' > "$v/state.json"
run_case "4.1 sig X #1 -> below (0)"                0 "1/3"   node "$BREAKER" "$v/state.json" "assert-eq foo.js:10"
run_case "4.2 sig X #2 -> below (0)"                0 "2/3"   node "$BREAKER" "$v/state.json" "assert-eq foo.js:10"
run_case "4.3 sig X #3 -> TRIP (1)"                 1 "TRIP"  node "$BREAKER" "$v/state.json" "assert-eq foo.js:10"
run_case "4.4 state persisted count == 3"           0 "count=3" node -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1])).error_signatures["assert-eq foo.js:10"];console.log("count="+c);process.exit(c===3?0:1)' "$v/state.json"
run_case "4.5 different sig Y -> independent (0)"   0 "1/3"   node "$BREAKER" "$v/state.json" "type-error bar.js:9"
# Custom threshold = 2.
printf '{ "circuit_breaker_threshold": 2, "error_signatures": {} }\n' > "$v/state2.json"
run_case "4.6a thr=2 sig #1 -> below"               0 "1/2"   node "$BREAKER" "$v/state2.json" "boom"
run_case "4.6b thr=2 sig #2 -> TRIP"                1 "TRIP"  node "$BREAKER" "$v/state2.json" "boom"
run_case "4.7 missing state file -> exit 2"         2 "cannot read/parse"   node "$BREAKER" "$v/nope.json" "x"
run_case "4.8 missing signature arg -> exit 2"      2 "usage"               node "$BREAKER" "$v/state.json"
# Defensive normalization: whitespace/case drift collapses to one key, so the breaker still trips.
printf '{ "circuit_breaker_threshold": 3, "error_signatures": {} }\n' > "$v/state3.json"
node "$BREAKER" "$v/state3.json" "Err" >/dev/null 2>&1
node "$BREAKER" "$v/state3.json" "err" >/dev/null 2>&1
run_case "4.9 whitespace/case drift still trips"     1 "TRIP" node "$BREAKER" "$v/state3.json" "err  "
run_case "4.10 whitespace-only signature -> exit 2"  2 "empty after normalization" node "$BREAKER" "$v/state3.json" "   "

# ----------------------------------------------------------------------
echo; echo "SCENARIO 5 — end-to-end against the REAL committed example vaults"
# ----------------------------------------------------------------------
if [ -d "$EX" ]; then
  run_case "5.1 example suite runs green (node --test)" 0 "pass" \
    bash -c "cd '$EX' && node --test 2>&1"
  run_case "5.2 delivery gate on REAL url-shortener vault" 0 "GATE PASS" \
    bash -c "cd '$EX' && bash '$DELIVERY' docs/changelog/url-shortener-service 'node --test'"
  run_case "5.3 delivery gate on REAL legacy vault (no Decision)" 0 "GATE PASS" \
    bash -c "cd '$EX' && bash '$DELIVERY' docs/changelog/legacy-link-expiry 'node --test'"
  run_case "5.4 delivery gate on REAL debug vault (no Decision)" 0 "GATE PASS" \
    bash -c "cd '$EX' && bash '$DELIVERY' docs/changelog/debug-hit-undercount 'node --test'"
  run_case "5.5 validate gate on REAL url-shortener brief" 0 "VALIDATE GATE PASS" \
    bash "$VALIDATE" "$EX/docs/changelog/url-shortener-service"
else
  echo "  SKIP  example project not found at $EX"
fi

# ----------------------------------------------------------------------
echo; echo "SCENARIO 6 — qa-gate.sh : agent-browser usage + as-is/to-be evidence enforcement"
# ----------------------------------------------------------------------
QAGATE="$SKILL_DIR/templates/qa-gate.sh"
v=$(mkvault s6)
run_case "6.0 missing app-type -> usage (exit 2)"   2 "usage"                bash "$QAGATE" "$v"
run_case "6.0b bad app-type -> usage (exit 2)"      2 "usage"                bash "$QAGATE" "$v" mobile
run_case "6.1 no verification.md -> blocked"        1 "verification.md missing" bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\nno qa section here\n' > "$v/verification.md"
run_case "6.2 no ## QA section -> blocked"          1 "no '## QA' section"   bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\n## QA\nintegration smoke: bin vs fixture snapshot matches\n' > "$v/verification.md"
run_case "6.3 CLI: ## QA present -> PASS"           0 "QA GATE PASS"         bash "$QAGATE" "$v" cli
run_case "6.4 browser, no as-is/to-be -> blocked"   1 "no 'qa/as-is"         bash "$QAGATE" "$v" browser
mkdir -p "$v/qa"; : > "$v/qa/as-is-1040.png"
run_case "6.5 as-is only, no to-be -> blocked"      1 "no 'qa/to-be"         bash "$QAGATE" "$v" browser
: > "$v/qa/to-be-1040.png"
run_case "6.6 evidence but no preflight -> blocked" 1 "no 'agent-browser doctor'" bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\n## QA\nagent.browsers.list(): []\nnpx -p playwright node ...\nTool: headless Chrome\nFallback: iab target list was empty\n' > "$v/verification.md"
run_case "6.6b iab/Playwright fallback without agent-browser preflight -> blocked" 1 "no 'agent-browser doctor'" bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\n## QA\nagent-browser doctor: pass\nTool: agent-browser\n- as-is/to-be at 1040px captured\n' > "$v/verification.md"
run_case "6.7 agent-browser + evidence -> PASS"     0 "QA GATE PASS"         bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\n## QA\nagent-browser doctor: fail socket permission\nTool: headless Chrome\n- render-1040 captured\n' > "$v/verification.md"
run_case "6.8 headless-Chrome, no Fallback -> blocked" 1 "no 'Fallback:'"    bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\n## QA\nagent-browser doctor: fail npm registry blocked\nTool: headless Chrome\nFallback: npm registry blocked; agent-browser install 403\n- as-is/to-be captured\n' > "$v/verification.md"
run_case "6.9 fallback driver + justification -> PASS" 0 "QA GATE PASS"      bash "$QAGATE" "$v" browser

# ----------------------------------------------------------------------
echo; echo "SCENARIO 7 — contrast-gate.mjs : computed WCAG ratios (UI/UX)"
# ----------------------------------------------------------------------
CONTRAST="$SKILL_DIR/templates/contrast-gate.mjs"
v=$(mkvault s7)
run_case "7.0 missing pairs file -> usage (exit 2)" 2 "usage"  node "$CONTRAST"
printf 'not json\n' > "$v/bad.json"
run_case "7.1 unparseable JSON -> exit 2"           2 "cannot read/parse" node "$CONTRAST" "$v/bad.json"
printf '[]\n' > "$v/empty.json"
run_case "7.2 empty array -> exit 2"                2 "non-empty"  node "$CONTRAST" "$v/empty.json"
printf '[{"el":"x","fg":"#zzz","bg":"#fff","size":"normal"}]\n' > "$v/badcolor.json"
run_case "7.3 non-hex color -> exit 2"              2 "not an opaque hex" node "$CONTRAST" "$v/badcolor.json"
printf '[{"el":"x","fg":"#000","bg":"#fff","size":"weird"}]\n' > "$v/badsize.json"
run_case "7.4 unknown size -> exit 2"               2 "unknown size" node "$CONTRAST" "$v/badsize.json"
# Real values from docs/examples/workflow-landing/verification.md: term-title 4.37 < 4.5 = FAIL.
printf '[{"el":"body","fg":"#f4efe7","bg":"#16140f","size":"body"},{"el":"term-title","fg":"#8a8275","bg":"#221e17","size":"normal"}]\n' > "$v/fail.json"
run_case "7.5 sub-AA pair (4.37) -> FAIL exit 1"    1 "below WCAG threshold" node "$CONTRAST" "$v/fail.json"
# After the documented fix (#8a8275 -> #9a9081 = 5.28): PASS.
printf '[{"el":"body","fg":"#f4efe7","bg":"#16140f","size":"body"},{"el":"term-title","fg":"#9a9081","bg":"#221e17","size":"normal"}]\n' > "$v/pass.json"
run_case "7.6 fixed palette -> PASS exit 0"         0 "CONTRAST GATE PASS" node "$CONTRAST" "$v/pass.json"
# Body copy that only clears AA (4.5) but not AAA (7) must FAIL when tagged size:body.
printf '[{"el":"lead","fg":"#8a8275","bg":"#100e0a","size":"body"}]\n' > "$v/bodyaa.json"
run_case "7.7 body tier needs AAA -> FAIL"          1 "below WCAG threshold" node "$CONTRAST" "$v/bodyaa.json"
# Decorative pair below 3:1 is allowed (not text).
printf '[{"el":"dot","fg":"#3f3b35","bg":"#221e17","size":"decorative"}]\n' > "$v/decor.json"
run_case "7.8 decorative pair -> PASS"              0 "CONTRAST GATE PASS" node "$CONTRAST" "$v/decor.json"

# ----------------------------------------------------------------------
echo
echo "=================================================================="
printf " RESULT: %d passed, %d failed\n" "$PASS" "$FAIL"
echo "=================================================================="
[ "$FAIL" = 0 ]
