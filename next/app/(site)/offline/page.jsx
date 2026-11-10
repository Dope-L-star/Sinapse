import LegacyPage from '../../../componentes/LegacyPage';
import { inlineStyle } from '../../../contenido/legado/offline';
import reactTree from '../../../contenido/arboles-react/offline.json';
import Telon from '../../../componentes/entrada/Telon';

export const metadata = {
  title: 'Sin conexión · Sonyx',
  robots: { index: false, follow: false },
};

/* 2026-11-09 · rediseño «Partitura»: «se cortó la música». Va en línea (no en un .css aparte) porque esta página
   tiene que verse bien justo cuando no hay internet: las cinco líneas de la marca, cortadas a la mitad. */
const PARTITURA = `
html,body{background:radial-gradient(800px 480px at 50% -10%,rgba(123,63,242,.18),transparent 62%),#0B0A12 !important}
h1{font-family:'Bricolage Grotesque',system-ui,sans-serif !important;letter-spacing:-.03em}
.o-orb{animation:none !important;width:220px !important;height:84px !important;border-radius:0 !important;background:none !important;box-shadow:none !important;border:0 !important;position:relative}
.o-orb i,.o-orb b{display:none !important}
.o-orb::before,.o-orb::after{content:"" !important;position:absolute;top:12px !important;right:auto;z-index:1;font-size:0;text-shadow:none !important;opacity:1;animation:none;height:60px;width:42%;
  background:linear-gradient(#3DE0FF,#3DE0FF) 0 0/100% 2px no-repeat,linear-gradient(#7B3FF2,#7B3FF2) 0 14px/100% 2px no-repeat,linear-gradient(#FF3D9A,#FF3D9A) 0 28px/100% 2px no-repeat,linear-gradient(#FF7A45,#FF7A45) 0 42px/100% 2px no-repeat,linear-gradient(#FFC857,#FFC857) 0 56px/100% 2px no-repeat}
.o-orb::before{left:0;transform:none !important;animation:none !important}
.o-orb::after{right:0 !important;left:auto;opacity:.3;transform:none}
@media (prefers-reduced-motion:no-preference){.o-orb::after{animation:ptCorte 2.4s ease-in-out infinite alternate}}
@keyframes ptCorte{to{opacity:.12;transform:translateX(6px)}}
`;

export default function OfflinePage() {
  return <><Telon centro /><LegacyPage page="offline" tree={reactTree.nodes} inlineStyle={inlineStyle + PARTITURA} /></>;
}
