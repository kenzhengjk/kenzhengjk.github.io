/* ==========================================================================
   main.js — renders content.js into the page and wires up interactions.
   You shouldn't need to edit this file to change content.
   ========================================================================== */
(() => {
  "use strict";
  const S = window.SITE;
  if (!S) return;

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const isExt = (u) => /^https?:\/\//.test(u || "");
  const tgt = (u) => (isExt(u) ? ' target="_blank" rel="noopener"' : "");
  const has = (a) => Array.isArray(a) && a.length > 0;
  const P = S.profile || {};
  const me = new Set([P.name, S.pubName].filter(Boolean));

  const fmtDate = (d) => String(d).replace(/-/g, ".").slice(0, 7);
  const updated = (() => {
    const raw = S.meta?.updated || document.lastModified;
    const d = new Date(raw);
    if (isNaN(d)) return String(raw);
    const iso = S.meta?.updated && /^\d{4}-\d{2}-\d{2}$/.test(S.meta.updated) ? S.meta.updated : d.toISOString().slice(0, 10);
    return iso.replace(/-/g, ".");
  })();

  const LINK_LABELS = { paper: "paper", pdf: "pdf", arxiv: "arXiv", project: "project", code: "code", video: "video", demo: "demo", slides: "slides", poster: "poster", data: "data", talk: "talk", blog: "blog" };

  // deterministic pseudo-random (for placeholder figures)
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  function placeholder(label, seedStr) {
    const r = rng(hash(seedStr));
    let out = "";
    const nb = 1 + Math.floor(r() * 2);
    for (let i = 0; i < nb; i++) {
      const w = 18 + r() * 24, h = 26 + r() * 34;
      const l = 6 + r() * (88 - w), t = 14 + r() * (78 - h);
      out += `<i class="ph-box" style="left:${l.toFixed(1)}%;top:${t.toFixed(1)}%;width:${w.toFixed(1)}%;height:${h.toFixed(1)}%"></i>`;
    }
    const cx = 20 + r() * 60, cy = 25 + r() * 50;
    for (let i = 0; i < 16; i++) {
      const a = r() * Math.PI * 2, d = Math.pow(r(), 0.7) * 26;
      out += `<i class="ph-pt" style="left:${(cx + Math.cos(a) * d).toFixed(1)}%;top:${(cy + Math.sin(a) * d * 0.7).toFixed(1)}%"></i>`;
    }
    return `<div class="ph" aria-hidden="true">${out}<span>${esc(label)}</span></div>`;
  }

  function media(item, label) {
    // teaser videos: muted + looping; with a poster they don't download until scrolled into view
    // optional videoLabels: [[seconds, "text"], …] → a corner tag that follows the playhead
    if (item.video) {
      const labels = has(item.videoLabels) ? item.videoLabels : null;
      return `<video src="${esc(item.video)}" muted loop playsinline disablepictureinpicture disableremoteplayback preload="${item.image ? "none" : "metadata"}"${item.image ? ` poster="${esc(item.image)}"` : ""}${labels ? ` data-labels="${esc(JSON.stringify(labels))}"` : ""}></video>` +
        (labels ? `<span class="media-tag">${esc(labels[0][1])}</span>` : "");
    }
    if (item.image) return `<img src="${esc(item.image)}" alt="" loading="lazy" decoding="async">`;
    return placeholder(label, item.title || label);
  }

  function linkChips(links = {}) {
    return Object.entries(links)
      .filter(([, u]) => u)
      .map(([k, u]) => `<a class="lnk" href="${esc(u)}"${tgt(u)}>${esc(LINK_LABELS[k] || k)}<span class="arr" aria-hidden="true">↗</span></a>`)
      .join("");
  }

  function initials(s) {
    const w = String(s).split(/[\s,]+/).filter((x) => x && /^[A-Z]/.test(x) && !/^(Of|The|And|At)$/.test(x));
    return (w[0]?.[0] || "") + (w[1]?.[0] || "");
  }

  const GLYPHS = {
    vision: `<svg class="glyph" viewBox="0 0 44 44" aria-hidden="true"><rect x="3" y="18" width="9" height="8" rx="1.5"/><path d="M12 20 30 6M12 24 30 38" stroke-dasharray="2 2.5"/><path d="M30 6 41 11v22l-11 5z"/><path class="a" d="m33 15.5 5 2v8l-5-1.2z"/><circle class="f" cx="35.5" cy="21" r="1"/></svg>`,
    robot: `<svg class="glyph" viewBox="0 0 44 44" aria-hidden="true"><path d="M5 40h16M8 40v-4h10v4"/><path d="M13 36 16 21l15-6"/><circle cx="13" cy="36" r="2"/><circle cx="16" cy="21" r="2"/><circle cx="31" cy="15" r="2"/><path d="m31 15 4 4m-4-4 5-1"/><path class="a" d="M36 20c2 4 1 9-3 12" stroke-dasharray="2 2.5"/><circle class="f" cx="32" cy="33" r="1.6"/></svg>`,
    world: `<svg class="glyph" viewBox="0 0 44 44" aria-hidden="true"><path d="M5 18 13 14l8 4v9l-8 4-8-4zM5 18l8 4 8-4M13 22v9"/><path class="a" d="M23 22h6" stroke-dasharray="2 2"/><path class="a" d="m28 20 2 2-2 2"/><path class="a" d="m32 16 3-5 7 2-3 5zM32 16l7 2 3-5M39 18v9l-7-2v-9" stroke-dasharray="2.2 1.8"/></svg>`,
    net: `<svg class="glyph" viewBox="0 0 44 44" aria-hidden="true"><circle cx="7" cy="12" r="2.5"/><circle cx="7" cy="32" r="2.5"/><circle cx="22" cy="8" r="2.5"/><circle cx="22" cy="22" r="2.5"/><circle cx="22" cy="36" r="2.5"/><circle class="f" cx="37" cy="22" r="2.8"/><path d="M9.5 12h0L19.5 8M9.5 12l10 10M9.5 12l10 24M9.5 32l10-24M9.5 32l10-10M9.5 32l10 4M24.5 8l10 14M24.5 36l10-14"/><path class="a" d="M24.5 22h10"/></svg>`,
  };

  /* ---------- section registry ---------- */
  const SECTIONS = [
    { id: "news", title: "News", nav: "news", ok: () => has(S.news), meta: () => `${S.news.length} updates`, render: renderNews },
    { id: "research", title: "Research", nav: "research", ok: () => S.research && (S.research.statement || has(S.research.themes)), render: renderResearch },
    { id: "publications", title: "Publications", nav: "papers", ok: () => has(S.publications), meta: () => ``, render: renderPubs },
    { id: "projects", title: "Projects", nav: "projects", ok: () => has(S.projects), render: renderProjects },
    { id: "experience", title: "Experience", nav: "experience", ok: () => has(S.experience), render: renderExperience },
    { id: "teaching", title: "Teaching", nav: "teaching", ok: () => has(S.teaching), render: renderTeaching },
    { id: "honors", title: "Honors & Service", nav: "honors", ok: () => has(S.honors) || has(S.service), render: renderHonors },
  ].filter((s) => s.ok());

  /* ---------- hero ---------- */
  function renderHero() {
    const links = (P.links || []).map((l) => {
      const ext = isExt(l.url);
      return `<a class="chip${l.primary ? " primary" : ""}" href="${esc(l.url)}"${tgt(l.url)}>${esc(l.label)}<span class="arr" aria-hidden="true">${ext ? "↗" : l.url?.startsWith("mailto:") ? "@" : "↓"}</span></a>`;
    }).join("");
    const photo = P.photo
      ? `<img src="${esc(P.photo)}" alt="Portrait of ${esc(P.name)}" decoding="async">`
      : `<div class="ph" aria-hidden="true"><span>portrait.jpg · 4:5</span></div>`;
    const card = has(P.card)
      ? `<div class="spec rise" style="--i:6"><div class="spec-h"><span>// model card</span><span>v${updated.slice(0, 4)}</span></div><dl>${P.card.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl></div>`
      : "";
    $("#top").innerHTML = `
      <div class="hero-bg" aria-hidden="true"><canvas id="pc"></canvas></div>
      <div class="wrap hero-grid">
        <div class="hero-main">
          ${P.status ? `<div class="status rise" style="--i:0"><span class="pulse" aria-hidden="true"></span>${P.status}</div>` : ""}
          <h1 class="name rise" style="--i:1">${esc(P.name)}${P.altName ? `<span class="alt">${esc(P.altName)}</span>` : ""}</h1>
          <p class="role rise" style="--i:2">${esc(P.role)}${P.affiliation ? `<span class="at">@</span>${esc(P.affiliation)}` : ""}</p>
          <div class="bio rise" style="--i:3">${(P.bio || []).map((b) => `<p>${b}</p>`).join("")}</div>
          <div class="links rise" style="--i:4">${links}</div>
        </div>
        <figure class="portrait rise" style="--i:5">
          <div class="portrait-frame">${photo}</div>
          <div class="bbox" aria-hidden="true"><i></i><i></i><i></i><i></i><span class="bbox-tag">${esc(P.detectionLabel || "person")}<b>0.67</b></span><span class="bbox-xy">[0.08, 0.04, 0.92, 0.96]</span></div>
        </figure>
        ${card}
      </div>`;
  }

  /* ---------- sections ---------- */
  function section(s, i) {
    const meta = s.meta ? `<span class="sec-meta">${esc(s.meta())}</span>` : "";
    return `<section class="sec reveal" id="${s.id}" aria-labelledby="${s.id}-h">
      <div class="sec-label"><div class="sec-sticky"><span class="sec-idx">${pad(i + 1)}</span><h2 class="sec-title" id="${s.id}-h">${esc(s.title)}</h2>${meta}</div></div>
      <div class="sec-body">${s.render()}</div>
    </section>`;
  }

  function renderNews() {
    const lim = S.meta?.newsLimit ?? 6;
    const items = S.news.map((n, i) => `
      <li class="news-item${n.highlight ? " hl" : ""}${i >= lim ? " is-extra" : ""}">
        <time datetime="${esc(n.date)}">${esc(fmtDate(n.date))}</time>
        <div>${n.text}</div>
        ${n.tag ? `<span class="tag">${esc(n.tag)}</span>` : "<span></span>"}
      </li>`).join("");
    const more = S.news.length > lim ? `<button class="btn news-more" type="button" aria-expanded="false" data-news-more>show all ${S.news.length} <span aria-hidden="true">↓</span></button>` : "";
    return `<ul class="news">${items}</ul>${more}`;
  }

  function renderResearch() {
    const R = S.research;
    const themes = has(R.themes) ? `<div class="themes">${R.themes.map((t, i) => `
      <article class="theme">
        <div class="theme-top">${GLYPHS[t.icon] || GLYPHS.net}<span class="theme-idx">θ.${pad(i + 1)}</span></div>
        <h3>${esc(t.title)}</h3>
        <p>${t.text}</p>
        ${has(t.tags) ? `<div class="tags">${t.tags.map((x) => `<span class="tag">${esc(x)}</span>`).join("")}</div>` : ""}
      </article>`).join("")}</div>` : "";
    return `${R.statement ? `<p class="statement">${R.statement}</p>` : ""}${themes}`;
  }

  function authors(list = []) {
    return list.map((a) => {
      const m = String(a).match(/^(.*?)([*†‡]*)$/);
      const name = m[1].trim(), mark = m[2];
      const self = me.has(name);
      const url = S.people?.[name];
      let inner = esc(name);
      if (url && !self) inner = `<a href="${esc(url)}"${tgt(url)}>${inner}</a>`;
      return `<span class="au${self ? " me" : ""}">${inner}${mark ? `<sup>${mark}</sup>` : ""}</span>`;
    }).join(", ");
  }

  function renderPubs() {
    const pubs = [...S.publications].sort((a, b) => (b.year || 0) - (a.year || 0));
    const tagCount = {};
    pubs.forEach((p) => (p.tags || []).forEach((t) => (tagCount[t] = (tagCount[t] || 0) + 1)));
    const nSel = pubs.filter((p) => p.selected).length;
    const def = S.meta?.pubDefaultFilter || "all";
    const chip = (key, label, n) => `<button class="filter" type="button" data-filter="${esc(key)}" aria-pressed="${key === def}">${esc(label)}<span class="n">${n}</span></button>`;
    // const filters = [chip("all", "all", pubs.length), nSel ? chip("selected", "★ selected", nSel) : "",
    const filters = [nSel ? chip("selected", "★ selected", nSel) : "",
      ...Object.entries(tagCount).sort((a, b) => b[1] - a[1]).map(([t, n]) => chip(t, t, n))].join("");
    const anyEq = pubs.some((p) => (p.authors || []).some((a) => /\*$/.test(a)));

    let html = `<div class="pub-tools"><div class="filters" role="group" aria-label="Filter publications">${filters}</div>${anyEq ? `<span class="pub-note">* equal contribution</span>` : ""}</div>`;
    let year = null;
    pubs.forEach((p, i) => {
      if (p.year !== year) { year = p.year; html += `<div class="year" data-year="${esc(year)}">${esc(year)}</div>`; }
      const id = `pub-${p.id || i}`;
      const linkHref = p.links?.project || p.links?.paper || p.links?.arxiv || "";
      const bib = p.bibtex ? `<button class="lnk" type="button" aria-expanded="false" aria-controls="${id}-bib" data-bib>bibtex</button>` : "";
      html += `
      <article class="pub" id="${id}" data-tags="${esc((p.tags || []).join("|"))}" data-selected="${p.selected ? 1 : 0}">
        <a class="pub-media" ${linkHref ? `href="${esc(linkHref)}"${tgt(linkHref)}` : ""} tabindex="-1" aria-hidden="true">${media(p, `fig.${pad(i + 1)} · teaser`)}</a>
        <div class="pub-body">
          <div class="pub-meta">
            <span class="venue">${esc(p.venue)}</span>${p.award ? `<span class="award">${esc(p.award)}</span>` : ""}${p.venueNote ? `<span class="venue-note">${esc(p.venueNote)}</span>` : ""}${p.selected ? `<span class="star" title="Selected">★</span>` : ""}
          </div>
          <h3 class="pub-title">${linkHref ? `<a href="${esc(linkHref)}"${tgt(linkHref)}>${esc(p.title)}</a>` : esc(p.title)}</h3>
          <p class="pub-authors">${authors(p.authors)}</p>
          ${p.tldr ? `<p class="pub-tldr">${p.tldr}</p>` : ""}
          <div class="pub-links">${linkChips(p.links)}${bib}</div>
          ${p.bibtex ? `<div class="bib" id="${id}-bib" hidden><pre>${esc(p.bibtex)}</pre><button class="btn" type="button" data-copy-bib>copy</button></div>` : ""}
        </div>
      </article>`;
    });
    return html + `<p class="empty" hidden>No papers match this filter.</p>`;
  }

  function renderProjects() {
    return `<div class="cards">${S.projects.map((p, i) => `
      <article class="card">
        <div class="card-media">${media(p, `proj.${pad(i + 1)}`)}</div>
        <div class="card-body">
          <h3>${esc(p.title)}</h3>
          <p>${p.text || ""}</p>
          ${has(p.tags) ? `<div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
          <div class="pub-links">${linkChips(p.links)}</div>
        </div>
      </article>`).join("")}</div>`;
  }

  function renderExperience() {
    const order = ["education", "research & industry"];
    const names = { education: "Education", experience: "Research & Industry"};
    const groups = {};
    S.experience.forEach((x) => (groups[x.type || "research"] ||= []).push(x));
    const keys = [...order.filter((k) => groups[k]), ...Object.keys(groups).filter((k) => !order.includes(k))];
    return keys.map((k) => `
      <h3 class="sub-h">${esc(names[k] || k)}</h3>
      <ul>${groups[k].map((x) => `
        <li class="xp">
          <div class="xp-logo" aria-hidden="true">${x.logo ? `<img src="${esc(x.logo)}" alt="">` : esc(initials(x.org))}</div>
          <div>
            <h3>${x.url ? `<a href="${esc(x.url)}"${tgt(x.url)}>${esc(x.org)}</a>` : esc(x.org)}</h3>
            ${x.role ? `<p class="xp-role">${x.role}</p>` : ""}
            ${x.detail ? `<p class="xp-detail">${x.detail}</p>` : ""}
          </div>
          <span class="when">${esc(x.dates || "")}</span>
        </li>`).join("")}</ul>`).join("");
  }

  function renderTeaching() {
    return `<ul>${S.teaching.map((t) => `
      <li class="row">
        <span class="code">${esc(t.code || "")}</span>
        <span class="what">${t.url ? `<a href="${esc(t.url)}"${tgt(t.url)}>${esc(t.title)}</a>` : esc(t.title)}<small>${esc(t.role || "")}${t.org ? ` · ${esc(t.org)}` : ""}</small></span>
        <span class="when">${esc(t.term || "")}</span>
      </li>`).join("")}</ul>`;
  }

  function renderHonors() {
    const list = (arr) => `<ul>${arr.map((h) => `
      <li class="row compact"><span class="code">${esc(h.year || "")}</span><span class="what">${h.title}${h.detail ? `<small>${h.detail}</small>` : ""}</span></li>`).join("")}</ul>`;
    return (has(S.honors) ? `<h3 class="sub-h">Honors</h3>${list(S.honors)}` : "") +
      (has(S.service) ? `<h3 class="sub-h">Service</h3>${list(S.service)}` : "");
  }

  function renderFooter() {
    $("#contact").innerHTML = `
      <div class="wrap foot-in reveal">
        <div class="foot-fine">
          <span>© ${new Date().getFullYear()} ${esc(P.name)}</span>
          <span>last updated ${esc(updated)}</span>
          <a href="#top">back to top ↑</a>
        </div>
      </div>`;
  }


  function renderNav() {
    const items = [{ id: "top", nav: "about", i: 0 }, ...SECTIONS.map((s, i) => ({ id: s.id, nav: s.nav, i: i + 1 }))];
    $("#nav").innerHTML = $("#mnav").innerHTML =
      items.map((x) => `<a href="#${x.id}" data-spy="${x.id}"><sup>${pad(x.i)}</sup>${esc(x.nav)}</a>`).join("");
    $("#brand-name").textContent = P.name || "";
  }

  /* ---------- render everything ---------- */
  document.title = S.meta?.title || P.name || document.title;
  renderNav();
  renderHero();
  $("#sections").innerHTML = SECTIONS.map(section).join("");
  renderFooter();

  // Structured data for search engines
  try {
    const ld = { "@context": "https://schema.org", "@type": "Person", name: P.name, url: location.origin + location.pathname, jobTitle: P.role,
      affiliation: P.affiliation ? { "@type": "Organization", name: P.affiliation } : undefined,
      email: P.email ? `mailto:${P.email}` : undefined, sameAs: (P.links || []).map((l) => l.url).filter(isExt) };
    const s = document.createElement("script"); s.type = "application/ld+json"; s.textContent = JSON.stringify(ld); document.head.appendChild(s);
  } catch (e) { /* noop */ }

  // Privacy-friendly visit stats (GoatCounter: no cookies; it ignores localhost by itself)
  if (S.meta?.analytics) {
    const s = document.createElement("script");
    s.async = true; s.src = "https://gc.zgo.at/count.js"; s.dataset.goatcounter = S.meta.analytics;
    document.head.appendChild(s);
  }

  /* ---------- toast + clipboard ---------- */
  let toastT;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1800);
  }
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch (e) { toast("copy failed — select manually"); }
  }

  /* ---------- theme ---------- */
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch (e) { /* noop */ }
    $('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#08090b" : "#f5f5f1");
    window.dispatchEvent(new CustomEvent("themechange"));
  }
  const toggleTheme = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  $("#theme-toggle").addEventListener("click", toggleTheme);

  /* ---------- delegated clicks ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    if (t.matches("[data-copy-email]")) copy(P.email, "email copied to clipboard");
    else if (t.matches("[data-bib]")) {
      const box = document.getElementById(t.getAttribute("aria-controls"));
      const open = t.getAttribute("aria-expanded") !== "true";
      t.setAttribute("aria-expanded", open); box.hidden = !open;
    } else if (t.matches("[data-copy-bib]")) copy(t.previousElementSibling.textContent, "bibtex copied");
    else if (t.matches("[data-news-more]")) {
      const list = t.previousElementSibling; const open = !list.classList.contains("expanded");
      list.classList.toggle("expanded", open); t.setAttribute("aria-expanded", open);
      t.innerHTML = open ? `show less <span aria-hidden="true">↑</span>` : `show all ${S.news.length} <span aria-hidden="true">↓</span>`;
    } else if (t.matches("[data-filter]")) setFilter(t.dataset.filter);
    else if (t.closest("#mnav")) closeMenu();
  });

  /* ---------- publication filter ---------- */
  function setFilter(f) {
    $$("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.filter === f));
    let shown = 0, lastYear = null, yearHas = false;
    const flush = () => { if (lastYear) lastYear.hidden = !yearHas; };
    $$("#publications .year, #publications .pub").forEach((el) => {
      if (el.classList.contains("year")) { flush(); lastYear = el; yearHas = false; return; }
      const tags = el.dataset.tags.split("|");
      const ok = f === "all" || (f === "selected" ? el.dataset.selected === "1" : tags.includes(f));
      el.hidden = !ok; if (ok) { shown++; yearHas = true; }
    });
    flush();
    const empty = $("#publications .empty"); if (empty) empty.hidden = shown > 0;
  }
  if ($("#publications")) setFilter(S.meta?.pubDefaultFilter || "all");

  /* ---------- mobile menu ---------- */
  const hud = $("#hud"), menuBtn = $("#menu-btn");
  function closeMenu() { hud.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
  menuBtn.addEventListener("click", () => { const o = !hud.classList.contains("open"); hud.classList.toggle("open", o); menuBtn.setAttribute("aria-expanded", o); });

  /* ---------- scroll progress + spy ---------- */
  const prog = $("#progress");
  const spyEls = ["top", ...SECTIONS.map((s) => s.id)].map((id) => document.getElementById(id)).filter(Boolean);
  const spyLinks = $$("[data-spy]");
  let ticking = false, current = null;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement.scrollHeight - innerHeight;
      prog.style.setProperty("--p", h > 0 ? Math.min(1, scrollY / h) : 0);
      // active section = last one whose top has passed 40% of the viewport (or the last at page bottom)
      let id = spyEls[0]?.id;
      for (const el of spyEls) if (el.getBoundingClientRect().top < innerHeight * 0.4) id = el.id;
      if (h - scrollY < 4) id = spyEls[spyEls.length - 1]?.id;
      if (id !== current) { current = id; spyLinks.forEach((a) => a.classList.toggle("active", a.dataset.spy === id)); }
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window) {
    const rev = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); rev.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.04 });
    $$(".reveal").forEach((el) => rev.observe(el));

    // autoplay teasers while on screen; with reduced motion, show the poster and play only on hover
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const vids = new IntersectionObserver((entries) => entries.forEach((en) => {
      en.isIntersecting && !calm ? en.target.play().catch(() => {}) : en.target.pause();
    }), { threshold: 0.25 });
    $$("video").forEach((v) => {
      vids.observe(v);
      // corner tag synced to the current segment of the teaser
      const tag = v.nextElementSibling?.classList.contains("media-tag") ? v.nextElementSibling : null;
      if (tag && v.dataset.labels) {
        const labels = JSON.parse(v.dataset.labels);
        let shown = labels[0][1];
        const sync = () => {
          let cur = labels[0][1];
          for (const [t, text] of labels) if (v.currentTime >= t) cur = text;
          if (cur === shown) return;
          shown = cur;
          tag.classList.add("swap");
          setTimeout(() => { tag.textContent = cur; tag.hidden = !cur; tag.classList.remove("swap"); }, 120);
        };
        tag.hidden = !shown;
        // frame-accurate where supported; timeupdate (~4 Hz) as a fallback
        if ("requestVideoFrameCallback" in v) { const tick = () => { sync(); v.requestVideoFrameCallback(tick); }; v.requestVideoFrameCallback(tick); }
        v.addEventListener("timeupdate", sync);
        v.addEventListener("seeked", sync);
      }
      if (calm) {
        const card = v.closest(".pub, .card") || v;
        card.addEventListener("mouseenter", () => v.play().catch(() => {}));
        card.addEventListener("mouseleave", () => v.pause());
      }
    });
  } else {
    $$(".reveal").forEach((el) => el.classList.add("in"));
  }

  /* ---------- command palette ---------- */
  const pal = $("#palette"), input = $("#pal-input"), list = $("#pal-list");
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $("#kbd-hint").textContent = isMac ? "⌘K" : "Ctrl K";

  const INDEX = [
    { g: "Sections", ic: "00", label: "About", href: "#top" },
    ...SECTIONS.map((s, i) => ({ g: "Sections", ic: pad(i + 1), label: s.title, href: `#${s.id}` })),
    ...(S.publications || []).map((p, i) => ({ g: "Publications", ic: "¶", label: p.title, hint: p.venue, href: `#pub-${p.id || i}`, pub: true, kw: `${(p.authors || []).join(" ")} ${(p.tags || []).join(" ")} ${p.year}` })),
    ...(S.projects || []).map((p) => ({ g: "Projects", ic: "◇", label: p.title, hint: "project", href: "#projects", kw: (p.tags || []).join(" ") })),
    ...(P.links || []).map((l) => ({ g: "Links", ic: "↗", label: l.label, hint: isExt(l.url) ? new URL(l.url).hostname.replace(/^www\./, "") : l.url.replace(/^mailto:/, ""), href: l.url })),
    { g: "Actions", ic: "◐", label: "Toggle light / dark theme", run: toggleTheme },
    ...(P.email ? [{ g: "Actions", ic: "⧉", label: "Copy email address", hint: P.email, run: () => copy(P.email, "email copied to clipboard") }] : []),
  ];
  let results = [], sel = 0, lastFocus = null;

  function renderPal() {
    const q = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    results = INDEX.filter((x) => { const hay = `${x.label} ${x.hint || ""} ${x.kw || ""} ${x.g}`.toLowerCase(); return q.every((w) => hay.includes(w)); });
    sel = Math.min(sel, Math.max(0, results.length - 1));
    if (!results.length) { list.innerHTML = `<li class="pal-none">no matches for “${esc(input.value)}”</li>`; return; }
    let g = null, html = "";
    results.forEach((x, i) => {
      if (x.g !== g) { g = x.g; html += `<li class="pal-grp" role="presentation">${esc(g)}</li>`; }
      html += `<li class="pal-item" role="option" id="pal-${i}" data-i="${i}" aria-selected="${i === sel}"><span class="ic">${esc(x.ic)}</span><span class="lb">${esc(x.label)}</span>${x.hint ? `<span class="ht">${esc(x.hint)}</span>` : ""}</li>`;
    });
    list.innerHTML = html;
    input.setAttribute("aria-activedescendant", `pal-${sel}`);
    $(`#pal-${sel}`)?.scrollIntoView({ block: "nearest" });
  }
  function openPal() { lastFocus = document.activeElement; pal.hidden = false; input.value = ""; sel = 0; renderPal(); input.focus(); document.body.style.overflow = "hidden"; }
  function closePal() { pal.hidden = true; document.body.style.overflow = ""; lastFocus?.focus?.(); }
  function go(x) {
    if (!x) return;
    closePal();
    if (x.run) return x.run();
    if (x.href.startsWith("#")) {
      if (x.pub) { const el = $(x.href); if (el?.hidden) setFilter("all"); }
      const el = document.getElementById(x.href.slice(1));
      if (!el) return;
      el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: x.pub ? "center" : "start" });
      history.replaceState(null, "", x.href);
      if (x.pub) { el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1600); }
    } else if (x.href.startsWith("mailto:")) location.href = x.href;
    else window.open(x.href, isExt(x.href) ? "_blank" : "_self", "noopener");
  }

  $("#open-palette").addEventListener("click", openPal);
  input.addEventListener("input", () => { sel = 0; renderPal(); });
  list.addEventListener("click", (e) => { const it = e.target.closest(".pal-item"); if (it) go(results[+it.dataset.i]); });
  list.addEventListener("mousemove", (e) => {
    const it = e.target.closest(".pal-item"); if (!it || +it.dataset.i === sel) return;
    sel = +it.dataset.i; $$(".pal-item", list).forEach((n) => n.setAttribute("aria-selected", +n.dataset.i === sel));
  });
  pal.addEventListener("mousedown", (e) => { if (e.target === pal) closePal(); });

  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.hidden ? openPal() : closePal(); return; }
    if (pal.hidden) {
      if (e.key === "/" && !typing) { e.preventDefault(); openPal(); }
      if (e.key === "Escape") closeMenu();
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); closePal(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(1, results.length); renderPal(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + results.length) % Math.max(1, results.length); renderPal(); }
    else if (e.key === "Enter") { e.preventDefault(); go(results[sel]); }
    else if (e.key === "Tab") { e.preventDefault(); input.focus(); }
  });
})();
