/* SynthFlow en React · fondo, brillo, velo y menús flotantes
   v3.7 · pasó de árbol JSON generado a componente JSX propio. Conserva IDs, clases y data-* porque el motor (chat.js) los usa.
   Para cambiar el marcado de SynthFlow se edita AQUÍ; chat.html queda solo para las pruebas viejas y build.mjs (verificar-migracion.mjs revisa que no se pierda ningún ID). */
import Esqueleto from '../entrada/Esqueleto';
import { FraseTelon } from '../entrada/FraseCarga';

export default function Fondo(){
  return (
    <>
      <div className="aurora"><i /><i /><i /></div>
      <div className="grain" />
      <div className="glow" id="glow" />
      {/* v4.4 · «Entrada»: el esqueleto de SynthFlow con el brillo de Gestión mientras arranca */}
      <div id="veil"><Esqueleto forma="chat" /><FraseTelon /></div>
      <div id="scrim" />
      <div className="amenu effm" id="modeMenu" role="menu" aria-label="Modo de uso" hidden />
      <div className="amenu effm" id="effMenu" role="menu" aria-label="Esfuerzo de la IA" hidden />
      <div className="corner" id="corner" aria-hidden="true" style={{bottom:"8px",right:"10px"}} />
    </>
  );
}
