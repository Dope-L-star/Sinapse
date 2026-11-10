/* v2.8 · el portal nuevo, con los logos de ahora (pedido de Sammuel: «sorpréndeme»):
   ida:    «Sinapse» sale de su esquina y llega al centro → la S de vidrio gira y se vuelve el orbe de Sonyx,
           «mphorIA» se borra y aparece «nthFlow» letra por letra (v3.0: Sy-mphorIA → Sy-nthFlow) → la «o» de «Flow» late y la cámara entra por su hueco
           (y en el chat se abre en círculo)
   vuelta: sales por la «o», el orbe vuelve a ser la S y «Sinapse» vuelve a su esquina.
   v2.9: sin Sona (Sammuel: el portal queda mejor solo con los logos).
   Todo es transform y opacidad (va fluido en celulares); mientras dura, la página no se puede tocar. */
let lockOff = null;
function portalLock(on){
  if (lockOff){ lockOff(); lockOff = null; }
  if (!on) return;
  const stop = e => {
    if (e.key === 'F5' || (e.key === 'r' && (e.ctrlKey || e.metaKey))) return;
    /* el aviso de mantenimiento (encima de todo) siempre se puede usar */
    const m = document.getElementById('szMaint'); if (m && (m.contains(e.target) || m.contains(document.activeElement))) return;
    e.preventDefault(); e.stopPropagation();
  };
  const ev = ['keydown', 'keypress', 'wheel', 'touchmove', 'mousedown', 'click', 'pointerdown'];
  ev.forEach(t => addEventListener(t, stop, { capture:true, passive:false }));
  lockOff = () => ev.forEach(t => removeEventListener(t, stop, { capture:true }));
}
const PE = 'cubic-bezier(.65,0,.35,1)', PEO = 'cubic-bezier(.22,1,.36,1)', PSPR = 'cubic-bezier(.34,1.56,.64,1)';
/* los mismos cuadros al revés (para la vuelta) */
const pRev = K => [...K].reverse().map(k => k.offset == null ? k : Object.assign({}, k, { offset:1 - k.offset }));
const pAnim = (el, kf, o) => el.animate(kf, Object.assign({ fill:'forwards', easing:PE }, o)).finished.catch(() => {});
function portalStage(){
  const o = document.createElement('div'); o.id = 'portal'; o.className = 'szportal p8';
  o.innerHTML = '<i class="p8-bg"></i><i class="p8-ring"></i><i class="p8-flash"></i>'
    + '<div class="p8-w"><span class="p8-mk"><img class="p8-z" src="media/v30/symphoria.svg" alt="" draggable="false">' + flowOrb('p8-orb') + '</span>'
    + '<span class="p8-t zw"><span class="p8-sy">Sy</span><span class="p8-zl">mphor<span class="zt">IA</span></span><span class="p8-fl">' + [...'nthFlow'].map((c, i) => '<i style="--i:' + i + '">' + c + '</i>').join('') + '</span></span></div>';
  document.body.appendChild(o);
  const q = c => o.querySelector(c);
  return { o, BG:q('.p8-bg'), RING:q('.p8-ring'), FL:q('.p8-flash'), W:q('.p8-w'), MK:q('.p8-mk'), Z:q('.p8-z'), ORB:q('.p8-orb'), T:q('.p8-t'), ZL:q('.p8-zl'), FW:q('.p8-fl') };
}
/* dónde está el logo de la esquina (para salir de ahí y volver ahí) */
/* el rectángulo donde de verdad se ve una imagen con object-fit:contain (sin el aire de los lados) */
function fitBox(img){
  const r = img.getBoundingClientRect(), nw = img.naturalWidth || 1, nh = img.naturalHeight || 1, k = Math.min(r.width / nw, r.height / nh);
  return { x:r.left + r.width / 2, y:r.top + r.height / 2, w:nw * k, h:nh * k };
}
/* dónde está el logo de la esquina y cómo es: tamaño de la Z, de la letra y el espacio entre ambas
   (el portal copia esas medidas para que el «Sinapse» que viaja calce justo encima del de la esquina) */
function logoRect(){
  const n = document.querySelector('#nav .logo');
  if (n && n.getClientRects().length){
    const r = n.getBoundingClientRect(), m = n.querySelector('.mark'), wd = n.querySelector('.word');
    if (r.width){
      const o = { x:r.left, y:r.top, w:r.width, h:r.height };
      if (m && wd && m.naturalWidth){
        const tx = wd.querySelector('.zw') || wd, a = fitBox(m), b = tx.getBoundingClientRect(), cs = getComputedStyle(tx);
        Object.assign(o, { mx:a.x, my:a.y, mw:a.w, mh:a.h, gap:b.left - (a.x + a.w / 2), fs:parseFloat(cs.fontSize) || 0, fw:cs.fontWeight, ls:parseFloat(cs.letterSpacing) || 0 });
      }
      return o;
    }
  }
  try{ const s = JSON.parse(sessionStorage.getItem('synthz:logo') || 'null'); if (s && s.h) return s; }catch(e){}
  return { x:innerWidth < 600 ? 30 : 70, y:innerWidth < 600 ? 22 : 26, w:150, h:40 };
}
/* el «SymphorIA» del portal toma las proporciones del logo de la esquina (Z, letra, espacio, grosor) */
function fitPortal(P, R){
  if (!R.fs) return;
  const tf = parseFloat(getComputedStyle(P.T).fontSize), k = tf / R.fs;
  P.MK.style.width = (R.mw * k).toFixed(1) + 'px'; P.MK.style.height = (R.mh * k).toFixed(1) + 'px';
  P.W.style.gap = Math.max(0, R.gap * k).toFixed(1) + 'px';
  P.T.style.fontWeight = R.fw; P.T.style.letterSpacing = (R.ls / R.fs).toFixed(3) + 'em';
}
/* la palabra entera viaja entre la esquina y el centro (FLIP): la Z del portal cae justo sobre la Z de la esquina */
function flyWord(P, toCorner, D){
  const R = logoRect(), r = P.W.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let s = R.h / r.height, dx = R.x + R.w / 2 - cx, dy = R.y + R.h / 2 - cy;
  if (R.fs){
    const m = fitBox(P.Z), tf = parseFloat(getComputedStyle(P.T).fontSize);
    s = R.fs / tf; dx = R.mx - cx - (m.x - cx) * s; dy = R.my - cy - (m.y - cy) * s;
  }
  const corner = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
  return pAnim(P.W, toCorner ? [{ transform:'none' }, { transform:corner }] : [{ transform:corner }, { transform:'none' }], { duration:D, easing:PE });
}
/* la Z de vidrio gira y se vuelve el orbe; la «Z» se borra y «Flow» se escribe (o al revés) */
function morph(P, toFlow, D){
  P.o.classList.toggle('flow', toFlow);
  const zOut = [{ transform:'none', opacity:1 }, { transform:'rotate(-200deg) scale(.15)', opacity:0 }];
  const oIn = [{ transform:'rotate(160deg) scale(.1)', opacity:0 }, { transform:'none', opacity:1 }];
  return Promise.all([
    pAnim(P.Z, toFlow ? zOut : pRev(zOut), { duration:D * .7, easing:toFlow ? 'cubic-bezier(.5,0,.75,0)' : PSPR, delay:toFlow ? 0 : D * .3 }),
    pAnim(P.ORB, toFlow ? oIn : pRev(oIn), { duration:D * .75, easing:toFlow ? PSPR : 'cubic-bezier(.5,0,.75,0)', delay:toFlow ? D * .25 : 0 })
  ]);
}
const pSleep = ms => new Promise(r => setTimeout(r, ms));
/* el hueco de la «o» de «Flow»: centro y ancho reales del agujero (con las medidas de la letra, no de su cajita) */
let pMeas = null;
function oSpot(P){
  const o = [...P.FW.children].find(x => x.textContent === 'o'), r = o.getBoundingClientRect(), cs = getComputedStyle(o);
  const x = (pMeas = pMeas || document.createElement('canvas').getContext('2d'));
  x.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
  const m = x.measureText('o'), fa = m.fontBoundingBoxAscent || parseFloat(cs.fontSize) * .9, fd = m.fontBoundingBoxDescent || parseFloat(cs.fontSize) * .22;
  const base = r.top + (r.height - (fa + fd)) / 2 + fa, asc = m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * .52;
  const ls = parseFloat(cs.letterSpacing) || 0, gw = m.width || r.width;
  return { x:r.left + (r.width - ls) / 2, y:base - asc / 2 + (m.actualBoundingBoxDescent || 0) / 2, hole:Math.max(4, gw * .4), el:o };
}
/* v2.9: la «o» de «Flow» late y suelta un anillo de luz (por ahí entra la cámara, como antes) */
function orbPulse(P){
  P.FW.style.overflow = 'visible';      /* «Flow» ya está escrito: el latido y el brillo de la «o» no se recortan */
  const s = oSpot(P);
  s.el.animate([{ transform:'none', filter:'none' }, { transform:'scale(1.22)', filter:'drop-shadow(0 0 10px rgba(255,255,255,.85))' }, { transform:'none', filter:'none' }], { duration:560, easing:PSPR });
  P.RING.style.left = s.x + 'px'; P.RING.style.top = s.y + 'px';
  P.RING.animate([{ transform:'translate(-50%,-50%) scale(.3)', opacity:.9 }, { transform:'translate(-50%,-50%) scale(9)', opacity:0 }], { duration:900, easing:'cubic-bezier(.2,.8,.2,1)' });
}
/* la cámara entra (o sale) por el hueco de la «o» de «Flow»: la letra crece hasta que su agujero tapa la pantalla */
function dive(P, into, D){
  P.FW.style.overflow = 'visible';
  const s = oSpot(P), K = Math.hypot(innerWidth, innerHeight) / s.hole * 1.15;
  const tx = innerWidth / 2 - s.x, ty = innerHeight / 2 - s.y;
  P.W.style.transformOrigin = (s.x - P.W.getBoundingClientRect().left).toFixed(1) + 'px ' + (s.y - P.W.getBoundingClientRect().top).toFixed(1) + 'px';
  P.o.classList.add('diving');
  const kw = [{ transform:'none' }, { transform:'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + K.toFixed(2) + ')' }];
  return Promise.all([
    pAnim(P.W, into ? kw : pRev(kw), { duration:D, easing:into ? 'cubic-bezier(.7,0,.84,0)' : 'cubic-bezier(.16,1,.3,1)' }),
    pAnim(P.FL, into ? [{ opacity:0 }, { opacity:0, offset:.7 }, { opacity:1 }] : [{ opacity:1 }, { opacity:0, offset:.3 }, { opacity:0 }], { duration:D, easing:'linear' })
  ]);
}
/* v1.8: con «Animaciones» apagado no hay película: un fundido corto y listo (los logos siempre se ven) */
function quickGo(href, back){
  if (document.getElementById('portal')) return;
  try{ sessionStorage.setItem(back ? 'synthz:back' : 'synthz:portal', 'fade'); }catch(e){}
  const v = document.createElement('div'); v.id = 'portal'; v.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#0b0820;opacity:0;transition:opacity .18s ease';
  document.body.appendChild(v); requestAnimationFrame(() => { v.style.opacity = '1'; });
  setTimeout(() => { location.href = href; }, 200);
}
const pReady = P => Promise.race([Promise.all([P.Z.decode ? P.Z.decode().catch(() => {}) : 0, document.fonts ? document.fonts.ready : 0]), pSleep(1200)]);
async function portalOut(href){
  if (document.getElementById('portal')) return;
  if (reduce && !(typeof EV !== 'undefined' && EV.pending())) return quickGo(href, false);
  let gone = false; const go = () => { if (gone) return; gone = true; location.href = href; };
  root.classList.add('leaving'); S.busy(true); portalLock(true); setTimeout(go, 12000);
  try{ const R = logoRect(); sessionStorage.setItem('synthz:logo', JSON.stringify(R)); }catch(e){}
  try{ sessionStorage.setItem('synthz:portal', 'o'); }catch(e){}
  try{
    const P = portalStage(), nav = document.querySelector('#nav .logo');
    await pReady(P); fitPortal(P, logoRect()); await new Promise(r => requestAnimationFrame(r));
    /* 1 · «SymphorIA» sale de su esquina y llega al centro, mientras cae la noche */
    if (nav) nav.style.visibility = 'hidden';
    pAnim(P.BG, [{ opacity:0 }, { opacity:1 }], { duration:800, easing:'ease-out' });
    await flyWord(P, false, 950);
    /* evento especial: en vez del portal normal, la página «se reprograma» y luego carga el chat */
    const evn = typeof EV !== 'undefined' && EV.pending();
    if (evn){ await EV.play(evn); portalLock(true); go(); return; }
    /* 2 · la Z gira y se vuelve el orbe de SynthFlow; «Flow» se escribe */
    try{ SND.shimmer(); }catch(e){}
    await morph(P, true, 900);
    /* 3 · la «o» de «Flow» late una vez y suelta su anillo de luz */
    await pSleep(260); orbPulse(P);
    await pSleep(440);
    /* 4 · la cámara entra por el hueco de la «o» (Sammuel: el zoom va en la O, como siempre) */
    try{ SND.warp(); }catch(e){}
    await dive(P, true, 1000);
    go();
  }catch(e){
    console.error('[synthz] portal', e && e.message);
    const p = document.getElementById('portal'); if (p){ p.style.background = '#0b0820'; p.style.opacity = '1'; }
    setTimeout(go, 200);
  }
}
/* de vuelta a SymphorIA: la misma película al revés */
async function portalBack(href){
  if (document.getElementById('portal')) return;
  if (reduce) return quickGo(href, true);
  let gone = false; const go = () => { if (gone) return; gone = true; location.href = href; };
  S.busy(true); portalLock(true); setTimeout(go, 12000);
  try{ sessionStorage.setItem('synthz:back', 'o'); }catch(e){}
  try{
    const P = portalStage();
    P.o.classList.add('flow', 'start'); P.Z.style.opacity = '0'; P.ORB.style.opacity = '1';
    await pReady(P); fitPortal(P, logoRect()); await new Promise(r => requestAnimationFrame(r));
    P.BG.style.opacity = '1';
    /* 1 · sales por el hueco de la «o» */
    try{ SND.warp(); }catch(e){}
    pAnim(P.o, [{ opacity:0 }, { opacity:1 }], { duration:280, easing:'ease-out' });
    await dive(P, false, 950);
    P.o.classList.remove('diving'); P.W.style.transformOrigin = '';
    /* 2 · la «o» late al salir */
    orbPulse(P); await pSleep(420);
    /* 3 · el orbe vuelve a ser la Z; se borra «Flow» y vuelve la «Z» */
    try{ SND.shimmer(); }catch(e){}
    await morph(P, false, 900);
    await pSleep(150);
    /* 4 · «SymphorIA» vuelve a su esquina */
    pAnim(P.BG, [{ opacity:1 }, { opacity:.92 }], { duration:800 });
    await flyWord(P, true, 900);
    go();
  }catch(e){
    console.error('[synthz] portal', e && e.message);
    try{ sessionStorage.setItem('synthz:back', 'fade'); }catch(x){}
    setTimeout(go, 200);
  }
}
/* llegada a SynthFlow desde el portal: el hueco de la «o» se abre y deja ver el chat */
function portalArrive(veil){
  if (!veil) return;
  const R = Math.hypot(innerWidth, innerHeight) / 2 + 60, t0 = performance.now(), D = 1100;
  const ring = document.createElement('i'); ring.className = 'szpring'; document.body.appendChild(ring);
  veil.style.transition = 'none'; veil.style.opacity = '1'; veil.style.background = '#0b0820';
  (function f(now){
    const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3), rr = (R * e).toFixed(1);
    const m = 'radial-gradient(circle at 50% 50%, transparent ' + rr + 'px, #000 ' + (R * e + 34).toFixed(1) + 'px)';
    veil.style.webkitMaskImage = m; veil.style.maskImage = m;
    ring.style.width = ring.style.height = (R * e * 2 + 8).toFixed(1) + 'px'; ring.style.opacity = (1 - k).toFixed(3);
    if (k < 1) requestAnimationFrame(f);
    else { veil.style.opacity = '0'; veil.style.webkitMaskImage = veil.style.maskImage = ''; ring.remove(); }
  })(t0);
}
/* al salir del portal la pantalla ondula como si saliera del agua (sin gotas) */
function waterIn(el){
  if (!el || reduce) return;
  document.body.insertAdjacentHTML('beforeend', '<svg id="szwsvg" width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="szwater" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence id="szturb" type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="2" seed="7" result="n"/><feDisplacementMap id="szdisp" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>');
  const turb = $('#szturb'), disp = $('#szdisp'), t0 = performance.now(), D = 1700;
  el.style.filter = 'url(#szwater)';
  (function f(now){
    const e = Math.min(1, (now - t0) / D), amp = Math.pow(1 - e, 2.2) * 70;
    disp.setAttribute('scale', amp.toFixed(1));
    turb.setAttribute('baseFrequency', (0.006 + e * 0.002).toFixed(4) + ' ' + (0.011 - e * 0.004 + Math.sin(e * 9) * 0.0015).toFixed(4));
    if (e < 1) requestAnimationFrame(f); else { el.style.filter = ''; const s = $('#szwsvg'); if (s) s.remove(); }
  })(t0);
}

/* v2.2 · menús limpios: íconos, grupos (separados con «—»), atajos y lo peligroso en rojo. Se usan con el clic derecho y con «⋯» */
const MI = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
const MICO = {
  copy:MI('<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
  new:MI('<path d="M12 20h8"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  globe:MI('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>'),
  search:MI('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  cog:MI('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  help:MI('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>'),
  star:MI('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/>'),
  sound:MI('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/>'),
  regen:MI('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'),
  trash:MI('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  down:MI('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  quote:MI('<path d="M7 7h4v4H7zM13 7h4v4h-4z"/><path d="M9 11c0 3-1 5-3 6M15 11c0 3-1 5-3 6"/>'),
  home:MI('<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>'),
  brain:MI('<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4z"/>'),
  chats:MI('<path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>'),
  ai:MI('<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/>'),
  up:MI('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  user:MI('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  open:MI('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  chart:MI('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  reload:MI('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'),
  stop:MI('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
  cmp:MI('<rect x="3" y="5" width="7.5" height="14" rx="2"/><rect x="13.5" y="5" width="7.5" height="14" rx="2"/>'),
  trophy:MI('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>'),
  exit:MI('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>')
};
/* arma un menú (para el clic derecho o para un botón) en la posición x, y */
function menuBuild(items, x, y, cls){
  const m = document.createElement('div'); m.className = 'ctxm ' + (cls || ''); m.setAttribute('role', 'menu');
  items.filter(Boolean).forEach((it, i, L) => {
    if (it === '—'){ if (i && i < L.length - 1 && L[i - 1] !== '—') m.appendChild(document.createElement('hr')); return; }
    if (it.head){ const h = document.createElement('div'); h.className = 'mhd'; h.textContent = it.head; m.appendChild(h); return; }
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); if (it.danger) b.className = 'dng';
    b.innerHTML = '<i class="mico">' + (MICO[it.ico] || '') + '</i><span></span>' + (it.key ? '<kbd>' + esc(it.key) + '</kbd>' : '') + (it.on != null ? '<em class="mck" aria-hidden="true">' + (it.on ? '✓' : '') + '</em>' : '');
    $('span', b).textContent = it.label; if (it.on != null) b.setAttribute('aria-checked', String(!!it.on));
    b.addEventListener('click', ev => { ev.stopPropagation(); menuClose(); it.fn(); });
    m.appendChild(b);
  });
  document.body.appendChild(m);
  m.style.left = Math.max(8, Math.min(x, innerWidth - m.offsetWidth - 10)) + 'px'; m.style.top = Math.max(8, Math.min(y, innerHeight - m.offsetHeight - 10)) + 'px';
  if (!reduce) m.animate([{ opacity:0, transform:'scale(.94) translateY(4px)', filter:'blur(4px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:260, easing:'cubic-bezier(.22,1,.36,1)' });
  m.addEventListener('keydown', e => { const B = $$('button', m), i = B.indexOf(document.activeElement); if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); B[(i + (e.key === 'ArrowDown' ? 1 : B.length - 1)) % B.length].focus(); } });
  return m;
}
let MENU = null;
function menuClose(){ if (!MENU) return; const m = MENU; MENU = null; if (reduce){ m.remove(); return; } m.animate([{ opacity:1 }, { opacity:0, transform:'scale(.97)' }], { duration:140 }).onfinish = () => m.remove(); }
function menuOpen(items, x, y, cls){ menuClose(); MENU = menuBuild(items, x, y, cls); return MENU; }
addEventListener('pointerdown', e => { if (MENU && !MENU.contains(e.target) && !(e.target.closest && e.target.closest('[data-menu-owner]'))) menuClose(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && MENU){ e.preventDefault(); menuClose(); } });
addEventListener('scroll', e => { if (MENU && !(e.target && e.target.nodeType === 1 && MENU.contains(e.target))) menuClose(); }, true); addEventListener('resize', () => menuClose());
/* clic derecho: getItems(e, sel) arma lo que corresponde según dónde hiciste clic */
function ctxMenu(getItems){
  addEventListener('contextmenu', e => {
    if (e.target.closest && e.target.closest('input,textarea,[contenteditable],a[href]')) return;
    const sel = String(getSelection() || '').trim();
    const items = [...(sel ? [{ label:'Copiar', ico:'copy', key:'Ctrl+C', fn:() => { navigator.clipboard && navigator.clipboard.writeText(sel); toast('Copiado.'); } }] : []), ...(getItems(e, sel) || [])];
    if (!items.length) return;
    e.preventDefault(); menuOpen(items, e.clientX, e.clientY);
  });
}
if (matchMedia('(pointer: fine)').matches && !reduce){ let ax = 0, ay = 0, aq = 0; addEventListener('pointermove', e => { ax = e.clientX; ay = e.clientY; if (aq) return; aq = requestAnimationFrame(() => { aq = 0; const a = $('.aurora'); if (!a) return; a.style.setProperty('--mx', ((ax / innerWidth - .5) * 70).toFixed(1)); a.style.setProperty('--my', ((ay / innerHeight - .5) * 70).toFixed(1)); }); }, { passive:true }); }
addEventListener('scroll', e => { const t = e.target; if (t && t !== document && t.scrollTop != null){ extraY += t.scrollTop - (t._lt || 0); t._lt = t.scrollTop; } }, true);
if (matchMedia('(pointer: fine)').matches){
  const TXT = 'p,h1,h2,h3,h4,h5,h6,li,td,th,blockquote,pre,code,small,label,em,strong,b,span,.bub,.md';
  const NOT = 'a,button,[role=button],input,textarea,select,summary,.tg,.word,.logo';
  /* la barrita de texto solo aparece mientras seleccionas (arrastrando sobre texto) */
  let selDown = null;
  const hasSel = () => { const s = getSelection(); return !!(s && !s.isCollapsed && String(s).trim()); };
  addEventListener('pointerdown', e => { const t = e.target; selDown = e.button === 0 && t && t.closest && !t.closest(NOT) ? [e.clientX, e.clientY, !!t.closest(TXT)] : null; }, { passive:true });
  addEventListener('pointermove', e => { root.classList.remove('cursor-typing'); if (selDown && (e.buttons & 1) && Math.hypot(e.clientX - selDown[0], e.clientY - selDown[1]) > 4 && (selDown[2] || hasSel())) root.classList.add('cursor-text'); }, { passive:true });
  document.addEventListener('selectionchange', () => { if (selDown && hasSel()) root.classList.add('cursor-text'); });
  const selEnd = () => { selDown = null; root.classList.remove('cursor-text'); };
  addEventListener('pointerup', selEnd); addEventListener('pointercancel', selEnd); addEventListener('blur', selEnd);
  addEventListener('keydown', e => { if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') root.classList.add('cursor-typing'); });
}
{ const au = $('.aurora'); if (au && au.children.length < 4) au.appendChild(document.createElement('i')); }
const errText = e => typeof e === 'string' ? e : !e ? '' : (e.message || e.msg || (e.error && (typeof e.error === 'string' ? e.error : e.error.message || e.error.code)) || e.code || '');
async function askPuter(messages, opts){
  if (!window.puter) throw new Error('No pude abrir Puter. Revisa tu internet o apaga el bloqueador de anuncios para esta página.');
  if (!puter.auth.isSignedIn()) throw Object.assign(new Error('Conecta tu cuenta de Puter para usar esta IA.'), { needLogin:true });
  const model = String(opts.model || state.model.openrouter).replace(/^pu:/, ''), t0 = performance.now();
  const inChars = messages.reduce((n, m) => n + (typeof m.content === 'string' ? m.content.length : 200), 0);
  let resp;
  try{ resp = await Promise.race([new Promise((_, no) => { const s = opts.signal; if (s){ if (s.aborted) no(Object.assign(new Error('Detenido.'), { aborted:true })); else s.addEventListener('abort', () => no(Object.assign(new Error('Detenido.'), { aborted:true })), { once:true }); } }), puter.ai.chat(messages, Object.assign({ model, normalize:true }, opts.maxTokens ? { max_tokens:opts.maxTokens } : {})), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 120000))]); }
  catch(e){
    if (e && e.aborted) throw e;
    const m = errText(e), code = String((e && (e.code || (e.error && e.error.code) || e.status)) || '') + ' ' + m;
    if (/insufficient_funds|insufficient funds|low balance|402/i.test(code)){ puterSetOut(); throw Object.assign(new Error('Usaste el saldo de este mes de Puter. Se llena otra vez el próximo mes; mientras tanto sigue con las IAs conectadas, que son gratis.'), { switchTo:'sz', limit:true }); }
    if (/too_many_requests|429|rate.?limit/i.test(code)) throw Object.assign(new Error('Vas muy rápido para Puter. Espera unos segundos y vuelve a intentar.'), { limit:true });
    if (/auth|token|sign.?in|login|401|403/i.test(m)) throw Object.assign(new Error('Se cerró tu cuenta de Puter. Entra otra vez.'), { needLogin:true });
    throw new Error(m === 'timeout' ? 'La IA tardó demasiado. Intenta de nuevo.' : 'Puter: ' + (m || 'no pudo responder con esta IA. Prueba con otra.'));
  }
  const c = resp && resp.message ? resp.message.content : resp;
  const text = (typeof c === 'string' ? c : Array.isArray(c) ? c.map(x => (x && x.text) || '').join('') : String(c || '')).trim() || '(La IA devolvió una respuesta vacía.)';
  return { text, prompt: Math.ceil(inChars / 4), completion: est(text), ms: performance.now() - t0, model };
}

