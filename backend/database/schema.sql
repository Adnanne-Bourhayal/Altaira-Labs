-- Altaira Workspace MVP database schema
-- Purpose: documented baseline for the lead-flow PostgreSQL database.
-- Security: this file must not contain passwords, tokens, or full connection strings.
--
-- Baseline MVP table: public.leads
-- Additional additive schema files:
-- - core-expansion-migration.sql
-- - auth-security-migration.sql
-- - lead-intake-conversion-migration.sql
-- - provisioning-engine-migration.sql
-- Runtime note: Spring Boot/Hibernate can maintain this table during MVP using ddl-auto=update.
-- Future hardening: replace ddl-auto with explicit migrations before production-grade release.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name character varying NOT NULL,
    business_name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    industry character varying,
    service_interest character varying,
    goals character varying,
    status character varying NOT NULL DEFAULT 'new',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- The backend currently enforces allowed status values in application code:
-- new, contacted, qualified, converted, lost, closed.
--
-- Do not apply destructive ALTER statements to Neon without an approved migration plan.
