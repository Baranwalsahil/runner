# Task Registry

Source briefs in `/tasks/tasks-NN-*.md`. Live status in `/progress.md` (root).

| Task ID | Source Brief | Title | Layer | Complexity | Phase | Status |
|---------|--------------|-------|-------|------------|-------|--------|
| TASK-001 | tasks-01-frontend-scaffold | Frontend scaffold (Vite + React + Tailwind theme) | FE | Level 1 | ARCHIVED | COMPLETE |
| TASK-002 | tasks-02-shared-layout | Shared layout (TopNav, AlertBar, Footer, FAB) + router | FE | Level 2 | ARCHIVED | COMPLETE |
| TASK-003 | tasks-03-landing-page | Port Landing Page screen | FE | Level 2 | ARCHIVED | COMPLETE |
| TASK-004 | tasks-04-player-dashboard | Port Player Dashboard (incl. scroll battles fix) | FE | Level 2 | ARCHIVED | COMPLETE |
| TASK-005 | tasks-05-battlefield-map | Port Battlefield Map (MapLibre + h3-js) | FE | Level 3 | ARCHIVED | COMPLETE |
| TASK-006 | tasks-06-global-leaderboard | Port Global Leaderboard | FE | Level 2 | ARCHIVED | COMPLETE |
| TASK-007 | tasks-07-backend-scaffold | Backend scaffold (FastAPI, env, healthcheck) | BE | Level 2 | ARCHIVED | COMPLETE |
| TASK-008 | tasks-08-db-schema | Postgres + PostGIS schema + migrations | DB | TBD | PENDING | PENDING |
| TASK-009 | tasks-09-auth-supabase | Supabase auth (FE + BE JWT verify) | Auth | TBD | PENDING | PENDING |
| TASK-010 | tasks-10-runs-api | Runs ingest → H3 claim → DB upsert | BE | TBD | PENDING | PENDING |
| TASK-011 | tasks-11-territory-leaderboard-api | Territory + Leaderboard GET endpoints | BE | TBD | PENDING | PENDING |
| TASK-012 | tasks-12-realtime-cache | Redis cache + polling/real-time updates | Infra | TBD | PENDING | PENDING |
| TASK-013 | tasks-13-deploy | Vercel + Render + Supabase deploy | DevOps | TBD | PENDING | PENDING |

## Notes

- Phase legend: `PENDING` → `PLANNED` (plan exists) → `BUILDING` → `REFLECTED` → `ARCHIVED`.
- Status legend: `PENDING` / `IN_PROGRESS` / `PAUSED` / `COMPLETE`.
- TASK-001..007 backfilled into Banyan format 2026-05-19 from completed work 2026-05-16. Plans, reflections, archives exist; creative docs exist for TASK-003/004/005/007 where design exploration was meaningful.
- Pending tasks (008–013) still drive off `/tasks/tasks-NN-*.md` briefs + per-task feat-branch workflow in CLAUDE.md. They will get Banyan TASK-NNN files when picked up.
