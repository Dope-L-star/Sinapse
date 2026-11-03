/* ===== v3.7 · «Blurry» en todo lo que baja (movimiento-css 20). Pedido de Sammuel, 2 nov: «lo quiero en todo lo que baje».
   · Página entera: franjas fijas arriba y abajo. Arriba aparece después de bajar 60 px y va debajo del menú de la página.
   · Cajas que bajan por dentro: una capa hermana, pegada a la caja (no se mete adentro, así no la borran al redibujar la lista).
   Abajo se apaga al llegar al final; arriba, al volver al principio. ===== */
(function blurBordes(){
  if (window.__szBlur) return; window.__szBlur = true;
  const INNER = '#thList, #msgs, #mlist, .pf-l, .cfgbody, .cfgnav, #szBotP .bl, [data-blur]';
  const se = () => document.scrollingElement || document.documentElement;
  const mk = (tag, cls) => { const el = document.createElement(tag); el.className = cls; el.setAttribute('aria-hidden', 'true'); el.innerHTML = '<b></b><b></b><b></b>'; return el; };

  /* --- la página entera --- */
  let pageT = null, pageB = null;
  const header = () => document.querySelector('header.top, .ptop');
  function pagePaint(){
    const s = se(), long = s.scrollHeight > innerHeight + 40;
    if (long && !pageB){ pageB = mk('div', 'szBlur abajo'); pageB.id = 'szBlurAbajo'; pageT = mk('div', 'szBlur arriba'); pageT.id = 'szBlurArriba'; document.body.append(pageB, pageT); }
    if (!pageB) return;
    const h = header(); pageT.style.top = h && getComputedStyle(h).position !== 'static' ? h.offsetHeight + 'px' : '0px';
    pageB.classList.toggle('on', long && s.scrollTop + innerHeight < s.scrollHeight - 140);
    pageT.classList.toggle('on', long && s.scrollTop > 60);
  }

  /* --- cajas que bajan por dentro --- */
  const boxes = new Map();
  function boxPaint(sc, o){
    if (!sc.isConnected){ o.el.remove(); o.ro.disconnect(); boxes.delete(sc); return; }
    const vis = sc.offsetParent !== null && sc.clientHeight > 80, can = sc.scrollHeight > sc.clientHeight + 4;
    o.el.hidden = !vis || !can; if (o.el.hidden) return;
    if (o.el.previousElementSibling !== sc) sc.after(o.el);
    const h = Math.round(Math.min(56, Math.max(28, sc.clientHeight * .14)));
    Object.assign(o.el.style, { left:sc.offsetLeft + sc.clientLeft + 'px', top:sc.offsetTop + sc.clientTop + 'px', width:sc.clientWidth + 'px', height:sc.clientHeight + 'px' });
    o.el.style.setProperty('--h', h + 'px');
    const z = getComputedStyle(sc).zIndex; o.el.style.zIndex = z === 'auto' ? '' : String(+z + 1);
    o.t.classList.toggle('on', sc.scrollTop > 6);
    o.b.classList.toggle('on', sc.scrollTop + sc.clientHeight < sc.scrollHeight - 6);
  }
  function attach(sc){
    if (boxes.has(sc) || !sc.parentElement) return;
    const el = document.createElement('div'); el.className = 'szbe'; el.setAttribute('aria-hidden', 'true');
    const t = mk('i', 'arriba'), b = mk('i', 'abajo'); el.append(t, b); sc.after(el);
    const o = { el, t, b, raf:0 }; const go = () => { if (!o.raf) o.raf = requestAnimationFrame(() => { o.raf = 0; boxPaint(sc, o); }); };
    o.go = go; o.ro = new ResizeObserver(go); o.ro.observe(sc);
    sc.addEventListener('scroll', go, { passive:true }); boxes.set(sc, o); go();
  }
  let scanT = 0;
  const scan = () => { scanT = 0; document.querySelectorAll(INNER).forEach(attach); boxes.forEach(o => o.go()); pagePaint(); };
  const soon = () => { if (!scanT) scanT = setTimeout(scan, 120); };

  let raf = 0; const pageSoon = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; pagePaint(); }); };
  addEventListener('scroll', pageSoon, { passive:true });
  addEventListener('resize', () => { pageSoon(); boxes.forEach(o => o.go()); }, { passive:true });
  /* las listas cambian de alto cuando llegan chats o mensajes: se revisa con calma (no en cada letra) */
  new MutationObserver(soon).observe(document.body, { childList:true, subtree:true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
