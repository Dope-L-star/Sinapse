import Umami from '../../componentes/Umami';   /* v4.3 · visitas con Umami, sin cookies */
/* Marco de Pulsem (panel del equipo) en Next.js: sus estilos de siempre (pulsem.css + core.css) y la capa de animaciones.
   Es otro «layout raíz» (grupo (panel)) porque no comparte nada con Términos y Privacidad. */
export const metadata = {
  metadataBase: new URL('https://sinapse.pages.dev'),
  robots: { index: false, follow: false },
  icons: { icon: '/media/v30/fav-s.png' }
};
export const viewport = { width: 'device-width', initialScale: 1, colorScheme: 'dark' };

export default function Layout({ children }){
  return (
    <html lang="es">
      <head>
        <Umami />
        <link rel="icon" id="favi" href="/media/v30/fav-s.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Chakra+Petch:wght@500;600;700&family=Figtree:wght@300..800&family=IBM+Plex+Mono:wght@400;500&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
