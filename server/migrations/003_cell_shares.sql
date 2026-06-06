-- 003_cell_shares: per-user strength shares on each cell.
--
-- A cell is no longer single-owner. Each (h3_index, user_id) pair holds a
-- `count` (strength). Running a cell you hold => +1. Running a cell others
-- hold => +1 for you, -1 for every other holder (floored at 0, row removed).
-- The `claimed_cells` row is kept as the owner-pointer: owner = holder with
-- the max count (tiebreak: most recent), claim_count = that owner's strength.
--
-- users.total_cells is redefined as SUM(count) of the user's shares
-- (total strength), driving the all-time leaderboard.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS claimed_cell_users (
    h3_index VARCHAR(20) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    count INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (h3_index, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cell_users_cell ON claimed_cell_users(h3_index);
CREATE INDEX IF NOT EXISTS idx_cell_users_user ON claimed_cell_users(user_id);

-- Backfill shares from existing single-owner cells (owner keeps prior strength).
INSERT INTO claimed_cell_users (h3_index, user_id, count, updated_at)
SELECT c.h3_index, c.user_id, GREATEST(c.claim_count, 1), COALESCE(c.claimed_at, NOW())
FROM claimed_cells c
WHERE c.user_id IS NOT NULL
ON CONFLICT (h3_index, user_id) DO NOTHING;

-- Recompute totals as sum of strength.
UPDATE users u
SET total_cells = COALESCE(
      (SELECT SUM(count) FROM claimed_cell_users WHERE user_id = u.id), 0
    ),
    updated_at = NOW();
