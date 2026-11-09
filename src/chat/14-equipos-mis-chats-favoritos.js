/* ---------- equipos: comparte tu OpenRouter sin que nadie vea tu llave ---------- */
let TEAMS = { teams:[], invites:[], at:0 };
async function loadTeams(){ if (!SZ.ACC.ready) return TEAMS; try{ const d = await SZ.api('teams'); TEAMS = { teams:d.teams || [], invites:d.invites || [], at:Date.now() }; }catch(e){} if (st().useTeam && !TEAMS.teams.some(x => x.id === st().useTeam && x.hasKey)){ delete st().useTeam; save(); } paintProv(); return TEAMS; }
const LIMITS = [[0, 'Sin límite'], [10000, '10 mil'], [20000, '20 mil'], [50000, '50 mil'], [100000, '100 mil']];
function teamsHtml(){
  const T = TEAMS, me = SZ.ACC.user || {};
  let h = '<div class="sxlbl">EQUIPOS</div>' + (SZ.accHandle() ? '<p class="cnote tmme">Para que te inviten, comparte tu usuario: <b>' + esc(SZ.accHandle()) + '</b></p>' : '');
  h += T.invites.map(i => '<div class="tminv">' + SZ.avatarHtml(i.from, i.from) + '<p><b>' + esc(i.from.name) + '</b>' + (i.from.handle ? ' <small>' + esc(i.from.handle) + '</small>' : '') + ' te invitó a <b>«' + esc(i.name) + '»</b>' + (i.hasKey ? ' · comparte OpenRouter' : '') + '</p><button class="btn sm" type="button" data-ta="accept" data-id="' + esc(i.id) + '">Aceptar</button><button class="lnk" type="button" data-ta="decline" data-id="' + esc(i.id) + '">No</button></div>').join('');
  T.teams.forEach(x => {
    const lim = x.daily ? Math.min(1, x.myUse / x.daily) : 0;
    h += '<div class="tmc"><h4>' + esc(x.name) + '<small>' + (x.owner ? 'tuyo' : 'de ' + esc(x.ownerInfo.name)) + '</small></h4>';
    if (x.owner){
      h += x.hasKey ? '<div class="tmkey">🔒 <span>Compartes tu OpenRouter (' + esc(x.keyLabel) + '). Tu equipo lo usa sin ver la llave.</span><button class="lnk" type="button" data-ta="nokey" data-id="' + esc(x.id) + '">Dejar de compartir</button></div>'
        : '<div class="cfgrow"><p>Compartir mi OpenRouter<small>Pega una llave: se guarda cifrada en SynthFlow y tu equipo nunca la ve. Mejor una llave solo para el equipo, con límite de crédito.</small></p></div><div class="tinv"><input type="text" data-sec="1" data-tk="' + esc(x.id) + '" placeholder="sk-or-…" autocomplete="off" data-lpignore="true" data-1p-ignore data-form-type="other" spellcheck="false"><button class="btn sm" type="button" data-ta="key" data-id="' + esc(x.id) + '">Compartir</button></div>';
      h += '<div class="sxlbl">MIEMBROS</div>' + (x.members.length ? x.members.map(m => '<div class="tmrow">' + SZ.avatarHtml(m, m) + '<div class="tx"><b>' + esc(m.name) + '</b><small>' + esc(m.handle || m.email || '') + ' · hoy ' + fmt(m.used) + (x.daily ? ' / ' + fmt(x.daily) : '') + '</small></div>' + (x.daily ? '<span class="tmbar"><i style="transform:scaleX(' + Math.min(1, m.used / x.daily).toFixed(3) + ')"></i></span>' : '') + '<button class="x" type="button" data-ta="remove" data-id="' + esc(x.id) + '" data-sub="' + esc(m.sub) + '" data-nm="' + esc(m.name) + '" aria-label="Quitar a ' + esc(m.name) + '">✕</button></div>').join('') : '<p class="cnote" style="margin:4px 0">Aún sin miembros.</p>')
        + x.invites.map(i => '<div class="tmrow"><span class="av-me" style="background:rgba(255,255,255,.1);color:var(--soft)">' + (/^@/.test(i.to || '') ? '@' : '✉') + '</span><div class="tx"><b>' + esc(i.to || i.email) + '</b><small>invitación pendiente</small></div><button class="x" type="button" data-ta="uninvite" data-id="' + esc(x.id) + '" data-to="' + esc(i.to || i.email) + '" aria-label="Cancelar invitación">✕</button></div>').join('')
        + '<div class="tinv"><input data-te="' + esc(x.id) + '" type="text" placeholder="@usuario de tu amigo" autocomplete="off" autocapitalize="none" spellcheck="false"><button class="btn sm" type="button" data-ta="invite" data-id="' + esc(x.id) + '">Invitar</button></div>'
        + '<div class="cfgrow"><p>Solo modelos gratis<small>Así nadie gasta crédito de tu llave.</small></p><button class="cfgsw" type="button" data-ta="free" data-id="' + esc(x.id) + '" aria-pressed="' + x.freeOnly + '" aria-label="Solo modelos gratis"></button></div>'
        + '<div class="sxlbl">LÍMITE DIARIO POR PERSONA</div><div class="tmseg">' + LIMITS.map(([v, l]) => '<button type="button" data-ta="daily" data-id="' + esc(x.id) + '" data-v="' + v + '" aria-pressed="' + (x.daily === v) + '">' + l + '</button>').join('') + '</div>'
        + '<div class="tbtn" style="margin-top:8px"><span></span><button class="lnk" type="button" data-ta="delete" data-id="' + esc(x.id) + '" data-nm="' + esc(x.name) + '">Borrar equipo</button></div>';
    } else {
      h += '<div class="tmrow">' + SZ.avatarHtml(x.ownerInfo, x.ownerInfo) + '<div class="tx"><b>' + esc(x.ownerInfo.name) + '</b><small>dueño · ' + x.members.length + ' miembros</small></div></div>';
      h += x.hasKey ? '<div class="cfgrow"><p>Usar el OpenRouter de este equipo<small>Hoy llevas ' + fmt(x.myUse) + (x.daily ? ' de ' + fmt(x.daily) + ' de ' + SZ.t('enerx.name') : ' de ' + SZ.t('enerx.name')) + (x.freeOnly ? ' · solo modelos gratis' : '') + '. El dueño ve cuánto usas, no lo que escribes.</small></p><button class="cfgsw" type="button" data-ta="use" data-id="' + esc(x.id) + '" aria-pressed="' + (st().useTeam === x.id) + '" aria-label="Usar su OpenRouter"></button></div>' + (x.daily ? '<span class="tmbar" style="width:100%;margin-top:6px"><i style="transform:scaleX(' + lim.toFixed(3) + ')"></i></span>' : '')
        : '<p class="cnote">El dueño todavía no comparte su OpenRouter.</p>';
      h += '<div class="tbtn" style="margin-top:8px"><span></span><button class="lnk" type="button" data-ta="leave" data-id="' + esc(x.id) + '" data-nm="' + esc(x.name) + '">Salir del equipo</button></div>';
    }
    h += '</div>';
  });
  h += '<div class="tinv" style="margin-top:12px"><input id="tNewName" maxlength="40" placeholder="Nombre de un equipo nuevo"><button class="btn sm ghost" type="button" data-ta="create">Crear equipo</button></div>';
  return h;
}
function teamsBind(box, reopen){
  box.addEventListener('click', async e => {
    const b = e.target.closest('[data-ta]'); if (!b) return;
    const a = b.dataset.ta, id = b.dataset.id, run = async (body, ok) => { const l = b.textContent; b.disabled = true; if (b.tagName === 'BUTTON' && !b.classList.contains('cfgsw') && !b.classList.contains('x')) b.textContent = '…'; try{ await SZ.api('teams', { method:'POST', body }); if (ok) toast(ok); await loadTeams(); reopen(); }catch(er){ b.disabled = false; b.textContent = l; toast(er.message); } };
    if (a === 'use'){ const on = st().useTeam === id; if (on) delete st().useTeam; else st().useTeam = id; save(); b.setAttribute('aria-pressed', String(!on)); paintProv(); fixModel(true); renderList({ keep:true }); updateHint(); toast(on ? 'Ya no usas el OpenRouter del equipo.' : 'Listo: usas el OpenRouter del equipo.'); return; }
    if (a === 'create'){ const n = $('#tNewName', box).value.trim(); if (!n){ toast('Ponle un nombre a tu equipo.'); return; } return run({ action:'create', name:n }, 'Equipo creado. Ahora invita a tus amigos.'); }
    if (a === 'invite'){ const v = $('[data-te="' + id + '"]', box).value.trim(); if (!v){ toast('Escribe el @usuario de tu amigo.'); return; } return run({ action:'invite', id, to:v }, 'Invitación enviada. Le aparecerá cuando entre a su cuenta de SymphorIA.'); }
    if (a === 'key'){ const v = $('[data-tk="' + id + '"]', box).value.trim(); if (!v){ toast('Pega la llave de OpenRouter.'); return; } return run({ action:'key', id, key:v }, 'Tu equipo ya puede usar tu OpenRouter (sin ver la llave).'); }
    if (a === 'nokey') return run({ action:'key', id, key:'' }, 'Dejaste de compartir tu OpenRouter.');
    if (a === 'free') return run({ action:'settings', id, freeOnly:b.getAttribute('aria-pressed') !== 'true' }, 'Guardado.');
    if (a === 'daily') return run({ action:'settings', id, daily:+b.dataset.v }, 'Límite actualizado.');
    if (a === 'accept') return run({ action:'accept', id }, '¡Te uniste al equipo!');
    if (a === 'decline') return run({ action:'decline', id }, 'Invitación rechazada.');
    if (a === 'uninvite') return run({ action:'uninvite', id, to:b.dataset.to }, 'Invitación cancelada.');
    if (a === 'remove'){ if (await SZ.szConfirm('¿Quitar a ' + b.dataset.nm + '?', 'Dejará de poder usar el OpenRouter del equipo al instante.', 'Quitar', true)) run({ action:'remove', id, sub:b.dataset.sub }, 'Quitado del equipo.'); return; }
    if (a === 'leave'){ if (await SZ.szConfirm('¿Salir de «' + b.dataset.nm + '»?', 'Dejarás de poder usar su OpenRouter.', 'Salir', true)){ if (st().useTeam === id){ delete st().useTeam; save(); } run({ action:'leave', id }, 'Saliste del equipo.'); } return; }
    if (a === 'delete'){ if (await SZ.szConfirm('¿Borrar «' + b.dataset.nm + '»?', 'Todos pierden el acceso y la llave compartida se borra del servidor.', 'Borrar equipo', true)) run({ action:'delete', id }, 'Equipo borrado.'); return; }
  });
}

/* ---------- varias conversaciones por modelo ---------- */
const curT = () => ((st().thread || {})[thModel()] || '');
function parseKey(k){ const r = k.slice('openrouter::'.length), i = r.lastIndexOf('::'); return i > 0 && /^t[0-9a-z]+$/.test(r.slice(i + 2)) ? { model:r.slice(0, i), id:r.slice(i + 2) } : { model:r, id:'' }; }
function thMeta(model, id, create){
  st().threads = st().threads || {};
  const L = st().threads[model] || (create ? (st().threads[model] = []) : null); if (!L) return null;
  let e = L.find(x => x.id === id); if (!e && create){ e = { id, title:'', t:0 }; L.push(e); } return e;
}
function touchThread(){
  const e = thMeta(thModel(), curT(), true); e.t = Date.now();
  /* v4.0 · el primer título sale del primer mensaje con tema (no de «Hola, ¿cómo estás?»); luego la IA lo pone con sentido (05g) */
  if (!e.title || e.auto0){ const t = titleLocal(chatArr()); if (t !== e.title){ e.title = t; e.auto0 = true; } }
  renderThBtn();
}
function allThreads(){
  return Object.keys(st().chats).filter(k => /^openrouter::./.test(k) && Array.isArray(st().chats[k]) && st().chats[k].length).map(k => {
    const { model, id } = parseKey(k), e = thMeta(model, id, false) || {}, u = st().chats[k].find(x => x.role === 'user');
    return { k, model, id, title:e.title || (u ? titleLocal(st().chats[k]) : 'Conversación'), t:e.t || 0, n:st().chats[k].length, imp:e.imp };
  }).sort((a, b) => b.t - a.t);
}
/* ---------- tus chats y tus favoritos (panel de la izquierda) ---------- */
const PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';
const BIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>';
let chT = 0;
function renderThBtn(){ clearTimeout(chT); chT = setTimeout(() => renderChats(false), 120); }
function snipOf(text, q){ const t = text.replace(/\s+/g, ' '), i = t.toLowerCase().indexOf(q); if (i < 0) return ''; const a = Math.max(0, i - 28); return (a ? '…' : '') + t.slice(a, i + q.length + 46) + '…'; }
const plain = t => t.replace(/```[\s\S]*?```/g, ' [código] ').replace(/[*_#>`~]+/g, '').replace(/^\s*[-+]\s+/gm, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();
function allFavs(){
  const out = [];
  Object.keys(st().chats).forEach(k => { const arr = st().chats[k]; if (!Array.isArray(arr) || !/^openrouter::./.test(k)) return; arr.forEach((m, i) => { if (m.star && m.role === 'assistant') out.push({ k, i, model:m.model || parseKey(k).model, text:plain(m.content) }); }); });
  return out.reverse();
}
function renderChats(anim){
  const box = $('#thList'); if (!box) return;
  const q = $('#thQ').value.trim().toLowerCase();
  box.classList.toggle('still', !anim);
  $('#thQ').placeholder = cView === 'favs' ? 'Buscar en tus favoritos…' : 'Buscar en tus chats';
  $('#cFavH').hidden = cView !== 'favs'; $('#cNew').hidden = cView === 'favs';
  if (cView === 'favs'){
    const L = allFavs().filter(x => !q || (x.text + ' ' + info(x.model).name).toLowerCase().includes(q));
    box.innerHTML = L.length ? L.map((x, i) => '<div class="fvi" data-k="' + esc(x.k) + '" data-i="' + x.i + '" style="--i:' + Math.min(i, 20) + '"><b>' + esc(info(x.model).name) + '</b><p>' + esc(q ? snipOf(x.text, q) || x.text.slice(0, 220) : x.text.slice(0, 220)) + '</p></div>').join('')
      : '<div class="thnone">' + (q ? 'Ningún favorito coincide.' : 'Aún no tienes favoritos.') + '<em>Toca «Guardar» ★ debajo de una respuesta y vuela hasta aquí.</em></div>';
    return;
  }
  const now = new Date(), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const grp = t => !t ? 'Antes' : t >= d0 ? 'Hoy' : t >= d0 - 864e5 ? 'Ayer' : t >= d0 - 6 * 864e5 ? 'Esta semana' : 'Antes';
  const AG = st().agentT || {};
  const isAg = x => !!AG[x.k] || x.model === AGK;
  const L = allThreads().map(x => { if (!q) return x; const hitT = (x.title + ' ' + info(x.model).name).toLowerCase().includes(q); let sn = ''; if (!hitT){ const m = (st().chats[x.k] || []).find(mm => (mm.content || '').toLowerCase().includes(q)); if (!m) return null; sn = snipOf(m.content, q); } return Object.assign({}, x, { sn }); }).filter(Boolean);
  if (!L.length){ box.innerHTML = '<div class="thnone">' + (q ? 'Nada coincide en tus chats.' : 'Aún no tienes chats.') + '<em>' + (q ? 'Busco en los títulos y dentro de cada mensaje.' : 'Escribe tu primer mensaje y aparecerá aquí.') + '</em></div>'; return; }
  let h = '', g0 = '', n = 0;
  const hlq = t => q ? hl(t, q) : esc(t);
  L.forEach(x => {
    const g = grp(x.t); if (g !== g0){ h += '<div class="thg">' + g + '</div>'; g0 = g; }
    const cur = mode === 'solo' && x.model === thModel() && x.id === curT(), m = info(x.model);
    h += '<div class="thi' + (cur ? ' cur' : '') + '" data-k="' + esc(x.k) + '" title="' + esc(m.name + ' · ' + x.n + ' mensajes') + '" style="--i:' + Math.min(n++, 20) + ';--vc:' + vendorColor(m.vendor) + '"><i class="thd" aria-hidden="true"></i><div class="tt"><b>' + hlq(x.title) + '</b>' + (x.imp ? '<em class="thimp">' + esc({ chatgpt:'ChatGPT', claude:'Claude' }[x.imp] || (SZ.lang() === 'en' ? 'Imported' : 'Importado')) + '</em>' : '') + (x.sn ? '<span class="snip">' + hlq(x.sn) + '</span>' : '') + '</div>'
      + '<button type="button" data-ren aria-label="Renombrar">' + PEN + '</button><button type="button" data-del aria-label="Borrar">' + BIN + '</button></div>';
  });
  box.innerHTML = h;
}
$('#thQ').addEventListener('input', () => renderChats(false));
$('#cNew').addEventListener('click', () => newChat());
$('#cFavBack').addEventListener('click', () => { cView = 'chats'; RS.view = 'chats'; saveRS(); applyRail(); renderChats(true); });
function openThread(model, id, ci){
  if (mode !== 'solo'){ stopNow(); cmpRun++; cmpLast = null; mode = 'solo'; }
  (st().thread || (st().thread = {}))[model] = id;
  if (model === AGK){ st().agent = true; paintAgent(); gen++; save(); setMode('solo'); }
  else {
    if (st().agent){ st().agent = false; paintAgent(); }
    st().pinned = model;
    if (model !== selId()) pickModel(model, null); else { gen++; save(); setMode('solo'); }
  }
  if (isMobile()) closeChatsSheet(); else if (isTablet()){ RS.chats = false; saveRS(); applyRail(); }
  renderChats(false);
  if (ci != null) setTimeout(() => { const el = lane.querySelector('.m.bot[data-ci="' + ci + '"]'); if (el){ el.scrollIntoView({ behavior:SZ.reduce ? 'auto' : 'smooth', block:'center' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } }, 260);
}
$('#thList').addEventListener('click', async e => {
  const fv = e.target.closest('.fvi');
  if (fv){ const { model, id } = parseKey(fv.dataset.k); openThread(model, id, +fv.dataset.i); return; }
  const it = e.target.closest('.thi'); if (!it) return;
  const k = it.dataset.k, { model, id } = parseKey(k);
  if (e.target.closest('[data-del]')){
    if (!(await SZ.szConfirm('¿Borrar esta conversación?', 'Se borra de este dispositivo y de tu cuenta. No se puede deshacer.', 'Borrar', true))) return;
    delete st().chats[k]; st().del = [...(st().del || []), k].slice(-300);
    const L = (st().threads || {})[model]; if (L) st().threads[model] = L.filter(x => x.id !== id);
    save(); if (mode === 'solo' && model === thModel() && id === curT()){ gen++; renderMsgs(); updateHint(); }
    it.animate([{ opacity:1, transform:'none' }, { opacity:0, transform:'translateX(-14px)', filter:'blur(6px)' }], { duration:300, easing:'ease-in' }).onfinish = () => renderChats(false);
    toast('Conversación borrada.'); return;
  }
  if (e.target.closest('[data-ren]')){
    const b = $('.tt b', it), inp2 = document.createElement('input'); inp2.value = b.textContent; inp2.maxLength = 60; b.replaceWith(inp2); inp2.focus(); inp2.select();
    let canceled = false;
    const ok = () => { if (canceled) return; canceled = true; const v = inp2.value.trim(); if (v){ const m = thMeta(model, id, true); m.title = v; m.manual = true; delete m.auto0; if (!m.t) m.t = Date.now(); save(); } renderChats(false); };
    inp2.addEventListener('keydown', ev => { if (ev.key === 'Enter'){ ev.preventDefault(); ok(); } if (ev.key === 'Escape'){ ev.preventDefault(); ev.stopPropagation(); canceled = true; renderChats(false); } });
    inp2.addEventListener('blur', ok); return;
  }
  if (e.target.closest('input')) return;
  openThread(model, id);
});
/* compatibilidad: lo que antes abría la ventanita de conversaciones */
function thOpen(){ showChats('chats', true); }

