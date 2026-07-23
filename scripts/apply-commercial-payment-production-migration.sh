#!/usr/bin/env bash
set -euo pipefail

umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATION="$ROOT_DIR/backend/database/commercial-payment-provisioning-migration.sql"
PREPARE_SCRIPT="$ROOT_DIR/scripts/prepare-commercial-payment-production-checks.sh"
READINESS_SCRIPT="$ROOT_DIR/scripts/check-commercial-payment-production-readiness.sh"
EXPECTED_MIGRATION_SHA="a46d5870884bbc3c3b0226feacaf17227160cd84933cf25b60b83b7653d68e71"
API_BASE="https://console.neon.tech/api/v2"
MODE="${1:-}"
DATABASE_CONFIG="${ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV:-}"
NEON_CONFIG="${ALTAIRA_NEON_RECOVERY_ENV:-}"
RECOVERY_NAME="${ALTAIRA_NEON_RECOVERY_BRANCH_NAME:-}"
CONFIRMATION="${ALTAIRA_COMMERCIAL_PRODUCTION_MIGRATION_CONFIRMATION:-}"
WORK_DIR=""

fail() {
  echo "COMMERCIAL MIGRATION ABORT: $*" >&2
  exit 1
}

cleanup() {
  local status=$?
  if [[ -n "$WORK_DIR" && "$WORK_DIR" == *altaira-commercial-migration.* ]]; then
    rm -rf "$WORK_DIR"
  fi
  exit "$status"
}

trap cleanup EXIT INT TERM

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  if [[ ${#value} -ge 2 ]]; then
    if [[ "${value:0:1}" == '"' && "${value: -1}" == '"' ]] ||
       [[ "${value:0:1}" == "'" && "${value: -1}" == "'" ]]; then
      value="${value:1:${#value}-2}"
    fi
  fi
  printf '%s' "$value"
}

read_value() {
  local file="$1"
  local wanted="$2"
  local key value
  while IFS='=' read -r key value || [[ -n "${key:-}" ]]; do
    key="${key%$'\r'}"
    value="${value%$'\r'}"
    [[ -z "$key" || "$key" == \#* ]] && continue
    [[ "$key" == "$wanted" ]] || continue
    trim "$value"
    return 0
  done < "$file"
  return 1
}

redact_id() {
  local value="$1"
  if [[ ${#value} -le 10 ]]; then
    printf '[redacted]'
  else
    printf '%s...%s' "${value:0:5}" "${value: -4}"
  fi
}

redact_host() {
  local value="$1"
  local first="${value%%.*}"
  printf '%s...%s.neon.tech' "${first:0:5}" "${first: -4}"
}

extract_jdbc_parts() {
  local raw="$1"
  local connection authority database_and_query
  [[ "$raw" == jdbc:postgresql://* ]] || fail "only a JDBC PostgreSQL URL is supported"
  connection="${raw#jdbc:postgresql://}"
  authority="${connection%%/*}"
  database_and_query="${connection#*/}"
  [[ "$authority" != *'@'* ]] || fail "credentials must not be embedded in the datasource URL"
  DATABASE_HOST="${authority%%:*}"
  if [[ "$authority" == *:* ]]; then
    DATABASE_PORT="${authority##*:}"
  else
    DATABASE_PORT="5432"
  fi
  DATABASE_NAME="${database_and_query%%\?*}"
  [[ "$DATABASE_HOST" == *.neon.tech ]] || fail "target host is not a Neon endpoint"
  [[ "$DATABASE_PORT" =~ ^[0-9]+$ ]] || fail "invalid database port"
  [[ "$DATABASE_NAME" =~ ^[A-Za-z_][A-Za-z0-9_-]{0,62}$ ]] || fail "invalid database name"
  [[ "$database_and_query" == *"sslmode=require"* ]] || fail "sslmode=require is mandatory"
}

api_request() {
  local path="$1"
  local output="$2"
  curl --config "$WORK_DIR/curl.conf" --request GET --output "$output" "$API_BASE$path"
}

snapshot_database() {
  local host="$1"
  local port="$2"
  local database="$3"
  local user="$4"
  local password="$5"
  local app_name="$6"
  PGPASSWORD="$password" \
  PGOPTIONS="-c default_transaction_read_only=on -c statement_timeout=15000 -c lock_timeout=3000" \
    "$PSQL_BIN" -X -v ON_ERROR_STOP=1 -At \
    "host=$host port=$port dbname=$database user=$user sslmode=require connect_timeout=10 application_name=$app_name" \
    -c "BEGIN TRANSACTION READ ONLY;
        SELECT concat_ws('|',
          current_setting('transaction_read_only'),
          (SELECT count(*) FROM information_schema.tables
             WHERE table_schema='public'
               AND table_name IN ('leads','clients','client_services','client_workspaces','provisioning_plans')),
          (SELECT count(*) FROM information_schema.tables
             WHERE table_schema='public'
               AND table_name IN ('commercial_flows','commercial_payment_sessions','commercial_payment_events','commercial_email_logs','provisioning_runs','provisioning_steps')),
          (SELECT count(*) FROM public.leads),
          (SELECT count(*) FROM public.clients),
          (SELECT count(*) FROM public.client_services),
          (SELECT count(*) FROM public.client_workspaces),
          (SELECT count(*) FROM public.provisioning_plans)
        );
        ROLLBACK;" |
    awk -F'|' '$1 == "on" {print; exit}'
}

"$PREPARE_SCRIPT" >/dev/null

if [[ -z "$MODE" ]]; then
  echo "COMMERCIAL PRODUCTION MIGRATION: LOCAL PLAN ONLY"
  echo "PASS: reviewed migration checksum and read-only checks are valid."
  echo "No database or Neon API connection was attempted."
  echo "Use --apply-production only after a fresh recovery branch and explicit authorization."
  exit 0
fi

[[ "$MODE" == "--apply-production" ]] ||
  fail "usage: $0 [--apply-production]"
[[ "$CONFIRMATION" == "I_CONFIRM_APPLY_COMMERCIAL_PAYMENT_PRODUCTION_MIGRATION" ]] ||
  fail "invalid or missing production migration confirmation"
[[ -z "${DATABASE_URL:-}" && -z "${SPRING_DATASOURCE_URL:-}" ]] ||
  fail "inherited datasource variables are forbidden"
[[ -n "$DATABASE_CONFIG" && -f "$DATABASE_CONFIG" ]] ||
  fail "ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV must reference an existing file"
[[ -n "$NEON_CONFIG" && -f "$NEON_CONFIG" ]] ||
  fail "ALTAIRA_NEON_RECOVERY_ENV must reference an existing file"
[[ "$DATABASE_CONFIG" != "$ROOT_DIR"/* && "$NEON_CONFIG" != "$ROOT_DIR"/* ]] ||
  fail "secret config must remain outside the repository"
[[ "$RECOVERY_NAME" =~ ^recovery/[A-Za-z0-9._/-]+$ ]] ||
  fail "ALTAIRA_NEON_RECOVERY_BRANCH_NAME must identify a recovery/ branch"
[[ "$(shasum -a 256 "$MIGRATION" | awk '{print $1}')" == "$EXPECTED_MIGRATION_SHA" ]] ||
  fail "commercial migration checksum changed"

for command_name in curl jq psql; do
  command -v "$command_name" >/dev/null 2>&1 || fail "$command_name is required"
done
PSQL_BIN="$(command -v psql)"

JDBC_URL="$(read_value "$DATABASE_CONFIG" SPRING_DATASOURCE_URL)"
DATABASE_USER="$(read_value "$DATABASE_CONFIG" SPRING_DATASOURCE_USERNAME)"
DATABASE_PASSWORD="$(read_value "$DATABASE_CONFIG" SPRING_DATASOURCE_PASSWORD)"
EXPECTED_PRODUCTION_HOST="$(read_value "$DATABASE_CONFIG" ALTAIRA_EXPECTED_PRODUCTION_HOST)"
READ_ONLY_CONFIRMATION="$(read_value "$DATABASE_CONFIG" ALTAIRA_COMMERCIAL_PRODUCTION_READ_ONLY_CONFIRMATION)"
NEON_API_KEY="$(read_value "$NEON_CONFIG" NEON_API_KEY)"
NEON_PROJECT_ID="$(read_value "$NEON_CONFIG" NEON_PROJECT_ID)"
PRODUCTION_BRANCH_ID="$(read_value "$NEON_CONFIG" NEON_PARENT_BRANCH_ID)"
RECOVERY_DATABASE_NAME="$(read_value "$NEON_CONFIG" NEON_DATABASE_NAME || true)"
RECOVERY_ROLE_NAME="$(read_value "$NEON_CONFIG" NEON_ROLE_NAME || true)"
RECOVERY_ROLE_PASSWORD="$(read_value "$NEON_CONFIG" NEON_ROLE_PASSWORD || true)"

for variable in \
  JDBC_URL DATABASE_USER DATABASE_PASSWORD EXPECTED_PRODUCTION_HOST \
  NEON_API_KEY NEON_PROJECT_ID PRODUCTION_BRANCH_ID; do
  [[ -n "${!variable:-}" ]] || fail "$variable is required"
done
[[ "$READ_ONLY_CONFIRMATION" == "I_CONFIRM_READ_ONLY_COMMERCIAL_PRODUCTION_PREFLIGHT" ]] ||
  fail "read-only readiness confirmation is invalid"
[[ "$PRODUCTION_BRANCH_ID" =~ ^br-[a-z0-9-]+$ ]] || fail "invalid production branch ID"

DATABASE_HOST=""
DATABASE_PORT=""
DATABASE_NAME=""
extract_jdbc_parts "$JDBC_URL"
[[ "$DATABASE_HOST" == "$EXPECTED_PRODUCTION_HOST" ]] ||
  fail "datasource host does not match the independently confirmed production host"

# A direct Neon child branch inherits its databases, roles and role passwords. Reuse
# the verified production connection values when the control-plane file omits them,
# avoiding unnecessary duplicate copies of the database password.
RECOVERY_DATABASE_NAME="${RECOVERY_DATABASE_NAME:-$DATABASE_NAME}"
RECOVERY_ROLE_NAME="${RECOVERY_ROLE_NAME:-$DATABASE_USER}"
RECOVERY_ROLE_PASSWORD="${RECOVERY_ROLE_PASSWORD:-$DATABASE_PASSWORD}"

for variable in RECOVERY_DATABASE_NAME RECOVERY_ROLE_NAME RECOVERY_ROLE_PASSWORD; do
  [[ -n "${!variable:-}" ]] || fail "$variable is required for recovery verification"
done

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/altaira-commercial-migration.XXXXXX")"
cat > "$WORK_DIR/curl.conf" <<EOF
silent
show-error
fail-with-body
header = "Accept: application/json"
header = "Authorization: Bearer $NEON_API_KEY"
connect-timeout = 10
max-time = 30
EOF

api_request "/projects/$NEON_PROJECT_ID/branches/$PRODUCTION_BRANCH_ID" "$WORK_DIR/production-branch.json"
api_request "/projects/$NEON_PROJECT_ID/endpoints" "$WORK_DIR/project-endpoints.json"
encoded_name="$(jq -rn --arg value "$RECOVERY_NAME" '$value|@uri')"
api_request "/projects/$NEON_PROJECT_ID/branches?search=$encoded_name&limit=10000" "$WORK_DIR/branches.json"

[[ "$(jq -r '.branch.id // empty' "$WORK_DIR/production-branch.json")" == "$PRODUCTION_BRANCH_ID" ]] ||
  fail "production branch identity mismatch"
[[ "$(jq -r '.branch.primary // false' "$WORK_DIR/production-branch.json")" == "true" ]] ||
  fail "configured production branch is not primary"
endpoint_matches="$(jq -r --arg host "$DATABASE_HOST" '[.endpoints[] | select(.host == $host)] | length' "$WORK_DIR/project-endpoints.json")"
[[ "$endpoint_matches" == "1" ]] || fail "production endpoint was not uniquely identified"
[[ "$(jq -r --arg host "$DATABASE_HOST" '[.endpoints[] | select(.host == $host)][0].branch_id // empty' "$WORK_DIR/project-endpoints.json")" == "$PRODUCTION_BRANCH_ID" ]] ||
  fail "production endpoint belongs to a different branch"

recovery_matches="$(jq -r --arg name "$RECOVERY_NAME" '[.branches[] | select(.name == $name)] | length' "$WORK_DIR/branches.json")"
[[ "$recovery_matches" == "1" ]] || fail "recovery branch was not uniquely identified"
RECOVERY_BRANCH_ID="$(jq -r --arg name "$RECOVERY_NAME" '[.branches[] | select(.name == $name)][0].id' "$WORK_DIR/branches.json")"
api_request "/projects/$NEON_PROJECT_ID/branches/$RECOVERY_BRANCH_ID" "$WORK_DIR/recovery-branch.json"
api_request "/projects/$NEON_PROJECT_ID/branches/$RECOVERY_BRANCH_ID/endpoints" "$WORK_DIR/recovery-endpoints.json"

[[ "$RECOVERY_BRANCH_ID" != "$PRODUCTION_BRANCH_ID" ]] || fail "recovery and production branch IDs match"
[[ "$(jq -r '.branch.parent_id // empty' "$WORK_DIR/recovery-branch.json")" == "$PRODUCTION_BRANCH_ID" ]] ||
  fail "recovery branch is not a direct child of production"
[[ "$(jq -r '.branch.primary // false' "$WORK_DIR/recovery-branch.json")" == "false" ]] ||
  fail "recovery branch is primary"
RECOVERY_HOST="$(jq -r '[.endpoints[] | select(.type == "read_write")][0].host // empty' "$WORK_DIR/recovery-endpoints.json")"
RECOVERY_ENDPOINT_BRANCH="$(jq -r '[.endpoints[] | select(.type == "read_write")][0].branch_id // empty' "$WORK_DIR/recovery-endpoints.json")"
[[ "$RECOVERY_ENDPOINT_BRANCH" == "$RECOVERY_BRANCH_ID" ]] || fail "recovery endpoint branch mismatch"
[[ "$RECOVERY_HOST" == *.neon.tech && "$RECOVERY_HOST" != "$DATABASE_HOST" ]] ||
  fail "recovery endpoint safety check failed"

PRODUCTION_SNAPSHOT="$(snapshot_database "$DATABASE_HOST" "$DATABASE_PORT" "$DATABASE_NAME" "$DATABASE_USER" "$DATABASE_PASSWORD" "altaira_commercial_pre_migration")"
RECOVERY_SNAPSHOT="$(snapshot_database "$RECOVERY_HOST" "5432" "$RECOVERY_DATABASE_NAME" "$RECOVERY_ROLE_NAME" "$RECOVERY_ROLE_PASSWORD" "altaira_commercial_recovery_verify")"
[[ -n "$PRODUCTION_SNAPSHOT" && -n "$RECOVERY_SNAPSHOT" ]] || fail "database snapshot verification returned no result"
[[ "$PRODUCTION_SNAPSHOT" == "$RECOVERY_SNAPSHOT" ]] ||
  fail "recovery snapshot does not match current production counts/schema"
IFS='|' read -r read_only dependency_count commercial_count lead_count client_count service_count workspace_count plan_count <<< "$PRODUCTION_SNAPSHOT"
[[ "$read_only" == "on" ]] || fail "pre-migration snapshot was not read-only"
[[ "$dependency_count" == "5" ]] || fail "required dependency tables are incomplete"
[[ "$commercial_count" == "0" ]] || fail "commercial schema is not fully absent; abort for manual review"

echo "=== COMMERCIAL PRODUCTION MIGRATION: VERIFIED WRITE WINDOW ==="
echo "Production branch: $(redact_id "$PRODUCTION_BRANCH_ID") (primary=true)"
echo "Production host: $(redact_host "$DATABASE_HOST")"
echo "Recovery branch: $(redact_id "$RECOVERY_BRANCH_ID") (primary=false)"
echo "Recovery host: $(redact_host "$RECOVERY_HOST")"
echo "Recovery snapshot matches production: true"
echo "Dependency tables: $dependency_count"
echo "Commercial tables before: $commercial_count"
echo "Rows before: leads=$lead_count clients=$client_count services=$service_count workspaces=$workspace_count plans=$plan_count"

env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
  ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV="$DATABASE_CONFIG" \
  "$READINESS_SCRIPT" --database-read-only-precheck

PGPASSWORD="$DATABASE_PASSWORD" \
PGOPTIONS="-c statement_timeout=60000 -c lock_timeout=5000" \
  "$PSQL_BIN" -X -v ON_ERROR_STOP=1 --single-transaction \
  "host=$DATABASE_HOST port=$DATABASE_PORT dbname=$DATABASE_NAME user=$DATABASE_USER sslmode=require connect_timeout=10 application_name=altaira_commercial_schema_migration" \
  -f "$MIGRATION"

env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
  ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV="$DATABASE_CONFIG" \
  "$READINESS_SCRIPT" --database-read-only-postcheck

echo "PASS: commercial migration committed atomically and the read-only postcheck passed."
echo "No deploy, provider execution, Stripe live call or Confirm and provision action was performed."
