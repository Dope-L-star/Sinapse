/* v4.4 · Pulsem › Usuarios: buscar cuentas, ver su ficha y darle a cada una sus permisos y límites (va por /api/trial, sin ruta nueva)
   POST /api/trial { action:'users', q?, cursor? }   → (equipo) lista de cuentas, hasta 200 por vuelta
   POST /api/trial { action:'user', sub }            → (equipo) ficha: datos, lo que usó hoy, lo propio, lo de todos y lo que vale ahora
   POST /api/trial { action:'uset', sub, perm }      → (Prime/ZFlow) permisos y límites propios de esa cuenta ({} = volver a lo de todos)
   POST /api/trial { action:'ublock', sub, on, why } → (Prime/ZFlow) suspender o reactivar (nunca una cuenta del equipo ni la propia)
   Sin chats ni contraseñas: solo lo que hace falta para ayudar a esa persona. Todo cambio queda en perm:log. */
import { redis, pipe, getJ, setJ, today, str, roleOf, endAllSessions, cleanEmail, cleanUser } from './_lib.js';
import { settings } from './_pool.js';
import { config as premCfg } from './_premium.js';
import { FEATS, LIM, clean, resolve, permGet, permSave, permLog, permLogGet } from './_permisos.js';

const RANK = { owner:'Prime', admin:'ZFlow', staff:'Symmetrix', user:'Synther' };
/* lo de siempre para quien no tiene nada propio (los mismos números que usan api/ai.js y api/alias.js) */
const BASE = { search:60, smart:40, aliasX:1 };
const err = (s, m) => Object.assign(new Error(m), { status:s });
const boss = me => ['owner', 'admin'].includes(roleOf(me));
const parse = v => { try{ return v ? JSON.parse(v) : null; }catch(e){ return null; } };
const okSub = s => typeof s === 'string' && /^[\w:.@-]{1,120}$/.test(s);
const row = (u, p, own) => ({ sub:u.sub, handle:u.username ? '@' + u.username : '', email:u.email || '', name:(p && p.name) || u.name || u.username || u.email || '', rank:RANK[roleOf(u)], created:u.created || 0, seen:u.seen || 0, blocked:!!u.blocked, own:!!own });
async function account(sub){ if (!okSub(sub)) throw err(400, 'Cuenta no válida.'); const u = await getJ('u:' + sub); if (!u || u.mergedInto) throw err(404, 'Esa cuenta ya no existe.'); return u; }
/* la cuenta de Prime solo la cambia Prime; ZFlow cambia a todos los demás */
const canTouch = (me, u) => boss(me) && (roleOf(u) !== 'owner' || roleOf(me) === 'owner');
const by = me => RANK[roleOf(me)] + ' @' + (me.username || me.email || '');

async function list(b){
  const q = String(b.q || '').trim().toLowerCase().replace(/^@/, '').slice(0, 80);
  /* búsqueda exacta primero (1 consulta): @usuario o correo */
  if (q && !b.cursor){
    const sub = await redis('GET', String(b.q).includes('@') && q.includes('@') ? 'e:' + cleanEmail(q) : 'n:' + cleanUser(q));
    if (sub){ const [u, p, own] = await pipe([['GET', 'u:' + sub], ['GET', 'p:' + sub], ['GET', 'perm:' + sub]]); const U = parse(u); if (U && !U.mergedInto) return { users:[row(U, parse(p), own)], cursor:'0', done:true }; }
  }
  const r = await redis('SCAN', String(+b.cursor || 0), 'MATCH', 'u:*', 'COUNT', '200'), ks = ((r && r[1]) || []).filter(k => /^u:[\w:.@-]+$/.test(k));
  if (!ks.length) return { users:[], cursor:r ? r[0] : '0', done:!r || r[0] === '0' };
  const subs = ks.map(k => k.slice(2));
  const [us, ps, os] = await pipe([['MGET', ...ks], ['MGET', ...subs.map(s => 'p:' + s)], ['MGET', ...subs.map(s => 'perm:' + s)]]);
  const users = ks.map((k, i) => { const u = parse(us[i]); return u && u.sub && !u.mergedInto ? row(u, parse(ps[i]), os[i]) : null; }).filter(Boolean)
    .filter(x => !q || [x.handle, x.email, x.name].some(v => String(v).toLowerCase().includes(q)));
  return { users, cursor:r[0], done:r[0] === '0' };
}

async function card(me, sub){
  const u = await account(sub), d = today();
  const [p, own, set] = await Promise.all([getJ('p:' + sub), permGet(sub), settings()]);
  const used = await pipe([['GET', 'q:u:' + sub + ':' + d], ['GET', 'img:' + sub + ':' + d], ['GET', 'srch:u:' + sub + ':' + d], ['GET', 'sm:u:' + sub + ':' + d], ['GET', 'alias:s:' + sub + ':' + d], ['SCARD', 'ss:' + sub]]);
  const team = roleOf(u) !== 'user', now = resolve(own, team), pc = premCfg();
  const base = { day:set.dayLimit, img:set.imgDay, search:BASE.search, smart:BASE.smart, aliasX:BASE.aliasX, credit:pc.credit, f:resolve({}, false).f };
  const ownOut = { f:own.f || {}, note:own.note || '', by:own.by || '', t:own.t || 0 };
  for (const k of Object.keys(LIM)) ownOut[k] = own[k] ?? null;
  return {
    user:row(u, p, Object.keys(own).length), kind:u.kind || (u.email ? 'google' : 'pass'), sessions:+used[5] || 0,
    used:{ day:+used[0] || 0, img:+used[1] || 0, search:+used[2] || 0, smart:+used[3] || 0, alias:+used[4] || 0 },
    own:ownOut,
    now:{ f:now.f, day:now.day === -1 || (team && now.day == null) ? -1 : now.day ?? base.day, img:now.img ?? (team ? 5000 : base.img), search:now.search ?? (team ? 5000 : base.search), smart:now.smart ?? (team ? 1000 : base.smart), aliasX:now.aliasX ?? (team ? 100 : 1), credit:now.credit ?? base.credit },
    base, premiumOn:pc.on, team, canEdit:canTouch(me, u), canBlock:boss(me) && !team && u.sub !== me.sub
  };
}

export async function usersAction(me, b){
  const a = b.action;
  if (a === 'users'){ const r = await list(b); return Object.assign(r, { canEdit:boss(me), feats:Object.keys(FEATS), log:b.cursor ? undefined : await permLogGet(12) }); }
  if (a === 'user') return card(me, b.sub);
  if (!boss(me)) throw err(403, 'Solo Prime y ZFlow pueden cambiar esto.');
  const u = await account(b.sub), who = u.username ? '@' + u.username : u.email || u.sub;
  if (a === 'uset'){
    if (!canTouch(me, u)) throw err(403, 'Solo Prime puede cambiar la cuenta de Prime.');
    const v = await permSave(u.sub, clean(b.perm || {}), by(me));
    await permLog({ by:by(me), who, sub:u.sub, what:Object.keys(v).length ? 'set' : 'reset', perm:Object.keys(v).length ? Object.assign({}, v, { by:undefined, t:undefined, note:undefined }) : null });
    return Object.assign({ ok:true, log:await permLogGet(12) }, await card(me, u.sub));
  }
  if (a === 'ublock'){
    if (u.sub === me.sub) throw err(400, 'No puedes suspender tu propia cuenta.');
    if (roleOf(u) !== 'user') throw err(403, 'Las cuentas del equipo no se suspenden desde aquí.');
    const on = !!b.on;
    if (on) u.blocked = { by:by(me), t:Date.now(), why:str(b.why, 200) }; else delete u.blocked;
    await setJ('u:' + u.sub, u);
    if (on) await endAllSessions(u.sub);                       /* sale de todos sus dispositivos al instante */
    await permLog({ by:by(me), who, sub:u.sub, what:on ? 'block' : 'unblock' });
    return Object.assign({ ok:true, log:await permLogGet(12) }, await card(me, u.sub));
  }
  throw err(400, 'Acción desconocida.');
}
export const USERS_ACTIONS = new Set(['users', 'user', 'uset', 'ublock']);
