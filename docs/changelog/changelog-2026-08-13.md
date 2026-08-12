# Changelog 2026-08-13

## Tiered workflow, spec-first grilling, human-readable reporting

**Decision**: fold three external insights into the loop without adding default-path ceremony -
tier the workflow weight (unclebob/swarm-forge sized packs), spec out the request before the plan
(swarm-forge specifier gate + mattpocock/skills grilling primitive), and set a default user-facing
writing style (mattpocock/skills `wait-what`: ASD-STE100 Simplified Technical English).

### Why

- Own eval history (docs/research-brief.md line): the harness never beat a strong baseline on
  explicit-spec tasks, and ceremony turns were the measured cost driver. The 2026-07-16 ephemeral
  fast path (state in context, no vault/worktree) cut agent time to +3.8% of baseline at equal f2p -
  but it only fired in single-task container/CI/benchmark checkouts. Easy tasks in persistent
  workspaces still paid the full five-gate cost.
- swarm-forge ships two-pack/four-pack/six-pack workflows so a small task never pays six-agent
  overhead, and hard-gates specification approval before any code. Both map cleanly onto the
  existing loop.
- `wait-what` (mattpocock/skills) names the report failure mode: correct but unreadable. Its three
  rules (context first, Simplified Technical English, ubiquitous language) became
  `reference/reporting.md`.

### What changed

1. **Tiers** (`role-loop.md` `## Tier selection`, SKILL.md mode section): LIGHT generalizes the
   ephemeral fast path to persistent workspaces - same five gates, state in context, no vault, no
   role fan-out, worktree KEPT (checkout protection is cheap; the measured cost was vault writes and
   dispatch turns, not the worktree). STANDARD = unchanged full loop. DEEP = up-front conditional
   plan attack + uncapped interview. Upgrade one-way LIGHT->STANDARD on surfaced ambiguity, blast
   radius past the explicit target, or a second red Build->Verify iteration. User words
   "quick"/"light"/"thorough"/"deep" override detection. Ephemeral workspaces auto-select LIGHT and
   additionally drop the worktree (previous fast-path behavior preserved).
2. **Spec-out** (`interview.md` `## Spec-out`, `templates/GOAL.md`): interview answers complete
   `GOAL.md` `## Spec` + `## Success Criteria` (Given/When/Then form) BEFORE `PLAN.md` exists.
   STANDARD presents spec + plan at the one existing approval gate (no new touchpoint); DEEP
   confirms the spec before grounding; LIGHT auto-approves in context. Interview depth is
   tier-scaled: LIGHT skips (stated assumptions; a wrong load-bearing assumption is an upgrade
   trigger), STANDARD keeps the <=5-question one-round cap, DEEP removes the round cap.
3. **Reporting** (`reference/reporting.md`, new): outcome first then short context, Simplified
   Technical English prose, project ubiquitous language, wait-what re-pitch on user confusion.
   Machine-checked vault markers stay verbatim so gates keep grepping.

### Verification

- `tests/run-all.sh` before/after on every commit: failure profile identical to the dev-v2 baseline
  (exit 23 both sides, diff of FAIL/Summary lines empty). NOTE - the suite is broken at baseline:
  test ROOT still points at the repo root while the skill moved to `skills/supergoal/`
  (commits 6c30586/18f5575), so most path-dependent checks fail pre-existing. Parity, not green, is
  the evidence here. Repointing the suite is an open follow-up.
- `.cursor/skills/supergoal/SKILL.md` copy re-synced from the canonical file.
- NOT yet verified: a harness-eval A/B of LIGHT vs the full loop on an explicit-spec task
  (recommended next eval before shipping a version tag).
