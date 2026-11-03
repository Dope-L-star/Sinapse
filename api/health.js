/* Salud de SymphorIA (sin datos personales ni chats):
   GET                          → { bad:[{ id, t }] }  modelos escondidos (máx. 12 h)
   GET ?panel=1                 → (equipo) Pulsem: en línea, dificultades, errores, carga, llaves y ayuda
   POST { id, ok }              → «este modelo falló / volvió a responder» (se esconde con 2 conexiones distintas o 1 del equipo)
   POST { action:'beat', … }    → «sigo aquí» cada 10 min (equipo: 3) (para saber quién está en línea y si algo le pasa)
   POST { action:'ev', kind, detail } → un tropiezo: error, recarga, confusión, sin IA, tope del día
   Nunca se guardan mensajes ni chats: solo la página, el estado y un texto corto del error. */
import { route, body, json, fail, redis, pipe, getJ, limit, auth, roleOf, sha, today, str, sbOn, sbGoogleOn, ipOf } from './_lib.js';
import { status, settings, ORDER, PROV, alerts } from './_pool.js';

const TTL = 12 * 3600, ID_RX = /^(or|pu|gq|sz):[\w.:/@+-]{2,160}$/;
const ONLINE_MS = 12 * 60e3,   /* v3.7 · el «sigo aquí» de las personas ahora es cada 10 min (el del equipo, cada 3) */
      KINDS = ['error', 'jserror', 'reload', 'confused', 'noai', 'limit', 'puter_out', 'slow'];
const RANK = { owner:'Prime', admin:'ZFlow', staff:'Symmetrix', user:'Synther' };
async function whoOf(req){
  const me = await auth(req, true).catch(() => null);
  if (me) return { id:'u:' + me.sub, name:'@' + (me.username || me.name || 'synther'), rank:RANK[roleOf(me)], sub:me.sub, me };
  const dev = String(req.headers.get('x-sz-device') || ''), h = sha('dev:' + (/^[\w-]{12,48}$/.test(dev) ? dev : 'ip:' + ipOf(req))).slice(0, 10);
  return { id:'d:' + h, name:'Invitado ' + h.slice(0, 4).toUpperCase(), rank:'Invitado', sub:'' };
}
let BAD_CACHE = { t:0, v:null };   /* lista de modelos escondidos, guardada 30 s (se borra aquí mismo si cambia) */
const clean = s => str(s, 160).replace(/(gsk_|sk-|cfat_|Bearer\s+)[\w-]{6,}/gi, '••');

export default route({
  async GET(req){
    const u = new URL(req.url);
    if (u.searchParams.get('panel')){
      const me = await auth(req); if (roleOf(me) === 'user') return fail(403, 'Solo el equipo de SymphorIA puede ver Pulsem.');
      const now = Date.now(), d = today();
      /* los que ya se fueron salen de la lista y de sus datos (así «pri» no crece para siempre) */
      const gone = (await redis('ZRANGEBYSCORE', 'pr', '0', String(now - ONLINE_MS), 'LIMIT', '0', '300').catch(() => [])) || [];
      if (gone.length) await pipe([['ZREM', 'pr', ...gone], ['HDEL', 'pri', ...gone]]).catch(() => {});
      const ids = (await redis('ZRANGEBYSCORE', 'pr', String(now - ONLINE_MS), '+inf')) || [];
      const metas = ids.length ? await redis('HMGET', 'pri', ...ids) : [];
      const online = ids.map((id, i) => { let m = {}; try{ m = JSON.parse(metas[i] || '{}'); }catch(e){} return Object.assign({ id }, m); });
      const evs = ((await redis('LRANGE', 'evl', '0', '149')) || []).map(x => { try{ return JSON.parse(x); }catch(e){ return null; } }).filter(Boolean);
      const days = [...Array(7)].map((_, i) => new Date(now - 5 * 3600e3 - i * 86400e3).toISOString().slice(0, 10));
      const sts = await pipe(days.map(x => ['HGETALL', 'st:' + x]));
      const stat = days.map((x, i) => { const a = sts[i] || [], o = { day:x }; for (let j = 0; j < a.length; j += 2) o[a[j]] = +a[j + 1] || 0; return o; });
      const minutes = [...Array(30)].map((_, i) => Math.floor(now / 60e3) - i);
      const mins = (await redis('MGET', ...minutes.map(m => 'stm:' + m))) || [];          /* 1 sola consulta para los 30 minutos */
      const [keys, set, hlist, fbl] = await Promise.all([status(), settings(), redis('LRANGE', 'hq:list', '0', '59'), redis('LRANGE', 'fb', '0', '59')]);
      const fbr = fbl && fbl.length ? await redis('HMGET', 'fbh', ...fbl) : [];
      const feedback = (fbr || []).map(x => { try{ return x ? JSON.parse(x) : null; }catch(e){ return null; } }).filter(Boolean);
      const sbErr = ((await redis('LRANGE', 'sb:err', '0', '4')) || []).map(x => { try{ return JSON.parse(x); }catch(e){ return null; } }).filter(Boolean);
      const supa = { on:sbOn(), google:await sbGoogleOn().catch(() => false), errs:sbErr };
      const mk = new Date().toISOString().slice(0, 7), uv = (await redis('MGET', 'use:c:' + mk, 'use:r:' + mk).catch(() => [])) || [], use = { month:mk, cmd:+uv[0] || 0, req:+uv[1] || 0 };
      const alertL = await alerts().catch(() => []);
      const hrows = hlist && hlist.length ? await pipe(hlist.map(x => ['GET', 'hq:' + x])) : [];
      const help = hrows.map(v => { try{ return v ? JSON.parse(v) : null; }catch(e){ return null; } }).filter(r => r && r.status !== 'done').map(r => ({ id:r.id, status:r.status, t:r.t, user:r.user, text:String(r.text || '').slice(0, 120), by:r.by, urgent:r.status === 'open' && now - r.t > 15 * 60e3 }));
      return json({ now, use, supa, alerts:alertL, rank:RANK[roleOf(me)], canEdit:['owner', 'admin'].includes(roleOf(me)), online, events:evs, stat, perMin:mins.map(x => +x || 0).reverse(), dayLimit:set.dayLimit,
        keys:keys.map(k => ({ id:k.id, prov:k.prov, provName:k.provName, owner:k.owner && { name:k.owner.name, rank:k.owner.rank }, n:k.n, cap:k.cap, tok:k.tok, down:k.down, check:k.check, src:k.src })), provs:ORDER.map(p => ({ id:p, name:PROV[p].name })), help, feedback });
    }
    /* Fase 4 · costo cero: todas las visitas piden esta misma lista al abrir la página; cada servidor la guarda 30 s */
    if (BAD_CACHE.v && Date.now() - BAD_CACHE.t < 30e3) return json(BAD_CACHE.v);
    const all = await redis('HGETALL', 'mh:bad') || [];
    const now = Date.now(), bad = [], old = [];
    for (let i = 0; i < all.length; i += 2){ const t = +all[i + 1] || 0; if (now - t < TTL * 1000) bad.push({ id:all[i], t }); else old.push(all[i]); }
    if (old.length) await redis('HDEL', 'mh:bad', ...old).catch(() => {});
    BAD_CACHE = { t:now, v:{ bad:bad.slice(0, 400) } };
    return json(BAD_CACHE.v);
  },
  async POST(req){
    const b = await body(req, 4000), ip = ipOf(req);
    /* «sigo aquí»: una línea en la lista de en línea (1 escritura) y una consulta por si el equipo te escribió */
    if (b.action === 'beat'){
      await limit('pr:ip:' + ip, 120, 3600);
      const w = await whoOf(req), st = b.state && typeof b.state === 'object' ? b.state : {};
      const meta = { name:w.name, rank:w.rank, page:str(b.page, 40), since:+st.since || Date.now(), msgs:Math.min(9999, +st.msgs || 0), ai:str(st.ai, 12), locked:!!st.locked, mobile:!!st.mobile, errs:Math.min(99, +st.errs || 0), t:Date.now() };
      const cmds = [['ZADD', 'pr', String(Date.now()), w.id], ['HSET', 'pri', w.id, JSON.stringify(meta)]];
      if (w.sub) cmds.push(['GET', 'hq:u:' + w.sub]);
      const r = await pipe(cmds);
      return json({ ok:true, help:!!(w.sub && r[2]) });
    }
    if (b.action === 'ev'){
      const kind = KINDS.includes(b.kind) ? b.kind : ''; if (!kind) return fail(400, 'Evento no válido.');
      await limit('ev:ip:' + ip, 30, 3600);
      const w = await whoOf(req);
      const e = { t:Date.now(), kind, who:w.name, rank:w.rank, sub:w.sub || '', page:str(b.page, 40), detail:clean(b.detail) };
      await pipe([['LPUSH', 'evl', JSON.stringify(e)], ['LTRIM', 'evl', '0', '299'], ['HINCRBY', 'st:' + today(), 'ev_' + kind, '1']]);
      return json({ ok:true });
    }
    const id = typeof b.id === 'string' ? b.id.trim() : '';
    if (!ID_RX.test(id)) return fail(400, 'Modelo no válido.');
    await limit('mh:ip:' + ip, 40, 3600);
    if (b.ok === true){ BAD_CACHE.t = 0; await redis('HDEL', 'mh:bad', id); await redis('DEL', 'mh:r:' + id); return json({ ok:true }); }
    const me = await auth(req, true).catch(() => null), team = roleOf(me) !== 'user';
    const who = sha('ip:' + ip).slice(0, 16), k = 'mh:r:' + id;
    const [, , n] = await pipe([['SADD', k, who], ['EXPIRE', k, String(TTL)], ['SCARD', k]]);
    if (team || +n >= 3){ BAD_CACHE.t = 0; await redis('HSET', 'mh:bad', id, String(Date.now())); }
    return json({ ok:true, hidden:team || +n >= 3 });
  }
});
