#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"

: "${ALTAIRA_LOCAL_ADMIN_PASSWORD:?Set ALTAIRA_LOCAL_ADMIN_PASSWORD to a private local-only value of at least 16 characters}"

if (( ${#ALTAIRA_LOCAL_ADMIN_PASSWORD} < 16 )); then
  echo "ERROR: ALTAIRA_LOCAL_ADMIN_PASSWORD must contain at least 16 characters." >&2
  exit 1
fi

LOCAL_PORT="${ALTAIRA_LOCAL_BACKEND_PORT:-18080}"
LOCAL_ADMIN_USERNAME="${ALTAIRA_LOCAL_ADMIN_USERNAME:-admin-test}"
LOCAL_DB_NAME="${ALTAIRA_LOCAL_H2_DATABASE:-altaira_local_runtime}"
EMPTY_SECRETS_FILE="${ALTAIRA_LOCAL_EMPTY_SECRETS_FILE:-/tmp/altaira-local-h2-no-secrets.properties}"
LOCAL_INTERNAL_API_TOKEN="${ALTAIRA_LOCAL_INTERNAL_API_TOKEN:-altaira-local-internal-token}"

echo "Starting Altaira backend in isolated local mode"
echo "Datasource: H2 in-memory (${LOCAL_DB_NAME})"
echo "Port: ${LOCAL_PORT}"
echo "External email/providers: disabled"
echo "Process environment: clean allowlist (no inherited provider secrets)"

cd "${BACKEND_DIR}"

exec env -i \
  HOME="${HOME}" \
  PATH="${PATH}" \
  TMPDIR="${TMPDIR:-/tmp}" \
  LANG="${LANG:-C.UTF-8}" \
  JAVA_HOME="${JAVA_HOME:-}" \
  ALTAIRA_SECRETS_FILE="${EMPTY_SECRETS_FILE}" \
  SPRING_PROFILES_ACTIVE=test \
  SPRING_DATASOURCE_URL="jdbc:h2:mem:${LOCAL_DB_NAME};MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1" \
  SPRING_DATASOURCE_USERNAME=sa \
  SPRING_DATASOURCE_PASSWORD= \
  SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.h2.Driver \
  SPRING_JPA_HIBERNATE_DDL_AUTO=create-drop \
  PORT="${LOCAL_PORT}" \
  INTERNAL_API_TOKEN="${LOCAL_INTERNAL_API_TOKEN}" \
  CONTACT_EMAIL_ENABLED=false \
  ONBOARDING_EMAIL_ENABLED=false \
  CLIENT_CRM_ALERTS_ENABLED=false \
  COMMERCIAL_EMAIL_ENABLED=false \
  STRIPE_CHECKOUT_ENABLED=false \
  STRIPE_CHECKOUT_MODE=mock \
  STRIPE_MOCK_CONFIRMATION_ENABLED=true \
  GITHUB_APP_ENABLED=false \
  GITHUB_PROVISIONING_ENABLED=false \
  GITHUB_DRY_RUN=true \
  AWS_S3_ENABLED=false \
  ALTAIRA_DEMO_ADMIN_ENABLED=true \
  ALTAIRA_DEMO_ADMIN_USERNAME="${LOCAL_ADMIN_USERNAME}" \
  ALTAIRA_DEMO_ADMIN_PASSWORD="${ALTAIRA_LOCAL_ADMIN_PASSWORD}" \
  ALTAIRA_DEMO_ADMIN_ROLE=admin \
  ./mvnw spring-boot:run -Dspring-boot.run.useTestClasspath=true
