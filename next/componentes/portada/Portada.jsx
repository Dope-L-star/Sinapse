'use client';
/* Portada nueva de SymphorIA (v4), hecha directo en React.
   Mezcla elegida por Sammuel (2-nov-2026): caja «¿Qué quieres hacer hoy?» arriba (Puertas), la carrera de 3 IAs como demo,
   y la pared de puertas abajo (las cerradas son puertas falsas: miden interés, piden correo opcional, no cobran nada). */
import { useCallback, useEffect, useRef, useState } from 'react';
import { T } from './textos';
import Carrera from './Carrera';
import Puertas from './Puertas';
import Destellos from './Destellos';

const LANG_KEY = 'synthz:lang';

function idiomaInicial() {
  try { const s = localStorage.getItem(LANG_KEY); if (s === 'es' || s === 'en') return s; } catch (e) {}
  const n = (typeof navigator !== 'undefined' && (navigator.languages?.[0] || navigator.language)) || 'es';
  return /^es/i.test(n) ? 'es' : 'en';
}

/* placeholder que se escribe y se borra solo */
function usePlaceholder(frases, pausa) {
  const [txt, setTxt] = useState('');
  useEffect(() => {
    if (pausa) return undefined;
    let i = 0, j = 0, borrando = false, t;
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto) { setTxt(frases[0]); return undefined; }
    const paso = () => {
      const f = frases[i % frases.length];
      if (!borrando) { j++; setTxt(f.slice(0, j)); if (j >= f.length) { borrando = true; t = setTimeout(paso, 1700); return; } t = setTimeout(paso, 38 + Math.random() * 40); }
      else { j--; setTxt(f.slice(0, j)); if (j <= 0) { borrando = false; i++; t = setTimeout(paso, 300); return; } t = setTimeout(paso, 16); }
    };
    t = setTimeout(paso, 500);
    return () => clearTimeout(t);
  }, [frases, pausa]);
  return txt;
}

/* Blurry de neiden.framer.media: franjas arriba y abajo (mismas clases que movimiento.css) */
function Blurry() {
  const [arriba, setArriba] = useState(false);
  const [abajo, setAbajo] = useState(true);
  useEffect(() => {
    const f = () => {
      const y = scrollY, fin = document.documentElement.scrollHeight - innerHeight - 8;
      setArriba(y > 24); setAbajo(y < fin);
    };
    f(); addEventListener('scroll', f, { passive: true }); addEventListener('resize', f);
    return () => { removeEventListener('scroll', f); removeEventListener('resize', f); };
  }, []);
  return (
    <>
      <div className={'szBlur arriba pn-blur-top' + (arriba ? ' on' : '')} aria-hidden="true"><b /><b /><b /></div>
      <div className={'szBlur abajo' + (abajo ? ' on' : '')} aria-hidden="true"><b /><b /><b /></div>
    </>
  );
}

/* las secciones aparecen suaves al entrar en pantalla */
function useAparecer() {
  useEffect(() => {
    const els = document.querySelectorAll('.pn-ap');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return undefined; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

export default function Portada() {
  const [lang, setLang] = useState('es');
  const [listo, setListo] = useState(false);
  const [texto, setTexto] = useState('');
  const [foco, setFoco] = useState(false);
  const [pregunta, setPregunta] = useState(null);   /* { q, n } — n cambia para reiniciar la carrera */
  const carreraRef = useRef(null);
  const t = T[lang];
  const ph = usePlaceholder(t.placeholder, foco || !!texto);
  useAparecer();

  useEffect(() => {
    const l = idiomaInicial(); setLang(l); setListo(true);
    const onStorage = (e) => { if (e.key === LANG_KEY && (e.newValue === 'es' || e.newValue === 'en')) setLang(e.newValue); };
    addEventListener('storage', onStorage);
    return () => removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; document.title = lang === 'es' ? 'SymphorIA · ¿Qué quieres hacer hoy?' : 'SymphorIA · What do you want to do today?'; }, [lang]);

  const cambiarIdioma = () => {
    const l = lang === 'es' ? 'en' : 'es';
    setLang(l);
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
  };

  const lanzar = useCallback((q) => {
    const limpio = String(q || '').trim(); if (!limpio) return;
    setPregunta((p) => ({ q: limpio, n: (p?.n || 0) + 1 }));
    requestAnimationFrame(() => carreraRef.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
  }, []);

  const enviar = (e) => { e.preventDefault(); lanzar(texto || ph || t.placeholder[0]); };

  /* abrir el chat de verdad con la pregunta (el chat la lee de sessionStorage, ver src/chat/17-arranque.js) */
  const deVerdad = (q) => {
    try { sessionStorage.setItem('synthz:q', JSON.stringify({ q, t: Date.now() })); } catch (e) {}
    location.href = '/chat.html';
  };

  return (
    <div className={'pn' + (listo ? ' pn-listo' : '')} lang={lang}>
      <div className="pn-cielo" aria-hidden="true"><i className="o1" /><i className="o2" /><i className="o3" /><i className="grano" /></div>
      <Blurry />

      <header className="pn-top">
        <a className="pn-marca" href="/nueva.html" aria-label="SymphorIA">
          <img src="/media/v30/symphoria.svg" alt="" width="30" height="30" />
          <span>Symphor<b>IA</b></span>
        </a>
        <nav className="pn-nav" aria-label={lang === 'es' ? 'Principal' : 'Main'}>
          <a href="#carrera">{t.nav.demo}</a>
          <a href="#puertas">{t.nav.puertas}</a>
          <button type="button" className="pn-lang" onClick={cambiarIdioma} aria-label={t.nav.idiomaLabel}>{t.nav.idioma}</button>
          <a className="pn-entrar" href="/chat.html">{t.nav.entrar}</a>
        </nav>
      </header>

      <main>
        <section className="pn-hero" aria-labelledby="pnTitulo">
          <span className="pn-beta"><i />{t.beta}</span>
          <h1 id="pnTitulo"><span>{t.titulo[0]}</span> <em>{t.titulo[1]}</em></h1>
          <p className="pn-sub">{t.sub}</p>

          <form className={'pn-caja' + (foco ? ' foco' : '')} onSubmit={enviar}>
            <label htmlFor="pnQ" className="pn-oculto">{t.titulo.join(' ')}</label>
            <textarea id="pnQ" rows={2} value={texto} placeholder={ph}
              onChange={(e) => setTexto(e.target.value.slice(0, 400))}
              onFocus={() => setFoco(true)} onBlur={() => setFoco(false)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(e); } }} />
            <div className="pn-caja-pie">
              <div className="pn-chips">
                {t.chips.map((c) => (
                  <button type="button" key={c.k} className="pn-chip" onClick={() => { const q = c.q; setTexto(q); lanzar(q); }}>{c.t}</button>
                ))}
              </div>
              <Destellos>
                <button type="submit" className="pn-enviar">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 21 3l-6.5 18-3.2-7.3L3 11.5Z" /><path d="m11.3 13.7 4-4" /></svg>
                  <span>{t.enviar}</span>
                </button>
              </Destellos>
            </div>
          </form>
          <p className="pn-nota">{t.nota}</p>

          <ol className="pn-pasos">
            {t.pasos.map((p) => <li key={p.n}><b>{p.n}</b><strong>{p.t}</strong><span>{p.d}</span></li>)}
          </ol>
        </section>

        <section id="carrera" ref={carreraRef} className="pn-sec pn-ap" aria-labelledby="pnCarrera">
          <p className="pn-kicker">{t.carrera.kicker}</p>
          <h2 id="pnCarrera">{t.carrera.titulo}</h2>
          <Carrera lang={lang} t={t.carrera} pregunta={pregunta} onDeVerdad={deVerdad} onOtra={() => { document.getElementById('pnQ')?.focus(); scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </section>

        <section id="puertas" className="pn-sec pn-ap" aria-labelledby="pnPuertas">
          <p className="pn-kicker">{t.puertas.kicker}</p>
          <h2 id="pnPuertas">{t.puertas.titulo}</h2>
          <p className="pn-sub2">{t.puertas.sub}</p>
          <Puertas lang={lang} t={t.puertas} />
        </section>

        <section className="pn-fondo pn-ap" aria-labelledby="pnFondo">
          <div className="pn-planeta" aria-hidden="true"><i /><i /><i /></div>
          <h2 id="pnFondo">{t.fondo.t}</h2>
          <p>{t.fondo.d}</p>
          <Destellos><a className="pn-enviar grande" href="/chat.html">{t.fondo.cta}</a></Destellos>
        </section>
      </main>

      <footer className="pn-pie">
        <span>© 2026 SymphorIA</span>
        <nav aria-label={lang === 'es' ? 'Enlaces legales' : 'Legal links'}>
          <a href="/privacidad.html">{t.fondo.privacidad}</a>
          <a href="/terminos.html">{t.fondo.terminos}</a>
          <a href="/ayuda.html">{t.fondo.ayuda}</a>
        </nav>
      </footer>
    </div>
  );
}
