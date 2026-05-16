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
│  Runtime: Python 3.11+                                       │
│  Framework: FastAPI + uvicorn                               │
│  Hosting: Render (free tier, 750 hrs/mo)                    │
├─────────────────────────────────────────────────────────────┤
│  DATABASE                                                   │
│  Primary: Neon Postgres (free tier, 512MB)                  │
│  Extensions: PostGIS + pg_h3                                │
│  Cache: Upstash Redis (free tier, 10K commands/day)         │
├─────────────────────────────────────────────────────────────┤
│  AUTH                                                       │
│  Provider: Supabase Auth (free tier, 50K MAU)               │
├─────────────────────────────────────────────────────────────┤
│  REAL-TIME (optional for MVP)                               │
│  Provider: Ably or Pusher free tier                         │
│  Alternative: Poll every 30 seconds                         │
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
- Python 3.11+ installed locally (backend)

### Step 1: Set Up Database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Save your connection string: `postgresql://user:pass@host/db`
4. Enable PostGIS extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
5. Run the schema SQL from above

### Step 2: Set Up Auth (Supabase)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to Settings → API and save:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Enable Email auth in Authentication → Providers

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
| Neon | 512MB storage | — |
| Supabase Auth | 50K users | — |
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
- [Neon Postgres](https://neon.tech/docs)
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

