/* Lo que cada página repite al compartirse (Next no mezcla openGraph/twitter del marco con los de la página) */
const IMG = { url: '/media/og-symphoria.jpg', width: 1200, height: 630, alt: 'Sinapse: varias IAs gratis en una sola mesa' };
export const meta = (titulo, desc, ruta) => ({
  title: titulo,
  description: desc,
  alternates: { canonical: ruta },
  openGraph: { type: 'website', siteName: 'Sinapse', locale: 'es_CO', title: titulo, description: desc, url: ruta, images: [IMG] },
  twitter: { card: 'summary_large_image', title: titulo, description: desc, images: [IMG.url] }
});
