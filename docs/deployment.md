# Deployment Guide

This guide keeps deployment aligned with the current MVP scope: public lead capture and internal lead management. Do not add client, service, CRM, payment, or automation modules as part of deployment preparation.

## Target Architecture

```text
Visitor/Admin Browser
  -> Vercel: Next.js frontend
  -> Render: Spring Boot backend
  -> Neon or managed PostgreSQL
```

## Required Services

- Vercel project for the Next.js frontend.
- Render web service for the Spring Boot backend.
- Neon PostgreSQL database, or an equivalent managed PostgreSQL service.
- Jira Software Scrum project `AWS` for execution tracking.

## Frontend Environment

Set these in Vercel:

```text
NEXT_PUBLIC_APP_URL=https://<frontend-domain>
NEXT_PUBLIC_API_URL=https://<backend-domain>
INTERNAL_API_TOKEN=<same-token-as-backend>
```

Security notes:

- `INTERNAL_API_TOKEN` must not be committed.
- `NEXT_PUBLIC_API_URL` is visible to the browser and must contain only the backend base URL.
- Do not expose `INTERNAL_API_TOKEN` as a `NEXT_PUBLIC_` variable.
- Admin passwords are validated by the backend, not by Vercel environment variables.

## Backend Environment

Set these in Render:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:<port>/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<database-user>
SPRING_DATASOURCE_PASSWORD=<database-password>
INTERNAL_API_TOKEN=<same-token-as-frontend-server>
ALTAIRA_AUTH_SESSION_HOURS=8
ALTAIRA_DEMO_ADMIN_ENABLED=true
ALTAIRA_DEMO_ADMIN_USERNAME=admin123
ALTAIRA_DEMO_ADMIN_PASSWORD=admin123
ALTAIRA_DEMO_ADMIN_ROLE=admin
SPRING_JPA_HIBERNATE_DDL_AUTO=update
SPRING_JPA_SHOW_SQL=false
```

For the MVP, `ddl-auto=update` is acceptable. Before a production-grade release, replace it with explicit migrations.

## Render Backend Build

Use the backend directory as the service root if Render supports it. Otherwise configure commands from the repository root.

Build command:

```bash
cd backend && ./mvnw package -DskipTests
```

Start command:

```bash
java -jar backend/target/backend-0.0.1-SNAPSHOT.jar
```

If the service root is already `backend/`, use:

```bash
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

## Vercel Frontend Build

Build command:

```bash
npm run build
```

Start command is managed by Vercel for Next.js.

## Deployment Smoke Checks

After backend deploy:

```bash
curl -i https://<backend-domain>/api/v1/health
curl -i https://<backend-domain>/actuator/health
```

Expected:

- `/api/v1/health` returns `200`.
- `/actuator/health` returns `UP`.

After frontend deploy:

```bash
curl -i https://<frontend-domain>/api/leads
```

Expected for unsupported method:

- A non-`500` response. Lead creation should be tested with the public form or a controlled POST payload.

Full MVP smoke test:

1. Submit a public lead from the deployed frontend.
2. Confirm the backend returns `201`.
3. Log in as admin.
4. Confirm the lead appears in `/leads`.
5. Open the lead detail page.
6. Update status to `contacted`.
7. Confirm unauthenticated internal endpoints return `401`.

## Rollback Notes

- Frontend rollback: use Vercel deployment rollback.
- Backend rollback: redeploy the previous Render build or revert the commit and redeploy.
- Database rollback: do not manually edit production data during the MVP demo unless there is a documented reason.

## Current Limitations

- Admin auth is a simple MVP cookie flow, not a full identity provider.
- Rate limiting is in memory and resets when the backend restarts.
- Database migrations are not implemented yet.
- Client and service management modules are intentionally out of scope.
