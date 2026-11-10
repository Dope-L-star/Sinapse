'use client';
/* Barra superior común de «Partitura»: la misma en portada, SynthFlow, Obertura y legales (Quoryn, antes A.L.I.A.S., vive dentro de SynthFlow).
   Uso: import BarraSuperior from '../partitura/BarraSuperior'; <BarraSuperior producto="synthflow" idioma="es" />
   Requiere importar una vez './partitura.css' (tokens y piezas base). */
import './partitura.css';

const PRODUCTOS = [
  { id: 'synthflow', nombre: 'Sonyx', href: '/chat.html', color: 'var(--c)' },
  { id: 'obertura', nombre: 'Lumbra', href: '/#obertura', color: 'var(--g)' },
];
const T = {
  es: { entrar: 'Entrar', productos: 'Productos', alfa: 'ALFA' },
  en: { entrar: 'Sign in', productos: 'Products', alfa: 'ALPHA' },
};

export default function BarraSuperior({ producto = '', idioma = 'es', onIdioma, derecha = null, sinEntrar = false }) {
  const t = T[idioma] || T.es;
  return (
    <header className="top">
      <div className="wrap">
        <a className="brand" href="/">
          <img src="/media/v30/symphoria.svg" alt="" width="30" height="30" />
          <b>Sinapse</b>
        </a>
        <span className="alpha hide-m">{t.alfa}</span>
        <nav className="switch" aria-label={t.productos}>
          {PRODUCTOS.map((p) => (
            <a key={p.id} href={p.href} className={p.id === producto ? 'on' : undefined} aria-current={p.id === producto ? 'page' : undefined}>
              <span className="dot" style={{ background: p.color }} />
              {p.nombre}
            </a>
          ))}
        </nav>
        <div className="top-r">
          {derecha}
          {onIdioma && (
            <div className="lang hide-m" role="group" aria-label="Idioma / Language">
              {['es', 'en'].map((l) => (
                <button key={l} type="button" className={l === idioma ? 'on' : undefined} aria-pressed={l === idioma} onClick={() => onIdioma(l)}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          {!sinEntrar && <a className="btn btn-s" href="/chat.html#entrar">{t.entrar}</a>}
        </div>
      </div>
    </header>
  );
}
