-- 007_user_color: add user-chosen territory color (task-18). Idempotent.
-- The user picks any hex color at signup; colors are unique across users.
-- Backfill existing rows to a deterministic, near-unique per-user hex
-- (first 6 hex of md5(id)) so the UNIQUE index below can be created. NULL
-- colors are allowed (multiple) and fall back to color_for_uuid at read time.

ALTER TABLE users ADD COLUMN IF NOT EXISTS color VARCHAR(7);

UPDATE users SET color = '#' || substr(md5(id::text), 1, 6)
WHERE color IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_color_key ON users (color);
