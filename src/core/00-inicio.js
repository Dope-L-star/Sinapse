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
  return Object.assign({ v:2, perf:'visual', intro:'session', sound:true, dictado:true }, cfgPreset(c.perf), c);   /* v3.9.1 · el dictado viene encendido (Sammuel, 3 nov) */
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
  /* v3.9 · modo dictado (micrófono en la caja de escribir). v3.9.1 · encendido por defecto (Sammuel, 3 nov); se apaga en Ajustes */
  r.classList.toggle('dicta', chat && CFG.dictado !== false);
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

