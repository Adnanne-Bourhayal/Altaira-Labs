-- Altaira Workspace demo admin seed
-- Purpose: idempotent DEMO/LOCAL/TFG admin user.
--
-- Demo credentials for TFG/local demo:
-- - username: admin123
-- - password: admin123
--
-- The database stores only the BCrypt password hash below.
-- Do not reuse this user/password for serious production.

WITH upserted_user AS (
    INSERT INTO public.app_users (username, password_hash, role, active)
    VALUES (
        'admin123',
        '$2y$10$hbKFbGWpO.PvfiWXlS7DheXYRdAv.jWj7PQRgMNMo04AbzzROgIV2',
        'admin',
        true
    )
    ON CONFLICT (username) DO UPDATE
    SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        active = EXCLUDED.active,
        updated_at = now()
    RETURNING id, username
)
INSERT INTO public.security_events (user_id, username, event_type, success, metadata)
SELECT
    id,
    username,
    'user_created',
    true,
    'Demo/local/TFG admin user seeded from auth-demo-admin-seed.sql'
FROM upserted_user
WHERE NOT EXISTS (
    SELECT 1
    FROM public.security_events
    WHERE username = 'admin123'
      AND event_type = 'user_created'
      AND metadata = 'Demo/local/TFG admin user seeded from auth-demo-admin-seed.sql'
);
