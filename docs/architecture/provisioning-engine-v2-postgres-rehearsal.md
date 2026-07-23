# Provisioning Engine v2 PostgreSQL rehearsal

## Result

`backend/database/provisioning-engine-v2-visibility-migration.sql` was executed successfully against a real, disposable local PostgreSQL database on 21 July 2026.

- Method: temporary local PostgreSQL cluster; Docker was not installed and was not needed.
- PostgreSQL: Homebrew PostgreSQL `15.15`.
- Host: `127.0.0.1` only.
- Port: `55432`, accepted only when unused.
- Database: `altaira_provisioning_v2_rehearsal`.
- User: `altaira_rehearsal_admin`, created only inside the disposable cluster.
- Authentication: local trust authentication inside the disposable loopback-only cluster; no reusable secret was created.
- Data: fictional UUIDs and payloads only.
- Neon, Render and remote PostgreSQL: not used.
- Provider APIs: not initialized or called.
- Production migration: not applied.
- `Confirm and provision`: unchanged and blocked.

The cluster, database, Unix socket and temporary data directory were removed automatically after the test. A post-run check found no listener on port `55432`, no rehearsal process and no rehearsal directory.

## Reproduce safely

The executable rehearsal is:

`scripts/rehearse-provisioning-v2-postgres.sh`

Run it from the repository root:

```bash
cd /Volumes/T7/Altaira_Labs/Altaira_Labs_web
env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
  ./scripts/rehearse-provisioning-v2-postgres.sh
```

The script aborts before database startup when either datasource variable contains a Neon, Render or PostgreSQL URL. It also refuses to reuse an occupied port. The temporary cluster listens only on `127.0.0.1` and is removed by an exit trap after success or failure.

The local PostgreSQL socket initially exceeded macOS's 103-byte Unix socket path limit. The script now uses a short, disposable `/tmp/altaira-pgv2-socket.*` directory and prints the local PostgreSQL log if startup fails.

## Migration evidence

Before migration, the fictional v1 schema contained 14 columns:

```text
id,lead_id,assessment_id,route_key,automation_level,automation_scope,
status,dry_run,normalized_requirements_json,decision_reason,risks_json,
cost_estimate,created_at,updated_at
```

After migration it contained exactly 16 columns. The only additions were:

```text
tracks_json,shared_resources_json
```

Verified behavior:

- The migration was applied twice in the same database without failure.
- The second execution reported both columns already present and skipped them.
- Both new columns are `NOT NULL` with default `[]`.
- The pre-migration v1 row remained present and its original values were unchanged.
- That v1 row received `[]` for both new fields.
- A fictional v2 payload round-tripped as track `WEB` and shared resource `GITHUB`.
- Explicit empty v2 arrays remained empty.
- PostgreSQL rejected malformed JSON when the text value was cast to `jsonb`.
- Final assertions completed with exit status `0`.

The database columns intentionally remain `text`. PostgreSQL therefore rejects malformed JSON only when it is cast or validated; the existing Java defensive reader remains necessary. The JUnit migration rehearsal separately verifies v1, v2, null, blank and malformed application reads and confirms `executionAllowed=false`. No database column is needed for that response-only safety flag.

## Commands executed

```bash
# Environment and local PostgreSQL discovery
env | grep -E '^(DATABASE_URL|SPRING_DATASOURCE_URL)='  # both absent
/opt/homebrew/opt/postgresql@15/bin/postgres --version

# Script syntax and real PostgreSQL rehearsal
bash -n scripts/rehearse-provisioning-v2-postgres.sh
env -u DATABASE_URL -u SPRING_DATASOURCE_URL \
  ./scripts/rehearse-provisioning-v2-postgres.sh

# Cleanup verification
lsof -nP -iTCP:55432 -sTCP:LISTEN
find "${TMPDIR:-/tmp}" -maxdepth 1 -type d \
  -name 'altaira-provisioning-v2-postgres.*' -print
find /tmp -maxdepth 1 -type d -name 'altaira-pgv2-socket.*' -print
```

The rehearsal script itself creates the v1 table, inserts one fictional v1 row, records the schema, runs the real migration twice, performs SQL assertions, inserts fictional v2 data, verifies JSON behavior and removes the entire cluster.

## Validation

Final validation on 21 July 2026:

- PostgreSQL rehearsal: PASS on PostgreSQL `15.15`, exit status `0`.
- Backend suite: `125` tests, `0` failures, `0` errors, `0` skipped.
- Backend package: PASS with tests intentionally skipped only for the packaging command.
- Backend validation datasource: explicit disposable H2 memory databases; no remote datasource variables.
- Frontend ESLint: PASS.
- TypeScript `--noEmit`: PASS.
- Next.js production build: PASS, `61/61` static pages generated.
- Repository whitespace check: PASS.

The VS Code Java language server was temporarily stopped during Maven validation because it writes generated metadata into `backend/target` on the external volume. The generated directory was cleaned and the complete suite was rerun successfully. This is a local tooling concurrency issue, not an application or migration failure.

## Compatibility conclusion

### Version 1

The migration is additive. Existing columns and data remain intact, and the defaults represent a legacy plan as empty `tracks` and `sharedResources`. Existing v1 code can ignore the two new columns.

### Version 2

Engine v2 track decisions and deduplicated shared resources persist and round-trip correctly on PostgreSQL. The application remains responsible for JSON serialization, defensive parsing and keeping execution disabled.

### Idempotence

`ADD COLUMN IF NOT EXISTS` makes the migration structurally idempotent for an already-correct schema. It does not repair an existing column with an incorrect type, nullability or default; that must be checked before any remote run.

## Remaining risks before Neon

1. `text` does not enforce JSON validity at write time; malformed manual writes remain possible.
2. `ADD COLUMN IF NOT EXISTS` silently accepts a pre-existing but incompatible definition.
3. Production table size, locks and deployment timing were not measured by this disposable test.
4. The migration assumes `public.provisioning_plans` already exists with the expected v1 schema.
5. Remote branching, backup and restore behavior remain untested.
6. Deployment order must remain migration first, verification second and Engine v2 writer rollout last.
7. No external provisioning execution has been enabled or tested by this rehearsal.

## Future Neon branch checklist

Do not run this checklist without explicit approval.

1. Create a disposable Neon branch from the intended source branch; never target production directly.
2. Record redacted project, branch, database and role identifiers for review.
3. Set credentials only in the approved one-off shell/session and confirm the hostname belongs to that disposable branch.
4. Abort if either datasource resolves to the production host or an unapproved branch.
5. Record row count and complete `information_schema.columns` output for `public.provisioning_plans`.
6. Confirm neither v2 column exists with an incompatible definition.
7. Verify representative non-sensitive v1 records and record only IDs/counts.
8. Apply only `backend/database/provisioning-engine-v2-visibility-migration.sql`.
9. Apply it a second time and confirm only `already exists, skipping` notices.
10. Confirm row count is unchanged, original values are intact and v1 rows contain `[]` defaults.
11. Insert one fictional dry-run v2 plan and read it through the backend.
12. Confirm tracks, shared resources and `executionAllowed=false`.
13. Run the four Engine v2 snapshot demos and backend smoke tests against that branch only.
14. Inspect logs for SQL/JSON errors without printing credentials or connection strings.
15. Delete the disposable branch after evidence is captured, unless retained temporarily for review.
16. Require a second explicit approval before considering any production migration.

## Rollback

The preferred rollback is application-first and non-destructive:

1. Stop or revert the Engine v2 application rollout.
2. Keep the additive columns; v1 code can ignore them.
3. Investigate and restore from the pre-migration branch/backup only if data integrity is affected.

Dropping the columns is destructive and normally unnecessary. It requires export of their contents, proof that no deployed code uses them and explicit approval:

```sql
BEGIN;
ALTER TABLE public.provisioning_plans
    DROP COLUMN IF EXISTS shared_resources_json;
ALTER TABLE public.provisioning_plans
    DROP COLUMN IF EXISTS tracks_json;
COMMIT;
```

This rollback SQL is documentation only and was not executed.
