#!/usr/bin/env node
// HARNESS-MAKE eval: does a harness DESIGNED by the skill's HARNESS-MAKE mode beat no-harness?
// This closes the gap the gen-harness eval left open: gen-harness generated a spec-derived *verifier*;
// here the design phase runs HARNESS-MAKE proper (reads reference/harness-make.md + harness-patterns.md)
// and emits a task-specific ROLE PIPELINE (.harness/pipeline.json = ordered {role, brief}). Phase 2 then
// EXECUTES that generated pipeline as fresh codex roles sharing the sandbox, vs a no-harness baseline.
// Scored on the SAME hidden+visible suite as every prior experiment. The design phase never sees hidden
// tests (excluded from its sandbox); the executed roles are told to verify vs the REAL tests, never a
// generated proxy (the baseline-first / anti-Goodhart rule).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(EXP, "../../..");
const FIXTURES = path.join(EXP, "fixtures");
const RUN_ROOT = process.env.SG_EVAL_RUN_ROOT || "/tmp/sg-harnessmake-eval";
const MODEL = process.env.SG_EVAL_MODEL || "gpt-5.3-codex-spark";
const EFFORT = process.env.SG_EVAL_EFFORT || "high";
const EFFORT_CONFIG = `model_reasoning_effort="${EFFORT}"`;
const TIMEOUT_MS = Number(process.env.SG_EVAL_TIMEOUT_MS || 720000);
const ONLY = process.env.SG_EVAL_ONLY || "";
const MAX_ROLES = 4;

const allCases = [
  { id: "billing-tax", title: "Invoice tax/discount engine", difficulty: "hard", dir: "billing", srcFile: "src/billing.mjs", visibleTest: "test/billing.visible.test.mjs", hiddenTest: "test/billing.hidden.test.mjs" },
  { id: "lsp", title: "MiniLang LSP server", difficulty: "hard", dir: "lsp", srcFile: "src/server.mjs", visibleTest: "test/lsp.visible.test.mjs", hiddenTest: "test/lsp.hidden.test.mjs" },
];
const cases = ONLY ? allCases.filter((c) => ONLY.split(",").includes(c.id)) : allCases;

function ensureCleanDir(d) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
function writeFile(f, b) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, b); }

function writeFixture(caseDef, arm) {
  const src = path.join(FIXTURES, caseDef.dir);
  const dst = path.join(RUN_ROOT, "sandboxes", caseDef.id, arm);
  ensureCleanDir(dst);
  const hiddenAbs = path.join(src, caseDef.hiddenTest);
  fs.cpSync(src, dst, { recursive: true, filter: (p) => p !== hiddenAbs });
  return dst;
}
function injectHiddenTest(caseDef, cwd) {
  fs.copyFileSync(path.join(FIXTURES, caseDef.dir, caseDef.hiddenTest), path.join(cwd, caseDef.hiddenTest));
}
function copySkillRef(cwd) {
  const dst = path.join(cwd, "skill-ref");
  fs.mkdirSync(dst, { recursive: true });
  for (const f of ["harness-make.md", "harness-patterns.md"]) {
    const s = path.join(ROOT, "reference", f);
    if (fs.existsSync(s)) fs.copyFileSync(s, path.join(dst, f));
  }
}

function codexCall(caseDef, arm, label, cwd, prompt) {
  const outFile = path.join(EXP, "raw", `${caseDef.id}-${arm}-${label}-final.txt`);
  const args = [
    "exec", "-m", MODEL, "-c", EFFORT_CONFIG,
    "--disable", "image_generation", "--json", "--ephemeral", "--skip-git-repo-check",
    "--sandbox", "workspace-write", "-C", cwd, "--output-last-message", outFile, prompt,
  ];
  const started = Date.now();
  const run = spawnSync("codex", args, { encoding: "utf8", timeout: TIMEOUT_MS });
  const durationMs = Date.now() - started;
  const log = `${run.stdout || ""}${run.stderr || ""}`;
  writeFile(path.join(EXP, "raw", `${caseDef.id}-${arm}-${label}.log`), log);
  const cost = parseCost(log, durationMs);
  cost.crashed = run.status !== 0 || cost.turns_completed === 0;
  cost.label = label;
  return cost;
}
function parseCost(log, durationMs) {
  let tokens = 0, turns = 0;
  for (const line of log.split(/\n/)) {
    try { const e = JSON.parse(line); if (e.type === "turn.completed" && e.usage) { turns += 1; tokens = e.usage.total_tokens ?? ((e.usage.input_tokens || 0) + (e.usage.output_tokens || 0)); } } catch { /* status */ }
  }
  const toolCalls = (log.match(/"type":\s*"(function_call|command_execution)"/g) || []).length;
  return { tokens, duration_ms: durationMs, tool_calls: toolCalls, turns_completed: turns };
}
function sumCost(costs) {
  return {
    tokens: costs.reduce((s, c) => s + (c.tokens || 0), 0),
    duration_ms: costs.reduce((s, c) => s + (c.duration_ms || 0), 0),
    tool_calls: costs.reduce((s, c) => s + (c.tool_calls || 0), 0),
    turns_completed: costs.reduce((s, c) => s + (c.turns_completed || 0), 0),
    crashed: costs.some((c) => c.crashed),
    roles: costs.map((c) => ({ label: c.label, tokens: c.tokens, duration_ms: c.duration_ms, crashed: c.crashed })),
  };
}

// ---- baseline ----
function baselinePrompt(caseDef) {
  return [
    `Case: ${caseDef.id} (${caseDef.difficulty}) - ${caseDef.title}`,
    `Read RULES.md, ${caseDef.srcFile} (the stub), and the visible tests under test/. Implement ${caseDef.srcFile} to satisfy EVERY rule in RULES.md (the visible tests don't cover them all). Run \`npm test\` until tests pass.`,
    "Condition: baseline without harness. Do not use supergoal, harness docs, role packs, or workflow skills.",
  ].join("\n");
}

// ---- Phase 1: HARNESS-MAKE designs a task-specific role pipeline ----
function designPrompt(caseDef) {
  return [
    `Case: ${caseDef.id} (${caseDef.difficulty}) - ${caseDef.title}`,
    `You are running HARNESS-MAKE. Read skill-ref/harness-make.md and skill-ref/harness-patterns.md, then read the case: RULES.md, the visible tests under test/, and ${caseDef.srcFile} (the stub).`,
    `DESIGN the smallest useful harness (agent pipeline) to solve THIS task well. Do NOT implement or edit ${caseDef.srcFile} or anything under test/.`,
    `Write the design to .harness/pipeline.json ONLY: a JSON array of 2 to ${MAX_ROLES} ordered steps, each {"role": "<short name>", "brief": "<one focused paragraph telling a fresh agent that shares the sandbox exactly what to do in this step>"}.`,
    `The pipeline as a whole must implement ${caseDef.srcFile} to satisfy every rule in RULES.md and pass \`npm test\`. Choose the roles/topology you judge best for this task (e.g. plan, implement, adversarial-review). Briefs must reference the real tests/spec as the source of truth, not an invented proxy checklist.`,
    `Output nothing but that file. Condition: design only.`,
  ].join("\n");
}
function readPipeline(genCwd) {
  const f = path.join(genCwd, ".harness", "pipeline.json");
  if (!fs.existsSync(f)) return null;
  try {
    const arr = JSON.parse(fs.readFileSync(f, "utf8"));
    if (!Array.isArray(arr) || !arr.length) return null;
    return arr.filter((s) => s && typeof s.role === "string" && typeof s.brief === "string").slice(0, MAX_ROLES);
  } catch { return null; }
}
const DEFAULT_PIPELINE = [
  { role: "plan", brief: "Distill the <=10 priority rules from RULES.md, especially subtle ones the visible tests do not cover; write them to .harness/notes.md. Do not edit source." },
  { role: "implement", brief: "Implement the source to satisfy RULES.md and pass `npm test`; make the smallest correct change." },
  { role: "review", brief: "Re-run `npm test`, re-read RULES.md for uncovered rules, and fix any gap in the source. Do not invent a separate proxy test suite." },
];

// ---- Phase 2: execute the generated pipeline as fresh codex roles ----
function rolePrompt(caseDef, step, idx, total) {
  return [
    `Case: ${caseDef.id} - ${caseDef.title}. Generated-harness pipeline step ${idx + 1}/${total}, role "${step.role}".`,
    `ROLE BRIEF: ${step.brief}`,
    `Shared goal across the pipeline: implement ${caseDef.srcFile} so it satisfies every rule in RULES.md and passes \`npm test\`. Read RULES.md, the visible tests, ${caseDef.srcFile}, and any prior notes under .harness/. Do NOT edit anything under test/.`,
    `Ground truth is the project's REAL tests + the RULES.md prose - verify against those, never invent a separate proxy checklist to optimize. If you implement/fix, run \`npm test\` until it passes. If you review/verify, record findings in .harness/notes.md and fix gaps in ${caseDef.srcFile}.`,
  ].join("\n");
}
function runHarness(caseDef) {
  const gcwd = writeFixture(caseDef, "design");
  copySkillRef(gcwd);
  fs.mkdirSync(path.join(gcwd, ".harness"), { recursive: true });
  const designCost = codexCall(caseDef, "harness", "design", gcwd, designPrompt(caseDef));
  const designed = readPipeline(gcwd);
  const pipeline = designed || DEFAULT_PIPELINE;

  const cwd = writeFixture(caseDef, "harness");
  fs.mkdirSync(path.join(cwd, ".harness"), { recursive: true });
  // carry over the generated notes/pipeline if any
  if (fs.existsSync(path.join(gcwd, ".harness"))) fs.cpSync(path.join(gcwd, ".harness"), path.join(cwd, ".harness"), { recursive: true });

  const costs = [designCost];
  pipeline.forEach((step, i) => {
    costs.push(codexCall(caseDef, "harness", `s${i + 1}-${step.role}`.replace(/[^a-z0-9-]/gi, ""), cwd, rolePrompt(caseDef, step, i, pipeline.length)));
  });

  fs.rmSync(path.join(cwd, ".harness"), { recursive: true, force: true });
  fs.rmSync(path.join(cwd, "skill-ref"), { recursive: true, force: true });
  for (const f of fs.readdirSync(path.join(cwd, "test"))) {
    if (f !== path.basename(caseDef.visibleTest)) fs.rmSync(path.join(cwd, "test", f), { force: true });
  }
  const cost = sumCost(costs);
  cost.design_ok = !!designed;
  cost.pipeline = pipeline.map((s) => s.role);
  return { cwd, cost };
}

// ---- scoring (identical to fanout / v2) ----
function escapeRegex(v) { return v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function extractTestNames(file) {
  if (!fs.existsSync(file)) return [];
  const t = fs.readFileSync(file, "utf8"); const re = /\btest\(\s*(['"`])(.+?)\1/g; const o = []; let m;
  while ((m = re.exec(t))) o.push(m[2]);
  return o;
}
function runNamedTest(cwd, name) {
  const r = spawnSync("node", ["--test", "--test-name-pattern", `^${escapeRegex(name)}$`], { cwd, encoding: "utf8", timeout: 120000 });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  return r.status === 0 && /# pass [1-9]/.test(out) && /# fail 0\b/.test(out);
}
function granularChecks(caseDef, cwd) {
  const named = [
    ...extractTestNames(path.join(cwd, caseDef.visibleTest)).map((n) => ({ name: n, kind: "visible" })),
    ...extractTestNames(path.join(cwd, caseDef.hiddenTest)).map((n) => ({ name: n, kind: "hidden" })),
  ];
  return named.map((t) => ({ name: `${t.kind}: ${t.name}`, kind: t.kind, status: runNamedTest(cwd, t.name) ? "pass" : "fail" }));
}
function listFiles(d) {
  if (!fs.existsSync(d)) return [];
  const o = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) o.push(...listFiles(f)); else o.push(f); }
  return o;
}
function scoreQuality(cwd, granular) {
  const sourceFiles = listFiles(path.join(cwd, "src")).filter((f) => f.endsWith(".mjs"));
  const testText = listFiles(path.join(cwd, "test")).filter((f) => f.endsWith(".mjs") && !f.includes(".hidden.")).map((f) => fs.readFileSync(f, "utf8")).join("\n");
  const sourceText = sourceFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  const sourceLines = sourceText ? sourceText.split(/\n/).length : 0;
  const total = granular.length || 1;
  const passed = granular.filter((c) => c.status === "pass").length;
  const frac = passed / total;
  const allPass = passed === total && granular.length > 0;
  const assertions = (testText.match(/\bassert\b/g) || []).length;
  const hasValidation = /throw |try\s*\{|TypeError|Error\(/.test(sourceText);
  const hasTry = /\btry\s*\{/.test(sourceText);
  const hasComments = (sourceText.match(/\/\//g) || []).length >= 2;
  const hasReadme = fs.existsSync(path.join(cwd, "README.md"));
  const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
  const deps = Object.keys(pkg.dependencies || {}).length;
  const round = (v) => Math.max(0, Math.min(10, Math.round(v)));
  let cq = 10; if (/TODO|console\.log/.test(sourceText)) cq -= 3; if (sourceLines > 900) cq -= 2; else if (sourceLines > 600) cq -= 1; cq = Math.max(0, cq);
  const dims = {
    feature_completeness: allPass ? 10 : round(3 + 6 * frac),
    test_coverage: assertions >= 24 ? 10 : assertions >= 12 ? 8 : assertions >= 6 ? 6 : 4,
    code_quality: cq,
    error_handling: hasValidation ? (hasTry ? 10 : 9) : 6,
    efficiency: deps === 0 ? 10 : 7,
    correctness: round(10 * frac),
    architecture: sourceFiles.length >= 3 ? 10 : sourceFiles.length === 2 ? 8 : 6,
    extensibility: sourceFiles.length >= 2 ? 9 : 7,
    documentation: hasReadme ? 10 : hasComments ? 7 : 4,
    dev_environment: pkg.scripts?.test ? 9 : 5,
  };
  return { total: Object.values(dims).reduce((s, n) => s + n, 0), pass_fraction: Number(frac.toFixed(3)), checks_passed: passed, checks_total: total, dimensions: dims };
}
function scoreArm(caseDef, cwd, cost) {
  injectHiddenTest(caseDef, cwd);
  const granular = granularChecks(caseDef, cwd);
  return { cost, granular, quality: scoreQuality(cwd, granular) };
}
function avg(ns) { return ns.length ? Math.round((ns.reduce((s, n) => s + n, 0) / ns.length) * 1000) / 1000 : 0; }

function main() {
  ensureCleanDir(path.join(EXP, "raw"));
  ensureCleanDir(path.join(RUN_ROOT, "sandboxes"));
  const results = {};
  for (const caseDef of cases) {
    const bcwd = writeFixture(caseDef, "baseline");
    const bcost = codexCall(caseDef, "baseline", "run", bcwd, baselinePrompt(caseDef));
    bcost.roles = [{ label: "run", tokens: bcost.tokens, duration_ms: bcost.duration_ms, crashed: bcost.crashed }];
    const baseline = scoreArm(caseDef, bcwd, bcost);
    const h = runHarness(caseDef);
    const harness = scoreArm(caseDef, h.cwd, h.cost);
    results[caseDef.id] = { baseline, harness };
  }
  const perCase = cases.map((c) => {
    const b = results[c.id].baseline, h = results[c.id].harness;
    return {
      id: c.id,
      baseline: { score: b.quality.total, passed: b.quality.checks_passed, total: b.quality.checks_total, crashed: b.cost.crashed, tokens: b.cost.tokens, duration_ms: b.cost.duration_ms },
      harness: { score: h.quality.total, passed: h.quality.checks_passed, total: h.quality.checks_total, crashed: h.cost.crashed, tokens: h.cost.tokens, duration_ms: h.cost.duration_ms, design_ok: h.cost.design_ok, pipeline: h.cost.pipeline, roles: h.cost.roles },
    };
  });
  const aggregate = {
    baseline_avg_score: avg(perCase.map((c) => c.baseline.score)),
    harness_avg_score: avg(perCase.map((c) => c.harness.score)),
    baseline_avg_passfrac: avg(perCase.map((c) => c.baseline.passed / c.baseline.total)),
    harness_avg_passfrac: avg(perCase.map((c) => c.harness.passed / c.harness.total)),
    baseline_avg_tokens: Math.round(avg(perCase.map((c) => c.baseline.tokens))),
    harness_avg_tokens: Math.round(avg(perCase.map((c) => c.harness.tokens))),
    baseline_crashes: perCase.filter((c) => c.baseline.crashed).length,
    harness_crashes: perCase.filter((c) => c.harness.crashed).length,
  };
  const out = { runtime_adapter: `codex-exec-harnessmake:${MODEL}:reasoning-${EFFORT}`, mode: "HARNESS-MAKE-designed role pipeline vs no-harness", per_case: perCase, aggregate, cases: results };
  writeFile(path.join(EXP, "result.json"), `${JSON.stringify(out, null, 2)}\n`);
  console.log(JSON.stringify({ per_case: perCase, aggregate, adapter: out.runtime_adapter }, null, 2));
}
main();
