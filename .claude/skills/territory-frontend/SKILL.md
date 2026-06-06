---
name: territory-frontend
description: Conventions for the Territory Run frontend (client/ — Vite + React + Tailwind v3, MapLibre GL + h3-js, Vitest). Use when adding routes/components/styles, wiring the API client, rendering the hex map, or writing Vitest tests under client/. Do not touch server/ (backend domain).
---

# Territory Run — Frontend Conventions

Stack: Vite + React (JSX), Tailwind v3, MapLibre GL JS + h3-js for hex rendering, Vitest. Dev server port `5173`. API base from `VITE_API_URL` (default `http://localhost:8000`).

## Layout

```
client/src/
  App.jsx  main.jsx  index.css
  routes/        page-level route components
  components/    AppLayout, TopNavBar, Footer, Fab, AlertBar, Icon
                 auth/ battlefield/ dashboard/ landing/ leaderboard/ run/
  hooks/         useGeolocation, useTerritory, useAuth (+ others)
  lib/           api.js (API client), auth.js (JWT/localStorage),
                 h3Utils.js (H3 helpers), mapStyle.js (MapLibre style)
  data/  assets/  test/
```

Feature components are grouped by domain folder under `components/`. Match the existing folder when adding to a feature.

## Conventions

- **API calls** go through `lib/api.js` — don't `fetch` ad hoc in components. JWT stored + read via `lib/auth.js` (localStorage).
- **Data fetching** via hooks (`hooks/useTerritory.js`, `useAuth.js`, `useGeolocation.js`). Polling cadence: territory 15s, leaderboard 30s, paused when tab hidden (no WebSocket at MVP).
- **Styling**: Tailwind v3 utilities + design tokens in `tailwind.config.js`. Reuse tokens; don't hardcode hex colors that duplicate a token.
- **Map / hexes**: MapLibre via `lib/mapStyle.js`; H3 cell → polygon helpers in `lib/h3Utils.js`. Owner colors come from the shared `OWNER_PALETTE` (`shared/constants.js`, `H3_RESOLUTION=9`).
- **Shared constants**: `shared/constants.js` (mirror of `shared/constants.py`) — keep in sync; don't redefine game rules in the client.

## Commands (from client/)

```bash
npm run dev          # vite :5173
npm run build
npm test             # vitest run
npm run test:watch
npm run lint         # eslint
```

Tests live in `src/test/` (or co-located) — Vitest. Run `npm test` before pushing.

Deploy preset: Vite on Vercel; `vercel.json` has SPA catch-all rewrite so hard-refresh on client routes doesn't 404.

## Rules

- Stay in `client/` + `shared/`. Refuse `server/` edits — that's backend domain.
- Every change → branch + PR. Never commit to `main`, never merge locally (CLAUDE.md).
