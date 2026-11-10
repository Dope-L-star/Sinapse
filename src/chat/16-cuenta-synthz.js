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
/* tu espacio en la nube */
function spaceHtml(){
  const s = SZ.ACC.space; if (!s || !s.max) return '';
  const k = Math.min(1, s.used / s.max), mb = n => (n / 1048576).toFixed(n < 10485760 ? 1 : 0).replace('.', ',');
  return '<div class="aspace' + (k > .9 ? ' warn' : '') + '"><div><b>Tu nube</b><span>' + mb(s.used) + ' de ' + mb(s.max) + ' MB</span></div><span class="tmbar"><i style="transform:scaleX(' + k.toFixed(3) + ')"></i></span>'
    + (SZ.ACC.full ? '<small>Está llena: tus chats nuevos se guardan solo en este dispositivo hasta que borres conversaciones viejas.</small>' : '') + '</div>';
}
/* IA de SymphorIA: resumen para el equipo; las llaves, el estado y la ayuda viven en Pulsem (pulsem.html) */
function trialAdminHtml(d){
  const ks = d.keys || [], ok = ks.filter(k => !k.down).length, mine = ks.filter(k => k.mine).length;
  return '<div class="sxlbl">IAS CONECTADAS · PARA TODOS</div><div class="tmc"><div class="trow2"><i class="pdot2 ' + (ok ? 'ok' : ks.length ? 'warn' : 'off') + '" aria-hidden="true"></i><b>' + ok + ' de ' + ks.length + ' llaves activas</b><span>' + ((d.models && d.models.n) || 0) + ' IA gratis · ' + Math.round((d.dayLimit || 25000) / 800) + ' mensajes por persona al día' + (mine ? ' · ' + mine + ' son tuyas' : '') + '</span></div>'
    + '<p class="cnote" style="margin:8px 0">En Pulsem ves cómo está la página, quién está conectado y quién necesita ayuda.</p><div class="tbtn"><span></span><a class="btn sm flow" href="pulsem.html">Abrir Pulsem →</a></div></div>';
}
function loadTrialAdmin(box){
  SZ.api('trial').then(d => { if (box.isConnected) box.innerHTML = trialAdminHtml(d); }).catch(e => { if (box.isConnected) box.innerHTML = '<p class="cnote">No pude cargar las IAs conectadas: ' + esc(e.message) + '</p>'; });
}
function accModal(){
  if (accEl) return;
  const A = SZ.ACC, signed = A.ready, pf = A.profile || {}, u = A.user || {}, n = Object.keys(st().chats).filter(k => st().chats[k].length).length;
  accEl = document.createElement('div'); accEl.id = 'acc';
  accEl.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Tu cuenta">'
    + (signed
      ? '<div class="acard"><div class="pfban" style="background:' + SZ.grad(pf.banner || pf.color) + '"></div><div class="pfme">' + SZ.myAvatar('xl') + '<div><b>' + esc(SZ.accName()) + '</b>' + (pf.pronouns ? '<i>' + esc(pf.pronouns) + '</i>' : '') + '<span>' + '<em class="rolep r-' + esc(u.role || 'user') + '">' + esc(SZ.ROLE_NAME[u.role || 'user'] || u.role) + '</em> ' + esc(SZ.accHandle(u)) + ' · ' + (A.full ? 'tu cuenta está llena' : A.err ? 'sin guardar en tu cuenta' : A.t ? 'guardado ' + ago(A.t) : 'guardando…') + '</span></div></div>' + (pf.status ? '<p class="pfs">' + esc(pf.status) + '</p>' : '') + (pf.bio ? '<p class="pfb">' + esc(pf.bio) + '</p>' : '') + '</div>'
        + '<div class="aact"><button class="btn sm" type="button" id="aEdit">Editar perfil</button><button class="btn sm ghost" type="button" id="aSurvey">Mis IA ideales</button>' + '<button class="btn sm ghost" type="button" id="aSec">Seguridad y acceso</button>' + '</div>'
        + '<div class="sxstats"><div><b>' + fmt(n) + '</b><span>chats en la nube</span></div><div><b>' + fmt(Object.values(st().usage || {}).reduce((a, u) => a + (u.requests || 0), 0)) + '</b><span>respuestas en total</span></div><div><b>' + fmt(Object.values(st().chats).reduce((a, c) => a + (Array.isArray(c) ? c.filter(m => m && m.star).length : 0), 0)) + '</b><span>mensajes favoritos</span></div></div>'
        + (false ? '<div class="sxsave"><p>Guardar mi llave de OpenRouter (de antes) en mi cuenta, cifrada, para no volver a pegarla en otro dispositivo.</p><button class="sxsw" id="aKey" type="button" aria-pressed="' + !!st().syncKey + '" aria-label="Guardar mi llave en mi cuenta"></button></div>' : '')
        + spaceHtml()
        + (u.claimable ? '<div class="sxsave"><p>Esta cuenta está reservada para el equipo de Sinapse. Actívala con tu código de configuración.</p><button class="btn sm" id="aClaim" type="button">Activar mi rango</button></div>' : '')
        + (['owner', 'admin', 'staff'].includes(u.role) ? '<div id="aTrial"><div class="tmload">Cargando las IAs conectadas…</div></div>' : '')

      : '<div class="word" id="aWord"></div><div class="tn">TU CUENTA</div><div class="tb"><h3>Entra a Sonyx</h3><p>Con tu cuenta tus chats y favoritos te siguen a cualquier dispositivo, personalizas tu perfil y puedes hablar con el equipo de Sinapse. Solo necesitas un usuario y una contraseña (o tu cuenta de Google). Puter sigue siendo solo para sus IA.</p><div id="aAuth"></div></div>')
    + '<div class="tbtn" style="margin-top:18px"><button class="lnk" id="aClose" type="button">Cerrar</button>'
    + (signed ? '<button class="lnk" id="aSync" type="button">Guardar ahora</button><button class="lnk" id="aDel" type="button">Borrar cuenta</button><button class="btn sm ghost" id="aOut" type="button">Cerrar sesión</button>' : '') + '</div>'
    + (signed ? '<div class="aout2"><button class="lnk" id="aOutAll" type="button">Cerrar sesión en todos mis dispositivos</button></div>' : '') + '</div>';
  document.body.appendChild(accEl); const w = $('#aWord'); if (w) w.innerHTML = zWord('Synth');
  requestAnimationFrame(() => accEl.classList.add('on'));
  $('.tcard', accEl).animate([{ transform:'scale(.9) translateY(24px)', opacity:0, filter:'blur(10px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { if (!accEl) return; const el = accEl; accEl = null; el.classList.remove('on'); setTimeout(() => el.remove(), 470); };
  const reopen = () => { if (accEl){ accEl.remove(); accEl = null; } accModal(); };
  $('#aClose').addEventListener('click', close);
  accEl.addEventListener('pointerdown', e => { if (e.target === accEl) close(); });
  const ab = $('#aAuth');
  if (ab) SZ.authBox(ab, () => { reopen(); renderAccBtn(); }, k => { close(); showBlockHelp(k); });
  if (!signed) return;
  $('#aEdit').addEventListener('click', () => SZ.profileModal(() => { renderAccBtn(); reopen(); }));
  const sec = $('#aSec'); if (sec) sec.addEventListener('click', () => SZ.securityModal());
  $('#aSurvey').addEventListener('click', () => SZ.surveyModal(ok => { if (ok){ forMeK = ''; applySurvey(true); renderList({ keep:true }); } }));
  const aKey = $('#aKey'); if (aKey) aKey.addEventListener('click', e => { st().syncKey = !st().syncKey; save(); e.currentTarget.setAttribute('aria-pressed', String(!!st().syncKey)); if (!st().syncKey) SZ.api('me', { method:'PUT', body:{ key:'' } }).catch(() => {}); toast(st().syncKey ? 'Tu llave se guardará cifrada en tu cuenta.' : 'Tu llave se borró de tu cuenta.'); });
  $('#aSync').addEventListener('click', async e => { const b = e.currentTarget; b.textContent = 'Sincronizando…'; await SZ.accPush({ ledger:true }); b.textContent = 'Sincronizar'; toast(SZ.ACC.err || 'Todo sincronizado.'); });
  $('#aOut').addEventListener('click', async e => {
    const b = e.currentTarget; b.textContent = 'Guardando…'; b.disabled = true;
    try{ await SZ.accSignOut(); }
    catch(er){
      b.textContent = 'Cerrar sesión'; b.disabled = false;
      if (!er.unsynced || !(await SZ.szConfirm('No pude guardar tus últimos cambios', 'Si sales ahora, lo que no alcanzó a guardarse en tu cuenta se borra de este dispositivo. ¿Salir igual?', 'Cerrar igual', true))) return;
      await SZ.accSignOut(true);
    }
    toast('Sesión cerrada. Tus chats quedaron en tu cuenta y se borraron de este dispositivo.'); setTimeout(() => location.reload(), 1100);
  });
  $('#aDel').addEventListener('click', async () => {
    if (!(await SZ.szConfirm('¿Borrar tu cuenta de Sonyx?', 'Se borran para siempre tu perfil, tus chats guardados en tu cuenta y lo que hay en este dispositivo. No se puede deshacer.', 'Seguir', true))) return;
    const isPass = u.kind === 'pass' || !!u.username;
    const v = await SZ.szPrompt('Confirma que eres tú', isPass ? 'Escribe tu contraseña para borrar la cuenta.' : 'Escribe tu correo (' + (u.email || '') + ') para borrar la cuenta.', 'Borrar mi cuenta', { type:isPass ? 'password' : 'email', ac:isPass ? 'current-password' : 'off', danger:true });
    if (!v) return;
    try{ await SZ.accDelete(isPass ? { pass:v } : { confirm:v }); toast('Tu cuenta se borró.'); setTimeout(() => location.reload(), 900); }catch(er){ toast(er.message); }
  });
  $('#aOutAll').addEventListener('click', async e => {
    const b = e.currentTarget;
    if (!(await SZ.szConfirm('¿Cerrar sesión en todos lados?', 'Se cierra tu sesión en todos tus dispositivos, incluido este. Útil si entraste en un computador ajeno.', 'Cerrar en todos', true))) return;
    b.textContent = 'Guardando…';
    try{ await SZ.accSignOutAll(); }
    catch(er){ if (!er.unsynced || !(await SZ.szConfirm('No pude guardar tus últimos cambios', 'Si sigues, lo que no alcanzó a guardarse se borra de este dispositivo.', 'Seguir igual', true))){ b.textContent = 'Cerrar sesión en todos mis dispositivos'; return; } await SZ.accSignOutAll(true); }
    toast('Cerraste sesión en todos tus dispositivos.'); setTimeout(() => location.reload(), 1100);
  });
  const cl = $('#aClaim');
  if (cl) cl.addEventListener('click', async () => {
    const v = await SZ.szPrompt('Activar tu rango', 'Escribe el código de configuración del equipo de Sinapse.', 'Activar', { sec:true });
    if (!v) return;
    try{ const r = await SZ.accClaim(v); toast('¡Listo! Tu rango: ' + (SZ.ROLE_NAME[r] || r) + '.'); reopen(); }catch(er){ toast(er.message); }
  });
  const tr = $('#aTrial');
  if (tr) loadTrialAdmin(tr);

}
SZ.accHooks.push(kind => {
  renderAccBtn();
  if (kind === 'pull'){ renderMsgs(); renderFoot(); paintSel(); renderTop(); updateHint(); renderChats(false); loadTeams().then(() => { fixModel(true); renderList({ keep:true }); updateHint(); }); try{ renderList({ keep:true }); }catch(e){} }
  if (kind === 'out'){ delete st().useTeam; paintProv(); renderList({ keep:true }); updateHint(); }
});
$('#accBtn').addEventListener('click', accModal);
SZ.hooks.chats = () => { renderMsgs(); updateHint(); renderFoot(); renderChats(false); };
$('#cfgBtn').addEventListener('click', () => SZ.cfgModal());
SZ.smoothWheel(); SZ.orbitBg(msgsEl);
delete st().teamKey; delete st().team; delete st().teams;
renderAccBtn();
if (params.get('acc') === '1') setTimeout(accModal, 2600);

