-- 006_user_growth_profile: add weight/goal + body profile to users for the
-- Growth page projection (task-17). Idempotent: safe to re-run.

ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg      DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS goal_weight_kg DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm      DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS age            INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sex            VARCHAR(10);  -- 'male' | 'female' | 'other'
