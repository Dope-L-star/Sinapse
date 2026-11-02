import LegacyPage from '../../../componentes/LegacyPage';
import { inlineStyle } from '../../../contenido/legado/chat';
import SynthFlow from '../../../componentes/synthflow/SynthFlow';

export const metadata = {
  title: 'SynthFlow · SymphorIA',
  description: 'SynthFlow, la conversación de SymphorIA: pregunta, programa, estudia y compara modelos de IA gratis.',
  alternates: { canonical: '/chat.html' },
  openGraph: { title: 'SynthFlow · SymphorIA', type: 'website', url: '/chat.html' },
};

export default function SynthFlowPage() {
  return <LegacyPage page="chat" inlineStyle={inlineStyle} stylesheets={['chat.css', 'core.css', 'movimiento.css']} scripts={['core.js', 'chat.js', 'movimiento.js']} puter><SynthFlow /></LegacyPage>;
}
