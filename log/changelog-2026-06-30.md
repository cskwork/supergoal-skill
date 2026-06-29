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
