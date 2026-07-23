\set ON_ERROR_STOP on
\pset pager off

BEGIN TRANSACTION READ ONLY;

SELECT
    current_database() AS database_name,
    current_schema() AS schema_name,
    current_setting('transaction_read_only') AS transaction_read_only,
    current_setting('server_version') AS server_version,
    clock_timestamp() AS checked_at;

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
    'required_tables' AS check_name,
    CASE WHEN count(*) FILTER (WHERE actual.table_name IS NULL) = 0 THEN 'PASS' ELSE 'FAIL' END AS result,
    COALESCE(string_agg(expected.table_name, ', ' ORDER BY expected.table_name)
        FILTER (WHERE actual.table_name IS NULL), '') AS missing
FROM expected
LEFT JOIN information_schema.tables actual
  ON actual.table_schema = 'public'
 AND actual.table_name = expected.table_name;

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
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN (
      'commercial_flows',
      'commercial_payment_sessions',
      'commercial_payment_events',
      'commercial_email_logs',
      'provisioning_runs',
      'provisioning_steps'
  )
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

SELECT 'commercial_flows' AS table_name, count(*) AS row_count FROM public.commercial_flows
UNION ALL
SELECT 'commercial_payment_sessions', count(*) FROM public.commercial_payment_sessions
UNION ALL
SELECT 'commercial_payment_events', count(*) FROM public.commercial_payment_events
UNION ALL
SELECT 'commercial_email_logs', count(*) FROM public.commercial_email_logs
UNION ALL
SELECT 'provisioning_runs', count(*) FROM public.provisioning_runs
UNION ALL
SELECT 'provisioning_steps', count(*) FROM public.provisioning_steps
ORDER BY table_name;

SELECT
    count(*) AS provisioning_run_count,
    count(*) FILTER (WHERE dry_run = false) AS non_dry_run_count
FROM public.provisioning_runs;

SELECT
    count(*) AS provisioning_step_count,
    count(*) FILTER (
        WHERE external_resource_id IS NOT NULL OR external_url IS NOT NULL
    ) AS rows_with_external_identity
FROM public.provisioning_steps;

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

ROLLBACK;
