import LegacyPage from '../../../componentes/LegacyPage';
import { meta } from '../../../componentes/meta';
import { inlineStyle } from '../../../contenido/legado/ayuda';
import reactTree from '../../../contenido/arboles-react/ayuda.json';
import Telon from '../../../componentes/entrada/Telon';

export const metadata = meta('Ayuda · SymphorIA', 'Respuestas rápidas sobre SymphorIA y cómo hablar con el equipo.', '/ayuda');

export default function AyudaPage() {
  /* el telón espera a ayuda.js: él pone el idioma, así nadie ve el texto cambiar de español a inglés */
  return <><Telon espera="legacy" /><LegacyPage page="ayuda" tree={reactTree.nodes} inlineStyle={inlineStyle} stylesheets={['movimiento.css', 'apple.css']} scripts={['ayuda.js', 'movimiento.js', 'apple.js']} /></>;
}
