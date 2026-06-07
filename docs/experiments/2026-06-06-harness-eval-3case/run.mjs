#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(EXP, "../../..");
const RUN_ROOT = "/tmp/supergoal-harness-eval-3case";
const MODEL = process.env.SG_EVAL_MODEL || "gpt-5.5";
const TIMEOUT_MS = Number(process.env.SG_EVAL_TIMEOUT_MS || 900000);
const RECHECK_ONLY = process.env.SG_EVAL_RECHECK_ONLY === "1";

const cases = [
  {
    id: "easy-slugify",
    difficulty: "easy",
    title: "Normalize text into URL slugs",
    task: [
      "Fix slugify(input) so it lowercases, trims, converts each run of",
      "non-alphanumeric characters to one hyphen, and removes leading/trailing",
      "hyphens. Preserve an empty string for inputs with no alphanumeric text.",
      "Keep the implementation dependency-free and run the tests.",
    ].join(" "),
    files: {
      "package.json": json({
        type: "module",
        scripts: { test: "node --test" },
      }),
      "src/slug.mjs": [
        "export function slugify(input) {",
        "  return String(input).toLowerCase().replace(' ', '-');",
        "}",
        "",
      ].join("\n"),
      "test/slug.test.mjs": [
        "import assert from 'node:assert/strict';",
        "import { test } from 'node:test';",
        "import { slugify } from '../src/slug.mjs';",
        "",
        "test('slugifies common titles', () => {",
        "  assert.equal(slugify(' Hello, World! '), 'hello-world');",
        "  assert.equal(slugify('A  B__C'), 'a-b-c');",
        "  assert.equal(slugify('Already---Done'), 'already-done');",
        "  assert.equal(slugify('!!!'), '');",
        "});",
        "",
      ].join("\n"),
    },
    checks: nodeChecks("src/slug.mjs", "test/slug.test.mjs"),
  },
  {
    id: "medium-order-summary",
    difficulty: "medium",
    title: "Summarize paid orders by currency",
    task: [
      "Implement summarizeOrders(orders). It must keep only paid orders,",
      "validate uppercase 3-letter currency codes, positive integer amountCents,",
      "and YYYY-MM-DD dates, group by currency, return count, totalCents,",
      "firstOrderDate, and lastOrderDate, then sort by totalCents descending",
      "with currency as the tie-breaker. Throw TypeError for invalid order data.",
    ].join(" "),
    files: {
      "package.json": json({
        type: "module",
        scripts: { test: "node --test" },
      }),
      "src/summarizeOrders.mjs": [
        "export function summarizeOrders(orders) {",
        "  return [];",
        "}",
        "",
      ].join("\n"),
      "test/summarizeOrders.test.mjs": [
        "import assert from 'node:assert/strict';",
        "import { test } from 'node:test';",
        "import { summarizeOrders } from '../src/summarizeOrders.mjs';",
        "",
        "test('groups paid orders by currency', () => {",
        "  const orders = [",
        "    { id: 'a', status: 'paid', currency: 'USD', amountCents: 2500, createdAt: '2026-06-01' },",
        "    { id: 'b', status: 'refunded', currency: 'USD', amountCents: 9999, createdAt: '2026-06-02' },",
        "    { id: 'c', status: 'paid', currency: 'EUR', amountCents: 999, createdAt: '2026-06-04' },",
        "    { id: 'd', status: 'paid', currency: 'USD', amountCents: 1500, createdAt: '2026-06-03' },",
        "  ];",
        "  assert.deepEqual(summarizeOrders(orders), [",
        "    { currency: 'USD', count: 2, totalCents: 4000, firstOrderDate: '2026-06-01', lastOrderDate: '2026-06-03' },",
        "    { currency: 'EUR', count: 1, totalCents: 999, firstOrderDate: '2026-06-04', lastOrderDate: '2026-06-04' },",
        "  ]);",
        "});",
        "",
        "test('rejects malformed paid order data', () => {",
        "  assert.throws(() => summarizeOrders([{ status: 'paid', currency: 'usd', amountCents: 1, createdAt: '2026-06-01' }]), TypeError);",
        "  assert.throws(() => summarizeOrders([{ status: 'paid', currency: 'USD', amountCents: 1.5, createdAt: '2026-06-01' }]), TypeError);",
        "  assert.throws(() => summarizeOrders([{ status: 'paid', currency: 'USD', amountCents: 1, createdAt: '06/01/2026' }]), TypeError);",
        "});",
        "",
      ].join("\n"),
    },
    checks: nodeChecks("src/summarizeOrders.mjs", "test/summarizeOrders.test.mjs"),
  },
  {
    id: "hard-safe-redirect",
    difficulty: "hard",
    title: "Harden redirect URL validation",
    task: [
      "Harden isSafeRedirect(rawUrl, allowedHosts). It must allow only http",
      "and https URLs whose hostname is exactly an allowed host or a subdomain",
      "of an allowed host. Reject userinfo, backslashes, control characters,",
      "localhost with or without a trailing dot, private IPv4 ranges including",
      "hex/octal/integer forms normalized by URL, IPv6 loopback, IPv6 unique-local",
      "addresses, IPv4-mapped loopback/private IPv6 forms, and host suffix",
      "bypasses like example.com.evil.test.",
    ].join(" "),
    files: {
      "package.json": json({
        type: "module",
        scripts: { test: "node --test" },
      }),
      "src/safeRedirect.mjs": [
        "export function isSafeRedirect(rawUrl, allowedHosts = ['example.com']) {",
        "  try {",
        "    const url = new URL(rawUrl);",
        "    if (!['http:', 'https:'].includes(url.protocol)) return false;",
        "    return allowedHosts.some((host) => url.hostname.endsWith(host));",
        "  } catch {",
        "    return false;",
        "  }",
        "}",
        "",
      ].join("\n"),
      "test/safeRedirect.test.mjs": [
        "import assert from 'node:assert/strict';",
        "import { test } from 'node:test';",
        "import { isSafeRedirect } from '../src/safeRedirect.mjs';",
        "",
        "test('allows configured hosts and subdomains', () => {",
        "  assert.equal(isSafeRedirect('https://example.com/welcome'), true);",
        "  assert.equal(isSafeRedirect('https://app.example.com/welcome'), true);",
        "});",
        "",
        "test('rejects obvious unsafe redirects', () => {",
        "  assert.equal(isSafeRedirect('javascript:alert(1)'), false);",
        "  assert.equal(isSafeRedirect('https://evil.test'), false);",
        "  assert.equal(isSafeRedirect('https://example.com.evil.test'), false);",
        "  assert.equal(isSafeRedirect('https://evil.test@example.com'), false);",
        "  assert.equal(isSafeRedirect('http://127.0.0.1/admin'), false);",
        "  assert.equal(isSafeRedirect('http://localhost./admin'), false);",
        "});",
        "",
      ].join("\n"),
    },
    checks: nodeChecks("src/safeRedirect.mjs", "test/safeRedirect.test.mjs"),
  },
];

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function nodeChecks(source, testFile) {
  return [
    { name: "unit tests", cmd: "npm", args: ["test", "--", "--test-reporter=spec"] },
    { name: "source syntax", cmd: "node", args: ["--check", source] },
    { name: "test syntax", cmd: "node", args: ["--check", testFile] },
  ];
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
    "do not ask follow-up questions, and run the relevant checks before finishing.",
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
    "statement is implementation approval; record any assumptions instead of pausing",
    "for Human Feedback. Do not edit the harness reference directory.",
    shared,
  ].join("\n\n");
}

function runCodex(caseDef, arm, cwd, prompt, harnessRef) {
  const outFile = path.join(EXP, "raw", `${caseDef.id}-${arm}-final.txt`);
  const args = [
    "-a", "never", "exec", "--ephemeral", "--skip-git-repo-check",
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

function runCheck(cwd, check) {
  const result = spawnSync(check.cmd, check.args, { cwd, encoding: "utf8", timeout: 120000 });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim().split("\n").slice(-4).join(" ");
  return {
    name: check.name,
    status: result.status === 0 ? "pass" : "fail",
    evidence: `${check.cmd} ${check.args.join(" ")} exit=${result.status}; ${output || "no output"}`,
  };
}

function runChecks(caseDef, cwd) {
  return caseDef.checks.map((check) => runCheck(cwd, check));
}

function writeCases() {
  for (const caseDef of cases) {
    const body = [
      `id: ${caseDef.id}`,
      `title: "${caseDef.title}"`,
      `difficulty: ${caseDef.difficulty}`,
      "runtime_adapter: codex-exec",
      "task: >-",
      `  ${caseDef.task}`,
      "machine_checks:",
      ...caseDef.checks.map((check) => `  - ${check.name}`),
      "",
    ].join("\n");
    writeFile(path.join(EXP, "cases", `${caseDef.id}.yaml`), body);
  }
}

function summarizeArm(results, arm) {
  return cases.map((caseDef) => {
    const caseResult = results[caseDef.id][arm];
    const passed = caseResult.checks.every((check) => check.status === "pass");
    return {
      name: `${caseDef.difficulty}: ${caseDef.id}`,
      status: passed ? "pass" : "fail",
      evidence: `${caseResult.checks.filter((c) => c.status === "pass").length}/${caseResult.checks.length} checks passed; codex exit=${caseResult.codex.exit_code}`,
    };
  });
}

function buildResult(results) {
  const baselineChecks = summarizeArm(results, "baseline");
  const harnessChecks = summarizeArm(results, "harness");
  const baselineScore = baselineChecks.filter((c) => c.status === "pass").length;
  const harnessScore = harnessChecks.filter((c) => c.status === "pass").length;
  const winner = harnessScore > baselineScore ? "harness" : baselineScore > harnessScore ? "baseline" : "tie";
  return {
    case_id: "2026-06-06-3case-pilot",
    runtime_adapter: `codex-exec:${MODEL}`,
    same_repo_snapshot: true,
    isolated_worktrees: true,
    baseline: armResult("without_harness", baselineChecks, results, "baseline"),
    harness: armResult("with_harness", harnessChecks, results, "harness"),
    blind_grading: true,
    winner,
    claim_status: "not_proven",
    cases: results,
  };
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

function writeReport(result) {
  const rows = cases.map((caseDef) => {
    const b = result.baseline.machine_checks.find((c) => c.name.includes(caseDef.id));
    const h = result.harness.machine_checks.find((c) => c.name.includes(caseDef.id));
    return `| ${caseDef.difficulty} | ${caseDef.id} | ${b.status} | ${h.status} |`;
  });
  const body = [
    "# HARNESS-EVAL 3-case pilot",
    "",
    `Runtime adapter: ${result.runtime_adapter}`,
    `Winner: ${result.winner}`,
    `Claim status: ${result.claim_status}`,
    "",
    "## Summary",
    "",
    "- Baseline condition: Codex without supergoal or harness references.",
    "- Harness condition: same Codex model with a copied supergoal skill reference.",
    "- Clean slate: each arm ran in a fresh `/tmp` sandbox.",
    "- Grading: objective machine checks scored before comparing labels.",
    "",
    "## Machine Checks",
    "",
    "| Difficulty | Case | Baseline | Harness |",
    "|---|---|---|---|",
    ...rows,
    "",
    "## Cost",
    "",
    `- Baseline: ${result.baseline.cost.tokens} tokens, ${result.baseline.cost.duration_ms} ms, ${result.baseline.cost.tool_calls} parsed tool calls.`,
    `- Harness: ${result.harness.cost.tokens} tokens, ${result.harness.cost.duration_ms} ms, ${result.harness.cost.tool_calls} parsed tool calls.`,
    "",
    "## Not proven",
    "",
    "The run is a 3-case pilot, so it is too small to claim general harness effectiveness.",
    "Use this as pilot evidence only; expand to 8-15 cases before claiming a stable improvement.",
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
      results[caseDef.id][arm] = { sandbox, codex, checks: runChecks(caseDef, sandbox) };
    }
  }
  const result = buildResult(results);
  writeFile(path.join(EXP, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
  writeReport(result);
  console.log(`wrote ${path.relative(ROOT, path.join(EXP, "result.json"))}`);
}

main();
