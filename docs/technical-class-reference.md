# Altaira Workspace Technical Class Reference

## Purpose

This document explains the important runtime boundaries in Altaira Workspace. It is
not an exhaustive list of DTOs or generated accessors. The objective is to make the
system understandable, maintainable and defendable without duplicating self-evident
code comments.

## Runtime architecture

```text
Browser
  -> Next.js pages and server-side API proxies
  -> Spring Boot REST controllers
  -> domain/application services
  -> JPA repositories
  -> PostgreSQL (Neon in production, H2 in isolated tests)

External boundaries:
  Resend        contact and commercial lifecycle email
  Stripe        test checkout and signed webhook confirmation
  Amazon S3     private onboarding and project files through presigned URLs
  GitHub App    guarded private repository provisioning
  Jira Cloud    guarded internal technical issue provisioning
```

The backend is authoritative for identity, tenancy, state transitions and provider
execution. Next.js middleware and client-side rendering improve navigation but are
not security controls.

## Backend packages

| Package | Responsibility |
|---|---|
| `controller` | HTTP contracts, validation entry points and response status mapping |
| `service` | business rules, transactions, tenancy checks and state transitions |
| `repository` | Spring Data persistence queries, including lock-aware provisioning reads |
| `entity` | PostgreSQL persistence model |
| `dto` | public/admin/client request and response contracts |
| `security` | admin/client sessions, ownership checks and audit context |
| `provisioning` | requirement normalization, decision rules and plan composition |
| `integration` | provider-specific HTTP/API adapters; no business approval decisions |
| `model` | controlled status and service vocabularies |

## Core application classes

| Class | Responsibility | Important invariant |
|---|---|---|
| `AuthService` | admin authentication and session creation | admin credentials remain backend-only |
| `ClientInvitationService` | issue and accept single-use client invitations | invitations are scoped, expiring and stored safely |
| `ClientGoogleAuthService` | invitation-aware Google sign-in | Google identity does not bypass workspace entitlement |
| `ClientAccessService` | resolve the authenticated client and workspace | cross-client identifiers are rejected in the backend |
| `LeadService` | public lead create/read/update flow | a notification failure never removes a stored lead |
| `LeadAssessmentService` | save diagnostic answers and recommend services | recommendation is advisory until admin approval |
| `LeadConversionService` | convert one lead into a client | source lead and client remain traceable and idempotent |
| `ClientManagementService` | client list/detail and administrative changes | admin operations use explicit DTOs and state rules |
| `ClientServiceAssignmentService` | attach catalogue services to a client | duplicate client-service relations are reused |
| `ClientPortalService` | assemble the client workspace, tracks and resources | only the authenticated client's graph is returned |
| `WorkspaceTaskService` | admin/client task views and status transitions | Altaira tasks are the client-visible source of truth |
| `OnboardingTemplateService` | create service-specific onboarding checklists | only contracted tracks receive task templates |
| `OnboardingService` | submit, approve or reject onboarding work | critical gates derive from real task state |
| `MediaUploadUrlService` | private S3 upload/download lifecycle | keys are tenant-scoped; credentials never reach the browser |
| `OnboardingFileStorageService` | local fallback and S3-backed reads | paths cannot escape the configured storage root |
| `CommercialFlowService` | payment-to-client/workspace activation | activation follows a confirmed signed payment event |
| `CommercialNotificationService` | plan, payment and invitation emails | retries are auditable and do not repeat state creation |
| `ProvisioningPlanService` | persist explainable v1/v2 dry-run plans | planning does not imply provider execution |
| `ProvisioningExecutionService` | materialize internal dry-run steps | `executionAllowed=false` remains the default |
| `GitHubProvisioningExecutionService` | guarded private repository execution | approved plan, active commercial flow and confirmation required |
| `JiraProvisioningExecutionService` | guarded Jira issue execution | source steps must come from the approved dry run |
| `LeadNotificationService` | Resend/SMTP contact notification | secrets are never logged; provider failure is classified safely |
| `SecurityEventService` | authentication and security audit events | logs contain safe metadata, not credentials |

## External integration adapters

| Adapter | Scope | Safety model |
|---|---|---|
| `StripeCheckoutGateway` | create test Checkout sessions | live mode is blocked by configuration and webhook is verified |
| `GitHubRepositoryProvisioner` | ensure one private repository | GitHub App token, exact organization, idempotent lookup, private-only |
| `JiraIssueProvisioner` | ensure technical tasks | project restriction and unique idempotency label |
| `JiraApiClient` | authenticated Jira REST calls | Basic auth values remain server-side |
| `GitHubApiClient` | GitHub REST calls | installation tokens are short-lived and never persisted |
| provisioning provider registry | dry-run resource descriptions | providers declare whether execution is supported |

No Drive, Vercel, Render, Neon project creation or workflow provider is executed by
the current provisioning engine. Those resources remain planned/manual until a
separately gated adapter is implemented and tested.

## Frontend areas

### Public

| Route | Purpose |
|---|---|
| `/` | consultancy offer, sectors, services and contact path |
| `/services/[slug]` | service value proposition and enquiry path |
| `/business/[slug]` | sector-specific operational context |
| `/contact` | real lead persistence and notification |
| `/calculator` | transparent operational savings estimate |
| `/blog` | SEO-oriented operational articles |

### Admin

| Route | Purpose |
|---|---|
| `/admin` | ten-second executive overview |
| `/admin/projects` | real client project list and navigation |
| `/admin/tasks` | global task table, filters and timeline |
| `/admin/calendar` | deadlines derived from real tasks |
| `/leads` and `/leads/[id]` | intake, assessment, status and conversion |
| `/clients` and `/clients/[id]` | client context before operational detail |
| `/clients/[id]/workspace` | admin view of the private workspace |
| `/clients/[id]/operations` | project/track operations and files |
| `/admin/onboarding/[clientId]` | review submitted onboarding tasks |
| `/admin/services` | service catalogue administration |

### Client

| Route | Purpose |
|---|---|
| `/client/login` | client-only sign-in |
| `/client/activate` | invitation activation |
| `/onboarding` | service-specific required activities |
| `/client/dashboard` | private workspace overview |
| `/client/tasks` | tasks visible to the authenticated client |
| `/workspace/[workspaceId]` | selected workspace and track context |

The `app/api` routes are server-side proxies. They forward only the required cookie,
payload and response fields and keep the backend URL and integration secrets out of
browser code.

## Domain states

### Lead and client

```text
lead: new -> contacted -> qualified -> converted
                              \-> lost
converted lead -> client -> assigned services -> private workspace
```

The conversion service preserves the source lead. Repeating an already completed
conversion must reuse the existing client rather than create a duplicate.

### Commercial activation

```text
approved plan
  -> checkout pending
  -> signed Stripe webhook
  -> PAYMENT_CONFIRMED
  -> client/workspace activation
  -> invitation notification
  -> client activation and onboarding
```

The browser success page is informational. It cannot confirm payment; only a valid
Stripe webhook can do that.

### Onboarding activity

```text
pending -> submitted -> approved
                     \-> rejected -> submitted
```

Client dashboards derive progress from actual activities. They do not display invented
percentages. Critical contracts can gate a track until the admin approves them.

### Provisioning

```text
draft -> approved -> dry-run materialized
                   -> guarded provider execution (explicit gate only)
```

Provider execution records a run, steps, attempts and external resource IDs/URLs.
Idempotency keys prevent duplicate repositories and Jira issues.

## Permissions and data isolation

- `ADMIN` can operate across clients through internal endpoints.
- `CLIENT` can access only records joined to the authenticated client/workspace.
- Admin preview renders client visibility but does not replace real client-session tests.
- Internal notes, provider details, credentials and admin-only snapshots are never part
  of client response DTOs.
- Every file is associated with client, workspace, service track and project/task context.
- S3 buckets remain private; temporary upload URLs grant one operation to one object key.

## Source of truth boundaries

| Data | Source of truth |
|---|---|
| Lead/client/service/workspace | Altaira PostgreSQL |
| Client-visible tasks and approvals | Altaira Workspace |
| Technical backlog, bugs and sprint work | Jira |
| Repository metadata | GitHub, referenced from Altaira |
| Payment confirmation | signed Stripe webhook plus Altaira audit record |
| Private file object | S3; Altaira stores verified metadata and ownership |
| Email delivery attempt | Altaira notification record; Resend provides delivery transport |

Altaira task IDs and Jira issue IDs are related through provisioning resources rather
than by mirroring two complete task systems.

## Configuration gates

The following capabilities remain off unless all required server-side values exist:

- S3 direct storage: `AWS_S3_ENABLED=true` plus region/private bucket and IAM credentials.
- Resend: `CONTACT_EMAIL_PROVIDER=resend`, enabled flag and API key.
- Stripe: test secret and webhook secret; live mode remains separately blocked.
- GitHub: provider execution flag plus GitHub App configuration.
- Jira: provider execution flag plus project-scoped credentials.

Feature flags must fail closed. A missing credential must produce a safe operational
error, never a partial resource recorded as completed.

## Validation and evidence

Run before release:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run smoke:security
npm run smoke:client-portal
cd backend && ./mvnw test
cd backend && ./mvnw package -DskipTests
git diff --check
```

Use H2 or explicit test fixtures for destructive/integration tests. Production smoke
tests must create only clearly named test records and clean removable resources.

## Maintenance rules

1. Add business rules to services/decision rules, not controllers or React pages.
2. Add provider APIs behind an adapter and an explicit execution gate.
3. Preserve idempotency and external resource IDs for every provisioning action.
4. Never put secrets, passwords or complete connection strings in Git, reports or logs.
5. Delete code only after reference search, build and route smoke validation.
6. Prefer focused documentation for important boundaries over comments on trivial code.
7. Split the largest UI/service modules when changing them, not as an unrelated rewrite.

## Known future work

- real Google Drive and calendar provisioning;
- advanced team roles beyond the current admin/client foundation;
- scheduled task reminders and full calendar synchronization;
- production activation of guarded providers after operational approval;
- advanced storage lifecycle/retention policies;
- staged decomposition of the largest admin and client portal components.
