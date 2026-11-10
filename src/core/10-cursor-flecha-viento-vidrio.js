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
       (antes todo quedaba «static»: en las tarjetas de usos la Sona se caía fuera de la escena y desaparecía) */
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
    /* el logo de la copia imita al original cuadro a cuadro: mismo tamaño */
    const om = el.querySelectorAll('.mark'), cmk = c.querySelectorAll && c.querySelectorAll('.mark');
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


