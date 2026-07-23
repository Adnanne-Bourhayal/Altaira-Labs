# API Reference

Base URLs:

```text
Frontend local: http://localhost:3000
Backend local:  http://localhost:8080
```

## Public Frontend API

### Create Lead Through Proxy

```http
POST /api/leads
Content-Type: application/json
```

Body:

```json
{
  "fullName": "Test Lead",
  "businessName": "Altaira QA",
  "email": "qa@example.com",
  "phone": "+32 470 00 00 00",
  "industry": "Testing",
  "serviceInterest": "Booking Systems",
  "goals": "Verify lead capture"
}
```

Success response: `201 Created`

```json
{
  "id": "uuid",
  "fullName": "Test Lead",
  "businessName": "Altaira QA",
  "email": "qa@example.com",
  "phone": "+32 470 00 00 00",
  "industry": "Testing",
  "serviceInterest": "Booking Systems",
  "goals": "Verify lead capture",
  "status": "new",
  "createdAt": "2026-07-02T12:31:20.338299Z",
  "emailNotificationSent": true,
  "emailNotificationMessage": "Email notification sent."
}
```

The lead is persisted before the email notification is attempted. In production, the recommended provider is Resend over
HTTPS. If the email provider is missing or rejects the message, the response can still be `201 Created` with
`emailNotificationSent: false`; the lead is still stored and should be visible in the admin dashboard.

If the Spring Boot lead service is unavailable, the proxy returns:

```json
{
  "error": "Lead service unavailable",
  "message": "The lead service could not be reached. Please try again in a moment."
}
```

Validation errors are passed through from the backend:

```json
{
  "error": "Validation failed",
  "message": "Failed to submit form",
  "fields": {
    "fullName": "Full name is required",
    "email": "Email must be valid"
  }
}
```

## Admin Email Diagnostics

Protected backend endpoint:

```text
GET /api/v1/diagnostics/email
```

Requires either:

- `X-Internal-API-Token`
- `X-Admin-Session-Token`

Purpose:

- confirm which email provider the backend is currently using
- confirm whether Resend API key is configured
- confirm SMTP fallback settings without exposing passwords or API keys

The response does not include `RESEND_API_KEY` or `SPRING_MAIL_PASSWORD`.

Malformed JSON returns `400`:

```json
{
  "error": "Invalid request body",
  "message": "Lead submission must be valid JSON."
}
```

## Admin Frontend API

These routes require the `altaira_admin_session` HTTP-only cookie.

### Lead Intake and Conversion

Admin UI routes:

```text
/leads
/leads/new
/leads/{leadId}
```

The Next.js internal routes proxy to protected Spring Boot endpoints and forward the
admin session:

```http
POST /api/internal/leads/admin-intake
GET  /api/internal/leads/{leadId}/assessments
PUT  /api/internal/leads/{leadId}/assessments/{formKey}
POST /api/internal/leads/{leadId}/convert
```

Backend endpoints:

```http
POST /api/v1/leads/admin-intake
GET  /api/v1/leads/{leadId}/assessments
PUT  /api/v1/leads/{leadId}/assessments/{formKey}
POST /api/v1/leads/{leadId}/convert
```

The legacy direct-conversion endpoint accepts at least one launch service and explicit confirmation:

```json
{
  "serviceKeys": ["booking", "crm"],
  "confirmed": true,
  "notes": "Approved after discovery"
}
```

Supported service keys are `web_seo`, `booking`, `crm`, `automation` and
`dashboard`. Direct conversion is disabled by default through
`ALTAIRA_LEGACY_DIRECT_CONVERSION_ENABLED=false`. The normal flow is the
payment-gated commercial process below; it creates or reuses the client, service
assignments, private workspace and one project track per selected service only
after payment confirmation.

The assessment table is introduced by
`backend/database/lead-intake-conversion-migration.sql`. No new environment
variables are required.

### Commercial Approval, Payment and Activation

These frontend proxy routes require the `altaira_admin_session` HTTP-only cookie:

```http
GET  /api/internal/provisioning-plans/{planId}/commercial-flow
POST /api/internal/provisioning-plans/{planId}/payments/checkout
POST /api/internal/provisioning-plans/{planId}/payments/mock-confirm
POST /api/internal/provisioning-plans/{planId}/commercial-flow/retry
```

Backend equivalents require `X-Internal-API-Token` or `X-Admin-Session-Token`:

```http
GET  /api/v1/provisioning-plans/{planId}/commercial-flow
POST /api/v1/provisioning-plans/{planId}/payments/checkout
POST /api/v1/provisioning-plans/{planId}/payments/mock-confirm
POST /api/v1/provisioning-plans/{planId}/commercial-flow/retry
```

Checkout body:

```json
{
  "amountMinor": 150000,
  "currency": "EUR",
  "description": "Approved Altaira Labs implementation scope"
}
```

Rules enforced by the backend:

- the provisioning plan must be `approved`; otherwise checkout returns `409`
- `amountMinor` must be between `100` and `100000000`
- currency is a three-letter code
- creating checkout does not create a client or workspace
- activation occurs only after a verified payment confirmation
- activation and provisioning are idempotent
- retries do not create another payment
- provider work remains `dryRun=true` or `blocked` until separately enabled

Stripe sends payment confirmation directly to the public backend endpoint:

```http
POST /api/v1/payments/stripe/webhook
Stripe-Signature: <stripe-signature>
Content-Type: application/json
```

The webhook does not use an admin session. Its trust boundary is the Stripe
signature verified with `STRIPE_WEBHOOK_SECRET`. An invalid signature returns
`400`. Replaying an already recorded Stripe event returns success without creating
another client, workspace or payment event.

`POST .../payments/mock-confirm` is available only when
`STRIPE_MOCK_CONFIRMATION_ENABLED=true`; keep it disabled in production. Stripe
live secret keys are rejected by the current test-mode configuration.

Required production configuration for a later authorized deployment:

```text
STRIPE_CHECKOUT_ENABLED=true
STRIPE_CHECKOUT_MODE=test
STRIPE_SECRET_KEY=<Stripe test secret key>
STRIPE_WEBHOOK_SECRET=<Stripe test webhook signing secret>
STRIPE_SUCCESS_URL=https://<frontend>/payment/success
STRIPE_CANCEL_URL=https://<frontend>/payment/cancel
STRIPE_MOCK_CONFIRMATION_ENABLED=false
COMMERCIAL_EMAIL_ENABLED=true
COMMERCIAL_NOTIFICATION_FROM=<verified Resend sender>
RESEND_API_KEY=<secret>
```

The supporting tables are introduced by
`backend/database/commercial-payment-provisioning-migration.sql`. Applying that
migration or enabling Stripe is a separate production operation and is not done by
the application at request time.

### Login

Admin UI route:

```text
/admin/login
```

Legacy `/login` redirects to `/admin/login`.

```http
POST /api/auth/login
Content-Type: application/json
```

Body:

```json
{
  "username": "<configured-admin-username>",
  "password": "<configured-admin-password>"
}
```

Success:

```json
{
  "success": true,
  "user": {
    "username": "<configured-admin-username>",
    "role": "admin"
  }
}
```

Malformed JSON or a non-object request body returns `400`.

The Next.js proxy forwards this request to the role-specific backend endpoint:

```http
POST /api/v1/auth/admin/login
```

Only `admin`, `consultant` and `auditor` can receive an admin session. Client roles return `403` and no admin cookie is created.

### Logout

```http
POST /api/auth/logout
```

Success:

```json
{ "success": true }
```

## Client Frontend API

These routes use the separate `altaira_client_session` HTTP-only cookie.

### Password Login

Client UI route:

```text
/client/login
```

```http
POST /api/client/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "client@example.com",
  "password": "client-password"
}
```

The backend accepts only `client_user` or `viewer` roles for this route.

The Next.js proxy forwards password credentials to:

```http
POST /api/v1/auth/client/login
```

The role check happens before the backend revokes or creates a session.

### Google Login

```http
POST /api/client/auth/google
Content-Type: application/json
```

Body:

```json
{
  "credential": "<google-id-token-from-google-identity-services>"
}
```

The Next.js route forwards the credential to Spring Boot:

```http
POST /api/v1/auth/client/google
```

The backend verifies the Google credential, checks the token audience against `GOOGLE_CLIENT_ID`,
requires a verified email, and then allows login only when that email already belongs to an active
invited client user with active client workspace access.

Google login requires:

```text
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-web-client-id>
GOOGLE_CLIENT_ID=<same-google-oauth-web-client-id>
```

### Client Portal Project Tracks

The Client Area reads active service modules and project tracks through:

```http
GET /api/client/portal
```

The Next.js route forwards to:

```http
GET /api/v1/client-portal/me
```

Project feedback:

```http
PATCH /api/client/portal/projects/{projectId}/feedback
Content-Type: application/json
```

```json
{
  "feedback": "Please add appointment buffers and separate first visits from follow-up appointments."
}
```

Project file upload:

```http
POST /api/client/portal/projects/{projectId}/assets
Content-Type: multipart/form-data
```

Fields:

```text
files=<one or more files>
assetType=booking_rules | crm_import | workflow_map | dashboard_metrics | website_copy | general
notes=<optional client notes>
```

Project external link:

```http
POST /api/client/portal/projects/{projectId}/links
Content-Type: application/json
```

```json
{
  "url": "https://example.com/clinic-opening-hours",
  "label": "Clinic opening hours",
  "assetType": "booking_rules",
  "notes": "Opening hours and appointment buffer rules for the booking track."
}
```

Links are stored as project material records with `externalUrl`; they are not downloadable files.

## Admin Client CRM API

The admin client detail page can inspect and lightly manage client-owned CRM leads without using a client session.

Admin UI routes:

```text
/clients/{clientId}
/clients/{clientId}/crm
```

The first route keeps a compact client summary. The second route is the dedicated admin CRM workspace with a wider lead list, detail panel, notes and timeline.

Frontend proxy:

```http
GET /api/internal/clients/{clientId}/crm-leads
```

Backend endpoint:

```http
GET /api/v1/client-crm/admin/clients/{clientId}/leads
```

Required auth:

```text
X-Internal-API-Token
or
X-Admin-Session-Token
```

The response is a list of client CRM leads with status, priority, source, sector fields, follow-up actions and notes.
Admin CRM responses include the full operational record, including admin-only follow-up actions, admin notes and admin timeline entries.
Each lead also includes an `events` array used as a compact operational timeline. Current event types are:

- `lead_created`
- `status_changed`
- `note_added`
- `follow_up_created`
- `follow_up_status_changed`

The dedicated admin CRM page labels notes, follow-up actions and timeline events as `Client-visible` or `Admin-only` so admin users know what the client can see in `/client/dashboard`.

Admin status update:

```http
PATCH /api/internal/clients/{clientId}/crm-leads/{leadId}/status
Content-Type: application/json
```

Backend equivalent:

```http
PATCH /api/v1/client-crm/admin/clients/{clientId}/leads/{leadId}/status
```

Body:

```json
{ "status": "proposal_sent" }
```

Admin note:

```http
POST /api/internal/clients/{clientId}/crm-leads/{leadId}/notes
Content-Type: application/json
```

Backend equivalent:

```http
POST /api/v1/client-crm/admin/clients/{clientId}/leads/{leadId}/notes
```

Body:

```json
{
  "content": "Admin reviewed the enquiry and prepared a proposal follow-up.",
  "visibleToClient": false
}
```

Both admin write operations are scoped by `clientId` and `leadId`, so a lead cannot be updated through the wrong client route.

`visibleToClient` is optional and defaults to `false` for admin notes. When set to `true`, the note is returned by client CRM endpoints with the admin username removed. The matching admin timeline event remains admin-only.

Admin follow-up action:

```http
POST /api/internal/clients/{clientId}/crm-leads/{leadId}/follow-up-actions
Content-Type: application/json
```

Backend equivalent:

```http
POST /api/v1/client-crm/admin/clients/{clientId}/leads/{leadId}/follow-up-actions
```

Body:

```json
{
  "title": "Internal pricing review",
  "description": "Check margin before sending the final quote.",
  "visibleToClient": false
}
```

Admin follow-up status update:

```http
PATCH /api/internal/clients/{clientId}/crm-leads/{leadId}/follow-up-actions/{actionId}/status
Content-Type: application/json
```

Backend equivalent:

```http
PATCH /api/v1/client-crm/admin/clients/{clientId}/leads/{leadId}/follow-up-actions/{actionId}/status
```

Body:

```json
{ "status": "done" }
```

Allowed follow-up action statuses:

- `open`
- `done`
- `cancelled`

Admin-created follow-up actions are private by default. When `visibleToClient` is `true`, the action appears in the client CRM lead response without exposing an admin username. The matching admin timeline event remains admin-only.

### Client Session

```http
GET /api/client/auth/me
Cookie: altaira_client_session=<http-only-session-cookie>
```

Returns the current client workspace context or `401` if the client session is missing/invalid.

### Client CRM Leads

These routes use the `altaira_client_session` HTTP-only cookie and proxy to Spring Boot client CRM endpoints.

Client CRM responses are scoped for the private client workspace. Client users can see their own CRM leads, their own follow-up actions, admin follow-up actions explicitly marked as client-visible, client/system notes, admin notes explicitly marked as client-visible and client/system timeline activity. Admin-only follow-up actions, admin-only notes and admin-only timeline events remain available through admin CRM endpoints, but are not returned by client routes.

List leads:

```http
GET /api/client/crm/leads
Cookie: altaira_client_session=<http-only-session-cookie>
```

Get one lead:

```http
GET /api/client/crm/leads/{leadId}
Cookie: altaira_client_session=<http-only-session-cookie>
```

Create lead:

```http
POST /api/client/crm/leads
Cookie: altaira_client_session=<http-only-session-cookie>
Content-Type: application/json
```

Body:

```json
{
  "fullName": "Private Event Lead",
  "email": "event-lead@example.com",
  "phone": "+32 470 22 33 44",
  "source": "web_form",
  "priority": "urgent",
  "sectorFields": {
    "event_type": "Birthday dinner",
    "guest_count": "18"
  },
  "initialNote": "Asked for a Saturday evening private table."
}
```

Update status:

```http
PATCH /api/client/crm/leads/{leadId}/status
Cookie: altaira_client_session=<http-only-session-cookie>
Content-Type: application/json
```

Body:

```json
{ "status": "appointment_scheduled" }
```

Add note:

```http
POST /api/client/crm/leads/{leadId}/notes
Cookie: altaira_client_session=<http-only-session-cookie>
Content-Type: application/json
```

Body:

```json
{ "content": "Confirmed interest and sent menu options." }
```

Add follow-up action:

```http
POST /api/client/crm/leads/{leadId}/follow-up-actions
Cookie: altaira_client_session=<http-only-session-cookie>
Content-Type: application/json
```

Body:

```json
{
  "title": "Call guest to confirm proposal preference",
  "description": "Ask whether they prefer terrace or private dining room."
}
```

Update follow-up action status:

```http
PATCH /api/client/crm/leads/{leadId}/follow-up-actions/{actionId}/status
Cookie: altaira_client_session=<http-only-session-cookie>
Content-Type: application/json
```

Body:

```json
{ "status": "done" }
```

The response is the updated client CRM lead. Client responses keep the latest lead status, include client-visible follow-up actions and explicitly shared admin notes, and intentionally hide admin-only follow-up actions, admin-only notes and admin-only timeline entries.

Allowed statuses:

- `new_lead`
- `contacted`
- `appointment_scheduled`
- `proposal_sent`
- `won`
- `lost`

Allowed priorities:

- `low`
- `normal`
- `high`
- `urgent`

Access is client-scoped. The backend returns `423 Locked` while the service contract is not approved and `403` if the client does not have an active CRM module.

Backend equivalents:

```http
GET /api/v1/client-crm/client/leads
POST /api/v1/client-crm/client/leads
PATCH /api/v1/client-crm/client/leads/{leadId}/status
POST /api/v1/client-crm/client/leads/{leadId}/notes
```

### Client CRM Webhook Intake

Admin-only token management:

```http
GET /api/internal/clients/{clientId}/crm-webhooks
POST /api/internal/clients/{clientId}/crm-webhooks
PATCH /api/internal/clients/{clientId}/crm-webhooks/{tokenId}/revoke
Cookie: altaira_admin_session=<http-only-session-cookie>
```

Backend equivalents:

```http
GET /api/v1/client-crm/admin/clients/{clientId}/webhook-tokens
POST /api/v1/client-crm/admin/clients/{clientId}/webhook-tokens
PATCH /api/v1/client-crm/admin/clients/{clientId}/webhook-tokens/{tokenId}/revoke
```

Token creation body:

```json
{ "label": "Website form" }
```

The full `apiKey` is returned only on creation. Later list responses expose only `tokenPrefix`, status and usage metadata.

Public lead intake endpoint:

```http
POST /api/v1/client-crm/webhooks/leads
X-Altaira-Webhook-Key: <one-time-copied-client-crm-api-key>
Content-Type: application/json
```

The request body uses the same shape as client CRM lead creation:

```json
{
  "fullName": "Dental Implant Lead",
  "email": "implant-lead@example.com",
  "phone": "+32 470 55 66 77",
  "source": "clinic_website",
  "priority": "urgent",
  "sectorFields": {
    "treatment_interest": "Dental implants",
    "preferred_day": "Thursday"
  },
  "initialNote": "Asked for a first consultation from the clinic website."
}
```

Security behavior:

- raw API keys are never stored, only SHA-256 hashes
- the token must be active
- revoked tokens return `401`
- the client must have a non-cancelled CRM service assignment
- public webhook intake does not require a client browser session
- if `priority=urgent`, the backend sends a Resend email alert to the client owner email stored in `clients.email`
- alert email failure never blocks lead persistence; the lead is still saved and the failure is logged without exposing `RESEND_API_KEY`
- webhook-created leads are stored in `client_crm_leads`, not in Altaira's public `leads` inbox

## Admin Data API

These routes require the `altaira_admin_session` HTTP-only cookie.

### List Leads

```http
GET /api/internal/leads
Cookie: altaira_admin_session=<http-only-session-cookie>
```

Returns leads ordered by newest first.

Unauthenticated response:

```json
{ "error": "Unauthorized" }
```

### Get Lead Detail

```http
GET /api/internal/leads/{id}
Cookie: altaira_admin_session=<http-only-session-cookie>
```

### Update Lead Status

```http
PATCH /api/internal/leads/{id}/status
Cookie: altaira_admin_session=<http-only-session-cookie>
Content-Type: application/json
```

Body:

```json
{ "status": "contacted" }
```

Allowed statuses:

- `new`
- `contacted`
- `closed`

### Create Client From Lead

```http
POST /api/internal/clients/from-lead/{leadId}
Cookie: altaira_admin_session=<http-only-session-cookie>
```

Creates a client from an existing lead. The operation is idempotent: if the lead already has a client, the existing client is returned.

### List/Create Clients

```http
GET /api/internal/clients
POST /api/internal/clients
Cookie: altaira_admin_session=<http-only-session-cookie>
```

Client creation body:

```json
{
  "name": "Marta Ruiz",
  "company": "Ruiz Dental Studio",
  "email": "marta@example.com",
  "phone": "+32 ..."
}
```

### Client Detail

```http
GET /api/internal/clients/{id}
Cookie: altaira_admin_session=<http-only-session-cookie>
```

### Services Catalogue

```http
GET /api/internal/services
POST /api/internal/services
Cookie: altaira_admin_session=<http-only-session-cookie>
```

### Assign Service To Client

```http
GET /api/internal/clients/{clientId}/services
POST /api/internal/clients/{clientId}/services
Cookie: altaira_admin_session=<http-only-session-cookie>
```

Assignment body:

```json
{
  "serviceId": "uuid",
  "notes": "Start with booking flow."
}
```

### Update Client Service Status

```http
PATCH /api/internal/client-services/{id}/status
Cookie: altaira_admin_session=<http-only-session-cookie>
Content-Type: application/json
```

Allowed statuses:

- `planned`
- `in_progress`
- `review`
- `delivered`
- `cancelled`

### Internal Notes

```http
GET /api/internal/leads/{id}/notes
POST /api/internal/leads/{id}/notes
GET /api/internal/clients/{id}/notes
POST /api/internal/clients/{id}/notes
Cookie: altaira_admin_session=<http-only-session-cookie>
```

Note body:

```json
{
  "content": "Follow up tomorrow."
}
```

## Backend API

### Health

```http
GET /api/v1/health
```

Response:

```json
{
  "status": "ok",
  "service": "altaira-os-backend",
  "timestamp": "2026-07-02T12:30:20.440256Z"
}
```

### Actuator Health

```http
GET /actuator/health
```

### Create Lead

Public endpoint:

```http
POST /api/v1/leads
Content-Type: application/json
```

Success response: `201 Created`.

This endpoint is rate limited by IP. Required fields are `fullName`, `businessName`, and `email`.
The backend trims name/business/email input, lowercases email, stores new leads with status `new`, tries to send an email notification to the configured contact inbox, and rejects invalid email or missing required values.

Validation rules:

- `fullName`: required, 2-100 characters.
- `businessName`: required, 2-120 characters.
- `email`: required, valid email format.
- `industry`: optional, max 50 characters.
- `goals`: optional, max 1000 characters.

### List Leads

Protected endpoint:

```http
GET /api/v1/leads
X-Internal-API-Token: <same-token-as-frontend>
```

Without a valid token, response is `401`.

Returns leads ordered by newest first.

### Get Lead by ID

Protected endpoint:

```http
GET /api/v1/leads/{id}
X-Internal-API-Token: <same-token-as-frontend>
```

### Update Lead Status

Protected endpoint:

```http
PATCH /api/v1/leads/{id}/status
X-Internal-API-Token: <same-token-as-frontend>
Content-Type: application/json
```

Body:

```json
{ "status": "closed" }
```

Allowed statuses are exactly:

- `new`
- `contacted`
- `closed`

Status input is trimmed and normalized to lowercase. Invalid or missing status returns `400`.
Malformed JSON through the frontend proxy also returns `400`.

## Error Shapes

Validation error:

```json
{
  "timestamp": "2026-07-02T12:00:00Z",
  "status": 400,
  "error": "Validation failed",
  "fields": {
    "email": "Email must be valid"
  }
}
```

Unauthorized:

```json
{
  "timestamp": "2026-07-02T12:00:00Z",
  "status": 401,
  "error": "Invalid internal API token"
}
```
