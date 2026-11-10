/* ---------- arranque ---------- */
function boot(){
  renderCards(); puterCard(); renderLaunch(); renderUsage(); updateTotals(); measure(); SZ.mirrorType($('#launchInp'));
  SZ.szCatalog().catch(() => {});        /* estado de las IAs conectadas y el límite de hoy */
/* tarjeta de Puter + botón de cuenta */
function puterCard(){
  const wrap = $('#cards'); if (!wrap || $('[data-id="puter"]', wrap)) return;
  wrap.insertAdjacentHTML('beforeend', '<article class="card" data-id="puter" style="--c:#6fd3d6"><div class="card-top">' + SZ.puterLogo('lg') + '<h3>Puter</h3><span class="status" data-st>' + SZ.t('ix.puOff') + '</span></div><p class="desc">' + SZ.t('ix.puDesc') + '</p><div class="actions"><button class="btn sm" data-pu type="button">' + SZ.t('ix.puGo') + '</button></div></article>');
  const card = $('[data-id="puter"]', wrap), b = $('[data-pu]', card);
  const paint = () => { const on = !!(window.puter && puter.auth && puter.auth.isSignedIn()); setStatus(card, SZ.t(on ? 'ix.puOn' : 'ix.puOff'), on ? 'ok' : ''); b.textContent = SZ.t(on ? 'ix.qOpen' : 'ix.puGo'); };
  paint(); addEventListener('puter-ready', paint);
  b.addEventListener('click', () => {
    if (window.puter && puter.auth.isSignedIn()){ openChat(); return; }
    b.textContent = 'Conectando…';
    puterSignIn({}).then(() => { paint(); updateTotals(); toast(SZ.t('ix.puDone')); setTimeout(() => { if (!leaving) openChat(); }, 1000); }).catch(e => { paint(); if (!(e && e.shown)) toast(SZ.t('ix.puFail')); });
  });
}
function renderAccIdx(){
  const b = $('#accBtn'); if (!b) return; const A = SZ.ACC;
  if (A.ready){ b.className = 'accb'; b.innerHTML = SZ.myAvatar() + '<span>' + esc(SZ.accName().slice(0, 14)) + '</span><i class="sy' + (A.err ? ' bad' : '') + '"></i>'; }
  else if (A.busy || SZ.signedish()){ b.className = 'accb'; b.innerHTML = '<span class="av-me">…</span><span>' + SZ.t('ix.opening') + '</span><i class="sy wait"></i>'; }
  else { b.className = 'accb out'; b.textContent = SZ.t('ix.signin'); }
}
$('#accBtn').addEventListener('click', () => {
  if (SZ.ACC.ready){ SZ.portalOut('chat.html?acc=1'); return; }
  authModal(false, () => updateTotals());
});

$('#cfgBtn').addEventListener('click', () => SZ.cfgModal());
SZ.smoothWheel(); SZ.orbitBg();
SZ.accHooks.push(kind => { renderAccIdx(); if (kind === 'pull'){ updateTotals(); try{ renderUsage(); }catch(e){} } });
renderAccIdx();

  armTypes(); charify($('#h1')); if ($('.hsub2')) charify($('.hsub2')); charify($('#heroSub'));
  observeAll(); update();
  requestAnimationFrame(loop);
  addEventListener('resize', () => { placePill($('#launchSeg')); measure(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { placePill($('#launchSeg')); measure(); });
  if (!st().models.openrouter) SZ.refreshModels(API[0]).catch(() => {});
}
boot();
/* «Empezar a FlowIA'r»: SynthonIA guiña el ojo y luego se pone fachera (gafas de Flow) con brillitos */
(function startFace(){
  const f = $('#startFace'), b = $('#startBtn'); if (!f || !b) return;
  const put = m => { f.innerHTML = '<span class="fl">' + SZ.face(m, 38) + '</span>'; };
  const cycle = () => { b.classList.remove('cool'); put('guino'); setTimeout(() => { put('flow'); b.classList.add('cool'); }, 1300); };
  cycle(); setInterval(() => { if (!document.hidden && !root.classList.contains('idle-sleep')) cycle(); }, 9000);
  b.addEventListener('mouseenter', () => { put('flow'); b.classList.add('cool'); });
})();
let seen = false, backIn = '';
/* v3.7 · «Intro de la página» en Ajustes manda: Nunca = nunca; Cada vez = siempre; Una vez por visita = una vez por pestaña.
   Antes, quien no terminaba el recorrido de bienvenida seguía siendo «primera vez» para siempre y veía la intro aunque eligiera «Nunca».
   Con Animaciones apagadas no hay intro (es una animación); la primera visita de alguien que no eligió nada sí la ve. */
try{
  const im = SZ.CFG.intro || 'session', once = sessionStorage.getItem('synthz:intro') === '1';
  seen = im === 'never' || !SZ.CFG.anim || (im === 'session' && once);
  if (!seen) sessionStorage.setItem('synthz:intro', '1');
}catch(e){}
/* de vuelta desde SynthFlow: «SymphorIA» ya llegó volando a su esquina; sin intro, la página aparece suave */
try{ backIn = sessionStorage.getItem('synthz:back') || ''; sessionStorage.removeItem('synthz:back'); }catch(e){}
if (backIn){ seen = !FIRST; requestAnimationFrame(() => requestAnimationFrame(() => { root.classList.add('backout'); setTimeout(() => root.classList.remove('backin', 'backout'), 950); })); }
if (seen) finishIntro();
else {
  const failsafe = setTimeout(finishIntro, 9000);
  intro().catch(finishIntro).finally(() => clearTimeout(failsafe));
}

/* v2.5 · ya no hay barrita lateral en la portada: todo está en el menú de arriba */
/* v3.0 · al cambiar de idioma, lo que pinta el JS se vuelve a pintar */
if (SZ.onLang) SZ.onLang(() => { try{ paintSzCard(); updateTotals(); renderLaunch(); renderUsage._b = 0; renderUsage(); }catch(e){} });
$('#limPill').addEventListener('click', () => { const u = $('#consumo'); if (u) u.scrollIntoView({ behavior:SZ.reduce ? 'auto' : 'smooth' }); });
})();

/* v2.2 · Ajustes › Tus IAs en la portada, y el «!» de novedades sobre SynthonIA */
/* el texto se lee al abrir Ajustes, así sigue al idioma */
const lk = (l, fn, d) => { const a = [, fn]; Object.defineProperties(a, { 0:{ get:() => SZ.t(l) }, 2:{ get:() => SZ.t(d) } }); return a; };
SZ.cfgLinks.push(lk('ix.lk1', () => SZ.surveyModal(), 'ix.lk1d'), lk('ix.lk2', () => SZ.portalOut('chat.html?conn=1'), 'ix.lk2d'), lk('ixa.abrirsynthflow', () => { location.href = 'chat.html'; }, 'ix.lk3d'));
if (!SZ.appStandalone()) SZ.cfgLinks.push(lk('ix.lk4', () => SZ.appPromo(true), 'ix.lk4d'));
setTimeout(() => { if (!document.querySelector('.szm, #vintro, #intro')) SZ.whatsNew(false); }, 4000);
