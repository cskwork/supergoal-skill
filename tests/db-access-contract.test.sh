#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

require_file() {
  local label="$1" path="$2"
  if [ -f "$ROOT/$path" ]; then
    PASS=$((PASS+1)); printf ' PASS %s\n' "$label"
  else
    FAIL=$((FAIL+1)); printf ' FAIL %s missing %s\n' "$label" "$path"
  fi
}

require_text() {
  local label="$1" path="$2" text="$3"
  if grep -Fq -- "$text" "$ROOT/$path"; then
    PASS=$((PASS+1)); printf ' PASS %s\n' "$label"
  else
    FAIL=$((FAIL+1)); printf ' FAIL %s missing %q in %s\n' "$label" "$text" "$path"
  fi
}

require_file "db-access reference exists" "reference/db-access.md"
require_file "db env template exists" "templates/db-access/.env.example"
require_file "db cross-platform node runner exists" "templates/db-access/db-access.mjs"
require_file "db windows wrapper exists" "templates/db-access/db-access.cmd"
require_file "db connection script exists" "templates/db-access/check-connection.sh"
require_file "db schema script exists" "templates/db-access/schema-summary.sh"
require_file "db query script exists" "templates/db-access/read-only-query.sh"

require_text "skill hooks db-access into implementation modes" "SKILL.md" "optional DB evidence"
require_text "skill names db templates" "SKILL.md" "templates/db-access/"
require_text "db access is self-contained" "reference/db-access.md" "works without any external skill"
require_text "db access names node runner" "reference/db-access.md" "node templates/db-access/db-access.mjs"
require_text "db access names windows wrapper" "reference/db-access.md" "Windows may use"
require_text "db access supports skip" "reference/db-access.md" "skip the DB phase"
require_text "db access records skipped load-bearing evidence" "reference/db-access.md" "DB evidence: Not covered"
require_text "db access asks when env missing" "reference/db-access.md" 'If the `.env` file does not exist'
require_text "db access defaults env path" "reference/db-access.md" ".domain-agent/db/.env"
require_text "db access does not require postgres-intelligence" "reference/db-access.md" "do not require them"
require_text "db-reader accepts non-QA workflows" "agents/db-reader.md" "GREENFIELD, DEBUG, LEGACY, and QA-ONLY"
require_text "db-reader prefers node runner" "agents/db-reader.md" "node templates/db-access/db-access.mjs"
require_text "db-reader keeps read-only anchor" "agents/db-reader.md" "Read-only ONLY"
require_text "db-reader keeps auth safety anchor" "agents/db-reader.md" "NEVER write auth/credentials to any file"
require_text "runner rejects write sql" "templates/db-access/db-access.mjs" "write/admin SQL rejected"
require_text "runner mentions missing env user ask" "templates/db-access/db-access.mjs" "Ask the user to fill it"
require_text "runner redacts secrets" "templates/db-access/db-access.mjs" "redact"
require_text "postgres uses native psql" "templates/db-access/db-access.mjs" "psql"
require_text "mysql uses native mysql" "templates/db-access/db-access.mjs" "mysql"
require_text "sqlite uses readonly native client" "templates/db-access/db-access.mjs" "sqlite3"

T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT
cat > "$T/.env" <<'ENV'
DB_DIALECT=sqlite
SQLITE_DB_PATH=/tmp/supergoal-db-access-contract.sqlite
ENV
DB_ENV_FILE="$T/.env" node "$ROOT/templates/db-access/db-access.mjs" read-only-query 'SELECT 1; DROP TABLE users' >/tmp/supergoal-db-access-contract.out 2>&1
ec=$?
if [ "$ec" -ne 0 ] && grep -Fq "write/admin SQL rejected" /tmp/supergoal-db-access-contract.out; then
  PASS=$((PASS+1)); printf ' PASS write SQL blocked by template\n'
else
  FAIL=$((FAIL+1)); printf ' FAIL write SQL was not blocked\n'
fi

printf '\n%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
