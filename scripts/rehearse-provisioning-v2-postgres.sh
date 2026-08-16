#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATION_FILE="$ROOT_DIR/backend/database/provisioning-engine-v2-visibility-migration.sql"
HOST="127.0.0.1"
PORT="${ALTAIRA_REHEARSAL_PORT:-55432}"
DB_NAME="altaira_provisioning_v2_rehearsal"
DB_USER="altaira_rehearsal_admin"
WORK_DIR=""
PG_DATA=""
PG_SOCKET=""
PG_STARTED=false

abort_on_remote_datasource() {
  local key value normalized
  for key in DATABASE_URL SPRING_DATASOURCE_URL; do
    value="${!key:-}"
    normalized="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"
    if [[ "$normalized" == *neon* \
      || "$normalized" == *render* \
      || "$normalized" == postgres://* \
      || "$normalized" == postgresql://* \
      || "$normalized" == jdbc:postgresql://* ]]; then
      echo "ABORT: $key points to a remote PostgreSQL datasource." >&2
      exit 42
    fi
  done
}

find_postgres_bin() {
  local initdb_path
  initdb_path="$(command -v initdb || true)"
  if [[ -z "$initdb_path" ]]; then
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
  fi
  dirname "$initdb_path"
}

cleanup() {
  local exit_code=$?
  if [[ "$PG_STARTED" == true && -n "$PG_DATA" && -x "$PG_BIN/pg_ctl" ]]; then
    "$PG_BIN/pg_ctl" -D "$PG_DATA" -m immediate -w stop >/dev/null 2>&1 || true
  fi
  if [[ -n "$WORK_DIR" && "$WORK_DIR" == *altaira-provisioning-v2-postgres.* ]]; then
    rm -rf "$WORK_DIR"
  fi
  if [[ -n "$PG_SOCKET" && "$PG_SOCKET" == /tmp/altaira-pgv2-socket.* ]]; then
    rm -rf "$PG_SOCKET"
  fi
  if [[ $exit_code -eq 0 ]]; then
    echo "PASS: disposable PostgreSQL cluster and database were removed."
  else
    echo "CLEANUP: disposable PostgreSQL cluster removed after failure." >&2
  fi
  exit "$exit_code"
}

abort_on_remote_datasource

if [[ ! "$PORT" =~ ^[0-9]+$ || "$PORT" -lt 1024 || "$PORT" -gt 65535 ]]; then
  echo "ABORT: ALTAIRA_REHEARSAL_PORT must be an unused local port between 1024 and 65535." >&2
  exit 1
fi

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "ABORT: local port $PORT is already in use; no existing service will be reused." >&2
  exit 1
fi

if [[ ! -f "$MIGRATION_FILE" ]]; then
  echo "ABORT: migration file not found: $MIGRATION_FILE" >&2
  exit 1
fi

PG_BIN="$(find_postgres_bin)"
for command_name in initdb pg_ctl createdb psql; do
  if [[ ! -x "$PG_BIN/$command_name" ]]; then
    echo "ABORT: required local PostgreSQL command is missing: $PG_BIN/$command_name" >&2
    exit 1
  fi
done

TEMP_ROOT="${TMPDIR:-/tmp}"
TEMP_ROOT="${TEMP_ROOT%/}"
WORK_DIR="$(mktemp -d "$TEMP_ROOT/altaira-provisioning-v2-postgres.XXXXXX")"
PG_DATA="$WORK_DIR/data"
PG_SOCKET="$(mktemp -d /tmp/altaira-pgv2-socket.XXXXXX)"
PG_LOG="$WORK_DIR/postgres.log"
trap cleanup EXIT INT TERM

cat <<CHECKLIST
=== PROVISIONING V2 LOCAL POSTGRES SAFETY CHECKLIST ===
PASS: DATABASE_URL / SPRING_DATASOURCE_URL do not point to remote PostgreSQL.
PASS: PostgreSQL executable = $PG_BIN/postgres
PASS: Host = $HOST (loopback only)
PASS: Port = $PORT (unused dedicated port)
PASS: Database = $DB_NAME (new disposable database)
PASS: User = $DB_USER (temporary local superuser)
PASS: Data directory = $WORK_DIR (temporary)
PASS: Input data = fictional UUIDs and payloads only.
PASS: External provider APIs = not initialized or called.
PASS: Neon / Render / production = not used.
Starting local PostgreSQL rehearsal now.
=========================================================
CHECKLIST

"$PG_BIN/initdb" \
  -D "$PG_DATA" \
  --username="$DB_USER" \
  --auth-local=trust \
  --auth-host=trust \
  --encoding=UTF8 \
  --no-locale >/dev/null

if ! "$PG_BIN/pg_ctl" \
  -D "$PG_DATA" \
  -l "$PG_LOG" \
  -o "-h $HOST -p $PORT -k $PG_SOCKET" \
  -w start >/dev/null; then
  echo "ABORT: disposable PostgreSQL did not start. Local server log:" >&2
  sed -n '1,120p' "$PG_LOG" >&2 || true
  exit 1
fi
PG_STARTED=true

"$PG_BIN/createdb" -h "$HOST" -p "$PORT" -U "$DB_USER" "$DB_NAME"

PSQL=(
  "$PG_BIN/psql"
  -X
  -v ON_ERROR_STOP=1
  -h "$HOST"
  -p "$PORT"
  -U "$DB_USER"
  -d "$DB_NAME"
)

"${PSQL[@]}" >/dev/null <<'SQL'
CREATE TABLE public.provisioning_plans (
    id uuid PRIMARY KEY,
    lead_id uuid NOT NULL,
    assessment_id uuid NOT NULL,
    route_key character varying(60) NOT NULL,
    automation_level character varying(4) NOT NULL,
    automation_scope character varying(20) NOT NULL,
    status character varying(30) NOT NULL DEFAULT 'draft',
    dry_run boolean NOT NULL DEFAULT true,
    normalized_requirements_json text NOT NULL,
    decision_reason text NOT NULL,
    risks_json text NOT NULL,
    cost_estimate text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT provisioning_plans_assessment_unique UNIQUE (assessment_id)
);

INSERT INTO public.provisioning_plans (
    id, lead_id, assessment_id, route_key, automation_level, automation_scope,
    status, dry_run, normalized_requirements_json, decision_reason, risks_json, cost_estimate
) VALUES (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000111',
    '00000000-0000-0000-0000-000000000121',
    'PROVISION_WEB_STATIC', 'A3', 'partial', 'draft', true, '{}',
    'Legacy v1 decision remains intact', '[]', 'No spend'
);
SQL

columns_before="$("${PSQL[@]}" -Atc "
  SELECT string_agg(column_name, ',' ORDER BY ordinal_position)
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'provisioning_plans';
")"
rows_before="$("${PSQL[@]}" -Atc "SELECT count(*) FROM public.provisioning_plans;")"

echo "Columns before: $columns_before"
echo "Rows before: $rows_before"

"${PSQL[@]}" -f "$MIGRATION_FILE" >/dev/null
"${PSQL[@]}" -f "$MIGRATION_FILE" >/dev/null

"${PSQL[@]}" >/dev/null <<'SQL'
DO $rehearsal$
DECLARE
    actual_columns text[];
    expected_columns text[] := ARRAY[
        'id', 'lead_id', 'assessment_id', 'route_key', 'automation_level',
        'automation_scope', 'status', 'dry_run', 'normalized_requirements_json',
        'decision_reason', 'risks_json', 'cost_estimate', 'created_at', 'updated_at',
        'tracks_json', 'shared_resources_json'
    ];
    legacy_record record;
    column_record record;
BEGIN
    SELECT array_agg(column_name ORDER BY ordinal_position)
      INTO actual_columns
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'provisioning_plans';

    IF actual_columns IS DISTINCT FROM expected_columns THEN
        RAISE EXCEPTION 'Unexpected columns after migration: %', actual_columns;
    END IF;

    FOR column_record IN
        SELECT column_name, is_nullable, column_default
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'provisioning_plans'
           AND column_name IN ('tracks_json', 'shared_resources_json')
    LOOP
        IF column_record.is_nullable <> 'NO' THEN
            RAISE EXCEPTION '% must be NOT NULL', column_record.column_name;
        END IF;
        IF column_record.column_default NOT LIKE '%[]%' THEN
            RAISE EXCEPTION '% has unexpected default: %', column_record.column_name, column_record.column_default;
        END IF;
    END LOOP;

    IF (SELECT count(*) FROM public.provisioning_plans) <> 1 THEN
        RAISE EXCEPTION 'Migration changed the v1 row count';
    END IF;

    SELECT * INTO legacy_record
      FROM public.provisioning_plans
     WHERE id = '00000000-0000-0000-0000-000000000101';

    IF legacy_record.route_key <> 'PROVISION_WEB_STATIC'
       OR legacy_record.decision_reason <> 'Legacy v1 decision remains intact'
       OR legacy_record.tracks_json <> '[]'
       OR legacy_record.shared_resources_json <> '[]' THEN
        RAISE EXCEPTION 'Legacy v1 values were not preserved: %', legacy_record;
    END IF;
END
$rehearsal$;

INSERT INTO public.provisioning_plans (
    id, lead_id, assessment_id, route_key, automation_level, automation_scope,
    status, dry_run, normalized_requirements_json, decision_reason, risks_json,
    cost_estimate, tracks_json, shared_resources_json
) VALUES (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000112',
    '00000000-0000-0000-0000-000000000122',
    'MULTI_TRACK_PLAN', 'A3', 'partial', 'draft', true, '{}',
    'Engine v2 decision', '[]', 'No spend',
    '[{"track":"WEB","route":"PROVISION_WEB_STATIC","ruleId":"WEB-STATIC-V2","matchedSignals":["requires_static_site"],"reason":"Static delivery matches requirements.","confidence":0.82,"requiresManualDecision":false,"automationLevel":"A3","tools":[],"manualSteps":[],"risks":[]}]',
    '[{"key":"GITHUB","displayName":"GitHub","selectionState":"selected","automationLevel":"A3","required":true,"reason":"Shared source control resource.","usedByTracks":["WEB"]}]'
), (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000113',
    '00000000-0000-0000-0000-000000000123',
    'MANUAL_REVIEW', 'M', 'manual', 'draft', true, '{}',
    'Explicit empty arrays', '[]', 'No spend', '[]', '[]'
);

DO $rehearsal$
BEGIN
    IF (
        SELECT tracks_json::jsonb -> 0 ->> 'track'
        FROM public.provisioning_plans
        WHERE id = '00000000-0000-0000-0000-000000000102'
    ) <> 'WEB' THEN
        RAISE EXCEPTION 'Engine v2 track did not round-trip';
    END IF;

    IF (
        SELECT shared_resources_json::jsonb -> 0 ->> 'key'
        FROM public.provisioning_plans
        WHERE id = '00000000-0000-0000-0000-000000000102'
    ) <> 'GITHUB' THEN
        RAISE EXCEPTION 'Engine v2 shared resource did not round-trip';
    END IF;

    IF (
        SELECT jsonb_array_length(tracks_json::jsonb)
        FROM public.provisioning_plans
        WHERE id = '00000000-0000-0000-0000-000000000103'
    ) <> 0 THEN
        RAISE EXCEPTION 'Explicit empty track array was not preserved';
    END IF;

    IF (SELECT count(*) FROM public.provisioning_plans) <> 3 THEN
        RAISE EXCEPTION 'Unexpected final row count';
    END IF;
END
$rehearsal$;
SQL

columns_after="$("${PSQL[@]}" -Atc "
  SELECT string_agg(column_name, ',' ORDER BY ordinal_position)
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'provisioning_plans';
")"
rows_after_migration="$("${PSQL[@]}" -Atc "
  SELECT count(*) FROM public.provisioning_plans
  WHERE id = '00000000-0000-0000-0000-000000000101';
")"
rows_final="$("${PSQL[@]}" -Atc "SELECT count(*) FROM public.provisioning_plans;")"
v1_arrays="$("${PSQL[@]}" -Atc "
  SELECT tracks_json || '|' || shared_resources_json
  FROM public.provisioning_plans
  WHERE id = '00000000-0000-0000-0000-000000000101';
")"
v2_round_trip="$("${PSQL[@]}" -Atc "
  SELECT (tracks_json::jsonb->0->>'track') || '|' || (shared_resources_json::jsonb->0->>'key')
  FROM public.provisioning_plans
  WHERE id = '00000000-0000-0000-0000-000000000102';
")"

if "${PSQL[@]}" -Atc "SELECT '{malformed'::jsonb;" >/dev/null 2>&1; then
  echo "FAIL: PostgreSQL unexpectedly accepted malformed JSON." >&2
  exit 1
fi

echo "Columns after: $columns_after"
echo "Legacy rows after migration: $rows_after_migration"
echo "Final fictional rows: $rows_final"
echo "V1 arrays: $v1_arrays"
echo "V2 round-trip: $v2_round_trip"
echo "PASS: PostgreSQL rejects malformed JSON when the text payload is validated as jsonb."
echo "PASS: migration is additive, idempotent and compatible with v1/v2 payloads on PostgreSQL $($PG_BIN/postgres --version | awk '{print $3}')."
