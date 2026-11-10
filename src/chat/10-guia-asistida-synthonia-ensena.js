/* =====================================================================
   Guía Asistida: Sona enseña Sonyx con su puntero (camino B)
   1 temas · 2 IA recomendadas · 3 recorrido · 4 comparar 2 · 5 prueba real · 6 conectar
   v3.0: arranca sola al terminar «Empieza en Sonyx» (ya elegiste tema e IA, así que salta 1 y 2) y el recorrido
   muestra también Nuevo chat, los modos, el esfuerzo, Espacios, Sintéticos y los Ajustes (temas, Simple, tamaño, rápido, idioma)
   ===================================================================== */
const H = SZ.HAND;
const GUIDE_PROMPTS = {
  marketing:'Dame 3 ideas cortas de publicaciones para vender postres caseros en Instagram.',
  escribir:'Escribe un mensaje corto y amable para invitar a mis amigos a una reunión el sábado.',
  codigo:'Explícame en 4 pasos qué hace un bucle «for» en JavaScript, con un ejemplo corto.',
  estudiar:'Explícame la fotosíntesis como a un principiante, con un ejemplo y 2 preguntas para repasar.',
  planos:'Ayúdame a distribuir una habitación de 3 x 4 metros con cama, escritorio y clóset.',
  negocios:'Dame un plan de 5 pasos para empezar a vender comida desde mi casa.',
  ideas:'Dame 8 ideas originales para un regalo de cumpleaños que no cueste mucho.',
  imagenes:'¿Qué cosas puede hacer una IA con una foto o un PDF? Dame 5 ejemplos cortos.',
  redes:'Escribe un guion de 20 segundos para un reel que presente mi emprendimiento.',
  ventas:'Ayúdame a responder a un cliente que dice que mi producto está caro, de forma amable.',
  correo:'Escribe un correo formal y corto pidiendo un día libre en el trabajo.',
  empleo:'Dame 5 preguntas típicas de una entrevista de trabajo y cómo responderlas.',
  web:'Explícame qué partes tiene una página web sencilla, en palabras fáciles.',
  datos:'¿Qué fórmula de Excel suma solo los valores mayores a 100? Explícala corto.',
  idiomas:'Enséñame 5 frases útiles en inglés para pedir comida en un restaurante.',
  mate:'Resuelve paso a paso: 3x + 7 = 22.',
  ciencia:'Explícame de forma sencilla por qué el cielo es azul.',
  diseno:'Propón 3 paletas de colores (con códigos HEX) para una marca de café.',
  finanzas:'Dame 5 consejos sencillos para ahorrar cada mes.',
  legal:'Explícame en palabras sencillas qué es un contrato de arrendamiento.',
  salud:'Propón una rutina suave de estiramientos de 10 minutos para empezar el día.',
  cocina:'Tengo arroz, huevos y tomate. ¿Qué puedo cocinar? Dame 2 opciones fáciles.',
  viajes:'Hazme un plan de 2 días para conocer una ciudad nueva con poco presupuesto.',
  musica:'Ayúdame con 4 versos para una canción sobre empezar de nuevo.',
  historias:'Escribe el inicio de una historia corta sobre un robot que aprende a pintar.',
  juegos:'Propón una idea sencilla de videojuego con sus reglas en 5 líneas.',
  productividad:'Divide en pasos pequeños la tarea de ordenar mi cuarto.',
  complejo:'Compara en una tabla corta estudiar de día o de noche: ventajas y desventajas.'
};
const GUIDE_DEMO = {
  marketing:[['Carrusel «antes y después»: la masa cruda y el postre terminado.', 'Encuesta en historias: «¿Cuál sale el viernes?».', 'Video de 10 s cortando la torta, con precio.'], ['Cuenta la historia de tu receta favorita en 3 frases.', 'Promo «Martes dulce» para quien comente.', 'Reseña real de un cliente, con su foto.']],
  codigo:[['Un «for» repite un bloque varias veces.', 'Tiene inicio, condición y paso: for (let i = 0; i < 3; i++).', 'Sirve para recorrer listas.'], ['Piensa en «haz esto N veces».', 'La variable i cuenta cada vuelta.', 'Cuando la condición es falsa, se detiene.']],
  estudiar:[['Las plantas usan luz para hacer su comida.', 'Toman agua y CO₂ y sueltan oxígeno.', 'Ejemplo: por eso crecen hacia la ventana.'], ['Es como una cocina solar dentro de la hoja.', 'La clorofila atrapa la luz.', 'Pregunta: ¿qué gas sueltan las plantas?']]
};
const GUIDE_DEMO_ANY = [['Primero te doy una respuesta corta y directa.', 'Luego un ejemplo práctico.', 'Al final, un consejo extra.'], ['Te lo explico con otras palabras.', 'Con un ejemplo distinto.', 'Y una idea que la otra no dio.']];
let G = null;
const gNeed = () => { if (!G || G.skip) throw Object.assign(new Error('guía cerrada'), { guide:true }); };
const gWait = ms => new Promise(r => setTimeout(r, SZ.reduce ? Math.min(ms, 260) : ms)).then(gNeed);
function gHud(n, label){
  if (!G) return;
  let h = $('#szgHud');
  if (!h){
    h = document.createElement('div'); h.id = 'szgHud'; h.setAttribute('role', 'status');
    h.innerHTML = '<span class="gh-f">' + SZ.face('feliz', 22) + '</span><span class="gh-t"><b>GUÍA</b> <i></i></span><span class="gh-bar"><i></i></span><button type="button" class="gh-x">Saltar guía</button>';
    document.body.appendChild(h); requestAnimationFrame(() => h.classList.add('on'));
    $('.gh-x', h).addEventListener('click', () => endGuide(false));
  }
  n -= G.off || 0;
  $('.gh-t i', h).textContent = n + ' de ' + G.total + ' · ' + label;
  $('.gh-bar i', h).style.transform = 'scaleX(' + (n / G.total).toFixed(3) + ')';
}
function gPanel(html, cls, say, mood, dir){
  gPanelClose(dir); H.quiet();
  const p = document.createElement('div'); p.id = 'szgPanel'; p.className = 'szgp' + (cls ? ' ' + cls : '') + (dir < 0 ? ' rev' : '');
  p.innerHTML = '<div class="gp-in">' + (say ? '<div class="gp-say"><span class="sf">' + SZ.face(mood || 'feliz', 58) + '</span><p>' + esc(say) + '</p></div>' : '') + html + '</div>';
  document.body.appendChild(p); requestAnimationFrame(() => p.classList.add('on'));
  if (say){ SZ.SND.blip(mood); if (!SZ.reduce) SZ.typeIn($('.gp-say p', p), { cps:50, max:4, delay:250, onFrame:SZ.lipSync([$('.gp-say .sf .szface', p), SZ.botFaceEl()], say) }).catch(() => {}); }
  return p;
}
/* la barra de la guía se aparta si tapa lo que Sona está señalando */
function gDodge(t){ const h = $('#szgHud'); if (!h || !t || !t.getBoundingClientRect) return; const r = t.getBoundingClientRect(); h.classList.toggle('low', r.top < 96); }
function gPanelClose(dir){ if (H.wander) H.wander(null); const p = $('#szgPanel'); if (!p) return; p.id = ''; p.classList.remove('on', 'rev'); p.classList.add('bye'); if (dir < 0) p.classList.add('back'); setTimeout(() => p.remove(), 520); }
/* lo primero que se vea de una lista de opciones (la pantalla cambia entre el inicio limpio y el chat) */
const gAny = (...L) => { for (const x of L){ const n = gT(x, x); if (n) return n; } return null; };
const gT = (desk, mob) => { const s = isMobile() ? mob : desk; const n = s && $(s); return n && n.getClientRects().length ? n : null; };
async function gPoint(target, text, o = {}){
  gNeed();
  if (!target){ return H.talk(text, Object.assign({ mood:o.mood || 'feliz', buttons:[{ label:o.next || 'Siguiente' }], auto:o.auto || Math.min(9000, 2600 + text.length * 48) }, o)).then(r => { gNeed(); return r; }); }
  try{ target.scrollIntoView({ block:'nearest', behavior:SZ.reduce ? 'auto' : 'smooth' }); }catch(e){}
  gDodge(target); H.spot(target, o.pad);
  await H.moveTo(target, { shape:o.shape || 'point', fx:o.fx, fy:o.fy }); gNeed();
  /* v1.9: si tocas lo que te señalo, ¡aprendiste! Te felicito, cierro lo que se abrió y seguimos.
     Y si das «Siguiente» con algo abierto (p. ej. la ventana de comparar), también se cierra para que no tape lo demás */
  const snap = gSnap(); let hit = null;
  const tapped = new Promise(res => { hit = e => { if (e.target && target.contains(e.target)) res('tap'); }; document.addEventListener('click', hit, true); });
  const said = H.talk(text, Object.assign({ near:target, mood:o.mood || 'senalando', buttons:[{ label:o.next || 'Siguiente' }], auto:o.auto || Math.min(9000, 2600 + text.length * 48) }, o));
  let r = await Promise.race([said, tapped]);
  document.removeEventListener('click', hit, true);
  gNeed();
  if (r === 'tap'){
    await gWait(650);
    H.unspot && H.unspot();
    await H.talk(gPraise(), { mood:'celebrando', buttons:[{ label:'Seguir' }], auto:2600 }); gNeed();
    r = 0;
  }
  gRestore(snap);
  return r;
}
const PRAISE = ['¡Muy bien, ya aprendiste! Sigamos.', '¡Eso es! Ya sabes usarlo.', '¡Perfecto! Lo hiciste tú solo.', '¡Así se hace! Vamos con lo siguiente.'];
let praiseI = 0;
const gPraise = () => PRAISE[praiseI++ % PRAISE.length];
/* qué estaba abierto antes de un paso, para cerrar solo lo que se abrió durante ese paso */
function gSnap(){ return { side:side.classList.contains('open') && !sideClosing, cv:!!cvEl, conn:!!$('#conn'), acc:!!$('#acc'), modals:new Set($$('.szm')) }; }
function gRestore(s){
  try{
    if (!s.side && side.classList.contains('open')) closeSide();
    if (!s.cv && cvEl) closeCanvas();
    if (!s.conn && $('#conn')){ const x = $('#conn #cClose'); if (x) x.click(); }
    if (!s.acc && $('#acc')){ const x = $('#acc #aClose'); if (x) x.click(); }
    $$('.szm').forEach(m => { if (s.modals.has(m) || m.classList.contains('bye')) return; const x = m.querySelector('[data-close], [data-cx]'); if (x) x.click(); else m.remove(); });
  }catch(e){}
}
async function waitCatalog(ms){ const t0 = Date.now(); while (!cat.list.length && Date.now() - t0 < ms){ await gWait(250); } }

async function runGuide(o = {}){
  await SZ.synReady;   /* v3.4 · Sona llega en su propio archivo: la guía la espera */
  if (G) return;
  const pre = o.topic && TOPIC[o.topic] ? o.topic : null;   /* v3.0: vienes de «Empieza en Sonyx»: ya elegiste tema e IA */
  closeSide(); closeChatsSheet(); if (tourEl) closeTour(false);
  if ($('#conn')) { const c = $('#cClose'); if (c) c.click(); }
  const off = pre ? 2 : 0;
  G = { skip:false, total:(SZ.ACC.dcid ? 7 : 6) - off, topics:pre ? [pre] : [], off };
  SZ.DRIVE.cid().then(c => { if (G && c && !(SZ.DRIVE.meta() || {}).linked){ G.total = 7 - off; const h = $('#szgHud .gh-t i'); if (h) h.textContent = h.textContent.replace(/de \d+/, 'de ' + G.total); } else if (G && !c) G.total = 6 - off; }).catch(() => {});
  root.classList.add('guiding');
  try{
    if (mode !== 'solo') setMode('solo');
    if (chatArr().length && !pre) newChat();
    H.show({ x:innerWidth - 60, y:innerHeight - 70 });
    await gWait(80);
    await H.moveTo({ x:innerWidth / 2, y:innerHeight * .26 }, { shape:'arrow' });
    H.wave(2);
    let r = await H.talk(pre ? '¡Aquí está la guía! Ya elegiste «' + TOPIC[pre].l + '» y tu IA. En unos 2 minutos te muestro cómo seguir: dónde está cada cosa, cómo comparar IAs y tu primer chat de verdad, gratis.'
      : '¡Hola! Soy Sona. Te enseño Sonyx en unos 2 minutos: eliges tus temas, te muestro las IA que mejor los hacen, comparamos 2 y chateas de verdad, gratis.', { mood:'feliz', buttons:[{ label:'¡Vamos!' }, { label:'Ahora no', ghost:true }] });
    if (r === 1){ endGuide(false); return; }
    gNeed();

    /* 1 · temas y 2 · IA recomendadas (camino B). «← Cambiar temas» vuelve con la animación al revés */
    let gdir = 1;
    for (;!pre;){
    gHud(1, 'Tus temas');
    H.quiet();
    const P = gPanel('<h3>¿Qué te interesa?</h3><div class="gp-topics">' + TOPICS.map(([k, e, l], i) => '<button type="button" class="tchip" data-gt="' + k + '" aria-pressed="' + G.topics.includes(k) + '" style="--i:' + i + '"><span aria-hidden="true">' + e + '</span>' + esc(l) + '</button>').join('') + '</div><div class="gp-act"><span class="gp-n">' + G.topics.length + ' de 3</span><button type="button" class="btn sm flow" data-gnext' + (G.topics.length ? '' : ' disabled') + '>Siguiente →</button></div>', 'pick', 'Elige hasta 3 temas que te interesen. Por ejemplo, si vendes algo: «Marketing» y «Ventas».', 'senalando', gdir);
    const pickN = () => $$('[data-gt][aria-pressed="true"]', P).length;
    P.addEventListener('click', e => {
      const b = e.target.closest('[data-gt]'); if (!b) return;
      const on = b.getAttribute('aria-pressed') === 'true';
      if (!on && pickN() >= 3){ toast('Máximo 3 temas: quita uno para elegir otro.'); return; }
      b.setAttribute('aria-pressed', String(!on)); SZ.SND.tap();
      const n = pickN(); $('.gp-n', P).textContent = n + ' de 3'; $('[data-gnext]', P).disabled = !n;
    });
    /* el botón responde desde el primer instante, aunque el puntero aún se esté moviendo */
    const go1 = new Promise(res => { $('[data-gnext]', P).addEventListener('click', res, { once:true }); const iv = setInterval(() => { if (!G || G.skip){ clearInterval(iv); res(); } }, 300); });
    await gWait(450);
    const firstChip = $('[data-gt]', P);
    /* señala un momento y luego flota por fuera del panel: no se queda tapando los temas */
    if (firstChip) H.moveTo(firstChip, { shape:'point' }).then(() => SZ.sleepRaw(1100)).then(() => { if (G && !G.skip && P.isConnected) H.wander(P); });
    await go1;
    gNeed();
    G.topics = $$('[data-gt][aria-pressed="true"]', P).map(b => b.dataset.gt);
    if (!G.topics.length) G.topics = ['ideas'];
    try{ st().guide = { topics:G.topics, t:Date.now() }; save(); }catch(e){}

    gHud(2, 'IA para ti');
    await waitCatalog(4000);
    const rows = G.topics.map(k => {
      const T = TOPIC[k], L = recommendTop(k, 3);
      return '<div class="gp-row"><b><span aria-hidden="true">' + T.e + '</span> ' + esc(T.l) + '</b><div class="gp-ias">' + (L.length ? L.map((m, i) => '<span class="gp-ia" style="--vc:' + vendorColor(m.vendor) + ';--i:' + i + '">' + av(m, 'xs') + '<span><em>' + esc(m.name) + '</em><small>' + esc(payOf(m.id)[2]) + '</small></span></span>').join('') : '<span class="gp-ia none">La lista de IA está cargando; aparecerá en «Temas».</span>') + '</div></div>';
    }).join('');
    const P2 = gPanel('<h3>Tus IA recomendadas</h3><p>En el mundo hay más de mil IA y cada una es experta en algo. Aquí tienes varias gratis y puedes usar una para escribir, otra para código…</p>' + rows + '<div class="gp-act"><button type="button" class="lnk gp-back" data-gback>← Cambiar temas</button><span style="flex:1"></span><button type="button" class="btn sm flow" data-gnext>Ver dónde está todo →</button></div>', 'recs', 'Estas son las mejores para lo que te gusta. ¡Todas gratis!', 'guino', 1);
    const go2 = new Promise(res => { $('[data-gnext]', P2).addEventListener('click', () => res('next'), { once:true }); $('[data-gback]', P2).addEventListener('click', () => res('back'), { once:true }); const iv = setInterval(() => { if (!G || G.skip){ clearInterval(iv); res('next'); } }, 300); });
    await gWait(500);
    const ia1 = $('.gp-ia', P2);
    if (ia1) H.moveTo(ia1, { shape:'point' }).then(() => SZ.sleepRaw(1300)).then(() => { if (G && !G.skip && P2.isConnected) H.wander(P2); });
    const how = await go2;
    gNeed();
    if (how === 'back'){ gdir = -1; continue; }
    break;
    }
    gPanelClose(); H.quiet();

    /* 3 · recorrido por la pantalla (camino A) */
    gHud(3, 'La pantalla');
    await gWait(350);
    await gPoint(gAny('#cPick', '#curChip'), 'Aquí eliges con qué IA hablas. Tócalo y se abre su ventana, con temas, buscador y filtros.');
    await gPoint(gAny('#sNav [data-sn="cmp"]', '#pickRow [data-add]'), 'Aquí, aparte, comparas IAs: eliges hasta 4. Todas responden la misma pregunta y las comparas. Ojo: cada una gasta lo suyo.');
    await gPoint(gAny('#payPill', '#payL', '#payM'), 'Aquí ves cómo va tu límite gratis de hoy.', { pad:6 });
    await gPoint((gT('#thList', '#tabbar [data-tab="chats"]') || gT('#rail [data-r="chats"]', '#tabbar [data-tab="chats"]')), 'Tus chats y tus mensajes favoritos quedan aquí, en cualquier dispositivo si entras con tu cuenta.', { side:true });
    await gPoint(gT('.tchip[data-topic]', '.tchip[data-topic]'), 'Toca un tema cuando quieras y te recomiendo IA expertas en eso.');
    /* v3.0: lo nuevo, para que nadie se quede sin saber dónde está */
    await gPoint(gT('#sNav [data-sn="new"]', '#rail [data-r="new"]') || gT('#cNew', '#rail [data-r="new"]') || gT('#rail [data-r="new"]', '#tabbar [data-tab="chats"]'), 'Con «Nuevo chat» empiezas una conversación limpia cuando cambies de tema. La anterior queda guardada.', { side:true });
    await gPoint(gAny('#cMode'), 'Aquí eliges el modo: «Automática» escoge la mejor IA por ti, «Chat» te deja elegirla, y «Apex» trabaja por pasos como un agente.');
    await gPoint(gAny('#cEffort'), 'Y aquí, cómo piensa: Flow (según tu pregunta), Fragment (rápido), Focus (a fondo, el que más gasta) u Horizon (ideas originales).');
    await gPoint(gT('#sNav [data-sn="proj"]', '#cProj') || gT('#railProj', '#cProj') || gT('#cProj', '#cProj'), '«Espacios» junta chats, instrucciones y archivos de un mismo tema. La IA los tiene en cuenta en cada chat del espacio, como en Claude.', { side:true });
    await gPoint(gT('#sNav [data-sn="syn"]', '#cSyn') || gT('#railSyn', '#cSyn') || gT('#cSyn', '#cSyn'), '«Obras» guarda todo lo que la IA crea: páginas, juegos, dibujos y documentos. Cuando una respuesta trae una, se abre sola al lado del chat.', { side:true });
    const cfgB = gT('#sAcc', '#tabbar [data-tab="cfg"]') || gT('#cfgBtn', '#tabbar [data-tab="cfg"]');
    const rr = await gPoint(cfgB, 'En «Ajustes» cambias cómo se ve todo. ¿Te muestro lo más útil?', { buttons:[{ label:'Muéstrame' }, { label:'Ahora no', ghost:true }], auto:15000, mood:'guino' });
    if (rr === 0 && cfgB){
      SZ.cfgModal(); await gWait(700);
      await gPoint(gAny('#cfgCh'), '«Más bonito» trae todos los efectos. Si tu equipo va lento, «Más rápido» quita efectos y todo responde al instante.');
      await gPoint(gAny('#cfgTh'), 'Aquí eliges el color: Sinapse, Océano, Bosque, Lavanda y los que vienen.');
      await gPoint(gAny('#cfgUi'), 'Y el estilo: «Sonyx» con vidrio y animaciones, o «Simple», el más limpio y parecido a Claude.');
      await gPoint(gAny('#cfgSz'), 'Si quieres que todo se vea más pequeño, usa el tamaño compacto.');
      await gPoint(gAny('#cfgLang'), 'Y aquí pones la página en inglés o en español.');
      const x = $('#cfgm [data-close]'); if (x) x.click();
      await gWait(400);
    }
    await gPoint(gT('#guideTop', '#guideTop'), 'Y si te pierdes, la Guía rápida siempre está aquí: la ves completa o solo lo que quieras. También puedes preguntarme lo que sea tocando mi botón.', { mood:'guino' });
    H.unspot(); H.quiet();

    /* 4 · comparar 2 IA (ejemplo animado: no gasta nada) */
    gHud(4, 'Comparar 2 IA');
    const k0 = G.topics[0], recs = recommendTop(k0, 2);
    const names = [recs[0] ? recs[0] : null, recs[1] ? recs[1] : null];
    const nm = i => names[i] ? esc(names[i].name) : (i ? 'Mistral Small' : 'Llama 3.3');
    const avx = i => names[i] ? av(names[i], 'xs') : '<span class="av xs" style="--vc:' + (i ? '#f5c46b' : '#f2a07b') + '">' + (i ? 'M' : 'L') + '</span>';
    const D = GUIDE_DEMO[k0] || GUIDE_DEMO_ANY, q = GUIDE_PROMPTS[k0] || 'Dame una idea útil para hoy.';
    const P3 = gPanel('<h3>Así se ve comparar</h3><p class="gp-tag">Ejemplo animado · no gasta mensajes</p><div class="gd-q">' + esc(q) + '</div><div class="gd-wait"></div><div class="gd-grid"></div><div class="gp-act"><button type="button" class="btn sm flow" data-gnext hidden>Ahora pruébalo tú →</button></div>', 'demo', 'Mira: le hago la misma pregunta a 2 IA a la vez. Aparecen en el orden en que llegan.', 'sorprendida');
    const wait = $('.gd-wait', P3), grid = $('.gd-grid', P3);
    const pill = i => { const s = document.createElement('span'); s.innerHTML = avx(i) + nm(i) + ' está pensando <span class="dots"><i></i><i></i><i></i></span>'; wait.appendChild(s); return s; };
    const card = (i, first) => { const c = document.createElement('div'); c.className = 'gd-card'; c.innerHTML = '<div class="gd-who">' + avx(i) + '<b>' + nm(i) + '</b>' + (first ? '<span class="gd-fast">⚡ llegó primero</span>' : '') + '</div><ol>' + D[i].map(x => '<li>' + esc(x) + '</li>').join('') + '</ol><button type="button" class="gd-flow" data-gf="' + i + '">' + SZ.face(SZ.randomGoodFace ? SZ.randomGoodFace() : 'feliz', 20) + 'Esta tiene más Flow</button>'; return c; };
    const p0 = pill(0), p1 = pill(1);
    await gWait(1100); p1.classList.add('out'); setTimeout(() => p1.remove(), 400); grid.appendChild(card(1, true)); SZ.SND.tap();
    await gWait(1200); p0.classList.add('out'); setTimeout(() => p0.remove(), 400); grid.appendChild(card(0, false)); SZ.SND.tap();
    await gWait(500);
    await H.moveTo(grid.firstChild, { shape:'arrow', fx:.5, fy:.3 });
    const gs = $('.gp-say p', P3); if (gs){ gs._chars = null; gs.textContent = 'Con «+» puedes sumar otra IA incluso después de preguntar: responde lo mismo y aparece al lado.'; if (!SZ.reduce) SZ.typeIn(gs, { cps:70, max:1.6 }).catch(() => {}); }
    await gWait(3400);
    const fb = $('[data-gf]', grid);
    await H.click(fb);
    fb.classList.add('won'); const fr = fb.getBoundingClientRect(); burst(fr.left + fr.width / 2, fr.top + fr.height / 2, ['#e6b65f', '#ffe2a8', '#c9566c'], 12);
    if (gs){ gs._chars = null; gs.textContent = 'Cuando una te gusta más: «Esta tiene más Flow» y sigues el chat solo con ella.'; const f = $('.gp-say .sf', P3); if (f) f.innerHTML = SZ.face('riendo', 58); SZ.SND.blip('riendo'); if (!SZ.reduce) SZ.typeIn(gs, { cps:70, max:1.6 }).catch(() => {}); }
    const nb = $('[data-gnext]', P3); nb.hidden = false;
    await new Promise(res => { nb.addEventListener('click', res, { once:true }); const iv = setInterval(() => { if (!G || G.skip){ clearInterval(iv); res(); } }, 300); });
    gNeed(); gPanelClose(); H.quiet();

    /* 5 · chatear de verdad: las IAs conectadas ya está activada (si no lo está, la prueba de 5 mensajes de la guía) */
    gHud(5, 'Tu primer chat');
    const useSz = szOn() && !trialOn;
    let ok = useSz || (trialOn && trialLeft() > 0);
    if (useSz){ const pk = recommendTop(k0, 8).find(m => /^sz:/.test(m.id)) || info(APODEX); if (selId() !== pk.id) pickModel(pk.id, null); }
    if (!ok){ H.talk('Preparando tu EnerX de prueba…', { mood:'pensando' }); ok = await enterTrial(); }
    gNeed();
    if (!ok){
      await H.talk(connected(selId()) ? 'La prueba no está disponible ahora, pero ya tienes una IA conectada: practica con ella.' : 'Las IAs gratis están descansando un momento. Ahora te muestro Puter: una cuenta gratis para seguir.', { mood:'disculpa', buttons:[{ label:'Siguiente' }] });
    } else {
      await H.talk(useSz ? 'Ya puedes chatear gratis. Te escribo un mensaje de ejemplo sobre «' + TOPIC[k0].l + '».' : '¡Listo! Tu EnerX de prueba está al 100 %, solo para aprender. Te escribo uno de ejemplo sobre «' + TOPIC[k0].l + '».', { mood:'celebrando', auto:3200, buttons:[{ label:'Siguiente' }] });
      gNeed(); H.quiet();
      const myN = $$('.m.user', lane).length, errN = $$('.m.err', lane).length, left0 = trialLeft();
      await H.type(inp, GUIDE_PROMPTS[k0] || q); autoGrow(); updateHint(); gNeed();
      H.spot(sendBtn, 6); inp.setAttribute('data-guide-ok', ''); await H.moveTo(sendBtn, { shape:'point' });
      H.talk('Ahora envíalo tú con este botón (o con Enter). También puedes cambiar el texto.', { near:sendBtn, mood:'senalando' });
      const sent = await new Promise(res => { const t0 = Date.now(); const iv = setInterval(() => { if (!G || G.skip){ clearInterval(iv); res(false); } else if ($$('.m.user', lane).length > myN){ clearInterval(iv); res(true); } else if (Date.now() - t0 > 120000){ clearInterval(iv); res(false); } }, 250); });
      inp.removeAttribute('data-guide-ok'); gNeed(); H.unspot();
      if (sent){
        H.talk('¡Eso! Mira cómo llega la respuesta en vivo…', { mood:'pensando' });
        await new Promise(res => { const t0 = Date.now(); const iv = setInterval(() => { if (!G || G.skip || (!Object.keys(busy).length && Date.now() - t0 > 600) || Date.now() - t0 > 60000){ clearInterval(iv); res(); } }, 250); });
        gNeed();
        const last = $$('.m.bot', lane).pop(), failed = $$('.m.err', lane).length > errN || (!useSz && trialLeft() >= left0);
        if (failed){
          const em = $$('.m.err', lane).pop();
          if (em) await H.moveTo(em, { shape:'arrow', fx:.1, fy:.2 });
          await H.talk('Uy, esta vez no respondió (no gastaste nada). Ahora te muestro Puter: una cuenta gratis para tener siempre otra opción.', { near:em || inp, mood:'disculpa', buttons:[{ label:'Siguiente' }], auto:9000 });
        } else {
        if (last) await H.moveTo(last, { shape:'arrow', fx:.15, fy:.2 });
        SZ.SND.done();
        await H.talk(useSz ? '¡Lo lograste! Puedes seguir chateando gratis. Abajo ves cómo va tu límite de hoy.' : '¡Lo lograste! Todavía tienes EnerX de prueba para seguir practicando. Abajo dice quién la paga: Sinapse.', { near:last || inp, mood:'celebrando', buttons:[{ label:'Siguiente' }], auto:9000 });
        }
      } else await H.talk('Puedes enviarlo después: el mensaje te espera en la caja.', { mood:'guino', buttons:[{ label:'Siguiente' }] });
    }
    gNeed();

    /* 6 · ¿qué es Puter?: más IA con tus créditos personales */
    gHud(6, 'Tu Puter');
    H.quiet();
    const P6 = gPanel('<h3>¿Qué es Puter?</h3><div class="gp-pu"><div class="gp-pc" style="--i:0"><span class="gp-pi">' + SZ.puterLogo() + '</span><b>Tu versión pro de las IAs más usadas</b><small>ChatGPT, Claude, Gemini y más, en su versión más potente. Gratis.</small></div><div class="gp-pc" style="--i:1"><span class="gp-pi">✨</span><b>Con un límite cada mes</b><small>Tienes un saldo gratis que se llena de nuevo cada mes. Se crea con un clic, sin tarjeta.</small></div><div class="gp-pc" style="--i:2"><span class="gp-pi"><span class="sz-logo" aria-hidden="true"></span></span><b>Es opcional</b><small>Si no lo conectas, sigues con las IAs conectadas y su límite gratis de cada día.</small></div></div><div class="gp-act"><button type="button" class="lnk" data-glater>Después</button><span style="flex:1"></span>' + (puterOn() ? '<span class="gp-ok">✓ Ya tienes tu Puter conectado</span><button type="button" class="btn sm flow" data-gnext>Siguiente →</button>' : '<button type="button" class="btn sm flow" data-gnext>Conectar mi Puter</button>') + '</div>', 'puter', puterOn() ? 'Ya tienes tu Puter conectado: si se acaba tu límite de hoy, sigues con él.' : 'Ya puedes chatear gratis. Y si quieres más, con Puter usas la versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis, tiene un límite que se renueva cada mes y se conecta con un clic.', puterOn() ? 'encantada' : 'guino', 1);
    await gWait(420);
    H.wander && H.wander(P6);
    const r6 = await new Promise(res => { $('[data-gnext]', P6).addEventListener('click', () => res('go'), { once:true }); $('[data-glater]', P6).addEventListener('click', () => res('later'), { once:true }); const iv = setInterval(() => { if (!G || G.skip){ clearInterval(iv); res('later'); } }, 300); });
    H.wander && H.wander(null);
    gNeed(); gPanelClose(); H.quiet();
    if (r6 === 'go' && !puterOn()){
      openConnect(); await gWait(650);
      const b = $('#cPU');
      if (b){ await H.moveTo(b, { shape:'point' }); await H.talk('Toca aquí para conectar Puter. Se abre una ventanita para entrar y listo.', { near:b, mood:'senalando', buttons:[{ label:'Siguiente' }] }); }
    }
    gNeed();

    /* 7 · tu Drive (opcional): más espacio y una copia de tus chats */
    if (SZ.ACC.dcid && !(SZ.DRIVE.meta() || {}).linked){
      gHud(7, 'Tu Drive'); SZ.DRIVE.preload(); H.quiet();
      const r7 = await H.talk('¿Quieres más espacio? Vincula tu Google Drive y guardo una copia de tus chats en una carpeta privada de Sonyx. No puedo ver tus otros archivos.', { mood:'encantada', buttons:[{ label:'Vincular mi Drive' }, { label:'Ahora no', ghost:true }] });
      gNeed();
      if (r7 === 0){ H.quiet(); const ok = await driveGo(null); gNeed(); if (ok) await H.talk('¡Hecho! Desde ahora tus chats también viven en tu Drive. Lo encuentras en «⋯ › Google Drive».', { mood:'celebrando', buttons:[{ label:'Terminar' }] }); }
      else { H.talk('Sin problema. Cuando quieras, está en Ajustes › Tus IAs › Google Drive.', { mood:'guino' }); await gWait(2400); }
      gNeed();
    }
    endGuide(true);
  }catch(e){ if (!(e && e.guide)) { console.error('[synthz] guía', e); endGuide(false); } }
}
function endGuide(done){
  if (!G) return;
  const was = G; G = null; was.skip = true;
  try{ localStorage.setItem('synthz:guide', '1'); localStorage.setItem('synthz:tour', '1'); }catch(e){}
  gPanelClose(); root.classList.remove('guiding'); try{ inp.removeAttribute('data-guide-ok'); }catch(e){}
  const h = $('#szgHud'); if (h){ h.classList.remove('on'); setTimeout(() => h.remove(), 500); }
  if (done){ SZ.SND.done(); burst(innerWidth / 2, innerHeight * .3, ['#e6b65f', '#c9566c', '#ffe2a8', '#8fb0ff'], 22); H.talk('¡Ya tienes el Flow! Si me necesitas, la Guía está siempre a mano.', { mood:'flow' }); setTimeout(() => H.hide(), 3200); }
  else H.hide();
}
addEventListener('keydown', e => { if (e.key === 'Escape' && G && !document.querySelector('.szm,#conn,#acc,#sx,#blk')){ e.preventDefault(); endGuide(false); } });
