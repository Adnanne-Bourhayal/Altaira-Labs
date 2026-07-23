#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_PREPARE_SCRIPT="$ROOT_DIR/scripts/prepare-provisioning-v2-production-checks.sh"
MIGRATION="$ROOT_DIR/backend/database/commercial-payment-provisioning-migration.sql"
PRECHECK_SQL="$ROOT_DIR/backend/database/checks/commercial-payment-production-precheck.sql"
POSTCHECK_SQL="$ROOT_DIR/backend/database/checks/commercial-payment-production-postcheck.sql"
EXPECTED_MIGRATION_SHA="a46d5870884bbc3c3b0226feacaf17227160cd84933cf25b60b83b7653d68e71"

fail() {
  echo "COMMERCIAL READINESS FAIL: $*" >&2
  exit 1
}

sha256() {
  shasum -a 256 "$1" | awk '{print $1}'
}

[[ -x "$BASE_PREPARE_SCRIPT" ]] || fail "base provisioning readiness script is missing or not executable"
"$BASE_PREPARE_SCRIPT" >/dev/null

[[ -f "$MIGRATION" ]] || fail "commercial migration is missing"
[[ "$(sha256 "$MIGRATION")" == "$EXPECTED_MIGRATION_SHA" ]] \
  || fail "commercial migration checksum changed; review it before any production decision"

if grep -Eiq '^[[:space:]]*(DROP|TRUNCATE|DELETE|UPDATE|INSERT|GRANT|REVOKE)[[:space:]]' "$MIGRATION"; then
  fail "unexpected destructive or data-mutating statement in the commercial migration"
fi

for check_file in "$PRECHECK_SQL" "$POSTCHECK_SQL"; do
  [[ -f "$check_file" ]] || fail "commercial read-only check is missing: $(basename "$check_file")"
  grep -Eq '^BEGIN TRANSACTION READ ONLY;' "$check_file" \
    || fail "read-only transaction guard is missing from $(basename "$check_file")"
  grep -Eq '^ROLLBACK;' "$check_file" \
    || fail "read-only check does not end with ROLLBACK: $(basename "$check_file")"
  if grep -Eiq '^[[:space:]]*(CREATE|ALTER|DROP|TRUNCATE|DELETE|UPDATE|INSERT|GRANT|REVOKE)[[:space:]]' "$check_file"; then
    fail "write statement found in commercial read-only check: $(basename "$check_file")"
  fi
done

PROPERTIES="$ROOT_DIR/backend/src/main/resources/application.properties"
rg -q 'altaira\.commercial\.legacy-direct-conversion-enabled=\$\{ALTAIRA_LEGACY_DIRECT_CONVERSION_ENABLED:false\}' "$PROPERTIES" \
  || fail "legacy direct conversion no longer defaults to disabled"
rg -q 'altaira\.commercial\.stripe\.enabled=\$\{STRIPE_CHECKOUT_ENABLED:false\}' "$PROPERTIES" \
  || fail "Stripe checkout no longer defaults to disabled"
rg -q 'altaira\.commercial\.stripe\.mode=\$\{STRIPE_CHECKOUT_MODE:mock\}' "$PROPERTIES" \
  || fail "Stripe checkout no longer defaults to mock mode"
rg -q 'altaira\.commercial\.stripe\.mock-confirmation-enabled=\$\{STRIPE_MOCK_CONFIRMATION_ENABLED:false\}' "$PROPERTIES" \
  || fail "mock payment confirmation no longer defaults to disabled"
rg -Uq 'stripeProperties\.mockConfirmationEnabled\(\), false,' \
  "$ROOT_DIR/backend/src/main/java/com/altaira/backend/service/CommercialFlowService.java" \
  || fail "commercial API response no longer hard-codes executionAllowed=false"

echo "=== COMMERCIAL PAYMENT PRODUCTION READINESS (LOCAL ONLY) ==="
echo "Migration checksum: $EXPECTED_MIGRATION_SHA"
echo "PASS: commercial migration matches the reviewed rehearsal artifact."
echo "PASS: commercial pre/post checks are read-only and end with ROLLBACK."
echo "PASS: direct conversion, Stripe checkout and mock confirmation default to disabled."
echo "PASS: commercial executionAllowed remains false."
echo "PRODUCTION COMMERCIAL SCHEMA STATE: UNKNOWN (no connection was attempted)."
echo "No migration command is implemented by this script."
