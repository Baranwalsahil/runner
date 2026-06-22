-- 007_user_color: add user-chosen territory color (task-18). Idempotent.
-- Backfills existing rows to their UUID-derived color, mirroring
-- server/app/services/color.py color_for(): md5(id) -> first 8 hex ->
-- mod len(OWNER_PALETTE) -> palette index. Postgres arrays are 1-indexed.

ALTER TABLE users ADD COLUMN IF NOT EXISTS color VARCHAR(7);

UPDATE users SET color = (ARRAY[
    '#c3f400', '#00dbe9', '#ffb4aa', '#7df4ff', '#ffdad5', '#ff6b6b'
])[(('x' || substr(md5(id::text), 1, 8))::bit(32)::bigint % 6) + 1]
WHERE color IS NULL;
