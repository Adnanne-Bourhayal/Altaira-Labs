-- Altaira commercial payment, activation and provisioning audit flow.
-- Additive PostgreSQL/Neon migration. Prepared only; apply under a separate
-- production-write authorization and after a fresh recovery point.
-- Never store Stripe keys, webhook secrets or provider credentials here.

CREATE TABLE IF NOT EXISTS public.commercial_flows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL UNIQUE REFERENCES public.provisioning_plans(id) ON DELETE CASCADE,
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
    workspace_id uuid REFERENCES public.client_workspaces(id) ON DELETE SET NULL,
    payment_status character varying(40) NOT NULL DEFAULT 'PAYMENT_NOT_STARTED',
    client_status character varying(40) NOT NULL DEFAULT 'CLIENT_DRAFT',
    workspace_status character varying(40) NOT NULL DEFAULT 'WORKSPACE_PENDING',
    invitation_status character varying(40) NOT NULL DEFAULT 'INVITATION_PENDING',
    provisioning_status character varying(40) NOT NULL DEFAULT 'PROVISIONING_PENDING',
    activation_error text,
    payment_confirmed_at timestamp with time zone,
    activated_at timestamp with time zone,
    invitation_sent_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS commercial_flows_lead_idx
    ON public.commercial_flows(lead_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.commercial_payment_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id uuid NOT NULL REFERENCES public.commercial_flows(id) ON DELETE CASCADE,
    provider character varying(30) NOT NULL DEFAULT 'STRIPE',
    provider_mode character varying(20) NOT NULL,
    status character varying(40) NOT NULL,
    amount_minor bigint NOT NULL,
    currency character varying(3) NOT NULL,
    customer_email character varying(200) NOT NULL,
    description character varying(500) NOT NULL,
    provider_session_id character varying(240) UNIQUE,
    checkout_url text,
    payment_intent_id character varying(240),
    idempotency_key character varying(200) NOT NULL UNIQUE,
    safe_error text,
    expires_at timestamp with time zone,
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT commercial_payment_amount_positive CHECK (amount_minor > 0)
);

CREATE INDEX IF NOT EXISTS commercial_payment_sessions_flow_idx
    ON public.commercial_payment_sessions(flow_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.commercial_payment_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_session_id uuid REFERENCES public.commercial_payment_sessions(id) ON DELETE SET NULL,
    provider_event_id character varying(240) NOT NULL UNIQUE,
    event_type character varying(100) NOT NULL,
    status character varying(30) NOT NULL DEFAULT 'RECEIVED',
    safe_error text,
    received_at timestamp with time zone NOT NULL DEFAULT now(),
    processed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.commercial_email_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id uuid NOT NULL REFERENCES public.commercial_flows(id) ON DELETE CASCADE,
    email_type character varying(50) NOT NULL,
    recipient character varying(200) NOT NULL,
    status character varying(30) NOT NULL,
    provider_message_id character varying(240),
    safe_error text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    sent_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS commercial_email_logs_flow_idx
    ON public.commercial_email_logs(flow_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.provisioning_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES public.provisioning_plans(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    workspace_id uuid NOT NULL REFERENCES public.client_workspaces(id) ON DELETE CASCADE,
    status character varying(30) NOT NULL,
    dry_run boolean NOT NULL DEFAULT true,
    idempotency_key character varying(200) NOT NULL UNIQUE,
    safe_error text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provisioning_runs_plan_idx
    ON public.provisioning_runs(plan_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.provisioning_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id uuid NOT NULL REFERENCES public.provisioning_runs(id) ON DELETE CASCADE,
    track_key character varying(40),
    provider character varying(40) NOT NULL,
    action character varying(100) NOT NULL,
    status character varying(30) NOT NULL,
    input_summary_json text NOT NULL DEFAULT '{}',
    external_resource_id character varying(240),
    external_url text,
    safe_error text,
    manual_action_required boolean NOT NULL DEFAULT false,
    idempotency_key character varying(240) NOT NULL UNIQUE,
    attempts integer NOT NULL DEFAULT 0,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provisioning_steps_run_idx
    ON public.provisioning_steps(run_id, created_at);
