import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deepMerge } from '../src/merge.mjs';

test('deep-merges nested objects instead of shallow overwrite', () => {
  assert.deepEqual(deepMerge({ a: { x: 1, y: 2 } }, { a: { y: 3, z: 4 } }), { a: { x: 1, y: 3, z: 4 } });
});

test('does not pollute via a __proto__ key', () => {
  const out = deepMerge({}, JSON.parse('{"__proto__": {"polluted": true}}'));
  assert.equal(({}).polluted, undefined, 'Object.prototype was polluted');
  assert.equal(out.polluted, undefined, 'result inherited a polluted prop');
});

test('null or undefined source returns the target values unchanged', () => {
  assert.deepEqual(deepMerge({ a: 1 }, null), { a: 1 });
  assert.deepEqual(deepMerge({ a: 1 }, undefined), { a: 1 });
});

test('object replaces primitive and primitive replaces object', () => {
  assert.deepEqual(deepMerge({ a: 1 }, { a: { b: 2 } }), { a: { b: 2 } });
  assert.deepEqual(deepMerge({ a: { b: 2 } }, { a: 5 }), { a: 5 });
});
