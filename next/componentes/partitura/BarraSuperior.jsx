'use client';
/* Barra superior común de «Partitura»: la misma en portada, SynthFlow, A.L.I.A.S., Obertura y legales.
   Uso: import BarraSuperior from '../partitura/BarraSuperior'; <BarraSuperior producto="alias" idioma="es" />
   Requiere importar una vez './partitura.css' (tokens y piezas base). */
import './partitura.css';
import { useAliasVisible } from '../../lib/solo-equipo';

const PRODUCTOS = [
  { id: 'synthflow', nombre: 'SynthFlow', href: '/chat.html', color: 'var(--c)' },
  { id: 'alias', nombre: 'A.L.I.A.S.', href: '/alias.html', color: 'var(--v)' },
  { id: 'obertura', nombre: 'Obertura', href: '/#obertura', color: 'var(--g)' },
];
const T = {
  es: { entrar: 'Entrar', productos: 'Productos', alfa: 'ALFA' },
  en: { entrar: 'Sign in', productos: 'Products', alfa: 'ALPHA' },
};

export default function BarraSuperior({ producto = '', idioma = 'es', onIdioma, derecha = null, sinEntrar = false }) {
  const t = T[idioma] || T.es;
  /* v4.5: A.L.I.A.S. solo aparece para el equipo (o dentro de su propia página, que ya revisó la cuenta) */
  const conAlias = useAliasVisible() || producto === 'alias';
  return (
    <header className="top">
      <div className="wrap">
        <a className="brand" href="/">
          <img src="/media/v30/symphoria.svg" alt="" width="30" height="30" />
          <b>Symphor<i>IA</i></b>
        </a>
        <span className="alpha hide-m">{t.alfa}</span>
        <nav className="switch" aria-label={t.productos}>
          {PRODUCTOS.filter((p) => p.id !== 'alias' || conAlias).map((p) => (
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
