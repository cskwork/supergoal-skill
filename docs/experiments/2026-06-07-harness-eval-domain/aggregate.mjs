#!/usr/bin/env node
// Combine the 2 domain cases (this dir) with case-015 (spark-high v2 Exp B) and print
// per-case + domain-only average + 3-case average for baseline vs harness.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const domain = JSON.parse(fs.readFileSync(path.join(EXP, "result.json"), "utf8"));
const lspPath = path.join(EXP, "..", "2026-06-06-harness-eval-spark-high-lsp-v2", "result-experimentB-live.json");

const rows = [];
for (const c of domain.per_case) {
  rows.push({
    id: c.id,
    domain: true,
    b: { score: c.baseline.score, frac: c.baseline.passed / c.baseline.total, crashed: c.baseline.crashed, tok: c.baseline.tokens },
    h: { score: c.harness.score, frac: c.harness.passed / c.harness.total, crashed: c.harness.crashed, tok: c.harness.tokens },
  });
}
if (fs.existsSync(lspPath)) {
  const lsp = JSON.parse(fs.readFileSync(lspPath, "utf8"));
  const c = lsp.cases["revfactory-case-015-lsp"];
  rows.push({
    id: "case-015-lsp (algorithmic)",
    domain: false,
    b: { score: c.baseline.quality.total, frac: c.baseline.quality.pass_fraction, crashed: c.baseline.codex.cost.crashed, tok: c.baseline.codex.cost.tokens },
    h: { score: c.harness.quality.total, frac: c.harness.quality.pass_fraction, crashed: c.harness.codex.cost.crashed, tok: c.harness.codex.cost.tokens },
  });
}

const avg = (ns) => (ns.length ? ns.reduce((s, n) => s + n, 0) / ns.length : 0);
const r1 = (n) => Math.round(n * 10) / 10;
const r3 = (n) => Math.round(n * 1000) / 1000;

function summary(label, set) {
  return {
    group: label,
    n: set.length,
    baseline_avg_score: r1(avg(set.map((x) => x.b.score))),
    harness_avg_score: r1(avg(set.map((x) => x.h.score))),
    baseline_avg_passfrac: r3(avg(set.map((x) => x.b.frac))),
    harness_avg_passfrac: r3(avg(set.map((x) => x.h.frac))),
    baseline_crashes: set.filter((x) => x.b.crashed).length,
    harness_crashes: set.filter((x) => x.h.crashed).length,
  };
}

console.log("PER-CASE");
for (const x of rows) {
  console.log(
    `  ${x.id.padEnd(28)} baseline ${x.b.score}/${r3(x.b.frac)}${x.b.crashed ? " CRASH" : ""}` +
    `   harness ${x.h.score}/${r3(x.h.frac)}${x.h.crashed ? " CRASH" : ""}`
  );
}
const domainSet = rows.filter((x) => x.domain);
console.log("\nDOMAIN-ONLY AVERAGE (the 2 new cases):");
console.log(" ", JSON.stringify(summary("domain", domainSet)));
console.log("\nALL-CASES AVERAGE (domain + case-015):");
console.log(" ", JSON.stringify(summary("all", rows)));
