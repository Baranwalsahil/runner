# Task Progress

- [x] complete: tasks-01-frontend-scaffold — done 2026-05-16. Vite+React+Tailwind v3 scaffold. 22/22 vitest tests pass. Dev server serves "TERRITORY RUN" with text-primary-fixed (#c3f400) Lexend on dark grid bg. glass-panel/neon-border-lime/neon-border-cyan/hex-mesh utilities present.
- [x] complete: tasks-02-shared-layout — done 2026-05-16. react-router-dom 7. Components: Icon, TopNavBar (NavLink active = lime border-b-2), AlertBar (conditional on message), Footer, Fab (navigates via prop), AppLayout (Outlet + chrome, AlertBar only on /dashboard). 4 routes wired. 45/45 vitest pass. All 4 routes return HTTP 200.
- [x] complete: tasks-03-landing-page — done 2026-05-16. Hero/FeatureGrid/MapPreview/CtaBanner ported from landing_page.html. CTAs route to /dashboard, /battlefield. Added .hex-grid CSS utility. AppLayout main relaxed to `pt-28 pb-xl` for full-bleed hero. 61/61 vitest pass. Curl confirms modules + compiled CSS.
- [x] complete: tasks-04-player-dashboard — done 2026-05-16. TerritoryDominance (7-bar mock chart), QuickRunStats, TerritoryMapPreview (static img+HUD overlays+zoom), RecentBattlesFeed (4 initial+8 extra, load-more swaps to "End of History" + check icon + disabled, scrollIntoView). AlertBar shows on /dashboard. 83/83 vitest pass. Curl 200 all modules.
- [x] complete: tasks-05-battlefield-map — done 2026-05-16. maplibre-gl + h3-js installed. lib/h3Utils (cellToBoundary + cellsToGeoJSON), lib/mapStyle (OSM raster + dark paint), data/mockCells (gridDisk k=4 around Seattle res 9, 4 owner colors). Components: MapCanvas (GeoJSON source/fill/line layers, click handler, setData on cells change), MapHud (live battles, zoom/locate/layers, legend), CellDetailPanel (h3Index/owner/ownership/CHALLENGE), PlayersOnline. Battlefield.jsx wires all + selectedCell state. maplibre-gl mocked in tests via __mocks__. 108/108 vitest pass. Curl 200 all modules; maplibre-gl.css imported into index.css.
- [x] complete: tasks-06-global-leaderboard — done 2026-05-16. data/mockLeaderboard (50 generated + current user, sorted by cells, deterministic). Components: Podium (top-3 asymmetric w/ CHAMPION badge), RankTable (sortable cells/area/streak, 10/page prev/next, highlights currentUserId), FilterChips (region + time, aria-pressed). Leaderboard.jsx wires filter+sort state. 136/136 vitest pass. Curl 200 all modules.
- [ ] pending: tasks-07-backend-scaffold
- [ ] pending: tasks-08-db-schema
- [ ] pending: tasks-09-auth-supabase
- [ ] pending: tasks-10-runs-api
- [ ] pending: tasks-11-territory-leaderboard-api
- [ ] pending: tasks-12-realtime-cache
- [ ] pending: tasks-13-deploy
