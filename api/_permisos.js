/* v4.4 · Permisos y límites por persona (Pulsem › Usuarios). Pedido de Sammuel, 9 nov (la versión del 29 oct, PR #18, se deshizo en #19).
   perm:<sub> → { day, img, search, smart, aliasX, credit, f:{ alias, image, search, review, smart, premium }, note, by, t }
   Solo se guarda lo que alguien cambió; lo demás usa lo de todos. Clave nueva (perm:) para no revivir lo que quedó de ux: en octubre.
   El servidor decide siempre: /api/ai, /api/alias y api/_premium.js leen esto en cada pedido. La página solo muestra lo que le llega.
   El equipo (Prime, ZFlow y Symmetrix) sigue con todo prendido y sin tope, salvo que alguien le ponga uno a mano. */
import { redis, setJ, str, roleOf } from './_lib.js';

/* funciones que se dan o se quitan por persona, y cómo vienen si nadie las toca.
   premium: los modelos de pago de OpenRouter como REGALO (sin cobrar). Solo funciona cuando la llave premium esté puesta (PREMIUM.md). */
export const FEATS = { alias:true, image:true, search:true, review:true, smart:true, premium:false };
/* límites propios: null = el de todos. day -1 = EnerX sin tope. day 0 = sin IAs conectadas hoy (bajar a cero también es un límite) */
export const LIM = { day:[0, 5_000_000], img:[0, 500], search:[0, 2000], smart:[0, 2000], aliasX:[1, 100], credit:[0, 50] };

const parse = v => { try{ const o = typeof v === 'string' ? JSON.parse(v) : v; return o && typeof o === 'object' ? o : {}; }catch(e){ return {}; } };
const bools = f => { const o = {}; if (f && typeof f === 'object') for (const k of Object.keys(FEATS)) if (typeof f[k] === 'boolean') o[k] = f[k]; return o; };
export function num(v, k){
  if (v === null || v === '' || v === undefined || !LIM[k]) return null;
  if (k === 'day' && +v === -1) return -1;
  const n = k === 'credit' ? Math.round(+v * 100) / 100 : Math.round(+v); if (!Number.isFinite(n)) return null;
  return Math.max(LIM[k][0], Math.min(LIM[k][1], n));
}
/* lo que se guarda: solo lo que alguien cambió (Pulsem manda solo las funciones distintas de lo de siempre para esa persona) */
export function clean(b){
  const o = { f:bools(b && b.f) };
  for (const k of Object.keys(LIM)){ const n = num(b && b[k], k); if (n !== null) o[k] = n; }
  const note = str(b && b.note, 200); if (note) o.note = note;
  return o;
}
export const isEmpty = o => !Object.keys(o.f || {}).length && !Object.keys(LIM).some(k => o[k] != null) && !o.note;

/* lo que vale para esta persona ahora */
export function resolve(own, team){
  own = parse(own); const mine = bools(own.f), f = {};
  for (const k of Object.keys(FEATS)) f[k] = k in mine ? mine[k] : team ? true : FEATS[k];
  const out = { team:!!team, f };
  for (const k of Object.keys(LIM)) out[k] = num(own[k], k);
  return out;
}
/* una sola consulta a Redis por pedido */
export async function perksOf(me){
  if (!me || !me.sub) return null;
  return resolve(await redis('GET', 'perm:' + me.sub).catch(() => null), roleOf(me) !== 'user');
}
/* EnerX para chat() de _pool.js: free = sin tope (el equipo, o «sin límite»); dayLimit = el propio (null = el de todos) */
export function enerOf(p){
  if (!p) return { free:false, dayLimit:null };
  if (p.day === -1 || (p.team && p.day == null)) return { free:true, dayLimit:null };
  return { free:false, dayLimit:p.day };
}
/* lo que ve la página (sin notas ni quién lo cambió) */
export const publicPerks = p => p ? { f:p.f, unl:enerOf(p).free, own:{ day:p.day, img:p.img, search:p.search, smart:p.smart, aliasX:p.aliasX } } : null;
export const offErr = (msg, code) => Object.assign(new Error(msg), { status:403, code });
/* tope de un contador del día: el propio, si no el de siempre (base) */
export const capOf = (p, k, base) => p && p[k] != null ? p[k] : base;

export const permGet = async sub => parse(await redis('GET', 'perm:' + sub));
export async function permSave(sub, o, by){
  if (isEmpty(o)){ await redis('DEL', 'perm:' + sub); return {}; }
  const v = Object.assign({}, o, { by, t:Date.now() }); await setJ('perm:' + sub, v); return v;
}
/* registro corto de quién cambió qué (los últimos 60), para que el equipo vea el historial */
export async function permLog(entry){
  try{ await redis('LPUSH', 'perm:log', JSON.stringify(Object.assign({ t:Date.now() }, entry))); await redis('LTRIM', 'perm:log', 0, 59); }catch(e){}
}
export async function permLogGet(n = 20){ const L = await redis('LRANGE', 'perm:log', 0, n - 1).catch(() => []); return (L || []).map(x => parse(x)).filter(x => x.t); }
