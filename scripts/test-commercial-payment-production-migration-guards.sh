#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNNER="$ROOT_DIR/scripts/apply-commercial-payment-production-migration.sh"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/altaira-commercial-migration-guards.XXXXXX")"
trap 'rm -rf "$WORK_DIR"' EXIT

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

expect_failure() {
  local label="$1"
  local expected="$2"
  shift 2
  local output
  if output="$("$@" 2>&1)"; then
    fail "$label unexpectedly succeeded"
  fi
  [[ "$output" == *"$expected"* ]] || fail "$label returned an unexpected error"
  echo "PASS: $label"
}

[[ -x "$RUNNER" ]] || fail "migration runner is missing or not executable"

output="$("$RUNNER")"
[[ "$output" == *"LOCAL PLAN ONLY"* ]] || fail "default mode did not remain local-only"
[[ "$output" == *"No database or Neon API connection was attempted."* ]] ||
  fail "default mode did not confirm zero external access"
echo "PASS: default mode is local-only"

expect_failure \
  "invalid confirmation" \
  "invalid or missing production migration confirmation" \
  env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
    "$RUNNER" --apply-production

expect_failure \
  "inherited datasource" \
  "inherited datasource variables are forbidden" \
  env \
    ALTAIRA_COMMERCIAL_PRODUCTION_MIGRATION_CONFIRMATION=I_CONFIRM_APPLY_COMMERCIAL_PAYMENT_PRODUCTION_MIGRATION \
    DATABASE_URL=forbidden \
    "$RUNNER" --apply-production

expect_failure \
  "config inside repository" \
  "secret config must remain outside the repository" \
  env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
    ALTAIRA_COMMERCIAL_PRODUCTION_MIGRATION_CONFIRMATION=I_CONFIRM_APPLY_COMMERCIAL_PAYMENT_PRODUCTION_MIGRATION \
    ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV="$ROOT_DIR/backend/.env.example" \
    ALTAIRA_NEON_RECOVERY_ENV="$ROOT_DIR/backend/.env.example" \
    ALTAIRA_NEON_RECOVERY_BRANCH_NAME=recovery/test \
    "$RUNNER" --apply-production

touch "$WORK_DIR/database.env" "$WORK_DIR/neon.env"

expect_failure \
  "missing recovery branch name" \
  "ALTAIRA_NEON_RECOVERY_BRANCH_NAME must identify a recovery/ branch" \
  env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
    ALTAIRA_COMMERCIAL_PRODUCTION_MIGRATION_CONFIRMATION=I_CONFIRM_APPLY_COMMERCIAL_PAYMENT_PRODUCTION_MIGRATION \
    ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV="$WORK_DIR/database.env" \
    ALTAIRA_NEON_RECOVERY_ENV="$WORK_DIR/neon.env" \
    "$RUNNER" --apply-production

echo "PASS: commercial production migration guards fail closed before network or database access."
