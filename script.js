(function () {
  const NATIONAL = 7;
  const INTL = 5;

  // ── Timing ──────────────────────────────────────────────────────────
  const T_BG = 0.8; // fade-in + unblur duration
  const T_FG = 2.0; // time at full opacity, still moving, until off-screen
  const TOTAL = T_BG + T_FG; // 2.9 — no fade-out phase

  // Same-side gap = T_BG; seq STAGGER = T_BG / 2 (same-side cards are 2 slots apart).
  const STAGGER = T_BG / 3;

  const BASE_SPEED = 1 / 2700; // 1/2250 reduced by 20%

  // ── Collect elements ─────────────────────────────────────────────────
  const nat = Array.from({ length: NATIONAL }, (_, i) =>
    document.querySelector(`.nat-${i}`),
  );
  const int = Array.from({ length: INTL }, (_, i) =>
    document.querySelector(`.int-${i}`),
  );
  const overlay = document.querySelector(".bg-overlay");

  // ── Build interleaved sequence: nat-0, int-0, nat-1, int-1, ..., nat-5, nat-6 ──
  const sequence = [];
  for (let i = 0; i < Math.max(NATIONAL, INTL); i++) {
    if (i < NATIONAL) sequence.push({ el: nat[i], dir: -1 });
    if (i < INTL) sequence.push({ el: int[i], dir: 1 });
  }

  const DURATION = STAGGER * (sequence.length - 1) + TOTAL;

  // ── Wrap #logo-section in a tall sticky-scroll container ──
  const logoSection = document.querySelector("#logo-section");
  const scrollContainer = document.createElement("div");
  scrollContainer.style.cssText = "position: relative; height: 500vh;";
  logoSection.parentNode.insertBefore(scrollContainer, logoSection);
  scrollContainer.appendChild(logoSection);
  logoSection.style.position = "sticky";
  logoSection.style.top = "0";

  // ── Helpers ───────────────────────────────────────────────────────────
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
  }

  // ── Per-card animation ────────────────────────────────────────────────
  //
  //  Position and scale are a single continuous curve across the full lifetime —
  //  the card never stops moving or growing. Opacity fades in over T_BG then
  //  holds at 1 forever; exit happens by the card traveling off-screen.
  //
  function animateCard(el, lt, dir) {
    const t = clamp(lt / TOTAL, 0, 1);

    // Continuous motion: starts near center, exits well off-screen
    const x = lerp(dir * 5, dir * 105, t);
    const scale = lerp(0.5, 1.5, t);

    // Opacity: 0 → 1 during entry, then stays at 1 — no fade-out
    const opacity = lt < T_BG ? lerp(0, 1, lt / T_BG) : 1;

    // Blur clears during entry only
    const blur = lt < T_BG ? lerp(10, 0, lt / T_BG) : 0;

    el.style.opacity = opacity;
    el.style.transform = `translateX(${x}vw) scale(${scale})`;
    el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : "none";
    el.style.zIndex = lt < T_BG ? 1 : 2;
  }

  function resetCard(el) {
    el.style.opacity = "0";
    el.style.transform = "scale(0.50)";
    el.style.filter = "none";
    el.style.zIndex = "0";
  }

  function render(time) {
    sequence.forEach(({ el, dir }, i) => {
      const lt = time - i * STAGGER;
      lt < 0 ? resetCard(el) : animateCard(el, lt, dir);
    });
    overlay.style.opacity = lerp(0.4, 0.1, time / DURATION);
  }

  // ── Returns how far the user has scrolled within the sticky container ──
  function getScrollOffset() {
    const scrollRange = scrollContainer.offsetHeight - window.innerHeight;
    const scrolled = window.scrollY - scrollContainer.offsetTop;
    return clamp(scrolled, 0, scrollRange);
  }

  // ── Animation state ───────────────────────────────────────────────────
  let autoTime = 0;
  let autoLastTs = null;
  let inView = false;
  let hovered = false;
  let isScrolling = false;
  let scrollTimer = null;

  // Start animation when >60% of the section is visible
  new IntersectionObserver(
    (entries) => {
      inView = entries[0].intersectionRatio > 0.6;
    },
    { threshold: [0.6, 0.61] },
  ).observe(logoSection);

  // Track active scrolling — cleared 150ms after last scroll event
  window.addEventListener(
    "scroll",
    () => {
      isScrolling = true;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        isScrolling = false;
      }, 150);
    },
    { passive: true },
  );

  function tick(ts) {
    const active = inView && !hovered;
    const scrollRange = scrollContainer.offsetHeight - window.innerHeight;
    const scrollOffset = getScrollOffset();

    if (active) {
      if (isScrolling) {
        // ── Scroll mode: scroll position maps directly to animation time ──
        const scrollTime = (scrollOffset / scrollRange) * DURATION;
        autoTime = scrollTime;
        autoLastTs = null;
        render(scrollTime);
      } else {
        // ── Auto-play mode: loop continuously ──
        if (autoLastTs === null) autoLastTs = ts;
        const dt = ts - autoLastTs;
        autoTime = (autoTime + dt * BASE_SPEED) % DURATION;
        render(autoTime);
        autoLastTs = ts;
      }
    } else {
      autoLastTs = null;
    }

    requestAnimationFrame(tick);
  }

  // ── Hover: pause auto-play; Click: open URL ──────────────────────────
  sequence.forEach(({ el }) => {
    el.addEventListener("mouseenter", () => {
      hovered = true;
    });
    el.addEventListener("mouseleave", () => {
      hovered = false;
    });
    el.addEventListener("click", () => {
      const url = el.dataset.url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    });
  });

  // ── Start ─────────────────────────────────────────────────────────────
  render(0);
  requestAnimationFrame(tick);
})();
