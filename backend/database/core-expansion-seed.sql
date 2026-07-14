-- Altaira Workspace core expansion seed
-- Purpose: idempotent initial service catalogue based on the website and enterprise docs.
-- Safe to run after core-expansion-migration.sql.

INSERT INTO public.services (name, category, description, active)
VALUES
    ('Website Development', 'Web', 'Professional websites and landing pages that capture leads.', true),
    ('Booking Systems', 'Operations', 'Online booking flows, reminders, and scheduling support.', true),
    ('Automation Workflows', 'Automation', 'Automations for repetitive follow-up and internal tasks.', true),
    ('Internal Dashboards', 'Operations', 'Dashboards for leads, clients, services, and business visibility.', true),
    ('CRM / Business Systems', 'Business Systems', 'Lightweight CRM-style tools and internal management systems.', true),
    ('API Integration', 'Integration', 'Connections between business tools and external APIs.', true),
    ('Technical Consulting', 'Consulting', 'Technical planning and implementation support for small businesses.', true)
ON CONFLICT (name) DO UPDATE
SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    active = EXCLUDED.active,
    updated_at = now();
