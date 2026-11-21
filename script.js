/* ARVEN Residences — scroll-scrubbed cinematic film (construction -> interior, one continuous sequence) */
(() => {
  "use strict";
  const CONFIG = { whatsapp: "917569324738" };           // <- put the real WhatsApp number here (country code + number)
  const TOTAL = 240, W = 1280, H = 720;
  const FRAME = i => `assets/frames/f${String(i).padStart(3, "0")}.webp`;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const canvas = $("#film"), ctx = canvas.getContext("2d");
  const imgs = new Array(TOTAL), ok = new Array(TOTAL).fill(false);
  let loaded = 0, vw = 0, vh = 0, dpr = 1, started = false;

  const story = $("#story"), chaps = $$(".chap").map(el => ({ el, s: +el.dataset.s, e: +el.dataset.e, first: el.classList.contains("first"), last: el.classList.contains("last"), v: -1 }));
  const dots = $$("#rail i"), railFill = $("#rail-fill"), cue = $("#cue");
  const progress = () => clamp((scrollY - story.offsetTop) / (story.offsetHeight - innerHeight), 0, 1);

  function nearest(i) { if (ok[i]) return i; for (let d = 1; d < TOTAL; d++) { if (i - d >= 0 && ok[i - d]) return i - d; if (i + d < TOTAL && ok[i + d]) return i + d; } return -1; }
  function resize() {
    vw = innerWidth; vh = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingQuality = "high"; draw(true);
  }
  function cover(img, zoom, alpha) {
    const s = Math.max(vw / W, vh / H) * zoom, w = W * s, h = H * s;
    ctx.globalAlpha = alpha; ctx.drawImage(img, (vw - w) / 2, (vh - h) / 2, w, h);
  }
  const cur = { f: 0 };
  let raf = 0;
  function draw(force) {
    const p = progress(), target = p * (TOTAL - 1);
    cur.f = force ? target : lerp(cur.f, target, 0.12);
    const a = clamp(Math.floor(cur.f), 0, TOTAL - 1), b = Math.min(a + 1, TOTAL - 1), t = cur.f - a;
    const ia = nearest(a), ib = nearest(b), zoom = 1 + 0.05 * p;
    ctx.globalAlpha = 1; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, vw, vh);
    if (ia >= 0) cover(imgs[ia], zoom, 1);
    if (ib >= 0 && ib !== ia && t > 0.01) cover(imgs[ib], zoom, t);   // blend neighbours = smooth, never a hard cut
    ctx.globalAlpha = 1;
    ui(p);
    if (Math.abs(cur.f - target) > 0.02) raf = requestAnimationFrame(() => draw());
  }
  function ui(p) {
    chaps.forEach(c => {
      const span = c.e - c.s, fade = Math.min(0.035, span * 0.3);
      let o = 1;
      if (!(c.first && p <= c.s)) o = clamp((p - c.s) / fade, 0, 1);
      if (!c.last) o = Math.min(o, clamp((c.e - p) / fade, 0, 1));
      if (c.first && p <= c.s) o = 1;
      if (Math.abs(o - c.v) < 0.004) return; c.v = o;
      const out = p > (c.s + c.e) / 2 ? -1 : 1;
      c.el.style.opacity = o;
      c.el.style.transform = `translate3d(0,${(1 - o) * 28 * out}px,0) rotateX(${(1 - o) * 14 * out}deg)`;
      c.el.style.pointerEvents = o > 0.6 && c.last ? "auto" : "none";
    });
    const idx = chaps.reduce((n, c, i) => (p >= c.s - 0.01 ? i : n), 0);
    dots.forEach((d, i) => d.style.background = i <= idx ? "var(--gold)" : "");
    railFill.style.height = p * 100 + "%";
    cue.style.opacity = p < 0.02 ? 1 : 0;
  }
  addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => draw()); }, { passive: true });
  addEventListener("resize", resize);

  /* preload: key frames first, then the rest */
  const loader = $("#loader"), fill = $("#l-fill"), txt = $("#l-txt");
  function done() { if (started) return; started = true; loader.classList.add("done"); draw(true); }
  function one(i) {
    return new Promise(res => {
      const im = new Image(); im.decoding = "async";
      im.onload = () => { imgs[i] = im; ok[i] = true; tick(); res(); };
      im.onerror = () => { tick(); res(); };
      im.src = FRAME(i);
    });
  }
  function tick() {
    loaded++; const pc = Math.round(loaded / TOTAL * 100);
    fill.style.width = pc + "%"; txt.textContent = "LOADING " + pc + "%";
    if (pc >= 100 || loaded >= 70) done();
    if (started) draw();
  }
  const order = [0, 239, 120, 60, 180, 30, 90, 150, 210];
  for (let i = 0; i < TOTAL; i++) if (!order.includes(i)) order.push(i);
  let pos = 0; const worker = async () => { while (pos < order.length) await one(order[pos++]); };
  setTimeout(done, 7000);
  Promise.all(Array.from({ length: 6 }, worker));

  /* enquiry -> WhatsApp */
  $("#enq").addEventListener("submit", e => {
    e.preventDefault(); const f = e.target, st = $("#status");
    if (!f.name.value.trim() || !f.phone.value.trim()) { st.textContent = "Please add your name and phone number."; return; }
    const msg = `Hello ARVEN Residences, I'm ${f.name.value.trim()} (${f.phone.value.trim()}). I'm interested in: ${f.interest.value}. ${f.msg.value.trim()}`;
    st.textContent = "Opening WhatsApp — tap Send to deliver your message.";
    open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  });
  resize();
})();
