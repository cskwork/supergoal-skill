#!/usr/bin/env node
import fs from "node:fs";

const path = process.argv[2];
if (process.argv[1] && process.argv[1].endsWith("harness-eval-stats.mjs") && !path) {
  console.error("usage: node templates/harness-eval-stats.mjs <paired-results.json>");
  process.exit(2);
}

function exactMcnemarP(baselineOnly, harnessOnly) {
  const n = baselineOnly + harnessOnly;
  if (n === 0) return 1;
  const k = Math.min(baselineOnly, harnessOnly);
  let term = Math.pow(0.5, n);
  let sum = term;
  for (let i = 0; i < k; i += 1) {
    term *= (n - i) / (i + 1);
    sum += term;
  }
  return Math.min(1, 2 * sum);
}

export function pairedBinaryStats(pairs) {
  let baselineOnly = 0;
  let harnessOnly = 0;
  let matchedRemoved = 0;
  for (const pair of pairs) {
    const baseline = !!pair.baseline_pass;
    const harness = !!pair.harness_pass;
    if (baseline === harness) {
      matchedRemoved += 1;
    } else if (baseline) {
      baselineOnly += 1;
    } else {
      harnessOnly += 1;
    }
  }
  const p = exactMcnemarP(baselineOnly, harnessOnly);
  return {
    mcnemar: {
      discordant_baseline_only: baselineOnly,
      discordant_harness_only: harnessOnly,
      p,
      significant: p < 0.05,
    },
    snr_filter: {
      matched_removed: matchedRemoved,
      discordant_kept: baselineOnly + harnessOnly,
      rule: "remove no-signal matched pass/pass and fail/fail pairs before McNemar",
    },
  };
}

if (path) {
  let pairs;
  try {
    pairs = JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`HARNESS-EVAL-STATS FAIL: cannot read paired results: ${error.message}`);
    process.exit(2);
  }
  if (!Array.isArray(pairs)) {
    console.error("HARNESS-EVAL-STATS FAIL: expected an array of paired results");
    process.exit(2);
  }
  console.log(JSON.stringify(pairedBinaryStats(pairs), null, 2));
}
