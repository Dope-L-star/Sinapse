import LegacyRuntime from '../../../componentes/LegacyRuntime';
import AliasApp from '../../../componentes/alias/AliasApp';

export const metadata = {
  title: 'A.L.I.A.S. · SymphorIA',
  robots: { index: false, follow: false },
  alternates: { canonical: '/alias.html' },
};

/* v3.8 · A.L.I.A.S. ya es React de verdad (next/componentes/alias/*). alias.js ya no se carga aquí:
   solo el motor (alias-tools.js → window.ALIAS) y la capa de animaciones. */
export default function AliasPage() {
  return (
    <>
      {['alias.css', 'movimiento.css'].map((href) => <link rel="stylesheet" href={`/${href}`} precedence="default" key={href} />)}
      <AliasApp />
      <LegacyRuntime page="alias" scripts={['alias-tools.js', 'movimiento.js']} />
    </>
  );
}
