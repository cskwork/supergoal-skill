# AsyncCache async race proof

## Theory

Problem: `get(key, loader)` only wrote to `values` after `await loader(key)`, so same-key concurrent
callers all missed the cache before the first load resolved and each invoked `loader`.

Expected outcome: one in-flight load per key; every same-key caller awaits that load and receives the
same resolved value. Different keys keep independent loads. Rejections do not populate the resolved cache.

## Red proof

Command: `npm test`

Result before source fix: failed on `same-key concurrent gets share one in-flight load`.

Evidence: the test observed `calls === 2` when the required value was `1`.

## Fix

Changed `src/cache.mjs` to add `this.inFlight`, checked before starting a new loader.

Resolved values still live in `this.values`, so `has(key)` only reports completed cache entries.

Rejected loads delete their in-flight entry and never set `values`.

## Green proof

Command: `npm test`

Result after source fix: passed 6 tests, 0 failures.
