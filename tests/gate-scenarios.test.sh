#!/usr/bin/env bash
# /supergoal - runnable gate scenario suite for the gates that survive baseline-first:
# qa-gate.sh, contrast-gate.mjs, and learn-grounding-gate.mjs. Every case asserts BOTH the gate's
# exit code AND a substring of its output, so a pass requires two independent signals (guards
# against silently-wrong gates and fabricated output).
#
# Removed-gate scenarios (validate-gate, delivery-gate, human-feedback-gate, circuit-breaker,
# cycle-bound) were deleted when baseline-first removed those gates; see log/changelog-2026-06-07.md.
#
# Usage: bash tests/gate-scenarios.test.sh   (exit 0 only if all cases pass; run from repo root)

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT

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

echo "=================================================================="
echo " /supergoal gate scenarios   skill: $SKILL_DIR"
echo " node $(node --version)   bash ${BASH_VERSION%%(*}"
echo "=================================================================="

# ----------------------------------------------------------------------
echo; echo "SCENARIO 6 — qa-gate.sh : playwright-cli single-driver + as-is/to-be evidence enforcement"
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
mkdir -p "$v/qa"; printf 'as-is proof\n' > "$v/qa/as-is-1040.png"
run_case "6.5 as-is only, no to-be -> blocked"      1 "no 'qa/to-be"         bash "$QAGATE" "$v" browser
printf 'to-be proof\n' > "$v/qa/to-be-1040.png"
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\n- as-is/to-be at 1040px captured\n' > "$v/verification.md"
: > "$v/qa/as-is-1040.png"
run_case "6.6 empty as-is evidence -> blocked"      1 "empty 'qa/as-is"      bash "$QAGATE" "$v" browser
printf 'as-is proof\n' > "$v/qa/as-is-1040.png"; : > "$v/qa/to-be-1040.png"
run_case "6.6b empty to-be evidence -> blocked"     1 "empty 'qa/to-be"      bash "$QAGATE" "$v" browser
printf 'to-be proof\n' > "$v/qa/to-be-1040.png"
printf 'verdict: GREEN\n## QA\n- as-is/to-be at 1040px captured\n' > "$v/verification.md"
run_case "6.6c evidence but no Tool line -> blocked" 1 "no 'Tool:' line"     bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\n## QA\nTool: agent-browser\n- as-is/to-be at 1040px captured\n' > "$v/verification.md"
run_case "6.7 agent-browser driver -> blocked"      1 "not playwright-cli"   bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\nTool: playwright-cli\n## QA\nTool: agent-browser\n- as-is/to-be at 1040px captured\n' > "$v/verification.md"
run_case "6.7b non-QA Tool cannot mask QA driver"   1 "not playwright-cli"   bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\n## QA\nTool: headless Chrome\n- render-1040 captured\n' > "$v/verification.md"
run_case "6.8 headless-Chrome render -> blocked"    1 "not playwright-cli"   bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\n- as-is/to-be at 1040px captured\n' > "$v/verification.md"
run_case "6.9 playwright-cli + evidence -> PASS"    0 "QA GATE PASS"         bash "$QAGATE" "$v" browser

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
echo; echo "SCENARIO 9 — qa-gate.sh : contrast gate is wired in for UI runs"
# ----------------------------------------------------------------------
QAGATE="$SKILL_DIR/templates/qa-gate.sh"
v=$(mkvault s9); mkdir -p "$v/qa"; printf 'as-is proof\n' > "$v/qa/as-is-1040.png"; printf 'to-be proof\n' > "$v/qa/to-be-1040.png"
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\nUI-tier: Functional\n- as-is/to-be captured\n' > "$v/verification.md"
run_case "9.1 UI-tier declared, no pairs file -> blocked" 1 "no 'qa/contrast-pairs.json'" bash "$QAGATE" "$v" browser
printf '[{"el":"body","fg":"#f4efe7","bg":"#16140f","size":"body"},{"el":"t","fg":"#8a8275","bg":"#221e17","size":"normal"}]\n' > "$v/qa/contrast-pairs.json"
run_case "9.2 UI-tier + sub-AA pair -> blocked"      1 "contrast gate failed" bash "$QAGATE" "$v" browser
printf '[{"el":"body","fg":"#f4efe7","bg":"#16140f","size":"body"},{"el":"t","fg":"#9a9081","bg":"#221e17","size":"normal"}]\n' > "$v/qa/contrast-pairs.json"
run_case "9.3 UI-tier + passing palette -> PASS"     0 "QA GATE PASS"         bash "$QAGATE" "$v" browser
# No UI-tier and no pairs file: contrast block is skipped, behaviour unchanged.
rm -f "$v/qa/contrast-pairs.json"
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\n- as-is/to-be captured\n' > "$v/verification.md"
run_case "9.4 no UI-tier, no pairs -> PASS (unaffected)" 0 "QA GATE PASS"     bash "$QAGATE" "$v" browser

# ----------------------------------------------------------------------
echo; echo "SCENARIO 11 — learn-grounding-gate.mjs : LEARN-DOMAIN wiki must be execution-grounded"
# ----------------------------------------------------------------------
LEARNGATE="$SKILL_DIR/templates/learn-grounding-gate.mjs"
# Build a populated .domain-agent pack that should PASS.
mkpack() {
  local d="$T/$1/.domain-agent"; rm -rf "$d"; mkdir -p "$d/flows"
  printf '{ "version": 1, "lastUpdated": "2026-06-04" }\n' > "$d/config.json"
  printf '# Index\n## Common Entry Points\n- "refund a charge": POST /api/refunds -> RefundController.refund\n' > "$d/index.md"
  printf '# Invariants\n## Rules\n### Refund never exceeds capture\n- Rule: refund <= captured\n- Grounding: verified -- ran RefundServiceTest.refundCapped, green\n' > "$d/invariants.md"
  printf '# Refund Flow\n## Verification\n- Grounding: verified -- probe ran green\n' > "$d/flows/refund.md"
  echo "$d"
}
p=$(mkpack s11)
run_case "11.0 missing path -> usage (exit 2)"       2 "usage"                node "$LEARNGATE"
run_case "11.1 grounded pack -> PASS"                0 "LEARN-GROUNDING GATE PASS" node "$LEARNGATE" "$p"
# Real invariant heading with a generic type must still be grounding-checked (not treated as placeholder).
printf '# Invariants\n## Rules\n### Queue<Message> capacity rule\n- Rule: queue must not overflow\n- Confidence: high\n' > "$p/invariants.md"
run_case "11.1b generic-type heading still checked"  1 "missing 'Grounding"   node "$LEARNGATE" "$p"
printf '# Invariants\n## Rules\n### Refund never exceeds capture\n- Grounding: verified -- ran test\n' > "$p/invariants.md"
# Ungrounded invariant (no Grounding marker).
printf '# Invariants\n## Rules\n### Refund never exceeds capture\n- Rule: refund <= captured\n- Confidence: high\n' > "$p/invariants.md"
run_case "11.2 ungrounded invariant -> blocked"      1 "missing 'Grounding"   node "$LEARNGATE" "$p"
# Template-only invariants (placeholder heading) -> no populated invariant.
printf '# Invariants\n## Rules\n### `<invariant>`\n- Grounding: `verified -- <x> | unverified -- <y>`\n' > "$p/invariants.md"
run_case "11.3 template-only invariants -> blocked"  1 "no populated invariant" node "$LEARNGATE" "$p"
# Restore good invariants; placeholder-only entry points must fail.
printf '# Invariants\n## Rules\n### Real rule\n- Grounding: verified -- ran test\n' > "$p/invariants.md"
printf '# Index\n## Common Entry Points\n- "<user wording>": <route or symbol>\n' > "$p/index.md"
run_case "11.4 placeholder-only entry point -> blocked" 1 "no concrete"        node "$LEARNGATE" "$p"
# Restore index; secret in a flow file must fail.
printf '# Index\n## Common Entry Points\n- "refund": POST /api/refunds -> RefundController.refund\n' > "$p/index.md"
printf '# Refund Flow\n## Verification\n- Grounding: verified -- probe green\nAKIAIOSFODNN7EXAMPLE\n' > "$p/flows/refund.md"
run_case "11.5 secret in pack -> blocked"            1 "AWS access key"        node "$LEARNGATE" "$p"
# No flow files at all -> blocked.
rm -f "$p/flows/refund.md"
run_case "11.6 no flow files -> blocked"             1 "no flows"              node "$LEARNGATE" "$p"

# ----------------------------------------------------------------------
echo
echo "=================================================================="
printf " RESULT: %d passed, %d failed\n" "$PASS" "$FAIL"
echo "=================================================================="
[ "$FAIL" = 0 ]
