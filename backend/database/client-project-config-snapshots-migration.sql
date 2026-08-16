-- Additive migration for admin-only service configuration snapshots.
-- Safe to run after onboarding-core-migration.sql. It does not modify existing data.

CREATE TABLE IF NOT EXISTS public.client_project_config_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    service_key character varying(80) NOT NULL,
    artifact_type character varying(120) NOT NULL,
    label character varying(180) NOT NULL,
    config_json text NOT NULL,
    created_by_username character varying(180),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_project_config_snapshots_project_created
    ON public.client_project_config_snapshots(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_project_config_snapshots_client
    ON public.client_project_config_snapshots(client_id);

CREATE INDEX IF NOT EXISTS idx_client_project_config_snapshots_service
    ON public.client_project_config_snapshots(service_key);
