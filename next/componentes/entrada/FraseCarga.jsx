'use client';
/* SymphorIA · «Entrada» · la frase de carga: una frase al azar (con tu nombre a veces), distinta cada vez y que cambia sola mientras dura la espera.
   Las frases viven en ./frases.js (ES/EN). Uso:
     <FraseCarga ctx="datos" lang={lang} />                 en vez de un «Cargando…» suelto (un <p role="status"> con puntitos)
     <FraseCarga ctx="datos" lang={lang} cada={0} />         una sola frase, no cambia
     <FraseTelon />                                          la píldora con las 5 barritas de la marca (el telón de cada página y el velo de SynthFlow)
     const f = useFrase('pensando', lang, { cada: 2000 })    solo el texto, si el componente pinta lo suyo
   La primera pintura sale con `respaldo` (el texto viejo, ya traducido) y en cuanto monta se cambia por una frase: así nunca queda vacío ni hay desajuste con el HTML del servidor. */
import { useEffect, useState } from 'react';
import { frase } from './frases';
import './entrada.css';

export function useFrase(ctx, lang, { cada = 2600 } = {}) {
  const [f, setF] = useState('');
  useEffect(() => {
    setF(frase(ctx, lang));
    if (!cada) return undefined;
    const iv = setInterval(() => setF(frase(ctx, lang)), cada);
    return () => clearInterval(iv);
  }, [ctx, lang, cada]);
  return f;
}

export default function FraseCarga({ ctx = 'datos', lang, cada = 2600, respaldo = '', puntos = true, className = '', ...resto }) {
  const f = useFrase(ctx, lang, { cada });
  const t = f || respaldo;
  return (
    <p className={'sy-frase' + (className ? ' ' + className : '')} role="status" aria-live="off" {...resto}>
      <span key={t} className="sy-frase-t">{t}</span>{puntos && t ? <><i>.</i><i>.</i><i>.</i></> : null}
    </p>
  );
}

/* la píldora de vidrio con las 5 barritas (cian, violeta, rosa, naranja, oro) que suben y bajan como un ecualizador */
export function FraseTelon({ ctx = 'pagina', lang, cada = 2400 }) {
  const f = useFrase(ctx, lang, { cada });
  if (!f) return null;   /* sin frase todavía (el HTML del servidor no sabe tu idioma ni tu nombre): no se pinta nada a medias */
  return (
    <div className="sy-frase-pie" aria-hidden="true" data-mv-no="">
      <span className="sy-barras"><i /><i /><i /><i /><i /></span>
      <p className="sy-frase"><span key={f} className="sy-frase-t">{f}</span><i>.</i><i>.</i><i>.</i></p>
    </div>
  );
}
