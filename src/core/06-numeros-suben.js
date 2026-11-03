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
/* v4.0 · un <p> o <span> con aria-label NO se lee (ARIA lo prohíbe en elementos sin rol): la frase de la portada
   «Pregunta, crea, programa y compara…» quedaba muda para los lectores de pantalla. Ahí va un texto oculto a la vista en su lugar. */
const srFree = el => { const s = el.querySelector(':scope > .sr-txt'); return s ? el.textContent.slice(0, el.textContent.length - s.textContent.length) : el.textContent; };
const ARIA_NAMED = /^(H[1-6]|A|BUTTON|LABEL|SUMMARY)$/;
function ariaSync(el){
  const k = el.dataset.i18n || el.dataset.i18nHtml, v = k && t(k), txt = (v && v !== k ? v : srFree(el)).replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  if (ARIA_NAMED.test(el.tagName) || el.hasAttribute('role')){ el.setAttribute('aria-label', txt); return; }
  let s = el.querySelector(':scope > .sr-txt');
  /* si el cambio de idioma ya dejó el texto normal (sin letras sueltas), se lee solo y no hace falta copia */
  if (el._chars && !el.querySelector('.tc')){ if (s) s.remove(); return; }
  if (!s){ s = document.createElement('span'); s.className = 'sr-txt'; el.appendChild(s); }
  s.textContent = txt;
}
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
      } else if (n.nodeType === 1 && !/^(SCRIPT|STYLE|SVG|I|BUTTON)$/i.test(n.tagName) && !n.classList.contains('sr-txt')) walk(n);
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

