// Procedural "photographs" (a sunset landscape, glowing orbs, bokeh) and colour helpers.
// Image-style themes render *from* these, so no external image files are needed.
// A renderer may return a frame(timeMs) function; app.js then animates it while its panel is on screen.
const RENDERERS = {};
const RENDERER_FILE = {};   // renderer name -> source file, shown in the spec drawer and copied prompts

const Scene = (() => {
  const HORIZON = .62;
  const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  function hslHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  }

  /** 256-entry RGB lookup table from [position, hex] stops. */
  function lut(stops) {
    const out = new Uint8ClampedArray(256 * 3), rgb = stops.map(([p, hex]) => [p, parseInt(hex.slice(1), 16)]);
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      let k = 1;
      while (k < rgb.length - 1 && rgb[k][0] < t) k++;
      const [p0, c0] = rgb[k - 1], [p1, c1] = rgb[k], f = Math.min(1, Math.max(0, (t - p0) / (p1 - p0)));
      for (let ch = 0; ch < 3; ch++) {
        const shift = 16 - 8 * ch, a = (c0 >> shift) & 255, b = (c1 >> shift) & 255;
        out[i * 3 + ch] = a + (b - a) * f;
      }
    }
    return out;
  }

  /** Paint onto an offscreen canvas and hand back the canvas plus its pixels. */
  function render(w, h, painter) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    painter(ctx, w, h);
    return { canvas, ctx, data: ctx.getImageData(0, 0, w, h).data };
  }

  // ---- palettes ----
  const SUNSET = { sky: ['#1b1740', '#5b2a86', '#c9487f', '#ff9a62', '#ffd88a'], sun: '#fff3c9', glow: '#ffbe78', layers: ['#7a3a8e', '#5a2b78', '#3d1d5e', '#26123f'] };
  const GOLDEN = { sky: ['#0e1b3d', '#2b3b7a', '#e4786b', '#ffc27a', '#ffe9b8'], sun: '#fff6dc', glow: '#ffd08a', layers: ['#3b3a6e', '#2c2c58', '#1f2145', '#14152f'] };
  const POP = { sky: ['#3ec3f0', '#7d8cf2', '#f25fb2', '#ff9d5c', '#ffe45c'], sun: '#ffffff', glow: '#fff3a0', layers: ['#a56ff0', '#8250dc', '#6038bc', '#42289a'] };   // mid-tones only: CMY inks stack to black fast
  const FLUTE = { bg: '#0d0b24', colors: ['#ff3d81', '#ff9f43', '#2ee6c9', '#6c5ce7', '#00b4ff'] };
  const MOSAIC = { bg: '#1a1722', colors: ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff924c'] };
  const LENS = { bg: '#0b0e1a', colors: ['#ff4d8d', '#ffb347', '#38e0c4', '#5b6cff', '#c77dff'] };
  /** One hue, many lightnesses: sky, sun and four ridges all drawn from the same colour. */
  const mono = hue => ({
    sky: [12, 24, 40, 62, 82].map((l, i) => hslHex(hue, 55 + i * 3, l)),
    sun: hslHex(hue, 85, 92), glow: hslHex(hue, 90, 78),
    layers: [34, 25, 17, 11].map(l => hslHex(hue, 45, l)),
  });

  // ---- painters ----
  function landscape(ctx, w, h, pal, seed = 7) {
    const horizon = h * HORIZON, sky = ctx.createLinearGradient(0, 0, 0, horizon);
    pal.sky.forEach((c, i) => sky.addColorStop(i / (pal.sky.length - 1), c));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    const sx = w * .68, sy = horizon - h * .07, sr = h * .1, glow = ctx.createRadialGradient(sx, sy, sr * .6, sx, sy, sr * 4.2);
    glow.addColorStop(0, hexA(pal.glow, .65)); glow.addColorStop(1, hexA(pal.glow, 0));
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = pal.sun; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 6.2832); ctx.fill();

    pal.layers.forEach((color, i) => {                          // far ridge first, nearer ridges sit lower
      const base = horizon + i * h * .07 - h * .08, amp = h * (.16 - i * .025);
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) ctx.lineTo(x, base - amp * Noise.fbm(x / (w * .35) + i * 9, i * 3.1, 5, seed + i));
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    });
  }

  function orbs(ctx, w, h, pal, seed = 3, count = 10) {
    const r = Noise.rng(seed);
    ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < count; i++) {
      const c = pal.colors[i % pal.colors.length], x = r() * w, y = r() * h, rad = (.16 + .22 * r()) * Math.max(w, h);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, hexA(c, .95)); g.addColorStop(1, hexA(c, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
  }

  function bokeh(ctx, w, h, seed = 5, count = 36) {
    const r = Noise.rng(seed);
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = hexA(r() < .5 ? '#ffd9a0' : '#ff9ec2', .12 + .25 * r());
      ctx.beginPath(); ctx.arc(r() * w, h * (.35 + .6 * r()), (.02 + .05 * r()) * Math.max(w, h), 0, 6.2832); ctx.fill();
    }
  }

  return { HORIZON, hexA, lut, render, SUNSET, GOLDEN, POP, FLUTE, MOSAIC, LENS, mono, hslHex, landscape, orbs, bokeh };
})();
