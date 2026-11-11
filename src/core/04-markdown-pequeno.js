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
/* v4.5 · algunas IAs ponen el nombre del archivo DENTRO de la cerca (```html:index.html, ```python app.py, ```js title="app.js", ```index.html) en vez de en la línea de antes:
   así la página no lo veía como archivo (salía «codigo.html»). Se pasa a su propia línea en negrita, que es lo que sí reconoce. Solo con extensiones de archivo conocidas. */
/* fenceNames:inicio */
const FN_EXT = 'html?|css|scss|m?js|jsx|ts|tsx|py|java|c|cpp|h|cs|go|rs|php|rb|swift|kt|dart|lua|sql|sh|bash|json|xml|svg|ya?ml|toml|md|csv|txt|vue|svelte|ino|env|ini|r|pl|scala';
const FN_A = new RegExp('^([ \\t]*)```[ \\t]*([\\w+#-]*)[ \\t]*(?::|,|[ \\t])[ \\t]*(?:(?:title|file|filename|name|path)[ \\t]*=[ \\t]*)?["\'{]*([\\w.\\/-]+\\.(?:' + FN_EXT + '))["\'}]*[^\\n]*$', 'gim');
const FN_B = new RegExp('^([ \\t]*)```[ \\t]*([\\w.\\/-]+\\.(?:' + FN_EXT + '))[ \\t]*$', 'gim');
function fenceNames(src){
  if (src.indexOf('```') < 0) return src;
  return src.replace(FN_A, (m, ind, lang, file) => ind + '**' + file + '**\n\n' + ind + '```' + (lang || file.split('.').pop().toLowerCase()))
            .replace(FN_B, (m, ind, file) => ind + '**' + file + '**\n\n' + ind + '```' + file.split('.').pop().toLowerCase());
}
/* fenceNames:fin */
function md(src){
  src = fenceNames(String(src || ''));
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

