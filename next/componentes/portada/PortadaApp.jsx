'use client';
/* Portada «Partitura» (rediseño 2026-11-09), en React de verdad. Sustituye al árbol copiado de index.html.
   - La caja de escribir abre SynthFlow con la pregunta (Auto / Una IA / Comparar) o A.L.I.A.S. (Agente).
   - El laboratorio, Obertura y los planes de pago son puertas falsas: solo cuentan a quien deja su correo
     (api/config.js › action:'puerta'). Nunca se cobra nada.
   - Español e inglés (synthz:lang, igual que el resto del sitio). Las líneas y chispas las mueve el motor en Rust. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAliasVisible } from '../../lib/solo-equipo';
import BarraSuperior from '../partitura/BarraSuperior';
import Pentagrama from '../partitura/Pentagrama';
import Chispas from '../partitura/Chispas';
import { TEXTOS } from './textos';
import './portada.css';

const ICO = (n) => '/ico/' + n + '.svg';
const ANILLO = [
  ['openai', 'OpenAI', 50, 6, 'l'], ['gemini-color', 'Gemini', 81, 19, 'l'], ['claude-color', 'Claude', 94, 50, 'l'], ['meta-color', 'Meta', 81, 81, 'l'],
  ['mistral-color', 'Mistral', 50, 94, 'l'], ['nvidia-color', 'Nvidia', 19, 81, 'l'], ['kimi-color', 'Kimi', 6, 50, 'l'], ['perplexity-color', 'Perplexity', 19, 19, 'l'],
  ['deepseek-color', 'DeepSeek', 66, 22, ''], ['qwen-color', 'Qwen', 78, 66, ''], ['grok', 'Grok', 34, 78, ''], ['gemma-color', 'Gemma', 22, 34, ''],
];
const MODOS = ['auto', 'una', 'comparar', 'agente'];
const VK = 'synthz:puertas';
const correoOk = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c);

function leerIdioma() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'es' || q === 'en') return q;
    const s = localStorage.getItem('synthz:lang');
    if (s === 'es' || s === 'en') return s;
  } catch (e) {}
  return (navigator.language || '').toLowerCase().startsWith('es') || !navigator.language ? 'es' : 'en';
}

const Ok = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>;
const Estrella = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z" /></svg>;

/* Puertas falsas: votos compartidos con la portada vieja y los planes de SynthFlow */
function usePuertas(idioma) {
  const [cuentas, setCuentas] = useState({});
  const [mios, setMios] = useState({});
  useEffect(() => {
    try { setMios(JSON.parse(localStorage.getItem(VK)) || {}); } catch (e) {}
    fetch('/api/config?puertas=1').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d && d.puertas) setCuentas(d.puertas); }).catch(() => {});
  }, []);
  const mandar = useCallback(async (id, email) => {
    const r = await fetch('/api/config', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'puerta', id, email: email || undefined, lang: idioma }) });
    const d = await r.json().catch(() => null);
    if (r.ok && d && typeof d.n === 'number') setCuentas((c) => ({ ...c, [id]: d.n }));
    if (r.ok && email && d && d.saved) {
      setMios((m) => { const n = { ...m, [id]: Date.now() }; try { localStorage.setItem(VK, JSON.stringify(n)); } catch (e) {} return n; });
    }
    if (!r.ok || (email && !(d && d.saved))) throw new Error('no');
  }, [idioma]);
  return { cuentas, mios, mandar };
}

function CajaCorreo({ t, puerta, nombre, onCerrar, mandar }) {
  const [c, setC] = useState('');
  const [aviso, setAviso] = useState('');
  const [hecho, setHecho] = useState(false);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, [puerta]);
  const enviar = async (e) => {
    e.preventDefault();
    if (!correoOk(c.trim())) { setAviso(t.correoMal); return; }
    setAviso('…');
    try { await mandar(puerta, c.trim()); setHecho(true); setAviso(t.correoOk); setC(''); } catch { setAviso(t.fallo); }
  };
  return (
    <form className="pt-correo card" onSubmit={enviar}>
      <label htmlFor={'pc-' + puerta}>{t.correoPide(nombre)}</label>
      {!hecho && (
        <div className="pt-correo-fila">
          <input ref={ref} id={'pc-' + puerta} className="field" type="email" autoComplete="email" placeholder={t.correo} value={c} onChange={(e) => setC(e.target.value)} />
          <button className="btn btn-w" type="submit" data-chispas>{t.avisame}</button>
        </div>
      )}
      <p className="pt-aviso" role="status" aria-live="polite">{aviso}</p>
      <button type="button" className="pt-cerrar" onClick={onCerrar}>{t.cancelar}</button>
    </form>
  );
}

export default function PortadaApp() {
  /* v4.5: A.L.I.A.S. (modo Agente, tarjeta y pestaña) solo para el equipo */
  const conAlias = useAliasVisible();
  const modos = conAlias ? MODOS : MODOS.filter((m) => m !== 'agente');
  const [idioma, setIdioma] = useState('es');
  const t = TEXTOS[idioma];
  const [modo, setModo] = useState('auto');
  const [esfuerzo, setEsfuerzo] = useState(0);
  const [q, setQ] = useState('');
  const [idea, setIdea] = useState(0);
  const [empuja, setEmpuja] = useState(false);
  const [abierta, setAbierta] = useState(null);
  const area = useRef(null);
  const { cuentas, mios, mandar } = usePuertas(idioma);

  useEffect(() => { setIdioma(leerIdioma()); }, []);
  useEffect(() => {
    document.documentElement.lang = idioma;
    document.title = t.titulo;
  }, [idioma, t.titulo]);
  useEffect(() => {
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto) return;
    const id = setInterval(() => { if (document.hidden || document.activeElement === area.current) return; setIdea((i) => (i + 1) % 5); }, 3200);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const f = (e) => { if (e.key === 'synthz:lang' && (e.newValue === 'es' || e.newValue === 'en')) setIdioma(e.newValue); };
    addEventListener('storage', f); return () => removeEventListener('storage', f);
  }, []);

  const cambiarIdioma = (l) => { setIdioma(l); try { localStorage.setItem('synthz:lang', l); } catch (e) {} };

  const enviar = (e) => {
    e.preventDefault();
    const texto = q.trim();
    if (!texto) { setEmpuja(false); requestAnimationFrame(() => setEmpuja(true)); area.current?.focus(); return; }
    try { sessionStorage.setItem('synthz:q', JSON.stringify({ q: texto, t: Date.now() })); } catch (er) {}
    if (modo === 'agente' && conAlias) { location.href = '/alias.html?' + new URLSearchParams({ from: 'home', meta: texto }); return; }
    const p = new URLSearchParams({ from: 'home', q: texto, esfuerzo: ['auto', 'veloz', 'profundo', 'creativo', 'superiorsynth'][esfuerzo] });
    if (modo === 'comparar') p.set('mode', 'cmp');
    if (modo === 'una') p.set('elegir', '1');
    location.href = '/chat.html?' + p;
  };
  const teclas = (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) enviar(e); };

  const puerta = (id, nombre) => {
    if (mios[id]) return;
    mandar(id).catch(() => {}); /* solo el clic, aparte: todavía no cuenta como interesado */
    setAbierta({ id, nombre });
  };
  const caja = (id) => abierta && abierta.id === id ? <CajaCorreo t={t} puerta={id} nombre={abierta.nombre} mandar={mandar} onCerrar={() => setAbierta(null)} /> : null;

  return (
    <div className="pt" lang={idioma}>
      <Chispas />
      <BarraSuperior idioma={idioma} onIdioma={cambiarIdioma} />
      <main id="inicio">
        <section className="pt-hero">
          <div className="wrap">
            <div className="pt-kick"><span className="chip"><span className="pt-punto" />{t.bienvenida}</span></div>
            <h1>{t.h1a} <span className="grad-text">{t.h1b}</span> {t.h1c}</h1>
            <p className="pt-lead">{t.lead}</p>

            <form className={'pt-caja' + (empuja ? ' empuja' : '')} onSubmit={enviar} onAnimationEnd={() => setEmpuja(false)} data-clarity-mask="true">
              <div className="pt-modos" role="radiogroup" aria-label="Modo">
                {modos.map((m) => (
                  <button key={m} type="button" role="radio" aria-checked={modo === m} className={modo === m ? 'on' : undefined} onClick={() => setModo(m)} data-modo={m}>
                    {t.modos[m]}
                  </button>
                ))}
              </div>
              <label htmlFor="ptQ" className="sr">{t.pregunta}</label>
              <textarea id="ptQ" ref={area} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={teclas} placeholder={t.ideas[idea]} rows={3} />
              <div className="pt-fila">
                <span className="pt-ayuda" aria-live="polite">{t.modosAyuda[modo]}</span>
                <span className="grow" />
                {modo !== 'agente' && (
                  <div className="seg" role="radiogroup" aria-label={t.esfuerzo}>
                    {t.esfuerzos.map((n, i) => (
                      <button key={n} type="button" role="radio" aria-checked={esfuerzo === i} className={esfuerzo === i ? 'on' : undefined} onClick={() => setEsfuerzo(i)}>{n}</button>
                    ))}
                  </div>
                )}
                <button className="pt-enviar" type="submit" aria-label={t.enviar} data-chispas>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                </button>
              </div>
            </form>
            {empuja ? <p className="pt-vacio" role="alert">{t.vacio}</p> : null}
            <p className="pt-nota">{t.nota}</p>
          </div>
          <div className="pt-lineas"><Pentagrama alto={90} etiqueta={t.lineas} /></div>
        </section>

        <section className="pt-sec" id="como">
          <div className="wrap">
            <p className="mono">{t.pasosK}</p>
            <ol className="pt-pasos">
              {t.pasos.map(([h, p], i) => (
                <li key={h} className="card" style={{ '--k': ['var(--c)', 'var(--v)', 'var(--g)'][i] }}><span className="pt-n">{i + 1}</span><b>{h}</b><span>{p}</span></li>
              ))}
            </ol>
            <div className="pt-cab">
              <h2>{t.comoT}</h2>
              <p>{t.comoS}</p>
            </div>
            <div className="pt-pistas">
              {t.pistas.map((p, i) => (
                <article key={p.ia} className={'card pt-pista' + (i === 1 ? ' mejor' : '')} style={{ '--k': p.k }}>
                  <header><span className="ai s"><img src={ICO(p.ico)} alt="" /></span><b>{p.ia}</b><small>{p.s}</small></header>
                  <p>{p.r}</p>
                  <div className="pt-elige">
                    {i === 1
                      ? <><span className="pt-estrella"><Estrella />{t.tuElegida}</span><a className="btn btn-s btn-w" href="/chat.html?mode=cmp" data-chispas>{t.seguir}</a></>
                      : <><span className="chip">{p.tono}</span><a className="btn btn-s" href="/chat.html?mode=cmp">{t.quedarme}</a></>}
                  </div>
                </article>
              ))}
            </div>
            <p className="mono pt-ej">{t.ejemplo}</p>
          </div>
        </section>

        <section className="pt-sec pt-violeta">
          <div className="wrap pt-dos">
            <div className="pt-anillo" role="img" aria-label="OpenAI, Gemini, Claude, Meta, Mistral, Nvidia, Kimi, Perplexity, DeepSeek, Qwen, Grok, Gemma">
              <div className="circ" /><div className="circ b" />
              <div className="orb"><span className="syn big" /></div>
              {ANILLO.map(([ico, n, x, y, tam], i) => (
                <span key={ico} className={'ai ' + tam} style={{ left: x + '%', top: y + '%', '--d': i * 0.25 + 's' }}><img src={ICO(ico)} alt="" /></span>
              ))}
            </div>
            <div>
              <p className="mono">{t.todasK}</p>
              <h2>{t.todasT}</h2>
              <ul className="pt-lista">
                {t.todas.map(([b, s]) => <li key={b}><Ok /><span><b>{b}</b>{s}</span></li>)}
              </ul>
              <a className="btn btn-w" href="/chat.html" data-chispas>{t.abrirFlow} →</a>
            </div>
          </div>
        </section>

        <section className="pt-sec">
          <div className="wrap">
            <div className="pt-cab"><h2>{conAlias ? t.instT : t.instT2}</h2><p>{t.instS}</p></div>
            <div className={'pt-inst' + (conAlias ? '' : ' dos')}>
              {t.inst.filter((x) => conAlias || x.href !== '/alias.html').map((x) => (
                <a key={x.n} className="card pt-ins" href={x.href} style={{ '--k': x.k }}>
                  <span className="pt-raya" /><h3>{x.n}</h3><p>{x.p}</p>
                  <span className="pt-ir"><span className="mono">{x.m}</span><span className="btn btn-s">{x.b}</span></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="pt-sec" id="obertura">
          <div className="wrap">
            <div className="card pt-obe">
              <div>
                <p className="mono" style={{ color: 'var(--g)' }}>{t.obeK}</p>
                <h2>{t.obeT}</h2>
                <p className="pt-gris">{t.obeS}</p>
                <div className="pt-botones">
                  {mios.escritorio
                    ? <span className="btn btn-s">{t.anotado}</span>
                    : <button type="button" className="btn btn-w" onClick={() => puerta('escritorio', 'Lumbra')} data-chispas>{t.obeBtn}</button>}
                  <span className="chip">{t.obeChip}</span>
                </div>
                {caja('escritorio')}
              </div>
              <div className="pt-win" aria-hidden="true">
                <div className="pt-win-barra"><i /><i /><i /><span>{t.obeWin}</span></div>
                <div className="pt-win-cuerpo">
                  <div className="pt-win-fila"><img src="/media/v30/symphoria.svg" alt="" width="44" height="44" /><div><b>{t.obeAfin}</b><small>{t.obePaso}</small></div></div>
                  <div className="pt-win-pasos"><i className="on" /><i className="on" /><i /></div>
                  <Pentagrama modo="afinando" alto={46} />
                  <span className="pt-win-ck"><span className="pt-cuadro"><Ok /></span>{t.obeAcceso}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-sec pt-lab" id="lab">
          <div className="wrap">
            <div className="pt-cab"><h2>{t.labT}</h2><p>{t.labS}</p></div>
            <div className="pt-labs">
              {t.lab.map((f) => {
                const n = cuentas[f.id] || 0, si = !!mios[f.id];
                return (
                  <div key={f.id} className="card pt-labc">
                    <span className="tag">{t.pronto}</span>
                    <h4>{f.n}</h4><p>{f.p}</p>
                    <div className="pt-tubo" aria-hidden="true"><i style={{ width: Math.min(100, 8 + n * 4) + '%' }} /></div>
                    <small>{t.votos(n)}</small>
                    {si ? <span className="btn btn-s pt-si">{t.anotado}</span> : <button type="button" className="btn btn-s" onClick={() => puerta(f.id, f.n)} data-chispas>{t.laQuiero}</button>}
                  </div>
                );
              })}
            </div>
            {abierta && t.lab.some((f) => f.id === abierta.id) ? caja(abierta.id) : null}
          </div>
        </section>

        <section className="pt-sec" id="planes">
          <div className="wrap">
            <div className="pt-cab"><h2>{t.planesT}</h2><p>{t.planesS}</p></div>
            <div className="pt-planes">
              {t.planes.map((p) => {
                const libre = p.id === 'alfa', id = 'plan-' + p.id;
                return (
                  <div key={p.id} className={'card pt-plan' + (libre ? ' libre' : '')}>
                    {libre ? <span className="mono" style={{ color: 'var(--ok)' }}>{t.hoy}</span> : <span className="tag">{t.aunNo}</span>}
                    <h3>{p.n}</h3>
                    <div className="pt-precio">{libre ? t.gratis : '—'}</div>
                    <ul>{p.L.map((l) => <li key={l}>{l}</li>)}</ul>
                    {libre
                      ? <a className="btn btn-w" href="/chat.html" data-chispas>{t.empezar}</a>
                      : mios[id] ? <span className="btn pt-si">{t.anotado}</span> : <button type="button" className="btn" onClick={() => puerta(id, p.n)}>{t.meInteresa}</button>}
                  </div>
                );
              })}
            </div>
            {abierta && abierta.id.startsWith('plan-') ? caja(abierta.id) : null}
          </div>
        </section>

        <section className="pt-sec pt-faq">
          <div className="wrap">
            <h2>{t.faqT}</h2>
            {t.faq.map(([h, p], i) => <details key={h} open={i === 0}><summary>{h}</summary><p>{p}</p></details>)}
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <span className="brand"><img src="/media/v30/symphoria.svg" alt="" /><b>Sinapse</b></span>
          <span className="grow" />
          <a href="/privacidad.html">{t.pie.privacidad}</a><a href="/terminos.html">{t.pie.terminos}</a><a href="/ayuda.html">{t.pie.ayuda}</a>
          <span className="lang" role="group" aria-label="Idioma / Language">
            {['es', 'en'].map((l) => <button key={l} type="button" className={l === idioma ? 'on' : undefined} aria-pressed={l === idioma} onClick={() => cambiarIdioma(l)}>{l.toUpperCase()}</button>)}
          </span>
        </div>
      </footer>

      <nav className="tabbar" aria-label="Menú">
        <a className="on" href="/" aria-current="page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" /></svg>{t.tabs.inicio}</a>
        <a href="/chat.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z" /></svg>Sonyx</a>
        {conAlias && <a href="/alias.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M7 8c-3 0-4 2-4 4s1 4 4 4c4 0 6-8 10-8 3 0 4 2 4 4s-1 4-4 4c-4 0-6-8-10-8z" /></svg>Quoryn</a>}
        <a href="/chat.html#entrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>{t.tabs.yo}</a>
      </nav>
    </div>
  );
}
