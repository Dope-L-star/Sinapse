/* SynthFlow en React · modo dictado
   v3.9 · hablas y el texto aparece en la caja de escribir (#inp), en vivo, para que lo revises antes de enviar.
   - Usa el reconocimiento de voz que ya trae el navegador (Web Speech API): gratis, sin servicios pagos.
     En Chrome y Edge la voz la convierte en texto Google o Microsoft; en Safari, Apple. SymphorIA no recibe el audio.
   - Apagado para todos: se enciende en Ajustes › IAs y memoria › «Modo dictado» (CFG.dictado → html.dicta).
   - El micrófono no se pide hasta que la persona toca el botón; la primera vez sale un aviso que explica qué pasa.
   - Pausa, reanuda, «Listo» (deja el texto para editarlo) y «Cancelar» (devuelve la caja como estaba).
   - Puntuación por voz («coma», «punto», «nueva línea», «borra eso»…), mayúsculas y «¿» automáticos.
   - Si el navegador no tiene dictado (Firefox), lo dice claro y no rompe nada.
   Estilos: src/chat-css/40-v39-dictado.css (prefijo .dic-). Va montado en CajaEscribir.jsx justo antes de #sendBtn. */
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

const T = {
  es: {
    mic: 'Dictar', micOn: 'Dejar de dictar', tip: 'Dictar con tu voz (Ctrl+Shift+Espacio)',
    listen: 'Te escucho', pause: 'En pausa', start: 'Abriendo el micrófono',
    hold: 'Pausa', resume: 'Seguir', done: 'Listo', cancel: 'Cancelar',
    hint: 'Di «coma», «punto» o «nueva línea». «Borra eso» quita lo último.',
    empty: 'Habla cuando quieras…',
    askT: 'Antes de dictar', askB: 'Vas a usar tu micrófono y tu navegador te pedirá permiso. Lo que dices lo convierte en texto el propio navegador: en Chrome y Edge pasa por Google o Microsoft, y en Safari por Apple. SymphorIA no recibe ni guarda tu voz, solo el texto que tú decidas enviar.',
    askOk: 'Usar el micrófono', askNo: 'Ahora no', priv: 'Privacidad',
    noT: 'Tu navegador no tiene dictado', noB: 'Prueba con Chrome, Edge o Safari. En el celular también puedes tocar el micrófono de tu teclado.', ok: 'Entendido',
    errDeny: 'El micrófono está bloqueado. Actívalo en el candado de la barra de direcciones y vuelve a tocar el micrófono.',
    errMic: 'No encontré un micrófono. Revisa que esté conectado.',
    errNet: 'El dictado necesita internet. Revisa tu conexión.',
    errLang: 'Tu navegador no entiende este idioma por voz.',
    errOther: 'El dictado se detuvo. Toca el micrófono para seguir.',
    idle: 'Paré el dictado porque no te oí. Toca el micrófono para seguir.',
    live: { on: 'Dictado encendido. Habla ahora.', off: 'Dictado terminado. Revisa el texto antes de enviar.', pause: 'Dictado en pausa.', cancel: 'Dictado cancelado.' },
  },
  en: {
    mic: 'Dictate', micOn: 'Stop dictating', tip: 'Dictate with your voice (Ctrl+Shift+Space)',
    listen: 'Listening', pause: 'Paused', start: 'Opening the microphone',
    hold: 'Pause', resume: 'Resume', done: 'Done', cancel: 'Cancel',
    hint: 'Say "comma", "period" or "new line". "Scratch that" removes the last part.',
    empty: 'Speak whenever you are ready…',
    askT: 'Before you dictate', askB: 'You are about to use your microphone and your browser will ask for permission. Your browser turns what you say into text: in Chrome and Edge it goes through Google or Microsoft, and in Safari through Apple. SymphorIA never receives or stores your voice, only the text you choose to send.',
    askOk: 'Use the microphone', askNo: 'Not now', priv: 'Privacy',
    noT: 'Your browser has no dictation', noB: 'Try Chrome, Edge or Safari. On your phone you can also tap the microphone on your keyboard.', ok: 'Got it',
    errDeny: 'The microphone is blocked. Allow it from the lock icon in the address bar and tap the microphone again.',
    errMic: "I couldn't find a microphone. Check that it's connected.",
    errNet: 'Dictation needs internet. Check your connection.',
    errLang: "Your browser can't recognize this language by voice.",
    errOther: 'Dictation stopped. Tap the microphone to continue.',
    idle: "I stopped dictation because I couldn't hear you. Tap the microphone to continue.",
    live: { on: 'Dictation on. Speak now.', off: 'Dictation finished. Check the text before sending.', pause: 'Dictation paused.', cancel: 'Dictation canceled.' },
  },
};

const OK_KEY = 'synthz:dictadoOk';
const IDLE_MS = 14000, MAX_MS = 5 * 60 * 1000;

/* ---------- texto: comandos de voz, espacios, mayúsculas y «¿¡» ---------- */
const CMD = {
  es: [
    [/\b(?:punto y aparte|nuevo p[aá]rrafo)\b/gi, '.\n\n'], [/\b(?:nueva l[ií]nea|salto de l[ií]nea|punto y seguido)\b/gi, m => /seguido/i.test(m) ? '.' : '\n'],
    [/\bpuntos suspensivos\b/gi, '…'], [/\bpunto y coma\b/gi, ';'], [/\bdos puntos\b/gi, ':'],
    [/\babre (?:la )?interrogaci[oó]n\b/gi, '¿'], [/\b(?:cierra (?:la )?interrogaci[oó]n|signo de (?:interrogaci[oó]n|pregunta))\b/gi, '?'],
    [/\babre (?:la )?exclamaci[oó]n\b/gi, '¡'], [/\b(?:cierra (?:la )?exclamaci[oó]n|signo de exclamaci[oó]n)\b/gi, '!'],
    [/\babre par[eé]ntesis\b/gi, '('], [/\bcierra par[eé]ntesis\b/gi, ')'], [/\b(?:abre|cierra) comillas\b/gi, '"'],
    [/\bcoma\b/gi, ','],
    /* «punto» solo cuando no es parte de otra frase («en punto», «punto de vista», «punto com») */
    [/(^|[^\p{L}])(?<!\ben )punto\b(?! de\b| com\b| final\b)/giu, '$1.'],
  ],
  en: [
    [/\bnew paragraph\b/gi, '\n\n'], [/\b(?:new line|next line)\b/gi, '\n'],
    [/\b(?:ellipsis|dot dot dot)\b/gi, '…'], [/\bsemicolon\b/gi, ';'], [/\bcolon\b/gi, ':'],
    [/\bquestion mark\b/gi, '?'], [/\bexclamation (?:mark|point)\b/gi, '!'],
    [/\b(?:open|left) (?:paren|parenthesis)\b/gi, '('], [/\b(?:close|right) (?:paren|parenthesis)\b/gi, ')'], [/\b(?:open|close) quotes?\b/gi, '"'],
    [/\bcomma\b/gi, ','], [/\b(?:period|full stop)\b/gi, '.'],
  ],
};
const BORRA = { es: /\b(?:borra|borrar|quita) (?:eso|lo [uú]ltimo)\b/i, en: /\b(?:scratch that|delete that|undo that)\b/i };

/* quita las partes que dicen «borra eso» y la anterior a ellas */
function sinBorrados(parts, L){
  const out = [];
  parts.forEach(p => { if (BORRA[L].test(p)){ out.pop(); const r = p.replace(new RegExp(BORRA[L].source, 'gi'), '').trim(); if (r) out.push(r); } else if (p.trim()) out.push(p.trim()); });
  return out;
}
export function pulir(raw, L = 'es', capStart = true){
  let s = ' ' + String(raw || '').replace(/\s+/g, ' ') + ' ';
  (CMD[L] || CMD.es).forEach(([re, to]) => { s = s.replace(re, to); });
  s = s.replace(/[ \t]+([,.;:?!…)])/g, '$1')                      /* nada de espacio antes de la puntuación */
    .replace(/([¿¡(])[ \t]+/g, '$1')                               /* ni después de lo que abre */
    .replace(/([,.;:?!…])(?=[^\s,.;:?!…)"\n])/g, '$1 ')            /* y sí uno después */
    .replace(/[ \t]*\n[ \t]*/g, '\n').replace(/([.,;:])\1+/g, '$1').replace(/ {2,}/g, ' ');
  s = s.replace(/^ +| +$/g, '');
  if (L === 'es'){
    /* «¿» y «¡» al inicio de la frase que termina en «?» o «!» */
    s = s.replace(/(^|[.!?…\n]\s*)([^.!?…\n¿¡]+?)([?!])/g, (m, a, b, c) => { const o = c === '?' ? '¿' : '¡'; return b.includes(o) ? m : a + o + b.replace(/^\s+/, '') + c; });
  }
  /* mayúscula al empezar y después de cada punto, «?», «!» o salto de línea */
  s = s.replace(/([.!?…]\s+|\n\s*)([¿¡("]?)(\p{Ll})/gu, (m, a, b, c) => a + b + c.toUpperCase());
  if (capStart) s = s.replace(/^([¿¡("]?)(\p{Ll})/u, (m, a, c) => a + c.toUpperCase());
  if (L === 'en') s = s.replace(/\bi\b/g, 'I');
  return s;
}

/* el código de idioma para el navegador: el que tenga la persona en su equipo (es-CO, en-GB…) o uno general */
function langTag(L){
  try{ const m = (navigator.languages || [navigator.language]).find(x => x && x.toLowerCase().startsWith(L)); if (m) return m; }catch(e){}
  return L === 'en' ? 'en-US' : 'es-ES';
}
const siteLang = () => { try{ return window.SZ && window.SZ.lang() === 'en' ? 'en' : 'es'; }catch(e){ return 'es'; } };
const cfgOn = () => { try{ return !!(window.SZ && window.SZ.CFG && window.SZ.CFG.dictado); }catch(e){ return false; } };
const touchy = () => { try{ return matchMedia('(pointer:coarse)').matches; }catch(e){ return false; } };
const fmtT = ms => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

/* dos tonitos cortos al empezar y al terminar (solo si «Sonidos» está encendido en Ajustes) */
let actx = null;
function blip(up){
  try{
    if (!(window.SZ && window.SZ.CFG && window.SZ.CFG.sound !== false)) return;
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(up ? 660 : 880, t); o.frequency.exponentialRampToValueAtTime(up ? 990 : 520, t + .12);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.08, t + .02); g.gain.exponentialRampToValueAtTime(0.0001, t + .16);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + .18);
  }catch(e){}
}

const IcoMic = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" /></svg>;
const IcoPause = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="5.5" width="3.6" height="13" rx="1.2" /><rect x="13.4" y="5.5" width="3.6" height="13" rx="1.2" /></svg>;
const IcoPlay = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.8v12.4a.8.8 0 0 0 1.2.7l9.8-6.2a.8.8 0 0 0 0-1.4L9.2 5.1a.8.8 0 0 0-1.2.7z" /></svg>;
const IcoOk = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const IcoX = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg>;

export default function Dictado(){
  const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const [L, setL] = useState('es');
  const [on, setOn] = useState(false);           /* el interruptor de Ajustes */
  const [st, setSt] = useState('off');           /* off · start · listen · pause */
  const [card, setCard] = useState(null);        /* null · ask · no · err */
  const [err, setErr] = useState('');
  const [view, setView] = useState({ fin: '', mid: '' });
  const [talk, setTalk] = useState(false);       /* hay voz ahora mismo (para las ondas) */
  const [ms, setMs] = useState(0);
  const [live, setLive] = useState('');
  const E = useRef({ rec: null, st: 'off', parts: [], sess: [], mid: '', pre: '', post: '', orig: null, t0: 0, acc: 0, heard: 0, restarts: 0, writing: false });
  const btnRef = useRef(null), boxRef = useRef(null);
  const t = T[L] || T.es;

  const inp = () => document.getElementById('inp');
  const setState = s => { E.current.st = s; setSt(s); };

  /* escribe en la caja: lo de antes del cursor + lo dictado (+ lo que se está oyendo) + lo de después */
  const paint = useCallback(() => {
    const e = E.current, el = inp(); if (!el) return;
    const Lg = siteLang();
    const parts = sinBorrados(e.parts.concat(e.sess), Lg);
    const capStart = !e.pre.trim() || /[.!?…\n]\s*$/.test(e.pre);
    const fin = pulir(parts.join(' '), Lg, capStart);
    const midRaw = e.mid.trim();
    const all = pulir((parts.join(' ') + ' ' + midRaw).trim(), Lg, capStart);
    const glueA = e.pre && !/\s$/.test(e.pre) && all && !/^[,.;:?!…)]/.test(all) ? ' ' : '';
    const glueB = e.post && all && !/^\s/.test(e.post) ? ' ' : '';
    e.writing = true;
    el.value = e.pre + glueA + all + glueB + e.post;
    const caret = (e.pre + glueA + all).length;
    try{ el.setSelectionRange(caret, caret); }catch(x){}
    el.dispatchEvent(new Event('input', { bubbles: true }));       /* la caja crece y el botón de enviar se activa (motor de chat.js) */
    e.writing = false;
    el.scrollTop = el.scrollHeight;
    setView({ fin, mid: all.length > fin.length ? all.slice(fin.length) : '' });
  }, []);

  const stopRec = useCallback(abort => { const r = E.current.rec; E.current.rec = null; if (!r) return; r.onresult = r.onend = r.onerror = r.onspeechstart = r.onspeechend = null; try{ abort ? r.abort() : r.stop(); }catch(x){} }, []);

  /* lo oído en la sesión del reconocedor pasa a ser texto fijo (al pausar, al reiniciarse solo o al terminar) */
  const absorb = useCallback(() => { const e = E.current; if (e.mid.trim()) e.sess.push(e.mid.trim()); e.parts = e.parts.concat(e.sess); e.sess = []; e.mid = ''; }, []);

  const startRec = useCallback(() => {
    const e = E.current; if (!SR) return;
    const r = new SR();
    const mobile = touchy() || /Android|iPhone|iPad/i.test(navigator.userAgent);
    /* en el celular el modo continuo repite frases (Android): se usa por frase y se reinicia solo */
    r.continuous = !mobile; r.interimResults = true; r.maxAlternatives = 1; r.lang = langTag(siteLang());
    r.onresult = ev => {
      const fin = [], mid = [];
      for (let i = 0; i < ev.results.length; i++){ const x = ev.results[i]; (x.isFinal ? fin : mid).push(x[0] ? x[0].transcript : ''); }
      e.sess = fin.map(s => s.trim()).filter(Boolean); e.mid = mid.join(' ');
      e.heard = Date.now(); setTalk(true); paint();
      if (e.st === 'start') setState('listen');
    };
    r.onspeechstart = () => { e.heard = Date.now(); setTalk(true); };
    r.onspeechend = () => setTalk(false);
    r.onerror = ev => {
      const c = ev && ev.error;
      if (c === 'no-speech' || c === 'aborted') return;      /* silencio o reinicio: se sigue */
      const msg = c === 'not-allowed' || c === 'service-not-allowed' ? 'errDeny' : c === 'audio-capture' ? 'errMic' : c === 'network' ? 'errNet' : c === 'language-not-supported' ? 'errLang' : 'errOther';
      if (msg === 'errDeny'){ try{ localStorage.removeItem(OK_KEY); }catch(x){} }
      e.fatal = msg;
    };
    r.onend = () => {
      if (E.current.rec !== r) return;
      E.current.rec = null; absorb(); paint();
      if (e.fatal){ const m = e.fatal; e.fatal = ''; finish(false); setErr(m); setCard('err'); return; }
      if (e.st === 'listen' || e.st === 'start'){
        if (Date.now() - e.heard > IDLE_MS || Date.now() - e.t0 > MAX_MS){ finish(false); setErr('idle'); setCard('err'); return; }
        e.restarts++; setTimeout(() => { if (e.st === 'listen' || e.st === 'start') startRec(); }, 120);
      }
    };
    e.rec = r;
    try{ r.start(); }catch(x){ e.rec = null; if (e.st !== 'off'){ setState('pause'); } }
  }, [SR, paint, absorb]); // eslint-disable-line react-hooks/exhaustive-deps

  const begin = useCallback(() => {
    const e = E.current, el = inp(); if (!el || el.disabled) return;
    const a = el.selectionStart ?? el.value.length, b = el.selectionEnd ?? el.value.length;
    e.orig = el.value; e.pre = el.value.slice(0, a); e.post = el.value.slice(b);
    e.parts = []; e.sess = []; e.mid = ''; e.t0 = Date.now(); e.heard = Date.now(); e.acc = 0; e.restarts = 0; e.fatal = '';
    setView({ fin: '', mid: '' }); setMs(0); setCard(null); setState('start');
    blip(true); try{ if (touchy() && navigator.vibrate) navigator.vibrate(12); }catch(x){}
    setLive(T[siteLang()].live.on);
    startRec();
  }, [startRec]);

  /* «Listo» (keep=true deja todo) o se corta solo; «Cancelar» devuelve la caja a como estaba */
  const finish = useCallback((cancel, quiet) => {
    const e = E.current; if (e.st === 'off') return;
    const was = e.st; setState('off'); stopRec(!!cancel); setTalk(false);
    if (cancel){ const el = inp(); if (el && e.orig !== null){ e.writing = true; el.value = e.orig; el.dispatchEvent(new Event('input', { bubbles: true })); e.writing = false; } }
    else if (!quiet && was !== 'off'){ absorb(); paint(); }
    e.orig = null;
    if (!quiet){ blip(false); setLive(T[siteLang()].live[cancel ? 'cancel' : 'off']); const el = inp(); if (el && !cancel) el.focus({ preventScroll: true }); }
  }, [stopRec, absorb, paint]);

  const pause = useCallback(() => {
    const e = E.current;
    if (e.st === 'listen' || e.st === 'start'){ setState('pause'); stopRec(false); absorb(); paint(); setTalk(false); e.acc += Date.now() - e.t0; setLive(T[siteLang()].live.pause); }
    else if (e.st === 'pause'){ e.t0 = Date.now(); e.heard = Date.now(); const el = inp(); if (el){ e.pre = el.value.slice(0, el.selectionStart ?? el.value.length); e.post = el.value.slice(el.selectionEnd ?? el.value.length); e.parts = []; } setState('start'); startRec(); setLive(T[siteLang()].live.on); }
  }, [stopRec, absorb, paint, startRec]);

  const tap = useCallback(() => {
    if (E.current.st !== 'off'){ finish(false); return; }
    if (!SR || (typeof window !== 'undefined' && window.isSecureContext === false)){ setCard(c => c === 'no' ? null : 'no'); return; }
    let ok = false; try{ ok = localStorage.getItem(OK_KEY) === '1'; }catch(x){}
    if (!ok){ setCard(c => c === 'ask' ? null : 'ask'); return; }
    begin();
  }, [SR, begin, finish]);

  const accept = () => { try{ localStorage.setItem(OK_KEY, '1'); }catch(x){} begin(); };

  /* idioma del sitio y el interruptor de Ajustes */
  useEffect(() => {
    setL(siteLang()); setOn(cfgOn() || document.documentElement.classList.contains('dicta'));
    const mo = new MutationObserver(() => {
      setL(siteLang());
      const v = document.documentElement.classList.contains('dicta'); setOn(v);
      if (!v && E.current.st !== 'off') finish(false);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'lang'] });
    let hooked = false;
    const hook = () => { if (hooked || !window.SZ || !window.SZ.onLang) return; hooked = true; window.SZ.onLang(() => { setL(siteLang()); const e = E.current; if (e.rec && (e.st === 'listen' || e.st === 'start')){ absorb(); paint(); stopRec(true); startRec(); } }); setOn(cfgOn() || document.documentElement.classList.contains('dicta')); };
    hook(); addEventListener('synthflow-ready', hook);
    return () => { mo.disconnect(); removeEventListener('synthflow-ready', hook); };
  }, [finish, stopRec, absorb, paint, startRec]);

  /* si la persona escribe mientras dicta, lo suyo manda: lo dictado sigue desde donde quedó el cursor.
     Al enviar (Enter o el avión) el dictado se corta antes de que el motor vacíe la caja. */
  useEffect(() => {
    const onInput = ev => { const e = E.current; if (e.writing || e.st === 'off' || !ev.isTrusted) return; const el = ev.target; e.pre = el.value.slice(0, el.selectionStart ?? el.value.length); e.post = el.value.slice(el.selectionEnd ?? el.value.length); e.parts = []; e.sess = []; e.mid = ''; if (e.rec){ stopRec(true); startRec(); } };
    const onKey = ev => {
      const e = E.current;
      if (ev.key === ' ' && ev.shiftKey && (ev.ctrlKey || ev.metaKey) && document.documentElement.classList.contains('dicta')){ ev.preventDefault(); tap(); return; }
      if (e.st === 'off') return;
      if (ev.key === 'Escape'){ ev.preventDefault(); ev.stopPropagation(); finish(false); return; }
      if (ev.key === 'Enter' && !ev.shiftKey && ev.target && ev.target.id === 'inp'){ absorb(); paint(); finish(false, true); }
    };
    const onSend = ev => { if (E.current.st !== 'off' && ev.target.closest && ev.target.closest('#sendBtn')){ absorb(); paint(); finish(false, true); } };
    const onHide = () => finish(false, true);
    document.addEventListener('input', onInput, true);
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('click', onSend, true);
    addEventListener('pagehide', onHide);
    const onVis = () => { if (document.hidden && E.current.st !== 'off') pause(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('input', onInput, true); document.removeEventListener('keydown', onKey, true); document.removeEventListener('click', onSend, true); removeEventListener('pagehide', onHide); document.removeEventListener('visibilitychange', onVis); finish(false, true); };
  }, [tap, finish, absorb, paint, pause, stopRec, startRec]);

  /* reloj y «ya no hay voz» */
  useEffect(() => {
    if (st !== 'listen' && st !== 'start') return;
    const iv = setInterval(() => { const e = E.current; setMs(e.acc + Date.now() - e.t0); if (Date.now() - e.heard > 900) setTalk(false); if (Date.now() - e.heard > IDLE_MS + 2000 && e.st !== 'off'){ finish(false); setErr('idle'); setCard('err'); } }, 250);
    return () => clearInterval(iv);
  }, [st, finish]);

  /* la vista previa siempre muestra lo último que dijiste */
  useEffect(() => { const b = boxRef.current; if (b) b.scrollTop = b.scrollHeight; }, [view]);

  /* cerrar el aviso tocando fuera */
  useEffect(() => {
    if (!card) return;
    const off = ev => { if (ev.target.closest && (ev.target.closest('.dic-card') || ev.target.closest('.dic-mic'))) return; setCard(null); };
    document.addEventListener('pointerdown', off, true);
    return () => document.removeEventListener('pointerdown', off, true);
  }, [card]);

  const active = st !== 'off';
  const label = active ? t.micOn : t.mic;
  return (
    <>
      <button ref={btnRef} type="button" className={'attach dic-mic' + (active ? ' on' : '') + (st === 'pause' ? ' paused' : '') + (talk ? ' talk' : '') + (SR ? '' : ' nosr')}
        id="dicBtn" hidden={!on} aria-pressed={active} aria-label={label} data-tip={active ? label : t.tip} onClick={tap}>
        <IcoMic /><i className="dic-ring" aria-hidden="true" />
      </button>
      {on && active ? (
        <div className={'dic-pane notr' + (talk ? ' talk' : '') + (st === 'pause' ? ' paused' : '')} role="region" aria-label={t.mic} lang={L}>
          <div className="dic-top">
            <span className="dic-wave" aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6].map(i => <i key={i} style={{ '--i': i }} />)}</span>
            <b className="dic-st">{st === 'pause' ? t.pause : st === 'start' ? t.start : t.listen}<span className="dic-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></b>
            <em className="dic-t">{fmtT(ms)}</em>
            <span className="dic-b">
              <button type="button" className="dic-x" onClick={() => finish(true)} aria-label={t.cancel} title={t.cancel}><IcoX /><span>{t.cancel}</span></button>
              <button type="button" className="dic-p" onClick={pause} aria-label={st === 'pause' ? t.resume : t.hold} title={st === 'pause' ? t.resume : t.hold}>{st === 'pause' ? <IcoPlay /> : <IcoPause />}<span>{st === 'pause' ? t.resume : t.hold}</span></button>
              <button type="button" className="dic-ok" onClick={() => finish(false)} aria-label={t.done} title={t.done}><IcoOk /><span>{t.done}</span></button>
            </span>
          </div>
          <div className="dic-tx" ref={boxRef}>{view.fin || view.mid ? <p>{view.fin}<span className="dic-mid">{view.mid}</span></p> : <p className="dic-ph">{t.empty}</p>}</div>
          <p className="dic-hint">{t.hint}</p>
        </div>
      ) : null}
      {on && card ? (
        <div className="dic-card notr" role="dialog" aria-live="polite" aria-label={card === 'ask' ? t.askT : card === 'no' ? t.noT : t.mic} lang={L}>
          <span className="dic-ci" aria-hidden="true"><IcoMic /></span>
          {card === 'ask' ? (<>
            <b>{t.askT}</b><p>{t.askB}</p>
            <div className="dic-cb"><a className="lnk" href={L === 'en' ? 'privacidad.html#dictation' : 'privacidad.html#dictado'} target="_blank" rel="noopener">{t.priv}</a><button type="button" className="lnk" onClick={() => setCard(null)}>{t.askNo}</button><button type="button" className="btn sm flow" onClick={accept}>{t.askOk}</button></div>
          </>) : card === 'no' ? (<>
            <b>{t.noT}</b><p>{t.noB}</p>
            <div className="dic-cb"><button type="button" className="btn sm" onClick={() => setCard(null)}>{t.ok}</button></div>
          </>) : (<>
            <p>{t[err] || t.errOther}</p>
            <div className="dic-cb"><button type="button" className="btn sm" onClick={() => setCard(null)}>{t.ok}</button></div>
          </>)}
        </div>
      ) : null}
      <span className="dic-live" aria-live="polite">{live}</span>
    </>
  );
}
