/* Hecho por: CONSTRUCTOR */
/* A.L.I.A.S. · pieza 00 · estado, idioma (t) y ayudas. Cada pieza cuelga de window.AliasUI. */
(function(){
'use strict';
const U = window.AliasUI = window.AliasUI || {};
const LANGS = ['es', 'en'];
const K_LANG = 'synthz:alias:lang', K_SCHEME = 'synthz:alias:scheme';
const TEXTS_URL = 'alias-textos.json';

U.K_SCHEME = K_SCHEME;
U.langs = LANGS;
U.dict = null;
U.lang = 'es';
U.$ = (s, r) => (r || document).querySelector(s);
U.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
U.store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
};

/* ---- idioma ---- */
/* v3.7 · manda el idioma de todo SymphorIA (synthz:lang); el de A.L.I.A.S. solo queda de respaldo */
U.detectLang = function(){
  const g = U.store.get('synthz:lang'); if (LANGS.includes(g)) return g;
  const s = U.store.get(K_LANG);
  if (LANGS.includes(s)) return s;
  const list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || 'es'];
  for (const l of list){ const c = String(l).slice(0, 2).toLowerCase(); if (LANGS.includes(c)) return c; }
  return 'es';
};
U.t = function(key, vars){
  const d = U.dict || {};
  let s = d[U.lang] && d[U.lang][key];
  if (s == null) s = d.es && d.es[key];
  if (s == null) s = key;
  if (vars) s = String(s).replace(/\{(\w+)\}/g, (m, k) => vars[k] == null ? m : vars[k]);
  return s;
};
window.t = window.t || U.t;
U.loadTexts = async function(){
  try{
    const r = await fetch(TEXTS_URL, { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    U.dict = await r.json();
  }catch(e){ U.dict = {}; console.error('ALIAS: no se pudo leer ' + TEXTS_URL, e); }
};
U.saveLang = l => { U.store.set(K_LANG, l); U.store.set('synthz:lang', l); };

/* ---- estado ---- */
U.fresh = function(){
  return {
    phase: 'edit',          /* edit | running | await | paused | error | limit | done */
    goal: '', plan: null,
    status: {}, results: {}, errors: {}, skipped: {}, open: {},
    mode: 'manual', pausing: false, cancelled: false, running: false,
    gateFn: null, cur: null, editing: null, busy: false, reqId: 0
  };
};
U.S = U.fresh();
U.statusOf = id => U.S.status[id] || 'pending';
U.isFinished = id => U.statusOf(id) === 'done' || !!U.S.skipped[id];

/* ---- DOM ---- */
U.el = function(tag, props, ...kids){
  const n = document.createElement(tag);
  for (const k in (props || {})){
    const v = props[k];
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v === true) n.setAttribute(k, '');
    else n.setAttribute(k, v);
  }
  for (const c of kids.flat()){
    if (c == null || c === false) continue;
    n.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return n;
};
const ICONS = {
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  edit: '<path d="M12 20h8"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  redo: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  dot: '<circle cx="12" cy="12" r="6"/>',
  dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>'
};
U.icon = function(name){
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.9'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
  s.innerHTML = ICONS[name] || '';   /* constantes de arriba, nunca datos del usuario */
  return s;
};

/* anuncia algo a lector de pantalla (aria-live) */
let sayT;
U.say = function(msg){
  const n = U.$('#aliasLive'); if (!n) return;
  n.textContent = ''; clearTimeout(sayT);
  sayT = setTimeout(() => { n.textContent = msg; }, 40);
};

/* solo enlaces http(s) */
U.safeUrl = function(u){
  try{ const x = new URL(String(u), location.href); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : ''; }catch(e){ return ''; }
};

/* texto de la IA → nodos seguros (nunca innerHTML) */
U.renderText = function(box, text){
  box.textContent = '';
  const blocks = String(text || '').replace(/\r/g, '').trim().split(/\n{2,}/);
  for (const b of blocks){
    if (!b.trim()) continue;
    const lines = b.split('\n');
    if (lines.every(l => /^\s*[-*•]\s+/.test(l))){
      const ul = U.el('ul');
      lines.forEach(l => ul.append(U.el('li', { text: l.replace(/^\s*[-*•]\s+/, '') })));
      box.append(ul);
    }else if (lines.length === 1 && /^#{1,4}\s+/.test(lines[0])){
      box.append(U.el('h4', { text: lines[0].replace(/^#{1,4}\s+/, '') }));
    }else box.append(U.el('p', { text: b }));
  }
};
})();
/* Hecho por: CONSTRUCTOR */
/* A.L.I.A.S. · pieza 10 · vista: textos estáticos, cabecera, tema y lista de pasos. */
(function(){
'use strict';
const U = window.AliasUI;
const { $, $$, el, t } = U;
const TOOLS = ['search', 'file', 'memory', 'image', 'think'];
const show = (sel, on) => { const n = $(sel); if (n) n.hidden = !on; };
U.show = show;

/* ---- textos de lo que ya está en alias.html (data-i18n*) ---- */
U.applyI18n = function(){
  document.documentElement.lang = U.lang;
  window.ALIAS_LANG = U.lang;
  $$('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
  $$('[data-i18n-ph]').forEach(n => { n.placeholder = t(n.dataset.i18nPh); });
  $$('[data-i18n-aria]').forEach(n => { n.setAttribute('aria-label', t(n.dataset.i18nAria)); });
  document.title = t('titulo');
  U.drawHeader();
};

/* ---- cabecera: idioma y tema claro/oscuro ---- */
U.setScheme = function(s){
  const r = document.documentElement; r.dataset.scheme = s;
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = s === 'light' ? '#f4f1ff' : '#0b0820';
};
U.drawHeader = function(){
  $$('.langs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === U.lang)));
  const b = $('#schemeBtn'); if (!b) return;
  const light = document.documentElement.dataset.scheme === 'light';
  b.textContent = ''; b.append(U.icon(light ? 'moon' : 'sun'));
  b.setAttribute('aria-label', t(light ? 'tema_oscuro' : 'tema_claro'));
};

/* ---- lista de pasos ---- */
function statusIcon(st){
  const i = el('span', { class: 'sdot', 'aria-hidden': 'true' });
  if (st === 'done') i.append(U.icon('check'));
  else if (st === 'error') i.append(U.icon('x'));
  else if (st === 'running') i.append(el('i', { class: 'ring' }));
  else i.append(el('i', { class: 'hole' }));
  return i;
}
function iconBtn(act, icon, label, extra){
  return el('button', { type: 'button', class: 'iconbtn' + (extra ? ' ' + extra : ''), 'data-act': act, 'data-alias': act === 'ren' ? 'step-edit' : act === 'redo' ? 'redo' : null, 'aria-label': label, title: label }, U.icon(icon));
}

U.drawSteps = function(){
  const S = U.S, box = $('#stepList'); if (!box || !S.plan) return;
  const steps = S.plan.steps, total = steps.length;
  const editable = S.phase === 'edit';
  const canRedo = S.phase !== 'edit' && S.phase !== 'running';
  const frag = document.createDocumentFragment();
  steps.forEach((st, i) => {
    const n = i + 1, stt = U.statusOf(st.id), skipped = !!S.skipped[st.id];
    const label = skipped ? 'st_skipped' : 'st_' + stt;
    const li = el('li', { class: 'step', 'data-alias': 'step', 'data-id': st.id, 'data-status': skipped ? 'skipped' : stt, 'aria-current': (S.cur === st.id && S.phase === 'running') ? 'step' : null });
    li.append(el('span', { class: 'num', 'aria-hidden': 'true' }, String(n)), statusIcon(stt));

    const body = el('div', { class: 'sbody' });
    if (S.editing === st.id){
      const inp = el('input', { type: 'text', class: 'ren', 'data-alias': 'step-title', maxlength: '120', value: st.title || '', 'aria-label': t('rename_label', { n }) });
      inp.value = st.title || '';
      body.append(inp);
    }else{
      body.append(el('div', { class: 'stitle', 'data-alias': 'step-title', text: st.title || t('paso_n', { n }) }));
    }
    const meta = el('div', { class: 'smeta' },
      el('span', { class: 'stag', text: t('paso_n', { n }) }),
      TOOLS.includes(st.tool) ? el('span', { class: 'stool', text: t('tool_' + st.tool) }) : null,
      el('span', { class: 'sst', text: t(label) }));
    body.append(meta);
    if (stt === 'error' && S.errors[st.id]) body.append(el('div', { class: 'serr', text: S.errors[st.id] }));
    const r = S.results[st.id];
    if (r && (r.output || '').trim()){
      const det = el('details', { class: 'sout' }, el('summary', { text: t('ver_salida') }));
      const txt = el('div', { class: 'rtext', 'data-alias': 'step-output' }); U.renderText(txt, r.output); det.append(txt);
      if (S.open[st.id]) det.open = true;
      det.addEventListener('toggle', () => { S.open[st.id] = det.open; });
      body.append(det);
    }
    li.append(body);

    const acts = el('div', { class: 'sacts' });
    if (editable){
      acts.append(
        iconBtn('up', 'up', t('btn_subir', { n }), i === 0 ? 'is-off' : ''),
        iconBtn('down', 'down', t('btn_bajar', { n }), i === total - 1 ? 'is-off' : ''),
        iconBtn('ren', 'edit', t('btn_renombrar', { n })),
        iconBtn('del', 'del', t('btn_borrar', { n }), total <= 1 ? 'is-off' : ''));
      acts.querySelectorAll('.is-off').forEach(b => { b.disabled = true; });
    }else if (canRedo && (stt === 'done' || stt === 'error')){
      acts.append(iconBtn('redo', 'redo', t('btn_rehacer', { n }), 'wide'));
    }
    li.append(acts);
    frag.append(li);
  });
  box.textContent = ''; box.append(frag);
  if (S.editing != null){ const inp = $('.ren', box); if (inp){ inp.focus(); inp.select(); } }

  const done = steps.filter(s => U.isFinished(s.id)).length;
  const pr = $('#progress'); if (pr){ pr.max = total; pr.value = done; pr.setAttribute('aria-label', t('progreso_n', { n: done, total })); }
  const pt = $('#progTxt'); if (pt) pt.textContent = t('progreso_n', { n: done, total });
};

/* ---- todo junto ---- */
U.draw = function(){
  const S = U.S;
  show('#vHome', !S.plan);
  show('#vPlan', !!S.plan);
  if (S.plan){
    $('#planGoal').textContent = S.goal;
    show('#editHint', S.phase === 'edit');
    U.drawSteps();
    if (U.drawControls) U.drawControls();
    if (U.drawResult) U.drawResult();
  }
  const go = $('#goBtn'); if (go){ go.disabled = S.busy; go.textContent = t(S.busy ? 'planeando' : 'goal_btn'); }
  const form = $('#goalForm'); if (form) form.setAttribute('aria-busy', String(S.busy));
};
})();
/* Hecho por: CONSTRUCTOR */
/* A.L.I.A.S. · pieza 20 · controles: pedir plan, editar pasos, ejecutar, pausar, rehacer, cancelar, errores. */
(function(){
'use strict';
const U = window.AliasUI;
const { $, $$, t } = U;
const show = (s, on) => U.show(s, on);
const MAX_STEPS = 7;

const stepNum = id => U.S.plan.steps.findIndex(s => String(s.id) === String(id)) + 1;
const stepById = id => U.S.plan.steps.find(s => String(s.id) === String(id));
const msgHome = txt => { const m = $('#homeMsg'); m.textContent = txt || ''; m.hidden = !txt; };

/* ---- 1) pedir el plan ---- */
U.requestPlan = async function(goal){
  const S = U.S;
  goal = String(goal || '').trim();
  if (!goal){ msgHome(t('err_vacio')); $('#goalInput').focus(); return; }
  if (S.busy) return;
  msgHome('');
  const A = window.ALIAS;
  if (!A || typeof A.plan !== 'function'){ msgHome(t('err_sin_motor')); return; }
  const req = ++S.reqId;
  S.busy = true; U.draw(); U.say(t('planeando'));
  let r;
  try{ r = await A.plan(goal); }catch(e){ r = { ok: false, error: t('err_red') }; }
  if (req !== S.reqId) return;           /* el usuario ya hizo otra cosa */
  S.busy = false;
  if (!r || !r.ok){
    msgHome(r && r.limit ? t('err_limite') : ((r && r.error) || t('err_generico')));
    U.draw(); return;
  }
  const raw = r.plan && Array.isArray(r.plan.steps) ? r.plan.steps : [];
  const steps = raw.slice(0, MAX_STEPS).filter(s => s && s.id != null).map(s => ({ id: s.id, title: String(s.title || ''), tool: s.tool, input: s.input }));
  if (!steps.length){ msgHome(t('err_plan')); U.draw(); return; }
  const mode = S.mode;
  Object.assign(S, U.fresh(), { mode, goal: r.plan.goal || goal, plan: Object.assign({}, r.plan, { steps }), reqId: req });
  U.draw(); U.say(t('plan_listo', { n: steps.length }));
  const h = $('#planTitle'); if (h) h.focus();
};

/* ---- 2) editar el plan (solo antes de ejecutar) ---- */
function move(id, d){
  const a = U.S.plan.steps, i = a.findIndex(s => String(s.id) === String(id)), j = i + d;
  if (i < 0 || j < 0 || j >= a.length) return;
  [a[i], a[j]] = [a[j], a[i]];
  U.draw();
  const b = $('li[data-id="' + CSS.escape(String(id)) + '"] [data-act="' + (d < 0 ? 'up' : 'down') + '"]');
  (b && !b.disabled ? b : $('li[data-id="' + CSS.escape(String(id)) + '"] [data-act]')).focus();
  U.say(t('movido', { title: a[j].title, pos: j + 1 }));
}
function remove(id){
  const S = U.S, a = S.plan.steps; if (a.length <= 1) return;
  const i = a.findIndex(s => String(s.id) === String(id)); if (i < 0) return;
  const [gone] = a.splice(i, 1);
  U.draw(); U.say(t('borrado', { title: gone.title }));
  const next = $$('#stepList li')[Math.min(i, a.length - 1)];
  const b = next && $('[data-act="del"]', next); if (b) b.focus();
}
function rename(id, val, save){
  const S = U.S, st = stepById(id); S.editing = null;
  const v = String(val || '').trim().slice(0, 120);
  if (save && v && st && v !== st.title){ st.title = v; U.say(t('renombrado', { title: v })); }
  U.draw();
  const b = $('li[data-id="' + CSS.escape(String(id)) + '"] [data-act="ren"]'); if (b) b.focus();
}

/* ---- 3) puerta de espera (aprobar / pausa / error) ---- */
const gate = () => new Promise(r => { U.S.gateFn = r; });
const send = x => { const f = U.S.gateFn; if (f){ U.S.gateFn = null; f(x); } };

function prepRedo(i){
  const S = U.S;
  S.plan.steps.forEach((s, k) => { if (k >= i){ delete S.status[s.id]; delete S.results[s.id]; delete S.errors[s.id]; delete S.skipped[s.id]; } });
  S.pausing = false;
}
function withHint(plan, id){
  const p = JSON.parse(JSON.stringify(plan));
  p.steps.forEach(s => { if (String(s.id) === String(id)) s.input = ((s.input || '') + ' ' + t('reintento_pista')).trim(); });
  return p;
}
async function exec(st, hint){
  const S = U.S, A = window.ALIAS;
  if (!A || typeof A.runStep !== 'function') return { err: t('err_sin_motor') };
  const idx = S.plan.steps.findIndex(s => String(s.id) === String(st.id));
  const prev = S.plan.steps.slice(0, idx).map(s => S.results[s.id]).filter(Boolean);
  let r;
  try{ r = await A.runStep(hint ? withHint(S.plan, st.id) : S.plan, st.id, prev, { synth: U.synthOn !== false }); }
  catch(e){ return { err: t('err_red') }; }
  if (!r || !r.ok) return { err: (r && r.error) || t('err_generico'), limit: !!(r && r.limit) };
  const sp = r.step || {};
  if (sp.status === 'error') return { err: sp.error || t('err_generico') };
  return { step: sp };
}

U.runSeq = 0;
U.drive = async function(){
  const S = U.S;
  if (S.running) return;
  const my = ++U.runSeq, dead = () => my !== U.runSeq;   /* cancelar sube runSeq: este ciclo termina solo */
  S.running = true; S.cancelled = false;
  let hint = false;
  while (!dead()){
    const i = S.plan.steps.findIndex(s => !U.isFinished(s.id));
    if (i < 0){ if (U.finish) U.finish(); break; }
    if (S.pausing){
      S.pausing = false; S.phase = 'paused'; U.draw(); U.say(t('pausado'));
      const x = await gate(); if (dead()) return;
      if (x.a === 'redo') prepRedo(x.i);
      continue;
    }
    const st = S.plan.steps[i], n = i + 1, total = S.plan.steps.length;
    S.phase = 'running'; S.cur = st.id; S.status[st.id] = 'running'; delete S.errors[st.id];
    U.draw(); U.say(t('en_curso', { n, total, title: st.title }));
    const out = await exec(st, hint); hint = false;
    if (dead()) return;
    if (out.limit){ S.status[st.id] = 'pending'; S.phase = 'limit'; U.draw(); U.say(t('err_limite')); break; }
    if (out.err){
      S.status[st.id] = 'error'; S.errors[st.id] = out.err; S.phase = 'error'; U.draw();
      U.say(t('error_n', { n, title: st.title }));
      const b = $('#bErrRetry'); if (b) b.focus();
      let x = await gate();
      if (dead()) return;
      if (x.a === 'stop'){ S.phase = 'paused'; U.draw(); x = await gate(); if (dead()) return; }
      if (x.a === 'skip') S.skipped[st.id] = true;
      else if (x.a === 'retry'){ hint = true; delete S.status[st.id]; }
      else if (x.a === 'redo') prepRedo(x.i);
      continue;
    }
    S.status[st.id] = 'done'; S.results[st.id] = out.step; S.cur = null;
    U.say(t('hecho_n', { n, total, title: st.title }));
    const more = S.plan.steps.some(s => !U.isFinished(s.id));
    if (more && S.mode === 'manual' && !S.pausing){
      const nx = S.plan.steps.find(s => !U.isFinished(s.id));
      S.phase = 'await'; S.awaitNext = nx; S.awaitDone = n; U.draw();
      const b = $('#bApprove'); if (b) b.focus();
      const x = await gate(); if (dead()) return;
      if (x.a === 'redo') prepRedo(x.i);
    }else U.draw();
  }
  if (!dead()) S.running = false;
};

/* ---- 4) botones ---- */
function cancelAll(ask){
  const S = U.S;
  if (ask && S.phase !== 'edit' && !confirm(t('confirm_cancel'))) return;
  U.runSeq++; send({ a: 'cancel' });
  const mode = S.mode;
  Object.assign(S, U.fresh(), { mode, reqId: S.reqId + 1 });
  msgHome(''); U.draw(); U.say(t('cancelado'));
  const g = $('#goalInput'); if (g) g.focus();
}
function redo(id){
  const S = U.S, i = S.plan.steps.findIndex(s => String(s.id) === String(id));
  if (i < 0 || S.phase === 'running') return;
  if (S.running){ send({ a: 'redo', i }); return; }
  prepRedo(i); U.drive();
}

U.drawControls = function(){
  const S = U.S, p = S.phase, live = p === 'running' || p === 'await' || p === 'paused' || p === 'error';
  const vp = $('#vPlan'); if (vp) vp.dataset.state = p;   /* edit|running|await|paused|error|limit|done */
  show('#ctl', p !== 'done');
  $$('input[name="mode"]').forEach(r => { r.checked = r.value === S.mode; });
  show('#bRun', p === 'edit');
  show('#bPause', p === 'running' && !S.pausing);
  show('#bResume', p === 'paused');
  show('#bApprove', p === 'await');
  show('#bCancel', p !== 'done');
  const msg = $('#ctlMsg');
  let txt = '';
  if (p === 'running' && S.pausing) txt = t('pausando');
  else if (p === 'await' && S.awaitNext) txt = t('aprobar_q', { n: S.awaitDone, m: stepNum(S.awaitNext.id), title: S.awaitNext.title });
  else if (p === 'paused') txt = t('pausado');
  msg.textContent = txt; msg.hidden = !txt;
  show('#redoNote', live && S.plan.steps.some(s => S.status[s.id] === 'done'));
  show('#errBox', p === 'error');
  show('#limitBox', p === 'limit');
  if (p === 'error'){
    const id = S.plan.steps.find(s => S.status[s.id] === 'error');
    if (id){ $('#errStep').textContent = t('paso_n', { n: stepNum(id.id) }) + ' · ' + id.title; $('#errMsg').textContent = S.errors[id.id] || ''; }
  }
  const run = $('#bRun'); if (run) run.disabled = !S.plan.steps.length;
};

U.bind = function(){
  /* v3.0 · Síntesis encendida o apagada (se recuerda en este navegador) */
  const so = $('#synthOn');
  if (so){
    try{ U.synthOn = localStorage.getItem('alias:synth') !== '0'; }catch(e){ U.synthOn = true; }
    so.checked = U.synthOn !== false;
    so.addEventListener('change', () => { U.synthOn = so.checked; try{ localStorage.setItem('alias:synth', so.checked ? '1' : '0'); }catch(e){} });
  }
  const S = U.S;
  $('#goalForm').addEventListener('submit', e => { e.preventDefault(); U.requestPlan($('#goalInput').value); });
  $('#goalInput').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); U.requestPlan(e.target.value); } });
  $('#goalInput').addEventListener('input', () => msgHome(''));

  /* plantillas: rellenan el objetivo y marcan la parte [entre corchetes] para escribir encima */
  $('#tplList').addEventListener('click', e => {
    const b = e.target.closest('[data-tpl]'); if (!b) return;
    const inp = $('#goalInput'); inp.value = t('tpl_' + b.dataset.tpl + '_g'); inp.focus();
    const a = inp.value.indexOf('['), z = inp.value.indexOf(']');
    if (a >= 0 && z > a) inp.setSelectionRange(a, z + 1);
    msgHome('');
  });

  /* cabecera */
  $$('.langs button').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.lang === U.lang) return;
    U.lang = b.dataset.lang; U.saveLang(U.lang); U.applyI18n(); U.draw();
    window.dispatchEvent(new CustomEvent('alias:lang', { detail: { lang: U.lang } }));
  }));
  $('#schemeBtn').addEventListener('click', () => {
    const next = document.documentElement.dataset.scheme === 'light' ? 'dark' : 'light';
    U.setScheme(next); U.store.set(U.K_SCHEME, next); U.drawHeader();
  });

  /* pasos (delegado) */
  const list = $('#stepList');
  list.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const id = b.closest('li').dataset.id, a = b.dataset.act;
    if (a === 'up') move(id, -1);
    else if (a === 'down') move(id, 1);
    else if (a === 'del') remove(id);
    else if (a === 'ren'){ S.editing = stepById(id).id; U.drawSteps(); }
    else if (a === 'redo') redo(id);
  });
  list.addEventListener('keydown', e => {
    if (!e.target.classList.contains('ren')) return;
    const id = e.target.closest('li').dataset.id;
    if (e.key === 'Enter'){ e.preventDefault(); e.target.dataset.done = '1'; rename(id, e.target.value, true); }
    else if (e.key === 'Escape'){ e.target.dataset.done = '1'; rename(id, '', false); }
  });
  list.addEventListener('focusout', e => {
    if (!e.target.classList || !e.target.classList.contains('ren') || e.target.dataset.done) return;
    e.target.dataset.done = '1'; rename(e.target.closest('li').dataset.id, e.target.value, true);
  });

  /* controles */
  $$('input[name="mode"]').forEach(r => r.addEventListener('change', () => {
    S.mode = r.value;
    if (S.mode === 'auto' && S.phase === 'await') send({ a: 'go' });
  }));
  $('#bRun').addEventListener('click', () => { S.editing = null; U.drive(); });
  $('#bPause').addEventListener('click', () => { S.pausing = true; U.draw(); U.say(t('pausando')); });
  $('#bResume').addEventListener('click', () => send({ a: 'go' }));
  $('#bApprove').addEventListener('click', () => send({ a: 'go' }));
  $('#bCancel').addEventListener('click', () => cancelAll(true));
  $('#bErrSkip').addEventListener('click', () => send({ a: 'skip' }));
  $('#bErrRetry').addEventListener('click', () => send({ a: 'retry' }));
  $('#bErrStop').addEventListener('click', () => send({ a: 'stop' }));
  $('#bLimitBack').addEventListener('click', () => cancelAll(false));
};
U.cancelAll = cancelAll;
})();
/* Hecho por: CONSTRUCTOR */
/* A.L.I.A.S. · pieza 30 · resultado final (texto, fuentes, archivos) y arranque. */
(function(){
'use strict';
const U = window.AliasUI;
const { $, el, t } = U;

/* junta lo que dejaron los pasos: texto final, fuentes sin repetir, archivos */
U.compile = function(){
  const S = U.S;
  const done = S.plan.steps.filter(s => S.results[s.id]);
  const last = done.slice().reverse().find(s => String(S.results[s.id].output || '').trim());
  const seen = new Set(), sources = [], files = [];
  done.forEach(s => {
    const r = S.results[s.id];
    (Array.isArray(r.sources) ? r.sources : []).forEach(x => {
      const url = x && U.safeUrl(x.url); if (!url || seen.has(url)) return;
      seen.add(url); sources.push({ url, title: String(x.title || url) });
    });
    if (r.file && r.file.name && (r.file.text != null || r.file.blobUrl)) files.push(r.file);
  });
  return {
    text: last ? String(S.results[last.id].output).trim() : '',
    synth: last && S.results[last.id].synth && Array.isArray(S.results[last.id].synth.voices) ? S.results[last.id].synth : null,
    sources, files: files.reverse(),
    skipped: S.plan.steps.filter(s => S.skipped[s.id]).length
  };
};

U.finish = function(){
  const S = U.S;
  S.phase = 'done'; S.cur = null; S.summary = U.compile();
  U.draw(); U.say(t('listo'));
  const h = $('#resTitle'); if (h) h.focus();
};

/* ---- descarga ---- */
function toBlob(f){
  const mime = f.mime || 'text/plain';
  const data = String(f.text == null ? '' : f.text);
  if (/presentationml|octet-stream|zip|pdf/i.test(mime) || /\.(pptx|zip|pdf)$/i.test(f.name || '')){
    try{                                    /* los binarios llegan en base64 */
      const s = atob(data.replace(/\s/g, '')), a = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
      return new Blob([a], { type: mime });
    }catch(e){}
  }
  return new Blob([data], { type: /^text\//i.test(mime) ? mime + ';charset=utf-8' : mime });
}
/* El servidor entrega la presentación como JSON {titulo,subtitulo,diapositivas[]} dentro de file.text.
   Aquí se arma el .pptx con la misma librería del chat (lib/pptxgen.bundle.js). Si no carga, se
   baja el esquema en texto: mejor algo útil que un .pptx roto. */
function deckOf(f){
  if (!/\.pptx$/i.test(f.name || '') && !/presentationml/i.test(f.mime || '')) return null;
  try{ const d = JSON.parse(String(f.text)); return d && Array.isArray(d.diapositivas) ? d : null; }catch(e){ return null; }
}
let pptxLib = null;
const loadPptx = () => pptxLib || (pptxLib = new Promise((ok, no) => {
  if (window.PptxGenJS) return ok(window.PptxGenJS);
  const sc = document.createElement('script'); sc.src = 'lib/pptxgen.bundle.js';
  sc.onload = () => window.PptxGenJS ? ok(window.PptxGenJS) : no(new Error('pptx'));
  sc.onerror = () => { pptxLib = null; no(new Error('pptx')); };
  document.head.append(sc);
}));
async function deckBlob(D){
  const P = await loadPptx(), pres = new P();
  pres.layout = 'LAYOUT_WIDE'; pres.author = 'SymphorIA'; pres.title = D.titulo || 'A.L.I.A.S.';
  const BG = '0B0C10', TX = 'ECEBE7', SOFT = 'C9C8C3', GOLD = 'E6B65F', ROSE = 'C9566C';
  const c = pres.addSlide(); c.background = { color: BG };
  c.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: .12, fill: { color: ROSE } });
  c.addText(D.titulo || '', { x: .9, y: 1.4, w: 11.5, h: 1.6, fontFace: 'Georgia', fontSize: 44, color: TX, valign: 'bottom', fit: 'shrink' });
  if (D.subtitulo) c.addText(D.subtitulo, { x: .9, y: 3.3, w: 11.5, h: 1.2, fontFace: 'Calibri', fontSize: 22, color: SOFT, valign: 'top', fit: 'shrink' });
  D.diapositivas.forEach((d, i) => {
    const sl = pres.addSlide(); sl.background = { color: BG };
    sl.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: .12, h: 7.5, fill: { color: GOLD } });
    sl.addText(d.titulo || String(i + 2), { x: .8, y: .45, w: 11.7, h: 1.0, fontFace: 'Georgia', fontSize: 32, color: TX, fit: 'shrink' });
    if ((d.puntos || []).length) sl.addText(d.puntos.map(p => ({ text: p, options: { bullet: { code: '25CF' }, color: 'D9D7D2', paraSpaceAfter: 10 } })), { x: .8, y: 1.8, w: 11.7, h: 4.8, fontFace: 'Calibri', fontSize: 22, valign: 'top', fit: 'shrink' });
    if (d.notas) sl.addNotes(d.notas);
  });
  return pres.write({ outputType: 'blob' });
}
function outline(D){
  return ['# ' + (D.titulo || ''), D.subtitulo || ''].concat(D.diapositivas.map((d, i) => '\n## ' + (i + 1) + '. ' + (d.titulo || '') + '\n' + (d.puntos || []).map(p => '- ' + p).join('\n'))).join('\n').trim() + '\n';
}
function save(blob, name){
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
async function download(f){
  const name = String(f.name).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 120) || 'alias.txt';
  const D = deckOf(f);
  if (D){
    try{ save(await deckBlob(D), name); return; }
    catch(e){ U.say(t('err_pptx')); save(new Blob([outline(D)], { type: 'text/markdown;charset=utf-8' }), name.replace(/\.pptx$/i, '') + '.md'); return; }
  }
  if (f.blobUrl && f.text == null){      /* imagen u otro archivo ya hecho en el navegador */
    const a = el('a', { href: f.blobUrl, download: name }); document.body.append(a); a.click(); a.remove(); return;
  }
  save(toBlob(f), name);
}

/* ---- v3.0 · Síntesis: cuántas IAs, cuánto coinciden, en qué no, y cada voz ---- */
function drawSynth(Y){
  const box = $('#resSynth'); if (!box) return;
  box.textContent = ''; box.hidden = !Y;
  if (!Y) return;
  const n = Y.voices.length;
  /* la respuesta de abajo ES la combinada; aquí solo se dice de dónde salió y, plegado, qué aportó cada IA */
  const head = el('div', { class: 'syn-h' }, el('span', { class: 'syn-dots', 'aria-hidden': 'true' }, ...Y.voices.map(() => el('i'))),
    el('div', {}, el('b', { text: n > 1 ? t(Y.fused ? 'syn_titulo' : 'syn_cons', { n }) : t('syn_una') }), n > 1 ? el('small', { text: Y.voices.map(v => v.name).join(' · ') }) : ''));
  box.append(head);
  if (n > 1){
    const d = el('details', { class: 'syn-v' }, el('summary', { text: t('syn_voces') }));
    Y.voices.forEach(v => {
      const b = el('div', { class: 'rtext' }); U.renderText(b, v.text);
      d.append(el('div', { class: 'syn-voz' }, el('span', { class: 'syn-ia', text: v.name + (v.prov ? ' · ' + v.prov : '') }),
        v.aporte ? el('p', { class: 'syn-ap' }, el('b', { text: t('syn_aporte') + ' ' }), document.createTextNode(v.aporte)) : '', b));
    });
    box.append(d);
  }
}

/* ---- dibujar el resultado ---- */
U.drawResult = function(){
  const S = U.S, box = $('#vResult');
  const on = S.phase === 'done' && S.summary;
  box.hidden = !on; if (!on) return;
  const R = S.summary;

  const txt = $('#resText');
  if (R.text) U.renderText(txt, R.text); else { txt.textContent = ''; txt.append(el('p', { class: 'hint', text: t('res_vacio') })); }

  drawSynth(R.synth);
  const note = $('#resNote'); note.textContent = R.skipped ? t('res_saltados', { n: R.skipped }) : ''; note.hidden = !R.skipped;

  const src = $('#resSources'); src.textContent = '';
  R.sources.forEach(s => src.append(el('li', {}, el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer nofollow', text: s.title }))));
  $('#resSrcWrap').hidden = !R.sources.length;

  const fb = $('#resFiles'); fb.textContent = '';
  R.files.forEach(f => fb.append(el('button', { type: 'button', class: 'btn primary', 'data-alias': 'download', onclick: () => download(f) }, U.icon('dl'), el('span', { text: t('res_archivo', { name: f.name }) }))));
  fb.hidden = !R.files.length;

  const wrap = $('#resSteps'); wrap.textContent = '';
  S.plan.steps.forEach((st, i) => {
    const r = S.results[st.id]; if (!r || !String(r.output || '').trim()) return;
    const d = el('details', { class: 'sout' }, el('summary', { text: t('paso_n', { n: i + 1 }) + ' · ' + st.title }));
    const b = el('div', { class: 'rtext' }); U.renderText(b, r.output); d.append(b); wrap.append(d);
  });
  $('#resStepsWrap').hidden = !wrap.children.length;
};

function copy(){
  const R = U.S.summary; if (!R || !R.text) return;
  const ok = () => { U.say(t('res_copiado')); const b = $('#bCopy span'); if (b){ b.textContent = t('res_copiado'); setTimeout(() => { b.textContent = t('res_copiar'); }, 1800); } };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(R.text).then(ok, () => {});
}

/* ---- arranque ---- */
async function boot(){
  /* v3.7 · respeta Ajustes de SymphorIA: «Animaciones» y «Vidrio» (blurry) apagados */
  try{ const c = JSON.parse(localStorage.getItem('synthz:cfg')) || {}; document.documentElement.classList.toggle('noanim', c.anim === false); document.documentElement.classList.toggle('noglass', c.glass === false); }catch(e){}
  const sc = document.documentElement.dataset.scheme;
  U.setScheme(sc === 'light' ? 'light' : 'dark');
  U.lang = U.detectLang();
  await U.loadTexts();
  U.applyI18n();
  U.bind();
  $('#bCopy').addEventListener('click', copy);
  $('#bNew').addEventListener('click', () => U.cancelAll(false));
  U.draw();
  document.documentElement.classList.add('ready');
  /* v3.7 · si cambias el idioma en otra pestaña de SymphorIA, A.L.I.A.S. cambia al instante, sin recargar */
  const follow = () => { const l = U.detectLang(); if (l === U.lang) return; U.lang = l; U.applyI18n(); U.draw(); window.dispatchEvent(new CustomEvent('alias:lang', { detail: { lang: U.lang } })); };
  addEventListener('storage', e => { if (e.key === 'synthz:lang') follow(); });
  addEventListener('pageshow', follow);
}
window.AliasUI.boot = boot;
/* se espera un instante para que todas las piezas del archivo armado ya hayan corrido */
setTimeout(boot, 0);
})();
/* A.L.I.A.S. · pieza 40 · v2.4: estrellas del fondo, el check que salta al terminar un paso y estrellitas al ver el resultado. Solo adorno. */
(function(){
'use strict';
const reduce = document.documentElement.classList.contains('noanim');   /* v3.1: lo decide Ajustes, no el sistema */

/* estrellas: puntitos que titilan; siempre el mismo cielo para la misma pantalla */
const cv = document.getElementById('alStars');
if (cv){
  const ctx = cv.getContext('2d'); let w = 0, h = 0, S = [], raf = 0, on = true;
  const fit = () => {
    const d = Math.min(devicePixelRatio || 1, 2); w = cv.clientWidth || innerWidth; h = cv.clientHeight || innerHeight;
    cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    S = Array.from({ length: Math.round(w * h / 11000) }, () => { const g = rnd() < .2; return { x: rnd() * w, y: rnd() * h, r: g ? .9 + rnd() : .3 + rnd(), g, ph: rnd() * 6.28, sp: .4 + rnd() * 1.3 }; });
  };
  const draw = now => {
    raf = 0; ctx.clearRect(0, 0, w, h);
    for (const s of S){
      const tw = reduce ? .8 : .5 + .5 * Math.sin(now / 1000 * s.sp + s.ph);
      ctx.globalAlpha = .2 + .7 * tw; ctx.fillStyle = s.g ? '#ffc857' : '#e9e4ff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    if (on && !reduce) raf = requestAnimationFrame(draw);
  };
  fit(); raf = requestAnimationFrame(draw);
  addEventListener('resize', () => { fit(); if (!raf) raf = requestAnimationFrame(draw); });
  document.addEventListener('visibilitychange', () => { on = !document.hidden; if (on && !raf) raf = requestAnimationFrame(draw); });
}

/* el check salta solo en el paso que acaba de terminar (la lista se vuelve a dibujar entera cada vez) */
const list = document.getElementById('stepList');
if (list && 'MutationObserver' in window){
  let was = {};
  new MutationObserver(() => {
    const now = {};
    list.querySelectorAll('.step').forEach(li => {
      const id = li.dataset.id, st = li.dataset.status; now[id] = st;
      if (st === 'done' && was[id] && was[id] !== 'done') li.classList.add('pop');
    });
    was = now;
  }).observe(list, { childList: true });
}

/* al aparecer el resultado, unas estrellitas salen del título */
const res = document.getElementById('vResult');
if (res && !reduce && 'MutationObserver' in window){
  let shown = !res.hidden;
  new MutationObserver(() => {
    const vis = !res.hidden;
    if (vis && !shown){
      const h = document.getElementById('resTitle'), C = ['#3de0ff', '#7b3ff2', '#ff3d9a', '#ff7a45', '#ffc857'];
      const x = h ? h.offsetLeft + h.offsetWidth / 2 : 60, y = h ? h.offsetTop + h.offsetHeight / 2 : 30;
      for (let i = 0; i < 14; i++){
        const s = document.createElement('i'), a = Math.PI * 2 * i / 14 + Math.random() * .4, r = 60 + Math.random() * 70;
        s.className = 'al-star'; s.setAttribute('aria-hidden', 'true');
        s.style.cssText = 'left:' + x + 'px;top:' + y + 'px;--c:' + C[i % C.length] + ';--dx:' + (Math.cos(a) * r).toFixed(0) + 'px;--dy:' + (Math.sin(a) * r * .7).toFixed(0) + 'px';
        res.append(s); setTimeout(() => s.remove(), 1400);
      }
    }
    shown = vis;
  }).observe(res, { attributes: true, attributeFilter: ['hidden'] });
}
})();
