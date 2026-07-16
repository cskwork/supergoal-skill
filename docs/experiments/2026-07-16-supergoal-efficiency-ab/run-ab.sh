#!/bin/bash
# 3-arm efficiency A/B at codex gpt-5.5 LOW effort, remaining 4 DeepSWE tasks.
# Arms: baseline (no skill) / v080 (skill @287c628 = v0.8.0) / recon (skill @8c01712 = diff-driven
# regression reconciliation). One runner (current checkout) for all arms; only --skill-repo varies,
# so the old per-worktree-runner confound is gone. Purpose: time + token efficiency, not correctness
# headroom (low floors f2p on some tasks; see 2026-07-15 STATUS).
# Requires: Docker running, pier, codex + ~/.codex/auth.json, /tmp/deep-swe-sg checkout,
# worktrees /tmp/sg-skill-v080 (287c628) and /tmp/sg-skill-recon (8c01712).
set -u
REPO="/Users/danny/Documents/PARA/Resource/supergoal-skill"
V080_REPO="/tmp/sg-skill-v080"
RECON_REPO="/tmp/sg-skill-recon"
BENCH="/tmp/deep-swe-sg"
OUT="/tmp/sg-deepswe-eff3"
mkdir -p "$OUT"

TASKS=(cliffy-config-file-parsing csstree-shorthand-expansion-compression skrub-duration-encoding termenv-preserve-ansi-resets)
COMMON=(--agent codex --model gpt-5.5 --reasoning-effort low --codex-auth-json auto
  --timeout-seconds 900 --benchmark-root "$BENCH" --force)

run_arm () { # $1=arm label, $2=task, rest=extra runner args
  local arm="$1" task="$2"; shift 2
  local rr="$OUT/${arm}-${task}"
  echo "[$(date +%H:%M:%S)] START arm=${arm} task=${task}"
  node "$REPO/templates/harness-eval-external/deepswe/run-full-cycle.mjs" \
    --task "$task" --run-root "$rr" "${COMMON[@]}" "$@" \
    > "$OUT/${arm}-${task}.log" 2>&1
  local st=$?
  node -e '
    const fs = require("fs");
    const [arm, task, rr, st] = process.argv.slice(1);
    let line = `ARM_DONE arm=${arm} task=${task} exit=${st}`;
    try {
      const s = JSON.parse(fs.readFileSync(`${rr}/summary.json`, "utf8"));
      const a = Object.values(s.arms)[0] || {};
      const m = a.metrics || {}, sc = a.score || {};
      line += ` outcome=${a.process_outcome} reward=${sc.reward} f2p=${sc.f2p_passed}/${sc.f2p_total}` +
        ` p2p=${sc.p2p_passed}/${sc.p2p_total} partial=${sc.partial}` +
        ` tok_in=${m.n_input_tokens} tok_cache=${m.n_cache_tokens} tok_out=${m.n_output_tokens}` +
        ` agent_s=${m.agent_execution_ms == null ? "n/a" : Math.round(m.agent_execution_ms / 1000)}` +
        ` wall_s=${m.wall_clock_ms == null ? "n/a" : Math.round(m.wall_clock_ms / 1000)}`;
    } catch { line += " outcome=NO_SUMMARY"; }
    console.log(line);
  ' "$arm" "$task" "$rr" "$st"
}

for task in "${TASKS[@]}"; do
  run_arm baseline "$task" --arms baseline
  run_arm v080 "$task" --arms harness --skill-repo "$V080_REPO"
  run_arm recon "$task" --arms harness --skill-repo "$RECON_REPO"
done
echo "SUITE_DONE $(date +%H:%M:%S)"
