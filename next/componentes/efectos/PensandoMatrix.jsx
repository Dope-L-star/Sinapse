'use client';

import { useMemo } from 'react';

/* «La IA está pensando»: lluvia de caracteres estilo Matrix (idea del Uiverse #47; no copiada) en los colores del tema.
   Cae en columnas suaves detrás del texto; con Animaciones apagadas queda quieta y solo late el texto.
   Estilos: src/core-css/25-v38-efectos.css (prefijo .pm-). */
const T = { es: ['Pensando', 'está pensando'], en: ['Thinking', 'is thinking'] };
const GLIFOS = '01アイウエオカキクケコサシスセソ<>/{}=+*SYMPHORIA';

export default function PensandoMatrix({ lang = 'es', ia, columnas = 22, alto = 64 }) {
  const t = T[lang] || T.es;
  const cols = useMemo(() => Array.from({ length: columnas }, (_, i) => {
    let s = ''; for (let k = 0; k < 10; k++) s += GLIFOS[(i * 7 + k * 13) % GLIFOS.length];
    return { s, d: ((i * 37) % 23) / 10, v: 1.6 + ((i * 53) % 17) / 10 };
  }), [columnas]);
  return (
    <div className="pm notr" role="status" aria-live="polite" style={{ '--h': alto + 'px' }}>
      <div className="pm-rain" aria-hidden="true">
        {cols.map((c, i) => <span key={i} style={{ '--d': c.d + 's', '--v': c.v + 's' }}>{c.s}</span>)}
      </div>
      <p className="pm-tx">{ia ? <><b>{ia}</b> {t[1]}</> : t[0]}<i>.</i><i>.</i><i>.</i></p>
    </div>
  );
}
