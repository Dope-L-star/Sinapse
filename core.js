/* ===== SymphorIA · núcleo compartido (datos, llamadas a las IA, escritura suave, cursor) ===== */
(() => {
'use strict';
const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const NF = new Intl.NumberFormat('es-CO'), fmt = n => NF.format(Math.round(n || 0));
/* configuración de la página: visuales SynthZ-Style o rendimiento para PCs modestos */
const CFG_KEYS = ['cursor', 'smooth', 'favAnim', 'bg', 'glass', 'anim'];
/* v2.3 · temas de color de SynthFlow: [id, nombre, color 1, bloqueado (llega con Syntonia)] */
const THEMES = [['synthz', 'SymphorIA', '#e6b65f', 0, '#c9566c'], ['oceano', 'Océano', '#7cc9e3', 0, '#5a7bd6'], ['bosque', 'Bosque', '#9bd68f', 0, '#3fa58a'], ['lavanda', 'Lavanda', '#bfa9f2', 0, '#d46fb0'], ['aurora', 'Aurora', '#9fffd6', 1, '#a46bff'], ['oro', 'Oro negro', '#ffd27a', 1, '#2b2b2b']];
const cfgPreset = perf => CFG_KEYS.reduce((o, k) => (o[k] = perf !== 'speed', o), {});
const CFG = (() => {
  let c = {}; try{ c = JSON.parse(localStorage.getItem('synthz:cfg')) || {}; }catch(e){}
  if (c.v !== 2) c = Object.assign(cfgPreset(c.perf), { perf:c.perf || 'visual' });   /* migración: los ajustes concuerdan con el modo */
  /* v2.3 · en el celular lo que más pesa es el vidrio (desenfoque detrás de cada panel) y el fondo animado.
     Primera visita: modo rápido. Quien ya tenía SymphorIA: se le apagan solo esas dos cosas una vez (las vuelve a encender en Ajustes). */
  let fresh = false; try{ fresh = localStorage.getItem('synthz:cfg') === null; }catch(e){}
  const phone = (() => { try{ return matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) <= 820; }catch(e){ return false; } })();
  /* v3.1 · Sammuel (28 oct): la página se ve completa también en el celular (vidrio, fondo animado y animaciones); si va lenta,
     está el modo más rápido en Ajustes. Solo el cursor propio sigue apagado en pantallas táctiles (no hay puntero que seguir).
     A quien v2.3 le apagó el vidrio y el fondo sola (lite:1), se le devuelven una vez. */
  if (phone && fresh) c = Object.assign(cfgPreset('visual'), { perf:'visual', cursor:false, lite:2 });
  else if (phone && c.lite !== 2){ c = Object.assign({}, c, cfgPreset('visual'), { perf:'visual', cursor:false, lite:2 }); try{ localStorage.setItem('synthz:cfg', JSON.stringify(Object.assign({ v:2 }, c))); }catch(e){} }
  return Object.assign({ v:2, perf:'visual', intro:'session', sound:true }, cfgPreset(c.perf), c);
})();
const PERF = CFG.perf === 'speed';
/* v3.1 · manda Ajustes (Animaciones, Vidrio, Modo rápido), no el sistema: con los «efectos visuales» de Windows apagados,
   Chrome pide «reducir movimiento» y «reducir transparencia», y la página se quedaba sin animaciones ni vidrio (28 oct).
   Quien no quiera movimiento o vidrio lo apaga en Ajustes, o usa el modo más rápido. */
const OS_RM = false, OS_RT = false;
const reduce = !CFG.anim || OS_RM;
function cfgClasses(){ const r = document.documentElement; r.classList.toggle('nocur', !CFG.cursor); if (!CFG.cursor) r.classList.remove('cursor-on'); r.classList.toggle('noglass', !CFG.glass || OS_RT); r.classList.toggle('rtr', OS_RT); r.classList.toggle('nobg', !CFG.bg); r.classList.toggle('noanim', !CFG.anim || OS_RM); r.classList.remove('perf'); r.classList.toggle('pmode', CFG.perf === 'speed');
  /* v2.3 · solo en SynthFlow: estilo Simple, color del tema y barra del celular a la izquierda */
  const chat = !!document.getElementById('composer') || /chat(\.html)?$/.test(location.pathname), simple = chat && CFG.ui === 'simple';
  r.classList.toggle('simple', simple); if (simple){ r.classList.add('noglass', 'nobg'); } r.classList.toggle('navleft', chat && CFG.nav === 'left');
  /* v2.9.2 · tamaño de SynthFlow: compacto (por defecto) o normal; el CSS (chat-css 29) lo achica con zoom:var(--ui-z) */
  r.classList.toggle('compact', chat && CFG.size !== 'normal');
  /* v3.2 · atajos de la lista de chats: ninguno (por defecto), solo Sintéticos, solo Proyectos o los dos; siempre siguen en la barrita de íconos */
  const lk = CFG.links || 'none'; r.classList.toggle('lk-proj', chat && (lk === 'proj' || lk === 'both')); r.classList.toggle('lk-syn', chat && (lk === 'syn' || lk === 'both'));
  if (chat && !simple && THEMES.some(t => t[0] === CFG.theme && !t[3])) r.dataset.theme = CFG.theme; else delete r.dataset.theme; }
cfgClasses();
function saveCfg(){ try{ localStorage.setItem('synthz:cfg', JSON.stringify(CFG)); }catch(e){} }
const today = () => new Date().toLocaleDateString('en-CA');
const sleepRaw = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const est = s => Math.ceil(s.length / 4);

/* rayo-Z: recta, con el inicio (arriba izquierda) y el final (abajo derecha) en forma de rayo */
const Z_PATH = 'M13 4H44V12L18 36H49L39 40H45L35 44H4V36L30 12H-1L9 8H3Z';

/* ---------- logos de cada IA ---------- */
const ICONS = {
  synthz: () => `<defs><linearGradient id="szig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fb0ff"/><stop offset=".55" stop-color="#c9566c"/><stop offset="1" stop-color="#e6b65f"/></linearGradient></defs><rect x="1" y="1" width="22" height="22" rx="7" fill="#15121c"/><path d="${Z_PATH}" transform="translate(4.4 4.4) scale(.32)" fill="url(#szig)"/>`,
  puter: () => `<rect x="1" y="1" width="22" height="22" rx="6" fill="#1e2a4a"/><text x="12" y="16.5" text-anchor="middle" font-family="Figtree,system-ui,sans-serif" font-size="13" font-weight="700" fill="#fff">P</text><image href="${PUTER_LOGO}" x="0" y="0" width="24" height="24" preserveAspectRatio="xMidYMid meet" onerror="this.remove()"/>`,
  groq: (c, d) => `<path d="M19.2 7.2A8.6 8.6 0 1 0 20.6 12.9H12.6" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12.6" cy="12.9" r="1.7" fill="${d}"/>`,
  gemini: (c, d) => `<path d="M12 1.5C12.4 7.8 16.2 11.6 22.5 12C16.2 12.4 12.4 16.2 12 22.5C11.6 16.2 7.8 12.4 1.5 12C7.8 11.6 11.6 7.8 12 1.5Z" fill="${c}"/><path d="M19.5 2.5C19.6 4 20.5 4.9 22 5C20.5 5.1 19.6 6 19.5 7.5C19.4 6 18.5 5.1 17 5C18.5 4.9 19.4 4 19.5 2.5Z" fill="${d}"/>`,
  mistral: (c, d) => [[0,0],[4,0],[0,1],[1,1],[3,1],[4,1],[0,2],[2,2],[4,2],[0,3],[4,3],[0,4],[4,4]]
    .map(([x, y]) => `<rect x="${2 + x * 4}" y="${2 + y * 4}" width="3.5" height="3.5" rx=".6" fill="${y < 2 ? c : d}"/>`).join(''),
  openrouter: (c, d) => `<path d="M2 15.5H6.8C10.6 15.5 10.8 8 15 8H19.5" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 15.5H6.8C10.6 15.5 10.8 20.5 15 20.5H19.5" fill="none" stroke="${d}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 4.8L22 8L18 11.2M18 17.3L22 20.5L18 23.7" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  claude: (c, d) => [10, 6.8, 9.2, 6.2, 10.4, 6.6, 9.4, 6.2, 10, 7, 9, 6.4].map((l, i) => {
    const a = (i * 30 - 90) * Math.PI / 180;
    return `<line x1="12" y1="12" x2="${(12 + Math.cos(a) * l).toFixed(2)}" y2="${(12 + Math.sin(a) * l).toFixed(2)}" stroke="${i % 2 ? d : c}" stroke-width="2.3" stroke-linecap="round"/>`;
  }).join(''),
  chatgpt: (c, d) => [0, 1, 2, 3, 4, 5].map(i => `<rect x="8.6" y="1.7" width="6.8" height="12.2" rx="3.4" fill="none" stroke="${i % 2 ? d : c}" stroke-width="1.7" transform="rotate(${i * 60} 12 12)"/>`).join('')
};
const PUTER_LOGO = 'https://developer.puter.com/favicons/ms-icon-144x144.png';
const puterLogo = cls => '<span class="pu-logo ' + (cls || '') + '"><img src="' + PUTER_LOGO + '" alt="Puter" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"></span>';
const ico = p => (typeof BRANDS !== 'undefined' && BRANDS[p.id === 'mistral' ? 'mistralai' : p.id]) ? glassIcon({ id:p.id, vendor:p.id === 'mistral' ? 'mistralai' : p.id }, 'lgi') : `<i class="lg" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[p.id](p.c, p.d)}</svg></i>`;
/* marca: en SynthFlow (html[data-brand=flow]) el logotipo es «SynthFlow» con destellos; en el resto, «Symphor» + «IA» en degradado (v3.0: la página se llama SymphorIA) */
const isFlow = () => document.documentElement.dataset.brand === 'flow';
const BRAND = () => isFlow() ? 'SynthFlow' : 'SymphorIA';
const SPARKS = '<i class="sp s1" aria-hidden="true"></i><i class="sp s2" aria-hidden="true"></i><i class="sp s3" aria-hidden="true"></i>';
const GS = '<span class="gS">S</span>ynth';
/* v2.8: el degradado de la onda del orbe vive en los íconos (core 25g), siempre visible: antes cada orbe traía uno con el mismo id
   y, si el primero de la página estaba escondido, las ondas de todos los logos de SynthFlow desaparecían */
/* v2.5 · logos del boceto: SymphorIA = Z de vidrio + «Synth» blanco con la Z en degradado; SynthFlow = la esfera de vidrio con la onda */
const LOGO_Z = '<img class="lgz" src="media/v30/symphoria.svg" alt="" draggable="false">';
const flowOrb = cls => '<span class="sforb' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><path d="M8 32c5-14 10-14 14 0s9 14 14 0 9-14 14 0 5 8 6 4" stroke="url(#sfOrbG)" stroke-width="5" stroke-linecap="round"/></svg></span>';
/* íconos de archivo: se dibujan en código (giFile, en core 25g); si no hay uno para esa extensión, null */
const fileIco = ext => giFile(ext);
const flowWord = () => '<span class="flw-w">' + flowOrb() + '<span class="fw-t">SynthFlow</span></span>';
const zMark = (txt = 'Synth') => '<span class="zw">' + (txt === 'Synth' ? 'Symphor' : txt) + '<span class="zt">IA</span></span>';
const zWord = (txt = 'Synth') => isFlow() && txt === 'Synth' ? flowWord() : zMark(txt);

/* ---------- datos ---------- */
const API = [
  { id:'openrouter', name:'OpenRouter', c:'#c9566c', d:'#8fb0ff', kind:'openai', url:'https://openrouter.ai/api/v1', keyUrl:'https://openrouter.ai/keys',
    desc:'Conecta tu llave de OpenRouter y usa sus modelos gratuitos (etiqueta :free), incluido gpt-oss de OpenAI.', models:['openai/gpt-oss-20b:free','meta-llama/llama-3.3-70b-instruct:free'] }
];
const MANUAL = [];
const USAGE_EXTRA = [{ id:'synthz', name:'IAs conectadas', c:'#e6b65f', d:'#c9566c' }, { id:'puter', name:'Puter', c:'#6fd3d6', d:'#8fb0ff', est:true }, { id:'groq', name:'Groq', c:'#f55036', d:'#ffb36b', hidden:true }];
/* IA de SymphorIA: las llaves gratis del equipo, compartidas con todos (nunca salen del servidor; cero cobros) */
const SZ_P = { id:'synthz', name:'Las IAs conectadas', kind:'openai', url:'/api/ai', models:['sz:auto'] };
/* Groq con la llave propia de cada persona (opcional): va directo del navegador a Groq, nunca pasa por SymphorIA */
const GROQ_P = { id:'groq', name:'Groq', kind:'openai', url:'https://api.groq.com/openai/v1', keyUrl:'https://console.groq.com/keys', models:[] };
const ALL = [...API, ...MANUAL, ...USAGE_EXTRA];
const byId = id => ALL.find(p => p.id === id);

/* ===== v3.0 · idioma: toda la página en español o en inglés =====
   Textos en I18N.es / I18N.en con claves planas («nav.chat», «syn.title»…). Cada hilo/área pone sus textos en su propia pieza
   (00c-idioma-landing.js, 00d-idioma-flow.js…) con Object.assign(I18N.es, {…}); Object.assign(I18N.en, {…}).
   t('clave', { n:3 }) cambia {n}; {brand} es BRAND(). Si falta en inglés, sale el español; si falta del todo, sale la clave.
   HTML: data-i18n="clave" (texto), data-i18n-html="clave" (solo textos nuestros con <b>/<br>), data-i18n-attr="placeholder=clave;aria-label=clave2". */
const I18N = { es:{}, en:{} };
const LANGS = [['es', 'Español'], ['en', 'English']];
let LANG = (() => {
  try{ const s = localStorage.getItem('synthz:lang'); if (s === 'es' || s === 'en') return s; }catch(e){}
  return /^en\b/i.test((navigator.languages && navigator.languages[0]) || navigator.language || '') ? 'en' : 'es';
})();
document.documentElement.lang = LANG;
const lang = () => LANG;
function t(k, v){
  let s = (I18N[LANG] && I18N[LANG][k]) ?? I18N.es[k] ?? k;
  if (typeof s === 'function') return s(v || {});
  return String(s).replace(/\{(\w+)\}/g, (m, n) => n === 'brand' ? BRAND() : (v && v[n] != null ? v[n] : m));
}
function i18nApply(r = document){
  /* si el texto ya es el mismo no se toca: así no se borran las letras animadas (charify) ni se rompen referencias */
  r.querySelectorAll('[data-i18n]').forEach(el => { const v = t(el.dataset.i18n); if (el.textContent !== v) el.textContent = v; });
  const tp = document.createElement('template');
  r.querySelectorAll('[data-i18n-html]').forEach(el => { tp.innerHTML = t(el.dataset.i18nHtml); if (el.innerHTML !== tp.innerHTML) el.innerHTML = tp.innerHTML; });
  r.querySelectorAll('[data-i18n-attr]').forEach(el => el.dataset.i18nAttr.split(';').forEach(p => { const [a, k] = p.split('=').map(x => x && x.trim()); if (a && k) el.setAttribute(a, t(k)); }));
}
const langHooks = [];
function setLang(l){
  if (!I18N[l] || l === LANG) return;
  LANG = l; document.documentElement.lang = l;
  try{ localStorage.setItem('synthz:lang', l); }catch(e){}
  i18nApply(); langHooks.forEach(f => { try{ f(l); }catch(e){} });
}
const onLang = f => langHooks.push(f);
addEventListener('storage', e => { if (e.key === 'synthz:lang' && e.newValue && e.newValue !== LANG) setLang(e.newValue); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => i18nApply()); else setTimeout(() => i18nApply(), 0);
/* ===== v3.0 · textos de la landing SymphorIA y de EnerX (español / inglés). Formato en 00b-idioma.js ===== */
/* EnerX: el nombre de la batería vive solo aquí. Cambia ENERX y cambia en toda la página (landing, SynthFlow, Pulsem, SynthonIA), en español y en inglés */
const ENERX = 'EnerX';
Object.assign(I18N.es, {
  'landing.nombre.eyebrow': 'Por qué se llama así',
  'landing.nombre.t1': 'SymphorIA:',
  'landing.nombre.t2': 'el portador de la armonía',
  'landing.nombre.lead': 'Un nombre hecho con dos raíces griegas. Juntas dicen lo que hace la página: tomar muchas IAs y muchos datos y llevarlos a una sola respuesta clara.',
  'landing.nombre.sym': 'Junto, con, en sintonía. La misma raíz de <b>sinfonía</b>, <b>sinergia</b> y <b>simbiosis</b>.',
  'landing.nombre.phora': 'Llevar, ser portador. La misma raíz de <b>metáfora</b>, <b>semáforo</b> y <b>anáfora</b>.',
  'landing.lang': 'EN',
  'landing.langAria': 'EN: cambiar el idioma a inglés',
  'landing.langMenu': 'English',
  'ix.hold': 'Pregúntale lo que sea…',
  'ix.meet': 'Conoce a SynthonIA',
  'enerx.name': '{enerx}',
  'enerx.today': '{enerx} de hoy',
  'enerx.left': 'Te queda {n} % de {enerx}',
  'ia.swapped': 'respondió {n} porque la que elegiste no estaba disponible',
  'enerx.empty': 'Sin {enerx} por hoy',
  'enerx.emptyShort': 'Sin {enerx}',
  'enerx.of': 'de {enerx} · se carga a medianoche',
  'enerx.ofEmpty': 'sin {enerx} · se carga a medianoche',
  'enerx.used': ' · usó {u} % de tu {enerx} · te queda {n} %',
  'enerx.small': 'Gratis. Tu {enerx} (tu batería) baja un poco con cada mensaje (lo que escribes y lo que te responde). A medianoche se carga al 100 %.',
  'enerx.hint': 'Tu {enerx} de hoy (tu batería): toca para ver el detalle',
  'enerx.guestLeft': 'Te quedan {n} mensajes de prueba',
  'enerx.spent': 'Usaste 1 mensaje de prueba. Te quedan {n}.',
  'enerx.spent0': 'Usaste tu último mensaje de prueba.',
  'enerx.guestShort': '{n} de prueba',
  'enerx.rest': 'Las IAs gratis están descansando',
  'enerx.restShort': 'Descansando',
  'enerx.signin': 'Entra a tu cuenta para seguir FlowIAndo',
  'enerx.signinShort': 'Entra para seguir'
});
Object.assign(I18N.en, {
  'landing.nombre.eyebrow': 'Why the name',
  'landing.nombre.t1': 'SymphorIA:',
  'landing.nombre.t2': 'the bearer of harmony',
  'landing.nombre.lead': 'A name built from two Greek roots. Together they say what the site does: take many AIs and lots of data and carry them into one clear answer.',
  'landing.nombre.sym': 'Together, with, in tune. The same root as <b>symphony</b>, <b>synergy</b> and <b>symbiosis</b>.',
  'landing.nombre.phora': 'To carry, to bear. The same root as <b>metaphor</b>, <b>semaphore</b> and <b>anaphora</b>.',
  'landing.lang': 'ES',
  'landing.langAria': 'ES: switch the language to Spanish',
  'landing.langMenu': 'Español',
  'ix.hold': 'Ask it anything…',
  'ix.meet': 'Meet SynthonIA',
  'enerx.name': '{enerx}',
  'enerx.today': "Today's {enerx}",
  'enerx.left': '{n} % {enerx} left',
  'ia.swapped': '{n} answered because the one you picked wasn\'t available',
  'enerx.empty': 'Out of {enerx} for today',
  'enerx.emptyShort': 'No {enerx}',
  'enerx.of': '{enerx} · recharges at midnight',
  'enerx.ofEmpty': 'no {enerx} · recharges at midnight',
  'enerx.used': ' · used {u} % of your {enerx} · {n} % left',
  'enerx.small': 'Free. Your {enerx} (your battery) drops a little with each message (what you write and what you get back). At midnight it recharges to 100 %.',
  'enerx.hint': "Today's {enerx} (your battery): tap for details",
  'enerx.guestLeft': '{n} trial messages left',
  'enerx.spent': 'You used 1 trial message. {n} left.',
  'enerx.spent0': 'You used your last trial message.',
  'enerx.guestShort': '{n} trial',
  'enerx.rest': 'The free AIs are resting',
  'enerx.restShort': 'Resting',
  'enerx.signin': 'Sign in to keep going',
  'enerx.signinShort': 'Sign in to continue'
});

/* textos fijos de la portada (index.html): claves ix.NNN en el orden en que aparecen en la página */
Object.assign(I18N.es, {
 "ix.001": "Qué es",
 "ix.002": "Modos",
 "ix.003": "Para ti",
 "ix.004": "Preguntas",
 "ix.005": "Qué es",
 "ix.006": "Modos",
 "ix.007": "Para ti",
 "ix.008": "Preguntas",
 "ix.009": "SynthFlow",
 "ix.010": "Mis IA",
 "ix.011": "Tu uso",
 "ix.012": "Mi cuenta",
 "ix.013": "Guía",
 "ix.014": "Configuración",
 "ix.015": "Nuevo",
 "ix.016": "Diseña a la <span class=\"gt\">velocidad del pensamiento.</span>",
 "ix.017": "En sintonía con la IA.",
 "ix.018": "Pregunta, crea, programa y compara muchas IAs desde un solo lugar.",
 "ix.019": "Pregúntale lo que sea",
 "ix.020": "Empezar gratis",
 "ix.021": "1. Una planta de interior…",
 "ix.022": "2. Un llavero personalizado…",
 "ix.023": "3. Una taza ilustrada…",
 "ix.024": "Ejemplo",
 "ix.025": "Así de fácil",
 "ix.026": "<b>Pregunta</b> lo que sea",
 "ix.027": "Dame 3 ideas para un <b>regalo barato</b>",
 "ix.028": "<b>Compara</b> y elige",
 "ix.029": "IA 1",
 "ix.030": "IA 2",
 "ix.031": "La que tenga más Flow",
 "ix.032": "<b>SynthonIA</b> te acompaña",
 "ix.033": "¿Qué es estar <span class=\"gt\">synthonized</span>?",
 "ix.034": "Que la IA y tú se entiendan a la primera, como sintonizar tu canción favorita.",
 "ix.035": "Tú decides cómo trabajar",
 "ix.036": "Tu pregunta",
 "ix.037": "<b>?</b>¿Qué tan difícil es?",
 "ix.038": "<b>Sencilla</b>una IA que sabe de eso",
 "ix.039": "<b>Difícil</b>SuperiorSynth",
 "ix.040": "Por defecto",
 "ix.041": "Automático",
 "ix.042": "Elige solo: si tu pregunta es sencilla, la pasa a una IA que sabe de eso; si es difícil, llama a SuperiorSynth.",
 "ix.043": "Tú mandas",
 "ix.044": "Chat",
 "ix.045": "Tú eliges la IA y conversas.",
 "ix.046": "Gratis",
 "ix.047": "SuperiorSynth",
 "ix.048": "El agente rápido: entiende tu pedido, lo mejora y se lo pasa a la IA que más sabe.",
 "ix.049": "SynthonIA es para ti",
 "ix.050": "Estudia y entiende",
 "ix.051": "«Explícame este tema paso a paso»",
 "ix.052": "Probar en SynthFlow →",
 "ix.053": "Programa y resuelve",
 "ix.054": "«Encuentra el error en mi código»",
 "ix.055": "Probar en SynthFlow →",
 "ix.056": "Crea y desarrolla ideas",
 "ix.057": "«Resume este documento»",
 "ix.058": "Probar en SynthFlow →",
 "ix.059": "Todo esto es gratis",
 "ix.060": "Todas las IAs. Un solo lugar.",
 "ix.061": "Escribe, compara y quédate con la mejor respuesta.",
 "ix.062": "Para escribir",
 "ix.063": "Para estudiar",
 "ix.064": "Para programar",
 "ix.065": "Para imágenes",
 "ix.066": "Para buscar en internet",
 "ix.067": "Las IAs famosas con tu cuenta gratis",
 "ix.068": "Compáralas a ciegas",
 "ix.069": "Respuesta A",
 "ix.070": "Una planta de interior no pide mucho cuidado y alegra cualquier cuarto.",
 "ix.071": "Esta tiene más Flow",
 "ix.072": "Respuesta B",
 "ix.073": "Llegó primero",
 "ix.074": "Un llavero con sus iniciales es barato y se siente personal.",
 "ix.075": "Esta tiene más Flow",
 "ix.076": "Respuesta C",
 "ix.077": "Una taza con un dibujo hecho por ti dura años y la usará cada mañana.",
 "ix.078": "Esta tiene más Flow",
 "ix.079": "Respuesta D",
 "ix.080": "Una cartita escrita a mano con un dulce: cuesta poco y se recuerda mucho.",
 "ix.081": "Esta tiene más Flow",
 "ix.082": "¿Qué IA es mejor para…?",
 "ix.083": "Una guía rápida de dónde suele destacar cada una. Con tus propias preguntas, lo mejor es compararlas.",
 "ix.084": "Programar",
 "ix.085": "Escribir textos largos",
 "ix.086": "Buscar e investigar",
 "ix.087": "Preguntas del día a día",
 "ix.088": "Matemáticas y lógica",
 "ix.089": "Respuestas rápidas",
 "ix.090": "¿No quieres elegir? El modo <b>Automático</b> manda cada pregunta a la IA que más sabe de eso. Las IAs cambian seguido, así que esta guía es general.",
 "ix.091": "Tu IA ya está lista",
 "ix.092": "Ya puedes chatear gratis, sin tarjetas ni configurar nada. Si quieres más, conecta Puter y usa la versión pro de las IAs más usadas.",
 "ix.093": "Todo es gratis. Cada persona tiene un límite gratis al día que se llena otra vez a medianoche. SymphorIA nunca te cobra.",
 "ix.094": "Pregunta en SynthFlow",
 "ix.095": "SynthFlow es donde conversas con la IA. Elige con quién hablar, escribe tu pregunta y SynthFlow se abre en grande para que sigas ahí.",
 "ix.096": "Si no escribes nada, SynthFlow se abre vacío para que empieces allí.",
 "ix.097": "Siempre sabes cuánta {enerx} tienes",
 "ix.098": "{enerx} es tu batería del día: baja con cada mensaje y se carga a medianoche. Aquí ves cuánta te queda, lo que llevas chateado y tu día más activo.",
 "ix.099": "de {enerx} hoy · se carga a medianoche",
 "ix.100": "Dónde chateas",
 "ix.101": "¿Cuánto gasta cada cosa?",
 "ix.102": "<b>Pregunta normal</b> · un poquito de {enerx}, según lo largo de la respuesta",
 "ix.103": "<b>Comparar IAs</b> · cada IA gasta su parte de {enerx}",
 "ix.104": "<b>SuperiorSynth</b> · su plan y la respuesta",
 "ix.105": "<b>Crear una imagen</b> · 1 imagen de las de hoy",
 "ix.106": "<b>Buscar en internet</b> · 1 búsqueda (30 al día con tu cuenta)",
 "ix.107": "<b>Una misión de A.L.I.A.S.</b> · 1 misión y sus pasos",
 "ix.108": "Mensajes por día · últimos 14 días",
 "ix.109": "Preguntas frecuentes",
 "ix.110": "¿Necesito saber de tecnología?",
 "ix.111": "Para nada. Escribes como hablas y SynthonIA te entiende.",
 "ix.112": "¿Puede navegar por internet o publicar mi app?",
 "ix.113": "Busca en internet y te da las fuentes, pero no abre un navegador completo ni publica apps.",
 "ix.114": "¿Es gratis de verdad?",
 "ix.115": "Sí. Cada persona tiene un límite gratis al día que se llena otra vez a medianoche. SymphorIA nunca te cobra.",
 "ix.116": "¿Qué pasa si se me acaba el límite?",
 "ix.117": "Esperas a la medianoche, o conectas tu cuenta gratis de Puter para seguir con las IAs más famosas.",
 "ix.118": "¿Cuánto gasta cada cosa?",
 "ix.119": "Lo ves antes de enviar, junto a la caja de escribir, y en «Tu uso» siempre sabes cuánto te queda.",
 "ix.120": "¿Mis chats están seguros?",
 "ix.121": "Se guardan en tu equipo. Si entras a tu cuenta, también los ves en tu celular y en cualquier computador. Para responderte, tu mensaje viaja a la IA que elijas. Más detalles en <a href=\"privacidad.html\">Privacidad</a>.",
 "ix.122": "¿Qué es A.L.I.A.S.?",
 "ix.123": "Un agente aparte: le cuentas un objetivo, te muestra el plan en pasos y los cumple uno a uno. Tú puedes pausar, aprobar o rehacer cada paso.",
 "ix.124": "¿Funciona en el celular?",
 "ix.125": "Sí. La página se acomoda a cualquier pantalla, del celular más pequeño al computador.",
 "ix.126": "¿Funciona en español?",
 "ix.127": "Sí. Le escribes en español y te responde en español. También entiende inglés y muchos otros idiomas.",
 "ix.128": "¿Qué IA es la mejor?",
 "ix.129": "Depende de lo que pidas. Mira la guía «¿Qué IA es mejor para…?» o compáralas a ciegas con tu propia pregunta. Si no quieres elegir, el modo Automático lo hace por ti.",
 "ix.130": "¿Hay app?",
 "ix.131": "Instalar la app",
 "ix.132": "¿Se nota que usé IA?",
 "ix.133": "Puede notarse. Existen detectores, aunque se equivocan seguido. Lo mejor es usar la IA para aprender y revisar, escribir con tus palabras y seguir las reglas de tu colegio o trabajo.",
 "ix.134": "¿Listo para <span class=\"gt\">sintonizar</span>?",
 "ix.135": "Empezar gratis",
 "ix.137": "En sintonía con la IA.",
 "ix.138": "Gratis y sin tiendas: en Android y computador se instala con un toque; en iPhone te mostramos los pasos.",
 "ix.139": "Producto",
 "ix.140": "SynthFlow",
 "ix.141": "SuperiorSynth",
 "ix.142": "SynthonIA",
 "ix.143": "Ayuda",
 "ix.144": "Preguntas",
 "ix.145": "Tu uso",
 "ix.146": "Legal",
 "ix.147": "Privacidad",
 "ix.148": "Términos",
 "ix.ayuda": "Ayuda",
 "ix.149": "Tus chats se guardan en este equipo. Si entras a tu cuenta, también los ves en tu celular y en cualquier computador."
});
Object.assign(I18N.en, {
 "ix.001": "What it is",
 "ix.002": "Modes",
 "ix.003": "For you",
 "ix.004": "FAQ",
 "ix.005": "What it is",
 "ix.006": "Modes",
 "ix.007": "For you",
 "ix.008": "FAQ",
 "ix.009": "SynthFlow",
 "ix.010": "My AIs",
 "ix.011": "Your usage",
 "ix.012": "My account",
 "ix.013": "Guide",
 "ix.014": "Settings",
 "ix.015": "New",
 "ix.016": "Design at the <span class=\"gt\">speed of thought.</span>",
 "ix.017": "In tune with AI.",
 "ix.018": "Ask, create, code and compare many AIs from one place.",
 "ix.019": "Ask it anything",
 "ix.020": "Start free",
 "ix.021": "1. A houseplant…",
 "ix.022": "2. A personalized keychain…",
 "ix.023": "3. An illustrated mug…",
 "ix.024": "Example",
 "ix.025": "That easy",
 "ix.026": "<b>Ask</b> anything",
 "ix.027": "Give me 3 ideas for a <b>cheap gift</b>",
 "ix.028": "<b>Compare</b> and choose",
 "ix.029": "AI 1",
 "ix.030": "AI 2",
 "ix.031": "The one with more Flow",
 "ix.032": "<b>SynthonIA</b> is with you",
 "ix.033": "What does it mean to be <span class=\"gt\">synthonized</span>?",
 "ix.034": "That you and the AI understand each other right away, like tuning in to your favorite song.",
 "ix.035": "You decide how to work",
 "ix.036": "Your question",
 "ix.037": "<b>?</b>How hard is it?",
 "ix.038": "<b>Simple</b>an AI that knows the topic",
 "ix.039": "<b>Hard</b>SuperiorSynth",
 "ix.040": "Default",
 "ix.041": "Automatic",
 "ix.042": "It chooses for you: a simple question goes to an AI that knows the topic; a hard one goes to SuperiorSynth.",
 "ix.043": "You're in charge",
 "ix.044": "Chat",
 "ix.045": "You pick the AI and talk.",
 "ix.046": "Free",
 "ix.047": "SuperiorSynth",
 "ix.048": "The fast agent: it understands your request, improves it and hands it to the AI that knows the most.",
 "ix.049": "SynthonIA is for you",
 "ix.050": "Study and understand",
 "ix.051": "“Explain this topic step by step”",
 "ix.052": "Try it in SynthFlow →",
 "ix.053": "Code and solve",
 "ix.054": "“Find the bug in my code”",
 "ix.055": "Try it in SynthFlow →",
 "ix.056": "Create and grow ideas",
 "ix.057": "“Summarize this document”",
 "ix.058": "Try it in SynthFlow →",
 "ix.059": "All of this is free",
 "ix.060": "Every AI. One place.",
 "ix.061": "Write, compare and keep the best answer.",
 "ix.062": "For writing",
 "ix.063": "For studying",
 "ix.064": "For coding",
 "ix.065": "For images",
 "ix.066": "For searching the web",
 "ix.067": "The famous AIs with your free account",
 "ix.068": "Compare them blind",
 "ix.069": "Answer A",
 "ix.070": "A houseplant needs little care and brightens up any room.",
 "ix.071": "This one has more Flow",
 "ix.072": "Answer B",
 "ix.073": "Came first",
 "ix.074": "A keychain with their initials is cheap and feels personal.",
 "ix.075": "This one has more Flow",
 "ix.076": "Answer C",
 "ix.077": "A mug with a drawing you made lasts for years and gets used every morning.",
 "ix.078": "This one has more Flow",
 "ix.079": "Answer D",
 "ix.080": "A handwritten note with a candy: it costs little and is remembered a lot.",
 "ix.081": "This one has more Flow",
 "ix.082": "Which AI is best for…?",
 "ix.083": "A quick guide to where each one usually shines. With your own questions, the best thing is to compare them.",
 "ix.084": "Coding",
 "ix.085": "Writing long texts",
 "ix.086": "Searching and research",
 "ix.087": "Everyday questions",
 "ix.088": "Math and logic",
 "ix.089": "Quick answers",
 "ix.090": "Don't want to choose? <b>Automatic</b> mode sends each question to the AI that knows the most about it. AIs change often, so this guide is general.",
 "ix.091": "Your AI is ready",
 "ix.092": "You can chat for free right now, no cards and no setup. If you want more, connect Puter and use the pro version of the most popular AIs.",
 "ix.093": "Everything is free. Each person has a free daily limit that refills at midnight. SymphorIA never charges you.",
 "ix.094": "Ask in SynthFlow",
 "ix.095": "SynthFlow is where you talk with the AI. Choose who to talk to, type your question and SynthFlow opens full size so you can keep going there.",
 "ix.096": "If you don't type anything, SynthFlow opens empty so you can start there.",
 "ix.097": "You always know how much {enerx} you have",
 "ix.098": "{enerx} is your daily battery: it drops with each message and recharges at midnight. Here you see how much is left, how much you've chatted and your busiest day.",
 "ix.099": "{enerx} today · recharges at midnight",
 "ix.100": "Where you chat",
 "ix.101": "How much does each thing use?",
 "ix.102": "<b>Regular question</b> · a little {enerx}, depending on the answer's length",
 "ix.103": "<b>Compare AIs</b> · each AI uses its share of {enerx}",
 "ix.104": "<b>SuperiorSynth</b> · its plan and the answer",
 "ix.105": "<b>Create an image</b> · 1 of today's images",
 "ix.106": "<b>Search the web</b> · 1 search (30 a day with your account)",
 "ix.107": "<b>An A.L.I.A.S. mission</b> · 1 mission and its steps",
 "ix.108": "Messages per day · last 14 days",
 "ix.109": "Frequently asked questions",
 "ix.110": "Do I need to know about technology?",
 "ix.111": "Not at all. You write the way you talk and SynthonIA understands you.",
 "ix.112": "Can it browse the web or publish my app?",
 "ix.113": "It searches the web and gives you the sources, but it doesn't open a full browser or publish apps.",
 "ix.114": "Is it really free?",
 "ix.115": "Yes. Each person has a free daily limit that refills at midnight. SymphorIA never charges you.",
 "ix.116": "What happens if I run out?",
 "ix.117": "Wait until midnight, or connect your free Puter account to keep going with the most famous AIs.",
 "ix.118": "How much does each thing use?",
 "ix.119": "You see it before sending, next to the text box, and in “Your usage” you always know how much is left.",
 "ix.120": "Are my chats safe?",
 "ix.121": "They're saved on your device. If you sign in, you also see them on your phone and on any computer. To answer you, your message travels to the AI you choose. More details in <a href=\"privacidad.html\">Privacy</a>.",
 "ix.122": "What is A.L.I.A.S.?",
 "ix.123": "A separate agent: you tell it a goal, it shows you the plan in steps and completes them one by one. You can pause, approve or redo each step.",
 "ix.124": "Does it work on my phone?",
 "ix.125": "Yes. The site fits any screen, from the smallest phone to a computer.",
 "ix.126": "Does it work in Spanish?",
 "ix.127": "Yes. Write in Spanish and it answers in Spanish. It also understands English and many other languages.",
 "ix.128": "Which AI is the best?",
 "ix.129": "It depends on what you ask. Check the guide “Which AI is best for…?” or compare them blind with your own question. If you don't want to choose, Automatic mode does it for you.",
 "ix.130": "Is there an app?",
 "ix.131": "Install the app",
 "ix.132": "Can people tell I used AI?",
 "ix.133": "It can show. Detectors exist, although they're often wrong. The best is to use AI to learn and review, write in your own words and follow the rules of your school or job.",
 "ix.134": "Ready to <span class=\"gt\">tune in</span>?",
 "ix.135": "Start free",
 "ix.137": "In tune with AI.",
 "ix.138": "Free and with no app stores: on Android and computers it installs with one tap; on iPhone we show you the steps.",
 "ix.139": "Product",
 "ix.140": "SynthFlow",
 "ix.141": "SuperiorSynth",
 "ix.142": "SynthonIA",
 "ix.143": "Help",
 "ix.144": "FAQ",
 "ix.145": "Your usage",
 "ix.146": "Legal",
 "ix.147": "Privacy",
 "ix.148": "Terms",
 "ix.ayuda": "Help",
 "ix.149": "Your chats are saved on this device. If you sign in, you also see them on your phone and on any computer."
});

/* textos que escribe el JS de la portada (src/index): recorrido, SynthonIA, pistas, Puter, glosario */
Object.assign(I18N.es, {
 "rb.como": "¡Así de fácil! Pregunta lo que sea.",
 "rb.modos": "Si no sabes cuál elegir, déjalo en Automático.",
 "rb.usos": "Estudia, programa o crea ideas conmigo.",
 "rb.comparar": "¿Cuál tiene más Flow? Tú decides.",
 "rb.conectar": "Tu IA ya está lista, sin configurar nada.",
 "rb.chat": "Escribe aquí y te llevo a SynthFlow.",
 "rb.consumo": "Aquí ves cuánto te queda hoy.",
 "rb.faq": "¿Tienes dudas? Tócame y pregúntame.",
 "rb.aria": "SynthonIA: tócala para hablar con ella",
 "ix.blindPick": "¡Elegiste a la IA de ejemplo {n}! En SynthFlow lo haces con IAs de verdad.",
 "ix.sug1": "Explícame la fotosíntesis paso a paso",
 "ix.sug2": "Dame 5 ideas para un regalo barato",
 "ix.sug3": "¿Cómo hago mi primera página web?",
 "ix.sugAria": "Preguntas de ejemplo",
 "ix.sugT": "Prueba con una de estas",
 "ix.demo": "Cómo funciona",
 "ix.goAria": "Empezar gratis en SynthFlow",
 "ix.ready": "Listo para chatear",
 "ix.resting": "Las IAs están descansando",
 "ix.back": "vuelve en un momento",
 "ix.conn": "IAs conectadas",
 "ix.exported": "Listo: descargué una copia de tus datos.",
 "ix.imported": "Datos importados.",
 "ix.badFile": "Ese archivo no es válido.",
 "ix.noacc": "pruébala sin cuenta",
 "ix.skip": "Mantén <kbd>espacio</kbd> 1,5 s para saltar",
 "ix.skipTouch": "Mantén presionado 1,5 s para saltar",
 "ix.idea1": "Explícame la fotosíntesis fácil",
 "ix.idea2": "Dame 3 ideas para un regalo barato",
 "ix.idea3": "Encuentra el error en mi código",
 "ix.idea4": "Escríbeme un mensaje de cumpleaños",
 "ix.hint1": "Tu pregunta le llega a {n} IA conectada.",
 "ix.hintN": "Tu pregunta le llega a {n} IAs conectadas.",
 "ix.hint0": "Aún no hay IAs conectadas.",
 "ix.hintOn": "Lista para chatear, gratis.",
 "ix.hintPu": "Lista: puedes chatear con tu cuenta de Puter.",
 "ix.hintOff": "Las IAs gratis están descansando un rato. Conecta Puter para seguir ya.",
 "ix.qOpen": "Abrir SynthFlow",
 "ix.qUse": "Ver mi consumo",
 "ix.qUp": "Volver arriba",
 "ix.qCfg": "Ajustes",
 "ix.qHelp": "Guía rápida",
 "ix.puOn": "Conectada",
 "ix.puOff": "Sin conectar",
 "ix.puGo": "Conectar con Puter",
 "ix.puDone": "Puter conectado.",
 "ix.puFail": "No terminaste de entrar a Puter. Inténtalo otra vez.",
 "ix.opening": "Abriendo",
 "ix.signin": "Entrar",
 "ix.puDesc": "Opcional. Con Puter usas la versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis, tiene un límite que se renueva cada mes y se conecta con un clic.",
 "gl.0": "El chat de SymphorIA: ahí hablas con las IAs.",
 "gl.1": "El modo que piensa mejor tu pedido y elige la IA que más sabe.",
 "gl.2": "Tu ayudante: la robot que te guía por SymphorIA.",
 "gl.3": "Tu energía gratis del día, como una batería: baja un poco con cada mensaje y se carga al 100 % a medianoche.",
 "gl.4": "Un agente que cumple un objetivo paso a paso, y tú apruebas cada paso.",
 "gl.5": "Un servicio gratis: con tu cuenta usas ChatGPT, Claude y Gemini.",
 "gl.6": "IAs gratis que ya vienen listas, sin cuenta ni tarjeta.",
 "tour.logo.t": "Este es SymphorIA",
 "tour.logo.p": "El lugar para usar muchas IA gratis, desde un solo sitio. Toca el logo cuando quieras volver arriba.",
 "tour.menu.t": "El menú",
 "tour.menu.p": "Desde aquí vas a tus IA, al chat (SynthFlow) o a ver cuánto has usado, en un toque.",
 "tour.lim.t": "Tu {enerx} de hoy",
 "tour.lim.p": "Cada día tienes {enerx}, una batería gratis para usar las IAs conectadas. Baja mientras chateas y a medianoche se carga al 100 %.",
 "tour.acc.t": "Tu cuenta",
 "tour.acc.p": "Entra a tu cuenta de SymphorIA: tus chats quedan guardados y los ves en cualquier celular o computador, personalizas tu perfil y hablas con el equipo si necesitas ayuda.",
 "tour.cfg.t": "Configuración",
 "tour.cfg.p": "¿Lo quieres más bonito o más rápido? Elige y mira abajo cómo se verá. Puedes cambiarlo cuando quieras desde este botón.",
 "tour.como.t": "Así de fácil",
 "tour.como.p": "Preguntas, comparas y SynthonIA te acompaña. Baja despacio y mira cómo se animan.",
 "tour.con.t": "Tu IA ya está lista",
 "tour.con.p": "Ya puedes chatear gratis. Con Puter usas la versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis, tiene un límite que se renueva cada mes y se conecta con un clic.",
 "tour.chat.t": "Pregunta desde aquí",
 "tour.chat.p": "Escribe tu pregunta aquí y te llevo al chat (SynthFlow) con tu pregunta lista.",
 "tour.uso.t": "Tu uso",
 "tour.uso.p": "Cómo va tu {enerx} de hoy y cuánto chateaste estos días.",
 "tour.fin.t": "¡Todo listo!",
 "tour.fin.p": "Ya sabes qué es SymphorIA y por dónde empezar: escribe tu pregunta o abre SynthFlow. Inicia sesión para tener más {enerx}.",
 "tour.aria": "Recorrido por SymphorIA",
 "tour.skip": "Saltar",
 "tour.back": "Atrás",
 "tour.next": "Siguiente",
 "tour.start": "Empezar",
 "tour.signin": "Iniciar sesión",
 "tour.enjoy": "¡A disfrutar SymphorIA!"
});
Object.assign(I18N.en, {
 "rb.como": "That easy! Ask anything.",
 "rb.modos": "Not sure which to pick? Leave it on Automatic.",
 "rb.usos": "Study, code or create ideas with me.",
 "rb.comparar": "Which one has more Flow? You decide.",
 "rb.conectar": "Your AI is ready, no setup needed.",
 "rb.chat": "Type here and I'll take you to SynthFlow.",
 "rb.consumo": "Here you see how much {enerx} you have left today.",
 "rb.faq": "Questions? Tap me and ask.",
 "rb.aria": "SynthonIA: tap her to talk",
 "ix.blindPick": "You picked example AI {n}! In SynthFlow you do it with real AIs.",
 "ix.sug1": "Explain photosynthesis step by step",
 "ix.sug2": "Give me 5 ideas for a cheap gift",
 "ix.sug3": "How do I make my first website?",
 "ix.sugAria": "Example questions",
 "ix.sugT": "Try one of these",
 "ix.demo": "How it works",
 "ix.goAria": "Start free in SynthFlow",
 "ix.ready": "Ready to chat",
 "ix.resting": "The AIs are resting",
 "ix.back": "come back in a moment",
 "ix.conn": "Connected AIs",
 "ix.exported": "Done: I downloaded a copy of your data.",
 "ix.imported": "Data imported.",
 "ix.badFile": "That file is not valid.",
 "ix.noacc": "try it without an account",
 "ix.skip": "Hold <kbd>space</kbd> for 1.5 s to skip",
 "ix.skipTouch": "Press and hold 1.5 s to skip",
 "ix.idea1": "Explain photosynthesis simply",
 "ix.idea2": "Give me 3 ideas for a cheap gift",
 "ix.idea3": "Find the bug in my code",
 "ix.idea4": "Write me a birthday message",
 "ix.hint1": "Your question goes to {n} connected AI.",
 "ix.hintN": "Your question goes to {n} connected AIs.",
 "ix.hint0": "No AIs connected yet.",
 "ix.hintOn": "Ready to chat, free.",
 "ix.hintPu": "Ready: you can chat with your Puter account.",
 "ix.hintOff": "The free AIs are resting for a bit. Connect Puter to keep going now.",
 "ix.qOpen": "Open SynthFlow",
 "ix.qUse": "See my usage",
 "ix.qUp": "Back to top",
 "ix.qCfg": "Settings",
 "ix.qHelp": "Quick guide",
 "ix.puOn": "Connected",
 "ix.puOff": "Not connected",
 "ix.puGo": "Connect with Puter",
 "ix.puDone": "Puter connected.",
 "ix.puFail": "You didn't finish signing in to Puter. Try again.",
 "ix.opening": "Opening",
 "ix.signin": "Sign in",
 "ix.puDesc": "Optional. With Puter you use the pro version of the most popular AIs, like ChatGPT, Claude or Gemini. It is free, has a limit that renews every month and connects in one click.",
 "gl.0": "The SymphorIA chat: where you talk with the AIs.",
 "gl.1": "The mode that thinks your request through and picks the AI that knows most.",
 "gl.2": "Your helper: the robot that guides you through SymphorIA.",
 "gl.3": "Your free daily energy, like a battery: it drops a little with each message and recharges to 100 % at midnight.",
 "gl.4": "An agent that reaches a goal step by step, and you approve each step.",
 "gl.5": "A free service: with your account you use ChatGPT, Claude and Gemini.",
 "gl.6": "Free AIs that come ready, no account or card.",
 "tour.logo.t": "This is SymphorIA",
 "tour.logo.p": "The place to use many AIs for free, from one site. Tap the logo whenever you want to go back to the top.",
 "tour.menu.t": "The menu",
 "tour.menu.p": "From here you go to your AIs, to the chat (SynthFlow) or to see how much you've used, in one tap.",
 "tour.lim.t": "Today's {enerx}",
 "tour.lim.p": "Every day you get {enerx}, a free battery to use the connected AIs. It drops as you chat and recharges to 100 % at midnight.",
 "tour.acc.t": "Your account",
 "tour.acc.p": "Sign in to your SymphorIA account: your chats are saved and you see them on any phone or computer, you personalize your profile and you can talk to the team if you need help.",
 "tour.cfg.t": "Settings",
 "tour.cfg.p": "Want it prettier or faster? Choose and see below how it will look. You can change it anytime from this button.",
 "tour.como.t": "That easy",
 "tour.como.p": "You ask, you compare and SynthonIA is with you. Scroll slowly and watch them come alive.",
 "tour.con.t": "Your AI is ready",
 "tour.con.p": "You can chat for free right now. With Puter you use the pro version of the most popular AIs, like ChatGPT, Claude or Gemini. It is free, has a limit that renews every month and connects in one click.",
 "tour.chat.t": "Ask from here",
 "tour.chat.p": "Type your question here and I'll take you to the chat (SynthFlow) with your question ready.",
 "tour.uso.t": "Your usage",
 "tour.uso.p": "How your {enerx} is doing today and how much you've chatted these days.",
 "tour.fin.t": "All set!",
 "tour.fin.p": "Now you know what SymphorIA is and where to start: type your question or open SynthFlow. Sign in so you get more {enerx}.",
 "tour.aria": "SymphorIA tour",
 "tour.skip": "Skip",
 "tour.back": "Back",
 "tour.next": "Next",
 "tour.start": "Start",
 "tour.signin": "Sign in",
 "tour.enjoy": "Enjoy SymphorIA!"
});
/* v3.0: textos y atributos que quedaban en español en la landing */
Object.assign(I18N.es,{
 "ix.fromFlow":"De SynthFlow",
 "ix.fromSup":"De SuperiorSynth",
 "ix.fromAlias":"De A.L.I.A.S.",
 "ix.sdb":"¿Te muestro dónde están tus chats?",
 "ix.ft0":"Internet con fuentes",
 "ix.ft1":"Archivos con vista previa",
 "ix.ft2":"Presentaciones en PowerPoint",
 "ix.ft3":"Imágenes a partir de tus palabras",
 "ix.ft4":"Escucha las respuestas en voz alta",
 "ix.ft5":"Memoria con tu permiso",
 "ix.ft6":"Copia de tus chats en tu Google Drive",
 "ix.ft7":"Funciona en el celular",
 "ix.blSay":"Después te digo quién respondió",
 "ix.wipe":"Borrar mis datos de este equipo",
 "ix.app1":"Sí, gratis y sin tiendas. Toca",
 "ix.app2":": en Android y computador se instala con un toque; en iPhone te mostramos los 3 pasos (Compartir › Agregar a inicio).",
 "ixa.symphoriainicio":"SymphorIA, inicio",
 "ixa.tulmitedehoy":"Tu límite de hoy",
 "ixa.ayudaguarpida":"Ayuda: guía rápida",
 "ixa.guarpida":"Guía rápida",
 "ixa.configuracin":"Configuración",
 "ixa.tucuenta":"Tu cuenta",
 "ixa.abrirelmen":"Abrir el menú",
 "ixa.pregntalealaia":"Pregúntale a la IA",
 "ixa.preguntarensynthfl":"Preguntar en SynthFlow",
 "ixa.cmofunciona":"Cómo funciona",
 "ixa.modos":"Modos",
 "ixa.paraqusirvesymphor":"Para qué sirve SymphorIA",
 "ixa.compralasaciegas":"Compáralas a ciegas",
 "ixa.conquinhablar":"Con quién hablar",
 "ixa.escribetuprimermen":"Escribe tu primer mensaje (opcional) y pulsa Enter…",
 "ixa.abrirsynthflow":"Abrir SynthFlow",
 "ixa.preguntasfrecuente":"Preguntas frecuentes",
 "ixa.producto":"Producto",
 "ixa.ayuda":"Ayuda"
});

Object.assign(I18N.en,{
 "ix.fromFlow":"From SynthFlow",
 "ix.fromSup":"From SuperiorSynth",
 "ix.fromAlias":"From A.L.I.A.S.",
 "ix.sdb":"Want me to show you where your chats are?",
 "ix.ft0":"The web, with sources",
 "ix.ft1":"Files with preview",
 "ix.ft2":"PowerPoint presentations",
 "ix.ft3":"Images from your words",
 "ix.ft4":"Listen to answers out loud",
 "ix.ft5":"Memory, with your permission",
 "ix.ft6":"A copy of your chats in your Google Drive",
 "ix.ft7":"Works on your phone",
 "ix.blSay":"I'll tell you who answered afterwards",
 "ix.wipe":"Delete my data from this device",
 "ix.app1":"Yes, free and with no app stores. Tap",
 "ix.app2":": on Android and computers it installs with one tap; on iPhone we show you the 3 steps (Share › Add to Home Screen).",
 "ixa.symphoriainicio":"SymphorIA, home",
 "ixa.tulmitedehoy":"Today's {enerx}",
 "ixa.ayudaguarpida":"Help: quick guide",
 "ixa.guarpida":"Quick guide",
 "ixa.configuracin":"Settings",
 "ixa.tucuenta":"Your account",
 "ixa.abrirelmen":"Open the menu",
 "ixa.pregntalealaia":"Ask the AI",
 "ixa.preguntarensynthfl":"Ask in SynthFlow",
 "ixa.cmofunciona":"How it works",
 "ixa.modos":"Modes",
 "ixa.paraqusirvesymphor":"What SymphorIA is for",
 "ixa.compralasaciegas":"Compare them blind",
 "ixa.conquinhablar":"Who to talk to",
 "ixa.escribetuprimermen":"Type your first message (optional) and press Enter…",
 "ixa.abrirsynthflow":"Open SynthFlow",
 "ixa.preguntasfrecuente":"Frequently asked questions",
 "ixa.producto":"Product",
 "ixa.ayuda":"Help"
});
/* v3.0: consumo, tarjetas, Ajustes, BETA, saldo y guardado */
Object.assign(I18N.es,{
 "ix.stOn":"Listas",
 "ix.stOff":"Descansando",
 "ix.connDesc":"Las IAs conectadas son IAs gratis que ya vienen listas en SymphorIA. No tienes que configurar nada ni dar tarjeta: solo escribes. Sin cuenta pruebas con 5 mensajes al día; con tu cuenta gratis, mucho más. Si una está llena, pasa sola a otra.",
 "ix.today":"hoy",
 "ix.in14":"en 14 días",
 "ix.topDay":"tu día más activo",
 "ix.noTop":"Aún sin día más activo",
 "ix.msg1":"mensaje",
 "ix.msgN":"mensajes",
 "ix.totalNote":"Mensajes en total desde que usas SymphorIA.",
 "ix.chEmpty":"Aún no has chateado. Cuando escribas tu primer mensaje, aquí verás cuántos mandas cada día.",
 "ix.wipeQ":"¿Borrar todo de este navegador?",
 "ix.wipeP":"Se borran tus chats y ajustes de este equipo. Lo que está guardado en tu cuenta de SymphorIA no se toca.",
 "ix.wipeOk":"Borrar todo",
 "ix.wiped":"Todo borrado.",
 "ix.instFlow":"Instalar la app SynthFlow",
 "ix.lk1":"Elegir mis IA ideales",
 "ix.lk1d":"3 preguntas y te digo cuáles te sirven más",
 "ix.lk2":"Conectar Puter u otra IA",
 "ix.lk2d":"Tu versión pro de las IAs más usadas, gratis",
 "ix.lk3d":"El chat con todas las IAs",
 "ix.lk4":"Descargar la app SynthFlow",
 "ix.lk4d":"Se instala desde aquí: pantalla completa y a un toque",
 "ix.title":"SymphorIA · Diseña a la velocidad del pensamiento. En sintonía con la IA.",
 "ix.metaDesc":"SymphorIA: tu espacio para explorar la IA. Pregunta, crea, programa y compara modelos desde un solo lugar. Totalmente gratis.",
 "beta.title":"Estamos en beta: cuéntanos qué mejorar",
 "beta.tip":"Cuéntanos qué mejorar",
 "bal.puLeft":"Te queda {p} de tu crédito gratis de este mes",
 "bal.puErr":"Puter no respondió con tu saldo. Intenta más tarde.",
 "bal.puWait":"Puter todavía no nos dice cuánto saldo te queda.",
 "bal.puOpt":"Puter es opcional. Conecta tu versión pro de las IAs más usadas.",
 "bal.puSub":"Saldo de Puter · se llena otra vez cada mes",
 "sync.opening":"Abriendo tu cuenta…",
 "sync.local":"Tus chats se guardan en este equipo. Entra a tu cuenta para verlos también en tu celular o en otro computador.",
 "sync.err":"No pude guardar en tu cuenta ({e}). Todo sigue aquí y se sube solo cuando vuelva la conexión.",
 "sync.saved":"Guardado en tu cuenta",
 "sync.ago":"guardado hace {s} s"
});

Object.assign(I18N.en,{
 "ix.stOn":"Ready",
 "ix.stOff":"Resting",
 "ix.connDesc":"Connected AIs are free AIs that come ready in SymphorIA. Nothing to set up and no card needed: just type. Without an account you get 5 messages a day to try it; with your free account, much more. If one is full, it switches to another on its own.",
 "ix.today":"today",
 "ix.in14":"in 14 days",
 "ix.topDay":"your most active day",
 "ix.noTop":"No most active day yet",
 "ix.msg1":"message",
 "ix.msgN":"messages",
 "ix.totalNote":"Total messages since you started using SymphorIA.",
 "ix.chEmpty":"You haven't chatted yet. Once you send your first message, you'll see how many you send each day here.",
 "ix.wipeQ":"Delete everything from this browser?",
 "ix.wipeP":"Your chats and settings on this device are deleted. What's saved in your SymphorIA account stays untouched.",
 "ix.wipeOk":"Delete everything",
 "ix.wiped":"Everything deleted.",
 "ix.instFlow":"Install the SynthFlow app",
 "ix.lk1":"Pick my ideal AIs",
 "ix.lk1d":"3 questions and I'll tell you which ones suit you best",
 "ix.lk2":"Connect Puter or another AI",
 "ix.lk2d":"The pro version of the most popular AIs, free",
 "ix.lk3d":"The chat with every AI",
 "ix.lk4":"Download the SynthFlow app",
 "ix.lk4d":"Installs from here: full screen, one tap away",
 "ix.title":"SymphorIA · Design at the speed of thought. In tune with AI.",
 "ix.metaDesc":"SymphorIA: your space to explore AI. Ask, create, code and compare models from one place. Completely free.",
 "beta.title":"We're in beta: tell us what to improve",
 "beta.tip":"Tell us what to improve",
 "bal.puLeft":"You have {p} of this month's free credit left",
 "bal.puErr":"Puter didn't send your balance. Try again later.",
 "bal.puWait":"Puter hasn't told us your balance yet.",
 "bal.puOpt":"Puter is optional. Connect the pro version of the most popular AIs.",
 "bal.puSub":"Puter balance · refills every month",
 "sync.opening":"Opening your account…",
 "sync.local":"Your chats are saved on this device. Sign in to see them on your phone or another computer too.",
 "sync.err":"I couldn't save to your account ({e}). Everything is still here and uploads on its own when the connection is back.",
 "sync.saved":"Saved to your account",
 "sync.ago":"saved {s} s ago"
});
/* pone el nombre de la batería en todos los textos que dicen {enerx} */
for (const L of Object.keys(I18N)) for (const k in I18N[L]) if (typeof I18N[L][k] === 'string') I18N[L][k] = I18N[L][k].replace(/\{enerx\}/g, ENERX);
Object.assign(I18N.es, { 'pm.spent':'palabras de '+ENERX+' gastadas hoy · IAs conectadas', 'pm.capP':'Cuánto puede usar cada persona al día con las IAs conectadas (Puter no cuenta). Se guarda en tokens: {tok} tokens ≈ {w} palabras de '+ENERX+' (una palabra ≈ 4/3 de token). Entre 1.000 y 500.000.' });
Object.assign(I18N.en, { 'pm.spent':ENERX+' words spent today · connected AIs', 'pm.capP':'How much each person can use per day with the connected AIs (Puter does not count). Stored in tokens: {tok} tokens ≈ {w} '+ENERX+' words (one word ≈ 4/3 of a token). Between 1,000 and 500,000.' });
Object.assign(I18N.es, { 'pm.test':'Probar', 'pm.del':'Quitar', 'pm.deling':'Quitando…', 'pm.delQ':'¿Quitar la llave de {n}?', 'pm.delP':'Se borra del servidor y deja de usarse para las IAs conectadas. Las llaves de los demás siguen funcionando.', 'pm.delPo':'Es la llave de otra persona del equipo. Se borra del servidor y deja de usarse para las IAs conectadas.', 'pm.deled':'Llave de {n} quitada.' });
Object.assign(I18N.en, { 'pm.test':'Test', 'pm.del':'Remove', 'pm.deling':'Removing…', 'pm.delQ':'Remove the {n} key?', 'pm.delP':'It is deleted from the server and stops being used for the connected AIs. Everyone else\'s keys keep working.', 'pm.delPo':'This key belongs to someone else on the team. It is deleted from the server and stops being used for the connected AIs.', 'pm.deled':'{n} key removed.' });
Object.assign(I18N.es, { 'enerx.guest':'Sin cuenta tienes {n} mensajes de prueba al día. Con tu cuenta gratis tienes mucho más.', 'enerx.puter':'Si se acaba, puedes seguir con Puter, que te da la versión pro de las IAs más usadas.' });
Object.assign(I18N.en, { 'enerx.guest':'Without an account you get {n} trial messages a day. With your free account you get much more.', 'enerx.puter':'If it runs out, you can keep going with Puter, which gives you the pro version of the most popular AIs.' });
/* ===== v3.0 · SynthFlow y las ventanas de core en inglés =====
   SynthFlow arma sus textos en JS (miles de trozos). En vez de cambiar cada uno por t(), cuando el idioma es inglés
   se trae idioma-en.json (español → inglés, solo si hace falta) y se traduce lo que aparece en pantalla:
   · un texto igual a una entrada se cambia entero; un trozo largo (6+ letras, con espacio) se cambia dentro del texto;
   · también title, placeholder, aria-label, data-tip y alt;
   · nunca toca lo que escriben las personas ni las IA (mensajes, títulos de chats, código), ni lo que ya usa data-i18n.
   Al volver a español, cada texto vuelve a como estaba. Para un texto nuevo: agrégalo a idioma-en.json. */
const TR_ATTRS = ['placeholder', 'title', 'aria-label', 'data-tip', 'alt'];
const TR_SKIP = 'script,style,pre,code,textarea,iframe,svg,[contenteditable],.notr,[data-i18n],[data-i18n-html],.m .body,.m .bub,.cmp-card .body,.fvi p,.thi .tt,.snip,.greet,#szBotP .bl .bm';
const TR = { map:null, rx:null, done:new Map(), mo:null, load:null };
function trLoad(){
  if (!TR.load) TR.load = fetch('/idioma-en.json', { cache:'force-cache' }).then(r => r.json()).then(m => {
    TR.map = m;
    const long = Object.keys(m).filter(k => k.length >= 6 && /[\s«»:·]/.test(k)).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    TR.rx = long.length ? new RegExp('(?<![\\p{L}\\d])(?:' + long.join('|') + ')(?![\\p{L}])', 'gu') : null;
  }).catch(() => { TR.load = null; });
  return TR.load;
}
function trStr(s){
  const m = TR.map; if (!m || !s || !/\p{L}{2}/u.test(s)) return s;
  const k = s.replace(/\s+/g, ' ').trim(); if (!k) return s;
  if (m[k] != null) return s.match(/^\s*/)[0] + m[k] + s.match(/\s*$/)[0];
  let r = TR.rx ? s.replace(TR.rx, x => m[x] ?? x) : s;
  TR_RULES.forEach(([rx, to]) => { r = r.replace(rx, to); });
  return r;
}
/* números con su palabra («7 líneas», «hace 5 min»…), que el diccionario no puede tener uno por uno */
const TR_RULES = [[/\b1 línea\b/g, '1 line'], [/(\d[\d.,]*) líneas\b/g, '$1 lines'], [/(\d[\d.,]*) palabras\b/g, '$1 words'], [/\b1 palabra\b/g, '1 word'],
  [/\bhace (\d+) (min|h|d)\b/g, '$1 $2 ago'], [/\bhace (\d+) días\b/g, '$1 days ago'], [/(\d[\d.,]*) mensajes\b/g, '$1 messages'], [/\b1 mensaje\b/g, '1 message'],
  [/(\d[\d.,]*) archivos\b/g, '$1 files'], [/(\d[\d.,]*) chats\b/g, '$1 chats'], [/(\d[\d.,]*) respuestas\b/g, '$1 answers'], [/(\d[\d.,]*) votos\b/g, '$1 votes'], [/(\d[\d.,]*) diapositivas\b/g, '$1 slides'],
  [/\bescribiendo\b/g, 'typing'], [/\bahora\b(?=$|[ ·])/g, 'now']];
const trSkip = el => !el || !!el.closest(TR_SKIP);
/* TR.done guarda por nodo [original, lo que pusimos]; si la página cambia el texto después, el nuevo pasa a ser el original */
function trSet(n, key, cur, put){
  const d = TR.done.get(n) || {}, o = d[key];
  if (cur === put){ if (o && cur !== o[1]) delete d[key]; return; }
  d[key] = [cur, put]; TR.done.set(n, d);
  if (TR.done.size > 5000) TR.done.forEach((v, k) => { if (!k.isConnected) TR.done.delete(k); });
  if (key === '#') n.nodeValue = put; else n.setAttribute(key, put);
}
function trAttrs(el){ TR_ATTRS.forEach(a => { const o = el.getAttribute(a); if (o) trSet(el, a, o, trStr(o)); }); }
function trNode(n){
  if (n.nodeType === 3){ if (!trSkip(n.parentElement)) trSet(n, '#', n.nodeValue, trStr(n.nodeValue)); return; }
  if (n.nodeType !== 1) return;
  if (trSkip(n)){ if (n.matches('textarea,input') && !trSkip(n.parentElement)) trAttrs(n); return; }
  trAttrs(n);
  const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode:x => { if (x.nodeType === 1 && x.matches(TR_SKIP)){ if (x.matches('textarea,input')) trAttrs(x); return NodeFilter.FILTER_REJECT; } return NodeFilter.FILTER_ACCEPT; } });
  let x; while ((x = w.nextNode())){ if (x.nodeType === 3) trSet(x, '#', x.nodeValue, trStr(x.nodeValue)); else trAttrs(x); }
}
async function trOn(){
  await trLoad(); if (!TR.map || LANG !== 'en') return;
  trNode(document.body); document.title = trStr(document.title);
  if (TR.mo) return;
  TR.mo = new MutationObserver(list => { if (LANG !== 'en') return; list.forEach(r => {
    if (r.type === 'childList') r.addedNodes.forEach(trNode);
    else if (r.type === 'characterData') trNode(r.target);
    else if (!trSkip(r.target) || (r.target.matches('textarea,input') && !trSkip(r.target.parentElement))){ const o = r.target.getAttribute(r.attributeName); if (o) trSet(r.target, r.attributeName, o, trStr(o)); }
  }); });
  TR.mo.observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:TR_ATTRS });
}
function trOff(){
  if (TR.mo){ TR.mo.disconnect(); TR.mo = null; }
  TR.done.forEach((d, n) => { if (n.isConnected) Object.keys(d).forEach(k => { if (k === '#'){ if (n.nodeValue === d[k][1]) n.nodeValue = d[k][0]; } else if (n.getAttribute(k) === d[k][1]) n.setAttribute(k, d[k][0]); }); });
  TR.done.clear();
}
onLang(l => l === 'en' ? trOn() : trOff());
if (LANG === 'en'){ trLoad(); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', trOn); else setTimeout(trOn, 0); }
/* ===== v3.4 · SynthonIA vive en su propio archivo: synthonia.js (piezas en src/synthonia/) =====
   Antes estaba dentro de core.js (≈190 KB: su cara, su manita, sus sonidos, su ventanita, la guía, el mantenimiento…).
   Ahora core.js la carga aparte: en la portada enseguida (ella es la portada) y en SynthFlow y Pulsem cuando la página ya cargó.
   Mientras llega, estos nombres son «de espera»: lo que se le pida a SynthonIA se guarda y se hace apenas llegue
   (los sonidos de antes de que llegue simplemente no suenan, y su cara sale vacía). SZ.synReady avisa cuando ya está.
   synthonia.js recibe lo que necesita de core por SZ.__syn y devuelve lo suyo con SZ.__syn.ready({ … }). */
let synOk = false, synDone;
const synReady = new Promise(r => { synDone = r; });
const synQ = [];
/* una función de espera: si SynthonIA ya llegó llama a la de verdad; si no, la guarda y devuelve una promesa */
const synLater = name => (...a) => synOk ? SYNX[name](...a) : new Promise(ok => synQ.push(() => { try{ ok(SYNX[name](...a)); }catch(e){ ok(undefined); } }));
/* un objeto de espera (SZ.BOT, SZ.HAND): sus métodos se guardan; los valores conocidos devuelven algo neutro */
const synObj = (name, vals = {}) => new Proxy({}, { get:(t, k) => {
  if (synOk) return SYNX[name][k];
  if (k in vals) return vals[k];
  if (typeof k !== 'string' || k === 'then') return undefined;
  return (...a) => new Promise(ok => synQ.push(() => { try{ const f = SYNX[name][k]; ok(typeof f === 'function' ? f(...a) : f); }catch(e){ ok(undefined); } }));
} });
const SYNX = {};
let face = () => '', synBody = () => '', synSet = () => {}, lipSync = () => () => {}, ballFace = () => null, randomGoodFace = () => 'feliz', wasAway = () => false;
let EV;   /* los eventos de 50, 100 y 500 visitas (el portal pregunta «typeof EV») */
let FACE_GOOD = ['feliz', 'riendo', 'guino', 'encantada', 'celebrando', 'flow'], SPOSE = {}, GTOPICS = [];
let botOpen = synLater('botOpen'), botTeam = synLater('botTeam'), feedbackModal = synLater('feedbackModal'), guideChooser = synLater('guideChooser'),
  welcomeBack = synLater('welcomeBack'), guideAsk = synLater('guideAsk'), whatsNew = synLater('whatsNew');
/* los sonidos antes de que llegue: silencio (no se repiten después) */
let SND = new Proxy({}, { get:(t, k) => synOk ? SYNX.SND[k] : k === 'then' ? undefined : () => {} });
let HAND = synObj('HAND', { alive:false, pos:{ x:0, y:0 } }), BOTAPI = synObj('BOTAPI', { el:null });
function synArrive(x){
  if (synOk) return;
  Object.assign(SYNX, x);
  ({ face, synBody, synSet, lipSync, ballFace, randomGoodFace, wasAway, FACE_GOOD, SPOSE, GTOPICS, botOpen, botTeam, feedbackModal, guideChooser, welcomeBack, guideAsk, whatsNew, SND, HAND, BOTAPI, EV } = x);
  synOk = true;
  synQ.splice(0).forEach(f => f());
  synDone(true);
  try{ dispatchEvent(new Event('synthz-synthonia')); }catch(e){}
}
/* trae synthonia.js (si la página no la trajo ya con su propia etiqueta) */
function synLoad(){
  if (synOk || document.querySelector('script[data-syn]')) return;
  const s = document.createElement('script'); s.src = '/synthonia.js'; s.dataset.syn = '1'; s.async = true;
  s.onerror = () => { s.remove(); setTimeout(synLoad, 4000); };   /* sin internet un momento: vuelve a intentar */
  document.head.appendChild(s);
}
/* ---------- estado guardado (con limpieza por si el archivo viene dañado) ---------- */
const KEY = 'synthz:v1', OLD = 'coro:v1';
let memState = null;
function load(){
  try{ const s = localStorage.getItem(KEY) || localStorage.getItem(OLD); return s ? JSON.parse(s) : null; }
  catch(e){ return memState; }
}
const num = v => (Number.isFinite(+v) && +v > 0) ? Math.round(+v) : 0;
function cleanUsage(u){
  const out = {};
  if (!u || typeof u !== 'object') return out;
  ALL.forEach(p => {
    const s = u[p.id]; if (!s || typeof s !== 'object') return;
    const days = {};
    if (s.days && typeof s.days === 'object') Object.keys(s.days).forEach(k => { if (/^\d{4}-\d{2}-\d{2}$/.test(k)) days[k] = num(s.days[k]); });
    out[p.id] = { prompt:num(s.prompt), completion:num(s.completion), requests:num(s.requests), days };
  });
  return out;
}
/* ---------- SynXCoin's: un registro por dispositivo ----------
   Cada navegador suma solo en su propia fila (DEV). El total es la SUMA de todas las filas, y al juntar dos copias
   de la misma fila se toma el mayor valor (cada fila solo crece). Así dos dispositivos o dos pestañas nunca se pisan,
   sincronizar varias veces no duplica, y «Reiniciar» (una nueva época) se respeta en todos los dispositivos. */
const LKEY = 'synthz:ledger', DEV_KEY = 'synthz:dev';
let DEV = 'dmem';
try{ DEV = localStorage.getItem(DEV_KEY) || ''; if (!/^[\w-]{4,40}$/.test(DEV)){ DEV = 'd' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); localStorage.setItem(DEV_KEY, DEV); } }catch(e){ DEV = 'dmem'; }
const DAYRE = /^\d{4}-\d{2}-\d{2}$/, FIELDS = ['p', 'c', 'r', 'e'], DAYMAPS = ['days', 'de', 'rd', 'fd'];
function cleanRow(s){
  const o = {}; FIELDS.forEach(f => { o[f] = num(s && s[f]); });
  DAYMAPS.forEach(m => { o[m] = {}; const src = s && s[m]; if (src && typeof src === 'object') Object.keys(src).forEach(d => { if (DAYRE.test(d)){ const v = num(src[d]); if (v) o[m][d] = v; } }); });
  return o;
}
function cleanLedger(L){
  const out = { ep:num(L && L.ep), dev:{} };
  const dev = L && L.dev && typeof L.dev === 'object' ? L.dev : {};
  Object.keys(dev).slice(0, 200).forEach(id => {
    if (!/^[\w-]{1,40}$/.test(id) || !dev[id] || typeof dev[id] !== 'object') return;
    const r = {}; ALL.forEach(p => { if (dev[id][p.id] && typeof dev[id][p.id] === 'object') r[p.id] = cleanRow(dev[id][p.id]); });
    if (Object.keys(r).length) out.dev[id] = r;
  });
  return out;
}
function mergeRows(a, b){
  const o = cleanRow(a); FIELDS.forEach(f => { o[f] = Math.max(o[f], num(b[f])); });
  DAYMAPS.forEach(m => { Object.keys(b[m] || {}).forEach(d => { o[m][d] = Math.max(o[m][d] || 0, num(b[m][d])); }); });
  return o;
}
function mergeLedger(a, b){
  a = a || { ep:0, dev:{} }; b = b || { ep:0, dev:{} };
  if ((b.ep || 0) > (a.ep || 0)) return cleanLedger(b);          /* el otro lado reinició después: su época manda */
  if ((b.ep || 0) < (a.ep || 0)) return a;
  const out = { ep:a.ep || 0, dev:Object.assign({}, a.dev) };
  Object.keys(b.dev || {}).forEach(id => {
    const mine = out.dev[id] || {}, r = Object.assign({}, mine);
    Object.keys(b.dev[id]).forEach(pid => { r[pid] = mine[pid] ? mergeRows(mine[pid], b.dev[id][pid]) : cleanRow(b.dev[id][pid]); });
    out.dev[id] = r;
  });
  return out;
}
/* el total por proveedor que muestra la página sale de sumar las filas */
function usageOf(L){
  const out = {};
  Object.keys(L.dev).forEach(id => Object.keys(L.dev[id]).forEach(pid => {
    const s = L.dev[id][pid], u = out[pid] || (out[pid] = { prompt:0, completion:0, requests:0, est:0, days:{}, estDays:{}, reqDays:{}, freeDays:{} });
    u.prompt += s.p; u.completion += s.c; u.requests += s.r; u.est += s.e;
    [['days', 'days'], ['de', 'estDays'], ['rd', 'reqDays'], ['fd', 'freeDays']].forEach(([a, b]) => Object.keys(s[a]).forEach(d => { u[b][d] = (u[b][d] || 0) + s[a][d]; }));
  }));
  return out;
}
/* datos de versiones anteriores: un solo total sin dispositivos → fila «legacy» (Puter siempre fue estimado) */
function legacyRow(usage){
  const u = cleanUsage(usage), r = {};
  Object.keys(u).forEach(pid => { const s = u[pid], t = s.prompt + s.completion; if (!t && !s.requests) return; r[pid] = cleanRow({ p:s.prompt, c:s.completion, r:s.requests, e:pid === 'puter' ? t : 0, days:s.days, de:pid === 'puter' ? s.days : {} }); });
  return r;
}
function readLedger(){ try{ const s = localStorage.getItem(LKEY); return s ? cleanLedger(JSON.parse(s)) : null; }catch(e){ return null; } }
function writeLedger(){ try{ localStorage.setItem(LKEY, JSON.stringify(state.ledger)); }catch(e){} }
function cleanWork(w){
  if (!w || typeof w !== 'object') return undefined;
  return { ms:num(w.ms), words:num(w.words), real:typeof w.real === 'string' ? w.real.slice(0, 80) : '', reason:typeof w.reason === 'string' ? w.reason.slice(0, 4000) : undefined,
    steps:Array.isArray(w.steps) ? w.steps.slice(0, 12).filter(x => Array.isArray(x) && typeof x[1] === 'string').map(x => [num(x[0]), x[1].slice(0, 80)]) : [] };
}
function cleanChats(c){
  const out = {};
  if (!c || typeof c !== 'object') return out;
  Object.keys(c).forEach(k => {
    if (!Array.isArray(c[k]) || !(byId(k) || /^openrouter::./.test(k))) return;
    out[k] = c[k].filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role:m.role, content:m.content, meta: typeof m.meta === 'string' ? m.meta : undefined, model: typeof m.model === 'string' ? m.model : undefined,
        sources: Array.isArray(m.sources) ? m.sources.slice(0, 8).map(x => ({ t:String((x && x.t) || '').slice(0, 200), u:/^https?:\/\//.test(String(x && x.u)) ? String(x.u).slice(0, 500) : '' })).filter(x => x.u) : undefined, web: typeof m.web === 'string' ? m.web.slice(0, 20) : undefined,
        imgId: typeof m.imgId === 'string' && /^i[\w]{4,40}$/.test(m.imgId) ? m.imgId : undefined, imgReq: m.imgReq ? true : undefined, ask: typeof m.ask === 'string' ? m.ask.slice(0, 4000) : undefined,
        agent: m.agent && typeof m.agent === 'object' ? { pick:String(m.agent.pick || '').slice(0, 160), name:String(m.agent.name || '').slice(0, 80), tl:String(m.agent.tl || '').slice(0, 60), ask:String(m.agent.ask || '').slice(0, 4000) } : undefined,
        cont: m.cont ? true : undefined, star: m.star ? true : undefined, again: m.again ? true : undefined, work: cleanWork(m.work), files: Array.isArray(m.files) ? m.files.slice(0, 8).map(f => ({ name:String((f && f.name) || ''), kind:String((f && f.kind) || ''), text: typeof (f && f.text) === 'string' ? f.text : undefined, thumb: typeof (f && f.thumb) === 'string' ? f.thumb : undefined })) : undefined }));
  });
  return out;
}
function cleanStrMap(o){
  const out = {};
  if (!o || typeof o !== 'object') return out;
  Object.keys(o).forEach(k => { if (typeof o[k] === 'string') out[k] = o[k]; });
  return out;
}
function cleanModels(o){
  const out = {};
  if (!o || typeof o !== 'object') return out;
  Object.keys(o).forEach(k => { if (Array.isArray(o[k]) && o[k].every(x => typeof x === 'string')) out[k] = o[k]; });
  return out;
}
let state = Object.assign({ keys:{}, model:{}, models:{}, usage:{}, chats:{}, fav:[], cmp:[] }, load() || {});
state.sx = Object.assign({ daily:0, saver:false, saved:0, hits:0, over:'', warned:'' }, state.sx && typeof state.sx === 'object' ? state.sx : {});
const strList = (a, max) => Array.isArray(a) ? [...new Set(a.filter(x => typeof x === 'string' && x))].slice(0, max) : [];
/* v2.1 · memoria: lo que la persona le pidió a SynthFlow que recuerde (máx. 40 cosas cortas) */
function cleanMem(m){
  m = m && typeof m === 'object' ? m : {};
  const items = (Array.isArray(m.items) ? m.items : []).filter(x => x && typeof x.text === 'string' && x.text.trim()).slice(0, 40)
    .map(x => ({ id:/^m[\w]{3,30}$/.test(x.id) ? x.id : 'm' + Math.random().toString(36).slice(2, 10), t:+x.t || Date.now(), text:x.text.replace(/\s+/g, ' ').trim().slice(0, 300) }));
  return { on:m.on !== false, t:+m.t || 0, items };
}
function normalize(){
  state.keys = cleanStrMap(state.keys); state.model = cleanStrMap(state.model); state.models = cleanModels(state.models);
  state.chats = cleanChats(state.chats);
  const stored = readLedger(), given = state.ledger && typeof state.ledger === 'object' ? cleanLedger(state.ledger) : null;
  let L = stored && given ? mergeLedger(stored, given) : (stored || given);
  if (!L){ L = { ep:0, dev:{} }; const leg = legacyRow(state.usage); if (Object.keys(leg).length) L.dev.legacy = leg; }
  state.ledger = L; state.usage = usageOf(L); writeLedger();
  state.fav = strList(state.fav, 300); state.cmp = strList(state.cmp, 4);
  state.mem = cleanMem(state.mem);
}
normalize();
function syncLedger(){ const s = readLedger(); if (s){ state.ledger = mergeLedger(state.ledger, s); state.usage = usageOf(state.ledger); } }
function save(){
  syncLedger(); writeLedger();
  const blob = Object.assign({}, state, { ledger:undefined, usage:undefined }, IDB.ready ? { chats:{} } : {});
  try{ localStorage.setItem(KEY, JSON.stringify(blob)); }catch(e){ memState = state; }
  if (IDB.ready){ clearTimeout(idbT); idbT = setTimeout(idbFlush, 300); }
  accSchedule(); try{ driveSchedule(); }catch(e){}
}
const hooks = { usage: () => {}, chats: () => {} };
/* ---------- cuentas propias de SymphorIA (usuario y contraseña, o Google) · Puter solo conecta las IA ---------- */
var ACC = { ready:false, busy:false, user:null, profile:null, t:0, err:'', avail:null, cid:'', dcid:'', google:false, missing:[] };
const accHooks = [];
const hashS = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
var accSent = {}, accT = 0, accDelSent = new Set();
let SESS = ''; try{ SESS = localStorage.getItem('synthz:sess') || ''; }catch(e){}
if (SESS) document.documentElement.classList.add('signed');   /* con sesión: nada de «entra a tu cuenta» */
/* v2.9.1 · la sesión de verdad vive en una cookie HttpOnly que esta página no puede leer (así un XSS no se roba la cuenta).
   En el navegador solo queda una marca corta «c…» (distinta en cada entrada, para que las otras pestañas noten el cambio).
   cookie = el servidor dijo que la dejó; si no (servidor viejo), se guarda el token como antes */
const sessMark = () => 'c' + Math.random().toString(36).slice(2, 10);
function setSess(t, cookie){ SESS = t ? (cookie ? sessMark() : t) : ''; try{ if (SESS) localStorage.setItem('synthz:sess', SESS); else localStorage.removeItem('synthz:sess'); }catch(e){} }
/* dispositivos que entraron antes: piden su cookie una vez con el token de siempre y luego lo borran del navegador */
const sessMove = SESS.length > 20 ? fetch('/api/auth', { method:'POST', headers:{ 'content-type':'application/json', authorization:'Bearer ' + SESS }, body:'{"mode":"cookie"}' })
  .then(r => { if (r.ok) setSess(SESS, true); }).catch(() => {}) : Promise.resolve();
const accFire = k => accHooks.forEach(f => { try{ f(k); }catch(_){} });
async function api(path, o = {}){
  const h = { 'content-type':'application/json' }; if (SESS) h.authorization = 'Bearer ' + SESS;
  let r; try{ r = await fetch('/api/' + path, { method:o.method || 'GET', headers:h, body:o.body ? JSON.stringify(o.body) : undefined, signal:o.signal }); }
  catch(e){ throw Object.assign(new Error('No pude comunicarme con ' + BRAND() + '.'), { net:true }); }
  let d = {}; try{ d = await r.json(); }catch(e){}
  if (r.status === 401 && SESS && !o.keep){ setSess(''); ACC.ready = false; ACC.user = null; ACC.profile = null; accFire('out'); }
  if (!r.ok) throw Object.assign(new Error(d.error || 'Error ' + r.status), { status:r.status, data:d });
  return d;
}
async function accConfig(){
  if (ACC.avail !== null) return ACC.avail;
  try{ const r = await fetch('/api/config'); const d = r.ok ? await r.json() : {}; ACC.cid = d.googleClientId || ''; ACC.dcid = d.driveClientId || ''; ACC.sbg = !!d.sbGoogle; ACC.sb = d.sb || null; ACC.google = !!((d.google && ACC.cid) || ACC.sbg); ACC.missing = d.missing || (r.ok ? [] : ['servidor']); ACC.avail = !!d.ok; }
  catch(e){ ACC.avail = false; }
  return ACC.avail;
}
function slimChat(arr){
  let a = arr.slice(-150).map(m => ({ role:m.role, content:m.content, meta:m.meta, model:m.model, star:m.star || undefined, files: Array.isArray(m.files) ? m.files.map(f => ({ name:f.name, kind:f.kind })) : undefined }));
  while (a.length > 4 && JSON.stringify(a).length > 380000) a = a.slice(Math.ceil(a.length / 4));
  return a;
}
function prefsOut(){
  return { v:2, t:Date.now(), model:state.model, fav:state.fav, cmp:state.cmp, sx:state.sx, pinned:state.pinned || '', threads:state.threads || {}, del:(state.del || []).slice(-300),
    arena:state.arena || {}, survey:state.survey || null, useTeam:state.useTeam || '', battle:!!state.battle, cfg:CFG, mem:state.mem,
    projects:projSlim(), projOf:state.projOf || {}, pjDel:(state.pjDel || []).slice(-200),
    chatKeys:Object.keys(state.chats).filter(k => Array.isArray(state.chats[k]) && state.chats[k].length) };
}
/* v2.6 · proyectos: si los archivos pesan mucho, viaja solo su nombre y el texto se queda en este equipo */
function projSlim(){
  const P = (state.projects || []).map(p => Object.assign({}, p, { files:(p.files || []).map(f => ({ id:f.id, name:f.name, text:f.text })) }));
  if (JSON.stringify(P).length > 150000) P.forEach(p => p.files.forEach(f => { delete f.text; }));
  return P;
}
const pjStr = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
function cleanProj(r){
  return { id:pjStr(r.id, 40), name:pjStr(r.name, 60) || 'Proyecto', desc:pjStr(r.desc, 300), instr:pjStr(r.instr, 8000), star:!!r.star, arch:!!r.arch, c:+r.c || 0, c0:+r.c0 || 0, t:+r.t || 0, u:+r.u || 0,
    files:(Array.isArray(r.files) ? r.files : []).filter(f => f && typeof f.id === 'string').slice(0, 60).map(f => Object.assign({ id:pjStr(f.id, 40), name:pjStr(f.name, 120) || 'archivo' }, typeof f.text === 'string' ? { text:f.text.slice(0, 200000) } : {})) };
}
function mergeProjects(p){
  if (Array.isArray(p.pjDel)) state.pjDel = [...new Set([...(state.pjDel || []), ...p.pjDel.filter(x => typeof x === 'string')])].slice(-200);
  const del = state.pjDel || [];
  if (Array.isArray(p.projects)){
    state.projects = state.projects || [];
    p.projects.forEach(r => {
      if (!r || typeof r.id !== 'string' || del.includes(r.id)) return;
      const l = state.projects.find(x => x.id === r.id), c = cleanProj(r);
      if (!l){ state.projects.push(c); return; }
      if (c.u > (+l.u || 0)){ c.files = c.files.map(f => f.text != null ? f : ((l.files || []).find(x => x.id === f.id) || f)); c.t = Math.max(c.t, +l.t || 0); Object.assign(l, c); }
      else l.t = Math.max(+l.t || 0, c.t);
    });
  }
  if (state.projects) state.projects = state.projects.filter(x => !del.includes(x.id));
  if (p.projOf && typeof p.projOf === 'object'){ const o = {}; Object.keys(p.projOf).forEach(k => { if (typeof p.projOf[k] === 'string' && /^openrouter::./.test(k)) o[k] = p.projOf[k]; }); state.projOf = Object.assign(o, state.projOf || {}); }
}
function mergeIn(p, chats){
  if (p && typeof p === 'object'){
    mergeProjects(p);
    if (Array.isArray(p.fav)) state.fav = [...new Set([...(state.fav || []), ...p.fav.filter(x => typeof x === 'string')])];
    if (p.model && typeof p.model === 'object' && typeof p.model.openrouter === 'string') state.model = Object.assign({}, state.model, { openrouter:p.model.openrouter });
    if (typeof p.pinned === 'string' && p.pinned) state.pinned = p.pinned;
    if (typeof p.useTeam === 'string' && !state.useTeam) state.useTeam = p.useTeam;
    if (Array.isArray(p.del)) state.del = [...new Set([...(state.del || []), ...p.del.filter(x => typeof x === 'string')])].slice(-300);
    if (p.threads && typeof p.threads === 'object'){ state.threads = state.threads || {}; Object.keys(p.threads).forEach(m => { const L = state.threads[m] || (state.threads[m] = []); (Array.isArray(p.threads[m]) ? p.threads[m] : []).forEach(x => { if (!x || typeof x.id !== 'string') return; const e = L.find(y => y.id === x.id); if (!e) L.push({ id:x.id, title:String(x.title || '').slice(0, 80), t:+x.t || 0 }); else if ((+x.t || 0) > (e.t || 0)){ e.title = String(x.title || e.title).slice(0, 80); e.t = +x.t; } }); }); }
    if (Array.isArray(p.cmp) && p.cmp.length) state.cmp = p.cmp.filter(x => typeof x === 'string').slice(0, 4);
    if (p.sx && typeof p.sx === 'object'){ const l = state.sx || {}; state.sx = Object.assign({}, l, p.sx, { saved:Math.max(+l.saved || 0, +p.sx.saved || 0), hits:Math.max(+l.hits || 0, +p.sx.hits || 0) }); }
    if (p.arena && typeof p.arena === 'object'){ state.arena = state.arena || {}; Object.keys(p.arena).forEach(id => { const r = p.arena[id], l = state.arena[id]; if (r && typeof r === 'object' && (!l || (+r.t || 0) > (+l.t || 0))) state.arena[id] = { r:+r.r || 1000, w:+r.w || 0, l:+r.l || 0, t:+r.t || 0 }; }); }
    if (p.survey && typeof p.survey === 'object' && (!state.survey || (+p.survey.t || 0) > (+state.survey.t || 0))) state.survey = p.survey;
    if (p.battle) state.battle = true;
    if (p.mem && typeof p.mem === 'object'){ const m = cleanMem(p.mem); if ((+m.t || 0) > (+(state.mem && state.mem.t) || 0)) state.mem = m; }
    if (p.ledger && typeof p.ledger === 'object'){ syncLedger(); state.ledger = mergeLedger(state.ledger, cleanLedger(p.ledger)); }
    else if (p.usage && typeof p.usage === 'object' && !state.ledger.ep){ const leg = legacyRow(p.usage); if (Object.keys(leg).length){ syncLedger(); state.ledger = mergeLedger(state.ledger, { ep:state.ledger.ep, dev:{ legacy:leg } }); } }
    state.usage = usageOf(state.ledger); writeLedger();
  }
  (state.del || []).forEach(k => { delete state.chats[k]; delete (chats || {})[k]; });
  Object.keys(chats || {}).forEach(k => { const r = chats[k], l = state.chats[k]; if (Array.isArray(r) && /^openrouter::./.test(k) && (!Array.isArray(l) || r.length > l.length)) state.chats[k] = r.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'); });
}
/* ---------- Google Drive (opcional): una copia de tus chats en TU Drive, en la carpeta privada de la app ----------
   · Solo pide permiso para la carpeta oculta de SynthFlow (drive.appdata): no puede ver ni tocar tus otros archivos.
   · El permiso dura ~1 hora y vive solo en memoria; nunca se guarda ni se envía a SymphorIA.
   · Al traer la copia se MEZCLA con lo que tienes: nunca se borra un chat. Tus llaves no van en la copia. */
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata', DRIVE_FILE = 'synthflow-chats.json', DRIVE_API = 'https://www.googleapis.com';
const DRV = { tok:'', exp:0, fileId:'', busy:false, t:0, tc:null, cid:'' };
const driveMeta = () => { try{ return JSON.parse(localStorage.getItem('synthz:drive') || 'null'); }catch(e){ return null; } };
function driveSetMeta(v){ try{ if (v) localStorage.setItem('synthz:drive', JSON.stringify(v)); else localStorage.removeItem('synthz:drive'); }catch(e){} try{ dispatchEvent(new CustomEvent('synthz-drive', { detail:v })); }catch(e){} }
async function driveCid(){ await accConfig(); return ACC.dcid || ''; }
const driveLive = () => !!(DRV.tok && Date.now() < DRV.exp - 60000);
/* pide el permiso (debe llamarse dentro de un clic: Google abre una ventanita) */
function driveToken(prompt){
  return new Promise((ok, no) => {
    if (!window.google || !google.accounts || !google.accounts.oauth2) return no(Object.assign(new Error('No pude abrir el botón de Google. Revisa tu internet o tu bloqueador de anuncios.'), { gsi:true }));
    DRV.tc = google.accounts.oauth2.initTokenClient({ client_id:DRV.cid, scope:DRIVE_SCOPE, include_granted_scopes:false,
      callback:r => { if (r && r.access_token && google.accounts.oauth2.hasGrantedAllScopes(r, DRIVE_SCOPE)){ DRV.tok = r.access_token; DRV.exp = Date.now() + (+r.expires_in || 3600) * 1000; ok(true); } else no(new Error('No diste permiso para la carpeta de SynthFlow en tu Drive.')); },
      error_callback:e => no(new Error(e && e.type === 'popup_closed' ? 'Cerraste la ventana de Google antes de terminar.' : e && e.type === 'popup_failed_to_open' ? 'Tu navegador no dejó abrir la ventanita de Google. Permite las ventanitas de este sitio.' : 'Google no completó el permiso.')) });
    DRV.tc.requestAccessToken({ prompt:prompt == null ? '' : prompt });
  });
}
async function dfetch(path, o = {}){
  const r = await fetch(DRIVE_API + path, Object.assign({}, o, { headers:Object.assign({ Authorization:'Bearer ' + DRV.tok }, o.headers || {}) })).catch(() => null);
  if (!r) throw new Error('No pude hablar con Google Drive. Revisa tu conexión.');
  if (r.status === 401){ DRV.tok = ''; throw Object.assign(new Error('El permiso de Drive venció. Toca «Sincronizar» otra vez.'), { expired:true }); }
  if (r.status === 403){ const t = await r.text().catch(() => ''); throw new Error(/storageQuota|quota/i.test(t) ? 'Tu Google Drive está lleno.' : /accessNotConfigured|has not been used|disabled/i.test(t) ? 'Falta activar la «Google Drive API» en el proyecto de Google de SymphorIA (lo hace Prime una sola vez).' : 'Google Drive no dio permiso para guardar.'); }
  if (!r.ok) throw new Error('Google Drive respondió con un error (' + r.status + '). Intenta más tarde.');
  return r;
}
async function driveFind(){
  if (DRV.fileId) return DRV.fileId;
  const q = encodeURIComponent("name='" + DRIVE_FILE + "' and trashed=false");
  const d = await (await dfetch('/drive/v3/files?spaces=appDataFolder&fields=files(id,modifiedTime,size)&q=' + q)).json();
  const f = (d.files || [])[0]; DRV.fileId = f ? f.id : ''; return DRV.fileId;
}
async function drivePull(){
  const id = await driveFind(); if (!id) return 0;
  const d = await (await dfetch('/drive/v3/files/' + id + '?alt=media')).json().catch(() => null);
  if (!d || d.app !== 'SynthFlow' || typeof d.chats !== 'object') return 0;
  const before = Object.keys(state.chats).length;
  mergeIn(d.prefs || null, d.chats || {}); save();
  try{ hooks.chats(); }catch(e){}
  return Object.keys(state.chats).length - before;
}
async function drivePush(){
  const chats = {}; Object.keys(state.chats).forEach(k => { const a = state.chats[k]; if (Array.isArray(a) && a.length) chats[k] = a.map(m => ({ role:m.role, content:m.content, meta:m.meta, model:m.model, star:m.star || undefined, files:Array.isArray(m.files) ? m.files.map(f => ({ name:f.name, kind:f.kind })) : undefined })); });
  const prefs = prefsOut(); delete prefs.cfg;
  const body = JSON.stringify({ app:'SynthFlow', v:1, t:Date.now(), prefs, chats });
  const id = await driveFind();
  if (id) await dfetch('/upload/drive/v3/files/' + id + '?uploadType=media', { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body });
  else {
    const B = 'szb' + Math.random().toString(36).slice(2);
    const mp = '--' + B + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify({ name:DRIVE_FILE, parents:['appDataFolder'], mimeType:'application/json' }) + '\r\n--' + B + '\r\nContent-Type: application/json\r\n\r\n' + body + '\r\n--' + B + '--';
    const d = await (await dfetch('/upload/drive/v3/files?uploadType=multipart&fields=id', { method:'POST', headers:{ 'Content-Type':'multipart/related; boundary=' + B }, body:mp })).json();
    DRV.fileId = d.id || '';
  }
  const m = driveMeta() || {}; driveSetMeta(Object.assign(m, { linked:true, last:Date.now(), size:body.length, n:Object.keys(chats).length }));
  return body.length;
}
/* vincular o sincronizar (dentro de un clic): trae lo que haya en tu Drive, lo mezcla y sube la copia al día */
async function driveSync(o = {}){
  if (DRV.busy) return { busy:true };
  DRV.cid = await driveCid();
  if (!DRV.cid) throw Object.assign(new Error('Guardar en Google Drive todavía no está disponible. Muy pronto.'), { off:true });
  await loadGsi();
  if (!driveLive()) await driveToken(driveMeta() ? '' : 'consent');
  DRV.busy = true;
  try{ const got = await drivePull(); const size = await drivePush(); return { got, size }; }
  finally{ DRV.busy = false; }
}
/* con el permiso vivo, cada cambio se sube solo (cada 30 s como mucho) */
function driveSchedule(){ if (!driveLive() || !(driveMeta() || {}).linked) return; clearTimeout(DRV.t); DRV.t = setTimeout(() => { if (driveLive() && !DRV.busy){ DRV.busy = true; drivePush().catch(() => {}).finally(() => { DRV.busy = false; }); } }, 30000); }
function driveUnlink(){ try{ if (DRV.tok && window.google && google.accounts && google.accounts.oauth2) google.accounts.oauth2.revoke(DRV.tok, () => {}); }catch(e){} DRV.tok = ''; DRV.exp = 0; DRV.fileId = ''; driveSetMeta(null); }
const DRIVE = { sync:driveSync, unlink:driveUnlink, meta:driveMeta, live:driveLive, cid:driveCid, preload:() => loadGsi().catch(() => {}) };
function takeLedger(L){ if (!L || typeof L !== 'object') return; syncLedger(); state.ledger = mergeLedger(state.ledger, cleanLedger(L)); state.usage = usageOf(state.ledger); writeLedger(); hooks.usage(); }
async function accPull(d){
  mergeIn(d.prefs || null, {});
  takeLedger(d.ledger); ACC.lgT = Date.now();
  const want = (d.chatKeys || []).filter(k => !(state.del || []).includes(k));
  for (let i = 0; i < want.length; i += 20){
    const q = want.slice(i, i + 20).map(k => 'k=' + encodeURIComponent(k)).join('&');
    try{ const r = await api('chats?' + q); mergeIn(null, r.chats || {}); }catch(e){}
  }
  if (d.key && !state.keys.openrouter){ state.keys.openrouter = d.key; state.syncKey = true; }
  (d.chatKeys || []).forEach(k => { const a = state.chats[k]; if (Array.isArray(a)){ const s = JSON.stringify(slimChat(a)); accSent[k] = s.length + ':' + hashS(s); } });
  save();
}
async function accPush(o){
  if (!ACC.ready || !SESS) return;
  o = o || {};
  try{
    syncLedger();
    const L = state.ledger, mine = {}; [DEV, 'legacy'].forEach(id => { if (L.dev[id]) mine[id] = L.dev[id]; });
    const items = [], marks = {};
    Object.keys(state.chats).forEach(k => { const a = state.chats[k]; if (!Array.isArray(a) || !a.length || !/^openrouter::./.test(k)) return; const s = JSON.stringify(slimChat(a)), h = s.length + ':' + hashS(s); if (accSent[k] !== h){ items.push({ k, data:slimChat(a) }); marks[k] = h; } });
    const del = (state.del || []).filter(k => !accDelSent.has(k));
    /* una sola petición lleva preferencias, SynXCoin's y los chats que cambiaron (menos viajes al servidor) */
    const first = items.slice(0, 20), want = o.ledger || Date.now() - (ACC.lgT || 0) > 60000;
    const res = await api('me', { method:'PUT', body:Object.assign({ prefs:prefsOut(), ledger:{ ep:L.ep, dev:mine }, wantLedger:want }, first.length || del.length ? { chats:{ items:first, del } } : {}, state.syncKey ? { key:state.keys.openrouter || '' } : {}) });
    if (res.ledger){ takeLedger(res.ledger); ACC.lgT = Date.now(); }
    if (res.chats && res.chats.max) ACC.space = { used:res.chats.used, max:res.chats.max }; ACC.full = false;
    first.forEach(x => { accSent[x.k] = marks[x.k]; }); del.forEach(k => { accDelSent.add(k); delete accSent[k]; });
    for (let i = 20; i < items.length; i += 20){
      const part = items.slice(i, i + 20);
      await api('chats', { method:'POST', body:{ items:part, del:[] } });
      part.forEach(x => { accSent[x.k] = marks[x.k]; });
    }
    ACC.t = Date.now(); ACC.err = '';
  }catch(e){
    ACC.err = e.message || 'No pude guardar en tu cuenta.';
    if (e.status === 413){ if (!ACC.full) toast(ACC.err); ACC.full = true; }                     /* nube llena: no reintenta hasta que liberes espacio */
    else if (e.status !== 401){ clearTimeout(accT); accT = setTimeout(accPush, 20000); }
  }
  accFire('push');
}
/* espera 6 s sin cambios antes de subir (agrupa mensaje y respuesta en una sola subida) y sube al salir de la pestaña */
function accSchedule(){ if (typeof ACC === 'undefined' || !ACC || !ACC.ready) return; clearTimeout(accT); accT = setTimeout(accPush, 6000); }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && ACC && ACC.ready && accT){ clearTimeout(accT); accT = 0; accPush(); } });
/* Los datos de este navegador son de UNA cuenta (state.owner) o de nadie (''): así nunca se mezclan dos cuentas.
   Al cerrar sesión se guardan en la nube y se borran de aquí; si entra otra cuenta y quedaron datos ajenos, se borran antes. */
function wipeAccountData(){
  state.chats = {}; state.threads = {}; state.fav = []; state.cmp = []; state.pinned = ''; state.del = []; state.arena = {}; state.survey = null;
  state.projects = []; state.projOf = {}; state.pjDel = []; state.curProj = '';
  delete state.useTeam; delete state.intent; state.battle = false;
  state.sx = { daily:0, saver:false, saved:0, hits:0, over:'', warned:'' };
  if (state.syncKey){ delete state.keys.openrouter; state.syncKey = false; }   /* esa llave vive en la cuenta: no se queda en un navegador ajeno */
  state.ledger = { ep:0, dev:{} }; state.usage = {}; writeLedger();
  accSent = {}; accDelSent = new Set();
  if (IDB.ready){ try{ IDB.db.transaction('chats', 'readwrite').objectStore('chats').clear(); }catch(e){} Object.keys(idbHash).forEach(k => delete idbHash[k]); }
  state.owner = ''; save();
}
async function accStart(){
  if (ACC.ready || ACC.busy || !SESS) return;
  try{ await chatsReady; }catch(e){}
  await sessMove;
  ACC.busy = true; accFire('start');
  try{
    const d = await api('me'); ACC.user = d.user; ACC.profile = d.profile || null; ACC.space = d.space || null;
    if (state.owner && state.owner !== d.user.sub) wipeAccountData();   /* quedaron datos de otra cuenta: no se suben a esta */
    state.owner = d.user.sub;
    await accPull(d); ACC.ready = true; ACC.err = '';
    await accPush();
  }catch(e){ ACC.err = e.status === 401 ? '' : (e.message || 'No pude abrir tu cuenta.'); }
  ACC.busy = false; accFire('pull'); hooks.usage();
}
/* cierra sesión: primero guarda en la nube; si no pudo, avisa (force = cerrar igual) */
async function accSignOut(force){
  if (ACC.ready){ ACC.err = ''; try{ await accPush(); }catch(e){} if (ACC.err && !force) throw Object.assign(new Error(ACC.err), { unsynced:true }); }
  try{ await api('auth', { method:'DELETE', keep:true }); }catch(e){}
  try{ if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect(); }catch(e){}
  setSess(''); ACC.ready = false; ACC.user = null; ACC.profile = null;
  wipeAccountData();
  accFire('out');
}
/* cerrar sesión en TODOS tus dispositivos (este incluido) */
async function accSignOutAll(force){
  if (ACC.ready){ ACC.err = ''; try{ await accPush(); }catch(e){} if (ACC.err && !force) throw Object.assign(new Error(ACC.err), { unsynced:true }); }
  await api('auth?all=1', { method:'DELETE', keep:true });
  setSess(''); ACC.ready = false; ACC.user = null; ACC.profile = null; wipeAccountData(); accFire('out');
}
async function accClaim(setup){ const d = await api('auth', { method:'POST', body:{ mode:'claim', setup }, keep:true }); if (ACC.user){ ACC.user.role = d.role; ACC.user.claimable = false; } accFire('profile'); return d.role; }
/* rangos de SymphorIA */
const ROLE_NAME = { owner:'Prime', admin:'ZFlow', staff:'Symmetrix', user:'Synther' };
/* si otra pestaña cerró sesión o cambió de cuenta, esta se recarga para no mostrar ni guardar datos ajenos */
addEventListener('storage', e => { if (e.key === 'synthz:sess' && (e.newValue || '') !== SESS) location.reload(); });
async function accDelete(confirm){
  await api('me', { method:'DELETE', body:confirm || {}, keep:true }); setSess(''); ACC.ready = false; ACC.user = null; ACC.profile = null; wipeAccountData(); accFire('out');
}
async function saveProfile(p){ const d = await api('me', { method:'PUT', body:{ profile:p } }); ACC.profile = d.profile; accFire('profile'); return d.profile; }
const accHandle = u => { u = u || ACC.user || {}; return u.username ? '@' + u.username : (u.email || ''); };
const accName = () => (ACC.profile && ACC.profile.name) || (ACC.user && ACC.user.name) || 'Tú';
const TINTS = { aurora:['#8fb0ff', '#c9566c', '#ff8f7a'], azul:['#5b8cff', '#8fb0ff', '#6fd3d6'], violeta:['#7c5cff', '#a98bff', '#ff9ed8'], coral:['#ff8f7a', '#ffb36b', '#ff9ed8'], menta:['#46d6a8', '#6fd3d6', '#8fb0ff'], oro:['#f2c46b', '#ffb36b', '#ff8f7a'], rosa:['#ff9ed8', '#ff8f7a', '#c9566c'], noche:['#3a3f63', '#5b5f8f', '#8fb0ff'] };
const tint = c => TINTS[c] || TINTS.aurora;
const grad = c => 'linear-gradient(135deg,' + tint(c).join(',') + ')';
function avatarHtml(pf, user, cls){
  pf = pf || {}; const a = pf.avatar || { type:user && user.picture ? 'google' : 'initial' }, name = pf.name || (user && user.name) || '?';
  const bg = 'background:' + grad(pf.color);
  if (a.type === 'google' && user && user.picture) return '<span class="av-me ' + (cls || '') + '" style="' + bg + '"><img src="' + esc(user.picture) + '" alt="" referrerpolicy="no-referrer" loading="lazy"></span>';
  if (a.type === 'emoji' && a.emoji) return '<span class="av-me emo ' + (cls || '') + '" style="' + bg + '">' + esc(a.emoji) + '</span>';
  return '<span class="av-me ' + (cls || '') + '" style="' + bg + '">' + esc(String(name).trim().slice(0, 1).toUpperCase() || '?') + '</span>';
}
const myAvatar = cls => avatarHtml(ACC.profile, ACC.user, cls);
if (SESS) setTimeout(accStart, 0);
/* «Pulsem» en la barrita: solo para Prime, ZFlow y Symmetrix */
const paintPulse = () => { const b = document.getElementById('railPulse'); if (b) b.hidden = !(ACC.ready && ACC.user && ['owner', 'admin', 'staff'].includes(ACC.user.role)); };
accHooks.push(paintPulse);

/* ---------- icono de la pestaña: la Z de vidrio (SymphorIA) o la esfera con la onda (SynthFlow) ---------- */
function cradleAngles(t, A){
  const u = (t % 1150) / 1150, out = x => 1 - Math.pow(1 - x, 2.4), inn = x => Math.pow(x, 2.4);
  const L = u < .25 ? out(u / .25) : u < .5 ? 1 - inn((u - .25) / .25) : 0;
  const R = u >= .5 && u < .75 ? out((u - .5) / .25) : u >= .75 ? 1 - inn((u - .75) / .25) : 0;
  return [L * A, -R * A];
}
(function favCradle(){
  const link = document.getElementById('favi'); if (!link) return;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); if (!g) return;
  /* v2.5 · SynthFlow: la esfera de vidrio con la onda (cian → violeta → rosa → naranja), que ondula un poquito */
  const drawFlow = now => {
    g.clearRect(0, 0, 64, 64);
    const bg = g.createRadialGradient(24, 20, 2, 32, 32, 31); bg.addColorStop(0, 'rgba(255,255,255,.55)'); bg.addColorStop(.45, 'rgba(123,63,242,.55)'); bg.addColorStop(1, 'rgba(14,8,40,.95)');
    g.fillStyle = bg; g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.5; g.stroke();
    const wg = g.createLinearGradient(8, 20, 56, 44); wg.addColorStop(0, '#3de0ff'); wg.addColorStop(.45, '#7b3ff2'); wg.addColorStop(.75, '#ff3d9a'); wg.addColorStop(1, '#ff7a45');
    g.strokeStyle = wg; g.lineWidth = 5.5; g.lineCap = 'round'; g.beginPath();
    const ph = now ? now / 600 : 0;
    for (let x = 12; x <= 52; x++){ const y = 32 + Math.sin((x - 12) / 40 * Math.PI * 3 + ph) * 9; x === 12 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.stroke();
    try{ link.href = c.toDataURL('image/png'); }catch(e){}
  };
  /* SymphorIA: la Z de vidrio del boceto, quieta */
  const draw = now => { if (isFlow()) return drawFlow(now); if (link.getAttribute('href') !== 'media/v30/fav-s.png') link.href = 'media/v30/fav-s.png'; };
  let last = 0;
  let on = false;
  /* v2.9: solo la esfera de SynthFlow se mueve, y a ~8 cuadros por segundo (cada cuadro es una imagen PNG nueva: a 20 por
     segundo pesaba). La Z de SymphorIA es quieta: se pone una vez y el ciclo no corre */
  const tick = now => { if (!CFG.favAnim || !isFlow()){ on = false; draw(0); return; } if (now - last > 120){ last = now; draw(now); } requestAnimationFrame(tick); };
  window.__favStart = () => { if (!on){ on = true; requestAnimationFrame(tick); } };
  window.__favStart();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw(CFG.favAnim ? performance.now() : 0));
  setInterval(() => { if (document.hidden && CFG.favAnim) draw(performance.now()); }, 500);
})();

const total = id => { const u = state.usage[id]; return u ? (u.prompt || 0) + (u.completion || 0) : 0; };
const counted = new Set();
/* o: { est:true si es una estimación, free:true si fue a un modelo gratis, rid: id único de la petición } */
function addUsage(id, p = 0, c = 0, countReq = true, o = {}){
  if (!byId(id)) return false;
  if (o.rid){ if (counted.has(o.rid)) return false; counted.add(o.rid); }          /* la misma petición nunca cuenta dos veces */
  p = num(p); c = num(c);
  syncLedger();
  const L = state.ledger, mine = L.dev[DEV] || (L.dev[DEV] = {}), s = mine[id] || (mine[id] = cleanRow({})), d = today();
  s.p += p; s.c += c; s.days[d] = (s.days[d] || 0) + p + c;
  if (o.est){ s.e += p + c; s.de[d] = (s.de[d] || 0) + p + c; }
  if (countReq){ s.r += 1; s.rd[d] = (s.rd[d] || 0) + 1; if (o.free) s.fd[d] = (s.fd[d] || 0) + 1; }
  state.usage = usageOf(L);
  save(); hooks.usage();
  return true;
}
/* «Reiniciar contadores»: empieza una época nueva; los demás dispositivos la respetan al sincronizar */
function resetUsage(){ state.ledger = { ep:Date.now(), dev:{} }; state.usage = {}; writeLedger(); save(); hooks.usage(); }
/* otra pestaña sumó o guardó: lo traemos para no pisarlo */
addEventListener('storage', e => {
  if (e.key === LKEY){ syncLedger(); hooks.usage(); return; }
  if (e.key === KEY && e.newValue){
    try{ const o = JSON.parse(e.newValue); ['fav', 'cmp', 'model', 'models', 'keys', 'threads', 'pinned', 'del', 'arena', 'survey', 'useTeam', 'battle', 'syncKey', 'sx'].forEach(k => { if (k in o) state[k] = o[k]; }); normalizeLite(); hooks.chats(); hooks.usage(); }catch(_){}
  }
});
function normalizeLite(){ state.keys = cleanStrMap(state.keys); state.model = cleanStrMap(state.model); state.models = cleanModels(state.models); state.fav = strList(state.fav, 300); state.cmp = strList(state.cmp, 4); }

/* ---------- avisos ---------- */
let toastT;
function toast(msg){
  let t = $('#toast');
  if (!t){ t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200);
}
function hydrateIcons(scope){
  $$('[data-ico]', scope || document).forEach(el => {
    const p = byId(el.dataset.ico); if (!p) return;
    const t = document.createElement('template'); t.innerHTML = ico(p).trim();
    const n = t.content.firstChild; if (el.id) n.id = el.id;
    el.replaceWith(n);
  });
}

/* ---------- markdown pequeño ---------- */
function inl(h){
  return h.split(/(`[^`\n]+`)/).map((s, i) => i % 2 ? '<code>' + s.slice(1, -1) + '</code>' :
    s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
     .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
     .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')).join('');
}
/* ---------- markdown completo (tablas, citas, listas anidadas, títulos) y matemáticas bien escritas ----------
   Usa marked + DOMPurify + Temml (carpeta lib/). Si no cargan, queda el markdown pequeño de siempre. */
const MDLIB = { ok:false, p:null };
function mdLoad(){
  if (MDLIB.p) return MDLIB.p;
  const js = src => new Promise(res => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); });
  if (!document.querySelector('link[href="lib/temml.css"]')){ const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'lib/temml.css'; document.head.appendChild(l); }
  MDLIB.p = Promise.all([js('lib/marked.min.js'), js('lib/purify.min.js'), js('lib/temml.min.js')]).then(() => {
    MDLIB.ok = !!(window.marked && window.DOMPurify);
    if (MDLIB.ok){
      try{ marked.setOptions({ gfm:true, breaks:true, headerIds:false, mangle:false }); }catch(e){}
      DOMPurify.addHook('afterSanitizeAttributes', n => { if (n.tagName === 'A'){ n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer'); } });
    }
    try{ hooks.md && hooks.md(); }catch(e){}
    return MDLIB.ok;
  });
  return MDLIB.p;
}
if (document.readyState !== 'loading') setTimeout(mdLoad, 300); else document.addEventListener('DOMContentLoaded', () => setTimeout(mdLoad, 300));
const MCACHE = new Map();
function texHtml(tex, display){
  const k = (display ? 'D' : 'I') + tex; if (MCACHE.has(k)) return MCACHE.get(k);
  let h;
  try{ h = window.temml ? temml.renderToString(tex.trim(), { displayMode:display, throwOnError:false, annotate:true }) : null; }catch(e){ h = null; }
  if (!h) h = '<code class="tex">' + esc(tex) + '</code>';
  if (display) h = '<div class="mathd">' + h + '</div>';
  if (MCACHE.size > 400) MCACHE.clear(); MCACHE.set(k, h); return h;
}
function md(src){
  src = String(src || '');
  if (!MDLIB.ok) return mdLite(src);
  /* 1) el código se aparta (ahí no se toca nada) */
  const code = [];
  let t = src.replace(/```[\s\S]*?(```|$)|`[^`\n]+`/g, m => { code.push(m); return '\u0001C' + (code.length - 1) + '\u0001'; });
  /* 2) las fórmulas se apartan: \[ \], $$ $$, \( \), $ $ */
  const math = [];
  const keep = (tex, d) => { math.push([tex, d]); return d ? '\n\n\u0002M' + (math.length - 1) + '\u0002\n\n' : '\u0002M' + (math.length - 1) + '\u0002'; };
  t = t.replace(/\$\$([\s\S]+?)\$\$/g, (m, x) => keep(x, true))
       .replace(/\\\[([\s\S]+?)\\\]/g, (m, x) => keep(x, true))
       .replace(/\\\(([\s\S]+?)\\\)/g, (m, x) => keep(x, false))
       .replace(/(^|[^\\$\w])\$(?!\s)([^$\n]{1,200}?[^\s\\])\$(?![\w$])/g, (m, pre, x) => /^\d+([.,]\d+)?$/.test(x) ? m : pre + keep(x, false));
  /* sin cerrar todavía (mientras llega en vivo): se muestra como texto tranquilo, sin barras raras */
  t = t.replace(/\\\(([^\n]*)$/, (m, x) => x).replace(/\\\[([\s\S]*)$/, (m, x) => x);
  t = t.replace(/\u0001C(\d+)\u0001/g, (m, i) => code[+i]);
  let h;
  try{ h = marked.parse(t); }catch(e){ return mdLite(src); }
  h = h.replace(/\u0002M(\d+)\u0002/g, (m, i) => texHtml(math[+i][0], math[+i][1]));
  h = h.replace(/<p>\s*(<div class="mathd">[\s\S]*?<\/div>)\s*<\/p>/g, '$1');
  h = h.replace(/<table>/g, '<div class="tbw"><table>').replace(/<\/table>/g, '</table></div>');
  return DOMPurify.sanitize(h, { ADD_TAGS:['math', 'semantics', 'annotation', 'mrow', 'mi', 'mn', 'mo', 'msup', 'msub', 'msubsup', 'mfrac', 'msqrt', 'mroot', 'mtext', 'mspace', 'mtable', 'mtr', 'mtd', 'munder', 'mover', 'munderover', 'mstyle', 'mpadded', 'menclose', 'mphantom', 'merror'], ADD_ATTR:['target', 'display', 'mathvariant', 'stretchy', 'fence', 'separator', 'lspace', 'rspace', 'columnalign', 'rowspacing', 'columnspacing', 'displaystyle', 'scriptlevel', 'encoding', 'accent', 'accentunder', 'movablelimits', 'notation', 'width', 'height', 'depth', 'voffset', 'linethickness', 'minsize', 'maxsize', 'symmetric', 'largeop'] });
}
function mdLite(src){
  src = src.replace(/\\[()[\]]/g, '').replace(/\\sqrt\{([^}]*)\}/g, '√$1').replace(/\\(times|cdot)/g, (m, k) => k === 'times' ? '×' : '·');
  return src.split('```').map((seg, i) => {
    if (i % 2){ const nl = seg.indexOf('\n'); const code = nl > -1 ? seg.slice(nl + 1) : seg; return '<pre><code>' + esc(code.replace(/\n$/, '')) + '</code></pre>'; }
    const h = esc(seg);
    let out = '', list = null;
    for (const ln of h.split('\n')){
      const li = ln.match(/^\s*([-*]|\d+\.)\s+(.*)/);
      if (li){
        const t = /\d/.test(li[1]) ? 'ol' : 'ul';
        if (list !== t){ if (list) out += '</' + list + '>'; out += '<' + t + '>'; list = t; }
        out += '<li>' + inl(li[2]) + '</li>'; continue;
      }
      if (list){ out += '</' + list + '>'; list = null; }
      const hd = ln.match(/^#{1,6}\s+(.*)/);
      if (hd){ out += '<h4>' + inl(hd[1]) + '</h4>'; continue; }
      if (ln.trim()) out += '<p>' + inl(ln) + '</p>';
    }
    if (list) out += '</' + list + '>';
    return out;
  }).join('');
}

/* =====================================================================
   Identidad de cada IA: su icono real (vidrio líquido) y sus colores en el chat
   ===================================================================== */
const BRANDS = {
  openai:['openai', 'OpenAI', '#10a37f', '#7fe0c4'], anthropic:['claude-color', 'Claude (Anthropic)', '#d97757', '#f4b48f'], google:['gemini-color', 'Google Gemini', '#4c8df6', '#b39cff'],
  gemma:['gemma-color', 'Google Gemma', '#4c8df6', '#7fd6f0'], 'meta-llama':['meta-color', 'Meta Llama', '#0866ff', '#7fb0ff'], mistralai:['mistral-color', 'Mistral', '#fa520f', '#ffc06b'],
  deepseek:['deepseek-color', 'DeepSeek', '#4d6bfe', '#93a6ff'], qwen:['qwen-color', 'Qwen', '#6c5cf0', '#b5aaff'], 'x-ai':['grok', 'xAI Grok', '#d9d9de', '#8e8e96'],
  moonshotai:['kimi-color', 'Kimi (Moonshot)', '#1d7bff', '#8fc0ff'], nvidia:['nvidia-color', 'NVIDIA', '#76b900', '#c3f06b'], microsoft:['microsoft-color', 'Microsoft', '#22a6f0', '#ffb900'],
  'z-ai':['zhipu-color', 'Z.ai (GLM)', '#3859ff', '#8aa0ff'], ai21:['ai21', 'AI21', '#f3a6c8', '#ffd1e4'], cohere:['cohere-color', 'Cohere', '#d18ee2', '#ff9d7a'], nousresearch:['nousresearch', 'Nous', '#c9c9cf', '#8e8e96'],
  ibm:['ibm', 'IBM Granite', '#4589ff', '#a6c8ff'], minimax:['minimax-color', 'MiniMax', '#f23f5d', '#ff9e7a'], inception:['inception', 'Inception', '#a3a3ff', '#d6d6ff'], liquid:['liquid', 'Liquid', '#5b8cff', '#9fd0ff'],
  baidu:['baidu-color', 'Baidu', '#2932e1', '#7a82ff'], tencent:['tencent-color', 'Tencent', '#0052d9', '#6fa0ff'], bytedance:['bytedance-color', 'ByteDance', '#3c8cff', '#00c8d2'], 'stepfun-ai':['stepfun-color', 'StepFun', '#22c1c3', '#8ff0e6'],
  perplexity:['perplexity-color', 'Perplexity', '#20b8cd', '#9ff0f6'], allenai:['ai2-color', 'Ai2', '#f0529c', '#ff9fc8'], groq:['groq', 'Groq', '#f55036', '#ffb36b'], cloudflare:['cloudflare-color', 'Cloudflare', '#f6821f', '#ffc46b'],
  openrouter:['openrouter', 'OpenRouter', '#6467f2', '#a5a7ff'], synthz:['', 'SymphorIA', '#7b3ff2', '#ff3d9a'], puter:['', 'Puter', '#3b82f6', '#6fd3d6']
};
const BALIAS = { meta:'meta-llama', llama:'meta-llama', mistral:'mistralai', claude:'anthropic', xai:'x-ai', grok:'x-ai', moonshot:'moonshotai', kimi:'moonshotai', zhipu:'z-ai', thudm:'z-ai', glm:'z-ai', stepfun:'stepfun-ai', ai2:'allenai', gemini:'google', 'openai-completion':'openai', 'ibm-granite':'ibm', 'nous':'nousresearch' };
function brandOf(m){
  if (!m) return BRANDS.synthz;
  const id = String(m.id || ''), v = String(m.vendor || '').toLowerCase().replace(/-completion$/, '');
  if (id === 'sz:auto' || v === 'synthz') return BRANDS.synthz;
  let k = BALIAS[v] || v;
  if (k === 'google' && /gemma/i.test(id)) k = 'gemma';
  if (!BRANDS[k]){ const g = Object.keys(BRANDS).find(b => new RegExp(b.replace(/-.*/, ''), 'i').test(id.split(':').pop())) || Object.keys(BALIAS).find(a => new RegExp('\\b' + a, 'i').test(id)); k = BRANDS[g] ? g : BALIAS[g] || ''; }
  return BRANDS[k] || null;
}
const ZMINI = '<img class="zmini" src="media/v30/symphoria.svg" alt="" draggable="false">';   /* v2.5 · la Z de vidrio del boceto */
/* icono de vidrio líquido: baldosa translúcida con brillo especular y el logo real adentro */
function glassIcon(m, cls){
  const b = brandOf(m), c1 = b ? b[2] : vendorColor(m && m.vendor), c2 = b ? b[3] : '#ffffff';
  const inner = b && b[0] ? '<img src="ico/' + b[0] + '.svg" alt="" loading="lazy" decoding="async" onerror="this.replaceWith(document.createTextNode(\'' + esc(((m && (m.vlabel || m.name)) || '?').charAt(0).toUpperCase()).replace(/'/g, '') + '\'))">'
    : b === BRANDS.synthz ? ZMINI : b === BRANDS.puter ? '<img src="' + PUTER_LOGO + '" alt="" referrerpolicy="no-referrer" loading="lazy">' : '<b>' + esc(((m && (m.vlabel || m.name)) || '?').charAt(0).toUpperCase()) + '</b>';
  return '<span class="gico' + (cls ? ' ' + cls : '') + '" style="--b1:' + c1 + ';--b2:' + c2 + '" title="' + esc(b ? b[1] : (m && m.vlabel) || '') + '">' + inner + '</span>';
}

/* =====================================================================
   Carga de las IA: un cuadradito de 8×8 píxeles de vidrio que va armando 16 dibujos
   mientras la IA trabaja, y al lado lo que está haciendo (con flechita para ver el detalle)
   ===================================================================== */
/* v3.1 · dibujos nuevos (Sammuel, 28 oct): más variados y livianos, de contorno, sin llenar todo el cuadro */
const PIXART = [
  ['Invasor', '........|..1..1..|.111111.|11211211|11111111|.1.11.1.|1......1|........'],
  ['Corazón', '........|.11..11.|1..11..1|12.....1|.1....1.|..1..1..|...11...|........'],
  ['Destello', '...1....|...1....|..121...|1112111.|..121...|...1....|...1...2|......2.'],
  ['Nota', '....111.|....1.11|....1...|....1...|..111...|.1221...|..11....|........'],
  ['Luna', '...111..|..11...2|.11.....|.11...2.|.11.....|..11....|...111..|........'],
  ['Flor', '..1.1...|.12121..|..1.1...|...2....|...2.1..|.1.22...|..12....|...2....'],
  ['Llave', '.111....|1...1...|1...1...|.111....|...2....|...22...|...2....|...22...'],
  ['Hongo', '..1111..|.1.22.1.|1.2..2.1|11111111|..1..1..|..1..1..|..1111..|........'],
  ['Poción', '...22...|...11...|..1..1..|.1....1.|1.2222.1|1.2222.1|.1....1.|..1111..'],
  ['SynthonIA', '....2...|....1...|.111111.|1......1|1.2..2.1|1......1|.111111.|........'],
  ['Cohete', '...11...|..1..1..|..1.21..|..1..1..|.11..11.|1.1..1.1|..2..2..|...22...'],
  ['Gatito', '1.....1.|11...11.|1.111.1.|1.....1.|1.2.2.1.|1..1..1.|.11111..|........'],
  ['Diamante', '........|..1111..|.1.22.1.|11111111|.1....1.|..1..1..|...11...|........'],
  ['Planeta', '........|........|...111..|..1...1.|22222222|..1...1.|...111..|........'],
  ['Sonrisa', '..1111..|.1....1.|1.2..2.1|1......1|1.1..1.1|1..11..1|.1....1.|..1111..'],
  ['Café', '..2.2...|...2.2..|.11111..|.1...111|.1...1.1|.1...111|..111...|........']
].map(([n, s]) => [n, s.split('|').join('').replace(/ /g, '.')]);
const WORDS = ['Leyendo tu mensaje', 'Pensando', 'Sopesando ideas', 'Aclarando', 'Ordenando las ideas', 'Buscando las palabras', 'Revisando', 'Casi listo'];
const pixelGrid = () => '<span class="pxg" aria-hidden="true">' + '<i></i>'.repeat(64) + '</span>';
/* motor del dibujo: se enciende píxel a píxel; al completarse brilla, se deshace y empieza otro */
function pixelRun(host, startAt){
  const cells = [...host.querySelectorAll('.pxg i')]; if (!cells.length) return { stop(){}, speed(){} };
  let art = (startAt == null ? Math.floor(Math.random() * PIXART.length) : startAt) % PIXART.length, order = [], k = 0, hold = 0, fast = 1, stopped = false, t = 0;
  const load = () => { const s = PIXART[art][1]; order = []; for (let i = 0; i < 64; i++) if (s[i] !== '.') order.push(i); order.sort(() => Math.random() - .5); k = 0; host.dataset.art = PIXART[art][0]; cells.forEach(c => { c.className = ''; }); };
  load();
  const tick = () => {
    if (stopped) return;
    if (hold > 0){ hold--; if (!hold){ cells.forEach(c => { if (c.className) c.className += ' out'; }); setTimeout(() => { art = (art + 1) % PIXART.length; load(); }, 260); } }
    else if (k < order.length){ for (let n = 0; n < fast && k < order.length; n++, k++){ const i = order[k]; cells[i].className = 'on c' + PIXART[art][1][i]; } if (k >= order.length){ hold = 7; host.classList.remove('done'); void host.offsetWidth; host.classList.add('done'); } }
    t = setTimeout(tick, 70);
  };
  t = setTimeout(tick, 60);
  return { stop(){ stopped = true; clearTimeout(t); }, speed(n){ fast = Math.max(1, Math.min(4, n | 0)); }, get art(){ return art; } };
}
/* «qué está haciendo la IA»: frases que cambian, segundos, palabras y el detalle real (si la IA lo comparte) */
function workView(o = {}){
  const el = document.createElement('div'); el.className = 'work';
  el.innerHTML = '<button type="button" class="wk-row" aria-expanded="false"><span class="pxw">' + pixelGrid() + '</span><span class="wk-t"><b class="wk-w">Leyendo tu mensaje</b><small class="wk-s"></small></span><svg class="wk-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button><div class="wk-d" hidden><ol class="wk-steps"></ol><div class="wk-r" hidden><b>Lo que pensó la IA</b><p></p></div></div>';
  const S = { t0:performance.now(), phase:'read', words:0, reason:'', steps:[], wi:0, done:false };
  const px = pixelRun($('.pxw', el), o.art);
  const w = $('.wk-w', el), sm = $('.wk-s', el), row = $('.wk-row', el), det = $('.wk-d', el);
  const secs = () => ((performance.now() - S.t0) / 1000).toFixed(1).replace('.', ',') + ' s';
  const step = txt => { S.steps.push([performance.now() - S.t0, txt]); if (!det.hidden) paintSteps(); };
  const paintSteps = () => { $('.wk-steps', el).innerHTML = S.steps.map(([ms, x]) => '<li><em>' + (ms / 1000).toFixed(1).replace('.', ',') + ' s</em>' + esc(x) + '</li>').join(''); const r = $('.wk-r', el); r.hidden = !S.reason; if (S.reason) $('p', r).textContent = S.reason.slice(-4000); };
  const setW = (txt) => { if (w.textContent === txt) return; w.classList.remove('sw'); void w.offsetWidth; w.textContent = txt; w.classList.add('sw'); };
  let iv = setInterval(() => {
    if (S.done) return;
    if (S.phase === 'read' && performance.now() - S.t0 > 700){ S.phase = 'think'; step('Leyó tu mensaje'); }
    if (S.phase === 'think'){ const n = Math.floor((performance.now() - S.t0 - 700) / 1700); setW(WORDS[1 + (n % (WORDS.length - 1))]); }
    sm.textContent = S.phase === 'write' ? secs() + ' · ' + fmt(S.words) + (S.words === 1 ? ' palabra' : ' palabras') : S.phase === 'reason' ? secs() + ' · pensando antes de responder' : secs();
  }, 250);
  row.addEventListener('click', () => { const on = det.hidden; det.hidden = !on; row.setAttribute('aria-expanded', String(on)); el.classList.toggle('open', on); if (on) paintSteps(); });
  if (o.model) step('Eligió ' + o.model);
  return {
    el, state:S,
    reason(txt){ if (S.done) return; if (!S.reason) step('Empezó a razonar'); S.reason = txt; if (S.phase !== 'write'){ S.phase = 'reason'; setW('Razonando'); } px.speed(2); if (!det.hidden) paintSteps(); },
    write(txt){ if (S.done) return; if (S.phase !== 'write'){ step('Empezó a escribir'); S.phase = 'write'; setW('Escribiendo'); } S.words = (String(txt).match(/\S+/g) || []).length; px.speed(1 + Math.floor(S.words / 120)); },
    note(txt){ step(txt); },
    finish(r = {}){
      if (S.done) return; S.done = true; clearInterval(iv); px.stop();
      step(r.error ? 'No pudo responder' : r.aborted ? 'La detuviste' : 'Terminó');
      const t = ((r.ms != null ? r.ms : performance.now() - S.t0) / 1000).toFixed(1).replace('.', ',');
      w.textContent = r.error ? 'No respondió' : S.reason ? 'Pensó y respondió en ' + t + ' s' : 'Respondió en ' + t + ' s';
      sm.textContent = fmt(S.words) + (S.words === 1 ? ' palabra' : ' palabras');
      el.classList.add('fin'); if (!det.hidden) paintSteps();
    },
    stop(){ S.done = true; clearInterval(iv); px.stop(); }
  };
}

/* resumen guardado de una respuesta vieja: «Respondió en 2,1 s · 120 palabras ▸» con su detalle */
function workSaved(sum){
  const el = document.createElement('div'); el.className = 'work fin';
  const t = ((sum.ms || 0) / 1000).toFixed(1).replace('.', ',');
  el.innerHTML = '<button type="button" class="wk-row" aria-expanded="false"><span class="wk-t"><b class="wk-w">' + (sum.reason ? 'Pensó y respondió en ' : 'Respondió en ') + t + ' s</b><small class="wk-s">' + fmt(sum.words || 0) + ((sum.words || 0) === 1 ? ' palabra' : ' palabras') + '</small></span><svg class="wk-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button><div class="wk-d" hidden><ol class="wk-steps">' + (sum.steps || []).map(([ms, x]) => '<li><em>' + (ms / 1000).toFixed(1).replace('.', ',') + ' s</em>' + esc(x) + '</li>').join('') + '</ol><div class="wk-r"' + (sum.reason ? '' : ' hidden') + '><b>Lo que pensó la IA</b><p></p></div></div>';
  if (sum.reason) $('.wk-r p', el).textContent = sum.reason;
  const row = $('.wk-row', el), det = $('.wk-d', el);
  row.addEventListener('click', () => { const on = det.hidden; det.hidden = !on; row.setAttribute('aria-expanded', String(on)); el.classList.toggle('open', on); });
  return el;
}
/* ---------- números que suben ---------- */
function countTo(el, val){
  const from = el._v || 0; el._v = val;
  if (from === val){ el.textContent = fmt(val); return; }
  const t0 = performance.now(), dur = 1100;
  (function tick(now){
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
    el.textContent = fmt(from + (val - from) * e);
    if (k < 1) requestAnimationFrame(tick);
  })(t0);
}

/* la etiqueta para lectores de pantalla sigue al idioma (si el texto tiene clave, se lee la traducción) */
function ariaSync(el){ const k = el.dataset.i18n || el.dataset.i18nHtml, v = k && t(k); el.setAttribute('aria-label', (v && v !== k ? v : el.textContent).replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ')); }
onLang(() => document.querySelectorAll('[data-aa]').forEach(ariaSync));

/* ===== escritura suave: cada letra aparece con un resplandor y un cursor la acompaña ===== */
function charify(el){
  if (el._chars) return el._chars;
  if (!el.getAttribute('aria-label') && el.textContent.trim()){ el.dataset.aa = '1'; ariaSync(el); }
  const chars = [];
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3){
        const txt = n.textContent; if (!txt) return;
        const frag = document.createDocumentFragment();
        txt.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
          const cs = [...part], wrap = cs.length <= 22;
          const holder = wrap ? document.createElement('span') : frag;
          if (wrap) holder.className = 'tw';
          cs.forEach(ch => { const s = document.createElement('span'); s.className = 'tc'; s.setAttribute('aria-hidden', 'true'); s.textContent = ch; holder.appendChild(s); chars.push(s); });
          if (wrap) frag.appendChild(holder);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !/^(SCRIPT|STYLE|SVG|I|BUTTON)$/i.test(n.tagName)) walk(n);
    });
  };
  walk(el);
  chars.forEach(c => { const b = c.closest('li,pre,h4'); if (b && b !== el && el.contains(b)) c._b = b; });
  el._chars = chars; el.setAttribute('data-typed', '');
  gtPaint(el);
  return chars;
}
/* el texto con degradado (.gt) pinta el color en el padre, así que se veía entero antes de escribirse
   y el cursor pasaba por encima como una barra de carga: cada letra lleva su trozo del degradado */
function gtPaint(el){
  const gts = $$('.gt', el); if (!gts.length) return;
  const fit = () => gts.forEach(g => {
    /* igual que el navegador: las líneas del degradado van una detrás de otra como una sola tira */
    const L = [...g.getClientRects()].filter(q => q.width > 1); let acc = 0; L.forEach(q => { q._x = acc; acc += q.width; });
    $$('.tc', g).forEach(c => {
      const r = c.getBoundingClientRect(), q = L.find(q => r.top + r.height / 2 >= q.top && r.top + r.height / 2 <= q.bottom) || L[0];
      if (q) c.style.cssText = '--gw:' + acc + 'px;--gh:' + q.height + 'px;--gx:' + (-(q._x + r.left - q.left)) + 'px;--gy:' + (q.top - r.top) + 'px';
    });
    g.classList.add('gtc');
  });
  fit(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  let tm; addEventListener('resize', () => { clearTimeout(tm); tm = setTimeout(fit, 120); });
}
/* cps = letras por segundo; max = segundos máximos que puede tardar */
function typeIn(el, o = {}){
  const cps = o.cps || 70, max = o.max || 4, delay = o.delay || 0, onFrame = o.onFrame;
  /* v3.6 · en inglés, un texto que se escribe letra por letra se traduce antes (después el traductor ya no lo reconoce, Sammuel 29 oct) */
  if (LANG === 'en' && !el._chars && !el.children.length && !trSkip(el)){ const s = el.textContent, e = trStr(s); if (e !== s) el.textContent = e; }
  const p = new Promise(res => {
    const chars = charify(el), n = chars.length;
    if (!n){ res(); return; }
    if (reduce){ showAll(el); if (onFrame) onFrame(1); res(); return; }
    const caret = document.createElement('i'); caret.className = 'tcaret'; el.appendChild(caret);
    const rate = Math.max(cps, n / max);
    let t0 = null, shown = 0;
    const place = () => {
      const c = chars[Math.max(0, shown - 1)], r = c.getBoundingClientRect(), b = el.getBoundingClientRect();
      const x = shown === 0 ? r.left : r.right;
      caret.style.left = (x - b.left) + 'px'; caret.style.top = (r.top - b.top) + 'px'; caret.style.height = r.height + 'px';
    };
    function step(now){
      if (t0 === null) t0 = now + delay;
      const t = Math.max(0, now - t0) / 1000, ease = Math.min(1, .3 + t * 1.5);
      const target = Math.min(n, Math.floor(t * rate * ease));
      while (shown < target){ const c = chars[shown++]; c.classList.add('on'); if (c._b) c._b.classList.add('sh'); }
      place(); caret.classList.add('on');
      if (onFrame) onFrame(shown / n);
      if (shown < n){ requestAnimationFrame(step); return; }
      caret.classList.remove('on'); setTimeout(() => caret.remove(), 600);
      $$('li,pre,h4', el).forEach(b => b.classList.add('sh'));
      res();
    }
    requestAnimationFrame(step);
  });
  el._typing = p;
  return p;
}
/* muestra todo de golpe (por si se corta una animación) */
function showAll(el){ (el._chars || charify(el)).forEach(c => c.classList.add('on')); $$('li,pre,h4', el).forEach(b => b.classList.add('sh')); $$('.tcaret', el).forEach(c => c.remove()); }

/* ===== llamadas a las IA ===== */
async function getJSON(url, headers){
  let r;
  try{ r = await fetch(url, { headers }); }catch(e){ throw Object.assign(new Error('net'), { net:true }); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error('http'), { status:r.status, data:d });
  return d;
}
function friendly(status, data, p){
  let m = data && data.error ? (data.error.message || data.error) : '';
  if (typeof m !== 'string') m = JSON.stringify(m);
  if (p.id === 'openrouter' && /data policy|guardrail|ZDR|privacy/i.test(m)) return 'OpenRouter bloqueó los modelos gratis por la privacidad de tu cuenta. Entra a openrouter.ai/settings/privacy y activa los modelos gratis (los que pueden guardar datos); apaga «solo ZDR». Luego vuelve a intentarlo.';
  if (status === 401 || status === 403 || (status === 400 && /api key/i.test(m))) return 'La llave de ' + p.name + ' no es válida o no tiene permiso. Revísala y vuelve a pegarla.';
  if (status === 402) return p.id === 'openrouter' ? 'Tu saldo de OpenRouter está en negativo o ese modelo no es gratis. Elige un modelo gratis o cambia a Puter.' : 'Ese modelo necesita crédito en ' + p.name + '. Elige uno marcado como gratis.';
  if (status === 404) return 'Ese modelo no está disponible ahora mismo en ' + p.name + '. Elige otro de la lista.';
  if (status === 429) return p.id === 'openrouter' ? 'Llegaste al límite gratis de OpenRouter: 20 mensajes por minuto y 50 al día (1.000 al día si compraste 10 créditos o más). Espera un poco o cambia a Puter.' : 'Llegaste al límite gratuito de ' + p.name + '. Espera un minuto o elige otra IA.';
  if (status === 408 || status >= 500) return p.name + ' o esa IA están muy ocupadas. Prueba de nuevo en un momento o elige otra.';
  /* lo técnico no se muestra: solo un mensaje corto y entendible */
  const human = m && m.length < 140 && !/[{}<>\[\]]|stack|exception|undefined|null/i.test(m);
  return p.name + ' no pudo responder' + (human ? ': ' + m : ' (código ' + status + ')') + '. Prueba de nuevo o elige otra IA.';
}
const netMsg = p => 'No pude conectar con ' + p.name + '. Revisa tu internet y vuelve a intentarlo. Si usas un bloqueador de anuncios, apágalo para este sitio.';

async function fetchModels(p, key){
  let list = [];
  if (p.kind === 'gemini'){
    const d = await getJSON(p.url + '/models?pageSize=200', { 'x-goog-api-key': key });
    list = (d.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name.replace('models/', '')).filter(n => /^gemini/.test(n) && !/embedding|tts|image|live|audio|robotics|computer/.test(n));
  } else {
    const d = await getJSON(p.url + '/models', key ? { Authorization: 'Bearer ' + key } : undefined);
    let arr = d.data || [];
    if (p.id === 'openrouter') arr = arr.filter(m => /:free$/.test(m.id) || (m.pricing && m.pricing.prompt === '0' && m.pricing.completion === '0'));
    list = arr.map(m => m.id);
    if (p.id === 'groq') list = list.filter(n => !/whisper|guard|tts|playai|orpheus/i.test(n));
    if (p.id === 'mistral') list = list.filter(n => !/embed|moderation|ocr|voxtral|transcri/i.test(n));
  }
  return [...new Set(list)].sort().slice(0, 60);
}
async function refreshModels(p){
  const key = state.keys[p.id];
  if (!key && p.id !== 'openrouter') throw new Error('Pega primero tu llave.');
  try{
    const list = await fetchModels(p, key);
    if (list.length){
      state.models[p.id] = list;
      if (p.id !== 'openrouter' && !list.includes(state.model[p.id])) state.model[p.id] = list.includes(p.models[0]) ? p.models[0] : list[0];
      save();
    }
    return list.length;
  }catch(e){
    throw new Error(e.net ? netMsg(p) : friendly(e.status, e.data, p));
  }
}
async function verify(p){
  if (p.id === 'openrouter' && !state.keys.openrouter){
    if (!window.puter) throw new Error('No pude cargar Puter. Revisa tu internet.');
    try{ if (!puter.auth.isSignedIn()) await puter.auth.signIn({ attempt_temp_user_creation:true }); }catch(e){ throw new Error(e && (e.error === 'popup_blocked' || e.code === 'popup_blocked') ? 'Tu navegador no dejó abrir la ventanita de Puter. Permite las ventanitas de este sitio (el icono al final de la barra de arriba) y vuelve a intentar.' : 'No terminaste de entrar a Puter. Inténtalo otra vez.'); }
    return (await fetchCatalog()).list.length;
  }
  const key = state.keys[p.id];
  if (!key) throw new Error('Pega primero tu llave.');
  if (p.id === 'openrouter'){
    try{ await getJSON(p.url + '/key', { Authorization: 'Bearer ' + key }); }
    catch(e){ throw new Error(e.net ? netMsg(p) : friendly(e.status, e.data, p)); }
  }
  return refreshModels(p);
}
async function ask(p, messages, opts = {}){
  if (/^pu:/.test(String(opts.model || state.model[p.id] || ''))) return askPuter(messages, opts);
  if (p.id === 'openrouter' && !state.keys.openrouter && state.useTeam && SESS && !opts._noTeam) return askStream(p, messages, opts);
  const key = state.keys[p.id];
  const model = String(opts.model || state.model[p.id] || p.models[0]).replace(/^or:/, '');
  if (!key) throw new Error('Falta la llave de ' + p.name + '.');
  let url, headers, body;
  if (p.kind === 'gemini'){
    url = p.url + '/models/' + encodeURIComponent(model) + ':generateContent';
    headers = { 'Content-Type':'application/json', 'x-goog-api-key':key };
    body = { contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts:[{ text:m.content }] })) };
  } else {
    url = p.url + '/chat/completions';
    headers = { 'Content-Type':'application/json', Authorization:'Bearer ' + key };
    body = { model, messages };
    if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  }
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 60000), t0 = performance.now();
  if (opts.signal){ if (opts.signal.aborted) ctl.abort(); else opts.signal.addEventListener('abort', () => ctl.abort(), { once:true }); }
  let res, data;
  try{
    res = await fetch(url, { method:'POST', headers, body:JSON.stringify(body), signal:ctl.signal });
    data = await res.json().catch(() => ({}));
  }catch(e){
    if (opts.signal && opts.signal.aborted) throw Object.assign(new Error('Detenido.'), { aborted:true });
    throw new Error(e && e.name === 'AbortError' ? p.name + ' tardó demasiado en responder. Intenta de nuevo.' : netMsg(p));
  }finally{ clearTimeout(to); }
  if (!res.ok) throw Object.assign(new Error(friendly(res.status, data, p)), { status:res.status, switchTo: p.id === 'openrouter' && (res.status === 429 || res.status === 402) ? 'pu' : null });
  if (data && data.error && !(data.choices && data.choices.length)) throw new Error(friendly(+data.error.code || 502, data, p));
  const ms = performance.now() - t0;
  const inChars = messages.map(m => m.content).join('').length;
  if (p.kind === 'gemini'){
    const text = ((((data.candidates || [])[0] || {}).content || {}).parts || []).map(x => x.text || '').join('') || '(La IA devolvió una respuesta vacía.)';
    const um = data.usageMetadata || {};
    const prompt = um.promptTokenCount || Math.ceil(inChars / 4);
    const tot = um.totalTokenCount || prompt + (um.candidatesTokenCount || est(text));
    return { text, prompt, completion: Math.max(0, tot - prompt), ms, model };
  }
  const msg = ((data.choices || [])[0] || {}).message || {};
  const text = msg.content || '(La IA devolvió una respuesta vacía.)';
  const u = data.usage || {};
  return { text, prompt: u.prompt_tokens != null ? u.prompt_tokens : Math.ceil(inChars / 4), completion: u.completion_tokens != null ? u.completion_tokens : est(text), ms, model };
}
/* SynXCoin's: la moneda de SymphorIA. 1 SynXCoin = 1 token */
const MARK_HTML = LOGO_Z.replace('class="lgz"', 'class="lgz mark"');
const SXC = '<svg class="sxc" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sxg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fb0ff"/><stop offset=".55" stop-color="#c9566c"/><stop offset="1" stop-color="#e6b65f"/></linearGradient></defs><circle cx="12" cy="12" r="10.5" fill="url(#sxg)"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="rgba(11,12,16,.32)" stroke-width="1.1"/><path d="M14.7 9.3c-.5-.8-1.5-1.4-2.8-1.4-1.6 0-2.7.8-2.7 2 0 2.7 5.7 1.4 5.7 4.1 0 1.3-1.2 2.2-2.9 2.2-1.3 0-2.5-.6-3-1.6" transform="translate(-1.4 -1.3)" fill="none" stroke="#0b0c10" stroke-width="1.8" stroke-linecap="round"/><path d="M14.7 14.6l2.4 2.4M17.1 14.6l-2.4 2.4" stroke="#0b0c10" stroke-width="1.35" stroke-linecap="round"/></svg>';
const coins = n => fmt(n);   /* v1.3: ya no existen las monedas; queda solo el número */
const metaOf = r => (r.cached ? 'respuesta guardada · no gastó nada' : 'tardó ' + (r.ms / 1000).toFixed(1).replace('.', ',') + ' s')
  + (r.swap && r.real ? ' · ' + t('ia.swapped', { n:r.real }) : '');   /* v3.7 · si respondió otra IA porque la elegida no estaba (o no ve fotos), se dice */
/* últimos 20 mensajes, siempre empezando por uno del usuario (Gemini y otras APIs lo exigen) */
function history(chat){
  const h = chat.slice(-20).map(m => ({ role:m.role, content:m.content }));
  while (h.length && h[0].role !== 'user') h.shift();
  return h;
}

/* ---------- IA que no funcionan: se esconden para que nadie choque con ellas ----------
   Cada navegador recuerda las que fallaron por culpa del modelo (no de tu llave) y las comparte con SymphorIA.
   Si varias personas reportan la misma, se esconde para todos unas horas; si vuelve a responder, reaparece. */
const BAD_KEY = 'synthz:bad', BAD_MS = 12 * 3600e3;
let BAD = {}; try{ BAD = JSON.parse(localStorage.getItem(BAD_KEY)) || {}; }catch(e){ BAD = {}; }
const saveBad = () => { try{ localStorage.setItem(BAD_KEY, JSON.stringify(BAD)); }catch(e){} };
function isBad(id){ const t = BAD[id]; return !!t && Date.now() - t < BAD_MS; }
/* ¿el error es culpa del modelo? (y no de la llave, el saldo, el límite o la privacidad de la cuenta) */
function modelGone(status, msg){
  msg = String(msg || '');
  if (/data policy|guardrail|ZDR|privacy|api key|unauthor|credit|insufficient|rate.?limit|too many|quota/i.test(msg)) return false;
  return status === 404 || /not a valid model|unavailable for free|no endpoints found|model.{0,20}(not found|does not exist|decommission|deprecat)|model_not_found|no longer (available|supported)/i.test(msg);
}
function markBad(id, share){
  if (!id || /^tr:/.test(id)) return;
  BAD[id] = Date.now(); saveBad();
  if (share !== false) fetch('/api/health', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ id, ok:false }), keepalive:true }).catch(() => {});
}
function markGood(id){
  if (BAD[id]){ delete BAD[id]; saveBad(); }
  try{ const k = 'synthz:good:' + id; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); }catch(e){}
  if (SRV_BAD.has(id)) fetch('/api/health', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ id, ok:true }), keepalive:true }).catch(() => {});
}
const SRV_BAD = new Set();
const badReady = fetch('/api/health').then(r => r.ok ? r.json() : { bad:[] }).then(d => { (d.bad || []).forEach(x => { if (x && typeof x.id === 'string'){ SRV_BAD.add(x.id); if (!BAD[x.id]) BAD[x.id] = +x.t || Date.now(); } }); saveBad(); return SRV_BAD; }).catch(() => SRV_BAD);
const groqName = id => String(id).replace(/^[^/]+\//, '').split(/[-_]/).map(w => /^gpt$/i.test(w) ? 'GPT' : /^oss$/i.test(w) ? 'OSS' : /^\d+(\.\d+)?b$/i.test(w) ? w.toUpperCase() : /^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
/* ===== IA de SymphorIA: modelos gratis compartidos, con un tope diario por persona ===== */
const DEVH = (/^[\w-]{12,48}$/.test(DEV) ? DEV : (String(DEV).replace(/[^\w-]/g, '') + 'synthzdevice').slice(0, 24));
const SZQ = { on:null, used:0, limit:20000, n:0, t:0, guest:null };
function szqSet(o){ Object.assign(SZQ, o); try{ dispatchEvent(new CustomEvent('synthz-szq', { detail:SZQ })); }catch(e){} }
const szHeaders = () => { const h = { 'content-type':'application/json', 'x-sz-device':DEVH }; if (SESS) h.authorization = 'Bearer ' + SESS; return h; };
const SZ_VEND = [[/llama|meta/i, 'meta-llama'], [/gemma|gemini/i, 'google'], [/mistral|mixtral|codestral|ministral|magistral|devstral|pixtral|open-mi/i, 'mistralai'], [/qwen|qwq/i, 'qwen'], [/deepseek/i, 'deepseek'], [/gpt-oss|openai/i, 'openai'], [/kimi|moonshot/i, 'moonshotai'], [/glm|z-ai/i, 'z-ai'], [/nemotron|nvidia/i, 'nvidia'], [/phi-|microsoft/i, 'microsoft'], [/granite|ibm/i, 'ibm'], [/hermes|nous/i, 'nousresearch']];
const szVendor = (mid, prov) => (SZ_VEND.find(([rx]) => rx.test(mid)) || [0, prov])[1];
const SZ_AUTO = { id:'sz:auto', name:'Automática', vendor:'synthz', vlabel:'Elige sola la mejor', ctx:0, free:true, created:4e9, vision:true, reasoning:true, tools:false, desc:'Elige sola la mejor IA que esté libre en este momento. Si una se llena, pasa a otra sin que hagas nada.' };
/* ---------- límite de hoy: se muestra en mensajes (más fácil que contar «tokens») ---------- */
const MSG_TOK = 800;
/* sin cuenta: unos pocos mensajes de prueba al día; luego hay que entrar (gratis) */
/* con sesión guardada (o volviendo de Google) ya cuentas como persona con cuenta, aunque tu cuenta tarde un segundo en cargar */
const signedish = () => !!(ACC && (ACC.ready || ACC.joining || (SESS && !ACC.err)));
const isGuestQ = () => !!(SZQ.guest && !signedish());
const guestFull = () => isGuestQ() && (SZQ.guest.used || 0) >= (SZQ.guest.max || 5);
const limPct = () => Math.max(SZQ.limit ? Math.min(1, (SZQ.used || 0) / SZQ.limit) : 0, isGuestQ() ? Math.min(1, (SZQ.guest.used || 0) / (SZQ.guest.max || 5)) : 0);
const msgsLeft = () => Math.max(0, Math.floor(((SZQ.limit || 25000) - (SZQ.used || 0)) / MSG_TOK));
const msgsTotal = () => Math.max(1, Math.round((SZQ.limit || 25000) / MSG_TOK));
/* v2.4: vuelven las SynXCoin's. 1 SynXCoin = 1 palabra (lo que escribes y lo que te responde). El servidor cuenta en tokens; una palabra son unos 4/3 de token */
const WORD_TOK = 4 / 3;
const coinsOf = tok => Math.max(0, Math.round((+tok || 0) / WORD_TOK));
const coinsLeft = () => coinsOf((SZQ.limit || 25000) - (SZQ.used || 0));
const coinsTotal = () => coinsOf(SZQ.limit || 25000);
const coinsFmt = n => Math.round(n).toLocaleString('es');
const coinsShort = n => n >= 10000 ? (Math.floor(n / 100) / 10).toLocaleString('es') + ' mil' : coinsFmt(n);
/* v3.0 · batería en vez de palabras (Sammuel, 27 oct): el límite del día se ve como una pila que se descarga y se carga a medianoche */
const battPct = () => Math.round((1 - limPct()) * 100);
const coinNote = (mid, r) => /^sz:/.test(String(mid)) && r && !r.cached && ((r.prompt || 0) + (r.completion || 0)) > 0 ? t('enerx.used', { u:Math.max(1, Math.round(((r.prompt || 0) + (r.completion || 0)) / (SZQ.limit || 25000) * 100)), n:battPct() }) : '';
const guestLeft = () => Math.max(0, (SZQ.guest.max || 5) - (SZQ.guest.used || 0));
const limTxt = () => SZQ.on === false ? t('enerx.rest') : guestFull() ? t('enerx.signin') : isGuestQ() ? t('enerx.guestLeft', { n:guestLeft() }) : limPct() >= 1 ? t('enerx.empty') : t('enerx.left', { n:battPct() });
const limShort = () => SZQ.on === false ? t('enerx.restShort') : guestFull() ? t('enerx.signinShort') : isGuestQ() ? t('enerx.guestShort', { n:guestLeft() }) : limPct() >= 1 ? t('enerx.emptyShort') : battPct() + ' %';
const limLvl = () => { const k = limPct(); return k >= 1 ? 'full' : k >= .8 ? 'warn' : 'ok'; };
/* la pila: cuerpo de vidrio, polo y carga que baja; con poca carga se pone ámbar y vacía, coral. size = alto de referencia (antes era el anillo) */
function limRing(size){
  const k = 1 - limPct(), h = size || 22, w = Math.round(h * 1.5), fw = Math.max(k > 0 ? 2 : 0, 27 * k);
  return '<svg class="lring lbatt ' + limLvl() + '" viewBox="0 0 36 24" width="' + w + '" height="' + h + '" aria-hidden="true"><rect x="1.5" y="3.5" width="30" height="17" rx="5" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.55)" stroke-width="1.6"/><rect x="32.6" y="9" width="2.6" height="6" rx="1.3" fill="rgba(255,255,255,.55)"/><rect class="lb-f" x="3.5" y="5.5" width="' + fw.toFixed(1) + '" height="13" rx="3.4" fill="currentColor"/><rect x="3.5" y="5.5" width="26" height="4.5" rx="2.2" fill="#fff" opacity=".18"/></svg>';
}
function limBar(o = {}){
  const k = 1 - limPct();
  return '<div class="lbar ' + limLvl() + '"><div class="lb-h"><b>' + (o.title || t('enerx.today')) + '</b><span>' + limTxt() + '</span></div><div class="lb-t"><i style="transform:scaleX(' + k.toFixed(3) + ')"></i></div>' + (o.small === false ? '' : '<small>' + (isGuestQ() ? t('enerx.guest', { n:SZQ.guest.max || 5 }) + ' ' : '') + t('enerx.small') + (o.puter ? ' ' + t('enerx.puter') : '') + '</small>') + '</div>';
}
/* v3.4 · las IAs conectadas que ven fotos (el servidor usa la misma lista: api/_pool.js VISION_RX). Automática también: con fotos elige sola una que ve */
const SZ_VISION = /gemini|gemma-3(?!n)|llama-4|pixtral|mistral-(small|medium)|[-_/]vl\b|-vl-|vision|qwen2\.5-vl|kimi-vl/i;
async function szCatalog(){
  let r; try{ r = await fetch('/api/ai', { headers:szHeaders() }); }catch(e){ throw Object.assign(new Error('net'), { net:true }); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok){ szqSet({ on:false, t:Date.now() }); return []; }
  const arr = Array.isArray(d.models) ? d.models : [];
  szqSet({ on:arr.length > 0, used:+d.used || 0, limit:+d.limit || 20000, guest:d.guest && d.guest.max ? { used:+d.guest.used || 0, max:+d.guest.max } : null, img:d.img || null, team:!!d.team, alert:!!d.alert, alertN:+d.alertN || 0, n:arr.length, t:Date.now() });
  if (!arr.length) return [];
  const out = arr.filter(m => m && typeof m.id === 'string' && /^sz:/.test(m.id) && !/allam|infron|openrouter\/(free|auto)|models?[-_ ]router/i.test(m.id) && !/free models router|router/i.test(String(m.name || ''))).map(m => {
    const mid = m.id.split(':').slice(2).join(':'), vendor = szVendor(mid, m.prov);
    return { id:m.id, name:String(m.name || mid).replace(/\s*\(free\)\s*$/i, ''), vendor, vlabel:vendorLabel(vendor) + ' · SymphorIA', ctx:num(m.ctx), free:true, created:0, vision:['google', 'groq', 'mistral', 'openrouter'].includes(m.prov) && SZ_VISION.test(mid),
      reasoning:/gpt-oss|qwen3|qwq|r1|reason|think|magistral|kimi|deepseek/i.test(mid), tools:false, desc:'Gratis: no necesitas cuenta ni nada.' };
  });
  return [SZ_AUTO, ...out];
}
/* créditos de Puter: si ya no te quedan, ni lo intento (así Puter no muestra su ventana de «saldo bajo») */
let puC = { t:0, out:false };
async function puterOut(force){
  if (!force && Date.now() - puC.t < 300000) return puC.out;
  try{
    if (!(window.puter && puter.auth && typeof puter.auth.getMonthlyUsage === 'function' && puter.auth.isSignedIn())) return false;
    const u = await Promise.race([puter.auth.getMonthlyUsage(), sleepRaw(2500).then(() => null)]); if (!u) return puC.out;
    const a = u.allowanceInfo || {}, tot = +a.monthUsageAllowance || 0, rem = +a.remaining;
    puC = { t:Date.now(), out:tot > 0 && Number.isFinite(rem) && rem < Math.max(1, tot * .01) };
  }catch(e){ puC = { t:Date.now(), out:puC.out }; }
  return puC.out;
}
const puterSetOut = () => { puC = { t:Date.now(), out:true }; };
let puOutNoted = false;
function puterOutNote(){ if (puOutNoted) return; puOutNoted = true; toast('Usaste el saldo de este mes de Puter: sigo con las IAs conectadas'); telEv('puter_out', ''); try{ dispatchEvent(new CustomEvent('synthz-puter-out')); }catch(e){} }
/* Puter abre su propia ventana de «Low Balance / Upgrade Now»: en SymphorIA no se muestra (pasamos a las IAs conectadas sin cobrar nada) */
(function noPuterUpsell(){
  const RX = /low balance|upgrade now|insufficient funds|out of credits|add credits|top.?up/i;
  const txt = n => { try{ return (n.textContent || '') + ' ' + (n.shadowRoot ? n.shadowRoot.textContent || '' : ''); }catch(e){ return ''; } };
  const STRONG = /low balance|upgrade now/i;
  const check = n => { if (!n || n.nodeType !== 1 || !n.isConnected || n.closest('#szBotP,.szm,#portal')) return; const tag = n.tagName || '', t = txt(n), theirs = /^PUTER|DIALOG/.test(tag) || /puter/i.test(n.id || '') || /puter/i.test(String(n.className || '')); if (STRONG.test(t) || (theirs && RX.test(t))){ n.remove(); puterSetOut(); } };
  const start = () => { try{ new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { check(n); [60, 300, 1200].forEach(t => setTimeout(() => check(n), t)); }))).observe(document.body, { childList:true }); }catch(e){} };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();

/* ===== pulso de SymphorIA: «sigo aquí» cada 3 min y avisos cortos cuando algo falla (sin mensajes ni chats) ===== */
const TEL = { since:Date.now(), msgs:0, errs:0, ai:'', locked:false, last:{} };
const telPage = () => (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
function telEv(kind, detail){
  try{
    const now = Date.now(); if (now - (TEL.last[kind] || 0) < 60000) return; TEL.last[kind] = now;
    if (kind === 'error' || kind === 'jserror') TEL.errs++;
    fetch('/api/health', { method:'POST', headers:szHeaders(), body:JSON.stringify({ action:'ev', kind, page:telPage(), detail:String(detail || '').slice(0, 160) }), keepalive:true }).catch(() => {});
  }catch(e){}
}
let beatT = 0, beatAt = 0;
async function telBeat(){
  clearTimeout(beatT); beatT = setTimeout(telBeat, 180000);
  if (document.hidden) return; beatAt = Date.now();
  try{
    const r = await fetch('/api/health', { method:'POST', headers:szHeaders(), body:JSON.stringify({ action:'beat', page:telPage(), state:{ since:TEL.since, msgs:TEL.msgs, ai:TEL.ai, locked:TEL.locked, mobile:matchMedia('(max-width:760px)').matches, errs:TEL.errs } }) });
    const d = r.ok ? await r.json() : {};
    if (d.help) try{ dispatchEvent(new CustomEvent('synthz-help-ping')); }catch(e){}
  }catch(e){}
}
setTimeout(telBeat, 4000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - beatAt > 170000) telBeat(); });
addEventListener('error', e => { if (!e || !e.message || /ResizeObserver|Script error/i.test(e.message)) return; telEv('jserror', e.message + ' @' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || 0)); });
addEventListener('unhandledrejection', e => { const m = e && e.reason && (e.reason.message || String(e.reason)); if (!m || /abort|Detenido|net|Failed to fetch|NetworkError|load failed/i.test(m)) return; telEv('jserror', 'promesa: ' + m); });
try{ const nv = performance.getEntriesByType('navigation')[0]; if (nv && nv.type === 'reload') setTimeout(() => telEv('reload', 'recargó la página'), 2500); }catch(e){}

/* ===== catálogo de modelos de OpenRouter, en vivo (la lista es pública: no necesita llave) ===== */
const CAT_KEY = 'synthz:catalog-v6';
/* «Qwen: Qwen3 235B (free)» → «Qwen3 235B»: solo el nombre */
/* «OpenAI: GPT-5» → «GPT-5», pero «Deepseek V4 Pro:0813» → «Deepseek V4 Pro 0813» (antes quedaba solo «0813») */
const cleanName = n => String(n || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/^[^:]{1,24}:\s+/, '').replace(/:(?=\S)/g, ' ').replace(/\s+/g, ' ').trim() || String(n || '');
const VENDORS = { 'meta-llama':'Meta', google:'Google', mistralai:'Mistral', openai:'OpenAI', qwen:'Qwen', deepseek:'DeepSeek', nvidia:'NVIDIA', microsoft:'Microsoft', moonshotai:'Moonshot', 'z-ai':'Z.ai', 'x-ai':'xAI', anthropic:'Anthropic', cohere:'Cohere', nousresearch:'Nous', thudm:'THUDM', tngtech:'TNG', minimax:'MiniMax', inception:'Inception', liquid:'Liquid', allenai:'Ai2', ai21:'AI21', amazon:'Amazon', baidu:'Baidu', tencent:'Tencent', bytedance:'ByteDance', 'stepfun-ai':'StepFun', cognitivecomputations:'Cognitive', rekaai:'Reka', arliai:'ArliAI', 'shisa-ai':'Shisa' };
const vendorLabel = v => VENDORS[v] || (v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Otro');
function vendorColor(v){ let h = 0; for (const ch of String(v)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return 'hsl(' + (h % 360) + ' 72% 74%)'; }
function parseModels(data){
  const arr = Array.isArray(data) ? data : (data && data.data) || [];
  const out = [];
  arr.forEach(m => {
    if (!m || typeof m.id !== 'string') return;
    const a = m.architecture || {}, inM = Array.isArray(a.input_modalities) ? a.input_modalities : ['text'], outM = Array.isArray(a.output_modalities) ? a.output_modalities : ['text'];
    if (!outM.includes('text')) return;                       /* el chat es de texto: se omiten los que solo generan imágenes */
    const pr = m.pricing || {};
    const free = /:free$/.test(m.id) || (pr.prompt != null && pr.completion != null && +pr.prompt === 0 && +pr.completion === 0);
    const vendor = m.id.split('/')[0] || 'otro';
    let name = String(m.name || m.id).replace(/\s*\(free\)\s*$/i, '');
    const ci = name.indexOf(': '); if (ci > 0 && ci < 28) name = name.slice(ci + 2);
    const sp = Array.isArray(m.supported_parameters) ? m.supported_parameters : [];
    out.push({ id:m.id, name, vendor, vlabel:vendorLabel(vendor), ctx:num(m.context_length), free, created:num(m.created),
      vision:inM.includes('image'), reasoning:sp.includes('reasoning') || sp.includes('include_reasoning'), tools:sp.includes('tools'),
      desc:String(m.description || '').replace(/\s+/g, ' ').trim().slice(0, 260) });
  });
  return out;
}
function loadCatalog(){
  try{
    const s = JSON.parse(localStorage.getItem(CAT_KEY));
    if (s && Array.isArray(s.list) && s.list.length)
      return { t:num(s.t), list:s.list.filter(m => m && typeof m.id === 'string' && typeof m.name === 'string').map(m => ({ id:m.id, name:m.name, vendor:String(m.vendor || m.id.split('/')[0]), vlabel:String(m.vlabel || vendorLabel(m.vendor)), ctx:num(m.ctx), free:!!m.free, created:num(m.created), vision:!!m.vision, reasoning:!!m.reasoning, tools:!!m.tools, spend:Math.max(0, Math.min(3, num(m.spend))), desc:String(m.desc || '') })) };
  }catch(e){}
  return null;
}
async function fetchCatalog(){
  const pu = async () => {
    if (!window.puter) throw new Error('sin puter');
    const arr = await puter.ai.listModels(), seen = new Set(), out = [];
    (Array.isArray(arr) ? arr : []).forEach(m => {
      if (!m || !m.id || seen.has(m.id) || /image|dall|tts|whisper|embed|moderat|video|sora|imagen|flux|stable|transcri|speech|rerank|lyria|music|audio/i.test(m.id) || /:(batch|flex|priority)$/i.test(m.id)) return;
      seen.add(m.id);
      const vendor = String(m.provider || String(m.id).split('/')[0] || 'otro').replace(/-completion$/, '');
      /* cuánto gasta de tu Puter: según su precio por millón de palabras (input + output) */
      const c = m.cost || {}, per = +c.tokens > 0 ? 1e6 / +c.tokens : 1, price = ((+c.output || 0) * 3 + (+c.input || 0)) / 4 * per;   /* centavos de dólar por millón (más peso a lo que responde) */
      const spend = !c.output && !c.input ? 0 : price <= 120 ? 1 : price <= 1000 ? 2 : 3;
      out.push({ id:'pu:' + m.id, name:String(m.name || m.id), vendor, vlabel:vendorLabel(vendor) + ' · Puter', ctx:num(m.context), free:true, created:0, spend,
        vision:/gpt-4|gpt-5|gemini|claude|vision|pixtral|llava|-vl|grok|llama-4/i.test(m.id), reasoning:/reason|think|r1|o1|o3|o4|gpt-5|gemini-(2\.5|3)|claude|qwq|gpt-oss/i.test(m.id), tools:true, desc:'' });
    });
    if (!out.length) [['gpt-5.4-nano', 'GPT 5.4 Nano', 'openai'], ['gpt-5.6-luna', 'GPT 5.6 Luna', 'openai'], ['gemini-3.5-flash-lite', 'Gemini 3.5 Flash Lite', 'google']].forEach(([id, name, v]) => out.push({ id:'pu:' + id, name, vendor:v, vlabel:vendorLabel(v) + ' · Puter', ctx:0, free:true, created:0, vision:true, reasoning:/gpt-5/.test(id), tools:true, desc:'' }));
    return out;
  };
  const orr = async () => parseModels(await getJSON('https://openrouter.ai/api/v1/models')).filter(m => !/lyria|music|audio/i.test(m.id)).map(m => ({ ...m, id:'or:' + m.id, vlabel:m.vlabel + ' · OpenRouter' }));
  /* Groq: solo si la persona pegó su llave (la lista pide llave) */
  const gq = async () => {
    const k = state.keys.groq; if (!k) return [];
    const d = await getJSON(GROQ_P.url + '/models', { Authorization:'Bearer ' + k });
    return (d.data || []).filter(m => m && m.id && m.active !== false && !/whisper|guard|tts|playai|orpheus|distil|prompt-guard|safeguard|compound/i.test(m.id)).map(m => {
      const vendor = String(m.owned_by || m.id.split('/')[0] || 'groq').toLowerCase().replace(/\s+.*$/, '').replace('meta', 'meta-llama');
      return { id:'gq:' + m.id, name:groqName(m.id), vendor, vlabel:vendorLabel(vendor) + ' · Groq', ctx:num(m.context_window), free:true, created:num(m.created), vision:/vision|llama-4|scout|maverick/i.test(m.id), reasoning:/gpt-oss|qwen3|r1|reason|kimi/i.test(m.id), tools:true, desc:'Muy rápida: corre en los chips de Groq con tu propia llave.' };
    });
  };
  /* beta 2: nadie tiene que pegar llaves. OpenRouter y Groq solo aparecen si ya tenías tu llave (o tu equipo) de antes */
  const legacyOr = false;          /* beta 2: OpenRouter y Groq nunca se muestran a las personas */
  const [s, a, b, g] = await Promise.allSettled([szCatalog(), legacyOr ? orr() : Promise.resolve([]), pu(), Promise.resolve([])]);
  const list = [...(s.status === 'fulfilled' ? s.value : []), ...(g.status === 'fulfilled' ? g.value : []), ...(a.status === 'fulfilled' ? a.value : []), ...(b.status === 'fulfilled' ? b.value : [])].filter(m => !isBad(m.id) && !/allam|infron/i.test(m.id + ' ' + m.vendor + ' ' + m.name)).map(m => Object.assign(m, { name:cleanName(m.name) }));
  if (!list.length) throw Object.assign(new Error('vacío'), ((s.reason && s.reason.net) || (a.reason && a.reason.net)) ? { net:true } : { empty:true });
  const t = Date.now();
  try{ localStorage.setItem(CAT_KEY, JSON.stringify({ t, list })); }catch(e){}
  return { t, list };
}

/* chispas de color: celebran una acción lograda */
function burst(x, y, cols = ['#8fb0ff', '#c9566c', '#ff8f7a', '#f2b36b', '#7fd6b8'], n = 16){
  if (reduce) return;
  for (let i = 0; i < n; i++){
    const s = document.createElement('i');
    s.style.cssText = 'position:fixed;left:0;top:0;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:9995;background:' + cols[i % cols.length];
    document.body.appendChild(s);
    const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 80;
    s.animate([{ transform:'translate(' + x + 'px,' + y + 'px) scale(1)', opacity:1 }, { transform:'translate(' + (x + Math.cos(a) * d) + 'px,' + (y + Math.sin(a) * d + 22) + 'px) scale(.2)', opacity:0 }], { duration:700 + Math.random() * 500, easing:'cubic-bezier(.22,1,.36,1)' }).onfinish = () => s.remove();
  }
}

/* ===== cursor: flecha con viento, vidrio y etiqueta nítida, ahora con movimiento más suave ===== */
let busyOn = false, extraY = 0, curWake = null;
const S = { retarget: () => {}, busy: on => { busyOn = !!on; root.classList.toggle('cursor-busy', busyOn); if (curWake) curWake(); } };
if (matchMedia('(pointer: fine)').matches && CFG.cursor){
  document.body.insertAdjacentHTML('beforeend',
    '<div id="cd"><svg id="ca" viewBox="0 0 22 30" fill="none"><path d="M2.5 2.2V23L8 18.1L11.6 26.4L15.2 24.9L11.7 16.9L19 16.6Z" fill="#0d0e12" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg><svg id="chd" viewBox="0 0 24 28" fill="none" aria-hidden="true"><path d="M9 2.6c1.1 0 2 .9 2 2V12h.6V9.9c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8V12h.5v-1.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8V13h.2c.9 0 1.7.8 1.7 1.7v4.4c0 4.5-3.3 7.8-7.6 7.8h-1.5c-2.4 0-4.4-1.2-5.6-3.2l-4.4-7.2c-.5-.9-.2-2 .7-2.5.8-.5 1.9-.2 2.4.6L7 17V4.6c0-1.1.9-2 2-2z" fill="#0d0e12" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg><i id="cs"><svg viewBox="0 0 24 24"><path d="M6 5.5h12"/><path d="M12 9.5v9M8.5 15l3.5 3.5 3.5-3.5"/></svg></i><i id="cw"></i><i id="ci"></i><i id="cm"><svg viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="13" fill="rgba(13,14,18,.55)" stroke="#fff" stroke-width="1.4"/><path d="M15 5.5l3.2 3.6h-6.4zM15 24.5l3.2-3.6h-6.4z" fill="#fff"/><circle cx="15" cy="15" r="2" fill="#b8c4ff"/></svg></i></div><div id="cr"></div><div id="cl"></div>');
  const cd = $('#cd'), ca = $('#ca'), cr = $('#cr'), cl = $('#cl'), cs = $('#cs');
  const TEXT = 'input:not([type=checkbox]):not([type=file]), textarea, [contenteditable=true]';
  const LINK = 'a[href], button, select, summary, label.ckb, input[type=checkbox], input[type=radio], .chip, [role=tab], [data-hover]';
  /* en toda la web lo que se puede tocar muestra la manita; los switches van sin vidrio encima para que se vea su animación */
  const NOGLASS = '#curChip, #curChip *, .mchip, .mchip *, .cfgsw, .sxsw, [role=switch], .sfb, #szBot, .mi, .mi *, .rcard, .rcard *, input[type=checkbox], label.ckb, .cnv-b, .flowbtn, .flowbtn *';   /* v1.8: «Empezar a FlowIA’r» tiene su propio efecto (la copia de vidrio lo partía en dos y escondía la carita) */   /* v1.4: en la lista de IA el vidrio tapaba «Comparar» y la estrella */
  let px = -100, py = -100, ax = -100, ay = -100, rx = -100, ry = -100, rw = 34, rh = 34, rr = 17;
  let cm = 'idle', hov = null, lblEl = null, lx = 0, ly = 0, down = false, active = false, clT = 0;
  let lastX = ax, lastY2 = ay, vx = 0, vy = 0, ang = 0, angV = 0, sc = 1, fl = performance.now();
  let sv = 0, lastSY = scrollY, wasScroll = false, visT = 1, vis = 1;
  let onBar = false, snap = false, chk = 0, lblSync = null, lw = 0, lh = 0;
  /* ¿el mouse está sobre una barra de desplazamiento? (la de la página o la de una lista) */
  function overBar(e){
    const de = document.documentElement;
    if (e.clientX >= de.clientWidth || e.clientY >= de.clientHeight) return true;
    const n = e.target;
    if (!(n instanceof Element) || n === de || n === document.body) return false;
    if (n.scrollHeight <= n.clientHeight && n.scrollWidth <= n.clientWidth) return false;
    const r = n.getBoundingClientRect(), x = e.clientX - r.left - n.clientLeft, y = e.clientY - r.top - n.clientTop;
    return (x >= n.clientWidth && x < r.width) || (y >= n.clientHeight && y < r.height);
  }
  const toIdle = () => { setHover(null); cm = 'idle'; cr.classList.remove('link', 'txt'); visT = 1; cd.classList.remove('mini'); };

  const PROPS = ['color','fontSize','fontWeight','fontFamily','fontStyle','letterSpacing','lineHeight','display','alignItems','justifyContent','gap','flexDirection','paddingTop','paddingRight','paddingBottom','paddingLeft','width','height','backgroundColor','borderRadius','boxShadow','opacity','textDecorationLine','textDecorationColor','textUnderlineOffset','whiteSpace','textAlign','boxSizing','filter','backgroundImage','backgroundSize','textTransform','overflow','textOverflow','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderTopStyle','borderRightStyle','borderBottomStyle','borderLeftStyle','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','maxWidth','maxHeight','minWidth','flexShrink','flexGrow','flexBasis'];
  function copyStyles(o, c, isRoot){
    const cs = getComputedStyle(o);
    PROPS.forEach(k => { c.style[k] = cs[k]; });
    /* solo la raíz se pone en su sitio dentro del vidrio; las piezas de adentro guardan su posición y márgenes
       (antes todo quedaba «static»: en las tarjetas de usos la SynthonIA se caía fuera de la escena y desaparecía) */
    if (isRoot){ c.style.margin = '0'; c.style.position = 'static'; c.style.transform = 'none'; }
    else ['position','top','right','bottom','left','zIndex','marginTop','marginRight','marginBottom','marginLeft','transform','transformOrigin'].forEach(k => { c.style[k] = cs[k]; });
    c.style.transition = 'none';
    /* las piezas escondidas o puestas encima (p. ej. el numerito de comparar, en escala 0) se copian igual: si no, salía una «bolita blanca» debajo del icono */
    if (!isRoot){
      if ((cs.position === 'absolute' || cs.position === 'fixed') && (/^matrix\(0, 0, 0, 0/.test(cs.transform) || +cs.opacity === 0 || cs.display === 'none')) c.style.display = 'none';
    }
    c.style.animation = 'none'; c.style.pointerEvents = 'none'; c.style.visibility = 'visible'; c.style.translate = 'none';
    if (isRoot){
      ['Top','Right','Bottom','Left'].forEach(s => { c.style['border' + s + 'Width'] = cs['border' + s + 'Width']; c.style['border' + s + 'Style'] = cs['border' + s + 'Style']; });
      c.style.borderColor = 'transparent'; c.style.background = 'transparent'; c.style.boxShadow = 'none';
      c.style.backdropFilter = 'none'; c.style.setProperty('-webkit-backdrop-filter', 'none');
      c.style.backgroundImage = 'none'; c.style.color = cs.color;
    }
    const oc = [...o.children], cc = [...c.children];
    oc.forEach((k, i) => { if (cc[i] && !(k instanceof SVGElement && k.tagName.toLowerCase() !== 'svg')) copyStyles(k, cc[i], false); });
  }
  function buildLabel(el){
    cl.innerHTML = ''; lblEl = el;
    let c;
    if (el.tagName === 'SELECT'){
      c = document.createElement('span'); c.textContent = el.selectedOptions[0] ? el.selectedOptions[0].text : '';
      copyStyles(el, c, true); c.style.overflow = 'hidden'; c.style.textOverflow = 'ellipsis'; c.style.whiteSpace = 'nowrap'; c.style.display = 'flex'; c.style.alignItems = 'center';
    } else {
      c = el.cloneNode(true); c.removeAttribute('id'); c.removeAttribute('href'); c.removeAttribute('target');
      copyStyles(el, c, true);
    }
    const b = el.getBoundingClientRect();
    lw = el.offsetWidth || b.width; lh = el.offsetHeight || b.height;
    c.style.width = lw + 'px'; c.style.height = lh + 'px'; c.style.boxSizing = 'border-box';
    cl.appendChild(c);
    /* el logo de la copia imita al original cuadro a cuadro: mismo tamaño y el péndulo frenando igual */
    const om = el.querySelectorAll('.mark, .mark .sw'), cmk = c.querySelectorAll && c.querySelectorAll('.mark, .mark .sw');
    lblSync = om.length && cmk && cmk.length === om.length ? [...om].map((o, i) => { cmk[i].style.animation = 'none'; cmk[i].style.transition = 'none'; return [o, cmk[i]]; }) : null;
  }
  function setHover(el){
    if (el === hov) return;
    if (hov) hov.classList.remove('cur-hov');
    hov = el; clearTimeout(clT);
    if (!el){ cl.style.opacity = '0'; clT = setTimeout(() => { if (!hov){ cl.innerHTML = ''; lblEl = null; lblSync = null; } }, 280); return; }
    buildLabel(el); el.classList.add('cur-hov'); cl.style.opacity = '1'; lx = ly = 0;
  }
  function pick(t){
    let m = 'idle', h = null, hand = false;
    if (t && t.closest){
      if (t.closest(TEXT)) m = 'text';
      else {
        const l = t.closest(LINK);
        if (l && !l.disabled && !l.closest('.hide')){
          hand = true;
          if (!l.matches(NOGLASS) && !l.closest('#szMaint')){ m = 'link'; h = l; }   /* en el aviso de mantenimiento el vidrio queda debajo y escondía el texto del botón */
          /* el switch se anima solo: sin vidrio ni copia encima */
        }
      }
    }
    cm = m; cr.classList.toggle('txt', m === 'text'); cr.classList.toggle('link', m === 'link');
    visT = m === 'idle' || hand ? 1 : 0; cd.classList.toggle('mini', visT === 0); cd.classList.toggle('hand', hand);
    setHover(h);
  }
  /* en el menú de configuración, la copia nítida se rehace tras el clic para mostrar el estado nuevo */
  addEventListener('click', () => { const el = hov; if (el) [40, 420].forEach(ms => setTimeout(() => { if (hov === el && el.isConnected){ const tr = el.style.transition; el.style.transition = 'none'; el.classList.remove('cur-hov'); buildLabel(el); el.classList.add('cur-hov'); void el.offsetWidth; el.style.transition = tr; } }, ms)); }, true);
  /* si lo que está bajo el cursor termina de aparecer (p. ej. los nombres de la barrita al abrirse), la copia nítida se rehace */
  addEventListener('transitionend', e => {
    const el = hov; if (!el || e.target === el || !el.contains(e.target) || !/opacity|max-width|filter/.test(e.propertyName)) return;
    clearTimeout(el._rb); el._rb = setTimeout(() => { if (hov !== el || !el.isConnected) return; const tr = el.style.transition; el.style.transition = 'none'; el.classList.remove('cur-hov'); buildLabel(el); el.classList.add('cur-hov'); void el.offsetWidth; el.style.transition = tr; }, 30);
  }, true);
  S.retarget = () => { if (active && Math.abs(sv) <= 3 && !root.classList.contains('lock')) pick(document.elementFromPoint(px, py)); };

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    if (!CFG.cursor){ if (active){ active = false; root.classList.remove('cursor-on', 'cursor-bar'); } return; }   /* v1.8: apagado en Ajustes → vuelve el cursor normal al instante */
    if (down && !e.buttons) down = false;                 /* soltaste el botón donde la página no lo vio */
    if (!active){ active = true; ax = rx = lastX = e.clientX; ay = ry = lastY2 = e.clientY; root.classList.add('cursor-on'); }
    px = e.clientX; py = e.clientY;
    /* sobre una barra de desplazamiento o un recuadro de otra página se ve el cursor normal, sin el de SymphorIA encima */
    const bar = overBar(e) || (e.target instanceof Element && e.target.tagName === 'IFRAME');
    if (bar !== onBar){ onBar = bar; root.classList.toggle('cursor-bar', bar); if (!bar) snap = true; }
    if (snap){ snap = false; ax = rx = lastX = px; ay = ry = lastY2 = py; vx = vy = angV = 0; }
    if (bar){ if (cm !== 'idle') toIdle(); return; }
    pick(e.target instanceof Element ? e.target : null);
  }, { passive:true });
  /* si arrastras algo (un archivo, un texto) el cursor te sigue igual */
  addEventListener('dragover', e => { if (e.clientX || e.clientY){ px = e.clientX; py = e.clientY; } }, { passive:true });
  addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    if (overBar(e)){                                      /* agarraste la barra: nada de golpe ni de cursor encogido */
      snap = true; onBar = true; root.classList.add('cursor-bar'); toIdle();
      ssStop(e.clientX >= document.documentElement.clientWidth || e.clientY >= document.documentElement.clientHeight ? document.scrollingElement : e.target);
      return;
    }
    down = true;
    const r = document.createElement('div'); r.className = 'rip'; document.body.appendChild(r);
    const T = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
    r.animate([{ transform: T + ' scale(1)', opacity: .7 }, { transform: T + ' scale(7)', opacity: 0 }], { duration: 750, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => r.remove();
  });
  const release = () => { down = false; };
  addEventListener('pointerup', release); addEventListener('mouseup', release); addEventListener('pointercancel', release); addEventListener('dragend', release);
  addEventListener('blur', () => { release(); snap = true; });
  root.addEventListener('mouseleave', () => { root.classList.add('cursor-hide'); snap = true; });
  root.addEventListener('mouseenter', () => root.classList.remove('cursor-hide'));

  /* todos los suavizados dependen del tiempo, así que se sienten igual a 60 o a 144 Hz */
  const ease = (k, dt) => 1 - Math.pow(1 - k, dt);
  (function frame(now){
    /* v2.3: si lo que tenía el vidrio se rehizo en el DOM (p. ej. la IA de la caja al elegir otra), se suelta la copia vieja y se busca lo que hay debajo */
    if (hov && !hov.isConnected){ cl.style.opacity = '0'; cl.innerHTML = ''; lblEl = null; lblSync = null; hov = null; pick(document.elementFromPoint(px, py)); }
    const dt = Math.min(2.5, (now - fl) / 16.67 || 1); fl = now;
    /* la flecha va un poco detrás del mouse real y llega con suavidad */
    const nx = ax + (px - ax) * ease(.34, dt), ny = ay + (py - ay) * ease(.34, dt);
    vx += (((nx - lastX) / dt) - vx) * ease(.3, dt); vy += (((ny - lastY2) / dt) - vy) * ease(.3, dt);
    lastX = ax = nx; lastY2 = ay = ny;
    const target = clamp(vx * 1.05 - vy * .3 + 2, -42, 42);
    angV += (-(ang - target) * .085 - angV * .17) * dt;
    ang += angV * dt;
    const speed = Math.hypot(vx, vy);
    /* scroll: la flecha se estira y una flecha de luz marca hacia dónde baja la página; el vidrio se suelta mientras se desplaza */
    const sy = scrollY + extraY; sv += (((sy - lastSY) / dt) - sv) * ease(.18, dt); lastSY = sy;
    const sa = clamp(Math.abs(sv) / 26, 0, 1), scr = Math.abs(sv) > 3;
    cs.style.opacity = sa.toFixed(2);
    cs.style.transform = 'translate(0,' + (Math.sign(sv) * (22 + sa * 14)).toFixed(1) + 'px) rotate(' + (sv < 0 ? 180 : 0) + 'deg) scale(' + (.7 + sa * .5).toFixed(2) + ')';
    if (scr && cm !== 'idle') toIdle();
    if (wasScroll && !scr) S.retarget();
    wasScroll = scr;
    /* cada pocos cuadros revisa qué hay de verdad bajo el mouse: si algo se movió, apareció una ventana o el botón se fue, el vidrio lo suelta */
    if (active && !scr && !down && !onBar && ++chk % 8 === 0) pick(document.elementFromPoint(px, py));
    sc += ((down ? .86 : 1) - sc) * ease(.25, dt); vis += ((busyOn ? 0 : visT) - vis) * ease(.22, dt); ca.style.opacity = vis.toFixed(2);
    ca.style.transform = 'rotate(' + ang.toFixed(2) + 'deg) scale(' + (sc * vis).toFixed(3) + ') scaleY(' + (1 + sa * .2).toFixed(3) + ')';
    cd.style.transform = 'translate3d(' + ax.toFixed(2) + 'px,' + ay.toFixed(2) + 'px,0)';

    /* vidrio que abraza el elemento, con un deslizamiento más lento y sedoso */
    let tgx = px, tgy = py, tw = 34, th = 34, tr = 17, ox = 0, oy = 0;
    if (cm === 'text'){ tw = 3; th = 24; tr = 2; }
    else if (cm === 'link' && hov && hov.isConnected){
      const b = hov.getBoundingClientRect(), pad = 7, cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      if (px < b.left - 3 || px > b.right + 3 || py < b.top - 3 || py > b.bottom + 3){ pick(document.elementFromPoint(px, py)); requestAnimationFrame(frame); return; }
      ox = clamp((px - cx) * .12, -7, 7); oy = clamp((py - cy) * .18, -5, 5);
      tgx = cx + ox; tgy = cy + oy; tw = b.width + pad * 2; th = b.height + pad * 2;
      const br = parseFloat(getComputedStyle(hov).borderRadius) || 0; tr = Math.min(Math.max(br + pad, 12), th / 2);
    } else if (cm === 'link' && hov && !hov.isConnected) toIdle();
    const k = ease(cm === 'idle' ? .17 : .15, dt), ks = ease(.14, dt);
    rx += (tgx - rx) * k; ry += (tgy - ry) * k; rw += (tw - rw) * ks; rh += (th - rh) * ks; rr += (tr - rr) * ks;
    cr.style.width = rw.toFixed(2) + 'px'; cr.style.height = rh.toFixed(2) + 'px'; cr.style.borderRadius = rr.toFixed(2) + 'px';
    cr.style.transform = 'translate3d(' + (rx - rw / 2).toFixed(2) + 'px,' + (ry - rh / 2).toFixed(2) + 'px,0) scale(' + (down ? .94 : 1) + ')';
    /* etiqueta nítida encima del vidrio */
    lx += (ox - lx) * ease(.2, dt); ly += (oy - ly) * ease(.2, dt);
    if (lblEl && lblEl.isConnected){
      const b = lblEl.getBoundingClientRect(), sx = lw ? b.width / lw : 1, sy2 = lh ? b.height / lh : 1;
      cl.style.transform = 'translate3d(' + (b.left + lx).toFixed(2) + 'px,' + (b.top + ly).toFixed(2) + 'px,0)' + (Math.abs(sx - 1) > .002 || Math.abs(sy2 - 1) > .002 ? ' scale(' + sx.toFixed(4) + ',' + sy2.toFixed(4) + ')' : '');
      if (lblSync) for (const [o, k] of lblSync) k.style.transform = getComputedStyle(o).transform;
    }
    /* v2.9: con el mouse quieto y todo en su lugar, el ciclo se duerme (antes dibujaba 60 veces por segundo sin cambiar nada);
       se despierta con cualquier movimiento, scroll, clic o tecla */
    const still = !down && !scr && Math.abs(px - ax) < .05 && Math.abs(py - ay) < .05 && Math.abs(angV) < .005 && Math.abs(ang - target) < .05
      && Math.abs(sv) < .02 && Math.abs(tgx - rx) < .05 && Math.abs(tgy - ry) < .05 && Math.abs(tw - rw) < .05 && Math.abs(th - rh) < .05
      && Math.abs(((busyOn ? 0 : visT)) - vis) < .003 && Math.abs((down ? .86 : 1) - sc) < .002 && Math.abs(ox - lx) < .05 && Math.abs(oy - ly) < .05;
    if (still && !lblSync){ curWake = () => { curWake = null; fl = performance.now(); requestAnimationFrame(frame); }; return; }
    requestAnimationFrame(frame);
  })(performance.now());
  ['pointermove', 'pointerdown', 'pointerup', 'wheel', 'scroll', 'keydown', 'resize'].forEach(t => addEventListener(t, () => { if (curWake) curWake(); }, { passive:true, capture:true }));
}


/* ---------- v2: escritura con brillo, golpe de cristal, portal Z y agua ---------- */
function mirrorType(ta){
  if (!ta || ta._sync || reduce) return;
  const fld = ta.closest('.field'); if (!fld) return;
  const m = document.createElement('div'); m.className = 'mir'; m.setAttribute('aria-hidden', 'true');
  fld.classList.add('mw'); fld.insertBefore(m, ta);
  /* v1.3: el dueño prefirió la rayita normal del navegador (la propia se quitó) */
  let prev = '', kind = '';
  let cssOk = false;   /* v2.3: copiar el estilo de la caja solo cuando cambia (antes, en cada letra: frenaba el celular) */
  const css = () => { if (cssOk) return; cssOk = true; const c = getComputedStyle(ta); ['font', 'padding', 'lineHeight', 'letterSpacing', 'textIndent', 'tabSize'].forEach(k => { m.style[k] = c[k]; }); };
  const spans = s => [...s].map((ch, i) => '<span class="nw" style="animation-delay:' + Math.min(i * 12, 420) + 'ms">' + esc(ch) + '</span>').join('');
  /* dónde queda la letra número «off» dentro del espejo */
  function rectAt(off){
    const w = document.createTreeWalker(m, NodeFilter.SHOW_TEXT); let n, left = off;
    while ((n = w.nextNode())){
      const L = n.nodeValue.length;
      if (left <= L && !(left === L && n.nodeValue !== '​' && w.nextNode && false)){
        const r = document.createRange();
        if (left < L){ r.setStart(n, left); r.setEnd(n, left + 1); const rs = r.getClientRects(); if (rs.length) return { x:rs[0].left, y:rs[0].top, h:rs[0].height }; }
        if (left > 0){ r.setStart(n, left - 1); r.setEnd(n, left); const rs = r.getClientRects(); if (rs.length){ const q = rs[rs.length - 1]; return { x:q.right, y:q.top, h:q.height }; } }
      }
      left -= L; if (left < 0) break;
    }
    const fr = m.getBoundingClientRect(), c = getComputedStyle(ta);
    return { x:fr.left + parseFloat(c.paddingLeft), y:fr.top + parseFloat(c.paddingTop), h:parseFloat(c.lineHeight) || 20 };
  }
  function placeCaret(){}
  /* al borrar: las letras se desprenden, flotan y se desvanecen */
  function ghosts(txt, from){
    if (!txt || root.classList.contains('noanim')) return;
    const fr = fld.getBoundingClientRect(), list = [...txt].slice(-36);
    list.forEach((ch, i) => {
      if (!ch.trim()) return;
      const p = rectAt(from + (txt.length - list.length) + i), g = document.createElement('span');
      g.className = 'mghost'; g.textContent = ch; g.style.font = getComputedStyle(ta).font;
      g.style.left = (p.x - fr.left) + 'px'; g.style.top = (p.y - fr.top) + 'px'; fld.appendChild(g);
      const dx = (Math.random() - .5) * 26, rot = (Math.random() - .5) * 50, d = Math.min(i, 20) * 14;
      g.animate([{ transform:'translate(0,0) rotate(0)', opacity:1, filter:'blur(0)', color:'#ecebe7' }, { transform:'translate(' + (dx * .4) + 'px,-6px) rotate(' + (rot * .3) + 'deg) scale(1.15)', opacity:1, color:'#ff8f7a', offset:.25 }, { transform:'translate(' + dx + 'px,-26px) rotate(' + rot + 'deg) scale(.4)', opacity:0, filter:'blur(4px)', color:'#c9566c' }], { duration:620, delay:d, easing:'cubic-bezier(.22,1,.36,1)', fill:'both' }).onfinish = () => g.remove();
    });
  }
  const sync = () => {
    const v = ta.value;
    if (v === prev){ m.scrollTop = ta.scrollTop; placeCaret(false); return; }
    css();
    let a = 0; while (a < prev.length && a < v.length && prev[a] === v[a]) a++;
    let b = 0; while (b < prev.length - a && b < v.length - a && prev[prev.length - 1 - b] === v[v.length - 1 - b]) b++;
    const mid = v.slice(a, v.length - b), gone = prev.slice(a, prev.length - b);
    if (gone && /^delete/.test(kind)) ghosts(gone, a);
    if (b === 0 && a === prev.length && m.lastChild && m.lastChild.nodeType === 3 && prev){
      const t = document.createElement('template'); t.innerHTML = spans(mid); m.insertBefore(t.content, m.lastChild);
    } else {
      m.innerHTML = esc(v.slice(0, a)) + spans(mid) + esc(v.slice(v.length - b));
      m.appendChild(document.createTextNode('​'));
    }
    prev = v; m.scrollTop = ta.scrollTop; kind = '';
    placeCaret(mid.length > 0 && mid.length < 4);
    /* cuando terminan las animaciones, el espejo vuelve a ser texto normal (corta las palabras igual que la caja) */
    clearTimeout(m._n); m._n = setTimeout(() => { if (ta.value === prev && m.querySelector('.nw')){ m.textContent = prev; m.appendChild(document.createTextNode('\u200b')); m.scrollTop = ta.scrollTop; placeCaret(false); } }, 900);
  };
  ta._sync = sync;
  ta.addEventListener('beforeinput', e => { kind = e.inputType || ''; });
  ta.addEventListener('input', sync);
  ta.addEventListener('scroll', () => { m.scrollTop = ta.scrollTop; placeCaret(false); });
  ['focus', 'click', 'keyup', 'select'].forEach(ev => ta.addEventListener(ev, () => requestAnimationFrame(() => placeCaret(false))));
  /* (sin rayita propia) */
  document.addEventListener('selectionchange', () => { if (document.activeElement === ta) placeCaret(false); });
  addEventListener('resize', () => { cssOk = false; placeCaret(false); });
  ta.addEventListener('focus', () => { cssOk = false; });
  m.appendChild(document.createTextNode('​')); sync();
}
/* golpe suave de cristal: como el clic del mouse pero más lento, con un aro de luz que se abre.
   v2.6: el aro ya no desenfoca lo de atrás ni crece a toda la pantalla (eso trababa la página 3 segundos en cada clic) */
function thud(x, y){
  if (reduce || !CFG.glass) return;   /* v2.3: sin vidrio (celulares) no hay golpe de cristal */
  const base = 'position:fixed;left:' + x + 'px;top:' + y + 'px;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;pointer-events:none;will-change:transform,opacity;';
  const g = document.createElement('i');
  g.style.cssText = base + 'z-index:9989;background:radial-gradient(circle,rgba(214,204,255,.5),rgba(143,176,255,.22) 36%,rgba(255,143,122,.08) 56%,transparent 70%)';
  const r = document.createElement('i');
  r.style.cssText = base + 'z-index:9990;border:1.5px solid rgba(255,255,255,.55);box-shadow:0 0 12px rgba(160,180,255,.45),inset 0 0 10px rgba(255,255,255,.25)';
  document.body.append(g, r);
  g.animate([{ transform:'scale(.2)', opacity:0 }, { transform:'scale(2.6)', opacity:1, offset:.2 }, { transform:'scale(5)', opacity:0 }], { duration:1100, easing:'cubic-bezier(.16,.8,.3,1)', fill:'both' }).onfinish = () => g.remove();
  r.animate([{ transform:'scale(.3)', opacity:0 }, { transform:'scale(1.2)', opacity:1, offset:.15 }, { transform:'scale(4.2)', opacity:0 }], { duration:1300, easing:'cubic-bezier(.16,.8,.3,1)', fill:'both' }).onfinish = () => r.remove();
}
/* portal: la Z carga, se hace zoom hacia adentro y se entra al chat */
const zoomK = () => Math.hypot(innerWidth, innerHeight) / 2 / ((132 / 48) * 4.7) * 1.12;
const portalPaint = (p, k) => p.setAttribute('transform', 'translate(24 24) scale(' + k.toFixed(3) + ') translate(-24 -24)');
function zBox(host){
  const w = document.createElement('div'); w.className = 'pz';
  w.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="' + Z_PATH + '" fill="url(#zgrad)"/></svg>';
  host.appendChild(w); return { w, p: w.querySelector('path') };
}
function portalFill(host){ const z = zBox(host); portalPaint(z.p, zoomK()); return z.p; }
function portalReveal(p){
  if (!p) return; const K = zoomK(), t0 = performance.now(), D = 950;
  (function f(now){ const e = Math.min(1, (now - t0) / D); portalPaint(p, K * Math.pow(2.4, e)); if (e < 1) requestAnimationFrame(f); })(t0);
}
/* v2.8 · el portal nuevo, con los logos de ahora (pedido de Sammuel: «sorpréndeme»):
   ida:    «SymphorIA» sale de su esquina y llega al centro → la S de vidrio gira y se vuelve el orbe de SynthFlow,
           «mphorIA» se borra y aparece «nthFlow» letra por letra (v3.0: Sy-mphorIA → Sy-nthFlow) → la «o» de «Flow» late y la cámara entra por su hueco
           (y en el chat se abre en círculo)
   vuelta: sales por la «o», el orbe vuelve a ser la S y «SymphorIA» vuelve a su esquina.
   v2.9: sin SynthonIA (Sammuel: el portal queda mejor solo con los logos).
   Todo es transform y opacidad (va fluido en celulares); mientras dura, la página no se puede tocar. */
let lockOff = null;
function portalLock(on){
  if (lockOff){ lockOff(); lockOff = null; }
  if (!on) return;
  const stop = e => { if (e.key === 'F5' || (e.key === 'r' && (e.ctrlKey || e.metaKey))) return; e.preventDefault(); e.stopPropagation(); };
  const ev = ['keydown', 'keypress', 'wheel', 'touchmove', 'mousedown', 'click', 'pointerdown'];
  ev.forEach(t => addEventListener(t, stop, { capture:true, passive:false }));
  lockOff = () => ev.forEach(t => removeEventListener(t, stop, { capture:true }));
}
const PE = 'cubic-bezier(.65,0,.35,1)', PEO = 'cubic-bezier(.22,1,.36,1)', PSPR = 'cubic-bezier(.34,1.56,.64,1)';
/* los mismos cuadros al revés (para la vuelta) */
const pRev = K => [...K].reverse().map(k => k.offset == null ? k : Object.assign({}, k, { offset:1 - k.offset }));
const pAnim = (el, kf, o) => el.animate(kf, Object.assign({ fill:'forwards', easing:PE }, o)).finished.catch(() => {});
function portalStage(){
  const o = document.createElement('div'); o.id = 'portal'; o.className = 'szportal p8';
  o.innerHTML = '<i class="p8-bg"></i><i class="p8-ring"></i><i class="p8-flash"></i>'
    + '<div class="p8-w"><span class="p8-mk"><img class="p8-z" src="media/v30/symphoria.svg" alt="" draggable="false">' + flowOrb('p8-orb') + '</span>'
    + '<span class="p8-t zw"><span class="p8-sy">Sy</span><span class="p8-zl">mphor<span class="zt">IA</span></span><span class="p8-fl">' + [...'nthFlow'].map((c, i) => '<i style="--i:' + i + '">' + c + '</i>').join('') + '</span></span></div>';
  document.body.appendChild(o);
  const q = c => o.querySelector(c);
  return { o, BG:q('.p8-bg'), RING:q('.p8-ring'), FL:q('.p8-flash'), W:q('.p8-w'), MK:q('.p8-mk'), Z:q('.p8-z'), ORB:q('.p8-orb'), T:q('.p8-t'), ZL:q('.p8-zl'), FW:q('.p8-fl') };
}
/* dónde está el logo de la esquina (para salir de ahí y volver ahí) */
/* el rectángulo donde de verdad se ve una imagen con object-fit:contain (sin el aire de los lados) */
function fitBox(img){
  const r = img.getBoundingClientRect(), nw = img.naturalWidth || 1, nh = img.naturalHeight || 1, k = Math.min(r.width / nw, r.height / nh);
  return { x:r.left + r.width / 2, y:r.top + r.height / 2, w:nw * k, h:nh * k };
}
/* dónde está el logo de la esquina y cómo es: tamaño de la Z, de la letra y el espacio entre ambas
   (el portal copia esas medidas para que el «SymphorIA» que viaja calce justo encima del de la esquina) */
function logoRect(){
  const n = document.querySelector('#nav .logo');
  if (n && n.getClientRects().length){
    const r = n.getBoundingClientRect(), m = n.querySelector('.mark'), wd = n.querySelector('.word');
    if (r.width){
      const o = { x:r.left, y:r.top, w:r.width, h:r.height };
      if (m && wd && m.naturalWidth){
        const tx = wd.querySelector('.zw') || wd, a = fitBox(m), b = tx.getBoundingClientRect(), cs = getComputedStyle(tx);
        Object.assign(o, { mx:a.x, my:a.y, mw:a.w, mh:a.h, gap:b.left - (a.x + a.w / 2), fs:parseFloat(cs.fontSize) || 0, fw:cs.fontWeight, ls:parseFloat(cs.letterSpacing) || 0 });
      }
      return o;
    }
  }
  try{ const s = JSON.parse(sessionStorage.getItem('synthz:logo') || 'null'); if (s && s.h) return s; }catch(e){}
  return { x:innerWidth < 600 ? 30 : 70, y:innerWidth < 600 ? 22 : 26, w:150, h:40 };
}
/* el «SymphorIA» del portal toma las proporciones del logo de la esquina (Z, letra, espacio, grosor) */
function fitPortal(P, R){
  if (!R.fs) return;
  const tf = parseFloat(getComputedStyle(P.T).fontSize), k = tf / R.fs;
  P.MK.style.width = (R.mw * k).toFixed(1) + 'px'; P.MK.style.height = (R.mh * k).toFixed(1) + 'px';
  P.W.style.gap = Math.max(0, R.gap * k).toFixed(1) + 'px';
  P.T.style.fontWeight = R.fw; P.T.style.letterSpacing = (R.ls / R.fs).toFixed(3) + 'em';
}
/* la palabra entera viaja entre la esquina y el centro (FLIP): la Z del portal cae justo sobre la Z de la esquina */
function flyWord(P, toCorner, D){
  const R = logoRect(), r = P.W.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let s = R.h / r.height, dx = R.x + R.w / 2 - cx, dy = R.y + R.h / 2 - cy;
  if (R.fs){
    const m = fitBox(P.Z), tf = parseFloat(getComputedStyle(P.T).fontSize);
    s = R.fs / tf; dx = R.mx - cx - (m.x - cx) * s; dy = R.my - cy - (m.y - cy) * s;
  }
  const corner = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
  return pAnim(P.W, toCorner ? [{ transform:'none' }, { transform:corner }] : [{ transform:corner }, { transform:'none' }], { duration:D, easing:PE });
}
/* la Z de vidrio gira y se vuelve el orbe; la «Z» se borra y «Flow» se escribe (o al revés) */
function morph(P, toFlow, D){
  P.o.classList.toggle('flow', toFlow);
  const zOut = [{ transform:'none', opacity:1 }, { transform:'rotate(-200deg) scale(.15)', opacity:0 }];
  const oIn = [{ transform:'rotate(160deg) scale(.1)', opacity:0 }, { transform:'none', opacity:1 }];
  return Promise.all([
    pAnim(P.Z, toFlow ? zOut : pRev(zOut), { duration:D * .7, easing:toFlow ? 'cubic-bezier(.5,0,.75,0)' : PSPR, delay:toFlow ? 0 : D * .3 }),
    pAnim(P.ORB, toFlow ? oIn : pRev(oIn), { duration:D * .75, easing:toFlow ? PSPR : 'cubic-bezier(.5,0,.75,0)', delay:toFlow ? D * .25 : 0 })
  ]);
}
const pSleep = ms => new Promise(r => setTimeout(r, ms));
/* el hueco de la «o» de «Flow»: centro y ancho reales del agujero (con las medidas de la letra, no de su cajita) */
let pMeas = null;
function oSpot(P){
  const o = [...P.FW.children].find(x => x.textContent === 'o'), r = o.getBoundingClientRect(), cs = getComputedStyle(o);
  const x = (pMeas = pMeas || document.createElement('canvas').getContext('2d'));
  x.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
  const m = x.measureText('o'), fa = m.fontBoundingBoxAscent || parseFloat(cs.fontSize) * .9, fd = m.fontBoundingBoxDescent || parseFloat(cs.fontSize) * .22;
  const base = r.top + (r.height - (fa + fd)) / 2 + fa, asc = m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * .52;
  const ls = parseFloat(cs.letterSpacing) || 0, gw = m.width || r.width;
  return { x:r.left + (r.width - ls) / 2, y:base - asc / 2 + (m.actualBoundingBoxDescent || 0) / 2, hole:Math.max(4, gw * .4), el:o };
}
/* v2.9: la «o» de «Flow» late y suelta un anillo de luz (por ahí entra la cámara, como antes) */
function orbPulse(P){
  P.FW.style.overflow = 'visible';      /* «Flow» ya está escrito: el latido y el brillo de la «o» no se recortan */
  const s = oSpot(P);
  s.el.animate([{ transform:'none', filter:'none' }, { transform:'scale(1.22)', filter:'drop-shadow(0 0 10px rgba(255,255,255,.85))' }, { transform:'none', filter:'none' }], { duration:560, easing:PSPR });
  P.RING.style.left = s.x + 'px'; P.RING.style.top = s.y + 'px';
  P.RING.animate([{ transform:'translate(-50%,-50%) scale(.3)', opacity:.9 }, { transform:'translate(-50%,-50%) scale(9)', opacity:0 }], { duration:900, easing:'cubic-bezier(.2,.8,.2,1)' });
}
/* la cámara entra (o sale) por el hueco de la «o» de «Flow»: la letra crece hasta que su agujero tapa la pantalla */
function dive(P, into, D){
  P.FW.style.overflow = 'visible';
  const s = oSpot(P), K = Math.hypot(innerWidth, innerHeight) / s.hole * 1.15;
  const tx = innerWidth / 2 - s.x, ty = innerHeight / 2 - s.y;
  P.W.style.transformOrigin = (s.x - P.W.getBoundingClientRect().left).toFixed(1) + 'px ' + (s.y - P.W.getBoundingClientRect().top).toFixed(1) + 'px';
  P.o.classList.add('diving');
  const kw = [{ transform:'none' }, { transform:'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + K.toFixed(2) + ')' }];
  return Promise.all([
    pAnim(P.W, into ? kw : pRev(kw), { duration:D, easing:into ? 'cubic-bezier(.7,0,.84,0)' : 'cubic-bezier(.16,1,.3,1)' }),
    pAnim(P.FL, into ? [{ opacity:0 }, { opacity:0, offset:.7 }, { opacity:1 }] : [{ opacity:1 }, { opacity:0, offset:.3 }, { opacity:0 }], { duration:D, easing:'linear' })
  ]);
}
/* v1.8: con «Animaciones» apagado no hay película: un fundido corto y listo (los logos siempre se ven) */
function quickGo(href, back){
  if (document.getElementById('portal')) return;
  try{ sessionStorage.setItem(back ? 'synthz:back' : 'synthz:portal', 'fade'); }catch(e){}
  const v = document.createElement('div'); v.id = 'portal'; v.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#0b0820;opacity:0;transition:opacity .18s ease';
  document.body.appendChild(v); requestAnimationFrame(() => { v.style.opacity = '1'; });
  setTimeout(() => { location.href = href; }, 200);
}
const pReady = P => Promise.race([Promise.all([P.Z.decode ? P.Z.decode().catch(() => {}) : 0, document.fonts ? document.fonts.ready : 0]), pSleep(1200)]);
async function portalOut(href){
  if (document.getElementById('portal')) return;
  if (reduce && !(typeof EV !== 'undefined' && EV.pending())) return quickGo(href, false);
  let gone = false; const go = () => { if (gone) return; gone = true; location.href = href; };
  root.classList.add('leaving'); S.busy(true); portalLock(true); setTimeout(go, 12000);
  try{ const R = logoRect(); sessionStorage.setItem('synthz:logo', JSON.stringify(R)); }catch(e){}
  try{ sessionStorage.setItem('synthz:portal', 'o'); }catch(e){}
  try{
    const P = portalStage(), nav = document.querySelector('#nav .logo');
    await pReady(P); fitPortal(P, logoRect()); await new Promise(r => requestAnimationFrame(r));
    /* 1 · «SymphorIA» sale de su esquina y llega al centro, mientras cae la noche */
    if (nav) nav.style.visibility = 'hidden';
    pAnim(P.BG, [{ opacity:0 }, { opacity:1 }], { duration:800, easing:'ease-out' });
    await flyWord(P, false, 950);
    /* evento especial: en vez del portal normal, la página «se reprograma» y luego carga el chat */
    const evn = typeof EV !== 'undefined' && EV.pending();
    if (evn){ await EV.play(evn); portalLock(true); go(); return; }
    /* 2 · la Z gira y se vuelve el orbe de SynthFlow; «Flow» se escribe */
    try{ SND.shimmer(); }catch(e){}
    await morph(P, true, 900);
    /* 3 · la «o» de «Flow» late una vez y suelta su anillo de luz */
    await pSleep(260); orbPulse(P);
    await pSleep(440);
    /* 4 · la cámara entra por el hueco de la «o» (Sammuel: el zoom va en la O, como siempre) */
    try{ SND.warp(); }catch(e){}
    await dive(P, true, 1000);
    go();
  }catch(e){
    console.error('[synthz] portal', e && e.message);
    const p = document.getElementById('portal'); if (p){ p.style.background = '#0b0820'; p.style.opacity = '1'; }
    setTimeout(go, 200);
  }
}
/* de vuelta a SymphorIA: la misma película al revés */
async function portalBack(href){
  if (document.getElementById('portal')) return;
  if (reduce) return quickGo(href, true);
  let gone = false; const go = () => { if (gone) return; gone = true; location.href = href; };
  S.busy(true); portalLock(true); setTimeout(go, 12000);
  try{ sessionStorage.setItem('synthz:back', 'o'); }catch(e){}
  try{
    const P = portalStage();
    P.o.classList.add('flow', 'start'); P.Z.style.opacity = '0'; P.ORB.style.opacity = '1';
    await pReady(P); fitPortal(P, logoRect()); await new Promise(r => requestAnimationFrame(r));
    P.BG.style.opacity = '1';
    /* 1 · sales por el hueco de la «o» */
    try{ SND.warp(); }catch(e){}
    pAnim(P.o, [{ opacity:0 }, { opacity:1 }], { duration:280, easing:'ease-out' });
    await dive(P, false, 950);
    P.o.classList.remove('diving'); P.W.style.transformOrigin = '';
    /* 2 · la «o» late al salir */
    orbPulse(P); await pSleep(420);
    /* 3 · el orbe vuelve a ser la Z; se borra «Flow» y vuelve la «Z» */
    try{ SND.shimmer(); }catch(e){}
    await morph(P, false, 900);
    await pSleep(150);
    /* 4 · «SymphorIA» vuelve a su esquina */
    pAnim(P.BG, [{ opacity:1 }, { opacity:.92 }], { duration:800 });
    await flyWord(P, true, 900);
    go();
  }catch(e){
    console.error('[synthz] portal', e && e.message);
    try{ sessionStorage.setItem('synthz:back', 'fade'); }catch(x){}
    setTimeout(go, 200);
  }
}
/* llegada a SynthFlow desde el portal: el hueco de la «o» se abre y deja ver el chat */
function portalArrive(veil){
  if (!veil) return;
  const R = Math.hypot(innerWidth, innerHeight) / 2 + 60, t0 = performance.now(), D = 1100;
  const ring = document.createElement('i'); ring.className = 'szpring'; document.body.appendChild(ring);
  veil.style.transition = 'none'; veil.style.opacity = '1'; veil.style.background = '#0b0820';
  (function f(now){
    const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3), rr = (R * e).toFixed(1);
    const m = 'radial-gradient(circle at 50% 50%, transparent ' + rr + 'px, #000 ' + (R * e + 34).toFixed(1) + 'px)';
    veil.style.webkitMaskImage = m; veil.style.maskImage = m;
    ring.style.width = ring.style.height = (R * e * 2 + 8).toFixed(1) + 'px'; ring.style.opacity = (1 - k).toFixed(3);
    if (k < 1) requestAnimationFrame(f);
    else { veil.style.opacity = '0'; veil.style.webkitMaskImage = veil.style.maskImage = ''; ring.remove(); }
  })(t0);
}
/* al salir del portal la pantalla ondula como si saliera del agua (sin gotas) */
function waterIn(el){
  if (!el || reduce) return;
  document.body.insertAdjacentHTML('beforeend', '<svg id="szwsvg" width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="szwater" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence id="szturb" type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="2" seed="7" result="n"/><feDisplacementMap id="szdisp" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>');
  const turb = $('#szturb'), disp = $('#szdisp'), t0 = performance.now(), D = 1700;
  el.style.filter = 'url(#szwater)';
  (function f(now){
    const e = Math.min(1, (now - t0) / D), amp = Math.pow(1 - e, 2.2) * 70;
    disp.setAttribute('scale', amp.toFixed(1));
    turb.setAttribute('baseFrequency', (0.006 + e * 0.002).toFixed(4) + ' ' + (0.011 - e * 0.004 + Math.sin(e * 9) * 0.0015).toFixed(4));
    if (e < 1) requestAnimationFrame(f); else { el.style.filter = ''; const s = $('#szwsvg'); if (s) s.remove(); }
  })(t0);
}

/* v2.2 · menús limpios: íconos, grupos (separados con «—»), atajos y lo peligroso en rojo. Se usan con el clic derecho y con «⋯» */
const MI = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
const MICO = {
  copy:MI('<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
  new:MI('<path d="M12 20h8"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  globe:MI('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>'),
  search:MI('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  cog:MI('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  help:MI('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>'),
  star:MI('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/>'),
  sound:MI('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/>'),
  regen:MI('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'),
  trash:MI('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  down:MI('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  quote:MI('<path d="M7 7h4v4H7zM13 7h4v4h-4z"/><path d="M9 11c0 3-1 5-3 6M15 11c0 3-1 5-3 6"/>'),
  home:MI('<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>'),
  brain:MI('<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4z"/>'),
  chats:MI('<path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>'),
  ai:MI('<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/>'),
  up:MI('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  user:MI('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  open:MI('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  chart:MI('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  reload:MI('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'),
  stop:MI('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
  cmp:MI('<rect x="3" y="5" width="7.5" height="14" rx="2"/><rect x="13.5" y="5" width="7.5" height="14" rx="2"/>'),
  trophy:MI('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>'),
  exit:MI('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>')
};
/* arma un menú (para el clic derecho o para un botón) en la posición x, y */
function menuBuild(items, x, y, cls){
  const m = document.createElement('div'); m.className = 'ctxm ' + (cls || ''); m.setAttribute('role', 'menu');
  items.filter(Boolean).forEach((it, i, L) => {
    if (it === '—'){ if (i && i < L.length - 1 && L[i - 1] !== '—') m.appendChild(document.createElement('hr')); return; }
    if (it.head){ const h = document.createElement('div'); h.className = 'mhd'; h.textContent = it.head; m.appendChild(h); return; }
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); if (it.danger) b.className = 'dng';
    b.innerHTML = '<i class="mico">' + (MICO[it.ico] || '') + '</i><span></span>' + (it.key ? '<kbd>' + esc(it.key) + '</kbd>' : '') + (it.on != null ? '<em class="mck" aria-hidden="true">' + (it.on ? '✓' : '') + '</em>' : '');
    $('span', b).textContent = it.label; if (it.on != null) b.setAttribute('aria-checked', String(!!it.on));
    b.addEventListener('click', ev => { ev.stopPropagation(); menuClose(); it.fn(); });
    m.appendChild(b);
  });
  document.body.appendChild(m);
  m.style.left = Math.max(8, Math.min(x, innerWidth - m.offsetWidth - 10)) + 'px'; m.style.top = Math.max(8, Math.min(y, innerHeight - m.offsetHeight - 10)) + 'px';
  if (!reduce) m.animate([{ opacity:0, transform:'scale(.94) translateY(4px)', filter:'blur(4px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:260, easing:'cubic-bezier(.22,1,.36,1)' });
  m.addEventListener('keydown', e => { const B = $$('button', m), i = B.indexOf(document.activeElement); if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); B[(i + (e.key === 'ArrowDown' ? 1 : B.length - 1)) % B.length].focus(); } });
  return m;
}
let MENU = null;
function menuClose(){ if (!MENU) return; const m = MENU; MENU = null; if (reduce){ m.remove(); return; } m.animate([{ opacity:1 }, { opacity:0, transform:'scale(.97)' }], { duration:140 }).onfinish = () => m.remove(); }
function menuOpen(items, x, y, cls){ menuClose(); MENU = menuBuild(items, x, y, cls); return MENU; }
addEventListener('pointerdown', e => { if (MENU && !MENU.contains(e.target) && !(e.target.closest && e.target.closest('[data-menu-owner]'))) menuClose(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && MENU){ e.preventDefault(); menuClose(); } });
addEventListener('scroll', e => { if (MENU && !(e.target && e.target.nodeType === 1 && MENU.contains(e.target))) menuClose(); }, true); addEventListener('resize', () => menuClose());
/* clic derecho: getItems(e, sel) arma lo que corresponde según dónde hiciste clic */
function ctxMenu(getItems){
  addEventListener('contextmenu', e => {
    if (e.target.closest && e.target.closest('input,textarea,[contenteditable],a[href]')) return;
    const sel = String(getSelection() || '').trim();
    const items = [...(sel ? [{ label:'Copiar', ico:'copy', key:'Ctrl+C', fn:() => { navigator.clipboard && navigator.clipboard.writeText(sel); toast('Copiado.'); } }] : []), ...(getItems(e, sel) || [])];
    if (!items.length) return;
    e.preventDefault(); menuOpen(items, e.clientX, e.clientY);
  });
}
if (matchMedia('(pointer: fine)').matches && !reduce){ let ax = 0, ay = 0, aq = 0; addEventListener('pointermove', e => { ax = e.clientX; ay = e.clientY; if (aq) return; aq = requestAnimationFrame(() => { aq = 0; const a = $('.aurora'); if (!a) return; a.style.setProperty('--mx', ((ax / innerWidth - .5) * 70).toFixed(1)); a.style.setProperty('--my', ((ay / innerHeight - .5) * 70).toFixed(1)); }); }, { passive:true }); }
addEventListener('scroll', e => { const t = e.target; if (t && t !== document && t.scrollTop != null){ extraY += t.scrollTop - (t._lt || 0); t._lt = t.scrollTop; } }, true);
if (matchMedia('(pointer: fine)').matches){
  const TXT = 'p,h1,h2,h3,h4,h5,h6,li,td,th,blockquote,pre,code,small,label,em,strong,b,span,.bub,.md';
  const NOT = 'a,button,[role=button],input,textarea,select,summary,.tg,.word,.logo';
  /* la barrita de texto solo aparece mientras seleccionas (arrastrando sobre texto) */
  let selDown = null;
  const hasSel = () => { const s = getSelection(); return !!(s && !s.isCollapsed && String(s).trim()); };
  addEventListener('pointerdown', e => { const t = e.target; selDown = e.button === 0 && t && t.closest && !t.closest(NOT) ? [e.clientX, e.clientY, !!t.closest(TXT)] : null; }, { passive:true });
  addEventListener('pointermove', e => { root.classList.remove('cursor-typing'); if (selDown && (e.buttons & 1) && Math.hypot(e.clientX - selDown[0], e.clientY - selDown[1]) > 4 && (selDown[2] || hasSel())) root.classList.add('cursor-text'); }, { passive:true });
  document.addEventListener('selectionchange', () => { if (selDown && hasSel()) root.classList.add('cursor-text'); });
  const selEnd = () => { selDown = null; root.classList.remove('cursor-text'); };
  addEventListener('pointerup', selEnd); addEventListener('pointercancel', selEnd); addEventListener('blur', selEnd);
  addEventListener('keydown', e => { if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') root.classList.add('cursor-typing'); });
}
{ const au = $('.aurora'); if (au && au.children.length < 4) au.appendChild(document.createElement('i')); }
const errText = e => typeof e === 'string' ? e : !e ? '' : (e.message || e.msg || (e.error && (typeof e.error === 'string' ? e.error : e.error.message || e.error.code)) || e.code || '');
async function askPuter(messages, opts){
  if (!window.puter) throw new Error('No pude abrir Puter. Revisa tu internet o apaga el bloqueador de anuncios para esta página.');
  if (!puter.auth.isSignedIn()) throw Object.assign(new Error('Conecta tu cuenta de Puter para usar esta IA.'), { needLogin:true });
  const model = String(opts.model || state.model.openrouter).replace(/^pu:/, ''), t0 = performance.now();
  const inChars = messages.reduce((n, m) => n + (typeof m.content === 'string' ? m.content.length : 200), 0);
  let resp;
  try{ resp = await Promise.race([new Promise((_, no) => { const s = opts.signal; if (s){ if (s.aborted) no(Object.assign(new Error('Detenido.'), { aborted:true })); else s.addEventListener('abort', () => no(Object.assign(new Error('Detenido.'), { aborted:true })), { once:true }); } }), puter.ai.chat(messages, Object.assign({ model, normalize:true }, opts.maxTokens ? { max_tokens:opts.maxTokens } : {})), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 120000))]); }
  catch(e){
    if (e && e.aborted) throw e;
    const m = errText(e), code = String((e && (e.code || (e.error && e.error.code) || e.status)) || '') + ' ' + m;
    if (/insufficient_funds|insufficient funds|low balance|402/i.test(code)){ puterSetOut(); throw Object.assign(new Error('Usaste el saldo de este mes de Puter. Se llena otra vez el próximo mes; mientras tanto sigue con las IAs conectadas, que son gratis.'), { switchTo:'sz', limit:true }); }
    if (/too_many_requests|429|rate.?limit/i.test(code)) throw Object.assign(new Error('Vas muy rápido para Puter. Espera unos segundos y vuelve a intentar.'), { limit:true });
    if (/auth|token|sign.?in|login|401|403/i.test(m)) throw Object.assign(new Error('Se cerró tu cuenta de Puter. Entra otra vez.'), { needLogin:true });
    throw new Error(m === 'timeout' ? 'La IA tardó demasiado. Intenta de nuevo.' : 'Puter: ' + (m || 'no pudo responder con esta IA. Prueba con otra.'));
  }
  const c = resp && resp.message ? resp.message.content : resp;
  const text = (typeof c === 'string' ? c : Array.isArray(c) ? c.map(x => (x && x.text) || '').join('') : String(c || '')).trim() || '(La IA devolvió una respuesta vacía.)';
  return { text, prompt: Math.ceil(inChars / 4), completion: est(text), ms: performance.now() - t0, model };
}

/* ---------- desplazamiento suave con la ruedita (sin saltos bruscos) ---------- */
let ssOn = false;
const ssState = new WeakMap();
function canScroll(n, dy){
  if (!n || n.nodeType !== 1) return false;
  const st = ssState.get(n), top = st && st.raf ? st.target : n.scrollTop, max = n.scrollHeight - n.clientHeight;
  if (max < 2) return false;
  if (n !== document.scrollingElement && n !== document.documentElement && n !== document.body){ const oy = getComputedStyle(n).overflowY; if (!/auto|scroll|overlay/.test(oy)) return false; }
  return dy > 0 ? top < max - 1 : top > 1;
}
function ssAnimate(se, px){
  let st = ssState.get(se); if (!st){ st = { target:se.scrollTop, cur:se.scrollTop, raf:0, last:0 }; ssState.set(se, st); }
  const max = se.scrollHeight - se.clientHeight;
  if (!st.raf){ st.target = st.cur = se.scrollTop; se.style.scrollBehavior = 'auto'; }
  st.target = Math.max(0, Math.min(max, st.target + px));
  if (st.raf) return;
  const tick = now => {
    const dt = st.last ? Math.min(3, (now - st.last) / 16.67) : 1; st.last = now;
    st.cur += (st.target - st.cur) * (1 - Math.pow(1 - .14, dt));
    if (Math.abs(st.target - st.cur) < .6) st.cur = st.target;
    se.scrollTop = st.cur;
    if (st.cur !== st.target && Math.abs(se.scrollTop - st.cur) < 3) st.raf = requestAnimationFrame(tick); else { st.raf = 0; st.last = 0; se.style.scrollBehavior = ''; }
  };
  st.raf = requestAnimationFrame(tick);
}
function ssStop(n){ const st = n && ssState.get(n); if (st && st.raf){ cancelAnimationFrame(st.raf); st.raf = 0; st.last = 0; n.style.scrollBehavior = ''; st.target = st.cur = n.scrollTop; } }
function smoothWheel(){
  if (ssOn) return; ssOn = true;
  addEventListener('wheel', e => {
    if (!CFG.smooth || e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (e.deltaMode === 0 && Math.abs(e.deltaY) < 40) return;     /* touchpad: ya es suave */
    if (root.classList.contains('lock') && !(e.target.closest && e.target.closest('.szm,#tour,#blk,#acc,#sx,#conn,#thPop,#ptour,#svm'))) return;
    const dy = e.deltaY, px = e.deltaMode === 1 ? dy * 40 : e.deltaMode === 2 ? dy * innerHeight : dy;
    let n = e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement;
    for (; n && n !== document.body && n !== document.documentElement; n = n.parentElement){
      if (/^(TEXTAREA|SELECT)$/.test(n.tagName) || n.dataset.nosmooth != null) return;
      if (canScroll(n, dy)){ e.preventDefault(); ssAnimate(n, px * 1.05); return; }
      if (/fixed/.test(getComputedStyle(n).position) && !n.closest('.ctxm')) { if (n.matches('.szm,#tour,#blk,#acc,#sx,#conn,#ptour,#svm')){ e.preventDefault(); return; } }
    }
    const se = document.scrollingElement || document.documentElement;
    if (canScroll(se, dy)){ e.preventDefault(); ssAnimate(se, px * 1.1); }
  }, { passive:false });
  addEventListener('scroll', ev => { const n = ev.target === document ? document.scrollingElement : ev.target; const st = n && ssState.get(n); if (st && !st.raf){ st.target = st.cur = n.scrollTop; } }, { passive:true, capture:true });
}
/* ---------- el fondo gira suave mientras bajas ---------- */
function orbitBg(src){
  const au = $('.aurora'); if (!au || !CFG.bg || $('.orbit', au)) return;
  const wrap = document.createElement('div'); wrap.className = 'orbit';
  [...au.querySelectorAll(':scope > i')].forEach(i => wrap.appendChild(i)); au.prepend(wrap);
  let q = 0;
  const upd = () => { q = 0; const se = src || document.scrollingElement || document.documentElement; const h = se.scrollHeight - se.clientHeight; au.style.setProperty('--sp', (h > 0 ? Math.min(1, se.scrollTop / h) : 0).toFixed(4)); };
  (src || window).addEventListener('scroll', () => { if (!q) q = requestAnimationFrame(upd); }, { passive:true });
  upd();
}
/* ---------- entrar a SymphorIA: usuario y contraseña (y Google, si el servidor lo tiene activado) ---------- */
const isBlocked = e => !!(e && (e.error === 'popup_blocked' || e.code === 'popup_blocked'));
let gsiP = null, gsiDone = null;
function loadGsi(){ return gsiP || (gsiP = new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = () => ok(window.google); s.onerror = () => { gsiP = null; no(new Error('gsi')); }; document.head.appendChild(s); })); }
async function signedIn(d){
  setSess(d.token, d.cookie); ACC.user = d.user; ACC.profile = d.profile || null; ACC.ready = false;
  await accStart();
  try{ dispatchEvent(new Event('synthz-acc')); }catch(e){}
  toast(d.isNew ? '¡Bienvenido a ' + BRAND() + ', ' + accName() + '!' : '¡Hola de nuevo, ' + accName() + '!');
}
/* al volver de Google por Supabase: el token llega en la dirección (#access_token=…), se cambia por tu sesión de SymphorIA y se borra de la barra */
(async function sbReturn(){
  const h = location.hash || ''; if (!/access_token=|error_description=/.test(h)) return;
  const p = new URLSearchParams(h.slice(1)); try{ window.history.replaceState(null, '', location.pathname + location.search); }catch(e){}
  if (p.get('access_token')){ ACC.joining = true; root.classList.add('joining'); }
  let linking = false; try{ linking = sessionStorage.getItem('synthz:link') === '1'; sessionStorage.removeItem('synthz:link'); }catch(e){}
  if (p.get('error_description')){ ACC.joining = false; root.classList.remove('joining'); setTimeout(() => toast('No se pudo ' + (linking ? 'vincular' : 'entrar con') + ' Google: ' + p.get('error_description')), 800); return; }
  if (linking && SESS){ ACC.joining = false; root.classList.remove('joining'); setTimeout(() => linkGoogleDone({ token:p.get('access_token') }), 600); return; }
  try{ const d = await api('auth', { method:'POST', body:{ mode:'supabase', token:p.get('access_token') } }); await signedIn(d); askDrive(); }
  catch(e){ ACC.joining = false; root.classList.remove('joining'); setTimeout(() => toast((e && e.message) || 'No pude entrar con Google. Intenta de nuevo.'), 800); }
})();
async function onGoogle(resp){
  try{ const d = await api('auth', { method:'POST', body:{ credential:resp.credential } }); await signedIn(d); if (gsiDone) gsiDone(d.isNew ? 'new' : 'in'); askDrive(); }
  catch(e){ toast(e.message || 'No pude entrar. Intenta de nuevo.'); }
}
/* después de entrar con Google: «¿Quieres conectar Drive?» sí / no (una sola vez por dispositivo) */
async function askDrive(){
  try{
    if (!(await driveCid())) return;
    const m = driveMeta(); if (m && m.linked) return;
    try{ if (localStorage.getItem('synthz:askdrive')) return; localStorage.setItem('synthz:askdrive', String(Date.now())); }catch(e){}
    await sleepRaw(900);
    const ok = await szConfirm('¿Quieres conectar tu Google Drive?', 'Guardo una copia de tus chats en una carpeta privada dentro de tu Google Drive, para que tengas más espacio. No puedo ver ni tocar tus otros archivos. Puedes cambiarlo cuando quieras.', 'Sí, conectar', false, 'No, gracias');
    if (!ok){ toast('Listo. Si cambias de idea, está en Ajustes › IAs y memoria › Google Drive.'); return; }
    const r = await DRIVE.sync(); if (r && !r.busy) toast('¡Listo! Tus chats también quedan en tu Google Drive.');
  }catch(e){ toast((e && e.message) || 'No pude conectar tu Drive. Inténtalo luego en Ajustes › IAs y memoria › Google Drive.'); }
}
const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
function passStrength(p, u){
  if (!p) return 0; let s = Math.min(4, Math.floor(p.length / 4));
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^\w]/.test(p)) s++;
  if (p.length < 8 || (u && p.toLowerCase().includes(u))) s = Math.min(s, 1);
  if (/^(.)\1+$|^(12345678|password|contraseña|qwerty)/i.test(p)) s = 1;
  return Math.max(1, Math.min(4, Math.round(s * 4 / 7)));
}
/* muestra el código de recuperación y no deja seguir hasta que confirmes que lo guardaste */
function recoveryPanel(box, code, user, onOk, again){
  box.innerHTML = '<div class="rcv"><div class="rcico">🔑</div><h4>' + (again ? 'Tu nuevo código de recuperación' : 'Guarda tu código de recuperación') + '</h4>'
    + '<p>Si olvidas tu contraseña, este código es la <b>única</b> forma de volver a entrar. Solo lo verás esta vez.</p>'
    + '<div class="rccode" tabindex="0">' + esc(code) + '</div>'
    + '<div class="rcact"><button class="btn sm ghost" type="button" data-cp>Copiar</button><button class="btn sm ghost" type="button" data-dl>Descargar .txt</button></div>'
    + '<label class="rcchk"><input type="checkbox"> Ya lo guardé en un lugar seguro</label>'
    + '<button class="btn" type="button" data-go disabled>Continuar</button></div>';
  const go = $('[data-go]', box), chk = $('.rcchk input', box);
  chk.addEventListener('change', () => { go.disabled = !chk.checked; });
  $('[data-cp]', box).addEventListener('click', e => { (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => { e.target.textContent = '¡Copiado!'; }).catch(() => { const r = document.createRange(); r.selectNodeContents($('.rccode', box)); getSelection().removeAllRanges(); getSelection().addRange(r); toast('Selecciónalo y cópialo con Ctrl+C.'); }); });
  $('[data-dl]', box).addEventListener('click', () => {
    const txt = 'SymphorIA · código de recuperación\r\n\r\nUsuario: @' + user + '\r\nCódigo: ' + code + '\r\n\r\nÚsalo en «¿Olvidaste tu contraseña?» si no recuerdas tu contraseña.\r\nNo se lo compartas a nadie.\r\n';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type:'text/plain' })); a.download = 'synthz-recuperacion-' + user + '.txt'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });
  go.addEventListener('click', onOk);
  box.animate([{ opacity:0, transform:'translateY(10px)', filter:'blur(6px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:450, easing:'cubic-bezier(.22,1,.36,1)' });
}
function authBox(box, done, onBlocked, start){
  let mode = start === 'signup' ? 'signup' : 'login';
  const say = h => { box.innerHTML = '<p class="gmsg">' + h + '</p>'; };
  box.innerHTML = '<div class="gbox"><span class="gload">Preparando…</span></div>';
  accConfig().then(ok => {
    if (!ok){ say(location.protocol === 'file:' ? 'Las cuentas funcionan cuando la página está publicada (por ejemplo en Vercel).' : 'Las cuentas de ' + BRAND() + ' abren muy pronto. Mientras tanto, tus chats se guardan en este equipo y puedes usar todo sin cuenta.'); return; }
    paint();
  });
  function paint(){
    const L = mode === 'login', N = mode === 'signup', R = mode === 'reset';
    box.innerHTML = '<div class="lbox">'
      + (R ? '<div class="ltop"><button class="lnk" type="button" data-back>← Volver</button><b>Recuperar tu cuenta</b></div>'
           : '<div class="lseg" role="tablist"><button type="button" role="tab" data-m="login" aria-selected="' + L + '">Entrar</button><button type="button" role="tab" data-m="signup" aria-selected="' + N + '">Crear cuenta</button><i></i></div>')
      + '<form class="lform" novalidate>'
      + '<label>Usuario<span class="lin"><span class="at">@</span><input name="user" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="21" placeholder="' + (N ? 'elige-uno' : 'tu usuario') + '" required></span></label>'
      + (N ? '<label>Tu nombre <small>(opcional)</small><span class="lin"><input name="name" autocomplete="nickname" maxlength="40" placeholder="Cómo quieres que te llamen"></span></label>' : '')
      + (R ? '<label>Código de recuperación<span class="lin"><input name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="24" placeholder="XXXX-XXXX-XXXX-XXXX" required></span></label>' : '')
      + '<label>' + (R ? 'Contraseña nueva' : 'Contraseña') + '<span class="lin"><input name="pass" type="password" autocomplete="' + (L ? 'current-password' : 'new-password') + '" maxlength="200" placeholder="' + (L ? 'Tu contraseña' : 'Mínimo 8 caracteres') + '" required><button class="eye" type="button" aria-label="Mostrar contraseña" aria-pressed="false">' + EYE + '</button></span></label>'
      + (L ? '' : '<div class="lstr" aria-hidden="true"><i></i><i></i><i></i><i></i><span></span></div>')
      + '<p class="lerr" role="alert"></p>'
      + '<button class="btn lgo" type="submit">' + (L ? 'Entrar' : N ? 'Crear mi cuenta' : 'Cambiar contraseña y entrar') + '</button>'
      + (L ? '<button class="lnk lforgot" type="button" data-forgot>¿Olvidaste tu contraseña?</button>' : '')
      + '</form>'
      + (ACC.google && !R ? '<div class="lor"><span>o</span></div><div class="gbtn" aria-live="polite"><span class="gload">Cargando Google…</span></div>' : '')
      + '<p class="cnote">' + (N ? 'No necesitas correo. Tu contraseña se guarda protegida (ni ' + BRAND() + ' puede leerla). Al crear la cuenta te damos un código para recuperarla.' : R ? 'Es el código que guardaste al crear tu cuenta. Al cambiar la contraseña, tu cuenta se cierra en los demás dispositivos.' : 'Tus chats y favoritos te siguen a cualquier dispositivo.') + ' Al entrar aceptas los <a href="terminos.html" target="_blank" rel="noopener">Términos</a> y la <a href="privacidad.html" target="_blank" rel="noopener">Privacidad</a>.</p>'
      + '</div>';
    const f = $('.lform', box), err = $('.lerr', box), go = $('.lgo', box), uIn = f.elements.user, pIn = f.elements.pass;
    $$('[data-m]', box).forEach(b => b.addEventListener('click', () => { if (b.dataset.m !== mode){ const u = uIn.value; mode = b.dataset.m; paint(); $('.lform', box).elements.user.value = u; } }));
    const back = $('[data-back]', box); if (back) back.addEventListener('click', () => { const u = uIn.value; swapDir(box, -1, () => { mode = 'login'; paint(); $('.lform', box).elements.user.value = u; }); });
    const fg = $('[data-forgot]', box); if (fg) fg.addEventListener('click', () => { const u = uIn.value; swapDir(box, 1, () => { mode = 'reset'; paint(); $('.lform', box).elements.user.value = u; }); });
    $('.eye', box).addEventListener('click', e => { const on = pIn.type === 'password'; pIn.type = on ? 'text' : 'password'; e.currentTarget.setAttribute('aria-pressed', String(on)); e.currentTarget.setAttribute('aria-label', on ? 'Ocultar contraseña' : 'Mostrar contraseña'); });
    uIn.addEventListener('input', () => { const v = uIn.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_.]/g, ''); if (v !== uIn.value) uIn.value = v; err.textContent = ''; });
    const str = $('.lstr', box);
    if (str) pIn.addEventListener('input', () => { const s = passStrength(pIn.value, uIn.value), W = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']; str.dataset.s = pIn.value ? s : 0; $('span', str).textContent = pIn.value ? W[s] : ''; err.textContent = ''; });
    f.addEventListener('submit', async e => {
      e.preventDefault(); err.textContent = '';
      const user = uIn.value.trim().replace(/^@/, '').toLowerCase(), pass = pIn.value;
      if (!/^[a-z0-9_.]{3,20}$/.test(user)){ err.textContent = 'Tu usuario debe tener de 3 a 20 letras, números, puntos o guiones bajos.'; uIn.focus(); return; }
      if (!L && pass.length < 8){ err.textContent = 'La contraseña debe tener al menos 8 caracteres.'; pIn.focus(); return; }
      if (!pass){ err.textContent = 'Escribe tu contraseña.'; pIn.focus(); return; }
      const bodyOut = { mode, user, pass };
      if (N) bodyOut.name = f.elements.name.value.trim();
      if (N && f.elements.setup) bodyOut.setup = f.elements.setup.value.trim();
      if (R){ bodyOut.code = f.elements.code.value.trim(); if (bodyOut.code.replace(/[^a-z0-9]/gi, '').length < 16){ err.textContent = 'El código tiene 16 letras y números.'; f.elements.code.focus(); return; } }
      go.disabled = true; const label = go.textContent; go.textContent = L ? 'Entrando…' : N ? 'Creando…' : 'Cambiando…';
      try{
        const d = await api('auth', { method:'POST', body:bodyOut, keep:true });
        const finish = async () => { await signedIn(d); if (done) done(d.isNew ? 'new' : 'in'); };
        if (d.recovery){ setSess(d.token, d.cookie); recoveryPanel(box, d.recovery, user, () => finish(), R); }
        else await finish();
      }catch(x){
        go.disabled = false; go.textContent = label;
        if (x.data && x.data.code === 'reserved' && !f.elements.setup){
          const l = document.createElement('label'); l.innerHTML = 'Código de configuración<span class="lin"><input name="setup" type="text" data-sec="1" autocomplete="off" data-lpignore="true" data-1p-ignore data-form-type="other" spellcheck="false" placeholder="Solo para el equipo de SymphorIA"></span>';
          f.insertBefore(l, err); l.animate([{ opacity:0, transform:'translateY(-6px)' }, { opacity:1, transform:'none' }], { duration:400, easing:'cubic-bezier(.22,1,.36,1)' }); l.querySelector('input').focus();
        }
        err.textContent = x.net ? 'No pude conectar con ' + BRAND() + '. Revisa tu internet.' : (x.message || 'Algo falló. Intenta de nuevo.');
        box.querySelector('.lbox').animate([{ transform:'translateX(0)' }, { transform:'translateX(-7px)' }, { transform:'translateX(6px)' }, { transform:'translateX(-3px)' }, { transform:'none' }], { duration:380 });
      }
    });
    if (ACC.google && !R) googleBtn($('.gbtn', box), done, onBlocked);
  }
}
async function googleBtn(slot, done, onBlocked){
  /* v1.4: si Supabase tiene Google activado, se entra por Supabase (sin ventanitas que los navegadores bloquean) */
  if (ACC.sbg && ACC.sb && ACC.sb.url){
    slot.innerHTML = '<button type="button" class="sbg"><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continuar con Google</button>';
    slot.querySelector('.sbg').addEventListener('click', () => {
      try{ sessionStorage.setItem('synthz:sbback', location.pathname + location.search); }catch(e){}
      location.href = ACC.sb.url + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(location.origin + location.pathname);
    });
    return;
  }
  try{ await loadGsi(); }catch(e){ slot.innerHTML = '<p class="gmsg">No pude cargar el botón de Google. Puedes entrar con usuario y contraseña.</p>'; if (onBlocked) onBlocked('script'); return; }
  gsiDone = done;
  google.accounts.id.initialize({ client_id:ACC.cid, callback:onGoogle, auto_select:false, cancel_on_tap_outside:true, context:'signin', itp_support:true });
  slot.innerHTML = '';
  google.accounts.id.renderButton(slot, { theme:'filled_black', size:'large', shape:'pill', text:'continue_with', logo_alignment:'left', locale:'es', width:Math.max(220, Math.min(340, (slot.clientWidth || 320) - 4)) });
}
/* ---------- v2.3 · seguridad y acceso: cómo entras (usuario y contraseña, Google), vincular y cambiar contraseña ---------- */
const hasPass = u => !!(u && (u.kind === 'pass' || u.username));
const hasGoogle = u => !!(u && (u.google || u.kind === 'google' || u.sbUid || u.gsub));
/* al volver de Google para VINCULAR (no para entrar) */
async function linkGoogleDone(body){
  try{ const d = await api('auth', { method:'POST', keep:true, body:Object.assign({ mode:'link' }, body) }); if (d.user) ACC.user = Object.assign({}, ACC.user, d.user); await accStart(); toast(d.merged ? '¡Listo! Ese Google ya era otra cuenta tuya y quedó unida a esta.' : '¡Listo! Tu Google quedó vinculado: ya puedes entrar con él o con tu usuario.'); }
  catch(e){ toast((e && e.message) || 'No pude vincular tu Google. Intenta de nuevo.'); }
}
function securityModal(){
  if ($('#secm')) return;
  const o = document.createElement('div'); o.id = 'secm'; o.className = 'szm';
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Seguridad y acceso"><div class="word">' + zWord('Synth') + '</div><div class="tn">SEGURIDAD Y ACCESO</div><div class="tb" id="secBox"></div><div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Cerrar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const box = $('#secBox', o);
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  const GICO = '<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  const paint = () => {
    const u = ACC.user || {}, P = hasPass(u), G = hasGoogle(u);
    const L = Array.isArray(u.links) && u.links.length ? u.links : (G && u.email ? [{ email:u.email }] : []);   /* cuentas vinculadas antes de v2.4 no tenían lista */
    box.innerHTML = '<h3>Cómo entras</h3><div class="sacc">'
      + '<div class="sa-r' + (P ? ' on' : '') + '"><span class="sa-i">🔑</span><span class="sa-t"><b>Usuario y contraseña</b><small>' + (P ? '@' + esc(u.username || '') : 'Aún no tienes') + '</small></span>' + (P ? '<em class="sa-ok">✓ Activo</em>' : '<button class="btn sm" type="button" data-k="addp">Agregar</button>') + '</div>'
      + (G ? L.map(x => '<div class="sa-r on"><span class="sa-i">' + GICO + '</span><span class="sa-t"><b>Google</b><small>' + esc(x.email) + '</small></span>' + (P || L.length > 1 ? '<button class="lnk" type="button" data-un="' + esc(x.email) + '">Quitar</button>' : '<em class="sa-ok">✓ Vinculado</em>') + '</div>').join('') : '')
      + '<div class="sa-r"><span class="sa-i">' + GICO + '</span><span class="sa-t"><b>' + (G ? 'Otra cuenta de Google' : 'Google') + '</b><small>' + (G ? 'Entra con cualquiera de tus Google' : 'Sin vincular') + '</small></span>' + (ACC.google ? '<span class="sa-g"><button class="btn sm" type="button" data-k="link">Vincular</button></span>' : '<small class="sa-no">No disponible ahora</small>') + '</div>'
      + '</div><p class="cnote">Con cualquiera de estas formas entras a la <b>misma</b> cuenta, con tus chats y tu perfil. Si vinculas un Google que ya tenía una cuenta solo de Google, esa cuenta se une a esta.</p><div id="secForm"></div>';
    box.querySelectorAll('[data-un]').forEach(btn => btn.addEventListener('click', async () => {
      btn.disabled = true;
      try{ const d = await api('auth', { method:'POST', keep:true, body:{ mode:'unlink', email:btn.dataset.un } }); if (d.user) ACC.user = Object.assign({}, ACC.user, d.user); accFire('profile'); toast('Listo: quité ese Google de tu cuenta.'); paint(); }
      catch(e){ btn.disabled = false; toast((e && e.message) || 'No pude quitarlo. Intenta de nuevo.'); }
    }));
    const add = $('[data-k="addp"]', box); if (add) add.addEventListener('click', () => addPassForm());
    const ln = $('[data-k="link"]', box); if (ln) ln.addEventListener('click', () => linkGoogle(ln.parentNode));
    if (P) passForm();
  };
  /* vincular Google: por Supabase (vuelve a esta página) o con el botón de Google */
  const linkGoogle = async slot => {
    if (ACC.sbg && ACC.sb && ACC.sb.url){
      try{ sessionStorage.setItem('synthz:link', '1'); sessionStorage.setItem('synthz:sbback', location.pathname + location.search); }catch(e){}
      location.href = ACC.sb.url + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(location.origin + location.pathname); return;
    }
    try{ await loadGsi(); }catch(e){ toast('No pude cargar Google. Revisa si un bloqueador lo está frenando.'); return; }
    google.accounts.id.initialize({ client_id:ACC.cid, callback:async r => { await linkGoogleDone({ credential:r.credential }); paint(); }, auto_select:false, cancel_on_tap_outside:true, context:'use', itp_support:true });
    slot.innerHTML = ''; google.accounts.id.renderButton(slot, { theme:'filled_black', size:'medium', shape:'pill', text:'continue_with', locale:'es' });
  };
  const addPassForm = () => {
    const f0 = $('#secForm', box);
    f0.innerHTML = '<h3 style="margin-top:14px">Ponle usuario y contraseña</h3><form class="lform" novalidate>'
      + '<label>Usuario<span class="lin"><span class="at">@</span><input name="user" autocomplete="username" maxlength="20" required></span></label>'
      + '<label>Contraseña<span class="lin"><input name="pass" type="password" autocomplete="new-password" maxlength="200" required></span></label>'
      + '<p class="lerr" role="alert"></p><div class="aact"><button class="btn sm" type="submit">Guardar</button></div></form>';
    const f = $('form', f0), err = $('.lerr', f0); f.elements.user.focus();
    f.elements.user.addEventListener('input', () => { const v = f.elements.user.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_.]/g, ''); if (v !== f.elements.user.value) f.elements.user.value = v; });
    f.addEventListener('submit', async e => { e.preventDefault(); err.textContent = '';
      const user = f.elements.user.value.trim(), pass = f.elements.pass.value;
      if (user.length < 3){ err.textContent = 'Tu usuario debe tener al menos 3 letras o números.'; return; }
      if (pass.length < 8){ err.textContent = 'La contraseña debe tener al menos 8 caracteres.'; return; }
      try{ const d = await api('auth', { method:'POST', keep:true, body:{ mode:'addpass', user, pass } }); ACC.user = Object.assign({}, ACC.user, d.user); accFire('pull');
        recoveryPanel(box, d.recovery, user, () => { toast('¡Listo! Ya puedes entrar con @' + user + ' o con Google.'); paint(); }, false); }
      catch(x){ err.textContent = x.message || 'Algo falló.'; }
    });
  };
  const passForm = () => {
    const f0 = $('#secForm', box);
    f0.innerHTML = '<h3 style="margin-top:14px">Tu contraseña</h3><form class="lform" novalidate>'
      + '<input name="user" autocomplete="username" value="' + esc((ACC.user && ACC.user.username) || '') + '" hidden>'
      + '<label>Contraseña actual<span class="lin"><input name="old" type="password" autocomplete="current-password" required></span></label>'
      + '<label>Contraseña nueva <small>(déjala vacía si solo quieres un código nuevo)</small><span class="lin"><input name="pass" type="password" autocomplete="new-password" maxlength="200"></span></label>'
      + '<p class="lerr" role="alert"></p>'
      + '<div class="aact"><button class="btn sm" type="submit" data-k="change">Cambiar contraseña</button><button class="btn sm ghost" type="button" data-k="code">Código de recuperación nuevo</button></div>'
      + '<p class="cnote">Al cambiar la contraseña, tu cuenta se cierra en los demás dispositivos. Si pides un código nuevo, el anterior deja de servir.</p></form>';
    const f = $('form', f0), err = $('.lerr', f0);
    const run = async k => {
      err.textContent = '';
      const old = f.elements.old.value, pass = f.elements.pass.value;
      if (!old){ err.textContent = 'Escribe tu contraseña actual.'; f.elements.old.focus(); return; }
      if (k === 'change' && pass.length < 8){ err.textContent = 'La contraseña nueva debe tener al menos 8 caracteres.'; f.elements.pass.focus(); return; }
      try{
        const d = await api('auth', { method:'POST', keep:true, body: k === 'change' ? { mode:'change', old, pass } : { mode:'code', pass:old } });
        if (k === 'change'){ setSess(d.token, d.cookie); toast('Contraseña cambiada. Cerramos tu sesión en los demás dispositivos.'); close(); }
        else recoveryPanel(box, d.recovery, (ACC.user && ACC.user.username) || '', () => { toast('Listo: el código anterior ya no sirve.'); close(); }, true);
      }catch(x){ err.textContent = x.message || 'Algo falló.'; }
    };
    f.addEventListener('submit', e => { e.preventDefault(); run('change'); });
    $('[data-k="code"]', f0).addEventListener('click', () => run('code'));
  };
  paint();
}
/* ---------- configuración ---------- */
const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const miniPage = kind => '<div class="mp ' + kind + '"><i class="bl"></i><i class="bl"></i><i class="bl"></i><div class="gl"></div><div class="nv"><img class="lg" src="media/v30/symphoria.svg" alt="" draggable="false"><i></i><b></b><b></b><b></b></div><div class="h1"></div><div class="h2"></div><div class="cds"><b></b><b></b><b></b></div><span class="cu"></span><em>así se verá</em></div>';
function cfgChooser(box, cur, onPick){
  const paint = sel => {
    box.innerHTML = '<div class="cfgo"><button type="button" data-v="visual" aria-pressed="' + (sel === 'visual') + '"><b>Más bonito</b><span>Con todos los efectos: vidrio, fondo que se mueve, cursor propio y animaciones.</span></button>'
      + '<button type="button" data-v="speed" aria-pressed="' + (sel === 'speed') + '">' + (lowEnd ? '<i class="rec">Recomendado</i>' : '') + '<b>Más rápido</b><span>Para computadores o celulares lentos: menos efectos y todo responde al instante.</span></button></div>'
      + miniPage(sel);
    $$('[data-v]', box).forEach(b => b.addEventListener('click', () => { paint(b.dataset.v); if (onPick) onPick(b.dataset.v); }));
  };
  paint(cur);
}
const CFG_ROWS = [['cursor', 'Cursor ' + BRAND(), 'El cursor de vidrio con viento.'], ['smooth', 'Desplazamiento suave', 'La ruedita baja la página sin saltos.'], ['bg', 'Fondo animado', 'Los colores se mueven y giran al bajar.'], ['glass', 'Efecto vidrio', 'Ventanas y paneles que parecen de vidrio.'], ['anim', 'Animaciones', 'Escritura letra por letra, golpe de cristal y agua.'], ['favAnim', 'Icono animado', 'El péndulo (o el destello de Flow) en el icono de la pestaña.'], ['sound', 'Sonidos', 'La voz de SynthonIA, las teclas, las transiciones y los avisos. Apágalos si te molestan.'], ['beginner', 'Modo principiante', 'Las IA te responden con palabras sencillas, paso a paso y con ejemplos.']];
/* v2.2 · Ajustes con 2 pestañas: «Página» (cómo se ve y se siente) e «IAs y memoria» (cómo te responden y qué recuerdan de ti) */
const CFG_PAGE = CFG_ROWS.filter(r => r[0] !== 'beginner');
const CFG_IA = [['beginner', 'Modo principiante', 'Te responden con palabras sencillas, paso a paso y con ejemplos.'], ['autoWeb', 'Buscar en internet cuando haga falta', 'Si preguntas por algo de hoy (precios, noticias, el clima…), la IA busca sola y te muestra sus fuentes.'], ['saver', 'Respuestas cortas', 'Respuestas más breves: gastas menos de tu límite de hoy.'], ['review', 'Revisión de calidad', 'Otra IA revisa la lógica de cada respuesta y la corrige si encuentra errores. Tarda unos segundos más.']];
const memSt0 = () => state.mem || (state.mem = { on:true, t:0, items:[] });
function memTouch(){ const m = memSt0(); m.t = Date.now(); save(); try{ if (ACC.ready) accPush(); }catch(e){} }
function memAddCore(text){
  const m = memSt0(), t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 300); if (t.length < 3) return false;
  if (!m.items.some(x => x.text.toLowerCase() === t.toLowerCase())) m.items.unshift({ id:'m' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t:Date.now(), text:t });
  m.items = m.items.slice(0, 40); memTouch(); return true;
}
/* la lista de «Lo que recuerdo de ti»: se ve, se agrega, se olvida */
function memPanel(host){
  const paint = () => {
    const m = memSt0();
    host.innerHTML = '<div class="cfgrow"><p>Usar mi memoria<small>Las IAs usan esto para responderte mejor. Si la apagas, no se usa (pero no se borra).</small></p><button class="cfgsw" type="button" role="switch" data-mem="on" aria-checked="' + m.on + '" aria-pressed="' + m.on + '" aria-label="Usar mi memoria"><i></i></button></div>'
      + '<ul class="meml">' + (m.items.length ? m.items.map(x => '<li><span></span><button type="button" class="lnk" data-del="' + x.id + '">Olvidar</button></li>').join('') : '<li class="memnone">Todavía no recuerdo nada. Escribe «recuerda que…» en el chat o agrégalo aquí.</li>') + '</ul>'
      + '<form class="memadd"><label class="field"><input type="text" maxlength="300" placeholder="Ej.: Me llamo Ana y estudio diseño gráfico" aria-label="Algo para recordar"></label><button class="btn sm" type="submit">Agregar</button></form>'
      + (m.items.length ? '<button class="lnk memclr" type="button" data-mem="clear">Olvidar todo</button>' : '');
    const L = $$('.meml li span', host); m.items.forEach((x, i) => { if (L[i]) L[i].textContent = x.text; });
  };
  paint();
  host.addEventListener('submit', e => { e.preventDefault(); const i = $('.memadd input', host); if (memAddCore(i.value)){ paint(); toast('Agregado a tu memoria.'); } });
  host.addEventListener('click', async e => {
    const d = e.target.closest('[data-del]'); if (d){ const m = memSt0(); m.items = m.items.filter(x => x.id !== d.dataset.del); memTouch(); paint(); return; }
    const t = e.target.closest('[data-mem]'); if (!t) return; const m = memSt0();
    if (t.dataset.mem === 'on'){ m.on = !m.on; memTouch(); paint(); }
    else if (t.dataset.mem === 'clear' && await szConfirm('¿Olvidar todo?', 'Borro todo lo que recuerdo de ti. No se puede deshacer.', 'Olvidar todo', true)){ m.items = []; memTouch(); paint(); }
  });
}
/* cada página agrega aquí sus atajos de «Tus IAs» (elegir IA ideales, conectar, Drive…) */
const cfgLinks = [];
function cfgModal(tab){
  if ($('#cfgm')) return;
  const draft = Object.assign({ autoWeb:true, review:true }, CFG); draft.saver = !!(state.sx && state.sx.saver);
  const o = document.createElement('div'); o.id = 'cfgm'; o.className = 'szm';
  const row = ([k, t, s]) => '<div class="cfgrow"><p>' + t + '<small>' + s + '</small></p><button class="cfgsw" type="button" role="switch" data-k="' + k + '" aria-checked="' + !!draft[k] + '" aria-pressed="' + !!draft[k] + '" aria-label="' + t + '"></button></div>';
  const IN = [['always', 'Cada vez'], ['session', 'Una vez por visita'], ['never', 'Nunca']];
  const ia = tab === 'ia' || tab === 'mem';
  o.innerHTML = '<div class="tcard cfgcard" role="dialog" aria-modal="true" aria-label="Ajustes"><div class="cfghead"><h3>Ajustes</h3>'
    + '<div class="cfgtabs" role="tablist"><span class="pill"></span><button type="button" role="tab" data-tab="page" aria-selected="' + !ia + '">Página</button><button type="button" role="tab" data-tab="ia" aria-selected="' + ia + '">IAs y memoria</button></div></div>'
    + '<div class="cfgbody">'
    + '<section class="cfgpane" data-pane="page"' + (ia ? ' hidden' : '') + '>'
    + '<div class="cfglbl">Cómo se ve</div><div id="cfgCh"></div>'
    + '<div class="cfglbl">Estilo de SynthFlow</div><div class="cfgseg" id="cfgUi"><button type="button" data-ui="full" aria-pressed="' + (draft.ui !== 'simple') + '">SynthFlow</button><button type="button" data-ui="simple" aria-pressed="' + (draft.ui === 'simple') + '">Simple</button></div><p class="cnote">Simple: solo tus chats, la caja de escribir y las respuestas, con un diseño tranquilo y sin efectos.</p>'
    + '<div class="cfglbl">Idioma · Language</div><div class="cfgseg notr" id="cfgLang">' + LANGS.map(([id, nm]) => '<button type="button" data-lang="' + id + '" lang="' + id + '" aria-pressed="' + (lang() === id) + '">' + nm + '</button>').join('') + '</div>'
    + '<div class="cfglbl">Tamaño de SynthFlow</div><div class="cfgseg" id="cfgSz"><button type="button" data-sz="compact" aria-pressed="' + (draft.size !== 'normal') + '">Compacto</button><button type="button" data-sz="normal" aria-pressed="' + (draft.size === 'normal') + '">Normal</button></div><p class="cnote">Compacto: todo un poco más pequeño, para ver más chat en la pantalla. Normal: el tamaño grande de antes.</p>'
    + (document.getElementById('composer') ? '<div class="cfglbl">Atajos en tus chats</div><div class="cfgseg cfgseg4" id="cfgLk">' + [['none', 'Ninguno'], ['syn', 'Sintéticos'], ['proj', 'Proyectos'], ['both', 'Los dos']].map(([v, l]) => '<button type="button" data-lk2="' + v + '" aria-pressed="' + ((draft.links || 'none') === v) + '">' + l + '</button>').join('') + '</div><p class="cnote">Qué va arriba de tu lista de chats, junto a «Nuevo chat». Proyectos y Sintéticos siempre están en la barrita de íconos de la izquierda.</p>' : '')
    + '<div class="cfglbl">Color de SynthFlow</div><div class="cfgth" id="cfgTh">' + THEMES.map(([id, nm, c1, lock, c2]) => '<button type="button" data-th="' + id + '" aria-pressed="' + ((draft.theme || 'synthz') === id) + '"' + (lock ? ' disabled aria-disabled="true"' : '') + ' style="--t1:' + c1 + ';--t2:' + c2 + '"><i></i><span>' + esc(nm) + '</span>' + (lock ? '<em>Pronto</em>' : '') + '</button>').join('') + '</div><p class="cnote" id="cfgThN"></p>'
    + (matchMedia('(pointer:coarse), (max-width:820px)').matches ? '<div class="cfglbl">Barra del celular</div><div class="cfgseg" id="cfgNav"><button type="button" data-nav="bottom" aria-pressed="' + (draft.nav !== 'left') + '">Abajo</button><button type="button" data-nav="left" aria-pressed="' + (draft.nav === 'left') + '">A la izquierda</button></div><p class="cnote">A la izquierda: la barra se esconde y la abres con el botón ☰ de arriba.</p>' : '')
    + '<div class="cfglbl">Detalles</div><div id="cfgRows">' + CFG_PAGE.map(row).join('') + '</div>'
    + '<div class="cfglbl">Intro de la página</div><div class="cfgseg" id="cfgIn">' + IN.map(([v, l]) => '<button type="button" data-in="' + v + '" aria-pressed="' + (draft.intro === v) + '">' + l + '</button>').join('') + '</div><p class="cnote">La animación al entrar al chat siempre se ve.</p>'
    + '</section>'
    + '<section class="cfgpane" data-pane="ia"' + (ia ? '' : ' hidden') + '>'
    + '<div class="cfglbl">Cómo te responden</div>' + CFG_IA.map(row).join('')
    + '<div class="cfglbl" id="cfgMemL">Lo que recuerdo de ti</div><div id="szMem" class="cfgmem"></div>'
    + (cfgLinks.length ? '<div class="cfglbl">Tus IAs</div><div class="cfglinks">' + cfgLinks.map(([l, , d], i) => '<button type="button" class="cfglk" data-lk="' + i + '"><b>' + esc(l) + '</b><small>' + esc(d || '') + '</small><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>').join('') + '</div>' : '')
    + '</section></div>'
    + '<div class="tbtn cfgfoot"><button class="lnk" type="button" data-close>Cerrar</button><button class="btn sm" type="button" id="cfgOk">Guardar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  $('.tcard', o).animate([{ transform:'scale(.94) translateY(16px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:560, easing:'cubic-bezier(.22,1,.36,1)' });
  const paintRows = () => $$('.cfgsw[data-k]', o).forEach(b => { b.setAttribute('aria-pressed', String(!!draft[b.dataset.k])); b.setAttribute('aria-checked', String(!!draft[b.dataset.k])); });
  cfgChooser($('#cfgCh', o), draft.perf, v => { draft.perf = v; Object.assign(draft, cfgPreset(v)); paintRows(); });
  memPanel($('#szMem', o));
  $$('.cfgsw[data-k]', o).forEach(b => b.addEventListener('click', () => { draft[b.dataset.k] = !draft[b.dataset.k]; paintRows(); }));
  $$('[data-in]', o).forEach(b => b.addEventListener('click', () => { draft.intro = b.dataset.in; $$('[data-in]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  const thNote = () => { const n = $('#cfgThN', o); if (n) n.textContent = draft.ui === 'simple' ? 'El estilo Simple usa sus propios colores: el color se ve en el estilo SynthFlow.' : (szTeam ? 'Cambia el dorado y el rosado de SynthFlow. Aurora y Oro negro ya son tuyos por ser del equipo (plan Orquesta).' : 'Cambia el dorado y el rosado de SynthFlow. Aurora y Oro negro llegan con Syntonia.'); };
  thNote();
  $$('[data-ui]', o).forEach(b => b.addEventListener('click', () => { draft.ui = b.dataset.ui; $$('[data-ui]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); thNote(); }));
  $$('[data-lang]', o).forEach(b => b.addEventListener('click', () => { setLang(b.dataset.lang); $$('[data-lang]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));   /* el idioma cambia al instante, sin «Guardar» */
  $$('[data-lk2]', o).forEach(b => b.addEventListener('click', () => { draft.links = b.dataset.lk2; $$('[data-lk2]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  $$('[data-sz]', o).forEach(b => b.addEventListener('click', () => { draft.size = b.dataset.sz; $$('[data-sz]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  $$('[data-th]', o).forEach(b => b.addEventListener('click', () => { if (b.disabled) return; draft.theme = b.dataset.th; $$('[data-th]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  $$('[data-nav]', o).forEach(b => b.addEventListener('click', () => { draft.nav = b.dataset.nav; $$('[data-nav]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  const tabs = $('.cfgtabs', o), pill = $('.pill', tabs);
  const show = k => { $$('[role=tab]', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === k))); $$('.cfgpane', o).forEach(p => { p.hidden = p.dataset.pane !== k; }); const b = $('[data-tab="' + k + '"]', tabs); if (b && pill){ pill.style.width = b.offsetWidth + 'px'; pill.style.transform = 'translateX(' + (b.offsetLeft - 4) + 'px)'; } $('.cfgbody', o).scrollTop = 0; };
  tabs.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
  requestAnimationFrame(() => show(ia ? 'ia' : 'page'));
  try{ cfgSideMenu(o); }catch(e){}   /* v3.7 · menú lateral (core 14b) */
  /* v3.7 · con Animaciones apagadas no hay intro: se dice en vez de dejar que parezca que no funciona */
  const inNote = () => { const n = $('#cfgIn + .cnote', o); if (n) n.textContent = draft.anim === false ? 'Con «Animaciones» apagadas no hay intro: enciéndelas para verla.' : 'La animación al entrar al chat siempre se ve.'; };
  inNote(); $$('.cfgsw[data-k="anim"]', o).forEach(b => b.addEventListener('click', inNote));
  if (tab === 'mem') setTimeout(() => { const l = $('#cfgMemL', o); if (l) l.scrollIntoView({ block:'start', behavior:reduce ? 'auto' : 'smooth' }); }, 350);
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 450); };
  $$('.cfglk', o).forEach(b => b.addEventListener('click', () => { const L = cfgLinks[+b.dataset.lk]; close(); if (L) setTimeout(L[1], 200); }));
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $('#cfgOk', o).addEventListener('click', () => { state.sx = state.sx || {}; if (!!state.sx.saver !== !!draft.saver){ state.sx.saver = !!draft.saver; save(); try{ hooks.usage(); }catch(e){} try{ dispatchEvent(new Event('synthz-saver')); }catch(e){} } const d = Object.assign({}, draft); delete d.saver; applyCfg(d, close); });
}
function applyCfg(draft, close){
  const reload = draft.anim !== CFG.anim || (draft.cursor !== CFG.cursor && matchMedia('(pointer: fine)').matches) || (draft.bg && !!$('.aurora') && !$('.aurora .orbit'));
  Object.assign(CFG, draft, { v:2 }); saveCfg(); cfgClasses();
  if (CFG.favAnim && window.__favStart) window.__favStart();
  if (close) close();
  if (reload){ toast('Aplicando tu configuración…'); setTimeout(() => location.reload(), 900); }
  else toast('Configuración guardada.');
}
/* Esc cierra la ventana flotante que esté arriba */
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const c = [...document.querySelectorAll('.szm [data-close], .szm [data-d="x"], #blk #bClose, #acc #aClose, #sx #sxClose, #conn #cClose, #szChat [data-cx]')].filter(x => x.isConnected && !x.closest('.bye')).pop();
  if (c){ e.preventDefault(); c.click(); }
});

/* el péndulo del logo se frena con suavidad cuando lo señalas y vuelve a moverse al salir */
function calmMark(host, on){
  host.querySelectorAll('.mark .sw').forEach(g => {
    if (on){
      if (g._calm) return; g._calm = true;
      const tf = getComputedStyle(g).transform;
      g.style.animation = 'none';
      if (tf && tf !== 'none' && !reduce) g.animate([{ transform:tf }, { transform:'rotate(0deg)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
    } else if (g._calm){ g._calm = false; g.style.animation = ''; }
  });
}
document.addEventListener('pointerover', e => { const h = e.target.closest && e.target.closest('.logo, a, button'); if (h && h.querySelector('.mark .sw')) calmMark(h, true); });
document.addEventListener('pointerout', e => { const h = e.target.closest && e.target.closest('.logo, a, button'); if (h && !(e.relatedTarget && h.contains(e.relatedTarget)) && h.querySelector('.mark .sw')) calmMark(h, false); });

/* clic con el botón del medio: el cursor cambia al de desplazamiento automático */
if (document.getElementById('cm')){
  let midT = 0;
  const midOff = () => root.classList.remove('cursor-mid');
  addEventListener('pointerdown', e => { if (e.button === 1){ if (e.target.closest && e.target.closest('a')) return; root.classList.toggle('cursor-mid'); midT = performance.now(); } else midOff(); }, true);
  addEventListener('pointerup', e => { if (e.button === 1 && performance.now() - midT > 350) midOff(); }, true);
  addEventListener('keydown', midOff); addEventListener('blur', midOff); addEventListener('wheel', e => { if (!e.buttons) midOff(); }, { passive:true });
}

/* ===== v3.7 · Ajustes con menú lateral (estilo del Uiverse #31 que mandó Sammuel: lista vertical con ícono, texto y barra activa)
   Cada título de Ajustes («Cómo se ve», «Idioma», «Color», «Lo que recuerdo de ti»…) es una entrada del menú.
   Tocarla abre su pestaña y baja hasta esa parte; al hacer scroll, la entrada activa sigue lo que estás viendo.
   Las pestañas viejas siguen en el código (la Guía las usa), pero no se ven. En el celular el menú es una fila de chips arriba. ===== */
const CFG_NAV_ICO = {
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  brush:'<path d="M14 4l6 6-9 9H5v-6z"/><path d="M12 6l6 6"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
  size:'<path d="M4 9V4h5M20 15v5h-5M4 4l7 7M20 20l-7-7"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  palette:'<path d="M12 3a9 9 0 100 18c1.2 0 1.8-.9 1.4-1.9-.5-1.2.3-2.1 1.5-2.1H18a3 3 0 003-3c0-6-4-11-9-11z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  phone:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  play:'<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/>',
  brain:'<path d="M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 006 0V4.5A2.5 2.5 0 009 4zM15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-6 0"/>',
  link:'<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>'
};
const cfgNavIco = txt => { const s = String(txt || '').toLowerCase();
  const k = /c[oó]mo se ve|look/.test(s) ? 'eye' : /estilo|style/.test(s) ? 'brush' : /idioma|language/.test(s) ? 'globe' : /tama|size/.test(s) ? 'size' : /atajo|shortcut/.test(s) ? 'bolt'
    : /color|colou?r/.test(s) ? 'palette' : /celular|phone/.test(s) ? 'phone' : /intro/.test(s) ? 'play' : /responden|answer/.test(s) ? 'chat' : /recuerdo|remember|memor/.test(s) ? 'brain' : /tus ias|your ais/.test(s) ? 'link' : 'sliders';
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + CFG_NAV_ICO[k] + '</svg>'; };
function cfgSideMenu(o){
  const card = o && $('.cfgcard', o), body = card && $('.cfgbody', card), tabs = card && $('.cfgtabs', card); if (!card || !body || !tabs || $('.cfgnav', card)) return;
  const items = [];
  $$('.cfgpane', body).forEach(p => $$('.cfglbl', p).forEach(l => items.push({ pane:p.dataset.pane, l })));
  if (items.length < 2) return;
  const nav = document.createElement('nav'); nav.className = 'cfgnav'; nav.setAttribute('aria-label', 'Secciones de Ajustes');
  nav.innerHTML = items.map((it, i) => '<button type="button" class="cfgnav-i" data-ni="' + i + '">' + cfgNavIco(it.l.textContent) + '<span>' + esc(it.l.textContent) + '</span></button>').join('');
  card.classList.add('cfg-side'); body.before(nav);
  const btns = $$('.cfgnav-i', nav);
  const mark = i => btns.forEach((b, k) => { const on = k === i; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); if (on && nav.scrollWidth > nav.clientWidth + 4) b.scrollIntoView({ block:'nearest', inline:'nearest' }); });
  const paneOn = () => { const p = $('.cfgpane:not([hidden])', body); return p ? p.dataset.pane : ''; };
  let lock = 0;
  const follow = () => {
    if (Date.now() < lock) return;
    const top = body.getBoundingClientRect().top + 48, pane = paneOn(); let best = -1;
    items.forEach((it, i) => { if (it.pane === pane && it.l.getBoundingClientRect().top <= top) best = i; });
    if (best < 0) best = items.findIndex(it => it.pane === pane);
    mark(best);
  };
  nav.addEventListener('click', e => {
    const b = e.target.closest('.cfgnav-i'); if (!b) return;
    const it = items[+b.dataset.ni]; if (!it) return;
    if (paneOn() !== it.pane){ const tb = $('[data-tab="' + it.pane + '"]', tabs); if (tb) tb.click(); }
    lock = Date.now() + 700; mark(+b.dataset.ni);
    requestAnimationFrame(() => { body.scrollTo({ top:Math.max(0, it.l.offsetTop - body.offsetTop - 6), behavior:reduce ? 'auto' : 'smooth' }); });
  });
  body.addEventListener('scroll', () => requestAnimationFrame(follow), { passive:true });
  tabs.addEventListener('click', () => setTimeout(follow, 60));
  setTimeout(follow, 80);
}
/* ---------- respuestas en vivo (streaming) ---------- */
let ridN = 0;
const newRid = () => DEV + ':' + Date.now().toString(36) + ':' + (++ridN);
/* v3.6 · avisa cada vez que se gasta un mensaje de prueba (sin cuenta o la prueba guiada), con lo que queda de verdad según el servidor */
function spentNote(before, after){
  if (!(before > after)) return;
  try{ toast(after > 0 ? t('enerx.spent', { n:after }) : t('enerx.spent0')); }catch(e){}
}
async function askStream(p, messages, opts = {}, onDelta){
  const sig = opts.signal, t0 = performance.now(); let acc = '', ttft = 0, usage = null, fin = '', cut = '', via = '', provX = '', real = '', swap = false;
  /* lo que la IA «piensa» (campo reasoning o etiquetas <think>) se separa de la respuesta y se muestra aparte */
  let raw = '', tagR = '', fieldR = '';
  const emitR = () => { if (opts.onReason) try{ opts.onReason(fieldR + tagR); }catch(e){} };
  const push = d => {
    if (!d) return; raw += d; let vis = raw;
    const lead = raw.replace(/^\s+/, ''), i = raw.indexOf('<think>');
    if (i >= 0){ const j = raw.indexOf('</think>', i), r = raw.slice(i + 7, j < 0 ? undefined : j); if (r !== tagR){ tagR = r; emitR(); } vis = raw.slice(0, i) + (j < 0 ? '' : raw.slice(j + 8).replace(/^\s+/, '')); }
    else if (lead.length < 7 && '<think>'.startsWith(lead)) vis = '';
    if (vis === acc) return;
    if (!ttft && vis) ttft = performance.now() - t0; acc = vis; if (onDelta) onDelta(acc);
  };
  const pushR = d => { if (!d || typeof d !== 'string') return; fieldR += d; emitR(); };
  const inChars = messages.reduce((n, m) => n + (typeof m.content === 'string' ? m.content.length : 200), 0);
  const done = aborted => {
    if (!acc && aborted) throw Object.assign(new Error('Detenido.'), { aborted:true });
    const text = acc.trim() || '(La IA devolvió una respuesta vacía.)';
    const prompt = usage && usage.prompt_tokens != null ? usage.prompt_tokens : Math.ceil(inChars / 4);
    const completion = usage && usage.completion_tokens != null ? usage.completion_tokens : est(text);
    return { text, prompt, completion, ms:performance.now() - t0, ttft, model:opts.model, aborted:!!aborted, est:!usage, finish:fin, cut, rid:newRid(), via, prov:provX || undefined, real, swap, reasoning:(fieldR + tagR).trim().slice(0, 8000) };
  };
  const model0 = String(opts.model || state.model[p.id] || '');
  /* sin créditos de Puter: pasa sola a las IAs conectadas (el único aviso es «Usaste el saldo de este mes de Puter: sigo con las IAs conectadas») */
  /* v3.4 · las fotos ya viajan a las IAs conectadas (antes se cambiaban por «[imagen]» y el servidor las botaba) */
  const fallSz = () => { puterOutNote(); return askStream(SZ_P, messages, Object.assign({}, opts, { model:'sz:auto', _noFall:true }), onDelta).then(r => Object.assign(r, { swapped:true })); };
  if (/^pu:/.test(model0)){
    if (!window.puter) throw new Error('No pude abrir Puter. Revisa tu internet o apaga el bloqueador de anuncios para esta página.');
    if (!puter.auth.isSignedIn()) throw Object.assign(new Error('Conecta tu cuenta de Puter para usar esta IA.'), { needLogin:true });
    if (!opts._noFall && SZQ.on !== false && await puterOut()) return fallSz();
    let resp;
    const stop = new Promise(res => { if (sig){ if (sig.aborted) res({ stop:true }); else sig.addEventListener('abort', () => res({ stop:true }), { once:true }); } });
    try{
      try{ resp = await Promise.race([puter.ai.chat(messages, Object.assign({ model:model0.replace(/^pu:/, ''), stream:true }, opts.maxTokens ? { max_tokens:opts.maxTokens } : {})), stop]); }
      catch(e){ if (/stream/i.test(errText(e))) return askPuter(messages, opts).then(r => { push(r.text); return Object.assign(r, { ttft:ttft || r.ms, est:true, rid:newRid() }); }); throw e; }
      if (resp && resp.stop) return done(true);
      if (!resp || typeof resp[Symbol.asyncIterator] !== 'function'){ const c = resp && resp.message ? resp.message.content : resp; push(typeof c === 'string' ? c : String(c || '')); return done(false); }
      const it = resp[Symbol.asyncIterator]();
      while (true){
        const n = await Promise.race([it.next(), stop]);
        if (n.stop) return done(true);
        if (n.done) break;
        const part = n.value || {};
        if (part.type === 'error'){ if (acc){ cut = part.message || 'error'; return done(false); } throw new Error('Puter: ' + (part.message || 'el modelo falló a mitad de la respuesta.')); }
        if (part.finish_reason) fin = part.finish_reason;
        if (part.usage) usage = { prompt_tokens:part.usage.input_tokens ?? part.usage.prompt_tokens, completion_tokens:part.usage.output_tokens ?? part.usage.completion_tokens };
        if ((!part.type || part.type === 'text') && typeof part.text === 'string') push(part.text);
        else if (part.type === 'reasoning') pushR(part.reasoning || part.text);
      }
    }catch(e){
      if (e && e.aborted) throw e;
      const m = errText(e), code = String((e && (e.code || (e.error && e.error.code))) || '') + ' ' + m;
      if (/insufficient_funds|insufficient funds|low balance|402/i.test(code)){ puterSetOut(); if (!acc && !opts._noFall && SZQ.on !== false) return fallSz(); if (acc) return done(false); throw Object.assign(new Error('Usaste el saldo de este mes de Puter. Se llena otra vez el próximo mes; mientras tanto sigue con las IAs conectadas, que son gratis.'), { switchTo:'sz', limit:true }); }
      if (/too_many_requests|429/i.test(code)) throw Object.assign(new Error('Vas muy rápido para Puter. Espera unos segundos y vuelve a intentar.'), { limit:true });
      if (/auth|token|sign.?in|login|401|403/i.test(m)) throw Object.assign(new Error('Se cerró tu cuenta de Puter. Entra otra vez.'), { needLogin:true });
      if (acc) return done(false);
      throw Object.assign(new Error('Puter: ' + (m || 'no pudo responder con esta IA. Prueba con otra.')), { raw:m, gone:/model.{0,30}(not found|not available|does not exist|unknown|unsupported|invalid)|no (such|valid) model|model_not_found/i.test(m) });
    }
    return done(false);
  }
  const viaSz = /^sz:/.test(model0); if (viaSz){ p = SZ_P; provX = 'synthz'; }
  const viaGroq = /^gq:/.test(model0); if (viaGroq) p = GROQ_P;
  if (p.kind !== 'openai'){ const r = await ask(p, messages, opts); push(r.text); return Object.assign(r, { ttft:r.ms, rid:newRid() }); }
  const viaTrial = /^tr:/.test(model0);
  const viaTeam = !viaTrial && !viaGroq && p.id === 'openrouter' && !state.keys.openrouter && !!state.useTeam && !!SESS;
  const key = state.keys[p.id];
  if (!key && !viaTeam && !viaTrial && !viaSz) throw new Error('Falta la llave de ' + p.name + '.');
  /* v3.6 · el mismo «turn» que el mensaje que escribiste (10 min): «Continúa» y el arreglo automático del código no gastan otro mensaje de prueba */
  const turn = opts.turn || (TURN && Date.now() - TURN.at < 600000 ? TURN.id : turnId(messages));
  const body = viaSz ? { messages, model:model0, turn } : viaGroq ? { model:model0.replace(/^gq:/, ''), messages, stream:true, stream_options:{ include_usage:true } } : { model:model0.replace(/^or:/, ''), messages, stream:true, usage:{ include:true } };
  if (viaTeam) body.teamId = state.useTeam;
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  if (opts.effort && p.id === 'openrouter' && !viaSz && !viaGroq && !viaTrial) body.reasoning = { effort:opts.effort };   /* v2.3.1 · esfuerzo: OpenRouter lo ignora en las IA que no razonan */
  const ctl = new AbortController(); let idle = 0;
  const bump = () => { clearTimeout(idle); idle = setTimeout(() => ctl.abort(), 70000); };
  if (sig){ if (sig.aborted) ctl.abort(); else sig.addEventListener('abort', () => ctl.abort(), { once:true }); }
  let res; bump();
  try{ res = viaSz ? await fetch('/api/ai', { method:'POST', headers:szHeaders(), body:JSON.stringify(body), signal:ctl.signal })
     : viaTrial ? await fetch('/api/trial', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ action:'chat', token:(trialGet() || {}).token || '', messages, turn }), signal:ctl.signal })
     : viaTeam ? await fetch('/api/chat', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + SESS }, body:JSON.stringify(body), signal:ctl.signal })
                     : await fetch(p.url + '/chat/completions', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + key }, body:JSON.stringify(body), signal:ctl.signal }); }
  catch(e){ clearTimeout(idle); if (sig && sig.aborted) throw Object.assign(new Error('Detenido.'), { aborted:true }); throw new Error(e && e.name === 'AbortError' ? p.name + ' tardó demasiado en responder. Intenta de nuevo.' : netMsg(p)); }
  if (!res.ok && viaTrial){
    clearTimeout(idle); const data = await res.json().catch(() => ({}));
    if (data.code === 'trial_done' || data.code === 'trial_bad'){ const t = trialGet() || {}; t.left = 0; if (data.code === 'trial_bad') t.token = ''; trialSet(t); }
    throw Object.assign(new Error(typeof data.error === 'string' ? data.error : 'La prueba no respondió. Intenta de nuevo.'), { status:res.status, trial:data.code || 'trial_err', limit:data.code === 'trial_done' });
  }
  if (!res.ok && viaSz){
    clearTimeout(idle); const data = await res.json().catch(() => ({})), code = data.code || '';
    if (code === 'sz_guest'){ szqSet({ guest:{ max:(SZQ.guest && SZQ.guest.max) || 5, used:(SZQ.guest && SZQ.guest.max) || 5 } }); telEv('limit', code); setTimeout(() => guestGate(), 350); }
    else if (/^sz_limit/.test(code)){ szqSet({ used:SZQ.limit }); telEv('limit', code); }
    else if (code === 'sz_off'){ szqSet({ on:false }); telEv('noai', 'las IAs conectadas no tienen llaves'); }
    else telEv('error', 'IAs conectadas ' + res.status + ' ' + code);
    throw Object.assign(new Error(typeof data.error === 'string' ? data.error : 'La IA no respondió. Intenta de nuevo en un momento.'), { status:res.status, sz:code || 'sz_err', limit:/^sz_limit/.test(code) || code === 'sz_guest', guest:code === 'sz_guest', raw:code, gone:code === 'sz_model' && model0 !== 'sz:auto', switchTo:code === 'sz_down' || code === 'sz_off' ? 'pu' : null });
  }
  if (viaSz){ try{ real = decodeURIComponent(res.headers.get('x-sz-name') || ''); }catch(e){ real = ''; } swap = res.headers.get('x-sz-fallback') === '1';   /* v3.7 · la IA elegida no estaba o no ve fotos: respondió otra y se dice */ const u = +res.headers.get('x-sz-used'), l = +res.headers.get('x-sz-limit'), gq = /^(\d+)\/(\d+)$/.exec(res.headers.get('x-sz-guest') || ''); const g0 = SZQ.guest && !signedish() ? guestLeft() : null; if (l) szqSet(Object.assign({ on:true, used:u || 0, limit:l }, gq ? { guest:{ used:+gq[1], max:+gq[2] } } : {})); if (gq && g0 != null) spentNote(g0, guestLeft()); }
  if (viaTrial){ const t = trialGet() || {}; const l = res.headers.get('x-trial-left'), l0 = t.left; if (l != null){ t.left = +l; trialSet(t); if (res.headers.get('x-trial-spent') !== '0' && l0 != null) spentNote(+l0, +l); } via = res.headers.get('x-trial-provider') || ''; }
  if (!res.ok){ clearTimeout(idle); const data = await res.json().catch(() => ({})); if (viaTeam && typeof data.error === 'string') throw Object.assign(new Error('Equipo: ' + data.error), { status:res.status, switchTo:res.status === 429 ? 'pu' : null }); const raw = data && data.error ? String(data.error.message || data.error) : ''; throw Object.assign(new Error(friendly(res.status, data, p)), { status:res.status, raw, gone:modelGone(res.status, raw), switchTo: p.id === 'openrouter' && (res.status === 429 || res.status === 402) ? 'pu' : null }); }
  if (!/event-stream/.test(res.headers.get('content-type') || '') || !res.body){
    clearTimeout(idle); const data = await res.json().catch(() => ({}));
    if (data && data.error) throw new Error(friendly(+data.error.code || 502, data, p));
    push((((data.choices || [])[0] || {}).message || {}).content || ''); usage = data.usage || null; return done(false);
  }
  const rd = res.body.getReader(), dec = new TextDecoder(); let buf = '';
  try{
    while (true){
      const { value, done:end } = await rd.read(); if (end) break; bump();
      buf += dec.decode(value, { stream:true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0){
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        const d = line.slice(5).trim(); if (d === '[DONE]') continue;
        let j; try{ j = JSON.parse(d); }catch(e){ continue; }
        if (j.sz){ szqSet({ used:+j.sz.used || SZQ.used, limit:+j.sz.limit || SZQ.limit }); if (!usage && j.sz.spent) usage = { prompt_tokens:Math.ceil(inChars / 4), completion_tokens:Math.max(0, j.sz.spent - Math.ceil(inChars / 4)) }; continue; }
        if (j.error){ if (acc){ cut = String(j.error.message || 'error'); return done(false); } const raw = String(j.error.message || ''); throw Object.assign(new Error(friendly(+j.error.code || 502, j, p)), { status:+j.error.code || 502, raw, gone:modelGone(+j.error.code || 502, raw) }); }
        if (j.usage) usage = j.usage; else if (j.x_groq && j.x_groq.usage) usage = j.x_groq.usage;
        const ch = (j.choices || [])[0]; if (ch && ch.delta){ pushR(ch.delta.reasoning); pushR(ch.delta.reasoning_content); if (typeof ch.delta.content === 'string') push(ch.delta.content); }
        if (ch && ch.finish_reason) fin = ch.finish_reason;
      }
    }
  }catch(e){
    clearTimeout(idle);
    if (sig && sig.aborted) return done(true);
    if (acc){ cut = (e && e.message) || 'conexión'; return done(false); }
    if (e && e.name === 'AbortError') throw new Error(p.name + ' dejó de responder. Intenta de nuevo.');
    throw e;
  }
  clearTimeout(idle);
  return done(false);
}
/* muestra el texto que llega con un ritmo suave de escritura; Detener lo completa al instante */
const reveals = new Set();
function mkReveal(body, onPaint){
  let full = '', shown = 0, raf = 0, ended = false, skip = false, endRes; const fin = new Promise(r => { endRes = r; });
  const R = {
    push(t){ full = t; if (!raf) raf = requestAnimationFrame(frame); },
    end(){ ended = true; if (!raf){ if (shown >= full.length){ reveals.delete(R); endRes(); } else raf = requestAnimationFrame(frame); } return fin; },
    skip(){ skip = true; if (!raf) raf = requestAnimationFrame(frame); },
    get full(){ return full; }
  };
  reveals.add(R);
  let lastPaint = 0, painted = -1;
  function frame(now){
    raf = 0;
    if (!skip && !ended && now - lastPaint < 33){ raf = requestAnimationFrame(frame); return; }
    lastPaint = now || performance.now();
    const back = full.length - shown;
    shown = skip || reduce ? full.length : Math.min(full.length, shown + Math.max(3, Math.ceil(back / 6)));
    if (shown === painted && !(ended && shown >= full.length)){ if (shown < full.length) raf = requestAnimationFrame(frame); return; }
    painted = shown;
    body.innerHTML = md(full.slice(0, shown));
    if (!(ended && shown >= full.length)){ const last = body.lastElementChild; (last && !/^(PRE|UL|OL|TABLE)$/.test(last.tagName) ? last : body).insertAdjacentHTML('beforeend', '<i class="scaret"></i>'); }
    if (onPaint) onPaint(shown, full.length);
    if (shown < full.length) raf = requestAnimationFrame(frame);
    else if (ended){ reveals.delete(R); endRes(); }
  }
  return R;
}
/* ---------- guardado robusto: un registro por conversación en IndexedDB ---------- */
const IDB = { db:null, ready:false };
const idbHash = {}; let idbT = 0;
function idbOpen(){ return new Promise(res => { try{ const r = indexedDB.open('synthz', 1); r.onupgradeneeded = () => { try{ r.result.createObjectStore('chats'); }catch(e){} }; r.onsuccess = () => { IDB.db = r.result; res(true); }; r.onerror = () => res(false); r.onblocked = () => res(false); }catch(e){ res(false); } }); }
function idbAll(){ return new Promise(res => { const out = {}; try{ const req = IDB.db.transaction('chats').objectStore('chats').openCursor(); req.onsuccess = () => { const c = req.result; if (c){ out[c.key] = c.value; c.continue(); } else res(out); }; req.onerror = () => res(out); }catch(e){ res(out); } }); }
function idbFlush(){
  if (!IDB.ready) return;
  try{
    const tx = IDB.db.transaction('chats', 'readwrite'), os = tx.objectStore('chats');
    Object.keys(state.chats).forEach(k => { const a = state.chats[k]; if (!Array.isArray(a)) return; const L = a[a.length - 1], h = a.length + ':' + (L ? (L.content || '').length + ':' + hashS(String(L.content || '').slice(-200)) + ':' + (L.meta || '') : ''); if (idbHash[k] !== h){ if (a.length) os.put(a, k); else os.delete(k); idbHash[k] = h; } });
    Object.keys(idbHash).forEach(k => { if (!(k in state.chats)){ os.delete(k); delete idbHash[k]; } });
    tx.onerror = () => toast('No pude guardar tus chats: se llenó el espacio en este equipo. Borra chats viejos o descarga una copia.');
  }catch(e){}
}
const chatsReady = idbOpen().then(async ok => {
  if (!ok) return false;
  const stored = await idbAll();
  Object.keys(stored).forEach(k => { const a = stored[k]; if (Array.isArray(a) && (!Array.isArray(state.chats[k]) || a.length >= state.chats[k].length)) state.chats[k] = a; });
  state.chats = cleanChats(state.chats);
  IDB.ready = true; idbFlush();
  try{ localStorage.setItem(KEY, JSON.stringify(Object.assign({}, state, { chats:{}, ledger:undefined, usage:undefined }))); }catch(e){}
  try{ if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
  try{ hooks.chats(); }catch(e){}
  return true;
});
/* ---------- consumo por proveedor ---------- */
const provOf = id => /^sz:/.test(String(id)) ? 'synthz' : /^pu:/.test(String(id)) ? 'puter' : /^tr:/.test(String(id)) ? 'trial' : /^gq:/.test(String(id)) ? 'groq' : 'openrouter';
/* ---------- prueba guiada que paga SymphorIA: 5 mensajes, solo para aprender en la guía ---------- */
const TRIAL_KEY = 'synthz:trial';
function trialGet(){ try{ return JSON.parse(localStorage.getItem(TRIAL_KEY) || 'null'); }catch(e){ return null; } }
function trialSet(v){ try{ localStorage.setItem(TRIAL_KEY, JSON.stringify(v)); }catch(e){} try{ dispatchEvent(new CustomEvent('synthz-trial', { detail:v })); }catch(e){} }
async function trialStart(){
  const t = trialGet(); if (t && t.token) return t;
  const d = await api('trial', { method:'POST', body:{ action:'start' }, keep:true });
  const v = { token:d.token, left:d.left, max:d.max }; trialSet(v); return v;
}
const totalAll = () => Object.keys(state.usage || {}).reduce((a, k) => a + total(k), 0);
const estAll = () => Object.keys(state.usage || {}).reduce((a, k) => a + ((state.usage[k] || {}).est || 0), 0);
const todayEst = () => { const d = today(); return Object.keys(state.usage || {}).reduce((a, k) => a + (((state.usage[k] || {}).estDays || {})[d] || 0), 0); };
const todayReq = (pid, freeOnly) => { const u = (state.usage || {})[pid] || {}; return ((freeOnly ? u.freeDays : u.reqDays) || {})[today()] || 0; };
const todayAll = () => { const d = today(); return Object.keys(state.usage || {}).reduce((a, k) => a + (((state.usage[k] || {}).days || {})[d] || 0), 0); };
/* ---------- SynXCoin's: lo disponible según cada proveedor + desglose honesto del consumo ---------- */
let balC = null, balT = 0;
async function providerBalance(force){
  if (!force && balC && Date.now() - balT < 60000) return balC;
  const out = {};
  const jobs = [];
  if (window.puter && puter.auth && typeof puter.auth.isSignedIn === 'function' && puter.auth.isSignedIn() && typeof puter.auth.getMonthlyUsage === 'function')
    jobs.push(puter.auth.getMonthlyUsage().then(u => { const a = u && u.allowanceInfo; out.puter = a && +a.monthUsageAllowance > 0 ? { pct:Math.max(0, Math.min(1, +a.remaining / +a.monthUsageAllowance)) } : { na:true }; }).catch(() => { out.puter = { err:true }; }));
  const k = state.keys.openrouter;
  if (k) jobs.push(fetch('https://openrouter.ai/api/v1/key', { headers:{ Authorization:'Bearer ' + k } }).then(async r => {
    if (!r.ok){ out.openrouter = { err:r.status }; return; }
    const d = ((await r.json()) || {}).data || {};
    out.openrouter = { freeTier:!!d.is_free_tier, limit:d.limit == null ? null : +d.limit, left:d.limit_remaining == null ? null : +d.limit_remaining };
  }).catch(() => { out.openrouter = { err:true }; }));
  await Promise.all(jobs);
  balC = out; balT = Date.now();
  return out;
}
/* bloque «Disponible»: solo datos que da el proveedor; lo que no se sabe, se dice */
function balanceHtml(b, extra){
  const row = (ico, name, main, sub) => '<div class="bl-row">' + ico + '<div><b>' + name + '</b><span>' + main + '</span>' + (sub ? '<small>' + sub + '</small>' : '') + '</div></div>';
  let h = '';
  const pu = b.puter;
  h += row(puterLogo(), 'Puter', pu && pu.pct != null ? t('bal.puLeft', { p:'<em>' + Math.round(pu.pct * 100) + '%</em>' }) : pu && pu.err ? t('bal.puErr') : window.puter && puter.auth && puter.auth.isSignedIn && puter.auth.isSignedIn() ? t('bal.puWait') : t('bal.puOpt'), t('bal.puSub'));
  const or = b.openrouter, fr = todayReq('openrouter', true);
  const orMain = or && !or.err
    ? 'Modelos gratis: <em>' + fmt(fr) + '</em> de ' + (or.freeTier ? '50' : '50 (o 1.000 si compraste 10 créditos o más)') + ' mensajes hoy'
    : or && or.err === 401 ? 'OpenRouter dice que tu llave no es válida.' : or && or.err ? 'OpenRouter no respondió con tu saldo.' : state.useTeam ? 'Usas el OpenRouter de tu equipo (mira el límite abajo).' : 'Pega tu llave de OpenRouter para ver tus límites.';
  const orSub = or && !or.err ? (or.limit != null && or.left != null ? 'Crédito de tu llave: quedan $' + or.left.toFixed(2) + ' de $' + or.limit.toFixed(2) + ' · ' : 'Tu llave no tiene tope de crédito · ') + 'los mensajes de hoy los cuenta SymphorIA en tus dispositivos' : '';
  void orMain; void orSub;
  if (extra) h += extra;
  return '<div class="bl">' + h + '</div>';
}
/* desglose: confirmado (lo reportó el proveedor) vs estimado (≈, SymphorIA lo calculó por el largo del texto) */
function splitHtml(){ return limBar({ puter:true }); }
function syncNote(){
  if (!ACC.ready) return signedish() ? '<p class="cnote">' + t('sync.opening') + '</p>' : '<p class="cnote">' + t('sync.local') + '</p>';
  if (ACC.full) return '<p class="sxerr">⚠ ' + esc(ACC.err) + '</p>';
  if (ACC.err) return '<p class="sxerr">⚠ ' + t('sync.err', { e:esc(ACC.err) }) + '</p>';
  return '<p class="cnote">' + t('sync.saved') + (ACC.t ? ' · ' + t('sync.ago', { s:Math.max(1, Math.round((Date.now() - ACC.t) / 1000)) }) : '') + '.</p>';
}

/* secciones que se abren y cierran suave (alto + desenfoque), SynthZ Style */
function smoothDetails(scope){
  $$('details', scope).forEach(d => {
    const s = $('summary', d), body = () => [...d.children].filter(x => x !== s);
    s.addEventListener('click', e => {
      if (reduce || !CFG.anim) return;                       /* modo rendimiento: abre al instante */
      e.preventDefault();
      if (d._anim) d._anim.cancel();
      const from = d.offsetHeight, opening = !d.open;
      if (opening) d.open = true;
      const to = opening ? d.scrollHeight : s.offsetHeight + parseFloat(getComputedStyle(d).borderTopWidth || 0);
      d.style.overflow = 'hidden';
      d._anim = d.animate([{ height:from + 'px' }, { height:to + 'px' }], { duration:opening ? 520 : 380, easing:'cubic-bezier(.22,1,.36,1)' });
      body().forEach(x => x.animate(opening ? [{ opacity:0, filter:'blur(6px)', transform:'translateY(-6px)' }, { opacity:1, filter:'blur(0)', transform:'none' }] : [{ opacity:1, filter:'blur(0)' }, { opacity:0, filter:'blur(4px)' }], { duration:opening ? 520 : 260, easing:'cubic-bezier(.22,1,.36,1)', fill:'both' }));
      d._anim.onfinish = () => { d._anim = null; d.style.overflow = ''; if (!opening) d.open = false; body().forEach(x => x.getAnimations().forEach(a => a.cancel())); };
    });
  });
}
/* ---------- guía breve: panel lateral que no tapa la conversación; se abre con el botón «?» ---------- */
function helpGuide(opts){
  opts = opts || {};
  const old = $('#szHelp'); if (old){ old.classList.remove('on'); setTimeout(() => old.remove(), 380); return; }
  const back = document.activeElement;
  const S = [
    ['¿Qué es SymphorIA?', 'Un lugar para hablar con muchas IA, gratis. Escribes lo que necesitas y una IA te responde. No tienes que configurar nada.'],
    ['¿Cómo lo uso?', 'Entra a SynthFlow, escribe tu pregunta abajo y pulsa Enter. Si no sabes qué pedir, toca un ejemplo. Tus chats quedan en la barrita de la izquierda (en el celular, abajo).'],
    ['¿Qué son las IAs conectadas?', 'Las IAs conectadas son IAs gratis que ya vienen listas en SymphorIA. No tienes que configurar nada ni dar tarjeta: solo escribes. Sin cuenta pruebas con 5 mensajes al día; con tu cuenta gratis, mucho más.'],
    ['¿Qué es el límite de hoy?', 'Cada día tienes un límite gratis para usar las IAs conectadas. A medianoche se vuelve a llenar. El anillo se va vaciando mientras chateas.'],
    ['¿Qué es Puter y cómo lo conecto?', 'Con Puter usas la versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis y tiene un saldo que se renueva cada mes. Se conecta en Ajustes › IAs y memoria › «Conectar Puter u otra IA» › «Conectar con Puter».'],
    ['Varias IA a la vez', 'Con «+» sumas otra IA (hasta 4). Todas responden lo mismo y tú eliges la que más te gusta con «Esta tiene más Flow».'],
    ['Archivos', 'Con el «+» agregas un archivo, un PDF o una foto (hasta 6 por mensaje). Todas las IA leen textos y PDF; las fotos solo las entienden las IA que «ven fotos». También puedes arrastrarlos o pegarlos.'],
    ['Modo principiante', 'En Ajustes puedes activar el modo principiante: las IA te responden con palabras sencillas, paso a paso y con ejemplos.'],
    ['SuperiorSynth', 'Arriba de tus chats, «SuperiorSynth»: una IA entiende lo que escribiste, lo mejora y se lo pasa a la IA que más sabe de ese tema. Luego decides si te quedas con esa IA. Esos chats se guardan aparte.'],
    ['Configuración', 'En Ajustes eliges si lo quieres «Más bonito» o «Más rápido», y enciendes o apagas cada detalle: cursor, fondo, vidrio, animaciones, sonidos e intro.']
  ];
  const o = document.createElement('aside'); o.id = 'szHelp'; o.setAttribute('aria-label', 'Guía rápida de SymphorIA');
  o.innerHTML = '<div class="hh"><b>Guía rápida</b><button type="button" class="hx" data-hclose aria-label="Cerrar la guía">✕</button></div>'
    + '<div class="hb">' + S.map(([q, a], i) => '<details' + (i === (opts.open || 0) ? ' open' : '') + '><summary>' + q + '</summary><p>' + a + '</p></details>').join('')
    + (opts.extra ? '<div class="hx2">' + opts.extra.map(([l], i) => '<button type="button" class="btn sm ghost" data-hx="' + i + '">' + l + '</button>').join('') + '</div>' : '')
    + '<p class="cnote">Puedes volver a abrir esta guía cuando quieras con el botón «Guía».</p></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 380); document.removeEventListener('keydown', key, true); if (back && back.focus) try{ back.focus(); }catch(e){} };
  const key = e => { if (e.key === 'Escape' && !document.querySelector('.szm')){ e.stopPropagation(); close(); } };
  document.addEventListener('keydown', key, true);
  $('[data-hclose]', o).addEventListener('click', close);
  $$('[data-hx]', o).forEach(b => b.addEventListener('click', () => { close(); opts.extra[+b.dataset.hx][1](); }));
  smoothDetails(o);
  setTimeout(() => { const s = $('summary', o); if (s) s.focus(); }, 60);
}

/* cambia el contenido de un bloque con dirección: «siguiente» sube, «atrás» baja (la misma animación al revés) */
function swapDir(el, dir, set){
  if (!el || reduce || root.classList.contains('noanim')){ set(); return; }
  const d = dir < 0 ? -1 : 1;
  el.animate([{ opacity:1, transform:'none', filter:'blur(0)' }, { opacity:0, transform:'translateY(' + (-12 * d) + 'px)', filter:'blur(8px)' }], { duration:200, easing:'cubic-bezier(.55,0,.75,.2)', fill:'forwards' }).onfinish = () => {
    set(); el.animate([{ opacity:0, transform:'translateY(' + (14 * d) + 'px)', filter:'blur(8px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:380, easing:'cubic-bezier(.22,1,.36,1)', fill:'forwards' });
  };
}
/* ---------- pedir un dato con vidrio (contraseña, código…) ---------- */
function szPrompt(title, text, ok, o){
  o = o || {};
  return new Promise(res => {
    const w = document.createElement('div'); w.className = 'szm szc';
    w.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="word">' + zWord('Synth') + '</div><div class="tb"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div>'
      + '<form class="lform" novalidate><span class="lin"><input name="v" type="' + (o.type || 'text') + '"' + (o.sec ? ' data-sec="1" data-lpignore="true" data-1p-ignore data-form-type="other"' : '') + ' autocomplete="' + (o.ac || 'off') + '" placeholder="' + esc(o.placeholder || '') + '" aria-label="' + esc(o.label || title) + '"></span><p class="lerr" role="alert"></p>'
      + '<div class="tbtn" style="margin-top:6px"><button class="lnk" type="button" data-close>Cancelar</button><button class="btn sm' + (o.danger ? ' danger' : '') + '" type="submit">' + esc(ok) + '</button></div></form></div>';
    document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
    const back = document.activeElement, inp = $('input', w); let gone = false;
    const out = v => { if (gone) return; gone = true; removeEventListener('keydown', key, true); w.classList.remove('on'); setTimeout(() => w.remove(), 400); try{ if (back && back.focus) back.focus(); }catch(e){} res(v); };
    const key = e => { if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); out(null); } };
    addEventListener('keydown', key, true);
    $('[data-close]', w).addEventListener('click', () => out(null));
    $('form', w).addEventListener('submit', e => { e.preventDefault(); const v = inp.value.trim(); if (!v){ $('.lerr', w).textContent = o.empty || 'Escribe algo para seguir.'; inp.focus(); return; } out(v); });
    w.addEventListener('pointerdown', e => { if (e.target === w) out(null); });
    setTimeout(() => inp.focus(), 60);
  });
}

/* ---------- confirmación con vidrio (en vez del confirm() del navegador) ---------- */
/* un «mensaje» = lo que escribes una vez (comparar 3 IA o que el agente piense antes sigue siendo 1) */
let TURN = null;
const setTurn = text => { TURN = { id:turnId([{ role:'user', content:String(text || '') }]), at:Date.now() }; };
function turnId(messages){
  const u = [...(messages || [])].reverse().find(m => m && m.role === 'user'); let t = u ? (typeof u.content === 'string' ? u.content : JSON.stringify(u.content)) : '';
  let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
  return 't' + (h >>> 0).toString(36) + '-' + Math.floor(Date.now() / 600000).toString(36);
}
/* sin cuenta, después de los mensajes de prueba: «Para seguir FlowIAndo, entra o crea tu cuenta» */
let gateOpen = false;
function guestGate(o = {}){
  if (gateOpen || signedish() || document.querySelector('#authm,#acc,#szGate')) return;
  gateOpen = true;
  const g = SZQ.guest || { max:5 }, pu = !!(window.puter && puter.auth && puter.auth.isSignedIn && (() => { try{ return puter.auth.isSignedIn(); }catch(e){ return false; } })());
  const el = document.createElement('div'); el.id = 'szGate'; el.className = 'szm';
  el.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Entra para seguir"><div class="word">' + zWord('Synth') + '</div><div class="tn">SIGUE FLOWIANDO</div>'
    + '<div class="tb"><div class="gtface" aria-hidden="true">' + face('guino', 64) + '</div><h3>Para seguir FlowIAndo, entra a tu cuenta</h3>'
    + '<p>Ya usaste tus ' + (g.max || 5) + ' mensajes de prueba de hoy sin cuenta. Crear tu cuenta es <b>gratis</b>, no pide correo ni tarjeta, y te da mucho más límite cada día. Además tus chats te siguen a cualquier celular o computador.</p>'
    + '<div id="gateBox"></div></div><div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Ahora no</button>' + (pu ? '<button class="lnk" type="button" data-pu>Seguir con mi Puter</button>' : '') + '</div></div>';
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on'));
  $('.tcard', el).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  const out = () => { gateOpen = false; el.classList.remove('on'); setTimeout(() => el.remove(), 450); };
  $('[data-close]', el).addEventListener('click', () => { out(); if (o.onClose) o.onClose(); });
  const pb = $('[data-pu]', el); if (pb) pb.addEventListener('click', () => { out(); try{ dispatchEvent(new CustomEvent('synthz-useputer')); }catch(e){} });
  el.addEventListener('pointerdown', e => { if (e.target === el){ out(); if (o.onClose) o.onClose(); } });
  authBox($('#gateBox', el), () => { out(); szqSet({ guest:null }); szCatalog().catch(() => {}); toast('¡Listo! Ya puedes seguir FlowIAndo.'); if (o.done) o.done(); }, () => {}, o.mode || 'signup');
}
/* apenas tu cuenta está lista: se cierra todo lo que te pedía entrar */
function accSettled(){
  if (!(ACC && ACC.ready)) return;
  szqSet({ guest:null }); szCatalog().catch(() => {});
  document.querySelectorAll('#szGate').forEach(g => { gateOpen = false; g.classList.remove('on'); setTimeout(() => g.remove(), 450); });
  ACC.joining = false; root.classList.add('signed'); root.classList.remove('joining');
}
accHooks.push(k => { if (k === 'out') root.classList.remove('signed'); });
addEventListener('synthz-acc', accSettled); accHooks.push(k => { if (k === 'pull') accSettled(); });
function szConfirm(title, text, ok, danger, no){
  return new Promise(res => {
    const o = document.createElement('div'); o.className = 'szm szc';
    o.innerHTML = '<div class="tcard" role="alertdialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="word">' + zWord('Synth') + '</div><div class="tb"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div><div class="tbtn" style="margin-top:16px"><button class="lnk" type="button" data-close>' + esc(no || 'Cancelar') + '</button><button class="btn sm' + (danger ? ' warn' : '') + '" type="button" data-ok>' + esc(ok || 'Aceptar') + '</button></div></div>';
    document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
    const back = document.activeElement; let gone = false;
    const out = v => { if (gone) return; gone = true; removeEventListener('keydown', key, true); o.classList.remove('on'); setTimeout(() => o.remove(), 400); try{ if (back && back.focus) back.focus(); }catch(e){} res(v); };
    const key = e => { if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); out(false); } else if (e.key === 'Tab'){ const f = [...o.querySelectorAll('button')]; const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); } };
    addEventListener('keydown', key, true);
    $('[data-close]', o).addEventListener('click', () => out(false));
    $('[data-ok]', o).addEventListener('click', () => out(true));
    o.addEventListener('pointerdown', e => { if (e.target === o) out(false); });
    setTimeout(() => { const b = $(danger ? '[data-close]' : '[data-ok]', o); if (b) b.focus(); }, 50);
  });
}

/* ---------- en qué es experta cada IA (con lo que dice el catálogo y su nombre) ---------- */
const EXP = [
  ['code', 'código', /coder|code|codestral|devstral|starcoder|qwen.?3.*coder|deepseek.?(v3|v4|coder)|claude|gpt-?5|kimi|glm|grok.*code/i],
  ['reason', 'pensar con calma antes de responder', /r1\b|reason|think|qwq|\bo[134]\b|o[34]-|gpt-oss|apodex|magistral|sonar-reasoning|deepseek-r/i],
  ['write', 'escribir y redactar', /claude|mistral|hermes|llama|gpt-?[45]|gemini.*pro|kimi|nova|command|gemma|writer|palmyra/i],
  ['fast', 'respuestas rápidas', /mini|nano|flash|lite|small|haiku|\b[1-9]b\b|instant|fast|mercury|tiny/i],
  ['vision', 'ver imágenes y PDF', null],
  ['long', 'textos muy largos', null],
  ['lang', 'español y otros idiomas', /qwen|aya|mistral|gemma|glm|deepseek|llama-4|gemini|command-a/i],
  ['math', 'matemáticas', /math|qwq|deepseek-r|\bo4\b|minerva|mathstral/i]
];
const EXP_LABEL = Object.fromEntries(EXP.map(([k, l]) => [k, l]));
function expertOf(m){
  if (!m) return { tags:[], line:'' };
  const hay = (m.id + ' ' + m.name + ' ' + (m.desc || '')).toLowerCase(), tags = [];
  EXP.forEach(([k, , re]) => {
    if (k === 'vision' ? m.vision : k === 'long' ? m.ctx >= 200000 : k === 'reason' ? (m.reasoning || re.test(hay)) : re.test(hay)) tags.push(k);
  });
  if (!tags.length) return { tags, line:'Uso general' };          /* sin datos de especialidad: no inventamos una */
  const order = ['code', 'reason', 'vision', 'math', 'write', 'long', 'fast', 'lang'];
  tags.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const top = tags.slice(0, 2).map(k => EXP_LABEL[k]);
  return { tags, line:'Experta en ' + (top.length > 1 ? top[0] + ' y ' + top[1] : top[0]) };
}
/* ---------- encuesta: elige las IA que mejor te sirven ---------- */
const SURVEY = [
  { k:'uses', get q(){ return '¿Para qué vas a usar ' + BRAND() + '?'; }, sub:'Elige todas las que quieras.', multi:true, o:[['code', '💻', 'Programar'], ['write', '✍️', 'Escribir y redactar'], ['study', '📚', 'Estudiar y tareas'], ['ideas', '💡', 'Ideas y trabajo'], ['vision', '🖼️', 'Imágenes y PDF'], ['chat', '💬', 'Charlar']] },
  { k:'pace', q:'¿Qué prefieres?', o:[['fast', '⚡', 'Respuestas al instante'], ['mid', '⚖️', 'Equilibrio'], ['deep', '🧠', 'Que piense bien antes']] },
  { k:'lang', q:'¿En qué idioma vas a hablar más?', o:[['es', '🇨🇴', 'Español'], ['en', '🇺🇸', 'Inglés'], ['both', '🌎', 'Los dos']] },
  { k:'key', q:'¿Tienes cuenta de Puter?', sub:'Conecta tu versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini.', o:[['pu', '✨', 'Sí, o quiero conectarla'], ['no', '🙅', 'No, por ahora no'], ['idk', '🤔', 'No sé qué es']] }
];
function surveyScore(m, s){
  if (!s || !s.a) return 0;
  const a = s.a, ex = expertOf(m).tags, has = k => ex.includes(k);
  let sc = 0;
  (a.uses || []).forEach(u => { if (u === 'code' && has('code')) sc += 30; if (u === 'write' && has('write')) sc += 18; if (u === 'study' && (has('reason') || has('long'))) sc += 14; if (u === 'ideas' && (has('write') || has('reason'))) sc += 10; if (u === 'vision' && has('vision')) sc += 30; if (u === 'chat' && (has('fast') || has('write'))) sc += 10; });
  if (a.pace === 'fast' && has('fast')) sc += 22; if (a.pace === 'fast' && has('reason')) sc -= 6;
  if (a.pace === 'deep' && has('reason')) sc += 22; if (a.pace === 'deep' && has('fast')) sc -= 8;
  if ((a.lang === 'es' || a.lang === 'both') && has('lang')) sc += 8;
  if (a.key === 'no' && /^pu:/.test(m.id)) sc -= 20;
  if (a.key === 'pu' && /^pu:/.test(m.id)) sc += 8;
  if (/^sz:/.test(m.id)) sc += 6;
  if (/apodex|gpt-5\.6-luna/i.test(m.id)) sc += 6;
  return sc;
}
function surveyPicks(list, s, n){ if (!s || !s.a || !list.length) return []; return list.filter(m => m.free || /^pu:/.test(m.id)).map(m => [m, surveyScore(m, s)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, n || 6).map(x => x[0].id); }
function surveyModal(done, opts){
  opts = opts || {};
  if ($('#svm')) return;
  const ans = Object.assign({ uses:[] }, (state.survey && state.survey.a) || {});
  let i = 0;
  const o = document.createElement('div'); o.id = 'svm'; o.className = 'szm';
  o.innerHTML = '<div class="tcard sv" role="dialog" aria-modal="true" aria-label="Encuesta"><div class="word">' + zWord('Synth') + '</div><div class="tn"></div><div class="tb"><h3></h3><p class="svsub"></p><div class="svo"></div></div><div class="tdots">' + SURVEY.map(() => '<i></i>').join('') + '</div><div class="tbtn"><button class="lnk" type="button" data-skip>' + (opts.first ? 'Ahora no' : 'Cerrar') + '</button><span style="flex:1"></span><button class="lnk" type="button" data-back>Atrás</button><button class="btn sm" type="button" data-next>Siguiente</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const card = $('.tcard', o);
  card.animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  const show = (anim, dir) => {
    const s = SURVEY[i], last = i === SURVEY.length - 1;
    const set = () => {
      $('.tn', card).textContent = 'TUS IA · ' + (i + 1) + ' / ' + SURVEY.length;
      $('h3', card).textContent = s.q; $('.svsub', card).textContent = s.sub || ''; $('.svsub', card).style.display = s.sub ? '' : 'none';
      $('.svo', card).innerHTML = s.o.map(([v, e, l]) => { const on = s.multi ? (ans[s.k] || []).includes(v) : ans[s.k] === v; return '<button type="button" class="svb" data-v="' + v + '" aria-pressed="' + on + '"><span class="e">' + e + '</span><span>' + l + '</span></button>'; }).join('');
      $$('.tdots i', card).forEach((d, k) => d.classList.toggle('on', k === i));
      $('[data-back]', card).style.visibility = i ? 'visible' : 'hidden';
      $('[data-next]', card).textContent = last ? 'Ver mis IA' : 'Siguiente';
    };
    if (!anim){ set(); return; }
    swapDir($('.tb', card), dir || 1, set);
  };
  $('.svo', card).addEventListener('click', e => {
    const b = e.target.closest('.svb'); if (!b) return; const s = SURVEY[i], v = b.dataset.v;
    if (s.multi){ const L = ans[s.k] || (ans[s.k] = []); const j = L.indexOf(v); if (j > -1) L.splice(j, 1); else L.push(v); b.setAttribute('aria-pressed', String(j < 0)); }
    else { ans[s.k] = v; $$('.svb', card).forEach(x => x.setAttribute('aria-pressed', String(x === b))); setTimeout(() => { if (i < SURVEY.length - 1){ i++; show(true); } }, 260); }
  });
  const close = saved => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); if (done) done(saved); };
  $('[data-skip]', card).addEventListener('click', () => close(false));
  $('[data-back]', card).addEventListener('click', () => { if (i > 0){ i--; show(true, -1); } });
  $('[data-next]', card).addEventListener('click', () => {
    if (i < SURVEY.length - 1){ i++; show(true); return; }
    state.survey = { a:ans, t:Date.now() }; save(); toast('¡Listo! Ya sé qué IA te van a servir más.'); close(true);
  });
  show(false);
}
/* ---------- guía: cómo conseguir y pegar tu llave de OpenRouter ---------- */
function orGuide(onKey){
  if ($('#org')) return;
  const o = document.createElement('div'); o.id = 'org'; o.className = 'szm';
  const step = (n, t, d, art) => '<div class="ogs"><i class="ogn">' + n + '</i><div><b>' + t + '</b><p>' + d + '</p>' + (art || '') + '</div></div>';
  o.innerHTML = '<div class="tcard og" role="dialog" aria-modal="true" aria-label="Cómo conectar OpenRouter"><div class="word">' + zWord('Synth') + '</div><div class="tn">OPENROUTER · 3 MINUTOS</div><div class="tb"><h3>Desbloquea OpenRouter</h3><p>OpenRouter te da cientos de IA gratis con una llave personal. Así la consigues:</p></div>'
    + step(1, 'Crea tu cuenta gratis', 'Entra a openrouter.ai y regístrate (puedes usar Google).', '<a class="lnk" href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">Abrir openrouter.ai ↗</a>')
    + step(2, 'Crea una llave', 'Ve a <b>Keys</b> y pulsa <b>Create Key</b>. Ponle de nombre «SymphorIA» y, si quieres, un límite de crédito de 0.', '<div class="ogk"><span>Keys</span><span class="pr">+ Create Key</span></div>')
    + step(3, 'Cópiala y pégala aquí', 'Empieza por <code>sk-or-</code>. Solo se muestra una vez, guárdala.', '<div class="cbox"><input id="ogKey" type="text" data-sec="1" placeholder="sk-or-…" autocomplete="off" data-lpignore="true" data-1p-ignore data-form-type="other" spellcheck="false"><button class="btn sm" id="ogGo" type="button">Conectar</button></div>')
    + '<p class="cnote">Tu llave se guarda en este navegador y solo viaja a OpenRouter. ¿No quieres crear una? Pídele a alguien de tu equipo que te comparta su OpenRouter desde «Tu cuenta».</p>'
    + '<div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Ahora no</button><a class="btn sm ghost" href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">Ir a mis llaves ↗</a></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  $('.tcard', o).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  const go = async () => {
    const k = $('#ogKey', o).value.trim(), b = $('#ogGo', o);
    if (!/^sk-or-/.test(k)){ toast('La llave empieza por sk-or-. Revisa que la copiaste completa.'); return; }
    const prev = state.keys.openrouter; state.keys.openrouter = k; b.textContent = 'Verificando…'; b.disabled = true;
    try{ await verify(byId('openrouter')); save(); close(); toast('¡OpenRouter desbloqueado!'); if (onKey) onKey(); }
    catch(e){ if (prev) state.keys.openrouter = prev; else delete state.keys.openrouter; save(); b.textContent = 'Conectar'; b.disabled = false; toast(e.message || 'No pude verificar la llave.'); }
  };
  $('#ogGo', o).addEventListener('click', go);
  $('#ogKey', o).addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); go(); } });
}
/* ---------- perfil personalizado ---------- */
const EMOJIS = ['✨', '🚀', '🦊', '🐼', '🌙', '🔥', '🎧', '🎮', '🌸', '🧠', '⚡', '🐉', '🍀', '🎨', '🛸', '👾'];
function profileModal(onSave){
  if ($('#pfm') || !ACC.ready) return;
  const u = ACC.user || {}, p0 = ACC.profile || {};
  const d = { name:p0.name || u.name || '', bio:p0.bio || '', pronouns:p0.pronouns || '', status:p0.status || '', color:p0.color || 'aurora', banner:p0.banner || p0.color || 'aurora', avatar:p0.avatar || { type:u.picture ? 'google' : 'initial' } };
  const o = document.createElement('div'); o.id = 'pfm'; o.className = 'szm';
  o.innerHTML = '<div class="tcard pf" role="dialog" aria-modal="true" aria-label="Editar perfil"><div class="pfprev"></div>'
    + '<div class="pfgrid"><label>Nombre<input id="pfName" maxlength="40"></label><label>Pronombres<input id="pfPro" maxlength="20" placeholder="opcional"></label></div>'
    + '<label class="pfl">Estado<input id="pfSt" maxlength="60" placeholder="Ej: aprendiendo a programar 🧑‍💻"></label>'
    + '<label class="pfl">Sobre ti<textarea id="pfBio" maxlength="160" rows="2" placeholder="Algo corto sobre ti"></textarea></label>'
    + '<div class="cfglbl">Foto</div><div class="pfav">' + (u.picture ? '<button type="button" data-av="google">Mi foto de Google</button>' : '') + '<button type="button" data-av="initial">Mi inicial</button></div><div class="pfemo">' + EMOJIS.map(e => '<button type="button" data-emo="' + e + '">' + e + '</button>').join('') + '</div>'
    + '<div class="cfglbl">Color</div><div class="pfcol">' + Object.keys(TINTS).map(k => '<button type="button" data-col="' + k + '" style="background:' + grad(k) + '" aria-label="' + k + '" title="' + k + '"></button>').join('') + '</div>'
    + '<div class="tbtn" style="margin-top:16px"><button class="lnk" type="button" data-close>Cancelar</button><button class="btn sm" type="button" id="pfOk">Guardar perfil</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  $('.tcard', o).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  const prev = () => {
    $('.pfprev', o).innerHTML = '<div class="pfban" style="background:' + grad(d.banner) + '"></div><div class="pfme">' + avatarHtml(d, u, 'xl') + '<div><b>' + esc(d.name || 'Tu nombre') + '</b>' + (d.pronouns ? '<i>' + esc(d.pronouns) + '</i>' : '') + '<span>' + esc(u.email || '') + '</span></div></div>' + (d.status ? '<p class="szps">' + esc(d.status) + '</p>' : '') + (d.bio ? '<p class="pfb">' + esc(d.bio) + '</p>' : '');
    $$('[data-col]', o).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.col === d.color)));
    $$('[data-av]', o).forEach(b => b.setAttribute('aria-pressed', String(d.avatar.type === b.dataset.av)));
    $$('[data-emo]', o).forEach(b => b.setAttribute('aria-pressed', String(d.avatar.type === 'emoji' && d.avatar.emoji === b.dataset.emo)));
  };
  [['#pfName', 'name'], ['#pfPro', 'pronouns'], ['#pfSt', 'status'], ['#pfBio', 'bio']].forEach(([s, k]) => { const el = $(s, o); el.value = d[k]; el.addEventListener('input', () => { d[k] = el.value; prev(); }); });
  o.addEventListener('click', e => {
    const c = e.target.closest('[data-col]'); if (c){ d.color = d.banner = c.dataset.col; prev(); return; }
    const a = e.target.closest('[data-av]'); if (a && !a.disabled){ d.avatar = { type:a.dataset.av }; prev(); return; }
    const m = e.target.closest('[data-emo]'); if (m){ d.avatar = { type:'emoji', emoji:m.dataset.emo }; prev(); }
  });
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $('#pfOk', o).addEventListener('click', async () => {
    const b = $('#pfOk', o); b.textContent = 'Guardando…'; b.disabled = true;
    try{ await saveProfile(d); toast('Perfil guardado.'); close(); if (onSave) onSave(); }catch(e){ b.textContent = 'Guardar perfil'; b.disabled = false; toast(e.message || 'No pude guardar tu perfil.'); }
  });
  prev();
}
/* ---------- el navegador no debe rellenar tu usuario o contraseña en buscadores ni en las cajas de llaves ----------
   Solo los campos de entrar/crear cuenta (autocomplete username / current-password / new-password) aceptan autorrelleno. */
(function noAutofill(){
  const CRED = /^(username|current-password|new-password|email)$/;
  const isCred = el => CRED.test(el.getAttribute('autocomplete') || '');
  const tame = el => {
    if (el._szAf || isCred(el) || !/^(INPUT|TEXTAREA)$/.test(el.tagName) || /^(checkbox|radio|file|hidden|range|color|submit|button)$/i.test(el.type)) return;
    el._szAf = 1;
    if (!el.hasAttribute('autocomplete')) el.setAttribute('autocomplete', 'off');
    el.setAttribute('data-lpignore', 'true'); el.setAttribute('data-1p-ignore', ''); el.setAttribute('data-form-type', 'other');
    let typed = false;
    el.addEventListener('keydown', () => { typed = true; });
    el.addEventListener('paste', () => { typed = true; });
    /* si Chrome lo rellena solo, se borra (no fue la persona) */
    el.addEventListener('animationstart', e => { if (e.animationName === 'szAutofill' && !typed){ el.value = ''; el.dispatchEvent(new Event('input', { bubbles:true })); } });
  };
  const scan = root => { if (root.querySelectorAll) root.querySelectorAll('input,textarea').forEach(tame); if (root.tagName) tame(root); };
  const go = () => { scan(document); new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && scan(n)))).observe(document.documentElement, { childList:true, subtree:true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  const st = document.createElement('style');
  st.textContent = '@keyframes szAutofill{from{opacity:1}to{opacity:1}}input:-webkit-autofill:not([autocomplete=username]):not([autocomplete=current-password]):not([autocomplete=new-password]):not([autocomplete=email]){animation:szAutofill .01s}input[data-sec]{-webkit-text-security:disc;text-security:disc}';
  (document.head || document.documentElement).appendChild(st);
})();
/* ---------- v2.3 · SynthFlow como app: se instala desde el navegador (sin tiendas) ----------
   - El «trabajador» (sw.js) no guarda la página: todo llega siempre fresco de internet. Solo guarda la pantalla de «sin conexión».
   - En el celular, una vez cada 7 días, sale «Descarga nuestra app SynthFlow».
   - v2.9: la ventana es de vidrio, con un celular dibujado en código (sin el video viejo). Cuando haya video nuevo,
     basta con poner su ruta en APP_VIDEO y se ve dentro de la pantalla del celular.
   - v3.0: ya está el video de Sammuel (20 s, 768 × 432, sin sonido, 1,4 MB). Es horizontal, así que la ventana lo muestra
     entero en una pantalla 16:9 de vidrio en vez del celular; mientras carga se ve su póster.
   - Android/Chrome: botón «Instalar» de verdad. iPhone: pasos con dibujos (Compartir › Agregar a inicio). */
const APP = { evt:null, done:false };
const APP_VIDEO = '/media/app/synthflow-app.mp4?v=30', APP_POSTER = '/media/app/synthflow-app.webp?v=30';
const appStandalone = () => { try{ return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }catch(e){ return false; } };
const appIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const appPhone = () => { try{ return matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) <= 820; }catch(e){ return false; } };
try{
  if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { scope:'/' }).catch(() => {}));
  if (window.caches) caches.keys().then(ks => ks.filter(k => /^synthz-/.test(k)).forEach(k => caches.delete(k))).catch(() => {});   /* restos de la versión vieja */
}catch(e){}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); APP.evt = e; });
addEventListener('appinstalled', () => { APP.done = true; APP.evt = null; try{ localStorage.setItem('synthz:appok', '1'); }catch(e){} const o = document.getElementById('appPromo'); if (o && o._close) o._close(); toast('¡Listo! SynthFlow quedó en tu pantalla de inicio.'); });
if (appStandalone()) root.classList.add('isapp');

function appSteps(box){
  const ios = appIOS();
  const share = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  const dots = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="5" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="12" cy="19" r="1.9"/></svg>';
  box.innerHTML = '<ol class="ap-steps">' + (ios
    ? '<li><span class="ap-n">1</span><span>Toca <b>Compartir</b> <i class="ap-k">' + share + '</i> abajo en Safari.</span></li><li><span class="ap-n">2</span><span>Baja y toca <b>Agregar a inicio</b>.</span></li><li><span class="ap-n">3</span><span>Toca <b>Agregar</b>. SynthFlow aparece junto a tus apps.</span></li>'
    : '<li><span class="ap-n">1</span><span>Toca el menú <i class="ap-k">' + dots + '</i> de tu navegador (arriba a la derecha).</span></li><li><span class="ap-n">2</span><span>Toca <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.</span></li><li><span class="ap-n">3</span><span>Confirma. SynthFlow aparece junto a tus apps.</span></li>') + '</ol>';
}
async function appInstall(fromBox){
  if (appStandalone()){ toast('Ya estás usando la app SynthFlow.'); return true; }
  if (APP.evt){
    const e = APP.evt; APP.evt = null;
    try{ e.prompt(); const r = await e.userChoice; if (r && r.outcome === 'accepted') return true; toast('Cuando quieras, la instalas desde aquí.'); return false; }catch(x){}
  }
  if (fromBox){ appSteps(fromBox); return false; }
  appPromo(true); return false;
}
function appPromo(force){
  if ($('#appPromo') || appStandalone()) return;
  if (!force){
    if (!appPhone()) return;
    /* v2.6: no interrumpe la primera visita: se ofrece desde la tercera vez que abres SymphorIA (y una vez por semana) */
    try{ if (localStorage.getItem('synthz:appok')) return; if ((+localStorage.getItem('synthz:loads') || 0) < 3) return; const t = +localStorage.getItem('synthz:apppromo') || 0; if (Date.now() - t < 7 * 864e5) return; }catch(e){ return; }
    if (document.querySelector('.szm.on, #ptour, #guide, #szMaint, .tcard[role="dialog"]')) return;   /* no interrumpe otra ventana */
  }
  try{ localStorage.setItem('synthz:apppromo', String(Date.now())); }catch(e){}
  const o = document.createElement('div'); o.id = 'appPromo'; o.className = 'appp';
  const ios = appIOS(), canPrompt = !!APP.evt;
  const I = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  /* v2.9.1 · el video no se baja hasta que se abre esta ventana; con «ahorro de datos» o movimiento reducido no arranca solo */
  const lite = reduce || !!(navigator.connection && navigator.connection.saveData);
  const scr = APP_VIDEO ? '<video muted playsinline loop' + (lite ? ' controls' : ' autoplay') + ' preload="none" poster="' + APP_POSTER + '" width="768" height="432" aria-label="SynthFlow en acción"><source src="' + APP_VIDEO + '" type="video/mp4"></video>'
    /* v2.9: la pantalla es la SynthFlow de hoy en el celular: esfera, plan, la pregunta, el cuadro con «Automática» y la barra de abajo */
    : '<span class="ap-top">' + flowOrb() + '<b>SynthFlow</b><i class="ap-dots"></i></span><span class="ap-chip"><i></i>Gratis · 5 mensajes</span>'
      + '<span class="ap-q">¿Qué quieres<br><em>FlowIA’r</em> hoy?</span>'
      + '<span class="ap-m me"></span><span class="ap-m ai"><i></i><i></i><i></i></span>'
      + '<span class="ap-in"><span class="ap-auto">Automática</span><i></i></span>'
      + '<span class="ap-tabs"><i></i><i></i><i class="ring"></i><i></i><i></i></span>';
  o.innerHTML = '<div class="ap-card" role="dialog" aria-modal="true" aria-label="Descarga la app SynthFlow">'
    + '<div class="ap-hero' + (APP_VIDEO ? ' vid' : '') + '" aria-hidden="true"><i class="ap-glow"></i>' + (APP_VIDEO ? '<div class="ap-tv">' + scr + '</div>' : '<div class="ap-phone"><div class="ap-scr">' + scr + '</div></div>')
    + '<span class="ap-ico"><img src="/media/app/sf-192.png?v=29" alt="" width="54" height="54"></span><i class="ap-sp s1"></i><i class="ap-sp s2"></i><i class="ap-sp s3"></i></div>'
    + '<div class="ap-body"><span class="ap-kick">App gratis · sin tiendas</span><h3>Descarga nuestra app <em>SynthFlow</em></h3>'
    + '<ul class="ap-why"><li><i>' + I('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>') + '</i><span><b>Va más fluida</b>: a pantalla completa, sin pestañas ni barra del navegador.</span></li>'
    + '<li><i>' + I('<path d="M2 12c2.5-4 5-4 7.5 0s5 4 7.5 0 3.5-3 5-1"/><path d="M2 18c2.5-4 5-4 7.5 0s5 4 7.5 0 3.5-3 5-1" opacity=".5"/>') + '</i><span><b>Más Flow</b>: tus chats y SuperiorSynth a un toque, desde tu pantalla de inicio.</span></li>'
    + '<li><i>' + I('<path d="M20 4C10 4 5 10 4 20"/><path d="M20 4c0 8-5 12-12 12"/>') + '</i><span><b>Pesa casi nada</b> y siempre está al día: se instala desde aquí mismo.</span></li></ul>'
    + '<div class="ap-how"></div>'
    + '<div class="ap-acts"><button type="button" class="lnk" data-ap="no">Ahora no</button><button type="button" class="btn ap-go" data-ap="go">' + (canPrompt ? 'Instalar SynthFlow' : ios ? 'Ver cómo instalarla' : 'Instalar SynthFlow') + '</button></div></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const v = $('video', o); if (v){ v.play().catch(() => {}); v.addEventListener('error', () => v.remove(), true); }
  const close = () => { if (!o.isConnected) return; o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  o._close = close;
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $('[data-ap="no"]', o).addEventListener('click', close);
  $('[data-ap="go"]', o).addEventListener('click', async e => { const b = e.currentTarget; const ok = await appInstall($('.ap-how', o)); if (ok) close(); else if (!APP.evt){ b.textContent = 'Entendido'; b.dataset.ap = 'no'; b.onclick = close; } });   /* v2.6: currentTarget se borra después del await; se guarda antes */
  addEventListener('keydown', function k(e){ if (e.key === 'Escape'){ close(); removeEventListener('keydown', k); } });
}
/* en el celular, un ratico después de entrar (nunca encima de otra ventana) */
try{ localStorage.setItem('synthz:loads', String((+localStorage.getItem('synthz:loads') || 0) + 1)); }catch(e){}
if (!appStandalone() && !/pulsem/.test(location.pathname)) setTimeout(() => { try{ appPromo(false); }catch(e){} }, 24000);
/* ---------- v2.2 · etiquetas al pasar el mouse: cada botón con ícono dice qué hace (como en Claude) ---------- */
if (matchMedia('(hover: hover) and (pointer: fine)').matches){
  let tipEl = null, tipT = 0, tipFor = null;
  const hide = () => { clearTimeout(tipT); tipFor = null; if (tipEl) tipEl.classList.remove('on'); };
  addEventListener('pointerover', e => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t || t === tipFor) return;
    if (t.closest('.rail:not(.open)') || t.closest('.ctxm')) return hide();
    hide(); tipFor = t;
    tipT = setTimeout(() => {
      if (!t.isConnected || tipFor !== t) return;
      if (!tipEl){ tipEl = document.createElement('div'); tipEl.className = 'sztip'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl); }
      tipEl.textContent = t.dataset.tip; tipEl.classList.remove('on');
      const r = t.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      let y = r.top - h - 8; if (y < 6) y = r.bottom + 8;
      tipEl.style.left = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2)) + 'px'; tipEl.style.top = y + 'px';
      requestAnimationFrame(() => tipEl && tipEl.classList.add('on'));
    }, 380);
  });
  addEventListener('pointerout', e => { if (tipFor && !(e.relatedTarget && tipFor.contains(e.relatedTarget))) hide(); });
  addEventListener('pointerdown', hide, true); addEventListener('scroll', hide, true); addEventListener('keydown', hide);
}
/* ===== v2.4 · fondo espacial: brillos grandes, estrellas con destellos dorados, cintas de neón y burbujas de vidrio =====
   Vive dentro de .aurora (así «Fondo animado» en Ajustes lo apaga igual que antes). Cada página tiene su variante. */
const SPACE = (() => {
  const au = document.querySelector('.aurora'); if (!au) return null;
  const path = location.pathname;
  const kind = /chat(\.html)?$/.test(path) || document.getElementById('composer') ? 'chat'
    : /pulsem/.test(path) ? 'pulsem' : /alias/.test(path) ? 'alias' : 'home';
  /* x, y en vw/vh; c = color del tema; s = escala */
  const V = {
    home:   { glows:[{ x:100, y:0, c:'light' }, { x:0, y:100, c:'secondary' }, { x:58, y:42, c:'primary', s:.7 }], ribbon:'mid', bubbles:[{ x:4, y:62, d:110 }, { x:63, y:8, d:70 }, { x:92, y:46, d:52 }, { x:46, y:82, d:30 }] },
    chat:   { glows:[{ x:100, y:0, c:'primary' }, { x:0, y:100, c:'light', s:.8 }], ribbon:'low', dim:.55, density:.6, bubbles:[{ x:94, y:78, d:46 }] },
    alias:  { glows:[{ x:50, y:50, c:'primary', s:1.1 }, { x:0, y:100, c:'secondary' }, { x:100, y:0, c:'light' }], ribbon:'mid', dim:.8, bubbles:[{ x:22, y:22, d:60 }, { x:80, y:70, d:80 }] },
    pulsem: { glows:[{ x:100, y:0, c:'primary' }, { x:0, y:100, c:'light' }], ribbon:'none', dim:.45, density:.5, bubbles:[] }
  }[kind];

  const root = document.createElement('div');
  root.className = 'sb-root'; root.setAttribute('aria-hidden', 'true'); root.dataset.kind = kind;
  root.style.setProperty('--dim', V.dim || 1);
  const pos = o => '--x:' + o.x + ';--y:' + o.y + ';--s:' + (o.s || 1);
  /* cintas: 5 tiras paralelas que cruzan la pantalla como en el boceto (violeta, rosa, naranja, oro y una línea cian fina) */
  const RIB = [['primary', 0, 13], ['secondary', 14, 11], ['warm', 26, 9], ['spark', 36, 6], ['light', 44, 2.4]];
  const ribbon = y0 => RIB.map(([c, o, w], i) => {
    const y = y0 + o;
    const d = 'M-120 ' + (y + 120) + 'C220 ' + (y + 40) + ' 420 ' + (y + 190) + ' 760 ' + (y + 90) + 'S1240 ' + (y - 130) + ' 1600 ' + (y - 40);
    return '<path class="rb rb' + i + '" d="' + d + '" stroke="var(--sb-' + c + ')" stroke-width="' + w + '"/>';
  }).join('');
  const ribY = { mid:330, low:470 }[V.ribbon];
  root.innerHTML = '<div class="sb-base"></div>'
    + '<div class="sb-layer" style="--k:.35">' + V.glows.map((g, i) => '<div class="sb-pos" style="' + pos(g) + '"><div class="sb-glow" style="--c:var(--sb-' + g.c + ');animation-delay:' + (-i * 7) + 's"></div></div>').join('') + '</div>'
    + '<canvas class="sb-canvas"></canvas>'
    + (ribY ? '<div class="sb-layer sb-rib" style="--k:.7"><svg viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice" fill="none" stroke-linecap="round"><g class="rb-glow">' + ribbon(ribY) + '</g><g class="rb-sharp">' + ribbon(ribY) + '</g></svg></div>' : '')
    + '<div class="sb-layer" style="--k:1.4">' + V.bubbles.map((b, i) => '<div class="sb-pos" style="' + pos(b) + '"><div class="sb-bubble" style="--d:' + b.d + 'px;animation-delay:' + (-i * 3) + 's"></div></div>').join('') + '</div>';
  au.appendChild(root);

  /* estrellas: puntitos que titilan y unos pocos destellos dorados que suben muy despacio */
  const cv = root.querySelector('.sb-canvas'), ctx = cv.getContext('2d');
  let w = 0, h = 0, S = [], raf = 0, sc = 0, still = reduce || PERF;
  const col = n => getComputedStyle(document.documentElement).getPropertyValue('--sb-' + n).trim() || '#fff';
  let pal = [], gold = '#ffc857';
  const paint = () => { pal = [col('text'), col('light')]; gold = col('spark'); S.forEach(s => { s.c = s.g ? gold : pal[s.k % pal.length]; }); };
  const init = () => {
    if (document.documentElement.classList.contains('au8on')) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.clientWidth || innerWidth; h = cv.clientHeight || innerHeight; cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* determinístico: siempre el mismo cielo para la misma pantalla */
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const n = Math.round(w * h / 9000 * (V.density || 1));
    S = Array.from({ length:n }, (_, k) => { const g = rnd() < .22; return { x:rnd() * w, y:rnd() * h, z:.25 + rnd() * .75, g, k, r:g ? .8 + rnd() * 1.2 : .3 + rnd() * 1.1, ph:rnd() * 6.28, sp:.4 + rnd() * 1.4 }; });
    paint();
  };
  /* las estrellas titilan despacio: con 30 cuadros por segundo se ven igual y la página trabaja la mitad */
  let last = -1e9;
  const draw = t => {
    raf = 0;
    /* v2.9: con el cielo en vivo (core 25h) sus estrellas ya están; este lienzo no se dibuja (era un segundo cielo a 30 cuadros) */
    if (document.documentElement.classList.contains('au8on')){ if (cv.width > 1){ cv.width = cv.height = 1; } return; }   /* y suelta su memoria */
    if (!still && t - last < 33){ if (!document.hidden && CFG.bg && !document.documentElement.classList.contains('sb-off')) raf = requestAnimationFrame(draw); return; }
    last = t; ctx.clearRect(0, 0, w, h);
    for (const s of S){
      const y = (((s.y - sc * s.z * .12 - (s.g ? t * .004 : 0)) % h) + h) % h;
      const tw = still ? .8 : .5 + .5 * Math.sin(t / 1000 * s.sp + s.ph);
      ctx.globalAlpha = (.2 + .8 * tw) * s.z;
      ctx.fillStyle = s.c;
      ctx.beginPath(); ctx.arc(s.x, y, s.r * s.z * 1.3, 0, 6.283); ctx.fill();
      if (s.g && tw > .92 && s.r > 1.4){ ctx.globalAlpha *= .5; ctx.fillRect(s.x - 4, y - .4, 8, .8); ctx.fillRect(s.x - .4, y - 4, .8, 8); }
    }
    if (!still && !document.hidden && CFG.bg && !document.documentElement.classList.contains('sb-off')) raf = requestAnimationFrame(draw);
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(draw); };
  init(); go();
  addEventListener('resize', () => { init(); go(); });
  addEventListener('scroll', () => { sc = scrollY; if (still) go(); }, { passive:true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) go(); });

  /* paralaje leve con el mouse y el scroll: un solo cuadro por evento, solo variables CSS */
  let pr = 0, mx = 0, my = 0;
  const push = () => { pr = 0; const max = Math.max(1, document.documentElement.scrollHeight - innerHeight); root.style.setProperty('--sy', scrollY); root.style.setProperty('--p', Math.min(1, scrollY / max).toFixed(3)); root.style.setProperty('--mx', mx.toFixed(2)); root.style.setProperty('--my', my.toFixed(2)); };
  const req = () => { if (!pr) pr = requestAnimationFrame(push); };
  addEventListener('scroll', req, { passive:true });
  if (!reduce && matchMedia('(pointer: fine)').matches) addEventListener('pointermove', e => { mx = (e.clientX / innerWidth - .5) * 14; my = (e.clientY / innerHeight - .5) * 2; req(); }, { passive:true });
  push();
  return { root, repaint:() => { paint(); go(); }, wake:go };
})();
/* ---------- v2.7 · íconos de vidrio, dibujados en código (SVG) ----------
   Parecidos a los del boceto: un dibujo de neón (relleno de vidrio, trazo en degradado y su brillo)
   sobre una ficha de vidrio casi transparente con el filo iridiscente. No son imágenes: pesan casi nada,
   se ven nítidos en cualquier tamaño y se mueven un poco cuando pasas el mouse por su tarjeta.
   En el HTML: <i class="gi" data-gi="rayo"></i>; con data-gt="0" va sin ficha. giFill(raíz) los dibuja.
   Todos usan el mismo lienzo de 64 × 64, por eso los degradados se comparten (userSpaceOnUse). */
const GI_COL = { C:['#f0feff', '#3de0ff', '#3a7bff'], V:['#ece4ff', '#9b7bff', '#ff3d9a'], O:['#ffe6b8', '#ff9a3d', '#ff3d9a'], P:['#ffd6ec', '#ff3d9a', '#8b5cff'],
  G:['#dcffee', '#3ddc97', '#139e8c'], B:['#dde9ff', '#5b8cff', '#7b3ff2'], R:['#ffd6dc', '#ff4d6d', '#c2185b'], Y:['#fff4cc', '#ffc857', '#ff7a45'], W:['#ffffff', '#cfe9ff', '#8fa3d9'] };
/* el color del brillo de cada uno */
const GI_GLOW = { C:'rgba(61,224,255,.8)', V:'rgba(155,123,255,.8)', O:'rgba(255,140,70,.8)', P:'rgba(255,61,154,.75)', G:'rgba(61,220,151,.75)', B:'rgba(91,140,255,.8)', R:'rgba(255,77,109,.8)', Y:'rgba(255,200,87,.75)', W:'rgba(207,233,255,.7)', M:'rgba(155,123,255,.8)' };
(function giDefs(){
  if (document.getElementById('giDefs')) return;
  const lin = (id, s) => '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="10" y1="6" x2="54" y2="58">' + s.map((c, i) => '<stop offset="' + (i / (s.length - 1)).toFixed(2) + '" stop-color="' + c + '"/>').join('') + '</linearGradient>';
  const d = document.createElement('div'); d.id = 'giDefs'; d.setAttribute('aria-hidden', 'true');
  d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = '<svg width="0" height="0"><defs>' + Object.keys(GI_COL).map(k => lin('gi' + k, GI_COL[k])).join('')
    + lin('giM', ['#3de0ff', '#7b3ff2', '#ff3d9a', '#ff7a45'])
    /* la ficha: vidrio que deja ver el fondo, más claro arriba; el filo con los colores de la marca */
    + '<linearGradient id="giTile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>'
    + '<linearGradient id="giEdge" gradientUnits="userSpaceOnUse" x1="4" y1="4" x2="60" y2="60"><stop offset="0" stop-color="#e6fdff" stop-opacity=".9"/><stop offset=".35" stop-color="#9b7bff" stop-opacity=".45"/><stop offset=".7" stop-color="#ff3d9a" stop-opacity=".35"/><stop offset="1" stop-color="#ffc857" stop-opacity=".7"/></linearGradient>'
    /* la onda del orbe de SynthFlow (flowOrb, core 00) */
    + '<linearGradient id="sfOrbG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3de0ff"/><stop offset=".45" stop-color="#7b3ff2"/><stop offset=".75" stop-color="#ff3d9a"/><stop offset="1" stop-color="#ff7a45"/></linearGradient>'
    + '<radialGradient id="giLow" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#bff6ff" stop-opacity=".35"/><stop offset="1" stop-color="#bff6ff" stop-opacity="0"/></radialGradient>'
    + '</defs></svg>';
  (document.body || document.documentElement).appendChild(d);
})();
/* piezas: vidrio con trazo (P), solo trazo (L), brillo blanco (H), círculo de vidrio (C) y nodo que brilla (N) */
const giP = (d, k, o, w) => '<path d="' + d + '" fill="url(#gi' + k + ')" fill-opacity="' + (o == null ? .22 : o) + '" stroke="url(#gi' + k + ')" stroke-width="' + (w || 2.6) + '"/>';
const giL = (d, k, w, cls) => '<path' + (cls ? ' class="' + cls + '"' : '') + ' d="' + d + '" fill="none" stroke="url(#gi' + k + ')" stroke-width="' + (w || 2.6) + '"/>';
const giH = d => '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.5"/>';
const giC = (x, y, r, k, o, w) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#gi' + k + ')" fill-opacity="' + (o == null ? .22 : o) + '" stroke="url(#gi' + k + ')" stroke-width="' + (w || 2.6) + '"/>';
const giN = (x, y, r, k, i) => '<g class="gi-n gi-tw" style="--i:' + i + '"><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#gi' + k + ')"/><circle cx="' + x + '" cy="' + y + '" r="' + (r * .38).toFixed(2) + '" fill="#fff"/></g>';
const GI_DOC = 'M19 7h19l13 13v32a5 5 0 0 1-5 5H19a5 5 0 0 1-5-5V12a5 5 0 0 1 5-5z', GI_FOLD = 'M38 7v9a4 4 0 0 0 4 4h9';
const GI_INF = 'M32 32C28 25 24 21 19 21a11 11 0 0 0 0 22c5 0 9-4 13-11s8-11 13-11a11 11 0 0 1 0 22c-5 0-9-4-13-11z';
const GI_BRAIN = 'M31 13c-4-3-10-2-12 2-5 0-8 4-7 8-4 2-5 8-1 11-2 4 1 9 6 9 1 4 6 6 10 4 2 1 4 0 4-1z', GI_FOLDS = 'M24 19c3 1 4 4 3 7M16 28c4-1 7 1 8 4M20 39c2-2 6-2 7 1';
/* cada ícono: [color principal, dibujo] */
const GI = {
  rayo:   ['C', () => giP('M37 6L15 36h14l-4 22 24-32H35l2-20z', 'C', .26) + giH('M32 13L20 31')],
  charla: ['C', () => giP('M20 12h24a9 9 0 0 1 9 9v13a9 9 0 0 1-9 9H31l-10 9v-9a9 9 0 0 1-10-9V21a9 9 0 0 1 9-9z', 'C', .18)
            + [23, 32, 41].map((x, i) => '<circle class="gi-dot" style="--i:' + i + '" cx="' + x + '" cy="27.5" r="3" fill="#eafcff"/>').join('') + giH('M16 21q1-4 6-5')],
  /* SuperiorSynth: la Z fina de 7 puntos */
  superior: ['O', () => giL('M14 15H50L14 49H50', 'O', 9).replace('<path', '<path stroke-opacity=".16"') + giL('M14 15H50L14 49H50', 'O', 2.2)
            + [[14, 15], [32, 15], [50, 15], [32, 32], [14, 49], [32, 49], [50, 49]].map(([x, y], i) => giN(x, y, 3.6, i % 2 ? 'Y' : 'O', i)).join('')],
  /* A.L.I.A.S.: el bucle infinito de nodos */
  alias:  ['M', () => giL(GI_INF, 'M', 8).replace('<path', '<path stroke-opacity=".16"') + '<path d="M8 32h48M19 21v22M45 21v22" stroke="#bff6ff" stroke-opacity=".3" stroke-width="1"/>'
            + giL(GI_INF, 'M', 2.3) + giL(GI_INF, 'W', 2.3, 'gi-run').replace('<path', '<path pathLength="100"')
            + [[8, 32, 'C'], [19, 21, 'C'], [19, 43, 'V'], [32, 32, 'P'], [45, 21, 'P'], [45, 43, 'O'], [56, 32, 'O']].map(([x, y, k], i) => giN(x, y, 3.3, k, i)).join('')],
  globo:  ['B', () => giC(27, 27, 16, 'B', .2) + '<path d="M11 27h32M13.5 19h27M13.5 35h27M27 11c-7 5-7 27 0 32M27 11c7 5 7 27 0 32" fill="none" stroke="url(#giB)" stroke-width="1.6" stroke-opacity=".9"/>'
            + '<g class="gi-lens">' + giL('M49 49l8 8', 'O', 5.5) + giC(43, 43, 9, 'O', .14, 2.8) + giH('M38 40q2-4 6-4') + '</g>' + giH('M16 18q4-6 11-7')],
  docimg: ['V', () => giP(GI_DOC, 'V', .15) + giL(GI_FOLD, 'V', 2) + giP('M21 25h22v15H21z', 'O', .25, 1.8) + giL('M21 40l7-8 5 5 4-4 6 7', 'O', 1.8)
            + '<circle cx="38" cy="29.5" r="2.4" fill="#ffc857"/>' + giL('M21 46h22M21 51h14', 'V', 2)],
  ppt:    ['O', () => giP(GI_DOC, 'O', .15) + giL(GI_FOLD, 'O', 2) + giC(31, 32, 10, 'O', .22, 2.2) + '<path class="gi-pie" d="M31 32V22a10 10 0 0 1 10 10z" fill="url(#giY)" stroke="#fff" stroke-opacity=".6" stroke-width="1"/>'
            + giL('M21 47h21M21 52h13', 'O', 2)],
  paleta: ['Y', () => giP('M32 11C19 11 10 19 10 30c0 10 7 17 16 17 3 0 5-2 5-4.5 0-2.2-2-3.2-2-5.2 0-2.6 2.2-4.3 5-4.3h6c8 0 13-4.5 13-11C53 17 44 11 32 11z', 'Y', .14)
            + [[20, 27, 'P'], [26, 19, 'O'], [36, 17, 'G'], [45, 22, 'C'], [18, 37, 'V']].map(([x, y, k], i) => '<circle class="gi-tw" style="--i:' + i + '" cx="' + x + '" cy="' + y + '" r="3.6" fill="url(#gi' + k + ')"/>').join('')
            + '<g class="gi-brush">' + giL('M56 8L41 25', 'B', 4.2) + giP('M41 25l-5 5c-2 2-5 2-6 6 3 0 6-1 8-3l5-5z', 'P', .8, 1.6) + '</g>'],
  voz:    ['C', () => giP('M12 25h9l13-10v34L21 39h-9z', 'C', .22) + giH('M15 28v8')
            + giL('M40 25q5 7 0 14', 'V', 2.8, 'gi-w') + giL('M45 19q9 13 0 26', 'V', 2.8, 'gi-w w2') + giL('M50 13q13 19 0 38', 'P', 2.8, 'gi-w w3')],
  cerebro: ['P', () => giP(GI_BRAIN, 'P', .2) + giL(GI_FOLDS, 'P', 1.7) + '<g transform="matrix(-1 0 0 1 64 0)">' + giP(GI_BRAIN, 'C', .2) + giL(GI_FOLDS, 'C', 1.7) + '</g>'
            + [[22, 24], [42, 22], [26, 36], [40, 38]].map(([x, y], i) => '<circle class="gi-tw" style="--i:' + i + '" cx="' + x + '" cy="' + y + '" r="1.8" fill="#fff"/>').join('')],
  nube:   ['C', () => giP('M19 47a10 10 0 0 1-1.5-19.9A14 14 0 0 1 44 23a11 11 0 0 1 2 24z', 'C', .18) + giH('M20 30q2-8 10-9')
            + '<g class="gi-sync">' + giL('M25 35a7 7 0 0 1 12-4.5M39 38a7 7 0 0 1-12 4.5', 'V', 2.2) + giL('M37.5 26.5v4.5H33M26.5 47v-4.5H31', 'V', 2.2) + '</g>'],
  celular: ['V', () => giP('M23 6h18a6 6 0 0 1 6 6v40a6 6 0 0 1-6 6H23a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z', 'V', .14) + giL('M29 11h6M29 53h6', 'V', 2)
            /* adentro, la carita de SynthonIA */
            + giC(32, 28, 9.5, 'C', .18, 1.8) + '<ellipse cx="32" cy="29" rx="6.6" ry="5.2" fill="#0b0719" stroke="#ff7ad0" stroke-opacity=".8" stroke-width=".9"/>'
            + '<g class="gi-eyes"><rect x="28.6" y="26.5" width="2.2" height="5" rx="1.1" fill="#3de0ff"/><rect x="33.2" y="26.5" width="2.2" height="5" rx="1.1" fill="#3de0ff"/></g>'
            + giP('M27 40h10a4 4 0 0 1 4 4v2H23v-2a4 4 0 0 1 4-4z', 'C', .2, 1.6)],
  lapiz:  ['O', () => giP('M44 9l11 11-29 29-14 3 3-14z', 'O', .2) + giL('M39 14l11 11', 'O', 2) + giH('M41 15L19 37') + giL('M30 56h24', 'C', 2.6, 'gi-ink').replace('<path', '<path pathLength="1"')],
  birrete: ['Y', () => giP('M17 30v10c0 4 7 8 15 8s15-4 15-8V30L32 37z', 'V', .18) + giP('M5 25L32 13l27 12-27 12z', 'Y', .24) + giH('M14 24l18-8')
            + '<g class="gi-tassel">' + giL('M52 28v12', 'O', 2) + '<circle cx="52" cy="42" r="2.6" fill="url(#giO)"/></g>'],
  codigo: ['P', () => giL('M23 19L11 32l12 13', 'P', 3.4) + giL('M41 19l12 13-12 13', 'C', 3.4) + giL('M36 13l-8 38', 'V', 2.6, 'gi-slash')],
  imagen: ['V', () => giP('M10 14h44a5 5 0 0 1 5 5v26a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V19a5 5 0 0 1 5-5z', 'V', .14) + giP('M7 47l15-17 10 10 7-7 18 14z', 'P', .32, 2)
            + '<circle class="gi-sun" cx="44" cy="25" r="4.2" fill="url(#giY)"/>' + giH('M10 19q0-2 3-2')],
  estrella: ['M', () => '<g class="gi-star">' + giP('M28 6c2 13 6 17 19 19-13 2-17 6-19 19-2-13-6-17-19-19 13-2 17-6 19-19z', 'M', .3, 2.2) + '</g>'
            + giP('M48 36c1 7 3 9 10 10-7 1-9 3-10 10-1-7-3-9-10-10 7-1 9-3 10-10z', 'C', .4, 1.8) + '<circle class="gi-tw" cx="13" cy="50" r="2.4" fill="url(#giO)"/>'],
  balanza: ['Y', () => giL('M32 13v37', 'Y', 2.8) + giP('M23 51h18l-2 5H25z', 'Y', .4, 2) + '<g class="gi-beam">' + giL('M12 19h40', 'Y', 2.8)
            + '<path d="M12 19L6 34M12 19l6 15M52 19l-6 15M52 19l6 15" stroke="url(#giY)" stroke-width="1.3" fill="none"/>' + giP('M4 34h16a8 5 0 0 1-16 0z', 'C', .35, 2) + giP('M44 34h16a8 5 0 0 1-16 0z', 'P', .35, 2) + '</g>'
            + '<circle cx="32" cy="12" r="3.4" fill="url(#giY)"/>']
};
/* un ícono: ficha (si tile) + dibujo con su brillo */
function gIcon(name, tile){
  const g = GI[name]; if (!g) return '';
  const k = g[0], body = '<g class="gi-g" style="--gg:' + GI_GLOW[k] + '" stroke-linecap="round" stroke-linejoin="round">' + g[1]() + '</g>';
  return '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">'
    + (tile === false ? body
      : '<rect x="3" y="3" width="58" height="58" rx="17" fill="url(#giTile)"/><rect x="3" y="3" width="58" height="58" rx="17" fill="url(#gi' + k + ')" fill-opacity=".1"/>'
      + '<rect x="3" y="3" width="58" height="58" rx="17" fill="url(#giLow)"/><rect x="3.6" y="3.6" width="56.8" height="56.8" rx="16.4" stroke="url(#giEdge)" stroke-width="1.2"/>'
      + '<path d="M14 6.6h36" stroke="#fff" stroke-opacity=".5" stroke-width="1.1" stroke-linecap="round"/>'
      + '<g transform="matrix(.78 0 0 .78 7 7)">' + body + '</g>')
    + '</svg>';
}
/* ---------- íconos de archivo («SymphorIA · Archivos» del boceto): hoja de vidrio con la esquina doblada, color por tipo ---------- */
const FK_IMG = 'png jpg jpeg webp gif svg bmp heic', FK_SHEET = 'csv tsv xls xlsx ods', FK_DOC = 'doc docx odt rtf pages', FK_TEXT = 'txt log md';
const FK_CODE = { py:'C', js:'Y', mjs:'Y', cjs:'Y', ts:'B', tsx:'B', jsx:'Y', html:'O', htm:'O', css:'V', scss:'P', sass:'P', less:'V', java:'O', cpp:'B', cc:'B', c:'B', h:'B', hpp:'B', cs:'V',
  php:'V', go:'C', rb:'R', rs:'O', swift:'O', kt:'V', json:'Y', yml:'G', yaml:'G', ini:'W', toml:'W', cfg:'W', env:'G', sql:'C', sh:'G', xml:'O' };
const FK_LABEL = { mjs:'JS', cjs:'JS', htm:'HTML', yaml:'YML', hpp:'H++', cpp:'C++', cc:'C++', scss:'SCSS', sass:'SASS' };
function giFile(ext){
  const e = String(ext || '').toLowerCase().replace(/^\./, ''); if (!e || e.length > 5) return null;
  const has = s => (' ' + s + ' ').includes(' ' + e + ' ');
  let k, inner;
  const label = (t, kk) => { const s = t.length; return '<text x="32.5" y="' + (s > 3 ? 43 : 44) + '" text-anchor="middle" font-size="' + (s > 4 ? 9 : s > 3 ? 10.5 : s > 2 ? 12.5 : 15) + '" font-weight="800" font-family="inherit" letter-spacing="-.2" fill="url(#gi' + kk + ')" stroke="none">' + t + '</text>'; };
  if (e === 'pdf'){ k = 'R'; inner = label('PDF', 'R'); }
  else if (has(FK_IMG)){ k = 'O'; inner = giP('M20 28h25v17H20z', 'O', .22, 1.8) + giL('M20 45l8-9 6 6 4-4 7 7', 'O', 1.8) + '<circle cx="40" cy="32.5" r="2.4" fill="url(#giY)"/>'; }
  else if (has(FK_SHEET)){ k = 'G'; inner = giP('M20 27h25v20H20z', 'G', .16, 1.8) + '<path d="M20 33.6h25M20 40.3h25M28.3 27v20M36.6 27v20" stroke="url(#giG)" stroke-width="1.3"/>'; }
  else if (has(FK_DOC)){ k = 'B'; inner = label(e === 'rtf' || e === 'odt' ? e.toUpperCase() : 'DOC', 'B'); }
  else if (has(FK_TEXT)){ k = e === 'md' ? 'C' : 'W'; inner = e === 'md' ? label('MD', 'C') : giL('M21 29h22M21 35h22M21 41h15', 'W', 2); }
  else if (e === 'pptx' || e === 'ppt' || e === 'key'){ k = 'O'; inner = giC(32, 37, 8.5, 'O', .22, 2) + '<path d="M32 37v-8.5a8.5 8.5 0 0 1 8.5 8.5z" fill="url(#giY)"/>'; }
  else if (e === 'epub'){ k = 'G'; inner = giP('M32 31c-4-3-9-3-12-2v15c3-1 8-1 12 2 4-3 9-3 12-2V29c-3-1-8-1-12 2zM32 31v15', 'G', .18, 1.8); }
  else if (FK_CODE[e]){ k = FK_CODE[e]; inner = label(FK_LABEL[e] || e.toUpperCase(), k); }
  else return null;
  return '<svg class="fico" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><g stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="' + GI_DOC + '" fill="url(#giTile)"/>' + giP(GI_DOC, k, .14, 2) + '<path d="' + GI_FOLD + '" fill="url(#gi' + k + ')" fill-opacity=".35" stroke="url(#gi' + k + ')" stroke-width="2"/>'
    + '<path d="M18 14v6" stroke="#fff" stroke-opacity=".4" stroke-width="1.3"/>' + inner + '</g></svg>';
}
/* dibuja los <i data-gi> que haya en la página (o dentro de root) */
function giFill(root){
  (root || document).querySelectorAll('[data-gi]:not(.gi-on)').forEach(i => { const s = gIcon(i.dataset.gi, i.dataset.gt !== '0'); if (s){ i.innerHTML = s; i.classList.add('gi-on'); } });
}
giFill();
/* ===== v2.8 · cielo en vivo: los fondos que mandó Sammuel, hechos en código (ninguno es una imagen) =====
   Cinco escenas que se dibujan y se mueven en tiempo real:
   · «fondo»     aurora rosa y cian arriba a la derecha, «V» violeta a la izquierda, brillo turquesa abajo (la portada).
   · «seda»      una cinta ancha en diagonal: rosa arriba, lavanda al medio, verde agua abajo (SynthFlow sin mensajes).
   · «nebulosa»  nube violeta y magenta cruzando el cielo con hilos cian, una galaxia y cúmulos de estrellas.
   · «planeta»   nube de colores arriba a la izquierda, velos lavanda abajo, la galaxia y un planeta con anillos.
   · «calma»     un arco tenue y oscuro (SynthFlow con mensajes: se lee mejor).
   En la portada el cielo pasa de una escena a la otra mientras bajas. En SynthFlow, apenas hay mensajes, la «seda»
   se apaga en «calma» y sube una ola de noche desde la caja de escribir.
   Cómo es tan liviano: las nubes se pintan en un lienzo chiquito (~36 000 píxeles) y la pantalla lo estira; ese estirado
   ES el desenfoque. Estrellas, galaxia y planeta se dibujan una sola vez y solo se mueven con la tarjeta gráfica.
   Con «Fondo animado» apagado (o en el celular en modo rápido) el cielo se pinta una vez y queda quieto. */
const AURORA = (() => {
  if (!SPACE) return null;
  const kind = SPACE.root.dataset.kind;
  if (kind !== 'home' && kind !== 'chat') return null;
  const H = document.documentElement, home = kind === 'home';
  /* el planeta con anillos (SVG): la mitad de atrás de los anillos va detrás de la esfera y la de adelante encima */
  const rings = half => '<g clip-path="url(#au8' + half + ')" fill="none" stroke-linecap="round">' + [[104, .5, .9], [96, .35, .6], [88, .55, 1.4], [79, .3, .6], [71, .45, .9]]
    .map(([r, o, w]) => '<ellipse rx="' + r + '" ry="' + (r * .2).toFixed(1) + '" stroke="rgba(214,220,240,' + o + ')" stroke-width="' + w + '"/>').join('') + '</g>';
  const PLANET = '<svg viewBox="-120 -70 240 140" aria-hidden="true"><defs>'
    + '<radialGradient id="au8pg" cx=".7" cy=".3" r=".9"><stop offset="0" stop-color="#c9cee0"/><stop offset=".28" stop-color="#5b6078"/><stop offset=".62" stop-color="#191a2a"/><stop offset="1" stop-color="#06060c"/></radialGradient>'
    + '<clipPath id="au8b"><rect x="-130" y="-80" width="260" height="80"/></clipPath><clipPath id="au8f"><rect x="-130" y="0" width="260" height="80"/></clipPath></defs>'
    + '<g transform="rotate(-14)">' + rings('b') + '<circle r="40" fill="url(#au8pg)"/><circle r="40" fill="none" stroke="rgba(220,230,255,.35)" stroke-width=".8"/>' + rings('f') + '</g>'
    + '<circle cx="-92" cy="-8" r="2.4" fill="#aeb4c8"/><circle cx="58" cy="-44" r="1.6" fill="#9aa0b6"/><circle cx="74" cy="30" r="2" fill="#8a90a8"/></svg>';
  const el = document.createElement('div');
  el.className = 'au8'; el.dataset.kind = kind; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<canvas class="au8-c"></canvas><canvas class="au8-d"></canvas><canvas class="au8-d au8-tw"></canvas>'
    + (home ? '<canvas class="au8-d au8-cl"></canvas><div class="au8-gx"><canvas></canvas></div><div class="au8-pl">' + PLANET + '</div><div class="au8-sw"><i class="au8-ss"></i><i class="au8-ss s2"></i></div>' : '')
    + '<i class="au8-wash"></i><i class="au8-edge"></i>';
  document.body.prepend(el); H.classList.add('au8on');
  const cv = el.querySelector('.au8-c'), ctx = cv.getContext('2d', { alpha:false });
  const [dc, tc, cc] = el.querySelectorAll('.au8-d');
  const gx = el.querySelector('.au8-gx'), pl = el.querySelector('.au8-pl'), sw = el.querySelector('.au8-sw');

  /* colores del tema (si cambias de tema, el cielo cambia con él) */
  const nc = c => { ctx.fillStyle = '#000'; ctx.fillStyle = c || '#000'; return ctx.fillStyle; };
  const rgb = c => { const s = nc(c); if (s[0] === '#') return [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const m = s.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [255, 255, 255]; };
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a > 0 ? a : 0).toFixed(3) + ')';
  const WH = [255, 255, 255];
  let C = {};
  const recolor = () => {
    const cs = getComputedStyle(H), v = n => rgb(cs.getPropertyValue('--sb-' + n).trim());
    const bg = v('bg'), P = v('primary'), S = v('secondary'), L = v('light'), W = v('warm'), deep = v('deep');
    const teal = mix(L, [24, 226, 186], .5);
    C = { bg, P, S, L, W, teal,
      top: mix(bg, mix(deep, [18, 24, 92], .55), .42), bot: mix(bg, [6, 8, 30], .35), dark: mix(bg, [4, 6, 20], .5),
      navy: mix(mix(P, L, .3), [20, 30, 120], .55), mag: mix(S, P, .42), hot: mix(S, [255, 236, 248], .45), vio: mix(P, S, .18),
      ice: mix(L, WH, .3), lav: mix(P, WH, .42), rose: mix(S, WH, .28), mint: mix(L, [70, 230, 170], .6) };
  };

  /* tamaño: el lienzo de las nubes mide ~36 000 píxeles cuando se mueve (la pantalla lo estira y ese estirado es el desenfoque).
     Quieto se pinta una sola vez, así que puede ser más grande: en un celular (3 píxeles por punto) el estirado de 9 veces
     dejaba una rejilla de rombos en los degradados; con ~150 000 queda liso. Las estrellas van a la nitidez de la pantalla (hasta 2x). */
  let w = 0, h = 0, cw = 0, ch = 0, D = 1, px = 0, budget = 0;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const anim = () => CFG.bg && !reduce && !PERF && !H.classList.contains('noanim') && !H.classList.contains('simple');
  const want = () => anim() ? (dpr > 1.4 ? 56000 : 36000) : 150000;
  const U = u => u * cw, V = v => v * ch;
  const size = () => {
    w = innerWidth; h = innerHeight; budget = want();
    cw = Math.max(80, Math.round(Math.sqrt(budget * w / h))); ch = Math.max(80, Math.round(cw * h / w));
    cv.width = cw; cv.height = ch; D = Math.sqrt(cw * ch) * 1.2;
    if (px !== w * h){ px = w * h; stars(); }
  };
  /* si «Fondo animado» se prende o se apaga, el lienzo cambia de tamaño */
  const resize = () => { if (budget !== want()) size(); };
  /* azar con semilla: el mismo cielo cada vez */
  const seeded = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const hr = (i, s) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
  /* estrellas: el polvo se dibuja una vez; el segundo lienzo titila entero; el tercero son los cúmulos y destellos de la nebulosa */
  const flare = (x, cx, cy, r, col) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r * 3); g.addColorStop(0, 'rgba(' + col + ',.95)'); g.addColorStop(.25, 'rgba(' + col + ',.35)'); g.addColorStop(1, 'rgba(' + col + ',0)');
    x.fillStyle = g; x.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6);
    x.fillStyle = 'rgba(' + col + ',.5)'; x.fillRect(cx - r * 6, cy - .5, r * 12, 1); x.fillRect(cx - .5, cy - r * 6, 1, r * 12);
  };
  const stars = () => {
    const tones = ['255,255,255', '200,240,255', '255,214,240', '214,206,255'];
    [[dc, w * h / 2400, .5, .9, 11], [tc, w * h / 16000, 1, 1.5, 23]].forEach(([c, n, a, r, s]) => {
      const rnd = seeded(s); c.width = w * dpr; c.height = h * dpr; const x = c.getContext('2d'); x.scale(dpr, dpr);
      for (let i = 0; i < n; i++){
        x.fillStyle = 'rgba(' + tones[i % 4] + ',' + (a * (.18 + rnd() * .7)).toFixed(2) + ')';
        x.beginPath(); x.arc(rnd() * w, rnd() * h, .35 + rnd() * r * (rnd() < .08 ? 1.8 : 1), 0, 6.283); x.fill();
      }
    });
    if (!cc) return;
    const rnd = seeded(37); cc.width = w * dpr; cc.height = h * dpr; const x = cc.getContext('2d'); x.scale(dpr, dpr);
    /* un río de estrellas en diagonal, más denso al medio */
    for (let i = 0; i < w * h / 900; i++){
      const s = rnd(), off = (rnd() + rnd() + rnd() - 1.5) * .12;
      const px = (.12 + s * .55 + off * .5) * w, py = (.14 + s * .36 - off) * h;
      x.fillStyle = 'rgba(' + tones[i % 4] + ',' + (.15 + rnd() * .6).toFixed(2) + ')'; x.fillRect(px, py, rnd() < .1 ? 1.6 : 1, rnd() < .1 ? 1.6 : 1);
    }
    [[.15, .18, 2.2, '255,236,214'], [.21, .31, 1.6, '255,236,214'], [.58, .27, 1.8, '255,255,255'], [.36, .46, 1.4, '255,220,200'], [.61, .52, 2.2, '190,250,255'], [.9, .79, 2.4, '255,236,214'], [.84, .96, 1.4, '255,255,255'], [.58, .36, 1.2, '255,214,240']]
      .forEach(([u, v, r, col]) => flare(x, u * w, v * h, r, col));
  };
  /* la galaxia espiral: miles de puntitos en dos brazos, dibujada una vez; gira despacio con la tarjeta gráfica */
  if (gx){
    const g = gx.querySelector('canvas'), G = 520, x = g.getContext('2d'), rnd = seeded(5), R = G * .46;
    g.width = g.height = G; x.translate(G / 2, G / 2);
    const core = x.createRadialGradient(0, 0, 0, 0, 0, R * .34); core.addColorStop(0, 'rgba(255,246,228,1)'); core.addColorStop(.18, 'rgba(252,232,206,.6)'); core.addColorStop(.5, 'rgba(225,210,220,.18)'); core.addColorStop(1, 'rgba(200,190,230,0)');
    x.fillStyle = core; x.fillRect(-R, -R, 2 * R, 2 * R);
    /* el disco: una luz pareja que se va apagando hacia la orilla */
    const disk = x.createRadialGradient(0, 0, 0, 0, 0, R); disk.addColorStop(0, 'rgba(214,214,236,.22)'); disk.addColorStop(.5, 'rgba(200,200,232,.08)'); disk.addColorStop(1, 'rgba(200,200,232,0)');
    x.fillStyle = disk; x.fillRect(-R, -R, 2 * R, 2 * R);
    /* luz suave a lo largo de los dos brazos */
    for (let i = 0; i < 420; i++){
      const arm = i % 2, d = .12 + (i / 420) * .85, th = arm * Math.PI + d * 3.3 + (rnd() - .5) * .5, r = d * R;
      const x0 = Math.cos(th) * r, y0 = Math.sin(th) * r, rr = 10 + 22 * (1 - d), gg = x.createRadialGradient(x0, y0, 0, x0, y0, rr);
      gg.addColorStop(0, 'rgba(206,210,240,' + (.08 * (1 - d * .6)).toFixed(3) + ')'); gg.addColorStop(1, 'rgba(206,210,240,0)');
      x.fillStyle = gg; x.fillRect(x0 - rr, y0 - rr, 2 * rr, 2 * rr);
    }
    /* miles de estrellas: más juntas cerca del centro y siguiendo los brazos, con muchas sueltas en el disco */
    for (let i = 0; i < 9000; i++){
      const arm = i % 2, d = Math.pow(rnd(), 1.1), loose = rnd() < .45;
      const th = loose ? rnd() * 6.283 : arm * Math.PI + d * 3.3 + (rnd() - .5) * (1.1 - d * .4), r = d * R + (rnd() - .5) * 10;
      const warm = d < .28 || rnd() < .12;
      x.fillStyle = (warm ? 'rgba(255,236,214,' : rnd() < .6 ? 'rgba(222,228,255,' : 'rgba(255,214,240,') + ((1 - d * .65) * (loose ? .2 : .3) + rnd() * .5).toFixed(2) + ')';
      const z = rnd() < .03 ? 2.4 : rnd() < .25 ? 1.6 : 1.1; x.fillRect(Math.cos(th) * r, Math.sin(th) * r, z, z);
    }
  }
  /* una mancha de luz suave (la base de todo): x, y, radio, color, fuerza, estirado y giro */
  const blob = (x, y, r, c, a, sx, ang) => {
    if (a < .004 || r < .4) return;
    ctx.setTransform(1, 0, 0, 1, x, y); if (ang) ctx.rotate(ang); if (sx) ctx.scale(sx, 1);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, rgba(c, a)); g.addColorStop(.35, rgba(c, a * .5)); g.addColorStop(.7, rgba(c, a * .13)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r);
  };
  /* sombra: tapa un poco de luz (los huecos oscuros de las nebulosas) */
  const shade = (x, y, r, a, sx, ang) => { ctx.globalCompositeOperation = 'source-over'; blob(x, y, r, C.dark, a, sx, ang); ctx.globalCompositeOperation = 'lighter'; };
  /* una curva suave que pasa por los puntos (posición y dirección en s, de 0 a 1) */
  const curve = (P, s) => {
    const n = P.length - 1, f = Math.min(n - 1e-6, s * n), i = Math.floor(f), u = f - i;
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
    const cr = (a, b, c, d) => .5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (3 * b - a - 3 * c + d) * u * u * u);
    const dr = (a, b, c, d) => .5 * ((c - a) + 2 * (2 * a - 5 * b + 4 * c - d) * u + 3 * (3 * b - a - 3 * c + d) * u * u);
    return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1]), dr(p0[0], p1[0], p2[0], p3[0]), dr(p0[1], p1[1], p2[1], p3[1])];
  };
  const colAt = (cols, s) => { const f = s * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(f)); return mix(cols[i], cols[i + 1], f - i); };
  /* un velo: manchas estiradas a lo largo de la curva que ondula; el color cambia de punta a punta.
     off = corrido hacia un lado (para cintas de varios colores), ramp = más brillante hacia el final */
  const veil = (P, t, o) => {
    const n = o.n || 14, [r0, r1] = o.r, ramp = o.ramp || 0, ph = o.ph || 0;
    for (let i = 0; i < n; i++){
      const s = i / (n - 1), [x, y, dx, dy] = curve(P, s), l = Math.hypot(dx, dy) || 1;
      const q = ((o.off || 0) + Math.sin(s * 8.5 - t * .5 + ph) * (o.wav || 0)) * D, b = Math.sin(Math.PI * s);
      blob(x - dy / l * q, y + dx / l * q, (r0 + (r1 - r0) * b) * D, colAt(o.cols, s), o.a * (.5 + .5 * b) * (1 - ramp + ramp * s) * (.86 + .14 * Math.sin(t * .7 + s * 5 + ph)), o.sx || 1.8, Math.atan2(dy, dx));
    }
  };
  /* bocanadas de nube regadas a lo largo de una curva: le dan textura a las nebulosas */
  const puffs = (P, t, n, r, cols, a, sd, spread) => {
    for (let i = 0; i < n; i++){
      const [x, y, dx, dy] = curve(P, hr(i, sd)), l = Math.hypot(dx, dy) || 1, q = (hr(i, sd + 1) - .5) * (spread || .12) * D;
      blob(x - dy / l * q + Math.sin(t * .2 + i) * .006 * D, y + dx / l * q + Math.cos(t * .17 + i) * .006 * D, r * D * (.5 + hr(i, sd + 2)), cols[i % cols.length], a * (.5 + .5 * hr(i, sd + 3)), 1.3, hr(i, sd + 4) * 3);
    }
  };
  /* los puntos de cada curva se mecen despacio, cada uno a su ritmo */
  const pts = (arr, t, amp, ph) => arr.map(([u, v], i) => [U(u + Math.sin(t * .16 + i * 1.7 + ph) * amp), V(v + Math.cos(t * .13 + i * 2.3 + ph) * amp * .8)]);

  const SC = {
    fondo(t, a){
      const s1 = Math.sin(t * .23), s2 = Math.cos(t * .19);
      blob(U(.74), V(.4), .4 * D, C.navy, .3 * a, 1.4, -.4);
      blob(U(.46), V(.62), .42 * D, C.navy, .14 * a, 1.3, .2);
      blob(U(.79), V(.25), .11 * D, C.vio, .3 * a, 1.4, -.3);
      /* el rosa de arriba, con su centro casi blanco */
      blob(U(.6 + .01 * s1), V(.07), .13 * D, C.mag, .36 * a, 1.7, -.3);
      blob(U(.69 + .012 * s2), V(.15), .15 * D, C.S, .52 * a, 1.8, -.5);
      blob(U(.71), V(.16), .07 * D, C.hot, .46 * a, 1.6, -.4);
      /* el cian que baja por la derecha */
      blob(U(.88 + .01 * s1), V(.1), .15 * D, C.L, .5 * a, 1.5, .6);
      blob(U(.97), V(.3 + .015 * s2), .15 * D, mix(C.L, C.teal, .4), .42 * a, 1.2, 1.3);
      blob(U(.84), V(.2), .06 * D, C.ice, .3 * a, 1.4, .8);
      blob(U(.9), V(.42), .09 * D, C.ice, .16 * a, 1.2, 1.2);
      const A = pts([[.5, -.06], [.62, .08], [.74, .14], [.86, .07], [1, .16], [.98, .42], [.93, .58]], t, .02, 0);
      veil(A, t, { n:18, r:[.05, .1], cols:[C.vio, C.mag, C.S, C.hot, C.S, C.L, C.ice, C.L, C.teal], a:.32 * a, sx:1.9, wav:.014 });
      puffs(A, t, 16, .035, [C.S, C.L, C.vio, C.ice], .16 * a, 11, .16);
      /* la «V» violeta y la estela rosa de la izquierda */
      veil(pts([[-.04, .4], [.06, .5], [.13, .58], [.19, .5], [.27, .41]], t, .018, 2.1), t, { n:12, r:[.05, .08], cols:[C.P, C.vio, C.mag, C.vio, C.P], a:.42 * a, sx:1.6, wav:.008, ph:1.3 });
      veil(pts([[-.06, .6], [.04, .67], [.13, .73]], t, .016, 4.4), t, { n:8, r:[.05, .07], cols:[C.mag, C.S, C.vio], a:.32 * a, wav:.006, ph:2.7 });
      /* turquesa abajo */
      blob(U(.2), V(1.04), .32 * D, C.teal, .55 * a, 1.6, -.15);
      blob(U(.36 + .02 * Math.sin(t * .2)), V(.98), .14 * D, mix(C.teal, C.L, .5), .28 * a, 1.6, -.3);
      blob(U(.04), V(.86), .12 * D, C.vio, .22 * a, 1.2, 0);
      /* estelas finas (como cometas) y luces desenfocadas */
      veil(pts([[.41, .33], [.48, .29], [.56, .24]], t, .01, 5.2), t, { n:6, r:[.014, .02], cols:[C.navy, C.teal, C.ice], a:.3 * a, sx:2.6, wav:.002, ph:3.3 });
      veil(pts([[.32, .86], [.38, .83], [.44, .79]], t, .01, 6.1), t, { n:6, r:[.012, .018], cols:[C.navy, C.P, C.vio], a:.34 * a, sx:2.6, wav:.002, ph:4.1 });
      [[.18, .77, C.W, .007], [.27, .81, C.teal, .006], [.32, .85, C.teal, .008], [.555, .245, C.teal, .009], [.6, .52, C.W, .005], [.69, .89, C.vio, .011], [.86, .62, C.L, .006]]
        .forEach(([u, v, col, r], i) => blob(U(u + Math.sin(t * .11 + i) * .006), V(v + Math.cos(t * .09 + i * 2) * .008), r * D, col, (.55 + .3 * Math.sin(t * .8 + i * 1.9)) * a, 1, 0));
    },
    seda(t, a){
      blob(U(.86), V(.14), .34 * D, C.vio, .3 * a, 1.6, -.6);
      blob(U(.9), V(.08), .16 * D, C.rose, .3 * a, 1.6, -.6);
      /* en SynthFlow la cinta va más a la derecha, para no pasar por detrás del saludo */
      const du = home ? 0 : .14, R = pts([[.3, .86], [.46, .7], [.62, .52], [.76, .34], [.9, .17], [1.04, 0]].map(([u, v]) => [u + du, v + du * .4]), t, .016, .7);
      veil(R, t, { n:18, r:[.05, .1], cols:[C.vio, C.rose, C.rose, C.hot], a:.42 * a, sx:2, wav:.012, off:-.05, ramp:.6 });
      veil(R, t, { n:18, r:[.05, .095], cols:[C.P, C.lav, C.lav, C.lav], a:.34 * a, sx:2, wav:.012, ph:1, ramp:.5 });
      veil(R, t, { n:18, r:[.045, .09], cols:[C.navy, C.teal, C.mint, C.mint], a:.36 * a, sx:2, wav:.012, off:.06, ph:2, ramp:.4 });
      puffs(R, t, 14, .04, [C.rose, C.lav, C.mint], .12 * a, 5, .14);
      blob(U(0), V(.7), .24 * D, C.mint, .36 * a, 1.4, .5);
      blob(U(.06), V(1.02), .2 * D, C.rose, .32 * a, 1.5, -.2);
      blob(U(.02), V(.9), .14 * D, C.lav, .25 * a, 1.2, 0);
    },
    nebulosa(t, a){
      blob(U(.5), V(.45), .45 * D, C.navy, .22 * a, 2, -.35);
      const R = pts([[-.06, .64], [.12, .56], [.3, .48], [.5, .43], [.68, .37], [.84, .26], [1.04, .12]], t, .014, 2.4);
      veil(R, t, { n:22, r:[.09, .14], cols:[C.vio, C.P, C.mag, C.P, C.mag, C.vio], a:.3 * a, wav:.012 });
      veil(R, t, { n:18, r:[.04, .07], cols:[C.P, C.mag, C.S, C.mag, C.S, C.mag], a:.3 * a, sx:2, wav:.01, off:-.06, ph:1.4 });
      puffs(R, t, 40, .04, [C.P, C.mag, C.vio, C.S, C.L], .22 * a, 3, .2);
      /* hilos cian por debajo, a la derecha */
      const Q = pts([[.42, .58], [.56, .53], [.7, .55], [.84, .45], [1.02, .36]], t, .014, 3.3);
      veil(Q, t, { n:16, r:[.03, .06], cols:[C.navy, C.L, C.ice, C.L, C.teal], a:.4 * a, sx:2.2, wav:.012, ph:2 });
      puffs(Q, t, 18, .03, [C.L, C.teal, C.ice], .2 * a, 9, .1);
      veil(pts([[.66, .7], [.8, .62], [.9, .52], [1.04, .5]], t, .012, 1.1), t, { n:12, r:[.025, .045], cols:[C.navy, C.teal, C.L, C.ice], a:.34 * a, sx:2.2, wav:.01, ph:3 });
      /* a la izquierda: humo turquesa alrededor de un hueco oscuro */
      veil(pts([[-.02, .7], [.06, .62], [.15, .6], [.24, .66]], t, .012, 5), t, { n:12, r:[.035, .06], cols:[C.teal, C.mint, C.teal, C.vio], a:.3 * a, sx:2, wav:.008, ph:.8 });
      veil(pts([[0, .86], [.1, .9], [.22, .86], [.32, .8]], t, .012, 6.3), t, { n:12, r:[.03, .05], cols:[C.navy, C.teal, C.vio, C.P], a:.3 * a, sx:2.2, wav:.008, ph:1.6 });
      shade(U(.13), V(.76), .08 * D, .5 * a, 1.4, .3);
      shade(U(.26), V(.52), .06 * D, .3 * a, 2.2, -.4);
    },
    planeta(t, a){
      blob(U(.3), V(.35), .4 * D, C.navy, .2 * a, 1.8, .4);
      const R = pts([[-.04, .2], [.1, .27], [.24, .33], [.36, .4], [.5, .48], [.66, .57], [.82, .66], [1.04, .74]], t, .014, 4.1);
      veil(R, t, { n:22, r:[.08, .12], cols:[C.P, C.vio, C.S, C.L, C.vio, C.lav, C.lav, C.P], a:.3 * a, sx:1.7, wav:.014, ph:.3 });
      veil(R, t, { n:16, r:[.035, .06], cols:[C.vio, C.S, C.hot, C.ice, C.lav, C.lav], a:.28 * a, sx:2, wav:.01, off:-.05, ph:2.2 });
      puffs(R, t, 36, .038, [C.S, C.L, C.P, C.lav, C.teal], .2 * a, 7, .2);
      blob(U(.13), V(.18), .12 * D, C.P, .3 * a, 1.3, -1.2);
      blob(U(.2), V(.24), .07 * D, C.S, .26 * a, 1.4, -1.1);
      blob(U(.05), V(.46), .14 * D, C.teal, .3 * a, 1.6, .3);
      /* velos lavanda abajo a la derecha */
      const Q = pts([[.52, .76], [.68, .7], [.84, .62], [1.04, .58]], t, .012, 1.7);
      veil(Q, t, { n:14, r:[.03, .055], cols:[C.navy, C.lav, C.rose, C.lav], a:.3 * a, sx:2.4, wav:.014, ph:1.2 });
      puffs(Q, t, 14, .03, [C.lav, C.rose, C.L], .14 * a, 13, .12);
      veil(pts([[.58, .92], [.74, .84], [.9, .8], [1.04, .86]], t, .012, 2.9), t, { n:12, r:[.03, .05], cols:[C.navy, C.lav, C.L], a:.26 * a, sx:2.4, wav:.012, ph:4 });
      shade(U(.2), V(.78), .1 * D, .4 * a, 1.6, 0);
    },
    calma(t, a){
      blob(U(.82), V(.08), .26 * D, mix(C.teal, C.navy, .5), .14 * a, 1.6, .3);
      const R = pts([[.27, .31], [.43, .19], [.59, .2], [.71, .32], [.8, .48], [.87, .66], [.9, .88]], t, .012, 1.9);
      veil(R, t, { n:16, r:[.03, .055], cols:[C.navy, C.vio, C.vio, C.rose, mix(C.rose, C.teal, .5), C.teal, C.teal], a:.2 * a, sx:2.4, wav:.006, ph:.4 });
      veil(R, t, { n:12, r:[.018, .032], cols:[C.navy, C.P, C.rose, C.vio, C.mint], a:.12 * a, sx:2.6, wav:.005, off:-.022, ph:1.8 });
    }
  };
  /* portada: qué escena se ve según cuánto bajaste (se funden entre sí) */
  const SEQ = [['fondo', 0], ['seda', .3], ['nebulosa', .62], ['planeta', .95]];
  /* más abajo hay más texto encima: las escenas de abajo brillan un poco menos para que todo se lea */
  const HOME_K = { fondo:1, seda:.85, nebulosa:.7, planeta:.74 };
  let calm = 0, cFrom = 0, cTo = 0, cAt = -1e9, sp = 0, Wt = {};
  const weights = () => {
    if (!home) return { seda:1 - calm, calma:calm };
    const o = {}; const p = Math.min(1, sp);
    for (let i = 0; i < SEQ.length; i++){
      const [n, a] = SEQ[i], prev = SEQ[i - 1], next = SEQ[i + 1];
      o[n] = p <= a ? (prev ? Math.max(0, (p - prev[1]) / (a - prev[1])) : 1) : (next ? Math.max(0, (next[1] - p) / (next[1] - a)) : 1);
    }
    return o;
  };
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  /* lo que se dibuja una vez (galaxia, planeta, cúmulos, estrellas fugaces, textura) solo cambia de opacidad */
  const op = (e, v) => { if (!e) return; v = Math.round(v * 50) / 50; if (e._o === v) return; e._o = v; e.style.opacity = v; e.classList.toggle('off', v < .02); };
  const paint = now => {
    const t = now / 1000, dim = (home ? 1 : .8) * (w < h ? .68 : 1); Wt = weights();
    ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    const k = (Wt.calma || 0) * .6, g0 = ctx.createLinearGradient(0, 0, cw * .3, ch);
    g0.addColorStop(0, rgba(mix(C.top, C.dark, k), 1)); g0.addColorStop(1, rgba(mix(C.bot, C.dark, k), 1));
    ctx.fillStyle = g0; ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'lighter';
    for (const n in Wt) if (Wt[n] > .01) SC[n](t, Wt[n] * dim * (home ? HOME_K[n] : 1));
    /* viñeta: las orillas se van a la noche */
    ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    const vg = ctx.createRadialGradient(cw * .52, ch * .42, 0, cw * .52, ch * .42, Math.hypot(cw, ch) * .64);
    vg.addColorStop(.5, rgba(C.bg, 0)); vg.addColorStop(1, rgba(C.bg, .5 + .2 * (Wt.calma || 0)));
    ctx.fillStyle = vg; ctx.fillRect(0, 0, cw, ch);
    const neb = (Wt.nebulosa || 0) + (Wt.planeta || 0);
    op(gx, neb); op(pl, Wt.planeta || 0); op(cc, (Wt.nebulosa || 0) + .55 * (Wt.planeta || 0)); op(sw, neb);
  };

  /* el ciclo: ~24 cuadros por segundo (12 en el celular y mientras se conversa); a 30 solo durante la ola */
  const coarse = matchMedia('(pointer:coarse)').matches;
  const live = () => anim() && !document.hidden;
  let raf = 0, last = -1e9, dirty = true;
  const frame = now => {
    raf = 0;
    const moving = now - cAt < 1800, on = live();
    calm = moving ? cFrom + (cTo - cFrom) * ease(Math.min(1, (now - cAt) / 1700)) : cTo;
    const fps = moving ? 30 : coarse || cTo ? 12 : 24;
    /* quieto: siempre el mismo instante, y solo se repinta si algo cambió */
    if (dirty || moving || (on && now - last >= 1000 / fps - 3)){ last = now; dirty = false; paint(on ? now : 0); }
    /* v2.9: entre cuadro y cuadro duerme con un temporizador (antes despertaba 60 veces por segundo solo para mirar la hora) */
    if (moving) raf = requestAnimationFrame(frame);
    else if (on){ raf = -1; setTimeout(() => { raf = requestAnimationFrame(frame); }, Math.max(0, 1000 / fps - (performance.now() - last) - 8)); }
  };
  const go = () => { dirty = true; if (!raf) raf = requestAnimationFrame(frame); };
  recolor(); size(); paint(0); go();
  addEventListener('resize', () => { size(); go(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) go(); });
  if (home){
    const scr = () => { const m = Math.max(1, H.scrollHeight - innerHeight); sp = Math.min(1, scrollY / m); if (!live()) go(); };
    addEventListener('scroll', scr, { passive:true }); addEventListener('load', scr); scr();
  }
  /* si cambian los ajustes o el tema, se vuelve a pintar (el tema tarda ~1 s en pasar de color) */
  let rc = 0;
  new MutationObserver(() => { clearTimeout(rc); recolor(); resize(); go(); rc = setTimeout(() => { recolor(); go(); }, 950); }).observe(H, { attributes:true, attributeFilter:['class', 'data-theme'] });

  /* conversación: true = la seda se apaga en calma y sube la ola; false = la ola baja y vuelve la seda */
  const setCalm = (on, now) => {
    on = !!on; if (on === (cTo === 1)) return;
    H.classList.toggle('szconv', on);
    if (now){ cFrom = cTo = calm = on ? 1 : 0; cAt = -1e9; H.classList.add('au8-now'); requestAnimationFrame(() => requestAnimationFrame(() => H.classList.remove('au8-now'))); go(); return; }
    cFrom = calm; cTo = on ? 1 : 0; cAt = performance.now();
    el.classList.remove('sweep'); void el.offsetWidth; el.classList.add('sweep');
    clearTimeout(el._sw); el._sw = setTimeout(() => el.classList.remove('sweep'), 1900);
    go();
  };
  return { el, setCalm, repaint:() => { recolor(); go(); } };
})();
/* ---------- v3.0 · enlaces de la página de Ayuda (ayuda.html) ----------
   ?ayuda=equipo abre «Hablar con el equipo», ?ayuda=mejorar abre «Cuéntanos qué mejorar» y ?ayuda=synthonia abre a SynthonIA.
   Espera un poco a que la cuenta y SynthonIA estén listas; después borra el parámetro para que no se repita al recargar (window.history: en core, history() es otra función). */
try{
  const AY = new URLSearchParams(location.search).get('ayuda');
  if (AY && ['equipo', 'mejorar', 'synthonia'].includes(AY)) setTimeout(() => {
    try{ if (AY === 'equipo') botTeam(); else if (AY === 'mejorar') feedbackModal(); else botOpen(); }catch(e){}
    try{ const u = new URL(location.href); u.searchParams.delete('ayuda'); window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash); }catch(e){}
  }, 2200);
}catch(e){}
/* ---------- v3.0 · Planes (Chispa, Syntonia, Timeless y Orquesta) ----------
   Los pagos están APAGADOS (PENDIENTES.md › Plan de pagos): nadie puede pagar todavía y nada se cobra.
   Esta ventana solo muestra qué traerá cada plan y en cuál estás. Hoy todos están en Chispa (gratis, con las IAs gratis de siempre)
   y el equipo (Prime, ZFlow y Symmetrix) en Orquesta: sin límite de EnerX, búsquedas ni imágenes, y con los colores Aurora y Oro negro.
   El servidor es quien decide el límite (api/_pool.js › free); aquí solo se muestra. */
const PLANS = [
  { id:'chispa', n:'Chispa', p:'Gratis', c:'#e6b65f', L:['Las IAs gratis de hoy: Groq, Gemini Flash, Mistral y más', 'Tu EnerX diaria, que se carga a medianoche', 'Imágenes con límite, internet y memoria', 'Proyectos, Sintéticos y A.L.I.A.S.'] },
  { id:'syntonia', n:'Syntonia', p:'US$7,99 al mes', c:'#9fffd6', L:['Todo lo de Chispa con un límite mucho más amplio', '400 mensajes al mes con IAs pro (GPT, Claude, Grok, Gemini Pro)', '30 imágenes pro', 'Los colores Aurora y Oro negro'] },
  { id:'timeless', n:'Timeless', p:'US$17,99 al mes', c:'#a98bff', L:['Todo lo de Syntonia', '900 mensajes pro y 50 con lo más potente', '80 imágenes y 2 videos cortos', 'SynthFlow en WhatsApp y Telegram'] },
  { id:'orquesta', n:'Orquesta', p:'US$8,99 por persona', c:'#ffd27a', L:['Para equipos (desde 3 personas)', 'Lo de Syntonia para cada persona', 'Chats y panel de equipo', 'A.L.I.A.S. con 100 veces más pasos y búsquedas', 'Hoy lo usan Prime, ZFlow y Symmetrix, sin límites, para probar todo'] }
];
let szTeam = false; try{ szTeam = localStorage.getItem('synthz:team') === '1'; }catch(e){}
const planOf = () => szTeam ? 'orquesta' : 'chispa';
/* el equipo estrena los colores de pago (Aurora y Oro negro): se quita el «Pronto» y se vuelve a pintar el tema */
function planPerks(){
  THEMES.forEach(t => { if (t[0] === 'aurora' || t[0] === 'oro') t[3] = szTeam ? 0 : 1; });
  try{ cfgClasses(); }catch(e){}
}
planPerks();
addEventListener('synthz-szq', e => {
  const d = e.detail || {}; if (d.team == null) return;
  const t = !!d.team; if (t === szTeam) return;
  szTeam = t; try{ t ? localStorage.setItem('synthz:team', '1') : localStorage.removeItem('synthz:team'); }catch(er){}
  planPerks();
});
function plansModal(){
  if ($('#szPlans')) return;
  const me = planOf(), o = document.createElement('div'); o.id = 'szPlans'; o.className = 'szm';
  o.innerHTML = '<div class="tcard plans" role="dialog" aria-modal="true" aria-label="Planes de SymphorIA"><div class="word">' + zWord('Synth') + '</div><div class="tn">PLANES</div><div class="tb">'
    + '<h3>Elige cómo FlowIAr</h3><p>Las IAs gratis siempre van a estar. Los planes de pago llegan pronto: hoy nadie puede pagar y no se cobra nada.</p>'
    + '<div class="pl-grid">' + PLANS.map((P, i) => '<article class="pl-card' + (P.id === me ? ' me' : '') + '" style="--pc:' + P.c + ';--i:' + i + '"><header><b>' + esc(P.n) + '</b>' + (P.id === me ? '<em>Tu plan</em>' : '') + '</header><span class="pl-p">' + esc(P.p) + '</span><ul>' + P.L.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>'
      + (P.id === me ? '<span class="pl-on">Activo</span>' : P.id === 'chispa' ? '' : '<button type="button" class="btn sm ghost" disabled aria-disabled="true">Pronto</button>') + '</article>').join('') + '</div>'
    + '<p class="cnote">' + (me === 'orquesta' ? 'Eres del equipo: tienes todo como en Orquesta para probar la página: sin límite de EnerX, imágenes y búsquedas sin tope propio, A.L.I.A.S. (menú «⋯») y los colores Aurora y Oro negro.' : 'Cuando lleguen los pagos verás aquí cuánto te queda de cada cosa, y podrás cancelar con un clic.') + '</p>'
    + '<div class="tbtn"><button class="btn sm" type="button" data-close>Listo</button></div></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close); o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  addEventListener('keydown', function k(e){ if (e.key === 'Escape'){ close(); removeEventListener('keydown', k); } });
}
window.SZ = { I18N, LANGS, t, lang, setLang, onLang, i18nApply, root, $, $$, clamp, fmt, reduce, today, sleepRaw, esc, est, Z_PATH, ICONS, ico, zWord, API, MANUAL, ALL, byId,
  get state(){ return state; }, set state(v){ state = v; normalize(); },
  normalize, cleanUsage, cleanChats, cleanStrMap, save, total, addUsage, resetUsage, estAll, todayEst, todayReq, providerBalance, balanceHtml, splitHtml, syncNote, helpGuide, smoothDetails, szPrompt, swapDir, swapDir, get face(){ return face; }, get FACE_GOOD(){ return FACE_GOOD; }, get randomGoodFace(){ return randomGoodFace; }, get welcomeBack(){ return welcomeBack; }, get wasAway(){ return wasAway; }, accSignOutAll, accClaim, ROLE_NAME, trialGet, trialSet, trialStart, legacyRow, cleanLedger, mergeLedger, DEV, hooks, toast, hydrateIcons, md, countTo,
  BRAND, SPACE, AURORA, isFlow, flowWord, flowOrb, LOGO_Z, fileIco, gIcon, giFill, giFile, zMark, get synBody(){ return synBody; }, get synSet(){ return synSet; }, get SPOSE(){ return SPOSE; }, charify, typeIn, showAll, getJSON, parseModels, loadCatalog, fetchCatalog, vendorLabel, vendorColor, burst, friendly, netMsg, fetchModels, refreshModels, verify, ask, metaOf, history, S, mirrorType, thud, portalOut, portalBack, portalArrive, portalFill, portalReveal, waterIn, ctxMenu, SXC, coins, ACC, accHooks, accStart, accPush, accSignOut, accName, accHandle, securityModal, recoveryPanel, MARK_HTML, expertOf, EXP_LABEL, surveyModal, surveyPicks, surveyScore, orGuide, profileModal, puterLogo, PUTER_LOGO, api, accConfig, accDelete, saveProfile, avatarHtml, myAvatar, grad, tint, TINTS, loadGsi, SESS_get:() => SESS, CFG, PERF, saveCfg, cfgModal, cfgChooser, applyCfg, smoothWheel, orbitBg, authBox, isBlocked, lowEnd, askStream, mkReveal, reveals, chatsReady, IDB, provOf, totalAll, todayAll, BRANDS, brandOf, glassIcon, PIXART, pixelRun, pixelGrid, workView, workSaved, mdLoad, MDLIB, SZ_P, SZQ, SZ_AUTO, szqSet, msgsLeft, msgsTotal, coinsOf, coinsLeft, coinsTotal, coinsFmt, coinsShort, coinNote, limTxt, limShort, limLvl, limPct, limRing, battPct, limBar, szCatalog, szHeaders, guestGate, guestFull, isGuestQ, setTurn, puterOut, puterOutNote, TEL, telEv, telBeat, DEVH, szConfirm, cfgPreset, CFG_KEYS, cfgClasses, get SND(){ return SND; }, get HAND(){ return HAND; }, get feedbackModal(){ return feedbackModal; }, get guideChooser(){ return guideChooser; }, DRIVE, isBad, markBad, markGood, modelGone, badReady, GROQ_P, get BOT(){ return BOTAPI; }, get EV(){ return EV; }, get lipSync(){ return lipSync; }, get ballFace(){ return ballFace; }, get guideAsk(){ return guideAsk; }, get GTOPICS(){ return GTOPICS; }, get whatsNew(){ return whatsNew; }, signedish, cfgLinks, memAddCore, memPanel, menuOpen, menuClose, MICO, appInstall, appPromo, appStandalone, appPhone, plansModal, planOf };
/* v3.4 · el «turno» del mensaje actual: la revisión de calidad viaja en el mismo turno (no cuenta como otro mensaje sin cuenta) */
/* v3.4 · SynthonIA (synthonia.js): lo que necesita de core, y cuándo se carga */
window.SZ.synReady = synReady;
window.SZ.__syn = { root, $, $$, clamp, CFG, PERF, reduce, sleepRaw, esc, isFlow, BRAND, zWord, t, onLang, ENERX, trStr, ACC, accHooks, api, accName, toast, pixelGrid, pixelRun, typeIn, SZQ, szCatalog, telPage, telEv, burst, portalOut, portalLock, authBox, cfgModal, plansModal,
  get LANG(){ return LANG; }, get SESS(){ return SESS; }, ready:synArrive };
/* la portada la trae con su propia etiqueta (SynthonIA es la portada); las demás páginas, cuando ya cargaron */
if (document.readyState === 'complete') setTimeout(synLoad, 300); else addEventListener('load', () => (window.requestIdleCallback || setTimeout)(synLoad, { timeout:1200 }), { once:true });
window.SZ.turnNow = () => TURN && Date.now() - TURN.at < 600000 ? TURN.id : '';
})();
