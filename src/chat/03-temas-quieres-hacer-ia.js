/* ---------- temas: «¿qué quieres hacer?» con IA recomendadas para cada uno ---------- */
const TOPICS = [
  ['escribir', '✍️', 'Escribir', { write:30, lang:10 }, [['Mejora un texto mío', 'Mejora este texto: hazlo más claro y natural, sin cambiar lo que quiero decir:\n\n'], ['Escribe un mensaje difícil', 'Ayúdame a escribir un mensaje amable pero firme para: ']]],
  ['marketing', '📣', 'Marketing', { write:30, lang:8, fast:4 }, [['3 ideas de post para vender', 'Dame 3 ideas de publicaciones para vender mi producto en Instagram. Mi producto es: '], ['Un eslogan para mi marca', 'Propón 10 eslóganes cortos y memorables para mi marca, que se dedica a: ']]],
  ['codigo', '💻', 'Código', { code:40, reason:8 }, [['Explícame este código', 'Explícame paso a paso qué hace este código y cómo podría mejorarlo:\n\n'], ['Arregla un error', 'Tengo este error. Dime por qué pasa y cómo arreglarlo:\n\n']]],
  ['estudiar', '📚', 'Estudiar', { reason:18, lang:10, long:6, write:6 }, [['Explícame un tema difícil', 'Explícame este tema como a un principiante, con un ejemplo y 3 preguntas para repasar. El tema es: '], ['Resume este documento', 'Resume este documento en 5 puntos clave y dime qué es lo más importante.', 'file']]],
  ['planos', '📐', 'Planos y arquitectura', { reason:22, math:16, vision:8 }, [['Distribuye un espacio', 'Ayúdame a distribuir un espacio. Mide ___ por ___ metros y necesito que tenga: '], ['Calcula materiales', 'Calcula cuánto material necesito (con un 10 % de margen) para: ']]],
  ['negocios', '📈', 'Negocios', { reason:22, write:16, long:4 }, [['Un plan para mi idea', 'Hazme un plan de negocio sencillo en pasos para esta idea: '], ['Ponle precio a lo que vendo', 'Ayúdame a calcular un precio justo y rentable. Vendo ___, me cuesta ___ hacerlo y mi competencia cobra ___.']]],
  ['ideas', '💡', 'Ideas', { write:20, fast:12, reason:6 }, [['Lluvia de ideas', 'Dame 15 ideas originales (de las más normales a las más locas) para: '], ['Aterriza mi idea', 'Hazme preguntas para aterrizar esta idea y luego propón un plan en pasos. Mi idea es: ']]],
  ['imagenes', '🖼️', 'Imágenes y PDF', { vision:45, long:10 }, [['Describe una imagen', 'Describe esta imagen con detalle y dime qué te llama la atención.', 'file'], ['Saca los datos de un PDF', 'Saca de este PDF los datos importantes en una tabla.', 'file']]],
  ['redes', '📱', 'Redes sociales', { write:25, fast:10, lang:6 }, [['Guion para un reel', 'Escribe un guion de 30 segundos para un reel sobre: '], ['Calendario de publicaciones', 'Hazme un calendario de publicaciones de 2 semanas para una cuenta de: ']]],
  ['ventas', '💼', 'Ventas', { write:25, reason:6 }, [['Responde a un cliente', 'Ayúdame a responder a este cliente de forma amable para cerrar la venta:\n\n'], ['Descripción de producto', 'Escribe una descripción de producto que convenza, para: ']]],
  ['correo', '✉️', 'Correos y trabajo', { write:28, fast:8 }, [['Escribe un correo formal', 'Escribe un correo formal y corto para: '], ['Resume una reunión', 'Convierte estas notas de reunión en un resumen con tareas y responsables:\n\n']]],
  ['empleo', '🧾', 'Hoja de vida y empleo', { write:28, lang:6 }, [['Mejora mi hoja de vida', 'Mejora mi hoja de vida para el cargo de ___. Aquí está:\n\n'], ['Prepárame una entrevista', 'Hazme 8 preguntas de entrevista para el cargo de ___ y dime qué responder.']]],
  ['web', '🌐', 'Páginas web', { code:36, vision:4 }, [['Crea una página sencilla', 'Crea una página web sencilla en un solo archivo HTML para: '], ['Revisa mi página', 'Revisa este código de mi página y dime qué mejorar en diseño y velocidad:\n\n']]],
  ['datos', '📊', 'Datos y Excel', { code:20, math:16, reason:10 }, [['Una fórmula de Excel', 'Dame la fórmula de Excel para: '], ['Analiza estos datos', 'Analiza estos datos y dime qué conclusiones sacas:\n\n']]],
  ['idiomas', '🌍', 'Idiomas', { lang:35, write:10 }, [['Traduce con naturalidad', 'Traduce esto al inglés de forma natural, no literal:\n\n'], ['Practica conmigo', 'Practica inglés conmigo: hazme preguntas sencillas y corrige mis errores con amabilidad.']]],
  ['mate', '➗', 'Matemáticas', { math:40, reason:20 }, [['Resuelve paso a paso', 'Resuelve este ejercicio paso a paso y explica cada paso: '], ['Explícame una fórmula', 'Explícame para qué sirve y cómo se usa esta fórmula, con un ejemplo: ']]],
  ['ciencia', '🔬', 'Ciencia', { reason:28, math:10, long:4 }, [['¿Por qué pasa esto?', 'Explícame de forma sencilla por qué pasa esto: '], ['Ayúdame con un experimento', 'Ayúdame a diseñar un experimento sencillo para comprobar: ']]],
  ['diseno', '🎨', 'Diseño', { vision:22, write:12 }, [['Paleta de colores', 'Propón 3 paletas de colores (con códigos HEX) para una marca de: '], ['Opina sobre mi diseño', 'Dame tu opinión honesta sobre este diseño y cómo mejorarlo.', 'file']]],
  ['finanzas', '💰', 'Finanzas personales', { math:20, reason:18 }, [['Organiza mi presupuesto', 'Ayúdame a organizar un presupuesto mensual. Gano ___ y mis gastos fijos son: '], ['Plan de ahorro', 'Hazme un plan para ahorrar ___ en ___ meses.']]],
  ['legal', '⚖️', 'Legal (orientación)', { reason:24, long:12, write:8 }, [['Explícame un contrato', 'Explícame en palabras sencillas qué dice este contrato y qué debería revisar con un abogado:\n\n'], ['Redacta una carta', 'Ayúdame a redactar una carta formal de reclamo por: ']]],
  ['salud', '🩺', 'Salud y bienestar', { reason:20, write:10 }, [['Rutina de ejercicio suave', 'Propón una rutina de ejercicio suave de 20 minutos para alguien que empieza.'], ['Hábitos para dormir mejor', 'Dame hábitos sencillos para dormir mejor.']]],
  ['cocina', '🍳', 'Recetas', { write:18, fast:12 }, [['¿Qué cocino con esto?', 'Tengo estos ingredientes: ___. ¿Qué puedo cocinar? Dame 3 opciones fáciles.'], ['Menú de la semana', 'Hazme un menú de almuerzos para la semana, económico y sano.']]],
  ['viajes', '✈️', 'Viajes', { write:16, fast:10, lang:8 }, [['Plan de viaje', 'Hazme un plan de viaje de ___ días a ___ con un presupuesto de ___.'], ['Qué empacar', 'Hazme una lista de qué empacar para un viaje de ___ días a ___.']]],
  ['musica', '🎵', 'Música y letras', { write:28 }, [['Ayúdame con una canción', 'Ayúdame a escribir la letra de una canción sobre: '], ['Ideas de acordes', 'Sugiere una progresión de acordes con un ambiente ___ para una canción.']]],
  ['historias', '📖', 'Historias y guiones', { write:36, long:6 }, [['Empieza una historia', 'Escribe el inicio de una historia corta sobre: '], ['Mejora mi guion', 'Mejora los diálogos de este guion:\n\n']]],
  ['juegos', '🎮', 'Videojuegos', { write:14, code:14, fast:8 }, [['Idea para un juego', 'Propón una idea de videojuego sencillo con sus reglas sobre: '], ['Estrategia', 'Dame una estrategia para mejorar en: ']]],
  ['productividad', '⏱️', 'Productividad', { fast:20, write:12 }, [['Organiza mi día', 'Organiza mi día en bloques de tiempo. Tengo que hacer: '], ['Divide una tarea grande', 'Divide esta tarea grande en pasos pequeños: ']]],
  ['complejo', '🧠', 'Tareas complejas', { reason:40, code:6, math:6, long:8 }, [['Piénsalo a fondo', 'Piensa a fondo y paso a paso antes de responder: '], ['Compara opciones', 'Compara estas opciones con ventajas, desventajas y una recomendación final:\n\n']]]
];
const TOPIC = Object.fromEntries(TOPICS.map(([k, e, l, w, ex]) => [k, { k, e, l, w, ex }]));
const TOPICS_SHOWN = 8;
let curTopic = null, topicsAll = false;
const recC = new Map();
function recommendTop(k, n){
  const T = TOPIC[k]; if (!T) return [];
  const ck = k + '|' + n + '|' + cat.list.length + '|' + (puterOn() ? 1 : 0) + (orOn() ? 1 : 0) + '|' + (st().survey ? st().survey.t : 0);
  if (recC.has(ck)) return recC.get(ck);
  const r = recommendTop0(T, n); if (recC.size > 80) recC.clear(); recC.set(ck, r); return r;
}
function recommendTop0(T, n){
  const usable = cat.list.filter(m => !m.stub && (m.free || /^pu:/.test(m.id)));
  const pool = usable.filter(m => connected(m.id)).length ? usable.filter(m => connected(m.id)) : usable.filter(m => /^pu:/.test(m.id));
  const sc = m => { const ex = expert(m).tags; let s = 0; Object.keys(T.w).forEach(t => { if (ex.includes(t)) s += T.w[t]; }); if (m.reasoning && T.w.reason) s += 4; if (T.w.long && m.ctx >= 120000) s += 6; if (T.w.vision && !m.vision) s -= 30; s += Math.min(6, SZ.surveyScore(m, st().survey) / 10); return s + mScore(m) / 40; };
  const out = [], seen = new Set();
  pool.map(m => [m, sc(m)]).sort((a, b) => b[1] - a[1]).forEach(([m]) => { const fam = m.name.split(/[\s:.-]/)[0].toLowerCase(); if (out.length < n && !seen.has(fam)){ seen.add(fam); out.push(m); } });
  return out;
}
/* 3 ejemplos que solo se escriben en la caja (cambian en cada chat nuevo) */
const EXK = ['marketing', 'estudiar', 'codigo', 'escribir', 'negocios', 'ideas', 'planos', 'redes', 'correo', 'idiomas', 'cocina', 'viajes'];
let exSeed = Math.floor(Math.random() * EXK.length);
function examplesHtml(){
  const ks = [0, 1, 2].map(i => EXK[(exSeed + i * 4) % EXK.length]);
  return '<div class="hexs">' + ks.map((k, i) => { const T = TOPIC[k], x = T.ex[0]; return '<button type="button" class="hex" data-hex="' + k + '" style="--i:' + i + '"><small>' + esc(T.l) + '</small><span>' + esc(x[0]) + '</span></button>'; }).join('') + '</div>';
}
/* v1.3: los ejemplos van debajo del saludo, cambian solos y desaparecen cuando ya usaste el chat más de 5 veces */
const sentN = () => { let n = 0; try{ n = +localStorage.getItem('synthz:sent') || 0; }catch(e){} if (!n){ try{ n = Object.values(st().chats || {}).filter(a => Array.isArray(a) && a.some(m => m.role === 'user')).length; }catch(e){} } return n; };
const showEx = () => sentN() <= 5;
function exRowHtml(){
  const ks = [0, 1, 2].map(i => EXK[(exSeed + i * 4) % EXK.length]);
  return ks.map((k, i) => { const T = TOPIC[k], x = T.ex[0]; return '<button type="button" class="hex hxs" data-hex="' + k + '" style="--i:' + i + '"><small>' + esc(T.l) + '</small><span>' + esc(x[0]) + '</span></button>'; }).join('');
}
setInterval(() => {
  const r = document.getElementById('hexR'); if (!r || document.hidden || root.classList.contains('idle-sleep') || r.matches(':hover') || r.contains(document.activeElement)) return;
  exSeed = (exSeed + 1) % EXK.length;
  if (SZ.reduce){ r.innerHTML = exRowHtml(); return; }
  r.animate([{ opacity:1, transform:'none', filter:'blur(0)' }, { opacity:0, transform:'translateY(-6px)', filter:'blur(4px)' }], { duration:320, easing:'ease-in' }).onfinish = () => { r.innerHTML = exRowHtml(); r.animate([{ opacity:0, transform:'translateY(6px)', filter:'blur(4px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:420, easing:'cubic-bezier(.22,1,.36,1)' }); };
}, 7000);
function topicsHtml(){
  return '';   /* v2.3: se quitó la zona de temas (ya estaba en los filtros) */
  const L = topicsAll ? TOPICS : TOPICS.slice(0, TOPICS_SHOWN);
  return '<div class="topics" role="group" aria-label="¿Qué quieres hacer?">' + L.map(([k, e, l], i) => '<button type="button" class="tchip" data-topic="' + k + '" aria-pressed="' + (curTopic === k) + '" style="--i:' + i + '">' + esc(l) + '</button>').join('')
    + (topicsAll ? '<button type="button" class="tchip more" data-topics-less>Menos temas</button>' : '<button type="button" class="tchip more" data-topics-more>Más temas →</button>') + '</div>';
}
function rcardHtml(m, i){
  const p = payOf(m.id), F = factsOf(m).filter(f => f[0] === 'ctx' || f[0] === 'lang').map(f => f[1]).join(' · ');
  return '<div class="rcard" data-id="' + esc(m.id) + '" style="--vc:' + vendorColor(m.vendor) + ';--i:' + i + '"><div class="rh">' + av(m) + '<div><b>' + esc(m.name) + '</b><small>' + esc(m.vlabel) + '</small></div></div>'
    + '<p>' + esc(expert(m).line + (F ? ' · ' + F : '')) + '</p><span class="rpay ' + esc(p[0].split(' ')[0]) + '">' + esc(p[2]) + '</span>'
    + '<div class="ra"><button class="btn sm" type="button" data-use>' + (connected(m.id) ? 'Usar esta' : 'Conectar y usar') + '</button><label class="ckb"><input type="checkbox" data-rc>Comparar</label></div></div>';
}
function topicPanelHtml(k){
  const T = TOPIC[k]; if (!T) return '';
  const r = recommendTop(k, 3);
  return '<div class="tphead"><h5>Para <em>' + esc(T.l) + '</em> te recomiendo</h5><small>Elegidas por lo que mejor saben hacer · marca 2 o más para compararlas</small></div>'
    + (r.length ? '<div class="rcards">' + r.map(rcardHtml).join('') + '</div>' : '<p class="cnote" style="text-align:center">' + (cat.list.length ? 'Las IAs están descansando un momento. Vuelve a intentarlo en un ratito.' : 'Cargando la lista de IA…') + '</p>')
    + '<div class="cmpgo" id="cmpGo" hidden></div>'
    + '<div class="texs">' + T.ex.map((x, i) => '<button type="button" data-tex="' + i + '" style="--i:' + i + '">' + esc(x[0]) + '</button>').join('') + '</div>';
}
function paintTopic(){
  const box = $('#tPanel'); if (!box) return;
  const h0 = box.offsetHeight;
  box.innerHTML = curTopic ? topicPanelHtml(curTopic) : '';
  if (!SZ.reduce){ const h1 = box.offsetHeight; box.animate([{ height:h0 + 'px', opacity:.4 }, { height:h1 + 'px', opacity:1 }], { duration:480, easing:'cubic-bezier(.22,1,.36,1)' }); }
  $$('.tchip[data-topic]', lane).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.topic === curTopic)));
}
function paintCmpGo(){
  const go = $('#cmpGo'); if (!go) return;
  const ids = $$('.rcard', lane).filter(c => $('[data-rc]', c).checked).map(c => c.dataset.id);
  $$('.rcard', lane).forEach(c => c.classList.toggle('on', $('[data-rc]', c).checked));
  if (ids.length < 2){ go.hidden = true; return; }
  go.hidden = false;
  go.innerHTML = '<span>Marcaste ' + ids.map(id => '<b>' + esc(info(id).name) + '</b>').join(' y ') + '</span><button type="button" class="btn sm flow" data-cmpgo>Comparar estas ' + ids.length + ' →</button>';
}
function emptyEl(){
  const e = document.createElement('div'); e.className = 'hello';
  if (mode === 'cmp'){
    e.innerHTML = '<h1 class="greet">' + greetHtml(['Una pregunta, ', 'varias IA', '.']) + '</h1><p class="hsub">Escribe abajo: todas responden a la vez y aparecen en el orden en que van llegando.</p>'
      + (st().cmp.length < 2 ? '<button type="button" class="btn sm flow" data-add-cmp>+ Agregar otra IA</button>' : '');
    return e;
  }
  const ex = showEx();
  if (agentOn()){
    e.classList.add('aghello');
    e.innerHTML = '<p class="agbadge">' + AG_ICO + 'Modo SuperiorSynth activado</p>' + hiName() + '<h1 class="greet">' + greetHtml(['¿Qué quieres ', 'FlowIA’r', '?']) + '</h1>' + flowWhatHtml()
      + (ex ? '<div class="hexs hexr" id="hexR" aria-label="Ideas para empezar">' + exRowHtml() + '</div>' : '')
      + '<p class="hsub2">Cuéntame qué necesitas. SuperiorSynth entiende tu pedido, lo mejora, elige la IA que más sabe de eso y te muestra cada paso.</p><div class="hcomp"></div>';
    return e;
  }
  e.classList.add('luma-start');
  let h = hiName() + '<h1 class="greet">Las buenas ideas empiezan con una buena pregunta.</h1>'
    + (ex ? '<div class="luma-ideas" aria-label="Ideas para empezar">' +
      [['ideas', 'Dar forma a una idea'], ['estudiar', 'Entender algo nuevo'], ['escribir', 'Crear algo desde cero']]
        .map(([key, label]) => '<button type="button" class="hex" data-hex="' + key + '"><b>' + label + '</b><small>' + esc(TOPIC[key].ex[0][0]) + '</small></button>').join('') + '</div>' : '');
  h += '<div class="hcomp"></div>' + topicsHtml() + '<div class="tpanel" id="tPanel">' + (curTopic ? topicPanelHtml(curTopic) : '') + '</div>'
    + (ex ? '<p class="hfoot">Tocar una idea solo la escribe; tú decides cuándo enviarla.</p>' : '');
  e.innerHTML = h;
  return e;
}
/* inicio limpio (como «A · Inicio»): la caja de escribir sube al centro y la IA se elige dentro de ella */
const composer = $('#composer');
function parkComposer(){ if (composer.parentElement !== $('.main')) $('.main').insertBefore(composer, $('#tabbar')); }
let wasFresh = null;
function setFresh(on){
  document.body.classList.toggle('fresh', on); composer.classList.toggle('big', on && !isMobile());
  renderCPick();
  if (on !== wasFresh){ wasFresh = on; renderTop(); }
}
function renderCPick(){
  const b = $('#cPick'); if (!b) return;
  const m = info(selId());
  b.style.setProperty('--vc', vendorColor(m.vendor));
  b.innerHTML = av(m) + '<b>' + esc(m.name) + '</b>' + (!st().pinned && m.id !== TRIAL_ID ? '<i class="sug">sugerida</i>' : '') + CARET;
  $('#cCmp').hidden = true;   /* v3.7 · Comparar salió de la caja de escribir: ahora está en la barra («Comparar IAs») */
}
function renderMsgs(){
  parkComposer();
  lane.innerHTML = '';
  if (mode === 'cmp'){ setFresh(false); if (cmpLast) lane.appendChild(cmpLast.node); else lane.appendChild(emptyEl()); jump(); return; }
  const chat = chatArr(), thinking = Object.keys(busy).find(k => busy[k] === 'think' && (k === selId() || agentOn()));
  const fresh = !chat.length && !thinking;
  if (fresh){ const e = emptyEl(); lane.appendChild(e); if (!isMobile()){ const hc = $('.hcomp', e); if (hc) hc.appendChild(composer); } }
  setFresh(fresh);
  const ck0 = ckey();
  let srcs = null;
  chat.forEach((m, i) => {
    if (isFix(m)){ lane.appendChild(fixNoteEl(m)); srcs = null; }
    else if (m.role === 'user'){ const u = userEl(m.content, m.files); u.style.animation = 'none'; lane.appendChild(u); if (m.agent) lane.appendChild(agentSumEl(m.agent)); srcs = m.sources && m.sources.length ? m.sources : null; if (srcs) lane.appendChild(sourcesEl(m)); }
    else { const b = botEl(m.model || selId()); b.style.animation = 'none'; b._raw = quitaMarcas(m.content); b._ck = ck0; b._ci = i; b.dataset.ci = i; if (m.work) b.insertBefore(SZ.workSaved(m.work), $('.body', b)); $('.body', b).innerHTML = md(quitaMarcas(m.content)); if (m.imgId) imgFill($('.body', b), m); b._sources = srcs; finishBot(b, m.meta, i === chat.length - 1, m.cont, m.star); revBadge(b, m); if (!isFix(chat[i + 1])) ckIdle(b); lane.appendChild(b); }
  });
  if (live && live.chat === chat && live.el){ $$('.m.last', lane).forEach(x => x.classList.remove('last')); lane.appendChild(live.el); }   /* v3.3 · la respuesta en vivo no se pierde al repintar */
  else if (thinking) lane.appendChild(thinkEl(thinking));
  if (fresh){ msgsEl.scrollTop = 0; requestAnimationFrame(() => { msgsEl.scrollTop = 0; }); } else jump();
}
function showErr(err, o){ if (err && err.aborted) return; showErr2(err, o || {}); }
function showErr2(err, o){
  const t0 = $('.think-wrap', lane); if (t0) t0.remove();               /* nunca se queda «Pensando…» después de un error */
  try{ SZ.telEv(err && err.limit ? 'limit' : 'error', String((err && (err.sz || err.status)) || '') + ' ' + String(err && err.message || '').slice(0, 90)); }catch(e2){}
  /* a dónde puedes cambiar de verdad: a las IAs conectadas si está activa, o a tu Puter si está conectado (nunca a algo que no tienes) */
  let sw = err && err.switchTo; if (sw === 'or') sw = 'sz';
  if (sw === 'sz' && (!szOn() || /^sz:/.test(selId()))) sw = puterOn() && !/^pu:/.test(selId()) ? 'pu' : null;
  if (sw === 'pu' && !puterOn()) sw = szOn() && !/^sz:/.test(selId()) ? 'sz' : null;
  if (err && err.sz === 'sz_limit' && puterOn()) sw = 'pu';
  if (err && err.needLogin) setTimeout(openConnect, 250);
  const e = document.createElement('div'); e.className = 'm err'; e.textContent = err.message;
  if (sw){ const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm swb'; b.textContent = sw === 'pu' ? 'Seguir con mi Puter' : 'Usar las IAs conectadas'; b.addEventListener('click', () => switchProv(sw)); e.appendChild(document.createElement('br')); e.appendChild(b); }
  if (err && err.guest){ [['Crear mi cuenta · gratis', 'signup', 'btn sm swb flow'], ['Ya tengo cuenta', 'login', 'lnk swb']].forEach(([t, m, c]) => { const b = document.createElement('button'); b.type = 'button'; b.className = c; b.textContent = t; b.addEventListener('click', () => SZ.guestGate({ mode:m, done:() => { e.remove(); lockWas = null; paintLock(); try{ renderAccBtn(); }catch(x){} } })); e.appendChild(document.createElement('br')); e.appendChild(b); }); }
  else if (err && err.sz === 'sz_limit' && !puterOn()){ const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm swb'; b.textContent = 'Conectar mi Puter (gratis)'; b.addEventListener('click', () => openConnect()); e.appendChild(document.createElement('br')); e.appendChild(b); }
  err = Object.assign(err || {}, { switchTo:sw || null });
  const note = document.createElement('small'); note.className = 'errnote';
  note.textContent = 'Este intento no gastó de tu límite. ' + (o.regen ? 'La respuesta anterior sigue igual.' : 'Tu mensaje volvió a la caja de texto.') + (err && err.limit ? '' : ' Si lo intentas otra vez, cuenta como un mensaje nuevo.');
  e.appendChild(note);
  if (!(err && (err.limit || err.needLogin || err.switchTo))){ const r = document.createElement('button'); r.type = 'button'; r.className = 'btn sm swb'; r.textContent = 'Reintentar'; r.addEventListener('click', () => { e.remove(); if (o.regen) regen(); else if (inp.value.trim()) send(); }); e.appendChild(document.createElement('br')); e.appendChild(r); }
  lane.appendChild(e); jump(); }

/* copiar / otra vez / sugerencias */
function copyText(txt){
  const done = () => true;
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt).then(done, () => fallbackCopy(txt));
  return Promise.resolve(fallbackCopy(txt));
}
function fallbackCopy(txt){ const t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); try{ document.execCommand('copy'); }catch(e){} t.remove(); return true; }
function flash(btn, label){ const old = btn.innerHTML; btn.classList.add('ok'); btn.textContent = label; setTimeout(() => { btn.classList.remove('ok'); btn.innerHTML = old; }, 1300); }
lane.addEventListener('click', async e => {
  const cp = e.target.closest('.cpc');
  if (cp){ const code = $('code', cp.parentElement); await copyText(code ? code.textContent : ''); cp.classList.add('ok'); cp.textContent = '¡copiado!'; setTimeout(() => { cp.classList.remove('ok'); cp.textContent = 'copiar'; }, 1300); return; }
  const act = e.target.closest('.act');
  if (act){
    const msg = act.closest('.m, .cmp-card');
    if (act.dataset.a === 'copy'){ await copyText(msg._raw || ''); flash(act, 'Copiado'); }
    else if (act.dataset.a === 'down'){ const t = (msg._raw || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim(); const first = (t.match(/^#+\s*(.+)$/m) || [, 'respuesta'])[1]; cnvDownload({ text:t, name:(fold(first).trim().replace(/\s+/g, '-').slice(0, 40) || 'respuesta') + '.md' }); }
    else if (act.dataset.a === 'star') toggleStar(msg, act);
    else if (act.dataset.a === 'flow') pickWinner(msg);
    else if (act.dataset.a === 'regen') regen();
    else if (act.dataset.a === 'cont'){ if (!Object.keys(busy).length){ inp.value = 'Continúa exactamente donde te quedaste, sin repetir lo anterior.'; autoGrow(); updateHint(); send(); } }
    return;
  }
  const fl = e.target.closest('.flowb'); if (fl){ pickWinner(fl.closest('.cmp-card')); return; }
  const sg = e.target.closest('.sugg button[data-x]'); if (sg){ useExample(+sg.dataset.x); return; }
  const tp = e.target.closest('[data-topic]'); if (tp){ curTopic = curTopic === tp.dataset.topic ? null : tp.dataset.topic; paintTopic(); if (curTopic){ const p = $('#tPanel'); setTimeout(() => { if (p && p.isConnected) p.scrollIntoView({ behavior:SZ.reduce ? 'auto' : 'smooth', block:'nearest' }); }, 120); } return; }
  if (e.target.closest('[data-topics-more]') || e.target.closest('[data-topics-less]')){
    topicsAll = !!e.target.closest('[data-topics-more]'); const t = $('.topics', lane); if (!t) return;
    const old = new Set($$('[data-topic]', t).map(x => x.dataset.topic));
    smoothSwap(t, () => { t.innerHTML = topicsHtml().replace(/^<div[^>]*>|<\/div>$/g, ''); });
    $$('.tchip', t).forEach(x => { if (old.has(x.dataset.topic)) x.classList.remove('rise'); });
    return;
  }
  const hx = e.target.closest('[data-hex]'); if (hx){ const x = TOPIC[hx.dataset.hex].ex[0]; useText(x[1], x[2]); return; }
  const tx = e.target.closest('[data-tex]'); if (tx && curTopic){ const x = TOPIC[curTopic].ex[+tx.dataset.tex]; if (x) useText(x[1], x[2]); return; }
  const use = e.target.closest('[data-use]'); if (use){ const id = use.closest('.rcard').dataset.id; pickMode = 'set'; pickModel(id, use.closest('.rcard')); if (!connected(id)) ensureConn(); return; }
  if (e.target.closest('[data-cmpgo]')){ const ids = $$('.rcard', lane).filter(c => $('[data-rc]', c).checked).map(c => c.dataset.id); startCompare(ids); return; }
  if (e.target.closest('[data-pick]')){ openSide('set', e.target.closest('[data-pick]')); return; }
  if (e.target.closest('[data-add-cmp]')){ openSide('add', e.target.closest('[data-add-cmp]')); return; }
});
lane.addEventListener('change', e => {
  const c = e.target.closest('[data-rc]'); if (!c) return;
  if (c.checked){ const others = $$('.rcard', lane).filter(x => $('[data-rc]', x).checked && $('[data-rc]', x) !== c).map(x => x.dataset.id), why = cmpWhyNot(c.closest('.rcard').dataset.id, others); if (why && why !== 'ya'){ c.checked = false; toast(why); } }
  paintCmpGo();
});
/* rellenar con un ejemplo (y si pide archivo, señalar el clip) */
function useText(text, kind){
  typeIntoComposer(text, () => {
    if (kind === 'file' && !files.length){ const a = $('#attachBtn'); a.classList.remove('pulse'); void a.offsetWidth; a.classList.add('pulse'); toast('Adjunta el archivo con el clip 📎 y luego envía.'); }
    else toast('Completa el mensaje y envíalo cuando quieras.');
  });
}
/* rellena la caja de texto SIN enviar: tú decides cuándo mandarlo */
let typeTok = 0;
function typeIntoComposer(text, done){
  if (Object.keys(busy).length) return;
  const tok = ++typeTok;                                  /* un relleno nuevo cancela el anterior */
  inp.focus(); inp.value = '';
  const end = () => { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); autoGrow(); updateHint(); if (done) done(); };
  if (SZ.reduce){ inp.value = text; end(); return; }
  let i = 0;
  (function step(){ if (tok !== typeTok) return; i = Math.min(text.length, i + 3); inp.value = text.slice(0, i); autoGrow(); if (i < text.length) setTimeout(step, 14); else end(); })();
}
