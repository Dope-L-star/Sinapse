'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { textos } from './textos.mjs';
import { I, ICO, Saldo, Radar, Brutal, Contactar, Paleta } from './partes';
import './admin.css';

/* ===== Panel de administración nuevo (Pulsem en React)
   Conserva la forma de siempre (menú a la izquierda con Resumen, Llaves, Ajustes, Comentarios y Ayuda, una sección a la vez)
   y la mejora: «Para atender ahora» arriba, Ctrl+K para ir o hacer cualquier cosa, teclas 1-5, bandeja de Ayuda en dos
   columnas con respuestas rápidas, confirmación fuerte para lo que afecta a todos y el saldo oculto con un ojo.
   Se monta así (ver LEEME.md):  <PanelAdmin api={SZ.api} onAuth={status => …} />
   api(path, { method, body, keep }) es la misma de core.js; el panel pide 'health?panel=1' y 'trial' cada minuto. ===== */

const VISTAS = ['res', 'keys', 'set', 'fb', 'help'];
const PROVS = [
  ['groq', 'Groq', 'https://console.groq.com/keys', 'gsk_…'], ['mistral', 'Mistral', 'https://console.mistral.ai/api-keys', ''],
  ['cloudflare', 'Cloudflare', 'https://dash.cloudflare.com/profile/api-tokens', 'Workers AI'], ['openrouter', 'OpenRouter', 'https://openrouter.ai/keys', 'sk-or-…'],
  ['google', 'Google AI Studio', 'https://aistudio.google.com/apikey', 'AIza…'], ['ollama', 'Ollama', 'https://ollama.com/settings/keys', ''],
  ['siliconflow', 'SiliconFlow', 'https://cloud.siliconflow.com/account/ak', 'sk-…'], ['tavily', 'Tavily', 'https://app.tavily.com/home', 'tvly-…'],
  ['exa', 'Exa', 'https://dashboard.exa.ai/api-keys', ''], ['pollinations', 'Pollinations', 'https://enter.pollinations.ai', 'sk_…'],
];
const coins = tok => Math.max(0, Math.round((+tok || 0) / (4 / 3)));
const rc = r => String(r || '').toLowerCase();
const ini = n => (String(n || '?').replace(/^@/, '').charAt(0).toUpperCase() || '?');

/* el idioma sigue al de la página (<html lang>) al instante, salvo que lo pasen como prop */
function useLang(prop) {
  const [l, setL] = useState(() => prop || (typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'es'));
  useEffect(() => {
    if (prop) { setL(prop); return; }
    const r = document.documentElement, f = () => setL(r.lang === 'en' ? 'en' : 'es');
    const mo = new MutationObserver(f); mo.observe(r, { attributes: true, attributeFilter: ['lang'] }); f();
    return () => mo.disconnect();
  }, [prop]);
  return l;
}

function salud(P, t) {
  const keys = P.keys || [], tot = keys.length, ok = keys.filter(k => !k.down).length, now = P.now;
  const errs = (P.events || []).filter(e => now - e.t < 10 * 60e3 && (e.kind === 'error' || e.kind === 'jserror')).length;
  const load5 = (P.perMin || []).slice(-5).reduce((a, b) => a + b, 0), d0 = (P.stat || [])[0] || {}, fail = d0.fail || 0, fr = fail / Math.max(1, (d0.req || 0) + fail);
  const why = []; let lv = 'ok'; const O = ['ok', 'busy', 'down'], up = x => { if (O.indexOf(x) > O.indexOf(lv)) lv = x; };
  if (!tot) { lv = 'off'; why.push(t.whyNoKeys); }
  else {
    why.push(t.whyKeys(ok, tot)); if (!ok) up('down'); else if (ok < tot / 2) up('busy');
    if (fail >= 5 && fr > .3) up('down'); else if (fail >= 3 && fr > .1) up('busy'); if (fail) why.push(t.whyFail(fail));
    if (errs >= 15) up('down'); else if (errs >= 5) up('busy'); if (errs) why.push(t.whyErr(errs));
    if (load5 >= 120) up('busy'); why.push(t.whyLoad(load5));
  }
  return { lv, why };
}

export default function PanelAdmin({ api, lang: langProp, onAuth, onLang, toast: toastProp, demo = false }) {
  const lang = useLang(langProp), t = textos(lang), loc = lang === 'en' ? 'en-US' : 'es-CO';
  const nf = useMemo(() => new Intl.NumberFormat(loc), [loc]), fmt = n => nf.format(Math.round(n || 0));
  const ago = ms => t.ago(Math.max(0, Math.round((Date.now() - ms) / 1000)));

  const [P, setP] = useState(null), [T, setT] = useState(null), [err, setErr] = useState(''), [lastOk, setLastOk] = useState(0), [busy, setBusy] = useState(false);
  const [vista, setVista] = useState('res'), [cmd, setCmd] = useState(false), [brutal, setBrutal] = useState(null), [reach, setReach] = useState(null);
  const [toasts, setToasts] = useState([]), [, tick] = useState(0);
  const brutalRes = useRef(null), helpRef = useRef(null), nowRef = useRef(null);

  const toast = useCallback(m => { if (toastProp) return toastProp(m); const id = Math.random(); setToasts(x => [...x.slice(-2), { id, m }]); setTimeout(() => setToasts(x => x.filter(y => y.id !== id)), 3600); }, [toastProp]);
  const confirmar = p => new Promise(res => { brutalRes.current = res; setBrutal(p); });
  const finBrutal = useCallback(v => { setBrutal(null); const r = brutalRes.current; brutalRes.current = null; if (r) r(v); }, []);

  /* ---------- datos: igual que antes, cada minuto y al volver a la pestaña ---------- */
  const load = useCallback(async manual => {
    setBusy(true);
    try {
      const [p, tr] = await Promise.all([api('health?panel=1', { keep: true }), api('trial', { keep: true }).catch(() => null)]);
      setP(p); setT(tr); setLastOk(Date.now()); setErr('');
      if (manual) toast(t.refreshed);
    } catch (e) {
      if ((e.status === 401 || e.status === 403) && onAuth) onAuth(e.status);
      setErr(e.message || 'error');
    } finally { setBusy(false); }
  }, [api, onAuth, toast, t]);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = setInterval(() => { const a = document.activeElement; if (!document.hidden && !(a && a.closest && a.closest('.pa-keep') && a.value)) load(); }, 60000);
    const v = () => { if (!document.hidden && Date.now() - lastOk > 55000) load(); };
    const tk = setInterval(() => tick(x => x + 1), 5000);
    document.addEventListener('visibilitychange', v);
    return () => { clearInterval(id); clearInterval(tk); document.removeEventListener('visibilitychange', v); };
  }, [load, lastOk]);
  const post = (path, body) => api(path, { method: 'POST', body, keep: true });
  const reT = async () => { const tr = await api('trial', { keep: true }).catch(() => null); if (tr) setT(tr); };

  /* ---------- la vista que estabas mirando se recuerda ---------- */
  useEffect(() => { try { const k = localStorage.getItem('synthz:pulsemView'); if (VISTAS.includes(k)) setVista(k); } catch (e) {} }, []);
  const ir = useCallback(k => { if (!VISTAS.includes(k)) k = 'res'; setVista(k); try { localStorage.setItem('synthz:pulsemView', k); } catch (e) {} try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {} }, []);

  /* ---------- números para el menú y «Para atender ahora» ---------- */
  const N = useMemo(() => {
    if (!P) return null;
    const help = P.help || [], fb = P.feedback || [], now = P.now || Date.now();
    const hour = (P.events || []).filter(e => now - e.t < 3600e3 && e.kind !== 'reload');
    const U = P.use || {}, use = [[t.useVercel, U.req || 0, 100000], [t.useUpstash, U.cmd || 0, 500000]];
    return {
      late: help.filter(r => r.urgent).length, open: help.filter(r => r.status === 'open').length, fbNew: fb.filter(x => x.status === 'nuevo').length,
      down: (P.keys || []).filter(k => k.down).length, people: new Set(hour.map(e => e.who)).size, use,
      maint: !!(T && T.maint && T.maint.on), alerts: P.alerts || [],
    };
  }, [P, T, t]);

  const can = !!(P && P.canEdit);
  const vistaN = (P && N) ? { res: N.people, keys: N.down, fb: N.fbNew, help: N.open } : {};

  /* ---------- acciones ---------- */
  const testKeys = async (id, setLbl) => {
    try { const d = await post('trial', id ? { action: 'check', id } : { action: 'check' }); const r = d.keys || []; toast(t.keysResult(r.filter(k => k.ok).length, r.length)); await reT(); }
    catch (e) { toast(t.failed + e.message); } finally { if (setLbl) setLbl(); }
  };
  const maint = async (on, text) => {
    if (on && !(T && T.maint && T.maint.on) && !(await confirmar({ titulo: t.mConfirmT, texto: t.mConfirmP, boton: t.mConfirmB }))) return;
    try { const d = await post('trial', { action: 'maint', on, text: text || '' }); setT(x => Object.assign({}, x, { maint: d.maint })); toast(on ? t.mStarted : t.mStopped); }
    catch (e) { toast(t.failed + e.message); }
  };
  const abrirReach = (sub, nombre) => setReach({ sub, nombre });
  const enviarReach = async txt => {
    if (!txt) { toast(t.reachShort); return false; }
    try { await post('help', { action: 'reach', sub: reach.sub, text: txt }); toast(t.reachSent); setReach(null); load(); return true; }
    catch (e) { toast(t.failed + e.message); return false; }
  };

  /* ---------- Ctrl+K y teclas 1-5 ---------- */
  useEffect(() => {
    const k = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd(c => !c); return; }
      const a = document.activeElement, typing = a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable);
      if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey && /^[1-5]$/.test(e.key) && P) { ir(VISTAS[+e.key - 1]); }
    };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [ir, P]);
  const cmds = useMemo(() => {
    const L = VISTAS.map((v, i) => ({ id: 'v' + v, label: t.cmdGo(t.views[v][0]), keys: t.views[v][1], ico: ICO[v], hint: String(i + 1), run: () => ir(v) }));
    L.push({ id: 'ref', label: t.cmdRefresh, ico: ICO.refresh, run: () => load(true) });
    if (P && (P.help || []).some(r => r.status === 'open')) L.push({ id: 'urg', label: t.cmdUrgent, ico: ICO.help, run: () => { ir('help'); const r = (P.help || []).filter(x => x.status === 'open').sort((a, b) => a.t - b.t)[0]; setTimeout(() => helpRef.current && helpRef.current(r.id), 50); } });
    if (can) {
      L.push({ id: 'tst', label: t.cmdTestAll, ico: ICO.bolt, run: () => { ir('keys'); testKeys(); } });
      L.push({ id: 'now', label: t.cmdNow, ico: ICO.set, run: () => { ir('set'); setTimeout(() => nowRef.current && nowRef.current.focus(), 120); } });
      L.push({ id: 'mnt', label: t.cmdMaint, ico: ICO.warn, run: () => ir('set') });
    }
    return L;
  }, [t, P, can, ir, load]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- pintar ---------- */
  const live = err && P ? t.offline : lastOk ? t.liveAgo(ago(lastOk)) : t.connecting;
  return (
    <div className={'pa' + (demo ? ' pa-demo' : '')} lang={lang}>
      <header className="pa-top">
        <div className="pa-logo" aria-label="Pulsem">
          <svg viewBox="0 0 64 30" aria-hidden="true"><path className="pa-ekg" d="M3 17h13l4-10 6 18 5-13 4 5h26" /></svg>
          <b>Puls<span>em</span></b>
        </div>
        {P ? <span className={'pa-rank r-' + rc(P.rank)}>{P.rank}</span> : null}
        <span className="pa-sp" />
        <button type="button" className="pa-find" onClick={() => setCmd(true)} aria-label={t.search}><I d={ICO.search} /><span>{t.searchShort}</span><kbd>{t.cmdHint}</kbd></button>
        <span className={'pa-live' + (err && P ? ' off' : '')} aria-live="polite"><i />{live}</span>
        <a className="pa-ib" href="/gestion.html" aria-label={t.gestion} title={t.gestion}><I d={["M4 20V11M10 20V5M16 20v-8M21 20H3"]} /></a>
        <button type="button" className="pa-ib pa-lang notr" onClick={() => { const n = lang === 'en' ? 'es' : 'en'; if (onLang) onLang(n); else if (typeof window !== 'undefined' && window.SZ && window.SZ.setLang) window.SZ.setLang(n); else document.documentElement.lang = n; }} aria-label={t.langBtn} title={t.langBtn} lang={lang === 'en' ? 'es' : 'en'}>{lang === 'en' ? 'ES' : 'EN'}</button>
        <button type="button" className={'pa-ib' + (busy ? ' spin' : '')} onClick={() => load(true)} aria-label={t.refresh} title={t.refresh}><I d={ICO.refresh} /></button>
        <a className="pa-ib" href="chat.html" aria-label={t.toChat} title={t.toChat}><I d={ICO.chat} /></a>
      </header>

      {!P ? (err ? <div className="pa-card pa-err"><p>{err}</p><button type="button" className="pa-btn" onClick={() => load(true)}>{t.refresh}</button></div> : <Radar texto={t.loading} />) : (
        <div className="pa-shell">
          <nav className="pa-nav" aria-label="Pulsem">
            <p className="pa-nav-l">{t.team}</p>
            {VISTAS.map((v, i) => (
              <button key={v} type="button" className="pa-nav-i" aria-current={vista === v ? 'page' : undefined} onClick={() => ir(v)} title={t.views[v][0] + ' · ' + (i + 1)}>
                <I d={ICO[v]} /><span>{t.views[v][0]}</span>{vistaN[v] ? <i className={'pa-badge' + (v === 'res' || v === 'keys' ? ' warn' : '')}>{vistaN[v]}</i> : null}
              </button>
            ))}
            <a className="pa-nav-i pa-nav-x" href="chat.html"><I d={ICO.chat} /><span>{t.toChat}</span></a>
          </nav>
          <main className="pa-main">
            <div className="pa-head"><h1>{t.views[vista][0]}</h1><p>{t.views[vista][1]}</p></div>
            {N.alerts.length ? (
              <div className="pa-card pa-alert" role="alert"><b>{t.alertTitle}</b><p>{N.alerts.map(a => t.alertP(a.name, a.t ? ago(a.t) : '')).join(' · ')}</p><small>{t.alertNote}</small></div>
            ) : null}
            <div className="pa-view" key={vista}>
              {vista === 'res' && <Resumen {...{ P, T, N, t, fmt, ago, ir, maint, can, abrirReach, helpRef }} />}
              {vista === 'keys' && <Llaves {...{ P, T, t, fmt, ago, can, post, reT, toast, testKeys, confirmar }} />}
              {vista === 'set' && <Ajustes {...{ P, T, setT, t, fmt, can, post, reT, toast, maint, confirmar, nowRef, loc }} />}
              {vista === 'fb' && <Comentarios {...{ P, setP, t, ago, post, toast, abrirReach }} />}
              {vista === 'help' && <Ayuda {...{ P, t, ago, api, post, toast, load, helpRef }} />}
            </div>
          </main>
        </div>
      )}

      <Paleta abierta={cmd} cmds={cmds} t={t} onCerrar={() => setCmd(false)} />
      <Brutal pedido={brutal} t={t} onFin={finBrutal} />
      <Contactar quien={reach} t={t} onEnviar={enviarReach} onCerrar={() => setReach(null)} />
      <div className="pa-toasts" aria-live="polite">{toasts.map(x => <div key={x.id} className="pa-toast">{x.m}</div>)}</div>
    </div>
  );
}

/* ===================== Resumen ===================== */
function Resumen({ P, T, N, t, fmt, ago, ir, maint, can, abrirReach, helpRef }) {
  const h = salud(P, t), d0 = (P.stat || [])[0] || {}, now = P.now;
  const todo = [];
  if (N.maint) todo.push({ k: 'mt', c: 'bad', txt: t.todoMaint, act: can ? [t.turnOff, () => maint(false)] : [t.go, () => ir('set')] });
  N.alerts.forEach(a => todo.push({ k: 'al' + a.name, c: 'bad', txt: t.todoAlert(a.name), act: [t.go, () => ir('keys')] }));
  if (N.late) todo.push({ k: 'hl', c: 'bad', txt: t.todoHelp(N.late), act: [t.answer, () => { ir('help'); const r = (P.help || []).filter(x => x.urgent).sort((a, b) => a.t - b.t)[0]; setTimeout(() => helpRef.current && r && helpRef.current(r.id), 60); }] });
  else if (N.open) todo.push({ k: 'hn', c: 'warn', txt: t.todoHelpNew(N.open), act: [t.answer, () => ir('help')] });
  if (N.down) todo.push({ k: 'kd', c: 'warn', txt: t.todoKeys(N.down), act: [t.go, () => ir('keys')] });
  N.use.forEach(([n, v, mx]) => { const p = Math.round(v / mx * 100); if (p >= 70) todo.push({ k: 'u' + n, c: p >= 90 ? 'bad' : 'warn', txt: t.todoUse(n.split(' · ')[0], p), act: null }); });
  if (N.fbNew) todo.push({ k: 'fb', c: 'ok', txt: t.todoFb(N.fbNew), act: [t.go, () => ir('fb')] });
  const COL = { ok: '#7fd6b8', busy: '#f2b36b', down: '#ff8f7a', off: '#8d909c' }, SYM = { ok: '✓', busy: '!', down: '!!', off: '–' };
  return (
    <>
      <section className="pa-card pa-todo" aria-labelledby="paTodo">
        <h2 id="paTodo">{t.todoTitle}</h2>
        {todo.length ? <ul>{todo.map(x => (
          <li key={x.k} className={'pa-todo-i ' + x.c}><i /><span>{x.txt}</span>{x.act ? <button type="button" className="pa-mini" onClick={x.act[1]}>{x.act[0]}<I d={ICO.arrow} /></button> : null}</li>
        ))}</ul> : <p className="pa-ok">{t.todoNone}</p>}
      </section>

      <section className="pa-card pa-health" style={{ '--hc': COL[h.lv] }}>
        <h2>{t.healthTitle}<small>{t.healthSmall}</small></h2>
        <div className="pa-h">
          <div className="pa-lamp" aria-hidden="true"><b>{SYM[h.lv]}</b></div>
          <div><h3>{t.lv[h.lv][0]}</h3><p>{t.lv[h.lv][1]}</p><div className="pa-why">{h.why.map(w => <span key={w}>{w}</span>)}</div></div>
        </div>
        <div className="pa-kpis">
          <div className="pa-kpi"><b>{fmt((P.online || []).length)}</b><span>{t.kOnline}</span></div>
          <div className="pa-kpi"><b>{fmt(d0.req || 0)}</b><span>{t.kMsgs}</span></div>
          <div className="pa-kpi"><Saldo valor={fmt(coins(d0.tok || 0))} t={t} /><span>{t.kCoins}</span></div>
          <div className="pa-kpi"><b>{fmt((d0.err || 0) + (d0.fail || 0))}</b><span>{t.kErr}</span></div>
          <div className="pa-kpi"><b>{d0.req ? ((d0.ms || 0) / d0.req / 1000).toFixed(1).replace('.', t === textos('en') ? '.' : ',') : '–'}</b><span>{t.kSec}</span></div>
        </div>
        <div className="pa-use">
          <p>{t.freeMonth((P.use || {}).month || '')}</p>
          {N.use.map(([l, v, mx]) => { const p = Math.min(100, v / mx * 100), c = p >= 90 ? '#ff8f7a' : p >= 70 ? '#f2b36b' : '#7fd6b8'; return (
            <div key={l} className="pa-ub"><span>{l}</span><i><b style={{ width: p.toFixed(1) + '%', background: c }} /></i><em>{fmt(v)} {t.of} {fmt(mx)} · {Math.round(p)} %</em></div>); })}
          {N.use.some(x => x[1] / x[2] >= .7) ? <small className="pa-warn">{t.useWarn}</small> : null}
        </div>
      </section>

      <div className="pa-grid">
        <EnLinea {...{ P, t, ago, abrirReach }} now={now} />
        <Dificultades {...{ P, t, ago, abrirReach }} />
      </div>
      <Carga {...{ P, t, fmt }} />
    </>
  );
}

function EnLinea({ P, t, now, abrirReach }) {
  const [solo, setSolo] = useState(false), [q, setQ] = useState('');
  const conf = new Set((P.events || []).filter(e => e.kind === 'confused' && now - e.t < 15 * 60e3).map(e => e.who));
  const idle = o => !o.msgs && now - (o.since || now) > 4 * 60e3 && o.page === 'chat';
  const L = (P.online || []).map(o => Object.assign({}, o, { tr: (o.errs || 0) + (o.locked ? 3 : 0) + (conf.has(o.name) ? 2 : 0) + (idle(o) ? 1 : 0) }))
    .filter(o => (!solo || o.tr) && (!q || String(o.name || '').toLowerCase().includes(q.toLowerCase()))).sort((a, b) => b.tr - a.tr || (b.t || 0) - (a.t || 0));
  return (
    <section className="pa-card" style={{ '--cg': '#8fb0ff' }}>
      <h2>{t.onlineTitle}<small>{t.people((P.online || []).length)}</small></h2>
      <div className="pa-tools">
        <label className="pa-search pa-keep"><I d={ICO.search} /><input value={q} onChange={e => setQ(e.target.value)} placeholder={t.filterPeople} aria-label={t.filterPeople} /></label>
        <button type="button" className="pa-chip" aria-pressed={solo} onClick={() => setSolo(s => !s)}>{t.onlyTrouble}</button>
      </div>
      <div className="pa-list">
        {L.length ? L.map(o => {
          const sub = /^u:/.test(o.id) ? o.id.slice(2) : '';
          return (
            <div className={'pa-r' + (o.tr >= 3 ? ' hot' : '')} key={o.id}>
              <span className={'pa-av r-' + rc(o.rank)}>{ini(o.name)}</span>
              <div className="pa-tx"><b>{o.name || t.someone} <em className={'pa-rank sm r-' + rc(o.rank)}>{o.rank}</em></b><small>{(t.pages[o.page] || o.page || '—') + ' · ' + (o.mobile ? t.phone : t.computer) + ' · ' + t.stay(Math.round((now - (o.since || now)) / 60000))}</small></div>
              <div className="pa-tags">
                {o.locked ? <span className="pa-tag bad">{t.tNoAi}</span> : null}
                {o.errs ? <span className="pa-tag bad">{t.tErr(o.errs)}</span> : null}
                {conf.has(o.name) ? <span className="pa-tag warn">{t.tLost}</span> : null}
                {idle(o) ? <span className="pa-tag warn">{t.tIdle}</span> : null}
                {o.msgs ? <span className="pa-tag ok">{t.tMsgs(o.msgs)}</span> : null}
                {o.ai ? <span className="pa-tag gold">{o.ai === 'synthz' ? t.tConnected : o.ai === 'puter' ? 'Puter' : o.ai}</span> : null}
                {sub ? <button type="button" className="pa-mini gold" onClick={() => abrirReach(sub, o.name)}>{t.contact}</button> : null}
              </div>
            </div>
          );
        }) : <div className="pa-empty">{t.nobody}</div>}
      </div>
    </section>
  );
}

function Dificultades({ P, t, ago, abrirReach }) {
  const [f, setF] = useState('all'), now = P.now, ev = P.events || [];
  const hit = (e, k) => k === 'all' || e.kind === k || (k === 'error' && e.kind === 'jserror');
  const people = new Set(ev.filter(e => now - e.t < 3600e3 && e.kind !== 'reload').map(e => e.who)).size;
  const L = ev.filter(e => hit(e, f)).slice(0, 80);
  return (
    <section className="pa-card" style={{ '--cg': '#ff8f7a' }}>
      <h2>{t.troubleTitle}<small>{t.troubleSmall}</small></h2>
      <p className="pa-lead">{people ? t.todoTrouble(people) : t.troubleNone}</p>
      <div className="pa-chips">{Object.keys(t.chips).map(k => <button key={k} type="button" className="pa-chip" aria-pressed={f === k} onClick={() => setF(k)}>{t.chips[k]}<i>{ev.filter(e => hit(e, k)).length}</i></button>)}</div>
      <div className="pa-list">
        {L.length ? L.map((e, i) => (
          <div className="pa-r" key={e.t + '-' + i}>
            <span className={'pa-av r-' + rc(e.rank)}>{ini(e.who)}</span>
            <div className="pa-tx"><b>{e.who || t.someone}</b><small>{(e.detail || '—') + ' · ' + (t.pages[e.page] || e.page || '') + ' · ' + ago(e.t)}</small></div>
            <div className="pa-tags"><span className={'pa-tag ' + (/error|noai/.test(e.kind) ? 'bad' : 'warn')}>{t.kinds[e.kind] || e.kind}</span>{e.sub ? <button type="button" className="pa-mini gold" onClick={() => abrirReach(e.sub, e.who)}>{t.contact}</button> : null}</div>
          </div>
        )) : <div className="pa-empty">{t.nothing}</div>}
      </div>
    </section>
  );
}

function Carga({ P, t, fmt }) {
  const pm = P.perMin || [], mx = Math.max(1, ...pm), st = (P.stat || []).slice().reverse(), m2 = Math.max(1, ...st.map(s => s.req || 0));
  return (
    <section className="pa-card" style={{ '--cg': '#e6b65f' }}>
      <h2>{t.loadTitle}<small>{t.loadNow(pm.slice(-5).reduce((a, b) => a + b, 0))}</small></h2>
      <p className="pa-lead">{t.loadLead}</p>
      <div className="pa-bars">{pm.map((v, i) => <i key={i} className={v ? '' : 'z'} style={{ height: Math.max(4, v / mx * 100) + '%', '--i': i }} title={String(v)} />)}</div>
      <div className="pa-axis"><span>{t.ago30}</span><span>{t.now}</span></div>
      <div className="pa-days">{st.map((s, i) => (
        <div className="pa-day" key={s.day}><div className="pa-col"><i style={{ height: Math.max(3, (s.req || 0) / m2 * 100) + '%', '--i': i }} /></div><b>{fmt(s.req || 0)}</b><small>{t.days[new Date(s.day + 'T12:00:00').getDay()]} {s.day.slice(8)}</small></div>
      ))}</div>
    </section>
  );
}

/* ===================== Llaves ===================== */
function Llaves({ P, T, t, fmt, ago, can, post, reT, toast, testKeys, confirmar }) {
  const ks = (T && T.keys) || P.keys || [], mine = (T && T.mine) || {};
  const [probando, setProbando] = useState(''), [abierto, setAbierto] = useState(''), [val, setVal] = useState({}), [cfa, setCfa] = useState((T && T.cfAccount) || '');
  const est = k => { const c = k.check; return k.down ? ['off', t.kPaused(k.down)] : c ? [c.ok ? (c.kind === 'busy' ? 'warn' : 'ok') : c.kind === 'limit' ? 'warn' : 'off', c.state + (c.t ? ' · ' + ago(c.t) : '')] : ['', t.kUntested]; };
  const probar = id => { setProbando(id || '*'); testKeys(id, () => setProbando('')); };
  const quitar = async k => {
    const own = k.mine || (T && T.keys && T.keys.find(x => x.id === k.id && x.mine)), n = k.provName || k.prov;
    if (!(await confirmar({ titulo: t.delQ(n), texto: own ? t.delMine : t.delOther, boton: t.remove }))) return;
    try { await post('trial', { action: 'delkey', id: k.id }); toast(t.deleted(n)); await reT(); } catch (e) { toast(t.failed + e.message); }
  };
  const guardar = async id => {
    const v = (val[id] || '').trim(), body = { action: 'keys' }, nm = PROVS.find(p => p[0] === id)[1];
    if (v) body[id] = v; if (id === 'cloudflare' && cfa.trim()) body.cfAccount = cfa.trim();
    if (!v && !(id === 'cloudflare' && body.cfAccount)) return toast(t.pasteKey(nm));
    if (id === 'groq' && !/^gsk_/.test(v)) return toast(t.badGroq);
    if (id === 'openrouter' && !/^sk-or-/.test(v)) return toast(t.badOr);
    setProbando('m' + id);
    try { const d = await post('trial', body); const r = d.keys || []; toast(t.keysResult(r.filter(k => k.ok).length, r.length)); setVal(x => Object.assign({}, x, { [id]: '' })); await reT(); }
    catch (e) { toast(t.failed + e.message); } finally { setProbando(''); }
  };
  const quitarMia = async id => {
    const nm = PROVS.find(p => p[0] === id)[1];
    if (!(await confirmar({ titulo: t.delQ(nm), texto: t.delMine, boton: t.remove }))) return;
    try { await post('trial', { action: 'keys', [id]: '' }); toast(t.deleted(nm)); await reT(); } catch (e) { toast(t.failed + e.message); }
  };
  return (
    <>
      <section className="pa-card" style={{ '--cg': '#c9566c' }}>
        <h2>{t.keysTitle}<small>{t.keysN(ks.length, (T && T.models && T.models.n) || 0)}</small></h2>
        <p className="pa-lead">{t.keysLead}</p>
        {can && ks.length ? <div className="pa-row-end"><button type="button" className="pa-mini" disabled={!!probando} onClick={() => probar('')}><I d={ICO.bolt} />{probando === '*' ? t.testing : t.testAll}</button></div> : null}
        <div className="pa-keys">
          {ks.length ? ks.map(k => {
            const [d, s] = est(k), own = k.mine || (T && T.keys && T.keys.find(x => x.id === k.id && x.mine)), pct = k.cap ? Math.min(1, (k.n || 0) / k.cap) : 0;
            return (
              <div className="pa-k" key={k.id}>
                <i className={'pa-dot ' + d} aria-hidden="true" />
                <span className="pa-prov" aria-hidden="true">{ini(k.provName || k.prov)}</span>
                <div className="pa-tx"><b>{k.provName || k.prov}</b><small>{(k.owner ? k.owner.name + ' · ' + k.owner.rank : '') + (k.key ? ' · ' + k.key : '') + (k.src === 'vercel' ? ' · Vercel' : '')}</small></div>
                <div className="pa-tx pa-kst"><small>{s}</small>{k.check && !k.check.ok && k.check.detail ? <small className="pa-said">{t.kSaid(k.provName || k.prov)} «{k.check.detail}»</small> : null}</div>
                <div className="pa-meter"><i><b style={{ transform: 'scaleX(' + pct.toFixed(3) + ')' }} /></i><small>{t.kToday(fmt(k.n || 0), fmt(k.cap || 0), fmt(k.tok || 0))}</small></div>
                <div className="pa-tags">{can || own ? <>
                  <button type="button" className="pa-mini" disabled={!!probando} onClick={() => probar(k.id)}>{probando === k.id ? t.testing : t.test}</button>
                  {k.src === 'vercel' ? null : <button type="button" className="pa-mini bad" onClick={() => quitar(k)}>{t.remove}</button>}
                </> : null}</div>
              </div>
            );
          }) : <div className="pa-empty">{t.noKeys}</div>}
        </div>
      </section>
      <section className="pa-card" style={{ '--cg': '#7fd6b8' }}>
        <h2>{t.myKeys}</h2>
        <p className="pa-lead">{P.rank === 'Symmetrix' ? t.myKeysSym : t.myKeysLead}</p>
        <div className="pa-mk">
          {PROVS.map(([id, nm, url, ph]) => {
            const on = !!mine[id], ab = abierto === id;
            return (
              <div className={'pa-mki' + (ab ? ' ab' : '')} key={id}>
                <button type="button" className="pa-mkh" aria-expanded={ab} onClick={() => setAbierto(ab ? '' : id)}>
                  <span className="pa-prov" aria-hidden="true">{ini(nm)}</span><b>{nm}</b><em className={on ? 'on' : ''}>{on ? t.saved : t.noKey}</em>
                </button>
                {ab ? <div className="pa-mkb pa-keep">
                  <input type="text" value={val[id] || ''} onChange={e => setVal(x => Object.assign({}, x, { [id]: e.target.value }))} placeholder={on ? t.pasteOther : ph || nm} autoComplete="off" spellCheck="false" data-lpignore="true" data-1p-ignore aria-label={nm} />
                  {id === 'cloudflare' ? <input type="text" value={cfa} onChange={e => setCfa(e.target.value)} placeholder={t.cfAccount} autoComplete="off" spellCheck="false" aria-label={t.cfAccount} /> : null}
                  <div className="pa-row"><button type="button" className="pa-btn sm" disabled={probando === 'm' + id} onClick={() => guardar(id)}>{probando === 'm' + id ? t.saving : t.saveTest}</button>{on ? <button type="button" className="pa-lnk" onClick={() => quitarMia(id)}>{t.remove}</button> : null}<a className="pa-lnk" href={url} target="_blank" rel="noopener noreferrer">{t.getFree}</a></div>
                </div> : null}
              </div>
            );
          })}
        </div>
        <p className="pa-note">💳 {t.freeOnly}</p>
      </section>
    </>
  );
}

/* ===================== Ajustes ===================== */
function Ajustes({ P, T, setT, t, fmt, can, post, reT, toast, maint, confirmar, nowRef, loc }) {
  const nw = (T && T.now) || null, mt = (T && T.maint) || {}, g = (T && T.google) || {}, dv = (T && T.drive) || {}, sp = P.supa || {};
  const [now, setNow] = useState(nw ? nw.text : ''), [mtxt, setMtxt] = useState(mt.text || ''), [lim, setLim] = useState(P.dayLimit || 20000);
  const [img, setImg] = useState(T && T.imgDay != null ? T.imgDay : 3), [gid, setGid] = useState(g.clientId || ''), [did, setDid] = useState(dv.clientId || ''), [sav, setSav] = useState('');
  const src = s => s === 'vercel' ? t.fromVercel : s === 'panel' ? t.fromPanel : '';
  const run = async (k, f) => { setSav(k); try { await f(); } catch (e) { toast(t.failed + e.message); } finally { setSav(''); } };
  const saveNow = clear => run('now', async () => { const d = await post('trial', { action: 'now', text: clear ? '' : now.trim() }); setT(x => Object.assign({}, x, { now: d.now })); if (clear) setNow(''); toast(d.now ? t.nowSaved : t.nowCleared); });
  const sync = () => run('sb', async () => {
    if (!(await confirmar({ titulo: t.sbConfirmT, texto: t.sbConfirmP, boton: t.sbConfirmB }))) return;
    let cur = 0, n = 0, c = 0; for (let i = 0; i < 200; i++) { const d = await post('trial', { action: 'sbsync', cursor: cur }); n += d.accounts; c += d.chats; toast(t.sbCopying(n)); cur = d.cursor; if (d.done) break; } toast(t.sbDone(n, c));
  });
  const Lbl = ({ k, children }) => <>{sav === k ? t.saving : children}</>;
  return (
    <>
      {!can ? <p className="pa-card pa-ro">{t.readOnly}</p> : null}
      <div className="pa-sets">
        <section className="pa-card pa-set wide" style={{ '--cg': '#b8c4ff' }}>
          <h2>{t.nowTitle}{nw ? <span className="pa-live-tag">● {t.nowLive}</span> : null}</h2>
          <p className="pa-lead">{t.nowLead}</p>
          <div className="pa-now">
            <textarea ref={nowRef} className="pa-keep" rows={2} maxLength={300} value={now} onChange={e => setNow(e.target.value)} placeholder={t.nowPh} aria-label={t.nowTitle} />
            {now.trim() ? <div className="pa-say"><small>{t.nowPreview}</small><p>{t.nowSay(now.trim())}</p></div> : null}
          </div>
          <div className="pa-row"><button type="button" className="pa-btn sm" disabled={!!sav} onClick={() => saveNow(false)}><Lbl k="now">{t.save}</Lbl></button>
            {nw ? <><button type="button" className="pa-btn sm ghost" disabled={!!sav} onClick={() => saveNow(true)}>{t.clear}</button><small className="pa-mute">{(nw.by || t.team0) + ' · ' + new Date(nw.t).toLocaleString(loc, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></> : null}</div>
        </section>

        {can ? <section className={'pa-card pa-set wide' + (mt.on ? ' pa-mton' : '')} style={{ '--cg': mt.on ? '#ff8f7a' : '#e6b65f' }}>
          <h2>{t.mTitle}{mt.on ? <span className="pa-live-tag bad">{t.mOn}</span> : null}</h2>
          <p className="pa-lead">{t.mLead}</p>
          <textarea className="pa-keep" rows={2} maxLength={300} value={mtxt} onChange={e => setMtxt(e.target.value)} placeholder={t.mPh} aria-label={t.mTitle} />
          <div className="pa-row">{mt.on ? <>
            <button type="button" className="pa-btn sm" onClick={() => run('mt', () => maint(true, mtxt))}><Lbl k="mt">{t.mChange}</Lbl></button>
            <button type="button" className="pa-btn sm ghost" onClick={() => run('mt0', () => maint(false, mtxt))}><Lbl k="mt0">{t.mStop}</Lbl></button>
          </> : <button type="button" className="pa-btn sm danger" onClick={() => run('mt', () => maint(true, mtxt))}><I d={ICO.warn} /><Lbl k="mt">{t.mStart}</Lbl></button>}</div>
        </section> : null}

        <section className="pa-card pa-set" style={{ '--cg': '#7fd6b8' }}>
          <h2>{t.limitTitle}</h2>
          <p className="pa-lead">{t.limitLead(fmt(P.dayLimit || 20000), fmt(coins(P.dayLimit || 20000)))}</p>
          {can ? <div className="pa-row"><input className="pa-num pa-keep" type="number" min="1000" max="500000" step="1000" value={lim} onChange={e => setLim(e.target.value)} aria-label={t.limitTitle} />
            <button type="button" className="pa-btn sm" disabled={!!sav} onClick={() => run('lim', async () => { const d = await post('trial', { action: 'limit', dayLimit: +lim }); toast(t.limitSaved(fmt(d.dayLimit))); await reT(); })}><Lbl k="lim">{t.save}</Lbl></button></div>
            : <p className="pa-val">{fmt(coins(P.dayLimit || 20000))} SynXCoin</p>}
        </section>

        <section className="pa-card pa-set" style={{ '--cg': '#ff9a52' }}>
          <h2>{t.imgTitle}</h2>
          <p className="pa-lead">{t.imgLead}</p>
          {can ? <div className="pa-row"><input className="pa-num pa-keep" type="number" min="0" max="50" step="1" value={img} onChange={e => setImg(e.target.value)} aria-label={t.imgTitle} />
            <button type="button" className="pa-btn sm" disabled={!!sav} onClick={() => run('img', async () => { const d = await post('trial', { action: 'limit', imgDay: +img }); setT(x => Object.assign({}, x, { imgDay: d.imgDay })); toast(t.imgSaved(d.imgDay)); })}><Lbl k="img">{t.save}</Lbl></button></div>
            : <p className="pa-val">{img} {t.perDay}</p>}
        </section>

        {[['google', t.gTitle, t.gLead, gid, setGid, g, t.gSaved], ['drive', t.dTitle, t.dLead, did, setDid, dv, t.dSaved]].map(([k, ti, le, v, sv, o, ok]) => (
          <section className="pa-card pa-set" key={k} style={{ '--cg': '#8fb0ff' }}>
            <h2>{ti}</h2><p className="pa-lead">{le}</p>
            {can ? <div className="pa-row pa-keep"><input type="text" value={v} onChange={e => sv(e.target.value)} disabled={o.source === 'vercel'} spellCheck="false" placeholder={k === 'google' ? '123456-abc….apps.googleusercontent.com' : '—'} aria-label={ti} />
              <button type="button" className="pa-btn sm" disabled={o.source === 'vercel' || !!sav} onClick={() => run(k, async () => { await post('trial', { action: k, clientId: v.trim() }); toast(v.trim() ? ok : t.idRemoved); await reT(); })}><Lbl k={k}>{t.save}</Lbl></button></div> : null}
            <small className="pa-mute">{o.clientId ? t.on + src(o.source) : k === 'drive' && g.clientId ? t.usesGoogle : t.off}</small>
          </section>
        ))}

        <section className="pa-card pa-set wide" style={{ '--cg': '#7fd6b8' }}>
          <h2>{t.sbTitle}</h2>
          <p className="pa-lead">{sp.on ? t.sbOn : t.sbOff}</p><p className="pa-lead">{sp.google ? t.sbG : t.sbGOff}</p>
          {(sp.errs || []).length ? <small className="pa-mute">{sp.errs.slice(0, 3).map(x => x.m).join(' · ')}</small> : null}
          {P.rank === 'Prime' && sp.on ? <div className="pa-row"><button type="button" className="pa-mini" disabled={!!sav} onClick={sync}><Lbl k="sb">{t.sbSync}</Lbl></button></div> : null}
        </section>
      </div>
    </>
  );
}

/* ===================== Comentarios ===================== */
function Comentarios({ P, setP, t, ago, post, toast, abrirReach }) {
  const [f, setF] = useState('nuevo'), [q, setQ] = useState(''), F = P.feedback || [];
  const n = k => F.filter(x => k === 'todos' || x.status === k).length;
  const L = F.filter(x => (f === 'todos' || x.status === f) && (!q || (x.text + ' ' + x.who).toLowerCase().includes(q.toLowerCase())));
  const marcar = async (id, status) => {
    const prev = F; setP(p => Object.assign({}, p, { feedback: p.feedback.map(x => x.id === id ? Object.assign({}, x, { status }) : x) }));   /* al instante; si falla, vuelve */
    try { const d = await post('help', { action: 'fbset', id, status }); setP(p => Object.assign({}, p, { feedback: p.feedback.map(x => x.id === d.item.id ? d.item : x) })); toast(t.marked(t.fbChips[status] || status)); }
    catch (e) { setP(p => Object.assign({}, p, { feedback: prev })); toast(t.failed + e.message); }
  };
  return (
    <section className="pa-card" style={{ '--cg': '#e6b65f' }}>
      <h2>{t.fbTitle}<small>{t.fbNew(n('nuevo'))}</small></h2>
      <p className="pa-lead">{t.fbLead}</p>
      <div className="pa-tools">
        <div className="pa-chips">{Object.keys(t.fbChips).map(k => <button key={k} type="button" className="pa-chip" aria-pressed={f === k} onClick={() => setF(k)}>{t.fbChips[k]}<i>{n(k)}</i></button>)}</div>
        <label className="pa-search pa-keep"><I d={ICO.search} /><input value={q} onChange={e => setQ(e.target.value)} placeholder={t.filterFb} aria-label={t.filterFb} /></label>
      </div>
      <div className="pa-list tall">
        {L.length ? L.map(x => (
          <div className="pa-r top" key={x.id}>
            <span className={'pa-av r-' + rc(x.rank)}>{ini(x.who)}</span>
            <div className="pa-tx"><b>{(t.fbCat[x.cat] || x.cat) + ' · ' + x.who}</b><p className="pa-fbt">{x.text}</p><small>{(t.pages[x.page] || x.page || '') + ' · ' + ago(x.t) + (x.by ? ' · ' + t.by(t.fbChips[x.status] || x.status, x.by) : '')}</small></div>
            <div className="pa-tags">
              {x.status !== 'visto' && x.status !== 'resuelto' ? <button type="button" className="pa-mini" onClick={() => marcar(x.id, 'visto')}>{t.seen}</button> : null}
              {x.status !== 'resuelto' ? <button type="button" className="pa-mini gold" onClick={() => marcar(x.id, 'resuelto')}>{t.solved}</button> : null}
              {x.sub ? <button type="button" className="pa-mini" onClick={() => abrirReach(x.sub, x.who)}>{t.answer}</button> : null}
            </div>
          </div>
        )) : <div className="pa-empty">{t.nothing}</div>}
      </div>
    </section>
  );
}

/* ===================== Ayuda: bandeja en dos columnas ===================== */
function Ayuda({ P, t, ago, api, post, toast, load, helpRef }) {
  const w = r => r.status === 'open' ? (r.urgent ? 0 : 1) : 2;
  const H = (P.help || []).slice().sort((a, b) => w(a) - w(b) || a.t - b.t), late = H.filter(r => r.urgent).length;
  const [cur, setCur] = useState(null), [txt, setTxt] = useState(''), [env, setEnv] = useState(false), box = useRef(null);
  const abrir = useCallback(async id => { try { const d = await api('help?id=' + encodeURIComponent(id), { keep: true }); setCur(d.item); } catch (e) { toast(t.failed + e.message); } }, [api, toast, t]);
  useEffect(() => { helpRef.current = abrir; return () => { helpRef.current = null; }; }, [abrir, helpRef]);
  useEffect(() => { if (box.current) box.current.scrollTop = 1e6; }, [cur]);
  useEffect(() => { if (cur && P.help) { abrir(cur.id); } }, [P]); // eslint-disable-line react-hooks/exhaustive-deps
  const decir = async v => {
    v = (v || '').trim(); if (!v || !cur) return; setEnv(true);
    try { const d = await post('help', { action: 'say', id: cur.id, text: v }); setTxt(''); setCur(d.item); } catch (e) { toast(t.failed + e.message); } finally { setEnv(false); }
  };
  const terminar = async () => { try { await post('help', { action: 'close', id: cur.id }); toast(t.ended); setCur(null); load(); } catch (e) { toast(t.failed + e.message); } };
  return (
    <section className={'pa-card pa-inbox' + (cur ? ' con' : '')} style={{ '--cg': '#b8c4ff' }}>
      <h2>{t.helpTitle}<small>{t.helpN(H.filter(r => r.status === 'open').length, late)}</small></h2>
      <p className="pa-lead">{t.helpLead}</p>
      <div className="pa-ib2">
        <div className="pa-list pa-hl">
          {H.length ? H.map(r => (
            <button type="button" key={r.id} className={'pa-r pa-hr' + (r.urgent ? ' urg' : '') + (cur && cur.id === r.id ? ' on' : '')} onClick={() => abrir(r.id)}>
              <span className={'pa-av r-' + rc(r.user && r.user.rank)}>{ini(r.user && (r.user.username || r.user.name))}</span>
              <span className="pa-tx"><b>@{r.user ? r.user.username || r.user.name : ''}</b><small>{r.text + ' · ' + ago(r.t)}</small></span>
              <span className={'pa-tag ' + (r.status === 'open' ? (r.urgent ? 'bad' : 'warn') : 'ok')}>{r.status === 'open' ? (r.urgent ? t.late : t.isNew) : t.with((r.by || {}).name || '')}</span>
            </button>
          )) : <div className="pa-empty">{t.helpNone}</div>}
        </div>
        <div className="pa-conv">
          {cur ? <>
            <div className="pa-conv-h"><button type="button" className="pa-ib pa-back" onClick={() => setCur(null)} aria-label={t.back}><I d={ICO.back} /></button><b>@{(cur.user || {}).username || (cur.user || {}).name}{cur.page ? ' · ' + cur.page : ''}</b>{cur.status !== 'done' ? <button type="button" className="pa-lnk" onClick={terminar}>{t.end}</button> : null}</div>
            <div className="pa-msgs" ref={box}>{(cur.msgs || []).map((m, i) => <div key={i} className={'pa-bub ' + (m.from === 'team' ? 't' : 'u')}><small>{(m.name || '') + (m.rank ? ' · ' + m.rank : '') + ' · ' + ago(m.t)}</small>{m.text}</div>)}</div>
            <div className="pa-quick">{t.quick.map(q => <button key={q} type="button" className="pa-chip" disabled={env} onClick={() => decir(q)}>{q}</button>)}</div>
            <form className="pa-say-f pa-keep" onSubmit={e => { e.preventDefault(); decir(txt); }}>
              <input value={txt} onChange={e => setTxt(e.target.value)} maxLength={1000} placeholder={t.replyPh} aria-label={t.replyPh} autoComplete="off" />
              <button type="submit" className="pa-send" disabled={env || !txt.trim()} aria-label={t.send}><I d={ICO.send} /></button>
            </form>
          </> : <div className="pa-empty pa-pick">{t.pick}</div>}
        </div>
      </div>
    </section>
  );
}
