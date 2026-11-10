import LegacyRuntime from '../../componentes/LegacyRuntime';
import PortadaApp from '../../componentes/portada/PortadaApp';
import { meta } from '../../componentes/meta';
import Telon from '../../componentes/entrada/Telon';

/* meta(): título, descripción, enlace canónico y la imagen al compartir (og:image) iguales en todas las páginas */
export const metadata = {
  ...meta('Sinapse · Una pregunta. Varias IAs. Tú eliges.', 'Sinapse: escribe una vez y elige entre varias IAs gratis. Sonyx, Sona y Lumbra, en un solo lugar.', '/'),
  title: 'Sinapse · Una pregunta. Varias IAs. Tú eliges.',
};

/* 2026-11-09 · rediseño «Partitura»: la portada ya es React de verdad (next/componentes/portada/*).
   index.js ya no se carga aquí: solo core.js (cuenta, mantenimiento, idioma, Sona) y la capa de animaciones. */
export default function HomePage() {
  return (
    <>
      {['core.css', 'movimiento.css'].map((href) => <link rel="stylesheet" href={`/${href}`} precedence="default" key={href} />)}
      {/* v4.4 · «Entrada» (la carga de Gestión en todo el sitio): telón con el esqueleto y, al estar lista, el titular destella y todo sube en cascada */}
      <Telon centro />
      <PortadaApp />
      <LegacyRuntime page="inicio" scripts={['core.js', 'movimiento.js']} puter={false} />
    </>
  );
}
