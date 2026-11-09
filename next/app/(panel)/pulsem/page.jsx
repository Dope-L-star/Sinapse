import LegacyRuntime from '../../../componentes/LegacyRuntime';
import PulsemApp from '../../../componentes/pulsem/PulsemApp';

export const metadata = {
  title: 'Pulsem · Sinapse',
  description: 'Pulsem: el panel privado del equipo de Sinapse (salud del sitio y avisos). Solo para el equipo.',
  robots: { index: false, follow: false },
};

/* v3.8 · Pulsem ya es React de verdad (next/componentes/pulsem/*). pulsem.js ya no se carga aquí:
   solo core.js (cuenta, servidor, SynthonIA, mantenimiento) y la capa de animaciones. */
export default function Pulsem() {
  return (
    <>
      {['pulsem.css', 'core.css', 'movimiento.css'].map((href) => <link rel="stylesheet" href={`/${href}`} precedence="default" key={href} />)}
      <PulsemApp />
      <LegacyRuntime page="pulsem" scripts={['core.js', 'movimiento.js']} />
    </>
  );
}
