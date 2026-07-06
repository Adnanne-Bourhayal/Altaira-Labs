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

- `/services`

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

## Database Verification

Useful SQL:

```sql
select count(*) from public.leads;
select count(*) from public.clients;
select count(*) from public.services;
select count(*) from public.client_services;
select count(*) from public.internal_notes;
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

## Known Limits

- Admin auth is still simple MVP auth.
- No payment, invoicing or external CRM integration is implemented.
- No file upload system is implemented.
- No advanced RBAC is implemented.
- The service catalogue is intentionally small and aligned with the actual website.
