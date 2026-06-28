# Workflow Proof

## Frame

- Mode: LEGACY.
- Goal: implement `deepMerge(target, source)` in `src/merge.mjs`.
- Acceptance: merge source into target, return the same target, recurse through nested plain objects, let source values override conflicts, and pass `npm test`.
- Isolation: used the provided work dir only; did not create another worktree because the harness explicitly marked the work dir as isolated.

## Code Map

- `src/merge.mjs:33` exports `deepMerge`.
- `src/merge.mjs:42` iterates source own enumerable keys.
- `src/merge.mjs:50` recursively merges when both sides are plain objects.
- `src/merge.mjs:53` replaces target values with cloned source structures when recursion is not valid.
- `test/merge.visible.test.mjs:5` covers flat override.
- `test/merge.visible.test.mjs:9` covers recursive merge plus target identity.
- `test/merge.visible.test.mjs:17` covers replacement for scalars, arrays, and null.
- `test/merge.visible.test.mjs:24` covers source immutability for copied nested structures.
- `test/merge.visible.test.mjs:34` covers prototype-pollution keys.

## Verification

- Required command: `npm test`
- Captured output: `outputs/npm-test.txt`
- Result: pass, 5 tests, 0 failures.
