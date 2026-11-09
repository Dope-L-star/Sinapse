/* ===== SymphorIA · SynthonIA (su cara, su manita, sus sonidos, su ventanita, la guía, los eventos y el mantenimiento) =====
   Va aparte de core.js desde v3.4: así SynthFlow y Pulsem abren más livianos y SynthonIA llega justo después.
   Lo de core que necesita viene por SZ.__syn (LANG y SESS cambian, por eso se leen siempre como B.LANG y B.SESS).
   Al final devuelve lo suyo con B.ready({ … }) (ver src/core/00e-synthonia-puente.js). Se arma con «node build.mjs». */
(() => {
'use strict';
if (!window.SZ || !SZ.__syn) return;
const B = SZ.__syn;
const { root, $, $$, clamp, CFG, PERF, reduce, sleepRaw, esc, isFlow, BRAND, zWord, t, onLang, ENERX, trStr, ACC, accHooks, api, accName, toast, pixelGrid, pixelRun, typeIn, SZQ, szCatalog, telPage, telEv, burst, portalOut, portalLock, authBox, cfgModal, plansModal, memAddCore, memList } = B;
/* v3.7 · lo que escribe SynthonIA sale con formato: **negrita**, *cursiva*, `código` y listas con «-».
   Antes se veían los asteriscos y cosas como «&gt;» (Sammuel, 2 nov). Primero se escapa todo (seguro) y después se pone el formato. */
const synMd = s => {
  let h = String(s == null ? '' : s).replace(/&(gt|lt|amp|quot|#39|nbsp);/g, (m, k) => ({ gt:'>', lt:'<', amp:'&', quot:'"', '#39':"'", nbsp:' ' })[k]);
  h = esc(h)
    .replace(/\*\*([^*\n][^\n]*?)\*\*/g, '<b>$1</b>').replace(/__([^_\n][^\n]*?)__/g, '<b>$1</b>')
    .replace(/(^|[\s(«"])\*([^*\s][^*\n]*?)\*(?=[\s).,;:!?»"]|$)/g, '$1<i>$2</i>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/^\s*#{1,4}\s+/gm, '').replace(/^\s*[-*•]\s+/gm, '• ')
    .replace(/\*\*/g, '').replace(/\n/g, '<br>');
  return h;
};
/* ---------- SynthonIA: su carita (SVG), con una expresión para cada momento ---------- */
const FACE_G = '#3DE0FF';   /* 2026-11-09 · Partitura: los ojos y la boca de SynthonIA son cian (antes dorados) */
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
    encantada:{ e:[heart(40), heart(60)], ec:'#ef7f93', ew:1.6, ef:'#ef7f93', m:'M41 63q9 10 18 0z', mf:1, ck:1 },
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
     brillo arriba, filo cian abajo y la cara en luz cian. Las expresiones son las mismas de siempre. */
  return '<ellipse cx="50" cy="93" rx="26" ry="3.5" fill="#3DE0FF" opacity=".14"/>'
    + '<circle cx="50" cy="52" r="40" fill="url(#szBall)" stroke="rgba(255,255,255,.16)" stroke-width="1"/><circle cx="50" cy="52" r="40" fill="url(#szBallRim)"/>'
    + '<ellipse cx="36" cy="27" rx="14" ry="7" transform="rotate(-28 36 27)" fill="#fff" opacity=".14"/><circle cx="28" cy="34" r="2.2" fill="#fff" opacity=".35"/>'
    + (f.ck ? '<circle cx="29" cy="64" r="4.5" fill="#FF3D9A" fill-opacity=".28"/><circle cx="71" cy="64" r="4.5" fill="#FF3D9A" fill-opacity=".28"/>' : '')
    + P(f.b, 'stroke="' + G + '" stroke-width="2.6" stroke-linecap="round" fill="none"')
    + '<g class="fe" filter="url(#szEye)">' + eyes + '</g>'
    + P(f.m, 'class="fm" stroke="' + G + '" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="' + (f.mf ? G : 'none') + '"')
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
  g.appendChild(mo); g.appendChild(tg); svg.appendChild(g);
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
/* ---------- la manita robótica de SynthonIA: señala, hace clic, escribe y explica ---------- */
const HAND_SVG = {
  arrow:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 3l20 11.2-8.6 2.2L12 25.5z" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.6 8.3l11.3 6.3" stroke="#fff4d6" stroke-opacity=".7" stroke-width="1.2" stroke-linecap="round"/><circle cx="12.6" cy="17.6" r="1.6" fill="#c9566c" stroke="#1a0f08" stroke-width=".8"/></svg>',
  point:'<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="14.6" y="10.6" width="3.9" height="7" rx="1.95" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3"/><rect x="18.3" y="11.6" width="3.7" height="6.4" rx="1.85" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3"/><rect x="21.8" y="13" width="3.4" height="5.6" rx="1.7" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3"/><path d="M7.4 17.4c0-1.8 1.3-3 3-3h11.6c2 0 3.4 1.4 3.4 3.4v3.4c0 4.2-3.2 7.4-7.4 7.4h-3.2c-4.2 0-7.4-3.2-7.4-7.4z" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.4" stroke-linejoin="round"/><path d="M7.6 18.6c-1.9-1.2-4-.2-3.9 1.7.1 1.3 1.3 2.2 3 3.4l2.8 1.6" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><rect x="9.2" y="1.4" width="5.4" height="17.4" rx="2.7" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.4"/><path d="M10 7h3.8M10 11.6h3.8" stroke="#1a0f08" stroke-opacity=".45" stroke-width="1" stroke-linecap="round"/><path d="M10.6 3.4v2" stroke="#fff4d6" stroke-opacity=".75" stroke-width="1.1" stroke-linecap="round"/><rect x="10" y="26.6" width="12.6" height="3.6" rx="1.6" fill="#c9566c" stroke="#1a0f08" stroke-width="1.2"/><circle cx="18.6" cy="21.6" r="1.5" fill="#c9566c"/></svg>',
  grab:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7.4 13.6c0-1.8 1.4-3 3-3h10.8c2.6 0 4.4 1.8 4.4 4.4v5.6c0 4.4-3.4 7.8-7.8 7.8h-2.6c-4.4 0-7.8-3.4-7.8-7.8z" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.4"/><path d="M11 10.8v4M14.8 10.6v4.4M18.6 10.6v4.4M22.2 11.2v4" stroke="#1a0f08" stroke-opacity=".55" stroke-width="1.1" stroke-linecap="round"/><rect x="10.2" y="26.2" width="12.6" height="3.6" rx="1.6" fill="#c9566c" stroke="#1a0f08" stroke-width="1.2"/></svg>',
  palm:'<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="8.4" y="4.2" width="3.7" height="12.6" rx="1.85" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3"/><rect x="12.4" y="1.6" width="3.8" height="15" rx="1.9" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3"/><rect x="16.5" y="2.4" width="3.7" height="14.4" rx="1.85" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3"/><rect x="20.4" y="5.2" width="3.4" height="11.8" rx="1.7" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3"/><path d="M7.8 15.2c0-1.5 1.1-2.5 2.6-2.5h11.6c1.8 0 3 1.2 3 3v4.6c0 4.3-3.3 7.6-7.6 7.6h-2.6c-4.2 0-7-3.3-7-7.6z" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 17.6c-1.6-2-4.4-1.6-4.3.4.1 1.4 1.5 2.4 3.3 3.6l2.2 1.4" fill="url(#hgd)" stroke="#1a0f08" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.2 4v2.2M17.3 4.6v2" stroke="#fff4d6" stroke-opacity=".75" stroke-width="1.1" stroke-linecap="round"/><rect x="10" y="26.6" width="12.6" height="3.6" rx="1.6" fill="#c9566c" stroke="#1a0f08" stroke-width="1.2"/><circle cx="18.4" cy="20.6" r="1.5" fill="#c9566c"/></svg>',
  text:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11 4.5c2.4 0 4 .8 5 2 1-1.2 2.6-2 5-2M11 27.5c2.4 0 4-.8 5-2 1 1.2 2.6 2 5 2M16 6.5v19M13.2 16h5.6" fill="none" stroke="#1a0f08" stroke-width="4" stroke-linecap="round"/><path d="M11 4.5c2.4 0 4 .8 5 2 1-1.2 2.6-2 5-2M11 27.5c2.4 0 4-.8 5-2 1 1.2 2.6 2 5 2M16 6.5v19M13.2 16h5.6" fill="none" stroke="url(#hgd)" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="16" r="1.4" fill="#c9566c"/></svg>'
};
const HAND_HOT = { arrow:[5, 3], point:[11.9, 1.8], grab:[16, 12], text:[16, 16], palm:[16, 14] };
const HAND = (() => {
  let el = null, spot = null, say = null, x = -80, y = -80, shape = 'arrow', alive = false, raf = 0, sayTok = 0, wraf = 0, wArea = null;
  const fast = () => !CFG.anim || PERF;
  function build(){
    if (el) return;
    el = document.createElement('div'); el.id = 'szHand'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="hgd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe7b0"/><stop offset=".45" stop-color="#e6b65f"/><stop offset="1" stop-color="#b8743f"/></linearGradient></defs></svg><div class="hs"></div><span class="hl">SynthonIA</span>';
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
  /* clic con la manita: se aprieta, sale una onda y (si se pide) hace el clic de verdad */
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
  /* SynthonIA habla en una burbuja junto a la manita (con botones opcionales) */
  function talk(text, o = {}){
    build(); const tok = ++sayTok;
    const mood = o.mood || 'feliz', btns = o.buttons || [];
    say.innerHTML = '<span class="sf">' + face(mood, 56) + '</span><div class="st"><b>SynthonIA</b><p></p>' + (btns.length ? '<div class="sb">' + btns.map((b, i) => '<button type="button" class="btn sm' + (b.ghost ? ' ghost' : '') + '" data-sb="' + i + '">' + esc(b.label) + '</button>').join('') + '</div>' : '') + '</div>';
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
    if (!fast()) typeIn(p, { cps:48, max:4, onFrame:lipSync([$('.sf .szface', say), ballFace()], text) }).catch(() => { p.textContent = text; });
    return new Promise(res => {
      if (!btns.length){ res(-1); return; }
      $$('[data-sb]', say).forEach(b => b.addEventListener('click', () => { if (tok === sayTok) res(+b.dataset.sb); }));
      if (o.auto) setTimeout(() => { if (tok === sayTok) res(-2); }, o.auto);
    });
  }
  const quiet = () => { if (say) say.classList.remove('on'); };
  /* mientras eliges algo (p. ej. los temas), la manita no se queda quieta tapando opciones:
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
  /* «¡hola!»: la manita se abre y saluda */
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

/* =====================================================================
   SynthonIA, la ayudante: bolita flotante (en el celular, junto al logo del chat)
   1) respuestas guardadas: no gastan nada y, si es un «¿dónde está…?», te lo señala con su manita
   2) si no la sabe, piensa con una IA gratis de SymphorIA (máx. 15 preguntas nuevas al día)
   3) «Hablar con el equipo»: una persona (Prime, ZFlow o Symmetrix) te responde aquí mismo
   ===================================================================== */
const BOT_FAQ = [
  { k:'conectar conecto conexion conecta llave key activar bloqueado bloqueo desbloquear funciona', a:'Para chatear no tienes que configurar nada: escribe y listo. Las IAs conectadas son IAs gratis que ya vienen listas en SymphorIA. No tienes que configurar nada ni dar tarjeta: solo escribes. Sin cuenta pruebas con una EnerX de prueba cada día; con tu cuenta gratis dura mucho más. Si un día se te acaba la EnerX, puedes seguir con Puter.', go:['#payPill', '#payL', '#payM', '#cPick', '#curChip'] },
  { k:'ias conectadas que son las ias conectadas gratis listas', a:'Las IAs conectadas son IAs gratis que ya vienen listas en SymphorIA. No tienes que configurar nada ni dar tarjeta: solo escribes. Sin cuenta pruebas con una EnerX de prueba cada día; con tu cuenta gratis dura mucho más. Cada día tienes un límite gratis para usar las IAs conectadas. A medianoche se vuelve a llenar.', mood:'feliz' },
  { k:'puter que es puter creditos personales cuenta', a:'Con Puter usas la versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis, tiene un saldo que se renueva cada mes y se conecta en Ajustes › IAs y memoria › «Conectar Puter u otra IA». Al lado de cada IA de Puter verás rayitas: verdes gasta poco, amarillas normal y rojas gasta mucho.', act:'conn', lbl:'Conectar mi Puter' },
  { k:'puter conectar conecto conecta conectarlo vincular vinculo', need:'puter', a:'Así conectas Puter: abre Ajustes › pestaña «IAs y memoria» › «Conectar Puter u otra IA» y toca «Conectar con Puter». Se abre una ventanita: entra o crea tu cuenta de Puter (es gratis) y listo. También se conecta solo si eliges una IA que diga «Conecta tu Puter» y le escribes. Con Puter usas la versión pro de IAs como ChatGPT, Claude o Gemini, con un saldo gratis que se renueva cada mes.', act:'conn', lbl:'Conectar mi Puter', go:['[data-tab="cfg"]', '#railCfg', '#cfgBtn'] },
  { k:'cambiar elegir escoger ia modelo cual otra seleccionar', a:'Toca el nombre de la IA que estás usando y se abre «Elige tu IA». Ahí mismo ves las IA: buscas o tocas «Para ti», «Todas» o «Mis favoritas», y tocas «Usar». Si quieres afinar, «Personalizar búsqueda» tiene los filtros. Para comparar varias, usa «Comparar IAs» en la barra.', go:['#cPick', '#curChip', '[data-tab="ia"]'] },
  { k:'comparar comparacion varias dos lado mismo tiempo', a:'Con «Comparar con otra IA» sumas hasta 4. Todas responden lo mismo y aparecen en el orden en que llegan.', go:['#cCmp', '#pickRow [data-add]'] },
  { k:'guia tutorial aprender enseñar como funciona', a:'En la Guía rápida te pregunto si la quieres completa o qué quieres ver: eliges uno o varios temas y te los muestro con mi manita, en ese orden.', go:['#guideTop', '#helpBtn'], act:'guide', lbl:'Abrir la Guía' },
  { k:'limite cuanto queda quedan mensajes barra uso gasto consumo enerx energia bateria pila carga synxcoin coins', a:'Cada día tienes EnerX, tu batería gratis para usar las IAs conectadas: baja un poco con cada mensaje (lo que escribes y lo que la IA te responde) y a medianoche se carga al 100 %. Sin cuenta tienes una EnerX de prueba; con tu cuenta gratis tu EnerX dura mucho más. Te muestro dónde está.', go:['#railCoin', '#tabCoin', '#navTotal', '.pill-total'], tour:'coins' },
  { k:'pagar cobro cobran gratis precio plata dinero costo tarjeta', a:'SymphorIA es gratis y hoy no te cobra nada. Las IAs conectadas son gratis, y Puter también tiene su parte gratis cada mes. Los planes del menú «⋯» › Planes por ahora solo se muestran: los pagos están apagados.', go:['#moreBtn'] },
  { k:'chats historial conversaciones anteriores guardados donde estan mis', a:'Tus chats están en «Mis chats», en la barrita (en el celular, la pestaña Chats). Se guardan en tu dispositivo y en tu cuenta si entras.', go:['#railChats', '[data-r="chats"]', '[data-tab="chats"]'] },
  { k:'drive google espacio guardar copia respaldo conectar conecto', a:'En Ajustes › IAs y memoria › Google Drive vinculas tu Drive y guardo una copia de tus chats en una carpeta privada. No puedo ver tus otros archivos.', go:['#moreBtn'] },
  { k:'adjuntar archivo pdf imagen foto subir documento clip', a:'Con el «+» agregas archivos, PDF o fotos (también puedes arrastrarlos). Para fotos elige una IA que «ve fotos».', go:['#attachBtn'] },
  { k:'cuenta registrar registro entrar iniciar sesion perfil usuario contraseña', a:'Crear tu cuenta es gratis y no pide correo ni tarjeta. Sin cuenta puedes probar con una EnerX de prueba al día; con cuenta dura mucho más, y tus chats y favoritos te siguen a cualquier dispositivo. Entra desde tu foto en la barrita.', go:['#accBtn', '[data-tab="me"]'] },
  { k:'ajustes rendimiento lento animaciones configuracion sonido sonidos cursor principiante', a:'En Ajustes puedes poner la página «más rápida», activar el modo principiante o apagar mis sonidos.', go:['#cfgBtn', '[data-tab="cfg"]'] },
  { k:'favorito favoritos estrella guardar mensaje', a:'Con la estrella guardas un mensaje en favoritos. Están en la barrita, en la estrella.', go:['[data-r="fav"]', '#railFav'] },
  { k:'error no responde falla lenta demora', a:'Si una IA falla, te ofrezco una parecida que sí funcione, con tu mensaje listo para reenviar.' },
  { k:'agente modo agente superiorsynth superior mejorar prompt', a:'Con SuperiorSynth no eliges IA: tú escribes, él entiende tu pedido, lo mejora, elige la IA que más sabe de eso y te muestra cada paso. Al final decides si te quedas con esa IA o sigues con él. Lo eliges en el botón de modo, junto a la caja de escribir.', go:['#cMode'] },
  { k:'app instalar descargar aplicacion celular pantalla inicio', a:'SynthFlow se instala como app desde aquí mismo, sin tiendas: Ajustes › IAs y memoria › «Descargar la app SynthFlow». En Android toca «Instalar»; en iPhone: Compartir › Agregar a inicio. Queda a pantalla completa y a un toque.', go:['[data-tab="cfg"]', '#cfgBtn'] },
  { k:'tema temas color colores cambiar simple estilo oscuro barra izquierda', a:'En Ajustes › Página eliges el estilo («SynthFlow» o «Simple», más tranquilo), el color de SynthFlow (Océano, Bosque, Lavanda…) y, en el celular, si la barra va abajo o a la izquierda.', go:['[data-tab="cfg"]', '#cfgBtn'] },
  { k:'vincular google correo usuario contraseña juntar unir cuentas', a:'En Tu cuenta › «Seguridad y acceso» vinculas tu Google a tu cuenta con usuario, o le pones usuario y contraseña a tu cuenta de Google. Así entras a la misma cuenta de las dos formas.', go:['#accBtn', '[data-tab="me"]'] },
  { k:'symphoria symphora sinfonia significa nombre pagina por que se llama etimologia', a:'SymphorIA viene del griego: Sym- (σύν) es «junto, en sintonía», como en sinfonía o sinergia, y -phora (φέρειν) es «llevar», como en metáfora o semáforo. Juntas dicen «el portador de la armonía»: toma el caos de datos y lo lleva a un flujo claro. Es como la evolución del ábaco. ✨', mood:'encantada' },
  { k:'synth synthetism synthflow synthonia sintonia', a:'«Synth» viene del synthetism, un arte: por eso el chat se llama SynthFlow. Y yo me llamo SynthonIA porque te sintonizo con la IA. ✨', mood:'encantada' },
  /* charla sencilla */
  { k:'hola buenas hey saludos holi buenos dias tardes noches', a:'¡Hola! Soy SynthonIA 😊 ¿En qué te ayudo con SymphorIA?', wave:true },
  { k:'como estas andas va todo bien que tal', a:'¡Muy bien, gracias por preguntar! Aquí, lista para ayudarte. ¿Y tú cómo vas?', mood:'encantada' },
  { k:'como te llamas quien eres tu nombre eres', a:'Me llamo SynthonIA. Soy la ayudante de SymphorIA: te explico la página, te digo las cosas claras y tengo mis opiniones sobre tecnología (spoiler: lo simple que funciona le gana a lo brillante que se rompe).', en:'I\'m SynthonIA, SymphorIA\'s helper: I explain the site, I tell it like it is, and I have my own opinions about tech (spoiler: simple things that work beat shiny things that break).', mood:'guino' },
  { k:'chiste broma cuentame algo gracioso risa', a:'', joke:true, mood:'riendo' },
  { k:'dato curioso sabias algo interesante', a:'', fact:true, mood:'sorprendida' },
  { k:'gracias genial perfecto listo vale chevere bacano', a:'¡Con gusto! Aquí estoy cuando me necesites. ✨', mood:'encantada' },
  { k:'adios chao nos vemos hasta luego', a:'¡Chao! Que tengas un día con mucho Flow. 👋', wave:true }
];
const BOT_QUICK = [['ias conectadas que', '¿Qué son las IAs conectadas?'], ['puter que es', '¿Qué es Puter?'], ['puter conectar', '¿Cómo conecto Puter?'], ['cambiar elegir', '¿Cómo cambio de IA?'], ['limite cuanto', '¿Qué es la ' + ENERX + '?'], ['chiste', 'Cuéntame un chiste']].map(([k, t]) => [BOT_FAQ.findIndex(f => f.k.startsWith(k)), t]);
const fold = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ');
function botMatch(q){
  const STOP = /^(que|como|donde|cual|son|estan|esta|esto|es|para|por|con|una|uno|los|las|del|mis|tus|sus|esta|este|esto|eso|hay|hago|hacer|puedo|quiero|tengo|necesito|sobre|algo|the|and|how|can|what|where|does|you|are|there|this|that|with|for|from|have|want|need|page|please|help|synthflow|synthz|pagina|favor|porfa|ayuda|ayudame)$/;
  if (/p[aá]gina de ayuda|centro de ayuda|help (page|center)|ayuda\.html/i.test(q)){ const ay = BOT_FAQ.find(f => f.k.startsWith('ayuda pagina')); if (ay) return ay; }
  const w = fold(q).split(/\s+/).filter(x => (x.length > 2 || /^(ia|ai)$/.test(x)) && !STOP.test(x)); if (!w.length) return /ayuda|help/i.test(q) ? BOT_FAQ.find(f => f.k.startsWith('guia')) : null;
  /* v3.0 · cada palabra pesa según qué tan rara es (una palabra que solo está en «Proyectos» decide más que «están») */
  const hit = (K, x) => K.includes(x) ? 1 : K.some(k => k.length > 4 && (k.startsWith(x) || x.startsWith(k))) ? .6 : 0;
  const KS = BOT_FAQ.map(f => fold(f.k).split(/\s+/)), df = w.map(x => KS.filter(K => hit(K, x)).length || 1);
  let best = null, bs = 0, br = 0;
  BOT_FAQ.forEach((f, i) => { if (f.need && !w.includes(f.need)) return; let sc = 0, rk = 0; w.forEach((x, j) => { const h = hit(KS[i], x); sc += h; rk += h / df[j]; }); if (rk > br){ br = rk; bs = sc; best = f; } });
  return bs >= Math.max(.6, w.length * .32) ? best : null;
}
const BOT = { el:null, panel:null, open:false, hist:[], help:null, poll:0, seen:0, team:null, inbox:[], cur:null, mode:'chat', teamSeen:{}, positionCleanup:null, betaCleanup:null, betaPut:null };
/* v2.6: en la portada no hay bolita; la ventanita y las frases salen de donde esté parada SynthonIA */
const botAt = () => { const a = BOT.anchor && BOT.anchor(); return a && a.getClientRects().length ? a : BOT.el; };
const vis = sel => (Array.isArray(sel) ? sel : [sel]).map(x => $(x)).find(n => n && n.getClientRects().length && n.getBoundingClientRect().width > 0) || null;
function botAvatarClick(e){
  const b = BOT.el; if (!b || b._skip) return;
  BOT.lostN = 0; b.classList.remove('g1', 'g2');
  /* según dónde la toques, hace una cara distinta */
  const z = e && e.detail ? botZone(e) : '';
  if (z === 'eye'){ SND.blip('auch'); botFace('auch', true); botBubble('¡Ay! Ese es mi ojo.', 2200); setTimeout(() => botFace('feliz', true), 1900); return; }
  if (z === 'top'){ botFace('sorprendida', true); botBubble('¡Uy, mi antena! Me haces cosquillas.', 2200); setTimeout(() => botFace('feliz', true), 1900); return; }
  if (z === 'cheek'){ botFace('encantada', true); setTimeout(() => botFace('feliz'), 1600); }
  else if (z === 'mouth'){ botFace('riendo', true); setTimeout(() => botFace('feliz'), 1600); }
  botToggle();
}
function botReactUnmount(){
  const b = BOT.el;
  if (!b || b.dataset.reactComponent !== 'synthonia-avatar') return;
  if (BOT.open) botClose();
  try{ BOT.positionCleanup && BOT.positionCleanup(); }catch(e){}
  try{ BOT.betaCleanup && BOT.betaCleanup(); }catch(e){}
  BOT.positionCleanup = null; BOT.betaCleanup = null; BOT.betaPut = null; BOT.el = null;
}
function botMount(){
  if (BOT.el || !document.body) return;
  try{ if (sessionStorage.getItem('synthz:bothide') === '1') return; }catch(e){}
  try{ BOT.positionCleanup && BOT.positionCleanup(); }catch(e){}
  BOT.positionCleanup = null;

  /* En SynthFlow el botón visible ya lo ha renderizado React. En páginas antiguas
     se conserva el montaje previo como fallback, sin duplicar IDs. */
  const existing = document.getElementById('szBot');
  const reactOwned = !!(existing && existing.dataset.reactComponent === 'synthonia-avatar');
  const b = existing || document.createElement('button');
  b.id = 'szBot'; b.type = 'button'; b.setAttribute('aria-label', 'SynthonIA'); b.dataset.tip = 'SynthonIA';
  const bf = $('.bf', b);
  if (bf) bf.innerHTML = face('feliz', 40);
  else b.innerHTML = '<span class="bf" aria-hidden="true">' + face('feliz', 40) + '</span><i class="bdot" hidden></i>';

  const mLogo = $('#mLogo');
  if (isFlow() && mLogo && matchMedia('(max-width:760px)').matches){
    b.classList.add('inhead');
    if (reactOwned){
      /* No mover un nodo que pertenece al árbol React. Posición equivalente, anclada
         al logo mediante coordenadas de viewport para que siga siendo responsive. */
      const put = () => {
        const r = mLogo.getBoundingClientRect();
        b.style.position = 'fixed'; b.style.right = 'auto'; b.style.bottom = 'auto';
        b.style.left = Math.max(4, Math.min(innerWidth - 44, r.right + 10)) + 'px';
        b.style.top = Math.max(4, Math.min(innerHeight - 44, r.top + (r.height - 40) / 2)) + 'px';
        if (BOT.betaPut) requestAnimationFrame(BOT.betaPut);
      };
      const onViewport = () => put();
      put(); addEventListener('resize', onViewport); addEventListener('scroll', onViewport, { passive:true });
      /* v3.7 · el nombre «SynthFlow» del logo se pinta después: si el logo crece, la bolita se corre con él (antes quedaba encima del logo en el celular) */
      let ro = null; try{ ro = new ResizeObserver(() => put()); ro.observe(mLogo); }catch(e){} [300, 1200].forEach(t => setTimeout(put, t));
      BOT.positionCleanup = () => { removeEventListener('resize', onViewport); removeEventListener('scroll', onViewport); if (ro) ro.disconnect(); };
      if (document.fonts) document.fonts.ready.then(put);
    } else {
      mLogo.after(b);
      /* Fallback legado para páginas HTML no migradas a React. */
      const put = () => { const h = mLogo.offsetParent; if (h && getComputedStyle(h).position === 'static') h.style.position = 'relative'; b.style.left = (mLogo.offsetLeft + mLogo.offsetWidth + 10) + 'px'; b.style.top = (mLogo.offsetTop + (mLogo.offsetHeight - 40) / 2) + 'px'; };
      put(); addEventListener('resize', put); BOT.positionCleanup = () => removeEventListener('resize', put); if (document.fonts) document.fonts.ready.then(put);
    }
  }
  else {
    if (!reactOwned){
      /* Fallback: en SynthFlow React suministra el host; en páginas aún antiguas va al body. */
      const reactHost = isFlow() ? document.getElementById('synthonIA-react-host') : null;
      (reactHost || document.body).appendChild(b);
    }
    try{ const pos = JSON.parse(localStorage.getItem('synthz:botpos') || 'null'); if (pos && pos.x > 0 && pos.y > 0){ b.style.right = 'auto'; b.style.bottom = 'auto'; b.style.left = Math.min(innerWidth - 70, pos.x) + 'px'; b.style.top = Math.min(innerHeight - 70, pos.y) + 'px'; } }catch(e){}
  }
  BOT.el = b;
  requestAnimationFrame(() => { b.classList.add('on'); betaBot(); });
  /* Se puede arrastrar (en computador); React conserva el control del nodo y del clic. */
  let drag = null;
  if (b.dataset.synthoniaPointerBound !== '1') b.addEventListener('pointerdown', e => { if (b.classList.contains('inhead') || e.button) return; drag = { x:e.clientX, y:e.clientY, l:b.getBoundingClientRect().left, t:b.getBoundingClientRect().top, moved:false }; b.setPointerCapture(e.pointerId); });
  if (b.dataset.synthoniaPointerBound !== '1') b.addEventListener('pointermove', e => { if (!drag) return; if (BOT.betaPut) requestAnimationFrame(BOT.betaPut); const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.hypot(dx, dy) < 6) return; drag.moved = true; b.classList.add('drag'); b.style.right = 'auto'; b.style.bottom = 'auto'; b.style.left = clamp(drag.l + dx, 6, innerWidth - 66) + 'px'; b.style.top = clamp(drag.t + dy, 6, innerHeight - 66) + 'px'; if (BOT.open) botPlace(); });
  if (b.dataset.synthoniaPointerBound !== '1') b.addEventListener('pointerup', () => { if (BOT.betaPut) setTimeout(BOT.betaPut, 50); if (!drag) return; const m = drag.moved; drag = null; b.classList.remove('drag'); if (m){ const r = b.getBoundingClientRect(); try{ localStorage.setItem('synthz:botpos', JSON.stringify({ x:r.left, y:r.top })); }catch(e){} b._skip = true; setTimeout(() => { b._skip = false; }, 50); } });
  if (b.dataset.synthoniaPointerBound !== '1') b.dataset.synthoniaPointerBound = '1';
  if (!reactOwned && !b.dataset.synthoniaClickBound){ b.addEventListener('click', botAvatarClick); b.dataset.synthoniaClickBound = '1'; }
  setTimeout(botSync, 1200);
}

/* v1.4: la carita cambia suave (una se desvanece y la otra aparece), y si está «pegada» (triste) no cambia */
function botZone(e){
  const r = BOT.el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  const fx = (x - .5) / .667 + .5, fy = (y - .5) / .667 + .5;          /* a coordenadas de la carita (0–1) */
  if (Math.hypot(fx - .40, fy - .52) < .085 || Math.hypot(fx - .60, fy - .52) < .085) return 'eye';
  if (fy < .22) return 'top';
  if (fy > .58 && fy < .72 && (fx < .38 || fx > .62)) return 'cheek';
  if (fy > .6 && fy < .8) return 'mouth';
  return '';
}
function botFace(mood, force){
  if (!BOT.el) return;
  if (BOT.sticky && !force && mood !== BOT.sticky) return;
  if (BOT.el.classList.contains('pix') && !force){ BOT.mood = mood; return; }
  const bf = $('.bf', BOT.el); if (!bf) return;
  if (BOT.mood === mood && !force && bf.querySelector('.szface')) return;
  BOT.mood = mood;
  const old = [...bf.children], n = document.createElement('span'); n.className = 'bfl in'; n.innerHTML = face(FACE[mood] ? mood : 'feliz', 40); bf.appendChild(n);
  old.forEach(o => { o.classList.add('out'); setTimeout(() => o.remove(), 380); });
  requestAnimationFrame(() => requestAnimationFrame(() => n.classList.remove('in')));
}
/* las caras las hace ella: los emojis de sus frases se quitan y se vuelven su expresión */
const EMO = [[/[😂🤣😄😆😁😅😹]/u, 'riendo'], [/[😴💤]/u, 'dormida'], [/[👀😮😲🤯✨]/u, 'sorprendida'], [/[😕😔😢🙏]/u, 'disculpa'], [/[😎💪🔥]/u, 'flow'], [/[💛❤️😍🥰]/u, 'encantada'], [/[😉😜]/u, 'guino'], [/[⏳🤔]/u, 'pensando'], [/[👋🙂😊]/u, 'feliz']];
function demoji(t){ let mood = null; for (const [rx, m] of EMO) if (rx.test(t)){ mood = m; break; } const E = '(?:\\p{Extended_Pictographic}|\\p{Emoji_Presentation}|[\\u2600-\\u27BF])(?:\\uFE0F|\\u20E3|\\u200D(?:\\p{Extended_Pictographic}|[\\u2600-\\u27BF])\\uFE0F?)*';
  t = String(t).replace(new RegExp('([^\\s.!?…:,;])\\s*(?:' + E + ')+\\s+(?=[A-ZÁÉÍÓÚÑ¿¡])', 'gu'), '$1. ');
  return { text:String(t).replace(/\s*(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u2600-\u27BF])(?:\uFE0F|\u20E3|\u200D(?:\p{Extended_Pictographic}|[\u2600-\u27BF])\uFE0F?)*/gu, '').replace(/[ \t]{2,}/g, ' ').replace(/\s+([.,!?…])/g, '$1').trim(), mood }; }
/* mientras piensa, su carita se vuelve píxeles y dibuja 2 o 3 pixel arts */
function pixFace(on){
  if (!BOT.el) return;
  if (BOT.pxb){ BOT.pxb.stop(); BOT.pxb = null; }
  const bf = $('.bf', BOT.el);
  if (on){ BOT.el.classList.add('pix'); const n = document.createElement('span'); n.className = 'bfl pxface in'; n.innerHTML = pixelGrid(); [...bf.children].forEach(o => { o.classList.add('out'); setTimeout(() => o.remove(), 380); }); bf.appendChild(n); requestAnimationFrame(() => requestAnimationFrame(() => n.classList.remove('in'))); BOT.pxb = pixelRun(n); BOT.pxb.speed(3); }
  else { BOT.el.classList.remove('pix'); const m = BOT.mood || 'feliz'; BOT.mood = null; botFace(m, true); }
}
async function botThink(work){
  const ms = 3000 + Math.random() * 2000;
  BOT.think = true; BOT.zen = false; pixFace(true); botRender();
  try{ const [r] = await Promise.all([work ? work() : Promise.resolve(null), sleepRaw(ms)]); return r; }
  finally{ BOT.think = false; if (BOT.pxm){ BOT.pxm.stop(); BOT.pxm = null; } pixFace(false); }
}
function botBubble(text, ms){
  if (!BOT.el || BOT.open || document.querySelector('#vintro,#intro,#portal')) return; let bb = $('#szBotB'); if (!bb){ bb = document.createElement('div'); bb.id = 'szBotB'; document.body.appendChild(bb); }
  const D = demoji(text), md = D.mood || BOT.mood || 'feliz';
  bb.innerHTML = '<span class="bbf">' + face(md, 52) + '</span><p></p>'; $('p', bb).innerHTML = synMd(D.text);
  bb.classList.toggle('big', BOT.el.classList.contains('g2'));
  const r = botAt().getBoundingClientRect(), W = Math.min(BOT.el.classList.contains('g2') ? 380 : 330, innerWidth - 24);
  bb.style.width = W + 'px'; bb.style.left = clamp(r.left + r.width / 2 - W / 2, 12, innerWidth - W - 12) + 'px';
  const up = r.top > 140; bb.style.top = up ? 'auto' : (r.bottom + 12) + 'px'; bb.style.bottom = up ? (innerHeight - r.top + 12) + 'px' : 'auto'; bb.classList.toggle('dn', !up);
  bb.classList.remove('on'); void bb.offsetWidth; bb.classList.add('on'); clearTimeout(bb._t); bb._t = setTimeout(() => bb.classList.remove('on'), (ms || 5200) + Math.min(3000, D.text.length * 18));
  typeIn($('p', bb), { cps:45, max:4, onFrame:lipSync([$('.bbf .szface', bb), ballFace()], D.text) }).catch(() => {});
}
function botPlace(){
  const P = BOT.panel, b = BOT.el && botAt(); if (!P || !b) return;
  if (matchMedia('(max-width:760px)').matches){ P.classList.add('sheet'); P.style.left = P.style.top = P.style.right = P.style.bottom = ''; return; }
  P.classList.remove('sheet');
  const r = b.getBoundingClientRect(), W = Math.min(390, innerWidth - 24), H = Math.min(560, innerHeight - 40);
  P.style.width = W + 'px'; P.style.height = H + 'px';
  if (b !== BOT.el){
    /* junto a SynthonIA (del lado con más espacio), sin taparla */
    const R = innerWidth - r.right, L = r.left, top = Math.min(84, innerHeight - H - 12);
    /* si no cabe al lado sin tapar el título, ella la sostiene: la ventanita sale debajo de su cara */
    if (Math.max(R, L) < W + 28 || r.width > 220){ P.style.left = clamp(r.left + r.width / 2 - W / 2, 12, innerWidth - W - 12) + 'px'; P.style.top = clamp(r.top + Math.min(150, r.height * .42), top, innerHeight - H - 12) + 'px'; return; }
    const x = R >= L ? r.right + 14 : r.left - W - 14;
    P.style.left = clamp(x, 12, innerWidth - W - 12) + 'px'; P.style.top = clamp(r.top + r.height / 2 - H / 2, top, innerHeight - H - 12) + 'px'; return;
  }
  P.style.left = clamp(r.right - W, 12, innerWidth - W - 12) + 'px';
  P.style.top = (r.top - H - 14 > 12 ? r.top - H - 14 : clamp(r.bottom + 14, 12, innerHeight - H - 12)) + 'px';
}
function botToggle(force){ const on = force == null ? !BOT.open : force; if (on) botOpen(); else botClose(); }
function botOpen(){
  if (!BOT.el) botMount(); if (!BOT.el) return;
  if (BOT.panel){ BOT.open = true; BOT.panel.classList.add('on'); botPlace(); return; }
  const P = document.createElement('div'); P.id = 'szBotP'; P.setAttribute('role', 'dialog'); P.setAttribute('aria-label', 'SynthonIA');
  P.innerHTML = '<div class="bh"><span class="bhf">' + face('feliz', 56) + '</span><div><b>SynthonIA</b><small><i></i>Siempre disponible</small></div><button type="button" class="bx" data-b="min" aria-label="Cerrar">×</button></div>'
    + '<div class="btabs" hidden><button type="button" data-bt="chat" aria-selected="true">Pregúntame</button><button type="button" data-bt="inbox" aria-selected="false">Bandeja <em class="bn"></em></button></div>'
    + '<div class="bl" aria-live="polite"></div><div class="bq"></div>'
    + '<form class="bin"><input type="text" maxlength="600" placeholder="Pregúntame lo que quieras…" aria-label="Pregúntale a SynthonIA" autocomplete="off"><button type="submit" class="bs" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></form>'
    + '<div class="bfoot"><button type="button" class="lnk" data-b="team">Hablar con el equipo</button><button type="button" class="lnk" data-b="fb">Cuéntanos qué mejorar</button><button type="button" class="lnk" data-b="hide">Esconder</button></div>';
  document.body.appendChild(P); BOT.panel = P; BOT.open = true; botPlace();
  requestAnimationFrame(() => P.classList.add('on'));
  P.addEventListener('click', botClick);
  $('.bin', P).addEventListener('submit', e => { e.preventDefault(); const i = $('.bin input', P), v = i.value.trim(); if (!v) return; i.value = ''; BOT.mode === 'team' || BOT.mode === 'reply' ? botTeamSay(v) : botAsk(v); });
  addEventListener('resize', botPlace);
  botRender();
  if (!BOT.hist.length) botSay('¡Hola! Soy SynthonIA. Estoy aquí para que nunca te pierdas: pregúntame cómo se hace algo o dónde está, y te lo explico fácil o te lo señalo con mi manita.', 'feliz');
}
function botClose(){ BOT.open = false; if (BOT.think) BOT.zen = true; if (BOT.panel) BOT.panel.classList.remove('on'); }
function botMsgHtml(m){
  if (m.role === 'user') return '<div class="bm u"><p>' + esc(m.content) + '</p></div>';
  if (m.role === 'team') return '<div class="bm t"><span class="rk r-' + esc(String(m.rank || '').toLowerCase()) + '">' + esc(m.rank || 'Equipo') + '</span><b>' + esc(m.name || '') + '</b><p>' + esc(m.content) + '</p></div>';
  return '<div class="bm a"><span class="mf">' + face(m.mood || 'feliz', 36) + '</span><div><p>' + synMd(m.content) + '</p>' + (m.btn ? '<button type="button" class="btn sm ghost" data-ba="' + esc(m.btn[0]) + '">' + esc(m.btn[1]) + '</button>' : '') + '</div></div>';
}
function botRender(){
  const P = BOT.panel; if (!P) return;
  const team = BOT.team;
  $('.btabs', P).hidden = !team; $$('.btabs button', P).forEach(x => x.setAttribute('aria-selected', String(x.dataset.bt === (BOT.mode === 'inbox' || BOT.mode === 'reply' ? 'inbox' : 'chat'))));
  const nOpen = BOT.inbox.filter(r => r.status === 'open').length; const bn = $('.bn', P); if (bn) bn.textContent = nOpen ? nOpen : '';
  const L = $('.bl', P), Q = $('.bq', P), inp = $('.bin input', P);
  if (BOT.mode === 'inbox'){
    L.innerHTML = BOT.inbox.length ? BOT.inbox.map(r => '<button type="button" class="bi' + (r.urgent ? ' urg' : '') + '" data-bi="' + esc(r.id) + '"><b>@' + esc(r.user.username || r.user.name) + '</b><span>' + esc(r.text) + '</span><small>' + (r.status === 'open' ? (r.urgent ? '⏰ esperando +15 min' : 'nuevo') : r.status === 'taken' ? 'con ' + esc((r.by || {}).name || '') : 'terminado') + ' · ' + agoS(r.last) + '</small></button>').join('') : '<p class="bempty">No hay pedidos de ayuda. ✨</p>';
    Q.innerHTML = ''; $('.bin', P).hidden = true; return;
  }
  $('.bin', P).hidden = false;
  if (BOT.mode === 'reply' && BOT.cur){
    const r = BOT.cur;
    L.innerHTML = '<div class="bctx"><button type="button" class="lnk" data-b="back">← Bandeja</button><span>@' + esc(r.user.username || r.user.name) + (r.page ? ' · ' + esc(r.page) : '') + '</span>' + (r.status !== 'done' ? '<button type="button" class="lnk" data-b="done">Terminar</button>' : '') + '</div>'
      + r.msgs.map(m => botMsgHtml(m.from === 'team' ? { role:'team', name:m.name, rank:m.rank, content:m.text } : { role:'user', content:m.text })).join('');
    Q.innerHTML = ''; inp.placeholder = 'Responde como ' + (SZ_RANK() || 'equipo') + '…';
  } else if (BOT.mode === 'team' && BOT.help && !CW.el){
    const r = BOT.help;
    L.innerHTML = '<div class="bctx"><button type="button" class="lnk" data-b="ia">← SynthonIA</button><span>' + (r.status === 'open' ? (r.urgent ? 'Contactando a un Prime, ZFlow o Symmetrix…' : 'El equipo ya recibió tu mensaje') : r.status === 'taken' ? 'Te atiende ' + esc((r.by || {}).name || '') + ' (' + esc((r.by || {}).rank || '') + ')' : 'Conversación terminada') + '</span>' + (r.status !== 'done' ? '<button type="button" class="lnk" data-b="end">Terminar</button>' : '') + '</div>'
      + r.msgs.map(m => botMsgHtml(m.from === 'team' ? { role:'team', name:m.name, rank:m.rank, content:m.text } : { role:'user', content:m.text })).join('')
      + (r.status === 'open' ? botMsgHtml({ role:'assistant', mood:r.urgent ? 'pensando' : 'esperando', content:r.urgent ? 'Ya pasaron más de 15 minutos: estoy avisando otra vez a un Prime, ZFlow o Symmetrix. ¡No te vas a quedar sin respuesta!' : 'Le avisé al equipo. Siempre hay alguien disponible; te respondo aquí mismo apenas escriban (puedes seguir usando SynthFlow).' }) : '');
    Q.innerHTML = ''; inp.placeholder = r.status === 'done' ? 'Escribe para abrir una conversación nueva…' : 'Escríbele al equipo…';
  } else {
    BOT.mode = 'chat';
    L.innerHTML = BOT.hist.map(botMsgHtml).join('') + (BOT.think ? '<div class="bm a"><span class="mf pxmf">' + pixelGrid() + '</span><div><p class="dots"><i></i><i></i><i></i></p></div></div>' : '');
    Q.innerHTML = BOT.hist.length > 6 ? '' : BOT_QUICK.map(([i, l]) => '<button type="button" data-bf="' + i + '">' + esc(l) + '</button>').join('');
    inp.placeholder = 'Pregúntame lo que quieras…';
  }
  L.scrollTop = L.scrollHeight;
  if (BOT.pxm){ BOT.pxm.stop(); BOT.pxm = null; }
  const pm = BOT.think && $('.pxmf', L); if (pm){ BOT.pxm = pixelRun(pm); BOT.pxm.speed(3); }
}
const SZ_RANK = () => { const r = ACC.user && ACC.user.role; return { owner:'Prime', admin:'ZFlow', staff:'Symmetrix' }[r] || ''; };
const agoS = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'ahora' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.round(m / 60) + ' h' : 'hace ' + Math.round(m / 1440) + ' d'; };
function botSay(text, mood, btn){
  if (B.LANG === 'en') text = trStr(text);   /* v3.0 · en inglés, lo suyo sale traducido (lo de las personas nunca se toca) */
  const D = demoji(text); mood = mood || D.mood || 'feliz';
  BOT.hist.push({ role:'assistant', content:D.text, mood, btn }); BOT.hist = BOT.hist.slice(-30); botFace(mood); SND.blip(mood); botRender();
  /* en la ventanita, su último mensaje se escribe mientras mueve la boca */
  if (BOT.open && BOT.panel){ const L = $$('.bl .bm.a', BOT.panel), last = L[L.length - 1], p = last && $('p', last); if (p) setTimeout(() => typeIn(p, { cps:45, max:4.5, onFrame:lipSync([$('.mf .szface', last), ballFace()], D.text) }).catch(() => {}), 80); }
  /* si cerraste la ventanita mientras pensaba: «Ten paciencia… modo zen…» y luego la respuesta */
  if (!BOT.open && BOT.zen){ BOT.zen = false; botFace('dormida', true); botBubble('Ten paciencia… modo zen…', 1900); setTimeout(() => { botFace(mood, true); botBubble(D.text.length > 240 ? D.text.slice(0, 236) + '…' : D.text, 8000); }, 2000); }
}
/* respuesta guardada: si dice «dónde», la manita lo señala */
async function botAnswer(f){
  if (f.joke || f.fact){ const t = await botThink(() => f.joke ? BOTAPI.joke() : BOTAPI.fact()); return botSay((f.fact ? '¿Sabías que…? ' : '') + t, f.joke ? 'riendo' : 'sorprendida'); }
  await botThink();
  botSay(B.LANG === 'en' && f.en ? f.en : f.a, f.mood || (f.go ? 'senalando' : 'feliz'), f.act ? [f.act, f.lbl] : null);
  if (f.wave && HAND && BOT.el){ const r0 = BOT.el.getBoundingClientRect(); HAND.show({ x:r0.left + r0.width / 2, y:r0.top - 10 }); await HAND.moveTo({ x:clamp(r0.left - 40, 40, innerWidth - 40), y:clamp(r0.top - 50, 40, innerHeight - 40) }, { shape:'palm' }); await HAND.wave(2); HAND.hide(); return; }
  if (f.tour === 'coins' && HAND && $('#railTog') && $('#railCoin') && !matchMedia('(max-width:760px)').matches) return coinsTour();
  if (f.pre && f.go){ await sleepRaw(400); try{ f.pre(); }catch(e){} await sleepRaw(650); }   /* v3.0 · abre Ajustes (u otra cosa) para señalar lo de adentro */
  const t = f.go && vis(f.go);
  if (t && HAND){
    await sleepRaw(500);
    const wasOpen = BOT.open; if (matchMedia('(max-width:760px)').matches) botClose();
    const r0 = BOT.el ? BOT.el.getBoundingClientRect() : { left:innerWidth / 2, top:innerHeight / 2, width:0, height:0 };
    HAND.show({ x:r0.left + r0.width / 2, y:r0.top + r0.height / 2 });
    await HAND.moveTo(t, { shape:'point' }); HAND.spot(t, 6); await HAND.click(null);
    await sleepRaw(1700); HAND.unspot(); HAND.hide();
    if (wasOpen && !BOT.open) botOpen();
  }
}
/* «¿Dónde están los SynXCoin's?»: con la barrita cerrada están abajo (solo el icono); al abrirla se ve cuántos llevas */
async function coinsTour(){
  const tog = $('#railTog'), coin = $('#railCoin'), rail = $('#rail'), wasOpen = rail && rail.classList.contains('open');
  await sleepRaw(500);
  const wasBot = BOT.open; botClose();
  const r0 = BOT.el ? BOT.el.getBoundingClientRect() : { left:innerWidth / 2, top:innerHeight / 2, width:0, height:0 };
  HAND.show({ x:r0.left + r0.width / 2, y:r0.top + r0.height / 2 });
  const point = async (txt, mood) => { await sleepRaw(80); HAND.spot(coin, 6); await HAND.moveTo(coin, { shape:'point', fx:wasOpenNow() ? .2 : .5 }); await HAND.click(null); await HAND.talk(txt, { near:coin, side:true, mood:mood || 'senalando', buttons:[{ label:'Siguiente' }], auto:5200 }); HAND.unspot(); };
  const wasOpenNow = () => rail && rail.classList.contains('open');
  const flip = async () => { HAND.quiet(); await HAND.moveTo(tog, { shape:'point' }); await HAND.click(tog, { real:true }); await sleepRaw(720); };
  if (!wasOpen){
    await point('Con la barrita cerrada, tu EnerX de hoy está aquí abajo: se va descargando mientras chateas.');
    await flip(); await point('Y si abres la barrita, ves el porcentaje. Tócalo para ver el detalle.', 'guino');
    await flip();
  } else {
    await point('Aquí, en la barrita, ves cómo va tu EnerX de hoy. Tócalo para ver el detalle.');
    await flip(); await point('Y con la barrita cerrada sigue aquí abajo: la pila se va descargando.', 'guino');
    await flip();
  }
  HAND.quiet(); HAND.hide();
  if (wasBot && !BOT.open) botOpen();
}
const TASKY = /\b(escrib[ea]me|redacta|resuelve|resolver|calcula|codigo|programa(me)?|funcion|script|python|javascript|html|css|sql|tarea|deberes|ensayo|resumen de|resume|traduce|traducir|corrige|ecuacion|derivada|integral|examen|plan de|haz(me)? un|crea(me)? un|genera)\b/;
async function botAsk(q){
  BOT.hist.push({ role:'user', content:q }); botRender();
  const f = botMatch(q); if (f) return botAnswer(f);
  /* SynthonIA no hace tareas, código ni trabajos: eso es para las IAs del chat */
  if (TASKY.test(fold(q)) || q.length > 220){ BOT.pendingQ = q; await botThink(); return botSay('Eso es trabajo para las IAs de SynthFlow 💪 Yo te ayudo con la página, y con chistes o datos curiosos. ¿Te lo dejo listo en la caja del chat?', 'guino', ['tochat', 'Sí, llévalo al chat']); }
  try{
    const res = await botThink(async () => { const r = await fetch('/api/help', { method:'POST', headers:Object.assign({ 'content-type':'application/json' }, B.SESS ? { authorization:'Bearer ' + B.SESS } : {}), body:JSON.stringify({ action:'ask', q, lang:B.LANG, mem:memList ? memList() : [], hist:BOT.hist.slice(-7, -1).filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role:m.role, content:m.content })) }) });
    const d = await r.json().catch(() => ({})); return { r, d }; });
    const { r, d } = res;
    if (!r.ok) return botSay(d.error || 'No pude pensar una respuesta ahora. Mira la Guía o habla con el equipo.', 'disculpa', ['team', 'Hablar con el equipo']);
    /* v3.0 · si la IA dice [ver:lugar], la manita lo señala */
    const pm = String(d.text || '').match(/\[ver:(\w+)\]/), place = pm && BOT_PLACES[pm[1]];
    /* v3.7 · si le faltaron al respeto, pone el límite con cara seria (sin señalar nada) */
    if (d.bound) return botSay(String(d.text || ''), 'neutral');
    botSay(String(d.text || '').replace(/\s*\[ver:\w+\]/g, '').trim() + (d.left <= 3 ? '\n\n' + (B.LANG === 'en' ? '(You have ' + d.left + ' new questions left today.)' : '(Te quedan ' + d.left + ' preguntas nuevas hoy.)') : ''), place ? 'senalando' : 'feliz');
    if (place) botAnswer({ a:'', go:place, point:true });
    if (d.remember) memAsk(String(d.remember));
  }catch(e){ botSay('No pude conectarme. Revisa tu internet e intenta otra vez.', 'disculpa'); }
}
/* v3.7 · memoria: SynthonIA propone recordar algo que vale la pena y PREGUNTA; nada se guarda sin el «Sí» de la persona */
function memAsk(fact){
  if (!memAddCore || !memList) return;
  BOT.memQ = BOT.memQ || {}; const id = 'mem:' + Date.now().toString(36); BOT.memQ[id] = fact;
  setTimeout(() => botSay((B.LANG === 'en' ? 'Should I remember this for next time? «' : '¿Lo recuerdo para la próxima? «') + fact + '»', 'pensando', [id, B.LANG === 'en' ? 'Yes, remember it' : 'Sí, recuérdalo']), 900);
}
function memYes(id){
  const fact = BOT.memQ && BOT.memQ[id]; if (!fact) return; delete BOT.memQ[id];
  BOT.hist.forEach(m => { if (m.btn && m.btn[0] === id) m.btn = null; });
  if (memAddCore(fact)) botSay(B.LANG === 'en' ? 'Done, I\'ll remember it. You can see it or forget it anytime in Settings › AIs and memory.' : 'Listo, lo recuerdo. Lo ves o lo olvidas cuando quieras en Ajustes › IAs y memoria.', 'encantada');
}
function botAct(a){
  if (a.startsWith('mem:')) return memYes(a);
  if (BOT.acts && BOT.acts[a]){ const fn = BOT.acts[a]; delete BOT.acts[a]; botClose(); try{ fn(); }catch(e){} return; }
  if (a === 'tochat'){ const q = BOT.pendingQ || ''; botClose(); if (isFlow()){ const i = document.getElementById('inp'); if (i){ i.value = q; i.dispatchEvent(new Event('input', { bubbles:true })); i.focus(); } } else { try{ sessionStorage.setItem('synthz:q', JSON.stringify({ q, t:Date.now() })); }catch(e){} portalOut('chat.html'); } return; }
  if (a === 'guide'){ botClose(); const g = $('#guideTop') || $('#helpBtn'); if (g) g.click(); }
  else if (a === 'conn' && !isFlow()){ botClose(); SZ.portalOut ? SZ.portalOut('chat.html?conn=1') : (location.href = 'chat.html?conn=1'); }
  else if (a === 'conn'){ botClose(); const x = document.createElement('a'); x.setAttribute('data-conn', ''); document.body.appendChild(x); x.click(); x.remove(); }
  else if (a === 'team') botTeam();
  else if (a === 'login'){ botClose(); const b = $('#accBtn') || $('[data-tab="me"]'); if (b) b.click(); }
}
/* ===== v3.0 · SynthonIA se sabe toda la página (en español y en inglés) y te señala cada cosa =====
   Cada entrada: k = palabras que la activan (es + en, sin tildes), a = respuesta, en = respuesta en inglés,
   go = dónde señala (el primero que se vea), pre = qué abre antes de señalar (por ejemplo Ajustes).
   Cuando agregues algo a la página, agrégalo aquí también: así SynthonIA nunca queda desactualizada. */
const openCfg = tab => () => { if (!$('.szm.cfg, #cfgPane, .cfgtabs')) cfgModal(tab); };
const inFlow = () => isFlow();
BOT_FAQ.push(
  { k:'proyecto proyectos carpeta tesis negocio instrucciones conocimiento project projects folder knowledge',
    a:'En «Proyectos» juntas chats, instrucciones y archivos de un mismo tema (tu tesis, tu negocio…). Le das las instrucciones y los archivos una vez y la IA los tiene en cuenta en cada chat del proyecto. Está en la barrita, debajo de «Nuevo chat».',
    en:'In «Projects» you bring together chats, instructions and files on one topic (your thesis, your business…). You give it the instructions and files once and the AI keeps them in mind in every chat of the project. It\'s in the bar, under «New chat».', go:['#railProj', '#cProj'] },
  { k:'sintetico sinteticos artefacto artefactos pagina juego dibujo vista previa lado synthetic synthetics artifact artifacts preview',
    a:'Los Sintéticos son lo que la IA crea para ti: páginas, juegos, dibujos o documentos. Cuando la respuesta termina, se abren solos al lado del chat (como en Claude) y corren aparte, seguros. Todos quedan juntos en «Sintéticos», en la barrita.',
    en:'Synthetics are what the AI creates for you: pages, games, drawings or documents. When the answer finishes, they open by themselves next to the chat (like in Claude) and run separately, safely. They\'re all together in «Synthetics», in the bar.', go:['#railSyn', '#cSyn'] },
  { k:'idioma ingles espanol english spanish language languages change traducir traduccion idioma',
    a:'Puedes poner toda la página en inglés o en español: Ajustes › Página › «Idioma · Language», o en el menú «⋯» de arriba. Cambia al instante.',
    en:'You can switch the whole page to English or Spanish: Settings › Page › «Language · Idioma», or in the «⋯» menu at the top. It changes instantly.', pre:openCfg(), go:['#cfgLang', '#cfgBtn', '[data-tab="cfg"]'] },
  { k:'tamano tamaño compacto normal grande pequeno pequena pequeña achicar reducir agrandar zoom letra size compact bigger smaller',
    a:'En Ajustes › Página › «Tamaño de SynthFlow» eliges Compacto (todo un poco más pequeño, ves más chat) o Normal (el tamaño grande).',
    en:'In Settings › Page › «SynthFlow size» you pick Compact (everything a bit smaller, you see more chat) or Normal (the big size).', pre:openCfg(), go:['#cfgSz', '#cfgBtn', '[data-tab="cfg"]'] },
  { k:'color tema temas oceano bosque lavanda atardecer theme colors ocean forest lavender',
    a:'En Ajustes › Página › «Color de SynthFlow» eliges el color: SymphorIA, Océano, Bosque, Atardecer o Lavanda.',
    en:'In Settings › Page › «SynthFlow color» you choose the color: SymphorIA, Ocean, Forest, Sunset or Lavender.', pre:openCfg(), go:['#cfgTh', '#cfgBtn', '[data-tab="cfg"]'] },
  { k:'simple estilo tranquilo sin efectos style calm plain',
    a:'El estilo «Simple» deja solo tus chats, la caja de escribir y las respuestas, tranquilo y sin efectos. Está en Ajustes › Página › «Estilo de SynthFlow».',
    en:'The «Simple» style leaves just your chats, the text box and the answers, calm and with no effects. It\'s in Settings › Page › «SynthFlow style».', pre:openCfg(), go:['#cfgUi', '#cfgBtn', '[data-tab="cfg"]'] },
  { k:'nuevo chat empezar otro conversacion nueva limpiar new chat start fresh',
    a:'Para empezar de cero toca «Nuevo chat», arriba en la barrita. El chat anterior queda guardado en «Mis chats».',
    en:'To start fresh tap «New chat», at the top of the bar. The previous chat stays saved in «My chats».', go:['#cNew', '[data-r="new"]'] },
  { k:'buscar busqueda encontrar chat viejo search find old chat',
    a:'Con la lupa de la barrita buscas en todos tus chats: en los títulos y dentro de cada mensaje.',
    en:'With the magnifying glass in the bar you search all your chats: in the titles and inside every message.', go:['[data-r="search"]', '#thQ', '#cSearch'] },
  { k:'escribir enviar mensaje caja preguntar enter write send message box ask type',
    a:'Escribes abajo, en la caja, y envías con la flecha (o con Enter en el computador). Entre más detalles le des, mejor te responde.',
    en:'You write below, in the box, and send with the arrow (or Enter on a computer). The more details you give, the better it answers.', go:['#inp', '#composer'] },
  { k:'imagen crear dibujar generar foto ilustracion image create draw generate picture',
    a:'En el «+» de la caja de escribir está «Crear una imagen»: describes lo que quieres ver y la IA la dibuja (necesitas tu cuenta gratis).',
    en:'In the «+» of the text box there\'s «Create an image»: describe what you want to see and the AI draws it (you need your free account).', go:['#attachBtn'] },
  { k:'internet buscar web noticias hoy fuentes actual web search news sources today',
    a:'En el «+» está «Buscar en internet»: la IA busca datos de hoy y te muestra de dónde los sacó. Si preguntas por algo de hoy, busca sola.',
    en:'In «+» there\'s «Search the web»: the AI looks up today\'s data and shows you where it got it. If you ask about something current, it searches by itself.', go:['#attachBtn'] },
  { k:'cortas cortos breve resumido ahorro ahorrar short brief saver save',
    a:'«Respuestas cortas» (la hojita 🍃 junto a la caja) hace que la IA responda más corto y gastes menos de tu EnerX de hoy.',
    en:'«Short answers» (the little leaf 🍃 next to the box) makes the AI answer shorter so you use less of your EnerX today.', go:['#saverBtn', '#attachBtn'] },
  { k:'esfuerzo pensar piensa razonar rapido veloz profundo creativo alto medio bajo effort think reasoning fast deep creative',
    a:'El botón de esfuerzo, junto a la caja, dice cómo piensa la IA: Auto (ella decide), Veloz (rápido y corto), Profundo (piensa a fondo y revisa; es el que más EnerX gasta y es con cuenta) o Creativo (ideas originales).',
    en:'The effort button, next to the box, sets how the AI thinks: Auto (it decides), Fast (quick and short), Deep (thinks hard and checks; it uses the most EnerX and needs an account) or Creative (original ideas).', go:['#cEffort'] },
  { k:'modo automatica automatico chat superiorsynth mode automatic',
    a:'El botón de modo, junto a la caja, tiene 3: «Automática» (elige sola la mejor IA libre), «Chat» (tú eliges la IA) y «SuperiorSynth» (mejora tu pedido y elige la IA que más sabe).',
    en:'The mode button, next to the box, has 3: «Automatic» (picks the best free AI by itself), «Chat» (you pick the AI) and «SuperiorSynth» (improves your request and picks the AI that knows the most).', go:['#cMode'] },
  { k:'memoria recordar recuerdas olvidar datos mios memory remember forget',
    a:'Si escribes «recuerda que…», te pregunto si lo guardo. Lo que recuerdo de ti lo ves y lo borras en Ajustes › IAs y memoria.',
    en:'If you write «remember that…», I ask whether to save it. You see and delete what I remember about you in Settings › AIs and memory.', pre:openCfg('mem'), go:['[data-pane="ia"]', '#cfgBtn', '[data-tab="cfg"]'] },
  { k:'presentacion diapositivas powerpoint pptx slides presentation deck',
    a:'Escribe «hazme una presentación de…» y la IA te la entrega con vista previa, lista para descargar en PowerPoint.',
    en:'Write «make me a presentation about…» and the AI hands it to you with a preview, ready to download as PowerPoint.', go:['#inp'] },
  { k:'escuchar voz leer audio hablar en voz alta listen voice read aloud',
    a:'Debajo de cada respuesta está «Escuchar»: te la lee en voz alta.',
    en:'Under every answer there\'s «Listen»: it reads it aloud to you.', go:['.m.bot .acts [data-a="voice"]', '#msgs'] },
  { k:'otra vez regenerar otra respuesta repetir again regenerate another answer',
    a:'Con «Otra vez», debajo de la respuesta, la IA vuelve a responder con otras palabras (cuenta como un mensaje).',
    en:'With «Again», under the answer, the AI answers again with other words (it counts as one message).', go:['.m.bot.last .acts', '#msgs'] },
  { k:'copiar descargar exportar conversacion texto copy download export conversation',
    a:'En el menú «⋯» de arriba copias la conversación o la descargas como texto. Cada respuesta también tiene «Copiar».',
    en:'In the «⋯» menu at the top you copy the conversation or download it as text. Each answer also has «Copy».', go:['#moreBtn'] },
  { k:'borrar eliminar chat conversacion delete remove chat',
    a:'Para borrar el chat abierto: menú «⋯» › «Borrar este chat». En «Mis chats» también puedes borrar cualquiera con su papelera.',
    en:'To delete the open chat: «⋯» menu › «Delete this chat». In «My chats» you can also delete any of them with its trash can.', go:['#moreBtn'] },
  { k:'codigo revisar arreglar errores probar consola celular computador code review fix errors test console',
    a:'Cuando la IA te da una página, SynthFlow la prueba sola en computador y celular, busca errores y, si encuentra, toca «Arreglar con la IA». En la vista previa tienes Computador, Tablet, Celular y Consola.',
    en:'When the AI gives you a page, SynthFlow tests it by itself on desktop and phone, looks for errors and, if it finds some, tap «Fix with the AI». In the preview you have Desktop, Tablet, Phone and Console.' },
  { k:'ranking ciegas batalla votar votos blind battle vote',
    a:'En Comparar puedes poner «A ciegas»: no ves qué IA es hasta que votas. Tu ranking está en el menú «⋯» › «Tu ranking».',
    en:'In Compare you can turn on «Blind»: you don\'t see which AI it is until you vote. Your ranking is in the «⋯» menu › «Your ranking».', go:['#moreBtn'] },
  { k:'equipo equipos compartir openrouter amigos team teams share friends',
    a:'En Tu cuenta › Equipos creas un equipo, invitas a tus amigos por su @usuario y, si quieres, compartes tu OpenRouter sin que vean la llave.',
    en:'In Your account › Teams you create a team, invite your friends by their @username and, if you want, share your OpenRouter without them seeing the key.', go:['#accBtn', '[data-tab="me"]'] },
  { k:'olvide contrasena recuperar codigo recuperacion forgot password recover recovery code',
    a:'Si olvidaste tu contraseña: en «Entrar» toca «¿Olvidaste tu contraseña?» y usa el código de recuperación que guardaste al crear tu cuenta.',
    en:'If you forgot your password: in «Sign in» tap «Forgot your password?» and use the recovery code you saved when you created your account.', go:['#accBtn', '[data-tab="me"]'] },
  { k:'cerrar sesion salir logout sign out',
    a:'Para cerrar sesión abre Tu cuenta (tu foto en la barrita) y toca «Cerrar sesión». También puedes cerrarla en todos tus dispositivos.',
    en:'To sign out open Your account (your photo in the bar) and tap «Sign out». You can also sign out on all your devices.', go:['#accBtn', '[data-tab="me"]'] },
  { k:'opinion sugerencia beta alfa alpha mejorar reportar problema bug feedback suggestion report',
    a:'Toca «ALFA», junto a mí, y cuéntanos qué mejorar o qué falló. Lo lee el equipo de SymphorIA.',
    en:'Tap «ALPHA», next to me, and tell us what to improve or what failed. The SymphorIA team reads it.', go:['.szbeta', '#szBeta', '[data-beta]'] },
  { k:'persona humano equipo soporte contacto hablar alguien human support contact person',
    a:'En mi ventanita está «Hablar con el equipo»: un Prime, ZFlow o Symmetrix te responde aquí mismo, aunque cierres la página (necesitas tu cuenta gratis).',
    en:'In my little window there\'s «Talk to the team»: a Prime, ZFlow or Symmetrix answers you right here, even if you close the page (you need your free account).', act:'team', lbl:'Hablar con el equipo' },
  { k:'novedades nuevo nuevas que hay de nuevo cambios whats new news updates',
    a:'Cuando hay novedades sale un «!» sobre mi cabeza. Tócame y te las cuento.',
    en:'When there\'s news a «!» shows up over my head. Tap me and I\'ll tell you.' },
  { k:'terminos privacidad datos legal politica terms privacy data policy',
    a:'Los Términos y la Privacidad están al pie de la portada. Tus chats son tuyos: se guardan en tu dispositivo y en tu cuenta si entras.',
    en:'The Terms and Privacy are at the bottom of the home page. Your chats are yours: they\'re saved on your device and in your account if you sign in.' },
  { k:'barra lateral abrir cerrar esconder sidebar open close hide',
    a:'El botón de arriba a la izquierda abre o cierra la barra lateral con tus chats.',
    en:'The button at the top left opens or closes the sidebar with your chats.', go:['#railTog', '#navBtn'] },
  { k:'mis chats where chats history my chats saved',
    a:'Tus chats están en «Mis chats», en la barrita (en el celular, la pestaña Chats).',
    en:'Your chats are in «My chats», in the bar (on phones, the Chats tab).', go:['[data-r="chats"]', '[data-tab="chats"]'] },
  { k:'portada inicio volver symphoria home back main page',
    a:'El logo de SymphorIA, arriba en la barrita, te lleva de vuelta a la portada.',
    en:'The SymphorIA logo, at the top of the bar, takes you back to the home page.', go:['#backLink', '#sideZ', '#mLogo'] },
  { k:'alias sintesis combinar combina cuatro ias mejor respuesta mision synthesis combine four best answer',
    a:'En A.L.I.A.S., con Síntesis encendida, 4 IAs hacen el último paso y se combinan en una sola respuesta, la mejor: se queda con lo correcto de cada una, comprueba lo que choca y quita el relleno. Lo que aportó cada una queda plegado debajo.',
    en:'In A.L.I.A.S., with Synthesis on, 4 AIs do the last step and are combined into a single answer, the best one: it keeps what each got right, checks what clashes and cuts the filler. What each one added stays folded below.', go:['a[href*="alias"]'] },
  { k:'pulsem quitar llave borrar key remove delete team',
    a:'En Pulsem (solo para el equipo), en las llaves de las IAs conectadas, cada quien puede quitar la suya con «Quitar». Las de los demás siguen funcionando.',
    en:'In Pulsem (team only), under the connected AIs\' keys, each person can remove theirs with «Remove». The others keep working.', go:['#railPulse'] },
  { k:'groq rapida llave propia fast own key',
    a:'Groq es una opción muy rápida que usa tu propia llave (gratis con límites). Se conecta en Ajustes › IAs y memoria › «Conectar Puter u otra IA».',
    en:'Groq is a very fast option that uses your own key (free with limits). Connect it in Settings › AIs and memory › «Connect Puter or another AI».', pre:openCfg('ia'), go:['[data-pane="ia"]', '#cfgBtn'] },
  { k:'planes plan chispa chispa+ plus syntonia timeless orquesta cuesta cuestan vale valen premium suscripcion pro mejorar cuenta plans subscription upgrade',
    a:'Los planes están en el menú «⋯» › Planes: Chispa (gratis, el de todos), Chispa+, Syntonia, Timeless y Orquesta. Por ahora solo se muestran: los pagos están apagados, así que nadie te cobra nada. Se encenderán cuando la página reciba su primer dinero y se puedan pagar las APIs con él, no antes. El equipo (Prime, ZFlow y Symmetrix) ya tiene Orquesta para probarlo todo.',
    en:'Plans are in the «⋯» menu › Plans: Chispa (free, everyone\'s), Chispa+, Syntonia, Timeless and Orquesta. For now they are only shown: payments are off, so nobody charges you anything. They will turn on when the page gets its first money and the APIs can be paid with it, not before. The team (Prime, ZFlow and Symmetrix) already has Orquesta to test everything.',
    pre:() => { if (!$('#szPlans') && typeof plansModal === 'function') plansModal(); }, go:['#szPlans', '#moreBtn'] },
  { k:'aurora oro negro tema orquesta exclusivo bloqueado candado gold black theme locked',
    a:'Aurora y Oro negro son los colores del plan Orquesta. Si eres del equipo ya los tienes en Ajustes › Página › «Color de SynthFlow»; para los demás salen con candado mientras los pagos estén apagados.',
    en:'Aurora and Black gold are the Orquesta plan colors. If you are on the team you already have them in Settings › Page › «SynthFlow color»; for everyone else they show a lock while payments are off.', pre:openCfg(), go:['#cfgTh', '#cfgBtn', '[data-tab="cfg"]'] },
  { k:'equipo sin limite admin prime zflow symmetrix acceso todo enerx infinita team unlimited full access',
    a:'Prime, ZFlow y Symmetrix tienen acceso a todo, como si tuvieran Orquesta: su EnerX no baja («sin límite · equipo»), A.L.I.A.S. les aparece en el menú «⋯» con 100 veces más pasos y tienen los temas Aurora y Oro negro. Es para que puedan probar la página completa.',
    en:'Prime, ZFlow and Symmetrix have access to everything, as if they had Orquesta: their EnerX never drops («no limit · team»), A.L.I.A.S. shows up in their «⋯» menu with 100 times more steps and they get the Aurora and Black gold themes. It is so they can test the whole page.', go:['#railCoin', '#tabCoin'] },
  { k:'ayuda pagina centro preguntas frecuentes faq soporte help center support page',
    a:'Hay una página de Ayuda (ayuda.html), en español y en inglés: preguntas frecuentes y botones para hablar con el equipo, enviar una idea o hablar conmigo. Está abajo en la portada y arriba en Términos y Privacidad.',
    en:'There is a Help page (ayuda.html), in Spanish and English: frequent questions and buttons to talk to the team, send an idea or talk to me. It is at the bottom of the home page and at the top of Terms and Privacy.', go:['a[href*="ayuda"]'] },
  { k:'guia dos minutos empieza synthflow sola automatica primera vez two minute guide first time auto',
    a:'Cuando terminas «Empieza en SynthFlow» y eliges qué quieres hacer, arranco sola la guía de 2 minutos: ya no te pregunto el tema ni la IA otra vez y te muestro Nuevo chat, los modos, el esfuerzo, Proyectos, Sintéticos y Ajustes. Puedes decir «Ahora no» y volver a verla con el botón Guía.',
    en:'When you finish «Start in SynthFlow» and pick what you want to do, I start the 2-minute guide on my own: I don\'t ask the topic or the AI again and I show you New chat, the modes, the effort, Projects, Synthetics and Settings. You can say «Not now» and see it again with the Guide button.', go:['#guideTop', '#helpBtn'] },
  { k:'caja escribir barra larga compacta pequena textarea composer input box bar compact',
    a:'La caja para escribir ahora es más larga y más bajita: ocupa más ancho (hasta 900 px) y menos alto, para que veas más chat. Está igual en SynthFlow, en el estilo Simple y en el celular.',
    en:'The text box is now longer and shorter: it takes more width (up to 900 px) and less height, so you see more chat. It\'s the same in SynthFlow, the Simple style and on phones.', go:['#inp'] },
  /* v3.7 · personalidad: no celebra Halloween y tiene opiniones propias de tecnología */
  { k:'halloween disfraz disfraces calabaza dulce truco brujas costume pumpkin trick treat spooky',
    a:'Halloween no es lo mío, así que no lo celebro. Mejor algo útil: en SynthFlow puedes poner hasta 4 IAs a responder lo mismo y quedarte con la mejor.',
    en:'Halloween isn\'t my thing, so I don\'t celebrate it. Something useful instead: in SynthFlow you can have up to 4 AIs answer the same thing and keep the best one.', mood:'guino' },
  { k:'opinas opinion piensas mejor ia favorita recomiendas opinion think best favorite recommend',
    a:'Mi opinión, sin rodeos: no te cases con una sola IA. Compara (hasta 4 a la vez) y quédate con la que mejor responda a TU pregunta. Y si una inventa fuentes, fuera.',
    en:'My honest take: don\'t marry a single AI. Compare (up to 4 at once) and keep the one that best answers YOUR question. And if one makes up sources, it\'s out.', mood:'guino' }
);
/* las respuestas de antes también entienden preguntas en inglés */
[['conectar', 'connect connection setup key unlock works'], ['ias conectadas', 'connected ais free ready what are'], ['puter que', 'puter what is credits'], ['puter conectar', 'puter connect link'],
 ['cambiar elegir', 'change pick choose ai model other select switch'], ['comparar', 'compare comparison several two side same time'], ['guia', 'guide tutorial learn teach how works'],
 ['limite', 'limit left remaining messages usage battery energy enerx coins'], ['pagar', 'pay charge free price money cost card'], ['chats historial', 'chats history conversations previous saved'],
 ['drive', 'drive google space backup copy'], ['adjuntar', 'attach file pdf image photo upload document'], ['cuenta registrar', 'account register signup sign login profile user password'],
 ['ajustes', 'settings performance slow animations sound sounds cursor beginner'], ['favorito', 'favorite favorites star save message'], ['error', 'error not answering fails slow'],
 ['agente', 'agent superiorsynth improve prompt'], ['app instalar', 'app install download phone home screen'], ['vincular google', 'link google email merge accounts'],
 ['symphoria', 'symphoria name meaning means why called'], ['synth ', 'synth synthetism synthflow synthonia'], ['hola', 'hello hi hey greetings good morning evening'],
 ['como estas', 'how are you doing'], ['como te llamas', 'who are you your name'], ['chiste', 'joke funny laugh'], ['dato curioso', 'fun fact interesting know'],
 ['gracias', 'thanks thank great perfect cool'], ['adios', 'bye goodbye see you later']].forEach(([s, en]) => { const f = BOT_FAQ.find(x => x.k.startsWith(s)); if (f) f.k += ' ' + en; });
/* lo que sí existe en la página, para que la IA de SynthonIA (cuando no hay respuesta guardada) diga dónde está y la manita lo señale */
const BOT_PLACES = { chats:['[data-r="chats"]', '[data-tab="chats"]'], nuevo:['#cNew', '[data-r="new"]'], buscar:['[data-r="search"]'], favoritos:['#railFav', '[data-r="favs"]'], proyectos:['#railProj', '#cProj'], sinteticos:['#railSyn', '#cSyn'],
  ajustes:['#cfgBtn', '[data-tab="cfg"]'], cuenta:['#accBtn', '[data-tab="me"]'], mas:['#attachBtn'], menu:['#moreBtn'], ia:['#cPick'], comparar:['#cCmp'], modo:['#cMode'], esfuerzo:['#cEffort'], cortas:['#saverBtn'], caja:['#inp'], planes:['#moreBtn'], ayuda:['a[href*="ayuda"]'], enerx:['#railCoin', '#tabCoin'], guia:['#guideTop', '#helpBtn'] };
/* ---- ayuda de personas ---- */
async function helpApi(o){ return api('help' + (o && o.q ? o.q : ''), o && o.body ? { method:'POST', body:o.body, keep:true } : { keep:true }); }
async function botTeam(){
  if (!ACC.ready){ if (!BOT.open) botOpen(); botSay('Para hablar con una persona del equipo necesitas tu cuenta de SymphorIA (es gratis). Así te pueden responder aunque cierres la página.', 'guino', ['login', 'Entrar o crear cuenta']); return; }
  if (!(BOT.help && BOT.help.status !== 'done')) BOT.help = { status:'new', msgs:[] };
  BOT.mode = 'chat'; botClose(); chatOpen();
}
/* ---- «Chat con …»: ventana aparte que entra de derecha a izquierda (la persona que te atiende y su rango) ---- */
const CW = { el:null };
function chatTitle(r){ return r && r.by && r.by.name ? 'Chat con ' + r.by.name : 'Chat con el equipo de SymphorIA'; }
function chatOpen(){
  if (!CW.el){
    const w = document.createElement('aside'); w.id = 'szChat'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'Chat con el equipo');
    w.innerHTML = '<div class="cwh"><span class="cwa"></span><div class="cwt"><b></b><small></small></div><button type="button" class="cwx" data-cx aria-label="Cerrar">×</button></div><div class="cwl" aria-live="polite"></div>'
      + '<form class="cwin"><input type="text" maxlength="1000" placeholder="Escríbele al equipo…" aria-label="Escríbele al equipo" autocomplete="off"><button type="submit" class="bs" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></form>'
      + '<div class="cwf"><span>Nadie ve tus chats: solo lo que escribes aquí.</span><button type="button" class="lnk" data-cend>Terminar</button></div>';
    document.body.appendChild(w); CW.el = w;
    $('[data-cx]', w).addEventListener('click', chatClose);
    $('[data-cend]', w).addEventListener('click', async () => { const r = BOT.help; if (!r || !r.id || r.status === 'done'){ chatClose(); return; } try{ const d = await helpApi({ body:{ action:'close', id:r.id } }); BOT.help = d.item; chatRender(); toast('Terminaste la conversación con el equipo.'); setTimeout(chatClose, 900); }catch(er){ toast(er.message); } });
    $('.cwin', w).addEventListener('submit', async e => { e.preventDefault(); const i = $('.cwin input', w), v = i.value.trim(); if (!v) return; i.value = ''; const r = BOT.help; if (r && r.status === 'done') BOT.help = { status:'new', msgs:[] }; BOT.mode = 'team'; await botTeamSay(v); BOT.mode = 'chat'; chatRender(); });
  }
  chatRender(); SND.expand && SND.expand();
  requestAnimationFrame(() => requestAnimationFrame(() => CW.el && CW.el.classList.add('on')));
  setTimeout(() => { const i = CW.el && $('.cwin input', CW.el); if (i && matchMedia('(pointer: fine)').matches) i.focus(); }, 520);
  if (BOT.el){ const dot = $('.bdot', BOT.el); if (dot && !BOT.team) dot.hidden = true; }
}
function chatClose(){ if (CW.el) CW.el.classList.remove('on'); }
const chatIsOpen = () => !!(CW.el && CW.el.classList.contains('on'));
function chatRender(){
  const w = CW.el; if (!w) return; const r = BOT.help || { status:'new', msgs:[] };
  $('.cwt b', w).textContent = chatTitle(r);
  $('.cwt small', w).innerHTML = r.by && r.by.rank ? '<span class="rk r-' + esc(String(r.by.rank).toLowerCase()) + '">' + esc(r.by.rank) + '</span> te está atendiendo' : r.status === 'open' ? (r.urgent ? 'Avisando otra vez a un Prime, ZFlow o Symmetrix…' : 'Esperando a un Prime, ZFlow o Symmetrix…') : r.status === 'done' ? 'Conversación terminada' : 'Un Prime, ZFlow o Symmetrix te responde aquí';
  $('.cwa', w).innerHTML = r.by && r.by.name ? '<i class="cwi r-' + esc(String(r.by.rank || '').toLowerCase()) + '">' + esc(String(r.by.name).replace(/^@/, '').charAt(0).toUpperCase()) + '</i>' : face(r.status === 'open' ? 'esperando' : 'feliz', 40);
  const L = $('.cwl', w);
  const intro = botMsgHtml({ role:'assistant', mood:'feliz', content:'Cuéntame en qué te ayudamos y se lo paso a un Prime, ZFlow o Symmetrix. Te responden aquí mismo, aunque cierres la página.' });
  L.innerHTML = (!(r.msgs || []).length ? intro : '') + (r.msgs || []).map(m => botMsgHtml(m.from === 'team' ? { role:'team', name:m.name, rank:m.rank, content:m.text } : { role:'user', content:m.text })).join('')
    + (r.status === 'open' ? botMsgHtml({ role:'assistant', mood:r.urgent ? 'pensando' : 'esperando', content:r.urgent ? 'Ya pasaron más de 15 minutos: estoy avisando otra vez al equipo. ¡No te vas a quedar sin respuesta!' : 'Le avisé al equipo. Te respondo aquí apenas escriban (puedes seguir usando SymphorIA).' }) : '')
    + (r.status === 'done' ? '<p class="bempty">Conversación terminada. Escribe para abrir una nueva.</p>' : '');
  $('[data-cend]', w).hidden = !r.id || r.status === 'done';
  L.scrollTop = L.scrollHeight;
}
async function botTeamSay(text){
  if (CW.el && BOT.mode !== 'reply') BOT.mode = 'team';
  try{
    if (BOT.mode === 'reply' && BOT.cur){ const d = await helpApi({ body:{ action:'say', id:BOT.cur.id, text } }); BOT.cur = d.item; botRender(); botSyncSoon(); return; }
    const r = BOT.help;
    const d = r && r.id && r.status !== 'done' ? await helpApi({ body:{ action:'say', id:r.id, text } }) : await helpApi({ body:{ action:'open', text, page:document.title.slice(0, 60) } });
    BOT.help = d.item; BOT.mode = CW.el ? 'chat' : 'team'; BOT.seen = (d.item.msgs || []).length; if (CW.el) chatRender(); else botRender(); botSyncSoon();
  }catch(e){ toast(e.message || 'No pude enviar tu mensaje.'); }
}
function botSyncSoon(){ clearTimeout(BOT.poll); BOT.poll = setTimeout(botSync, 1500); }
async function botSync(){
  clearTimeout(BOT.poll);
  if (!ACC.ready || !B.SESS){ BOT.poll = setTimeout(botSync, 30000); return; }
  try{
    const d = await helpApi();
    const prev = BOT.help, mine = d.mine;
    if (mine){
      const newTeam = (mine.msgs || []).filter(m => m.from === 'team').length;
      let seenN = 0; try{ seenN = +localStorage.getItem('synthz:hseen:' + mine.id) || 0; }catch(e){}
      if (prev && prev.id === mine.id && prev.msgs) seenN = Math.max(seenN, prev.msgs.filter(m => m.from === 'team').length);
      if (newTeam > seenN){
        try{ localStorage.setItem('synthz:hseen:' + mine.id, String(newTeam)); }catch(e){}
        const m = mine.msgs.filter(x => x.from === 'team').pop();
        SND.expand(); botFace('dormida');
        if (!chatIsOpen()) botBubble(seenN ? m.name + ' (' + m.rank + ') te respondió.' : '¡Llegó ' + m.name + ' (' + m.rank + ')! Me tomo una siestita 😴 mientras te ayuda.', 7000);
        BOT.help = mine;
        if (!document.documentElement.classList.contains('guiding') && !document.querySelector('.szm')) chatOpen();
        else if (BOT.el){ const dot = $('.bdot', BOT.el); dot.hidden = false; }
      }
      if (prev && prev.status === 'open' && !prev.urgent && mine.urgent) botBubble('Estoy contactando a un Prime, ZFlow o Symmetrix… ¡ya casi!', 6000);
      BOT.help = mine;
    } else if (prev && prev.id){ BOT.help = Object.assign({}, prev, { status:'done' }); }
    BOT.team = !!d.team;
    if (d.team){
      const before = new Set(BOT.inbox.map(r => r.id + ':' + r.n));
      const fresh = (d.items || []).filter(r => r.status !== 'done' && !before.has(r.id + ':' + r.n) && !BOT.teamSeen[r.id + ':' + r.n]);
      BOT.inbox = d.items || [];
      fresh.forEach(r => { BOT.teamSeen[r.id + ':' + r.n] = 1; });
      if (fresh.length && BOT.synced){ SND.expand(); const r = fresh[0]; toast('@' + (r.user.username || r.user.name) + ' necesita ayuda: «' + r.text.slice(0, 60) + '»'); botBubble('@' + (r.user.username || r.user.name) + ' necesita ayuda. Toca para responder.', 7000); }
      BOT.synced = true;
      if (BOT.el){ const n = BOT.inbox.filter(r => r.status === 'open').length, dot = $('.bdot', BOT.el); dot.hidden = !n; dot.textContent = n || ''; }
      if (BOT.mode === 'reply' && BOT.cur){ const s = BOT.inbox.find(r => r.id === BOT.cur.id); if (s && s.n !== BOT.cur.msgs.length){ const x = await helpApi({ q:'?id=' + encodeURIComponent(BOT.cur.id) }); BOT.cur = x.item; } }
    }
    if (BOT.open) botRender();
    if (CW.el) chatRender();
  }catch(e){}
  const active = (BOT.help && BOT.help.status && BOT.help.status !== 'done') || BOT.team;
  /* sin conversación abierta no se pregunta cada rato (ahorra Redis): el «sigo aquí» de cada 3 min avisa si el equipo te escribió */
  if (!active){ BOT.poll = 0; return; }
  BOT.poll = setTimeout(botSync, document.hidden ? 60000 : BOT.open ? 8000 : 20000);
}
addEventListener('synthz-help-ping', () => { if (!BOT.poll) botSyncSoon(); });
async function botClick(e){
  const t = e.target;
  const bf = t.closest('[data-bf]'); if (bf){ const f = BOT_FAQ[+bf.dataset.bf]; BOT.hist.push({ role:'user', content:bf.textContent }); botRender(); await sleepRaw(300); return botAnswer(f); }
  const ba = t.closest('[data-ba]'); if (ba) return botAct(ba.dataset.ba);
  const tab = t.closest('[data-bt]'); if (tab){ BOT.mode = tab.dataset.bt === 'inbox' ? 'inbox' : 'chat'; return botRender(); }
  const bi = t.closest('[data-bi]'); if (bi){ try{ const d = await helpApi({ q:'?id=' + encodeURIComponent(bi.dataset.bi) }); BOT.cur = d.item; BOT.mode = 'reply'; botRender(); }catch(er){ toast(er.message); } return; }
  const b = t.closest('[data-b]'); if (!b) return;
  const k = b.dataset.b;
  if (k === 'min') botClose();
  else if (k === 'hide'){ botClose(); try{ sessionStorage.setItem('synthz:bothide', '1'); }catch(er){} const el = BOT.el; if (el && el.dataset.reactComponent === 'synthonia-avatar'){ el.classList.remove('on'); /* Deja BOT.el vivo hasta que React procese la retirada y el motor limpie listeners de posición. */ setTimeout(() => dispatchEvent(new Event('symphoria:hide-synthonIA')), 400); } else { BOT.el = null; if (el) setTimeout(() => el.remove(), 400); } toast('SynthonIA se escondió hasta que vuelvas a abrir la página.'); }
  else if (k === 'team') botTeam();
  else if (k === 'fb'){ botClose(); feedbackModal(); }
  else if (k === 'ia'){ BOT.mode = 'chat'; botRender(); }
  else if (k === 'back'){ BOT.mode = 'inbox'; botRender(); }
  else if (k === 'end' || k === 'done'){ const id = k === 'end' ? BOT.help && BOT.help.id : BOT.cur && BOT.cur.id; if (!id) return; try{ const d = await helpApi({ body:{ action:'close', id } }); if (k === 'end'){ BOT.help = d.item; botFace('feliz'); } else BOT.cur = d.item; botRender(); }catch(er){ toast(er.message); } }
}
/* ---------- BETA: «Cuéntanos qué mejorar» (llega a Pulsem) ---------- */
function feedbackModal(){
  if ($('#szFb')) return;
  const o = document.createElement('div'); o.id = 'szFb'; o.className = 'szm';
  const C = [['idea', '💡', 'Una idea'], ['error', '🐞', 'Algo falló'], ['confuso', '🤔', 'No entendí algo'], ['otro', '💬', 'Otra cosa']];
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Cuéntanos qué mejorar"><div class="word">' + zWord('Synth') + '</div><div class="tn">ALFA · TU OPINIÓN</div><div class="tb"><h3>Cuéntanos qué mejorar</h3><p>Lo lee el equipo de SymphorIA. No hace falta saber de tecnología: escríbelo como se lo dirías a un amigo.</p></div>'
    + '<div class="fbc" role="radiogroup">' + C.map(([k, e, l], i) => '<button type="button" role="radio" data-c="' + k + '" aria-checked="' + (i === 0) + '"><span>' + e + '</span>' + l + '</button>').join('') + '</div>'
    + '<label class="fbt"><textarea maxlength="1000" rows="4" placeholder="Por ejemplo: no encontré dónde cambiar de IA…"></textarea></label>'
    + '<div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Cancelar</button><button class="btn sm" type="button" data-send>Enviar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  let cat = 'idea';
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close); o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $$('[data-c]', o).forEach(b => b.addEventListener('click', () => { cat = b.dataset.c; $$('[data-c]', o).forEach(x => x.setAttribute('aria-checked', String(x === b))); SND.tap(); }));
  setTimeout(() => $('textarea', o).focus(), 120);
  $('[data-send]', o).addEventListener('click', async e => {
    const t = $('textarea', o).value.trim(); if (t.length < 3){ toast('Cuéntanos un poquito más.'); return; }
    e.currentTarget.disabled = true;
    try{ await api('help', { method:'POST', body:{ action:'feedback', cat, text:t, page:telPage() }, keep:true }); close(); toast('¡Gracias! El equipo ya lo recibió. 💛'); SND.done(); }
    catch(er){ e.currentTarget.disabled = false; toast(er.message || 'No pude enviarlo. Intenta de nuevo.'); }
  });
}
const betaTx = k => t(k);   /* fuera de betaMk: adentro «t» es el botón */
/* v4.2 · ya estamos en ALFA (Sammuel, 3 nov): la etiqueta dice ALFA en español y ALPHA en inglés */
const betaAll = () => document.querySelectorAll('.beta-tag').forEach(b => { b.textContent = betaTx('beta.tag'); b.title = betaTx('beta.title'); b.dataset.tip = betaTx('beta.tip'); });
onLang(betaAll); setTimeout(betaAll, 0); addEventListener('synthflow-ready', betaAll);
function betaMk(){
  const t = document.createElement('button'); t.type = 'button'; t.className = 'beta-tag'; t.textContent = betaTx('beta.tag'); t.title = betaTx('beta.title'); t.dataset.tip = betaTx('beta.tip');
  t.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); feedbackModal(); });
  return t;
}
/* SymphorIA: el BETA va al lado del logo pero FUERA del enlace (antes a veces no se podía tocar) */
function betaTags(){
  if (isFlow()) return betaBot();
  const a = document.querySelector('#nav .logo'); if (!a || document.querySelector('#nav .beta-tag')) return;
  const w = document.createElement('div'); w.className = 'logow'; a.before(w); w.append(a, betaMk());
}
/* SynthFlow: el BETA va pegadito a la bolita de SynthonIA y la sigue si la mueves */
function betaBot(){
  const b = BOT.el; if (!b || !isFlow()) return;
  let t = document.getElementById('betaBot');
  if (!t){ t = betaMk(); t.id = 'betaBot'; t.classList.add('bb'); (b.classList.contains('inhead') ? b.parentNode : document.body).appendChild(t); }
  const put = () => {
    const r = b.getBoundingClientRect(); if (!b.isConnected || !t.isConnected || !r.width) return;
    const w = t.offsetWidth || 46, h = t.offsetHeight || 18;
    if (b.dataset.reactComponent === 'synthonia-avatar'){
      /* React owns both controls: keep BETA fixed to the avatar's real viewport box,
         even when the avatar sits beside the mobile logo. */
      t.style.position = 'fixed'; t.style.zIndex = '9599';
      /* v3.7 · en la cabecera del celular va a la DERECHA de la bolita (a la izquierda tapaba el logo «SynthFlow») */
      const candidate = b.classList.contains('inhead') || r.left - w - 10 < 8 ? r.right + 10 : r.left - w - 10;
      const left = Math.max(8, Math.min(innerWidth - w - 8, candidate));
      const top = Math.max(8, Math.min(innerHeight - h - 8, r.top + r.height / 2 - h / 2));
      t.style.left = left.toFixed(0) + 'px'; t.style.top = top.toFixed(0) + 'px'; t.style.visibility = 'visible';
      return;
    }
    if (b.classList.contains('inhead')){ t.style.position = 'absolute'; t.style.zIndex = '3'; t.style.left = (b.offsetLeft + b.offsetWidth + 8) + 'px'; t.style.top = (b.offsetTop + b.offsetHeight / 2 - t.offsetHeight / 2) + 'px'; return; }
    const left = r.left - w - 10 < 8 ? r.right + 10 : r.left - w - 10;
    t.style.left = left.toFixed(0) + 'px'; t.style.top = (r.top + r.height / 2 - h / 2) + 'px';
  };
  BOT.betaPut = put; put(); requestAnimationFrame(put); setTimeout(put, 700); setTimeout(put, 1600);
  if (!t._w){
    t._w = 1;
    const onResize = () => put(); addEventListener('resize', onResize);
    BOT.betaCleanup = () => { removeEventListener('resize', onResize); t._w = 0; };
    if (document.fonts) document.fonts.ready.then(put);
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(betaTags, 400)); else setTimeout(betaTags, 400);
addEventListener('synthz-ready-bot', botMount);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(botMount, 900)); else setTimeout(botMount, 900);
const BOTAPI = { anchor:fn => { BOT.anchor = fn; }, open:botOpen, close:botClose, mount:botMount, unmount:botReactUnmount, activate:botAvatarClick, say:botSay, sync:botSync, team:botTeam, chatOpen, chatClose, match:q => { const f = botMatch(q); return f ? BOT_FAQ.indexOf(f) : -1; }, get el(){ return BOT.el; } };
/* ---------- Guía: elegir cómo aprender (Asistida con SynthonIA o Lectura) ---------- */
function guideChooser(o = {}){
  if ($('#szGch')) return;
  const w = document.createElement('div'); w.id = 'szGch'; w.className = 'szm';
  w.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Guía"><div class="word">' + zWord('Synth') + '</div><div class="tn">GUÍA</div><div class="tb"><h3>¿Cómo quieres aprender?</h3><p>' + esc(o.lead || 'Te muestro ' + (isFlow() ? 'SynthFlow' : 'SymphorIA') + ' como prefieras. Puedes volver aquí cuando quieras con el botón «Guía».') + '</p></div>'
    + '<div class="gch"><button type="button" class="gco a" data-g="a"><span class="gf">' + face('senalando', 54) + '</span><b>Asistida</b><small>SynthonIA te lo muestra con su manita, paso a paso: temas, IA recomendadas, comparar 2 y ' + (o.trial === false ? 'cómo conectar.' : 'tu primer chat con las IAs conectadas.') + '</small><em>Unos 2 minutos</em></button>'
    + '<button type="button" class="gco l" data-g="l"><span class="gf"><svg viewBox="0 0 48 48" width="54" height="54" aria-hidden="true"><path d="M8 11c6-2 12-1 16 3 4-4 10-5 16-3v26c-6-2-12-1-16 3-4-4-10-5-16-3z" fill="rgba(184,196,255,.12)" stroke="#b8c4ff" stroke-width="2" stroke-linejoin="round"/><path d="M24 14v26" stroke="#b8c4ff" stroke-width="2"/><path d="M12 18h7M12 23h7M29 18h7M29 23h7" stroke="#b8c4ff" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/></svg></span><b>Lectura</b><small>Una guía corta para leer a tu ritmo, con todo lo importante.</small><em>A tu ritmo</em></button></div>'
    + '<div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Ahora no</button></div></div>';
  document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  $('.tcard', w).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:600, easing:'cubic-bezier(.22,1,.36,1)' });
  SND.blip('feliz');
  const close = then => { w.classList.remove('on'); setTimeout(() => w.remove(), 420); if (then) setTimeout(then, 260); };
  $('[data-close]', w).addEventListener('click', () => close(o.later));
  w.addEventListener('pointerdown', e => { if (e.target === w) close(o.later); });
  $$('[data-g]', w).forEach(b => b.addEventListener('click', () => close(b.dataset.g === 'a' ? o.asistida : o.lectura)));
  setTimeout(() => { const b = $('[data-g="a"]', w); if (b) b.focus(); }, 80);
}

/* ---------- bienvenida tras 12 horas: «Ya tengo el Flow» o «Soy nuevo, quiero aprender» ---------- */
const SEEN_KEY = 'synthz:lastSeen', AWAY_MS = 12 * 3600e3;
let lastSeen0 = 0; try{ lastSeen0 = +localStorage.getItem(SEEN_KEY) || 0; }catch(e){}
const markSeen = () => { try{ localStorage.setItem(SEEN_KEY, String(Date.now())); }catch(e){} };
markSeen(); setInterval(markSeen, 5 * 60e3);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') markSeen(); });
let welcomeShown = false;
function wasAway(){ let force = false; try{ force = new URLSearchParams(location.search).get('bienvenida') === '1'; }catch(e){} return force || (lastSeen0 > 0 && Date.now() - lastSeen0 >= AWAY_MS); }
/* v4.1 · esta pantallita es la ÚNICA puerta para volver a ver la portada (index.html):
   «Soy nuevo» guarda la decisión y abre la portada; «Ya tengo el Flow» la guarda y entra directo a SynthFlow.
   La decisión queda en este dispositivo y viaja con la cuenta (SZ.portada, core 25m). opts.from = 'logo' cuando
   alguien que ya entró toca el logo para volver a la portada. */
const portadaPick = v => { try{ window.SZ.portada.set(v); }catch(e){} };
function goPortada(){ const href = 'index.html?nuevo=1'; if (window.SZ && SZ.portalBack && !reduce && !root.classList.contains('noanim')) SZ.portalBack(href); else location.href = href; }
function welcomeBack(opts){
  opts = opts || {};
  if (welcomeShown || $('#szWelcome')){ if (opts.from === 'logo' && !$('#szWelcome')) welcomeShown = false; else return null; }
  welcomeShown = true;
  const onIndex = telPage() === 'index', logo = opts.from === 'logo';
  const who = ACC.ready ? accName() : '';
  const o = document.createElement('div'); o.id = 'szWelcome'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Bienvenida');
  o.innerHTML = '<div class="wbface">' + face('flow', 64) + '</div>'
    + '<div class="wbtx"><b>' + (logo ? '¿Ya tienes el Flow?' : who ? '¡Hola de nuevo! ¿Sigues siendo tú?' : '¡Hola! ¿Ya conoces ' + (isFlow() ? 'SynthFlow' : 'SymphorIA') + '?') + '</b><p>' + (logo ? 'La portada de SymphorIA es la bienvenida para quien llega nuevo. Si ya sabes usarlo, te quedas aquí; si eres nuevo, te la muestro.' : who ? 'La sesión de <em>' + esc(who) + '</em> está abierta en este dispositivo. Si eres nuevo, te muestro cómo funciona todo.' : 'Pasaron más de 12 horas. Si es tu primera vez, te muestro cómo funciona todo en un minuto.') + '</p></div>'
    + '<div class="wbbtn"><button type="button" class="btn sm flow" data-wb="flow">' + face('flow', 22, 'wbmini') + (who ? 'Ya tengo el Flow · continuar' : 'Ya tengo el Flow') + '</button><button type="button" class="btn sm ghost" data-wb="new">Soy nuevo, quiero aprender</button></div>'
    + '<button type="button" class="wbx" data-wb="x" aria-label="Cerrar">✕</button>';
  document.body.appendChild(o);
  requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add('on')));
  const close = kind => {
    if (!o.isConnected) return;
    o.classList.remove('on'); o.classList.add('bye');
    if (kind === 'flow' && !reduce && !root.classList.contains('noanim')){ const r = $('.wbface', o).getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, ['#e6b65f', '#ffe2a8', '#c9566c'], 14); }
    setTimeout(() => o.remove(), 650);
  };
  o.addEventListener('click', e => {
    const b = e.target.closest('[data-wb]'); if (!b) return;
    const k = b.dataset.wb; close(k);
    if (k === 'new'){ portadaPick('nuevo'); if (!onIndex) setTimeout(goPortada, 420); else if (opts.learn) setTimeout(opts.learn, 420); }
    if (k === 'flow'){ portadaPick('app'); if (onIndex) setTimeout(() => portalOut('chat.html'), 420); else if (opts.flow) opts.flow(); }
  });
  addEventListener('keydown', function esc1(e){ if (e.key === 'Escape' && o.isConnected){ close('x'); removeEventListener('keydown', esc1); } });
  return o;
}

/* ===== v1.3: mientras corre una guía o un recorrido, solo se puede tocar la guía y «Saltar guía» ===== */
(function guideLock(){
  /* #szMaint: el aviso de mantenimiento queda encima de todo; si una guía quedaba corriendo debajo, este candado
     bloqueaba los clics y el teclado del aviso y no se podía escribir la contraseña ni entrar con Google (2 nov) */
  const OK = '#szgHud,#szgPanel,#szSay,#szHand,#ptour,#tour,.szm,#toast,#szChat,.tcard,[data-guide-ok],#szMaint';
  const on = () => root.classList.contains('guiding') || !!document.getElementById('ptour') || !!document.getElementById('tour');
  let warnT = 0;
  const stop = e => {
    if (!e.isTrusted || !on()) return;
    const t = e.target, el = t && t.nodeType === 1 ? t : t && t.parentElement;
    if (el && el.closest && el.closest(OK)) return;
    if (e.type === 'keydown'){
      if (e.key === 'Escape' || e.key === 'Tab' || e.key === 'F5') return;
      const a = document.activeElement; if (a && a.closest && a.closest(OK)) return;
    }
    if (e.type === 'wheel' || e.type === 'touchmove') return;      /* mirar (desplazarse) sí se puede */
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if ((e.type === 'pointerdown' || e.type === 'keydown') && Date.now() - warnT > 2600){ warnT = Date.now(); try{ toast('Estás en la guía. Sigue con los botones de SynthonIA o toca «Saltar guía».'); }catch(x){} const h = document.querySelector('#szgHud .gh-x'); if (h){ h.classList.remove('nudge'); void h.offsetWidth; h.classList.add('nudge'); } }
  };
  ['pointerdown', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'keydown', 'submit'].forEach(t => addEventListener(t, stop, { capture:true, passive:false }));
})();
/* ===== v1.3 · en el celular, cada toque deja una onda de vidrio ===== */
addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch' || reduce || root.classList.contains('noanim') || document.getElementById('portal')) return;
  const r = document.createElement('i'); r.className = 'tapr'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
  document.body.appendChild(r); setTimeout(() => r.remove(), 600);
}, { capture:true, passive:true });
/* ===== v1.3 · SynthonIA con vida: chistes, datos curiosos que no se repiten, siesta, reacciones y ayuda si te pierdes ===== */
(function botLife(){
  const JOKES = [
    '¿Por qué la computadora fue al médico? Porque tenía un virus… y no quería compartirlo. 🤒',
    '¿Qué le dijo un bit a otro bit? «Nos vemos en el bus». 🚌',
    'Le pedí a una IA que me contara un chiste de memoria… y se le olvidó. 😅',
    '¿Cuál es el colmo de un programador? Que su perro se llame «Error 404»… y nunca lo encuentre. 🐶',
    '¿Por qué el libro de matemáticas estaba triste? Porque tenía demasiados problemas. 📘',
    '¿Qué hace una abeja en el gimnasio? ¡Zumba! 🐝',
    'Mi wifi y yo tenemos algo en común: los dos nos desconectamos los lunes. 📶',
    '¿Qué le dice un semáforo a otro? «No me mires, que me estoy cambiando». 🚦',
    'Intenté hacer un chiste sobre la nube… pero se fue volando. ☁️',
    '¿Cuál es el café más peligroso del mundo? El ex-preso. ☕',
    '¿Qué le dijo el 0 al 8? «¡Qué buen cinturón!» 0️⃣',
    'Soy SynthonIA y no duermo… bueno, solo cuando te vas. 😴',
    '¿Qué hace un pez en internet? Navega. 🐟',
    '¿Cómo se despiden los químicos? Ácido un placer. 🧪',
    '¿Qué le dijo una impresora a otra? «¿Ese papel es tuyo o es impresión mía?» 🖨️',
    '¿Por qué la escoba llegó tarde? Porque se quedó barriendo. 🧹',
    'Mi contraseña es «incorrecta»: así, cuando la olvido, la página me la recuerda. 🔐',
    '¿Por qué el tomate se puso rojo? Porque vio a la ensalada sin aderezo. 🍅',
    '¿Cuál es el animal más antiguo? La cebra, porque está en blanco y negro. 🦓',
    'Le dije a mi IA que era graciosa… y me respondió con una tabla de 5 columnas. 📊',
    '¿Qué hace una vaca pensando? Leche concentrada. 🐄',
    '¿Por qué el mar es tan amable? Porque siempre te saluda con una ola. 🌊',
    '¿Qué le dijo la luna al sol? «Tú tan grande y no te dejan salir de noche». 🌙',
    '¿Cómo se llama el campeón de buceo japonés? Tokofondo. 🤿',
    '¿Qué le dijo el café al azúcar? «Sin ti mi vida es amarga». ☕'
  ];
  const FACTS = [
    'SynthFlow puede poner varias IA a responder la misma pregunta al mismo tiempo. Así ves cuál lo explica mejor.',
    'Si tocas «Otra vez» en una respuesta, la IA lo intenta de nuevo con otras palabras.',
    'Tus chats se guardan en tu dispositivo, y si entras con tu cuenta también te siguen a tu celular.',
    'Con SuperiorSynth, una IA mejora lo que escribes y se lo pasa a la IA que más sabe de ese tema.',
    'La «Automática» elige sola una IA que esté funcionando bien en ese momento.',
    'Puedes adjuntar fotos y PDF: algunas IA los leen y te los explican.',
    'Los pulpos tienen tres corazones y sangre azul. 🐙',
    'La miel bien guardada casi no se daña: se ha encontrado miel comestible de miles de años. 🍯',
    'Un día en Venus dura más que un año en Venus. 🪐',
    'Los flamencos son rosados por lo que comen: algas y camarones. 🦩',
    'Las nutrias se toman de la mano al dormir para no separarse con la corriente. 🦦',
    'El corazón de una ballena azul es tan grande como un carro pequeño. 🐋',
    'La Torre Eiffel puede crecer unos centímetros en verano por el calor. 🗼',
    'Las abejas pueden reconocer caras humanas. 🐝',
    'Un rayo es unas cinco veces más caliente que la superficie del Sol. ⚡',
    'Los caracoles pueden dormir hasta tres años seguidos. 🐌',
    'Las vacas tienen mejores amigas y se estresan si las separan. 🐄',
    'El ojo del avestruz es más grande que su cerebro. 👁️',
    'Hay más árboles en la Tierra que estrellas en la Vía Láctea. 🌳',
    'Al primer error de computador se le dijo «bug» porque una polilla de verdad se metió en una máquina en 1947. 🦋',
    'Los koalas duermen hasta 20 horas al día. 🐨',
    'La Gran Muralla China no se ve a simple vista desde el espacio: es un mito. 🧱',
    'Las jirafas solo duermen unos minutos seguidos, y a veces de pie. 🦒',
    'Colombia es uno de los países con más especies de aves del mundo. 🐦',
    'Los delfines se llaman entre sí con silbidos que funcionan como nombres. 🐬',
    'La palabra «robot» viene del checo y significa «trabajo forzado». 🤖',
    'Las estrellas de mar no tienen cerebro… ¡y aun así se las arreglan! ⭐',
    'Los gatos pasan cerca del 70 % de su vida durmiendo. 🐈',
    'El sonido viaja unas cuatro veces más rápido en el agua que en el aire. 🔊',
    'Una cucharadita de una estrella de neutrones pesaría millones de toneladas. ✨'
  ];
  const K = 'synthz:botseen';
  const seen = () => { try{ return Object.assign({ j:[], f:[], x:[] }, JSON.parse(localStorage.getItem(K)) || {}); }catch(e){ return { j:[], f:[], x:[] }; } };
  const keep = s => { try{ localStorage.setItem(K, JSON.stringify(s)); }catch(e){} };
  const hash = t => { let h = 0; for (const c of String(t)) h = (h * 31 + c.charCodeAt(0)) | 0; return String(h); };
  /* nunca repite: cuando se acaban los guardados, le pide uno nuevo a la IA y recuerda lo que ya dijo */
  async function next(kind){
    const s = seen(), L = kind === 'j' ? JOKES : FACTS, used = new Set(s[kind]);
    const left = L.map((t, i) => i).filter(i => !used.has(i));
    if (left.length){ const i = left[Math.floor(Math.random() * left.length)]; s[kind] = [...used, i]; keep(s); return L[i]; }
    for (let k = 0; k < 2; k++){
      try{
        /* v3.7 · en inglés se pide en inglés (antes llegaban chistes en español con la página en inglés) */
        const en = B.LANG === 'en', q = kind === 'j' ? (en ? 'Tell me a short, clean, new joke, one or two lines.' : 'Cuéntame un chiste corto, blanco y nuevo, de una o dos líneas.') : (en ? 'Tell me a short, true fun fact about the world, one line.' : 'Dime un dato curioso corto y verdadero del mundo, de una línea.');
        const r = await fetch('/api/help', { method:'POST', headers:Object.assign({ 'content-type':'application/json' }, B.SESS ? { authorization:'Bearer ' + B.SESS } : {}), body:JSON.stringify({ action:'ask', q, lang:B.LANG, hist:[] }) });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.text && !s.x.includes(hash(d.text))){ s.x = [...s.x, hash(d.text)].slice(-500); keep(s); return d.text; }
      }catch(e){ break; }
    }
    return kind === 'j' ? 'Ya te conté todos mis chistes… ¡estoy escribiendo nuevos! 😄' : 'Ya te conté todos mis datos curiosos por ahora. Vuelve luego y tendré más. ✨';
  }
  BOTAPI.joke = () => next('j'); BOTAPI.fact = () => next('f');

  /* ---- actividad: ¿la persona está aquí? ---- */
  let last = Date.now(), asleep = false;
  const active = () => Date.now() - last < 25000 && !document.hidden;
  const busyUI = () => root.classList.contains('guiding') || root.classList.contains('lock') || root.classList.contains('leaving') || !root.classList.contains('ready') && !isFlow() || !!document.querySelector('#ptour,#tour,.szm,#vintro,#intro,#portal,.hackev') || BOT.open;
  function wake(){
    last = Date.now();
    const out = SZIDLE.wake();              /* v3.2 · si estaba jugando fuera, ella misma corre de vuelta y saluda */
    if (!asleep) return; asleep = false;
    root.classList.remove('idle-sleep');
    if (BOT.el && !out){ botFace('sorprendida'); try{ SND.blip('sorprendida'); }catch(e){} if (!busyUI()) botBubble(['¡Ah! ¡Volviste! 👀', '¡Uy, me quedé dormida! Ya estoy aquí.', '¡Hola otra vez! Te estaba esperando.'][Math.floor(Math.random() * 3)], 3200); setTimeout(() => { if (!asleep) botFace('feliz'); }, 2200); }
  }
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(t => addEventListener(t, wake, { capture:true, passive:true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  /* 1 minuto sin moverte: SynthonIA se duerme y la página baja el ritmo para ahorrar batería */
  setInterval(() => {
    /* v3.2 · a los 2 minutos sale a dormir en la mitad de la pantalla y luego juega (core 20, SZIDLE) */
    SZIDLE.tick(Date.now() - last, busyUI() || !!document.querySelector('.work:not(.fin)'));
    if (asleep || Date.now() - last < 60000 || busyUI()) return;
    if (document.querySelector('.work:not(.fin)')) return;     /* no se duerme mientras una IA responde */
    asleep = true; root.classList.add('idle-sleep'); if (BOT.el) botFace('dormida');
  }, SZIDLE.FAST ? 1000 : 5000);
  BOTAPI.sleeping = () => asleep;

  /* ---- de vez en cuando (solo si estás activo): un dato curioso o un chiste ---- */
  let lastTalk = Date.now();
  setInterval(async () => {
    if (!BOT.el || asleep || !active() || busyUI() || Date.now() - lastTalk < 240000) return;
    const a = document.activeElement; if (a && /INPUT|TEXTAREA/.test(a.tagName) && a.value) return;   /* no interrumpe si estás escribiendo */
    if (Math.random() > .35) return;
    lastTalk = Date.now();
    const j = Math.random() < .4, t = await next(j ? 'j' : 'f');
    botFace(j ? 'riendo' : 'sorprendida'); botBubble((j ? '' : '¿Sabías que…? ') + t, 7500); setTimeout(() => { if (!asleep) botFace('feliz'); }, 7600);
  }, 30000);

  /* ---- reacciones que la página le pide (respuestas, lentitud, límite…) ---- */
  const said = {};
  BOTAPI.react = (kind, o = {}) => {
    if (!BOT.el || asleep || busyUI() || !active()) return;
    const now = Date.now(); if (said[kind] && now - said[kind] < (o.cool || 90000)) return;
    if (kind === 'done' && !o.text && Math.random() > .25) return;
    said[kind] = now; lastTalk = now;
    const M = {
      /* v3.6 · si ya estás en la Automática no te dice que la pruebes (Sammuel, 29 oct) */
      slow:['pensando', o.auto ? B.LANG === 'en' ? 'This is taking a bit… ⏳ Automatic is already looking for the best free AI for you.' : 'Esto está tardando un poco… ⏳ La «Automática» ya está buscando la mejor IA libre para ti.'
        : B.LANG === 'en' ? 'This AI is taking its time… ⏳ If it takes too long, try «Automatic».' : 'Esta IA se está tomando su tiempo… ⏳ Si se demora mucho, prueba la «Automática».'],
      done:['feliz', ['¡Listo! ¿Te sirvió?', '¡Eso tiene mucho Flow! ✨', 'Si quieres otra versión, toca «Otra vez».'][Math.floor(Math.random() * 3)]],
      limit:['preocupada', 'Te queda poco de tu límite de hoy. Si se acaba, puedes seguir con Puter, que te da la versión pro de las IAs más usadas.'],
      lost:['confundida', '¿Te ayudo a encontrar algo? Tócame y pregúntame. 🙂']
    };
    if (kind === 'lost'){ BOT.lostN = (BOT.lostN || 0) + 1; BOT.el.classList.toggle('g1', BOT.lostN === 1); BOT.el.classList.toggle('g2', BOT.lostN >= 2); clearTimeout(BOT.gT); BOT.gT = setTimeout(() => BOT.el && BOT.el.classList.remove('g1', 'g2'), 25000); BOTAPI.problem('lost'); }
    const m = o.text ? [o.mood || 'feliz', o.text] : M[kind]; if (!m) return;
    botFace(m[0]); botBubble(m[1], o.ms || 5200); setTimeout(() => { if (!asleep) botFace('feliz'); }, (o.ms || 5200) + 200);
  };
  /* un mensaje con botón dentro del panel de SynthonIA (rescatar un error, cambiar de IA…) */
  BOT.acts = BOT.acts || {};
  BOTAPI.offer = (text, mood, label, fn) => { const id = 'x' + Date.now().toString(36); BOT.acts[id] = fn; if (!BOT.open) botOpen(); botSay(text, mood || 'feliz', label ? [id, label] : null); };

  /* ---- demasiados problemas seguidos: saca su manita, pide perdón y señala el botón para contarnos qué pasó ---- */
  let probs = [], sorryAt = 0;
  BOTAPI.problem = kind => {
    const now = Date.now(); probs = probs.filter(t => now - t < 600000); probs.push(now);
    if (probs.length >= 4 && now - sorryAt > 1800000 && BOT.el && !root.classList.contains('guiding')){ sorryAt = now; probs = []; setTimeout(sorry, 900); }
  };
  async function sorry(){
    const t = document.querySelector('#betaBot') || [...document.querySelectorAll('.beta-tag')].find(x => x.getClientRects().length);
    BOT.sticky = 'triste'; botFace('triste', true); if (BOT.open) botClose();
    const unstick = e => { if (e.target.closest && e.target.closest('#szSay,#szHand,#szBot,.szm')) return; if (e.type === 'pointerdown' && e.pointerType === 'mouse' && e.button) return; BOT.sticky = null; botFace('feliz', true); removeEventListener('keydown', unstick, true); removeEventListener('pointerdown', unstick, true); };
    setTimeout(() => { addEventListener('keydown', unstick, true); addEventListener('pointerdown', unstick, true); }, 2500);
    if (!t || !HAND){ botBubble('Perdónanos por tu mala experiencia. Toca «ALFA» para contarnos cuál fue el problema.', 9000); return; }
    const r0 = BOT.el.getBoundingClientRect(); HAND.show({ x:r0.left + r0.width / 2, y:r0.top + r0.height / 2 });
    await HAND.moveTo(t, { shape:'point' }); HAND.spot(t, 8);
    const k = await HAND.talk('Perdónanos por tu mala experiencia. Aquí está nuestro botón para que nos cuentes cuál fue el problema.', { near:t, mood:'triste', buttons:[{ label:'Contarles' }, { label:'Ahora no', ghost:true }], auto:14000 });
    HAND.unspot(); HAND.quiet(); HAND.hide();
    if (k === 0) feedbackModal();
  }
  /* ---- ¿perdido? muchos clics que no hacen nada o subir y bajar sin parar ---- */
  let clicks = [], dirs = [], lastY = scrollY, lastDir = 0;
  addEventListener('pointerdown', e => {
    if (!e.isTrusted || busyUI()) return;
    const dead = !(e.target.closest && e.target.closest('button,a,input,textarea,select,label,[role=button],[data-hover],.mi,.hex,.tchip,.m'));
    const now = Date.now(); clicks = clicks.filter(c => now - c.t < 5000); clicks.push({ t:now, x:e.clientX, y:e.clientY, dead });
    const near = clicks.filter(c => Math.hypot(c.x - e.clientX, c.y - e.clientY) < 60).length, deadN = clicks.filter(c => c.dead).length;
    if (near >= 6 || deadN >= 4){ clicks = []; BOTAPI.react('lost', { cool:40000 }); }
  }, { capture:true, passive:true });
  addEventListener('scroll', () => {
    const y = scrollY, d = Math.sign(y - lastY); lastY = y; if (!d || d === lastDir) return; lastDir = d;
    const now = Date.now(); dirs = dirs.filter(t => now - t < 9000); dirs.push(now);
    if (dirs.length >= 8 && !busyUI()){ dirs = []; BOTAPI.react('lost', { cool:40000 }); }
  }, { passive:true });
})();

/* ===== v2.0 · Guía rápida con SynthonIA: «¿La quieres completa o qué quieres ver?»
   Eliges uno o varios temas (en el orden que los toques) y te los muestra con su manita.
   Además: «¡Descubriste algo nuevo!» la primera vez que usas algo, y «Qué hay de nuevo» contado por ella ===== */
const GTOPICS = [
  ['chat', 'Escribir y enviar', 'Dónde escribes y cómo envías.'],
  ['ia', 'Elegir la IA', 'Cambiar de IA y ver para qué sirve cada una.'],
  ['comparar', 'Comparar IAs', 'Varias IA responden lo mismo, lado a lado.'],
  ['agente', 'SuperiorSynth', 'Escribes y SuperiorSynth elige la IA por ti.'],
  ['archivos', 'Archivos y vista previa', 'Adjuntar archivos y ver los que te da la IA.'],
  ['extras', 'Internet y memoria', 'Buscar datos de hoy y que la IA te recuerde.'],
  ['chats', 'Mis chats y favoritos', 'Dónde quedan tus conversaciones.'],
  ['limite', 'Tu límite gratis', 'Cuánto te queda hoy y cuándo se llena.'],
  ['cuenta', 'Tu cuenta y Puter', 'Guardar tus chats y la versión pro de las IA.'],
  ['ajustes', 'Ajustes', 'Más bonito, más rápido, sonidos y más.'],
  ['synthonia', 'SynthonIA', 'Cómo pedirme ayuda cuando quieras.']
];
function guideAsk(o = {}){
  if ($('#szGq')) return;
  const L = (o.topics || GTOPICS), picked = [];
  const w = document.createElement('div'); w.id = 'szGq'; w.className = 'szm';
  w.innerHTML = '<div class="tcard gq" role="dialog" aria-modal="true" aria-label="Guía rápida">'
    + '<div class="gq-say"><span class="gq-f">' + face('feliz', 64) + '</span><div><b>SynthonIA</b><p></p></div></div>'
    + '<button type="button" class="gq-full" data-gq="full"><span>Completa</span><small>' + esc(o.fullTxt || 'Te muestro todo, paso a paso (unos 2 minutos).') + '</small></button>'
    + '<p class="gq-or">o elige lo que quieres ver <small>(puedes elegir varios; los veremos en el orden en que los toques)</small></p>'
    + '<div class="gq-chips">' + L.map(t => '<button type="button" class="gq-c" data-t="' + t[0] + '" aria-pressed="false" title="' + esc(t[2]) + '"><i></i>' + esc(t[1]) + '</button>').join('') + '</div>'
    + '<div class="tbtn gq-b"><button class="lnk" type="button" data-close>Ahora no</button>' + (o.read ? '<button class="lnk" type="button" data-gq="read">Leer a mi ritmo</button>' : '') + '<button class="btn sm flow" type="button" data-gq="go" disabled>Muéstrame lo que elegí</button></div></div>';
  document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  $('.tcard', w).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:600, easing:'cubic-bezier(.22,1,.36,1)' });
  const say = '¡Hola! ¿Quieres ver la guía completa o qué quieres aprender?';
  const p = $('.gq-say p', w); p.textContent = say; SND.blip('feliz');
  typeIn(p, { cps:46, max:3, onFrame:lipSync([$('.gq-f .szface', w), ballFace()], say) }).catch(() => {});
  const go = $('[data-gq="go"]', w);
  const paint = () => { $$('.gq-c', w).forEach(b => { const i = picked.indexOf(b.dataset.t); b.setAttribute('aria-pressed', String(i >= 0)); $('i', b).textContent = i >= 0 ? String(i + 1) : ''; }); go.disabled = !picked.length; go.textContent = picked.length ? 'Muéstrame ' + (picked.length === 1 ? 'eso' : 'estos ' + picked.length) : 'Muéstrame lo que elegí'; };
  const close = then => { w.classList.remove('on'); setTimeout(() => w.remove(), 420); if (then) setTimeout(then, 280); };
  w.addEventListener('click', e => {
    const c = e.target.closest('.gq-c');
    if (c){ const k = c.dataset.t, i = picked.indexOf(k); if (i >= 0) picked.splice(i, 1); else picked.push(k); SND.tap && SND.tap(); paint(); return; }
    const b = e.target.closest('[data-gq]');
    if (b){ const a = b.dataset.gq; if (a === 'full') close(o.full); else if (a === 'read') close(o.read); else if (a === 'go' && picked.length) close(() => o.pick && o.pick(picked.slice())); return; }
    if (e.target === w || e.target.closest('[data-close]')) close(o.later);
  });
  setTimeout(() => { const b = $('.gq-full', w); if (b) b.focus(); }, 80);
}

/* «¡Descubriste algo nuevo!»: la primera vez que usas algo, SynthonIA te cuenta en una línea para qué sirve */
const DISC = [
  ['#cCmp, #pickRow [data-add], [data-add-cmp]', 'comparar', 'Comparar IAs', 'Ahora varias IA responden lo mismo y ves cuál lo hace mejor.'],
  ['#modeMenu [data-mode="agent"]', 'agente', 'SuperiorSynth', 'Tú escribes; SuperiorSynth mejora tu pedido y elige la IA que más sabe de eso.'],
  ['.fcard [data-fv]', 'archivos', 'Archivos de la IA', 'Puedes ver el código, su vista previa y descargarlo con su nombre.'],
  ['[data-a="star"]', 'favoritos', 'Favoritos', 'Las respuestas que guardas con la estrella quedan en «Favoritos».'],
  ['#attachBtn', 'adjuntar', 'Adjuntar archivos', 'Le puedes dar a la IA fotos, PDF o archivos de texto para que los lea.'],
  ['.tchip[data-topic]', 'temas', 'Temas', 'Cada tema te recomienda las IA que mejor lo hacen.'],
  ['[data-r="search"], #thQ', 'buscar', 'Buscar en tus chats', 'Busco dentro de todos tus mensajes, no solo en los títulos.'],
  ['[data-a="regen"]', 'otra', 'Otra vez', 'La IA vuelve a responder lo mismo, con otras palabras.'],
  ['#ssTop', 'agente-off', 'Salir de SuperiorSynth', 'Toca su sello arriba y «Elegir yo la IA».']
];
const DISC_KEY = 'synthz:disc';
let discSeen = {}; try{ discSeen = JSON.parse(localStorage.getItem(DISC_KEY) || '{}') || {}; }catch(e){}
let discQ = [], discOn = false;
function discShow(){
  if (discOn || !discQ.length) return;
  if (document.querySelector('#szgHud, #szGq, #szWelcome, #vintro, #intro, #portal, .hackev') || root.classList.contains('guiding')){ setTimeout(discShow, 2500); return; }
  discOn = true; const [, , name, text] = discQ.shift();
  const d = document.createElement('div'); d.className = 'szdisc'; d.setAttribute('role', 'status');
  d.innerHTML = '<span class="dc-f">' + face('sorprendida', 46) + '</span><div><small>¡Descubriste algo nuevo!</small><b></b><p></p></div><button type="button" class="dc-x" aria-label="Cerrar">✕</button>';
  $('b', d).textContent = name; $('p', d).textContent = text;
  document.body.appendChild(d); requestAnimationFrame(() => d.classList.add('on')); SND.blip && SND.blip('sorprendida');
  typeIn($('p', d), { cps:44, max:3, onFrame:lipSync([$('.dc-f .szface', d)], text) }).catch(() => {});
  const bye = () => { if (!d.isConnected) return; d.classList.remove('on'); setTimeout(() => { d.remove(); discOn = false; setTimeout(discShow, 600); }, 400); };
  $('.dc-x', d).addEventListener('click', bye); setTimeout(bye, 6500);
}
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  for (const D of DISC){
    if (discSeen[D[1]] || !e.target.closest(D[0])) continue;
    discSeen[D[1]] = Date.now(); try{ localStorage.setItem(DISC_KEY, JSON.stringify(discSeen)); }catch(x){}
    discQ.push(D); setTimeout(discShow, 900); break;
  }
}, true);

/* «Qué hay de nuevo»: SynthonIA te lo cuenta una vez por versión (y está en el menú cuando quieras) */
const WHATSNEW = { v:'3.0', items:[
  ['portada', 'La página ahora se llama SymphorIA, «el portador de la armonía», y estrena icono.'],
  ['chat', ENERX + ': tu batería del día para usar las IAs conectadas. Baja con cada mensaje y se carga a medianoche.'],
  ['chat', 'A.L.I.A.S. con Síntesis: 4 IAs hacen el último paso y se combinan en una sola respuesta, la mejor (se queda con lo correcto de cada una, comprueba lo que choca y quita el relleno).'],
  ['chat', 'Sintéticos como en Claude: cuando la IA te crea una página, un juego o un dibujo, se abre solo al lado del chat. Y en la barrita, «Sintéticos» los junta todos.'],
  ['ajustes', 'Toda la página en español o en inglés: botón ES/EN en la portada, y en SynthFlow, Ajustes › «Idioma · Language» o el menú «⋯».'],
  ['synthonia', 'Ahora me sé toda la página: pregúntame dónde está cualquier cosa (también en inglés) y te la señalo con mi manita.'],
  ['proyectos', 'Proyectos: junta chats, instrucciones y archivos de un mismo tema. Ahora se pintan con los colores de tu tema.'],
  ['ajustes', 'Modo compacto: SynthFlow ahora se ve un poco más pequeño. Si prefieres el tamaño de antes, Ajustes → Tamaño → Normal.'],
  ['chat', 'Más seguro: lo que crea la IA corre aparte, en su propio espacio, y tu sesión queda protegida.'],
  ['ajustes', 'Pulsem (equipo): ahora cada quien puede quitar su llave con «Quitar».'],
  ['chat', 'Planes en el menú «⋯» › Planes: Chispa (gratis), Chispa+, Syntonia, Timeless y Orquesta. Por ahora solo se muestran: los pagos están apagados y nadie te cobra.'],
  ['chat', 'Guía de 2 minutos: al terminar «Empieza en SynthFlow» arranca sola, sin preguntarte otra vez el tema ni la IA.'],
  ['chat', 'La caja para escribir ahora es más larga y más bajita, para que veas más chat.'],
  ['synthonia', 'Nueva página de Ayuda, en español y en inglés: preguntas frecuentes y botones para hablar con el equipo o conmigo.']
] };
function newsBang(onShow){
  const b = $('#szBot'); if (!b){ setTimeout(() => newsBang(onShow), 600); return; }
  if ($('.nwbang', b)) return;
  const x = document.createElement('span'); x.className = 'nwbang'; x.setAttribute('role', 'button'); x.setAttribute('tabindex', '0'); x.setAttribute('aria-label', '¿Qué hay de nuevo?'); x.dataset.tip = '¿Qué hay de nuevo?'; x.textContent = '!';
  const go = e => { e.preventDefault(); e.stopPropagation(); whatsNew(true, onShow); };
  x.addEventListener('click', go); x.addEventListener('pointerdown', e => e.stopPropagation()); x.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(e); });
  b.appendChild(x); b.setAttribute('aria-label', 'SynthonIA · hay novedades');
  try{ SND.blip('celebrando'); }catch(e){}
}
function whatsNew(force, onShow){
  let seen = ''; try{ seen = localStorage.getItem('synthz:newv') || ''; }catch(e){}
  const visited = (() => { try{ return !!localStorage.getItem('synthz:visited'); }catch(e){ return false; } })();
  if (!force && (seen === WHATSNEW.v || !visited)){ try{ localStorage.setItem('synthz:newv', WHATSNEW.v); }catch(e){} return false; }
  /* v2.2 · ya no se abre sola: sale un «!» sobre la cabeza de SynthonIA (una vez por versión) y se abre al tocarlo */
  if (!force){ newsBang(onShow); return false; }
  try{ localStorage.setItem('synthz:newv', WHATSNEW.v); }catch(e){}
  $$('.nwbang').forEach(x => { x.classList.add('out'); setTimeout(() => x.remove(), 400); }); const sb = $('#szBot'); if (sb) sb.setAttribute('aria-label', 'SynthonIA');
  if ($('#szNew')) return true;
  const w = document.createElement('div'); w.id = 'szNew'; w.className = 'szm';
  w.innerHTML = '<div class="tcard gq" role="dialog" aria-modal="true" aria-label="Qué hay de nuevo"><div class="gq-say"><span class="gq-f">' + face('celebrando', 64) + '</span><div><b>SynthonIA · Qué hay de nuevo</b><p></p></div></div>'
    + '<ul class="nw-l">' + WHATSNEW.items.map((x, i) => '<li style="--i:' + i + '">' + esc(x[1]) + '</li>').join('') + '</ul>'
    + '<div class="tbtn gq-b"><button class="lnk" type="button" data-close>Luego</button>' + (onShow ? '<button class="btn sm flow" type="button" data-nw="show">Muéstramelo</button>' : '') + '</div></div>';
  document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  const say = '¡Hay cosas nuevas en ' + BRAND() + '! Te cuento rapidito:';
  const p = $('.gq-say p', w); p.textContent = say; SND.blip('celebrando');
  typeIn(p, { cps:44, max:3, onFrame:lipSync([$('.gq-f .szface', w), ballFace()], say) }).catch(() => {});
  const close = then => { w.classList.remove('on'); setTimeout(() => w.remove(), 420); if (then) setTimeout(then, 280); };
  w.addEventListener('click', e => { if (e.target.closest('[data-nw="show"]')) return close(() => onShow(WHATSNEW.items.map(x => x[0]).filter((k, i, a) => a.indexOf(k) === i && GTOPICS.some(t => t[0] === k)))); if (e.target === w || e.target.closest('[data-close]')) close(); });
  return true;
}

/* ===== v2.0 · MODO ALERTA: si los proveedores dejan de ser gratis (todas las IAs conectadas piden pago),
   la página lo dice claro y espera; apenas vuelvan, te lleva de nuevo solita ===== */
let alertEl = null, alertT = 0;
function alertMode(on){
  if (on && !alertEl){
    if (document.querySelector('#vintro, #intro, #portal')){ setTimeout(() => alertMode(!!SZQ.alert), 3000); return; }
    const pu = (() => { try{ return !!(window.puter && puter.auth && puter.auth.isSignedIn()); }catch(e){ return false; } })();
    const o = document.createElement('div'); o.id = 'szAlert'; o.setAttribute('role', 'alertdialog'); o.setAttribute('aria-live', 'assertive');
    o.innerHTML = '<div class="al-in"><span class="al-f">' + face('preocupada', 84) + '</span><b class="al-t">Error: no podemos continuar</b>'
      + '<p>Las IAs gratis dejaron de responder por un cambio de los servicios que usamos. No es tu culpa y nadie te va a cobrar nada.</p>'
      + '<p class="al-w"><i></i>En cuanto volvamos a estar en línea, te redirigimos solito. No cierres la página.</p>'
      + (pu ? '<button type="button" class="btn sm flow" data-al="pu">Mientras tanto, seguir con mi Puter</button>' : '') + '</div>';
    document.body.appendChild(o); alertEl = o; requestAnimationFrame(() => o.classList.add('on'));
    const pb = $('[data-al="pu"]', o); if (pb) pb.addEventListener('click', () => { alertDismissed = true; alertMode(false); try{ dispatchEvent(new CustomEvent('synthz-useputer')); }catch(e){} });
    try{ telEv('noai', 'modo alerta: ninguna IA gratis responde'); }catch(e){}
    clearInterval(alertT); alertT = setInterval(async () => { if (document.hidden) return; try{ await szCatalog(); }catch(e){} if (!SZQ.alert) alertBack(); }, 60000);   /* Fase 4: cada minuto y solo con la pestaña a la vista (antes 30 s: con miles de personas esperando, era una avalancha justo cuando el servidor está mal) */
  } else if (!on && alertEl){ const o = alertEl; alertEl = null; clearInterval(alertT); o.classList.remove('on'); setTimeout(() => o.remove(), 500); }
}
let alertDismissed = false;
function alertBack(){
  if (!alertEl) return; clearInterval(alertT);
  const o = alertEl; $('.al-f', o).innerHTML = face('celebrando', 84); $('.al-t', o).textContent = '¡Volvimos!'; $$('p, button', o).forEach(x => x.remove());
  o.querySelector('.al-in').insertAdjacentHTML('beforeend', '<p>Ya todo funciona. Te llevo de vuelta…</p>');
  setTimeout(() => location.reload(), 1800);
}
addEventListener('synthz-szq', () => {
  if (SZQ.alert && !alertDismissed) alertMode(true); else if (!SZQ.alert && alertEl) alertBack();
  /* al equipo: SynthonIA avisa una vez por sesión que hay alertas en Pulsem */
  if (SZQ.alertN > 0 && ACC && ACC.user && ['owner', 'admin', 'staff'].includes(ACC.user.role)){
    let seen = false; try{ seen = sessionStorage.getItem('synthz:alertn') === String(SZQ.alertN); sessionStorage.setItem('synthz:alertn', String(SZQ.alertN)); }catch(e){}
    if (!seen) setTimeout(() => { try{ BOTAPI.offer && BOTAPI.offer('Ojo, equipo: hay ' + SZQ.alertN + (SZQ.alertN === 1 ? ' alerta' : ' alertas') + ' de las IAs (un proveedor pidió pago o cambió su plan gratis). Nada se cobró. Revísalo en Pulsem.', 'preocupada', 'Abrir Pulsem', () => { location.href = 'pulsem.html'; }); }catch(e){} }, 4000);
  }
});
/* ---------- v2.3 · aviso de mantenimiento: cubre la página y SynthonIA (la de verdad) charla un rato ----------
   Lo encienden Prime o ZFlow en Pulsem › Ajustes. Pulsem nunca se cubre (desde ahí se apaga).
   SynthonIA cambia de cara según lo que le dicen: con cariño se encanta, con chistes se ríe, si piensa pone cara de pensar.
   Si la IA no responde (puede ser justo la falla), contesta con frases propias para que la charla nunca se corte. */
const MT = { el:null, hist:[], timer:0, mood:'feliz', busy:false, since:0, idle:0 };
const MT_LOVE = /(gracias|te quiero|te amo|te adoro|eres (muy |la |una )?(linda|bonita|hermosa|genial|la mejor|incre[ií]ble|tierna|buena|top)|qu[eé] (linda|bonita|tierna|genial)|me (caes|encantas|gustas)|eres lo m[aá]ximo|abrazo|besito|❤|♥|💖|😍|🥰)/i;
const MT_FUN = /(ja(ja)+|je(je)+|xd|😂|🤣|chiste|gracios)/i;
const MT_SAD = /(fe[ao]|odio|aburr|mala|lent[ao]|demora|cu[aá]ndo vuelve)/i;
/* v3.7 · falta de respeto: ya no pide perdón; pone el límite con firmeza y elegancia (el servidor responde igual, sin gastar IA) */
const MT_RUDE = /\b(idiota|est[uú]pid[ao]|imb[eé]cil|pendej[ao]|malparid[ao]|gonorrea|hijueputa|hp|hdp|puta|maric[oó]n|perra|zorra|mierda|c[aá]llate|idiot|stupid|moron|bitch|fuck\w*|shit\w*|asshole|shut up)\b|\b(eres|you'?re|you are)\s+(una?\s+|muy\s+|so\s+|a\s+)?(tonta|in[uú]til|basura|fea|dumb|useless|trash|ugly)\b/i;
const mtOff = () => /pulsem/.test(location.pathname);
const mtAdmin = () => !!(ACC && ACC.user && ['owner', 'admin'].includes(ACC.user.role));
const mtTeam = () => !!(ACC && ACC.user && ['owner', 'admin', 'staff'].includes(ACC.user.role));
const mtSkipped = () => { try{ return sessionStorage.getItem('synthz:mtskip') === '1'; }catch(e){ return false; } };

/* frases propias por si la IA no está (la falla puede ser justo esa) */
const MT_LOCAL = {
  love:['¡Ay, me sonrojé! 💛 Gracias, de verdad. Tú también eres lo máximo.', '¡Me hiciste el día! Ya casi vuelvo con todo, gracias por esperarme.', 'Awww 🥰 Con gente como tú da gusto arreglar cosas.'],
  fun:['¡Jajaja! Me dio risa hasta en los circuitos.', 'Jaja, ¿te sabes otro? Mientras tanto el equipo sigue arreglando.', '¡Me hiciste reír! Eso me recarga más que la electricidad.'],
  rude:['Así no. Con respeto te ayudo en lo que quieras.', 'Ese tono no va conmigo. Si quieres seguimos, pero con respeto.'],
  sad:['Uy… tienes razón en estar molesto. Estamos trabajando para que vuelva pronto y mejor.', 'Perdón por la espera. El equipo está en ello, te lo prometo.'],
  any:['¡Te escucho! Ahora mismo no puedo pensar muy profundo porque estamos arreglando cosas, pero aquí sigo contigo.', 'Mientras se arregla todo, cuéntame: ¿qué es lo primero que quieres hacer cuando vuelva SynthFlow?', 'Buena pregunta. En cuanto termine el mantenimiento te respondo mejor. ¿Me cuentas algo más?']
};
const mtPick = L => L[Math.floor(Math.random() * L.length)];
const mtKind = q => MT_RUDE.test(q) ? 'rude' : MT_LOVE.test(q) ? 'love' : MT_FUN.test(q) ? 'fun' : MT_SAD.test(q) ? 'sad' : 'any';
const MT_MOOD_OF = { love:'encantada', fun:'riendo', sad:'disculpa', rude:'neutral', any:'feliz' };

function mtSetMood(m, hop){
  if (!MT.el) return;
  MT.mood = FACE[m] ? m : 'feliz';
  const w = $('.mt-face', MT.el); w.innerHTML = face(MT.mood, 168, 'mt-sz');
  if (hop && !reduce) w.animate([{ transform:'translateY(0) scale(1)' }, { transform:'translateY(-18px) scale(1.06)' }, { transform:'translateY(0) scale(.97)' }, { transform:'none' }], { duration:620, easing:'cubic-bezier(.3,1.6,.5,1)' });
}
function mtBurst(kind){
  if (!MT.el || reduce) return;
  const box = $('.mt-face', MT.el), ch = kind === 'love' ? ['💛', '💖', '✨', '💗'] : ['✨', '⭐', '😄'];
  for (let i = 0; i < 9; i++){
    const s = document.createElement('i'); s.className = 'mt-pt'; s.textContent = ch[i % ch.length];
    const a = (Math.PI * 2 * i) / 9 + Math.random() * .5, d = 70 + Math.random() * 60;
    box.appendChild(s);
    s.animate([{ transform:'translate(-50%,-50%) scale(.4)', opacity:0 }, { opacity:1, offset:.2 }, { transform:'translate(calc(-50% + ' + Math.cos(a) * d + 'px), calc(-50% + ' + (Math.sin(a) * d - 30) + 'px)) scale(1.15)', opacity:0 }], { duration:1300 + Math.random() * 500, easing:'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
  }
}
function mtAdd(role, text, mood){
  const L = $('.mt-msgs', MT.el), d = document.createElement('div');
  d.className = 'mt-m ' + (role === 'user' ? 'me' : 'ia');
  d.innerHTML = '<p></p>'; if (role === 'user') $('p', d).textContent = text; else $('p', d).innerHTML = synMd(text); L.appendChild(d);
  L.scrollTo({ top:L.scrollHeight, behavior:reduce ? 'auto' : 'smooth' });
  MT.hist.push({ role, content:text });
  if (role !== 'user'){
    if (mood) mtSetMood(mood);
    typeIn($('p', d), { cps:42, max:4, onFrame:lipSync([$('.mt-face .szface', MT.el)], text) }).catch(() => {});
  }
}
async function mtSend(q){
  q = String(q || '').trim(); if (!q || MT.busy) return;
  const inp = $('.mt-in', MT.el); inp.value = '';
  mtAdd('user', q);
  const kind = mtKind(q);
  if (kind === 'love' || kind === 'fun'){ mtSetMood(MT_MOOD_OF[kind], true); mtBurst(kind); try{ SND.flow(); }catch(e){} }
  else mtSetMood('pensando');
  MT.busy = true; $('.mt-send', MT.el).disabled = true; MT.el.classList.add('thinking');
  let text = '', mood = MT_MOOD_OF[kind];
  try{
    const r = await fetch('/api/help', { method:'POST', headers:Object.assign({ 'content-type':'application/json' }, B.SESS ? { authorization:'Bearer ' + B.SESS } : {}), body:JSON.stringify({ action:'ask', ctx:'maint', q, lang:B.LANG, hist:MT.hist.slice(-7, -1) }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.text){ text = d.text; if (d.mood && FACE[d.mood]) mood = d.mood; }
  }catch(e){}
  if (!text) text = mtPick(MT_LOCAL[kind]);
  await sleepRaw(kind === 'love' ? 650 : 250);
  MT.busy = false; $('.mt-send', MT.el).disabled = false; MT.el.classList.remove('thinking');
  mtAdd('assistant', text, mood);
  clearTimeout(MT.back); MT.back = setTimeout(() => { if (MT.el && !MT.busy) mtSetMood('feliz'); }, 7000);
}
function mtExit(){
  const x = MT.el && $('.mt-exit', MT.el); if (!x) return;
  x.hidden = !mtAdmin();
  /* «Iniciar sesión»: se va si ya hay cuenta; si es del equipo aparece «Ir a Pulsem» (desde ahí se apaga el mantenimiento) */
  const lg = $('.mt-login', MT.el), box = $('.mt-auth', MT.el), pu = $('.mt-pulsem', MT.el), on = !!(ACC && ACC.user);
  if (lg) lg.hidden = on; if (box && on) box.hidden = true; if (pu) pu.hidden = !mtTeam();
}
function mtAgo(){
  if (!MT.el || !MT.since) return;
  const m = Math.max(1, Math.round((Date.now() - MT.since) / 60e3));
  $('.mt-ago', MT.el).textContent = m < 60 ? 'Trabajando en ello desde hace ' + m + ' min' : 'Trabajando en ello desde hace ' + Math.round(m / 60) + ' h';
}
function mtOpen(m){
  MT.since = m.t || MT.since || Date.now();
  if (MT.el){ $('.mt-text', MT.el).textContent = m.text; mtAgo(); return; }
  const el = document.createElement('div');
  el.id = 'szMaint'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'SymphorIA está en mantenimiento');
  el.innerHTML = '<div class="mt-bg" aria-hidden="true"><i></i><i></i><i></i></div>'
    + '<div class="mt-wrap"><div class="mt-face" title="¡Tócame!"></div>'
    + '<div class="mt-head"><span class="mt-chip"><i></i>Mantenimiento</span><h2>Volvemos en un momento</h2><p class="mt-text"></p><small class="mt-ago"></small></div>'
    + '<div class="mt-chat"><div class="mt-msgs" aria-live="polite"></div>'
    + '<div class="mt-sugs">' + ['Cuéntame un chiste', '¿Qué estás arreglando?', 'Eres la mejor 💛'].map(s => '<button type="button" class="mt-sug">' + esc(s) + '</button>').join('') + '</div>'
    + '<form class="mt-form" autocomplete="off"><input class="mt-in" maxlength="300" placeholder="Charla con SynthonIA…" aria-label="Escribir a SynthonIA"><button class="mt-send" type="submit" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></form></div>'
    + '<div class="mt-acct"><button class="mt-login" type="button"><span>Iniciar sesión</span></button><div class="mt-auth" hidden></div>'
    + '<a class="mt-pulsem" href="/pulsem" hidden><span>Ir a Pulsem</span><small>Ahí se activa y se desactiva el mantenimiento</small></a></div>'
    + '<button class="mt-exit" type="button" hidden>Entrar igual · solo Prime y ZFlow</button></div>';
  document.body.appendChild(el); document.documentElement.classList.add('mt-on');
  MT.el = el;
  $('.mt-text', el).textContent = m.text;
  mtSetMood('feliz'); mtAgo(); mtExit();
  $('.mt-form', el).addEventListener('submit', e => { e.preventDefault(); mtSend($('.mt-in', el).value); });
  $('.mt-sugs', el).addEventListener('click', e => { const b = e.target.closest('.mt-sug'); if (b){ mtSend(b.textContent); b.remove(); } });
  $('.mt-face', el).addEventListener('click', () => { const k = MT.mood === 'riendo' ? 'encantada' : 'riendo'; mtSetMood(k, true); mtBurst(k === 'encantada' ? 'love' : 'fun'); });
  $('.mt-login', el).addEventListener('click', () => {
    const box = $('.mt-auth', el), open = box.hidden;
    box.hidden = !open; el.classList.toggle('mt-authing', open);
    if (open){
      if (!box.firstChild) authBox(box, () => { box.hidden = true; el.classList.remove('mt-authing'); mtExit(); }, () => {}, 'login');
      if (!reduce) box.animate([{ opacity:0, transform:'translateY(10px)' }, { opacity:1, transform:'none' }], { duration:360, easing:'cubic-bezier(.22,1,.36,1)' });
      setTimeout(() => { const i = $('input', box); if (i) i.focus({ preventScroll:true }); }, 120);
    }
  });
  $('.mt-exit', el).addEventListener('click', () => { try{ sessionStorage.setItem('synthz:mtskip', '1'); }catch(e){} mtClose(); });
  if (!reduce) el.animate([{ opacity:0 }, { opacity:1 }], { duration:500 });
  setTimeout(() => { if (MT.el && !MT.hist.length) mtAdd('assistant', '¡Hola! Soy SynthonIA. Estamos dejando todo mejor para ti. Mientras tanto, ¿charlamos un rato?', 'feliz'); }, 650);
  /* de vez en cuando hace un gesto, para que se sienta viva */
  clearInterval(MT.idle); MT.idle = setInterval(() => { if (MT.el && !MT.busy && MT.mood === 'feliz' && !document.hidden){ const g = mtPick(['guino', 'flow', 'riendo']); mtSetMood(g); setTimeout(() => { if (MT.el && MT.mood === g) mtSetMood('feliz'); }, 1800); } }, 9000);
  if (matchMedia('(hover:hover)').matches) setTimeout(() => { const i = MT.el && $('.mt-in', MT.el); if (i) i.focus({ preventScroll:true }); }, 500);
}
function mtClose(){
  if (!MT.el) return;
  const el = MT.el; MT.el = null; clearInterval(MT.idle);
  document.documentElement.classList.remove('mt-on');
  if (reduce) el.remove(); else el.animate([{ opacity:1 }, { opacity:0 }], { duration:380 }).onfinish = () => el.remove();
}
let mtLastCheck = 0;
async function mtCheck(){
  try{
    mtLastCheck = Date.now();
    const { ok, d } = B.cfgFetch ? await B.cfgFetch() : await fetch('/api/config', { cache:'no-store' }).then(async r => ({ ok:r.ok, d:r.ok ? await r.json() : {} })); if (!ok) return;
    const m = d.maint || {};
    if (m.on && !mtSkipped()) mtOpen({ text:m.text || 'Estamos presentando fallas o actualizaciones. Espera un momento.', t:m.t });
    else if (!m.on){ mtClose(); try{ sessionStorage.removeItem('synthz:mtskip'); }catch(e){} }
  }catch(e){}
}
if (!mtOff()){
  /* v3.7 · costo cero: con el aviso encendido se revisa cada 45 s (para saber cuándo termina); apagado, cada 5 min */
  let mtLast = 0;
  const go = () => { mtCheck(); mtLast = Date.now(); MT.timer = setInterval(() => { mtAgo(); if (document.hidden) return; if (MT.el || Date.now() - mtLast > 300000){ mtLast = Date.now(); mtCheck(); } }, 45000); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  addEventListener('synthz-acc', mtExit); accHooks.push(() => setTimeout(mtExit, 0));
  /* Fase 4 · al volver a la pestaña se revisa, pero no más de una vez por minuto (antes: cada cambio de pestaña era una llamada) */
  document.addEventListener('visibilitychange', () => { if (!document.hidden && (MT.el || Date.now() - mtLastCheck > 60e3)) mtCheck(); });
}
/* ===== v3.1 · Movimiento: SynthonIA sabe por qué todo se mueve, cómo apagarlo y qué cambió =====
   La capa de animaciones vive en movimiento.css / movimiento.js (src/movimiento*). Aquí solo va lo que SynthonIA cuenta y las novedades. */
WHATSNEW.v = '3.1';
WHATSNEW.items.unshift(
  ['guia', B.LANG === 'en'
    ? 'Where to tap is easy to see now: «Start free», the Next and Show me buttons of the guide and «Connect Puter» have a light flowing around their edge. And the «this is how it will look» preview in Settings moves again, with the new design.'
    : 'Ahora se ve dónde tocar: «Empezar gratis», los botones de Siguiente y Muéstrame de la guía y «Conectar Puter» tienen una luz que corre por su borde. Y la vista previa «así se verá» de Ajustes se mueve otra vez, con el diseño nuevo.'],
  ['portada', B.LANG === 'en'
    ? 'Animations are back everywhere: blocks glide in as you scroll, cards glow under your pointer, buttons ripple when you tap them, and windows and lists come in one after another.'
    : 'Volvieron las animaciones en todo: los bloques entran al bajar, las tarjetas brillan bajo tu puntero, los botones dejan una onda al tocarlos y las ventanas y listas entran una tras otra.'],
  ['ajustes', B.LANG === 'en'
    ? 'Your Settings decide now, not your computer: if Windows has its visual effects off, ' + BRAND() + ' still looks complete. To make it calmer, turn off Animations or use the faster mode in Settings.'
    : 'Ahora mandan tus Ajustes, no tu computador: aunque Windows tenga apagados sus efectos visuales, ' + BRAND() + ' se ve completa. Si la quieres más tranquila, apaga Animaciones o usa el modo más rápido en Ajustes.']
);
BOT_FAQ.push(
  { k:'animacion animaciones movimiento mueve moverse brillo onda efecto efectos transicion transiciones smooth suave animation animations motion moving glow ripple effects transition',
    a:'Todo se mueve a propósito: los bloques entran al bajar, las tarjetas brillan bajo tu puntero, los botones dejan una onda al tocarlos, los íconos saltan y las ventanas entran en cascada. Solo se mueve lo que no pesa (posición y transparencia), así va fluido hasta en el celular. Si prefieres calma: Ajustes › «Animaciones», o el modo «Más rápido».',
    en:'Everything moves on purpose: blocks glide in as you scroll, cards glow under your pointer, buttons ripple when you tap them, icons hop and windows cascade in. Only light things move (position and transparency), so it stays smooth even on phones. If you prefer calm: Settings › «Animations», or the «Faster» mode.', pre:openCfg(), go:['#cfgBtn', '[data-tab="cfg"]'] },
  { k:'apagar quitar animaciones lento lag laguea tranquilo marea mareo quieto rapido turn off disable animations slow laggy calm dizzy still faster',
    a:'Para que no se mueva nada: Ajustes › «Animaciones» apagado. Si tu equipo va lento, elige «Más rápido» arriba en Ajustes: quita vidrio, fondo animado y efectos pesados de una vez.',
    en:'To stop everything moving: Settings › «Animations» off. If your device is slow, pick «Faster» at the top of Settings: it removes glass, animated background and heavy effects at once.', pre:openCfg(), go:['#cfgBtn', '[data-tab="cfg"]'] },
  { k:'windows sistema efectos visuales reducir movimiento transparencia accesibilidad por que no se movia simplona fea system visual effects reduce motion transparency accessibility why plain',
    a:'Antes, si Windows (o tu celular) tenía apagados los efectos visuales, ' + BRAND() + ' también apagaba sus animaciones y su vidrio, y se veía simplona. Desde la versión 3.1 mandan tus Ajustes de aquí, no los del sistema: así la ves completa, y la calmas tú cuando quieras.',
    en:'Before, if Windows (or your phone) had its visual effects off, ' + BRAND() + ' also turned off its animations and glass, and looked plain. Since version 3.1 your Settings here decide, not the system\'s: you see it complete, and you calm it down whenever you want.' },
  { k:'next nextjs react tecnologia hecha como esta hecha framework migracion migrar technology built how made migration',
    a:BRAND() + ' se está pasando a Next.js (React) por partes, sin romper nada: Términos y Privacidad ya están hechas así, y las demás páginas siguen el mismo camino una por una. Para ti no cambia nada: mismas direcciones, misma cuenta, más rápida de mantener y de mejorar.',
    en:BRAND() + ' is moving to Next.js (React) step by step, without breaking anything: Terms and Privacy are already built that way, and the other pages follow one by one. Nothing changes for you: same addresses, same account, quicker to maintain and improve.' }
);
/* ===== v3.2 · barra de escribir, lista de chats y barra Simple: SynthonIA lo cuenta y lo explica ===== */
WHATSNEW.v = '3.2';
WHATSNEW.items.unshift(
  ['chat', B.LANG === 'en'
    ? 'Tidier chat list: on top only «New chat» and search, and below all your chats. Projects and Synthetics stay in the icon bar; if you want them on top too, pick them in Settings › «Shortcuts in your chats».'
    : 'Lista de chats más limpia: arriba solo «Nuevo chat» y buscar, y debajo todos tus chats. Proyectos y Sintéticos siguen en la barrita de íconos; si los quieres arriba también, elígelos en Ajustes › «Atajos en tus chats».'],
  ['chat', B.LANG === 'en'
    ? 'The Simple style now has a sidebar like Claude\'s: Create, Projects, Synthetics, Customize and More on top, your recent chats in the middle, and your account and a magnifier to search at the bottom.'
    : 'El estilo Simple ahora tiene una barra como la de Claude: Crear, Proyectos, Sintéticos, Personalización y Más arriba, tus chats recientes en medio, y abajo tu cuenta y una lupa para buscar.'],
  ['chat', B.LANG === 'en'
    ? 'The writing box is lighter: «Short answers», Internet and Image are now little bubbles next to the «+» (hover to see the name, tap to turn off). And the EnerX battery is smaller.'
    : 'La caja de escribir quedó más liviana: «Respuestas cortas», Internet e Imagen ahora son bolitas junto al «+» (pasa el puntero para ver el nombre, tócalas para apagar). Y la batería EnerX es más pequeña.'],
  ['chat', B.LANG === 'en'
    ? 'Every new chat greets you with a different phrase. And if you don\'t know what «FlowIA» means, tap the button under the greeting: it is explained there.'
    : 'Cada chat nuevo te saluda con una frase distinta. Y si no sabes qué significa «FlowIA’r», toca el botón debajo del saludo: ahí te lo explicamos.'],
  ['synthonia', B.LANG === 'en'
    ? 'If you leave the page alone for 2 minutes I fall asleep in the middle of the screen. A minute and a half later I wake up and play with the page: I hang from titles, exercise, juggle… When you come back I get a fright, run to my corner and say «Oh, you\'re back!».'
    : 'Si dejas la página quieta 2 minutos me duermo en la mitad de la pantalla. Un minuto y medio después me despierto y juego con la página: me cuelgo de los títulos, hago ejercicio, malabares… Cuando vuelves me asusto, corro a mi rincón y te digo «¡Ah, volviste!».']
);
BOT_FAQ.push(
  { k:'flow flowia flowiar flowiando flowiamos que significa que es significado palabra ingles what does mean meaning word',
    a:'«Flow» (se dice «flou») es una palabra en inglés que significa fluir, como el agua de un río: cuando todo sale fácil, sin trabarse. «IA» es la inteligencia artificial. «FlowIA’r» es un verbo que inventamos uniendo las dos: hacer lo que necesitas (escribir, estudiar, crear, programar) de forma fácil, con ayuda de la IA. «¿Qué quieres FlowIA’r hoy?» = «¿Qué quieres hacer hoy con ayuda de la IA?».',
    en:'«Flow» means flowing, like water in a river: when everything goes easy, without getting stuck. «IA» is how Spanish says AI (artificial intelligence). «FlowIA» is a word we made up by joining them: doing what you need (write, study, create, code) the easy way, with the help of AI. «What do you want to FlowIA today?» = «What would you like to do today with the help of AI?».' },
  { k:'proyectos sinteticos barra lista chats arriba quitar poner atajos projects synthetics sidebar list shortcuts top remove add',
    a:'Arriba de tu lista de chats solo van «Nuevo chat» y buscar. Si quieres también Proyectos, Sintéticos o los dos, elígelo en Ajustes › Página › «Atajos en tus chats». Siempre los tienes en la barrita de íconos de la izquierda.',
    en:'Above your chat list there are only «New chat» and search. If you also want Projects, Synthetics or both, choose it in Settings › Page › «Shortcuts in your chats». They are always in the icon bar on the left.', pre:openCfg(), go:['#cfgBtn', '[data-tab="cfg"]'] },
  { k:'frase frases saludo saludos bienvenida repite repiten cambia distinta greeting greetings phrase phrases repeat different welcome',
    a:'Al entrar siempre te saludo con «¿Qué quieres FlowIA’r hoy?». En cada chat nuevo sale otra frase, y ninguna se repite hasta que salgan las 40. Debajo del saludo está el botón «¿Qué significa FlowIA’r?»: sin cuenta sale siempre; con cuenta, la primera vez.',
    en:'When you come in I always greet you with «What do you want to FlowIA today?». Every new chat shows another phrase, and none repeats until all 40 have shown. Under the greeting there is the «What does FlowIA mean?» button: without an account it always shows; with an account, the first time.' },
  { k:'simple estilo barra lateral claude crear personalizacion mas cuenta lupa recientes sidebar create customize more account magnifier recents',
    a:'En el estilo Simple la barra es como la de Claude: arriba Crear (chat nuevo), Proyectos, Sintéticos, Personalización (tus Ajustes) y Más (favoritos, tu EnerX, la guía y el centro de ayuda). En medio, «Recientes» con tus chats, y abajo tu cuenta y una lupa para buscar. Se elige en Ajustes › Página › Estilo › Simple.',
    en:'In the Simple style the sidebar is like Claude\'s: on top Create (new chat), Projects, Synthetics, Customize (your Settings) and More (favorites, your EnerX, the guide and the help center). In the middle, «Recents» with your chats, and at the bottom your account and a magnifier to search. Choose it in Settings › Page › Style › Simple.', pre:openCfg(), go:['#cfgBtn', '[data-tab="cfg"]'] },
  { k:'bolita bolitas hojita junto mas chip chips encendido apagar internet imagen cortas bubble bubbles leaf next plus on off',
    a:'Lo que tengas encendido en la caja de escribir (Respuestas cortas, Internet, Crear imagen) aparece como una bolita junto al «+». Pasa el puntero para ver su nombre y tócala para apagarlo.',
    en:'Whatever you have on in the writing box (Short answers, Internet, Create image) shows as a little bubble next to the «+». Hover to see its name and tap it to turn it off.', go:['#onChips', '#attachBtn'] },
  { k:'dormida pantalla mitad duerme duermes dormirte despiertas despierta dormir sueño juega jugar inactiva quieta siesta ejercicio malabares volviste asleep sleep sleeping play plays idle nap exercise juggle back',
    a:'Si dejas la página quieta 2 minutos, salgo de mi rincón y me duermo en la mitad de la pantalla. Un minuto y medio después me despierto y juego con la página: me cuelgo de un título, hago ejercicio, malabares, rebotes… Tres juegos y vuelvo a dormir. Cuando mueves el mouse me asusto, corro a mi rincón y te digo «¡Ah, volviste!». Nada se daña: todo vuelve a su lugar. Con Animaciones apagadas solo me duermo en mi bolita.',
    en:'If you leave the page still for 2 minutes, I leave my corner and fall asleep in the middle of the screen. A minute and a half later I wake up and play with the page: I hang from a title, exercise, juggle, bounce… Three games and I sleep again. When you move the mouse I get a fright, run to my corner and say «Oh, you\'re back!». Nothing breaks: everything goes back in place. With Animations off I just sleep in my bubble.' }
);
/* si alguien pregunta por «la barra del estilo Simple», gana la respuesta nueva (antes ganaba la de colores y temas) */
{ const i = BOT_FAQ.findIndex(f => f.k.startsWith('simple estilo barra lateral')); if (i > 0) BOT_FAQ.unshift(BOT_FAQ.splice(i, 1)[0]); }
/* ===== v4.4 · «Entrada»: la carga de Gestión en todo el sitio. SynthonIA lo cuenta y lo explica ===== */
WHATSNEW.v = '4.4';
WHATSNEW.items.unshift(
  ['chat', B.LANG === 'en'
    ? 'Pages now open more smoothly: while something loads you see its shape with a light sweeping across it, then the title flashes once and everything rises into place. No more color flash when SynthFlow opens.'
    : 'Las páginas ahora abren más suave: mientras algo carga ves su forma con una luz que la recorre, luego el título destella una vez y todo sube a su lugar. Se acabó el fogonazo de color al abrir SynthFlow.']
);
BOT_FAQ.unshift(
  { k:'carga cargando carga lenta esqueleto brillo cajas grises abrir abre tarda entrada telon loading skeleton shimmer grey boxes slow opening',
    a:'Mientras una página o un panel carga te muestro su forma en vacío con una luz que la recorre, así sabes qué viene. Cuando está lista se funde, el título destella y todo sube a su lugar. Si apagas Animaciones en Ajustes, no se mueve nada.',
    en:'While a page or a panel loads I show you its empty shape with a light sweeping across it, so you know what is coming. When it is ready it fades away, the title flashes and everything rises into place. If you turn Animations off in Settings, nothing moves.' }
);
/* ===== v1.4 · eventos especiales: a las 50, 100 y 500 visitas la página «se hackea» y das un logro ===== */
const EV = (() => {
  const K = 'synthz:visits', A = 'synthz:ach';
  let visits = 0; try{ visits = +localStorage.getItem(K) || 0; if (!sessionStorage.getItem('synthz:vcount')){ visits++; localStorage.setItem(K, String(visits)); sessionStorage.setItem('synthz:vcount', '1'); } }catch(e){}
  const ach = () => { try{ return JSON.parse(localStorage.getItem(A)) || {}; }catch(e){ return {}; } };
  const force = (() => { try{ return new URLSearchParams(location.search).get('evento'); }catch(e){ return null; } })();
  const pending = () => { if (force && /^(50|100|500)$/.test(force)) return +force; const a = ach(); return [500, 100, 50].find(n => visits >= n && !a[n]) || 0; };
  const mark = n => { const a = ach(); a[n] = Date.now(); try{ localStorage.setItem(A, JSON.stringify(a)); }catch(e){} push(); };
  /* si tienes cuenta, el logro queda guardado en ella (así cuenta para los descuentos de 100 y 500) */
  const push = () => { const a = ach(); if (!B.SESS || !Object.keys(a).length) return; api('me', { method:'PUT', body:{ ach:a }, keep:true }).catch(() => {}); };
  addEventListener('synthz-acc', push);
  const CODE = ['import { flow } from "synthz/core"', 'const z = await vidrio.fundir("Z")', 'synthonia.despertar({ modo:"hack" })', 'for (const ia of IAs_conectadas) ia.sincronizar()', '[OK] compilando SynthFlow…', 'reconstruyendo vidrio líquido ████████░░', 'flow.calibrar(0.9998)', 'if (usuario.visitas > LIMITE) desbloquear(logro)', '[OK] núcleo de Flow estable', 'cargando la página otra vez…', 'z.render({ brillo:true })', 'SymphorIA.reiniciar() // no te asustes 😉'];
  function overlay(kind){
    const o = document.createElement('div'); o.className = 'hackev k' + kind; o.setAttribute('aria-hidden', 'true');
    o.innerHTML = '<canvas></canvas><div class="hk-code"></div><div class="hk-bar"><i></i></div><div class="hk-t"></div>';
    document.body.appendChild(o); return o;
  }
  /* lluvia de código (verde o roja) o viaje por las estrellas (500) */
  function sky(o, kind){
    const c = $('canvas', o), x = c.getContext('2d'); let W, H, run = true;
    const fit = () => { W = c.width = innerWidth * (devicePixelRatio > 1 ? 1.5 : 1); H = c.height = innerHeight * (devicePixelRatio > 1 ? 1.5 : 1); c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px'; };
    fit();
    if (kind === 500){
      const S = Array.from({ length:420 }, () => ({ a:Math.random() * Math.PI * 2, r:Math.random() * 40, v:.6 + Math.random() * 3.4, h:Math.random() < .5 ? 42 : Math.random() < .5 ? 300 : 340 }));
      (function f(){ if (!run) return; x.fillStyle = 'rgba(6,4,14,.24)'; x.fillRect(0, 0, W, H); const cx = W / 2, cy = H / 2;
        S.forEach(s => { const r0 = s.r; s.r += s.v * (1 + s.r / 80); if (s.r > Math.hypot(W, H) / 1.6){ s.r = Math.random() * 20; s.a = Math.random() * Math.PI * 2; }
          x.strokeStyle = 'hsla(' + s.h + ',90%,72%,' + Math.min(1, s.r / 200) + ')'; x.lineWidth = 1 + s.r / 300; x.beginPath(); x.moveTo(cx + Math.cos(s.a) * r0, cy + Math.sin(s.a) * r0); x.lineTo(cx + Math.cos(s.a) * s.r, cy + Math.sin(s.a) * s.r); x.stroke(); });
        requestAnimationFrame(f); })();
    } else {
      const fs = 16, cols = Math.ceil(W / fs), drops = Array.from({ length:cols }, () => Math.random() * -40), col = kind === 100 ? '255,70,70' : '80,255,140';
      (function f(){ if (!run) return; x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, 0, W, H); x.font = fs + 'px monospace';
        drops.forEach((d, i) => { x.fillStyle = 'rgba(' + col + ',' + (.35 + Math.random() * .65) + ')'; x.fillText(String.fromCharCode(0x30A0 + Math.random() * 96 | 0), i * fs, d * fs); drops[i] = d * fs > H && Math.random() > .975 ? 0 : d + 1; });
        requestAnimationFrame(f); })();
    }
    return () => { run = false; };
  }
  async function typeCode(o, kind){
    const box = $('.hk-code', o), bar = $('.hk-bar i', o), lines = kind === 100 ? ['⚠ ALERTA: el núcleo de Flow se sobrecalentó', 'desviando energía a SynthonIA…', ...CODE.slice(2, 9), '[OK] temperatura normal'] : CODE;
    for (let i = 0; i < lines.length; i++){
      const ln = document.createElement('div'); box.appendChild(ln);
      for (const ch of lines[i]){ ln.textContent += ch; if (Math.random() < .5) await sleepRaw(6); }
      bar.style.transform = 'scaleX(' + ((i + 1) / lines.length).toFixed(3) + ')';
      await sleepRaw(90);
      if (box.children.length > 14) box.firstChild.remove();
    }
  }
  /* el «error»: la página se distorsiona un momento */
  async function glitch(ms, kind){
    root.classList.add('glitching'); if (kind === 100) root.classList.add('glitch-red');
    await sleepRaw(ms); root.classList.remove('glitching', 'glitch-red');
  }
  function botBig(on, mood){ const b = BOT.el; if (!b) return; b.classList.toggle('g2', on); b.classList.toggle('evfront', on); if (on){ BOT.sticky = null; botFace(mood || 'sorprendida', true); } else botFace('feliz', true); }
  async function play(n){
    mark(n);
    try{ sessionStorage.setItem('synthz:achShow', String(n)); }catch(e){}
    portalLock(true); botBig(true, 'sorprendida');
    await glitch(n === 500 ? 500 : 1100, n);
    const o = overlay(n); requestAnimationFrame(() => o.classList.add('on'));
    const stop = sky(o, n);
    if (n === 500){
      $('.hk-t', o).innerHTML = '<img src="media/v30/symphoria.svg" alt=""><b>MODO GALAXIA</b><small>Viajaste 500 veces por SymphorIA</small>';
      botFace('encantada', true); await sleepRaw(4200);
    } else {
      $('.hk-t', o).textContent = n === 100 ? 'SISTEMA SOBRECARGADO' : 'SYNTHZ SE ESTÁ REPROGRAMANDO';
      botFace(n === 100 ? 'preocupada' : 'pensando', true); await typeCode(o, n); await sleepRaw(400);
    }
    o.classList.add('out'); botFace('celebrando', true);
    await sleepRaw(700); stop(); o.remove(); portalLock(false); setTimeout(() => botBig(false), 2500);
  }
  /* el logro: entra deslizándose por arriba a la derecha */
  function badge(n){
    const t = { 50:['50', 'Has entrado más de 50 veces a la página.', ''], 100:['100', 'Has entrado más de 100 veces a la página.', 'Se te tendrá en cuenta para descuentos exclusivos cuando lleguen los pagos.'], 500:['500', 'Has entrado más de 500 veces. Eres leyenda de SymphorIA.', 'Se te tendrá en cuenta para descuentos exclusivos cuando lleguen los pagos.'] }[n];
    const b = document.createElement('div'); b.className = 'achv a' + n; b.setAttribute('role', 'status');
    b.innerHTML = '<span class="ac-i">' + (n === 500 ? '<img src="media/v30/symphoria.svg" alt="">' : '<b>' + t[0] + '</b>') + '</span><div><small>EVENTO ESPECIAL DESBLOQUEADO</small><h4>' + esc(t[1]) + '</h4><p>Este logro es 1 en un millón.</p>' + (t[2] ? '<p class="ac-d">' + esc(t[2]) + '</p>' : '') + '</div><button type="button" aria-label="Cerrar">×</button>';
    document.body.appendChild(b); requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add('on')));
    try{ SND.done(); }catch(e){}
    const close = () => { b.classList.remove('on'); setTimeout(() => b.remove(), 700); };
    $('button', b).addEventListener('click', close); setTimeout(close, n === 50 ? 9000 : 14000);
  }
  /* de vez en cuando (muy raro) solo un «error» corto, sin logro */
  function maybeGlitch(){ if (Math.random() < 1 / 120 || force === 'glitch') setTimeout(() => { if (!document.querySelector('#vintro,#intro,#portal,.szm')) glitch(900); }, 6000 + Math.random() * 20000); }
  /* al llegar con un logro pendiente de mostrar */
  function onLoad(){
    let show = 0; try{ show = +sessionStorage.getItem('synthz:achShow') || 0; sessionStorage.removeItem('synthz:achShow'); }catch(e){}
    if (show) setTimeout(() => badge(show), 1600);
    else if (isFlow() && pending()) setTimeout(async () => { if (document.querySelector('.szm,#portal') || root.classList.contains('guiding')) return; const n = pending(); await play(n); badge(n); try{ sessionStorage.removeItem('synthz:achShow'); }catch(e){} }, 3500);
    maybeGlitch();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onLoad); else setTimeout(onLoad, 50);
  return { pending, play, badge, get visits(){ return visits; } };
})();
/* lo que SynthonIA le devuelve a core (y por SZ, a cada página) */
B.ready({ face, synBody, synSet, lipSync, ballFace, randomGoodFace, wasAway, FACE_GOOD, SPOSE, GTOPICS, botOpen, botTeam, feedbackModal, guideChooser, welcomeBack, guideAsk, whatsNew, SND, HAND, BOTAPI, EV });
})();
