-- Altaira public contact lead fields migration
-- Purpose: additive PostgreSQL/Neon SQL for public contact requests.
-- Security: no passwords, tokens, or full connection strings belong in this file.
--
-- This migration is non-destructive. It keeps existing leads and adds optional
-- fields used by public contact forms and admin review.

ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS phone character varying,
    ADD COLUMN IF NOT EXISTS service_interest character varying;
