#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(EXP, "../../..");
// v2 live runs use a separate /tmp root so the original run's sandboxes are preserved.
const RUN_ROOT = process.env.SG_EVAL_RUN_ROOT || "/tmp/supergoal-harness-eval-spark-high-lsp-v2";
// The original (v1) run's sandboxes + result.json, read-only, for deterministic re-scoring.
const PRIOR_RUN_ROOT = process.env.SG_EVAL_PRIOR_RUN_ROOT || "/tmp/supergoal-harness-eval-spark-high-lsp";
const PRIOR_RESULT_FILE = process.env.SG_EVAL_PRIOR_RESULT
  || path.join(EXP, "..", "2026-06-06-harness-eval-spark-high-lsp", "result.json");
const MODEL = process.env.SG_EVAL_MODEL || "gpt-5.3-codex-spark";
const EFFORT = process.env.SG_EVAL_EFFORT || "high";
const EFFORT_CONFIG = `model_reasoning_effort="${EFFORT}"`;
// Optional: use a different SKILL.md for the harness arm (e.g. the pre-INLINE-fix original) to A/B the skill.
const HARNESS_SKILL = process.env.SG_EVAL_HARNESS_SKILL || "";
const TIMEOUT_MS = Number(process.env.SG_EVAL_TIMEOUT_MS || 1800000);
const RECHECK_ONLY = process.env.SG_EVAL_RECHECK_ONLY === "1";
// Re-score the v1 prior agent outputs in place (no codex, no fixture wipe) with the v2 scorer.
const RESCORE_EXISTING = process.env.SG_EVAL_RESCORE_EXISTING === "1";

const caseDef = {
  id: "revfactory-case-015-lsp",
  difficulty: "hard",
  title: "MiniLang Language Server Protocol server",
  task: [
    "Implement a Language Server Protocol server for a small MiniLang language.",
    "It must include JSON-RPC Content-Length transport, initialize/shutdown",
    "lifecycle handling, parsing with error recovery, symbol table construction,",
    "diagnostics, completion, go-to-definition, hover, and incremental update",
    "behavior for didOpen and didChange.",
    "",
    "MiniLang syntax for this eval:",
    "- Function declarations: fn name(param1, param2) { ... }",
    "- Variable declarations: let name = expression",
    "- Return statements: return expression",
    "- Function calls: name(arg1, arg2)",
    "- Comments start with #",
    "",
    "Export these APIs from src/server.mjs:",
    "- encodeMessage(message)",
    "- class MessageBuffer with push(chunk) -> decoded JSON messages",
    "- parseMiniLang(text)",
    "- class MiniLangServer with async handle(message), takeNotifications(), getDiagnostics(uri)",
  ].join("\n"),
  source: "src/server.mjs",
  visibleTest: "test/lsp.visible.test.mjs",
  hiddenTest: "test/lsp.hidden.test.mjs",
  files: {
    "package.json": json({
      type: "module",
      scripts: { test: "node --test" },
    }),
    "src/server.mjs": [
      "export function encodeMessage(message) {",
      "  return JSON.stringify(message);",
      "}",
      "",
      "export class MessageBuffer {",
      "  constructor() {",
      "    this.buffer = '';",
      "  }",
      "",
      "  push(chunk) {",
      "    this.buffer += chunk;",
      "    return [];",
      "  }",
      "}",
      "",
      "export function parseMiniLang(text) {",
      "  return { text, diagnostics: [], symbols: [] };",
      "}",
      "",
      "export class MiniLangServer {",
      "  constructor() {",
      "    this.documents = new Map();",
      "    this.notifications = [];",
      "  }",
      "",
      "  async handle(message) {",
      "    if (message.method === 'initialize') {",
      "      return { jsonrpc: '2.0', id: message.id, result: { capabilities: {} } };",
      "    }",
      "    if (message.method === 'shutdown') {",
      "      return { jsonrpc: '2.0', id: message.id, result: null };",
      "    }",
      "    return null;",
      "  }",
      "",
      "  takeNotifications() {",
      "    const out = this.notifications;",
      "    this.notifications = [];",
      "    return out;",
      "  }",
      "",
      "  getDiagnostics(uri) {",
      "    return [];",
      "  }",
      "}",
      "",
    ].join("\n"),
    "test/lsp.visible.test.mjs": [
      "import assert from 'node:assert/strict';",
      "import { test } from 'node:test';",
      "import { encodeMessage, MessageBuffer, MiniLangServer } from '../src/server.mjs';",
      "",
      "function request(method, params = {}, id = 1) {",
      "  return { jsonrpc: '2.0', id, method, params };",
      "}",
      "",
      "function notification(method, params = {}) {",
      "  return { jsonrpc: '2.0', method, params };",
      "}",
      "",
      "function textDocument(uri, text, version = 1) {",
      "  return { uri, languageId: 'minilang', version, text };",
      "}",
      "",
      "function itemsFrom(response) {",
      "  const result = response.result;",
      "  return Array.isArray(result) ? result : result.items;",
      "}",
      "",
      "function positionOf(text, line, needle, offset = 0) {",
      "  const lines = text.split('\\n');",
      "  const character = lines[line].indexOf(needle);",
      "  assert.notEqual(character, -1, `missing ${needle} on line ${line}`);",
      "  return { line, character: character + offset };",
      "}",
      "",
      "test('JSON-RPC transport frames and streams Content-Length messages', () => {",
      "  const message = { jsonrpc: '2.0', id: 7, result: { ok: true } };",
      "  const framed = encodeMessage(message);",
      "  assert.match(framed, /^Content-Length: \\d+\\r\\n\\r\\n/);",
      "",
      "  const buffer = new MessageBuffer();",
      "  assert.deepEqual(buffer.push(framed.slice(0, 9)), []);",
      "  const decoded = buffer.push(framed.slice(9) + framed);",
      "  assert.equal(decoded.length, 2);",
      "  assert.deepEqual(decoded[0], message);",
      "  assert.deepEqual(decoded[1], message);",
      "});",
      "",
      "test('initialize, shutdown, and exit expose expected LSP lifecycle', async () => {",
      "  const server = new MiniLangServer();",
      "  const init = await server.handle(request('initialize', { capabilities: {} }, 1));",
      "  assert.equal(init.id, 1);",
      "  assert.equal(init.result.capabilities.textDocumentSync, 2);",
      "  assert.ok(init.result.capabilities.completionProvider);",
      "  assert.equal(init.result.capabilities.definitionProvider, true);",
      "  assert.equal(init.result.capabilities.hoverProvider, true);",
      "",
      "  const shutdown = await server.handle(request('shutdown', {}, 2));",
      "  assert.deepEqual(shutdown, { jsonrpc: '2.0', id: 2, result: null });",
      "  assert.equal(await server.handle(notification('exit')), null);",
      "});",
      "",
      "test('didOpen publishes diagnostics for undefined symbols and wrong arity', async () => {",
      "  const uri = 'file:///visible-diagnostics.mini';",
      "  const text = [",
      "    'fn add(a, b) {',",
      "    '  return a',",
      "    '}',",
      "    'fn main() {',",
      "    '  let answer = add(1)',",
      "    '  return missing',",
      "    '}',",
      "  ].join('\\n');",
      "  const server = new MiniLangServer();",
      "  await server.handle(notification('textDocument/didOpen', { textDocument: textDocument(uri, text) }));",
      "  const publish = server.takeNotifications().find((item) => item.method === 'textDocument/publishDiagnostics');",
      "  assert.ok(publish, 'expected publishDiagnostics notification');",
      "  const diagnostics = publish.params.diagnostics;",
      "  const messages = diagnostics.map((diag) => diag.message).join('\\n').toLowerCase();",
      "  assert.match(messages, /undefined.*missing|missing.*undefined/);",
      "  assert.match(messages, /arity|argument|expected 2/);",
      "  assert.equal(server.getDiagnostics(uri).length, diagnostics.length);",
      "});",
      "",
      "test('completion includes keywords, in-scope symbols, functions, and snippets', async () => {",
      "  const uri = 'file:///visible-completion.mini';",
      "  const text = [",
      "    'fn add(a, b) {',",
      "    '  return a',",
      "    '}',",
      "    'fn main() {',",
      "    '  let local = 1',",
      "    '  return ',",
      "    '}',",
      "  ].join('\\n');",
      "  const server = new MiniLangServer();",
      "  await server.handle(notification('textDocument/didOpen', { textDocument: textDocument(uri, text) }));",
      "  const response = await server.handle(request('textDocument/completion', {",
      "    textDocument: { uri },",
      "    position: { line: 5, character: 9 },",
      "  }, 3));",
      "  const items = itemsFrom(response);",
      "  const labels = items.map((item) => item.label);",
      "  assert.ok(labels.includes('fn'));",
      "  assert.ok(labels.includes('let'));",
      "  assert.ok(labels.includes('return'));",
      "  assert.ok(labels.includes('add'));",
      "  assert.ok(labels.includes('local'));",
      "  assert.ok(items.some((item) => item.label === 'return' && /return/.test(JSON.stringify(item))));",
      "});",
      "",
      "test('definition and hover resolve function symbols', async () => {",
      "  const uri = 'file:///visible-definition.mini';",
      "  const text = [",
      "    'fn inc(value) {',",
      "    '  return value',",
      "    '}',",
      "    'fn main() {',",
      "    '  let total = inc(1)',",
      "    '  return total',",
      "    '}',",
      "  ].join('\\n');",
      "  const server = new MiniLangServer();",
      "  await server.handle(notification('textDocument/didOpen', { textDocument: textDocument(uri, text) }));",
      "  const definition = await server.handle(request('textDocument/definition', {",
      "    textDocument: { uri },",
      "    position: positionOf(text, 4, 'inc', 1),",
      "  }, 4));",
      "  assert.equal(definition.result.uri, uri);",
      "  assert.equal(definition.result.range.start.line, 0);",
      "",
      "  const hover = await server.handle(request('textDocument/hover', {",
      "    textDocument: { uri },",
      "    position: positionOf(text, 4, 'inc', 1),",
      "  }, 5));",
      "  assert.match(JSON.stringify(hover.result.contents), /fn inc\\(value\\)/);",
      "});",
      "",
    ].join("\n"),
  },
  hidden: [
    "import assert from 'node:assert/strict';",
    "import { test } from 'node:test';",
    "import { MiniLangServer } from '../src/server.mjs';",
    "",
    "function request(method, params = {}, id = 1) {",
    "  return { jsonrpc: '2.0', id, method, params };",
    "}",
    "",
    "function notification(method, params = {}) {",
    "  return { jsonrpc: '2.0', method, params };",
    "}",
    "",
    "function doc(uri, text, version = 1) {",
    "  return { uri, languageId: 'minilang', version, text };",
    "}",
    "",
    "function itemsFrom(response) {",
    "  const result = response.result;",
    "  return Array.isArray(result) ? result : result.items;",
    "}",
    "",
    "function positionOf(text, line, needle, offset = 0) {",
    "  const lines = text.split('\\n');",
    "  const character = lines[line].indexOf(needle);",
    "  assert.notEqual(character, -1, `missing ${needle} on line ${line}`);",
    "  return { line, character: character + offset };",
    "}",
    "",
    "test('didChange reparses incrementally and clears stale diagnostics', async () => {",
    "  const uri = 'file:///hidden-change.mini';",
    "  const good = ['fn main() {', '  let ok = 1', '  return ok', '}'].join('\\n');",
    "  const bad = ['fn main() {', '  let ok = 1', '  return missing', '}'].join('\\n');",
    "  const server = new MiniLangServer();",
    "  await server.handle(notification('textDocument/didOpen', { textDocument: doc(uri, good, 1) }));",
    "  assert.deepEqual(server.getDiagnostics(uri), []);",
    "  server.takeNotifications();",
    "",
    "  await server.handle(notification('textDocument/didChange', {",
    "    textDocument: { uri, version: 2 },",
    "    contentChanges: [{ text: bad }],",
    "  }));",
    "  assert.match(server.getDiagnostics(uri).map((diag) => diag.message).join('\\n').toLowerCase(), /undefined.*missing|missing.*undefined/);",
    "",
    "  await server.handle(notification('textDocument/didChange', {",
    "    textDocument: { uri, version: 3 },",
    "    contentChanges: [{ text: good }],",
    "  }));",
    "  assert.deepEqual(server.getDiagnostics(uri), []);",
    "});",
    "",
    "test('completion filters by prefix and exposes function signatures', async () => {",
    "  const uri = 'file:///hidden-completion.mini';",
    "  const text = [",
    "    'fn double(value) {',",
    "    '  return value',",
    "    '}',",
    "    'fn main() {',",
    "    '  return dou',",
    "    '}',",
    "  ].join('\\n');",
    "  const server = new MiniLangServer();",
    "  await server.handle(notification('textDocument/didOpen', { textDocument: doc(uri, text) }));",
    "  const response = await server.handle(request('textDocument/completion', {",
    "    textDocument: { uri },",
    "    position: { line: 4, character: 12 },",
    "  }, 11));",
    "  const items = itemsFrom(response);",
    "  const labels = items.map((item) => item.label);",
    "  assert.deepEqual(labels, ['double']);",
    "  assert.match(JSON.stringify(items[0]), /double\\(value\\)|double\\(\\$\\{1:value\\}\\)/);",
    "});",
    "",
    "test('definition prefers local scope over same-name symbols elsewhere', async () => {",
    "  const uri = 'file:///hidden-scope.mini';",
    "  const text = [",
    "    'fn first() {',",
    "    '  let target = 1',",
    "    '  return target',",
    "    '}',",
    "    'fn second() {',",
    "    '  let target = 2',",
    "    '  return target',",
    "    '}',",
    "  ].join('\\n');",
    "  const server = new MiniLangServer();",
    "  await server.handle(notification('textDocument/didOpen', { textDocument: doc(uri, text) }));",
    "  const response = await server.handle(request('textDocument/definition', {",
    "    textDocument: { uri },",
    "    position: positionOf(text, 6, 'target', 1),",
    "  }, 12));",
    "  assert.equal(response.result.range.start.line, 5);",
    "});",
    "",
    "test('parser recovers from syntax errors and still reports semantic diagnostics', async () => {",
    "  const uri = 'file:///hidden-recovery.mini';",
    "  const text = [",
    "    'fn add(a, b) {',",
    "    '  return a',",
    "    '}',",
    "    'fn main() {',",
    "    '  let x = add(1, 2, 3)',",
    "    '  return missing',",
    "  ].join('\\n');",
    "  const server = new MiniLangServer();",
    "  await server.handle(notification('textDocument/didOpen', { textDocument: doc(uri, text) }));",
    "  const messages = server.getDiagnostics(uri).map((diag) => diag.message).join('\\n').toLowerCase();",
    "  assert.match(messages, /syntax|brace|expected.*\\}/);",
    "  assert.match(messages, /arity|argument|expected 2/);",
    "  assert.match(messages, /undefined.*missing|missing.*undefined/);",
    "});",
    "",
  ].join("\n"),
};

// Syntax-only checks. The unit-test pass/fail is now measured per individual test
// (see granularChecks) so correctness can be scored as a gradient, not a single
// all-or-nothing pass that hid the baseline-6/9 vs harness-4/9 difference.
const checks = [
  { name: "source syntax", cmd: "node", args: ["--check", caseDef.source] },
  { name: "visible test syntax", cmd: "node", args: ["--check", caseDef.visibleTest] },
  { name: "hidden test syntax", cmd: "node", args: ["--check", caseDef.hiddenTest] },
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractTestNames(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, "utf8");
  const names = [];
  const re = /\btest\(\s*(['"`])(.+?)\1/g;
  let match;
  while ((match = re.exec(text))) names.push(match[2]);
  return names;
}

// Run each named test in isolation so we get a per-test pass/fail vector.
function runNamedTest(cwd, name) {
  const pattern = `^${escapeRegex(name)}$`;
  const result = spawnSync("node", ["--test", "--test-name-pattern", pattern], {
    cwd,
    encoding: "utf8",
    timeout: 120000,
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`;
  // Passed only if at least one test ran (# pass >= 1) and none failed (# fail 0).
  return result.status === 0 && /# pass [1-9]/.test(output) && /# fail 0\b/.test(output);
}

// The 9 machine checks that drive the gradient: 5 visible + 4 hidden tests, each scored individually.
function granularChecks(cwd) {
  const named = [
    ...extractTestNames(path.join(cwd, caseDef.visibleTest)).map((n) => ({ name: n, kind: "visible" })),
    ...extractTestNames(path.join(cwd, caseDef.hiddenTest)).map((n) => ({ name: n, kind: "hidden" })),
  ];
  return named.map((test) => ({
    name: `${caseDef.id} ${test.kind} test: ${test.name}`,
    kind: test.kind,
    status: runNamedTest(cwd, test.name) ? "pass" : "fail",
  }));
}

function existingSandbox(arm) {
  return path.join(PRIOR_RUN_ROOT, "sandboxes", caseDef.id, arm);
}

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

function writeFixture(arm) {
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
  for (const name of ["SKILL.md", "README.md", "reference", "agents"]) {
    const source = path.join(ROOT, name);
    const target = path.join(ref, name);
    if (!fs.existsSync(source)) continue;
    // Decontaminate: never expose eval-internal case definitions (the v1 harness arm
    // wasted turns reading templates/harness-eval-cases/<this case>.yaml).
    fs.cpSync(source, target, {
      recursive: true,
      filter: (src) => !src.split(path.sep).includes("harness-eval-cases"),
    });
  }
  // A/B the skill itself: optionally swap in a different SKILL.md (e.g. the original pre-fix version).
  if (HARNESS_SKILL && fs.existsSync(HARNESS_SKILL)) {
    fs.copyFileSync(HARNESS_SKILL, path.join(ref, "SKILL.md"));
  }
  return ref;
}

function promptFor(arm, harnessRef) {
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

function runCodex(arm, cwd, prompt, harnessRef) {
  const outFile = path.join(EXP, "raw", `${caseDef.id}-${arm}-final.txt`);
  const args = [
    "exec",
    "-m",
    MODEL,
    "-c",
    EFFORT_CONFIG,
    "--disable",
    "image_generation",
    "--json",
    "--ephemeral",
    "--skip-git-repo-check",
    "--sandbox",
    "workspace-write",
    "-C",
    cwd,
    "--output-last-message",
    outFile,
  ];
  if (arm === "harness") args.push("--add-dir", harnessRef);
  args.push(prompt);

  const started = Date.now();
  const run = spawnSync("codex", args, { encoding: "utf8", timeout: TIMEOUT_MS });
  const durationMs = Date.now() - started;
  const log = `${run.stdout || ""}${run.stderr || ""}`;
  writeFile(path.join(EXP, "raw", `${caseDef.id}-${arm}.log`), log);
  const cost = parseCost(log, durationMs);
  // A context-window/timeout crash is a first-class outcome, not a silent 0-token run.
  cost.crashed = run.status !== 0 || cost.turns_completed === 0;
  return {
    exit_code: run.status,
    signal: run.signal,
    cost,
  };
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
    } catch {
      // Non-JSON status lines are expected.
    }
  }
  // codex-exec emits command_execution items, not function_call; count both so tool use is visible.
  const toolCalls = (log.match(/"type":\s*"(function_call|command_execution)"/g) || []).length;
  return { tokens, duration_ms: durationMs, tool_calls: toolCalls, turns_completed: turns };
}

function readPriorResult() {
  const file = (RESCORE_EXISTING || RECHECK_ONLY) && fs.existsSync(PRIOR_RESULT_FILE)
    ? PRIOR_RESULT_FILE
    : path.join(EXP, "result.json");
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readPriorCodex(arm, prior) {
  const armResult = prior.cases?.[caseDef.id]?.[arm]?.codex;
  if (!armResult) throw new Error(`missing prior codex result for ${arm}`);
  return armResult;
}

function injectHiddenTest(cwd) {
  writeFile(path.join(cwd, caseDef.hiddenTest), caseDef.hidden);
}

function runCheck(cwd, check) {
  const result = spawnSync(check.cmd, check.args, {
    cwd,
    encoding: "utf8",
    timeout: 120000,
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  return {
    name: `${caseDef.id} ${check.name}`,
    status: result.status === 0 ? "pass" : "fail",
    evidence: `${check.cmd} ${check.args.join(" ")} exit=${result.status}; ${summarize(output)}`,
  };
}

function summarize(text) {
  if (!text) return "no output";
  return text.split(/\n/).slice(-8).join(" ").slice(0, 500);
}

// v2 scorer. Two fixes over v1: (1) dimensions are uncapped so a correct solution can
// reach >=80 (v1 summed to a hard ceiling of 77); (2) correctness/feature scale with the
// fraction of individual tests passed, so 6/9 vs 4/9 no longer collapse to the same score.
function scoreQuality(cwd, checkResults, granular) {
  const sourceFiles = listFiles(path.join(cwd, "src")).filter((file) => file.endsWith(".mjs"));
  const testText = listFiles(path.join(cwd, "test"))
    .filter((file) => file.endsWith(".mjs") && !file.endsWith("lsp.hidden.test.mjs"))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  const sourceText = sourceFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  const sourceLines = sourceText ? sourceText.split(/\n/).length : 0;
  const gradeChecks = granular && granular.length ? granular : checkResults;
  const totalChecks = gradeChecks.length || 1;
  const passedChecks = gradeChecks.filter((check) => check.status === "pass").length;
  const passFraction = passedChecks / totalChecks;
  const allPass = passedChecks === totalChecks && gradeChecks.length > 0;
  const assertionCount = (testText.match(/\bassert\./g) || []).length;
  const hasProviders = /completion|definition|hover/.test(sourceText);
  const hasValidation = /TypeError|throw new Error|diagnostic/i.test(sourceText);
  const hasTryCatch = /\btry\s*\{/.test(sourceText);
  const hasComments = (sourceText.match(/\/\//g) || []).length >= 2;
  const hasReadme = fs.existsSync(path.join(cwd, "README.md"));
  const packageJson = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
  const dependencyCount = Object.keys(packageJson.dependencies || {}).length;

  const round = (value) => Math.max(0, Math.min(10, Math.round(value)));
  const featureScore = allPass ? 10 : round(3 + 6 * passFraction);
  const correctnessScore = round(10 * passFraction);
  const architectureScore = sourceFiles.length >= 3 ? 10 : sourceFiles.length === 2 ? 8 : 6;
  // Minimal-diff / no-bloat signal: the v1 harness rewrote a 895-line file vs baseline 747.
  let codeQualityScore = 10;
  if (/TODO|console\.log/.test(sourceText)) codeQualityScore -= 3;
  if (sourceLines > 900) codeQualityScore -= 2;
  else if (sourceLines > 600) codeQualityScore -= 1;
  codeQualityScore = Math.max(0, codeQualityScore);

  const dimensions = {
    feature_completeness: {
      score: featureScore,
      rationale: `${passedChecks}/${totalChecks} behavior tests pass.`,
    },
    test_coverage: {
      score: assertionCount >= 24 ? 10 : assertionCount >= 12 ? 8 : assertionCount >= 6 ? 6 : 4,
      rationale: `Agent-side tests include ${assertionCount} visible assertions.`,
    },
    code_quality: {
      score: codeQualityScore,
      rationale: `${sourceLines} source lines; ${/TODO|console\.log/.test(sourceText) ? "has" : "no"} debug/TODO markers.`,
    },
    error_handling: {
      score: hasValidation ? (hasTryCatch ? 10 : 9) : 6,
      rationale: hasValidation ? "Uses explicit validation or diagnostics paths." : "Validation and failure paths are thin.",
    },
    efficiency: {
      score: dependencyCount === 0 ? 10 : 7,
      rationale: dependencyCount === 0 ? "No runtime dependencies." : "Adds runtime dependencies for a small fixture.",
    },
    correctness: {
      score: correctnessScore,
      rationale: allPass ? "All behavior tests passed." : `Failing ${totalChecks - passedChecks} of ${totalChecks} behavior tests.`,
    },
    architecture: {
      score: architectureScore,
      rationale: sourceFiles.length === 1
        ? "Single-file LSP/parser/provider implementation."
        : `Uses ${sourceFiles.length} source modules for transport, parser, or providers.`,
    },
    extensibility: {
      score: hasProviders ? (sourceFiles.length >= 2 ? 9 : 7) : 5,
      rationale: sourceFiles.length >= 2 ? "Separate modules improve change isolation." : "Single module is harder to extend safely.",
    },
    documentation: {
      score: hasReadme ? 10 : hasComments ? 7 : 4,
      rationale: hasReadme ? "Includes README usage documentation." : hasComments ? "Includes local comments." : "No meaningful usage documentation added.",
    },
    dev_environment: {
      score: packageJson.scripts?.test ? 9 : 5,
      rationale: "Runnable npm test script is present.",
    },
  };

  return {
    total: Object.values(dimensions).reduce((sum, item) => sum + item.score, 0),
    pass_fraction: Number(passFraction.toFixed(3)),
    checks_passed: passedChecks,
    checks_total: totalChecks,
    dimensions,
  };
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

function runArm(arm, prior, harnessRef) {
  const cwd = RESCORE_EXISTING ? existingSandbox(arm) : writeFixture(arm);
  const codex = (RESCORE_EXISTING || RECHECK_ONLY)
    ? readPriorCodex(arm, prior)
    : runCodex(arm, cwd, promptFor(arm, harnessRef), harnessRef);
  // Existing v1 sandboxes already have the hidden test injected; only inject for fresh runs.
  if (!RESCORE_EXISTING) injectHiddenTest(cwd);
  const granular = granularChecks(cwd);
  const syntaxChecks = checks.map((check) => runCheck(cwd, check));
  const checkResults = [...granular, ...syntaxChecks];
  return {
    cwd,
    codex,
    checks: checkResults,
    quality: scoreQuality(cwd, checkResults, granular),
  };
}

function buildResult(results) {
  const baselineChecks = results[caseDef.id].baseline.checks;
  const harnessChecks = results[caseDef.id].harness.checks;
  const baselinePasses = baselineChecks.filter((check) => check.status === "pass").length;
  const harnessPasses = harnessChecks.filter((check) => check.status === "pass").length;
  const baselineTotal = results[caseDef.id].baseline.quality.total;
  const harnessTotal = results[caseDef.id].harness.quality.total;
  const passWinner = harnessPasses > baselinePasses ? "harness" : baselinePasses > harnessPasses ? "baseline" : "tie";
  const qualityWinner = harnessTotal > baselineTotal ? "harness" : baselineTotal > harnessTotal ? "baseline" : "tie";
  const winner = passWinner === qualityWinner ? passWinner : "not_proven";

  return {
    case_id: caseDef.id,
    runtime_adapter: `codex-exec:${MODEL}:reasoning-high`,
    same_repo_snapshot: true,
    isolated_worktrees: true,
    baseline: armResult("without_harness", results, "baseline"),
    harness: armResult("with_harness", results, "harness"),
    quality: {
      method: "v2: RevFactory-style 10 dimensions, each 0-10, total 100; uncapped (correct solution can reach >=80) with gradient correctness/feature over per-test pass fraction.",
      baseline: averageQuality(results, "baseline"),
      harness: averageQuality(results, "harness"),
      winner: qualityWinner,
    },
    blind_grading: true,
    winner,
    pass_winner: passWinner,
    quality_winner: qualityWinner,
    claim_status: "not_proven",
    cases: results,
  };
}

function armResult(condition, results, arm) {
  return {
    condition,
    machine_checks: results[caseDef.id][arm].checks,
    cost: results[caseDef.id][arm].codex.cost,
  };
}

function averageQuality(results, arm) {
  const quality = results[caseDef.id][arm].quality;
  return {
    average_total: quality.total,
    by_case: {
      [caseDef.id]: quality,
    },
  };
}

function writeCaseFile() {
  writeFile(path.join(EXP, "cases", `${caseDef.id}.yaml`), [
    `id: ${caseDef.id}`,
    `title: "${caseDef.title}"`,
    `difficulty: ${caseDef.difficulty}`,
    "runtime_adapter: codex-exec",
    `model: ${MODEL}`,
    "reasoning_effort: high",
    "task: |-",
    ...caseDef.task.split("\n").map((line) => `  ${line}`),
    "machine_checks:",
    ...checks.map((check) => `  - "${check.name}"`),
    "hidden_checks:",
    "  - \"incremental didChange diagnostic refresh\"",
    "  - \"completion prefix filtering signature\"",
    "  - \"local-scope definition\"",
    "  - \"syntax recovery plus semantic diagnostics\"",
    "persist_path: docs/experiments/2026-06-06-harness-eval-spark-high-lsp/",
    "",
  ].join("\n"));
}

function writeReport(result) {
  const b = result.cases[caseDef.id].baseline;
  const h = result.cases[caseDef.id].harness;
  const bPass = b.checks.every((check) => check.status === "pass") ? "pass" : "fail";
  const hPass = h.checks.every((check) => check.status === "pass") ? "pass" : "fail";
  const body = [
    "# HARNESS-EVAL Spark high LSP run",
    "",
    `Runtime adapter: ${result.runtime_adapter}`,
    `Pass winner: ${result.pass_winner}`,
    `Quality winner: ${result.quality.winner}`,
    `Overall winner: ${result.winner}`,
    `Claim status: ${result.claim_status}`,
    "",
    "## Summary",
    "",
    "- Baseline condition: Codex without supergoal or harness references.",
    "- Harness condition: same Codex model and high reasoning with a copied supergoal skill reference.",
    "- Clean slate: each arm ran in a fresh /tmp sandbox.",
    "- Hidden tests were injected after each agent run.",
    "",
    "## Machine Checks",
    "",
    "| Case | Baseline | Harness | Baseline quality | Harness quality |",
    "|---|---|---|---:|---:|",
    `| ${caseDef.id} | ${bPass} | ${hPass} | ${b.quality.total} | ${h.quality.total} |`,
    "",
    "## Quality",
    "",
    `- Baseline total: ${result.quality.baseline.average_total}/100.`,
    `- Harness total: ${result.quality.harness.average_total}/100.`,
    `- Quality winner: ${result.quality.winner}.`,
    "",
    "## Cost",
    "",
    `- Baseline: ${result.baseline.cost.tokens} tokens, ${result.baseline.cost.duration_ms} ms, ${result.baseline.cost.tool_calls} parsed tool calls.`,
    `- Harness: ${result.harness.cost.tokens} tokens, ${result.harness.cost.duration_ms} ms, ${result.harness.cost.tool_calls} parsed tool calls.`,
    "",
    "## Not Proven",
    "",
    "This run has only one hard case, so it cannot prove general harness effectiveness.",
    "",
    "## Decision",
    "",
    "Not proven",
    "",
  ].join("\n");
  writeFile(path.join(EXP, "report.md"), body);
}

function main() {
  fs.mkdirSync(EXP, { recursive: true });
  ensureCleanDir(path.join(EXP, "raw"));
  writeCaseFile();
  const prior = readPriorResult();
  const harnessRef = copyHarnessRef();
  const results = {
    [caseDef.id]: {
      baseline: runArm("baseline", prior, harnessRef),
      harness: runArm("harness", prior, harnessRef),
    },
  };
  const result = buildResult(results);
  writeFile(path.join(EXP, "result.json"), json(result));
  writeReport(result);
  console.log(JSON.stringify({
    runtime_adapter: result.runtime_adapter,
    pass_winner: result.pass_winner,
    quality_winner: result.quality.winner,
    baseline_quality: result.quality.baseline.average_total,
    harness_quality: result.quality.harness.average_total,
    baseline_checks: result.baseline.machine_checks.map((check) => check.status),
    harness_checks: result.harness.machine_checks.map((check) => check.status),
  }, null, 2));
}

main();
