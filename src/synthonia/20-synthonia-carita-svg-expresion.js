/* ---------- Sona: su carita de robot (SVG), con una expresión para cada momento ---------- */
const FACE_G = '#3DE0FF';   /* los ojos son pantallitas de neón cian */
/* ChasisSona aporta la pantalla, la antena recta y el torso. FACE conserva las expresiones. */
const FACE_EYE = '#3de0ff';
(function faceDefs(){
  if (document.getElementById('szFaceDefs')) return;
  const d = document.createElement('div'); d.id = 'szFaceDefs'; d.setAttribute('aria-hidden', 'true');
  d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = '<svg width="0" height="0"><defs>'
    /* vidrio negro: un brillo gris arriba a la izquierda y casi negro abajo */
    + '<linearGradient id="rbBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2c2c3b"/><stop offset=".38" stop-color="#11111a"/><stop offset="1" stop-color="#040408"/></linearGradient>'
    /* el filo de neón de toda la cabeza (en coordenadas de la carita, para que también pinte líneas rectas) */
    + '<linearGradient id="rbRim" gradientUnits="userSpaceOnUse" x1="12" y1="10" x2="88" y2="86"><stop offset="0" stop-color="#ff5fae"/><stop offset=".5" stop-color="#a866ff"/><stop offset="1" stop-color="#3de0ff"/></linearGradient>'
    + '<radialGradient id="rbScreen" cx=".5" cy=".3" r=".85"><stop offset="0" stop-color="#171726"/><stop offset=".6" stop-color="#07070d"/><stop offset="1" stop-color="#010103"/></radialGradient>'
    + '<linearGradient id="rbSheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ff4ff" stop-opacity="0"/><stop offset=".5" stop-color="#9ff4ff" stop-opacity=".2"/><stop offset="1" stop-color="#9ff4ff" stop-opacity="0"/></linearGradient>'
    /* el brillo que deja en el piso cuando flota */
    + '<radialGradient id="rbFloor" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff4fa3" stop-opacity=".55"/><stop offset=".55" stop-color="#7B3FF2" stop-opacity=".18"/><stop offset="1" stop-color="#7B3FF2" stop-opacity="0"/></radialGradient>'
    + '<clipPath id="rbScr"><rect x="26.5" y="35.5" width="47" height="36" rx="11"/></clipPath>'
    + '<filter id="szEye" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    + '<filter id="rbNeon" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="1.3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    + '</defs></svg>';
  (document.body || document.documentElement).appendChild(d);
})();
/* detalles que aparecen alrededor según la cara (escáner, foco de idea, falla) */
const FFX_C = '#9ff4ff';
const FFX = {
  bulb:'<g class="fx"><circle cx="90" cy="12" r="6.5" fill="#ffe38a"/><rect x="87.5" y="18" width="5" height="4" rx="1" fill="#d9bd6a"/><path d="M78 6l2 4M98 4l-2 4M100 14h-3" stroke="#ffe38a" stroke-width="1.6" stroke-linecap="round"/></g>',
  scan:'<g class="fx fscan" stroke="' + FFX_C + '" stroke-opacity=".28" stroke-width=".8"><path d="M28 40h44M27 48h46M27 56h46M27 64h46"/></g><g class="fx" stroke="' + FFX_C + '" stroke-width="1.8" fill="none" opacity=".9"><path d="M4 18V8h10M86 8h10v10M96 86v10H86M14 96H4V86"/></g>',
  glitch:'<g class="fx fglitch"><rect x="8" y="40" width="14" height="3" fill="#ff5fb4" opacity=".7"/><rect x="78" y="62" width="16" height="3" fill="#3de0ff" opacity=".7"/><rect x="70" y="30" width="8" height="2" fill="#fff" opacity=".5"/></g>'
};
const FACE = (() => {
  const open = (dx, dy) => ['M' + (40 + dx) + ' ' + (48 + dy) + 'v8', 'M' + (60 + dx) + ' ' + (48 + dy) + 'v8'];
  const happy = ['M35 54q5-7 10 0', 'M55 54q5-7 10 0'];
  const heart = x => 'M' + x + ' 58l-5.5-5.5a3.2 3.2 0 0 1 5.5-4a3.2 3.2 0 0 1 5.5 4z';
  const star = x => 'M' + x + ' 45l1.8 3.8 4 .5-3 2.8.8 4-3.6-2-3.6 2 .8-4-3-2.8 4-.5z';
  const ring = x => 'M' + (x - 4.5) + ' 52a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0';
  const PINK = '#ff6fb8', SUN = '#ffe38a';
  return {
    feliz:{ e:open(0, 0) },
    neutral:{ e:open(0, 0) },
    encantada:{ e:[heart(40), heart(60)], ew:1.6, ec:PINK, ef:PINK },
    riendo:{ e:happy },
    guino:{ e:['M40 48v8', 'M55 54q5-7 10 0'] },
    pensando:{ e:open(3, -3), x:'M84 26h.1M91 16h.1', xw:5 },
    sorprendida:{ e:[ring(40), ring(60)], ew:3, b:'M34 41l10-1M56 40l10 1' },
    senalando:{ e:open(4, 0) },
    disculpa:{ e:['M40 51v6', 'M60 51v6'], b:'M34 46l10-4M66 46l-10-4' },
    confundida:{ e:['M40 48v8', 'M60 51v3'], b:'M54 42l12-3' },
    dormida:{ e:['M35 52q5 4 10 0', 'M55 52q5 4 10 0'], ew:3.4, ec:'#8fa6ff', x:'M73 15h8l-8 9h8' },
    celebrando:{ e:[star(40), star(60)], ew:1.5, ec:SUN, ef:SUN, x:'M10 16l4 4M90 14l-4 5M6 32h5M94 30h-5', xw:2.6 },
    esperando:{ e:open(-3, -2), x:'M84 14a6 6 0 1 0 .01 0M84 11v3.5l2.5 2', xw:2 },
    flow:{ glasses:1 },
    preocupada:{ e:open(0, 2), b:'M33 45l11-5M67 45l-11-5', drop:1 },
    triste:{ e:['M40 53v4', 'M60 53v4'], ew:6, ec:'#8fb4ff', b:'M32 47l11-5M68 47l-11-5' },
    auch:{ e:['M34 49l10 4-10 4', 'M55 53q5-4 10 0'], ew:3.4, b:'M32 43l12 5M57 45l10-3', x:'M78 30l4-6M84 36l6-2' },
    /* escucha mirando a un lado (ondas azules), analiza con ojos de barra y su escáner, crea con el foco encendido,
       habla (ondas rosadas) y se «cuelga» cuando hay un error */
    escuchando:{ e:open(-4, -1), w:'l' },
    analizando:{ e:['M34 52h12', 'M54 52h12'], ew:5, fx:'scan' },
    creando:{ e:open(0, -2), fx:'bulb' },
    hablando:{ e:open(0, 0), w:'r' },
    error:{ e:['M35 47l10 10M45 47l-10 10', 'M55 47l10 10M65 47l-10 10'], ew:3.6, ec:'#ff5a7a', fx:'glitch' }
  };
})();
FACE.descansando = FACE.dormida;
const FACE_GOOD = ['feliz', 'riendo', 'guino', 'encantada', 'celebrando', 'flow'];
/* la cabeza de Sona (lo mismo en el botón, los globitos y el cuerpo entero) */
function headSvg(f){
  const G = f.ec || FACE_G, P = (d, st) => d ? '<path d="' + d + '" ' + st + '/>' : '';
  const eyes = f.glasses
    ? '<path d="M28 45h19v6.5a7 7 0 0 1-7 7h-5a7 7 0 0 1-7-7z" fill="#050508" stroke="#3DE0FF" stroke-width="2.2"/><path d="M53 45h19v6.5a7 7 0 0 1-7 7h-5a7 7 0 0 1-7-7z" fill="#050508" stroke="#3DE0FF" stroke-width="2.2"/><path d="M47 47.5q3-2.5 6 0" stroke="#3DE0FF" stroke-width="2.2" fill="none"/><path d="M32 49l4.5-3M57 49l4.5-3" stroke="rgba(255,255,255,.55)" stroke-width="1.6" stroke-linecap="round"/>'
    : f.e.map(d => P(d, 'stroke="' + G + '" stroke-width="' + (f.ew || 7) + '" stroke-linecap="round" stroke-linejoin="round" fill="' + (f.ef || 'none') + '"')).join('');
  return SONA_CHASIS
    + '<g clip-path="url(#rbScr)"><rect class="rb-sheen" x="22" y="26" width="56" height="9" fill="url(#rbSheen)"/></g>'
    + P(f.b, 'stroke="' + G + '" stroke-width="2.6" stroke-linecap="round" fill="none"')
    + '<g class="rb-eyes"><g class="fe" filter="url(#szEye)">' + eyes + '</g></g>'
    + P(f.x, 'class="fx" stroke="#ff9ccc" stroke-width="' + (f.xw || 2.4) + '" stroke-linecap="round" stroke-linejoin="round" fill="none"')
    + (f.drop ? '<path class="fdrop" d="M83 28q-6 9-1 12.5q6 2.5 7-3.5q0-3-6-9z" fill="#8fd3e8" fill-opacity=".9"/>' : '')
    + (f.fx ? FFX[f.fx] : '');
}
/* ondas de voz: rosadas a la DERECHA cuando habla, azules a la IZQUIERDA cuando escucha (por fuera de las orejas) */
function wavesSvg(){
  const W = (x, dir, c, k) => '<g class="' + k + '" stroke="' + c + '" stroke-width="3" stroke-linecap="round" fill="none">'
    + [4.5, 9.5, 14.5].map((r, i) => '<path style="--i:' + i + '" d="M' + x + ' ' + (55 - r) + 'a' + r + ' ' + r + ' 0 0 ' + (dir > 0 ? 1 : 0) + ' 0 ' + (2 * r) + '"/>').join('') + '</g>';
  return W(97, 1, '#ff5fae', 'fwr') + W(3, -1, '#3de0ff', 'fwl');
}
function face(mood, size, cls){
  const m = FACE[mood] ? mood : 'feliz', f = FACE[m], z = size || 40;
  return '<svg class="szface' + (cls ? ' ' + cls : '') + (f.w ? ' w' + f.w : '') + '" data-mood="' + m + '" viewBox="0 0 100 100" width="' + z + '" height="' + z + '" aria-hidden="true">'
    + wavesSvg() + headSvg(f) + '</svg>';
}
/* ---------- Sona entera: su figura mecánica flotando ----------
   La cabeza es la del botón, grande y al centro, con todas sus caras. Flota, respira y deja un brillo en el piso.
   Cada «postura» (pose) es un gesto de la CABEZA y la antena: se inclina, se asoma, salta, se asusta, se columpia…
   Alrededor: chispitas, y un detalle según la cara (corazones, confeti, zzz, burbujas, «!», notas, ondas de aviso).
   Todo en SVG, se mueve en vivo y se pausa cuando no se ve. Escenario 300 × 400 (3:4). Los gestos están en 11-v24-synthonia.css (data-pose). */
const SPOSE = { idle:1, saluda:1, senala:1, senalaL:1, celebra:1, piensa:1, escucha:1, presenta:1, sorpresa:1, escribe:1, lee:1, colgada:1, estira:1 };
/* chispitas que titilan alrededor (siempre) */
const sgStar = (x, y, s, d) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path class="syb-sp" style="--d:' + d + 's" d="M0-6L1.3-1.3 6 0 1.3 1.3 0 6-1.3 1.3-6 0-1.3-1.3z"/></g>';
const SG_SPARKS = sgStar(40, 128, 1.1, 0) + sgStar(264, 98, 1.4, -1.1) + sgStar(276, 226, .8, -2) + sgStar(24, 222, .9, -.6) + sgStar(214, 52, .7, -1.6) + sgStar(92, 56, .9, -2.4);
/* el detalle de cada cara: sube, cae o late encima de la cabeza */
const sgUp = (x, y, d, dx, inner) => '<g transform="translate(' + x + ' ' + y + ')"><g class="syb-f" style="--d:' + d + 's;--dx:' + dx + 'px">' + inner + '</g></g>';
const SG_HEART = '<path d="M0 6l-7-7a4 4 0 0 1 7-5a4 4 0 0 1 7 5z" fill="#ff6fb8" stroke="#ffd1e8" stroke-width="1"/>';
const SG_NOTE = '<path d="M0 0v-16l11-4v16" stroke="#bff6ff" stroke-width="2.4" fill="none" stroke-linejoin="round"/><ellipse cx="-3" cy="0" rx="4" ry="3.2" fill="#bff6ff"/><ellipse cx="8" cy="-4" rx="4" ry="3.2" fill="#bff6ff"/>';
const SG_Z = s => '<path d="M' + (-5 * s) + ' ' + (-5 * s) + 'h' + 10 * s + 'l' + (-10 * s) + ' ' + 10 * s + 'h' + 10 * s + '" stroke="#bfe9ff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
const SG_CONF = ['#ff4fa3', '#3de0ff', '#ffe38a', '#a866ff', '#7ef0ff', '#ff8a5c'];
/* ondas de aviso que salen del foquito de la antena (cuando saluda o presenta) */
const SG_PING = '<g transform="translate(171 98)">' + [0, 1, 2].map(i => '<circle class="syb-ping" style="--d:' + (-i * .75) + 's" r="16" fill="none" stroke="#ff7ac0" stroke-width="2.4"/>').join('') + '</g>';
const SG_FX = {
  love:  sgUp(62, 138, 0, -16, SG_HEART) + sgUp(240, 120, -.9, 14, SG_HEART) + sgUp(262, 186, -1.8, 20, SG_HEART) + sgUp(44, 200, -2.4, -12, SG_HEART),
  music: sgUp(250, 130, 0, 18, SG_NOTE) + sgUp(50, 160, -1.3, -16, SG_NOTE),
  zzz:   sgUp(236, 106, 0, 22, SG_Z(1)) + sgUp(236, 106, -1, 26, SG_Z(1.4)) + sgUp(236, 106, -2, 30, SG_Z(.8)),
  think: '<g class="syb-tb"><circle cx="240" cy="104" r="4.5"/><circle cx="256" cy="82" r="7"/><circle cx="274" cy="54" r="10.5"/></g>',
  wow:   '<g transform="translate(262 80)"><g class="syb-wow"><rect x="-4.5" y="-24" width="9" height="26" rx="4.5" fill="#ff7ac0"/><circle cy="12" r="5" fill="#ff7ac0"/><path d="M-16-18l-6-6M16-18l6-6M-19 0h-8M19 0h8" stroke="#ffc2e0" stroke-width="2.4" stroke-linecap="round"/></g></g>',
  party: Array.from({ length:14 }, (_, i) => '<g transform="translate(' + (34 + i * 17.5) + ' ' + (46 + (i * 37) % 50) + ')"><rect class="syb-cf" style="--d:' + (-(i * .29) % 2).toFixed(2) + 's;--dx:' + ((i % 2 ? 1 : -1) * (6 + i % 4 * 5)) + 'px" x="-3" y="-5" width="6" height="10" rx="1.5" fill="' + SG_CONF[i % 6] + '"/></g>').join(''),
  hola:  SG_PING
};
const SG_MOODFX = { encantada:'love', flow:'music', dormida:'zzz', descansando:'zzz', pensando:'think', confundida:'think', sorprendida:'wow', celebrando:'party' };
const SG_POSEFX = { celebra:'party', saluda:'hola', presenta:'hola' };
const sgFx = (m, p) => SG_FX[SG_POSEFX[p] || SG_MOODFX[m]] || '';
function synHead(mood){
  const m = FACE[mood] ? mood : 'feliz', f = FACE[m];
  return '<svg class="szface syb-hsvg' + (f.w ? ' w' + f.w : '') + '" data-mood="' + m + '" x="15" y="44" width="270" height="270" viewBox="0 0 100 100" overflow="visible">'
    + wavesSvg() + headSvg(f) + '</svg>';
}
function synBody(mood, pose, size){
  const m = FACE[mood] ? mood : 'feliz', p = SPOSE[pose] ? pose : 'idle';
  return '<div class="szbody" data-mood="' + m + '" data-pose="' + p + '"' + (size ? ' style="--sz:' + size + 'px"' : '') + ' aria-hidden="true">'
    + '<i class="syb-glow"></i>'
    + '<svg class="syb-svg" viewBox="0 0 300 400" overflow="visible" aria-hidden="true">'
    /* el brillo en el piso: se achica cuando ella sube */
    + '<ellipse class="syb-shadow" cx="150" cy="334" rx="84" ry="11" fill="url(#rbFloor)"/>'
    + '<g class="syb-sparks">' + SG_SPARKS + '</g>'
    + '<g class="syb-up"><g class="syb-head"><g class="syb-hd">' + synHead(m) + '</g></g></g>'
    + '<g class="syb-fx">' + sgFx(m, p) + '</g>'
    + '</svg></div>';
}
/* las animaciones de Sona se pausan cuando no está en pantalla (cero trabajo de más) */
const synIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('syb-off', !e.isIntersecting)), { rootMargin:'80px' }) : null;
function synWatch(host){ if (!synIO || !host) return; host.querySelectorAll('.szbody').forEach(b => { if (!b._sw){ b._sw = 1; synIO.observe(b); } }); }
if (synIO) new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1){ if (n.classList.contains('szbody')){ if (!n._sw){ n._sw = 1; synIO.observe(n); } } else if (n.querySelector) synWatch(n); } }))).observe(document.documentElement, { childList:true, subtree:true });
/* cambia la cara y la postura de una Sona que ya está en pantalla (la cabeza se mueve suave a su lugar); si no hay, la dibuja */
function synSet(host, mood, pose, size){
  if (!host) return;
  const b = host.querySelector('.szbody');
  if (!b){ host.innerHTML = synBody(mood, pose, size); return; }
  const m = FACE[mood] ? mood : 'feliz', p = SPOSE[pose] ? pose : 'idle';
  const fx0 = sgFx(b.dataset.mood, b.dataset.pose), fx1 = sgFx(m, p);
  if (b.dataset.mood !== m){ b.querySelector('.syb-hd').innerHTML = synHead(m); b.dataset.mood = m; }
  if (b.dataset.pose !== p) b.dataset.pose = p;
  if (fx0 !== fx1) b.querySelector('.syb-fx').innerHTML = fx1;
  if (size) b.style.setProperty('--sz', size + 'px');
}
/* v2.2 · habla de verdad: la frase se parte en sílabas y la voz de Sona late a ritmo (≈7 por segundo): el foquito de la antena
   se enciende, los ojos se agrandan un poquito y las ondas rosadas laten con cada sílaba. (Sin boca: ya no se dibuja.)
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
function lipSync(svgs, text){
  svgs = (svgs || []).filter(Boolean); if (!svgs.length || reduce) return undefined;
  const seq = syllables(text); if (!seq.length) return undefined;
  let raf = 0, t0 = 0, doneAt = 0, ry = 0, i = 0;
  const L = svgs.map(el => ({ el, ball:!!(el.closest && el.closest('#szBot')) }));
  const live = () => L.map(o => { if (!o.el.isConnected && o.ball) o.el = botFaceEl() || o.el; return o.el; }).filter(e => e.isConnected);
  /* --amp (0–1) lo leen el foquito, los ojos y las ondas */
  const paint = () => live().forEach(svg => { svg.classList.add('talking'); svg.style.setProperty('--amp', Math.min(1, ry / 6).toFixed(2)); });
  const stop = () => { cancelAnimationFrame(raf); raf = 0; L.map(o => o.el).forEach(svg => { svg.classList.remove('talking'); svg.style.removeProperty('--amp'); }); };
  const SYL = 140;                                    /* ms por sílaba: ritmo de voz */
  function loop(now){
    if (!t0) t0 = now;
    i = Math.floor((now - t0) / SYL);
    const ending = doneAt && (now - doneAt > 1100 || i >= seq.length);
    const v = ending ? 'r' : seq[Math.min(i, seq.length - 1)], tgt = MOUTH[v] || MOUTH.c;
    const ph = ((now - t0) % SYL) / SYL, open = v === 'r' || v === 'm' ? 1 : Math.sin(Math.min(1, ph * 1.6) * Math.PI) * .35 + .75;
    ry += (tgt[1] * open - ry) * .38;
    paint();
    if (ending && ry < .6){ stop(); return; }
    raf = requestAnimationFrame(loop);
  }
  return k => {
    if (!raf && !doneAt) raf = requestAnimationFrame(loop);
    if (k >= 1 && !doneAt) doneAt = performance.now();
  };
}
const botFaceEl = () => { const b = document.getElementById('szBot'); return b ? (b.querySelector('.bf > :last-child .szface') || b.querySelector('.bf .szface')) : null; };
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
    /* Sona: un «bip» amable (sube si está contenta, baja si se disculpa) */
    blip(mood){ play((c, t) => { const sad = mood === 'disculpa' || mood === 'confundida' || mood === 'preocupada'; tone(c, t, 'sine', sad ? 620 : 640, sad ? 430 : 980, .006, .09, .1); tone(c, t + .07, 'sine', sad ? 470 : 990, sad ? 360 : 1320, .006, .06, .09); }); },
    /* el puntero de luz hace clic */
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

/* v2.4 · Sona te escucha: mientras escribes (en el chat o en su ventanita) le salen ondas azules a la izquierda */
(function listen(){
  let t = 0;
  addEventListener('input', e => {
    const el = e.target; if (!el || !el.matches || !el.matches('textarea, input[type=text], input:not([type]), [contenteditable=true]')) return;
    document.documentElement.classList.add('szlisten'); clearTimeout(t);
    t = setTimeout(() => document.documentElement.classList.remove('szlisten'), 1300);
  }, true);
})();

/* ---------- v3.2 · Sona juega cuando no estás (pedido de Sammuel, 28 oct) ----------
   2 min sin moverte: sale de su rincón, grandota, y se duerme en la mitad de la pantalla sobre una nubecita.
   1 min y medio después abre los ojos, se estira y juega con la página: se cuelga de un título con su antena, hace ejercicio (saltos),
   empuja un botón con la cabeza, apaga la gravedad, hace órbitas con bolitas de luz, rebota por las esquinas o se asoma por un borde.
   Tres juegos y vuelve a dormir; así mientras no vuelvas. Cuando mueves el mouse (o tocas, o una tecla): cara de
   sorprendida, sale corriendo a su lugar de siempre y dice «¡Ah, volviste!». Lo que movió vuelve solo: a la página
   solo le pone animaciones sumadas (composite:'add') que se cancelan al final, nunca le cambia estilos.
   Con Animaciones apagadas solo se duerme en su botón, como antes. Para probar rápido: ?siesta=rapida */
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
  /* se cuelga de un título (o del borde de arriba) por la antena y se columpia; el título se hunde un poquito con su peso */
  async function hang(g){
    const t = pickOne(seen('h1,h2,h3,#nav,header,.topbar,.head', r => r.width >= 140 && r.bottom >= 40 && r.bottom <= H() * .5)) || null;
    const k = S / 300, gy = t ? t.r.bottom : 0;
    const x = t ? clamp(t.r.left + t.r.width / 2 - S / 2, 8, W() - S - 8) : (W() - S) / 2;
    look('feliz', 'idle'); await fly(g, { x, y:Math.max(-20 * k, gy + 20), r:0 }, 1100);
    look('encantada', 'colgada'); await fly(g, { y:gy - 66 * k }, 500, 'cubic-bezier(.3,1.6,.5,1)');
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
  /* hace ejercicio: saltos con sus lentes de Flow y va contando */
  async function gym(g){
    await fly(g, spot(), 1000); look('flow', 'idle');
    talk(L2('Hora de hacer ejercicio. ⚡', 'Workout time! ⚡'), 1800); await wait(g, 1700);
    for (let i = 1; i <= 8; i++){
      look('flow', i % 2 ? 'celebra' : 'estira'); act.classList.remove('jump'); void act.offsetWidth; act.classList.add('jump');
      talk(String(i) + (i === 8 ? '!' : '…'), 700); await wait(g, 620);
    }
    act.classList.remove('jump'); look('riendo', 'idle'); talk(L2('¡Uf! Hay que mantenerse en forma.', 'Phew! Gotta stay in shape.'), 2400); await wait(g, 2400);
    return true;
  }
  /* empuja un botón o una tarjeta con la cabeza… y lo devuelve a su lugar */
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
  /* órbitas: tres bolitas de luz le dan la vuelta a la cabeza; al final se le escapa una */
  async function juggle(g){
    await fly(g, spot(), 1000); look('encantada', 'celebra'); act.classList.add('jug');
    talk(L2('¡Mira, órbitas de luz!', 'Look, orbits of light!'), 2200); await wait(g, 5200);
    act.classList.add('drop'); look('sorprendida', 'sorpresa'); talk(L2('¡Ay! Se me escapó una.', 'Oops! One got away.'), 2000); await wait(g, 1600);
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
      /* en la portada no hay botón: ella misma (la que camina por las secciones) pone la cara y el globito sale a su lado */
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
