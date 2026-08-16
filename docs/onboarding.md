# Dynamic Client Onboarding

This module prepares the private Altaira Labs client onboarding flow.

## Purpose

The onboarding area collects the minimum information needed before project work starts:
- legal service agreement signature
- business profile and sector context
- brand/media asset references
- service-specific preferences

The flow is task-based. It is not one large form.

For a practical demo sequence across admin, client portal and CRM, see `docs/client-portal-admin-crm-demo.md`.

## Supported Sectors

The current sector model is:
- `clinics`
- `restaurants`
- `car_dealers`
- `custom`

The sector is stored on the client record as `sector_type`.

## Supported Task Types

`signature`
: Written signature task. The client provides full legal name, document ID and explicit consent. The backend stores IP, user agent and server timestamp, then generates/stamps a PDF evidence document.

`file_upload`
: Real file upload task. The client uploads logos, photos, brand files or legal/content assets through `multipart/form-data`. The backend stores the binary file in the configured onboarding storage directory and records safe metadata in `onboarding_files` plus the task `file_metadata_json`.

`preferences_form`
: Structured data task for notes, references, colors, rules and sector-specific context.

## Service-Specific Onboarding Templates

The backend creates or reuses onboarding tasks from the client's assigned `client_services`.
Each service has its own contract/signature task plus practical implementation inputs:

| Service track | Critical contract task | Operational tasks |
| --- | --- | --- |
| `web_seo` | Web and SEO service agreement | Logo/brand upload, page/content checklist, competitor references, SEO keywords, domain/hosting access context, legal/trust content |
| `booking` | Booking System agreement and SLA | Opening hours, slot duration, capacity, resources/spaces, cancellation policies, delay rules, optional calendar/payment integrations |
| `crm` | CRM data custody and processing agreement | Client service catalogue, lead pipeline fields, sector-specific lead fields, web-form/source integrations, existing contact CSV/Excel import |
| `automation` | Automated messaging and GDPR agreement | Messaging channels, sender access context, brand tone, language rules, automation goals and recipe selection |
| `dashboard` | Dashboard confidentiality and software-use agreement | Staff roles, permission expectations, operational protocols, historical CSV/Excel migration, KPIs and data sources |

These templates are intentionally richer than generic file upload fields, but still small enough for the academic MVP.
They prepare the "Moodle-like" client portal model: every contracted service has its own onboarding checklist, project track, files, links and feedback.

The client-facing onboarding UI renders structured fields for known task keys instead of showing one generic notes box.
Examples:

- Booking rules tasks ask for opening days, slot duration, capacity and minimum notice.
- Booking policy tasks ask for cancellation, delay and deposit rules.
- Web/SEO tasks separate content references from domain, hosting and technical access context.
- CRM tasks separate the service catalogue, pipeline fields and web-form/source integrations.
- Automation tasks ask for channels, sender context, brand tone and priority recipes without collecting passwords.
- Dashboard tasks ask for roles, permissions, protocols, historical data and KPI definitions.

The onboarding forms intentionally do not request production passwords, API secrets or payment keys. Secure credential
handoff remains a later infrastructure step.

The client onboarding screen also groups tasks into service tracks before the main dashboard unlocks. For each active
track, the client can see:

- how many tasks belong to that service
- how many have been submitted, approved or rejected
- whether a critical gate is still active
- what the service onboarding unlocks after review

This keeps the onboarding flow closer to a Moodle-style project workspace instead of a flat task list.
- CRM tasks ask for service catalogue, pipeline stages, required fields and sector-specific lead fields.
- Automation tasks ask for channels, tone of voice and selected recipes.
- Dashboard tasks ask for staff roles, permissions, protocols, data sources and KPIs.

Submitted preference tasks are saved as JSON with `taskKey`, `serviceKey`, `sectorType` and the field responses.

## Client Flow

1. Admin creates or reuses a client record.
2. Admin sends a client invitation from the client detail page.
3. The backend creates a one-use invitation token, stores only its SHA-256 hash and sends the activation email through Resend when configured.
4. Client opens `/client/activate?token=...`.
5. Client creates a password.
6. Backend accepts the invitation, creates or updates a `client_user`, links it to the client through `client_user_access` and returns a client session.
7. The frontend stores the client session in an HTTP-only cookie.
8. After activation or login, the client is sent to `/client/dashboard`.
9. `/client/dashboard` calls `GET /api/v1/client-portal/me`.
10. If any required critical signature task is not approved, the backend returns `423 Locked` and the frontend redirects the client to `/onboarding`.
11. `/onboarding` loads `GET /api/v1/onboarding/client/me`.
12. The backend checks the authenticated client user and its `client_user_access`.
13. The backend creates or reuses onboarding tasks for the client sector and assigned services.
14. The client submits tasks.
15. Submitted tasks wait for admin approval.

The general client workspace stays blocked until all required critical signature tasks are approved.
This includes the general agreement and the service-specific contracts for active modules such as Web/SEO, CRM, Booking, Automation or Dashboard.

`client_user` access can submit onboarding, project feedback/materials and client
CRM changes. `viewer` access is read-only in both the API and UI. The current MVP
supports one active workspace per client account; a second active tenant link is
rejected until an explicit workspace selector is implemented.

## Client Invitations

Admin invitation endpoints:

```text
GET /api/v1/clients/{clientId}/invitations
POST /api/v1/clients/{clientId}/invitations
```

Public activation endpoint:

```text
POST /api/v1/client-invitations/accept
```

Frontend routes:

```text
/client/activate
/client/login
/client/dashboard
```

Google login:
- `/client/login` can render the Google Identity Services button when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is configured
- the backend endpoint is `POST /api/v1/auth/client/google`
- Google login only works for active invited client users with active `client_user_access`
- Google login does not create open public accounts

Important variables:

```text
ALTAIRA_CLIENT_INVITATION_ACTIVATE_URL=https://altairalabs.vercel.app/client/activate
ALTAIRA_CLIENT_INVITATION_EXPIRES_DAYS=7
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-web-client-id>
GOOGLE_CLIENT_ID=<same-google-oauth-web-client-id>
```

Invitation behavior:
- previous pending invitations for the same client/email are revoked before a new one is created
- raw tokens are never stored, only token hashes
- accepted, revoked or expired invitations cannot be reused
- activation creates a client session immediately after password setup
- the activation email uses the onboarding Resend configuration
- if email is not configured, the backend still creates the invitation and returns the activation URL to the admin for manual fallback

## Admin Flow

Admin users access:

```text
/admin/onboarding/{clientId}
```

The admin can:
- generate or reuse onboarding tasks
- inspect submitted task data as readable fields
- inspect signature evidence fields
- copy a service-specific implementation prompt from submitted onboarding evidence
- approve submitted tasks
- reject tasks with feedback

Rejected tasks return to the client as editable/re-submittable tasks with visible admin feedback.

The implementation prompt is generated in the admin UI from the current client, service track, submitted structured fields
and file metadata. It is a handoff aid for the admin/developer. It does not call an external AI provider, does not store
new data and does not require new environment variables.

For Web/SEO, Booking, CRM, Automation and Dashboard tracks, the admin UI also generates a derived technical
configuration JSON from submitted onboarding fields. The admin can:
- copy the JSON as a handoff artifact
- save a versioned internal configuration snapshot on the selected project track
- reopen previous snapshots from the same project track

Configuration snapshots are admin-only planning evidence. They do not create reservations, mutate CRM schemas, execute
integrations or expose anything in the client dashboard. They are useful before moving a service track from onboarding
review into technical implementation.

## Backend Endpoints

Client:

```text
GET /api/v1/onboarding/client/me
PATCH /api/v1/onboarding/client/tasks/{taskId}/submit
POST /api/v1/onboarding/client/tasks/{taskId}/files
GET /api/v1/client-portal/me
PATCH /api/v1/client-portal/client/projects/{projectId}/feedback
GET /api/v1/client-portal/client/projects/{projectId}/assets
POST /api/v1/client-portal/client/projects/{projectId}/assets
POST /api/v1/client-portal/client/projects/{projectId}/links
GET /api/v1/client-crm/client/leads
POST /api/v1/client-crm/client/leads
PATCH /api/v1/client-crm/client/leads/{leadId}/status
POST /api/v1/client-crm/client/leads/{leadId}/notes
POST /api/v1/client-crm/client/leads/{leadId}/follow-up-actions
PATCH /api/v1/client-crm/client/leads/{leadId}/follow-up-actions/{actionId}/status
```

Admin:

```text
GET /api/v1/clients/{clientId}/invitations
POST /api/v1/clients/{clientId}/invitations
GET /api/v1/onboarding/admin/clients/{clientId}
POST /api/v1/onboarding/admin/clients/{clientId}/generate
PATCH /api/v1/onboarding/admin/tasks/{taskId}/approve
PATCH /api/v1/onboarding/admin/tasks/{taskId}/reject
GET /api/v1/onboarding/admin/tasks/{taskId}/files
GET /api/v1/onboarding/admin/files/{fileId}/download
GET /api/v1/client-portal/admin/clients/{clientId}
PATCH /api/v1/client-portal/admin/projects/{projectId}
GET /api/v1/client-portal/admin/projects/{projectId}/assets
GET /api/v1/client-portal/admin/projects/{projectId}/config-snapshots
POST /api/v1/client-portal/admin/projects/{projectId}/config-snapshots
GET /api/v1/client-portal/admin/project-assets/{assetId}/download
PATCH /api/v1/client-portal/admin/project-assets/{assetId}/approve
PATCH /api/v1/client-portal/admin/project-assets/{assetId}/reject
GET /api/v1/client-crm/admin/clients/{clientId}/leads
POST /api/v1/client-crm/admin/clients/{clientId}/leads/{leadId}/follow-up-actions
PATCH /api/v1/client-crm/admin/clients/{clientId}/leads/{leadId}/follow-up-actions/{actionId}/status
```

## File Storage

Uploaded onboarding files support two storage paths:

- durable production path: direct browser upload to private S3 with a short-lived presigned URL, followed by backend verification and metadata persistence;
- compatibility path: authenticated multipart upload to the backend filesystem while S3 is disabled.

Important variables:

```text
ALTAIRA_ONBOARDING_STORAGE_DIR=/absolute/path/to/private/onboarding-files
ALTAIRA_ONBOARDING_MAX_FILE_SIZE_BYTES=15728640
ONBOARDING_MULTIPART_MAX_FILE_SIZE=20MB
ONBOARDING_MULTIPART_MAX_REQUEST_SIZE=50MB
```

Notes:
- Do not store this directory inside `public/`.
- Do not commit uploaded client materials.
- The admin UI downloads files through an authenticated internal route.
- Existing filesystem records remain downloadable after S3 is enabled.
- Private objects are downloaded only through authenticated backend routes; bucket URLs are never exposed as public resources.

AWS S3 flow:
- use presigned URLs so the frontend can upload directly to S3
- keep private legal material under `legal/`
- keep brand assets under `branding/`
- keep business multimedia under `multimedia/`
- store only metadata and object keys in the database
- verify client, service track, task/project, size, type and signed S3 metadata before accepting completion

Client endpoints:

```text
POST /api/v1/onboarding/client/tasks/{taskId}/upload-url
POST /api/v1/onboarding/client/tasks/{taskId}/files/complete
POST /api/v1/client-portal/client/projects/{projectId}/assets/upload-url
POST /api/v1/client-portal/client/projects/{projectId}/assets/complete
```

The prepare endpoints are client-session protected and expect:

```json
{
  "filename": "logo.png",
  "contentType": "image/png",
  "sizeBytes": 248120,
  "assetType": "branding"
}
```

The backend chooses `branding`, `legal` or `multimedia` from the authenticated task/project context. When S3 is disabled, prepare returns `501` and the frontend uses the existing multipart route. A direct upload is not visible in the workspace until the completion endpoint verifies it in S3 and records it in the database.

Required backend variables for durable S3 storage:

```text
AWS_S3_ENABLED=true
AWS_ACCESS_KEY_ID=<secret>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=eu-west-1
AWS_S3_PRIVATE_BUCKET=<private-client-files-bucket>
AWS_S3_PUBLIC_BUCKET=<optional-public-branding-bucket>
AWS_S3_PUBLIC_BASE_URL=<optional-cdn-or-public-bucket-url>
AWS_S3_PRESIGN_TTL_SECONDS=900
```

These belong in the backend environment, for example Render, and require a backend redeploy.
They are not Vercel variables unless the frontend later signs uploads directly, which is not the recommended approach.

## Email Notifications

The backend contains Resend-based onboarding notification hooks for:
- client workspace invitation
- contract submitted
- onboarding ready for review / completed
- urgent client CRM webhook lead alerts

Required non-secret variables:

```text
ONBOARDING_EMAIL_ENABLED=true
ONBOARDING_NOTIFICATION_FROM=onboarding@resend.dev
ONBOARDING_NOTIFICATION_ADMIN_TO=altairalabs@gmail.com
RESEND_API_URL=https://api.resend.com/emails
CLIENT_CRM_ALERTS_ENABLED=true
CLIENT_CRM_ALERTS_FROM=onboarding@resend.dev
CLIENT_CRM_DASHBOARD_URL=https://<frontend-domain>/client/dashboard
```

Required secret variable:

```text
RESEND_API_KEY=<secret>
```

Do not commit real API keys.

CRM webhook alerts are client-facing. When a public/external form posts a client CRM lead with `priority=urgent`, the backend sends a Resend email to the client owner address stored in `clients.email`. If Resend is unavailable or not configured, the lead remains stored and the alert failure is logged.

## Client Portal

The private client dashboard is available at:

```text
/client/dashboard
```

It renders a single SaaS-style client workspace:
- sidebar modules are read from the backend portal response
- active modules are shown as available
- non-contracted modules are shown locked for future upsell
- every active contracted module creates/reuses a project track, so Web, Booking, CRM, Automation and Dashboard work can progress independently
- project progress labels are adapted to the selected track:
  - Web/SEO: content handoff, visual structure, build, SEO/review, launch
  - Booking: rules complete, widget layout, booking logic, test bookings, web integration
  - CRM: fields defined, data model, migration, form integration, workspace delivery
  - Automation: goals complete, API connection, trigger build, sending tests, production active
  - Dashboard: roles defined, view architecture, permissions, data testing, panel delivery
- the CRM module includes Kanban/List views, lead search, status/priority/source filters and operational lead counters
- every project track keeps the same underlying phase keys: `requirements`, `design`, `development`, `review` and `launch`
- clients can upload project materials to the selected track, including brand files, photos, website copy, booking rules, CRM imports, workflow maps, dashboard KPI sheets, legal content, SEO references and general assets
- clients can also save external project links, such as shared folders, booking calendars, CRM exports, workflow boards or KPI definition sheets
- project materials show review states: `uploaded`, `approved` and `rejected`
- rejected project materials show admin feedback to the client
- clients can submit revision feedback for any selected project track from the dashboard
- submitted client feedback moves the project to `review` and stores `revision_pending_at`
- clients with an active CRM / Lead Management module can manage their own leads from the same dashboard
- the CRM module includes Kanban and List views over the same lead collection
- CRM leads support the status pipeline `new_lead`, `contacted`, `appointment_scheduled`, `proposal_sent`, `won` and `lost`
- CRM leads support priority labels, source, contact details, internal notes and sector-specific fields
- client CRM responses hide admin-only notes and admin-only timeline events; admin CRM responses keep the full operational record
- sector-specific fields are prepared for clinics, restaurants, car dealers and custom businesses

The backend endpoint is:

```text
GET /api/v1/client-portal/me
```

It enforces the legal contract gate. If the contract has not been approved by admin, the endpoint returns:

```text
423 Locked
```

The frontend then sends the client back to `/onboarding`.

The lock is computed from current onboarding tasks, not only from a stored workspace timestamp.
This means a client with several contracted services must complete and receive admin approval for every required critical signature before the private service dashboard opens.

Admin project control is exposed in:

```text
/admin/onboarding/{clientId}
```

The admin can update:
- project name
- current phase for the selected service track
- project/staging URL for the selected service track
- review uploaded project materials and links for the selected service track
- download submitted project file assets
- open submitted project links
- approve project assets
- reject project assets with feedback

The client dashboard reads these updates through the portal endpoint.

Project phase labels are service-specific in the UI while still using the same stable backend phase enum:

| Backend phase | Booking | CRM | Automation | Dashboard | Web/SEO |
| --- | --- | --- | --- | --- | --- |
| `requirements` | Onboarding completed | Fields and catalogue | Goals and channels | Roles and KPIs | Content handoff |
| `design` | Rules configuration | Data model | API and webhook setup | View architecture | Visual structure |
| `development` | Widget build | Contact migration | Trigger build | Permissions and data | Build |
| `review` | Booking test phase | Form integration | Sending tests | Internal testing | SEO and review |
| `launch` | Web integration | Workspace delivery | Production active | Panel delivery | Launch |

The client dashboard also shows a service execution panel for the selected track:
- current service phase and practical meaning
- staging/prototype area for the selected service
- delivery handoff items that unlock progressively toward launch
- service-specific next-step messaging for Web/SEO, Booking, CRM, Automation and Dashboard
- a final service handoff map with:
  - what the client receives
  - what the client should check before launch
  - which upgrades are intentionally future work

The client dashboard also shows a small service guide for the selected track:
- what the client should review
- what the delivery area will contain later
- which files, links or feedback belong to that service

The admin view shows a matching minimum/advanced scope guide so the operator can keep the first implementation lean
while still understanding the future upgrade path.

The scope guide now follows the service-specific operating model:
- Booking separates the minimum local slot engine/email confirmation/widget staging from calendar sync, Stripe, locking and WhatsApp/SMS reminders.
- CRM separates client list/detail, internal notes and manual conversion from service history, webhooks, event timeline and automated conversion.
- Automation separates the minimum Resend email flows from WhatsApp/SMS and sector-specific recipes.
- Dashboard separates owner/admin tables, customer records and internal notes from Kanban, realtime updates and richer media workflows.

The selected admin project track also shows a phase gate checklist. This checklist changes by service and current phase
so the operator can verify the right evidence before moving the manual phase switch:

- requirements
- design
- development
- review
- launch

The checklist is advisory. It does not block saving the phase yet, because the current MVP keeps phase control manual.

The selected admin project track also shows an admin-only delivery handoff control:
- client handoff items that should be prepared before delivery
- admin verification checks that must happen before launch
- future boundary items that should not be silently included in the first delivery

This keeps the demo honest: the client can see a professional delivery path, while the admin can still separate MVP
scope from future production upgrades such as S3 contracts, Google Calendar, Stripe, WhatsApp, SMS, advanced BI or
multi-user RBAC.

The admin view also extracts submitted structured onboarding data for the selected service track:
- submitted forms are grouped under the selected service
- relevant field values are displayed as readable cards
- expected fields that have not been submitted yet are flagged as useful to confirm

This gives the admin a quick reviewer surface for Booking rules, CRM catalogue/fields, Automation channels/tone and
Dashboard roles/KPIs without opening each task manually.

All core tracks now have an extra admin reviewer block:
- Web/SEO checks pages, competitors, SEO keywords and domain/access context.
- Booking checks opening schedule, slot duration, capacity, minimum notice, bookable units, cancellation policy and external integrations.
- CRM checks service catalogue, pricing context, pipeline stages, required contact fields, sector-specific fields and form/source connections.
- Automation checks email, WhatsApp/SMS context, tone, wording and selected automation goals.
- Dashboard checks staff roles, permissions, protocols, exceptions, KPIs and data sources.

These reviewer blocks are decision aids. They do not replace admin approval and they do not generate final production
systems automatically.

The reviewer blocks generate a JSON preview for each service:
- Web/SEO preview groups site structure, SEO terms and domain context.
- Booking preview groups rules, resources, policies and requested integrations.
- CRM preview groups catalogue, pipeline stages, required fields, sector fields and intake sources.
- Automation preview groups channels, message style, goals and suggested minimum flows.
- Dashboard preview groups access model, operations model and reporting model.

The preview is a technical handoff artifact only. It does not create reservations, does not mutate CRM tables, does not
send messages and does not trigger deployment. Admin users can save it as an internal versioned configuration snapshot
for the selected project track.

## Client CRM Module

The CRM / Lead Management module is the first private operations module after Web & SEO.

It uses separate client-owned tables:

```text
client_crm_leads
client_crm_follow_up_actions
client_crm_lead_notes
client_crm_lead_events
client_crm_webhook_tokens
```

These records are different from the public Altaira `leads` table. Public leads are Altaira's own sales inbox. Client CRM leads belong to the SME client and are shown only inside that client's private workspace.

Access rules:
- the user must have a valid client session
- the user must be linked to the client through `client_user_access`
- the client must have an active/non-cancelled CRM service assignment
- the critical service contract must be approved by admin

Public website intake:
- admin can generate a client CRM webhook API key from the client detail page
- the full API key is shown only once and is stored only as a SHA-256 hash
- external forms can POST to `/api/v1/client-crm/webhooks/leads` using `X-Altaira-Webhook-Key`
- webhook-created leads are client-owned CRM leads and do not enter Altaira's own public `leads` inbox
- revoked tokens stop accepting new leads immediately

Frontend behavior:
- `/client/dashboard` shows the CRM module when the backend marks the `crm` module active
- the client can switch between Kanban and List views
- the client can create a lead manually
- the client CRM summary includes recent visible activity from actions, notes and status events
- the client can change status from the drawer/detail area
- the client can create and complete visible follow-up actions for a lead
- the client can add internal notes to the lead
- sector fields are shown according to `sector_type`
- admin can list, create and revoke CRM webhook tokens from `/clients/{clientId}`
- admin can inspect a client's private CRM leads from `/clients/{clientId}` without impersonating the client
- admin can update CRM lead status, create follow-up actions and add admin notes from the same client detail page
- admin can search/filter the compact CRM overview by text, status and priority when a client has multiple leads
- each CRM lead includes persisted follow-up actions and a compact timeline with lead creation, status changes, note events and follow-up action events
- `/clients/{clientId}/crm` provides a dedicated admin CRM workspace when the compact client detail page is not enough
- the admin CRM workspace includes a recent activity strip across actions, notes and status events
- the admin CRM workspace labels follow-up actions, notes and timeline events as `Client-visible` or `Admin-only`
- admin CRM follow-up actions and notes are private by default; admin can explicitly share them with the client from the CRM forms
- `/client/dashboard` shows client/system follow-up actions, explicitly shared admin follow-up actions, client/system CRM notes, explicitly shared admin notes and client/system CRM timeline events
- shared admin notes are grouped as `Altaira notes`; client-created notes are grouped as `Your workspace notes`
- `/client/crm/leads/{leadId}` provides a dedicated client-facing CRM lead detail screen for status, follow-up actions, notes, sector context and visible timeline

This is a controlled foundation for the final CRM module. Drag-and-drop Kanban movement, richer CRM analytics and advanced task assignment are still future work.

## Current Limitations

- File upload now stores real files on the backend filesystem and exposes authenticated admin downloads. A production cloud bucket integration is still future work.
- Client invitation by email/token is implemented. Google login is implemented for already activated/invited client users and remains invitation-gated.
- The client dashboard supports project progress, service execution panels, revision feedback, external links and project material uploads for each active service track. Richer project material grouping/versioning is still future work.
- Admin can update the selected project track phase and project URL, but a larger project CRUD table/list is still future work.
- CRM Kanban/List foundation and public webhook/API key intake are implemented for active client CRM modules. Drag-and-drop movement, CRM owner email alerts and admin CRM metrics are still future work.
- The larger modules for booking calendar, workflow automation and analytics dashboard are still future phases.
- The current admin onboarding UI is a practical review surface, not a full operations suite.

## Validation

Useful checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
cd backend && ./mvnw test
cd backend && ./mvnw package -DskipTests
```
