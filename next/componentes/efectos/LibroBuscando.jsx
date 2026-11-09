'use client';

/* «Buscando en la web»: un libro que hojea sus páginas (idea del Uiverse de anand_4957, rehecho con transform/opacity)
   con la tapa en los colores del tema. Sammuel lo pidió «para cuando busque en la web». Estilos: src/core-css/27-v38-uiverse-efectos.css (.lb-). */
import { useFrase } from '../entrada/FraseCarga';
const T = { es: ['Buscando en la web', 'Buscando'], en: ['Searching the web', 'Searching'] };

/* v4.5 · debajo del título, una frase al azar (con tu nombre a veces) que cambia sola; con `hallazgos` salen las fuentes como chips */
export default function LibroBuscando({ lang = 'es', consulta, hallazgos = [] }) {
  const t = T[lang] || T.es;
  const f = useFrase('buscando', lang, { cada: 2800 });
  return (
    <div className="lb notr" role="status" aria-live="polite">
      <div className="lb-book" aria-hidden="true">
        <i className="lb-sh" /><i className="lb-pg" /><i className="lb-pg" /><i className="lb-pg" /><i className="lb-pg" />
      </div>
      <div className="lb-c">
        <p className="lb-tx">{consulta ? <>{t[1]} <b>«{consulta}»</b></> : <b>{t[0]}</b>}<i>.</i><i>.</i><i>.</i></p>
        {f ? <small key={f} className="lb-fr">{f}</small> : null}
        {hallazgos.length ? <ul className="lb-hs">{hallazgos.slice(0, 4).map((h, i) => <li key={h} style={{ '--d': i * 280 + 'ms' }}>{h}</li>)}</ul> : null}
      </div>
    </div>
  );
}
