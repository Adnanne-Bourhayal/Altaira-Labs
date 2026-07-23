#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT_DIR/scripts/check-provisioning-v2-production-readiness.sh"
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/altaira-production-readiness-guards.XXXXXX")"
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
printf 'called\n' >> "$MOCK_PSQL_MARKER"
MOCK
chmod +x "$FAKE_BIN/psql"

write_config() {
  local path="$1"
  local confirmation="${2:-I_CONFIRM_READ_ONLY_PRODUCTION_PREFLIGHT}"
  cat > "$path" <<EOF
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-safe-guard.eu-central-1.aws.neon.tech/neondb?sslmode=require
SPRING_DATASOURCE_USERNAME=readiness_user
SPRING_DATASOURCE_PASSWORD=placeholder-not-a-real-secret
ALTAIRA_EXPECTED_PRODUCTION_HOST=ep-safe-guard.eu-central-1.aws.neon.tech
ALTAIRA_PRODUCTION_READ_ONLY_CONFIRMATION=$confirmation
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
    || { echo "FAIL $label: expected message not found" >&2; sed -n '1,60p' "$output" >&2; exit 1; }
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
  ALTAIRA_PRODUCTION_READINESS_ENV="$valid_config" \
  "$SCRIPT" --database-read-only-precheck

inside_repo_config="$ROOT_DIR/.production-readiness-guard-test.env"
write_config "$inside_repo_config"
trap 'rm -f "$inside_repo_config"; cleanup' EXIT INT TERM
run_abort_case "config inside repository" \
  "readiness config must be outside the Git repository" \
  ALTAIRA_PRODUCTION_READINESS_ENV="$inside_repo_config" \
  "$SCRIPT" --database-read-only-precheck
rm -f "$inside_repo_config"

invalid_confirmation="$TEMP_DIR/invalid-confirmation.env"
write_config "$invalid_confirmation" "NO"
run_abort_case "invalid confirmation" \
  "invalid read-only production confirmation" \
  ALTAIRA_PRODUCTION_READINESS_ENV="$invalid_confirmation" \
  "$SCRIPT" --database-read-only-precheck

echo "PASS: all production-readiness safety guards aborted before psql."
