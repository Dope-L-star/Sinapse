'use client';
/* ===== A.L.I.A.S. en React (v4.3 · agente que trabaja solo, diseño «Partitura») =====
   Antes (v3.9): había que tocar «Sí, continúa» después de cada paso. Sammuel (9 nov): «¿no es mejor que arme un plan,
   tú lo apruebes una vez y él diga "voy a continuar con tal cosa" y siga solo, y que lo puedas cancelar o agregarle algo
   como en los proyectos de Claude?». Así queda:
   1) El plan: escribes la meta, A.L.I.A.S. propone el plan (editable) y lo apruebas UNA vez.
   2) Trabaja solo: el paso en marcha dice «Voy a continuar con: …». La caja de abajo sigue abierta: lo que escribas se suma
      encima sin pararlo (action 'ajustar' rehace solo los pasos que faltan). Pausar y Detener a mano. Si un paso falla,
      lo reintenta solo con otra IA; solo pregunta si falla dos veces.
   3) Listo: el resultado con archivos y fuentes; la caja pasa a «Pide un cambio al resultado» (se hace encima, sin empezar de cero).
   «Pedirme permiso en cada paso» queda como ajuste, apagado.
   · Pasos.jsx (línea de trabajo) · Resultado.jsx (texto, Síntesis, archivos, fuentes) · iconos.jsx · agente.css (estilos).
   · Barra superior común: ../partitura/BarraSuperior (hilo del rediseño).
   El motor sigue en window.ALIAS (alias-tools.js). Textos en alias-textos.json (ES/EN). Se conservan los data-alias de las pruebas. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Pasos from './Pasos';
import Resultado, { compilar } from './Resultado';
import { Icono } from './iconos';
import BarraSuperior from '../partitura/BarraSuperior';
import './agente.css';

const LANGS = ['es', 'en'], MAX_STEPS = 7, MAX_TOTAL = 9, SEG_PASO = 25;
const K_LANG = 'synthz:alias:lang', K_HIST = 'alias:misiones', K_CADA = 'alias:cada', HIST_MAX = 20;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin guardado */ } },
};
/* manda el idioma de todo SymphorIA (synthz:lang); el de A.L.I.A.S. queda de respaldo */
function detectLang() {
  const g = store.get('synthz:lang'); if (LANGS.includes(g)) return g;
  const s = store.get(K_LANG); if (LANGS.includes(s)) return s;
  const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'es'];
  for (const l of list) { const c = String(l).slice(0, 2).toLowerCase(); if (LANGS.includes(c)) return c; }
  return 'en';
}
const fresh = () => ({
  phase: 'edit', goal: '', plan: null, status: {}, results: {}, errors: {}, skipped: {}, open: {},
  mode: 'auto', pausing: false, running: false, gateFn: null, cur: null, editing: null, busy: false, reqId: 0, histId: 0,
  log: [], fresh: {}, t0: {}, ms: {}, retried: {}, retrying: null, adjusting: null, startedAt: 0, endedAt: 0, stopped: false, showSteps: false,
});
const still = () => document.documentElement.classList.contains('noanim');
const isFinished = (S, id) => (S.status[id] || 'pending') === 'done' || !!S.skipped[id];
const readHist = () => { try { const a = JSON.parse(store.get(K_HIST)); return Array.isArray(a) ? a.filter((m) => m && m.goal) : []; } catch (e) { return []; } };
const cleanStep = (s) => ({ id: s.id, title: String(s.title || ''), tool: s.tool, input: s.input });

/* el infinito de A.L.I.A.S.: se va llenando con el avance */
const LOOP = 'M150 60 C120 12 30 12 30 60 S120 108 150 60 S270 12 270 60 S180 108 150 60z';
function Infinito({ pct }) {
  return (
    <svg className="pa-inf" viewBox="0 0 300 120" aria-hidden="true" focusable="false">
      <defs><linearGradient id="paG" x1="0" x2="1"><stop offset="0" stopColor="#3DE0FF" /><stop offset=".5" stopColor="#7B3FF2" /><stop offset="1" stopColor="#FF3D9A" /></linearGradient></defs>
      <path d={LOOP} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="8" />
      <path d={LOOP} fill="none" stroke="url(#paG)" strokeWidth="8" strokeLinecap="round" pathLength="100" strokeDasharray={pct + ' 100'} className="pa-infv" />
    </svg>
  );
}
const Avatar = ({ ok }) => (
  <span className={'pa-av' + (ok ? ' ok' : '')} aria-hidden="true"><svg viewBox="0 0 40 20"><path d="M20 10C17 5 13 3 9 3a7 7 0 000 14c4 0 8-2 11-7s7-7 11-7a7 7 0 010 14c-4 0-8-2-11-7z" fill="none" stroke="currentColor" strokeWidth="2.4" /></svg></span>
);
const TPLS = [['inv', 'search'], ['pres', 'file'], ['est', 'think'], ['cod', 'arrow']];

export default function AliasApp() {
  const [dict, setDict] = useState(null);
  const [lang, setLangS] = useState('es');
  const [, setTick] = useState(0);
  const [live, setLive] = useState('');
  const [homeMsg, setHomeMsg] = useState('');
  const [goal, setGoal] = useState('');
  const [note, setNote] = useState('');
  const [synthOn, setSynthOn] = useState(true);
  const [cada, setCada] = useState(false);
  const [hist, setHist] = useState([]);
  const [motor, setMotor] = useState(false);
  const [rutas, setRutas] = useState(null);
  const S = useRef(fresh()).current;
  const synthRef = useRef(true); synthRef.current = synthOn;
  const langRef = useRef('es');
  const runSeq = useRef(0), logSeq = useRef(0);
  const focusNext = useRef(null);
  const stepEls = useRef({});
  const goalRef = useRef(null), planTitle = useRef(null), resTitle = useRef(null), noteRef = useRef(null), endRef = useRef(null);

  const draw = useCallback(() => setTick((x) => x + 1), []);
  const t = useCallback((key, vars) => {
    const d = dict || {}; let s = d[langRef.current] && d[langRef.current][key];
    if (s == null) s = d.es && d.es[key]; if (s == null) s = key;
    if (vars) s = String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : vars[k]));
    return s;
  }, [dict, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const tRef = useRef(t); tRef.current = t;
  const tt = (k, v) => tRef.current(k, v);
  const say = useCallback((m) => { setLive(''); setTimeout(() => setLive(m), 40); }, []);
  const focusLater = (fn) => { focusNext.current = fn; };
  useEffect(() => {
    const f = focusNext.current; if (!f) return;
    focusNext.current = null;
    const tryFocus = (n) => {
      const el = f();
      if (!el || !el.focus) { if (n < 12) requestAnimationFrame(() => tryFocus(n + 1)); return; }
      el.focus({ preventScroll: true });
      const r = el.getBoundingClientRect(), H = window.innerHeight;
      if (r.top < 90 || r.bottom > H * 0.75) el.scrollIntoView({ block: 'center', behavior: still() ? 'auto' : 'smooth' });
    };
    tryFocus(0);
  });

  const saveHist = (patch) => {
    if (!S.histId) return;
    const list = readHist(), i = list.findIndex((m) => m.id === S.histId);
    const done = S.plan ? S.plan.steps.filter((s) => isFinished(S, s.id)).length : 0, total = S.plan ? S.plan.steps.length : 0;
    const row = Object.assign(i >= 0 ? list[i] : { id: S.histId, goal: S.goal }, { at: Date.now(), done, total, tools: S.plan ? S.plan.steps.map((s) => s.tool) : [] }, patch || {});
    if (i >= 0) list.splice(i, 1);
    list.unshift(row);
    const out = list.slice(0, HIST_MAX); store.set(K_HIST, JSON.stringify(out)); setHist(out);
  };

  /* ---- arranque: Ajustes de SymphorIA (animaciones, vidrio), idioma, textos y si quiere aprobar cada paso ---- */
  useEffect(() => {
    const H = document.documentElement;
    try { const c = JSON.parse(store.get('synthz:cfg')) || {}; H.classList.toggle('noanim', c.anim === false); H.classList.toggle('noglass', c.glass === false); } catch (e) { /* sin ajustes */ }
    H.dataset.scheme = 'dark';
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = '#0B0A12';
    const l = detectLang(); langRef.current = l; setLangS(l);
    setSynthOn(store.get('alias:synth') !== '0');
    const c = store.get(K_CADA) === '1'; setCada(c); S.mode = c ? 'manual' : 'auto';
    setHist(readHist());
    /* desde SynthFlow (modo Agente) llega el pedido escrito: alias.html?meta=… o #meta=… */
    try {
      const q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.slice(1));
      const g = (q.get('meta') || h.get('meta') || q.get('goal') || '').slice(0, 500); if (g) setGoal(g);
    } catch (e) { /* sin pedido */ }
    let alive = true;
    fetch('alias-textos.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch((e) => { console.error('ALIAS: no se pudo leer alias-textos.json', e); return {}; })
      .then((d) => { if (alive) { setDict(d); H.classList.add('ready'); } });
    const ok = () => { if (window.ALIAS && typeof window.ALIAS.plan === 'function') { setMotor(true); return true; } return false; };
    const iv = ok() ? 0 : setInterval(() => { if (ok()) clearInterval(iv); }, 150);
    const follow = () => { const n = detectLang(); if (n !== langRef.current) { langRef.current = n; setLangS(n); window.dispatchEvent(new CustomEvent('alias:lang', { detail: { lang: n } })); } };
    const onStore = (e) => { if (e.key === 'synthz:lang') follow(); if (e.key === K_HIST) setHist(readHist()); };
    addEventListener('storage', onStore); addEventListener('pageshow', follow);
    return () => { alive = false; clearInterval(iv); removeEventListener('storage', onStore); removeEventListener('pageshow', follow); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const H = document.documentElement; H.lang = lang;
    window.ALIAS_LANG = lang;
    window.AliasUI = Object.assign(window.AliasUI || {}, { lang });
    window.t = (k, v) => tRef.current(k, v);
    if (dict) document.title = t('titulo');
  }, [lang, dict, t]);

  /* el segundero del paso en marcha */
  useEffect(() => {
    if (S.phase !== 'running') return undefined;
    const k = setInterval(draw, 1000);
    return () => clearInterval(k);
  });

  const pickLang = (l) => {
    if (l === langRef.current) return;
    langRef.current = l; setLangS(l); store.set(K_LANG, l); store.set('synthz:lang', l);
    window.dispatchEvent(new CustomEvent('alias:lang', { detail: { lang: l } }));
  };

  /* ---- 1) pedir el plan ---- */
  const requestPlan = async (g) => {
    g = String(g || '').trim();
    if (!g) { setHomeMsg(tt('err_vacio')); focusLater(() => goalRef.current); draw(); return; }
    if (S.busy) return;
    setHomeMsg('');
    const A = window.ALIAS;
    if (!A || typeof A.plan !== 'function') { setHomeMsg(tt('err_sin_motor')); return; }
    const req = ++S.reqId;
    S.busy = true; draw(); say(tt('planeando'));
    let r;
    try { r = await A.plan(g); } catch (e) { r = { ok: false, error: tt('err_red') }; }
    if (req !== S.reqId) return;
    S.busy = false;
    if (!r || !r.ok) { setHomeMsg(r && r.limit ? tt('err_limite') : (r && r.error) || tt('err_generico')); draw(); return; }
    const raw = r.plan && Array.isArray(r.plan.steps) ? r.plan.steps : [];
    const steps = raw.slice(0, MAX_STEPS).filter((s) => s && s.id != null).map(cleanStep);
    if (!steps.length) { setHomeMsg(tt('err_plan')); draw(); return; }
    const mode = S.mode;
    Object.assign(S, fresh(), { mode, goal: r.plan.goal || g, plan: Object.assign({}, r.plan, { steps, notes: [] }), reqId: req });
    S.histId = Date.now(); saveHist({ st: 'open' }); setNote('');
    say(tt('plan_listo', { n: steps.length })); focusLater(() => document.getElementById('bRun')); draw();
    try { window.scrollTo({ top: 0 }); } catch (e) { /* nada */ }
  };

  /* ---- 2) el recorrido: corre solo; se detiene únicamente en pausa, error repetido, límite o «permiso en cada paso» ---- */
  const gate = () => new Promise((r) => { S.gateFn = r; });
  const send = (x) => { const f = S.gateFn; if (f) { S.gateFn = null; f(x); } };
  const prepRedo = (i) => { S.plan.steps.forEach((s, k) => { if (k >= i) { delete S.status[s.id]; delete S.results[s.id]; delete S.errors[s.id]; delete S.skipped[s.id]; delete S.retried[s.id]; } }); S.pausing = false; };
  const withHint = (plan, id) => { const p = JSON.parse(JSON.stringify(plan)); p.steps.forEach((s) => { if (String(s.id) === String(id)) s.input = ((s.input || '') + ' ' + tt('reintento_pista')).trim(); }); return p; };
  const stepNum = (id) => S.plan.steps.findIndex((s) => String(s.id) === String(id)) + 1;
  const planOut = () => ({ id: S.plan.id, goal: S.plan.goal, steps: S.plan.steps.map(cleanStep), notes: S.plan.notes || [] });
  const exec = async (st, hint) => {
    const A = window.ALIAS;
    if (!A || typeof A.runStep !== 'function') return { err: tt('err_sin_motor') };
    const idx = S.plan.steps.findIndex((s) => String(s.id) === String(st.id));
    const prev = S.plan.steps.slice(0, idx).map((s) => S.results[s.id]).filter(Boolean);
    let r;
    try { r = await A.runStep(hint ? withHint(planOut(), st.id) : planOut(), st.id, prev, { synth: synthRef.current !== false }); } catch (e) { return { err: tt('err_red') }; }
    if (!r || !r.ok) return { err: (r && r.error) || tt('err_generico'), limit: !!(r && r.limit) };
    const sp = r.step || {};
    if (sp.status === 'error') return { err: sp.error || tt('err_generico') };
    return { step: sp };
  };
  const finish = () => {
    S.phase = 'done'; S.cur = null; S.endedAt = Date.now(); S.summary = compilar(S); S.showSteps = false;
    saveHist({ st: 'done' }); say(tt('listo')); focusLater(() => resTitle.current); draw();
  };
  const drive = async () => {
    if (S.running) return;
    const my = ++runSeq.current, dead = () => my !== runSeq.current;
    S.running = true; S.stopped = false;
    if (!S.startedAt) S.startedAt = Date.now();
    let hint = false;
    while (!dead()) {
      if (S.adjusting) { await S.adjusting; if (dead()) return; }
      const i = S.plan.steps.findIndex((s) => !isFinished(S, s.id));
      if (i < 0) { finish(); break; }
      if (S.pausing) {
        S.pausing = false; S.phase = 'paused'; draw(); say(tt('pausado'));
        focusLater(() => document.getElementById('bResume'));
        const x = await gate(); if (dead()) return;
        if (x.a === 'redo') prepRedo(x.i);
        continue;
      }
      const st = S.plan.steps[i], n = i + 1, total = S.plan.steps.length;
      S.phase = 'running'; S.cur = st.id; S.status[st.id] = 'running'; S.t0[st.id] = Date.now(); delete S.errors[st.id];
      draw(); say(tt(n === 1 ? 'ag_empiezo' : 'ag_continuo') + ' ' + st.title);
      const out = await exec(st, hint); hint = false;
      if (dead()) return;
      if (out.limit) { S.status[st.id] = 'pending'; S.phase = 'limit'; S.cur = null; draw(); say(tt('err_limite')); break; }
      if (out.err) {
        /* primera vez: lo vuelve a intentar solo (el enrutador cambia de IA); segunda: pregunta */
        if (!S.retried[st.id]) { S.retried[st.id] = true; S.retrying = st.id; hint = true; say(tt('ag_reintento')); continue; }
        S.retrying = null;
        S.status[st.id] = 'error'; S.errors[st.id] = out.err; S.phase = 'error'; S.cur = null;
        focusLater(() => document.getElementById('bErrRetry')); draw();
        say(tt('error_n', { n, title: st.title }));
        let x = await gate(); if (dead()) return;
        if (x.a === 'stop') { S.phase = 'paused'; draw(); x = await gate(); if (dead()) return; }
        if (x.a === 'skip') S.skipped[st.id] = true;
        else if (x.a === 'retry') { hint = true; delete S.status[st.id]; }
        else if (x.a === 'redo') prepRedo(x.i);
        continue;
      }
      S.retrying = null;
      S.status[st.id] = 'done'; S.results[st.id] = out.step; S.ms[st.id] = Date.now() - S.t0[st.id]; S.cur = null;
      saveHist();
      say(tt('hecho_n', { n, total, title: st.title }));
      const more = S.plan.steps.some((s) => !isFinished(S, s.id));
      if (more && S.mode === 'manual' && !S.pausing) {
        S.awaitNext = S.plan.steps.find((s) => !isFinished(S, s.id)); S.awaitDone = n; S.phase = 'await';
        focusLater(() => document.getElementById('bApprove')); draw();
        const x = await gate(); if (dead()) return;
        if (x.a === 'redo') prepRedo(x.i);
      } else draw();
    }
    if (!dead()) S.running = false;
  };

  /* ---- 3) botones ---- */
  const approve = () => { if (!S.plan || !S.plan.steps.length) return; S.editing = null; S.startedAt = Date.now(); focusLater(() => noteRef.current); drive(); };
  const pause = () => {
    if (S.phase === 'paused') { send({ a: 'go' }); return; }
    if (S.phase === 'running' && !S.pausing) { S.pausing = true; draw(); say(tt('pausando')); }
  };
  /* Detener: no borra nada; entrega lo que alcanzó a hacer y la caja sigue abierta para pedir más */
  const stop = () => {
    if (!S.plan || S.phase === 'edit' || S.phase === 'done') return;
    runSeq.current++; S.running = false; S.pausing = false; S.gateFn = null; S.retrying = null;
    S.plan.steps.forEach((s) => { if (S.status[s.id] === 'running') delete S.status[s.id]; });
    S.stopped = true; finish();
  };
  const newMission = () => {
    runSeq.current++; send({ a: 'cancel' });
    const mode = S.mode;
    Object.assign(S, fresh(), { mode, reqId: S.reqId + 1 });
    setHomeMsg(''); setNote(''); say(tt('cancelado')); focusLater(() => goalRef.current); draw();
    try { window.scrollTo({ top: 0, behavior: still() ? 'auto' : 'smooth' }); } catch (e) { /* nada */ }
  };
  const act = (a, id, arg) => {
    const steps = S.plan.steps, i = steps.findIndex((s) => String(s.id) === String(id)), key = String(id);
    if (a === 'add') {
      if (steps.length >= MAX_TOTAL) return;
      const nid = Math.max(0, ...steps.map((s) => +s.id || 0)) + 1;
      steps.push({ id: nid, title: tt('ag_paso_nuevo'), tool: 'think', input: '' }); S.editing = nid;
    } else if (a === 'move') {
      const j = i + arg; if (i < 0 || j < 0 || j >= steps.length) return;
      [steps[i], steps[j]] = [steps[j], steps[i]];
      say(tt('movido', { title: steps[j].title, pos: j + 1 }));
      focusLater(() => { const li = stepEls.current[key]; const b = li && li.querySelector('[data-act="' + (arg < 0 ? 'up' : 'down') + '"]'); return b && !b.disabled ? b : li && li.querySelector('[data-act]'); });
    } else if (a === 'del') {
      if (steps.length <= 1 || i < 0) return;
      const [gone] = steps.splice(i, 1);
      say(tt('borrado', { title: gone.title }));
      const next = steps[Math.min(i, steps.length - 1)];
      focusLater(() => { const li = next && stepEls.current[String(next.id)]; return li && li.querySelector('[data-act="del"]'); });
    } else if (a === 'edit') {
      S.editing = steps[i].id;
    } else if (a === 'rename') {
      S.editing = null; const v = String(arg.v || '').trim().slice(0, 120);
      if (arg.save && v && steps[i] && v !== steps[i].title) { steps[i].title = v; if (!steps[i].input) steps[i].input = v; say(tt('renombrado', { title: v })); }
      focusLater(() => { const li = stepEls.current[key]; return li && li.querySelector('[data-act="ren"]'); });
    } else if (a === 'redo') {
      if (i < 0 || S.phase === 'running') return;
      if (S.running) { send({ a: 'redo', i }); return; }
      prepRedo(i); drive(); return;
    }
    draw();
  };

  /* ---- 4) escribirle mientras trabaja: se suma encima, sin pararlo (como en los proyectos de Claude) ---- */
  const steer = async (raw) => {
    const text = String(raw || '').trim().slice(0, 300);
    if (!text || !S.plan || S.adjusting) return;
    const when = S.phase === 'edit' ? 'antes' : S.phase === 'done' ? 'despues' : 'mientras';
    S.log.push({ k: 'me', text, when, id: ++logSeq.current });
    S.plan.notes = (S.plan.notes || []).concat(text).slice(-6);
    setNote('');
    const fixedIds = S.plan.steps.filter((s) => isFinished(S, s.id) || S.status[s.id] === 'running' || S.status[s.id] === 'error').map((s) => s.id);
    const A = window.ALIAS; let r = null;
    S.adjusting = (async () => { try { r = A && typeof A.adjust === 'function' ? await A.adjust(planOut(), fixedIds, text) : null; } catch (e) { r = null; } })();
    draw(); say(tt('ag_ajustando'));
    requestAnimationFrame(() => { if (endRef.current) endRef.current.scrollIntoView({ block: 'end', behavior: still() ? 'auto' : 'smooth' }); });
    await S.adjusting;
    if (r && r.ok && r.changed && Array.isArray(r.steps) && r.steps.length && S.plan) {
      const keep = S.plan.steps.filter((s) => fixedIds.includes(s.id));
      const room = MAX_TOTAL - keep.length;
      S.plan.steps.filter((s) => !fixedIds.includes(s.id)).forEach((s) => { delete S.status[s.id]; delete S.results[s.id]; delete S.errors[s.id]; delete S.skipped[s.id]; });
      const add = r.steps.slice(0, Math.max(0, room)).map(cleanStep);
      /* «NUEVO» solo en lo que de verdad cambió (los pasos que siguen igual cambian de id, no de nombre) */
      const before = new Set(S.plan.steps.map((s) => s.title.trim().toLowerCase()));
      if (S.phase !== 'edit') add.forEach((s) => { if (!before.has(s.title.trim().toLowerCase())) S.fresh[s.id] = true; });
      S.plan.steps = keep.concat(add);
    }
    S.adjusting = null;
    const reply = r && r.ok ? (r.reply || tt('srv.notaAnotada')) : r && r.limit ? tt('err_limite') : tt('ag_nota_err');
    S.log.push({ k: 'al', text: reply, ok: !!(r && r.ok), id: ++logSeq.current });
    say(reply);
    if (S.phase === 'done' && S.plan && S.plan.steps.some((s) => !isFinished(S, s.id))) { S.summary = null; S.endedAt = 0; S.stopped = false; drive(); }
    saveHist(); draw();
  };

  const pickTpl = (k) => {
    const v = tt('tpl_' + k + '_g'); setGoal(v); setHomeMsg('');
    focusLater(() => { const inp = goalRef.current; if (inp) { const a = v.indexOf('['), z = v.indexOf(']'); setTimeout(() => { if (a >= 0 && z > a) inp.setSelectionRange(a, z + 1); }, 0); } return inp; });
    draw();
  };
  const loadRutas = (open) => {
    if (!open || !motor || (rutas && rutas.ok)) return;
    setRutas({ loading: true });
    Promise.resolve(window.ALIAS && window.ALIAS.routes ? window.ALIAS.routes() : { ok: false })
      .then((r) => setRutas(r && r.ok ? r : { ok: false }), () => setRutas({ ok: false }));
  };

  /* Esc pausa (o sigue) mientras trabaja */
  useEffect(() => {
    const key = (e) => {
      if (e.key !== 'Escape' || !S.plan) return;
      if (S.phase === 'running' || S.phase === 'paused') { e.preventDefault(); pause(); }
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  });

  const p = S.phase, ready = !!dict;
  const steps = S.plan ? S.plan.steps : [];
  const done = steps.filter((s) => isFinished(S, s.id)).length, total = steps.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const left = Math.max(1, Math.ceil(((total - done) * SEG_PASO) / 60));
  const errStep = p === 'error' ? steps.find((s) => S.status[s.id] === 'error') : null;
  const curIdx = steps.findIndex((s) => !isFinished(S, s.id));
  const results = steps.map((s) => S.results[s.id]).filter(Boolean);
  const sourcesN = new Set(results.flatMap((r) => (Array.isArray(r.sources) ? r.sources.map((x) => x && x.url) : [])).filter(Boolean)).size;
  const files = results.map((r) => r.file).filter((f) => f && f.name);
  const team = [...new Set(results.flatMap((r) => (r.route ? (r.route.why === 'synth' && r.route.voices && r.route.voices.length ? r.route.voices : [r.route.name]) : [])).filter(Boolean))];
  const lastDone = steps.filter((s) => S.status[s.id] === 'done').slice(-3).reverse();
  const elapsed = S.startedAt && S.endedAt ? Math.round((S.endedAt - S.startedAt) / 1000) : 0;
  const fmtTime = (sec) => (sec >= 60 ? Math.floor(sec / 60) + ' min ' + (sec % 60) + ' s' : sec + ' s');
  const sayKey = { edit: 'ag_say_edit', running: 'ag_say_run', await: 'ag_say_await', paused: 'ag_say_paused', error: 'ag_say_error', limit: 'ag_say_limit', done: 'ag_say_run' }[p];
  const ph = p === 'edit' ? 'ag_ph_edit' : p === 'done' ? 'ag_ph_done' : 'ag_ph_run';
  const hint = p === 'edit' ? 'ag_hint_edit' : p === 'done' ? 'ag_hint_done' : 'ag_hint_run';
  const canPause = p === 'running' || p === 'paused';
  const rtf = useMemo(() => { try { return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }); } catch (e) { return null; } }, [lang]);
  const ago = (ms) => {
    const s = Math.round((ms - Date.now()) / 1000), A = Math.abs(s);
    if (!rtf) return new Date(ms).toLocaleString(lang);
    return A < 60 ? rtf.format(0, 'second') : A < 3600 ? rtf.format(Math.round(s / 60), 'minute') : A < 86400 ? rtf.format(Math.round(s / 3600), 'hour') : rtf.format(Math.round(s / 86400), 'day');
  };
  const langBtns = (
    <div className="lang pa-lang" role="group" aria-label={t('idioma')}>
      {LANGS.map((l) => <button key={l} type="button" className={lang === l ? 'on' : undefined} data-alias={'lang-' + l} lang={l} aria-pressed={lang === l} aria-label={t('idioma_' + l)} onClick={() => pickLang(l)}>{l.toUpperCase()}</button>)}
    </div>
  );

  return (
    <div className={'pa alias-react' + (S.plan ? ' has-plan' : ' is-home')} data-react="alias">
      <a className="skip" href="#main">{t('saltar')}</a>
      <div id="aliasLive" className="sr-only" role="status" aria-live="polite" aria-atomic="true">{live}</div>
      <BarraSuperior producto="alias" idioma={lang} onIdioma={pickLang} />

      {S.plan ? (
        <div className="pa-strip" aria-hidden={p === 'edit' ? 'true' : undefined}>
          <span>{p === 'done' ? t('ag_listo_de', { n: done, total }) : p === 'edit' ? t('ag_espera') : t('ag_paso_de', { n: Math.min(curIdx < 0 ? total : curIdx + 1, total), total })}</span>
          <span className="pa-bar"><i style={{ width: pct + '%' }} /></span>
          {canPause ? <button type="button" className="icon-btn" onClick={pause} aria-label={t(p === 'paused' ? 'ag_seguir' : 'ag_pausar')}><Icono n={p === 'paused' ? 'right' : 'pause'} /></button> : null}
        </div>
      ) : null}

      <main id="main" tabIndex={-1} className="pa-room">
        {!S.plan ? (
          /* ---------------- inicio ---------------- */
          <section id="vHome" className="pa-home" aria-labelledby="homeTitle">
            <svg className="pa-loop" viewBox="0 0 200 90" aria-hidden="true"><defs><linearGradient id="paL" x1="0" x2="1"><stop offset="0" stopColor="#3DE0FF" /><stop offset=".45" stopColor="#7B3FF2" /><stop offset=".75" stopColor="#FF3D9A" /><stop offset="1" stopColor="#FF7A45" /></linearGradient></defs><path d="M100 45 C80 10 20 10 20 45 S80 80 100 45 S180 10 180 45 S120 80 100 45z" fill="none" stroke="url(#paL)" strokeWidth="7" strokeLinecap="round" /><circle r="6" fill="#fff"><animateMotion dur="5s" repeatCount="indefinite" path="M100 45 C80 10 20 10 20 45 S80 80 100 45 S180 10 180 45 S120 80 100 45z" /></circle></svg>
            <p className="mono">{t('ag_eyebrow')}</p>
            <h1 id="homeTitle">{t('ag_t1')} <span className="grad-text">{t('ag_t2')}</span></h1>
            <p className="pa-lead">{t('ag_sub')}</p>

            <form id="goalForm" className="pa-goal" noValidate aria-busy={S.busy} onSubmit={(e) => { e.preventDefault(); requestPlan(goal); }}>
              <label htmlFor="goalInput" className="sr-only">{t('goal_label')}</label>
              <textarea id="goalInput" ref={goalRef} data-alias="goal" rows={2} maxLength={500} autoComplete="off" placeholder={ready ? t('goal_ph') : ''} value={goal}
                onChange={(e) => { setGoal(e.target.value); setHomeMsg(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); requestPlan(e.currentTarget.value); } }} />
              <button className="btn btn-v" id="goBtn" data-alias="plan-submit" type="submit" disabled={S.busy}>{t(S.busy ? 'planeando' : 'goal_btn')} <Icono n="right" /></button>
            </form>
            {homeMsg ? <p id="homeMsg" className="msg" role="alert">{homeMsg}</p> : null}
            {S.busy ? <div className="pa-tuning" aria-hidden="true"><i /><i /><i /><i /><i /></div> : null}

            <div className="pa-ideas" id="tplList" aria-label={t('ag_ideas')}>
              {TPLS.map(([k, ic]) => (
                <button key={k} type="button" className="chip" data-tpl={k} onClick={() => pickTpl(k)}><Icono n={ic} /> {t('tpl_' + k + '_t')}</button>
              ))}
            </div>

            <div className="pa-homegrid">
              <section className="card pa-recent" aria-labelledby="recTitle" data-clarity-mask="true">
                <h2 id="recTitle">{t('ag_recientes')}</h2>
                <p className="pa-small">{t('ag_recientes_d')}</p>
                {hist.length ? (
                  <ul>{hist.slice(0, 5).map((m) => (
                    <li key={m.id}><button type="button" onClick={() => { setGoal(m.goal); focusLater(() => goalRef.current); draw(); }} aria-label={t('h_retomar', { goal: m.goal })}>
                      <b>{m.goal}</b><small>{t('h_pasos', { done: Math.min(m.done || 0, m.total || 0), total: m.total || 0 })} · {ago(m.at)}</small>
                    </button></li>
                  ))}</ul>
                ) : <p className="pa-empty">{t('rec_vacio')}</p>}
                {hist.length ? <button type="button" className="pa-link" onClick={() => { if (window.confirm(t('hist_borrar_q'))) { store.set(K_HIST, '[]'); setHist([]); } }}>{t('ag_borrar_hist')}</button> : null}
              </section>
              <details className="card pa-rutas" data-alias="routes" onToggle={(e) => loadRutas(e.currentTarget.open)}>
                <summary><h2>{t('ag_rutas_t')}</h2><p className="pa-small">{t('rt_intro')}</p></summary>
                {!rutas || rutas.loading ? <p className="pa-empty">{t(motor ? 'rt_cargando' : 'ag_motor_carga')}</p>
                  : !rutas.ok ? <p className="pa-empty">{t('rt_error')}</p> : (
                    <div className="pa-lgrid">
                      {['code', 'write', 'reason', 'summary', 'translate', 'data', 'plan'].map((c) => {
                        const rows = (rutas.cats && rutas.cats[c]) || [];
                        return (<div key={c}><b>{t('rt_cat_' + c)}</b>{rows.length ? <ol>{rows.slice(0, 3).map((x) => <li key={x.id}>{x.name} <small>{Math.round(x.rate * 100)}%</small></li>)}</ol> : <small className="pa-empty">{t('rt_sin_tipo')}</small>}</div>);
                      })}
                    </div>
                  )}
              </details>
            </div>
            <p className="pa-note">{t('home_nota')}</p>
          </section>
        ) : (
          /* ---------------- la misión: conversación con el agente ---------------- */
          <div className="pa-mission">
            <section className="pa-feed" aria-labelledby="planTitle" data-clarity-mask="true">
              <div className="pa-me"><small>{t('ag_tu')}</small><span id="planGoal">{S.goal}</span></div>

              <div className="pa-al">
                <Avatar ok={p === 'done'} />
                <div className="pa-alb">
                  <p className="pa-say">{t(sayKey)}{p === 'edit' ? ' ' : ''}{p === 'edit' ? <span className="pa-mut">{t('ag_estimado', { n: Math.max(1, Math.ceil((total * SEG_PASO) / 60)) })}</span> : null}</p>
                  <div id="vPlan" data-clarity-mask="true" className="card pa-plan" data-alias="plan" data-state={p}>
                    <div className="pa-phd">
                      <h1 id="planTitle" className="h-plan" tabIndex={-1} ref={planTitle}>{t('ag_plan_n', { n: total })}</h1>
                      <span className="grow" />
                      <span className={'tag' + (p === 'edit' ? '' : ' ok')}>{t(p === 'edit' ? 'ag_tag_edit' : 'ag_tag_ok')}</span>
                    </div>
                    {p === 'done' && !S.showSteps ? (
                      <div className="pa-sum">
                        <span className="sdot ok" aria-hidden="true"><Icono n="check" /></span>
                        <div>
                          <b>{t('ag_resumen', { n: done, time: fmtTime(elapsed) })}</b>
                          <small>{team.length ? t('ag_trabajaron', { names: team.join(', ') }) + ' · ' : ''}<button type="button" className="pa-link" onClick={() => { S.showSteps = true; draw(); }}>{t('ag_ver_pasos')}</button></small>
                        </div>
                      </div>
                    ) : <Pasos S={S} t={t} act={act} focusRef={stepEls} />}
                    {p === 'done' && S.showSteps ? <button type="button" className="pa-link pa-hide" onClick={() => { S.showSteps = false; draw(); }}>{t('ag_ocultar_pasos')}</button> : null}

                    {p === 'edit' ? (
                      <div className="pa-go">
                        <button type="button" className="btn btn-v" id="bRun" data-alias="run" disabled={!total || !!S.adjusting} onClick={approve}>{t('ag_aprobar')} <Icono n="right" /></button>
                        <span className="pa-small">{t('ag_aprobar_nota')}</span>
                      </div>
                    ) : null}
                    {p === 'await' && S.awaitNext ? (
                      <div className="pa-go">
                        <p id="ctlMsg" className="pa-small">{t('aprobar_q', { n: S.awaitDone, m: stepNum(S.awaitNext.id), title: S.awaitNext.title })}</p>
                        <button type="button" className="btn btn-v" id="bApprove" data-alias="run" onClick={() => send({ a: 'go' })}>{t('btn_aprobar')} <Icono n="right" /></button>
                      </div>
                    ) : null}
                    {p === 'paused' ? (
                      <div className="pa-go">
                        <button type="button" className="btn btn-v" id="bResume" data-alias="run" onClick={() => send({ a: 'go' })}>{t('ag_seguir')} <Icono n="right" /></button>
                        <span className="pa-small">{t('pausado')}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {S.log.map((m) => (m.k === 'me'
                ? <div className="pa-me" key={m.id}><small>{t(m.when === 'antes' ? 'ag_tu_antes' : m.when === 'despues' ? 'ag_tu_despues' : 'ag_tu_mientras')}</small><span>{m.text}</span></div>
                : <div className={'pa-ack' + (m.ok ? '' : ' warn')} key={m.id} role="status"><Icono n={m.ok ? 'check' : 'route'} /><span>{m.text}</span></div>))}
              {S.adjusting ? <div className="pa-ack wait"><span className="pa-spin" aria-hidden="true" /><span>{t('ag_ajustando')}</span></div> : null}

              {/* siempre montado (oculto) para que el aviso aparezca en el mismo lugar apenas falla un paso */}
              <div id="errBox" className="card pa-err" role={p === 'error' ? 'alert' : undefined} tabIndex={-1} hidden={p !== 'error'}>
                <h3>{t('err_titulo')}</h3>
                <p id="errStep" className="pa-small">{errStep ? t('paso_n', { n: stepNum(errStep.id) }) + ' · ' + errStep.title : ''}</p>
                <p id="errMsg" data-alias="error">{errStep ? S.errors[errStep.id] || '' : ''}</p>
                <div className="pa-btns" data-alias="decisions">
                  <button type="button" className="btn btn-w btn-s" id="bErrRetry" onClick={() => send({ a: 'retry' })}>{t('err_otra')}</button>
                  <button type="button" className="btn btn-s" id="bErrSkip" onClick={() => send({ a: 'skip' })}>{t('err_seguir')}</button>
                  <button type="button" className="btn btn-s" id="bErrStop" onClick={() => send({ a: 'stop' })}>{t('err_parar')}</button>
                </div>
              </div>
              {p === 'limit' ? (
                <div id="limitBox" className="card pa-err" role="alert">
                  <h3>{t('err_limite')}</h3><p>{t('err_limite_d')}</p>
                  <div className="pa-btns"><button type="button" className="btn btn-s" id="bLimitBack" onClick={newMission}>{t('res_nuevo')}</button></div>
                </div>
              ) : null}

              {p === 'done' && S.summary ? (
                <div className="pa-al">
                  <Avatar ok />
                  <div className="pa-alb">
                    <p className="pa-say">{t(S.stopped ? 'ag_detenido' : 'ag_say_done')}</p>
                    <Resultado S={S} t={t} say={say} onNew={newMission} titleRef={resTitle} animar={!still()} />
                  </div>
                </div>
              ) : null}
              <div ref={endRef} />
            </section>

            <aside className="pa-side" aria-label={t('ag_avance')}>
              <div className="card pa-prog">
                <p className="mono">{t('ag_avance')}</p>
                <div className="pa-big"><strong>{pct}%</strong><span>{p === 'edit' ? t('ag_espera') : p === 'done' ? t('ag_avance_de', { n: done, total }) : t('ag_avance_de', { n: done, total }) + ' · ' + t('ag_faltan', { n: left })}</span></div>
                <div className="pa-bar"><i style={{ width: pct + '%' }} /></div>
                <progress id="progress" className="sr-only" max={total} value={done} aria-label={t('progreso_n', { n: done, total })} />
                <Infinito pct={pct} />
              </div>
              {p !== 'edit' ? (
                <div className="card pa-outs">
                  <h2 className="mono">{t('ag_salidas')}</h2>
                  {!sourcesN && !files.length && !lastDone.length ? <p className="pa-empty">{t('ag_salidas_vacio')}</p> : null}
                  {sourcesN ? <p><span className="pa-oi"><Icono n="search" /></span>{sourcesN === 1 ? t('ag_fuente_1') : t('ag_fuentes_n', { n: sourcesN })}</p> : null}
                  {files.map((f, i) => <p key={i}><span className="pa-oi"><Icono n="file" /></span>{f.name}</p>)}
                  {lastDone.map((s) => <p key={s.id}><span className="pa-oi"><Icono n="check" /></span><span className="pa-ot">{s.title}</span><small>{t('ag_paso_listo', { n: stepNum(s.id) })}</small></p>)}
                </div>
              ) : null}
              {team.length ? (
                <div className="card pa-team">
                  <h2 className="mono">{t('ag_equipo')}</h2>
                  <div className="pa-chips">{team.map((n) => <span className="chip" key={n}>{n}</span>)}</div>
                  <p className="pa-small">{t('ag_equipo_d')}</p>
                </div>
              ) : null}
              <div className="card pa-set">
                <h2 className="mono">{t('ag_ajustes')}</h2>
                <label className="pa-tog"><input type="checkbox" id="cadaOn" checked={cada} onChange={(e) => { const v = e.target.checked; setCada(v); store.set(K_CADA, v ? '1' : '0'); S.mode = v ? 'manual' : 'auto'; if (!v && S.phase === 'await') send({ a: 'go' }); }} /><span><b>{t('ag_cada')}</b><small>{t('ag_cada_d')}</small></span></label>
                <label className="pa-tog"><input type="checkbox" id="synthOn" checked={synthOn} onChange={(e) => { setSynthOn(e.target.checked); store.set('alias:synth', e.target.checked ? '1' : '0'); }} /><span><b>{t('syn_tog')}</b><small>{t('syn_tog_d')}</small></span></label>
                {langBtns}
                <button type="button" className="btn btn-s pa-newbtn" onClick={() => { if (p === 'running' || p === 'paused' || p === 'await' || p === 'error') { if (!window.confirm(t('confirm_cancel'))) return; } newMission(); }}><Icono n="plus" /> {t('ag_nueva')}</button>
              </div>
            </aside>
          </div>
        )}
        {!S.plan ? <div className="pa-homelang">{langBtns}</div> : null}
      </main>

      {S.plan ? (
        <div className="pa-dock">
          <div className="pa-dockin" data-clarity-mask="true">
            <form className="pa-comp" onSubmit={(e) => { e.preventDefault(); steer(note); }}>
              <label htmlFor="noteInput" className="sr-only">{t('ag_escribe')}</label>
              <textarea id="noteInput" ref={noteRef} data-alias="steer" rows={1} maxLength={300} value={note} placeholder={ready ? t(ph) : ''}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); steer(e.currentTarget.value); } }} />
              {canPause ? <button type="button" className="pa-ib" id="bPause" data-alias="pause" aria-pressed={p === 'paused'} data-state={p === 'paused' ? 'paused' : undefined} aria-label={t(p === 'paused' ? 'ag_seguir' : 'ag_pausar')} title={t(p === 'paused' ? 'ag_seguir' : 'ag_pausar')} onClick={pause}><Icono n={p === 'paused' ? 'right' : 'pause'} /></button> : null}
              {p !== 'edit' && p !== 'done' ? <button type="button" className="pa-ib" id="bCancel" aria-label={t('ag_detener')} title={t('ag_detener')} onClick={stop}><Icono n="stop" /></button> : null}
              <button type="submit" className="pa-ib send" aria-label={t('ag_enviar')} title={t('ag_enviar')} disabled={!note.trim() || !!S.adjusting}><Icono n="up" /></button>
            </form>
            <p className="pa-hint">{t(hint)}</p>
          </div>
        </div>
      ) : null}

      <nav className="tabbar pa-tabbar" aria-label="SymphorIA">
        <a href="/"><Icono n="home" /><span>{t('ag_tab_inicio')}</span></a>
        <a href="/chat.html"><Icono n="chat" /><span>SynthFlow</span></a>
        <a className="on" href="/alias.html" aria-current="page"><Icono n="loop" /><span>A.L.I.A.S.</span></a>
        <a href="/chat.html#cuenta"><Icono n="person" /><span>{t('ag_tab_yo')}</span></a>
      </nav>
    </div>
  );
}
