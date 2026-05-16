# Task 06 — Global Leaderboard

## Goal

Port `stitch_territory_runner/global_leaderboard.html` → `client/src/routes/Leaderboard.jsx`. Mock data tabletop, sortable/filterable UI shell.

## Prereqs

- Tasks 01, 02 done

## Source of truth

- HTML: `stitch_territory_runner/global_leaderboard.html`
- Screenshot: `stitch_territory_runner/global_leaderboard.png`

## Files to create

| Path | Purpose |
|------|---------|
| `client/src/routes/Leaderboard.jsx` | Compose podium + table + filter chips |
| `client/src/components/leaderboard/Podium.jsx` | Top 3 players (gold/silver/bronze visual) |
| `client/src/components/leaderboard/RankTable.jsx` | Paginated table: rank, user, cells, area m², streak, region |
| `client/src/components/leaderboard/FilterChips.jsx` | Filter by region (Global / Seattle / Friends), time (All-time / Weekly / Daily). Local state for now. |
| `client/src/data/mockLeaderboard.js` | ~50 mock players: `{rank, username, avatar, cells, areaM2, streak, region}` |

## Conversion rules

- Same as tasks 03/04
- Avatar images: use `https://i.pravatar.cc/64?u=<username>` as placeholder OR download a few to `client/public/img/avatars/`

## Acceptance

- `/leaderboard` renders close to `global_leaderboard.png`
- Filter chip clicks update visible rows (purely client-side filter on mock array)
- Table sortable by clicking column headers (cells, area, streak)
- Pagination: 10 per page w/ prev/next

## Out of scope

- Real leaderboard API — task 11
- Friend system — out of MVP
