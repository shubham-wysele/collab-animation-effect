(function () {
  const NATIONAL = 7;
  const INTL = 5;
  const FADE_IN = 0.6;  // duration to reach full opacity
  const TOTAL = 1.8;    // total per-card duration
  const STAGGER = FADE_IN; // next card starts when current hits 100% opacity

  // ── Sticky pinning: wrap section so it pins for 400vh of scroll ──
  const section = document.getElementById("logo-section");
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:relative;height:500vh;";
  section.parentNode.insertBefore(wrapper, section);
  wrapper.appendChild(section);
  section.style.position = "sticky";
  section.style.top = "0";

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

  // ── Helpers ──
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
  }
  function easeOut(t) {
    return 1 - (1 - t) * (1 - t);
  }

  // ── Animate one card at localTime (time relative to its own start) ──
  // Phase 1 (0 → FADE_IN): fade in, grow in from center
  // Phase 2 (FADE_IN → TOTAL): immediately fade out, keep growing outward — no hold
  function animateCard(el, localTime, dir) {
    const t = clamp(localTime / TOTAL, 0, 1);

    const scale = lerp(0.1, 2.5, t);
    const x = lerp(0, dir * 100, t);

    const opacity =
      localTime <= FADE_IN
        ? lerp(0, 1, easeOut(localTime / FADE_IN))
        : lerp(1, 0, clamp((localTime - FADE_IN) / (TOTAL - FADE_IN), 0, 1));

    const blur =
      localTime <= FADE_IN
        ? lerp(10, 0, easeOut(localTime / FADE_IN))
        : lerp(0, 20, clamp((localTime - FADE_IN) / (TOTAL - FADE_IN), 0, 1));

    el.style.opacity = opacity;
    el.style.transform = `translateX(${x}vw) scale(${scale})`;
    el.style.filter = `blur(${blur}px)`;
  }

  function resetCard(el) {
    el.style.opacity = "0";
    el.style.transform = "scale(0.1)";
    el.style.filter = "blur(10px)";
  }

  // ── Main scroll handler ──
  function onScroll() {
    const scrolled = window.scrollY - wrapper.offsetTop;
    const progress = clamp(scrolled / (window.innerHeight * 4), 0, 1);
    const time = progress * DURATION;

    sequence.forEach(({ el, dir }, i) => {
      const lt = time - i * STAGGER;
      lt < 0 ? resetCard(el) : animateCard(el, lt, dir);
    });

    overlay.style.opacity = lerp(0.4, 0.1, progress);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // set initial state
})();
