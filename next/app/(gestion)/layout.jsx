import Umami from '../../componentes/Umami';   /* v4.3 · visitas con Umami, sin cookies */
/* Marco del tablero de gestión (Fase 3): página aparte de Pulsem, solo para el equipo, sin indexar. */
export const metadata = {
  metadataBase: new URL('https://symphoria.pages.dev'),
  robots: { index: false, follow: false },
  icons: { icon: '/media/v30/fav-s.png' }
};
export const viewport = { width: 'device-width', initialScale: 1, colorScheme: 'dark' };

export default function Layout({ children }){
  return (
    <html lang="es">
      <head>
        <Umami />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Figtree:wght@300..800&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
