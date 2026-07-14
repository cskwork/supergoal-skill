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
run_case "6.1 no QA.md -> blocked"                  1 "QA.md missing"          bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\nno qa section here\n' > "$v/QA.md"
run_case "6.2 no ## QA section -> blocked"          1 "no '## QA' section"   bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\n## QA\nintegration smoke: bin vs fixture snapshot matches\n' > "$v/QA.md"
run_case "6.3 CLI: ## QA present -> PASS"           0 "QA GATE PASS"         bash "$QAGATE" "$v" cli
run_case "6.4 browser, no as-is/to-be -> blocked"   1 "no 'qa/as-is"         bash "$QAGATE" "$v" browser
mkdir -p "$v/qa"; printf 'as-is proof\n' > "$v/qa/as-is-1040.png"
run_case "6.5 as-is only, no to-be -> blocked"      1 "no 'qa/to-be"         bash "$QAGATE" "$v" browser
printf 'to-be proof\n' > "$v/qa/to-be-1040.png"
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\n- as-is/to-be at 1040px captured\n' > "$v/QA.md"
: > "$v/qa/as-is-1040.png"
run_case "6.6 empty as-is evidence -> blocked"      1 "empty 'qa/as-is"      bash "$QAGATE" "$v" browser
printf 'as-is proof\n' > "$v/qa/as-is-1040.png"; : > "$v/qa/to-be-1040.png"
run_case "6.6b empty to-be evidence -> blocked"     1 "empty 'qa/to-be"      bash "$QAGATE" "$v" browser
printf 'to-be proof\n' > "$v/qa/to-be-1040.png"
printf 'verdict: GREEN\n## QA\n- as-is/to-be at 1040px captured\n' > "$v/QA.md"
run_case "6.6c evidence but no Tool line -> blocked" 1 "no 'Tool:' line"     bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\n## QA\nTool: agent-browser\n- as-is/to-be at 1040px captured\n' > "$v/QA.md"
run_case "6.7 agent-browser driver -> blocked"      1 "not playwright-cli"   bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\nTool: playwright-cli\n## QA\nTool: agent-browser\n- as-is/to-be at 1040px captured\n' > "$v/QA.md"
run_case "6.7b non-QA Tool cannot mask QA driver"   1 "not playwright-cli"   bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\n## QA\nTool: headless Chrome\n- render-1040 captured\n' > "$v/QA.md"
run_case "6.8 headless-Chrome render -> blocked"    1 "not playwright-cli"   bash "$QAGATE" "$v" browser
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\n- as-is/to-be at 1040px captured\n' > "$v/QA.md"
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
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\nUI-tier: Functional\n- as-is/to-be captured\n' > "$v/QA.md"
run_case "9.1 UI-tier declared, no pairs file -> blocked" 1 "no 'qa/contrast-pairs.json'" bash "$QAGATE" "$v" browser
printf '[{"el":"body","fg":"#f4efe7","bg":"#16140f","size":"body"},{"el":"t","fg":"#8a8275","bg":"#221e17","size":"normal"}]\n' > "$v/qa/contrast-pairs.json"
run_case "9.2 UI-tier + sub-AA pair -> blocked"      1 "contrast gate failed" bash "$QAGATE" "$v" browser
printf '[{"el":"body","fg":"#f4efe7","bg":"#16140f","size":"body"},{"el":"t","fg":"#9a9081","bg":"#221e17","size":"normal"}]\n' > "$v/qa/contrast-pairs.json"
run_case "9.3 UI-tier + passing palette -> PASS"     0 "QA GATE PASS"         bash "$QAGATE" "$v" browser
# No UI-tier and no pairs file: contrast block is skipped, behaviour unchanged.
rm -f "$v/qa/contrast-pairs.json"
printf 'verdict: GREEN\n## QA\nTool: playwright-cli\n- as-is/to-be captured\n' > "$v/QA.md"
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
echo; echo "SCENARIO 12 — teach-lesson-gate.mjs : a lesson must be an interactive scaffold unit, not a static doc"
# ----------------------------------------------------------------------
TEACHGATE="$SKILL_DIR/templates/teach-lesson-gate.mjs"
v=$(mkvault s12)
run_case "12.0 missing path -> usage (exit 2)"          2 "usage"                  node "$TEACHGATE"
run_case "12.1 scaffold template -> PASS"               0 "TEACH LESSON GATE PASS"  node "$TEACHGATE" "$SKILL_DIR/templates/teach/assets/lesson-template.html"
# Reading-only article: inline <style>, no scaffold assets, no quiz, even promises a check it never renders.
cat > "$v/reading-only.html" <<'HTML'
<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>static</title>
<style>body{font-family:serif}</style></head>
<body><article><h1>레슨</h1><p>설명만 있는 정적 문서.</p>
<p>아래 이해 점검으로 확인하자.</p></article></body></html>
HTML
run_case "12.2 reading-only doc -> FAIL exit 1"         1 "reading-only"           node "$TEACHGATE" "$v/reading-only.html"
# Has .sg-quiz markup but inline + no shared assets / book shell -> still off-scaffold.
cat > "$v/no-scaffold.html" <<'HTML'
<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>x</title></head>
<body><div class="sg-quiz"><ul class="sg-options"><li data-correct>a</li><li>b</li></ul></div></body></html>
HTML
run_case "12.3 quiz but no scaffold/book -> FAIL"       1 "lesson.css"             node "$TEACHGATE" "$v/no-scaffold.html"
run_case "12.4 dir scan flags off-spec lessons -> FAIL" 1 "FAIL"                   node "$TEACHGATE" "$v"

# ----------------------------------------------------------------------
echo; echo "SCENARIO 13 — commit-gate.sh : a non-green run must not commit (unchecked criterion, failed/incomplete QA, pending approval, missing Z marker)"
# ----------------------------------------------------------------------
COMMITGATE="$SKILL_DIR/templates/commit-gate.sh"
mkgreen() {  # write a fully-GREEN run vault (GOAL/PLAN/QA/Z) into $1
  cat > "$1/GOAL.md" <<'EOF'
# GOAL - s13
## Original Request
> preserve existing behavior
## Spec
smallest correct change to src/app.js
## Success Criteria
- [x] preserve existing behavior - verify: `npm test`
## QA Cases (web apps only)
## Decision Gates
| ID | Action | Status | Finding | Decision | Recheck |
|---|---|---|---|---|---|
| d1 | auto-fix | resolved | lint | fixed | reran |
EOF
  cat > "$1/PLAN.md" <<'EOF'
# PLAN - s13
## Approval
- Status: approved-by-user
- Record: 2026-07-06 user said OK
## Intent
- Completion promise: suite green via npm test; stop when green; max_iterations 8
## Steps
1. edit src/app.js
## Tools & Skills
- npm test
EOF
  cat > "$1/QA.md" <<'EOF'
# QA - s13
- Verdict: PASS
## Before
- [x] baseline captured before change - `npm test` output saved
## Results
- [x] suite green after change - `npm test` (frozen_repo)

Backward-trace: clean
## Commands
| Command | Source | Proves |
|---|---|---|
| npm test | frozen_repo | suite green |
## QA
Tool: playwright-cli
## Reproduction Fidelity
- Fidelity level: exact
- Residual risk from data gap:
- Post-deploy confirmation plan:
## Residual Risk
- Not proven: load
EOF
  cat > "$1/Z-2026-07-06.md" <<'EOF'
# DONE 2026-07-06
- Branch: run/s13 -> main
- Completed: 2026-07-06T12:00:00+09:00
EOF
  cat > "$1/run-state.json" <<'EOF'
{
  "schema_version": 3,
  "mode": "DEBUG",
  "branches": {
    "source_base_branch": "main",
    "target_integration_branch": "main",
    "run_branch": "run/s13",
    "worktree_path": "/tmp/s13",
    "refs_verified": true
  },
  "phase": "Finalize",
  "iteration": 1,
  "max_iterations": 3,
  "unresolved_gates": [],
  "blockers": [],
  "regression_ledger": [],
  "next_action": "",
  "forced_reflection": null,
  "updated_at": "2026-07-06T12:00:00+09:00"
}
EOF
}
v=$(mkvault s13)
run_case "13.0 no args -> usage (exit 2)"             2 "usage"                    bash "$COMMITGATE"
run_case "13.0b bad app-type -> usage (exit 2)"       2 "usage"                    bash "$COMMITGATE" "$v" mobile
run_case "13.1 no GOAL.md -> blocked"                 1 "GOAL.md missing"          bash "$COMMITGATE" "$v" none
mkgreen "$v"
run_case "13.2 green vault -> PASS"                   0 "COMMIT GATE PASS"         bash "$COMMITGATE" "$v" none
sed 's/| d1 | auto-fix | resolved | lint | fixed | reran |/| d1 | ask-user | open | semantics | pending | - |/' "$v/GOAL.md" > "$v/p"; mv "$v/p" "$v/GOAL.md"
run_case "13.3 open ask-user gate -> blocked"         1 "open decision gate"       bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/^- \[x\] preserve existing behavior.*/- [ ] reject malformed input - verify: `t::rejects` (surfaced: implied by data rule)/' "$v/GOAL.md" > "$v/p"; mv "$v/p" "$v/GOAL.md"
run_case "13.4 unchecked surfaced criterion -> blocked (Z premature)" 1 "unchecked" bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/^- \[x\] preserve existing behavior - verify: `npm test`$/- [x] preserve existing behavior - verify: `npm test` (surfaced: implied by data rule)/' "$v/GOAL.md" > "$v/p"; mv "$v/p" "$v/GOAL.md"
run_case "13.5 ticked surfaced criterion -> PASS"     0 "COMMIT GATE PASS"         bash "$COMMITGATE" "$v" none
sed 's/^- Verdict: PASS$/- Verdict: PARTIAL/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
run_case "13.6 QA verdict PARTIAL -> blocked"         1 "exactly one canonical"    bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/^- Verdict: PASS$/- Verdict: FAIL/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
run_case "13.7 QA verdict FAIL -> blocked"            1 "exactly one canonical"    bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/^- Verdict: PASS$/- Verdict: RED/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
run_case "13.7b unknown QA verdict -> blocked"        1 "exactly one canonical"    bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed '/^- Verdict: PASS$/d' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
run_case "13.7c missing QA verdict -> blocked"        1 "exactly one canonical"    bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/^- Verdict: PASS$/- Verdict: PASS | FAIL | PARTIAL/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
run_case "13.7d placeholder QA verdict -> blocked"    1 "exactly one canonical"    bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed '/^- Verdict: PASS$/a\
- Verdict: PASS' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
run_case "13.7e duplicate QA verdict -> blocked"      1 "exactly one canonical"    bash "$COMMITGATE" "$v" none
mkgreen "$v"
printf 'Verdict: FAIL\n' > "$v/report.md"
run_case "13.7f non-canonical report verdict ignored" 0 "COMMIT GATE PASS"         bash "$COMMITGATE" "$v" none
sed 's/frozen_repo/agent_detected/g' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
run_case "13.8 no trusted command -> blocked"         1 "no trusted command"       bash "$COMMITGATE" "$v" none
mkgreen "$v"; rm -f "$v/report.md"
sed 's/^- \[x\] suite green after change.*/- [ ] suite green after change - `npm test` (frozen_repo)/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
run_case "13.9 unchecked Results row -> blocked"      1 "unchecked row"            bash "$COMMITGATE" "$v" none
mkgreen "$v"
run_case "13.12 app run w/o QA evidence -> blocked"   1 "QA evidence gate failed"  bash "$COMMITGATE" "$v" browser
mkgreen "$v"
sed 's/- Status: approved-by-user/- Status: pending/' "$v/PLAN.md" > "$v/p"; mv "$v/p" "$v/PLAN.md"
run_case "13.13 pending plan approval -> blocked"     1 "approval is pending"      bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/Backward-trace: clean/Backward-trace: orphan src\/bonus.js:1/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
run_case "13.14 orphan Backward-trace -> blocked"      1 "Backward-trace is not clean" bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/Fidelity level: exact/Fidelity level: exact | prod-snapshot | synthetic-representative | synthetic-minimal | not-reproduced/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
run_case "13.15 placeholder fidelity -> blocked"       1 "unknown or placeholder"   bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/Fidelity level: exact/Fidelity level: synthetic-minimal/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
run_case "13.16 non-exact no risk/plan -> blocked"     1 "residual risk"           bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/Fidelity level: exact/Fidelity level: synthetic-minimal/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
sed 's/Residual risk from data gap:/Residual risk from data gap: prod concurrency not fully represented/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
run_case "13.16b non-exact no confirmation -> blocked" 1 "post-deploy confirmation" bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/Fidelity level: exact/Fidelity level: synthetic-minimal/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
sed 's/Residual risk from data gap:/Residual risk from data gap: (pending)/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
sed 's/Post-deploy confirmation plan:/Post-deploy confirmation plan: canary logs after deploy/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
run_case "13.16c parenthesized risk placeholder -> blocked" 1 "residual risk"       bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/Fidelity level: exact/Fidelity level: synthetic-representative/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
sed 's/Residual risk from data gap:/Residual risk from data gap: prod scale and concurrency may still differ; monitor authz-cache-deny-rate/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
sed 's/Post-deploy confirmation plan:/Post-deploy confirmation plan: canary 10% for 30 minutes and compare 403\/200 authz-cache logs/' "$v/QA.md" > "$v/p"; mv "$v/p" "$v/QA.md"
run_case "13.17 difficult synthetic proxy -> PASS"     0 "COMMIT GATE PASS"        bash "$COMMITGATE" "$v" none
mkgreen "$v"
rm -f "$v/Z-2026-07-06.md"
run_case "13.18 missing Z completion marker -> blocked" 1 "completion marker"      bash "$COMMITGATE" "$v" none
mkgreen "$v"
printf '# DONE later\n- Branch: run/s13 -> main\n- Completed: 2026-07-07T09:00:00+09:00\n' > "$v/Z-2026-07-07.md"
run_case "13.19 multiple Z markers -> blocked"          1 "multiple"               bash "$COMMITGATE" "$v" none
rm -f "$v/Z-2026-07-07.md"
: > "$v/Z-2026-07-06.md"
run_case "13.20 empty Z marker -> blocked"              1 "empty"                  bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed '/- Branch: run\/s13 -> main/d' "$v/Z-2026-07-06.md" > "$v/p"; mv "$v/p" "$v/Z-2026-07-06.md"
run_case "13.21 Z marker without branch -> blocked"     1 "Branch:"                bash "$COMMITGATE" "$v" none
mkgreen "$v"
rm -f "$v/run-state.json"
run_case "13.22 missing run-state -> blocked"           1 "run-state.json missing"  bash "$COMMITGATE" "$v" none
mkgreen "$v"
printf '{not json\n' > "$v/run-state.json"
run_case "13.23 malformed run-state -> blocked"         1 "cannot parse"            bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/"refs_verified": true/"refs_verified": false/' "$v/run-state.json" > "$v/p"; mv "$v/p" "$v/run-state.json"
run_case "13.24 unverified refs -> blocked"             1 "refs_verified"           bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/"phase": "Finalize"/"phase": "ExactVerify"/' "$v/run-state.json" > "$v/p"; mv "$v/p" "$v/run-state.json"
run_case "13.25 non-final phase -> blocked"             1 "phase must be Finalize"   bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/"blockers": \[\]/"blockers": ["open red"]/' "$v/run-state.json" > "$v/p"; mv "$v/p" "$v/run-state.json"
run_case "13.26 blockers remain -> blocked"             1 "blockers must be empty"   bash "$COMMITGATE" "$v" none
mkgreen "$v"
sed 's/"unresolved_gates": \[\]/"unresolved_gates": ["ask-user"]/' "$v/run-state.json" > "$v/p"; mv "$v/p" "$v/run-state.json"
run_case "13.27 unresolved gate -> blocked"             1 "unresolved_gates"         bash "$COMMITGATE" "$v" none

# ----------------------------------------------------------------------
echo
echo "=================================================================="
printf " RESULT: %d passed, %d failed\n" "$PASS" "$FAIL"
echo "=================================================================="
[ "$FAIL" = 0 ]
