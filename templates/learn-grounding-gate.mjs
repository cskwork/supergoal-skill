#!/usr/bin/env node
// /supergoal LEARN-DOMAIN grounding gate.
// A learned .domain-agent/ pack must NOT be treated as trusted until this exits 0.
//
// Checks (research-grounded: static self-review does not predict accuracy, so load-bearing
// facts must carry an execution-grounded marker):
//   1. config.json parses and has lastUpdated.
//   2. index.md names at least one concrete entry point (no `<placeholder>`).
//   3. Every populated invariant block carries `Grounding: verified|unverified`.
//   4. Every flow file (flows/*.md except README) carries a `Grounding: verified|unverified` marker.
//   5. High-precision secret scan across the pack: no obvious credentials.
//
// Usage: node learn-grounding-gate.mjs <knowledgePath>
//   <knowledgePath>   the repo-local knowledge folder, default .domain-agent

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const knowledgePath = process.argv[2];

function fail(message) {
  console.error(`LEARN-GROUNDING-GATE FAIL: ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`  ok: ${message}`);
}

if (!knowledgePath) {
  console.error("usage: learn-grounding-gate.mjs <knowledgePath>");
  process.exit(2);
}

if (!existsSync(knowledgePath)) fail(`knowledge path not found: ${knowledgePath}`);

console.log("== /supergoal LEARN-DOMAIN grounding gate ==");
console.log(`pack: ${knowledgePath}`);

// 1. config.json
const configPath = join(knowledgePath, "config.json");
let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf8"));
} catch (err) {
  fail(`cannot read/parse ${configPath}: ${err.message}`);
}
if (!config.lastUpdated || /^<.*>$/.test(String(config.lastUpdated))) {
  fail("config.json lastUpdated is missing or still a placeholder");
}
ok("config.json present with lastUpdated");

// 2. index.md has a concrete entry point
const index = readPackFile("index.md");
const entryBody = sectionBody(index, "Common Entry Points");
if (!entryBody) fail("index.md missing 'Common Entry Points' section");
const concreteEntry = entryBody
  .split("\n")
  .filter((l) => /^\s*[-*]\s+\S/.test(l))
  .some((l) => !hasAngle(l));
if (!concreteEntry) fail("index.md 'Common Entry Points' has no concrete (non-placeholder) entry");
ok("index.md names a concrete entry point");

const GROUNDING = /Grounding:\s*(verified|unverified)\b/i;

// 3. invariants: every populated block under '## Rules' grounded
const invariants = readPackFile("invariants.md");
const rulesBody = sectionBody(invariants, "Rules");
if (!rulesBody) fail("invariants.md missing '## Rules' section");
const invBlocks = splitBlocks(rulesBody).filter((b) => !isPlaceholderHeading(b.heading));
if (invBlocks.length === 0) {
  fail("invariants.md has no populated invariant (still template placeholders)");
}
for (const block of invBlocks) {
  if (!GROUNDING.test(block.body)) {
    fail(`invariant '${block.heading}' missing 'Grounding: verified|unverified' marker`);
  }
}
ok(`${invBlocks.length} invariant(s) carry a grounding marker`);

// 4. each flow file grounded
const flowsDir = join(knowledgePath, "flows");
let flowFiles = [];
if (existsSync(flowsDir)) {
  flowFiles = readdirSync(flowsDir).filter(
    (f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md",
  );
}
if (flowFiles.length === 0) fail("no flows/*.md written (excluding README); deepen at least one context");
for (const file of flowFiles) {
  const body = readFileSync(join(flowsDir, file), "utf8");
  if (!GROUNDING.test(body)) fail(`flows/${file} missing 'Grounding: verified|unverified' marker`);
}
ok(`${flowFiles.length} flow file(s) carry a grounding marker`);

// 5. high-precision secret scan
const SECRET_PATTERNS = [
  [/-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/, "private key block"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key id"],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/, "GitHub token"],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, "Slack token"],
  [/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/, "Stripe-style secret key"],
];
for (const file of listMarkdown(knowledgePath)) {
  const text = readFileSync(file, "utf8");
  for (const [pattern, label] of SECRET_PATTERNS) {
    if (pattern.test(text)) fail(`possible ${label} found in ${file}; remove secrets from the pack`);
  }
}
ok("no obvious secrets in the pack");

console.log("== LEARN-GROUNDING GATE PASS ==");

function readPackFile(name) {
  const p = join(knowledgePath, name);
  try {
    return readFileSync(p, "utf8");
  } catch (err) {
    fail(`cannot read ${p}: ${err.message}`);
    return "";
  }
}

// Broad: any unfilled `<...>` span (used for entry-point bullets).
function hasAngle(text) {
  return /<[^>\n]+>/.test(text);
}

// Strict: the heading IS a template sentinel like `<invariant>`, not a real
// heading that merely contains a generic type such as `Queue<Message> rule`.
function isPlaceholderHeading(text) {
  return /^`?<[^>\n]+>`?$/.test(text.trim());
}

// Body of a `## Heading` section up to the next `## `.
function sectionBody(markdown, heading) {
  const pattern = new RegExp(`^## ${escapeRegExp(heading)}\\b.*$`, "im");
  const match = pattern.exec(markdown);
  if (!match) return "";
  const start = markdown.indexOf("\n", match.index);
  if (start === -1) return "";
  const rest = markdown.slice(start + 1);
  const next = rest.search(/^## /m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

// Split into `### Heading` blocks with their bodies.
function splitBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split("\n");
  let current = null;
  for (const line of lines) {
    const m = /^### (.+)$/.exec(line);
    if (m) {
      if (current) blocks.push(current);
      current = { heading: m[1].trim(), body: "" };
    } else if (current) {
      current.body += line + "\n";
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

function listMarkdown(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMarkdown(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
