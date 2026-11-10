/* ---------- tu cuenta de SymphorIA ---------- */
let accEl = null;
function renderAccBtn(){
  const b = $('#accBtn'); if (!b) return;
  const A = SZ.ACC, u = A.user || {}, tm = $('#tabMe .tme');
  if (A.ready){ b.className = 'rbtn rme'; b.dataset.tip = SZ.accName(); b.setAttribute('aria-label', 'Tu cuenta: ' + SZ.accName()); b.innerHTML = SZ.myAvatar() + '<span class="rl"><b>' + esc(SZ.accName().slice(0, 22)) + '</b><small>' + esc(SZ.ROLE_NAME[u.role || 'user'] || 'Synther') + ' · ' + (A.err ? 'sin guardar en tu cuenta' : 'guardado en tu cuenta') + '</small></span><i class="sy' + (A.err ? ' bad' : '') + '" title="' + (A.err ? esc(A.err) : 'Sincronizado') + '"></i>'; if (tm) tm.innerHTML = SZ.myAvatar(); }
  else if (A.busy || SZ.signedish()){ b.className = 'rbtn rme'; b.dataset.tip = 'Abriendo tu cuenta…'; b.innerHTML = '<span class="av-me">…</span><span class="rl"><b>Abriendo…</b><small>tu cuenta</small></span><i class="sy wait"></i>'; if (tm) tm.innerHTML = '<span class="av-me">…</span>'; }
  else { b.className = 'rbtn rme out'; b.dataset.tip = 'Entrar a tu cuenta'; b.setAttribute('aria-label', 'Entrar a tu cuenta'); b.innerHTML = '<span class="av-me" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></span><span class="rl"><b>Entrar</b><small>guarda tus chats</small></span>'; if (tm) tm.innerHTML = '<span class="av-me" style="background:rgba(255,255,255,.1);color:var(--soft)" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></span>'; }
  b.style.setProperty('--i', 6);
}
/* v4.6 · «Tu cuenta» ya no es una ventana aparte: perfil, seguridad, nube y cerrar sesión están en Ajustes › Cuenta (core 14e),
   y al tocar tu perfil en la barra sale el panelito corto de React (next/componentes/synthflow/MenuCuenta.jsx).
   Esta ventana solo queda para entrar o crear una cuenta (sin sesión). */
function accModal(){
  if (SZ.ACC.ready){ SZ.cfgModal('cuenta'); return; }
  if (accEl) return;
  accEl = document.createElement('div'); accEl.id = 'acc';
  accEl.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Tu cuenta">'
    + '<div class="word" id="aWord"></div><div class="tn">TU CUENTA</div><div class="tb"><h3>Entra a Sonyx</h3><p>Con tu cuenta tus chats y favoritos te siguen a cualquier dispositivo, personalizas tu perfil y puedes hablar con el equipo de Sinapse. Solo necesitas un usuario y una contraseña (o tu cuenta de Google). Puter sigue siendo solo para sus IA.</p><div id="aAuth"></div></div>'
    + '<div class="tbtn" style="margin-top:18px"><button class="lnk" id="aClose" type="button">Cerrar</button></div></div>';
  document.body.appendChild(accEl); const w = $('#aWord'); if (w) w.innerHTML = zWord('Synth');
  requestAnimationFrame(() => accEl.classList.add('on'));
  $('.tcard', accEl).animate([{ transform:'scale(.9) translateY(24px)', opacity:0, filter:'blur(10px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { if (!accEl) return; const el = accEl; accEl = null; el.classList.remove('on'); setTimeout(() => el.remove(), 470); };
  $('#aClose').addEventListener('click', close);
  accEl.addEventListener('pointerdown', e => { if (e.target === accEl) close(); });
  SZ.authBox($('#aAuth'), () => { close(); renderAccBtn(); }, k => { close(); showBlockHelp(k); });
}
/* el panelito del perfil (React); si React todavía no cargó, se abre lo de siempre */
function accMenu(anchor){
  if (window.__mcListo){ try{ dispatchEvent(new CustomEvent('synthflow-menu-cuenta', { detail:{ anchor:anchor || null } })); return; }catch(e){} }
  if (SZ.ACC.ready) SZ.cfgModal('cuenta'); else accModal();
}
/* lo que cambia en el perfil o en «Mis IA ideales» desde Ajustes se refleja en el chat */
SZ.cfgAcc.onSurvey = ok => { forMeK = ''; applySurvey(true); renderList({ keep:true }); };
SZ.cfgAcc.onChange = () => { renderAccBtn(); };
SZ.accHooks.push(kind => {
  renderAccBtn();
  if (kind === 'pull'){ renderMsgs(); renderFoot(); paintSel(); renderTop(); updateHint(); renderChats(false); loadTeams().then(() => { fixModel(true); renderList({ keep:true }); updateHint(); }); try{ renderList({ keep:true }); }catch(e){} }
  if (kind === 'out'){ delete st().useTeam; paintProv(); renderList({ keep:true }); updateHint(); }
});
$('#accBtn').addEventListener('click', e => accMenu(e.currentTarget));
SZ.hooks.chats = () => { renderMsgs(); updateHint(); renderFoot(); renderChats(false); };
$('#cfgBtn').addEventListener('click', () => SZ.cfgModal());
SZ.smoothWheel(); SZ.orbitBg(msgsEl);
delete st().teamKey; delete st().team; delete st().teams;
renderAccBtn();
if (params.get('acc') === '1') setTimeout(accModal, 2600);

