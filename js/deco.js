// Non-canvas decoration: markup the CSS themes paint with. Keyed by theme id.
const DECO = {
  cloud: `<div class="sun"></div>
    <svg class="cloud-layer far" preserveAspectRatio="none"><filter id="cloud-far" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".004 .009" numOctaves="5" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.6 0 0 0 -1.05"/></filter><rect width="100%" height="100%" filter="url(#cloud-far)"/></svg>
    <svg class="cloud-layer near" preserveAspectRatio="none"><filter id="cloud-near" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".006 .013" numOctaves="5" seed="11"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  3 0 0 0 -1.3"/></filter><rect width="100%" height="100%" filter="url(#cloud-near)"/></svg>`,

  dots: '<span class="sq-grey"></span><span class="sq-1"></span><span class="sq-2"></span><span class="sq-3"></span>',

  iridescent: '<span class="iri iri-blob"></span><span class="iri iri-orb"></span><span class="iri iri-ring"></span><span class="iri iri-pill"></span><span class="iri iri-cube"></span>',

  neon: `<div class="neon-sign">
      <svg viewBox="0 0 240 200" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <g class="tube-cyan"><path d="M30 104h180c0 46-40 76-90 76s-90-30-90-76Z"/><path d="M84 180v10h72v-10"/></g>
        <g class="tube-pink"><path d="M150 28 96 100M176 34 112 100"/><path d="M70 82c-8-14 8-22 0-36M100 78c-8-14 8-22 0-36" class="steam"/></g>
      </svg>
      <span>open late</span>
    </div>`,

  brutal: `<div class="marquee"><span>${'NO TEMPLATES ✶ NO GRADIENTS ✶ NO APOLOGIES ✶ CONCRETE IS A MOOD ✶ '.repeat(4)}</span></div>`,

  neu: '<div class="neu-dial"><div class="neu-ring"></div><div class="neu-knob"><b>21.5°</b><small>Living room</small></div></div>',

  swiss: '<span class="sw-circle"></span><span class="sw-bar"></span><span class="sw-num">29</span>',

  retro: `<ul class="desk-icons">
      <li><i class="ico ico-pc"></i>My Computer</li><li><i class="ico ico-folder"></i>Shareware</li>
      <li><i class="ico ico-disk"></i>A:\\ Floppy</li><li><i class="ico ico-bin"></i>Recycle Bin</li>
    </ul>`,

  clay: '<span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span><span class="blob b4"></span>',

  mac9: `<div class="menubar"><i class="apple"></i><b>File</b><b>Edit</b><b>View</b><b>Special</b><b>Help</b><span>4:20 PM</span></div>
    <ul class="mac-icons"><li><i class="ico-hd"></i>Macintosh HD</li><li><i class="ico-trash"></i>Trash</li></ul>`,

  aero: '<span class="aero-sun"></span><span class="aero-swoosh"></span><span class="aero-hill back"></span><span class="aero-hill"></span>' +
    '<span class="bubble u1"></span><span class="bubble u2"></span><span class="bubble u3"></span><span class="bubble u4"></span><span class="bubble u5"></span>',

  memphis: `<span class="m-circle"></span><span class="m-tri"></span><span class="m-dots"></span><span class="m-half"></span>
    <svg class="m-squiggle" viewBox="0 0 300 60"><path d="M5 30q18-28 36 0t36 0 36 0 36 0 36 0 36 0 36 0 36 0"/></svg>`,

  skeuo: '<div class="vinyl"><span class="disc"></span><span class="arm"></span></div>',

  cyber: '<span class="hud-c tl"></span><span class="hud-c tr"></span><span class="hud-c bl"></span><span class="hud-c br"></span>' +
    '<div class="reticle"><i></i><i></i></div><span class="hud-side">NIGHTWIRE // NET.ACCESS // 0xA3F9 // SECTOR 7</span><span class="scan"></span>',

  sketch: `<svg class="doodle d-arrow" viewBox="0 0 160 120"><path d="M150 10C110 20 60 30 40 90"/><path d="M26 74l14 18 18-14"/></svg>
    <svg class="doodle d-star" viewBox="0 0 60 60"><path d="M30 4l7 19 20 1-16 12 6 20-17-12-17 12 6-20L3 24l20-1z"/></svg>
    <svg class="doodle d-swirl" viewBox="0 0 80 80"><path d="M40 40m0-4a4 4 0 1 1-4 4 10 10 0 1 1 10 10 18 18 0 1 1-18-18 26 26 0 1 1 26 26"/></svg>
    <span class="coffee"></span><span class="note-text">start here!</span>`,

  techglass: '<span class="tg-orb o1"></span><span class="tg-orb o2"></span><span class="tg-grid"></span><span class="tg-data l"></span><span class="tg-data r"></span>',
};

// A figure that sits between the hero and the stats on one page.
const FIGURE = {
  blueprint: `<figure class="card">
      <svg viewBox="0 0 640 210" role="img" aria-label="Elevation drawing of the Halcyon truss bridge with an 84 metre clear span">
        <g fill="none" stroke="#f2f7ff" stroke-width="2" stroke-linejoin="round">
          <path d="M40 120H600M40 120 120 60H520L600 120"/>
          <path d="M120 60V120M200 60V120M280 60V120M360 60V120M440 60V120M520 60V120" stroke-width="1.5"/>
          <path d="M120 120 200 60M200 120 280 60M280 120 360 60M360 120 280 60M360 60 440 120M440 60 520 120" stroke-width="1.5"/>
          <path d="M40 120 20 150H60ZM600 120 580 150H620Z"/>
        </g>
        <g stroke="#ffe08a" stroke-width="1.5" fill="none"><path d="M40 178H600M40 168V188M600 168V188"/></g>
        <g fill="#ffe08a" font-family="ui-monospace, Consolas, monospace" font-size="15" text-anchor="middle">
          <text x="320" y="170">84.0 m clear span</text><text x="320" y="48">TOP CHORD HSS 200×200×10</text><text x="320" y="202">ELEVATION · SCALE 1:50</text>
        </g>
      </svg>
      <figcaption>Fig. 1: north elevation, truss panels at 4.0 m centres (illustrative).</figcaption>
    </figure>`,
};

// LB-42 holo console. Glow comes from a wide faint stroke under a thin bright one (no SVG/CSS filters),
// and only whole layers rotate or fade, so the browser never has to repaint the drawing itself.
FIGURE.techglass = (() => {
  const n = (k, f) => Array.from({ length: k }, (_, i) => f(i, k)).join('');
  const polar = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)].map(v => v.toFixed(1));
  const glow = (d, w = 1.4) => `<path d="${d}" class="hg-halo" stroke-width="${w * 5}"/><path d="${d}" stroke-width="${w}"/>`;
  const spokes = n(96, (i, k) => {
    const a = i / k * 6.2832, r0 = 30 + (i % 3) * 4, r1 = 62 + (i * 37 % 11);
    const [x0, y0] = polar(100, 100, r0, a), [x1, y1] = polar(100, 100, r1, a);
    return `M${x0} ${y0}L${x1} ${y1}`;
  });
  const ticks = n(60, (i, k) => { const a = i / k * 6.2832, [x0, y0] = polar(100, 100, 84, a), [x1, y1] = polar(100, 100, i % 5 ? 88 : 93, a); return `M${x0} ${y0}L${x1} ${y1}`; });
  const iris = `<svg viewBox="0 0 200 200" class="hg-svg">${glow(spokes, .9)}
      <circle cx="100" cy="100" r="28" class="hg-pupil"/>${glow('M100 16a84 84 0 1 1 0 168a84 84 0 1 1 0-168', .8)}${glow(ticks, .8)}</svg>`;

  const meridians = n(7, i => { const rx = 70 * Math.abs(Math.cos(i / 7 * 3.1416)); return `M100 30a${rx.toFixed(1)} 70 0 1 0 .01 0`; });
  const parallels = n(5, i => { const y = 30 + 140 * (i + 1) / 6, h = Math.sqrt(70 * 70 - (y - 100) ** 2); return `M${(100 - h).toFixed(1)} ${y.toFixed(1)}h${(2 * h).toFixed(1)}`; });
  const helix = ph => 'M' + Array.from({ length: 41 }, (_, i) => `${i * 6} ${(20 + 14 * Math.sin(i * 6 / 240 * 4 * 3.1416 + ph)).toFixed(1)}`).join('L');
  const rungs = n(20, i => { const x = i * 12 + 3, t = x / 240 * 4 * 3.1416; return `M${x} ${(20 + 14 * Math.sin(t)).toFixed(1)}L${x} ${(20 + 14 * Math.sin(t + 3.1416)).toFixed(1)}`; });
  const core = `<svg viewBox="0 0 200 200" class="hg-svg">${glow('M100 30a70 70 0 1 1 0 140a70 70 0 1 1 0-140')}${glow(meridians, .7)}${glow(parallels, .7)}
      <path d="M50 150h100M58 158h84" class="hg-red"/></svg>`;
  const dna = `<svg viewBox="0 0 240 40" class="hg-svg hg-dna">${glow(helix(0), 1.2)}${glow(helix(3.1416), 1.2)}${glow(rungs, .6)}</svg>`;

  const rings = n(5, i => `M100 ${100 - (i + 1) * 15}a${(i + 1) * 15} ${(i + 1) * 15} 0 1 1 0 ${(i + 1) * 30}a${(i + 1) * 15} ${(i + 1) * 15} 0 1 1 0-${(i + 1) * 30}`);
  const rays = n(24, (i, k) => { const [x, y] = polar(100, 100, 75, i / k * 6.2832); return `M100 100L${x} ${y}`; });
  const radar = `<svg viewBox="0 0 200 200" class="hg-svg">${glow(rings, .7)}${glow(rays, .5)}
      <rect x="62" y="70" width="14" height="22" rx="2" class="hg-blip"/><circle cx="128" cy="124" r="3" class="hg-blip"/></svg>`;

  const label = t => `<span class="hg-label">${t}</span>`;
  return `<figure class="holo" aria-label="Decorative holographic scanner console">
    <div class="hg-panel side">${label('IRIS / BIOMETRIC')}
      <div class="hg-stage"><div class="hg-spin slow">${iris}</div><span class="hg-callout"></span></div>
      <div class="hg-ticks"></div></div>
    <div class="hg-panel core">${label('SUBJECT 07 · HOLO')}
      <div class="hg-stage"><div class="hg-spin rev">${core}</div><span class="hg-scan"></span></div>
      ${dna}<span class="hg-dot"></span></div>
    <div class="hg-panel side">${label('GEO / TRACE')}
      <div class="hg-stage">${radar}<span class="hg-sweep"></span></div>
      <div class="hg-dots"></div></div>
  </figure>`;
})();
