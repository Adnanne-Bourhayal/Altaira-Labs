#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT_DIR/scripts/rehearse-provisioning-v2-neon-branch.sh"
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/altaira-neon-flow-test.XXXXXX")"
FAKE_BIN="$TEMP_DIR/bin"
STATE_DIR="$TEMP_DIR/state"
CONFIG="$TEMP_DIR/rehearsal.env"
OUTPUT="$TEMP_DIR/output.log"

cleanup() {
  local exit_code=$?
  if [[ $exit_code -ne 0 && -f "$OUTPUT" ]]; then
    sed -n '1,160p' "$OUTPUT" >&2
  fi
  rm -rf "$TEMP_DIR"
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

mkdir -p "$FAKE_BIN" "$STATE_DIR"

cat > "$CONFIG" <<'EOF'
NEON_API_KEY= aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
NEON_PROJECT_ID=project-flow-test
NEON_PARENT_BRANCH_ID=br-parent-flow
NEON_REHEARSAL_BRANCH_NAME=test/provisioning-v2-flow
NEON_DATABASE_NAME=neondb
NEON_ROLE_NAME=neondb_owner
NEON_REHEARSAL_CONFIRMATION=I_CONFIRM_DISPOSABLE_BRANCH
EOF

cat > "$FAKE_BIN/curl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
output=""
url=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --output) output="$2"; shift 2 ;;
    http://*|https://*) url="$1"; shift ;;
    *) shift ;;
  esac
done

write_response() {
  if [[ -n "$output" ]]; then
    printf '%s' "$1" > "$output"
  else
    printf '%s' "$1"
  fi
}

case "$url" in
  */projects/project-flow-test/endpoints)
    write_response "{\"endpoints\":[{\"id\":\"ep-protected\",\"host\":\"$MOCK_PRODUCTION_HOST\",\"branch_id\":\"br-parent-flow\",\"type\":\"read_write\"}]}"
    ;;
  */projects/project-flow-test)
    write_response '{"project":{"id":"project-flow-test","name":"Disposable Flow Test"}}'
    ;;
  */branches/br-parent-flow)
    write_response '{"branch":{"id":"br-parent-flow","name":"main","primary":true}}'
    ;;
  *'/branches?search='*)
    write_response '{"branches":[{"id":"br-target-flow","name":"test/provisioning-v2-flow","parent_id":"br-parent-flow","primary":false}]}'
    ;;
  */branches/br-target-flow/endpoints)
    write_response '{"endpoints":[{"id":"ep-flow-test","host":"ep-flow-test.eu-central-1.aws.neon.tech","branch_id":"br-target-flow","type":"read_write"}]}'
    ;;
  */branches/br-target-flow/roles/neondb_owner/reveal_password)
    write_response '{"password":"mock-password-only"}'
    ;;
  */branches/br-target-flow)
    write_response '{"branch":{"id":"br-target-flow","name":"test/provisioning-v2-flow","parent_id":"br-parent-flow","primary":false}}'
    ;;
  http://127.0.0.1:18081/api/v1/health)
    write_response '{"status":"UP"}'
    ;;
  http://127.0.0.1:18081/api/v1/provisioning-plans/00000000-0000-4000-8000-00000000e203)
    write_response '{"status":"draft","dryRun":true,"executionAllowed":false,"tracks":[{"track":"WEB"}],"sharedResources":[{"key":"GITHUB"}],"externalResources":[]}'
    ;;
  *)
    printf 'Unexpected mock curl URL: %s\n' "$url" >&2
    exit 90
    ;;
esac
MOCK

cat > "$FAKE_BIN/psql" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
query="$*"
stdin_payload="$(cat || true)"
query="$query $stdin_payload"
base_columns="id,lead_id,assessment_id,route_key,automation_level,automation_scope,status,dry_run,normalized_requirements_json,decision_reason,risks_json,cost_estimate,created_at,updated_at"

if [[ "$query" == *"-f "*"provisioning-engine-v2-visibility-migration.sql"* ]]; then
  touch "$MOCK_STATE_DIR/v2_migrated"
elif [[ "$query" == *"-f "*"lead-intake-conversion-migration.sql"* ||
        "$query" == *"-f "*"provisioning-engine-migration.sql"* ]]; then
  touch "$MOCK_STATE_DIR/v1_schema"
elif [[ "$query" == *"SELECT 1;"* ]]; then
  echo 1
elif [[ "$query" == *"SELECT current_database();"* ]]; then
  echo neondb
elif [[ "$query" == *"information_schema.tables"* && "$query" == *"WITH expected(table_name)"* ]]; then
  :
elif [[ "$query" == *"FROM information_schema.tables"* && "$query" == *"lead_assessments"* ]]; then
  [[ -f "$MOCK_STATE_DIR/v1_schema" ]] && echo 6 || echo 0
elif [[ "$query" == *"table_type='BASE TABLE'"* ]]; then
  echo 14
elif [[ "$query" == *"FROM information_schema.columns"* && "$query" == *"table_name NOT IN"* ]]; then
  echo stable-existing-schema-checksum
elif [[ "$query" == *"string_agg(column_name"* && "$query" == *"NOT IN ('tracks_json','shared_resources_json')"* ]]; then
  echo "$base_columns"
elif [[ "$query" == *"string_agg(column_name || '|'"* ]]; then
  echo "shared_resources_json|text|NO|'[]'::text,tracks_json|text|NO|'[]'::text"
elif [[ "$query" == *"string_agg(column_name"* ]]; then
  if [[ -f "$MOCK_STATE_DIR/v2_migrated" ]]; then
    echo "$base_columns,tracks_json,shared_resources_json"
  else
    echo "$base_columns"
  fi
elif [[ "$query" == *"FROM information_schema.columns"* && "$query" == *"column_name IN ('tracks_json','shared_resources_json')"* ]]; then
  [[ -f "$MOCK_STATE_DIR/v2_migrated" ]] && echo 2 || echo 0
elif [[ "$query" == *"FROM information_schema.columns"* && "$query" == *"count(*)"* ]]; then
  [[ -f "$MOCK_STATE_DIR/v2_migrated" ]] && echo 16 || echo 14
elif [[ "$query" == *"SELECT md5("* ]]; then
  echo stable-original-plan-checksum
elif [[ "$query" == *"tracks_json || '|' || shared_resources_json"* ]]; then
  echo '[]|[]'
elif [[ "$query" == *"tracks_json='[]' AND shared_resources_json='[]'"* ]]; then
  echo 1
elif [[ "$query" == *"tracks_json::jsonb"* ]]; then
  echo 'WEB|GITHUB|true|draft'
elif [[ "$query" == *"external_resource_id IS NOT NULL"* ]]; then
  echo 0
elif [[ "$query" == *"concat_ws('|',"* && "$query" == *"lead_assessments"* ]]; then
  if [[ -f "$MOCK_STATE_DIR/v2_fixture" ]]; then
    echo '2|2|2|0|0|0|0|1|1|0'
  else
    echo '1|1|1|0|0|0|0|1|1|0'
  fi
elif [[ "$query" == *"concat_ws('|',"* ]]; then
  [[ -f "$MOCK_STATE_DIR/v1_fixture" ]] && echo '2|1|1|0' || echo '1|1|1|0'
elif [[ "$query" == *"INSERT INTO public.leads"* && "$query" == *"Neon V1 Compatibility Fixture"* ]]; then
  touch "$MOCK_STATE_DIR/v1_fixture"
elif [[ "$query" == *"INSERT INTO public.leads"* && "$query" == *"Neon V2 Rehearsal Fixture"* ]]; then
  touch "$MOCK_STATE_DIR/v2_fixture"
elif [[ "$query" == *"FROM public.provisioning_plans"* && "$query" == *"count(*)"* ]]; then
  if [[ -f "$MOCK_STATE_DIR/v1_fixture" ]]; then echo 1; else echo 0; fi
elif [[ "$query" == *"DO \$verify\$"* ]]; then
  :
else
  printf 'Unexpected mock psql query: %.240s\n' "$query" >&2
  exit 91
fi
MOCK

cat > "$FAKE_BIN/java" <<'MOCK'
#!/usr/bin/env bash
trap 'exit 0' TERM INT
while :; do sleep 1; done
MOCK

cat > "$FAKE_BIN/openssl" <<'MOCK'
#!/usr/bin/env bash
printf '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\n'
MOCK

cat > "$FAKE_BIN/lsof" <<'MOCK'
#!/usr/bin/env bash
exit 1
MOCK

chmod +x "$FAKE_BIN"/*

production_host="$(awk -F= '$1 == "SPRING_DATASOURCE_URL" {sub(/^[^=]*=/, ""); print; exit}' \
  /Volumes/T7/Altaira_Labs/.secrets/neon-render.env)"
production_host="${production_host#jdbc:postgresql://}"
production_host="${production_host#*@}"
production_host="${production_host%%/*}"
production_host="${production_host%%:*}"
[[ "$production_host" == ep-*.neon.tech ]] || {
  echo "FAIL: protected endpoint host could not be identified for flow test" >&2
  exit 1
}

env \
  PATH="$FAKE_BIN:$PATH" \
  MOCK_STATE_DIR="$STATE_DIR" \
  MOCK_PRODUCTION_HOST="$production_host" \
  ALTAIRA_NEON_REHEARSAL_ENV="$CONFIG" \
  "$SCRIPT" > "$OUTPUT" 2>&1

grep -F "REHEARSAL PASS" "$OUTPUT" >/dev/null
grep -F "PASS: first and second migration execution completed." "$OUTPUT" >/dev/null
grep -F "PASS: all 1 existing v1 plans retain empty track/shared-resource arrays." "$OUTPUT" >/dev/null
grep -F "PASS: executionAllowed=false and external resource IDs/URLs=0." "$OUTPUT" >/dev/null
grep -F "Project name: Di***" "$OUTPUT" >/dev/null

echo "PASS: complete Neon rehearsal orchestration succeeded with local mocks only."
