-- 004_total_strength: split per-user metrics.
--
-- 003 had overloaded users.total_cells to mean total strength. Restore the two
-- distinct metrics:
--   total_cells    = number of cells the user currently OWNS (owner-pointer)
--   total_strength = SUM(count) of the user's shares (drives the leaderboard)
--
-- Idempotent: safe to re-run.

ALTER TABLE users ADD COLUMN IF NOT EXISTS total_strength INTEGER DEFAULT 0;

UPDATE users u
SET total_strength = COALESCE(
      (SELECT SUM(count) FROM claimed_cell_users WHERE user_id = u.id), 0
    ),
    total_cells = COALESCE(
      (SELECT COUNT(*) FROM claimed_cells WHERE user_id = u.id), 0
    ),
    updated_at = NOW();
