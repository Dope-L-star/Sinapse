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
  return 'en';   /* ni español ni inglés en el navegador: inglés (igual que el resto de SymphorIA) */
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
