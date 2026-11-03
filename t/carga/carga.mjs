/* Fase 4 · prueba de carga sencilla del servidor (api/), sin salir a internet y sin gastar nada.
   - Levanta un redis-server local (hace falta tener redis-server instalado) detrás de un Upstash «de mentira».
   - Corre los archivos reales de api/ en este mismo proceso, como lo hace Cloudflare/Vercel.
   - Las IAs de afuera no se llaman: responden «no disponible» al instante (aquí se mide NUESTRO servidor, no el de ellas).
   Mide: cuántos comandos de Redis gasta cada llamada, y cuánto tarda cada llamada con 1, 50, 200 y 500 visitas a la vez.
   Uso (desde la raíz):  node t/carga/carga.mjs            → tabla en la consola
                         node t/carga/carga.mjs --json     → lo mismo en JSON */
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { clienteRedis } from './upstash-local.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUERTO = 6390 + Math.floor(Math.random() * 500);
const rs = spawn('redis-server', ['--port', String(PUERTO), '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
await new Promise(ok => setTimeout(ok, 400));
const redis = clienteRedis(PUERTO);

let comandos = 0;
process.env.KV_REST_API_URL = 'http://redis.test'; process.env.KV_REST_API_TOKEN = 't';
process.env.SYNTHZ_SECRET = 'prueba-de-carga-'.repeat(3);
for (const k of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY', 'GOOGLE_CLIENT_ID']) delete process.env[k];
const fetchReal = globalThis.fetch;
globalThis.fetch = async (url, o = {}) => {
  const u = String(url);
  if (!u.startsWith('http://redis.test')) return new Response('{"error":"sin internet en la prueba"}', { status: 503, headers: { 'content-type': 'application/json' } });
  const b = JSON.parse(o.body || '[]');
  const uno = async c => { comandos++; const v = await redis(c); return v && v.error ? { error: v.error } : { result: v }; };
  const out = u.endsWith('/pipeline') ? await Promise.all(b.map(uno)) : await uno(b);
  return new Response(JSON.stringify(out), { headers: { 'content-type': 'application/json' } });
};

const H = {};
for (const n of ['config', 'health', 'ai', 'me']) H[n] = (await import(path.join(ROOT, 'api', n + '.js'))).default;

/* lo que hace UNA visita sin cuenta: al abrir la página y luego cada 10 min (latido). Ver t/carga/LEEME.md */
const disp = i => 'prueba-carga-' + String(i).padStart(6, '0');
const pedir = (n, metodo, ruta, cuerpo, i) => H[n].fetch(new Request('https://symphoria.test/api/' + ruta, {
  method: metodo, body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  headers: { 'content-type': 'application/json', 'x-sz-device': disp(i), 'x-real-ip': '10.' + (i >> 16 & 255) + '.' + (i >> 8 & 255) + '.' + (i & 255) }
}));
const LLAMADAS = {
  'GET /api/config': i => pedir('config', 'GET', 'config', null, i),
  'GET /api/health': i => pedir('health', 'GET', 'health', null, i),
  'GET /api/ai (lista de IAs)': i => pedir('ai', 'GET', 'ai', null, i),
  'POST /api/health (latido)': i => pedir('health', 'POST', 'health', { action: 'beat', page: 'chat', state: { since: Date.now(), msgs: 0 } }, i),
};

const res = { porLlamada: {}, concurrencia: [] };
/* 1) comandos de Redis por llamada (la primera de cada proceso carga la clave de cifrado: se descarta) */
for (const [nombre, f] of Object.entries(LLAMADAS)) {
  await f(999999);
  const c0 = comandos, N = 20;
  for (let i = 0; i < N; i++) { const r = await f(i); if (r.status >= 500) throw new Error(nombre + ' respondió ' + r.status + ': ' + await r.text()); }
  res.porLlamada[nombre] = +((comandos - c0) / N).toFixed(2);
}
/* 2) muchas visitas a la vez: cada visita hace las llamadas de entrada */
const pct = (a, p) => a[Math.min(a.length - 1, Math.floor(a.length * p))];
for (const n of [1, 50, 200, 500]) {
  const t = [], c0 = comandos, t0 = performance.now(); let errores = 0;
  await Promise.all([...Array(n)].map(async (_, k) => {
    for (const f of Object.values(LLAMADAS)) {
      const a = performance.now(); const r = await f(10000 + n * 1000 + k); if (r.status >= 500) errores++; await r.text(); t.push(performance.now() - a);
    }
  }));
  const total = performance.now() - t0; t.sort((a, b) => a - b);
  res.concurrencia.push({ visitas: n, llamadas: t.length, segundos: +(total / 1000).toFixed(2), porSegundo: Math.round(t.length / (total / 1000)), p50ms: Math.round(pct(t, .5)), p95ms: Math.round(pct(t, .95)), errores, redisPorVisita: +((comandos - c0) / n).toFixed(1) });
}
rs.kill();
globalThis.fetch = fetchReal;
if (process.argv.includes('--json')) console.log(JSON.stringify(res, null, 2));
else {
  console.log('Comandos de Redis por llamada:'); for (const [k, v] of Object.entries(res.porLlamada)) console.log('  ' + k.padEnd(30) + v);
  console.log('\nVisitas a la vez (cada una: config + health + lista de IAs + latido):');
  for (const r of res.concurrencia) console.log('  ' + String(r.visitas).padStart(4) + ' visitas · ' + r.porSegundo + ' llamadas/s · p50 ' + r.p50ms + ' ms · p95 ' + r.p95ms + ' ms · errores ' + r.errores + ' · Redis por visita ' + r.redisPorVisita);
}
process.exit(0);
