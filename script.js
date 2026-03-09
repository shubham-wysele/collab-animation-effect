(function () {
  const NATIONAL = 7;
  const INTL = 5;
  const FADE_IN = 0.6; // duration to reach full opacity
  const TOTAL = 1.8;   // total per-card duration
  const STAGGER = FADE_IN;

  // Auto-play speed (used only when user hasn't scrolled into the section)
  const BASE_SPEED = 1 / 3000; // time-units per ms

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
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, t)    { return a + (b - a) * clamp(t, 0, 1); }

  // ── Opacity fade: 0.5 → 1 over first ~2s of auto-play (2/3 time-units) ──
  const OPACITY_FADE = 2 / 3;

  function animateCard(el, localTime, dir) {
    const t       = clamp(localTime / TOTAL, 0, 1);
    const opacity = localTime < OPACITY_FADE ? lerp(0.5, 1, localTime / OPACITY_FADE) : 1;
    el.style.opacity   = opacity;
    el.style.transform = `translateX(${lerp(0, dir * 100, t)}vw) scale(${lerp(0.4, 1.2, t)})`;
    el.style.filter    = "none";
  }

  function resetCard(el) {
    el.style.opacity   = "0";
    el.style.transform = "scale(0.4)";
    el.style.filter    = "none";
  }

  function render(time) {
    sequence.forEach(({ el, dir }, i) => {
      const lt = time - i * STAGGER;
      lt < 0 ? resetCard(el) : animateCard(el, lt, dir);
    });
    overlay.style.opacity = lerp(0.4, 0.1, time / DURATION);
  }

  // ── Returns how far the user has scrolled within the sticky container (0 = not yet) ──
  function getScrollOffset() {
    const scrollRange = scrollContainer.offsetHeight - window.innerHeight;
    const scrolled    = window.scrollY - scrollContainer.offsetTop;
    return clamp(scrolled, 0, scrollRange);
  }

  // ── Animation state ──
  let autoTime    = 0;
  let autoLastTs  = null;
  let inView      = false;
  let hovered     = false;
  let isScrolling = false;
  let scrollTimer = null;

  // Start animation when >60% of the section is visible
  new IntersectionObserver(
    (entries) => { inView = entries[0].intersectionRatio > 0.6; },
    { threshold: [0.6, 0.61] },
  ).observe(logoSection);

  // Track active scrolling — cleared 150ms after last scroll event
  window.addEventListener("scroll", () => {
    isScrolling = true;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => { isScrolling = false; }, 150);
  }, { passive: true });

  function tick(ts) {
    const active      = inView && !hovered;
    const scrollRange = scrollContainer.offsetHeight - window.innerHeight;
    const scrollOffset = getScrollOffset();

    if (active) {
      if (isScrolling) {
        // ── Scroll mode: position maps directly to animation time ──
        const scrollTime = (scrollOffset / scrollRange) * DURATION;
        autoTime   = scrollTime; // keep in sync so auto-play resumes from here
        autoLastTs = null;
        render(scrollTime);
      } else {
        // ── Auto-play mode: loop from wherever animation currently is ──
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

  // ── Hover: pause auto-play; Click: open URL ──
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
