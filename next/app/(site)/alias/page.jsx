import LegacyRuntime from '../../../componentes/LegacyRuntime';
import AliasApp from '../../../componentes/alias/AliasApp';

export const metadata = {
  title: 'A.L.I.A.S. · SymphorIA',
  robots: { index: false, follow: false },
  alternates: { canonical: '/alias' },
};

/* v4.3 · A.L.I.A.S. como agente que trabaja solo, con la piel «Partitura» (agente.css + partitura.css, importados por el
   componente). Ya no carga alias.css ni alias-mision.css (eran del diseño anterior). Solo el motor: alias-tools.js → window.ALIAS. */
export default function AliasPage() {
  return (
    <>
      <AliasApp />
      <LegacyRuntime page="alias" scripts={['alias-tools.js']} />
    </>
  );
}
