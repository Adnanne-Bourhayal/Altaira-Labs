\set ON_ERROR_STOP on
\pset pager off

BEGIN TRANSACTION READ ONLY;

SELECT
    current_database() AS database_name,
    current_schema() AS schema_name,
    current_setting('transaction_read_only') AS transaction_read_only,
    current_setting('server_version') AS server_version,
    clock_timestamp() AS checked_at;

WITH dependencies(table_name) AS (
    VALUES
        ('leads'),
        ('clients'),
        ('client_services'),
        ('client_workspaces'),
        ('provisioning_plans')
)
SELECT
    table_name,
    to_regclass(format('public.%I', table_name)) IS NOT NULL AS exists
FROM dependencies
ORDER BY table_name;

SELECT
    to_regclass('public.leads') IS NOT NULL AS leads_exists,
    to_regclass('public.clients') IS NOT NULL AS clients_exists,
    to_regclass('public.client_services') IS NOT NULL AS client_services_exists,
    to_regclass('public.client_workspaces') IS NOT NULL AS client_workspaces_exists,
    to_regclass('public.provisioning_plans') IS NOT NULL AS provisioning_plans_exists
\gset dependency_

\if :dependency_leads_exists
SELECT 'leads' AS table_name, count(*) AS row_count FROM public.leads;
\else
SELECT 'leads' AS table_name, NULL::bigint AS row_count, 'ABSENT' AS state;
\endif

\if :dependency_clients_exists
SELECT 'clients' AS table_name, count(*) AS row_count FROM public.clients;
\else
SELECT 'clients' AS table_name, NULL::bigint AS row_count, 'ABSENT' AS state;
\endif

\if :dependency_client_services_exists
SELECT 'client_services' AS table_name, count(*) AS row_count FROM public.client_services;
\else
SELECT 'client_services' AS table_name, NULL::bigint AS row_count, 'ABSENT' AS state;
\endif

\if :dependency_client_workspaces_exists
SELECT 'client_workspaces' AS table_name, count(*) AS row_count FROM public.client_workspaces;
\else
SELECT 'client_workspaces' AS table_name, NULL::bigint AS row_count, 'ABSENT' AS state;
\endif

\if :dependency_provisioning_plans_exists
SELECT 'provisioning_plans' AS table_name, count(*) AS row_count FROM public.provisioning_plans;
\else
SELECT 'provisioning_plans' AS table_name, NULL::bigint AS row_count, 'ABSENT' AS state;
\endif

WITH expected(table_name) AS (
    VALUES
        ('commercial_flows'),
        ('commercial_payment_sessions'),
        ('commercial_payment_events'),
        ('commercial_email_logs'),
        ('provisioning_runs'),
        ('provisioning_steps')
)
SELECT
    table_name,
    to_regclass(format('public.%I', table_name)) IS NOT NULL AS exists
FROM expected
ORDER BY table_name;

SELECT
    to_regclass('public.commercial_flows') IS NOT NULL AS commercial_flows_exists,
    to_regclass('public.commercial_payment_sessions') IS NOT NULL AS commercial_payment_sessions_exists,
    to_regclass('public.commercial_payment_events') IS NOT NULL AS commercial_payment_events_exists,
    to_regclass('public.commercial_email_logs') IS NOT NULL AS commercial_email_logs_exists,
    to_regclass('public.provisioning_runs') IS NOT NULL AS provisioning_runs_exists,
    to_regclass('public.provisioning_steps') IS NOT NULL AS provisioning_steps_exists
\gset commercial_

SELECT
    table_name,
    ordinal_position,
    column_name,
    data_type,
    is_nullable,
    COALESCE(column_default, '') AS column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
      'commercial_flows',
      'commercial_payment_sessions',
      'commercial_payment_events',
      'commercial_email_logs',
      'provisioning_runs',
      'provisioning_steps'
  )
ORDER BY table_name, ordinal_position;

WITH expected(table_name, column_name) AS (
    VALUES
        ('commercial_flows', 'id'),
        ('commercial_flows', 'plan_id'),
        ('commercial_flows', 'lead_id'),
        ('commercial_flows', 'client_id'),
        ('commercial_flows', 'workspace_id'),
        ('commercial_flows', 'payment_status'),
        ('commercial_flows', 'client_status'),
        ('commercial_flows', 'workspace_status'),
        ('commercial_flows', 'invitation_status'),
        ('commercial_flows', 'provisioning_status'),
        ('commercial_flows', 'activation_error'),
        ('commercial_flows', 'payment_confirmed_at'),
        ('commercial_flows', 'activated_at'),
        ('commercial_flows', 'invitation_sent_at'),
        ('commercial_flows', 'created_at'),
        ('commercial_flows', 'updated_at'),
        ('commercial_payment_sessions', 'id'),
        ('commercial_payment_sessions', 'flow_id'),
        ('commercial_payment_sessions', 'provider'),
        ('commercial_payment_sessions', 'provider_mode'),
        ('commercial_payment_sessions', 'status'),
        ('commercial_payment_sessions', 'amount_minor'),
        ('commercial_payment_sessions', 'currency'),
        ('commercial_payment_sessions', 'customer_email'),
        ('commercial_payment_sessions', 'description'),
        ('commercial_payment_sessions', 'provider_session_id'),
        ('commercial_payment_sessions', 'checkout_url'),
        ('commercial_payment_sessions', 'payment_intent_id'),
        ('commercial_payment_sessions', 'idempotency_key'),
        ('commercial_payment_sessions', 'safe_error'),
        ('commercial_payment_sessions', 'expires_at'),
        ('commercial_payment_sessions', 'confirmed_at'),
        ('commercial_payment_sessions', 'created_at'),
        ('commercial_payment_sessions', 'updated_at'),
        ('commercial_payment_events', 'id'),
        ('commercial_payment_events', 'payment_session_id'),
        ('commercial_payment_events', 'provider_event_id'),
        ('commercial_payment_events', 'event_type'),
        ('commercial_payment_events', 'status'),
        ('commercial_payment_events', 'safe_error'),
        ('commercial_payment_events', 'received_at'),
        ('commercial_payment_events', 'processed_at'),
        ('commercial_email_logs', 'id'),
        ('commercial_email_logs', 'flow_id'),
        ('commercial_email_logs', 'email_type'),
        ('commercial_email_logs', 'recipient'),
        ('commercial_email_logs', 'status'),
        ('commercial_email_logs', 'provider_message_id'),
        ('commercial_email_logs', 'safe_error'),
        ('commercial_email_logs', 'created_at'),
        ('commercial_email_logs', 'sent_at'),
        ('provisioning_runs', 'id'),
        ('provisioning_runs', 'plan_id'),
        ('provisioning_runs', 'client_id'),
        ('provisioning_runs', 'workspace_id'),
        ('provisioning_runs', 'status'),
        ('provisioning_runs', 'dry_run'),
        ('provisioning_runs', 'idempotency_key'),
        ('provisioning_runs', 'safe_error'),
        ('provisioning_runs', 'started_at'),
        ('provisioning_runs', 'completed_at'),
        ('provisioning_runs', 'created_at'),
        ('provisioning_runs', 'updated_at'),
        ('provisioning_steps', 'id'),
        ('provisioning_steps', 'run_id'),
        ('provisioning_steps', 'track_key'),
        ('provisioning_steps', 'provider'),
        ('provisioning_steps', 'action'),
        ('provisioning_steps', 'status'),
        ('provisioning_steps', 'input_summary_json'),
        ('provisioning_steps', 'external_resource_id'),
        ('provisioning_steps', 'external_url'),
        ('provisioning_steps', 'safe_error'),
        ('provisioning_steps', 'manual_action_required'),
        ('provisioning_steps', 'idempotency_key'),
        ('provisioning_steps', 'attempts'),
        ('provisioning_steps', 'started_at'),
        ('provisioning_steps', 'completed_at'),
        ('provisioning_steps', 'created_at'),
        ('provisioning_steps', 'updated_at')
)
SELECT
    'required_columns' AS check_name,
    CASE WHEN count(*) FILTER (WHERE actual.column_name IS NULL) = 0 THEN 'PASS' ELSE 'FAIL' END AS result,
    COALESCE(string_agg(
        expected.table_name || '.' || expected.column_name,
        ', ' ORDER BY expected.table_name, expected.column_name
    ) FILTER (WHERE actual.column_name IS NULL), '') AS missing
FROM expected
LEFT JOIN information_schema.columns actual
  ON actual.table_schema = 'public'
 AND actual.table_name = expected.table_name
 AND actual.column_name = expected.column_name;

SELECT
    md5(COALESCE(string_agg(
        concat_ws('|', table_name, ordinal_position, column_name, data_type,
            is_nullable, COALESCE(column_default, '')),
        E'\n' ORDER BY table_name, ordinal_position
    ), '')) AS commercial_schema_fingerprint
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
      'commercial_flows',
      'commercial_payment_sessions',
      'commercial_payment_events',
      'commercial_email_logs',
      'provisioning_runs',
      'provisioning_steps'
  );

\if :commercial_commercial_flows_exists
SELECT 'commercial_flows' AS table_name, count(*) AS row_count FROM public.commercial_flows;
\else
SELECT 'commercial_flows' AS table_name, NULL::bigint AS row_count, 'ABSENT' AS state;
\endif

\if :commercial_commercial_payment_sessions_exists
SELECT 'commercial_payment_sessions' AS table_name, count(*) AS row_count
FROM public.commercial_payment_sessions;
\else
SELECT 'commercial_payment_sessions' AS table_name, NULL::bigint AS row_count, 'ABSENT' AS state;
\endif

\if :commercial_commercial_payment_events_exists
SELECT 'commercial_payment_events' AS table_name, count(*) AS row_count
FROM public.commercial_payment_events;
\else
SELECT 'commercial_payment_events' AS table_name, NULL::bigint AS row_count, 'ABSENT' AS state;
\endif

\if :commercial_commercial_email_logs_exists
SELECT 'commercial_email_logs' AS table_name, count(*) AS row_count
FROM public.commercial_email_logs;
\else
SELECT 'commercial_email_logs' AS table_name, NULL::bigint AS row_count, 'ABSENT' AS state;
\endif

\if :commercial_provisioning_runs_exists
SELECT
    'provisioning_runs' AS table_name,
    count(*) AS row_count,
    count(*) FILTER (WHERE dry_run = false) AS non_dry_run_count
FROM public.provisioning_runs;
\else
SELECT 'provisioning_runs' AS table_name, NULL::bigint AS row_count, 'ABSENT' AS state;
\endif

\if :commercial_provisioning_steps_exists
SELECT
    'provisioning_steps' AS table_name,
    count(*) AS row_count,
    count(*) FILTER (
        WHERE external_resource_id IS NOT NULL OR external_url IS NOT NULL
    ) AS rows_with_external_identity
FROM public.provisioning_steps;
\else
SELECT 'provisioning_steps' AS table_name, NULL::bigint AS row_count, 'ABSENT' AS state;
\endif

ROLLBACK;
