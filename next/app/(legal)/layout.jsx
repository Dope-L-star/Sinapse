import Script from 'next/script';
import ClarityConsent from '../../componentes/ClarityConsent';
import AnalyticsConsent from '../../componentes/AnalyticsConsent';

/* Marco común de las páginas hechas en Next.js: fuentes, colores oscuros y la capa de animaciones compartida (movimiento.css/js),
   la misma que usan la portada y SynthFlow. */
export const metadata = {
  metadataBase: new URL('https://symphoria.pages.dev'),
  icons: { icon: '/icon.svg' }
};
export const viewport = { width: 'device-width', initialScale: 1, colorScheme: 'dark' };

export default function Layout({ children }){
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Chakra+Petch:wght@500;600;700&family=Figtree:wght@300..800&family=IBM+Plex+Mono:wght@400;500&display=swap" />
        <link rel="stylesheet" href="/movimiento.css" />
        {/* v3.8 · estilo Apple: titulares grandes, secciones que suben, índice y barra de lectura */}
        <link rel="stylesheet" href="/apple.css" />
        <link rel="stylesheet" href="/clarity-consent.css" />
        <link rel="stylesheet" href="/analytics-consent.css" />
      </head>
      <body>
        {children}
        <AnalyticsConsent />
        <ClarityConsent />
        <Script src="/movimiento.js" strategy="afterInteractive" />
        {/* v3.7 · idioma ES/EN en vivo y Ajustes de animaciones y vidrio (el mismo de Ayuda) */}
        <Script src="/ayuda.js" strategy="afterInteractive" />
        <Script src="/apple.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
