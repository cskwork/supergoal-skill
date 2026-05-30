#!/usr/bin/env node
// /just-do-it Human Feedback gate.
// Build/Fix must NOT open until this exits 0.
//
// Usage: node human-feedback-gate.mjs <vault-dir> <Build|Fix>
//   <vault-dir>     the run's changelog folder
//   <Build|Fix>     implementation phase the human approved

import { readFileSync } from "node:fs";
import { join } from "node:path";

const [vaultDir, targetPhase] = process.argv.slice(2);

function fail(message) {
  console.error(`HUMAN-FEEDBACK-GATE FAIL: ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`  ok: ${message}`);
}

if (!vaultDir || !targetPhase || !["Build", "Fix"].includes(targetPhase)) {
  console.error("usage: human-feedback-gate.mjs <vault-dir> <Build|Fix>");
  process.exit(2);
}

const planPath = join(vaultDir, "plan.md");
const statePath = join(vaultDir, "state.json");

let plan;
let state;
try {
  plan = readFileSync(planPath, "utf8");
} catch (err) {
  fail(`cannot read ${planPath}: ${err.message}`);
}

try {
  state = JSON.parse(readFileSync(statePath, "utf8"));
} catch (err) {
  fail(`cannot read/parse ${statePath}: ${err.message}`);
}

console.log("== /just-do-it Human Feedback gate ==");
console.log(`vault: ${vaultDir}`);
console.log(`target: ${targetPhase}`);

const packet = topLevelSectionBody(plan, "Human Feedback");
if (!packet) fail("plan.md missing 'Human Feedback' section");

const requiredHeadings = [
  ["Plain-language brief", /^### Plain-language brief\b/im],
  ["Technical brief", /^### Technical brief\b/im],
  ["Terms", /^### Terms\b/im],
  ["Approval request", /^### Approval request\b/im],
];

for (const [name, pattern] of requiredHeadings) {
  if (!pattern.test(packet)) fail(`plan.md Human Feedback section missing '${name}' section`);
}

const plainIndex = packet.search(/^### Plain-language brief\b/im);
const technicalIndex = packet.search(/^### Technical brief\b/im);
if (plainIndex > technicalIndex) {
  fail("Plain-language brief must appear above Technical brief");
}
ok("Human Feedback packet sections present");

const plainBody = sectionBody(packet, "Plain-language brief");
const technicalBody = sectionBody(packet, "Technical brief");
const termsBody = sectionBody(packet, "Terms");

if (wordCount(plainBody) < 20) fail("Plain-language brief is too thin to review");
if (wordCount(technicalBody) < 30) fail("Technical brief is too thin to review");
if (!/^\s*[-*]\s+[^:\n]+:\s+\S+/m.test(termsBody)) {
  fail("Terms section must define at least one term as '- term: definition'");
}
ok("briefs contain reviewable content and term definitions");

const approval = state.approval;
if (!approval || approval.status !== "APPROVED") {
  fail("state.json approval.status is not APPROVED");
}
if (approval.phase !== targetPhase) {
  fail(`state.json approval.phase is '${approval.phase}', expected '${targetPhase}'`);
}
ok("human approval recorded for target phase");

console.log("== HUMAN FEEDBACK GATE PASS ==");

function topLevelSectionBody(markdown, heading) {
  const headingPattern = new RegExp(`^## ${escapeRegExp(heading)}\\b.*$`, "im");
  const headingMatch = headingPattern.exec(markdown);
  if (!headingMatch) return "";

  const bodyStart = markdown.indexOf("\n", headingMatch.index);
  if (bodyStart === -1) return "";

  const rest = markdown.slice(bodyStart + 1);
  const nextHeading = rest.search(/^## /m);
  return (nextHeading === -1 ? rest : rest.slice(0, nextHeading)).trim();
}

function sectionBody(markdown, heading) {
  const headingPattern = new RegExp(`^### ${escapeRegExp(heading)}\\b.*$`, "im");
  const headingMatch = headingPattern.exec(markdown);
  if (!headingMatch) return "";

  const bodyStart = markdown.indexOf("\n", headingMatch.index);
  if (bodyStart === -1) return "";

  const rest = markdown.slice(bodyStart + 1);
  const nextHeading = rest.search(/^#{2,3} /m);
  return (nextHeading === -1 ? rest : rest.slice(0, nextHeading)).trim();
}

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
