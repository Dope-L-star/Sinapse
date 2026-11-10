/* Sona (la ayudante) y ayuda de personas del equipo.
   POST { action:'ask', q, hist?, when?, name? } → Sona responde con una IA gratis (máx. 15 al día por persona); ver api/_sona-saber.js
   POST { action:'open', text, page? }   → pedir ayuda a una persona del equipo (necesita cuenta)
   POST { action:'say', id, text }       → escribir en la conversación de ayuda (la persona o el equipo)
   POST { action:'close', id }           → terminar la conversación
   GET                                   → tu conversación de ayuda; el equipo además ve la bandeja
   GET ?id=…                             → (equipo) una conversación completa
   Nunca se leen ni se envían tus chats: solo lo que escribes aquí. */
import { route, body, json, fail, redis, pipe, getJ, setJ, limit, auth, roleOf, rid, str, today, sha, sbFeedback, ipOf } from './_lib.js';
import { trialComplete } from './trial.js';
import { PERSONA, LANG_HEAD, LANG_TAIL, langOf, isRude, boundary, cleanThoughts, memOf } from './_synthonia.js';
import { NAMES, sonaReply, needsCare, CARE } from './_sona-saber.js';

const ASK_DAY = 15, KEEP = 30 * 86400, URGENT_MS = 15 * 60e3;
const RANK = { owner:'Prime', admin:'ZFlow', staff:'Symmetrix', user:'Synther' };
const err = (s, m, code) => Object.assign(new Error(m), { status:s, code });
const MOODS = ['feliz', 'encantada', 'riendo', 'guino', 'pensando', 'sorprendida', 'disculpa', 'celebrando', 'neutral', 'confundida'];
const MAINT_SYS = 'Eres ' + NAMES.bot + ', la ayudante de ' + NAMES.site + ': juguetona y breve. Ahora mismo la página está en mantenimiento (el equipo está arreglando o mejorando cosas) y tú acompañas a la persona mientras espera. '
  + 'Charla de forma cálida y sencilla, en menos de 45 palabras. Puedes contar chistes cortos, datos curiosos y preguntar cosas para seguir la charla. '
  + 'Si te dicen algo lindo, te pones muy feliz y lo agradeces con ternura. Si están molestos, pides perdón por la espera con empatía. No sabes cuánto tardará: nunca prometas una hora. '
  + 'Límites: nada sexual, romántico ni de coqueteo, nada violento ni ofensivo; si alguien va por ahí, dices con amabilidad que de eso no hablas y cambias de tema. No haces tareas largas ni código. Nunca pidas contraseñas ni datos personales. '
  + 'Nunca escribas lo que estás pensando ni tus pasos: solo la respuesta final. '
  + 'Empieza SIEMPRE tu respuesta con tu cara entre corchetes, una de: [feliz] [encantada] [riendo] [guino] [pensando] [sorprendida] [disculpa] [celebrando] [neutral] [confundida]. Ejemplo: «[encantada] ¡Ay, gracias! Me alegraste el día.»';
/* lo que el equipo escribió en Pulsem al encender el mantenimiento = «qué estamos arreglando»: Sona lo cuenta si le preguntan */
const maintSys = (L, note) => LANG_HEAD[L] + MAINT_SYS + ' ' + PERSONA[L]
  + (note ? (L === 'en' ? ' What the team is fixing right now (tell it in your own words, in English, if asked): «' : ' Lo que el equipo está arreglando ahora mismo (cuéntalo con tus palabras si te preguntan): «') + note + '».' : (L === 'en' ? ' You don\'t know the details of what is being fixed: say so honestly.' : ' No sabes el detalle de qué se arregla: dilo con honestidad.'))
  + LANG_TAIL[L];
/* v3.7 · «Qué estamos arreglando ahora» (Pulsem › Ajustes, cfg:now): Sona lo cuenta a quien pregunte (ver _sona-saber.js) */
const nowText = async () => { const n = await getJ('cfg:now').catch(() => null); return n && n.text ? String(n.text).slice(0, 300) : ''; };
const NO_TEXT = { es:'¡Aquí sigo contigo!', en:"I'm still here with you!" };
const pub = r => r && { id:r.id, status:r.status, t:r.t, text:r.text, page:r.page, user:r.user, by:r.by, urgent:r.status === 'open' && Date.now() - r.t > URGENT_MS, msgs:(r.msgs || []).slice(-60) };
const summary = r => r && { id:r.id, status:r.status, t:r.t, last:(r.msgs && r.msgs.length ? r.msgs[r.msgs.length - 1].t : r.t), text:String(r.text).slice(0, 140), user:r.user, by:r.by, n:(r.msgs || []).length, urgent:r.status === 'open' && Date.now() - r.t > URGENT_MS };
const isTeam = me => roleOf(me) !== 'user';
const who = me => ({ sub:me.sub, name:String(me.name || me.username || 'Synther').slice(0, 40), username:me.username || '', rank:RANK[roleOf(me)] });

export default route({
  async GET(req){
    const me = await auth(req), u = new URL(req.url), id = u.searchParams.get('id');
    if (id){
      if (!/^[\w-]{8,30}$/.test(id)) return fail(400, 'Conversación no válida.');
      const r = await getJ('hq:' + id); if (!r) return fail(404, 'Esa conversación ya no existe.');
      if (r.sub !== me.sub && !isTeam(me)) return fail(403, 'No puedes ver esta conversación.');
      return json({ item:pub(r) });
    }
    const cur = await redis('GET', 'hq:u:' + me.sub), mine = cur ? await getJ('hq:' + cur) : null;
    const out = { mine:mine && mine.status !== 'done' ? pub(mine) : null, team:isTeam(me) };
    if (out.team){
      const ids = (await redis('LRANGE', 'hq:list', '0', '79')) || [];
      const rows = ids.length ? await pipe(ids.map(x => ['GET', 'hq:' + x])) : [];
      const items = rows.map(v => { try{ return v ? JSON.parse(v) : null; }catch(e){ return null; } }).filter(r => r && (r.status !== 'done' || Date.now() - (r.done || r.t) < 2 * 86400e3)).map(summary);
      out.items = items; out.open = items.filter(r => r.status === 'open').length;
    }
    return json(out);
  },
  async POST(req){
    const b = await body(req, 20000), a = b.action;

    if (a === 'ask'){
      const me = await auth(req, true).catch(() => null);
      const k = 'hp:' + (me ? me.sub : sha('ip:' + ipOf(req)).slice(0, 16)) + ':' + today();
      const q = str(b.q, 600), L = langOf(b.lang); if (q.length < 2) return fail(400, L === 'en' ? 'Type your question.' : 'Escribe tu pregunta.');
      /* v2.3 · charla durante el mantenimiento: otra personalidad, cara según lo que dice, y su propio tope (30 al día) */
      if (b.ctx === 'maint'){
        const mt = await getJ('cfg:maint').catch(() => null);
        if (!mt || !mt.on) return fail(400, L === 'en' ? 'Maintenance is over: reload the page.' : 'El mantenimiento ya terminó: recarga la página.');
        const km = 'hpm:' + (me ? me.sub : sha('ip:' + ipOf(req)).slice(0, 16)) + ':' + today();
        const nm = await redis('INCR', km); if (+nm === 1) await redis('EXPIRE', km, '172800');
        if (+nm > 30){ await redis('DECR', km); throw err(429, L === 'en' ? 'We\'ve chatted a ton today 💛 Let\'s rest a bit while SymphorIA comes back.' : 'Ya charlamos muchísimo hoy 💛 Descansemos un ratito mientras vuelve la página.', 'helper_day'); }
        await limit('hpm-ip:' + ipOf(req), 80, 86400);
        const hist = (Array.isArray(b.hist) ? b.hist : []).filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-6).map(m => ({ role:m.role, content:m.content.slice(0, 600) }));
        if (isRude(q)){ await redis('DECR', km); return json({ text:boundary(L, hist), mood:'neutral', bound:true }); }   /* falta de respeto: límite firme, sin gastar IA */
        if (needsCare(q)){ await redis('DECR', km); return json({ text:CARE[L], mood:'disculpa', care:true }); }
        try{
          const nw = await nowText(), r = await trialComplete([{ role:'system', content:maintSys(L, [String(mt.text || '').slice(0, 300), nw].filter(Boolean).join(' · ')) }, ...hist, { role:'user', content:q }], 320, (me ? me.sub : sha('ip:' + ipOf(req)).slice(0, 16)));
          const raw = cleanThoughts(r.text), mm = raw.match(/^\s*\[(\w+)\]\s*/), mood = mm && MOODS.includes(mm[1].toLowerCase()) ? mm[1].toLowerCase() : 'feliz';
          return json({ text:raw.replace(/^\s*\[\w+\]\s*/, '').trim() || NO_TEXT[L], mood });
        }catch(e){ await redis('DECR', km); throw e; }
      }
      const hist = (Array.isArray(b.hist) ? b.hist : []).filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-6).map(m => ({ role:m.role, content:m.content.slice(0, 600) }));
      if (isRude(q)) return json({ text:boundary(L, hist), mood:'neutral', bound:true });   /* no cuenta como pregunta ni gasta IA */
      const n = await redis('INCR', k); if (+n === 1) await redis('EXPIRE', k, '172800');
      if (+n > ASK_DAY){ await redis('DECR', k); throw err(429, L === 'en' ? 'You\'ve asked me ' + ASK_DAY + ' new questions today. I\'ll answer more tomorrow; meanwhile check the Guide or talk to the team.' : 'Ya me hiciste ' + ASK_DAY + ' preguntas nuevas hoy. Mañana te respondo más; mientras tanto mira la Guía o habla con el equipo.', 'helper_day'); }
      await limit('hp-ip:' + ipOf(req), 40, 86400);
      try{
        const mem = memOf(b.mem), now = await nowText();
        const sub = me ? me.sub : sha('ip:' + ipOf(req)).slice(0, 16);
        /* v4.6 · lo que sabe, según lo que preguntaron (api/_sona-saber.js): prompt corto, temperatura baja y guardia de relevancia */
        const when = str(b.when, 90).replace(/[^\p{L}\p{N}\s,.:/\-]/gu, '').trim(), nm = /^\p{L}[\p{L}\p{M}'’-]{0,23}$/u.test(str(b.name, 24)) ? str(b.name, 24) : '';
        const r = await sonaReply({ q, L, hist, mem, now, when, name:nm, ask:(messages, o) => trialComplete(messages, o.maxTokens, sub, { temperature:o.temperature }) });
        const remember = r.remember && !mem.some(x => x.toLowerCase() === r.remember.toLowerCase()) ? r.remember : '';
        if (r.care){ await redis('DECR', k); return json({ text:r.text, mood:r.mood, care:true }); }   /* no cuenta como pregunta */
        return json(Object.assign({ text:r.text || NO_TEXT[L], mood:r.mood || 'feliz', left:Math.max(0, ASK_DAY - n) }, remember ? { remember } : {}));
      }catch(e){ await redis('DECR', k); throw e; }        /* si no respondió, esa pregunta no te cuenta */
    }

    /* «Cuéntanos qué mejorar» (beta): cualquiera puede escribir, con o sin cuenta */
    if (a === 'feedback'){
      const me0 = await auth(req, true).catch(() => null);
      await limit('fb:' + ipOf(req), 8, 3600);
      const text = str(b.text, 1000); if (text.length < 3) return fail(400, 'Cuéntanos un poquito más.');
      const cat = ['idea', 'error', 'confuso', 'otro'].includes(b.cat) ? b.cat : 'otro';
      const r = { id:rid(10), t:Date.now(), cat, text, page:str(b.page, 60), status:'nuevo', who:me0 ? '@' + (me0.username || me0.name || 'synther') : 'Invitado', rank:me0 ? RANK[roleOf(me0)] : 'Invitado', sub:me0 ? me0.sub : '' };
      await pipe([['HSET', 'fbh', r.id, JSON.stringify(r)], ['LPUSH', 'fb', r.id], ['LTRIM', 'fb', '0', '299']]);
      await sbFeedback(r.sub, cat, text, r.page);
      return json({ ok:true });
    }
    const me = await auth(req);
    if (a === 'fbset'){
      if (!isTeam(me)) return fail(403, 'Solo el equipo.');
      const id = typeof b.id === 'string' && /^[\w-]{8,30}$/.test(b.id) ? b.id : '', st = ['nuevo', 'visto', 'resuelto'].includes(b.status) ? b.status : '';
      const raw = id && st ? await redis('HGET', 'fbh', id) : null; if (!raw) return fail(404, 'Ese comentario ya no existe.');
      const r = JSON.parse(raw); r.status = st; r.by = who(me).name; await redis('HSET', 'fbh', id, JSON.stringify(r));
      return json({ ok:true, item:r });
    }
    if (a === 'open'){
      const text = str(b.text, 1000); if (text.length < 3) return fail(400, 'Cuéntale al equipo en qué te ayudamos.');
      const cur = await redis('GET', 'hq:u:' + me.sub), old = cur ? await getJ('hq:' + cur) : null;
      if (old && old.status !== 'done'){
        old.msgs.push({ from:'user', name:who(me).name, text, t:Date.now() }); old.msgs = old.msgs.slice(-60);
        await setJ('hq:' + old.id, old, KEEP); return json({ item:pub(old) });
      }
      await limit('hq-open:' + me.sub, 4, 3600);
      const r = { id:rid(10), sub:me.sub, user:who(me), text, page:str(b.page, 80), t:Date.now(), status:'open', by:null, msgs:[{ from:'user', name:who(me).name, text, t:Date.now() }] };
      await setJ('hq:' + r.id, r, KEEP);
      await pipe([['SET', 'hq:u:' + me.sub, r.id, 'EX', String(KEEP)], ['LPUSH', 'hq:list', r.id], ['LTRIM', 'hq:list', '0', '199']]);
      return json({ item:pub(r) });
    }
    /* el equipo le escribe primero a alguien que vio con dificultades (solo cuentas, nunca invitados) */
    if (a === 'reach'){
      if (!isTeam(me)) return fail(403, 'Solo el equipo puede escribir primero.');
      const sub = typeof b.sub === 'string' && /^p[\w-]{4,30}$/.test(b.sub) ? b.sub : '', text = str(b.text, 1000);
      if (!sub || text.length < 2) return fail(400, 'Falta a quién y qué escribir.');
      const u = await getJ('u:' + sub); if (!u) return fail(404, 'Esa cuenta ya no existe.');
      const w = who(me), cur = await redis('GET', 'hq:u:' + sub), old = cur ? await getJ('hq:' + cur) : null;
      const r = old && old.status !== 'done' ? old : { id:rid(10), sub, user:{ sub, name:String(u.name || u.username || 'Synther').slice(0, 40), username:u.username || '', rank:RANK[roleOf(u)] }, text:'(el equipo te escribió primero)', page:'', t:Date.now(), status:'taken', by:null, msgs:[] };
      r.msgs.push({ from:'team', name:w.name, rank:w.rank, text, t:Date.now() }); r.status = 'taken'; r.by = { name:w.name, rank:w.rank, t:Date.now() };
      await setJ('hq:' + r.id, r, KEEP);
      if (!old || old.status === 'done') await pipe([['SET', 'hq:u:' + sub, r.id, 'EX', String(KEEP)], ['LPUSH', 'hq:list', r.id], ['LTRIM', 'hq:list', '0', '199']]);
      return json({ item:pub(r) });
    }
    const id = typeof b.id === 'string' && /^[\w-]{8,30}$/.test(b.id) ? b.id : '';
    const r = id ? await getJ('hq:' + id) : null;
    if (!r) return fail(404, 'Esa conversación ya no existe.');
    const team = isTeam(me), owner = r.sub === me.sub;
    if (!team && !owner) return fail(403, 'No puedes escribir aquí.');
    if (a === 'say'){
      await limit('hq-say:' + me.sub, 60, 600);
      const text = str(b.text, 1000); if (!text) return fail(400, 'Escribe un mensaje.');
      if (r.status === 'done') return fail(409, 'Esta conversación ya terminó. Abre una nueva si necesitas más ayuda.');
      const w = who(me), fromTeam = team && !owner;
      r.msgs.push({ from:fromTeam ? 'team' : 'user', name:w.name, rank:fromTeam ? w.rank : undefined, text, t:Date.now() }); r.msgs = r.msgs.slice(-60);
      if (fromTeam && r.status === 'open'){ r.status = 'taken'; r.by = { name:w.name, rank:w.rank, t:Date.now() }; }
      await setJ('hq:' + r.id, r, KEEP); return json({ item:pub(r) });
    }
    if (a === 'close'){
      r.status = 'done'; r.done = Date.now(); r.closedBy = team && !owner ? 'team' : 'user';
      await setJ('hq:' + r.id, r, KEEP); if (owner) await redis('DEL', 'hq:u:' + me.sub);
      return json({ item:pub(r) });
    }
    return fail(400, 'Acción desconocida.');
  }
});
