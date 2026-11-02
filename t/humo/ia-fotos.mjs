/* Prueba de v3.4: fotos para las IAs y la revisión de calidad, contra api/ai.js real con un Redis y unos proveedores de mentira.
   Revisa: una foto llega a una IA que ve (no se pierde); con fotos no se responde con una IA que no ve;
   la revisión devuelve OK o la respuesta corregida, y descarta una «corrección» cortada. No sale a internet.
   Se corre desde la raíz del repo:  node t/humo/ia-fotos.mjs */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '../..'));
let fails = 0;
const check = (name, cond, why) => { if (cond) console.log('OK    ' + name); else { fails++; console.log('FALLO ' + name + ' — ' + String(why || 'no se cumple').slice(0, 300)); } };

process.env.KV_REST_API_URL = 'http://redis.test'; process.env.KV_REST_API_TOKEN = 't';
process.env.GROQ_API_KEY = 'gsk_prueba'; process.env.GEMINI_API_KEY = 'AIza_prueba';
const kv = new Map(), sets = new Map();
function run(c){
  const op = String(c[0]).toUpperCase(), k = String(c[1] ?? '');
  if (op === 'GET') return kv.has(k) ? kv.get(k) : null;
  if (op === 'SET'){ kv.set(k, String(c[2])); return 'OK'; }
  if (op === 'DEL'){ c.slice(1).forEach(x => { kv.delete(String(x)); sets.delete(String(x)); }); return 1; }
  if (op === 'INCR' || op === 'INCRBY' || op === 'HINCRBY'){ const n = (+kv.get(k) || 0) + (op === 'INCR' ? 1 : +c[c.length - 1]); kv.set(k, String(n)); return n; }
  if (op === 'SADD'){ const s = sets.get(k) || new Set(); c.slice(2).forEach(x => s.add(String(x))); sets.set(k, s); return 1; }
  if (op === 'SCARD') return (sets.get(k) || new Set()).size;
  if (op === 'SISMEMBER') return (sets.get(k) || new Set()).has(String(c[2])) ? 1 : 0;
  if (op === 'SMEMBERS') return [...(sets.get(k) || [])];
  if (op === 'HGETALL') return [];
  return null;
}
/* proveedores: Groq (texto + Llama 4 que ve) y Google (Gemini Flash que ve). Se anota qué le llegó a cada uno. */
const calls = []; let reply = 'Hola';
const sse = t => new Response('data: ' + JSON.stringify({ choices:[{ delta:{ content:t } }] }) + '\n\ndata: [DONE]\n\n', { headers:{ 'content-type':'text/event-stream' } });
globalThis.fetch = async (url, o = {}) => {
  const u = String(url);
  if (u.startsWith('http://redis.test')){ const b = JSON.parse(o.body || '[]'); const out = u.endsWith('/pipeline') ? b.map(c => ({ result:run(c) })) : { result:run(b) }; return new Response(JSON.stringify(out)); }
  if (u.endsWith('/models')){
    if (u.includes('groq')) return new Response(JSON.stringify({ data:[{ id:'llama-3.3-70b-versatile' }, { id:'openai/gpt-oss-120b' }, { id:'meta-llama/llama-4-scout-17b-16e-instruct' }] }));
    if (u.includes('googleapis')) return new Response(JSON.stringify({ data:[{ id:'models/gemini-flash-latest' }, { id:'models/gemini-flash-lite-latest' }] }));
    return new Response('{}', { status:404 });
  }
  if (u.endsWith('/chat/completions')){
    const b = JSON.parse(o.body); calls.push({ host:new URL(u).host, model:b.model, msgs:b.messages, stream:b.stream, temperature:b.temperature });
    return b.stream ? sse(reply) : new Response(JSON.stringify({ choices:[{ message:{ content:reply } }], usage:{ prompt_tokens:10, completion_tokens:10 } }));
  }
  return new Response('{}', { status:404 });
};
const ai = (await import(path.join(ROOT, 'api/ai.js'))).default;
const post = b => ai.fetch(new Request('https://synthz.test/api/ai', { method:'POST', headers:{ 'content-type':'application/json', 'x-real-ip':'10.0.0.' + (1 + Math.floor(Math.random() * 200)), 'x-sz-device':'dev-prueba-' + Math.random().toString(36).slice(2, 10) }, body:JSON.stringify(b) }));
const IMG = 'data:image/jpeg;base64,' + 'A'.repeat(4000);

/* 1) texto normal sigue igual */
calls.length = 0; reply = 'Hola, ¿en qué te ayudo?';
let r = await post({ model:'sz:auto', messages:[{ role:'user', content:'hola' }] });
check('un mensaje de texto responde (200)', r.status === 200, r.status + ' ' + await r.clone().text());
await r.text();

/* 2) una foto: llega como image_url a una IA que ve */
calls.length = 0; reply = 'Veo un gato.';
r = await post({ model:'sz:groq:llama-3.3-70b-versatile', messages:[{ role:'user', content:[{ type:'text', text:'¿Qué hay en la foto?' }, { type:'image_url', image_url:{ url:IMG } }] }] });
const body2 = await r.text();
check('con foto responde (200)', r.status === 200, r.status + ' ' + body2.slice(0, 200));
const c2 = calls[0] || {}, last = c2.msgs ? c2.msgs[c2.msgs.length - 1] : null;
check('la foto llega a la IA (image_url)', last && Array.isArray(last.content) && last.content.some(p => p.type === 'image_url' && p.image_url.url === IMG), JSON.stringify(c2).slice(0, 300));
check('con foto responde una IA que ve (no Llama 3.3)', c2.model && /gemini|llama-4/.test(c2.model), c2.model);
check('el texto de la pregunta también llega', last && Array.isArray(last.content) && last.content[0].text.includes('¿Qué hay en la foto?'));

/* 3) revisión: OK */
calls.length = 0; reply = 'OK';
r = await post({ action:'review', q:'¿Cuánto es 12 × 12?', draft:'12 × 12 = 144. Se multiplica 12 por 10 (120) y se suman 12 × 2 (24).' });
let d = await r.json().catch(() => ({}));
check('revisión: respuesta buena → ok', r.status === 200 && d.verdict === 'ok', r.status + ' ' + JSON.stringify(d));
check('revisión usa la primera IA ligera de la lista (Gemini Flash; gpt-oss-120b ya no: alto consumo) y temperatura baja', calls[0] && calls[0].model === 'gemini-flash-latest' && calls[0].temperature <= .3 && calls[0].stream === false, JSON.stringify(calls[0] || {}).slice(0, 200));
check('revisión manda sus instrucciones como sistema', calls[0] && calls[0].msgs[0].role === 'system' && /revisor de calidad/.test(calls[0].msgs[0].content));

/* 4) revisión: corrige */
calls.length = 0; reply = 'MEJORAR\nNOTA: corregí el resultado de la multiplicación\n12 × 12 = **144**.\n\nSe hace 12 × 10 = 120 y 12 × 2 = 24; 120 + 24 = 144.';
r = await post({ action:'review', q:'¿Cuánto es 12 × 12?', draft:'12 × 12 = 124. Se multiplica 12 por 10 (120) y se suman 4.' });
d = await r.json().catch(() => ({}));
check('revisión: respuesta con error → fix con el texto corregido', d.verdict === 'fix' && /144/.test(d.text) && !/MEJORAR|NOTA/.test(d.text), JSON.stringify(d));
check('revisión: trae la nota de qué corrigió', /corregí/.test(d.note || ''), d.note);

/* 5) una «corrección» cortada no reemplaza un borrador largo */
reply = 'MEJORAR\nNOTA: x\nCorto.';
r = await post({ action:'review', q:'Explícame la fotosíntesis', draft:'La fotosíntesis '.repeat(80) });
d = await r.json().catch(() => ({}));
check('revisión: una corrección cortada se descarta (ok)', d.verdict === 'ok', JSON.stringify(d));

/* 6) revisión con foto: la revisa una IA que ve, y la foto le llega */
calls.length = 0; reply = 'OK';
r = await post({ action:'review', q:'¿Qué animal es?', draft:'Es un gato naranja sentado en una silla.', imgs:[IMG] });
d = await r.json().catch(() => ({}));
check('revisión con foto: la hace una IA que ve y recibe la foto', d.verdict === 'ok' && calls[0] && /gemini|llama-4/.test(calls[0].model) && JSON.stringify(calls[0].msgs).includes(IMG.slice(0, 60)), JSON.stringify(calls[0] || {}).slice(0, 200));

console.log(fails ? '\n' + fails + ' prueba(s) fallaron.' : '\nTodo bien.');
process.exit(fails ? 1 : 0);
