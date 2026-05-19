-- 001_init: extensions, core tables, indexes, realtime publication.
-- Idempotent: safe to re-run.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_url TEXT,
    total_cells INTEGER DEFAULT 0,
    total_area_m2 DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    distance_meters DECIMAL(10,2),
    gps_trace GEOMETRY(LINESTRING, 4326),
    cells_claimed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claimed_cells (
    h3_index VARCHAR(20) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMP DEFAULT NOW(),
    claim_count INTEGER DEFAULT 1,
    resolution INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cells_user ON claimed_cells(user_id);
CREATE INDEX IF NOT EXISTS idx_cells_claimed_at ON claimed_cells(claimed_at);
CREATE INDEX IF NOT EXISTS idx_runs_user ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_started ON runs(started_at);
CREATE INDEX IF NOT EXISTS idx_runs_trace ON runs USING GIST(gps_trace);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND tablename = 'claimed_cells'
        ) THEN
            EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE claimed_cells';
        END IF;
    END IF;
END $$;
