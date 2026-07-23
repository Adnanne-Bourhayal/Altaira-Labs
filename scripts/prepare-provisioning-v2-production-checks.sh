#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LEAD_MIGRATION="$ROOT_DIR/backend/database/lead-intake-conversion-migration.sql"
V1_MIGRATION="$ROOT_DIR/backend/database/provisioning-engine-migration.sql"
V2_MIGRATION="$ROOT_DIR/backend/database/provisioning-engine-v2-visibility-migration.sql"
PRECHECK_SQL="$ROOT_DIR/backend/database/checks/provisioning-engine-v2-production-precheck.sql"
POSTCHECK_SQL="$ROOT_DIR/backend/database/checks/provisioning-engine-v2-production-postcheck.sql"

EXPECTED_LEAD_SHA="dfa542cef10901e90bace92cd5303919778e1c6b24181b4c7aada2a6581dd93e"
EXPECTED_V1_SHA="bb40bfe9eaffa83aed6c485c1a08d62fa2ef9fea9505a5ece44b4a3a06276843"
EXPECTED_V2_SHA="6e4828347f4206326d33373421f2de7e3ca529e09249c2f5da867c94eb93fd71"

fail() {
  echo "READINESS FAIL: $*" >&2
  exit 1
}

sha256() {
  shasum -a 256 "$1" | awk '{print $1}'
}

verify_checksum() {
  local file="$1"
  local expected="$2"
  local actual
  [[ -f "$file" ]] || fail "missing file: $file"
  actual="$(sha256 "$file")"
  [[ "$actual" == "$expected" ]] \
    || fail "checksum changed for $(basename "$file"); review and update the runbook before production"
  printf '%s  %s\n' "$actual" "${file#"$ROOT_DIR/"}"
}

for sql_file in "$LEAD_MIGRATION" "$V1_MIGRATION" "$V2_MIGRATION"; do
  if grep -Eiq '^[[:space:]]*(DROP|TRUNCATE|DELETE|UPDATE|INSERT|GRANT|REVOKE)[[:space:]]' "$sql_file"; then
    fail "unexpected mutating statement in $(basename "$sql_file")"
  fi
done

for check_file in "$PRECHECK_SQL" "$POSTCHECK_SQL"; do
  [[ -f "$check_file" ]] || fail "missing read-only check: $check_file"
  grep -Eq '^BEGIN TRANSACTION READ ONLY;' "$check_file" \
    || fail "read-only transaction guard missing from $(basename "$check_file")"
  if grep -Eiq '^[[:space:]]*(CREATE|ALTER|DROP|TRUNCATE|DELETE|UPDATE|INSERT|GRANT|REVOKE)[[:space:]]' "$check_file"; then
    fail "write statement found in read-only check $(basename "$check_file")"
  fi
done

rg -q 'altaira\.github\.provisioning\.enabled=\$\{GITHUB_PROVISIONING_ENABLED:false\}' \
  "$ROOT_DIR/backend/src/main/resources/application.properties" \
  || fail "GitHub provisioning no longer defaults to disabled"
rg -q 'altaira\.github\.dry-run=\$\{GITHUB_DRY_RUN:true\}' \
  "$ROOT_DIR/backend/src/main/resources/application.properties" \
  || fail "GitHub provisioning no longer defaults to dry-run"
rg -Uq 'plan\.isDryRun\(\),[[:space:]]*false,' \
  "$ROOT_DIR/backend/src/main/java/com/altaira/backend/service/ProvisioningPlanService.java" \
  || fail "ProvisioningPlanResponse no longer hard-codes executionAllowed=false"
PANEL_FILE="$ROOT_DIR/components/admin/ProvisioningPlanPanel.tsx"
if rg -q 'Confirm and provision' "$PANEL_FILE"; then
  rg -Uq '<button[\s\S]*?disabled[\s\S]*?Confirm and provision' "$PANEL_FILE" \
    || fail "Confirm and provision UI control exists without its disabled lock"
else
  rg -q '<CommercialFlowPanel' "$PANEL_FILE" \
    || fail "direct provisioning control is absent but the reviewed commercial gate was not found"
fi

echo "=== PROVISIONING ENGINE V2 PRODUCTION READINESS (LOCAL ONLY) ==="
echo "Migration checksums:"
verify_checksum "$LEAD_MIGRATION" "$EXPECTED_LEAD_SHA"
verify_checksum "$V1_MIGRATION" "$EXPECTED_V1_SHA"
verify_checksum "$V2_MIGRATION" "$EXPECTED_V2_SHA"
echo
echo "PASS: migration files match the reviewed rehearsal artifacts."
echo "PASS: pre/post SQL checks are read-only."
echo "PASS: provider execution defaults remain disabled/dry-run."
echo "PASS: executionAllowed=false and no enabled direct provisioning control is exposed."
echo "PRODUCTION DATABASE STATE: UNKNOWN (no connection was attempted)."
echo "RECOMMENDED ORDER IF PRECHECK SHOWS THE FULL CHAIN IS MISSING:"
echo "  1. lead-intake-conversion-migration.sql"
echo "  2. provisioning-engine-migration.sql"
echo "  3. provisioning-engine-v2-visibility-migration.sql"
echo "No migration command is implemented by this script."
