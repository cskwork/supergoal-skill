# Debugging - DEBUG mode

DEBUG is deep-and-narrow work. Use one driving `debugger`/`tracer` so the causal model stays coherent.
Spawn helpers only for independent probes, and put their summaries in the vault.

Reproduce's exit gate is a trusted feedback loop: a deterministic repro you can re-run cheaply after
every probe. No trusted loop, no fix. For web/UI bugs, drive the loop through `qa-tester` and
`reference/qa.md` so browser dumps stay out of the conductor context.

## Read-only until the cause is confirmed

Through Reproduce and Diagnose, analyze only. No speculative edits - they corrupt the repro state.
The first source-tree write waits until one root cause is confirmed by direct evidence and the fix
plan is written.

## Single-driver default, escalate on breadth

DEBUG defaults to one driver, and a simple Reproduce -> Localize -> Fix -> Verify loop beats sprawl on
most bugs. Single-driver is a default, not a rule: when the fix spans many files or several services
(diff likely touches more than ~5 files, or the failing path crosses more than one service boundary),
split into separate contexts — one agent localizes (returns location + a structural preview only, not
whole files), another fixes — so the search-and-edit trace does not overflow one context.

## Distributed triage (cross-boundary bugs)

When the failure spans DB, API, network, or message-queue boundaries, map before you dig:

1. **Golden signals first.** Frame the symptom in latency, traffic, errors, saturation (RED =
   rate/errors/duration is the request-side subset; USE is the resource side). State *what* is broken
   before guessing *why*; chase only causes that are definite and imminent.
2. **Correlation ID is a precondition.** Cross-service RCA needs a trace/request/correlation ID
   propagated across every boundary (HTTP headers, RPC metadata, queue properties). If none exists,
   say so and make establishing it the first task; do not guess causation across services without it.
3. **Known-good vs known-bad.** Compare a passing request/trace against a failing one. Find the
   tag/value (env, version, route, dependency) *unusually* correlated with failures, not ones always
   present. Recent clustering points to cause; always-clustered is baseline noise.
4. **Failure-pattern checklist.** Before blaming app logic, rule out common distributed traps:
   cascading overload (grows by positive feedback; secondary symptoms mimic the cause), retry storms
   (retries multiply load across layers — needs jittered backoff + per-request limit + retry budget),
   missing deadline propagation (work spent on already-failed requests), partial failure / bimodal
   latency (a few slow requests exhaust upstream pools). Read latency distributions, not averages.

## Loop

1. **Reproduce red (fail-to-pass).** Create a deterministic failing test or scripted repro in a clean
   sandbox (fresh `git worktree` at HEAD). The repro must FAIL on current code and PASS after the fix
   with no new failures (F->P). Reproduction is its own skill, not free with fix-capability: scaffold
   it explicitly. Pin intermittent bugs first — flaky/timing/concurrency repros must fail consistently
   over N repeated runs before you trust them. Record `run-to-prove`.
2. **Localize.** Narrow the smallest region. Use `git bisect`, input/state binary search, the
   distributed triage above, and focused instrumentation instead of guessing. Read structure/skeleton
   first; load full code only for the few suspects that survive.
3. **Compete hypotheses (symptom vs cause).** Put 2-3 root causes in `README.md` using a hypothesis
   ledger format: symptom, candidate cause, evidence-for, evidence-against,
   and "definite & imminent?". Pick the next probe that best separates them. Resist fixating on the
   first plausible cause; advance only causes backed by direct evidence.
4. **Confirm.** Before locking the cause, present the 3-5 ranked hypotheses to the user for re-ranking
   (cheap checkpoint, non-blocking — proceed on your own ranking if the user is AFK; see
   `reference/interview.md`). Then back one hypothesis with direct evidence at the boundary, advancing
   a user-preferred hypothesis only when evidence still supports it. Write the fix plan in `README.md`;
   stop and ask the user only on SKILL.md hard stops (destructive/irreversible fix, or the cause stays
   genuinely ambiguous) - otherwise proceed.
5. **Fix root cause (minimal diff, checkpoint per step).** Smallest change that addresses cause, not
   symptom. No silencing, fake success, broad refactor, or unrelated cleanup. Checkpoint after each
   plan step so every change traces to one observed outcome; do not free-form edit until green.
6. **Verify regression.** The red repro now passes in a clean sandbox and the full suite stays green.
   This failing-before/passing-after proof is DEBUG's literal delivery evidence.

## Circuit breaker

Same error signature 3 times: stop. Record attempts + leading hypothesis in `README.md`, then escalate
with evidence.

## Vault

Every probe result goes to `README.md`. The vault prevents fresh contexts from re-investigating solved
ground.
