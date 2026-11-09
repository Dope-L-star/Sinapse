/* SymphorIA · «Entrada» · el esqueleto con brillo (la animación de carga del tablero de Gestión, para cualquier sitio).
   Se usa mientras algo carga, con la FORMA de lo que va a aparecer (no un «Cargando…» suelto):
     <Esqueleto forma="tablero" />   tablero de Gestión (1 grande + 5)
     <Esqueleto forma="panel" />     panel de Pulsem (4 cifras + 2 anchos)
     <Esqueleto forma="lista" n={3} />  filas con su ícono redondo (listas de IAs, rutas, chats)
     <Esqueleto forma="tarjeta" />   una sola tarjeta (puertas, avisos)
     <Esqueleto forma="pagina" centro />  la página entera (lo usa el telón)
     <Esqueleto forma="chat" />      SynthFlow: lateral, saludo y la caja de escribir
   Es solo dibujo: va con aria-hidden. Quien lo usa pone al lado un texto con role="status" (ES/EN) para lectores de pantalla.
   Estilos en ./entrada.css (se importan aquí: basta con usar el componente). */
import './entrada.css';

const B = ({ i, className = '', children }) => <div className={'sy-b ' + className} style={{ '--i': i }}>{children !== undefined ? children : <><i /><b /><i /><i /></>}</div>;

export default function Esqueleto({ forma = 'tarjeta', n = 3, centro = false, className = '' }) {
  let hijos;
  if (forma === 'tablero') hijos = ['', '', '', 'ancho', '', ''].map((c, i) => <B key={i} i={i} className={c} />);
  else if (forma === 'panel') hijos = ['', '', '', '', 'ancho', 'ancho'].map((c, i) => <B key={i} i={i} className={c} />);
  else if (forma === 'lista') hijos = Array.from({ length: n }, (_, i) => <B key={i} i={i}><b /><i /><i /></B>);
  else if (forma === 'pagina') hijos = <>
    <div className="sy-t"><b /><i /><i /></div>
    {centro ? <B i={1} className="sy-caja"><i /><i /></B> : null}
    {(centro ? ['', '', ''] : ['ancho', '', '', '', 'ancho']).map((c, i) => <B key={i} i={i + 2} className={c} />)}
  </>;
  else if (forma === 'chat') hijos = <>
    <div className="sy-lado">{[0, 1, 2, 3, 4, 5, 6].map(i => <B key={i} i={i}>{null}</B>)}</div>
    <div className="sy-centro">
      <B i={1} className="sy-titulo">{null}</B>
      <div className="sy-fila">{[2, 3, 4].map(i => <B key={i} i={i}>{null}</B>)}</div>
      <B i={5} className="sy-caja">{null}</B>
    </div>
  </>;
  else hijos = <B i={0} />;
  return <div className={'sy-esq ' + forma + (centro ? ' centro' : '') + (className ? ' ' + className : '')} aria-hidden="true">{hijos}</div>;
}
