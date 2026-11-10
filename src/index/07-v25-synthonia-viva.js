/* ===== v2.5 · Sona viva: cuando sales de la portada te acompaña por toda la página.
   Vuela de un lado al otro según la sección, cambia de cara y de pose, dice una frase corta,
   te mira con los ojos y, si la tocas, abre su ventanita para hablar contigo. ===== */
(() => {
const { $, reduce } = SZ;
if (!SZ.synBody) return;
const STOPS = {
  como:     { side:'r', mood:'feliz',      pose:'saluda',   get say(){ return SZ.t('rb.como'); } },
  modos:    { side:'l', mood:'neutral',    pose:'senala',   get say(){ return SZ.t('rb.modos'); } },
  usos:     { side:'r', mood:'creando',    pose:'presenta', get say(){ return SZ.t('rb.usos'); } },
  comparar: { side:'l', mood:'pensando',   pose:'piensa',   get say(){ return SZ.t('rb.comparar'); }, at:'.blind h3|.cmp-top h2' },
  conectar: { side:'r', mood:'feliz',      pose:'presenta', get say(){ return SZ.t('rb.conectar'); } },
  chat:     { side:'l', mood:'hablando',   pose:'senala',   get say(){ return SZ.t('rb.chat'); } },
  consumo:  { side:'r', mood:'analizando', pose:'escribe',  get say(){ return SZ.t('rb.consumo'); } },
  faq:      { side:'l', mood:'escuchando', pose:'escucha',  get say(){ return SZ.t('rb.faq'); } }
};
const el = document.createElement('div');
el.id = 'szRoam'; el.className = 'szroam'; el.setAttribute('role', 'button'); el.tabIndex = 0;
el.setAttribute('aria-label', SZ.t('rb.aria'));
el.innerHTML = '<span class="rb-fig"></span><span class="rb-say" aria-live="polite"></span>';
document.body.appendChild(el);
const fig = el.querySelector('.rb-fig'), bub = el.querySelector('.rb-say');
const hero = document.getElementById('top');
let cur = '', said = new Set(), sayT = 0, heroOn = true, posed = '';
const small = () => matchMedia('(max-width:760px)').matches;
/* v3.8 · ancho visible de verdad: en el celular innerWidth crece si algo se sale un poco, y ella se paraba más afuera todavía
   (cada vez 28 px menos, pero ya fuera de la pantalla); clientWidth no cambia con eso */
const vw = () => document.documentElement.clientWidth || innerWidth;
function paint(k){
  const S = STOPS[k]; if (!S) return;
  const side = el.dataset.side || S.side, key = S.mood + S.pose + side;
  if (key !== posed){ SZ.synSet(fig, S.mood, S.pose === 'senala' ? (side === 'l' ? 'senala' : 'senalaL') : S.pose, small() ? 96 : 132); posed = key; }
}
/* en PC se para junto al título de cada sección (del lado con más espacio); en el celular, encima del título */
function anchor(k){
  const S = STOPS[k], sec = document.getElementById(k); if (!S || !sec) return;
  /* prueba cada título posible de la sección hasta encontrar uno donde quepa sin tapar nada */
  el.hidden = false;   /* v2.7: visible un instante (en el mismo cuadro) para medir su alto real; abajo se decide si se queda */
  const hs = [...new Set([...(S.at ? S.at.split('|') : []), '.head h2', 'h2'].map(q => sec.querySelector(q)).filter(Boolean))];
  for (const h of hs){ standAt(S, sec, h); if (!el.hidden) return; }
}
/* todo lo que se ve en la página (textos, tarjetas, botones, etiquetas): ella nunca se para encima de nada de esto */
const nearOf = h => [...document.querySelectorAll('main h2,main h3,main h4,main p,main a,main button,main img,main li,main summary,main .lqg,main .card,main .band,main .chip,main canvas,main .gi,main .uscene')].filter(e => e !== h && !h.contains(e) && !e.contains(h) && !el.contains(e));
const hitsIn = (near, x0, y0, ww, hh) => near.some(e => { const r = e.getBoundingClientRect(); return r.width && r.height && Math.min(x0 + ww, r.right) - Math.max(x0, r.left) > 4 && Math.min(y0 + hh, r.bottom) - Math.max(y0, r.top) > 4; });
/* celular: ya no flota fija tapando tarjetas; se para en el espacio libre encima del título de cada sección */
function standSmall(t, w, H){
  const near = nearOf(document.createElement('i')), x = vw() - w - 28, top = t.top - H * .9;   /* 28 px: deja espacio a su brazo cuando lo levanta */
  el.hidden = hitsIn(near, x + w * .15, top + H * .04, w * .7, H * .92) || top + scrollY < 90; if (el.hidden) return;
  el._mute = true; bub.style.marginLeft = ''; el.classList.add('abs'); el.classList.remove('bside'); el.dataset.side = 'r';
  el._x = Math.round(x + scrollX); el._top = Math.round(top + scrollY); stick();
}
function standAt(S, sec, h){
  /* el título se escribe letra por letra: se mide el texto completo (no lo que ya se ve) */
  const cs = getComputedStyle(h), R = h.getBoundingClientRect(), fs = parseFloat(cs.fontSize) || 40;
  const cx = (anchor.cv || (anchor.cv = document.createElement('canvas'))).getContext('2d'); cx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
  const txt = h.textContent.trim(), ls = parseFloat(cs.letterSpacing) || 0;
  /* v4.2 · si la letra de la página aún no cargó, el lienzo mide con otra letra (más angosta) y ella quedaba encima del título:
     se usa lo más ancho entre esa medida y lo que el texto ocupa de verdad en pantalla */
  const rg = document.createRange(); rg.selectNodeContents(h); const seen = rg.getBoundingClientRect().width || 0;
  const tw = Math.min(R.width, Math.max(seen, cx.measureText(txt).width + ls * txt.length));
  const lh = Math.min(R.height, parseFloat(cs.lineHeight) || fs * 1.1), al = cs.textAlign;
  const l0 = al === 'center' ? R.left + (R.width - tw) / 2 : al === 'right' || al === 'end' ? R.right - tw : R.left;
  const t = { left:l0, right:l0 + tw, top:R.top, height:lh };
  const w = el.offsetWidth || 132, H = el.offsetHeight || 176, gap = 26;
  if (small()) return standSmall(t, w, H);
  /* la frase va al lado de ella (no encima), así no tapa lo que hay arriba; se mide con el texto ya puesto */
  bub.textContent = S.say; const bw = Math.min(230, bub.offsetWidth || 200) + 10;
  const roomR = vw() - t.right - gap, roomL = t.left - gap;
  /* primero el lado donde caben ella y su frase; si no, donde quepa ella sola */
  const need = w + bw + 12, pr = S.side === 'r' ? roomR : roomL, ot = S.side === 'r' ? roomL : roomR, other = S.side === 'r' ? 'l' : 'r';
  const pick = pr >= need ? S.side : ot >= need ? other : pr >= w ? S.side : ot >= w ? other : S.side;
  const top = t.top + t.height - H + 14 + H * .08;   /* v2.9: sin cuerpo, lo de abajo de su caja es solo sombra: baja un poco */
  const xOf = sd => Math.max(8, Math.min(vw() - w - 8, sd === 'r' ? t.right + gap : t.left - gap - w));
  /* v2.6: nunca encima de nada: si de un lado pisa un texto, una tarjeta o una etiqueta, prueba el otro; si pisa en los dos, esa sección no la muestra */
  const near = nearOf(h);
  const hits = (x0, y0, ww, hh) => hitsIn(near, x0, y0, ww, hh);
  const figHits = sd => { const x0 = xOf(sd); return hits(x0 + w * .18, top + H * .04, w * .64, H * .92) || (sd === 'r' ? x0 < t.right - 6 : x0 + w > t.left + 6); };
  let side = pick; if (figHits(side)) side = side === 'r' ? 'l' : 'r';
  el.hidden = figHits(side); if (el.hidden) return;
  const x = xOf(side);
  /* la frase va a su lado solo si cabe sin tapar nada; si no, no habla sola (si la tocas, te contesta en su ventanita) */
  const bside = (side === 'r' ? vw() - (x + w) - 12 >= bw : x - 12 >= bw) && !hits(side === 'r' ? x + w + 6 : x - bw - 6, top + H * .15, bw, 64);
  el._mute = !bside; bub.style.marginLeft = '';
  el.classList.add('abs'); el.classList.toggle('bside', bside); el.dataset.side = side;
  /* parada sobre la línea del título: los pies a la altura de las letras, nunca encima del texto de abajo */
  el._x = Math.round(x + scrollX); el._top = Math.round(top + scrollY); stick();
  /* v3.0: la frase encima de ella se corre lo justo para no salirse de la pantalla (en inglés es más larga) */
  if (!bside){ const bw2 = bub.offsetWidth, L = x + w * (side === 'r' ? .3 : .7) - bw2 / 2; bub.style.marginLeft = Math.round(Math.min(0, vw() - 8 - L - bw2) || Math.max(0, 8 - L)) + 'px'; }
}
/* se queda junto a su título y sube con él: nunca flota encima de las tarjetas ni del texto */
function stick(){
  if (!el.classList.contains('abs') || el._top == null) return;
  el.style.left = el._x + 'px'; el.style.top = el._top + 'px';
}
function place(k, fly){
  const S = STOPS[k]; if (!S) return;
  const from = el.getBoundingClientRect();
  /* v2.7: se dibuja primero con su tamaño real (si no, la primera vez se medía con un alto de reserva y quedaba flotando más arriba) */
  paint(k); anchor(k); paint(k);
  if (fly && !reduce && from.width){
    const to = el.getBoundingClientRect(), dx = from.left - to.left, dy = from.top - to.top;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4)
      el.animate([
        { transform:'translate(' + dx + 'px,' + dy + 'px) rotate(0deg)' },
        { transform:'translate(' + dx * .5 + 'px,' + (dy * .5 - 90) + 'px) rotate(' + (dx > 0 ? -14 : 14) + 'deg) scale(1.06)', offset:.5 },
        { transform:'translate(0,0) rotate(0deg)' }
      ], { duration:1100, easing:'cubic-bezier(.45,0,.2,1)' });
  }
  /* en el celular no habla sola: la frase taparía las tarjetas (si la tocas, te habla en su ventanita) */
  if (!said.has(k) && !small() && !el._mute){ said.add(k); say(S.say, fly ? 1100 : 300); }
}
function say(t, delay){
  clearTimeout(sayT);
  sayT = setTimeout(() => {
    bub.textContent = t; el.classList.add('talk');
    const f = el.querySelector('.szbody'); if (f) f.classList.add('talking');
    sayT = setTimeout(() => { el.classList.remove('talk'); const g = el.querySelector('.szbody'); if (g) g.classList.remove('talking'); }, 3600);
  }, delay || 0);
}
function update(){
  heroOn = !!hero && hero.getBoundingClientRect().bottom > innerHeight * .45;
  const mid = innerHeight * .45; let best = '';
  for (const k of Object.keys(STOPS)){ const s = document.getElementById(k); if (!s) continue; const r = s.getBoundingClientRect(); if (r.top < mid && r.bottom > mid * .6){ best = k; } }
  const rd = document.querySelector('#faq .ready'), rr = rd && rd.getBoundingClientRect(), readyOn = rr && rr.top < innerHeight * .8 && rr.bottom > 0;
  const show = !heroOn && !readyOn && !!best && !document.querySelector('.szm.on, #intro, #vintro');
  el.classList.toggle('on', show);
  if (show && best !== cur){ const first = !cur; cur = best; place(best, !first); }
}

let raf = 0;
addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); stick(); }); }, { passive:true, capture:true });
addEventListener('resize', () => { posed = ''; if (cur){ paint(cur); anchor(cur); } update(); });
/* los títulos se escriben letra por letra: cuando cambian de tamaño, se vuelve a acomodar */
if ('ResizeObserver' in window){ const ro = new ResizeObserver(() => { if (cur) anchor(cur); }); Object.keys(STOPS).forEach(k => { const h = document.querySelector('#' + k + ' .head h2'); if (h) ro.observe(h); });
  /* v2.7: y si algo de arriba crece (una tarjeta que se llena después), el título baja: ella se vuelve a parar junto a él */
  const mn = document.querySelector('main'); if (mn) ro.observe(mn); }
/* los ojos la siguen: el puntero */
if (!reduce && matchMedia('(pointer: fine)').matches){
  let r2 = 0;
  addEventListener('pointermove', e => { if (r2 || !el.classList.contains('on')) return; r2 = requestAnimationFrame(() => { r2 = 0; const r = el.getBoundingClientRect(); const ex = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / 420)), ey = Math.max(-1, Math.min(1, (e.clientY - r.top - 40) / 420)); el.style.setProperty('--ex', (ex * 3.2).toFixed(2) + 'px'); el.style.setProperty('--ey', (ey * 2.4).toFixed(2) + 'px'); el.style.setProperty('--tilt', (ex * 5).toFixed(2) + 'deg'); }); }, { passive:true });
}
/* tocarla: se pone contenta y abre su ventanita */
const open = () => {
  posed = ''; SZ.synSet(fig, 'celebrando', 'celebra', small() ? 96 : 132);
  try{ SZ.SND && SZ.SND.blip && SZ.SND.blip('feliz'); }catch(e){}
  setTimeout(() => { if (cur) paint(cur); }, 1500);
  try{ SZ.BOT && SZ.BOT.open && SZ.BOT.open(); }catch(e){}
};
el.addEventListener('click', open);
el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); } });
/* de vez en cuando parpadea distinto o mira a su alrededor para que se sienta viva */
if (!reduce) setInterval(() => {
  if (!el.classList.contains('on') || el.classList.contains('talk') || document.hidden) return;
  const k = cur, S = STOPS[k]; if (!S) return;
  const alt = ['guino', 'feliz', 'sorprendida', 'pensando'][Math.floor(Math.random() * 4)];
  SZ.synSet(fig, alt, S.pose, small() ? 96 : 132); posed = '';
  setTimeout(() => { if (cur === k) paint(k); }, 1400);
}, 9000);
/* v2.6: en la portada Sona de cuerpo entero ES la ayudante: no hay botón, y su ventanita sale de donde esté parada
   (arriba en la portada, caminando por las secciones o celebrando al final) */
document.documentElement.classList.add('szlive');
const shown = n => { if (!n) return false; const r = n.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; };
if (SZ.BOT && SZ.BOT.anchor) SZ.BOT.anchor(() => el.classList.contains('on') ? el : shown(document.getElementById('heroBot')) ? document.getElementById('heroBot') : shown(document.getElementById('readyFace')) ? document.getElementById('readyFace') : el);
update();
})();
