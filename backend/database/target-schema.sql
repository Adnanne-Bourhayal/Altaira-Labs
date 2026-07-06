-- Altaira Workspace target database schema
-- Purpose: non-destructive draft for the academic Lead, Client and Service Management prototype.
-- Security: this file must not contain passwords, tokens, or full connection strings.
--
-- IMPORTANT:
-- This SQL has not been applied to Neon.
-- Apply only after backend/admin changes are planned and approved.
-- It extends the current MVP instead of replacing it.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name character varying NOT NULL,
    business_name character varying NOT NULL,
    email character varying NOT NULL,
    industry character varying,
    goals character varying,
    status character varying NOT NULL DEFAULT 'new',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS phone character varying,
    ADD COLUMN IF NOT EXISTS website character varying,
    ADD COLUMN IF NOT EXISTS source character varying,
    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS retention_until date,
    ADD COLUMN IF NOT EXISTS anonymized_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email character varying NOT NULL UNIQUE,
    full_name character varying NOT NULL,
    role character varying NOT NULL DEFAULT 'admin',
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT users_role_check CHECK (role IN ('admin', 'consultant', 'auditor'))
);

ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name character varying NOT NULL,
    company character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    status character varying NOT NULL DEFAULT 'active',
    source_lead_id uuid UNIQUE REFERENCES public.leads(id) ON DELETE SET NULL,
    assigned_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    retention_until date,
    archived_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT clients_status_check CHECK (status IN ('active', 'paused', 'archived'))
);

CREATE TABLE IF NOT EXISTS public.client_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    full_name character varying NOT NULL,
    email character varying,
    phone character varying,
    role_title character varying,
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name character varying NOT NULL UNIQUE,
    category character varying,
    description text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    assigned_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    status character varying NOT NULL DEFAULT 'planned',
    start_date date,
    due_date date,
    completed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT client_services_status_check CHECK (status IN ('planned', 'in_progress', 'review', 'delivered', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS public.internal_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    client_service_id uuid REFERENCES public.client_services(id) ON DELETE CASCADE,
    author_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    content text NOT NULL,
    author character varying NOT NULL DEFAULT 'Admin',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT internal_notes_owner_check CHECK (
        lead_id IS NOT NULL OR client_id IS NOT NULL OR client_service_id IS NOT NULL
    )
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    client_service_id uuid REFERENCES public.client_services(id) ON DELETE CASCADE,
    assigned_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    title character varying NOT NULL,
    description text,
    status character varying NOT NULL DEFAULT 'todo',
    due_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
    CONSTRAINT tasks_owner_check CHECK (
        lead_id IS NOT NULL OR client_id IS NOT NULL OR client_service_id IS NOT NULL
    )
);

CREATE TABLE IF NOT EXISTS public.lead_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    previous_status character varying,
    new_status character varying NOT NULL,
    changed_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    note text,
    changed_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.communication_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    client_service_id uuid REFERENCES public.client_services(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    channel character varying NOT NULL,
    direction character varying NOT NULL DEFAULT 'outbound',
    subject character varying,
    summary text NOT NULL,
    occurred_at timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT communication_logs_owner_check CHECK (
        lead_id IS NOT NULL OR client_id IS NOT NULL OR client_service_id IS NOT NULL
    ),
    CONSTRAINT communication_logs_channel_check CHECK (channel IN ('email', 'phone', 'meeting', 'whatsapp', 'other')),
    CONSTRAINT communication_logs_direction_check CHECK (direction IN ('inbound', 'outbound', 'internal'))
);

CREATE TABLE IF NOT EXISTS public.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    client_service_id uuid REFERENCES public.client_services(id) ON DELETE CASCADE,
    uploaded_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    file_name character varying NOT NULL,
    storage_key character varying NOT NULL,
    mime_type character varying,
    file_size_bytes bigint,
    classification character varying NOT NULL DEFAULT 'internal',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT documents_owner_check CHECK (
        lead_id IS NOT NULL OR client_id IS NOT NULL OR client_service_id IS NOT NULL
    ),
    CONSTRAINT documents_classification_check CHECK (classification IN ('public', 'internal', 'confidential'))
);

CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    action character varying NOT NULL,
    entity_type character varying NOT NULL,
    entity_id uuid,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_status_created_at ON public.leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_user_id ON public.leads(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_source_lead_id ON public.clients(source_lead_id);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_user_id ON public.clients(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON public.client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_services_client_id ON public.client_services(client_id);
CREATE INDEX IF NOT EXISTS idx_client_services_service_id ON public.client_services(service_id);
CREATE INDEX IF NOT EXISTS idx_client_services_assigned_user_id ON public.client_services(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_lead_id ON public.internal_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_client_id ON public.internal_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_client_service_id ON public.internal_notes(client_service_id);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON public.tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_service_id ON public.tasks(client_service_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user_id ON public.tasks(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id ON public.lead_status_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_lead_id ON public.communication_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_client_id ON public.communication_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_client_service_id ON public.communication_logs(client_service_id);
CREATE INDEX IF NOT EXISTS idx_documents_lead_id ON public.documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_service_id ON public.documents(client_service_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_leads_updated_at') THEN
        CREATE TRIGGER trg_leads_updated_at
        BEFORE UPDATE ON public.leads
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
        CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON public.users
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_clients_updated_at') THEN
        CREATE TRIGGER trg_clients_updated_at
        BEFORE UPDATE ON public.clients
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_services_updated_at') THEN
        CREATE TRIGGER trg_services_updated_at
        BEFORE UPDATE ON public.services
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_client_services_updated_at') THEN
        CREATE TRIGGER trg_client_services_updated_at
        BEFORE UPDATE ON public.client_services
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tasks_updated_at') THEN
        CREATE TRIGGER trg_tasks_updated_at
        BEFORE UPDATE ON public.tasks
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

-- Recommended safe service seed, to run only when the Services UI/API exists:
--
-- INSERT INTO public.services (name, category, description)
-- VALUES
--     ('Website Development', 'Web', 'Representative website design and development service.'),
--     ('Landing Pages', 'Web', 'Representative conversion-focused landing page service.'),
--     ('Internal Dashboards', 'Operations', 'Representative internal dashboard service.'),
--     ('CRM-style Tools', 'Operations', 'Representative lightweight CRM/workspace service.'),
--     ('Automation Workflows', 'Automation', 'Representative process automation service.'),
--     ('API Integrations', 'Integration', 'Representative integration service.'),
--     ('Technical Consulting', 'Consulting', 'Representative technical consulting service.')
-- ON CONFLICT (name) DO NOTHING;
