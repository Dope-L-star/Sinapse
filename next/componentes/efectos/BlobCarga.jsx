'use client';

/* Carga de un Sintético: tarjeta de vidrio esmerilado con una mancha de color del tema que rebota por detrás
   (idea del Uiverse de dylanharriscameron). Sammuel lo pidió «para los sintéticos mientras cargan». Estilos: .bc- */
const T = { es: ['Preparando tu Sintético', 'Ya casi está'], en: ['Getting your Synthetic ready', 'Almost there'] };

export default function BlobCarga({ lang = 'es', nombre, alto = 220 }) {
  const t = T[lang] || T.es;
  return (
    <div className="bc notr" role="status" aria-live="polite" style={{ '--h': alto + 'px' }}>
      <i className="bc-blob" aria-hidden="true" /><i className="bc-blob bc-b2" aria-hidden="true" />
      <div className="bc-glass">
        <b>{nombre || t[0]}</b><small>{t[1]}<i>.</i><i>.</i><i>.</i></small>
        <span className="bc-bar" aria-hidden="true"><i /></span>
      </div>
    </div>
  );
}
