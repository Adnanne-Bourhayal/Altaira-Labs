-- Altaira Workspace: structured lead intake and controlled conversion.
-- Additive PostgreSQL/Neon migration. No existing rows are changed or deleted.

CREATE TABLE IF NOT EXISTS public.lead_assessments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    form_key character varying(40) NOT NULL,
    schema_version integer NOT NULL DEFAULT 1,
    status character varying(20) NOT NULL DEFAULT 'submitted',
    responses_json text NOT NULL DEFAULT '{}',
    recommended_services_json text NOT NULL DEFAULT '[]',
    qualification_summary text NOT NULL DEFAULT '',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT lead_assessments_form_key_check CHECK (
        form_key IN ('general', 'web_seo', 'booking', 'crm', 'automation', 'dashboard')
    ),
    CONSTRAINT lead_assessments_status_check CHECK (
        status IN ('draft', 'submitted', 'reviewed')
    ),
    CONSTRAINT lead_assessments_lead_form_unique UNIQUE (lead_id, form_key)
);

CREATE INDEX IF NOT EXISTS idx_lead_assessments_lead_id
    ON public.lead_assessments(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_assessments_status_updated
    ON public.lead_assessments(status, updated_at DESC);
