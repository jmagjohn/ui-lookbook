// Builds the lookbook: a gallery home, one tab + panel per THEMES entry, the spec drawer and "copy prompt".
// Canvas backgrounds render on demand; a renderer that returns frame(t) is animated while its page is visible.
(() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const $ = id => document.getElementById(id);
  const code = t => 'LB-' + String(t.n).padStart(2, '0');
  const KINDS = { texture: 'Texture', pattern: 'Pattern', scene: 'Scene', style: 'UI style' };
  const TILE_W = 960, TILE_H = 600;                                   // gallery thumbnails are real mini pages at this size, scaled down
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const tablist = $('tablist'), host = $('panels'), gallery = $('gallery'), grid = $('gallery-grid'), drawer = $('spec');
  const specBtn = $('spec-btn'), copyBtn = $('copy-btn'), toast = $('toast');
  const byId = Object.fromEntries(THEMES.map(t => [t.id, t]));

  // ---------- page template ----------
  const stat = ([label, value]) => `<div class="stat"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
  const card = ([title, body, price]) => `<article class="card"><h3>${esc(title)}</h3><p>${esc(body)}</p>${price ? `<p class="price">${esc(price)}</p>` : ''}</article>`;
  const row = ([when, what, tag]) => `<li><span>${esc(when)}</span><span>${esc(what)}</span><span class="tag">${esc(tag)}</span></li>`;
  const button = (label, i) => `<button class="btn${i ? ' ghost' : ''}" type="button">${esc(label)}</button>`;

  /** A small set of app controls, worded from the page's own data so every style shows real-looking UI. */
  const kitHtml = t => {
    const id = t.id, tags = [...new Set(t.rows.map(r => r[2]))].slice(0, 4);
    return `<section class="sec sec-kit"><h2>Interface kit</h2>
      <div class="kit">
        <form class="card kit-form" aria-label="Sample form" onsubmit="return false">
          <h3>Preferences</h3>
          <label class="field"><span>Email</span><input type="email" placeholder="you@example.com" autocomplete="off"></label>
          <label class="field"><span>Sort ${esc(t.cardsTitle.toLowerCase())} by</span><select><option>Most popular</option><option>Newest first</option><option>Price, low to high</option></select></label>
          <div class="field"><span id="seg-${id}">View</span><div class="seg" role="group" aria-labelledby="seg-${id}"><button type="button" aria-pressed="true">Grid</button><button type="button" aria-pressed="false">List</button><button type="button" aria-pressed="false">Map</button></div></div>
          <label class="switch"><input type="checkbox" role="switch" checked><span>Email me updates</span></label>
          <label class="check"><input type="checkbox"><span>Remember this device</span></label>
          <p class="actions"><button class="btn" type="submit">Save changes</button><button class="btn ghost" type="reset">Cancel</button></p>
        </form>
        <div class="kit-side">
          <div class="card alert" role="note"><h3>Heads up</h3><p>${esc(t.rows[1][1])}: <strong>${esc(t.rows[1][2])}</strong>.</p></div>
          <div class="card"><h3>Progress</h3>
            <div class="meter-label"><span>Profile set-up</span><span>72%</span></div><div class="meter" role="progressbar" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100" aria-label="Profile set-up"><span style="width:72%"></span></div>
            <div class="meter-label"><span>Storage used</span><span>38%</span></div><div class="meter" role="progressbar" aria-valuenow="38" aria-valuemin="0" aria-valuemax="100" aria-label="Storage used"><span style="width:38%"></span></div>
          </div>
          <div class="card"><h3>Tags &amp; people</h3><p class="chips">${tags.map(g => `<span class="tag">${esc(g)}</span>`).join('')}</p>
            <p class="avatars">${['AK', 'MR', 'JS', '+4'].map(a => `<span>${a}</span>`).join('')}</p></div>
        </div>
      </div></section>`;
  };

  /** Background layer. Gallery tiles prefix SVG ids so their filters don't collide with the full pages. */
  const decoHtml = (t, { fixed = true, prefix = '' } = {}) => t.render
    ? `<div class="deco${fixed ? ' fixed' : ''}" aria-hidden="true"><canvas class="deco-canvas" data-render="${t.render}"></canvas></div>`
    : `<div class="deco" aria-hidden="true">${(DECO[t.id] || '').replace(/(id="|url\(#)/g, '$1' + prefix)}</div>`;

  const panelHtml = t => `${decoHtml(t)}
    <div class="wrap">
      <header class="hero">
        <p class="eyebrow">${esc(t.eyebrow)}</p><h1>${esc(t.h1)}</h1><p class="lede">${esc(t.lede)}</p>
        <p class="actions">${t.actions.map(button).join('')}</p>
      </header>
      ${FIGURE[t.id] || ''}
      <dl class="stats">${t.stats.map(stat).join('')}</dl>
      <section class="sec sec-cards"><h2>${esc(t.cardsTitle)}</h2><div class="cards">${t.cards.map(card).join('')}</div></section>
      <section class="sec sec-rows"><h2>${esc(t.rowsTitle)}</h2><ul class="rows">${t.rows.map(row).join('')}</ul></section>
      ${kitHtml(t)}
      <p class="foot">${esc(t.foot)}</p>
    </div>`;

  const tileHtml = t => {
    const s = SPECS[t.id];
    return `<a class="tile" href="#${t.id}" data-kind="${s.kind}" aria-label="${code(t)} ${esc(t.label)}">
      <div class="tile-view" aria-hidden="true"><div class="mini theme-${t.id}">${decoHtml(t, { fixed: false, prefix: 'g-' })}
        <div class="mini-wrap"><p class="eyebrow">${esc(t.eyebrow)}</p><h1>${esc(t.h1)}</h1>
          <p class="actions">${t.actions.map((a, i) => `<span class="btn${i ? ' ghost' : ''}">${esc(a)}</span>`).join('')}</p><dl class="stats">${t.stats.slice(0, 3).map(stat).join('')}</dl></div>
      </div></div>
      <div class="tile-cap"><span class="code">${code(t)}</span><strong>${esc(t.label)}</strong><span class="kind">${KINDS[s.kind]}</span>
        <span class="mood">${s.mood.map(esc).join(' · ')}</span></div>
    </a>`;
  };

  THEMES.forEach((t, i) => {
    tablist.insertAdjacentHTML('beforeend',
      `<button role="tab" id="tab-${t.id}" aria-controls="panel-${t.id}" aria-selected="false" tabindex="${i === 0 ? 0 : -1}"><b>${code(t)}</b> ${esc(t.label)}</button>`);
    host.insertAdjacentHTML('beforeend',
      `<section id="panel-${t.id}" role="tabpanel" aria-labelledby="tab-${t.id}" class="panel theme-${t.id}" tabindex="0" hidden>${panelHtml(t)}</section>`);
  });
  grid.innerHTML = THEMES.map(tileHtml).join('');
  $('gallery-count').textContent = THEMES.length;

  // ---------- canvas rendering + animation ----------
  let anim = null, rafId = 0, lastFrame = 0;
  function loop(now) {
    rafId = requestAnimationFrame(loop);
    if (now - lastFrame < 33) return;                                // ~30 fps is plenty for a background
    lastFrame = now; anim(now);
  }
  function setAnim(fn) {
    cancelAnimationFrame(rafId); anim = fn;
    if (anim && !reduceMotion.matches) rafId = requestAnimationFrame(loop);
  }

  function draw(canvas, w, h) {
    const size = `${w}x${h}`;
    if (canvas.dataset.size === size) return;
    canvas.dataset.size = size;
    canvas.frame = RENDERERS[canvas.dataset.render](canvas, w, h) || null;
  }

  /** Draw any canvas in this panel that hasn't been drawn at the current window size, then animate it if it can be. */
  function renderPanel(panel) {
    const canvases = [...panel.querySelectorAll('canvas[data-render]')];
    canvases.forEach(c => draw(c, innerWidth, innerHeight));
    setAnim(canvases.map(c => c.frame).find(Boolean) || null);
  }
  reduceMotion.addEventListener('change', () => { const p = currentPanel(); if (p) renderPanel(p); });

  // gallery thumbnails render lazily, one per idle slot, so scrolling stays smooth
  const queue = [];
  const pump = () => {
    const c = queue.shift();
    if (!c) return;
    draw(c, TILE_W, TILE_H);
    setTimeout(pump, 16);
  };
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const c = e.target.querySelector('canvas[data-render]');
    if (c) { queue.push(c); if (queue.length === 1) setTimeout(pump, 16); }
  }), { rootMargin: '300px' });
  grid.querySelectorAll('.tile').forEach(tile => io.observe(tile));
  const fitTiles = () => {                                          // measure a visible tile: hidden ones report 0 width
    const view = [...grid.querySelectorAll('.tile:not([hidden]) .tile-view')].find(v => v.offsetWidth);
    if (view) grid.style.setProperty('--tile-scale', view.offsetWidth / TILE_W);
  };
  new ResizeObserver(fitTiles).observe(grid);

  // ---------- routing: #gallery (home) or #<theme id> ----------
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panelOf = tab => $(tab.getAttribute('aria-controls'));
  const currentTab = () => tabs.find(t => t.getAttribute('aria-selected') === 'true');
  const currentPanel = () => { const t = currentTab(); return t && panelOf(t); };
  const themeOf = tab => byId[tab.id.replace('tab-', '')];

  function select(tab, { focus = false } = {}) {
    gallery.hidden = true;
    document.body.classList.remove('at-gallery');
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      panelOf(t).hidden = !on;
    });
    history.replaceState(null, '', '#' + themeOf(tab).id);
    window.scrollTo(0, 0);
    tab.scrollIntoView({ inline: 'center', block: 'nearest' });
    if (focus) tab.focus();
    specBtn.querySelector('b').textContent = code(themeOf(tab));
    if (!drawer.hidden) fillSpec(themeOf(tab));
    requestAnimationFrame(() => renderPanel(panelOf(tab)));         // let the tab repaint before the heavy drawing
  }

  function showGallery() {
    setAnim(null);
    closeSpec();
    tabs.forEach((t, i) => { t.setAttribute('aria-selected', false); t.tabIndex = i ? -1 : 0; panelOf(t).hidden = true; });
    gallery.hidden = false;
    document.body.classList.add('at-gallery');
    window.scrollTo(0, 0);
    tablist.scrollTo({ left: 0 });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      const next = e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs.at(-1) : step ? tabs[(i + step + tabs.length) % tabs.length] : null;
      if (next) { e.preventDefault(); select(next, { focus: true }); }
    });
  });

  function route() {
    const tab = tabs.find(t => '#' + themeOf(t).id === location.hash);
    if (tab) select(tab); else showGallery();
  }
  addEventListener('hashchange', route);

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { const p = currentPanel(); if (p) renderPanel(p); }, 250);
  });

  // ---------- gallery filters ----------
  $('filters').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    $('filters').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    grid.querySelectorAll('.tile').forEach(tile => { tile.hidden = b.dataset.kind !== 'all' && tile.dataset.kind !== b.dataset.kind; });
    fitTiles();
  });
  $('filters').querySelectorAll('button').forEach(b => {
    const n = b.dataset.kind === 'all' ? THEMES.length : THEMES.filter(t => SPECS[t.id].kind === b.dataset.kind).length;
    b.insertAdjacentHTML('beforeend', ` <span>${n}</span>`);
  });

  // ---------- interface kit behaviour ----------
  host.addEventListener('click', e => {
    const b = e.target.closest('.seg button');
    if (b) b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
  });

  // ---------- spec: tokens are read live from the theme's CSS so the sheet can never drift from the design ----------
  const TOKENS = [['Page', null], ['Text', '--ink'], ['Muted text', '--muted'], ['Surface', '--card-bg'], ['Surface text', '--card-ink'],
    ['Primary', '--btn-bg'], ['On primary', '--btn-ink'], ['Tag', '--tag-bg'], ['Accent', '--accent']];
  const firstFont = stack => stack.split(',')[0].replace(/["']/g, '').trim();

  function readSpec(t) {
    const panel = $('panel-' + t.id), cs = getComputedStyle(panel), v = name => cs.getPropertyValue(name).trim();
    const seen = new Map(), palette = [];
    for (const [label, prop] of TOKENS) {
      const value = prop ? v(prop) : cs.backgroundColor;
      if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') continue;
      if (seen.has(value)) { seen.get(value)[0] += ' / ' + label.toLowerCase(); continue; }   // e.g. "Text / primary"
      const entry = [label, value];
      seen.set(value, entry); palette.push(entry);
    }
    return {
      palette, head: v('--head'), body: v('--body'), radius: v('--radius') || '0',
      border: v('--card-bd') || 'none', shadow: v('--card-shadow') || 'none', blur: v('--blur') || 'none',
      css: SPECS[t.id].css || KIND_FILE[SPECS[t.id].kind], js: t.render ? RENDERER_FILE[t.render] : null,
    };
  }

  function promptFor(t) {
    const s = SPECS[t.id], k = readSpec(t);
    return [
      `Style this UI like page ${code(t)} "${t.label}" from my texture-themes lookbook.`,
      ``,
      `Mood: ${s.mood.join(', ')}.`,
      `Good for: ${s.use}`,
      `How it's built: ${s.tech}`,
      ``,
      `Palette: ${k.palette.map(([l, c]) => `${l.toLowerCase()} ${c}`).join(' · ')}`,
      `Type: headings in ${k.head}; body in ${k.body}.`,
      `Shape: corner radius ${k.radius}; surface border ${k.border}; surface shadow ${k.shadow}${k.blur !== 'none' ? `; backdrop ${k.blur}` : ''}.`,
      `Apply the same tokens to every component: buttons (filled primary + outlined ghost), inputs, selects, segmented controls, toggles, checkboxes, cards, list rows, tags, alerts and progress bars.`,
      ``,
      `Reference implementation (if you can read my workspace): texture-themes/${k.css} (.theme-${t.id})${k.js ? `, texture-themes/${k.js} (RENDERERS.${t.render})` : ''}${DECO[t.id] ? ', texture-themes/js/deco.js (DECO.' + t.id + ')' : ''}, texture-themes/css/base.css (shared layout + components).`,
    ].join('\n');
  }

  function fillSpec(t) {
    const s = SPECS[t.id], k = readSpec(t);
    $('spec-title').innerHTML = `<span class="code">${code(t)}</span> ${esc(t.label)}`;
    $('spec-body').innerHTML = `
      <p class="spec-kind">${KINDS[s.kind]}</p>
      <p class="spec-mood">${s.mood.map(m => `<span>${esc(m)}</span>`).join('')}</p>
      <h3>Good for</h3><p>${esc(s.use)}</p>
      <h3>Palette <small>click to copy</small></h3>
      <ul class="swatches">${k.palette.map(([l, c]) => `<li><button type="button" data-copy="${esc(c)}"><i style="--c:${esc(c)}"></i><span>${esc(l)}</span><code>${esc(c)}</code></button></li>`).join('')}</ul>
      <h3>Type</h3><p class="type-sample" style="font-family:${esc(k.head)}">Aa ${esc(firstFont(k.head))}</p><p class="type-sample body" style="font-family:${esc(k.body)}">Body · ${esc(firstFont(k.body))}</p>
      <h3>Shape</h3><dl class="spec-dl"><dt>Radius</dt><dd>${esc(k.radius)}</dd><dt>Border</dt><dd>${esc(k.border)}</dd><dt>Shadow</dt><dd>${esc(k.shadow)}</dd>${k.blur !== 'none' ? `<dt>Backdrop</dt><dd>${esc(k.blur)}</dd>` : ''}</dl>
      <h3>How it's built</h3><p>${esc(s.tech)}</p>
      <h3>Source</h3><ul class="spec-src"><li><code>${k.css}</code> → <code>.theme-${t.id}</code></li>${k.js ? `<li><code>${k.js}</code> → <code>RENDERERS.${t.render}</code></li>` : ''}${DECO[t.id] ? `<li><code>js/deco.js</code> → <code>DECO.${t.id}</code></li>` : ''}</ul>
      <h3>Prompt</h3><textarea id="spec-prompt" readonly rows="9">${esc(promptFor(t))}</textarea>
      <button class="spec-copy" type="button" data-copy-prompt>Copy prompt</button>`;
  }

  function openSpec() {
    const tab = currentTab();
    if (!tab) return;
    fillSpec(themeOf(tab));
    drawer.hidden = false; specBtn.setAttribute('aria-expanded', true);
    $('spec-close').focus();
  }
  function closeSpec() {
    if (drawer.hidden) return;
    drawer.hidden = true; specBtn.setAttribute('aria-expanded', false);
  }
  specBtn.addEventListener('click', () => drawer.hidden ? openSpec() : (closeSpec(), specBtn.focus()));
  $('spec-close').addEventListener('click', () => { closeSpec(); specBtn.focus(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) { closeSpec(); specBtn.focus(); } });

  // ---------- clipboard ----------
  let toastTimer;
  function say(msg) {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); }
    catch {                                                         // file:// pages may not get the async clipboard
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    say(msg);
  }
  copyBtn.addEventListener('click', () => { const tab = currentTab(); if (tab) copy(promptFor(themeOf(tab)), `Prompt for ${code(themeOf(tab))} copied`); });
  drawer.addEventListener('click', e => {
    const sw = e.target.closest('[data-copy]');
    if (sw) copy(sw.dataset.copy, `${sw.dataset.copy} copied`);
    if (e.target.closest('[data-copy-prompt]')) copy($('spec-prompt').value, 'Prompt copied');
  });

  route();
})();
