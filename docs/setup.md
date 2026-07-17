# Altaira Workspace Setup

This project is currently stabilized as a lead capture and lead management MVP base. Do not add client or service management features until the lead workflow is reliable and accepted for the next sprint.

## Official Workspace

Use this folder as the official local source of truth:

```text
/Volumes/T7/Altaira_Labs/Altaira_Labs_web
```

It is a Git checkout of:

```text
https://github.com/Adnanne-Bourhayal/Altaira-Labs.git
```

Current stabilization branch:

```bash
git status --short --branch
```

## Required Tools

- Node.js LTS recommended: Node 22.
- npm.
- Java 21.
- Maven wrapper included at `backend/mvnw`.
- PostgreSQL 15+ locally, or Docker with Docker Compose.
- Git.

The stabilization was validated on:

- Node `v25.9.0`
- npm `11.12.1`
- Java `21.0.10`
- PostgreSQL `15.15`

Use Node 22 LTS for regular TFG work even though validation passed on Node 25.

## Frontend Environment

Create `.env.local` from `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Local development shape:

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-web-client-id>
INTERNAL_API_TOKEN=<same-token-as-backend>
```

`.env.local` is ignored by Git. Do not commit real secrets.

For the full environment variable map, including where each password/token comes from and where it must be configured, see:

```text
docs/environment.md
```

## Backend Environment

Current recommended local backend database: Neon PostgreSQL.

`backend/src/main/resources/application.properties` imports the local secrets file automatically:

```text
/Volumes/T7/Altaira_Labs/.secrets/neon-render.env
```

Required variables:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<neon-database-user>
SPRING_DATASOURCE_PASSWORD=<neon-database-password>
INTERNAL_API_TOKEN=<same-token-as-frontend-server>
ALTAIRA_DEMO_ADMIN_ENABLED=true
ALTAIRA_DEMO_ADMIN_USERNAME=<private-local-admin-username>
ALTAIRA_DEMO_ADMIN_PASSWORD=<private-strong-local-admin-password>
ALTAIRA_DEMO_ADMIN_ROLE=admin
GOOGLE_CLIENT_ID=<same-google-oauth-web-client-id-as-frontend>
```

The previous fallback values `SPRING_DATASOURCE_USERNAME=altaira` and `jdbc:postgresql://localhost:5432/altaira` are no longer the default because they fail unless a matching local PostgreSQL role and database exist.

For deployed environments, configure the same backend variables in Render. Configure frontend variables such as `NEXT_PUBLIC_API_URL` and `INTERNAL_API_TOKEN` in Vercel.

## Optional Local PostgreSQL Setup

Use this only if you intentionally want a local database instead of Neon.

Option A: existing local PostgreSQL:

```bash
psql postgres
```

Create the local role and database if missing:

```sql
CREATE ROLE altaira LOGIN PASSWORD '<local-postgres-password>';
CREATE DATABASE altaira OWNER altaira;
```

Option B: Docker Compose, if Docker is installed:

```bash
docker compose up -d postgres
```

Validate local database connectivity:

```bash
PGPASSWORD=<local-postgres-password> psql -h localhost -U altaira -d altaira \
  -c "SELECT current_database(), current_user;"
```

Expected:

```text
altaira | altaira
```

## Install Dependencies

From the repo root:

```bash
npm install
```

Backend dependencies are resolved by Maven:

```bash
cd backend
./mvnw test
```

## Start the App Locally

Terminal 1, backend:

```bash
cd backend
./mvnw spring-boot:run
```

This uses `/Volumes/T7/Altaira_Labs/.secrets/neon-render.env` automatically.

Backend health:

```bash
curl http://localhost:8080/api/v1/health
```

Terminal 2, frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Admin login:

```text
http://localhost:3000/admin/login
```

Local admin credentials:

```text
username: <ALTAIRA_DEMO_ADMIN_USERNAME>
password: <ALTAIRA_DEMO_ADMIN_PASSWORD>
```

## Daily Workflow

```bash
git status
npm run lint
npm run build
npx tsc --noEmit
cd backend && ./mvnw test
```

Run only the checks relevant to the change while developing, but run the full set before marking a Jira task done.

## Jira Execution

Use the native Jira Software Scrum project as the main execution board:

```text
Project key: AWS
Project name: Altaira Workspace Scrum
Board: AWS board
```

Do not use the older business project `AL` as the main project for new execution work.

## MVP Boundary

Current MVP scope:

- Public lead capture.
- Lead persistence.
- Admin login.
- Admin lead listing.
- Lead detail.
- Lead status update.

Out of scope for now:

- Client management.
- Service management.
- Payments.
- External CRM integrations.
- Advanced automation.
- Multi-user roles.
