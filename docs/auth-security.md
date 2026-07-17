# Auth Security

This document explains the current admin/demo authentication model for Altaira Workspace.

## Decision

Altaira now uses a backend-owned authentication model:

```text
Next.js login form
-> Spring Boot role-specific login endpoint
-> app_users table
-> BCrypt password verification
-> app_user_sessions table
-> HTTP-only Next.js session cookie
-> protected admin pages and API proxies
```

This is the best practical option for the current TFG/MVP because it is simple, explainable, database-backed, and keeps admin authentication separate from the client portal identity flow.

References used for the decision:

- Spring Security password storage recommends adaptive one-way password hashing such as BCrypt.
- OWASP authentication guidance recommends safe password storage, login throttling, generic failure responses, and security event logging.
- Next.js authentication guidance recommends server-set cookies with `httpOnly`, `secure`, `sameSite`, `maxAge`, and `path`.

## Demo Login

The runtime has no default admin username or password. A controlled local/TFG
demo may explicitly enable the seeder with private credentials through
`ALTAIRA_DEMO_ADMIN_*`. Keep the seeder disabled in normal production.

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

The Next.js admin login boundary accepts only these three roles. A valid `client_user` or `viewer` credential is rejected with `403`, its just-created backend session is revoked, and no `altaira_admin_session` cookie is issued. Internal admin API proxies also revalidate the session role before forwarding any request with the server-to-server token.

Every `/api/internal/*` proxy checks that role-bound admin session before it attaches `INTERNAL_API_TOKEN`. This includes onboarding generation, approval/rejection and private file download routes; the server-to-server token is never used as a browser-facing substitute for admin authentication.

## How Passwords Are Stored

Passwords are not stored in plaintext.

The backend uses Spring Security's `BCryptPasswordEncoder` through the `PasswordEncoder` interface. The database stores only `password_hash`, for example a value beginning with `$2`.

The legacy SQL seed with a known credential has been removed. The
disabled-by-default startup seeder requires explicit environment credentials
and rejects missing, known-weak or shorter-than-16 character passwords.
Password hashes stored in the database use BCrypt rather than plaintext.

## Sessions

Successful login creates a random session token.

The browser receives it as:

```text
altaira_admin_session
```

Cookie settings:

- `httpOnly`
- `sameSite=strict`
- `secure=true` in production
- `path=/`
- finite `maxAge`

When an admin signs in again, previous active sessions for that same admin user are revoked before the new session is created.

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
- `client_invitation_created`
- `client_invitation_accepted`
- `logout`

The schema also reserves:

- `password_changed`
- `user_disabled`

## Login Flow

1. Admin opens `/admin/login`.
2. Next.js posts username/password to `/api/auth/login`.
3. Next.js calls Spring Boot `/api/v1/auth/admin/login`.
4. Spring Boot verifies the user from `app_users`.
5. Spring Boot checks the password with BCrypt and verifies an admin-capable role before touching sessions.
6. Spring Boot revokes previous active sessions for that admin user.
7. Spring Boot stores a hashed session token in `app_user_sessions`.
8. Next.js independently verifies the returned role and sets `altaira_admin_session` as an HTTP-only cookie.
9. Admin pages can be opened.
10. Next.js internal API routes validate both the session and admin role against `/api/v1/auth/me` before forwarding admin requests.

The legacy `/login` route redirects to `/admin/login` so old bookmarks still work without exposing a second login surface.

## Client Area And Google Login

The public Client Area entry point is:

```text
/client/login
```

`/client-area` remains available and renders the same prepared client access screen.

Google login is now enabled with invitation gating:

1. Admin creates or confirms a client record.
2. Admin sends an invitation email with a single-use token.
3. Client opens the invitation and activates the account.
4. Google login is allowed only if the Google account email already belongs to an active `client_user` or `viewer`.
5. The backend requires an active `client_user_access` relation before creating a session.
6. Open Google registration is not allowed.
7. A separate client session cookie is created. It does not reuse `altaira_admin_session`.
8. Until a workspace selector is implemented, one account may have only one active client workspace. Ambiguous access is rejected instead of selecting a tenant implicitly.

Client access roles:

- `client_user`: can read and update its own onboarding, project and CRM data.
- `viewer`: read-only access to the same client workspace; mutation endpoints return `403` and write controls are disabled in the UI.

Password login follows the same boundary through `/api/v1/auth/client/login`. A wrong-portal attempt is rejected before existing sessions are revoked, so trying client credentials on the admin form cannot terminate a valid Client Area session.

Current Google flow:

1. Browser loads Google Identity Services on `/client/login`.
2. Google returns an ID token credential to the frontend.
3. Next.js posts that credential to `/api/client/auth/google`.
4. Next.js forwards it to Spring Boot `/api/v1/auth/client/google`.
5. Spring Boot verifies the token with Google, checks the audience against `GOOGLE_CLIENT_ID`, requires `email_verified=true`, then checks the local invited/active client user.
6. Next.js sets the separate `altaira_client_session` HTTP-only cookie.

Required variables:

```text
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-web-client-id>  # Vercel / frontend
GOOGLE_CLIENT_ID=<same-google-oauth-web-client-id>         # Render / backend
```

Google Cloud OAuth setup:
- Application type: Web application
- Authorized JavaScript origins: `http://localhost:3000` and the Vercel production domain
- Redirect URI is not required for the current Google Identity Services ID-token button flow

Optional backend test/custom variable:

```text
GOOGLE_TOKEN_INFO_URL=https://oauth2.googleapis.com/tokeninfo
```

Do not enable open Google registration for the Client Area. That would allow uninvited users with a Google account to attempt access to private workspace routes.

## Protected Areas

Admin pages protected by middleware:

- `/leads`
- `/leads/[id]`
- `/clients`
- `/clients/[id]`
- `/admin/services`
- `/admin/onboarding/[clientId]`

Backend admin endpoints accept either:

- a valid `X-Internal-API-Token` for server-to-server calls, or
- a valid `X-Admin-Session-Token` for admin-session calls.

## SQL Files

Migration:

```text
backend/database/auth-security-migration.sql
```

Apply the migration to Neon if the auth tables do not already exist. Create or
reconcile the controlled admin only through the environment-driven startup
seeder.

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
ALTAIRA_DEMO_ADMIN_USERNAME=<private-local-admin-username>
ALTAIRA_DEMO_ADMIN_PASSWORD=<private-strong-local-admin-password>
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
ALTAIRA_DEMO_ADMIN_ENABLED=false
ALTAIRA_DEMO_ADMIN_USERNAME=<private-admin-username>
ALTAIRA_DEMO_ADMIN_PASSWORD=<private-strong-admin-password>
ALTAIRA_DEMO_ADMIN_ROLE=admin
```

The application defaults are `ALTAIRA_DEMO_ADMIN_ENABLED=false` and blank demo
credentials. For a controlled TFG deployment, enable the seeder explicitly with
private credentials. While enabled, it reconciles the configured password, role
and active state, so changing the password variable and restarting rotates the
stored BCrypt credential. Disabling the seeder prevents further changes but does
not delete an existing database user; disable that account explicitly before
serious production.

## Changing The Demo Password

Recommended options:

1. With the demo seeder explicitly enabled, change `ALTAIRA_DEMO_ADMIN_PASSWORD` in Render/local backend env and restart the backend. The stored BCrypt password is reconciled on startup.
2. For an existing user, create a new BCrypt hash and update `app_users.password_hash`.
3. Add a future admin password-change endpoint that records `password_changed`.

Do not update `password_hash` with plaintext.

## Future Work

Not implemented yet:

- MFA.
- Google-based invitation activation without setting a password first.
- Neon Auth.
- password reset flow.
- advanced RBAC permissions per route/action.
- account lockout with persistent failed-attempt counters.
- production admin user management UI.
- multi-workspace client account selector.
