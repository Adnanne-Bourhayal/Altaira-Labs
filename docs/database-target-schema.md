# Database Target Schema

This document defines the small but complete database that should exist for the academic Altaira Workspace prototype.

It is based on:

- The current MVP documentation in `docs/architecture.md`, `docs/mvp-flow.md`, and `docs/database.md`.
- The official project proposal in `/Volumes/T7/Altaira_Labs/doc_context/Altaira_Proposal.pdf`.
- The academic execution guidance that expects a functional database schema, end-to-end testing, and documented system evidence.
- The enterprise logic documents in `/Volumes/T7/Altaira_Labs/altaira_enterprise_docs_md`.

No production Neon change has been applied from this document.

## Current State

The current Neon database is intentionally small:

```text
public.leads
```

This is enough for the current Sprint 1 MVP lead flow:

- public lead capture
- backend validation
- PostgreSQL persistence
- admin lead list
- lead detail
- status update

It is not enough to represent the full project title: Lead, Client and Service Management.

## Academic Scope Reading

The official proposal says Altaira Workspace should support:

- lead handling
- client progression
- service management
- basic client records
- service progress through defined stages
- workflow stages
- internal notes

It also explicitly avoids:

- full production CRM
- advanced billing
- complete AI assistants
- highly complex role management
- heavy third-party integrations
- email, WhatsApp, and CSV integrations as core implementation

So the correct database is not huge. It should be a compact relational schema that can prove the product concept.

## Enterprise Documents Alignment

The enterprise Markdown documents refine the target model:

- `01_Altaira_Technical_Specification_SRS_Architecture.md` confirms the current MVP is leads only, and puts client management, service management, RBAC, consultant/auditor roles, audit logs, file uploads, invoicing, analytics, automations, and multi-tenant SaaS into future scope.
- `02_Altaira_API_Contract_Frontend_Backend.md` confirms the current API contract is lead-centered and uses the simple status model `new`, `contacted`, `closed`.
- `03_Altaira_Business_Financial_Plan.md` defines the staged business path: Lead -> Client -> Service -> Delivery workflow -> Reporting -> Automation -> Business intelligence.
- `04_Altaira_GDPR_Security_NDA_IP_Template.md` identifies future data categories: client notes, service history, assigned consultant, project status, communication logs, uploaded documents, and internal user accounts.

The schema below therefore supports the future product logic, but implementation should still happen in phases.

## Current Field Mapping

The documents use some plain-language names that map to the current implementation:

| Enterprise docs name | Current backend/database name |
|---|---|
| `name` | `full_name` |
| `company` | `business_name` |
| `message` / service interest | `goals` |
| `status` | `status` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

## Recommended Target Tables

| Table | Purpose | Priority |
|---|---|---|
| `leads` | Public enquiries and lead status. Already exists. | Current MVP |
| `clients` | Basic client records created from qualified/converted leads. | Academic core |
| `services` | Small service catalogue, such as websites, automations, dashboards. | Academic core |
| `client_services` | Service delivery/progress records for each client. | Academic core |
| `internal_notes` | Simple notes attached to leads, clients, or service work. | Practical execution |
| `client_contacts` | One or more people linked to a client. | Future core refinement |
| `tasks` | Follow-up or delivery tasks linked to a lead, client, or service. | Practical execution |
| `users` | Minimal internal users for admin/consultant/auditor ownership. Not full enterprise IAM. | Later MVP hardening |
| `lead_status_history` | Audit trail for status changes. | Later hardening |
| `communication_logs` | Manual communication history. Automation stays future work. | Later enterprise |
| `documents` | Metadata for uploaded documents. Actual file storage stays future work. | Later enterprise |
| `audit_log` | Technical record of important internal actions. | Later hardening |

## Relationship Model

```text
leads
  -> lead_status_history
  -> clients via clients.source_lead_id
  -> communication_logs
  -> documents

clients
  -> client_contacts
  -> client_services
  -> internal_notes
  -> tasks
  -> communication_logs
  -> documents

services
  -> client_services

users
  -> leads via assigned_user_id
  -> lead_status_history
  -> tasks
  -> internal_notes
  -> communication_logs
  -> documents
  -> audit_log
```

## Minimum Final Prototype Database

For the final defendable prototype, the smallest credible database is:

1. `leads`
2. `clients`
3. `services`
4. `client_services`
5. `internal_notes`

This covers the academic promise: lead, client, and service management.

The stronger but still small version is the 12-table target above.

## Implemented Core Expansion

The controlled implementation uses the four-table academic core:

1. `clients`
2. `services`
3. `client_services`
4. `internal_notes`

The additive SQL migration lives at:

```text
backend/database/core-expansion-migration.sql
```

The idempotent service catalogue seed lives at:

```text
backend/database/core-expansion-seed.sql
```

Implemented client fields:

```text
id, name, company, email, phone, source_lead_id, status, created_at, updated_at
```

Implemented service fields:

```text
id, name, category, description, active, created_at, updated_at
```

Implemented client-service fields:

```text
id, client_id, service_id, status, notes, created_at, updated_at
```

Implemented internal-note fields:

```text
id, lead_id, client_id, content, author, created_at
```

## Status Models

Current lead statuses:

```text
new
contacted
closed
```

Recommended future lead statuses:

```text
new
contacted
qualified
converted
lost
```

Recommended service progress statuses:

```text
planned
in_progress
review
delivered
cancelled
```

Do not change the database status constraints before updating the backend and admin UI to use the same model.

## Role Model

The enterprise documents define three internal roles:

```text
admin
consultant
auditor
```

The current MVP now implements a minimal authentication foundation:

```text
app_users
app_user_sessions
security_events
```

This is not full RBAC yet. The roles are stored and available for future authorization rules, while the current admin/demo user uses role `admin`.

## Implementation Phases

Phase 1, already working:

1. `leads`

Phase 2, next database expansion:

1. `clients`
2. `services`
3. `client_services`
4. `internal_notes`

Phase 3, execution quality:

1. `tasks`
2. `users`
3. `lead_status_history`

Phase 4, enterprise evidence:

1. `communication_logs`
2. `documents`
3. `audit_log`

## What Not To Add Yet

Do not add these unless the project scope is formally expanded:

- invoices
- payments
- external CRM sync
- email automation tables
- WhatsApp integration tables
- AI scoring tables
- advanced permissions/roles
- real file storage infrastructure beyond metadata
- multi-tenant SaaS data isolation

These would make the project look larger, but less focused.

## Safe Next Action

Prepare a non-destructive migration from the current one-table MVP to the target schema.

Do not run it against Neon until:

1. the backend entities/services are planned,
2. the admin UI screens are planned,
3. the status model is agreed,
4. a backup or rollback plan exists,
5. explicit approval is given.

The draft SQL lives at:

```text
backend/database/target-schema.sql
```
