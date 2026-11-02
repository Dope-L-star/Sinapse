'use client';

import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import VistaTemas from './VistaTemas';

/* Puente entre Ajustes (core.js, src/core/14c-v38-vista-temas.js) y React.
   Ajustes avisa con el evento «symphoria:vista-temas» { host, theme, ui, size, lang, locked, hovering } cada vez que
   cambias algo, y con «symphoria:vista-temas-fin» al cerrar. Aquí se monta <VistaTemas> dentro de ese host.
   Si Ajustes abrió antes de que React cargara, el último aviso queda en window.__symphoriaVistaTemas. */
export default function PuenteVistaTemas() {
  useEffect(() => {
    let root = null, host = null;
    const paint = d => {
      if (!d || !d.host || !d.host.isConnected) return;
      if (host !== d.host) { if (root) root.unmount(); host = d.host; root = createRoot(host); }
      root.render(<VistaTemas theme={d.theme} ui={d.ui} size={d.size} lang={d.lang} locked={!!d.locked} hovering={!!d.hovering} />);
    };
    const end = () => { if (root) { const r = root; root = null; host = null; setTimeout(() => r.unmount(), 0); } };
    const onPaint = e => paint(e.detail);
    window.addEventListener('symphoria:vista-temas', onPaint);
    window.addEventListener('symphoria:vista-temas-fin', end);
    window.__symphoriaVistaTemasLista = true;
    paint(window.__symphoriaVistaTemas);
    return () => { window.removeEventListener('symphoria:vista-temas', onPaint); window.removeEventListener('symphoria:vista-temas-fin', end); window.__symphoriaVistaTemasLista = false; end(); };
  }, []);
  return null;
}
