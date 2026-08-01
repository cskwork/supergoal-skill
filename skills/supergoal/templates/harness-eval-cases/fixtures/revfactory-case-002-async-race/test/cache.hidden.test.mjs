import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AsyncCache } from '../src/cache.mjs';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

test('concurrent gets for the same key call loader exactly once', async () => {
  const cache = new AsyncCache();
  let calls = 0;
  const loader = async (k) => { calls += 1; await delay(20); return `v:${k}`; };
  const results = await Promise.all(Array.from({ length: 50 }, () => cache.get('a', loader)));
  assert.deepEqual([...new Set(results)], ['v:a']);
  assert.equal(calls, 1);
});

test('repeated concurrent bursts each load once on a fresh cache', async () => {
  for (let i = 0; i < 5; i += 1) {
    const cache = new AsyncCache();
    let calls = 0;
    const loader = async () => { calls += 1; await delay(5); return i; };
    await Promise.all(Array.from({ length: 25 }, () => cache.get('k', loader)));
    assert.equal(calls, 1);
  }
});

test('different keys load concurrently, not serialized', async () => {
  const cache = new AsyncCache();
  let active = 0; let maxActive = 0;
  const loader = async (k) => {
    active += 1; maxActive = Math.max(maxActive, active);
    await delay(30);
    active -= 1;
    return k;
  };
  await Promise.all(['a', 'b', 'c', 'd'].map((k) => cache.get(k, loader)));
  assert.ok(maxActive >= 2, `expected parallel loads across keys, saw max ${maxActive}`);
});

test('a failing loader is not cached and the next call retries', async () => {
  const cache = new AsyncCache();
  let calls = 0;
  const loader = async () => { calls += 1; if (calls === 1) throw new Error('boom'); return 'ok'; };
  await assert.rejects(() => cache.get('a', loader), /boom/);
  assert.equal(cache.has('a'), false);
  assert.equal(await cache.get('a', loader), 'ok');
  assert.equal(calls, 2);
});

test('all concurrent callers reject when the shared in-flight load fails', async () => {
  const cache = new AsyncCache();
  let calls = 0;
  const loader = async () => { calls += 1; await delay(10); throw new Error('fail'); };
  const settled = await Promise.allSettled(Array.from({ length: 10 }, () => cache.get('a', loader)));
  assert.ok(settled.every((s) => s.status === 'rejected'));
  assert.equal(calls, 1);
  assert.equal(cache.has('a'), false);
});
