# 2026-07-07

## Conditional explore-subagent dispatch at plan grounding (all default-loop modes)

**Change**: `reference/plan-grounding.md` "Required input" gains one rule: when no Explore map exists
and grounding needs more than a handful of files or unfamiliar code, dispatch a fresh-context explore
subagent (`agents/explore.md`) to write the map into `PLAN.md` grounding notes before freeze; small or
well-known scope grounds inline. `agents/explore.md` header/description generalized from LEGACY-only
to any-mode plan grounding (behavior unchanged).

**Why**: subagent exploration was guaranteed only on the LEGACY route (`SKILL.md` map-first). In
GREENFIELD/DEBUG the conductor could burn its own context on Frame-phase grounding reads. This closes
that gap without forcing a subagent round-trip on small runs.

**Rejected alternatives**:
- Per-prompt user instruction ("use a subagent to explore") — volatile, violates change-ground-truth.
- Unconditional explore dispatch for all modes — pure overhead on small GREENFIELD/single-file DEBUG;
  baseline-first evals showed added ceremony hurts, never helps (see memory: supergoal baseline-first).
- Adding Explore as a numbered role in `role-loop.md` — heavier contract change than needed; the
  conditional line in plan-grounding (loaded exactly at Frame end) is the minimal placement.

## Per-mode wiring fixes + drift cleanup (three-agent audit follow-through)

Three parallel audits (code modes / no-code modes / router+personas+tests) surfaced handoff
ambiguities and doc drift; all verified findings were applied. Behavior-preserving except where noted;
`bash tests/run-all.sh` fully green after (exit 0, node suite 68/68, all `*.test.sh` pass).

### 1. Verify-driver split (was a dead-end contradiction)
`role-loop.md` step 5 named `qa-auditor` as the Exact Verify driver while `qa.md` mandated `qa-tester`
for browser QA and `qa-auditor.md` self-scoped to QA-ONLY. Decision: default-loop browser proof =
`agents/qa-tester.md`; non-browser/artifact verify = `agents/qa-auditor.md`; security =
`agents/security-reviewer.md`. Stated in `role-loop.md` step 5, `SKILL.md` roles line (also fixed the
missing `agents/` prefix on security-reviewer.md), and one-line scope clarifications in both personas.

### 2. DEBUG reconciled with the mandatory core
`reference/debugging.md` ran its own loop and never mentioned the shared mandatory core - a DEBUG run
could skip adversarial review unchallenged. Added one line after Verify: after Fix, Mandatory
Adversarial Review then Exact Verify still apply (`reference/role-loop.md`). Also removed the dangling
`tracer` role name (no such persona; now `debugger` with the `agents/debugger.md` path).

### 3. LEGACY entry order
LEGACY's three baseline duties (API preserve-baseline, neighbor characterization, before-state) were
split across `qa.md`/`role-loop.md`/`delivery-gate.md` with no ordered entry. New 4-line
"## LEGACY entry (order)" in `role-loop.md`: map -> API preserve-baseline -> neighbor baseline ->
default loop. Pointers only; each condition stays owned by its current file.

### 4. Dark personas wired
Six persona files existed but were never dispatched by path from routing locations. Wired:
`agents/debugger.md` into the SKILL.md DEBUG row; `agents/analyst.md`/`agents/architect.md` into
Frame; `agents/designer.md` path into `ui-ux.md`. `agents/db-reader.md` was already wired
(db-access.md:40); `qa-tester` wiring is item 1.

### 5. teach.md DRY prune: 562 -> 470 lines (-18.1% bytes)
The 19-point Tutor contract (near-full restatement of the body) is now a 6-item exit checklist
pointing at owning sections; the process-trace doctrine (stated up to 5x) collapsed into the single
"Process explanation gate" owner; interview-check mechanics deduplicated; K-S-W philosophy cut to
operative rules. Fixed the phantom "Intake" step in the Flow arrow and unified the gate invocation to
`node templates/teach-lesson-gate.mjs` (SKILL.md's bare form fixed too). All 37 pinned phrases
preserved verbatim; teach-contract 64/64. The audit's 30-35% target was not reachable
behavior-neutrally: pins + operative templates (~120 lines) bound the floor. Removed rationale
(preserved here per terse-authoring rule): fluency-vs-storage explanation ("in-the-moment retrieval
feels like mastery but is illusory"), mission rationale ("a bad mission is worse than none"),
textbook-depth whys ("an abstraction the learner cannot rebuild from its pieces is memorized, not
understood"; "reaching the abstraction is the reward for understanding the parts"), interview-check
framing ("an interview to induce learning, not an exam"), glossary note ("compressing a concept into
a tight definition is itself evidence of learning").

### 6. harness-eval.md: decisive rule lifted, duplication collapsed (451 -> 445 lines)
The load-bearing baseline-first rule (single non-interactive process -> INLINE profile, never force a
multi-agent committee) was buried ~90 lines deep; now a 3-line "DECISIVE RULE" banner after the intro.
Preflight+fallback, sign-flip/n>=6, and compute-confound evidence are each stated once in their owning
section; the Reject list's 15 Contract restatements collapsed into pointer blocks (unique qualifiers
kept). Net -8 lines rather than the audited -25/-30: most Reject items were single lines whose unique
qualifiers had to survive. harness-eval-contract 303/303.

### 7. Drift cleanup
- `agents/executor.md`: "(Use the Opus tier...)" was a dead instruction - a sonnet-pinned subagent
  cannot self-upgrade. Tier choice moved to the conductor: one clause in `role-loop.md` intro.
- `reference/observability.md`: phase-update enum synced to role-loop's current names
  (ImproveFullSpec/ImproveEdgeCases/MandatoryAdversarialReview/ExactVerify; Critic/Fixer optional).
- Functional-vs-Expressive doctrine aligned: `functional-ui.md` header reframed from "design authority
  ... use taste-skill-v2 instead" (alternative-tier reading) to "density + states overlay layered on
  the Expressive baseline; never lowers polish", matching `ui-ux.md`/`designer.md` body doctrine;
  `designer.md` description's "or Functional" -> overlay phrasing; ui-ux-contract header comment
  updated (comment only - no assertion pinned the old framing).
- playwright-cli version pin (@0.1.14, 4 files): kept inline per persona self-containment (2026-06-30
  decision), but added 2 qa-only-contract assertions so `agents/qa-tester.md` and `reference/qa.md`
  must carry the same pin - version drift now fails tests instead of rotting silently. Rejected
  alternative: consolidating to one file - trades standalone-subagent robustness for DRY.
- `templates/harness-eval-gate.mjs` "orphan" finding was WRONG: the contract test executes it and
  README inventories list it. Real gap: `reference/harness-eval.md` never instructed running it. Fixed
  by wiring one line into the Report step (gate exit 0 before any proven/not_proven claim). Rejected
  alternative: deletion - would have broken harness-eval-contract and removed a working validator.

### Verification
`bash tests/run-all.sh` exit 0 (corroborated via saved log; all FAIL strings are negative-path PASS
labels). Per-file: role-loop 92/92, ui-ux 24/24, qa-only 73/73 (2 new), teach 64/64, harness-eval
303/303, observability 16/16, reference-integrity 4/4, delivery-gate 91/91, gate-scenarios 65/65.
