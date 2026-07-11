# MVP Lead Flow

This document defines the original Sprint 1 MVP lead flow. The initial scope was intentionally limited to lead capture and lead management.

The controlled Lead + Client + Service expansion is documented separately in:

```text
docs/core-client-service-flow.md
```

## MVP Boundary

Included:

- Public lead capture from the website contact form.
- Next.js API proxy for public lead submission.
- Spring Boot validation and persistence.
- PostgreSQL storage.
- Admin login.
- Admin lead list.
- Admin lead detail.
- Admin status update.

Excluded for now:

- Client management in the original Sprint 1 boundary.
- Service management in the original Sprint 1 boundary.
- CRM integrations.
- Email automation.
- Multi-user roles.
- Advanced analytics.

## Public Lead Submission Flow

1. A visitor fills in name, business name, and email in the website contact form.
2. The browser performs basic client-side validation.
3. The form submits to the Next.js route `POST /api/leads`.
4. Next forwards the request to Spring Boot at `POST /api/v1/leads`.
5. Spring Boot validates the DTO.
6. The lead is trimmed, normalized, assigned status `new`, and saved to PostgreSQL.
7. The response returns to Next and then to the browser.
8. The visitor sees success feedback or a clear error message.

Validation behavior:

- `fullName` is required and must be between 2 and 100 characters.
- `businessName` is required and must be between 2 and 120 characters.
- `email` is required and must be valid.
- `industry` is optional and must be at most 50 characters.
- `goals` is optional and must be at most 1000 characters.
- Email is normalized to lowercase before persistence.
- The public form trims name, business name, and email before submitting.
- Malformed JSON requests return `400` instead of being reported as service outages.

Unavailable backend behavior:

- If Spring Boot cannot be reached, Next returns `503`.
- The public form shows a retry-friendly service unavailable message.

## Admin Lead Management Flow

1. Admin signs in at `/login`.
2. Successful login creates the `altaira_admin_session` HTTP-only cookie.
3. Middleware allows access to `/leads`.
4. The lead dashboard calls `GET /api/internal/leads`.
5. Next validates the admin session against Spring Boot `/api/v1/auth/me`.
6. Next calls Spring Boot with session/internal admin headers.
7. Spring Boot returns leads ordered by newest first.
8. Admin opens a lead detail page at `/leads/{id}`.
9. Admin updates status through `PATCH /api/internal/leads/{id}/status`.
10. Spring Boot validates the status and persists the update.

## Status Model

Allowed statuses:

- `new`
- `contacted`
- `closed`

Status update behavior:

- Status input is trimmed.
- Status input is normalized to lowercase.
- Any status outside the allowed list returns `400`.
- Missing status returns `400`.

## Demo Dataset

Use one realistic lead created through the public form or through the public proxy. Do not seed directly into the database for the main demo path.

Suggested demo lead:

```json
{
  "fullName": "Marta Ruiz",
  "businessName": "Ruiz Dental Studio",
  "email": "marta.ruiz@example.com",
  "industry": "Healthcare",
  "goals": "Needs a clearer website contact flow and lead follow-up process."
}
```

Demo sequence:

1. Open the public homepage.
2. Submit the lead form.
3. Log in as admin.
4. Open the leads dashboard.
5. Confirm the new lead appears.
6. Open the lead detail page.
7. Change status from `new` to `contacted`.
8. Change status to `closed` if showing the full lifecycle.

## Manual Verification Checklist

- Public form rejects missing name, missing business, and invalid email.
- Public form rejects one-character name or business values.
- Public form shows success after a valid lead submission.
- Public form shows a clear message if the backend is unavailable.
- `POST /api/leads` returns `201` for a valid lead.
- `GET /api/internal/leads` returns `401` without admin cookie.
- Admin login returns `200` with valid credentials.
- Admin lead list returns persisted leads.
- Lead detail returns the selected lead.
- Status update accepts only `new`, `contacted`, or `closed`.
- Invalid status returns `400`.

## Known Limitations

- Admin authentication is simple and intended for MVP demonstration, not enterprise identity management.
- Database migrations are not yet implemented.
- No email notification is sent when a lead is created.
- Client and service management are covered by the controlled academic core expansion, not by the original lead-only Sprint 1 boundary.
- Rate limiting is in-memory, so it resets when the backend restarts.

## Future Work Boundary

Future work can add client/service modules, roles, production authentication, email notifications, migration tooling, and deployment hardening. Those items should not be added inside Sprint 1 unless required to keep the lead MVP stable.
