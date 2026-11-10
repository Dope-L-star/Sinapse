/* ===== SymphorIA · Movimiento (v3.1) =====
   Una sola capa de animaciones para todas las páginas. Se carga al final (defer), después de core.js y del código de cada página.
   · Entradas al bajar (tarjetas, títulos, bloques), en cascada.
   · Brillo que sigue al puntero en tarjetas y vidrio; onda al tocar; los íconos saltan al pasar; apretar encoge un poco.
   · Listas que se arman (chats, Espacios, Sintéticos, ventanas) entran una tras otra.
   · Barra de avance en la portada y transición suave entre páginas (en movimiento.css).
   · v3.1: botones, chips y tarjetas se levantan al pasar; interruptores dan un saltito; imágenes aparecen suave; fondos de la portada con profundidad.
   Reglas: solo translate/scale/rotate (sueltos, se suman al transform de cada cosa) y opacity; nada con Animaciones apagadas en Ajustes; no toca el intro, el portal de la «o», el emblema, la batería EnerX ni el botón de idioma. */
(() => {
'use strict';
const H = document.documentElement;
const still = () => H.classList.contains('noanim');   /* v3.1: lo decide Ajustes (Animaciones), no el sistema */
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const EASE = 'cubic-bezier(.22,1,.36,1)', SPRING = 'cubic-bezier(.34,1.56,.64,1)';
const NO = '#intro,.p8,.sy-svg,.lbatt,#langBtn,[data-mv-no]';
const skip = el => !el || !el.isConnected || !!el.closest(NO);
const stat = window.SZ_MV = { wired:0, played:0 };
const play = (el, kf, o) => { if (still() || skip(el) || !el.animate) return null; stat.played++; return el.animate(kf, o); };
H.classList.add('mv');

/* ---------- 1. entradas al bajar ---------- */
const CHAT = !!document.getElementById('shell'), LAND = !!document.querySelector('main section#nombre, main section#faq');
const CARD = '.lqg,.how-card,.use,.mode,.hub-i,.gi,.ft,.bl-c,.vf-c,.hd-c,.us-l,.us-r,.card,.tpl,.list > li,.faq-i,details,figure';
const HEAD = 'section h2,section .head,main h1,main > .sub,.lead';
const BOX = 'section,main';
const seen = new WeakSet();
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
  const per = new Map();
  es.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target; io.unobserve(el);
    const n = per.get(el.parentNode) || 0; per.set(el.parentNode, n + 1);
    el.classList.remove('mv-r');
    const o = { duration:760, easing:EASE, delay:Math.min(n, 6) * 75, fill:'backwards' };
    play(el, [{ opacity:0 }, { opacity:1 }], o);
    /* en la portada SynthonIA se para junto a los textos midiendo dónde están: ahí solo se funde, sin correr nada de lugar */
    if (!LAND) play(el, [{ translate:'0 30px', scale:.965 }, { translate:'0 0', scale:1 }], Object.assign({ composite:'add' }, o));
  });
}, { threshold:.12, rootMargin:'0px 0px -6% 0px' }) : null;
function discover(){
  if (!io || CHAT || still()) return;
  const vh = innerHeight;
  document.querySelectorAll(CARD + ',' + HEAD).forEach(el => {
    if (seen.has(el)) return; seen.add(el);
    if (!el.closest(BOX) || skip(el) || el.closest('[data-reveal],[data-stagger],.mv-r,[role="dialog"],.szm,.amenu,nav,header')) return;
    const r = el.getBoundingClientRect();
    if (!r.height || r.top < vh) return;   /* lo que ya se ve (o está escondido) no se toca */
    el.classList.add('mv-r'); io.observe(el); stat.wired++;
  });
}

/* ---------- 2. brillo que sigue al puntero ---------- */
const GLOW = '.lqg,.how-card,.use,.mode,.hub-i,.us-l,.us-r,.card,.tpl,.pjc,.syn-c,.fcard,.tcard,.szm .tcard';
let hot = null, gx = 0, gy = 0, graf = 0;
function glowOn(el){
  if (hot === el) return;
  glowOff();
  if (still() || skip(el) || H.classList.contains('pmode')) return;
  if (getComputedStyle(el).position === 'static') return;
  let g = el.querySelector(':scope > .mv-gl');
  if (!g){ g = document.createElement('span'); g.className = 'mv-gl'; g.setAttribute('aria-hidden', 'true'); el.prepend(g); stat.wired++; }
  hot = el; el.classList.add('mv-hot');
}
function glowOff(){ if (hot){ hot.classList.remove('mv-hot'); hot = null; } }
if (FINE){
  document.addEventListener('pointerover', e => { const c = e.target.closest && e.target.closest(GLOW); if (c) glowOn(c); else glowOff(); }, { passive:true });
  document.addEventListener('pointermove', e => {
    if (!hot) return; gx = e.clientX; gy = e.clientY;
    if (!graf) graf = requestAnimationFrame(() => { graf = 0; if (!hot) return; const r = hot.getBoundingClientRect(); hot.style.setProperty('--mv-x', (gx - r.left) + 'px'); hot.style.setProperty('--mv-y', (gy - r.top) + 'px'); });
  }, { passive:true });
  document.addEventListener('pointerleave', glowOff);
}

/* ---------- 3. íconos que saltan al pasar ---------- */
const ICONB = 'button,a,[role="button"],summary,label.field';
const busy = new WeakSet();
function wiggle(svg, big){
  if (!svg || busy.has(svg)) return;
  const a = play(svg, big
    ? [{ rotate:'0deg', scale:1 }, { rotate:'-12deg', scale:1.18, offset:.35 }, { rotate:'7deg', scale:1.06, offset:.7 }, { rotate:'0deg', scale:1 }]
    : [{ scale:1 }, { scale:1.16, offset:.4 }, { scale:1 }], { duration:big ? 560 : 420, easing:'ease-out' });
  if (a){ busy.add(svg); a.onfinish = a.oncancel = () => busy.delete(svg); }
}
if (FINE) document.addEventListener('pointerover', e => {
  const b = e.target.closest && e.target.closest(ICONB);
  if (!b || (e.relatedTarget && b.contains(e.relatedTarget))) return;
  wiggle(b.querySelector(':scope > svg, :scope > .ic > svg, :scope > span > svg'), true);
}, { passive:true });

/* ---------- 4. tocar: encoge un poco y deja una onda de luz ---------- */
const PRESS = 'button,a.btn,.btn,[role="button"],[role="tab"],.rbtn,summary,.chip,.pjc-go,.syn-c';
let waves = 0;
document.addEventListener('pointerdown', e => {
  if (e.button > 0) return;
  const b = e.target.closest && e.target.closest(PRESS);
  if (!b || skip(b) || b.disabled) return;
  play(b, [{ scale:1 }, { scale:.95, offset:.35 }, { scale:1 }], { duration:340, easing:SPRING });
  if (waves > 3 || still()) return;
  const r = b.getBoundingClientRect(), s = Math.max(44, Math.min(280, Math.max(r.width, r.height) * 1.5));
  const w = document.createElement('span'); w.className = 'mv-rp'; w.setAttribute('aria-hidden', 'true');
  w.style.cssText = 'width:' + s + 'px;height:' + s + 'px;translate:' + (e.clientX - s / 2) + 'px ' + (e.clientY - s / 2) + 'px';
  document.body.appendChild(w); waves++;
  const a = play(w, [{ scale:.15, opacity:.95 }, { scale:1, opacity:0 }], { duration:560, easing:'cubic-bezier(.2,.7,.3,1)', fill:'forwards' });
  const done = () => { w.remove(); waves--; };
  if (a) a.onfinish = a.oncancel = done; else done();
}, { passive:true });

/* teclado: lo que recibe el foco da un pequeño pulso */
document.addEventListener('focusin', e => {
  const t = e.target;
  if (!t.matches || !t.matches(':focus-visible') || !t.matches(PRESS + ',input,textarea,select')) return;
  play(t, [{ scale:1 }, { scale:1.035, offset:.4 }, { scale:1 }], { duration:360, easing:EASE });
});

/* ---------- 5. listas y ventanas que se arman: entran en cascada ---------- */
const LIST = [
  ['#thList', ':scope > *'],
  ['#pjv', '.pjc,.pj-chat,.pj-empty,.pj-lh,.pj-ask,.pj-side,.pj-ex button'],
  ['#synv', '.syn-w,.pj-empty,.pj-lh'],
  ['#sideFoot', ':scope > *'],
  ['.tray', ':scope > *']
];
function cascade(items){
  items = [...items].filter(x => x.nodeType === 1 && !x.classList.contains('mv-gl') && !x.classList.contains('mv-rp') && !skip(x));
  if (!items.length || items.length > 40) return;
  items.forEach((x, i) => {
    const o = { duration:520, easing:EASE, delay:Math.min(i, 12) * 38, fill:'backwards' };
    play(x, [{ opacity:0 }, { opacity:1 }], o);
    play(x, [{ translate:'0 12px', scale:.985 }, { translate:'0 0', scale:1 }], Object.assign({ composite:'add' }, o));
  });
}
const mo = new MutationObserver(ms => {
  for (const [sel, kids] of LIST){
    const box = document.querySelector(sel); if (!box || box.hidden) continue;
    if (!ms.some(m => m.type === 'childList' && m.addedNodes.length && (m.target === box || box.contains(m.target)))) continue;
    if (box.dataset.mvAt && performance.now() - box.dataset.mvAt < 250) continue;
    box.dataset.mvAt = performance.now();
    cascade(box.querySelectorAll(kids));
  }
  if (ms.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && !n.classList.contains('mv-rp')))) schedule();
});
let dt = 0;
const schedule = () => { clearTimeout(dt); dt = setTimeout(discover, 300); };

/* ventanas (Ajustes, Conectar IA, tu límite…): al abrirse, su contenido sube en cascada */
const winMo = new MutationObserver(ms => ms.forEach(m => {
  const w = m.target;
  if (!w.classList || !w.classList.contains('on') || (m.oldValue || '').split(/\s+/).includes('on')) return;
  const body = w.querySelector('.tcard,.sz-in,.szm-in') || w;
  cascade([...body.children].slice(0, 14));
}));
function watchWindows(){ document.querySelectorAll('.szm:not([data-mvw])').forEach(w => { w.dataset.mvw = '1'; winMo.observe(w, { attributes:true, attributeFilter:['class'], attributeOldValue:true }); }); }

/* ---------- 6. portada: barra de avance al bajar ---------- */
function progress(){
  if (CHAT || !document.querySelector('section#faq, section#nombre')) return;
  const bar = document.createElement('div'); bar.className = 'mv-prog'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
  let raf = 0;
  const set = () => { raf = 0; const m = document.documentElement.scrollHeight - innerHeight; bar.style.setProperty('--mv-p', m > 0 ? Math.min(1, scrollY / m).toFixed(4) : 0); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(set); }, { passive:true });
  set();
}

/* ---------- 7. pasar el puntero: botones, chips y tarjetas se levantan un poquito y vuelven al salir ---------- */
const LIFT = '.btn,.chip,.cchip,.tchip,.cnew,.pjc,.syn-c,.use,.mode,.how-card,.hub-i,.gi,.ft,.tpl,.sugg button,.hsug,.hsug-i,details > summary,#nav a,.pj-ex button,.amenu button,.ctxm button,.seg button,.chips button';
const BIG = '.pjc,.syn-c,.use,.mode,.how-card,.hub-i,.gi,.ft,.tpl';
const lifted = new WeakMap();
function liftOn(el){
  if (lifted.has(el) || el.disabled) return;
  const a = play(el, [{ translate:'0 0' }, { translate:el.matches(BIG) ? '0 -4px' : '0 -2px' }], { duration:260, easing:EASE, fill:'forwards', composite:'add' });
  if (a) lifted.set(el, a);
}
function liftOff(el){ const a = lifted.get(el); if (!a) return; lifted.delete(el); a.reverse(); a.onfinish = () => a.cancel(); }
if (FINE){
  document.addEventListener('pointerover', e => { const el = e.target.closest && e.target.closest(LIFT); if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) liftOn(el); }, { passive:true });
  document.addEventListener('pointerout', e => { const el = e.target.closest && e.target.closest(LIFT); if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) liftOff(el); }, { passive:true });
}

/* ---------- 8. interruptores y opciones: al cambiar, su cajita da un saltito ---------- */
document.addEventListener('change', e => {
  const t = e.target; if (!t.matches || !t.matches('input[type="checkbox"],input[type="radio"],select')) return;
  const box = t.closest('label,.sw,.tog,.set-row,.cfg-row') || t;
  play(box, [{ scale:1 }, { scale:1.04, offset:.35 }, { scale:1 }], { duration:380, easing:SPRING });
});

/* ---------- 9. imágenes que llegan tarde aparecen suave en vez de saltar ---------- */
document.addEventListener('load', e => {
  const t = e.target; if (!t || t.tagName !== 'IMG' || t.dataset.mvSeen) return; t.dataset.mvSeen = '1';
  play(t, [{ opacity:0 }, { opacity:1 }], { duration:420, easing:'ease-out' });
}, true);

/* ---------- 10. fondos de la portada: se corren despacito al bajar (profundidad) ---------- */
function parallax(){
  const bgs = [...document.querySelectorAll('.secbg')]; if (!bgs.length || CHAT) return;
  let raf = 0;
  const run = () => {
    raf = 0; if (still() || H.classList.contains('pmode')){ bgs.forEach(b => b.style.translate = ''); return; }
    const mid = innerHeight / 2;
    for (const b of bgs){
      const r = b.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      const d = Math.max(-90, Math.min(90, (r.top + r.height / 2 - mid) * -0.1));
      b.style.translate = '0 ' + d.toFixed(1) + 'px';
    }
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(run); }, { passive:true });
  run(); stat.wired += bgs.length;
}

function start(){
  discover(); progress(); watchWindows(); parallax();
  mo.observe(document.body, { childList:true, subtree:true });
  setTimeout(() => { discover(); watchWindows(); }, 1200);
  addEventListener('load', () => { discover(); watchWindows(); }, { once:true });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
})();
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
  const header = () => document.querySelector('header.top, .ptop, .pa-top');
  function pagePaint(){
    const s = se(), long = s.scrollHeight > innerHeight + 40;
    if (long && !pageB){ pageB = mk('div', 'szBlur abajo'); pageB.id = 'szBlurAbajo'; pageT = mk('div', 'szBlur arriba'); pageT.id = 'szBlurArriba'; document.body.append(pageB, pageT); }
    if (!pageB) return;
    const h = header(); /* v4.3 · debajo de la cabecera aunque flote separada del borde (la de Gestión va a 10 px): se mide dónde termina de verdad */
    const hp = h && getComputedStyle(h).position; pageT.style.top = hp === 'sticky' || hp === 'fixed' ? Math.max(0, Math.round(h.getBoundingClientRect().bottom)) + 'px' : '0px';
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
    const h = Math.round(Math.min(32, Math.max(16, sc.clientHeight * .08)));
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
