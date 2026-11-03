import LegacyPage from '../../../componentes/LegacyPage';
import { meta } from '../../../componentes/meta';
import { inlineStyle } from '../../../contenido/legado/chat';
import SynthFlow from '../../../componentes/synthflow/SynthFlow';

/* Cloudflare Pages sirve /chat (de /chat.html redirige ahí): el enlace canónico va sin .html */
export const metadata = meta('SynthFlow · SymphorIA', 'SynthFlow, la conversación de SymphorIA: pregunta, programa, estudia y compara modelos de IA gratis.', '/chat');

export default function SynthFlowPage() {
  return <LegacyPage page="chat" inlineStyle={inlineStyle} stylesheets={['chat.css', 'core.css', 'movimiento.css']} scripts={['core.js', 'chat.js', 'movimiento.js']} puter><SynthFlow /></LegacyPage>;
}
