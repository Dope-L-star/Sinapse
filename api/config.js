/* GET /api/config — dice a la página si las cuentas están listas, si «Entrar con Google» está activado
   y qué «ID de cliente» de Google usar para guardar chats en Drive (es público: no es un secreto). */
import { missing, secretFromEnv, json, fail, body, route, getJ, googleCid, sbOn, sbGoogleOn, SB_HOST, SB_PUB, pipe, sha, ipOf, limit, enc, cleanEmail, okEmail } from './_lib.js';
export const CID_RX = /^[0-9]{6,20}-[a-z0-9]{10,64}\.apps\.googleusercontent\.com$/;
async function driveCid(){
  const env = (process.env.GOOGLE_DRIVE_CLIENT_ID || '').trim();
  if (env) return env;
  try{ const c = await getJ('cfg:drive'); if (c && CID_RX.test(c.clientId || '')) return c.clientId; }catch(e){}
  return googleCid().catch(() => '');
}
async function maint(){ try{ const c = await getJ('cfg:maint'); return c && c.on ? { on:true, text:String(c.text || '').slice(0, 300), t:c.t || 0 } : { on:false }; }catch(e){ return { on:false }; } }
/* Puertas falsas de la portada (v3.8: pestañas con candado de la demo y «El laboratorio») y de los planes: correo para avisar.
   No cobra nada (pagos apagados). GET ?puertas=1 → { puertas:{ id:n }, clics:{ id:n } } · POST { action:'puerta', id, email? } → { ok, n, clics }
   v4.2 (Sammuel, 3 nov: «si no dejan el correo no debería decir que se interesó; cualquiera da clic»):
   n = personas que DEJARON SU CORREO (uno por correo, fd:e:<id>). Es lo único que se muestra como interés.
   Los clics sin correo se guardan aparte (fd:n:<id>, uno por IP como hash) y no se muestran como «personas que lo quieren».
   El correo va cifrado; solo el equipo lo puede leer. */
export const PUERTAS = ['voz', 'grupo', 'agenda', 'extension', 'escritorio', 'plan-syntonia', 'plan-timeless', 'plan-orquesta'];
async function puertasGet(){
  if (missing().length) return json({ puertas:{}, clics:{} });
  const r = await pipe(PUERTAS.flatMap(id => [['HLEN', 'fd:e:' + id], ['GET', 'fd:n:' + id]])).catch(() => []);
  return json({ puertas:Object.fromEntries(PUERTAS.map((id, i) => [id, +(r[i * 2] || 0)])), clics:Object.fromEntries(PUERTAS.map((id, i) => [id, +(r[i * 2 + 1] || 0)])) });
}
const puertaPost = route({ async POST(req){
  const b = await body(req, 4000).catch(() => ({}));
  if (b.action !== 'puerta' || !PUERTAS.includes(b.id)) return fail(400, 'Puerta desconocida.');
  const ip = ipOf(req);
  await limit('fd:' + sha(ip), 20, 3600);
  const email = b.email == null || b.email === '' ? '' : cleanEmail(b.email);
  if (b.email && !(email && okEmail(email) && email.length <= 254)) return fail(400, 'Ese correo no parece válido.');
  const [nuevo] = await pipe([['SADD', 'fd:ip:' + b.id, sha('fd:' + ip)]]);
  const cmds = [];
  if (+nuevo === 1) cmds.push(['INCR', 'fd:n:' + b.id]);
  if (email) cmds.push(['HSET', 'fd:e:' + b.id, sha('fd:' + email), enc(JSON.stringify({ email, lang:b.lang === 'en' ? 'en' : 'es', t:Date.now() }))]);
  if (cmds.length) await pipe(cmds);
  const [n, c] = await pipe([['HLEN', 'fd:e:' + b.id], ['GET', 'fd:n:' + b.id]]);
  return json({ ok:true, n:+n || 0, clics:+c || 0, saved:!!email });
} });
/* Fase 4 · costo cero: la respuesta normal es igual para todos, así que cada servidor la guarda 15 s (antes: 3-4 lecturas de Redis por visita).
   El aviso de mantenimiento tarda como mucho 15 s más en aparecer o quitarse. Los votos de las puertas falsas no se guardan en caché. */
let CACHE = { t:0, body:'' };
const responder = body => new Response(body, { headers:{ 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff' } });
export default { async fetch(req){
  if (req && req.method === 'POST') return puertaPost.fetch(req);
  if (req && req.url && new URL(req.url).searchParams.has('puertas')) return puertasGet().catch(() => json({ puertas:{} }));
  if (CACHE.body && Date.now() - CACHE.t < 15e3) return responder(CACHE.body);
  const r = await calcular(); if (r.status === 200){ const body = await r.clone().text(); CACHE = { t:Date.now(), body }; }
  return r;
} };
async function calcular(){ const m = missing(); const g = m.length ? '' : await googleCid().catch(() => ''); const sbg = await sbGoogleOn().catch(() => false); return json({ ok:m.length === 0, google:!!g || sbg, googleClientId:g, sbGoogle:sbg, sb:{ on:sbOn(), url:SB_HOST, pub:SB_PUB }, ai:true, driveClientId:m.length ? '' : await driveCid(), secretFromEnv:secretFromEnv(), missing:m, maint:await maint() }); }
