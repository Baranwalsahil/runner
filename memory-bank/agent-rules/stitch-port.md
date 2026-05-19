---
name: Stitch HTML Port Conventions
globs: ["client/src/routes/**", "client/src/components/**"]
paths: ["stitch_territory_runner/", "client/src/"]
topics: ["frontend", "stitch", "design-system", "port"]
priority: high
---

# Stitch HTML → React Port Conventions

Mockups in `stitch_territory_runner/*.html` are visual truth. Distilled from TASK-003 through TASK-006.

## Read Order Before Splitting

1. **Open the `.png` screenshot first** to understand the intended final layout.
2. **Then read the `.html`** — it often has dead sections (commented out, hidden) that the screenshot omits.
3. Split components on actual rendered sections, not on every `<section>` tag in the HTML.

## Mechanical Conversion Rules

- `class=` → `className=`
- `<button data-icon="x">x</button>` → `<Icon name="x" />`
- Inline `onclick="..."` → React `onClick={() => ...}`
- Inline `<script>` → `useEffect` hook (if any DOM logic was vanilla JS)
- `data-alt` → `alt`
- External image URLs (Google usercontent, etc.) → keep inline for MVP; localize to `client/public/img/<route>/` before deploy (task-13).

## CTAs

- Internal navigation: `useNavigate()` from react-router-dom, not `<Link>` when the button is visual.
- Same-page anchors (e.g. "Learn More" → `#how-it-works`): smooth-scroll handler in `onClick`.

## Custom CSS Utilities

- All Stitch-derived utilities (e.g. `.hex-grid`, `.hex-mesh`, `.glass-panel`, `.neon-border-*`) live in `client/src/index.css` inside `@layer utilities`. NOT bare `.class { }` blocks — those bypass Tailwind JIT/purge.

## Test Discipline Per Port

- One `*.test.jsx` per new component, co-located.
- Assert render of headline / CTA text + click handler invocation.
- Don't assert pixel positions, color values, or visual fidelity — that's the screenshot's job.

## Don't Re-design

- If the Stitch mockup says lime `#c3f400`, use the `text-primary-fixed` token. Don't pick a similar lime "because it's closer to the brand."
- If component split feels speculative (e.g. extracting a `<Section>` primitive used once), don't. YAGNI until a second consumer appears.

## Padding / Layout

- Padding adjustments for full-bleed sections (hero, etc.) belong on `AppLayout`, not the route. Routes describe content; chrome owns spacing.
