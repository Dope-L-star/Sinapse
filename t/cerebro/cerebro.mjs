/* Pruebas del cerebro de las IAs (v4.0): sin llaves reales ni internet. Redis y los proveedores son de mentira (fetch sustituido).
   Uso: node t/cerebro/cerebro.mjs */
process.env.KV_REST_API_URL = 'http://redis.test'; process.env.KV_REST_API_TOKEN = 'x';
process.env.GROQ_API_KEY = 'gsk_test1'; process.env.GEMINI_API_KEY = 'g_test1'; process.env.MISTRAL_API_KEY = 'm_test1';
const kv = new Map(), hs = new Map();
function cmd(c){
  const [op, k, ...a] = c.map(String), O = op.toUpperCase();
  if (O === 'GET') return kv.has(k) ? kv.get(k) : null;
  if (O === 'SET'){ kv.set(k, a[0]); return 'OK'; }
  if (O === 'DEL'){ kv.delete(k); hs.delete(k); return 1; }
  if (O === 'INCR' || O === 'INCRBY'){ const v = (+kv.get(k) || 0) + (O === 'INCR' ? 1 : +a[0]); kv.set(k, String(v)); return v; }
  if (O === 'HINCRBY'){ const h = hs.get(k) || new Map(); h.set(a[0], (+h.get(a[0]) || 0) + +a[1]); hs.set(k, h); return h.get(a[0]); }
  if (O === 'HGETALL'){ const h = hs.get(k); return h ? [...h].flat().map(String) : []; }
  if (O === 'HSET'){ const h = hs.get(k) || new Map(); h.set(a[0], a[1]); hs.set(k, h); return 1; }
  return 0;   /* EXPIRE, LPUSH, LTRIM, SADD… */
}
const calls = [];
let script = [];   /* por llamada al proveedor: 'empty' | 'error' | 'ok:<texto>' | 'bad400' */
const sse = chunks => new Response(new ReadableStream({ start(c){ const e = new TextEncoder(); for (const x of chunks) c.enqueue(e.encode(x)); c.close(); } }), { status:200, headers:{ 'content-type':'text/event-stream' } });
globalThis.fetch = async (url, o = {}) => {
  url = String(url);
  if (url.startsWith('http://redis.test')){ const b = JSON.parse(o.body); return new Response(JSON.stringify(url.endsWith('/pipeline') ? b.map(c => ({ result:cmd(c) })) : { result:cmd(b) })); }
  if (/\/models(\?|$)/.test(url)){
    if (url.includes('groq')) return new Response(JSON.stringify({ data:[{ id:'llama-3.3-70b-versatile' }, { id:'openai/gpt-oss-120b' }, { id:'openai/gpt-oss-20b' }] }));
    if (url.includes('generativelanguage')) return new Response(JSON.stringify({ data:[{ id:'models/gemini-flash-latest' }] }));
    if (url.includes('mistral')) return new Response(JSON.stringify({ data:[{ id:'mistral-small-latest' }] }));
    return new Response(JSON.stringify({ data:[] }));
  }
  if (url.endsWith('/chat/completions')){
    const b = JSON.parse(o.body); calls.push(b); const s = script.shift() || 'ok:hola';
    if (s === 'bad400') return new Response('{"error":{"message":"reasoning_effort is not supported for this model"}}', { status:400 });
    if (s === 'empty') return sse(['data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n', 'data: [DONE]\n\n']);
    if (s === 'error') return sse(['data: {"error":{"message":"overloaded","code":503}}\n\n']);
    return sse(['data: {"choices":[{"delta":{"content":' + JSON.stringify(s.slice(3)) + '}}]}\n\n', 'data: [DONE]\n\n']);
  }
  return new Response('no', { status:404 });
};
const { leer, sistema, difficulty, reasonParams, langOf } = await import('../../api/_cerebro.js');
const { chat, peek, models } = await import('../../api/_pool.js');
const { pickHard } = await import('../../api/_ruta.js');
let ok = 0, bad = 0;
const t = (name, v) => { if (v){ ok++; console.log('OK   ', name); } else { bad++; console.log('FALLO', name); } };
const U = c => [{ role:'user', content:c }];

t('saludo = fácil', leer(U('hola!')).level === 'easy');
t('cálculo = difícil', leer(U('Si un tren sale a 80 km/h y otro a 120 km/h desde ciudades a 400 km, ¿cuántas horas tardan en cruzarse? explícalo paso a paso')).level === 'hard');
t('código con error = difícil y código', (x => x.level === 'hard' && x.cat === 'code')(leer(U('¿Por qué falla esta función de javascript?\n```js\nfunction f(a){ return a.map(x => x*2) }\nf(null)\n```'))));
t('traducción = translate', leer(U('Traduce al inglés: me encanta programar')).cat === 'translate');
t('inglés detectado', langOf('Can you write me an email for my boss about the project?') === 'en');
t('esfuerzo bajo fuerza fácil', difficulty('demuestra que la raíz de 2 es irracional', 'reason', 'low') === 'easy');
t('esfuerzo alto fuerza difícil', difficulty('explícame las mareas', 'reason', 'high') === 'hard');
t('continuar no se reclasifica', leer(U('Continúa exactamente donde te quedaste: sigue')).cont === true);
const Lh = leer(U('Resuelve: 3x + 7 = 25, ¿cuánto vale x? paso a paso'));
t('sistema trae la fecha de hoy', /Hoy es .*20\d\d/.test(sistema(Lh, 'groq', 'llama-3.3-70b-versatile')));
t('modelo sin razonamiento piensa con <think>', /<think>/.test(sistema(Lh, 'groq', 'llama-3.3-70b-versatile')));
t('modelo que razona solo no usa <think>', !/<think>/.test(sistema(Lh, 'groq', 'openai/gpt-oss-120b')));
t('gpt-oss difícil = reasoning_effort high', reasonParams('groq', 'openai/gpt-oss-120b', 'hard').reasoning_effort === 'high');
t('llama no recibe parámetros raros', Object.keys(reasonParams('groq', 'llama-3.3-70b-versatile', 'hard')).length === 0);
t('modo corto no pide <think>', !/<think>/.test(sistema(Lh, 'groq', 'llama-3.3-70b-versatile', { short:true })));

{ const p = await peek(sse(['data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n', 'data: [DONE]\n\n']).body); t('peek: vacía = no vive', !p.alive); }
{ const p = await peek(sse(['data: {"choices":[{"delta":{"content":"Hola"}}]}\n\n', 'data: {"choices":[{"delta":{"content":" mundo"}}]}\n\n']).body);
  const txt = p.alive ? await new Response(p.stream).text() : ''; t('peek: con texto vive y no pierde nada', p.alive && txt.includes('Hola') && txt.includes('mundo')); }

const cat = await models(true);
t('gpt-oss-120b queda en el cerebro grande, no en la lista', cat.smart.some(m => /gpt-oss-120b/.test(m.mid)) && !cat.list.some(m => /gpt-oss-120b/.test(m.mid)));
const hard = await pickHard('data');
t('difícil de datos elige primero un modelo grande', /gpt-oss-120b/.test(hard[0].m.mid));

const read = async r => { const s = await new Response(r.stream).text(); return s; };
const L2 = leer(U('Resuelve 12*13 paso a paso'));
const brain = m => ({ system:sistema(L2, m.prov, m.mid), extra:reasonParams(m.prov, m.mid, L2.level) });
script = ['empty', 'ok:156'];
{ const r = await chat({ who:'u:t', ipKey:'ip:t', messages:U('Resuelve 12*13 paso a paso'), model:'sz:auto', route:hard.map(x => x.m), brain });
  const s = await read(r); t('respuesta vacía → responde otra IA', s.includes('156') && r.meta.model !== hard[0].m.id); }
script = ['error', 'ok:listo'];
{ const r = await chat({ who:'u:t', ipKey:'ip:t', messages:U('hola'), model:'sz:auto', brain }); t('error antes de escribir → responde otra IA', (await read(r)).includes('listo')); }
calls.length = 0; script = ['bad400', 'ok:bien'];
{ const r = await chat({ who:'u:t', ipKey:'ip:t', messages:U('Resuelve 12*13 paso a paso'), model:'sz:google:gemini-flash-latest', route:null, brain });
  const s = await read(r); t('parámetro no aceptado → se repite sin él y el modelo no se esconde', s.includes('bien') && calls.length === 2 && calls[0].reasoning_effort === 'high' && !calls[1].reasoning_effort && !(hs.get('pool:badm') || new Map()).size); }
calls.length = 0; script = ['ok:x'];
{ const r = await chat({ who:'u:t', ipKey:'ip:t', messages:[{ role:'system', content:'CLIENTE' }, ...U('hola')], model:'sz:auto', brain }); await read(r);
  const sys = calls[0].messages[0]; t('instrucciones del cerebro van primero y se conservan las de la página', sys.role === 'system' && /^Hoy es/.test(sys.content) && sys.content.includes('CLIENTE')); }
calls.length = 0; script = ['ok:x'];
{ const long = Array.from({ length:30 }, (_, i) => ({ role:i % 2 ? 'assistant' : 'user', content:(i === 0 ? 'TEMA-INICIAL ' : '') + 'x'.repeat(3000) }));
  const r = await chat({ who:'u:t', ipKey:'ip:t', messages:long.slice(0, 23).concat(U('y entonces?')).slice(-24), model:'sz:auto', brain }); await read(r);
  t('charla larga: se recorta pero sigue lo último', calls[0].messages.at(-1).content === 'y entonces?'); }
console.log('\n' + ok + ' OK, ' + bad + ' FALLO'); process.exit(bad ? 1 : 0);
