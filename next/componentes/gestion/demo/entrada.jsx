import { createRoot } from 'react-dom/client';
import Gestion from '../Gestion';
import { apiDemo } from '../../admin/demo-datos.mjs';
createRoot(document.getElementById('raiz')).render(<Gestion api={/[?&]lento=1/.test(location.search) ? () => new Promise(() => {}) : apiDemo()} demo />);
