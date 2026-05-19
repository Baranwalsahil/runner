# TASK-003: Landing Page

**Complexity**: Level 2
**Status**: COMPLETE
**Roadmap**: N/A (would map to FEAT-FE-LANDING retroactively)
**Branch**: feat/task-03-landing-page (merged → main)
**Worktree**: N/A
**Source brief**: [tasks/tasks-03-landing-page.md](../../tasks/tasks-03-landing-page.md)

## Task Description

Port `stitch_territory_runner/landing_page.html` → `client/src/routes/Landing.jsx`. Marketing/intro page. CTAs route into the app (`/dashboard`, `/battlefield`). Split into `Hero`, `FeatureGrid`, `MapPreview`, `CtaBanner` per HTML sections. Added `.hex-grid` CSS utility. Relaxed `AppLayout` main to `pt-28 pb-xl` for full-bleed hero.

## User Journey Definition

**Feature Type**: End-User Feature (public marketing screen)
**Creative Phase Required**: Yes (UI/UX — port decisions documented in creative/TASK-003-landing-uiux.md)

### Invocation Method
- **Location**: root `/` route
- **Element**: primary CTA in Hero ("Start Running"), secondary CTAs in CtaBanner
- **Visibility**: always (unauthenticated landing)
- **Navigation**: CTA → `navigate('/dashboard')` or `navigate('/battlefield')`

### Success Criteria
- **User sees**: pixel-close render to `landing_page.png` at 1440px viewport.
- **User can verify at**: `http://localhost:5173/`
- **Data persisted**: none.
- **Observable within**: page load.

### Acceptance Criteria
- AC-ENTRY-1: `/` route renders Hero + FeatureGrid + MapPreview + CtaBanner.
- AC-HAPPY-1: Primary CTA navigates to `/dashboard`.
- AC-HAPPY-2: Secondary CTA navigates to `/battlefield`.
- AC-HAPPY-3: No raw HTML strings — all JSX; responsive stacks on `<md`.
- AC-ERROR-1: No console errors; no a11y errors for headings/landmarks (Lighthouse).

## Test Strategy

### Approach
- **Emphasis**: component render tests + CTA navigation tests.
- **Target test count**: ~16 tests across landing components.

### File Organization
- New co-located: `Hero.test.jsx`, `FeatureGrid.test.jsx`, `MapPreview.test.jsx`, `CtaBanner.test.jsx`, `Landing.test.jsx`.

### What NOT to Test
- Visual fidelity to PNG — human gate.
- External image URLs.

## Implementation Roadmap

- [x] Phase 1: Extract `Hero` from HTML (headline, sub, primary CTA)
- [x] Phase 2: Extract `FeatureGrid` (feature cards)
- [x] Phase 3: Extract `MapPreview` (static teaser image)
- [x] Phase 4: Extract `CtaBanner` (bottom CTA strip)
- [x] Phase 5: Add `.hex-grid` utility to `index.css`
- [x] Phase 6: Relax `AppLayout` main → `pt-28 pb-xl`
- [x] Phase 7: Wire CTAs → `useNavigate()`
- [x] Phase 8: Vitest run → 61/61 pass

## Creative Phases

- [x] UI/UX design → [creative/TASK-003-landing-uiux.md](../creative/TASK-003-landing-uiux.md)

---

## Execution State

**Build Status**: IDLE
**Last Completed**: 2026-05-16
**Can Resume**: NO (COMPLETE)

### Completed Steps
- 2026-05-16: 4 landing components extracted + CTAs wired + 61/61 tests pass
- 2026-05-16: merged feat/task-03-landing-page → main
