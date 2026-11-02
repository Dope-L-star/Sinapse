/* ---------- ajustes (Prime y ZFlow) ---------- */
function renderSettings(){
  const can = !!P.canEdit, g = (T && T.google) || {}, dv = (T && T.drive) || {};
  const src = s => s === 'vercel' ? ' · desde Vercel' : s === 'panel' ? ' · desde Pulsem' : '';
  $('#setG').innerHTML = '<div class="set"><b>Tope diario por persona</b><p>' + SZ.t('pm.capP', { tok:fmt(P.dayLimit || 20000), w:SZ.coinsFmt(SZ.coinsOf(P.dayLimit || 20000)) }) + '</p>' + (can ? '<label class="field"><input type="number" min="1000" max="500000" step="1000" id="sLimit" value="' + (P.dayLimit || 20000) + '"></label><div class="acts" style="margin-top:8px"><button class="btn sm" type="button" data-set="limit">Guardar</button></div>' : '<div class="val">' + SZ.coinsFmt(SZ.coinsOf(P.dayLimit || 20000)) + ' SynXCoin\'s</div>') + '</div>'
    + '<div class="set"><b>Imágenes al día por persona</b><p>Cuántas imágenes puede crear cada cuenta al día con Pollinations (el equipo tiene al menos 20). 0 = pausadas. No gasta Puter ni el límite del chat.</p>' + (can ? '<label class="field"><input type="number" min="0" max="50" step="1" id="sImg" value="' + (T && T.imgDay != null ? T.imgDay : 3) + '"></label><div class="acts"><button class="mini" type="button" data-set="img">Guardar</button></div>' : '<p><b>' + (T && T.imgDay != null ? T.imgDay : 3) + '</b> al día</p>') + '</div>'
    + '<div class="set"><b>Entrar con Google</b><p>El «ID de cliente» de Google Cloud (es público, no es una contraseña). Sin cobros.</p>' + (can ? '<label class="field"><input type="text" id="sGoogle" placeholder="123456-abc….apps.googleusercontent.com" value="' + esc(g.clientId || '') + '" spellcheck="false"' + (g.source === 'vercel' ? ' disabled' : '') + '></label><div class="acts" style="margin-top:8px"><button class="btn sm" type="button" data-set="google"' + (g.source === 'vercel' ? ' disabled' : '') + '>Guardar</button><small style="color:var(--mute)">' + (g.clientId ? 'activado' + src(g.source) : 'sin activar') + '</small></div>' : '<div class="val">' + (g.clientId ? esc(g.clientId.slice(0, 18)) + '…' + src(g.source) : 'sin activar') + '</div>') + '</div>'
    + '<div class="set"><b>Google Drive</b><p>Opcional: otro ID solo para Drive. Si lo dejas vacío, se usa el de «Entrar con Google». Activa la Drive API y el permiso <code>drive.appdata</code>.</p>' + (can ? '<label class="field"><input type="text" id="sDrive" placeholder="(opcional)" value="' + esc(dv.clientId || '') + '" spellcheck="false"' + (dv.source === 'vercel' ? ' disabled' : '') + '></label><div class="acts" style="margin-top:8px"><button class="btn sm" type="button" data-set="drive"' + (dv.source === 'vercel' ? ' disabled' : '') + '>Guardar</button><small style="color:var(--mute)">' + (dv.clientId ? 'activado' + src(dv.source) : g.clientId ? 'usa el de Google' : 'sin activar') + '</small></div>' : '<div class="val">' + (dv.clientId ? 'activado' + src(dv.source) : 'usa el de Google') + '</div>') + '</div>';
  const sp = P.supa || {};
  $('#setG').insertAdjacentHTML('beforeend', '<div class="set"><b>Supabase (base de datos)</b><p>' + (sp.on ? '✓ Conectada: cuentas, perfiles, chats, logros y opiniones se guardan también en Supabase.' : 'Aún no conectada. Falta poner la llave secreta de Supabase en Vercel (variable <code>SUPABASE_SECRET_KEY</code>) y volver a publicar.') + '</p><p>' + (sp.google ? '✓ «Entrar con Google» por Supabase: activo.' : '«Entrar con Google» por Supabase: apagado (se activa en Supabase › Authentication › Providers › Google).') + '</p>'
    + ((sp.errs || []).length ? '<p class="cnote">Últimos avisos: ' + sp.errs.slice(0, 3).map(x => esc(x.m)).join(' · ') + '</p>' : '')
    + (P.rank === 'Prime' && sp.on ? '<div class="acts" style="margin-top:8px"><button class="mini" type="button" data-set="sbsync">Copiar todo lo de antes a Supabase</button></div>' : '') + '</div>');
  const mt = (T && T.maint) || {};
  if (can) $('#setG').insertAdjacentHTML('beforeend', '<div class="set' + (mt.on ? ' mton' : '') + '"><b>Aviso de mantenimiento' + (mt.on ? ' <span class="mtlive">● Encendido</span>' : '') + '</b><p>Cubre toda la página con este aviso y SynthonIA en el centro para charlar mientras arreglan. Pulsem nunca se cubre; Prime y ZFlow pueden «Entrar igual».</p>'
    + '<label class="field"><textarea id="sMaint" rows="3" maxlength="300" placeholder="Estamos presentando fallas o actualizaciones. Espera un momento.">' + esc(mt.text || '') + '</textarea></label>'
    + '<div class="acts" style="margin-top:8px">' + (mt.on ? '<button class="btn sm" type="button" data-set="maint" data-on="1">Cambiar texto</button><button class="btn sm ghost" type="button" data-set="maint" data-on="0">Apagar aviso</button>' : '<button class="btn sm" type="button" data-set="maint" data-on="1">Encender aviso</button>') + '</div></div>');
  /* v3.7 · «Qué estamos arreglando ahora»: lo escribe cualquiera del equipo y SynthonIA lo cuenta a quien pregunte (ayudante y mantenimiento) */
  const nw = (T && T.now) || null;
  $('#setG').insertAdjacentHTML('afterbegin', '<div class="set setnow"><b>Qué estamos arreglando ahora' + (nw ? ' <span class="mtlive">● SynthonIA lo cuenta</span>' : '') + '</b><p>Escríbelo en una o dos frases. Si alguien le pregunta a SynthonIA qué se está arreglando, o reporta algo de esto, ella lo responde con sus palabras (en español o inglés). Déjalo vacío para que no diga nada.</p>'
    + '<label class="field"><textarea id="sNow" rows="2" maxlength="300" placeholder="Ej.: Estamos arreglando que las fotos tarden en subir en el celular.">' + esc(nw ? nw.text : '') + '</textarea></label>'
    + '<div class="acts" style="margin-top:8px"><button class="btn sm" type="button" data-set="now">Guardar</button>' + (nw ? '<button class="btn sm ghost" type="button" data-set="now" data-clear="1">Borrar</button><small style="color:var(--mute)">' + esc(nw.by || 'equipo') + ' · ' + new Date(nw.t).toLocaleString('es-CO', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) + '</small>' : '') + '</div></div>');
  $('#setNote').hidden = can;
}
$('#setG').addEventListener('click', async e => {
  const b = e.target.closest('[data-set]'); if (!b) return; const k = b.dataset.set, l = b.textContent; b.disabled = true; b.textContent = 'Guardando…';
  try{
    if (k === 'now'){ const v = b.dataset.clear ? '' : ($('#sNow').value || '').trim(); const d = await api('trial', { method:'POST', body:{ action:'now', text:v }, keep:true }); T = Object.assign({}, T, { now:d.now }); toast(d.now ? 'Listo: SynthonIA ya sabe qué estamos arreglando.' : 'Borrado: SynthonIA ya no lo menciona.'); renderSettings(); return; }
    if (k === 'maint'){ const on = b.dataset.on === '1'; const d = await api('trial', { method:'POST', body:{ action:'maint', on, text:($('#sMaint') ? $('#sMaint').value : '') }, keep:true }); T = Object.assign({}, T, { maint:d.maint }); toast(on ? 'Aviso encendido: la página ya muestra el mantenimiento.' : 'Aviso apagado.'); renderSettings(); return; }
    if (k === 'sbsync'){ let cur = 0, n = 0, c = 0; for (let i = 0; i < 200; i++){ const d = await api('trial', { method:'POST', body:{ action:'sbsync', cursor:cur }, keep:true }); n += d.accounts; c += d.chats; b.textContent = 'Copiando… ' + n + ' cuentas'; cur = d.cursor; if (d.done) break; } toast('Listo: copié ' + n + ' cuentas y ' + c + ' chats a Supabase.'); renderSettings(); return; }
    if (k === 'img'){ const d = await api('trial', { method:'POST', body:{ action:'limit', imgDay:+$('#sImg').value }, keep:true }); if (T) T.imgDay = d.imgDay; toast(d.imgDay ? 'Imágenes: ' + d.imgDay + ' al día por persona.' : 'Imágenes pausadas.'); }
    else if (k === 'limit'){ const d = await api('trial', { method:'POST', body:{ action:'limit', dayLimit:+$('#sLimit').value }, keep:true }); P.dayLimit = d.dayLimit; toast('Tope diario: ' + fmt(d.dayLimit) + ' por persona (unos ' + Math.round(d.dayLimit / 800) + ' mensajes).'); }
    else { const v = ($(k === 'google' ? '#sGoogle' : '#sDrive').value || '').trim(); await api('trial', { method:'POST', body:{ action:k, clientId:v }, keep:true }); toast(v ? (k === 'google' ? 'Entrar con Google quedó activado.' : 'Drive quedó activado.') : 'Quitaste el ID.'); T = await api('trial', { keep:true }).catch(() => T); }
    renderSettings();
  }catch(er){ toast(er.message); b.disabled = false; b.textContent = l; }
});

/* ---------- ayuda: bandeja, conversación y «Contactar» ---------- */
function renderHelp(){
  const H = P.help || [];
  $('#hN').textContent = H.filter(r => r.status === 'open').length + ' esperando';
  $('#hList').innerHTML = H.length ? H.map((r, i) => '<div class="row" style="--i:' + i + '"><span class="av r-' + rc(r.user && r.user.rank) + '">' + ini(r.user && (r.user.username || r.user.name)) + '</span><div class="tx"><b>@' + esc(r.user ? r.user.username || r.user.name : '') + '</b><small>' + esc(r.text) + ' · ' + ago(r.t) + '</small></div><div class="tags">' + (r.status === 'open' ? '<span class="tag ' + (r.urgent ? 'bad' : 'warn') + '">' + (r.urgent ? '⏰ +15 min' : 'nuevo') + '</span>' : '<span class="tag ok">con ' + esc((r.by || {}).name || '') + '</span>') + '<button class="mini gold" type="button" data-open="' + esc(r.id) + '">Abrir</button></div></div>').join('') : '<div class="empty">No hay pedidos de ayuda abiertos. ✨</div>';
  if (helpCur) openHelp(helpCur.id, true);
}
async function openHelp(id, quiet){
  try{
    const d = await api('help?id=' + encodeURIComponent(id), { keep:true }); helpCur = d.item;
    const box = $('#hConv'); box.hidden = false;
    $('#hWho').textContent = '@' + (helpCur.user.username || helpCur.user.name) + (helpCur.page ? ' · ' + helpCur.page : '');
    $('#hMsgs').innerHTML = helpCur.msgs.map(m => '<div class="bub ' + (m.from === 'team' ? 't' : 'u') + '"><small>' + esc(m.name || '') + (m.rank ? ' · ' + esc(m.rank) : '') + ' · ' + ago(m.t) + '</small>' + esc(m.text) + '</div>').join('');
    $('#hMsgs').scrollTop = 1e6; $('#hEnd').hidden = helpCur.status === 'done';
    if (!quiet) box.scrollIntoView({ block:'nearest', behavior:SZ.reduce ? 'auto' : 'smooth' });
  }catch(e){ if (!quiet) toast(e.message); }
}
$('#hList').addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openHelp(b.dataset.open); });
$('#hForm').addEventListener('submit', async e => {
  e.preventDefault(); const i = $('#hInp'), v = i.value.trim(); if (!v || !helpCur) return;
  try{ const d = await api('help', { method:'POST', body:{ action:'say', id:helpCur.id, text:v }, keep:true }); i.value = ''; helpCur = d.item; openHelp(helpCur.id, true); }catch(er){ toast(er.message); }
});
$('#hEnd').addEventListener('click', async () => { if (!helpCur) return; try{ await api('help', { method:'POST', body:{ action:'close', id:helpCur.id }, keep:true }); toast('Conversación terminada.'); helpCur = null; $('#hConv').hidden = true; load(); }catch(er){ toast(er.message); } });
document.addEventListener('click', e => { const b = e.target.closest('[data-reach]'); if (b) reach(b.dataset.reach, b.dataset.nm); });
function reach(sub, name){
  const o = document.createElement('div'); o.className = 'szm';
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Contactar"><div class="word">' + SZ.zWord('Synth') + '</div><div class="tn">CONTACTAR · COMO ' + esc(String(P.rank).toUpperCase()) + '</div><div class="tb"><h3>Escríbele a ' + esc(name || 'esta persona') + '</h3><p>Le aparece una ventana «Chat con…» en SymphorIA y te responde aquí, en la bandeja de ayuda.</p></div><label class="field" style="margin-top:12px"><textarea rows="3" maxlength="1000" id="rTxt" placeholder="¡Hola! Vi que tuviste un problema. ¿Te ayudo?"></textarea></label><div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Cancelar</button><button class="btn sm" type="button" id="rGo">Enviar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close); o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  setTimeout(() => $('#rTxt').focus(), 80);
  $('#rGo', o).addEventListener('click', async e => {
    const v = $('#rTxt').value.trim(); if (v.length < 2){ toast('Escribe un mensaje.'); return; }
    const b = e.currentTarget; b.disabled = true;
    try{ const d = await api('help', { method:'POST', body:{ action:'reach', sub, text:v }, keep:true }); close(); toast('Enviado. Le llegará en su próximo «sigo aquí» (máx. 3 min).'); helpCur = d.item; load(); }catch(er){ b.disabled = false; toast(er.message); }
  });
}

