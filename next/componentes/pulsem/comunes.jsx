'use client';
/* Piezas pequeñas que usan todas las secciones de Pulsem. Mismas clases de siempre (pulsem.css), así se ve igual. */
import { useEntrada } from './usos';

export const rc = (r) => String(r || '').toLowerCase();
export const inicial = (n) => String(n || '?').replace(/^@/, '').charAt(0).toUpperCase() || '?';

/* Tarjeta que entra en cascada (antes: setTimeout + classList.add('in')). */
export function Card({ i = 0, w = 'w12', cg, id, className = '', style, children }) {
  const on = useEntrada(80 + i * 90);
  return (
    <section id={id} className={'card ' + w + (on ? ' in' : '') + (className ? ' ' + className : '')} style={Object.assign(cg ? { '--cg': cg } : {}, style)}>
      {children}
    </section>
  );
}

export function Av({ rank, name }) {
  return <span className={'av r-' + rc(rank)}>{inicial(name)}</span>;
}

/* Lista que baja por dentro: data-blur le pone el «blurry» arriba y abajo (movimiento.js).
   Va sola dentro de su envoltorio para que la capa del blurry quede pegada a ella sin mezclarse con lo que pinta React. */
export function Lista({ id, style, children }) {
  return <div className="lwrap"><div className="list" id={id} style={style} data-blur="">{children}</div></div>;
}

export function Chips({ items, cur, onPick, counts }) {
  return (
    <div className="chips">
      {items.map(([k, l]) => (
        <button key={k} type="button" aria-pressed={cur === k} onClick={() => onPick(k)}>{l}<i>{counts(k)}</i></button>
      ))}
    </div>
  );
}

/* HTML que arma core.js (logo, íconos de vidrio): es nuestro, no de usuarios. */
export function Html({ as: Tag = 'span', html, ...rest }) {
  return <Tag {...rest} dangerouslySetInnerHTML={{ __html: html || '' }} />;
}
