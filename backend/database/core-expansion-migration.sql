-- Altaira Workspace core expansion migration
-- Purpose: additive PostgreSQL/Neon SQL for the academic Lead + Client + Service Management core.
-- Security: no passwords, tokens, or full connection strings belong in this file.
--
-- Tables added:
-- - clients
-- - services
-- - client_services
-- - internal_notes
--
-- This migration is non-destructive. Review and approve before applying to Neon.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name character varying NOT NULL,
    company character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    source_lead_id uuid UNIQUE REFERENCES public.leads(id) ON DELETE SET NULL,
    status character varying NOT NULL DEFAULT 'active',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT clients_status_check CHECK (status IN ('active', 'paused', 'archived'))
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
    status character varying NOT NULL DEFAULT 'planned',
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT client_services_status_check CHECK (status IN ('planned', 'in_progress', 'review', 'delivered', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS public.internal_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    content text NOT NULL,
    author character varying NOT NULL DEFAULT 'Admin',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT internal_notes_owner_check CHECK (
        lead_id IS NOT NULL OR client_id IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_clients_source_lead_id ON public.clients(source_lead_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_active_name ON public.services(active, name);
CREATE INDEX IF NOT EXISTS idx_client_services_client_id ON public.client_services(client_id);
CREATE INDEX IF NOT EXISTS idx_client_services_service_id ON public.client_services(service_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_lead_id ON public.internal_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_client_id ON public.internal_notes(client_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
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
END $$;
