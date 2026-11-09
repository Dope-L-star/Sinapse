/* ---------- cuentas propias de SymphorIA (usuario y contraseña, o Google) · Puter solo conecta las IA ---------- */
var ACC = { ready:false, busy:false, user:null, profile:null, t:0, err:'', avail:null, cid:'', dcid:'', google:false, missing:[] };
const accHooks = [];
const hashS = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
var accSent = {}, accT = 0, accDelSent = new Set();
let SESS = ''; try{ SESS = localStorage.getItem('synthz:sess') || ''; }catch(e){}
if (SESS) document.documentElement.classList.add('signed');   /* con sesión: nada de «entra a tu cuenta» */
/* v2.9.1 · la sesión de verdad vive en una cookie HttpOnly que esta página no puede leer (así un XSS no se roba la cuenta).
   En el navegador solo queda una marca corta «c…» (distinta en cada entrada, para que las otras pestañas noten el cambio).
   cookie = el servidor dijo que la dejó; si no (servidor viejo), se guarda el token como antes */
const sessMark = () => 'c' + Math.random().toString(36).slice(2, 10);
function setSess(t, cookie){ SESS = t ? (cookie ? sessMark() : t) : ''; try{ if (SESS) localStorage.setItem('synthz:sess', SESS); else localStorage.removeItem('synthz:sess'); }catch(e){} }
/* dispositivos que entraron antes: piden su cookie una vez con el token de siempre y luego lo borran del navegador */
const sessMove = SESS.length > 20 ? fetch('/api/auth', { method:'POST', headers:{ 'content-type':'application/json', authorization:'Bearer ' + SESS }, body:'{"mode":"cookie"}' })
  .then(r => { if (r.ok) setSess(SESS, true); }).catch(() => {}) : Promise.resolve();
/* v4.5 · el primer nombre se guarda en este navegador para que las frases de carga (next/componentes/entrada/frases.js) te llamen por tu nombre
   desde el primer instante, antes de que la cuenta termine de cargar. Solo el primer nombre, solo aquí; se borra al cerrar sesión. */
function accNombre(){
  try{
    if (ACC.ready && ACC.user){ const n = String((ACC.profile && ACC.profile.name) || ACC.user.name || '').trim().split(/\s+/)[0].replace(/^@/, '').slice(0, 24); if (n && /\p{L}/u.test(n)) localStorage.setItem('synthz:nombre', n); }
    else if (!ACC.user && !SESS) localStorage.removeItem('synthz:nombre');
  }catch(e){}
}
const accFire = k => { accNombre(); accHooks.forEach(f => { try{ f(k); }catch(_){} }); };
async function api(path, o = {}){
  const h = { 'content-type':'application/json' }; if (SESS) h.authorization = 'Bearer ' + SESS;
  let r; try{ r = await fetch('/api/' + path, { method:o.method || 'GET', headers:h, body:o.body ? JSON.stringify(o.body) : undefined, signal:o.signal }); }
  catch(e){ throw Object.assign(new Error('No pude comunicarme con ' + BRAND() + '.'), { net:true }); }
  let d = {}; try{ d = await r.json(); }catch(e){}
  if (r.status === 401 && SESS && !o.keep){ setSess(''); ACC.ready = false; ACC.user = null; ACC.profile = null; accFire('out'); }
  if (!r.ok) throw Object.assign(new Error(d.error || 'Error ' + r.status), { status:r.status, data:d });
  return d;
}
/* Fase 4 · costo cero: /api/config se pedía 2 veces al abrir cada página (las cuentas y el aviso de mantenimiento).
   Ahora las dos usan la misma respuesta si tiene menos de 5 s. Devuelve { ok, d }. */
let cfgP = null, cfgT = 0;
function cfgFetch(maxAge = 5000){
  if (cfgP && Date.now() - cfgT < maxAge) return cfgP;
  cfgT = Date.now();
  const p = cfgP = fetch('/api/config', { cache:'no-store' }).then(async r => ({ ok:r.ok, d:r.ok ? await r.json().catch(() => ({})) : {} }));
  p.catch(() => { if (cfgP === p) cfgP = null; });
  return p;
}
async function accConfig(){
  if (ACC.avail !== null) return ACC.avail;
  try{ const { ok, d } = await cfgFetch(); const r = { ok }; ACC.cid = d.googleClientId || ''; ACC.dcid = d.driveClientId || ''; ACC.sbg = !!d.sbGoogle; ACC.sb = d.sb || null; ACC.google = !!((d.google && ACC.cid) || ACC.sbg); ACC.missing = d.missing || (r.ok ? [] : ['servidor']); ACC.avail = !!d.ok; }
  catch(e){ ACC.avail = false; }
  return ACC.avail;
}
function slimChat(arr){
  let a = arr.slice(-150).map(m => ({ role:m.role, content:m.content, meta:m.meta, model:m.model, star:m.star || undefined, files: Array.isArray(m.files) ? m.files.map(f => ({ name:f.name, kind:f.kind })) : undefined }));
  while (a.length > 4 && JSON.stringify(a).length > 380000) a = a.slice(Math.ceil(a.length / 4));
  return a;
}
function prefsOut(){
  return { v:2, t:Date.now(), model:state.model, fav:state.fav, cmp:state.cmp, sx:state.sx, pinned:state.pinned || '', threads:state.threads || {}, del:(state.del || []).slice(-300),
    arena:state.arena || {}, survey:state.survey || null, useTeam:state.useTeam || '', battle:!!state.battle, cfg:CFG, mem:state.mem,
    projects:projSlim(), projOf:state.projOf || {}, pjDel:(state.pjDel || []).slice(-200),
    portada:portadaGet(),
    chatKeys:Object.keys(state.chats).filter(k => Array.isArray(state.chats[k]) && state.chats[k].length) };
}
/* v2.6 · proyectos: si los archivos pesan mucho, viaja solo su nombre y el texto se queda en este equipo */
function projSlim(){
  const P = (state.projects || []).map(p => Object.assign({}, p, { files:(p.files || []).map(f => ({ id:f.id, name:f.name, text:f.text })) }));
  if (JSON.stringify(P).length > 150000) P.forEach(p => p.files.forEach(f => { delete f.text; }));
  return P;
}
const pjStr = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
function cleanProj(r){
  return { id:pjStr(r.id, 40), name:pjStr(r.name, 60) || 'Proyecto', desc:pjStr(r.desc, 300), instr:pjStr(r.instr, 8000), star:!!r.star, arch:!!r.arch, c:+r.c || 0, c0:+r.c0 || 0, t:+r.t || 0, u:+r.u || 0,
    files:(Array.isArray(r.files) ? r.files : []).filter(f => f && typeof f.id === 'string').slice(0, 60).map(f => Object.assign({ id:pjStr(f.id, 40), name:pjStr(f.name, 120) || 'archivo' }, typeof f.text === 'string' ? { text:f.text.slice(0, 200000) } : {})) };
}
function mergeProjects(p){
  if (Array.isArray(p.pjDel)) state.pjDel = [...new Set([...(state.pjDel || []), ...p.pjDel.filter(x => typeof x === 'string')])].slice(-200);
  const del = state.pjDel || [];
  if (Array.isArray(p.projects)){
    state.projects = state.projects || [];
    p.projects.forEach(r => {
      if (!r || typeof r.id !== 'string' || del.includes(r.id)) return;
      const l = state.projects.find(x => x.id === r.id), c = cleanProj(r);
      if (!l){ state.projects.push(c); return; }
      if (c.u > (+l.u || 0)){ c.files = c.files.map(f => f.text != null ? f : ((l.files || []).find(x => x.id === f.id) || f)); c.t = Math.max(c.t, +l.t || 0); Object.assign(l, c); }
      else l.t = Math.max(+l.t || 0, c.t);
    });
  }
  if (state.projects) state.projects = state.projects.filter(x => !del.includes(x.id));
  if (p.projOf && typeof p.projOf === 'object'){ const o = {}; Object.keys(p.projOf).forEach(k => { if (typeof p.projOf[k] === 'string' && /^openrouter::./.test(k)) o[k] = p.projOf[k]; }); state.projOf = Object.assign(o, state.projOf || {}); }
}
function mergeIn(p, chats){
  if (p && typeof p === 'object'){
    mergeProjects(p);
    if (Array.isArray(p.fav)) state.fav = [...new Set([...(state.fav || []), ...p.fav.filter(x => typeof x === 'string')])];
    if (p.model && typeof p.model === 'object' && typeof p.model.openrouter === 'string') state.model = Object.assign({}, state.model, { openrouter:p.model.openrouter });
    if (typeof p.pinned === 'string' && p.pinned) state.pinned = p.pinned;
    if (typeof p.useTeam === 'string' && !state.useTeam) state.useTeam = p.useTeam;
    if (Array.isArray(p.del)) state.del = [...new Set([...(state.del || []), ...p.del.filter(x => typeof x === 'string')])].slice(-300);
    if (p.threads && typeof p.threads === 'object'){ state.threads = state.threads || {}; Object.keys(p.threads).forEach(m => { const L = state.threads[m] || (state.threads[m] = []); (Array.isArray(p.threads[m]) ? p.threads[m] : []).forEach(x => { if (!x || typeof x.id !== 'string') return; const e = L.find(y => y.id === x.id); if (!e) L.push({ id:x.id, title:String(x.title || '').slice(0, 80), t:+x.t || 0 }); else if ((+x.t || 0) > (e.t || 0)){ e.title = String(x.title || e.title).slice(0, 80); e.t = +x.t; } }); }); }
    if (Array.isArray(p.cmp) && p.cmp.length) state.cmp = p.cmp.filter(x => typeof x === 'string').slice(0, 4);
    if (p.sx && typeof p.sx === 'object'){ const l = state.sx || {}; state.sx = Object.assign({}, l, p.sx, { saved:Math.max(+l.saved || 0, +p.sx.saved || 0), hits:Math.max(+l.hits || 0, +p.sx.hits || 0) }); }
    if (p.arena && typeof p.arena === 'object'){ state.arena = state.arena || {}; Object.keys(p.arena).forEach(id => { const r = p.arena[id], l = state.arena[id]; if (r && typeof r === 'object' && (!l || (+r.t || 0) > (+l.t || 0))) state.arena[id] = { r:+r.r || 1000, w:+r.w || 0, l:+r.l || 0, t:+r.t || 0 }; }); }
    if (p.survey && typeof p.survey === 'object' && (!state.survey || (+p.survey.t || 0) > (+state.survey.t || 0))) state.survey = p.survey;
    if (p.battle) state.battle = true;
    if (p.portada) portadaMerge(p.portada);   /* v4.1 · «Ya tengo el Flow / Soy nuevo» viaja con la cuenta */
    if (p.mem && typeof p.mem === 'object'){ const m = cleanMem(p.mem); if ((+m.t || 0) > (+(state.mem && state.mem.t) || 0)) state.mem = m; }
    if (p.ledger && typeof p.ledger === 'object'){ syncLedger(); state.ledger = mergeLedger(state.ledger, cleanLedger(p.ledger)); }
    else if (p.usage && typeof p.usage === 'object' && !state.ledger.ep){ const leg = legacyRow(p.usage); if (Object.keys(leg).length){ syncLedger(); state.ledger = mergeLedger(state.ledger, { ep:state.ledger.ep, dev:{ legacy:leg } }); } }
    state.usage = usageOf(state.ledger); writeLedger();
  }
  (state.del || []).forEach(k => { delete state.chats[k]; delete (chats || {})[k]; });
  Object.keys(chats || {}).forEach(k => { const r = chats[k], l = state.chats[k]; if (Array.isArray(r) && /^openrouter::./.test(k) && (!Array.isArray(l) || r.length > l.length)) state.chats[k] = r.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'); });
}
/* ---------- Google Drive (opcional): una copia de tus chats en TU Drive, en la carpeta privada de la app ----------
   · Solo pide permiso para la carpeta oculta de SynthFlow (drive.appdata): no puede ver ni tocar tus otros archivos.
   · El permiso dura ~1 hora y vive solo en memoria; nunca se guarda ni se envía a SymphorIA.
   · Al traer la copia se MEZCLA con lo que tienes: nunca se borra un chat. Tus llaves no van en la copia. */
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata', DRIVE_FILE = 'synthflow-chats.json', DRIVE_API = 'https://www.googleapis.com';
const DRV = { tok:'', exp:0, fileId:'', busy:false, t:0, tc:null, cid:'' };
const driveMeta = () => { try{ return JSON.parse(localStorage.getItem('synthz:drive') || 'null'); }catch(e){ return null; } };
function driveSetMeta(v){ try{ if (v) localStorage.setItem('synthz:drive', JSON.stringify(v)); else localStorage.removeItem('synthz:drive'); }catch(e){} try{ dispatchEvent(new CustomEvent('synthz-drive', { detail:v })); }catch(e){} }
async function driveCid(){ await accConfig(); return ACC.dcid || ''; }
const driveLive = () => !!(DRV.tok && Date.now() < DRV.exp - 60000);
/* pide el permiso (debe llamarse dentro de un clic: Google abre una ventanita) */
function driveToken(prompt){
  return new Promise((ok, no) => {
    if (!window.google || !google.accounts || !google.accounts.oauth2) return no(Object.assign(new Error('No pude abrir el botón de Google. Revisa tu internet o tu bloqueador de anuncios.'), { gsi:true }));
    DRV.tc = google.accounts.oauth2.initTokenClient({ client_id:DRV.cid, scope:DRIVE_SCOPE, include_granted_scopes:false,
      callback:r => { if (r && r.access_token && google.accounts.oauth2.hasGrantedAllScopes(r, DRIVE_SCOPE)){ DRV.tok = r.access_token; DRV.exp = Date.now() + (+r.expires_in || 3600) * 1000; ok(true); } else no(new Error('No diste permiso para la carpeta de SynthFlow en tu Drive.')); },
      error_callback:e => no(new Error(e && e.type === 'popup_closed' ? 'Cerraste la ventana de Google antes de terminar.' : e && e.type === 'popup_failed_to_open' ? 'Tu navegador no dejó abrir la ventanita de Google. Permite las ventanitas de este sitio.' : 'Google no completó el permiso.')) });
    DRV.tc.requestAccessToken({ prompt:prompt == null ? '' : prompt });
  });
}
async function dfetch(path, o = {}){
  const r = await fetch(DRIVE_API + path, Object.assign({}, o, { headers:Object.assign({ Authorization:'Bearer ' + DRV.tok }, o.headers || {}) })).catch(() => null);
  if (!r) throw new Error('No pude hablar con Google Drive. Revisa tu conexión.');
  if (r.status === 401){ DRV.tok = ''; throw Object.assign(new Error('El permiso de Drive venció. Toca «Sincronizar» otra vez.'), { expired:true }); }
  if (r.status === 403){ const t = await r.text().catch(() => ''); throw new Error(/storageQuota|quota/i.test(t) ? 'Tu Google Drive está lleno.' : /accessNotConfigured|has not been used|disabled/i.test(t) ? 'Falta activar la «Google Drive API» en el proyecto de Google de SymphorIA (lo hace Prime una sola vez).' : 'Google Drive no dio permiso para guardar.'); }
  if (!r.ok) throw new Error('Google Drive respondió con un error (' + r.status + '). Intenta más tarde.');
  return r;
}
async function driveFind(){
  if (DRV.fileId) return DRV.fileId;
  const q = encodeURIComponent("name='" + DRIVE_FILE + "' and trashed=false");
  const d = await (await dfetch('/drive/v3/files?spaces=appDataFolder&fields=files(id,modifiedTime,size)&q=' + q)).json();
  const f = (d.files || [])[0]; DRV.fileId = f ? f.id : ''; return DRV.fileId;
}
async function drivePull(){
  const id = await driveFind(); if (!id) return 0;
  const d = await (await dfetch('/drive/v3/files/' + id + '?alt=media')).json().catch(() => null);
  if (!d || d.app !== 'SynthFlow' || typeof d.chats !== 'object') return 0;
  const before = Object.keys(state.chats).length;
  mergeIn(d.prefs || null, d.chats || {}); save();
  try{ hooks.chats(); }catch(e){}
  return Object.keys(state.chats).length - before;
}
async function drivePush(){
  const chats = {}; Object.keys(state.chats).forEach(k => { const a = state.chats[k]; if (Array.isArray(a) && a.length) chats[k] = a.map(m => ({ role:m.role, content:m.content, meta:m.meta, model:m.model, star:m.star || undefined, files:Array.isArray(m.files) ? m.files.map(f => ({ name:f.name, kind:f.kind })) : undefined })); });
  const prefs = prefsOut(); delete prefs.cfg;
  const body = JSON.stringify({ app:'SynthFlow', v:1, t:Date.now(), prefs, chats });
  const id = await driveFind();
  if (id) await dfetch('/upload/drive/v3/files/' + id + '?uploadType=media', { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body });
  else {
    const B = 'szb' + Math.random().toString(36).slice(2);
    const mp = '--' + B + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify({ name:DRIVE_FILE, parents:['appDataFolder'], mimeType:'application/json' }) + '\r\n--' + B + '\r\nContent-Type: application/json\r\n\r\n' + body + '\r\n--' + B + '--';
    const d = await (await dfetch('/upload/drive/v3/files?uploadType=multipart&fields=id', { method:'POST', headers:{ 'Content-Type':'multipart/related; boundary=' + B }, body:mp })).json();
    DRV.fileId = d.id || '';
  }
  const m = driveMeta() || {}; driveSetMeta(Object.assign(m, { linked:true, last:Date.now(), size:body.length, n:Object.keys(chats).length }));
  return body.length;
}
/* vincular o sincronizar (dentro de un clic): trae lo que haya en tu Drive, lo mezcla y sube la copia al día */
async function driveSync(o = {}){
  if (DRV.busy) return { busy:true };
  DRV.cid = await driveCid();
  if (!DRV.cid) throw Object.assign(new Error('Guardar en Google Drive todavía no está disponible. Muy pronto.'), { off:true });
  await loadGsi();
  if (!driveLive()) await driveToken(driveMeta() ? '' : 'consent');
  DRV.busy = true;
  try{ const got = await drivePull(); const size = await drivePush(); return { got, size }; }
  finally{ DRV.busy = false; }
}
/* con el permiso vivo, cada cambio se sube solo (cada 30 s como mucho) */
function driveSchedule(){ if (!driveLive() || !(driveMeta() || {}).linked) return; clearTimeout(DRV.t); DRV.t = setTimeout(() => { if (driveLive() && !DRV.busy){ DRV.busy = true; drivePush().catch(() => {}).finally(() => { DRV.busy = false; }); } }, 30000); }
function driveUnlink(){ try{ if (DRV.tok && window.google && google.accounts && google.accounts.oauth2) google.accounts.oauth2.revoke(DRV.tok, () => {}); }catch(e){} DRV.tok = ''; DRV.exp = 0; DRV.fileId = ''; driveSetMeta(null); }
const DRIVE = { sync:driveSync, unlink:driveUnlink, meta:driveMeta, live:driveLive, cid:driveCid, preload:() => loadGsi().catch(() => {}) };
function takeLedger(L){ if (!L || typeof L !== 'object') return; syncLedger(); state.ledger = mergeLedger(state.ledger, cleanLedger(L)); state.usage = usageOf(state.ledger); writeLedger(); hooks.usage(); }
async function accPull(d){
  mergeIn(d.prefs || null, {});
  takeLedger(d.ledger); ACC.lgT = Date.now();
  const want = (d.chatKeys || []).filter(k => !(state.del || []).includes(k));
  for (let i = 0; i < want.length; i += 20){
    const q = want.slice(i, i + 20).map(k => 'k=' + encodeURIComponent(k)).join('&');
    try{ const r = await api('chats?' + q); mergeIn(null, r.chats || {}); }catch(e){}
  }
  if (d.key && !state.keys.openrouter){ state.keys.openrouter = d.key; state.syncKey = true; }
  (d.chatKeys || []).forEach(k => { const a = state.chats[k]; if (Array.isArray(a)){ const s = JSON.stringify(slimChat(a)); accSent[k] = s.length + ':' + hashS(s); } });
  save();
}
async function accPush(o){
  if (!ACC.ready || !SESS) return;
  o = o || {};
  try{
    syncLedger();
    const L = state.ledger, mine = {}; [DEV, 'legacy'].forEach(id => { if (L.dev[id]) mine[id] = L.dev[id]; });
    const items = [], marks = {};
    Object.keys(state.chats).forEach(k => { const a = state.chats[k]; if (!Array.isArray(a) || !a.length || !/^openrouter::./.test(k)) return; const s = JSON.stringify(slimChat(a)), h = s.length + ':' + hashS(s); if (accSent[k] !== h){ items.push({ k, data:slimChat(a) }); marks[k] = h; } });
    const del = (state.del || []).filter(k => !accDelSent.has(k));
    /* una sola petición lleva preferencias, SynXCoin's y los chats que cambiaron (menos viajes al servidor) */
    const first = items.slice(0, 20), want = o.ledger || Date.now() - (ACC.lgT || 0) > 60000;
    const res = await api('me', { method:'PUT', body:Object.assign({ prefs:prefsOut(), ledger:{ ep:L.ep, dev:mine }, wantLedger:want }, first.length || del.length ? { chats:{ items:first, del } } : {}, state.syncKey ? { key:state.keys.openrouter || '' } : {}) });
    if (res.ledger){ takeLedger(res.ledger); ACC.lgT = Date.now(); }
    if (res.chats && res.chats.max) ACC.space = { used:res.chats.used, max:res.chats.max }; ACC.full = false;
    first.forEach(x => { accSent[x.k] = marks[x.k]; }); del.forEach(k => { accDelSent.add(k); delete accSent[k]; });
    for (let i = 20; i < items.length; i += 20){
      const part = items.slice(i, i + 20);
      await api('chats', { method:'POST', body:{ items:part, del:[] } });
      part.forEach(x => { accSent[x.k] = marks[x.k]; });
    }
    ACC.t = Date.now(); ACC.err = '';
  }catch(e){
    ACC.err = e.message || 'No pude guardar en tu cuenta.';
    if (e.status === 413){ if (!ACC.full) toast(ACC.err); ACC.full = true; }                     /* nube llena: no reintenta hasta que liberes espacio */
    else if (e.status !== 401){ clearTimeout(accT); accT = setTimeout(accPush, 20000); }
  }
  accFire('push');
}
/* espera 6 s sin cambios antes de subir (agrupa mensaje y respuesta en una sola subida) y sube al salir de la pestaña */
function accSchedule(){ if (typeof ACC === 'undefined' || !ACC || !ACC.ready) return; clearTimeout(accT); accT = setTimeout(accPush, 6000); }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && ACC && ACC.ready && accT){ clearTimeout(accT); accT = 0; accPush(); } });
/* Los datos de este navegador son de UNA cuenta (state.owner) o de nadie (''): así nunca se mezclan dos cuentas.
   Al cerrar sesión se guardan en la nube y se borran de aquí; si entra otra cuenta y quedaron datos ajenos, se borran antes. */
function wipeAccountData(){
  state.chats = {}; state.threads = {}; state.fav = []; state.cmp = []; state.pinned = ''; state.del = []; state.arena = {}; state.survey = null;
  state.projects = []; state.projOf = {}; state.pjDel = []; state.curProj = '';
  delete state.useTeam; delete state.intent; state.battle = false;
  state.sx = { daily:0, saver:false, saved:0, hits:0, over:'', warned:'' };
  if (state.syncKey){ delete state.keys.openrouter; state.syncKey = false; }   /* esa llave vive en la cuenta: no se queda en un navegador ajeno */
  state.ledger = { ep:0, dev:{} }; state.usage = {}; writeLedger();
  accSent = {}; accDelSent = new Set();
  if (IDB.ready){ try{ IDB.db.transaction('chats', 'readwrite').objectStore('chats').clear(); }catch(e){} Object.keys(idbHash).forEach(k => delete idbHash[k]); }
  state.owner = ''; save();
}
async function accStart(){
  if (ACC.ready || ACC.busy || !SESS) return;
  try{ await chatsReady; }catch(e){}
  await sessMove;
  ACC.busy = true; accFire('start');
  try{
    const d = await api('me'); ACC.user = d.user; ACC.profile = d.profile || null; ACC.space = d.space || null;
    if (state.owner && state.owner !== d.user.sub) wipeAccountData();   /* quedaron datos de otra cuenta: no se suben a esta */
    state.owner = d.user.sub;
    await accPull(d); ACC.ready = true; ACC.err = '';
    await accPush();
  }catch(e){ ACC.err = e.status === 401 ? '' : (e.message || 'No pude abrir tu cuenta.'); }
  ACC.busy = false; accFire('pull'); hooks.usage();
}
/* cierra sesión: primero guarda en la nube; si no pudo, avisa (force = cerrar igual) */
async function accSignOut(force){
  if (ACC.ready){ ACC.err = ''; try{ await accPush(); }catch(e){} if (ACC.err && !force) throw Object.assign(new Error(ACC.err), { unsynced:true }); }
  try{ await api('auth', { method:'DELETE', keep:true }); }catch(e){}
  try{ if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect(); }catch(e){}
  setSess(''); ACC.ready = false; ACC.user = null; ACC.profile = null;
  wipeAccountData();
  accFire('out');
}
/* cerrar sesión en TODOS tus dispositivos (este incluido) */
async function accSignOutAll(force){
  if (ACC.ready){ ACC.err = ''; try{ await accPush(); }catch(e){} if (ACC.err && !force) throw Object.assign(new Error(ACC.err), { unsynced:true }); }
  await api('auth?all=1', { method:'DELETE', keep:true });
  setSess(''); ACC.ready = false; ACC.user = null; ACC.profile = null; wipeAccountData(); accFire('out');
}
async function accClaim(setup){ const d = await api('auth', { method:'POST', body:{ mode:'claim', setup }, keep:true }); if (ACC.user){ ACC.user.role = d.role; ACC.user.claimable = false; } accFire('profile'); return d.role; }
/* rangos de SymphorIA */
const ROLE_NAME = { owner:'Prime', admin:'ZFlow', staff:'Symmetrix', user:'Synther' };
/* si otra pestaña cerró sesión o cambió de cuenta, esta se recarga para no mostrar ni guardar datos ajenos */
addEventListener('storage', e => { if (e.key === 'synthz:sess' && (e.newValue || '') !== SESS) location.reload(); });
async function accDelete(confirm){
  await api('me', { method:'DELETE', body:confirm || {}, keep:true }); setSess(''); ACC.ready = false; ACC.user = null; ACC.profile = null; wipeAccountData(); accFire('out');
}
async function saveProfile(p){ const d = await api('me', { method:'PUT', body:{ profile:p } }); ACC.profile = d.profile; accFire('profile'); return d.profile; }
const accHandle = u => { u = u || ACC.user || {}; return u.username ? '@' + u.username : (u.email || ''); };
const accName = () => (ACC.profile && ACC.profile.name) || (ACC.user && ACC.user.name) || 'Tú';
const TINTS = { aurora:['#8fb0ff', '#c9566c', '#ff8f7a'], azul:['#5b8cff', '#8fb0ff', '#6fd3d6'], violeta:['#7c5cff', '#a98bff', '#ff9ed8'], coral:['#ff8f7a', '#ffb36b', '#ff9ed8'], menta:['#46d6a8', '#6fd3d6', '#8fb0ff'], oro:['#f2c46b', '#ffb36b', '#ff8f7a'], rosa:['#ff9ed8', '#ff8f7a', '#c9566c'], noche:['#3a3f63', '#5b5f8f', '#8fb0ff'] };
const tint = c => TINTS[c] || TINTS.aurora;
const grad = c => 'linear-gradient(135deg,' + tint(c).join(',') + ')';
function avatarHtml(pf, user, cls){
  pf = pf || {}; const a = pf.avatar || { type:user && user.picture ? 'google' : 'initial' }, name = pf.name || (user && user.name) || '?';
  const bg = 'background:' + grad(pf.color);
  if (a.type === 'google' && user && user.picture) return '<span class="av-me ' + (cls || '') + '" style="' + bg + '"><img src="' + esc(user.picture) + '" alt="" referrerpolicy="no-referrer" loading="lazy"></span>';
  if (a.type === 'emoji' && a.emoji) return '<span class="av-me emo ' + (cls || '') + '" style="' + bg + '">' + esc(a.emoji) + '</span>';
  return '<span class="av-me ' + (cls || '') + '" style="' + bg + '">' + esc(String(name).trim().slice(0, 1).toUpperCase() || '?') + '</span>';
}
const myAvatar = cls => avatarHtml(ACC.profile, ACC.user, cls);
if (SESS) setTimeout(accStart, 0);
/* «Pulsem» en la barrita: solo para Prime, ZFlow y Symmetrix */
const paintPulse = () => { const b = document.getElementById('railPulse'); if (b) b.hidden = !(ACC.ready && ACC.user && ['owner', 'admin', 'staff'].includes(ACC.user.role)); };
accHooks.push(paintPulse);

