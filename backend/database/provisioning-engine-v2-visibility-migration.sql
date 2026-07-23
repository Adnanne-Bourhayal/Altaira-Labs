BEGIN;

ALTER TABLE public.provisioning_plans
    ADD COLUMN IF NOT EXISTS tracks_json text NOT NULL DEFAULT '[]';

ALTER TABLE public.provisioning_plans
    ADD COLUMN IF NOT EXISTS shared_resources_json text NOT NULL DEFAULT '[]';

COMMENT ON COLUMN public.provisioning_plans.tracks_json IS
    'Dry-run Engine v2 track decisions. Empty array identifies a legacy v1 plan.';

COMMENT ON COLUMN public.provisioning_plans.shared_resources_json IS
    'Deduplicated dry-run provider and platform decisions shared across tracks.';

COMMIT;
