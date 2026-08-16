-- Altaira Workspace auth/security migration
-- Purpose: additive PostgreSQL/Neon SQL for admin/demo authentication.
-- Security: passwords and session tokens are stored as hashes, not plaintext.
--
-- Tables added:
-- - app_users
-- - app_user_sessions
-- - security_events

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.app_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username character varying(120) NOT NULL UNIQUE,
    password_hash character varying(120) NOT NULL,
    role character varying(40) NOT NULL DEFAULT 'admin',
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    last_login_at timestamp with time zone,
    CONSTRAINT app_users_role_check CHECK (role IN ('admin', 'consultant', 'auditor')),
    CONSTRAINT app_users_password_hash_check CHECK (password_hash LIKE '$2%')
);

CREATE TABLE IF NOT EXISTS public.app_user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    session_token_hash character varying(64) NOT NULL UNIQUE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.security_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
    username character varying(120),
    event_type character varying(60) NOT NULL,
    success boolean NOT NULL DEFAULT false,
    ip_address character varying(80),
    user_agent character varying(500),
    metadata text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT security_events_type_check CHECK (
        event_type IN (
            'login_success',
            'login_failed',
            'user_created',
            'client_invitation_created',
            'client_invitation_accepted',
            'password_changed',
            'user_disabled',
            'logout'
        )
    )
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'security_events_type_check'
          AND conrelid = 'public.security_events'::regclass
    ) THEN
        ALTER TABLE public.security_events DROP CONSTRAINT security_events_type_check;
    END IF;
END $$;

ALTER TABLE public.security_events
    ADD CONSTRAINT security_events_type_check CHECK (
        event_type IN (
            'login_success',
            'login_failed',
            'user_created',
            'client_invitation_created',
            'client_invitation_accepted',
            'password_changed',
            'user_disabled',
            'logout'
        )
    );

CREATE INDEX IF NOT EXISTS idx_app_users_username_lower ON public.app_users (lower(username));
CREATE INDEX IF NOT EXISTS idx_app_user_sessions_user_id ON public.app_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_app_user_sessions_token_hash ON public.app_user_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_app_user_sessions_expires_at ON public.app_user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_username ON public.security_events(username);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_app_users_updated_at') THEN
        CREATE TRIGGER trg_app_users_updated_at
        BEFORE UPDATE ON public.app_users
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;
