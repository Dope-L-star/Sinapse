'use client';

/* «Creando la imagen»: anillo que gira con luces del tema por dentro y letras que laten una por una
   (idea del loader «Generating» de dexter-st). Sammuel lo pidió «para las imágenes». Estilos: .gi- en 27-v38-uiverse-efectos.css
   v4.5 · las letras del anillo son una frase corta al azar (con tu nombre a veces) que cambia cada par de segundos (entrada/frases.js);
   debajo, la nota fija «puede tardar unos segundos». */
import { useFrase } from '../entrada/FraseCarga';
const T = { es: ['Creando imagen', 'puede tardar unos segundos'], en: ['Creating image', 'it can take a few seconds'] };

export default function GenerandoImagen({ lang = 'es', texto, tam = 150, nota = true }) {
  const t = T[lang] || T.es;
  const f = useFrase('imagen', lang, { cada: 3200 });
  const s = texto || f || t[0];
  return (
    <div className="gi-w notr">
      <div className="gi" role="status" aria-live="off" aria-label={t[0]} style={{ '--s': tam + 'px' }}>
        <div className="gi-ring" aria-hidden="true" />
        <p className="gi-tx" aria-hidden="true" key={s}>{[...s].map((c, i) => <span key={i} style={{ '--i': i }}>{c === ' ' ? '\u00A0' : c}</span>)}</p>
      </div>
      {nota ? <small className="gi-nota">{t[1]}</small> : null}
    </div>
  );
}
