'use client';
/* Ganchos (hooks) que comparten Pulsem y A.L.I.A.S. en React. */
import { useEffect, useRef, useState } from 'react';

/* window.SZ: lo de siempre de core.js (cuenta, llamadas al servidor, avisos, íconos). Llega cuando core.js termina de cargar. */
export function useSZ() {
  const [sz, setSz] = useState(null);
  useEffect(() => {
    const ok = () => { if (window.SZ && window.SZ.api) { setSz(window.SZ); return true; } return false; };
    if (ok()) return undefined;
    const on = () => ok();
    window.addEventListener('symphoria:react-page-ready', on);
    const iv = setInterval(() => { if (ok()) clearInterval(iv); }, 80);
    return () => { clearInterval(iv); window.removeEventListener('symphoria:react-page-ready', on); };
  }, []);
  return sz;
}

/* El idioma sale de <html lang>, que core.js cambia al elegir ES/EN (aquí, en Ajustes o en otra pestaña). */
export function useLang() {
  const [lang, setLang] = useState('es');
  useEffect(() => {
    const H = document.documentElement, read = () => setLang(H.lang === 'en' ? 'en' : 'es');
    read();
    const mo = new MutationObserver(read);
    mo.observe(H, { attributes: true, attributeFilter: ['lang'] });
    return () => mo.disconnect();
  }, []);
  return lang;
}

/* Animaciones apagadas en Ajustes (html.noanim) → todo aparece sin moverse. */
export const still = () => typeof document !== 'undefined' && document.documentElement.classList.contains('noanim');

/* Aparece después de `delay` ms (las tarjetas entran en cascada). */
export function useEntrada(delay) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), still() ? 0 : delay); return () => clearTimeout(t); }, [delay]);
  return on;
}

/* Un número que sube hasta su valor (como los de la portada). */
export function useCuenta(value, dur = 1100) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const a = from.current, b = +value || 0; from.current = b;
    if (a === b || still()) { setV(b); return undefined; }
    let raf = 0; const t0 = performance.now();
    const tick = (now) => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4); setV(a + (b - a) * e); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, dur]);
  return v;
}

/* Re-pinta cada `ms` (para «hace 5 s», «hace 2 min»…). */
export function useReloj(ms) {
  const [, set] = useState(0);
  useEffect(() => { const i = setInterval(() => set((x) => x + 1), ms); return () => clearInterval(i); }, [ms]);
}
