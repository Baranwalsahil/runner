# Reflection — TASK-003: Landing Page

**Task**: TASK-003
**Completed**: 2026-05-16
**Complexity**: Level 2
**Branch**: feat/task-03-landing-page (merged)

## Outcome

`Hero`, `FeatureGrid`, `MapPreview`, `CtaBanner` extracted from `landing_page.html`. CTAs wired to `useNavigate('/dashboard' | '/battlefield')`. New `.hex-grid` utility added. `AppLayout` main relaxed to `pt-28 pb-xl` for full-bleed hero. 61/61 vitest.

## What Went Well

- Section-by-section component split (matching HTML semantic boundaries) made the port mechanical.
- Adding `.hex-grid` to `index.css` `@layer utilities` (lesson from TASK-001 reflection) — JIT-purged correctly.
- `AppLayout` main padding hack (`pt-28 pb-xl`) is route-agnostic — no per-route layout override needed.

## What Could Have Been Better

- Initially split HTML 1:1 with section tags including `HowItWorks` and `StatsBand`; mockup didn't actually call for those distinct sections in the final design. Removed mid-task. Lesson: read the screenshot AND the HTML before splitting components.
- External image URLs from Google usercontent kept in-place rather than downloaded to `public/img/landing/`. Works for MVP; rebuild will break if Google purges the URL. Should localize before deploy (task-13).

## Key Learnings

- **Stitch HTML port checklist**: read PNG screenshot first, then HTML — HTML often has dead sections (commented out or hidden) that the screenshot omits.
- **CTAs → `useNavigate`**: not `<Link>` when the CTA is a button visual; using `<button onClick={() => navigate(...)}>` keeps `<a>` semantics for true links.
- **Padding adjustment lives on AppLayout, not the route**: routes describe their content; chrome owns its padding. Avoided diverging padding per route.

## Process Notes

- Curl checks (`curl -s -o /dev/null -w "%{http_code}\n"` on each module URL) gave a fast smoke signal that Vite's module resolution worked before booting the page.

## Action Items Carried Forward

- Localize external usercontent image URLs to `client/public/img/landing/` before task-13 deploy.
