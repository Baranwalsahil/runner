# Task 01 — Frontend Scaffold

## Goal

Bootstrap `client/` Vite+React app with Tailwind preconfigured to match Stitch design tokens (colors, fonts, spacing, radii). No screens yet — just empty app shell that boots.

## Prereqs

- Node 18+ (confirmed v20.20.0)
- claude.md § Tech Stack
- Reference: any `stitch_territory_runner/*.html` `tailwind.config` block — copy theme verbatim

## Install / commands

```bash
cd /home/sahil/runner
npm create vite@latest client -- --template react
cd client
npm install
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

## Files to create / edit

| Path | Purpose |
|------|---------|
| `client/tailwind.config.js` | Port `colors`, `borderRadius`, `spacing`, `fontFamily`, `fontSize` from HTML `<script id="tailwind-config">`. `darkMode: "class"`. `content: ["./index.html","./src/**/*.{js,jsx}"]`. |
| `client/postcss.config.js` | Default tailwind + autoprefixer |
| `client/src/index.css` | `@tailwind base/components/utilities` + body bg + hex-mesh + glass-panel + neon-border-* utilities (copy `<style>` block from HTML, convert to plain CSS) |
| `client/index.html` | Add Inter + Lexend + Material Symbols `<link>` tags. Set `<html class="dark">`. |
| `client/src/App.jsx` | Placeholder: `<div className="text-primary-fixed font-headline-xl">TERRITORY RUN</div>` |
| `client/src/main.jsx` | Default Vite + import `./index.css` |

## Acceptance

- `cd client && npm run dev` starts on :5173
- Page renders "TERRITORY RUN" in lime (`#c3f400`) Lexend bold on dark grid bg
- `glass-panel`, `neon-border-lime`, `neon-border-cyan`, `hex-mesh` usable as classNames
- Tailwind class `text-primary-fixed` resolves to `#c3f400`

## Out of scope

- Routes, components, pages — task 02+
- Material Symbols icon helper — task 02
