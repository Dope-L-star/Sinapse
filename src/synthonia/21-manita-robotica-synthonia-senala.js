/* ---------- el puntero de luz de Sona: señala, hace clic, escribe y explica (SIN manos: es un puntero de neón) ----------
   arrow = flecha, point = mira con anillo (para hacer clic), grab = punto que arrastra, palm = destello que saluda, text = cursor de escribir */
const HP = 'fill="#0b0b12" stroke="url(#hgd)" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"';
const HAND_SVG = {
  arrow:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 3l20 11.2-8.6 2.2L12 25.5z" ' + HP + '/><path d="M8.6 8.3l8.2 4.6" stroke="#fff" stroke-opacity=".55" stroke-width="1.1" stroke-linecap="round"/><circle cx="12.4" cy="17.4" r="1.5" fill="#ff7ac0"/></svg>',
  point:'<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="9.4" fill="rgba(11,11,18,.55)" stroke="url(#hgd)" stroke-width="1.9"/><path d="M16 2.4v4.4M16 25.2v4.4M2.4 16h4.4M25.2 16h4.4" stroke="url(#hgd)" stroke-width="1.9" stroke-linecap="round"/><circle cx="16" cy="16" r="3" fill="#3de0ff"/></svg>',
  grab:'<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="9" ' + HP + '/><circle cx="16" cy="16" r="4" fill="#ff7ac0"/><path d="M16 4.6v3M16 24.4v3M4.6 16h3M24.4 16h3" stroke="#3de0ff" stroke-width="1.6" stroke-linecap="round"/></svg>',
  palm:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.5l3.2 10.3L29.5 16l-10.3 3.2L16 29.5l-3.2-10.3L2.5 16l10.3-3.2z" ' + HP + '/><circle cx="16" cy="16" r="2.6" fill="#3de0ff"/></svg>',
  text:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11 4.5c2.4 0 4 .8 5 2 1-1.2 2.6-2 5-2M11 27.5c2.4 0 4-.8 5-2 1 1.2 2.6 2 5 2M16 6.5v19" fill="none" stroke="#0b0b12" stroke-width="4.4" stroke-linecap="round"/><path d="M11 4.5c2.4 0 4 .8 5 2 1-1.2 2.6-2 5-2M11 27.5c2.4 0 4-.8 5-2 1 1.2 2.6 2 5 2M16 6.5v19" fill="none" stroke="url(#hgd)" stroke-width="2.2" stroke-linecap="round"/><circle cx="16" cy="16" r="1.5" fill="#ff7ac0"/></svg>'
};
const HAND_HOT = { arrow:[5, 3], point:[16, 16], grab:[16, 16], text:[16, 16], palm:[16, 16] };
const HAND = (() => {
  let el = null, spot = null, say = null, x = -80, y = -80, shape = 'arrow', alive = false, raf = 0, sayTok = 0, wraf = 0, wArea = null;
  const fast = () => !CFG.anim || PERF;
  function build(){
    if (el) return;
    el = document.createElement('div'); el.id = 'szHand'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="hgd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ac0"/><stop offset=".5" stop-color="#a866ff"/><stop offset="1" stop-color="#3de0ff"/></linearGradient></defs></svg><div class="hs"></div><span class="hl">Sona</span>';
    spot = document.createElement('div'); spot.id = 'szSpot'; spot.setAttribute('aria-hidden', 'true');
    say = document.createElement('div'); say.id = 'szSay'; say.setAttribute('role', 'status'); say.setAttribute('aria-live', 'polite');
    document.body.append(spot, el, say);
    setShape('arrow'); paint();
  }
  function setShape(s){ if (!el || (s === shape && $('.hs', el).firstChild)) return; shape = s; $('.hs', el).innerHTML = HAND_SVG[s] || HAND_SVG.arrow; el.dataset.s = s; }
  function paint(rot){ if (!el) return; const [hx, hy] = HAND_HOT[shape] || [0, 0]; el.style.transform = 'translate3d(' + (x - hx * 1.25).toFixed(1) + 'px,' + (y - hy * 1.25).toFixed(1) + 'px,0)' + (rot ? ' rotate(' + rot.toFixed(2) + 'deg)' : ''); }
  const rectOf = t => { const n = typeof t === 'string' ? $(t) : t; if (!n) return null; if (n.getBoundingClientRect){ const r = n.getBoundingClientRect(); return r.width || r.height ? r : null; } return { left:t.x, top:t.y, width:0, height:0, right:t.x, bottom:t.y }; };
  const visible = t => { const n = typeof t === 'string' ? $(t) : t; return !!(n && n.getBoundingClientRect && n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden'); };
  function show(from){ build(); alive = true; if (from){ x = from.x; y = from.y; } paint(); el.classList.add('on'); spot.classList.add('ready'); }
  function hide(){ alive = false; cancelAnimationFrame(raf); stopWander(); if (!el) return; el.classList.remove('on'); spot.classList.remove('on'); say.classList.remove('on'); const a = el, b = spot, c = say; el = spot = say = null; setTimeout(() => { a.remove(); b.remove(); c.remove(); }, 600); }
  /* se mueve en una curva suave, con un poquito de inclinación según la velocidad */
  function moveTo(t, o = {}){
    build(); const r = rectOf(t); if (!r) return Promise.resolve(false);
    const tx = o.x != null ? o.x : r.left + r.width * (o.fx != null ? o.fx : .5), ty = o.y != null ? o.y : r.top + r.height * (o.fy != null ? o.fy : .5);
    if (o.shape) setShape(o.shape);
    if (!o._w) stopWander();
    const x0 = x, y0 = y, d = Math.hypot(tx - x0, ty - y0);
    const D = fast() ? Math.min(380, 160 + d * .25) : Math.min(1150, 380 + d * .55);
    const bend = fast() ? 0 : Math.min(90, d * .18) * (o.bend || (tx > x0 ? -1 : 1));
    const mx = (x0 + tx) / 2 + (-(ty - y0) / (d || 1)) * bend, my = (y0 + ty) / 2 + ((tx - x0) / (d || 1)) * bend;
    cancelAnimationFrame(raf);
    return new Promise(res => {
      const t0 = performance.now(); let px = x, py = y;
      (function f(now){
        if (!el){ res(false); return; }
        const k = Math.min(1, (now - t0) / D), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, u = 1 - e;
        x = u * u * x0 + 2 * u * e * mx + e * e * tx; y = u * u * y0 + 2 * u * e * my + e * e * ty;
        const vx = x - px; px = x; py = y;
        paint(fast() ? 0 : clamp(vx * .9, -14, 14));
        if (k < 1) raf = requestAnimationFrame(f); else { paint(0); res(true); }
      })(t0);
    });
  }
  /* aro de luz alrededor de lo que explica; el resto se oscurece un poco */
  let spotT = null;
  function spotOn(t, pad){
    build(); if (spotT && spotT.removeAttribute) spotT.removeAttribute('data-guide-ok'); spotT = t && t.nodeType === 1 ? t : null; if (spotT) spotT.setAttribute('data-guide-ok', '');
    const r = rectOf(t); if (!r){ spot.classList.remove('on'); return; }
    const p = pad == null ? 8 : pad, rad = Math.min(26, (r.height + p * 2) / 2);
    Object.assign(spot.style, { left:(r.left - p) + 'px', top:(r.top - p) + 'px', width:(r.width + p * 2) + 'px', height:(r.height + p * 2) + 'px', borderRadius:rad + 'px' });
    spot.classList.add('on');
  }
  const spotOff = () => { if (spot) spot.classList.remove('on'); if (spotT && spotT.removeAttribute) spotT.removeAttribute('data-guide-ok'); spotT = null; };
  /* clic con el puntero: se aprieta, sale una onda y (si se pide) hace el clic de verdad */
  async function click(t, o = {}){
    if (t && !(await moveTo(t, Object.assign({ shape:'point' }, o)))) return false;
    setShape('point'); el.classList.add('press'); SND.tap();
    const w = document.createElement('i'); w.className = 'szripple'; w.style.left = x + 'px'; w.style.top = y + 'px'; document.body.appendChild(w); setTimeout(() => w.remove(), 700);
    await sleepRaw(140); if (el) el.classList.remove('press');
    if (o.real){ const n = typeof t === 'string' ? $(t) : t; if (n && n.click) n.click(); }
    await sleepRaw(160); return true;
  }
  /* escribe en una caja de texto, letra por letra, con sonido de tecla */
  async function type(t, text, o = {}){
    const n = typeof t === 'string' ? $(t) : t; if (!n) return false;
    await moveTo(n, { shape:'text', fx:.12, fy:.5 });
    n.focus({ preventScroll:true }); n.value = '';
    const cps = fast() ? 400 : (o.cps || 38), step = fast() ? 6 : 1;
    for (let i = 0; i < text.length && el; i += step){
      n.value = text.slice(0, i + step); n.dispatchEvent(new Event('input', { bubbles:true }));
      if (!fast() && text[i] !== ' ') SND.key();
      await sleepRaw(1000 / cps * (/[.,!?]/.test(text[i]) ? 3 : 1));
    }
    n.value = text; n.dispatchEvent(new Event('input', { bubbles:true }));
    if (el) setShape('arrow'); return true;
  }
  /* Sona habla en una burbuja junto al puntero (con botones opcionales) */
  function talk(text, o = {}){
    build(); const tok = ++sayTok;
    const mood = o.mood || 'feliz', btns = o.buttons || [];
    say.innerHTML = '<span class="sf">' + face(mood, 56) + '</span><div class="st"><b>Sona</b><p></p>' + (btns.length ? '<div class="sb">' + btns.map((b, i) => '<button type="button" class="btn sm' + (b.ghost ? ' ghost' : '') + '" data-sb="' + i + '">' + esc(b.label) + '</button>').join('') + '</div>' : '') + '</div>';
    const p = $('p', say); p.textContent = text;
    say.classList.remove('on'); void say.offsetWidth;
    /* lo más cerca posible de lo que explica, sin salirse de la pantalla */
    const W = Math.min(340, innerWidth - 24), r = o.near ? rectOf(o.near) : null;
    say.style.width = W + 'px';
    let lx, ly; const H = say.offsetHeight || 120;
    if (r){
      lx = clamp(r.left + r.width / 2 - W / 2, 12, innerWidth - W - 12);
      ly = r.bottom + 18 + H < innerHeight - 12 ? r.bottom + 18 : r.top - H - 18 > 12 ? r.top - H - 18 : clamp(innerHeight / 2 - H / 2, 12, innerHeight - H - 12);
      if (o.side && r.right + 24 + W < innerWidth - 12){ lx = r.right + 24; ly = clamp(r.top + r.height / 2 - H / 2, 12, innerHeight - H - 12); }
    } else { lx = clamp(innerWidth / 2 - W / 2, 12, innerWidth - W - 12); ly = clamp(innerHeight * .34 - H / 2, 12, innerHeight - H - 12); }
    say.style.left = lx + 'px'; say.style.top = ly + 'px';
    requestAnimationFrame(() => say && say.classList.add('on'));
    SND.blip(mood);
    if (!fast()) typeIn(p, { cps:48, max:4, onFrame:lipSync([$('.sf .szface', say), botFaceEl()], text) }).catch(() => { p.textContent = text; });
    return new Promise(res => {
      if (!btns.length){ res(-1); return; }
      $$('[data-sb]', say).forEach(b => b.addEventListener('click', () => { if (tok === sayTok) res(+b.dataset.sb); }));
      if (o.auto) setTimeout(() => { if (tok === sayTok) res(-2); }, o.auto);
    });
  }
  const quiet = () => { if (say) say.classList.remove('on'); };
  /* mientras eliges algo (p. ej. los temas), el puntero no se queda quieto tapando opciones:
     flota suave por fuera del panel, arriba y abajo, sin ponerse encima de nada */
  function stopWander(){ cancelAnimationFrame(wraf); wraf = 0; wArea = null; }
  function spotFor(r){
    const W = innerWidth, Hh = innerHeight, m = 46;
    if (r.right + m + 30 < W) return { x:r.right + m, y:r.top + r.height * .45, ax:'y', amp:Math.min(120, r.height * .3) };
    if (r.left - m - 30 > 0) return { x:r.left - m, y:r.top + r.height * .45, ax:'y', amp:Math.min(120, r.height * .3) };
    if (r.bottom + 56 < Hh) return { x:r.left + r.width * .5, y:r.bottom + 34, ax:'x', amp:Math.min(140, r.width * .3) };
    if (r.top - 56 > 0) return { x:r.left + r.width * .5, y:r.top - 30, ax:'x', amp:Math.min(140, r.width * .3) };
    return { x:clamp(r.right - 28, 30, W - 30), y:clamp(r.bottom - 22, 30, Hh - 30), ax:'y', amp:16 };
  }
  async function wander(area){
    stopWander(); if (!area) return; build(); wArea = area;
    const r0 = rectOf(area); if (!r0) return;
    const s0 = spotFor(r0); setShape('arrow');
    await moveTo({ x:s0.x, y:s0.y }, { shape:'arrow', _w:true });
    if (wArea !== area || !el) return;
    const t0 = performance.now(); let last = 0;
    (function f(now){
      if (wArea !== area || !el || !area.isConnected){ wraf = 0; return; }
      wraf = requestAnimationFrame(f);
      if (fast() && now - last < 50) return; last = now;
      const r = rectOf(area); if (!r) return; const sp = spotFor(r), t = (now - t0) / 1000;
      const a = Math.sin(t * .55) * sp.amp + Math.sin(t * 1.3) * 10, b = Math.sin(t * .9 + 1) * 12;
      const nx = sp.ax === 'y' ? sp.x + b : sp.x + a, ny = sp.ax === 'y' ? sp.y + a : sp.y + b;
      const vx = nx - x; x += (nx - x) * .08; y += (ny - y) * .08;
      paint(clamp(vx * .4, -8, 8) + Math.sin(t * 1.7) * 4);
    })(t0);
  }
  /* «¡hola!»: el puntero hace un destello y saluda */
  async function wave(n){
    build(); stopWander(); const prev = shape; setShape('palm');
    const hs = $('.hs', el); if (!hs) return;
    hs.style.transformOrigin = '50% 92%';
    const a = hs.animate([{ transform:'rotate(0)' }, { transform:'rotate(-20deg)' }, { transform:'rotate(18deg)' }, { transform:'rotate(-16deg)' }, { transform:'rotate(14deg)' }, { transform:'rotate(-8deg)' }, { transform:'rotate(0)' }], { duration:(n || 1) * 1300, easing:'ease-in-out' });
    SND.blip('feliz');
    await new Promise(r => { a.onfinish = r; a.oncancel = r; setTimeout(r, (n || 1) * 1300 + 200); });
    if (el && shape === 'palm') setShape(prev === 'palm' ? 'arrow' : prev);
  }
  return { show, hide, moveTo, click, type, talk, quiet, wander, wave, spot:spotOn, unspot:spotOff, shape:setShape, visible, get alive(){ return alive; }, get pos(){ return { x, y }; } };
})();

