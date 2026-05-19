# Archive — TASK-003: Landing Page

**Task**: TASK-003
**Complexity**: Level 2
**Status**: COMPLETE
**Archived**: 2026-05-19 (retroactive — task closed 2026-05-16)
**Branch**: feat/task-03-landing-page (merged → main, deleted)

## Summary

`Hero`, `FeatureGrid`, `MapPreview`, `CtaBanner` extracted from `landing_page.html`. CTAs route to `/dashboard` and `/battlefield`. `.hex-grid` utility added. `AppLayout` main relaxed to `pt-28 pb-xl` for full-bleed hero.

## Acceptance Criteria — Outcome

| AC | Status |
|----|--------|
| AC-ENTRY-1 `/` renders all 4 landing components | PASS |
| AC-HAPPY-1 Primary CTA → `/dashboard` | PASS |
| AC-HAPPY-2 Secondary CTA → `/battlefield` | PASS |
| AC-HAPPY-3 All JSX, responsive `<md` stack | PASS |
| AC-ERROR-1 No console + a11y errors | PASS |

## Files Created / Modified

- `client/src/components/landing/{Hero,FeatureGrid,MapPreview,CtaBanner}.jsx`
- `client/src/components/landing/*.test.jsx`
- `client/src/routes/Landing.jsx` (compose + CTA wiring)
- `client/src/index.css` (added `.hex-grid` in `@layer utilities`)
- `client/src/components/AppLayout.jsx` (main padding adjusted)

## Test Outcome

- Vitest: 61/61 PASS
- Curl 200 on each new module URL (Hero, FeatureGrid, MapPreview, CtaBanner)

## Linked Documents

- Source brief: [tasks/tasks-03-landing-page.md](../../tasks/tasks-03-landing-page.md)
- Plan: [tasks/TASK-003.md](../tasks/TASK-003.md)
- Creative: [creative/TASK-003-landing-uiux.md](../creative/TASK-003-landing-uiux.md)
- Reflection: [reflection/reflection-TASK-003.md](../reflection/reflection-TASK-003.md)

## Carry-forward TODOs

- Localize external Google usercontent image URLs to `client/public/img/landing/` before task-13 deploy.
