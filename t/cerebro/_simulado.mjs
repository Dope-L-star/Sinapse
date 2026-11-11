/* Servidor de mentira para probar api/ai.js sin internet ni llaves: Redis en memoria y cuatro proveedores (Groq, Google, Mistral, OpenRouter).
   Lo usan t/cerebro/codigo.mjs y t/cerebro/codigo-radiografia.mjs. Se importa UNA vez por proceso (pone variables de entorno y cambia fetch). */
import path from 'node:path'; import { fileURLToPath } from 'node:url';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
process.env.KV_REST_API_URL = 'http://redis.test'; process.env.KV_REST_API_TOKEN = 't';
process.env.GROQ_API_KEY = 'gsk_prueba'; process.env.GEMINI_API_KEY = 'AIza_prueba'; process.env.MISTRAL_API_KEY = 'm_prueba'; process.env.POOL_OPENROUTER_KEY = 'sk-or-prueba';
export const kv = new Map(), sets = new Map(), hs = new Map();
function run(c){
  const op = String(c[0]).toUpperCase(), k = String(c[1] ?? '');
  if (op === 'GET') return kv.has(k) ? kv.get(k) : null;
  if (op === 'SET'){ kv.set(k, String(c[2])); return 'OK'; }
  if (op === 'DEL'){ c.slice(1).forEach(x => { kv.delete(String(x)); sets.delete(String(x)); hs.delete(String(x)); }); return 1; }
  if (op === 'INCR' || op === 'INCRBY'){ const n = (+kv.get(k) || 0) + (op === 'INCR' ? 1 : +c[2]); kv.set(k, String(n)); return n; }
  if (op === 'HINCRBY'){ const h = hs.get(k) || new Map(); h.set(String(c[2]), (+h.get(String(c[2])) || 0) + +c[3]); hs.set(k, h); return h.get(String(c[2])); }
  if (op === 'HSET'){ const h = hs.get(k) || new Map(); h.set(String(c[2]), String(c[3])); hs.set(k, h); return 1; }
  if (op === 'HGETALL'){ const h = hs.get(k); return h ? [...h].flat().map(String) : []; }
  if (op === 'SADD'){ const s = sets.get(k) || new Set(); c.slice(2).forEach(x => s.add(String(x))); sets.set(k, s); return 1; }
  if (op === 'SCARD') return (sets.get(k) || new Set()).size;
  if (op === 'SISMEMBER') return (sets.get(k) || new Set()).has(String(c[2])) ? 1 : 0;
  return null;
}
/* calls = lo que recibió cada proveedor · reply = qué contesta (texto o función(body)) · hook(host, body) = para forzar errores (devuelve un Response o null) */
export const sim = { calls:[], reply:'Listo.', hook:null };
const HOSTS = { 'api.groq.com':'groq', 'generativelanguage.googleapis.com':'google', 'api.mistral.ai':'mistral', 'openrouter.ai':'openrouter' };
const sse = t => new Response('data: ' + JSON.stringify({ choices:[{ delta:{ content:t } }] }) + '\n\ndata: [DONE]\n\n', { headers:{ 'content-type':'text/event-stream' } });
globalThis.fetch = async (url, o = {}) => {
  const u = String(url), host = (() => { try{ return new URL(u).host; }catch(e){ return ''; } })();
  if (u.startsWith('http://redis.test')){ const b = JSON.parse(o.body || '[]'); return new Response(JSON.stringify(u.endsWith('/pipeline') ? b.map(c => ({ result:run(c) })) : { result:run(b) })); }
  if (/\/models(\?|$)/.test(u)){
    if (u.includes('groq')) return new Response(JSON.stringify({ data:[{ id:'llama-3.3-70b-versatile' }, { id:'openai/gpt-oss-20b' }, { id:'openai/gpt-oss-120b' }, { id:'llama-3.1-8b-instant' }] }));
    if (u.includes('googleapis')) return new Response(JSON.stringify({ data:[{ id:'models/gemini-flash-latest' }, { id:'models/gemini-flash-lite-latest' }] }));
    if (u.includes('mistral')) return new Response(JSON.stringify({ data:[{ id:'mistral-small-latest' }, { id:'mistral-large-latest' }] }));
    if (u.includes('openrouter')) return new Response(JSON.stringify({ data:[{ id:'qwen/qwen3-coder:free', name:'Qwen3 Coder (free)', context_length:262144, pricing:{ prompt:'0', completion:'0' } }, { id:'meta-llama/llama-3.3-70b-instruct:free', name:'Llama 3.3 70B (free)', context_length:65536, pricing:{ prompt:'0', completion:'0' } }] }));
    return new Response('{}', { status:404 });
  }
  if (u.endsWith('/chat/completions')){
    const b = JSON.parse(o.body), prov = HOSTS[host] || host; sim.calls.push({ host, prov, body:b });
    if (sim.hook){ const r = sim.hook(prov, b); if (r) return r; }
    const t = typeof sim.reply === 'function' ? sim.reply(b) : sim.reply;
    return b.stream ? sse(t) : new Response(JSON.stringify({ choices:[{ message:{ content:t } }], usage:{ prompt_tokens:10, completion_tokens:10 } }));
  }
  return new Response('{}', { status:404 });
};
export const ai = (await import(path.join(ROOT, 'api/ai.js'))).default;
let dev = 0;
/* cada pedido sale de un «dispositivo» distinto (sin cuenta hay pocos mensajes al día por dispositivo) */
export const post = b => ai.fetch(new Request('https://synthz.test/api/ai', { method:'POST', headers:{ 'content-type':'application/json', 'x-real-ip':'10.0.' + (dev >> 8) + '.' + (dev & 255), 'x-sz-device':'dev-simulado-' + (++dev) + '-xxxx' }, body:JSON.stringify(b) }));
export const limpiar = () => { sim.calls.length = 0; kv.clear(); sets.clear(); hs.clear(); sim.reply = 'Listo.'; sim.hook = null; };
