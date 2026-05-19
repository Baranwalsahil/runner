# Task 02 — Shared Layout + Routing

## Goal

Extract reusable chrome (top nav, alert bar, footer, FAB) into shared layout. Wire React Router with 4 placeholder routes. Active nav link reflects current route.

## Prereqs

- Task 01 done

## Install

```bash
cd /home/sahil/runner/client
npm install react-router-dom
```

## Files to create

| Path | Purpose |
|------|---------|
| `client/src/components/Icon.jsx` | `<Icon name="notifications" />` → `<span className="material-symbols-outlined" data-icon={name}>{name}</span>` |
| `client/src/components/TopNavBar.jsx` | Fixed header. Links: Battlefield (`/battlefield`), Dashboard (`/dashboard`), Leaderboard (`/leaderboard`). Use `NavLink` for active state (lime underline). Notifications + account icon buttons (no behavior yet). |
| `client/src/components/AlertBar.jsx` | Props: `message`, `ctaLabel`, `onCta`. Render only if message present. Reclaim button styled per mockup. |
| `client/src/components/Footer.jsx` | Static link list from mockup. |
| `client/src/components/Fab.jsx` | Bottom-right "Start Session" expand-on-hover button. Props: `to` (route to navigate). |
| `client/src/components/AppLayout.jsx` | Wraps `<Outlet />` between TopNavBar + (optional) AlertBar + Footer + Fab. `<main>` uses `mt-32 px-margin-safe max-w-7xl mx-auto`. |
| `client/src/routes/Landing.jsx` | Stub: `<h1>Landing</h1>` |
| `client/src/routes/Dashboard.jsx` | Stub |
| `client/src/routes/Battlefield.jsx` | Stub |
| `client/src/routes/Leaderboard.jsx` | Stub |
| `client/src/App.jsx` | `<BrowserRouter>` + `<Routes>` mapping: `/` Landing, `/dashboard` Dashboard, `/battlefield` Battlefield, `/leaderboard` Leaderboard. All wrapped in `<AppLayout>`. |

## Acceptance

- Visiting `/`, `/dashboard`, `/battlefield`, `/leaderboard` swaps inner content
- Active nav link shows lime underline (`border-b-2 border-primary-fixed`)
- AlertBar hidden when no `message` prop; visible on Dashboard per mockup
- FAB persistent across all routes
- No console errors

## Out of scope

- Real page content — tasks 03-06
- Auth-gated routes — task 09
