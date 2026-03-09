(function () {
  const NATIONAL = 7;
  const INTL = 5;
  const FADE_IN = 0.6;  // duration to reach full opacity
  const TOTAL = 1.8;    // total per-card duration
  const STAGGER = FADE_IN; // next card starts when current hits 100% opacity

  // Playback constants
  const BASE_SPEED  = 1 / 3000; // time-units per ms at idle (slow drift)
  const SCROLL_MULT = 0.004;    // time-units per scroll pixel per frame

  // ── Collect elements ──
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
    if (i < INTL)     sequence.push({ el: int[i], dir:  1 });
  }

  // Total timeline: last card starts at (n-1)*STAGGER, runs for TOTAL
  const DURATION = STAGGER * (sequence.length - 1) + TOTAL;

  // ── Wrap #logo-section in a tall sticky-scroll container ──
  const logoSection = document.querySelector("#logo-section");
  const scrollContainer = document.createElement("div");
  scrollContainer.style.cssText = "position: relative; height: 500vh;";
  logoSection.parentNode.insertBefore(scrollContainer, logoSection);
  scrollContainer.appendChild(logoSection);
  logoSection.style.position = "sticky";
  logoSection.style.top = "0";

  // ── Helpers ──
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
  }

  // ── Animate one card at localTime (time relative to its own start) ──
  // Opacity: 0.5 → 1 over first 0.1 time-units (≈300ms at base speed), then stays 1
  const OPACITY_FADE = 2 / 3; // ≈2 seconds at base speed (2000ms / 3000ms per unit)

  function animateCard(el, localTime, dir) {
    const t       = clamp(localTime / TOTAL, 0, 1);
    const opacity = localTime < OPACITY_FADE ? lerp(0.2, 1, localTime / OPACITY_FADE) : 1;
    el.style.opacity   = opacity;
    el.style.transform = `translateX(${lerp(0, dir * 100, t)}vw) scale(${lerp(0.4, 1.2, t)})`;
    el.style.filter    = "none";
  }

  function resetCard(el) {
    el.style.opacity = "0";
    el.style.transform = "scale(0.4)";
    el.style.filter = "none";
  }

  // ── Render frame at given time ──
  function render(time) {
    sequence.forEach(({ el, dir }, i) => {
      const lt = time - i * STAGGER;
      lt < 0 ? resetCard(el) : animateCard(el, lt, dir);
    });
    overlay.style.opacity = lerp(0.4, 0.1, time / DURATION);
  }

  // ── Animation state ──
  let autoTime    = 0;
  let lastScrollY = window.scrollY;
  let lastTs      = null;
  let inView      = false;  // true only when section is 100% in viewport
  let hovered     = false;

  function tick(ts) {
    const active = inView && !hovered;

    if (active) {
      if (lastTs === null) {
        // Fresh resume — snapshot current scroll so first delta is 0
        lastTs      = ts;
        lastScrollY = window.scrollY;
      }

      const dt          = ts - lastTs;
      const scrollDelta = window.scrollY - lastScrollY;
      const advance     = dt * BASE_SPEED + scrollDelta * SCROLL_MULT;

      autoTime = (autoTime + advance) % DURATION;
      if (autoTime < 0) autoTime = (autoTime + DURATION) % DURATION;

      render(autoTime);
    } else {
      // While inactive, keep lastTs null so resume gets a clean start
      lastTs = null;
    }

    lastTs      = active ? ts : null;
    lastScrollY = window.scrollY;
    requestAnimationFrame(tick);
  }

  // ── IntersectionObserver: start/stop based on full viewport visibility ──
  const observer = new IntersectionObserver(
    (entries) => { inView = entries[0].intersectionRatio >= 1.0; },
    { threshold: 1.0 },
  );
  observer.observe(logoSection);

  // ── Hover on logo cards: pause on enter, resume on leave ──
  // ── Click: open org URL in new tab ──
  sequence.forEach(({ el }) => {
    el.addEventListener("mouseenter", () => { hovered = true; });
    el.addEventListener("mouseleave", () => { hovered = false; });
    el.addEventListener("click", () => {
      const url = el.dataset.url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    });
  });

  // ── Start ──
  render(0);
  requestAnimationFrame(tick);
})();
