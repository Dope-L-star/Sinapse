/* ===== pulso de SymphorIA: «sigo aquí» cada 10 min (el equipo cada 3) y avisos cortos cuando algo falla (sin mensajes ni chats)
   v3.7 · costo cero: de 3 a 10 minutos para las personas = unas 3 veces menos escrituras en Redis por cada visitante ===== */
const TEL = { since:Date.now(), msgs:0, errs:0, ai:'', locked:false, last:{} };
const telPage = () => (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
function telEv(kind, detail){
  try{
    const now = Date.now(); if (now - (TEL.last[kind] || 0) < 60000) return; TEL.last[kind] = now;
    if (kind === 'error' || kind === 'jserror') TEL.errs++;
    fetch('/api/health', { method:'POST', headers:szHeaders(), body:JSON.stringify({ action:'ev', kind, page:telPage(), detail:String(detail || '').slice(0, 160) }), keepalive:true }).catch(() => {});
  }catch(e){}
}
let beatT = 0, beatAt = 0;
const beatMs = () => { const r = ACC && ACC.user && ACC.user.role; return r && r !== 'user' ? 180000 : 600000; };
async function telBeat(){
  clearTimeout(beatT); beatT = setTimeout(telBeat, beatMs());
  if (document.hidden) return; beatAt = Date.now();
  try{
    const r = await fetch('/api/health', { method:'POST', headers:szHeaders(), body:JSON.stringify({ action:'beat', page:telPage(), state:{ since:TEL.since, msgs:TEL.msgs, ai:TEL.ai, locked:TEL.locked, mobile:matchMedia('(max-width:760px)').matches, errs:TEL.errs } }) });
    const d = r.ok ? await r.json() : {};
    if (d.help) try{ dispatchEvent(new CustomEvent('synthz-help-ping')); }catch(e){}
  }catch(e){}
}
setTimeout(telBeat, 4000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - beatAt > beatMs() - 10000) telBeat(); });
addEventListener('error', e => { if (!e || !e.message || /ResizeObserver|Script error/i.test(e.message)) return; telEv('jserror', e.message + ' @' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || 0)); });
addEventListener('unhandledrejection', e => { const m = e && e.reason && (e.reason.message || String(e.reason)); if (!m || /abort|Detenido|net|Failed to fetch|NetworkError|load failed/i.test(m)) return; telEv('jserror', 'promesa: ' + m); });
try{ const nv = performance.getEntriesByType('navigation')[0]; if (nv && nv.type === 'reload') setTimeout(() => telEv('reload', 'recargó la página'), 2500); }catch(e){}

/* ===== catálogo de modelos de OpenRouter, en vivo (la lista es pública: no necesita llave) ===== */
const CAT_KEY = 'synthz:catalog-v6';
/* «Qwen: Qwen3 235B (free)» → «Qwen3 235B»: solo el nombre */
/* «OpenAI: GPT-5» → «GPT-5», pero «Deepseek V4 Pro:0813» → «Deepseek V4 Pro 0813» (antes quedaba solo «0813») */
const cleanName = n => String(n || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/^[^:]{1,24}:\s+/, '').replace(/:(?=\S)/g, ' ').replace(/\s+/g, ' ').trim() || String(n || '');
const VENDORS = { 'meta-llama':'Meta', google:'Google', mistralai:'Mistral', openai:'OpenAI', qwen:'Qwen', deepseek:'DeepSeek', nvidia:'NVIDIA', microsoft:'Microsoft', moonshotai:'Moonshot', 'z-ai':'Z.ai', 'x-ai':'xAI', anthropic:'Anthropic', cohere:'Cohere', nousresearch:'Nous', thudm:'THUDM', tngtech:'TNG', minimax:'MiniMax', inception:'Inception', liquid:'Liquid', allenai:'Ai2', ai21:'AI21', amazon:'Amazon', baidu:'Baidu', tencent:'Tencent', bytedance:'ByteDance', 'stepfun-ai':'StepFun', cognitivecomputations:'Cognitive', rekaai:'Reka', arliai:'ArliAI', 'shisa-ai':'Shisa' };
const vendorLabel = v => VENDORS[v] || (v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Otro');
function vendorColor(v){ let h = 0; for (const ch of String(v)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return 'hsl(' + (h % 360) + ' 72% 74%)'; }
function parseModels(data){
  const arr = Array.isArray(data) ? data : (data && data.data) || [];
  const out = [];
  arr.forEach(m => {
    if (!m || typeof m.id !== 'string') return;
    const a = m.architecture || {}, inM = Array.isArray(a.input_modalities) ? a.input_modalities : ['text'], outM = Array.isArray(a.output_modalities) ? a.output_modalities : ['text'];
    if (!outM.includes('text')) return;                       /* el chat es de texto: se omiten los que solo generan imágenes */
    const pr = m.pricing || {};
    const free = /:free$/.test(m.id) || (pr.prompt != null && pr.completion != null && +pr.prompt === 0 && +pr.completion === 0);
    const vendor = m.id.split('/')[0] || 'otro';
    let name = String(m.name || m.id).replace(/\s*\(free\)\s*$/i, '');
    const ci = name.indexOf(': '); if (ci > 0 && ci < 28) name = name.slice(ci + 2);
    const sp = Array.isArray(m.supported_parameters) ? m.supported_parameters : [];
    out.push({ id:m.id, name, vendor, vlabel:vendorLabel(vendor), ctx:num(m.context_length), free, created:num(m.created),
      vision:inM.includes('image'), reasoning:sp.includes('reasoning') || sp.includes('include_reasoning'), tools:sp.includes('tools'),
      desc:String(m.description || '').replace(/\s+/g, ' ').trim().slice(0, 260) });
  });
  return out;
}
function loadCatalog(){
  try{
    const s = JSON.parse(localStorage.getItem(CAT_KEY));
    if (s && Array.isArray(s.list) && s.list.length)
      return { t:num(s.t), list:s.list.filter(m => m && typeof m.id === 'string' && typeof m.name === 'string').map(m => ({ id:m.id, name:m.name, vendor:String(m.vendor || m.id.split('/')[0]), vlabel:String(m.vlabel || vendorLabel(m.vendor)), ctx:num(m.ctx), free:!!m.free, created:num(m.created), vision:!!m.vision, reasoning:!!m.reasoning, tools:!!m.tools, spend:Math.max(0, Math.min(3, num(m.spend))), desc:String(m.desc || '') })) };
  }catch(e){}
  return null;
}
async function fetchCatalog(){
  const pu = async () => {
    if (!window.puter) throw new Error('sin puter');
    const arr = await puter.ai.listModels(), seen = new Set(), out = [];
    (Array.isArray(arr) ? arr : []).forEach(m => {
      if (!m || !m.id || seen.has(m.id) || /image|dall|tts|whisper|embed|moderat|video|sora|imagen|flux|stable|transcri|speech|rerank|lyria|music|audio/i.test(m.id) || /:(batch|flex|priority)$/i.test(m.id)) return;
      seen.add(m.id);
      const vendor = String(m.provider || String(m.id).split('/')[0] || 'otro').replace(/-completion$/, '');
      /* cuánto gasta de tu Puter: según su precio por millón de palabras (input + output) */
      const c = m.cost || {}, per = +c.tokens > 0 ? 1e6 / +c.tokens : 1, price = ((+c.output || 0) * 3 + (+c.input || 0)) / 4 * per;   /* centavos de dólar por millón (más peso a lo que responde) */
      const spend = !c.output && !c.input ? 0 : price <= 120 ? 1 : price <= 1000 ? 2 : 3;
      out.push({ id:'pu:' + m.id, name:String(m.name || m.id), vendor, vlabel:vendorLabel(vendor) + ' · Puter', ctx:num(m.context), free:true, created:0, spend,
        vision:/gpt-4|gpt-5|gemini|claude|vision|pixtral|llava|-vl|grok|llama-4/i.test(m.id), reasoning:/reason|think|r1|o1|o3|o4|gpt-5|gemini-(2\.5|3)|claude|qwq|gpt-oss/i.test(m.id), tools:true, desc:'' });
    });
    if (!out.length) [['gpt-5.4-nano', 'GPT 5.4 Nano', 'openai'], ['gpt-5.6-luna', 'GPT 5.6 Luna', 'openai'], ['gemini-3.5-flash-lite', 'Gemini 3.5 Flash Lite', 'google']].forEach(([id, name, v]) => out.push({ id:'pu:' + id, name, vendor:v, vlabel:vendorLabel(v) + ' · Puter', ctx:0, free:true, created:0, vision:true, reasoning:/gpt-5/.test(id), tools:true, desc:'' }));
    return out;
  };
  const orr = async () => parseModels(await getJSON('https://openrouter.ai/api/v1/models')).filter(m => !/lyria|music|audio/i.test(m.id)).map(m => ({ ...m, id:'or:' + m.id, vlabel:m.vlabel + ' · OpenRouter' }));
  /* Groq: solo si la persona pegó su llave (la lista pide llave) */
  const gq = async () => {
    const k = state.keys.groq; if (!k) return [];
    const d = await getJSON(GROQ_P.url + '/models', { Authorization:'Bearer ' + k });
    return (d.data || []).filter(m => m && m.id && m.active !== false && !/whisper|guard|tts|playai|orpheus|distil|prompt-guard|safeguard|compound/i.test(m.id)).map(m => {
      const vendor = String(m.owned_by || m.id.split('/')[0] || 'groq').toLowerCase().replace(/\s+.*$/, '').replace('meta', 'meta-llama');
      return { id:'gq:' + m.id, name:groqName(m.id), vendor, vlabel:vendorLabel(vendor) + ' · Groq', ctx:num(m.context_window), free:true, created:num(m.created), vision:/vision|llama-4|scout|maverick/i.test(m.id), reasoning:/gpt-oss|qwen3|r1|reason|kimi/i.test(m.id), tools:true, desc:'Muy rápida: corre en los chips de Groq con tu propia llave.' };
    });
  };
  /* beta 2: nadie tiene que pegar llaves. OpenRouter y Groq solo aparecen si ya tenías tu llave (o tu equipo) de antes */
  const legacyOr = false;          /* beta 2: OpenRouter y Groq nunca se muestran a las personas */
  const [s, a, b, g] = await Promise.allSettled([szCatalog(), legacyOr ? orr() : Promise.resolve([]), pu(), Promise.resolve([])]);
  const list = [...(s.status === 'fulfilled' ? s.value : []), ...(g.status === 'fulfilled' ? g.value : []), ...(a.status === 'fulfilled' ? a.value : []), ...(b.status === 'fulfilled' ? b.value : [])].filter(m => !isBad(m.id) && !/allam|infron/i.test(m.id + ' ' + m.vendor + ' ' + m.name)).map(m => Object.assign(m, { name:cleanName(m.name) }));
  if (!list.length) throw Object.assign(new Error('vacío'), ((s.reason && s.reason.net) || (a.reason && a.reason.net)) ? { net:true } : { empty:true });
  const t = Date.now();
  try{ localStorage.setItem(CAT_KEY, JSON.stringify({ t, list })); }catch(e){}
  return { t, list };
}

/* chispas de color: celebran una acción lograda */
function burst(x, y, cols = ['#8fb0ff', '#c9566c', '#ff8f7a', '#f2b36b', '#7fd6b8'], n = 16){
  if (reduce) return;
  for (let i = 0; i < n; i++){
    const s = document.createElement('i');
    s.style.cssText = 'position:fixed;left:0;top:0;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:9995;background:' + cols[i % cols.length];
    document.body.appendChild(s);
    const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 80;
    s.animate([{ transform:'translate(' + x + 'px,' + y + 'px) scale(1)', opacity:1 }, { transform:'translate(' + (x + Math.cos(a) * d) + 'px,' + (y + Math.sin(a) * d + 22) + 'px) scale(.2)', opacity:0 }], { duration:700 + Math.random() * 500, easing:'cubic-bezier(.22,1,.36,1)' }).onfinish = () => s.remove();
  }
}

