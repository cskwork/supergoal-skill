# Changelog - 2026-07-14

## Lean five-gate default loop (turn/token diet for LEGACY/DEBUG/feature delivery)

**Change**: the GREENFIELD / DEBUG / LEGACY mandatory core is now
`Frame -> Plan approval -> Build -> Exact Verify/QA -> Finalize`, with exactly **one builder + one
verifier dispatch per iteration**. The previous core
(`Build -> Improve full spec -> Improve edge cases -> Mandatory Adversarial Review -> Exact Verify/QA`,
plus opt-in Critic/Fixer) forced at least five fresh-context dispatches per run and defaulted to an
8-iteration cap; the user reported runs burning too many turns/tokens on legacy debug/feature work.

- Decision: fold "Improve full spec" and "Improve edge cases" into plan-time discovery, not into the
  builder.
  Why (user-directed, refined mid-review): Frame owns discovery once - it explores the actual code
  (`agents/explore.md`, `reference/plan-grounding.md`), re-reads the request/ticket, README,
  design/API docs, and repo/data rules, and enumerates full-spec coverage plus edge-case/resilience
  criteria as `GOAL.md` Success Criteria grounded in observed code, copied into `PLAN.md`
  `## Acceptance checklist` - so the user reviews the whole coverage at the plan approval gate. The
  builder then implements ONLY the approved plan and exits green. My first cut had the builder re-read
  the spec docs as an exit sweep; the user correctly flagged that this duplicated Frame and Verify and
  contradicted the "builder is briefed by `PLAN.md` alone" contract, and that plan-time discovery is
  better for context management. Two extra fresh-context dispatches (each reloading the plan, repo
  context, and references) bought little over criteria the planner enumerates once and the builder
  executes.
- Decision: fold the mandatory adversarial review into the verifier.
  Why (user-directed): the verifier is already fresh-context, already re-reads request/docs, and
  already outranks reviewer approval by contract ("exact verification outranks reviewer approval").
  A separate reviewer that cannot run the proof layer was an opinion pass between two evidence passes.
  The verifier now carries the adversarial stance explicitly (disprove before ticking) and surfaces
  hidden `must` requirements as `(surfaced: ...)` criteria.
- Decision: remove Critic/Fixer entirely (user-directed: "can remove critic fixer completely").
  Why: the Verify -> `R-LOOP.md` -> relaunched-builder loop already covers the critic/fixer mechanism -
  the verifier surfaces grounded `must` gaps, and the fresh-context builder reproduces each with a
  failing test first, then fixes. The one property lost (test-author independent of fix-author) is
  preserved as the builder's red-first rule on R-LOOP re-entry, while the anti-Goodhart property stays
  intact (only the verifier ticks criteria). This also completes the direction of the 2026-06/07
  baseline-first evals: 8 runs showed the gated ceremony never beat a strong baseline on explicit-spec
  tasks, and underspecified-n3 showed the value was forced passes, not role separation.
- Decision: remove the standalone Improve/Review escalation rungs too (user-directed: "since it's
  included and step wording changed"); the ONLY remaining escalation is the pre-Build adversarial plan
  attack, trigger-gated (under-specified / latent-correctness, security/data/concurrency, wide blast
  radius) with the named trigger recorded in `run-state.json`.
  Why keep just the plan attack: it is the only control that examines the PLAN before code exists;
  post-build disproof belongs to the verifier and post-verify gaps route through R-LOOP, so every other
  standalone pass duplicated a built-in.
- Decision: `max_iterations` default 8 -> 3 for the Build->Verify loop; at cap, forced reflection then
  escalate to the user with the open reds instead of grinding.
  Why: with the verifier surfacing everything in one pass and the builder sweeping in one pass, three
  round trips is the point where remaining reds are usually requirement-level, which is the user's call
  anyway; asking is cheaper than five more grinding iterations.
- Decision: every gate exits with the app fully functional - Build may return only on a green suite;
  Verify proves it against ground truth; Finalize commits only past the commit gate.
  Why (user-directed): "at each point make app fully functional".
- Kept unchanged: run isolation (worktree), GOAL/PLAN/QA/R-LOOP/Z vault files, Before/After Eval,
  blocking plan approval gate, browser QA via playwright-cli + qa-gate, commit gate, DB evidence rule,
  regression ledger, characterization baselines, UI/UX overlay, all non-code modes.
- Rejected: keeping the improve passes/review as a general trigger-gated escalation ladder (my first
  cut). The user pushed further - "supergoal has to be simple yet efficient and effective" - and the
  ladder duplicated what Build/Verify now own.
- Rejected: dropping the plan approval gate in autonomous runs (unchanged: auto-approved with recorded
  reason).
- Contract tests updated in lockstep (TDD: tests first, then docs): `tests/role-loop-contract.test.sh`
  now requires the five-gate string, the one-builder+one-verifier cost envelope, Frame-owned full-spec
  discovery, the plan's `## Acceptance checklist`, the builder covering every planned criterion, the
  verifier's adversarial stance + surfacing, red-first R-LOOP re-entry, the "only fix channel" wording,
  the (default 3) cap, and REJECTS "Mandatory Adversarial Review", "Critic/Fixer", standalone
  improvers, and builder spec-doc re-reads as reintroduced ceremony. `harness-eval` arm default is now
  `Plan+Build -> Exact Verify/QA`.
- Historical artifacts intentionally untouched: `templates/harness-eval-cases/run-underspec-n3.mjs` and
  `run-local-eval.mjs` still encode critic/fixer arms because they document past experiments where the
  critic WAS the tested lever; they are not part of the delivery loop.
- Verified: `bash tests/run-all.sh` exits 0 with every per-file summary at 0 failed (role-loop 118,
  harness-eval 302, delivery-gate 91, gate-scenarios 65/73, others green).
