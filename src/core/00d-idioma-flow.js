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
  let r = s; TR_PRE.forEach(([rx, to]) => { r = r.replace(rx, to); });
  r = TR.rx ? r.replace(TR.rx, x => m[x] ?? x) : r;
  TR_RULES.forEach(([rx, to]) => { r = r.replace(rx, to); });
  return r;
}
/* números con su palabra («7 líneas», «hace 5 min»…), que el diccionario no puede tener uno por uno */
const TR_DAYS = { lun:'Mon', mar:'Tue', 'mié':'Wed', jue:'Thu', vie:'Fri', 'sáb':'Sat', dom:'Sun' };
/* v3.7 · Pulsem en inglés: frases con números (van ANTES del diccionario, para que no se traduzcan a medias) */
const TR_PRE = [
  /* v3.7 · selector de IA */ [/^(\d+) IA$/, (m, n) => n + (n === '1' ? ' AI' : ' AIs')], [/^(\d+) versi(?:ón|ones)$/, (m, n) => n + (n === '1' ? ' version' : ' versions')], [/^\+ (\d+) temas$/, '+ $1 topics'], [/^Menos temas$/, 'Fewer topics'],
  /* v3.8 · SynthFlow: «3 fuentes», la IA «pensando»/«escribiendo» arriba y el «Ej.:» de la caja */ [/^(\d+) fuentes?$/, (m, n) => n + (n === '1' ? ' source' : ' sources')], [/^pensando$/, 'thinking'], [/^escribiendo$/, 'writing'], [/^Ej\.: /, 'E.g.: '],
  /* v3.8 · adjuntar cualquier archivo */ [/^Máximo (\d+) archivos por mensaje\.$/, 'Up to $1 files per message.'], [/^(.+) está mirando tu foto para que (.+) la entienda…$/, '$1 is looking at your photo so $2 can understand it…'], [/^Leyendo «(.+)»…$/, 'Reading «$1»…'],
  /* v3.7 · foto con una IA que no ve: responde otra solo esa vez */ [/^(.+) no ve fotos: esta vez te responde (.+), que sí las ve\. Después sigues con (.+)\.$/, "$1 can't see photos: this time $2 answers, since it can. After that you're back with $3."],
  [/(\d+) mensajes en (?:los últimos )?(\d+) min\b/g, '$1 messages in the last $2 min'], [/(\d+) error(?:es)? en (\d+) min\b/g, (m, a, b) => a + (a === '1' ? ' error' : ' errors') + ' in ' + b + ' min'],
  [/(\d+) de (\d+) llaves activas/g, '$1 of $2 keys active'], [/(\d+) personas tuvieron dificultades en la última hora/g, '$1 people had trouble in the last hour'], [/\b1 persona tuvo dificultades en la última hora/g, '1 person had trouble in the last hour'],
  [/(\d+) personas\b/g, '$1 people'], [/\b1 persona\b/g, '1 person'], [/(\d+) nuevos\b/g, '$1 new'], [/(\d+) esperando\b/g, '$1 waiting'], [/(\d+) sin respuesta \+15 min/g, '$1 unanswered 15+ min'],
  [/([\d.]+) de ([\d.]+) · ([\d,]+) %/g, (m, a, b, c) => a.replace(/\./g, ',') + ' of ' + b.replace(/\./g, ',') + ' · ' + c.replace(',', '.') + ' %'], [/(\d+) llaves · (\d+) modelos gratis/g, '$1 keys · $2 free models'],
  [/ · computador · /g, ' · computer · '], [/ · celular · /g, ' · phone · '], [/(\d+) h (\d+) min aquí/g, '$1 h $2 min here'], [/(\d+) min aquí/g, '$1 min here'], [/Lo gratis de este mes \((\d{4}-\d{2})\)/g, 'This month\'s free tier ($1)'],
  [/^con ([A-ZÁÉÍÓÚ][\p{L}\d]+)$/gu, 'with $1'], [/\b(lun|mar|mié|jue|vie|sáb|dom) (\d{2})$/g, (m, d, n) => TR_DAYS[d] + ' ' + n],
  [/^en vivo · /g, 'live · '], [/^Inicio · /g, 'Home · '], [/\bhace (\d+) s\b/g, '$1 s ago'], [/🐞 Algo falló · /g, '🐞 Something broke · '], [/🤔 No entendió algo · /g, '🤔 Got confused · '], [/💬 Otro · /g, '💬 Other · '],
];
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
