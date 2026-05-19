# Territory Run — GPS-Based Territory Game

A competitive location-based game where runners claim hexagonal territories by physically running through them. Compete with others to dominate the map and climb the leaderboard.

---

## Table of Contents

1. [Concept Overview](#concept-overview)
2. [Core Mechanics](#core-mechanics)
3. [Tech Stack](#tech-stack)
4. [System Architecture](#system-architecture)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Free Deployment Guide](#free-deployment-guide)
8. [Project Structure](#project-structure)
9. [Getting Started](#getting-started)
10. [Development Roadmap](#development-roadmap)
11. [Key Challenges](#key-challenges)

---

## Concept Overview

Territory Run transforms your daily runs into a competitive game. As you run, your GPS trace claims hexagonal cells on a shared map. The more ground you cover, the more territory you own. Other players can steal your cells by running through them — creating an ongoing battle for map dominance.

### Why Hexagons?

Hexagonal grids are ideal for territory games because:
- Uniform adjacency (each hex has exactly 6 neighbors)
- No diagonal ambiguity
- Efficient tiling with no gaps
- Natural representation of "area" for scoring

We use Uber's H3 library which provides a hierarchical hexagonal grid system with multiple resolution levels.

---

## Core Mechanics

### Territory Acquisition

| Method | Description | Complexity |
|--------|-------------|------------|
| GPS trace → hex cells | Running through a cell claims it | Simple |
| Buffer zone | Claim cells within X meters of your route | Medium |
| Strength-based | Run more distance in a cell to own it | Complex |

**MVP Recommendation**: Start with simple GPS trace → hex cell claiming. First runner to pass through owns it until someone else runs through.

### Competition Modes

| Mode | Rules | Engagement |
|------|-------|------------|
| First-come-first-served | Once claimed, yours forever | Low (static) |
| Steal-on-run | Running through takes ownership | Medium |
| Decay + maintenance | Cells fade unless you re-run them | High |
| Team battles | Groups compete for regions | Very high |

**MVP Recommendation**: Steal-on-run. Simple but creates ongoing competition.

### Scoring

- **Primary**: Total cells owned
- **Secondary**: Total area (m²) — cells at different H3 resolutions have different areas
- **Bonus ideas**: Streak multipliers, "king of the hill" zones, weekly resets

---

## Tech Stack

### Recommended Free Stack

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND                                                   │
│  Framework: React + Vite                                    │
│  Maps: MapLibre GL JS (free, open-source)                   │
│  Hex rendering: h3-js                                       │
│  Hosting: Vercel (free tier)                                │
├─────────────────────────────────────────────────────────────┤
│  BACKEND                                                    │
│  Runtime: Python 3.13+                                       │
│  Framework: FastAPI + uvicorn                               │
│  Hosting: Render (free tier, 750 hrs/mo)                    │
├─────────────────────────────────────────────────────────────┤
│  DATABASE                                                   │
│  Primary: Supabase Postgres (free tier, 500MB)              │
│  Extensions: PostGIS + pgcrypto (h3 done app-side via h3-py)│
│  Cache: Upstash Redis (free tier, 10K commands/day)         │
├─────────────────────────────────────────────────────────────┤
│  AUTH                                                       │
│  Provider: Supabase Auth (free tier, 50K MAU)               │
├─────────────────────────────────────────────────────────────┤
│  REAL-TIME                                                  │
│  Provider: Supabase Realtime (Postgres CDC, free, bundled)  │
│  Fallback: Poll every 30 seconds when channel unavailable   │
└─────────────────────────────────────────────────────────────┘
```

### Key Libraries

| Library | Purpose | Install |
|---------|---------|---------|
| h3-js | Hexagonal grid indexing | `npm install h3-js` |
| maplibre-gl | Map rendering (free Mapbox fork) | `npm install maplibre-gl` |
| @supabase/supabase-js | Authentication | `npm install @supabase/supabase-js` |
| pg | Postgres client | `npm install pg` |
| express | API framework | `npm install express` |

### Free Tile Providers for MapLibre

| Provider | Free Tier | URL Pattern |
|----------|-----------|-------------|
| Stadia Maps | Low volume, no key | `https://tiles.stadiamaps.com/...` |
| MapTiler | 100K tiles/mo | `https://api.maptiler.com/...` |
| OpenStreetMap | Unlimited (fair use) | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` |

---

## System Architecture

```
┌──────────────┐     ┌──────────────┐
│  Mobile App  │     │     Web      │
│  (React      │     │  Dashboard   │
│   Native)    │     │  (React)     │
└──────┬───────┘     └──────┬───────┘
       │                    │
       │    HTTPS/WSS       │
       └────────┬───────────┘
                │
                ▼
       ┌────────────────┐
       │   API Server   │
       │  (Python /     │
       │   Fastify)     │
       └────────┬───────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Redis     │
│  + PostGIS   │ │  (Cache &    │
│  + H3        │ │  Leaderboard)│
└──────────────┘ └──────────────┘
```

### Data Flow: Completing a Run

```
1. GPS Trace        2. H3 Encode       3. Claim Cells      4. Update Scores
   [lat,lng][]  -->  h3Index[]    -->  DB upsert      -->  Redis ZINCRBY
   from device       via h3-js         with user_id       leaderboard
```

---

## Database Schema

### Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_url TEXT,
    total_cells INTEGER DEFAULT 0,
    total_area_m2 DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Runs table (stores GPS traces)
CREATE TABLE runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    distance_meters DECIMAL(10,2),
    gps_trace GEOMETRY(LINESTRING, 4326), -- PostGIS geometry
    cells_claimed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Claimed cells table (the core game state)
CREATE TABLE claimed_cells (
    h3_index VARCHAR(20) PRIMARY KEY, -- H3 cell ID (e.g., '8a2a1072b59ffff')
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMP DEFAULT NOW(),
    claim_count INTEGER DEFAULT 1, -- Times this cell has been claimed
    resolution INTEGER NOT NULL -- H3 resolution (7-9 typical)
);

-- Indexes for performance
CREATE INDEX idx_cells_user ON claimed_cells(user_id);
CREATE INDEX idx_cells_claimed_at ON claimed_cells(claimed_at);
CREATE INDEX idx_runs_user ON runs(user_id);
CREATE INDEX idx_runs_started ON runs(started_at);

-- Spatial index for GPS traces
CREATE INDEX idx_runs_trace ON runs USING GIST(gps_trace);
```

### H3 Resolution Reference

| Resolution | Avg Hex Area | Edge Length | Use Case |
|------------|--------------|-------------|----------|
| 7 | 5.16 km² | 1.22 km | City-wide view |
| 8 | 0.74 km² | 461 m | Neighborhood |
| 9 | 0.11 km² | 174 m | Street level (recommended) |
| 10 | 0.015 km² | 66 m | Very detailed |

**Recommendation**: Use resolution 9 for gameplay. It's ~100m across — roughly one city block.

---

## API Endpoints

### Authentication

```
POST /auth/signup          - Create account
POST /auth/login           - Login
POST /auth/logout          - Logout
GET  /auth/me              - Get current user
```

### Runs

```
POST /runs                 - Submit a completed run
     Body: { gps_trace: [[lat, lng], ...], started_at, ended_at }
     Returns: { run_id, cells_claimed, new_total }

GET  /runs                 - Get user's run history
GET  /runs/:id             - Get specific run details
```

### Territory

```
GET  /territory            - Get all claimed cells in viewport
     Query: { bounds: [sw_lat, sw_lng, ne_lat, ne_lng] }
     Returns: [{ h3_index, user_id, username, color }, ...]

GET  /territory/user/:id   - Get cells owned by specific user
GET  /territory/stats      - Get global territory statistics
```

### Leaderboard

```
GET  /leaderboard          - Get top players
     Query: { limit: 50, offset: 0 }
     Returns: [{ user_id, username, total_cells, rank }, ...]

GET  /leaderboard/nearby   - Get players near current user's rank
```

---

## Free Deployment Guide

### Prerequisites

- GitHub account
- Node.js 18+ installed locally (frontend only)
- Python 3.13+ installed locally (backend)

### Step 1: Set Up Supabase (DB + Auth + Realtime)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project (region close to Render region)
3. Enable required extensions: dashboard → Database → Extensions → enable `postgis` and `pgcrypto`
4. Copy connection strings from dashboard → Settings → Database:
   - **Pooled** (port `6543`, transaction mode) → `DATABASE_URL` (app runtime — required for asyncpg + PgBouncer)
   - **Direct** (port `5432`) → `DATABASE_URL_DIRECT` (migrations only)
5. Copy auth credentials from dashboard → Settings → API:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_JWT_SECRET`
6. Enable Email auth in Authentication → Providers
7. Run schema: `python -m scripts.migrate` against `DATABASE_URL_DIRECT`
8. Enable Realtime on `claimed_cells`: dashboard → Database → Replication → toggle `claimed_cells` in `supabase_realtime` publication

### Step 3: Deploy Backend (Render)

1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub repo
3. Create a new Web Service:
   - Runtime: Python 3
   - Build command: `pip install -r server/requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir server`
4. Add environment variables:
   ```
   DATABASE_URL=postgresql://...
   SUPABASE_URL=https://...
   SUPABASE_ANON_KEY=eyJ...
   NODE_ENV=production
   ```

### Step 4: Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign up
2. Import your GitHub repo
3. Framework preset: Vite
4. Add environment variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   VITE_SUPABASE_URL=https://...
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_MAPTILER_KEY=your_key (optional)
   ```

### Step 5: Set Up Redis Cache (Upstash) — Optional

1. Go to [upstash.com](https://upstash.com) and sign up
2. Create a new Redis database
3. Add to backend environment:
   ```
   REDIS_URL=redis://...
   ```

### Free Tier Limits Summary

| Service | Limit | Resets |
|---------|-------|--------|
| Vercel | 100GB bandwidth | Monthly |
| Render | 750 hours | Monthly |
| Supabase | 500MB DB + 50K MAU + Realtime (200 concurrent) | — |
| Upstash Redis | 10K commands/day | Daily |

---

## Project Structure

```
territory-run/
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map.jsx        # MapLibre map with hex overlay
│   │   │   ├── HexGrid.jsx    # H3 hex rendering
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── RunTracker.jsx # GPS recording
│   │   │   └── UserProfile.jsx
│   │   ├── hooks/
│   │   │   ├── useGeolocation.js
│   │   │   ├── useTerritory.js
│   │   │   └── useAuth.js
│   │   ├── lib/
│   │   │   ├── api.js         # API client
│   │   │   ├── h3Utils.js     # H3 helper functions
│   │   │   └── supabase.js    # Auth client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Backend (Python + FastAPI)
│   ├── app/
│   │   ├── main.py            # FastAPI entry
│   │   ├── config.py          # pydantic-settings env loader
│   │   ├── deps.py            # DI: db pool, auth, cache
│   │   ├── routers/
│   │   │   ├── health.py
│   │   │   ├── auth.py
│   │   │   ├── runs.py
│   │   │   ├── territory.py
│   │   │   └── leaderboard.py
│   │   ├── services/
│   │   │   ├── h3_service.py
│   │   │   ├── gps_filter.py
│   │   │   ├── run_service.py
│   │   │   ├── user_service.py
│   │   │   ├── territory_service.py
│   │   │   └── leaderboard_service.py
│   │   ├── schemas/           # pydantic models
│   │   │   ├── run.py
│   │   │   ├── user.py
│   │   │   └── territory.py
│   │   ├── db/
│   │   │   ├── pool.py        # asyncpg pool singleton
│   │   │   └── schema.sql
│   │   └── cache/
│   │       ├── redis.py
│   │       ├── leaderboard_cache.py
│   │       └── territory_cache.py
│   ├── migrations/
│   │   └── 001_init.sql
│   ├── scripts/migrate.py
│   ├── tests/                 # pytest + httpx AsyncClient
│   ├── pyproject.toml         # uv/poetry/pip-tools
│   └── requirements.txt
│
├── shared/                    # Shared types/constants
│   └── constants.js           # H3 resolution, game rules
│
├── .env.example
├── .gitignore
└── README.md
```

---

## Getting Started

### Local Development

```bash
# Clone the repo
git clone https://github.com/yourusername/territory-run.git
cd territory-run

# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Start database (if using Docker locally)
docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgis/postgis

# Run migrations
psql $DATABASE_URL < db/schema.sql

# Start backend (in server/)
npm run dev

# Start frontend (in client/)
npm run dev
```

### Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/territory_run

# Supabase Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Redis (optional)
REDIS_URL=redis://localhost:6379

# App config
H3_RESOLUTION=9
PORT=3000
```

---

## Development Roadmap

### Phase 1: MVP (Week 1-2)

- [x] Project setup and architecture
- [ ] Basic map with hex grid overlay
- [ ] User authentication (signup/login)
- [ ] Run recording (GPS trace capture)
- [ ] Cell claiming on run completion
- [ ] Basic leaderboard
- [ ] Deploy to free tier

### Phase 2: Core Game (Week 3-4)

- [ ] Real-time territory updates
- [ ] Run history and statistics
- [ ] User profiles with avatars
- [ ] Cell stealing mechanics
- [ ] Mobile-responsive design
- [ ] Push notifications

### Phase 3: Engagement (Week 5-6)

- [ ] Weekly/monthly leaderboards
- [ ] Achievement badges
- [ ] Territory decay system
- [ ] Friends and following
- [ ] Activity feed
- [ ] Share runs to social media

### Phase 4: Advanced (Future)

- [ ] Team/clan system
- [ ] Special zones (2x points, king of the hill)
- [ ] Seasonal competitions
- [ ] Premium features
- [ ] Native mobile apps (React Native)

---

## Key Challenges

### 1. GPS Accuracy

**Problem**: Urban canyons, tunnels, and signal drift create noisy GPS data.

**Solutions**:
- Apply Kalman filtering to smooth traces
- Discard points with accuracy > 50m
- Use speed-based outlier detection (human can't run 100 km/h)

```javascript
// Example: Simple speed-based filtering
function filterGpsTrace(points) {
  const MAX_SPEED_MPS = 12; // ~43 km/h, generous for sprinting
  return points.filter((point, i) => {
    if (i === 0) return true;
    const prev = points[i - 1];
    const dist = haversineDistance(prev, point);
    const time = (point.timestamp - prev.timestamp) / 1000;
    return dist / time < MAX_SPEED_MPS;
  });
}
```

### 2. Cheating Prevention

**Problem**: GPS spoofing apps can fake location.

**Mitigations**:
- Rate limiting (max cells per hour)
- Anomaly detection (impossible speeds, teleportation)
- Device attestation (Play Integrity API / App Attest)
- Community reporting
- Shadow banning (cheaters only see their own fake progress)

### 3. Cold Start Problem

**Problem**: Game is boring with no other players.

**Solutions**:
- Seed map with "ghost" territories to capture
- Focus launch on specific neighborhoods
- Add solo challenges (claim X cells this week)
- NPC "runners" that slowly claim territory

### 4. Battery Drain

**Problem**: Continuous GPS tracking drains battery fast.

**Solutions**:
- Use significant location changes API when possible
- Batch GPS points and send periodically
- Let users manually start/stop tracking
- Reduce GPS frequency when speed is constant

### 5. Scaling Hex Storage

**Problem**: At resolution 9, there are ~4 trillion possible cells globally.

**Solutions**:
- Only store claimed cells (sparse storage)
- Partition by H3 resolution 4 parent (regional sharding)
- Archive inactive cells after 30 days
- Use Redis for hot data, Postgres for cold

---

## Cost Scaling Reference

| Active Users | Monthly Cost | Notes |
|--------------|--------------|-------|
| 0 – 1,000 | $0 | Free tiers sufficient |
| 1,000 – 5,000 | ~$25 | Paid database tier |
| 5,000 – 20,000 | ~$75 | Dedicated backend |
| 20,000 – 50,000 | ~$200 | Redis clustering, CDN |
| 50,000+ | $500+ | Multi-region, dedicated infra |

---

## Resources

- [H3 Documentation](https://h3geo.org/docs/)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Render Deployment](https://render.com/docs)

---

## License

MIT License — feel free to use this for your own projects.

---

*Built with ❤️ for runners who like to compete.*

---

## Workflow: Tasks folder + progress.md (resumable execution)

When user says **"implement tasks list in folder tasks"** (or variants: "continue tasks", "resume tasks"):

1. Read all task files in `tasks/` folder.
2. Create/update `progress.md` at repo root tracking each task with status: `running`, `paused`, or `complete`.
3. Update `progress.md` in real time as task status changes — mark `running` when starting, `complete` when done.
4. On new session re-invoke: read `progress.md` first. If task marked `running` or `paused` (not `complete`), resume it by evaluating current code state vs task spec to determine remaining work.
5. If `progress.md` is stale (task done in code but not marked, or vice versa), reconcile by checking actual state before continuing.

**Why:** Resumable, session-spanning task execution. `progress.md` is source of truth for what's done. Stale entries are expected — verify before assuming.

### progress.md format

```markdown
# Task Progress

- [ ] running: task-01-name — started YYYY-MM-DD, <short note on current state>
- [ ] paused: task-02-name — <reason paused>
- [x] complete: task-03-name — done YYYY-MM-DD
```

---

## Workflow: Per-task feat branch (mandatory)

For **every** task implementation (any `tasks/tasks-NN-*.md`):

1. **Before any code edits**, create + checkout a feature branch off the current `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/task-NN-<short-slug>
   ```
   Slug examples: `feat/task-07-backend-scaffold`, `feat/task-08-db-schema`.
2. Implement task on the branch. Commit incrementally — small logical commits beat one giant commit.
3. Run full test suite (`npm test` for FE, `pytest -v` for BE). Run curl checks per task acceptance. Update `progress.md` to `complete` on the branch.
4. Push the branch:
   ```bash
   git push -u origin feat/task-NN-<short-slug>
   ```
5. Merge to `main` (fast-forward or `--no-ff` based on git config), then delete branch locally + remotely:
   ```bash
   git checkout main
   git pull origin main
   git merge --no-ff feat/task-NN-<short-slug> -m "Merge task-NN: <title>"
   git push origin main
   git branch -d feat/task-NN-<short-slug>
   git push origin --delete feat/task-NN-<short-slug>
   ```

**Why:** Per-task branches keep `main` always green, give a clean revert point per task, and let CI run isolated checks per scope. Deletion after merge keeps the branch list tidy.

**How to apply:** Triggers automatically on any "implement task NN" / "continue tasks" / "resume tasks" prompt. Never edit code directly on `main`. The only exception: tiny doc-only fixes (typo, broken link) — those may go on `main` directly with explicit user OK.

**Confirm before pushing to `main`:** Always ask user for approval before the final `git push origin main` and before deleting the remote branch.

**If task fails mid-way:** Leave the branch open. Update `progress.md` to `paused` with reason. Do NOT merge a partial task.

---

# Banyan Memory Bank Configuration

> Appended by `/banyan-init` on 2026-05-19. Everything below this line documents the Banyan workflow layered on top of the Territory Run project conventions above. The existing per-task feat branch + `progress.md` workflow remains the project's primary task-execution loop; Banyan slash-commands are optional tooling for richer planning/reflection on Level 2+ features.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Memory Bank System

This project uses the **Banyan Memory Bank** system for structured development and task management. All Memory Bank files are located in the `memory-bank/` directory at the project root.

### Core Memory Bank Files

- **`memory-bank/tasks.md`** - Task registry: at-a-glance table of all tasks with phase and status
- **`memory-bank/tasks/TASK-XXX.md`** - Per-task file: full plan, user journey, implementation roadmap, and live execution state for one task
- **`memory-bank/progress.md`** - Implementation status and phase completion tracking (only updated by the banyan-archive command)
- **`memory-bank/projectConfig.md`** - Plugin version tracking and project configuration (auto-managed by `/banyan-init`)
- **`memory-bank/projectbrief.md`** - Project foundation, objectives, and repository structure
- **`memory-bank/productBrief.md`** - Product context: key functionality, markets, personas, NFRs, and integrations
- **`memory-bank/techContext.md`** - Technology stack, infrastructure, component structure, and development commands
- **`memory-bank/systemPatterns.md`** - System architecture patterns
- **`memory-bank/roadmap.md`** - Product roadmap with versions, features, and release tracking (required for Level 2-4 tasks)
- **`memory-bank/creative/TASK-XXX-[feature].md`** - Design decisions, prefixed with task ID
- **`memory-bank/reflection/reflection-[task].md`** - Task reviews and learnings
- **`memory-bank/archive/archive-[task].md`** - Completed task archives

### Memory Bank Workflow

When starting work:
1. **Read `memory-bank/tasks.md`** to see all active tasks and their phases
2. **Read `memory-bank/tasks/TASK-XXX.md`** for the specific task you are working on — this contains the full plan and current execution state
3. Consult `memory-bank/techContext.md` for project-specific commands and component structure
4. **Read `memory-bank/productBrief.md`** to understand product context, personas, and NFRs (especially for Level 2-4 tasks)
5. Consult task-specific creative or reflection docs if they exist

When working:
- Update `memory-bank/tasks/TASK-XXX.md` Execution State section as you complete work items or phases; update the `tasks.md` registry row to reflect Phase and Status
- Update `memory-bank/techContext.md` when adding new technologies, libraries, or infrastructure
- Update `memory-bank/systemPatterns.md` when introducing new architectural or design patterns (should be done by Document subagent during build iterations)
- Update `memory-bank/productBrief.md` when adding features, personas, or changing NFRs (should be done by Document subagent during build iterations)
- Follow the complexity-appropriate workflow (see below)

### 12-Factor App Principles

This project follows [12-Factor App](https://12factor.net/) methodology. Key principles enforced during `/build`:

- **Config in Environment** - Store configuration in environment variables, not code
- **No Hardcoded Values** - URLs, credentials, feature flags, and settings must be configurable
- **Dev/Prod Parity** - Use the same configuration approach across all environments

**Detailed instructions** are in the build sub-agent files (`${CLAUDE_PLUGIN_ROOT}/context/agents/build-*.md`) which are loaded during `/banyan-build` execution. This keeps context lean until needed.

### Observability Standards

This project enforces **consistent observability** across all services using OpenTelemetry standards. Key principles enforced during `/build`:

- **OpenTelemetry First** - Use OpenTelemetry SDK for logs, metrics, and traces
- **Distributed Tracing Always** - Every request must have a traceable transaction ID (W3C Trace Context)
- **Structured Logging** - JSON format with traceId, spanId, service, level fields
- **Configuration Over Code** - All observability settings via environment variables (LOG_LEVEL, OTEL_*, etc.)
- **Reusable Abstractions** - Use common logger library across services

**Environment Variables:**
| Variable | Purpose |
|----------|---------|
| `LOG_LEVEL` | Log verbosity (trace/debug/info/warn/error/fatal) |
| `LOG_FORMAT` | Output format (json/text) |
| `LOG_OUTPUT` | Destination (stdout/file/both) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry collector endpoint |
| `OTEL_SERVICE_NAME` | Service identifier for traces |
| `OTEL_TRACES_SAMPLER_ARG` | Sampling ratio for production |

**Blocking Violations:**
- `console.log`/`console.error` in production code
- Missing trace context propagation in HTTP clients
- Sensitive data in logs (passwords, tokens, PII)
- Hardcoded log levels or output destinations

**Detailed requirements** are in `${CLAUDE_PLUGIN_ROOT}/context/observability-requirements.md` which is loaded by build agents during `/banyan-build` execution.

### Complexity Levels

Tasks are classified into 4 complexity levels. Complexity is evaluated:
- During `/banyan-task` for quick tasks
- During `/banyan-roadmap feature create` for features (stored with feature, inherited by linked tasks)
- The `/banyan-archive` command should always be used to clean up the environment and get ready for the next development task

See `${CLAUDE_PLUGIN_ROOT}/context/complexity-evaluation.md` for the shared decision tree.

- **Level 1**: Quick fixes, simple bugs
  - Workflow: `/banyan-task` -> `/banyan-build` -> (optional: `/banyan-reflect`) -> `/banyan-archive`
  - Does NOT require roadmap feature

- **Level 2**: Simple enhancements
  - Workflow: `/banyan-roadmap feature create` -> `/banyan-plan` -> `/banyan-build` -> (optional: `/banyan-reflect` -> `/banyan-archive`)
  - Requires roadmap feature

- **Level 3**: Intermediate features
  - Workflow: `/banyan-roadmap feature create` -> `/banyan-plan` -> `/banyan-creative` -> `/banyan-build` (per phase) -> `/banyan-reflect` -> `/banyan-archive`
  - Requires roadmap feature

- **Level 4**: Enterprise/architectural changes
  - Workflow: `/banyan-roadmap feature create` -> `/banyan-plan` -> `/banyan-creative` -> `/banyan-build` (per phase) -> `/banyan-reflect` -> `/banyan-archive`
  - Requires roadmap feature

**Key Notes:**
- **Complexity is stored with features**: When creating a feature in the roadmap, complexity is evaluated and stored. Tasks linked to features inherit this complexity.
- **Level 1 uses `/banyan-task`**: Quick tasks bypass the roadmap entirely
- **Level 2-4 use roadmap features**: Create the feature first, then plan and build
- **Reflection is manual**: Run `/banyan-reflect` after all `/banyan-build` phases complete
- **Git commits**: Phase commits in `/banyan-build`, reflection commit in `/banyan-reflect`
- **Archive strategy**: Configured in `projectbrief.md` Git Configuration. Either `push-and-pr` (pushes feature branch + creates PR) or `local-merge` (merges to main locally). These are mutually exclusive.

The current task's complexity level is documented in `memory-bank/tasks/TASK-XXX.md` (inherited from the linked roadmap feature for Level 2-4).

### Product Brief

The **productBrief.md** file captures the business and product context that all agents need to understand. It ensures implementations align with product intentions.

#### Key Sections

| Section | Purpose |
|---------|---------|
| **Product Overview** | Name, value proposition, product type, stage |
| **Key Functionality** | Core capabilities the product provides |
| **Markets Serviced** | Target industries, geographic focus, market size |
| **Competitive Landscape** | Competitors and differentiators |
| **Key Personas** | Primary users, secondary users, administrators with goals and pain points |
| **User Flows** | Primary flows, onboarding, key workflows |
| **Success Metrics** | Business, product, and technical KPIs |
| **Non-Functional Requirements** | Performance, scalability, security, availability, accessibility, i18n |
| **Integration Points** | External systems, APIs consumed/provided |
| **Constraints & Risks** | Business/technical constraints, assumptions, risks |

#### When to Use

- **Planning (Level 2-4)**: Read to understand user needs and constraints before planning
- **Creative phases**: Architecture, UI/UX, and algorithm decisions MUST align with productBrief
- **Build phase**: Documentation agent updates productBrief when capabilities change

#### Memory Bank Refresh

When running `/banyan-init` on existing repos, a Product Brief Refresh agent reviews the codebase and updates productBrief.md with any changes to:
- New features or capabilities
- New user personas or roles
- Changed non-functional requirements
- New integrations

### Product Roadmap Management

The project uses a **version-based roadmap** system for tracking features and releases.

#### Roadmap Structure

```
memory-bank/roadmap.md
├── Summary (statistics)
├── Versions
│   ├── next (planning) - Backlog for future features
│   ├── vX.X.X (active) - Currently being worked on
│   └── vX.X.X (released) - Deployed, LOCKED
└── Features
    └── FEAT-XXX: Feature Name
        ├── Version assignment
        ├── Status (planned/in_progress/complete)
        ├── Complexity (Level 1-4) - Evaluated at feature creation
        └── Linked tasks (inherit feature complexity)
```

#### Version Lifecycle

1. **planning** - Accepting features, no timeline commitment
2. **active** - Feature list frozen, target date set
3. **released** - Deployed, **permanently locked** (no feature changes)

#### Feature Linking (Mandatory for Level 2-4)

During `/banyan-plan`, tasks must be linked to roadmap features:
- **Level 1**: Optional (can skip roadmap linking)
- **Level 2-4**: Mandatory (prompts to select or create feature)

When linked, tasks get:
```markdown
**Roadmap Link**: FEAT-005
**Feature Branch**: feature/FEAT-005-newsletter-distribution
```

#### Feature-Based Git Branches

When a task has a roadmap link:
- **Branch**: `feature/FEAT-XXX-slug` (not `feature/task-XXX`)
- **Worktree**: `.claude-worktrees/FEAT-XXX` (feature-based)
- **Sharing**: Multiple tasks can share the same feature worktree

Without a roadmap link (Level 1 or opted-out):
- **Branch**: `feature/task-XXX` (current behavior)
- **Worktree**: `.claude-worktrees/task-XXX`

#### Release Locking

Released versions are **permanently locked**:
- Cannot add features to released versions
- Cannot remove features from released versions
- Cannot move features to/from released versions

This preserves release history and prevents accidental modifications.

#### /banyan-roadmap Command Quick Reference

| Operation | Command |
|-----------|---------|
| View roadmap | `/banyan-roadmap` |
| Create feature | `/banyan-roadmap feature create [name]` |
| Move feature | `/banyan-roadmap feature move FEAT-001 v1.0.0` |
| Link task | `/banyan-roadmap feature link FEAT-001 TASK-001` |
| Create version | `/banyan-roadmap version create v1.0.0` |
| Activate version | `/banyan-roadmap version activate v1.0.0` |
| Release version | `/banyan-roadmap version release v1.0.0` |

### Progressive Discovery

Do not attempt to load all Memory Bank files at once. Use **progressive discovery**:
1. Start with `tasks.md` and the relevant `tasks/TASK-XXX.md`
2. Load other files as needed based on the task
3. Check for task-specific creative or archive docs if referenced

### Interruption Recovery System

All workflow commands include automatic resumption logic. The `## Execution State` section of `tasks/TASK-XXX.md` is continuously updated with current phase, step, sub-agent statuses, and resumption notes. Commands check this state on startup and resume from the last incomplete step. See command files for step-by-step state tracking requirements.

### Phase Gates & Reference Integrity

Commands enforce workflow prerequisites before proceeding. These are **hard blocks** — the command will STOP with an error and suggested fix if prerequisites are not met. There is no skip option; use `/banyan-task` for quick work that doesn't need the full workflow.

**Phase Gates (hard blocks):**

| Command | Key Preconditions |
|---------|-------------------|
| `/banyan-plan` | Task registered in tasks.md |
| `/banyan-creative` | Plan exists, complexity >= Level 2 |
| `/banyan-build` | Plan exists, required creative phases complete |
| `/banyan-reflect` | Build phase completed |
| `/banyan-archive` | Reflection document exists (Task Archive mode) |
| `/banyan-verify` | Implementation present (when TASK-XXX provided) |

**Reference Integrity (fail-fast):**

When a command reads a reference to another file (e.g., a task listed in `tasks.md`, a creative doc marked complete in a task file), it verifies the referenced file exists. If a reference is broken, the command stops immediately with an error and suggested fix — it does not silently continue with partial state.

Common reference checks:
- `tasks.md` registry → `tasks/TASK-XXX.md` file
- Task file creative phases → `creative/TASK-XXX-*.md` files
- Task file reflection status → `reflection/reflection-TASK-XXX.md`
- `roadmap.md` task references → `tasks.md` registry

**Exempt commands**: `/banyan-init` and `/banyan-upgrade` skip all gates (they bootstrap state).

Validation logic: `${CLAUDE_PLUGIN_ROOT}/context/phase-gates.md`

### Claude Commands (Slash Commands)

This project uses structured workflow commands with **progressive context loading** to optimize token usage.

**Commands:** `${CLAUDE_PLUGIN_ROOT}/commands/`
| Command | Description | When to Use |
|---------|-------------|-------------|
| `/banyan-init` | Memory Bank setup | Initialize Memory Bank for a new project |
| `/banyan-task` | Quick task execution | Level 1 tasks (bug fixes, typos, simple changes) |
| `/banyan-roadmap` | Product roadmap management | Create features, manage versions (includes complexity evaluation) |
| `/banyan-plan` | Task planning | Level 2-4 tasks after feature creation |
| `/banyan-creative` | Design decisions | Level 3-4 tasks requiring design exploration |
| `/banyan-build` | Code implementation | After planning/creative phases; one phase at a time |
| `/banyan-reflect` | Task reflection | After all /banyan-build phases complete |
| `/banyan-archive` | Task archiving + PR creation | After /banyan-reflect completes (mandatory for Level 4) |
| `/banyan-verify` | Code verification & testing | Ad-hoc verification at any time |

### Command Task ID Argument

All workflow commands require a task ID argument to support parallel task development:

```
/banyan-plan TASK-001
/banyan-creative TASK-001
/banyan-build TASK-001
/banyan-reflect TASK-001
/banyan-archive TASK-001
```

Use `/banyan-roadmap view` to see all tasks and their current phases.

**Workflow by Complexity:**
- **Level 1:** `/banyan-task` -> `/banyan-build TASK-XXX` -> `/banyan-reflect TASK-XXX` (optional) -> `/banyan-archive TASK-XXX`
- **Level 2:** `/banyan-roadmap feature create` -> `/banyan-plan TASK-XXX` -> `/banyan-build TASK-XXX` -> `/banyan-reflect TASK-XXX` (optional) -> `/banyan-archive TASK-XXX`
- **Level 3:** `/banyan-roadmap feature create` -> `/banyan-plan TASK-XXX` -> `/banyan-creative TASK-XXX` -> `/banyan-build TASK-XXX` (per phase) -> `/banyan-reflect TASK-XXX` -> `/banyan-archive TASK-XXX`
- **Level 4:** `/banyan-roadmap feature create` -> `/banyan-plan TASK-XXX` -> `/banyan-creative TASK-XXX` -> `/banyan-build TASK-XXX` (per phase) -> `/banyan-reflect TASK-XXX` -> `/banyan-archive TASK-XXX`

**Multi-Phase Implementation Workflow:**

For tasks with multiple implementation phases (common in Level 3-4):

```
/banyan-roadmap feature create -> /banyan-plan -> /banyan-creative
    |
    v
    Phase 1: /banyan-build -> STOP (human reviews)
    |
    v
    Phase 2: /banyan-build -> STOP (human reviews)
    |
    v
    Phase N: /banyan-build -> STOP (human reviews)
    |
    v
    /banyan-reflect (create reflection document + commit)
    |
    v
    /banyan-archive (push & PR, or local merge - based on project config)
```

**What Happens in Each Command:**
- **/banyan-build**: Implements ONE phase, commits to feature branch, STOPS
- **/banyan-reflect**: Creates reflection document, commits to feature branch
- **/banyan-archive**: Either pushes feature branch + creates PR, or merges to main locally (configured per project)

**Key Points:**
- `/banyan-build` works on ONE implementation phase at a time
- After each `/banyan-build`, human reviews before proceeding
- `/banyan-reflect` is run MANUALLY after all phases complete
- `/banyan-archive` uses the **Archive Strategy** from `projectbrief.md` to decide between push+PR or local merge (never both)

### Progressive Context Loading

Commands use a **two-tier system** to minimize token usage: **command files** (`${CLAUDE_PLUGIN_ROOT}/commands/`) contain minimal routing logic, while **context files** (`${CLAUDE_PLUGIN_ROOT}/context/`) contain detailed instructions loaded only when needed. Each command tells you which context file to read based on the complexity level in `memory-bank/tasks/TASK-XXX.md`.

### Model Selection Strategy

Different commands and sub-agents use different Claude models optimized for cost and performance. See `${CLAUDE_PLUGIN_ROOT}/context/model-selection-strategy.md` for details. Key principle: Haiku for simple tasks, Sonnet for coding, Opus for complex planning/architecture.

### Sub-Agent Architecture

The `/banyan-plan`, `/banyan-creative`, and `/banyan-build` commands use **sub-agent delegation** to prevent context window overflow. Each command spawns specialized sub-agents via the Task tool, with full methodology files in `${CLAUDE_PLUGIN_ROOT}/agents/`. Sub-agents work independently and write outputs to `memory-bank/`. See the respective command files for details.

**Planning agents:**
- **Spec Writer Agent** (Sonnet for L2-L3, Opus for L4) — Reads product context and codebase, generates feature specification with invocation method, success criteria, and acceptance criteria. Replaces manual Q&A with an agent-drafted spec for human review.

### Process Management for Parallel Agents

When multiple agents run in parallel, they MUST use PID-based process control (never pattern-based kills like `pkill -f`). See `${CLAUDE_PLUGIN_ROOT}/context/process-management.md` for details.

### Tool Usage Rules

Claude Code and all sub-agents MUST follow these rules to avoid unnecessary permission prompts and keep the workflow smooth:

**File creation:**
- **NEVER** use `cat << EOF`, `cat << 'EOF'`, or `echo >` heredocs in Bash to create or write files. Use the **Write** tool instead.
- **NEVER** use `sed`, `awk`, or stream editors to modify files. Use the **Edit** tool instead.

**Bash commands — ONE command per Bash call:**
- **NEVER chain independent commands with `&&`, `;`, or `||`** in a single Bash call. Each command MUST be a separate Bash tool call.
- **NEVER prefix a command with `cd dir &&`**. Instead, use absolute paths, `-chdir` flags, or the `-C` flag (e.g., `git -C /path/to/repo status`).
- When you need to create a file and then run a command on it, use **two separate tool calls**: a Write call to create the file, then a Bash call to run the command.
- Do not pipe file contents through Bash when a dedicated tool exists (e.g., use Read instead of `cat`, Grep instead of `grep`).
- Independent commands in separate Bash calls can run in **parallel**, which is faster than chaining.

```
BAD (chained — triggers permission prompt, blocks execution):
  Bash: cd /project && terraform -chdir=modules/lambda test 2>&1 && terraform -chdir=modules/sns test 2>&1

GOOD (separate calls — each matches permission patterns, can run in parallel):
  Bash call 1: terraform -chdir=/project/modules/lambda test 2>&1
  Bash call 2: terraform -chdir=/project/modules/sns test 2>&1

BAD (cd && git — triggers "compound commands with cd and git require approval"):
  Bash: cd /path/to/repo && git status | grep -E "modified:|new file:"

GOOD (git -C flag — matches Bash(git -C *) permission pattern):
  Bash: git -C /path/to/repo status | grep -E "modified:|new file:"

BAD (cd && npm — doesn't match Bash(npm *)):
  Bash: cd /path/to/project && npm test 2>&1

GOOD (use absolute path or run from correct directory):
  Bash: npm test --prefix /path/to/project 2>&1
```

**Why this matters:**
- Permission patterns like `Bash(terraform *)` only match commands that **start with** `terraform`. A chained command like `cd dir && terraform test` starts with `cd`, so it matches nothing and triggers a manual approval prompt.
- Single-purpose commands match the pre-approved permission patterns in `.claude/settings.local.json`
- Heredocs and chained commands look like arbitrary shell execution to the permission system
- This keeps both sequential and parallel workflows flowing without human interruption

**Preserve output from expensive commands — never discard and re-run:**
- When running commands that are slow (>30s), expensive, or produce diagnostic output you may need to analyze (test suites, builds, linters, infrastructure commands), **always `tee` the full output to a log file**.
- **NEVER** pipe long-running command output through `tail`, `head`, `grep`, or other filters that discard the full output. If you need a summary, tee first and then read/grep the log file separately.
- Use `.claude-logs/` at the project root for log files. Create the directory if it doesn't exist. Name files descriptively: `.claude-logs/{command}-{timestamp}.log` (e.g., `.claude-logs/terraform-test-20260314-1423.log`).
- After the command completes, use Read or Grep on the log file for analysis — do not re-run the command.
- Clean up `.claude-logs/` at the end of each `/banyan-build` or `/banyan-archive` cycle, or when log files are no longer needed.
- Add `.claude-logs/` to `.gitignore` if not already present.

### Continuous Learning System

This project uses **automatic pattern extraction** from task reflections to improve future tasks.

**How it works:**
1. After `/banyan-reflect`, actionable learnings are extracted into `memory-bank/agent-rules/_learned/` as low-priority agent rules
2. Rules are organized by **topic** (e.g., `error-handling.md`, `testing-patterns.md`) — not per-task
3. New learnings amend existing topic files when possible (consolidate-first)
4. Rules are automatically loaded by sub-agents via the standard agent-rules system
5. Rules reinforced across multiple tasks are promoted to higher priority
6. Rules never reinforced expire after 90 days
7. During `/banyan-archive`, consolidation merges overlapping rules and prunes stale ones

**Files:**
- `memory-bank/agent-rules/_learned/*.md` - Auto-generated rules (topic-scoped, terse bullet directives)
- `memory-bank/learning-log.md` - Chronological record of all learning events
- `memory-bank/learning-metrics.md` - Configuration and effectiveness tracking

### User-Supplied Agent Rules

Projects can define custom agent rules in `memory-bank/agent-rules/` that get loaded contextually based on file patterns, paths, or topics. Run `/banyan-rules-index` to scan rules and generate the index. Sub-agents load matching rules based on files they're working on. Full documentation: `${CLAUDE_PLUGIN_ROOT}/docs/agent-rules-examples.md`

