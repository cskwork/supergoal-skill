# Archon workflow vs plain Claude - case-015 LSP (live, n=1)

Runtime: Claude `sonnet`, held constant across both arms. INLINE single non-interactive process.
Arms: **baseline** = plain Claude Code (`claude -p`, no Archon); **harness** = the same `sonnet`
model driven through an **Archon v0.4.1 workflow** (a single-node workflow calling the bundled
`archon-implement` command, `--no-worktree`). Hidden tests injected only after each agent finished.
Fresh `/tmp` sandboxes per arm.

## Why this is claude-vs-claude (not codex)

The original plan was codex `gpt-5.3-codex-spark` (to match the cross-agent pi matrix). That is
**structurally infeasible** with this machine's auth, proven by smoke test:

- A ChatGPT-subscription codex login only exposes the **spark** model family (`gpt-5.3-codex`
  returns *"not supported when using Codex with a ChatGPT account"*).
- Archon's codex provider (`@openai/codex-sdk`) always attaches an `image_generation` tool, which
  the spark model rejects -> **HTTP 400**. Plain `codex exec` avoids this (it never attaches the
  tool), which is why the prior codex/spark baselines ran fine.
- Unaffected by Archon version (v0.3.10 and v0.4.1 identical), by swapping the codex binary
  (0.42.0 -> 401 auth; 0.137.0 -> auth OK but the 400), or by a `~/.codex/config.toml`
  `[tools] image_generation = false` toggle. No OpenAI API key per the user's constraint.

The Claude provider runs end-to-end locally (global auth, SQLite, no Docker/Supabase/key), so the
same "does the Archon workflow help?" question was tested **claude-vs-claude** with the model held
constant.

## Result (this run)

| arm | quality | behavior tests (5 vis + 4 hid) | all checks (+3 syntax) | tokens | wall-clock | crashed |
|---|---:|---|---|---:|---:|---|
| baseline | **83** | 6/9 | 9/12 | 657,249 | 434 s | no |
| harness  | 82 | 6/9 | 9/12 | not captured* | 546 s | no |

`*` Archon's CLI workflow log does not emit per-turn Claude token usage, so harness tokens are
**unmeasured** (not zero). Only wall-clock is directly comparable: the harness arm was **+26% slower**.

The two arms produced an **identical machine-check vector** - same 6 behavior tests pass, same 3 fail,
same 3 syntax pass. Quality differs by a single point (`error_handling` 10 vs 9), inside scorer noise.

## Per-check vector (baseline | harness)

```
P P  visible: JSON-RPC Content-Length transport
P P  visible: initialize / shutdown / exit lifecycle
P P  visible: didOpen publishes undefined-symbol diagnostics
P P  visible: completion includes keywords / in-scope / function items
P P  visible: definition + hover resolve function symbols
P P  hidden:  didChange reparses incrementally, clears stale diagnostics
F F  hidden:  completion filters by prefix and exposes function signatures
F F  hidden:  definition prefers local scope over same-name symbols elsewhere
F F  hidden:  parser recovers from syntax errors and still reports diagnostics
P P  syntax x3
```

## Bug-catch matrix

| hidden rule | baseline | harness |
|---|---|---|
| didChange incremental refresh | caught | caught |
| completion prefix + signatures | **missed** | **missed** |
| local-scope definition | **missed** | **missed** |
| syntax recovery + semantic diagnostics | **missed** | **missed** |

The Archon workflow caught **nothing the plain baseline missed**. Both shipped the same three
hidden-rule gaps. (Note: the earlier supergoal-skill harness on this same case *did* catch the
prefix-completion rule the baseline missed - the Archon workflow did not.)

## Decision: Not proven (no harness benefit observed)

- **n=1 hard case.** The HARNESS-EVAL contract rules a single discriminating case `Not proven`.
- **No lift on any axis.** Same pass vector, quality tie-minus-one (favoring baseline), and the
  harness cost **more wall-clock** (+26%) with token cost unmeasured-but-real. This is consistent
  with the skill's documented baseline-first finding: workflow ceremony costs more without beating
  a strong baseline on an explicit-spec task.

## Validity caveats

- **Path confound (mild, favors baseline).** Baseline is the Claude **CLI**, which loads the user's
  global `~/.claude/CLAUDE.md` (engineering rules, "respond in Korean"); the harness runs Claude via
  Archon's **agent SDK**, which does not load that global config. So the baseline carried the user's
  own engineering guidance - a small edge to the baseline arm, not the harness.
- **Harness scaffolding = one `archon-implement` node** (no plan/PR nodes; PR creation needs a GitHub
  remote and was dropped). This is Archon's genuine bundled implement command, model pinned to sonnet.
- **Cost asymmetry.** Baseline tokens are exact (`claude --output-format json`); harness tokens are
  not surfaced by Archon's CLI log. Reported honestly as unmeasured; wall-clock is the comparable axis.
- **First baseline attempt was rate-limited** ("session limit resets 4:20pm KST") and discarded; this
  is the clean re-run after the limit reset, with both arms running at capacity (crashed=false).

## Artifacts

- `result.json` - machine result (per-check, per-dimension, cost).
- `report.md` - terse auto-generated machine report (its `fail` machine-check cell means "not a clean
  12/12 sweep", i.e. 9/12 - not a crash).
- `raw/` - per-arm agent logs (baseline = claude JSON; harness = Archon pino log).
- `run.mjs` - the runner (forked from the supergoal-skill harness; only the two arm executors changed).
