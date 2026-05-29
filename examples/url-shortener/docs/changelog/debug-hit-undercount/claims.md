# Claims — DEBUG: hit-count undercount

Append-only. Each claim states what is asserted and the command a Verifier must run
to confirm or refute it. This file is the builder→verifier handoff contract: the
Builder writes claims; the Verifier runs them cold, with no shared context.

---

## CLAIM-01 — Buggy working tree loses 199 of 200 concurrent increments

**Assertion**: On the buggy `src/store.js` (read hoisted outside `enqueue()`), firing
200 concurrent `incrementHit()` calls via `Promise.all` on a single code yields
`hits === 1`, not 200. The loss is deterministic, not flaky.

**run-to-prove**:

```sh
# 1. Start from the repo root.
cd /path/to/url-shortener

# 2. Apply the buggy diff (hoists the read out of the lock).
#    The planted bug commit is 1a16eec; the correct HEAD is c3d74f6.
git checkout 1a16eec -- src/store.js

# 3. Run only the concurrency repro.
node --test test/hit-concurrency.test.js

# Expected output (buggy): 1 fail
#   not ok 1 - 200 concurrent incrementHit on the same code => hits === 200
#   # expected 200, actual 1, lost 199
```

**Expected result**: 1 test, 0 pass, 1 fail. `actual` reported as 1, `lost` as 199.

**Cleanup** (restore correct source before next claim):

```sh
git checkout c3d74f6 -- src/store.js
```

---

## CLAIM-02 — Fixed working tree counts all 200 increments correctly

**Assertion**: With the read moved back INSIDE `enqueue()` (committed HEAD `c3d74f6`),
the same 200-concurrent repro yields `hits === 200` with zero lost updates, and the
result is stable across at least 5 consecutive runs.

**run-to-prove**:

```sh
# 1. Ensure correct (fixed) source is active.
cd /path/to/url-shortener
git checkout c3d74f6 -- src/store.js

# 2. Run the concurrency repro 5 times.
for i in 1 2 3 4 5; do
  node --test test/hit-concurrency.test.js
done

# Expected output (each run): 1 pass, 0 fail
#   ok 1 - 200 concurrent incrementHit on the same code => hits === 200
#   # [repro] expected hits=200 actual hits=200 lost=0
```

**Expected result**: 5 × (1 pass, 0 fail). Zero lost updates in every run.

---

## CLAIM-03 — Full suite stays green after the fix

**Assertion**: The fix touches only the critical section in `incrementHit`; all other
52 tests remain green.

**run-to-prove**:

```sh
cd /path/to/url-shortener
git checkout c3d74f6 -- src/store.js
npm test

# Expected: tests 52 (or 53 if test/_stress_throwaway.mjs is present), pass all, fail 0
```

**Expected result**: `fail 0`. Duration under 500 ms.

---

## CLAIM-04 — `create()` is unaffected (its read is already inside `enqueue()`)

**Assertion**: The 50x concurrent `create()` test passes on BOTH the buggy and the
fixed store because `create()` never had its read hoisted outside the lock.

**run-to-prove**:

```sh
cd /path/to/url-shortener
git checkout 1a16eec -- src/store.js   # buggy version
node --test --test-name-pattern "50 concurrent" test/store.test.js
# Expected: pass (create concurrency unaffected by the incrementHit bug)

git checkout c3d74f6 -- src/store.js   # restore
```

**Expected result**: test passes on the buggy tree, confirming the race is isolated to
`incrementHit`'s structural change and is not a systemic lock failure.
