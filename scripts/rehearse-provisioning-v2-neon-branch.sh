#!/usr/bin/env bash
set -euo pipefail

umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
LEAD_INTAKE_MIGRATION_FILE="$BACKEND_DIR/database/lead-intake-conversion-migration.sql"
PROVISIONING_V1_MIGRATION_FILE="$BACKEND_DIR/database/provisioning-engine-migration.sql"
PROVISIONING_V2_MIGRATION_FILE="$BACKEND_DIR/database/provisioning-engine-v2-visibility-migration.sql"
DEFAULT_CONFIG="/Volumes/T7/Altaira_Labs/.secrets/neon-provisioning-v2-rehearsal.env"
CONFIG_FILE="${ALTAIRA_NEON_REHEARSAL_ENV:-$DEFAULT_CONFIG}"
API_BASE="https://console.neon.tech/api/v2"
PRODUCTION_SECRETS="/Volumes/T7/Altaira_Labs/.secrets/neon-render.env"
BACKEND_PORT="${ALTAIRA_NEON_REHEARSAL_BACKEND_PORT:-18081}"
FIXTURE_LEAD_ID="00000000-0000-4000-8000-00000000e201"
FIXTURE_ASSESSMENT_ID="00000000-0000-4000-8000-00000000e202"
FIXTURE_PLAN_ID="00000000-0000-4000-8000-00000000e203"
V1_FIXTURE_LEAD_ID="00000000-0000-4000-8000-00000000e211"
V1_FIXTURE_ASSESSMENT_ID="00000000-0000-4000-8000-00000000e212"
V1_FIXTURE_PLAN_ID="00000000-0000-4000-8000-00000000e213"
WORK_DIR=""
BACKEND_PID=""

fail() {
  echo "ABORT: $*" >&2
  exit 1
}

cleanup() {
  local exit_code=$?
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$WORK_DIR" && "$WORK_DIR" == *altaira-neon-v2-rehearsal.* ]]; then
    rm -rf "$WORK_DIR"
  fi
  exit "$exit_code"
}

trap cleanup EXIT INT TERM

strip_optional_quotes() {
  local value="$1"
  if [[ ${#value} -ge 2 ]]; then
    if [[ "${value:0:1}" == '"' && "${value: -1}" == '"' ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "${value:0:1}" == "'" && "${value: -1}" == "'" ]]; then
      value="${value:1:${#value}-2}"
    fi
  fi
  printf '%s' "$value"
}

trim_surrounding_whitespace() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

load_config() {
  local key value
  [[ -f "$CONFIG_FILE" ]] || fail "rehearsal config is missing: $CONFIG_FILE"
  while IFS='=' read -r key value || [[ -n "$key" ]]; do
    key="${key%$'\r'}"
    value="${value%$'\r'}"
    [[ -z "$key" || "$key" == \#* ]] && continue
    case "$key" in
      NEON_API_KEY|NEON_PROJECT_ID|NEON_PARENT_BRANCH_ID|NEON_REHEARSAL_BRANCH_NAME|NEON_DATABASE_NAME|NEON_ROLE_NAME|NEON_REHEARSAL_CONFIRMATION)
        value="$(trim_surrounding_whitespace "$value")"
        value="$(strip_optional_quotes "$value")"
        printf -v "$key" '%s' "$value"
        ;;
      NEON_ROLE_PASSWORD)
        value="$(strip_optional_quotes "$value")"
        printf -v "$key" '%s' "$value"
        ;;
      *)
        fail "unsupported key in rehearsal config: $key"
        ;;
    esac
  done < "$CONFIG_FILE"
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

redact_name() {
  local value="$1"
  if [[ -z "$value" ]]; then
    printf '[redacted]'
  elif [[ ${#value} -le 2 ]]; then
    printf '%s***' "${value:0:1}"
  else
    printf '%s***' "${value:0:2}"
  fi
}

require_value() {
  local name="$1"
  [[ -n "${!name:-}" ]] || fail "$name is required in $CONFIG_FILE"
}

extract_jdbc_host() {
  local raw="$1"
  raw="${raw#jdbc:postgresql://}"
  raw="${raw#postgresql://}"
  raw="${raw#postgres://}"
  raw="${raw#*@}"
  raw="${raw%%/*}"
  raw="${raw%%\?*}"
  raw="${raw%%:*}"
  printf '%s' "$raw"
}

read_production_host() {
  local raw=""
  if [[ -f "$PRODUCTION_SECRETS" ]]; then
    raw="$(awk -F= '$1 == "SPRING_DATASOURCE_URL" {sub(/^[^=]*=/, ""); print; exit}' "$PRODUCTION_SECRETS")"
  fi
  extract_jdbc_host "$raw"
}

find_psql() {
  local candidate
  candidate="$(command -v psql || true)"
  if [[ -n "$candidate" ]]; then
    printf '%s' "$candidate"
    return
  fi
  for candidate in \
    /opt/homebrew/opt/postgresql@15/bin/psql \
    /opt/homebrew/opt/postgresql@16/bin/psql \
    /usr/local/opt/postgresql@15/bin/psql \
    /usr/local/opt/postgresql@16/bin/psql; do
    if [[ -x "$candidate" ]]; then
      printf '%s' "$candidate"
      return
    fi
  done
  fail "psql is required"
}

api_request() {
  local method="$1"
  local path="$2"
  local output="$3"
  local body_file="${4:-}"
  local args=(--config "$WORK_DIR/curl.conf" --request "$method" --output "$output" "$API_BASE$path")
  if [[ -n "$body_file" ]]; then
    args+=(--header "Content-Type: application/json" --data-binary "@$body_file")
  fi
  curl "${args[@]}"
}

psql_query() {
  PGPASSWORD="$NEON_ROLE_PASSWORD" "$PSQL_BIN" \
    -X -v ON_ERROR_STOP=1 -At \
    "host=$REHEARSAL_HOST port=5432 dbname=$NEON_DATABASE_NAME user=$NEON_ROLE_NAME sslmode=require connect_timeout=12 application_name=altaira_v2_rehearsal" \
    "$@"
}

safe_table_counts() {
  psql_query -c "
    SELECT concat_ws('|',
      (SELECT count(*) FROM public.leads),
      (SELECT count(*) FROM public.lead_assessments),
      (SELECT count(*) FROM public.provisioning_plans),
      (SELECT count(*) FROM public.provisioning_plan_items),
      (SELECT count(*) FROM public.provisioning_selected_tools),
      (SELECT count(*) FROM public.provisioning_manual_steps),
      (SELECT count(*) FROM public.provisioning_external_resources),
      (SELECT count(*) FROM public.services),
      (SELECT count(*) FROM public.app_users),
      (SELECT count(*) FROM public.security_events)
    );
  "
}

safe_core_counts() {
  psql_query -c "
    SELECT concat_ws('|',
      (SELECT count(*) FROM public.leads),
      (SELECT count(*) FROM public.services),
      (SELECT count(*) FROM public.app_users),
      (SELECT count(*) FROM public.security_events)
    );
  "
}

existing_schema_checksum() {
  psql_query -c "
    SELECT md5(COALESCE(string_agg(
      concat_ws('|', table_name, column_name, ordinal_position::text, data_type,
                is_nullable, COALESCE(column_default, '')), E'\\n'
      ORDER BY table_name, ordinal_position
    ), ''))
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name NOT IN (
        'lead_assessments', 'provisioning_plans', 'provisioning_plan_items',
        'provisioning_selected_tools', 'provisioning_manual_steps',
        'provisioning_external_resources'
      );
  "
}

original_plan_checksum() {
  psql_query -c "
    SELECT md5(COALESCE(string_agg(md5(row_to_json(source)::text), '' ORDER BY id::text), ''))
    FROM (
      SELECT id, lead_id, assessment_id, route_key, automation_level,
             automation_scope, status, dry_run, normalized_requirements_json,
             decision_reason, risks_json, cost_estimate, created_at, updated_at
      FROM public.provisioning_plans
      WHERE id <> '$FIXTURE_PLAN_ID'::uuid
      ORDER BY id
    ) source;
  "
}

load_config

for name in \
  NEON_API_KEY \
  NEON_PROJECT_ID \
  NEON_PARENT_BRANCH_ID \
  NEON_REHEARSAL_BRANCH_NAME \
  NEON_DATABASE_NAME \
  NEON_ROLE_NAME \
  NEON_REHEARSAL_CONFIRMATION; do
  require_value "$name"
done

[[ "$NEON_REHEARSAL_CONFIRMATION" == "I_CONFIRM_DISPOSABLE_BRANCH" ]] \
  || fail "NEON_REHEARSAL_CONFIRMATION must equal I_CONFIRM_DISPOSABLE_BRANCH"
[[ "$NEON_API_KEY" =~ ^[A-Za-z0-9_-]{20,}$ ]] || fail "invalid NEON_API_KEY format"
[[ "$NEON_PROJECT_ID" =~ ^[a-z0-9-]{1,60}$ ]] || fail "invalid NEON_PROJECT_ID"
[[ "$NEON_PARENT_BRANCH_ID" =~ ^br-[a-z0-9-]+$ ]] || fail "invalid NEON_PARENT_BRANCH_ID"
[[ "$NEON_DATABASE_NAME" =~ ^[A-Za-z_][A-Za-z0-9_-]{0,62}$ ]] || fail "invalid NEON_DATABASE_NAME"
[[ "$NEON_ROLE_NAME" =~ ^[A-Za-z_][A-Za-z0-9_-]{0,62}$ ]] || fail "invalid NEON_ROLE_NAME"
[[ "$NEON_REHEARSAL_BRANCH_NAME" =~ ^(test|rehearsal|disposable|preview)[/-][A-Za-z0-9._/-]+$ ]] \
  || fail "branch name must start with test/, rehearsal/, disposable/, or preview/"
[[ "$NEON_REHEARSAL_BRANCH_NAME" != "main" && "$NEON_REHEARSAL_BRANCH_NAME" != "production" ]] \
  || fail "production/default branch names are forbidden"
[[ "$BACKEND_PORT" =~ ^[0-9]+$ ]] || fail "invalid backend rehearsal port"

if [[ -n "${DATABASE_URL:-}" || -n "${SPRING_DATASOURCE_URL:-}" ]]; then
  fail "DATABASE_URL or SPRING_DATASOURCE_URL is already set; clear it before this isolated rehearsal"
fi

for command_name in curl jq java openssl; do
  command -v "$command_name" >/dev/null 2>&1 || fail "$command_name is required"
done
PSQL_BIN="$(find_psql)"
for migration_file in \
  "$LEAD_INTAKE_MIGRATION_FILE" \
  "$PROVISIONING_V1_MIGRATION_FILE" \
  "$PROVISIONING_V2_MIGRATION_FILE"; do
  [[ -f "$migration_file" ]] || fail "migration file is missing: $(basename "$migration_file")"
done

BACKEND_JAR="$(find "$BACKEND_DIR/target" -maxdepth 1 -type f -name 'backend-*.jar' ! -name '*.original' 2>/dev/null | head -n 1)"
[[ -n "$BACKEND_JAR" && -f "$BACKEND_JAR" ]] \
  || fail "packaged backend JAR is required before any branch write; run cd backend && ./mvnw package -DskipTests"

if lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  fail "backend rehearsal port $BACKEND_PORT is already in use"
fi

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/altaira-neon-v2-rehearsal.XXXXXX")"
cat > "$WORK_DIR/curl.conf" <<EOF
silent
show-error
fail-with-body
header = "Accept: application/json"
header = "Authorization: Bearer $NEON_API_KEY"
connect-timeout = 15
max-time = 60
EOF

echo "=== NEON PROVISIONING V2 REHEARSAL: CONTROL-PLANE PREFLIGHT ==="
echo "Project ID: $(redact_id "$NEON_PROJECT_ID")"
echo "Parent branch ID: $(redact_id "$NEON_PARENT_BRANCH_ID")"
echo "Requested disposable branch: $NEON_REHEARSAL_BRANCH_NAME"
echo "Authorized migration chain: lead intake -> provisioning v1 -> provisioning v2 -> provisioning v2"
echo "App provisioning providers: disabled; no GitHub/Jira/Drive/Vercel/Render/Stripe calls"

PRODUCTION_HOST="$(read_production_host)"
[[ -n "$PRODUCTION_HOST" ]] || fail "could not identify the protected production endpoint host"

api_request GET "/projects/$NEON_PROJECT_ID" "$WORK_DIR/project.json"
api_request GET "/projects/$NEON_PROJECT_ID/branches/$NEON_PARENT_BRANCH_ID" "$WORK_DIR/parent.json"
api_request GET "/projects/$NEON_PROJECT_ID/endpoints" "$WORK_DIR/project-endpoints.json"

[[ "$(jq -r '.project.id // empty' "$WORK_DIR/project.json")" == "$NEON_PROJECT_ID" ]] \
  || fail "Neon API project identity did not match"
[[ "$(jq -r '.branch.id // empty' "$WORK_DIR/parent.json")" == "$NEON_PARENT_BRANCH_ID" ]] \
  || fail "Neon API parent branch identity did not match"
PROJECT_NAME="$(jq -r '.project.name // empty' "$WORK_DIR/project.json")"
[[ -n "$PROJECT_NAME" ]] || fail "Neon API did not return a project name"
protected_endpoint_count="$(jq -r --arg host "$PRODUCTION_HOST" \
  '[.endpoints[] | select(.host == $host)] | length' "$WORK_DIR/project-endpoints.json")"
[[ "$protected_endpoint_count" == "1" ]] \
  || fail "protected production endpoint was not uniquely identified in the configured Neon project"
PROTECTED_PARENT_BRANCH_ID="$(jq -r --arg host "$PRODUCTION_HOST" \
  '[.endpoints[] | select(.host == $host)][0].branch_id // empty' "$WORK_DIR/project-endpoints.json")"
[[ -n "$PROTECTED_PARENT_BRANCH_ID" ]] || fail "protected endpoint did not expose an owning branch"
[[ "$PROTECTED_PARENT_BRANCH_ID" == "$NEON_PARENT_BRANCH_ID" ]] \
  || fail "configured parent branch does not own the protected production endpoint; no branch was created"
echo "Protected parent branch ID: $(redact_id "$PROTECTED_PARENT_BRANCH_ID")"
echo "PASS: configured parent branch owns the protected production endpoint."

encoded_branch_name="$(jq -rn --arg value "$NEON_REHEARSAL_BRANCH_NAME" '$value|@uri')"
api_request GET "/projects/$NEON_PROJECT_ID/branches?search=$encoded_branch_name&limit=10000" \
  "$WORK_DIR/branches.json"
REHEARSAL_BRANCH_ID="$(jq -r --arg name "$NEON_REHEARSAL_BRANCH_NAME" \
  '[.branches[] | select(.name == $name)] | if length == 1 then .[0].id else empty end' \
  "$WORK_DIR/branches.json")"
matching_branch_count="$(jq -r --arg name "$NEON_REHEARSAL_BRANCH_NAME" \
  '[.branches[] | select(.name == $name)] | length' "$WORK_DIR/branches.json")"
[[ "$matching_branch_count" -le 1 ]] || fail "multiple branches share the requested rehearsal name"

if [[ -z "$REHEARSAL_BRANCH_ID" ]]; then
  jq -n \
    --arg name "$NEON_REHEARSAL_BRANCH_NAME" \
    --arg parent "$NEON_PARENT_BRANCH_ID" \
    '{branch:{name:$name,parent_id:$parent},endpoints:[{type:"read_write"}]}' \
    > "$WORK_DIR/create-branch-body.json"
  if ! api_request POST "/projects/$NEON_PROJECT_ID/branches" \
    "$WORK_DIR/create-branch.json" "$WORK_DIR/create-branch-body.json"; then
    fail "branch creation request failed; inspect Neon manually before retrying because POST is not idempotent"
  fi
  REHEARSAL_BRANCH_ID="$(jq -r '.branch.id // empty' "$WORK_DIR/create-branch.json")"
  [[ -n "$REHEARSAL_BRANCH_ID" ]] || fail "Neon did not return a branch ID"
  echo "Disposable branch created."
else
  echo "Existing disposable branch with the exact rehearsal name will be reused."
fi

api_request GET "/projects/$NEON_PROJECT_ID/branches/$REHEARSAL_BRANCH_ID" "$WORK_DIR/branch.json"
actual_name="$(jq -r '.branch.name // empty' "$WORK_DIR/branch.json")"
actual_parent="$(jq -r '.branch.parent_id // empty' "$WORK_DIR/branch.json")"
is_primary="$(jq -r '.branch.primary // false' "$WORK_DIR/branch.json")"
[[ "$actual_name" == "$NEON_REHEARSAL_BRANCH_NAME" ]] || fail "branch name verification failed"
[[ "$actual_parent" == "$NEON_PARENT_BRANCH_ID" ]] || fail "branch parent verification failed"
[[ "$is_primary" == "false" ]] || fail "Neon reports this branch as primary; no SQL was executed"
[[ "$REHEARSAL_BRANCH_ID" != "$NEON_PARENT_BRANCH_ID" ]] || fail "target and parent branch IDs are identical"

api_request GET "/projects/$NEON_PROJECT_ID/branches/$REHEARSAL_BRANCH_ID/endpoints" "$WORK_DIR/endpoints.json"
endpoint_count="$(jq -r '[.endpoints[] | select(.type == "read_write")] | length' "$WORK_DIR/endpoints.json")"
[[ "$endpoint_count" == "1" ]] || fail "expected exactly one read-write endpoint for rehearsal branch"
REHEARSAL_ENDPOINT_ID="$(jq -r '[.endpoints[] | select(.type == "read_write")][0].id' "$WORK_DIR/endpoints.json")"
REHEARSAL_HOST="$(jq -r '[.endpoints[] | select(.type == "read_write")][0].host' "$WORK_DIR/endpoints.json")"
endpoint_branch="$(jq -r '[.endpoints[] | select(.type == "read_write")][0].branch_id' "$WORK_DIR/endpoints.json")"
[[ "$endpoint_branch" == "$REHEARSAL_BRANCH_ID" ]] || fail "endpoint belongs to a different branch"
[[ "$REHEARSAL_ENDPOINT_ID" =~ ^ep-[a-z0-9-]+$ ]] || fail "invalid endpoint ID returned by Neon"
[[ "$REHEARSAL_HOST" == "$REHEARSAL_ENDPOINT_ID".*.neon.tech ]] || fail "endpoint host/ID mismatch"
[[ "$REHEARSAL_HOST" != *-pooler.* ]] || fail "direct branch endpoint required; pooled endpoint refused"

[[ "$REHEARSAL_HOST" != "$PRODUCTION_HOST" ]] \
  || fail "rehearsal endpoint equals protected production endpoint; no SQL was executed"

echo "Branch ID: $(redact_id "$REHEARSAL_BRANCH_ID")"
echo "Endpoint ID: $(redact_id "$REHEARSAL_ENDPOINT_ID")"
echo "Endpoint host: $(redact_host "$REHEARSAL_HOST")"
echo "Project name: $(redact_name "$PROJECT_NAME")"
echo "PASS: Neon API proves target is non-primary, child branch, and uses a distinct endpoint."

if [[ -z "${NEON_ROLE_PASSWORD:-}" ]]; then
  encoded_role="$(jq -rn --arg value "$NEON_ROLE_NAME" '$value|@uri')"
  api_request GET "/projects/$NEON_PROJECT_ID/branches/$REHEARSAL_BRANCH_ID/roles/$encoded_role/reveal_password" \
    "$WORK_DIR/role-password.json"
  NEON_ROLE_PASSWORD="$(jq -r '.password // empty' "$WORK_DIR/role-password.json")"
fi
[[ -n "$NEON_ROLE_PASSWORD" ]] || fail "role password unavailable; set NEON_ROLE_PASSWORD in the rehearsal secret file"

connection_ok=false
for _ in {1..12}; do
  if psql_query -c "SELECT 1;" >/dev/null 2>&1; then
    connection_ok=true
    break
  fi
  sleep 5
done
[[ "$connection_ok" == "true" ]] || fail "could not connect to the verified disposable branch endpoint"

database_identity="$(psql_query -c "SELECT current_database();")"
[[ "$database_identity" == "$NEON_DATABASE_NAME" ]] || fail "connected database name did not match"
echo "Database: $database_identity"
echo "Schema: public"

missing_core_tables="$(psql_query -c "
  WITH expected(table_name) AS (
    VALUES ('leads'),('services'),('app_users'),('security_events')
  )
  SELECT COALESCE(string_agg(expected.table_name, ',' ORDER BY expected.table_name), '')
  FROM expected
  LEFT JOIN information_schema.tables actual
    ON actual.table_schema='public' AND actual.table_name=expected.table_name
  WHERE actual.table_name IS NULL;
")"
[[ -z "$missing_core_tables" ]] || fail "branch schema is missing core tables: $missing_core_tables"

provisioning_table_count_before="$(psql_query -c "
  SELECT count(*) FROM information_schema.tables
  WHERE table_schema='public' AND table_name IN (
    'lead_assessments', 'provisioning_plans', 'provisioning_plan_items',
    'provisioning_selected_tools', 'provisioning_manual_steps',
    'provisioning_external_resources'
  );
")"
[[ "$provisioning_table_count_before" == "0" ]] \
  || fail "authorized v1 tables already exist on the retained branch; use a fresh disposable branch for unambiguous evidence"

public_table_count_before="$(psql_query -c "
  SELECT count(*) FROM information_schema.tables
  WHERE table_schema='public' AND table_type='BASE TABLE';
")"
core_counts_before="$(safe_core_counts)"
existing_schema_checksum_before="$(existing_schema_checksum)"

echo "=== READ-ONLY BASELINE BEFORE AUTHORIZED CHAIN ==="
echo "Datasource: verified disposable Neon branch (not production)"
echo "Public base tables before: $public_table_count_before"
echo "provisioning_plans before: absent"
echo "provisioning_plans rows before: not applicable"
echo "Core table row counts captured internally; row values were not read or printed."

echo "=== APPLY AUTHORIZED V1 PREREQUISITES ==="
psql_query -1 -f "$LEAD_INTAKE_MIGRATION_FILE" >/dev/null
psql_query -1 -f "$PROVISIONING_V1_MIGRATION_FILE" >/dev/null

missing_v1_tables="$(psql_query -c "
  WITH expected(table_name) AS (
    VALUES
      ('lead_assessments'),('provisioning_plans'),('provisioning_plan_items'),
      ('provisioning_selected_tools'),('provisioning_manual_steps'),
      ('provisioning_external_resources')
  )
  SELECT COALESCE(string_agg(expected.table_name, ',' ORDER BY expected.table_name), '')
  FROM expected
  LEFT JOIN information_schema.tables actual
    ON actual.table_schema='public' AND actual.table_name=expected.table_name
  WHERE actual.table_name IS NULL;
")"
[[ -z "$missing_v1_tables" ]] || fail "authorized v1 chain did not create expected tables: $missing_v1_tables"

core_counts_after_v1="$(safe_core_counts)"
existing_schema_checksum_after_v1="$(existing_schema_checksum)"
[[ "$core_counts_after_v1" == "$core_counts_before" ]] \
  || fail "v1 prerequisite migrations changed a pre-existing core table row count"
[[ "$existing_schema_checksum_after_v1" == "$existing_schema_checksum_before" ]] \
  || fail "v1 prerequisite migrations changed a pre-existing table definition"

rows_before="$(psql_query -c "SELECT count(*) FROM public.provisioning_plans;")"
[[ "$rows_before" == "0" ]] \
  || fail "new provisioning_plans table was expected to be empty before fictional fixtures"

echo "PASS: public.provisioning_plans and all authorized v1 tables were created."
echo "PASS: existing schema fingerprint and core row counts remain unchanged."
echo "provisioning_plans rows after v1 creation: $rows_before"

echo "=== INSERT FICTIONAL V1 COMPATIBILITY FIXTURE ==="
psql_query >/dev/null <<SQL
BEGIN;

INSERT INTO public.leads (
  id, full_name, business_name, email, phone, industry, service_interest, goals, status, created_at
) VALUES (
  '$V1_FIXTURE_LEAD_ID', 'Neon V1 Compatibility Fixture', 'Altaira Rehearsal Only',
  'neon-v1-rehearsal@example.invalid', NULL, 'fictional', 'Legacy visibility rehearsal',
  'Validate v1 compatibility on a disposable branch only', 'new', now()
);

INSERT INTO public.lead_assessments (
  id, lead_id, form_key, schema_version, status, responses_json,
  recommended_services_json, qualification_summary, created_at, updated_at
) VALUES (
  '$V1_FIXTURE_ASSESSMENT_ID', '$V1_FIXTURE_LEAD_ID', 'general', 1, 'submitted',
  '{"businessGoal":"legacy migration rehearsal"}', '["web_seo"]',
  'Fictional v1 compatibility fixture', now(), now()
);

INSERT INTO public.provisioning_plans (
  id, lead_id, assessment_id, route_key, automation_level, automation_scope,
  status, dry_run, normalized_requirements_json, decision_reason, risks_json,
  cost_estimate, created_at, updated_at
) VALUES (
  '$V1_FIXTURE_PLAN_ID', '$V1_FIXTURE_LEAD_ID', '$V1_FIXTURE_ASSESSMENT_ID',
  'PROVISION_WEB_STATIC', 'A3', 'partial', 'draft', true,
  '{"requires_database":false}', 'Fictional v1 compatibility fixture.',
  '[]', 'No external spend', now(), now()
);

COMMIT;
SQL

columns_before="$(psql_query -c "
  SELECT string_agg(column_name, ',' ORDER BY ordinal_position)
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='provisioning_plans';
")"
base_columns_before="$(psql_query -c "
  SELECT string_agg(column_name, ',' ORDER BY ordinal_position)
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='provisioning_plans'
    AND column_name NOT IN ('tracks_json','shared_resources_json');
")"
column_count_before="$(psql_query -c "
  SELECT count(*) FROM information_schema.columns
  WHERE table_schema='public' AND table_name='provisioning_plans';
")"
column_state="$(psql_query -c "
  SELECT count(*)
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='provisioning_plans'
    AND column_name IN ('tracks_json','shared_resources_json');
")"
[[ "$column_state" == "0" ]] || fail "v2 visibility columns existed before the authorized v2 migration"

v1_count_before="$(psql_query -c "SELECT count(*) FROM public.provisioning_plans;")"
[[ "$v1_count_before" == "1" ]] || fail "expected exactly one fictional v1 compatibility plan"
checksum_before="$(original_plan_checksum)"
protected_counts_before_migration="$(safe_table_counts)"

echo "=== V1 BASELINE BEFORE V2 ==="
echo "provisioning_plans columns before: $columns_before"
echo "Fictional v1 plans before v2: $v1_count_before"
echo "No real client row values or identifiers were read or printed."

echo "=== APPLY V2 MIGRATION TWICE ==="
psql_query -f "$PROVISIONING_V2_MIGRATION_FILE" >/dev/null
psql_query -f "$PROVISIONING_V2_MIGRATION_FILE" >/dev/null

psql_query -c "
  DO \$verify\$
  DECLARE
    c record;
  BEGIN
    FOR c IN
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='provisioning_plans'
        AND column_name IN ('tracks_json','shared_resources_json')
    LOOP
      IF c.data_type <> 'text' OR c.is_nullable <> 'NO' OR c.column_default <> '''[]''::text' THEN
        RAISE EXCEPTION 'Unexpected v2 column definition for %', c.column_name;
      END IF;
    END LOOP;
    IF (SELECT count(*) FROM information_schema.columns
        WHERE table_schema='public' AND table_name='provisioning_plans'
          AND column_name IN ('tracks_json','shared_resources_json')) <> 2 THEN
      RAISE EXCEPTION 'Expected both v2 visibility columns';
    END IF;
  END
  \$verify\$;
" >/dev/null

rows_after_migration="$(psql_query -c "SELECT count(*) FROM public.provisioning_plans;")"
checksum_after_migration="$(original_plan_checksum)"
protected_counts_after_migration="$(safe_table_counts)"
[[ "$rows_after_migration" == "$v1_count_before" ]] || fail "migration changed the existing plan row count"
[[ "$checksum_after_migration" == "$checksum_before" ]] || fail "migration changed an original v1 plan value"
[[ "$protected_counts_after_migration" == "$protected_counts_before_migration" ]] \
  || fail "migration changed a protected table row count"

columns_after="$(psql_query -c "
  SELECT string_agg(column_name, ',' ORDER BY ordinal_position)
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='provisioning_plans';
")"
base_columns_after="$(psql_query -c "
  SELECT string_agg(column_name, ',' ORDER BY ordinal_position)
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='provisioning_plans'
    AND column_name NOT IN ('tracks_json','shared_resources_json');
")"
column_count_after="$(psql_query -c "
  SELECT count(*) FROM information_schema.columns
  WHERE table_schema='public' AND table_name='provisioning_plans';
")"
column_definitions_after="$(psql_query -c "
  SELECT string_agg(column_name || '|' || data_type || '|' || is_nullable || '|' || column_default, ',')
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='provisioning_plans'
    AND column_name IN ('tracks_json','shared_resources_json');
")"
expected_column_count_after=$((column_count_before + 2 - column_state))
[[ "$base_columns_after" == "$base_columns_before" ]] \
  || fail "migration changed a pre-existing provisioning_plans column"
[[ "$column_count_after" == "$expected_column_count_after" ]] \
  || fail "migration added or removed an unexpected provisioning_plans column"

empty_v1_rows_after="$(psql_query -c "
  SELECT count(*) FROM public.provisioning_plans
  WHERE id <> '$FIXTURE_PLAN_ID'::uuid
    AND tracks_json='[]' AND shared_resources_json='[]';
")"
[[ "$empty_v1_rows_after" == "$v1_count_before" ]] \
  || fail "migration did not preserve the complete v1 empty-array population"

v1_arrays="$(psql_query -c "
  SELECT tracks_json || '|' || shared_resources_json
  FROM public.provisioning_plans WHERE id='$V1_FIXTURE_PLAN_ID'::uuid;
")"
[[ "$v1_arrays" == "[]|[]" ]] || fail "existing v1 record did not receive compatible empty arrays"

echo "PASS: first and second migration execution completed."
echo "PASS: existing row count and original-column checksum are unchanged."
echo "provisioning_plans columns after: $columns_after"
echo "v2 column definitions: $column_definitions_after"
echo "provisioning_plans rows after migration: $rows_after_migration"
echo "PASS: protected table row counts are unchanged and only the two expected columns were added."
echo "PASS: all $v1_count_before existing v1 plans retain empty track/shared-resource arrays."
echo "PASS: an existing v1 record reads tracks=[] and sharedResources=[]."

echo "=== INSERT FICTIONAL V2 FIXTURE ==="
psql_query >/dev/null <<SQL
BEGIN;

DELETE FROM public.provisioning_plans WHERE id='$FIXTURE_PLAN_ID'::uuid;
DELETE FROM public.lead_assessments WHERE id='$FIXTURE_ASSESSMENT_ID'::uuid;
DELETE FROM public.leads WHERE id='$FIXTURE_LEAD_ID'::uuid;

INSERT INTO public.leads (
  id, full_name, business_name, email, phone, industry, service_interest, goals, status, created_at
) VALUES (
  '$FIXTURE_LEAD_ID', 'Neon V2 Rehearsal Fixture', 'Altaira Rehearsal Only',
  'neon-v2-rehearsal@example.invalid', NULL, 'fictional', 'Web visibility rehearsal',
  'Validate v2 JSON round-trip on a disposable branch only', 'new', now()
);

INSERT INTO public.lead_assessments (
  id, lead_id, form_key, schema_version, status, responses_json,
  recommended_services_json, qualification_summary, created_at, updated_at
) VALUES (
  '$FIXTURE_ASSESSMENT_ID', '$FIXTURE_LEAD_ID', 'general', 2, 'submitted',
  '{"businessGoal":"migration rehearsal"}', '["web_seo"]',
  'Fictional non-client fixture for additive migration rehearsal', now(), now()
);

INSERT INTO public.provisioning_plans (
  id, lead_id, assessment_id, route_key, automation_level, automation_scope,
  status, dry_run, normalized_requirements_json, decision_reason, risks_json,
  cost_estimate, tracks_json, shared_resources_json, created_at, updated_at
) VALUES (
  '$FIXTURE_PLAN_ID', '$FIXTURE_LEAD_ID', '$FIXTURE_ASSESSMENT_ID',
  'PROVISION_WEB_STATIC', 'A3', 'partial', 'draft', true,
  '{"requires_database":false,"requires_custom_development":false}',
  'Fictional Engine v2 rehearsal plan. No provider execution is allowed.',
  '["Disposable branch only"]', 'No external spend',
  '[{"track":"WEB","route":"PROVISION_WEB_STATIC","ruleId":"WEB-STATIC-V2-REHEARSAL","matchedSignals":["requires_static_site"],"reason":"Static delivery is sufficient for this fictional fixture.","confidence":0.91,"requiresManualDecision":false,"automationLevel":"A3","tools":[],"manualSteps":[],"risks":[]}]',
  '[{"key":"GITHUB","displayName":"GitHub","selectionState":"selected","automationLevel":"A3","required":true,"reason":"Shared source control decision only; no repository is created.","usedByTracks":["WEB"]}]',
  now(), now()
);

COMMIT;
SQL

round_trip="$(psql_query -c "
  SELECT (tracks_json::jsonb->0->>'track') || '|' ||
         (shared_resources_json::jsonb->0->>'key') || '|' ||
         dry_run::text || '|' || status
  FROM public.provisioning_plans WHERE id='$FIXTURE_PLAN_ID'::uuid;
")"
[[ "$round_trip" == "WEB|GITHUB|true|draft" ]] || fail "v2 JSON fixture did not round-trip"

external_id_count="$(psql_query -c "
  SELECT count(*) FROM public.provisioning_external_resources
  WHERE external_resource_id IS NOT NULL OR external_url IS NOT NULL;
")"
[[ "$external_id_count" == "0" ]] || fail "fixture unexpectedly contains an external resource ID or URL"

echo "PASS: fictional v2 fixture round-tripped as WEB + GITHUB, dry-run draft."
echo "PASS: external provider IDs/URLs created = 0."

echo "=== LOCAL BACKEND READ (READ-ONLY CONNECTION) ==="
counts_before_backend="$(safe_table_counts)"
INTERNAL_TEST_TOKEN="$(openssl rand -hex 32)"
BACKEND_LOG="$WORK_DIR/backend.log"
RESPONSE_FILE="$WORK_DIR/plan-response.json"

env \
  SPRING_CONFIG_IMPORT="optional:file:/dev/null" \
  PORT="$BACKEND_PORT" \
  INTERNAL_API_TOKEN="$INTERNAL_TEST_TOKEN" \
  SPRING_DATASOURCE_URL="jdbc:postgresql://$REHEARSAL_HOST:5432/$NEON_DATABASE_NAME?sslmode=require&options=-c%20default_transaction_read_only%3Don" \
  SPRING_DATASOURCE_USERNAME="$NEON_ROLE_NAME" \
  SPRING_DATASOURCE_PASSWORD="$NEON_ROLE_PASSWORD" \
  SPRING_DATASOURCE_HIKARI_READ_ONLY="true" \
  SPRING_JPA_HIBERNATE_DDL_AUTO="none" \
  SPRING_JPA_SHOW_SQL="false" \
  ALTAIRA_DEMO_ADMIN_ENABLED="false" \
  ALTAIRA_SERVICE_CATALOG_SEED_ENABLED="false" \
  CONTACT_EMAIL_ENABLED="false" \
  ONBOARDING_EMAIL_ENABLED="false" \
  CLIENT_CRM_ALERTS_ENABLED="false" \
  AWS_S3_ENABLED="false" \
  GITHUB_APP_ENABLED="false" \
  GITHUB_PROVISIONING_ENABLED="false" \
  GITHUB_DRY_RUN="true" \
  java -jar "$BACKEND_JAR" >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

backend_ready=false
for _ in {1..60}; do
  if curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/v1/health" >/dev/null 2>&1; then
    backend_ready=true
    break
  fi
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    break
  fi
  sleep 1
done

if [[ "$backend_ready" != "true" ]]; then
  fail "local backend did not become healthy; startup log was withheld to prevent accidental secret disclosure"
fi

curl -fsS \
  -H "X-Internal-API-Token: $INTERNAL_TEST_TOKEN" \
  "http://127.0.0.1:$BACKEND_PORT/api/v1/provisioning-plans/$FIXTURE_PLAN_ID" \
  > "$RESPONSE_FILE"

jq -e '
  .dryRun == true and
  .executionAllowed == false and
  .status == "draft" and
  .tracks[0].track == "WEB" and
  .sharedResources[0].key == "GITHUB" and
  (.externalResources | length) == 0
' "$RESPONSE_FILE" >/dev/null || fail "backend response did not preserve v2 visibility/blocking contract"

kill "$BACKEND_PID" 2>/dev/null || true
wait "$BACKEND_PID" 2>/dev/null || true
BACKEND_PID=""

counts_after_backend="$(safe_table_counts)"
[[ "$counts_after_backend" == "$counts_before_backend" ]] \
  || fail "local backend read changed one or more protected table counts"
[[ "$(original_plan_checksum)" == "$checksum_before" ]] \
  || fail "a pre-existing provisioning plan changed during rehearsal"

echo "PASS: local backend read Engine v2 track/shared resource fields."
echo "PASS: executionAllowed=false and external resource IDs/URLs=0."
echo "PASS: backend used a PostgreSQL read-only session and table counts did not change."
echo "PASS: Confirm and provision remains unavailable; no execution endpoint was called."
echo "Branch retained for evidence review: $NEON_REHEARSAL_BRANCH_NAME"
echo "REHEARSAL PASS: migration is ready for review, not for production application."
