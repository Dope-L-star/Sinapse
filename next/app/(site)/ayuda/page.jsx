import LegacyPage from '../../../componentes/LegacyPage';
import { meta } from '../../../componentes/meta';
import { inlineStyle } from '../../../contenido/legado/ayuda';
import reactTree from '../../../contenido/arboles-react/ayuda.json';

export const metadata = meta('Ayuda · SymphorIA', 'Respuestas rápidas sobre SymphorIA y cómo hablar con el equipo.', '/ayuda');

export default function AyudaPage() {
  return <LegacyPage page="ayuda" tree={reactTree.nodes} inlineStyle={inlineStyle} stylesheets={['movimiento.css', 'apple.css']} scripts={['ayuda.js', 'movimiento.js', 'apple.js']} />;
}
