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
