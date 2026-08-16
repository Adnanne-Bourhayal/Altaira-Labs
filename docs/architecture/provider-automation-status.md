# Provider automation status

## Current state

Post-payment provisioning is an auditable dry-run. It creates internal `ProvisioningRun` and `ProvisioningStep` rows only. It does not call provider APIs.

The commercial production schema is ready, but the application/provider release gate
remains closed. Local acceptance uses H2 plus HTTP stubs and confirms that no provider
receives a request and no external ID/URL is persisted.

The execution boundary is explicit:

```text
ProvisioningRequest
  -> ProvisioningProviderRegistry
  -> provider-specific ProvisioningProvider
  -> ProvisioningResult
  -> persisted ProvisioningStep
```

`ProvisioningResult` is the only object allowed to populate step status, safe error,
manual-action requirement and any future external ID/URL. The current providers return
only `DRY_RUN` or `BLOCKED`; no adapter returns an external identity.

| Provider | Current behavior | External write | Activation requirement |
| --- | --- | --- | --- |
| Jira | Generates track tasks as `DRY_RUN`; an admin-only idempotent issue boundary is implemented behind three closed gates | No live write executed in validation | Reviewed target project, API token/OAuth, explicit flags and one controlled sandbox rehearsal |
| Google Drive | Generates six standard folder actions as `DRY_RUN` | No | OAuth/service account, shared-drive policy, scoped folder adapter and explicit provider flag |
| Google Calendar | Generates a kickoff-event action as `DRY_RUN` | No | OAuth calendar grant, timezone/attendee policy and explicit provider flag |
| GitHub | Dry-run plan plus an admin-only, idempotent private-repository execution boundary protected by three disabled-by-default gates | No live write executed in validation | Installed GitHub App with repository permission, reviewed organization scope and explicit activation approval |
| Neon | Records a shared-database strategy and escalation policy as `DRY_RUN` when selected | No | Approved tenancy strategy, scoped Neon API key, quota controls and separate execution adapter |
| Vercel | Records a preview-first project proposal as `DRY_RUN` when selected | No | Team token/OAuth, repository linkage policy, environment-secret workflow and cost gate |
| Render | Records a service proposal with a mandatory cost review as `DRY_RUN` when selected | No | Owner API key, blueprint/service policy, environment-secret workflow and cost gate |
| Stripe | Test Checkout can be created; signed webhooks are processed | Test API only | `sk_test_` key, test webhook secret and explicit test mode |
| Resend | Commercial and invitation emails can be sent over HTTPS | Email only | API key, verified sender/from address and enabled email flags |

## Generated dry-run payloads

Jira task names are derived from active tracks:

- Web: Discovery, Copy and structure, Design, Development, Review, Launch.
- Booking: Requirements, Calendar rules, Reminder setup, Booking test.
- CRM: Pipeline, Lead stages, Import, Workspace review, Handover.
- Automation: Trigger map, Action map, Test, Monitoring.
- Dashboard: KPI definitions, Data sources, Layout, Validation.

Drive prepares this hierarchy:

- `00_Admin`
- `01_Discovery`
- `02_Assets`
- `03_Deliverables`
- `04_Approvals`
- `05_Invoices`

These names are recorded as proposed actions, not external resources.

Every step also stores a redacted structured summary with the plan, client and
workspace IDs, target name, provider policy, `dryRun=true` and
`externalWrite=false`. Jira summaries include track, task, labels and project
policy; Drive includes root/folder and sharing policy; Calendar includes title,
timezone and duration; GitHub, Neon, Vercel and Render include their reviewed
resource/deployment policy. Email, phone, token, password and secret values are not
included. The admin provisioning accordion shows the human-readable target while
keeping the full JSON out of the primary interface.

## Status meaning

- `DRY_RUN`: payload prepared and persisted; provider was not called.
- `BLOCKED`: configuration or permission is missing; manual action is required.
- `FAILED`: an attempted internal step failed with a safe error.
- `COMPLETED`: reserved for a confirmed step result. It is not used to imply an external resource exists without provider confirmation.

## Activation policy

Each real provider needs its own adapter, least-privilege credential, feature flag, idempotency lookup and integration test. A provider should be enabled one at a time after review. Payment confirmation must not silently grant permission to create chargeable infrastructure.

## GitHub repository execution boundary

The first write-capable provider adapter is connected only to an explicit admin endpoint:

```text
POST /api/v1/provisioning-plans/{planId}/providers/github/repository
```

The endpoint can create or reuse one empty, private repository in the configured
organization only when all three backend gates are true:

- `GITHUB_APP_ENABLED=true`;
- `GITHUB_PROVISIONING_ENABLED=true`;
- `GITHUB_DRY_RUN=false`.

The current defaults keep those gates closed. `Confirm and provision` remains disabled,
the Stripe/payment flow still creates dry-run rows only, and no payment webhook invokes
this endpoint. The admin request must include the exact confirmation value
`CONFIRM_PRIVATE_REPOSITORY`. The backend derives the repository name from the activated
client and workspace; callers cannot supply an arbitrary organization or repository name.

Before the provider is called, the backend verifies that:

- admin authentication succeeded;
- the GitHub App, provisioning and live-write flags allow execution;
- GitHub App credentials are complete;
- the provisioning plan is approved;
- payment, client and workspace are active;
- the approved plan actually includes GitHub.

Each live attempt uses a plan-scoped idempotency key and a pessimistic plan lock. Its
`ProvisioningRun`, `ProvisioningStep`, attempt count, safe error and confirmed external
resource ID/URL are persisted separately from the automatic commercial dry-run. A
completed step is returned on repeat without another provider call. A failed step can be
retried through the same endpoint and keeps the same audit identity.

Local tests use an in-process HTTP server rather than GitHub. They prove that the
adapter:

- blocks before any network call while dry-run is enabled;
- creates a missing repository as private and without initial content;
- reuses an existing matching private repository;
- handles a concurrent `422` create response by looking up and reusing the repository;
- refuses to reuse a public or mismatched repository.
- rejects the execution endpoint without admin authentication;
- rejects live execution while the default dry-run gate is active;
- requires the exact confirmation phrase before reading or writing plan data;
- persists safe failures and increments attempts on controlled retry;
- returns a completed result idempotently without a second GitHub call.

No GitHub token, installation token, repository ID or live provider URL was used or
persisted during these tests. The next release gate is a single controlled sandbox
repository rehearsal with a least-privilege GitHub App. Production flags must remain
closed until that rehearsal, repository cleanup and audit review pass.

## Jira issue execution boundary

Jira uses a separate explicit admin endpoint:

```text
POST /api/v1/provisioning-plans/{planId}/providers/jira/issues
```

It is deliberately narrower than full Jira project provisioning. It reuses the project
identified by `JIRA_PROJECT_KEY` and creates only the task rows already present in the
approved commercial dry-run. It does not create a Jira project, board, sprint, user,
component or billing-bearing resource. The request requires the exact confirmation
`CONFIRM_JIRA_ISSUES`, while all three write gates must be set deliberately:

- `JIRA_INTEGRATION_ENABLED=true`;
- `JIRA_PROVISIONING_ENABLED=true`;
- `JIRA_DRY_RUN=false`.

Before a Jira request can leave the backend, admin authentication, plan approval,
confirmed payment, active client, active workspace, a retained dry-run and the
configured project key are all verified. The caller cannot submit arbitrary issue
content or a different Jira project: issue summaries, tracks and descriptions are
derived server-side from the persisted approved plan.

Each source task receives a plan-and-step-scoped label. The adapter searches this label
before creating an issue, rejects ambiguous duplicate matches and stores the confirmed
issue key and URL in `provisioning_external_resources`. A pessimistic plan lock prevents
concurrent executions in this application. Completed tasks are skipped on repeat;
failed tasks retain a safe error and attempt count and can be retried without recreating
successful issues. One failed issue does not prevent independent tasks from being
attempted, and the live run is marked `PARTIALLY_COMPLETED` when appropriate.

Local validation uses H2, Mockito and an in-process HTTP stub. It covers default-gate
blocking before persistence or networking, admin protection, exact confirmation,
Atlassian Document Format payloads, idempotent reuse, ambiguous-match rejection,
safe error redaction and controlled retry. No Atlassian credential or live API was used.
