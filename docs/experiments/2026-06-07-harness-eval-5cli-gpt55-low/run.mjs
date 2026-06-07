#!/usr/bin/env node
// 5-CLI harness eval on the only runnable RevFactory fixture (case-015-lsp).
// Same model (gpt-5.5) and same reasoning (low) across every arm; the ONLY
// variable is the CLI / harness wrapper. Reuses the proven v2 scorer.
//
// Arms (all -> same gpt-5.5 via the local headroom proxy 127.0.0.1:8787):
//   codex            bare codex exec, global AGENTS.md suppressed
//   codex_agents     codex exec, loads ~/.codex/AGENTS.md (Ten Commandments rules)
//   codex_supergoal  bare codex + supergoal SKILL.md reference (the only treatment)
//   ohmypi           oh-my-pi (omp) native harness
//   hermes           hermes native harness
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(EXP, "../../..");
const RUN_ROOT = process.env.SG_EVAL_RUN_ROOT || "/tmp/supergoal-harness-eval-5cli-gpt55-low";
const MODEL = process.env.SG_EVAL_MODEL || "gpt-5.5";
const OMP_MODEL = process.env.SG_EVAL_OMP_MODEL || "openai-codex/gpt-5.5";
const EFFORT = process.env.SG_EVAL_EFFORT || "low";
const TIMEOUT_MS = Number(process.env.SG_EVAL_TIMEOUT_MS || 1500000);
// Run only a subset of arms (comma list) for retries, e.g. SG_EVAL_ARMS=ohmypi,hermes
const ONLY_ARMS = (process.env.SG_EVAL_ARMS || "").split(",").map((s) => s.trim()).filter(Boolean);

const ARMS = [
  { id: "codex", cli: "codex", treatment: "bare" },
  { id: "codex_agents", cli: "codex", treatment: "agents" },
  { id: "codex_supergoal", cli: "codex", treatment: "supergoal" },
  { id: "ohmypi", cli: "omp", treatment: "native" },
  { id: "hermes", cli: "hermes", treatment: "native" },
];

// ---- Fixture: copied verbatim from the proven case-015-lsp runner. ----
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
function runNamedTest(cwd, name) {
  const pattern = `^${escapeRegex(name)}$`;
  const result = spawnSync("node", ["--test", "--test-name-pattern", pattern], {
    cwd, encoding: "utf8", timeout: 120000,
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`;
  return result.status === 0 && /# pass [1-9]/.test(output) && /# fail 0\b/.test(output);
}
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
function json(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function ensureCleanDir(dir) { fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); }
function writeFile(file, body) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, body); }

function writeFixture(arm) {
  const dir = path.join(RUN_ROOT, "sandboxes", caseDef.id, arm);
  ensureCleanDir(dir);
  for (const [name, body] of Object.entries(caseDef.files)) writeFile(path.join(dir, name), body);
  return dir;
}

// The AGENTS.md arm gets the user's real coding rules placed in the sandbox root,
// so it differs from bare codex by exactly one file.
const AGENTS_MD = fs.readFileSync(path.join(process.env.HOME, ".codex", "AGENTS.md"), "utf8");

function copyHarnessRef() {
  const ref = path.join(RUN_ROOT, "harness-ref");
  ensureCleanDir(ref);
  for (const name of ["SKILL.md", "README.md", "reference", "agents", "templates"]) {
    const source = path.join(ROOT, name);
    const target = path.join(ref, name);
    if (!fs.existsSync(source)) continue;
    fs.cpSync(source, target, {
      recursive: true,
      // Strip every eval-internal artifact so the supergoal arm cannot read the
      // HARNESS-EVAL contract, case specs, rubric, or scorer it is judged by.
      filter: (src) => !path.basename(src).startsWith("harness-eval")
        && !src.split(path.sep).includes("harness-eval-cases"),
    });
  }
  return ref;
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
function promptFor(arm, harnessRef) {
  if (arm.treatment === "supergoal") {
    return [
      `A supergoal skill reference is available at ${path.join(harnessRef, "SKILL.md")}.`,
      "Read it first, route this task through the smallest applicable supergoal mode,",
      "and apply its verification discipline in this noninteractive eval. The task",
      "statement is implementation approval; record assumptions instead of pausing",
      "for human feedback. Do not edit the reference directory.",
      "",
      sharedPrompt(),
    ].join("\n");
  }
  return sharedPrompt();
}

// ---- Per-CLI runners. All target the same gpt-5.5 at low reasoning. ----
function runCodex(arm, cwd, prompt, harnessRef) {
  const outFile = path.join(EXP, "raw", `${arm.id}-final.txt`);
  const args = ["exec", "-m", MODEL, "-c", `model_reasoning_effort="${EFFORT}"`];
  // Bare + supergoal arms suppress the global ~/.codex/AGENTS.md; the agents arm keeps it.
  if (arm.treatment !== "agents") args.push("-c", "project_doc_max_bytes=0");
  args.push("--disable", "image_generation", "--json", "--ephemeral",
    "--skip-git-repo-check", "--sandbox", "workspace-write", "-C", cwd,
    "--output-last-message", outFile);
  if (arm.treatment === "supergoal") args.push("--add-dir", harnessRef);
  args.push(prompt);
  return execAndParse("codex", args, cwd, arm, parseCodexCost);
}

function runOmp(arm, cwd, prompt) {
  // omp --mode json re-emits the full accumulated message on every token delta
  // (O(n^2) output -> tens of MB). Stream straight to a file fd so node never
  // buffers it (the earlier maxBuffer cap killed omp mid-implementation).
  const logPath = path.join(EXP, "raw", `${arm.id}.log`);
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  const fd = fs.openSync(logPath, "w");
  const args = ["-p", "--model", OMP_MODEL, "--thinking", EFFORT, "--auto-approve", "--mode", "json", prompt];
  const started = Date.now();
  const run = spawnSync("omp", args, { cwd, timeout: TIMEOUT_MS, stdio: ["ignore", fd, fd] });
  const durationMs = Date.now() - started;
  fs.closeSync(fd);
  const cost = parseOmpCostFromFile(logPath, durationMs);
  cost.crashed = run.status !== 0;
  cost.exit_code = run.status;
  cost.signal = run.signal || null;
  // Trim the giant streamed log to head + final event so the repo stays light.
  const head = grepShell(`head -5 "${logPath}"`);
  const tail = grepShell(`grep '"type":"agent_end"' "${logPath}" | tail -1`);
  fs.writeFileSync(logPath, `${head}\n...streamed partial deltas elided (O(n^2) omp json mode)...\n${tail}\n`);
  return { exit_code: run.status, signal: run.signal, cost };
}

function grepShell(cmd) {
  const r = spawnSync("bash", ["-c", cmd], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  return (r.stdout || "").trim();
}

// Parse omp cost from the final agent_end line only (avoids loading the huge file).
function parseOmpCostFromFile(logPath, durationMs) {
  const line = grepShell(`grep '"type":"agent_end"' "${logPath}" | tail -1`);
  let tokens = 0, toolCalls = 0, ok = false;
  if (line) {
    try {
      const e = JSON.parse(line);
      if (Array.isArray(e.messages)) {
        ok = true;
        for (const m of e.messages) {
          if (m.role === "toolResult") toolCalls += 1;
          if (m.role === "assistant" && m.usage && m.usage.totalTokens) tokens += m.usage.totalTokens;
        }
      }
    } catch { /* truncated/invalid */ }
  }
  return { tokens, duration_ms: durationMs, tool_calls: toolCalls, turns_completed: ok ? 1 : 0 };
}

function runHermes(arm, cwd, prompt) {
  // Reasoning is forced to `low` by the orchestrate wrapper (config.yaml backup/restore).
  const args = ["chat", "-q", prompt, "-m", MODEL, "--yolo", "-Q"];
  return execAndParse("hermes", args, cwd, arm, parseHermesCost);
}

function execAndParse(bin, args, cwd, arm, parser) {
  const started = Date.now();
  const run = spawnSync(bin, args, { cwd, encoding: "utf8", timeout: TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 });
  const durationMs = Date.now() - started;
  const log = `${run.stdout || ""}${run.stderr || ""}`;
  writeFile(path.join(EXP, "raw", `${arm.id}.log`), log);
  const cost = parser(log, durationMs);
  cost.crashed = run.status !== 0;
  cost.exit_code = run.status;
  cost.signal = run.signal || null;
  return { exit_code: run.status, signal: run.signal, cost };
}

function parseCodexCost(log, durationMs) {
  let tokens = 0, turns = 0;
  for (const line of log.split(/\n/)) {
    try {
      const event = JSON.parse(line);
      if (event.type === "turn.completed" && event.usage) {
        turns += 1;
        tokens = event.usage.total_tokens
          ?? ((event.usage.input_tokens || 0) + (event.usage.output_tokens || 0));
      }
    } catch { /* status lines */ }
  }
  const toolCalls = (log.match(/"type":\s*"(function_call|command_execution)"/g) || []).length;
  return { tokens, duration_ms: durationMs, tool_calls: toolCalls, turns_completed: turns };
}

// hermes -Q suppresses token usage and tool previews; only wall-clock is reliable.
// Patch hunks (`@@`) are a rough proxy for edit activity.
function parseHermesCost(log, durationMs) {
  const toolCalls = (log.match(/^@@ /gm) || []).length;
  return { tokens: 0, duration_ms: durationMs, tool_calls: toolCalls, turns_completed: 0, note: "tokens/tools not exposed in -Q; duration_ms is the comparable cost" };
}

function injectHiddenTest(cwd) { writeFile(path.join(cwd, caseDef.hiddenTest), caseDef.hidden); }

function runCheck(cwd, check) {
  const result = spawnSync(check.cmd, check.args, { cwd, encoding: "utf8", timeout: 120000 });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  return {
    name: `${caseDef.id} ${check.name}`,
    status: result.status === 0 ? "pass" : "fail",
    evidence: `${check.cmd} ${check.args.join(" ")} exit=${result.status}; ${summarize(output)}`,
  };
}
function summarize(text) { return text ? text.split(/\n/).slice(-8).join(" ").slice(0, 500) : "no output"; }

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

// v2 scorer (uncapped, gradient correctness) - copied verbatim from the proven runner.
function scoreQuality(cwd, checkResults, granular) {
  const sourceFiles = listFiles(path.join(cwd, "src")).filter((file) => file.endsWith(".mjs"));
  const testText = listFiles(path.join(cwd, "test"))
    .filter((file) => file.endsWith(".mjs") && !file.endsWith("lsp.hidden.test.mjs"))
    .map((file) => fs.readFileSync(file, "utf8")).join("\n");
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
  let codeQualityScore = 10;
  if (/TODO|console\.log/.test(sourceText)) codeQualityScore -= 3;
  if (sourceLines > 900) codeQualityScore -= 2; else if (sourceLines > 600) codeQualityScore -= 1;
  codeQualityScore = Math.max(0, codeQualityScore);

  const dimensions = {
    feature_completeness: { score: featureScore, rationale: `${passedChecks}/${totalChecks} behavior tests pass.` },
    test_coverage: { score: assertionCount >= 24 ? 10 : assertionCount >= 12 ? 8 : assertionCount >= 6 ? 6 : 4, rationale: `Agent-side tests include ${assertionCount} visible assertions.` },
    code_quality: { score: codeQualityScore, rationale: `${sourceLines} source lines; ${/TODO|console\.log/.test(sourceText) ? "has" : "no"} debug/TODO markers.` },
    error_handling: { score: hasValidation ? (hasTryCatch ? 10 : 9) : 6, rationale: hasValidation ? "Uses explicit validation or diagnostics paths." : "Validation and failure paths are thin." },
    efficiency: { score: dependencyCount === 0 ? 10 : 7, rationale: dependencyCount === 0 ? "No runtime dependencies." : "Adds runtime dependencies for a small fixture." },
    correctness: { score: correctnessScore, rationale: allPass ? "All behavior tests passed." : `Failing ${totalChecks - passedChecks} of ${totalChecks} behavior tests.` },
    architecture: { score: architectureScore, rationale: sourceFiles.length === 1 ? "Single-file LSP/parser/provider implementation." : `Uses ${sourceFiles.length} source modules for transport, parser, or providers.` },
    extensibility: { score: hasProviders ? (sourceFiles.length >= 2 ? 9 : 7) : 5, rationale: sourceFiles.length >= 2 ? "Separate modules improve change isolation." : "Single module is harder to extend safely." },
    documentation: { score: hasReadme ? 10 : hasComments ? 7 : 4, rationale: hasReadme ? "Includes README usage documentation." : hasComments ? "Includes local comments." : "No meaningful usage documentation added." },
    dev_environment: { score: packageJson.scripts?.test ? 9 : 5, rationale: "Runnable npm test script is present." },
  };
  return {
    total: Object.values(dimensions).reduce((sum, item) => sum + item.score, 0),
    pass_fraction: Number(passFraction.toFixed(3)),
    checks_passed: passedChecks, checks_total: totalChecks, dimensions,
  };
}

function runArm(arm, harnessRef) {
  const cwd = writeFixture(arm.id);
  let run;
  if (arm.treatment === "agents") writeFile(path.join(cwd, "AGENTS.md"), AGENTS_MD);
  if (arm.cli === "codex") run = runCodex(arm, cwd, promptFor(arm, harnessRef), harnessRef);
  else if (arm.cli === "omp") run = runOmp(arm, cwd, promptFor(arm, harnessRef));
  else run = runHermes(arm, cwd, promptFor(arm, harnessRef));
  injectHiddenTest(cwd);
  const granular = granularChecks(cwd);
  const syntaxChecks = checks.map((check) => runCheck(cwd, check));
  const checkResults = [...granular, ...syntaxChecks];
  return { cwd, run, checks: checkResults, quality: scoreQuality(cwd, checkResults, granular) };
}

function main() {
  fs.mkdirSync(EXP, { recursive: true });
  if (!ONLY_ARMS.length) ensureCleanDir(path.join(EXP, "raw"));
  else fs.mkdirSync(path.join(EXP, "raw"), { recursive: true });
  const harnessRef = copyHarnessRef();
  const arms = ARMS.filter((a) => !ONLY_ARMS.length || ONLY_ARMS.includes(a.id));

  // Merge into any existing result.json so subset re-runs don't clobber prior arms.
  const resultFile = path.join(EXP, "result.json");
  const prior = fs.existsSync(resultFile) ? JSON.parse(fs.readFileSync(resultFile, "utf8")) : null;
  const armResults = (prior && prior.arms) ? { ...prior.arms } : {};

  for (const arm of arms) {
    console.error(`[run] ${arm.id} (${arm.cli}/${arm.treatment}) ...`);
    const r = runArm(arm, harnessRef);
    armResults[arm.id] = {
      cli: arm.cli, treatment: arm.treatment,
      machine_checks: r.checks, cost: r.run.cost,
      quality: r.quality, sandbox: r.cwd,
    };
    console.error(`[run] ${arm.id} -> ${r.quality.checks_passed}/${r.quality.checks_total} checks, quality ${r.quality.total}/100, exit ${r.run.exit_code}`);
  }

  const summary = Object.entries(armResults).map(([id, a]) => ({
    arm: id, cli: a.cli, treatment: a.treatment,
    checks_passed: a.quality.checks_passed, checks_total: a.quality.checks_total,
    quality: a.quality.total, tokens: a.cost.tokens, duration_ms: a.cost.duration_ms,
    tool_calls: a.cost.tool_calls, exit_code: a.cost.exit_code, crashed: a.cost.crashed,
  }));
  summary.sort((x, y) => y.checks_passed - x.checks_passed || y.quality - x.quality);

  const result = {
    case_id: caseDef.id,
    runtime: `same-model A/B: ${MODEL} @ reasoning=${EFFORT}, all arms via local headroom proxy`,
    model: MODEL, reasoning_effort: EFFORT,
    isolated_sandboxes: true, same_repo_snapshot: true,
    n_cases: 1, claim_status: "directional (n=1; not a general proof)",
    arms: armResults, summary,
  };
  fs.writeFileSync(resultFile, json(result));
  console.log(JSON.stringify(summary, null, 2));
}

main();
