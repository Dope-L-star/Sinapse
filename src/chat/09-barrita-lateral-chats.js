/* ---------- barrita lateral y tus chats ---------- */
const RAIL_KEY = 'synthz:rail';
const RS = { open:false, chats:null, view:'chats' };
try{ const r = JSON.parse(localStorage.getItem(RAIL_KEY)) || {}; if (typeof r.open === 'boolean') RS.open = r.open; if (typeof r.chats === 'boolean') RS.chats = r.chats; if (r.view === 'favs') RS.view = r.view; }catch(e){}
if (RS.chats === null) RS.chats = !isTablet();
let cView = RS.view;
const saveRS = () => { try{ localStorage.setItem(RAIL_KEY, JSON.stringify(RS)); }catch(e){} };
function applyRail(){
  const sh = $('#shell'), tg = $('#railTog');
  $('#rail').classList.toggle('open', !!RS.open); sh.classList.toggle('ropen', !!RS.open); sh.classList.toggle('nochats', !RS.chats);
  tg.setAttribute('aria-expanded', String(!!RS.open)); tg.setAttribute('aria-label', RS.open ? 'Cerrar la barra' : 'Abrir la barra'); tg.dataset.tip = RS.open ? 'Cerrar la barra' : 'Abrir la barra';
  $$('#rail [data-r]').forEach(b => { const r = b.dataset.r; b.setAttribute('aria-pressed', String((r === 'chats' && RS.chats && cView === 'chats') || (r === 'favs' && RS.chats && cView === 'favs'))); });
  $$('#cSeg button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.v === cView))); placePill($('#cSeg'));
  $('#railWord').tabIndex = RS.open ? 0 : -1;
}
function showChats(view, focus){
  if (isMobile()){ cView = view || cView; openChatsSheet(focus); return; }
  RS.chats = true; if (view){ cView = view; RS.view = view; } RS.open = false; saveRS(); applyRail(); renderChats(true);
  if (focus) setTimeout(() => $('#thQ').focus(), 380);
}
$('#railTog').addEventListener('click', () => { RS.open = !RS.open; saveRS(); applyRail(); });
$('#rail').addEventListener('click', e => {
  const b = e.target.closest('[data-r]'); if (!b) return;
  const r = b.dataset.r;
  if (r === 'new'){ newChat(); return; }
  if (r === 'search'){ showChats('chats', true); return; }
  if ((r === 'chats' || r === 'favs') && RS.chats && cView === r && !RS.open){ RS.chats = false; saveRS(); applyRail(); return; }
  showChats(r);
});
$('#railCoin').addEventListener('click', () => coinModal('panel'));
$('#chatsClose').addEventListener('click', () => { if (isMobile()) closeChatsSheet(); else { RS.chats = false; saveRS(); applyRail(); } });
$$('#cSeg button').forEach(b => b.addEventListener('click', () => { cView = b.dataset.v; RS.view = cView; saveRS(); applyRail(); renderChats(true); }));
/* celular: tus chats suben como una hoja */
function openChatsSheet(focus){ const c = $('#chats'); c.classList.add('msheet'); scrim.classList.add('on'); applyRail(); renderChats(true); setTab('chats'); if (focus) setTimeout(() => $('#thQ').focus(), 420); }
function closeChatsSheet(){ const c = $('#chats'); if (!c.classList.contains('msheet')) return; c.classList.remove('msheet'); if (!side.classList.contains('open')) scrim.classList.remove('on'); setTab(null); }
function setTab(t){ $$('#tabbar [data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === t))); }
$('#tabbar').addEventListener('click', e => {
  const b = e.target.closest('[data-tab]'); if (!b) return;
  const t = b.dataset.tab;
  if (t === 'chats'){ if ($('#chats').classList.contains('msheet')) closeChatsSheet(); else { closeSide(); openChatsSheet(); } }
  else if (t === 'ia'){ if (side.classList.contains('open')) closeSide(); else { closeChatsSheet(); openSide(mode === 'cmp' ? 'add' : 'set'); } }
  else { closeSide(); closeChatsSheet(); if (t === 'coins') coinModal('panel'); else if (t === 'cfg') SZ.cfgModal(); else if (t === 'me') accModal(); }
});
/* chat nuevo: también cambia la frase de bienvenida */
function newChat(){
  closeSide(); closeChatsSheet();
  if (mode !== 'solo'){ stopNow(); cmpRun++; setMode('solo'); }
  if (chatArr().length) (st().thread || (st().thread = {}))[thModel()] = 't' + Date.now().toString(36);
  save(); gen++; nextGreet(); curTopic = null; topicsAll = false;
  renderMsgs(); updateHint(); renderChats(); renderNow();
  if (matchMedia('(pointer: fine)').matches) inp.focus();
  if (isTablet() && RS.chats){ RS.chats = false; saveRS(); applyRail(); }
}

/* volver con un fundido */
/* volver a SymphorIA: la película del portal al revés */
/* v1.4: con la barra lateral abierta, el logo «SynthFlow» NO lleva a la portada (solo hace un brillito) */
document.addEventListener('click', e => { const w = e.target.closest && e.target.closest('#railWord'); if (w){ e.preventDefault(); e.stopPropagation(); w.classList.remove('tw'); void w.offsetWidth; w.classList.add('tw'); } }, true);
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href="index.html"]'); if (!a || a.id === 'railWord' || (e.defaultPrevented && !/^(backLink|mLogo)$/.test(a.id)) || e.button || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); SZ.portalBack('index.html'); });
addEventListener('pageshow', e => { if (e.persisted){ root.classList.remove('bye'); const pp = document.getElementById('portal'); if (pp) pp.remove(); SZ.S.busy(false); } });
SZ.hooks.usage = () => { renderFoot(); coinWatch(); };
SZ.hooks.md = () => { if (!Object.keys(busy).length && mode === 'solo' && chatArr().length) renderMsgs(); };
SZ.onLang(() => { if (!Object.keys(busy).length && mode === 'solo') renderMsgs(); });   /* v3.0 · el saludo cambia de idioma al momento */
SZ.onLang(() => { try{ renderList({ keep:true }); }catch(e){} });   /* v3.7 · la lista de IA (y su «Experta en…») también cambia de idioma al momento */

/* ---------- tutorial, mejor IA gratis y menú contextual ---------- */
const APODEX_NAME = 'Automática';
const TOUR = [
  { t:'Bienvenido a SynthFlow', p:'Aquí chateas gratis con muchas IA. No tienes que configurar nada: escribe y listo.' },
  { t:'Tu Puter', p:'Cada día tienes un límite gratis para usar las IAs conectadas. A medianoche se vuelve a llenar. Si se te acaban, puedes seguir con Puter, que te da la versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis, tiene un límite que se renueva cada mes y se conecta con un clic.', x:'conn' },
  { t:'¿Dónde quieres empezar?', p:'Elige y te dejo en su pestaña con su mejor IA. Si no eliges, empiezas con ' + APODEX_NAME + '.', x:'pick' },
  { t:'Tu límite de hoy', p:'Cada día tienes un límite gratis. El anillo de la barrita se va vaciando mientras chateas y se llena otra vez a medianoche. «Respuestas cortas» te ayuda a que te alcancen más.' },
  { t:'Más trucos', p:'Adjunta imágenes, PDF o código con el «+». En "Comparar" le preguntas lo mismo a hasta 4 IAs. El botón «?» de arriba abre la guía rápida cuando quieras.' },
  { t:'Todo listo', p:'', x:'done' }
];
const TCOL = ['#8fb0ff', '#7fd6b8', '#c9566c', '#f2b36b', '#ff8f7a', '#c9566c'];
let tourI = 0, tourEl = null, tourPick = null;
function pickTarget(){ const m = tourPick === 'pu' ? bestOf('pu') : tourPick === 'sz' ? bestOf('sz') : null; return m ? m.id : APODEX; }
function tourBox(box, kind){
  if (kind === 'conn'){
    const hasP = puterOn(), on = szOn();
    box.innerHTML = '<div class="tconn"><div class="trow"><b><i class="pdot' + (on ? ' on' : '') + '"></i> <span class="sz-logo" aria-hidden="true"></span> IAs conectadas</b><span>' + (on ? 'Listas · gratis' : 'Descansando un momento') + '</span>' + (on ? '<i class="ok">✓ Lista</i>' : '') + '</div>'
      + '<div class="trow"><b><i class="pdot' + (hasP ? ' on' : '') + '"></i> ' + SZ.puterLogo() + ' Puter</b><span>Tus IAs pro · un clic</span>' + (hasP ? '<i class="ok">✓ Conectada</i>' : '<button class="btn sm" data-tpu type="button">Conectar</button><button class="lnk" data-tpt type="button">Sin cuenta de Puter</button>') + '</div></div>';
    const pu = $('[data-tpu]', box);
    if (pu) pu.addEventListener('click', () => { pu.textContent = 'Conectando…'; puterSignIn().then(() => { afterConnect('¡Puter conectado!'); tourBox(box, 'conn'); }).catch(e => { pu.textContent = 'Conectar'; if (!(e && e.shown)) toast('No terminaste de entrar a Puter. Inténtalo otra vez.'); }); });
    const pt = $('[data-tpt]', box);
    if (pt) pt.addEventListener('click', () => { pt.textContent = '…'; puterSignIn({ attempt_temp_user_creation:true }).then(() => { afterConnect('¡Puter conectado!'); tourBox(box, 'conn'); }).catch(e => { pt.textContent = 'Sin cuenta de Puter'; if (!(e && e.shown)) toast('No terminaste de entrar a Puter. Inténtalo otra vez.'); }); });
  } else if (kind === 'pick'){
    const bp = bestOf('pu'), bo = bestOf('sz');
    const card = (k, title, sub, model) => '<button type="button" class="tpick' + (tourPick === k ? ' on' : '') + '" data-k="' + k + '"><b>' + title + '</b><span>' + sub + '</span><em>' + esc(model) + '</em></button>';
    box.innerHTML = '<div class="tpicks">' + card('sz', 'IAs conectadas', 'Gratis · listas', bo ? bo.name : 'Automática') + card('pu', 'Puter', 'Tus IAs pro · un clic', bp ? bp.name : 'ChatGPT') + card('none', 'Ninguno', 'Por defecto', 'Automática') + '</div>';
    $$('.tpick', box).forEach(b => b.addEventListener('click', () => { tourPick = b.dataset.k; tourBox(box, 'pick'); }));
  } else if (kind === 'done'){
    const id = pickTarget(), where = tourPick === 'pu' ? 'Puter' : tourPick === 'sz' ? 'SymphorIA' : 'Todos';
    box.innerHTML = '<div class="tsum">Empiezas con <b>' + esc(info(id).name) + '</b> en la pestaña <b>' + where + '</b>.' + (connected(id) ? '' : /^pu:/.test(id) ? ' Te pediré entrar a Puter cuando escribas tu primer mensaje.' : '') + '</div>';
  } else box.innerHTML = '';
}
function tourStep(anim, dir){
  const c = $('.tcard', tourEl), b = $('.tb', c), d = TOUR[tourI], last = tourI === TOUR.length - 1;
  const set = () => {
    $('h3', b).textContent = d.t; $('p', b).textContent = d.p; $('p', b).style.display = d.p ? '' : 'none';
    tourBox($('.tx', b), d.x);
    $('.tn', c).textContent = '0' + (tourI + 1) + ' / 0' + TOUR.length;
    $('#tNext').textContent = last ? 'Empezar' : d.x === 'conn' ? (puterOn() ? 'Siguiente' : 'Ahora no, siguiente') : 'Siguiente';
    $('#tBack').style.visibility = tourI ? 'visible' : 'hidden';
    tourEl.style.setProperty('--tc', TCOL[tourI]); $$('.tdots i', c).forEach((x, i) => x.classList.toggle('on', i === tourI)); $('#tSkip').style.visibility = last ? 'hidden' : 'visible';
  };
  if (!anim){ set(); return; }
  SZ.swapDir(b, dir || 1, set);
}
function openHelp(){ SZ.helpGuide({ extra:[['Ver la Guía Asistida', () => runGuide()], ['Conectar mi Puter', () => openConnect()], ['Ver mi límite de hoy', () => coinModal('panel')]] }); }
/* En la edición estática antigua, el HTML aún no contiene el componente cliente React.
   Solo ahí se instala el listener vanilla; en Next, GuideButton marca el nodo y gestiona el clic. */
const guideButton = $('#guideTop');
if (guideButton && guideButton.dataset.reactComponent !== 'guide') guideButton.addEventListener('click', () => openGuide());
function openTour(){
  if (tourEl) return; tourI = 0; tourPick = null;
  tourEl = document.createElement('div'); tourEl.id = 'tour';
  tourEl.innerHTML = '<div class="tcard" role="dialog" aria-modal="true"><div class="word" id="tWord"></div><div class="tn"></div><div class="tb"><h3></h3><p></p><div class="tx"></div></div><div class="tdots"></div><div class="tbtn"><button class="lnk" id="tSkip" type="button">Saltar</button><span style="flex:1"></span><button class="lnk" id="tBack" type="button">Atrás</button><button class="btn sm" id="tNext" type="button"></button></div></div>';
  document.body.appendChild(tourEl); $('#tWord').innerHTML = zWord('Synth');
  $('.tdots', tourEl).innerHTML = TOUR.map(() => '<i></i>').join('');
  tourStep(false); requestAnimationFrame(() => tourEl.classList.add('on'));
  $('.tcard', tourEl).animate([{ transform:'scale(.9) translateY(24px)', opacity:0, filter:'blur(10px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
  $('#tSkip').addEventListener('click', () => closeTour(false));
  $('#tBack').addEventListener('click', () => { if (tourI > 0){ tourI--; tourStep(true, -1); } });
  $('#tNext').addEventListener('click', () => { if (tourI < TOUR.length - 1){ tourI++; tourStep(true); } else closeTour(true); });
}
function closeTour(go){
  if (!tourEl) return; const el = tourEl; tourEl = null; setTimeout(warnBlocked, 700);
  try{ localStorage.setItem('synthz:tour', '1'); }catch(e){}
  el.classList.remove('on'); setTimeout(() => el.remove(), 520);
  if (!go && !tourPick) return;
  if (mode !== 'solo') setMode('solo');
  const id = pickTarget();
  st().pinned = id; pickModel(id, null);
  ui.prov = tourPick === 'pu' ? 'pu' : tourPick === 'sz' ? 'sz' : 'all'; saveUI();
  $$('#provSeg button').forEach(x => x.setAttribute('aria-selected', String(x.dataset.p === ui.prov))); placePill($('#provSeg')); renderList({ animate:true });
  toast('Empiezas con ' + info(id).name + '.');
  burst(innerWidth / 2, innerHeight / 2, ['#8fb0ff', '#c9566c', '#ff8f7a', '#7fd6b8'], 22);
}
