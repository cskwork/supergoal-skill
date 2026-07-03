import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DecisionCache } from '../src/authorizer.mjs';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const req = (overrides = {}) => ({
  tenantId: 't1',
  userId: 'u1',
  resourceId: 'doc-1',
  action: 'read',
  policyVersion: 1,
  ...overrides,
});

test('tenantId is part of the cache key', async () => {
  const seen = [];
  const cache = new DecisionCache(async (request) => {
    seen.push(request.tenantId);
    return { allow: request.tenantId === 't1' ? ['read'] : [] };
  });
  assert.equal(await cache.can(req({ tenantId: 't1' })), true);
  assert.equal(await cache.can(req({ tenantId: 't2' })), false);
  assert.deepEqual(seen, ['t1', 't2']);
});

test('userId is part of the cache key', async () => {
  const seen = [];
  const cache = new DecisionCache(async (request) => {
    seen.push(request.userId);
    return { allow: request.userId === 'owner' ? ['read'] : [] };
  });
  assert.equal(await cache.can(req({ userId: 'owner' })), true);
  assert.equal(await cache.can(req({ userId: 'guest' })), false);
  assert.deepEqual(seen, ['owner', 'guest']);
});

test('action is part of the cache key', async () => {
  let calls = 0;
  const cache = new DecisionCache(async (request) => {
    calls += 1;
    return { allow: request.action === 'read' ? ['read'] : [] };
  });
  assert.equal(await cache.can(req({ action: 'read' })), true);
  assert.equal(await cache.can(req({ action: 'delete' })), false);
  assert.equal(calls, 2);
});

test('policyVersion is part of the cache key', async () => {
  const cache = new DecisionCache(async (request) => ({
    allow: request.policyVersion === 2 ? [] : ['read'],
  }));
  assert.equal(await cache.can(req({ policyVersion: 1 })), true);
  assert.equal(await cache.can(req({ policyVersion: 2 })), false);
});

test('denied decisions are not cached', async () => {
  let calls = 0;
  const cache = new DecisionCache(async () => {
    calls += 1;
    return { allow: calls === 1 ? [] : ['read'] };
  });
  assert.equal(await cache.can(req()), false);
  assert.equal(await cache.can(req()), true);
  assert.equal(calls, 2);
});

test('concurrent identical requests share one in-flight policy fetch', async () => {
  let calls = 0;
  const cache = new DecisionCache(async () => {
    calls += 1;
    await delay(25);
    return { allow: ['read'] };
  });
  const results = await Promise.all(Array.from({ length: 30 }, () => cache.can(req())));
  assert.deepEqual([...new Set(results)], [true]);
  assert.equal(calls, 1);
});

test('different cache keys still fetch concurrently', async () => {
  let active = 0;
  let maxActive = 0;
  const cache = new DecisionCache(async (request) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await delay(20);
    active -= 1;
    return { allow: request.userId === 'u2' ? [] : ['read'] };
  });
  const results = await Promise.all([
    cache.can(req({ userId: 'u1', resourceId: 'doc-1' })),
    cache.can(req({ userId: 'u2', resourceId: 'doc-2' })),
    cache.can(req({ userId: 'u3', resourceId: 'doc-3' })),
  ]);
  assert.deepEqual(results, [true, false, true]);
  assert.ok(maxActive >= 2, `expected parallel policy fetches, saw max ${maxActive}`);
});

test('a rejected policy fetch is shared but not cached', async () => {
  let calls = 0;
  const cache = new DecisionCache(async () => {
    calls += 1;
    await delay(10);
    if (calls === 1) throw new Error('policy backend down');
    return { allow: ['read'] };
  });
  const settled = await Promise.allSettled(Array.from({ length: 8 }, () => cache.can(req())));
  assert.ok(settled.every((item) => item.status === 'rejected'));
  assert.equal(calls, 1);
  assert.equal(cache.size(), 0);
  assert.equal(await cache.can(req()), true);
  assert.equal(calls, 2);
});
