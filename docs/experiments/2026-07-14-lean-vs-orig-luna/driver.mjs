#!/usr/bin/env node
// Per-pass A/B arm driver for the ORIG-vs-LEAN supergoal harness eval.
// Reuses the repo's runner (templates/harness-eval-runner.mjs) for the
// codex-exec adapter (crash detection, token/turn parse, timeout kill).
// One invocation = one role pass, so the conductor stays alive per call.
//
//   node driver.mjs pass --arm orig --name p1 --role pass1-frame-build.md \
//     --app <dir> --vault <dir> --instruction <file> --prompts <dir> \
//     --out <dir> [--preflight yes|no]
//   node driver.mjs capture --app <dir> --out <dir> --base <sha>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { selectAdapter, ADAPTERS } from "/Users/danny/Documents/PARA/Resource/supergoal-skill/templates/harness-eval-runner.mjs";

const mode = process.argv[2];
const args = {};
for (let i = 3; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);

function loadRecord(out, init) {
  const p = path.join(out, "arm-result.json");
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  return init;
}
function saveRecord(out, record) {
  fs.writeFileSync(path.join(out, "arm-result.json"), JSON.stringify(record, null, 2));
}

if (mode === "pass") {
  const { arm, name, role, app, vault, instruction, prompts, out } = args;
  fs.mkdirSync(out, { recursive: true });
  fs.mkdirSync(vault, { recursive: true });
  const record = loadRecord(out, {
    arm,
    app, vault,
    model: process.env.SG_CODEX_MODEL,
    effort: process.env.SG_CODEX_EFFORT,
    timeout_ms: Number(process.env.SG_TIMEOUT_MS || 0),
    retries_allowed: Number(process.env.SG_RETRIES ?? 2),
    started_at: new Date().toISOString(),
    adapter: "codex-exec",
    preflight: null,
    passes: [],
  });

  let adapter;
  if ((args.preflight || "no") === "yes") {
    const sel = await selectAdapter("codex-exec");
    record.preflight = { at: new Date().toISOString(), ...sel.preflights };
    adapter = sel.adapter;
  } else {
    adapter = ADAPTERS["codex-exec"];
    if (!record.preflight) record.preflight = { reused: "host preflight passed earlier this session (edit ok, tests pass); not re-spent" };
  }

  const preamble = fs.readFileSync(path.join(SCRIPT_DIR, "prompts", "preamble.md"), "utf8");
  const roleText = fs.readFileSync(path.join(prompts, role), "utf8");
  const prompt = (preamble + "\n" + roleText)
    .replaceAll("{{APP}}", app)
    .replaceAll("{{VAULT}}", vault)
    .replaceAll("{{INSTRUCTION}}", fs.readFileSync(instruction, "utf8"));
  fs.writeFileSync(path.join(out, `${name}.prompt.md`), prompt);

  console.log(`[driver] pass ${name} starting at ${new Date().toISOString()}`);
  const res = await adapter.run(app, prompt, {});
  record.passes.push({ name, role_file: role, at: new Date().toISOString(), ...res });
  saveRecord(out, record);
  console.log(`[driver] pass ${name} done: crashed=${res.crashed} reason=${res.reason || "-"} tokens=${res.tokens} turns=${res.turns} retries=${res.retries} duration_ms=${res.duration_ms}`);
} else if (mode === "capture") {
  const { app, out, base } = args;
  const record = loadRecord(out, null);
  if (!record) { console.error("no arm-result.json"); process.exit(2); }
  const git = (...a) => execFileSync("git", ["-C", app, ...a], { encoding: "utf8" });
  try {
    fs.appendFileSync(path.join(app, ".git", "info", "exclude"), "\n.gocache/\nsg-vault/\n");
    git("add", "-A");
    const dirty = git("status", "--porcelain").trim();
    if (dirty) git("commit", "-q", "-m", "sg-eval: capture uncommitted working tree state");
    record.capture_commit_needed = Boolean(dirty);
    const patch = git("diff", "--binary", `${base}..HEAD`);
    fs.writeFileSync(path.join(out, "model.patch"), patch);
    record.patch_bytes = Buffer.byteLength(patch);
    record.head = git("rev-parse", "HEAD").trim();
    record.branch = git("branch", "--show-current").trim();
  } catch (e) {
    record.capture_error = String(e.message || e);
  }
  record.finished_at = new Date().toISOString();
  record.total_pass_duration_ms = record.passes.reduce((s, p) => s + (p.duration_ms || 0), 0);
  record.total_tokens = record.passes.reduce((s, p) => s + (p.tokens || 0), 0);
  saveRecord(out, record);
  console.log(`[driver] capture done: passes=${record.passes.length} patch_bytes=${record.patch_bytes ?? "n/a"} total_tokens=${record.total_tokens} total_pass_duration_ms=${record.total_pass_duration_ms}`);
} else {
  console.error("usage: driver.mjs pass|capture ...");
  process.exit(2);
}
