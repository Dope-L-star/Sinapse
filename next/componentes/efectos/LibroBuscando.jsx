'use client';

/* «Buscando en la web»: un libro que hojea sus páginas (idea del Uiverse de anand_4957, rehecho con transform/opacity)
   con la tapa en los colores del tema. Sammuel lo pidió «para cuando busque en la web». Estilos: src/core-css/27-v38-uiverse-efectos.css (.lb-). */
const T = { es: ['Buscando en la web', 'Buscando'], en: ['Searching the web', 'Searching'] };

export default function LibroBuscando({ lang = 'es', consulta }) {
  const t = T[lang] || T.es;
  return (
    <div className="lb notr" role="status" aria-live="polite">
      <div className="lb-book" aria-hidden="true">
        <i className="lb-sh" /><i className="lb-pg" /><i className="lb-pg" /><i className="lb-pg" /><i className="lb-pg" />
      </div>
      <p className="lb-tx">{consulta ? <>{t[1]} <b>«{consulta}»</b></> : t[0]}<i>.</i><i>.</i><i>.</i></p>
    </div>
  );
}
