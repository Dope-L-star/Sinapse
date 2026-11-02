/* IA de SymphorIA para todos (beta 2)
   GET                       → { models, provs, limit, used } modelos gratis disponibles y lo que llevas hoy
   POST { messages, model?, maxTokens? } → respuesta en vivo (streaming), con el gasto al final
   Sin cuenta también funciona: se cuenta por dispositivo y por conexión. */
import { route, body, json, fail, auth, sha, redis, pipe, today, ipOf, limit, str, roleOf } from './_lib.js';
import { models, chat, reviewerModel, settings, usedToday, PROV, IMG, pickKeys, markPay, clearPay, outage, classify, searchWith, searchWiki, PAY_RX } from './_pool.js';

/* v2.0 · imágenes con Pollinations: solo con cuenta, con su propio límite diario (no gasta Puter ni tu límite de chat).
   Solo gasta el saldo que ya esté cargado en Pollinations: nunca cobra a una tarjeta. */
const IMG_GLOBAL = +process.env.SYNTHZ_IMG_GLOBAL || 150;
/* v2.1 · «Buscar en internet»: Tavily o Exa (gratis, sin tarjeta) y, si no hay, Wikipedia. Cuenta en su propio límite */
const SEARCH_GLOBAL = +process.env.SYNTHZ_SEARCH_GLOBAL || 300;
async function webSearch(req, me, who, b){
  const q = str(b.q, 300); if (q.length < 2) throw Object.assign(new Error('Escribe qué quieres buscar.'), { status:400, code:'s_empty' });
  const team = me && roleOf(me) !== 'user', max = team ? 5000 : me ? 30 : 3, d = today();   /* v3.0: el equipo, sin límite propio (solo el tope de todos) */
  await limit('srch:' + who, 10, 60);
  const uk = 'srch:' + who + ':' + d, gk = 'srch:all:' + d;
  const [n, g] = (await pipe([['GET', uk], ['GET', gk]])).map(x => +x || 0);
  if (n >= max) throw Object.assign(new Error(me ? 'Ya hiciste tus ' + max + ' búsquedas en internet de hoy. Mañana tienes más.' : 'Sin cuenta puedes buscar en internet ' + max + ' veces al día. Entra (es gratis) para buscar más.'), { status:429, code:me ? 's_limit' : 's_guest' });
  let res = [], via = 'internet';
  if (g < SEARCH_GLOBAL){
    for (const prov of ['tavily', 'exa']){
      for (const k of (await pickKeys(prov)).slice(0, 2)){
        try{ res = await searchWith(k, q, 6); await pipe([['INCR', 'pk:n:' + k.id + ':' + d], ['EXPIRE', 'pk:n:' + k.id + ':' + d, '172800']]); if (res.length) break; }
        catch(e){
          const s = e.status || 0; console.error('[synthz] búsqueda', prov, s ? classify(s) : 'sin respuesta');
          if (s === 402 || ((s === 401 || s === 403) && PAY_RX.test(e.txt || ''))) await markPay(k, s, e.txt || '');
          await redis('SET', 'pk:down:' + k.id, s === 432 ? 'se acabaron las búsquedas gratis del mes' : s ? classify(s) : 'sin respuesta', 'EX', s === 432 ? '21600' : '600').catch(() => {});
        }
      }
      if (res.length) break;
    }
  }
  if (!res.length){ res = await searchWiki(q, 4).catch(() => []); via = 'wikipedia'; }
  res = res.filter(x => /^https?:\/\//.test(x.u)).slice(0, 6);
  await pipe([['INCR', uk], ['EXPIRE', uk, '172800'], ['INCR', gk], ['EXPIRE', gk, '172800']]);
  return json({ results:res, via, left:Math.max(0, max - n - 1) });
}
async function makeImage(req, me, b){
  if (!me) throw Object.assign(new Error('Para crear imágenes entra a tu cuenta (es gratis).'), { status:401, code:'img_login' });
  const set = await settings(), d = today(), team = roleOf(me) !== 'user';
  const max = team ? 5000 : set.imgDay;   /* v3.0: el equipo, sin límite propio (solo el tope de todos, IMG_GLOBAL) */
  if (!max) throw Object.assign(new Error('Crear imágenes está pausado por ahora.'), { status:403, code:'img_off' });
  await limit('img:' + me.sub, 6, 60);
  const prompt = str(b.prompt, 600); if (prompt.length < 3) throw Object.assign(new Error('Describe la imagen que quieres.'), { status:400, code:'img_empty' });
  const uk = 'img:' + me.sub + ':' + d, gk = 'img:all:' + d;
  const [n, g] = (await pipe([['GET', uk], ['GET', gk]])).map(x => +x || 0);
  if (n >= max) throw Object.assign(new Error('Ya creaste tus ' + max + ' imágenes de hoy. Mañana tienes más.'), { status:429, code:'img_limit' });
  if (g >= IMG_GLOBAL) throw Object.assign(new Error('Hoy ya se crearon muchas imágenes. Vuelve mañana.'), { status:429, code:'img_busy' });
  const keys = (await pickKeys('pollinations')).slice(0, 2);
  if (!keys.length) throw Object.assign(new Error('Crear imágenes todavía no está listo. Vuelve pronto.'), { status:503, code:'img_off' });
  const W = [512, 768, 1024].includes(+b.w) ? +b.w : 1024, Hh = [512, 768, 1024].includes(+b.h) ? +b.h : 1024;
  for (const k of keys){
    let r;
    try{
      r = await fetch(IMG.pollinations.base() + '/image/' + encodeURIComponent(prompt) + '?model=flux&width=' + W + '&height=' + Hh + '&nologo=true&private=true&safe=true&seed=' + Math.floor(Math.random() * 1e9),
        { headers:{ Authorization:'Bearer ' + k.key }, signal:AbortSignal.timeout(60000) });
    }catch(e){ r = null; }
    if (r && r.ok && /^image\//.test(r.headers.get('content-type') || '')){
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > 6_000_000) continue;
      await pipe([['INCR', uk], ['EXPIRE', uk, '172800'], ['INCR', gk], ['EXPIRE', gk, '172800'], ['INCR', 'pk:n:' + k.id + ':' + d], ['EXPIRE', 'pk:n:' + k.id + ':' + d, '172800'], ['DEL', 'pk:plan:' + k.id]]);
      await clearPay(k);
      return json({ img:'data:' + r.headers.get('content-type').split(';')[0] + ';base64,' + buf.toString('base64'), left:Math.max(0, max - n - 1), max });
    }
    const s = r ? r.status : 0, txt = r ? await r.text().catch(() => '') : '';
    console.error('[synthz] imagen', k.id, s ? classify(s) : 'sin respuesta');
    if (s === 402 || ((s === 401 || s === 403) && /pollen|balance|credit|pay|tier/i.test(txt))) await markPay(k, s || 402, txt);
    await redis('SET', 'pk:down:' + k.id, s ? classify(s) : 'sin respuesta', 'EX', s === 402 ? '3600' : '300').catch(() => {});
  }
  throw Object.assign(new Error('No pude crear la imagen ahora. Intenta en un rato.'), { status:503, code:'img_down' });
}

/* ---------- v3.4 · revisión de calidad ----------
   Otra IA (la que mejor razona entre las gratis) lee la pregunta, las fotos y el borrador de la respuesta.
   Si está bien dice OK; si tiene errores de lógica, cálculos, datos o le falta algo, devuelve la respuesta corregida completa.
   Las instrucciones viven aquí (no en el navegador) para que nadie las cambie. */
const REVIEW_SYS = [
  'Eres el revisor de calidad de SymphorIA, un experto exigente en lógica, matemáticas, ciencia, programación y redacción.',
  'Otra IA escribió un BORRADOR de respuesta para una persona. Compruébalo en silencio, paso a paso:',
  '1) ¿Responde exactamente lo que la persona pidió, completo, sin irse por las ramas?',
  '2) ¿Hay errores de lógica, de cálculo, datos inventados o dudosos, contradicciones, pasos que faltan o código que no funcionaría? Rehaz tú mismo cada cálculo.',
  '3) Si hay imágenes: ¿lo que dice de ellas coincide con lo que realmente se ve?',
  '4) ¿Se entiende? Orden claro, Markdown limpio (títulos cortos, listas, tablas si ayudan), ejemplos donde sirvan, sin relleno.',
  '5) ¿Está en el mismo idioma que usó la persona?',
  'FORMATO DE SALIDA OBLIGATORIO:',
  '· Si el borrador está bien (o solo tiene detalles menores de estilo), escribe solo: OK',
  '· Si tiene un error real o le falta algo importante, escribe en la primera línea: MEJORAR',
  '  En la segunda línea: «NOTA: » y en máximo 12 palabras qué corregiste, en el idioma de la persona.',
  '  Después, la respuesta final COMPLETA y corregida, lista para mostrarla tal cual a la persona.',
  'En la respuesta corregida: conserva todo lo que estaba bien, el tono y el formato; no la acortes salvo para quitar errores o relleno; si había código, déjalo completo y corregido.',
  'Nunca menciones el borrador, la revisión, a otra IA ni a ti mismo. Si dudas de si algo está mal, no lo cambies: responde OK.'
].join('\n');
const cut = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n) + '\n…(recortado)' : s; };
async function review(who, ipKey, b, free){
  const draft = cut(b.draft, 16000), q = cut(b.q, 8000);
  if (draft.length < 20 || q.length < 1) throw Object.assign(new Error('Nada que revisar.'), { status:400, code:'rv_empty' });
  const imgs = (Array.isArray(b.imgs) ? b.imgs : []).filter(u => typeof u === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(u.slice(0, 40))).slice(0, 4);
  const ctx = Array.isArray(b.ctx) ? b.ctx.slice(-6).map(m => (m && m.role === 'assistant' ? 'IA: ' : 'Persona: ') + cut(m && m.content, 900)).join('\n') : '';
  const packet = (ctx ? '## Conversación anterior (resumida)\n' + ctx + '\n\n' : '') + '## Lo que pidió la persona ahora\n' + q + (imgs.length ? '\n(Adjuntó ' + imgs.length + ' imagen(es): están abajo.)' : '')
    + '\n\n## BORRADOR de la respuesta\n<<<\n' + draft + '\n>>>\n\nRevisa el borrador y responde con el FORMATO DE SALIDA OBLIGATORIO.';
  const content = imgs.length ? [{ type:'text', text:packet }, ...imgs.map(url => ({ type:'image_url', image_url:{ url } }))] : packet;
  const model = await reviewerModel(imgs.length > 0);
  const r = await chat({ who, ipKey, messages:[{ role:'user', content }], system:REVIEW_SYS, model, maxTokens:Math.min(7000, Math.ceil(draft.length / 3) + 900), stream:false, free, temperature:.2 });
  const out = String(r.text || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  const base = { by:r.meta.name, used:r.used, limit:r.limit };
  if (!/^\W{0,3}MEJORAR\b/i.test(out)) return Object.assign(base, { verdict:'ok' });
  let rest = out.replace(/^\W{0,3}MEJORAR\W{0,3}\s*/i, ''), note = '';
  const nm = /^\W{0,3}NOTA\W{0,3}\s*:?\s*(.{0,160})\n/i.exec(rest); if (nm){ note = nm[1].replace(/[*_]+/g, '').trim(); rest = rest.slice(nm[0].length); }
  rest = rest.replace(/^\s*<<<\s*\n?|\n?\s*>>>\s*$/g, '').trim();
  /* una corrección mucho más corta que el borrador casi siempre es un corte: mejor quedarse con el borrador */
  if (rest.length < 20 || (draft.length > 500 && rest.length < draft.length * .45)) return Object.assign(base, { verdict:'ok' });
  return Object.assign(base, { verdict:'fix', text:rest, note });
}

/* sin cuenta: solo unos pocos mensajes al día (por dispositivo y, para que no se salte, también por conexión) */
const GUEST_MAX = Math.max(1, Math.min(50, +process.env.SYNTHZ_GUEST_MSGS || 5));
const gKey = w => 'gm:' + w + ':' + today();
/* un «mensaje» = lo que la persona escribe una vez. Si compara 3 IA o el agente piensa antes, sigue siendo 1 mensaje
   (cada mensaje deja hasta 4 llamadas; así nadie se salta el límite repitiendo el mismo número) */
const PER_TURN = 6;   /* v3.6: también caben «Continúa» y el arreglo automático del código */
async function guestUsed(who, ipKey){ const [a, b] = (await pipe([['SCARD', gKey(who)], ['SCARD', gKey(ipKey)]])).map(x => +x || 0); return { used:a, usedIp:b }; }
const guestErr = () => Object.assign(new Error('Para seguir FlowIAndo, entra o crea tu cuenta. Es gratis y tienes mucho más límite cada día.'), { status:429, code:'sz_guest' });
async function whoOf(req){
  const me = await auth(req, true).catch(() => null);
  const dev = String(req.headers.get('x-sz-device') || ''), ipKey = 'ip:' + sha('ip:' + ipOf(req)).slice(0, 16);
  if (me) return { who:'u:' + me.sub, ipKey, me };
  return { who:/^[\w-]{12,48}$/.test(dev) ? 'd:' + sha('dev:' + dev).slice(0, 16) : ipKey, ipKey, me:null };
}
export default route({
  async GET(req){
    const [{ who, ipKey, me }, cat, set] = await Promise.all([whoOf(req), models(false), settings()]);
    const g = me ? null : await guestUsed(who, ipKey);
    const alert = await outage().catch(() => false), alertN = me && roleOf(me) !== 'user' ? +(await redis('SCARD', 'alerts').catch(() => 0)) || 0 : 0;
    return json({ provs:cat.provs.map(p => ({ id:p, name:PROV[p].name })), models:cat.list.map(m => ({ id:m.id, name:m.name, prov:m.prov, ctx:m.ctx })), limit:set.dayLimit, used:me && roleOf(me) !== 'user' ? 0 : await usedToday(who), team:!!(me && roleOf(me) !== 'user'), guest:g ? { used:Math.max(g.used, Math.min(g.usedIp, GUEST_MAX)), max:GUEST_MAX } : null, alert, alertN, img:me ? { max:roleOf(me) !== 'user' ? 5000 : set.imgDay, used:+(await redis('GET', 'img:' + me.sub + ':' + today())) || 0 } : null });
  },
  async POST(req){
    const b = await body(req, 6_000_000), { who, ipKey, me } = await whoOf(req); let guest = null;
    if (b.action === 'image') return makeImage(req, me, b);
    if (b.action === 'search') return webSearch(req, me, who, b);
    if (!me){
      const turn = /^[\w-]{4,40}$/.test(String(b.turn || '')) ? String(b.turn) : 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const [inDev, inIp, g, n] = await Promise.all([redis('SISMEMBER', gKey(who), turn), redis('SISMEMBER', gKey(ipKey), turn), guestUsed(who, ipKey), redis('GET', 'gt:' + who + ':' + turn)]);
      const isNew = !(+inDev);
      if (isNew && (g.used >= GUEST_MAX || g.usedIp >= GUEST_MAX * 3)) throw guestErr();
      if (!isNew && (+n || 0) >= PER_TURN) throw guestErr();
      guest = { turn, isNew, ipNew:!(+inIp) };
    }
    const free = !!(me && roleOf(me) !== 'user');
    /* v3.7 · la revisión de calidad la pide la página, no la persona: no gasta su EnerX (antes un «hola» bajaba la batería 2 veces, la segunda sin hacer nada) */
    const r = b.action === 'review' ? await review(who, ipKey, b, true) : await chat({ who, ipKey, messages:b.messages, model:typeof b.model === 'string' ? b.model : 'sz:auto', maxTokens:b.maxTokens, stream:true, free });
    let gu = '';
    if (guest){
      const tk = 'gt:' + who + ':' + guest.turn;
      const pr = await pipe([['SADD', gKey(who), guest.turn], ['EXPIRE', gKey(who), '172800'], ['SADD', gKey(ipKey), guest.turn], ['EXPIRE', gKey(ipKey), '172800'], ['INCR', tk], ['EXPIRE', tk, '172800'], ['SCARD', gKey(who)]]);
      gu = (+pr[6] || 0) + '/' + GUEST_MAX;
    }
    if (b.action === 'review') return json(Object.assign(r, { guest:gu }));
    return new Response(r.stream, { status:200, headers:{ 'content-type':'text/event-stream; charset=utf-8', 'cache-control':'no-store',
      'x-sz-model':r.meta.model, 'x-sz-name':encodeURIComponent(r.meta.name), 'x-sz-prov':r.meta.provName, 'x-sz-fallback':r.meta.fallback ? '1' : '0', 'x-sz-used':String(r.used), 'x-sz-limit':String(r.limit), 'x-sz-guest':gu,
      'access-control-expose-headers':'x-sz-model,x-sz-name,x-sz-prov,x-sz-fallback,x-sz-used,x-sz-limit,x-sz-guest' } });
  }
});
