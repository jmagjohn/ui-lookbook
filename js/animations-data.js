// Animation catalogue for animations.html. Each entry feeds a gallery card, "Copy prompt" and "Copy CSS/code".
// `css` (and optional `js`) are standalone, working snippets with generic class names; the live demos live in js/animations.js.
const AN_CATS = {
  transition: ['Transitions', 'Transition'],
  micro: ['Micro-interactions', 'Micro-interaction'],
  scroll: ['Scroll', 'Scroll'],
  loading: ['Loading', 'Loading'],
  hover: ['Hover', 'Hover'],
  ambient: ['Ambient', 'Ambient'],
  playful: ['Playful', 'Playful'],
};

const SPRING = 'linear(0, .054, .193, .382, .589, .787, .96, 1.094, 1.186, 1.236, 1.249, 1.234, 1.198, 1.15, 1.098, 1.049, 1.007, .974, .952, .94, .938, .942, .952, .964, .977, .989, .999, 1.007, 1.012, 1.015, 1)';

const ANIMS = [
  // ---------- Transitions ----------
  {
    n: 1, id: 'fade-through', name: 'Fade-through swap', cat: 'transition', hint: 'Click a tab', replay: true,
    desc: 'Swaps the content of one region for unrelated content: the old view fades out fast, then the new one fades in while scaling up from 92%.',
    duration: '90ms out + 210ms in', easing: 'cubic-bezier(.4,0,1,1) → cubic-bezier(0,0,.2,1)', easingNote: 'accelerate out, decelerate in',
    built: 'Two CSS keyframe classes on the content wrapper. Add .ft-out (opacity → 0, 90ms); after 90ms swap the DOM, remove .ft-out and add .ft-in (opacity 0 → 1 and scale .92 → 1, 210ms). Sequence with setTimeout using the known durations rather than animationend, so it still completes when animations are disabled.',
    notes: 'Use for tab/route swaps where old and new content are not related (no shared element). Keep the container size stable so nothing jumps. Don\'t cross-fade both at once: the overlap looks muddy. Don\'t slide; that implies spatial direction.',
    reduced: 'Swap instantly, then a plain 150ms opacity fade on the new content (no scale).',
    css: `.ft-out { animation: ft-out 90ms cubic-bezier(.4, 0, 1, 1) forwards; }
.ft-in  { animation: ft-in 210ms cubic-bezier(0, 0, .2, 1) both; transform-origin: 50% 40%; }
@keyframes ft-out { to { opacity: 0; } }
@keyframes ft-in  { from { opacity: 0; transform: scale(.92); } }`,
    js: `function fadeThrough(el, render) {
  el.classList.remove('ft-in'); el.classList.add('ft-out');
  setTimeout(() => { render(el); el.classList.replace('ft-out', 'ft-in'); }, 90);
}`,
  },
  {
    n: 2, id: 'shared-element', name: 'Shared-element expand (FLIP)', cat: 'transition', hint: 'Click a card', replay: true,
    desc: 'A small card grows into a full detail view: its image and title travel to their new positions while the rest of the detail fades in. Closing reverses it.',
    duration: '420ms', easing: 'cubic-bezier(.2,.8,.2,1)', easingNote: 'fast start, long soft landing',
    built: 'FLIP with the Web Animations API. First: read the thumbnail image + title rects. Last: show the detail view and read its image + title rects. Invert: translate/scale the detail image (transform-origin: 0 0) and translate the title back onto the thumbnail. Play: element.animate([{transform: inverted}, {transform: "none"}], {duration: 420, easing}). Detail panel background fades 200ms; body text fades + rises 12px with a 120ms delay. Close runs the same keyframes reversed, then hides the detail. The thumbnail is visibility:hidden while open.',
    notes: 'Measure once per transition (one read batch, then writes) to avoid layout thrash. Animate transform/opacity only, never width/height/top. Keep text out of the scaled element (scaling distorts glyphs); move titles with translate only. Return focus to the thumbnail on close.',
    reduced: 'No travel: cross-fade the detail view in/out over 150ms.',
    css: `.detail-img { transform-origin: 0 0; }
.detail-body { animation: rise 300ms 120ms cubic-bezier(.2, .8, .2, 1) both; }
@keyframes rise { from { opacity: 0; transform: translateY(12px); } }`,
    js: `function flip(fromEl, toEl, { duration = 420, easing = 'cubic-bezier(.2,.8,.2,1)', scale = true, reverse = false } = {}) {
  const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
  const inv = \`translate(\${a.left - b.left}px, \${a.top - b.top}px)\` + (scale ? \` scale(\${a.width / b.width}, \${a.height / b.height})\` : '');
  const frames = [{ transform: inv }, { transform: 'none' }];
  return toEl.animate(reverse ? frames.reverse() : frames, { duration, easing, fill: 'both' }).finished;
}`,
  },
  {
    n: 3, id: 'stagger-reveal', name: 'Staggered list reveal', cat: 'transition', replay: true,
    desc: 'List rows enter one after another: each fades in and rises 12px, 60ms after the previous one, so the eye reads top to bottom.',
    duration: '360ms each, 60ms stagger', easing: 'cubic-bezier(.2,.8,.2,1)',
    built: 'One keyframe on every row with animation-delay: calc(var(--i) * 60ms); set --i inline per row (style="--i:3"). animation-fill-mode: both keeps rows hidden until their turn. Replay by removing the class, forcing reflow (el.offsetWidth) and re-adding it.',
    notes: 'Cap the stagger: past ~8 items use a smaller step or delay only the first screenful, otherwise the last row waits too long. Rise distance stays small (8-16px). Don\'t stagger on every re-render, only on first appearance.',
    reduced: 'All rows appear together with a 150ms fade, no rise, no stagger.',
    css: `.stagger > * {
  animation: stagger-in 360ms cubic-bezier(.2, .8, .2, 1) both;
  animation-delay: calc(var(--i, 0) * 60ms);
}
@keyframes stagger-in { from { opacity: 0; transform: translateY(12px); } }`,
  },
  {
    n: 4, id: 'clip-reveal', name: 'Circle clip reveal', cat: 'transition', hint: 'Click anywhere', replay: true,
    desc: 'The next scene is revealed through a circle that grows from the exact click point until it covers everything (theme-switch style).',
    duration: '650ms', easing: 'cubic-bezier(.65,0,.35,1)', easingNote: 'ease-in-out',
    built: 'Place the next scene on top with clip-path: circle(0 at var(--x) var(--y)) and animate to circle(150% at var(--x) var(--y)). --x/--y come from the click offset (center for keyboard). When it finishes, the overlay becomes the new base and the old scene is removed.',
    notes: 'Use 150% (or the distance to the farthest corner) so the circle fully covers the box. clip-path animation repaints, so keep it to one element at a time. Good for theme toggles and big state changes; too heavy for routine navigation.',
    reduced: 'Swap scenes with a 150ms cross-fade.',
    css: `.reveal {
  clip-path: circle(0% at var(--x, 50%) var(--y, 50%));
  animation: reveal 650ms cubic-bezier(.65, 0, .35, 1) forwards;
}
@keyframes reveal { to { clip-path: circle(150% at var(--x, 50%) var(--y, 50%)); } }`,
  },
  {
    n: 5, id: 'slide-over', name: 'Slide-over panel', cat: 'transition', hint: 'Click "Open"', replay: true,
    desc: 'A side panel slides in from the right over a dimming scrim; it closes faster than it opens.',
    duration: '420ms open / 260ms close', easing: 'cubic-bezier(.32,.72,0,1) / cubic-bezier(.4,0,1,1)', easingNote: 'iOS-sheet curve in, accelerate out',
    built: 'Panel is translateX(100%) by default and translateX(0) under .open; the scrim goes opacity 0 → 1. Separate transitions for the open and closed states so closing uses the shorter, accelerating curve. Panel content fades/rises 40ms after the panel starts.',
    notes: 'Move focus into the panel on open and back to the trigger on close; Esc and a scrim click close it. Keep the panel in the DOM (visibility hidden after close) so the transition can run. Avoid animating "right" or "width".',
    reduced: 'Panel and scrim fade in/out (opacity only, 120ms), no slide.',
    css: `.panel { transform: translateX(100%); visibility: hidden;
  transition: transform 260ms cubic-bezier(.4, 0, 1, 1), visibility 0s 260ms; }
.scrim { opacity: 0; pointer-events: none; transition: opacity 260ms; }
.open .panel { transform: none; visibility: visible;
  transition: transform 420ms cubic-bezier(.32, .72, 0, 1), visibility 0s; }
.open .scrim { opacity: 1; pointer-events: auto; transition-duration: 420ms; }`,
  },

  // ---------- Micro-interactions ----------
  {
    n: 6, id: 'press-squish', name: 'Press squish + spring', cat: 'micro', hint: 'Press & hold', replay: true,
    desc: 'The button squashes to 94% while pressed, then springs back past full size and settles, like a soft rubber key.',
    duration: '90ms press / 600ms release', easing: `ease-out / spring linear() (overshoot ≈ 1.02)`, easingNote: 'linear() spring, stiffness 300, damping 14',
    built: 'transform: scale(.94, .9) on :active with a 90ms ease-out transition; the resting state carries the 600ms linear() spring curve so releasing overshoots and settles. Falls back to cubic-bezier(.34,1.56,.64,1) where linear() is unsupported (@supports).',
    notes: 'Squash a little more vertically than horizontally for a "pressed" read. Only use on primary/hero buttons; on every button it gets tiring. Don\'t delay the click action until the spring finishes.',
    reduced: 'No scale; just a darker pressed colour.',
    css: `.squish { transition: transform 600ms cubic-bezier(.34, 1.56, .64, 1); }
@supports (transition-timing-function: linear(0, 1)) {
  .squish { transition-timing-function: ${SPRING}; }
}
.squish:active { transform: scale(.94, .9); transition: transform 90ms ease-out; }`,
  },
  {
    n: 7, id: 'toggle-overshoot', name: 'Toggle with overshoot', cat: 'micro', hint: 'Click', replay: true,
    desc: 'The switch knob slides across, overshoots a few pixels and settles back while the track colour fades in. The knob stretches wider while held.',
    duration: '380ms (track colour 240ms)', easing: 'cubic-bezier(.34,1.56,.64,1)', easingNote: 'back-out overshoot',
    built: 'A <button role="switch" aria-checked>. The knob is an absolutely positioned ::before moved with transform: translateX(24px) (track 56 − knob 26 − 2 × 3px inset) when aria-checked="true"; transition: transform 380ms cubic-bezier(.34,1.56,.64,1), width 200ms. While :active the knob width grows by 6px (and shifts left by 6px when on) for an iOS-like stretch. Track background-color transitions over 240ms ease.',
    notes: 'Translate the knob; never animate left. Overshoot only on the knob, not the track. Keep the hit area ≥ 44px tall. State lives in aria-checked so screen readers and CSS agree.',
    reduced: 'Knob jumps; track colour changes instantly.',
    css: `.switch { position: relative; width: 56px; height: 32px; border: 0; border-radius: 999px;
  background: #c9c5d6; transition: background-color 240ms ease; cursor: pointer; }
.switch::before { content: ""; position: absolute; top: 3px; left: 3px; width: 26px; height: 26px;
  border-radius: 999px; background: #fff; box-shadow: 0 2px 6px rgba(0, 0, 0, .25);
  transition: transform 380ms cubic-bezier(.34, 1.56, .64, 1), width 200ms ease; }
.switch[aria-checked="true"] { background: #5b4bff; }
.switch[aria-checked="true"]::before { transform: translateX(24px); }
.switch:active::before { width: 32px; }
.switch[aria-checked="true"]:active::before { transform: translateX(18px); }`,
  },
  {
    n: 8, id: 'heart-burst', name: 'Like-heart burst', cat: 'micro', hint: 'Click the heart', replay: true,
    desc: 'Liking pops the heart (0 → 1.25 → 1) in red, a ring expands and fades, and ten dots burst outward and shrink away. The count ticks up.',
    duration: '450ms pop, 600ms particles', easing: 'cubic-bezier(.17,.89,.32,1.49) pop / cubic-bezier(.2,.8,.2,1) particles',
    built: 'All CSS keyframes triggered by adding .on to the button. Heart: scale keyframes 0 → 1.25 → 1. Ring: a ::before circle scale .2 → 1.6 with border-width shrinking and opacity → 0. Particles: 10 spans each with --a (36° apart) animating transform: rotate(var(--a)) translateY(0) scale(1) → rotate(var(--a)) translateY(-34px) scale(0). Alternate two particle colours. aria-pressed tracks state.',
    notes: 'Only burst on like, not on unlike (unlike = quick colour fade). Keep the particle layer pointer-events: none. Restart with remove class → reflow → add class.',
    reduced: 'Heart just turns red; no pop, ring or particles.',
    css: `.like.on .heart { color: #ff3b6b; animation: pop 450ms cubic-bezier(.17, .89, .32, 1.49); }
.like.on .ring { animation: ring 400ms ease-out forwards; }
.like.on .dot { animation: dot 600ms cubic-bezier(.2, .8, .2, 1) forwards; }
.dot { position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px; border-radius: 50%;
  background: #ff3b6b; transform: rotate(var(--a)) scale(0); }
.dot:nth-child(even) { background: #ffb020; }
@keyframes pop { 0% { transform: scale(0); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
@keyframes ring { from { transform: scale(.2); opacity: 1; border-width: 8px; } to { transform: scale(1.6); opacity: 0; border-width: 0; } }
@keyframes dot { 0% { transform: rotate(var(--a)) translateY(-10px) scale(1); }
  100% { transform: rotate(var(--a)) translateY(-34px) scale(0); } }`,
  },
  {
    n: 9, id: 'checkbox-draw', name: 'Checkbox draw-on', cat: 'micro', hint: 'Click a task', replay: true,
    desc: 'Checking a task fills the box with a quick pop, the tick draws itself on as a stroke, and a strikethrough sweeps across the label.',
    duration: '280ms stroke (80ms delay), 220ms fill, 300ms strike', easing: 'cubic-bezier(.65,0,.45,1) stroke / cubic-bezier(.34,1.56,.64,1) fill',
    built: 'Native <input type="checkbox"> (appearance: none) with an inline SVG polyline tick on top. The tick has stroke-dasharray: 24; stroke-dashoffset: 24 and transitions to 0 when :checked. The box fill scales .6 → 1 with overshoot. The label strike is a background-image line whose background-size goes 0% → 100% (left to right).',
    notes: 'Keep the real checkbox for keyboard/screen readers; the SVG is aria-hidden. Use pathLength="24" so the dash numbers don\'t depend on geometry. Unchecking runs faster (no delay).',
    reduced: 'Tick and strike appear instantly.',
    css: `.task svg path { stroke-dasharray: 24; stroke-dashoffset: 24; transition: stroke-dashoffset 150ms ease-in; }
.task input:checked + svg path { stroke-dashoffset: 0; transition: stroke-dashoffset 280ms 80ms cubic-bezier(.65, 0, .45, 1); }
.task input { transition: background-color 220ms, transform 220ms cubic-bezier(.34, 1.56, .64, 1); }
.task input:checked { background: #5b4bff; transform: scale(1); }
.task input:active { transform: scale(.85); }
.task span { background: linear-gradient(currentColor, currentColor) no-repeat 0 55% / 0% 2px;
  transition: background-size 300ms cubic-bezier(.65, 0, .35, 1), color 300ms; }
.task input:checked ~ span { background-size: 100% 2px; color: #8b88a0; }`,
  },
  {
    n: 10, id: 'copy-morph', name: 'Copy → check morph', cat: 'micro', hint: 'Click Copy', replay: true,
    desc: 'The copy icon spins and shrinks away while a check mark scales in and draws on; the button turns green and the label changes to "Copied", then resets after 1.6s.',
    duration: '300ms', easing: 'cubic-bezier(.2,.8,.2,1) (check: cubic-bezier(.34,1.56,.64,1))',
    built: 'Two SVG icons stacked in one grid cell. On .done the copy icon goes opacity 0, scale .5, rotate -45deg; the check goes opacity 1, scale .5 → 1 with overshoot, and its path draws via stroke-dashoffset. Background-color and label swap transition over 300ms. A timeout removes .done after 1.6s. Announce "Copied" via an aria-live region.',
    notes: 'Keep the button width fixed (min-width) so the label swap doesn\'t jiggle the layout. Don\'t remove the state before the user can read it (≥ 1.2s).',
    reduced: 'Icons and label swap instantly.',
    css: `.copy .ic { grid-area: 1 / 1; transition: opacity 300ms, transform 300ms cubic-bezier(.2, .8, .2, 1); }
.copy .ic-check { opacity: 0; transform: scale(.5); }
.copy .ic-check path { stroke-dasharray: 20; stroke-dashoffset: 20; transition: stroke-dashoffset 260ms 80ms ease-out; }
.copy.done { background: #1f9d6b; }
.copy.done .ic-copy { opacity: 0; transform: scale(.5) rotate(-45deg); }
.copy.done .ic-check { opacity: 1; transform: none; transition-timing-function: cubic-bezier(.34, 1.56, .64, 1); }
.copy.done .ic-check path { stroke-dashoffset: 0; }`,
  },
  {
    n: 11, id: 'shake-error', name: 'Shake on error', cat: 'micro', hint: 'Submit', replay: true,
    desc: 'A wrong password makes the field shake side to side with decaying amplitude, the border turns red and a helper message slides down.',
    duration: '420ms', easing: 'cubic-bezier(.36,.07,.19,.97)',
    built: 'Keyframes on translateX: 0, -8, 8, -6, 6, -3, 3, 0px. Add .shake on invalid submit (restart via reflow) together with aria-invalid="true"; the helper text is aria-live and fades/drops 4px in. The border colour transitions 150ms.',
    notes: 'Shake horizontally only, ≤ 8px, once per submit. Always pair with a text message; shake alone isn\'t accessible. Clear the error state when the user types.',
    reduced: 'No shake: red border + message only.',
    css: `.shake { animation: shake 420ms cubic-bezier(.36, .07, .19, .97) both; }
@keyframes shake {
  10%, 90% { transform: translateX(-3px); }
  20%, 80% { transform: translateX(6px); }
  30%, 50%, 70% { transform: translateX(-8px); }
  40%, 60% { transform: translateX(8px); }
}
input[aria-invalid="true"] { border-color: #e5484d; box-shadow: 0 0 0 3px rgba(229, 72, 77, .2); }`,
  },

  // ---------- Scroll ----------
  {
    n: 12, id: 'parallax-layers', name: 'Parallax layers', cat: 'scroll', hint: 'Scroll inside',
    desc: 'A landscape of sky, sun and three mountain ridges where each layer moves at a different speed as you scroll, giving depth; the title drifts up fastest and fades.',
    duration: 'scroll-linked', easing: 'linear (tied to scroll)',
    built: 'A sticky scene inside a scroll container. Each layer has --shift (e.g. -20px far … -140px near). Where supported: animation: px linear both; animation-timeline: scroll(nearest), with @keyframes px { to { transform: translateY(var(--shift)) } }. Fallback: a passive scroll listener throttled with requestAnimationFrame writes --p (0-1) on the container and layers use transform: translateY(calc(var(--p) * var(--shift))).',
    notes: 'Transform only, no background-position or top. Keep the far/near ratio modest (≤ 1:7) or it feels nauseating. Never scroll-jack; the page scrolls natively.',
    reduced: 'Layers stay put (plain scroll).',
    css: `.layer { transform: translateY(calc(var(--p, 0) * var(--shift))); will-change: transform; }
@supports (animation-timeline: scroll()) {
  .layer { animation: px linear both; animation-timeline: scroll(nearest); }
  @keyframes px { to { transform: translateY(var(--shift)); } }
}`,
    js: `// fallback when animation-timeline is unsupported
if (!CSS.supports('animation-timeline: scroll()')) {
  let queued = false;
  scroller.addEventListener('scroll', () => {
    if (queued) return; queued = true;
    requestAnimationFrame(() => { queued = false;
      scroller.style.setProperty('--p', scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight)); });
  }, { passive: true });
}`,
  },
  {
    n: 13, id: 'scroll-progress', name: 'Scroll progress + reveal', cat: 'scroll', hint: 'Scroll inside',
    desc: 'A reading-progress bar fills along the top as you scroll an article, and each block fades and rises into place as it enters the view.',
    duration: 'scroll-linked (reveal: entry 0% → entry 90%)', easing: 'linear bar / cubic-bezier(.2,.8,.2,1) fallback reveal 500ms',
    built: 'CSS scroll-driven animations: bar uses transform: scaleX(0 → 1) with transform-origin: 0 50%, animation-timeline: scroll(nearest). Blocks use animation-timeline: view() with animation-range: entry 0% entry 90% (opacity 0 → 1, translateY 24px → 0). Fallback when CSS.supports("animation-timeline: view()") is false: rAF-throttled scroll listener sets the bar\'s scaleX, and an IntersectionObserver (root = the scroller, threshold .15) adds .in which triggers a 500ms transition.',
    notes: 'scaleX not width for the bar. Reveal once (unobserve after) in the fallback; with view() it naturally reverses on scroll-up, which is fine. Don\'t hide content that is already in view on load.',
    reduced: 'Bar still tracks position (it\'s information, not decoration) but blocks are simply visible.',
    css: `.progress { transform-origin: 0 50%; transform: scaleX(var(--p, 0)); }
@supports (animation-timeline: view()) {
  .progress { animation: grow linear both; animation-timeline: scroll(nearest); }
  .reveal { animation: reveal linear both; animation-timeline: view(); animation-range: entry 0% entry 90%; }
  @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes reveal { from { opacity: 0; transform: translateY(24px); } }
}
/* fallback */
.no-sda .reveal { opacity: 0; transform: translateY(24px); transition: opacity 500ms, transform 500ms cubic-bezier(.2, .8, .2, 1); }
.no-sda .reveal.in { opacity: 1; transform: none; }`,
  },
  {
    n: 14, id: 'scroll-text-fill', name: 'Text fills as you scroll', cat: 'scroll', hint: 'Scroll inside',
    desc: 'A big statement paragraph starts pale; as you scroll, ink fills the words left to right, line by line, like a karaoke read-along.',
    duration: 'scroll-linked (view: cover 15% → cover 60%)', easing: 'linear',
    built: 'The paragraph is an inline <span> with color: transparent; -webkit-background-clip: text and two backgrounds: an ink linear-gradient sized var(--fill) 100% on top of a pale solid. Because inline backgrounds lay out across line fragments as one strip (box-decoration-break: slice), growing the size 0% → 100% fills line by line. Animated with a named view timeline (view-timeline-name: --fill on the parent <p>, animation-timeline: --fill on the span); fallback rAF scroll listener computes the fill from getBoundingClientRect of the paragraph relative to the scroller.',
    notes: 'Use high contrast between pale and ink (pale ≈ 25% ink). Keep it to one statement; long body copy filled this way is annoying. The text is real text, so it stays selectable and readable by screen readers.',
    reduced: 'Text shows fully inked.',
    css: `.fill-text {
  color: transparent; -webkit-background-clip: text; background-clip: text;
  background-image: linear-gradient(#1d1b26, #1d1b26), linear-gradient(#d4d0e0, #d4d0e0);
  background-repeat: no-repeat; background-size: var(--fill, 0%) 100%, 100% 100%;
}
.fill-wrap { view-timeline-name: --fill; }   /* block parent (e.g. <p>) gives the inline span a stable view timeline */
@supports (animation-timeline: view()) {
  .fill-text { animation: fill linear both; animation-timeline: --fill; animation-range: cover 15% cover 60%; }
  @keyframes fill { from { background-size: 0% 100%, 100% 100%; } to { background-size: 100% 100%, 100% 100%; } }
}`,
  },

  // ---------- Loading ----------
  {
    n: 15, id: 'skeleton-shimmer', name: 'Skeleton shimmer', cat: 'loading', replay: true,
    desc: 'Grey placeholder shapes in the layout of the real content with a soft highlight sweeping across them; Replay shows the real content cross-fading in.',
    duration: '1.4s loop, 300ms content fade', easing: 'linear (sweep) / ease-out (fade)',
    built: 'Each skeleton block has overflow: hidden and a ::after highlight (linear-gradient transparent → rgba(255,255,255,.65) → transparent) animated with transform: translateX(-100% → 100%), 1.4s linear infinite. All blocks share the same animation timing so the sweep looks continuous. When data arrives, cross-fade skeleton → content over 300ms.',
    notes: 'Match the skeleton to the real layout (same sizes) so nothing jumps on load. Transform the highlight, don\'t animate background-position. Pause off-screen. Mark the container aria-busy="true" while loading.',
    reduced: 'Static grey blocks, no sweep.',
    css: `.sk { position: relative; overflow: hidden; background: #e4e1ec; border-radius: 6px; }
.sk::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .65), transparent);
  animation: shimmer 1.4s linear infinite; }
@keyframes shimmer { to { transform: translateX(100%); } }`,
  },
  {
    n: 16, id: 'morph-spinner', name: 'Morphing spinners', cat: 'loading',
    desc: 'Three indeterminate loaders: an arc that grows and shrinks while rotating (Material style), a blob that morphs between rounded square and circle while turning and shifting hue, and three staggered bouncing dots.',
    duration: 'arc 2s rotate + 1.5s dash; blob 2.4s', easing: 'linear rotate / ease-in-out dash + morph',
    built: 'Arc: SVG <circle r=20> with stroke-linecap round; the svg rotates 360deg over 2s linear infinite while the circle animates stroke-dasharray 1,150 → 90,150 → 90,150 and stroke-dashoffset 0 → -35 → -124 over 1.5s ease-in-out infinite. Blob: border-radius keyframes (30%→50%→30%) combined with rotate, scale .7 and filter: hue-rotate(60deg) at the midpoint, 2.4s ease-in-out infinite. Dots: translateY(-14px) bounce at 30%, 1s cubic-bezier(.45,0,.55,1) infinite, delays 0/.15s/.3s.',
    notes: 'Give the spinner role="progressbar" or an aria-label "Loading". Show it only after ~300ms of waiting to avoid flashes. Pause when not visible.',
    reduced: 'Static arc/blob/dots plus a visible "Loading…" label; no spinning.',
    css: `.spinner { width: 48px; height: 48px; animation: spin 2s linear infinite; }
.spinner circle { fill: none; stroke: #5b4bff; stroke-width: 4; stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes dash {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}`,
  },
  {
    n: 17, id: 'eased-progress', name: 'Progress that eases toward done', cat: 'loading', replay: true,
    desc: 'A fake-upload bar rushes ahead, then slows asymptotically as it nears 90% (never stalling at a hard stop); when the work finishes it snaps to 100%, turns green and shows a check.',
    duration: '≈2.4s (asymptotic) + 300ms finish', easing: 'exponential approach p += (target - p) · 0.035 per frame; finish cubic-bezier(.2,.8,.2,1)',
    built: 'A requestAnimationFrame loop moves p toward a 0.9 target by a fixed fraction each frame (frame-rate independent: 1 - (1 - k)^(dt/16.7)). The fill is transform: scaleX(p) with transform-origin left. When the real task resolves, set p = 1 with a 300ms transition, swap the label to "Done" and pop a check icon. The rAF loop stops once finished.',
    notes: 'Use for unknown-duration tasks; if you know real progress, show it instead. Never reach 100% before the work is done. Update aria-valuenow at most a few times a second.',
    reduced: 'Bar jumps between real steps (no easing), label still updates.',
    css: `.bar { height: 8px; border-radius: 99px; background: #e4e1ec; overflow: hidden; }
.bar i { display: block; height: 100%; background: #5b4bff; transform-origin: 0 50%; transform: scaleX(var(--p, 0)); }
.bar.done i { background: #1f9d6b; transition: transform 300ms cubic-bezier(.2, .8, .2, 1), background-color 300ms; }`,
    js: `function easeToward(el, target = .9, k = .035) {
  let p = 0, last = performance.now(), raf;
  const tick = now => {
    p += (target - p) * (1 - Math.pow(1 - k, (now - last) / 16.7)); last = now;
    el.style.setProperty('--p', p.toFixed(4)); raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); el.classList.add('done'); el.style.setProperty('--p', 1); };
}`,
  },
  {
    n: 18, id: 'typewriter', name: 'Typewriter with caret', cat: 'loading',
    desc: 'A line types itself out character by character with slight human jitter and a blinking block caret, pauses, deletes faster, then types the next phrase.',
    duration: '45-90ms per char, 28ms delete, 1.4s hold; caret blink 1s', easing: 'steps(1) caret',
    built: 'A setTimeout chain writes text.slice(0, i) into a span; per-character delay 45ms + random 0-45ms, longer after punctuation. The caret is a separate inline-block element with animation: blink 1s steps(1) infinite, and is held solid (animation paused) while typing. The full sentence is in an aria-label / visually-hidden span so screen readers get it once.',
    notes: 'Keep the box height fixed so wrapping doesn\'t shift the layout. Stop the timer chain when off-screen. Don\'t typewrite essential content users must wait for.',
    reduced: 'Show each full phrase at once and swap every 3s; caret static.',
    css: `.caret { display: inline-block; width: .55em; height: 1.1em; margin-left: 2px; vertical-align: -.15em;
  background: currentColor; animation: blink 1s steps(1) infinite; }
.typing .caret { animation-play-state: paused; }
@keyframes blink { 50% { opacity: 0; } }`,
  },

  // ---------- Hover ----------
  {
    n: 19, id: 'magnetic-button', name: 'Magnetic button', cat: 'hover', hint: 'Hover near it',
    desc: 'When the pointer comes near, the button leans toward it and its label leans a little further, as if pulled by a magnet; on leave it springs back to rest.',
    duration: '120ms follow / 450ms return', easing: 'ease-out follow / cubic-bezier(.2,.8,.2,1) return',
    built: 'Listen to pointermove on a padded wrapper (the magnetic field). Cache the button rect on pointerenter (no reads in pointermove). Offset = (pointer - center) × 0.35 for the button and × 0.5 for its label, applied with transform: translate(). On pointerleave reset to 0 and switch the transition to the slower return curve. Skip on touch (pointerType !== "mouse").',
    notes: 'Clamp the pull to ~12-16px. Keep the clickable area where the button visually is. Use for one hero CTA, not toolbars.',
    reduced: 'Button doesn\'t move; normal hover colour only.',
    css: `.magnet { transition: transform 450ms cubic-bezier(.2, .8, .2, 1); }
.magnet span { display: inline-block; transition: inherit; }
.magnet.pull, .magnet.pull span { transition: transform 120ms ease-out; }`,
    js: `field.addEventListener('pointerenter', () => { r = btn.getBoundingClientRect(); btn.classList.add('pull'); });
field.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  btn.style.transform = \`translate(\${dx * .35}px, \${dy * .35}px)\`;
  label.style.transform = \`translate(\${dx * .15}px, \${dy * .15}px)\`;
});
field.addEventListener('pointerleave', () => { btn.classList.remove('pull'); btn.style.transform = label.style.transform = ''; });`,
  },
  {
    n: 20, id: 'tilt-glare', name: '3D tilt card with glare', cat: 'hover', hint: 'Hover me',
    desc: 'The card tilts in 3D toward the pointer (up to 12°) with a soft light glare that follows the cursor across its surface; it eases flat on leave.',
    duration: '80ms follow / 500ms return', easing: 'linear follow / cubic-bezier(.2,.8,.2,1) return',
    built: 'Parent has perspective: 700px. On pointermove (rect cached at pointerenter) compute px, py in 0..1 and set rotateX((0.5 - py) × 24deg) rotateY((px - 0.5) × 24deg) on the card, plus --gx/--gy for a ::after radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,.45), transparent 55%) glare with mix-blend-mode: soft-light (opacity 0 → 1 on hover). Inner layers can translateZ for extra depth (transform-style: preserve-3d).',
    notes: 'Max ~12°; more looks cheap. Update in one rAF per frame. No tilt on touch. Keep text on the card large; tilting small text blurs it.',
    reduced: 'No tilt; the glare is static or off.',
    css: `.tilt-wrap { perspective: 700px; }
.tilt { transform-style: preserve-3d; transition: transform 500ms cubic-bezier(.2, .8, .2, 1); }
.tilt.live { transition: transform 80ms linear; }
.tilt::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0;
  background: radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(255, 255, 255, .45), transparent 55%);
  mix-blend-mode: soft-light; transition: opacity 300ms; }
.tilt.live::after { opacity: 1; }`,
    js: `wrap.addEventListener('pointermove', e => {
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;   // r cached on pointerenter
  card.style.transform = \`rotateX(\${(.5 - y) * 24}deg) rotateY(\${(x - .5) * 24}deg)\`;
  card.style.setProperty('--gx', x * 100 + '%'); card.style.setProperty('--gy', y * 100 + '%');
});`,
  },
  {
    n: 21, id: 'spotlight-grid', name: 'Cursor spotlight grid', cat: 'hover', hint: 'Move across the grid',
    desc: 'A dark grid of feature tiles where a soft spotlight follows the cursor: tile borders light up near the pointer and the tile under it gets a faint glow, even across gaps.',
    duration: 'live (follows pointer), 300ms fade in/out', easing: 'ease',
    built: 'One pointermove listener on the grid sets --x/--y per tile relative to each tile (tile rects cached on pointerenter and on resize). Each tile has two layers: a ::before border ring (radial-gradient(260px circle at var(--x) var(--y), rgba(255,255,255,.35), transparent 40%), masked to a 1px ring with mask-composite: exclude) and a ::after inner glow (same gradient, lower alpha). Both fade in when the grid is hovered.',
    notes: 'Update custom properties only (paint-only, cheap at this size). Keep the glow subtle on dark backgrounds; it should hint, not shine. Works with focus too: give the focused tile the same glow.',
    reduced: 'Static subtle border; no following light.',
    css: `.spot-grid:hover .tile::before, .spot-grid:hover .tile::after { opacity: 1; }
.tile { position: relative; background: #17171f; border-radius: 12px; }
.tile::before, .tile::after { content: ""; position: absolute; inset: 0; border-radius: inherit; opacity: 0; transition: opacity 300ms; pointer-events: none; }
.tile::before { padding: 1px; background: radial-gradient(260px circle at var(--x) var(--y), rgba(255, 255, 255, .45), transparent 40%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
.tile::after { background: radial-gradient(320px circle at var(--x) var(--y), rgba(140, 120, 255, .12), transparent 45%); }`,
  },
  {
    n: 22, id: 'underline-sweep', name: 'Underline sweep links', cat: 'hover', hint: 'Hover the links',
    desc: 'Link underlines draw in from the left on hover and sweep out to the right on leave; a multi-line variant grows the underline along wrapped text.',
    duration: '300ms', easing: 'cubic-bezier(.65,0,.35,1)',
    built: 'Single-line nav: an ::after bar with transform: scaleX(0); transform-origin: right. On :hover/:focus-visible it becomes scaleX(1) with transform-origin: left, so it enters from the left and exits to the right. Inline multi-line links: background-image: linear-gradient(currentColor, currentColor) with background-size 0% 2px → 100% 2px, background-position: 0 100%.',
    notes: 'Trigger on :focus-visible too so keyboard users get it. Keep a non-hover affordance (colour or weight) so links still look like links on touch.',
    reduced: 'Underline appears instantly (no sweep).',
    css: `.sweep { position: relative; text-decoration: none; }
.sweep::after { content: ""; position: absolute; left: 0; right: 0; bottom: -2px; height: 2px; background: currentColor;
  transform: scaleX(0); transform-origin: right; transition: transform 300ms cubic-bezier(.65, 0, .35, 1); }
.sweep:hover::after, .sweep:focus-visible::after { transform: scaleX(1); transform-origin: left; }
/* multi-line */
.sweep-inline { background: linear-gradient(currentColor, currentColor) no-repeat 0 100% / 0% 2px;
  transition: background-size 300ms cubic-bezier(.65, 0, .35, 1); text-decoration: none; }
.sweep-inline:hover, .sweep-inline:focus-visible { background-size: 100% 2px; }`,
  },

  // ---------- Ambient ----------
  {
    n: 23, id: 'mesh-drift', name: 'Gradient mesh drift', cat: 'ambient',
    desc: 'Four large soft colour blobs drift, scale and orbit slowly behind content, giving a living "mesh gradient" background that never repeats obviously.',
    duration: '16-26s per blob, alternate', easing: 'ease-in-out',
    built: 'Absolutely positioned divs, each a radial-gradient(closest-side, colour, transparent) — no filter: blur — animated with transform translate/scale keyframes at different durations (16s, 19s, 23s, 26s) and negative delays so they never sync. mix-blend-mode: multiply on a light base (or screen on dark). Paused with animation-play-state when off-screen.',
    notes: 'Soft gradients instead of blur filters keep it cheap. Keep the motion slow (≥ 15s) or it becomes distracting. Put a solid plate under any text on top.',
    reduced: 'Blobs frozen in place (still a nice static gradient).',
    css: `.mesh { position: relative; overflow: hidden; background: #f1eefa; }
.blob { position: absolute; width: 70%; aspect-ratio: 1; border-radius: 50%; mix-blend-mode: multiply;
  background: radial-gradient(closest-side, var(--c), transparent); animation: drift var(--t, 20s) ease-in-out infinite alternate; }
@keyframes drift {
  0% { transform: translate(var(--x0), var(--y0)) scale(1); }
  50% { transform: translate(var(--x1), var(--y1)) scale(1.25); }
  100% { transform: translate(var(--x2), var(--y2)) scale(.9); }
}`,
  },
  {
    n: 24, id: 'floating-particles', name: 'Floating particles', cat: 'ambient',
    desc: 'Tiny glowing motes float upward with a gentle sideways sway and twinkle; nearby motes are joined by faint lines, like a slow constellation.',
    duration: 'continuous (~30-60fps)', easing: 'sine sway, linear rise',
    built: 'A <canvas> sized to its box with devicePixelRatio capped at 2 (ResizeObserver). 46 particles with position, speed (6-20 px/s up), sway phase and size; each frame (rAF, dt-based) moves them, wraps at the top, and draws circles with globalAlpha twinkle. Lines are drawn between pairs closer than 70px with alpha falling off by distance. The loop only runs while the canvas is in the viewport (IntersectionObserver) and the tab is visible.',
    notes: 'Keep the count small (≤ 60) and the canvas small; O(n²) line checks are fine at that size. Stop the loop off-screen. Decorative: aria-hidden.',
    reduced: 'Draw a single static frame.',
    css: `canvas.particles { display: block; width: 100%; height: 100%; background: radial-gradient(120% 90% at 50% 100%, #2a2366, #0d0b1f); }`,
    js: `function particles(canvas, n = 46) {
  const ctx = canvas.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
  let w, h, raf, last = 0;
  const ps = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), v: 6 + Math.random() * 14, r: .8 + Math.random() * 1.8, ph: Math.random() * 6.28 }));
  const size = () => { w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const frame = now => {
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    ctx.clearRect(0, 0, w, h);
    const pts = ps.map(p => { p.y -= p.v * dt / h; if (p.y < -.02) p.y = 1.02; return [p.x * w + Math.sin(now / 1400 + p.ph) * 10, p.y * h, p]; });
    pts.forEach(([x, y], i) => pts.slice(i + 1).forEach(([x2, y2]) => { const d = Math.hypot(x - x2, y - y2);
      if (d < 70) { ctx.strokeStyle = \`rgba(170,160,255,\${(1 - d / 70) * .35})\`; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); } }));
    pts.forEach(([x, y, p]) => { ctx.globalAlpha = .55 + .45 * Math.sin(now / 600 + p.ph); ctx.fillStyle = '#e8e4ff';
      ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.283); ctx.fill(); });
    ctx.globalAlpha = 1; raf = requestAnimationFrame(frame);
  };
  size(); new ResizeObserver(size).observe(canvas);
  return { start: () => { last = performance.now(); raf = requestAnimationFrame(frame); }, stop: () => cancelAnimationFrame(raf) };
}`,
  },
  {
    n: 25, id: 'aurora', name: 'Aurora ribbons', cat: 'ambient',
    desc: 'Translucent green-cyan-violet ribbons sway, stretch and slide across a night sky, layered with screen blending like the northern lights.',
    duration: '11-17s per ribbon, alternate', easing: 'ease-in-out',
    built: 'Three wide ribbons: each a linear-gradient(90deg, transparent, #3dffb0, #4cc9ff, #8b5cff, transparent) with a vertical soft mask (mask-image: linear-gradient(transparent, #000 45%, transparent)), rotated a few degrees. Keyframes animate transform translateX/skewX/scaleY over 11s, 14s and 17s with negative delays; mix-blend-mode: screen over a #070a1a sky with a few static stars. No blur filters.',
    notes: 'Keep opacity ≤ .6 per ribbon so overlaps glow rather than clip to white. Ribbons are oversized (160% width) so edges never show. Pause off-screen; aria-hidden.',
    reduced: 'Ribbons frozen.',
    css: `.aurora { position: relative; overflow: hidden; background: #070a1a; }
.ribbon { position: absolute; left: -30%; width: 160%; height: 55%; opacity: .55; mix-blend-mode: screen;
  background: linear-gradient(90deg, transparent, #3dffb0 25%, #4cc9ff 50%, #8b5cff 75%, transparent);
  -webkit-mask: linear-gradient(transparent, #000 45%, transparent); mask: linear-gradient(transparent, #000 45%, transparent);
  animation: sway var(--t, 14s) ease-in-out infinite alternate; }
@keyframes sway {
  0% { transform: translateX(-8%) rotate(var(--r, -8deg)) skewX(-12deg) scaleY(.8); }
  100% { transform: translateX(8%) rotate(calc(var(--r, -8deg) * -.5)) skewX(10deg) scaleY(1.2); }
}`,
  },

  // ---------- Playful ----------
  {
    n: 26, id: 'confetti', name: 'Confetti burst', cat: 'playful', hint: 'Click Celebrate', replay: true,
    desc: 'A burst of 120 paper pieces shoots up from the button, flutters (flipping as they spin), slows with air drag, falls under gravity and fades out.',
    duration: '≈2.2s', easing: 'physics: gravity 900px/s², drag 0.985/frame, initial speed 380-760px/s',
    built: 'A pointer-events: none canvas over the area (DPR capped at 2). On burst, spawn 120 pieces at the button center with angle = -90° ± 55°, random speed, colour from a 5-colour palette, size 5-9px, rotation speed and a flip phase. A rAF loop (only while pieces are alive) integrates velocity with gravity and drag, rotates, fakes 3D flutter by scaling height with cos(flip), and fades alpha over the last 30% of life. The loop stops when all pieces are dead.',
    notes: 'One canvas, not 120 DOM nodes. Cap total pieces (e.g. 300) if users spam it. Celebrate real milestones only. Decorative canvas is aria-hidden; announce the success in text.',
    reduced: 'No confetti; the button shows a brief "🎉 Done" state.',
    css: `.confetti-canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }`,
    js: `function burst(ctx, x, y, n = 120) {
  const colors = ['#5b4bff', '#ff6b8b', '#ffd54a', '#2fbf8f', '#4cc9ff'];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - .5) * 1.9, s = 380 + Math.random() * 380;
    pieces.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 12,
      flip: Math.random() * 6.28, w: 5 + Math.random() * 4, c: colors[i % 5], life: 0, ttl: 1.6 + Math.random() * .8 });
  }
}
// per frame: p.vx *= .985; p.vy = p.vy * .985 + 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
// ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.flip += 8 * dt)); ctx.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2);`,
  },
  {
    n: 27, id: 'spring-drag', name: 'Spring-physics draggable', cat: 'playful', hint: 'Drag the ball', replay: true,
    desc: 'Drag the ball anywhere; let go and a real spring pulls it home, keeping your throw\'s momentum, overshooting and wobbling to rest. A rubber tether stretches from its anchor.',
    duration: '≈0.8-1.2s settle', easing: 'spring: stiffness 170, damping 14, mass 1 (semi-implicit Euler, fixed 1/120s steps)',
    built: 'Pointer Events with setPointerCapture. While dragging, the ball follows the pointer offset and its velocity is estimated from the last moves. On release a rAF loop integrates a = -k·x - c·v for x and y in fixed 1/120s sub-steps (stable at any frame rate) and writes transform: translate(x, y) scale() with a slight squash along the velocity. Stops when |x|, |v| < 0.1. Keyboard: arrow keys displace it 40px and release, so it springs back.',
    notes: 'Use fixed-step integration (not frame dt directly) so it doesn\'t explode on slow frames. touch-action: none on the draggable. Stop the loop at rest.',
    reduced: 'Returns home with a 200ms ease-out instead of the spring.',
    css: `.ball { touch-action: none; cursor: grab; will-change: transform; }
.ball:active { cursor: grabbing; }`,
    js: `const K = 170, C = 14, STEP = 1 / 120;
function settle(s) {   // s = { x, y, vx, vy }
  let acc = 0, last = performance.now();
  const tick = now => {
    acc += Math.min(.05, (now - last) / 1000); last = now;
    for (; acc >= STEP; acc -= STEP) for (const [p, v] of [['x', 'vx'], ['y', 'vy']]) {
      s[v] += (-K * s[p] - C * s[v]) * STEP; s[p] += s[v] * STEP;
    }
    ball.style.transform = \`translate(\${s.x}px, \${s.y}px)\`;
    if (Math.hypot(s.x, s.y, s.vx, s.vy) > .1) requestAnimationFrame(tick); else ball.style.transform = '';
  };
  requestAnimationFrame(tick);
}`,
  },
  {
    n: 28, id: 'number-counter', name: 'Animated number counter', cat: 'playful', replay: true,
    desc: 'Dashboard stats count up from zero to their values, fast at first and gently landing (ease-out expo), with digits that never jitter.',
    duration: '1600ms (stagger 120ms)', easing: 'easeOutExpo: 1 - 2^(-10t)',
    built: 'A rAF loop per number: t = elapsed / 1600, value = target × (1 - 2^(-10t)), formatted with Intl.NumberFormat (separators, decimals, %, currency). font-variant-numeric: tabular-nums keeps widths constant so the layout doesn\'t wobble. Starts when the card scrolls into view (IntersectionObserver) and stops itself at t = 1. The final value is in the DOM from the start for screen readers (aria-label), only the visible text animates.',
    notes: 'Always end on the exact target value. Use tabular numerals. Don\'t re-count on every re-render; once per appearance.',
    reduced: 'Show final numbers immediately.',
    css: `.stat-num { font-variant-numeric: tabular-nums; }`,
    js: `function countUp(el, to, { ms = 1600, fmt = new Intl.NumberFormat() } = {}) {
  const t0 = performance.now();
  const tick = now => {
    const t = Math.min(1, (now - t0) / ms), k = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    el.textContent = fmt.format(to * k);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}`,
  },
  {
    n: 29, id: 'pull-refresh', name: 'Elastic pull-to-refresh', cat: 'playful', hint: 'Drag the list down', replay: true,
    desc: 'Pulling the list down stretches it with rubber-band resistance while an arrow rotates; past the threshold it flips to a spinner, a new item drops in, and the list snaps back with a little bounce.',
    duration: 'live drag; 500ms elastic return; ~1.1s fake refresh', easing: 'rubber band d = max·(1 - 1/(raw/max + 1)), max 120px; return cubic-bezier(.34,1.56,.64,1)',
    built: 'Pointer Events on the list (touch-action: none inside the demo). Raw drag distance is compressed by the rubber-band formula (asymptote 120px, so 120px of finger travel = 60px of pull) and applied as translateY to the list; the indicator above rotates with progress (0 → 180deg at the 60px threshold) and gets a ring when armed. On release: below threshold → transition back with the elastic curve; above → hold at 52px, show a spinning ring, prepend the new item with the stagger-in keyframe, then spring back. Keyboard: Enter/Space on the focused list runs the same sequence.',
    notes: 'Only start a pull when the list is scrolled to the top. The resistance curve matters more than anything: linear tracking feels broken. Don\'t block scrolling elsewhere.',
    reduced: 'No stretch animation; the spinner shows in place, then the new item appears.',
    css: `.ptr-list { transition: transform 500ms cubic-bezier(.34, 1.56, .64, 1); }
.ptr-list.dragging { transition: none; }
.ptr-ind { transform: translateY(calc(var(--pull, 0px) - 40px)) rotate(calc(var(--progress, 0) * 180deg)); }`,
    js: `const rubber = (raw, max = 120) => max * (1 - 1 / (raw / max + 1));   // raw finger travel → pulled distance`,
  },
];
