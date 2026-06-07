# 5-CLI harness eval - case-015 LSP, gpt-5.5 @ low (live, n=1)

Same model, same reasoning, same backend; the only variable is the CLI / harness wrapper.

- **Model/effort:** `gpt-5.5` at `reasoning_effort=low`, every arm.
- **Backend:** all five arms route to the same ChatGPT-Codex `gpt-5.5` through the local headroom
  proxy (`127.0.0.1:8787`): codex `/v1`, hermes `/backend-api/codex`, omp `openai-codex/gpt-5.5`.
  So this is a clean A/B/C/D/E on the wrapper, not on the model.
- **Task:** RevFactory case-015 (MiniLang LSP) - the only RevFactory fixture that ships a runnable
  stub + visible tests + hidden tests + scorer. Fresh `/tmp` sandbox per arm; hidden tests injected
  only after each agent finished. 9 machine checks (5 visible + 4 hidden), each scored individually,
  plus the v2 100-point quality rubric.

## Arms (only the wrapper differs)

| arm | wrapper | treatment |
|---|---|---|
| `codex` | codex exec | bare; global `~/.codex/AGENTS.md` suppressed (`project_doc_max_bytes=0`) |
| `codex_agents` | codex exec | loads the user's `AGENTS.md` (Ten Commandments coding rules) |
| `codex_supergoal` | codex exec | bare + supergoal `SKILL.md` reference (the only treatment; rules suppressed) |
| `ohmypi` | omp (oh-my-pi) | native harness, `--thinking low --auto-approve` |
| `hermes` | hermes | native harness, `--yolo`, reasoning forced to `low` via config (restored after) |

Isolation verified from transcripts: bare/supergoal arms loaded no `Ten Commandments`/`AGENTS.md`/
`CodeGraph` text; the agents arm did; the supergoal arm read `baseline-first` (SKILL.md) and no rules.

## Result (this run)

| arm | quality | real tests (5 vis + 4 hid) | all checks (+3 syntax) | false-GREEN | wall-clock | tool calls | tokens | crashed |
|---|---:|---|---|---:|---:|---:|---:|---|
| `codex` (bare) | 81 | **7/9** | 10/12 | 2 | 181 s | 30 | 418k | no |
| `codex_supergoal` | 81 | **7/9** | 10/12 | 2 | 172 s | 28 | 431k | no |
| `ohmypi` | 81 | **7/9** | 10/12 | 2 | 189 s | 16 | 911k* | no |
| `hermes` | 81 | **7/9** | 10/12 | 2 | **145 s** | **5** | n/a* | no |
| `codex_agents` | 79 | 6/9 | 9/12 | 3 | 209 s | 36 | 634k | no |

\* Token counts are **not cross-CLI comparable**: codex reports the final cumulative usage; omp's
`--mode json` sums per-turn usage (inflated by re-sent context); hermes `-Q` does not expose usage.
**Wall-clock and tool-call count are the comparable cost axes.** Within codex (same parser) tokens are
comparable: AGENTS.md = 1.52x bare, supergoal = 1.03x bare.

## Headline

- **4-way tie at the top: 7/9, quality 81** - `codex`, `codex_supergoal`, `ohmypi`, `hermes`.
- **`codex_agents` is the only loser: 6/9, q79**, and also the most expensive (1.52x bare tokens,
  longest wall-clock, most tool calls). Adding the coding-rules `AGENTS.md` did not help and cost the
  most.
- **Every arm shipped false-GREEN.** All five pass all 5 visible tests, yet all fail >=2 hidden tests.
  The CLI/rules/skill did not stop any arm from self-reporting a `npm test` 5/5 green over broken
  hidden behavior.

## Bug-catch matrix (which hidden rule each arm caught)

| hidden rule | codex | +AGENTS | +supergoal | ohmypi | hermes |
|---|---|---|---|---|---|
| didChange incremental refresh | caught | caught | caught | caught | caught |
| completion prefix + signatures | **missed** | **missed** | **missed** | **missed** | **missed** |
| local-scope definition | caught | missed | missed | caught | caught |
| syntax recovery + semantic diagnostics | missed | missed | **caught** | missed | missed |

Two robust cross-arm facts:

1. **`completion prefix + signatures` is missed by all five.** It is the ceiling of gpt-5.5 at low
   effort on this task - no wrapper fixes it. (The prior `gpt-5.3-codex-spark` at *high* effort got it,
   so the lever is reasoning effort, not the harness.)
2. The treatments only **reshuffle which hidden test passes**, never raise the count above the bare
   baseline. supergoal is the only arm to catch `syntax recovery`, but it (with agents) is also the only
   one to miss `local-scope` - net 7/9 either way.

## What's a real signal vs noise

- **Robust (cost):** more wrapper machinery = more cost for the same or worse result. AGENTS.md rules
  cost 1.52x bare tokens / +28 s / +6 tool calls and scored one test *lower*. ohmypi matched the result
  but ran a heavier agent loop. This is the same direction every prior supergoal eval found.
- **Noise (the +/-1 test gaps):** at n=1, single run per arm, the 7/9-vs-6/9 spread and *which* two
  hidden tests each arm misses are inside the documented run-to-run variance for this exact case (prior
  runs swung this case 6/9 <-> 8/9 on identical config). Do not read "AGENTS.md causes -1 test" or
  "supergoal catches syntax-recovery" as stable; read the cost deltas, which repeat.
- **hermes wall-clock/tool-call advantage** (145 s, 5 tool calls for the same 7/9) is the most
  interesting efficiency signal, but also n=1 and its token usage is unmeasured.

## Recommendation - best overall

On comparable axes (result + wall-clock + tool calls + false-GREEN), ranked:

1. **`codex` bare** - top-tier result (7/9) at the lowest codex token cost and simplest setup. Nothing
   added to it (rules, skill, or a different CLI) raised the score; one option lowered it. This is the
   best default for a hard, explicitly-specified task at gpt-5.5/low.
2. **`hermes`** - matches 7/9 with the lowest wall-clock (145 s) and fewest tool calls (5). Pick it when
   latency/turn-economy matters and the hermes ecosystem is acceptable; its token cost is unmeasured.
3. **`codex_supergoal`** - ties bare at ~3% token overhead; neutral here. Its claimed edge (surface
   hidden requirements) did not raise the count at low effort on this spec-complete task - consistent
   with supergoal's own baseline-first thesis ("a strong model with the real spec is the bar").
4. **`ohmypi`** - same 7/9 result, heavier agent loop.
5. **`codex_agents`** - do not use for this task class at low effort: lowest score, highest cost.

**Bigger lever than any wrapper:** every arm shipped 2-3 broken hidden behaviors behind a visible-green
`npm test`. If hidden-behavior correctness matters, none of these configs at `reasoning=low` is
shippable - raise reasoning effort (the prior high-effort run reached 8/9) rather than swap the harness.

## Why this is `directional`, not proven

- **n=1 hard case, one run per arm.** The HARNESS-EVAL contract rules a single discriminating case
  `Not proven` for any general claim; one run gives no variance estimate.
- It is, however, a **clean same-model/same-effort/same-backend head-to-head** on this task: the tie at
  the top and the cost ordering are real for this run, and the cost ordering matches every prior eval.

## Reproduce

```
cd docs/experiments/2026-06-07-harness-eval-5cli-gpt55-low
bash orchestrate.sh                      # all five arms (forces hermes reasoning=low, restores after)
SG_EVAL_ARMS=ohmypi node run.mjs         # re-run one arm; merges into result.json
```
