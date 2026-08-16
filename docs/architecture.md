# Architecture

## Current MVP Architecture

```text
Browser
  -> Next.js App Router frontend
  -> Next.js API routes
  -> Spring Boot REST API
  -> PostgreSQL database
```

Deployment target:

```text
Vercel frontend
Render backend
Neon PostgreSQL
```

Local development:

```text
Next.js dev server: http://localhost:3000
Spring Boot backend: http://localhost:8080
PostgreSQL: Neon via /Volumes/T7/Altaira_Labs/.secrets/neon-render.env
```

## Frontend Responsibilities

The frontend owns:

- Public marketing page.
- Public lead form.
- Admin login page.
- Admin dashboard pages.
- Route protection for `/leads`.
- Server-side proxy routes under `/api`.

Important routes:

- `/`
- `/admin/login`
- `/client/login`
- `/login` legacy redirect to `/admin/login`
- `/leads`
- `/leads/[id]`
- `/api/leads`
- `/api/internal/leads`
- `/api/internal/leads/[id]`
- `/api/internal/leads/[id]/status`

## Backend Responsibilities

The backend owns:

- Lead validation.
- Lead persistence.
- Lead listing/detail/status APIs.
- Public lead creation rate limiting.
- Internal token protection for admin/read/update operations.
- Health endpoints.

Layering:

```text
controller -> service -> repository -> database
```

Key packages:

- `controller`
- `dto.lead`
- `entity`
- `exception`
- `repository`
- `security`
- `service`

## Security Model

This is an MVP security model, not a complete production identity system.

Public:

- `POST /api/leads`
- `POST /api/v1/leads`
- Health endpoints.

Admin/internal:

- Next internal API routes require a valid `altaira_admin_session` cookie.
- Next validates the session against Spring Boot `/api/v1/auth/me`.
- Backend admin endpoints accept either `X-Internal-API-Token` for server-to-server calls or `X-Admin-Session-Token` for valid admin sessions.
- The frontend server can still read `INTERNAL_API_TOKEN` from `.env.local` for server-to-server protection.

Flow:

```text
Admin browser
  -> POST /api/auth/login
  -> Spring Boot validates app_users with BCrypt
  -> receives httpOnly altaira_admin_session cookie
  -> calls /api/internal/*
  -> Next route validates session with /api/v1/auth/me
  -> Spring Boot verifies session/token before admin data access
```

## Data Model

Current table:

```text
leads
  id uuid primary key
  full_name text not null
  business_name text not null
  email text not null
  industry text
  goals text
  status text not null
  created_at timestamp not null
```

Allowed statuses:

- `new`
- `contacted`
- `closed`

## MVP Boundaries

In scope:

- Lead capture.
- Lead management.
- Admin status workflow.
- Local reproducibility.
- Basic security controls.

Out of scope until a future sprint:

- Client module.
- Service module.
- Multi-user roles.
- Payment/invoicing.
- CRM integrations.
- Email/WhatsApp automation.
- AI scoring.

## Current Technical Tradeoffs

- Hibernate `ddl-auto=none` is used for Render/Neon once the schema exists, so deployment startup does not run automatic schema updates. Use controlled SQL migrations for future schema changes.
- H2 is used only for automated tests.
- PostgreSQL remains the real local/deployed database target.
- Admin auth is simple cookie-based auth, acceptable for MVP/demo, but not a full production identity solution.
- Internal token protection is simple and explicit, suitable for a student MVP.
