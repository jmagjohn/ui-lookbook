// Animations gallery: one card per ANIMS entry (js/animations-data.js) with a live demo, Replay, Copy prompt and Copy CSS.
// Each DEMOS[id] has `html` and an optional `setup(stage)` returning hooks: play() for Replay, enter() on first view,
// start()/stop() for anything continuous (only called while the card is on screen).
(() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const $ = id => document.getElementById(id);
  const code = a => 'AN-' + String(a.n).padStart(2, '0');
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  let forceRM = false;
  const RM = () => mq.matches || forceRM;
  const SDA = CSS.supports('animation-timeline: view()');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const fade = (el, ms = 180) => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, easing: 'ease-out' });
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const ICON = {
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path pathLength="20" d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.6-4.6-9.5-9.3C1.1 7.8 3.3 4.2 6.9 4.2c2.1 0 3.6 1.1 5.1 2.9 1.5-1.8 3-2.9 5.1-2.9 3.6 0 5.8 3.6 4.4 7-1.9 4.7-9.5 9.3-9.5 9.3z"/></svg>',
  };
  const people = [['Ada Kim', 'Moodboard is ready for review', 262], ['Marco Ruiz', 'Shipped the onboarding flow', 22], ['Jun Sato', 'Can we tweak the easing?', 160],
    ['Lena Park', 'New icons are in Figma', 330], ['Omar Haddad', 'Standup moved to 10:30', 200], ['Priya Nair', 'Loved the confetti 🎉', 120]];
  const avatar = ([name, , h]) => `<i class="av" style="--h:${h}">${name.split(' ').map(w => w[0]).join('')}</i>`;

  // ---------- demos ----------
  const DEMOS = {
    'fade-through': {
      html: `<div class="ft-app"><div class="ft-tabs" role="group" aria-label="Sections">${['Inbox', 'Photos', 'Music'].map((t, i) => `<button type="button" data-i="${i}" aria-pressed="${!i}">${t}</button>`).join('')}</div><div class="ft-view"></div></div>`,
      setup(stage) {
        const view = stage.querySelector('.ft-view'), tabs = [...stage.querySelectorAll('.ft-tabs button')];
        const VIEWS = [
          () => `<ul class="ft-inbox">${people.slice(0, 3).map(p => `<li>${avatar(p)}<span><b>${p[0]}</b><small>${p[1]}</small></span></li>`).join('')}</ul>`,
          () => `<div class="ft-photos">${[20, 200, 320, 140, 260, 40].map(h => `<i style="--h:${h}"></i>`).join('')}</div>`,
          () => `<div class="ft-music"><i class="ft-art"></i><div><b>Slow Motion</b><small>The Easing Curves</small><span class="ft-track"><i></i></span><span class="ft-ctrl">⏮ ⏯ ⏭</span></div></div>`,
        ];
        let cur = 0, timer;
        view.innerHTML = VIEWS[0]();
        const swap = i => {
          if (i === cur) return;
          cur = i; tabs.forEach((t, j) => t.setAttribute('aria-pressed', j === i));
          clearTimeout(timer);
          if (RM()) { view.innerHTML = VIEWS[i](); fade(view, 150); return; }
          view.classList.remove('ft-in'); view.classList.add('ft-out');
          timer = setTimeout(() => { view.innerHTML = VIEWS[i](); view.classList.replace('ft-out', 'ft-in'); }, 90);
        };
        tabs.forEach((t, i) => t.addEventListener('click', () => swap(i)));
        return { play: () => swap((cur + 1) % 3) };
      },
    },

    'shared-element': {
      html: `<div class="fl-grid">${[['Kyoto', '24 photos', 12], ['Lisbon', '18 photos', 200], ['Reykjavík', '31 photos', 265]].map(([t, s, h], i) =>
        `<button type="button" class="fl-thumb" data-i="${i}" style="--h:${h}" aria-label="Open ${t}"><span class="fl-img"></span><span class="fl-title">${t}</span><span class="fl-sub">${s}</span></button>`).join('')}</div>
        <div class="fl-detail" hidden><div class="fl-bg"></div><div class="fl-img"></div><b class="fl-title"></b>
          <p class="fl-body">A slow week of walks, coffee and terrible light. The shared image travels from the thumbnail so you never lose your place.</p>
          <button type="button" class="fl-close" aria-label="Close">✕</button></div>`,
      setup(stage) {
        const detail = stage.querySelector('.fl-detail'), thumbs = [...stage.querySelectorAll('.fl-thumb')];
        const d = sel => detail.querySelector(sel);
        let open = null, running = [];
        const inv = (a, b, scale = true) => `translate(${a.left - b.left}px, ${a.top - b.top}px)` + (scale ? ` scale(${a.width / b.width}, ${a.height / b.height})` : '');
        const settle = anims => {                                     // resolves true when done, false if interrupted
          running = anims;
          return Promise.all(anims.map(a => a.finished)).then(() => { anims.forEach(a => a.cancel()); return true; }, () => false);
        };
        const interrupt = () => { running.forEach(a => a.cancel()); running = []; };
        const flight = (t, reverse) => {
          const pairs = [[t, d('.fl-bg')], [t.querySelector('.fl-img'), d('.fl-img')], [t.querySelector('.fl-title'), d('.fl-title')]];
          const rects = pairs.map(([a, b]) => [a.getBoundingClientRect(), b.getBoundingClientRect()]);   // read everything, then write
          const opts = { duration: reverse ? 360 : 420, easing: EASE, fill: 'both' };
          const anims = pairs.map(([, b], i) => {
            const [ra, rb] = rects[i];
            const from = i === 2 ? `${inv(ra, rb, false)} scale(${ra.height / rb.height})` : inv(ra, rb);
            const frames = [{ transform: from }, { transform: 'none' }];
            return b.animate(reverse ? frames.reverse() : frames, opts);
          });
          const body = [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }];
          [d('.fl-body'), d('.fl-close')].forEach(el => anims.push(el.animate(reverse ? [...body].reverse() : body,
            reverse ? { duration: 140, fill: 'both' } : { duration: 300, delay: 120, easing: EASE, fill: 'both' })));
          return settle(anims);
        };
        const show = async (t, { focus = true } = {}) => {
          if (open) return;
          interrupt(); open = t;
          thumbs.forEach(x => { x.style.visibility = x === t ? 'hidden' : ''; });
          detail.style.setProperty('--h', t.style.getPropertyValue('--h'));
          d('.fl-title').textContent = t.querySelector('.fl-title').textContent;
          detail.hidden = false;
          if (focus) d('.fl-close').focus({ preventScroll: true });
          await (RM() ? settle([fade(detail, 150)]) : flight(t, false));
        };
        const hide = async ({ focus = true } = {}) => {
          const t = open;
          if (!t) return;
          interrupt(); open = null;
          const done = await (RM() ? settle([detail.animate([{ opacity: 1 }, { opacity: 0 }], 150)]) : flight(t, true));
          if (!done || open) return;                                   // reopened mid-close
          detail.hidden = true; t.style.visibility = '';
          if (focus) t.focus({ preventScroll: true });
        };
        thumbs.forEach(t => t.addEventListener('click', () => show(t)));
        d('.fl-close').addEventListener('click', () => hide());
        stage.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
        return {
          play: async () => {
            if (open) await hide({ focus: false });
            await show(thumbs[0], { focus: false }); await wait(1100); await hide({ focus: false });
          },
        };
      },
    },

    'stagger-reveal': {
      html: `<ul class="st-list go">${people.slice(0, 5).map((p, i) => `<li style="--i:${i}">${avatar(p)}<span><b>${p[0]}</b><small>${p[1]}</small></span><em>${i + 2}m</em></li>`).join('')}</ul>`,
      setup(stage) {
        const list = stage.querySelector('.st-list');
        return { play: () => RM() ? fade(list, 150) : restart(list, 'go') };
      },
    },

    'clip-reveal': {
      html: `<button type="button" class="cr-hit" aria-label="Reveal the next scene"></button>`,
      setup(stage) {
        const SCENES = [['Good morning', 'Light theme'], ['Good evening', 'Dark theme'], ['Deep focus', 'Calm theme']];
        const hit = stage.querySelector('.cr-hit');
        const scene = i => {
          const el = document.createElement('div');
          el.className = `cr-scene cr-s${i}`;
          el.innerHTML = `<i class="cr-orb"></i><b>${SCENES[i][0]}</b><small>${SCENES[i][1]}</small>`;
          return stage.insertBefore(el, hit);
        };
        let cur = 0, busy = false, base = scene(0);
        const next = async (x = '50%', y = '50%') => {
          if (busy) return;
          busy = true; cur = (cur + 1) % SCENES.length;
          const el = scene(cur);
          if (RM()) await fade(el, 150).finished;
          else {
            el.style.setProperty('--x', x); el.style.setProperty('--y', y); el.classList.add('cr-in');
            await wait(660); el.classList.remove('cr-in');
          }
          base.remove(); base = el; busy = false;
        };
        hit.addEventListener('click', e => {
          const r = stage.getBoundingClientRect();
          e.detail ? next(`${e.clientX - r.left}px`, `${e.clientY - r.top}px`) : next();   // detail 0 = keyboard
        });
        return { play: () => next('85%', '15%') };
      },
    },

    'slide-over': {
      html: `<div class="so-app"><header class="so-bar"><b>Projects</b><button type="button" class="so-open">Open filters</button></header>
        <ul class="so-rows">${['Brand refresh', 'Mobile app v2', 'Docs site', 'Pricing page'].map((p, i) => `<li><i style="--h:${[262, 160, 22, 200][i]}"></i>${p}<em>${['Active', 'Review', 'Draft', 'Active'][i]}</em></li>`).join('')}</ul>
        <div class="so-scrim"></div>
        <aside class="so-panel" aria-label="Filters"><header><b>Filters</b><button type="button" class="so-close" aria-label="Close panel">✕</button></header>
          <div class="so-content"><small>Status</small><p class="so-chips"><span class="on">Active</span><span>Review</span><span>Draft</span></p>
          <small>Owner</small><p class="so-chips"><span>Me</span><span class="on">Team</span></p><button type="button" class="so-apply">Apply</button></div></aside></div>`,
      setup(stage) {
        const app = stage.querySelector('.so-app'), openBtn = stage.querySelector('.so-open'), closeBtn = stage.querySelector('.so-close');
        const set = (on, focus = true) => {
          app.classList.toggle('open', on);
          if (RM()) fade(stage.querySelector(on ? '.so-panel' : '.so-rows'), 120);
          if (focus) (on ? closeBtn : openBtn).focus({ preventScroll: true });
        };
        openBtn.addEventListener('click', () => set(true));
        closeBtn.addEventListener('click', () => set(false));
        stage.querySelector('.so-apply').addEventListener('click', () => set(false));
        stage.querySelector('.so-scrim').addEventListener('click', () => set(false));
        stage.addEventListener('keydown', e => { if (e.key === 'Escape' && app.classList.contains('open')) set(false); });
        return { play: async () => { set(true, false); await wait(1400); set(false, false); } };
      },
    },

    'press-squish': {
      html: `<button type="button" class="ps-btn"><span>Press me</span></button>`,
      setup(stage) {
        const b = stage.querySelector('.ps-btn');
        return { play: async () => { b.classList.add('pressed'); await wait(160); b.classList.remove('pressed'); } };
      },
    },

    'toggle-overshoot': {
      html: `<div class="tg-card">${[['Wi-Fi', 'Home network', true], ['Airplane mode', 'Radios off', false], ['Dark mode', 'Follow system', true]].map(([l, s, on], i) =>
        `<div class="tg-row"><span><b id="tg-l${i}">${l}</b><small>${s}</small></span><button type="button" class="tg" role="switch" aria-checked="${on}" aria-labelledby="tg-l${i}"></button></div>`).join('')}</div>`,
      setup(stage) {
        const sw = [...stage.querySelectorAll('.tg')];
        const flip = b => b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true');
        sw.forEach(b => b.addEventListener('click', () => flip(b)));
        return { play: async () => { flip(sw[1]); await wait(650); flip(sw[1]); } };
      },
    },

    'heart-burst': {
      html: `<div class="hb-wrap"><button type="button" class="hb" aria-pressed="false" aria-label="Like"><span class="hb-ring"></span>
        <span class="hb-dots">${Array.from({ length: 10 }, (_, i) => `<i style="--a:${i * 36}deg"></i>`).join('')}</span>${ICON.heart}</button>
        <span class="hb-count" aria-live="polite">128</span></div>`,
      setup(stage) {
        const b = stage.querySelector('.hb'), count = stage.querySelector('.hb-count');
        const set = on => {
          b.setAttribute('aria-pressed', on);
          if (on) restart(b, 'on'); else b.classList.remove('on');
          count.textContent = on ? 129 : 128;
        };
        b.addEventListener('click', () => set(!b.classList.contains('on')));
        return { play: () => set(true) };
      },
    },

    'checkbox-draw': {
      html: `<ul class="cd-list">${['Pick a colour palette', 'Tune the easing curves', 'Ship the lookbook'].map((t, i) =>
        `<li><label class="cd-task"><input type="checkbox"${i === 1 ? ' checked' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path pathLength="24" d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>${t}</span></label></li>`).join('')}</ul>`,
      setup(stage) {
        const box = stage.querySelector('input');
        return { play: async () => { if (box.checked) { box.checked = false; await wait(300); } box.checked = true; } };
      },
    },

    'copy-morph': {
      html: `<div class="cm-box"><code>npm i @lookbook/motion</code><button type="button" class="cm-btn"><span class="cm-icons"><span class="ic ic-copy">${ICON.copy}</span><span class="ic ic-check">${ICON.check}</span></span><span class="cm-label">Copy</span></button></div><span class="sr-only" aria-live="polite"></span>`,
      setup(stage) {
        const b = stage.querySelector('.cm-btn'), label = b.querySelector('.cm-label'), live = stage.querySelector('[aria-live]');
        let timer;
        const go = () => {
          b.classList.add('done'); label.textContent = 'Copied'; live.textContent = 'Copied';
          clearTimeout(timer);
          timer = setTimeout(() => { b.classList.remove('done'); label.textContent = 'Copy'; live.textContent = ''; }, 1600);
        };
        b.addEventListener('click', go);
        return { play: async () => { b.classList.remove('done'); await wait(60); go(); } };
      },
    },

    'shake-error': {
      html: `<form class="sh-form" novalidate><label for="sh-pw">Password</label><div class="sh-field"><input id="sh-pw" type="password" value="hunter2" autocomplete="off" aria-describedby="sh-msg"></div>
        <p class="sh-msg" id="sh-msg" aria-live="polite">Hint: the password is “lookbook”.</p><button type="submit">Sign in</button></form>`,
      setup(stage) {
        const form = stage.querySelector('form'), input = form.querySelector('input'), field = form.querySelector('.sh-field'), msg = form.querySelector('.sh-msg');
        const submit = () => {
          const ok = input.value === 'lookbook';
          input.setAttribute('aria-invalid', !ok);
          form.classList.toggle('bad', !ok); form.classList.toggle('good', ok);
          msg.textContent = ok ? 'Welcome back ✓' : 'Wrong password. Try “lookbook”.';
          if (!ok) restart(field, 'shake');
        };
        form.addEventListener('submit', e => { e.preventDefault(); submit(); });
        input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); form.classList.remove('bad', 'good'); });
        return { play: () => { if (input.value === 'lookbook') input.value = 'hunter2'; submit(); } };
      },
    },

    'parallax-layers': {
      html: `<div class="px-scroll sl-scroll" tabindex="0" aria-label="Parallax demo, scroll inside">
        <div class="px-scene"><div class="px-layer px-sky" style="--shift:-12px"></div><i class="px-layer px-sun" style="--shift:-34px"></i>
          <svg class="px-layer px-m1" style="--shift:-46px" viewBox="0 0 400 200" preserveAspectRatio="none"><path d="M0 70 Q40 30 80 55 T160 40 T250 60 T330 30 T400 50 V200 H0Z"/></svg>
          <svg class="px-layer px-m2" style="--shift:-90px" viewBox="0 0 400 200" preserveAspectRatio="none"><path d="M0 80 L50 40 L95 75 L150 25 L200 70 L250 45 L305 85 L350 35 L400 65 V200 H0Z"/></svg>
          <svg class="px-layer px-m3" style="--shift:-150px" viewBox="0 0 400 200" preserveAspectRatio="none"><path d="M0 60 Q60 20 120 55 Q170 80 220 45 Q290 0 340 50 Q370 70 400 40 V200 H0Z"/></svg>
          <div class="px-layer px-title" style="--shift:-200px"><b>Scroll inside</b><span>↓</span></div></div>
        <div class="px-after"><p>Sky −12px · sun −34px · far −46px · mid −90px · near −150px. Same scroll, different speeds.</p></div></div>`,
      setup: stage => scrollFallback(stage.querySelector('.px-scroll')),
    },

    'scroll-progress': {
      html: `<div class="sp-scroll sl-scroll" tabindex="0" aria-label="Article demo, scroll inside"><div class="sp-bar"><i></i></div>
        <article><p class="sp-kicker">Field notes · 4 min</p><h3>Designing calm interfaces</h3>
        <p class="sp-r">Motion should answer a question: where did that come from, where did it go, what changed?</p>
        <div class="sp-r sp-fig"><i></i><i></i><i></i></div>
        <p class="sp-r">Keep durations short (150-400ms for UI), ease out on enter and ease in on exit.</p>
        <p class="sp-r">Animate transform and opacity. Everything else makes the browser redo layout or paint.</p>
        <div class="sp-r sp-quote">“The best animation is the one nobody notices, but everybody feels.”</div>
        <p class="sp-r">And always offer a calm version for people who prefer reduced motion.</p></article></div>`,
      setup(stage) {
        const scroller = stage.querySelector('.sp-scroll');
        if (!SDA) {
          const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { root: scroller, threshold: .15 });
          scroller.querySelectorAll('.sp-r').forEach(el => io.observe(el));
        }
        return scrollFallback(scroller, { always: true });
      },
    },

    'scroll-text-fill': {
      html: `<div class="tf-scroll sl-scroll" tabindex="0" aria-label="Text fill demo, scroll inside"><p class="tf-cue">Scroll ↓</p>
        <p class="tf-p"><span class="tf-text">Good motion is invisible. It explains where things came from, where they went and what just changed, then gets out of the way.</span></p><p class="tf-end">Fin.</p></div>`,
      setup(stage) {
        const scroller = stage.querySelector('.tf-scroll'), p = stage.querySelector('.tf-p');
        if (SDA) return {};
        let queued = false;
        const update = () => {
          queued = false;
          if (RM()) return;
          const s = scroller.getBoundingClientRect(), r = p.getBoundingClientRect();
          const cover = (s.bottom - r.top) / (s.height + r.height);           // same maths as view() "cover"
          p.style.setProperty('--fill', clamp((cover - .15) / .45, 0, 1) * 100 + '%');
        };
        scroller.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
        return { enter: update };
      },
    },

    'skeleton-shimmer': {
      html: `<div class="sk-card" aria-busy="true"><div class="sk-skel"><i class="sk sk-av"></i><span><i class="sk sk-l1"></i><i class="sk sk-l2"></i></span><i class="sk sk-img"></i><i class="sk sk-l3"></i><i class="sk sk-l4"></i></div>
        <div class="sk-real">${avatar(people[0])}<span><b>Ada Kim</b><small>2 min ago</small></span><i class="sk-pic"></i><p>Moodboard v3 is up. Warmer greys, softer corners and the new motion tokens.</p></div></div>`,
      setup(stage) {
        const card = stage.querySelector('.sk-card');
        let run = 0;
        return {
          play: async () => {
            const me = ++run;
            card.classList.remove('loaded'); card.setAttribute('aria-busy', true);
            await wait(1600); if (me !== run) return;
            card.classList.add('loaded'); card.setAttribute('aria-busy', false);
            await wait(2600); if (me !== run) return;
            card.classList.remove('loaded'); card.setAttribute('aria-busy', true);
          },
        };
      },
    },

    'morph-spinner': {
      html: `<div class="ms-row"><figure><svg class="ms-arc" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20"/></svg><figcaption>Arc</figcaption></figure>
        <figure><i class="ms-blob"></i><figcaption>Blob</figcaption></figure><figure><span class="ms-dots"><i></i><i></i><i></i></span><figcaption>Dots</figcaption></figure></div>`,
    },

    'eased-progress': {
      html: `<div class="ep-card"><div class="ep-top"><span class="ep-file"><i></i>design-tokens.zip</span><b class="ep-pct">0%</b></div>
        <div class="ep-bar" role="progressbar" aria-label="Upload" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
        <p class="ep-status"><span class="ep-check">${ICON.check}</span><span class="ep-text">Uploading…</span></p></div>`,
      setup(stage) {
        const card = stage.querySelector('.ep-card'), bar = card.querySelector('.ep-bar'), pct = card.querySelector('.ep-pct'), text = card.querySelector('.ep-text');
        let raf = 0, run = 0;
        const set = p => { bar.style.setProperty('--p', p.toFixed(4)); pct.textContent = Math.round(p * 100) + '%'; };
        const finish = () => {
          cancelAnimationFrame(raf); card.classList.add('done'); set(1);
          bar.setAttribute('aria-valuenow', 100); text.textContent = 'Uploaded';
        };
        const play = async () => {
          const me = ++run;
          cancelAnimationFrame(raf); card.classList.remove('done'); text.textContent = 'Uploading…'; set(0);
          if (RM()) {
            for (const p of [.3, .6, .9]) { await wait(600); if (me !== run) return; set(p); }
          } else {
            let p = 0, last = performance.now(), lastAria = 0;
            const tick = now => {
              p += (.9 - p) * (1 - Math.pow(1 - .035, (now - last) / 16.7)); last = now;
              set(p);
              if (now - lastAria > 250) { bar.setAttribute('aria-valuenow', Math.round(p * 100)); lastAria = now; }
              raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
            await wait(2400);
          }
          if (me === run) finish();
        };
        return { play, enter: play, stop: () => { if (!card.classList.contains('done')) { run++; finish(); } } };
      },
    },

    'typewriter': {
      html: `<div class="tw-box"><div class="tw-dots"><i></i><i></i><i></i></div><p class="tw-line"><span class="tw-pre">›</span> <span class="tw-text"></span><i class="tw-caret"></i></p></div>`,
      setup(stage) {
        const box = stage.querySelector('.tw-box'), out = stage.querySelector('.tw-text');
        const LINES = ['Build me a calm dashboard.', 'Use animation AN-07, please.', 'Make the empty state friendly.', 'Ship it on Friday.'];
        let timer, li = 0, i = 0, dir = 1;
        const step = () => {
          const line = LINES[li];
          if (RM()) { out.textContent = line; li = (li + 1) % LINES.length; timer = setTimeout(step, 3000); return; }
          i += dir; out.textContent = line.slice(0, i);
          box.classList.toggle('typing', i > 0 && i < line.length);
          let delay = dir > 0 ? 45 + Math.random() * 45 + (/[.,]/.test(line[i - 1]) ? 220 : 0) : 28;
          if (dir > 0 && i >= line.length) { dir = -1; delay = 1400; }
          else if (dir < 0 && i <= 0) { dir = 1; li = (li + 1) % LINES.length; delay = 380; }
          timer = setTimeout(step, delay);
        };
        return { start: () => { clearTimeout(timer); step(); }, stop: () => clearTimeout(timer) };
      },
    },

    'magnetic-button': {
      html: `<div class="mg-field"><button type="button" class="mg-btn"><span>Get started →</span></button></div>`,
      setup(stage) {
        const field = stage.querySelector('.mg-field'), btn = field.querySelector('.mg-btn'), label = btn.querySelector('span');
        let r = null;
        field.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !RM()) { r = btn.getBoundingClientRect(); btn.classList.add('pull'); } });
        field.addEventListener('pointermove', e => {
          if (!r) return;
          const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
          btn.style.transform = `translate(${clamp(dx * .35, -22, 22)}px, ${clamp(dy * .35, -16, 16)}px)`;
          label.style.transform = `translate(${clamp(dx * .15, -9, 9)}px, ${clamp(dy * .15, -6, 6)}px)`;
        });
        field.addEventListener('pointerleave', () => { r = null; btn.classList.remove('pull'); btn.style.transform = label.style.transform = ''; });
      },
    },

    'tilt-glare': {
      html: `<div class="tl-wrap"><div class="tl-card"><span class="tl-chip"></span><b class="tl-brand">Lookbook</b><span class="tl-num">•••• •••• •••• 4271</span><span class="tl-name">J. DOE <em>11/29</em></span></div></div>`,
      setup(stage) {
        const wrap = stage.querySelector('.tl-wrap'), card = wrap.querySelector('.tl-card');
        let r = null, raf = 0, pos = null;
        const apply = () => {
          raf = 0;
          const [x, y] = pos;
          card.style.transform = `rotateX(${((.5 - y) * 24).toFixed(2)}deg) rotateY(${((x - .5) * 24).toFixed(2)}deg)`;
          card.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        };
        wrap.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !RM()) { r = card.getBoundingClientRect(); card.classList.add('live'); } });
        wrap.addEventListener('pointermove', e => {
          if (!r) return;
          pos = [clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1)];
          if (!raf) raf = requestAnimationFrame(apply);
        });
        wrap.addEventListener('pointerleave', () => { r = null; cancelAnimationFrame(raf); raf = 0; card.classList.remove('live'); card.style.transform = ''; });
      },
    },

    'spotlight-grid': {
      html: `<div class="sg-grid">${[['⚡', 'Fast'], ['◎', 'Focused'], ['☁', 'Synced'], ['⌘', 'Shortcuts'], ['◐', 'Themes'], ['✦', 'Delight']].map(([i, t]) =>
        `<div class="sg-tile"><b>${i}</b><span>${t}</span></div>`).join('')}</div>`,
      setup(stage) {
        const grid = stage.querySelector('.sg-grid'), tiles = [...grid.children];
        let rects = null;
        grid.addEventListener('pointerenter', () => { rects = tiles.map(t => t.getBoundingClientRect()); });
        grid.addEventListener('pointermove', e => {
          if (!rects || RM()) return;
          tiles.forEach((t, i) => { t.style.setProperty('--x', `${e.clientX - rects[i].left}px`); t.style.setProperty('--y', `${e.clientY - rects[i].top}px`); });
        });
        grid.addEventListener('pointerleave', () => { rects = null; });
      },
    },

    'underline-sweep': {
      html: `<nav class="us-nav" aria-label="Demo links">${['Work', 'About', 'Journal', 'Contact'].map(l => `<a href="#" class="us-link">${l}</a>`).join('')}</nav>
        <p class="us-p">Read the <a href="#" class="us-inline">longer story about how we tuned the easing curve for every single link</a> on the site.</p>`,
      setup(stage) { stage.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); }); },
    },

    'mesh-drift': {
      html: `<div class="md-blobs">${[['#ff8fb8', '19s', -3], ['#8b7bff', '23s', -9], ['#5fd4ff', '16s', -5], ['#ffd36b', '26s', -14]].map(([c, t, d], i) =>
        `<i class="md-b md-b${i}" style="--c:${c};--t:${t};animation-delay:${d}s"></i>`).join('')}</div><p class="md-label">Ambient mesh</p>`,
    },

    'floating-particles': {
      html: `<canvas class="fp-canvas"></canvas>`,
      setup(stage) {
        const canvas = stage.querySelector('canvas'), ctx = canvas.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
        let w = 0, h = 0, raf = 0, last = 0, t = 0;
        const ps = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), v: 6 + Math.random() * 14, r: .7 + Math.random() * 1.8, ph: Math.random() * 6.28 }));
        const draw = dt => {
          t += dt * 1000;
          ctx.clearRect(0, 0, w, h);
          const pts = ps.map(p => {
            p.y -= p.v * dt / h; if (p.y < -.03) { p.y = 1.03; p.x = Math.random(); }
            return [p.x * w + Math.sin(t / 1400 + p.ph) * 10, p.y * h, p];
          });
          ctx.lineWidth = .7;
          for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
            const dist = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
            if (dist < 70) {
              ctx.strokeStyle = `rgba(170,160,255,${((1 - dist / 70) * .35).toFixed(3)})`;
              ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); ctx.stroke();
            }
          }
          ctx.fillStyle = '#ece8ff';
          pts.forEach(([x, y, p]) => { ctx.globalAlpha = .55 + .45 * Math.sin(t / 600 + p.ph); ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.283); ctx.fill(); });
          ctx.globalAlpha = 1;
        };
        const frame = now => { draw(Math.min(.05, (now - last) / 1000)); last = now; raf = requestAnimationFrame(frame); };
        const size = () => {
          w = canvas.clientWidth; h = canvas.clientHeight;
          if (!w || !h) return;
          canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          draw(0);
        };
        new ResizeObserver(size).observe(canvas);
        return {
          start: () => { cancelAnimationFrame(raf); if (RM()) return draw(0); last = performance.now(); raf = requestAnimationFrame(frame); },
          stop: () => cancelAnimationFrame(raf),
        };
      },
    },

    'aurora': {
      html: `<i class="au-stars"></i>${[['14s', '-4s', '-8deg', '8%'], ['11s', '-7s', '-14deg', '22%'], ['17s', '-2s', '-4deg', '-4%']].map(([t, d, r, top]) =>
        `<i class="au-ribbon" style="--t:${t};--r:${r};top:${top};animation-delay:${d}"></i>`).join('')}
        <svg class="au-hills" viewBox="0 0 400 60" preserveAspectRatio="none"><path d="M0 40 Q50 18 100 34 T200 30 T300 24 T400 34 V60 H0Z"/></svg>`,
    },

    'confetti': {
      html: `<canvas class="cf-canvas"></canvas><div class="cf-card"><b>Project shipped!</b><small>12 tasks · 3 people · 0 bugs (so far)</small><button type="button" class="cf-btn">Celebrate</button></div>`,
      setup(stage) {
        const canvas = stage.querySelector('canvas'), ctx = canvas.getContext('2d'), btn = stage.querySelector('.cf-btn');
        const COLORS = ['#5b4bff', '#ff6b8b', '#ffd54a', '#2fbf8f', '#4cc9ff'], dpr = Math.min(devicePixelRatio || 1, 2);
        let pieces = [], raf = 0, last = 0, w = 0, h = 0;
        const frame = now => {
          const dt = Math.min(.033, (now - last) / 1000); last = now;
          ctx.clearRect(0, 0, w, h);
          pieces = pieces.filter(p => (p.life += dt) < p.ttl);
          for (const p of pieces) {
            p.vx *= .985; p.vy = p.vy * .985 + 900 * dt;
            p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.flip += 8 * dt;
            ctx.save(); ctx.globalAlpha = Math.min(1, (p.ttl - p.life) / (p.ttl * .3));
            ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.flip));
            ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); ctx.restore();
          }
          raf = pieces.length ? requestAnimationFrame(frame) : 0;
        };
        const burst = () => {
          if (RM()) { btn.textContent = '🎉 Done'; setTimeout(() => { btn.textContent = 'Celebrate'; }, 1200); return; }
          const s = stage.getBoundingClientRect(), b = btn.getBoundingClientRect();
          w = s.width; h = s.height;
          if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const x = b.left - s.left + b.width / 2, y = b.top - s.top + b.height / 2;
          for (let i = 0; i < 120 && pieces.length < 300; i++) {
            const a = -Math.PI / 2 + (Math.random() - .5) * 1.9, v = 380 + Math.random() * 380;
            pieces.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 12,
              flip: Math.random() * 6.28, w: 5 + Math.random() * 4, c: COLORS[i % 5], life: 0, ttl: 1.6 + Math.random() * .8 });
          }
          if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
        };
        btn.addEventListener('click', burst);
        return { play: burst, stop: () => { cancelAnimationFrame(raf); raf = 0; pieces = []; ctx.clearRect(0, 0, w, h); } };
      },
    },

    'spring-drag': {
      html: `<svg class="sd-tether" aria-hidden="true"><line x1="0" y1="0" x2="0" y2="0"/></svg><i class="sd-anchor"></i>
        <button type="button" class="sd-ball" aria-label="Springy ball: drag it, or press arrow keys"></button>`,
      setup(stage) {
        const ball = stage.querySelector('.sd-ball'), line = stage.querySelector('line');
        const K = 170, C = 14, STEP = 1 / 120;
        const s = { x: 0, y: 0, vx: 0, vy: 0 };
        let raf = 0, drag = null, half = { x: 120, y: 70 };
        const render = () => {
          const sp = Math.hypot(s.vx, s.vy), q = drag ? 0 : Math.min(.22, sp / 4000), ang = Math.atan2(s.vy, s.vx) * 180 / Math.PI;
          ball.style.transform = `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px) rotate(${ang}deg) scale(${1 + q}, ${1 - q}) rotate(${-ang}deg)`;
          line.setAttribute('x2', s.x.toFixed(1)); line.setAttribute('y2', s.y.toFixed(1));
        };
        const settle = () => {
          cancelAnimationFrame(raf);
          if (RM()) {
            const from = ball.style.transform;
            Object.assign(s, { x: 0, y: 0, vx: 0, vy: 0 }); render();
            ball.animate([{ transform: from }, { transform: ball.style.transform }], { duration: 200, easing: 'ease-out' });
            return;
          }
          let acc = 0, last = performance.now();
          const tick = now => {
            acc += Math.min(.05, (now - last) / 1000); last = now;
            for (; acc >= STEP; acc -= STEP) {
              s.vx += (-K * s.x - C * s.vx) * STEP; s.x += s.vx * STEP;
              s.vy += (-K * s.y - C * s.vy) * STEP; s.y += s.vy * STEP;
            }
            if (Math.hypot(s.x, s.y, s.vx / 10, s.vy / 10) < .1) { Object.assign(s, { x: 0, y: 0, vx: 0, vy: 0 }); render(); raf = 0; return; }
            render(); raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        };
        const measure = () => { const r = stage.getBoundingClientRect(); half = { x: r.width / 2 - 34, y: r.height / 2 - 34 }; };
        ball.addEventListener('pointerdown', e => {
          cancelAnimationFrame(raf); measure();
          ball.setPointerCapture(e.pointerId);
          drag = { px: e.clientX, py: e.clientY, ox: s.x, oy: s.y, t: performance.now() };
          s.vx = s.vy = 0; stage.classList.add('dragging');
        });
        ball.addEventListener('pointermove', e => {
          if (!drag) return;
          const now = performance.now(), dt = Math.max(1, now - drag.t) / 1000;
          const x = clamp(drag.ox + e.clientX - drag.px, -half.x, half.x), y = clamp(drag.oy + e.clientY - drag.py, -half.y, half.y);
          s.vx = s.vx * .6 + (x - s.x) / dt * .4; s.vy = s.vy * .6 + (y - s.y) / dt * .4;   // smoothed throw velocity
          s.x = x; s.y = y; drag.t = now; render();
        });
        const release = () => { if (!drag) return; drag = null; stage.classList.remove('dragging'); settle(); };
        ball.addEventListener('pointerup', release);
        ball.addEventListener('pointercancel', release);
        ball.addEventListener('keydown', e => {
          const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
          if (!d) return;
          e.preventDefault(); measure();
          s.x = clamp(s.x + d[0] * 40, -half.x, half.x); s.y = clamp(s.y + d[1] * 40, -half.y, half.y); render(); settle();
        });
        return { play: () => { measure(); Object.assign(s, { x: -half.x * .8, y: -half.y * .7, vx: 0, vy: 0 }); render(); settle(); } };
      },
    },

    'number-counter': {
      html: `<div class="nc-grid">${[['Revenue', 48920, 'usd', '+12%'], ['Active users', 12480, 'int', '+8%'], ['Conversion', 3.8, 'pct', '+0.4']].map(([l, v, f, d]) =>
        `<div class="nc-stat"><small>${l}</small><b class="nc-num" data-to="${v}" data-f="${f}">0</b><em>${d}</em></div>`).join('')}</div>`,
      setup(stage) {
        const FMT = {
          usd: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          int: new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }),
          pct: { format: v => v.toFixed(1) + '%' },
        };
        const nums = [...stage.querySelectorAll('.nc-num')];
        nums.forEach(n => n.setAttribute('aria-label', FMT[n.dataset.f].format(+n.dataset.to)));
        let run = 0;
        const play = () => {
          const me = ++run;
          nums.forEach((el, i) => {
            const to = +el.dataset.to, fmt = FMT[el.dataset.f];
            if (RM()) { el.textContent = fmt.format(to); return; }
            const t0 = performance.now() + i * 120;
            const tick = now => {
              if (me !== run) return;
              const t = clamp((now - t0) / 1600, 0, 1), k = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
              el.textContent = fmt.format(to * k);
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
        };
        return { play, enter: play };
      },
    },

    'pull-refresh': {
      html: `<div class="pr-phone"><header class="pr-head"><b>Inbox</b><small>Pull to refresh</small></header><div class="pr-viewport">
        <div class="pr-ind" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg><i class="pr-spin"></i></div>
        <ul class="pr-list" tabindex="0" aria-label="Inbox. Drag down, or press Enter, to refresh">${people.slice(0, 4).map(p => `<li>${avatar(p)}<span><b>${p[0]}</b><small>${p[1]}</small></span></li>`).join('')}</ul></div></div>`,
      setup(stage) {
        const vp = stage.querySelector('.pr-viewport'), list = stage.querySelector('.pr-list');
        const MAX = 120, THRESH = 60, HOLD = 52;
        const rubber = raw => MAX * (1 - 1 / (raw / MAX + 1));
        let drag = null, busy = false, next = 4;
        const setPull = d => {
          vp.style.setProperty('--pull', d + 'px');
          vp.style.setProperty('--progress', Math.min(1, d / THRESH));
          vp.classList.toggle('armed', d >= THRESH);
        };
        const refresh = async () => {
          busy = true; vp.classList.remove('dragging'); vp.classList.add('loading'); setPull(HOLD);
          await wait(1100);
          const p = people[next++ % people.length];
          list.insertAdjacentHTML('afterbegin', `<li class="pr-new">${avatar(p)}<span><b>${p[0]}</b><small>${p[1]}</small></span></li>`);
          if (list.children.length > 5) list.lastElementChild.remove();
          vp.classList.remove('loading', 'armed'); setPull(0);
          await wait(500); busy = false;
        };
        list.addEventListener('pointerdown', e => {
          if (busy || e.button) return;
          list.setPointerCapture(e.pointerId); drag = { y: e.clientY, d: 0 }; vp.classList.add('dragging');
        });
        list.addEventListener('pointermove', e => {
          if (!drag) return;
          drag.d = RM() ? 0 : rubber(Math.max(0, e.clientY - drag.y));
          if (RM()) vp.classList.toggle('armed', e.clientY - drag.y > THRESH); else setPull(drag.d);
        });
        const release = () => {
          if (!drag) return;
          const go = vp.classList.contains('armed');
          drag = null; vp.classList.remove('dragging');
          if (go) refresh(); else setPull(0);
        };
        list.addEventListener('pointerup', release);
        list.addEventListener('pointercancel', release);
        list.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !busy) { e.preventDefault(); refresh(); } });
        return {
          play: async () => {
            if (busy) return;
            if (!RM()) { vp.classList.add('dragging'); for (let i = 1; i <= 16; i++) { setPull(rubber(i * 9)); await wait(16); } }
            refresh();
          },
        };
      },
    },
  };

  /** Scroll-linked demos: CSS scroll timelines where supported, else a rAF-throttled listener that writes --p (0-1). */
  function scrollFallback(scroller, { always = false } = {}) {
    if (SDA && !always) return {};
    let queued = false;
    const update = () => {
      queued = false;
      const max = scroller.scrollHeight - scroller.clientHeight;
      scroller.style.setProperty('--p', max > 0 ? (scroller.scrollTop / max).toFixed(4) : 0);
    };
    scroller.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    return { enter: update };
  }

  // ---------- cards ----------
  const grid = $('an-grid'), toast = $('toast');
  const byId = Object.fromEntries(ANIMS.map(a => [a.id, a]));
  const codeLabel = a => a.js ? 'Copy code' : 'Copy CSS';
  const snippet = a => a.js ? `/* CSS */\n${a.css}\n\n// JS\n${a.js}` : a.css;

  const cardHtml = a => {
    const demo = DEMOS[a.id];
    const stageAttrs = a.hint ? `role="group" aria-label="${esc(`Demo: ${a.name}. ${a.hint}.`)}"` : 'aria-hidden="true"';
    return `<article class="an-card" id="${a.id}" data-cat="${a.cat}" tabindex="-1" aria-labelledby="t-${a.id}">
      <div class="an-stage an-${a.id}" ${stageAttrs}>${demo.html}${a.hint ? `<span class="an-hint" aria-hidden="true">${esc(a.hint)}</span>` : ''}</div>
      <div class="an-cap">
        <span class="code">${code(a)}</span><h2 id="t-${a.id}">${esc(a.name)}</h2><span class="kind">${AN_CATS[a.cat][1]}</span>
        <p class="an-desc">${esc(a.desc)}</p>
        <p class="an-timing"><span>${esc(a.duration)}</span><span>${esc(a.easing)}</span></p>
        <p class="an-actions">${a.replay ? `<button type="button" data-act="replay" aria-label="Replay ${esc(a.name)}">↻ Replay</button>` : ''}<button type="button" data-act="prompt" class="primary">Copy prompt</button><button type="button" data-act="code">${codeLabel(a)}</button></p>
      </div>
    </article>`;
  };

  grid.innerHTML = ANIMS.map(cardHtml).join('');
  $('an-count').textContent = ANIMS.length;
  const cards = [...grid.querySelectorAll('.an-card')];
  const hooks = new Map(cards.map(card => {
    const fn = DEMOS[card.id].setup;
    return [card, (fn && fn(card.querySelector('.an-stage'))) || {}];
  }));

  // ---------- only run what's on screen ----------
  const visible = new Set();
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    const card = e.target, h = hooks.get(card);
    if (e.isIntersecting === visible.has(card)) return;
    card.classList.toggle('on', e.isIntersecting);
    if (e.isIntersecting) {
      visible.add(card);
      if (!card.dataset.seen) { card.dataset.seen = 1; h.enter?.(); }
      h.start?.();
    } else { visible.delete(card); h.stop?.(); }
  }), { threshold: .2 });
  cards.forEach(c => io.observe(c));

  // ---------- reduced motion ----------
  const applyRM = () => {
    document.body.classList.toggle('rm', RM());
    $('an-rm').hidden = !RM();
    $('an-rm-btn').setAttribute('aria-pressed', forceRM);
    $('an-rm-btn').textContent = mq.matches ? 'Reduced motion: on (system)' : forceRM ? 'Show full motion' : 'Preview reduced motion';
    $('an-rm-btn').disabled = mq.matches;
    visible.forEach(card => { const h = hooks.get(card); h.stop?.(); h.start?.(); });
  };
  mq.addEventListener('change', applyRM);
  $('an-rm-btn').addEventListener('click', () => { forceRM = !forceRM; applyRM(); });
  applyRM();

  // ---------- prompts + clipboard ----------
  const promptFor = a => [
    `Add animation ${code(a)} "${a.name}" from my texture-themes lookbook.`,
    ``,
    `What it does: ${a.desc}`,
    `Category: ${AN_CATS[a.cat][1]}${a.hint ? ` (trigger: ${a.hint.toLowerCase()})` : ''}.`,
    `Timing: ${a.duration}, ${a.easing}${a.easingNote ? ` (${a.easingNote})` : ''}.`,
    `How it's built: ${a.built}`,
    `Do / don't: ${a.notes}`,
    `Reduced motion: under prefers-reduced-motion: reduce, ${a.reduced.charAt(0).toLowerCase() + a.reduced.slice(1)}`,
    `General: animate transform/opacity where possible, no layout thrash (read rects once, then write), and pause anything continuous while it's off-screen.`,
    ``,
    `Core code (working reference):`,
    snippet(a),
    ``,
    `Reference implementation: texture-themes/animations.html#${a.id}, texture-themes/js/animations.js (${code(a)} '${a.id}' in DEMOS), texture-themes/js/animations-data.js (timing + snippet), texture-themes/css/animations.css (.an-${a.id}).`,
  ].join('\n');

  let toastTimer;
  const say = msg => {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  };
  const copy = async (text, msg) => {
    try { await navigator.clipboard.writeText(text); }
    catch {                                                         // file:// pages may not get the async clipboard
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    say(msg);
  };

  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const card = b.closest('.an-card'), a = byId[card.id];
    if (b.dataset.act === 'prompt') copy(promptFor(a), `Prompt for ${code(a)} copied`);
    if (b.dataset.act === 'code') copy(snippet(a), `${codeLabel(a).replace('Copy ', '')} for ${code(a)} copied`);
    if (b.dataset.act === 'replay') {
      const stage = card.querySelector('.an-stage');
      if (RM()) fade(stage, 200);
      hooks.get(card).play?.();
    }
  });

  // ---------- filters ----------
  const filters = $('filters');
  filters.innerHTML = [['all', 'All', ANIMS.length], ...Object.entries(AN_CATS).map(([k, [label]]) => [k, label, ANIMS.filter(a => a.cat === k).length])]
    .map(([k, label, n], i) => `<button type="button" data-cat="${k}" aria-pressed="${!i}">${label} <span>${n}</span></button>`).join('');
  const filter = cat => {
    filters.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.dataset.cat === cat));
    cards.forEach(c => { c.hidden = cat !== 'all' && c.dataset.cat !== cat; });
  };
  filters.addEventListener('click', e => { const b = e.target.closest('button'); if (b) filter(b.dataset.cat); });

  // ---------- deep links: animations.html#toggle-overshoot (or #AN-07) ----------
  const route = () => {
    const key = decodeURIComponent(location.hash.slice(1)), m = /^an-?(\d+)$/i.exec(key);
    const card = key && document.getElementById(m ? (ANIMS.find(a => a.n === +m[1]) || {}).id : key);
    if (!card || !card.classList.contains('an-card')) return;
    if (card.hidden) filter('all');
    card.scrollIntoView({ block: 'center', behavior: RM() ? 'auto' : 'smooth' });
    card.focus({ preventScroll: true });
    restart(card, 'flash');
    setTimeout(() => card.classList.remove('flash'), 2200);
  };
  addEventListener('hashchange', route);
  if (location.hash) requestAnimationFrame(route);
})();
