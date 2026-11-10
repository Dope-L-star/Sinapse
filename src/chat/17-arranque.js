/* ---------- arranque ---------- */
const wantModel = params.get('model');
if (wantModel && /^(pu|or):[\w.\/:@-]{2,120}$/.test(wantModel)){ st().model.openrouter = wantModel; save(); }
{ const PRE = /^(pu|or|gq|sz|tr):/, s0 = st().model.openrouter; if (s0 && !PRE.test(s0)){ st().model.openrouter = 'or:' + s0; save(); } st().cmp = st().cmp.map(x => PRE.test(x) ? x : 'or:' + x);
  /* beta 2: quien usaba OpenRouter o Groq sin llave pasa a las IAs conectadas (sus chats siguen en «Mis chats») */
  const s1 = st().model.openrouter || ''; if ((/^or:/.test(s1) && !(st().keys.openrouter || st().useTeam)) || (/^gq:/.test(s1) && !gqOn()) || !s1){ st().model.openrouter = APODEX; delete st().pinned; save(); }
  const c1 = st().cmp.filter(x => !(/^or:/.test(x) && !(st().keys.openrouter || st().useTeam)) && !(/^gq:/.test(x) && !gqOn())); if (c1.length !== st().cmp.length){ st().cmp = c1; save(); } }
{ const cc = st().chats; if (Array.isArray(cc.openrouter)){ if (cc.openrouter.length && !(cc[ckey()] || []).length) cc[ckey()] = cc.openrouter; delete cc.openrouter; save(); } }
root.style.setProperty('--c', mode === 'cmp' ? '#b8c4ff' : vendorColor(info(selId()).vendor));
if (mode === 'cmp' && st().cmp.length < 2) mode = 'solo';
document.body.classList.toggle('cmpm', mode === 'cmp');
inp.placeholder = mode === 'cmp' ? 'Una pregunta para todas las IA…' : 'Escribe tu mensaje…';
applyRail();
renderFilters(); renderLive(); renderList({ animate:true }); renderTop(true); renderMsgs(); renderNow(); updateHint(); renderChats(true);
const fixPills = () => { placePill($('#cSeg')); placePill($('#sortSeg')); placePill($('#provSeg')); };
/* «Más filtros»: al abrirse, sus píldoras se acomodan y el panel queda dentro de la ventana (con su propio scroll) */
/* (los filtros ya no van escondidos: viven en el panel «Filtros») */ requestAnimationFrame(fixPills);
requestAnimationFrame(fixPills);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fixPills);
addEventListener('resize', fixPills);
refresh(true);

/* la entrada continúa la expansión de la página anterior */
const enter = root.classList.contains('enter');
let po = ''; try{ po = sessionStorage.getItem('synthz:portal') || ''; sessionStorage.removeItem('synthz:portal'); }catch(e){}
/* v4.4 · «Entrada»: al abrir SynthFlow directo ya no se llena la pantalla con el velo lila y la Z vieja que se agranda (del diseño
   anterior). El velo es tinta con el esqueleto de Sonyx brillando (Fondo.jsx); al estar listo se funde y todo llega en cascada. */
/* desde la portada: el hueco de la «o» se abre (o un fundido en modo rendimiento) */
requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => { root.classList.add('go'); if (enter){ if (po === 'o'){ SZ.portalArrive($('#veil')); SZ.waterIn($('.shell')); } setTimeout(renderNow, 1500); } }, enter ? 120 : 0)));
let pendingQ = null; try{ const s0 = JSON.parse(sessionStorage.getItem('synthz:q') || 'null'); sessionStorage.removeItem('synthz:q'); if (s0 && typeof s0.q === 'string' && Date.now() - s0.t < 120000) pendingQ = s0.q; }catch(e){}
const q = pendingQ || params.get('q'), fromHome = !!pendingQ;
const draftK = params.get('draft');
if (params.get('prueba') === '1') setTimeout(() => enterTrial(), enter ? 1600 : 300);
if (!q && DRAFTS[draftK]){
  const [ex, ik, txt] = DRAFTS[draftK];
  setTimeout(() => {
    if (!st().pinned && cat.list.length) { const r = recommend(ik); if (r.m){ st().intent = { k:ik, id:r.m.id }; if (r.m.id !== selId()) pickModel(r.m.id); else renderMsgs(); } }
    typeIntoComposer(ex != null ? EXAMPLES[ex][1] : txt);
  }, enter ? 1700 : 600);
}
try{
  /* temas elegidos en la portada: SynthonIA los muestra aquí, en ese orden */
  let gt = null; try{ gt = JSON.parse(sessionStorage.getItem('synthz:gtopics') || 'null'); sessionStorage.removeItem('synthz:gtopics'); }catch(e){}
  if (params.get('guia') === '1') setTimeout(runGuide, enter ? 2000 : 500);
  else if (Array.isArray(gt) && gt.length) setTimeout(() => runTopics(gt), enter ? 2000 : 600);
  else if (!q && !draftK && !localStorage.getItem('synthz:tour')) bflowOpen(enter ? 1500 : 200);
  else { setTimeout(warnBlocked, enter ? 2700 : 900); SZ.synReady.then(() => { if (!q && SZ.wasAway()) setTimeout(() => SZ.welcomeBack({ learn:runGuide, flow:() => { if (matchMedia('(pointer: fine)').matches) inp.focus(); } }), enter ? 2200 : 700); }); setTimeout(() => { if (!G && !document.querySelector('.szm, #szWelcome')) SZ.whatsNew(false, list => runTopics(list)); }, enter ? 4200 : 3000); }
}catch(e){}
try{ if (new URLSearchParams(location.search).get('conn') === '1') setTimeout(() => openConnect(), 1200); }catch(e){}
try{ const clean = new URLSearchParams(location.search); ['q', 'from', 'draft', 'prueba', 'guia', 'conn', 'quoryn', 'alias'].forEach(k => clean.delete(k)); window.history.replaceState(null, '', location.pathname + (clean.toString() ? '?' + clean.toString() : '')); }catch(e){}
if (q){ inp.value = q.slice(0, 4000); autoGrow(); updateHint(); if (fromHome) setTimeout(() => { send(); }, enter ? 1500 : 300); else inp.focus(); }
else if (enter) setTimeout(() => { if (matchMedia('(pointer: fine)').matches) inp.focus(); }, 1300);
})();
