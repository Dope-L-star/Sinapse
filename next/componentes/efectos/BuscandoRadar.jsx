'use client';

/* «Buscando / analizando»: radar que barre y deja puntitos donde «encuentra» algo (idea del Uiverse #41; no copiada).
   modo: 'web' (buscando en internet), 'archivo' (leyendo tu archivo) o 'analizar' (revisando la respuesta).
   hallazgos: lista opcional de textos cortos (fuentes) que aparecen como chips debajo, uno por uno.
   Estilos: src/core-css/25-v38-efectos.css (prefijo .br-). */
const T = {
  es: { web: 'Buscando en internet', archivo: 'Leyendo tu archivo', analizar: 'Analizando la respuesta' },
  en: { web: 'Searching the web', archivo: 'Reading your file', analizar: 'Analyzing the answer' },
};

export default function BuscandoRadar({ lang = 'es', modo = 'web', hallazgos = [], texto }) {
  const t = T[lang] || T.es;
  return (
    <div className="br notr" role="status" aria-live="polite">
      <div className="br-o" aria-hidden="true">
        <i className="br-sweep" /><i className="br-ring" /><i className="br-ring b" /><b className="br-c" />
        <em style={{ '--x': '30%', '--y': '28%', '--d': '0s' }} /><em style={{ '--x': '68%', '--y': '40%', '--d': '.7s' }} /><em style={{ '--x': '44%', '--y': '72%', '--d': '1.4s' }} />
      </div>
      <div className="br-tx">
        <p>{texto || t[modo] || t.web}<i>.</i><i>.</i><i>.</i></p>
        {hallazgos.length ? <ul>{hallazgos.slice(0, 4).map((h, i) => <li key={h} style={{ '--d': i * 280 + 'ms' }}>{h}</li>)}</ul> : null}
      </div>
    </div>
  );
}
