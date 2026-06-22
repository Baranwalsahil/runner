# Territory Run — Task Index

Build plan derived from `claude.md` + Stitch HTML mockups in `stitch_territory_runner/`.

## Sequence

Tasks run strictly in order — later tasks depend on earlier scaffolding.

| # | File | Title | Layer | Est. effort |
|---|------|-------|-------|-------------|
| 01 | [tasks-01-frontend-scaffold.md](./tasks-01-frontend-scaffold.md) | Frontend scaffold (Vite + React + Tailwind theme) | FE | S |
| 02 | [tasks-02-shared-layout.md](./tasks-02-shared-layout.md) | Shared layout (TopNav, AlertBar, Footer, FAB) + router | FE | M |
| 03 | [tasks-03-landing-page.md](./tasks-03-landing-page.md) | Port Landing Page screen | FE | M |
| 04 | [tasks-04-player-dashboard.md](./tasks-04-player-dashboard.md) | Port Player Dashboard (incl. scroll battles fix) | FE | M |
| 05 | [tasks-05-battlefield-map.md](./tasks-05-battlefield-map.md) | Port Battlefield Map (MapLibre + h3-js) | FE | L |
| 06 | [tasks-06-global-leaderboard.md](./tasks-06-global-leaderboard.md) | Port Global Leaderboard | FE | M |
| 07 | [tasks-07-backend-scaffold.md](./tasks-07-backend-scaffold.md) | Backend scaffold (FastAPI, env, healthcheck) | BE | S |
| 08 | [tasks-08-db-schema.md](./tasks-08-db-schema.md) | Postgres + PostGIS schema + migrations | DB | M |
| 09 | [tasks-09-auth-jwt.md](./tasks-09-auth-jwt.md) | Own JWT auth (bcrypt + python-jose, no IdP) | Auth | M |
| 10 | [tasks-10-runs-api.md](./tasks-10-runs-api.md) | Runs ingest → H3 claim → DB upsert | BE | L |
| 11 | [tasks-11-territory-leaderboard-api.md](./tasks-11-territory-leaderboard-api.md) | Territory + Leaderboard GET endpoints | BE | M |
| 12 | [tasks-12-realtime-cache.md](./tasks-12-realtime-cache.md) | Redis cache + polling/real-time updates | Infra | M |
| 13 | [tasks-13-deploy.md](./tasks-13-deploy.md) | Vercel + Render + managed Postgres deploy | DevOps | M |
| 14 | [tasks-14-run-pause-finish.md](./tasks-14-run-pause-finish.md) | Run session: Pause/Resume + Finish + refresh-safe persistence | FE | M |
| 15 | [tasks-15-dashboard-run-history-chart.md](./tasks-15-dashboard-run-history-chart.md) | Dashboard run-history bar chart (30-day slider + per-run drill-down) | FE | M |
| 16 | [tasks-16-run-elevation.md](./tasks-16-run-elevation.md) | Average elevation: capture GPS altitude → store per run → show in dashboard RUN.DETAIL card | FE+BE | M |
| 17 | [tasks-17-growth-weight-projection.md](./tasks-17-growth-weight-projection.md) | Growth page: weight goal + run-trend → days-to-goal projection, daily calorie burn, computed speed-up scenarios | FE+BE | L |
| 18 | [tasks-18-user-chosen-color.md](./tasks-18-user-chosen-color.md) | User picks territory color at signup → stored on user → renders owned hexes on Dashboard + Battlefield | FE+BE | M |


## Rules

- Don't skip ahead. Earlier task wires deps later tasks assume.
- Each task file = self-contained brief: goal, prereqs, install cmds, files, acceptance.
- Mockups in `/home/sahil/runner/stitch_territory_runner/*.html` are reference truth for visuals.
- Tech stack locked by `claude.md` § Tech Stack. No substitutions without flagging.

## Working directory layout (final)

```
runner/
├── claude.md
├── stitch_territory_runner/   # design refs (DO NOT edit further)
├── tasks/                     # this folder
├── client/                    # built in tasks 01-06
├── server/                    # built in tasks 07-12
└── shared/                    # built in task 08
```
