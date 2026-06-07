#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(EXP, "../../..");
const RUN_ROOT = "/tmp/supergoal-harness-eval-low-effort-2case";
const MODEL = "gpt-5.5";
const EFFORT_CONFIG = 'model_reasoning_effort="low"';
const TIMEOUT_MS = Number(process.env.SG_EVAL_TIMEOUT_MS || 900000);
const RECHECK_ONLY = process.env.SG_EVAL_RECHECK_ONLY === "1";

const cases = [
  {
    id: "medium-price-basket",
    difficulty: "medium",
    title: "Price a basket with discounts, tax, and shipping",
    task: [
      "Implement priceBasket(items, rules). Validate input. Compute subtotalCents,",
      "discountCents, taxCents, shippingCents, and totalCents. Discounts are per-line",
      "category basis-point discounts rounded down. Tax is Math.round on discounted",
      "taxable cents times taxRateBps / 10000. Shipping is waived when discounted",
      "subtotal reaches freeShippingThresholdCents. Keep it dependency-free.",
    ].join(" "),
    source: "src/priceBasket.mjs",
    visibleTest: "test/priceBasket.test.mjs",
    hiddenTest: "test/priceBasket.hidden.test.mjs",
    files: {
      "package.json": json({ type: "module", scripts: { test: "node --test" } }),
      "src/priceBasket.mjs": [
        "export function priceBasket(items, rules = {}) {",
        "  return { subtotalCents: 0, discountCents: 0, taxCents: 0, shippingCents: 0, totalCents: 0 };",
        "}",
        "",
      ].join("\n"),
      "test/priceBasket.test.mjs": [
        "import assert from 'node:assert/strict';",
        "import { test } from 'node:test';",
        "import { priceBasket } from '../src/priceBasket.mjs';",
        "",
        "test('prices basket with category discount, tax, and shipping', () => {",
        "  const items = [",
        "    { sku: 'tea', category: 'grocery', unitCents: 1200, quantity: 2, taxable: false },",
        "    { sku: 'mug', category: 'home', unitCents: 2500, quantity: 1, taxable: true },",
        "  ];",
        "  const rules = {",
        "    taxRateBps: 825,",
        "    shippingCents: 499,",
        "    freeShippingThresholdCents: 4500,",
        "    categoryDiscountsBps: { home: 1000 },",
        "  };",
        "  assert.deepEqual(priceBasket(items, rules), {",
        "    subtotalCents: 4900,",
        "    discountCents: 250,",
        "    taxCents: 186,",
        "    shippingCents: 0,",
        "    totalCents: 4836,",
        "  });",
        "});",
        "",
      ].join("\n"),
    },
    hidden: [
      "import assert from 'node:assert/strict';",
      "import { test } from 'node:test';",
      "import { priceBasket } from '../src/priceBasket.mjs';",
      "",
      "test('rounds each discount line down before aggregating', () => {",
      "  const items = [",
      "    { sku: 'a', category: 'odd', unitCents: 999, quantity: 1, taxable: true },",
      "    { sku: 'b', category: 'odd', unitCents: 999, quantity: 1, taxable: true },",
      "  ];",
      "  const result = priceBasket(items, { taxRateBps: 500, shippingCents: 300, freeShippingThresholdCents: 9999, categoryDiscountsBps: { odd: 3333 } });",
      "  assert.equal(result.discountCents, 664);",
      "  assert.equal(result.taxCents, 67);",
      "  assert.equal(result.shippingCents, 300);",
      "  assert.equal(result.totalCents, 1701);",
      "});",
      "",
      "test('rejects malformed money, quantities, and basis points', () => {",
      "  assert.throws(() => priceBasket([{ sku: 'x', unitCents: 1.5, quantity: 1 }], {}), TypeError);",
      "  assert.throws(() => priceBasket([{ sku: 'x', unitCents: 100, quantity: 0 }], {}), TypeError);",
      "  assert.throws(() => priceBasket([{ sku: 'x', unitCents: 100, quantity: 1 }], { taxRateBps: -1 }), TypeError);",
      "  assert.throws(() => priceBasket([{ sku: 'x', unitCents: 100, quantity: 1, category: 'bad' }], { categoryDiscountsBps: { bad: 10001 } }), TypeError);",
      "});",
      "",
      "test('does not mutate items or rules', () => {",
      "  const items = [{ sku: 'x', category: 'cat', unitCents: 1000, quantity: 3, taxable: true }];",
      "  const rules = { taxRateBps: 1000, shippingCents: 100, freeShippingThresholdCents: 5000, categoryDiscountsBps: { cat: 2500 } };",
      "  const before = JSON.stringify({ items, rules });",
      "  priceBasket(items, rules);",
      "  assert.equal(JSON.stringify({ items, rules }), before);",
      "});",
      "",
    ].join("\n"),
  },
  {
    id: "hard-json-patch",
    difficulty: "hard",
    title: "Apply JSON Patch operations atomically",
    task: [
      "Implement applyPatch(document, operations) for add, remove, replace, test,",
      "copy, and move. Use JSON Pointer paths including ~0 and ~1 escaping and",
      "array '-' append for add. The function must return a patched deep copy,",
      "leave the input unchanged, and throw TypeError for invalid operations or",
      "failed tests. No dependencies.",
    ].join(" "),
    source: "src/applyPatch.mjs",
    visibleTest: "test/applyPatch.test.mjs",
    hiddenTest: "test/applyPatch.hidden.test.mjs",
    files: {
      "package.json": json({ type: "module", scripts: { test: "node --test" } }),
      "src/applyPatch.mjs": [
        "export function applyPatch(document, operations) {",
        "  return document;",
        "}",
        "",
      ].join("\n"),
      "test/applyPatch.test.mjs": [
        "import assert from 'node:assert/strict';",
        "import { test } from 'node:test';",
        "import { applyPatch } from '../src/applyPatch.mjs';",
        "",
        "test('applies basic add, replace, remove, and test operations', () => {",
        "  const input = { name: 'Ada', tags: ['math'], meta: { active: false } };",
        "  const result = applyPatch(input, [",
        "    { op: 'test', path: '/name', value: 'Ada' },",
        "    { op: 'add', path: '/tags/-', value: 'logic' },",
        "    { op: 'replace', path: '/meta/active', value: true },",
        "    { op: 'remove', path: '/name' },",
        "  ]);",
        "  assert.deepEqual(result, { tags: ['math', 'logic'], meta: { active: true } });",
        "  assert.deepEqual(input, { name: 'Ada', tags: ['math'], meta: { active: false } });",
        "});",
        "",
      ].join("\n"),
    },
    hidden: [
      "import assert from 'node:assert/strict';",
      "import { test } from 'node:test';",
      "import { applyPatch } from '../src/applyPatch.mjs';",
      "",
      "test('handles pointer escaping and root replacement', () => {",
      "  const input = { 'a/b': { '~key': 1 } };",
      "  assert.deepEqual(applyPatch(input, [{ op: 'replace', path: '/a~1b/~0key', value: 2 }]), { 'a/b': { '~key': 2 } });",
      "  assert.deepEqual(applyPatch(input, [{ op: 'replace', path: '', value: ['root'] }]), ['root']);",
      "});",
      "",
      "test('supports copy and move without aliasing copied values', () => {",
      "  const input = { a: { nested: ['x'] }, b: {} };",
      "  const result = applyPatch(input, [",
      "    { op: 'copy', from: '/a', path: '/b/copied' },",
      "    { op: 'move', from: '/a/nested/0', path: '/b/moved' },",
      "    { op: 'add', path: '/b/copied/nested/-', value: 'y' },",
      "  ]);",
      "  assert.deepEqual(result, { a: { nested: [] }, b: { copied: { nested: ['x', 'y'] }, moved: 'x' } });",
      "  assert.deepEqual(input, { a: { nested: ['x'] }, b: {} });",
      "});",
      "",
      "test('throws TypeError for invalid paths and failed tests atomically', () => {",
      "  const input = { items: ['a'] };",
      "  assert.throws(() => applyPatch(input, [{ op: 'remove', path: '/items/3' }]), TypeError);",
      "  assert.throws(() => applyPatch(input, [{ op: 'test', path: '/items/0', value: 'b' }, { op: 'add', path: '/items/-', value: 'c' }]), TypeError);",
      "  assert.deepEqual(input, { items: ['a'] });",
      "});",
      "",
      "test('rejects moving a value into its own descendant', () => {",
      "  assert.throws(() => applyPatch({ a: { b: 1 } }, [{ op: 'move', from: '/a', path: '/a/c' }]), TypeError);",
      "});",
      "",
    ].join("\n"),
  },
];

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
}

function writeFixture(caseDef, arm) {
  const dir = path.join(RUN_ROOT, "sandboxes", caseDef.id, arm);
  ensureCleanDir(dir);
  for (const [name, body] of Object.entries(caseDef.files)) {
    writeFile(path.join(dir, name), body);
  }
  return dir;
}

function copyHarnessRef() {
  const ref = path.join(RUN_ROOT, "harness-ref");
  ensureCleanDir(ref);
  for (const name of ["SKILL.md", "README.md"]) {
    fs.copyFileSync(path.join(ROOT, name), path.join(ref, name));
  }
  for (const name of ["agents", "reference", "templates"]) {
    fs.cpSync(path.join(ROOT, name), path.join(ref, name), { recursive: true });
  }
  return ref;
}

function promptFor(caseDef, arm, harnessRef) {
  const shared = [
    `Case: ${caseDef.id} (${caseDef.difficulty})`,
    `Task: ${caseDef.task}`,
    "Constraints: edit only this sandbox, keep changes minimal, do not add dependencies,",
    "do not ask follow-up questions, and run npm test before finishing.",
  ].join("\n");
  if (arm === "baseline") {
    return [
      "Condition: baseline without harness.",
      "Do not read or use supergoal, harness docs, role packs, or workflow skills.",
      "Use ordinary Codex problem solving only.",
      shared,
    ].join("\n\n");
  }
  return [
    "Condition: with_harness.",
    `Use the approved supergoal skill at ${path.join(harnessRef, "SKILL.md")}.`,
    "Read it first, route the task through the smallest applicable supergoal mode,",
    "and apply its verification discipline in this noninteractive eval. The task",
    "statement is implementation approval; record assumptions instead of pausing",
    "for Human Feedback. Do not edit the harness reference directory.",
    shared,
  ].join("\n\n");
}

function runCodex(caseDef, arm, cwd, prompt, harnessRef) {
  const outFile = path.join(EXP, "raw", `${caseDef.id}-${arm}-final.txt`);
  const args = [
    "-c", EFFORT_CONFIG,
    "--ask-for-approval", "never",
    "exec", "--ephemeral", "--skip-git-repo-check",
    "-m", MODEL, "-s", "workspace-write", "-C", cwd, "-o", outFile,
  ];
  if (arm === "harness") args.push("--add-dir", harnessRef);
  args.push(prompt);
  const started = Date.now();
  const run = spawnSync("codex", args, { encoding: "utf8", timeout: TIMEOUT_MS });
  const durationMs = Date.now() - started;
  const log = `${run.stdout || ""}${run.stderr || ""}`;
  writeFile(path.join(EXP, "raw", `${caseDef.id}-${arm}.log`), log);
  return {
    exit_code: run.status,
    signal: run.signal,
    cost: parseCost(log, durationMs),
  };
}

function parseCost(log, durationMs) {
  const matches = [...log.matchAll(/tokens used\s*([\d,]+)/g)];
  const last = matches.at(-1);
  const tokens = last ? Number(last[1].replaceAll(",", "")) : 0;
  const toolCalls = (log.match(/\n(?:exec|apply_patch|update_plan|read_mcp_resource)\b/g) || []).length;
  return { tokens, duration_ms: durationMs, tool_calls: toolCalls };
}

function readPriorResult() {
  const file = path.join(EXP, "result.json");
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readCodex(caseDef, arm, prior) {
  const logFile = path.join(EXP, "raw", `${caseDef.id}-${arm}.log`);
  const priorCodex = prior.cases?.[caseDef.id]?.[arm]?.codex || {};
  const durationMs = priorCodex.cost?.duration_ms || 0;
  return {
    exit_code: priorCodex.exit_code ?? null,
    signal: priorCodex.signal ?? null,
    cost: parseCost(fs.readFileSync(logFile, "utf8"), durationMs),
  };
}

function injectHiddenTest(cwd, caseDef) {
  writeFile(path.join(cwd, caseDef.hiddenTest), caseDef.hidden);
}

function runCheck(cwd, check) {
  const result = spawnSync(check.cmd, check.args, { cwd, encoding: "utf8", timeout: 120000 });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim().split("\n").slice(-5).join(" ");
  return {
    name: check.name,
    status: result.status === 0 ? "pass" : "fail",
    evidence: `${check.cmd} ${check.args.join(" ")} exit=${result.status}; ${output || "no output"}`,
  };
}

function checksFor(caseDef) {
  return [
    { name: `${caseDef.id} hidden+visible tests`, cmd: "npm", args: ["test", "--", "--test-reporter=spec"] },
    { name: `${caseDef.id} source syntax`, cmd: "node", args: ["--check", caseDef.source] },
    { name: `${caseDef.id} hidden syntax`, cmd: "node", args: ["--check", caseDef.hiddenTest] },
  ];
}

function runChecks(caseDef, cwd) {
  injectHiddenTest(cwd, caseDef);
  return checksFor(caseDef).map((check) => runCheck(cwd, check));
}

function scoreQuality(caseDef, cwd, checks) {
  const source = fs.readFileSync(path.join(cwd, caseDef.source), "utf8");
  const packageJson = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
  const visibleTest = fs.readFileSync(path.join(cwd, caseDef.visibleTest), "utf8");
  const ownTests = collectOwnTests(cwd, caseDef.hiddenTest);
  const passCount = checks.filter((check) => check.status === "pass").length;
  const allPass = passCount === checks.length;
  const visibleAssertions = countAssertions(visibleTest);
  const ownAssertions = countAssertions(ownTests);
  const hasValidation = /throw\s+new\s+TypeError|TypeError|assert\.throws/.test(source);
  const helperCount = (source.match(/\bfunction\s+\w+|\bconst\s+\w+\s*=\s*\(/g) || []).length;
  const mutatesInput = /splice|delete\s+document|delete\s+operations|\.push\(|\.pop\(|\.shift\(|\.unshift\(/.test(source)
    && !/structuredClone|JSON\.parse\(JSON\.stringify|clone|deepCopy/.test(source);
  const docsScore = documentationScore(cwd, source);

  const dimensions = {
    feature_completeness: {
      score: allPass ? 9 : Math.min(7, 3 + passCount),
      rationale: allPass ? "Visible and hidden checks passed." : `${passCount}/${checks.length} checks passed.`,
    },
    test_coverage: {
      score: ownAssertions >= 6 ? 8 : ownAssertions >= 3 ? 7 : ownAssertions > visibleAssertions ? 6 : 4,
      rationale: ownAssertions > visibleAssertions
        ? `Agent-side tests include ${ownAssertions} assertions excluding hidden tests.`
        : "Relies mainly on provided visible tests; hidden tests were evaluator-only.",
    },
    code_quality: {
      score: source.length < 8000 && !/TODO|console\.log/.test(source) ? 8 : 6,
      rationale: "Readable dependency-free module with no debug output or TODO markers.",
    },
    error_handling: {
      score: hasValidation ? (allPass ? 8 : 6) : 4,
      rationale: hasValidation ? "Uses explicit TypeError/validation handling." : "Validation/error handling is limited.",
    },
    efficiency: {
      score: /dependencies/.test(JSON.stringify(packageJson)) ? 6 : 8,
      rationale: "No runtime dependencies and small input-scale algorithms.",
    },
    correctness: {
      score: allPass ? 9 : Math.max(3, passCount * 2),
      rationale: allPass ? "All hidden and visible checks passed." : "Failed at least one evaluator check.",
    },
    architecture: {
      score: helperCount >= 3 ? 8 : 7,
      rationale: "Single focused module plus tests is appropriate for this fixture size.",
    },
    extensibility: {
      score: helperCount >= 3 && !mutatesInput ? 8 : !mutatesInput ? 7 : 5,
      rationale: mutatesInput ? "Possible input mutation or aliasing risk detected." : "Helper structure and copy behavior support change.",
    },
    documentation: {
      score: docsScore,
      rationale: docsScore >= 5 ? "Includes local changelog/README/comments." : "Minimal documentation beyond code and tests.",
    },
    dev_environment: {
      score: packageJson.scripts?.test ? 7 : 3,
      rationale: packageJson.scripts?.test ? "Package has a runnable test script." : "Missing runnable test script.",
    },
  };
  return {
    total: Object.values(dimensions).reduce((sum, item) => sum + item.score, 0),
    dimensions,
  };
}

function collectOwnTests(cwd, hiddenTest) {
  const testDir = path.join(cwd, "test");
  if (!fs.existsSync(testDir)) return "";
  return fs.readdirSync(testDir)
    .filter((name) => name.endsWith(".mjs") && path.join("test", name) !== hiddenTest)
    .map((name) => fs.readFileSync(path.join(testDir, name), "utf8"))
    .join("\n");
}

function countAssertions(text) {
  return (text.match(/\bassert\./g) || []).length;
}

function documentationScore(cwd, source) {
  const hasReadme = fs.existsSync(path.join(cwd, "README.md"));
  const hasChangelog = fs.existsSync(path.join(cwd, "docs/changelog/changelog-2026-06-06.md"));
  const comments = (source.match(/\/\/|\/\*/g) || []).length;
  if (hasReadme && hasChangelog) return 7;
  if (hasReadme || hasChangelog || comments >= 2) return 5;
  return 3;
}

function writeCases() {
  for (const caseDef of cases) {
    const body = [
      `id: ${caseDef.id}`,
      `title: "${caseDef.title}"`,
      `difficulty: ${caseDef.difficulty}`,
      "runtime_adapter: codex-exec",
      "reasoning_effort: low",
      "task: >-",
      `  ${caseDef.task}`,
      "machine_checks:",
      ...checksFor(caseDef).map((check) => `  - ${check.name}`),
      "",
    ].join("\n");
    writeFile(path.join(EXP, "cases", `${caseDef.id}.yaml`), body);
  }
}

function buildResult(results) {
  const baselineChecks = flattenChecks(results, "baseline");
  const harnessChecks = flattenChecks(results, "harness");
  const baselineScore = baselineChecks.filter((c) => c.status === "pass").length;
  const harnessScore = harnessChecks.filter((c) => c.status === "pass").length;
  const baselineQuality = averageQuality(results, "baseline");
  const harnessQuality = averageQuality(results, "harness");
  const passWinner = harnessScore > baselineScore ? "harness" : baselineScore > harnessScore ? "baseline" : "tie";
  const qualityWinner = harnessQuality.average_total > baselineQuality.average_total
    ? "harness"
    : baselineQuality.average_total > harnessQuality.average_total ? "baseline" : "tie";
  return {
    case_id: "2026-06-06-low-effort-2case",
    runtime_adapter: `codex-exec:${MODEL}:reasoning-low`,
    same_repo_snapshot: true,
    isolated_worktrees: true,
    baseline: armResult("without_harness", baselineChecks, results, "baseline"),
    harness: armResult("with_harness", harnessChecks, results, "harness"),
    quality: {
      method: "RevFactory-style 10 dimensions, each 0-10, total 100; deterministic anchored local scorer.",
      baseline: baselineQuality,
      harness: harnessQuality,
      winner: qualityWinner,
    },
    blind_grading: true,
    winner: passWinner === qualityWinner ? passWinner : "not_proven",
    pass_winner: passWinner,
    quality_winner: qualityWinner,
    claim_status: "not_proven",
    cases: results,
  };
}

function averageQuality(results, arm) {
  const totals = cases.map((caseDef) => results[caseDef.id][arm].quality.total);
  return {
    average_total: round1(totals.reduce((sum, value) => sum + value, 0) / totals.length),
    by_case: Object.fromEntries(cases.map((caseDef) => [
      caseDef.id,
      results[caseDef.id][arm].quality,
    ])),
  };
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function flattenChecks(results, arm) {
  return cases.flatMap((caseDef) => results[caseDef.id][arm].checks);
}

function armResult(condition, checks, results, arm) {
  return {
    condition,
    machine_checks: checks,
    cost: cases.reduce((total, caseDef) => addCost(total, results[caseDef.id][arm].codex.cost), {
      tokens: 0,
      duration_ms: 0,
      tool_calls: 0,
    }),
  };
}

function addCost(left, right) {
  return {
    tokens: left.tokens + right.tokens,
    duration_ms: left.duration_ms + right.duration_ms,
    tool_calls: left.tool_calls + right.tool_calls,
  };
}

function caseStatus(results, caseDef, arm) {
  return results[caseDef.id][arm].checks.every((check) => check.status === "pass") ? "pass" : "fail";
}

function writeReport(result) {
  const rows = cases.map((caseDef) => {
    const b = caseStatus(result.cases, caseDef, "baseline");
    const h = caseStatus(result.cases, caseDef, "harness");
    const bq = result.cases[caseDef.id].baseline.quality.total;
    const hq = result.cases[caseDef.id].harness.quality.total;
    return `| ${caseDef.difficulty} | ${caseDef.id} | ${b} | ${h} | ${bq} | ${hq} |`;
  });
  const body = [
    "# HARNESS-EVAL low-effort 2-case rerun",
    "",
    `Runtime adapter: ${result.runtime_adapter}`,
    `Pass winner: ${result.pass_winner}`,
    `Quality winner: ${result.quality_winner}`,
    `Overall winner: ${result.winner}`,
    `Claim status: ${result.claim_status}`,
    "",
    "## Summary",
    "",
    "- Baseline condition: Codex without supergoal or harness references.",
    "- Harness condition: same Codex model and low effort with a copied supergoal skill reference.",
    "- Clean slate: each arm ran in a fresh `/tmp` sandbox.",
    "- Hidden tests were injected after each agent run.",
    "- Quality score mirrors RevFactory's 10 dimensions at 0-10 each, total 100.",
    "",
    "## Machine Checks",
    "",
    "| Difficulty | Case | Baseline pass | Harness pass | Baseline quality | Harness quality |",
    "|---|---|---|---|---:|---:|",
    ...rows,
    "",
    "## Quality",
    "",
    `- Baseline average: ${result.quality.baseline.average_total}/100.`,
    `- Harness average: ${result.quality.harness.average_total}/100.`,
    `- Quality winner: ${result.quality.winner}.`,
    "",
    "## Cost",
    "",
    `- Baseline: ${result.baseline.cost.tokens} tokens, ${result.baseline.cost.duration_ms} ms, ${result.baseline.cost.tool_calls} parsed tool calls.`,
    `- Harness: ${result.harness.cost.tokens} tokens, ${result.harness.cost.duration_ms} ms, ${result.harness.cost.tool_calls} parsed tool calls.`,
    "",
    "## Not proven",
    "",
    "This rerun has only two fresh cases, so it cannot prove general harness effectiveness.",
    "",
    "## Decision",
    "",
    "Not proven",
    "",
  ].join("\n");
  writeFile(path.join(EXP, "report.md"), body);
}

function main() {
  const prior = readPriorResult();
  if (!RECHECK_ONLY) ensureCleanDir(path.join(EXP, "raw"));
  ensureCleanDir(path.join(EXP, "cases"));
  if (!RECHECK_ONLY) ensureCleanDir(path.join(RUN_ROOT, "sandboxes"));
  writeCases();
  const harnessRef = RECHECK_ONLY ? path.join(RUN_ROOT, "harness-ref") : copyHarnessRef();
  const results = {};
  for (const caseDef of cases) {
    results[caseDef.id] = {};
    for (const arm of ["baseline", "harness"]) {
      const sandbox = RECHECK_ONLY
        ? path.join(RUN_ROOT, "sandboxes", caseDef.id, arm)
        : writeFixture(caseDef, arm);
      const codex = RECHECK_ONLY
        ? readCodex(caseDef, arm, prior)
        : runCodex(caseDef, arm, sandbox, promptFor(caseDef, arm, harnessRef), harnessRef);
      const checks = runChecks(caseDef, sandbox);
      results[caseDef.id][arm] = {
        sandbox,
        codex,
        checks,
        quality: scoreQuality(caseDef, sandbox, checks),
      };
    }
  }
  const result = buildResult(results);
  writeFile(path.join(EXP, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
  writeReport(result);
  console.log(`wrote ${path.relative(ROOT, path.join(EXP, "result.json"))}`);
}

main();
