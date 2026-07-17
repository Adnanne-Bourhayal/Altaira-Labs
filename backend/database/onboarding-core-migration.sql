-- Altaira Workspace onboarding core migration
-- Purpose: additive PostgreSQL/Neon SQL for client onboarding tasks, written signature audit, and client workspace access.
-- Security: no passwords, API keys, tokens, or full connection strings belong in this file.
--
-- This migration is non-destructive. Review before applying to Neon.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS sector_type character varying NOT NULL DEFAULT 'custom';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'clients_sector_type_check'
          AND conrelid = 'public.clients'::regclass
    ) THEN
        ALTER TABLE public.clients DROP CONSTRAINT clients_sector_type_check;
    END IF;
END $$;

ALTER TABLE public.clients
    ADD CONSTRAINT clients_sector_type_check
    CHECK (sector_type IN ('clinics', 'restaurants', 'car_dealers', 'custom'));

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'app_users_role_check'
          AND conrelid = 'public.app_users'::regclass
    ) THEN
        ALTER TABLE public.app_users DROP CONSTRAINT app_users_role_check;
    END IF;
END $$;

ALTER TABLE public.app_users
    ADD CONSTRAINT app_users_role_check
    CHECK (role IN ('admin', 'consultant', 'auditor', 'client_user', 'viewer'));

CREATE TABLE IF NOT EXISTS public.client_user_access (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    role character varying NOT NULL DEFAULT 'client_user',
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT client_user_access_role_check CHECK (role IN ('client_user', 'viewer')),
    CONSTRAINT client_user_access_unique_user_client UNIQUE (user_id, client_id)
);

CREATE TABLE IF NOT EXISTS public.client_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    email character varying(160) NOT NULL,
    role character varying NOT NULL DEFAULT 'client_user',
    token_hash character varying(64) NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    revoked_at timestamp with time zone,
    email_sent boolean NOT NULL DEFAULT false,
    email_message character varying(300),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT client_invitations_role_check CHECK (role IN ('client_user', 'viewer'))
);

CREATE TABLE IF NOT EXISTS public.client_workspaces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
    name character varying NOT NULL,
    status character varying NOT NULL DEFAULT 'onboarding',
    onboarding_completed boolean NOT NULL DEFAULT false,
    contract_submitted_at timestamp with time zone,
    contract_approved_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT client_workspaces_status_check CHECK (status IN ('onboarding', 'active', 'paused', 'archived'))
);

CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.client_workspaces(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    client_service_id uuid REFERENCES public.client_services(id) ON DELETE CASCADE,
    service_key character varying NOT NULL DEFAULT 'general',
    sector_type character varying NOT NULL DEFAULT 'custom',
    task_key character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    task_type character varying NOT NULL,
    status character varying NOT NULL DEFAULT 'pending',
    required boolean NOT NULL DEFAULT true,
    critical boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 100,
    data_json text NOT NULL DEFAULT '{}',
    file_metadata_json text NOT NULL DEFAULT '[]',
    signature_full_name character varying,
    signature_document_id character varying,
    signature_consent boolean NOT NULL DEFAULT false,
    signed_ip character varying(80),
    signed_user_agent character varying(500),
    signed_at timestamp with time zone,
    signed_pdf_storage_key character varying,
    admin_feedback text,
    submitted_at timestamp with time zone,
    approved_at timestamp with time zone,
    rejected_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT onboarding_tasks_type_check CHECK (task_type IN ('signature', 'file_upload', 'preferences_form')),
    CONSTRAINT onboarding_tasks_status_check CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
    CONSTRAINT onboarding_tasks_sector_type_check CHECK (sector_type IN ('clinics', 'restaurants', 'car_dealers', 'custom')),
    CONSTRAINT onboarding_tasks_unique_key UNIQUE (workspace_id, client_service_id, task_key)
);

CREATE TABLE IF NOT EXISTS public.onboarding_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid REFERENCES public.onboarding_tasks(id) ON DELETE CASCADE,
    workspace_id uuid REFERENCES public.client_workspaces(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    actor_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
    actor_role character varying NOT NULL,
    action character varying NOT NULL,
    ip_address character varying(80),
    user_agent character varying(500),
    metadata_json text NOT NULL DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES public.onboarding_tasks(id) ON DELETE CASCADE,
    workspace_id uuid NOT NULL REFERENCES public.client_workspaces(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    original_filename character varying(255) NOT NULL,
    stored_filename character varying(255) NOT NULL,
    storage_key character varying(700) NOT NULL UNIQUE,
    content_type character varying(120),
    size_bytes bigint NOT NULL,
    checksum_sha256 character varying(64),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    client_service_id uuid REFERENCES public.client_services(id) ON DELETE SET NULL,
    project_key character varying NOT NULL DEFAULT 'web_seo',
    name character varying NOT NULL,
    current_phase character varying NOT NULL DEFAULT 'requirements',
    staging_url character varying,
    latest_client_feedback text,
    revision_pending_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT client_projects_phase_check CHECK (current_phase IN ('requirements', 'design', 'development', 'review', 'launch')),
    CONSTRAINT client_projects_unique_assignment_key UNIQUE (client_id, client_service_id, project_key)
);

CREATE TABLE IF NOT EXISTS public.client_project_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    uploaded_by_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
    asset_type character varying(80) NOT NULL DEFAULT 'general',
    notes text,
    original_filename character varying(255) NOT NULL,
    stored_filename character varying(255) NOT NULL,
    storage_key character varying(700) NOT NULL UNIQUE,
    content_type character varying(120),
    size_bytes bigint NOT NULL,
    checksum_sha256 character varying(64),
    status character varying(40) NOT NULL DEFAULT 'uploaded',
    admin_feedback text,
    uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
    reviewed_at timestamp with time zone,
    CONSTRAINT client_project_assets_status_check CHECK (status IN ('uploaded', 'approved', 'rejected'))
);

CREATE TABLE IF NOT EXISTS public.client_crm_leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    created_by_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
    full_name character varying(160) NOT NULL,
    email character varying(180),
    phone character varying(80),
    source character varying(80),
    status character varying(40) NOT NULL DEFAULT 'new_lead',
    priority character varying(40) NOT NULL DEFAULT 'normal',
    sector_type character varying NOT NULL DEFAULT 'custom',
    sector_fields_json text NOT NULL DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT client_crm_leads_status_check CHECK (status IN ('new_lead', 'contacted', 'appointment_scheduled', 'proposal_sent', 'won', 'lost')),
    CONSTRAINT client_crm_leads_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    CONSTRAINT client_crm_leads_sector_type_check CHECK (sector_type IN ('clinics', 'restaurants', 'car_dealers', 'custom'))
);

CREATE TABLE IF NOT EXISTS public.client_crm_lead_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.client_crm_leads(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    author_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
    author_role character varying NOT NULL DEFAULT 'system',
    visible_to_client boolean NOT NULL DEFAULT false,
    content text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT client_crm_lead_notes_author_role_check CHECK (author_role IN ('client', 'admin', 'system'))
);

CREATE TABLE IF NOT EXISTS public.client_crm_lead_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.client_crm_leads(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    actor_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
    actor_role character varying NOT NULL DEFAULT 'system',
    event_type character varying NOT NULL,
    from_status character varying(40),
    to_status character varying(40),
    summary text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT client_crm_lead_events_actor_role_check CHECK (actor_role IN ('client', 'admin', 'system')),
    CONSTRAINT client_crm_lead_events_type_check CHECK (event_type IN ('lead_created', 'status_changed', 'note_added', 'follow_up_created', 'follow_up_status_changed'))
);

CREATE TABLE IF NOT EXISTS public.client_crm_follow_up_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.client_crm_leads(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    created_by_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
    owner_role character varying NOT NULL DEFAULT 'admin',
    visible_to_client boolean NOT NULL DEFAULT false,
    title character varying(180) NOT NULL,
    description text,
    status character varying(40) NOT NULL DEFAULT 'open',
    due_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT client_crm_follow_up_actions_owner_role_check CHECK (owner_role IN ('client', 'admin', 'system')),
    CONSTRAINT client_crm_follow_up_actions_status_check CHECK (status IN ('open', 'done', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS public.client_crm_webhook_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    label character varying NOT NULL DEFAULT 'Website form',
    token_hash character varying(64) NOT NULL UNIQUE,
    token_prefix character varying(24) NOT NULL,
    active boolean NOT NULL DEFAULT true,
    last_used_at timestamp with time zone,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.client_crm_lead_notes
    ADD COLUMN IF NOT EXISTS author_role character varying NOT NULL DEFAULT 'system';

ALTER TABLE public.client_crm_lead_notes
    ADD COLUMN IF NOT EXISTS visible_to_client boolean NOT NULL DEFAULT false;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'client_crm_lead_notes_author_role_check'
    ) THEN
        ALTER TABLE public.client_crm_lead_notes
            ADD CONSTRAINT client_crm_lead_notes_author_role_check
            CHECK (author_role IN ('client', 'admin', 'system'));
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'client_crm_lead_events_type_check'
          AND conrelid = 'public.client_crm_lead_events'::regclass
    ) THEN
        ALTER TABLE public.client_crm_lead_events DROP CONSTRAINT client_crm_lead_events_type_check;
    END IF;
END;
$$;

ALTER TABLE public.client_crm_lead_events
    ADD CONSTRAINT client_crm_lead_events_type_check
    CHECK (event_type IN ('lead_created', 'status_changed', 'note_added', 'follow_up_created', 'follow_up_status_changed'));

CREATE INDEX IF NOT EXISTS idx_clients_sector_type ON public.clients(sector_type);
CREATE INDEX IF NOT EXISTS idx_client_user_access_user_id ON public.client_user_access(user_id);
CREATE INDEX IF NOT EXISTS idx_client_user_access_client_id ON public.client_user_access(client_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_client_id ON public.client_invitations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON public.client_invitations(email);
CREATE INDEX IF NOT EXISTS idx_client_workspaces_client_id ON public.client_workspaces(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_client_id ON public.onboarding_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_workspace_status ON public.onboarding_tasks(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_client_service_id ON public.onboarding_tasks(client_service_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_audit_logs_task_id ON public.onboarding_audit_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_audit_logs_client_id ON public.onboarding_audit_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_files_task_id ON public.onboarding_files(task_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_files_client_id ON public.onboarding_files(client_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_client_id ON public.client_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_client_service_id ON public.client_projects(client_service_id);
CREATE INDEX IF NOT EXISTS idx_client_project_assets_project_id ON public.client_project_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_client_project_assets_client_id ON public.client_project_assets(client_id);
CREATE INDEX IF NOT EXISTS idx_client_project_assets_status ON public.client_project_assets(status);
CREATE INDEX IF NOT EXISTS idx_client_crm_leads_client_id ON public.client_crm_leads(client_id);
CREATE INDEX IF NOT EXISTS idx_client_crm_leads_status ON public.client_crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_client_crm_leads_created_at ON public.client_crm_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_client_crm_lead_notes_lead_id ON public.client_crm_lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_client_crm_lead_notes_client_id ON public.client_crm_lead_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_crm_lead_notes_author_role ON public.client_crm_lead_notes(author_role);
CREATE INDEX IF NOT EXISTS idx_client_crm_lead_notes_visible_to_client ON public.client_crm_lead_notes(visible_to_client);
CREATE INDEX IF NOT EXISTS idx_client_crm_lead_events_lead_id ON public.client_crm_lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_client_crm_lead_events_client_id ON public.client_crm_lead_events(client_id);
CREATE INDEX IF NOT EXISTS idx_client_crm_lead_events_created_at ON public.client_crm_lead_events(created_at);
CREATE INDEX IF NOT EXISTS idx_client_crm_follow_up_actions_lead_id ON public.client_crm_follow_up_actions(lead_id);
CREATE INDEX IF NOT EXISTS idx_client_crm_follow_up_actions_client_id ON public.client_crm_follow_up_actions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_crm_follow_up_actions_status ON public.client_crm_follow_up_actions(status);
CREATE INDEX IF NOT EXISTS idx_client_crm_follow_up_actions_due_at ON public.client_crm_follow_up_actions(due_at);
CREATE INDEX IF NOT EXISTS idx_client_crm_follow_up_actions_visible_to_client ON public.client_crm_follow_up_actions(visible_to_client);
CREATE INDEX IF NOT EXISTS idx_client_crm_webhook_tokens_client_id ON public.client_crm_webhook_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_client_crm_webhook_tokens_active ON public.client_crm_webhook_tokens(active);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_client_user_access_updated_at') THEN
        CREATE TRIGGER trg_client_user_access_updated_at
        BEFORE UPDATE ON public.client_user_access
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_client_invitations_updated_at') THEN
        CREATE TRIGGER trg_client_invitations_updated_at
        BEFORE UPDATE ON public.client_invitations
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_client_workspaces_updated_at') THEN
        CREATE TRIGGER trg_client_workspaces_updated_at
        BEFORE UPDATE ON public.client_workspaces
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_onboarding_tasks_updated_at') THEN
        CREATE TRIGGER trg_onboarding_tasks_updated_at
        BEFORE UPDATE ON public.onboarding_tasks
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_client_projects_updated_at') THEN
        CREATE TRIGGER trg_client_projects_updated_at
        BEFORE UPDATE ON public.client_projects
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_client_crm_leads_updated_at') THEN
        CREATE TRIGGER trg_client_crm_leads_updated_at
        BEFORE UPDATE ON public.client_crm_leads
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_client_crm_follow_up_actions_updated_at') THEN
        CREATE TRIGGER trg_client_crm_follow_up_actions_updated_at
        BEFORE UPDATE ON public.client_crm_follow_up_actions
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_client_crm_webhook_tokens_updated_at') THEN
        CREATE TRIGGER trg_client_crm_webhook_tokens_updated_at
        BEFORE UPDATE ON public.client_crm_webhook_tokens
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;
