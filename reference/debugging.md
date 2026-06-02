# Debugging - DEBUG mode

DEBUG is deep-and-narrow work. Use one driving `debugger`/`tracer` so the causal model stays coherent.
Spawn helpers only for independent probes, and put their summaries in the vault.

Use the `diagnose` skill for Reproduce + Diagnose. Its "build a feedback loop" phase is the Reproduce
exit gate: no trusted loop, no fix. For web/UI bugs, drive the loop through `qa-tester` and
`reference/qa.md` so browser dumps stay out of the conductor context.

## Read-only until approval

Through Reproduce, Diagnose, and Human Feedback, analyze only. No speculative edits. They corrupt the
repro state. First source-tree write waits for approved Human Feedback.

## Loop

1. **Reproduce red.** Create a deterministic failing test or scripted repro in a clean sandbox
   (fresh `git worktree` at HEAD). Intermittent bugs must be pinned first. Record `run-to-prove`.
2. **Localize.** Narrow the smallest region. Use `git bisect`, input/state binary search, and focused
   instrumentation instead of guessing.
3. **Compete hypotheses.** Put 2-3 root causes in `README.md`, each with evidence for/against. Pick the
   next probe that best separates them.
4. **Confirm.** Back one hypothesis with direct evidence at the boundary, then write the fix plan and
   ask for Human Feedback.
5. **Fix root cause.** Smallest change that addresses cause, not symptom. No silencing, fake success,
   broad refactor, or unrelated cleanup.
6. **Verify regression.** The red repro now passes in a clean sandbox and the full suite stays green.
   This failing-before/passing-after proof is DEBUG's literal delivery evidence.

## Circuit breaker

Same error signature 3 times: stop. Record attempts + leading hypothesis in `README.md`, then escalate
with evidence.

## Vault

Every probe result goes to `README.md`. The vault prevents fresh contexts from re-investigating solved
ground.
