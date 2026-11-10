
/* ===== v2.4 · portada del boceto: Sona de cuerpo entero, onda «synthonized», compáralas a ciegas y detalles ===== */
(() => {
const { $, $$, reduce } = SZ;
const q = s => document.querySelector(s);

/* v2.5 · Sona de cuerpo entero, igual al boceto (cabeza 45 %, torso 30 %, base 25 %) */
const body = (mood, pose, size) => SZ.synBody(mood, pose, size);
/* v2.6: cambia cara y pose sobre el mismo cuerpo, así los brazos se mueven suave */
const set = (host, mood, pose, size) => SZ.synSet(host, mood, pose, size);
const hb = q('#heroBot');
if (hb){
  set(hb, 'feliz', 'saluda', 300);
  /* después del saludo, señala la tarjeta de ejemplo (como en el boceto) */
  const calm = () => { if (!hb.matches(':hover')) set(hb, 'neutral', innerWidth > 980 ? 'senalaL' : 'presenta', 300); };
  setTimeout(calm, 3800);
  /* detalle: si la tocas, se emociona, celebra y suelta un destello */
  hb.parentElement.style.pointerEvents = 'auto';
  /* v3.0: ella se puede tocar y enfocar, así que no puede estar dentro de algo con aria-hidden: lo decorativo de al lado sí lo queda */
  { const st = hb.parentElement; st.removeAttribute('aria-hidden'); [...st.children].forEach(c => { if (c !== hb) c.setAttribute('aria-hidden', 'true'); }); }
  hb.addEventListener('click', () => {
    set(hb, 'celebrando', 'celebra', 300); hb.classList.remove('boop'); void hb.offsetWidth; hb.classList.add('boop');
    try{ SZ.SND && SZ.SND.blip && SZ.SND.blip('feliz'); SZ.burst && SZ.burst(hb); }catch(e){}
    setTimeout(() => { set(hb, 'feliz', 'saluda', 300); setTimeout(calm, 2600); }, 1600);
    /* v2.6: ella es la ayudante (ya no hay botón): tocarla abre su ventanita para hablarle */
    try{ SZ.BOT && SZ.BOT.open && SZ.BOT.open(); }catch(e){}
  });
  hb.setAttribute('role', 'button'); hb.tabIndex = 0; hb.setAttribute('aria-label', SZ.t('rb.aria'));
  hb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); hb.click(); } });
  /* detalle: los ojos y la cabeza siguen al mouse */
  if (!reduce && matchMedia('(pointer: fine)').matches){
    let raf = 0, ex = 0, ey = 0;
    addEventListener('pointermove', e => { const r = hb.getBoundingClientRect(); ex = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / 500)); ey = Math.max(-1, Math.min(1, (e.clientY - r.top - 90) / 500)); if (!raf) raf = requestAnimationFrame(() => { raf = 0; hb.style.setProperty('--ex', (ex * 3.2).toFixed(2) + 'px'); hb.style.setProperty('--ey', (ey * 2.4).toFixed(2) + 'px'); hb.style.setProperty('--tilt', (ex * 4).toFixed(2) + 'deg'); }); }, { passive:true });
  }
}
/* chispitas doradas que flotan alrededor de Sona */
const dust = q('#heroDust');
if (dust && !reduce) dust.innerHTML = Array.from({ length:26 }, (_, i) => '<i style="--x:' + (Math.random() * 100).toFixed(1) + '%;--y:' + (Math.random() * 100).toFixed(1) + '%;--t:' + (3 + Math.random() * 5).toFixed(1) + 's;--dl:-' + (Math.random() * 6).toFixed(1) + 's;--s:' + (1.5 + Math.random() * 2.5).toFixed(1) + 'px"></i>').join('');
const rf = q('#readyFace');
if (rf){
  rf.innerHTML = body('celebrando', 'celebra', 230);
  rf.removeAttribute('aria-hidden'); rf.setAttribute('role', 'button'); rf.tabIndex = 0; rf.setAttribute('aria-label', SZ.t('rb.aria'));
  const go = () => { try{ SZ.SND && SZ.SND.blip && SZ.SND.blip('feliz'); SZ.BOT && SZ.BOT.open && SZ.BOT.open(); }catch(e){} };
  rf.addEventListener('click', go); rf.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
}

/* «¿Qué es estar synthonized?»: una onda de estática que, al pasar, se vuelve una onda limpia */
const cv = q('#szWave');
if (cv){
  const ctx = cv.getContext('2d'); let w = 0, h = 0, raf = 0, on = false;
  const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const noise = (x, t) => Math.sin(x * .31 + t * 3.1) * Math.sin(x * .07 - t) + Math.sin(x * 1.7 + t * 5) * .45;
  const draw = now => {
    raf = 0; const t = now / 1000; ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#3de0ff'); g.addColorStop(.45, '#7b3ff2'); g.addColorStop(.75, '#ff3d9a'); g.addColorStop(1, '#ff7a45');
    for (let k = 0; k < 3; k++){
      ctx.beginPath(); ctx.lineWidth = k ? 1.2 : 2.4; ctx.strokeStyle = g; ctx.globalAlpha = k ? .45 : 1;
      for (let x = 0; x <= w; x += 2){
        const u = x / w, clean = Math.sin(u * 14 - t * 2 + k * .6) * h * .28, dirty = noise(x, t + k) * h * .3 * (1 - u);
        const y = h / 2 + clean * Math.min(1, u * 1.6) + dirty * (1 - Math.min(1, u * 1.6));
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (on && !reduce) raf = requestAnimationFrame(draw);
  };
  fit(); addEventListener('resize', fit);
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { on = es[0].isIntersecting; if (on && !raf) raf = requestAnimationFrame(draw); }).observe(cv);
  else { on = true; raf = requestAnimationFrame(draw); }
}

/* Compáralas a ciegas: eliges la que tiene más Flow y Sona te cuenta quién respondió (son IAs de ejemplo) */
const bf = q('#blFace'); if (bf) bf.innerHTML = SZ.face('guino', 44);
$$('.bl-v').forEach((b, i) => b.addEventListener('click', () => {
  $$('.bl-c').forEach((c, j) => { c.classList.toggle('won', i === j); c.classList.add('shown'); const n = c.querySelector('b'); if (n && !n.dataset.was){ n.dataset.was = n.textContent; n.textContent = 'IA de ejemplo ' + (j + 1); } });
  if (bf) bf.innerHTML = SZ.face('celebrando', 44);
  const say = q('#blSay'); if (say) say.textContent = SZ.t('ix.blindPick', { n:i + 1 });
  try{ SZ.burst && SZ.burst(b); }catch(e){}
}));

/* el centro «Todas las IAs»: las etiquetas se acomodan en círculo alrededor de la onda */
const hub = q('.hub');
/* v2.6: cada etiqueta se mide; nunca toca la onda, nunca se sale de su lado y nunca pisa a la de arriba o abajo */
if (hub){ const place = () => {
  const W = hub.clientWidth, c = $('.hub-c', hub), oR = c && c.offsetParent ? c.offsetWidth / 2 : 0;
  if (!c || getComputedStyle($('.hub-i', hub)).position === 'static') return;      /* celular: van en fila, sin círculo */
  const items = $$('.hub-i', hub), room = Math.max(120, W / 2 - oR - 16);
  items.forEach(el => { el.style.maxWidth = Math.min(220, room) + 'px'; });
  const hMax = Math.max(...items.map(el => el.offsetHeight));
  items.forEach(el => {
    const a = parseFloat(el.style.getPropertyValue('--a')) * Math.PI / 180, side = Math.cos(a) < 0 ? -1 : 1, row = Math.round(Math.sin(a) * 2), w = el.offsetWidth;
    const near = oR + 16 + w / 2 + (row ? 0 : 26), far = W / 2 - w / 2;
    const x = side * Math.max(Math.min(near, far), Math.min(far, oR + 8 + w / 2));
    el.style.transform = 'translate(-50%,-50%) translate(' + x.toFixed(1) + 'px,' + (row * (hMax + 12)).toFixed(1) + 'px)';
  });
}; place(); addEventListener('resize', place); if (document.fonts) document.fonts.ready.then(place); }

/* detalle: el «Ver demo» baja con suavidad hasta «Así de fácil» y lo hace brillar un momento */
const demo = q('#demoBtn');
if (demo) demo.addEventListener('click', e => { const c = q('#como'); if (!c) return; e.preventDefault(); c.scrollIntoView({ behavior:reduce ? 'auto' : 'smooth' }); setTimeout(() => { c.classList.remove('glint'); void c.offsetWidth; c.classList.add('glint'); }, 650); });
})();
