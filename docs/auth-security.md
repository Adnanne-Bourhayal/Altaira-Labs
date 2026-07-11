# Auth Security

This document explains the current admin/demo authentication model for Altaira Workspace.

## Decision

Altaira now uses a backend-owned authentication model:

```text
Next.js login form
-> Spring Boot /api/v1/auth/login
-> app_users table
-> BCrypt password verification
-> app_user_sessions table
-> HTTP-only Next.js session cookie
-> protected admin pages and API proxies
```

This is the best practical option for the current TFG/MVP because it is simple, explainable, database-backed, and does not require adding Google OAuth, Neon Auth, or a full identity provider before the core product flow is stable.

References used for the decision:

- Spring Security password storage recommends adaptive one-way password hashing such as BCrypt.
- OWASP authentication guidance recommends safe password storage, login throttling, generic failure responses, and security event logging.
- Next.js authentication guidance recommends server-set cookies with `httpOnly`, `secure`, `sameSite`, `maxAge`, and `path`.

## Demo Login

Demo/local/TFG credentials:

```text
username: admin123
password: admin123
role: admin
```

This user is intentionally a demo user. Do not reuse this password for serious production.

## Where The User Is Stored

Admin users are stored in:

```text
public.app_users
```

Important columns:

- `id`
- `username`
- `password_hash`
- `role`
- `active`
- `created_at`
- `updated_at`
- `last_login_at`

Allowed roles:

- `admin`
- `consultant`
- `auditor`

The current demo user is `admin`.

## How Passwords Are Stored

Passwords are not stored in plaintext.

The backend uses Spring Security's `BCryptPasswordEncoder` through the `PasswordEncoder` interface. The database stores only `password_hash`, for example a value beginning with `$2`.

The demo seed SQL stores a BCrypt hash for `admin123`, not the plaintext password.

## Sessions

Successful login creates a random session token.

The browser receives it as:

```text
altaira_admin_session
```

Cookie settings:

- `httpOnly`
- `sameSite=lax`
- `secure=true` in production
- `path=/`
- finite `maxAge`

The raw token is not stored in the database. The backend stores only a SHA-256 hash of the session token in:

```text
public.app_user_sessions
```

## Security Events

Security events are stored in:

```text
public.security_events
```

Events currently recorded:

- `login_success`
- `login_failed`
- `user_created`
- `logout`

The schema also reserves:

- `password_changed`
- `user_disabled`

## Login Flow

1. Admin opens `/login`.
2. Next.js posts username/password to `/api/auth/login`.
3. Next.js calls Spring Boot `/api/v1/auth/login`.
4. Spring Boot verifies the user from `app_users`.
5. Spring Boot checks the password with BCrypt.
6. Spring Boot stores a hashed session token in `app_user_sessions`.
7. Next.js sets `altaira_admin_session` as an HTTP-only cookie.
8. Admin pages can be opened.
9. Next.js internal API routes validate the session against `/api/v1/auth/me` before forwarding admin requests.

## Protected Areas

Admin pages protected by middleware:

- `/leads`
- `/leads/[id]`
- `/clients`
- `/clients/[id]`
- `/services`

Backend admin endpoints accept either:

- a valid `X-Internal-API-Token` for server-to-server calls, or
- a valid `X-Admin-Session-Token` for admin-session calls.

## SQL Files

Migration:

```text
backend/database/auth-security-migration.sql
```

Demo admin seed:

```text
backend/database/auth-demo-admin-seed.sql
```

Apply both to Neon if the auth tables do not already exist.

## Local Variables

Frontend `.env.local`:

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080
INTERNAL_API_TOKEN=<same-token-as-backend>
```

Backend local shell or backend env file:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<database-user>
SPRING_DATASOURCE_PASSWORD=<database-password>
INTERNAL_API_TOKEN=<same-token-as-frontend>
ALTAIRA_AUTH_SESSION_HOURS=8
ALTAIRA_DEMO_ADMIN_ENABLED=true
ALTAIRA_DEMO_ADMIN_USERNAME=admin123
ALTAIRA_DEMO_ADMIN_PASSWORD=admin123
ALTAIRA_DEMO_ADMIN_ROLE=admin
```

## Vercel Variables

Set:

```text
NEXT_PUBLIC_APP_URL=<frontend-url>
NEXT_PUBLIC_API_URL=<render-backend-url>
INTERNAL_API_TOKEN=<same-token-as-render>
```

Do not set admin passwords in Vercel for this auth model. Vercel no longer validates the password directly.

## Render Variables

Set:

```text
SPRING_DATASOURCE_URL=<neon-jdbc-url-without-password>
SPRING_DATASOURCE_USERNAME=<neon-user>
SPRING_DATASOURCE_PASSWORD=<neon-password>
INTERNAL_API_TOKEN=<same-token-as-vercel>
ALTAIRA_AUTH_SESSION_HOURS=8
ALTAIRA_DEMO_ADMIN_ENABLED=true
ALTAIRA_DEMO_ADMIN_USERNAME=admin123
ALTAIRA_DEMO_ADMIN_PASSWORD=admin123
ALTAIRA_DEMO_ADMIN_ROLE=admin
```

For serious production, create a real admin, change `ALTAIRA_DEMO_ADMIN_PASSWORD`, then disable or remove the demo user.

## Changing The Demo Password

Recommended options:

1. Change `ALTAIRA_DEMO_ADMIN_PASSWORD` in Render/local backend env and restart the backend before the demo user exists.
2. For an existing user, create a new BCrypt hash and update `app_users.password_hash`.
3. Add a future admin password-change endpoint that records `password_changed`.

Do not update `password_hash` with plaintext.

## Future Work

Not implemented yet:

- MFA.
- Google OAuth.
- Neon Auth.
- password reset flow.
- advanced RBAC permissions per route/action.
- account lockout with persistent failed-attempt counters.
- production admin user management UI.
