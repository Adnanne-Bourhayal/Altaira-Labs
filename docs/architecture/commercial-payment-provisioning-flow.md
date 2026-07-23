# Commercial payment and provisioning flow

## Purpose

This flow prevents a public lead from becoming an active client before the commercial scope and payment are confirmed.

```text
lead intake
  -> provisioning plan review
  -> approved plan
  -> Stripe test checkout or local mock checkout
  -> verified payment confirmation
  -> client + workspace + service tracks
  -> secure invitation
  -> dry-run provisioning audit
```

The legacy direct-conversion endpoint is rejected by default. It can only be restored temporarily with `ALTAIRA_LEGACY_DIRECT_CONVERSION_ENABLED=true`.

## Intake schema v2

The admin intake now separates information by purpose instead of presenting one long technical form:

- **Core requirements**: the minimum deterministic signals used by the selected service policy;
- **Discovery details**: optional, track-specific architecture signals shown progressively;
- **Commercial fit**: budget band, target timeline and commercial stage;
- **Internal technical review**: sensitive-data flag, scope confirmation and credential-free notes.

New admin submissions send `schemaVersion: 2`. The backend validates required fields, controlled options, numeric ranges and safe value shapes before saving. Nested objects are rejected so credentials cannot be hidden inside an intake payload. Existing schema-v1 assessments remain readable and writable when no upgrade is requested.

The v2 fields refine explainable decisions without authorizing an action. Examples include multiple booking locations selecting custom booking dependencies, high-criticality automation selecting backend/database dependencies, and financial or mixed-audience dashboards requiring authentication. Commercial answers never approve a plan, create a checkout or execute a provider.

## Release gates

1. A provisioning plan must have status `approved`, `provisioned` or `partially_completed` before checkout can be created.
2. Checkout creation never creates a client, workspace or invitation.
3. A signed Stripe webhook, or the explicitly enabled local mock-confirm endpoint, must set payment to `PAYMENT_CONFIRMED`.
4. Post-payment activation reuses existing records and service assignments rather than duplicating them.
5. Provider execution remains a dry-run. No external provider is called by this flow.
6. An active checkout is reused idempotently. A failed or cancelled checkout may be
   replaced by a new idempotent retry session without activating the client.

## Persisted records

The additive migration `backend/database/commercial-payment-provisioning-migration.sql` prepares:

- `commercial_flows`: one commercial state machine per provisioning plan;
- `commercial_payment_sessions`: idempotent Stripe/mock checkout sessions;
- `commercial_payment_events`: unique Stripe event IDs and safe processing status;
- `commercial_email_logs`: generated, sent, skipped or failed commercial email records;
- `provisioning_runs`: one idempotent post-payment run per plan;
- `provisioning_steps`: provider, action, track, status, safe error and manual-action flag.

Provider secrets are never stored in these tables. The migration was applied to
production on `2026-07-23` through the guarded runner after a fresh verified Neon
recovery branch was created. The atomic migration and read-only postcheck both passed.

The migration was also applied twice to a disposable loopback-only PostgreSQL 15 cluster using fictional records. All six tables, foreign keys, dry-run records and empty external identities round-tripped successfully, and the cluster was deleted afterwards. Re-run with `env -u DATABASE_URL -u SPRING_DATASOURCE_URL ./scripts/rehearse-commercial-payment-postgres.sh`.

## Production schema precheck

The explicitly authorized production precheck completed on `2026-07-23 11:45:10 UTC`
and was repeated after replacing and validating the Neon API key at
`2026-07-23 13:28:03 UTC`.
It used the production endpoint previously verified through the Neon API:

- project: `ne***` / `littl...8968`;
- primary branch: `pr***` / `br-tw...jkab`;
- endpoint: `ep-od...je74`;
- database/schema: `neondb/public`;
- PostgreSQL: `17.10`;
- `transaction_read_only`: `on`;
- final command: `ROLLBACK`.

The current datasource host exactly matched that independently verified endpoint.
The replacement Neon API key initially returned `401` because its local environment
value contained one leading space. The value was normalized without printing it, then
verified successfully through GET-only project, branch and endpoint requests at
`2026-07-23 13:21:39 UTC`. The API confirms the configured branch is primary and owns
the production endpoint. No SQL or control-plane write was executed by that check.

Production dependency counts observed in the pre-migration read-only transaction:

| Table | Rows |
| --- | ---: |
| `leads` | 8 |
| `clients` | 20 |
| `client_services` | 19 |
| `client_workspaces` | 18 |
| `provisioning_plans` | 0 |

At precheck time, all six commercial tables were absent:

- `commercial_flows`;
- `commercial_payment_sessions`;
- `commercial_payment_events`;
- `commercial_email_logs`;
- `provisioning_runs`;
- `provisioning_steps`.

The precheck therefore established that production required **only**
`backend/database/commercial-payment-provisioning-migration.sql`. Provisioning Engine
v2 was already present and was not reapplied. No migration or production write was
executed by the precheck. The retained mode-`600` evidence is:

`/Volumes/T7/Altaira_Labs/backups/private/commercial-production-precheck-20260723.log`

The repeated read-only evidence is:

`/Volumes/T7/Altaira_Labs/backups/private/commercial-production-precheck-20260723-recheck.log`

Both checks observed the same dependency counts and absent commercial tables. Both
sessions enforced `transaction_read_only=on`, ended with `ROLLBACK`, and executed no
DDL or data mutation.

### Runtime isolation incident and follow-up

Before local-runtime isolation was added, one backend startup inherited the production
datasource through an absolute secret import. The process was stopped immediately after
it created the configured demo administrator. A subsequent read-only audit found:

- one accidental `admin-test` administrator created at `2026-07-23 13:36:00 UTC`;
- one associated `user_created` security event;
- no lead mutation and no schema mutation attributable to that startup.

The record remains in production because deleting it is a production write and requires
separate, record-specific authorization. It must not be treated as a legitimate
production administrator.

The unsafe implicit import was removed. `application.properties` now imports only the
optional file selected by `ALTAIRA_SECRETS_FILE`, defaulting to repository-local
`./.env`. Local execution uses `scripts/run-backend-local-h2.sh`, which starts the JVM
with an `env -i` allowlist, an in-memory H2 datasource, mock Stripe confirmation, and
all external email/provider flags disabled. `LocalRuntimeIsolationTests` prevents the
absolute production import and non-H2 test datasource from returning.

The following artifacts implement the guarded check and contain no migration command:

- `backend/database/checks/commercial-payment-production-precheck.sql`;
- `backend/database/checks/commercial-payment-production-postcheck.sql`;
- `scripts/prepare-commercial-payment-production-checks.sh`;
- `scripts/check-commercial-payment-production-readiness.sh`;
- `scripts/test-commercial-payment-production-readiness-guards.sh`.

The default script mode is local-only and never connects to a database:

```bash
./scripts/test-commercial-payment-production-readiness-guards.sh
./scripts/check-commercial-payment-production-readiness.sh
```

The SQL was also exercised against the disposable loopback PostgreSQL rehearsal with
the commercial tables first absent and then present. Both read-only paths completed
successfully, and the temporary cluster was deleted. To repeat the production read
under a new authorization, create a mode-`600` config outside the repository, use the
independently verified production host, remove inherited datasource variables and run:

```bash
env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
  ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV=/absolute/path/outside/repo/readiness.env \
  ./scripts/check-commercial-payment-production-readiness.sh \
  --database-read-only-precheck
```

Required config keys are `SPRING_DATASOURCE_URL`,
`SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`,
`ALTAIRA_EXPECTED_PRODUCTION_HOST` and the exact confirmation
`ALTAIRA_COMMERCIAL_PRODUCTION_READ_ONLY_CONFIRMATION=I_CONFIRM_READ_ONLY_COMMERCIAL_PRODUCTION_PREFLIGHT`.
The helper rejects inherited URLs, credentials embedded in the URL, non-Neon or
mismatched hosts, missing TLS and config files inside Git. PostgreSQL also enforces
`default_transaction_read_only=on`; the SQL starts with `BEGIN TRANSACTION READ ONLY`
and ends with `ROLLBACK`.

### Applied production migration

The authorized write was completed on `2026-07-23` with the exact reviewed SQL and
checksum. Immediately before it, the retained direct-child recovery branch
`recovery/commercial-migration-20260723T1618Z` was verified as non-primary and as a
snapshot of the production branch. Its IDs and endpoint are retained only in redacted
evidence.

The guarded runner applied the migration once in a single transaction and then ran the
read-only postcheck. The result was:

- all six commercial tables exist;
- required columns, foreign keys and defaults passed the postcheck;
- all six commercial tables contain `0` rows;
- non-dry-run provisioning runs: `0`;
- commercial/provider rows with external IDs or URLs: `0`;
- existing provisioning-v2 schema and existing application data remained intact;
- no application deploy, Stripe request, Resend request or provider API call occurred.

Lead cleanup was deliberately conservative. Production contained `8` leads at review
time. One unambiguous non-controlled test record was exported and removed after
confirming that it had no assessment, plan or client dependency. Six ambiguous records
were retained, as was the controlled `Altaira Test Lead`. Production therefore contains
`7` lead rows after cleanup. The full pre-cleanup CSV backup is stored outside Git with
mode `600` at
`/Users/adnannnebourhayal/.codex/private-backups/altaira-production-20260723T1615Z/leads-before-cleanup.csv`;
its SHA-256 is
`a9770ba22ea7bcc4783bf3f6a408a0c99f629be97a19cf8ce92f2741598590df`.

The guarded migration runner is
`scripts/apply-commercial-payment-production-migration.sh`. With no argument it is
local-only and does not contact Neon or PostgreSQL. Its production mode:

1. requires the exact write confirmation;
2. rejects inherited datasource variables and repository-local secret files;
3. verifies the production project, primary branch and endpoint through GET-only
   Neon API calls;
4. verifies one named non-primary recovery branch is a direct child of production;
5. compares exact read-only schema and row-count snapshots between recovery and
   production;
6. aborts unless all five dependencies exist and all six commercial tables are
   absent;
7. applies the reviewed checksum in one PostgreSQL transaction;
8. runs the guarded read-only postcheck.

It never creates or deletes a Neon branch and never deploys or invokes a provider.
For a direct child branch, the recovery database, role and password are inherited.
The runner therefore reuses the verified production database credentials when
`NEON_DATABASE_NAME`, `NEON_ROLE_NAME` or `NEON_ROLE_PASSWORD` are omitted from the
control-plane file. This avoids keeping a second copy of the database password.
After creating the approved recovery branch, the authorized command shape is:

```bash
env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
  ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV=/absolute/path/outside/repo/readiness.env \
  ALTAIRA_NEON_RECOVERY_ENV=/absolute/path/outside/repo/neon-control-plane.env \
  ALTAIRA_NEON_RECOVERY_BRANCH_NAME=recovery/commercial-YYYYMMDDTHHMMSSZ \
  ALTAIRA_COMMERCIAL_PRODUCTION_MIGRATION_CONFIRMATION=I_CONFIRM_APPLY_COMMERCIAL_PAYMENT_PRODUCTION_MIGRATION \
  ./scripts/apply-commercial-payment-production-migration.sh --apply-production
```

Before any authorized use:

```bash
./scripts/test-commercial-payment-production-migration-guards.sh
./scripts/apply-commercial-payment-production-migration.sh
```

After any future authorized schema change, the same guarded helper can run the reviewed
postcheck without granting write access:

```bash
env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
  ALTAIRA_COMMERCIAL_PRODUCTION_READINESS_ENV=/absolute/path/outside/repo/readiness.env \
  ./scripts/check-commercial-payment-production-readiness.sh \
  --database-read-only-postcheck
```

## API surface

Admin access is required for all plan routes:

- `GET /api/v1/provisioning-plans/{planId}/commercial-flow`
- `POST /api/v1/provisioning-plans/{planId}/payments/checkout`
- `POST /api/v1/provisioning-plans/{planId}/payments/mock-confirm`
- `POST /api/v1/provisioning-plans/{planId}/commercial-flow/retry`
- `POST /api/v1/provisioning-plans/{planId}/commercial-flow/notifications/retry`

Stripe calls the public webhook route:

- `POST /api/v1/payments/stripe/webhook`

The webhook requires a valid `Stripe-Signature`. Repeated provider event IDs are ignored safely.

## Email sequence

The commercial flow records three Resend email types:

- `PAYMENT_REQUEST`: sent only when Stripe returns a customer checkout URL;
- `PAYMENT_CONFIRMED`: confirms payment and explains that workspace preparation has started;
- `PLAN_SUMMARY`: summarizes the approved route, automation level and scope.

The existing onboarding notification service sends the separate secure client invitation. A failed or disabled email is recorded but does not roll back a confirmed payment or the internal client record. The admin response exposes the redacted delivery audit. Its retry action attempts only eligible emails that do not already have a successful delivery; it does nothing when Resend is still unconfigured and never duplicates a `SENT` event.

## Activation result

After payment confirmation the backend:

1. converts or reuses the source lead as a client;
2. assigns only the approved track service keys;
3. creates or reuses the private client workspace and project tracks;
4. creates one pending invitation and attempts the Resend invitation email;
5. creates one idempotent provisioning run;
6. records provider steps as `DRY_RUN` or `BLOCKED`;
7. marks the plan `provisioned` or `partially_completed`.

If post-payment activation or the invitation fails, payment remains confirmed, a safe activation error is stored, and the admin can use the retry endpoint. Payment is never charged again by a retry.

## Current safety boundary

- Stripe live keys are rejected.
- Mock confirmation is disabled by default.
- No Jira, Drive, Calendar, GitHub, Neon, Vercel or Render write is executed.
- External resource IDs and URLs remain empty in dry-run steps.
- The original provisioning `executionAllowed` flag remains `false`.
- Production application deployment remains a separate gate. The commercial migration
  is already applied and verified.

## Local acceptance proof

`CommercialFlowEndToEndAcceptanceTests.intakeV2ReachesPaidWorkspaceAndAuditedDryRunProvisioning`
proves the connected flow from a schema-v2 intake rather than starting with a
preconstructed plan:

1. saves the fictional `Altaira Test Lead` intake in H2;
2. derives CRM and Web requirements and generates a plan with
   `executionAllowed=false`;
3. approves the plan and creates a mock checkout;
4. proves that no client exists before payment confirmation;
5. confirms the mock payment and creates one client, one workspace, two service
   assignments and two project tracks;
6. creates one secure invitation;
7. persists Jira and Drive provider steps as dry-run records with no external ID or
   URL;
8. sends payment-confirmed, plan-summary and invitation messages only to a local HTTP
   Resend stub.

The test datasource is `jdbc:h2:mem:commercial_acceptance_test`. Stripe, Resend and
provider APIs are not contacted. The payment-request email is intentionally recorded
as skipped because a mock checkout has no customer URL.

## Final local validation

Validation completed on `2026-07-23`:

- backend tests: `143` passed, `0` failures/errors/skips;
- backend package: success;
- frontend ESLint: success;
- TypeScript `--noEmit`: success;
- Next.js production build: success, `63` pages generated;
- migration/rehearsal guard scripts: all fail-closed scenarios passed;
- `git diff --check`: success;
- secret review: no committed `.env`, `.secrets`, private key file, database password,
  Stripe key, Resend key or provider token was found. RSA material used by GitHub tests
  is generated in memory at test runtime.

### Browser acceptance on an isolated runtime

The admin flow was also repeated through the real frontend against a clean backend
started by `scripts/run-backend-local-h2.sh`:

1. the backend listened only on local port `18080`, had no remote network socket, and
   returned health `200`;
2. the unauthenticated leads endpoint returned `401`, while the explicit local-only
   internal token returned `200` and an empty H2 lead list;
3. the admin created a fictional Clinics intake named
   `Altaira Workspace Test Project`;
4. the rules recommended `Web & SEO` and `Automation`;
5. the generated plan contained two tracks, `executionAllowed=false`, and only
   `PREPARE` provider actions;
6. the admin approved the plan and created a `1500.00 EUR` mock payment request;
7. before confirmation the client and workspace remained pending;
8. mock confirmation activated one client, one workspace and two service tracks;
9. the UI displayed `Payment: Confirmed`, `Client: Active`, `Workspace: Active`,
   `Invitation: Failed` and `Provisioning: Blocked`;
10. the invitation failure is expected because email is disabled, and the 21 provider
    steps are blocked/dry-run because all external providers are disabled;
11. the activated client page showed two active services, while the admin workspace
    showed two project tracks and 13 generated onboarding tasks.

No Neon, Stripe, Resend, Jira, Drive, Calendar, GitHub, Vercel or Render request was
made by this runtime. The H2 database is ephemeral and disappears when the process
stops.

## Final local validation

Validation repeated on 2026-07-23:

- commercial production-readiness guard tests: PASS;
- commercial production-migration fail-closed guard tests: PASS;
- commercial production-migration default local-only mode: PASS;
- local-only readiness mode: PASS, with no database connection;
- disposable loopback PostgreSQL migration applied twice: PASS;
- commercial precheck and postcheck SQL: PASS in read-only mode;
- backend tests: 143 passed, zero failures/errors/skips;
- backend package: PASS;
- frontend lint, TypeScript and production build: PASS;
- static pages generated: 63;
- `git diff --check`: PASS;
- no stored provider credential or full PostgreSQL connection URL was found by the
  lightweight credential-pattern scan; the only test value that resembled a Resend
  key was renamed to a deliberately non-credential-shaped fixture.

Production Provisioning Engine v2 was inspected separately in read-only mode and
already contains its reviewed v2 columns. No Provisioning Engine migration was needed.

## Production database evidence (2026-07-23)

The commercial schema migration was applied after a guarded production precheck and
two retained Neon recovery branches:

- source project: `littl...8968`;
- primary branch: `br-tw...jkab`;
- pre-cleanup recovery: `recovery/commercial-flow-20260723T1608Z`;
- migration recovery: `recovery/commercial-migration-20260723T1618Z`;
- both recovery branches are non-primary direct children with endpoints distinct from
  production;
- the migration recovery snapshot matched production immediately before the write:
  `leads=7`, `clients=20`, `client_services=19`,
  `client_workspaces=18`, `provisioning_plans=0`;
- `commercial-payment-provisioning-migration.sql` ran once as a single transaction;
- the read-only postcheck passed all required tables and columns;
- all six new tables had zero rows after migration;
- non-dry-run provisioning runs and external provider identities remained zero.

The lead cleanup was deliberately conservative. Production contained eight leads, not
the historical 52. A private local export and a pre-cleanup Neon recovery branch were
created first. One unequivocal non-controlled test record with no assessment, plan or
client relation was deleted. The controlled `Altaira Test Lead` was retained, and six
ambiguous records were left untouched because they may be legitimate contacts.

This database change did not deploy application code, call Stripe, send Resend mail or
execute any external provisioning provider.
