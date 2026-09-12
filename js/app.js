/* Wiring: state, UI, scroll choreography. */

import { PATHS, PATH_BY_ID, FEELINGS, resolvePath } from './paths.js';
import { COLORWAYS, printCard } from './fabric.js';
import { GARMENTS } from './garment.js';
import { createEmblemCanvas } from './art.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

const state = {
  garment: 'tee',
  path: PATHS[0].id,
  colorway: 'onyx',
  size: 'L'
};

let stage = null;

/* ---------------- loader ---------------- */

let progress = 0;
function bump(to) {
  progress = Math.max(progress, to);
  const fill = $('#loader-fill');
  if (fill) fill.style.width = `${Math.min(progress, 100)}%`;
}
function finishLoading() {
  bump(100);
  setTimeout(() => document.body.classList.remove('is-loading'), 420);
}

/* ---------------- toast ---------------- */

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { el.hidden = true; }, 400);
  }, 3200);
}

/* ---------------- radio group helper ---------------- */

function radioGroup(container, items, currentValue, onPick, render) {
  container.innerHTML = '';
  items.forEach(item => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'radio');
    btn.dataset.value = item.value;
    btn.setAttribute('aria-checked', String(item.value === currentValue));
    (render || (b => { b.textContent = item.label; }))(btn, item);
    btn.addEventListener('click', () => {
      [...container.children].forEach(c => c.setAttribute('aria-checked', 'false'));
      btn.setAttribute('aria-checked', 'true');
      onPick(item.value);
    });
    container.appendChild(btn);
  });
}

function syncGroup(container, value) {
  [...container.children].forEach(c =>
    c.setAttribute('aria-checked', String(c.dataset.value === value))
  );
}

/* ---------------- studio ---------------- */

const els = {};

function buildStudio() {
  els.garmentPicker = $('#garment-picker');
  els.colorPicker = $('#color-picker');
  els.sizePicker = $('#size-picker');
  els.pathPicker = $('#path-picker');

  radioGroup(
    els.garmentPicker,
    GARMENTS.map(g => ({ value: g.id, label: g.name, g })),
    state.garment,
    v => { state.garment = v; applyLook(); },
    (btn, item) => { btn.textContent = item.g.name; btn.className = ''; }
  );

  radioGroup(
    els.colorPicker,
    COLORWAYS.map(c => ({ value: c.id, label: c.name, c })),
    state.colorway,
    v => { state.colorway = v; applyLook(); },
    (btn, item) => {
      btn.className = 'swatch';
      btn.style.background = item.c.hex;
      btn.title = item.c.name;
      btn.setAttribute('aria-label', item.c.name);
      const s = document.createElement('span');
      s.textContent = item.c.name;
      btn.appendChild(s);
    }
  );

  radioGroup(
    els.sizePicker,
    SIZES.map(s => ({ value: s, label: s })),
    state.size,
    v => { state.size = v; updateSummary(); }
  );

  radioGroup(
    els.pathPicker,
    PATHS.map(p => ({ value: p.id, label: p.name })),
    state.path,
    v => { state.path = v; applyLook(); },
    (btn, item) => { btn.className = 'path-btn'; btn.textContent = item.label; }
  );

  $('#add-btn').addEventListener('click', () => {
    const g = GARMENTS.find(x => x.id === state.garment);
    const p = PATH_BY_ID[state.path];
    const c = COLORWAYS.find(x => x.id === state.colorway);
    toast(`Added · ${p.name} ${g.name} · ${c.name} · ${state.size}`);
  });
}

function updateSummary() {
  const g = GARMENTS.find(x => x.id === state.garment);
  const p = PATH_BY_ID[state.path];
  $('#garment-spec').textContent = g.spec;
  $('#sum-title').textContent = `${p.name} ${g.name}`;
  $('#sum-line').textContent = p.line;
  $('#sum-back').textContent = `12" ${p.name} graphic, gold discharge print`;
  $('#sum-fabric').textContent = g.spec;
  $('#sum-price').textContent = `$${g.price}`;

  syncGroup(els.garmentPicker, state.garment);
  syncGroup(els.colorPicker, state.colorway);
  syncGroup(els.sizePicker, state.size);
  syncGroup(els.pathPicker, state.path);

  $$('.path-card').forEach(card =>
    card.classList.toggle('is-active', card.dataset.path === state.path)
  );
}

async function applyLook() {
  updateSummary();
  if (stage && stage.ok) {
    await stage.setLook({
      garment: state.garment,
      path: PATH_BY_ID[state.path],
      colorway: state.colorway
    });
  }
}

/* ---------------- the feel gate ---------------- */

const picked = new Set();

function buildGate() {
  const box = $('#feelings');
  FEELINGS.forEach(f => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'feel-chip';
    b.textContent = f.text;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      if (picked.has(f.id)) picked.delete(f.id);
      else if (picked.size < 3) picked.add(f.id);
      else return;
      b.setAttribute('aria-pressed', String(picked.has(f.id)));
      syncGate();
    });
    box.appendChild(b);
  });

  $('#reveal-btn').addEventListener('click', reveal);
  $('#reset-btn').addEventListener('click', () => {
    picked.clear();
    $$('.feel-chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
    $('#result').hidden = true;
    $('#reset-btn').hidden = true;
    syncGate();
    $('#feel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function syncGate() {
  const n = picked.size;
  $('#gate-count').textContent = `${n} of 3 chosen`;
  $('#reveal-btn').disabled = n === 0;
  const atMax = n >= 3;
  $$('.feel-chip').forEach(c => {
    c.disabled = atMax && c.getAttribute('aria-pressed') === 'false';
  });
}

async function reveal() {
  const { winner, ranked } = resolvePath([...picked]);
  const p = PATH_BY_ID[winner];

  $('#result-name').textContent = p.name;
  $('#result-line').textContent = p.line;
  $('#result-blurb').textContent = p.blurb;
  $('#result-creed').textContent = `“${p.creed}”`;

  const bars = $('#result-bars');
  bars.innerHTML = '';
  ranked.filter(r => r.pct > 0).slice(0, 4).forEach(r => {
    const row = document.createElement('div');
    row.className = 'bar';
    row.innerHTML =
      `<span>${PATH_BY_ID[r.id].name}</span>` +
      `<span class="bar-track"><span class="bar-fill"></span></span>` +
      `<span>${r.pct}%</span>`;
    bars.appendChild(row);
    requestAnimationFrame(() => {
      row.querySelector('.bar-fill').style.width = `${r.pct}%`;
    });
  });

  const canvas = $('#result-canvas');
  const art = await printCard(p, 512);
  canvas.getContext('2d').drawImage(art, 0, 0, 512, 512);

  $('#result').hidden = false;
  $('#reset-btn').hidden = false;

  state.path = winner;
  await applyLook();

  $('#result').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ---------------- collection ---------------- */

async function buildCollection() {
  const grid = $('#collection-grid');
  for (const p of PATHS) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'path-card reveal';
    card.dataset.path = p.id;

    const holder = document.createElement('canvas');
    holder.width = holder.height = 512;
    card.appendChild(holder);

    const body = document.createElement('div');
    body.className = 'path-card-body';
    body.innerHTML =
      `<h3>${p.name}</h3><p>${p.line}</p>` +
      `<span class="path-card-cta">Load into the studio →</span>`;
    card.appendChild(body);

    card.addEventListener('click', async () => {
      state.path = p.id;
      await applyLook();
      $('#studio').scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast(`${p.name} loaded — ${p.line}`);
    });

    grid.appendChild(card);

    // draw the artwork once the card exists so the grid paints straight away
    printCard(p, 512).then(art => holder.getContext('2d').drawImage(art, 0, 0));
  }
}

/* ---------------- scroll choreography ---------------- */

function setupScroll() {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => revealObserver.observe(el));

  const shotObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const shot = e.target.dataset.shot;
      if (stage && stage.ok) stage.setShot(shot);
      document.body.classList.toggle('in-studio', shot === 'studio');
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  $$('[data-shot]').forEach(el => shotObserver.observe(el));

  const onScroll = () => {
    document.body.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------------- no-WebGL fallback ---------------- */

function fallbackArt() {
  document.body.classList.add('no-3d');
  const gap = $('.studio-stagegap');
  const canvas = createEmblemCanvas(PATH_BY_ID[state.path], 512);
  canvas.className = 'fallback-shot';
  gap.appendChild(canvas);
}

/* ---------------- boot ---------------- */

async function boot() {
  $('#year').textContent = new Date().getFullYear();

  $('#signup').addEventListener('submit', e => {
    e.preventDefault();
    $('#signup-note').textContent = "You're in. Watch your inbox.";
    e.target.reset();
    toast('Welcome to Full Custody.');
  });

  buildGate();
  buildStudio();
  buildCollection();
  setupScroll();
  bump(25);

  // fonts must be ready before the wordmark is drawn into the garment texture
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) { /* keep going with fallbacks */ }
  }
  bump(45);

  try {
    const { Stage } = await import('./stage.js');
    stage = new Stage($('#stage'));
    if (!stage.ok) throw new Error('WebGL unavailable');

    stage.resize();
    window.addEventListener('resize', () => stage.resize());
    bump(70);

    await applyLook();
    bump(95);

    const loop = () => { stage.render(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);

    $('#result-cta').addEventListener('click', () => {
      $('#studio').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  } catch (err) {
    console.warn('3D stage unavailable, falling back to flat artwork:', err);
    fallbackArt();
    updateSummary();
    $('#result-cta').addEventListener('click', () => {
      $('#studio').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  finishLoading();
}

// never leave the visitor staring at the loader if something goes wrong
setTimeout(finishLoading, 9000);

boot();
