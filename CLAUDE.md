# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A standalone static HTML page ("Global Partnerships") that displays a scroll-driven logo animation. No build step, no dependencies, no package manager.

## Development

Open `index.html` directly in a browser. For live reload during development, use any static file server:

```bash
python3 -m http.server 8080
# or
npx serve .
```

## Architecture

Three files compose the entire page:

- **`index.html`** — Markup only. Two sections: `#logo-section` (the animated stage) and `.after-section`. Logo cards are `.logo-card.nat-N` (7 national) and `.logo-card.int-N` (5 international).
- **`style.css`** — Static styles. Cards start `opacity: 0`; JS drives all animation state via inline styles.
- **`script.js`** — IIFE that implements scroll-driven animation. Wraps `#logo-section` in a `500vh` sticky container at runtime, then maps `scrollY` → a `time` value (0–7.8s) → per-card `opacity`, `transform`, and `filter` via `animateCard()`.

## Animation Logic (`script.js`)

- Each card gets a staggered start: `localTime = time - (index * 1.0)`
- National cards fly **left** (`dir = -1`), international fly **right** (`dir = 1`)
- `animateCard` phases: fade+scale in (0–0.6s), hold (0.6–1.2s), fade+blur out (1.2–1.8s)
- Scroll progress maps over `4 × innerHeight` of scroll distance
- `assets/` contains only image files (PNG logos, one MP4 background — `bg.mp4` is not currently used in markup)
