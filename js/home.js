/* ==========================================================================
   home.js : behaviour specific to the one-page CV (index.html)
   - Floating dock: active section tracking + sliding indicator
   - Typed role rotation in the hero
   - Count-up stats, language/IELTS bars and score ring
   - Subtle portrait parallax / fade while scrolling
   ========================================================================== */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Dock navigation ---------------- */
  const dock = document.querySelector(".dock");
  const indicator = dock && dock.querySelector(".dock-indicator");
  const links = dock ? Array.prototype.slice.call(dock.querySelectorAll("a")) : [];
  const sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  function moveIndicator(link) {
    if (!indicator || !link) return;
    indicator.style.width = link.offsetWidth + "px";
    indicator.style.transform = "translateX(" + link.offsetLeft + "px)";
    // keep the active item visible when the dock scrolls horizontally (mobile)
    const left = link.offsetLeft - dock.clientWidth / 2 + link.offsetWidth / 2;
    if (dock.scrollWidth > dock.clientWidth) dock.scrollTo({ left: left, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function setActive(id) {
    links.forEach(function (a) {
      const on = a.getAttribute("href") === "#" + id;
      a.classList.toggle("is-active", on);
      if (on) { a.setAttribute("aria-current", "true"); moveIndicator(a); }
      else a.removeAttribute("aria-current");
    });
  }

  function currentSection() {
    const probe = window.innerHeight * 0.4;
    let active = sections[0];
    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top - probe <= 0) active = s;
    });
    // last section when scrolled to the very bottom
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) active = sections[sections.length - 1];
    return active;
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      const s = currentSection();
      if (s) setActive(s.id);
      parallax();
      ticking = false;
    });
  }

  if (links.length) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      const a = dock.querySelector("a.is-active");
      if (a) moveIndicator(a);
    });
    // fonts change label widths — re-measure once loaded
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { onScroll(); const a = dock.querySelector("a.is-active"); if (a) moveIndicator(a); });
    setActive(sections[0].id);
    onScroll();
  }

  /* ---------------- Portrait parallax ---------------- */
  const portrait = document.querySelector(".portrait");
  function parallax() {
    if (!portrait || reduceMotion || window.innerWidth < 1200) return;
    const vh = window.innerHeight;
    const p = Math.min(window.scrollY / vh, 1);           // 0 → 1 over the first screen
    portrait.style.transform = "translateX(-50%) translateY(" + (p * -4).toFixed(2) + "vh) scale(" + (1 - p * 0.04).toFixed(3) + ")";
    portrait.style.opacity = (1 - p * 0.12).toFixed(3);
  }

  /* ---------------- Typed role ---------------- */
  const typed = document.querySelector(".typed");
  if (typed && !reduceMotion) {
    const words = (typed.getAttribute("data-words") || "").split("|").filter(Boolean);
    let w = 0, c = words[0].length, deleting = false;
    (function tick() {
      const word = words[w];
      typed.textContent = word.slice(0, c);
      let delay = deleting ? 45 : 85;
      if (!deleting && c === word.length) { delay = 2200; deleting = true; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
      c += deleting ? -1 : 1;
      if (!deleting && c > words[w].length) c = words[w].length;
      setTimeout(tick, delay);
    })();
  }

  /* ---------------- One-shot "in view" helper ---------------- */
  function whenVisible(el, fn) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    const io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { fn(); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(el);
  }

  /* ---------------- Count-up stats ---------------- */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    const target = parseFloat(el.getAttribute("data-count"));
    const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (reduceMotion) return;
    el.textContent = (0).toFixed(decimals);
    whenVisible(el, function () {
      const start = performance.now(), dur = 1400;
      (function step(now) {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (t < 1) requestAnimationFrame(step);
      })(start);
    });
  });

  /* ---------------- Language bars ---------------- */
  document.querySelectorAll(".bar-row").forEach(function (row) {
    const fill = row.querySelector(".bar i");
    const value = row.querySelector(".bar-value");
    let pct = null;

    if (row.hasAttribute("data-percent")) {
      pct = parseFloat(row.getAttribute("data-percent"));
    } else if (row.hasAttribute("data-band")) {
      const band = parseFloat(row.getAttribute("data-band"));
      if (!isNaN(band)) {
        pct = (band / 9) * 100;
        if (value) value.textContent = band.toFixed(1);
      } else if (value) {
        value.textContent = "—";
        value.classList.add("pending");
        value.title = "Band score to be added";
      }
    }
    if (fill && pct !== null) whenVisible(row, function () { fill.style.width = pct + "%"; });
  });

  /* ---------------- IELTS ring ---------------- */
  const ring = document.querySelector(".ielts-score");
  if (ring) {
    const meter = ring.querySelector(".meter");
    const band = parseFloat(ring.getAttribute("data-band"));
    const max = parseFloat(ring.getAttribute("data-max")) || 9;
    const circumference = 2 * Math.PI * 64;
    meter.style.strokeDasharray = circumference.toFixed(1);
    meter.style.strokeDashoffset = circumference.toFixed(1);
    whenVisible(ring, function () {
      meter.style.strokeDashoffset = (circumference * (1 - band / max)).toFixed(1);
    });
  }
})();
