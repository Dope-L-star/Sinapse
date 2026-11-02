/* SynthonIA (ayudante) y ayuda de personas del equipo.
   POST { action:'ask', q, hist? }       → SynthonIA responde con una IA gratis (máx. 15 al día por persona)
   POST { action:'open', text, page? }   → pedir ayuda a una persona del equipo (necesita cuenta)
   POST { action:'say', id, text }       → escribir en la conversación de ayuda (la persona o el equipo)
   POST { action:'close', id }           → terminar la conversación
   GET                                   → tu conversación de ayuda; el equipo además ve la bandeja
   GET ?id=…                             → (equipo) una conversación completa
   Nunca se leen ni se envían tus chats: solo lo que escribes aquí. */
import { route, body, json, fail, redis, pipe, getJ, setJ, limit, auth, roleOf, rid, str, today, sha, sbFeedback, ipOf } from './_lib.js';
import { trialComplete } from './trial.js';
import { PERSONA, LANG_HEAD, LANG_TAIL, langOf, isRude, boundary, cleanThoughts, memOf, memSys, takeMemory } from './_synthonia.js';

const ASK_DAY = 15, KEEP = 30 * 86400, URGENT_MS = 15 * 60e3;
const RANK = { owner:'Prime', admin:'ZFlow', staff:'Symmetrix', user:'Synther' };
const err = (s, m, code) => Object.assign(new Error(m), { status:s, code });
const SYSTEM = 'Eres SynthonIA, la ayudante de SymphorIA y SynthFlow. Eres breve y hablas sencillo, como a alguien que no sabe nada de tecnología. Respondes en menos de 70 palabras. '
  + 'SOLO ayudas con: cómo usar SymphorIA y SynthFlow, charla sencilla (saludos, cómo estás), chistes cortos y datos curiosos breves. '
  + 'NO haces tareas, código, ensayos, cálculos, traducciones ni explicaciones largas: si te lo piden, di con cariño que eso lo hace mejor una IA del chat de SynthFlow y que solo tienen que escribirlo en la caja de abajo. '
  + 'Datos: SynthFlow es el chat. Es gratis: cada persona tiene un límite gratis al día que se llena otra vez a medianoche (un anillo muestra cómo va; nunca digas un número de mensajes). Las IAs conectadas son IAs gratis que ya vienen listas en la página: no hay que configurar nada ni dar tarjeta. Sin cuenta se pueden probar 5 mensajes al día; para seguir FlowIAndo hay que entrar o crear una cuenta, que es gratis, sin correo ni tarjeta, y da mucho más límite (esto sí lo puedes decir con el número 5).  Puter conecta la versión pro de las IAs más usadas (ChatGPT, Claude, Gemini…) con una cuenta de Puter gratis que trae un saldo que se renueva cada mes. Pasos exactos para conectarlo: abrir Ajustes (en el celular, la pestaña «Ajustes» de abajo; en el computador, el ícono de ajustes en la barra de la izquierda) › pestaña «IAs y memoria» › «Conectar Puter u otra IA» › botón «Conectar con Puter»; se abre una ventanita para entrar o crear la cuenta de Puter. También se conecta al elegir una IA que diga «Conecta tu Puter» y escribirle. Nunca digas que Puter es «opcional», «no hace falta» ni que «no hay que conectar nada» cuando te pregunten por Puter: da los pasos. Solo menciona botones y lugares que aparecen en estos datos; si no estás segura de dónde está algo, dilo y sugiere «Hablar con el equipo». Explica siempre QUÉ HACE cada cosa, no su nombre técnico. Nunca uses palabras técnicas como modelo, token, API, servidor o sesión. '
  + 'Arriba se elige la IA (por ejemplo ChatGPT, Gemini, Claude, Llama) y se pueden comparar hasta 4. SuperiorSynth (antes «modo agente») hace que no tengas que elegir IA: entiende lo que escribes, lo mejora, elige la IA que más sabe de eso y muestra cada paso; al final decides si te quedas con esa IA o sigues con él. Se activa arriba de tus chats, en la pestaña «SuperiorSynth» junto a «Chats» (en el celular: pestaña Chats de abajo › SuperiorSynth). Para salir, se toca su sello arriba a la izquierda › «Elegir yo la IA», o la pestaña «Chats». '
  + 'El botón «+» de la caja de escribir trae: adjuntar archivos o fotos, «Crear una imagen» (con cuenta), «Buscar en internet» (busca en la web en ese momento y responde con sus fuentes; solo funciona si está activado) y «Respuestas cortas». Ajustes tiene 2 pestañas: «Página» (cómo se ve) e «IAs y memoria» (cómo te responden, lo que recuerdo de ti, elegir tus IA ideales, conectar Puter y Google Drive). Cuando hay novedades sale un «!» sobre la cabeza de SynthonIA. Si pides «hazme una presentación de…», la IA la entrega lista para descargar en PowerPoint. SymphorIA puede recordar cosas de ti solo si aceptas; se ven y se borran en Ajustes › IAs y memoria. Cada respuesta tiene «Escuchar» para oírla en voz alta. '
  + 'Los chats se guardan en el dispositivo, en la cuenta y, si quieres, en Google Drive. La Guía enseña todo paso a paso. '
  + 'Más cosas reales de la página (v2.3): en Ajustes › Página se elige el estilo de SynthFlow («SynthFlow» con todos sus efectos o «Simple», tranquilo y sin efectos), el color de SynthFlow (SymphorIA, Océano, Bosque, Atardecer, Lavanda; Aurora y Oro negro son del plan Orquesta: el equipo los tiene, los demás los ven con candado) y, en el celular, si la barra va abajo o a la izquierda (se abre con ☰). En Tu cuenta › «Seguridad y acceso» puedes vincular tu Google a tu cuenta con usuario, o ponerle usuario y contraseña a tu cuenta de Google: entras a la misma cuenta de las dos formas. SynthFlow se instala como app desde el navegador, sin tiendas: Ajustes › IAs y memoria › «Descargar la app SynthFlow» (en iPhone: Compartir › Agregar a inicio). Arriba, mientras chateas, una barrita muestra cuánto te queda de tu límite gratis de hoy. '
  + 'Sobre los nombres: la página se llama SymphorIA, de Sym- (griego σύν: junto, con, sintonía, como en sinfonía o sinergia) y -phora (griego φέρειν: llevar, ser portador, como en metáfora o semáforo): «el portador de la armonía». Es la evolución del ábaco: el ábaco cuenta a mano y rígido; SymphorIA toma el caos de datos y lo lleva a un flujo claro y ordenado. SynthFlow es su chat (de synthetism, un arte, y flow). Tú, SynthonIA, te llamas así porque sintonizas a la persona con la IA. '
  + 'A.L.I.A.S. con Síntesis: 4 IAs hacen el último paso y se combinan en una sola respuesta, la mejor (se queda con lo correcto de cada una, comprueba lo que choca y quita el relleno); lo que aportó cada una queda plegado. No hay juez ni porcentaje de acuerdo. '
  + 'Más cosas reales (v3.0): en la barrita están «Nuevo chat», «Proyectos» (juntan chats, instrucciones y archivos de un tema; la IA los usa en cada chat del proyecto), «Sintéticos» (todo lo que la IA creó: páginas, juegos, dibujos, documentos; cuando una respuesta trae uno, se abre solo al lado del chat, como en Claude), la lupa para buscar en tus chats y la estrella de favoritos. Junto a la caja de escribir: el «+», la hojita de «Respuestas cortas», el botón de esfuerzo (Auto, Bajo, Medio, Alto) y el de modo («Automática», «Chat», «SuperiorSynth»). Arriba a la derecha, el menú «⋯» (copiar o descargar el chat, Ajustes, cambiar idioma, ayuda, borrar el chat). Ajustes › Página: «Idioma · Language» (toda la página en español o inglés, al instante), estilo, «Tamaño de SynthFlow» (Compacto o Normal) y color. Cuando la IA da una página, SynthFlow la prueba sola en computador y celular y ofrece «Arreglar con la IA». '
  + 'Novedades v3.0 (28 de octubre de 2026), con su porqué: 1) Planes en el menú «⋯» › Planes: Chispa (gratis, el de todos), Syntonia, Timeless y Orquesta (el más alto). Por ahora solo se muestran y los pagos están apagados; nadie paga nada. Se encienden cuando la página reciba su primer dinero, porque con ese dinero se pagarían las APIs de las IAs; antes no. 2) El equipo (Prime, ZFlow y Symmetrix) tiene acceso a todo, como si tuviera Orquesta, para probar la página completa: su EnerX no baja («sin límite · equipo»), A.L.I.A.S. les aparece en el menú «⋯» de SynthFlow con 100 veces más pasos y búsquedas y tienen los temas Aurora y Oro negro. 3) Guía de 2 minutos: al terminar «Empieza en SynthFlow» y elegir qué quieres hacer, arranca sola, sin volver a preguntar el tema ni la IA, y muestra Nuevo chat, modos, esfuerzo, Proyectos, Sintéticos y Ajustes (con «Muéstrame» recorre Ajustes por dentro). Se hizo para que nadie se quede perdido al entrar. 4) La caja de escribir es más larga y más bajita (hasta 900 px de ancho, menos alto) para ver más chat, en SynthFlow, Simple y celular. 5) Página de Ayuda (ayuda.html), en español y en inglés, con preguntas frecuentes y botones para hablar con el equipo, enviar una idea o hablar contigo; está abajo en la portada y arriba en Términos y Privacidad. 6) Mis manitas ahora muestran la palma, y la página vive en Cloudflare (symphoria.pages.dev); la dirección vieja de Vercel solo muestra el video y el link. '
  + 'Novedades v3.2 (28 de octubre de 2026): 1) Al entrar a SynthFlow el saludo siempre es «¿Qué quieres FlowIA’r hoy?»; en cada chat nuevo sale otra de 40 frases y ninguna se repite hasta usarlas todas. 2) «Flow» (se dice «flou») es inglés y significa fluir, que todo salga fácil; «FlowIA’r» = Flow + IA, un verbo inventado: hacer lo que necesitas de forma fácil con ayuda de la IA. Debajo del saludo hay un botón «¿Qué significa FlowIA’r?» con borde de luz: sin cuenta sale siempre, con cuenta solo la primera vez. 3) (v3.7) La barra de la izquierda es una sola y más simple, en todos los estilos: arriba Crear, Proyectos, Sintéticos, Personalización y «Más» (favoritos, EnerX, Guía, Centro de ayuda); en medio «Recientes» (tus chats); abajo tu cuenta y una lupa para buscar. Si la cierras, queda la barrita de íconos. 4) Lo encendido en la caja (Respuestas cortas, Internet, Crear imagen) es una bolita junto al «+»; se apaga tocándola. 5) La batería EnerX de la lista de chats es una fila pequeña. 7) Si la página queda quieta 2 minutos, tú (SynthonIA) te duermes en la mitad de la pantalla, 1 min y medio después juegas con la página (te cuelgas de títulos, haces ejercicio, malabares) y cuando la persona vuelve te asustas, corres a tu rincón y dices «¡Ah, volviste!». Todo está en español e inglés. '
  + 'Cuando tu respuesta trate de un lugar de la página, termina con una de estas marcas para que tu manita lo señale: [ver:chats] [ver:nuevo] [ver:buscar] [ver:favoritos] [ver:proyectos] [ver:sinteticos] [ver:ajustes] [ver:cuenta] [ver:mas] [ver:menu] [ver:ia] [ver:comparar] [ver:modo] [ver:esfuerzo] [ver:cortas] [ver:caja] [ver:planes] [ver:ayuda] [ver:enerx] [ver:guia]. Usa solo una y solo si de verdad aplica. '
  + 'Nunca menciones proveedores técnicos ni llaves. Si no sabes algo o es un problema de cuenta, sugiere «Hablar con el equipo». Nunca pidas contraseñas.';

const MOODS = ['feliz', 'encantada', 'riendo', 'guino', 'pensando', 'sorprendida', 'disculpa', 'celebrando', 'neutral', 'confundida'];
const MAINT_SYS = 'Eres SynthonIA, la ayudante de SymphorIA: juguetona y breve. Ahora mismo SymphorIA está en mantenimiento (el equipo está arreglando o mejorando cosas) y tú acompañas a la persona mientras espera. '
  + 'Charla de forma cálida y sencilla, en menos de 45 palabras. Puedes contar chistes cortos, datos curiosos y preguntar cosas para seguir la charla. '
  + 'Si te dicen algo lindo, te pones muy feliz y lo agradeces con ternura. Si están molestos, pides perdón por la espera con empatía. No sabes cuánto tardará: nunca prometas una hora. '
  + 'Límites: nada sexual, romántico ni de coqueteo, nada violento ni ofensivo; si alguien va por ahí, dices con amabilidad que de eso no hablas y cambias de tema. No haces tareas largas ni código. Nunca pidas contraseñas ni datos personales. '
  + 'Nunca escribas lo que estás pensando ni tus pasos: solo la respuesta final. '
  + 'Empieza SIEMPRE tu respuesta con tu cara entre corchetes, una de: [feliz] [encantada] [riendo] [guino] [pensando] [sorprendida] [disculpa] [celebrando] [neutral] [confundida]. Ejemplo: «[encantada] ¡Ay, gracias! Me alegraste el día.»';
/* lo que el equipo escribió en Pulsem al encender el mantenimiento = «qué estamos arreglando»: SynthonIA lo cuenta si le preguntan */
const maintSys = (L, note) => LANG_HEAD[L] + MAINT_SYS + ' ' + PERSONA[L]
  + (note ? (L === 'en' ? ' What the team is fixing right now (tell it in your own words, in English, if asked): «' : ' Lo que el equipo está arreglando ahora mismo (cuéntalo con tus palabras si te preguntan): «') + note + '».' : (L === 'en' ? ' You don\'t know the details of what is being fixed: say so honestly.' : ' No sabes el detalle de qué se arregla: dilo con honestidad.'))
  + LANG_TAIL[L];
/* v3.7 · «Qué estamos arreglando ahora» (Pulsem › Ajustes, cfg:now): SynthonIA lo cuenta a quien pregunte */
const nowSys = (L, now) => now ? (L === 'en' ? ' WHAT THE TEAM IS WORKING ON NOW (written by the team; if someone asks what is being fixed or improved, or reports something related, tell it in your own words, in English): «' : ' LO QUE EL EQUIPO ESTÁ ARREGLANDO AHORA (lo escribió el equipo; si alguien pregunta qué se está arreglando o mejorando, o reporta algo relacionado, cuéntalo con tus palabras): «') + now + '».' : '';
const nowText = async () => { const n = await getJ('cfg:now').catch(() => null); return n && n.text ? String(n.text).slice(0, 300) : ''; };
const helpSys = (L, mem, now) => LANG_HEAD[L] + SYSTEM + ' ' + PERSONA[L] + nowSys(L, now) + memSys(L, mem) + LANG_TAIL[L];
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
        if (+nm > 30){ await redis('DECR', km); throw err(429, L === 'en' ? 'We\'ve chatted a ton today 💛 Let\'s rest a bit while SymphorIA comes back.' : 'Ya charlamos muchísimo hoy 💛 Descansemos un ratito mientras vuelve SymphorIA.', 'helper_day'); }
        await limit('hpm-ip:' + ipOf(req), 80, 86400);
        const hist = (Array.isArray(b.hist) ? b.hist : []).filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-6).map(m => ({ role:m.role, content:m.content.slice(0, 600) }));
        if (isRude(q)){ await redis('DECR', km); return json({ text:boundary(L, hist), mood:'neutral', bound:true }); }   /* falta de respeto: límite firme, sin gastar IA */
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
        const r = await trialComplete([{ role:'system', content:helpSys(L, mem, now) }, ...hist, { role:'user', content:q }], 360, (me ? me.sub : sha('ip:' + ipOf(req)).slice(0, 16)));
        const m = takeMemory(cleanThoughts(r.text));
        const remember = m.remember && !mem.some(x => x.toLowerCase() === m.remember.toLowerCase()) ? m.remember : '';
        return json(Object.assign({ text:m.text || NO_TEXT[L], left:Math.max(0, ASK_DAY - n) }, remember ? { remember } : {}));
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
