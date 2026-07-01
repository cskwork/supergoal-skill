#!/usr/bin/env node
// Paired significance on hidden-pass deltas, per arXiv 2511.19794:
// declare a win ONLY when the BCa bootstrap 95% CI is entirely > 0 AND the
// sign-flip permutation p < 0.05. For small n the permutation test is exact
// (enumerate all 2^n sign flips) and BCa is flagged as low-confidence.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || path.join(EXP, "result.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));

// per-seed hidden_pass per arm, ordered by seed
const bySeed = {};
for (const row of data.per_seed) (bySeed[row.arm] ||= []).push(row);
function series(arm) {
  const rows = (bySeed[arm] || []).slice().sort((a, b) => a.seed - b.seed);
  return rows.map((r) => Number(String(r.hidden).split("/")[0]));
}

function mean(a) { return a.reduce((s, x) => s + x, 0) / a.length; }

// sign-flip permutation on paired deltas (exact for n<=20)
function permP(deltas) {
  const n = deltas.length, obs = Math.abs(mean(deltas));
  let ge = 0, total = 1 << n;
  for (let mask = 0; mask < total; mask++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += (mask & (1 << i)) ? -deltas[i] : deltas[i];
    if (Math.abs(s / n) >= obs - 1e-12) ge++;
  }
  return ge / total;
}

// BCa bootstrap CI (95%) on the mean of paired deltas
function bcaCI(deltas, B = 20000) {
  const n = deltas.length, theta = mean(deltas);
  // bootstrap
  const boots = [];
  let rng = 12345;
  const rand = () => { rng = (rng * 1103515245 + 12345) & 0x7fffffff; return rng / 0x7fffffff; };
  for (let b = 0; b < B; b++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += deltas[Math.floor(rand() * n)];
    boots.push(s / n);
  }
  boots.sort((a, b) => a - b);
  const propLess = boots.filter((x) => x < theta).length / B;
  const z0 = invNorm(Math.min(0.9999, Math.max(0.0001, propLess)));
  // acceleration via jackknife
  const jack = [];
  for (let i = 0; i < n; i++) jack.push(mean(deltas.filter((_, j) => j !== i)));
  const jbar = mean(jack);
  const num = jack.reduce((s, x) => s + Math.pow(jbar - x, 3), 0);
  const den = 6 * Math.pow(jack.reduce((s, x) => s + Math.pow(jbar - x, 2), 0), 1.5);
  const a = den === 0 ? 0 : num / den;
  const zA = invNorm(0.025), zB = invNorm(0.975);
  const adj = (z) => normCdf(z0 + (z0 + z) / (1 - a * (z0 + z)));
  const lo = quantile(boots, adj(zA)), hi = quantile(boots, adj(zB));
  return { lo, hi, theta };
}
function quantile(sorted, p) { const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length))); return sorted[idx]; }
function normCdf(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
function invNorm(p) { // Beasley-Springer-Moro
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const pl = 0.02425;
  if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p <= 1 - pl) { const q = p - 0.5, r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

function compare(a, b) {
  const A = series(a), B = series(b);
  const n = Math.min(A.length, B.length);
  const deltas = Array.from({ length: n }, (_, i) => A[i] - B[i]);
  if (n < 2 || deltas.every((d) => d === deltas[0])) {
    return { pair: `${a}-vs-${b}`, n, deltas, mean_delta: n ? mean(deltas) : 0, note: n < 2 ? "n<2: no test" : "degenerate (all deltas equal)" };
  }
  const p = permP(deltas);
  const { lo, hi } = bcaCI(deltas);
  const win = lo > 0 && p < 0.05;
  return { pair: `${a}-vs-${b}`, n, deltas, mean_delta: round(mean(deltas)), bca95: [round(lo), round(hi)], perm_p: round(p), significant_win: win, low_confidence: n < 5 };
}
function round(n) { return Math.round(n * 1000) / 1000; }

const arms = Object.keys(data.arms || {});
const target = arms.includes("harness_v2") ? "harness_v2" : arms[arms.length - 1];
const comparisons = arms.filter((x) => x !== target).map((x) => compare(target, x));
const out = {
  case: data.case, model: data.model, seeds: data.seeds,
  hidden_pass_avg: Object.fromEntries(arms.map((x) => [x, data.arms[x].hidden_pass_avg])),
  false_green: Object.fromEntries(arms.map((x) => [x, data.arms[x].false_green_count])),
  cost_usd_avg: Object.fromEntries(arms.map((x) => [x, data.arms[x].cost_usd_avg])),
  comparisons,
  decision_rule: "win iff BCa 95% CI entirely > 0 AND sign-flip permutation p < 0.05 (arXiv 2511.19794)",
};
console.log(JSON.stringify(out, null, 2));
