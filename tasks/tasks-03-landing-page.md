# Task 03 — Landing Page

## Goal

Port `stitch_territory_runner/landing_page.html` → `client/src/routes/Landing.jsx`. Marketing/intro page. CTA buttons route into app.

## Prereqs

- Tasks 01, 02 done

## Source of truth

- HTML: `stitch_territory_runner/landing_page.html`
- Screenshot: `stitch_territory_runner/landing_page.png`

## Files to create / edit

| Path | Purpose |
|------|---------|
| `client/src/routes/Landing.jsx` | Full port of `<main>` body |
| `client/src/components/landing/Hero.jsx` | Hero block (headline, sub, CTA) |
| `client/src/components/landing/FeatureGrid.jsx` | Feature cards section |
| `client/src/components/landing/HowItWorks.jsx` | Numbered steps section |
| `client/src/components/landing/StatsBand.jsx` | Big stat numbers band |
| `client/src/components/landing/CtaBanner.jsx` | Bottom CTA strip |

Split by section only if HTML has them. If single flowing layout, keep in `Landing.jsx`.

## Conversion rules

- `class=` → `className=`
- `<button data-icon="x">x</button>` → `<Icon name="x" />`
- Inline event handlers → React `onClick`
- External `src` URLs (Google usercontent) → keep as-is, OR download to `client/public/img/landing/` and rewrite paths. Prefer download for portability.
- Convert any inline `<script>` to `useEffect` hook (likely none for landing)

## CTAs

- "Start Running" / primary CTA → `navigate('/dashboard')`
- Secondary "Learn More" → smooth scroll to `#how-it-works` section

## Acceptance

- `/` route renders pixel-close to `landing_page.png` at 1440px viewport
- No raw HTML strings — all JSX
- Responsive: stacks vertically on `< md` breakpoint
- Lighthouse: no a11y errors for headings/landmarks

## Out of scope

- Auth signup form wiring — task 09
- Animation polish beyond what HTML already has
