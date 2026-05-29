# README — DEBUG: hit-count undercount under concurrency

Run audit log and key decisions. Narrative synthesized from decisions.log (now folded here).

---

## Audit log / decisions

### 2026-05-29 — OBSERVATION

- **Symptom**: `GET /api/stats/:code` reports `hits` less than actual redirects, ONLY under
  many concurrent requests to the same high-traffic code. Low-traffic codes accurate;
  a single request is always counted. Full suite (51/51) was green — CI missed it entirely.
- **Repro** (`test/hit-concurrency.test.js`): fire N=200 concurrent `store.incrementHit()` on
  one code via `Promise.all`, assert `stats.hits === N`.
  Result: expected 200, actual 1, lost 199. Deterministic — fails every run.

### LOCALIZE

Single commit in repo (`c3d74f6`). A PRE-EXISTING uncommitted modification existed:
`M src/store.js` (not made by this investigation).

`git diff src/store.js` showed the introducing change in `incrementHit` (lines ~48–56): the
record READ was hoisted OUT of the `enqueue()` lock under a "perf" comment.

- BEFORE (committed, correct): `get(code)` + `hits+1` INSIDE `enqueue` — atomic RMW.
- AFTER (working tree, buggy): `const existing = links.get(code)` read OUTSIDE `enqueue`;
  only the write ran inside the lock.

### HYPOTHESES

| Hypothesis | Status | Key evidence |
|------------|--------|--------------|
| H1 Lost-update race: read-outside-lock | **LEAD / CONFIRMED** | Code path, repro 1/200, control commit 200/200 |
| H2 Persistence / atomic-write timing | REJECTED | 50x concurrent creates pass; loss is in-memory |
| H3 Counter type / JSON coercion | REJECTED | Round-trip test asserts `hits===1` numeric |
| H4 Stats reads stale data (reader-side) | REJECTED | `stats()` reads in-memory Map; loss is in write path |

### ROOT CAUSE (CONFIRMED)

`src/store.js incrementHit` (working-tree version, lines ~51–61):

```js
const existing = links.get(code);      // READ outside the lock
if (!existing) return null;
return enqueue(async () => {
  const updated = Object.freeze({ ...existing, hits: existing.hits + 1 }); // stale base
  links.set(code, updated);
  await persist();
});
```

Interleaving (N=200): all callers synchronously read `existing.hits=0` before any
enqueued write runs. Each writer then commits `0+1=1`. One update survives — all others
overwrite each other with the same stale result. Final count: 1.

Node is single-threaded, but cooperative concurrency still races across `await` points.
`enqueue` defers the write to a later microtask; all 200 synchronous reads complete before
any deferred write, so every write is computed from the same pre-commit snapshot.
The mutex prevents interleaved WRITES, not stale READS. H1 stands.

Discriminating probe: `git stash` the diff, run repro on COMMITTED store → 200/200, 0 lost.
Restore → 1/200. Bug lives entirely in the diff. Single-variable causal proof.

### MINIMAL FIX (PROPOSED, NOT APPLIED during DEBUG phase)

Move the read back INSIDE `enqueue` so read-modify-write is one atomic critical section:

```js
async function incrementHit(code) {
  ensureInit();
  return enqueue(async () => {
    const existing = links.get(code);
    if (!existing) return null;
    const updated = Object.freeze({ ...existing, hits: existing.hits + 1 });
    links.set(code, updated);
    await persist();
    return updated;
  });
}
```

Equivalent to `git checkout -- src/store.js`. The "perf" comment (lines 48–50) removed
with it.

### REGRESSION GUARD

Keep `test/hit-concurrency.test.js` (200x concurrent `incrementHit` === 200). Fails on
buggy version; passes on committed/fixed version — closes the CI gap.

### STOP

No source files under `src/` or `bin/` were modified during the DEBUG phase.
Working tree unchanged except: pre-existing `M src/store.js` (planted bug, left as-is) +
new untracked `test/hit-concurrency.test.js`. Awaited approval to fix.

Approval was granted (Fix phase). Fix applied. Verified GREEN (see verification.md).
