# Creative — UI/UX — TASK-003 Landing Page

**Task**: TASK-003
**Type**: UI/UX
**Date**: 2026-05-16
**Status**: APPROVED + IMPLEMENTED

## Context

Port `stitch_territory_runner/landing_page.html` to React. The mockup defines the visual; design exploration is about how to translate dense single-file HTML into reusable React components without losing fidelity or introducing premature abstraction.

## Options Considered

### Option A — One big `Landing.jsx`
- Pros: 1:1 with HTML; minimal refactor risk.
- Cons: Hard to test sections; later changes touch a 400-line file; no reuse if CtaBanner-style strips appear elsewhere.

### Option B — Section-per-component split (CHOSEN)
- Pros: Each section gets its own test file; clear seams for future copy edits; CtaBanner reusable in pricing/about pages later.
- Cons: 5 new component files for a page that won't see frequent edits.

### Option C — Section components + a `<Section>` primitive
- Pros: Consistent spacing/padding tokens; one place to tweak section rhythm.
- Cons: Premature abstraction — only one page uses it right now.

## Decision

**Option B** — split into `Hero`, `FeatureGrid`, `MapPreview`, `CtaBanner`. Skip the `<Section>` primitive (Option C) until a second marketing page appears.

## Rationale

- The Stitch HTML already has clean semantic section boundaries (`<section>` tags) — splitting on them is mechanical, not speculative.
- Tests can target sections individually, which keeps the suite organized as content evolves.
- A `<Section>` primitive (Option C) would be a YAGNI violation: no second consumer.

## Implementation Notes

- `Hero` owns the primary CTA → `useNavigate('/dashboard')`.
- `CtaBanner` owns the secondary CTA → `useNavigate('/battlefield')`.
- `MapPreview` is a static teaser image; the real interactive map is `Battlefield` (TASK-005).
- Padding: `AppLayout` main relaxed to `pt-28 pb-xl` so the hero can full-bleed without a route-level override.
- `.hex-grid` utility added to `index.css` `@layer utilities` (lesson from TASK-001 reflection).

## Trade-offs Accepted

- External Google usercontent image URLs kept inline rather than localized to `public/img/landing/`. Risk: URL purge breaks build. Mitigation: localize before task-13 deploy. Tracked in archive carry-forward.

## Validation

- Lighthouse a11y: no heading/landmark errors.
- 61/61 vitest pass.
