#!/usr/bin/env node
// Option B: REAL fan-out eval. The eval script is the Conductor; each role is a fresh `codex exec`
// (clean context) sharing the sandbox via .vault/ files. This is what single-process codex could not
// do. Harness arm = plan (analyst) -> build (executor) -> adversarial verify (verifier, derives spec
// checks) -> repair (executor). Baseline arm = one codex pass. Both scored with the v2 scorer + the
// injected hidden tests.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(EXP, "../../..");
const FIXTURES = path.join(EXP, "fixtures");
const RUN_ROOT = process.env.SG_EVAL_RUN_ROOT || "/tmp/sg-fanout-eval";
const MODEL = process.env.SG_EVAL_MODEL || "gpt-5.3-codex-spark";
const EFFORT = process.env.SG_EVAL_EFFORT || "high";
const EFFORT_CONFIG = `model_reasoning_effort="${EFFORT}"`;
const TIMEOUT_MS = Number(process.env.SG_EVAL_TIMEOUT_MS || 720000);
const ONLY = process.env.SG_EVAL_ONLY || ""; // comma-separated case ids to run

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

function copyHarnessRef() {
  const ref = path.join(RUN_ROOT, "harness-ref");
  ensureCleanDir(ref);
  for (const name of ["SKILL.md", "README.md", "reference", "agents", "templates"]) {
    const source = path.join(ROOT, name);
    if (!fs.existsSync(source)) continue;
    fs.cpSync(source, path.join(ref, name), { recursive: true, filter: (p) => !p.split(path.sep).includes("harness-eval-cases") });
  }
  return ref;
}
function persona(harnessRef, role) {
  const f = path.join(harnessRef, "agents", `${role}.md`);
  // Strip YAML frontmatter (a leading "---" makes codex treat the prompt arg as a flag) and lead
  // with a safe non-dash header so the prompt is always parsed as a positional argument.
  const body = fs.existsSync(f) ? fs.readFileSync(f, "utf8").replace(/^---\n[\s\S]*?\n---\n/, "").trim() : "";
  return `ROLE BRIEF (act as this persona):\n${body}`;
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
    try {
      const e = JSON.parse(line);
      if (e.type === "turn.completed" && e.usage) { turns += 1; tokens = e.usage.total_tokens ?? ((e.usage.input_tokens || 0) + (e.usage.output_tokens || 0)); }
    } catch { /* status lines */ }
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

// ---- Baseline: one pass ----
function baselinePrompt(caseDef) {
  return [
    `Case: ${caseDef.id} (${caseDef.difficulty}) - ${caseDef.title}`,
    `Read RULES.md, ${caseDef.srcFile} (the stub), and the visible tests under test/. Implement ${caseDef.srcFile} to satisfy EVERY rule in RULES.md (the visible tests don't cover them all). Run \`npm test\` until tests pass.`,
    "Condition: baseline without harness. Do not use supergoal, harness docs, role packs, or workflow skills.",
  ].join("\n");
}

// ---- Harness: orchestrated fan-out (fresh codex per role, shared .vault) ----
function runHarness(caseDef, harnessRef) {
  const cwd = writeFixture(caseDef, "harness");
  fs.mkdirSync(path.join(cwd, ".vault"), { recursive: true });
  const costs = [];

  const plan = [
    persona(harnessRef, "analyst"),
    "",
    `TASK: plan only - do NOT write or edit any code or tests.`,
    `Read RULES.md (the spec), ${caseDef.srcFile} (the stub), and the visible tests under test/.`,
    `Write .vault/plan.md with: (1) the <=10 priority rules from RULES.md the implementation MUST satisfy, ESPECIALLY subtle ones the visible tests do not cover; (2) a short build checklist. Keep it under ~40 lines.`,
  ].join("\n");
  costs.push(codexCall(caseDef, "harness", "plan", cwd, plan));

  const build = [
    persona(harnessRef, "executor"),
    "",
    `TASK: implement ${caseDef.srcFile} to satisfy .vault/plan.md and RULES.md. Read .vault/plan.md first.`,
    `Make the smallest correct implementation. Run \`npm test\` until the visible tests pass. Do not edit files under test/. Do not touch .vault/.`,
  ].join("\n");
  costs.push(codexCall(caseDef, "harness", "build", cwd, build));

  const verify = [
    persona(harnessRef, "verifier"),
    "",
    `TASK: adversarial verification. Do NOT edit ${caseDef.srcFile} or anything under test/.`,
    `Read RULES.md (the spec) and the current ${caseDef.srcFile}. Independently derive concrete check cases for EVERY rule in RULES.md - especially the subtle rules the visible tests do not cover.`,
    `Write an executable script .vault/checks.mjs that imports the implementation (e.g. import ... from '../${caseDef.srcFile}') and asserts each rule with specific inputs/outputs using node:assert. Then run \`node .vault/checks.mjs\`.`,
    `Write .vault/verification.md: for each rule list PASS or FAIL (RED) with the failing input. List every RED explicitly. If checks.mjs throws, that is a RED.`,
  ].join("\n");
  costs.push(codexCall(caseDef, "harness", "verify", cwd, verify));

  const vfile = path.join(cwd, ".vault", "verification.md");
  const hasRed = fs.existsSync(vfile) && /\b(FAIL|RED)\b/i.test(fs.readFileSync(vfile, "utf8"));
  if (hasRed) {
    const repair = [
      persona(harnessRef, "executor"),
      "",
      `TASK: repair. Read .vault/verification.md and .vault/checks.mjs. For every RED, fix ${caseDef.srcFile} so the rule holds.`,
      `Do not weaken the checks or the tests. Re-run \`node .vault/checks.mjs\` and \`npm test\` until both pass. Do not edit files under test/.`,
    ].join("\n");
    costs.push(codexCall(caseDef, "harness", "repair", cwd, repair));
  }

  // Clean orchestration scratch so scoring sees only src + canonical tests.
  fs.rmSync(path.join(cwd, ".vault"), { recursive: true, force: true });
  for (const f of fs.readdirSync(path.join(cwd, "test"))) {
    if (f !== path.basename(caseDef.visibleTest)) fs.rmSync(path.join(cwd, "test", f), { force: true });
  }
  return { cwd, cost: sumCost(costs) };
}

// ---- scoring (v2, domain-agnostic) ----
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
  const harnessRef = copyHarnessRef();
  const results = {};
  for (const caseDef of cases) {
    const bcwd = writeFixture(caseDef, "baseline");
    const bcost = codexCall(caseDef, "baseline", "run", bcwd, baselinePrompt(caseDef));
    bcost.roles = [{ label: "run", tokens: bcost.tokens, duration_ms: bcost.duration_ms, crashed: bcost.crashed }];
    const baseline = scoreArm(caseDef, bcwd, bcost);
    const h = runHarness(caseDef, harnessRef);
    const harness = scoreArm(caseDef, h.cwd, h.cost);
    results[caseDef.id] = { baseline, harness };
  }

  const perCase = cases.map((c) => {
    const b = results[c.id].baseline, h = results[c.id].harness;
    return {
      id: c.id,
      baseline: { score: b.quality.total, passed: b.quality.checks_passed, total: b.quality.checks_total, crashed: b.cost.crashed, tokens: b.cost.tokens, duration_ms: b.cost.duration_ms },
      harness: { score: h.quality.total, passed: h.quality.checks_passed, total: h.quality.checks_total, crashed: h.cost.crashed, tokens: h.cost.tokens, duration_ms: h.cost.duration_ms, roles: h.cost.roles },
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
  const out = { runtime_adapter: `codex-exec-orchestrated:${MODEL}:reasoning-${EFFORT}`, mode: "fan-out (fresh codex per role)", per_case: perCase, aggregate, cases: results };
  writeFile(path.join(EXP, "result.json"), `${JSON.stringify(out, null, 2)}\n`);
  console.log(JSON.stringify({ per_case: perCase, aggregate, adapter: out.runtime_adapter }, null, 2));
}

main();
