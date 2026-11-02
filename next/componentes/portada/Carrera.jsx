'use client';
/* La carrera: la misma pregunta a 3 IAs, las respuestas llegan compitiendo y tú votas.
   Es una demo simulada (respuestas de ejemplo): no llama a ninguna IA ni gasta EnerX. */
import { useEffect, useRef, useState } from 'react';
import { CORREDORAS, RESPUESTAS, tipoDe } from './textos';
import Destellos from './Destellos';

const EJEMPLO = { es: 'Explícame qué es un agente de IA', en: 'Explain what an AI agent is' };
const DURA = 5200;   /* ms que tarda la más rápida */

export default function Carrera({ lang, t, pregunta, onDeVerdad, onOtra }) {
  const caja = useRef(null);
  const [q, setQ] = useState(null);           /* pregunta en curso */
  const [avance, setAvance] = useState([0, 0, 0]);   /* 0..1 por corredora */
  const [elegida, setElegida] = useState(null);
  const inicio = useRef(0);

  /* sin pregunta: arranca sola con un ejemplo la primera vez que la ves */
  useEffect(() => {
    if (pregunta || q) return undefined;
    const el = caja.current; if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setQ({ texto: null, n: 0 }); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [pregunta, q]);

  useEffect(() => { if (pregunta) setQ({ texto: pregunta.q, n: pregunta.n }); }, [pregunta]);

  /* animación */
  useEffect(() => {
    if (!q) return undefined;
    setElegida(null); setAvance([0, 0, 0]);
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto) { setAvance([1, 1, 1]); return undefined; }
    inicio.current = performance.now();
    let raf;
    const tic = (now) => {
      const ms = now - inicio.current;
      const a = CORREDORAS.map((c, i) => Math.min(1, Math.max(0, (ms - 350 - i * 120) / (DURA / c.vel))));
      setAvance(a);
      if (a.some((x) => x < 1)) raf = requestAnimationFrame(tic);
    };
    raf = requestAnimationFrame(tic);
    return () => cancelAnimationFrame(raf);
  }, [q]);

  const texto = q ? (q.texto || EJEMPLO[lang]) : EJEMPLO[lang];
  const tipo = tipoDe(texto);
  const respuestas = RESPUESTAS[lang][tipo];
  const terminadas = avance.every((x) => x >= 1);
  const orden = [...avance.keys()].sort((a, b) => CORREDORAS[b].vel - CORREDORAS[a].vel);

  return (
    <div className="pn-carrera" ref={caja}>
      <div className="pn-pregunta">
        <span>{t.tuPregunta}</span>
        <p>{texto}</p>
        {!q?.texto ? <em className="pn-ejemplo">{t.ejemplo}</em> : null}
      </div>

      <div className="pn-pistas">
        {CORREDORAS.map((c, i) => {
          const r = respuestas[i];
          const a = avance[i];
          const visible = r.slice(0, Math.round(r.length * a));
          const lista = a >= 1;
          const palabras = (visible.match(/\S+/g) || []).length;
          const seg = ((DURA / c.vel) * a / 1000).toFixed(1);
          const puesto = orden.indexOf(i) + 1;
          return (
            <article key={c.id} className={'pn-pista' + (lista ? ' lista' : '') + (elegida === i ? ' ganadora' : '') + (elegida != null && elegida !== i ? ' apagada' : '')} style={{ '--c': c.color }}>
              <header>
                <i className="pn-punto" aria-hidden="true" />
                <strong>{c.nombre}</strong>
                <small>{c.via}</small>
                <span className="pn-estado">{lista ? (terminadas ? `#${puesto} · ${t.lista}` : t.lista) : t.escribiendo}</span>
              </header>
              <div className="pn-barra" aria-hidden="true"><i style={{ transform: `scaleX(${a})` }} /></div>
              <pre className="pn-resp" aria-live={i === 0 ? 'polite' : undefined}>{visible}{!lista && a > 0 ? <b className="pn-cursor" /> : null}</pre>
              <footer>
                <span>{seg} {t.seg} · {palabras} {t.palabras}</span>
                {terminadas ? (
                  elegida === i
                    ? <span className="pn-corona">★ {t.ganadora}</span>
                    : <button type="button" className="pn-votar" onClick={() => setElegida(i)} disabled={elegida != null}>{t.elegir}</button>
                ) : null}
              </footer>
            </article>
          );
        })}
      </div>

      <div className={'pn-carrera-pie' + (terminadas ? ' on' : '')}>
        {elegida == null ? <p>{terminadas ? t.vota : ' '}</p> : (
          <>
            <Destellos><button type="button" className="pn-enviar" onClick={() => onDeVerdad(texto)}>{t.deVerdad}</button></Destellos>
            <button type="button" className="pn-link" onClick={onOtra}>{t.otra}</button>
          </>
        )}
      </div>
    </div>
  );
}
