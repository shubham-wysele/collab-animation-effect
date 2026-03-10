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

- Cards are interleaved into a single sequence: nat-0, int-0, nat-1, int-1, …, nat-5, nat-6
- Each card gets a staggered start: `localTime = time - (index * STAGGER)` where `STAGGER = 0.6`
- National cards fly **left** (`dir = -1`), international fly **right** (`dir = 1`)
- `animateCard`: over `TOTAL = 1.8` time-units, a card translates from center → `dir * 100vw` while scaling `0.4 → 1.2`; opacity ramps `0.5 → 1` over the first `2/3` time-units — no hold or blur phase
- **Dual animation modes**: when scrolling, `scrollOffset / scrollRange` maps directly to animation time; when not scrolling, auto-play loops at `BASE_SPEED = 1/3000` time-units/ms
- Auto-play only runs when `>60%` of `#logo-section` is visible (IntersectionObserver) and no card is hovered
- Hovering any card pauses auto-play; clicking opens `data-url` in a new tab
- The sticky scroll container is `500vh` tall (injected by JS at runtime)
- `assets/` contains only image files (PNG logos, one MP4 background — `bg.mp4` is not currently used in markup)
- Two placeholder `rebeccapurple` divs exist in `index.html` above/below the section for integration testing; `.after-section` is commented out
