#!/bin/bash
# Medium-effort spot check before v0.9.0: does the fast path hold at medium (cand1 vs recon),
# and is supergoal a meaningful improvement vs baseline on feature-add (csstree) and debug
# (termenv) tasks? 2 tasks x 3 arms, serial, same runner/metrics as the low run.
set -u
REPO="/Users/danny/Documents/PARA/Resource/supergoal-skill"
BENCH="/tmp/deep-swe-sg"
OUT="/tmp/sg-deepswe-eff3"

TASKS=(csstree-shorthand-expansion-compression termenv-preserve-ansi-resets)
COMMON=(--agent codex --model gpt-5.5 --reasoning-effort medium --codex-auth-json auto
  --timeout-seconds 900 --benchmark-root "$BENCH" --force)

run_arm () { # $1=arm label, $2=task, rest=extra runner args
  local arm="$1" task="$2"; shift 2
  local rr="$OUT/${arm}-${task}"
  echo "[$(date +%H:%M:%S)] START arm=${arm} task=${task}"
  node "$REPO/templates/harness-eval-external/deepswe/run-full-cycle.mjs" \
    --task "$task" --run-root "$rr" "${COMMON[@]}" "$@" > "$OUT/${arm}-${task}.log" 2>&1
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
  run_arm basemed "$task" --arms baseline
  run_arm reconmed "$task" --arms harness --skill-repo /tmp/sg-skill-recon
  run_arm cand1med "$task" --arms harness --skill-repo /tmp/sg-skill-cand1
done
echo "SPOTCHECK_DONE $(date +%H:%M:%S)"
