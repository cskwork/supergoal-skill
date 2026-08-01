import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AsyncCache } from '../src/cache.mjs';

test('loads then caches; a second sequential get does not reload', async () => {
  const cache = new AsyncCache();
  let calls = 0;
  const loader = async (k) => { calls += 1; return `v:${k}`; };
  assert.equal(await cache.get('a', loader), 'v:a');
  assert.equal(await cache.get('a', loader), 'v:a');
  assert.equal(calls, 1);
  assert.equal(cache.has('a'), true);
});

test('clear() drops cached values', async () => {
  const cache = new AsyncCache();
  const loader = async (k) => `v:${k}`;
  await cache.get('a', loader);
  cache.clear();
  assert.equal(cache.has('a'), false);
});

test('distinct keys load independently', async () => {
  const cache = new AsyncCache();
  const loader = async (k) => `v:${k}`;
  assert.equal(await cache.get('a', loader), 'v:a');
  assert.equal(await cache.get('b', loader), 'v:b');
});
