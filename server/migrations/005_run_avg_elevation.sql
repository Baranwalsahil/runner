-- Average elevation (metres, WGS84) captured from device GPS altitude per run.
-- Nullable: many devices / desktop fixes report no altitude.
ALTER TABLE runs ADD COLUMN IF NOT EXISTS avg_elevation_m DECIMAL(8,2);
