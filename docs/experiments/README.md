# Experiments index

Raw experiment dirs are kept only while their results still apply to the CURRENT shipped skill.
On 2026-07-06, 23 dirs from 2026-05-30 through 2026-06-28 were removed: every one ran against
pre-restructure skill versions (before the 2026-07-05 forced DeepSWE default and the 2026-07-06
GOAL/PLAN/QA/R-LOOP/Z vault), so their arm prompts no longer match shipped files and their raw runs
cannot be cited as evidence about the current skill. Their distilled conclusions - which DO still
hold - live in `reference/harness-eval.md`, `docs/plans/2026-07-04-experiment-conclusions-and-next.md`,
and the table below. History of each run stays in `docs/changelog/`.

## Kept (still valid for the current skill)

- `2026-07-01-roleloop-coverage-fix-claude-ab/` - flagship methodology run; FINDINGS.md cited by
  README.md / README.ko.md / docs/harness-eval-explained.md; `stats.mjs` holds the BCa + permutation
  decision rule.
- `2026-07-01-skill-lift-measurement-research/` - measurement-methodology research feeding the above.
- `2026-07-02-lean-skill-confirmatory-ab/` - pre-registered confirmatory plan, still pending execution.
- `2026-07-03-deepswe-happy-dom-codex-ab/`, `2026-07-03-deepswe-happy-dom-full-cycle/` - DeepSWE lane
  provenance: why Happy DOM is smoke-only (saturated) and why manual interrupts are invalid.
- `2026-07-04-assertflip-repro-ab/`, `2026-07-04-swt-assertflip-realbug-ab/` - reusable SWT-Bench-Lite
  rig (15 real sympy bugs); conclusions in `docs/plans/2026-07-04-experiment-conclusions-and-next.md`.
- `tui-research-2026-06-17/` - design research for the shipped TUI (not an eval).

## Removed 2026-07-06 (conclusions preserved)

| Experiment | Conclusion that still holds |
|---|---|
| 2026-05-30-codex-autoresearch-vs-supergoal | Early codex autoresearch-vs-skill comparison; superseded by the harness-eval contract. |
| 2026-05-30-private-codebase-comparison | Private-code comparison; not independently replayable, rejected as evidence class. |
| 2026-05-31-skill-vs-noskill-ssrf | Forced verification caught a green-but-vulnerable SSRF a naive pass shipped; seed of the latent-correctness doctrine. |
| 2026-06-06-harness-eval-3case | First 3-case pilot; established the paired with/without protocol. |
| 2026-06-06-harness-eval-low-effort-2case | Low-effort rerun; explicit-spec cases tie at extra cost. |
| 2026-06-06-harness-eval-spark-high-lsp(+v2) | Expert case-015 ties at spark/high (11/12=11/12); "hard label" is not headroom. |
| 2026-06-07-codex-loop-vs-single-gpt55-low | Looped improvement vs single pass: extra passes help; loop is the active ingredient. |
| 2026-06-07-codex-roleloop-vs-baseline-gpt55-low | Role-separated loop vs single vs naive loop: role separation adds no lift over equal-compute looping. |
| 2026-06-07-harness-eval-015-lsp-spark-high | case-015 rerun; +-1-test n=1 deltas are noise. |
| 2026-06-07-harness-eval-5cli-gpt55-low | 5-CLI portability run; motivated the portable runner + preflight/fallback contract. |
| 2026-06-07-harness-eval-archon-workflow-vs-baseline | Archon workflow vs plain Claude: tie at +26% wall-clock (see memory/archon note). |
| 2026-06-07-harness-eval-domain | Domain-rule cases: harness did not beat baseline where domain knowledge dominates. |
| 2026-06-07-harness-eval-fanout | Real subagent fan-out recovered single-process loss but did not beat baseline at ~1.7x tokens. |
| 2026-06-07-harness-eval-genharness | Task-specific generated harness: exact tie at ~2x tokens; gated ceremony removed. |
| 2026-06-07-harness-eval-harnessmake | HARNESS-MAKE-designed harness: exact tie at ~2.25x tokens; HARNESS-MAKE removed from the skill. |
| 2026-06-07-harness-eval-lsp-skill-vs-baseline | LSP skill-vs-baseline tie; ceiling case. |
| 2026-06-07-harness-eval-medium-hard-skill-vs-baseline | medium 14/14=14/14, hard 8/8=8/8 @ gpt-5.5/low: explicit-spec ties at 2-3x cost. u3 authz-cache fixture + driver now live in `templates/harness-eval-cases/` (`run-local-eval.mjs`). |
| 2026-06-07-harness-eval-underspecified | csv/lru/semver 14/14 both arms: publicly-known implicit requirements ceiling out - baseline fills them unprompted. |
| 2026-06-07-harness-eval-underspecified-n3 | u1 deepMerge: baseline shipped prototype-pollution vuln 2/3 as false-GREEN, harness caught it; equal-compute naive loop 4/4 vs role-loop 3.3/4 - extra passes, not roles, are the lever. Driver now `templates/harness-eval-cases/run-underspec-n3.mjs`. |
| 2026-06-28-supergoal-delivery-gate-effect | Delivery-gate effect probe; gate kept as audit trail, no correctness lift proven. |
| 2026-06-28-supergoal-hardest-default-coding-ab | Hardest-default selection A/B; informed the "default hard case ceilings out low effort" rule. |

Baseline-first summary across all removed runs: no skill/harness lever produced a statistically
significant lift over a strong baseline on EXPLICIT-SPEC tasks; the proven lever is equal-compute
forced verification surfacing LATENT-CORRECTNESS requirements. Do not reintroduce gated ceremony,
HARNESS-MAKE, or always-on role separation on the strength of the removed raw runs.
