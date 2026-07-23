\set ON_ERROR_STOP on
\pset pager off

BEGIN TRANSACTION READ ONLY;

SELECT
    current_database() AS database_name,
    current_schema() AS schema_name,
    current_setting('transaction_read_only') AS transaction_read_only,
    clock_timestamp() AS checked_at;

SELECT
    to_regclass('public.leads') IS NOT NULL AS leads_table_exists,
    to_regprocedure('gen_random_uuid()') IS NOT NULL AS gen_random_uuid_available;

WITH expected(table_name) AS (
    VALUES
        ('lead_assessments'),
        ('provisioning_plans'),
        ('provisioning_plan_items'),
        ('provisioning_selected_tools'),
        ('provisioning_manual_steps'),
        ('provisioning_external_resources')
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
        ('lead_assessments', 'id'),
        ('lead_assessments', 'lead_id'),
        ('lead_assessments', 'form_key'),
        ('lead_assessments', 'schema_version'),
        ('lead_assessments', 'status'),
        ('lead_assessments', 'responses_json'),
        ('lead_assessments', 'recommended_services_json'),
        ('lead_assessments', 'qualification_summary'),
        ('lead_assessments', 'created_at'),
        ('lead_assessments', 'updated_at'),
        ('provisioning_plans', 'id'),
        ('provisioning_plans', 'lead_id'),
        ('provisioning_plans', 'assessment_id'),
        ('provisioning_plans', 'route_key'),
        ('provisioning_plans', 'automation_level'),
        ('provisioning_plans', 'automation_scope'),
        ('provisioning_plans', 'status'),
        ('provisioning_plans', 'dry_run'),
        ('provisioning_plans', 'normalized_requirements_json'),
        ('provisioning_plans', 'decision_reason'),
        ('provisioning_plans', 'risks_json'),
        ('provisioning_plans', 'cost_estimate'),
        ('provisioning_plans', 'created_at'),
        ('provisioning_plans', 'updated_at'),
        ('provisioning_plans', 'tracks_json'),
        ('provisioning_plans', 'shared_resources_json'),
        ('provisioning_plan_items', 'id'),
        ('provisioning_plan_items', 'plan_id'),
        ('provisioning_plan_items', 'provider_key'),
        ('provisioning_plan_items', 'resource_type'),
        ('provisioning_plan_items', 'resource_name'),
        ('provisioning_plan_items', 'action'),
        ('provisioning_plan_items', 'status'),
        ('provisioning_plan_items', 'required'),
        ('provisioning_plan_items', 'reason'),
        ('provisioning_plan_items', 'sort_order'),
        ('provisioning_selected_tools', 'id'),
        ('provisioning_selected_tools', 'plan_id'),
        ('provisioning_selected_tools', 'tool_key'),
        ('provisioning_selected_tools', 'display_name'),
        ('provisioning_selected_tools', 'selection_state'),
        ('provisioning_selected_tools', 'automation_level'),
        ('provisioning_selected_tools', 'required'),
        ('provisioning_selected_tools', 'reason'),
        ('provisioning_selected_tools', 'sort_order'),
        ('provisioning_manual_steps', 'id'),
        ('provisioning_manual_steps', 'plan_id'),
        ('provisioning_manual_steps', 'provider_key'),
        ('provisioning_manual_steps', 'title'),
        ('provisioning_manual_steps', 'reason'),
        ('provisioning_manual_steps', 'required'),
        ('provisioning_manual_steps', 'status'),
        ('provisioning_manual_steps', 'sort_order'),
        ('provisioning_external_resources', 'id'),
        ('provisioning_external_resources', 'plan_id'),
        ('provisioning_external_resources', 'provider_key'),
        ('provisioning_external_resources', 'resource_type'),
        ('provisioning_external_resources', 'external_resource_id'),
        ('provisioning_external_resources', 'external_url'),
        ('provisioning_external_resources', 'status'),
        ('provisioning_external_resources', 'idempotency_key')
)
SELECT
    'all_required_columns' AS check_name,
    CASE WHEN count(*) FILTER (WHERE actual.column_name IS NULL) = 0 THEN 'PASS' ELSE 'FAIL' END AS result,
    COALESCE(string_agg(expected.table_name || '.' || expected.column_name, ', '
        ORDER BY expected.table_name, expected.column_name)
        FILTER (WHERE actual.column_name IS NULL), '') AS missing
FROM expected
LEFT JOIN information_schema.columns actual
  ON actual.table_schema = 'public'
 AND actual.table_name = expected.table_name
 AND actual.column_name = expected.column_name;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE
        WHEN data_type = 'text'
         AND is_nullable = 'NO'
         AND column_default = '''[]''::text'
        THEN 'PASS'
        ELSE 'FAIL'
    END AS definition_check
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'provisioning_plans'
  AND column_name IN ('tracks_json', 'shared_resources_json')
ORDER BY column_name;

SELECT
    count(*) AS plan_count,
    count(*) FILTER (WHERE dry_run = false) AS non_dry_run_count,
    count(*) FILTER (WHERE tracks_json IS NULL) AS tracks_json_null_count,
    count(*) FILTER (WHERE shared_resources_json IS NULL) AS shared_resources_json_null_count,
    count(*) FILTER (WHERE tracks_json = '[]' AND shared_resources_json = '[]') AS legacy_compatible_count
FROM public.provisioning_plans;

SELECT
    count(*) AS external_resource_count,
    count(*) FILTER (
        WHERE external_resource_id IS NOT NULL OR external_url IS NOT NULL
    ) AS rows_with_external_identity
FROM public.provisioning_external_resources;

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

SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN (
      'lead_assessments',
      'provisioning_plans',
      'provisioning_plan_items',
      'provisioning_selected_tools',
      'provisioning_manual_steps',
      'provisioning_external_resources'
  )
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

ROLLBACK;
