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
PostgreSQL: localhost:5432/altaira
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
- `/login`
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

- Next internal API routes require the `altaira_admin_auth` cookie.
- Backend lead read/update endpoints require `X-Internal-API-Token`.
- The frontend server reads `INTERNAL_API_TOKEN` from `.env.local` and forwards it to the backend.

Flow:

```text
Admin browser
  -> POST /api/auth/login
  -> receives httpOnly altaira_admin_auth cookie
  -> calls /api/internal/*
  -> Next route verifies cookie
  -> Next route forwards X-Internal-API-Token
  -> Spring Boot verifies token
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

- Hibernate `ddl-auto=update` is kept for MVP speed and local development.
- H2 is used only for automated tests.
- PostgreSQL remains the real local/deployed database target.
- Admin auth is simple cookie-based auth, acceptable for MVP/demo, but not a full production identity solution.
- Internal token protection is simple and explicit, suitable for a student MVP.
