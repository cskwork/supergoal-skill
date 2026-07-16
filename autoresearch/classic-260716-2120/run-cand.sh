#!/bin/bash
# autoresearch iteration runner: one candidate skill repo, 3 valid tasks, harness arm only.
# Usage: run-cand.sh <arm-label> <skill-repo-path>
set -u
REPO="/Users/danny/Documents/PARA/Resource/supergoal-skill"
BENCH="/tmp/deep-swe-sg"
OUT="/tmp/sg-deepswe-eff3"
ARM="${1:?arm label}"
SKILL="${2:?skill repo}"

TASKS=(cliffy-config-file-parsing csstree-shorthand-expansion-compression termenv-preserve-ansi-resets)
COMMON=(--agent codex --model gpt-5.5 --reasoning-effort low --codex-auth-json auto
  --timeout-seconds 900 --benchmark-root "$BENCH" --force --arms harness --skill-repo "$SKILL")

for task in "${TASKS[@]}"; do
  rr="$OUT/${ARM}-${task}"
  echo "[$(date +%H:%M:%S)] START arm=${ARM} task=${task}"
  node "$REPO/templates/harness-eval-external/deepswe/run-full-cycle.mjs" \
    --task "$task" --run-root "$rr" "${COMMON[@]}" > "$OUT/${ARM}-${task}.log" 2>&1
  st=$?
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
  ' "$ARM" "$task" "$rr" "$st"
done
echo "CAND_DONE ${ARM} $(date +%H:%M:%S)"
