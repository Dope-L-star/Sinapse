/* ===== v2.8 · cielo en vivo: los fondos que mandó Sammuel, hechos en código (ninguno es una imagen) =====
   Cinco escenas que se dibujan y se mueven en tiempo real:
   · «fondo»     aurora rosa y cian arriba a la derecha, «V» violeta a la izquierda, brillo turquesa abajo (la portada).
   · «seda»      una cinta ancha en diagonal: rosa arriba, lavanda al medio, verde agua abajo (Sonyx sin mensajes).
   · «nebulosa»  nube violeta y magenta cruzando el cielo con hilos cian, una galaxia y cúmulos de estrellas.
   · «planeta»   nube de colores arriba a la izquierda, velos lavanda abajo, la galaxia y un planeta con anillos.
   · «calma»     un arco tenue y oscuro (Sonyx con mensajes: se lee mejor).
   En la portada el cielo pasa de una escena a la otra mientras bajas. En Sonyx, apenas hay mensajes, la «seda»
   se apaga en «calma» y sube una ola de noche desde la caja de escribir.
   Cómo es tan liviano: las nubes se pintan en un lienzo chiquito (~36 000 píxeles) y la pantalla lo estira; ese estirado
   ES el desenfoque. Estrellas, galaxia y planeta se dibujan una sola vez y solo se mueven con la tarjeta gráfica.
   Con «Fondo animado» apagado (o en el celular en modo rápido) el cielo se pinta una vez y queda quieto. */
const AURORA = (() => {
  if (!SPACE) return null;
  const kind = SPACE.root.dataset.kind;
  if (kind !== 'home' && kind !== 'chat') return null;
  const H = document.documentElement, home = kind === 'home';
  /* el planeta con anillos (SVG): la mitad de atrás de los anillos va detrás de la esfera y la de adelante encima */
  const rings = half => '<g clip-path="url(#au8' + half + ')" fill="none" stroke-linecap="round">' + [[104, .5, .9], [96, .35, .6], [88, .55, 1.4], [79, .3, .6], [71, .45, .9]]
    .map(([r, o, w]) => '<ellipse rx="' + r + '" ry="' + (r * .2).toFixed(1) + '" stroke="rgba(214,220,240,' + o + ')" stroke-width="' + w + '"/>').join('') + '</g>';
  const PLANET = '<svg viewBox="-120 -70 240 140" aria-hidden="true"><defs>'
    + '<radialGradient id="au8pg" cx=".7" cy=".3" r=".9"><stop offset="0" stop-color="#c9cee0"/><stop offset=".28" stop-color="#5b6078"/><stop offset=".62" stop-color="#191a2a"/><stop offset="1" stop-color="#06060c"/></radialGradient>'
    + '<clipPath id="au8b"><rect x="-130" y="-80" width="260" height="80"/></clipPath><clipPath id="au8f"><rect x="-130" y="0" width="260" height="80"/></clipPath></defs>'
    + '<g transform="rotate(-14)">' + rings('b') + '<circle r="40" fill="url(#au8pg)"/><circle r="40" fill="none" stroke="rgba(220,230,255,.35)" stroke-width=".8"/>' + rings('f') + '</g>'
    + '<circle cx="-92" cy="-8" r="2.4" fill="#aeb4c8"/><circle cx="58" cy="-44" r="1.6" fill="#9aa0b6"/><circle cx="74" cy="30" r="2" fill="#8a90a8"/></svg>';
  const el = document.createElement('div');
  el.className = 'au8'; el.dataset.kind = kind; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<canvas class="au8-c"></canvas><canvas class="au8-d"></canvas><canvas class="au8-d au8-tw"></canvas>'
    + (home ? '<canvas class="au8-d au8-cl"></canvas><div class="au8-gx"><canvas></canvas></div><div class="au8-pl">' + PLANET + '</div><div class="au8-sw"><i class="au8-ss"></i><i class="au8-ss s2"></i></div>' : '')
    + '<i class="au8-wash"></i><i class="au8-edge"></i>';
  document.body.prepend(el); H.classList.add('au8on');
  const cv = el.querySelector('.au8-c'), ctx = cv.getContext('2d', { alpha:false });
  const [dc, tc, cc] = el.querySelectorAll('.au8-d');
  const gx = el.querySelector('.au8-gx'), pl = el.querySelector('.au8-pl'), sw = el.querySelector('.au8-sw');

  /* colores del tema (si cambias de tema, el cielo cambia con él) */
  const nc = c => { ctx.fillStyle = '#000'; ctx.fillStyle = c || '#000'; return ctx.fillStyle; };
  const rgb = c => { const s = nc(c); if (s[0] === '#') return [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const m = s.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [255, 255, 255]; };
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a > 0 ? a : 0).toFixed(3) + ')';
  const WH = [255, 255, 255];
  let C = {};
  const recolor = () => {
    const cs = getComputedStyle(H), v = n => rgb(cs.getPropertyValue('--sb-' + n).trim());
    const bg = v('bg'), P = v('primary'), S = v('secondary'), L = v('light'), W = v('warm'), deep = v('deep');
    const teal = mix(L, [24, 226, 186], .5);
    C = { bg, P, S, L, W, teal,
      top: mix(bg, mix(deep, [18, 24, 92], .55), .42), bot: mix(bg, [6, 8, 30], .35), dark: mix(bg, [4, 6, 20], .5),
      navy: mix(mix(P, L, .3), [20, 30, 120], .55), mag: mix(S, P, .42), hot: mix(S, [255, 236, 248], .45), vio: mix(P, S, .18),
      ice: mix(L, WH, .3), lav: mix(P, WH, .42), rose: mix(S, WH, .28), mint: mix(L, [70, 230, 170], .6) };
  };

  /* tamaño: el lienzo de las nubes mide ~36 000 píxeles cuando se mueve (la pantalla lo estira y ese estirado es el desenfoque).
     Quieto se pinta una sola vez, así que puede ser más grande: en un celular (3 píxeles por punto) el estirado de 9 veces
     dejaba una rejilla de rombos en los degradados; con ~150 000 queda liso. Las estrellas van a la nitidez de la pantalla (hasta 2x). */
  let w = 0, h = 0, cw = 0, ch = 0, D = 1, px = 0, budget = 0;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const anim = () => CFG.bg && !reduce && !PERF && !H.classList.contains('noanim') && !H.classList.contains('simple');
  const want = () => anim() ? (dpr > 1.4 ? 56000 : 36000) : 150000;
  const U = u => u * cw, V = v => v * ch;
  const size = () => {
    w = innerWidth; h = innerHeight; budget = want();
    cw = Math.max(80, Math.round(Math.sqrt(budget * w / h))); ch = Math.max(80, Math.round(cw * h / w));
    cv.width = cw; cv.height = ch; D = Math.sqrt(cw * ch) * 1.2;
    if (px !== w * h){ px = w * h; stars(); }
  };
  /* si «Fondo animado» se prende o se apaga, el lienzo cambia de tamaño */
  const resize = () => { if (budget !== want()) size(); };
  /* azar con semilla: el mismo cielo cada vez */
  const seeded = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const hr = (i, s) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
  /* estrellas: el polvo se dibuja una vez; el segundo lienzo titila entero; el tercero son los cúmulos y destellos de la nebulosa */
  const flare = (x, cx, cy, r, col) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r * 3); g.addColorStop(0, 'rgba(' + col + ',.95)'); g.addColorStop(.25, 'rgba(' + col + ',.35)'); g.addColorStop(1, 'rgba(' + col + ',0)');
    x.fillStyle = g; x.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6);
    x.fillStyle = 'rgba(' + col + ',.5)'; x.fillRect(cx - r * 6, cy - .5, r * 12, 1); x.fillRect(cx - .5, cy - r * 6, 1, r * 12);
  };
  const stars = () => {
    const tones = ['255,255,255', '200,240,255', '255,214,240', '214,206,255'];
    [[dc, w * h / 2400, .5, .9, 11], [tc, w * h / 16000, 1, 1.5, 23]].forEach(([c, n, a, r, s]) => {
      const rnd = seeded(s); c.width = w * dpr; c.height = h * dpr; const x = c.getContext('2d'); x.scale(dpr, dpr);
      for (let i = 0; i < n; i++){
        x.fillStyle = 'rgba(' + tones[i % 4] + ',' + (a * (.18 + rnd() * .7)).toFixed(2) + ')';
        x.beginPath(); x.arc(rnd() * w, rnd() * h, .35 + rnd() * r * (rnd() < .08 ? 1.8 : 1), 0, 6.283); x.fill();
      }
    });
    if (!cc) return;
    const rnd = seeded(37); cc.width = w * dpr; cc.height = h * dpr; const x = cc.getContext('2d'); x.scale(dpr, dpr);
    /* un río de estrellas en diagonal, más denso al medio */
    for (let i = 0; i < w * h / 900; i++){
      const s = rnd(), off = (rnd() + rnd() + rnd() - 1.5) * .12;
      const px = (.12 + s * .55 + off * .5) * w, py = (.14 + s * .36 - off) * h;
      x.fillStyle = 'rgba(' + tones[i % 4] + ',' + (.15 + rnd() * .6).toFixed(2) + ')'; x.fillRect(px, py, rnd() < .1 ? 1.6 : 1, rnd() < .1 ? 1.6 : 1);
    }
    [[.15, .18, 2.2, '255,236,214'], [.21, .31, 1.6, '255,236,214'], [.58, .27, 1.8, '255,255,255'], [.36, .46, 1.4, '255,220,200'], [.61, .52, 2.2, '190,250,255'], [.9, .79, 2.4, '255,236,214'], [.84, .96, 1.4, '255,255,255'], [.58, .36, 1.2, '255,214,240']]
      .forEach(([u, v, r, col]) => flare(x, u * w, v * h, r, col));
  };
  /* la galaxia espiral: miles de puntitos en dos brazos, dibujada una vez; gira despacio con la tarjeta gráfica */
  if (gx){
    const g = gx.querySelector('canvas'), G = 520, x = g.getContext('2d'), rnd = seeded(5), R = G * .46;
    g.width = g.height = G; x.translate(G / 2, G / 2);
    const core = x.createRadialGradient(0, 0, 0, 0, 0, R * .34); core.addColorStop(0, 'rgba(255,246,228,1)'); core.addColorStop(.18, 'rgba(252,232,206,.6)'); core.addColorStop(.5, 'rgba(225,210,220,.18)'); core.addColorStop(1, 'rgba(200,190,230,0)');
    x.fillStyle = core; x.fillRect(-R, -R, 2 * R, 2 * R);
    /* el disco: una luz pareja que se va apagando hacia la orilla */
    const disk = x.createRadialGradient(0, 0, 0, 0, 0, R); disk.addColorStop(0, 'rgba(214,214,236,.22)'); disk.addColorStop(.5, 'rgba(200,200,232,.08)'); disk.addColorStop(1, 'rgba(200,200,232,0)');
    x.fillStyle = disk; x.fillRect(-R, -R, 2 * R, 2 * R);
    /* luz suave a lo largo de los dos brazos */
    for (let i = 0; i < 420; i++){
      const arm = i % 2, d = .12 + (i / 420) * .85, th = arm * Math.PI + d * 3.3 + (rnd() - .5) * .5, r = d * R;
      const x0 = Math.cos(th) * r, y0 = Math.sin(th) * r, rr = 10 + 22 * (1 - d), gg = x.createRadialGradient(x0, y0, 0, x0, y0, rr);
      gg.addColorStop(0, 'rgba(206,210,240,' + (.08 * (1 - d * .6)).toFixed(3) + ')'); gg.addColorStop(1, 'rgba(206,210,240,0)');
      x.fillStyle = gg; x.fillRect(x0 - rr, y0 - rr, 2 * rr, 2 * rr);
    }
    /* miles de estrellas: más juntas cerca del centro y siguiendo los brazos, con muchas sueltas en el disco */
    for (let i = 0; i < 9000; i++){
      const arm = i % 2, d = Math.pow(rnd(), 1.1), loose = rnd() < .45;
      const th = loose ? rnd() * 6.283 : arm * Math.PI + d * 3.3 + (rnd() - .5) * (1.1 - d * .4), r = d * R + (rnd() - .5) * 10;
      const warm = d < .28 || rnd() < .12;
      x.fillStyle = (warm ? 'rgba(255,236,214,' : rnd() < .6 ? 'rgba(222,228,255,' : 'rgba(255,214,240,') + ((1 - d * .65) * (loose ? .2 : .3) + rnd() * .5).toFixed(2) + ')';
      const z = rnd() < .03 ? 2.4 : rnd() < .25 ? 1.6 : 1.1; x.fillRect(Math.cos(th) * r, Math.sin(th) * r, z, z);
    }
  }
  /* una mancha de luz suave (la base de todo): x, y, radio, color, fuerza, estirado y giro */
  const blob = (x, y, r, c, a, sx, ang) => {
    if (a < .004 || r < .4) return;
    ctx.setTransform(1, 0, 0, 1, x, y); if (ang) ctx.rotate(ang); if (sx) ctx.scale(sx, 1);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, rgba(c, a)); g.addColorStop(.35, rgba(c, a * .5)); g.addColorStop(.7, rgba(c, a * .13)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r);
  };
  /* sombra: tapa un poco de luz (los huecos oscuros de las nebulosas) */
  const shade = (x, y, r, a, sx, ang) => { ctx.globalCompositeOperation = 'source-over'; blob(x, y, r, C.dark, a, sx, ang); ctx.globalCompositeOperation = 'lighter'; };
  /* una curva suave que pasa por los puntos (posición y dirección en s, de 0 a 1) */
  const curve = (P, s) => {
    const n = P.length - 1, f = Math.min(n - 1e-6, s * n), i = Math.floor(f), u = f - i;
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
    const cr = (a, b, c, d) => .5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (3 * b - a - 3 * c + d) * u * u * u);
    const dr = (a, b, c, d) => .5 * ((c - a) + 2 * (2 * a - 5 * b + 4 * c - d) * u + 3 * (3 * b - a - 3 * c + d) * u * u);
    return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1]), dr(p0[0], p1[0], p2[0], p3[0]), dr(p0[1], p1[1], p2[1], p3[1])];
  };
  const colAt = (cols, s) => { const f = s * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(f)); return mix(cols[i], cols[i + 1], f - i); };
  /* un velo: manchas estiradas a lo largo de la curva que ondula; el color cambia de punta a punta.
     off = corrido hacia un lado (para cintas de varios colores), ramp = más brillante hacia el final */
  const veil = (P, t, o) => {
    const n = o.n || 14, [r0, r1] = o.r, ramp = o.ramp || 0, ph = o.ph || 0;
    for (let i = 0; i < n; i++){
      const s = i / (n - 1), [x, y, dx, dy] = curve(P, s), l = Math.hypot(dx, dy) || 1;
      const q = ((o.off || 0) + Math.sin(s * 8.5 - t * .5 + ph) * (o.wav || 0)) * D, b = Math.sin(Math.PI * s);
      blob(x - dy / l * q, y + dx / l * q, (r0 + (r1 - r0) * b) * D, colAt(o.cols, s), o.a * (.5 + .5 * b) * (1 - ramp + ramp * s) * (.86 + .14 * Math.sin(t * .7 + s * 5 + ph)), o.sx || 1.8, Math.atan2(dy, dx));
    }
  };
  /* bocanadas de nube regadas a lo largo de una curva: le dan textura a las nebulosas */
  const puffs = (P, t, n, r, cols, a, sd, spread) => {
    for (let i = 0; i < n; i++){
      const [x, y, dx, dy] = curve(P, hr(i, sd)), l = Math.hypot(dx, dy) || 1, q = (hr(i, sd + 1) - .5) * (spread || .12) * D;
      blob(x - dy / l * q + Math.sin(t * .2 + i) * .006 * D, y + dx / l * q + Math.cos(t * .17 + i) * .006 * D, r * D * (.5 + hr(i, sd + 2)), cols[i % cols.length], a * (.5 + .5 * hr(i, sd + 3)), 1.3, hr(i, sd + 4) * 3);
    }
  };
  /* los puntos de cada curva se mecen despacio, cada uno a su ritmo */
  const pts = (arr, t, amp, ph) => arr.map(([u, v], i) => [U(u + Math.sin(t * .16 + i * 1.7 + ph) * amp), V(v + Math.cos(t * .13 + i * 2.3 + ph) * amp * .8)]);

  const SC = {
    fondo(t, a){
      const s1 = Math.sin(t * .23), s2 = Math.cos(t * .19);
      blob(U(.74), V(.4), .4 * D, C.navy, .3 * a, 1.4, -.4);
      blob(U(.46), V(.62), .42 * D, C.navy, .14 * a, 1.3, .2);
      blob(U(.79), V(.25), .11 * D, C.vio, .3 * a, 1.4, -.3);
      /* el rosa de arriba, con su centro casi blanco */
      blob(U(.6 + .01 * s1), V(.07), .13 * D, C.mag, .36 * a, 1.7, -.3);
      blob(U(.69 + .012 * s2), V(.15), .15 * D, C.S, .52 * a, 1.8, -.5);
      blob(U(.71), V(.16), .07 * D, C.hot, .46 * a, 1.6, -.4);
      /* el cian que baja por la derecha */
      blob(U(.88 + .01 * s1), V(.1), .15 * D, C.L, .5 * a, 1.5, .6);
      blob(U(.97), V(.3 + .015 * s2), .15 * D, mix(C.L, C.teal, .4), .42 * a, 1.2, 1.3);
      blob(U(.84), V(.2), .06 * D, C.ice, .3 * a, 1.4, .8);
      blob(U(.9), V(.42), .09 * D, C.ice, .16 * a, 1.2, 1.2);
      const A = pts([[.5, -.06], [.62, .08], [.74, .14], [.86, .07], [1, .16], [.98, .42], [.93, .58]], t, .02, 0);
      veil(A, t, { n:18, r:[.05, .1], cols:[C.vio, C.mag, C.S, C.hot, C.S, C.L, C.ice, C.L, C.teal], a:.32 * a, sx:1.9, wav:.014 });
      puffs(A, t, 16, .035, [C.S, C.L, C.vio, C.ice], .16 * a, 11, .16);
      /* la «V» violeta y la estela rosa de la izquierda */
      veil(pts([[-.04, .4], [.06, .5], [.13, .58], [.19, .5], [.27, .41]], t, .018, 2.1), t, { n:12, r:[.05, .08], cols:[C.P, C.vio, C.mag, C.vio, C.P], a:.42 * a, sx:1.6, wav:.008, ph:1.3 });
      veil(pts([[-.06, .6], [.04, .67], [.13, .73]], t, .016, 4.4), t, { n:8, r:[.05, .07], cols:[C.mag, C.S, C.vio], a:.32 * a, wav:.006, ph:2.7 });
      /* turquesa abajo */
      blob(U(.2), V(1.04), .32 * D, C.teal, .55 * a, 1.6, -.15);
      blob(U(.36 + .02 * Math.sin(t * .2)), V(.98), .14 * D, mix(C.teal, C.L, .5), .28 * a, 1.6, -.3);
      blob(U(.04), V(.86), .12 * D, C.vio, .22 * a, 1.2, 0);
      /* estelas finas (como cometas) y luces desenfocadas */
      veil(pts([[.41, .33], [.48, .29], [.56, .24]], t, .01, 5.2), t, { n:6, r:[.014, .02], cols:[C.navy, C.teal, C.ice], a:.3 * a, sx:2.6, wav:.002, ph:3.3 });
      veil(pts([[.32, .86], [.38, .83], [.44, .79]], t, .01, 6.1), t, { n:6, r:[.012, .018], cols:[C.navy, C.P, C.vio], a:.34 * a, sx:2.6, wav:.002, ph:4.1 });
      [[.18, .77, C.W, .007], [.27, .81, C.teal, .006], [.32, .85, C.teal, .008], [.555, .245, C.teal, .009], [.6, .52, C.W, .005], [.69, .89, C.vio, .011], [.86, .62, C.L, .006]]
        .forEach(([u, v, col, r], i) => blob(U(u + Math.sin(t * .11 + i) * .006), V(v + Math.cos(t * .09 + i * 2) * .008), r * D, col, (.55 + .3 * Math.sin(t * .8 + i * 1.9)) * a, 1, 0));
    },
    seda(t, a){
      blob(U(.86), V(.14), .34 * D, C.vio, .3 * a, 1.6, -.6);
      blob(U(.9), V(.08), .16 * D, C.rose, .3 * a, 1.6, -.6);
      /* en SynthFlow la cinta va más a la derecha, para no pasar por detrás del saludo */
      const du = home ? 0 : .14, R = pts([[.3, .86], [.46, .7], [.62, .52], [.76, .34], [.9, .17], [1.04, 0]].map(([u, v]) => [u + du, v + du * .4]), t, .016, .7);
      veil(R, t, { n:18, r:[.05, .1], cols:[C.vio, C.rose, C.rose, C.hot], a:.42 * a, sx:2, wav:.012, off:-.05, ramp:.6 });
      veil(R, t, { n:18, r:[.05, .095], cols:[C.P, C.lav, C.lav, C.lav], a:.34 * a, sx:2, wav:.012, ph:1, ramp:.5 });
      veil(R, t, { n:18, r:[.045, .09], cols:[C.navy, C.teal, C.mint, C.mint], a:.36 * a, sx:2, wav:.012, off:.06, ph:2, ramp:.4 });
      puffs(R, t, 14, .04, [C.rose, C.lav, C.mint], .12 * a, 5, .14);
      blob(U(0), V(.7), .24 * D, C.mint, .36 * a, 1.4, .5);
      blob(U(.06), V(1.02), .2 * D, C.rose, .32 * a, 1.5, -.2);
      blob(U(.02), V(.9), .14 * D, C.lav, .25 * a, 1.2, 0);
    },
    nebulosa(t, a){
      blob(U(.5), V(.45), .45 * D, C.navy, .22 * a, 2, -.35);
      const R = pts([[-.06, .64], [.12, .56], [.3, .48], [.5, .43], [.68, .37], [.84, .26], [1.04, .12]], t, .014, 2.4);
      veil(R, t, { n:22, r:[.09, .14], cols:[C.vio, C.P, C.mag, C.P, C.mag, C.vio], a:.3 * a, wav:.012 });
      veil(R, t, { n:18, r:[.04, .07], cols:[C.P, C.mag, C.S, C.mag, C.S, C.mag], a:.3 * a, sx:2, wav:.01, off:-.06, ph:1.4 });
      puffs(R, t, 40, .04, [C.P, C.mag, C.vio, C.S, C.L], .22 * a, 3, .2);
      /* hilos cian por debajo, a la derecha */
      const Q = pts([[.42, .58], [.56, .53], [.7, .55], [.84, .45], [1.02, .36]], t, .014, 3.3);
      veil(Q, t, { n:16, r:[.03, .06], cols:[C.navy, C.L, C.ice, C.L, C.teal], a:.4 * a, sx:2.2, wav:.012, ph:2 });
      puffs(Q, t, 18, .03, [C.L, C.teal, C.ice], .2 * a, 9, .1);
      veil(pts([[.66, .7], [.8, .62], [.9, .52], [1.04, .5]], t, .012, 1.1), t, { n:12, r:[.025, .045], cols:[C.navy, C.teal, C.L, C.ice], a:.34 * a, sx:2.2, wav:.01, ph:3 });
      /* a la izquierda: humo turquesa alrededor de un hueco oscuro */
      veil(pts([[-.02, .7], [.06, .62], [.15, .6], [.24, .66]], t, .012, 5), t, { n:12, r:[.035, .06], cols:[C.teal, C.mint, C.teal, C.vio], a:.3 * a, sx:2, wav:.008, ph:.8 });
      veil(pts([[0, .86], [.1, .9], [.22, .86], [.32, .8]], t, .012, 6.3), t, { n:12, r:[.03, .05], cols:[C.navy, C.teal, C.vio, C.P], a:.3 * a, sx:2.2, wav:.008, ph:1.6 });
      shade(U(.13), V(.76), .08 * D, .5 * a, 1.4, .3);
      shade(U(.26), V(.52), .06 * D, .3 * a, 2.2, -.4);
    },
    planeta(t, a){
      blob(U(.3), V(.35), .4 * D, C.navy, .2 * a, 1.8, .4);
      const R = pts([[-.04, .2], [.1, .27], [.24, .33], [.36, .4], [.5, .48], [.66, .57], [.82, .66], [1.04, .74]], t, .014, 4.1);
      veil(R, t, { n:22, r:[.08, .12], cols:[C.P, C.vio, C.S, C.L, C.vio, C.lav, C.lav, C.P], a:.3 * a, sx:1.7, wav:.014, ph:.3 });
      veil(R, t, { n:16, r:[.035, .06], cols:[C.vio, C.S, C.hot, C.ice, C.lav, C.lav], a:.28 * a, sx:2, wav:.01, off:-.05, ph:2.2 });
      puffs(R, t, 36, .038, [C.S, C.L, C.P, C.lav, C.teal], .2 * a, 7, .2);
      blob(U(.13), V(.18), .12 * D, C.P, .3 * a, 1.3, -1.2);
      blob(U(.2), V(.24), .07 * D, C.S, .26 * a, 1.4, -1.1);
      blob(U(.05), V(.46), .14 * D, C.teal, .3 * a, 1.6, .3);
      /* velos lavanda abajo a la derecha */
      const Q = pts([[.52, .76], [.68, .7], [.84, .62], [1.04, .58]], t, .012, 1.7);
      veil(Q, t, { n:14, r:[.03, .055], cols:[C.navy, C.lav, C.rose, C.lav], a:.3 * a, sx:2.4, wav:.014, ph:1.2 });
      puffs(Q, t, 14, .03, [C.lav, C.rose, C.L], .14 * a, 13, .12);
      veil(pts([[.58, .92], [.74, .84], [.9, .8], [1.04, .86]], t, .012, 2.9), t, { n:12, r:[.03, .05], cols:[C.navy, C.lav, C.L], a:.26 * a, sx:2.4, wav:.012, ph:4 });
      shade(U(.2), V(.78), .1 * D, .4 * a, 1.6, 0);
    },
    calma(t, a){
      blob(U(.82), V(.08), .26 * D, mix(C.teal, C.navy, .5), .14 * a, 1.6, .3);
      const R = pts([[.27, .31], [.43, .19], [.59, .2], [.71, .32], [.8, .48], [.87, .66], [.9, .88]], t, .012, 1.9);
      veil(R, t, { n:16, r:[.03, .055], cols:[C.navy, C.vio, C.vio, C.rose, mix(C.rose, C.teal, .5), C.teal, C.teal], a:.2 * a, sx:2.4, wav:.006, ph:.4 });
      veil(R, t, { n:12, r:[.018, .032], cols:[C.navy, C.P, C.rose, C.vio, C.mint], a:.12 * a, sx:2.6, wav:.005, off:-.022, ph:1.8 });
    }
  };
  /* portada: qué escena se ve según cuánto bajaste (se funden entre sí) */
  const SEQ = [['fondo', 0], ['seda', .3], ['nebulosa', .62], ['planeta', .95]];
  /* más abajo hay más texto encima: las escenas de abajo brillan un poco menos para que todo se lea */
  const HOME_K = { fondo:1, seda:.85, nebulosa:.7, planeta:.74 };
  let calm = 0, cFrom = 0, cTo = 0, cAt = -1e9, sp = 0, Wt = {};
  const weights = () => {
    if (!home) return { seda:1 - calm, calma:calm };
    const o = {}; const p = Math.min(1, sp);
    for (let i = 0; i < SEQ.length; i++){
      const [n, a] = SEQ[i], prev = SEQ[i - 1], next = SEQ[i + 1];
      o[n] = p <= a ? (prev ? Math.max(0, (p - prev[1]) / (a - prev[1])) : 1) : (next ? Math.max(0, (next[1] - p) / (next[1] - a)) : 1);
    }
    return o;
  };
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  /* lo que se dibuja una vez (galaxia, planeta, cúmulos, estrellas fugaces, textura) solo cambia de opacidad */
  const op = (e, v) => { if (!e) return; v = Math.round(v * 50) / 50; if (e._o === v) return; e._o = v; e.style.opacity = v; e.classList.toggle('off', v < .02); };
  const paint = now => {
    const t = now / 1000, dim = (home ? 1 : .8) * (w < h ? .68 : 1); Wt = weights();
    ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    const k = (Wt.calma || 0) * .6, g0 = ctx.createLinearGradient(0, 0, cw * .3, ch);
    g0.addColorStop(0, rgba(mix(C.top, C.dark, k), 1)); g0.addColorStop(1, rgba(mix(C.bot, C.dark, k), 1));
    ctx.fillStyle = g0; ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'lighter';
    for (const n in Wt) if (Wt[n] > .01) SC[n](t, Wt[n] * dim * (home ? HOME_K[n] : 1));
    /* viñeta: las orillas se van a la noche */
    ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    const vg = ctx.createRadialGradient(cw * .52, ch * .42, 0, cw * .52, ch * .42, Math.hypot(cw, ch) * .64);
    vg.addColorStop(.5, rgba(C.bg, 0)); vg.addColorStop(1, rgba(C.bg, .5 + .2 * (Wt.calma || 0)));
    ctx.fillStyle = vg; ctx.fillRect(0, 0, cw, ch);
    const neb = (Wt.nebulosa || 0) + (Wt.planeta || 0);
    op(gx, neb); op(pl, Wt.planeta || 0); op(cc, (Wt.nebulosa || 0) + .55 * (Wt.planeta || 0)); op(sw, neb);
  };

  /* el ciclo: ~24 cuadros por segundo (12 en el celular y mientras se conversa); a 30 solo durante la ola */
  const coarse = matchMedia('(pointer:coarse)').matches;
  const live = () => anim() && !document.hidden;
  let raf = 0, last = -1e9, dirty = true;
  const frame = now => {
    raf = 0;
    const moving = now - cAt < 1800, on = live();
    calm = moving ? cFrom + (cTo - cFrom) * ease(Math.min(1, (now - cAt) / 1700)) : cTo;
    const fps = moving ? 30 : coarse || cTo ? 12 : 24;
    /* quieto: siempre el mismo instante, y solo se repinta si algo cambió */
    if (dirty || moving || (on && now - last >= 1000 / fps - 3)){ last = now; dirty = false; paint(on ? now : 0); }
    /* v2.9: entre cuadro y cuadro duerme con un temporizador (antes despertaba 60 veces por segundo solo para mirar la hora) */
    if (moving) raf = requestAnimationFrame(frame);
    else if (on){ raf = -1; setTimeout(() => { raf = requestAnimationFrame(frame); }, Math.max(0, 1000 / fps - (performance.now() - last) - 8)); }
  };
  const go = () => { dirty = true; if (!raf) raf = requestAnimationFrame(frame); };
  recolor(); size(); paint(0); go();
  addEventListener('resize', () => { size(); go(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) go(); });
  if (home){
    const scr = () => { const m = Math.max(1, H.scrollHeight - innerHeight); sp = Math.min(1, scrollY / m); if (!live()) go(); };
    addEventListener('scroll', scr, { passive:true }); addEventListener('load', scr); scr();
  }
  /* si cambian los ajustes o el tema, se vuelve a pintar (el tema tarda ~1 s en pasar de color) */
  let rc = 0;
  new MutationObserver(() => { clearTimeout(rc); recolor(); resize(); go(); rc = setTimeout(() => { recolor(); go(); }, 950); }).observe(H, { attributes:true, attributeFilter:['class', 'data-theme'] });

  /* conversación: true = la seda se apaga en calma y sube la ola; false = la ola baja y vuelve la seda */
  const setCalm = (on, now) => {
    on = !!on; if (on === (cTo === 1)) return;
    H.classList.toggle('szconv', on);
    if (now){ cFrom = cTo = calm = on ? 1 : 0; cAt = -1e9; H.classList.add('au8-now'); requestAnimationFrame(() => requestAnimationFrame(() => H.classList.remove('au8-now'))); go(); return; }
    cFrom = calm; cTo = on ? 1 : 0; cAt = performance.now();
    el.classList.remove('sweep'); void el.offsetWidth; el.classList.add('sweep');
    clearTimeout(el._sw); el._sw = setTimeout(() => el.classList.remove('sweep'), 1900);
    go();
  };
  return { el, setCalm, repaint:() => { recolor(); go(); } };
})();
