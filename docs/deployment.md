# Deployment Guide

This guide covers the current TFG release scope: public lead capture, secure admin access, Client Portal, service onboarding, project tracks and the private client CRM. Payment processing, durable S3 uploads and advanced external integrations remain future work.

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
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<optional-google-oauth-web-client-id>
```

Security notes:

- `INTERNAL_API_TOKEN` must not be committed.
- `NEXT_PUBLIC_API_URL` is visible to the browser and must contain only the backend base URL.
- Do not expose `INTERNAL_API_TOKEN` as a `NEXT_PUBLIC_` variable.
- Admin passwords are validated by the backend, not by Vercel environment variables.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is optional. Leave it unset until the matching backend Google client ID and allowed origins are configured.
- Legacy `ADMIN_PASSWORD` and `NEXT_PUBLIC_ADMIN_EMAIL` variables are not used by the current backend-validated admin login and should be removed during a controlled environment cleanup.

## Backend Environment

Set these in Render:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:<port>/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<database-user>
SPRING_DATASOURCE_PASSWORD=<database-password>
INTERNAL_API_TOKEN=<same-token-as-frontend-server>
ALTAIRA_AUTH_SESSION_HOURS=8
ALTAIRA_DEMO_ADMIN_ENABLED=false
ALTAIRA_DEMO_ADMIN_USERNAME=<private-admin-username>
ALTAIRA_DEMO_ADMIN_PASSWORD=<private-strong-admin-password>
ALTAIRA_DEMO_ADMIN_ROLE=admin
ALTAIRA_CLIENT_INVITATION_ACTIVATE_URL=https://<frontend-domain>/client/activate
ALTAIRA_CLIENT_INVITATION_EXPIRES_DAYS=7
GOOGLE_CLIENT_ID=<optional-google-oauth-web-client-id>
SPRING_JPA_HIBERNATE_DDL_AUTO=none
SPRING_JPA_SHOW_SQL=false
SPRING_JPA_FORMAT_SQL=false
```

For Render/Neon deployment, keep `ddl-auto=none` after the schema has been created. This avoids running Hibernate schema updates during every cold start and helps Render detect the web port faster. Use controlled SQL migration files for future schema changes.

`ALTAIRA_CLIENT_INVITATION_ACTIVATE_URL` is required for usable production invitation emails. Without it, generated links fall back to localhost. `GOOGLE_CLIENT_ID` is optional and must match the Vercel public client ID when Google login is enabled.

The backend defaults to no shared internal token and a disabled demo admin. Render must therefore receive an explicit private `INTERNAL_API_TOKEN`. Enable the demo seeder only for a controlled TFG environment; when enabled, it reconciles the configured password, role and active state on startup so credential rotation takes effect.

Keep `AWS_S3_ENABLED=false` for the current demo. The presigned-URL endpoint is prepared, but the existing onboarding/project multipart upload flow is not yet connected to durable S3 completion and metadata persistence.

## Database Migration Order

Apply the additive SQL files in this order before releasing the portal:

1. `backend/database/auth-security-migration.sql`
2. `backend/database/onboarding-core-migration.sql`
3. `backend/database/client-project-config-snapshots-migration.sql`

Run `npm run check:client-portal-schema` before deployment. Do not enable Hibernate auto-update as a replacement for this gate.

## Render Backend Build

Use the backend directory as the service root if Render supports it. Otherwise configure commands from the repository root.

Build command:

```bash
cd backend && ./mvnw package -DskipTests
```

Start command:

```bash
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

The backend reads `server.port=${PORT:8080}`. Render normally provides `PORT=10000`; local runs fall back to `8080`.

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

## Safe Release Sequence

Vercel production deploys `main`. Render is connected to `altaira-labs-branding` with auto-deploy disabled. Because the two production services currently follow different release paths, do not commit the open portal work directly to either production branch.

1. Work from `feature/client-portal-admin-crm` (created locally from `main`) rather than committing on production `main`.
2. Commit the complete frontend, backend, migrations, scripts and docs together.
3. Push the feature branch and use the Vercel preview deployment for frontend review.
4. Verify required Render/Vercel variable names without exposing values.
5. Apply the three additive migrations and run the schema checker.
6. Align Render with `main` while keeping auto-deploy disabled for the coordinated release.
7. Merge the approved feature PR into `main`.
8. Deploy that exact commit manually on Render and verify backend health.
9. Let Vercel publish the same `main` commit.
10. Verify auth boundaries and the complete client workflow.

GitHub currently uses `altaira-labs-branding` as the repository default branch even though Vercel production deploys `main`. Select `main` explicitly as the PR base or change the GitHub default branch in a separate, approved repository administration step.

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
8. Activate an invited client and sign in through `/client/login`.
9. Confirm the client sees only its own workspace and service tracks.
10. Complete and approve the critical onboarding signatures.
11. Add a track link/feedback item and verify it persists.
12. Create and update a private client CRM lead.
13. Confirm client credentials cannot create an admin session.

## Rollback Notes

- Frontend rollback: use Vercel deployment rollback.
- Backend rollback: redeploy the previous Render build or revert the commit and redeploy.
- Database rollback: do not manually edit production data during the MVP demo unless there is a documented reason.

## Current Limitations

- Google login requires manual OAuth credentials and allowed-origin verification.
- Binary onboarding/project files use private local disk and are not durable across Render redeploys; links, metadata and feedback are durable in PostgreSQL.
- Rate limiting is in memory and resets when the backend restarts.
- Database migrations are controlled SQL files rather than an automated Flyway/Liquibase pipeline.
- Demo admin credentials must be replaced before serious production use.
