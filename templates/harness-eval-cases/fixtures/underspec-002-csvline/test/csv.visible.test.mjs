import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCsvLine } from '../src/csv.mjs';

test('splits a simple comma-separated line', () => {
  assert.deepEqual(parseCsvLine('a,b,c'), ['a', 'b', 'c']);
});
