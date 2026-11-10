/* ---------- v2.4 · SynthCode: las IAs programan como profesionales ----------
   1) Cuando pides código, la IA recibe un manual de ingeniería (planear → escribir completo → revisarse).
   2) Cada página que da la IA se prueba sola en un navegador aislado (computador y celular):
      errores, botones que fallan, cosas que se salen de la pantalla, imágenes rotas, contraste, código incompleto…
   3) Si encuentra errores de verdad, la IA los arregla sola una vez; lo demás queda con «Arreglar con la IA».
   4) El lienzo trae consola, tamaños de pantalla y colores en el código. */
const CODE_RX = /```|c[oó]digo|program|\bscript|html|\bcss\b|javascript|\bjs\b|typescript|python|\bjava\b|c\+\+|c#|\bphp\b|\bsql\b|react|\bvue\b|svelte|next\.?js|node|\bapi\b|\bbug|depura|debug|compil|funci[oó]n|algoritmo|regex|base de datos|backend|frontend|\bapp\b|aplicaci[oó]n|p[aá]gina web|sitio web|landing|\bweb\b|juego|calculadora|formulario|\bbot\b|terminal|\bbash\b|\bjson\b|tailwind|flutter|kotlin|swift|\brust\b|golang|arduino|excel con macros|macro/i;
const CODE_FILE_RX = /\.(html?|css|scss|jsx?|tsx?|py|java|c|cpp|cs|go|rs|php|rb|swift|kt|dart|lua|sql|sh|json|vue|svelte|ino)$/i;
const CODE_SYS = [
  'MODO SYNTHCODE. Eres un ingeniero de software senior y diseñador de producto de primer nivel. Tu código funciona a la primera, es completo, limpio y hermoso. Eres perfeccionista: prefieres revisar dos veces antes que entregar algo roto.',
  'CÓMO TRABAJAS',
  '1. Entiende el pedido. Si algo importante es ambiguo, elige la opción más razonable y dilo en una línea (no frenes con preguntas).',
  '2. Plan: si el pedido no es trivial, empieza con «**Plan**» y 2 a 5 viñetas cortas (estructura, archivos, decisiones clave).',
  '3. Escribe el código COMPLETO. Nunca pongas «...», «// resto igual», «// tu código aquí», TODO ni partes omitidas: cada archivo que entregas se puede copiar y correr tal cual. Si cambias un archivo, devuélvelo entero.',
  '4. Revísate antes de terminar, línea por línea: sintaxis, llaves y etiquetas cerradas, variables definidas antes de usarse, nombres que coinciden entre HTML, CSS y JS, casos borde (vacío, cero, texto largo, error de red), y que todo lo que prometiste esté hecho.',
  '5. Cierra con «**Revisión**»: 2 a 4 viñetas con lo que comprobaste y cómo usarlo (cómo abrirlo o correrlo). Sin relleno.',
  'FORMATO',
  '- Antes de cada bloque de código escribe el nombre del archivo en su propia línea (por ejemplo: index.html). Un bloque por archivo, con el lenguaje correcto en la cerca (```html, ```css, ```js, ```python…).',
  '- Para una página o app web, si no piden otra cosa, entrega UN solo archivo index.html con el CSS en <style> y el JS en <script>: así se ve al instante en la vista previa. Sin librerías externas salvo que de verdad hagan falta (y entonces desde un CDN conocido con versión fija).',
  '- Explicaciones breves y claras, en el idioma de la persona. Nada de disculpas ni frases vacías.',
  'CALIDAD DE CÓDIGO',
  '- Nombres claros y descriptivos; funciones pequeñas con una sola tarea; nada de código muerto ni duplicado; comentarios solo donde explican el porqué.',
  '- JavaScript moderno: const/let, ===, funciones flecha, async/await con try/catch, addEventListener (nunca onclick en el HTML), módulos limpios, sin variables globales sueltas. Nunca metas texto del usuario con innerHTML: usa textContent o escápalo.',
  '- Valida entradas, maneja errores con mensajes amables para la persona y estados de carga, vacío y error. Guarda datos con localStorage cuando tenga sentido (siempre dentro de try/catch).',
  '- Python: PEP 8, type hints, funciones con docstring corto, pathlib, f-strings, if __name__ == "__main__":, manejo de excepciones concreto, sin dependencias innecesarias (si usas una, di cómo instalarla).',
  '- Otros lenguajes: sigue las convenciones oficiales del lenguaje y su herramienta de formato estándar.',
  '- Seguridad: nunca pongas claves ni contraseñas en el código; consultas SQL con parámetros; valida en el servidor.',
  'DISEÑO (cuando hay interfaz)',
  '- Se tiene que ver espectacular y profesional, como un producto real de 2026: jerarquía clara, tipografía del sistema o una buena de Google Fonts, escala de tamaños consistente, espacios en múltiplos de 8px, bordes suaves, sombras sutiles y una paleta de 1 color de acento + neutros definida con variables CSS en :root.',
  '- Responsive de verdad: mobile-first, sin scroll horizontal en un celular de 360px, imágenes con max-width:100%, grid/flex, botones de al menos 44px para el dedo.',
  '- Accesible: HTML semántico (header, main, nav, section, button), lang en <html>, <meta name="viewport">, <title>, alt en imágenes, labels en los campos, contraste mínimo 4.5:1, foco visible con :focus-visible, todo usable con teclado.',
  '- Detalles que enamoran: estados hover, active y focus, transiciones de 150 a 300ms, microanimaciones con prefers-reduced-motion respetado, modo oscuro con prefers-color-scheme si encaja, textos reales (nunca lorem ipsum) e íconos en SVG en línea en vez de imágenes que se pueden romper.',
  'Tu página se probará sola en un navegador (computador y celular): errores de consola, botones, desbordes, imágenes y contraste. Entrégala sin un solo error.'
].join('\n');
const CODE_SYS_SHORT = 'MODO SYNTHCODE (ahorro). Eres un ingeniero senior perfeccionista. Entrega código COMPLETO y funcional (nunca «...», TODO ni partes omitidas), con el nombre del archivo antes de cada bloque y el lenguaje en la cerca. Para webs: un solo index.html con <style> y <script>, responsive, accesible y bonito. Revisa sintaxis, nombres y casos borde antes de terminar. Explica en 1 a 3 líneas cómo usarlo.';
/* ¿esta conversación es de programar? (el último pedido, un archivo de código adjunto o seguir hablando de un código anterior) */
const FIX_TAG = '[Revisión automática de Sonyx]';
const isFix = m => !!m && m.role === 'user' && (!!m.fix || String(m.content || '').startsWith(FIX_TAG));
function codeMode(chat){
  const u = [...chat].reverse().find(m => m.role === 'user'); if (!u) return false;
  if (isFix(u)) return true;
  const t = String(u.ask || u.content || '');
  if (CODE_RX.test(t)) return true;
  if ((u.files || []).some(f => CODE_FILE_RX.test(f.name || ''))) return true;
  const i = chat.lastIndexOf(u), prev = chat.slice(Math.max(0, i - 3), i).filter(m => m.role === 'assistant');
  return t.length < 400 && prev.some(m => /```/.test(m.content || ''));
}
function codeSystem(chat, saver){ return codeMode(chat) ? (saver ? CODE_SYS_SHORT : CODE_SYS) : ''; }

/* ---------- el probador: corre la página aislada y avisa lo que ve ---------- */
/* va pegado al principio de la página, sin saltos de línea, para que los números de línea de los errores sigan siendo los del archivo */
const PROBE = (id, act) => '<script>(function(){var I=' + JSON.stringify(id) + ',A=' + (act ? 1 : 0) + ',cur="";'
  + 'function S(t,d){try{parent.postMessage({szp:I,t:t,d:d},"*")}catch(e){}}'
  + 'function str(v){try{return typeof v==="string"?v:v instanceof Error?v.name+": "+v.message:JSON.stringify(v)}catch(e){return String(v)}}'
  + '["error","warn","log","info"].forEach(function(k){var o=console[k];console[k]=function(){S("con",{k:k,m:[].slice.call(arguments).map(str).join(" ").slice(0,500)});return o&&o.apply(console,arguments)}});'
  + 'addEventListener("error",function(e){var t=e.target;if(t&&t!==window&&t.tagName){S("net",{tag:t.tagName,u:String(t.currentSrc||t.src||t.href||"").slice(0,200)});return}S("exc",{m:e.message||"Error",l:e.lineno||0,c:e.colno||0,a:cur})},true);'
  + 'addEventListener("unhandledrejection",function(e){S("exc",{m:"Promesa sin manejar: "+str(e.reason).slice(0,300),l:0,a:cur})});'
  + 'function rgb(s){var m=String(s).match(/[\\d.]+/g);return m&&m.length>=3?m.map(Number):null}'
  + 'function lum(c){var a=[c[0],c[1],c[2]].map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]}'
  + 'function bg(el){while(el&&el.nodeType===1){var cs=getComputedStyle(el);if(cs.backgroundImage&&cs.backgroundImage!=="none")return null;var c=rgb(cs.backgroundColor);if(c&&(c.length<4||c[3]>.85))return c;el=el.parentElement}return[255,255,255]}'
  + 'function who(el){var s=el.tagName.toLowerCase();if(el.id)s+="#"+el.id;var c=(typeof el.className==="string"?el.className:"").trim().split(/\\s+/).filter(Boolean).slice(0,2);if(c.length)s+="."+c.join(".");return s}'
  + 'function vis(el){var r=el.getBoundingClientRect();if(r.width<1||r.height<1)return false;var cs=getComputedStyle(el);return cs.visibility!=="hidden"&&cs.display!=="none"&&+cs.opacity>.05}'
  + 'function label(el){return(el.getAttribute("aria-label")||el.textContent||el.value||el.title||"").replace(/\\s+/g," ").trim().slice(0,40)}'
  + 'function audit(){var d=document,b=d.body,o={w:innerWidth};if(!b){S("audit",{empty:1});return}'
  + 'o.sw=d.documentElement.scrollWidth;o.over=[];if(o.sw>innerWidth+1){var all=b.querySelectorAll("*");for(var i=0;i<all.length&&o.over.length<4;i++){var r=all[i].getBoundingClientRect();if(r.right>innerWidth+1&&r.width>0&&getComputedStyle(all[i]).position!=="fixed"){var p=all[i].parentElement,pr=p&&p.getBoundingClientRect();if(!pr||pr.right<=innerWidth+1)o.over.push(who(all[i])+" ("+Math.round(r.right)+"px)")}}}'
  + 'o.text=(b.innerText||"").trim().length;o.media=b.querySelectorAll("canvas,svg,img,video,iframe").length;o.els=b.querySelectorAll("*").length;'
  + 'o.broken=[].slice.call(d.images).filter(function(im){return im.complete&&!im.naturalWidth&&im.getAttribute("src")}).map(function(im){return String(im.getAttribute("src")).slice(0,90)}).slice(0,4);'
  + 'o.noalt=[].slice.call(d.images).filter(function(im){return!im.hasAttribute("alt")}).length;'
  + 'o.unnamed=[].slice.call(b.querySelectorAll("button,a[href],[role=button]")).filter(function(el){return vis(el)&&!label(el)&&!el.querySelector("img[alt]:not([alt=\'\']),svg title")}).length;'
  + 'o.nolabel=[].slice.call(b.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]),select,textarea")).filter(function(el){return!(el.labels&&el.labels.length)&&!el.getAttribute("aria-label")&&!el.getAttribute("aria-labelledby")&&!el.getAttribute("title")}).length;'
  + 'o.title=!!(d.title||"").trim();o.vp=!!d.querySelector("meta[name=viewport]");o.lang=!!d.documentElement.getAttribute("lang");'
  + 'var low=[],tiny=0,seen=0,els=b.querySelectorAll("*");for(var j=0;j<els.length&&seen<500;j++){var el=els[j],own="";for(var n=el.firstChild;n;n=n.nextSibling)if(n.nodeType===3)own+=n.nodeValue;own=own.trim();if(!own||!vis(el))continue;seen++;var cs=getComputedStyle(el),fs=parseFloat(cs.fontSize)||16;if(fs<11.5)tiny++;var fg=rgb(cs.color),bk=bg(el);if(!fg||!bk||(fg.length>3&&fg[3]<.5))continue;var L1=lum(fg),L2=lum(bk),cr=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05),big=fs>=24||(fs>=18.6&&+cs.fontWeight>=700);if(cr<(big?3:4.5)&&low.length<3)low.push("«"+own.slice(0,30)+"» ("+cr.toFixed(1)+":1)")}'
  + 'o.low=low;o.tiny=tiny;o.btns=[].slice.call(b.querySelectorAll("button,[role=button],input[type=button]")).filter(vis).length;S("audit",o)}'
  + 'function poke(){var bs=[].slice.call(document.querySelectorAll("button:not([disabled]),[role=button],input[type=button]")).filter(vis).slice(0,14),k=0;'
  + '(function next(){if(k>=bs.length){cur="";S("done",{n:bs.length});return}var el=bs[k++];cur=label(el)||who(el);try{if(el.isConnected)el.click()}catch(e){S("exc",{m:str(e),l:0,a:cur})}setTimeout(next,140)})()}'
  + 'addEventListener("load",function(){setTimeout(function(){audit();if(A)setTimeout(poke,200);else S("done",{n:0})},600)});'
  + '})();<\/script>';
function probeDoc(html, id, act){
  /* el probador va primero que todo; si la página no tiene <head>, igual queda arriba */
  const p = PROBE(id, act);
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, m => m + p);
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, m => m + p);
  return p + html;
}
/* corre una página escondida con un ancho dado y junta lo que pasó */
function runProbe(doc, w, h, act){
  return new Promise(res => {
    const id = 'p' + Math.random().toString(36).slice(2, 10), out = { exc:[], con:[], net:[], audit:null, done:false, alive:false, w };
    const f = document.createElement('iframe');
    f.setAttribute('sandbox', 'allow-scripts'); f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    f.style.cssText = 'position:fixed;left:-30000px;top:0;width:' + w + 'px;height:' + h + 'px;border:0;opacity:0;pointer-events:none';
    let t = 0;
    const end = () => { clearTimeout(t); removeEventListener('message', on); f.remove(); res(out); };
    const on = e => {
      const d = e.data; if (!d || d.szp !== id || e.source !== f.contentWindow) return;
      out.alive = true;
      if (d.t === 'exc' && out.exc.length < 12) out.exc.push(d.d);
      else if (d.t === 'con' && out.con.length < 40) out.con.push(d.d);
      else if (d.t === 'net' && out.net.length < 8) out.net.push(d.d);
      else if (d.t === 'audit') out.audit = d.d;
      else if (d.t === 'done'){ out.done = true; setTimeout(end, 120); }
    };
    addEventListener('message', on);
    t = setTimeout(end, act ? 9000 : 6500);
    document.body.appendChild(f);
    synLoad(f, probeDoc(doc, id, act));
  });
}
/* ---------- revisión de cada archivo ---------- */
const PLACEHOLDER_RX = /(?:\/\/|#|<!--|\/\*)\s*(?:\.\.\.|…)|(?:\/\/|#|<!--|\/\*)[^\n]*\b(?:resto (?:del|igual|de)|el resto|rest of (?:the )?code|same as (?:before|above)|igual que (?:antes|arriba)|(?:tu|your) c[oó]digo aqu[ií]|(?:your )?code (?:goes )?here|agrega(?:r)? (?:aqu[ií]|el resto)|completa(?:r)? aqu[ií]|implementa(?:r)? aqu[ií])|(?:\/\/|#)\s*TODO\b|lorem ipsum/i;
const lineAt = (txt, n) => { const L = String(txt).split('\n')[n - 1]; return L ? L.trim().slice(0, 140) : ''; };
function staticIssues(M){
  const hard = [], soft = [], t = M.text;
  { const m = t.match(PLACEHOLDER_RX); if (m) (/lorem ipsum/i.test(m[0]) ? soft : hard).push(/lorem ipsum/i.test(m[0]) ? M.name + ': usa texto de relleno (lorem ipsum) en vez de texto real.' : M.name + ': está incompleto, tiene partes omitidas («' + lineAt(t, t.slice(0, m.index).split('\n').length).slice(0, 80) + '»). Hay que escribirlo entero.'); }
  if (/^(html|htm)$/.test(M.ext) && /<html[\s>]/i.test(t) && !/<\/html>\s*$/i.test(t.trim())) hard.push(M.name + ': el archivo se cortó antes de terminar (no llega hasta </html>).');
  if (M.ext === 'json'){ try{ JSON.parse(t); }catch(e){ hard.push(M.name + ': el JSON no es válido (' + String(e.message).slice(0, 120) + ').'); } }
  if (/^(css|scss)$/.test(M.ext)){ const o = (t.replace(/\/\*[\s\S]*?\*\//g, '').match(/\{/g) || []).length, c = (t.replace(/\/\*[\s\S]*?\*\//g, '').match(/\}/g) || []).length; if (o !== c) hard.push(M.name + ': las llaves { } no cuadran (' + o + ' abren y ' + c + ' cierran).'); }
  if (M.ext === 'svg'){ try{ const d = new DOMParser().parseFromString(t, 'image/svg+xml'); const pe = d.querySelector('parsererror'); if (pe) hard.push(M.name + ': el SVG está mal formado (' + pe.textContent.replace(/\s+/g, ' ').trim().slice(0, 120) + ').'); }catch(e){} }
  return { hard, soft };
}
/* JavaScript suelto: solo se revisa que esté bien escrito (se envuelve en una función que nunca se llama, así no corre nada) */
async function jsSyntax(M){
  if (!/^(js|mjs|cjs)$/.test(M.ext) || /^\s*(import|export)\s/m.test(M.text) || /<\/script/i.test(M.text)) return [];
  const code = M.text.replace(/^#!.*/, '');   /* el #! de node se deja como línea vacía: los números de línea no cambian */
  const r = await runProbe('<!doctype html><html><head></head><body><script>async function __sz(){\n' + code + '\n}<\/script></body></html>', 400, 300, false);
  return r.exc.filter(x => /SyntaxError|Unexpected|missing|Invalid|unterminated/i.test(x.m)).slice(0, 2).map(x => M.name + (x.l > 1 ? ' (línea ' + (x.l - 1) + ': ' + lineAt(M.text, x.l - 1) + ')' : '') + ': ' + x.m);
}
/* página HTML: computador con clics en los botones + celular */
async function pageIssues(M, sibs){
  const hard = [], soft = [], meta = { btns:0 };
  const doc = previewDoc(M, sibs);
  const [pc, cel] = await Promise.all([runProbe(doc, 1280, 800, true), runProbe(doc, 390, 844, false)]);
  if (!pc.alive && !cel.alive){ hard.push(M.name + ': la página no respondió (puede tener un ciclo infinito o un error que la congela).'); return { hard, soft, meta }; }
  const docLines = doc.split('\n'), seen = new Set();
  [...pc.exc, ...cel.exc].forEach(x => {
    const key = x.m + '|' + x.l + '|' + (x.a || ''); if (seen.has(key)) return; seen.add(key);
    const src = x.l ? (docLines[x.l - 1] || '').trim().slice(0, 140) : '';
    hard.push(M.name + ': ' + (x.a ? 'al tocar «' + x.a + '» sale el error ' : 'error al cargar: ') + x.m + (src ? ' — en la línea «' + src + '»' : ''));
  });
  [...new Set([...pc.con, ...cel.con].filter(c => c.k === 'error').map(c => c.m))].slice(0, 3).forEach(m => soft.push(M.name + ': la consola muestra un error: ' + m));
  [...new Map([...pc.net, ...cel.net].map(n => [n.u, n])).values()].slice(0, 3).forEach(n => soft.push(M.name + ': no cargó ' + n.tag.toLowerCase() + ' ' + (n.u || '(sin dirección)') + '.'));
  const a = pc.audit, c = cel.audit;
  if (a){
    meta.btns = a.btns || 0;
    if (!a.text && !a.media && (a.els || 0) < 4) hard.push(M.name + ': la página sale en blanco (no muestra nada).');
    if (a.over && a.over.length) soft.push(M.name + ': en computador algo se sale de la pantalla: ' + a.over.join(', ') + '.');
    if (a.broken && a.broken.length) soft.push(M.name + ': imágenes rotas: ' + a.broken.join(', ') + '. Mejor usa SVG o CSS.');
    if (a.low && a.low.length) soft.push(M.name + ': texto con poco contraste (difícil de leer): ' + a.low.join(', ') + '. Debe ser al menos 4.5:1.');
    if (a.noalt) soft.push(M.name + ': ' + a.noalt + ' imagen(es) sin texto alternativo (alt).');
    if (a.unnamed) soft.push(M.name + ': ' + a.unnamed + ' botón(es) o enlace(s) sin nombre (solo ícono, sin aria-label).');
    if (a.nolabel) soft.push(M.name + ': ' + a.nolabel + ' campo(s) sin etiqueta (label).');
    if (!a.vp) soft.push(M.name + ': falta <meta name="viewport"> (en el celular se verá diminuta).');
    if (!a.title) soft.push(M.name + ': falta el <title> de la página.');
    if (!a.lang) soft.push(M.name + ': falta lang en <html>.');
  }
  if (c){
    if (c.sw > c.w + 1) soft.push(M.name + ': en celular (390px) la página se sale de lado y hay que moverla con el dedo' + (c.over && c.over.length ? ' por: ' + c.over.join(', ') : '') + '.');
    if (c.tiny > 3) soft.push(M.name + ': en celular hay ' + c.tiny + ' textos demasiado pequeños (menos de 12px).');
  }
  return { hard, soft, meta };
}
/* revisa todos los archivos de una respuesta */
async function checkFiles(body){
  /* solo los archivos: los trocitos cortos de una explicación pueden estar incompletos a propósito */
  const cards = $$('.fcard:not(.deck) pre', body).map(cnvMeta);
  const hard = [], soft = [], pages = [];
  let btns = 0;
  for (const M of cards){
    const s = staticIssues(M); hard.push(...s.hard); soft.push(...s.soft);
    hard.push(...await jsSyntax(M));
  }
  const htmls = cards.filter(M => /^(html|htm)$/.test(M.ext)).slice(0, 2);
  for (const M of htmls){ const r = await pageIssues(M, cards); hard.push(...r.hard); soft.push(...r.soft); btns += r.meta.btns; pages.push(M.name); }
  return { hard:[...new Set(hard)], soft:[...new Set(soft)], pages, btns, files:cards.length };
}
const hasCode = body => !!$('.fcard:not(.deck)', body);
const isPage = body => $$('.fcard:not(.deck) pre', body).some(pre => /^(html|htm)$/.test(cnvMeta(pre).ext));

/* ---------- la barrita de revisión debajo de la respuesta ---------- */
const CK_ICO = {
  run:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9"/></svg>',
  ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
  fix:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/></svg>'
};
function ckBar(el){
  let b = $('.ckbar', el);
  if (!b){ b = document.createElement('div'); b.className = 'ckbar'; b.setAttribute('role', 'status'); b.setAttribute('aria-live', 'polite'); const meta = $('.meta', el) || $('.acts', el); if (meta) meta.before(b); else el.appendChild(b); }
  return b;
}
function ckIdle(el){
  if (!isPage($('.body', el)) || $('.ckbar', el)) return;
  const b = ckBar(el); b.className = 'ckbar idle';
  b.innerHTML = '<button type="button" class="ck-go">' + CK_ICO.ok + '<span>' + (isPage($('.body', el)) ? 'Comprobar la página en computador y celular' : 'Revisar el código') + '</span></button>';
  $('.ck-go', b).addEventListener('click', () => codeCheck(el, { auto:false }));
}
function ckPaint(el, r, o){
  const b = ckBar(el), n = r.hard.length + r.soft.length;
  const where = r.pages.length ? 'en computador y celular' : '';
  if (!n){
    b.className = 'ckbar ok';
    b.innerHTML = '<span class="ck-ic">' + CK_ICO.ok + '</span><span class="ck-t"><b>' + (r.pages.length ? 'Página comprobada' : 'Código revisado') + '</b><small>' + (r.pages.length ? 'Carga sin errores ' + where + (r.btns ? ' · probé ' + r.btns + (r.btns === 1 ? ' botón' : ' botones') : '') : 'Sin errores de sintaxis ni partes incompletas') + '</small></span>';
    return;
  }
  b.className = 'ckbar ' + (r.hard.length ? 'bad' : 'warn');
  b.innerHTML = '<button type="button" class="ck-row" aria-expanded="false"><span class="ck-ic">' + CK_ICO.warn + '</span><span class="ck-t"><b>' + (r.hard.length ? (r.hard.length === 1 ? '1 error' : r.hard.length + ' errores') + (r.soft.length ? ' y ' + r.soft.length + ' detalle' + (r.soft.length === 1 ? '' : 's') : '') : n + (n === 1 ? ' detalle por pulir' : ' detalles por pulir')) + '</b><small>' + (o.note || 'Toca para ver qué encontré') + '</small></span></button>'
    + '<button type="button" class="btn sm ck-fix">' + CK_ICO.fix + '<span>Arreglar con la IA</span></button>'
    + '<ul class="ck-l" hidden></ul>';
  const ul = $('.ck-l', b);
  [...r.hard.map(t => ['bad', t]), ...r.soft.map(t => ['warn', t])].forEach(([k, t]) => { const li = document.createElement('li'); li.className = k; li.textContent = t; ul.appendChild(li); });
  const row = $('.ck-row', b);
  row.addEventListener('click', () => { const on = ul.hidden; ul.hidden = !on; row.setAttribute('aria-expanded', String(on)); b.classList.toggle('open', on); });
  $('.ck-fix', b).addEventListener('click', () => fixWithAI(el, r, false));
}
let ckRun = 0;
async function codeCheck(el, o = {}){
  const body = $('.body', el); if (!body || !hasCode(body)) return null;
  const my = ++ckRun, b = ckBar(el), page = isPage(body);
  b.className = 'ckbar run'; b.innerHTML = '<span class="ck-ic spin">' + CK_ICO.run + '</span><span class="ck-t"><b>' + (page ? 'Probando la página…' : 'Revisando el código…') + '</b><small>' + (page ? 'La abro en un computador y en un celular, toco los botones y busco errores' : 'Busco errores de sintaxis y partes incompletas') + '</small></span>';
  let r; try{ r = await checkFiles(body); }catch(e){ b.remove(); return null; }
  if (!el.isConnected) return r;
  const can = o.auto && r.hard.length && !o.noAuto && my === ckRun;
  ckPaint(el, r, { note:can ? 'La IA los está arreglando sola…' : '' });
  if (can) fixWithAI(el, r, true);
  return r;
}
/* le pasa a la IA lo que encontró el probador, para que devuelva todo arreglado */
function fixPrompt(r){
  const L = [...r.hard.map(t => '- [ERROR] ' + t), ...r.soft.map(t => '- [MEJORA] ' + t)].join('\n');
  return FIX_TAG + ' ' + (r.pages.length ? 'Probé tu página en un navegador real (computador de 1280px y celular de 390px, tocando los botones)' : 'Revisé tu código') + ' y encontré esto:\n' + L
    + '\n\nArregla TODO lo de la lista, primero los errores. Devuelve cada archivo que cambie COMPLETO (sin «...» ni partes omitidas) y con el mismo nombre. No cambies lo que ya funciona ni el diseño que no tiene problemas. Al final, en «**Revisión**», di en una línea por punto qué arreglaste.';
}
function fixWithAI(el, r, auto){
  if (Object.keys(busy).length){ toast('Espera a que la IA termine de responder.'); return; }
  if (mode !== 'solo'){ toast('Arreglar funciona con una sola IA.'); return; }
  if (isLocked && isLocked()){ lockNudge(); return; }
  const chat = chatArr(), ci = +el.dataset.ci;
  if (!(ci === chat.length - 1)){ toast('Eso era de una respuesta anterior. Pídele a la IA el arreglo en un mensaje nuevo.'); return; }
  if (!budgetOk()) return;
  const msg = { role:'user', content:fixPrompt(r), fix:{ n:r.hard.length + r.soft.length, auto:!!auto } };
  chat.push(msg); touchThread(); save(); renderMsgs();
  const failed = err => {
    const i = chat.lastIndexOf(msg); if (i > -1) chat.splice(i, 1); save(); renderMsgs();
    if (!(err && err.aborted)) toast(auto ? 'No pude pedirle el arreglo a la IA ahora. Toca «Arreglar con la IA» para intentarlo otra vez.' : (err && err.message) || 'No pude pedir el arreglo. Intenta otra vez.');
  };
  /* v3.4 · con SuperiorSynth el proyecto no se detiene: si la IA falla, el arreglo lo sigue otra IA experta en código */
  if (agentOn()) runExpert('codigo').then(x => { if (!x.ok) failed(x.err); });
  else runSolo(failed);
}
/* tu mensaje de arreglo se ve como una notita, no como un muro de texto */
function fixNoteEl(m){
  const el = document.createElement('div'); el.className = 'fixnote';
  const n = (m.fix && m.fix.n) || (String(m.content || '').match(/^- \[/gm) || []).length;
  el.innerHTML = '<button type="button" class="fx-row" aria-expanded="false"><span class="fx-ic">' + CK_ICO.fix + '</span><span class="fx-t"></span></button><pre class="fx-d" hidden></pre>';
  $('.fx-t', el).textContent = (m.fix && m.fix.auto ? 'Revisión automática: ' : 'Le pediste a la IA que arregle ') + n + (n === 1 ? ' problema' : ' problemas') + (m.fix && m.fix.auto ? ' encontrados, la IA los arregla' : '');
  $('.fx-d', el).textContent = String(m.content || '').slice(String(m.content || '').startsWith(FIX_TAG) ? FIX_TAG.length : 0).trim();
  const row = $('.fx-row', el), d = $('.fx-d', el);
  row.addEventListener('click', () => { const on = d.hidden; d.hidden = !on; row.setAttribute('aria-expanded', String(on)); el.classList.toggle('open', on); });
  return el;
}
/* después de cada respuesta nueva con código: se prueba sola. Si la respuesta ya era un arreglo automático, no vuelve a arreglar sola (así no da vueltas) */
function codeAfter(el, chat){
  if (!el || !hasCode($('.body', el))) return;
  const ci = +el.dataset.ci, prevU = chat.slice(0, ci).reverse().find(m => m.role === 'user');
  const noAuto = isFix(prevU) || !!st().sx.saver;
  setTimeout(() => { if (el.isConnected) codeCheck(el, { auto:true, noAuto }); }, 350);
}

/* ---------- el lienzo con herramientas: consola, tamaños de pantalla y volver a cargar ---------- */
const CV_SIZES = [['pc', 'Computador', '100%'], ['tab', 'Tablet', '820px'], ['cel', 'Celular', '390px']];
function cvTools(o, box, M, sibs){
  const bar = document.createElement('div'); bar.className = 'cvt';
  bar.innerHTML = '<div class="cvt-sz" role="group" aria-label="Tamaño de pantalla">' + CV_SIZES.map(([k, l]) => '<button type="button" data-sz="' + k + '" aria-pressed="' + (k === 'pc') + '">' + l + '</button>').join('') + '</div>'
    + '<button type="button" class="cvt-b" data-cvt="reload" title="Volver a cargar" aria-label="Volver a cargar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg></button>'
    + '<button type="button" class="cvt-b cvt-con" data-cvt="con" aria-expanded="false"><span>Consola</span><b class="cvt-n">0</b></button>';
  const con = document.createElement('div'); con.className = 'cvt-log'; con.hidden = true; con.innerHTML = '<p class="cvt-empty">Aquí sale lo que la página escribe en la consola y sus errores.</p>';
  box.classList.add('tools'); box.prepend(bar); box.append(con);
  let id = '', errs = 0, lines = 0;
  const add = (k, t) => {
    const e = $('.cvt-empty', con); if (e) e.remove();
    const p = document.createElement('div'); p.className = 'cvt-ln ' + k; p.textContent = t; con.appendChild(p); con.scrollTop = con.scrollHeight;
    lines++; if (k === 'error') errs++;
    const n = $('.cvt-n', bar); n.textContent = errs ? errs + (errs === 1 ? ' error' : ' errores') : String(lines); bar.classList.toggle('has-err', errs > 0);
  };
  const on = e => {
    const d = e.data, f = $('iframe', box); if (!d || d.szp !== id || !f || e.source !== f.contentWindow) return;
    if (d.t === 'con') add(d.d.k, d.d.m);
    else if (d.t === 'exc') add('error', d.d.m + (d.d.l ? ' (línea ' + d.d.l + ')' : ''));
    else if (d.t === 'net') add('warn', 'No cargó: ' + d.d.u);
  };
  addEventListener('message', on);
  const obs = new MutationObserver(() => { if (!o.isConnected){ removeEventListener('message', on); obs.disconnect(); } }); obs.observe(document.body, { childList:true });
  const load = () => {
    const f = $('iframe', box); if (!f) return;
    id = 'v' + Math.random().toString(36).slice(2, 10); errs = 0; lines = 0;
    con.innerHTML = '<p class="cvt-empty">Aquí sale lo que la página escribe en la consola y sus errores.</p>'; $('.cvt-n', bar).textContent = '0'; bar.classList.remove('has-err');
    synLoad(f, probeDoc(previewDoc(M, sibs), id, false));
  };
  bar.addEventListener('click', e => {
    const s = e.target.closest('.cvt-sz [data-sz]');
    if (s){ $$('[data-sz]', bar).forEach(x => x.setAttribute('aria-pressed', String(x === s))); box.dataset.size = s.dataset.sz; const f = $('iframe', box); if (f) f.style.maxWidth = CV_SIZES.find(x => x[0] === s.dataset.sz)[2]; return; }
    const t = e.target.closest('[data-cvt]'); if (!t) return;
    if (t.dataset.cvt === 'reload') load();
    else { con.hidden = !con.hidden; t.setAttribute('aria-expanded', String(!con.hidden)); }
  });
  return { load };
}

/* ---------- colores en el código del lienzo (ligero, sin librerías) ---------- */
const HL_KW = 'abstract|and|as|async|await|break|case|catch|class|const|continue|def|default|del|do|elif|else|enum|except|export|extends|false|False|finally|fn|for|from|func|function|go|if|impl|import|in|interface|is|lambda|let|match|mut|new|nil|None|not|null|or|pass|private|protected|pub|public|raise|return|self|static|struct|super|switch|this|throw|true|True|try|type|typeof|undefined|use|var|void|while|with|yield';
const HL_RX = {
  c:new RegExp('(\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*)|(`(?:\\\\[\\s\\S]|[^`\\\\])*`|"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\')|\\b(' + HL_KW + ')\\b|\\b(\\d+(?:\\.\\d+)?)\\b|([A-Za-z_$][\\w$]*)(?=\\s*\\()', 'g'),
  py:new RegExp('(#[^\\n]*)|("""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|[rfb]?"(?:\\\\.|[^"\\\\\\n])*"|[rfb]?\'(?:\\\\.|[^\'\\\\\\n])*\')|\\b(' + HL_KW + ')\\b|\\b(\\d+(?:\\.\\d+)?)\\b|([A-Za-z_][\\w]*)(?=\\s*\\()', 'g'),
  css:/(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(@[\w-]+|!important)|(#[\da-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|rem|em|%|vh|vw|s|ms|deg|fr)?\b)|([\w-]+)(?=\s*:[^;{]*[;}])/g,
  html:/(<!--[\s\S]*?-->)|("[^"]*"|'[^']*')|(<\/?[\w-]+|\/?>)|(&\w+;)|(\s[\w:-]+)(?==)/g
};
function hlCode(text, ext){
  const k = /^(py)$/.test(ext) ? 'py' : /^(css|scss)$/.test(ext) ? 'css' : /^(html|htm|xml|svg|vue)$/.test(ext) ? 'html' : /^(js|mjs|jsx|ts|tsx|java|c|cpp|cs|go|rs|php|swift|kt|dart|json|lua|sh)$/.test(ext) ? 'c' : '';
  if (!k || text.length > 200000) return esc(text);
  const cls = ['', 'hc', 'hs', 'hk', 'hn', 'hf'];
  let out = '', last = 0;
  text.replace(HL_RX[k], (m, ...g) => { const at = g[g.length - 2]; const i = g.findIndex((x, j) => j < 5 && x !== undefined); out += esc(text.slice(last, at)) + (i > -1 ? '<span class="' + cls[i + 1] + '">' + esc(m) + '</span>' : esc(m)); last = at + m.length; return m; });
  return out + esc(text.slice(last));
}
