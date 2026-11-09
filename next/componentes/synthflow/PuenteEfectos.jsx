'use client';
/* SynthFlow en React · puente para los efectos nuevos (next/componentes/efectos/)
   v3.8 · el motor (chat.js) todavía arma los mensajes a mano; para que use los componentes React de la Fase 2
   sin esperar a que la lista de mensajes migre, este puente deja window.SZFx.mount(host, nombre, props).
   Cada efecto vive en su propia raíz React dentro de «host»; las raíces cuyo host ya salió de la página se desmontan solas.
   Si el puente no está (chat.html viejo), el motor sigue con sus puntitos de siempre. */
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import PensandoMatrix from '../efectos/PensandoMatrix';
import BuscandoRadar from '../efectos/BuscandoRadar';
import LibroBuscando from '../efectos/LibroBuscando';
import GenerandoImagen from '../efectos/GenerandoImagen';
import BlobCarga from '../efectos/BlobCarga';
import '../entrada/frases';   /* deja window.SZFrases para el motor viejo (las frases que cambian mientras la IA piensa) */

/* v4.5 · las animaciones de carga que mandó Sammuel, cada una donde le toca:
   matrix → la IA piensa · libro → busca en internet · radar → encontró fuentes / lee un archivo · imagen → crea una imagen · blob → se prepara un Sintético */
const FX = { matrix: PensandoMatrix, radar: BuscandoRadar, libro: LibroBuscando, imagen: GenerandoImagen, blob: BlobCarga };

export default function PuenteEfectos(){
  useEffect(() => {
    const roots = new Map();
    const sweep = () => roots.forEach((r, h) => { if (!h.isConnected){ r.unmount(); roots.delete(h); } });
    const api = {
      mount(host, name, props = {}){
        const C = FX[name]; if (!C || !host) return false;
        sweep();
        let r = roots.get(host); if (!r){ r = createRoot(host); roots.set(host, r); }
        r.render(<C {...props} />);
        return true;
      },
      unmount(host){ const r = roots.get(host); if (r){ r.unmount(); roots.delete(host); } },
    };
    window.SZFx = Object.freeze(api);
    const iv = setInterval(sweep, 5000);
    return () => { clearInterval(iv); roots.forEach(r => r.unmount()); roots.clear(); delete window.SZFx; };
  }, []);
  return null;
}
