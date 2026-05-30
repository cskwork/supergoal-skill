# Fix plan (APPROVED) — hit-count lost-update race

## Root cause
`src/store.js` `incrementHit`: the `links.get(code)` read was hoisted OUT of the `enqueue()` mutex.
The mutex serialized only the write, not the read-modify-write as a unit. Under concurrency, many
calls read the same stale `hits` before any write commits, then all write `stale+1` → lost updates.
Single-threaded and low-traffic paths are unaffected, which is why the full suite stayed green.

## Fix (applied)
Move the read back INSIDE the `enqueue()` task so read-modify-write is one atomic critical section
(restores the pre-regression behavior). No interface change.

## Regression guard (permanent)
`test/hit-concurrency.test.js`: fire 200 concurrent `incrementHit` on one code; assert hits === 200.
Failed at 1/200 before the fix; closes the CI gap that let the race ship.

## Human Feedback

### Plain-language brief
The visit counter is wrong because many clicks can read the same old number at the same time. Each
click then saves "old number plus one", so 200 clicks can collapse into a much smaller count. The fix
is to make every click read and save the count inside the same protected section, so one click fully
finishes before the next click updates the same record.

### Technical brief
The bug is a lost-update race in `src/store.js` `incrementHit`. The current read happens before the
mutex, so concurrent calls share stale `hits` values. Move the `links.get(code)` read back inside
the `enqueue()` callback so read-modify-write is serialized. Keep the public API unchanged and add a
concurrency regression test that fails before the patch and passes after it. Fix can start only after
approval is recorded for the `Fix` phase.

### Terms
- Mutex: a lock-like sequencing tool that lets only one write operation run at a time.
- Lost update: a concurrency bug where later writes overwrite work from other operations.
- Regression test: a test kept in the suite to stop the same bug from returning.

### Approval request
Approve Fix, request changes to the fix plan, or stop.

## Acceptance (Verify gate)
- The previously-failing repro now passes in a clean sandbox.
- Full suite green.
- Concurrency result is stable across repeated runs (not flaky).
- No regression in any other test.
