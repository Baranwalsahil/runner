---
name: React Cleanup + Effects (Learned)
globs: ["client/src/**/*.jsx"]
topics: ["react", "useeffect", "memory-leak"]
priority: low
evidence_count: 2
---

# React Cleanup + Effects (Auto-extracted)

> Low-priority auto-extracted rules. Promote to `medium` after reinforcement.

- `useEffect` that constructs an external object (MapLibre `Map`, websocket, observer) MUST return a cleanup that disposes the object (`map.remove()`, `ws.close()`, `observer.disconnect()`). Stale instances on route unmount otherwise. — TASK-005 (1×)
- MapLibre source updates: use `source.setData(newGeoJSON)`, NOT `removeLayer + removeSource + addSource + addLayer`. Faster + avoids tile flicker + preserves pan/zoom. — TASK-005 (1×)
- Two-effect pattern: one effect for one-time init (init deps `[]`), one effect for prop-driven updates (deps `[cells]`). Don't conflate; keeps the contract explicit. — TASK-005 (1×)
- Third-party CSS belongs in `src/index.css` (`@import`), not in component files. Vite tree-shakes component-imported CSS on some build paths. — TASK-005 (1×)
- `scrollIntoView` ref pattern stable when lists are non-virtualized. Revisit if/when virtualization is added. — TASK-004 (1×)
