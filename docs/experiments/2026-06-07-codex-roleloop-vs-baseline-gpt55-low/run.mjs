#!/usr/bin/env node
// Role-separated improvement loop vs single vs naive loop. Same task, same wrapper
// (bare codex), same model+effort (gpt-5.5 @ low). Tests whether splitting the loop
// into adversarial roles (critic writes spec-derived failing tests -> fixer makes them
// pass -> verifier) breaks past the ceiling a naive "review & improve" loop plateaued at.
//
//   single     : build pass only.
//   naive_loop : build + 3 "review & improve" passes (same as the sibling experiment).
//   role_loop  : build + critic + fixer + verifier (3 role passes; fresh context each).
//
// Scoring yardstick is FIXED: each snapshot is scored on a throwaway copy whose test/
// dir is reset to exactly the canonical visible + hidden tests, so a critic that writes
// extra tests cannot move the denominator or the test_coverage basis. If the critic
// writes WRONG tests and the fixer optimizes to them, the canonical score drops - so
// Goodhart damage shows up honestly. Hidden tests are never in the live sandbox.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const RUN_ROOT = process.env.SG_EVAL_RUN_ROOT || "/tmp/supergoal-codex-roleloop";
const MODEL = process.env.SG_EVAL_MODEL || "gpt-5.5";
const EFFORT = process.env.SG_EVAL_EFFORT || "low";
const LOOPS = Number(process.env.SG_EVAL_LOOPS || 3); // naive improve passes
const SINGLE_SEEDS = Number(process.env.SG_EVAL_SINGLE_SEEDS || 2);
const NAIVE_SEEDS = Number(process.env.SG_EVAL_NAIVE_SEEDS || 1);
const ROLE_SEEDS = Number(process.env.SG_EVAL_ROLE_SEEDS || 2);
const TIMEOUT_MS = Number(process.env.SG_EVAL_TIMEOUT_MS || 1500000);

// ---- Fixture: verbatim from the proven case-015-lsp runner. ----
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
    "package.json": json({ type: "module", scripts: { test: "node --test" } }),
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

const checks = [
  { name: "source syntax", cmd: "node", args: ["--check", caseDef.source] },
  { name: "visible test syntax", cmd: "node", args: ["--check", caseDef.visibleTest] },
  { name: "hidden test syntax", cmd: "node", args: ["--check", caseDef.hiddenTest] },
];

function escapeRegex(v) { return v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function extractTestNames(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, "utf8");
  const names = []; const re = /\btest\(\s*(['"`])(.+?)\1/g; let m;
  while ((m = re.exec(text))) names.push(m[2]);
  return names;
}
function runNamedTest(cwd, name) {
  const r = spawnSync("node", ["--test", "--test-name-pattern", `^${escapeRegex(name)}$`], { cwd, encoding: "utf8", timeout: 120000 });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  return r.status === 0 && /# pass [1-9]/.test(out) && /# fail 0\b/.test(out);
}
function granularChecks(cwd) {
  const named = [
    ...extractTestNames(path.join(cwd, caseDef.visibleTest)).map((n) => ({ name: n, kind: "visible" })),
    ...extractTestNames(path.join(cwd, caseDef.hiddenTest)).map((n) => ({ name: n, kind: "hidden" })),
  ];
  return named.map((t) => ({ name: `${caseDef.id} ${t.kind} test: ${t.name}`, kind: t.kind, status: runNamedTest(cwd, t.name) ? "pass" : "fail" }));
}
function json(v) { return `${JSON.stringify(v, null, 2)}\n`; }
function ensureCleanDir(d) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
function writeFile(f, b) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, b); }
function injectHiddenTest(cwd) { writeFile(path.join(cwd, caseDef.hiddenTest), caseDef.hidden); }
function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(full)); else out.push(full);
  }
  return out;
}
function runCheck(cwd, check) {
  const r = spawnSync(check.cmd, check.args, { cwd, encoding: "utf8", timeout: 120000 });
  return { name: `${caseDef.id} ${check.name}`, status: r.status === 0 ? "pass" : "fail" };
}

function writeFixture(arm) {
  const dir = path.join(RUN_ROOT, "sandboxes", caseDef.id, arm);
  ensureCleanDir(dir);
  for (const [name, body] of Object.entries(caseDef.files)) writeFile(path.join(dir, name), body);
  return dir;
}

function sharedPrompt() {
  return [
    `Case: ${caseDef.id} (${caseDef.difficulty})`,
    `Task:\n${caseDef.task}`,
    "",
    "Constraints:",
    "- Edit only this sandbox directory.",
    "- Keep changes minimal and dependency-free.",
    "- Do not ask follow-up questions; record assumptions and proceed.",
    "- Run `npm test` (node --test) before your final response.",
    "- The visible tests are not complete; implement the full requested behavior.",
  ].join("\n");
}
function naiveImprovePrompt() {
  return [
    "Condition: improvement loop (fresh review pass).",
    "The code already in this sandbox is a previous draft solution to the task below.",
    "Critically review and improve it:",
    "- Run `npm test` first to see the current state.",
    "- Find bugs, missing behaviors, and parts of the task that are not yet fully",
    "  implemented. The visible tests are NOT complete - implement the full requested",
    "  behavior described in the task, not just what the visible tests check.",
    "- Improve the implementation. Do NOT break tests that already pass.",
    "- Keep changes minimal and dependency-free. Do not ask questions.",
    "- Run `npm test` again before your final response.",
    "",
    `Task:\n${caseDef.task}`,
  ].join("\n");
}
function criticPrompt() {
  return [
    "Condition: CRITIC / red-team pass (fresh context). DO NOT edit anything in src/.",
    "The code in this sandbox is a draft solution to the task below. Your only job is to",
    "expose where it fails the SPEC - not just the existing tests.",
    "- Run `npm test` to see the current state.",
    "- Re-read the task carefully. Enumerate behaviors REQUIRED by the task that the",
    "  current visible tests do NOT exercise. Focus on edges: prefix-filtered completion",
    "  that returns only matching symbols AND includes each function's signature; parser",
    "  error recovery (e.g. a missing `}`) that still reports semantic diagnostics;",
    "  go-to-definition preferring the LOCAL scope over a same-named symbol elsewhere;",
    "  arity and undefined-symbol diagnostics; comment handling; didChange that clears",
    "  stale diagnostics incrementally.",
    "- Write NEW FAILING tests for those behaviors into test/spec.gen.test.mjs (create it).",
    "  Prefer black-box behavior tests and properties (roundtrip, idempotent didChange).",
    "  Derive EVERY test strictly from the task prose. Do NOT weaken, delete, or edit the",
    "  existing tests; only add the new file.",
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
    "- No padding: do not add code that is not required to make a failing test pass or to",
    "  fix a listed defect.",
    "- Update NOTES.md (fixed vs still-open). Run `npm test` before finishing.",
    "",
    `Task:\n${caseDef.task}`,
  ].join("\n");
}
function verifierPrompt() {
  return [
    "Condition: VERIFIER + final-fix pass (fresh context).",
    "- Run `npm test` and read NOTES.md.",
    "- Fix any remaining failures or regressions in src/ with minimal changes. Re-read the",
    "  task and ensure each required behavior has a passing test.",
    "- You may correct a test in test/spec.gen.test.mjs ONLY if it clearly contradicts the",
    "  task prose; never weaken coverage of a genuine requirement.",
    "- No padding. Update NOTES.md. Run `npm test` before finishing.",
    "",
    `Task:\n${caseDef.task}`,
  ].join("\n");
}

// Bare codex exec (global AGENTS.md suppressed), one fresh-context pass on `cwd`.
function runCodexPass(cwd, prompt, label) {
  const outFile = path.join(EXP, "raw", `${label}-final.txt`);
  const args = ["exec", "-m", MODEL, "-c", `model_reasoning_effort="${EFFORT}"`,
    "-c", "project_doc_max_bytes=0", "--disable", "image_generation", "--json",
    "--ephemeral", "--skip-git-repo-check", "--sandbox", "workspace-write",
    "-C", cwd, "--output-last-message", outFile, prompt];
  const started = Date.now();
  const run = spawnSync("codex", args, { cwd, encoding: "utf8", timeout: TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 });
  const durationMs = Date.now() - started;
  const log = `${run.stdout || ""}${run.stderr || ""}`;
  writeFile(path.join(EXP, "raw", `${label}.log`), log);
  let tokens = 0, turns = 0;
  for (const line of log.split(/\n/)) {
    try { const e = JSON.parse(line); if (e.type === "turn.completed" && e.usage) { turns += 1; tokens = e.usage.total_tokens ?? ((e.usage.input_tokens || 0) + (e.usage.output_tokens || 0)); } } catch { /* status */ }
  }
  const toolCalls = (log.match(/"type":\s*"(function_call|command_execution)"/g) || []).length;
  return { exit_code: run.status, crashed: run.status !== 0, tokens, duration_ms: durationMs, tool_calls: toolCalls, turns_completed: turns };
}

// v2 scorer - verbatim from the proven runner.
function scoreQuality(cwd, checkResults, granular) {
  const sourceFiles = listFiles(path.join(cwd, "src")).filter((f) => f.endsWith(".mjs"));
  const testText = listFiles(path.join(cwd, "test")).filter((f) => f.endsWith(".mjs") && !f.endsWith("lsp.hidden.test.mjs")).map((f) => fs.readFileSync(f, "utf8")).join("\n");
  const sourceText = sourceFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  const sourceLines = sourceText ? sourceText.split(/\n/).length : 0;
  const gradeChecks = granular && granular.length ? granular : checkResults;
  const totalChecks = gradeChecks.length || 1;
  const passedChecks = gradeChecks.filter((c) => c.status === "pass").length;
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
  const round = (v) => Math.max(0, Math.min(10, Math.round(v)));
  const featureScore = allPass ? 10 : round(3 + 6 * passFraction);
  const correctnessScore = round(10 * passFraction);
  const architectureScore = sourceFiles.length >= 3 ? 10 : sourceFiles.length === 2 ? 8 : 6;
  let codeQualityScore = 10;
  if (/TODO|console\.log/.test(sourceText)) codeQualityScore -= 3;
  if (sourceLines > 900) codeQualityScore -= 2; else if (sourceLines > 600) codeQualityScore -= 1;
  codeQualityScore = Math.max(0, codeQualityScore);
  const dims = {
    feature_completeness: featureScore,
    test_coverage: assertionCount >= 24 ? 10 : assertionCount >= 12 ? 8 : assertionCount >= 6 ? 6 : 4,
    code_quality: codeQualityScore,
    error_handling: hasValidation ? (hasTryCatch ? 10 : 9) : 6,
    efficiency: dependencyCount === 0 ? 10 : 7,
    correctness: correctnessScore,
    architecture: architectureScore,
    extensibility: hasProviders ? (sourceFiles.length >= 2 ? 9 : 7) : 5,
    documentation: hasReadme ? 10 : hasComments ? 7 : 4,
    dev_environment: packageJson.scripts?.test ? 9 : 5,
  };
  return { total: Object.values(dims).reduce((s, i) => s + i, 0), checks_passed: passedChecks, checks_total: totalChecks, source_lines: sourceLines };
}

// Score WITHOUT polluting the live sandbox AND with a fixed yardstick: copy, then reset
// test/ to exactly the canonical visible + hidden tests (drops any agent/critic-added or
// edited tests), so the denominator and test_coverage basis are identical for all arms.
function scoreSnapshot(srcDir, label) {
  const dst = path.join(RUN_ROOT, "scoring", label);
  ensureCleanDir(dst);
  fs.cpSync(srcDir, dst, { recursive: true });
  fs.rmSync(path.join(dst, "test"), { recursive: true, force: true });
  writeFile(path.join(dst, caseDef.visibleTest), caseDef.files[caseDef.visibleTest]);
  injectHiddenTest(dst);
  const granular = granularChecks(dst);
  const syntax = checks.map((c) => runCheck(dst, c));
  const quality = scoreQuality(dst, [...granular, ...syntax], granular);
  const vis = granular.filter((c) => c.kind === "visible");
  const hid = granular.filter((c) => c.kind === "hidden");
  const hiddenFails = hid.filter((c) => c.status === "fail").map((c) => c.name.replace(/.*hidden test: /, ""));
  fs.rmSync(dst, { recursive: true, force: true });
  return {
    label, visible_pass: vis.filter((c) => c.status === "pass").length, hidden_pass: hid.filter((c) => c.status === "pass").length,
    checks_passed: quality.checks_passed, checks_total: quality.checks_total, quality: quality.total, source_lines: quality.source_lines, hidden_fails: hiddenFails,
  };
}

function aggregate(passes) {
  return {
    total_tokens: passes.reduce((s, p) => s + (p.cost.tokens || 0), 0),
    total_duration_ms: passes.reduce((s, p) => s + p.cost.duration_ms, 0),
    total_tool_calls: passes.reduce((s, p) => s + p.cost.tool_calls, 0),
  };
}

function runSingle(seed) {
  const arm = `single-s${seed}`;
  const cwd = writeFixture(arm);
  const cost = runCodexPass(cwd, sharedPrompt(), `${arm}-build`);
  const snap = scoreSnapshot(cwd, `${arm}-final`);
  console.error(`[single s${seed}] ${snap.checks_passed}/${snap.checks_total} q${snap.quality} (${snap.source_lines} lines) tok=${cost.tokens} ${Math.round(cost.duration_ms / 1000)}s exit=${cost.exit_code}`);
  const passes = [{ label: "build", cost, snap }];
  return { seed, passes, final: snap, ...aggregate(passes) };
}

function runNaive(seed) {
  const arm = `naive-s${seed}`;
  const cwd = writeFixture(arm);
  const passes = [];
  let cost = runCodexPass(cwd, sharedPrompt(), `${arm}-build`);
  let snap = scoreSnapshot(cwd, `${arm}-build`);
  passes.push({ label: "build", cost, snap });
  console.error(`[naive s${seed}] build -> ${snap.checks_passed}/${snap.checks_total} q${snap.quality}`);
  for (let i = 1; i <= LOOPS; i += 1) {
    cost = runCodexPass(cwd, naiveImprovePrompt(), `${arm}-loop${i}`);
    snap = scoreSnapshot(cwd, `${arm}-loop${i}`);
    passes.push({ label: `loop${i}`, cost, snap });
    console.error(`[naive s${seed}] loop${i} -> ${snap.checks_passed}/${snap.checks_total} q${snap.quality} (${snap.source_lines} lines) exit=${cost.exit_code}`);
  }
  return { seed, passes, final: passes[passes.length - 1].snap, trajectory: passes.map((p) => ({ label: p.label, checks: p.snap.checks_passed, quality: p.snap.quality })), ...aggregate(passes) };
}

function runRole(seed) {
  const arm = `role-s${seed}`;
  const cwd = writeFixture(arm);
  const passes = [];
  const stages = [
    { label: "build", prompt: sharedPrompt() },
    { label: "critic", prompt: criticPrompt() },
    { label: "fixer", prompt: fixerPrompt() },
    { label: "verifier", prompt: verifierPrompt() },
  ];
  for (const st of stages) {
    const cost = runCodexPass(cwd, st.prompt, `${arm}-${st.label}`);
    const snap = scoreSnapshot(cwd, `${arm}-${st.label}`);
    passes.push({ label: st.label, cost, snap });
    console.error(`[role s${seed}] ${st.label} -> ${snap.checks_passed}/${snap.checks_total} q${snap.quality} (${snap.source_lines} lines) exit=${cost.exit_code}`);
  }
  return { seed, passes, final: passes[passes.length - 1].snap, trajectory: passes.map((p) => ({ label: p.label, checks: p.snap.checks_passed, quality: p.snap.quality })), ...aggregate(passes) };
}

function band(runs, pick) {
  if (!runs.length) return null;
  const xs = runs.map(pick);
  return { min: Math.min(...xs), max: Math.max(...xs), mean: Number((xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(2)), values: xs };
}
function summaryFor(runs) {
  if (!runs.length) return null;
  return { checks: band(runs, (r) => r.final.checks_passed), quality: band(runs, (r) => r.final.quality), tokens: band(runs, (r) => r.total_tokens), duration_ms: band(runs, (r) => r.total_duration_ms) };
}

function main() {
  fs.mkdirSync(EXP, { recursive: true });
  ensureCleanDir(path.join(EXP, "raw"));
  ensureCleanDir(RUN_ROOT);

  const single = [];
  for (let s = 1; s <= SINGLE_SEEDS; s += 1) single.push(runSingle(s));
  const naive = [];
  for (let s = 1; s <= NAIVE_SEEDS; s += 1) naive.push(runNaive(s));
  const role = [];
  for (let s = 1; s <= ROLE_SEEDS; s += 1) role.push(runRole(s));

  const result = {
    case_id: caseDef.id,
    runtime: `bare codex (gpt-5.5 @ ${EFFORT}); single=1 pass, naive=build+${LOOPS} review passes, role=build+critic+fixer+verifier`,
    model: MODEL, reasoning_effort: EFFORT, loops: LOOPS,
    seeds: { single: SINGLE_SEEDS, naive: NAIVE_SEEDS, role: ROLE_SEEDS },
    claim_status: "directional (small n; yardstick fixed to canonical tests on score-time copies)",
    summary: {
      single: summaryFor(single), naive_loop: summaryFor(naive), role_loop: summaryFor(role),
      naive_trajectories: naive.map((r) => ({ seed: r.seed, traj: r.trajectory })),
      role_trajectories: role.map((r) => ({ seed: r.seed, traj: r.trajectory })),
    },
    single, naive, role,
  };
  fs.writeFileSync(path.join(EXP, "result.json"), json(result));
  console.log(JSON.stringify(result.summary, null, 2));
}

main();
