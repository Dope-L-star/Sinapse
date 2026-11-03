/* Página de prueba del panel nuevo con datos inventados (no va al sitio publicado).
   Armar: node next/componentes/admin/demo/armar.mjs  → abre http://localhost:8787/panel-demo.html con el sitio servido. */
import { createRoot } from 'react-dom/client';
import PanelAdmin from '../PanelAdmin';
import { apiDemo } from '../demo-datos.mjs';

const q = new URLSearchParams(location.search);
if (q.get('lang')) document.documentElement.lang = q.get('lang');
['simple', 'compact', 'noanim', 'noglass'].forEach(c => { if (q.has(c)) document.documentElement.classList.add(c); });
if (q.get('theme')) document.documentElement.dataset.theme = q.get('theme');
createRoot(document.getElementById('raiz')).render(<PanelAdmin api={apiDemo({ rank: q.get('rank') || 'Prime' })} demo />);
