/* ---------- conexión: las IAs conectadas (ya activada para todos) y, si quieres más, tu Puter ---------- */
let connEl = null;
function puterOn(){ return !!(window.puter && puter.auth && puter.auth.isSignedIn()); }
function orOn(){ return false; }   /* OpenRouter ya no se muestra a las personas */
function openOrGuide(){ SZ.orGuide(() => { afterConnect('¡OpenRouter desbloqueado!'); paintProv(); renderList({ keep:true }); updateHint(); }); }
function gqOn(){ return false; }
/* las IAs conectadas: activada salvo que el servidor diga que no tiene llaves (mientras carga, se asume que sí) */
function szOn(){ const q = SZ.SZQ; return q.on !== false && !(q.limit > 0 && (q.used || 0) >= q.limit) && !SZ.guestFull(); }
function connected(id){ return /^tr:/.test(String(id)) ? trialOn && trialLeft() > 0 : /^sz:/.test(String(id)) ? szOn() : /^pu:/.test(String(id)) ? puterOn() : /^gq:/.test(String(id)) ? gqOn() : orOn(); }
let szqT = 0; addEventListener('synthz-szq', () => { clearTimeout(szqT); szqT = setTimeout(() => { try{ paintPay(); paintProv(); paintLock(); renderFoot(); if (!Object.keys(busy).length) renderTop(); }catch(e){} }, 120); });
addEventListener('synthz-puter-out', () => { try{ paintPay(); }catch(e){} });
addEventListener('synthz-useputer', () => { try{ switchProv('pu'); }catch(e){} });
const trialLeft = () => { const t = SZ.trialGet(); return t && t.token ? +t.left || 0 : 0; };
/* entrar y salir de la prueba guiada */
async function enterTrial(){
  try{ await SZ.trialStart(); }
  catch(e){ toast(e.status === 429 ? 'Ya hiciste varias pruebas hoy. Para seguir, conecta Puter: es gratis y con un clic.' : e.status === 503 ? 'La prueba todavía no está lista. Conecta Puter: es gratis y con un clic.' : (e.message || 'No pude empezar la prueba.')); return false; }
  trialOn = true; if (mode !== 'solo') setMode && setMode('solo');
  renderTrialBar(); renderTop(true); renderMsgs(); renderNow(); updateHint(); paintSel();
  return true;
}
function exitTrial(quiet){ if (!trialOn) return; trialOn = false; renderTrialBar(); renderTop(true); renderMsgs(); renderNow(); updateHint(); paintSel(); if (!quiet) toast('Saliste de la prueba guiada.'); }
function renderTrialBar(){
  const bar = $('#trialBar'); if (!bar) return;
  paintPay();
  /* lo que queda de la prueba se ve abajo (computador) o junto a la IA (celular); esta barra solo sale al terminarse */
  if (!trialOn || trialLeft() > 0){ bar.hidden = true; return; }
  const max = (SZ.trialGet() || {}).max || 5;
  bar.hidden = false;
  bar.innerHTML = '<span class="tb-ico" aria-hidden="true">✨</span><span><b>Se acabaron tus ' + max + ' mensajes de prueba.</b> Para seguir, conecta Puter: es gratis y con un clic.</span><button type="button" class="btn sm" data-tx="conn">Conectar</button><button type="button" class="lnk" data-tx="exit">Salir</button>';
}
$('#trialBar').addEventListener('click', e => { const b = e.target.closest('[data-tx]'); if (!b) return; if (b.dataset.tx === 'conn'){ exitTrial(true); openConnect(); } else exitTrial(); });
addEventListener('synthz-trial', () => { if (trialOn){ renderTrialBar(); renderNow(); } });
window.SynthFlowTrial = { enter:enterTrial, exit:exitTrial, on:() => trialOn };

/* ---------- bloqueo: solo si las IAs conectadas está apagada y no hay Puter (ni prueba activa) ---------- */
let lockReady = !!(window.__puterOK || window.__puterBlocked), lockWas = null, lockAt = 0;
addEventListener('puter-ready', () => { lockReady = true; paintLock(); });
addEventListener('puter-blocked', () => { lockReady = true; paintLock(); });
setTimeout(() => { lockReady = true; paintLock(); }, 2600);
SZ.accHooks.push(() => { lockWas = null; paintLock(); }); addEventListener('synthz-acc', () => { lockWas = null; paintLock(); });
function isLocked(){ return lockReady && !G && !szOn() && !(trialOn && trialLeft() > 0) && !puterOn() && !orOn() && !gqOn(); }
function paintLock(){
  const L = isLocked(), gst = L && SZ.guestFull(), key = L + ':' + gst;
  if (key === lockWas) return;
  lockWas = key; lockAt = Date.now();
  document.body.classList.toggle('locked', L);
  const c = $('#lockCard'); if (c) c.hidden = !L;
  inp.readOnly = L; inp.setAttribute('aria-disabled', String(L));
  inp.placeholder = L ? (gst ? (isMobile() ? 'Entra para seguir…' : 'Entra a tu cuenta para seguir FlowIAndo…') : isMobile() ? 'Conecta tu Puter…' : 'Conecta tu Puter para escribir…') : 'Escribe tu mensaje…';
  $$('#lockCard [data-lk="acc"],#lockCard [data-lk="in"]').forEach(b => { b.hidden = !gst; });
  $$('#lockCard [data-lk="pu"],#lockCard [data-lk="guide"]').forEach(b => { b.hidden = !!gst; });
  SZ.TEL.locked = L;
  if (L){
    const done = trialOn && trialLeft() <= 0;
    const gm = (SZ.SZQ.guest && SZ.SZQ.guest.max) || 5;
    $('#lockT').textContent = gst ? 'Para seguir FlowIAndo, entra a tu cuenta' : done ? 'Se acabó tu EnerX de prueba' : SZ.SZQ.on === false ? 'Las IAs gratis están descansando' : 'Usaste tu límite gratis de hoy';
    $('#lockS').textContent = gst ? 'Se acabó tu EnerX de prueba de hoy. Crear tu cuenta es gratis, sin correo ni tarjeta, y te da mucho más límite cada día.' : done ? 'Para seguir chateando conecta tu cuenta de Puter (gratis, con un clic).' : 'Vuelve en un momento, o sigue ya con Puter. Conecta tu versión pro de las IAs más usadas.';
    SZ.telEv('noai', 'sin IA: la de SymphorIA está apagada y no hay Puter');
    if (side.classList.contains('open')) closeSide();
  } else { wHide(); }
  try{ renderTop(); }catch(e){}
}
setInterval(paintLock, 1500);
{ paintAgent(); $$('.agentb-x').forEach(ab => { ab.addEventListener('click', () => { st().agent = !agentOn(); save(); paintAgent(); toast(agentOn() ? 'SuperiorSynth encendido: antes de enviar, mejora tu pedido y elige la IA que más sabe de eso.' : 'SuperiorSynth apagado: tu mensaje va tal cual.'); }); }); }
function lockNudge(){
  try{ SZ.BOT.problem && SZ.BOT.problem('lock'); }catch(e){}
  const c = $('#lockCard'); if (!c || c.hidden) return;
  c.classList.remove('nudge'); void c.offsetWidth; c.classList.add('nudge');
  confuse(1.5);
}
$('#lockCard').addEventListener('click', async e => {
  const b = e.target.closest('[data-lk]'); if (!b) return;
  const k = b.dataset.lk;
  if (k === 'acc' || k === 'in'){ SZ.guestGate({ mode:k === 'acc' ? 'signup' : 'login', done:() => { lockWas = null; paintLock(); renderAccBtn && renderAccBtn(); } }); return; }
  if (k === 'pu'){
    try{ await puterSignIn(); afterConnect('¡Puter conectado!'); paintLock(); }
    catch(err){ if (!(err && err.shown)) toast('No terminaste de entrar a Puter. Inténtalo otra vez.'); }
  } else openGuide();
});
inp.addEventListener('pointerdown', () => { if (isLocked()) lockNudge(); });
inp.addEventListener('keydown', e => { if (isLocked() && e.key.length === 1){ lockNudge(); } });

/* ---------- SynthonIA preocupada: si te ve perdido (muchos clics al azar o el mouse por todas partes) ---------- */
const CF = { pts:[], hits:[], shows:0, last:0 };
function wBusy(){ return !!(G || document.querySelector('#szWorry,#conn,.szm,#szgPanel,#bflow,#tour,#side.open,#blk,#acc,#sx,#portal,#drv')); }
function confuse(w){
  if (!isLocked() || wBusy() || Date.now() - lockAt < 1800) return;
  const now = Date.now(); CF.hits = CF.hits.filter(h => now - h[0] < 6000); CF.hits.push([now, w || 1]);
  if (CF.hits.reduce((a, h) => a + h[1], 0) >= 6) worry();
}
document.addEventListener('pointerdown', e => {
  if (!isLocked() || e.target.closest('#lockCard,#szWorry,#inp')) return;
  /* los clics que no hacen nada (zonas vacías) cuentan más que los clics en botones */
  confuse(e.target.closest('button,a,input,textarea,select,label,[role=button]') ? .8 : 1.4);
}, true);
document.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || !isLocked() || wBusy()) return;
  const now = Date.now(); CF.pts.push([now, e.clientX, e.clientY]);
  CF.pts = CF.pts.filter(p => now - p[0] < 2600);
  if (CF.pts.length < 25) return;
  let d = 0, turns = 0, sx = 0;
  for (let i = 1; i < CF.pts.length; i++){
    const dx = CF.pts[i][1] - CF.pts[i - 1][1], dy = CF.pts[i][2] - CF.pts[i - 1][2]; d += Math.hypot(dx, dy);
    const sg = Math.sign(dx); if (Math.abs(dx) > 6 && sg && sx && sg !== sx) turns++; if (Math.abs(dx) > 6 && sg) sx = sg;
  }
  /* mucho recorrido y muchos cambios de dirección en ~2,5 s = mouse «perdido» */
  if (d > 1.7 * (innerWidth + innerHeight) && turns >= 6){ CF.pts = []; confuse(6); }
}, { passive:true });
const W_FAQ = [
  ['¿Por qué no puedo escribir?', 'Porque ahora no hay ninguna IA libre para ti: usaste tu límite gratis de hoy o las IAs están descansando. Conecta Puter y la caja se abre al instante.'],
  ['¿Qué es Puter?', 'Con Puter usas la versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis, tiene un límite que se renueva cada mes y se conecta con un clic.'],
  ['¿Me cobran algo?', 'No. SymphorIA es gratis y nunca te cobra. Tienes un límite gratis cada día.'],
  ['¿Qué hay en la Guía?', 'Te muestro todo paso a paso con mi manita: temas, IA recomendadas para ti, cómo comparar dos y tu primer chat de verdad.']
];
let wTok = 0;
const zz = ms => new Promise(r => setTimeout(r, ms));
function wSay(text, mood){
  const w = $('#szWorry'); if (!w) return Promise.resolve();
  const p = $('.wb p', w); p._chars = null; p.textContent = text;
  if (mood){ const f = $('.wme', w); f.innerHTML = SZ.face(mood, isMobile() ? 60 : 72); }
  SZ.SND.blip(mood || 'preocupada');
  return SZ.reduce ? Promise.resolve() : SZ.typeIn(p, { cps:60, max:1.8 }).catch(() => {});
}
function wHide(){
  const w = $('#szWorry'); if (!w) return; wTok++;
  w.classList.add('out'); w.classList.remove('say'); document.body.classList.remove('szworrying');
  try{ SZ.HAND.unspot(); SZ.HAND.hide(); }catch(e){}
  setTimeout(() => w.remove(), 650);
}
async function worry(){
  if (wBusy() || CF.shows >= 3 || Date.now() - CF.last < 45000) return;
  CF.shows++; CF.last = Date.now(); CF.hits = []; CF.pts = [];
  const tok = ++wTok, H2 = SZ.HAND, alive = () => tok === wTok && $('#szWorry');
  const w = document.createElement('div'); w.id = 'szWorry'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'SynthonIA');
  w.innerHTML = '<div class="wb"><button type="button" class="wx" data-w="x" aria-label="Cerrar">×</button><b>SynthonIA</b><p></p><div class="wq" hidden>' + W_FAQ.map((q, i) => '<button type="button" data-wq="' + i + '">' + esc(q[0]) + '</button>').join('') + '</div><div class="wa" hidden><button type="button" class="btn sm flow" data-w="guide">Mostrarme la Guía</button><button type="button" class="btn sm ghost" data-w="conn">Conectar una IA</button></div></div>'
    + '<button type="button" class="wme" data-w="me" aria-label="SynthonIA">' + SZ.face('preocupada', isMobile() ? 60 : 72) + '</button>';
  document.body.appendChild(w); document.body.classList.add('szworrying');
  /* en celular se para justo encima del aviso de bloqueo, sin taparlo */
  const lk0 = $('#lockCard'); if (isMobile() && lk0 && !lk0.hidden) w.style.bottom = Math.max(150, innerHeight - lk0.getBoundingClientRect().top + 12) + 'px';
  w.addEventListener('click', e => {
    const q = e.target.closest('[data-wq]'); if (q){ wTok++; const [t, a] = W_FAQ[+q.dataset.wq]; wSay(a, 'feliz'); return; }
    const b = e.target.closest('[data-w]'); if (!b) return;
    const k = b.dataset.w;
    if (k === 'x'){ wHide(); return; }
    if (k === 'me'){ w.classList.toggle('say'); return; }
    wHide();
    if (k === 'guide') setTimeout(openGuide, 300); else setTimeout(openConnect, 300);
  });
  requestAnimationFrame(() => w.classList.add('in'));
  await zz(SZ.reduce ? 60 : 650); if (!alive()) return;
  w.classList.add('say');
  await wSay('Ay… te veo un poquito perdido 😟', 'preocupada'); if (!alive()) return;
  await zz(SZ.reduce ? 200 : 700); if (!alive()) return;
  /* con su manita: primero se señala a ella, luego la Guía (se nota el esfuerzo) */
  const me = $('.wme', w), gd = [$('#guideTop')].find(n => n && n.getClientRects().length && n.getBoundingClientRect().width);
  try{
    H2.show({ x:innerWidth * .55, y:innerHeight * .45 });
    wSay('Tranqui, aquí estoy yo. Si tienes dudas o necesitas ayuda, pregúntame sin pena…', 'senalando');
    await H2.moveTo(me, { shape:'point', fx:.3, fy:.2 }); if (!alive()) return;
    H2.spot(me, 6); await H2.click(null); await zz(SZ.reduce ? 300 : 1500); if (!alive()) return;
    if (gd){
      wSay('…o échale un ojo a la Guía: ahí te enseño todo paso a paso. 👀', 'guino');
      await H2.moveTo(gd, { shape:'point' }); if (!alive()) return;
      H2.spot(gd, 6); await H2.click(null); await zz(SZ.reduce ? 300 : 1700); if (!alive()) return;
    }
    const lk = $('#lockCard');
    if (lk && !lk.hidden){
      wSay('Y para escribir, solo falta conectar una IA aquí. ¡Es un clic!', 'senalando');
      await H2.moveTo($('[data-lk="pu"]', lk) || lk, { shape:'point' }); if (!alive()) return;
      H2.spot(lk, 6); await zz(SZ.reduce ? 300 : 1500); if (!alive()) return;
    }
  }catch(e){}
  try{ H2.unspot(); H2.hide(); }catch(e){}
  if (!alive()) return;
  $('.wq', w).hidden = false; $('.wa', w).hidden = false;
  if (!SZ.reduce) $$('.wq button,.wa .btn', w).forEach((n, i) => n.animate([{ opacity:0, transform:'translateY(8px)' }, { opacity:1, transform:'none' }], { duration:420, delay:i * 60, easing:'cubic-bezier(.22,1,.36,1)', fill:'backwards' }));
  wSay('¿Te ayudo con algo de esto? Toca una pregunta y te respondo al tiro.', 'feliz');
}
function needsConn(){ return (mode === 'cmp' ? st().cmp : [selId()]).some(id => !connected(id)); }
async function puterSignIn(opts){
  if (!window.puter){ showBlockHelp(window.__puterBlocked ? 'script' : 'script'); throw Object.assign(new Error('sin puter'), { shown:true }); }
  try{ return await puter.auth.signIn(opts || {}); }
  catch(e){ if (e && (e.error === 'popup_blocked' || e.code === 'popup_blocked')){ window.__popupBlocked = true; showBlockHelp('popup'); throw Object.assign(new Error('popup'), { shown:true }); } throw e; }
}
function mScore(m){ const b = (m.id.match(/(\d{2,3})b/i) || [])[1]; return (b ? +b : 20) + (m.reasoning ? 25 : 0) + Math.min(m.ctx, 262144) / 8000 + (/gpt-oss|deepseek|qwen|llama-3\.3|gemini|kimi|glm/i.test(m.id) ? 15 : 0) + (/^pu:/.test(m.id) && /gpt-5|gemini-3|claude|deepseek/i.test(m.id) ? 40 : 0) - (/nano|lite|mini/i.test(m.id) ? 10 : 0) + (/gpt-5\.6-luna$/i.test(m.id) ? 30 : 0) + (/^or:openrouter\/free$/.test(m.id) ? 20 : 0) + (/^gq:/.test(m.id) && gqOn() ? 60 : 0) + (m.id === 'sz:auto' ? 140 : /^sz:/.test(m.id) ? 10 : 0) - (/allam/i.test(m.id) ? 999 : 0) - (SZ.isBad(m.id) ? 999 : 0); }
function bestOf(prefix){ const l = cat.list.filter(m => m.id.startsWith(prefix + ':') && (m.free || prefix === 'pu')); if (prefix === 'sz' || prefix === 'or'){ const ap = l.find(m => m.id === APODEX); if (ap) return ap; } return l.length ? l.slice().sort((a, b) => mScore(b) - mScore(a))[0] : null; }
function switchProv(prefix){
  if (mode !== 'solo') setMode('solo');
  const b = bestOf(prefix);
  if (!b){ toast('No encontré IA de ' + (prefix === 'pu' ? 'Puter' : prefix === 'sz' ? 'las IAs conectadas' : 'ese lugar') + ' ahora mismo.'); return; }
  pickModel(b.id, null); toast('Cambié a ' + b.name + '.');
  if (!connected(b.id)) openConnect();
}
/* el mejor modelo que ya puedes usar; si no hay ninguno, el mejor de Puter (solo pide un clic) */
function bestUsable(strict){
  const l = cat.list.filter(m => m.free || /^pu:/.test(m.id)); if (!l.length) return null;
  const ok = l.filter(m => connected(m.id)), pu = l.filter(m => /^pu:/.test(m.id));
  const pool = ok.length ? ok : strict ? [] : pu;
  if (!pool.length) return null;
  return pool.slice().sort((a, b) => mScore(b) - mScore(a))[0];
}
/* si el modelo elegido no se puede usar pero hay otro conectado, cambia solo */
function fixModel(quiet){
  if (mode !== 'solo' || !cat.list.length) return false;
  if (Object.keys(busy).length) return false;   /* v3.3 · nunca cambia la IA mientras una está respondiendo */
  const cur = selId(), missing = !idx.has(cur);
  if (/^pu:/.test(cur) && !window.__puterBlocked && !cat.list.some(m => /^pu:/.test(m.id))) return false;
  if (!missing && st().pinned === cur) return false;
  if (!missing && connected(cur)) return false;
  const b = bestUsable(!missing);
  if (!b || b.id === cur) return false;
  pickModel(b.id, null);
  if (!quiet) toast('Te puse ' + b.name + ', que ya puedes usar.');
  return true;
}
function applySurvey(force){
  const s = st().survey; if (!s || !cat.list.length || (!force && s.applied)) return;
  const picks = SZ.surveyPicks(cat.list, s, 8).filter(id => connected(id) || /^pu:/.test(id));
  if (!picks.length) return;
  s.applied = Date.now(); save();
  if (mode !== 'solo') setMode('solo');
  st().pinned = picks[0]; pickModel(picks[0], null);
  toast('Según lo que me contaste, te recomiendo ' + info(picks[0]).name + '. Mira el filtro «Para ti».');
}
function afterConnect(msg){ try{ SZ.accStart(); }catch(e){} toast(msg); burst(innerWidth / 2, innerHeight / 2); fixModel(true); refresh(true); renderMsgs(); updateHint(); }
/* se llama dentro del clic/Enter: así el inicio de sesión de Puter no queda bloqueado */
async function ensureConn(){
  if (!needsConn()) return true;
  if (fixModel(false) && !needsConn()) return true;
  const ids = mode === 'cmp' ? st().cmp : [selId()];
  if (window.puter && ids.every(id => connected(id) || /^pu:/.test(id))){
    const slow = setTimeout(() => toast('Abriendo Puter… entra en la ventanita que aparece. Tu mensaje te espera en la caja.'), 900);
    try{ await puterSignIn(); clearTimeout(slow); afterConnect('¡Puter conectado!'); return !needsConn(); }
    catch(e){ clearTimeout(slow); if (!(e && e.shown)) toast('No terminaste de entrar a Puter. Inténtalo otra vez.'); return false; }
  }
  openConnect(); return false;
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-conn]')){ e.preventDefault(); openConnect(); } });
function openConnect(){
  if (connEl) return;
  const hasP = puterOn(), on = szOn(), q = SZ.SZQ, left = Math.max(0, (q.limit || 20000) - (q.used || 0)), legacy = !!(st().keys.openrouter || st().keys.groq);
  connEl = document.createElement('div'); connEl.id = 'conn';
  connEl.innerHTML = '<div class="tcard"><div class="word" id="cWord"></div><div class="tn">TU IA</div><div class="tb"><h3>' + (on ? 'Ya puedes chatear gratis' : 'Las IAs están descansando') + '</h3><p>' + (on ? 'No tienes que conectar nada. Solo escribe.' : 'Vuelve en un momento, o sigue ya con Puter.') + '</p></div>'
    + SZ.limBar({ title:'Tu EnerX de hoy' })
    + '<div class="cbox"><span>' + SZ.puterLogo() + 'Puter <small class="opt">tus IAs pro</small></span>' + (hasP ? '<i class="ok">✓ Conectado</i>' : '<button class="btn sm" id="cPU" type="button">Conectar Puter</button>') + '</div>'
    + '<p class="cnote"><b>¿Qué es Puter?</b> Con Puter usas la versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis, tiene un límite que se renueva cada mes y se conecta con un clic.</p>'
    + '<div class="tbtn" style="margin-top:18px"><button class="lnk" id="cClose" type="button">Cerrar</button></div></div>';
  document.body.appendChild(connEl); $('#cWord').innerHTML = zWord('Synth');
  requestAnimationFrame(() => connEl.classList.add('on'));
  $('.tcard', connEl).animate([{ transform:'scale(.9) translateY(24px)', opacity:0, filter:'blur(10px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { if (!connEl) return; const el = connEl; connEl = null; el.classList.remove('on'); setTimeout(() => el.remove(), 520); };
  connEl._close = close;
  $('#cClose').addEventListener('click', close);
  connEl.addEventListener('pointerdown', e => { if (e.target === connEl) close(); });
  const lx = $('#cLegx'); if (lx) lx.addEventListener('click', async () => { if (!(await SZ.szConfirm('¿Quitar tus llaves de antes?', 'Se borran solo de este equipo. Ya no las necesitas: las IAs conectadas son gratis para todos.', 'Quitar', true))) return; delete st().keys.openrouter; delete st().keys.groq; if (/^(or|gq):/.test(st().model.openrouter || '')) st().model.openrouter = APODEX; save(); close(); toast('Listo: quitaste tus llaves de este navegador.'); refresh(true); paintProv(); paintLock(); });
  const pu = $('#cPU');
  if (pu) pu.addEventListener('click', () => {
    if (!window.puter){ showBlockHelp('script'); return; }
    pu.textContent = 'Conectando…';
    puterSignIn().then(() => { close(); afterConnect('¡Puter conectado!'); }).catch(e => { pu.textContent = 'Conectar con Puter'; if (!(e && e.shown)) toast('No terminaste de entrar a Puter. Inténtalo otra vez.'); });
  });
}

