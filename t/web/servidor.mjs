/* Servidor local para probar SynthFlow (export de Next en cloudflare/public) sin salir a internet.
   · Sirve los archivos con las mismas CSP de vercel.json (la de la página y la de /sintetico.html).
   · /api/* lo atienden los archivos reales de api/ con un Redis de mentira; el proveedor de IA es de mentira
     y responde lo que diga RESPUESTA (por defecto, t/web/respuesta-sitio.md: una página web de varios archivos).
   Uso: import { start } from './servidor.mjs'; const s = await start(); … s.close() */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2', '.txt':'text/plain', '.xml':'application/xml', '.webmanifest':'application/manifest+json', '.mp4':'video/mp4' };

export async function start({ root = path.join(REPO, 'cloudflare/public'), reply } = {}){
  const VJ = JSON.parse(fs.readFileSync(path.join(REPO, 'vercel.json'), 'utf8'));
  const cspOf = src => ((VJ.headers.find(h => h.source === src) || { headers:[] }).headers.find(h => h.key === 'Content-Security-Policy') || {}).value || '';
  const CSP_PAGE = cspOf('/((?!sintetico\\.html$).*)').replace(/;\s*upgrade-insecure-requests/, ''), CSP_SYN = cspOf('/sintetico.html');
  let RESP = reply || fs.readFileSync(path.join(REPO, 't/web/respuesta-sitio.md'), 'utf8');

  /* Redis y proveedores de mentira (lo mismo que t/humo/prueba-mensajes.mjs) */
  process.env.KV_REST_API_URL = 'http://redis.test'; process.env.KV_REST_API_TOKEN = 't';
  process.env.GROQ_API_KEY = 'gsk_prueba';
  const kv = new Map(), sets = new Map(), hs = new Map();
  const run = c => {
    const op = String(c[0]).toUpperCase(), k = String(c[1] ?? '');
    if (op === 'GET') return kv.has(k) ? kv.get(k) : null;
    if (op === 'SET'){ kv.set(k, String(c[2])); return 'OK'; }
    if (op === 'DEL'){ c.slice(1).forEach(x => { kv.delete(String(x)); sets.delete(String(x)); }); return 1; }
    if (/^(INCR|INCRBY|HINCRBY|INCRBYFLOAT)$/.test(op)){ const n = (+kv.get(k) || 0) + (op === 'INCR' ? 1 : +c[c.length - 1]); kv.set(k, String(n)); return n; }
    if (op === 'DECR'){ const n = (+kv.get(k) || 0) - 1; kv.set(k, String(n)); return n; }
    if (op === 'SADD'){ const s = sets.get(k) || new Set(); c.slice(2).forEach(x => s.add(String(x))); sets.set(k, s); return 1; }
    if (op === 'SREM'){ const s = sets.get(k); if (s) c.slice(2).forEach(x => s.delete(String(x))); return 1; }
    if (op === 'EXISTS') return kv.has(k) || sets.has(k) ? 1 : 0;
    if (op === 'EXPIRE' || op === 'PEXPIRE') return 1;
    if (op === 'TTL') return 60;
    if (op === 'SCARD') return (sets.get(k) || new Set()).size;
    if (op === 'SISMEMBER') return (sets.get(k) || new Set()).has(String(c[2])) ? 1 : 0;
    if (op === 'SMEMBERS') return [...(sets.get(k) || [])];
    if (op === 'HSET'){ const h = hs.get(k) || new Map(); for (let i = 2; i + 1 < c.length; i += 2) h.set(String(c[i]), String(c[i + 1])); hs.set(k, h); return 1; }
    if (op === 'HLEN') return (hs.get(k) || new Map()).size;
    if (op === 'HGETALL') return [...(hs.get(k) || new Map())].flat();
    if (op === 'LRANGE' || op === 'ZRANGE') return [];
    return null;
  };
  const realFetch = globalThis.fetch;
  /* la respuesta llega por partes, como una IA de verdad */
  const sse = t => {
    const parts = t.match(/[\s\S]{1,180}/g) || [''];
    const enc = new TextEncoder();
    return new Response(new ReadableStream({ async start(ctl){ for (const p of parts){ ctl.enqueue(enc.encode('data: ' + JSON.stringify({ choices:[{ delta:{ content:p } }] }) + '\n\n')); await new Promise(r => setTimeout(r, 15)); } ctl.enqueue(enc.encode('data: [DONE]\n\n')); ctl.close(); } }), { headers:{ 'content-type':'text/event-stream' } });
  };
  globalThis.fetch = async (url, o = {}) => {
    const u = String(url && url.url || url);
    if (u.startsWith('http://redis.test')){ const b = JSON.parse(o.body || '[]'); const out = u.endsWith('/pipeline') ? b.map(c => ({ result:run(c) })) : { result:run(b) }; return new Response(JSON.stringify(out)); }
    if (u.endsWith('/models')) return new Response(JSON.stringify({ data:[{ id:'llama-3.3-70b-versatile' }, { id:'openai/gpt-oss-120b' }] }));
    if (u.endsWith('/chat/completions')){ const b = JSON.parse(o.body); return b.stream ? sse(RESP) : new Response(JSON.stringify({ choices:[{ message:{ content:RESP } }], usage:{ prompt_tokens:10, completion_tokens:10 } })); }
    if (u.startsWith('http://127.0.0.1') || u.startsWith('http://localhost')) return realFetch(url, o);
    return new Response('{}', { status:404 });
  };

  const apis = {};
  const api = async name => apis[name] || (apis[name] = (await import(path.join(REPO, 'api', name + '.js'))).default);
  const server = http.createServer(async (req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    if (u.startsWith('/api/')){
      const name = u.slice(5).split('/')[0].replace(/\W/g, '');
      try{
        const h = await api(name);
        const chunks = []; for await (const c of req) chunks.push(c);
        const r = await h.fetch(new Request('http://synthz.test' + req.url, { method:req.method, headers:Object.assign({}, req.headers, { 'x-real-ip':req.headers['x-test-ip'] || '10.1.2.3' }), body:/GET|HEAD/.test(req.method) ? undefined : Buffer.concat(chunks) }));
        res.writeHead(r.status, Object.fromEntries(r.headers));
        if (r.body){ const rd = r.body.getReader(); for (;;){ const { done, value } = await rd.read(); if (done) break; res.write(value); } }
        res.end();
      }catch(e){ res.writeHead(200, { 'content-type':'application/json' }); res.end('{}'); }
      return;
    }
    let f = path.join(root, u === '/' ? 'index.html' : u);
    if (!path.extname(f) && fs.existsSync(f + '.html')) f += '.html';
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404, { 'content-type':'text/html' }); res.end('<h1>404</h1>'); return; }
    res.writeHead(200, { 'content-type':TYPES[path.extname(f)] || 'application/octet-stream', 'content-security-policy':u.startsWith('/sintetico') ? CSP_SYN : CSP_PAGE });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  return { base, kv, setReply:t => { RESP = t; }, close:() => { globalThis.fetch = realFetch; server.close(); } };
}
