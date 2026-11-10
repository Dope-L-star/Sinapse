/* Root layout del sitio público. Las páginas son rutas React con export estático. */
import ClarityConsent from '../../componentes/ClarityConsent';
import AnalyticsConsent from '../../componentes/AnalyticsConsent';
import PuenteVistaTemas from '../../componentes/ajustes/PuenteVistaTemas';
import fs from 'node:fs';
import path from 'node:path';
import Umami from '../../componentes/Umami';   /* v4.3 · visitas con Umami, sin cookies */
export const metadata = {
  metadataBase: new URL('https://symphoria.pages.dev'),
  title: 'Sinapse · Tu IA en una sola mesa',
  description: 'Tu espacio para explorar la inteligencia artificial. Pregunta, crea, programa y compara modelos desde un solo lugar.',
  icons: { icon: '/media/v30/fav-s.png' },
  manifest: '/synthflow.webmanifest',
  appleWebApp: { capable: true, title: 'Sonyx', statusBarStyle: 'black-translucent' },
};

export const viewport = { width: 'device-width', initialScale: 1, colorScheme: 'dark' };

/* <html data-brand> de cada página (chat.html = flow). Lo usan core.js (isFlow: Sona en la
   cabecera del celular, el BETA junto a ella) y el CSS. Va en línea para que esté puesto antes de pintar y antes de core.js.
   verificar-migracion.mjs revisa que coincida con el <html> de cada .html. */
export const BRAND = { chat: 'flow' };
const brandJs = `(function(){var m=${JSON.stringify(BRAND)},p=location.pathname.replace(/^\\/+|(\\.html)?\\/?$/g,'');if(m[p])document.documentElement.dataset.brand=m[p];if(p==='chat'){var h=document.documentElement;h.classList.add('enter');setTimeout(function(){h.classList.add('go')},15000);}})();`;

/* v4.4 · «Entrada»: en SynthFlow el velo (tinta + esqueleto) se pone ANTES de pintar, así no se ve la página armándose.
   Si el motor no arrancara, a los 15 s se quita igual (html.go). */

/* v4.1 · la portada solo para gente nueva: el guardián (portada-guardian.js, en la raíz del repo) va en línea en el <head>
   para que quien ya entró antes salte a SynthFlow antes de pintar nada. Él mismo revisa que la ruta sea la portada.
   Si no se puede leer el archivo al armar (no debería pasar), se carga con <script src>. */
let portadaJs = '';
try { portadaJs = fs.readFileSync(path.join(process.cwd(), '..', 'portada-guardian.js'), 'utf8'); } catch (e) {}

export default function SiteLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: brandJs }} />
        <Umami />
        {portadaJs ? <script dangerouslySetInnerHTML={{ __html: portadaJs }} /> : <script src="/portada-guardian.js" />}
        <style dangerouslySetInnerHTML={{ __html: 'html{background:#0B0A12}' }} />
        <link rel="icon" id="favi" href="/media/v30/fav-s.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://js.puter.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Chakra+Petch:wght@500;600;700&family=Figtree:wght@300..800&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" />
        <link rel="manifest" href="/synthflow.webmanifest" />
        <link rel="apple-touch-icon" href="/media/app/sf-apple-180.png?v=44" />
        <meta name="theme-color" content="#0b0820" />
        <link rel="stylesheet" href="/clarity-consent.css" />
        <link rel="stylesheet" href="/analytics-consent.css" />
      </head>
      <body>{children}<AnalyticsConsent /><ClarityConsent /><PuenteVistaTemas /></body>
    </html>
  );
}
