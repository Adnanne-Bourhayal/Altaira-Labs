#!/usr/bin/env bash
set -euo pipefail

umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_BASE="https://console.neon.tech/api/v2"
NEON_CONFIG="${ALTAIRA_NEON_RECOVERY_ENV:-/Volumes/T7/Altaira_Labs/.secrets/neon-provisioning-v2-rehearsal.env}"
DATABASE_CONFIG="${ALTAIRA_NEON_DATABASE_ENV:-/Volumes/T7/Altaira_Labs/.secrets/neon-render.env}"
RECOVERY_NAME="${ALTAIRA_NEON_RECOVERY_BRANCH_NAME:-recovery/provisioning-v2-$(date -u +%Y%m%dT%H%M%SZ)}"
CONFIRMATION="${ALTAIRA_NEON_RECOVERY_CONFIRMATION:-}"
WORK_DIR=""

fail() {
  echo "ABORT: $*" >&2
  exit 1
}

cleanup() {
  local status=$?
  if [[ -n "$WORK_DIR" && "$WORK_DIR" == *altaira-neon-recovery.* ]]; then
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
  local key="$2"
  local value
  value="$(awk -F= -v wanted="$key" '$1 == wanted {sub(/^[^=]*=/, ""); print; exit}' "$file")"
  trim "$value"
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
    /opt/homebrew/opt/postgresql@17/bin/psql; do
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

[[ "$CONFIRMATION" == "I_CONFIRM_CREATE_PRODUCTION_RECOVERY_BRANCH" ]] ||
  fail "set ALTAIRA_NEON_RECOVERY_CONFIRMATION=I_CONFIRM_CREATE_PRODUCTION_RECOVERY_BRANCH"
[[ -f "$NEON_CONFIG" ]] || fail "Neon control-plane config is missing"
[[ -f "$DATABASE_CONFIG" ]] || fail "database config is missing"
[[ "$NEON_CONFIG" != "$ROOT_DIR"/* && "$DATABASE_CONFIG" != "$ROOT_DIR"/* ]] ||
  fail "secret config must remain outside the repository"
[[ "$RECOVERY_NAME" =~ ^recovery/[A-Za-z0-9._/-]+$ ]] || fail "recovery branch name must start with recovery/"

for command_name in curl jq; do
  command -v "$command_name" >/dev/null 2>&1 || fail "$command_name is required"
done
PSQL_BIN="$(find_psql)"

NEON_API_KEY="$(read_value "$NEON_CONFIG" NEON_API_KEY)"
NEON_PROJECT_ID="$(read_value "$NEON_CONFIG" NEON_PROJECT_ID)"
NEON_PARENT_BRANCH_ID="$(read_value "$NEON_CONFIG" NEON_PARENT_BRANCH_ID)"
NEON_DATABASE_NAME="$(read_value "$NEON_CONFIG" NEON_DATABASE_NAME)"
NEON_ROLE_NAME="$(read_value "$NEON_CONFIG" NEON_ROLE_NAME)"
NEON_ROLE_PASSWORD="$(read_value "$NEON_CONFIG" NEON_ROLE_PASSWORD)"
PRODUCTION_URL="$(read_value "$DATABASE_CONFIG" SPRING_DATASOURCE_URL)"
PRODUCTION_HOST="$(extract_jdbc_host "$PRODUCTION_URL")"
if [[ -z "$NEON_ROLE_NAME" ]]; then
  NEON_ROLE_NAME="$(read_value "$DATABASE_CONFIG" SPRING_DATASOURCE_USERNAME)"
fi
if [[ -z "$NEON_ROLE_PASSWORD" ]]; then
  NEON_ROLE_PASSWORD="$(read_value "$DATABASE_CONFIG" SPRING_DATASOURCE_PASSWORD)"
fi

for variable in NEON_API_KEY NEON_PROJECT_ID NEON_PARENT_BRANCH_ID NEON_DATABASE_NAME NEON_ROLE_NAME NEON_ROLE_PASSWORD PRODUCTION_HOST; do
  [[ -n "${!variable:-}" ]] || fail "$variable is required"
done
[[ "$NEON_PARENT_BRANCH_ID" =~ ^br-[a-z0-9-]+$ ]] || fail "invalid parent branch ID"
[[ "$PRODUCTION_HOST" == *.neon.tech ]] || fail "production host is not a Neon host"
[[ -z "${DATABASE_URL:-}" && -z "${SPRING_DATASOURCE_URL:-}" ]] ||
  fail "inherited datasource variables are forbidden"

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/altaira-neon-recovery.XXXXXX")"
cat > "$WORK_DIR/curl.conf" <<EOF
silent
show-error
fail-with-body
header = "Accept: application/json"
header = "Authorization: Bearer $NEON_API_KEY"
connect-timeout = 15
max-time = 60
EOF

api_request GET "/projects/$NEON_PROJECT_ID" "$WORK_DIR/project.json"
api_request GET "/projects/$NEON_PROJECT_ID/branches/$NEON_PARENT_BRANCH_ID" "$WORK_DIR/parent.json"
api_request GET "/projects/$NEON_PROJECT_ID/endpoints" "$WORK_DIR/endpoints.json"

[[ "$(jq -r '.project.id // empty' "$WORK_DIR/project.json")" == "$NEON_PROJECT_ID" ]] || fail "project identity mismatch"
[[ "$(jq -r '.branch.id // empty' "$WORK_DIR/parent.json")" == "$NEON_PARENT_BRANCH_ID" ]] || fail "parent identity mismatch"
[[ "$(jq -r '.branch.primary // false' "$WORK_DIR/parent.json")" == "true" ]] || fail "configured parent is not primary"

endpoint_matches="$(jq -r --arg host "$PRODUCTION_HOST" '[.endpoints[] | select(.host == $host and .branch_id != null)] | length' "$WORK_DIR/endpoints.json")"
[[ "$endpoint_matches" == "1" ]] || fail "production endpoint was not uniquely identified"
endpoint_parent="$(jq -r --arg host "$PRODUCTION_HOST" '[.endpoints[] | select(.host == $host)][0].branch_id // empty' "$WORK_DIR/endpoints.json")"
[[ "$endpoint_parent" == "$NEON_PARENT_BRANCH_ID" ]] || fail "production endpoint is owned by a different branch"

encoded_name="$(jq -rn --arg value "$RECOVERY_NAME" '$value|@uri')"
api_request GET "/projects/$NEON_PROJECT_ID/branches?search=$encoded_name&limit=10000" "$WORK_DIR/branches.json"
match_count="$(jq -r --arg name "$RECOVERY_NAME" '[.branches[] | select(.name == $name)] | length' "$WORK_DIR/branches.json")"
[[ "$match_count" -le 1 ]] || fail "multiple branches use the recovery name"
RECOVERY_BRANCH_ID="$(jq -r --arg name "$RECOVERY_NAME" '[.branches[] | select(.name == $name)][0].id // empty' "$WORK_DIR/branches.json")"

if [[ -z "$RECOVERY_BRANCH_ID" ]]; then
  jq -n --arg name "$RECOVERY_NAME" --arg parent "$NEON_PARENT_BRANCH_ID" \
    '{branch:{name:$name,parent_id:$parent},endpoints:[{type:"read_write"}]}' > "$WORK_DIR/create.json"
  api_request POST "/projects/$NEON_PROJECT_ID/branches" "$WORK_DIR/created.json" "$WORK_DIR/create.json"
  RECOVERY_BRANCH_ID="$(jq -r '.branch.id // empty' "$WORK_DIR/created.json")"
  [[ -n "$RECOVERY_BRANCH_ID" ]] || fail "branch creation returned no branch ID"
  created="true"
else
  created="false"
fi

api_request GET "/projects/$NEON_PROJECT_ID/branches/$RECOVERY_BRANCH_ID" "$WORK_DIR/recovery.json"
api_request GET "/projects/$NEON_PROJECT_ID/branches/$RECOVERY_BRANCH_ID/endpoints" "$WORK_DIR/recovery-endpoints.json"

[[ "$(jq -r '.branch.name // empty' "$WORK_DIR/recovery.json")" == "$RECOVERY_NAME" ]] || fail "recovery name mismatch"
[[ "$(jq -r '.branch.parent_id // empty' "$WORK_DIR/recovery.json")" == "$NEON_PARENT_BRANCH_ID" ]] || fail "recovery parent mismatch"
[[ "$(jq -r '.branch.primary // false' "$WORK_DIR/recovery.json")" == "false" ]] || fail "recovery branch is primary"
[[ "$RECOVERY_BRANCH_ID" != "$NEON_PARENT_BRANCH_ID" ]] || fail "recovery and production branch IDs match"

RECOVERY_ENDPOINT_ID="$(jq -r '[.endpoints[] | select(.type == "read_write")][0].id // empty' "$WORK_DIR/recovery-endpoints.json")"
RECOVERY_HOST="$(jq -r '[.endpoints[] | select(.type == "read_write")][0].host // empty' "$WORK_DIR/recovery-endpoints.json")"
RECOVERY_ENDPOINT_BRANCH="$(jq -r '[.endpoints[] | select(.type == "read_write")][0].branch_id // empty' "$WORK_DIR/recovery-endpoints.json")"
[[ "$RECOVERY_ENDPOINT_BRANCH" == "$RECOVERY_BRANCH_ID" ]] || fail "recovery endpoint branch mismatch"
[[ "$RECOVERY_HOST" == *.neon.tech && "$RECOVERY_HOST" != "$PRODUCTION_HOST" ]] || fail "recovery host safety check failed"

snapshot="$(PGOPTIONS='-c default_transaction_read_only=on' PGPASSWORD="$NEON_ROLE_PASSWORD" "$PSQL_BIN" \
  -X -v ON_ERROR_STOP=1 -At \
  "host=$RECOVERY_HOST port=5432 dbname=$NEON_DATABASE_NAME user=$NEON_ROLE_NAME sslmode=require connect_timeout=15 application_name=altaira_recovery_verify" \
  -c "BEGIN TRANSACTION READ ONLY; SELECT concat_ws('|', current_setting('transaction_read_only'), (SELECT count(*) FROM public.leads), (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('lead_assessments','provisioning_plans','provisioning_plan_items','provisioning_selected_tools','provisioning_manual_steps','provisioning_external_resources'))); ROLLBACK;")"
snapshot="$(printf '%s\n' "$snapshot" | awk -F'|' '$1 == "on" {print; exit}')"
[[ -n "$snapshot" ]] || fail "read-only snapshot verification returned no result"
IFS='|' read -r read_only lead_count provisioning_table_count <<< "$snapshot"
[[ "$read_only" == "on" ]] || fail "recovery verification was not read-only"

echo "RECOVERY BRANCH: PASS"
echo "Created now: $created"
echo "Project: $(redact_id "$NEON_PROJECT_ID")"
echo "Production branch: $(redact_id "$NEON_PARENT_BRANCH_ID") (primary=true)"
echo "Production host: $(redact_host "$PRODUCTION_HOST")"
echo "Recovery name: $RECOVERY_NAME"
echo "Recovery branch: $(redact_id "$RECOVERY_BRANCH_ID") (primary=false)"
echo "Recovery endpoint: $(redact_id "$RECOVERY_ENDPOINT_ID")"
echo "Recovery host: $(redact_host "$RECOVERY_HOST")"
echo "Parent verified: true"
echo "Endpoint distinct from production: true"
echo "Read-only verification: true"
echo "Lead count in snapshot: $lead_count"
echo "Provisioning tables in snapshot: $provisioning_table_count"
echo "Retention action: retained; this script never deletes branches"
