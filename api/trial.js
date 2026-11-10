/* Llaves del equipo, ajustes de la IA de SymphorIA y la prueba de la guía (beta 2)
   GET                                         → (equipo) estado de cada llave, tope diario, Google y Drive
   POST { action:'keys', groq?, mistral?, cloudflare?, cfAccount?, openrouter? } → tus llaves (Prime, ZFlow y Symmetrix: cada uno las suyas)
   POST { action:'delkey', id }              → quitar una llave de la lista (la tuya; Prime/ZFlow cualquiera menos las de Vercel)
   POST { action:'check' }                     → probar llaves (Prime/ZFlow todas; Symmetrix solo las suyas)
   POST { action:'now', text }                 → «Qué estamos arreglando ahora» (equipo); SynthonIA lo cuenta a quien pregunte
   POST { action:'limit', dayLimit }           → tope de SynXCoin's al día por persona (Prime/ZFlow)
   POST { action:'google', clientId }          → «ID de cliente» de Google para entrar con Google y Drive (Prime/ZFlow)
   POST { action:'drive', clientId }           → (opcional) otro ID solo para Drive (Prime/ZFlow)
   POST { action:'users' | 'user' | 'uset' | 'ublock', … } → Pulsem › Usuarios: permisos y límites por persona (ver api/_usuarios.js)
   POST { action:'start' } / { action:'chat', token, messages } → prueba de la guía (5 mensajes), ahora con la IA de SymphorIA
   Reglas: cero cobros (solo modelos gratis y topes propios), las llaves nunca salen del servidor. */
import { route, body, json, fail, auth, redis, pipe, getJ, setJ, rid, limit, today, str, roleOf, sha, sbOn, sbAccount, sbProfile, sbPrefs, sbChats, ipOf } from './_lib.js';
import { CID_RX } from './config.js';
import { usersAction, USERS_ACTIONS } from './_usuarios.js';
import { loadKeys, saveOwnerKeys, removeKey, status, checkKey, settings, saveSettings, chat, models, ownersRaw, mask, ORDER, PROV, KEY_PROVS, provName } from './_pool.js';

export const TRIAL_MAX = 5;
const TRIAL_PER_TURN = 6;   /* respuesta + «Continúa» + arreglo automático del código, en un mismo mensaje */
const RANK = { owner:'Prime', admin:'ZFlow', staff:'Symmetrix' };
const GLOBAL_DAY = +process.env.TRIAL_DAY_CAP || 300;
const SYSTEM = 'Eres el asistente de la prueba guiada de SynthFlow (SymphorIA). Responde en español, claro y amable, en menos de 120 palabras. Si te preguntan por SymphorIA: es un espacio para hablar gratis con muchas IA, compararlas y ver cuánto consumen.';
const err = (s, m, code) => Object.assign(new Error(m), { status:s, code });
const team = me => roleOf(me) !== 'user', boss = me => ['owner', 'admin'].includes(roleOf(me));

/* para SynthonIA (ayudante): una respuesta corta con la IA de SymphorIA (cuenta en su propio tope) */
export async function trialComplete(messages, maxTokens = 320, who = 'helper', opts = {}){
  const r = await chat({ who:'h:' + who, ipKey:'h:' + who, messages, model:'sz:auto', maxTokens, stream:false, temperature:Number.isFinite(+opts.temperature) ? +opts.temperature : .6 });
  return { text:r.text, via:r.meta.provName };
}

export default route({
  async GET(req){
    const me = await auth(req);
    if (!team(me)) return fail(403, 'Solo el equipo de SymphorIA puede ver esto.');
    const [st, set, owners, cat, gg, dv] = await Promise.all([status(), settings(), ownersRaw(), models(false).catch(() => ({ list:[], provs:[] })), getJ('cfg:google'), getJ('cfg:drive')]);
    const mine = owners[me.sub] || { keys:{} };
    const genv = (process.env.GOOGLE_CLIENT_ID || '').trim(), denv = (process.env.GOOGLE_DRIVE_CLIENT_ID || '').trim();
    const [mt, nw] = await Promise.all([getJ('cfg:maint').catch(() => null), getJ('cfg:now').catch(() => null)]);
    return json({ rank:RANK[roleOf(me)], canEdit:boss(me), maint:mt || { on:false }, now:nw || null, dayLimit:set.dayLimit,
      keys:st.map(k => Object.assign(k, { mine:!!(k.owner && k.owner.sub === me.sub) })),
      mine:Object.fromEntries(KEY_PROVS.map(p => [p, mine.keys && mine.keys[p] ? 'guardada' : ''])), cfAccount:mine.cfAccount || '',
      models:{ n:cat.list.length, byProv:ORDER.map(p => ({ id:p, name:PROV[p].name, n:cat.list.filter(m => m.prov === p).length })) }, imgDay:set.imgDay,
      google:{ clientId:genv || (gg && gg.clientId) || '', source:genv ? 'vercel' : gg && gg.clientId ? 'panel' : '' },
      drive:{ clientId:denv || (dv && dv.clientId) || '', source:denv ? 'vercel' : dv && dv.clientId ? 'panel' : '' } });
  },
  async POST(req){
    const ip = ipOf(req), b = await body(req, 600_000), a = b.action;

    /* v4.4 · Pulsem › Usuarios: el equipo ve; solo Prime y ZFlow cambian (se revisa otra vez dentro de usersAction) */
    if (USERS_ACTIONS.has(a)){
      const me = await auth(req);
      if (!team(me)) return fail(403, 'Solo el equipo de SymphorIA puede ver esto.');
      await limit('trial-users:' + me.sub, 120, 600);
      return json(await usersAction(me, b));
    }

    if (a === 'delkey'){
      const me = await auth(req);
      if (!team(me)) return fail(403, 'Solo el equipo de SymphorIA puede quitar llaves.');
      await limit('trial-admin:' + me.sub, 30, 600);
      const r = await removeKey(str(b.id, 24), me, boss(me));
      return r.ok ? json({ ok:true, prov:r.prov }) : fail(r.status, r.error);
    }
    if (a === 'keys' || a === 'check'){
      const me = await auth(req);
      if (!team(me)) return fail(403, 'Solo el equipo de SymphorIA puede agregar llaves.');
      await limit('trial-admin:' + me.sub, 30, 600);
      const patch = {};
      if (a === 'keys'){
        KEY_PROVS.forEach(p => { if (typeof b[p] === 'string') patch[p] = str(b[p], 300); }); if (typeof b.cfAccount === 'string') patch.cfAccount = str(b.cfAccount, 64);
        await saveOwnerKeys(me, RANK[roleOf(me)], patch);
      }
      /* se prueban solo las que tocaste (al guardar) o la que pediste; «Probar todas» solo Prime y ZFlow */
      const only = typeof b.id === 'string' ? b.id : '', provs = Object.keys(patch).filter(p => KEY_PROVS.includes(p) && patch[p]);
      const keys = (await loadKeys()).filter(k => (boss(me) || (k.owner && k.owner.sub === me.sub)) && (only ? k.id === only : a === 'keys' ? k.owner && k.owner.sub === me.sub && (provs.includes(k.prov) || (patch.cfAccount != null && k.prov === 'cloudflare')) : true));
      const res = await Promise.all(keys.map(async k => Object.assign({ id:k.id, prov:k.prov, provName:provName(k.prov), key:mask(k.key), owner:k.owner }, await checkKey(k))));
      await redis('DEL', 'pool:models');
      return json({ ok:true, keys:res });
    }
    if (a === 'maint'){
      const me = await auth(req); if (!boss(me)) return fail(403, 'Solo Prime y ZFlow pueden poner el aviso de mantenimiento.');
      const on = !!b.on; const cur = { on, text:String(b.text || '').trim().slice(0, 300) || 'Estamos presentando fallas o actualizaciones. Espera un momento.', t:Date.now(), by:RANK[roleOf(me)] || 'equipo' };
      await setJ('cfg:maint', cur);
      return json({ ok:true, maint:cur });
    }
    /* v3.7 · «Qué estamos arreglando ahora»: el equipo lo escribe y SynthonIA se lo cuenta a quien pregunte (vacío = se borra) */
    if (a === 'now'){
      const me = await auth(req); if (!team(me)) return fail(403, 'Solo el equipo de SymphorIA puede escribir esto.');
      await limit('trial-admin:' + me.sub, 30, 600);
      const text = String(b.text || '').replace(/\s+/g, ' ').trim().slice(0, 300);
      if (!text){ await redis('DEL', 'cfg:now'); return json({ ok:true, now:null }); }
      const cur = { text, t:Date.now(), by:RANK[roleOf(me)] || 'equipo' };
      await setJ('cfg:now', cur);
      return json({ ok:true, now:cur });
    }
    if (a === 'limit'){
      const me = await auth(req); if (!boss(me)) return fail(403, 'Solo Prime y ZFlow pueden cambiar el tope.');
      const sv = await saveSettings(Object.assign({}, b.dayLimit != null ? { dayLimit:b.dayLimit } : {}, b.imgDay != null ? { imgDay:b.imgDay } : {}));
      return json({ ok:true, dayLimit:sv.dayLimit, imgDay:sv.imgDay });
    }
    /* copiar todo lo que hay en Redis a Supabase (una vez, o cuando el dueño quiera). Por tandas para no pasar el tiempo de Vercel */
    if (a === 'sbsync'){
      const me = await auth(req); if (roleOf(me) !== 'owner') return fail(403, 'Solo Prime puede hacer esto.');
      if (!sbOn()) return fail(400, 'Primero pon la llave secreta de Supabase en Vercel (SUPABASE_SECRET_KEY) y vuelve a publicar.');
      const r = await redis('SCAN', String(+b.cursor || 0), 'MATCH', 'u:*', 'COUNT', '40'); const next = r[0], ks = r[1] || [];
      let n = 0, chats = 0;
      for (const k of ks){
        const u = await getJ(k); if (!u || !u.sub) continue; n++;
        await sbAccount(u);
        const [p, pr] = await Promise.all([getJ('p:' + u.sub), getJ('pr:' + u.sub)]);
        if (p) await sbProfile(u.sub, p); if (pr) await sbPrefs(u.sub, pr);
        const flat = await redis('HGETALL', 'c:' + u.sub) || [], items = [];
        for (let i = 0; i + 1 < flat.length; i += 2){ try{ items.push({ k:flat[i], data:JSON.parse(flat[i + 1]) }); }catch(e){} }
        for (let i = 0; i < items.length; i += 20) await sbChats(u.sub, items.slice(i, i + 20), []);
        chats += items.length;
      }
      return json({ ok:true, cursor:next, done:next === '0', accounts:n, chats });
    }
    /* Google (entrar con Google y Drive): el «ID de cliente» es público; no hay secretos */
    if (a === 'google' || a === 'drive'){
      const me = await auth(req); if (!boss(me)) return fail(403, 'Solo Prime y ZFlow pueden cambiar esto.');
      await limit('trial-admin:' + me.sub, 30, 600);
      const id = str(b.clientId || '', 120).trim();
      if (id && !CID_RX.test(id)) return fail(400, 'Ese no parece un «ID de cliente» de Google. Termina en .apps.googleusercontent.com');
      await setJ(a === 'google' ? 'cfg:google' : 'cfg:drive', id ? { clientId:id, by:me.sub, t:Date.now() } : {});
      return json({ ok:true, clientId:id });
    }

    /* prueba de la guía: 5 mensajes con la IA de SymphorIA (sigue existiendo para la Guía Asistida) */
    if (a === 'start'){
      if (!(await loadKeys()).length) throw err(503, 'La prueba todavía no está activada. Mientras tanto, conecta Puter: es gratis y con un clic.', 'trial_off');
      await limit('trial-start:' + ip, 3, 86400);
      const token = rid(18);
      await redis('SET', 'tr:' + token, '0', 'EX', String(7 * 86400));
      return json({ token, left:TRIAL_MAX, max:TRIAL_MAX });
    }
    if (a === 'chat'){
      const token = typeof b.token === 'string' && /^[\w-]{20,40}$/.test(b.token) ? b.token : '';
      if (!token || !(await redis('EXISTS', 'tr:' + token))) throw err(403, 'Tu prueba no es válida. Vuelve a abrir la guía para empezar una.', 'trial_bad');
      await limit('trial-ip:' + ip, 40, 86400);   /* 5 mensajes × hasta 6 llamadas cada uno (Continúa, arreglo del código) */
      const d = today();
      /* v3.6 · un mensaje de prueba = lo que escribes una vez. Si la IA sigue una respuesta larga («Continúa») o arregla sola
         el código que hizo, es el mismo mensaje (mismo `turn`): no se gasta otro a escondidas. Hasta TRIAL_PER_TURN llamadas por mensaje. */
      const turn = /^[\w|-]{4,60}$/.test(String(b.turn || '')) ? String(b.turn) : '';
      const tk = 'trt:' + token;
      const again = turn ? +(await redis('SISMEMBER', tk, turn)) : 0;
      if (again){
        const c = +(await redis('INCR', 'trc:' + token + ':' + turn)); await redis('EXPIRE', 'trc:' + token + ':' + turn, String(7 * 86400));
        if (c > TRIAL_PER_TURN) throw err(429, 'Este mensaje ya usó todas sus respuestas automáticas. Escribe otro para seguir.', 'trial_turn');
      }
      const [n, g] = again ? [+(await redis('GET', 'tr:' + token)) || 0, 0]
        : await pipe([['INCR', 'tr:' + token], ['INCR', 'trial:day:' + d], ['EXPIRE', 'trial:day:' + d, '172800']]);
      if (!again && turn) await pipe([['SADD', tk, turn], ['EXPIRE', tk, String(7 * 86400)], ['SET', 'trc:' + token + ':' + turn, '1', 'EX', String(7 * 86400)]]);
      const giveBack = () => again ? Promise.resolve() : pipe([['DECR', 'tr:' + token], ['DECR', 'trial:day:' + d], ...(turn ? [['SREM', tk, turn]] : [])]).catch(() => {});
      if (+n > TRIAL_MAX){ await giveBack(); throw err(429, 'Se acabaron tus ' + TRIAL_MAX + ' mensajes de prueba. Ya puedes seguir chateando gratis.', 'trial_done'); }
      if (+g > GLOBAL_DAY){ await giveBack(); throw err(503, 'La prueba ya se usó mucho hoy. Puedes seguir chateando normal.', 'trial_busy'); }
      const msgs = (Array.isArray(b.messages) ? b.messages : []).filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-10).map(m => ({ role:m.role, content:m.content.slice(0, 3000) }));
      if (!msgs.length || msgs[msgs.length - 1].role !== 'user'){ await giveBack(); throw err(400, 'Escribe un mensaje para la prueba.'); }
      let r;
      try{ r = await chat({ who:'t:' + sha(token).slice(0, 16), ipKey:'ip:' + sha('ip:' + ip).slice(0, 16), messages:msgs, model:'sz:auto', maxTokens:450, system:SYSTEM, stream:true }); }
      catch(e){ await giveBack(); throw e.code === 'sz_off' ? err(503, 'La prueba todavía no está activada. Mientras tanto, conecta Puter: es gratis y con un clic.', 'trial_off') : e.code === 'sz_down' ? err(503, 'Las IA de la prueba no responden ahora mismo. Intenta en un rato o conecta Puter, que es gratis.', 'trial_down') : e; }
      return new Response(r.stream, { status:200, headers:{ 'content-type':'text/event-stream; charset=utf-8', 'cache-control':'no-store', 'x-trial-left':String(Math.max(0, TRIAL_MAX - n)), 'x-trial-spent':again ? '0' : '1', 'x-trial-provider':r.meta.provName, 'access-control-expose-headers':'x-trial-left,x-trial-provider,x-trial-spent' } });
    }
    return fail(400, 'Acción desconocida.');
  }
});
