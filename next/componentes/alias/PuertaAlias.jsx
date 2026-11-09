'use client';
/* v4.5 · la puerta de A.L.I.A.S. (Sammuel, 9 nov: «quita a todos el ALIAS excepto los admins»).
   Antes de montar A.L.I.A.S. se pregunta al servidor si esta cuenta lo tiene (perks.f.alias de /api/ai).
   · Lo tiene (el equipo, o alguien a quien se lo prendieron en Pulsem › Usuarios) → A.L.I.A.S. de siempre.
   · No lo tiene (o no tiene cuenta) → una tarjeta amable que explica que está en pruebas y lo lleva a SynthFlow solo,
     con lo que había escrito (si venía de «Agente»), a los pocos segundos. Puede ir antes con el botón.
   El servidor (api/alias.js) bloquea igual: esto es para que nadie choque con un error. */
import { useEffect, useState } from 'react';
import AliasApp from './AliasApp';
import BarraSuperior from '../partitura/BarraSuperior';
import { aliasGuardado, aliasDelServidor, guardarAlias } from '../../lib/solo-equipo';
import './puerta.css';

const SEG = 6;
const T = {
  es: {
    k: 'A.L.I.A.S. · EN PRUEBAS', h: 'A.L.I.A.S. todavía está en el taller.',
    p: 'El agente está en pruebas y por ahora solo lo usa el equipo de SymphorIA. Mientras tanto, SynthFlow te ayuda con casi todo: pregunta a varias IAs, compara y quédate con la mejor respuesta.',
    conPedido: 'Te llevamos a SynthFlow con lo que escribiste.', ir: 'Ir a SynthFlow', inicio: 'Volver al inicio',
    cuenta: (n) => `Te llevamos en ${n} s…`, revisando: 'Revisando tu cuenta…',
  },
  en: {
    k: 'A.L.I.A.S. · IN TESTING', h: 'A.L.I.A.S. is still in the workshop.',
    p: 'The agent is in testing and for now only the SymphorIA team uses it. Meanwhile, SynthFlow can help you with almost everything: ask several AIs, compare and keep the best answer.',
    conPedido: 'We will take you to SynthFlow with what you wrote.', ir: 'Go to SynthFlow', inicio: 'Back to home',
    cuenta: (n) => `Taking you there in ${n} s…`, revisando: 'Checking your account…',
  },
};
function leerIdioma() {
  try {
    const g = localStorage.getItem('synthz:lang') || localStorage.getItem('synthz:alias:lang');
    if (g === 'es' || g === 'en') return g;
  } catch (e) { /* sin guardado */ }
  return String(navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
}
function destino() {
  let meta = '';
  try {
    const q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.slice(1));
    meta = (q.get('meta') || h.get('meta') || q.get('goal') || '').trim().slice(0, 500);
  } catch (e) { /* sin pedido */ }
  return { meta, url: '/chat.html?' + new URLSearchParams(meta ? { from: 'alias', q: meta } : { from: 'alias' }) };
}

export default function PuertaAlias() {
  const [estado, setEstado] = useState('revisando');   /* revisando · si · no */
  const [idioma, setIdioma] = useState('es');
  const [falta, setFalta] = useState(SEG);
  const [ir, setIr] = useState({ meta: '', url: '/chat.html' });

  useEffect(() => {
    setIdioma(leerIdioma()); setIr(destino());
    const antes = aliasGuardado();
    if (antes) setEstado('si');
    let vivo = true;
    aliasDelServidor().then((ok) => {
      if (!vivo) return;
      if (ok === null) { if (!antes) setEstado('no'); return; }   /* sin conexión: se queda con lo que ya sabía */
      guardarAlias(ok); setEstado(ok ? 'si' : 'no');
    });
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    if (estado !== 'no') return undefined;
    document.documentElement.classList.add('ready');
    const id = setInterval(() => setFalta((n) => {
      if (n <= 1) { clearInterval(id); location.replace(ir.url); return 0; }
      return n - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [estado, ir.url]);

  if (estado === 'si') return <AliasApp />;
  const t = T[idioma] || T.es;
  if (estado === 'revisando') return <div className="pz-puerta pz-rev" role="status" aria-live="polite"><span className="sr">{t.revisando}</span></div>;
  const cambiar = (l) => { setIdioma(l); try { localStorage.setItem('synthz:lang', l); } catch (e) { /* sin guardado */ } };
  return (
    <div className="pz-puerta" lang={idioma}>
      <BarraSuperior idioma={idioma} onIdioma={cambiar} />
      <main className="wrap pz-centro">
        <section className="card pz-tarjeta" aria-labelledby="pzH">
          <span className="pz-orbe" aria-hidden="true"><svg viewBox="0 0 40 20"><path d="M20 10C17 5 13 3 9 3a7 7 0 000 14c4 0 8-2 11-7s7-7 11-7a7 7 0 010 14c-4 0-8-2-11-7z" fill="none" stroke="currentColor" strokeWidth="2.4" /></svg></span>
          <span className="mono">{t.k}</span>
          <h1 id="pzH">{t.h}</h1>
          <p>{t.p}</p>
          {ir.meta ? <p className="pz-pedido">{t.conPedido}</p> : null}
          <div className="pz-botones">
            <a className="btn btn-w" href={ir.url} data-puerta="ir">{t.ir}</a>
            <a className="btn" href="/">{t.inicio}</a>
          </div>
          <p className="pz-cuenta" aria-live="polite">{t.cuenta(falta)}</p>
          <span className="pz-barra" aria-hidden="true" style={{ animationDuration: SEG + 's' }} />
        </section>
      </main>
    </div>
  );
}
