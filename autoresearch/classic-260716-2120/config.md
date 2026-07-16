# autoresearch classic — supergoal DeepSWE efficiency

Goal: cut the harness arm's +40-60% agent-time/token overhead vs baseline while keeping f2p.

- Scope: skill files only (SKILL.md, reference/role-loop.md, reference/delivery-gate.md,
  agents/qa-auditor.md), candidates branch from recon (8c01712) — the quality-stable arm.
- Metric: sum over 3 valid tasks (cliffy, csstree, termenv; skrub excluded — verifier segfault) of
  `agent_execution_s` and `n_input_tokens`, vs incumbent = recon arms of run
  `/tmp/sg-deepswe-eff3` (same runner, model gpt-5.5, reasoning low, 900 s budget).
- Keep rule: f2p not worse than recon on ANY task AND (agent_s sum OR tok_in sum) ≥20% lower.
- Verify: 3 harness arm-runs per candidate via
  `templates/harness-eval-external/deepswe/run-full-cycle.mjs --arms harness --skill-repo <cand>`.
- Iterations: 3 (each ≈3 real arm-runs ≈ 30 min).
- Evidence base: diagnosis of csstree rollouts — baseline 25 tool calls / 20 API calls / 606k in;
  v080 55 / 53 / 2,996k; recon 37 / 30 / 1,333k. Instruction embed 2.9 KB → 46-48 KB. Observed
  ceremony turns: RULES.md tree-find, worktree add/remove, vault + changelog writes, repeated
  status/diff sweeps, double full-suite run, commit-gate.

## Iteration log

| iter | candidate | change | agent_s sum (3 tasks) | tok_in sum | f2p per task | verdict |
|---|---|---|---|---|---|---|
| 0 | baseline (no skill) | — | 1224 | 3.66M | 37/37, 68/79, 34/35 | reference |
| 0 | v080 (287c628) | — | 1613 | 7.18M | 0/37, 72/79, 33/35 | reference |
| 0 | recon (8c01712) | incumbent | 1673 | 7.31M | 37/37, 73/79, 29/35 | incumbent |
| 1 | cand1-lean-exec (2651fe0) | ephemeral-workspace fast path (in-context gate state; no vault/worktree/changelog; single full-suite run; root-only RULES check) | 1270 (−24% vs recon) | 8.10M (+11%) | 37/37, 73/79, 33/35 (≥ recon on all; +4 on termenv) | **KEEP** — agent-time criterion met |

## Verdict (loop closed after iteration 1)

- cand1 KEPT: f2p ≥ incumbent on every task (total 143 vs 139), agent time −24% (1,270s vs
  1,673s), landing within +3.8% of the no-skill baseline (1,224s).
- Iteration 2 (embed diet) NOT run: cliffy diagnosis shows cand1 cut turns 101→68 (matching the
  time cut) but per-call context grew 65k→95k; projected embed-diet saving ≈5-7% of token sum,
  under the 20% keep bar → plateau by expected value. Token overhead (2.2× baseline input tokens,
  97% cached) remains the open axis.
- Landed on dev-v2 as: revert of 1e4e72c (restores diff-driven regression reconciliation — today's
  external-benchmark evidence: recon lineage ≥ v080 on quality 2-of-3 with the cliffy 37-vs-0 win)
  + cherry-pick 2651fe0 (fast path). Undo: revert those two commits.
- Caveat: n=1 per cell at low effort; f2p is bimodal. The time result (−24%, consistent sign on
  all 3 tasks) is the robust finding; per-task token deltas are noise-level.

## Medium-effort spot check (2026-07-16/17, iter 2 rows in cand1-results.tsv)

csstree = feature-add proxy, termenv = debug proxy. codex gpt-5.5 medium, same runner.

| task | arm | f2p | agent | tok in |
|---|---|---|---|---|
| csstree | basemed | 75/79 | 437s | 1.21M |
| csstree | reconmed | 78/79 | 492s | 1.81M |
| csstree | cand1med | **79/79 (reward 1)** | **400s** | 1.45M |
| termenv | basemed | 34/35 | 493s | 1.32M |
| termenv | reconmed | 34/35 | 575s | 1.95M |
| termenv | cand1med | 31/35 | 453s | 1.28M |

- Feature-add: cand1 is the first supergoal arm ever to beat baseline on BOTH quality (79/79 full
  solve vs 75/79) and agent time (−8%). Fast-path harmlessness vs recon holds (79 ≥ 78).
- Debug: no supergoal lift — recon ties baseline at +17% time; cand1 −3 f2p at −8% time. Pattern
  consistent across both efforts (cand1 termenv: −1 at low, −3 at medium).
- Comprehensive totals across all 5 valid task-runs (low 3 + medium 2): f2p baseline 248/265,
  recon 251/265, cand1 253/265; agent time baseline 2,154s, recon 2,740s (+27%), cand1 2,123s
  (−1.4%); input tokens baseline 6.19M, recon 11.07M (+79%), cand1 10.83M (+75%, 97% cached).
- Pick: cand1 (already landed on dev-v2) — best quality total at time parity with baseline; the
  only arm that never pays a time tax. Known weakness to watch: repeated small f2p loss on the
  debug task (n=1 per cell, not yet conclusive).
