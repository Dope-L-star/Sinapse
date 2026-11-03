'use client';
/* v4.2 · Letrero «¡BIENVENIDO A LA ALFA!» (pedido de Sammuel, 3-nov-2026)
   Sale UNA vez a cada persona al entrar a SynthFlow (se recuerda en este navegador).
   · Un letrero de teatro con bombillos que corren por el borde y las letras que se prenden una por una.
   · La sorpresa: «Ver mi pase» voltea el letrero y aparece tu Pase Alfa holográfico, con un código propio
     (se arma en tu navegador, no se manda a ningún lado), la fecha en que entraste y SynthonIA celebrando contigo.
     El brillo del pase sigue al mouse o a la inclinación del celular. Se puede guardar como imagen.
   · Vuelve a verse con el chip «ALFA» de abajo a la izquierda (solo en esta sesión) o borrando los datos del sitio.
   Respeta: ES/EN al instante, Simple, «sin animaciones» (html.noanim) y prefers-reduced-motion. Escape cierra. */
import { useEffect, useRef, useState } from 'react';

const KEY = 'sz-alfa-visto', PASS = 'sz-alfa-pase';
const WORD = { es: '¡BIENVENIDO A LA ALFA!', en: 'WELCOME TO THE ALPHA!' };
const T = {
  es: {
    kicker: 'SymphorIA · acceso anticipado',
    sub: 'Entraste antes que casi todo el mundo. Aquí las cosas todavía se están armando, y lo que tú digas decide cómo quedan.',
    perks: ['Pruebas lo nuevo primero', 'Tus ideas llegan directo al equipo', 'Todo gratis, sin letra pequeña'],
    pass: 'Ver mi pase', go: '¡Vamos!', back: 'Volver al letrero', save: 'Guardar mi pase',
    ptitle: 'PASE ALFA', holder: 'Pionera o pionero de SymphorIA', since: 'Entró el', code: 'Código',
    note: 'Este código es solo tuyo y vive en tu navegador.', close: 'Cerrar', chip: 'Ver el letrero de la Alfa',
    saved: 'Listo, tu pase quedó guardado.', wink: '¡Gracias por llegar antes que nadie!'
  },
  en: {
    kicker: 'SymphorIA · early access',
    sub: "You got in before almost everyone. Things here are still being built, and what you say decides how they turn out.",
    perks: ['Try new things first', 'Your ideas go straight to the team', 'All free, no fine print'],
    pass: 'See my pass', go: "Let's go!", back: 'Back to the sign', save: 'Save my pass',
    ptitle: 'ALPHA PASS', holder: 'SymphorIA pioneer', since: 'Joined on', code: 'Code',
    note: 'This code is yours alone and lives in your browser.', close: 'Close', chip: 'See the Alpha sign',
    saved: 'Done, your pass was saved.', wink: 'Thanks for getting here first!'
  }
};
const read = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const langNow = () => (typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'es');

/* el pase: código de 8 letras sin las que se confunden (0/O, 1/I) + la fecha del primer día; se guarda para que siempre sea el mismo */
function miPase() {
  try { const p = JSON.parse(read(PASS) || 'null'); if (p && p.code && p.t) return p; } catch (e) {}
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint8Array(8);
  (window.crypto || {}).getRandomValues ? crypto.getRandomValues(b) : b.forEach((_, i) => { b[i] = Math.random() * 256; });
  const s = [...b].map(x => A[x % A.length]).join('');
  const p = { code: 'ALFA-' + s.slice(0, 4) + '-' + s.slice(4), t: Date.now() };
  write(PASS, JSON.stringify(p));
  return p;
}
const fecha = (t, l) => new Date(t).toLocaleDateString(l === 'en' ? 'en-US' : 'es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

/* SynthonIA de verdad (la misma de toda la página, dibujada por synthonia.js): saluda y, al voltear el pase, celebra */
function SynthonIA({ fiesta }) {
  const host = useRef(null);
  useEffect(() => {
    let tm = 0;
    const paint = () => {
      const SZ = window.SZ;
      if (SZ && typeof SZ.synSet === 'function' && host.current) SZ.synSet(host.current, fiesta ? 'celebrando' : 'feliz', fiesta ? 'celebra' : 'saluda', 104);
      else tm = setTimeout(paint, 300);
    };
    paint();
    return () => clearTimeout(tm);
  }, [fiesta]);
  return <div className="la-syn" ref={host} aria-hidden="true" />;
}

/* el pase como imagen SVG para guardar (mismos colores del tema activo) */
function svgDelPase(p, t, l) {
  const cs = getComputedStyle(document.documentElement);
  const g = (cs.getPropertyValue('--gold') || '#e6b65f').trim() || '#e6b65f', w = (cs.getPropertyValue('--wine') || '#c9566c').trim() || '#c9566c';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600" viewBox="0 0 1000 600">
<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#140f22"/><stop offset="1" stop-color="#2a1530"/></linearGradient>
<linearGradient id="h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${g}"/><stop offset=".5" stop-color="#9fe7ff"/><stop offset="1" stop-color="${w}"/></linearGradient>
</defs>
<rect width="1000" height="600" rx="44" fill="url(#b)"/><rect x="14" y="14" width="972" height="572" rx="34" fill="none" stroke="url(#h)" stroke-width="4"/>
<text x="70" y="120" font-family="Georgia,serif" font-size="30" fill="${g}" letter-spacing="8">SYMPHORIA</text>
<text x="70" y="220" font-family="Arial Black,Arial,sans-serif" font-size="92" font-weight="900" fill="url(#h)">${esc(t.ptitle)}</text>
<text x="70" y="290" font-family="Arial,sans-serif" font-size="30" fill="#efe9f7">${esc(t.holder)}</text>
<text x="70" y="420" font-family="Arial,sans-serif" font-size="22" fill="#a79fb8">${esc(t.code)}</text>
<text x="70" y="470" font-family="Courier New,monospace" font-size="48" font-weight="700" fill="#fff" letter-spacing="4">${esc(p.code)}</text>
<text x="70" y="530" font-family="Arial,sans-serif" font-size="22" fill="#a79fb8">${esc(t.since)} ${esc(fecha(p.t, l))}</text>
</svg>`;
}

export default function LetreroAlfa() {
  const [open, setOpen] = useState(false), [on, setOn] = useState(false), [flip, setFlip] = useState(false), [chip, setChip] = useState(false);
  const [lang, setLang] = useState('es'), [pase, setPase] = useState(null);
  const box = useRef(null), card = useRef(null), last = useRef(null);
  const t = T[lang], word = WORD[lang];

  /* idioma al instante */
  useEffect(() => {
    setLang(langNow());
    const mo = new MutationObserver(() => setLang(langNow()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => mo.disconnect();
  }, []);

  /* sale una sola vez: espera a que no haya otra ventana abierta (intro, cookies, guía) */
  useEffect(() => {
    if (read(KEY)) return;
    let tries = 0, tm = 0;
    const busy = () => !!document.querySelector('.szm.on, .tour.on, #ccBox:not([hidden]), .cc-box, #synIntro.on, .intro.on');
    const tick = () => { if (!busy() || ++tries > 40) show(); else tm = setTimeout(tick, 1500); };
    tm = setTimeout(tick, 1400);
    return () => clearTimeout(tm);
  }, []);

  function show() {
    last.current = document.activeElement;
    setPase(miPase()); setFlip(false); setOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)));
  }
  function close() {
    write(KEY, String(Date.now()));
    setOn(false); setChip(true);
    setTimeout(() => { setOpen(false); try { last.current && last.current.focus && last.current.focus(); } catch (e) {} }, 420);
  }

  /* teclado: Escape cierra, Tab se queda dentro */
  useEffect(() => {
    if (!open) return;
    const k = e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
      if (e.key !== 'Tab' || !box.current) return;
      const f = [...box.current.querySelectorAll('button:not([disabled])')].filter(b => b.offsetParent !== null && !b.closest('[inert]'));
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    addEventListener('keydown', k, true);
    const first = setTimeout(() => { const b = box.current && box.current.querySelector('.la-front .la-go'); if (b) b.focus(); }, 60);
    return () => { removeEventListener('keydown', k, true); clearTimeout(first); };
  }, [open]);
  useEffect(() => {
    if (!open || !box.current) return;
    const b = box.current.querySelector(flip ? '.la-back .la-save' : '.la-front .la-pass');
    if (b && document.activeElement && document.activeElement.closest('.la-card')) setTimeout(() => b.focus(), 350);
  }, [flip]);

  /* el brillo holográfico sigue al mouse o a la inclinación del celular */
  useEffect(() => {
    if (!open || !flip || !card.current) return;
    const el = card.current, still = () => document.documentElement.classList.contains('noanim') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const set = (x, y) => { if (still()) return; el.style.setProperty('--mx', x.toFixed(3)); el.style.setProperty('--my', y.toFixed(3)); };
    const mv = e => { const r = el.getBoundingClientRect(); set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); };
    const tilt = e => { if (e.gamma == null) return; set(Math.min(1, Math.max(0, .5 + e.gamma / 60)), Math.min(1, Math.max(0, .5 + (e.beta - 40) / 60))); };
    const out = () => set(.5, .5);
    el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', out); addEventListener('deviceorientation', tilt);
    return () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', out); removeEventListener('deviceorientation', tilt); };
  }, [open, flip]);

  function guardar() {
    if (!pase) return;
    const blob = new Blob([svgDelPase(pase, t, lang)], { type: 'image/svg+xml' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pase-alfa-symphoria-' + pase.code.toLowerCase() + '.svg';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    if (window.SZ && window.SZ.toast) window.SZ.toast(t.saved);
  }

  const chipBtn = chip && !open ? (
    <button type="button" className="la-chip notr" onClick={show} aria-label={t.chip} title={t.chip}>ALFA</button>
  ) : null;
  if (!open) return chipBtn;

  return (
    <div className={'la notr' + (on ? ' on' : '')} id="letreroAlfa" onPointerDown={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="la-stage" ref={box} role="dialog" aria-modal="true" aria-labelledby="laT" aria-describedby="laS">
        <div className={'la-card' + (flip ? ' flip' : '')}>
          {/* frente: el letrero */}
          <section className="la-front" inert={flip ? '' : undefined} aria-hidden={flip}>
            <div className="la-bulbs" aria-hidden="true">{Array.from({ length: 26 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</div>
            <p className="la-kick">{t.kicker}</p>
            <h2 id="laT" className="la-word" aria-label={word}>
              {word.split(' ').map((w, wi, all) => {
                const start = all.slice(0, wi).join(' ').length + (wi ? 1 : 0);
                return <span key={lang + wi} className="w" aria-hidden="true">{[...w].map((c, i) => <span key={i} style={{ '--d': ((start + i) * 0.06).toFixed(2) + 's' }}>{c}</span>)}</span>;
              })}
            </h2>
            <p id="laS" className="la-sub">{t.sub}</p>
            <ul className="la-perks">{t.perks.map((p, i) => <li key={i} style={{ '--d': (1.3 + i * 0.15) + 's' }}>{p}</li>)}</ul>
            <div className="la-acts">
              <button type="button" className="la-b la-pass" onClick={() => setFlip(true)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M14 6v12" stroke="currentColor" strokeWidth="1.8" strokeDasharray="2 2.4" /></svg>
                <span>{t.pass}</span>
              </button>
              <button type="button" className="la-b la-go" onClick={close}>{t.go}</button>
            </div>
          </section>
          {/* atrás: el pase holográfico */}
          <section className="la-back" inert={flip ? undefined : ''} aria-hidden={!flip} aria-label={t.ptitle}>
            <div className="la-pase" ref={card}>
              <span className="la-holo" aria-hidden="true" />
              <div className="la-ph">
                <div>
                  <small>SYMPHORIA</small>
                  <b>{t.ptitle}</b>
                  <span>{t.holder}</span>
                </div>
                <SynthonIA fiesta={flip} />
              </div>
              <dl className="la-pd">
                <div><dt>{t.code}</dt><dd className="la-code">{pase ? pase.code : ''}</dd></div>
                <div><dt>{t.since}</dt><dd>{pase ? fecha(pase.t, lang) : ''}</dd></div>
              </dl>
              <p className="la-wink" aria-live="polite">{flip ? t.wink : ''}</p>
            </div>
            <p className="la-note">{t.note}</p>
            <div className="la-acts">
              <button type="button" className="la-b" onClick={() => setFlip(false)}>{t.back}</button>
              <button type="button" className="la-b la-save" onClick={guardar}>{t.save}</button>
              <button type="button" className="la-b la-go" onClick={close}>{t.go}</button>
            </div>
          </section>
        </div>
        <button type="button" className="la-x" onClick={close} aria-label={t.close}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </button>
      </div>
    </div>
  );
}
