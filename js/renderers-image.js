// Renderers that reinterpret the generated sunset scene: dither, halftone, stipple, paint strokes, ASCII...
// Signature: RENDERERS[name](canvas, viewportWidth, viewportHeight).

const ASCII_RAMP = ' .`:-=+*#%@';
const luma = (d, i) => (.299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]) / 255;
const sunsetAt = (w, h, pal = Scene.SUNSET) => Scene.render(w, h, (c, cw, ch) => Scene.landscape(c, cw, ch, pal));

// 6 · Single-hue landscapes: sky, sun and ridges all drawn from one hue
RENDERERS.landscape = (canvas, vw, vh) => {
  canvas.width = vw; canvas.height = vh;
  Scene.landscape(canvas.getContext('2d'), vw, vh, Scene.mono(168));
};

// 11 · Dithered images: Floyd-Steinberg error diffusion down to two colours, shown with hard pixels
RENDERERS.dither = (canvas, vw, vh) => {
  const k = 3, w = Math.ceil(vw / k), h = Math.ceil(vh / k), d = sunsetAt(w, h).data, v = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) v[i] = Noise.clamp01((luma(d, i * 4) - .5) * 1.1 + .6);   // lifted so the dark ridges keep some dither texture
  const spread = (x, y, e) => { if (x >= 0 && x < w && y < h) v[y * w + x] += e; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const old = v[y * w + x], now = old > .5 ? 1 : 0, e = old - now;
    v[y * w + x] = now;
    spread(x + 1, y, e * 7 / 16); spread(x - 1, y + 1, e * 3 / 16); spread(x, y + 1, e * 5 / 16); spread(x + 1, y + 1, e / 16);
  }
  canvas.width = w; canvas.height = h; canvas.style.imageRendering = 'pixelated';
  const ctx = canvas.getContext('2d'), img = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const on = v[i] > .5;                                         // paper vs ink
    img.data.set(on ? [242, 234, 211, 255] : [26, 26, 46, 255], i * 4);
  }
  ctx.putImageData(img, 0, 0);
};

// 15 · Pixel mosaics: glowing orbs sampled to a tile grid, posterised, with per-tile jitter like real grout work
RENDERERS.mosaic = (canvas, vw, vh) => {
  const t = 28, cols = Math.ceil(vw / t), rows = Math.ceil(vh / t);
  const d = Scene.render(cols, rows, (c, w, h) => Scene.orbs(c, w, h, Scene.MOSAIC, 4, 11)).data, r = Noise.rng(2);
  const tiles = Scene.MOSAIC.colors.map(hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; });
  /** Blended orbs turn muddy, so each tile snaps to the nearest real tile colour (compared by hue, scaled to the sample's brightness). */
  const snap = (cr, cg, cb) => {
    const m = Math.max(cr, cg, cb, 1);
    let best = tiles[0], bestDist = Infinity;
    for (const p of tiles) {
      const pm = Math.max(...p), dist = (cr / m - p[0] / pm) ** 2 + (cg / m - p[1] / pm) ** 2 + (cb / m - p[2] / pm) ** 2;
      if (dist < bestDist) { bestDist = dist; best = p; }
    }
    const k = Math.min(1.1, m / Math.max(...best));
    return best.map(v => v * k);
  };
  canvas.width = vw; canvas.height = vh;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#14121a'; ctx.fillRect(0, 0, vw, vh);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const p = (j * cols + i) * 4, shade = (r() - .5) * 30, [sr, sg, sb] = snap(d[p], d[p + 1], d[p + 2]);
    const q = v => Math.max(0, Math.min(255, Math.round(v + shade)));
    ctx.fillStyle = `rgb(${q(sr)},${q(sg)},${q(sb)})`; ctx.fillRect(i * t + 1.5, j * t + 1.5, t - 3, t - 3);
    ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(i * t + 1.5, j * t + 1.5, t - 3, 3);
  }
};

// 8 · Halftone: cyan, magenta and yellow dot screens at print angles, multiplied on paper
RENDERERS.halftone = (canvas, vw, vh) => {
  const d = sunsetAt(vw, vh, Scene.POP).data, cell = 11, reach = Math.hypot(vw, vh) / 2;
  canvas.width = vw; canvas.height = vh;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f7f2e6'; ctx.fillRect(0, 0, vw, vh);
  ctx.globalCompositeOperation = 'multiply';
  [['#00aeef', 15, 0], ['#ec008c', 75, 1], ['#ffed00', 0, 2]].forEach(([ink, deg, channel]) => {
    const a = deg * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
    ctx.fillStyle = ink; ctx.beginPath();
    for (let gy = -reach; gy < reach; gy += cell) for (let gx = -reach; gx < reach; gx += cell) {
      const x = vw / 2 + gx * cos - gy * sin, y = vh / 2 + gx * sin + gy * cos;
      if (x < -cell || y < -cell || x > vw + cell || y > vh + cell) continue;          // overscan, or the border dots look clipped
      const sx = Math.min(vw - 1, Math.max(0, x | 0)), sy = Math.min(vh - 1, Math.max(0, y | 0));
      const rad = Math.sqrt((1 - d[(sy * vw + sx) * 4 + channel] / 255) * .9) * cell * .72;   // more ink = bigger dot
      if (rad > .4) { ctx.moveTo(x + rad, y); ctx.arc(x, y, rad, 0, 6.2832); }
    }
    ctx.fill();
  });
};

// 17 · Stippled gradients: random pen dots accepted in proportion to how dark the scene is
RENDERERS.stipple = (canvas, vw, vh) => {
  const d = sunsetAt(vw, vh).data, r = Noise.rng(9);
  canvas.width = vw; canvas.height = vh;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f5efe0'; ctx.fillRect(0, 0, vw, vh);
  ctx.fillStyle = '#1b1a2e'; ctx.beginPath();
  for (let n = vw * vh * .2; n > 0; n--) {
    const x = r() * vw, y = r() * vh;
    const ink = Noise.clamp01((1 - luma(d, ((y | 0) * vw + (x | 0)) * 4)) * 1.3 - .08);   // steep curve: bright sun and horizon end up nearly empty
    if (r() < Math.pow(ink, 2.2)) ctx.rect(x, y, 1.5, 1.5);
  }
  ctx.fill();
};

// 21 · Impressionist paintings: a blurred underpainting, then three passes of shrinking brush strokes
RENDERERS.impressionist = (canvas, vw, vh) => {
  const src = sunsetAt(vw, vh, Scene.GOLDEN), d = src.data, r = Noise.rng(13), horizon = vh * Scene.HORIZON;
  canvas.width = vw; canvas.height = vh;
  const ctx = canvas.getContext('2d');
  ctx.filter = 'blur(16px)'; ctx.drawImage(src.canvas, 0, 0); ctx.filter = 'none';
  [[24, 2.2], [13, 2.2], [7, 1.4]].forEach(([size, density]) => {
    for (let n = vw * vh / (size * size) * density; n > 0; n--) {
      const x = r() * vw, y = r() * vh, p = ((y | 0) * vw + (x | 0)) * 4, tone = (r() - .5) * 38;
      const ang = (Noise.fbm(x / 240, y / 240, 2, 3) - .5) * 2.6 + (y > horizon ? .35 : 0), len = size * (1.2 + r()), c = Math.cos(ang), s = Math.sin(ang);
      const ch = i => Math.max(0, Math.min(255, d[p + i] + tone + (r() - .5) * 14));
      ctx.fillStyle = `rgba(${ch(0)},${ch(1)},${ch(2)},.88)`;
      ctx.setTransform(c, s, -s, c, x, y); ctx.beginPath(); ctx.ellipse(0, 0, len / 2, size * .22, 0, 0, 6.2832); ctx.fill();
    }
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

// 22 · ASCII and pixels: characters on the left dissolve into chunky colour blocks on the right
RENDERERS.ascii = (canvas, vw, vh) => {
  const cw = 8, ch = 16, cols = Math.ceil(vw / cw), rows = Math.ceil(vh / ch), d = sunsetAt(cols, rows).data;
  canvas.width = vw; canvas.height = vh;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#07100a'; ctx.fillRect(0, 0, vw, vh);
  ctx.font = `14px ${getComputedStyle(document.body).getPropertyValue('--mono') || 'monospace'}`; ctx.textBaseline = 'top';
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const p = (j * cols + i) * 4, t = Math.max(0, Math.min(1, (i / cols - .5) / .4));
    const boost = c => Math.min(255, d[p + c] * 1.45 + 18);
    ctx.fillStyle = `rgb(${boost(0)},${boost(1)},${boost(2)})`;
    if (Noise.hash(i >> 1, j, 3) < t * t * (3 - 2 * t)) { ctx.fillRect((i >> 1) * 2 * cw, j * ch, cw * 2, ch); i++; continue; }   // 2x1 cells = square pixel
    const g = ASCII_RAMP[Math.round(Math.pow(luma(d, p), .8) * (ASCII_RAMP.length - 1))];
    if (g !== ' ') ctx.fillText(g, i * cw, j * ch);
  }
};

// 19 · Blurred photos: a golden-hour scene plus bokeh discs; the theme's CSS adds the heavy blur
RENDERERS.blurred = (canvas, vw, vh) => {
  const w = Math.ceil(vw / 2), h = Math.ceil(vh / 2);
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  Scene.landscape(ctx, w, h, Scene.GOLDEN, 12);
  Scene.bokeh(ctx, w, h);
};

for (const k in RENDERERS) RENDERER_FILE[k] ||= 'js/renderers-image.js';
