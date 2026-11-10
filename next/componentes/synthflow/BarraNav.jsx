'use client';
/* SynthFlow en React · menú de la barra, como la de Claude: Crear, Comparar IAs, Espacios, Obras y Favoritos.
   v4.6 · «Personalización» y «Más» salieron: Ajustes, Idioma, Ayuda, Guía, tu EnerX, Planes y Cerrar sesión están en el panelito del perfil (MenuCuenta.jsx).
   v3.7 · primer pedazo de SynthFlow con lógica en React: el estado («Más» abierto, cuál está activo) vive aquí
   y las acciones van al motor por window.SZFlow (src/chat/16z-puente-react.js). Mismas clases e IDs de antes (.snav, #sNav, data-sn). */
import { useEffect, useState } from 'react';

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' };
const I = {
  new: <svg viewBox="0 0 24 24" {...P}><path d="M12 5v14M5 12h14" /></svg>,
  cmp: <svg viewBox="0 0 24 24" {...P}><rect x="3" y="5" width="7.5" height="14" rx="2" /><rect x="13.5" y="5" width="7.5" height="14" rx="2" /></svg>,
  proj: <svg viewBox="0 0 24 24" {...P}><path d="M4 7.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-6.5L9.6 5.6A2 2 0 0 0 8 5H6a2 2 0 0 0-2 2.5z" /></svg>,
  syn: <svg viewBox="0 0 24 24" {...P}><rect x="3.5" y="5" width="12" height="14" rx="2.5" /><path d="M8.5 5V4.5A1.5 1.5 0 0 1 10 3h8.5A2 2 0 0 1 20.5 5v11A1.5 1.5 0 0 1 19 17.5h-.5" /><path d="M7.5 10l-1.5 2 1.5 2M11.5 10l1.5 2-1.5 2" /></svg>,
  cfg: <svg viewBox="0 0 24 24" {...P}><rect x="3.5" y="7" width="17" height="12.5" rx="2.5" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" /><path d="M3.5 12.5h17" /></svg>,
  more: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="18.5" cy="12" r="1.6" /></svg>,
  star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z" /></svg>,
  guide: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></svg>,
  help: <svg viewBox="0 0 24 24" {...P}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13z" /></svg>,
  batt: <svg viewBox="0 0 24 24" {...P}><rect x="3" y="7.5" width="16" height="9" rx="2.2" /><path d="M21 10.5v3" /><path d="M6 10.5v3M9 10.5v3" strokeWidth="2.2" /></svg>,
  side: <svg viewBox="0 0 24 24" {...P}><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><path d="M9.5 4.5v15" /></svg>,
  chev: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10l5 5 5-5" /></svg>,
};
const TOP = [['new', 'Crear'], ['cmp', 'Comparar IAs'], ['proj', 'Espacios'], ['syn', 'Obras'], ['favs', 'Favoritos']];
const ACT = { new: 'newChat', cmp: 'compare', proj: 'projects', syn: 'synthetics', favs: 'favorites' };

/* lo que está abierto se marca, como en Claude (Comparar, Proyectos o Sintéticos) */
function useActive(){
  const [on, setOn] = useState({});
  useEffect(() => {
    const read = () => {
      const sv = document.getElementById('synv');
      setOn({ cmp: document.body.classList.contains('cmpm'), proj: document.body.classList.contains('pjon'), syn: !!sv && !sv.hidden });
    };
    read();
    const mo = new MutationObserver(read);
    /* clases del body (cmpm, pjon) y el «hidden» de #synv, que el motor crea después */
    mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'hidden'], subtree: true });
    return () => mo.disconnect();
  }, []);
  return on;
}

/* fuera del componente para que React no lo vuelva a crear en cada cambio (si no, se perdería la traducción al inglés) */
function Item({ k, ic, t, d, on, go }){
  return (
    <button type="button" className={'sn-i' + (on ? ' on' : '')} data-sn={k} style={{ '--d': d }} onClick={e => go(k, e)}>
      <span className="sn-ic" aria-hidden="true">{I[ic || k]}</span><span className="sn-t">{t}</span>
    </button>
  );
}

export default function BarraNav(){
  const on = useActive();
  const go = (k, e) => {
    const F = typeof window !== 'undefined' ? window.SZFlow : null;
    try { window.SZ?.SND?.tap?.(); } catch {}
    if (!F) return;   /* el motor todavía no cargó: el clic no hace nada (pasa solo en el primer instante) */
    F[ACT[k]]?.(e.currentTarget);
    if (k !== 'new' && k !== 'favs') F.closeSheet();
  };
  return (
    <nav className="snav" id="sNav" aria-label="Menú de SynthFlow">
      <div className="sn-top">
        <a className="sn-logo" href="index.html" aria-label="Volver a SymphorIA"><span className="snw" /></a>
        <button type="button" className="sn-x" data-sn="hide" aria-label="Cerrar la barra" data-tip="Cerrar la barra" onClick={() => window.SZFlow?.hideBar()}>{I.side}</button>
      </div>
      {TOP.map(([k, t], i) => <Item key={k} k={k} ic={k === 'favs' ? 'star' : undefined} t={t} d={i} on={!!on[k]} go={go} />)}
    </nav>
  );
}
