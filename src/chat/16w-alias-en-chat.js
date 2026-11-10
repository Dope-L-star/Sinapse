/* ---------- 2026-11-10 · Quoryn (antes A.L.I.A.S.) vive DENTRO de SynthFlow: ya no tiene página propia ----------
   Sammuel (9 nov): «ALIAS ya no tiene UI: elimina esa página» y «que no te responda un simple hola ni algo muy fácil: que te mande a la
   automática o a SuperiorSynth… PERO CON SENTIDO: si en el mismo mensaje te pide algo, ahí NO te manda a otra IA».
   Con el modo «Agente» puesto (solo equipo, SZ.aliasOk()):
     · lo que escribes pasa primero por el enrutado del servidor (api/_triage.js): si es de verdad fácil («hola», «gracias», una preguntita)
       lo responde Relay (la IA Automática) o Apex (SuperiorSynth) y debajo queda «Quoryn vio que era fácil… [Hacerlo con Quoryn]»;
     · si es un pedido de verdad (aunque empiece con «hola») Quoryn arma el plan en una tarjeta dentro del chat;
     · lo apruebas UNA vez y trabaja solo (voy a continuar con…); si un paso falla lo reintenta solo con otra IA;
     · lo que escribas mientras trabaja se suma encima sin pararlo (action 'ajustar'); Detener entrega lo que alcanzó a hacer;
     · el resultado queda como un mensaje más del chat (texto, archivos y fuentes) y la conversación sigue normal.
   El motor (plan, paso, ajustar) es window.ALIAS (16p–16u). Quoryn NO tiene interfaz propia (2026-11-10, «alias ya no debe tener su propio UI»): usa solo lo normal del chat
   (la tarjeta de agente .agrun con su ícono de píxeles, los botones .btn, la nota .agkeep y los mensajes del chat); aquí solo se marcan con data-quoryn para poder encontrarlos. */
var AL = null, alPass = null, alDict = null;           /* var: renderMsgs los mira antes de que esta pieza corra */
/* function y var (no const): renderMsgs puede pintar un chat guardado antes de que esta pieza termine de correr */
function alEn(){ return !!(SZ.lang && SZ.lang() === 'en'); }
function alOn(){ return !!st().alias && !!(SZ.aliasOk && SZ.aliasOk()) && !trialOn; }
var AL_TOTAL = 9;
/* solo una marca para saber si el modo está puesto (sin estilos): body[data-quoryn="on"] */
function alMark(){ if (alOn()) document.body.dataset.quoryn = 'on'; else delete document.body.dataset.quoryn; }
var AT = {
  es: { ph:'Quoryn: dime la meta y armo el plan…', activado:'Modo Quoryn: dime la meta; si es un pedido de verdad armo el plan y trabajo solo.', apagado:'Modo Quoryn apagado.',
    planListo:'Plan listo: revísalo y apruébalo una sola vez', empiezo:'Voy a empezar con:', sigo:'Voy a continuar con:', reint:'Este paso falló; lo intento otra vez con otra IA…',
    ajustando:'Ajustando el plan con lo que pediste…', fallo:'Este paso no salió ni en el segundo intento.', limite:'Hoy se acabaron tus misiones. Vuelven mañana.',
    go:'Aprobar y empezar', no:'Descartar', stop:'Detener', retry:'Reintentar', skip:'Saltar este paso',
    ayudaPlan:'¿Quieres cambiar algo del plan? Escríbelo en la caja de abajo.', ayudaRun:'Puedes escribirme algo y lo sumo sin pararme.',
    tu:'Tú', pista:'(Inténtalo de otra forma.)', notaErr:'No pude rehacer el plan, pero lo tendré en cuenta en lo que falta.', notaOk:'Anotado. Lo tendré en cuenta en lo que falta.',
    esperaPlan:'Estoy armando el plan: espera un momento.', otroChat:'Quoryn está trabajando en otro chat. Termina o detenlo allá.', adjuntos:'Quoryn todavía no lee adjuntos: esta vez te responde la IA de siempre.',
    detenida:'Misión detenida.', descartada:'Plan descartado.', red:'No hubo conexión. Revisa tu red e inténtalo de nuevo.', mision:'misión de {n} pasos', fuentes:'Fuentes', parcial:'_Detuve la misión: esto es lo que alcancé a hacer._', vacio:'No alcancé a terminar nada. Puedes pedirme otra vez.',
    handRelay:'Quoryn vio que era algo fácil y te respondió Relay.', handApex:'Quoryn vio que era algo sencillo y te respondió Apex.', hacerlo:'Hacerlo con Quoryn',
    tool:{ search:'Buscar', file:'Archivo', memory:'Memoria', image:'Imagen', think:'Pensar' }, con:'con {n}' },
  en: { ph:'Quoryn: tell me the goal and I will make a plan…', activado:'Quoryn mode: tell me the goal; if it is a real task I make the plan and work on my own.', apagado:'Quoryn mode is off.',
    planListo:'Plan ready: look it over and approve it once', empiezo:'I am going to start with:', sigo:'I am going to continue with:', reint:'This step failed; trying again with another AI…',
    ajustando:'Adjusting the plan with what you asked…', fallo:'This step did not work, not even on the second try.', limite:'You used all of today\'s missions. They come back tomorrow.',
    go:'Approve and start', no:'Discard', stop:'Stop', retry:'Try again', skip:'Skip this step',
    ayudaPlan:'Want to change something in the plan? Write it in the box below.', ayudaRun:'You can write to me and I will add it without stopping.',
    tu:'You', pista:'(Try a different approach.)', notaErr:'I could not redo the plan, but I will keep it in mind for what is left.', notaOk:'Noted. I will keep it in mind for what is left.',
    esperaPlan:'I am making the plan: wait a moment.', otroChat:'Quoryn is working in another chat. Finish or stop it there.', adjuntos:'Quoryn does not read attachments yet: this time the usual AI answers.',
    detenida:'Mission stopped.', descartada:'Plan discarded.', red:'Couldn\'t connect. Check your network and try again.', mision:'{n}-step mission', fuentes:'Sources', parcial:'_I stopped the mission: this is what I got done._', vacio:'I did not finish anything. You can ask me again.',
    handRelay:'Quoryn saw it was easy and Relay answered.', handApex:'Quoryn saw it was simple and Apex answered.', hacerlo:'Do it with Quoryn',
    tool:{ search:'Search', file:'File', memory:'Memory', image:'Image', think:'Think' }, con:'with {n}' }
};
function alT(k, v){
  const L = AT[alEn() ? 'en' : 'es']; let s = L[k]; if (s == null) s = AT.es[k]; if (s == null) s = k;
  return typeof s === 'string' && v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] == null ? m : v[x]) : s;
}
/* el motor busca sus textos en alias-textos.json (los mismos del servidor); se baja la primera vez que se usa */
function alLoadDict(){
  if (alDict) return alDict;
  alDict = fetch('alias-textos.json', { cache:'no-cache' }).then(r => r.ok ? r.json() : {}).catch(() => ({})).then(d => { alDict = Promise.resolve(d); window.ALIAS && (window.ALIAS.dict = d); return d; });
  return alDict;
}
function alEngine(){
  const A = window.ALIAS; if (!A) return null;
  if (!A.chatReady){
    A.chatReady = true;
    A.t = k => { const d = A.dict || {}, l = alEn() ? 'en' : 'es'; return (d[l] && d[l][k]) || (d.es && d.es[k]) || k; };
    A.lang = () => alEn() ? 'en' : 'es';
    const D = window.ALIAS_DEPS; if (D) D.lang = () => alEn() ? 'en' : 'es';
    alLoadDict();
  }
  return A;
}

/* ---------- el modo «Agente» ---------- */
function setAlias(on){
  on = !!on;
  if (!!st().alias === on) return;
  if (on){ if (agentOn()) setAgent(false); if (imgMode) setImgMode(false); if (mode !== 'solo') setMode('solo'); alEngine(); }
  st().alias = on; save();
  alMark();
  try{ inp.placeholder = on ? alT('ph') : 'Escribe tu mensaje…'; }catch(e){}
  toast(alT(on ? 'activado' : 'apagado'));
  if (on) setTimeout(() => { try{ inp.focus(); }catch(e){} }, 50);
  else alDrop(false);
}
alMark();
/* desde la portada (modo Agente) y desde los enlaces viejos de /alias: ?quoryn=1 (o ?alias=1) deja puesto el modo, y ?q= lo manda.
   Si la llave del equipo (synthz:alias) todavía no se conoce en este aparato, se espera a que el servidor la confirme. */
var alQuiere = params.get('quoryn') === '1' || params.get('alias') === '1';
function alQuiero(){ if (!alQuiere || !(SZ.aliasOk && SZ.aliasOk()) || trialOn) return; alQuiere = false; try{ setAlias(true); }catch(e){} }
addEventListener('synthz-alias', () => { alMark(); setTimeout(alQuiero, 0); });
setTimeout(alQuiero, 0);

/* ---------- lo que escribes en modo Agente ---------- */
async function aliasSend(text){
  const A = alEngine(); if (!A){ toast(alT('red')); return; }
  const here = chatArr();
  if (AL){
    if (AL.chat !== here){ toast(alT('otroChat')); return; }
    if (AL.phase === 'planning'){ toast(alT('esperaPlan')); return; }
    inp.value = ''; autoGrow(); updateHint();
    return alSteer(AL, text);
  }
  /* «hi», «ok», «sí»: no hace falta ni preguntarle al servidor */
  if (text.length < 3){ alPass = { to:'auto', kind:'saludo', t:Date.now() }; try{ await send(); }finally{ alPass = null; } return; }
  return alMission(text, {});
}
async function alMission(text, o){
  const A = alEngine(); if (!A) return;
  if (AL) alDrop(false);
  const chat = chatArr(); let msg = null;
  if (o.push !== false){
    msg = { role:'user', content:text }; chat.push(msg);
    inp.value = ''; autoGrow(); updateHint(); touchThread(); save(); renderMsgs();
  }
  const S = AL = { goal:text, chat, msg, phase:'planning', plan:null, status:{}, results:{}, errors:{}, skipped:{}, retried:{}, notes:[], log:[], run:0, t0:0, adjusting:null, cur:null, retrying:null, say:'' };
  S.el = document.createElement('div'); S.el.className = 'agrun'; S.el.dataset.quoryn = 'card'; S.el.setAttribute('aria-live', 'polite');
  const fr = () => { try{ return (window.SZFrases && window.SZFrases.frase('agente', alEn() ? 'en' : 'es')) || ''; }catch(e){ return ''; } };
  S.say = fr(); S.tm = setInterval(() => { if (AL !== S || S.phase !== 'planning'){ clearInterval(S.tm); return; } S.say = fr(); const sm = $('.ag-t small', S.el); if (sm) sm.textContent = S.say + '…'; }, 2800);
  if (chat === chatArr()) lane.appendChild(S.el);
  alPaint(S); jump();
  let r; try{ r = await A.plan(text, { force:!!o.force }); }catch(e){ r = { ok:false, error:alT('red') }; }
  clearInterval(S.tm);
  if (AL !== S) return;
  /* ¿era de verdad fácil? el servidor lo dijo: lo responde Relay o Apex, sin plan */
  if (r && r.ok && r.simple){ return alHandoff(S, r, text); }
  if (!r || !r.ok){
    alClear(S);
    if (msg && chat[chat.length - 1] === msg){ chat.pop(); save(); }
    if (chat === chatArr()){ renderMsgs(); if (msg){ inp.value = text; autoGrow(); updateHint(); } showErr({ message:(r && r.error) || alT('red'), limit:!!(r && r.limit) }); }
    return;
  }
  try{ localStorage.setItem('synthz:sent', String(sentN() + 1)); }catch(e){}
  const steps = (r.plan.steps || []).filter(s => s && s.id != null).map(alClean);
  S.plan = Object.assign({}, r.plan, { steps }); S.phase = 'plan'; alPaint(S); if (chat === chatArr()) follow();
}
const alClean = s => ({ id:s.id, title:String(s.title || ''), tool:s.tool, input:s.input });
/* lo fácil: se saca la pregunta del chat y se manda por el camino de siempre, pero con Relay (Automática) o Apex (SuperiorSynth) */
function alHandoff(S, r, text){
  const chat = S.chat;
  if (S.msg && chat[chat.length - 1] === S.msg){ chat.pop(); save(); }
  alClear(S);
  if (chat !== chatArr()) return;
  inp.value = text; autoGrow(); updateHint();
  alPass = { to:r.to === 'superior' ? 'superior' : 'auto', kind:r.kind, t:Date.now() };
  renderMsgs();
  Promise.resolve(send()).finally(() => { alPass = null; });
}
/* el chip que queda debajo de lo que escribiste: qué IA lo respondió y cómo hacerlo con Quoryn igual */
function alHandEl(m){
  const el = document.createElement('div'); el.className = 'agkeep'; el.dataset.quoryn = 'hand'; el._q = m.content;
  el.innerHTML = '<span></span><div class="agk-b"><button type="button" class="btn sm ghost" data-alforce="1"></button></div>';
  $('span', el).textContent = alT(m.alHand === 'superior' ? 'handApex' : 'handRelay'); $('button', el).textContent = alT('hacerlo');
  return el;
}
function alWho(b, m){
  const n = $('.who b', b), md = $('.who .md', b); if (n) n.textContent = 'Quoryn'; if (md) md.textContent = alT('mision', { n:(m.alias && m.alias.n) || '' });
  b.dataset.quoryn = 'msg';
}
const alPlace = () => { try{ if (alOn()) inp.placeholder = alT('ph'); }catch(e){} };
function alClear(S){ clearInterval(S.tm); S.run++; if (S.el) S.el.remove(); if (AL === S) AL = null; alPlace(); }
function alDrop(restore){
  const S = AL; if (!S) return; const chat = S.chat;
  alClear(S);
  if (restore && S.msg && chat[chat.length - 1] === S.msg){ chat.pop(); save(); if (chat === chatArr()){ renderMsgs(); inp.value = S.goal; autoGrow(); updateHint(); } }
}

/* ---------- la tarjeta ---------- */
const alFin = (S, id) => S.status[id] === 'done' || !!S.skipped[id];
function alPaint(S){
  const el = S.el; if (!el) return;
  const steps = S.plan ? S.plan.steps : [], done = steps.filter(s => alFin(S, s.id)).length, total = steps.length, p = S.phase;
  const cur = steps.find(s => !alFin(S, s.id)), n = cur ? steps.indexOf(cur) + 1 : total;
  let say = '';
  if (p === 'planning') say = (S.say || '') + '…';
  else if (p === 'plan') say = alT('planListo');
  else if (p === 'run') say = S.retrying != null ? alT('reint') : S.adjusting ? alT('ajustando') : cur ? alT(done ? 'sigo' : 'empiezo') + ' ' + cur.title : '';
  else if (p === 'error') say = alT('fallo');
  else if (p === 'limit') say = alT('limite');
  /* misma tarjeta que Apex: ícono de píxeles, título, lista de pasos y botones normales */
  let h = '<div class="ag-h"><span class="pxw" aria-hidden="true">' + SZ.pixelGrid() + '</span><span class="ag-t"><b>Quoryn</b><small>' + esc(say) + '</small></span></div>';
  if (steps.length){
    h += '<ol class="ag-s">' + steps.map(s => {
      const r = S.results[s.id], cls = S.skipped[s.id] ? 'done skip' : S.status[s.id] === 'done' ? 'done' : S.status[s.id] === 'running' ? 'on' : S.status[s.id] === 'error' ? 'bad' : '';
      const who = r && r.route ? (r.route.why === 'synth' && r.route.voices && r.route.voices.length ? r.route.voices.join(', ') : r.route.name) : '';
      return '<li class="' + cls + '"><i aria-hidden="true"></i><span>' + esc(s.title) + ' <small>· ' + esc(alT('tool')[s.tool] || s.tool) + (who ? ' · ' + esc(alT('con', { n:who })) : '') + '</small></span></li>';
    }).join('') + '</ol>';
  }
  if (S.log.length) h += '<div data-quoryn="log">' + S.log.slice(-4).map(x => '<p>' + (x.k === 'me' ? '<b>' + esc(alT('tu')) + ':</b> ' : '') + esc(x.text) + '</p>').join('') + '</div>';
  const btn = (a, k, ghost) => '<button type="button" class="btn sm' + (ghost ? ' ghost' : '') + '" data-al="' + a + '">' + esc(alT(k)) + '</button>';
  if (p === 'plan') h += '<div class="agk-b">' + btn('go', 'go') + btn('no', 'no', 1) + '</div><small>' + esc(alT('ayudaPlan')) + '</small>';
  else if (p === 'error') h += '<div class="agk-b">' + btn('retry', 'retry') + btn('skip', 'skip', 1) + btn('stop', 'stop', 1) + '</div>' + (S.errors[S.cur] ? '<small>' + esc(S.errors[S.cur]) + '</small>' : '');
  else if (p === 'limit') h += '<div class="agk-b">' + btn('stop', 'stop', 1) + '</div>';
  else if (p === 'run') h += '<div class="agk-b">' + btn('stop', 'stop', 1) + '</div><small>' + esc(alT('ayudaRun')) + '</small>';
  el.innerHTML = h; el.dataset.phase = p;
  try{ inp.placeholder = p === 'run' || p === 'plan' ? (p === 'run' ? alT('ayudaRun') : alT('ayudaPlan')) : alT('ph'); }catch(e){}
  if (S.chat === chatArr()) follow();
}
lane.addEventListener('click', ev => {
  const f = ev.target.closest('[data-alforce]');
  if (f){ const c = f.closest('[data-quoryn="hand"]'); if (c && c._q && !AL) alMission(c._q, { force:true, push:false }); return; }
  const b = ev.target.closest('[data-al]'); if (!b || !AL || !AL.el || !AL.el.contains(b)) return;
  const S = AL, a = b.dataset.al;
  if (a === 'go'){ if (S.phase === 'plan' && S.plan && S.plan.steps.length){ S.t0 = Date.now(); alDrive(S, false); } }
  else if (a === 'no'){ alDrop(true); toast(alT('descartada')); }
  else if (a === 'stop'){ alStop(S); }
  else if (a === 'retry'){ const st = S.plan.steps.find(s => S.status[s.id] === 'error'); if (st){ delete S.status[st.id]; delete S.errors[st.id]; } alDrive(S, true); }
  else if (a === 'skip'){ const st = S.plan.steps.find(s => S.status[s.id] === 'error'); if (st){ S.skipped[st.id] = true; delete S.status[st.id]; delete S.errors[st.id]; } alDrive(S, false); }
});

/* ---------- trabajar solo ---------- */
const alPlanOut = (S, hintId) => ({ id:S.plan.id, goal:S.plan.goal, notes:S.notes.slice(-6),
  steps:S.plan.steps.map(s => { const c = alClean(s); if (hintId != null && String(s.id) === String(hintId)) c.input = ((c.input || '') + ' ' + alT('pista')).trim(); return c; }) });
async function alExec(S, st, hint){
  const A = window.ALIAS, i = S.plan.steps.findIndex(s => String(s.id) === String(st.id));
  const prev = S.plan.steps.slice(0, i).map(s => S.results[s.id]).filter(Boolean);
  let r; try{ r = await A.runStep(alPlanOut(S, hint ? st.id : null), st.id, prev, {}); }catch(e){ return { err:alT('red') }; }
  if (!r || !r.ok) return { err:(r && r.error) || alT('red'), limit:!!(r && r.limit) };
  const sp = r.step || {}; if (sp.status === 'error') return { err:sp.error || alT('red') };
  return { step:sp };
}
async function alDrive(S, hint){
  if (S.running) return;
  const my = ++S.run, dead = () => AL !== S || S.run !== my;
  S.running = true; S.phase = 'run'; S.retrying = null; alPaint(S);
  while (!dead()){
    if (S.adjusting){ await S.adjusting; if (dead()) break; }
    const st = S.plan.steps.find(s => !alFin(S, s.id));
    if (!st){ S.running = false; return alFinish(S, false); }
    S.cur = st.id; S.status[st.id] = 'running'; S.retrying = null; delete S.errors[st.id]; alPaint(S);
    const out = await alExec(S, st, hint); hint = false;
    if (dead()) break;
    if (out.limit){ S.status[st.id] = 'pending'; S.phase = 'limit'; S.running = false; alPaint(S); return; }
    if (out.err){
      /* primera vez: lo vuelve a intentar solo (el enrutador cambia de IA); a la segunda, pregunta */
      if (!S.retried[st.id]){ S.retried[st.id] = true; S.retrying = st.id; hint = true; alPaint(S); continue; }
      S.retrying = null; S.status[st.id] = 'error'; S.errors[st.id] = out.err; S.phase = 'error'; S.running = false; alPaint(S); return;
    }
    S.status[st.id] = 'done'; S.results[st.id] = out.step; S.retrying = null; alPaint(S);
  }
  if (AL === S && S.run === my) S.running = false;
}
async function alSteer(S, raw){
  const text = String(raw || '').trim().slice(0, 300); if (!text || !S.plan || S.adjusting) return;
  const A = window.ALIAS;
  S.log.push({ k:'me', text }); S.notes = S.notes.concat(text).slice(-6);
  const fixed = S.plan.steps.filter(s => alFin(S, s.id) || S.status[s.id] === 'running' || S.status[s.id] === 'error').map(s => s.id);
  let r = null;
  S.adjusting = (async () => { try{ r = A && typeof A.adjust === 'function' ? await A.adjust(alPlanOut(S), fixed, text) : null; }catch(e){ r = null; } })();
  alPaint(S);
  await S.adjusting;
  if (AL !== S) return;
  if (r && r.ok && r.changed && Array.isArray(r.steps) && r.steps.length){
    const keep = S.plan.steps.filter(s => fixed.includes(s.id)), room = Math.max(0, AL_TOTAL - keep.length);
    S.plan.steps.filter(s => !fixed.includes(s.id)).forEach(s => { delete S.status[s.id]; delete S.results[s.id]; delete S.errors[s.id]; delete S.skipped[s.id]; });
    S.plan.steps = keep.concat(r.steps.slice(0, room).map(alClean));
  }
  S.adjusting = null;
  S.log.push({ k:'al', text:r && r.ok ? (r.reply || alT('notaOk')) : r && r.limit ? alT('limite') : alT('notaErr') });
  alPaint(S);
}
function alStop(S){
  S.run++; S.running = false; S.adjusting = null;
  S.plan && S.plan.steps.forEach(s => { if (S.status[s.id] === 'running') delete S.status[s.id]; });
  if (!S.plan || !Object.keys(S.results).length){ alDrop(true); toast(alT('detenida')); return; }
  alFinish(S, true);
}

/* ---------- el resultado: un mensaje más del chat ---------- */
const alSafeUrl = u => { try{ const x = new URL(String(u), location.href); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : ''; }catch(e){ return ''; } };
function alFinish(S, stopped){
  const done = S.plan.steps.filter(s => S.results[s.id]);
  const last = done.slice().reverse().find(s => String(S.results[s.id].output || '').trim());
  const seen = new Set(), sources = [], files = [];
  done.forEach(s => {
    const r = S.results[s.id];
    (Array.isArray(r.sources) ? r.sources : []).forEach(x => { const u = x && alSafeUrl(x.url); if (!u || seen.has(u)) return; seen.add(u); sources.push({ url:u, title:String(x.title || u).replace(/[\[\]]/g, '') }); });
    if (r.file && r.file.name && r.file.text != null) files.push(r.file);
  });
  let content = last ? String(S.results[last.id].output).trim() : alT('vacio');
  if (stopped) content = alT('parcial') + '\n\n' + content;
  files.reverse().forEach(f => {
    const ext = (String(f.name).split('.').pop() || 'txt').toLowerCase(), isDeck = /"diapositivas"/.test(String(f.text)) || /\.pptx$/i.test(f.name);
    const body = String(f.text).replace(/```/g, "'''");
    content += '\n\n' + (isDeck ? '' : '**' + String(f.name).replace(/[*`]/g, '') + '**\n\n') + '```' + (isDeck ? 'json' : (/^[a-z0-9]{1,6}$/.test(ext) ? ext : 'txt')) + '\n' + body + '\n```';
  });
  if (sources.length) content += '\n\n**' + alT('fuentes') + '**\n' + sources.map(x => '- [' + x.title + '](' + x.url + ')').join('\n');
  const chat = S.chat, msg = { role:'assistant', content, model:selId(), alias:{ n:S.plan.steps.length, secs:S.t0 ? Math.round((Date.now() - S.t0) / 1000) : 0 } };
  clearInterval(S.tm); S.run++; S.running = false; S.phase = 'done';
  if (S.el) S.el.remove(); if (AL === S) AL = null; alPlace();
  chat.push(msg); save();
  if (chat === chatArr()){ renderMsgs(); jump(); }
}
