# 2026-06-02 - QA phase made machine-enforceable (qa-gate.sh)

## Branch-scoped worktree workflow for coding/debug runs

### Decision

Require every GREENFIELD, DEBUG, and LEGACY run to ask for branch integration details before any repo
mutation: ask the user for the base git branch and target branch, default target to base when the user
only provides one branch, create a dedicated run branch/worktree from base, perform Build/Fix work
inside that worktree, then merge the accepted result into target and remove the worktree only after
user acceptance.

### Reasoning

Multiple agents editing one checkout create avoidable conflicts and make it unclear which dirty state
is authoritative. A branch-scoped worktree gives each run a clean edit surface, keeps the original
checkout available for orchestration and integration, and makes the final merge into the requested
target branch explicit instead of implicit.

## Decision

Convert the QA phase's "drive the app with agent-browser + capture as-is/to-be evidence" rule from
prose (`reference/qa.md`) into a literal, machine-checkable gate, so it matches every other gate in
the skill instead of being instruction-only.

- `templates/qa-gate.sh` (NEW): `qa-gate.sh <vault> <browser|cli>`. For a browser app it requires a
  `## QA` section in `verification.md`, `qa/as-is-*` + `qa/to-be-*` evidence files, an
  `agent-browser doctor` preflight record, a `Tool:` line naming the driver, and — if that driver is
  NOT agent-browser — a `Fallback:` line justifying why agent-browser was impossible. CLI/lib only
  needs a `## QA` section (no browser). Usage errors exit 2, gate failures exit 1, parallel to
  `validate-gate.sh` / `delivery-gate.sh`. NEVER edited to pass.
- `reference/pipeline.md`: GREENFIELD + LEGACY QA exit-gate cells now require `qa-gate.sh` exits 0.
- `agents/qa-tester.md`: rewrote DO/RULES/WRITE/GATE — first browser step is now "check `command -v
  agent-browser`, install if absent, only fall back with a recorded reason"; the `## QA` record MUST
  carry the `Tool:`/`Fallback:` lines and exact `as-is-<view>`/`to-be-<view>` names; GATE invokes
  `qa-gate.sh`.
- `reference/qa.md`: vault-record section now mandates the `Tool:`/`Fallback:` lines and exact evidence
  names; added an "Exit gate (machine-checkable)" section pointing at `qa-gate.sh`.
- `SKILL.md`: added the `qa-gate.sh` row to the Template scripts table.
- `tests/gate-scenarios.test.sh`: added SCENARIO 6 (cases 6.0-6.9) — usage, CLI-passes, missing
  evidence, missing `Tool:`, agent-browser PASS, silent headless-Chrome BLOCKED, fallback+justification
  PASS. Suite now 62/62 green.
- `docs/e2e-test-plan.md`: Tier A table + new A12-A16 subsection document the qa-gate scenarios.

### Follow-up reinforcements (same day)

- **Two-step install** (`reference/qa.md`, `agents/qa-tester.md`): the skill only ran `npm i -g
  agent-browser` and never `agent-browser install` (downloads the Chrome-for-Testing binary, first
  time only). On a fresh machine the CLI is on PATH but `open` fails with no browser — a likely cause
  of the silent fallback. Both files now mandate BOTH steps and state that a missing browser binary is
  NOT "install impossible".
- **Delivery QA backstop** (`templates/delivery-gate.sh`): if the vault has a `qa/` dir (browser-QA
  evidence), delivery now also runs `qa-gate.sh <vault> browser` — defense-in-depth so a non-compliant
  QA cannot slip past the final gate. CLI/DEBUG runs have no `qa/` dir, so they are unaffected. Tests
  2.12-2.13 added; suite now 64/64 green.
- **Contrast gate** (`templates/contrast-gate.mjs`, NEW): the UI/UX rule "contrast is computed, not
  eyeballed" (`reference/ui-ux.md`, taste §14) had no committed enforcement — the QA agent hand-wrote a
  throwaway `_verify_contrast.js` per run (never committed), so the ratio could be eyeballed or
  hallucinated. The new gate splits responsibility: the agent enumerates the text/bg pairs it found
  into `qa/contrast-pairs.json` (`{el, fg, bg, size}`), and the script computes the WCAG 2.x ratios and
  judges them (body AAA >=7, normal AA >=4.5, large >=3, decorative skip). Exit 1 on any sub-threshold
  text pair, exit 2 on usage/parse error. Verified the math reproduces the real workflow-landing
  verification exactly (term-title 4.37 FAIL -> 5.28 PASS after the documented `#8a8275`->`#9a9081`
  fix). Wired into `reference/ui-ux.md` QA overlay + SKILL.md template table; SCENARIO 7 (cases 7.0-7.8)
  added. Suite now 73/73 green.

## Reasoning

- Empirical trigger: the most recent real browser-QA run (`docs/changelog/2026-05-31-polish-readme-landing`)
  did NOT use agent-browser. It rendered with headless Chrome and saved `render-*.png` instead of the
  mandated `as-is/to-be-*.png`. agent-browser was (and is) installed (`agent-browser@0.20.0` on PATH),
  so there was no install excuse — the run simply skipped the sanctioned driver.
- Root cause: QA was the ONLY major gate with no machine-checkable script. Validate, Human Feedback,
  Delivery, and the circuit breaker all have one; the QA exit gate ("golden + edge + a11y pass") was
  pure prose, and `delivery-gate.sh` never inspects `qa/` evidence. So a silent fallback (or a skipped
  browser pass) could not be caught — exactly the false-confidence failure mode the rest of the skill
  is engineered against.
- The 2026-05-31 changelog already flagged this deviation but fixed it with prose only ("root cause was
  runtime non-compliance, not a skill defect"). Prose without enforcement lets the same non-compliance
  recur. This adds the enforcement; the agent-browser-first preference and the modes/gates are unchanged.
- Design choices: the gate takes the app-type explicitly (`browser|cli`) rather than guessing, so a CLI
  run is never wrongly asked for browser evidence; it is wired into the per-mode QA exit gate (not the
  mode-agnostic `delivery-gate.sh`) because QA is conditional on app type; the `Fallback:` line is the
  precise backstop — agent-browser stays preferred, a justified fallback is still allowed, only a SILENT
  fallback fails.
