#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
. "$ROOT/tests/support/contract.sh"

assert_file "db-access reference exists" "reference/db-access.md"
assert_file "db env template exists" "templates/db-access/.env.example"
assert_file "db cross-platform node runner exists" "templates/db-access/db-access.mjs"
assert_file "db windows wrapper exists" "templates/db-access/db-access.cmd"
assert_file "db connection script exists" "templates/db-access/check-connection.sh"
assert_file "db schema script exists" "templates/db-access/schema-summary.sh"
assert_file "db query script exists" "templates/db-access/read-only-query.sh"

assert_text_exact "skill hooks db-access into implementation modes" "SKILL.md" "optional DB evidence"
assert_text_exact "skill names db templates" "SKILL.md" "templates/db-access/"
assert_text_exact "db access is self-contained" "reference/db-access.md" "works without any external skill"
assert_text_exact "db access names node runner" "reference/db-access.md" "node templates/db-access/db-access.mjs"
assert_text_exact "db access names windows wrapper" "reference/db-access.md" "Windows may use"
assert_text_exact "db access supports skip" "reference/db-access.md" "skip the DB phase"
assert_text_exact "db access records skipped load-bearing evidence" "reference/db-access.md" "DB evidence: Not covered"
assert_text_exact "db access asks when env missing" "reference/db-access.md" 'If the `.env` file does not exist'
assert_text_exact "db access defaults env path" "reference/db-access.md" ".domain-agent/db/.env"
assert_text_exact "db access does not require postgres-intelligence" "reference/db-access.md" "do not require them"
assert_text_exact "db-reader accepts non-QA workflows" "agents/db-reader.md" "GREENFIELD, DEBUG, LEGACY, and QA-ONLY"
assert_text_exact "db-reader prefers node runner" "agents/db-reader.md" "node templates/db-access/db-access.mjs"
assert_text_exact "db-reader keeps read-only anchor" "agents/db-reader.md" "Read-only ONLY"
assert_text_exact "db-reader keeps auth safety anchor" "agents/db-reader.md" "NEVER write auth/credentials to any file"
assert_text_exact "runner rejects write sql" "templates/db-access/db-access.mjs" "write/admin SQL rejected"
assert_text_exact "runner mentions missing env user ask" "templates/db-access/db-access.mjs" "Ask the user to fill it"
assert_text_exact "runner redacts secrets" "templates/db-access/db-access.mjs" "redact"
assert_text_exact "postgres uses native psql" "templates/db-access/db-access.mjs" "psql"
assert_text_exact "mysql uses native mysql" "templates/db-access/db-access.mjs" "mysql"
assert_text_exact "sqlite uses readonly native client" "templates/db-access/db-access.mjs" "sqlite3"

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
