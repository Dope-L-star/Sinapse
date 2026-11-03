/* ---------- v1.8 · modo agente: tú escribes; el agente entiende y mejora tu pedido, elige la IA que más sabe de eso
   y te muestra cada paso. Al final decides: quedarte con esa IA o seguir en modo agente ---------- */
let agentBusy = false;
const agentOn = () => !!st().agent && !trialOn;
$('#agPill').addEventListener('click', () => { if (isMobile()) closeChatsSheet && closeChatsSheet(); setAgent(false); });
function paintAgent(){ try{ paintMode(); }catch(e){} $$('.agentb, #railAgent').forEach(b => { b.setAttribute('aria-pressed', String(agentOn())); b.classList.toggle('on', agentOn()); }); document.body.classList.toggle('agenting', agentOn()); inp.placeholder = agentOn() ? 'SuperiorSynth: cuéntame qué necesitas…' : (isLocked() ? inp.placeholder : 'Escribe tu mensaje...'); }
function setAgent(on){
  if (!!st().agent === !!on){ paintAgent(); return; }
  if (mode !== 'solo'){ stopNow(); cmpRun++; cmpLast = null; mode = 'solo'; }
  st().agent = !!on; save(); paintAgent(); gen++;
  try{ renderMsgs(); updateHint(); renderTop(true); renderNow(); renderChats(false); }catch(e){}
  toast(on ? 'Modo SuperiorSynth activado: tú escribes y SuperiorSynth elige la IA que más sabe de eso.' : 'Modo SuperiorSynth apagado: ahora eliges tú la IA.');
}
const AG_STEPS = ['Entendiendo tu pedido', 'Mejorando tu pedido para que la IA lo entienda mejor', 'Eligiendo la IA que más sabe de esto', 'Pasándole tu pedido a la IA'];
/* v2.3 · SuperiorSynth: su ícono propio, animado (una estrella que late con un satélite que la orbita) */
function ssIco(cls){
  const run = !SZ.reduce && !root.classList.contains('noanim');
  /* la órbita pasa por detrás de la estrella (arco de arriba) y por delante (arco de abajo): se siente en 3D */
  return '<svg class="ssi' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(-24 12 12)">'
    + '<path class="ssi-o" d="M1.3 12a10.7 3.7 0 0 1 21.4 0" fill="none" stroke="url(#ssG)" stroke-width="1.35" stroke-linecap="round" opacity=".55"/></g>'
    + '<path class="ssi-s" d="M12 2.6l2.05 7.35L21.4 12l-7.35 2.05L12 21.4l-2.05-7.35L2.6 12l7.35-2.05z" fill="url(#ssG)"/>'
    + '<g transform="rotate(-24 12 12)"><path class="ssi-o" d="M22.7 12a10.7 3.7 0 0 1-21.4 0" fill="none" stroke="url(#ssG)" stroke-width="1.35" stroke-linecap="round"/>'
    + '<circle class="ssi-d" r="1.6" fill="#fff4dc"' + (run ? '><animateMotion dur="3.6s" repeatCount="indefinite" path="M1.3 12a10.7 3.7 0 1 0 21.4 0a10.7 3.7 0 1 0-21.4 0"/></circle>' : ' cx="22.7" cy="12"/>') + '</g>'
    + '<path class="ssi-k" d="M19.6 2.2l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5z" fill="#ffe7b8"/></svg>';
}
if (!document.getElementById('ssDefs')) document.body.insertAdjacentHTML('afterbegin', '<svg id="ssDefs" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true" focusable="false"><defs><linearGradient id="ssG" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff1d2"/><stop offset=".45" stop-color="#e6b65f"/><stop offset="1" stop-color="#c9566c"/></linearGradient></defs></svg>');
const ssMount = () => $$('.ssmount').forEach(m => { if (!m.firstChild) m.innerHTML = ssIco(); });
ssMount();
const AG_ICO = ssIco();
/* lo que hace el agente, en vivo: su loguito de píxeles y los pasos que se van marcando */
function agentCard(){
  const el = document.createElement('div'); el.className = 'agrun';
  el.innerHTML = '<div class="ag-h"><span class="pxw">' + SZ.pixelGrid() + '</span><span class="ag-t"><b>SuperiorSynth</b><small>Trabajando en tu pedido…</small></span></div><ol class="ag-s">' + AG_STEPS.map((t, i) => '<li data-i="' + i + '"><i aria-hidden="true"></i><span>' + t + '</span></li>').join('') + '</ol>';
  const px = SZ.pixelRun($('.pxw', el));
  return {
    el,
    set(i, txt){ $$('li', el).forEach((li, j) => { li.classList.toggle('done', j < i); li.classList.toggle('on', j === i); }); if (txt) $('li[data-i="' + i + '"] span', el).textContent = txt; follow(); },
    stop(){ px.stop(); $$('li', el).forEach(li => { li.classList.remove('on'); li.classList.add('done'); }); }
  };
}
/* lo que queda guardado debajo de tu mensaje: «El agente eligió …» con el pedido mejorado para ver */
function agentSumEl(a){
  const el = document.createElement('div'); el.className = 'agsum';
  el.innerHTML = '<button type="button" class="ag-row" aria-expanded="false"><span class="ag-ic">' + AG_ICO + '</span><span class="ag-tx">SuperiorSynth eligió <b></b><em></em></span>' + (a.ask ? '<svg class="ag-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>' : '') + '</button>' + (a.ask ? '<div class="ag-d" hidden><small>Tu pedido mejorado (esto le llegó a la IA)</small><p></p></div>' : '');
  $('.ag-tx b', el).textContent = a.name || 'una IA'; $('.ag-tx em', el).textContent = a.tl ? ', que sabe de ' + a.tl : '';
  if (a.ask){ $('.ag-d p', el).textContent = a.ask; const row = $('.ag-row', el), d = $('.ag-d', el); row.addEventListener('click', () => { const on = d.hidden; d.hidden = !on; row.setAttribute('aria-expanded', String(on)); el.classList.toggle('open', on); }); }
  return el;
}
/* v2.0 · tareas MUY simples: una IA rápida que gasta menos, pero buena (nunca la más pequeña si hay otra) */
const LIGHT = [/flash-lite/i, /mistral-small/i, /gpt-oss-20b/i, /gemma-3-27b/i, /qwen3-8b/i, /gemma-3-12b/i, /llama-3\.1-8b/i];
const isSimple = (text, plan) => !!(plan && plan.simple) && text.length < 180 && !/```|\n.*\n/.test(text) && !/c[oó]digo|program|ensayo|informe|analiza|compara|plan de|paso a paso/i.test(text);
function lightPick(){
  const L = cat.list.filter(m => /^sz:/.test(m.id) && connected(m.id));
  for (const rx of LIGHT){ const m = L.find(x => rx.test(x.id)); if (m) return m.id; }
  return null;
}
/* v3.4 · SuperiorSynth sigue aunque una IA se rompa: corre la respuesta y, si la IA falla, pasa el MISMO trabajo a otra
   IA experta en ese tema (nunca reintenta con la que falló). Hasta 3 IAs distintas; devuelve { ok, cur, err }. */
async function runExpert(tema, o = {}){
  const g0 = gen, tl = tema && TOPIC[tema] ? TOPIC[tema].l.toLowerCase() : '';
  let cur = selId(), lastErr = null; const tried = [cur];
  for (let n = 0; ; n++){
    lastErr = null;
    await runSolo(err => { lastErr = err; }, Object.assign({}, o, { noRescue:true }));
    if (!lastErr) return { ok:true, cur };
    const next = lastErr.aborted || lastErr.guest || g0 !== gen || n >= 2 ? null : agentNext(tema, tried, lastErr);
    if (!next) return { ok:false, err:lastErr, cur };
    tried.push(next);
    toast(info(cur).name + ' falló. Sigo con ' + info(next).name + (tl ? ', que sabe de ' + tl : '') + ': tu trabajo continúa.');
    try{ SZ.BOT.react && SZ.BOT.react('slow', { auto:next === 'sz:auto' }); }catch(e){}
    if (o.onSwap) try{ o.onSwap(next); }catch(e){}
    cur = next; st().model.openrouter = next; save(); paintSel(); renderTop(false); paintAccent();
  }
}
/* v3.4 · la siguiente IA experta cuando la elegida falló: otra del mismo tema, nunca una que ya falló.
   Si falló por límite, también se salta las del mismo proveedor (tendrían el mismo límite). */
function agentNext(tema, tried, err){
  const prov = id => /^sz:/.test(id) ? 'sz' : String(id).split(':')[0];
  const lastP = prov(tried[tried.length - 1]);
  const ok = m => m && !m.stub && !tried.includes(m.id) && connected(m.id) && !SZ.isBad(m.id) && !(err && err.limit && prov(m.id) === lastP);
  const L = tema ? recommendTop(tema, 15) : [];
  const m = L.find(ok) || [info(APODEX), bestUsable(true), bestUsable(false)].find(ok) || cat.list.find(ok);
  return m ? m.id : null;
}
function agentPick(tema){
  const L = tema ? recommendTop(tema, 10).filter(m => connected(m.id)) : [];
  const top = L.find(m => (info(m.id).spend || 1) < 3) || L[0];   /* no gasta tu Puter en las IA que más consumen si hay otra experta */
  if (top) return top.id;
  if (szOn()) return 'sz:auto';
  if (connected(selId())) return selId();
  const b = bestUsable(true) || bestUsable(false); return b ? b.id : selId();
}
/* después de la respuesta: ¿te quedas con esa IA o sigues en modo agente? */
function agentChoice(pick){
  $$('.agkeep', lane).forEach(x => x.remove());
  const nm = info(pick).name, d = document.createElement('div'); d.className = 'agkeep';
  d.innerHTML = '<span>¿Te quedas con <b></b> o sigues con SuperiorSynth?</span><div class="agk-b"><button type="button" class="btn sm" data-ak="keep"></button><button type="button" class="btn sm ghost" data-ak="go">Seguir con SuperiorSynth</button></div><small>Si sigues con SuperiorSynth, en tu próximo mensaje vuelvo a elegir la IA que más sepa de eso.</small>';
  $('span b', d).textContent = nm; $('[data-ak="keep"]', d).textContent = 'Quedarme con ' + nm;
  lane.appendChild(d); follow();
  d.addEventListener('click', e => {
    const b = e.target.closest('[data-ak]'); if (!b) return; d.remove();
    if (b.dataset.ak === 'go'){ toast('Sigues con SuperiorSynth: en tu próximo mensaje vuelvo a elegir la IA.'); return; }
    /* la conversación sigue igual, ahora con esa IA y sin el agente */
    const k0 = ckey(), msgs = (st().chats[k0] || []).slice(), tid = 't' + Date.now().toString(36), k1 = 'openrouter::' + pick + '::' + tid;
    st().chats[k1] = msgs; delete st().chats[k0]; st().del = [...(st().del || []), k0].slice(-300);
    const L = (st().threads || {})[AGK]; if (L){ const id0 = curT(), e0 = L.find(x => x.id === id0); st().threads[AGK] = L.filter(x => x.id !== id0); if (e0){ const e1 = thMeta(pick, tid, true); e1.title = e0.title; e1.t = Date.now(); } }
    (st().thread || (st().thread = {}))[pick] = tid; st().model.openrouter = pick; st().pinned = pick; st().agent = false;
    save(); paintAgent(); gen++; applyRail(); paintSel(); renderTop(true); paintAccent(); renderMsgs(); updateHint(); renderChats(false);
    toast('Listo: sigues con ' + nm + '. SuperiorSynth quedó apagado; lo vuelves a activar en el botón de modo, junto a la caja de escribir.');
  });
}
async function agentPlan(text){
  const keys = TOPICS.map(t => t[0]).join(', ');
  const sys = 'Eres el planificador de SynthFlow. Lees el pedido de una persona y lo mejoras para que otra IA lo entienda mejor. Responde SOLO con JSON válido y nada más: {"tema":"<una de: ' + keys + '>","internet":<true si para responder bien hacen falta datos actuales de internet (noticias, precios, fechas recientes, resultados, algo de hoy); si no, false>,"dificultad":"<muy_simple si es un saludo, una pregunta de una línea con respuesta corta, traducir o corregir una frase corta; si no, normal>","pedido":"<el pedido mejorado, en el mismo idioma de la persona, claro, con el contexto que dio y el formato de respuesta que le sirve; no inventes datos; máximo 120 palabras>"}';
  /* v3.3 · el plan nunca deja a SuperiorSynth colgado: si tarda más de 12 s (una IA que piensa mucho), sigue con tu pedido tal cual */
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 12000);
  let r; try{ r = await SZ.askStream(SZ.SZ_P, [{ role:'system', content:sys }, { role:'user', content:text.slice(0, 4000) }], { model:'sz:auto', _noFall:true, maxTokens:600, signal:ctl.signal }); }finally{ clearTimeout(tm); }
  const m = String((r && r.text) || '').match(/\{[\s\S]*\}/); if (!m) throw new Error('sin plan');
  const j = JSON.parse(m[0]); if (!j || typeof j.pedido !== 'string' || j.pedido.trim().length < 4) throw new Error('sin plan');
  return { tema:TOPIC[j.tema] ? j.tema : null, web:j.internet === true, simple:j.dificultad === 'muy_simple', pedido:j.pedido.trim().slice(0, 4000) };
}
async function send(){
  if (imgMode && mode === 'solo'){ const t = inp.value.trim(); if (t) createImage(t); return; }
  if (isLocked()){ lockNudge(); return; }
  if (mode === 'cmp') return compare();
  const text = inp.value.trim(), ready = files.filter(f => f.state === 'ok');
  if (!text && !ready.length) return;
  if (Object.keys(busy).length){ toast('Espera a que termine de responder, o detenla con el botón ■.'); return; }
  if (files.some(f => f.state === 'load')){ toast('Espera a que terminen de cargar los archivos.'); return; }
  try{ SZ.setTurn(text + '|' + Date.now()); }catch(e){}
  if (trialOn && trialLeft() <= 0){ toast('Se acabaron tus mensajes de prueba.'); const tb = $('#trialBar'); tb.classList.remove('pulse'); void tb.offsetWidth; tb.classList.add('pulse'); return; }
  if (!budgetOk()) return;
  /* v3.8 · si todavía se está comprobando la IA que elegiste, espera esa respuesta (1-2 s); si no responde, tu texto se queda en la caja */
  { const h = HEALTH.get(selId()), m1 = selId(); if (h && h.p){ sendBtn.disabled = true; try{ await h.p; }finally{ sendBtn.disabled = false; } if (selId() !== m1) return; } }
  /* modo agente: no eliges IA; el agente entiende tu pedido, lo mejora, elige la IA experta y te muestra los pasos */
  if (agentOn() && mode === 'solo' && text && !files.length){
    if (agentBusy) return;
    /* el agente ve que pides una imagen: la crea el creador de imágenes */
    if (IMG_RX.test(text) && SZ.ACC.ready){ toast('SuperiorSynth vio que quieres una imagen: la crea el creador de imágenes.'); return createImage(text); }
    agentBusy = true; inp.readOnly = true; sendBtn.disabled = true;
    /* v3.3 · pase lo que pase (error, cambio de chat), la caja vuelve a quedar libre: antes un fallo a mitad dejaba SuperiorSynth mudo */
    const unlock = () => { agentBusy = false; inp.readOnly = false; sendBtn.disabled = false; };
    try{
    try{ localStorage.setItem('synthz:sent', String(sentN() + 1)); }catch(e){}
    try{ frustration(text, false); }catch(e){}
    const chat = chatArr(), msg = { role:'user', content:text }, g0 = gen;
    inp.value = ''; autoGrow(); updateHint();
    chat.push(msg); touchThread(); save(); renderMsgs();
    const card = agentCard(); lane.appendChild(card.el); jump();
    card.set(0);
    const t1 = setTimeout(() => card.set(1), 1100);
    let plan = null;
    if (szOn()){ try{ plan = await agentPlan(text); }catch(e){ try{ SZ.BOT.problem && SZ.BOT.problem('agent'); }catch(x){} } }
    clearTimeout(t1);
    if (!plan) plan = { tema:guessTopic(text), pedido:text, raw:true };
    const same = plan.raw || plan.pedido.trim() === text.trim();
    card.set(1, same ? 'Tu pedido ya era claro: lo paso tal cual' : 'Mejoré tu pedido para que la IA lo entienda mejor');
    await SZ.sleepRaw(550);
    const tl = plan.tema && TOPIC[plan.tema] ? TOPIC[plan.tema].l.toLowerCase() : '';
    const light = isSimple(text, plan) ? lightPick() : null;
    card.set(2, light ? 'Es algo sencillo: uso una IA rápida que gasta menos' : tl ? 'Eligiendo la IA que más sabe de ' + tl : 'Eligiendo la mejor IA para esto');
    const pick = light || agentPick(plan.tema);
    await SZ.sleepRaw(750);
    card.set(3, 'Le paso tu pedido a ' + info(pick).name);
    await SZ.sleepRaw(600); card.stop();
    unlock();
    if (g0 !== gen){ card.el.remove(); return; }                /* cambiaste de chat mientras tanto */
    if (!same) msg.ask = plan.pedido;
    if (plan.web || needsWeb(text)){ card.el.remove(); await webPrep(msg, plan.pedido || text); if (g0 !== gen) return; }
    if (wantsDeck(text)) msg.deck = true;
    msg.agent = { pick, name:info(pick).name, tl:light ? 'cosas sencillas (gasta menos)' : tl, ask:same ? '' : plan.pedido };
    st().model.openrouter = pick; save(); paintSel(); renderTop(false); paintAccent();
    /* v3.4 · si la IA falla, SuperiorSynth NO reintenta con la misma (siempre volvería a fallar): pasa el trabajo a otra IA
       experta en ese tema y sigue sola, sin que tengas que hacer nada. Hasta 3 IAs distintas; solo si todas fallan ves el error. */
    const rx = await runExpert(plan.tema, { onSwap:next => { msg.agent = Object.assign({}, msg.agent, { pick:next, name:info(next).name }); } });
    const ok = rx.ok, cur = rx.cur, lastErr = rx.err;
    if (!ok){ chat.pop(); save(); renderMsgs(); showErr(lastErr); inp.value = text; autoGrow(); updateHint(); if (g0 === gen && !(lastErr && lastErr.aborted)) setTimeout(() => rescue(cur, lastErr), 900); }
    const pickF = cur;
    if (ok && g0 === gen) agentChoice(pickF);
    if (ok && g0 === gen && MEM_RX.test(text)) memOffer(text);
    }catch(e){ console.error('[superiorsynth]', e); $$('.agrun', lane).forEach(x => x.remove()); renderMsgs(); toast('SuperiorSynth tuvo un problema. Tu mensaje quedó guardado: vuelve a intentarlo.'); }
    finally{ unlock(); }
    return;
  }
  const th0 = ckey(), m0 = selId(), at0 = Date.now(), needed = needsConn();
  if (!(await ensureConn())) return;
  /* si la ventanita de Puter tardó o cambiaste de chat o de IA mientras tanto, no envío solo: tu texto sigue en la caja */
  if (needed && (ckey() !== th0 || selId() !== m0 || Date.now() - at0 > 15000 || inp.value.trim() !== text)){ toast('¡Listo! Revisa tu mensaje y toca enviar.'); inp.focus(); return; }
  /* v3.4 · si la IA elegida no ve fotos, ya no te bloquea: esta respuesta la da una que sí ve (antes salía «Este modelo no ve imágenes» y no podías enviar) */
  /* v3.7 · y solo por esta respuesta: tu IA elegida se queda elegida (antes te la cambiaba para siempre al adjuntar una foto) */
  let oneModel = null;
  /* v3.8 · foto (o PDF escaneado, o video) con una IA que no ve: una IA que sí ve la describe en texto y responde TU IA elegida.
     Solo si eso falla, responde esa vez la que ve (como antes). Y si ninguna ve, se manda la ficha de la foto: nunca te bloquea. */
  if (ready.some(f => f.kind === 'img') && !info(selId()).vision){
    const v = visionPick();
    if (v && !(await seeForMe(ready, v, text))){ oneModel = v.id; toast(info(selId()).name + ' no ve fotos: esta vez te responde ' + v.name + ', que sí las ve. Después sigues con ' + info(selId()).name + '.'); }
    else if (!v) ready.filter(f => f.kind === 'img' && !f.seen).forEach(f => { f.text = (f.text ? f.text + '\n\n' : '') + '[Foto adjunta: ' + f.name + '. Ahora no hay ninguna IA conectada que vea fotos; si la necesitas, pídele a la persona que cuente qué muestra.]'; });
  }
  try{ localStorage.setItem('synthz:sent', String(sentN() + 1)); }catch(e){}
  try{ frustration(text, false); }catch(e){}
  const chat = chatArr(), sent = files.splice(0).filter(f => f.state === 'ok');
  inp.value = ''; autoGrow(); updateHint(); renderTray();
  const msg = { role:'user', content:text };
  if (sent.length) msg.files = sent.map(f => ({ name:f.name, kind:f.kind, text:f.text, thumb:f.thumb }));
  const imgs = sent.filter(f => f.kind === 'img').flatMap(f => f.dataUrls || [f.dataUrl]);
  if (imgs.length) Object.defineProperty(msg, '_imgs', { value:imgs, enumerable:false, writable:true });
  if (text && wantsDeck(text)) msg.deck = true;
  chat.push(msg); touchThread(); save();
  if (text && needsWeb(text)){ renderMsgs(); await webPrep(msg, text); save(); }
  let okSent = true;
  await runSolo(err => { okSent = false; chat.pop(); save(); renderMsgs(); showErr(err); inp.value = text; files.push(...sent); autoGrow(); updateHint(); renderTray(); }, oneModel ? { model:oneModel } : {});
  if (okSent && text && MEM_RX.test(text)) memOffer(text);
}

/* v3.8 · «mirar por ti»: una IA que ve describe las fotos (y lee su texto) para que la IA elegida, que no ve, entienda igual */
const SEE_PROMPT = 'Describe estas imágenes para alguien que no puede verlas, con todo el detalle útil: copia EXACTO todo el texto que aparezca (letreros, documentos, capturas de pantalla, código, tablas con sus números), y describe personas, objetos, colores, gráficos y lo que esté pasando. Si son páginas de un documento, transcríbelas completas. No respondas la pregunta: solo describe. Escribe en el idioma de esta pregunta: ';
async function seeForMe(list, v, text){
  const todo = list.filter(f => f.kind === 'img' && !f.seen);
  if (!todo.length) return true;
  const wait = setTimeout(() => toast(v.name + ' está mirando tu foto para que ' + info(selId()).name + ' la entienda…'), 600);
  sendBtn.disabled = true; todo.forEach(f => { f.state = 'load'; f.prog = SZ.lang() === 'en' ? 'Looking…' : 'Mirando…'; }); renderTray();
  try{
    for (const f of todo){
      const pics = (f.dataUrls || [f.dataUrl]).filter(Boolean).slice(0, 4), ctl = new AbortController(); ctls.add(ctl);
      let r;
      try{ r = await SZ.askStream(OR, [{ role:'user', content:[{ type:'text', text:SEE_PROMPT + '«' + (text || 'qué hay en la imagen') + '»' }, ...pics.map(u => ({ type:'image_url', image_url:{ url:u } }))] }], { model:v.id, maxTokens:1200, signal:ctl.signal }, () => {}); }finally{ ctls.delete(ctl); }
      if (!r || r.aborted || !String(r.text || '').trim()) return false;
      addUsage(r.prov || SZ.provOf(v.id), r.prompt, r.completion, true, { est:r.est, free:/:free$/.test(v.id) || r.prov === 'synthz', rid:r.rid });
      f.text = (f.text ? f.text + '\n\n' : '') + '[' + (f.scan ? 'PDF escaneado' : f.frames ? 'Fotos del video' : 'Foto') + ' «' + f.name + '», descrita por ' + v.name + ' porque esta IA no ve imágenes]\n' + String(r.text).trim();
      f.seen = true;
    }
    return true;
  }catch(e){ console.warn('[ver foto]', e); return false; }
  finally{ clearTimeout(wait); sendBtn.disabled = false; todo.forEach(f => { f.state = 'ok'; delete f.prog; }); renderTray(); }
}
/* v3.4 · la mejor IA conectada que ve fotos: primero la Automática de SymphorIA (elige sola una que ve), luego cualquiera de la lista */
function visionPick(){
  if (szOn()) return info('sz:auto');
  return cat.list.find(m => m.vision && connected(m.id) && !SZ.isBad(m.id)) || null;
}
/* ---------- v1.3 · SynthonIA te rescata cuando una IA falla o cuando notas que no te entiende ---------- */
const TOPIC_RX = [['codigo', /c[oó]digo|program|funci[oó]n|javascript|python|html|css|sql|bug|error de|script|coding|code\b|website|app\b/i], ['mate', /ecuaci|matem|calcul|derivad|integral|math|equation|algebra|\d+\s*[x×*+\/-]\s*\d+/i], ['estudiar', /explica|estudi|examen|tarea|aprend|resum|homework|study|exam|learn|explain|summar/i], ['correo', /correo|email|e-mail/i], ['marketing', /marketing|publicidad|anuncio|vender|ventas|campa[ñn]a|advert|\bads?\b|sell|sales/i], ['redes', /instagram|tiktok|reel|post|redes|social media/i], ['idiomas', /traduc|ingl[eé]s|franc[eé]s|idioma|translat|english|spanish|french|language/i], ['negocios', /negocio|emprend|empresa|cliente|business|startup|company|customer/i], ['ideas', /idea|nombre para|lluvia de/i], ['escribir', /escrib|texto|carta|historia|poema|redact|writ|essay|letter|story|poem/i]];
function guessTopic(t){ const f = TOPIC_RX.find(([k, rx]) => TOPIC[k] && rx.test(t)); return f ? f[0] : null; }
function altFor(mid, text){
  const tk = guessTopic(text || '');
  const ok = m => m && m.id !== mid && connected(m.id) && !SZ.isBad(m.id);
  const alt = (tk ? recommendTop(tk, 12) : []).find(ok) || (mid !== APODEX && szOn() ? info(APODEX) : null) || [bestUsable(true), bestUsable(false)].find(ok);
  return { tk, alt };
}
async function rescue(mid, err){
  try{ SZ.BOT.problem && SZ.BOT.problem('error'); }catch(e){}
  if (!SZ.BOT || !SZ.BOT.offer || (err && err.aborted) || G) return;
  const q = [...chatArr()].reverse().find(m => m.role === 'user'); if (!q || typeof q.content !== 'string') return;
  const { tk, alt } = altFor(mid, q.content); if (!alt) return;
  let ready = q.content;
  if (szOn()) try{ ready = (await agentPlan(q.content)).pedido; }catch(e){}
  SZ.BOT.offer(info(mid).name + ' falló 😕 ' + (tk ? 'Querías ayuda con ' + TOPIC[tk].l.toLowerCase() + ', y ' : '') + alt.name + ' es parecida y está funcionando ahora. Aquí te dejo tu prompt listo (lo mejoré un poquito). Perdona las interrupciones en tu Flow.', 'disculpa', 'Ir con ' + alt.name, () => { pickModel(alt.id, null); inp.value = ready; autoGrow(); updateHint(); inp.focus(); });
}
/* frustración: palabras de enojo o pedir «Otra vez» seguido → «esa IA no tiene el flow» */
const FRUST = /no sirve|no entiendes|no entendiste|mal(a|isima)? respuesta|est[uú]pid|in[uú]til|que mal|otra vez no|no es eso|te equivocas|equivocad|horrible|p[eé]sim|ya te dije|😡|🤬|😤/i;
let frustN = 0, frustAt = 0;
function frustration(text, regen){
  if (G || mode !== 'solo') return;
  const angry = regen || FRUST.test(text || '') || /!{3,}/.test(text || '') || (text && text.length > 12 && text === text.toUpperCase() && /[A-ZÁÉÍÓÚ]{6}/.test(text));
  if (!angry) return;
  frustN = Date.now() - frustAt < 300000 ? frustN + 1 : 1; frustAt = Date.now();
  if (frustN < (regen ? 2 : 1)) return;
  frustN = 0; try{ SZ.BOT.problem && SZ.BOT.problem('frust'); }catch(e){}
  const mid = selId(), q = [...chatArr()].reverse().find(m => m.role === 'user');
  const { alt } = altFor(mid, (q && typeof q.content === 'string' ? q.content : '') + ' ' + (text || '')); if (!alt) return;
  SZ.BOT.offer('Mmm… parece que ' + info(mid).name + ' no tiene el flow para esto. ' + alt.name + ' tiene más flow 😎 ¿Probamos con ella?', 'guino', 'Cambiar a ' + alt.name, () => { pickModel(alt.id, null); toast('Ahora hablas con ' + alt.name + '. Vuelve a enviar tu mensaje o escribe uno nuevo.'); inp.focus(); });
}
async function runSolo(onFail, o = {}){
  const mid = o.model || selId(), chat = chatArr(), g = gen, vis = info(mid).vision, saver = st().sx.saver;
  const slowT = setTimeout(() => { if (busy[mid] === 'think' && SZ.BOT.react) SZ.BOT.react('slow', { auto:mid === 'sz:auto' }); }, 14000);
  /* v3.8 · la IA decide sola si busca en internet (si ya buscó para este mensaje, no se repite) */
  const lastU = [...chat].reverse().find(x => x.role === 'user'), webAuto = !o.noWeb && mode === 'solo' && SZ.CFG.autoWeb !== false && !!lastU && !lastU.sources && !lastU.webTried && !lastU.imgId;
  const sent = apiMsgs(chat, vis, { webAsk:webAuto }), naive = apiMsgs(chat, vis, { naive:true }), ck = hashStr(mid + '|' + saver + '|' + effKey() + '|' + JSON.stringify(sent));
  let hold = webAuto ? null : false, webQ = null;
  const holdWeb = txt => { if (hold === false) return false; if (webMaybe(txt)){ hold = true; return true; } hold = false; return false; };
  const canCache = !sent.some(m => Array.isArray(m.content));
  if (works[mid]) works[mid].stop();
  works[mid] = SZ.workView({ model:info(mid).name, inTok:msgCost(sent) });
  const W = works[mid];
  busy[mid] = 'think'; renderMsgs(); renderNow();
  let el = null, rv = null;
  /* v3.3 · la respuesta se ve mientras sigas en ESA conversación (en SuperiorSynth la IA elegida puede cambiar en la lista mientras escribe) */
  const here = () => g === gen && mode === 'solo' && st().chats[ckey()] === chat;
  const mount = () => {
    if (el || !here()) return;
    busy[mid] = 'write'; renderNow();
    const t = $('.think-wrap', lane); if (t) t.remove();
    const e = $('.empty', lane); if (e) e.remove();
    $$('.m.last', lane).forEach(x => x.classList.remove('last'));
    el = botEl(mid); el.classList.add('writing'); el.insertBefore(W.el, $('.body', el)); lane.appendChild(el); stick = true; live = { el, chat };
    const body = $('.body', el), tk = $('.tk', el);
    rv = SZ.mkReveal(body, (s, n) => { tk.textContent = fmt(Math.ceil(s / 5.5)); el.style.setProperty('--p', n ? (s / n).toFixed(3) : 0); follow(); });
  };
  try{
    let r = !o.fresh && canCache ? cacheGet(ck) : null;
    if (r){ r = Object.assign({}, r, { ms:0, cached:true }); st().sx.saved += r.prompt + r.completion; st().sx.hits += 1; save(); mount(); if (rv) rv.push(r.text); }
    else {
      const ctl = new AbortController(); ctls.add(ctl);
      try{ r = await SZ.askStream(OR, sent, Object.assign({ model:mid, maxTokens: saver ? 700 : 0, signal:ctl.signal, onReason:t => W.reason(t) }, effortOpts(saver)), txt => { if (holdWeb(txt)) return; mount(); W.write(txt); if (rv) rv.push(txt); }); }finally{ ctls.delete(ctl); }
      addUsage(r.prov || SZ.provOf(mid), r.prompt, r.completion, true, { est:r.est, free:/:free$/.test(mid) || r.prov === 'synthz', rid:r.rid });
      if (webAuto && !r.aborted){ const mq = WEB_Q_RX.exec(r.text || ''); webQ = mq ? mq[1].trim() : (String(r.text || '').length < 2500 && CUTOFF_RX.test(r.text || '') ? String(lastU.content || '').slice(0, 300) : null); }
      if (!r.aborted && !r.swapped) SZ.markGood(mid);
      SZ.TEL.msgs++; SZ.TEL.ai = (r.prov || SZ.provOf(mid)).slice(0, 12);
      st().sx.saved += Math.max(0, msgCost(naive) - msgCost(sent)); save();
      if (canCache && !r.aborted && !webQ) cachePut(ck, r);
      /* si la IA se quedó sin espacio (o se cortó la conexión), sigue sola donde quedó: la persona recibe la respuesta completa sin tocar «Continuar» */
      for (let n = 0; n < 3 && !webQ && !r.aborted && !r.swapped && g === gen && (r.finish === 'length' || r.cut); n++){
        const base = r.text, ctl2 = new AbortController(); ctls.add(ctl2);
        const glue = t => (!base || /\s$/.test(base) || /^[\s.,;:!?)\]]/.test(t) || !/[.!?:;)\]*_`]$/.test(base)) ? '' : ' ';
        let r2 = null;
        try{
          r2 = await SZ.askStream(OR, [...sent, { role:'assistant', content:base }, { role:'user', content:'Continúa exactamente donde te quedaste: sigue desde la última palabra, sin repetir nada de lo anterior, sin saludar y sin decir que continúas. Escribe solo lo que falta.' }],
            Object.assign({ model:mid, maxTokens:0, signal:ctl2.signal, onReason:t => W.reason(t) }, effortOpts(saver)), txt => { mount(); const full = base + glue(txt) + txt; W.write(full); if (rv) rv.push(full); });
        }catch(e){ r2 = null; }
        finally{ ctls.delete(ctl2); }
        if (!r2 || r2.aborted && !r2.text) break;
        addUsage(r2.prov || SZ.provOf(mid), r2.prompt, r2.completion, true, { est:r2.est, free:/:free$/.test(mid) || r2.prov === 'synthz', rid:r2.rid });
        if (/^\(La IA devolvió una respuesta vacía\.\)$/.test(r2.text)) break;
        r = Object.assign({}, r, { text:base + glue(r2.text) + r2.text, prompt:r.prompt + r2.prompt, completion:r.completion + r2.completion, ms:r.ms + r2.ms, finish:r2.finish, cut:r2.cut, aborted:r2.aborted, est:r.est || r2.est });
      }
    }
    if (g !== gen){ if (rv) rv.skip(); return; }
    /* v3.8 · la IA pidió buscar (o dijo que no tiene internet): se busca, se leen las páginas y se le vuelve a preguntar, ya con los datos */
    if (webQ){
      const rv0 = rv; rv = null; W.stop && W.stop(); if (live && live.chat === chat) live = null; if (el) el.remove(); { const t = $('.think-wrap', lane); if (t) t.remove(); } try{ rv0 && rv0.skip(); }catch(e){} if (el) el.remove();
      lastU.webTried = true; delete busy[mid]; renderNow();
      await webPrep(lastU, webQ); save();
      if (g !== gen) return;
      return await runSolo(onFail, Object.assign({}, o, { noWeb:true, fresh:true }));
    }
    const tail = r.aborted ? ' · detenido' : r.cut ? ' · se cortó la conexión' : r.finish === 'length' ? ' · se cortó porque era muy larga (toca «Continuar»)' : '';
    const who = r.swapped ? ' · se acabó tu saldo de Puter este mes; respondió ' + (r.real || 'otra IA') : '';
    W.write(r.text); W.finish({ ms:r.ms, real:r.real || '' });
    const work = { ms:Math.round(r.ms || 0), words:W.state.words, real:r.real || '', steps:W.state.steps.map(([a, b]) => [Math.round(a), b]), reason:(r.reasoning || '').slice(0, 4000) || undefined };
    const msg = { role:'assistant', content:r.text, work, meta:metaOf(r) + SZ.coinNote(mid, r) + tail + who + (r.via ? ' · vía ' + r.via + ' (prueba de SymphorIA)' : ''), model:mid, cont: !!(r.cut || r.finish === 'length') || undefined };
    chat.push(msg); touchThread(); save();
    if (here()){
      if (el && !el.isConnected){ lane.appendChild(el); }   /* algo repintó la conversación mientras escribía: la respuesta vuelve a su sitio */
      mount(); rv.push(r.text);
      await rv.end();
      el.classList.remove('writing'); el.style.removeProperty('--p'); el._raw = r.text; el._ck = ckey(); el._ci = chat.length - 1; el.dataset.ci = el._ci;
      $('.body', el).innerHTML = md(r.text);
      { const u = [...chat].reverse().find(x => x.role === 'user'); el._sources = u && u.sources && u.sources.length ? u.sources : null; }
      finishBot(el, msg.meta, true, msg.cont); follow();
      qualityAfter(el, chat, msg, mid, r);   /* v3.4 · otra IA revisa la lógica y, si hace falta, la corrige */
      if (!r.aborted) synAuto(el);
      if (!r.aborted) codeAfter(el, chat);   /* v2.4 · la página se prueba sola y, si tiene errores, la IA la arregla */
      if (SZ.BOT.react && !r.aborted && !G) SZ.BOT.react('done', { cool:180000 });
    }
  }catch(err){
    if (rv) rv.skip();
    if (g === gen && !(err && err.aborted) && !o.noRescue) setTimeout(() => rescue(mid, err), 900);
    W.finish({ error:!(err && err.aborted), aborted:err && err.aborted });
    if (el) el.remove();
    if (err && err.gone) hideBadModel(mid, err);
    if (g === gen && onFail) onFail(err);
  }finally{ clearTimeout(slowT); if (live && live.chat === chat) live = null; if (g === gen){ delete busy[mid]; renderNow(); if (!el){ const t = $('.think-wrap', lane); if (t) t.remove(); } } }
}
/* una IA que falló por culpa del modelo (ya no existe o no tiene servidores) se esconde y se cambia por otra que sí funcione */
function hideBadModel(id, err){
  SZ.markBad(id);
  const name = info(id).name;
  setCatalog(cat.list.filter(m => m.id !== id), cat.t, cat.status);
  if (st().pinned === id) delete st().pinned;
  if (st().cmp.includes(id)) st().cmp = st().cmp.filter(x => x !== id);
  save();
  const b = bestUsable(true) || bestUsable(false);
  if (b && b.id !== id && selId() === id){ pickModel(b.id, null); if (err) err.message = name + ' no está funcionando ahora mismo, así que la escondí de la lista. Te cambié a ' + b.name + ': vuelve a enviar tu mensaje.'; }
  else if (err) err.message = name + ' no está funcionando ahora mismo, así que la escondí de la lista. Elige otra IA y vuelve a enviar.';
  renderList({ keep:true });
}
SZ.badReady.then(set => { if (!set.size || !cat.list.length) return; const before = cat.list.length; setCatalog(cat.list.filter(m => !SZ.isBad(m.id)), cat.t, cat.status); if (cat.list.length !== before){ renderList({ keep:true }); fixModel(true); } });
async function regen(){
  const chat = chatArr();
  try{ frustration('', true); }catch(e){}
  if (mode !== 'solo' || Object.keys(busy).length || !chat.length || chat[chat.length - 1].role !== 'assistant') return;
  /* si la respuesta era favorita, se queda: la nueva llega debajo (tu pregunta se repite) */
  if (chat[chat.length - 1].star){
    const q = [...chat].reverse().find(m => m.role === 'user'); if (!q) return;
    const again = { role:'user', content:q.content, again:true }; if (q.files) again.files = q.files;
    chat.push(again); touchThread(); save(); renderMsgs(); toast('Tu favorita se queda guardada ★ Te traigo otra respuesta debajo.');
    await runSolo(err => { const i = chat.lastIndexOf(again); if (i > -1) chat.splice(i, 1); save(); renderMsgs(); showErr(err, { regen:true }); }, { fresh:true });
    return;
  }
  const last = chat.pop(); save();
  await runSolo(err => { chat.push(last); save(); renderMsgs(); showErr(err, { regen:true }); }, { fresh:true });
}

