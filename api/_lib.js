/* SymphorIA · utilidades del servidor: Redis (Upstash), sesiones, contraseñas, Google (opcional) y cifrado.
   Los archivos que empiezan con "_" no se publican como rutas en Vercel. */
import crypto from 'node:crypto';

const R_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const R_TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
export const CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const SECRET = (process.env.SYNTHZ_SECRET || '').length >= 32 ? process.env.SYNTHZ_SECRET : '';
/* rotación: las claves anteriores (separadas por coma) solo sirven para LEER lo ya cifrado; todo lo nuevo usa SYNTHZ_SECRET */
const SECRET_OLD = String(process.env.SYNTHZ_SECRET_OLD || '').split(',').map(s => s.trim()).filter(s => s.length >= 32);
/* cuentas del equipo de SymphorIA: usuario → rango. Solo se pueden crear o reclamar con SYNTHZ_SETUP_CODE */
export const SEED_ROLES = Object.fromEntries(String(process.env.SYNTHZ_RESERVED || 'sammuersynth:owner,sammueladmin:admin,sammuerbusiness:staff').split(',').map(x => x.trim().toLowerCase().split(':')).filter(([u, r]) => u && ['owner', 'admin', 'staff'].includes(r)));
const SETUP_CODE = String(process.env.SYNTHZ_SETUP_CODE || '');
/* el código solo vive en Vercel (el repo es público): sin la variable, nadie puede reclamar las cuentas del equipo */
export const setupOk = code => typeof code === 'string' && code.length >= 12 && SETUP_CODE.trim().length >= 12 && sameHash(sha('setup:' + code.trim().toUpperCase()), sha('setup:' + SETUP_CODE.trim().toUpperCase()));
/* espacio en la nube por usuario (MB). 2 MB × 100 usuarios ≈ 200 MB, dentro de los 256 MB del plan gratis de Upstash */
export const QUOTA = Math.round(Math.min(64, Math.max(0.5, +process.env.SYNTHZ_USER_MB || 2)) * 1024 * 1024);
const CERTS = process.env.GOOGLE_CERTS_URL || 'https://www.googleapis.com/oauth2/v3/certs';

/* lo único obligatorio es la base de datos; Google y SYNTHZ_SECRET son opcionales */
export const missing = () => [!R_URL && 'KV_REST_API_URL', !R_TOK && 'KV_REST_API_TOKEN'].filter(Boolean);
export const ready = () => missing().length === 0;
/* el «ID de cliente» de Google puede venir de Vercel o pegarse en el panel del equipo (es público, no es un secreto) */
let gcid = { v:'', t:0 };
export async function googleCid(){
  if (CLIENT_ID) return CLIENT_ID;
  if (Date.now() - gcid.t < 60e3) return gcid.v;
  let v = ''; try{ const c = await getJ('cfg:google'); v = c && typeof c.clientId === 'string' ? c.clientId : ''; }catch(e){}
  gcid = { v, t:Date.now() }; return v;
}
export const hasGoogle = async () => !!(await googleCid());
export const secretFromEnv = () => !!SECRET;

/* ---------- respuestas ---------- */
const BASE_H = { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff' };
export const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers:BASE_H });
export const fail = (status, error, extra) => json(Object.assign({ error }, extra || {}), status);
export async function body(req, max = 1_500_000){
  const t = await req.text();
  if (t.length > max) throw Object.assign(new Error('Lo que enviaste es demasiado grande.'), { status:413 });
  if (!t) return {};
  try{ return JSON.parse(t); }catch(e){ throw Object.assign(new Error('JSON inválido.'), { status:400 }); }
}
/* envuelve cada ruta: configuración, errores y métodos */
export function route(handlers){
  return { async fetch(req){
    try{
      if (!ready()) return fail(503, 'Las cuentas de SymphorIA aún no están configuradas en el servidor.', { missing:missing() });
      const h = handlers[req.method]; if (!h) return fail(405, 'Método no permitido.');
      await loadKey();
      const res = await h(req);
      await flushUse();
      return res;
    }catch(e){
      const s = e && e.status ? e.status : 500;
      const known = !!(e && e.code);                       /* errores pensados (con código) se muestran tal cual, aunque sean 5xx */
      if (s >= 500 && !known) console.error('[synthz]', new URL(req.url).pathname, e && e.message);   /* sin cuerpos ni secretos en los registros */
      return fail(s, s >= 500 && !known ? 'Algo falló en el servidor. Intenta de nuevo.' : e.message, known ? { code:e.code } : undefined);
    }
  } };
}

/* ---------- Redis por REST (Upstash) ---------- */
let CMDN = 0;                                                /* comandos de Redis usados en esta llamada (para el medidor de lo gratis) */
const monthKey = () => new Date().toISOString().slice(0, 7);
/* Fase 4 · el medidor se anota de a varias llamadas juntas (cada 25 llamadas o cada minuto) en vez de en cada una:
   antes cada llamada gastaba 2 comandos más y una ida y vuelta extra a Redis solo para contarse.
   Si el servidor se apaga con llamadas sin anotar, el medidor queda un poquito corto (es un estimado). */
let USE_C = 0, USE_N = 0, USE_T = 0;
async function flushUse(){
  USE_C += CMDN; CMDN = 0; USE_N++;
  if (USE_N < 25 && Date.now() - USE_T < 60e3) return;
  const n = USE_C, r = USE_N; USE_C = 0; USE_N = 0; USE_T = Date.now();
  try{ const m = monthKey(); await fetch(R_URL.replace(/\/$/, '') + '/pipeline', { method:'POST', headers:{ Authorization:'Bearer ' + R_TOK, 'content-type':'application/json' }, body:JSON.stringify([['INCRBY', 'use:c:' + m, n + 2], ['INCRBY', 'use:r:' + m, r]]) }); }catch(e){}
}
export async function redis(...cmd){
  CMDN++;
  const r = await fetch(R_URL, { method:'POST', headers:{ Authorization:'Bearer ' + R_TOK, 'content-type':'application/json' }, body:JSON.stringify(cmd) });
  const d = await r.json().catch(() => ({}));
  if (d.error) throw new Error('Redis: ' + d.error);
  return d.result;
}
export async function pipe(cmds){
  if (!cmds.length) return [];
  CMDN += cmds.length;
  const r = await fetch(R_URL.replace(/\/$/, '') + '/pipeline', { method:'POST', headers:{ Authorization:'Bearer ' + R_TOK, 'content-type':'application/json' }, body:JSON.stringify(cmds) });
  const d = await r.json().catch(() => []);
  if (!Array.isArray(d)) throw new Error('Redis: respuesta inesperada');
  const bad = d.find(x => x && x.error); if (bad) throw new Error('Redis: ' + bad.error);
  return d.map(x => x.result);
}
export const getJ = async k => { const v = await redis('GET', k); try{ return v ? JSON.parse(v) : null; }catch(e){ return null; } };
export const setJ = (k, v, ex) => ex ? redis('SET', k, JSON.stringify(v), 'EX', ex) : redis('SET', k, JSON.stringify(v));

/* ---------- utilidades ---------- */
export const sha = s => crypto.createHash('sha256').update(String(s)).digest('base64url');
export const rid = (n = 12) => crypto.randomBytes(n).toString('base64url');
export const today = () => new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);   /* día en Colombia (UTC-5) */
export const cleanEmail = e => String(e || '').trim().toLowerCase();
export const okEmail = e => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e);
/* IP de quien llama: Vercel la pone en x-real-ip (y reescribe x-forwarded-for), así nadie la puede inventar para saltarse los límites.
   Si la petición viene del puente de Cloudflare Pages (cloudflare/), la IP real llega en x-sz-ip, firmada con la clave CF_PROXY_KEY */
const PROXY_KEY = (process.env.CF_PROXY_KEY || '').length >= 32 ? process.env.CF_PROXY_KEY : '';
const fromProxy = req => { if (!PROXY_KEY) return false; const a = Buffer.from(String(req.headers.get('x-sz-proxy') || '')), b = Buffer.from(PROXY_KEY); return a.length === b.length && crypto.timingSafeEqual(a, b); };
export const ipOf = req => String((fromProxy(req) && req.headers.get('x-sz-ip')) || req.headers.get('x-real-ip') || (req.headers.get('x-forwarded-for') || 'x').split(',')[0]).trim().slice(0, 64) || 'x';
export const str = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

/* límite de peticiones: n por ventana de s segundos */
/* Fase 4 · 1 comando en vez de 2: la fecha de vencimiento se pone solo al abrir la ventana (c = 1) o al pasarse del límite
   (por si la primera se perdió), no en cada llamada */
export async function limit(key, n, s){
  const c = +(await redis('INCR', 'rl:' + key));
  if (c === 1 || c > n) await redis('EXPIRE', 'rl:' + key, String(s), 'NX').catch(() => {});
  if (c > n) throw Object.assign(new Error('Vas muy rápido. Espera un momento e intenta de nuevo.'), { status:429 });
}

/* ---------- cifrado de llaves (AES-256-GCM) ---------- */
/* Si no pusiste SYNTHZ_SECRET, SymphorIA crea una clave al azar la primera vez y la guarda en tu base de datos.
   Así funciona sin configurar nada; con SYNTHZ_SECRET la clave vive fuera de la base (más seguro). */
const kdf = s => crypto.createHash('sha256').update('synthz:v1:' + s).digest();
const kidOf = k => crypto.createHash('sha256').update(k).digest('base64url').slice(0, 8);
let KEYS = null;
async function loadKey(){
  if (KEYS) return KEYS;
  const secrets = [SECRET, ...SECRET_OLD].filter(Boolean);
  let stored = await redis('GET', 'cfg:secret');
  if (!SECRET && !stored){ await redis('SET', 'cfg:secret', crypto.randomBytes(48).toString('base64url'), 'NX'); stored = await redis('GET', 'cfg:secret'); }
  if (stored) secrets.push(stored);                       /* la clave automática de antes sigue sirviendo para leer */
  if (!secrets.length) throw new Error('No pude preparar la clave de cifrado.');
  const all = [...new Set(secrets)].map(s => { const key = kdf(s); return { id:kidOf(key), key }; });
  KEYS = { cur:all[0], all };
  return KEYS;
}
const K = () => { if (!KEYS) throw new Error('clave de cifrado sin cargar'); return KEYS; };
/* formato v2.<id de clave>.<iv>.<tag>.<texto>; lo de antes (iv.tag.texto) se sigue leyendo con cualquiera de las claves */
export function enc(text){
  const { cur } = K(), iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', cur.key, iv);
  const ct = Buffer.concat([c.update(String(text), 'utf8'), c.final()]);
  return 'v2.' + cur.id + '.' + [iv, c.getAuthTag(), ct].map(b => b.toString('base64url')).join('.');
}
const open = (key, iv, tag, ct) => { const d = crypto.createDecipheriv('aes-256-gcm', key, iv); d.setAuthTag(tag); return Buffer.concat([d.update(ct), d.final()]).toString('utf8'); };
export function dec(blob){
  const p = String(blob || '').split('.'), { all } = K(), B = x => Buffer.from(x || '', 'base64url');
  if (p[0] === 'v2'){ const k = all.find(x => x.id === p[1]); if (!k) throw new Error('clave desconocida: ¿cambiaste SYNTHZ_SECRET sin poner la anterior en SYNTHZ_SECRET_OLD?'); return open(k.key, B(p[2]), B(p[3]), B(p[4])); }
  for (const k of all){ try{ return open(k.key, B(p[0]), B(p[1]), B(p[2])); }catch(e){} }
  throw new Error('no pude descifrar');
}
/* ¿hay que volver a cifrarlo con la clave actual? (rotación perezosa: se hace al leerlo) */
export const needsReenc = blob => !String(blob || '').startsWith('v2.' + K().cur.id + '.');
export const keyInfo = () => ({ current:K().cur.id, fromEnv:!!SECRET, readable:K().all.length });

/* ---------- contraseñas: scrypt con sal, comparación en tiempo constante ---------- */
/* s1 = N 2^14 (antes) · s2 = N 2^15 (ahora). Al entrar con una s1, se vuelve a guardar como s2 */
const SCRYPT_N = { s1:16384, s2:32768 };
const scryptP = (pass, salt, N) => new Promise((ok, no) => crypto.scrypt(String(pass).normalize('NFKC'), salt, 32, { N, r:8, p:1, maxmem:96 * 1024 * 1024 }, (e, k) => e ? no(e) : ok(k)));
export async function hashPass(pass){ const salt = crypto.randomBytes(16); return 's2$' + salt.toString('base64url') + '$' + (await scryptP(pass, salt, SCRYPT_N.s2)).toString('base64url'); }
export async function checkPass(pass, stored){
  const [v, salt, h] = String(stored || '').split('$'), known = SCRYPT_N[v] && h;
  const want = known ? Buffer.from(h, 'base64url') : crypto.randomBytes(32);
  const got = await scryptP(pass, salt ? Buffer.from(salt, 'base64url') : crypto.randomBytes(16), SCRYPT_N[v] || SCRYPT_N.s2);   /* siempre calcula: no revela si el usuario existe */
  return !!known && got.length === want.length && crypto.timingSafeEqual(got, want);
}
export const passNeedsUpgrade = stored => !String(stored || '').startsWith('s2$');
export const cleanUser = u => String(u || '').trim().replace(/^@/, '').toLowerCase();
export const okUser = u => /^[a-z0-9_.]{3,20}$/.test(u) && !/^[._]|[._]$|\.\./.test(u);
/* código de recuperación: 16 caracteres fáciles de copiar (sin 0/O ni 1/I) */
export function recoveryCode(){ const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = crypto.randomBytes(16); let s = ''; for (let i = 0; i < 16; i++){ s += A[b[i] % A.length]; if (i % 4 === 3 && i < 15) s += '-'; } return s; }
export const codeHash = c => sha('rc:' + String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''));
export const sameHash = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
export async function endAllSessions(sub){ const all = await redis('SMEMBERS', 'ss:' + sub); await pipe([].concat((all || []).map(h => ['DEL', 's:' + h]), [['DEL', 'ss:' + sub]])); }

/* ---------- candado corto para cambios que leen y escriben el mismo dato (equipos) ---------- */
export async function withLock(name, fn){
  const tok = rid(8), k = 'lk:' + name;
  for (let i = 0; i < 40; i++){
    if (await redis('SET', k, tok, 'NX', 'PX', '5000')){
      try{ return await fn(); }
      finally{ try{ if ((await redis('GET', k)) === tok) await redis('DEL', k); }catch(e){} }
    }
    await new Promise(r => setTimeout(r, 30 + Math.random() * 70));
  }
  throw Object.assign(new Error('Hay otro cambio en curso. Intenta de nuevo en un momento.'), { status:409 });
}
export const roleOf = u => (u && ['owner', 'admin', 'staff'].includes(u.role)) ? u.role : 'user';

/* ---------- Google: verificación completa del token (firma RS256 + aud + iss + exp) ---------- */
let jwks = null, jwksExp = 0;
async function googleKeys(force){
  if (!force && jwks && Date.now() < jwksExp) return jwks;
  const r = await fetch(CERTS); const d = await r.json();
  const ma = /max-age=(\d+)/.exec(r.headers.get('cache-control') || '');
  jwks = Array.isArray(d.keys) ? d.keys : []; jwksExp = Date.now() + (ma ? +ma[1] * 1000 : 3600e3);
  return jwks;
}
export async function verifyGoogle(token){
  const bad = m => Object.assign(new Error(m || 'No pude verificar tu cuenta de Google. Intenta de nuevo.'), { status:401 });
  const p = String(token || '').split('.'); if (p.length !== 3) throw bad();
  let head, claims;
  try{ head = JSON.parse(Buffer.from(p[0], 'base64url')); claims = JSON.parse(Buffer.from(p[1], 'base64url')); }catch(e){ throw bad(); }
  if (head.alg !== 'RS256' || !head.kid) throw bad();
  let k = (await googleKeys(false)).find(x => x.kid === head.kid);
  if (!k) k = (await googleKeys(true)).find(x => x.kid === head.kid);
  if (!k) throw bad();
  const ok = crypto.verify('RSA-SHA256', Buffer.from(p[0] + '.' + p[1]), crypto.createPublicKey({ key:k, format:'jwk' }), Buffer.from(p[2], 'base64url'));
  if (!ok) throw bad();
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss)) throw bad();
  if (!claims.aud || claims.aud !== (await googleCid())) throw bad();
  if (!claims.exp || claims.exp * 1000 < Date.now()) throw bad('Tu inicio de sesión expiró. Intenta de nuevo.');
  if (!claims.sub) throw bad();
  return claims;
}

/* ---------- sesiones propias de SymphorIA ---------- */
const SESS_TTL = 60 * 60 * 24 * 30;
export async function newSession(sub){
  const token = rid(32), h = sha(token);
  await pipe([['SET', 's:' + h, sub, 'EX', String(SESS_TTL)], ['SADD', 'ss:' + sub, h]]);
  return token;
}
export function bearer(req){ const a = req.headers.get('authorization') || ''; return a.startsWith('Bearer ') ? a.slice(7).trim() : ''; }
/* v2.9.1 · la sesión también viaja en una cookie HttpOnly (el JavaScript de la página no la puede leer, así un XSS no se roba la cuenta).
   SameSite=Strict: otra página no puede hacer pedidos con tu sesión. El «Bearer» sigue sirviendo mientras se pasan los dispositivos viejos */
const COOKIE = '__Host-szs';
export const sessCookie = token => COOKIE + '=' + (token || '') + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + (token ? SESS_TTL : 0);
export const withCookie = (res, token) => { res.headers.append('set-cookie', sessCookie(token)); return res; };
const cookieTok = req => { const m = /(?:^|;\s*)__Host-szs=([A-Za-z0-9_-]{21,})/.exec(req.headers.get('cookie') || ''); return m ? m[1] : ''; };
/* un Bearer corto (la marca «c…» que guarda la página) no es una sesión: se usa la cookie */
export const sessTok = req => { const b = bearer(req); return b.length > 20 ? b : cookieTok(req); };
export async function auth(req, optional){
  const t = sessTok(req);
  const sub = t && t.length > 20 ? await redis('GET', 's:' + sha(t)) : null;
  if (!sub){ if (optional) return null; throw Object.assign(new Error('Tu sesión cerró. Vuelve a entrar.'), { status:401 }); }
  const user = await getJ('u:' + sub);
  if (!user){ if (optional) return null; throw Object.assign(new Error('Tu cuenta ya no existe.'), { status:401 }); }
  if (user.blocked){ if (optional) return null; throw Object.assign(new Error('Esta cuenta está suspendida. Escríbele al equipo de SymphorIA.'), { status:403 }); }
  return user;
}
export async function endSession(req){ const t = sessTok(req); if (!t) return; const h = sha(t), sub = await redis('GET', 's:' + h); await pipe([['DEL', 's:' + h]].concat(sub ? [['SREM', 'ss:' + sub, h]] : [])); }

/* ---------- SynXCoin's en la nube: una fila por dispositivo (hash lg:<sub>) ----------
   Cada dispositivo sube SOLO su fila (y la fila «legacy» de versiones viejas). El servidor junta cada fila con la que
   ya tenía tomando el mayor valor (las filas solo crecen), así que subir dos veces no duplica y un dispositivo nunca
   borra lo de otro. «_ep» es la época: si alguien reinicia los contadores, las filas de épocas viejas se ignoran. */
const nn = v => (Number.isFinite(+v) && +v > 0) ? Math.min(Math.round(+v), 1e13) : 0;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export function cleanLedgerRow(r){
  const out = {};
  if (!r || typeof r !== 'object') return out;
  Object.keys(r).slice(0, 10).forEach(pid => {
    if (!/^[a-z][a-z0-9_-]{1,20}$/.test(pid) || !r[pid] || typeof r[pid] !== 'object') return;
    const s = r[pid], o = { p:nn(s.p), c:nn(s.c), r:nn(s.r), e:nn(s.e) };
    ['days', 'de', 'rd', 'fd'].forEach(m => { o[m] = {}; const src = s[m]; if (src && typeof src === 'object') Object.keys(src).filter(d => DAY.test(d)).sort().slice(-400).forEach(d => { const v = nn(src[d]); if (v) o[m][d] = v; }); });
    out[pid] = o;
  });
  return out;
}
export function mergeLedgerRow(a, b){
  const out = Object.assign({}, a);
  Object.keys(b).forEach(pid => {
    const x = a[pid], y = b[pid]; if (!x){ out[pid] = y; return; }
    const o = { p:Math.max(x.p, y.p), c:Math.max(x.c, y.c), r:Math.max(x.r, y.r), e:Math.max(x.e, y.e) };
    ['days', 'de', 'rd', 'fd'].forEach(m => { o[m] = Object.assign({}, x[m]); Object.keys(y[m]).forEach(d => { o[m][d] = Math.max(o[m][d] || 0, y[m][d]); }); });
    out[pid] = o;
  });
  return out;
}
export async function getLedger(sub){
  const flat = await redis('HGETALL', 'lg:' + sub) || [];
  const L = { ep:0, dev:{} };
  for (let i = 0; i + 1 < flat.length; i += 2){
    if (flat[i] === '_ep') L.ep = +flat[i + 1] || 0;
    else { try{ L.dev[flat[i]] = JSON.parse(flat[i + 1]); }catch(e){} }
  }
  return L;
}
export async function putLedger(sub, L){
  const key = 'lg:' + sub, ep = nn(L && L.ep);
  let cur = +(await redis('HGET', key, '_ep')) || 0;
  if (ep > cur){ await pipe([['DEL', key], ['HSET', key, '_ep', String(ep)]]); cur = ep; }   /* alguien reinició: época nueva */
  if (ep < cur) return { stale:true };                                                          /* filas de antes del reinicio: no cuentan */
  const ids = Object.keys((L && L.dev) || {}).filter(id => /^[\w-]{1,40}$/.test(id) && id !== '_ep').slice(0, 3);
  if (!ids.length) return { ok:true };
  const prev = await redis('HMGET', key, ...ids);
  await pipe(ids.map((id, i) => { let old = {}; try{ old = prev[i] ? JSON.parse(prev[i]) : {}; }catch(e){} return ['HSET', key, id, JSON.stringify(mergeLedgerRow(cleanLedgerRow(old), cleanLedgerRow(L.dev[id])))]; }));
  return { ok:true };
}

/* ---------- chats en la nube: guardar los que cambiaron y BORRAR de verdad los borrados ---------- */
const MAX_ONE = 400_000;
const mb = n => (n / 1048576).toFixed(n < 10 * 1048576 ? 1 : 0).replace('.', ',') + ' MB';
export const okChatKey = k => typeof k === 'string' && k.length < 300 && /^openrouter::./.test(k);
/* cuánto ocupa la nube de alguien (cz:<sub>); si no existe aún, se mide una vez */
export async function cloudUsed(sub){
  const v = await redis('GET', 'cz:' + sub);
  if (v != null) return Math.max(0, +v || 0);
  const all = await redis('HKEYS', 'c:' + sub) || [];
  const lens = all.length ? await pipe(all.map(k => ['HSTRLEN', 'c:' + sub, k])) : [];
  const used = lens.reduce((a, b) => a + (+b || 0), 0);
  await redis('SET', 'cz:' + sub, String(used));
  return used;
}
export async function saveChats(sub, b){
  const del = (Array.isArray(b.del) ? b.del : []).filter(okChatKey).slice(0, 300);
  const items = (Array.isArray(b.items) ? b.items : []).filter(x => x && okChatKey(x.k) && Array.isArray(x.data)).slice(0, 40);
  if (!del.length && !items.length) return { saved:0, deleted:0 };
  const strs = items.map(it => JSON.stringify(it.data));
  strs.forEach(s => { if (Buffer.byteLength(s) > MAX_ONE) throw Object.assign(new Error('Una conversación es demasiado larga para guardarla en la nube.'), { status:413 }); });
  const key = 'c:' + sub, ks = [...items.map(i => i.k), ...del];
  const [used, ...old] = await Promise.all([cloudUsed(sub), ...ks.map(k => redis('HSTRLEN', key, k))]);
  const before = old.map(x => +x || 0);
  const delta = strs.reduce((a, s, i) => a + Buffer.byteLength(s) - before[i], 0) - before.slice(items.length).reduce((a, x) => a + x, 0);
  if (delta > 0 && used + delta > QUOTA) throw Object.assign(new Error('Tu espacio en la nube está lleno (' + mb(used) + ' de ' + mb(QUOTA) + '). Tus chats siguen en este dispositivo; borra conversaciones viejas para liberar espacio.'), { status:413, code:'quota' });
  const cmds = [];
  if (del.length) cmds.push(['HDEL', key, ...del]);
  items.forEach((it, i) => cmds.push(['HSET', key, it.k, strs[i]]));
  if (delta) cmds.push(['INCRBY', 'cz:' + sub, String(delta)]);
  await pipe(cmds);
  await sbChats(sub, items, del);
  return { saved:items.length, deleted:del.length, used:Math.max(0, used + delta), max:QUOTA };
}


/* ---------- Supabase: la base de datos de verdad ----------
   Si en Vercel están SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY), cuentas, perfiles, preferencias, chats, logros y opiniones
   se guardan también en Supabase. Si no está, todo sigue en Redis como antes (nada se rompe).
   La llave secreta SOLO vive en el servidor: nunca va al navegador ni a las respuestas. */
const SB_URL = String(process.env.SUPABASE_URL || 'https://luvvlfoyatdmrxvhdxay.supabase.co').replace(/\/+$/, '');
const SB_KEY = String(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
export const SB_PUB = String(process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_HBY92jXWdZt4f2HwnyQTPQ_KKkkURdh').trim();   /* pública: se puede ver */
export const SB_HOST = SB_URL;
export const sbOn = () => !!SB_KEY;
export async function sb(path, o = {}){
  if (!SB_KEY) return null;
  const h = Object.assign({ apikey:SB_KEY, 'Content-Type':'application/json' }, /^eyJ/.test(SB_KEY) ? { Authorization:'Bearer ' + SB_KEY } : {}, o.headers || {});
  const r = await fetch(SB_URL + '/rest/v1/' + path, { method:o.method || 'GET', headers:h, body:o.body == null ? undefined : JSON.stringify(o.body), signal:AbortSignal.timeout(o.timeout || 7000) });
  if (!r.ok){ const t = await r.text().catch(() => ''); throw Object.assign(new Error('supabase ' + r.status + ' ' + t.slice(0, 160)), { status:502, sb:true }); }
  if (r.status === 204 || o.minimal) return null;
  return r.json().catch(() => null);
}
const sbUp = (table, rows, conflict) => sb(table + '?on_conflict=' + conflict, { method:'POST', body:rows, minimal:true, headers:{ Prefer:'resolution=merge-duplicates,return=minimal' } });
const qv = v => encodeURIComponent(String(v));
const nowIso = () => new Date().toISOString();
/* nunca deja caer una petición por Supabase: si falla, se anota y sigue con Redis */
export async function sbSafe(fn){ if (!SB_KEY) return null; try{ return await fn(); }catch(e){ console.error('[supabase]', e.message); try{ await redis('LPUSH', 'sb:err', JSON.stringify({ t:Date.now(), m:String(e.message).slice(0, 200) })); await redis('LTRIM', 'sb:err', 0, 49); }catch(x){} return null; } }
const known = new Set();
async function sbEnsure(sub){ if (known.has(sub)) return; await sbUp('accounts', [{ sub }], 'sub'); known.add(sub); }
export const sbAccount = u => sbSafe(async () => { if (!u || !u.sub) return; await sbUp('accounts', [Object.assign({ sub:u.sub, username:u.username || null, email:u.email || null, role:roleOf(u), updated_at:nowIso() }, u.sbUid ? { sb_uid:u.sbUid } : {})], 'sub'); known.add(u.sub); });
export const sbProfile = (sub, data) => sbSafe(async () => { await sbEnsure(sub); await sbUp('profiles', [{ sub, data, updated_at:nowIso() }], 'sub'); });
export const sbPrefs = (sub, data) => sbSafe(async () => { await sbEnsure(sub); await sbUp('prefs', [{ sub, data, updated_at:nowIso() }], 'sub'); });
export const sbChats = (sub, items, del) => sbSafe(async () => {
  await sbEnsure(sub);
  if (items.length) await sbUp('chats', items.map(it => ({ sub, k:it.k, data:it.data, bytes:Buffer.byteLength(JSON.stringify(it.data)), updated_at:nowIso() })), 'sub,k');
  for (const k of del) await sb('chats?sub=eq.' + qv(sub) + '&k=eq.' + qv(k), { method:'DELETE', minimal:true });
});
export const sbChatsGet = (sub, ks) => sbSafe(async () => { const out = {}; for (const k of ks){ const r = await sb('chats?select=data&sub=eq.' + qv(sub) + '&k=eq.' + qv(k)); if (r && r[0]) out[k] = r[0].data; } return out; });
export const sbAch = (sub, code) => sbSafe(async () => { await sbEnsure(sub); await sbUp('achievements', [{ sub, code:String(code), discount_eligible:code !== '50' }], 'sub,code'); });
export const sbFeedback = (sub, cat, text, page) => sbSafe(async () => { if (sub) await sbEnsure(sub); await sb('feedback', { method:'POST', minimal:true, body:[{ sub:sub || null, cat:str(cat, 30) || null, text:str(text, 4000), page:str(page, 80) || null }], headers:{ Prefer:'return=minimal' } }); });
export const sbDelete = sub => sbSafe(() => sb('accounts?sub=eq.' + qv(sub), { method:'DELETE', minimal:true }));
export const sbFindByUid = uid => sbSafe(async () => { const r = await sb('accounts?select=sub&sb_uid=eq.' + qv(uid)); return r && r[0] ? r[0].sub : null; });
/* verifica un inicio de sesión de Supabase (Google) preguntándole a Supabase quién es el dueño del token */
export async function sbUser(accessToken){
  const r = await fetch(SB_URL + '/auth/v1/user', { headers:{ apikey:SB_PUB, Authorization:'Bearer ' + String(accessToken || '') }, signal:AbortSignal.timeout(7000) });
  if (!r.ok) throw Object.assign(new Error('No pude verificar tu cuenta de Google. Intenta de nuevo.'), { status:401 });
  const u = await r.json(); if (!u || !u.id) throw Object.assign(new Error('No pude verificar tu cuenta de Google.'), { status:401 });
  return u;
}
/* ¿Supabase tiene «Entrar con Google» encendido? (se pregunta con la llave pública y se guarda 5 min) */
let sbg = { v:false, t:0 };
export async function sbGoogleOn(){
  if (Date.now() - sbg.t < 300e3) return sbg.v;
  let v = false; try{ const r = await fetch(SB_URL + '/auth/v1/settings', { headers:{ apikey:SB_PUB }, signal:AbortSignal.timeout(5000) }); const d = await r.json(); v = !!(d && d.external && d.external.google); }catch(e){}
  sbg = { v, t:Date.now() }; return v;
}

/* ---------- perfil público mínimo (lo que ven tus compañeros de equipo) ---------- */
export async function publicOf(sub){
  const [u, p] = await Promise.all([getJ('u:' + sub), getJ('p:' + sub)]);
  if (!u) return { sub, name:'Cuenta borrada', email:'', handle:'' };
  return { sub, email:u.email || '', username:u.username || '', handle:u.username ? '@' + u.username : (u.email || ''), name:(p && p.name) || u.name || u.email, picture: p && p.avatar && p.avatar.type === 'google' ? u.picture || '' : '', avatar:(p && p.avatar) || null, color:(p && p.color) || '' };
}
