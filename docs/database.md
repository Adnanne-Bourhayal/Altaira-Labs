# Database

This document describes the current database setup for Altaira Workspace.

## Current Database

| Item | Value |
|---|---|
| Database type | PostgreSQL |
| Provider | Neon PostgreSQL |
| Host | `ep-odd-surf-an6ije74.c-6.us-east-1.aws.neon.tech` |
| Port | `5432` |
| Database name | `neondb` |
| Username | Stored in local/Render environment variable `SPRING_DATASOURCE_USERNAME` |
| Password | Stored in local/Render environment variable `SPRING_DATASOURCE_PASSWORD` |
| SSL | Required through `sslmode=require` |

Do not commit database passwords or full connection strings. Local secrets are stored outside the repo in:

```text
/Volumes/T7/Altaira_Labs/.secrets/neon-render.env
```

The local Spring Boot backend imports this file automatically through `backend/src/main/resources/application.properties`.

For the full map of where each environment variable, password, and token belongs, see:

```text
docs/environment.md
```

## Environment Variables

Expected backend variables:

```text
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
INTERNAL_API_TOKEN
ALTAIRA_AUTH_SESSION_HOURS
ALTAIRA_DEMO_ADMIN_ENABLED
ALTAIRA_DEMO_ADMIN_USERNAME
ALTAIRA_DEMO_ADMIN_PASSWORD
ALTAIRA_DEMO_ADMIN_ROLE
```

Expected local helper variable:

```text
RENDER_BACKEND_URL
```

## Current Schema

The original MVP database contained:

```text
public.leads
```

Current columns:

| Column | Type | Nullable | Default |
|---|---|---:|---|
| `id` | `uuid` | no | `gen_random_uuid()` |
| `full_name` | `character varying` | no | none |
| `business_name` | `character varying` | no | none |
| `email` | `character varying` | no | none |
| `phone` | `character varying` | yes | none |
| `industry` | `character varying` | yes | none |
| `service_interest` | `character varying` | yes | none |
| `goals` | `character varying` | yes | none |
| `status` | `character varying` | no | `'new'` |
| `created_at` | `timestamp with time zone` | no | `now()` |

Current constraints/indexes:

- Primary key: `leads_pkey` on `id`.

Current extensions:

- `pgcrypto`
- `plpgsql`

The documented SQL baseline lives at:

```text
backend/database/schema.sql
```

The additive SQL for the public contact lead fields lives at:

```text
backend/database/contact-lead-fields-migration.sql
```

No seed file is required for the MVP. Demo/test data should be created through the public lead form or API so the real flow is exercised.

## Core Expansion Schema

The academic core now adds the small Lead + Client + Service Management database design:

```text
public.clients
public.services
public.client_services
public.internal_notes
```

Migration SQL:

```text
backend/database/core-expansion-migration.sql
```

Seed SQL:

```text
backend/database/core-expansion-seed.sql
```

The backend also seeds the same service catalogue idempotently at startup.

Core relationships:

```text
leads.id -> clients.source_lead_id
clients.id -> client_services.client_id
services.id -> client_services.service_id
leads.id -> internal_notes.lead_id
clients.id -> internal_notes.client_id
```

The core expansion is additive. It does not remove or rewrite existing lead data.

## Core Tables

`clients` stores real business/person records created manually or from a lead.

Main columns:

- `id`
- `name`
- `company`
- `email`
- `phone`
- `source_lead_id`
- `status`
- `created_at`
- `updated_at`

`services` stores the Altaira Labs service catalogue.

Initial catalogue:

- Website Development
- Booking Systems
- Automation Workflows
- Internal Dashboards
- CRM / Business Systems
- API Integration
- Technical Consulting

`client_services` links clients to services and tracks delivery status.

Allowed statuses:

- `planned`
- `in_progress`
- `review`
- `delivered`
- `cancelled`

`internal_notes` stores internal notes attached to a lead or a client.

## Auth/Security Schema

Admin/demo authentication now adds:

```text
public.app_users
public.app_user_sessions
public.security_events
```

Migration SQL:

```text
backend/database/auth-security-migration.sql
```

Demo admin seed SQL:

```text
backend/database/auth-demo-admin-seed.sql
```

Demo/local/TFG login:

```text
username: admin123
password: admin123
role: admin
```

Important security details:

- `app_users.password_hash` stores BCrypt hashes, not plaintext passwords.
- `app_user_sessions.session_token_hash` stores SHA-256 hashes of session tokens, not raw session tokens.
- `security_events` records `login_success`, `login_failed`, `user_created`, `logout`, and reserved future events.
- The demo credential is for local/TFG demonstration, not serious production.

## Visual Database Checks

Use Neon Console, DBeaver, pgAdmin, or TablePlus.

Quick checks:

```sql
select count(*) from public.leads;
select count(*) from public.clients;
select count(*) from public.services;
select count(*) from public.client_services;
select count(*) from public.internal_notes;
select count(*) from public.app_users;
select count(*) from public.app_user_sessions;
select count(*) from public.security_events;
```

Connected flow check:

```sql
select
    l.full_name as lead_name,
    c.name as client_name,
    c.company,
    s.name as service_name,
    cs.status as service_status
from public.clients c
left join public.leads l on l.id = c.source_lead_id
left join public.client_services cs on cs.client_id = c.id
left join public.services s on s.id = cs.service_id
order by c.created_at desc;
```

## Local Backend With Neon

Run from the backend folder:

```bash
cd /Volumes/T7/Altaira_Labs/Altaira_Labs_web/backend
./mvnw spring-boot:run
```

The command above uses Neon because `application.properties` imports:

```text
/Volumes/T7/Altaira_Labs/.secrets/neon-render.env
```

If you see `FATAL: role "altaira" does not exist`, the backend is using the old local PostgreSQL fallback. The current configuration should not set `SPRING_DATASOURCE_USERNAME=altaira` unless you intentionally created that local role.

Verify local backend health:

```bash
curl -i http://localhost:8080/api/v1/health
```

Expected:

- HTTP `200`.
- JSON contains `"status":"ok"`.

## Render Backend

Current Render backend:

```text
https://altaira-labs-1.onrender.com
```

Health check:

```bash
curl -i https://altaira-labs-1.onrender.com/api/v1/health
```

Expected:

- HTTP `200`.
- JSON contains `"status":"ok"`.

## Safety Rules

- Do not paste passwords into docs, reports, or README files.
- Do not commit `.env`, `.env.local`, `.secrets`, or Neon connection strings.
- Do not run destructive SQL on Neon without a prepared SQL plan and explicit confirmation.
- Use public lead creation for smoke tests, then delete temporary smoke rows.
