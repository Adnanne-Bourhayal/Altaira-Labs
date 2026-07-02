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
- Public lead creation works without internal token.
- Lead listing is rejected without internal token.
- Lead listing works with internal token.
- Invalid lead status is rejected.

## Manual Runtime Smoke Test

Start backend:

```bash
cd backend
INTERNAL_API_TOKEN=dev-internal-token ./mvnw spring-boot:run
```

Check health:

```bash
curl -i http://localhost:8080/api/v1/health
```

Check backend protection:

```bash
curl -i http://localhost:8080/api/v1/leads
curl -i -H "X-Internal-API-Token: dev-internal-token" http://localhost:8080/api/v1/leads
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

Create lead through Next proxy:

```bash
curl -i -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test Lead","businessName":"Altaira QA","email":"qa@example.com"}'
```

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

## Known Testing Notes

The project is on an external drive that creates macOS AppleDouble metadata files named `._*`. The repo ignores them, and Maven Surefire is configured to avoid treating them as test classes.

If strange classpath errors mention `._*.class`, run:

```bash
find . -name '._*' -type f -delete
```

Then rerun the command.
