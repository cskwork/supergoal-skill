# Changelog 2026-06-10

## LEARN mode: single recap question -> interview-style check

### What
Replaced the "ask exactly one recap/check question per turn" rule in LEARN mode with an
interview-style check: each teaching turn (and the opening) now ends with a short, difficulty-scaled
set of questions drawn from different angles (recall / why / process / apply-transfer / edge-failure
/ connect), then the difficulty menu.

Files (live only; `docs/experiments/*` snapshots and prior changelogs left untouched):
- `reference/learn.md` - Teach loop step, new `## Interview check` section, opening template, Rules
  block, Tutor contract item 11.
- `docs/learn-standalone-prompt.md` - mirrored the same change (template, code-topic line, Questions
  section, Teach loop) so the standalone prompt stays in sync with the skill contract.

### Why
User wants the bite-sized explain-then-check loop to actively induce learning rather than let the
user passively nod. A single flat recap question tests one facet; a small multi-angle interview
forces real retrieval and transfer (active recall + elaboration).

### How the prior concern is preserved
The 2026-06-07 change deliberately capped questions to stop "mid-lesson question spray." This reverses
that cap on purpose, but keeps it bite-sized by scaling count to difficulty (1-2: one gentle recall;
5 default: two-three; 8-10: three-four incl. edge/transfer) and staying conversational - answer in
any order, as far as you can, re-ask only the misses. Not an exam.

### Verification
- `tests/learn-contract.test.sh`: 12 passed, 0 failed (anchors unaffected - they check decomposition
  and process-trace requirements, not question count).
- grep confirms no leftover "exactly one recap" / "one question at a time" / "exactly two questions"
  in live `reference/` or the standalone prompt.

## Coherence pass: purge removed-ceremony vocabulary from reference/ + agents/

### What
The baseline-first rewrite removed the gated ceremony (Validate -> Plan freeze -> Human Feedback ->
Build -> Verify -> Committee -> QA -> Deliver, `delivery-gate.sh`, `human-feedback-gate.mjs`,
`claims.md`, `ten-rules`), but half the reference/agent files still spoke that vocabulary. An agent
following SKILL.md's lean loop (Frame -> Build -> Critic -> Fixer -> Verify) would hit instructions
referencing gates, phases, roles, and artifacts that no longer exist. Aligned every live file to the
current loop:

- `tests/role-loop-contract.test.sh` - was failing at baseline (2/8): commit 8680d18 moved the vault
  to `docs/changelog/<YYYY-MM>/<DD-topic>/` but the test still pinned `docs/surfaced-requirements.md`.
  Retargeted both assertions to the new vault path. 8/0.
- `reference/domain-rules.md` - rewrote: dropped `ten-rules` and `delivery-gate.sh` (neither exists),
  Step 0/Intake -> Frame, Architect/Builder/Committee/Verifier -> Build/Critic/Fixer/Verify, folded
  the orphaned `verification.md ## Coverage` checklist into the Verify role bullet.
- `reference/interview.md`, `plan-grounding.md` - "Human Feedback gate" / "hashed" removed; gating now
  cites SKILL.md hard stops (genuine ambiguity blocks the freeze); insertion point "Start of Plan" ->
  "End of Frame". Exit lines now hand off to Build.
- `reference/debugging.md` - dropped the external `diagnose`-skill dependency (inlined the trusted
  feedback-loop exit gate); "read-only until approved Human Feedback" -> read-only until the cause is
  confirmed by direct evidence + fix plan written; user blocks only on SKILL.md hard stops. This also
  resolves the internal contradiction with interview.md's non-blocking DEBUG re-rank.
- `reference/qa-only.md`, `learn.md`, `learn-domain.md` - gate lists
  (Validate/Human Feedback/Committee/Deliver) -> current-loop phrasing; `claims.md` mentions removed.
- `reference/ui-ux.md`, `functional-ui.md` - Plan overlay row -> Frame; "committee gates Deliver" ->
  "Verify gates delivery"; Design Read/dials may land in the run `README.md` when no `plan.md` exists.
- `reference/qa.md`, `agents/qa-tester.md` - worktree optional ("working tree, or Verify worktree when
  one is used"); "Verify = pure run-to-prove/claims re-run" -> Verify re-runs the project's REAL tests.
- `agents/code-reviewer.md` - REWRITTEN as the Critic persona. SKILL.md maps critic=code-reviewer, but
  the persona was the old read-only committee reviewer ("WRITE: none required") with no Write tool, so
  it literally could not perform role-loop step 3 (write failing tests + record surfaced
  requirements). This overrides the 2026-06-07 "deliberately read-only" note - that decision predates
  the committee's removal; with the committee gone the persona's only caller is the critic role.
  Review duties (findings with file:line + fix) are kept inside the critic mandate.
- `agents/executor.md` - now Builder/Fixer: adds the fixer constraints role-loop requires (never edit
  test files, no padding, don't break passing tests); `claims.md` -> run-to-prove line in the vault
  `README.md` (nothing consumed claims.md anymore; the re-runnable proof command is the surviving
  contract).
- `agents/designer.md` - same claims.md -> vault README swap; committee/Verifier -> Verify step.
- `agents/architect.md`, `debugger.md` - "two Human-Feedback briefs" -> one short plain-language plan
  summary; debugger no longer cites the `diagnose` skill.
- `agents/analyst.md` - Intake/Validate -> Frame brief / optional GREENFIELD Validate.
- `agents/security-reviewer.md` - committee -> Verify-phase reviewer.
- `SKILL.md` - one clause defining the "conductor" (the dispatching agent), since every persona names
  it but nothing defined it.

### Why
Dangling references are not cosmetic: they make agents ask "where is the Human Feedback gate?",
produce `claims.md` files nothing reads, or stall waiting for a Committee that never runs. Alignment
keeps the lean loop lean without reintroducing the ceremony (the 8-eval result stands: gated ceremony
never beat a strong baseline; nothing gated was added back - DEBUG even got *less* blocking).

### Verification
- Full contract suite: 10/10 test files pass, 348 assertions PASS, 0 FAIL (baseline was 9/10 - the
  role-loop suite failed 2 of 8 before this pass).
- `grep -rE "Human Feedback|[Cc]ommittee|claims\.md|delivery-gate|ten-rules"` over SKILL.md,
  reference/, agents/, templates/, tests/ returns only intentional mentions (the removed-gate comment
  in `gate-scenarios.test.sh`, harness-eval's "do NOT force the committee ceremony" warning, and
  "marketing claims").
- Historical records (`docs/experiments/*`, `docs/changelog/*`, `docs/DESIGN.md`) left untouched.

## Feature: REVIEW-ONLY mode + domain-context compression

### REVIEW-ONLY - findings, not fixes
"review/audit this code/diff/PR" was an unrouted intent: QA-ONLY drives a running app (not a diff)
and the default loop starts building. Added a ninth mode with zero new machinery - it dispatches the
two existing reviewer personas in parallel:

- NEW `reference/review-only.md` (~45 lines): read-only except the run folder; code-reviewer in
  findings-only stance (names the missing test per untested behavior instead of writing test files,
  keeping the repo untouched) + security-reviewer; every CRITICAL/HIGH finding re-checked against the
  cited code before reporting (anti-hallucination guard); severity-ordered `report.md` with
  `Untested behaviors:` and `Not covered:` anchors; fixes route to DEBUG/LEGACY as a new objective.
- NEW `tests/review-only-contract.test.sh` (15 checks) pinning the findings-only boundary, both
  personas, finding verification, report anchors, and the route-out.
- SKILL.md: mode-table row, no-code-modes bullet, reference-map row, "review this code/PR" trigger in
  the description. README.md / README.ko.md mode tables + utilities line; docs/index.html landing:
  REVIEW-ONLY mode card (green accent), metric 8 -> 9 modes, utilities lead line.
- No gate script: the mode is read-only, so the risk a hard gate would backstop does not exist;
  adding one would be ceremony.

### domain-context.md 255 -> 142 lines (-44%)
Longest live reference, loaded during Frame on most coding runs. Compressed without dropping
contract: per-file sections folded into a one-line-per-file contract list, the duplicated
"Every run" steps merged into the Retrieval loop, refresh policies folded into three bullets,
saving-loop prose tightened. All 14 strings pinned by domain-context/qa-only contract tests
preserved verbatim; Domain Brief format block unchanged (plan-grounding consumes it).

Also caught here: "the only allowed pre-Human-Feedback repo write" had survived the ceremony purge
because the hyphenated form dodged the "Human Feedback" grep -> now "the only allowed repo write
before Build"; "At Deliver, save..." -> "At the end of a run". Repo-wide `human.feedback` sweep now
returns only the intentional removed-gate comment in gate-scenarios.test.sh.

### Verification
11/11 contract suites, 363 assertions PASS, 0 FAIL. Landing: 9 mode cards counted,
article open/close tags balanced (17/17), no stale "8 modes" text.
