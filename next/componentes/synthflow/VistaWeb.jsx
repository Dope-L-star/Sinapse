'use client';
/* SynthFlow en React · v4.1 «Ver funcionando»: la ventana de una página web de varios archivos que hizo la IA.
   El motor (src/chat/02c-web-proyecto.js) agrupa los archivos y arma cada página; esta ventana la muestra:
   · Vista previa en vivo (iframe sandbox en /sintetico.html, sin acceso a la sesión), con atrás/adelante y la lista de páginas.
   · Los enlaces entre páginas navegan aquí dentro; los de otras webs piden permiso antes de abrirse en otra pestaña.
   · Código: una pestaña por archivo, con colores, Copiar y Descargar. Descargar todo en .zip.
   · Tamaños computador/tablet/celular, consola, volver a cargar y pantalla completa.
   Se abre con window.SZWeb.open(proyecto, { path, tab }). ES/EN al instante (SZ.onLang); respeta temas, Simple y animaciones apagadas.
   Estilos: src/chat-css/41-v41-vista-web.css (prefijo .wv). */
import { useCallback, useEffect, useRef, useState } from 'react';

const T = {
  es: {
    kind: 'Página web', files: n => n + (n === 1 ? ' archivo' : ' archivos'), syn: 'Sintético', synTip: 'Corre aparte y aislado: no ve tu cuenta ni tus chats',
    prev: 'Vista previa', code: 'Código', zip: 'Descargar .zip', max: 'Pantalla completa', min: 'Salir de pantalla completa', close: 'Cerrar',
    back: 'Atrás', fwd: 'Adelante', reload: 'Volver a cargar', page: 'Página', sizes: 'Tamaño de pantalla', pc: 'Computador', tab: 'Tablet', cel: 'Celular',
    console: 'Consola', conEmpty: 'Aquí sale lo que la página escribe en la consola y sus errores.', errs: n => n + (n === 1 ? ' error' : ' errores'),
    copy: 'Copiar', copied: '¡Copiado!', down: 'Descargar', filesL: 'Archivos', lines: n => n + (n === 1 ? ' línea' : ' líneas'),
    ext: 'Este enlace lleva a otra web:', open: 'Abrir en otra pestaña', dismiss: 'Quedarme aquí',
    miss: p => 'La IA enlazó «' + p + '», pero no escribió ese archivo.', form: 'El formulario se envió (en la vista previa no sale de aquí).',
    title: 'Vista previa de la página web',
  },
  en: {
    kind: 'Website', files: n => n + (n === 1 ? ' file' : ' files'), syn: 'Synthetic', synTip: 'Runs apart and isolated: it can’t see your account or your chats',
    prev: 'Preview', code: 'Code', zip: 'Download .zip', max: 'Full screen', min: 'Exit full screen', close: 'Close',
    back: 'Back', fwd: 'Forward', reload: 'Reload', page: 'Page', sizes: 'Screen size', pc: 'Computer', tab: 'Tablet', cel: 'Phone',
    console: 'Console', conEmpty: 'What the page writes to the console and its errors show up here.', errs: n => n + (n === 1 ? ' error' : ' errors'),
    copy: 'Copy', copied: 'Copied!', down: 'Download', filesL: 'Files', lines: n => n + (n === 1 ? ' line' : ' lines'),
    ext: 'This link goes to another website:', open: 'Open in a new tab', dismiss: 'Stay here',
    miss: p => 'The AI linked “' + p + '”, but didn’t write that file.', form: 'The form was sent (in the preview it stays here).',
    title: 'Website preview',
  },
};
const SIZES = [['pc', '100%'], ['tab', '820px'], ['cel', '390px']];
const siteLang = () => { try { return window.SZ && window.SZ.lang() === 'en' ? 'en' : 'es'; } catch (e) { return 'es'; } };
const api = () => (window.SZFlow && window.SZFlow.web) || null;
const rid = () => Math.random().toString(36).slice(2, 10);

const I = {
  web: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3 9h18" /><path d="M9.5 13l-2 2 2 2M14.5 13l2 2-2 2" /></svg>,
  zip: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 20h14" /></svg>,
  max: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>,
  min: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>,
  fwd: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>,
  reload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg>,
  lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
  copy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>,
  out: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>,
};
const extOf = p => (p.split('.').pop() || '').toLowerCase();

export default function VistaWeb() {
  const [P, setP] = useState(null);
  const [on, setOn] = useState(false);
  const [view, setView] = useState('prev');
  const [nav, setNav] = useState({ list: [], i: -1 });
  const [file, setFile] = useState('');
  const [size, setSize] = useState('pc');
  const [max, setMax] = useState(false);
  const [lang, setLang] = useState('es');
  const [note, setNote] = useState(null);
  const [log, setLog] = useState([]);
  const [conOpen, setConOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reload, setReload] = useState(0);
  const frame = useRef(null), ids = useRef({ nav: '', probe: '' }), ret = useRef(null), closeBtn = useRef(null), P0 = useRef(null);
  const t = T[lang] || T.es;
  const cur = nav.list[nav.i] || null;

  const close = useCallback(() => {
    setOn(false);
    setTimeout(() => { setP(null); P0.current = null; document.body.classList.remove('webviewing'); try { if (ret.current && ret.current.isConnected) ret.current.focus({ preventScroll: true }); } catch (e) {} }, document.documentElement.classList.contains('noanim') ? 0 : 320);
  }, []);
  const go = useCallback((path, hash) => setNav(n => { const list = n.list.slice(0, n.i + 1); list.push({ path, hash: hash || '' }); return { list, i: list.length - 1 }; }), []);

  /* el motor abre la ventana con window.SZWeb.open(proyecto, { path, tab }) */
  useEffect(() => {
    setLang(siteLang());
    let hooked = false;
    const hook = () => { if (hooked || !window.SZ || !window.SZ.onLang) return; hooked = true; window.SZ.onLang(() => setLang(siteLang())); };
    hook(); addEventListener('synthflow-ready', hook);
    window.SZWeb = Object.freeze({
      open(proj, o = {}) {
        if (!proj || !proj.files) return;
        ret.current = document.activeElement;
        const start = o.path && proj.pages.includes(o.path) ? o.path : proj.entry;
        P0.current = proj; setP(proj); setView(o.tab === 'code' ? 'code' : 'prev');
        setFile(o.path && proj.files.some(f => f.path === o.path) ? o.path : proj.entry);
        setNav({ list: [{ path: start, hash: '' }], i: 0 }); setNote(null); setLog([]); setConOpen(false); setLang(siteLang());
        document.body.classList.add('webviewing');
        requestAnimationFrame(() => requestAnimationFrame(() => { setOn(true); try { closeBtn.current && closeBtn.current.focus({ preventScroll: true }); } catch (e) {} }));
      },
      close,
      isOpen: () => !!P0.current,
    });
    return () => { removeEventListener('synthflow-ready', hook); delete window.SZWeb; };
  }, [close]);

  /* carga la página actual en el iframe aislado */
  useEffect(() => {
    const A = api(), f = frame.current;
    if (!P || !cur || view !== 'prev' || !A || !f) return;
    ids.current = { nav: 'w' + rid(), probe: 'v' + rid() };
    setLog([]);
    A.load(f, A.doc(P, cur.path, { navId: ids.current.nav, probeId: ids.current.probe, hash: cur.hash }));
  }, [P, cur, view, reload]);

  /* lo que avisa la página: enlaces, formularios y consola */
  useEffect(() => {
    if (!P) return;
    const onMsg = e => {
      const d = e.data, f = frame.current;
      if (!d || !f || e.source !== f.contentWindow) return;
      if (d.szw && d.szw === ids.current.nav) {
        if (d.t === 'ext') setNote({ k: 'ext', u: String(d.d || '').slice(0, 500) });
        else if (d.t === 'form') setNote({ k: 'form' });
        else if (d.t === 'nav') {
          const A = api(), r = A && A.go(P, cur ? cur.path : P.entry, String(d.d || ''));
          if (!r) return;
          if (r.missing) setNote({ k: 'miss', p: r.path });
          else if (r.page) { setNote(null); go(r.path, r.hash); }
          else { setView('code'); setFile(r.path); }
        }
      } else if (d.szp && d.szp === ids.current.probe) {
        const add = (k, m) => setLog(l => l.length > 200 ? l : [...l, { k, m }]);
        if (d.t === 'con') add(d.d.k, d.d.m);
        else if (d.t === 'exc') add('error', d.d.m + (d.d.l ? ' (' + (lang === 'en' ? 'line ' : 'línea ') + d.d.l + ')' : ''));
        else if (d.t === 'net') add('warn', (lang === 'en' ? 'Didn’t load: ' : 'No cargó: ') + d.d.u);
      }
    };
    addEventListener('message', onMsg);
    return () => removeEventListener('message', onMsg);
  }, [P, cur, go, lang]);

  /* Escape: primero sale de pantalla completa, luego cierra */
  useEffect(() => {
    if (!P) return;
    const k = e => { if (e.key !== 'Escape') return; e.stopPropagation(); if (max) setMax(false); else close(); };
    addEventListener('keydown', k, true);
    return () => removeEventListener('keydown', k, true);
  }, [P, max, close]);

  if (!P) return null;
  const A = api();
  const F = P.files.find(x => x.path === file) || P.files[0];
  const errs = log.filter(x => x.k === 'error').length;
  const copy = async () => {
    try { await navigator.clipboard.writeText(F.text); } catch (e) { try { window.SZ && window.SZ.copyText && window.SZ.copyText(F.text); } catch (e2) {} }
    setCopied(true); setTimeout(() => setCopied(false), 1400);
  };
  const openExt = () => { try { const u = new URL(note.u, 'https://x.invalid/'); if (/^(https?|mailto|tel):$/.test(u.protocol)) window.open(u.href, '_blank', 'noopener,noreferrer'); } catch (e) {} setNote(null); };

  return (
    <div className={'wv notr' + (on ? ' on' : '') + (max ? ' max' : '')} role="dialog" aria-modal="true" aria-label={t.title + ': ' + (P.title || P.entry)} lang={lang}
      onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="wv-in">
        <header className="wv-h">
          <span className="wv-ic">{I.web}</span>
          <span className="wv-t">
            <b>{P.title || P.entry}</b>
            <small><span className="wv-syn" title={t.synTip}>{t.syn}</span> · {t.kind} · {t.files(P.files.length)}</small>
          </span>
          <button type="button" className="wv-b" onClick={() => A && A.zip(P)} title={t.zip}>{I.zip}<span>{t.zip}</span></button>
          <button type="button" className="wv-b ic hide-cel" onClick={() => setMax(m => !m)} aria-pressed={max} title={max ? t.min : t.max} aria-label={max ? t.min : t.max}>{max ? I.min : I.max}</button>
          <button type="button" className="wv-b ic" ref={closeBtn} onClick={close} title={t.close} aria-label={t.close}>{I.x}</button>
        </header>
        <div className="wv-tabs" role="tablist" aria-label={t.title}>
          <button type="button" role="tab" aria-selected={view === 'prev'} onClick={() => setView('prev')}>{t.prev}</button>
          <button type="button" role="tab" aria-selected={view === 'code'} onClick={() => setView('code')}>{t.code}</button>
        </div>

        {view === 'prev' ? (
          <section className="wv-prev" data-size={size}>
            <div className="wv-bar">
              <button type="button" className="wv-b ic" disabled={nav.i <= 0} onClick={() => setNav(n => ({ ...n, i: Math.max(0, n.i - 1) }))} title={t.back} aria-label={t.back}>{I.back}</button>
              <button type="button" className="wv-b ic" disabled={nav.i >= nav.list.length - 1} onClick={() => setNav(n => ({ ...n, i: Math.min(n.list.length - 1, n.i + 1) }))} title={t.fwd} aria-label={t.fwd}>{I.fwd}</button>
              <label className="wv-addr">
                <span className="wv-lock" title={t.synTip}>{I.lock}</span>
                <span className="sr">{t.page}</span>
                {P.pages.length > 1 ? (
                  <select value={cur ? cur.path : P.entry} onChange={e => go(e.target.value)}>{P.pages.map(p => <option key={p} value={p}>{p}</option>)}</select>
                ) : <span className="wv-path">{cur ? cur.path : P.entry}</span>}
              </label>
              <button type="button" className="wv-b ic" onClick={() => setReload(r => r + 1)} title={t.reload} aria-label={t.reload}>{I.reload}</button>
              <div className="wv-sz hide-cel" role="group" aria-label={t.sizes}>
                {SIZES.map(([k]) => <button key={k} type="button" aria-pressed={size === k} onClick={() => setSize(k)}>{t[k]}</button>)}
              </div>
              <button type="button" className={'wv-b wv-con' + (errs ? ' bad' : '')} aria-expanded={conOpen} onClick={() => setConOpen(c => !c)}>
                <span>{t.console}</span><b>{errs ? t.errs(errs) : log.length}</b>
              </button>
            </div>
            {note ? (
              <div className={'wv-note ' + note.k} role="status">
                {note.k === 'ext' ? <><span>{t.ext} <code>{note.u}</code></span><button type="button" className="wv-b go" onClick={openExt}>{I.out}<span>{t.open}</span></button><button type="button" className="wv-b" onClick={() => setNote(null)}>{t.dismiss}</button></>
                  : <><span>{note.k === 'miss' ? t.miss(note.p) : t.form}</span><button type="button" className="wv-b ic" onClick={() => setNote(null)} aria-label={t.close}>{I.x}</button></>}
              </div>
            ) : null}
            <div className="wv-stage">
              <iframe ref={frame} title={t.title + ': ' + (cur ? cur.path : '')} sandbox="allow-scripts allow-modals allow-forms allow-pointer-lock" referrerPolicy="no-referrer"
                style={{ maxWidth: (SIZES.find(s => s[0] === size) || SIZES[0])[1] }} />
            </div>
            {conOpen ? (
              <div className="wv-log" role="log" aria-label={t.console}>
                {log.length ? log.map((l, i) => <div key={i} className={'wv-ln ' + l.k}>{l.m}</div>) : <p>{t.conEmpty}</p>}
              </div>
            ) : null}
          </section>
        ) : (
          <section className="wv-code">
            <div className="wv-files" role="tablist" aria-label={t.filesL}>
              {P.files.map(f => (
                <button key={f.path} type="button" role="tab" aria-selected={f.path === F.path} data-ext={extOf(f.path)} onClick={() => setFile(f.path)}>
                  <i aria-hidden="true">{extOf(f.path).slice(0, 4).toUpperCase()}</i>{f.path}
                </button>
              ))}
            </div>
            <div className="wv-fbar">
              <span>{F.path} · {t.lines(F.text.split('\n').length)}</span>
              <button type="button" className="wv-b" onClick={copy}>{I.copy}<span>{copied ? t.copied : t.copy}</span></button>
              <button type="button" className="wv-b" onClick={() => A && A.file(F)}>{I.zip}<span>{t.down}</span></button>
            </div>
            <pre className="wv-pre" tabIndex={0}><code>{(A ? A.tokens(F.text, extOf(F.path)) : [['', F.text]]).map(([c, x], i) => <span key={i} className={c || undefined}>{x}</span>)}</code></pre>
          </section>
        )}
      </div>
    </div>
  );
}
