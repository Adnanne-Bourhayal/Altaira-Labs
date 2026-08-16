-- Altaira internal Provisioning Engine
-- Additive PostgreSQL/Neon migration. Prepared only; do not apply without approval.
-- No provider credentials or external resource secrets belong in these tables.

CREATE TABLE IF NOT EXISTS public.provisioning_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    assessment_id uuid NOT NULL REFERENCES public.lead_assessments(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS provisioning_plans_lead_idx
    ON public.provisioning_plans(lead_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.provisioning_plan_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES public.provisioning_plans(id) ON DELETE CASCADE,
    provider_key character varying(40) NOT NULL,
    resource_type character varying(60) NOT NULL,
    resource_name character varying(240) NOT NULL,
    action character varying(40) NOT NULL,
    status character varying(30) NOT NULL DEFAULT 'planned',
    required boolean NOT NULL DEFAULT true,
    reason text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS provisioning_plan_items_plan_idx
    ON public.provisioning_plan_items(plan_id, sort_order);

CREATE TABLE IF NOT EXISTS public.provisioning_selected_tools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES public.provisioning_plans(id) ON DELETE CASCADE,
    tool_key character varying(40) NOT NULL,
    display_name character varying(100) NOT NULL,
    selection_state character varying(20) NOT NULL,
    automation_level character varying(4) NOT NULL,
    required boolean NOT NULL DEFAULT false,
    reason text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    CONSTRAINT provisioning_tools_plan_key_unique UNIQUE (plan_id, tool_key)
);

CREATE TABLE IF NOT EXISTS public.provisioning_manual_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES public.provisioning_plans(id) ON DELETE CASCADE,
    provider_key character varying(40) NOT NULL,
    title character varying(220) NOT NULL,
    reason text NOT NULL,
    required boolean NOT NULL DEFAULT true,
    status character varying(30) NOT NULL DEFAULT 'pending',
    sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.provisioning_external_resources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES public.provisioning_plans(id) ON DELETE CASCADE,
    provider_key character varying(40) NOT NULL,
    resource_type character varying(60) NOT NULL,
    external_resource_id character varying(240),
    external_url character varying(1000),
    status character varying(30) NOT NULL DEFAULT 'placeholder',
    idempotency_key character varying(200) NOT NULL,
    CONSTRAINT provisioning_external_resource_idempotency_unique UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS provisioning_external_resources_plan_idx
    ON public.provisioning_external_resources(plan_id, provider_key);
