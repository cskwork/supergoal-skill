#!/usr/bin/env node
// HARNESS-EVAL portable runner - the single driver every experiment imports
// instead of hand-rolling a CLI-specific spawn loop (reference/harness-eval.md
// "Runtime fit"). It is CASE-AGNOSTIC: the case fixture, the arm's ordered role
// prompts, and the scorer are INPUTS you supply; this module only owns runtime
// selection, feasibility preflight, crash-safe retry, and serial-by-default
// execution.
//
// WHY: earlier experiments each hardcoded ONE CLI (e.g. `codex exec`). That
// violates the harness-agnostic constraint and hides host breakage - `codex
// exec --sandbox workspace-write` exits instantly with 0 tokens on some Windows
// hosts, which was only discovered by spending a real call. This runner picks a
// runtime by PREFLIGHTING it (a throwaway edit+test pass) and FALLS BACK to
// another available CLI when the preferred one is missing or crashes.
//
// ADAPTER interface (ADAPTERS[name]):
//   available()                 -> boolean   is the CLI on PATH
//   preflight()                 -> {ok,reason}  one throwaway edit+test pass;
//                                  ok only if the pass did not crash AND the
//                                  stub file was actually edited (feasibility).
//   run(cwd, prompt, {addDir})  -> {exit, crashed, reason, cost, tokens, turns,
//                                   retries, duration_ms}  one role pass, with
//                                  crash retry+backoff already applied.
// A pass still crashed after its retries is a RECORDED LOSS (crashed:true with a
// reason), never a silent zero - the caller must score it as a loss.
//
// SELECTION + FALLBACK: selectAdapter(preferred) preflights `preferred` first,
// then the rest of ADAPTER_ORDER, stopping at the first that passes; it records
// host OS, the chosen adapter, and every adapter it tried. Throws only if none
// pass (so an experiment never silently measures a broken runtime).
//
// RETRY: run() retries a crashed pass up to SG_RETRIES times (default 2) with a
// linear backoff (SG_BACKOFF_MS, default 4000ms), summing spend (USD + tokens)
// across the failed attempts and recording the crash reason
// (exit_N / <is_error subtype> / no_result_event / unparseable_stdout /
// no_turn_completed / timeout / spawn_error) plus the retry count.
//
// CONCURRENCY: runUnits() is SERIAL by default (SG_CONCURRENCY=1), which is the
// only host-proven-clean setting. SG_CONCURRENCY>1 opts into a bounded parallel
// pool - but nested agent CLIs contend for a per-host rate-limit / concurrency
// ceiling, and too many at once reintroduces the is_error / nonzero-exit crashes
// that serial mode avoids. Validate the ceiling on YOUR host before trusting a
// parallel run. Role passes WITHIN one arm are ordered and always run serially.
//
// USAGE (an experiment owns the case + prompts + scorer; this owns the runtime):
//   import { selectAdapter, runPasses, runUnits } from
//     "../../../templates/harness-eval-runner.mjs";
//
//   const sel = await selectAdapter(process.env.SG_ADAPTER || "claude-p");
//   // sel = { chosen, host_os, preferred, preflights, adapter }
//   const seeds = [0, 1, 2, 3, 4, 5]; // n>=6 per arm for a PROVEN significance claim
//   const results = await runUnits(seeds, async (seed) => {
//     const cwd = writeFixture(seed);            // YOUR fixture (case is an input)
//     const passes = await runPasses(sel.adapter, cwd, [
//       { prompt: buildPrompt(refDir), addDir: refDir }, // build consults the skill ref
//       criticPrompt(), fixerPrompt(), verifyPrompt(),   // ordered role passes
//     ]);
//     return { seed, score: scoreArm(cwd), passes }; // YOUR scorer; hidden tests
//   });                                              // never live inside `cwd`
//
// Dependency-free (node built-ins only), ESM.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// --------------------------------------------------------------------------
// tunables (env-overridable; defaults are the proven-clean values)
// --------------------------------------------------------------------------
const RETRIES = Number(process.env.SG_RETRIES || 2);
const BACKOFF_MS = Number(process.env.SG_BACKOFF_MS || 4000);
const TIMEOUT_MS = Number(process.env.SG_TIMEOUT_MS || 420000);
const CONCURRENCY = Number(process.env.SG_CONCURRENCY || 1);
const CLAUDE_MODEL = process.env.SG_CLAUDE_MODEL || process.env.SG_MODEL || "sonnet";
const CODEX_MODEL = process.env.SG_CODEX_MODEL || "gpt-5.5";
const CODEX_EFFORT = process.env.SG_CODEX_EFFORT || "low";
export const DEFAULT_ADAPTER = process.env.SG_ADAPTER || "claude-p";

// --------------------------------------------------------------------------
// small helpers
// --------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function round4(n) { return Math.round(n * 10000) / 10000; }
function writeFile(p, body) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, body); }

function onPath(bin) {
  // `where` (Windows) / `which` (POSIX); both print the resolved path on success.
  const finder = process.platform === "win32" ? "where" : "which";
  const r = spawnSync(finder, [bin], { encoding: "utf8" });
  return r.status === 0 && !!(r.stdout || "").trim();
}

// Collect a child process's output without blocking the event loop, so a
// bounded parallel pool can actually overlap. Mirrors the spawnSync fields the
// parsers below rely on (status/stdout/stderr) plus killed/error.
function spawnCollect(cmd, args, { cwd, input, timeoutMs } = {}) {
  return new Promise((resolve) => {
    let stdout = "", stderr = "", killed = false, error = null, done = false;
    const finish = (code) => {
      if (done) return; // 'error' (ENOENT) may fire without 'close' - don't hang
      done = true;
      if (timer) clearTimeout(timer);
      resolve({ status: error ? null : code, stdout, stderr, killed, error });
    };
    const child = spawn(cmd, args, { cwd, windowsHide: true });
    const timer = timeoutMs ? setTimeout(() => { killed = true; child.kill(); }, timeoutMs) : null;
    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => { stderr += d; });
    child.on("error", (e) => { error = e; finish(null); });
    child.on("close", (code) => finish(code));
    // Prompt goes on STDIN, never as an arg: an arg breaks --output-format on Windows.
    try { if (input != null) child.stdin.write(input); child.stdin.end(); } catch { /* stdin gone on spawn error */ }
  });
}

// Retry a crashed pass with linear backoff. Spend (USD + tokens) is summed over
// every attempt so a failed attempt is never a free zero; the returned pass
// keeps the last attempt's outcome plus the crash count in `retries`.
async function withRetry(runOnce, cwd, prompt, opts = {}) {
  const maxRetries = opts.retries ?? RETRIES;
  const backoffMs = opts.backoffMs ?? BACKOFF_MS;
  let last = null, attempts = 0, costAll = 0, tokensAll = 0;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts = attempt + 1;
    last = await runOnce(cwd, prompt, opts);
    costAll += last.cost || 0;
    tokensAll += last.tokens || 0;
    if (!last.crashed) break;
    if (attempt < maxRetries) await sleep(backoffMs * (attempt + 1));
  }
  // `retries` = retry attempts actually performed (initial attempt excluded).
  return { ...last, cost: round4(costAll), tokens: tokensAll, retries: attempts - 1 };
}

// --------------------------------------------------------------------------
// claude -p adapter (proven pattern: prompt via stdin, --output-format json
// emits a JSON array of events; the `result` event carries cost/turns/usage).
// --------------------------------------------------------------------------
async function claudeRunOnce(cwd, prompt, { addDir } = {}) {
  const args = ["-p", "--output-format", "json", "--model", CLAUDE_MODEL,
    "--permission-mode", "acceptEdits",
    "--allowedTools", "Edit", "Write", "Read", "Bash", "Grep", "Glob"];
  if (addDir) args.push("--add-dir", addDir);
  const started = Date.now();
  const r = await spawnCollect("claude", args, { cwd, input: prompt, timeoutMs: TIMEOUT_MS });
  const duration_ms = Date.now() - started;
  if (r.error) return crashPass("spawn_error:" + (r.error.code || r.error.message), duration_ms);
  if (r.killed) return crashPass("timeout", duration_ms);
  let cost = 0, tokens = 0, turns = 0, isError = false, subtype = "";
  try {
    const arr = [].concat(JSON.parse(r.stdout || "[]"));
    let sawResult = false;
    for (const e of arr) {
      if (e && e.type === "result") {
        sawResult = true; subtype = e.subtype || "";
        cost = e.total_cost_usd ?? cost;
        isError = !!e.is_error;
        turns = e.num_turns ?? turns;
        if (e.usage) tokens = (e.usage.input_tokens || 0) + (e.usage.output_tokens || 0);
      }
    }
    if (!sawResult) { isError = true; subtype = "no_result_event"; }
  } catch { isError = true; subtype = "unparseable_stdout"; }
  const crashed = r.status !== 0 || isError;
  const reason = crashed ? (r.status !== 0 ? `exit_${r.status}` : subtype || "is_error") : "";
  return { exit: r.status, crashed, reason, cost, tokens, turns, duration_ms };
}

// --------------------------------------------------------------------------
// codex-exec adapter (proven pattern: --json emits JSONL; `turn.completed`
// events carry usage). codex-exec has no per-run USD in the stream, so spend is
// measured in tokens/turns; a zero-turn run (the Windows sandbox crash) is a loss.
// --------------------------------------------------------------------------
async function codexRunOnce(cwd, prompt, { addDir } = {}) {
  const outFile = path.join(os.tmpdir(),
    `sg-codex-last-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
  const args = ["exec", "-m", CODEX_MODEL, "-c", `model_reasoning_effort="${CODEX_EFFORT}"`,
    "-c", "project_doc_max_bytes=0", "--disable", "image_generation", "--json",
    "--ephemeral", "--skip-git-repo-check", "--sandbox", "workspace-write", "-C", cwd];
  if (addDir) args.push("--add-dir", addDir);
  args.push("--output-last-message", outFile, prompt);
  const started = Date.now();
  const r = await spawnCollect("codex", args, { cwd, timeoutMs: TIMEOUT_MS });
  const duration_ms = Date.now() - started;
  try { fs.rmSync(outFile, { force: true }); } catch { /* best-effort cleanup */ }
  if (r.error) return crashPass("spawn_error:" + (r.error.code || r.error.message), duration_ms);
  if (r.killed) return crashPass("timeout", duration_ms);
  let tokens = 0, turns = 0;
  for (const line of `${r.stdout || ""}${r.stderr || ""}`.split(/\n/)) {
    try {
      const e = JSON.parse(line);
      if (e.type === "turn.completed" && e.usage) {
        turns += 1;
        tokens = e.usage.total_tokens ?? ((e.usage.input_tokens || 0) + (e.usage.output_tokens || 0));
      }
    } catch { /* non-JSON status line */ }
  }
  const crashed = r.status !== 0 || turns === 0;
  const reason = crashed ? (r.status !== 0 ? `exit_${r.status}` : "no_turn_completed") : "";
  return { exit: r.status, crashed, reason, cost: 0, tokens, turns, duration_ms };
}

function crashPass(reason, duration_ms) {
  return { exit: null, crashed: true, reason, cost: 0, tokens: 0, turns: 0, duration_ms };
}

// --------------------------------------------------------------------------
// preflight: prove the adapter can edit files + run a test loop on THIS host.
// One throwaway deepMerge stub + one visible test; ok iff the pass did not crash
// AND the stub was actually mutated. The local `node --test` result is recorded
// in the reason but does not gate ok - preflight tests feasibility, not the
// model's correctness.
// --------------------------------------------------------------------------
async function preflightWith(runOnce) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sg-preflight-"));
  const stub = path.join(dir, "src", "merge.mjs");
  const before = "export function deepMerge(target, source) {\n  throw new Error('not implemented');\n}\n";
  try {
    writeFile(path.join(dir, "package.json"),
      JSON.stringify({ name: "sg-preflight", version: "1.0.0", type: "module", scripts: { test: "node --test" } }, null, 2) + "\n");
    writeFile(stub, before);
    writeFile(path.join(dir, "test", "merge.visible.test.mjs"), [
      "import assert from 'node:assert/strict';",
      "import { test } from 'node:test';",
      "import { deepMerge } from '../src/merge.mjs';",
      "test('merges two flat objects; source overrides target', () => {",
      "  assert.deepEqual(deepMerge({ a: 1 }, { b: 2 }), { a: 1, b: 2 });",
      "});",
      "",
    ].join("\n"));
    const prompt = [
      "Implement deepMerge(target, source) in src/merge.mjs so `npm test` passes.",
      "It merges source into target and returns the result. Export deepMerge.",
      "Edit only files inside this directory. Keep it minimal. Do not ask questions.",
      "Run `npm test` before finishing.",
    ].join("\n");
    let res;
    try { res = await runOnce(dir, prompt, {}); }
    catch (e) { res = { crashed: true, reason: `spawn_error:${e.message}` }; }
    const after = fs.existsSync(stub) ? fs.readFileSync(stub, "utf8") : before;
    const edited = after !== before;
    const tests = spawnSync("node", ["--test"], { cwd: dir, encoding: "utf8", timeout: 60000 });
    const testsPass = tests.status === 0;
    const ok = !res.crashed && edited;
    const reason = ok ? `edit ok, tests ${testsPass ? "pass" : "fail"}`
      : res.crashed ? `crashed:${res.reason}` : "stub_not_edited";
    return { ok, reason };
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best-effort */ }
  }
}

// --------------------------------------------------------------------------
// adapter registry
// --------------------------------------------------------------------------
export const ADAPTERS = {
  "claude-p": {
    name: "claude-p",
    available: () => onPath("claude"),
    preflight: () => preflightWith(claudeRunOnce),
    run: (cwd, prompt, opts) => withRetry(claudeRunOnce, cwd, prompt, opts),
  },
  "codex-exec": {
    name: "codex-exec",
    available: () => onPath("codex"),
    preflight: () => preflightWith(codexRunOnce),
    run: (cwd, prompt, opts) => withRetry(codexRunOnce, cwd, prompt, opts),
  },
};
export const ADAPTER_ORDER = ["claude-p", "codex-exec"];

// --------------------------------------------------------------------------
// selection + fallback
// --------------------------------------------------------------------------
export async function selectAdapter(preferred = DEFAULT_ADAPTER, { adapters = ADAPTERS, order = ADAPTER_ORDER } = {}) {
  const tryOrder = [preferred, ...order.filter((n) => n !== preferred)];
  const preflights = {};
  let chosen = null;
  for (const name of tryOrder) {
    const adapter = adapters[name];
    if (!adapter) { preflights[name] = { available: false, ok: false, reason: "unknown adapter" }; continue; }
    if (!adapter.available()) { preflights[name] = { available: false, ok: false, reason: "not on PATH" }; continue; }
    const pf = await adapter.preflight();
    preflights[name] = { available: true, ok: !!pf.ok, reason: pf.reason };
    if (pf.ok) { chosen = name; break; } // stop at the first runnable adapter - don't spend on the rest
  }
  if (!chosen) throw new Error(`no runnable runtime adapter (tried ${tryOrder.join(", ")}): ${JSON.stringify(preflights)}`);
  return { chosen, host_os: process.platform, preferred, preflights, adapter: adapters[chosen] };
}

// --------------------------------------------------------------------------
// execution helpers
// --------------------------------------------------------------------------
// Run one arm's ORDERED role passes (build -> critic -> fixer -> verify). Always
// serial: each pass depends on the previous edit. Each item is a prompt string
// or { prompt, addDir }; a per-item addDir overrides the shared one.
export async function runPasses(adapter, cwd, passes, { addDir } = {}) {
  const out = [];
  for (const p of passes) {
    const prompt = typeof p === "string" ? p : p.prompt;
    const dir = typeof p === "string" ? addDir : (p.addDir ?? addDir);
    out.push(await adapter.run(cwd, prompt, { addDir: dir }));
  }
  return out;
}

// Run INDEPENDENT units (per-seed / per-arm) - serial by default. See the
// concurrency note at the top before raising SG_CONCURRENCY above 1.
export async function runUnits(units, worker, { concurrency = CONCURRENCY } = {}) {
  if (concurrency <= 1) {
    const out = [];
    for (const u of units) out.push(await worker(u));
    return out;
  }
  const out = new Array(units.length);
  let next = 0;
  const pump = async () => { while (next < units.length) { const i = next++; out[i] = await worker(units[i]); } };
  await Promise.all(Array.from({ length: Math.min(concurrency, units.length) }, pump));
  return out;
}

// --------------------------------------------------------------------------
// CLI entrypoint + self-test (no real CLI spend unless --preflight is passed)
// --------------------------------------------------------------------------
function isMain() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

async function selfTest() {
  const results = [];
  const ok = (name, cond) => results.push({ name, pass: !!cond });
  // retry: crash twice then succeed -> not crashed, retries=2, spend summed.
  let calls = 0;
  const flaky = async () => { calls++; return calls < 3 ? { crashed: true, reason: `exit_1`, cost: 0, tokens: 5 } : { crashed: false, reason: "", cost: 0.02, tokens: 7, exit: 0 }; };
  const r1 = await withRetry(flaky, "x", "p", { backoffMs: 1 });
  ok("retry recovers a transient crash", !r1.crashed && r1.retries === 2 && r1.tokens === 17);
  // retry exhausted -> recorded loss with reason, never a silent zero.
  const dead = async () => ({ crashed: true, reason: "exit_1", cost: 0, tokens: 3 });
  const r2 = await withRetry(dead, "x", "p", { retries: 2, backoffMs: 1 });
  ok("exhausted retries are a recorded loss", r2.crashed && r2.retries === 2 && r2.reason === "exit_1" && r2.tokens === 9);
  // fallback: preferred preflight fails -> next available adapter chosen.
  const fake = {
    bad: { available: () => true, preflight: async () => ({ ok: false, reason: "crashed:exit_1" }) },
    good: { available: () => true, preflight: async () => ({ ok: true, reason: "edit ok" }) },
  };
  const sel = await selectAdapter("bad", { adapters: fake, order: ["bad", "good"] });
  ok("selection falls back past a crashed preflight", sel.chosen === "good" && sel.preflights.bad.ok === false && sel.preflights.good.ok === true);
  // throw when none pass.
  let threw = false;
  try { await selectAdapter("bad", { adapters: { bad: fake.bad }, order: ["bad"] }); } catch { threw = true; }
  ok("selection throws when no adapter passes", threw);
  const passed = results.filter((r) => r.pass).length;
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}`);
  console.log(`\n${passed}/${results.length} self-test checks passed`);
  return passed === results.length;
}

async function main() {
  const availability = Object.fromEntries(ADAPTER_ORDER.map((n) => [n, ADAPTERS[n].available()]));
  if (process.argv.includes("--selftest")) { process.exit((await selfTest()) ? 0 : 1); }
  if (process.argv.includes("--preflight")) {
    const { adapter, ...sel } = await selectAdapter(DEFAULT_ADAPTER);
    console.log(JSON.stringify({ host_os: process.platform, availability, selection: sel }, null, 2));
    return;
  }
  console.log(JSON.stringify({
    host_os: process.platform, availability,
    note: "use --selftest for the no-spend logic check, or --preflight to select + preflight (spends one real CLI call per tried adapter)",
  }, null, 2));
}

if (isMain()) main().catch((e) => { console.error(e); process.exit(1); });
