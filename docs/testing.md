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
INTERNAL_API_TOKEN=<same-token-as-frontend> ./mvnw spring-boot:run
```

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
  -d '{"fullName":"Test Lead","businessName":"Altaira QA","email":"qa@example.com"}'
```

Expected:

- `201 Created`.
- Response status is `new`.
- Lead is persisted in PostgreSQL.

Login and list leads:

```bash
COOKIE_JAR=/tmp/altaira-cookies.txt
curl -i -c "$COOKIE_JAR" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@altaira.local","password":"altaira_admin_dev_password"}'

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
