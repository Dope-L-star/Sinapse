'use client';

/* Archivos que entregó la IA: hasta 3 tarjetas que se turnan al frente en abanico (idea de la tarjeta X/Y/Z de ilkhoeri).
   Sammuel la pidió «para cuando se seleccionen los archivos que ponga la IA en el chat». Solo mueve transform/opacity.
   archivos: [{ nombre, tipo }]; onElegir(i) al tocar una. Estilos: .ax- */
const T = { es: n => n + (n === 1 ? ' archivo listo' : ' archivos listos'), en: n => n + (n === 1 ? ' file ready' : ' files ready') };
const ext = (a) => String(a.tipo || (a.nombre || '').split('.').pop() || '?').slice(0, 4).toUpperCase();

export default function ArchivosXYZ({ archivos = [], lang = 'es', onElegir }) {
  const A = archivos.slice(0, 3), n = A.length;
  if (!n) return null;
  return (
    <div className={'ax notr ax-n' + n} role="group" aria-label={(T[lang] || T.es)(archivos.length)}>
      <div className="ax-stage">
        {A.map((a, i) => (
          <button key={i} type="button" className="ax-card" style={{ '--k': i }} onClick={() => onElegir && onElegir(i)} title={a.nombre}>
            <span className="ax-ext">{ext(a)}</span><small>{a.nombre}</small>
          </button>
        ))}
      </div>
      <p className="ax-tx">{(T[lang] || T.es)(archivos.length)}</p>
    </div>
  );
}
