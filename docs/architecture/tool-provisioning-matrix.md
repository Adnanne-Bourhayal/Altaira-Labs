# Tool provisioning matrix

This matrix separates internal preparation from externally confirmed automation.

Production now contains the additive commercial audit tables. That schema readiness
does not enable any provider: all provider adapters remain dry-run or blocked by
default, and external resource creation still requires a separate reviewed release.

| Tool | Intended resource | Current level | Secret/permission needed | Manual decision still required |
| --- | --- | --- | --- | --- |
| Jira | Project tasks by service track | Dry-run actions | Jira account/API token or OAuth; project issue permissions | Reuse one Altaira project vs one project per client; issue visibility |
| Google Drive | Client folder tree | Dry-run actions | Scoped OAuth/service account and target shared drive | Folder ownership, client sharing and retention |
| Google Calendar | Kickoff event | Dry-run action | Calendar OAuth and event-write scope | Calendar owner, attendees, timezone and reminders |
| GitHub | Repository/project item from approved plan | Blocked or dry-run | Installed GitHub App with repository metadata/content permissions | Repository ownership, visibility, template and branch policy |
| Stripe | One-time Checkout session | Implemented in test/mock | Backend `sk_test_` key and webhook secret | Approved amount and final commercial acceptance |
| Resend | Payment, plan and invitation emails | Implemented; skipped safely when disabled | Backend API key and verified sender | Sender/domain readiness and recipient approval for tests |
| Neon | Client data environment | Shared-DB proposal persisted as dry-run | Scoped Neon API key | Shared DB, schema-per-client or isolated project; budget gate |
| Vercel | Frontend project/deployment | Preview-first proposal persisted as dry-run | Team token/OAuth and repository access | Hosting tier, domain and environment ownership |
| Render | Backend/service | Service proposal persisted as dry-run | Owner API key and repository access | Service tier, region, secrets and health policy |
| Figma | Design project/file | Manual | Team membership or OAuth if later automated | File template, ownership and client access |
| Make/n8n | Workflow/scenario | Not executed | Platform credentials and connection references | Provider choice, per-client cost and approval policy |

## Internal source of truth

- The approved `ProvisioningPlan` defines tracks and proposed resources.
- `CommercialFlow` owns payment and activation state.
- `ProvisioningRun` is the execution attempt.
- `ProvisioningStep` is the auditable provider action.
- `ProvisioningRequest` is the credential-free command sent to a registered provider.
- `ProvisioningResult` is the typed provider outcome persisted into the step.
- An external resource is considered created only after its provider returns and the system stores a real ID/URL.

## Required controls before any real adapter

1. Backend-only least-privilege credential.
2. Explicit provider-specific enable flag; disabled by default.
3. Dry-run preview of the exact action.
4. Idempotency key plus lookup before creation.
5. Provider response validation and external ID/URL persistence.
6. Safe error without tokens or connection strings.
7. Retry and manual-completion policy.
8. Rate, quota and cost guard.
9. Integration test against a disposable/test workspace.
10. Separate production authorization.

The current commercial flow satisfies the internal audit model but deliberately stops before provider writes.
