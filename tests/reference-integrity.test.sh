#!/usr/bin/env bash
# /supergoal reference-integrity contract.
# Every workflow executes by following SKILL.md's pointers into reference/, agents/, and
# templates/. A renamed or deleted file must fail loudly here, not silently 404 at dispatch
# time. Checks: (1) every extension-terminated skill-owned path token in the docs exists,
# (2) every bare *-gate.(mjs|sh) name resolves inside templates/, (3) every agents/*.md
# persona is routable (mentioned by stem somewhere) and every reference/*.md is reachable
# from SKILL.md or another loaded file.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

DOC_FILES=("$ROOT/SKILL.md" "$ROOT/README.md" "$ROOT/README.ko.md")
for f in "$ROOT"/reference/*.md "$ROOT"/agents/*.md; do DOC_FILES+=("$f"); done

echo "=================================================================="
echo " /supergoal reference-integrity contract   skill: $ROOT"
echo "=================================================================="

# --- Check 1: skill-owned path tokens exist on disk -------------------------------
# Only extension-terminated tokens are checked (prose like "agents/surfaces" and runtime
# workspace paths like "teach/<topic>/reference/*.html" never match). The lookbehind
# rejects tokens embedded in a longer path (e.g. "~/.claude/agents/skills/...").
MISSING_PATHS="$(
  perl -ne 'while (/(?<![\w\/])((?:reference|agents|templates)\/[A-Za-z0-9_.\/-]*\.(?:md|sh|mjs|js|html|yaml|json|template|example))\b/g) { print "$1\n" }' \
    "${DOC_FILES[@]}" | sort -u | while read -r p; do
      [ -e "$ROOT/$p" ] || echo "$p"
    done
)"
if [ -z "$MISSING_PATHS" ]; then
  PASS=$((PASS + 1)); printf '  PASS  all skill-owned path tokens resolve\n'
else
  FAIL=$((FAIL + 1)); printf '  FAIL  dangling path tokens:\n'
  printf '        %s\n' $MISSING_PATHS
fi

# --- Check 2: bare gate names resolve inside templates/ ---------------------------
MISSING_GATES="$(
  perl -ne 'while (/\b([A-Za-z0-9-]+-gate\.(?:mjs|sh))\b/g) { print "$1\n" }' \
    "${DOC_FILES[@]}" | sort -u | while read -r g; do
      [ -n "$(find "$ROOT/templates" -name "$g" -print -quit)" ] || echo "$g"
    done
)"
if [ -z "$MISSING_GATES" ]; then
  PASS=$((PASS + 1)); printf '  PASS  all gate scripts named in docs exist in templates/\n'
else
  FAIL=$((FAIL + 1)); printf '  FAIL  gate scripts named but missing from templates/:\n'
  printf '        %s\n' $MISSING_GATES
fi

# --- Check 3a: no orphan persona - every agents/*.md is mentioned by stem ----------
ORPHAN_AGENTS=""
for f in "$ROOT"/agents/*.md; do
  stem="$(basename "$f" .md)"
  if ! grep -rliq -- "$stem" "$ROOT/SKILL.md" "$ROOT/README.md" "$ROOT"/reference "$ROOT"/templates "$ROOT"/tests 2>/dev/null; then
    ORPHAN_AGENTS="$ORPHAN_AGENTS agents/$stem.md"
  fi
done
if [ -z "$ORPHAN_AGENTS" ]; then
  PASS=$((PASS + 1)); printf '  PASS  every agent persona is routable (no orphans)\n'
else
  FAIL=$((FAIL + 1)); printf '  FAIL  orphan personas (nothing routes to them):%s\n' "$ORPHAN_AGENTS"
fi

# --- Check 3b: every reference/*.md is reachable from SKILL.md or a peer ----------
UNROUTABLE_REFS=""
for f in "$ROOT"/reference/*.md; do
  stem="$(basename "$f" .md)"
  others=("$ROOT/SKILL.md")
  for g in "$ROOT"/reference/*.md "$ROOT"/agents/*.md; do
    [ "$g" = "$f" ] || others+=("$g")
  done
  if ! grep -liq -- "$stem" "${others[@]}" 2>/dev/null; then
    UNROUTABLE_REFS="$UNROUTABLE_REFS reference/$stem.md"
  fi
done
if [ -z "$UNROUTABLE_REFS" ]; then
  PASS=$((PASS + 1)); printf '  PASS  every reference file is reachable from the router\n'
else
  FAIL=$((FAIL + 1)); printf '  FAIL  unreachable reference files:%s\n' "$UNROUTABLE_REFS"
fi

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
