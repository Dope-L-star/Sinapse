/* SynthFlow en React · página completa
   v3.7 · pasó de árbol JSON generado a componente JSX propio. Conserva IDs, clases y data-* porque el motor (chat.js) los usa.
   Para cambiar el marcado de SynthFlow se edita AQUÍ; chat.html queda solo para las pruebas viejas y build.mjs (verificar-migracion.mjs revisa que no se pierda ningún ID). */
import Fondo from './Fondo';
import Rail from './Rail';
import Chats from './Chats';
import Cabecera from './Cabecera';
import CajaEscribir from './CajaEscribir';
import TabBar from './TabBar';
import Selector from './Selector';
import PuenteEfectos from './PuenteEfectos';
import IaCaida from './IaCaida';

export default function SynthFlow(){
  return (
    <>
      <Fondo />
      <div className="shell" id="shell">
        <Rail />
        <Chats />
        <div className="main">
          <Cabecera />
          <div className="msgs" id="msgs" data-clarity-mask="true" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversación"><div className="lane" id="lane" /></div>
          <button className="tobottom" id="toBottom" aria-label="Ir al final">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
        </button>
          <CajaEscribir />
          <TabBar />
        </div>
      </div>
      <Selector />
      <PuenteEfectos />
      <IaCaida />
    </>
  );
}
