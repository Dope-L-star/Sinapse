(() => {
'use strict';
const { $, $$, esc, fmt, toast, api } = SZ;
const KIND = { error:['Error de IA', 'bad'], jserror:['La página falló', 'bad'], reload:['Recargó la página', 'warn'], confused:['Se ve perdido/a', 'warn'], noai:['Sin IA', 'bad'], limit:['Llegó al tope del día', 'warn'], puter_out:['Sin créditos de Puter', 'warn'], slow:['Va lento', 'warn'] };
const PROVS = [['groq', 'Groq', 'https://console.groq.com/keys', 'Llave de Groq (gsk_…)'], ['mistral', 'Mistral', 'https://console.mistral.ai/api-keys', 'Llave de Mistral'], ['cloudflare', 'Cloudflare', 'https://dash.cloudflare.com/profile/api-tokens', 'Token de Cloudflare (Workers AI)'], ['openrouter', 'OpenRouter', 'https://openrouter.ai/keys', 'Llave de OpenRouter (sk-or-…)'],
  ['google', 'Google AI Studio', 'https://aistudio.google.com/apikey', 'Llave de Google AI Studio (AIza…)', 'Créala en un proyecto SIN facturación: así Google nunca cobra (si se acaba lo gratis, solo deja de responder). Solo uso Flash, Flash-Lite y Gemma.'],
  ['ollama', 'Ollama', 'https://ollama.com/settings/keys', 'Llave de Ollama', 'Nube de Ollama: Sinapse solo usa sus modelos sin costo y quita los que piden créditos.'],
  ['siliconflow', 'SiliconFlow', 'https://cloud.siliconflow.com/account/ak', 'Llave de SiliconFlow (sk-…)', 'Solo uso sus modelos gratis (Qwen3-8B, GLM-4-9B…). Los de pago se rechazan aunque tengas saldo.'],
  ['tavily', 'Tavily (buscar en internet)', 'https://app.tavily.com/home', 'Llave de Tavily (tvly-…)', '1.000 búsquedas gratis al mes, sin tarjeta. Cuando se acaban, se usa Exa o Wikipedia.'],
  ['exa', 'Exa (buscar en internet)', 'https://dashboard.exa.ai/api-keys', 'Llave de Exa', 'Crédito gratis cada mes, sin tarjeta. Respaldo de Tavily.'],
  ['pollinations', 'Pollinations (imágenes)', 'https://enter.pollinations.ai', 'Llave de Pollinations (sk_…)', 'Para crear imágenes. Gasta su saldo «pollen» (prepago): nunca cobra a una tarjeta; si se acaba, solo se pausan las imágenes y te aviso.']];
const PAGES = { chat:'Sonyx', index:'Inicio', pulso:'Pulsem', pulsem:'Pulsem' };
const rc = r => String(r || '').toLowerCase();
const ago = t => { const s = Math.max(0, Math.round((Date.now() - t) / 1000)); return s < 60 ? 'hace ' + s + ' s' : s < 3600 ? 'hace ' + Math.round(s / 60) + ' min' : s < 86400 ? 'hace ' + Math.round(s / 3600) + ' h' : 'hace ' + Math.round(s / 86400) + ' d'; };
const dur = ms => { const m = Math.round(ms / 60000); return m < 1 ? 'recién llegó' : m < 60 ? m + ' min aquí' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min aquí'; };
const ini = n => esc(String(n || '?').replace(/^@/, '').charAt(0).toUpperCase() || '?');
let P = null, T = null, filt = 'all', helpCur = null, timer = 0, lastOk = 0, booted = false;

$('#pWord').innerHTML = SZ.zWord('Synth');
$('#pCorner') && ($('#pCorner').innerHTML = '<svg viewBox="0 0 24 24">' + SZ.ICONS.claude('#d9805f', '#d9805f') + '</svg>');

/* ---------- puerta: solo Prime, ZFlow y Symmetrix ---------- */
function gate(kind, msg){
  $('#app').hidden = true; const g = $('#gate'); g.hidden = false;
  if (kind === 'login'){
    g.innerHTML = '<div class="tcard"><div class="word">' + SZ.zWord('Synth') + '</div><div class="tn">PULSEM · SOLO EL EQUIPO</div><div class="tb"><h3>Entra con tu cuenta del equipo</h3><p>El Pulsem muestra cómo está Sinapse por dentro. Solo pueden verlo las cuentas Prime, ZFlow y Symmetrix.</p></div><div id="gAuth"></div><div class="tbtn" style="margin-top:14px"><a class="lnk" href="index.html">Volver a Sinapse</a></div></div>';
    SZ.authBox($('#gAuth'), () => setTimeout(load, 300), () => toast('Tu navegador bloqueó la ventana. Permite las ventanas emergentes de este sitio.'));
  } else if (kind === 'team'){
    g.innerHTML = '<div class="tcard"><div class="word">' + SZ.zWord('Synth') + '</div><div class="tn">PULSEM · SOLO EL EQUIPO</div><div class="tb"><h3>Esta página es del equipo</h3><p>Solo las cuentas con rango Prime, ZFlow o Symmetrix pueden ver Pulsem. Si necesitas ayuda, escríbele al equipo desde Sona.</p></div><div class="tbtn" style="margin-top:14px"><a class="lnk" href="index.html">Volver a Sinapse</a><a class="btn sm" href="chat.html">Ir a Sonyx</a></div></div>';
  } else {
    g.innerHTML = '<div class="tcard"><div class="word">' + SZ.zWord('Synth') + '</div><div class="tn">PULSEM</div><div class="tb"><h3>No pude abrir Pulsem</h3><p>' + esc(msg || 'Revisa tu conexión e inténtalo de nuevo.') + '</p></div><div class="tbtn" style="margin-top:14px"><a class="lnk" href="index.html">Volver a Sinapse</a><button class="btn sm" type="button" id="gRetry">Reintentar</button></div></div>';
    $('#gRetry').addEventListener('click', load);
  }
  const c = $('.tcard', g); if (c && !SZ.reduce) c.animate([{ opacity:0, transform:'translateY(20px) scale(.96)', filter:'blur(8px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
}

/* ---------- datos ---------- */
async function load(manual){
  const rb = $('#pRefresh'); if (rb) rb.classList.add('spin');
  try{
    if (!SZ.SESS_get()){ gate('login'); return; }
    const [p, t] = await Promise.all([api('health?panel=1', { keep:true }), api('trial', { keep:true }).catch(() => null)]);
    P = p; T = t; lastOk = Date.now();
    $('#gate').hidden = true; $('#app').hidden = false;
    render(); if (manual) toast('Pulsem al día.');
  }catch(e){
    if (e.status === 401) gate('login');
    else if (e.status === 403) gate('team');
    else if (!P) gate('err', e.message);
    else { $('#pLive').classList.add('off'); $('#pLiveT').textContent = 'sin conexión'; }
  }finally{ if (rb) rb.classList.remove('spin'); schedule(); }
}
function schedule(){ clearTimeout(timer); timer = setTimeout(() => { if (!document.hidden && !busyForm()) load(); else schedule(); }, 60000); }
const busyForm = () => { const a = document.activeElement; return !!(a && a.closest && a.closest('.mk, .set, .hform') && a.value); };
document.addEventListener('visibilitychange', () => { if (!document.hidden && P && Date.now() - lastOk > 55000) load(); });
setInterval(() => { if (lastOk){ $('#pLive').classList.remove('off'); $('#pLiveT').textContent = 'en vivo · ' + ago(lastOk); } }, 5000);
$('#pRefresh').addEventListener('click', () => load(true));

/* ---------- salud de la página ---------- */
function health(){
  const keys = P.keys || [], tot = keys.length, ok = keys.filter(k => !k.down).length, now = P.now;
  const recent = (P.events || []).filter(e => now - e.t < 10 * 60e3), errs = recent.filter(e => e.kind === 'error' || e.kind === 'jserror').length;
  const load5 = (P.perMin || []).slice(-5).reduce((a, b) => a + b, 0), d0 = (P.stat || [])[0] || {}, req = d0.req || 0, fail = d0.fail || 0, fr = fail / Math.max(1, req + fail);
  const why = []; let lv = 'ok';
  const up = l => { const o = ['ok', 'busy', 'down']; if (o.indexOf(l) > o.indexOf(lv)) lv = l; };
  if (!tot){ lv = 'off'; why.push('Las IAs conectadas no tiene llaves'); }
  else {
    why.push(ok + ' de ' + tot + ' llaves activas');
    if (!ok) up('down'); else if (ok < tot / 2) up('busy');
    if (fail >= 5 && fr > .3) up('down'); else if (fail >= 3 && fr > .1) up('busy');
    if (fail) why.push(fail + ' mensajes sin respuesta hoy');
    if (errs >= 15) up('down'); else if (errs >= 5) up('busy');
    if (errs) why.push(errs + (errs === 1 ? ' error' : ' errores') + ' en 10 min');
    if (load5 >= 120) up('busy');
    why.push(load5 + ' mensajes en 5 min');
  }
  return { lv, why, ok, tot };
}
const LV = { ok:['#7fd6b8', 'Funcionando bien', 'Todo responde con normalidad.', '✓'], busy:['#f2b36b', 'Con mucha carga', 'Responde, pero algo va lento o falla a ratos. Mira las llaves y las dificultades.', '!'], down:['#ff8f7a', 'A punto de caer', 'Muchas fallas ahora mismo: revisa las llaves (abajo) y quién tiene problemas.', '!!'], off:['#8d909c', 'IAs conectadas apagada', 'Agrega tus llaves abajo para activarla para todos. Mientras tanto, las personas solo pueden usar su Puter.', '–'] };
function renderHealth(){
  const h = health(), L = LV[h.lv], d0 = (P.stat || [])[0] || {};
  const c = $('#cHealth'); c.style.setProperty('--hc', L[0]); c.style.setProperty('--cg', L[0]);
  $('#hLamp').innerHTML = '<b>' + L[3] + '</b>';
  $('#hTitle').textContent = L[1]; $('#hText').textContent = L[2];
  $('#hWhy').innerHTML = h.why.map(w => '<span>' + esc(w) + '</span>').join('');
  const K = [[(P.online || []).length, 'en línea ahora'], [d0.req || 0, 'mensajes hoy'], [SZ.coinsOf(d0.tok || 0), SZ.t('pm.spent')], [(d0.err || 0) + (d0.fail || 0), 'errores de IA hoy'], [d0.req ? ((d0.ms || 0) / d0.req / 1000) : 0, 'segundos por respuesta']];
  $('#hKpi').innerHTML = K.map(([v, l], i) => '<div class="kpi"><b data-k="' + i + '">0</b><span>' + l + '</span></div>').join('');
  K.forEach(([v], i) => { const b = $('[data-k="' + i + '"]'); if (i === 4){ b.textContent = v ? v.toFixed(1).replace('.', ',') : '–'; } else SZ.countTo(b, v); });
  { const U = P.use || {}, B = [['Vercel · llamadas al servidor', U.req || 0, 100000], ['Upstash · comandos de datos', U.cmd || 0, 500000]];
    let m = $('#hUse'); if (!m){ m = document.createElement('div'); m.id = 'hUse'; m.className = 'use'; $('#hKpi').insertAdjacentElement('afterend', m); }
    m.innerHTML = '<p class="usel">Lo gratis de este mes (' + esc(U.month || '') + ')</p>' + B.map(([l, v, mx]) => { const p = Math.min(100, v / mx * 100), col = p >= 90 ? '#ff8f7a' : p >= 70 ? '#f2b36b' : '#7fd6b8'; return '<div class="ub"><span>' + l + '</span><i><b style="width:' + p.toFixed(1) + '%;background:' + col + '"></b></i><em>' + fmt(v) + ' de ' + fmt(mx) + ' · ' + p.toFixed(p < 10 ? 1 : 0).replace('.', ',') + ' %</em></div>'; }).join('')
      + (B.some(x => x[1] / x[2] >= .7) ? '<p class="usew">Ya pasaste el 70 %: cuando llegue al 100 % esa parte se detiene hasta el mes siguiente.</p>' : ''); }
  $('#pRank').textContent = P.rank; $('#pRank').className = 'rkp r-' + rc(P.rank);
}

/* ---------- en línea ---------- */
function renderOnline(){
  const now = P.now, ev = P.events || [];
  const conf = new Set(ev.filter(e => e.kind === 'confused' && now - e.t < 15 * 60e3).map(e => e.who));
  const L = (P.online || []).map(o => Object.assign({}, o, { trouble:(o.errs || 0) + (o.locked ? 3 : 0) + (conf.has(o.name) ? 2 : 0) + (!o.msgs && now - (o.since || now) > 4 * 60e3 && o.page === 'chat' ? 1 : 0) })).sort((a, b) => b.trouble - a.trouble || (b.t || 0) - (a.t || 0));
  $('#oN').textContent = L.length + (L.length === 1 ? ' persona' : ' personas');
  $('#oList').innerHTML = L.length ? L.map((o, i) => {
    const tg = [];
    if (o.locked) tg.push('<span class="tag bad">sin IA</span>');
    if (o.errs) tg.push('<span class="tag bad">' + o.errs + (o.errs === 1 ? ' error' : ' errores') + '</span>');
    if (conf.has(o.name)) tg.push('<span class="tag warn">se ve perdido/a</span>');
    if (!o.msgs && now - (o.since || now) > 4 * 60e3 && o.page === 'chat') tg.push('<span class="tag warn">no ha usado la IA</span>');
    if (o.msgs) tg.push('<span class="tag ok">' + o.msgs + ' mensajes</span>');
    if (o.ai) tg.push('<span class="tag gold">' + esc(o.ai === 'synthz' ? 'IAs conectadas' : o.ai === 'puter' ? 'Puter' : o.ai) + '</span>');
    const sub = /^u:/.test(o.id) ? o.id.slice(2) : '';
    return '<div class="row" style="--i:' + i + '"><span class="av r-' + rc(o.rank) + '">' + ini(o.name) + '</span><div class="tx"><b>' + esc(o.name || 'Alguien') + ' <span class="rkp r-' + rc(o.rank) + '" style="font-size:9.5px;padding:1px 7px;margin-left:4px">' + esc(o.rank || '') + '</span></b><small>' + esc(PAGES[o.page] || o.page || '—') + ' · ' + (o.mobile ? 'celular' : 'computador') + ' · ' + dur(now - (o.since || now)) + '</small></div><div class="tags">' + tg.join('') + (sub ? '<button class="mini gold" type="button" data-reach="' + esc(sub) + '" data-nm="' + esc(o.name) + '">Contactar</button>' : '') + '</div></div>';
  }).join('') : '<div class="empty">No hay nadie en línea en este momento. ✨</div>';
}

/* ---------- dificultades ---------- */
function renderTrouble(){
  const now = P.now, ev = (P.events || []).filter(e => filt === 'all' || e.kind === filt || (filt === 'error' && e.kind === 'jserror'));
  const hour = (P.events || []).filter(e => now - e.t < 3600e3 && e.kind !== 'reload'), people = new Set(hour.map(e => e.who));
  $('#tSum').textContent = people.size ? people.size + (people.size === 1 ? ' persona tuvo' : ' personas tuvieron') + ' dificultades en la última hora' : 'Nadie tuvo dificultades en la última hora';
  const cnt = k => (P.events || []).filter(e => k === 'all' || e.kind === k || (k === 'error' && e.kind === 'jserror')).length;
  $('#tChips').innerHTML = [['all', 'Todas'], ['error', 'Errores'], ['reload', 'Recargas'], ['confused', 'Perdidos'], ['noai', 'Sin IA'], ['limit', 'Tope'], ['puter_out', 'Sin Puter']].map(([k, l]) => '<button type="button" data-f="' + k + '" aria-pressed="' + (filt === k) + '">' + l + '<i>' + cnt(k) + '</i></button>').join('');
  $('#tList').innerHTML = ev.length ? ev.slice(0, 80).map((e, i) => {
    const K = KIND[e.kind] || [e.kind, 'warn'];
    return '<div class="row" style="--i:' + Math.min(i, 20) + '"><span class="av r-' + rc(e.rank) + '">' + ini(e.who) + '</span><div class="tx"><b>' + esc(e.who || 'Alguien') + '</b><small>' + esc(e.detail || '—') + ' · ' + esc(PAGES[e.page] || e.page || '') + ' · ' + ago(e.t) + '</small></div><div class="tags"><span class="tag ' + K[1] + '">' + esc(K[0]) + '</span>' + (e.sub ? '<button class="mini gold" type="button" data-reach="' + esc(e.sub) + '" data-nm="' + esc(e.who) + '">Contactar</button>' : '') + '</div></div>';
  }).join('') : '<div class="empty">Nada por aquí. 🎉</div>';
}
$('#tChips').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; filt = b.dataset.f; renderTrouble(); });

/* ---------- carga ---------- */
function renderLoad(){
  const pm = P.perMin || [], mx = Math.max(1, ...pm);
  $('#lBars').innerHTML = pm.map((v, i) => '<i class="' + (v ? '' : 'z') + '" style="--i:' + i + ';height:' + Math.max(4, v / mx * 100) + '%" title="' + v + ' mensajes"></i>').join('');
  $('#lNow').textContent = pm.slice(-5).reduce((a, b) => a + b, 0) + ' mensajes en los últimos 5 min';
  const st = (P.stat || []).slice().reverse(), m2 = Math.max(1, ...st.map(s => s.req || 0));
  const dn = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  $('#lDays').innerHTML = st.map((s, i) => '<div class="day"><div class="col"><i style="--i:' + i + ';height:' + Math.max(3, (s.req || 0) / m2 * 100) + '%"></i></div><b>' + fmt(s.req || 0) + '</b><small>' + dn[new Date(s.day + 'T12:00:00').getDay()] + ' ' + s.day.slice(8) + '</small></div>').join('');
}

/* ---------- llaves ---------- */
function keyState(k){ const c = k.check; return k.down ? ['off', 'en pausa: ' + k.down] : c ? [c.ok ? (c.kind === 'busy' ? 'warn' : 'ok') : c.kind === 'limit' ? 'warn' : 'off', c.state + (c.t ? ' · ' + ago(c.t) : '')] : ['', 'sin probar todavía']; }
function renderKeys(){
  const ks = (T && T.keys) || P.keys || [], can = !!P.canEdit;
  $('#kN').textContent = ks.length + (ks.length === 1 ? ' llave' : ' llaves') + ' · ' + ((T && T.models && T.models.n) || 0) + ' modelos gratis';
  $('#kAll').hidden = !can || !ks.length;
  $('#kList').innerHTML = ks.length ? ks.map((k, i) => {
    const [d, s] = keyState(k), mine = k.mine || (k.owner && T && T.keys && T.keys.find(x => x.id === k.id && x.mine));
    const pct = k.cap ? Math.min(1, (k.n || 0) / k.cap) : 0;
    return '<div class="krow" style="--i:' + i + '"><i class="dot ' + d + '"></i><div style="display:flex;gap:10px;align-items:center">' + SZ.glassIcon({ id:k.prov, vendor:k.prov === 'mistral' ? 'mistralai' : k.prov }, 'sm') + '<div><b>' + esc(k.provName || k.prov) + '</b><small>' + esc(k.owner ? k.owner.name + ' · ' + k.owner.rank : '') + (k.key ? ' · ' + esc(k.key) : '') + (k.src === 'vercel' ? ' · Vercel' : '') + '</small></div></div><div><small>' + esc(s) + '</small>' + (k.check && !k.check.ok && k.check.detail ? '<small style="color:#ffc0b2">' + esc(k.provName || k.prov) + ' dijo: «' + esc(k.check.detail) + '»</small>' : '') + '</div><div class="kmeter" style="min-width:110px"><div class="meter"><i style="transform:scaleX(' + pct.toFixed(3) + ')"></i></div><small>hoy ' + fmt(k.n || 0) + ' / ' + fmt(k.cap || 0) + ' · ' + fmt(k.tok || 0) + ' palabras</small></div><div class="kact">' + (can || mine ? '<button class="mini" type="button" data-check="' + esc(k.id) + '">' + SZ.t('pm.test') + '</button>' + (k.src === 'vercel' ? '' : '<button class="mini kdel" type="button" data-kdel="' + esc(k.id) + '" data-n="' + esc(k.provName || k.prov) + '" data-own="' + (mine ? 1 : '') + '">' + SZ.t('pm.del') + '</button>') : '') + '</div></div>';
  }).join('') : '<div class="empty">Todavía no hay llaves. Agrega las tuyas abajo: las IAs conectadas se activa para todos al instante.</div>';
}
function renderMyKeys(){
  const mine = (T && T.mine) || {};
  $('#myKeys').innerHTML = PROVS.map(([id, name, url, ph, note]) => {
    const on = !!mine[id], P0 = SZ.byId(id) || SZ.byId('openrouter');
    return '<div class="mk" data-p="' + id + '"><div class="mh">' + SZ.glassIcon({ id, vendor:id === 'mistral' ? 'mistralai' : id }, 'sm') + '<b>' + name + '</b><em class="' + (on ? 'on' : '') + '">' + (on ? '✓ guardada' : 'sin llave') + '</em></div>'
      + (note ? '<p class="cnote" style="margin:4px 0 8px">' + esc(note) + '</p>' : '')
      + '<label class="field"><input type="text" data-sec="1" data-k="' + id + '" placeholder="' + esc(on ? 'Pega otra para cambiarla' : ph) + '" autocomplete="off" data-lpignore="true" data-1p-ignore data-form-type="other" spellcheck="false"></label>'
      + (id === 'cloudflare' ? '<label class="field"><input type="text" data-cfa placeholder="Account ID (opcional; lo busco solo si falta)" autocomplete="off" spellcheck="false" value="' + esc((T && T.cfAccount) || '') + '"></label>' : '')
      + '<div class="acts"><button class="btn sm" type="button" data-save="' + id + '">Guardar y probar</button>' + (on ? '<button class="lnk" type="button" data-del="' + id + '">Quitar</button>' : '') + '<a class="lnk" href="' + url + '" target="_blank" rel="noopener noreferrer">Sacar una gratis</a></div></div>';
  }).join('');
}
async function keysPost(body, btn, label){
  const l = btn ? btn.textContent : ''; if (btn){ btn.disabled = true; btn.textContent = label || 'Probando…'; }
  try{
    const d = await api('trial', { method:'POST', body, keep:true });
    const res = d.keys || [], ok = res.filter(k => k.ok).length;
    toast(res.length ? ok + ' de ' + res.length + (res.length === 1 ? ' llave funciona.' : ' llaves funcionan.') + (res.some(k => !k.ok) ? ' Mira el detalle en la lista.' : '') : 'Listo.');
    T = await api('trial', { keep:true }).catch(() => T); renderKeys(); renderMyKeys(); renderSettings();
  }catch(e){ toast(e.message); }
  finally{ if (btn && btn.isConnected){ btn.disabled = false; btn.textContent = l; } }
}
$('#myKeys').addEventListener('click', async e => {
  const s = e.target.closest('[data-save]'), d = e.target.closest('[data-del]');
  if (s){
    const id = s.dataset.save, v = ($('[data-k="' + id + '"]').value || '').trim(), body = { action:'keys' };
    if (v) body[id] = v;
    if (id === 'cloudflare'){ const a = $('[data-cfa]'); if (a) body.cfAccount = a.value.trim(); }
    if (!v && !(id === 'cloudflare' && body.cfAccount)){ toast('Pega tu llave de ' + PROVS.find(p => p[0] === id)[1] + '.'); return; }
    if (id === 'groq' && v && !/^gsk_/.test(v)){ toast('Esa no parece una llave de Groq: empieza con «gsk_».'); return; }
    if (id === 'openrouter' && v && !/^sk-or-/.test(v)){ toast('Esa no parece una llave de OpenRouter: empieza con «sk-or-».'); return; }
    await keysPost(body, s, 'Guardando…');
  }
  if (d){
    const id = d.dataset.del, nm = PROVS.find(p => p[0] === id)[1];
    if (!(await SZ.szConfirm('¿Quitar tu llave de ' + nm + '?', 'Dejará de usarse para las IAs conectadas. Las llaves de los demás siguen funcionando.', 'Quitar', true))) return;
    await keysPost({ action:'keys', [id]:'' }, d, 'Quitando…');
  }
});
$('#kList').addEventListener('click', async e => {
  const b = e.target.closest('[data-check]'); if (b) return keysPost({ action:'check', id:b.dataset.check }, b);
  const x = e.target.closest('[data-kdel]'); if (!x) return;
  /* quitar: pide confirmación, se borra en el servidor y la lista se vuelve a pedir */
  if (!(await SZ.szConfirm(SZ.t('pm.delQ', { n:x.dataset.n }), SZ.t(x.dataset.own ? 'pm.delP' : 'pm.delPo'), SZ.t('pm.del'), true))) return;
  x.disabled = true; x.textContent = SZ.t('pm.deling');
  try{ await api('trial', { method:'POST', body:{ action:'delkey', id:x.dataset.kdel }, keep:true }); toast(SZ.t('pm.deled', { n:x.dataset.n })); T = await api('trial', { keep:true }).catch(() => T); renderKeys(); renderMyKeys(); renderSettings(); }
  catch(er){ toast(er.message); if (x.isConnected){ x.disabled = false; x.textContent = SZ.t('pm.del'); } }
});
$('#kAll').addEventListener('click', e => keysPost({ action:'check' }, e.currentTarget, 'Probando todas…'));

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
  if (can) $('#setG').insertAdjacentHTML('beforeend', '<div class="set' + (mt.on ? ' mton' : '') + '"><b>Aviso de mantenimiento' + (mt.on ? ' <span class="mtlive">● Encendido</span>' : '') + '</b><p>Cubre toda la página con este aviso y Sona en el centro para charlar mientras arreglan. Pulsem nunca se cubre; Prime y ZFlow pueden «Entrar igual».</p>'
    + '<label class="field"><textarea id="sMaint" rows="3" maxlength="300" placeholder="Estamos presentando fallas o actualizaciones. Espera un momento.">' + esc(mt.text || '') + '</textarea></label>'
    + '<div class="acts" style="margin-top:8px">' + (mt.on ? '<button class="btn sm" type="button" data-set="maint" data-on="1">Cambiar texto</button><button class="btn sm ghost" type="button" data-set="maint" data-on="0">Apagar aviso</button>' : '<button class="btn sm" type="button" data-set="maint" data-on="1">Encender aviso</button>') + '</div></div>');
  /* v3.7 · «Qué estamos arreglando ahora»: lo escribe cualquiera del equipo y SynthonIA lo cuenta a quien pregunte (ayudante y mantenimiento) */
  const nw = (T && T.now) || null;
  $('#setG').insertAdjacentHTML('afterbegin', '<div class="set setnow"><b>Qué estamos arreglando ahora' + (nw ? ' <span class="mtlive">● Sona lo cuenta</span>' : '') + '</b><p>Escríbelo en una o dos frases. Si alguien le pregunta a Sona qué se está arreglando, o reporta algo de esto, ella lo responde con sus palabras (en español o inglés). Déjalo vacío para que no diga nada.</p>'
    + '<label class="field"><textarea id="sNow" rows="2" maxlength="300" placeholder="Ej.: Estamos arreglando que las fotos tarden en subir en el celular.">' + esc(nw ? nw.text : '') + '</textarea></label>'
    + '<div class="acts" style="margin-top:8px"><button class="btn sm" type="button" data-set="now">Guardar</button>' + (nw ? '<button class="btn sm ghost" type="button" data-set="now" data-clear="1">Borrar</button><small style="color:var(--mute)">' + esc(nw.by || 'equipo') + ' · ' + new Date(nw.t).toLocaleString(document.documentElement.lang === 'en' ? 'en-US' : 'es-CO', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) + '</small>' : '') + '</div></div>');
  $('#setNote').hidden = can;
}
$('#setG').addEventListener('click', async e => {
  const b = e.target.closest('[data-set]'); if (!b) return; const k = b.dataset.set, l = b.textContent; b.disabled = true; b.textContent = 'Guardando…';
  try{
    if (k === 'now'){ const v = b.dataset.clear ? '' : ($('#sNow').value || '').trim(); const d = await api('trial', { method:'POST', body:{ action:'now', text:v }, keep:true }); T = Object.assign({}, T, { now:d.now }); toast(d.now ? 'Listo: Sona ya sabe qué estamos arreglando.' : 'Borrado: Sona ya no lo menciona.'); renderSettings(); return; }
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
  /* v3.7 · primero los que llevan +15 min sin respuesta, luego los nuevos y al final los que ya atiende alguien */
  const w = r => r.status === 'open' ? (r.urgent ? 0 : 1) : 2;
  const H = (P.help || []).slice().sort((a, b) => w(a) - w(b) || a.t - b.t), late = H.filter(r => r.urgent).length;
  $('#hN').textContent = H.filter(r => r.status === 'open').length + ' esperando' + (late ? ' · ' + late + ' sin respuesta +15 min' : '');
  $('#hList').innerHTML = H.length ? H.map((r, i) => '<div class="row' + (r.urgent ? ' urg' : '') + '" style="--i:' + i + '"><span class="av r-' + rc(r.user && r.user.rank) + '">' + ini(r.user && (r.user.username || r.user.name)) + '</span><div class="tx"><b>@' + esc(r.user ? r.user.username || r.user.name : '') + '</b><small>' + esc(r.text) + ' · ' + ago(r.t) + '</small></div><div class="tags">' + (r.status === 'open' ? '<span class="tag ' + (r.urgent ? 'bad' : 'warn') + '">' + (r.urgent ? '⏰ +15 min' : 'nuevo') + '</span>' : '<span class="tag ok">con ' + esc((r.by || {}).name || '') + '</span>') + '<button class="mini gold" type="button" data-open="' + esc(r.id) + '">Abrir</button></div></div>').join('') : '<div class="empty">No hay pedidos de ayuda abiertos. ✨</div>';
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
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Contactar"><div class="word">' + SZ.zWord('Synth') + '</div><div class="tn">CONTACTAR · COMO ' + esc(String(P.rank).toUpperCase()) + '</div><div class="tb"><h3>Escríbele a ' + esc(name || 'esta persona') + '</h3><p>Le aparece una ventana «Chat con…» en Sinapse y te responde aquí, en la bandeja de ayuda.</p></div><label class="field" style="margin-top:12px"><textarea rows="3" maxlength="1000" id="rTxt" placeholder="¡Hola! Vi que tuviste un problema. ¿Te ayudo?"></textarea></label><div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Cancelar</button><button class="btn sm" type="button" id="rGo">Enviar</button></div></div>';
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

/* ---------- comentarios de la beta ---------- */
let ffilt = 'nuevo';
const FCAT = { idea:'💡 Idea', error:'🐞 Algo falló', confuso:'🤔 No entendió algo', otro:'💬 Otro' };
function renderFeedback(){
  const F = P.feedback || [], c = k => F.filter(x => k === 'todos' || x.status === k).length;
  $('#fN').textContent = c('nuevo') + ' nuevos';
  $('#fChips').innerHTML = [['nuevo', 'Nuevos'], ['visto', 'Vistos'], ['resuelto', 'Resueltos'], ['todos', 'Todos']].map(([k, l]) => '<button type="button" data-ff="' + k + '" aria-pressed="' + (ffilt === k) + '">' + l + '<i>' + c(k) + '</i></button>').join('');
  const L = F.filter(x => ffilt === 'todos' || x.status === ffilt);
  $('#fList').innerHTML = L.length ? L.map((x, i) => '<div class="row" style="--i:' + i + '"><span class="av r-' + rc(x.rank) + '">' + ini(x.who) + '</span><div class="tx"><b>' + esc(FCAT[x.cat] || x.cat) + ' · ' + esc(x.who) + '</b><small style="white-space:normal">' + esc(x.text) + '</small><small>' + esc(PAGES[x.page] || x.page || '') + ' · ' + ago(x.t) + (x.by ? ' · ' + esc(x.status) + ' por ' + esc(x.by) : '') + '</small></div><div class="tags">' + ['visto', 'resuelto'].filter(s => s !== x.status).map(s => '<button class="mini' + (s === 'resuelto' ? ' gold' : '') + '" type="button" data-fs="' + s + '" data-id="' + esc(x.id) + '">' + (s === 'visto' ? 'Visto' : 'Resuelto ✓') + '</button>').join('') + (x.sub ? '<button class="mini" type="button" data-reach="' + esc(x.sub) + '" data-nm="' + esc(x.who) + '">Responder</button>' : '') + '</div></div>').join('') : '<div class="empty">Nada por aquí. ✨</div>';
}
$('#fChips').addEventListener('click', e => { const b = e.target.closest('[data-ff]'); if (!b) return; ffilt = b.dataset.ff; renderFeedback(); });
$('#fList').addEventListener('click', async e => { const b = e.target.closest('[data-fs]'); if (!b) return; b.disabled = true; try{ const d = await api('help', { method:'POST', body:{ action:'fbset', id:b.dataset.id, status:b.dataset.fs }, keep:true }); const i = P.feedback.findIndex(x => x.id === d.item.id); if (i > -1) P.feedback[i] = d.item; renderFeedback(); toast('Marcado como ' + d.item.status + '.'); }catch(er){ b.disabled = false; toast(er.message); } });

/* ---------- pintar todo ---------- */
/* v2.0 · ALERTA: un proveedor pidió pago o quitó lo gratis */
function renderAlerts(){
  let b = $('#pAlert'); const L = P.alerts || [];
  if (!L.length){ if (b) b.remove(); return; }
  if (!b){ b = document.createElement('div'); b.id = 'pAlert'; b.className = 'card palert'; const m = $('main') || document.body; m.insertBefore(b, m.firstChild); }
  b.innerHTML = '<b>⚠ Alerta de las IAs</b><p>' + L.map(a => '<strong>' + esc(a.name) + '</strong> pidió pago o cambió su plan gratis' + (a.t ? ' (' + ago(a.t) + ')' : '') + (a.msg ? ': «' + esc(a.msg) + '»' : '')).join('<br>') + '</p><p class="cnote">Sinapse ya pausó esas llaves: nunca se paga nada. Revisa la cuenta del proveedor y pulsa «Probar» en la llave cuando lo arregles; si vuelve a funcionar, la alerta se quita sola.</p>';
}
function render(){
  renderAlerts();
  renderHealth(); renderOnline(); renderTrouble(); renderLoad(); renderKeys(); renderHelp(); renderFeedback();
  if (!booted){ booted = true; renderMyKeys(); renderSettings(); $('#kMine').textContent = P.rank === 'Symmetrix' ? 'Puedes agregar tus llaves y probarlas. Ver todo, sí; cambiar ajustes, solo Prime y ZFlow.' : 'Cada cuenta del equipo agrega las suyas. Todas se juntan y se comparten con todos, sin que nadie las vea.';
    const cards = $$('.card'); cards.forEach((c, i) => setTimeout(() => c.classList.add('in'), SZ.reduce ? 0 : 80 + i * 90)); }
  $('#pLive').classList.remove('off'); $('#pLiveT').textContent = 'en vivo · ahora';
}
load();
})();


/* ===== v2.4 · Pulsem como un tablero común: menú a la izquierda y una sección a la vez ===== */
(() => {
const nav = document.getElementById('dNav'); if (!nav) return;
const I = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const V = [
  ['res', 'Resumen', 'Cómo está Sinapse ahora mismo: salud, quién está en línea, dificultades y carga.', I('<path d="M4 13h4l2-5 4 10 2-5h4"/>'), null],
  ['keys', 'Llaves', 'Las llaves gratis que comparten las IAs conectadas, y las tuyas.', I('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>'), null],
  ['set', 'Ajustes', 'Tope diario, imágenes, cuentas y aviso de mantenimiento.', I('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'), null],
  ['fb', 'Comentarios', 'Lo que escriben en «Cuéntanos qué mejorar».', I('<path d="M5 5h14v10H9l-4 4z"/>'), 'fN'],
  ['help', 'Ayuda', 'Pedidos de ayuda de los Synthers.', I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 17h.01"/>'), 'hN']];
nav.innerHTML = '<p class="dn-l">Pulsem</p>' + V.map(([k, l, , ic]) => '<button type="button" class="dn-i" data-v="' + k + '">' + ic + '<span>' + l + '</span><i class="dn-b" data-b="' + k + '" hidden></i></button>').join('')
  + '<a class="dn-i dn-x" href="chat.html">' + I('<path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 4V7a2 2 0 0 1 2-2z"/>') + '<span>Ir a Sonyx</span></a>';
let cur = 'res';
function show(k, quiet){
  if (!V.some(v => v[0] === k)) k = 'res';
  cur = k; try{ localStorage.setItem('synthz:pulsemView', k); }catch(e){}
  document.querySelectorAll('#app [data-view]').forEach(s => { s.hidden = s.dataset.view !== k; });
  nav.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-current', String(b.dataset.v === k)));
  const v = V.find(x => x[0] === k); document.getElementById('dTitle').textContent = v[1]; document.getElementById('dSub').textContent = v[2];
  if (!quiet) window.scrollTo({ top:0, behavior:'smooth' });
}
nav.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) show(b.dataset.v); });
let k0 = 'res'; try{ k0 = localStorage.getItem('synthz:pulsemView') || 'res'; }catch(e){} show(k0, true);
/* los numeritos del menú salen de lo que ya dice cada sección (comentarios nuevos, ayuda esperando, dificultades) */
function badges(){
  V.forEach(([k, , , , src]) => { const b = nav.querySelector('[data-b="' + k + '"]'), el = src && document.getElementById(src); if (!b) return; const n = el ? parseInt(el.textContent, 10) || 0 : 0; b.hidden = !n; b.textContent = n; });
  const t = document.getElementById('tSum'), br = nav.querySelector('[data-b="res"]'), n = t ? parseInt(t.textContent, 10) || 0 : 0; if (br){ br.hidden = !n; br.textContent = n; br.classList.add('warn'); }
}
{ const mo = new MutationObserver(badges); ['fN', 'hN', 'tSum'].forEach(id => { const el = document.getElementById(id); if (el) mo.observe(el, { subtree:true, childList:true, characterData:true }); }); badges(); }
})();
