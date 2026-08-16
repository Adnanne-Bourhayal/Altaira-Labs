#!/usr/bin/env bash
set -euo pipefail

umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PREPARE_SCRIPT="$ROOT_DIR/scripts/prepare-commercial-payment-production-checks.sh"
PRECHECK_SQL="$ROOT_DIR/backend/database/checks/commercial-payment-production-precheck.sql"
POSTCHECK_SQL="$ROOT_DIR/backend/database/checks/commercial-payment-production-postcheck.sql"
MODE="local"
CONFIG_FILE="${ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV:-}"

fail() {
  echo "COMMERCIAL READINESS ABORT: $*" >&2
  exit 1
}

redact_host() {
  local value="$1"
  local first="${value%%.*}"
  printf '%s...%s.neon.tech' "${first:0:5}" "${first: -4}"
}

strip_optional_quotes() {
  local value="$1"
  if [[ ${#value} -ge 2 && "${value:0:1}" == '"' && "${value: -1}" == '"' ]]; then
    value="${value:1:${#value}-2}"
  elif [[ ${#value} -ge 2 && "${value:0:1}" == "'" && "${value: -1}" == "'" ]]; then
    value="${value:1:${#value}-2}"
  fi
  printf '%s' "$value"
}

load_config() {
  local config_dir config_name key value
  [[ -n "$CONFIG_FILE" ]] || fail "ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV is required for a database check"
  [[ -f "$CONFIG_FILE" ]] || fail "readiness config file does not exist"

  config_dir="$(cd "$(dirname "$CONFIG_FILE")" && pwd -P)"
  config_name="$(basename "$CONFIG_FILE")"
  CONFIG_FILE="$config_dir/$config_name"
  case "$CONFIG_FILE" in
    "$ROOT_DIR"/*) fail "readiness config must be outside the Git repository" ;;
  esac

  while IFS='=' read -r key value || [[ -n "$key" ]]; do
    key="${key%$'\r'}"
    value="${value%$'\r'}"
    [[ -z "$key" || "$key" == \#* ]] && continue
    value="$(strip_optional_quotes "$value")"
    case "$key" in
      SPRING_DATASOURCE_URL|SPRING_DATASOURCE_USERNAME|SPRING_DATASOURCE_PASSWORD|ALTAIRA_EXPECTED_PRODUCTION_HOST|ALTAIRA_COMMERCIAL_PRODUCTION_READ_ONLY_CONFIRMATION)
        printf -v "$key" '%s' "$value"
        ;;
      *) fail "unsupported key in readiness config: $key" ;;
    esac
  done < "$CONFIG_FILE"
}

case "${1:-}" in
  "") MODE="local" ;;
  --database-read-only-precheck) MODE="precheck" ;;
  --database-read-only-postcheck) MODE="postcheck" ;;
  *) fail "usage: $0 [--database-read-only-precheck|--database-read-only-postcheck]" ;;
esac

"$PREPARE_SCRIPT"

if [[ "$MODE" == "local" ]]; then
  echo "PASS: local-only commercial readiness completed; no database connection was attempted."
  exit 0
fi

if [[ -n "${DATABASE_URL:-}" || -n "${SPRING_DATASOURCE_URL:-}" ]]; then
  fail "inherited datasource variables are forbidden; use only the dedicated readiness file"
fi

load_config

for required in \
  SPRING_DATASOURCE_URL \
  SPRING_DATASOURCE_USERNAME \
  SPRING_DATASOURCE_PASSWORD \
  ALTAIRA_EXPECTED_PRODUCTION_HOST \
  ALTAIRA_COMMERCIAL_PRODUCTION_READ_ONLY_CONFIRMATION; do
  [[ -n "${!required:-}" ]] || fail "$required is required in the readiness config"
done

[[ "$ALTAIRA_COMMERCIAL_PRODUCTION_READ_ONLY_CONFIRMATION" == "I_CONFIRM_READ_ONLY_COMMERCIAL_PRODUCTION_PREFLIGHT" ]] \
  || fail "invalid read-only commercial production confirmation"
[[ "$SPRING_DATASOURCE_URL" == jdbc:postgresql://* ]] \
  || fail "only a JDBC PostgreSQL URL is supported"

connection="${SPRING_DATASOURCE_URL#jdbc:postgresql://}"
authority="${connection%%/*}"
database_and_query="${connection#*/}"
[[ "$authority" != *'@'* ]] || fail "credentials must not be embedded in the datasource URL"
PGHOST_VALUE="${authority%%:*}"
if [[ "$authority" == *:* ]]; then
  PGPORT_VALUE="${authority##*:}"
else
  PGPORT_VALUE="5432"
fi
PGDATABASE_VALUE="${database_and_query%%\?*}"
query="${database_and_query#*\?}"

[[ "$PGHOST_VALUE" == *.neon.tech ]] || fail "target host is not a Neon endpoint"
[[ "$PGHOST_VALUE" == "$ALTAIRA_EXPECTED_PRODUCTION_HOST" ]] \
  || fail "datasource host does not match the independently confirmed production host"
[[ "$PGPORT_VALUE" =~ ^[0-9]+$ ]] || fail "invalid PostgreSQL port"
[[ "$PGDATABASE_VALUE" =~ ^[A-Za-z_][A-Za-z0-9_-]{0,62}$ ]] || fail "invalid database name"
[[ "$query" == *"sslmode=require"* ]] || fail "sslmode=require is mandatory"

PSQL_BIN="$(command -v psql || true)"
[[ -n "$PSQL_BIN" ]] || fail "psql is required"

echo "=== EXPLICIT READ-ONLY COMMERCIAL PRODUCTION $MODE ==="
echo "Host: $(redact_host "$PGHOST_VALUE")"
echo "Database: $PGDATABASE_VALUE"
echo "The session enforces default_transaction_read_only=on; no migration SQL is available here."

if [[ "$MODE" == "precheck" ]]; then
  SQL_FILE="$PRECHECK_SQL"
else
  SQL_FILE="$POSTCHECK_SQL"
fi

PGHOST="$PGHOST_VALUE" \
PGPORT="$PGPORT_VALUE" \
PGDATABASE="$PGDATABASE_VALUE" \
PGUSER="$SPRING_DATASOURCE_USERNAME" \
PGPASSWORD="$SPRING_DATASOURCE_PASSWORD" \
PGSSLMODE="require" \
PGCONNECT_TIMEOUT="10" \
PGAPPNAME="altaira_commercial_readiness_read_only" \
PGOPTIONS="-c default_transaction_read_only=on -c statement_timeout=15000 -c lock_timeout=3000" \
  "$PSQL_BIN" -X -v ON_ERROR_STOP=1 -f "$SQL_FILE"

echo "PASS: read-only commercial $MODE completed. No migration was executed."
