import LegacyPage from '../../../componentes/LegacyPage';
import { inlineStyle } from '../../../contenido/legado/alias';
import reactTree from '../../../contenido/arboles-react/alias.json';

export const metadata = {
  title: 'A.L.I.A.S. · SymphorIA',
  robots: { index: false, follow: false },
  alternates: { canonical: '/alias' },
};

export default function AliasPage() {
  return <LegacyPage page="alias" tree={reactTree.nodes} inlineStyle={inlineStyle} stylesheets={['alias.css', 'movimiento.css']} scripts={['alias-tools.js', 'alias.js', 'movimiento.js']} />;
}
