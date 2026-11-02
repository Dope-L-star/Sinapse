/* ===== llamadas a las IA ===== */
async function getJSON(url, headers){
  let r;
  try{ r = await fetch(url, { headers }); }catch(e){ throw Object.assign(new Error('net'), { net:true }); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error('http'), { status:r.status, data:d });
  return d;
}
function friendly(status, data, p){
  let m = data && data.error ? (data.error.message || data.error) : '';
  if (typeof m !== 'string') m = JSON.stringify(m);
  if (p.id === 'openrouter' && /data policy|guardrail|ZDR|privacy/i.test(m)) return 'OpenRouter bloqueó los modelos gratis por la privacidad de tu cuenta. Entra a openrouter.ai/settings/privacy y activa los modelos gratis (los que pueden guardar datos); apaga «solo ZDR». Luego vuelve a intentarlo.';
  if (status === 401 || status === 403 || (status === 400 && /api key/i.test(m))) return 'La llave de ' + p.name + ' no es válida o no tiene permiso. Revísala y vuelve a pegarla.';
  if (status === 402) return p.id === 'openrouter' ? 'Tu saldo de OpenRouter está en negativo o ese modelo no es gratis. Elige un modelo gratis o cambia a Puter.' : 'Ese modelo necesita crédito en ' + p.name + '. Elige uno marcado como gratis.';
  if (status === 404) return 'Ese modelo no está disponible ahora mismo en ' + p.name + '. Elige otro de la lista.';
  if (status === 429) return p.id === 'openrouter' ? 'Llegaste al límite gratis de OpenRouter: 20 mensajes por minuto y 50 al día (1.000 al día si compraste 10 créditos o más). Espera un poco o cambia a Puter.' : 'Llegaste al límite gratuito de ' + p.name + '. Espera un minuto o elige otra IA.';
  if (status === 408 || status >= 500) return p.name + ' o esa IA están muy ocupadas. Prueba de nuevo en un momento o elige otra.';
  /* lo técnico no se muestra: solo un mensaje corto y entendible */
  const human = m && m.length < 140 && !/[{}<>\[\]]|stack|exception|undefined|null/i.test(m);
  return p.name + ' no pudo responder' + (human ? ': ' + m : ' (código ' + status + ')') + '. Prueba de nuevo o elige otra IA.';
}
const netMsg = p => 'No pude conectar con ' + p.name + '. Revisa tu internet y vuelve a intentarlo. Si usas un bloqueador de anuncios, apágalo para este sitio.';

async function fetchModels(p, key){
  let list = [];
  if (p.kind === 'gemini'){
    const d = await getJSON(p.url + '/models?pageSize=200', { 'x-goog-api-key': key });
    list = (d.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name.replace('models/', '')).filter(n => /^gemini/.test(n) && !/embedding|tts|image|live|audio|robotics|computer/.test(n));
  } else {
    const d = await getJSON(p.url + '/models', key ? { Authorization: 'Bearer ' + key } : undefined);
    let arr = d.data || [];
    if (p.id === 'openrouter') arr = arr.filter(m => /:free$/.test(m.id) || (m.pricing && m.pricing.prompt === '0' && m.pricing.completion === '0'));
    list = arr.map(m => m.id);
    if (p.id === 'groq') list = list.filter(n => !/whisper|guard|tts|playai|orpheus/i.test(n));
    if (p.id === 'mistral') list = list.filter(n => !/embed|moderation|ocr|voxtral|transcri/i.test(n));
  }
  return [...new Set(list)].sort().slice(0, 60);
}
async function refreshModels(p){
  const key = state.keys[p.id];
  if (!key && p.id !== 'openrouter') throw new Error('Pega primero tu llave.');
  try{
    const list = await fetchModels(p, key);
    if (list.length){
      state.models[p.id] = list;
      if (p.id !== 'openrouter' && !list.includes(state.model[p.id])) state.model[p.id] = list.includes(p.models[0]) ? p.models[0] : list[0];
      save();
    }
    return list.length;
  }catch(e){
    throw new Error(e.net ? netMsg(p) : friendly(e.status, e.data, p));
  }
}
async function verify(p){
  if (p.id === 'openrouter' && !state.keys.openrouter){
    if (!window.puter) throw new Error('No pude cargar Puter. Revisa tu internet.');
    try{ if (!puter.auth.isSignedIn()) await puter.auth.signIn({ attempt_temp_user_creation:true }); }catch(e){ throw new Error(e && (e.error === 'popup_blocked' || e.code === 'popup_blocked') ? 'Tu navegador no dejó abrir la ventanita de Puter. Permite las ventanitas de este sitio (el icono al final de la barra de arriba) y vuelve a intentar.' : 'No terminaste de entrar a Puter. Inténtalo otra vez.'); }
    return (await fetchCatalog()).list.length;
  }
  const key = state.keys[p.id];
  if (!key) throw new Error('Pega primero tu llave.');
  if (p.id === 'openrouter'){
    try{ await getJSON(p.url + '/key', { Authorization: 'Bearer ' + key }); }
    catch(e){ throw new Error(e.net ? netMsg(p) : friendly(e.status, e.data, p)); }
  }
  return refreshModels(p);
}
async function ask(p, messages, opts = {}){
  if (/^pu:/.test(String(opts.model || state.model[p.id] || ''))) return askPuter(messages, opts);
  if (p.id === 'openrouter' && !state.keys.openrouter && state.useTeam && SESS && !opts._noTeam) return askStream(p, messages, opts);
  const key = state.keys[p.id];
  const model = String(opts.model || state.model[p.id] || p.models[0]).replace(/^or:/, '');
  if (!key) throw new Error('Falta la llave de ' + p.name + '.');
  let url, headers, body;
  if (p.kind === 'gemini'){
    url = p.url + '/models/' + encodeURIComponent(model) + ':generateContent';
    headers = { 'Content-Type':'application/json', 'x-goog-api-key':key };
    body = { contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts:[{ text:m.content }] })) };
  } else {
    url = p.url + '/chat/completions';
    headers = { 'Content-Type':'application/json', Authorization:'Bearer ' + key };
    body = { model, messages };
    if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  }
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 60000), t0 = performance.now();
  if (opts.signal){ if (opts.signal.aborted) ctl.abort(); else opts.signal.addEventListener('abort', () => ctl.abort(), { once:true }); }
  let res, data;
  try{
    res = await fetch(url, { method:'POST', headers, body:JSON.stringify(body), signal:ctl.signal });
    data = await res.json().catch(() => ({}));
  }catch(e){
    if (opts.signal && opts.signal.aborted) throw Object.assign(new Error('Detenido.'), { aborted:true });
    throw new Error(e && e.name === 'AbortError' ? p.name + ' tardó demasiado en responder. Intenta de nuevo.' : netMsg(p));
  }finally{ clearTimeout(to); }
  if (!res.ok) throw Object.assign(new Error(friendly(res.status, data, p)), { status:res.status, switchTo: p.id === 'openrouter' && (res.status === 429 || res.status === 402) ? 'pu' : null });
  if (data && data.error && !(data.choices && data.choices.length)) throw new Error(friendly(+data.error.code || 502, data, p));
  const ms = performance.now() - t0;
  const inChars = messages.map(m => m.content).join('').length;
  if (p.kind === 'gemini'){
    const text = ((((data.candidates || [])[0] || {}).content || {}).parts || []).map(x => x.text || '').join('') || '(La IA devolvió una respuesta vacía.)';
    const um = data.usageMetadata || {};
    const prompt = um.promptTokenCount || Math.ceil(inChars / 4);
    const tot = um.totalTokenCount || prompt + (um.candidatesTokenCount || est(text));
    return { text, prompt, completion: Math.max(0, tot - prompt), ms, model };
  }
  const msg = ((data.choices || [])[0] || {}).message || {};
  const text = msg.content || '(La IA devolvió una respuesta vacía.)';
  const u = data.usage || {};
  return { text, prompt: u.prompt_tokens != null ? u.prompt_tokens : Math.ceil(inChars / 4), completion: u.completion_tokens != null ? u.completion_tokens : est(text), ms, model };
}
/* SynXCoin's: la moneda de SymphorIA. 1 SynXCoin = 1 token */
const MARK_HTML = LOGO_Z.replace('class="lgz"', 'class="lgz mark"');
const SXC = '<svg class="sxc" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sxg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fb0ff"/><stop offset=".55" stop-color="#c9566c"/><stop offset="1" stop-color="#e6b65f"/></linearGradient></defs><circle cx="12" cy="12" r="10.5" fill="url(#sxg)"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="rgba(11,12,16,.32)" stroke-width="1.1"/><path d="M14.7 9.3c-.5-.8-1.5-1.4-2.8-1.4-1.6 0-2.7.8-2.7 2 0 2.7 5.7 1.4 5.7 4.1 0 1.3-1.2 2.2-2.9 2.2-1.3 0-2.5-.6-3-1.6" transform="translate(-1.4 -1.3)" fill="none" stroke="#0b0c10" stroke-width="1.8" stroke-linecap="round"/><path d="M14.7 14.6l2.4 2.4M17.1 14.6l-2.4 2.4" stroke="#0b0c10" stroke-width="1.35" stroke-linecap="round"/></svg>';
const coins = n => fmt(n);   /* v1.3: ya no existen las monedas; queda solo el número */
const metaOf = r => (r.cached ? 'respuesta guardada · no gastó nada' : 'tardó ' + (r.ms / 1000).toFixed(1).replace('.', ',') + ' s')
  + (r.swap && r.real ? ' · ' + t('ia.swapped', { n:r.real }) : '');   /* v3.7 · si respondió otra IA porque la elegida no estaba (o no ve fotos), se dice */
/* últimos 20 mensajes, siempre empezando por uno del usuario (Gemini y otras APIs lo exigen) */
function history(chat){
  const h = chat.slice(-20).map(m => ({ role:m.role, content:m.content }));
  while (h.length && h[0].role !== 'user') h.shift();
  return h;
}

