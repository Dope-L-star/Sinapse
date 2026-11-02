'use client';
/* Pared de puertas. Las abiertas llevan a lo que ya existe. Las cerradas son puertas falsas (fake doors):
   al tocarlas se abren, cuentan que aún no existe y dejan votar «La quiero» y, si quieres, dejar el correo.
   Nada se cobra (los pagos siguen apagados). El voto va a /api/config (action:'puerta'); si el servidor no está,
   queda guardado en este equipo y se cuenta igual en pantalla. */
import { useEffect, useState } from 'react';
import { PUERTAS } from './textos';

const VOTOS_KEY = 'synthz:puertas';
const leerVotos = () => { try { return JSON.parse(localStorage.getItem(VOTOS_KEY)) || {}; } catch (e) { return {}; } };
const guardarVotos = (v) => { try { localStorage.setItem(VOTOS_KEY, JSON.stringify(v)); } catch (e) {} };
const okCorreo = (e) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e);

function Icono({ n }) {
  const p = {
    orbe: <><circle cx="12" cy="12" r="8" /><path d="M5 13c2.5-2 4.5 2 7 0s4.5-2 7 0" /></>,
    balanza: <><path d="M12 4v16M6 20h12M5 8h14" /><path d="m5 8-3 6h6L5 8Zm14 0-3 6h6l-3-6Z" /></>,
    infinito: <path d="M7 9c-2.2 0-4 1.3-4 3s1.8 3 4 3c3 0 7-6 10-6 2.2 0 4 1.3 4 3s-1.8 3-4 3c-3 0-7-6-10-6Z" />,
    onda: <path d="M3 12h2m2-4v8m4-11v14m4-10v6m4-3h2" />,
    grupo: <><circle cx="8" cy="9" r="3" /><circle cx="16.5" cy="10" r="2.5" /><path d="M2.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M14 15.2c2.6-.6 5.6.4 6.5 3.8" /></>,
    reloj: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
    pieza: <path d="M9 4h3a2 2 0 1 1 4 0h3v5a2 2 0 1 0 0 4v6h-5a2 2 0 1 0-4 0H5v-5a2 2 0 1 1 0-4V4h4Z" />,
    rayo: <path d="M13 2 5 13h6l-1 9 8-11h-6l1-9Z" />,
    pantalla: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{p[n]}</svg>;
}

function PuertaCerrada({ p, lang, t, cuenta, votada, onVotar }) {
  const [abierta, setAbierta] = useState(false);
  const [correo, setCorreo] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviado, setEnviado] = useState(false);
  const d = p[lang];

  const mandarCorreo = async (e) => {
    e.preventDefault();
    const c = correo.trim().toLowerCase();
    if (!okCorreo(c)) { setAviso(t.correoMal); return; }
    const ok = await onVotar(p.id, c);
    setEnviado(true); setAviso(ok ? t.correoOk : t.fallo);
  };

  return (
    <div className={'pn-puerta cerrada' + (abierta ? ' abierta' : '')}>
      <div className="pn-marco">
        <div className="pn-adentro" aria-hidden={!abierta}>
          <p className="pn-aun">{t.aunNo}</p>
          <p className="pn-quieres">{t.quieres}</p>
          {votada ? <p className="pn-gracias">{t.gracias}</p> : (
            <button type="button" className="pn-quiero" tabIndex={abierta ? 0 : -1} onClick={() => onVotar(p.id)}>♥ {t.meInteresa}</button>
          )}
          <p className="pn-cuenta">{t.personas(cuenta)}</p>
          {enviado ? <p className="pn-aviso ok">{aviso}</p> : (
            <form className="pn-correo" onSubmit={mandarCorreo}>
              <label className="pn-oculto" htmlFor={'pnc-' + p.id}>{t.correo}</label>
              <input id={'pnc-' + p.id} type="email" inputMode="email" autoComplete="email" tabIndex={abierta ? 0 : -1} placeholder={t.correo} value={correo} maxLength={254} onChange={(e) => { setCorreo(e.target.value); setAviso(''); }} />
              <button type="submit" tabIndex={abierta ? 0 : -1}>{t.avisame}</button>
              {aviso ? <p className="pn-aviso" role="status">{aviso}</p> : null}
            </form>
          )}
          <p className="pn-gratis">{t.gratis}</p>
          <button type="button" className="pn-cerrar" tabIndex={abierta ? 0 : -1} onClick={() => setAbierta(false)} aria-label={t.cerrar}>×</button>
        </div>
        <button type="button" className="pn-hoja" onClick={() => setAbierta(true)} aria-expanded={abierta} tabIndex={abierta ? -1 : 0}>
          <span className="pn-ico"><Icono n={p.icono} /></span>
          <span className="pn-etq">{t.cerrada}</span>
          <strong>{d.t}</strong>
          <span className="pn-desc">{d.d}</span>
          <span className="pn-accion">{t.tocar} →</span>
          <i className="pn-pomo" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function Puertas({ lang, t }) {
  const [cuentas, setCuentas] = useState({});
  const [votos, setVotos] = useState({});

  useEffect(() => {
    setVotos(leerVotos());
    fetch('/api/config?puertas=1', { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null)).then((d) => { if (d && d.puertas) setCuentas(d.puertas); }).catch(() => {});
  }, []);

  const votar = async (id, email) => {
    const ya = !!votos[id];
    if (!ya) {
      const v = { ...votos, [id]: Date.now() }; setVotos(v); guardarVotos(v);
      setCuentas((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
    }
    try {
      const r = await fetch('/api/config', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'puerta', id, email: email || undefined, lang }) });
      const d = await r.json().catch(() => null);
      if (d && typeof d.n === 'number') setCuentas((c) => ({ ...c, [id]: Math.max(d.n, c[id] || 0) }));
      return r.ok;
    } catch (e) { return false; }
  };

  return (
    <div className="pn-pared">
      {PUERTAS.map((p) => p.abierta ? (
        <a key={p.id} className="pn-puerta viva" href={p.href}>
          <span className="pn-luz" aria-hidden="true" />
          <span className="pn-ico"><Icono n={p.icono} /></span>
          <span className="pn-etq">{t.abierta}</span>
          <strong>{p[lang].t}</strong>
          <span className="pn-desc">{p[lang].d}</span>
          <span className="pn-accion">{t.abrir} →</span>
        </a>
      ) : (
        <PuertaCerrada key={p.id} p={p} lang={lang} t={t} cuenta={cuentas[p.id] || 0} votada={!!votos[p.id]} onVotar={votar} />
      ))}
    </div>
  );
}
