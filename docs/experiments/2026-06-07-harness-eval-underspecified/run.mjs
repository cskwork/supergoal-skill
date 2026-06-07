#!/usr/bin/env node
// HARNESS-EVAL: supergoal skill vs plain codex on UNDERSPECIFIED greenfield tasks.
// Thesis under test: a thin prompt hides real-world requirements; the skill's
// "surface hidden requirements" step should make the harness arm implement more of
// the implicit behavior (checked by hidden tests injected AFTER the agent finishes)
// than a baseline that optimizes to the literal/visible spec.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(EXP, "../../..");
const RUN_ROOT = process.env.SG_EVAL_RUN_ROOT || "/tmp/sg-underspec-live";
const MODEL = process.env.SG_EVAL_MODEL || "gpt-5.3-codex-spark";
const EFFORT = process.env.SG_EVAL_EFFORT || "high";
const EFFORT_CONFIG = `model_reasoning_effort="${EFFORT}"`;
const TIMEOUT_MS = Number(process.env.SG_EVAL_TIMEOUT_MS || 1800000);

// ---- test-file generator (JSON.stringify keeps tricky literals correctly escaped) ----
function mkTest(importLine, header, assertions) {
  return [
    "import assert from 'node:assert/strict';",
    "import { test } from 'node:test';",
    importLine,
    "",
    ...assertions.map(([name, code]) =>
      `test(${JSON.stringify(`${header}: ${name}`)}, () => {\n  ${code}\n});`),
    "",
  ].join("\n");
}
const S = (v) => JSON.stringify(v);

// ---------- CASE: csv ----------
const csvImport = "import { parseCsv } from '../src/csv.mjs';";
const csvCase = {
  id: "underspec-csv",
  difficulty: "medium",
  task: [
    "Implement a CSV parser in src/csv.mjs.",
    "",
    "Export:",
    "- parseCsv(text): returns an array of rows; each row is an array of string field values.",
    "",
    "The existing src/csv.mjs is a stub. test/csv.visible.test.mjs covers basic usage.",
  ].join("\n"),
  source: "src/csv.mjs",
  visibleTest: "test/csv.visible.test.mjs",
  hiddenTest: "test/csv.hidden.test.mjs",
  stub: "export function parseCsv(text) {\n  return [];\n}\n",
  visible: mkTest(csvImport, "csv visible", [
    ["simple rows", `assert.deepEqual(parseCsv(${S("name,age\nalice,30\nbob,25")}), ${S([["name","age"],["alice","30"],["bob","25"]])});`],
    ["single row", `assert.deepEqual(parseCsv(${S("a,b,c")}), ${S([["a","b","c"]])});`],
    ["empty fields", `assert.deepEqual(parseCsv(${S("a,,c")}), ${S([["a","","c"]])});`],
  ]),
  hidden: mkTest(csvImport, "csv hidden", [
    ["quoted field containing comma", `assert.deepEqual(parseCsv(${S('a,"b,c",d')}), ${S([["a","b,c","d"]])});`],
    ["escaped double quotes", `assert.deepEqual(parseCsv(${S('"she said ""hi"""')}), ${S([['she said "hi"']])});`],
    ["newline inside quoted field", `assert.deepEqual(parseCsv(${S('"l1\nl2",x')}), ${S([["l1\nl2","x"]])});`],
    ["CRLF row terminator", `assert.deepEqual(parseCsv(${S("a,b\r\nc,d")}), ${S([["a","b"],["c","d"]])});`],
    ["trailing newline ignored", `assert.deepEqual(parseCsv(${S("a,b\n")}), ${S([["a","b"]])});`],
  ]),
};

// ---------- CASE: lru ----------
const lruImport = "import { LRUCache } from '../src/lru.mjs';";
const lruCase = {
  id: "underspec-lru",
  difficulty: "medium",
  task: [
    "Implement an LRU (least-recently-used) cache in src/lru.mjs.",
    "",
    "Export:",
    "- class LRUCache with constructor(capacity), get(key) -> value or undefined, put(key, value) -> void.",
    "",
    "The existing src/lru.mjs is a stub. test/lru.visible.test.mjs covers basic usage.",
  ].join("\n"),
  source: "src/lru.mjs",
  visibleTest: "test/lru.visible.test.mjs",
  hiddenTest: "test/lru.hidden.test.mjs",
  stub: "export class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n  }\n  get(key) {\n    return undefined;\n  }\n  put(key, value) {}\n}\n",
  visible: mkTest(lruImport, "lru visible", [
    ["put then get", "const c = new LRUCache(2); c.put('a', 1); assert.equal(c.get('a'), 1);"],
    ["missing key undefined", "const c = new LRUCache(2); assert.equal(c.get('x'), undefined);"],
    ["within capacity retains", "const c = new LRUCache(2); c.put('a',1); c.put('b',2); assert.equal(c.get('a'),1); assert.equal(c.get('b'),2);"],
  ]),
  hidden: mkTest(lruImport, "lru hidden", [
    ["evicts least recently used", "const c = new LRUCache(2); c.put('a',1); c.put('b',2); c.put('c',3); assert.equal(c.get('a'), undefined); assert.equal(c.get('b'),2); assert.equal(c.get('c'),3);"],
    ["get refreshes recency", "const c = new LRUCache(2); c.put('a',1); c.put('b',2); c.get('a'); c.put('c',3); assert.equal(c.get('a'),1); assert.equal(c.get('b'),undefined);"],
    ["update existing refreshes and keeps size", "const c = new LRUCache(2); c.put('a',1); c.put('b',2); c.put('a',10); c.put('c',3); assert.equal(c.get('a'),10); assert.equal(c.get('b'),undefined); assert.equal(c.get('c'),3);"],
    ["capacity one", "const c = new LRUCache(1); c.put('a',1); c.put('b',2); assert.equal(c.get('a'),undefined); assert.equal(c.get('b'),2);"],
  ]),
};

// ---------- CASE: semver ----------
const svImport = "import { compareVersions } from '../src/semver.mjs';";
const semverCase = {
  id: "underspec-semver",
  difficulty: "medium",
  task: [
    "Implement semantic-version comparison in src/semver.mjs.",
    "",
    "Export:",
    "- compareVersions(a, b): returns -1 if a < b, 0 if equal, 1 if a > b,",
    "  following Semantic Versioning precedence.",
    "",
    "The existing src/semver.mjs is a stub. test/semver.visible.test.mjs covers basic usage.",
  ].join("\n"),
  source: "src/semver.mjs",
  visibleTest: "test/semver.visible.test.mjs",
  hiddenTest: "test/semver.hidden.test.mjs",
  stub: "export function compareVersions(a, b) {\n  return 0;\n}\n",
  visible: mkTest(svImport, "semver visible", [
    ["patch ordering", "assert.equal(compareVersions('1.0.0','1.0.1'), -1);"],
    ["minor ordering", "assert.equal(compareVersions('1.1.0','1.0.9'), 1);"],
    ["equal", "assert.equal(compareVersions('1.2.3','1.2.3'), 0);"],
  ]),
  hidden: mkTest(svImport, "semver hidden", [
    ["prerelease lower than release", "assert.equal(compareVersions('1.0.0-alpha','1.0.0'), -1);"],
    ["alpha before beta", "assert.equal(compareVersions('1.0.0-alpha','1.0.0-beta'), -1);"],
    ["numeric prerelease identifiers compared numerically", "assert.equal(compareVersions('1.0.0-2','1.0.0-10'), -1);"],
    ["fewer prerelease identifiers lower", "assert.equal(compareVersions('1.0.0-alpha','1.0.0-alpha.1'), -1);"],
    ["build metadata ignored", "assert.equal(compareVersions('1.0.0+build1','1.0.0+build2'), 0);"],
  ]),
};

export const CASES = [csvCase, lruCase, semverCase];
const pkg = `${JSON.stringify({ type: "module", scripts: { test: "node --test" } }, null, 2)}\n`;

// ---- fs helpers ----
function ensureCleanDir(dir) { fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); }
function writeFile(file, body) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, body); }

function writeFixture(caseDef, arm) {
  const dir = path.join(RUN_ROOT, "sandboxes", caseDef.id, arm);
  ensureCleanDir(dir);
  writeFile(path.join(dir, "package.json"), pkg);
  writeFile(path.join(dir, caseDef.source), caseDef.stub);
  writeFile(path.join(dir, caseDef.visibleTest), caseDef.visible);
  return dir;
}
function injectHidden(caseDef, cwd) { writeFile(path.join(cwd, caseDef.hiddenTest), caseDef.hidden); }

function copyHarnessRef() {
  const ref = path.join(RUN_ROOT, "harness-ref");
  ensureCleanDir(ref);
  for (const name of ["SKILL.md", "README.md", "reference", "agents", "templates"]) {
    const source = path.join(ROOT, name);
    const target = path.join(ref, name);
    if (!fs.existsSync(source)) continue;
    // Decontaminate: never expose eval-internal case definitions to the harness arm.
    fs.cpSync(source, target, {
      recursive: true,
      filter: (src) => !src.split(path.sep).includes("harness-eval-cases"),
    });
  }
  return ref;
}

function promptFor(caseDef, arm, harnessRef) {
  const shared = [
    `Case: ${caseDef.id} (${caseDef.difficulty})`,
    `Task:\n${caseDef.task}`,
    "",
    "Constraints:",
    "- Edit only this sandbox.",
    "- Keep changes minimal and dependency-free.",
    "- Do not ask follow-up questions.",
    "- Run npm test before final response.",
    "- The visible tests are not complete; implement the full requested behavior.",
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
    `Use approved supergoal skill at ${path.join(harnessRef, "SKILL.md")}.`,
    "Read it first, route the task through the smallest applicable supergoal mode,",
    "and apply its verification discipline in this noninteractive eval. The task",
    "statement is implementation approval; record assumptions instead of pausing",
    "for Human Feedback. Do not edit the harness reference directory.",
    shared,
  ].join("\n\n");
}

function parseCost(log, durationMs) {
  let tokens = 0;
  let turns = 0;
  for (const line of log.split(/\n/)) {
    try {
      const event = JSON.parse(line);
      if (event.type === "turn.completed" && event.usage) {
        turns += 1;
        tokens = event.usage.total_tokens
          ?? ((event.usage.input_tokens || 0) + (event.usage.output_tokens || 0));
      }
    } catch { /* non-JSON line */ }
  }
  const toolCalls = (log.match(/"type":\s*"(function_call|command_execution)"/g) || []).length;
  return { tokens, duration_ms: durationMs, tool_calls: toolCalls, turns_completed: turns };
}

function runCodex(caseDef, arm, cwd, prompt, harnessRef) {
  const outFile = path.join(EXP, "raw", `${caseDef.id}-${arm}-final.txt`);
  const args = [
    "exec", "-m", MODEL, "-c", EFFORT_CONFIG,
    "--disable", "image_generation", "--json", "--ephemeral", "--skip-git-repo-check",
    "--sandbox", "workspace-write", "-C", cwd, "--output-last-message", outFile,
  ];
  if (arm === "harness") args.push("--add-dir", harnessRef);
  args.push(prompt);
  const started = Date.now();
  const run = spawnSync("codex", args, { encoding: "utf8", timeout: TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 });
  const durationMs = Date.now() - started;
  const log = `${run.stdout || ""}${run.stderr || ""}`;
  writeFile(path.join(EXP, "raw", `${caseDef.id}-${arm}.log`), log);
  const cost = parseCost(log, durationMs);
  cost.crashed = run.status !== 0 || cost.turns_completed === 0;
  return { exit_code: run.status, signal: run.signal, cost };
}

// ---- granular per-test scoring ----
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function extractTestNames(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, "utf8");
  const names = [];
  const re = /\btest\(\s*(['"`])(.+?)\1/g;
  let match;
  while ((match = re.exec(text))) names.push(match[2]);
  return names;
}
function runNamedTest(cwd, name) {
  const pattern = `^${escapeRegex(name)}$`;
  const result = spawnSync("node", ["--test", "--test-name-pattern", pattern], { cwd, encoding: "utf8", timeout: 120000 });
  const output = `${result.stdout || ""}${result.stderr || ""}`;
  return result.status === 0 && /# pass [1-9]/.test(output) && /# fail 0\b/.test(output);
}
function granularChecks(caseDef, cwd) {
  const named = [
    ...extractTestNames(path.join(cwd, caseDef.visibleTest)).map((n) => ({ name: n, kind: "visible" })),
    ...extractTestNames(path.join(cwd, caseDef.hiddenTest)).map((n) => ({ name: n, kind: "hidden" })),
  ];
  return named.map((t) => ({ name: t.name, kind: t.kind, status: runNamedTest(cwd, t.name) ? "pass" : "fail" }));
}
function syntaxChecks(caseDef, cwd) {
  return [caseDef.source, caseDef.visibleTest, caseDef.hiddenTest].map((rel) => {
    const r = spawnSync("node", ["--check", rel], { cwd, encoding: "utf8", timeout: 60000 });
    return { name: `${rel} syntax`, kind: "syntax", status: r.status === 0 ? "pass" : "fail" };
  });
}

function scoreQuality(caseDef, cwd, named) {
  const total = named.length;
  const passed = named.filter((c) => c.status === "pass").length;
  const frac = total ? passed / total : 0;
  const allPass = total > 0 && passed === total;
  const srcPath = path.join(cwd, caseDef.source);
  const sourceText = fs.existsSync(srcPath) ? fs.readFileSync(srcPath, "utf8") : "";
  const hasValidation = /throw |TypeError|isNaN|=== undefined|undefined ===|\bNumber\(/.test(sourceText);
  const hasComments = /\/\/|\/\*/.test(sourceText);
  const hasReadme = fs.existsSync(path.join(cwd, "README.md"));
  const round = (n) => Math.max(0, Math.min(10, Math.round(n)));
  const dims = {
    feature_completeness: allPass ? 10 : round(3 + 6 * frac),
    test_coverage: round(6 + 4 * frac),
    code_quality: 8,
    error_handling: hasValidation ? 9 : 6,
    efficiency: 9,
    correctness: round(10 * frac),
    architecture: 8,
    extensibility: 8,
    documentation: hasReadme ? 8 : hasComments ? 6 : 4,
    dev_environment: 9,
  };
  const totalScore = Object.values(dims).reduce((a, b) => a + b, 0);
  return { total: totalScore, dimensions: dims, checks_passed: passed, checks_total: total, pass_fraction: Number(frac.toFixed(3)) };
}

function summarize(named) {
  const f = (kind, status) => named.filter((c) => c.kind === kind && c.status === status).length;
  return {
    visible_pass: f("visible", "pass"), visible_total: named.filter((c) => c.kind === "visible").length,
    hidden_pass: f("hidden", "pass"), hidden_total: named.filter((c) => c.kind === "hidden").length,
  };
}

function runArm(caseDef, arm, harnessRef) {
  const cwd = writeFixture(caseDef, arm);
  const codex = runCodex(caseDef, arm, cwd, promptFor(caseDef, arm, harnessRef), harnessRef);
  injectHidden(caseDef, cwd);
  const named = granularChecks(caseDef, cwd);
  const syntax = syntaxChecks(caseDef, cwd);
  const quality = scoreQuality(caseDef, cwd, named);
  const summary = summarize(named);
  console.error(`[${caseDef.id}/${arm}] visible ${summary.visible_pass}/${summary.visible_total} hidden ${summary.hidden_pass}/${summary.hidden_total} quality ${quality.total} tokens ${codex.cost.tokens} crashed ${codex.cost.crashed}`);
  return { condition: arm, named, syntax, summary, quality, cost: codex.cost, exit_code: codex.exit_code };
}

function pick(b, h) { return h > b ? "harness" : b > h ? "baseline" : "tie"; }

function main() {
  fs.mkdirSync(EXP, { recursive: true });
  ensureCleanDir(path.join(EXP, "raw"));
  const harnessRef = copyHarnessRef();
  const cases = {};
  for (const caseDef of CASES) {
    const baseline = runArm(caseDef, "baseline", harnessRef);
    const harness = runArm(caseDef, "harness", harnessRef);
    cases[caseDef.id] = {
      baseline, harness,
      hidden_winner: pick(baseline.summary.hidden_pass, harness.summary.hidden_pass),
      quality_winner: pick(baseline.quality.total, harness.quality.total),
    };
  }
  const agg = { baseline: { hidden_pass: 0, hidden_total: 0, quality: 0, tokens: 0, ms: 0, crashed: 0 },
                harness:  { hidden_pass: 0, hidden_total: 0, quality: 0, tokens: 0, ms: 0, crashed: 0 } };
  for (const id of Object.keys(cases)) {
    for (const arm of ["baseline", "harness"]) {
      const a = cases[id][arm];
      agg[arm].hidden_pass += a.summary.hidden_pass;
      agg[arm].hidden_total += a.summary.hidden_total;
      agg[arm].quality += a.quality.total;
      agg[arm].tokens += a.cost.tokens;
      agg[arm].ms += a.cost.duration_ms;
      agg[arm].crashed += a.cost.crashed ? 1 : 0;
    }
  }
  const result = {
    runtime_adapter: `codex-exec:${MODEL}:reasoning-${EFFORT}`,
    mode: "UNDERSPECIFIED greenfield: thin prompt, implicit requirements in hidden tests",
    regime: "no RULES.md; baseline can pass visible (happy-path) and still miss implicit behavior",
    n_cases: CASES.length,
    cases,
    aggregate: {
      ...agg,
      hidden_winner: pick(agg.baseline.hidden_pass, agg.harness.hidden_pass),
      quality_winner: pick(agg.baseline.quality, agg.harness.quality),
      token_ratio: Number((agg.harness.tokens / Math.max(1, agg.baseline.tokens)).toFixed(2)),
    },
    claim_status: "not_proven",
  };
  writeFile(path.join(EXP, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({
    per_case: Object.fromEntries(Object.entries(cases).map(([id, c]) => [id, {
      baseline: `h${c.baseline.summary.hidden_pass}/${c.baseline.summary.hidden_total} q${c.baseline.quality.total} ${c.baseline.cost.tokens}tok${c.baseline.cost.crashed ? " CRASH" : ""}`,
      harness: `h${c.harness.summary.hidden_pass}/${c.harness.summary.hidden_total} q${c.harness.quality.total} ${c.harness.cost.tokens}tok${c.harness.cost.crashed ? " CRASH" : ""}`,
      hidden_winner: c.hidden_winner,
    }])),
    aggregate: result.aggregate,
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
