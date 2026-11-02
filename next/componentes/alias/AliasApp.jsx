'use client';
/* ===== A.L.I.A.S. en React (v3.8) =====
   Antes: alias.html + alias.js armaban la pantalla con el DOM a mano. Ahora la vista es React:
   · AliasApp (este archivo): idioma, tema, pantalla inicial, plan, controles y el recorrido paso a paso.
   · Pasos.jsx (lista editable) · Resultado.jsx (texto final, Síntesis, archivos, fuentes) · iconos.jsx.
   El motor no cambia: window.ALIAS (alias-tools.js) pide el plan y corre cada paso en el servidor.
   Los textos siguen en alias-textos.json (ES/EN) y siguen el idioma de todo SymphorIA al instante.
   Se conservan los IDs y los data-alias: las pruebas (t/alias/ui.mjs) manejan la página por ellos. */
import { useCallback, useEffect, useRef, useState } from 'react';
import Pasos from './Pasos';
import Resultado, { compilar } from './Resultado';
import { Icono } from './iconos';

const LANGS = ['es', 'en'], MAX_STEPS = 7;
const K_LANG = 'synthz:alias:lang', K_SCHEME = 'synthz:alias:scheme';
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
  mode: 'manual', pausing: false, cancelled: false, running: false, gateFn: null, cur: null, editing: null, busy: false, reqId: 0,
});
const still = () => document.documentElement.classList.contains('noanim');
const isFinished = (S, id) => (S.status[id] || 'pending') === 'done' || !!S.skipped[id];

/* ---- fondo: cinta de colores y estrellas que titilan (siempre el mismo cielo para la misma pantalla) ---- */
function Fondo() {
  const cv = useRef(null);
  useEffect(() => {
    const c = cv.current; if (!c) return undefined;
    const ctx = c.getContext('2d'); let w = 0, h = 0, S = [], raf = 0, on = true;
    const fit = () => {
      const d = Math.min(devicePixelRatio || 1, 2); w = c.clientWidth || innerWidth; h = c.clientHeight || innerHeight;
      c.width = w * d; c.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      S = Array.from({ length: Math.round((w * h) / 11000) }, () => { const g = rnd() < 0.2; return { x: rnd() * w, y: rnd() * h, r: g ? 0.9 + rnd() : 0.3 + rnd(), g, ph: rnd() * 6.28, sp: 0.4 + rnd() * 1.3 }; });
    };
    const draw = (now) => {
      raf = 0; ctx.clearRect(0, 0, w, h); const quiet = still();
      for (const s of S) { const tw = quiet ? 0.8 : 0.5 + 0.5 * Math.sin((now / 1000) * s.sp + s.ph); ctx.globalAlpha = 0.2 + 0.7 * tw; ctx.fillStyle = s.g ? '#ffc857' : '#e9e4ff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); }
      if (on && !quiet) raf = requestAnimationFrame(draw);
    };
    const resize = () => { fit(); if (!raf) raf = requestAnimationFrame(draw); };
    const vis = () => { on = !document.hidden; if (on && !raf) raf = requestAnimationFrame(draw); };
    fit(); raf = requestAnimationFrame(draw);
    addEventListener('resize', resize); document.addEventListener('visibilitychange', vis);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); document.removeEventListener('visibilitychange', vis); };
  }, []);
  const RIB = ['M-120 520C220 440 420 590 760 490S1240 270 1600 360', 'M-120 534C220 454 420 604 760 504S1240 284 1600 374', 'M-120 546C220 466 420 616 760 516S1240 296 1600 386', 'M-120 556C220 476 420 626 760 526S1240 306 1600 396', 'M-120 566C220 486 420 636 760 536S1240 316 1600 406'];
  return (
    <div className="bg" aria-hidden="true">
      <canvas id="alStars" ref={cv} />
      <svg className="rib" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice" fill="none" strokeLinecap="round">
        <g className="rg"><path d={RIB[0]} stroke="#7b3ff2" strokeWidth="13" /><path d={RIB[1]} stroke="#ff3d9a" strokeWidth="10" /><path d={RIB[2]} stroke="#ff7a45" strokeWidth="8" /></g>
        <g><path d={RIB[0]} stroke="#7b3ff2" strokeWidth="10" /><path d={RIB[1]} stroke="#ff3d9a" strokeWidth="7" /><path d={RIB[2]} stroke="#ff7a45" strokeWidth="5" /><path d={RIB[3]} stroke="#ffc857" strokeWidth="3" /><path d={RIB[4]} stroke="#3de0ff" strokeWidth="1.6" /></g>
      </svg>
    </div>
  );
}

const LOOP = 'M22 15C18 9 13 6 8 6a9 9 0 0 0 0 18c5 0 10-3 14-9s9-9 14-9a9 9 0 0 1 0 18c-5 0-10-3-14-9z';
function Marca({ cls, vb, sw, nodes, trav }) {
  return (
    <svg className={cls} viewBox={vb} aria-hidden="true" focusable="false">
      <path className="lp" d={LOOP} fill="none" stroke="url(#alG)" strokeWidth={sw} />
      <g className="nd" fill={cls ? '#fff' : undefined}>{nodes.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}</g>
      {trav.map(([r, dur, begin, c, fill], i) => <circle key={i} className={c} r={r} fill={fill}><animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={LOOP} /></circle>)}
    </svg>
  );
}
const NODES = (a, b) => [[8, 6, a], [-1, 15, a], [8, 24, a], [22, 15, b], [36, 6, a], [45, 15, a], [36, 24, a]];
const TPLS = [
  ['inv', <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></>],
  ['pres', <><rect x="3" y="4" width="18" height="12" rx="2.5" /><path d="M8 20h8M12 16v4M8 12v-2M12 12V8M16 12v-3" /></>],
  ['est', <><rect x="3.5" y="5" width="4" height="15" rx="1" /><rect x="9.5" y="3.5" width="4" height="16.5" rx="1" /><path d="m15.6 6.2 3.7-1 3.4 13.6-3.7 1z" /></>],
  ['cod', <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15" />],
];

export default function AliasApp() {
  const [dict, setDict] = useState(null);
  const [lang, setLangS] = useState('es');
  const [scheme, setScheme] = useState('dark');
  const [, setTick] = useState(0);
  const [live, setLive] = useState('');
  const [homeMsg, setHomeMsg] = useState('');
  const [goal, setGoal] = useState('');
  const [synthOn, setSynthOn] = useState(true);
  const S = useRef(fresh()).current;
  const synthRef = useRef(true); synthRef.current = synthOn;
  const langRef = useRef('es');
  const runSeq = useRef(0);
  const focusNext = useRef(null);
  const stepEls = useRef({});
  const goalRef = useRef(null), planTitle = useRef(null), resTitle = useRef(null);

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
  useEffect(() => { const f = focusNext.current; if (f) { focusNext.current = null; const el = f(); if (el && el.focus) el.focus(); } });

  /* ---- arranque: Ajustes de SymphorIA (animaciones, vidrio), tema, idioma y textos ---- */
  useEffect(() => {
    const H = document.documentElement;
    try { const c = JSON.parse(store.get('synthz:cfg')) || {}; H.classList.toggle('noanim', c.anim === false); H.classList.toggle('noglass', c.glass === false); } catch (e) { /* sin ajustes */ }
    /* el tema guardado (o el del sistema) se lee aquí mismo: no se espera a que otro script lo ponga en <html> */
    let sc = store.get(K_SCHEME);
    if (sc !== 'light' && sc !== 'dark') sc = H.dataset.scheme === 'light' || (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    setScheme(sc);
    const l = detectLang(); langRef.current = l; setLangS(l);
    try { setSynthOn(store.get('alias:synth') !== '0'); } catch (e) { /* encendida */ }
    let alive = true;
    fetch('alias-textos.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch((e) => { console.error('ALIAS: no se pudo leer alias-textos.json', e); return {}; })
      .then((d) => { if (alive) { setDict(d); H.classList.add('ready'); } });
    /* si cambias el idioma en otra pestaña de SymphorIA, A.L.I.A.S. cambia al instante */
    const follow = () => { const n = detectLang(); if (n !== langRef.current) { langRef.current = n; setLangS(n); window.dispatchEvent(new CustomEvent('alias:lang', { detail: { lang: n } })); } };
    const onStore = (e) => { if (e.key === 'synthz:lang') follow(); };
    addEventListener('storage', onStore); addEventListener('pageshow', follow);
    return () => { alive = false; removeEventListener('storage', onStore); removeEventListener('pageshow', follow); };
  }, []);

  /* el motor (alias-tools.js) y el resto de SymphorIA leen el idioma de aquí */
  useEffect(() => {
    const H = document.documentElement; H.lang = lang;
    window.ALIAS_LANG = lang;
    window.AliasUI = Object.assign(window.AliasUI || {}, { lang });
    window.t = (k, v) => tRef.current(k, v);
    if (dict) document.title = t('titulo');
  }, [lang, dict, t]);
  useEffect(() => {
    const H = document.documentElement; H.dataset.scheme = scheme;
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = scheme === 'light' ? '#f4f1ff' : '#0b0820';
  }, [scheme]);

  const pickLang = (l) => {
    if (l === langRef.current) return;
    langRef.current = l; setLangS(l); store.set(K_LANG, l); store.set('synthz:lang', l);
    window.dispatchEvent(new CustomEvent('alias:lang', { detail: { lang: l } }));
  };
  const toggleScheme = () => { const n = scheme === 'light' ? 'dark' : 'light'; setScheme(n); store.set(K_SCHEME, n); };

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
  const finish = () => { S.phase = 'done'; S.cur = null; S.summary = compilar(S); say(tt('listo')); focusLater(() => resTitle.current); draw(); };
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
    if (ask && S.phase !== 'edit' && !window.confirm(tt('confirm_cancel'))) return;
    runSeq.current++; send({ a: 'cancel' });
    const mode = S.mode;
    Object.assign(S, fresh(), { mode, reqId: S.reqId + 1 });
    setHomeMsg(''); say(tt('cancelado')); focusLater(() => goalRef.current); draw();
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

  const p = S.phase, light = scheme === 'light', ready = !!dict;
  const liveRun = p === 'running' || p === 'await' || p === 'paused' || p === 'error';
  let ctlMsg = '';
  if (S.plan) {
    if (p === 'running' && S.pausing) ctlMsg = t('pausando');
    else if (p === 'await' && S.awaitNext) ctlMsg = t('aprobar_q', { n: S.awaitDone, m: stepNum(S.awaitNext.id), title: S.awaitNext.title });
    else if (p === 'paused') ctlMsg = t('pausado');
  }
  const errStep = p === 'error' && S.plan ? S.plan.steps.find((s) => S.status[s.id] === 'error') : null;
  const done = S.plan ? S.plan.steps.filter((s) => isFinished(S, s.id)).length : 0, total = S.plan ? S.plan.steps.length : 0;

  return (
    <div className="alias-react notr" data-react="alias">
      <a className="skip" href="#main">{t('saltar')}</a>
      <svg className="defs" width="0" height="0" aria-hidden="true" focusable="false"><defs><linearGradient id="alG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3de0ff" /><stop offset=".4" stopColor="#7b3ff2" /><stop offset=".72" stopColor="#ff3d9a" /><stop offset="1" stopColor="#ff7a45" /></linearGradient></defs></svg>
      <Fondo />
      <div id="aliasLive" className="sr-only" role="status" aria-live="polite" aria-atomic="true">{live}</div>

      <header className="top">
        <a className="brand" href="alias.html" aria-label="A.L.I.A.S.">
          <Marca cls="brand-mark" vb="-3 0 50 30" sw="2.2" nodes={NODES(2.2, 2.6)} trav={[[2.4, '4.5s', undefined, 'trav', '#3de0ff']]} />
          <span className="brand-name">A.L.I.A.S.</span>
        </a>
        <span className="brand-sub">{t('marca_sub')}</span>
        <div className="tools">
          <a className="toflow" href="chat.html">{t('ir_flow')}</a>
          <div className="langs" role="group" aria-label={t('idioma')}>
            {LANGS.map((l) => <button key={l} type="button" data-lang={l} data-alias={'lang-' + l} lang={l} aria-pressed={lang === l} aria-label={t('idioma_' + l)} onClick={() => pickLang(l)}>{l.toUpperCase()}</button>)}
          </div>
          <button type="button" id="schemeBtn" className="iconbtn" aria-label={t(light ? 'tema_oscuro' : 'tema_claro')} onClick={toggleScheme}><Icono n={light ? 'moon' : 'sun'} /></button>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        {!S.plan ? (
          <section id="vHome" aria-labelledby="homeTitle">
            <div className="emb" aria-hidden="true">
              <Marca vb="-6 -2 56 34" sw="1.6" nodes={NODES(1.7, 2.1)} trav={[[1.9, '6s', undefined, 'trav'], [1.4, '6s', '-3s', 'trav t2']]} />
            </div>
            <p className="eyebrow"><b>A.L.I.A.S.</b> <span>{t('home_eyebrow')}</span></p>
            <h1 id="homeTitle">{t('home_titulo')}</h1>
            <p className="lead">{t('home_sub')}</p>
            <form id="goalForm" className="glass" noValidate aria-busy={S.busy} onSubmit={(e) => { e.preventDefault(); requestPlan(goal); }}>
              <label htmlFor="goalInput" className="sr-only">{t('goal_label')}</label>
              <textarea id="goalInput" ref={goalRef} data-alias="goal" rows={4} maxLength={500} autoComplete="off" placeholder={ready ? t('goal_ph') : ''} value={goal}
                onChange={(e) => { setGoal(e.target.value); setHomeMsg(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); requestPlan(e.currentTarget.value); } }} />
              {homeMsg ? <p id="homeMsg" className="msg" role="alert">{homeMsg}</p> : null}
              <div className="row">
                <small className="hint">{t('goal_hint')}</small>
                <button className="btn primary" id="goBtn" data-alias="plan-submit" type="submit" disabled={S.busy}>{t(S.busy ? 'planeando' : 'goal_btn')}</button>
              </div>
            </form>
            <h2 className="sub">{t('tpl_titulo')}</h2>
            <div id="tplList" className="tpls">
              {TPLS.map(([k, ic]) => (
                <button key={k} type="button" className="tpl" data-tpl={k} onClick={() => pickTpl(k)}>
                  <span className="tpl-ico" aria-hidden="true"><svg viewBox="0 0 24 24">{ic}</svg></span>
                  <span className="tpl-t">{t('tpl_' + k + '_t')}</span><span className="tpl-d">{t('tpl_' + k + '_d')}</span>
                </button>
              ))}
            </div>
            <p className="hint foot">{t('home_nota')}</p>
          </section>
        ) : (
          <section id="vPlan" data-clarity-mask="true" data-alias="plan" data-state={p} aria-labelledby="planTitle">
            <h2 id="planTitle" className="h-plan" tabIndex={-1} ref={planTitle}>{t('plan_titulo')}</h2>
            <p className="goal"><b>{t('plan_obj')}</b> <span id="planGoal">{S.goal}</span></p>
            {p === 'edit' ? <p id="editHint" className="hint">{t('plan_edit_hint')}</p> : null}
            <label className="syn-tog"><input type="checkbox" id="synthOn" checked={synthOn} onChange={(e) => { setSynthOn(e.target.checked); store.set('alias:synth', e.target.checked ? '1' : '0'); }} /><span><b>{t('syn_tog')}</b><small>{t('syn_tog_d')}</small></span></label>
            <div className="prog"><progress id="progress" max={total} value={done} aria-label={t('progreso_n', { n: done, total })} /><span id="progTxt" className="hint">{t('progreso_n', { n: done, total })}</span></div>
            <Pasos S={S} t={t} act={act} focusRef={stepEls} />

            {p !== 'done' ? (
              <div id="ctl" className="ctl glass">
                <fieldset id="modeBox" className="mode">
                  <legend>{t('modo_titulo')}</legend>
                  {['manual', 'auto'].map((m) => (
                    <label className="opt" key={m}><input type="radio" name="mode" value={m} checked={S.mode === m} onChange={() => { S.mode = m; if (m === 'auto' && S.phase === 'await') send({ a: 'go' }); draw(); }} /><span><b>{t('modo_' + m)}</b><small>{t('modo_' + m + '_d')}</small></span></label>
                  ))}
                </fieldset>
                {ctlMsg ? <p id="ctlMsg" className="ctl-msg">{ctlMsg}</p> : null}
                <div className="btns">
                  {p === 'edit' ? <button type="button" className="btn primary" id="bRun" data-alias="run" disabled={!total} onClick={() => { S.editing = null; drive(); }}>{t('btn_ejecutar')}</button> : null}
                  {p === 'await' ? <button type="button" className="btn primary" id="bApprove" data-alias="run" onClick={() => send({ a: 'go' })}>{t('btn_aprobar')}</button> : null}
                  {p === 'paused' ? <button type="button" className="btn primary" id="bResume" data-alias="run" onClick={() => send({ a: 'go' })}>{t('btn_continuar')}</button> : null}
                  {p === 'running' && !S.pausing ? <button type="button" className="btn" id="bPause" data-alias="pause" onClick={() => { S.pausing = true; draw(); say(tt('pausando')); }}>{t('btn_pausar')}</button> : null}
                  <button type="button" className="btn ghost" id="bCancel" onClick={() => cancelAll(true)}>{t('btn_cancelar')}</button>
                </div>
                {liveRun && S.plan.steps.some((s) => S.status[s.id] === 'done') ? <p id="redoNote" className="hint">{t('rehacer_nota')}</p> : null}
              </div>
            ) : null}

            {p === 'error' ? (
              <div id="errBox" className="errbox" role="alert" tabIndex={-1}>
                <h3>{t('err_titulo')}</h3>
                <p id="errStep" className="errstep">{errStep ? t('paso_n', { n: stepNum(errStep.id) }) + ' · ' + errStep.title : ''}</p>
                <p id="errMsg" className="errmsg" data-alias="error">{errStep ? S.errors[errStep.id] || '' : ''}</p>
                <div className="btns" data-alias="decisions">
                  <button type="button" className="btn primary" id="bErrRetry" onClick={() => send({ a: 'retry' })}>{t('err_otra')}</button>
                  <button type="button" className="btn" id="bErrSkip" onClick={() => send({ a: 'skip' })}>{t('err_seguir')}</button>
                  <button type="button" className="btn ghost" id="bErrStop" onClick={() => send({ a: 'stop' })}>{t('err_parar')}</button>
                </div>
              </div>
            ) : null}

            {p === 'limit' ? (
              <div id="limitBox" className="errbox" role="alert">
                <h3>{t('err_limite')}</h3><p>{t('err_limite_d')}</p>
                <div className="btns"><button type="button" className="btn" id="bLimitBack" onClick={() => cancelAll(false)}>{t('res_nuevo')}</button></div>
              </div>
            ) : null}

            {p === 'done' && S.summary ? <Resultado S={S} t={t} say={say} onNew={() => cancelAll(false)} titleRef={resTitle} animar={!still()} /> : null}
          </section>
        )}
      </main>
    </div>
  );
}
