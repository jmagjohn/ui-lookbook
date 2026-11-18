// Renderers that compute a picture from maths alone: noise fields, blades, lenses.
// Signature: RENDERERS[name](canvas, viewportWidth, viewportHeight).

const THERMAL = [[0, '#05010f'], [.2, '#2a0a6b'], [.4, '#a31a7a'], [.58, '#e8452c'], [.75, '#ffa41b'], [.9, '#fff06a'], [1, '#ffffff']];
const GRAINY = [[0, '#1a0b4d'], [.25, '#5b21b6'], [.5, '#e11d74'], [.75, '#ff7a3c'], [1, '#ffe0b0']];

/** Fill a canvas pixel by pixel; shade(x, y) returns a 0-255 index into the colour LUT. */
function paintLut(canvas, w, h, lut, shade) {
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = shade(x, y) * 3, p = (y * w + x) * 4;
    d[p] = lut[i]; d[p + 1] = lut[i + 1]; d[p + 2] = lut[i + 2]; d[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

// 3 · Thermal gradients: noise mapped through an infrared palette, rendered small and smoothed up
RENDERERS.thermal = (canvas, vw, vh) => {
  const lut = Scene.lut(THERMAL);
  paintLut(canvas, Math.ceil(vw / 4), Math.ceil(vh / 4), lut, (x, y) => {
    const v = Noise.clamp01((Noise.fbm(x / 70, y / 70, 4, 21) - .3) * 2.2);   // 4 octaves: a 5th aliases into blocks at 4x upscale
    return Math.round(Math.pow(v, 1.25) * 255);
  });
};

// 9 · Grainy gradients: a warped diagonal gradient whose grain is strongest mid-transition
RENDERERS.grainy = (canvas, vw, vh) => {
  const rnd = Noise.rng(5);
  paintLut(canvas, vw, vh, Scene.lut(GRAINY), (x, y) => {
    const f = Noise.clamp01(.62 * (x / vw) + .38 * (1 - y / vh) + .55 * (Noise.fbm(x / vw * 2.2, y / vh * 2.2, 3, 4) - .5));
    const grain = (rnd() - .5) * .44 * (.3 + .7 * 4 * f * (1 - f));
    return Math.round(Noise.clamp01(f + grain) * 255);
  });
};

// 13 · Contour lines: marching squares over a noise "terrain"; every 5th line is an index contour
const MARCH = [[], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], [[0, 3], [2, 1]], [[0, 2]], [[0, 3]],
  [[0, 3]], [[0, 2]], [[0, 1], [2, 3]], [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], []];   // edge pairs per corner case; edges: 0 top, 1 right, 2 bottom, 3 left

RENDERERS.contour = (canvas, vw, vh) => {
  const s = 7, cols = Math.ceil(vw / s) + 1, rows = Math.ceil(vh / s) + 1, field = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) field[j * cols + i] = Noise.fbm(i * s / 520, j * s / 520, 5, 5);
  canvas.width = vw; canvas.height = vh;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#10231f'; ctx.fillRect(0, 0, vw, vh);

  const LEVELS = 28, LO = .24, HI = .78;
  for (let L = 0; L <= LEVELS; L++) {
    const level = LO + (HI - LO) * L / LEVELS, major = L % 5 === 0;
    ctx.strokeStyle = major ? 'rgba(127,230,180,.9)' : 'rgba(95,201,160,.42)';
    ctx.lineWidth = major ? 1.9 : 1;
    ctx.beginPath();
    for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
      const tl = field[j * cols + i], tr = field[j * cols + i + 1], bl = field[(j + 1) * cols + i], br = field[(j + 1) * cols + i + 1];
      const c = (tl > level ? 8 : 0) | (tr > level ? 4 : 0) | (br > level ? 2 : 0) | (bl > level ? 1 : 0);
      if (!MARCH[c].length) continue;
      const x = i * s, y = j * s, t = (a, b) => (level - a) / (b - a);
      const edge = e => e === 0 ? [x + s * t(tl, tr), y] : e === 1 ? [x + s, y + s * t(tr, br)] : e === 2 ? [x + s * t(bl, br), y + s] : [x, y + s * t(tl, bl)];
      for (const [a, b] of MARCH[c]) { const p = edge(a), q = edge(b); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }
    }
    ctx.stroke();
  }
};

// 10 · Grass texture: ~110k leaning blades, painted back to front, with diagonal mowing stripes
RENDERERS.grass = (canvas, vw, vh) => {
  canvas.width = vw; canvas.height = vh;
  const ctx = canvas.getContext('2d'), r = Noise.rng(11);
  ctx.fillStyle = '#12301a'; ctx.fillRect(0, 0, vw, vh);
  ctx.lineCap = 'round';
  for (let y = -10; y < vh + 30; y += 3) for (let x = -6; x < vw + 6; x += 3.6) {
    const bx = x + r() * 6, by = y + r() * 3, len = 12 + r() * 16, lean = (r() - .5) * 10 + 4 * Math.sin(by / 90 + bx / 260);
    const stripe = Math.floor((bx + by * .7) / 120) % 2 ? 7 : 0;
    ctx.strokeStyle = `hsl(${84 + r() * 34 | 0}, ${42 + r() * 24 | 0}%, ${17 + (by / vh) * 10 + r() * 17 + stripe | 0}%)`;
    ctx.lineWidth = 1 + r() * .9;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + lean * .3, by - len * .55, bx + lean, by - len); ctx.stroke();
  }
};

// 2 · Fluted glass: every rib is a cylinder lens that shows a flipped, compressed slice of the scene behind it
RENDERERS.fluted = (canvas, vw, vh) => {
  const src = Scene.render(vw, vh, (c, w, h) => Scene.orbs(c, w, h, Scene.FLUTE, 3, 10)).canvas, rib = 36;
  canvas.width = vw; canvas.height = vh;
  const ctx = canvas.getContext('2d');
  for (let x = 0; x < vw; x++) {
    const u = ((x % rib) / rib) * 2 - 1, centre = x - (x % rib) + rib / 2;
    const sx = Math.min(vw - 1, Math.max(0, Math.round(centre - u * rib * 1.3)));
    ctx.drawImage(src, sx, 0, 1, vh, x, 0, 1, vh);
  }
  for (let x0 = 0; x0 < vw; x0 += rib) {                         // glassy shading per rib
    const g = ctx.createLinearGradient(x0, 0, x0 + rib, 0);
    g.addColorStop(0, 'rgba(255,255,255,.24)'); g.addColorStop(.4, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.32)');
    ctx.fillStyle = g; ctx.fillRect(x0, 0, rib, vh);
  }
};

// 16 · Lens distortion: bubble lenses magnify a grid and split the colour channels slightly
const LENS_DEFS = [[.18, .32, .19], [.8, .24, .15], [.62, .74, .24]];   // centre x, centre y, radius (fractions of width, height, short side)
const LENS_MAGNIFY = [.42, .45, .48];                                   // R, G, B differ a little for a chromatic fringe

RENDERERS.lens = (canvas, vw, vh) => {
  const src = Scene.render(vw, vh, (c, w, h) => {
    Scene.orbs(c, w, h, Scene.LENS, 8, 9);
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.beginPath();
    for (let x = 0; x < w; x += 44) { c.moveTo(x + .5, 0); c.lineTo(x + .5, h); }
    for (let y = 0; y < h; y += 44) { c.moveTo(0, y + .5); c.lineTo(w, y + .5); }
    c.stroke();
  }).data;
  canvas.width = vw; canvas.height = vh;
  const ctx = canvas.getContext('2d'), out = ctx.createImageData(vw, vh), o = out.data;
  o.set(src);
  const lenses = LENS_DEFS.map(([fx, fy, fr]) => ({ x: fx * vw, y: fy * vh, r: fr * Math.min(vw, vh) }));
  for (const L of lenses) {
    for (let y = Math.max(0, Math.floor(L.y - L.r)); y < Math.min(vh, L.y + L.r); y++) {
      for (let x = Math.max(0, Math.floor(L.x - L.r)); x < Math.min(vw, L.x + L.r); x++) {
        const dx = x - L.x, dy = y - L.y, nd = Math.hypot(dx, dy) / L.r;
        if (nd >= 1) continue;
        for (let c = 0; c < 3; c++) {
          const k = LENS_MAGNIFY[c] + (1 - LENS_MAGNIFY[c]) * nd * nd;   // <1 near the centre means magnified
          const sx = Math.min(vw - 1, Math.max(0, Math.round(L.x + dx * k))), sy = Math.min(vh - 1, Math.max(0, Math.round(L.y + dy * k)));
          o[(y * vw + x) * 4 + c] = src[(sy * vw + sx) * 4 + c];
        }
      }
    }
  }
  ctx.putImageData(out, 0, 0);
  for (const L of lenses) {                                       // rim + specular highlight
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(L.x, L.y, L.r, 0, 6.2832); ctx.stroke();
    const hx = L.x - L.r * .35, hy = L.y - L.r * .4, g = ctx.createRadialGradient(hx, hy, 0, hx, hy, L.r * .5);
    g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(L.x, L.y, L.r, 0, 6.2832); ctx.fill();
  }
};

// 4 · Water ripples (animated): drops land at random and their rings spread and fade over a slow swell.
// The height field is shaded by its slope, so crests catch the sky and troughs fall into deep water.
const WATER = [[0, '#021722'], [.3, '#05374a'], [.52, '#0b6476'], [.7, '#2f9aa8'], [.84, '#9fe3e6'], [.94, '#e9fbfb'], [1, '#ffffff']];

// Perf notes (it runs every frame): the swell waves are separable, sin(ax + by + ct) = sin(ax)·cos(by + ct) + cos(ax)·sin(by + ct),
// so no per-pixel Math.sin; drops only visit pixels inside their ring; pixels are written as packed 32-bit words.
const SWELL = [[3, .045 * 4 / 3, .02 * 4 / 3, .8], [2, -.028 * 4 / 3, .05 * 4 / 3, 1.15], [.7, .1 * 4 / 3, .085 * 4 / 3, -1.7]];   // amp, kx, ky, speed

RENDERERS.ripple = (canvas, vw, vh) => {
  const k = 4, w = Math.ceil(vw / k), h = Math.ceil(vh / k), LIFE = 7, SPEED = 15 * 3 / k;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d'), img = ctx.createImageData(w, h), px32 = new Uint32Array(img.data.buffer), H = new Float32Array(w * h);
  const lut = Scene.lut(WATER), r = Noise.rng(4), drops = [];
  const pal = new Uint32Array(256);                                // little-endian ABGR, ready to drop into px32
  for (let i = 0; i < 256; i++) pal[i] = (255 << 24 | lut[i * 3 + 2] << 16 | lut[i * 3 + 1] << 8 | lut[i * 3]) >>> 0;
  const colSin = SWELL.map(([, kx]) => Float32Array.from({ length: w }, (_, x) => Math.sin(kx * x)));
  const colCos = SWELL.map(([, kx]) => Float32Array.from({ length: w }, (_, x) => Math.cos(kx * x)));
  const drop = t0 => drops.push({ x: r() * w, y: r() * h, t0, amp: .7 + r() * .8 });
  let next = performance.now() / 1000;
  for (let i = 0; i < 12; i++) drop(next - r() * LIFE);           // start mid-rain so the first frame already looks alive

  const frame = ms => {
    const t = ms / 1000;
    if (next < t - LIFE) next = t - LIFE;                          // tab was away: skip drops that would have finished anyway
    while (next < t) { drop(next); next += .2 + r() * .6; }
    for (let i = drops.length - 1; i >= 0; i--) if (t - drops[i].t0 > LIFE) drops.splice(i, 1);

    for (let n = 0; n < SWELL.length; n++) {
      const [amp, , ky, speed] = SWELL[n], cs = colSin[n], cc = colCos[n];
      for (let y = 0, i = 0; y < h; y++) {
        const ph = ky * y + speed * t, a = amp * Math.cos(ph), b = amp * Math.sin(ph);
        if (n === 0) for (let x = 0; x < w; x++, i++) H[i] = a * cs[x] + b * cc[x];
        else for (let x = 0; x < w; x++, i++) H[i] += a * cs[x] + b * cc[x];
      }
    }

    const S = 3 / k, freq = 1.1 / S;                               // ring sizes were tuned at k = 3
    for (const d of drops) {
      const age = t - d.t0;
      if (age < 0) continue;
      const front = age * SPEED, sig = (2.2 + age * .9) * S, band = 3 * sig, rOut = front + band, rIn = Math.max(0, front - band);
      const amp = d.amp * (1 - age / LIFE) ** 1.5 / (1 + front / S * .012), inv2s2 = 1 / (2 * sig * sig);
      const y0 = Math.max(0, Math.ceil(d.y - rOut)), y1 = Math.min(h - 1, Math.floor(d.y + rOut));
      for (let y = y0; y <= y1; y++) {
        const dy = y - d.y, dy2 = dy * dy, ox = Math.sqrt(Math.max(0, rOut * rOut - dy2)), ix = rIn * rIn > dy2 ? Math.sqrt(rIn * rIn - dy2) : 0;
        const row = y * w;
        // the ring crosses this row in up to two spans: [cx - ox, cx - ix] and [cx + ix, cx + ox]
        for (let side = -1; side <= 1; side += 2) {
          const s0 = side < 0 ? d.x - ox : d.x + ix, s1 = side < 0 ? d.x - ix : d.x + ox;
          for (let x = Math.max(0, Math.ceil(s0)), xe = Math.min(w - 1, Math.floor(s1)); x <= xe; x++) {
            const dx = x - d.x, u = Math.sqrt(dx * dx + dy2) - front;
            H[row + x] += amp * Math.exp(-u * u * inv2s2) * Math.cos(u * freq);
          }
        }
      }
    }

    const gy = .42, gx = .24;
    for (let y = 0, i = 0; y < h; y++) {
      const base = .4 + .16 * (y / h), up = y > 0 ? -w : 0, down = y < h - 1 ? w : 0;   // deeper at the top, shallower near the viewer
      for (let x = 0; x < w; x++, i++) {
        const sx = H[i + (x < w - 1 ? 1 : 0)] - H[i - (x > 0 ? 1 : 0)], sy = H[i + down] - H[i + up];
        let v = (base + gy * sy - gx * sx) * 255 | 0;
        px32[i] = pal[v < 0 ? 0 : v > 255 ? 255 : v];
      }
    }
    ctx.putImageData(img, 0, 0);
  };
  frame(performance.now());
  return frame;
};

// 24 · Marble: domain-warped noise (noise fed back into its own coordinates) folded into thin veins, plus rare gold seams
RENDERERS.marble = (canvas, vw, vh) => {
  const k = 2, w = Math.ceil(vw / k), h = Math.ceil(vh / k), S = 360 / k;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
  for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4) {
    const u = x / S, v = y / S, q = Noise.fbm(u, v, 4, 1), q2 = Noise.fbm(u + 5.2, v + 1.3, 4, 2);
    const warp = Noise.fbm(u + 3.2 * q, v + 3.2 * q2, 5, 3);
    const fold = 1 - Math.abs(Math.sin((u * .8 + v * .45 + 7 * warp) * 2.2));
    const vein = Math.pow(fold, 14) * .7 + Math.pow(fold, 3) * .16;
    const gold = Math.pow(1 - Math.abs(Math.sin((u * .3 - v * .7 + 6 * q2) * 1.6)), 90) * .9;
    const base = 246 - 22 * (warp - .5);
    let R = base, G = base - 1, B = base - 5;                     // warm white
    R += vein * (96 - R); G += vein * (101 - G); B += vein * (112 - B);
    R += gold * (196 - R); G += gold * (154 - G); B += gold * (70 - B);
    d[i] = R; d[i + 1] = G; d[i + 2] = B; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
};

// 26 · Wood grain: each plank is a slice through a log, so growth rings show as long "cathedral" arches;
// latewood lines are thin and dark, pores are stretched along the board, seams and butt joints are drawn on top
const WOOD = [[0, '#3a200e'], [.35, '#6b3f1d'], [.7, '#a26838'], [1, '#d09a62']];

RENDERERS.wood = (canvas, vw, vh) => {
  const P = 150, lut = Scene.lut(WOOD), cx = [], cy = [];
  for (let row = 0; row * P < vh + P; row++) { cx[row] = Noise.hash(row, 3, 26) * vw; cy[row] = P * (1.1 + Noise.hash(row, 5, 26) * .8); }
  paintLut(canvas, vw, vh, lut, (x, y) => {
    const row = Math.floor(y / P), ly = y - row * P, dx = (x - cx[row]) * .055, dy = ly - cy[row];
    const rings = Math.sqrt(dx * dx + dy * dy) * .085 + 2.4 * Noise.fbm(x / 420, ly / 140, 3, row * 7 + 3);
    const ring = rings - Math.floor(rings), late = ring > .78 ? (ring - .78) / .22 : 0;   // dark latewood band at the end of each ring
    const pore = Noise.value(x / 26, y * .9, row), tint = (Noise.hash(row, 1, 9) - .5) * .2;
    return Math.round(Noise.clamp01(.72 - .5 * late * late + tint + (pore - .5) * .16 + (Noise.value(x / 300, ly / 40, row + 50) - .5) * .18) * 255);
  });
  const ctx = canvas.getContext('2d'), r = Noise.rng(26);
  for (let y = 0, row = 0; y < vh; y += P, row++) {
    ctx.fillStyle = 'rgba(18,9,3,.8)'; ctx.fillRect(0, y - 1, vw, 3);
    ctx.fillStyle = 'rgba(255,220,170,.1)'; ctx.fillRect(0, y + 2, vw, 1);
    for (let x = (row % 2 ? 380 : 120) + r() * 200; x < vw; x += 520 + r() * 420) {   // staggered butt joints
      ctx.fillStyle = 'rgba(18,9,3,.75)'; ctx.fillRect(x, y, 2, P);
    }
  }
};

// 23 · Risograph: two spot inks printed as separate grainy passes, slightly out of register, multiplied on cream paper
RENDERERS.riso = (canvas, vw, vh) => {
  const PAPER = [243, 238, 227], INKS = [[255, 72, 176], [0, 120, 191]], SHIFT = [[0, 0], [5, 3]], s = Math.min(vw, vh);
  const wave = (c, w, h, y0, amp, len, phase) => {
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) c.lineTo(x, y0 + Math.sin(x / len + phase) * amp + Math.sin(x / (len * .37) + phase * 2) * amp * .3);
    c.lineTo(w, h); c.closePath(); c.fill();
  };
  const layer = draw => {
    const c = document.createElement('canvas'); c.width = vw; c.height = vh;
    const x = c.getContext('2d'); x.fillStyle = '#000'; draw(x, vw, vh);
    return x.getImageData(0, 0, vw, vh).data;
  };
  const pink = layer((c, w, h) => {
    c.beginPath(); c.arc(w * .76, h * .3, s * .24, 0, 6.2832); c.fill();
    c.globalAlpha = .4; for (let y = h * .52; y < h; y += 18) c.fillRect(0, y, w, 8);            // 40% tint stripes
    c.globalAlpha = .85; wave(c, w, h, h * .7, h * .05, w * .12, 1);
  });
  const blue = layer((c, w, h) => {
    c.globalAlpha = .9; wave(c, w, h, h * .78, h * .04, w * .09, 4);
    c.globalAlpha = .55; c.beginPath(); c.arc(w * .63, h * .42, s * .16, 0, 6.2832); c.fill();
    c.globalAlpha = .35; for (let x = 0; x < w * .4; x += 16) c.fillRect(x, 0, 7, h * .45);       // half-tint bars, top left
  });
  canvas.width = vw; canvas.height = vh;
  const ctx = canvas.getContext('2d'), out = ctx.createImageData(vw, vh), o = out.data, r = Noise.rng(23);
  for (let y = 0, i = 0; y < vh; y++) for (let x = 0; x < vw; x++, i++) {
    const paper = 1 - r() * .05;
    let R = PAPER[0] * paper, G = PAPER[1] * paper, B = PAPER[2] * paper;
    [pink, blue].forEach((L, n) => {
      const sx = x - SHIFT[n][0], sy = y - SHIFT[n][1];
      if (sx < 0 || sy < 0) return;
      const a = L[(sy * vw + sx) * 4 + 3] / 255;
      if (!a) return;
      const cov = a * (.8 + .5 * (Noise.value(x / 70, y / 70, n) - .5));   // drum pressure varies, so ink is blotchy
      if (r() < cov) { const ink = INKS[n]; R *= ink[0] / 255; G *= ink[1] / 255; B *= ink[2] / 255; }
    });
    const p = i * 4; o[p] = R; o[p + 1] = G; o[p + 2] = B; o[p + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
};

// 41 · Pixel-art RPG: a night scene at 1/4 size (banded sky, stars, moon, castle, two ridges, pines) shown with hard pixels
RENDERERS.rpg = (canvas, vw, vh) => {
  const k = 4, w = Math.ceil(vw / k), h = Math.ceil(vh / k), r = Noise.rng(41);
  canvas.width = w; canvas.height = h; canvas.style.imageRendering = 'pixelated';
  const ctx = canvas.getContext('2d'), px = (c, x, y, ww = 1, hh = 1) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, ww, hh); };
  const SKY = ['#0b0a1f', '#14112b', '#1d1840', '#2a1f57', '#3b2a6b', '#56387a'], band = Math.ceil(h * .72 / SKY.length);
  SKY.forEach((c, i) => px(c, 0, i * band, w, band));
  px(SKY.at(-1), 0, SKY.length * band, w, h);
  for (let i = w * h / 160; i > 0; i--) px(r() < .15 ? '#ffd23f' : r() < .5 ? '#ffffff' : '#9aa0ff', r() * w, r() * h * .55);

  const mx = w * .82 | 0, my = h * .17 | 0, mr = Math.max(5, h * .06 | 0);
  for (let y = -mr; y <= mr; y++) for (let x = -mr; x <= mr; x++) {
    if (x * x + y * y > mr * mr) continue;
    const crater = (x + mr * .3) ** 2 + (y + mr * .2) ** 2 < (mr * .3) ** 2 || (x - mr * .35) ** 2 + (y - mr * .35) ** 2 < (mr * .18) ** 2;
    px(crater ? '#e2dcb4' : '#fff6d5', mx + x, my + y);
  }

  const ridge = (base, amp, color, seed) => {
    for (let x = 0; x < w; x++) {
      const top = Math.round((base - amp * Noise.fbm(x / (w * .22), seed, 3, seed)) / 2) * 2;   // 2px terraces read as pixel art
      px(color, x, top, 1, h - top);
    }
  };
  ridge(h * .74, h * .32, '#2b2350', 3);

  const c = '#110e24', cx = w * .24 | 0, base = h * .6 | 0, cw = 30, ch = 16;            // castle silhouette
  px(c, cx, base - ch, cw, ch + 12);
  for (let i = 0; i < cw; i += 4) px(c, cx + i, base - ch - 2, 2, 2);
  [cx - 6, cx + cw - 2].forEach(tx => {
    px(c, tx, base - ch - 10, 8, ch + 22);
    for (let i = 0; i < 8; i += 3) px(c, tx + i, base - ch - 12, 2, 2);
  });
  px(c, cx + cw / 2 - 3, base - ch - 16, 6, 16);
  for (let i = 0; i < 4; i++) px(c, cx + cw / 2 - i, base - ch - 18 - (3 - i) * 2, i * 2 + 1, 2);   // spire
  px('#ff4f4f', cx + cw / 2, base - ch - 30, 4, 3); px(c, cx + cw / 2, base - ch - 30, 1, 8);        // flag
  [[6, 5], [14, 5], [22, 5], [-3, -4], [cw + 1, -4]].forEach(([dx, dy]) => px('#ffd23f', cx + dx, base - ch + 6 + dy, 2, 3));

  ridge(h * .86, h * .18, '#1d1838', 9);
  px('#163d2b', 0, h * .86 | 0, w, h);
  px('#24603f', 0, h * .86 | 0, w, 1);
  for (let x = 0; x < w; x += 2 + (r() * 5 | 0)) px('#2e7d4f', x, (h * .86 | 0) - 1, 1, 1);

  const pine = (x, y, s) => {
    for (let j = 0; j < s; j++) { const half = (j % (s / 3 | 0 || 1)) + (j / 3 | 0); px(j % 3 ? '#0f3323' : '#174a32', x - half, y + j, half * 2 + 1, 1); }
    px('#3b2a1a', x, y + s, 1, 2);
  };
  for (let i = 0; i < w / 18; i++) pine(r() * w, h * .78 + r() * h * .06, 8 + (r() * 8 | 0));
  for (let i = 0; i < 14; i++) px(r() < .5 ? '#ffe98a' : '#b6ff8a', r() * w, h * .7 + r() * h * .25);   // fireflies
};

for (const k in RENDERERS) RENDERER_FILE[k] ||= 'js/renderers-field.js';
