#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATION_FILE="$ROOT_DIR/backend/database/commercial-payment-provisioning-migration.sql"
PRECHECK_FILE="$ROOT_DIR/backend/database/checks/commercial-payment-production-precheck.sql"
POSTCHECK_FILE="$ROOT_DIR/backend/database/checks/commercial-payment-production-postcheck.sql"
HOST="127.0.0.1"
PORT="${ALTAIRA_COMMERCIAL_REHEARSAL_PORT:-55433}"
DB_NAME="altaira_commercial_rehearsal"
DB_USER="altaira_commercial_rehearsal"
WORK_DIR=""
PG_DATA=""
PG_SOCKET=""
PG_STARTED=false

abort_on_inherited_datasource() {
  local key value normalized
  for key in DATABASE_URL SPRING_DATASOURCE_URL; do
    value="${!key:-}"
    normalized="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"
    if [[ "$normalized" == *neon* \
      || "$normalized" == *render* \
      || "$normalized" == postgres://* \
      || "$normalized" == postgresql://* \
      || "$normalized" == jdbc:postgresql://* ]]; then
      echo "ABORT: $key contains a PostgreSQL datasource; this rehearsal creates its own local database." >&2
      exit 42
    fi
  done
}

find_postgres_bin() {
  local initdb_path
  initdb_path="$(command -v initdb || true)"
  if [[ -n "$initdb_path" ]]; then
    dirname "$initdb_path"
    return
  fi
  for candidate in \
    /opt/homebrew/opt/postgresql@15/bin \
    /opt/homebrew/opt/postgresql@16/bin \
    /usr/local/opt/postgresql@15/bin \
    /usr/local/opt/postgresql@16/bin; do
    if [[ -x "$candidate/initdb" ]]; then
      printf '%s\n' "$candidate"
      return
    fi
  done
  echo "ABORT: local PostgreSQL tools were not found." >&2
  exit 1
}

cleanup() {
  local exit_code=$?
  if [[ "$PG_STARTED" == true ]]; then
    "$PG_BIN/pg_ctl" -D "$PG_DATA" -m immediate -w stop >/dev/null 2>&1 || true
  fi
  [[ -n "$WORK_DIR" && "$WORK_DIR" == *altaira-commercial-postgres.* ]] && rm -rf "$WORK_DIR"
  [[ -n "$PG_SOCKET" && "$PG_SOCKET" == /tmp/altaira-commercial-socket.* ]] && rm -rf "$PG_SOCKET"
  if [[ $exit_code -eq 0 ]]; then
    echo "PASS: disposable PostgreSQL cluster was removed."
  else
    echo "CLEANUP: disposable PostgreSQL cluster removed after failure." >&2
  fi
  exit "$exit_code"
}

abort_on_inherited_datasource
[[ -f "$MIGRATION_FILE" ]] || { echo "ABORT: migration file not found." >&2; exit 1; }
[[ -f "$PRECHECK_FILE" ]] || { echo "ABORT: read-only precheck file not found." >&2; exit 1; }
[[ -f "$POSTCHECK_FILE" ]] || { echo "ABORT: read-only postcheck file not found." >&2; exit 1; }
[[ "$PORT" =~ ^[0-9]+$ && "$PORT" -ge 1024 && "$PORT" -le 65535 ]] || { echo "ABORT: invalid local port." >&2; exit 1; }
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "ABORT: local port $PORT is already in use." >&2
  exit 1
fi

PG_BIN="$(find_postgres_bin)"
for command_name in initdb pg_ctl createdb psql; do
  [[ -x "$PG_BIN/$command_name" ]] || { echo "ABORT: missing local PostgreSQL command: $command_name" >&2; exit 1; }
done

TEMP_ROOT="${TMPDIR:-/tmp}"
WORK_DIR="$(mktemp -d "${TEMP_ROOT%/}/altaira-commercial-postgres.XXXXXX")"
PG_DATA="$WORK_DIR/data"
PG_SOCKET="$(mktemp -d /tmp/altaira-commercial-socket.XXXXXX)"
PG_LOG="$WORK_DIR/postgres.log"
trap cleanup EXIT INT TERM

cat <<CHECKLIST
=== COMMERCIAL FLOW LOCAL POSTGRES REHEARSAL ===
PASS: inherited PostgreSQL datasource variables are absent.
PASS: host is loopback-only ($HOST:$PORT).
PASS: database and user are temporary.
PASS: all fixture UUIDs and emails are fictional.
PASS: Neon, Render, Stripe, Resend and provider APIs are not used.
==================================================
CHECKLIST

"$PG_BIN/initdb" -D "$PG_DATA" --username="$DB_USER" --auth-local=trust --auth-host=trust --encoding=UTF8 --no-locale >/dev/null
"$PG_BIN/pg_ctl" -D "$PG_DATA" -l "$PG_LOG" -o "-h $HOST -p $PORT -k $PG_SOCKET" -w start >/dev/null
PG_STARTED=true
"$PG_BIN/createdb" -h "$HOST" -p "$PORT" -U "$DB_USER" "$DB_NAME"

PSQL=("$PG_BIN/psql" -X -v ON_ERROR_STOP=1 -h "$HOST" -p "$PORT" -U "$DB_USER" -d "$DB_NAME")

"${PSQL[@]}" >/dev/null <<'SQL'
CREATE TABLE public.leads (id uuid PRIMARY KEY);
CREATE TABLE public.clients (id uuid PRIMARY KEY);
CREATE TABLE public.client_workspaces (id uuid PRIMARY KEY);
CREATE TABLE public.provisioning_plans (id uuid PRIMARY KEY);

INSERT INTO public.leads VALUES ('00000000-0000-0000-0000-000000000101');
INSERT INTO public.clients VALUES ('00000000-0000-0000-0000-000000000102');
INSERT INTO public.client_workspaces VALUES ('00000000-0000-0000-0000-000000000103');
INSERT INTO public.provisioning_plans VALUES ('00000000-0000-0000-0000-000000000104');
SQL

PGOPTIONS="-c default_transaction_read_only=on" "${PSQL[@]}" -f "$PRECHECK_FILE" >"$WORK_DIR/precheck-before.out"

"${PSQL[@]}" -f "$MIGRATION_FILE" >/dev/null
"${PSQL[@]}" -f "$MIGRATION_FILE" >/dev/null

PGOPTIONS="-c default_transaction_read_only=on" "${PSQL[@]}" -f "$PRECHECK_FILE" >"$WORK_DIR/precheck-after.out"
grep -Eq 'required_columns[[:space:]]*\|[[:space:]]*PASS' "$WORK_DIR/precheck-after.out" \
  || { echo "ABORT: commercial precheck did not confirm the reviewed columns." >&2; exit 1; }

"${PSQL[@]}" >/dev/null <<'SQL'
INSERT INTO public.commercial_flows (
  id, plan_id, lead_id, client_id, workspace_id, payment_status
) VALUES (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103',
  'PAYMENT_CONFIRMED'
);

INSERT INTO public.commercial_payment_sessions (
  id, flow_id, provider_mode, status, amount_minor, currency, customer_email,
  description, provider_session_id, idempotency_key
) VALUES (
  '00000000-0000-0000-0000-000000000202',
  '00000000-0000-0000-0000-000000000201', 'mock', 'PAYMENT_CONFIRMED',
  150000, 'EUR', 'commercial-rehearsal@example.com', 'Fictional rehearsal',
  'mock_cs_rehearsal', 'checkout:rehearsal'
);

INSERT INTO public.commercial_payment_events (
  payment_session_id, provider_event_id, event_type, status
) VALUES (
  '00000000-0000-0000-0000-000000000202', 'evt_rehearsal',
  'checkout.session.completed', 'PROCESSED'
);

INSERT INTO public.commercial_email_logs (flow_id, email_type, recipient, status)
VALUES ('00000000-0000-0000-0000-000000000201', 'PLAN_SUMMARY', 'commercial-rehearsal@example.com', 'SKIPPED');

INSERT INTO public.provisioning_runs (
  id, plan_id, client_id, workspace_id, status, dry_run, idempotency_key
) VALUES (
  '00000000-0000-0000-0000-000000000203',
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103', 'BLOCKED', true, 'run:rehearsal'
);

INSERT INTO public.provisioning_steps (
  run_id, provider, action, status, manual_action_required, idempotency_key
) VALUES (
  '00000000-0000-0000-0000-000000000203', 'GITHUB', 'create: fictional-repo',
  'BLOCKED', true, 'step:rehearsal'
);

DO $rehearsal$
DECLARE
  table_count integer;
  external_identity_count integer;
BEGIN
  SELECT count(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'commercial_flows', 'commercial_payment_sessions', 'commercial_payment_events',
      'commercial_email_logs', 'provisioning_runs', 'provisioning_steps'
    );
  IF table_count <> 6 THEN RAISE EXCEPTION 'Expected six commercial tables, found %', table_count; END IF;

  IF (SELECT count(*) FROM public.commercial_flows) <> 1 THEN RAISE EXCEPTION 'Commercial flow round-trip failed'; END IF;
  IF (SELECT count(*) FROM public.provisioning_runs WHERE dry_run) <> 1 THEN RAISE EXCEPTION 'Dry-run invariant failed'; END IF;
  IF (SELECT count(*) FROM public.provisioning_steps WHERE status = 'BLOCKED' AND manual_action_required) <> 1 THEN
    RAISE EXCEPTION 'Blocked-step invariant failed';
  END IF;

  SELECT count(*) INTO external_identity_count
  FROM public.provisioning_steps
  WHERE external_resource_id IS NOT NULL OR external_url IS NOT NULL;
  IF external_identity_count <> 0 THEN RAISE EXCEPTION 'External identity must stay empty'; END IF;
END
$rehearsal$;
SQL

PGOPTIONS="-c default_transaction_read_only=on" "${PSQL[@]}" -f "$POSTCHECK_FILE" >"$WORK_DIR/postcheck.out"
grep -Eq 'required_tables[[:space:]]*\|[[:space:]]*PASS' "$WORK_DIR/postcheck.out" \
  || { echo "ABORT: commercial postcheck did not confirm the reviewed tables." >&2; exit 1; }
grep -Eq 'required_columns[[:space:]]*\|[[:space:]]*PASS' "$WORK_DIR/postcheck.out" \
  || { echo "ABORT: commercial postcheck did not confirm the reviewed columns." >&2; exit 1; }

table_count="$("${PSQL[@]}" -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'commercial_%' OR table_schema='public' AND table_name IN ('provisioning_runs','provisioning_steps');")"
echo "Commercial/provisioning audit tables: $table_count"
echo "PASS: production precheck SQL handled absent and present commercial tables in read-only mode."
echo "PASS: production postcheck SQL confirmed the reviewed schema and dry-run audit state."
echo "PASS: migration applied twice without error."
echo "PASS: fictional commercial flow, payment, email and dry-run provisioning records round-tripped."
echo "PASS: external resource IDs and URLs remain empty."
