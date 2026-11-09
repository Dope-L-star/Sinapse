'use client';

import { useMemo } from 'react';
import { useFrase } from '../entrada/FraseCarga';

/* «La IA está pensando»: lluvia de caracteres estilo Matrix (idea del Uiverse #47; no copiada) con palabras del sitio en los colores del tema.
   Cae en columnas suaves detrás del texto; con Animaciones apagadas queda quieta y solo late el texto.
   v4.5 · la frase ya no es siempre «está pensando»: es una al azar (con tu nombre a veces) que cambia cada par de segundos (entrada/frases.js).
   Estilos: src/core-css/25-v38-efectos.css (prefijo .pm-). */
const T = { es: ['Pensando', 'está pensando'], en: ['Thinking', 'is thinking'] };
/* v3.8.1 · Sammuel: «sin tanta letra china, cosas referentes a la página y por ahí una carita de SynthonIA».
   Caen palabras y símbolos del sitio; de vez en cuando cae la carita de SynthonIA. */
const PALABRAS = ['SYMPHORIA', 'SYNTHFLOW', 'A.L.I.A.S', 'ENERX', 'SYNTHONIA', 'PULSEM', 'IA', 'FLOW'];
const SIMBOLOS = '✦⚡◆∿✧•';
const Carita = () => (
  <svg viewBox="0 0 16 18" aria-hidden="true"><circle cx="8" cy="1.6" r="1.4" /><path d="M8 3v2" />
    <rect x="1.5" y="5" width="13" height="10" rx="4.5" /><circle className="ey" cx="5.4" cy="9.6" r="1.25" /><circle className="ey" cx="10.6" cy="9.6" r="1.25" /><path d="M6 12.3q2 1.4 4 0" /></svg>
);

export default function PensandoMatrix({ lang = 'es', ia, columnas = 16, alto = 64 }) {
  const t = T[lang] || T.es;
  const f = useFrase('pensando', lang, { cada: 2600 });
  const cols = useMemo(() => Array.from({ length: columnas }, (_, i) => {
    const cara = i % 6 === 3;                                       /* ~1 de cada 6 columnas: la carita de SynthonIA */
    const w = PALABRAS[(i * 5) % PALABRAS.length], sym = SIMBOLOS[(i * 7) % SIMBOLOS.length];
    return { cara, s: i % 3 === 1 ? sym + ' ' + w.slice(0, 5) : w + ' ' + sym, d: ((i * 37) % 23) / 10, v: 2 + ((i * 53) % 17) / 10 };
  }), [columnas]);
  return (
    <div className="pm notr" role="status" aria-live="polite" style={{ '--h': alto + 'px' }}>
      <div className="pm-rain" aria-hidden="true">
        {cols.map((c, i) => c.cara
          ? <span key={i} className="pm-face" style={{ '--d': c.d + 's', '--v': (c.v + .8) + 's' }}><Carita /></span>
          : <span key={i} style={{ '--d': c.d + 's', '--v': c.v + 's' }}>{c.s}</span>)}
      </div>
      <p className="pm-tx">{ia ? <><b>{ia}</b> · </> : null}<span key={f || 'x'} className="pm-fr">{f || (ia ? t[1] : t[0])}</span><i>.</i><i>.</i><i>.</i></p>
    </div>
  );
}
