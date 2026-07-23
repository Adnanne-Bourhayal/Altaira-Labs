# Provisioning Engine v2 migration rehearsal

## Scope and safety result

This rehearsal validates `backend/database/provisioning-engine-v2-visibility-migration.sql` without using production infrastructure.

- Datasource: `jdbc:h2:mem:provisioning_v2_migration_rehearsal;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1`
- Database lifetime: disposable, in-memory, test-process only
- Data: fictional UUIDs and payloads
- Neon/PostgreSQL remote: not used
- Render: not used
- Provider APIs: not initialized or called
- Production migrations: not applied
- `Confirm and provision`: unchanged and disabled

The test aborts before opening its migration connection when `DATABASE_URL` or `SPRING_DATASOURCE_URL` points to Neon, Render or a remote PostgreSQL URL. It prints the selected H2 datasource before applying the SQL.

## Automated rehearsal

The contract is implemented in:

`backend/src/test/java/com/altaira/backend/provisioning/ProvisioningEngineV2MigrationRehearsalTests.java`

Run it from the backend directory:

```bash
cd /Volumes/T7/Altaira_Labs/Altaira_Labs_web/backend
env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
  ./mvnw -Dtest=ProvisioningEngineV2MigrationRehearsalTests test
```

The test performs this sequence:

1. Prints and enforces the local-only safety checklist.
2. Creates the v1 `provisioning_plans` schema in disposable H2.
3. Inserts one fictional v1 plan before the v2 columns exist.
4. Executes the real migration file twice to prove idempotency.
5. Compares the complete column set before and after migration.
6. Verifies the legacy row and every original value remain present.
7. Verifies both new columns are `NOT NULL` with default `[]`.
8. Inserts and reads a v2 track and shared-resource payload.
9. Verifies explicit empty arrays remain readable.
10. Exercises the public service reader with v1, v2, null, blank and malformed payloads.

## Result

The rehearsal passes with the following evidence:

- Exactly `tracks_json` and `shared_resources_json` are added.
- No existing column is removed or renamed.
- The pre-migration v1 row is preserved without value changes.
- Existing v1 rows receive `[]` in both new columns.
- Reapplying the migration does not add duplicate columns or alter rows.
- A v2 plan persists and reads typed track/shared-resource data correctly.
- `null` and blank legacy values are represented as empty collections by the service reader.
- Malformed JSON fails closed with a specific server-side exception instead of returning misleading data.
- `executionAllowed` remains `false` in v1 and v2 service responses.

Validation results on 21 July 2026:

- Focused migration rehearsal: `2` tests, `0` failures, `0` errors.
- Complete backend suite: `125` tests, `0` failures, `0` errors.
- Backend package: success with tests intentionally skipped only for the packaging command.
- Frontend ESLint: success.
- TypeScript `--noEmit`: success.
- Next.js production build: success, `61/61` static pages generated.
- `git diff --check`: success.

The first full-suite attempt was discarded because the VS Code Java language server recreated Maven files inside `backend/target` during the run. The language server was stopped, `target` was cleaned, and the complete suite was rerun from a stable build directory. Only the successful `125/125` run is treated as evidence.

## Compatibility interpretation

### Version 1

A legacy plan is identified by empty `tracks` and `sharedResources`. The existing route, automation level, reason, risks and cost data remain available. The application does not invent track decisions for an old plan.

### Version 2

Engine v2 serializes track decisions into `tracks_json` and deduplicated cross-track decisions into `shared_resources_json`. Both values round-trip through the existing response DTO.

The columns intentionally remain `text`; this avoids a destructive type change but means PostgreSQL does not enforce JSON validity. Application serialization and defensive reads remain required.

## Full validation commands

Use explicit H2 values for backend validation:

```bash
cd /Volumes/T7/Altaira_Labs/Altaira_Labs_web/backend

env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
  SPRING_DATASOURCE_URL='jdbc:h2:mem:altaira_v2_migration_tests;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1' \
  SPRING_DATASOURCE_USERNAME=sa SPRING_DATASOURCE_PASSWORD= \
  ./mvnw test

env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
  SPRING_DATASOURCE_URL='jdbc:h2:mem:altaira_v2_migration_package;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1' \
  SPRING_DATASOURCE_USERNAME=sa SPRING_DATASOURCE_PASSWORD= \
  ./mvnw package -DskipTests
```

Frontend and repository checks:

```bash
cd /Volumes/T7/Altaira_Labs/Altaira_Labs_web
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

## Risks before any Neon migration

1. H2 validates the intended SQL shape but is not a substitute for PostgreSQL execution semantics, locking and timing.
2. `ADD COLUMN IF NOT EXISTS` will not correct a pre-existing column with the wrong type, nullability or default. Inspect definitions first.
3. A large production table can make DDL operationally sensitive. Measure on a disposable copy and use a low-traffic window.
4. The migration assumes the table is in the `public` schema.
5. The `text` columns can contain malformed JSON if changed outside the application. There is no database JSON constraint.
6. Deployment order matters: migrate first, verify, then deploy code that writes Engine v2 fields.
7. A database backup or restorable branch is required before the first remote rehearsal.

## Future Neon checklist

Do not perform these steps without explicit approval.

1. Confirm the target project, branch, database and schema; show redacted identifiers to the reviewer.
2. Confirm `DATABASE_URL` and `SPRING_DATASOURCE_URL` target only the approved disposable branch, never production.
3. Create a restorable backup or disposable branch.
4. Record the row count and current column definitions for `public.provisioning_plans`.
5. Check that neither new column already exists with an incompatible definition:

   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'provisioning_plans'
   ORDER BY ordinal_position;
   ```

6. Verify representative v1 rows are readable and record non-sensitive IDs/counts.
7. Apply only `provisioning-engine-v2-visibility-migration.sql` in a transaction.
8. Re-run the column-definition query and confirm both defaults are `[]` and both columns are non-null.
9. Confirm the row count is unchanged and v1 rows contain empty arrays.
10. Insert or generate one fictional dry-run v2 plan on the disposable branch.
11. Read the plan through the backend and verify tracks, shared resources and `executionAllowed=false`.
12. Run the four snapshot demos and backend smoke tests.
13. Review logs for SQL or JSON errors without exposing connection strings.
14. Only after approval, repeat the controlled process for the intended environment.

## Rollback plan

The preferred rollback is non-destructive:

1. Stop the v2 application rollout.
2. Restore the previous application version. V1 code should ignore the additive columns.
3. Leave `tracks_json` and `shared_resources_json` in place while the incident is investigated.
4. Restore from the pre-migration backup only if data integrity is affected.

Dropping the columns is destructive and normally unnecessary. It may only be considered after exporting their data, proving no deployed code depends on them and receiving explicit approval:

```sql
BEGIN;
ALTER TABLE public.provisioning_plans DROP COLUMN IF EXISTS shared_resources_json;
ALTER TABLE public.provisioning_plans DROP COLUMN IF EXISTS tracks_json;
COMMIT;
```

This rollback SQL was documented only; it was not executed.
