# Project Brief — Territory Run

## Project Overview

**Territory Run** is a competitive, location-based game where runners claim hexagonal map cells by physically running through them. GPS traces are converted into H3 hex indices; the first/latest runner to pass through a cell owns it. Players compete for total cells/area and climb a global leaderboard.

## Goals

- MVP: capture run → encode to H3 → claim cells → render on shared map → rank on leaderboard.
- Free-tier deployable: Vercel (FE), Render (BE), Supabase (DB + Auth + Realtime), Upstash Redis (optional cache).
- Real-time territory updates via Supabase Realtime; polling fallback every 30s.
- Reference visuals: `stitch_territory_runner/*.html` (Stitch mockups — design truth).

## Key Stakeholders

- **Owner**: sahil@indee.tv (solo build, single GitHub repo `Baranwalsahil/runner`).
- **Users**: runners (primary), competitive social runners (secondary).

## Scope

In scope (MVP / Phase 1):
- Auth (Supabase email)
- Run ingest API, H3 cell claim pipeline (resolution 9)
- Territory map (MapLibre GL JS + h3-js), Battlefield screen, Player Dashboard, Leaderboard, Landing page
- Realtime cell updates + Redis leaderboard cache
- Free-tier deploy (Vercel + Render + Supabase)

Out of scope (Phase 2+):
- Team battles, decay/maintenance, native mobile, anti-cheat hardening, paid tiers.

## Repository Structure

- **Type**: Poly-repo (single repo, multiple sub-projects without workspace orchestrator)
- **Workspace Tool**: None (root `package-lock.json` is a stray artifact; no `workspaces`/`pnpm-workspace`/`turbo.json`)
- **Workspace Root**: N/A
- **Apps/Services**:
  - `client/` — React 19 + Vite 8 + Tailwind v3 frontend
  - `server/` — FastAPI (Python 3.13) backend, venv at `server/.venv`
- **Shared Packages**:
  - `shared/` — placeholder (planned for shared constants per CLAUDE.md, not yet populated)
- **Other top-level dirs**:
  - `tasks/` — sequenced task briefs (`tasks-01..13`)
  - `stitch_territory_runner/` — frozen HTML design mockups
  - `memory-bank/` — Banyan memory bank (this directory)
  - `progress.md` — legacy/root task progress log (mirrored by `memory-bank/progress.md`)

## Git Configuration

- **Repository**: Yes
- **Provider**: GitHub
- **CLI Available**: gh
- **Remote URL**: https://github.com/Baranwalsahil/runner.git
- **Default Branch**: main
- **Current Branch**: feat/banyan
- **Archive Strategy**: local-merge
  - Rationale: `CLAUDE.md` "Workflow: Per-task feat branch" mandates per-task `feat/task-NN-<slug>` branch → push → `git merge --no-ff` to local `main` → push `main` → delete branch. PRs are NOT part of the project workflow.
