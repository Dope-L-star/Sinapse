/* Galería de prueba de los efectos nuevos (no va al sitio). Armar: node next/componentes/efectos/demo/armar.mjs */
import { createRoot } from 'react-dom/client';
import SaldoOjo from '../SaldoOjo';
import PensandoMatrix from '../PensandoMatrix';
import BuscandoRadar from '../BuscandoRadar';
import LibroBuscando from '../LibroBuscando';
import GenerandoImagen from '../GenerandoImagen';
import BlobCarga from '../BlobCarga';
import ArchivosXYZ from '../ArchivosXYZ';
import BotonInicio from '../BotonInicio';

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
      <h2 style={{ margin: 0 }}>LibroBuscando</h2>
      <LibroBuscando lang={lang} /><LibroBuscando lang={lang} consulta={lang === 'en' ? 'weather in Bogotá' : 'clima en Bogotá'} />
      <h2 style={{ margin: 0 }}>GenerandoImagen</h2>
      <GenerandoImagen lang={lang} />
      <h2 style={{ margin: 0 }}>BlobCarga</h2>
      <BlobCarga lang={lang} />
      <h2 style={{ margin: 0 }}>ArchivosXYZ</h2>
      <ArchivosXYZ lang={lang} archivos={[{ nombre: 'index.html' }, { nombre: 'estilos.css' }, { nombre: 'app.js' }]} />
      <h2 style={{ margin: 0 }}>BotonInicio</h2>
      <div><BotonInicio lang={lang} /></div>
    </main>
  );
}
createRoot(document.getElementById('raiz')).render(<Galeria />);
