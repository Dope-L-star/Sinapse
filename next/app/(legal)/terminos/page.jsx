import Legal from '../../../componentes/Legal';
import { meta } from '../../../componentes/meta';
import Contenido, { titulo, bajada, tituloEn, bajadaEn, ContenidoEn } from '../../../contenido/terminos';

const desc = 'Las reglas para usar SymphorIA, en palabras sencillas.';
export const metadata = meta('Términos · SymphorIA', desc, '/terminos');

export default function Pagina(){
  return <Legal actual="terminos.html" titulo={titulo} bajada={bajada} tituloEn={tituloEn} bajadaEn={bajadaEn} en={<ContenidoEn />}><Contenido /></Legal>;
}
