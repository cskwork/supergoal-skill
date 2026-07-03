import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DecisionCache } from '../src/authorizer.mjs';

const req = (overrides = {}) => ({
  tenantId: 't1',
  userId: 'u1',
  resourceId: 'doc-1',
  action: 'read',
  policyVersion: 1,
  ...overrides,
});

test('caches an allowed decision for the same request', async () => {
  let calls = 0;
  const cache = new DecisionCache(async () => {
    calls += 1;
    return { allow: ['read'] };
  });
  assert.equal(await cache.can(req()), true);
  assert.equal(await cache.can(req()), true);
  assert.equal(calls, 1);
  assert.equal(cache.size(), 1);
});

test('returns false when the policy does not allow the requested action', async () => {
  const cache = new DecisionCache(async () => ({ allow: ['read'] }));
  assert.equal(await cache.can(req({ action: 'delete' })), false);
});

test('clear drops cached decisions', async () => {
  let calls = 0;
  const cache = new DecisionCache(async () => {
    calls += 1;
    return { allow: ['read'] };
  });
  assert.equal(await cache.can(req()), true);
  cache.clear();
  assert.equal(cache.size(), 0);
  assert.equal(await cache.can(req()), true);
  assert.equal(calls, 2);
});
