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
| Jira | Generates track-specific task actions as `DRY_RUN` | No | OAuth/API token, target project policy, idempotent issue adapter and explicit provider flag |
| Google Drive | Generates six standard folder actions as `DRY_RUN` | No | OAuth/service account, shared-drive policy, scoped folder adapter and explicit provider flag |
| Google Calendar | Generates a kickoff-event action as `DRY_RUN` | No | OAuth calendar grant, timezone/attendee policy and explicit provider flag |
| GitHub | Plan items become `BLOCKED` when the GitHub App cannot connect; otherwise remain `DRY_RUN` | No | Installed GitHub App with repository permission, provisioning flag and reviewed organization scope |
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
