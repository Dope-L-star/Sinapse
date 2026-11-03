import Legal from '../../../componentes/Legal';
import { meta } from '../../../componentes/meta';
import Contenido, { titulo, bajada, tituloEn, bajadaEn, ContenidoEn } from '../../../contenido/privacidad';

const desc = 'Qué datos guarda SymphorIA, para qué y cómo los cuidamos. En palabras sencillas.';
export const metadata = meta('Privacidad · SymphorIA', desc, '/privacidad');

export default function Pagina(){
  return <Legal actual="privacidad.html" titulo={titulo} bajada={bajada} tituloEn={tituloEn} bajadaEn={bajadaEn} en={<ContenidoEn />}><Contenido /></Legal>;
}
