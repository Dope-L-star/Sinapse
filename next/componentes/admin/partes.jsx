'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/* Piezas pequeñas del panel. Los estilos de Uiverse que mandó Sammuel se usan como inspiración, no copiados:
   #40 billetera con saldo que se oculta y se revela con un ojo · #41 radar que barre mientras carga ·
   #52 tarjeta brutalista con encabezado de alerta para confirmar lo peligroso. */

export const I = ({ d, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {d.map((x, i) => <path key={i} d={x} />)}
  </svg>
);
export const ICO = {
  res: ['M4 13h4l2-5 4 10 2-5h4'],
  keys: ['M11 12l9-9', 'M17 6l3 3', 'M15 8l2 2', 'M4 15a4 4 0 1 0 8 0a4 4 0 1 0-8 0'],
  set: ['M4 7h10', 'M18 7h2', 'M4 17h4', 'M12 17h8', 'M14 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0', 'M8 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0'],
  fb: ['M5 5h14v10H9l-4 4z'],
  help: ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0', 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5', 'M12 17h.01'],
  chat: ['M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 4V7a2 2 0 0 1 2-2z'],
  refresh: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 4v7h-7'],
  search: ['M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0', 'M20 20l-4-4'],
  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z', 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
  eyeOff: ['M3 3l18 18', 'M10.6 6.1A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.3 3.9', 'M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.4-1.1', 'M9.9 9.9a3 3 0 0 0 4.2 4.2'],
  bolt: ['M13 2L4 14h7l-1 8 9-12h-7z'],
  arrow: ['M5 12h14', 'M13 6l6 6-6 6'],
  back: ['M19 12H5', 'M11 18l-6-6 6-6'],
  warn: ['M12 3l10 18H2z', 'M12 10v4', 'M12 18h.01'],
  send: ['M4 12l16-8-6 16-2-6z', 'M12 14l8-10'],
};

/* #40 · el saldo de SynXCoin se ve como ••••• hasta que tocas el ojo (útil al compartir pantalla) */
export function Saldo({ valor, t }) {
  const [ver, setVer] = useState(false);
  return (
    <span className={'pa-saldo' + (ver ? ' ver' : '')}>
      <b aria-live="polite">{ver ? valor : '•••••'}</b>
      <button type="button" className="pa-ojo" onClick={() => setVer(v => !v)} aria-pressed={ver} aria-label={ver ? t.hideCoins : t.showCoins} title={ver ? t.hideCoins : t.showCoins}>
        <I d={ver ? ICO.eyeOff : ICO.eye} />
      </button>
    </span>
  );
}

/* #41 · radar que barre mientras se leen los datos */
export function Radar({ texto }) {
  return (
    <div className="pa-radar" role="status">
      <div className="pa-radar-o" aria-hidden="true"><i /><b /><em /><em /></div>
      <p>{texto}</p>
    </div>
  );
}

/* #52 · confirmación brutalista para lo que afecta a todos */
export function Brutal({ pedido, t, onFin }) {
  const ok = useRef(null);
  useEffect(() => {
    if (!pedido) return;
    const k = e => { if (e.key === 'Escape') onFin(false); };
    addEventListener('keydown', k); setTimeout(() => ok.current && ok.current.focus(), 30);
    return () => removeEventListener('keydown', k);
  }, [pedido, onFin]);
  if (!pedido) return null;
  return (
    <div className="pa-velo" onPointerDown={e => { if (e.target === e.currentTarget) onFin(false); }}>
      <div className="pa-brutal" role="alertdialog" aria-modal="true" aria-labelledby="paBrT" aria-describedby="paBrP">
        <div className="pa-brutal-h"><I d={ICO.warn} /><span>{t.danger}</span></div>
        <h3 id="paBrT">{pedido.titulo}</h3>
        <p id="paBrP">{pedido.texto}</p>
        <div className="pa-brutal-b">
          <button type="button" className="pa-bb ghost" onClick={() => onFin(false)}>{t.cancel}</button>
          <button type="button" ref={ok} className="pa-bb" onClick={() => onFin(true)}>{pedido.boton || t.sure}</button>
        </div>
      </div>
    </div>
  );
}

/* ventana para «Contactar» o «Responder» a alguien */
export function Contactar({ quien, t, onEnviar, onCerrar }) {
  const [txt, setTxt] = useState(''), [env, setEnv] = useState(false);
  if (!quien) return null;
  const go = async () => { if (txt.trim().length < 2) return onEnviar(null); setEnv(true); const ok = await onEnviar(txt.trim()); setEnv(false); if (ok) setTxt(''); };
  return (
    <div className="pa-velo" onPointerDown={e => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="pa-dlg" role="dialog" aria-modal="true" aria-label={t.reachTitle(quien.nombre || t.thisPerson)}>
        <h3>{t.reachTitle(quien.nombre || t.thisPerson)}</h3>
        <p>{t.reachLead}</p>
        <textarea rows={3} maxLength={1000} autoFocus value={txt} placeholder={t.reachPh} onChange={e => setTxt(e.target.value)} />
        <div className="pa-row-end"><button type="button" className="pa-lnk" onClick={onCerrar}>{t.cancel}</button><button type="button" className="pa-btn" disabled={env} onClick={go}><I d={ICO.send} />{t.send}</button></div>
      </div>
    </div>
  );
}

/* Ctrl+K: ir a una sección o hacer algo sin buscarlo con el ratón */
export function Paleta({ abierta, cmds, t, onCerrar }) {
  const [q, setQ] = useState(''), [i, setI] = useState(0);
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const lista = useMemo(() => cmds.filter(c => !q || norm(c.label + ' ' + (c.keys || '')).includes(norm(q))), [cmds, q]);
  useEffect(() => { if (abierta) { setQ(''); setI(0); } }, [abierta]);
  useEffect(() => { setI(0); }, [q]);
  if (!abierta) return null;
  const run = c => { onCerrar(); setTimeout(() => c.run(), 0); };
  const key = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI(x => Math.min(lista.length - 1, x + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI(x => Math.max(0, x - 1)); }
    else if (e.key === 'Enter' && lista[i]) { e.preventDefault(); run(lista[i]); }
    else if (e.key === 'Escape') onCerrar();
  };
  return (
    <div className="pa-velo top" onPointerDown={e => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="pa-cmd" role="dialog" aria-modal="true" aria-label={t.cmdTitle}>
        <label className="pa-cmd-in"><I d={ICO.search} /><input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={key} placeholder={t.search} aria-label={t.search} /><kbd>Esc</kbd></label>
        <ul role="listbox">
          {lista.length ? lista.map((c, k) => (
            <li key={c.id} role="option" aria-selected={k === i} className={k === i ? 'on' : ''} onPointerEnter={() => setI(k)} onClick={() => run(c)}>
              <I d={c.ico || ICO.arrow} /><span>{c.label}</span>{c.hint ? <kbd>{c.hint}</kbd> : null}
            </li>
          )) : <li className="pa-cmd-none">{t.cmdNone}</li>}
        </ul>
      </div>
    </div>
  );
}
