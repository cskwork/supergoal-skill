import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deepMerge } from '../src/merge.mjs';

test('merges two flat objects; source overrides target', () => {
  assert.deepEqual(deepMerge({ a: 1, b: 2 }, { b: 3, c: 4 }), { a: 1, b: 3, c: 4 });
});
