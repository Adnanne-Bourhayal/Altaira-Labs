# Client Portal and Admin CRM Demo Path

This guide explains the current demo path for the private Client Portal and internal Admin CRM.

The goal is to show a small but real operating system for a client: services, project tracks, onboarding material, CRM leads, notes and visibility rules.

For manual QA and evidence capture, use `docs/client-portal-admin-crm-qa-checklist.md`.

## 1. Admin Access

Open:

```text
/admin/login
```

The public navbar must not expose the admin login. Admin access is intentionally separate from the client area.

After login, use:

```text
/clients
```

From there, open a client detail page.

For the consolidated admin operating view, open:

```text
/clients/{clientId}/workspace
```

From this command center, the admin can refresh the workspace, generate or reuse onboarding tasks, approve simple submitted onboarding tasks, and jump directly into the relevant CRM lead.

## 2. Client Setup

In the admin client detail flow, the admin can:

- inspect client details
- review a compact client health panel for contract, onboarding, access, tracks, CRM follow-up and intake
- open the command center for one-page operational control
- assign services
- open the onboarding workspace
- open the dedicated CRM workspace
- send or review client invitations

The important concept is:

```text
one client -> one private workspace -> one or more active service tracks
```

## 3. Service Tracks

The Client Portal currently supports these service tracks:

- Web and SEO
- CRM / Lead Management
- Booking
- Automation
- Dashboard

Each active service assignment can create or reuse its own project track.

Examples:

- a restaurant with booking work gets a booking track
- a clinic with CRM work gets a CRM track
- a business with automation work gets an automation track

This avoids mixing all client material into one generic upload area.

## 4. Client Login

Open:

```text
/client/login
```

The client login is visually separate from the admin login.

The client only sees their own private workspace.

## 5. Client Dashboard

Open:

```text
/client/dashboard
```

The dashboard shows:

- active project tracks
- material uploads
- external links
- feedback areas
- CRM lead management if the CRM module is active
- recent visible CRM activity when CRM is active

The client can add files, links and feedback to the correct track.

## 6. Client CRM

When CRM is active, the client can:

- add CRM leads
- search/filter leads
- view Kanban or list layout
- review recent visible activity across leads
- update lead status
- add workspace notes
- open a dedicated lead detail route:

```text
/client/crm/leads/{leadId}
```

The client sees:

- client-created follow-up actions
- admin follow-up actions explicitly shared with the client
- client/system notes
- admin notes explicitly shared with the client
- client/system timeline events

The client does not see:

- admin-only follow-up actions
- admin-only notes
- admin-only timeline events
- internal admin usernames on shared notes

## 7. Admin CRM Workspace

Open from a client:

```text
/clients/{clientId}/crm
```

The admin can:

- view all CRM leads for that client
- search/filter leads
- review recent CRM activity with client-visible/admin-only labels
- inspect all notes
- inspect all timeline events
- change lead status
- create follow-up actions
- decide whether a follow-up action is client-visible
- add admin notes
- decide whether an admin note is client-visible

Admin notes and admin follow-up actions are private by default.

If an admin checks client visibility, the note appears in the client workspace as an Altaira note and the follow-up action appears as a visible next step.

## 8. Visibility Rule

The core rule is:

```text
Admin sees the full operational record.
Client sees only their own workspace data plus admin notes intentionally shared with them.
```

This is the key difference between the internal CRM and the client portal.

## 9. Demo Sequence

Recommended demo:

1. Log in as admin.
2. Open `/clients`.
3. Open a client detail page.
4. Open `/clients/{clientId}/workspace`.
5. Show readiness, onboarding, tracks, CRM control and recent activity.
6. Generate or reuse onboarding tasks if the workspace is not prepared yet.
7. Approve a simple submitted onboarding task from the command center, or open full onboarding for rejection feedback.
8. Jump from a CRM action or urgent lead into `/clients/{clientId}/crm?lead={leadId}`.
9. Show assigned services and active tracks.
10. Open `/clients/{clientId}/crm`.
11. Add or review a CRM note and explain client-visible vs admin-only.
12. Add one admin-only follow-up action and one client-visible follow-up action.
13. Log in as the client.
14. Open `/client/dashboard`.
15. Show active tracks.
16. Open the CRM area.
17. Add a workspace note and a follow-up action.
18. Open `/client/crm/leads/{leadId}`.
19. Show that admin-only actions/notes are hidden and shared Altaira actions/notes are visible.

## 10. Current Limitations

- Real Google OAuth production configuration still depends on environment setup.
- File storage is local/project-level at this stage.
- Server-side CRM pagination is not needed yet for the MVP scale.

## 11. Why This Supports the Project

This flow supports the project title:

```text
Lead, Client and Service Management
```

It connects:

- leads
- clients
- services
- client workspaces
- CRM lead management
- internal/client notes
- service-specific material and feedback

The result is not just decorative. It is a real operating flow for managing a small client relationship.
