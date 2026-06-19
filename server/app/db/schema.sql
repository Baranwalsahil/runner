-- Territory Run schema (Postgres + PostGIS).
-- Mirrors migrations/001_init.sql verbatim. Idempotent.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    total_cells INTEGER DEFAULT 0,
    total_strength INTEGER DEFAULT 0,
    total_area_m2 DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Idempotent guard for environments where 001_init was applied pre-amendment.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
UPDATE users SET password_hash = '!disabled' WHERE password_hash IS NULL;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

-- Runs table (stores GPS traces)
CREATE TABLE IF NOT EXISTS runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    distance_meters DECIMAL(10,2),
    avg_elevation_m DECIMAL(8,2),
    gps_trace GEOMETRY(LINESTRING, 4326),
    cells_claimed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Claimed cells table (the core game state)
CREATE TABLE IF NOT EXISTS claimed_cells (
    h3_index VARCHAR(20) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMP DEFAULT NOW(),
    claim_count INTEGER DEFAULT 1,
    resolution INTEGER NOT NULL
);

-- Per-user strength shares on each cell (see migrations/003_cell_shares.sql).
CREATE TABLE IF NOT EXISTS claimed_cell_users (
    h3_index VARCHAR(20) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    count INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (h3_index, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cell_users_cell ON claimed_cell_users(h3_index);
CREATE INDEX IF NOT EXISTS idx_cell_users_user ON claimed_cell_users(user_id);
CREATE INDEX IF NOT EXISTS idx_cells_user ON claimed_cells(user_id);
CREATE INDEX IF NOT EXISTS idx_cells_claimed_at ON claimed_cells(claimed_at);
CREATE INDEX IF NOT EXISTS idx_runs_user ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_started ON runs(started_at);
CREATE INDEX IF NOT EXISTS idx_runs_trace ON runs USING GIST(gps_trace);
