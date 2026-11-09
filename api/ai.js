/* IA de SymphorIA para todos (beta 2)
   GET                       → { models, provs, limit, used } modelos gratis disponibles y lo que llevas hoy
   POST { messages, model?, maxTokens? } → respuesta en vivo (streaming), con el gasto al final
   POST { action:'transcribe', audio } → { text } (audio adjunto pasado a texto, trozos de 1 minuto)
   POST { action:'ping', id | ids } → { status:{ id:'ok'|'busy'|'down' } } (¿esa IA responde ahora? con caché compartida)
   Sin cuenta también funciona: se cuenta por dispositivo y por conexión. */
import { route, body, json, fail, auth, sha, redis, pipe, today, ipOf, limit, str, roleOf } from './_lib.js';
import { leer, sistema, reasonParams, temperatura } from './_cerebro.js';
import { pick, pickHard, recordLite, used as usedProv } from './_ruta.js';
import { perksOf, publicPerks, enerOf, offErr, capOf } from './_permisos.js';
import { models, chat, reviewerModel, settings, usedToday, quotaKey, PROV, IMG, pickKeys, markPay, clearPay, outage, classify, searchWith, searchWiki, searchRss, readPage, PAY_RX, baseOf, pingModel } from './_pool.js';

/* v2.0 · imágenes con Pollinations: solo con cuenta, con su propio límite diario (no gasta Puter ni tu límite de chat).
   Solo gasta el saldo que ya esté cargado en Pollinations: nunca cobra a una tarjeta. */
const IMG_GLOBAL = +process.env.SYNTHZ_IMG_GLOBAL || 150;
/* v2.1 · «Buscar en internet»: Tavily o Exa (gratis, sin tarjeta) y, si no hay, Wikipedia. Cuenta en su propio límite */
const SEARCH_GLOBAL = +process.env.SYNTHZ_SEARCH_GLOBAL || 300;
const NEWS_RX = /\b(hoy|ayer|noticias?|[uú]ltim[oa]s?|esta semana|resultado|gan[oó]|elecci|partido|precio|d[oó]lar|cotizaci|today|yesterday|news|latest|this week|score|won|election|price)\b/i;
async function webSearch(req, me, who, b){
  const q = str(b.q, 300); if (q.length < 2) throw Object.assign(new Error('Escribe qué quieres buscar.'), { status:400, code:'s_empty' });
  const lang = b.lang === 'en' ? 'en' : 'es', read = b.read !== false;
  /* v3.8 · la misma pregunta en 30 min sale de la caché: no gasta búsquedas de nadie */
  const ck = 'sc:' + lang + ':' + sha(q.toLowerCase().replace(/\s+/g, ' ').trim()).slice(0, 24), hit = await redis('GET', ck).catch(() => null);
  if (hit){ try{ return json(Object.assign(JSON.parse(hit), { cached:true })); }catch(e){} }
  if (me && me.ux && !me.ux.f.search) throw offErr('Buscar en internet no está activado para tu cuenta. Escríbele al equipo de SymphorIA si lo necesitas.', 's_off');
  const team = me && roleOf(me) !== 'user', max = capOf(me && me.ux, 'search', team ? 5000 : me ? 60 : 8), d = today();   /* v3.8 · más búsquedas al día: 60 con cuenta, 8 sin cuenta · v4.4: o la propia (Pulsem › Usuarios) */
  await limit('srch:' + who, 12, 60);
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
  /* v3.8 · sin llaves o sin saldo: feeds públicos de Bing (noticias si la pregunta es de actualidad) y, al final, Wikipedia */
  if (!res.length){ const news = NEWS_RX.test(q); for (const nw of news ? [true, false] : [false, true]){ res = await searchRss(q, 6, nw, lang).catch(e => { console.error('[synthz] búsqueda rss', e.status || 'sin respuesta'); return []; }); if (res.length){ via = nw ? 'noticias' : 'internet'; break; } } }
  if (!res.length){ res = await searchWiki(q, 4, lang).catch(() => []); via = 'wikipedia'; }
  res = res.filter(x => /^https?:\/\//.test(x.u)).slice(0, 6);
  /* v3.8 · la IA no solo ve el resumen: se leen las 3 primeras páginas (6 s cada una, en paralelo) y se guarda lo importante 6 h */
  if (read && res.length){
    await Promise.all(res.slice(0, 3).map(async x => {
      const pk = 'pg:' + sha(x.u).slice(0, 24);
      try{ let c = await redis('GET', pk).catch(() => null); if (c == null){ c = await readPage(x.u, q).catch(() => ''); await redis('SET', pk, c, 'EX', '21600').catch(() => {}); } if (c && c.length > 120) x.c = c; }catch(e){}
    }));
  }
  await pipe([['INCR', uk], ['EXPIRE', uk, '172800'], ['INCR', gk], ['EXPIRE', gk, '172800']]);
  const out = { results:res, via, at:new Date().toISOString() };
  if (res.length) await redis('SET', ck, JSON.stringify(out), 'EX', '1800').catch(() => {});
  return json(Object.assign(out, { left:Math.max(0, max - n - 1) }));
}
/* v3.8 · audio y video adjuntos → texto. El navegador manda trozos de 1 minuto (WAV 16 kHz) y aquí los transcribe
   Whisper gratis: Groq (whisper-large-v3-turbo) y, si no hay, Cloudflare Workers AI. Cuenta en su propio límite (no gasta EnerX). */
const STT_GLOBAL = +process.env.SYNTHZ_STT_GLOBAL || 4000;
async function transcribe(me, who, b){
  const a = typeof b.audio === 'string' ? b.audio : '';
  if (a.length < 200 || a.length > 4_000_000 || !/^[A-Za-z0-9+/=]+$/.test(a.slice(0, 400))) throw Object.assign(new Error('Ese audio no llegó bien.'), { status:400, code:'tr_bad' });
  const team = me && roleOf(me) !== 'user', max = team ? 5000 : me ? 240 : 30, d = today();   /* trozos de 1 min al día: con cuenta 4 h, sin cuenta 30 min */
  await limit('tr:' + who, 40, 60);
  const uk = 'tr:' + who + ':' + d, gk = 'tr:all:' + d;
  const [n, g] = (await pipe([['GET', uk], ['GET', gk]])).map(x => +x || 0);
  if (n >= max || g >= STT_GLOBAL) throw Object.assign(new Error('Por hoy ya se pasó mucho audio a texto. Mañana hay más.'), { status:429, code:'tr_limit' });
  const lang = /^[a-z]{2}$/.test(String(b.lang || '')) ? String(b.lang) : '', wav = Buffer.from(a, 'base64');
  let text = null;
  for (const k of (await pickKeys('groq')).slice(0, 2)){
    try{
      const fd = new FormData();
      fd.append('file', new Blob([wav], { type:'audio/wav' }), 'audio.wav'); fd.append('model', process.env.SYNTHZ_STT_MODEL || 'whisper-large-v3-turbo'); fd.append('response_format', 'json'); fd.append('temperature', '0');
      if (lang) fd.append('language', lang);
      const r = await fetch((await baseOf(k)) + '/audio/transcriptions', { method:'POST', headers:{ Authorization:'Bearer ' + k.key }, body:fd, signal:AbortSignal.timeout(45000) });
      if (!r.ok){ const t = await r.text().catch(() => ''); throw Object.assign(new Error('groq'), { status:r.status, txt:t }); }
      text = String((await r.json()).text || ''); break;
    }catch(e){
      const s = e.status || 0; console.error('[synthz] audio a texto groq', s ? classify(s) : 'sin respuesta');
      if (s === 402 || ((s === 401 || s === 403) && PAY_RX.test(e.txt || ''))) await markPay(k, s, e.txt || '');
      if (s === 401 || s === 403 || s === 429) await redis('SET', 'pk:down:' + k.id, classify(s), 'EX', s === 429 ? '90' : '600').catch(() => {});
    }
  }
  if (text == null) for (const k of (await pickKeys('cloudflare')).slice(0, 2)){
    try{
      const r = await fetch((await baseOf(k)).replace(/\/v1$/, '') + '/run/@cf/openai/whisper-large-v3-turbo', { method:'POST', headers:{ Authorization:'Bearer ' + k.key, 'content-type':'application/json' }, body:JSON.stringify(Object.assign({ audio:a }, lang ? { language:lang } : {})), signal:AbortSignal.timeout(45000) });
      if (!r.ok) throw Object.assign(new Error('cf'), { status:r.status });
      const j = await r.json(); text = String((j.result && j.result.text) || ''); break;
    }catch(e){ console.error('[synthz] audio a texto cloudflare', e.status ? classify(e.status) : 'sin respuesta'); }
  }
  if (text == null) throw Object.assign(new Error('Ahora no se puede pasar el audio a texto. Prueba en un rato.'), { status:503, code:'tr_down' });
  await pipe([['INCR', uk], ['EXPIRE', uk, '172800'], ['INCR', gk], ['EXPIRE', gk, '172800']]);
  return json({ text:text.trim().slice(0, 20000), left:Math.max(0, max - n - 1) });
}
/* v4.4 · imágenes al día: la propia (Pulsem › Usuarios), si no la del equipo (5000) o la de todos */
const imgMax = (me, set) => me.ux && !me.ux.f.image ? 0 : capOf(me.ux, 'img', roleOf(me) !== 'user' ? 5000 : set.imgDay);
async function makeImage(req, me, b){
  if (!me) throw Object.assign(new Error('Para crear imágenes entra a tu cuenta (es gratis).'), { status:401, code:'img_login' });
  const set = await settings(), d = today();
  if (me.ux && !me.ux.f.image) throw offErr('Crear imágenes no está activado para tu cuenta. Escríbele al equipo de SymphorIA si lo necesitas.', 'img_off');
  const max = imgMax(me, set);   /* v3.0: el equipo, sin límite propio (solo el tope de todos, IMG_GLOBAL) · v4.4: o el propio */
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
async function review(who, ipKey, b, free, me){
  if (me && me.ux && !me.ux.f.review) return { verdict:'ok', off:true };   /* v4.4 · revisión apagada para esta cuenta: se entrega el borrador tal cual */
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

/* ---------- v4.0 · el cerebro de cada respuesta (api/_cerebro.js + el enrutador de A.L.I.A.S.) ----------
   · Automática: cada pregunta va a la IA gratis que mejor resuelve ESE tipo de trabajo (antes iba siempre a la misma).
   · Difícil: va a los modelos gratis más grandes («cerebro grande», cat.smart) con su propio tope diario, para no agotar lo gratis de todos.
   · Toda respuesta (también si elegiste una IA) lleva las instrucciones de su tipo de trabajo y la fecha de hoy; en lo difícil, piensa y se revisa.
   SYNTHZ_SMART=0 apaga el «cerebro grande» (quedan solo los modelos de siempre). */
const SMART_ON = process.env.SYNTHZ_SMART !== '0';
const SMART_DAY = +process.env.SYNTHZ_SMART_DAY || 600;   /* respuestas difíciles con modelos grandes al día, entre todos */
async function smartOk(who, me, free){
  if (!SMART_ON) return false;
  if (me && me.ux && !me.ux.f.smart) return false;   /* v4.4 · sin «cerebro grande» para esta cuenta: responde la IA normal */
  const d = today(), uk = 'sm:' + who + ':' + d, gk = 'sm:all:' + d, max = capOf(me && me.ux, 'smart', free ? 1000 : me ? 40 : 3);
  const [n, g] = (await pipe([['GET', uk], ['GET', gk]]).catch(() => [0, 0])).map(x => +x || 0);
  if (n >= max || g >= SMART_DAY) return false;
  await pipe([['INCR', uk], ['EXPIRE', uk, '172800'], ['INCR', gk], ['EXPIRE', gk, '172800']]).catch(() => {});
  return true;
}
const hasImg = msgs => (Array.isArray(msgs) ? msgs : []).some(m => m && Array.isArray(m.content) && m.content.some(p => p && p.type === 'image_url'));
async function brainChat(who, ipKey, me, b, free, dayLimit = null){
  const model = typeof b.model === 'string' ? b.model : 'sz:auto', maxTokens = b.maxTokens ?? b.max_tokens;
  /* v4.3 · niveles Auto · Veloz (low) · Profundo (high) · Creativo (creative): Creativo no cambia lo difícil, solo sube la temperatura */
  const creative = b.effort === 'creative';
  const L = leer(b.messages, { effort:['low', 'medium', 'high'].includes(b.effort) ? b.effort : '' });
  const short = +maxTokens > 0 && +maxTokens <= 900;
  let route = null, firstMs = 0;
  if (model === 'sz:auto' && !hasImg(b.messages) && !L.cont){
    const big = L.level === 'hard' && !short && await smartOk(who, me, free);
    const ranked = await (big ? pickHard(L.cat) : pick(L.cat)).catch(() => []);
    if (ranked.length){ route = ranked.map(x => x.m); firstMs = ranked.length > 1 ? 20000 : 0; }
  }
  const pend = [];
  const r = await chat({ who, ipKey, messages:b.messages, model, maxTokens, stream:true, free, dayLimit, route, firstMs,
    onTry:({ m, ok, ms }) => { pend.push(recordLite(L.cat, m.id, ok, ms)); },
    brain:m => ({ system:sistema(L, m.prov, m.mid, { short }), extra:reasonParams(m.prov, m.mid, L.level), temperature:creative ? Math.max(.9, temperatura(L)) : temperatura(L), maxTokens:L.level === 'hard' && !short ? 8000 : undefined }) });
  pend.push(usedProv(r.meta.prov));
  await Promise.all(pend).catch(() => {});
  r.meta.cat = L.cat; r.meta.level = L.level;
  return r;
}

/* sin cuenta: solo unos pocos mensajes al día (por dispositivo y, para que no se salte, también por conexión) */
const GUEST_MAX = Math.max(1, Math.min(50, +process.env.SYNTHZ_GUEST_MSGS || 5));
const gKey = w => 'gm:' + w + ':' + today();
/* un «mensaje» = lo que la persona escribe una vez. Si compara 3 IA o el agente piensa antes, sigue siendo 1 mensaje
   (cada mensaje deja hasta 4 llamadas; así nadie se salta el límite repitiendo el mismo número) */
const PER_TURN = 6;   /* v3.6: también caben «Continúa» y el arreglo automático del código */
/* Fase 4 · costo cero: la lista de IAs, los ajustes y el «¿se cayeron todas?» son iguales para todos. Cada servidor los guarda
   un ratito (60 s, 60 s y 30 s) en vez de leerlos de Redis en cada visita. Lo de cada persona (su EnerX, sus mensajes) sigue en vivo. */
const MEMO = new Map();
function memo(k, ms, fn){
  const c = MEMO.get(k); if (c && Date.now() - c.t < ms) return c.p;
  const p = Promise.resolve().then(fn); MEMO.set(k, { t:Date.now(), p });
  p.catch(() => { if (MEMO.get(k)?.p === p) MEMO.delete(k); });
  return p;
}
async function guestUsed(who, ipKey){ const [a, b] = (await pipe([['SCARD', gKey(who)], ['SCARD', gKey(ipKey)]])).map(x => +x || 0); return { used:a, usedIp:b }; }
/* v4.2 · cuántos mensajes le quedan DE VERDAD a quien no tiene cuenta: los mismos topes con los que el servidor deja o no deja escribir
   (este dispositivo, esta conexión y la EnerX del día). Antes se mandaba solo el del dispositivo y la página mostraba «quedan 2» con la pila en 0 */
async function guestView(who, ipKey, dayLimit){
  const [dev, ip, q, qIp] = (await pipe([['SCARD', gKey(who)], ['SCARD', gKey(ipKey)], ['GET', quotaKey(who)], ['GET', quotaKey(ipKey)]])).map(x => +x || 0);
  const left = q >= dayLimit || qIp >= dayLimit * 3 ? 0 : Math.max(0, Math.min(GUEST_MAX - dev, GUEST_MAX * 3 - ip));
  return { used:GUEST_MAX - left, max:GUEST_MAX, left };
}
const guestErr = () => Object.assign(new Error('Para seguir FlowIAndo, entra o crea tu cuenta. Es gratis y tienes mucho más límite cada día.'), { status:429, code:'sz_guest' });
async function whoOf(req){
  const me = await auth(req, true).catch(() => null);
  const dev = String(req.headers.get('x-sz-device') || ''), ipKey = 'ip:' + sha('ip:' + ipOf(req)).slice(0, 16);
  if (me){ me.ux = await perksOf(me); return { who:'u:' + me.sub, ipKey, me }; }
  return { who:/^[\w-]{12,48}$/.test(dev) ? 'd:' + sha('dev:' + dev).slice(0, 16) : ipKey, ipKey, me:null };
}
export default route({
  async GET(req){
    const [{ who, ipKey, me }, cat, set] = await Promise.all([whoOf(req), memo('models', 60e3, () => models(false)), memo('settings', 60e3, settings)]);
    const g = me ? null : await guestView(who, ipKey, set.dayLimit), en = enerOf(me && me.ux);
    const alert = await memo('outage', 30e3, () => outage()).catch(() => false), alertN = me && roleOf(me) !== 'user' ? +(await redis('SCARD', 'alerts').catch(() => 0)) || 0 : 0;
    return json({ provs:cat.provs.map(p => ({ id:p, name:PROV[p].name })), models:cat.list.map(m => ({ id:m.id, name:m.name, prov:m.prov, ctx:m.ctx })), limit:en.dayLimit ?? set.dayLimit, used:en.free ? 0 : await usedToday(who), team:!!(me && roleOf(me) !== 'user'), unl:en.free, guest:g, alert, alertN, img:me ? { max:imgMax(me, set), used:+(await redis('GET', 'img:' + me.sub + ':' + today())) || 0 } : null, perks:publicPerks(me && me.ux) });
  },
  async POST(req){
    const b = await body(req, 6_000_000), { who, ipKey, me } = await whoOf(req); let guest = null;
    if (b.action === 'image') return makeImage(req, me, b);
    if (b.action === 'search') return webSearch(req, me, who, b);
    if (b.action === 'transcribe') return transcribe(me, who, b);
    /* v3.8 · ¿responde la IA que elegiste? (no gasta tu límite; el resultado se comparte unos minutos) */
    if (b.action === 'ping'){
      const ids = (Array.isArray(b.ids) ? b.ids : [b.id]).filter(x => typeof x === 'string' && /^sz:[\w.:/@+-]{2,160}$/.test(x)).slice(0, 4);
      if (!ids.length) return fail(400, 'Modelo no válido.');
      await limit('ping:' + who, 30, 60);
      const out = {}; await Promise.all(ids.map(async id => { out[id] = await pingModel(id).catch(() => 'busy'); }));
      return json({ status:out });
    }
    if (!me){
      const turn = /^[\w-]{4,40}$/.test(String(b.turn || '')) ? String(b.turn) : 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const [inDev, inIp, g, n] = await Promise.all([redis('SISMEMBER', gKey(who), turn), redis('SISMEMBER', gKey(ipKey), turn), guestUsed(who, ipKey), redis('GET', 'gt:' + who + ':' + turn)]);
      const isNew = !(+inDev);
      if (isNew && (g.used >= GUEST_MAX || g.usedIp >= GUEST_MAX * 3)) throw guestErr();
      if (!isNew && (+n || 0) >= PER_TURN) throw guestErr();
      guest = { turn, isNew, ipNew:!(+inIp) };
    }
    const { free, dayLimit } = enerOf(me && me.ux);   /* v4.4 · el equipo, o quien tenga «sin límite», no gasta EnerX; los demás, su tope propio o el de todos */
    /* v3.7 · la revisión de calidad la pide la página, no la persona: no gasta su EnerX (antes un «hola» bajaba la batería 2 veces, la segunda sin hacer nada) */
    const r = b.action === 'review' ? await review(who, ipKey, b, true, me) : await brainChat(who, ipKey, me, b, free, dayLimit);
    let gu = '';
    if (guest){
      const tk = 'gt:' + who + ':' + guest.turn;
      await pipe([['SADD', gKey(who), guest.turn], ['EXPIRE', gKey(who), '172800'], ['SADD', gKey(ipKey), guest.turn], ['EXPIRE', gKey(ipKey), '172800'], ['INCR', tk], ['EXPIRE', tk, '172800']]);
      const gv = await guestView(who, ipKey, (await memo('settings', 60e3, settings)).dayLimit);
      gu = gv.used + '/' + GUEST_MAX + '/' + gv.left;
    }
    if (b.action === 'review') return json(Object.assign(r, { guest:gu }));
    return new Response(r.stream, { status:200, headers:{ 'content-type':'text/event-stream; charset=utf-8', 'cache-control':'no-store',
      'x-sz-model':r.meta.model, 'x-sz-name':encodeURIComponent(r.meta.name), 'x-sz-prov':r.meta.provName, 'x-sz-fallback':r.meta.fallback ? '1' : '0', 'x-sz-used':String(r.used), 'x-sz-limit':String(r.limit), 'x-sz-guest':gu, 'x-sz-cat':r.meta.cat || '', 'x-sz-level':r.meta.level || '',
      'access-control-expose-headers':'x-sz-model,x-sz-name,x-sz-prov,x-sz-fallback,x-sz-used,x-sz-limit,x-sz-guest,x-sz-cat,x-sz-level' } });
  }
});
