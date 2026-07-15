#!/usr/bin/env node
// A/B: does diff-driven regression reconciliation (commit 8c01712) reduce broken
// existing behavior versus the pre-change skill (eb1b5c7)?
//
// Arms differ ONLY in skill-ref content (SKILL.md + reference/ + agents/ archived
// from each commit); prompts, fixtures, adapter, model, seeds, timeouts identical.
// Cases: the default coding A/B pair (reference/harness-eval.md) - 002 async-race
// (DEBUG, hard) and 003 refactoring (LEGACY preserve, medium) - whose hidden suites
// specifically catch behavior drift, i.e. the exact "breaks existing features"
// failure mode under test.
//
// Runtime fit: single non-interactive process -> INLINE profile: one build pass
// consulting the shipped skill files + one scoped verify pass consulting the
// shipped auditor files (role fidelity: prompts point at the ACTUAL per-arm
// shipped files; no paraphrased role text).
//
// Controls: hidden tests never enter any sandbox; scoring runs in a throwaway
// copy whose test/ dir is reset to canonical visible+hidden; a crash/timeout
// surviving retries is a recorded LOSS; serial execution; interleaved arm order.
// Stop policy (predeclared): per-pass timeout SG_TIMEOUT_MS (default 420000 ms),
// runner-default retries on crash, no manual interruption; sandbox state at
// timeout is scored as-is.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { selectAdapter, runPasses, runUnits, DEFAULT_ADAPTER } from "../../../templates/harness-eval-runner.mjs";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(EXP, "..", "..", "..");
const FIXTURES = path.join(REPO, "templates", "harness-eval-cases", "fixtures");
const RUN_ROOT = process.env.SG_EVAL_RUN_ROOT || path.join(os.tmpdir(), "sg-regression-ab");
const SEEDS = Number(process.env.SG_AB_SEEDS || 3);
const OLD_SHA = process.env.SG_AB_OLD || "eb1b5c7";
const NEW_SHA = process.env.SG_AB_NEW || "HEAD";

const CASES = {
  "002": {
    fixture: "revfactory-case-002-async-race",
    source: "src/cache.mjs",
    visible: "test/cache.visible.test.mjs",
    hidden: "test/cache.hidden.test.mjs",
    title: "Async race-condition bug fix (DEBUG, hard)",
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
  },
  "003": {
    fixture: "revfactory-case-003-refactoring",
    source: "src/order.mjs",
    visible: "test/order.visible.test.mjs",
    hidden: "test/order.hidden.test.mjs",
    title: "Spaghetti-code refactoring, no behavior change (LEGACY, medium)",
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
  },
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}
function writeFile(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
}
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// Archive ONLY the eval-safe skill slice from a commit; templates/, tests/,
// docs/experiments/ (hidden tests, scorers, this driver) are never reachable.
function buildRef(label, sha) {
  const refDir = path.join(RUN_ROOT, "refs", label);
  ensureCleanDir(refDir);
  execFileSync("bash", ["-c",
    `git -C "${REPO}" archive ${sha} SKILL.md reference agents | tar -x -C "${refDir}"`]);
  return refDir;
}

function writeSandbox(caseKey, arm, seed) {
  const c = CASES[caseKey];
  const dir = path.join(RUN_ROOT, "sandboxes", `${caseKey}-${arm}-s${seed}`);
  ensureCleanDir(dir);
  const fix = path.join(FIXTURES, c.fixture);
  // visible slice only - the hidden test never enters a sandbox.
  fs.cpSync(path.join(fix, "package.json"), path.join(dir, "package.json"));
  fs.cpSync(path.join(fix, "src"), path.join(dir, "src"), { recursive: true });
  fs.cpSync(path.join(fix, c.visible), path.join(dir, c.visible));
  return dir;
}

// ---------------------------------------------------------------------------
// prompts - identical wording across arms; only the ref path substitutes.
// Role fidelity: both passes point at the arm's ACTUAL shipped skill files.
// ---------------------------------------------------------------------------
function taskLines(c) {
  return [
    `Case: ${c.title}`,
    "",
    `Task:\n${c.task}`,
    "",
    "Constraints:",
    "- Edit only files inside this sandbox directory.",
    "- Keep changes minimal and dependency-free.",
    "- Do not ask follow-up questions; make reasonable decisions and finish.",
    "- The visible tests are NOT a complete spec; satisfy the full behavior in the task.",
    "- Run `npm test` before your final response.",
  ];
}
function buildPrompt(c, ref) {
  return [...taskLines(c), "",
    "Condition: with the supergoal skill.",
    `Consult the approved supergoal skill at ${path.join(ref, "SKILL.md")} and follow its`,
    `contract for this task. The detailed loop authority is ${path.join(ref, "reference", "role-loop.md")};`,
    `for changes to shared code/state follow ${path.join(ref, "reference", "qa.md")}`,
    '("Characterization baseline"). Ignore any globally installed skills; use ONLY that',
    "skill copy. Apply the skill's single-process inline profile: load only the contract,",
    "make the minimal targeted diff, verify with the real tests, stop on green.",
  ].join("\n");
}
// Control arm: no skill at all, single bare pass (the standard baseline shape).
function barePrompt(c) {
  return [...taskLines(c), "",
    "Condition: baseline (no skill). Solve the task directly; do not consult any skill files.",
  ].join("\n");
}
function verifyPrompt(c, ref) {
  return [
    "Condition: final verify pass (fresh context) with the supergoal skill.",
    `Read ${path.join(ref, "agents", "qa-auditor.md")}, ${path.join(ref, "reference", "qa.md")},`,
    `and the Exact Verify/QA step of ${path.join(ref, "reference", "role-loop.md")}. Audit the`,
    "current change in this sandbox against the task below with that contract's stance.",
    "Where that contract finds an unproven, uncovered, or regressed behavior, fix src/",
    "with the smallest change - never weaken or delete tests - and re-run `npm test`",
    "until green. Ignore any globally installed skills; use ONLY that skill copy.",
    "",
    `Task:\n${c.task}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// scoring - throwaway copy, test/ reset to canonical visible+hidden, per-test
// granular pass/fail so partial drift is visible.
// ---------------------------------------------------------------------------
function extractTestNames(file) {
  if (!fs.existsSync(file)) return [];
  const names = [];
  const re = /\btest\(\s*(['"`])(.*?)\1/g;
  let m;
  const text = fs.readFileSync(file, "utf8");
  while ((m = re.exec(text))) names.push(m[2]);
  return names;
}
function runNamedTest(cwd, name) {
  const r = spawnSync("node", ["--test", "--test-name-pattern", `^${escapeRegex(name)}$`],
    { cwd, encoding: "utf8", timeout: 120000 });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  return r.status === 0 && /# pass [1-9]/.test(out) && /# fail 0\b/.test(out);
}
function scoreUnit(caseKey, sandbox) {
  const c = CASES[caseKey];
  const fix = path.join(FIXTURES, c.fixture);
  const scoring = `${sandbox}-scoring`;
  ensureCleanDir(scoring);
  fs.cpSync(path.join(sandbox, "package.json"), path.join(scoring, "package.json"));
  fs.cpSync(path.join(sandbox, "src"), path.join(scoring, "src"), { recursive: true });
  fs.cpSync(path.join(fix, c.visible), path.join(scoring, c.visible));
  fs.cpSync(path.join(fix, c.hidden), path.join(scoring, c.hidden));
  const granular = [
    ...extractTestNames(path.join(fix, c.visible)).map((n) => ({ name: n, kind: "visible" })),
    ...extractTestNames(path.join(fix, c.hidden)).map((n) => ({ name: n, kind: "hidden" })),
  ].map((t) => ({ ...t, status: runNamedTest(scoring, t.name) ? "pass" : "fail" }));
  const frac = (kind) => {
    const rows = granular.filter((g) => g.kind === kind);
    return rows.length ? rows.filter((g) => g.status === "pass").length / rows.length : 0;
  };
  return { granular, visible_fraction: frac("visible"), hidden_fraction: frac("hidden") };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  fs.mkdirSync(RUN_ROOT, { recursive: true });
  const arms = process.env.SG_AB_BASELINE ? { bare: { sha: "none", ref: null } } : {
    old: { sha: execFileSync("git", ["-C", REPO, "rev-parse", OLD_SHA], { encoding: "utf8" }).trim() },
    new: { sha: execFileSync("git", ["-C", REPO, "rev-parse", NEW_SHA], { encoding: "utf8" }).trim() },
  };
  for (const [label, a] of Object.entries(arms)) if (a.sha !== "none") a.ref = buildRef(label, a.sha);

  const sel = await selectAdapter(DEFAULT_ADAPTER);
  console.log(`adapter=${sel.chosen} host=${sel.host_os} preflights=${JSON.stringify(sel.preflights)}`);

  // interleave arms so time-of-day / rate-limit drift spreads across both.
  const caseKeys = (process.env.SG_AB_CASES || Object.keys(CASES).join(","))
    .split(",").map((s) => s.trim()).filter((k) => CASES[k]);
  const armLabels = Object.keys(arms);
  const units = [];
  for (const caseKey of caseKeys) {
    for (let seed = 0; seed < SEEDS; seed++) {
      for (const arm of armLabels) units.push({ caseKey, arm, seed });
    }
  }

  const manifest = {
    experiment: "regression-reconcile-ab",
    date: new Date().toISOString(),
    question: "Does diff-driven regression reconciliation reduce broken existing behavior?",
    arms: Object.fromEntries(Object.entries(arms).map(([k, a]) => [k, { sha: a.sha }])),
    cases: Object.fromEntries(caseKeys.map((k) => [k, { fixture: CASES[k].fixture, title: CASES[k].title }])),
    seeds_per_case_per_arm: SEEDS,
    adapter: { chosen: sel.chosen, host_os: sel.host_os, preflights: sel.preflights,
      claude_model: process.env.SG_CLAUDE_MODEL || process.env.SG_MODEL || "sonnet (adapter default)",
      codex_model: process.env.SG_CODEX_MODEL || "gpt-5.5 (adapter default)",
      codex_effort: process.env.SG_CODEX_EFFORT || "low (adapter default)" },
    stop_policy: `per-pass timeout ${process.env.SG_TIMEOUT_MS || 420000}ms, runner-default crash retries, ` +
      "no manual interruption; timeout/crash surviving retries = recorded loss; sandbox scored as-is",
    passes_per_unit: ["build (consults arm's shipped SKILL.md/role-loop.md/qa.md)",
      "verify (consults arm's shipped qa-auditor.md/qa.md/role-loop.md Verify)"],
    role_fidelity: "prompts point at the per-arm shipped skill files via --add-dir; no paraphrased role text",
    known_limits: [
      "nested CLI loads the user's global CLAUDE.md; identical in both arms",
      "installed skills are listed in the child's system prompt but the Skill tool is not in --allowedTools; both arms instructed to use only the ref copy",
    ],
  };
  writeFile(path.join(EXP, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  const results = [];
  await runUnits(units, async (u) => {
    const c = CASES[u.caseKey];
    const armRef = arms[u.arm].ref;
    const sandbox = writeSandbox(u.caseKey, u.arm, u.seed);
    const t0 = Date.now();
    const prompts = armRef ? [buildPrompt(c, armRef), verifyPrompt(c, armRef)] : [barePrompt(c)];
    const passes = await runPasses(sel.adapter, sandbox, prompts, armRef ? { addDir: armRef } : {});
    const crashed = passes.some((p) => p.crashed);
    const score = scoreUnit(u.caseKey, sandbox);
    const row = {
      ...u,
      crashed,
      crash_reasons: passes.filter((p) => p.crashed).map((p) => p.reason),
      ...score,
      all_pass: !crashed && score.granular.length > 0 && score.granular.every((g) => g.status === "pass"),
      false_green: !crashed && score.visible_fraction === 1 && score.hidden_fraction < 1,
      cost_usd: passes.reduce((s, p) => s + (p.cost || 0), 0),
      tokens: passes.reduce((s, p) => s + (p.tokens || 0), 0),
      turns: passes.reduce((s, p) => s + (p.turns || 0), 0),
      duration_ms: Date.now() - t0,
      passes: passes.map((p) => ({ exit: p.exit, crashed: p.crashed, reason: p.reason,
        cost: p.cost, tokens: p.tokens, turns: p.turns, duration_ms: p.duration_ms, retries: p.retries })),
      src_snapshot: Object.fromEntries(fs.readdirSync(path.join(sandbox, "src"))
        .map((f) => [f, fs.readFileSync(path.join(sandbox, "src", f), "utf8")])),
    };
    results.push(row);
    writeFile(path.join(EXP, "results.json"), JSON.stringify(results, null, 2) + "\n");
    console.log(`unit ${u.caseKey}-${u.arm}-s${u.seed}: hidden=${score.hidden_fraction.toFixed(2)} ` +
      `visible=${score.visible_fraction.toFixed(2)} crashed=${crashed} false_green=${row.false_green} ` +
      `tokens=${row.tokens} ${(row.duration_ms / 1000).toFixed(0)}s`);
    return row;
  });

  // aggregate
  const agg = {};
  for (const arm of armLabels) {
    const rows = results.filter((r) => r.arm === arm);
    const mean = (f) => rows.reduce((s, r) => s + f(r), 0) / (rows.length || 1);
    agg[arm] = {
      n: rows.length,
      hidden_fraction_mean: mean((r) => r.hidden_fraction),
      visible_fraction_mean: mean((r) => r.visible_fraction),
      all_pass: rows.filter((r) => r.all_pass).length,
      false_green: rows.filter((r) => r.false_green).length,
      crashed: rows.filter((r) => r.crashed).length,
      tokens_mean: Math.round(mean((r) => r.tokens)),
      cost_usd_total: rows.reduce((s, r) => s + r.cost_usd, 0),
      duration_s_mean: Math.round(mean((r) => r.duration_ms) / 1000),
    };
  }
  writeFile(path.join(EXP, "summary.json"), JSON.stringify({ manifest: path.join(EXP, "manifest.json"), agg }, null, 2) + "\n");
  console.log(`DONE ${JSON.stringify(agg)}`);
}

main().catch((e) => { console.error(`DRIVER_CRASH ${e.stack || e}`); process.exit(1); });
