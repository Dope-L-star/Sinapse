/* ---------- v4.1 · Páginas web de varios archivos: se juntan y se ven funcionando (Sammuel, 3 nov) ----------
   Cuando la IA da una página en varios bloques (index.html, css/estilos.css, js/app.js, otra.html…):
   1) se agrupan como un proyecto con sus rutas (la tarjeta «Página web · N archivos»);
   2) cada HTML se arma con su CSS, su JS, sus SVG y sus JSON aunque vengan en bloques separados (rutas relativas resueltas);
   3) los enlaces entre páginas navegan DENTRO de la vista previa; los de afuera piden permiso para abrirse;
   4) todo se descarga en un .zip con sus carpetas.
   La vista previa sigue corriendo en /sintetico.html dentro de un iframe sandbox (sin allow-same-origin): no ve tu sesión ni tus chats.
   La ventana (pestañas, pantalla completa…) es React: next/componentes/synthflow/VistaWeb.jsx. Aquí solo va la lógica. */
const WEB_EXT = new Set(['html', 'htm', 'css', 'js', 'mjs', 'svg', 'json', 'md', 'txt', 'csv', 'xml']);
const webIsPage = p => /\.html?$/i.test(p);
/* «./css/../css/estilos.css» → «css/estilos.css» */
function webNorm(p){
  const out = [];
  String(p || '').replace(/\\/g, '/').split('/').forEach(s => { if (!s || s === '.') return; if (s === '..') out.pop(); else out.push(s); });
  return out.join('/');
}
const webDir = p => p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '';
/* ¿a qué archivo del proyecto apunta «ref» escrito dentro de «from»? null si es de internet, un #ancla, data:, mailto:… */
function webRef(from, ref){
  ref = String(ref || '').trim();
  if (!ref || /^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(ref)) return null;
  const hash = ref.includes('#') ? ref.slice(ref.indexOf('#')) : '';
  const clean = ref.replace(/[?#].*$/, '');
  if (!clean) return null;
  let path; try{ path = decodeURI(clean); }catch(e){ path = clean; }
  return { path:webNorm(clean.startsWith('/') ? path : webDir(from) + path), hash };
}
/* busca el archivo: ruta exacta, sin importar mayúsculas, o por su nombre si solo hay uno así (la IA a veces titula «estilos.css» y enlaza «css/estilos.css») */
function webFind(P, path){
  if (!path) return null;
  const F = P.files;
  return F.find(f => f.path === path) || F.find(f => f.path.toLowerCase() === path.toLowerCase())
    || (() => { const base = path.split('/').pop().toLowerCase(), m = F.filter(f => f.path.split('/').pop().toLowerCase() === base); return m.length === 1 ? m[0] : null; })();
}
/* junta los archivos de una respuesta; solo es «página web» si hay al menos un HTML y dos archivos web */
function webProject(metas){
  const map = new Map();
  (metas || []).forEach(M => {
    if (!M || !WEB_EXT.has(M.ext)) return;
    const path = webNorm(M.name) || M.name;
    map.set(path, { path, name:path.split('/').pop(), ext:M.ext, text:M.text, label:M.label, lines:M.lines, named:M.named });
  });
  const files = [...map.values()];
  const pages = files.filter(f => webIsPage(f.path));
  if (!pages.length || files.length < 2) return null;
  const entry = (pages.find(f => /^index\.html?$/i.test(f.path)) || pages.find(f => /(^|\/)index\.html?$/i.test(f.path)) || pages[0]).path;
  const t = (pages.find(f => f.path === entry).text.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  const title = t ? t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) : '';
  return { files, pages:pages.map(f => f.path), entry, title };
}
/* lo que usa cada página: para saber qué CSS o JS quedó sin enlazar (la IA lo dio pero olvidó el <link> o lo nombró distinto) */
function webUsed(P){
  const used = new Set();
  P.files.filter(f => webIsPage(f.path)).forEach(f => {
    f.text.replace(/<(?:link|script|img|source|use|a|iframe)\b[^>]*?\s(?:href|src)\s*=\s*["']([^"']+)["']/gi, (m, u) => { const r = webRef(f.path, u), x = r && webFind(P, r.path); if (x) used.add(x.path); return m; });
  });
  P.files.filter(f => f.ext === 'css').forEach(f => f.text.replace(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)/gi, (m, u) => { const r = webRef(f.path, u), x = r && webFind(P, r.path); if (x) used.add(x.path); return m; }));
  return used;
}
const webB64 = s => { try{ return btoa(unescape(encodeURIComponent(s))); }catch(e){ return ''; } };
const webData = f => 'data:' + (f.ext === 'svg' ? 'image/svg+xml' : f.ext === 'json' ? 'application/json' : f.ext === 'css' ? 'text/css' : /^m?js$/.test(f.ext) ? 'text/javascript' : 'text/plain') + ';charset=utf-8;base64,' + webB64(f.text);
/* url(…) dentro de un CSS: los SVG del proyecto van en línea */
function webCssUrls(P, from, css){
  return css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (m, q, u) => { const r = webRef(from, u), f = r && webFind(P, r.path); return f && f.ext === 'svg' ? 'url("' + webData(f) + '")' : m; });
}
function webCss(P, f, seen = new Set()){
  if (seen.has(f.path)) return ''; seen.add(f.path);
  let css = f.text.replace(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)["']?\s*\)?[^;]*;/gi, (m, u) => { const r = webRef(f.path, u), x = r && webFind(P, r.path); return x && x.ext === 'css' ? webCss(P, x, seen) : m; });
  return webCssUrls(P, f.path, css);
}
const webScriptText = t => String(t).replace(/<\/script/gi, '<\\/script');
/* un mismo renglón al principio: no mueve los números de línea de los errores. Avisa a SynthFlow de los clics en enlaces y formularios */
const WEB_NAV = (id, files, hash) => '<script>(function(){var I=' + JSON.stringify(id) + ',H=' + JSON.stringify(hash || '') + ',F=' + JSON.stringify(files).replace(/<\//g, '<\\/') + ';'
  + 'function S(t,d){try{parent.postMessage({szw:I,t:t,d:d},"*")}catch(e){}}'
  + 'function ext(h){return /^(https?:|mailto:|tel:)/i.test(h)}'
  + 'function local(h){return h&&!/^(#|javascript:|data:|blob:|about:)/i.test(h)&&!ext(h)&&!/^\\/\\//.test(h)}'
  + 'document.addEventListener("click",function(e){if(e.defaultPrevented||e.button)return;var a=e.target&&e.target.closest&&e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href")||"";if(a.hasAttribute("download"))return;'
  + 'if(ext(h)){e.preventDefault();S("ext",h);return}if(local(h)){e.preventDefault();S("nav",h)}},false);'
  + 'addEventListener("submit",function(e){if(e.defaultPrevented)return;var f=e.target,h=(f.getAttribute&&f.getAttribute("action"))||"";e.preventDefault();if(ext(h))S("ext",h);else if(local(h))S("nav",h);else S("form","")},false);'
  /* fetch("datos.json") y similares: los archivos del proyecto responden sin salir a internet */
  + 'var of=window.fetch;if(of)window.fetch=function(u,o){try{var s=typeof u==="string"?u:u&&u.url||"";if(!/^[a-z][\\w+.-]*:|^\\/\\//i.test(s)){var p=s.replace(/[?#].*$/,"").replace(/^\\.?\\//,"");for(var k in F){if(k===p||k.split("/").pop()===p.split("/").pop()){return Promise.resolve(new Response(F[k][1],{status:200,headers:{"content-type":F[k][0]}}))}}}}catch(e){}return of.apply(this,arguments)};'
  + 'if(H)addEventListener("load",function(){try{var e=document.getElementById(decodeURIComponent(H.slice(1)));if(e)e.scrollIntoView()}catch(x){}});'
  + '})();<\/script>';
/* arma una página del proyecto en un solo HTML que corre aislado */
function webDoc(P, path, o = {}){
  const f = webFind(P, path) || webFind(P, P.entry);
  let h = f.text;
  if (!/<html[\s>]|<body[\s>]|<!doctype/i.test(h)) h = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + h + '</body></html>';
  const from = f.path, used = new Set();
  /* <link rel="stylesheet" href="css/estilos.css"> → <style> con el CSS */
  h = h.replace(/<link\b[^>]*>/gi, tag => {
    const href = (tag.match(/\shref\s*=\s*["']([^"']+)["']/i) || [])[1]; const r = href && webRef(from, href), x = r && webFind(P, r.path);
    if (!x) return tag;
    if (x.ext === 'css' && (/rel\s*=\s*["']?[^"'>]*stylesheet/i.test(tag) || !/\srel\s*=/i.test(tag))){ used.add(x.path); return '<style data-sz-file="' + esc(x.path) + '">' + webCss(P, x) + '</style>'; }
    if (x.ext === 'svg') return tag.replace(/\shref\s*=\s*["'][^"']+["']/i, ' href="' + webData(x) + '"');
    return tag;
  });
  /* <script src="js/app.js"></script> → el código en línea (con sus otros atributos: type="module", defer…) */
  h = h.replace(/<script\b([^>]*?)\ssrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (m, a, src, b) => {
    const r = webRef(from, src), x = r && webFind(P, r.path); if (!x || !/^m?js$/.test(x.ext)) return m;
    used.add(x.path); const attrs = (a + b).replace(/\s(?:defer|async)\b(?:\s*=\s*["'][^"']*["'])?/gi, '');
    return '<script' + attrs + ' data-sz-file="' + esc(x.path) + '">' + webScriptText(x.text) + '</script>';
  });
  /* imágenes y fondos SVG del proyecto */
  h = h.replace(/(<(?:img|source|use|image)\b[^>]*?\s(?:src|href|xlink:href)\s*=\s*["'])([^"']+)(["'])/gi, (m, a, u, z) => { const r = webRef(from, u), x = r && webFind(P, r.path); return x && x.ext === 'svg' ? a + webData(x) + (r.hash || '') + z : m; });
  h = h.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, a, css, z) => /data-sz-file/.test(a) ? m : a + webCssUrls(P, from, css) + z);
  h = h.replace(/(\sstyle\s*=\s*")([^"]*url\([^"]*)(")/gi, (m, a, css, z) => a + webCssUrls(P, from, css).replace(/"/g, '&quot;') + z);
  /* lo que la IA dio pero no enlazó: igual se usa (CSS arriba, JS al final), si ninguna página lo enlaza */
  const all = webUsed(P);
  const orphanCss = P.files.filter(x => x.ext === 'css' && !all.has(x.path) && !used.has(x.path));
  const orphanJs = P.files.filter(x => /^m?js$/.test(x.ext) && !all.has(x.path) && !used.has(x.path) && !/^\s*(import|export)\s/m.test(x.text) && !/require\(|module\.exports|process\.env/.test(x.text));
  if (orphanCss.length){ const st = orphanCss.map(x => '<style data-sz-file="' + esc(x.path) + '">' + webCss(P, x) + '</style>').join(''); h = /<\/head>/i.test(h) ? h.replace(/<\/head>/i, m => st + m) : st + h; }
  if (orphanJs.length){ const sc = orphanJs.map(x => '<script data-sz-file="' + esc(x.path) + '">' + webScriptText(x.text) + '</script>').join(''); h = /<\/body>(?![\s\S]*<\/body>)/i.test(h) ? h.replace(/<\/body>(?![\s\S]*<\/body>)/i, m => sc + m) : h + sc; }
  /* el ayudante de navegación va primero que todo, en un solo renglón */
  if (o.nav !== false){
    const fx = {}; P.files.filter(x => !webIsPage(x.path) && !/^(css|m?js)$/.test(x.ext)).forEach(x => { if (x.text.length < 400000) fx[x.path] = [MIME[x.ext] || 'text/plain', x.text]; });
    const n = WEB_NAV(o.navId || '', fx, o.hash);
    if (/<head[^>]*>/i.test(h)) h = h.replace(/<head[^>]*>/i, m => m + n); else if (/<html[^>]*>/i.test(h)) h = h.replace(/<html[^>]*>/i, m => m + n); else h = n + h;
  }
  return o.probeId ? probeDoc(h, o.probeId, false) : h;
}
/* a qué página va un enlace tocado dentro de la vista previa */
function webGo(P, from, href){
  const r = webRef(from, href); if (!r) return null;
  let path = r.path;
  if (!path || /\/$/.test(href.replace(/[?#].*$/, ''))) path = webNorm(path + '/index.html');
  let x = webFind(P, path);
  if (!x && !/\.[a-z0-9]{1,5}$/i.test(path)) x = webFind(P, path + '.html') || webFind(P, webNorm(path + '/index.html'));
  return x ? { path:x.path, hash:r.hash, page:webIsPage(x.path) } : { path, hash:r.hash, missing:true };
}

/* ---------- el .zip (sin librerías: formato «stored», con carpetas y nombres UTF-8) ---------- */
const WEB_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function webCrc(u8){ let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = WEB_CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function webZipBytes(entries){
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  entries.forEach(([name, text]) => {
    const nm = enc.encode(name), data = enc.encode(text), crc = webCrc(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), nm, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), nm);
    off += 30 + nm.length + data.length;
  });
  const size = central.reduce((s, x) => s + x.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, entries.length, true); e.setUint16(10, entries.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
  return [...parts, ...central, new Uint8Array(e.buffer)];
}
const webSlug = P => (P.title || P.entry.replace(/\.html?$/i, '') || 'pagina-web').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'pagina-web';
function webZip(P){
  const en = SZ.lang() === 'en';
  try{
    const blob = new Blob(webZipBytes(P.files.map(f => [f.path, f.text])), { type:'application/zip' }), u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = webSlug(P) + '.zip'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
    toast(en ? 'Downloaded ' + a.download + ' (' + P.files.length + ' files).' : 'Descargué ' + a.download + ' (' + P.files.length + ' archivos).');
  }catch(e){ toast(en ? 'I couldn’t make the .zip. Download the files one by one.' : 'No pude armar el .zip. Descarga los archivos uno por uno.'); }
}

/* ---------- la tarjeta «Página web» en el mensaje ---------- */
const WEB_ICO = {
  web:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18"/><circle cx="6.5" cy="6.5" r=".6" fill="currentColor"/><circle cx="9" cy="6.5" r=".6" fill="currentColor"/><path d="M9.5 13l-2 2 2 2M14.5 13l2 2-2 2"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.8v12.4a.8.8 0 0 0 1.2.7l9.8-6.2a.8.8 0 0 0 0-1.4L9.2 5.1a.8.8 0 0 0-1.2.7z"/></svg>',
  zip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 20h14"/></svg>'
};
const webTxt = en => en
  ? { kind:'Website', files:n => n + (n === 1 ? ' file' : ' files'), pages:n => n + (n === 1 ? ' page' : ' pages'), run:'See it working', zip:'Download .zip', open:'Open the website' }
  : { kind:'Página web', files:n => n + (n === 1 ? ' archivo' : ' archivos'), pages:n => n + (n === 1 ? ' página' : ' páginas'), run:'Ver funcionando', zip:'Descargar .zip', open:'Abrir la página web' };
function webCardPaint(c, P){
  const T = webTxt(SZ.lang() === 'en');
  c.dataset.lang = SZ.lang();
  $('.wp-h', c).innerHTML = '<button type="button" class="wp-main" data-wp="prev" title="' + esc(T.open) + '"><span class="wp-ic">' + WEB_ICO.web + '</span><span class="wp-t"><small>' + esc(T.kind) + '</small><b>' + esc(P.title || P.entry) + '</b><span>' + esc(T.files(P.files.length)) + (P.pages.length > 1 ? ' · ' + esc(T.pages(P.pages.length)) : '') + ' · ' + P.files.slice(0, 4).map(f => esc(f.path)).join(', ') + (P.files.length > 4 ? '…' : '') + '</span></span></button>'
    + '<div class="wp-acts"><button type="button" class="wp-b go" data-wp="prev">' + WEB_ICO.play + '<span>' + esc(T.run) + '</span></button><button type="button" class="wp-b" data-wp="zip" title="' + esc(T.zip) + '">' + WEB_ICO.zip + '<span>' + esc(T.zip) + '</span></button></div>';
}
/* mete las tarjetas de los archivos dentro de una sola tarjeta de proyecto */
function webGroup(body){
  if (!body) return null;
  const cards = $$('.fcard:not(.deck)', body).filter(c => !c.closest('.wproj'));
  const old = $('.wproj', body);
  const metas = [...(old ? $$('.fcard pre', old) : []), ...cards.map(c => $('pre', c))].map(cnvMeta);
  const P = webProject(metas); if (!P) return null;
  const web = cards.filter(c => WEB_EXT.has(cnvMeta($('pre', c)).ext));
  let box = old;
  if (!box){
    box = document.createElement('div'); box.className = 'wproj notr';
    box.innerHTML = '<div class="wp-h"></div><div class="wp-files"></div>';
    web[0].before(box);
  }
  /* los títulos sueltos «📄 index.html» antes de cada tarjeta ya no hacen falta: la tarjeta trae el nombre */
  web.forEach(c => { const h = c.previousElementSibling; if (h && h.classList.contains('fname-h')) h.remove(); else { const t = c.previousElementSibling; if (t && /^(P|H[1-6])$/.test(t.tagName) && t.textContent.length < 90 && /[\w-]+\.[a-z0-9]{1,5}/i.test(t.textContent) && P.files.some(f => t.textContent.includes(f.name))) t.remove(); } $('.wp-files', box).appendChild(c); });
  { const t = box.previousElementSibling; if (t && /^(P|H[1-6])$/.test(t.tagName) && t.textContent.length < 90 && P.files.some(f => t.textContent.includes(f.name))) t.remove(); }
  box._web = P; webCardPaint(box, P);
  return P;
}
const webOf = el => { const b = el && (el.classList && el.classList.contains('wproj') ? el : el.closest && el.closest('.wproj')); return b ? b._web || null : null; };
/* abre la ventana React; si no está (chat.html viejo), el lienzo de siempre con la página principal */
function webOpen(P, o = {}){
  if (!P) return;
  if (window.SZWeb && window.SZWeb.open){ closeCanvas(true); window.SZWeb.open(P, o); return; }
  const M = { label:'HTML', name:o.path || P.entry, named:true, ext:'html', text:(webFind(P, o.path || P.entry) || {}).text || '', lines:0 };
  openCanvas(M, P.files.map(f => ({ label:f.label, name:f.path, named:true, ext:f.ext, text:f.text, lines:f.lines })), o.tab === 'code' ? 'code' : 'prev');
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.wproj [data-wp]'); if (!b) return;
  const P = webOf(b); if (!P) return;
  if (b.dataset.wp === 'zip') webZip(P); else webOpen(P, { tab:'prev' });
}, true);
/* al cambiar el idioma, las tarjetas se vuelven a escribir */
try{ SZ.onLang(() => $$('.wproj').forEach(c => { if (c._web) webCardPaint(c, c._web); })); }catch(e){}
/* el código con colores para React, en trocitos [clase, texto] (React lo escribe como texto: nada de HTML crudo) */
function webTokens(text, ext){
  const k = /^(py)$/.test(ext) ? 'py' : /^(css|scss)$/.test(ext) ? 'css' : /^(html|htm|xml|svg|vue)$/.test(ext) ? 'html' : /^(js|mjs|jsx|ts|tsx|json)$/.test(ext) ? 'c' : '';
  if (!k || text.length > 200000) return [['', text]];
  const cls = ['', 'hc', 'hs', 'hk', 'hn', 'hf'], out = [], rx = new RegExp(HL_RX[k].source, HL_RX[k].flags);
  let last = 0;
  text.replace(rx, (m, ...g) => { const at = g[g.length - 2]; const i = g.findIndex((x, j) => j < 5 && x !== undefined); if (at > last) out.push(['', text.slice(last, at)]); out.push([i > -1 ? cls[i + 1] : '', m]); last = at + m.length; return m; });
  if (last < text.length) out.push(['', text.slice(last)]);
  return out;
}
