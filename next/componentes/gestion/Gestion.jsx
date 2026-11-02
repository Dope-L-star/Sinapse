'use client';

import { useEffect, useMemo, useState } from 'react';
import { TEXTOS } from './textos.mjs';
import { resumen, pct, num } from './calculos.mjs';
import './gestion.css';

/* ===== Tablero de gestión (Fase 3), aparte de Pulsem
   Una sola página para ver cómo va el proyecto: métrica central, calidad, gente, tropiezos, capacidad gratis, voz de la gente,
   estrategia (propuesta) y plan. Lee 'health?panel=1' (lo mismo que Pulsem) con la sesión del equipo; no escribe nada.
   Props: api (opcional; si no viene usa fetch('/api/…') con la cookie de sesión) y demo (datos de prueba). ===== */

async function apiReal(path) {
  const h = {}; try { const s = localStorage.getItem('synthz:sess') || ''; if (s.length > 20) h.authorization = 'Bearer ' + s; } catch (e) {}
  const r = await fetch('/api/' + path, { headers: h, credentials: 'same-origin' });
  let d = {}; try { d = await r.json(); } catch (e) {}
  if (!r.ok) throw Object.assign(new Error(d.error || 'Error ' + r.status), { status: r.status });
  return d;
}
const leerLang = () => { try { const s = localStorage.getItem('synthz:lang'); if (s === 'es' || s === 'en') return s; } catch (e) {} return (typeof navigator !== 'undefined' && /^en/i.test(navigator.language || '')) ? 'en' : 'es'; };

function Barras({ serie, dias, lang }) {
  const max = Math.max(1, ...serie);
  return (
    <div className="gx-bars" role="img" aria-label={serie.join(', ')}>
      {serie.map((v, i) => (
        <div key={i} className={'gx-bar' + (i === serie.length - 1 ? ' hoy' : '')} style={{ '--h': (v / max) }}>
          <i /><small>{dias[i] ? new Date(dias[i] + 'T12:00').toLocaleDateString(lang === 'en' ? 'en-US' : 'es-CO', { weekday: 'narrow' }) : ''}</small>
        </div>
      ))}
    </div>
  );
}
function Anillo({ v, label }) {
  const p = Math.max(0, Math.min(1, v || 0)), c = 2 * Math.PI * 26;
  return (
    <div className={'gx-ring' + (p > .85 ? ' alto' : p > .6 ? ' medio' : '')}>
      <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" /><circle className="v" cx="32" cy="32" r="26" style={{ strokeDasharray: c, strokeDashoffset: c * (1 - p) }} /></svg>
      <b>{pct(p)}</b><span>{label}</span>
    </div>
  );
}

export default function Gestion({ api, demo = false }) {
  const [lang, setLang] = useState('es');
  const [P, setP] = useState(null);
  const [err, setErr] = useState('');
  const [t0, setT0] = useState(0);
  const [, tick] = useState(0);
  const T = TEXTOS[lang];

  useEffect(() => {
    const l = leerLang(); setLang(l); document.documentElement.lang = l;
    try { const c = JSON.parse(localStorage.getItem('synthz:cfg')) || {}; document.documentElement.classList.toggle('noanim', c.anim === false); } catch (e) {}
    const f = e => { if (e.key === 'synthz:lang') { const x = leerLang(); setLang(x); document.documentElement.lang = x; } };
    addEventListener('storage', f); return () => removeEventListener('storage', f);
  }, []);
  useEffect(() => { document.title = T.titulo + ' · SymphorIA'; }, [T]);
  useEffect(() => {
    let vivo = true;
    const call = api || apiReal;
    const traer = () => call('health?panel=1').then(d => { if (!vivo) return; setP(d); setErr(''); setT0(Date.now()); })
      .catch(e => { if (vivo) setErr(e.status === 401 || e.status === 403 ? 'perm' : 'red'); });
    traer();
    const a = setInterval(() => { if (!document.hidden) traer(); }, 60e3), b = setInterval(() => tick(x => x + 1), 5e3);
    return () => { vivo = false; clearInterval(a); clearInterval(b); };
  }, [api]);

  const R = useMemo(() => (P ? resumen(P) : null), [P]);
  const cambiaLang = () => { const l = lang === 'en' ? 'es' : 'en'; setLang(l); document.documentElement.lang = l; try { localStorage.setItem('synthz:lang', l); } catch (e) {} };

  const cab = (
    <header className="gx-top">
      <a className="gx-logo" href="/index.html"><img src="/media/v30/symphoria.svg" alt="" />Symphor<span>IA</span></a>
      <nav>
        {demo ? <span className="gx-demo">{T.demo}</span> : null}
        <a href="/pulsem.html">{T.volver}</a>
        <button type="button" onClick={cambiaLang}>{T.idioma}</button>
      </nav>
    </header>
  );
  if (err === 'perm') return <div className="gx">{cab}<main className="gx-main"><div className="gx-card gx-msg"><p>{T.sinPermiso}</p><a className="gx-btn" href="/pulsem.html">{T.irPulsem}</a></div></main></div>;
  if (!R) return <div className="gx">{cab}<main className="gx-main"><p className="gx-load">{err ? T.error : T.cargando}</p></main></div>;

  const { norte, calidad, gente, tropiezos, capacidad, voz, ayuda } = R;
  const cambio = Math.round(norte.cambio * 100);
  const maxT = Math.max(1, ...tropiezos.map(x => x[1]));
  return (
    <div className="gx">
      {cab}
      <main className="gx-main">
        <div className="gx-head">
          <h1>{T.titulo}</h1>
          <p>{T.bajada}</p>
          {t0 ? <small className="gx-act">{err ? T.error : T.act(Math.round((Date.now() - t0) / 1000))}</small> : null}
        </div>

        <div className="gx-grid">
          <section className="gx-card gx-norte" style={{ '--i': 0 }}>
            <h2>{T.norte}</h2>
            <p className="gx-q">{T.norteQue}</p>
            <div className="gx-big">{num(norte.hoy, lang)}</div>
            <p className={'gx-delta' + (cambio < 0 ? ' baja' : '')}>{T.vsProm(cambio + '%')}</p>
            <Barras serie={norte.serie} dias={norte.dias} lang={lang} />
          </section>

          <section className="gx-card" style={{ '--i': 1 }}>
            <h2>{T.gente}</h2>
            <div className="gx-big sm">{num(gente.online, lang)} <span>{T.enLinea}</span></div>
            <ul className="gx-list">
              <li><b>{gente.conCuenta}</b> {T.conCuenta}</li><li><b>{gente.invitados}</b> {T.invitados}</li>
              <li><b>{gente.cel}</b> {T.cel}</li><li><b>{gente.usando}</b> {T.usando}</li>
            </ul>
          </section>

          <section className="gx-card" style={{ '--i': 2 }}>
            <h2>{T.calidad}</h2>
            <div className="gx-kpis">
              <div><b>{pct(calidad.errPct, 1)}</b><span>{T.errores}</span></div>
              <div><b>{pct(calidad.failPct, 1)}</b><span>{T.fallos}</span></div>
              <div><b>{(calidad.msProm / 1000).toFixed(1)} s</b><span>{T.tiempo}</span></div>
              <div><b>{num(calidad.req, lang)}</b><span>{T.pedidos}</span></div>
            </div>
          </section>

          <section className="gx-card gx-wide" style={{ '--i': 3 }}>
            <h2>{T.tropiezos}</h2>
            {tropiezos.length ? <ul className="gx-hbars">{tropiezos.slice(0, 6).map(([k, v]) => (
              <li key={k}><span>{T.K[k] || k}</span><i style={{ '--w': v / maxT }} /><b>{num(v, lang)}</b></li>
            ))}</ul> : <p className="gx-q">{T.sinTropiezos}</p>}
          </section>

          <section className="gx-card" style={{ '--i': 4 }}>
            <h2>{T.capacidad}</h2>
            <div className="gx-rings">
              <Anillo v={capacidad.cupoPct} label={T.cupo} />
              {capacidad.tope ? <Anillo v={capacidad.topePct} label={T.tope} /> : null}
            </div>
            <p className="gx-q">{T.llaves(capacidad.llaves, capacidad.llavesMal)}</p>
            {capacidad.mes ? <p className="gx-q">{T.mes(num(capacidad.mes.req, lang), num(capacidad.mes.cmd, lang))}</p> : null}
            <p className="gx-ok">{T.costo}</p>
          </section>

          <section className="gx-card" style={{ '--i': 5 }}>
            <h2>{T.voz}</h2>
            <ul className="gx-chips">{voz.porTipo.map(([k, v]) => <li key={k}>{T.C[k] || k} <b>{v}</b></li>)}</ul>
            <p className="gx-q">{T.vozNuevos(voz.nuevos)}</p>
            <p className="gx-q">{T.ayuda(ayuda.abiertas, ayuda.urgentes)}</p>
          </section>

          <section className="gx-card gx-plan-c" style={{ '--i': 6 }}>
            <h2>{T.plan}</h2>
            <ol className="gx-plan">{T.P.map(([a, s]) => <li key={a} className={s}><span>{a}</span><em>{T.estado[s]}</em></li>)}</ol>
          </section>
          <section className="gx-card gx-full gx-estr" style={{ '--i': 7 }}>
            <h2>{T.estrategia}</h2>
            <p className="gx-nota">{T.estrategiaNota}</p>
            <dl>{T.E.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
          </section>

        </div>
      </main>
    </div>
  );
}
