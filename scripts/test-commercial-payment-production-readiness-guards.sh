#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT_DIR/scripts/check-commercial-payment-production-readiness.sh"
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/altaira-commercial-readiness-guards.XXXXXX")"
FAKE_BIN="$TEMP_DIR/bin"
PSQL_MARKER="$TEMP_DIR/psql-calls"

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT INT TERM

mkdir -p "$FAKE_BIN"

cat > "$FAKE_BIN/psql" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
printf 'called|%s|%s\n' "${PGOPTIONS:-}" "$*" >> "$MOCK_PSQL_MARKER"
MOCK
chmod +x "$FAKE_BIN/psql"

write_config() {
  local path="$1"
  local confirmation="${2:-I_CONFIRM_READ_ONLY_COMMERCIAL_PRODUCTION_PREFLIGHT}"
  cat > "$path" <<EOF
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-safe-guard.eu-central-1.aws.neon.tech/neondb?sslmode=require
SPRING_DATASOURCE_USERNAME=readiness_user
SPRING_DATASOURCE_PASSWORD=placeholder-not-a-real-secret
ALTAIRA_EXPECTED_PRODUCTION_HOST=ep-safe-guard.eu-central-1.aws.neon.tech
ALTAIRA_COMMERCIAL_PRODUCTION_READ_ONLY_CONFIRMATION=$confirmation
EOF
}

run_abort_case() {
  local label="$1"
  local expected="$2"
  shift 2
  local output="$TEMP_DIR/${label// /-}.out"
  : > "$PSQL_MARKER"
  set +e
  env PATH="$FAKE_BIN:$PATH" MOCK_PSQL_MARKER="$PSQL_MARKER" "$@" > "$output" 2>&1
  local code=$?
  set -e
  [[ $code -ne 0 ]] || { echo "FAIL $label: expected abort" >&2; exit 1; }
  grep -F "$expected" "$output" >/dev/null \
    || { echo "FAIL $label: expected message not found" >&2; sed -n '1,80p' "$output" >&2; exit 1; }
  [[ ! -s "$PSQL_MARKER" ]] \
    || { echo "FAIL $label: psql was invoked" >&2; exit 1; }
  echo "PASS: $label"
}

: > "$PSQL_MARKER"
PATH="$FAKE_BIN:$PATH" MOCK_PSQL_MARKER="$PSQL_MARKER" "$SCRIPT" >/dev/null
[[ ! -s "$PSQL_MARKER" ]] || { echo "FAIL: local mode invoked psql" >&2; exit 1; }
echo "PASS: local mode never invokes psql"

valid_config="$TEMP_DIR/readiness.env"
write_config "$valid_config"

run_abort_case "inherited datasource" \
  "inherited datasource variables are forbidden" \
  SPRING_DATASOURCE_URL="jdbc:postgresql://protected.example.invalid/neondb" \
  ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV="$valid_config" \
  "$SCRIPT" --database-read-only-precheck

inside_repo_config="$ROOT_DIR/.commercial-production-readiness-guard-test.env"
write_config "$inside_repo_config"
trap 'rm -f "$inside_repo_config"; cleanup' EXIT INT TERM
run_abort_case "config inside repository" \
  "readiness config must be outside the Git repository" \
  ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV="$inside_repo_config" \
  "$SCRIPT" --database-read-only-precheck
rm -f "$inside_repo_config"

invalid_confirmation="$TEMP_DIR/invalid-confirmation.env"
write_config "$invalid_confirmation" "NO"
run_abort_case "invalid confirmation" \
  "invalid read-only commercial production confirmation" \
  ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV="$invalid_confirmation" \
  "$SCRIPT" --database-read-only-precheck

: > "$PSQL_MARKER"
PATH="$FAKE_BIN:$PATH" \
MOCK_PSQL_MARKER="$PSQL_MARKER" \
ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV="$valid_config" \
  "$SCRIPT" --database-read-only-precheck >/dev/null
grep -F 'default_transaction_read_only=on' "$PSQL_MARKER" >/dev/null \
  || { echo "FAIL: valid invocation did not enforce read-only PGOPTIONS" >&2; exit 1; }
grep -F 'commercial-payment-production-precheck.sql' "$PSQL_MARKER" >/dev/null \
  || { echo "FAIL: valid invocation did not select the reviewed precheck SQL" >&2; exit 1; }

echo "PASS: valid guarded invocation reaches only the read-only SQL."
echo "PASS: all commercial production-readiness safety guards behaved as expected."
