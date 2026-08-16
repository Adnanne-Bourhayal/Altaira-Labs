#!/usr/bin/env bash
set -euo pipefail

SECRETS_FILE="${ALTAIRA_SECRETS_FILE:-/Volumes/T7/Altaira_Labs/.secrets/neon-render.env}"

required_tables=(
  app_users
  app_user_sessions
  clients
  client_services
  services
  client_user_access
  client_invitations
  client_workspaces
  onboarding_tasks
  onboarding_audit_logs
  onboarding_files
  client_projects
  client_project_assets
  client_project_config_snapshots
  client_crm_leads
  client_crm_lead_notes
  client_crm_lead_events
  client_crm_follow_up_actions
  client_crm_webhook_tokens
)

if ! command -v psql >/dev/null 2>&1; then
  echo "FAIL psql is not installed or not available on PATH." >&2
  exit 1
fi

if [[ -z "${SPRING_DATASOURCE_URL:-}" || -z "${SPRING_DATASOURCE_USERNAME:-}" || -z "${SPRING_DATASOURCE_PASSWORD:-}" ]]; then
  if [[ -f "$SECRETS_FILE" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "$SECRETS_FILE"
    set +a
  fi
fi

if [[ -z "${SPRING_DATASOURCE_URL:-}" || -z "${SPRING_DATASOURCE_USERNAME:-}" || -z "${SPRING_DATASOURCE_PASSWORD:-}" ]]; then
  echo "FAIL database env is missing. Set SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME and SPRING_DATASOURCE_PASSWORD, or provide ALTAIRA_SECRETS_FILE." >&2
  exit 1
fi

pg_url="${SPRING_DATASOURCE_URL#jdbc:}"

existing_tables="$(
  PGPASSWORD="$SPRING_DATASOURCE_PASSWORD" psql "$pg_url" \
    -U "$SPRING_DATASOURCE_USERNAME" \
    -At \
    -v ON_ERROR_STOP=1 \
    -c "select table_name from information_schema.tables where table_schema = 'public' order by table_name;"
)"

missing=()

for table in "${required_tables[@]}"; do
  if ! grep -qx "$table" <<< "$existing_tables"; then
    missing+=("$table")
  fi
done

present_count=$(wc -l <<< "$existing_tables" | tr -d " ")

echo "Client portal schema check"
echo "Database connection: configured"
echo "Public tables found: $present_count"
echo "Required tables: ${#required_tables[@]}"

if (( ${#missing[@]} > 0 )); then
  echo "Missing required client portal tables:"
  printf ' - %s\n' "${missing[@]}"
  echo
  echo "Prepared additive migrations (apply in this order):"
  echo "backend/database/onboarding-core-migration.sql"
  echo "backend/database/client-project-config-snapshots-migration.sql"
  echo
  echo "No schema changes were applied by this check."
  exit 1
fi

echo "PASS all required client portal tables exist."
