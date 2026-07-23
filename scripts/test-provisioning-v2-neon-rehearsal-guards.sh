#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT_DIR/scripts/rehearse-provisioning-v2-neon-branch.sh"
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/altaira-neon-guard-tests.XXXXXX")"
FAKE_BIN="$TEMP_DIR/bin"
MARKER="$TEMP_DIR/curl-calls"

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT INT TERM

mkdir -p "$FAKE_BIN"

cat > "$FAKE_BIN/curl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail

output=""
url=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      output="$2"
      shift 2
      ;;
    http://*|https://*)
      url="$1"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

printf '%s\n' "$url" >> "$MOCK_CURL_MARKER"

case "$url" in
  */projects/project-guard-test/endpoints)
    printf '{"endpoints":[{"id":"ep-protected","host":"%s","branch_id":"%s","type":"read_write"}]}' \
      "$MOCK_PRODUCTION_HOST" "$MOCK_PROTECTED_PARENT" > "$output"
    ;;
  */projects/project-guard-test)
    printf '{"project":{"id":"project-guard-test","name":"Guard Test"}}' > "$output"
    ;;
  */branches/br-parent-guard)
    printf '{"branch":{"id":"br-parent-guard","name":"production","primary":true}}' > "$output"
    ;;
  *'/branches?search='*)
    printf '{"branches":[{"id":"br-target-guard","name":"test/provisioning-v2-guard","parent_id":"br-parent-guard","primary":false}]}' > "$output"
    ;;
  */branches/br-target-guard/endpoints)
    printf '{"endpoints":[{"id":"%s","host":"%s","branch_id":"br-target-guard","type":"read_write"}]}' \
      "$MOCK_ENDPOINT_ID" "$MOCK_REHEARSAL_HOST" > "$output"
    ;;
  */branches/br-target-guard)
    printf '{"branch":{"id":"br-target-guard","name":"test/provisioning-v2-guard","parent_id":"%s","primary":%s}}' \
      "$MOCK_TARGET_PARENT" "$MOCK_TARGET_PRIMARY" > "$output"
    ;;
  *)
    printf 'Unexpected mock URL: %s\n' "$url" >&2
    exit 90
    ;;
esac
MOCK
chmod +x "$FAKE_BIN/curl"

production_host="$(awk -F= '$1 == "SPRING_DATASOURCE_URL" {sub(/^[^=]*=/, ""); print; exit}' \
  /Volumes/T7/Altaira_Labs/.secrets/neon-render.env)"
production_host="${production_host#jdbc:postgresql://}"
production_host="${production_host#*@}"
production_host="${production_host%%/*}"
production_host="${production_host%%:*}"
[[ "$production_host" == ep-*.neon.tech ]] || {
  echo "FAIL: protected endpoint host could not be identified for guard test" >&2
  exit 1
}
production_endpoint_id="${production_host%%.*}"

write_config() {
  local path="$1"
  local branch_name="${2:-test/provisioning-v2-guard}"
  local confirmation="${3:-I_CONFIRM_DISPOSABLE_BRANCH}"
  cat > "$path" <<EOF
NEON_API_KEY=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
NEON_PROJECT_ID=project-guard-test
NEON_PARENT_BRANCH_ID=br-parent-guard
NEON_REHEARSAL_BRANCH_NAME=$branch_name
NEON_DATABASE_NAME=neondb
NEON_ROLE_NAME=neondb_owner
NEON_REHEARSAL_CONFIRMATION=$confirmation
EOF
}

run_abort_case() {
  local label="$1"
  local config="$2"
  local expected="$3"
  shift 3
  local output="$TEMP_DIR/$label.out"
  : > "$MARKER"
  set +e
  env \
    PATH="$FAKE_BIN:$PATH" \
    ALTAIRA_NEON_REHEARSAL_ENV="$config" \
    MOCK_CURL_MARKER="$MARKER" \
    MOCK_TARGET_PARENT="${MOCK_TARGET_PARENT:-br-parent-guard}" \
    MOCK_TARGET_PRIMARY="${MOCK_TARGET_PRIMARY:-false}" \
    MOCK_PRODUCTION_HOST="$production_host" \
    MOCK_PROTECTED_PARENT="${MOCK_PROTECTED_PARENT:-br-parent-guard}" \
    MOCK_REHEARSAL_HOST="${MOCK_REHEARSAL_HOST:-ep-guard-test.eu-central-1.aws.neon.tech}" \
    MOCK_ENDPOINT_ID="${MOCK_ENDPOINT_ID:-ep-guard-test}" \
    "$@" "$SCRIPT" > "$output" 2>&1
  local code=$?
  set -e
  [[ $code -ne 0 ]] || { echo "FAIL $label: expected abort" >&2; exit 1; }
  grep -F "$expected" "$output" >/dev/null \
    || { echo "FAIL $label: expected message not found" >&2; sed -n '1,40p' "$output" >&2; exit 1; }
  echo "PASS: $label"
}

invalid_confirmation="$TEMP_DIR/invalid-confirmation.env"
write_config "$invalid_confirmation" "test/provisioning-v2-guard" "NO"
run_abort_case "invalid confirmation" "$invalid_confirmation" \
  "NEON_REHEARSAL_CONFIRMATION must equal I_CONFIRM_DISPOSABLE_BRANCH" env
[[ ! -s "$MARKER" ]] || { echo "FAIL: invalid confirmation reached curl" >&2; exit 1; }

production_name="$TEMP_DIR/production-name.env"
write_config "$production_name" "production"
run_abort_case "production branch name" "$production_name" \
  "branch name must start with" env
[[ ! -s "$MARKER" ]] || { echo "FAIL: production name reached curl" >&2; exit 1; }

inherited_datasource="$TEMP_DIR/inherited-datasource.env"
write_config "$inherited_datasource"
run_abort_case "inherited datasource" "$inherited_datasource" \
  "DATABASE_URL or SPRING_DATASOURCE_URL is already set" \
  env SPRING_DATASOURCE_URL="jdbc:postgresql://protected.example.invalid/neondb"
[[ ! -s "$MARKER" ]] || { echo "FAIL: inherited datasource reached curl" >&2; exit 1; }

wrong_protected_parent="$TEMP_DIR/wrong-protected-parent.env"
write_config "$wrong_protected_parent"
MOCK_PROTECTED_PARENT="br-other-parent" \
  run_abort_case "protected parent mismatch" "$wrong_protected_parent" \
  "configured parent branch does not own the protected production endpoint" env

parent_mismatch="$TEMP_DIR/parent-mismatch.env"
write_config "$parent_mismatch"
MOCK_TARGET_PARENT="br-wrong-parent" MOCK_TARGET_PRIMARY="false" \
  run_abort_case "parent mismatch" "$parent_mismatch" "branch parent verification failed" env

primary_target="$TEMP_DIR/primary-target.env"
write_config "$primary_target"
MOCK_TARGET_PARENT="br-parent-guard" MOCK_TARGET_PRIMARY="true" \
  run_abort_case "primary target" "$primary_target" \
  "Neon reports this branch as primary" env

protected_endpoint="$TEMP_DIR/protected-endpoint.env"
write_config "$protected_endpoint"
MOCK_TARGET_PARENT="br-parent-guard" MOCK_TARGET_PRIMARY="false" \
MOCK_REHEARSAL_HOST="$production_host" MOCK_ENDPOINT_ID="$production_endpoint_id" \
  run_abort_case "protected endpoint" "$protected_endpoint" \
  "rehearsal endpoint equals protected production endpoint" env

echo "PASS: all Neon rehearsal safety guards aborted before SQL."
