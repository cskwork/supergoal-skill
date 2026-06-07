#!/usr/bin/env node
// HARNESS-EVAL: does the supergoal skill beat a plain baseline?
// Two cases (SG_EVAL_CASE): revfactory-case-003 (refactoring, medium) and
// revfactory-case-002 (async race bug-fix, hard). Two arms, same model+effort:
//   baseline : single bare codex pass, no skill, told not to use it.
//   harness  : the skill's now-default role-separated loop -
//              build (consults the stripped, approved SKILL.md) -> critic
//              (writes spec-derived failing tests; no src edits) -> fixer
//              (smallest change; no test edits) -> verifier. Cost recorded so
//              the extra-compute tradeoff is explicit.
//
// Controls (per reference/harness-eval.md):
//  - same fixture per case; isolated /tmp sandboxes; identical task wording.
//  - harness arm sees ONLY a stripped skill ref (SKILL.md + reference/ + agents/);
//    the eval cases, hidden tests, and scorer are NEVER reachable by any arm.
//  - scoring uses a throwaway copy whose test/ dir is reset to the canonical
//    visible + hidden tests, so critic-added tests cannot move the denominator.
//  - a crash / timeout is a recorded LOSS (crashed flag), never a silent zero.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(EXP, "..", "..", "..");
const MODEL = process.env.SG_EVAL_MODEL || "gpt-5.5";
const EFFORT = process.env.SG_EVAL_EFFORT || "low";
const CASE = process.env.SG_EVAL_CASE || "003";
const RUN_ROOT = process.env.SG_EVAL_RUN_ROOT || `/tmp/sg-eval-skill-vs-baseline-${CASE}`;
const TIMEOUT_MS = Number(process.env.SG_EVAL_TIMEOUT_MS || 720000);
const BASELINE_SEEDS = Number(process.env.SG_EVAL_BASELINE_SEEDS || 2);
const HARNESS_SEEDS = Number(process.env.SG_EVAL_HARNESS_SEEDS || 2);
const NAIVE_SEEDS = Number(process.env.SG_EVAL_NAIVE_SEEDS || 0);
const LOOPS = Number(process.env.SG_EVAL_LOOPS || 3);
const RESULT_SUFFIX = process.env.SG_EVAL_RESULT_SUFFIX || "";

// ----------------------------------------------------------------------------
// Cases. Each is clean-slate, runnable with `node --test`, dependency-free.
// `files` is written into every sandbox; `hidden` is injected only into the
// scoring copy. `dump`-captured expected values are baked in.
// ----------------------------------------------------------------------------
const CASES = {
  // ---- Under-specified greenfield: thin prompt, latent-correctness hidden tests. ----
  "u1": {
    id: "underspec-deepmerge",
    difficulty: "under-specified",
    title: "deepMerge(target, source) - thin spec",
    source: "src/merge.mjs",
    visibleTest: "test/merge.visible.test.mjs",
    hiddenTest: "test/merge.hidden.test.mjs",
    task: [
      "Implement deepMerge(target, source) in src/merge.mjs.",
      "It merges the source object into the target object and returns the merged result.",
      "Export deepMerge.",
    ].join("\n"),
    files: {
      "package.json": JSON.stringify(
        { name: "underspec-deepmerge", version: "1.0.0", type: "module", scripts: { test: "node --test" } },
        null, 2) + "\n",
      "src/merge.mjs": [
        "export function deepMerge(target, source) {",
        "  throw new Error('not implemented');",
        "}",
        "",
      ].join("\n"),
      "test/merge.visible.test.mjs": [
        "import assert from 'node:assert/strict';",
        "import { test } from 'node:test';",
        "import { deepMerge } from '../src/merge.mjs';",
        "",
        "test('merges two flat objects; source overrides target', () => {",
        "  assert.deepEqual(deepMerge({ a: 1, b: 2 }, { b: 3, c: 4 }), { a: 1, b: 3, c: 4 });",
        "});",
        "",
      ].join("\n"),
    },
    hidden: [
      "import assert from 'node:assert/strict';",
      "import { test } from 'node:test';",
      "import { deepMerge } from '../src/merge.mjs';",
      "",
      "test('deep-merges nested objects instead of shallow overwrite', () => {",
      "  assert.deepEqual(deepMerge({ a: { x: 1, y: 2 } }, { a: { y: 3, z: 4 } }), { a: { x: 1, y: 3, z: 4 } });",
      "});",
      "",
      "test('does not pollute via a __proto__ key', () => {",
      "  const out = deepMerge({}, JSON.parse('{\"__proto__\": {\"polluted\": true}}'));",
      "  assert.equal(({}).polluted, undefined, 'Object.prototype was polluted');",
      "  assert.equal(out.polluted, undefined, 'result inherited a polluted prop');",
      "});",
      "",
      "test('null or undefined source returns the target values unchanged', () => {",
      "  assert.deepEqual(deepMerge({ a: 1 }, null), { a: 1 });",
      "  assert.deepEqual(deepMerge({ a: 1 }, undefined), { a: 1 });",
      "});",
      "",
      "test('object replaces primitive and primitive replaces object', () => {",
      "  assert.deepEqual(deepMerge({ a: 1 }, { a: { b: 2 } }), { a: { b: 2 } });",
      "  assert.deepEqual(deepMerge({ a: { b: 2 } }, { a: 5 }), { a: 5 });",
      "});",
      "",
    ].join("\n"),
  },

  "u2": {
    id: "underspec-csvline",
    difficulty: "under-specified",
    title: "parseCsvLine(line) - thin spec",
    source: "src/csv.mjs",
    visibleTest: "test/csv.visible.test.mjs",
    hiddenTest: "test/csv.hidden.test.mjs",
    task: [
      "Implement parseCsvLine(line) in src/csv.mjs that parses a single CSV line",
      "into an array of field strings. Export parseCsvLine.",
    ].join("\n"),
    files: {
      "package.json": JSON.stringify(
        { name: "underspec-csvline", version: "1.0.0", type: "module", scripts: { test: "node --test" } },
        null, 2) + "\n",
      "src/csv.mjs": [
        "export function parseCsvLine(line) {",
        "  throw new Error('not implemented');",
        "}",
        "",
      ].join("\n"),
      "test/csv.visible.test.mjs": [
        "import assert from 'node:assert/strict';",
        "import { test } from 'node:test';",
        "import { parseCsvLine } from '../src/csv.mjs';",
        "",
        "test('splits a simple comma-separated line', () => {",
        "  assert.deepEqual(parseCsvLine('a,b,c'), ['a', 'b', 'c']);",
        "});",
        "",
      ].join("\n"),
    },
    hidden: [
      "import assert from 'node:assert/strict';",
      "import { test } from 'node:test';",
      "import { parseCsvLine } from '../src/csv.mjs';",
      "",
      "test('a quoted field may contain commas', () => {",
      "  assert.deepEqual(parseCsvLine('a,\"b,c\",d'), ['a', 'b,c', 'd']);",
      "});",
      "",
      "test('doubled quotes inside a quoted field are an escaped quote', () => {",
      "  assert.deepEqual(parseCsvLine('\"a\"\"b\",c'), ['a\"b', 'c']);",
      "});",
      "",
      "test('empty and trailing fields are preserved', () => {",
      "  assert.deepEqual(parseCsvLine('a,,c'), ['a', '', 'c']);",
      "  assert.deepEqual(parseCsvLine('a,'), ['a', '']);",
      "});",
      "",
      "test('a quoted field preserves surrounding spaces', () => {",
      "  assert.deepEqual(parseCsvLine('\"  x  \",y'), ['  x  ', 'y']);",
      "});",
      "",
      "test('a single field with no comma returns one element', () => {",
      "  assert.deepEqual(parseCsvLine('hello'), ['hello']);",
      "});",
      "",
    ].join("\n"),
  },

  "003": {
    id: "revfactory-case-003",
    difficulty: "medium",
    title: "Spaghetti-code refactoring (no behavior change)",
    source: "src/order.mjs",
    visibleTest: "test/order.visible.test.mjs",
    hiddenTest: "test/order.hidden.test.mjs",
    task: [
      "Refactor src/order.mjs for clarity WITHOUT changing observable behavior.",
      "calculateInvoice(order) is one long tangled function; split it into small",
      "cohesive helpers (subtotal, discount, tax, shipping) while producing the",
      "EXACT same results for every input.",
      "",
      "Requirements (must stay byte-for-byte compatible with the current code):",
      "- Keep the public API identical: export calculateInvoice(order) returning",
      "  { subtotal, discount, tax, shipping, total }, each rounded to cents.",
      "- Preserve every edge: coupon rules SAVE10 (10%), SAVE20 (20% only when",
      "  subtotal >= 100, otherwise 10%), HALF (50% only when order.vip); the VIP",
      "  floor that raises discount to at least 5% of subtotal but must NEVER reduce",
      "  a larger coupon discount; regional tax US 7% / EU 20% / otherwise 10% applied",
      "  to (subtotal - discount); shipping tiers on (subtotal - discount): < 50 -> 7.5,",
      "  < 100 -> 3, else 0, with an additive +12 express fee; cent rounding on output.",
      "- Do not add dependencies or rewrite unrelated code.",
    ].join("\n"),
    files: {
      "package.json": JSON.stringify(
        { name: "case-003-refactoring", version: "1.0.0", type: "module", scripts: { test: "node --test" } },
        null, 2) + "\n",
      "src/order.mjs": [
        "export function calculateInvoice(order) {",
        "  let subtotal = 0;",
        "  for (let i = 0; i < order.items.length; i++) {",
        "    subtotal += order.items[i].price * order.items[i].qty;",
        "  }",
        "  let discount = 0;",
        "  if (order.coupon) {",
        "    if (order.coupon === 'SAVE10') {",
        "      discount = subtotal * 0.1;",
        "    } else if (order.coupon === 'SAVE20') {",
        "      if (subtotal >= 100) {",
        "        discount = subtotal * 0.2;",
        "      } else {",
        "        discount = subtotal * 0.1;",
        "      }",
        "    } else if (order.coupon === 'HALF' && order.vip) {",
        "      discount = subtotal * 0.5;",
        "    }",
        "  }",
        "  if (order.vip && discount < subtotal * 0.05) {",
        "    discount = subtotal * 0.05;",
        "  }",
        "  let taxed = subtotal - discount;",
        "  let tax = 0;",
        "  if (order.region === 'US') {",
        "    tax = taxed * 0.07;",
        "  } else if (order.region === 'EU') {",
        "    tax = taxed * 0.2;",
        "  } else {",
        "    tax = taxed * 0.1;",
        "  }",
        "  let shipping = 0;",
        "  if (taxed < 50) {",
        "    shipping = 7.5;",
        "  } else if (taxed < 100) {",
        "    shipping = 3;",
        "  } else {",
        "    shipping = 0;",
        "  }",
        "  if (order.express) {",
        "    shipping += 12;",
        "  }",
        "  let total = taxed + tax + shipping;",
        "  return {",
        "    subtotal: Math.round(subtotal * 100) / 100,",
        "    discount: Math.round(discount * 100) / 100,",
        "    tax: Math.round(tax * 100) / 100,",
        "    shipping: Math.round(shipping * 100) / 100,",
        "    total: Math.round(total * 100) / 100,",
        "  };",
        "}",
        "",
      ].join("\n"),
      "test/order.visible.test.mjs": [
        "import assert from 'node:assert/strict';",
        "import { test } from 'node:test';",
        "import { calculateInvoice } from '../src/order.mjs';",
        "",
        "test('basic US order with no coupon', () => {",
        "  assert.deepEqual(calculateInvoice({ items: [{ price: 10, qty: 2 }, { price: 5, qty: 1 }], region: 'US' }),",
        "    { subtotal: 25, discount: 0, tax: 1.75, shipping: 7.5, total: 34.25 });",
        "});",
        "",
        "test('SAVE10 coupon applies 10%', () => {",
        "  assert.deepEqual(calculateInvoice({ items: [{ price: 100, qty: 1 }], region: 'US', coupon: 'SAVE10' }),",
        "    { subtotal: 100, discount: 10, tax: 6.3, shipping: 3, total: 99.3 });",
        "});",
        "",
        "test('HALF coupon for VIP applies 50%', () => {",
        "  assert.deepEqual(calculateInvoice({ items: [{ price: 200, qty: 1 }], region: 'EU', coupon: 'HALF', vip: true }),",
        "    { subtotal: 200, discount: 100, tax: 20, shipping: 0, total: 120 });",
        "});",
        "",
        "test('EU tax rate is 20%', () => {",
        "  assert.deepEqual(calculateInvoice({ items: [{ price: 40, qty: 1 }], region: 'EU' }),",
        "    { subtotal: 40, discount: 0, tax: 8, shipping: 7.5, total: 55.5 });",
        "});",
        "",
        "test('empty order still charges base shipping', () => {",
        "  assert.deepEqual(calculateInvoice({ items: [], region: 'US' }),",
        "    { subtotal: 0, discount: 0, tax: 0, shipping: 7.5, total: 7.5 });",
        "});",
        "",
      ].join("\n"),
    },
    hidden: [
      "import assert from 'node:assert/strict';",
      "import { test } from 'node:test';",
      "import { calculateInvoice } from '../src/order.mjs';",
      "",
      "test('SAVE20 over threshold applies 20%', () => {",
      "  assert.deepEqual(calculateInvoice({ items: [{ price: 60, qty: 2 }], region: 'US', coupon: 'SAVE20' }),",
      "    { subtotal: 120, discount: 24, tax: 6.72, shipping: 3, total: 105.72 });",
      "});",
      "",
      "test('SAVE20 under threshold falls back to 10%', () => {",
      "  assert.deepEqual(calculateInvoice({ items: [{ price: 30, qty: 1 }], region: 'US', coupon: 'SAVE20' }),",
      "    { subtotal: 30, discount: 3, tax: 1.89, shipping: 7.5, total: 36.39 });",
      "});",
      "",
      "test('HALF coupon is ignored for non-VIP', () => {",
      "  assert.deepEqual(calculateInvoice({ items: [{ price: 200, qty: 1 }], region: 'EU', coupon: 'HALF' }),",
      "    { subtotal: 200, discount: 0, tax: 40, shipping: 0, total: 240 });",
      "});",
      "",
      "test('VIP floor gives 5% when no coupon', () => {",
      "  assert.deepEqual(calculateInvoice({ items: [{ price: 80, qty: 1 }], region: 'US', vip: true }),",
      "    { subtotal: 80, discount: 4, tax: 5.32, shipping: 3, total: 84.32 });",
      "});",
      "",
      "test('VIP floor never reduces a larger coupon discount', () => {",
      "  assert.deepEqual(calculateInvoice({ items: [{ price: 200, qty: 1 }], region: 'US', coupon: 'SAVE10', vip: true }),",
      "    { subtotal: 200, discount: 20, tax: 12.6, shipping: 0, total: 192.6 });",
      "});",
      "",
      "test('express fee is additive on free-shipping tier', () => {",
      "  assert.deepEqual(calculateInvoice({ items: [{ price: 120, qty: 1 }], region: 'US', express: true }),",
      "    { subtotal: 120, discount: 0, tax: 8.4, shipping: 12, total: 140.4 });",
      "});",
      "",
      "test('express fee is additive on the lowest shipping tier', () => {",
      "  assert.deepEqual(calculateInvoice({ items: [{ price: 20, qty: 1 }], region: 'US', express: true }),",
      "    { subtotal: 20, discount: 0, tax: 1.4, shipping: 19.5, total: 40.9 });",
      "});",
      "",
      "test('unknown region uses the 10% default tax', () => {",
      "  assert.deepEqual(calculateInvoice({ items: [{ price: 40, qty: 1 }], region: 'CA' }),",
      "    { subtotal: 40, discount: 0, tax: 4, shipping: 7.5, total: 51.5 });",
      "});",
      "",
      "test('cent rounding on fractional line totals', () => {",
      "  assert.deepEqual(calculateInvoice({ items: [{ price: 9.99, qty: 3 }], region: 'US' }),",
      "    { subtotal: 29.97, discount: 0, tax: 2.1, shipping: 7.5, total: 39.57 });",
      "});",
      "",
    ].join("\n"),
  },

  "002": {
    id: "revfactory-case-002",
    difficulty: "hard",
    title: "Async race-condition bug fix",
    source: "src/cache.mjs",
    visibleTest: "test/cache.visible.test.mjs",
    hiddenTest: "test/cache.hidden.test.mjs",
    task: [
      "Fix an async race condition in src/cache.mjs WITHOUT changing the public API",
      "(class AsyncCache with get(key, loader), has(key), clear()).",
      "",
      "Today, when several callers call get(key, loader) concurrently for the SAME key",
      "before the first load resolves, loader runs once PER caller instead of once.",
      "Make concurrent gets for the same key share a single in-flight load.",
      "",
      "Requirements:",
      "- Concurrent get() for the same key invokes loader exactly once; every caller",
      "  resolves to the same value.",
      "- Loads for DIFFERENT keys still run concurrently - do not globally serialize.",
      "- A rejected loader must NOT be cached: all in-flight callers reject, and a later",
      "  get() for that key retries the loader.",
      "- Preserve existing behavior: a resolved value is cached; has() and clear() work",
      "  as before.",
      "Keep the change minimal and dependency-free.",
    ].join("\n"),
    files: {
      "package.json": JSON.stringify(
        { name: "case-002-async-race", version: "1.0.0", type: "module", scripts: { test: "node --test" } },
        null, 2) + "\n",
      "src/cache.mjs": [
        "// AsyncCache memoizes async loader results by key.",
        "export class AsyncCache {",
        "  constructor() {",
        "    this.values = new Map();",
        "  }",
        "",
        "  // Returns the cached value for key, or loads + caches it via loader(key).",
        "  async get(key, loader) {",
        "    if (this.values.has(key)) {",
        "      return this.values.get(key);",
        "    }",
        "    const value = await loader(key);",
        "    this.values.set(key, value);",
        "    return value;",
        "  }",
        "",
        "  has(key) {",
        "    return this.values.has(key);",
        "  }",
        "",
        "  clear() {",
        "    this.values.clear();",
        "  }",
        "}",
        "",
      ].join("\n"),
      "test/cache.visible.test.mjs": [
        "import assert from 'node:assert/strict';",
        "import { test } from 'node:test';",
        "import { AsyncCache } from '../src/cache.mjs';",
        "",
        "test('loads then caches; a second sequential get does not reload', async () => {",
        "  const cache = new AsyncCache();",
        "  let calls = 0;",
        "  const loader = async (k) => { calls += 1; return `v:${k}`; };",
        "  assert.equal(await cache.get('a', loader), 'v:a');",
        "  assert.equal(await cache.get('a', loader), 'v:a');",
        "  assert.equal(calls, 1);",
        "  assert.equal(cache.has('a'), true);",
        "});",
        "",
        "test('clear() drops cached values', async () => {",
        "  const cache = new AsyncCache();",
        "  const loader = async (k) => `v:${k}`;",
        "  await cache.get('a', loader);",
        "  cache.clear();",
        "  assert.equal(cache.has('a'), false);",
        "});",
        "",
        "test('distinct keys load independently', async () => {",
        "  const cache = new AsyncCache();",
        "  const loader = async (k) => `v:${k}`;",
        "  assert.equal(await cache.get('a', loader), 'v:a');",
        "  assert.equal(await cache.get('b', loader), 'v:b');",
        "});",
        "",
      ].join("\n"),
    },
    hidden: [
      "import assert from 'node:assert/strict';",
      "import { test } from 'node:test';",
      "import { AsyncCache } from '../src/cache.mjs';",
      "",
      "const delay = (ms) => new Promise((r) => setTimeout(r, ms));",
      "",
      "test('concurrent gets for the same key call loader exactly once', async () => {",
      "  const cache = new AsyncCache();",
      "  let calls = 0;",
      "  const loader = async (k) => { calls += 1; await delay(20); return `v:${k}`; };",
      "  const results = await Promise.all(Array.from({ length: 50 }, () => cache.get('a', loader)));",
      "  assert.deepEqual([...new Set(results)], ['v:a']);",
      "  assert.equal(calls, 1);",
      "});",
      "",
      "test('repeated concurrent bursts each load once on a fresh cache', async () => {",
      "  for (let i = 0; i < 5; i += 1) {",
      "    const cache = new AsyncCache();",
      "    let calls = 0;",
      "    const loader = async () => { calls += 1; await delay(5); return i; };",
      "    await Promise.all(Array.from({ length: 25 }, () => cache.get('k', loader)));",
      "    assert.equal(calls, 1);",
      "  }",
      "});",
      "",
      "test('different keys load concurrently, not serialized', async () => {",
      "  const cache = new AsyncCache();",
      "  let active = 0; let maxActive = 0;",
      "  const loader = async (k) => {",
      "    active += 1; maxActive = Math.max(maxActive, active);",
      "    await delay(30);",
      "    active -= 1;",
      "    return k;",
      "  };",
      "  await Promise.all(['a', 'b', 'c', 'd'].map((k) => cache.get(k, loader)));",
      "  assert.ok(maxActive >= 2, `expected parallel loads across keys, saw max ${maxActive}`);",
      "});",
      "",
      "test('a failing loader is not cached and the next call retries', async () => {",
      "  const cache = new AsyncCache();",
      "  let calls = 0;",
      "  const loader = async () => { calls += 1; if (calls === 1) throw new Error('boom'); return 'ok'; };",
      "  await assert.rejects(() => cache.get('a', loader), /boom/);",
      "  assert.equal(cache.has('a'), false);",
      "  assert.equal(await cache.get('a', loader), 'ok');",
      "  assert.equal(calls, 2);",
      "});",
      "",
      "test('all concurrent callers reject when the shared in-flight load fails', async () => {",
      "  const cache = new AsyncCache();",
      "  let calls = 0;",
      "  const loader = async () => { calls += 1; await delay(10); throw new Error('fail'); };",
      "  const settled = await Promise.allSettled(Array.from({ length: 10 }, () => cache.get('a', loader)));",
      "  assert.ok(settled.every((s) => s.status === 'rejected'));",
      "  assert.equal(calls, 1);",
      "  assert.equal(cache.has('a'), false);",
      "});",
      "",
    ].join("\n"),
  },
};

const caseDef = CASES[CASE];
if (!caseDef) throw new Error(`unknown SG_EVAL_CASE=${CASE}`);

const checks = [
  { name: "source syntax", cmd: "node", args: ["--check", caseDef.source] },
  { name: "visible test syntax", cmd: "node", args: ["--check", caseDef.visibleTest] },
];

// ---------------------------------------------------------------------------
// fs helpers
// ---------------------------------------------------------------------------
function ensureCleanDir(d) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
function writeFile(f, b) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, b); }
function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(full)); else out.push(full);
  }
  return out;
}
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function json(o) { return JSON.stringify(o, null, 2); }

// Copy ONLY the approved, eval-safe slice of the skill. Strips templates/,
// docs/experiments/, tests/ - i.e. the eval cases, hidden tests, and scorer
// are never reachable by the harness arm.
function copyHarnessRef() {
  const ref = path.join(EXP, `harness-ref-${CASE}`);
  ensureCleanDir(ref);
  for (const name of ["SKILL.md", "reference", "agents"]) {
    const src = path.join(REPO, name);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(ref, name), { recursive: true });
  }
  return ref;
}

function writeFixture(arm, seed) {
  const dir = path.join(RUN_ROOT, "sandboxes", `${arm}-s${seed}`);
  ensureCleanDir(dir);
  for (const [name, body] of Object.entries(caseDef.files)) writeFile(path.join(dir, name), body);
  return dir;
}

function injectHiddenTest(cwd) { writeFile(path.join(cwd, caseDef.hiddenTest), caseDef.hidden); }

// ---------------------------------------------------------------------------
// machine checks: run each named test individually for a per-test pass/fail.
// ---------------------------------------------------------------------------
function extractTestNames(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, "utf8");
  const names = [];
  const re = /\btest\(\s*(['"`])(.*?)\1/g;
  let m;
  while ((m = re.exec(text))) names.push(m[2]);
  return names;
}
function runNamedTest(cwd, name) {
  const r = spawnSync("node", ["--test", "--test-name-pattern", `^${escapeRegex(name)}$`],
    { cwd, encoding: "utf8", timeout: 120000 });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  return r.status === 0 && /# pass [1-9]/.test(out) && /# fail 0\b/.test(out);
}
function granularChecks(cwd) {
  const named = [
    ...extractTestNames(path.join(cwd, caseDef.visibleTest)).map((n) => ({ name: n, kind: "visible" })),
    ...extractTestNames(path.join(cwd, caseDef.hiddenTest)).map((n) => ({ name: n, kind: "hidden" })),
  ];
  return named.map((t) => ({ name: t.name, kind: t.kind, status: runNamedTest(cwd, t.name) ? "pass" : "fail" }));
}
function runCheck(cwd, check) {
  const r = spawnSync(check.cmd, check.args, { cwd, encoding: "utf8", timeout: 120000 });
  return { name: `${caseDef.id} ${check.name}`, status: r.status === 0 ? "pass" : "fail" };
}

// ---------------------------------------------------------------------------
// codex driver (one fresh-context pass). Token/tool parsing matches the
// codex-exec adapter used by the proven runners.
// ---------------------------------------------------------------------------
function runCodexPass(cwd, prompt, rawLabel, harnessRef) {
  const label = `c${CASE}-${rawLabel}`;
  const outFile = path.join(EXP, "raw", `${label}-final.txt`);
  const args = ["exec", "-m", MODEL, "-c", `model_reasoning_effort="${EFFORT}"`,
    "-c", "project_doc_max_bytes=0", "--disable", "image_generation", "--json",
    "--ephemeral", "--skip-git-repo-check", "--sandbox", "workspace-write",
    "-C", cwd];
  if (harnessRef) args.push("--add-dir", harnessRef);
  args.push("--output-last-message", outFile, prompt);
  const started = Date.now();
  const run = spawnSync("codex", args, { cwd, encoding: "utf8", timeout: TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 });
  const durationMs = Date.now() - started;
  const log = `${run.stdout || ""}${run.stderr || ""}`;
  writeFile(path.join(EXP, "raw", `${label}.log`), log);
  let tokens = 0, turns = 0;
  for (const line of log.split(/\n/)) {
    try {
      const e = JSON.parse(line);
      if (e.type === "turn.completed" && e.usage) {
        turns += 1;
        tokens = e.usage.total_tokens ?? ((e.usage.input_tokens || 0) + (e.usage.output_tokens || 0));
      }
    } catch { /* non-JSON status line */ }
  }
  const toolCalls = (log.match(/"type":\s*"(function_call|command_execution)"/g) || []).length;
  const finalMsg = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8") : "";
  return { label, exit_code: run.status, crashed: run.status !== 0, tokens, duration_ms: durationMs, tool_calls: toolCalls, turns_completed: turns, final_message: finalMsg.slice(-2000) };
}

// ---------------------------------------------------------------------------
// prompts. Shared task body keeps wording identical across arms. Role prompts
// are case-agnostic and derive only from caseDef.task (no hidden-test leak).
// ---------------------------------------------------------------------------
function baseLines() {
  return [
    `Case: ${caseDef.id} (${caseDef.difficulty}) - ${caseDef.title}`,
    "",
    `Task:\n${caseDef.task}`,
    "",
    "Constraints:",
    "- Edit only files inside this sandbox directory.",
    "- Keep changes minimal and dependency-free.",
    "- Do not ask follow-up questions; make reasonable decisions and finish.",
    "- The visible tests are NOT a complete spec; satisfy the full behavior in the task.",
    "- Run `npm test` before your final response.",
  ];
}
function baselinePrompt() {
  return [...baseLines(), "",
    "Condition: baseline (no harness).",
    "Do not read or use the supergoal skill, harness docs, role packs, or workflow",
    "skills. Use ordinary problem solving only.",
  ].join("\n");
}
function harnessBuildPrompt(harnessRef) {
  return [...baseLines(), "",
    "Condition: with the supergoal skill.",
    `Consult the approved supergoal skill at ${path.join(harnessRef, "SKILL.md")} and follow it:`,
    "baseline-first - make the smallest correct change, work test-first, preserve",
    "existing behavior and surrounding style, and verify against the real tests.",
  ].join("\n");
}
function criticPrompt() {
  return [
    "Condition: CRITIC / red-team pass (fresh context). DO NOT edit anything in src/.",
    "The code in this sandbox is a draft solution to the task below. Expose where it",
    "fails the SPEC - not merely the existing tests.",
    "- Run `npm test` to see the current state.",
    "- Re-read the task. Enumerate behaviors REQUIRED by the task that the current",
    "  visible tests do NOT exercise: boundary values, error/rejection handling,",
    "  concurrency/interleaving, public-API shape, security and untrusted-input",
    "  handling, and the conventions implied by the task's named operation or data",
    "  format (what a correct implementation must do even when the prompt is terse).",
    "- Write NEW FAILING black-box tests for those behaviors into test/spec.gen.test.mjs",
    "  (create it). Derive each test from the task's stated or clearly-implied contract,",
    "  not from arbitrary additions. Do NOT weaken, delete, or edit existing tests; only",
    "  add the new file.",
    "- Append a short bullet list of open defects to NOTES.md.",
    "- DO NOT modify src/. Run `npm test` at the end; new failing spec.gen tests are expected.",
    "",
    `Task:\n${caseDef.task}`,
  ].join("\n");
}
function fixerPrompt() {
  return [
    "Condition: FIXER pass (fresh context). DO NOT edit any test file under test/.",
    "- Run `npm test`. Some tests (test/spec.gen.test.mjs) fail on purpose - they encode",
    "  required spec behavior. Read NOTES.md for the open-defect list.",
    "- Make the failing tests pass with the SMALLEST correct change to src/. Do not break",
    "  tests that already pass.",
    "- No padding: add no code that is not required to pass a failing test or fix a listed",
    "  defect.",
    "- Update NOTES.md (fixed vs still-open). Run `npm test` before finishing.",
    "",
    `Task:\n${caseDef.task}`,
  ].join("\n");
}
function verifierPrompt() {
  return [
    "Condition: VERIFIER + final-fix pass (fresh context).",
    "- Run `npm test` and read NOTES.md.",
    "- Fix any remaining failures or regressions in src/ with minimal changes. Re-read",
    "  the task and ensure each required behavior has a passing test.",
    "- You may correct a test in test/spec.gen.test.mjs ONLY if it clearly contradicts",
    "  the task prose; never weaken coverage of a genuine requirement.",
    "- No padding. Update NOTES.md. Run `npm test` before finishing.",
    "",
    `Task:\n${caseDef.task}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// generic v2-style scorer (case-agnostic; keyed on pass fraction + structure).
// ---------------------------------------------------------------------------
function round(n) { return Math.max(0, Math.min(10, Math.round(n))); }
function scoreQuality(cwd, granular) {
  const srcDir = path.join(cwd, "src");
  const sourceFiles = listFiles(srcDir).filter((f) => f.endsWith(".mjs"));
  const sourceText = sourceFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  const sourceLines = sourceText.split(/\n/).length;
  const gradeChecks = granular.length ? granular : [];
  const totalChecks = gradeChecks.length || 1;
  const passedChecks = gradeChecks.filter((c) => c.status === "pass").length;
  const passFraction = passedChecks / totalChecks;
  const allPass = passedChecks === totalChecks && gradeChecks.length > 0;

  const hasErrorHandling = /throw |try\s*\{|catch\s*\(|reject|\.catch\(/.test(sourceText);
  const hasComments = /\/\//.test(sourceText) || /\/\*/.test(sourceText);
  const hasReadme = fs.existsSync(path.join(cwd, "README.md"));
  const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
  const depCount = Object.keys(pkg.dependencies || {}).length;

  let codeQuality = 10;
  if (/\bTODO\b|\bFIXME\b/.test(sourceText)) codeQuality -= 2;
  if (/console\.log\(/.test(sourceText)) codeQuality -= 2;
  if (sourceLines > 400) codeQuality -= 1;
  codeQuality = Math.max(0, codeQuality);

  const dimensions = {
    feature_completeness: { score: allPass ? 10 : Math.min(7, round(3 + 7 * passFraction)), rationale: "Capped at 7 unless all required behaviors pass." },
    test_coverage: { score: gradeChecks.length >= 8 ? 9 : gradeChecks.length >= 4 ? 7 : 3, rationale: "Canonical visible + hidden suite (fixed yardstick across arms)." },
    code_quality: { score: codeQuality, rationale: "Penalties for TODO/console.log/oversized source." },
    error_handling: { score: hasErrorHandling ? 9 : 5, rationale: hasErrorHandling ? "Explicit throw/try/reject handling present." : "No explicit error handling found." },
    efficiency: { score: depCount === 0 ? 10 : 7, rationale: depCount === 0 ? "Dependency-free." : "Added dependencies." },
    correctness: { score: allPass ? 10 : Math.min(6, round(10 * passFraction)), rationale: "Capped at 6 when any machine/hidden check fails." },
    architecture: { score: sourceFiles.length >= 3 ? 10 : sourceFiles.length === 2 ? 8 : 6, rationale: "More modules = better separation of cohesive units." },
    extensibility: { score: sourceFiles.length >= 2 ? 9 : 7, rationale: sourceFiles.length >= 2 ? "Module separation eases change." : "Single module is harder to extend safely." },
    documentation: { score: hasReadme ? 10 : hasComments ? 7 : 4, rationale: hasReadme ? "README present." : hasComments ? "Local comments present." : "No meaningful docs." },
    dev_environment: { score: pkg.scripts?.test ? 9 : 5, rationale: "Runnable npm test script present." },
  };
  return {
    total: Object.values(dimensions).reduce((s, d) => s + d.score, 0),
    pass_fraction: Number(passFraction.toFixed(3)),
    checks_passed: passedChecks,
    checks_total: totalChecks,
    dimensions,
    source_lines: sourceLines,
    source_files: sourceFiles.length,
  };
}

// Score on a throwaway copy whose test/ dir is reset to the canonical visible +
// hidden tests, so an arm cannot move its own denominator.
function scoreSnapshot(srcDir, label) {
  const dst = path.join(RUN_ROOT, "scoring", label);
  ensureCleanDir(dst);
  fs.cpSync(srcDir, dst, { recursive: true });
  fs.rmSync(path.join(dst, "test"), { recursive: true, force: true });
  writeFile(path.join(dst, caseDef.visibleTest), caseDef.files[caseDef.visibleTest]);
  injectHiddenTest(dst);
  const granular = granularChecks(dst);
  const syntax = checks.map((c) => runCheck(dst, c));
  const quality = scoreQuality(dst, granular);
  const vis = granular.filter((c) => c.kind === "visible");
  const hid = granular.filter((c) => c.kind === "hidden");
  return {
    label,
    visible_pass: vis.filter((c) => c.status === "pass").length,
    visible_total: vis.length,
    hidden_pass: hid.filter((c) => c.status === "pass").length,
    hidden_total: hid.length,
    hidden_fails: hid.filter((c) => c.status === "fail").map((c) => c.name),
    syntax_pass: syntax.filter((c) => c.status === "pass").length,
    syntax_total: syntax.length,
    quality: quality.total,
    source_files: quality.source_files,
    source_lines: quality.source_lines,
    // visible-only GREEN: passes everything visible but misses hidden requirements.
    false_green: vis.length > 0 && vis.every((c) => c.status === "pass") && hid.some((c) => c.status === "fail"),
  };
}

// ---------------------------------------------------------------------------
// arms
// ---------------------------------------------------------------------------
function aggCost(passes) {
  return {
    tokens: passes.reduce((s, p) => s + p.tokens, 0),
    duration_ms: passes.reduce((s, p) => s + p.duration_ms, 0),
    tool_calls: passes.reduce((s, p) => s + p.tool_calls, 0),
    passes: passes.length,
    crashed: passes.some((p) => p.crashed),
    per_pass: passes.map((p) => ({ label: p.label, tokens: p.tokens, duration_ms: p.duration_ms, tool_calls: p.tool_calls, exit_code: p.exit_code, crashed: p.crashed })),
  };
}

function runBaselineSeed(seed) {
  const cwd = writeFixture("baseline", seed);
  const pass = runCodexPass(cwd, baselinePrompt(), `baseline-s${seed}-build`, null);
  const snap = scoreSnapshot(cwd, `baseline-s${seed}`);
  return { seed, cost: aggCost([pass]), snap };
}

// Equal-compute control: same 4 passes as the role-loop, but no skill and no role
// separation - just build + repeated "review & improve" by the same agent. Isolates the
// skill's critic from raw extra compute.
function naiveImprovePrompt() {
  return [
    "The code in this sandbox is a previous draft solution to the task below (no harness).",
    "- Run `npm test` to see the current state.",
    "- Find bugs, missing behaviors, and edge cases the task implies but the draft misses. The",
    "  visible tests are NOT a complete spec; implement the full behavior the task describes.",
    "- Improve the implementation. Do NOT break tests that already pass.",
    "- Keep changes minimal and dependency-free. Do not ask questions.",
    "- Run `npm test` again before your final response.",
    "",
    `Task:\n${caseDef.task}`,
  ].join("\n");
}

function runNaiveSeed(seed) {
  const cwd = writeFixture("naive", seed);
  const passes = [runCodexPass(cwd, baselinePrompt(), `naive-s${seed}-build`, null)];
  for (let i = 1; i <= LOOPS; i += 1) passes.push(runCodexPass(cwd, naiveImprovePrompt(), `naive-s${seed}-improve${i}`, null));
  const snap = scoreSnapshot(cwd, `naive-s${seed}`);
  return { seed, cost: aggCost(passes), snap };
}

function runHarnessSeed(seed, harnessRef) {
  const cwd = writeFixture("harness", seed);
  const passes = [];
  passes.push(runCodexPass(cwd, harnessBuildPrompt(harnessRef), `harness-s${seed}-build`, harnessRef));
  passes.push(runCodexPass(cwd, criticPrompt(), `harness-s${seed}-critic`, harnessRef));
  passes.push(runCodexPass(cwd, fixerPrompt(), `harness-s${seed}-fixer`, harnessRef));
  passes.push(runCodexPass(cwd, verifierPrompt(), `harness-s${seed}-verifier`, harnessRef));
  const snap = scoreSnapshot(cwd, `harness-s${seed}`);
  return { seed, cost: aggCost(passes), snap };
}

function summarize(arm, seeds) {
  const q = seeds.map((s) => s.snap.quality);
  const cp = seeds.map((s) => s.snap.checks_passed ?? (s.snap.visible_pass + s.snap.hidden_pass));
  const hp = seeds.map((s) => s.snap.hidden_pass);
  const tok = seeds.map((s) => s.cost.tokens);
  const dur = seeds.map((s) => s.cost.duration_ms);
  const avg = (a) => a.length ? Number((a.reduce((x, y) => x + y, 0) / a.length).toFixed(1)) : 0;
  return {
    arm,
    seeds: seeds.length,
    quality_avg: avg(q),
    quality_each: q,
    visible_each: seeds.map((s) => `${s.snap.visible_pass}/${s.snap.visible_total}`),
    hidden_each: seeds.map((s) => `${s.snap.hidden_pass}/${s.snap.hidden_total}`),
    hidden_pass_avg: avg(hp),
    false_green_count: seeds.filter((s) => s.snap.false_green).length,
    crashed_count: seeds.filter((s) => s.cost.crashed).length,
    tokens_avg: Math.round(avg(tok)),
    duration_ms_avg: Math.round(avg(dur)),
    total_passes_avg: avg(seeds.map((s) => s.cost.passes)),
  };
}

function main() {
  fs.mkdirSync(path.join(EXP, "raw"), { recursive: true });
  const harnessRef = copyHarnessRef();
  console.log(`[run] case=${caseDef.id} model=${MODEL} effort=${EFFORT} baseline_seeds=${BASELINE_SEEDS} harness_seeds=${HARNESS_SEEDS}`);

  const baseline = [];
  for (let s = 1; s <= BASELINE_SEEDS; s += 1) { console.log(`[baseline] seed ${s}`); baseline.push(runBaselineSeed(s)); }
  const harness = [];
  for (let s = 1; s <= HARNESS_SEEDS; s += 1) { console.log(`[harness] seed ${s}`); harness.push(runHarnessSeed(s, harnessRef)); }
  const naive = [];
  for (let s = 1; s <= NAIVE_SEEDS; s += 1) { console.log(`[naive] seed ${s}`); naive.push(runNaiveSeed(s)); }

  const summary = { baseline: summarize("baseline", baseline), harness: summarize("harness", harness) };
  const seeds = { baseline, harness };
  if (NAIVE_SEEDS > 0) { summary.naive = summarize("naive", naive); seeds.naive = naive; }
  const result = {
    case_id: caseDef.id,
    difficulty: caseDef.difficulty,
    runtime_adapter: `codex-exec:${MODEL}:reasoning-${EFFORT}`,
    same_repo_snapshot: true,
    isolated_sandboxes: true,
    arms: {
      baseline: "single bare codex pass (no skill)",
      harness: "supergoal role-separated loop: build(skill-ref)+critic+fixer+verifier",
      naive: `equal-compute control: build + ${LOOPS} review-and-improve passes, no skill`,
    },
    claim_status: "not_proven",
    summary,
    seeds,
  };
  const outName = `result-${CASE}${RESULT_SUFFIX}.json`;
  fs.writeFileSync(path.join(EXP, outName), json(result));
  console.log(`[done] wrote ${outName}`);
  console.log(json(result.summary));
}

// Starter self-check (no codex): confirm the fixture discriminates as designed.
function validateStarter() {
  const dir = path.join(RUN_ROOT, "validate-starter");
  ensureCleanDir(dir);
  for (const [name, body] of Object.entries(caseDef.files)) writeFile(path.join(dir, name), body);
  injectHiddenTest(dir);
  const g = granularChecks(dir);
  const vis = g.filter((c) => c.kind === "visible");
  const hid = g.filter((c) => c.kind === "hidden");
  console.log(`[validate ${caseDef.id} (${caseDef.difficulty})] on UNMODIFIED starter:`);
  console.log(`  visible: ${vis.filter((c) => c.status === "pass").length}/${vis.length} pass`);
  for (const c of vis) console.log(`    [${c.status}] ${c.name}`);
  console.log(`  hidden:  ${hid.filter((c) => c.status === "pass").length}/${hid.length} pass`);
  for (const c of hid) console.log(`    [${c.status}] ${c.name}`);
}

if (process.env.SG_EVAL_VALIDATE === "1") validateStarter(); else main();
