/* ===== v4.6 · «Tu cuenta» vive dentro de Ajustes (como en Claude: Ajustes › Cuenta) =====
   Antes había una ventana aparte («Tu cuenta») con perfil, seguridad, nube y cerrar sesión. Ahora todo eso es la sección «Cuenta» de Ajustes,
   y lo que sale al tocar tu perfil en la barra es un panelito corto (next/componentes/synthflow/MenuCuenta.jsx) con Ajustes, Idioma, Ayuda,
   Planes y Cerrar sesión. Las acciones largas (cerrar sesión, borrar cuenta…) están aquí como funciones sueltas para que las usen los dos. */
const cfgAcc = { onSurvey:null, onChange:null };
const accTeam = u => ['owner', 'admin', 'staff'].includes((u || ACC.user || {}).role);
/* cerrar sesión: primero guarda en la nube; si no pudo, avisa y deja salir igual */
async function accLogout(){
  try{ await accSignOut(); }
  catch(er){
    if (!er.unsynced || !(await szConfirm('No pude guardar tus últimos cambios', 'Si sales ahora, lo que no alcanzó a guardarse en tu cuenta se borra de este dispositivo. ¿Salir igual?', 'Cerrar igual', true))) return false;
    await accSignOut(true);
  }
  toast('Sesión cerrada. Tus chats quedaron en tu cuenta y se borraron de este dispositivo.'); setTimeout(() => location.reload(), 1100);
  return true;
}
async function accLogoutAll(){
  if (!(await szConfirm('¿Cerrar sesión en todos lados?', 'Se cierra tu sesión en todos tus dispositivos, incluido este. Útil si entraste en un computador ajeno.', 'Cerrar en todos', true))) return false;
  try{ await accSignOutAll(); }
  catch(er){ if (!er.unsynced || !(await szConfirm('No pude guardar tus últimos cambios', 'Si sigues, lo que no alcanzó a guardarse se borra de este dispositivo.', 'Seguir igual', true))) return false; await accSignOutAll(true); }
  toast('Cerraste sesión en todos tus dispositivos.'); setTimeout(() => location.reload(), 1100);
  return true;
}
async function accDeleteFlow(){
  const u = ACC.user || {};
  if (!(await szConfirm('¿Borrar tu cuenta de Sonyx?', 'Se borran para siempre tu perfil, tus chats guardados en tu cuenta y lo que hay en este dispositivo. No se puede deshacer.', 'Seguir', true))) return false;
  const isPass = u.kind === 'pass' || !!u.username;
  const v = await szPrompt('Confirma que eres tú', isPass ? 'Escribe tu contraseña para borrar la cuenta.' : 'Escribe tu correo (' + (u.email || '') + ') para borrar la cuenta.', 'Borrar mi cuenta', { type:isPass ? 'password' : 'email', ac:isPass ? 'current-password' : 'off', danger:true });
  if (!v) return false;
  try{ await accDelete(isPass ? { pass:v } : { confirm:v }); toast('Tu cuenta se borró.'); setTimeout(() => location.reload(), 900); return true; }catch(er){ toast(er.message); return false; }
}
async function accClaimFlow(){
  const v = await szPrompt('Activar tu rango', 'Escribe el código de configuración del equipo de Sinapse.', 'Activar', { sec:true });
  if (!v) return false;
  try{ const r = await accClaim(v); toast('¡Listo! Tu rango: ' + (ROLE_NAME[r] || r) + '.'); return true; }catch(er){ toast(er.message); return false; }
}

/* la sección «Cuenta» de Ajustes: se repinta sola si cambia la cuenta (entrar, salir, editar perfil) */
let cfgAccLive = null;
accHooks.push(() => { if (cfgAccLive && cfgAccLive.host.isConnected) cfgAccLive.paint(); });
function cfgAccPane(host){
  const mb = n => (n / 1048576).toFixed(n < 10485760 ? 1 : 0).replace('.', ',');
  const row = (t, s, ctl) => '<div class="cfgrow cfgrow-c"><p>' + t + (s ? '<small>' + s + '</small>' : '') + '</p>' + ctl + '</div>';
  const btn = (k, label, cls) => '<button type="button" class="btn sm' + (cls ? ' ' + cls : '') + '" data-ac="' + k + '">' + label + '</button>';
  const paint = () => {
    const A = ACC, u = A.user || {}, pf = A.profile || {};
    if (!A.ready){
      host.innerHTML = '<div class="cfgcta"><h4>Entra a Sonyx</h4><p>Con tu cuenta tus chats y favoritos te siguen a cualquier dispositivo, personalizas tu perfil y puedes hablar con el equipo de Sinapse. Solo necesitas un usuario y una contraseña (o tu cuenta de Google). Puter sigue siendo solo para sus IA.</p><div id="cfgAuth"></div></div>';
      authBox($('#cfgAuth', host), () => { paint(); try{ if (cfgAcc.onChange) cfgAcc.onChange(); }catch(e){} }, () => toast('Tu navegador bloqueó la ventana. Permite las ventanas emergentes de este sitio.'));
      return;
    }
    const saved = A.full ? 'Tu cuenta está llena' : A.err ? 'Sin guardar en tu cuenta' : A.t ? 'Guardado en tu cuenta' : 'Guardando…';
    const sp = A.space;
    host.innerHTML = '<div class="cfgprof"><div class="cfgpb" style="background:' + grad(pf.banner || pf.color) + '"></div><div class="cfgpm"><span class="cfgpav">' + myAvatar('xl') + '</span>'
      + '<div class="cfgpt"><b data-clarity-mask="true"></b><span><em class="rolep r-' + esc(u.role || 'user') + '">' + esc(ROLE_NAME[u.role || 'user'] || u.role) + '</em> <i data-clarity-mask="true"></i></span><small>' + saved + '</small></div>'
      + btn('edit', 'Editar perfil') + '</div>' + (pf.status ? '<p class="cfgps"></p>' : '') + (pf.bio ? '<p class="cfgpbio"></p>' : '') + '</div>'
      + '<h4 class="cfgsh">Tu perfil</h4>'
      + row('Mis IA ideales', 'Responde unas preguntas y te muestro las IA que mejor te sirven.', btn('survey', 'Abrir', 'ghost'))
      + row('Seguridad y acceso', 'Tu contraseña, tu código de recuperación y tus dispositivos.', btn('sec', 'Abrir', 'ghost'))
      + (accTeam(u) ? row('Pulsem', 'Cómo está la página, quién está conectado y quién necesita ayuda.', '<a class="btn sm ghost" href="pulsem.html">Abrir Pulsem</a>') : '')
      + (u.claimable ? row('Activar mi rango', 'Esta cuenta está reservada para el equipo de Sinapse. Actívala con tu código de configuración.', btn('claim', 'Activar')) : '')
      + '<h4 class="cfgsh">Guardado</h4>'
      + (sp && sp.max ? '<div class="cfgrow cfgrow-w"><p>Tu nube<small>' + mb(sp.used) + ' de ' + mb(sp.max) + ' MB' + (A.full ? ' · Está llena: tus chats nuevos se guardan solo en este dispositivo hasta que borres conversaciones viejas.' : '') + '</small></p><span class="tmbar' + (sp.used / sp.max > .9 ? ' warn' : '') + '"><i style="transform:scaleX(' + Math.min(1, sp.used / sp.max).toFixed(3) + ')"></i></span></div>' : '')
      + row('Guardar ahora', 'Sube a tu cuenta lo último que hiciste.', btn('sync', 'Guardar ahora', 'ghost'))
      + '<h4 class="cfgsh">Sesión</h4>'
      + row('Cerrar sesión', 'Tus chats quedan en tu cuenta y se borran de este dispositivo.', btn('out', 'Cerrar sesión', 'ghost'))
      + row('Cerrar sesión en todos mis dispositivos', 'Útil si entraste en un computador ajeno.', btn('outall', 'Cerrar en todos', 'ghost'))
      + row('Borrar mi cuenta', 'Se borran para siempre tu perfil y tus chats guardados. No se puede deshacer.', btn('del', 'Borrar cuenta', 'danger'));
    $('.cfgpt b', host).textContent = accName(); $('.cfgpt i', host).textContent = accHandle(u);
    const s = $('.cfgps', host); if (s) s.textContent = pf.status; const b = $('.cfgpbio', host); if (b) b.textContent = pf.bio;
  };
  paint();
  cfgAccLive = { host, paint };
  host.addEventListener('click', async e => {
    const b = e.target.closest('[data-ac]'); if (!b) return;
    const k = b.dataset.ac;
    if (k === 'edit') profileModal(() => { paint(); try{ if (cfgAcc.onChange) cfgAcc.onChange(); }catch(e){} });
    else if (k === 'sec') securityModal();
    else if (k === 'survey') surveyModal(ok => { try{ if (ok && cfgAcc.onSurvey) cfgAcc.onSurvey(ok); }catch(e){} });
    else if (k === 'sync'){ const t = b.textContent; b.textContent = 'Guardando…'; b.disabled = true; await accPush({ ledger:true }); b.disabled = false; b.textContent = t; toast(ACC.err || 'Todo guardado.'); paint(); }
    else if (k === 'out'){ b.disabled = true; b.textContent = 'Guardando…'; if (!(await accLogout())){ b.disabled = false; b.textContent = 'Cerrar sesión'; } }
    else if (k === 'outall'){ b.disabled = true; if (!(await accLogoutAll())) b.disabled = false; }
    else if (k === 'del') accDeleteFlow();
    else if (k === 'claim'){ if (await accClaimFlow()) paint(); }
  });
}
