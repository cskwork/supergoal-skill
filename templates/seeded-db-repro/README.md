# Disposable seeded-DB repro

A trusted, deterministic RED for a **data-backed bug when you cannot reach a live/dev DB** (no
credentials, prod-only data, offline). Converts a "needs-live, unprovable" bug into a re-runnable
red-green. The trusted RED is the precondition for any fix (`reference/debugging.md`).

## When to use

- The symptom depends on DB rows/state (wrong list, leaked/duplicated/missing rows, scope/tenant
  bleed, ordering, aggregation) AND you cannot observe or seed the real DB.
- You want a fast deterministic repro instead of standing up the whole app.

## Recipe

1. **Minimal schema** — only the tables/columns the bug touches. Derive from the failing query/code,
   not the full DDL.
2. **Smallest seed that triggers the symptom** — the minimal rows that make it wrong. For a scope/
   session leak: one user with **two** active scopes (the bug needs ≥2 to show). Add one neighbouring
   row that must stay correct, to pin the invariant.
3. **RED** — run the CURRENT (buggy) query/code against the seed → it returns the wrong rows. Assert
   the wrongness (e.g. rows from another scope are present).
4. **GREEN** — run the intended fix → it returns the right rows. Assert the leak is gone.
5. **Invariant** — assert the neighbouring correct case is unchanged, so the fix does not over-reach.

Disposable = in-memory or a temp file, re-runnable, no shared/dev state. The script's exit code is the
machine signal: non-zero while the bug reproduces, zero once buggy-leaks + fixed-clean + invariant-held
all hold (a fixture that *discriminates*).

## Tools

- **SQLite** — `python3` stdlib `sqlite3` (zero-dep, in-memory), or the `sqlite3` CLI. Best for logic/
  scope/filter bugs that are dialect-agnostic. See `example.py`.
- **JVM** — H2 in-memory, or a throwaway **Testcontainers** instance of the real engine.
- Match the project's DB dialect when the bug is dialect-specific (escape rules, NULL/JOIN semantics,
  collation). A distilled in-memory repro proves the **bug class / logic**; for engine-specific bugs
  prefer a throwaway instance of the **real** engine over a substitute.

## Caveat

This is a REPRO, not the fix's final proof. The fix must still pass the project's REAL tests; if the
bug is engine-specific, confirm on the real engine before claiming done.
