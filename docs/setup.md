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

Local development values:

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080

ADMIN_EMAIL=admin@altaira.local
ADMIN_PASSWORD=altaira_admin_dev_password
INTERNAL_API_TOKEN=dev-internal-token
```

`.env.local` is ignored by Git. Do not commit real secrets.

## Backend Environment

The backend has local defaults in `backend/src/main/resources/application.properties`:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/altaira
SPRING_DATASOURCE_USERNAME=altaira
SPRING_DATASOURCE_PASSWORD=altaira_dev_password
INTERNAL_API_TOKEN=dev-internal-token
```

For deployed environments, override these with platform environment variables.

## Local PostgreSQL Setup

Option A: existing local PostgreSQL.

```bash
psql postgres
```

Create the local role and database if missing:

```sql
CREATE ROLE altaira LOGIN PASSWORD 'altaira_dev_password';
CREATE DATABASE altaira OWNER altaira;
```

Option B: Docker Compose, if Docker is installed.

```bash
docker compose up -d postgres
```

The compose file starts a PostgreSQL 16 container with the same local credentials.

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
INTERNAL_API_TOKEN=dev-internal-token ./mvnw spring-boot:run
```

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
http://localhost:3000/login
```

Local admin credentials:

```text
admin@altaira.local
altaira_admin_dev_password
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
