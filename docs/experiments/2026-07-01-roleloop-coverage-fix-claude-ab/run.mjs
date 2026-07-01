#!/usr/bin/env node
// HARNESS-EVAL (claude -p runtime): does fixing the role-loop's single-critic
// coverage serialization make the role-loop BEAT an equal-compute naive loop?
//
// Prior finding (docs/experiments/2026-06-07-harness-eval-underspecified-n3):
// on u1 deepMerge the role-loop (3.3/4) LOST to an equal-compute naive loop
// (4.0/4) because one critic pass missed the null-source requirement, so the
// fixer never fixed it. This eval adds harness_v2 = critic enumerates each
// input's degenerate values (null/undefined/empty/boundary) + verifier runs a
// whole-spec completeness sweep. Arms, same model, ground-truth hidden scoring:
//   baseline   : 1 bare pass, no skill.
//   naive      : build + 3 review passes, no skill (equal-compute control, 4 pass).
//   harness_v1 : build(skill) -> critic -> fixer -> verify (CURRENT prompts, 4 pass).
//   harness_v2 : build(skill) -> critic_v2 -> fixer -> verify_v2 (FIXED, 4 pass).
//
// Runtime: claude -p (headless), prompt via stdin, --output-format json.
// Scoring: a throwaway copy whose test/ is reset to canonical visible+hidden,
// so critic-added tests can never move the denominator.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(EXP, "..", "..", "..");
const MODEL = process.env.SG_MODEL || "sonnet";
const SEEDS = Number(process.env.SG_SEEDS || 3);
const ARMS = (process.env.SG_ARMS || "baseline,naive,harness_v1,harness_v2").split(",").map((s) => s.trim()).filter(Boolean);
const RUN_ROOT = process.env.SG_RUN_ROOT || path.join(process.env.TEMP || "/tmp", "sg-roleloop-ab");
const TIMEOUT_MS = Number(process.env.SG_TIMEOUT_MS || 420000);
const RETRIES = Number(process.env.SG_RETRIES || 2); // transient (rate-limit) safety net
const SUFFIX = process.env.SG_SUFFIX || "";
function sleepSync(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }

// --------------------------------------------------------------------------
// u1 deepMerge fixture (verbatim from the underspecified-n3 corpus).
// --------------------------------------------------------------------------
const CASE = {
  id: "underspec-deepmerge",
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
    "package.json": JSON.stringify({ name: "underspec-deepmerge", version: "1.0.0", type: "module", scripts: { test: "node --test" } }, null, 2) + "\n",
    "src/merge.mjs": "export function deepMerge(target, source) {\n  throw new Error('not implemented');\n}\n",
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
};

// --------------------------------------------------------------------------
// fs helpers
// --------------------------------------------------------------------------
function ensureCleanDir(d) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
function writeFile(p, body) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, body); }
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function writeFixture(arm, seed) {
  const dir = path.join(RUN_ROOT, "sandboxes", `${arm}-s${seed}`);
  ensureCleanDir(dir);
  for (const [name, body] of Object.entries(CASE.files)) writeFile(path.join(dir, name), body);
  return dir;
}

// Copy only the eval-safe slice of the skill (SKILL.md + reference/ + agents/).
// Strips templates/, docs/experiments/, tests/ - the arm can never read cases,
// hidden tests, or the scorer.
function copyHarnessRef() {
  const ref = path.join(RUN_ROOT, "harness-ref");
  ensureCleanDir(ref);
  for (const name of ["SKILL.md", "reference", "agents"]) {
    const src = path.join(REPO, name);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(ref, name), { recursive: true });
  }
  return ref;
}

// --------------------------------------------------------------------------
// scoring: reset test/ to canonical visible+hidden in a throwaway copy.
// --------------------------------------------------------------------------
function extractTestNames(text) {
  const names = []; const re = /\btest\(\s*(['"`])(.*?)\1/g; let m;
  while ((m = re.exec(text))) names.push(m[2]);
  return names;
}
function runNamedTest(cwd, name) {
  const r = spawnSync("node", ["--test", "--test-name-pattern", `^${escapeRegex(name)}$`], { cwd, encoding: "utf8", timeout: 120000 });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  return r.status === 0 && /# pass [1-9]/.test(out) && /# fail 0\b/.test(out);
}
function scoreArm(srcDir) {
  const dst = path.join(RUN_ROOT, "score", path.basename(srcDir));
  ensureCleanDir(dst);
  // take the arm's produced src, but a CANONICAL test/ (visible + hidden).
  fs.cpSync(path.join(srcDir, "src"), path.join(dst, "src"), { recursive: true });
  writeFile(path.join(dst, "package.json"), CASE.files["package.json"]);
  writeFile(path.join(dst, CASE.visibleTest), CASE.files[CASE.visibleTest]);
  writeFile(path.join(dst, CASE.hiddenTest), CASE.hidden);
  const visNames = extractTestNames(CASE.files[CASE.visibleTest]).map((n) => ({ n, kind: "visible" }));
  const hidNames = extractTestNames(CASE.hidden).map((n) => ({ n, kind: "hidden" }));
  const checks = [...visNames, ...hidNames].map((t) => ({ name: t.n, kind: t.kind, pass: runNamedTest(dst, t.n) }));
  const vis = checks.filter((c) => c.kind === "visible");
  const hid = checks.filter((c) => c.kind === "hidden");
  const visPass = vis.filter((c) => c.pass).length;
  const hidPass = hid.filter((c) => c.pass).length;
  // false-GREEN: the arm's OWN visible suite passes but a hidden requirement fails.
  const falseGreen = visPass === vis.length && hidPass < hid.length ? 1 : 0;
  return { checks, visible: `${visPass}/${vis.length}`, hidden: `${hidPass}/${hid.length}`, hidden_pass: hidPass, hidden_total: hid.length, false_green: falseGreen };
}

// --------------------------------------------------------------------------
// claude -p driver: prompt via stdin, --output-format json (event array).
// --------------------------------------------------------------------------
function claudePassOnce(cwd, prompt, addDir) {
  const args = ["-p", "--output-format", "json", "--model", MODEL,
    "--permission-mode", "acceptEdits",
    "--allowedTools", "Edit", "Write", "Read", "Bash", "Grep", "Glob"];
  if (addDir) args.push("--add-dir", addDir);
  const started = Date.now();
  const r = spawnSync("claude", args, { cwd, input: prompt, encoding: "utf8", timeout: TIMEOUT_MS, maxBuffer: 128 * 1024 * 1024 });
  const durationMs = Date.now() - started;
  let cost = 0, tokens = 0, turns = 0, isError = false, subtype = "";
  try {
    const events = JSON.parse(r.stdout || "[]");
    const arr = Array.isArray(events) ? events : [events];
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
  return { exit: r.status, crashed, reason, cost, tokens, turns, duration_ms: durationMs };
}

// Retry a crashed pass (transient rate-limit/contention). A pass that stays
// crashed after RETRIES is recorded with its reason, never a silent zero.
function claudePass(cwd, prompt, addDir) {
  let last = null, retries = 0, costAll = 0;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    last = claudePassOnce(cwd, prompt, addDir);
    costAll += last.cost || 0; // count spend even on failed attempts
    if (!last.crashed) break;
    retries++;
    if (attempt < RETRIES) sleepSync(4000 * (attempt + 1));
  }
  return { ...last, cost: costAll, retries };
}

// --------------------------------------------------------------------------
// prompts (case-agnostic; derive only from CASE.task - no hidden-test leak).
// --------------------------------------------------------------------------
function baseLines() {
  return [
    `Task:\n${CASE.task}`,
    "",
    "Constraints:",
    "- Edit only files inside this directory.",
    "- Keep changes minimal and dependency-free.",
    "- Do not ask follow-up questions; make reasonable decisions and finish.",
    "- The visible tests are NOT a complete spec; satisfy the full behavior in the task.",
    "- Run `npm test` before your final response.",
  ];
}
const baselinePrompt = () => [...baseLines(), "",
  "Condition: baseline (no harness). Do not read or use any skill or harness docs. Use ordinary problem solving only."].join("\n");
const naiveBuildPrompt = () => [...baseLines(), "", "Condition: first implementation pass (no harness)."].join("\n");
const naiveReviewPrompt = () => [...baseLines(), "",
  "Condition: review-and-improve pass (no harness). Re-read the WHOLE task. Find any behavior the task requires that the current code gets wrong or misses - especially edge cases and degenerate inputs - and fix it with a minimal change. Run `npm test` before finishing."].join("\n");
const harnessBuildPrompt = (ref) => [...baseLines(), "",
  "Condition: with the supergoal skill.",
  `Consult the approved supergoal skill at ${path.join(ref, "SKILL.md")} and follow it: baseline-first - smallest correct change, test-first, preserve surrounding style, verify against the real tests.`].join("\n");

const criticPromptV1 = () => [
  "Condition: CRITIC / red-team pass (fresh context). DO NOT edit anything in src/.",
  "The code here is a draft solution to the task below. Expose where it fails the SPEC - not merely the existing tests.",
  "- Run `npm test` to see the current state.",
  "- Re-read the task. Enumerate behaviors REQUIRED by the task that the current visible tests do NOT exercise:",
  "  boundary values, error/rejection handling, concurrency/interleaving, public-API shape, security and",
  "  untrusted-input handling, and the conventions implied by the task's named operation or data format.",
  "- Write NEW FAILING black-box tests for those behaviors into test/spec.gen.test.mjs (create it). Derive each",
  "  test from the task's stated or clearly-implied contract. Do NOT weaken, delete, or edit existing tests.",
  "- Append a short bullet list of open defects to NOTES.md.",
  "- DO NOT modify src/. Run `npm test` at the end; new failing spec.gen tests are expected.",
  "",
  `Task:\n${CASE.task}`,
].join("\n");

// v2 adds the ONE targeted fix: explicit per-parameter degenerate-value enumeration.
const criticPromptV2 = () => [
  "Condition: CRITIC / red-team pass (fresh context). DO NOT edit anything in src/.",
  "The code here is a draft solution to the task below. Expose where it fails the SPEC - not merely the existing tests.",
  "- Run `npm test` to see the current state.",
  "- Re-read the task. Enumerate behaviors REQUIRED by the task that the current visible tests do NOT exercise:",
  "  boundary values, error/rejection handling, concurrency/interleaving, public-API shape, security and",
  "  untrusted-input handling, and the conventions implied by the task's named operation or data format.",
  "- DEGENERATE-INPUT SWEEP (required): for EACH input/parameter of the function under test, walk its",
  "  degenerate values one by one - null, undefined, empty ({}/[]/''), zero-length, and boundary - and for",
  "  every one the spec implies must be handled, write a failing test. Missing a single degenerate input is",
  "  the dominant single-pass coverage gap; do not skip a parameter.",
  "- Write NEW FAILING black-box tests for all of the above into test/spec.gen.test.mjs (create it). Derive each",
  "  test from the task's stated or clearly-implied contract. Do NOT weaken, delete, or edit existing tests.",
  "- Append a short bullet list of open defects to NOTES.md.",
  "- DO NOT modify src/. Run `npm test` at the end; new failing spec.gen tests are expected.",
  "",
  `Task:\n${CASE.task}`,
].join("\n");

const fixerPrompt = () => [
  "Condition: FIXER pass (fresh context). DO NOT edit any test file under test/.",
  "- Run `npm test`. Some tests (test/spec.gen.test.mjs) fail on purpose - they encode required spec behavior.",
  "  Read NOTES.md for the open-defect list.",
  "- Make the failing tests pass with the SMALLEST correct change to src/. Do not break tests that already pass.",
  "- No padding: add no code that is not required to pass a failing test or fix a listed defect.",
  "- Update NOTES.md (fixed vs still-open). Run `npm test` before finishing.",
  "",
  `Task:\n${CASE.task}`,
].join("\n");

const verifyPromptV1 = () => [
  "Condition: VERIFIER + final-fix pass (fresh context).",
  "- Run `npm test` and read NOTES.md.",
  "- Fix any remaining failures or regressions in src/ with minimal changes. Re-read the task and ensure each",
  "  required behavior has a passing test.",
  "- You may correct a test in test/spec.gen.test.mjs ONLY if it clearly contradicts the task prose; never",
  "  weaken coverage of a genuine requirement.",
  "- No padding. Update NOTES.md. Run `npm test` before finishing.",
  "",
  `Task:\n${CASE.task}`,
].join("\n");

// v2 adds the second half of the fix: a whole-spec completeness sweep so a
// required behavior with NO critic test still gets implemented + guarded.
const verifyPromptV2 = () => [
  "Condition: VERIFIER + final-fix pass (fresh context).",
  "- Run `npm test` and read NOTES.md.",
  "- Fix any remaining failures or regressions in src/ with minimal changes.",
  "- WHOLE-SPEC COMPLETENESS SWEEP (required): re-read the FULL task from scratch, ignoring which tests exist.",
  "  For every behavior the task states or clearly implies - including each input's degenerate values",
  "  (null/undefined/empty/boundary) - confirm the code is correct. For any requirement that lacks a passing",
  "  test, add a spec-anchored test to test/spec.gen.test.mjs AND fix src minimally so it passes. Do not rely",
  "  only on the tests the critic already wrote.",
  "- You may correct a spec.gen test ONLY if it clearly contradicts the task prose; never weaken genuine coverage.",
  "- No padding beyond what a stated-or-implied requirement needs. Update NOTES.md. Run `npm test` before finishing.",
  "",
  `Task:\n${CASE.task}`,
].join("\n");

// --------------------------------------------------------------------------
// arm runners
// --------------------------------------------------------------------------
function runArm(arm, seed, ref) {
  const cwd = writeFixture(arm, seed);
  const passes = [];
  const pass = (p, addDir) => passes.push(claudePass(cwd, p, addDir));
  if (arm === "baseline") {
    pass(baselinePrompt());
  } else if (arm === "naive") {
    pass(naiveBuildPrompt());
    pass(naiveReviewPrompt()); pass(naiveReviewPrompt()); pass(naiveReviewPrompt());
  } else if (arm === "harness_v1") {
    pass(harnessBuildPrompt(ref), ref);
    pass(criticPromptV1()); pass(fixerPrompt()); pass(verifyPromptV1());
  } else if (arm === "harness_v2") {
    pass(harnessBuildPrompt(ref), ref);
    pass(criticPromptV2()); pass(fixerPrompt()); pass(verifyPromptV2());
  }
  const score = scoreArm(cwd);
  const cost = passes.reduce((s, p) => s + (p.cost || 0), 0);
  const crashed = passes.some((p) => p.crashed);
  const crash_reasons = passes.filter((p) => p.crashed).map((p) => p.reason);
  const retries_total = passes.reduce((s, p) => s + (p.retries || 0), 0);
  return { arm, seed, ...score, passes: passes.length, cost_usd: round4(cost), crashed, crash_reasons, retries_total, per_pass: passes };
}
function round4(n) { return Math.round(n * 10000) / 10000; }
function avg(a) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0; }

function summarize(arm, runs) {
  return {
    arm, seeds: runs.length,
    hidden_each: runs.map((r) => r.hidden),
    hidden_pass_each: runs.map((r) => r.hidden_pass),
    hidden_pass_avg: round4(avg(runs.map((r) => r.hidden_pass))),
    hidden_total: runs[0]?.hidden_total ?? 0,
    false_green_count: runs.reduce((s, r) => s + r.false_green, 0),
    crashed_count: runs.filter((r) => r.crashed).length,
    cost_usd_total: round4(runs.reduce((s, r) => s + r.cost_usd, 0)),
    cost_usd_avg: round4(avg(runs.map((r) => r.cost_usd))),
    passes_avg: round4(avg(runs.map((r) => r.passes))),
  };
}

function main() {
  fs.mkdirSync(path.join(EXP, "raw"), { recursive: true });
  const ref = copyHarnessRef();
  const result = { case: CASE.id, model: MODEL, seeds: SEEDS, runtime_adapter: `claude-p:${MODEL}`, arms: {}, per_seed: [] };
  for (const arm of ARMS) {
    const runs = [];
    for (let s = 0; s < SEEDS; s++) {
      process.stderr.write(`[run] ${arm} seed ${s}\n`);
      const r = runArm(arm, s, ref);
      runs.push(r);
      result.per_seed.push({ arm, seed: s, hidden: r.hidden, visible: r.visible, false_green: r.false_green, cost_usd: r.cost_usd, crashed: r.crashed, crash_reasons: r.crash_reasons, retries_total: r.retries_total });
      process.stderr.write(`   -> hidden ${r.hidden} visible ${r.visible} falseGREEN ${r.false_green} cost $${r.cost_usd} crashed ${r.crashed}${r.crashed ? " [" + r.crash_reasons.join(",") + "]" : ""} retries ${r.retries_total}\n`);
    }
    result.arms[arm] = summarize(arm, runs);
  }
  const out = path.join(EXP, `result${SUFFIX}.json`);
  fs.writeFileSync(out, JSON.stringify(result, null, 2));
  process.stderr.write(`[done] wrote ${out}\n`);
  console.log(JSON.stringify(result.arms, null, 2));
}
main();
