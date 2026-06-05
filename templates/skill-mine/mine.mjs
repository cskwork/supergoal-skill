#!/usr/bin/env node
// Mechanical miner for SKILL-MINE mode.
// Reads Claude Code JSONL transcripts, picks an adaptive 7-30d window, and emits
// frequent tool-call n-grams + Bash command signatures + per-session intent hints.
// The mechanical part (frequency) lives here; semantic clustering/naming is the agent's job.
// Pure Node, no external deps. Output: one JSON object on stdout.
//
// Usage: node mine.mjs [--repo <slug>] [--all] [--days <n>] [--minsup <0..1>]
//                      [--base <dir>] [--ngram-min 2] [--ngram-max 4] [--top 40]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function parseArgs(argv) {
  const a = { minsup: 0.2, ngramMin: 2, ngramMax: 4, top: 40, all: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--all") a.all = true;
    else if (k === "--repo") a.repo = argv[++i];
    else if (k === "--days") a.days = Number(argv[++i]);
    else if (k === "--minsup") a.minsup = Number(argv[++i]);
    else if (k === "--base") a.base = argv[++i];
    else if (k === "--ngram-min") a.ngramMin = Number(argv[++i]);
    else if (k === "--ngram-max") a.ngramMax = Number(argv[++i]);
    else if (k === "--top") a.top = Number(argv[++i]);
  }
  return a;
}

// Claude Code derives a project dir name by replacing "/" and "." with "-".
function deriveSlug(cwd) {
  return cwd.replace(/[/.]/g, "-");
}

function listSessionFiles(base, slug, all) {
  if (all) {
    const out = [];
    for (const d of safeReaddir(base)) {
      const dir = path.join(base, d);
      if (!isDir(dir)) continue;
      for (const f of safeReaddir(dir)) if (f.endsWith(".jsonl")) out.push(path.join(dir, f));
    }
    return out;
  }
  const dir = path.join(base, slug);
  return safeReaddir(dir).filter((f) => f.endsWith(".jsonl")).map((f) => path.join(dir, f));
}

function safeReaddir(p) { try { return fs.readdirSync(p); } catch { return []; } }
function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function ageDays(file) { return (Date.now() - fs.statSync(file).mtimeMs) / 86400000; }

// Collapse a Bash command into a stable signature: verb (+ subcommand or script basename).
function normalizeBash(cmd) {
  if (typeof cmd !== "string") return null;
  const first = cmd.split(/&&|\|\||\||;|\n/)[0].trim();
  const toks = first.replace(/^\(?\s*/, "").split(/\s+/).filter(Boolean);
  if (!toks.length) return null;
  let verb = toks[0].replace(/^\.\//, "");
  if (verb === "sudo" || verb === "env" || verb === "time") { toks.shift(); verb = (toks[0] || "").replace(/^\.\//, ""); }
  // Pure-noise shell builtins carry no procedure signal; drop so concrete tools (git/gh/node) surface.
  const noise = new Set(["echo", "cd", "ls", "pwd", "cat", "true", "false", "set", "export", "printf"]);
  if (noise.has(verb)) return null;
  const runners = new Set(["node", "python3", "python", "npx", "bun", "deno", "bash", "sh", "ts-node", "tsx"]);
  const subcmd = new Set(["git", "npm", "yarn", "pnpm", "cargo", "go", "docker", "gh", "kubectl", "make", "pip", "pip3"]);
  if (runners.has(verb) && toks[1]) return `${verb} ${path.basename(toks[1]).replace(/['"]/g, "")}`;
  if (subcmd.has(verb) && toks[1] && /^[a-z]/i.test(toks[1])) return `${verb} ${toks[1]}`;
  return verb;
}

function firstTextOf(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    for (const b of content) if (b && b.type === "text" && typeof b.text === "string") return b.text;
  }
  return null;
}

// Pull the per-session signal the miner needs out of one transcript file.
function extractSession(file) {
  const id = path.basename(file, ".jsonl");
  const s = { id, ts: null, tools: [], bash: [], skills: [], firstPrompt: null, branch: null };
  let lines = [];
  try { lines = fs.readFileSync(file, "utf8").split("\n"); } catch { return s; }
  for (const line of lines) {
    if (!line) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (!s.ts && o.timestamp) s.ts = o.timestamp;
    if (!s.branch && o.gitBranch) s.branch = o.gitBranch;
    if (o.attributionSkill) s.skills.push(o.attributionSkill);
    const msg = o.message || {};
    if (o.type === "user" && !s.firstPrompt) {
      const t = firstTextOf(msg.content);
      if (t && !t.startsWith("<") && t.length > 8) s.firstPrompt = t.slice(0, 240);
    }
    const content = msg.content;
    if (!Array.isArray(content)) continue;
    for (const b of content) {
      if (!b || b.type !== "tool_use") continue;
      s.tools.push(b.name);
      if (b.name === "Bash") { const sig = normalizeBash(b.input?.command); if (sig) s.bash.push(sig); }
      if (b.name === "Skill") { const sk = b.input?.skill || b.input?.command; if (sk) s.skills.push(sk); }
    }
  }
  return s;
}

function ngrams(seq, n) {
  const out = [];
  for (let i = 0; i + n <= seq.length; i++) out.push(seq.slice(i, i + n).join(" > "));
  return out;
}

// Support = fraction of sessions that contain the pattern at least once.
function mineSupport(sessions, keyFn) {
  const sessionsWith = new Map();
  const totalCount = new Map();
  for (const s of sessions) {
    const keys = keyFn(s);
    const seen = new Set();
    for (const k of keys) {
      totalCount.set(k, (totalCount.get(k) || 0) + 1);
      if (!seen.has(k)) { seen.add(k); sessionsWith.set(k, (sessionsWith.get(k) || 0) + 1); }
    }
  }
  return { sessionsWith, totalCount };
}

function rank(map, total, minsup, top) {
  const { sessionsWith, totalCount } = map;
  const rows = [];
  for (const [k, sess] of sessionsWith) {
    const support = sess / total;
    if (support < minsup) continue;
    rows.push({ pattern: k, support: +support.toFixed(3), sessions: sess, count: totalCount.get(k) });
  }
  rows.sort((a, b) => b.sessions - a.sessions || b.count - a.count);
  return rows.slice(0, top);
}

function chooseWindow(files, override) {
  if (override) return { days: override, rationale: `override --days ${override}` };
  // Widen until the window holds enough signal; active repos satisfy 7d immediately.
  for (const days of [7, 14, 30]) {
    const inWin = files.filter((f) => ageDays(f) <= days);
    if (inWin.length >= 3 && days < 30) return { days, rationale: `>=3 sessions within ${days}d`, inWin };
    if (days === 30) return { days, rationale: `widened to max 30d (sparse history)`, inWin };
  }
  return { days: 7, rationale: "default" };
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  const base = a.base || path.join(os.homedir(), ".claude", "projects");
  const slug = a.repo || deriveSlug(process.cwd());
  const allFiles = listSessionFiles(base, slug, a.all);
  const win = chooseWindow(allFiles, a.days);
  const files = allFiles.filter((f) => ageDays(f) <= win.days);
  const sessions = files.map(extractSession);
  const totalCalls = sessions.reduce((n, s) => n + s.tools.length, 0);

  const ngramRows = [];
  for (let n = a.ngramMin; n <= a.ngramMax; n++) {
    const m = mineSupport(sessions, (s) => ngrams(s.tools, n));
    for (const r of rank(m, sessions.length || 1, a.minsup, a.top)) ngramRows.push({ n, ...r });
  }
  ngramRows.sort((x, y) => y.sessions - x.sessions || y.count - x.count);

  const bash = rank(mineSupport(sessions, (s) => s.bash), sessions.length || 1, a.minsup, a.top);
  const skillUse = rank(mineSupport(sessions, (s) => s.skills), sessions.length || 1, 0, 50);
  const intents = sessions
    .filter((s) => s.firstPrompt)
    .map((s) => ({ session: s.id, ts: s.ts, branch: s.branch, prompt: s.firstPrompt, topTools: s.tools.slice(0, 6) }));

  process.stdout.write(JSON.stringify({
    repo: a.all ? "ALL" : slug,
    base,
    window: { days: win.days, rationale: win.rationale },
    scanned: { sessionsInWindow: files.length, totalSessions: allFiles.length, toolCalls: totalCalls },
    minsup: a.minsup,
    alreadySkilled: skillUse.slice(0, 30),
    toolNgrams: ngramRows.slice(0, a.top),
    bashSignatures: bash,
    intentHints: intents.slice(0, 40),
  }, null, 2));
}

main();
