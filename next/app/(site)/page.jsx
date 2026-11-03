import LegacyPage from '../../componentes/LegacyPage';
import { meta } from '../../componentes/meta';
import { inlineStyle } from '../../contenido/legado/index';
import reactTree from '../../contenido/arboles-react/index.json';

/* meta(): título, descripción, enlace canónico y la imagen al compartir (og:image) iguales en todas las páginas */
export const metadata = {
  ...meta('SymphorIA · En sintonía con la IA', 'SymphorIA: pregunta, crea, programa y compara modelos de inteligencia artificial desde un solo lugar.', '/'),
  title: 'SymphorIA · Diseña a la velocidad del pensamiento. En sintonía con la IA.',
};

export default function HomePage() {
  return <LegacyPage page="inicio" tree={reactTree.nodes} inlineStyle={inlineStyle} stylesheets={['index.css', 'core.css', 'movimiento.css']} scripts={['core.js', 'synthonia.js', 'index.js', 'movimiento.js']} puter />;
}
