import Gestion from '../../../componentes/gestion/Gestion';

export const metadata = { title: 'Gestión · Sinapse', description: 'Tablero de gestión del equipo de Sinapse.', alternates: { canonical: '/gestion.html' } };

export default function Pagina(){
  return <Gestion />;
}
