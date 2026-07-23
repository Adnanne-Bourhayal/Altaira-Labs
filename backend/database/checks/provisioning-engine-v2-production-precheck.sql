\set ON_ERROR_STOP on
\pset pager off

BEGIN TRANSACTION READ ONLY;

SELECT
    current_database() AS database_name,
    current_schema() AS schema_name,
    current_setting('transaction_read_only') AS transaction_read_only,
    current_setting('server_version') AS server_version,
    clock_timestamp() AS checked_at;

SELECT
    to_regclass('public.leads') IS NOT NULL AS leads_table_exists,
    to_regprocedure('gen_random_uuid()') IS NOT NULL AS gen_random_uuid_available;

SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name = 'id';

SELECT 'leads' AS table_name, count(*) AS row_count
FROM public.leads;

SELECT
    table_name,
    to_regclass(format('public.%I', table_name)) IS NOT NULL AS exists
FROM (
    VALUES
        ('lead_assessments'),
        ('provisioning_plans'),
        ('provisioning_plan_items'),
        ('provisioning_selected_tools'),
        ('provisioning_manual_steps'),
        ('provisioning_external_resources')
) expected(table_name)
ORDER BY table_name;

SELECT
    to_regclass('public.lead_assessments') IS NOT NULL AS lead_assessments_exists,
    to_regclass('public.provisioning_plans') IS NOT NULL AS provisioning_plans_exists,
    to_regclass('public.provisioning_plan_items') IS NOT NULL AS provisioning_plan_items_exists,
    to_regclass('public.provisioning_selected_tools') IS NOT NULL AS provisioning_selected_tools_exists,
    to_regclass('public.provisioning_manual_steps') IS NOT NULL AS provisioning_manual_steps_exists,
    to_regclass('public.provisioning_external_resources') IS NOT NULL AS provisioning_external_resources_exists
\gset pre_

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
      'lead_assessments',
      'provisioning_plans',
      'provisioning_plan_items',
      'provisioning_selected_tools',
      'provisioning_manual_steps',
      'provisioning_external_resources'
  )
ORDER BY table_name, ordinal_position;

SELECT
    md5(COALESCE(string_agg(
        concat_ws('|', table_name, ordinal_position, column_name, data_type,
            is_nullable, COALESCE(column_default, '')),
        E'\n' ORDER BY table_name, ordinal_position
    ), '')) AS provisioning_schema_fingerprint
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
      'lead_assessments',
      'provisioning_plans',
      'provisioning_plan_items',
      'provisioning_selected_tools',
      'provisioning_manual_steps',
      'provisioning_external_resources'
  );

\if :pre_lead_assessments_exists
SELECT 'lead_assessments' AS table_name, count(*) AS row_count FROM public.lead_assessments;
\else
SELECT 'lead_assessments' AS table_name, NULL::bigint AS row_count, 'ABSENT' AS state;
\endif

\if :pre_provisioning_plans_exists
SELECT 'provisioning_plans' AS table_name, count(*) AS row_count FROM public.provisioning_plans;

SELECT
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'provisioning_plans'
          AND column_name = 'tracks_json'
    ) AS tracks_json_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'provisioning_plans'
          AND column_name = 'shared_resources_json'
    ) AS shared_resources_json_exists
\gset pre_

\if :pre_tracks_json_exists
SELECT
    count(*) FILTER (WHERE tracks_json IS NULL) AS tracks_json_null_rows,
    count(*) FILTER (WHERE tracks_json = '[]') AS tracks_json_empty_rows
FROM public.provisioning_plans;
\endif

\if :pre_shared_resources_json_exists
SELECT
    count(*) FILTER (WHERE shared_resources_json IS NULL) AS shared_resources_json_null_rows,
    count(*) FILTER (WHERE shared_resources_json = '[]') AS shared_resources_json_empty_rows
FROM public.provisioning_plans;
\endif
\else
SELECT 'provisioning_plans' AS table_name, NULL::bigint AS row_count, 'ABSENT' AS state;
\endif

\if :pre_provisioning_plan_items_exists
SELECT 'provisioning_plan_items' AS table_name, count(*) AS row_count FROM public.provisioning_plan_items;
\endif

\if :pre_provisioning_selected_tools_exists
SELECT 'provisioning_selected_tools' AS table_name, count(*) AS row_count FROM public.provisioning_selected_tools;
\endif

\if :pre_provisioning_manual_steps_exists
SELECT 'provisioning_manual_steps' AS table_name, count(*) AS row_count FROM public.provisioning_manual_steps;
\endif

\if :pre_provisioning_external_resources_exists
SELECT
    'provisioning_external_resources' AS table_name,
    count(*) AS row_count,
    count(*) FILTER (
        WHERE external_resource_id IS NOT NULL OR external_url IS NOT NULL
    ) AS rows_with_external_identity
FROM public.provisioning_external_resources;
\endif

ROLLBACK;
