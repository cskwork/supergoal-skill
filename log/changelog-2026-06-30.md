# Changelog 2026-06-30

## Chore: conservative DRY prune of loaded skill body (writing-great-skills)

### What
Surgical, behavior-neutral prune applying DRY / single-source-of-truth and the mattpocock
writing-great-skills principles (no-op removal, rationale -> changelog). Three edits, no contract
phrase touched; `bash tests/run-all.sh` stays green.

- `reference/ui-ux.md`: removed the trailing "Source note" section. It restated provenance
  ("compressed derivative... refresh by re-pulling upstream") that each derivative file already owns in
  its own banner (`reference/taste-skill-v2.md`, `reference/taste-aesthetics.md`). Provenance now lives
  in one place per file. ~9 lines off a loaded overlay file.
- `reference/debugging.md` step 4 (Confirm): the re-ranking mechanics (non-blocking, AFK-proceed,
  evidence-over-preference) are owned by `reference/interview.md` "DEBUG variant - ranked hypothesis
  re-ranking". Replaced the duplicated inline mechanics with a tight pointer. The contract-pinned phrase
  "present the 3-5 ranked hypotheses to the user for re-ranking" is kept verbatim.
- `reference/role-loop.md` guardrails: moved the eval-derived cost fact out of the body (see below);
  kept the trade-off rule.

### Moved rationale (was in `reference/role-loop.md`)
Cost of the role-separated loop: it runs **several times a single run's effort** (eval-derived
multiplier; see `supergoal-baseline-first` evals and `log/changelog-2026-06-07.md`). The body keeps the
actionable rule only: use the loop when correctness on behavior the visible tests miss matters; for a
quick pass, one build is cheaper.

### Why these and not more (rejected alternatives)
A three-agent audit proposed wider cuts; most were rejected as unsafe or behavior-changing:
- **agents/*.md "duplication" kept.** Each persona loads alone into a fresh subagent that does NOT have
  SKILL.md or other reference files. The repeated orientation ("run in isolation", role constraints,
  install/SQL lines) is intentional self-containment, not DRY waste; replacing it with pointers to
  unloaded files would break the standalone subagent. (Confirmed: `agents/code-reviewer.md` already
  points to role-loop.md AND restates its constraints inline by design.)
- **Contract-pinned phrases kept.** `tests/*-contract.test.sh` pin ~250 exact phrases to specific files
  (e.g. role-loop "Doubt-theater anti-signal", "cap the critic->fixer loop at 3 cycles"; qa-auditor
  "npm install -g @playwright/cli@0.1.14"; interview "Do not rely on model default"). These are
  load-bearing at the string level and were not cut or moved.
- **anti-cheat / anti-Goodhart lines kept.** "never edit the gate to pass", "never fake a pass" are
  defenses central to baseline-first, not no-ops.
- **License/source banners kept** in the compressed derivatives (MIT attribution stays with the file).
- **Cross-mode playwright-cli / DB read-only repetition kept.** Those files load standalone per mode;
  consolidating to pointers trades self-containment robustness for maintenance DRY - deferred to a
  "DRY consolidation" pass if wanted, with eval per baseline-first culture.

Net: ~15 lines off the loaded body, zero behavior change, full contract suite green.

## Feature: Commit gate - a non-green run must not commit

### What
Made "commit only after verification" an explicit, named gate. supergoal already blocked the *done claim*
on unresolved `ask-user` findings and rewound UI runs to Build on QA fail, but nothing tied the blocking
conditions to the commit/merge step itself. Now a single source - `reference/delivery-gate.md`
`## Commit gate` - states that commit/merge into the target/integration branch is blocked while any holds:

- REAL tests or prose spec not green,
- QA verdict FAIL or PARTIAL (incomplete),
- an open requirement in `surfaced-requirements.md`,
- an unresolved `ask-user` decision gate,
- the requirement's fulfillment is uncertain.

Wiring (pointers only; conditions live once in the Commit gate section - DRY):
- `reference/delivery-gate.md`: new `## Commit gate` + a `commit gate passed` bullet in `## Done`.
- `SKILL.md`: run-isolation commit sentence now says commit is hard-gated and points at the Commit gate +
  backstop; `Done =` line gains "commit/merge only after the commit gate passes"; reference-map row and
  both README inventories list the script.
- `reference/role-loop.md`: the commit/merge contract requires the gate to pass; the Verify role's
  blocking sentence now blocks the commit too, not just the done claim.
- NEW `templates/commit-gate.sh` - deterministic backstop, mirrors `qa-only-gate.sh` style. Run
  `bash templates/commit-gate.sh <vault> <browser|cli|none>` before committing; exit 0 is the precondition.
  Six checks: proof present; no open decision gate (catches ask-user and un-filled placeholder rows); no
  open surfaced requirement (only once a real dated heading exists, so a bare template skips); after target
  evidenced AND green (an After-Evidence row with a failing Status blocks); QA verdict clean - blocks on ANY
  FAIL/PARTIAL anywhere in the vault (not just the first line) and on an un-filled `<PASS | FAIL | PARTIAL>`
  placeholder, with browser/CLI delegation to `qa-gate.sh`; at least one trusted command
  (frozen_repo/evaluator_owned).
- Tests: `tests/delivery-gate-contract.test.sh` +11 wiring assertions; `tests/gate-scenarios.test.sh`
  Scenario 13 exercises commit-gate.sh through all block/pass paths.

### Behavior choice: fix-first, escalate when stuck (not ask-on-every-failure)
On a block the role-loop resolves it first (fix the red, finish QA, close the requirement). It escalates to
the user - asking about the requirement via `reference/interview.md`'s ask-user mechanism - only when the
gap is requirement-level (ambiguous or unmet), genuinely uncertain, or the critic->fixer loop hit its
3-cycle cap. The commit stays blocked throughout; it is never committed on an assumption.

Rejected alternative: ask-first (stop and question the user on any FAIL / PARTIAL / uncertainty). Too noisy
- a transient test failure the fixer can clear should not interrupt the user - and it fights supergoal's
baseline-first identity. Fix-first reuses the existing stop condition in `role-loop.md` rather than adding a
new interrupt.

### Not the removed delivery-gate ceremony
The 2026-06-07 baseline-first cleanup deleted a `templates/delivery-gate.sh` (one of "7 hard gates",
mandatory Before/After ceremony). To avoid resurrecting that name and that idea, this script is named
`commit-gate.sh` and is different in kind: fix-first, it only reads proof artifacts the run already
produced, and it gates one concrete action (commit/merge) instead of staging a ceremony. The 8-eval finding
stands - gated ceremony never beat a strong baseline; a commit safety check on already-produced evidence is
not that.

### Why
User request: in supergoal, prevent commit when QA fails / is incomplete / requirements are unmet / there is
uncertainty, and question the user about the requirement when that happens. The conditions existed as
scattered signals (QA verdict, surfaced-requirements status, decision-gate status); this binds them to the
commit step as one named gate plus a deterministic backstop, and defines the escalation.

### Verification
- `tests/gate-scenarios.test.sh` Scenario 13: 10 commit-gate cases (usage, missing proof, open ask-user
  gate, open/closed surfaced requirement, QA PARTIAL/PASS, no trusted command) - file total 50 passed / 0
  failed.
- `tests/delivery-gate-contract.test.sh`: 34 passed / 0 failed (11 new commit-gate wiring assertions).
- `bash tests/run-all.sh`: all checks passed (every `*.test.sh`, node --check templates, url-shortener
  example).
- `bash -n templates/commit-gate.sh` clean; shellcheck not installed locally (skipped).
