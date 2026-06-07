# How to lift the supergoal harness from ~63 to a real win vs baseline

Deep-research synthesis grounded in the 2026-06-06 spark-high-LSP run.
Date: 2026-06-06. Case: `revfactory-case-015-lsp`, `gpt-5.3-codex-spark`, reasoning high.

## Bottom line

There are **two independent problems**, and the score will not move until both are fixed.

1. **Measurement: 80 is unreachable by construction.** The deterministic scorer in `run.mjs`
   caps 8 of 10 dimensions below 10. Summing every dimension's maximum gives **77/100** — a
   *perfect* solution cannot score 80 on this instrument, with or without the harness. On this
   specific failing-tests, single-file case the harness also has almost no headroom to
   differentiate: 9 of 10 dimensions were byte-identical between arms; the entire 65-vs-63 gap is
   **one heuristic** (`documentation`: baseline kept ≥2 comments → 5, harness stripped them → 3).
2. **Harness: it genuinely lost, and crashed.** Run as a single `codex-exec` process, the harness
   loaded its full process payload into one finite context window, rewrote the 600-line file
   repeatedly, wasted its final turns on sandbox-rejected debug subprocesses, and **never completed
   a turn** (`turn.completed`: baseline 1, harness 0) → context-window exhaustion → `exit_code 1`,
   `tokens: 0`, 407 s (2.15x baseline's 190 s). This is exactly the regime where the literature says
   multi-agent / verifier scaffolds underperform a strong single agent.

Target "≥80 vs baseline" requires: **(A) re-scale the scorer so it can reach 80 and is sensitive to
harness-specific quality, and (B) make the harness leaner and runtime-aware so it actually passes
more checks instead of crashing.**

---

## Part 1 — Local evidence (what the artifacts prove)

### 1.1 The scorer caps at 77

From `run.mjs` `scoreQuality()`, each dimension's ceiling:

| Dimension | Rule | Max |
|---|---|---:|
| feature_completeness | `allPass?9 : (diag&&providers&&transport?7:5)` | 9 |
| test_coverage | `assertions>=12?7 : >=6?5:3` | **7** |
| code_quality | `/TODO\|console.log/?6:8` | **8** |
| error_handling | `hasValidation?8:5` | **8** |
| efficiency | `deps==0?8:6` | **8** |
| correctness | `allPass?9 : min(6, passCount+2)` | 9 |
| architecture | `files>=3?8 : ==2?6:4` | **8** |
| extensibility | `files>=2&&providers?8:6` | **8** |
| documentation | `(comments\|\|README)?5:3` | **5** |
| dev_environment | `scripts.test?7:4` | **7** |

Sum of maxima = 9+7+8+8+8+9+8+8+5+7 = **77**. The "≥80" goal is mathematically impossible on this
scorer for *any* agent. This is a measurement-design bug, not a harness failure.

On this case both arms land at: feature 7, test_coverage 7, code_quality 8, error_handling 8,
efficiency 8, correctness 5 (`passCount=3 → min(6,5)`), architecture 4 (single file),
extensibility 6, dev_env 7. Baseline documentation 5, harness 3. → 65 vs 63. The only lever that
moved was the comment heuristic.

### 1.2 The harness crashed from context exhaustion (raw log)

`raw/revfactory-case-015-lsp-harness.log` (267 lines) shows, in order:

- `item_2`: first action is `cat .../harness-ref/SKILL.md` — the 20 KB skill is pulled into context
  before any work.
- `item_24/25`: the agent reads
  `.../harness-ref/templates/harness-eval-cases/revfactory-case-015-lsp.yaml` — **the eval's own
  case definition leaked into the harness reference payload**. Turns spent reading eval meta-files,
  not the task.
- `item_41, 45, 61, …`: repeated **full-file rewrites** via `cat > src/server.mjs <<'EOF'` of a
  file that grows past 600 lines (`sed -n '540,620p'`). Each rewrite re-emits the whole file into
  context.
- tail: a burst of `node -e` / `python <<'PY'` debug commands, **all** rejected by the sandbox
  (`CreateProcess { message: "Rejected(... No such file or directory ...)" }`). Final turns burned
  on commands that never executed.
- `turn.completed` events: baseline **1**, harness **0** → harness never finished a turn → killed
  mid-turn (window/timeout) → `tokens:0`, `exit_code:1`.

Baseline, by contrast: one clean pass, single file, ran `npm test`, reported "5 tests passed",
done in 190 s (`raw/...-baseline-final.txt`).

### 1.3 Payload size vs runtime

The harness condition `--add-dir`s the whole skill: `SKILL.md` (20 KB, ~230 dense lines) +
`reference/` (22 files) + `agents/` (15 files) + `templates/` (48 files) ≈ **332 KB / 85 files**.
The skill is designed for **multi-agent orchestration** — a Conductor that *dispatches fresh-context
role agents* and consumes 1–2 K-token summaries (`SKILL.md` Core Contract, Dispatch). Run inside one
`codex-exec` process there are **no subagents**: the distribution benefit disappears and all process
overhead + a long serial self-verification collapse into a single window. The design's core value
(fan-out to isolated contexts) is precisely what the runtime cannot provide.

### 1.4 Both arms failed the same hard sub-task

The hidden test demands parser **syntax-error recovery** (missing `}`) *plus* arity + undefined-symbol
diagnostics. Baseline emitted the semantic diagnostics but not the `/syntax|brace|expected.*\}/` one
(`actual: "wrong number of arguments…\nundefined symbol 'missing'"`). The harness produced a
*different* wrong implementation failing a different assertion (`actual:false, expected:true`). The
harness spent 2x the budget and did **not** solve the part that distinguishes a good solution.

---

## Part 2 — External evidence (literature)

Sourced via the deep-research workflow. **Verification caveat:** the workflow's own 3-vote
adversarial check was rate-limited into total abstention (every claim logged `0-0 (3 abstain)`; the
run mislabeled "0 confirmed" as "25 killed"). So these are **sourced-but-not-workflow-verified**
claims. I weight them by source quality and by their independent agreement with Part 1. Primary
sources unless noted.

### 2.1 Multi-agent / verifier scaffolds frequently do NOT beat a strong single agent

- On SWE-Bench, single- vs multi-agent architecture shows **no significant advantage** (Lite
  Kruskal-Wallis H=12.19, p=0.058); the autonomous single-agent group reached up to **73.2% on
  Verified** without complex scaffolding. [arXiv 2506.17208]
- **Top leaderboard teams removed verification/critic/voting**: TRAE dropped majority voting after
  performance *declined* with more sampling; Refact.ai removed its Critique step because the agent
  did better just **running tests and deciding next steps**; Warp and nFactorial abandoned
  multi-agent because passing context between agents *lost critical information*. [arXiv 2506.17208]
- Strong single-agent systems matched/beat multi-agent on coding benchmarks (HumanEval 90.2 vs 93.3,
  MBPP 79.6 vs 80.8, DS1000 62.9 vs 62.3); MAS led clearly only on hard multi-step **math**
  (AIME 25.0 vs 38.3). The MAS edge **shrinks as the base model strengthens** (~10% → ~3%) — least
  lift exactly in the frontier regime a modern harness runs in. [arXiv 2505.18286]
- In a controlled study **28/28 multi-agent configs underperformed** a tuned single-agent RAG
  baseline (−4.39% to −35.31%, p<0.01); coordination overhead — not input quality — was isolated as
  the primary cause. [mdpi 2079-9292/14/24/4883]

### 2.2 Why a scaffold scores LOWER even when it "works"

- Berkeley MAST taxonomy (7 frameworks, 41–86.7% failure rates): the largest failure class is
  **System Design / Specification (41.8%)** — disobeying task requirements (11.8%), **step
  repetition (15.7%)**, and **failure to recognize task completion / termination (12.4%)**. That is
  the whole-file-rewrite loop and the never-completing turn, named. [arXiv 2503.13657]
- Coordination/context-loss dominate failures across 200 executions / 6 systems; "agents lack shared
  global context" makes multi-agent fragile. [arXiv 2506.17208]
- A verifier is **not** a silver bullet — most do superficial checks. The fix that paid off was
  **multi-level verification** (low-level correctness *and* high-level task-objective), which added
  **+15.6% task success** on ProgramDev with the same model. [arXiv 2503.13657]

### 2.3 Cost/latency blowup is the expected price, not a fluke

- Multi-agent carries **4–220x** more input tokens than its single-agent counterpart. [arXiv 2505.18286]
- Coordination adds **3–4x inference calls** per query; consensus aggregation adds ~58% token cost —
  a fixed penalty independent of any quality gain. [mdpi 2079-9292/14/24/4883]
- A **hybrid cascade** — cheap single-agent path by default, escalate only hard cases — gave up to
  **+12% accuracy while cutting ~20% cost**. Scoped escalation beats always-on verifier loops.
  [arXiv 2505.18286]

### 2.4 Context-window control (directly fixes the crash)

- **Subagent context isolation**: specialists run in clean windows and return a condensed
  **1–2 K-token** summary, so tool/search detail never accumulates in the orchestrator.
  [Anthropic, Effective context engineering]
- **Compaction**: summarize near the limit, preserve decisions/open bugs/diffs, drop redundant tool
  output → runs continue past the window. Caveat: a probe retained 3/3 high-level but **0/3 obscure**
  facts — compact carefully. [Anthropic; Claude cookbook]
- **Tool-result clearing**: drop old re-fetchable `tool_result` payloads → message list 128,740 →
  43,060 tokens (**67%**); peak 173 K vs 335 K. [Claude cookbook]
- **File-based memory** beats re-reading: a distilled ~3 K-token note replaced re-reading 160 K+
  tokens of source next session. [Claude cookbook]
- Every token spends a finite **attention budget** — long accumulating loops lower recall/quality,
  not just hit a hard wall. The harness wrote the whole 600-line file repeatedly into its window.
  [Anthropic]

---

## Part 3 — Prioritized changes

Ordered by leverage. P0/P1 are required to make "≥80 vs baseline" both *possible* and *true*.

### P0 — Make the scorer able to reach 80 and reward harness quality (measurement)

Without this, no harness change can ever show 80.

1. **Uncap the dimensions.** Let each reach 10 (or rescale to a 0–100 with real headroom). Today's
   ceiling is 77.
2. **Make `correctness` and `feature_completeness` a gradient over hidden checks**, not binary
   all-pass. Score = fraction of hidden assertions passed. A harness that passes 3/4 hidden checks
   must outscore one that passes 1/4 — currently both collapse to 5.
3. **Add harness-sensitive signals**: diff size (reward minimal diff), regression tests added,
   `bug_catch_matrix` items hit, "recognized completion vs looped." These are where a good harness
   differs; the current rubric measures none of them.
4. **Stop the comment heuristic from being the whole signal.** `documentation` swinging the result
   on `≥2 //` is noise.

### P0 — Decontaminate and instrument the eval (methodology)

5. **Remove eval-internal files from the harness reference.** `copyHarnessRef` must exclude
   `templates/harness-eval-cases/**` (and anything describing the case/rubric). The agent read the
   case definition at `item_24/25`. Copy only what a real user gets.
6. **Fix cost capture.** `tool_calls` parsed as 0 for both arms (the `function_call` matcher misses
   codex-exec's format); on crash, tokens recorded 0. Capture partial usage and mark
   `crashed:true` explicitly so a context-window failure is a first-class, visible outcome — not a
   silent 0.
7. **Run more than one case.** The report itself says one hard case = `not_proven`. Use the existing
   `2026-06-06-harness-eval-3case` set; report per-case and aggregate.

### P1 — Make the harness runtime-aware and lean (the real win)

The skill must detect *how it is being run* and not impose multi-agent ceremony on a single,
sandboxed, non-interactive process.

8. **Add an INLINE / single-process degrade mode.** When no subagent dispatch and no human are
   available (the eval's `codex-exec` case), the skill should:
   - load **only** a ~30-line inline contract — never `cat` the full `SKILL.md` or walk
     `reference/` / `templates/` (Part 1.3; [Anthropic attention budget]);
   - **skip** worktree, 6-file vault, Human-Feedback gate, Committee (architect+security+code-review),
     circuit-breaker ceremony — none are meaningful inside one process;
   - cap self-verification to **one** scoped pass.
   Detection: presence/absence of a real `Task`/`Agent` tool + an interactive human.
9. **Budget the context explicitly.** Compact or summarize before the window fills; prefer
   file-based scratchpad notes over re-reading; never hold the whole target file in context across
   turns. [Anthropic; Claude cookbook 2.4]
10. **Enforce minimal, targeted diffs.** Forbid whole-file rewrites; edit the smallest span. Directly
    kills the `item_41/45/61` rewrite loop and the "step repetition" failure mode [arXiv 2503.13657].
11. **Make verification sandbox-aware and scoped.** Use only what the sandbox allows
    (`npm test`, `node --check`); do not spawn `node -e` / heredoc debug processes that get rejected.
    Prefer **test-run-and-decide** over a critique layer — the pattern top teams kept after removing
    critics [arXiv 2506.17208]. Reserve a heavier verifier for an explicit **high-level objective**
    check only (the +15.6% lever [arXiv 2503.13657]), not low-level re-checking.
12. **Test-first localization on the actual bug.** The win on case-015 is parser syntax-error
    recovery + per-requirement diagnostics. The harness should: localize → write a failing test per
    hidden-style requirement → minimal fix → re-run. That is what raises pass@1 *and* the
    correctness/feature dimensions — the only dimensions with real headroom once P0 lands.

### P2 — Adopt the cascade so the harness only runs when it helps

13. **Default to the lean single-agent path; escalate to full supergoal orchestration only on
    detected hard/long-horizon cases** (multi-file, cross-module, repeated failures). Always-on
    multi-agent is the configuration the literature shows losing; selective escalation is the one
    that won (+12% acc / −20% cost) [arXiv 2505.18286]. This is also the honest scope for the skill:
    it is built for multi-agent, long-horizon work — not single-file repair inside one process.

---

## Expected effect

- After **P0**: a correct, minimal, test-passing solution can score in the **low-to-mid 80s** (the
  uncapped correctness/feature/architecture/docs headroom), and the harness's extra checks-passed /
  smaller-diff become visible instead of washing out.
- After **P1**: the harness stops crashing, completes its turn under budget, and on a genuinely hard
  case passes more hidden checks than a one-shot baseline — turning the gradient correctness signal
  into a real margin.
- **Honest expectation**: on *easy single-file* cases, expect a **tie**, by design and by the
  evidence — that is the correct outcome, and the cascade (P2) makes it cheap. The harness should be
  evaluated and is expected to win on **hard, multi-file, long-horizon** cases, which this single LSP
  case is not a fair test of.

## Limitations of this analysis

- One hard case; cannot generalize harness effectiveness (the run's own conclusion).
- The deep-research workflow's adversarial verification was **rate-limited to full abstention**, so
  external claims are sourced but not workflow-verified; they are corroborated here only by their
  independent agreement with the local artifacts. Re-run the verification when the API is not rate-
  limited before treating any single external number as load-bearing.
- `tool_calls=0` means we cannot see the per-step tool behavior of either arm; P0#6 is needed before
  the next run to make process behavior measurable.

## Sources

Primary: arXiv 2505.18286 (single vs multi-agent), 2503.13657 (MAST: why MAS fail), 2506.17208
(SWE-bench architecture analysis + leaderboard ablations), 2603.01045 (coordination cost), mdpi
2079-9292/14/24/4883 (28-config comparison), Anthropic "Effective context engineering for AI
agents", Claude cookbook "context-engineering / tools". Local: `run.mjs`, `result.json`,
`raw/*.log`, `raw/*-final.txt`, `SKILL.md`.
