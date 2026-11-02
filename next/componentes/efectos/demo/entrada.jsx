/* Galería de prueba de los efectos nuevos (no va al sitio). Armar: node next/componentes/efectos/demo/armar.mjs */
import { createRoot } from 'react-dom/client';
import SaldoOjo from '../SaldoOjo';
import PensandoMatrix from '../PensandoMatrix';
import BuscandoRadar from '../BuscandoRadar';

const q = new URLSearchParams(location.search), lang = q.get('lang') === 'en' ? 'en' : 'es';
document.documentElement.lang = lang;
['simple', 'noanim'].forEach(c => { if (q.has(c)) document.documentElement.classList.add(c); });
if (q.get('theme')) document.documentElement.dataset.theme = q.get('theme');
function Galeria() {
  return (
    <main style={{ display: 'grid', gap: 18, padding: 20, maxWidth: 640, margin: '0 auto' }}>
      <h2 style={{ margin: 0 }}>SaldoOjo</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><SaldoOjo valor={12480} lang={lang} recordar={false} /><SaldoOjo valor={305} lang={lang} compacto recordar={false} /></div>
      <h2 style={{ margin: 0 }}>PensandoMatrix</h2>
      <PensandoMatrix lang={lang} /><PensandoMatrix lang={lang} ia="Gemini Flash" />
      <h2 style={{ margin: 0 }}>BuscandoRadar</h2>
      <BuscandoRadar lang={lang} /><BuscandoRadar lang={lang} modo="archivo" /><BuscandoRadar lang={lang} modo="analizar" hallazgos={['wikipedia.org', 'bbc.com', 'eltiempo.com']} />
    </main>
  );
}
createRoot(document.getElementById('raiz')).render(<Galeria />);
