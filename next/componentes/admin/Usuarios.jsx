'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { I, ICO } from './partes';

/* ===== Pulsem › Usuarios (v4.4): permisos y límites de cada persona
   Lista de cuentas a la izquierda (buscar por @usuario, correo o nombre) y la ficha a la derecha, como la bandeja de Ayuda.
   Todo se guarda con /api/trial (users · user · uset · ublock) y el SERVIDOR lo aplica en cada pedido (api/_permisos.js):
   la página solo muestra. Symmetrix ve; Prime y ZFlow cambian; la cuenta de Prime solo la cambia Prime. ===== */

const FEATS = ['alias', 'image', 'search', 'review', 'smart', 'premium'];
const LIMS = ['day', 'img', 'search', 'smart', 'aliasX', 'credit'];
const STEP = { day: 1000, img: 1, search: 1, smart: 1, aliasX: 1, credit: 0.25 };
const MAX = { day: 5000000, img: 500, search: 2000, smart: 2000, aliasX: 100, credit: 50 };
const rc = r => String(r || '').toLowerCase();
const ini = n => (String(n || '?').replace(/^@/, '').charAt(0).toUpperCase() || '?');
const coins = tok => Math.max(0, Math.round((+tok || 0) * 0.75));
const nombre = u => (u && (u.name || u.handle || u.email)) || '';

/* lo que trae la ficha → lo que se edita (vacío = como para todos) */
function formDe(C) {
  const o = { f: Object.assign({}, C.now.f), note: C.own.note || '' };
  LIMS.forEach(k => { o[k] = C.own[k] == null ? '' : String(C.own[k]); });
  return o;
}
/* lo que se manda: solo las funciones distintas de lo de siempre para esa persona, y los números que tienen algo */
function permDe(F, C) {
  const base = C.team ? Object.fromEntries(FEATS.map(k => [k, true])) : C.base.f, f = {};
  FEATS.forEach(k => { if (F.f[k] !== base[k]) f[k] = F.f[k]; });
  const p = { f, note: F.note.trim() };
  LIMS.forEach(k => { if (String(F[k]).trim() !== '' && Number.isFinite(+F[k])) p[k] = +F[k]; });
  return p;
}

export default function Usuarios({ t: T, fmt, ago, post, toast, confirmar, userRef, can, loc }) {
  const t = T.u;
  const [q, setQ] = useState(''), [L, setL] = useState([]), [cur, setCur] = useState('0'), [done, setDone] = useState(false), [buscando, setBuscando] = useState(false);
  const [log, setLog] = useState([]), [C, setC] = useState(null), [F, setF] = useState(null), [sav, setSav] = useState(''), [abriendo, setAbriendo] = useState('');
  const pedido = useRef(0);

  /* ---------- lista: la primera vuelta al abrir y cada vez que escribes (espera 350 ms) ---------- */
  const buscar = useCallback(async (texto, cursor) => {
    const id = ++pedido.current; setBuscando(true);
    try {
      let acc = [], c = cursor || '0', fin = false;
      /* el servidor recorre de a 200 cuentas: se piden vueltas hasta juntar algo o terminar (máx. 5 para no gastar Upstash) */
      for (let i = 0; i < 5 && !fin && acc.length < 30; i++) {
        const d = await post('trial', Object.assign({ action: 'users', q: texto }, c !== '0' ? { cursor: c } : {}));
        if (id !== pedido.current) return;
        acc = acc.concat(d.users || []); c = d.cursor || '0'; fin = !!d.done;
        if (d.log && !cursor) setLog(d.log);
      }
      setL(x => (cursor ? x.concat(acc) : acc).filter((u, i, a) => a.findIndex(y => y.sub === u.sub) === i)); setCur(c); setDone(fin);
    } catch (e) { toast(T.failed + e.message); } finally { if (id === pedido.current) setBuscando(false); }
  }, [post, toast, T]);
  useEffect(() => { const id = setTimeout(() => buscar(q.trim(), ''), q ? 350 : 0); return () => clearTimeout(id); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- ficha ---------- */
  const abrir = useCallback(async sub => {
    setAbriendo(sub);
    try { const d = await post('trial', { action: 'user', sub }); setC(d); setF(formDe(d)); }
    catch (e) { toast(T.failed + e.message); } finally { setAbriendo(''); }
  }, [post, toast, T]);
  useEffect(() => { if (userRef) { userRef.current = abrir; return () => { userRef.current = null; }; } }, [abrir, userRef]);

  const listo = d => { setC(d); setF(formDe(d)); setL(x => x.map(u => u.sub === d.user.sub ? d.user : u)); if (d.log) setLog(d.log); };
  const sucio = useMemo(() => C && F && JSON.stringify(permDe(F, C)) !== JSON.stringify(permDe(formDe(C), C)), [C, F]);
  const edit = !!(C && C.canEdit);
  const set = (k, v) => setF(x => Object.assign({}, x, { [k]: v }));
  const setFeat = (k, v) => setF(x => Object.assign({}, x, { f: Object.assign({}, x.f, { [k]: v }) }));

  const guardar = async () => {
    setSav('save');
    try { const d = await post('trial', { action: 'uset', sub: C.user.sub, perm: permDe(F, C) }); listo(d); toast(t.saved(nombre(d.user))); }
    catch (e) { toast(T.failed + e.message); } finally { setSav(''); }
  };
  const volver = async () => {
    if (!(await confirmar({ titulo: t.resetT, texto: t.resetP, boton: t.resetB }))) return;
    setSav('reset');
    try { const d = await post('trial', { action: 'uset', sub: C.user.sub, perm: {} }); listo(d); toast(t.resetDone(nombre(d.user))); }
    catch (e) { toast(T.failed + e.message); } finally { setSav(''); }
  };
  const suspender = async on => {
    if (on && !(await confirmar({ titulo: t.blockT(nombre(C.user)), texto: t.blockP, boton: t.blockB }))) return;
    setSav('block');
    try { const d = await post('trial', { action: 'ublock', sub: C.user.sub, on }); listo(d); toast(on ? t.blockedOk(nombre(d.user)) : t.unblockedOk(nombre(d.user))); }
    catch (e) { toast(T.failed + e.message); } finally { setSav(''); }
  };

  /* ---------- pintar ---------- */
  const dayNum = F ? (F.day === '' ? null : +F.day) : null;
  const baseDay = C ? (C.team ? -1 : C.base.day) : 0;
  const quick = C ? [
    ['all', () => set('day', ''), F.day === ''],
    ['x2', () => set('day', String(C.base.day * 2)), dayNum === C.base.day * 2],
    ['x5', () => set('day', String(C.base.day * 5)), dayNum === C.base.day * 5],
    ['unl', () => set('day', '-1'), dayNum === -1],
    ['zero', () => set('day', '0'), dayNum === 0],
  ] : [];
  const efectivoDia = dayNum == null ? baseDay : dayNum;

  return (
    <section className={'pa-card pa-inbox pa-us' + (C ? ' con' : '')} style={{ '--cg': '#c9a2ff' }}>
      <h2>{t.title}<small>{L.length ? L.length + (done ? '' : '+') : ''}</small></h2>
      <p className="pa-lead">{t.lead}</p>
      {!can ? <p className="pa-note pa-ro-n">{t.readOnly}</p> : null}
      <div className="pa-ib2">
        <div className="pa-us-l">
          <label className="pa-search pa-keep"><I d={ICO.search} /><input value={q} onChange={e => setQ(e.target.value)} placeholder={t.find} aria-label={t.find} autoComplete="off" spellCheck="false" /></label>
          <div className="pa-list pa-hl" aria-busy={buscando}>
            {L.length ? L.map(u => (
              <button type="button" key={u.sub} className={'pa-r pa-hr' + (C && C.user.sub === u.sub ? ' on' : '')} onClick={() => abrir(u.sub)} aria-busy={abriendo === u.sub}>
                <span className={'pa-av r-' + rc(u.rank)}>{ini(u.name || u.handle)}</span>
                <span className="pa-tx"><b>{u.name || u.handle} <em className={'pa-rank sm r-' + rc(u.rank)}>{u.rank}</em></b><small>{[u.handle, u.email].filter(Boolean).join(' · ')}</small></span>
                <span className="pa-tags">{u.blocked ? <span className="pa-tag bad">{t.blocked}</span> : null}{u.own ? <span className="pa-tag gold">{t.own}</span> : null}</span>
              </button>
            )) : <div className="pa-empty">{buscando ? t.loadingL : t.none}</div>}
            {!done && L.length ? <button type="button" className="pa-mini pa-more" disabled={buscando} onClick={() => buscar(q.trim(), cur)}>{buscando ? t.loadingL : t.more}</button> : null}
          </div>
          <div className="pa-us-log">
            <p className="pa-us-h">{t.log}</p>
            {log.length ? <ul>{log.slice(0, 6).map((x, i) => <li key={x.t + '-' + i}><b>{x.by}</b> {t.logWhat[x.what] || x.what} <b>{x.who}</b><small> · {ago(x.t)}</small></li>)}</ul> : <p className="pa-mute">{t.logNone}</p>}
          </div>
        </div>

        <div className="pa-conv pa-us-c">
          {C && F ? <>
            <div className="pa-conv-h">
              <button type="button" className="pa-ib pa-back" onClick={() => setC(null)} aria-label={t.back}><I d={ICO.back} /></button>
              <span className={'pa-av r-' + rc(C.user.rank)}>{ini(C.user.name || C.user.handle)}</span>
              <span className="pa-tx"><b>{C.user.name} <em className={'pa-rank sm r-' + rc(C.user.rank)}>{C.user.rank}</em></b><small>{[C.user.handle, C.user.email, t.sessions(C.sessions)].filter(Boolean).join(' · ')}</small></span>
              {C.user.blocked ? <span className="pa-tag bad">{t.blocked}</span> : null}
            </div>
            <div className="pa-us-body">
              {C.team ? <p className="pa-note">{t.team}</p> : null}

              <p className="pa-us-h">{t.today}</p>
              <div className="pa-us-use">
                {['day', 'img', 'search', 'smart'].map(k => {
                  const used = C.used[k] || 0, mx = C.now[k], inf = mx === -1, p = inf || !mx ? (mx === 0 && used ? 100 : 0) : Math.min(100, used / mx * 100);
                  return (
                    <div className="pa-ub" key={k}><span>{t.usedK[k]}</span><i><b style={{ width: p.toFixed(1) + '%', background: p >= 90 ? 'var(--pa-bad)' : p >= 70 ? 'var(--pa-warn)' : 'var(--pa-ok)' }} /></i>
                      <em>{k === 'day' ? t.ofX(fmt(coins(used)), inf ? '∞' : fmt(coins(mx))) + ' SynXCoin' : t.ofX(fmt(used), inf ? '∞' : fmt(mx))}</em></div>
                  );
                })}
              </div>

              <p className="pa-us-h">{t.perms}</p>
              <p className="pa-lead">{t.permsLead}</p>
              <div className="pa-us-f">
                {FEATS.map(k => {
                  const on = !!F.f[k], base = C.team ? true : C.base.f[k], cambiado = on !== base;
                  return (
                    <label key={k} className={'pa-us-sw' + (on ? ' on' : '') + (cambiado ? ' ch' : '') + (k === 'premium' ? ' prem' : '')}>
                      <span className="pa-tx"><b>{t.F[k][0]}{cambiado ? <em className="pa-tag gold">{t.changed}</em> : <em className="pa-tag">{t.asAll}</em>}</b><small>{t.F[k][1]}</small></span>
                      <input type="checkbox" role="switch" checked={on} disabled={!edit} onChange={e => setFeat(k, e.target.checked)} aria-label={t.F[k][0]} />
                      <i aria-hidden="true" />
                    </label>
                  );
                })}
              </div>
              {F.f.premium && !C.premiumOn ? <p className="pa-note">✨ {t.premOff}</p> : null}

              <p className="pa-us-h">{t.lims}</p>
              <p className="pa-lead">{t.limsLead}</p>
              <div className="pa-chips pa-us-q">{quick.map(([k, fn, act]) => <button key={k} type="button" className="pa-chip" aria-pressed={act} disabled={!edit} onClick={fn}>{t.quick[k]}</button>)}</div>
              {efectivoDia === -1 && dayNum === -1 ? <p className="pa-note">♾️ {t.unlOn}</p> : dayNum === 0 ? <p className="pa-note">⛔ {t.zeroOn}</p> : null}
              <div className="pa-us-lim pa-keep">
                {LIMS.map(k => {
                  const b = k === 'day' ? (C.team ? '∞' : C.base.day) : C.team && k !== 'credit' ? C.now[k] : C.base[k];
                  const v = F[k] === '-1' && k === 'day' ? '' : F[k];
                  return (
                    <label key={k} className="pa-us-n">
                      <span>{t.L[k][0]}{t.L[k][1] ? <small> · {t.L[k][1]}</small> : null}</span>
                      <input className="pa-num" type="number" inputMode="decimal" min={k === 'aliasX' ? 1 : 0} max={MAX[k]} step={STEP[k]} value={v} disabled={!edit || (k === 'day' && F.day === '-1')}
                        placeholder={F.day === '-1' && k === 'day' ? '∞' : typeof b === 'number' ? fmt(b) : String(b)} onChange={e => set(k, e.target.value)} />
                      {k === 'day' && F.day !== '' && F.day !== '-1' ? <small className="pa-mute">{t.coins(fmt(coins(+F.day)))}</small> : null}
                    </label>
                  );
                })}
              </div>

              <label className="pa-us-note pa-keep"><span>{t.note}</span><textarea rows={2} maxLength={200} value={F.note} disabled={!edit} onChange={e => set('note', e.target.value)} placeholder={t.notePh} /></label>
              {C.own.by ? <small className="pa-mute">{t.by(C.own.by, new Date(C.own.t).toLocaleString(loc, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</small> : null}
            </div>
            {edit ? (
              <div className={'pa-us-act' + (sucio ? ' dirty' : '')}>
                {sucio ? <span className="pa-us-dirty">● {t.dirty}</span> : null}
                <button type="button" className="pa-btn sm" disabled={!!sav || !sucio} onClick={guardar}><I d={ICO.shield} />{sav === 'save' ? t.saving : t.save}</button>
                {C.user.own ? <button type="button" className="pa-btn sm ghost" disabled={!!sav} onClick={volver}>{t.reset}</button> : null}
                {C.canBlock ? (C.user.blocked
                  ? <button type="button" className="pa-lnk" disabled={!!sav} onClick={() => suspender(false)}>{t.unblock}</button>
                  : <button type="button" className="pa-lnk bad" disabled={!!sav} onClick={() => suspender(true)}>{t.block}</button>) : null}
              </div>
            ) : null}
          </> : <div className="pa-empty pa-pick"><I d={ICO.users} className="pa-pick-i" />{t.pick}</div>}
        </div>
      </div>
    </section>
  );
}
