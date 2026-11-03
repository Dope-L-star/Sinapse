'use client';
/* ===== A.L.I.A.S. en React (v3.9 · diseño «Mission workspace» de Sammuel) =====
   Antes (v3.8): la misma pantalla de alias.html pasada a React. Ahora: el diseño que mandó Sammuel
   (ALIAS_VISUAL_CONCEPT): barra lateral, misión central, rutas rápidas, misiones recientes, agentes y la
   orquesta del plan. Solo oscuro (Sammuel: «sin el tema claro»).
   · AliasApp (este archivo): idioma, vistas, barra lateral, plan, controles y el recorrido paso a paso.
   · Pasos.jsx (lista editable) · Resultado.jsx (texto final, Síntesis, archivos, fuentes) · iconos.jsx.
   · Estilos: alias.css (base de siempre) + alias-mision.css (el diseño nuevo, todo bajo .am).
   El motor no cambia: window.ALIAS (alias-tools.js) pide el plan y corre cada paso en el servidor.
   Lo del prototipo que era de mentira (porcentajes, misiones inventadas, «Fuentes»/«Archivos» vacíos) no se copió:
   las misiones recientes son las tuyas (solo en este navegador) y los agentes son las herramientas reales del motor.
   Los textos siguen en alias-textos.json (ES/EN) y siguen el idioma de todo SymphorIA al instante.
   Se conservan los IDs y los data-alias: las pruebas (t/alias/ui.mjs) manejan la página por ellos. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Pasos, { porQue } from './Pasos';
import Resultado, { compilar } from './Resultado';
import { Icono } from './iconos';

const LANGS = ['es', 'en'], MAX_STEPS = 7;
const K_LANG = 'synthz:alias:lang', K_HIST = 'alias:misiones', HIST_MAX = 20;
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
  mode: 'manual', pausing: false, cancelled: false, running: false, gateFn: null, cur: null, editing: null, busy: false, reqId: 0, histId: 0,
});
const still = () => document.documentElement.classList.contains('noanim');
const isFinished = (S, id) => (S.status[id] || 'pending') === 'done' || !!S.skipped[id];

/* ---- misiones recientes: solo en este navegador (objetivo, pasos hechos, estado) ---- */
const readHist = () => { try { const a = JSON.parse(store.get(K_HIST)); return Array.isArray(a) ? a.filter((m) => m && m.goal) : []; } catch (e) { return []; } };

/* ---- fondo del diseño: halos dorado, vino y violeta con anillos (quietos si las animaciones están apagadas) ---- */
function Fondo() {
  return <div className="am-ambient" aria-hidden="true"><i /><b /><span /></div>;
}

const LOOP = 'M22 15C18 9 13 6 8 6a9 9 0 0 0 0 18c5 0 10-3 14-9s9-9 14-9a9 9 0 0 1 0 18c-5 0-10-3-14-9z';
function Marca({ cls, vb, sw, nodes, trav }) {
  return (
    <svg className={cls} viewBox={vb} aria-hidden="true" focusable="false">
      <path className="lp" d={LOOP} fill="none" stroke="url(#alG)" strokeWidth={sw} />
      <g className="nd">{nodes.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}</g>
      {trav.map(([r, dur, begin, c, fill], i) => <circle key={i} className={c} r={r} fill={fill}><animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={LOOP} /></circle>)}
    </svg>
  );
}
const NODES = (a, b) => [[8, 6, a], [-1, 15, a], [8, 24, a], [22, 15, b], [36, 6, a], [45, 15, a], [36, 24, a]];
/* rutas rápidas: las 4 plantillas de siempre, con el color del diseño */
const TPLS = [['inv', 'search', 'gold'], ['pres', 'file', 'pink'], ['est', 'think', 'violet'], ['cod', 'arrow', 'cyan']];
/* agentes = herramientas reales del motor, en el orden en que suelen trabajar */
const AGENTS = [['search', 'gold'], ['memory', 'cyan'], ['think', 'violet'], ['image', 'pink'], ['file', 'green']];
const AG_COLOR = Object.fromEntries(AGENTS);

function Pill({ kind, children }) { return <span className={'am-pill ' + kind}><i />{children}</span>; }

export default function AliasApp() {
  const [dict, setDict] = useState(null);
  const [lang, setLangS] = useState('es');
  const [, setTick] = useState(0);
  const [live, setLive] = useState('');
  const [homeMsg, setHomeMsg] = useState('');
  const [goal, setGoal] = useState('');
  const [synthOn, setSynthOn] = useState(true);
  const [view, setView] = useState('main');          /* main = inicio o misión actual · missions · agents */
  const [navOpen, setNavOpen] = useState(false);
  const [hist, setHist] = useState([]);
  const [q, setQ] = useState('');
  const [motor, setMotor] = useState(false);
  const [rutas, setRutas] = useState(null);   /* lo que el enrutador ha aprendido (vista Agentes) */
  const S = useRef(fresh()).current;
  const synthRef = useRef(true); synthRef.current = synthOn;
  const langRef = useRef('es');
  const runSeq = useRef(0);
  const focusNext = useRef(null);
  const stepEls = useRef({});
  const goalRef = useRef(null), planTitle = useRef(null), resTitle = useRef(null), mainRef = useRef(null);

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
  /* el foco va al botón que toca ahora; si quedaría bajo el blurry de arriba o de abajo, se centra en pantalla.
     A veces el botón llega un cuadro después (el motor responde en medio de otra actualización): se reintenta unos cuadros. */
  useEffect(() => {
    const f = focusNext.current; if (!f) return;
    focusNext.current = null;
    const tryFocus = (n) => {
      const el = f();
      if (!el || !el.focus) { if (n < 12) requestAnimationFrame(() => tryFocus(n + 1)); return; }
      el.focus({ preventScroll: true });
      const r = el.getBoundingClientRect(), H = window.innerHeight;
      if (r.top < 90 || r.bottom > H * 0.8) el.scrollIntoView({ block: 'center', behavior: still() ? 'auto' : 'smooth' });
    };
    tryFocus(0);
  });

  /* guarda o actualiza la misión actual en el historial de este navegador */
  const saveHist = (patch) => {
    if (!S.histId) return;
    const list = readHist(), i = list.findIndex((m) => m.id === S.histId);
    const done = S.plan ? S.plan.steps.filter((s) => isFinished(S, s.id)).length : 0, total = S.plan ? S.plan.steps.length : 0;
    const row = Object.assign(i >= 0 ? list[i] : { id: S.histId, goal: S.goal }, { at: Date.now(), done, total, tools: S.plan ? S.plan.steps.map((s) => s.tool) : [] }, patch || {});
    if (i >= 0) list.splice(i, 1);
    list.unshift(row);
    const out = list.slice(0, HIST_MAX); store.set(K_HIST, JSON.stringify(out)); setHist(out);
  };

  /* ---- arranque: Ajustes de SymphorIA (animaciones, vidrio), idioma y textos. Solo tema oscuro. ---- */
  useEffect(() => {
    const H = document.documentElement;
    try { const c = JSON.parse(store.get('synthz:cfg')) || {}; H.classList.toggle('noanim', c.anim === false); H.classList.toggle('noglass', c.glass === false); } catch (e) { /* sin ajustes */ }
    H.dataset.scheme = 'dark';
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = '#0b0c10';
    const l = detectLang(); langRef.current = l; setLangS(l);
    try { setSynthOn(store.get('alias:synth') !== '0'); } catch (e) { /* encendida */ }
    setHist(readHist());
    let alive = true;
    fetch('alias-textos.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch((e) => { console.error('ALIAS: no se pudo leer alias-textos.json', e); return {}; })
      .then((d) => { if (alive) { setDict(d); H.classList.add('ready'); } });
    /* el motor (alias-tools.js) llega aparte: el punto verde de arriba dice cuándo está listo */
    const ok = () => { if (window.ALIAS && typeof window.ALIAS.plan === 'function') { setMotor(true); return true; } return false; };
    const iv = ok() ? 0 : setInterval(() => { if (ok()) clearInterval(iv); }, 150);
    /* si cambias el idioma en otra pestaña de SymphorIA, A.L.I.A.S. cambia al instante */
    const follow = () => { const n = detectLang(); if (n !== langRef.current) { langRef.current = n; setLangS(n); window.dispatchEvent(new CustomEvent('alias:lang', { detail: { lang: n } })); } };
    const onStore = (e) => { if (e.key === 'synthz:lang') follow(); if (e.key === K_HIST) setHist(readHist()); };
    addEventListener('storage', onStore); addEventListener('pageshow', follow);
    return () => { alive = false; clearInterval(iv); removeEventListener('storage', onStore); removeEventListener('pageshow', follow); };
  }, []);

  /* el motor (alias-tools.js) y el resto de SymphorIA leen el idioma de aquí */
  useEffect(() => {
    const H = document.documentElement; H.lang = lang;
    window.ALIAS_LANG = lang;
    window.AliasUI = Object.assign(window.AliasUI || {}, { lang });
    window.t = (k, v) => tRef.current(k, v);
    if (dict) document.title = t('titulo');
  }, [lang, dict, t]);

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
    const steps = raw.slice(0, MAX_STEPS).filter((s) => s && s.id != null).map((s) => ({ id: s.id, title: String(s.title || ''), tool: s.tool, input: s.input }));
    if (!steps.length) { setHomeMsg(tt('err_plan')); draw(); return; }
    const mode = S.mode;
    Object.assign(S, fresh(), { mode, goal: r.plan.goal || g, plan: Object.assign({}, r.plan, { steps }), reqId: req });
    S.histId = Date.now(); saveHist({ st: 'open' }); setView('main');
    say(tt('plan_listo', { n: steps.length })); focusLater(() => planTitle.current); draw();
  };

  /* ---- 2) puerta de espera (aprobar / pausa / error) y el recorrido ---- */
  const gate = () => new Promise((r) => { S.gateFn = r; });
  const send = (x) => { const f = S.gateFn; if (f) { S.gateFn = null; f(x); } };
  const prepRedo = (i) => { S.plan.steps.forEach((s, k) => { if (k >= i) { delete S.status[s.id]; delete S.results[s.id]; delete S.errors[s.id]; delete S.skipped[s.id]; } }); S.pausing = false; };
  const withHint = (plan, id) => { const p = JSON.parse(JSON.stringify(plan)); p.steps.forEach((s) => { if (String(s.id) === String(id)) s.input = ((s.input || '') + ' ' + tt('reintento_pista')).trim(); }); return p; };
  const stepNum = (id) => S.plan.steps.findIndex((s) => String(s.id) === String(id)) + 1;
  const exec = async (st, hint) => {
    const A = window.ALIAS;
    if (!A || typeof A.runStep !== 'function') return { err: tt('err_sin_motor') };
    const idx = S.plan.steps.findIndex((s) => String(s.id) === String(st.id));
    const prev = S.plan.steps.slice(0, idx).map((s) => S.results[s.id]).filter(Boolean);
    let r;
    try { r = await A.runStep(hint ? withHint(S.plan, st.id) : S.plan, st.id, prev, { synth: synthRef.current !== false }); } catch (e) { return { err: tt('err_red') }; }
    if (!r || !r.ok) return { err: (r && r.error) || tt('err_generico'), limit: !!(r && r.limit) };
    const sp = r.step || {};
    if (sp.status === 'error') return { err: sp.error || tt('err_generico') };
    return { step: sp };
  };
  const finish = () => { S.phase = 'done'; S.cur = null; S.summary = compilar(S); saveHist({ st: 'done' }); say(tt('listo')); focusLater(() => resTitle.current); draw(); };
  const drive = async () => {
    if (S.running) return;
    const my = ++runSeq.current, dead = () => my !== runSeq.current;   /* cancelar sube runSeq: este ciclo termina solo */
    S.running = true; S.cancelled = false;
    let hint = false;
    while (!dead()) {
      const i = S.plan.steps.findIndex((s) => !isFinished(S, s.id));
      if (i < 0) { finish(); break; }
      if (S.pausing) {
        S.pausing = false; S.phase = 'paused'; draw(); say(tt('pausado'));
        const x = await gate(); if (dead()) return;
        if (x.a === 'redo') prepRedo(x.i);
        continue;
      }
      const st = S.plan.steps[i], n = i + 1, total = S.plan.steps.length;
      S.phase = 'running'; S.cur = st.id; S.status[st.id] = 'running'; delete S.errors[st.id];
      draw(); say(tt('en_curso', { n, total, title: st.title }));
      const out = await exec(st, hint); hint = false;
      if (dead()) return;
      if (out.limit) { S.status[st.id] = 'pending'; S.phase = 'limit'; draw(); say(tt('err_limite')); break; }
      if (out.err) {
        S.status[st.id] = 'error'; S.errors[st.id] = out.err; S.phase = 'error';
        focusLater(() => document.getElementById('bErrRetry')); draw();
        say(tt('error_n', { n, title: st.title }));
        let x = await gate(); if (dead()) return;
        if (x.a === 'stop') { S.phase = 'paused'; draw(); x = await gate(); if (dead()) return; }
        if (x.a === 'skip') S.skipped[st.id] = true;
        else if (x.a === 'retry') { hint = true; delete S.status[st.id]; }
        else if (x.a === 'redo') prepRedo(x.i);
        continue;
      }
      S.status[st.id] = 'done'; S.results[st.id] = out.step; S.cur = null;
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
  const cancelAll = (ask) => {
    if (ask && S.phase !== 'edit' && !window.confirm(tt('confirm_cancel'))) return false;
    runSeq.current++; send({ a: 'cancel' });
    const mode = S.mode;
    Object.assign(S, fresh(), { mode, reqId: S.reqId + 1 });
    setHomeMsg(''); say(tt('cancelado')); focusLater(() => goalRef.current); draw();
    return true;
  };
  const act = (a, id, arg) => {
    const steps = S.plan.steps, i = steps.findIndex((s) => String(s.id) === String(id)), key = String(id);
    if (a === 'move') {
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
      if (arg.save && v && steps[i] && v !== steps[i].title) { steps[i].title = v; say(tt('renombrado', { title: v })); }
      focusLater(() => { const li = stepEls.current[key]; return li && li.querySelector('[data-act="ren"]'); });
    } else if (a === 'redo') {
      if (i < 0 || S.phase === 'running') return;
      if (S.running) { send({ a: 'redo', i }); return; }
      prepRedo(i); drive(); return;
    }
    draw();
  };


  const pickTpl = (k) => {
    const v = tt('tpl_' + k + '_g'); setGoal(v); setHomeMsg('');
    focusLater(() => { const inp = goalRef.current; if (inp) { const a = v.indexOf('['), z = v.indexOf(']'); setTimeout(() => { if (a >= 0 && z > a) inp.setSelectionRange(a, z + 1); }, 0); } return inp; });
    draw();
  };

  /* ---- 4) vistas de la barra lateral ---- */
  const toTop = () => { try { window.scrollTo({ top: 0, behavior: still() ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, 0); } };
  /* salir de la misión actual (si está corriendo, pregunta antes) */
  const leavePlan = () => !S.plan || cancelAll(S.phase !== 'edit' && S.phase !== 'done' && S.phase !== 'limit');
  const go = (v) => {
    setNavOpen(false);
    if (v === 'new') {
      if (!leavePlan()) return;
      setView('main'); focusLater(() => goalRef.current); toTop(); return;
    }
    setView(v); toTop();
    if (v === 'main' && S.plan) focusLater(() => planTitle.current);
    else focusLater(() => mainRef.current);
  };
  const reuse = (m) => {
    if (!leavePlan()) return;
    setView('main'); setGoal(m.goal); setHomeMsg(''); setNavOpen(false);
    focusLater(() => goalRef.current); toTop();
  };
  /* v3.9 · al abrir Agentes se pide lo que el enrutador ha aprendido (qué IA va mejor para cada tipo de trabajo) */
  useEffect(() => {
    if (view !== 'agents' || !motor) return undefined;
    let alive = true; setRutas((r) => (r && r.ok ? r : { loading: true }));
    Promise.resolve(window.ALIAS && window.ALIAS.routes ? window.ALIAS.routes() : { ok: false })
      .then((r) => { if (alive) setRutas(r && r.ok ? r : { ok: false }); }, () => { if (alive) setRutas({ ok: false }); });
    return () => { alive = false; };
  }, [view, motor]);

  /* N = nueva misión (fuera de los campos de texto) · Escape cierra el menú del celular */
  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape' && navOpen) { setNavOpen(false); return; }
      const a = document.activeElement, typing = a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable);
      if ((e.key === 'n' || e.key === 'N') && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); go('new'); }
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  });

  const p = S.phase, ready = !!dict;
  const liveRun = p === 'running' || p === 'await' || p === 'paused' || p === 'error';
  let ctlMsg = '';
  if (S.plan) {
    if (p === 'running' && S.pausing) ctlMsg = t('pausando');
    else if (p === 'await' && S.awaitNext) ctlMsg = t('aprobar_q', { n: S.awaitDone, m: stepNum(S.awaitNext.id), title: S.awaitNext.title });
    else if (p === 'paused') ctlMsg = t('pausado');
  }
  const errStep = p === 'error' && S.plan ? S.plan.steps.find((s) => S.status[s.id] === 'error') : null;
  const done = S.plan ? S.plan.steps.filter((s) => isFinished(S, s.id)).length : 0, total = S.plan ? S.plan.steps.length : 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const curIdx = S.plan ? S.plan.steps.findIndex((s) => !isFinished(S, s.id)) : -1;
  const pillKind = { edit: 'gold', running: 'gold live', await: 'gold', paused: 'mute', error: 'bad', limit: 'bad', done: 'ok' }[p] || 'gold';
  const curTool = p === 'running' && S.cur != null && S.plan ? (S.plan.steps.find((s) => s.id === S.cur) || {}).tool : null;
  const planTools = S.plan ? AGENTS.map(([k]) => k).filter((k) => S.plan.steps.some((s) => s.tool === k)) : [];
  const where = view === 'missions' ? t('nav_misiones') : view === 'agents' ? t('nav_agentes') : S.plan ? t('nav_actual') : t('nav_nueva');
  const rtf = useMemo(() => { try { return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }); } catch (e) { return null; } }, [lang]);
  const ago = (ms) => {
    const s = Math.round((ms - Date.now()) / 1000), A = Math.abs(s);
    if (!rtf) return new Date(ms).toLocaleString(lang);
    return A < 60 ? rtf.format(0, 'second') : A < 3600 ? rtf.format(Math.round(s / 60), 'minute') : A < 86400 ? rtf.format(Math.round(s / 3600), 'hour') : rtf.format(Math.round(s / 86400), 'day');
  };
  const shown = q.trim() ? hist.filter((m) => m.goal.toLocaleLowerCase(lang).includes(q.trim().toLocaleLowerCase(lang))) : hist;

  const Mision = ({ m, row }) => {
    const total2 = m.total || 0, d2 = Math.min(m.done || 0, total2), fin = m.st === 'done';
    const tool = (m.tools && m.tools[0]) || 'think';
    return (
      <button type="button" className={row ? 'am-hrow' : 'am-recent'} onClick={() => reuse(m)} aria-label={t('h_retomar', { goal: m.goal })}>
        <span className={'am-ico ' + (AG_COLOR[tool] || 'gold')} aria-hidden="true"><Icono n={tool} /></span>
        <span className="am-rcopy">
          <b>{m.goal}</b>
          <small>{t('h_pasos', { done: d2, total: total2 })} · {ago(m.at)}</small>
          {!row ? <span className="am-mini"><i style={{ width: (total2 ? Math.round((d2 / total2) * 100) : 0) + '%' }} /></span> : null}
        </span>
        {row ? <span className={'am-hst ' + (fin ? 'ok' : 'gold')}>{t(fin ? 'h_done' : 'h_open')}</span> : <span className="am-pct">{total2 ? Math.round((d2 / total2) * 100) : 0}%</span>}
        <span className="am-rarrow" aria-hidden="true"><Icono n="right" /></span>
      </button>
    );
  };

  return (
    <div className={'am alias-react notr' + (navOpen ? ' nav-open' : '')} data-react="alias">
      <a className="skip" href="#main">{t('saltar')}</a>
      <svg className="defs" width="0" height="0" aria-hidden="true" focusable="false"><defs><linearGradient id="alG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f0cb7f" /><stop offset=".55" stopColor="#d58a78" /><stop offset="1" stopColor="#c9566c" /></linearGradient></defs></svg>
      <Fondo />
      <div id="aliasLive" className="sr-only" role="status" aria-live="polite" aria-atomic="true">{live}</div>

      {/* ---------- barra lateral ---------- */}
      <aside className="am-side" id="amSide" aria-label={t('nav_aria')}>
        <a className="am-brand" href="alias.html" aria-label="A.L.I.A.S.">
          <span className="am-mark"><Marca cls="brand-mark" vb="-3 0 50 30" sw="2.2" nodes={NODES(2.2, 2.6)} trav={[[2.4, '4.5s', undefined, 'trav', '#f0cb7f']]} /></span>
          <span className="am-bname">A.L.I.A.S.<small>{t('marca_sub')}</small></span>
        </a>
        <div className="am-slabel">{t('ws_label')}</div>
        <nav className="am-nav">
          <button type="button" className={'am-nav-i' + (view === 'main' && !S.plan ? ' on' : '')} onClick={() => go('new')} aria-current={view === 'main' && !S.plan ? 'page' : undefined}>
            <Icono n="plus" /> {t('nav_nueva')} <kbd title={t('atajo_n')}>N</kbd>
          </button>
          {S.plan ? (
            <button type="button" className={'am-nav-i' + (view === 'main' ? ' on' : '')} onClick={() => go('main')} aria-current={view === 'main' ? 'page' : undefined}>
              <Icono n="target" /> {t('nav_actual')} <span className={'am-ndot ' + pillKind} aria-hidden="true" />
            </button>
          ) : null}
          <button type="button" className={'am-nav-i' + (view === 'missions' ? ' on' : '')} onClick={() => go('missions')} aria-current={view === 'missions' ? 'page' : undefined}>
            <Icono n="hist" /> {t('nav_misiones')} {hist.length ? <span className="am-count">{hist.length}</span> : null}
          </button>
          <button type="button" className={'am-nav-i' + (view === 'agents' ? ' on' : '')} onClick={() => go('agents')} aria-current={view === 'agents' ? 'page' : undefined}>
            <Icono n="team" /> {t('nav_agentes')} <span className={'am-live' + (motor ? '' : ' wait')} aria-hidden="true" />
          </button>
        </nav>
        <div className="am-sbottom">
          <div className="am-scard">
            <p>{t('side_nota')}</p>
            <a className="am-btn-o sm" href="chat.html">{t('ir_flow')} <Icono n="arrow" /></a>
          </div>
          <a className="am-profile" href="index.html"><span className="am-avatar" aria-hidden="true"><Icono n="back" /></span><span><b>{t('volver_sym')}</b><small>symphoria.pages.dev</small></span></a>
        </div>
      </aside>
      {navOpen ? <button type="button" className="am-scrim" aria-hidden="true" tabIndex={-1} onClick={() => setNavOpen(false)} /> : null}

      <div className="am-main">
        <header className="am-top">
          <button type="button" className="am-ib am-menu" aria-label={t('abrir_menu')} aria-expanded={navOpen} aria-controls="amSide" onClick={() => setNavOpen((o) => !o)}><Icono n="menu" /></button>
          <div className="am-crumb">A.L.I.A.S. <span>/</span> <b>{where}</b></div>
          <div className="am-actions">
            <span className={'am-status' + (motor ? '' : ' wait')}><i />{t(motor ? 'motor_listo' : 'motor_carga')}</span>
            <div className="am-langs" role="group" aria-label={t('idioma')}>
              {LANGS.map((l) => <button key={l} type="button" data-lang={l} data-alias={'lang-' + l} lang={l} aria-pressed={lang === l} aria-label={t('idioma_' + l)} onClick={() => pickLang(l)}>{l.toUpperCase()}</button>)}
            </div>
          </div>
        </header>

        <main id="main" tabIndex={-1} ref={mainRef}>
          {view === 'missions' ? (
            <section className="am-view" id="vMisiones" aria-labelledby="misTitle">
              <div className="am-vhead"><div>
                <p className="am-eyebrow"><span />{t('hist_eyebrow')}</p>
                <h1 id="misTitle">{t('hist_t')}</h1>
                <p className="am-intro">{t('hist_intro')}</p>
              </div><button type="button" className="am-btn-p" onClick={() => go('new')}><Icono n="plus" /> {t('nav_nueva')}</button></div>
              <div className="am-panel am-list" data-clarity-mask="true">
                <div className="am-ltool">
                  <span className="am-mono">{shown.length === 1 ? t('hist_1') : t('hist_n', { n: shown.length })}</span>
                  <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('hist_buscar')} aria-label={t('hist_buscar')} />
                </div>
                <div data-blur="">{shown.map((m) => <Mision key={m.id} m={m} row />)}</div>
                {!shown.length ? <p className="am-empty">{hist.length ? t('hist_sin') : t('rec_vacio')}</p> : null}
                {hist.length ? <div className="am-lfoot"><button type="button" className="am-btn-t" onClick={() => { if (window.confirm(t('hist_borrar_q'))) { store.set(K_HIST, '[]'); setHist([]); } }}>{t('hist_borrar')}</button></div> : null}
              </div>
            </section>
          ) : view === 'agents' ? (
            <section className="am-view" id="vAgentes" aria-labelledby="agTitle">
              <div className="am-vhead"><div>
                <p className="am-eyebrow"><span />{t('agp_eyebrow')}</p>
                <h1 id="agTitle">{t('agp_t')}</h1>
                <p className="am-intro">{t('agp_intro')}</p>
              </div></div>
              <div className="am-agrid">
                {AGENTS.map(([k, c]) => (
                  <article className="am-panel am-acard" key={k}>
                    <span className={'am-av lg ' + c} aria-hidden="true"><Icono n={k} /></span>
                    <Pill kind="ok">{t('disponible')}</Pill>
                    <h2>{t('ag_' + k + '_n')}</h2>
                    <p>{t('ag_' + k + '_d')}</p>
                    <span className="am-tag">{t('ag_' + k + '_tag')}</span>
                  </article>
                ))}
              </div>

              <section className="am-panel am-learn" aria-labelledby="rtTitle" data-alias="routes">
                <div className="am-sechead"><div><h2 id="rtTitle"><Icono n="route" /> {t('rt_titulo')}</h2><p>{t('rt_intro')}</p></div></div>
                {!rutas || rutas.loading ? <p className="am-empty sm">{t('rt_cargando')}</p>
                  : !rutas.ok ? <p className="am-empty sm">{t('rt_error')}</p> : <>
                    <p className="am-ltoday"><span className="am-live" aria-hidden="true" /> {t('rt_hoy', { ok: rutas.today ? rutas.today.ok : 0, fail: rutas.today ? rutas.today.fail : 0 })}</p>
                    <div className="am-lgrid">
                      {['code', 'write', 'reason', 'summary', 'translate', 'data', 'plan'].map((c) => {
                        const rows = (rutas.cats && rutas.cats[c]) || [];
                        return (
                          <div className="am-lcat" key={c}>
                            <b>{t('rt_cat_' + c)}</b>
                            {rows.length ? <ol>{rows.map((x, i) => (
                              <li key={x.id} className={i === 0 ? 'first' : ''}>
                                <span className="nm">{x.name}<small>{x.prov}</small></span>
                                <span className="st">{t('rt_fila', { rate: Math.round(x.rate * 100), s: (x.ms / 1000).toFixed(1), n: x.n })}{x.up || x.down ? ' · 👍 ' + x.up + ' · 👎 ' + x.down : ''}</span>
                                <span className="bar" aria-hidden="true"><i style={{ width: Math.round(x.rate * 100) + '%' }} /></span>
                              </li>
                            ))}</ol> : <p className="am-lnone">{t('rt_sin_tipo')}</p>}
                          </div>
                        );
                      })}
                    </div>
                    {!Object.values(rutas.cats || {}).some((r) => r && r.length) ? <p className="am-empty sm">{t('rt_vacio')}</p> : null}
                  </>}
              </section>
            </section>
          ) : !S.plan ? (
            <section id="vHome" className="am-view" aria-labelledby="homeTitle">
              <div className="am-welcome">
                <div>
                  <p className="am-eyebrow"><span />{t('hm_eyebrow')}</p>
                  <h1 id="homeTitle">{t('hm_t1')}<br /><em>{t('hm_t2')}</em></h1>
                  <p className="am-intro">{t('home_sub')}</p>
                </div>
                <div className="am-orb" aria-hidden="true">
                  <div className="r1" /><div className="r2" /><div className="o"><span /></div>
                  <div className="cap">{t('orb_1')}<br /><b>{t('orb_2')}</b></div>
                </div>
              </div>

              <form id="goalForm" className="am-panel am-composer" noValidate aria-busy={S.busy} onSubmit={(e) => { e.preventDefault(); requestPlan(goal); }}>
                <div className="am-kicker"><span className="am-idx">01</span><span>{t('k_define')}</span><span className="am-opt">{t('k_opt')}</span></div>
                <label htmlFor="goalInput" className="sr-only">{t('goal_label')}</label>
                <textarea id="goalInput" ref={goalRef} data-alias="goal" rows={4} maxLength={500} autoComplete="off" placeholder={ready ? t('goal_ph') : ''} value={goal}
                  onChange={(e) => { setGoal(e.target.value); setHomeMsg(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); requestPlan(e.currentTarget.value); } }} />
                {homeMsg ? <p id="homeMsg" className="msg" role="alert">{homeMsg}</p> : null}
                <div className="am-cbottom">
                  <small className="am-hint"><span className="am-spark" aria-hidden="true">✳</span> {t('goal_hint')}</small>
                  <button className="am-btn-p" id="goBtn" data-alias="plan-submit" type="submit" disabled={S.busy}>{t(S.busy ? 'planeando' : 'goal_btn')} <Icono n="arrow" /></button>
                </div>
              </form>

              <div className="am-shead">
                <div><h2>{t('rutas_t')}</h2><p>{t('rutas_d')}</p></div>
                <span className="am-mono">{t('rutas_lbl', { n: '0' + TPLS.length })}</span>
              </div>
              <div id="tplList" className="am-tpls">
                {TPLS.map(([k, ic, c]) => (
                  <button key={k} type="button" className="am-tpl" data-tpl={k} onClick={() => pickTpl(k)}>
                    <span className={'am-ico ' + c} aria-hidden="true"><Icono n={ic} /></span>
                    <span className="am-tcopy"><b>{t('tpl_' + k + '_t')}</b><small>{t('tpl_' + k + '_d')}</small></span>
                    <span className="am-tarrow" aria-hidden="true"><Icono n="arrow" /></span>
                  </button>
                ))}
              </div>

              <div className="am-lower">
                <section className="am-panel am-rec" aria-labelledby="recTitle" data-clarity-mask="true">
                  <div className="am-sechead">
                    <div><h2 id="recTitle">{t('rec_t')}</h2><p>{t('rec_d')}</p></div>
                    {hist.length ? <button type="button" className="am-btn-t" onClick={() => go('missions')}>{t('ver_todas')} <Icono n="right" /></button> : null}
                  </div>
                  {hist.length ? hist.slice(0, 3).map((m) => <Mision key={m.id} m={m} />) : <p className="am-empty sm">{t('rec_vacio')}</p>}
                </section>
                <section className="am-panel am-agmini" aria-labelledby="agMiniTitle">
                  <div className="am-sechead">
                    <div><h2 id="agMiniTitle">{t('ag_t')}</h2><p>{t('ag_d')}</p></div>
                    <Pill kind="ok">{t('listos')}</Pill>
                  </div>
                  <div className="am-stack">
                    {AGENTS.map(([k, c]) => <span key={k} className={'am-av ' + c} title={t('ag_' + k + '_n')}><Icono n={k} /></span>)}
                    <div className="am-stackc"><b>{t('ag_n', { n: AGENTS.length })}</b><small>{AGENTS.map(([k]) => t('ag_' + k + '_n')).join(' · ')}</small></div>
                  </div>
                  <button type="button" className="am-btn-o wide" onClick={() => go('agents')}>{t('ag_explorar')} <Icono n="right" /></button>
                </section>
              </div>
              <p className="am-note">{t('home_nota')}</p>
            </section>
          ) : (
            <section id="vPlan" data-clarity-mask="true" className="am-view" data-alias="plan" data-state={p} aria-labelledby="planTitle">
              <div className="am-vhead">
                <div>
                  <p className="am-eyebrow"><span />{t('mi_eyebrow')}</p>
                  <h1 id="planTitle" className="h-plan" tabIndex={-1} ref={planTitle}>{t('plan_titulo')}</h1>
                  <p className="am-intro">{t('mi_intro')}</p>
                </div>
                <button type="button" className="am-btn-o" onClick={() => go('new')}><Icono n="back" /> {t('nav_nueva')}</button>
              </div>

              <div className="am-panel am-summary">
                <div className="am-sumL">
                  <Pill kind={pillKind}>{t('pill_' + p)}</Pill>
                  <p className="goal"><b>{t('plan_obj')}</b> <span id="planGoal">{S.goal}</span></p>
                  {S.plan.route && S.plan.route.name ? <p className="am-proute" title={porQue(S.plan.route, t)}><Icono n="route" /> {t('rt_plan', { name: S.plan.route.name })}</p> : null}
                </div>
                <div className="am-sprog">
                  <strong>{pct}%</strong><span>{t('progreso')}</span>
                  <div className="prog"><progress id="progress" max={total} value={done} aria-label={t('progreso_n', { n: done, total })} /></div>
                  <span id="progTxt" className="am-ptxt">{t('progreso_n', { n: done, total })}</span>
                </div>
              </div>

              <div className="am-layout">
                <div className="am-panel am-route">
                  <div className="am-sechead">
                    <div><h2>{t('ruta_t')}</h2><p>{t('ruta_d', { n: total })}</p></div>
                    <span className="am-mono">{t('paso_de', { n: String(Math.min((curIdx < 0 ? total : curIdx + 1), total)).padStart(2, '0'), total: String(total).padStart(2, '0') })}</span>
                  </div>
                  {p === 'edit' ? <p id="editHint" className="hint">{t('plan_edit_hint')}</p> : null}
                  <Pasos S={S} t={t} act={act} focusRef={stepEls} />

                  {p !== 'done' ? (
                    <div id="ctl" className="ctl">
                      <fieldset id="modeBox" className="mode">
                        <legend>{t('modo_titulo')}</legend>
                        {['manual', 'auto'].map((m) => (
                          <label className="opt" key={m}><input type="radio" name="mode" value={m} checked={S.mode === m} onChange={() => { S.mode = m; if (m === 'auto' && S.phase === 'await') send({ a: 'go' }); draw(); }} /><span><b>{t('modo_' + m)}</b><small>{t('modo_' + m + '_d')}</small></span></label>
                        ))}
                      </fieldset>
                      {ctlMsg ? <p id="ctlMsg" className="ctl-msg">{ctlMsg}</p> : null}
                      <div className="btns">
                        {p === 'edit' ? <button type="button" className="am-btn-p" id="bRun" data-alias="run" disabled={!total} onClick={() => { S.editing = null; drive(); }}>{t('btn_ejecutar')} <Icono n="right" /></button> : null}
                        {p === 'await' ? <button type="button" className="am-btn-p" id="bApprove" data-alias="run" onClick={() => send({ a: 'go' })}>{t('btn_aprobar')} <Icono n="right" /></button> : null}
                        {p === 'paused' ? <button type="button" className="am-btn-p" id="bResume" data-alias="run" onClick={() => send({ a: 'go' })}>{t('btn_continuar')} <Icono n="right" /></button> : null}
                        {p === 'running' && !S.pausing ? <button type="button" className="am-btn-o" id="bPause" data-alias="pause" onClick={() => { S.pausing = true; draw(); say(tt('pausando')); }}>{t('btn_pausar')}</button> : null}
                        <button type="button" className="am-btn-o ghost" id="bCancel" onClick={() => cancelAll(true)}>{t('btn_cancelar')}</button>
                      </div>
                      {liveRun && S.plan.steps.some((s) => S.status[s.id] === 'done') ? <p id="redoNote" className="hint">{t('rehacer_nota')}</p> : null}
                    </div>
                  ) : null}

                  {/* siempre montado (oculto) para que el aviso aparezca en el mismo lugar apenas falla un paso */}
                  {p !== 'done' ? (
                    <div id="errBox" className="errbox" role={p === 'error' ? 'alert' : undefined} tabIndex={-1} hidden={p !== 'error'}>
                      <h3>{t('err_titulo')}</h3>
                      <p id="errStep" className="errstep">{errStep ? t('paso_n', { n: stepNum(errStep.id) }) + ' · ' + errStep.title : ''}</p>
                      <p id="errMsg" className="errmsg" data-alias="error">{errStep ? S.errors[errStep.id] || '' : ''}</p>
                      <div className="btns" data-alias="decisions">
                        <button type="button" className="am-btn-p" id="bErrRetry" onClick={() => send({ a: 'retry' })}>{t('err_otra')}</button>
                        <button type="button" className="am-btn-o" id="bErrSkip" onClick={() => send({ a: 'skip' })}>{t('err_seguir')}</button>
                        <button type="button" className="am-btn-o ghost" id="bErrStop" onClick={() => send({ a: 'stop' })}>{t('err_parar')}</button>
                      </div>
                    </div>
                  ) : null}

                  {p === 'limit' ? (
                    <div id="limitBox" className="errbox" role="alert">
                      <h3>{t('err_limite')}</h3><p>{t('err_limite_d')}</p>
                      <div className="btns"><button type="button" className="am-btn-o" id="bLimitBack" onClick={() => cancelAll(false)}>{t('res_nuevo')}</button></div>
                    </div>
                  ) : null}
                </div>

                <aside className="am-panel am-orq" aria-labelledby="orqTitle">
                  <div className="am-sechead"><div><h2 id="orqTitle">{t('orq_t')}</h2><p>{t('orq_d')}</p></div></div>
                  <div className={'am-node main' + (p === 'running' ? ' on' : '')}>
                    <span className="am-ico gold" aria-hidden="true"><Icono n="think" /></span>
                    <span className="am-ncopy"><b>A.L.I.A.S.</b><small>{t('coord')}</small></span>
                    <span className={'am-live' + (motor ? '' : ' wait')} aria-hidden="true" />
                  </div>
                  <div className="am-wire" aria-hidden="true" />
                  <div className="am-nodes">
                    {planTools.map((k) => {
                      const mine = S.plan.steps.filter((s) => s.tool === k), work = curTool === k, fin = mine.every((s) => isFinished(S, s.id));
                      const usedBy = mine.map((s) => S.results[s.id] && S.results[s.id].route && S.results[s.id].route.name).filter(Boolean).pop();
                      return (
                        <div key={k} className={'am-node' + (work ? ' on' : '') + (fin ? ' fin' : '')}>
                          <span className={'am-ico ' + AG_COLOR[k]} aria-hidden="true"><Icono n={k} /></span>
                          <span className="am-ncopy"><b>{t('ag_' + k + '_n')}</b><small>{work ? t('trabajando') : (mine.length === 1 ? t('pasos_1') : t('pasos_cnt', { n: mine.length }))}{usedBy && !work ? ' · ' + t('rt_usa', { name: usedBy }) : ''}</small></span>
                          {fin ? <span className="am-nok" aria-hidden="true"><Icono n="check" /></span> : null}
                        </div>
                      );
                    })}
                  </div>
                  <label className="syn-tog"><input type="checkbox" id="synthOn" checked={synthOn} onChange={(e) => { setSynthOn(e.target.checked); store.set('alias:synth', e.target.checked ? '1' : '0'); }} /><span><b>{t('syn_tog')}</b><small>{t('syn_tog_d')}</small></span></label>
                  <div className="am-human"><Icono n="person" /><p><b>{t('humano_t')}</b><small>{t('humano_d')}</small></p></div>
                </aside>
              </div>

              {p === 'done' && S.summary ? <Resultado S={S} t={t} say={say} onNew={() => cancelAll(false)} titleRef={resTitle} animar={!still()} /> : null}
            </section>
          )}
        </main>
        <footer className="am-foot"><span><b>A.L.I.A.S.</b> <span className="sep">/</span> SymphorIA</span><span>{t('pie')}</span></footer>
      </div>
    </div>
  );
}
