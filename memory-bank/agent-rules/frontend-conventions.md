---
name: Frontend Conventions
globs: ["client/**/*.{js,jsx}", "client/**/*.test.{js,jsx}"]
paths: ["client/"]
topics: ["frontend", "react", "vitest", "tailwind"]
priority: high
---

# Frontend Conventions (client/)

Distilled from TASK-001 through TASK-006. These are project-locked.

## React + Routing

- React 19 + react-router-dom 7. Use `NavLink className=({isActive}) => ...` for active-state styling; don't roll your own `useLocation` matcher.
- Shared chrome (TopNav, AlertBar, Footer, Fab) lives in `AppLayout` wrapping `<Outlet />`. Route components own content only.
- Route-level state ownership: when state is shared across child components (e.g. filter + sort + page on Leaderboard), own it at the route, pass it down. No prop-drilling pain because depth is ≤2.

## Tailwind

- Tailwind v3.4. Stick with v3 (v4 PostCSS plugin contract still churning).
- `content` glob MUST include `./index.html` AND `./src/**/*.{js,jsx}` — missing either silently drops classes.
- Custom utilities go in `index.css` inside `@layer utilities` so JIT can purge them. Plain CSS blocks bypass purging and order semantics.
- Design tokens live in `tailwind.config.js`, ported from `stitch_territory_runner/*.html` `<script id="tailwind-config">`. Don't re-design — match Stitch.

## CSS Imports

- Third-party CSS (e.g. `maplibre-gl/dist/maplibre-gl.css`) goes in `src/index.css` via `@import`, NOT in component files. Vite tree-shakes component-imported CSS on some build paths.

## Component Tests

- Vitest 4 + @testing-library/react 16 + `@testing-library/jest-dom` matchers (loaded once via `src/test/setup.js`).
- Co-locate `Component.test.jsx` next to `Component.jsx`.
- One `describe('<Component>', ...)` per file; group by behavior (not by method).
- Query by role/text, not class name (brittle to refactor).

## State Patterns

- For binary UX states (e.g. "list initial" vs "list full + terminal CTA"), use a single boolean (`loaded`) — not a phase enum. Boolean state matches the two-state user mental model.
- For load-more lists: keep mock data in component until a real API hook replaces it. Swap point is the data import, not the component shape.
- For sortable tables: `useMemo(() => [...data].sort(...))` is fine up to ~1000 rows; beyond that, virtualize + server-side sort.

## Mocking External Libs

- Canvas/WebGL libs (MapLibre, etc.) → `client/src/__mocks__/<lib>.js` exporting vi-stubbed methods. Vitest auto-resolves by filename match.
- Don't try to test rendered map output in unit tests. Test React state transitions instead; gate visual fidelity on human review.

## Cleanup Discipline

- `useEffect` that constructs an external object (map, observer, websocket) MUST return a cleanup that disposes it. Stale instances during route navigation otherwise.

## A11y From The Start

- Toggle/filter buttons: set `aria-pressed`. Don't retrofit.
- Headings/landmarks: respect H1→H2 order; one H1 per route.
- Keyboard nav: NavLinks are keyboard-navigable by default; don't override `tabIndex` unless removing a known issue.

## Color-by-id

- When assigning colors deterministically per user/owner/category, hash the id and look up in a palette. Don't index by array position — order shouldn't influence color.
