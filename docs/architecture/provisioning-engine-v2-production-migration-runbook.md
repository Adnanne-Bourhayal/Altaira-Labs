# Provisioning Engine v2: production migration runbook

## Status

**PRODUCTION SCHEMA V2 VERIFIED. NO MIGRATION IS CURRENTLY REQUIRED.**

This document is an operational plan. Production metadata and schema were queried
again under an explicit read-only authorization on 2026-07-22 at 21:13 UTC. That
authorization did not cover migration, deployment, provider execution, data writes,
or Git operations.

Current guarantees:

- the latest precheck executed no production write or migration SQL;
- the production schema already contains the complete Provisioning Engine v2 schema;
- all provisioning tables are currently empty and contain no external identities;
- provider execution remains disabled and dry-run by default;
- API responses hard-code `executionAllowed=false`;
- `Confirm and provision` remains disabled in the admin UI;
- the latest SQL transaction enforced `transaction_read_only=on` and ended with
  `ROLLBACK`.

## Objective and scope

Add the persistence required by the lead assessment and Provisioning Engine, then add
the two v2 visibility fields used by track-based plans:

- `lead_assessments`;
- `provisioning_plans` and its four child tables;
- `provisioning_plans.tracks_json`;
- `provisioning_plans.shared_resources_json`.

The change is additive. It does not authorize generating production plans, executing
providers, enabling GitHub/Jira/Drive/Vercel/Render/Neon/Stripe, or inviting clients.

## Reviewed artifacts

Checksums must match immediately before the maintenance window.

| Order | Migration | SHA-256 |
| --- | --- | --- |
| 1 | `backend/database/lead-intake-conversion-migration.sql` | `dfa542cef10901e90bace92cd5303919778e1c6b24181b4c7aada2a6581dd93e` |
| 2 | `backend/database/provisioning-engine-migration.sql` | `bb40bfe9eaffa83aed6c485c1a08d62fa2ef9fea9505a5ece44b4a3a06276843` |
| 3 | `backend/database/provisioning-engine-v2-visibility-migration.sql` | `6e4828347f4206326d33373421f2de7e3ca529e09249c2f5da867c94eb93fd71` |

Supporting read-only artifacts:

- `backend/database/checks/provisioning-engine-v2-production-precheck.sql`;
- `backend/database/checks/provisioning-engine-v2-production-postcheck.sql`;
- `scripts/prepare-provisioning-v2-production-checks.sh`;
- `scripts/check-provisioning-v2-production-readiness.sh`;
- `scripts/test-provisioning-v2-production-readiness-guards.sh`.

The helper scripts contain no migration command. Their default mode is local-only.

## Known production state

The latest authorized production precheck completed at `2026-07-22 21:13:35 UTC` and
selected one unambiguous path: **apply no migration**.

Redacted target evidence:

| Metadata | Read-only result |
| --- | --- |
| Neon project | `ne***` / `littl...8968` |
| Production branch | `pr***` / `br-tw...jkab` |
| Branch primary | `true` |
| Production endpoint | `ep-od...je74` |
| Production host | `ep-od...je74.neon.tech` |
| Database / schema | `neondb` / `public` |
| PostgreSQL | `17.10` |
| SQL transaction read-only | `on` |
| Datasource host belongs to verified branch | `true` |
| Neon control-plane methods | GET only |

Schema evidence:

- `public.leads` exists with `id uuid NOT NULL`;
- `gen_random_uuid()` is available;
- current `leads` row count: **8**;
- `lead_assessments`: present, row count **0**;
- `provisioning_plans`: present, row count **0**;
- `provisioning_plan_items`: present, row count **0**;
- `provisioning_selected_tools`: present, row count **0**;
- `provisioning_manual_steps`: present, row count **0**;
- `provisioning_external_resources`: present, row count **0**;
- `tracks_json`: present as `text NOT NULL DEFAULT '[]'`;
- `shared_resources_json`: present as `text NOT NULL DEFAULT '[]'`;
- external resource rows with a real provider ID or URL: **0**;
- target-schema fingerprint: `c8ffca1406a7b532fce208875ef36af2`.

The transaction ended with `ROLLBACK`. No rows, tables, columns, constraints or
configuration were changed.

### Lead cleanup evidence

The production cleanup started with **52** lead rows. Before deletion, a private
JSONL export containing all 52 rows was written outside the repository with owner-only
permissions. A separate owner-only ID manifest classified **45** rows as unambiguous
test/demo submissions. Those 45 rows were deleted in one guarded transaction and one
controlled `Altaira Test Lead` was inserted for future smoke checks.

Seven source rows were not deleted because their test status was not unambiguous.
Production therefore contains **8** rows: seven conservatively retained leads plus
the controlled test lead. This intentionally follows the requirement not to delete
possibly real or doubtful submissions merely to reach a target count.

Private recovery artifacts:

- `/Volumes/T7/Altaira_Labs/backups/private/production-leads-before-cleanup-20260722.jsonl`;
- `/Volumes/T7/Altaira_Labs/backups/private/production-leads-clear-tests-20260722.ids`;
- `/Volumes/T7/Altaira_Labs/backups/private/production-leads-cleanup-20260722.sql`.

Do not commit these artifacts. They may contain production data and must remain
owner-readable only.

The decision matrix used was:

| Precheck result | Authorized migration path |
| --- | --- |
| All six tables absent | Apply migrations 1, 2, 3 |
| `lead_assessments` exactly matches migration 1; other five absent | Apply 2, 3 |
| All six v1 tables exactly match; both v2 columns absent | Apply 3 |
| All six tables and both v2 columns exactly match | Apply nothing; run postcheck |
| Any partial, extra, incompatible, or ambiguous definition | **Abort and review manually** |

Production now matches the fourth row: **apply nothing**. Reapplying the migration
chain provides no benefit and is not authorized by this runbook state. Use the
read-only postcheck if another verification pass is required.

`CREATE TABLE IF NOT EXISTS` is not a schema repair mechanism. Never use it to accept
an existing table whose columns, constraints, or types differ from the reviewed SQL.

## Current risks and next write gate

- A verified recovery branch exists from the prior schema rehearsal/migration window,
  but any new production write should create a fresh restore point immediately before
  that new operation.
- No schema write is justified by the current result. Treat an attempted migration as
  an operational error unless a later read-only precheck proves schema drift.
- `tracks_json` and `shared_resources_json` are `text`, so PostgreSQL does not enforce
  JSON validity. Runtime serialization is tested, but a future `jsonb` hardening change
  should be assessed separately.
- Database migration and application deployment remain separate release gates. A
  schema PASS does not authorize or prove the later deployment.
- The production state may change before a future application-data write or deploy,
  so the relevant read-only precheck and a fresh restore point remain mandatory.
- The local rehearsal API-key line contains trailing whitespace. The verified helper
  path normalizes it, but raw manual reuse can return HTTP 401; never log or copy the
  key while correcting this later.

## Roles and prerequisites

Required people:

- migration operator with controlled Neon database access;
- release owner able to stop the operation;
- application owner available for postcheck and smoke validation.

Required technical conditions:

- exact release commit/branch recorded;
- clean local build of that exact source;
- `psql` available;
- a dedicated database credential supplied outside the repository;
- Neon target host independently verified in the Console;
- `public.leads` exists and `leads.id` is `uuid`;
- `gen_random_uuid()` is available;
- `SPRING_JPA_HIBERNATE_DDL_AUTO=none` remains set for Render;
- a verified restore point/recovery branch exists before writes;
- providers and confirmation action pass the local lock checks.

No new Render or Vercel variable is required by the schema migration. The optional
readiness helper uses a local, temporary config outside Git and never belongs in
Render or Vercel.

## Maintenance window

Recommended operator window: **30 to 45 minutes during low traffic**, followed by at
least **30 to 60 minutes of observation**. These are Altaira operating estimates, not
Neon service guarantees.

Pause the operation if a release, incident, data import, or administrative batch is
running. The v2 `ALTER TABLE` needs a PostgreSQL table lock, so use a short lock timeout
and do not wait indefinitely behind production traffic.

## Backup and recovery gate

Before any write:

1. Open Neon Console and independently identify the production project, branch and
   endpoint. Record only redacted identifiers in the change record.
2. Record the UTC start time and PostgreSQL WAL position:

   ```sql
   SELECT clock_timestamp() AS restore_reference_time,
          pg_current_wal_lsn() AS restore_reference_lsn;
   ```

3. Create or verify a recovery branch/restore point covering that timestamp.
4. Confirm the project's actual history-retention window in Neon Console.
5. Prove the recovery branch can be connected to and queried without modifying the
   production branch.
6. Record the person authorized to choose restore versus forward fix.

Neon supports branch-based development and point-in-time restore workflows, but the
available history depends on the project configuration. References:

- [Neon branching workflow](https://neon.com/docs/get-started-with-neon/workflow-primer)
- [Neon restore branch API](https://api-docs.neon.tech/reference/restoreprojectbranch)

If any backup or restore fact is uncertain, **abort before migration**.

## Local readiness gate

Run from the repository root:

```bash
./scripts/test-provisioning-v2-production-readiness-guards.sh
./scripts/check-provisioning-v2-production-readiness.sh
```

Expected result:

- reviewed checksums pass;
- pre/post SQL is read-only;
- provider defaults are disabled/dry-run;
- `executionAllowed=false` is present;
- the UI action is disabled;
- output says `PRODUCTION DATABASE STATE: UNKNOWN`;
- no database connection occurs.

## Completed read-only production precheck

The precheck described below was authorized and completed on 2026-07-22. Keep these
instructions for the mandatory recheck immediately before a future write window.

Create a temporary config outside the repository with file mode `600`:

```properties
SPRING_DATASOURCE_URL=<JDBC URL without embedded password; sslmode=require>
SPRING_DATASOURCE_USERNAME=<dedicated operator or read-only role>
SPRING_DATASOURCE_PASSWORD=<secret>
ALTAIRA_EXPECTED_PRODUCTION_HOST=<host copied independently from Neon Console>
ALTAIRA_PRODUCTION_READ_ONLY_CONFIRMATION=I_CONFIRM_READ_ONLY_PRODUCTION_PREFLIGHT
```

Then explicitly remove inherited datasource variables and run:

```bash
env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
  ALTAIRA_PRODUCTION_READINESS_ENV=/absolute/path/outside/repo/readiness.env \
  ./scripts/check-provisioning-v2-production-readiness.sh \
  --database-read-only-precheck
```

The helper enforces both `default_transaction_read_only=on` and `BEGIN TRANSACTION
READ ONLY`. It rejects embedded credentials, non-Neon hosts, host mismatch, missing
TLS, config files inside the repository, and inherited datasource variables.

Store the precheck output in the private change record, not in Git. Review:

- database/schema identity and `transaction_read_only=on`;
- `leads` and UUID prerequisites;
- exact table presence;
- full existing column inventory;
- row counts;
- schema fingerprint;
- v2 column presence and null counts;
- external identity count.

The latest completed precheck matched the no-migration path. Re-run it before any
future schema maintenance window; abort if the result no longer matches the evidence
above.

## Future migration execution

This subsection is intentionally manual and requires a new explicit authorization.
There is no executable production migration wrapper in the repository.

### Session safety

Supply `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, and
`PGSSLMODE=require` through a protected operator shell or secret manager. Never put a
password or full connection string in the command line, terminal history, report, or
Git.

Before writes, confirm the target again:

```bash
psql -X -v ON_ERROR_STOP=1 -c \
  "SELECT current_database(), current_user, inet_server_addr(), clock_timestamp();"
```

Compare the result with the approved change record. A mismatch means **abort**.

### Exact order

For the full-chain path only:

```bash
PGOPTIONS="-c lock_timeout=5000 -c statement_timeout=120000" \
  psql -X -v ON_ERROR_STOP=1 --single-transaction \
  -f backend/database/lead-intake-conversion-migration.sql

PGOPTIONS="-c lock_timeout=5000 -c statement_timeout=120000" \
  psql -X -v ON_ERROR_STOP=1 --single-transaction \
  -f backend/database/provisioning-engine-migration.sql

PGOPTIONS="-c lock_timeout=5000 -c statement_timeout=120000" \
  psql -X -v ON_ERROR_STOP=1 \
  -f backend/database/provisioning-engine-v2-visibility-migration.sql
```

For a reduced path, omit only the migrations proven already present and exactly
compatible by the approved precheck.

Migration 3 contains its own `BEGIN`/`COMMIT`. Run it once in production. Its second
execution passed in the disposable rehearsal, so repeating it in production adds no
new evidence and is not recommended without a specific reason and authorization.

Never continue to the next file after a non-zero exit, timeout, warning suggesting a
schema mismatch, or loss of operator certainty.

## Postcheck

Run immediately after the final migration, using the same independently verified
target and temporary config:

```bash
env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
  ALTAIRA_PRODUCTION_READINESS_ENV=/absolute/path/outside/repo/readiness.env \
  ./scripts/check-provisioning-v2-production-readiness.sh \
  --database-read-only-postcheck
```

Required results:

- six required tables: `PASS`;
- all required columns: `PASS`;
- `tracks_json`: `text`, `NOT NULL`, default `'[]'::text`;
- `shared_resources_json`: `text`, `NOT NULL`, default `'[]'::text`;
- pre-existing row counts have not decreased;
- legacy rows, if any, read both fields as `[]`;
- `tracks_json` and `shared_resources_json` null counts are `0`;
- non-dry-run plan count is `0` at this release gate;
- external resource rows with real IDs or URLs are `0`;
- expected constraints and indexes exist;
- no existing non-Provisioning table or column changed.

The precheck and postcheck schema fingerprints are expected to differ only because of
the authorized tables/columns. Keep both outputs for review.

## Application validation

Before a later deployment of the exact reviewed source:

```bash
cd backend
./mvnw test
./mvnw package -DskipTests

cd ..
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

The database migration and application deployment are separate change gates. Applying
the schema does not authorize deploying the application.

## Permitted production smoke tests

After a separately authorized deployment, permit only non-mutating checks first:

```bash
curl -fsS https://altaira-labs-1.onrender.com/api/v1/health
curl -fsS https://altaira-labs-1.onrender.com/actuator/health
```

Then, using normal admin authentication without printing tokens:

- open one existing lead detail;
- read its provisioning-plan list;
- if a pre-existing fictional dry-run plan exists, read its detail;
- verify `dryRun=true` and `executionAllowed=false`;
- verify the admin button remains disabled.

Do not use `POST /leads/{leadId}/provisioning-plans/dry-run` as the first production
smoke test. It writes data and needs separate approval plus a clearly fictional lead.
Do not call any provider endpoint.

## Success criteria

The migration is successful only when all of these are true:

- restore gate completed and recorded;
- every executed migration exits zero;
- postcheck passes every required table/column definition;
- row-count comparison shows no loss;
- v1 rows remain readable with empty v2 arrays;
- no non-dry-run plans appear;
- no real external provider identity appears;
- providers remain disabled/dry-run;
- `executionAllowed=false` remains enforced;
- `Confirm and provision` remains locked;
- later application health and read-only smoke tests pass.

## Abort criteria

Abort immediately if any of the following occurs:

- production host/branch/endpoint cannot be independently identified;
- restore point or retention window is unverified;
- checksum differs;
- precheck shows a partial or incompatible schema;
- `leads.id` is not UUID or `gen_random_uuid()` is unavailable;
- lock or statement timeout occurs;
- any migration exits non-zero;
- row count decreases or unexpected data changes;
- any v2 column is nullable, lacks the expected default, or contains nulls;
- a non-dry-run plan or real external provider ID/URL appears unexpectedly;
- provider defaults or UI lock checks fail;
- concurrent deployment or operational incident begins;
- secrets appear in output or repository files.

Do not improvise schema repair while the maintenance window is active.

## Rollback and forward-fix policy

The migrations are additive, so the preferred response is:

1. **Before commit:** rely on transaction rollback and stop.
2. **After schema commit, application not deployed:** leave compatible additive schema
   in place, investigate, and forward-fix under a new approval.
3. **After deployment failure:** redeploy the previously known-good application first;
   do not drop tables or columns automatically.
4. **Confirmed data/schema incident:** create and validate a recovery branch from the
   recorded restore point, compare data, then use Neon's approved restore workflow
   only with owner authorization.

No `DROP TABLE`, `DROP COLUMN`, data deletion, branch reset, or production restore is
pre-authorized by this runbook. Those actions require a separate incident decision.

## Monitoring after change

During the observation window monitor:

- Render startup and application error logs;
- `/api/v1/health` and `/actuator/health`;
- HTTP 5xx rate for admin and lead endpoints;
- PostgreSQL connection, lock, constraint and missing-relation errors;
- Neon compute and connection usage;
- unexpected writes to provisioning tables;
- any provider-related log entry;
- admin UI visibility of dry-run and locked confirmation state.

Capture only timestamps, status codes, counts and redacted identifiers. Never copy
tokens, passwords, JDBC URLs or customer payloads into the change record.

## Provider and execution locks

These controls are release gates, not optional notes:

- `GITHUB_PROVISIONING_ENABLED` defaults to `false`;
- `GITHUB_DRY_RUN` defaults to `true`;
- the response mapper emits `executionAllowed=false`;
- the UI renders `Confirm and provision` disabled;
- there is no provider execution route in `ProvisioningPlanController`.

If any control changes before migration, recalculate checksums where appropriate,
repeat the rehearsal and obtain new approval.

## Executed production change (2026-07-23)

Provisioning Engine v2 already matched the reviewed production schema, so none of its
migrations were repeated.

The replacement Neon API key was normalized locally without printing it. Guarded
control-plane checks then verified project `littl...8968`, primary branch
`br-tw...jkab` and the expected production endpoint.

Two retained direct-child recovery branches protect the data operations:

- `recovery/commercial-flow-20260723T1608Z` captures the eight-lead state before
  cleanup;
- `recovery/commercial-migration-20260723T1618Z` captures the seven-lead state
  immediately before schema migration.

Both branches were verified as non-primary, with endpoints different from production.
The second recovery snapshot matched production table counts and dependencies exactly.

The production precheck ran with `transaction_read_only=on` and proved that the six
commercial tables were absent. The additive
`backend/database/commercial-payment-provisioning-migration.sql` then ran atomically.
The immediate read-only postcheck proved:

- all six required tables exist;
- every required column exists;
- all new tables contain zero rows;
- non-dry-run provisioning runs equal zero;
- rows containing external provider identity equal zero.

No Provisioning Engine migration, deploy, Stripe request, Resend request, provider
execution, commit or push was part of this database change.

The guarded runner used was
`scripts/apply-commercial-payment-production-migration.sh`. Its default mode is
local-only. Production mode fails closed unless the exact write confirmation is
present, the Neon API verifies the primary endpoint and a distinct child recovery
branch, the recovery snapshot exactly matches production, all dependencies exist and
all six commercial tables remain absent. It applied the migration as one transaction
and immediately invoked the read-only postcheck. It does not create/delete branches,
deploy code or execute providers.

Validate the runner without network or database access:

```bash
./scripts/test-commercial-payment-production-migration-guards.sh
./scripts/apply-commercial-payment-production-migration.sh
```

If a future read-only precheck detects Provisioning Engine schema drift, stop and
prepare a new recovery and migration authorization based on that new evidence. Any
application deployment remains a later, separate approval tied to an exact reviewed
commit.

## Preparation validation evidence

Runbook preparation was validated locally on 2026-07-22 without a Neon or production
connection:

- production-readiness guard tests: **PASS**;
- default readiness mode: **PASS**, no `psql` invocation;
- temporary local PostgreSQL 15 precheck: **PASS**;
- full local migration chain plus a second v2 execution: **PASS**;
- temporary local PostgreSQL postcheck: **PASS**;
- backend tests: **140 passed**, zero failures/errors/skips;
- backend package: **PASS**;
- frontend lint, TypeScript and production build: **PASS**;
- static pages generated: **63**;
- `git diff --check`: **PASS**.

Final source hygiene checks also passed: no Git conflict markers, no AppleDouble
metadata in source paths, and no credential-shaped value in the reviewed tree.

`gitleaks`, `trufflehog` and `detect-secrets` were not installed. A lightweight scan
of modified/untracked files found only reviewed false positives: `pre_*` SQL variable
names and two test classes that generate ephemeral RSA keys in memory. No stored key,
credential, token, password or full database URL was found.
