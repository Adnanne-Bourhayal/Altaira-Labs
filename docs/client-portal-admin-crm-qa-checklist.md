# Client Portal and Admin CRM QA Checklist

This checklist validates the private workspace flow for the current Lead + Client + Service Management MVP.

It is intentionally manual and demo-oriented. It proves that the admin CRM and client portal work together without pretending that every future feature is finished.

## Preconditions

- Frontend runs locally with `npm run dev`.
- Backend runs locally or the frontend points to the deployed backend.
- Database has the onboarding/client portal schema applied.
- Admin login is configured.
- At least one client exists.
- At least one service is assigned to the client.
- Do not use real client secrets or private files for this checklist.

Automated baseline:

```bash
npm run check:client-portal-schema
npm run smoke:client-portal
```

The full smoke currently validates `55/55` authenticated portal and CRM checks, including onboarding idempotency and the read-only `viewer` boundary. The viewer dashboard and onboarding workspace have also been checked manually at 384 px and desktop width with no horizontal overflow.

## 1. Admin Login

Open:

```text
/admin/login
```

Expected:

- admin can sign in
- public navbar does not expose admin login
- authenticated admin can open `/clients`

Evidence:

- screenshot of `/clients`

## 2. Client Detail

Open:

```text
/clients/{clientId}
```

Expected:

- client identity is visible
- assigned services are visible
- Client Health panel is visible
- Command Center link is visible
- Onboarding and CRM links are visible

Evidence:

- screenshot of client detail health panel

## 3. Command Center

Open:

```text
/clients/{clientId}/workspace
```

Expected:

- readiness score renders
- readiness checklist renders
- immediate admin queue renders
- service project tracks render when available
- onboarding review summary renders
- CRM control summary renders
- recent workspace activity renders

Actions:

- click `Refresh`
- click `Generate / reuse onboarding`
- if a submitted task exists, approve one simple submitted task
- click an urgent/open CRM item and confirm CRM opens with the relevant lead selected

Evidence:

- screenshot of command center
- note whether onboarding generation reused existing tasks or created missing tasks

## 4. Admin Onboarding Review

Open:

```text
/admin/onboarding/{clientId}
```

Expected:

- onboarding dashboard loads
- required/submitted/rejected counters render
- service project tracks render
- admin can approve submitted tasks
- admin can reject tasks with feedback from the full onboarding screen
- project materials are shown by track

Evidence:

- screenshot of onboarding review

## 5. Client Invitation and Activation

From:

```text
/clients/{clientId}
```

Actions:

- create/send client invitation
- open activation URL manually if email is not configured locally
- activate client account

Expected:

- invitation is one-use
- activated client can log in at `/client/login`
- client is routed to `/client/dashboard` or `/onboarding` depending on contract state

Evidence:

- screenshot of client activation or client dashboard

## 6. Client Onboarding

Open:

```text
/onboarding
```

Expected:

- client sees only their own onboarding tasks
- client can submit required text/signature tasks
- client can upload allowed files
- rejected tasks show admin feedback and can be resubmitted
- general client dashboard stays locked until critical contract approval

Evidence:

- screenshot of client onboarding tasks

## 7. Client Dashboard

Open:

```text
/client/dashboard
```

Expected:

- client sees active service tracks
- locked modules are not usable
- project materials/links/feedback are scoped to the selected track
- CRM module appears only when active
- recent visible CRM activity appears when CRM has data
- desktop and mobile layouts have no horizontal page overflow

Evidence:

- screenshot of client dashboard

## 8. Client CRM

From client dashboard, open the CRM area.

Expected:

- client can create a CRM lead
- client can search/filter CRM leads
- client can update lead status
- client can add visible notes
- client can create follow-up actions
- client sees only client-visible/admin-shared items

Evidence:

- screenshot of client CRM lead detail

## 9. Admin CRM

Open:

```text
/clients/{clientId}/crm
```

Optional direct link:

```text
/clients/{clientId}/crm?lead={leadId}
```

Expected:

- admin sees all CRM leads for the client
- `lead` query parameter selects the matching lead when present
- admin sees admin-only and client-visible labels
- admin can add private notes
- admin can share selected notes with the client
- admin can add private follow-up actions
- admin can share selected follow-up actions with the client
- admin can close follow-up actions

Evidence:

- screenshot of admin CRM with visibility labels

## 10. Visibility Verification

Create or confirm:

- one admin-only note
- one client-visible admin note
- one admin-only follow-up action
- one client-visible follow-up action

Expected:

- admin sees all four records
- client sees only the two shared records plus their own records

Evidence:

- side-by-side screenshots or notes from admin/client views

## 11. Regression Checks

Confirm these still work:

- public contact form creates a lead
- Resend notification still sends in production when configured
- admin lead list still loads
- client list still loads
- service assignment does not duplicate existing client-service links

## 12. Viewer And Responsive Check

Log in with a `viewer` invitation and check the dashboard and onboarding workspace.

Expected:

- the read-only notice is visible
- scoped project and CRM data remain readable
- feedback, links, materials, onboarding and CRM write controls are disabled
- no horizontal page overflow at a 384 px viewport
- service progress metrics use two columns on mobile and four on desktop

## Known Limits

- Google OAuth requires correct Google client configuration.
- Local email sending depends on local Resend environment variables.
- File storage is filesystem-based at this stage.
- Command center quick approval is for straightforward submitted tasks; rejection with feedback remains in the full onboarding review screen.

## Pass Criteria

The flow passes if:

- admin can manage the client workspace
- client can access only their own workspace
- service tracks keep materials and feedback separated
- CRM visibility rules hold between admin and client views
- original public lead/contact flow still works
