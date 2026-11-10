/* ===== v2.4 · fondo espacial: brillos grandes, estrellas con destellos dorados, cintas de neón y burbujas de vidrio =====
   Vive dentro de .aurora (así «Fondo animado» en Ajustes lo apaga igual que antes). Cada página tiene su variante. */
const SPACE = (() => {
  const au = document.querySelector('.aurora'); if (!au) return null;
  const path = location.pathname;
  const kind = /chat(\.html)?$/.test(path) || document.getElementById('composer') ? 'chat'
    : /pulsem/.test(path) ? 'pulsem' : 'home';
  /* x, y en vw/vh; c = color del tema; s = escala */
  const V = {
    home:   { glows:[{ x:100, y:0, c:'light' }, { x:0, y:100, c:'secondary' }, { x:58, y:42, c:'primary', s:.7 }], ribbon:'mid', bubbles:[{ x:4, y:62, d:110 }, { x:63, y:8, d:70 }, { x:92, y:46, d:52 }, { x:46, y:82, d:30 }] },
    chat:   { glows:[{ x:100, y:0, c:'primary' }, { x:0, y:100, c:'light', s:.8 }], ribbon:'low', dim:.55, density:.6, bubbles:[{ x:94, y:78, d:46 }] },
    alias:  { glows:[{ x:50, y:50, c:'primary', s:1.1 }, { x:0, y:100, c:'secondary' }, { x:100, y:0, c:'light' }], ribbon:'mid', dim:.8, bubbles:[{ x:22, y:22, d:60 }, { x:80, y:70, d:80 }] },
    pulsem: { glows:[{ x:100, y:0, c:'primary' }, { x:0, y:100, c:'light' }], ribbon:'none', dim:.45, density:.5, bubbles:[] }
  }[kind];

  const root = document.createElement('div');
  root.className = 'sb-root'; root.setAttribute('aria-hidden', 'true'); root.dataset.kind = kind;
  root.style.setProperty('--dim', V.dim || 1);
  const pos = o => '--x:' + o.x + ';--y:' + o.y + ';--s:' + (o.s || 1);
  /* cintas: 5 tiras paralelas que cruzan la pantalla como en el boceto (violeta, rosa, naranja, oro y una línea cian fina) */
  const RIB = [['primary', 0, 13], ['secondary', 14, 11], ['warm', 26, 9], ['spark', 36, 6], ['light', 44, 2.4]];
  const ribbon = y0 => RIB.map(([c, o, w], i) => {
    const y = y0 + o;
    const d = 'M-120 ' + (y + 120) + 'C220 ' + (y + 40) + ' 420 ' + (y + 190) + ' 760 ' + (y + 90) + 'S1240 ' + (y - 130) + ' 1600 ' + (y - 40);
    return '<path class="rb rb' + i + '" d="' + d + '" stroke="var(--sb-' + c + ')" stroke-width="' + w + '"/>';
  }).join('');
  const ribY = { mid:330, low:470 }[V.ribbon];
  root.innerHTML = '<div class="sb-base"></div>'
    + '<div class="sb-layer" style="--k:.35">' + V.glows.map((g, i) => '<div class="sb-pos" style="' + pos(g) + '"><div class="sb-glow" style="--c:var(--sb-' + g.c + ');animation-delay:' + (-i * 7) + 's"></div></div>').join('') + '</div>'
    + '<canvas class="sb-canvas"></canvas>'
    + (ribY ? '<div class="sb-layer sb-rib" style="--k:.7"><svg viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice" fill="none" stroke-linecap="round"><g class="rb-glow">' + ribbon(ribY) + '</g><g class="rb-sharp">' + ribbon(ribY) + '</g></svg></div>' : '')
    + '<div class="sb-layer" style="--k:1.4">' + V.bubbles.map((b, i) => '<div class="sb-pos" style="' + pos(b) + '"><div class="sb-bubble" style="--d:' + b.d + 'px;animation-delay:' + (-i * 3) + 's"></div></div>').join('') + '</div>';
  au.appendChild(root);

  /* estrellas: puntitos que titilan y unos pocos destellos dorados que suben muy despacio */
  const cv = root.querySelector('.sb-canvas'), ctx = cv.getContext('2d');
  let w = 0, h = 0, S = [], raf = 0, sc = 0, still = reduce || PERF;
  const col = n => getComputedStyle(document.documentElement).getPropertyValue('--sb-' + n).trim() || '#fff';
  let pal = [], gold = '#ffc857';
  const paint = () => { pal = [col('text'), col('light')]; gold = col('spark'); S.forEach(s => { s.c = s.g ? gold : pal[s.k % pal.length]; }); };
  const init = () => {
    if (document.documentElement.classList.contains('au8on')) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.clientWidth || innerWidth; h = cv.clientHeight || innerHeight; cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* determinístico: siempre el mismo cielo para la misma pantalla */
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const n = Math.round(w * h / 9000 * (V.density || 1));
    S = Array.from({ length:n }, (_, k) => { const g = rnd() < .22; return { x:rnd() * w, y:rnd() * h, z:.25 + rnd() * .75, g, k, r:g ? .8 + rnd() * 1.2 : .3 + rnd() * 1.1, ph:rnd() * 6.28, sp:.4 + rnd() * 1.4 }; });
    paint();
  };
  /* las estrellas titilan despacio: con 30 cuadros por segundo se ven igual y la página trabaja la mitad */
  let last = -1e9;
  const draw = t => {
    raf = 0;
    /* v2.9: con el cielo en vivo (core 25h) sus estrellas ya están; este lienzo no se dibuja (era un segundo cielo a 30 cuadros) */
    if (document.documentElement.classList.contains('au8on')){ if (cv.width > 1){ cv.width = cv.height = 1; } return; }   /* y suelta su memoria */
    if (!still && t - last < 33){ if (!document.hidden && CFG.bg && !document.documentElement.classList.contains('sb-off')) raf = requestAnimationFrame(draw); return; }
    last = t; ctx.clearRect(0, 0, w, h);
    for (const s of S){
      const y = (((s.y - sc * s.z * .12 - (s.g ? t * .004 : 0)) % h) + h) % h;
      const tw = still ? .8 : .5 + .5 * Math.sin(t / 1000 * s.sp + s.ph);
      ctx.globalAlpha = (.2 + .8 * tw) * s.z;
      ctx.fillStyle = s.c;
      ctx.beginPath(); ctx.arc(s.x, y, s.r * s.z * 1.3, 0, 6.283); ctx.fill();
      if (s.g && tw > .92 && s.r > 1.4){ ctx.globalAlpha *= .5; ctx.fillRect(s.x - 4, y - .4, 8, .8); ctx.fillRect(s.x - .4, y - 4, .8, 8); }
    }
    if (!still && !document.hidden && CFG.bg && !document.documentElement.classList.contains('sb-off')) raf = requestAnimationFrame(draw);
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(draw); };
  init(); go();
  addEventListener('resize', () => { init(); go(); });
  addEventListener('scroll', () => { sc = scrollY; if (still) go(); }, { passive:true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) go(); });

  /* paralaje leve con el mouse y el scroll: un solo cuadro por evento, solo variables CSS */
  let pr = 0, mx = 0, my = 0;
  const push = () => { pr = 0; const max = Math.max(1, document.documentElement.scrollHeight - innerHeight); root.style.setProperty('--sy', scrollY); root.style.setProperty('--p', Math.min(1, scrollY / max).toFixed(3)); root.style.setProperty('--mx', mx.toFixed(2)); root.style.setProperty('--my', my.toFixed(2)); };
  const req = () => { if (!pr) pr = requestAnimationFrame(push); };
  addEventListener('scroll', req, { passive:true });
  if (!reduce && matchMedia('(pointer: fine)').matches) addEventListener('pointermove', e => { mx = (e.clientX / innerWidth - .5) * 14; my = (e.clientY / innerHeight - .5) * 2; req(); }, { passive:true });
  push();
  return { root, repaint:() => { paint(); go(); }, wake:go };
})();
