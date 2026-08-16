# Testing and Validation

## Frontend Checks

Run from the repo root:

```bash
npm run lint
npm run build
npx tsc --noEmit
npm audit --audit-level=moderate
```

Expected current result:

- `npm run lint`: passes.
- `npm run build`: passes and runs lint/type validation.
- `npx tsc --noEmit`: passes after a clean build has generated `.next/types`.
- `npm audit --audit-level=moderate`: passes with zero vulnerabilities.

Do not run `npx tsc --noEmit` in parallel with `npm run build`, because both commands read/write `.next/types`.

## Public Smoke Script

Run after the frontend and backend are already running:

```bash
npm run smoke:public
```

Default targets:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8080
```

Optional local-only overrides:

```bash
FRONTEND_BASE_URL=http://localhost:3000 \
BACKEND_BASE_URL=http://localhost:8080 \
SMOKE_TIMEOUT_MS=8000 \
npm run smoke:public
```

These are command-time variables for local QA. They are not required Render or Vercel environment variables.

The smoke script checks:

- public homepage
- contact page
- services pages
- business sector page
- calculator
- blog
- admin login shell
- client login/client area shell
- privacy policy
- backend health endpoint

Expected:

- all checks return `PASS`
- if a server is not running, the script fails with the exact failed URL

## Authenticated Client/Admin CRM Smoke Script

Run after the frontend and backend are already running:

```bash
npm run smoke:auth
```

Default target:

```text
Frontend: http://localhost:3000
```

This script does not require new Render or Vercel variables. The following variables are optional local command-time values:

```bash
FRONTEND_BASE_URL=http://localhost:3000 \
SMOKE_TIMEOUT_MS=8000 \
SMOKE_ADMIN_USERNAME=<local-admin-username> \
SMOKE_ADMIN_PASSWORD=<local-admin-password> \
SMOKE_CLIENT_EMAIL=<local-client-email> \
SMOKE_CLIENT_PASSWORD=<local-client-password> \
npm run smoke:auth
```

For admin checks, the script also reads local `.env.local` and can reuse the existing local `ADMIN_EMAIL` and `ADMIN_PASSWORD` values if `SMOKE_ADMIN_USERNAME` and `SMOKE_ADMIN_PASSWORD` are not set. Values are not printed. Keep `.env.local` ignored by Git.

If discovered `.env.local` admin values do not authenticate, the script records that credential check as `SKIP` instead of failing the whole boundary smoke. Pass `SMOKE_ADMIN_USERNAME` and `SMOKE_ADMIN_PASSWORD` explicitly when you want admin login to be a strict pass/fail gate.

If credentials are not provided, the script still checks:

- `/admin/login` loads
- `/client/login` loads
- `/login` redirects to `/admin/login`
- admin `/me` returns `401` without a session
- client `/me` returns `401` without a session
- internal clients API returns `401` without an admin session
- client portal API returns `401` without a client session
- `/clients` redirects to `/admin/login`
- `/admin/services` redirects to `/admin/login`
- `/admin/onboarding/:id` redirects to `/admin/login`
- `/client/dashboard` redirects to `/client/login`
- `/onboarding` redirects to `/client/login`

If credentials are provided, it additionally checks:

- admin login creates an admin session cookie
- admin `/me` works with the session cookie
- `/clients` loads with the admin session cookie
- `/admin/services` loads with the admin session cookie
- internal clients API works with the admin session cookie
- client login creates a client session cookie
- client `/me` works with the session cookie
- `/client/dashboard` loads with the client session cookie

Do not store the smoke credentials in Git. Pass them only in your local terminal or a private secrets file.

## Full Client Portal / Admin CRM E2E Script

Run this after the local frontend and backend are ready and the client portal schema check passes:

```bash
npm run smoke:client-portal
```

The script creates a unique demo client and verifies the complete authenticated path through the Next.js proxies:

- admin login, client creation and CRM service assignment
- all admin onboarding operations reject requests without an admin session
- explicit rejection of client credentials by the admin login boundary
- explicit rejection when a client session token is presented under the admin cookie name
- idempotent onboarding generation and one-use client invitation activation
- separate `client_user` and read-only `viewer` invitation activation
- portal locked before critical contract approval and open after approval
- viewer read access to onboarding, portal and scoped CRM data
- viewer write rejection for project feedback, links, CRM creation, status, notes and follow-ups
- project link, feedback, phase/staging update and admin-only configuration snapshot
- client CRM lead creation, status, notes and follow-up actions
- admin private/shared CRM notes and follow-up actions
- client visibility filtering for admin-only records and usernames
- final client/admin readback from the persisted database

Expected current result:

```text
Client portal E2E smoke passed: 55/55 checks passed.
```

The default request timeout is `30000` ms because a cold Next.js route plus a remote Neon query can exceed ten seconds. Override it only for local QA:

```bash
SMOKE_TIMEOUT_MS=45000 npm run smoke:client-portal
```

The script creates real demo records in the configured database. It never prints the generated client password, database credentials or API keys.

## Client Portal Schema Check

Run this before testing the Client Portal against a real PostgreSQL/Neon database:

```bash
npm run check:client-portal-schema
```

The check is read-only. It verifies that the database configured through `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD` contains the 19 tables required by the private Client Portal, onboarding workspace, service tracks, admin-only configuration snapshots and client CRM.

If those variables are not already exported, the script loads the local secrets file:

```text
/Volumes/T7/Altaira_Labs/.secrets/neon-render.env
```

Optional local-only override:

```bash
ALTAIRA_SECRETS_FILE=/path/to/private/env npm run check:client-portal-schema
```

This is not a Render or Vercel variable. It is only a local helper for choosing a private env file.

If required tables are missing, the script prints the missing table names and points to the prepared additive SQL, in execution order:

```text
backend/database/onboarding-core-migration.sql
backend/database/client-project-config-snapshots-migration.sql
```

The script does not apply migrations and does not print passwords or connection strings.

## Backend Checks

Run from `backend/`:

```bash
./mvnw test
./mvnw package -DskipTests
```

Expected current result:

- `./mvnw test`: passes using the `test` profile and H2 in-memory database.
- `./mvnw package -DskipTests`: passes and creates the Spring Boot jar.

The test profile lives at:

```text
backend/src/test/resources/application-test.properties
```

It avoids production-like secrets and uses:

```text
jdbc:h2:mem:altaira_test
```

## Current Backend Test Coverage

The current test class validates:

- Spring context loads.
- Public lead creation works without internal token and returns `201 Created`.
- Public lead creation trims name/business fields and lowercases email.
- Invalid public lead submissions return field-level validation errors.
- One-character name or business values are rejected by backend validation.
- Lead listing is rejected without internal token.
- Lead listing works with internal token.
- Lead detail retrieval works with internal token.
- Lead status updates work with internal token.
- Invalid lead status is rejected.
- Missing lead detail returns `404`.

## Manual Runtime Smoke Test

Confirm PostgreSQL is available before starting the backend:

```bash
PGPASSWORD=<local-postgres-password> psql -h localhost -U <local-postgres-user> -d <local-database-name> \
  -c "SELECT current_database(), current_user;"
```

Expected:

- Database: your local database name.
- User: your local PostgreSQL user.

Start backend:

```bash
cd backend
./mvnw spring-boot:run
```

This loads `/Volumes/T7/Altaira_Labs/.secrets/neon-render.env` through Spring Boot config import.

Check health:

```bash
curl -i http://localhost:8080/api/v1/health
```

Check backend protection:

```bash
curl -i http://localhost:8080/api/v1/leads
curl -i -H "X-Internal-API-Token: <same-token-as-frontend>" http://localhost:8080/api/v1/leads
```

Expected:

- No token: `401`.
- Valid token: `200`.

Start frontend:

```bash
npm run dev
```

Check Next internal API protection:

```bash
curl -i http://localhost:3000/api/internal/leads
```

Expected:

- Not logged in: `401`.

Check malformed public JSON handling through the frontend proxy:

```bash
curl -i -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"fullName":'
```

Expected:

- `400`.
- Error says `Invalid request body`.

Create lead through Next proxy:

```bash
curl -i -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test Lead","businessName":"Altaira QA","email":"qa@example.com","phone":"+32 470 00 00 00","industry":"Contact request","serviceInterest":"Booking Systems","goals":"Testing the public contact flow."}'
```

Expected:

- `201 Created`.
- Response status is `new`.
- Lead is persisted in PostgreSQL.
- Response includes `emailNotificationSent`; if it is `false`, the lead is still saved and the email provider needs configuration.

Login and list leads:

```bash
COOKIE_JAR=/tmp/altaira-cookies.txt
curl -i -c "$COOKIE_JAR" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<local-admin-username>","password":"<local-admin-password>"}'

curl -i -b "$COOKIE_JAR" http://localhost:3000/api/internal/leads
```

Expected:

- Login: `200`.
- Authenticated internal lead listing: `200`.

Capture one lead ID and verify detail/status:

```bash
LEAD_ID="<paste-created-id>"

curl -i -b "$COOKIE_JAR" "http://localhost:3000/api/internal/leads/$LEAD_ID"

curl -i -b "$COOKIE_JAR" -X PATCH "http://localhost:3000/api/internal/leads/$LEAD_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"contacted"}'
```

Expected:

- Detail request: `200`.
- Status update: `200`.
- Updated response status is `contacted`.

Verify invalid status behavior:

```bash
curl -i -b "$COOKIE_JAR" -X PATCH "http://localhost:3000/api/internal/leads/$LEAD_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"archived"}'
```

Expected:

- `400`.
- Error says `Invalid lead status`.

Verify malformed status JSON through the frontend proxy:

```bash
curl -i -b "$COOKIE_JAR" -X PATCH "http://localhost:3000/api/internal/leads/$LEAD_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":'
```

Expected:

- `400`.
- Error says `Invalid request body`.

## Demo Dataset Approach

Use one realistic lead created through the public flow, not direct database inserts. This keeps the demo evidence aligned with the actual MVP flow.

Recommended demo payload:

```json
{
  "fullName": "Marta Ruiz",
  "businessName": "Ruiz Dental Studio",
  "email": "marta.ruiz@example.com",
  "industry": "Healthcare",
  "goals": "Needs a clearer website contact flow and lead follow-up process."
}
```

After the demo, remove test/demo leads from local PostgreSQL if needed:

```bash
PGPASSWORD=<local-postgres-password> psql -h localhost -U altaira -d altaira \
  -c "DELETE FROM leads WHERE email LIKE '%example.com';"
```

## Known Testing Notes

The project is on an external drive that creates macOS AppleDouble metadata files named `._*`. The repo ignores them, and Maven Surefire is configured to avoid treating them as test classes.

If strange classpath errors mention `._*.class`, run:

```bash
find . -name '._*' -type f -delete
```

Then rerun the command.
