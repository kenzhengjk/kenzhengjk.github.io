/* ==========================================================================
   background.js — hero background: a layered neural network whose
   activations propagate forward as pulses (input → hidden → readout).

   Interaction
     • move the cursor near the net → nearby neurons glow and lean toward it
     • hover a neuron            → it fires every ~0.45 s along 4 edges (rate-
                                   limited); fan-in / fan-out light up + a tag
     • click / tap the hero      → a ripple that excites only the neurons near
                                   the click, closest ones firing hardest
   Set content.js → meta.background to "none" to disable.

   Runtime: DPR-aware sizing, theme-aware colors, pauses off-screen and in
   hidden tabs, a single still frame for prefers-reduced-motion.
   (Earlier scene experiments live in _dev/archive/.)
   ========================================================================== */
(() => {
  "use strict";
  const canvas = document.getElementById("pc");
  if (!canvas) return;
  const host = canvas.parentElement;
  const hero = host.closest(".hero");
  const q = new URLSearchParams(location.search).get("bg");
  if ((q || window.SITE?.meta?.background || "network") === "none") { host.remove(); return; }
  host.dataset.scene = "network";

  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;
  const MONO = "10px 'Geist Mono', ui-monospace, monospace";

  /* ---------- shared state ---------- */
  const S = {
    W: 0, H: 0, mobile: false, now: 0,
    BASE: "170,176,184", ACC: "82,230,242", BG: "8,9,11",
    ptr: { x: 0, y: 0, t: -1e9 },
  };
  const probe = document.createElement("span");
  probe.style.display = "none";
  document.body.appendChild(probe);
  const rgbOf = (v) => { probe.style.color = `var(${v})`; const m = getComputedStyle(probe).color.match(/[\d.]+/g); return m ? m.slice(0, 3).join(",") : null; };
  const pointerActive = () => S.now - S.ptr.t < 2.5;

  // deterministic RNG → same network topology on every load
  let seed = 1337;
  const rand = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  /* ======================================================================
     NETWORK
     Every ~1.1 s an input "sample" fires 1–2 input neurons. A firing neuron
     sends pulses along up to k outgoing edges (sampled by weight; k = 2 by
     default, more for hover / click). A pulse arriving at a neuron that
     isn't refractory makes it relay with k = 2, so passes reach the readout.
     ====================================================================== */
  function networkScene() {
    const SIZES = [3, 16, 7, 7, 16, 6];
    const LABELS = ["x", "h₁", "h₂", "h₃", "h₄", "ŷ"];
    const L = SIZES.length;
    const HOVER_R = 26, PROX_R = 160, PULL = 0.12;
    const nodes = [], edges = [];
    SIZES.forEach((n, l) => { for (let i = 0; i < n; i++) nodes.push({ l, i, ny: 0.08 + (0.8 * (i + 0.5)) / n + (rand() - 0.5) * 0.02, act: 0, cool: 0, prox: 0, bx: 0, by: 0, x: 0, y: 0 }); });
    const out = nodes.map(() => []), inc = nodes.map(() => []);
    const link = (i, j, w) => { out[i].push(edges.length); inc[j].push(edges.length); edges.push({ a: i, b: j, w }); };
    nodes.forEach((a, i) => nodes.forEach((b, j) => { if (b.l === a.l + 1 && rand() < 0.6) link(i, j, 0.15 + rand() * 0.85); }));
    // every non-readout neuron gets at least one outgoing edge so no pass dead-ends
    nodes.forEach((a, i) => {
      if (a.l === L - 1 || out[i].length) return;
      const nxt = nodes.map((b, j) => (b.l === a.l + 1 ? j : -1)).filter((j) => j >= 0);
      link(i, nxt[Math.floor(rand() * nxt.length)], 0.5 + rand() * 0.5);
    });
    let pulses = [], ripples = [], clock = 0, nextSample = 0, hover = -1, hoverClock = 0, lastHoverFire = -1;
    const stats = new Float32Array(L); // debug: arrivals per layer
    // interaction tuning
    const HOVER_EVERY = 1;  // a hovered neuron re-fires this often (s)
    const HOVER_GAP = 1;    // min gap between hover-fires across neurons, so sweeping the cursor can't flood the net
    const HOVER_FAN = 1;       // edges per hover-fire (ambient uses 2); decays by 1 per layer downstream
    const WAVE_R = 320;        // click ripple only excites neurons within this radius
    const WAVE_SPEED = 520;    // ripple front speed (px/s)

    function place() {
      const x0 = S.mobile ? 0.08 : 0.565, x1 = S.mobile ? 0.9 : 0.965;
      nodes.forEach((n) => { n.bx = S.W * (x0 + ((x1 - x0) * n.l) / (L - 1)); n.by = S.H * n.ny; n.x = n.bx; n.y = n.by; });
    }
    function pickEdges(i, k) {
      const es = out[i];
      if (es.length <= k) return es;
      const picked = new Set();
      while (picked.size < k) { // weight-proportional sampling without replacement
        let r = rand() * es.reduce((s, e) => s + (picked.has(e) ? 0 : edges[e].w), 0);
        for (const e of es) { if (picked.has(e)) continue; r -= edges[e].w; if (r <= 0) { picked.add(e); break; } }
      }
      return [...picked];
    }
    // fire neuron i along k outgoing edges. Each pulse carries the fan-out its target will
    // relay with, decaying by 1 per layer down to the ambient 2 — so a strong local
    // stimulus (hover / click) is vivid nearby but never snowballs through the whole net
    function fire(i, k = 2) {
      const n = nodes[i];
      n.act = 1; n.cool = 0.35;
      for (const e of pickEdges(i, k)) if (pulses.length < 240) pulses.push({ e, p: 0, k: Math.max(2, k - 1) });
    }
    function wave(x, y) { // click: a ripple that excites the neurons it reaches near the click point
      ripples.push({ x, y, r: 0, hit: new Set() });
    }
    function step(dt) {
      clock += dt;
      const act = pointerActive();

      // cursor: proximity glow + magnetic pull; find the hovered neuron
      const prevHover = hover;
      hover = -1;
      let best = HOVER_R;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const d = act ? Math.hypot(n.bx - S.ptr.x, n.by - S.ptr.y) : 1e9;
        const target = Math.max(0, 1 - d / PROX_R);
        n.prox += (target - n.prox) * Math.min(1, dt * 10);
        n.x = n.bx + (S.ptr.x - n.bx) * PULL * n.prox;
        n.y = n.by + (S.ptr.y - n.by) * PULL * n.prox;
        if (act) { const dd = Math.hypot(n.x - S.ptr.x, n.y - S.ptr.y); if (dd < best) { best = dd; hover = i; } }
      }
      if (hover >= 0) {
        nodes[hover].act = Math.max(nodes[hover].act, 0.95);
        if (hover !== prevHover) hoverClock = 0; // respond immediately to a newly hovered neuron…
        hoverClock -= dt;
        if (hoverClock <= 0 && clock - lastHoverFire >= HOVER_GAP) { // …but rate-limited globally
          hoverClock = HOVER_EVERY; lastHoverFire = clock;
          fire(hover, HOVER_FAN);
        }
      }

      // ambient input samples
      if (clock >= nextSample) {
        nextSample = clock + 5.5;
        fire(Math.floor(rand() * SIZES[0]), 1);
        if (rand() < 0.5) fire(Math.floor(rand() * SIZES[0]));
      }

      // click ripples: as the front passes a neuron, excite it in proportion to its
      // closeness to the click (closest fire hardest, far ones are untouched)
      ripples = ripples.filter((rp) => {
        rp.r += dt * WAVE_SPEED;
        nodes.forEach((n, i) => {
          if (rp.hit.has(i)) return;
          const d = Math.hypot(n.bx - rp.x, n.by - rp.y);
          if (d > rp.r || d > WAVE_R) return;
          rp.hit.add(i);
          const s = 1 - d / WAVE_R;
          n.act = Math.max(n.act, 0.35 + 0.65 * s);
          if (s > 0.2) fire(i, s > 0.65 ? 4 : s > 0.4 ? 3 : 1);
        });
        return rp.r < WAVE_R * 1.25;
      });

      // advance pulses; fire arrivals after rebuilding the array
      // (firing inside filter() would push onto the discarded old array)
      const arrived = [];
      pulses = pulses.filter((pu) => {
        pu.p += dt * 2.55;
        if (pu.p < 1) return true;
        arrived.push(pu);
        return false;
      });
      for (const pu of arrived) {
        const e = edges[pu.e], b = nodes[e.b];
        stats[b.l]++;
        b.act = Math.max(b.act, 0.55 + 0.45 * e.w);
        if (b.cool <= 0) fire(e.b, pu.k);
      }
      for (const n of nodes) { n.act *= Math.exp(-dt * 2.2); n.cool -= dt; }
    }
    return {
      stats, wave, nodes,
      resize: place,
      warm() { place(); for (let i = 0; i < 240; i++) step(1 / 60); },
      draw(t, dt) {
        step(dt);
        // edges, bucketed by weight (kept dim so hero text stays readable)
        const paths = [new Path2D(), new Path2D(), new Path2D()];
        edges.forEach((e) => { const a = nodes[e.a], b = nodes[e.b], p = paths[e.w > 0.7 ? 2 : e.w > 0.4 ? 1 : 0]; p.moveTo(a.x, a.y); p.lineTo(b.x, b.y); });
        ctx.lineWidth = 1;
        [0.045, 0.075, 0.12].forEach((al, i) => { ctx.strokeStyle = `rgba(${S.BASE},${al})`; ctx.stroke(paths[i]); });

        // hovered neuron: highlight its fan-in (dim) and fan-out (bright)
        if (hover >= 0) {
          ctx.lineWidth = 1.2;
          for (const ei of inc[hover]) { const e = edges[ei], a = nodes[e.a], b = nodes[e.b]; ctx.strokeStyle = `rgba(${S.ACC},${0.12 + 0.2 * e.w})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
          for (const ei of out[hover]) { const e = edges[ei], a = nodes[e.a], b = nodes[e.b]; ctx.strokeStyle = `rgba(${S.ACC},${0.3 + 0.45 * e.w})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
          ctx.lineWidth = 1;
        }

        // pulses with short trails
        for (const pu of pulses) {
          const e = edges[pu.e], a = nodes[e.a], b = nodes[e.b];
          const x = a.x + (b.x - a.x) * pu.p, y = a.y + (b.y - a.y) * pu.p, p0 = Math.max(0, pu.p - 0.3);
          ctx.strokeStyle = `rgba(${S.ACC},${0.28 + 0.42 * e.w})`;
          ctx.beginPath(); ctx.moveTo(a.x + (b.x - a.x) * p0, a.y + (b.y - a.y) * p0); ctx.lineTo(x, y); ctx.stroke();
          ctx.fillStyle = `rgb(${S.ACC})`; ctx.fillRect(x - 1.3, y - 1.3, 2.6, 2.6);
        }

        // neurons
        for (let k = 0; k < nodes.length; k++) {
          const n = nodes[k], r = 4 + 1.5 * n.prox;
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, TAU);
          ctx.fillStyle = `rgba(${S.ACC},${0.05 + 0.8 * n.act + 0.15 * n.prox})`; ctx.fill();
          ctx.strokeStyle = n.act > 0.3 || n.prox > 0.2 ? `rgba(${S.ACC},${Math.min(1, 0.35 + 0.5 * n.act + 0.4 * n.prox)})` : `rgba(${S.BASE},0.42)`; ctx.stroke();
          if (n.act > 0.45) { ctx.strokeStyle = `rgba(${S.ACC},${(n.act - 0.45) * 0.7})`; ctx.beginPath(); ctx.arc(n.x, n.y, r + 9 * (1 - n.act), 0, TAU); ctx.stroke(); }
          if (n.l === L - 1) { // readout bars
            ctx.fillStyle = `rgba(${S.BASE},0.14)`; ctx.fillRect(n.x + 10, n.y - 1.5, 30, 3);
            ctx.fillStyle = `rgba(${S.ACC},0.85)`; ctx.fillRect(n.x + 10, n.y - 1.5, 30 * n.act, 3);
          }
        }

        // hovered neuron: crosshair + readout tag
        ctx.font = MONO;
        if (hover >= 0) {
          const n = nodes[hover];
          ctx.strokeStyle = `rgba(${S.ACC},0.9)`;
          ctx.beginPath(); ctx.arc(n.x, n.y, 11, 0, TAU);
          ctx.moveTo(n.x - 17, n.y); ctx.lineTo(n.x - 13, n.y); ctx.moveTo(n.x + 13, n.y); ctx.lineTo(n.x + 17, n.y);
          ctx.moveTo(n.x, n.y - 17); ctx.lineTo(n.x, n.y - 13); ctx.moveTo(n.x, n.y + 13); ctx.lineTo(n.x, n.y + 17); ctx.stroke();
          const tag = `${LABELS[n.l]}[${n.i}]  a=${n.act.toFixed(2)}  fan-out ${out[hover].length}`;
          const tw = ctx.measureText(tag).width + 12, tx = Math.min(n.x + 20, S.W - tw - 6), ty = n.y - 26;
          ctx.fillStyle = `rgba(${S.ACC},0.92)`; ctx.fillRect(tx, ty, tw, 16);
          ctx.fillStyle = `rgb(${S.BG})`; ctx.fillText(tag, tx + 6, ty + 11.5);
        }

        // click ripples
        for (const r of ripples) { const f = 1 - r.r / (WAVE_R * 1.25); ctx.strokeStyle = `rgba(${S.ACC},${0.55 * f})`; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke(); }

        // layer labels
        ctx.textAlign = "center"; ctx.fillStyle = `rgba(${S.BASE},0.45)`;
        LABELS.forEach((lb, l) => { const n = nodes.find((m) => m.l === l); ctx.fillText(lb, n.bx, S.H * 0.95); });
        ctx.textAlign = "start";
      },
    };
  }

  /* ---------- runtime ---------- */
  const scene = networkScene();
  const STILL_T = 9;
  let lastT = STILL_T, running = false, visible = true, raf = 0, prev = 0;
  const t0 = performance.now() - STILL_T * 1000;
  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
  const nowSec = () => (performance.now() - t0) / 1000;

  function frame(t, dt = 1 / 60) {
    lastT = t; S.now = t;
    ctx.setTransform(DPR(), 0, 0, DPR(), 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, S.W, S.H);
    if (S.W && S.H) scene.draw(t, dt);
  }
  function readColors() {
    S.BASE = rgbOf("--text-2") || S.BASE;
    S.ACC = rgbOf("--acc-line") || S.ACC;
    S.BG = rgbOf("--bg") || S.BG;
    if (!running) frame(lastT, 0);
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    S.W = r.width; S.H = r.height; S.mobile = S.W < 960;
    canvas.width = Math.round(S.W * DPR()); canvas.height = Math.round(S.H * DPR());
    scene.resize();
    if (!running) frame(lastT, 0);
  }
  function loop(now) {
    const t = (now - t0) / 1000;
    frame(t, Math.min(0.05, Math.max(0, t - prev))); prev = t;
    raf = requestAnimationFrame(loop);
  }
  function update() {
    const should = !reduce && visible && !document.hidden;
    if (should && !running) { running = true; prev = nowSec(); raf = requestAnimationFrame(loop); }
    else if (!should && running) { running = false; cancelAnimationFrame(raf); }
  }

  if (!reduce) {
    addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      if (e.clientY > r.bottom || e.clientY < r.top) { S.ptr.t = -1e9; return; }
      S.ptr.x = e.clientX - r.left; S.ptr.y = e.clientY - r.top; S.ptr.t = nowSec();
    }, { passive: true });
    document.addEventListener("pointerleave", () => { S.ptr.t = -1e9; });
    // click / tap anywhere on the hero (except links and buttons) → full forward pass
    hero?.addEventListener("click", (e) => {
      if (e.target.closest("a, button, input, .bio, .name, .role")) return;
      const r = canvas.getBoundingClientRect();
      scene.wave(e.clientX - r.left, e.clientY - r.top);
    });
  }
  readColors();
  resize();
  scene.warm();
  addEventListener("resize", resize);
  addEventListener("themechange", readColors);
  document.addEventListener("visibilitychange", update);
  if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; update(); }).observe(canvas);
  update();
  if (reduce) frame(STILL_T, 0);
  // dev hooks (only with ?bg=…): step frames synchronously; inspect arrivals per layer
  if (q) {
    window.__bgAdvance = (n = 120) => { for (let i = 0; i < n; i++) frame(lastT + 1 / 60, 1 / 60); };
    window.__bgStats = () => [...scene.stats];
    window.__bgWave = (x, y) => scene.wave(x, y);
    window.__bgNodes = () => scene.nodes.map((n) => ({ l: n.l, x: Math.round(n.bx), y: Math.round(n.by), act: +n.act.toFixed(2) }));
    window.__bgPointer = (x, y) => { S.ptr.x = x; S.ptr.y = y; S.ptr.t = lastT; };
  }
})();
