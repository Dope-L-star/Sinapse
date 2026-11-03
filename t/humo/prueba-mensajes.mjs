/* Prueba de v3.6: los mensajes de prueba se cuentan bien, contra api/trial.js y api/ai.js reales con un Redis y unos proveedores de mentira.
   Revisa: un mensaje escrito gasta 1; «Continúa» y el arreglo automático del código (mismo turn) no gastan otro; el servidor
   dice cuánto queda y si se gastó; un mensaje no puede hacer llamadas sin fin. Igual sin cuenta (/api/ai). No sale a internet.
   Se corre desde la raíz del repo:  node t/humo/prueba-mensajes.mjs */
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
  if (op === 'SREM'){ const s = sets.get(k); if (s) c.slice(2).forEach(x => s.delete(String(x))); return 1; }
  if (op === 'EXISTS') return kv.has(k) || sets.has(k) ? 1 : 0;
  if (op === 'EXPIRE') return 1;
  if (op === 'DECR'){ const n = (+kv.get(k) || 0) - 1; kv.set(k, String(n)); return n; }
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

const trial = (await import(path.join(ROOT, 'api/trial.js'))).default;
const ai = (await import(path.join(ROOT, 'api/ai.js'))).default;
const IP = '10.9.8.' + (1 + Math.floor(Math.random() * 200));
const tpost = b => trial.fetch(new Request('https://synthz.test/api/trial', { method:'POST', headers:{ 'content-type':'application/json', 'x-real-ip':IP }, body:JSON.stringify(b) }));
const apost = b => ai.fetch(new Request('https://synthz.test/api/ai', { method:'POST', headers:{ 'content-type':'application/json', 'x-real-ip':IP, 'x-sz-device':'dispositivo-de-prueba-1234' }, body:JSON.stringify(b) }));
const M = t => [{ role:'user', content:t }];

/* prueba guiada */
let r = await tpost({ action:'start' }); const st = await r.json();
check('la prueba guiada empieza (5 mensajes)', r.status === 200 && st.token && st.left === 5, r.status + ' ' + JSON.stringify(st));
const chat = async (msgs, turn) => { const x = await tpost({ action:'chat', token:st.token, messages:msgs, turn }); const out = { s:x.status, left:x.headers.get('x-trial-left'), spent:x.headers.get('x-trial-spent') }; await x.text(); return out; };
let a = await chat(M('hazme una página de una pizzería'), 'tA-1');
check('escribir un mensaje gasta 1 (quedan 4)', a.s === 200 && a.left === '4' && a.spent === '1', JSON.stringify(a));
a = await chat([...M('hazme una página de una pizzería'), { role:'assistant', content:'<html>…' }, { role:'user', content:'Continúa exactamente donde te quedaste' }], 'tA-1');
check('«Continúa» del mismo mensaje no gasta otro (siguen 4)', a.s === 200 && a.left === '4' && a.spent === '0', JSON.stringify(a));
a = await chat(M('[Revisión automática de SynthFlow] arregla esto'), 'tA-1');
check('el arreglo automático del código no gasta otro (siguen 4)', a.s === 200 && a.left === '4' && a.spent === '0', JSON.stringify(a));
a = await chat(M('otra cosa'), 'tB-1');
check('un mensaje nuevo sí gasta (quedan 3)', a.s === 200 && a.left === '3' && a.spent === '1', JSON.stringify(a));
for (let i = 0; i < 6; i++) a = await chat(M('sigue'), 'tB-1');
check('un mismo mensaje no puede hacer llamadas sin fin (429 después de 6)', a.s === 429, JSON.stringify(a));
a = await chat(M('tres'), 'tC-1'); await chat(M('cuatro'), 'tD-1'); a = await chat(M('cinco'), 'tE-1');
check('el quinto mensaje deja 0', a.s === 200 && a.left === '0', JSON.stringify(a));
a = await chat(M('seis'), 'tF-1');
check('el sexto ya no entra (429)', a.s === 429, JSON.stringify(a));

/* sin cuenta (/api/ai) */
const g = async (msgs, turn) => { const x = await apost({ model:'sz:auto', messages:msgs, turn }); const out = { s:x.status, guest:x.headers.get('x-sz-guest') }; await x.text(); return out; };
let b = await g(M('hola'), 'gA-1');
check('sin cuenta: un mensaje cuenta 1', b.s === 200 && b.guest === '1/5/4', JSON.stringify(b));
b = await g(M('Continúa exactamente donde te quedaste'), 'gA-1'); b = await g(M('[Revisión automática de SynthFlow] arregla'), 'gA-1');
check('sin cuenta: «Continúa» y el arreglo del mismo mensaje no cuentan otro', b.s === 200 && b.guest === '1/5/4', JSON.stringify(b));
b = await g(M('otra'), 'gB-1');
check('sin cuenta: un mensaje nuevo cuenta (2/5)', b.s === 200 && b.guest === '2/5/3', JSON.stringify(b));

/* v4.2 · lo que ve la página es lo mismo que deja el servidor (Sammuel: «está en 0 y dice 2 de prueba») */
const aget = (dev = 'dispositivo-de-prueba-1234', ip = IP) => ai.fetch(new Request('https://synthz.test/api/ai', { headers:{ 'x-real-ip':ip, 'x-sz-device':dev } })).then(x => x.json());
let d = await aget();
check('sin cuenta: la página recibe los mismos 3 que quedan', d.guest && d.guest.left === 3 && d.guest.used === 2 && d.guest.max === 5, JSON.stringify(d.guest));
const qk = [...kv.keys()].find(k => /^q:d:/.test(k));
kv.set(qk, '9999999');
d = await aget();
check('sin cuenta: si la EnerX del día se acabó, quedan 0 (no «2 de prueba»)', d.guest && d.guest.left === 0 && d.guest.used === 5, JSON.stringify(d.guest));
b = await g(M('otra más'), 'gC-1');
check('   y de verdad no deja escribir', b.s === 429, JSON.stringify(b));
kv.delete(qk);
d = await aget('otro-dispositivo-de-prueba-99');
check('sin cuenta: otro dispositivo en la misma conexión ve lo que deja la conexión', d.guest && d.guest.left === 5, JSON.stringify(d.guest));

console.log(fails ? '\n' + fails + ' prueba(s) fallaron.' : '\nTodo bien.');
process.exit(fails ? 1 : 0);
