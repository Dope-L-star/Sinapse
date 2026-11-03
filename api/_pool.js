/* IA de SymphorIA (beta 2): las llaves de Prime, ZFlow y Symmetrix se juntan y se reparten entre todos.
   · Solo modelos GRATIS: Groq, Mistral y Cloudflare (planes gratis) y los «:free» de OpenRouter. Los de pago se rechazan.
   · Cada persona tiene un tope de SynXCoin's al día (20.000 por defecto). Lo que se usa con Puter no cuenta.
   · Las llaves viven cifradas en el servidor; nunca salen hacia el navegador ni a los registros.
   · Si una llave falla, se pausa un rato y se usa otra; si un proveedor entero falla, responde otro (respaldo limitado). */
import { redis, pipe, getJ, setJ, enc, dec, today, sha } from './_lib.js';

export const PROV = {
  groq:{ name:'Groq', base:() => process.env.TRIAL_GROQ_URL || 'https://api.groq.com/openai/v1', cap:+process.env.POOL_CAP_GROQ || 900,
    best:['llama-3.3-70b-versatile', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'] },
  mistral:{ name:'Mistral', base:() => process.env.TRIAL_MISTRAL_URL || 'https://api.mistral.ai/v1', cap:+process.env.POOL_CAP_MISTRAL || 400,
    best:['mistral-small-latest', 'open-mistral-nemo', 'ministral-8b-latest'] },
  openrouter:{ name:'OpenRouter', base:() => process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1', cap:+process.env.POOL_CAP_OR || 45,
    best:['openrouter/free'] },
  cloudflare:{ name:'Cloudflare', base:acct => (process.env.TRIAL_CF_URL || 'https://api.cloudflare.com/client/v4') + '/accounts/' + acct + '/ai/v1', cap:+process.env.POOL_CAP_CF || 250,
    best:['@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3.2-3b-instruct', '@cf/google/gemma-3-12b-it'] },
  /* v2.0 · Google AI Studio: SOLO los modelos de la capa gratis (Flash, Flash-Lite y Gemma). Ojo: la llave debe ser de un proyecto SIN facturación */
  google:{ name:'Google AI Studio', base:() => process.env.POOL_GOOGLE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai', cap:+process.env.POOL_CAP_GOOGLE || 900,
    best:['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemma-3-27b-it'] },
  /* Ollama (nube): desde el 9-nov-2026 varios modelos piden créditos; esos se quitan (ver OLLAMA_PAID) y solo quedan los sin costo */
  ollama:{ name:'Ollama', base:() => process.env.POOL_OLLAMA_URL || 'https://ollama.com/v1', cap:+process.env.POOL_CAP_OLLAMA || 300,
    best:[] },   /* v3.7 · lo que queda gratis en Ollama es de alto consumo (qwen3-coder 480B, deepseek 671B): sin modelos por ahora */
  /* SiliconFlow (.com): SOLO la lista de modelos gratis; los de pago se rechazan aunque haya saldo */
  siliconflow:{ name:'SiliconFlow', base:() => process.env.POOL_SF_URL || 'https://api.siliconflow.com/v1', cap:+process.env.POOL_CAP_SF || 500,
    best:['Qwen/Qwen3-8B', 'THUDM/GLM-4-9B-0414', 'Qwen/Qwen2.5-7B-Instruct'] }
};
export const ORDER = ['groq', 'google', 'mistral', 'openrouter', 'cloudflare', 'ollama', 'siliconflow'];
/* llaves que no son de chat (imágenes): se guardan y prueban igual, pero no entran a la lista de IAs */
export const IMG = { pollinations:{ name:'Pollinations (imágenes)', base:() => process.env.POOL_POLLI_URL || 'https://gen.pollinations.ai', cap:+process.env.POOL_CAP_POLLI || 150 } };
/* v2.1 · buscadores para «Buscar en internet» (sin tarjeta: Tavily y Exa; Wikipedia siempre gratis y sin llave) */
export const SEARCH = { tavily:{ name:'Tavily (búsqueda)', base:() => process.env.POOL_TAVILY_URL || 'https://api.tavily.com', cap:+process.env.POOL_CAP_TAVILY || 40 },
  exa:{ name:'Exa (búsqueda)', base:() => process.env.POOL_EXA_URL || 'https://api.exa.ai', cap:+process.env.POOL_CAP_EXA || 80 } };
export const KEY_PROVS = [...ORDER, 'pollinations', 'tavily', 'exa'];
export const provName = p => (PROV[p] || IMG[p] || SEARCH[p] || { name:p }).name;
const ENV_KEY = { tavily:'TAVILY_API_KEY', exa:'EXA_API_KEY', groq:'GROQ_API_KEY', mistral:'MISTRAL_API_KEY', cloudflare:'CLOUDFLARE_API_TOKEN', openrouter:'POOL_OPENROUTER_KEY', google:'GEMINI_API_KEY', ollama:'OLLAMA_API_KEY', siliconflow:'SILICONFLOW_API_KEY', pollinations:'POLLINATIONS_API_KEY' };
/* un proveedor que pide pago o cambió su plan gratis: eso es una ALERTA (no un simple «se acabó por hoy») */
export const PAY_RX = /billing|payment|pay as you go|subscri|upgrade (your|to)|credit balance|insufficient[_ ](balance|credit|funds)|top.?up|pollen|purchase|not available on the free/i;
export const PLAN_RX = /billing|payment|subscri|upgrade|plan|credit|quota exceeded|insufficient/i;
export const DAY_LIMIT_DEFAULT = 25000;   /* ≈ 30 mensajes al día por persona */
const wait = ms => new Promise(r => setTimeout(r, ms));
const err = (s, m, code) => Object.assign(new Error(m), { status:s, code });
export const mask = k => k ? '••••' + String(k).slice(-4) : '';
export const classify = s => s === 401 || s === 403 ? 'llave inválida o sin permiso' : s === 402 ? 'requiere pago (bloqueado: SymphorIA no paga)' : s === 404 ? 'modelo no disponible' : s === 429 ? 'límite gratis alcanzado por ahora' : s >= 500 ? 'el proveedor está fallando' : 'error ' + s;
export const provSaid = t => { let m = String(t || ''); try{ const j = JSON.parse(m); m = (j.error && (j.error.message || j.error)) || j.message || j.detail || m; }catch(e){} return String(typeof m === 'string' ? m : JSON.stringify(m)).replace(/(gsk_|sk-|cfat_|Bearer\s+)[\w-]{6,}/gi, '••').replace(/\s+/g, ' ').trim().slice(0, 160); };

/* si responde 429 por ir muy rápido (no por cuota agotada), espera y reintenta UNA vez */
export async function calm(make){
  let r = await make();
  if (r.status !== 429) return r;
  const txt = await r.text().catch(() => '');
  if (PLAN_RX.test(txt)) return new Response(txt, { status:429 });
  await wait(Math.min(3000, Math.max(1100, (+r.headers.get('retry-after') || 0) * 1000)));
  return make();
}

/* ---------- configuración: tope diario y llaves de cada cuenta del equipo ---------- */
export async function settings(){ const s = (await getJ('cfg:pool:set')) || {}; return { dayLimit:Math.max(1000, Math.min(500000, +s.dayLimit || DAY_LIMIT_DEFAULT)), imgDay:Math.max(0, Math.min(50, s.imgDay == null ? 3 : +s.imgDay || 0)) }; }
export async function saveSettings(patch){ const s = (await getJ('cfg:pool:set')) || {}; if (patch.dayLimit != null) s.dayLimit = Math.max(1000, Math.min(500000, Math.round(+patch.dayLimit) || DAY_LIMIT_DEFAULT)); if (patch.imgDay != null) s.imgDay = Math.max(0, Math.min(50, Math.round(+patch.imgDay) || 0)); await setJ('cfg:pool:set', s); return settings(); }
/* cfg:pool = { <sub>: { name, rank, keys:{ groq, mistral, cloudflare, openrouter } (cifradas), cfAccount, t } } */
export async function ownersRaw(){ return (await getJ('cfg:pool')) || {}; }
export async function saveOwnerKeys(me, rank, patch){
  const all = await ownersRaw(), o = all[me.sub] || { keys:{} };
  o.name = String(me.username || me.name || 'equipo').slice(0, 40); o.rank = rank; o.t = Date.now(); o.keys = o.keys || {};
  for (const id of KEY_PROVS){ if (typeof patch[id] === 'string'){ const k = patch[id].trim().slice(0, 300); if (k) o.keys[id] = enc(k); else delete o.keys[id]; } }
  if (typeof patch.cfAccount === 'string') o.cfAccount = patch.cfAccount.replace(/[^a-f0-9]/gi, '').slice(0, 64);
  all[me.sub] = o; await setJ('cfg:pool', all);
  await redis('DEL', 'pool:models');                       /* la lista de modelos se rehace con las llaves nuevas */
  return o;
}
/* quitar una llave de la lista (Pulsem): se borra donde está guardada y también lo que quedó de ella (pruebas, pausas, avisos de pago, contadores de hoy) */
export async function removeKey(id, me, canAll){
  const k = (await loadKeys()).find(x => x.id === id);
  if (!k) return { ok:false, status:404, error:'Esa llave ya no está.' };
  if (k.src === 'vercel') return { ok:false, status:400, error:'Esta llave vive en Vercel (variables de entorno). Se quita desde Vercel.' };
  const own = k.owner && k.owner.sub === me.sub;
  if (!own && !canAll) return { ok:false, status:403, error:'Solo Prime y ZFlow pueden quitar llaves de otras personas.' };
  if (k.src === 'panel'){ const L = (await getJ('cfg:trial')) || {}; if (L.keys) delete L.keys[k.prov]; await setJ('cfg:trial', L); }
  else { const all = await ownersRaw(), o = all[k.owner.sub]; if (o && o.keys){ delete o.keys[k.prov]; if (k.prov === 'cloudflare') delete o.cfAccount; o.t = Date.now(); await setJ('cfg:pool', all); } }
  const d = today();
  await pipe([['DEL', 'pk:chk:' + id], ['DEL', 'pk:down:' + id], ['DEL', 'pk:plan:' + id], ['DEL', 'pool:cfacct:' + id], ['DEL', 'pk:n:' + id + ':' + d], ['DEL', 'pk:t:' + id + ':' + d], ['DEL', 'pool:models']]);
  const rest = (await loadKeys()).some(x => x.prov === k.prov);
  if (!rest) await pipe([['DEL', 'alert:' + k.prov], ['SREM', 'alerts', k.prov]]);
  return { ok:true, prov:k.prov };
}
/* todas las llaves: las de Vercel, las del panel viejo de la prueba y las de cada cuenta del equipo */
export async function loadKeys(){
  const out = [], seen = new Set();
  const add = (prov, key, owner, src, cfAccount) => { if (!key) return; const id = sha(prov + ':' + key).slice(0, 12); if (seen.has(id)) return; seen.add(id); out.push({ id, prov, key, owner, src, cfAccount:cfAccount || '' }); };
  for (const p of KEY_PROVS) add(p, process.env[ENV_KEY[p]], { name:'Vercel', rank:'Prime' }, 'vercel', process.env.CLOUDFLARE_ACCOUNT_ID);
  const legacy = (await getJ('cfg:trial')) || {};
  for (const p of ['groq', 'mistral', 'cloudflare']) if (legacy.keys && legacy.keys[p]){ try{ add(p, dec(legacy.keys[p]), { name:'panel de la prueba', rank:'Prime' }, 'panel', legacy.cfAccount); }catch(e){} }
  const all = await ownersRaw();
  for (const [sub, o] of Object.entries(all)){
    for (const p of KEY_PROVS) if (o.keys && o.keys[p]){ try{ add(p, dec(o.keys[p]), { sub, name:o.name, rank:o.rank }, 'cuenta', o.cfAccount); }catch(e){} }
  }
  return out;
}
/* Cloudflare necesita el «Account ID»; si no está, se busca con la llave y se recuerda */
async function cfAcct(k){
  if (k.cfAccount) return k.cfAccount;
  const memo = await redis('GET', 'pool:cfacct:' + k.id); if (memo) return memo;
  const r = await fetch((process.env.TRIAL_CF_URL || 'https://api.cloudflare.com/client/v4') + '/accounts?per_page=1', { headers:{ Authorization:'Bearer ' + k.key }, signal:AbortSignal.timeout(8000) }).catch(() => null);
  const d = r && r.ok ? await r.json().catch(() => ({})) : {};
  const id = d && Array.isArray(d.result) && d.result[0] && d.result[0].id;
  if (id) await redis('SET', 'pool:cfacct:' + k.id, id, 'EX', '2592000');
  return id || '';
}
export const baseOf = async k => k.prov === 'cloudflare' ? PROV.cloudflare.base(await cfAcct(k)) : (PROV[k.prov] || IMG[k.prov] || SEARCH[k.prov]).base();

/* ---------- catálogo: solo modelos gratis de texto ---------- */
/* solo lo gratis: Google (Flash, Flash-Lite, Gemma; nunca Pro, imagen, voz ni «live») y SiliconFlow (su lista gratis) */
const GOOGLE_FREE = /^(gemini-[\d.]+-flash(-lite)?(-\d{3})?|gemini-flash(-lite)?-latest|gemma-[\w.-]+-it)$/i;
/* Google retira modelos viejos para cuentas nuevas: se ordena del más nuevo al más viejo (los «-latest» primero) */
const gVer = id => /latest/.test(id) ? 99 : +((id.match(/(\d+(?:\.\d+)?)/) || [])[1] || 0);
const gSort = (a, b) => (/^gemma/.test(a.id) - /^gemma/.test(b.id)) || (gVer(b.id) - gVer(a.id)) || (/lite/.test(a.id) - /lite/.test(b.id));
const SF_FREE = /(^|\/)(qwen3-8b|qwen2\.5-7b-instruct|qwen3\.5-4b|glm-4-9b-0414|glm-z1-9b-0414|deepseek-r1-0528-qwen3-8b|hunyuan-mt-7b)$/i;
/* modelos de la nube de Ollama que piden créditos desde el 9-nov-2026: nunca se listan ni se usan */
const OLLAMA_PAID = /^(gemma4:31b|gpt-oss:(120b|20b)|nemotron-3-(super|ultra|nano:30b))(-cloud)?$/i;
/* v3.7 · fuera los modelos de alto consumo (Sammuel, 2 nov): los de 100B parámetros o más, los «medium/large/pro» y los que piensan en voz alta.
   Gastan la cuota gratis mucho más rápido y tardan más; quedan los pequeños y rápidos (Llama 3.3 70B, Gemini Flash, Mistral Small, Llama 8B, Gemma…). */
const HEAVY = /(?:^|[^\d.])(?:[1-9]\d{2,})(?:\.\d+)?b\b|mistral-(medium|large)|magistral|pixtral-large|codestral|devstral-medium|-pro\b|qwen3-(32b|coder)|qwq|deepseek-(r1|v3|v4)(?!.*-qwen3-8b)|kimi-k2|maverick|grok/i;
export const isHeavy = id => HEAVY.test(String(id || ''));
const DROP = /whisper|guard|tts|orpheus|safeguard|allam|compound|distil|playai|embed|moderation|ocr|voxtral|transcri|lora|vision-preview|lyria|music|audio|image|flux|stable|dall/i;
async function listFor(prov, k){
  const base = await baseOf(k), H = { Authorization:'Bearer ' + k.key };
  if (prov === 'openrouter'){
    const d = await (await fetch(base + '/models', { signal:AbortSignal.timeout(10000) })).json();
    return (d.data || []).filter(m => m && m.id && /:free$/.test(m.id) && !/^openrouter\//.test(m.id) && m.pricing && +m.pricing.prompt === 0 && +m.pricing.completion === 0
      && (!m.architecture || !Array.isArray(m.architecture.output_modalities) || m.architecture.output_modalities.includes('text')) && !DROP.test(m.id))
      .map(m => ({ mid:m.id, name:String(m.name || m.id).replace(/\s*\(free\)\s*$/i, ''), ctx:+m.context_length || 0 }));
  }
  if (prov === 'cloudflare'){
    const r = await fetch(base.replace(/\/ai\/v1$/, '/ai/models/search?per_page=100&task=Text%20Generation'), { headers:H, signal:AbortSignal.timeout(10000) });
    const d = await r.json().catch(() => ({}));
    return (d.result || []).map(m => String(m.name || '')).filter(n => /^@cf\//.test(n) && !DROP.test(n)).map(n => ({ mid:n, name:n.replace(/^@cf\/[^/]+\//, ''), ctx:0 }));
  }
  const d = await (await fetch(base + '/models', { headers:H, signal:AbortSignal.timeout(10000) })).json();
  let L = (d.data || d.models || []).map(m => m && (m.id || m.name) ? Object.assign({}, m, { id:String(m.id || m.name).replace(/^models\//, '') }) : null).filter(m => m && m.active !== false && !DROP.test(m.id));
  if (prov === 'google') L = L.filter(m => GOOGLE_FREE.test(m.id)).sort(gSort);
  if (prov === 'ollama') L = L.filter(m => !OLLAMA_PAID.test(m.id));
  if (prov === 'siliconflow') L = L.filter(m => SF_FREE.test(m.id) && !/^pro\//i.test(m.id));
  if (prov === 'mistral') L = L.filter(m => !m.capabilities || m.capabilities.completion_chat !== false).filter(m => !m.deprecation && (/-latest$/.test(m.id) || /nemo/.test(m.id)));
  return L.map(m => ({ mid:m.id, name:m.id, ctx:+m.context_window || +m.max_context_length || 0 }));
}
const nice = s => String(s).replace(/^[^/]+\//, '').replace(/-latest$/, '').split(/[-_]/).map(w => /^gpt$/i.test(w) ? 'GPT' : /^oss$/i.test(w) ? 'OSS' : /^\d+(\.\d+)?b$/i.test(w) ? w.toUpperCase() : /^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
export async function models(force){
  if (!force){ const c = await getJ('pool:models'); if (c && Date.now() - c.t < 6 * 3600e3) return Object.assign(c, { list:(c.list || []).filter(m => !isHeavy(m.mid)) }); }
  const keys = await loadKeys(), out = [], provs = [];
  for (const p of ORDER){
    const ks = keys.filter(k => k.prov === p); if (!ks.length) continue;
    let got = null;
    for (const k of ks.slice(0, 2)){ try{ got = await listFor(p, k); if (got && got.length) break; }catch(e){} }
    if (!got || !got.length) got = PROV[p].best.map(mid => ({ mid, name:mid, ctx:0 }));
    provs.push(p);
    got = got.filter(m => !isHeavy(m.mid));
    got.slice(0, 40).forEach(m => out.push({ id:'sz:' + p + ':' + m.mid, prov:p, mid:m.mid, name:m.name && m.name !== m.mid ? m.name : nice(m.mid), ctx:m.ctx }));
  }
  const bad = (await redis('HGETALL', 'pool:badm').catch(() => [])) || [], gone = new Set();
  for (let i = 0; i < bad.length; i += 2) if (Date.now() - (+bad[i + 1] || 0) < 6 * 3600e3) gone.add(bad[i]);
  const c = { t:Date.now(), provs, list:out.filter(m => !gone.has(m.id)) };
  await setJ('pool:models', c, 21600);
  return c;
}

/* ---------- elegir llave: la menos usada hoy, sin pausas y bajo su tope ---------- */
export async function pickKeys(prov){
  const d = today(), ks = (await loadKeys()).filter(k => k.prov === prov); if (!ks.length) return [];
  const r = await pipe(ks.flatMap(k => [['GET', 'pk:n:' + k.id + ':' + d], ['GET', 'pk:down:' + k.id]]));
  const cap = (PROV[prov] || IMG[prov] || SEARCH[prov]).cap;
  return ks.map((k, i) => Object.assign(k, { n:+r[i * 2] || 0, down:r[i * 2 + 1] })).filter(k => !k.down && k.n < cap).sort((a, b) => a.n - b.n);
}
/* orden de respaldo: el modelo pedido y, si su proveedor no responde, el mejor de los otros */
async function plan(model){
  const cat = await models(false), want = cat.list.find(m => m.id === model);
  const alts = [];
  for (const p of ORDER){ const m = PROV[p].best.map(b => cat.list.find(x => x.prov === p && x.mid === b)).find(Boolean) || cat.list.find(x => x.prov === p); if (m) alts.push(m); }
  if (model && model !== 'sz:auto' && !want) throw err(400, 'Ese modelo no es de los gratis de SymphorIA.', 'sz_model');
  return want ? [want, ...alts.filter(a => a.prov !== want.prov)].slice(0, 4) : alts.slice(0, 4);   /* v3.7 · un respaldo más: si fallan 3 proveedores, prueba un cuarto */
}

/* ---------- cuota de cada persona ---------- */
export const quotaKey = who => 'q:' + who + ':' + today();
export async function usedToday(who){ return +(await redis('GET', quotaKey(who))) || 0; }

/* ---------- v3.4 · fotos para las IAs que ven ----------
   El navegador manda la foto como «image_url» (data:image/…;base64). Solo viajan las de los 2 últimos mensajes tuyos (máx. 4);
   las demás quedan como «[imagen]». Con fotos, responde una IA que sí ve: Gemini Flash, Llama 4, Mistral Small/Medium, Pixtral… */
const IMG_PRE = /^data:image\/(jpeg|png|webp|gif);base64,/, IMG_LEN = 2_500_000, IMG_MAX = 4;
export const VISION_RX = /gemini|gemma-3(?!n)|llama-4|pixtral|mistral-(small|medium)|[-_/]vl\b|-vl-|vision|qwen2\.5-vl|kimi-vl/i;
const VIS_ORDER = ['google', 'groq', 'mistral', 'openrouter'];
const txtLen = m => typeof m.content === 'string' ? m.content.length : m.content[0].text.length;
export function normMsgs(messages){
  const list = (Array.isArray(messages) ? messages : []).filter(m => m && ['user', 'assistant', 'system'].includes(m.role) && (typeof m.content === 'string' || Array.isArray(m.content))).slice(-24);
  let left = IMG_MAX; const lastUsers = new Set(list.map((m, i) => m.role === 'user' ? i : -1).filter(i => i >= 0).slice(-2));
  const out = new Array(list.length);
  for (let i = list.length - 1; i >= 0; i--){       /* de la más nueva a la más vieja: las fotos recientes tienen prioridad */
    const m = list[i];
    if (typeof m.content === 'string'){ out[i] = { role:m.role, content:m.content.slice(0, 12000) }; continue; }
    let text = '', dropped = 0; const imgs = [];
    for (const p of m.content){
      if (!p || typeof p !== 'object') continue;
      if (p.type === 'text' && typeof p.text === 'string') text += (text ? '\n' : '') + p.text;
      else if (p.type === 'image_url'){
        const u = p.image_url && (typeof p.image_url === 'string' ? p.image_url : p.image_url.url);
        if (m.role === 'user' && lastUsers.has(i) && left > 0 && typeof u === 'string' && u.length <= IMG_LEN && IMG_PRE.test(u.slice(0, 40))){ imgs.push(u); left--; }
        else dropped++;
      }
    }
    text = text.slice(0, 12000) + (dropped ? '\n[' + dropped + ' imagen(es) adjunta(s) antes]' : '');
    out[i] = imgs.length ? { role:m.role, content:[{ type:'text', text:text.trim() || 'Mira la imagen.' }, ...imgs.map(url => ({ type:'image_url', image_url:{ url } }))] } : { role:m.role, content:text };
  }
  return { msgs:out, nImg:IMG_MAX - left };
}
/* con fotos: la IA pedida si ve, y si no (o falla) las mejores que ven de cada proveedor */
async function visionPlan(model){
  const cat = await models(false), want = cat.list.find(m => m.id === model);
  const alts = [];
  for (const p of VIS_ORDER){
    const vs = cat.list.filter(m => m.prov === p && VISION_RX.test(m.mid));
    const m = vs.find(x => /gemini.*flash(?!-lite)/i.test(x.mid)) || vs.find(x => !/lite|gemma-3-(1|4)b/i.test(x.mid)) || vs[0];
    if (m) alts.push(m);
  }
  const first = want && VIS_ORDER.includes(want.prov) && VISION_RX.test(want.mid) ? want : null;
  return first ? [first, ...alts.filter(a => a.prov !== first.prov)].slice(0, 4) : alts.slice(0, 4);
}
/* v3.4 · la IA que revisa las respuestas: la que mejor razona entre las gratis (con fotos, una que ve) */
const REVIEW_PREF = ['google:gemini-flash-latest', 'google:gemini-2.5-flash', 'groq:llama-3.3-70b-versatile', 'mistral:mistral-small-latest', 'groq:openai/gpt-oss-20b'];   /* v3.7 · sin modelos de alto consumo */
export async function reviewerModel(withImg){
  const cat = await models(false);
  if (withImg){ const v = await visionPlan(''); return v[0] ? v[0].id : ''; }
  for (const id of REVIEW_PREF){ if (cat.list.some(m => m.id === 'sz:' + id)) return 'sz:' + id; }
  return 'sz:auto';
}

/* ---------- conversar (con streaming) ---------- */
const est = s => Math.ceil(String(s || '').length / 4);
/* cuánto puede escribir cada IA en una sola respuesta (antes eran 1.200: por eso las respuestas largas se cortaban) */
const OUT_MAX = { groq:6000, mistral:6000, openrouter:6000, google:8000, ollama:6000, cloudflare:3500, siliconflow:4000 };
const outTok = (prov, asked) => Math.max(64, Math.min(OUT_MAX[prov] || 3500, Math.round(+asked) || 4096));
/* v3.0 · free: el equipo (Prime, ZFlow y Symmetrix) usa todo sin límite de EnerX para probar (pedido de Sammuel, 27 oct).
   Lo suyo no cuenta para el límite de su conexión (así no le quita a nadie que esté en la misma red) y su batería se ve llena */
/* v3.8 · ¿esta IA responde de verdad? Una pregunta mínima (máx. 4 palabras de respuesta) contra ESE modelo, sin respaldos.
   El resultado se guarda para todos: 'ok' 10 min, 'busy' (llena o lenta) 2 min, 'down' (ya no existe) 30 min. No gasta el límite de nadie. */
export async function pingModel(id){
  const ck = 'mp:' + id, hit = await redis('GET', ck).catch(() => null);
  if (hit === 'ok' || hit === 'busy' || hit === 'down') return hit;
  const put = async (v, ttl) => { await redis('SET', ck, v, 'EX', String(ttl)).catch(() => {}); return v; };
  const m = (await models(false)).list.find(x => x.id === id);
  if (!m) return put('down', 1800);
  const keys = (await pickKeys(m.prov)).slice(0, 2);
  if (!keys.length) return put('busy', 120);
  for (const k of keys){
    let up = null;
    try{
      const body = { model:m.mid, messages:[{ role:'user', content:'Responde solo: ok' }], max_tokens:m.prov === 'google' ? 16 : 4, temperature:0, stream:false };
      if (m.prov === 'siliconflow') body.enable_thinking = false;
      up = await fetch((await baseOf(k)) + '/chat/completions', { method:'POST', signal:AbortSignal.timeout(12000),
        headers:Object.assign({ Authorization:'Bearer ' + k.key, 'content-type':'application/json' }, m.prov === 'openrouter' ? { 'HTTP-Referer':'https://synthz.app', 'X-Title':'SymphorIA' } : {}), body:JSON.stringify(body) });
    }catch(e){ up = null; }
    if (up && up.ok){ await pipe([['INCR', 'pk:n:' + k.id + ':' + today()], ['EXPIRE', 'pk:n:' + k.id + ':' + today(), '172800']]).catch(() => {}); return put('ok', 600); }
    const s = up ? up.status : 0, txt = up ? await up.text().catch(() => '') : '';
    if (s === 404 || (s === 400 && /model/i.test(txt) && /not|exist|invalid|decommission|support/i.test(txt))){
      await pipe([['HSET', 'pool:badm', m.id, String(Date.now())], ['DEL', 'pool:models']]).catch(() => {});
      return put('down', 1800);
    }
    if (s === 402 || ((s === 401 || s === 403) && PAY_RX.test(txt))) await markPay(k, s, txt);
  }
  return put('busy', 120);
}
export async function chat({ who, ipKey, messages, model, maxTokens, system, stream = true, onDone, free = false, temperature = .6 }){
  const { dayLimit } = await settings();
  const [used, usedIp] = free ? [0, 0] : (await pipe([['GET', quotaKey(who)], ['GET', quotaKey(ipKey)]])).map(x => +x || 0);
  if (used >= dayLimit) throw err(429, 'Llegaste al límite de hoy. Se renueva a medianoche. Si quieres seguir ya, conecta Puter (gratis, opcional).', 'sz_limit');
  if (usedIp >= dayLimit * 3) throw err(429, 'Desde esta conexión ya se usó mucho hoy. Se renueva a medianoche, o conecta Puter (gratis, opcional).', 'sz_limit_ip');
  let { msgs, nImg } = normMsgs(messages);
  while (msgs.length > 1 && msgs.reduce((s, m) => s + txtLen(m), 0) > 48000) msgs = msgs.slice(1);
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') throw err(400, 'Escribe un mensaje.', 'sz_empty');
  if (system) msgs = [{ role:'system', content:system }, ...msgs.filter(m => m.role !== 'system')];
  nImg = msgs.reduce((n, m) => n + (Array.isArray(m.content) ? m.content.length - 1 : 0), 0);
  const inTok = msgs.reduce((s, m) => s + est(typeof m.content === 'string' ? m.content : m.content[0].text), 0) + nImg * 1000;
  const steps = nImg ? await visionPlan(model) : await plan(model || 'sz:auto');
  if (nImg && !steps.length) throw err(400, 'Ahora mismo ninguna IA conectada puede ver imágenes. Elige una IA que diga «ve fotos» o envía tu pregunta sin la imagen.', 'sz_novision');
  if (!steps.length) throw err(503, 'Las IAs están descansando un momento. Mientras tanto, puedes conectar Puter.', 'sz_off');
  const d = today(), t0 = Date.now(), tried = [];
  for (const m of steps){
    const keys = (await pickKeys(m.prov)).slice(0, 2);
    for (const k of keys){
      let up;
      try{
        const base = await baseOf(k);
        const body = { model:m.mid, messages:msgs, stream, max_tokens:outTok(m.prov, maxTokens), temperature };
        if (stream && (m.prov === 'groq' || m.prov === 'mistral')) body.stream_options = { include_usage:true };
        if (stream && m.prov === 'openrouter') body.usage = { include:true };
        if (m.prov === 'siliconflow') body.enable_thinking = false;
        const ac = new AbortController(); let tm = setTimeout(() => ac.abort(), 30000);   /* solo espera a que el proveedor conteste */
        try{
          up = await calm(() => fetch(base + '/chat/completions', { method:'POST', signal:ac.signal,
            headers:Object.assign({ Authorization:'Bearer ' + k.key, 'content-type':'application/json' }, m.prov === 'openrouter' ? { 'HTTP-Referer':'https://synthz.app', 'X-Title':'SymphorIA' } : {}), body:JSON.stringify(body) }));
        } finally { clearTimeout(tm); }
        if (up && up.ok && !stream){ tm = setTimeout(() => ac.abort(), 60000); up._tm = tm; }   /* sin streaming sí hay que esperar el cuerpo completo */
      }catch(e){ up = null; }
      if (!up || !up.ok || (stream && !up.body)){
        const s = up ? up.status : 0, txt = up ? await up.text().catch(() => '') : '';
        tried.push(m.prov + ':' + (s || 'sin respuesta'));
        console.error('[synthz] ia', m.prov, k.id, s ? classify(s) : 'sin respuesta');      /* sin llaves ni mensajes */
        if (s === 402 || ((s === 401 || s === 403) && PAY_RX.test(txt))) await markPay(k, s, txt);
        const ttl = s === 429 ? (PLAN_RX.test(txt) ? 1800 : 60) : s === 401 || s === 403 || s === 402 ? 3600 : 120;
        /* alerta: si el modelo ya no existe, se esconde para todos 6 h y la lista se rehace */
        if (s === 404 || (s === 400 && !nImg && /model/i.test(txt))) await pipe([['HSET', 'pool:badm', m.id, String(Date.now())], ['DEL', 'pool:models'], ['LPUSH', 'evl', JSON.stringify({ t:Date.now(), kind:'error', who:'Servidor', rank:'Alerta', sub:'', page:'ia', detail:'Modelo sin servicio: ' + m.name + ' (' + m.prov + ')' })], ['LTRIM', 'evl', '0', '299']]).catch(() => {});
        await pipe([['SET', 'pk:down:' + k.id, (s ? classify(s) : 'sin respuesta') + (txt ? ' · ' + provSaid(txt) : ''), 'EX', String(ttl)], ['HINCRBY', 'st:' + d, 'err', '1']]);
        continue;
      }
      await pipe([['INCR', 'pk:n:' + k.id + ':' + d], ['EXPIRE', 'pk:n:' + k.id + ':' + d, '172800'], ['DEL', 'pk:plan:' + k.id]]);
      const account = async (tok, outChars) => {
        const total = Math.max(1, tok || 0);
        /* v3.7 · se devuelve lo que quedó de verdad en el contador (INCRBY), no «lo de antes + esto»: con dos respuestas a la vez la pila ya no salta */
        const res = await pipe([...(free ? [] : [['INCRBY', quotaKey(who), String(total)], ['EXPIRE', quotaKey(who), '172800'], ['INCRBY', quotaKey(ipKey), String(total)], ['EXPIRE', quotaKey(ipKey), '172800']]),
          ['INCRBY', 'pk:t:' + k.id + ':' + d, String(total)], ['EXPIRE', 'pk:t:' + k.id + ':' + d, '172800'],
          ['INCR', 'stm:' + Math.floor(Date.now() / 60e3)], ['EXPIRE', 'stm:' + Math.floor(Date.now() / 60e3), '3600'],
          ['HINCRBY', 'st:' + d, 'req', '1'], ['HINCRBY', 'st:' + d, 'tok', String(total)], ['HINCRBY', 'st:' + d, 'ms', String(Date.now() - t0)], ['EXPIRE', 'st:' + d, '1209600']]).catch(() => {});
        if (onDone) try{ await onDone(total); }catch(e){}
        account.now = !free && Array.isArray(res) && Number.isFinite(+res[0]) ? +res[0] : null;
        return total;
      };
      const meta = { prov:m.prov, provName:PROV[m.prov].name, model:m.id, name:m.name, fallback:!!(model && model !== 'sz:auto' && m.id !== model) };   /* v3.7 · la que elegiste no respondió (o no ve fotos): respondió otra */
      if (!stream){
        const j = await up.json().catch(() => ({})); clearTimeout(up._tm); const text = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
        if (typeof text !== 'string' || !text.trim()) continue;
        const u = j.usage || {}, tok = (u.prompt_tokens || 0) + (u.completion_tokens || 0) || inTok + est(text);
        const total = await account(tok);
        return { text:text.trim(), meta, used:free ? 0 : (account.now ?? used + total), limit:dayLimit };
      }
      /* streaming: se pasa tal cual y al final se suma lo gastado (lo que dijo el proveedor o una estimación) */
      const dec2 = new TextDecoder(), enc2 = new TextEncoder(); let buf = '', usage = null, outChars = 0;
      const ts = new TransformStream({
        transform(chunk, ctl){
          ctl.enqueue(chunk);
          buf += dec2.decode(chunk, { stream:true }); let i;
          while ((i = buf.indexOf('\n')) >= 0){
            const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
            if (!line.startsWith('data:')) continue; const x = line.slice(5).trim(); if (x === '[DONE]') continue;
            /* v3.3 · casi sin procesador (Workers gratis da 10 ms): solo se lee el JSON de la línea que trae el gasto; el resto se cuenta por su largo */
            if (x.indexOf('"usage"') < 0){ const c = x.indexOf('"content":"'); if (c >= 0) outChars += Math.max(0, x.length - c - 30); continue; }
            try{ const j = JSON.parse(x); const u = j.usage || (j.x_groq && j.x_groq.usage); if (u) usage = u; }catch(e){}
          }
        },
        async flush(ctl){
          const tok = usage ? (usage.prompt_tokens || 0) + (usage.completion_tokens || 0) : inTok + Math.ceil(outChars / 4);
          const total = await account(tok);
          ctl.enqueue(enc2.encode('data: ' + JSON.stringify({ sz:{ used:free ? 0 : (account.now ?? used + total), limit:dayLimit, spent:total, est:!usage } }) + '\n\n'));
        }
      });
      return { stream:up.body.pipeThrough(ts), meta, used, limit:dayLimit };
    }
  }
  await redis('HINCRBY', 'st:' + d, 'fail', '1').catch(() => {});
  throw err(503, 'Las IAs están muy ocupadas ahora mismo. Intenta en un momento o conecta Puter.', 'sz_down');
}

/* ---------- alerta: un proveedor pidió pago o quitó lo gratis ----------
   Se anota la llave (pk:plan:<id>), el proveedor (alerts) y un aviso para el equipo en Pulsem.
   Si TODAS las llaves de chat están así, la página entra en «modo alerta» hasta que vuelva una. */
export async function markPay(k, s, txt){
  const info = JSON.stringify({ t:Date.now(), prov:k.prov, s, msg:provSaid(txt) });
  await pipe([['SET', 'pk:plan:' + k.id, info, 'EX', '259200'], ['SET', 'alert:' + k.prov, info], ['SADD', 'alerts', k.prov],
    ['LPUSH', 'evl', JSON.stringify({ t:Date.now(), kind:'error', who:'Servidor', rank:'Alerta', sub:'', page:'ia', detail:'ALERTA: ' + provName(k.prov) + ' pidió pago o cambió su plan gratis (' + s + '). Revisa Pulsem.' })], ['LTRIM', 'evl', '0', '299']]).catch(() => {});
}
export async function clearPay(k){
  await redis('DEL', 'pk:plan:' + k.id).catch(() => {});
  const rest = (await loadKeys()).filter(x => x.prov === k.prov && x.id !== k.id);
  const still = rest.length ? await pipe(rest.map(x => ['EXISTS', 'pk:plan:' + x.id])) : [];
  if (!still.some(x => +x)) await pipe([['DEL', 'alert:' + k.prov], ['SREM', 'alerts', k.prov]]).catch(() => {});
}
export async function alerts(){
  const provs = (await redis('SMEMBERS', 'alerts')) || [];
  const rows = provs.length ? await pipe(provs.map(p => ['GET', 'alert:' + p])) : [];
  return provs.map((p, i) => { let a = {}; try{ a = JSON.parse(rows[i] || '{}'); }catch(e){} return Object.assign({ prov:p, name:provName(p) }, a); });
}
/* ¿quedó alguna IA gratis? (si hay llaves y todas pidieron pago → modo alerta) */
export async function outage(){
  const ks = (await loadKeys()).filter(k => ORDER.includes(k.prov)); if (!ks.length) return false;
  const r = await pipe(ks.map(k => ['EXISTS', 'pk:plan:' + k.id]));
  return r.every(x => +x);
}

/* ---------- estado para el panel: cada llave con su uso de hoy ---------- */
export async function status(){
  const d = today(), keys = await loadKeys();
  const r = keys.length ? await pipe(keys.flatMap(k => [['GET', 'pk:n:' + k.id + ':' + d], ['GET', 'pk:t:' + k.id + ':' + d], ['GET', 'pk:down:' + k.id], ['GET', 'pk:chk:' + k.id]])) : [];
  return keys.map((k, i) => { let chk = null; try{ chk = JSON.parse(r[i * 4 + 3] || 'null'); }catch(e){} return { id:k.id, prov:k.prov, provName:provName(k.prov), key:mask(k.key), owner:k.owner, src:k.src, n:+r[i * 4] || 0, tok:+r[i * 4 + 1] || 0, cap:(PROV[k.prov] || IMG[k.prov] || SEARCH[k.prov]).cap, down:r[i * 4 + 2] || '', check:chk }; });
}
/* probar una llave con un mensaje mínimo (máx. 4 palabras de respuesta) */
/* una búsqueda en un proveedor: devuelve [{ t, u, s }] (título, enlace, resumen) */
export async function searchWith(k, q, n = 6){
  if (k.prov === 'tavily'){
    const r = await fetch(SEARCH.tavily.base() + '/search', { method:'POST', headers:{ Authorization:'Bearer ' + k.key, 'content-type':'application/json' }, body:JSON.stringify({ query:q, max_results:n, search_depth:'basic', include_answer:false }), signal:AbortSignal.timeout(15000) });
    if (!r.ok) throw Object.assign(new Error('tavily ' + r.status), { status:r.status, txt:await r.text().catch(() => '') });
    const d = await r.json(); return (d.results || []).map(x => ({ t:String(x.title || ''), u:String(x.url || ''), s:String(x.content || '').slice(0, 700) }));
  }
  if (k.prov === 'exa'){
    const r = await fetch(SEARCH.exa.base() + '/search', { method:'POST', headers:{ 'x-api-key':k.key, 'content-type':'application/json' }, body:JSON.stringify({ query:q, numResults:n, contents:{ text:{ maxCharacters:700 } } }), signal:AbortSignal.timeout(15000) });
    if (!r.ok) throw Object.assign(new Error('exa ' + r.status), { status:r.status, txt:await r.text().catch(() => '') });
    const d = await r.json(); return (d.results || []).map(x => ({ t:String(x.title || ''), u:String(x.url || ''), s:String(x.text || '').slice(0, 700) }));
  }
  return [];
}
/* Wikipedia en español: siempre gratis y sin llave (respaldo) */
export async function searchWiki(q, n = 4){
  const base = process.env.POOL_WIKI_URL || 'https://es.wikipedia.org';
  const r = await fetch(base + '/w/api.php?action=query&list=search&format=json&utf8=1&srlimit=' + n + '&srsearch=' + encodeURIComponent(q), { headers:{ 'user-agent':'SymphorIA/2.1 (https://synthz-style.vercel.app)' }, signal:AbortSignal.timeout(10000) });
  if (!r.ok) return [];
  const d = await r.json().catch(() => ({}));
  return ((d.query && d.query.search) || []).map(x => ({ t:String(x.title), u:base + '/wiki/' + encodeURIComponent(String(x.title).replace(/ /g, '_')), s:String(x.snippet || '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').slice(0, 500) }));
}
export async function checkKey(k){
  if (SEARCH[k.prov]){
    try{
      await searchWith(k, 'SymphorIA prueba', 1);
      const out = { ok:true, kind:'ok', state:'funciona · búsquedas gratis (sin tarjeta)' };
      await redis('SET', 'pk:chk:' + k.id, JSON.stringify(Object.assign({ t:Date.now() }, out)), 'EX', '604800'); await redis('DEL', 'pk:down:' + k.id); await clearPay(k);
      return out;
    }catch(e){
      const s = e.status || 0, out = s === 401 || s === 403 ? { ok:false, kind:'auth', state:'llave no autorizada' } : s === 432 || s === 402 || PAY_RX.test(e.txt || '') ? { ok:false, kind:'plan', state:'se acabaron las búsquedas gratis del mes' } : s === 429 ? { ok:false, kind:'limit', state:'límite gratis alcanzado por ahora' } : { ok:false, kind:'down', state:s ? classify(s) : 'no respondió a tiempo' };
      await redis('SET', 'pk:chk:' + k.id, JSON.stringify(Object.assign({ t:Date.now() }, out)), 'EX', '604800');
      return out;
    }
  }
  if (k.prov === 'pollinations'){
    try{
      const r = await fetch(IMG.pollinations.base() + '/v1/models', { headers:{ Authorization:'Bearer ' + k.key }, signal:AbortSignal.timeout(10000) });
      const out = r.status === 401 || r.status === 403 ? { ok:false, kind:'auth', state:'llave no autorizada' } : r.ok ? { ok:true, kind:'ok', state:'guardada · solo gasta el saldo (pollen) que ya tengas; nunca cobra a una tarjeta' } : { ok:false, kind:'down', state:classify(r.status) };
      await redis('SET', 'pk:chk:' + k.id, JSON.stringify(Object.assign({ t:Date.now() }, out)), 'EX', '604800');
      if (out.ok){ await redis('DEL', 'pk:down:' + k.id); if (await redis('EXISTS', 'pk:plan:' + k.id)){ out.state = 'llave válida, pero se quedó sin saldo (pollen): las imágenes siguen pausadas'; out.kind = 'plan'; out.ok = false; } }
      return out;
    }catch(e){ return { ok:false, kind:'down', state:'no respondió a tiempo' }; }
  }
  const save = async out => { await redis('SET', 'pk:chk:' + k.id, JSON.stringify(Object.assign({ t:Date.now() }, out)), 'EX', '604800').catch(() => {}); return out; };
  try{
    const base = await baseOf(k);
    if (k.prov === 'cloudflare' && /accounts\/\/ai/.test(base)) return save({ ok:false, kind:'auth', state:'no encontré el Account ID de Cloudflare' });
    let listed = true;
    const list = await listFor(k.prov, k).catch(() => { listed = false; return []; });
    const cands = k.prov === 'google' ? list.map(m => m.mid) : [...PROV[k.prov].best.filter(b => list.some(m => m.mid === b)), ...list.map(m => m.mid)];
    const mids = [...new Set(cands.length ? cands : PROV[k.prov].best)].slice(0, 3);
    let out, c, tx = '';
    for (const mid of mids){
      await wait(k.prov === 'mistral' ? 1200 : 100);
      const t0 = Date.now(), body = { model:mid, messages:[{ role:'user', content:'Responde solo: ok' }], max_tokens:8, temperature:0 };
      if (k.prov === 'siliconflow') body.enable_thinking = false;
      try{ c = await calm(() => fetch(base + '/chat/completions', { method:'POST', headers:{ Authorization:'Bearer ' + k.key, 'Content-Type':'application/json' }, body:JSON.stringify(body), signal:AbortSignal.timeout(k.prov === 'siliconflow' || k.prov === 'ollama' ? 20000 : 12000) })); }
      catch(e){ out = { ok:false, kind:'down', state:'no respondió a tiempo (el proveedor está lento)', model:mid }; continue; }
      if (c.ok){ const j = await c.json().catch(() => ({})); out = j && j.choices ? { ok:true, kind:'ok', state:'funciona · respondió en ' + ((Date.now() - t0) / 1000).toFixed(1).replace('.', ',') + ' s', model:mid } : { ok:false, kind:'err', state:'respondió en un formato raro', model:mid }; break; }
      tx = await c.text().catch(() => ''); const s = c.status;
      out = s === 402 || (s === 403 && PLAN_RX.test(tx)) ? { ok:false, kind:'plan', state:'pide un plan o un pago (SymphorIA no lo activa)' } : s === 401 || s === 403 ? { ok:false, kind:'auth', state:'llave no autorizada' } : s === 429 ? (listed && !PLAN_RX.test(tx) ? { ok:true, kind:'busy', state:'llave válida ✓ · ahora mismo está ocupada (su plan gratis permite pocas por minuto); se usa sola cuando se libera' } : { ok:false, kind:'limit', state:'límite gratis alcanzado por ahora' }) : { ok:false, kind:'down', state:classify(s) };
      out.detail = provSaid(tx); out.model = mid;
      if (s === 404 || (s === 400 && /model/i.test(tx))) continue;   /* modelo retirado: prueba el siguiente */
      break;
    }
    await save(out);
    if (out.ok){ await redis('DEL', 'pk:down:' + k.id); await clearPay(k); }
    else if (out.kind === 'plan') await markPay(k, c ? c.status : 402, out.detail || '');
    return out;
  }catch(e){ return save({ ok:false, kind:'down', state:'no respondió a tiempo' }); }
}

