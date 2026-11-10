/* ---------- guardado robusto: un registro por conversación en IndexedDB ---------- */
const IDB = { db:null, ready:false };
const idbHash = {}; let idbT = 0;
function idbOpen(){ return new Promise(res => { try{ const r = indexedDB.open('synthz', 1); r.onupgradeneeded = () => { try{ r.result.createObjectStore('chats'); }catch(e){} }; r.onsuccess = () => { IDB.db = r.result; res(true); }; r.onerror = () => res(false); r.onblocked = () => res(false); }catch(e){ res(false); } }); }
function idbAll(){ return new Promise(res => { const out = {}; try{ const req = IDB.db.transaction('chats').objectStore('chats').openCursor(); req.onsuccess = () => { const c = req.result; if (c){ out[c.key] = c.value; c.continue(); } else res(out); }; req.onerror = () => res(out); }catch(e){ res(out); } }); }
function idbFlush(){
  if (!IDB.ready) return;
  try{
    const tx = IDB.db.transaction('chats', 'readwrite'), os = tx.objectStore('chats');
    Object.keys(state.chats).forEach(k => { const a = state.chats[k]; if (!Array.isArray(a)) return; const L = a[a.length - 1], h = a.length + ':' + (L ? (L.content || '').length + ':' + hashS(String(L.content || '').slice(-200)) + ':' + (L.meta || '') : ''); if (idbHash[k] !== h){ if (a.length) os.put(a, k); else os.delete(k); idbHash[k] = h; } });
    Object.keys(idbHash).forEach(k => { if (!(k in state.chats)){ os.delete(k); delete idbHash[k]; } });
    tx.onerror = () => toast('No pude guardar tus chats: se llenó el espacio en este equipo. Borra chats viejos o descarga una copia.');
  }catch(e){}
}
const chatsReady = idbOpen().then(async ok => {
  if (!ok) return false;
  const stored = await idbAll();
  Object.keys(stored).forEach(k => { const a = stored[k]; if (Array.isArray(a) && (!Array.isArray(state.chats[k]) || a.length >= state.chats[k].length)) state.chats[k] = a; });
  state.chats = cleanChats(state.chats);
  IDB.ready = true; idbFlush();
  try{ localStorage.setItem(KEY, JSON.stringify(Object.assign({}, state, { chats:{}, ledger:undefined, usage:undefined }))); }catch(e){}
  try{ if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
  try{ hooks.chats(); }catch(e){}
  return true;
});
/* ---------- consumo por proveedor ---------- */
const provOf = id => /^sz:/.test(String(id)) ? 'synthz' : /^pu:/.test(String(id)) ? 'puter' : /^tr:/.test(String(id)) ? 'trial' : /^gq:/.test(String(id)) ? 'groq' : 'openrouter';
/* ---------- prueba guiada que paga SymphorIA: 5 mensajes, solo para aprender en la guía ---------- */
const TRIAL_KEY = 'synthz:trial';
function trialGet(){ try{ return JSON.parse(localStorage.getItem(TRIAL_KEY) || 'null'); }catch(e){ return null; } }
function trialSet(v){ try{ localStorage.setItem(TRIAL_KEY, JSON.stringify(v)); }catch(e){} try{ dispatchEvent(new CustomEvent('synthz-trial', { detail:v })); }catch(e){} }
async function trialStart(){
  const t = trialGet(); if (t && t.token) return t;
  const d = await api('trial', { method:'POST', body:{ action:'start' }, keep:true });
  const v = { token:d.token, left:d.left, max:d.max }; trialSet(v); return v;
}
const totalAll = () => Object.keys(state.usage || {}).reduce((a, k) => a + total(k), 0);
const estAll = () => Object.keys(state.usage || {}).reduce((a, k) => a + ((state.usage[k] || {}).est || 0), 0);
const todayEst = () => { const d = today(); return Object.keys(state.usage || {}).reduce((a, k) => a + (((state.usage[k] || {}).estDays || {})[d] || 0), 0); };
const todayReq = (pid, freeOnly) => { const u = (state.usage || {})[pid] || {}; return ((freeOnly ? u.freeDays : u.reqDays) || {})[today()] || 0; };
const todayAll = () => { const d = today(); return Object.keys(state.usage || {}).reduce((a, k) => a + (((state.usage[k] || {}).days || {})[d] || 0), 0); };
/* ---------- SynXCoin's: lo disponible según cada proveedor + desglose honesto del consumo ---------- */
let balC = null, balT = 0;
async function providerBalance(force){
  if (!force && balC && Date.now() - balT < 60000) return balC;
  const out = {};
  const jobs = [];
  if (window.puter && puter.auth && typeof puter.auth.isSignedIn === 'function' && puter.auth.isSignedIn() && typeof puter.auth.getMonthlyUsage === 'function')
    jobs.push(puter.auth.getMonthlyUsage().then(u => { const a = u && u.allowanceInfo; out.puter = a && +a.monthUsageAllowance > 0 ? { pct:Math.max(0, Math.min(1, +a.remaining / +a.monthUsageAllowance)) } : { na:true }; }).catch(() => { out.puter = { err:true }; }));
  const k = state.keys.openrouter;
  if (k) jobs.push(fetch('https://openrouter.ai/api/v1/key', { headers:{ Authorization:'Bearer ' + k } }).then(async r => {
    if (!r.ok){ out.openrouter = { err:r.status }; return; }
    const d = ((await r.json()) || {}).data || {};
    out.openrouter = { freeTier:!!d.is_free_tier, limit:d.limit == null ? null : +d.limit, left:d.limit_remaining == null ? null : +d.limit_remaining };
  }).catch(() => { out.openrouter = { err:true }; }));
  await Promise.all(jobs);
  balC = out; balT = Date.now();
  return out;
}
/* bloque «Disponible»: solo datos que da el proveedor; lo que no se sabe, se dice */
function balanceHtml(b, extra){
  const row = (ico, name, main, sub) => '<div class="bl-row">' + ico + '<div><b>' + name + '</b><span>' + main + '</span>' + (sub ? '<small>' + sub + '</small>' : '') + '</div></div>';
  let h = '';
  const pu = b.puter;
  h += row(puterLogo(), 'Puter', pu && pu.pct != null ? t('bal.puLeft', { p:'<em>' + Math.round(pu.pct * 100) + '%</em>' }) : pu && pu.err ? t('bal.puErr') : window.puter && puter.auth && puter.auth.isSignedIn && puter.auth.isSignedIn() ? t('bal.puWait') : t('bal.puOpt'), t('bal.puSub'));
  const or = b.openrouter, fr = todayReq('openrouter', true);
  const orMain = or && !or.err
    ? 'Modelos gratis: <em>' + fmt(fr) + '</em> de ' + (or.freeTier ? '50' : '50 (o 1.000 si compraste 10 créditos o más)') + ' mensajes hoy'
    : or && or.err === 401 ? 'OpenRouter dice que tu llave no es válida.' : or && or.err ? 'OpenRouter no respondió con tu saldo.' : state.useTeam ? 'Usas el OpenRouter de tu equipo (mira el límite abajo).' : 'Pega tu llave de OpenRouter para ver tus límites.';
  const orSub = or && !or.err ? (or.limit != null && or.left != null ? 'Crédito de tu llave: quedan $' + or.left.toFixed(2) + ' de $' + or.limit.toFixed(2) + ' · ' : 'Tu llave no tiene tope de crédito · ') + 'los mensajes de hoy los cuenta Sinapse en tus dispositivos' : '';
  void orMain; void orSub;
  if (extra) h += extra;
  return '<div class="bl">' + h + '</div>';
}
/* desglose: confirmado (lo reportó el proveedor) vs estimado (≈, SymphorIA lo calculó por el largo del texto) */
function splitHtml(){ return limBar({ puter:true }); }
function syncNote(){
  if (!ACC.ready) return signedish() ? '<p class="cnote">' + t('sync.opening') + '</p>' : '<p class="cnote">' + t('sync.local') + '</p>';
  if (ACC.full) return '<p class="sxerr">⚠ ' + esc(ACC.err) + '</p>';
  if (ACC.err) return '<p class="sxerr">⚠ ' + t('sync.err', { e:esc(ACC.err) }) + '</p>';
  return '<p class="cnote">' + t('sync.saved') + (ACC.t ? ' · ' + t('sync.ago', { s:Math.max(1, Math.round((Date.now() - ACC.t) / 1000)) }) : '') + '.</p>';
}

/* secciones que se abren y cierran suave (alto + desenfoque), SynthZ Style */
function smoothDetails(scope){
  $$('details', scope).forEach(d => {
    const s = $('summary', d), body = () => [...d.children].filter(x => x !== s);
    s.addEventListener('click', e => {
      if (reduce || !CFG.anim) return;                       /* modo rendimiento: abre al instante */
      e.preventDefault();
      if (d._anim) d._anim.cancel();
      const from = d.offsetHeight, opening = !d.open;
      if (opening) d.open = true;
      const to = opening ? d.scrollHeight : s.offsetHeight + parseFloat(getComputedStyle(d).borderTopWidth || 0);
      d.style.overflow = 'hidden';
      d._anim = d.animate([{ height:from + 'px' }, { height:to + 'px' }], { duration:opening ? 520 : 380, easing:'cubic-bezier(.22,1,.36,1)' });
      body().forEach(x => x.animate(opening ? [{ opacity:0, filter:'blur(6px)', transform:'translateY(-6px)' }, { opacity:1, filter:'blur(0)', transform:'none' }] : [{ opacity:1, filter:'blur(0)' }, { opacity:0, filter:'blur(4px)' }], { duration:opening ? 520 : 260, easing:'cubic-bezier(.22,1,.36,1)', fill:'both' }));
      d._anim.onfinish = () => { d._anim = null; d.style.overflow = ''; if (!opening) d.open = false; body().forEach(x => x.getAnimations().forEach(a => a.cancel())); };
    });
  });
}
