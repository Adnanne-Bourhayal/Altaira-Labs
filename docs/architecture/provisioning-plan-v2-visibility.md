# Provisioning Plan v2 visibility

The admin UI supports both provisioning formats without enabling provider execution.

## Response shape

Engine v2 adds two collections to `ProvisioningPlanResponse`:

- `tracks`: one decision per active service (`WEB`, `BOOKING`, `CRM`, `AUTOMATION`, `DASHBOARD`). Each item stores the selected route, rule identifier, matched signals, explanation, confidence, manual-decision flag, automation level, track-specific tools, manual steps and risks.
- `sharedResources`: deduplicated cross-track providers such as Drive, Jira, GitHub, Auth, Neon, Resend, Calendar and Stripe. Each item records selection state, automation level, requirement, reason and the tracks that use it.

Old v1 responses may omit these collections. The frontend then renders the existing flat route, tools, steps and risks.

## Additive persistence

`backend/database/provisioning-engine-v2-visibility-migration.sql` prepares two non-destructive columns on `provisioning_plans`:

- `tracks_json text NOT NULL DEFAULT '[]'`
- `shared_resources_json text NOT NULL DEFAULT '[]'`

The migration was rehearsed on disposable local/PostgreSQL and Neon branches. A later read-only production precheck found both compatible columns already present, so no v2 production migration is currently required. Existing v1 rows remain valid and resolve to the v1 view because both collections default to empty arrays.

For a future deployment, apply the SQL before deploying the backend entity that reads these columns. No existing column is removed or renamed.

## Execution boundary

This block is dry-run visibility only. `executionAllowed` remains `false`, external resources remain placeholders, and **Confirm and provision** remains disabled. No provider API is called by this UI.
