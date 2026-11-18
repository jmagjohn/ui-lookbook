// Seeded randomness + smooth value noise, shared by every generative renderer.
const Noise = (() => {
  /** mulberry32: tiny seeded RNG so every render looks the same after a resize. */
  const rng = seed => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const hash = (x, y, s = 0) => {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const smooth = t => t * t * (3 - 2 * t);
  const clamp01 = v => Math.min(1, Math.max(0, v));

  function value(x, y, s = 0) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = smooth(x - xi), yf = smooth(y - yi);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  }

  /** Fractal noise, roughly 0.2 to 0.8; `oct` layers of detail. */
  function fbm(x, y, oct = 4, s = 0) {
    let sum = 0, amp = .5, freq = 1, norm = 0;
    for (let i = 0; i < oct; i++) { sum += amp * value(x * freq, y * freq, s + i); norm += amp; amp /= 2; freq *= 2; }
    return sum / norm;
  }
  return { rng, hash, value, fbm, clamp01 };
})();
