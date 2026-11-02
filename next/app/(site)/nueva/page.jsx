/* Portada nueva (v4) en React: vista previa en /nueva.html. Cuando Sammuel la apruebe, pasa a ser «/». */
import Portada from '../../../componentes/portada/Portada';
import './portada.css';

export const metadata = {
  title: 'SymphorIA · ¿Qué quieres hacer hoy?',
  description: 'Escribe una vez y varias IAs gratis te responden a la vez. Compara y quédate con la mejor.',
  alternates: { canonical: '/nueva.html' },
  robots: { index: false, follow: true },
  openGraph: { title: 'SymphorIA · ¿Qué quieres hacer hoy?', type: 'website', url: '/nueva.html' },
};

export default function NuevaPortada() {
  return (
    <>
      <link rel="stylesheet" href="/movimiento.css" precedence="default" />
      <Portada />
    </>
  );
}
