set -u
export SG_EVAL_MODEL=gpt-5.5
export SG_EVAL_EFFORT=low
export SG_EVAL_TIMEOUT_MS=720000
log(){ echo "[$(date +%H:%M:%S)] $*"; }

log "RUN#1 fixed-harness (current INLINE SKILL.md): baseline + harness on gpt-5.5 low"
SG_EVAL_RUN_ROOT=/tmp/sg-gpt55-low-fixed node run.mjs > run1.console.log 2>&1
log "RUN#1 done exit=$?"
cp result.json result-fixed.json 2>/dev/null
cp -r raw raw-fixed 2>/dev/null

log "RUN#2 original-harness (pre-fix SKILL.md): baseline + harness on gpt-5.5 low"
SG_EVAL_RUN_ROOT=/tmp/sg-gpt55-low-orig SG_EVAL_HARNESS_SKILL="$PWD/SKILL.original.md" node run.mjs > run2.console.log 2>&1
log "RUN#2 done exit=$?"
cp result.json result-orig.json 2>/dev/null
cp -r raw raw-orig 2>/dev/null

log "ALL DONE"
