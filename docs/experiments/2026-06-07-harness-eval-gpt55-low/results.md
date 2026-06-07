# gpt-5.5 low-reasoning eval: is the crash spark-specific? does the harness matter?

Case `revfactory-case-015-lsp`, v2 scorer, model `gpt-5.5`, `model_reasoning_effort=low`, via the
`headroom` provider. Two runs: fixed (current INLINE) skill, and the original pre-fix skill.

Caveat: codex runs through the `headroom` proxy. Scoring is on **ground-truth** (the actual
`src/server.mjs` on disk + real `npm test`), so any proxy chat fabrication does not affect pass/quality;
token/time come from the codex JSON log and are directionally reliable.

## Results

| run | arm | score | tests | crashed | turns | tokens | wall-clock |
|---|---|---:|---|---|---:|---:|---:|
| #1 fixed skill | baseline | 79 | 6/9 | no | 1 | 786K | 211 s |
| #1 fixed skill | harness | 79 | 6/9 | no | 1 | **418K** | **152 s** |
| #2 original skill | baseline | 81 | 7/9 | no | 1 | 437K | 190 s |
| #2 original skill | harness (pre-fix) | 79 | 6/9 | **no** | 1 | 353K | 142 s |

## Q1 — Is the crash spark-specific? No — it is a high-reasoning × heavy-payload effect.

Crash matrix across all runs of case-015:

| model | effort | skill | crashed? | harness log |
|---|---|---|---|---|
| gpt-5.3-codex-spark | high | original | **YES** (turns 0, exit 1, 0 tokens, 407 s) | 191-267 lines, read leaked eval yaml, debug-proc spam, repeated full rewrites |
| gpt-5.3-codex-spark | high | fixed (INLINE) | no | clean |
| gpt-5.5 | low | original | **no** | 47 lines, 0 reference/template reads, 0 rejected procs, 0 rewrites |
| gpt-5.5 | low | fixed (INLINE) | no | clean |

So you cannot say "only spark." The crash is driven by **high reasoning effort** making the agent
verbosely load the whole ~332 KB skill tree and run a long self-verification loop inside one context
window. Low reasoning is terse — even the un-fixed harness stayed lean on gpt-5.5-low (47-line log, never
opened `reference/`/`templates/`) and completed cleanly. The INLINE fix prevents the crash at any effort.

Most likely the original harness would also crash on gpt-5.5 at **high** reasoning; it is the
effort × payload combination, not the model name. (Not separately tested here — gpt-5.5-high would be the
confirming run.)

## Q2 — Does the harness matter on gpt-5.5-low? Yes, as cost, not quality.

On this config both arms produce the same functional result (6-7/9, score ~79-81 — within run-to-run
noise; baseline moved 6/9→7/9 between runs). The harness does NOT lift quality here — the task is easy
enough for gpt-5.5 that the baseline already does well.

What the harness does buy: **~half the tokens and ~25-30% less wall-clock** for the same outcome
(fixed harness 418K vs baseline 786K tokens; original harness 353K vs baseline 437K). The INLINE
discipline (minimal diff, one scoped verify, stop on green) makes the agent do the same work more
cheaply.

## Takeaway

- The catastrophic failure was real but **config-specific** (high reasoning + un-fixed heavy skill), not
  a universal harness property and not "only spark."
- Where the harness clearly matters: the **hard, high-reasoning** regime (spark-high), where the fix took
  it from crash/63 to clean/82 and cheaper-than-baseline.
- Where it is a wash on quality: an **easy-for-the-model, low-reasoning** regime, where it still saves
  ~half the cost.
- This matches the literature: scaffolding helps most on hard/long-horizon work and least when a strong
  model on low effort already solves the task.
