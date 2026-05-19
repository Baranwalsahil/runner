---
name: Tailwind / Stitch Port Patterns (Learned)
globs: ["client/src/**/*.{js,jsx,css}", "client/tailwind.config.js", "client/src/index.css"]
topics: ["tailwind", "css", "stitch", "design-system"]
priority: low
evidence_count: 3
---

# Tailwind / Stitch Port (Auto-extracted)

- Custom utilities go in `index.css` `@layer utilities`, NOT bare `.class { }` blocks — `@layer` keeps them JIT-purged and orderable. — TASK-001, TASK-003 (2×)
- Tailwind `content` glob MUST include `./index.html` AND `./src/**/*.{js,jsx}`. Missing either silently drops classes. — TASK-001 (1×)
- `html.dark` class (not `body.dark`) for Tailwind `darkMode: 'class'` to cascade everywhere. — TASK-001 (1×)
- Read the `.png` screenshot FIRST, then `.html`. HTML often contains dead sections the screenshot omits; splitting on HTML-only sections produces components that get deleted mid-task. — TASK-003 (1×)
- Padding adjustments for full-bleed routes belong on `AppLayout` main, not on the route component. — TASK-003 (1×)
- Localize external image URLs to `client/public/img/<route>/` before deploy. Inline external URLs (Google usercontent, etc.) risk breaking on future rebuilds. — TASK-003 (1×)
