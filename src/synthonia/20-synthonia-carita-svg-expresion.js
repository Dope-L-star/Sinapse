/* ---------- SynthonIA: su carita (SVG), con una expresión para cada momento ---------- */
const FACE_G = '#3DE0FF';   /* 2026-11-09 · Partitura: los ojos de SynthonIA son cian (antes dorados) */
/* v2.5 · SynthonIA idéntica al boceto «Cuerpo maestro» y «Expresiones»:
   casco de vidrio perlado (rosa, lila y un filo cian abajo), visor negro grande con borde rosa que brilla,
   ojos cian alargados, cuello de anillos, torso con núcleo cian, brazos por partes, base de pedestal y anillo flotante.
   Ondas: azul a la IZQUIERDA cuando escucha, naranja a la DERECHA cuando habla. */
const FACE_EYE = '#3de0ff';
(function faceDefs(){
  if (document.getElementById('szFaceDefs')) return;
  const d = document.createElement('div'); d.id = 'szFaceDefs'; d.setAttribute('aria-hidden', 'true');
  d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = '<svg width="0" height="0"><defs>'
    /* vidrio perlado: brillo blanco rosado arriba a la izquierda, rosa, lila y violeta en el borde */
    + '<radialGradient id="szPearl" cx=".46" cy=".42" r=".62"><stop offset="0" stop-color="#2b1a6e" stop-opacity=".62"/><stop offset=".58" stop-color="#4630b8" stop-opacity=".5"/><stop offset=".84" stop-color="#78c8ff" stop-opacity=".62"/><stop offset="1" stop-color="#e9fdff" stop-opacity=".95"/></radialGradient>'
    /* filo de luz cian abajo y a los lados (la luz del ambiente rebota en el vidrio) */
    + '<radialGradient id="szRimL" cx=".5" cy=".1" r="1"><stop offset=".66" stop-color="#bff6ff" stop-opacity="0"/><stop offset=".9" stop-color="#9ff0ff" stop-opacity=".5"/><stop offset="1" stop-color="#e6fdff" stop-opacity=".95"/></radialGradient>'
    /* el rosa que se ve a través del vidrio, más fuerte a la derecha */
    + '<radialGradient id="szSub" cx=".7" cy=".86" r=".7"><stop offset="0" stop-color="#5ff4ff" stop-opacity=".55"/><stop offset=".55" stop-color="#ff3d9a" stop-opacity=".16"/><stop offset="1" stop-color="#ff3d9a" stop-opacity="0"/></radialGradient>'
    + '<radialGradient id="szVisor" cx=".42" cy=".32" r=".8"><stop offset="0" stop-color="#1d1236"/><stop offset=".55" stop-color="#0b0719"/><stop offset="1" stop-color="#030209"/></radialGradient>'
    /* v2.7 · vidrio de las manitas: casi transparente, filo de luz cian, borde iridiscente con los colores de la marca */
    + '<radialGradient id="sgGlass" cx=".42" cy=".34" r=".78"><stop offset="0" stop-color="#2a2840" stop-opacity=".45"/><stop offset=".6" stop-color="#0d0c16" stop-opacity=".7"/><stop offset=".86" stop-color="#3d6fa0" stop-opacity=".45"/><stop offset="1" stop-color="#bff6ff" stop-opacity=".85"/></radialGradient>'
    + '<radialGradient id="sgCaus" cx=".5" cy=".96" r=".62"><stop offset="0" stop-color="#3DE0FF" stop-opacity=".55"/><stop offset=".5" stop-color="#7B3FF2" stop-opacity=".2"/><stop offset="1" stop-color="#7B3FF2" stop-opacity="0"/></radialGradient>'
    + '<linearGradient id="sgIri" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6fdff"/><stop offset=".3" stop-color="#3DE0FF"/><stop offset=".68" stop-color="#7B3FF2"/><stop offset="1" stop-color="#FF3D9A"/></linearGradient>'
    + '<linearGradient id="sgArm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e6fdff" stop-opacity=".9"/><stop offset=".22" stop-color="#2a3a5a" stop-opacity=".55"/><stop offset=".55" stop-color="#0d0c16" stop-opacity=".7"/><stop offset=".82" stop-color="#3DE0FF" stop-opacity=".45"/><stop offset="1" stop-color="#ffffff" stop-opacity=".85"/></linearGradient>'
    + '<radialGradient id="sgHalo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffc857" stop-opacity=".5"/><stop offset=".55" stop-color="#ff3d9a" stop-opacity=".16"/><stop offset="1" stop-color="#ff3d9a" stop-opacity="0"/></radialGradient>'
    /* 2026-11-09 · Partitura: la bola negra de vidrio de SynthonIA (brillo arriba a la izquierda, filo cian abajo) */
    + '<radialGradient id="szBall" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#3a3550"/><stop offset=".45" stop-color="#16141f"/><stop offset="1" stop-color="#07060c"/></radialGradient>'
    + '<radialGradient id="szBallRim" cx=".5" cy=".18" r=".95"><stop offset=".72" stop-color="#3DE0FF" stop-opacity="0"/><stop offset=".93" stop-color="#3DE0FF" stop-opacity=".35"/><stop offset="1" stop-color="#bff6ff" stop-opacity=".7"/></radialGradient>'
    + '<filter id="szEye" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    + '<filter id="szBlur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>'
    + '<filter id="szBlur1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>'
    + '</defs></svg>';
  (document.body || document.documentElement).appendChild(d);
})();
/* ---------- v2.8 · SynthonIA vuelve a ser la de main (pedido de Sammuel, 27 oct) ----------
   Cabeza cuadradita oscura con filo dorado, antena y orejas rosadas, pantalla negra con ojos, boca y cachetes dorados.
   Todas las caras de main siguen igual; las nuevas (escuchando, analizando, creando, hablando, error) usan el mismo dibujo.
   v2.9: sin cuerpo; solo la cabecita y dos manitas que flotan (más abajo), con detalles que se mueven (engranes, foco, escáner, ondas). */
const FFX_C = '#f6d9a0';
const FFX = {
  bulb:'<g class="fx"><circle cx="90" cy="12" r="6.5" fill="#ffd36a"/><rect x="87.5" y="18" width="5" height="4" rx="1" fill="#e9b04a"/><path d="M78 6l2 4M98 4l-2 4M100 14h-3" stroke="#ffd36a" stroke-width="1.6" stroke-linecap="round"/></g>',
  scan:'<g class="fx fscan" stroke="' + FFX_C + '" stroke-opacity=".28" stroke-width=".8"><path d="M24 40h52M23 48h54M23 56h54M23 64h54M24 72h52"/></g><g class="fx" stroke="' + FFX_C + '" stroke-width="1.8" fill="none" opacity=".9"><path d="M4 18V8h10M86 8h10v10M96 86v10H86M14 96H4V86"/></g>',
  glitch:'<g class="fx fglitch"><rect x="8" y="40" width="14" height="3" fill="#ff5fb4" opacity=".7"/><rect x="78" y="62" width="16" height="3" fill="#3de0ff" opacity=".7"/><rect x="70" y="30" width="8" height="2" fill="#fff" opacity=".5"/></g>'
};
const FACE = (() => {
  const open = (dx, dy) => ['M' + (40 + dx) + ' ' + (48 + dy) + 'v8', 'M' + (60 + dx) + ' ' + (48 + dy) + 'v8'];
  const happy = ['M35 54q5-7 10 0', 'M55 54q5-7 10 0'];
  const heart = x => 'M' + x + ' 58l-5.5-5.5a3.2 3.2 0 0 1 5.5-4a3.2 3.2 0 0 1 5.5 4z';
  const star = x => 'M' + x + ' 45l1.8 3.8 4 .5-3 2.8.8 4-3.6-2-3.6 2 .8-4-3-2.8 4-.5z';
  const ring = x => 'M' + (x - 4.5) + ' 52a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0';
  return {
    feliz:{ e:open(0, 0), m:'M42 64q8 7 16 0', ck:1 },
    neutral:{ e:open(0, 0), m:'M45 66h10' },
    encantada:{ e:[heart(40), heart(60)], ew:1.6, ef:FACE_G, m:'M41 63q9 10 18 0z', mf:1, ck:1 },
    riendo:{ e:happy, m:'M41 62q9 11 18 0z', mf:1, ck:1 },
    guino:{ e:['M40 48v8', 'M55 54q5-7 10 0'], m:'M42 64q8 7 16 0', ck:1 },
    pensando:{ e:open(3, -3), m:'M45 67q5-3 10-1', x:'M84 26h.1M91 16h.1', xw:5 },
    sorprendida:{ e:[ring(40), ring(60)], ew:3, ef:FACE_G, m:'M47 68a3 3 0 1 0 6 0a3 3 0 1 0-6 0', b:'M34 41l10-1M56 40l10 1' },
    senalando:{ e:open(4, 0), m:'M46 65q6 4 12 0' },
    disculpa:{ e:['M40 51v6', 'M60 51v6'], b:'M34 46l10-4M66 46l-10-4', m:'M43 69q7-6 14 0' },
    confundida:{ e:['M40 48v8', 'M60 51v3'], b:'M54 42l12-3', m:'M41 67q3-3 6 0t6 0t6 0' },
    dormida:{ e:['M35 52q5 4 10 0', 'M55 52q5 4 10 0'], ew:3.4, m:'M47 67h6', x:'M73 15h8l-8 9h8' },
    celebrando:{ e:[star(40), star(60)], ew:1.5, ef:FACE_G, m:'M41 62q9 11 18 0z', mf:1, ck:1, x:'M10 16l4 4M90 14l-4 5M6 32h5M94 30h-5', xw:2.6 },
    esperando:{ e:open(-3, -2), m:'M45 66h10', x:'M84 14a6 6 0 1 0 .01 0M84 11v3.5l2.5 2', xw:2 },
    flow:{ glasses:1, m:'M43 65q8 6 16-1', ck:1 },
    preocupada:{ e:open(0, 2), b:'M33 45l11-5M67 45l-11-5', m:'M42 70q4-4 8-1t8-1', drop:1 },
    triste:{ e:['M40 53v4', 'M60 53v4'], ew:6, b:'M32 47l11-5M68 47l-11-5', m:'M41 72q9-8 18 0' },
    auch:{ e:['M34 49l10 4-10 4', 'M55 53q5-4 10 0'], ew:3.4, b:'M32 43l12 5M57 45l10-3', m:'M41 70q4.5-4 9 0q4.5 4 9 0', x:'M78 30l4-6M84 36l6-2' },
    /* las de la v2.4 en adelante, con el dibujo de main: escucha mirando a un lado (ondas azules), analiza con ojos de barra
       y su escáner, crea con el foco encendido, habla con la boca abierta (ondas naranjas), y se «cuelga» cuando hay un error */
    escuchando:{ e:open(-4, -1), m:'M46 66h8', w:'l' },
    analizando:{ e:['M34 52h12', 'M54 52h12'], ew:5, m:'M45 66h10', fx:'scan' },
    creando:{ e:open(0, -2), m:'M42 64q8 7 16 0', ck:1, fx:'bulb' },
    hablando:{ e:open(0, 0), m:'M42 61.5q8-2 16 0q-1 9-8 9q-7 0-8-9z', mf:1, ck:1, w:'r' },
    error:{ e:['M35 47l10 10M45 47l-10 10', 'M55 47l10 10M65 47l-10 10'], ew:3.6, m:'M41 68q4.5-4 9 0q4.5 4 9 0', fx:'glitch' }
  };
})();
FACE.descansando = FACE.dormida;
const FACE_GOOD = ['feliz', 'riendo', 'guino', 'encantada', 'celebrando', 'flow'];
/* la cabeza de main (lo mismo en la bolita, los botones y el cuerpo entero) */
function headSvg(f){
  const G = FACE_G, P = (d, st) => d ? '<path d="' + d + '" ' + st + '/>' : '';
  const eyes = f.glasses
    ? '<path d="M27 45h20v6.5a7 7 0 0 1-7 7h-6a7 7 0 0 1-7-7z" fill="#07070a" stroke="#3DE0FF" stroke-width="2.2"/><path d="M53 45h20v6.5a7 7 0 0 1-7 7h-6a7 7 0 0 1-7-7z" fill="#07070a" stroke="#3DE0FF" stroke-width="2.2"/><path d="M47 47.5q3-2.5 6 0" stroke="#3DE0FF" stroke-width="2.2" fill="none"/><path d="M31 49l5-3M57 49l5-3" stroke="rgba(255,255,255,.55)" stroke-width="1.6" stroke-linecap="round"/>'
    : f.e.map(d => P(d, 'stroke="' + (f.ec || G) + '" stroke-width="' + (f.ew || 7) + '" stroke-linecap="round" stroke-linejoin="round" fill="' + (f.ef || 'none') + '"')).join('');
  /* 2026-11-09 · Partitura (Sammuel: «me encanta la nueva SynthonIA, la bola negra con ojos azules»): una bola de vidrio negro,
     brillo arriba, filo cian abajo y la cara en luz cian. Las expresiones son las mismas de siempre.
     Sammuel, 9 nov: «que no tenga boca ni cachetitos ni esa cosa roja, como en el boceto»: solo ojos (y cejas cuando la cara las pide).
     Cuando habla, lo dicen las ondas naranjas que laten con cada sílaba; ya no se dibuja boca ni lengua. */
  return '<ellipse cx="50" cy="93" rx="26" ry="3.5" fill="#3DE0FF" opacity=".14"/>'
    + '<circle cx="50" cy="52" r="40" fill="url(#szBall)" stroke="rgba(255,255,255,.16)" stroke-width="1"/><circle cx="50" cy="52" r="40" fill="url(#szBallRim)"/>'
    + '<ellipse cx="36" cy="27" rx="14" ry="7" transform="rotate(-28 36 27)" fill="#fff" opacity=".14"/><circle cx="28" cy="34" r="2.2" fill="#fff" opacity=".35"/>'
    + P(f.b, 'stroke="' + G + '" stroke-width="2.6" stroke-linecap="round" fill="none"')
    + '<g class="fe" filter="url(#szEye)">' + eyes + '</g>'
    + P(f.x, 'class="fx" stroke="#e6b65f" stroke-width="' + (f.xw || 2.4) + '" stroke-linecap="round" stroke-linejoin="round" fill="none"')
    + (f.drop ? '<path class="fdrop" d="M83 28q-6 9-1 12.5q6 2.5 7-3.5q0-3-6-9z" fill="#8fd3e8" fill-opacity=".9"/>' : '')
    + (f.fx ? FFX[f.fx] : '');
}
/* ondas de voz: naranja a la DERECHA cuando habla, azul a la IZQUIERDA cuando escucha (por fuera de las orejas) */
function wavesSvg(){
  const W = (x, dir, c, k) => '<g class="' + k + '" stroke="' + c + '" stroke-width="3" stroke-linecap="round" fill="none">'
    + [4.5, 9.5, 14.5].map((r, i) => '<path style="--i:' + i + '" d="M' + x + ' ' + (55 - r) + 'a' + r + ' ' + r + ' 0 0 ' + (dir > 0 ? 1 : 0) + ' 0 ' + (2 * r) + '"/>').join('') + '</g>';
  return W(97, 1, '#ff8a3d', 'fwr') + W(3, -1, '#3de0ff', 'fwl');
}
function face(mood, size, cls){
  const m = FACE[mood] ? mood : 'feliz', f = FACE[m], z = size || 40;
  return '<svg class="szface' + (cls ? ' ' + cls : '') + (f.w ? ' w' + f.w : '') + '" data-mood="' + m + '" viewBox="0 0 100 100" width="' + z + '" height="' + z + '" aria-hidden="true">'
    + wavesSvg() + headSvg(f) + '</svg>';
}
/* ---------- v2.9 · SynthonIA es su cabecita y dos manitas que flotan cerca (sin cuerpo; pedido de Sammuel, 27 oct) ----------
   La cabeza es la de main, grande y al centro, con todas sus caras. Las manos van sueltas a los lados (nunca pegadas)
   y cada una flota a su propio ritmo. Cada pose dice dónde va cada mano: [x, y, giro, gesto]; la derecha se escribe
   como si fuera la izquierda (va en espejo), así las poses quedan parejas. Alrededor: chispitas, una sombra que
   respira cuando sube y baja, y un detalle según la cara (corazones, confeti, zzz, burbujas, «!», notas).
   Todo en SVG, se mueve en vivo y se pausa cuando no se ve. Escenario 300 × 400 (3:4). */
const SG_IDLE = [40, 280, 8, 'open'];
const SPOSE = {
  idle:     { L:SG_IDLE, R:SG_IDLE },
  saluda:   { L:SG_IDLE, R:[18, 148, 165, 'wave'], wave:'r' },
  senala:   { L:SG_IDLE, R:[34, 206, 90, 'point'] },   /* v3.7 · más adentro: el índice ya no se corta en el borde */
  senalaL:  { L:[34, 206, 90, 'point'], R:SG_IDLE },
  celebra:  { L:[22, 130, 158, 'wave'], R:[22, 130, 158, 'wave'] },
  piensa:   { L:SG_IDLE, R:[126, 320, 176, 'point'] },   /* v3.7 · el índice toca la barbilla (antes quedaba lejos, abajo) */
  escucha:  { L:SG_IDLE, R:[14, 172, 150, 'open'] },
  presenta: { L:SG_IDLE, R:[12, 250, 66, 'wave'] },
  sorpresa: { L:[26, 188, 168, 'wave'], R:[26, 188, 168, 'wave'] },
  escribe:  { L:[104, 308, -4, 'open'], R:[104, 308, -4, 'open'] },
  lee:      { L:[90, 306, -34, 'open'], R:[90, 306, -34, 'open'] }
};
/* una pieza de vidrio: relleno casi transparente, luz que se junta abajo, borde iridiscente y filo blanco */
const sgPiece = (d, rim) => '<path d="' + d + '" fill="url(#sgGlass)"/><path d="' + d + '" fill="url(#sgCaus)"/>'
  + '<path d="' + d + '" fill="none" stroke="url(#sgIri)" stroke-width="' + (rim || 1.6) + '" stroke-opacity=".85"/><path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width=".7"/>';
/* v3.7 · el pulgar nace a media palma (antes salía pegado a la muñeca y se veía raro) y en «point» los dedos se doblan de verdad.
   v2.9 · manos de verdad: palma de vidrio, tres dedos con nudillos y pulgar (antes era una manopla).
   Cada dedo: [x de la base, giro, doblez de la punta, largo 1, largo 2]; el pulgar además dice dónde nace.
   open = relajada, wave = abierta para saludar o celebrar, point = puño con el índice estirado */
const SG_HANDS = {
  open:  { f:[[-7, 9, 6, 8, 6.5], [0, 0, 4, 8.8, 7], [7, -7, 4, 8.4, 6.8]], t:[9.4, 11.5, -40, 16, 6.6, 5.4] },
  wave:  { f:[[-7, 22, -4, 8, 6.5], [0, 4, 0, 9, 7], [7, -14, 2, 8.6, 6.8]], t:[9.4, 11, -54, 12, 7.2, 5.6] },
  /* índice estirado y los otros dos doblados hacia la palma (se ven los nudillos, no palitos sueltos); el pulgar los cruza */
  point: { f:[[-7, 4, 178, 3, 3.8], [0, 1, 178, 3.2, 4], [7, -3, 0, 9.6, 8]], t:[8.6, 13.2, 64, 22, 6, 4.6] }
};
const sgSeg = (L, w) => '<rect x="' + (-w / 2) + '" y="0" width="' + w + '" height="' + L + '" rx="' + (w / 2) + '" fill="url(#sgArm)" stroke="url(#sgIri)" stroke-width=".9"/>';
const sgKnuckle = (y, r) => '<circle cy="' + y + '" r="' + r + '" fill="#c9566c" stroke="#e6b65f" stroke-opacity=".8" stroke-width=".6"/>';
const sgFinger = ([x, a, c, L1, L2], y0, w) => '<g transform="translate(' + x + ' ' + y0 + ') rotate(' + a + ')">' + sgSeg(L1 + w / 2, w)
  + (L2 ? '<g transform="translate(0 ' + L1 + ') rotate(' + c + ')">' + sgSeg(L2, w - .5) + '<circle cx="-.8" cy="' + (L2 - 2.2) + '" r=".9" fill="#fff" opacity=".7"/></g>' + sgKnuckle(L1, 1.7) : '') + '</g>';
function sgHand(kind){
  const H = SG_HANDS[kind] || SG_HANDS.open, [tx, ty, ta, tc, t1, t2] = H.t;
  return sgFinger([tx, ta, tc, t1, t2], ty, 6.4)
    + H.f.map(f => sgFinger(f, 17.5, 6.2)).join('')
    + sgPiece('M-8 1h16q3 0 3 3v9q0 6-6 6.5h-10q-6-.5-6-6.5v-9q0-3 3-3z', 1.1)
    + '<path d="M-6.5 4.5q4-2 9-1" stroke="#fff" stroke-opacity=".75" stroke-width="1.4" stroke-linecap="round" fill="none"/>'
    + '<ellipse cx="0" cy="1" rx="8.5" ry="2.6" fill="#c9566c" stroke="#e6b65f" stroke-opacity=".8" stroke-width=".8"/>';
}
/* una mano suelta: posición de la pose → flotar → gesto (saludar, teclear…) → el dibujo. La derecha va en espejo.
   v3.0: el dibujo va volteado (-1.95) para que se vea la palma: el pulgar queda hacia su cara al saludar y hacia afuera
   con la mano abajo, como una mano de verdad (antes salían al revés, pedido de Sammuel) */
const sgMano = (side, kind) => '<g class="syb-mano ' + side + '"' + (side === 'hr' ? ' transform="matrix(-1 0 0 1 300 0)"' : '') + '>'
  + '<g class="syb-hp"><g class="syb-bob"><g class="syb-wv"><g class="syb-hand" transform="scale(-1.95 1.95)">' + sgHand(kind) + '</g></g></g></g></g>';
const sgVars = P => '--lx:' + P.L[0] + 'px;--ly:' + P.L[1] + 'px;--lr:' + P.L[2] + 'deg;--rx:' + P.R[0] + 'px;--ry:' + P.R[1] + 'px;--rr:' + P.R[2] + 'deg';
/* chispitas que titilan alrededor (siempre) */
const sgStar = (x, y, s, d) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path class="syb-sp" style="--d:' + d + 's" d="M0-6L1.3-1.3 6 0 1.3 1.3 0 6-1.3 1.3-6 0-1.3-1.3z"/></g>';
const SG_SPARKS = sgStar(36, 112, 1.1, 0) + sgStar(266, 86, 1.4, -1.1) + sgStar(278, 214, .8, -2) + sgStar(22, 206, .9, -.6) + sgStar(214, 44, .7, -1.6) + sgStar(92, 40, .9, -2.4);
/* el detalle de cada cara: sube, cae o late encima de la cabeza */
const sgUp = (x, y, d, dx, inner) => '<g transform="translate(' + x + ' ' + y + ')"><g class="syb-f" style="--d:' + d + 's;--dx:' + dx + 'px">' + inner + '</g></g>';
const SG_HEART = '<path d="M0 6l-7-7a4 4 0 0 1 7-5a4 4 0 0 1 7 5z" fill="#ef7f93" stroke="#ffd1dc" stroke-width="1"/>';
const SG_NOTE = '<path d="M0 0v-16l11-4v16" stroke="#f6d9a0" stroke-width="2.4" fill="none" stroke-linejoin="round"/><ellipse cx="-3" cy="0" rx="4" ry="3.2" fill="#f6d9a0"/><ellipse cx="8" cy="-4" rx="4" ry="3.2" fill="#f6d9a0"/>';
const SG_Z = s => '<path d="M' + (-5 * s) + ' ' + (-5 * s) + 'h' + 10 * s + 'l' + (-10 * s) + ' ' + 10 * s + 'h' + 10 * s + '" stroke="#bfe9ff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
const SG_CONF = ['#ff3d9a', '#3de0ff', '#ffc857', '#9b7bff', '#f6d9a0', '#ff7a45'];
const SG_FX = {
  love:  sgUp(58, 128, 0, -16, SG_HEART) + sgUp(244, 110, -.9, 14, SG_HEART) + sgUp(262, 176, -1.8, 20, SG_HEART) + sgUp(40, 190, -2.4, -12, SG_HEART),
  music: sgUp(250, 120, 0, 18, SG_NOTE) + sgUp(46, 150, -1.3, -16, SG_NOTE),
  zzz:   sgUp(236, 96, 0, 22, SG_Z(1)) + sgUp(236, 96, -1, 26, SG_Z(1.4)) + sgUp(236, 96, -2, 30, SG_Z(.8)),
  think: '<g class="syb-tb"><circle cx="236" cy="96" r="4.5"/><circle cx="252" cy="74" r="7"/><circle cx="272" cy="46" r="10.5"/></g>',
  wow:   '<g transform="translate(262 70)"><g class="syb-wow"><rect x="-4.5" y="-24" width="9" height="26" rx="4.5" fill="#ffc857"/><circle cy="12" r="5" fill="#ffc857"/><path d="M-16-18l-6-6M16-18l6-6M-19 0h-8M19 0h8" stroke="#f6d9a0" stroke-width="2.4" stroke-linecap="round"/></g></g>',
  party: Array.from({ length:14 }, (_, i) => '<g transform="translate(' + (34 + i * 17.5) + ' ' + (36 + (i * 37) % 50) + ')"><rect class="syb-cf" style="--d:' + (-(i * .29) % 2).toFixed(2) + 's;--dx:' + ((i % 2 ? 1 : -1) * (6 + i % 4 * 5)) + 'px" x="-3" y="-5" width="6" height="10" rx="1.5" fill="' + SG_CONF[i % 6] + '"/></g>').join('')
};
const SG_MOODFX = { encantada:'love', flow:'music', dormida:'zzz', descansando:'zzz', pensando:'think', confundida:'think', sorprendida:'wow', celebrando:'party' };
const sgFx = (m, p) => SG_FX[p === 'celebra' ? 'party' : SG_MOODFX[m]] || '';
function synHead(mood){
  const m = FACE[mood] ? mood : 'feliz', f = FACE[m];
  return '<svg class="szface syb-hsvg' + (f.w ? ' w' + f.w : '') + '" data-mood="' + m + '" x="30" y="44" width="240" height="240" viewBox="0 0 100 100" overflow="visible">'
    + wavesSvg() + headSvg(f) + '</svg>';
}
function synBody(mood, pose, size){
  const m = FACE[mood] ? mood : 'feliz', p = SPOSE[pose] ? pose : 'idle', P = SPOSE[p];
  return '<div class="szbody" data-mood="' + m + '" data-pose="' + p + '"' + (P.wave ? ' data-wave="' + P.wave + '"' : '') + ' style="' + sgVars(P) + (size ? ';--sz:' + size + 'px' : '') + '" aria-hidden="true">'
    + '<i class="syb-glow"></i>'
    + '<svg class="syb-svg" viewBox="0 0 300 400" overflow="visible" aria-hidden="true">'
    /* la sombrita de luz en el piso: se achica cuando ella sube */
    + '<ellipse class="syb-shadow" cx="150" cy="370" rx="80" ry="12" fill="url(#sgHalo)"/>'
    + '<g class="syb-sparks">' + SG_SPARKS + '</g>'
    + '<g class="syb-up"><g class="syb-head"><g class="syb-hd">' + synHead(m) + '</g></g></g>'
    + sgMano('hl', P.L[3]) + sgMano('hr', P.R[3])
    + '<g class="syb-fx">' + sgFx(m, p) + '</g>'
    + '</svg></div>';
}
/* las animaciones de SynthonIA se pausan cuando no está en pantalla (cero trabajo de más) */
const synIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('syb-off', !e.isIntersecting)), { rootMargin:'80px' }) : null;
function synWatch(host){ if (!synIO || !host) return; host.querySelectorAll('.szbody').forEach(b => { if (!b._sw){ b._sw = 1; synIO.observe(b); } }); }
if (synIO) new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1){ if (n.classList.contains('szbody')){ if (!n._sw){ n._sw = 1; synIO.observe(n); } } else if (n.querySelector) synWatch(n); } }))).observe(document.documentElement, { childList:true, subtree:true });
/* cambia la cara y la pose de una SynthonIA que ya está en pantalla (las manos vuelan suave a su lugar); si no hay, la dibuja */
function synSet(host, mood, pose, size){
  const b = host && host.querySelector('.szbody'); if (!host) return;
  if (!b){ host.innerHTML = synBody(mood, pose, size); return; }
  const m = FACE[mood] ? mood : 'feliz', p = SPOSE[pose] ? pose : 'idle', P = SPOSE[p];
  const fx0 = sgFx(b.dataset.mood, b.dataset.pose), fx1 = sgFx(m, p);
  if (b.dataset.mood !== m){ b.querySelector('.syb-hd').innerHTML = synHead(m); b.dataset.mood = m; }
  if (b.dataset.pose !== p){
    const was = SPOSE[b.dataset.pose] || SPOSE.idle;
    b.dataset.pose = p; if (P.wave) b.dataset.wave = P.wave; else delete b.dataset.wave;
    sgVars(P).split(';').forEach(kv => { const [k, v] = kv.split(':'); b.style.setProperty(k, v); });
    /* las manos cambian de gesto solo si hace falta */
    b.querySelectorAll('.syb-hand').forEach((hd, i) => { const k = i ? 'R' : 'L'; if (was[k][3] !== P[k][3]) hd.innerHTML = sgHand(P[k][3]); });
  }
  if (fx0 !== fx1) b.querySelector('.syb-fx').innerHTML = fx1;
  if (size) b.style.setProperty('--sz', size + 'px');
}
/* v1.9 · SynthonIA mueve la boca con cada letra que dice: a (abierta), e/i (ancha), o/u (redonda), m/b/p (cerrada) */
const VIS = { a:['M42 61.5q8-2 16 0q-1 9-8 9q-7 0-8-9z', 1], e:['M40.5 62.5q9.5-1.5 19 0q-2 5.5-9.5 5.5q-7.5 0-9.5-5.5z', 1], o:['M45.5 60.5q4.5-2 9 0q2.5 4.5 0 9q-4.5 2-9 0q-2.5-4.5 0-9z', 1], m:['M43 65h14', 0], c:['M42.5 63q7.5 4.5 15 0', 0] };
function visOf(ch){ const c = String(ch || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); return c === 'a' ? 'a' : (c === 'e' || c === 'i' || c === 'y') ? 'e' : (c === 'o' || c === 'u') ? 'o' : 'mbpfv'.includes(c) && c ? 'm' : /[a-zñ0-9]/.test(c) ? 'c' : 'm'; }
function mouthSet(svgs, v){
  svgs.forEach(s => { const m = s && s.querySelector && s.querySelector('.fm'); if (!m) return;
    if (m._d0 == null){ m._d0 = m.getAttribute('d'); m._f0 = m.getAttribute('fill'); }
    if (v === null){ m.setAttribute('d', m._d0); m.setAttribute('fill', m._f0); return; }
    m.setAttribute('d', VIS[v][0]); m.setAttribute('fill', VIS[v][1] ? FACE_G : 'none'); });
}
/* v2.2 · habla de verdad: la frase se parte en sílabas y la boca las «dice» a ritmo de voz (≈7 por segundo),
   con la forma de cada vocal (a abierta, e/i ancha, o/u redonda), labios cerrados en m/b/p y paso suave entre una y otra.
   Devuelve el «onFrame» para typeIn: arranca al primer cuadro y termina poco después de que se escribe todo. */
const MOUTH = { a:[7.2, 6.4], e:[9, 3.6], i:[8.4, 2.8], o:[4.8, 5.6], u:[3.8, 4.4], m:[7, .5], f:[6.4, 1.6], c:[6, 2.4], r:[5.4, 0] };
function syllables(text){
  const t = String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zñ\s]/g, ' ');
  const out = [];
  for (const w of t.split(/\s+/).filter(Boolean)){
    const parts = w.match(/[^aeiou]*[aeiou]+/g) || [w];
    for (const s of parts){
      const v = (s.match(/[aeiou]/) || ['a'])[0], c = s.replace(/[aeiou]+$/, '').slice(-1);
      if (c && 'mbp'.includes(c)) out.push('m'); else if (c && 'fv'.includes(c)) out.push('f');
      out.push(v);
    }
    out.push('r');                                   /* respiro entre palabras */
  }
  return out;
}
function talkEls(svg){
  if (svg._talk) return svg._talk;
  const NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'ftalk');
  const mo = document.createElementNS(NS, 'ellipse'), tg = document.createElementNS(NS, 'ellipse');
  mo.setAttribute('cx', '50'); mo.setAttribute('cy', '65'); mo.setAttribute('fill', '#2a0d18'); mo.setAttribute('stroke', FACE_G); mo.setAttribute('stroke-width', '3');
  tg.setAttribute('cx', '50'); tg.setAttribute('fill', '#e07a93');
  g.appendChild(mo); g.appendChild(tg);   /* 2026-11-09 · sin boca: la boca y la lengua ya no se ponen en la cara; solo laten las ondas */
  return (svg._talk = { g, mo, tg, w:svg.querySelector('.fwr') });
}
function lipSync(svgs, text){
  svgs = (svgs || []).filter(Boolean); if (!svgs.length || reduce) return undefined;
  const seq = syllables(text); if (!seq.length) return undefined;
  let raf = 0, t0 = 0, doneAt = 0, rx = 6, ry = 0, i = 0;
  const fm = svg => svg.querySelector('.fm');
  const L = svgs.map(el => ({ el, ball:!!(el.closest && el.closest('#szBot')) }));
  const live = () => L.map(o => { if (!o.el.isConnected && o.ball) o.el = ballFace() || o.el; return o.el; }).filter(e => e.isConnected);
  /* la boca de main dice cada sílaba; las ondas naranjas laten con ella */
  const paint = () => live().forEach(svg => { const T = talkEls(svg), m = fm(svg);
    if (m) m.style.opacity = '0';
    T.mo.setAttribute('rx', rx.toFixed(2)); T.mo.setAttribute('ry', Math.max(.4, ry).toFixed(2));
    T.tg.setAttribute('rx', (rx * .55).toFixed(2)); T.tg.setAttribute('ry', Math.max(0, ry * .32).toFixed(2)); T.tg.setAttribute('cy', (65 + ry * .55).toFixed(2));
    T.g.style.opacity = '1'; svg.classList.add('talking'); if (T.w) T.w.style.setProperty('--amp', Math.min(1, ry / 6).toFixed(2)); });
  const stop = () => { cancelAnimationFrame(raf); raf = 0; L.map(o => o.el).forEach(svg => { const T = svg._talk, m = fm(svg); svg.classList.remove('talking'); if (T){ T.g.style.opacity = '0'; if (T.w) T.w.style.removeProperty('--amp'); } if (m) m.style.opacity = ''; }); };
  const SYL = 140;                                    /* ms por sílaba: ritmo de voz */
  function loop(now){
    if (!t0) t0 = now;
    i = Math.floor((now - t0) / SYL);
    const ending = doneAt && (now - doneAt > 1100 || i >= seq.length);
    const v = ending ? 'r' : seq[Math.min(i, seq.length - 1)], tgt = MOUTH[v] || MOUTH.c;
    const ph = ((now - t0) % SYL) / SYL, open = v === 'r' || v === 'm' ? 1 : Math.sin(Math.min(1, ph * 1.6) * Math.PI) * .35 + .75;
    rx += (tgt[0] - rx) * .35; ry += (tgt[1] * open - ry) * .38;
    paint();
    if (ending && ry < .6){ stop(); return; }
    raf = requestAnimationFrame(loop);
  }
  return k => {
    if (!raf && !doneAt) raf = requestAnimationFrame(loop);
    if (k >= 1 && !doneAt) doneAt = performance.now();
  };
}
const ballFace = () => { const b = document.getElementById('szBot'); return b ? (b.querySelector('.bf > :last-child .szface') || b.querySelector('.bf .szface')) : null; };
const randomGoodFace = (not) => { const L = FACE_GOOD.filter(m => !(not && not.has && not.has(m))); return L[Math.floor(Math.random() * L.length)] || 'feliz'; };

/* ---------- sonidos SymphorIA: sintetizados en vivo (Web Audio), sin archivos; se apagan en Ajustes ---------- */
const SND = (() => {
  let ac = null, out = null, noiseBuf = null, armed = false;
  const on = () => CFG.sound !== false;
  function ctx(){
    if (!ac){
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
      try{ ac = new A(); }catch(e){ return null; }
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
      out = ac.createGain(); out.gain.value = .5; out.connect(comp); comp.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }
  /* el navegador solo deja sonar después de un toque o una tecla */
  const arm = () => { armed = true; if (on()) ctx(); };
  ['pointerdown', 'keydown', 'touchend'].forEach(ev => addEventListener(ev, arm, { once:true, passive:true, capture:true }));
  const noise = c => { if (!noiseBuf){ noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } const s = c.createBufferSource(); s.buffer = noiseBuf; return s; };
  const amp = (c, t, a, peak, d) => { const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); return g; };
  const play = fn => { if (!on() || !armed) return; const c = ctx(); if (!c) return; try{ fn(c, c.currentTime + .01); }catch(e){} };
  const tone = (c, t, type, f0, f1, a, peak, d, dest) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + a + d); const g = amp(c, t, a, peak, d); o.connect(g); g.connect(dest || out); o.start(t); o.stop(t + a + d + .05); return o; };
  const hiss = (c, t, kind, f, q, a, peak, d, f2) => { const s = noise(c), b = c.createBiquadFilter(); b.type = kind; b.frequency.setValueAtTime(f, t); if (f2) b.frequency.exponentialRampToValueAtTime(f2, t + a + d); b.Q.value = q; const g = amp(c, t, a, peak, d); s.connect(b); b.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + a + d + .05); };
  let lastKey = 0;
  return {
    /* tecla mecánica «brown»: golpe táctil suave y un «thock» grave */
    key(){ const now = performance.now(); if (now - lastKey < 28) return; lastKey = now; play((c, t) => { const v = Math.random(); hiss(c, t, 'bandpass', 1700 + v * 700, 1.1, .002, .28, .03); tone(c, t, 'triangle', 150 + v * 35, 85, .002, .22, .06); hiss(c, t + .018, 'highpass', 4200, .7, .001, .08, .012); }); },
    /* destello de Flow: campanita brillante, aguda, sin voz */
    flow(){ play((c, t) => { [[1568, .16], [2349, .1], [3136, .06], [4186, .035]].forEach(([f, p], i) => tone(c, t + i * .035, 'sine', f, f * 1.003, .008, p, 1.3 - i * .18)); hiss(c, t, 'highpass', 7000, .5, .02, .045, .5); }); },
    /* papel que se desliza (cuando «Synth» se esconde detrás de «Flow») */
    paper(){ play((c, t) => { hiss(c, t, 'bandpass', 650, .8, .07, .2, .32, 2800); hiss(c, t + .05, 'highpass', 3000, .5, .05, .05, .25); }); },
    /* «woauu» al entrar en la «o», y el golpe al llegar */
    woauu(){ play((c, t) => {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(330, t + .3); o.frequency.exponentialRampToValueAtTime(240, t + .62);
      const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 5; f1.frequency.setValueAtTime(420, t); f1.frequency.exponentialRampToValueAtTime(820, t + .32); f1.frequency.exponentialRampToValueAtTime(600, t + .62);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(700, t); lp.frequency.exponentialRampToValueAtTime(3200, t + .5);
      const g = amp(c, t, .12, .22, .55); o.connect(f1); f1.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + .75);
      tone(c, t, 'sine', 220, 660, .1, .07, .55);
      hiss(c, t, 'bandpass', 500, .7, .25, .08, .4, 3000);
    }); },
    impact(){ play((c, t) => { tone(c, t, 'sine', 78, 36, .004, .55, .42); hiss(c, t, 'lowpass', 900, .7, .003, .25, .28); tone(c, t + .02, 'triangle', 220, 110, .003, .06, .2); }); },
    /* SynthonIA: un «bip» amable (sube si está contenta, baja si se disculpa) */
    blip(mood){ play((c, t) => { const sad = mood === 'disculpa' || mood === 'confundida' || mood === 'preocupada'; tone(c, t, 'sine', sad ? 620 : 640, sad ? 430 : 980, .006, .09, .1); tone(c, t + .07, 'sine', sad ? 470 : 990, sad ? 360 : 1320, .006, .06, .09); }); },
    /* la manita hace clic */
    tap(){ play((c, t) => { tone(c, t, 'sine', 1300, 900, .002, .07, .045); hiss(c, t, 'highpass', 3500, .6, .001, .05, .02); }); },
    /* llegó ayuda / aviso del panel: se expande */
    expand(){ play((c, t) => { hiss(c, t, 'bandpass', 300, .9, .25, .1, .35, 4200); [523, 659, 784].forEach((f, i) => tone(c, t + .12 + i * .04, 'sine', f, f, .05, .07, .7)); }); },
    /* terminó la guía: arpegio corto */
    done(){ play((c, t) => { [523, 659, 784, 1047].forEach((f, i) => tone(c, t + i * .085, 'triangle', f, f, .006, .1, .35)); hiss(c, t + .3, 'highpass', 6000, .5, .02, .03, .4); }); },
    /* v1.4 · sonidos de transición futuristas y suaves: un brillo de cristal que respira (sin golpes) */
    shimmer(){ play((c, t) => {
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(5200, t + 1.1); lp.frequency.exponentialRampToValueAtTime(1800, t + 2.2); lp.Q.value = .7; lp.connect(out);
      [[392, .045], [587.3, .035], [880, .025], [1174.7, .018], [1760, .01]].forEach(([f, p], i) => { tone(c, t + i * .06, 'sine', f, f * 1.004, .5, p, 1.6, lp); tone(c, t + i * .06 + .02, 'sine', f * 1.006, f * 1.01, .55, p * .6, 1.5, lp); });
      hiss(c, t + .1, 'bandpass', 5200, 3, .6, .012, 1.2, 9000);
    }); },
    /* entrar por la «o»: un aire que sube, muy bajito */
    warp(){ play((c, t) => { hiss(c, t, 'lowpass', 300, .8, .9, .05, .6, 4200); tone(c, t, 'sine', 196, 392, .8, .03, .5); tone(c, t + .05, 'sine', 294, 588, .8, .02, .5); }); },
    get enabled(){ return on(); }
  };
})();

/* v2.4 · SynthonIA te escucha: mientras escribes (en el chat o en su ventanita) le salen ondas azules a la izquierda */
(function listen(){
  let t = 0;
  addEventListener('input', e => {
    const el = e.target; if (!el || !el.matches || !el.matches('textarea, input[type=text], input:not([type]), [contenteditable=true]')) return;
    document.documentElement.classList.add('szlisten'); clearTimeout(t);
    t = setTimeout(() => document.documentElement.classList.remove('szlisten'), 1300);
  }, true);
})();

/* ---------- v3.2 · SynthonIA juega cuando no estás (pedido de Sammuel, 28 oct) ----------
   2 min sin moverte: sale de su rincón, grandota, y se duerme en la mitad de la pantalla sobre una nubecita.
   1 min y medio después abre los ojos, se estira y juega con la página: se cuelga de un título, hace ejercicio,
   empuja un botón, apaga la gravedad, hace malabares, rebota por las esquinas o se asoma por un borde.
   Tres juegos y vuelve a dormir; así mientras no vuelvas. Cuando mueves el mouse (o tocas, o una tecla): cara de
   sorprendida, sale corriendo a su lugar de siempre y dice «¡Ah, volviste!». Lo que movió vuelve solo: a la página
   solo le pone animaciones sumadas (composite:'add') que se cancelan al final, nunca le cambia estilos.
   Con Animaciones apagadas solo se duerme en su bolita, como antes. Para probar rápido: ?siesta=rapida */
SPOSE.colgada = { L:[42, 116, 166, 'open'], R:[42, 116, 166, 'open'] };
SPOSE.estira = { L:[4, 212, 98, 'wave'], R:[4, 212, 98, 'wave'] };
const SZIDLE = (() => {
  const FAST = /[?&]siesta=rapida/.test(location.search);
  const T_SLEEP = FAST ? 4000 : 120000, T_NAP = FAST ? 6000 : 90000;
  const L2 = (es, en) => B.LANG === 'en' ? en : es, pickOne = a => a[Math.floor(Math.random() * a.length)];
  const NOPE = '#szIdle,#szBot,#szBotB,#szBotP,#szRoam,#intro,#portal,.p8,.sy-svg,.lbatt,#langBtn,[data-mv-no],.szm,#cur,#curDot';
  const STOP = { stop:1 };
  let state = 'off', gen = 0, ov = null, pos = null, act = null, fig = null, say = null, P = { x:0, y:0, s:1, r:0 }, S = 240, lastAct = '', home = null, moved = [], played = {};
  const page = () => !!(document.getElementById('composer') || document.getElementById('szRoam'));
  const allowed = () => !reduce && !root.classList.contains('noanim') && page();
  const W = () => innerWidth, H = () => innerHeight, FH = () => S * 4 / 3;
  const T = p => 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) scale(' + p.s.toFixed(3) + ') rotate(' + (p.r || 0) + 'deg)';
  /* esperar y volar se cortan si vuelves (gen cambia) */
  const wait = async (g, ms) => { await sleepRaw(ms); if (g !== gen) throw STOP; };
  async function fly(g, to, ms, easing){
    const n = Object.assign({}, P, to), a = pos.animate([{ transform:T(P) }, { transform:T(n) }], { duration:ms, easing:easing || 'cubic-bezier(.45,0,.25,1)' });
    try{ await a.finished; }catch(e){ throw STOP; }
    if (g !== gen) throw STOP;
    pos.style.transform = T(n); P = n; a.cancel();
  }
  const look = (mood, pose) => synSet(fig, mood, pose || 'idle', S);
  function talk(text, ms){
    if (!say) return;
    say.textContent = text; say.classList.add('on');
    const b = fig.querySelector('.szbody'); if (b) b.classList.add('talking');
    clearTimeout(say._t); say._t = setTimeout(() => { if (!say) return; say.classList.remove('on'); const q = fig.querySelector('.szbody'); if (q) q.classList.remove('talking'); }, ms || 2600);
  }
  /* mueve algo de la página SUMANDO una animación (no pisa la suya) y la recuerda para cancelarla al final */
  function nudge(el, frames, opt){ try{ const a = el.animate(frames, Object.assign({ composite:'add', easing:'ease-in-out' }, opt)); moved.push(a); return a; }catch(e){ return null; } }
  const restore = () => { moved.forEach(a => { try{ a.cancel(); }catch(e){} }); moved = []; };
  /* cosas de la página que se ven enteras (y que no son de ella ni de las partes que nunca se tocan) */
  function seen(sel, ok){
    return $$(sel).map(n => { if (n.closest(NOPE) || n.closest('[hidden],[aria-hidden=true]')) return null; const r = n.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top >= 8 && r.left >= 0 && r.bottom <= H() - 8 && r.right <= W() && getComputedStyle(n).display !== 'inline' && (!ok || ok(r)) ? { n, r } : null; }).filter(Boolean);
  }
  const homeEl = () => { const b = typeof botAt === 'function' && BOT.el ? botAt() : (document.getElementById('szRoam') || BOT.el); return b && b.getClientRects().length ? b : null; };
  const center = () => ({ x:(W() - S) / 2, y:Math.max(8, (H() - FH()) / 2), s:1, r:0 });
  const spot = () => ({ x:12 + Math.random() * Math.max(0, W() - S - 24), y:Math.max(8, 12 + Math.random() * Math.max(0, H() - FH() - 24)), s:1, r:0 });

  function mount(){
    S = Math.round(clamp(Math.min(W() * (W() < 600 ? .62 : .42), H() * .5), 170, 340));
    ov = document.createElement('div'); ov.id = 'szIdle'; ov.className = 'notr'; ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = '<div class="szi-pos" style="--S:' + S + 'px"><div class="szi-act"><i class="szi-cloud"></i><span class="szi-fig"></span>'
      + '<i class="szi-ball"></i><i class="szi-ball"></i><i class="szi-ball"></i></div><p class="szi-say"></p></div>';
    document.body.appendChild(ov);
    pos = ov.firstChild; act = pos.firstChild; fig = act.querySelector('.szi-fig'); say = pos.querySelector('.szi-say');
    fig.innerHTML = synBody('feliz', 'idle', S);
  }
  function unmount(){ restore(); if (ov) ov.remove(); ov = pos = act = fig = say = null; if (home){ home.classList.remove('szi-away'); home = null; } }

  /* ---- sale de su rincón y se duerme en la mitad ---- */
  async function start(){
    const g = ++gen; state = 'sleep';
    mount(); home = homeEl();
    const r = home && home.getBoundingClientRect();
    if (r){ const k = Math.max(.12, r.width / S); P = { x:r.left + r.width / 2 - S * k / 2, y:r.top + r.height / 2 - FH() * k / 2, s:k, r:0 }; }
    else { P = center(); P.s = .2; P.x += S * .4; P.y += FH() * .4; }
    pos.style.transformOrigin = '0 0'; pos.style.transform = T(P);
    if (home) home.classList.add('szi-away');
    look('dormida', 'idle');
    try{
      ov.classList.add('on');
      await fly(g, center(), 1400, 'cubic-bezier(.3,1.25,.5,1)');
      await nap(g);
    }catch(e){ if (e !== STOP) throw e; }
  }
  async function nap(g){
    state = 'sleep'; restore(); act.className = 'szi-act zz'; look('dormida', 'idle');
    await wait(g, T_NAP);
    await play(g);
  }
  /* ---- se despierta, se estira y juega tres cosas ---- */
  const ACTS = { hang, gym, push, float, juggle, bounce, peek };
  async function play(g){
    state = 'play'; act.className = 'szi-act';
    look('neutral', 'idle'); await wait(g, 900);
    look('feliz', 'celebra'); talk(L2('¡Ahh, qué siesta! ¿Hay alguien?…', 'Ahh, what a nap! Anyone there?…'), 2400); await wait(g, 2600);
    look('guino', 'idle'); talk(L2('Nadie. ¡A jugar con la página!', 'Nobody. Time to play with the page!'), 2200); await wait(g, 2200);
    /* primero los juegos que menos ha hecho (y nunca el mismo con que terminó la vez pasada) */
    const only = FAST && (location.search.match(/[?&]juego=(\w+)/) || [])[1];
    const keys = only && ACTS[only] ? [only] : Object.keys(ACTS).filter(k => k !== lastAct).map(k => [k, (played[k] || 0) + Math.random() * .9]).sort((x, y) => x[1] - y[1]).map(x => x[0]);
    let done = 0;
    for (const k of keys){
      if (done >= 3) break;
      act.className = 'szi-act'; restore();
      if (await ACTS[k](g) !== false){ done++; lastAct = k; played[k] = (played[k] || 0) + 1; }
    }
    act.className = 'szi-act'; restore();
    look('dormida', 'idle'); talk(L2('Me dio sueño otra vez…', 'I got sleepy again…'), 2200);
    await fly(g, center(), 1300);
    await nap(g);
  }
  /* se cuelga de un título (o del borde de arriba) y se columpia; el título se hunde un poquito con su peso */
  async function hang(g){
    const t = pickOne(seen('h1,h2,h3,#nav,header,.topbar,.head', r => r.width >= 140 && r.bottom >= 40 && r.bottom <= H() * .5)) || null;
    const k = S / 300, gy = t ? t.r.bottom : 0;
    const x = t ? clamp(t.r.left + t.r.width / 2 - S / 2, 8, W() - S - 8) : (W() - S) / 2;
    look('feliz', 'idle'); await fly(g, { x, y:Math.max(-20 * k, gy + 20), r:0 }, 1100);
    look('encantada', 'colgada'); await fly(g, { y:gy - 54 * k }, 500, 'cubic-bezier(.3,1.6,.5,1)');
    act.classList.add('swing');
    if (t) nudge(t.n, [{ transform:'translateY(0)' }, { transform:'translateY(5px) rotate(.4deg)' }], { duration:900, iterations:6, direction:'alternate' });
    talk(L2(t ? '¡Wiii! Me cuelgo de aquí.' : '¡Wiii! Me cuelgo del borde.', t ? 'Wheee! Hanging from here.' : 'Wheee! Hanging from the edge.'), 2600);
    await wait(g, 4200);
    look('sorprendida', 'sorpresa'); talk(L2('¡Uy, me resbalo!', 'Oops, I\'m slipping!'), 1600); await wait(g, 700);
    act.classList.remove('swing');
    await fly(g, { y:Math.min(H() - FH() - 8, gy + H() * .25) }, 650, 'cubic-bezier(.5,0,.9,.5)');
    act.classList.add('land'); look('riendo', 'idle'); await wait(g, 900);
    return true;
  }
  /* hace ejercicio: saltos de tijera con sus lentes de Flow y va contando */
  async function gym(g){
    await fly(g, spot(), 1000); look('flow', 'idle');
    talk(L2('Hora de hacer ejercicio. 💪', 'Workout time!'), 1800); await wait(g, 1700);
    for (let i = 1; i <= 8; i++){
      look('flow', i % 2 ? 'celebra' : 'estira'); act.classList.remove('jump'); void act.offsetWidth; act.classList.add('jump');
      talk(String(i) + (i === 8 ? '!' : '…'), 700); await wait(g, 620);
    }
    act.classList.remove('jump'); look('riendo', 'idle'); talk(L2('¡Uf! Hay que mantenerse en forma.', 'Phew! Gotta stay in shape.'), 2400); await wait(g, 2400);
    return true;
  }
  /* empuja un botón o una tarjeta… y lo devuelve a su lugar */
  async function push(g){
    const L = seen('button,.btn,.card,.tcard,.chip,.sug,.pill,h2,h3,img', r => r.width >= 40 && r.width <= 560 && r.height >= 20 && r.height <= 280 && (r.left > S * .9 || W() - r.right > S * .9));
    const t = pickOne(L); if (!t) return false;
    const left = t.r.left > S * .9 && (W() - t.r.right <= S * .9 || Math.random() < .5), dir = left ? 1 : -1;
    const y = clamp(t.r.top + t.r.height / 2 - FH() * .55, 8, H() - FH() - 8);
    await fly(g, { x:left ? t.r.left - S * .95 : t.r.right - S * .05, y }, 1100);
    look('pensando', left ? 'senala' : 'senalaL'); talk(L2('Mmm… ¿y si muevo esto?', 'Hmm… what if I move this?'), 2000); await wait(g, 1900);
    look('celebrando', left ? 'senala' : 'senalaL');
    for (let i = 1; i <= 3; i++){
      nudge(t.n, [{ transform:'translateX(' + dir * (i - 1) * 14 + 'px)' }, { transform:'translateX(' + dir * i * 14 + 'px) rotate(' + dir * i + 'deg)' }], { duration:320, fill:'forwards', easing:'cubic-bezier(.3,1.5,.5,1)' });
      await fly(g, { x:P.x + dir * 14 }, 320, 'cubic-bezier(.3,1.5,.5,1)'); await wait(g, 260);
    }
    look('sorprendida', 'sorpresa'); talk(L2('¡Ups! Lo dejo como estaba.', 'Oops! Putting it back.'), 2000); await wait(g, 900);
    nudge(t.n, [{ transform:'translateX(' + dir * 42 + 'px) rotate(' + dir * 3 + 'deg)' }, { transform:'none' }], { duration:600, fill:'forwards', easing:'cubic-bezier(.3,1.4,.5,1)' });
    await fly(g, { x:P.x - dir * 42 }, 600); await wait(g, 700);
    restore(); look('guino', 'idle'); await wait(g, 700);
    return true;
  }
  /* experimento: apaga la gravedad y las cosas flotan; luego la vuelve a prender */
  async function float(g){
    const L = seen('button,.btn,.chip,.sug,.pill,h2,h3,.card,.tcard,img,.gi', r => r.width <= 420 && r.height <= 220).sort(() => Math.random() - .5).slice(0, 7);
    if (L.length < 2) return false;
    await fly(g, spot(), 1000); look('creando', 'piensa');
    talk(L2('Experimento: ¿y si apago la gravedad? 🧪', 'Experiment: what if I turn off gravity?'), 2400); await wait(g, 2300);
    look('sorprendida', 'celebra');
    L.forEach(({ n }, i) => nudge(n, [{ transform:'none' }, { transform:'translateY(' + (-14 - i * 4) + 'px) rotate(' + (i % 2 ? 4 : -4) + 'deg)' }], { duration:1300 + i * 120, delay:i * 90, iterations:4, direction:'alternate', easing:'ease-in-out' }));
    talk(L2('¡Todo flota!', 'Everything floats!'), 2400); await wait(g, 5200);
    restore();
    L.forEach(({ n }, i) => nudge(n, [{ transform:'translateY(-16px)' }, { transform:'none' }], { duration:520, delay:i * 60, easing:'cubic-bezier(.3,1.7,.5,1)' }));
    look('riendo', 'idle'); talk(L2('¡Gravedad, vuelve! Todo en su lugar.', 'Gravity, come back! All in place.'), 2200); await wait(g, 2200);
    return true;
  }
  /* malabares con tres bolitas de luz; al final se le cae una */
  async function juggle(g){
    await fly(g, spot(), 1000); look('encantada', 'celebra'); act.classList.add('jug');
    talk(L2('¡Mira, malabares!', 'Look, juggling!'), 2200); await wait(g, 5200);
    act.classList.add('drop'); look('sorprendida', 'sorpresa'); talk(L2('¡Ay! Se me cayó una.', 'Oops! Dropped one.'), 2000); await wait(g, 1600);
    act.classList.remove('jug', 'drop'); look('riendo', 'idle'); await wait(g, 800);
    return true;
  }
  /* rebota por la pantalla como el logo del DVD, a ver si le pega a una esquina */
  async function bounce(g){
    look('riendo', 'celebra'); talk(L2('¡Wiii!', 'Wheee!'), 1800);
    let x = P.x, y = P.y, vx = Math.random() < .5 ? 1 : -1, vy = 1;
    const mx = Math.max(0, W() - S), my = Math.max(0, H() - FH());
    for (let i = 0; i < 5; i++){
      const tx = vx > 0 ? mx - x : x, ty = vy > 0 ? my - y : y, d = Math.max(30, Math.min(tx, ty));
      x = clamp(x + vx * d, 0, mx); y = clamp(y + vy * d, 0, my);
      await fly(g, { x, y, r:vx * 8 }, Math.max(350, d * 2.2), 'linear');
      if (x <= 0 || x >= mx) vx *= -1; if (y <= 0 || y >= my) vy *= -1;
      act.classList.remove('land'); void act.offsetWidth; act.classList.add('land');
    }
    await fly(g, { r:0 }, 300); look('celebrando', 'celebra'); talk(L2('¡Casi le pego a la esquina!', 'Almost hit the corner!'), 2200); await wait(g, 2200);
    return true;
  }
  /* se asoma por un borde: «¿hay alguien?», y sale por el otro */
  async function peek(g){
    const right = Math.random() < .5, y = clamp(H() * .3, 8, H() - FH() - 8);
    await fly(g, { x:right ? W() - S * .38 : -S * .62, y, r:right ? -14 : 14 }, 1200);
    look('guino', 'idle'); talk(L2('¿Hay alguien ahí…?', 'Is anybody there…?'), 2200); await wait(g, 2600);
    await fly(g, { x:right ? W() + 20 : -S - 20 }, 500);
    P = Object.assign({}, P, { x:right ? -S - 20 : W() + 20, r:right ? 14 : -14 }); pos.style.transform = T(P);
    await fly(g, { x:right ? -S * .5 : W() - S * .5 }, 700); look('riendo', 'idle'); talk(L2('¡Nadie! A seguir jugando.', 'Nobody! Let\'s keep playing.'), 2000); await wait(g, 2000);
    await fly(g, Object.assign(spot(), { r:0 }), 900);
    return true;
  }

  /* ---- volviste: cara de sorpresa, sale corriendo a su lugar y te saluda ---- */
  async function back(quiet){
    const g = ++gen; state = 'back'; restore();
    if (!ov){ state = 'off'; return; }
    act.className = 'szi-act'; clearTimeout(say && say._t); if (say) say.classList.remove('on');
    /* donde esté en este momento (aunque vaya volando) */
    try{ const m = new DOMMatrix(getComputedStyle(pos).transform); P = { x:m.e, y:m.f, s:Math.hypot(m.a, m.b) || 1, r:0 }; }catch(e){}
    try{ pos.getAnimations().forEach(a => a.cancel()); }catch(e){}
    pos.style.transform = T(P);
    look('sorprendida', 'sorpresa'); try{ SND.blip('sorprendida'); }catch(e){}
    act.classList.add('jump'); await sleepRaw(650); if (g !== gen) return;
    const h = home || homeEl(), r = h && h.getBoundingClientRect(), tgt = r && r.width ? r : { left:W() - 70, top:H() - 70, width:56, height:56 };
    const s = Math.max(.1, tgt.width / S), right = tgt.left + tgt.width / 2 > P.x + S * P.s / 2;
    const to = { x:tgt.left + tgt.width / 2 - S * s / 2, y:tgt.top + tgt.height / 2 - FH() * s / 2, s, r:right ? 10 : -10 };
    act.classList.toggle('left', !right);
    act.classList.remove('jump'); act.classList.add('run'); look('sorprendida', 'celebra');
    const a = pos.animate([{ transform:T(P) }, { transform:T(to) }], { duration:720, easing:'cubic-bezier(.55,0,.75,.3)', fill:'forwards' });
    try{ await a.finished; }catch(e){}
    if (g !== gen) return;
    unmount(); state = 'off'; if (quiet) return;
    const hi = L2(pickOne(['¡Ah, volviste! 👀', '¡Ah, volviste! No estaba jugando con tu página… 🙈', '¡Ah, volviste! Ya dejé todo como estaba. 😉']),
                  pickOne(['Oh, you\'re back! 👀', 'Oh, you\'re back! I wasn\'t playing with your page… 🙈', 'Oh, you\'re back! I put everything back. 😉']));
    if (BOT.el && typeof botBubble === 'function'){ botFace('sorprendida', true); setTimeout(() => { botBubble(hi, 3600); setTimeout(() => botFace('feliz'), 2600); }, 450); }
    else if (h){
      /* en la portada no hay bolita: ella misma (la que camina por las secciones) pone la cara y el globito sale a su lado */
      if (h.querySelector('.szbody')) synSet(h.querySelector('.rb-fig') || h, 'sorprendida', 'sorpresa');
      const q = document.createElement('p'); q.className = 'szi-hi notr'; q.textContent = hi.replace(/\s*\p{Extended_Pictographic}/gu, '');
      document.body.appendChild(q); const hr = h.getBoundingClientRect(), qw = Math.min(300, W() - 24);
      q.style.width = qw + 'px'; q.style.left = clamp(hr.left + hr.width / 2 - qw / 2, 12, W() - qw - 12) + 'px';
      if (hr.top > 120) q.style.bottom = (H() - hr.top + 10) + 'px'; else q.style.top = (hr.bottom + 10) + 'px';
      requestAnimationFrame(() => q.classList.add('on'));
      setTimeout(() => { q.classList.remove('on'); setTimeout(() => q.remove(), 400); }, 3400);
    }
  }
  return {
    /* core 25 la llama con cuánto llevas sin moverte y si la página está ocupada */
    tick(idle, busy){
      /* si se abre algo (una guía, una ventana, una IA respondiendo) mientras juega, vuelve a su lugar sin estorbar */
      if (busy && (state === 'sleep' || state === 'play')){ back(true).catch(() => { unmount(); state = 'off'; }); return; }
      if (state === 'off' && idle >= T_SLEEP && !busy && !document.hidden && allowed()) start().catch(() => { unmount(); state = 'off'; }); },
    /* vuelves: true si ella estaba fuera (así core 25 no repite el saludo) */
    wake(){ if (state === 'off' || state === 'back') return state === 'back'; back().catch(() => { unmount(); state = 'off'; }); return true; },
    get state(){ return state; }, FAST
  };
})();
