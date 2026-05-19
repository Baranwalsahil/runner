# Product Brief

## Product Overview

- **Name**: Territory Run
- **Value Proposition**: Turn everyday runs into a competitive map-claim game — runners physically claim hex cells on a shared map and battle for territory dominance.
- **Product Type**: Web app (mobile-responsive); future native mobile (React Native, Phase 4)
- **Stage**: MVP build in progress (frontend FE 01–06 complete, backend BE 07 complete, 08–13 pending)

## Key Functionality

- Capture GPS run trace → encode to H3 hex cells → upsert cell ownership
- Steal-on-run competition mode (first MVP rule: latest runner through a cell owns it)
- Battlefield map: live hex grid with owner colors, click-to-inspect cell, FAB to start run
- Player dashboard: territory dominance chart, recent battles feed, quick stats
- Global leaderboard: top players by cells/area/streak, filter by region + time window
- Real-time map updates when peers claim cells (Supabase Realtime; 30s polling fallback)

## Markets Serviced

- **Primary Market**: Competitive recreational runners (Strava/Zwift-adjacent audience)
- **Secondary Markets**: Fitness app users, gamified-fitness communities
- **Geographic Focus**: Global (English-only MVP)
- **Market Size**: [To be determined]

## Competitive Landscape

- **Direct Competitors**: Fog of World, Turf (Swedish app), Pokémon GO-style claim games
- **Indirect Competitors**: Strava (segments), Zwift, Apple Fitness+
- **Key Differentiators**:
  - Pure GPS-trace → hex claim (no QR codes or in-person checkins)
  - Free-tier infra → free product
  - Steal-on-run dynamic (ongoing competition, not first-come-forever)
- **Competitive Advantages**: H3-based uniform geometry (no diagonal ambiguity), real-time map updates

## Key Personas

### Primary Users

| Persona | Role | Goals | Pain Points | Success Metrics |
|---------|------|-------|-------------|-----------------|
| Competitive Runner | Recreational athlete | Claim more cells than rivals; visualize routes as territory | Existing trackers (Strava) feel passive; segments don't push variation | Cells owned, weekly rank delta, route variety |
| Casual Runner | Fitness-curious | Make daily runs feel like a game | Loses motivation; runs become routine | Streak length, area covered |

### Secondary Users

| Persona | Role | Goals |
|---------|------|-------|
| Spectator | Friend/follower (Phase 3) | Watch a runner's territory grow without running themselves |

### Administrators/Operators

| Persona | Role | Responsibilities |
|---------|------|------------------|
| Owner (sahil) | Solo operator | Deploy, monitor free-tier quotas, handle anti-cheat reports |

## User Flows

- **Primary Flow**: Open app → land on Battlefield map → tap FAB → record run with GPS → end run → see claimed cells update on map + leaderboard rank delta
- **Onboarding**: Landing page → CTA → signup (email via Supabase) → land on Dashboard → tutorial overlay (planned)
- **Key Workflows**:
  - Submit a run and watch territory update in realtime
  - Browse global leaderboard, filter by region/time
  - Inspect a contested cell (who owns it, claim history)

## Success Metrics & KPIs

### Business Metrics
- [To be determined — free product MVP]

### Product Metrics
- DAU / MAU
- Median cells claimed per active user per week
- Realtime channel concurrency (must stay <200 on Supabase free)

### Technical Metrics
- p95 `POST /runs` latency < 1s for traces ≤500 GPS points
- p95 `GET /territory` viewport query < 300ms
- Backend uptime ≥ 99% (Render free tier sleep on idle is acceptable)
- Free-tier limit headroom: Postgres <400MB, Render <750h, Redis <8K cmd/day

## Non-Functional Requirements

### Performance

- **Response Time**: p95 < 300ms for territory reads, < 1s for run submission
- **Throughput**: ~10 req/s sustained (free-tier expected load)
- **Concurrent Users**: <200 concurrent Realtime subscribers (Supabase free cap)

### Scalability

- **Users**: 0–1,000 free tier; scales to 5,000 with paid Supabase ($25/mo, see CLAUDE.md "Cost Scaling Reference")
- **Data Volume**: 500MB Postgres cap forces archival of inactive cells after 30 days (planned Phase 3)
- **Peak Load**: ~2× average (commute-time clustering)

### Security

- **Authentication**: Supabase Auth (email/password MVP; OAuth providers Phase 2)
- **Authorization**: Row-level — users can only insert their own runs; reads on `claimed_cells`/leaderboard are public
- **Compliance**: None required for MVP (no enterprise customers; no PHI/PCI)
- **Data Classification**: PII = email; GPS traces = sensitive location data
- **Encryption**: TLS in transit (Vercel/Render/Supabase managed); at rest via Supabase Postgres encryption

### Availability & Reliability

- **Uptime Target**: 99% (free tier — Render sleeps after 15min idle; cold-start <30s is acceptable)
- **RTO**: 4 hours (manual redeploy)
- **RPO**: 24 hours (Supabase free backup cadence)
- **DR**: None (free tier, single region)
- **Backup**: Supabase daily snapshots

### Data & Privacy

- **Data Residency**: Closest Supabase region to user base (default us-east)
- **Data Retention**: GPS traces retained indefinitely; cells archived after 30d inactivity (Phase 3)
- **Privacy**: GDPR-best-effort — delete user → cascade run + null cell ownership
- **PII Handling**: Email + GPS trace; never logged
- **Data Portability**: [Phase 2 — export runs as GPX]
- **Right to Deletion**: `DELETE /auth/me` cascades runs and nulls cell `user_id`

### Accessibility

- **Target Compliance**: WCAG 2.1 AA best-effort
- **Key Requirements**:
  - [ ] Screen reader compatibility (mockups use non-semantic divs; FE polish pending)
  - [x] Keyboard navigation (react-router NavLink, ARIA on FilterChips)
  - [x] Color contrast (lime #c3f400 on dark bg meets AA per FE design tokens)
  - [x] Focus indicators (Tailwind default ring)
  - [ ] Alt text for map (canvas-based; needs textual description)

### Internationalization (i18n)

- **Supported Languages**: English only (MVP)
- **Localization Needs**: deferred

### Browser/Platform Support

- **Browsers**: Chrome, Firefox, Safari, Edge (evergreen)
- **Mobile**: iOS Safari, Android Chrome (PWA candidate)
- **Desktop**: Any modern browser

## Integration Points

### External Systems

| System | Purpose | Protocol | Direction |
|--------|---------|----------|-----------|
| Supabase | Auth + Postgres + Realtime | HTTPS + WSS | Both |
| Upstash Redis | Leaderboard cache | TLS Redis | Both |
| MapTiler / OSM | Map tiles | HTTPS | Outbound |
| Vercel | FE hosting | n/a | n/a |
| Render | BE hosting | n/a | n/a |

### APIs Consumed

| API | Provider | Purpose |
|-----|----------|---------|
| Supabase Auth | Supabase | Sign up, sign in, JWT issuance |
| Supabase Postgres | Supabase | Persistent storage |
| Supabase Realtime | Supabase | Cell-change push |
| Upstash Redis | Upstash | Leaderboard + cache |
| OSM tile / MapTiler | OSM / MapTiler | Base map raster tiles |

### APIs Provided

| API | Purpose | Consumers |
|-----|---------|-----------|
| `POST /runs` | Ingest GPS trace, claim cells | client/ |
| `GET /runs`, `GET /runs/:id` | Run history | client/ |
| `GET /territory` | Viewport cells | client/ |
| `GET /territory/user/:id` | User's cells | client/ |
| `GET /leaderboard` | Top players | client/ |
| `GET /health` | Healthcheck | Render monitoring, client/ uptime |

### Data Sources

| Source | Type | Frequency |
|--------|------|-----------|
| Mobile GPS | Browser Geolocation API | Real-time (during run) |
| Supabase Realtime | CDC | Push (per-row change) |

## Constraints & Assumptions

### Business Constraints

- **Budget**: $0/mo target (free tier only)
- **Timeline**: 13 sequenced tasks (`tasks-01..13`); no fixed deadline
- **Resources**: Solo build by sahil

### Technical Constraints

- Browser Geolocation API requires HTTPS in production (Vercel handles)
- Supabase Realtime free tier capped at 200 concurrent subscribers
- Render free tier sleeps after 15min idle → cold start latency on `GET /health` warm-up

### Assumptions

- Users grant precise location permission
- GPS accuracy meaningful enough for H3 res 9 (~100m) cells
- Single region (us-east) latency acceptable globally for MVP

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GPS spoofing | High | Medium | Rate limit cells/hour, speed-based outlier rejection, community reporting (Phase 3) |
| Free-tier quota exhaust | Medium | High | Quota dashboards; clear upgrade path to $25/mo tier per CLAUDE.md cost table |
| Realtime concurrency cap (200) | Medium | High | Polling fallback already designed in; partition channels per region (Phase 3) |
| Battery drain during tracking | High | Medium | Batched GPS upload; manual start/stop only; lower sample rate when speed steady |
| Cold-start UX (no players nearby) | High | High | Seed ghost territories; focused neighborhood launch (Phase 3) |

## Open Questions

- [ ] Decide cell-decay policy (MVP: none; Phase 3: 30-day inactivity)
- [ ] OAuth providers timing (Apple/Google) — Phase 2
- [ ] PWA vs React Native for mobile (defer to Phase 4)

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-05-19 | /banyan-init (Claude) | Initial creation from CLAUDE.md + tasks/ + code state |

## Last Refreshed

2026-05-19
