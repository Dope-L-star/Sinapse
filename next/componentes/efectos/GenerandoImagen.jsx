'use client';

/* «Creando la imagen»: anillo que gira con luces del tema por dentro y letras que laten una por una
   (idea del loader «Generating» de dexter-st). Sammuel lo pidió «para las imágenes». Estilos: .gi- en 27-v38-uiverse-efectos.css */
const T = { es: 'Creando imagen', en: 'Creating image' };

export default function GenerandoImagen({ lang = 'es', texto, tam = 150 }) {
  const s = texto || T[lang] || T.es;
  return (
    <div className="gi notr" role="status" aria-live="polite" aria-label={s} style={{ '--s': tam + 'px' }}>
      <div className="gi-ring" aria-hidden="true" />
      <p className="gi-tx" aria-hidden="true">{[...s].map((c, i) => <span key={i} style={{ '--i': i }}>{c === ' ' ? ' ' : c}</span>)}</p>
    </div>
  );
}
