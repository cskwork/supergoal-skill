#!/usr/bin/env bash
# /supergoal commit gate — the literal precondition for commit/merge in a GREENFIELD/DEBUG/LEGACY run
# (reference/delivery-gate.md "Commit gate"). Run it and see PASS before committing/merging into the
# target/integration branch. It blocks the commit while the delivery proof is not green:
#   1) delivery-proof.md exists and is filled,
#   2) no decision gate is still open (ask-user/unresolved => block; resolve or ask the user, do not commit),
#   3) no surfaced requirement is still open (a requirement the verifier has not closed),
#   4) Requirement Trace is closed forward and backward (no open row, no orphan scope),
#   5) non-exact Reproduction Fidelity records residual risk and post-deploy confirmation,
#   6) the after target is evidenced (delivery-proof.md ## After Evidence has a row),
#   7) QA verdict is PASS (FAIL or PARTIAL/incomplete blocks); for an app run, browser/CLI QA evidence passes,
#   8) at least one trusted command (frozen_repo/evaluator_owned) backs the proof.
# NEVER edit this script to make a non-green run commit — resolve the gap or ask the user instead.
#
# Usage: commit-gate.sh <vault-dir> [browser|cli|none]
#   <vault-dir>      the run's changelog folder, e.g. docs/changelog/2026-06/30-commit-gate
#   browser|cli|none app exercised: a browser app, a CLI/library, or none (no app QA to delegate)

set -euo pipefail

usage() { echo "usage: commit-gate.sh <vault-dir> [browser|cli|none]" >&2; exit 2; }
[ $# -ge 1 ] || usage
VAULT="$1"; APPTYPE="${2:-none}"
PROOF="$VAULT/delivery-proof.md"
SURF="$VAULT/surfaced-requirements.md"
fail() { echo "COMMIT-GATE FAIL: $*" >&2; exit 1; }

case "$APPTYPE" in browser|cli|none) ;; *) usage ;; esac

echo "== /supergoal commit gate =="
echo "vault: $VAULT  app-type: $APPTYPE"

# 1) Proof present: there is a Before/After Eval to commit against.
[ -s "$PROOF" ] || fail "delivery-proof.md missing/empty — no Before/After Eval to commit against"

# 2) Decision gates resolved: in the '## Decision Gates' table, no Status cell (col 3) still reads 'open'.
#    Catches unresolved ask-user gates AND an un-filled placeholder row ('open / resolved').
open_gate="$(awk -F'|' '
  /^[[:space:]]*##[[:space:]]+Decision Gates/ { ing=1; next }
  /^[[:space:]]*##[[:space:]]/ { ing=0 }
  ing && /^[[:space:]]*\|/ {
    s=$4; gsub(/^[[:space:]]+|[[:space:]]+$/,"",s); l=tolower(s)
    if (l ~ /(^|[^a-z])open([^a-z]|$)/) { print "OPEN"; exit }
  }
' "$PROOF")"
[ -z "$open_gate" ] || fail "an open decision gate remains in delivery-proof.md — resolve it or ask the user about the requirement; do not commit on an unresolved/ask-user gate"
echo "  ok: no open decision gate"

# 3) Surfaced requirements closed: strip HTML comments first (so the template's commented example does not
#    count), then enforce only once a real dated heading exists (a bare '## YYYY-MM-DD' template skips).
if [ -s "$SURF" ]; then
  surf_body="$(sed '/<!--/,/-->/d' "$SURF")"
  if printf '%s\n' "$surf_body" | grep -qE '^[[:space:]]*##[[:space:]]+2[0-9]{3}-[0-9]'; then
    if printf '%s\n' "$surf_body" | grep -qiE 'status:[[:space:]]*open'; then
      fail "a surfaced requirement is still open in surfaced-requirements.md — close it (verifier) or ask the user; do not commit with an unmet requirement"
    fi
    echo "  ok: no open surfaced requirement"
  fi
fi

# 4) Requirement Trace closed in both directions: every forward row has Status=met, and the reverse
#    attestation is exactly 'Backward-trace: clean'. Any orphan scope or placeholder blocks commit.
trace_state="$(awk -F'|' '
  /^[[:space:]]*##[[:space:]]+Requirement Trace/ { ing=1; found=1; next }
  /^[[:space:]]*##[[:space:]]/ { ing=0 }
  ing && /^[[:space:]]*\|/ {
    id=$2; gsub(/^[[:space:]]+|[[:space:]]+$/,"",id); lid=tolower(id)
    if (id=="" || lid=="#" || id ~ /^-+$/) next
    rows++
    st=$7; gsub(/^[[:space:]]+|[[:space:]]+$/,"",st); lst=tolower(st)
    if (lst != "met") { bad=1; exit }
  }
  END {
    if (!found) print "MISSING";
    else if (bad) print "BAD";
    else if (rows==0) print "NOROW";
    else print "OK";
  }
' "$PROOF")"
case "$trace_state" in
  OK) echo "  ok: requirement trace forward rows met" ;;
  MISSING) fail "delivery-proof.md missing ## Requirement Trace — requirements are not traceable" ;;
  NOROW) fail "delivery-proof.md ## Requirement Trace has no requirement row — seed and close the RTM before commit" ;;
  *) fail "delivery-proof.md ## Requirement Trace has an unmet/open/blocked/placeholder row — close every requirement before commit" ;;
esac

backward_line="$(awk '
  /^[[:space:]]*##[[:space:]]+Requirement Trace/ { ing=1; next }
  /^[[:space:]]*##[[:space:]]/ { ing=0 }
  ing && /^[[:space:]]*Backward-trace:/ { print; exit }
' "$PROOF")"
[ -n "$backward_line" ] || fail "delivery-proof.md missing Backward-trace line — reverse trace scope before commit"
backward_norm="$(printf '%s' "$backward_line" | tr '[:upper:]' '[:lower:]' | sed -E 's/^[[:space:]]+|[[:space:]]+$//g; s/[[:space:]]+/ /g')"
[ "$backward_norm" = "backward-trace: clean" ] \
  || fail "Backward-trace is not clean — remove orphan scope or get explicit user acceptance before commit"
echo "  ok: backward trace clean"

# 5) Reproduction Fidelity: exact runs are minimal. Non-exact prod/proxy runs must record the data gap's
#    residual risk and a post-deploy confirmation plan; a synthetic green alone is not conclusive proof.
proof_field() {
  local label="$1"
  awk -v label="$label" '
    /^[[:space:]]*##[[:space:]]+Reproduction Fidelity/ { ing=1; next }
    /^[[:space:]]*##[[:space:]]/ { ing=0 }
    ing {
      line=$0
      sub(/^[[:space:]]*-[[:space:]]*/, "", line)
      low=tolower(line); want=tolower(label) ":"
      if (index(low, want) == 1) {
        sub(/^[^:]*:[[:space:]]*/, "", line)
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)
        print line
        exit
      }
    }
  ' "$PROOF"
}
fidelity="$(proof_field "Fidelity level")"
[ -n "$fidelity" ] || fail "delivery-proof.md missing Reproduction Fidelity fidelity level"
fidelity_l="$(printf '%s' "$fidelity" | tr '[:upper:]' '[:lower:]' | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')"
case "$fidelity_l" in
  exact)
    echo "  ok: reproduction fidelity exact"
    ;;
  prod-snapshot|synthetic-representative|synthetic-minimal|not-reproduced)
    residual="$(proof_field "Residual risk from data gap")"
    confirm="$(proof_field "Post-deploy confirmation plan")"
    if ! printf '%s' "$residual" | grep -qE '[[:alnum:]]' || printf '%s' "$residual" | grep -qiE '^(todo|tbd|none|n/a|<.*>|\(.*\))$'; then
      fail "non-exact Reproduction Fidelity missing residual risk from data gap"
    fi
    if ! printf '%s' "$confirm" | grep -qE '[[:alnum:]]' || printf '%s' "$confirm" | grep -qiE '^(todo|tbd|none|n/a|<.*>|\(.*\))$'; then
      fail "non-exact Reproduction Fidelity missing post-deploy confirmation plan"
    fi
    echo "  ok: non-exact reproduction fidelity records residual risk and post-deploy plan"
    ;;
  *)
    fail "unknown or placeholder Reproduction Fidelity level '$fidelity' — use exact, prod-snapshot, synthetic-representative, synthetic-minimal, or not-reproduced"
    ;;
esac

# 6) After target evidenced AND green: '## After Evidence' has >=1 data row and no row's Status (col 3) is
#    a failing word (fail/red/error/broken/partial). A recorded red row is not a green after target.
evi="$(awk -F'|' '
  /^[[:space:]]*##[[:space:]]+After Evidence/ { ing=1; next }
  /^[[:space:]]*##[[:space:]]/ { ing=0 }
  ing && /^[[:space:]]*\|/ {
    c=$2; gsub(/^[[:space:]]+|[[:space:]]+$/,"",c)
    if (c=="" || tolower(c)=="check" || c ~ /^-+$/) next
    st=$3; gsub(/^[[:space:]]+|[[:space:]]+$/,"",st)
    if (tolower(st) ~ /(fail|red|error|broken|partial)/) { red=1; exit }
    rows++
  }
  END { if (red) print "RED"; else if (rows>0) print "OK" }
' "$PROOF")"
case "$evi" in
  RED) fail "delivery-proof.md ## After Evidence has a failing row — the after target is not green; fix it before commit" ;;
  OK)  echo "  ok: after target evidenced (green)" ;;
  *)   fail "delivery-proof.md ## After Evidence has no row — the after target is not evidenced; finish verification before commit" ;;
esac

# 7) QA verdict: block on ANY FAIL/PARTIAL anywhere in the vault (not just the first), and on an un-filled
#    '<PASS | FAIL | PARTIAL>' placeholder (a started-but-incomplete QA report). No verdict line at all =>
#    non-QA change, skip. For an app run, delegate browser/CLI evidence to the shared qa-gate.sh.
if grep -rhiE 'Verdict:[[:space:]]*(FAIL|PARTIAL)([[:space:]]|$)' "$VAULT" >/dev/null 2>&1; then
  fail "QA verdict FAIL/PARTIAL present — failed/incomplete QA blocks commit; finish QA or ask the user"
fi
if grep -rhiE 'Verdict:[[:space:]]*<' "$VAULT" >/dev/null 2>&1; then
  fail "QA report has an un-filled Verdict placeholder — QA is incomplete; finish it or ask the user"
fi
if [ "$APPTYPE" != none ]; then
  QAGATE="$(dirname "$0")/qa-gate.sh"
  [ -f "$QAGATE" ] || fail "qa-gate.sh not found next to commit-gate.sh — cannot verify $APPTYPE QA evidence"
  bash "$QAGATE" "$VAULT" "$APPTYPE" || fail "QA evidence gate failed (see qa-gate output above)"
fi
echo "  ok: QA verdict clean"

# 8) A trusted command backs the proof (agent-detected commands cannot be the whole proof).
grep -qE 'frozen_repo|evaluator_owned' "$PROOF" \
  || fail "no trusted command (frozen_repo/evaluator_owned) in the manifest — agent-detected alone cannot prove done"
echo "  ok: trusted command present"

echo "== COMMIT GATE PASS =="
