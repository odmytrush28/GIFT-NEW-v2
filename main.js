/* CREATE — My Five Gifts · page interactions (no dependencies) */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;

  // Animation timeline (seconds): five golden streams flow from the portrait to the five gifts.
  var STREAM = { first: 0.9, gap: 0.4, travel: 1.6, pulseStart: 7, pulseEvery: 4.5 };
  var ARRIVE = [0, 1, 2, 3, 4].map(function (i) { return STREAM.first + i * STREAM.gap + STREAM.travel; });

  var tokens = $$('.orbit button');
  var motionBtn = $('#motionToggle');
  var pauseBtn = $('#pause');
  var state = { t: 0, playing: true, lit: [false, false, false, false, false] };

  /* ---------- Reduced motion ---------- */
  function stored() { try { return localStorage.getItem('create-reduced'); } catch (e) { return null; } }
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = stored() !== null ? stored() === '1' : !!(mq && mq.matches);

  function applyMotion() {
    root.classList.toggle('reduced', reduced);
    motionBtn.setAttribute('aria-pressed', String(reduced));
    $('.motion-label', motionBtn).textContent = reduced ? 'Motion off' : 'Reduce motion';
    pauseBtn.disabled = reduced;
    $('#replay').disabled = reduced;
    if (reduced) setAllLit(true, false);
  }
  motionBtn.addEventListener('click', function () {
    reduced = !reduced;
    try { localStorage.setItem('create-reduced', reduced ? '1' : '0'); } catch (e) {}
    applyMotion();
    if (!reduced) replay();
  });

  /* ---------- Gift tokens around the portrait ---------- */
  function setLit(i, on, flash) {
    if (state.lit[i] === on) return;
    state.lit[i] = on;
    var tk = tokens[i];
    tk.classList.toggle('lit', on);
    if (on && flash) { tk.classList.remove('flash'); void tk.offsetWidth; tk.classList.add('flash'); setTimeout(function () { tk.classList.remove('flash'); }, 1100); }
  }
  function setAllLit(on, flash) { for (var i = 0; i < 5; i++) setLit(i, on, flash); }

  /* ---------- Clock ---------- */
  var last = performance.now();
  function tick(now) {
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (state.playing && !reduced) state.t += dt;
    if (!reduced) for (var i = 0; i < 5; i++) setLit(i, state.t >= ARRIVE[i], true);
    requestAnimationFrame(tick);
  }

  function replay() {
    state.t = 0; state.playing = true;
    setAllLit(false, false);
    setPauseUI();
  }
  function setPauseUI() {
    pauseBtn.setAttribute('aria-pressed', String(!state.playing));
    pauseBtn.querySelector('use').setAttribute('href', state.playing ? '#i-pause' : '#i-play');
    pauseBtn.querySelector('span').textContent = state.playing ? 'Pause' : 'Play';
  }
  $('#replay').addEventListener('click', replay);
  pauseBtn.addEventListener('click', function () { state.playing = !state.playing; setPauseUI(); });

  // Public API for the WebGL layer (fx.js)
  window.CREATE = {
    time: function () { return state.t; },
    playing: function () { return state.playing && !reduced; },
    isReduced: function () { return reduced; },
    STREAM: STREAM,
    ARRIVE: ARRIVE,
    origin: $('#portraitInner'),
    ORIGIN: { x: 0.5, y: 0.66 },
    tokens: tokens.map(function (b) { return b.querySelector('svg'); })
  };

  /* ---------- Portrait tilt (mouse / touch) ---------- */
  var wrap = $('#portrait');
  function tilt(x, y) {
    if (reduced) return;
    var r = wrap.getBoundingClientRect();
    var dx = (x - (r.left + r.width / 2)) / r.width, dy = (y - (r.top + r.height / 2)) / r.height;
    wrap.style.setProperty('--ty', (dx * 14).toFixed(2) + 'deg');
    wrap.style.setProperty('--tx', (-dy * 14).toFixed(2) + 'deg');
  }
  wrap.addEventListener('pointermove', function (e) { tilt(e.clientX, e.clientY); });
  wrap.addEventListener('pointerleave', function () { wrap.style.setProperty('--tx', '0deg'); wrap.style.setProperty('--ty', '0deg'); });

  /* ---------- Smooth scroll ---------- */
  function scrollToEl(el) { if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }

  /* ---------- Gift cards ---------- */
  function setCard(card, open) {
    card.classList.toggle('open', open);
    card.querySelector('.card-toggle').setAttribute('aria-expanded', String(open));
  }
  var cards = $$('.card');
  cards.forEach(function (card) {
    card.querySelector('.card-toggle').addEventListener('click', function () { setCard(card, !card.classList.contains('open')); });
  });
  $('#openAll').addEventListener('click', function () { cards.forEach(function (c) { setCard(c, true); }); });
  $('#closeAll').addEventListener('click', function () { cards.forEach(function (c) { setCard(c, false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cards.forEach(function (c) { setCard(c, false); }); });

  function openGift(n) {
    var card = $('#gift-' + n);
    if (!card) return;
    setCard(card, true);
    scrollToEl(card);
    setTimeout(function () { card.querySelector('.card-toggle').focus({ preventScroll: true }); }, reduced ? 0 : 700);
  }
  tokens.forEach(function (tk) { tk.addEventListener('click', function () { openGift(tk.getAttribute('data-gift')); }); });

  /* ---------- Scroll reveal; cards glow gold one after another ---------- */
  $$('.section-head, .card, .approach-portrait, .approach-copy').forEach(function (el) { el.classList.add('reveal-on-scroll'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('in');
        if (el.classList.contains('card')) {
          var i = cards.indexOf(el);
          setTimeout(function () { el.classList.add('lit'); setTimeout(function () { el.classList.remove('lit'); }, 1400); }, reduced ? 0 : 500 + i * 160);
        }
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.reveal-on-scroll').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal-on-scroll').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Start ---------- */
  applyMotion();
  setPauseUI();
  requestAnimationFrame(tick);
})();
