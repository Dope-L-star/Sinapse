(() => {
'use strict';
const { $, $$, esc, fmt, toast, api } = SZ;
const KIND = { error:['Error de IA', 'bad'], jserror:['La página falló', 'bad'], reload:['Recargó la página', 'warn'], confused:['Se ve perdido/a', 'warn'], noai:['Sin IA', 'bad'], limit:['Llegó al tope del día', 'warn'], puter_out:['Sin créditos de Puter', 'warn'], slow:['Va lento', 'warn'] };
const PROVS = [['groq', 'Groq', 'https://console.groq.com/keys', 'Llave de Groq (gsk_…)'], ['mistral', 'Mistral', 'https://console.mistral.ai/api-keys', 'Llave de Mistral'], ['cloudflare', 'Cloudflare', 'https://dash.cloudflare.com/profile/api-tokens', 'Token de Cloudflare (Workers AI)'], ['openrouter', 'OpenRouter', 'https://openrouter.ai/keys', 'Llave de OpenRouter (sk-or-…)'],
  ['google', 'Google AI Studio', 'https://aistudio.google.com/apikey', 'Llave de Google AI Studio (AIza…)', 'Créala en un proyecto SIN facturación: así Google nunca cobra (si se acaba lo gratis, solo deja de responder). Solo uso Flash, Flash-Lite y Gemma.'],
  ['ollama', 'Ollama', 'https://ollama.com/settings/keys', 'Llave de Ollama', 'Nube de Ollama: SymphorIA solo usa sus modelos sin costo y quita los que piden créditos.'],
  ['siliconflow', 'SiliconFlow', 'https://cloud.siliconflow.com/account/ak', 'Llave de SiliconFlow (sk-…)', 'Solo uso sus modelos gratis (Qwen3-8B, GLM-4-9B…). Los de pago se rechazan aunque tengas saldo.'],
  ['tavily', 'Tavily (buscar en internet)', 'https://app.tavily.com/home', 'Llave de Tavily (tvly-…)', '1.000 búsquedas gratis al mes, sin tarjeta. Cuando se acaban, se usa Exa o Wikipedia.'],
  ['exa', 'Exa (buscar en internet)', 'https://dashboard.exa.ai/api-keys', 'Llave de Exa', 'Crédito gratis cada mes, sin tarjeta. Respaldo de Tavily.'],
  ['pollinations', 'Pollinations (imágenes)', 'https://enter.pollinations.ai', 'Llave de Pollinations (sk_…)', 'Para crear imágenes. Gasta su saldo «pollen» (prepago): nunca cobra a una tarjeta; si se acaba, solo se pausan las imágenes y te aviso.']];
const PAGES = { chat:'SynthFlow', index:'Inicio', pulso:'Pulsem', pulsem:'Pulsem' };
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
    g.innerHTML = '<div class="tcard"><div class="word">' + SZ.zWord('Synth') + '</div><div class="tn">PULSEM · SOLO EL EQUIPO</div><div class="tb"><h3>Entra con tu cuenta del equipo</h3><p>El Pulsem muestra cómo está SymphorIA por dentro. Solo pueden verlo las cuentas Prime, ZFlow y Symmetrix.</p></div><div id="gAuth"></div><div class="tbtn" style="margin-top:14px"><a class="lnk" href="index.html">Volver a SymphorIA</a></div></div>';
    SZ.authBox($('#gAuth'), () => setTimeout(load, 300), () => toast('Tu navegador bloqueó la ventana. Permite las ventanas emergentes de este sitio.'));
  } else if (kind === 'team'){
    g.innerHTML = '<div class="tcard"><div class="word">' + SZ.zWord('Synth') + '</div><div class="tn">PULSEM · SOLO EL EQUIPO</div><div class="tb"><h3>Esta página es del equipo</h3><p>Solo las cuentas con rango Prime, ZFlow o Symmetrix pueden ver Pulsem. Si necesitas ayuda, escríbele al equipo desde SynthonIA.</p></div><div class="tbtn" style="margin-top:14px"><a class="lnk" href="index.html">Volver a SymphorIA</a><a class="btn sm" href="chat.html">Ir a SynthFlow</a></div></div>';
  } else {
    g.innerHTML = '<div class="tcard"><div class="word">' + SZ.zWord('Synth') + '</div><div class="tn">PULSEM</div><div class="tb"><h3>No pude abrir Pulsem</h3><p>' + esc(msg || 'Revisa tu conexión e inténtalo de nuevo.') + '</p></div><div class="tbtn" style="margin-top:14px"><a class="lnk" href="index.html">Volver a SymphorIA</a><button class="btn sm" type="button" id="gRetry">Reintentar</button></div></div>';
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

