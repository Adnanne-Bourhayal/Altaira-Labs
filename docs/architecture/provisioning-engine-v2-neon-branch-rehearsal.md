# Provisioning Engine v2: Neon branch rehearsal

## Result

**PASS on a verified disposable Neon child branch.**

The rehearsal completed on 2026-07-21. It created the missing Provisioning Engine
v1 schema, applied the v2 visibility migration twice, persisted fictional v1 and
v2 plans, and read the v2 plan through a locally started backend using a read-only
database session.

No production database, primary branch, deployment, Git operation, or application
provider was used. `Confirm and provision` remained unavailable.

## Verified target

The script authenticated to Neon, independently identified the endpoint protected
as production, verified its owning parent branch, and then proved that the target
was a different non-primary child with its own direct read-write endpoint.

| Metadata | Verified value |
| --- | --- |
| Project name / ID | `ne***` / `littl...8968` |
| Protected parent branch ID | `br-tw...jkab` |
| Disposable branch | `test/provisioning-v2-20260721` |
| Disposable branch ID | `br-mi...p5uj` |
| Disposable endpoint ID | `ep-tw...2744` |
| Disposable host | `ep-tw...2744.neon.tech` |
| Database / schema | `neondb` / `public` |
| Branch primary | `false` |
| Endpoint equals production | `false` |
| Branch disposition | Retained for evidence review |

The invoking shell had both `DATABASE_URL` and `SPRING_DATASOURCE_URL` unset.
No connection string, role password, or API key was printed or stored in this file.

## Authorized migration chain

The following files were applied only to the disposable branch, in this order:

1. `backend/database/lead-intake-conversion-migration.sql`
2. `backend/database/provisioning-engine-migration.sql`
3. `backend/database/provisioning-engine-v2-visibility-migration.sql`
4. `backend/database/provisioning-engine-v2-visibility-migration.sql` again

The first two migrations were explicitly authorized because the production-derived
branch did not yet contain the Provisioning Engine v1 schema.

## Evidence

### Baseline before writes

- Public base tables: **23**.
- `public.provisioning_plans`: **absent**.
- Provisioning v1 tables: **0 of 6 present**.
- Existing core-table row counts were captured internally but not printed.
- Existing public-schema metadata was fingerprinted without reading row values.

### Provisioning Engine v1

The additive v1 chain created:

- `lead_assessments`
- `provisioning_plans`
- `provisioning_plan_items`
- `provisioning_selected_tools`
- `provisioning_manual_steps`
- `provisioning_external_resources`

After creation, `provisioning_plans` contained **0 rows**. The existing schema
fingerprint and all monitored core-table row counts remained unchanged.

A single fictional v1 dry-run plan was then inserted using reserved rehearsal UUIDs
and an `.invalid` email address. No real client record was used.

Before v2, `provisioning_plans` had these 14 columns:

```text
id, lead_id, assessment_id, route_key, automation_level, automation_scope,
status, dry_run, normalized_requirements_json, decision_reason, risks_json,
cost_estimate, created_at, updated_at
```

### Provisioning Engine v2 and idempotency

The v2 migration succeeded once and succeeded again. PostgreSQL reported the two
columns as already existing during the second execution, confirming the intended
`ADD COLUMN IF NOT EXISTS` behavior.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| `tracks_json` | `text` | No | `'[]'::text` |
| `shared_resources_json` | `text` | No | `'[]'::text` |

Evidence after both executions:

- Exactly the two expected columns were added.
- No pre-existing column was removed, renamed, or changed.
- The plan count remained **1** during migration.
- The checksum of all original v1 plan fields remained unchanged.
- All monitored table counts remained unchanged during v2.
- The fictional v1 plan read `tracks=[]` and `sharedResources=[]`.

### Fictional v2 plan and backend smoke test

A second fictional plan was inserted with:

- `status=draft`
- `dry_run=true`
- one `WEB` track
- one deduplicated `GITHUB` shared-resource decision
- no selected provider execution record
- no external resource ID or URL

Direct PostgreSQL JSON round-trip: **PASS**.

The packaged backend was started locally against only the verified branch with:

- PostgreSQL session defaulted to read-only;
- Hikari read-only enabled;
- Hibernate DDL disabled;
- demo-admin and service-catalog seeders disabled;
- email, onboarding notifications, CRM alerts, S3, and GitHub disabled;
- GitHub provisioning disabled and dry-run forced.

Only these endpoints were called:

```text
GET /api/v1/health
GET /api/v1/provisioning-plans/{fictional-plan-id}
```

Backend response assertions:

- track `WEB`: **PASS**
- shared resource `GITHUB`: **PASS**
- `dryRun=true`: **PASS**
- `executionAllowed=false`: **PASS**
- `status=draft`: **PASS**
- external resources length `0`: **PASS**

Table counts before and after the backend read were identical.

## Safety controls

| Control | Result |
| --- | --- |
| Target is a Neon child branch | PASS |
| Target is non-primary | PASS |
| Endpoint differs from production | PASS |
| Inherited datasource variables absent | PASS |
| Existing schema fingerprint unchanged | PASS |
| Existing core row counts unchanged | PASS |
| v2 applied twice | PASS |
| v1 compatibility | PASS |
| v2 persistence and backend read | PASS |
| `dryRun=true` | PASS |
| `executionAllowed=false` | PASS |
| External provider IDs/URLs | 0 |
| GitHub/Jira/Drive/Vercel/Render/Stripe calls | 0 |
| Render/Vercel deploys | 0 |
| Production database writes | 0 |
| Git commits / pushes | 0 / 0 |
| `Confirm and provision` | Locked |

Neon control-plane calls were limited to project, parent, branch, endpoint and role
metadata needed to create or verify the disposable branch. Those are not application
provisioning-provider executions.

## Validation

Final results:

- Guard suite: **7/7 PASS**; every unsafe scenario aborted before SQL.
- Full local orchestration mock: **PASS**.
- Backend tests: **125 passed**, zero failures/errors/skips, H2 datasource.
- Backend package: **PASS**.
- Frontend lint: **PASS**.
- TypeScript (`npx tsc --noEmit`): **PASS**.
- Frontend production build: **PASS**, 61 static pages generated.
- `git diff --check`: **PASS**.
- Dedicated scanners (`gitleaks`, `trufflehog`, `detect-secrets`): not installed.
- Lightweight changed-file credential scan: **PASS after review**. Its only two
  matches are test source files that generate ephemeral RSA keypairs in memory;
  neither contains a stored private key.

The first frontend build attempt encountered a generated `.next` cache exception.
Only `.next` was removed; the clean rebuild then passed. No source change was needed.

Commands executed without embedded credentials:

```bash
./scripts/test-provisioning-v2-neon-rehearsal-guards.sh
./scripts/test-provisioning-v2-neon-rehearsal-flow.sh
./scripts/rehearse-provisioning-v2-neon-branch.sh
cd backend && ./mvnw test
cd backend && ./mvnw package -DskipTests
npm run lint
npx tsc --noEmit
rm -rf .next && npm run build
git diff --check
```

## Rehearsal guardrail

The executable rehearsal is:

```bash
./scripts/rehearse-provisioning-v2-neon-branch.sh
```

It refuses to write unless:

- inherited datasource variables are absent;
- the project and protected parent match Neon control-plane metadata;
- the branch name is explicitly disposable;
- the branch is a non-primary child;
- the direct endpoint belongs to that exact child and differs from production;
- the expected production-derived core tables exist;
- the six v1 tables are absent, preventing ambiguous reuse;
- the v2 columns are absent before the first v2 execution;
- a packaged backend is available before remote writes.

It leaves the branch intact after success so the evidence can be independently
reviewed. Re-running the entire chain on this same retained branch intentionally
aborts because it is no longer a fresh v1 baseline.

Neon references used by the guardrail:

- [Database branching workflow primer](https://neon.com/docs/get-started-with-neon/workflow-primer)
- [Manage compute endpoints](https://neon.com/docs/manage/endpoints/)
- [Create branch API](https://api-docs.neon.tech/reference/createprojectbranch)
- [List project compute endpoints](https://api-docs.neon.tech/reference/listprojectendpoints)

## Remaining risks before production

1. Production still lacks the v1 and v2 tables; this rehearsal is not permission to
   apply them there.
2. Both visibility fields are `text`, so PostgreSQL does not enforce JSON validity.
   Consider `jsonb` or reviewed `CHECK` constraints in a separate hardening block.
3. A production migration needs a backup/restore point, maintenance owner, pre/post
   counts and a reviewed rollback decision.
4. Application provisioning providers and `Confirm and provision` require separate
   security approval and end-to-end tests; this rehearsal deliberately proves only
   persistence and read visibility.

## Rollback

The rehearsal rollback is to delete the disposable branch after evidence review.
No reverse migration is necessary because production was never modified. The branch
is currently retained.

For a future production execution, prefer a forward fix. Dropping visibility columns
is acceptable only if no v2 write depends on them, a restore point exists, and the
rollback SQL and compatible application version have been approved.

## Recommended next block

Review and retain this evidence, then prepare a **production migration runbook only**:

- migration checksums;
- backup/restore confirmation;
- exact preflight and postflight queries;
- maintenance owner and rollback threshold;
- application compatibility gate;
- monitoring window.

Do not apply the chain to production until that runbook receives separate explicit
authorization. Keep all providers disabled and `Confirm and provision` locked.
