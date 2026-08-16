# Core Client and Service Flow

This document explains the small academic core added after the original lead-only MVP.

## Simple Product Cycle

```text
Visitor submits lead
  -> Lead is stored in PostgreSQL/Neon
  -> Admin reviews lead
  -> Admin creates client from lead
  -> Admin assigns an Altaira service to the client
  -> Admin adds internal notes
  -> Workspace shows lead, client, service and follow-up context
```

This is the simplest complete version of the official project title:

```text
Lead, Client and Service Management
```

## What A Lead Is

A lead is a potential customer who contacted Altaira Labs through the public website.

Current lead flow:

1. User submits the public contact form.
2. Next.js forwards the request to Spring Boot.
3. Spring Boot validates and saves the lead.
4. Admin sees the lead in `/leads`.
5. Admin can open the lead detail page and update status.

This public `leads` table is Altaira Labs' own commercial inbox.

The client CRM module uses a separate client-owned lead table:

```text
client_crm_leads
```

Those leads belong to the SME client inside `/client/dashboard` and are isolated from Altaira's public lead inbox.

## What A Client Is

A client is a real business/person record that Altaira wants to manage after a lead becomes serious enough.

Client fields:

- name
- company
- email
- phone
- source lead id, when created from a lead
- status
- created/updated timestamps

Admin screens:

- `/clients`
- `/clients/{id}`

## What A Service Is

A service is something Altaira Labs can offer.

Initial service catalogue:

- Website Development
- Booking Systems
- Automation Workflows
- Internal Dashboards
- CRM / Business Systems
- API Integration
- Technical Consulting

These come from the public website sections and the enterprise planning documents.

Admin screen:

- `/admin/services`

## What `client_services` Does

`client_services` links a client to a service.

Example:

```text
Client: Ruiz Dental Studio
Service: Booking Systems
Status: in_progress
Notes: Needs appointment booking and follow-up reminders.
```

This table is important because the same client can have more than one service, and each service can have its own delivery status.

The private client portal reads this table to decide which modules are active:

- Web & SEO project workspace
- CRM / Lead Management
- future Booking System
- future Workflow Automation
- future Management Dashboard

Modules not assigned to the client appear locked in the portal, which keeps the SaaS shell ready for upsell without exposing unavailable features.

Allowed service statuses:

- planned
- in_progress
- review
- delivered
- cancelled

## What `internal_notes` Does

Internal notes store admin follow-up context.

Notes can be attached to:

- a lead
- a client

This keeps the system practical without adding a heavy communication module.

## Demo Flow

1. Open the public homepage.
2. Submit a lead.
3. Log in as admin.
4. Open `/leads`.
5. Open the new lead detail page.
6. Add an internal note.
7. Click `Create Client`.
8. Open the created client.
9. Assign one service.
10. Update the service status.
11. Add a client note.
12. Verify records in PostgreSQL/Neon using DBeaver, pgAdmin, TablePlus, or Neon Console.

Extended client-portal CRM demo:

1. Assign `CRM / Business Systems` to a client.
2. Generate onboarding tasks.
3. Activate/login as the client.
4. Submit the written contract task.
5. Approve the contract as admin.
6. Open `/client/dashboard`.
7. Open the CRM module.
8. Create a client-owned lead.
9. Switch between Kanban and List views.
10. Update lead status.
11. Add an internal CRM note.
12. As admin, create a CRM webhook API key from the client detail page.
13. POST a lead to `/api/v1/client-crm/webhooks/leads` with `X-Altaira-Webhook-Key`.
14. Use `priority=urgent` to verify the client owner receives a Resend email alert.
15. Verify `client_crm_leads`, `client_crm_lead_notes` and `client_crm_webhook_tokens` in the database.

Extended multi-service client portal demo:

1. Assign several services to the same client, such as `Booking Systems`, `CRM / Business Systems`, `Automation Workflows` and `Internal Dashboards`.
2. Open the admin client portal view.
3. Verify that each active module appears as active.
4. Verify that each active module has its own project track in `client_projects`.
5. Open `/client/dashboard` as the client and review the service project tracks.
6. Select a non-Web track, for example Booking or CRM.
7. Submit track-specific feedback.
8. Upload a file or save an external link for that selected track.
9. Open `/admin/onboarding/{clientId}` and confirm the admin can select the same track, see the feedback, open links and approve/reject uploaded material.
10. Confirm that the module cards, project tracks, materials and CRM pipeline are all scoped to the same client.

The service assignment action is intentionally idempotent for the same client and service.
If an admin tries to assign a service that is already linked to the client, the existing
`client_services` row is reused instead of creating duplicate work.

## Database Verification

Useful SQL:

```sql
select count(*) from public.leads;
select count(*) from public.clients;
select count(*) from public.services;
select count(*) from public.client_services;
select count(*) from public.internal_notes;
select count(*) from public.client_crm_leads;
select count(*) from public.client_crm_lead_notes;
select count(*) from public.client_crm_webhook_tokens;
```

Inspect one connected flow:

```sql
select
    l.full_name as lead_name,
    c.name as client_name,
    c.company,
    s.name as service_name,
    cs.status as service_status
from public.clients c
left join public.leads l on l.id = c.source_lead_id
left join public.client_services cs on cs.client_id = c.id
left join public.services s on s.id = cs.service_id
order by c.created_at desc;
```

Inspect client-owned CRM records:

```sql
select
    c.company,
    cl.full_name,
    cl.status,
    cl.priority,
    cl.source,
    cl.sector_type,
    cl.sector_fields_json,
    cl.created_at
from public.client_crm_leads cl
join public.clients c on c.id = cl.client_id
order by cl.created_at desc;
```

Inspect CRM webhook tokens without exposing the raw key:

```sql
select
    c.company,
    t.label,
    t.token_prefix,
    t.active,
    t.last_used_at,
    t.revoked_at,
    t.created_at
from public.client_crm_webhook_tokens t
join public.clients c on c.id = t.client_id
order by t.created_at desc;
```

## Admin Login Visibility

Recommended setup for the TFG/demo:

- Use `/admin/login` for the internal admin dashboard.
- Keep `/login` only as a legacy redirect to `/admin/login`.
- Do not show the admin login in the public website menu.
- Use the direct login URL during the TFG presentation.
- Keep `/client/login` separate for the client workspace.

This keeps the demo easy to access without presenting internal administration as part of the public marketing site.

## Known Limits

- Admin auth is DB-backed demo/TFG auth with BCrypt and session cookies, but still has no MFA or password reset.
- No payment, invoicing or external CRM integration is implemented.
- Onboarding and Web/SEO project file uploads are implemented on the backend filesystem. A production bucket is still future work.
- Client CRM Kanban/List foundation and public client CRM webhook/API keys are implemented, but drag-and-drop, urgent-lead email alerts and admin CRM analytics are still future work.
- Advanced multi-user RBAC is not complete yet.
- The service catalogue is intentionally small and aligned with the actual website.
