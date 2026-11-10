import LegacyRuntime from '../../../componentes/LegacyRuntime';
import PuertaAlias from '../../../componentes/alias/PuertaAlias';
import Telon from '../../../componentes/entrada/Telon';

export const metadata = {
  title: 'Quoryn · Sinapse',
  robots: { index: false, follow: false },
  alternates: { canonical: '/alias' },
};

/* v4.3 · A.L.I.A.S. como agente que trabaja solo, con la piel «Partitura» (agente.css + partitura.css, importados por el
   componente). Ya no carga alias.css ni alias-mision.css (eran del diseño anterior). Solo el motor: alias-tools.js → window.ALIAS. */
/* v4.5: PuertaAlias revisa la cuenta antes de montar A.L.I.A.S. (solo el equipo); a los demás los lleva a SynthFlow */
export default function AliasPage() {
  return (
    <>
      <Telon centro />
      <PuertaAlias />
      <LegacyRuntime page="alias" scripts={['alias-tools.js']} />
    </>
  );
}
