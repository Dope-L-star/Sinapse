/* ---------- IA que no funcionan: se esconden para que nadie choque con ellas ----------
   Cada navegador recuerda las que fallaron por culpa del modelo (no de tu llave) y las comparte con SymphorIA.
   Si varias personas reportan la misma, se esconde para todos unas horas; si vuelve a responder, reaparece. */
const BAD_KEY = 'synthz:bad', BAD_MS = 12 * 3600e3;
let BAD = {}; try{ BAD = JSON.parse(localStorage.getItem(BAD_KEY)) || {}; }catch(e){ BAD = {}; }
const saveBad = () => { try{ localStorage.setItem(BAD_KEY, JSON.stringify(BAD)); }catch(e){} };
function isBad(id){ const t = BAD[id]; return !!t && Date.now() - t < BAD_MS; }
/* ¿el error es culpa del modelo? (y no de la llave, el saldo, el límite o la privacidad de la cuenta) */
function modelGone(status, msg){
  msg = String(msg || '');
  if (/data policy|guardrail|ZDR|privacy|api key|unauthor|credit|insufficient|rate.?limit|too many|quota/i.test(msg)) return false;
  return status === 404 || /not a valid model|unavailable for free|no endpoints found|model.{0,20}(not found|does not exist|decommission|deprecat)|model_not_found|no longer (available|supported)/i.test(msg);
}
function markBad(id, share){
  if (!id || /^tr:/.test(id)) return;
  BAD[id] = Date.now(); saveBad();
  if (share !== false) fetch('/api/health', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ id, ok:false }), keepalive:true }).catch(() => {});
}
/* v3.8 · una IA que no responde AHORA (llena o lenta) se esconde solo un rato y vuelve sola */
function markSick(id, ms){ if (!id || /^tr:/.test(id)) return; BAD[id] = Date.now() - BAD_MS + (ms || 10 * 60e3); saveBad(); }
function markGood(id){
  if (BAD[id]){ delete BAD[id]; saveBad(); }
  try{ const k = 'synthz:good:' + id; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); }catch(e){}
  if (SRV_BAD.has(id)) fetch('/api/health', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ id, ok:true }), keepalive:true }).catch(() => {});
}
const SRV_BAD = new Set();
const badReady = fetch('/api/health').then(r => r.ok ? r.json() : { bad:[] }).then(d => { (d.bad || []).forEach(x => { if (x && typeof x.id === 'string'){ SRV_BAD.add(x.id); if (!BAD[x.id]) BAD[x.id] = +x.t || Date.now(); } }); saveBad(); return SRV_BAD; }).catch(() => SRV_BAD);
const groqName = id => String(id).replace(/^[^/]+\//, '').split(/[-_]/).map(w => /^gpt$/i.test(w) ? 'GPT' : /^oss$/i.test(w) ? 'OSS' : /^\d+(\.\d+)?b$/i.test(w) ? w.toUpperCase() : /^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
/* ===== IA de SymphorIA: modelos gratis compartidos, con un tope diario por persona ===== */
const DEVH = (/^[\w-]{12,48}$/.test(DEV) ? DEV : (String(DEV).replace(/[^\w-]/g, '') + 'synthzdevice').slice(0, 24));
const SZQ = { on:null, used:0, limit:20000, n:0, t:0, guest:null };
function szqSet(o){
  /* v3.7 · la pila nunca «sube» sola en el día: si llegan dos respuestas a la vez (Comparar, revisión), la que trae un número viejo no la devuelve hacia arriba.
     Solo se acepta que baje el gasto cuando de verdad se renovó (medianoche: vuelve a casi cero) */
  if (o && typeof o.used === 'number' && typeof SZQ.used === 'number' && o.used < SZQ.used && o.used > SZQ.used * .5 && !o.reset){ o = Object.assign({}, o); delete o.used; }
  Object.assign(SZQ, o); try{ dispatchEvent(new CustomEvent('synthz-szq', { detail:SZQ })); }catch(e){} }
const szHeaders = () => { const h = { 'content-type':'application/json', 'x-sz-device':DEVH }; if (SESS) h.authorization = 'Bearer ' + SESS; return h; };
const SZ_VEND = [[/llama|meta/i, 'meta-llama'], [/gemma|gemini/i, 'google'], [/mistral|mixtral|codestral|ministral|magistral|devstral|pixtral|open-mi/i, 'mistralai'], [/qwen|qwq/i, 'qwen'], [/deepseek/i, 'deepseek'], [/gpt-oss|openai/i, 'openai'], [/kimi|moonshot/i, 'moonshotai'], [/glm|z-ai/i, 'z-ai'], [/nemotron|nvidia/i, 'nvidia'], [/phi-|microsoft/i, 'microsoft'], [/granite|ibm/i, 'ibm'], [/hermes|nous/i, 'nousresearch']];
const szVendor = (mid, prov) => (SZ_VEND.find(([rx]) => rx.test(mid)) || [0, prov])[1];
const SZ_AUTO = { id:'sz:auto', name:'Automática', vendor:'synthz', vlabel:'Elige sola la mejor', ctx:0, free:true, created:4e9, vision:true, reasoning:true, tools:false, desc:'Elige sola la mejor IA que esté libre en este momento. Si una se llena, pasa a otra sin que hagas nada.' };
/* ---------- límite de hoy: se muestra en mensajes (más fácil que contar «tokens») ---------- */
const MSG_TOK = 800;
/* sin cuenta: unos pocos mensajes de prueba al día; luego hay que entrar (gratis) */
/* con sesión guardada (o volviendo de Google) ya cuentas como persona con cuenta, aunque tu cuenta tarde un segundo en cargar */
const signedish = () => !!(ACC && (ACC.ready || ACC.joining || (SESS && !ACC.err)));
const isGuestQ = () => !!(SZQ.guest && !signedish());
const guestFull = () => isGuestQ() && (SZQ.guest.used || 0) >= (SZQ.guest.max || 5);
const limPct = () => Math.max(SZQ.limit ? Math.min(1, (SZQ.used || 0) / SZQ.limit) : 0, isGuestQ() ? Math.min(1, (SZQ.guest.used || 0) / (SZQ.guest.max || 5)) : 0);
const msgsLeft = () => Math.max(0, Math.floor(((SZQ.limit || 25000) - (SZQ.used || 0)) / MSG_TOK));
const msgsTotal = () => Math.max(1, Math.round((SZQ.limit || 25000) / MSG_TOK));
/* v2.4: vuelven las SynXCoin's. 1 SynXCoin = 1 palabra (lo que escribes y lo que te responde). El servidor cuenta en tokens; una palabra son unos 4/3 de token */
const WORD_TOK = 4 / 3;
const coinsOf = tok => Math.max(0, Math.round((+tok || 0) / WORD_TOK));
const coinsLeft = () => coinsOf((SZQ.limit || 25000) - (SZQ.used || 0));
const coinsTotal = () => coinsOf(SZQ.limit || 25000);
const coinsFmt = n => Math.round(n).toLocaleString('es');
const coinsShort = n => n >= 10000 ? (Math.floor(n / 100) / 10).toLocaleString('es') + ' mil' : coinsFmt(n);
/* v3.0 · batería en vez de palabras (Sammuel, 27 oct): el límite del día se ve como una pila que se descarga y se carga a medianoche */
/* v3.7 · EnerX de verdad (Sammuel, 2 nov): cada respuesta dice cuánto gastó de verdad (con decimales si es poquito, ya no «1 %» fijo)
   y la batería muestra el mismo número, así lo que dice la respuesta y lo que baja la pila siempre cuadran. */
const pctFmt = x => { x = Math.max(0, Math.min(100, x)); const d = x >= 99.95 || x <= 0 || Number.isInteger(Math.round(x * 10) / 10) && Math.round(x * 10) % 10 === 0 ? 0 : 1; return (Math.round(x * 10) / 10).toFixed(d).replace('.', LANG === 'en' ? '.' : ','); };
const battPct = () => pctFmt((1 - limPct()) * 100);
const spentPct = tok => { const x = (+tok || 0) / (SZQ.limit || 25000) * 100; return x > 0 && x < .1 ? (LANG === 'en' ? 'less than 0.1' : 'menos de 0,1') : pctFmt(x); };
const coinNote = (mid, r) => /^sz:/.test(String(mid)) && r && !r.cached && ((r.prompt || 0) + (r.completion || 0)) > 0 ? (isGuestQ() ? t('enerx.usedGuest', { n:guestLeft() }) : t('enerx.used', { u:spentPct((r.prompt || 0) + (r.completion || 0)), n:battPct() })) : '';
const guestLeft = () => Math.max(0, (SZQ.guest.max || 5) - (SZQ.guest.used || 0));
const limTxt = () => SZQ.on === false ? t('enerx.rest') : guestFull() ? t('enerx.signin') : isGuestQ() ? t('enerx.guestLeft', { n:guestLeft() }) : limPct() >= 1 ? t('enerx.empty') : t('enerx.left', { n:battPct() });
const limShort = () => SZQ.on === false ? t('enerx.restShort') : guestFull() ? t('enerx.signinShort') : isGuestQ() ? t('enerx.guestShort', { n:guestLeft() }) : limPct() >= 1 ? t('enerx.emptyShort') : battPct() + ' %';
const limLvl = () => { const k = limPct(); return k >= 1 ? 'full' : k >= .8 ? 'warn' : 'ok'; };
/* la pila: cuerpo de vidrio, polo y carga que baja; con poca carga se pone ámbar y vacía, coral. size = alto de referencia (antes era el anillo) */
function limRing(size){
  const k = 1 - limPct(), h = size || 22, w = Math.round(h * 1.5), fw = Math.max(k > 0 ? 2 : 0, 27 * k);
  return '<svg class="lring lbatt ' + limLvl() + '" viewBox="0 0 36 24" width="' + w + '" height="' + h + '" aria-hidden="true"><rect x="1.5" y="3.5" width="30" height="17" rx="5" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.55)" stroke-width="1.6"/><rect x="32.6" y="9" width="2.6" height="6" rx="1.3" fill="rgba(255,255,255,.55)"/><rect class="lb-f" x="3.5" y="5.5" width="' + fw.toFixed(1) + '" height="13" rx="3.4" fill="currentColor"/><rect x="3.5" y="5.5" width="26" height="4.5" rx="2.2" fill="#fff" opacity=".18"/></svg>';
}
function limBar(o = {}){
  const k = 1 - limPct();
  return '<div class="lbar ' + limLvl() + '"><div class="lb-h"><b>' + (o.title || t('enerx.today')) + '</b><span>' + limTxt() + '</span></div><div class="lb-t"><i style="transform:scaleX(' + k.toFixed(3) + ')"></i></div>' + (o.small === false ? '' : '<small>' + (isGuestQ() ? t('enerx.guest', { n:SZQ.guest.max || 5 }) + ' ' : '') + t('enerx.small') + (o.puter ? ' ' + t('enerx.puter') : '') + '</small>') + '</div>';
}
/* v3.4 · las IAs conectadas que ven fotos (el servidor usa la misma lista: api/_pool.js VISION_RX). Automática también: con fotos elige sola una que ve */
const SZ_VISION = /gemini|gemma-3(?!n)|llama-4|pixtral|mistral-(small|medium)|[-_/]vl\b|-vl-|vision|qwen2\.5-vl|kimi-vl/i;
async function szCatalog(){
  let r; try{ r = await fetch('/api/ai', { headers:szHeaders() }); }catch(e){ throw Object.assign(new Error('net'), { net:true }); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok){ szqSet({ on:false, t:Date.now() }); return []; }
  const arr = Array.isArray(d.models) ? d.models : [];
  szqSet({ on:arr.length > 0, used:+d.used || 0, limit:+d.limit || 20000, guest:d.guest && d.guest.max ? { used:+d.guest.used || 0, max:+d.guest.max } : null, img:d.img || null, team:!!d.team, alert:!!d.alert, alertN:+d.alertN || 0, n:arr.length, t:Date.now() });
  if (!arr.length) return [];
  const out = arr.filter(m => m && typeof m.id === 'string' && /^sz:/.test(m.id) && !/allam|infron|openrouter\/(free|auto)|models?[-_ ]router/i.test(m.id) && !/free models router|router/i.test(String(m.name || ''))).map(m => {
    const mid = m.id.split(':').slice(2).join(':'), vendor = szVendor(mid, m.prov);
    return { id:m.id, name:String(m.name || mid).replace(/\s*\(free\)\s*$/i, ''), vendor, vlabel:vendorLabel(vendor) + ' · SymphorIA', ctx:num(m.ctx), free:true, created:0, vision:['google', 'groq', 'mistral', 'openrouter'].includes(m.prov) && SZ_VISION.test(mid),
      reasoning:/gpt-oss|qwen3|qwq|r1|reason|think|magistral|kimi|deepseek/i.test(mid), tools:false, desc:'Gratis: no necesitas cuenta ni nada.' };
  });
  return [SZ_AUTO, ...out];
}
/* créditos de Puter: si ya no te quedan, ni lo intento (así Puter no muestra su ventana de «saldo bajo») */
let puC = { t:0, out:false };
async function puterOut(force){
  if (!force && Date.now() - puC.t < 300000) return puC.out;
  try{
    if (!(window.puter && puter.auth && typeof puter.auth.getMonthlyUsage === 'function' && puter.auth.isSignedIn())) return false;
    const u = await Promise.race([puter.auth.getMonthlyUsage(), sleepRaw(2500).then(() => null)]); if (!u) return puC.out;
    const a = u.allowanceInfo || {}, tot = +a.monthUsageAllowance || 0, rem = +a.remaining;
    puC = { t:Date.now(), out:tot > 0 && Number.isFinite(rem) && rem < Math.max(1, tot * .01) };
  }catch(e){ puC = { t:Date.now(), out:puC.out }; }
  return puC.out;
}
const puterSetOut = () => { puC = { t:Date.now(), out:true }; };
let puOutNoted = false;
function puterOutNote(){ if (puOutNoted) return; puOutNoted = true; toast('Usaste el saldo de este mes de Puter: sigo con las IAs conectadas'); telEv('puter_out', ''); try{ dispatchEvent(new CustomEvent('synthz-puter-out')); }catch(e){} }
/* Puter abre su propia ventana de «Low Balance / Upgrade Now»: en SymphorIA no se muestra (pasamos a las IAs conectadas sin cobrar nada) */
(function noPuterUpsell(){
  const RX = /low balance|upgrade now|insufficient funds|out of credits|add credits|top.?up/i;
  const txt = n => { try{ return (n.textContent || '') + ' ' + (n.shadowRoot ? n.shadowRoot.textContent || '' : ''); }catch(e){ return ''; } };
  const STRONG = /low balance|upgrade now/i;
  const check = n => { if (!n || n.nodeType !== 1 || !n.isConnected || n.closest('#szBotP,.szm,#portal')) return; const tag = n.tagName || '', t = txt(n), theirs = /^PUTER|DIALOG/.test(tag) || /puter/i.test(n.id || '') || /puter/i.test(String(n.className || '')); if (STRONG.test(t) || (theirs && RX.test(t))){ n.remove(); puterSetOut(); } };
  const start = () => { try{ new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { check(n); [60, 300, 1200].forEach(t => setTimeout(() => check(n), t)); }))).observe(document.body, { childList:true }); }catch(e){} };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();

