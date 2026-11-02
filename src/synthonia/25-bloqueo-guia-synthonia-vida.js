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
        const q = kind === 'j' ? 'Cuéntame un chiste corto, blanco y nuevo, de una o dos líneas.' : 'Dime un dato curioso corto y verdadero del mundo, de una línea.';
        const r = await fetch('/api/help', { method:'POST', headers:Object.assign({ 'content-type':'application/json' }, B.SESS ? { authorization:'Bearer ' + B.SESS } : {}), body:JSON.stringify({ action:'ask', q, hist:[] }) });
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
    if (!t || !HAND){ botBubble('Perdónanos por tu mala experiencia. Toca «BETA» para contarnos cuál fue el problema.', 9000); return; }
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

