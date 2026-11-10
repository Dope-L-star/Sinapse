'use client';

/* Botón de inicio con capas de color que giran por dentro y una luz que respira (idea del botón «Start» de dexter-st).
   Colores del tema. Estilos: .bi- */
const T = { es: 'Empezar', en: 'Start' };
const CAPAS = [[0, 25], [.15, 15.9], [.53, 26.4], [.45, 17.8], [1.6, 19.2]];

/* ...resto: id, data-* y aria-* pasan al botón (para las pruebas) */
export default function BotonInicio({ lang = 'es', texto, onClick, type = 'button', disabled, className, ...resto }) {
  const s = texto || T[lang] || T.es;
  return (
    <button {...resto} type={type} className={'bi' + (className ? ' ' + className : '')} onClick={onClick} disabled={disabled}>
      <span className="bi-capas" aria-hidden="true">{CAPAS.map(([d, v], i) => <i key={i} style={{ animationDelay: d + 's', animationDuration: v + 's' }} />)}</span>
      <span className="bi-luz" aria-hidden="true" />
      <span className="bi-tx">{s}</span>
    </button>
  );
}
