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
