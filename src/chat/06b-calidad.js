/* ---------- v3.4 · Calidad de las respuestas (pedido de Sammuel, 28 oct) ----------
   Dos pasos, para que todas las IAs respondan con lógica y se entiendan:
   1) qualitySystem(): unas instrucciones cortas de «experto» que viajan con cada mensaje (las pone apiMsgs).
   2) qualityAfter(): cuando termina la respuesta, otra IA (la que mejor razona entre las gratis; con fotos, una que ve)
      la revisa: lógica, cálculos, datos, que responda lo pedido y lo que se ve en las fotos.
      Si está bien → «✓ Revisada». Si tiene errores → la respuesta se cambia por la corregida («✨ Mejorada» · Ver original).
      Tiene 28 s como máximo; si tarda más o falla, se queda la respuesta de antes (nunca se pierde nada).
   Se apaga en Ajustes › IAs y memoria › «Revisión de calidad». Las instrucciones del revisor viven en el servidor (api/ai.js). */
/* v4.0 · las mismas reglas del «cerebro» del servidor (api/_cerebro.js) para CUALQUIER IA que elijas (Puter, OpenRouter, Groq…):
   la fecha de hoy, cómo responde un experto en ese tipo de trabajo y, si es difícil, pensar → resolver → revisar antes de responder. */
const Q_HARD = /\b(demuestra|resuelve|calcula|deriva|integral|ecuaci[oó]n|probabilidad|optimiza|algoritmo|depura|debug|refactor|por qu[eé] (falla|no funciona)|paso a paso|a fondo|analiza|compara|eval[uú]a|estrategia|dise[nñ]a|arquitectura|acertijo|l[oó]gica|cu[aá]nt[oa]s?|prove|solve|calculate|equation|probability|algorithm|step by step|in depth|analy[sz]e|compare|evaluate|strategy|design|riddle|puzzle|how (many|much))\b/i;
const Q_EASY = /^\W*(hola+|holi|buenas|buen(os)? d[ií]as|hey|hi|hello|gracias|thanks|thank you|ok(ay)?|vale|listo|s[ií]|no|dale|c[oó]mo est[aá]s|how are you|qu[eé] tal|chao|bye)\b[\s\W]*$/i;
const Q_KIND = [['code', /\b(c[oó]digo|code|programa|funci[oó]n|function|script|python|javascript|html|css|sql|bug|error|react|node|java|api)\b|```/i],
  ['translate', /\b(traduc\w*|translat\w*)\b/i], ['data', /\b(calcul\w*|porcentaje|percent|promedio|average|tabla|datos|data|matem\w*|math|ecuaci[oó]n|equation|\d+\s*[-+*/^x×÷]\s*\d+)\b/i],
  ['summary', /\b(resum\w*|summar\w*|puntos clave|key points|tl;?dr)\b/i], ['write', /\b(escrib\w*|redact\w*|write|correo|email|carta|ensayo|essay|art[ií]culo|historia|story|poema|poem|post|discurso)\b/i]];
const Q_JOB = {
  code:'Como ingeniero de software sénior: código COMPLETO que funcione a la primera, en bloques con su lenguaje, sin «…»; explica la causa exacta de los errores y considera casos raros. No inventes funciones ni librerías.',
  translate:'Como traductor profesional: traduce el sentido, natural y con el mismo tono y formato; conserva nombres, código y cifras.',
  data:'Como experto en matemáticas y datos: plantea, resuelve paso a paso mostrando cada operación, RECALCULA cada número y termina con el resultado en negrita y con unidades.',
  summary:'Como experto en síntesis: la idea central en una frase y luego los puntos clave en viñetas cortas con datos concretos; nada que no esté en el material.',
  write:'Como escritor profesional: voz natural, ritmo, adaptado a quién lo lee; sin clichés ni relleno; texto listo para usar.',
  reason:'Como analista experto: primero la conclusión o recomendación, luego las razones más fuertes con sus supuestos; si hay opciones, compáralas con criterios concretos y elige.'
};
const Q_NATIVE = /gpt-oss|qwen3|deepseek-r1|qwq|gemini-(2\.5|[3-9])|claude|gpt-[5-9]|\bo[34]\b|grok|kimi|glm-4\.[5-9]|magistral/i;
function qualitySystem(saver, ask, mid){
  const day = new Date().toLocaleDateString(SZ.lang() === 'en' ? 'en-US' : 'es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  if (saver) return 'Hoy es ' + day + '. Piensa en silencio antes de responder; revisa cálculos y lógica. No inventes datos.';
  const q = String(ask || '').trim(), easy = !q || Q_EASY.test(q);
  const kind = (Q_KIND.find(([, rx]) => rx.test(q)) || ['reason'])[0];
  const hard = !easy && (st().sx && st().sx.effort === 'high' || (Q_HARD.test(q) ? 2 : 0) + (/\d\s*[-+*/^=]\s*\d/.test(q) ? 2 : 0) + (/```/.test(q) ? 2 : 0) + (q.length > 400 ? 1 : 0) + (/code|data/.test(kind) ? 1 : 0) >= 3);
  const base = 'Hoy es ' + day + '. Responde como los mejores asistentes del mundo, con precisión y criterio. Empieza por la respuesta (sin saludos, sin repetir la pregunta, sin relleno) y luego explica lo necesario.'
    + ' No inventes datos, citas, enlaces ni funciones: si no lo sabes con certeza o pudo cambiar después de lo que aprendiste, dilo en una frase. Si la pregunta es ambigua, elige la lectura más probable y dilo.'
    + ' Mantén el hilo de la conversación. Markdown limpio (listas, tablas al comparar, código en bloques con su lenguaje); el largo justo. Responde siempre en el idioma en que te escribe la persona.'
    + ' Si hay imágenes o archivos, básate en lo que de verdad se ve o dice en ellos.';
  if (easy) return base + ' Esto es sencillo: responde directo y breve, con calidez.';
  const think = !hard ? '' : Q_NATIVE.test(String(mid || ''))
    ? ' ES DIFÍCIL: razona con cuidado paso a paso antes de responder y revisa el resultado (rehaz los cálculos, prueba el código con un ejemplo, busca casos raros). En la respuesta muestra los pasos clave.'
    : ' ES DIFÍCIL: escribe PRIMERO tu razonamiento dentro de <think> y </think> (qué se pide, plan, resolverlo paso a paso y REVISARLO: rehaz los cálculos por otro camino, prueba el código con un ejemplo, busca contradicciones). Cierra </think> y DESPUÉS escribe la respuesta final limpia.';
  return base + ' ' + Q_JOB[kind] + think;
}
const REV_MS = 28000;
/* las IAs de primer nivel no necesitan que otra más pequeña las revise */
const REV_SKIP = /claude-(opus|sonnet|fable)|gpt-5(?![\w.-]*(nano|mini|lite))|gpt-6|gemini-[\d.]+-pro|grok-[4-9]|\bo[34]\b/i;
const revOn = () => SZ.CFG.review !== false;
function revWanted(mid, msg, r){
  if (!revOn() || G || trialOn || mode !== 'solo' || !szOn() || !r || r.aborted || msg.cont) return false;
  if (REV_SKIP.test(mid) || REV_SKIP.test(r.real || '')) return false;
  const t = msg.content || '';
  if (t.length < 160 || /^\(La IA devolvió una respuesta vacía\.\)$/.test(t)) return false;   /* un saludo o un «sí» no necesita revisión */
  if (/```html/i.test(t) && t.length > 4000) return false;                                 /* las páginas ya las prueba SynthCode */
  return true;
}
function revPacket(chat, msg){
  const i = chat.lastIndexOf(msg), u = [...chat.slice(0, i)].reverse().find(x => x.role === 'user');
  if (!u) return null;
  let q = String(u.ask || u.content || '');
  let room = 9000;
  (u.files || []).forEach(f => { if (f.text && room > 0){ const s = f.text.slice(0, Math.min(6000, room)); room -= s.length; q += '\n\n[Archivo adjunto: ' + f.name + ']\n' + s; } });
  const ui = chat.lastIndexOf(u);
  const ctx = chat.slice(Math.max(0, ui - 4), ui).filter(m => typeof m.content === 'string' && !m.imgId).map(m => ({ role:m.role, content:m.content.slice(0, 900) }));
  return { q:q.trim() || 'Mira la imagen.', imgs:(u._imgs || []).slice(0, 4), ctx };
}
/* v3.6 · estos avisos van dentro de la respuesta, donde el traductor no entra: se escriben ya en el idioma elegido */
const RL = (es, en) => SZ.lang() === 'en' ? en : es;
function revChip(el, cls, html){
  let c = $('.qrev', el);
  if (!c){ c = document.createElement('div'); const meta = $('.meta', el); if (meta) meta.before(c); else el.appendChild(c); }
  c.className = 'qrev ' + cls; c.innerHTML = html; return c;
}
const REV_ICO = { ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  fix:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>' };
/* lo que se ve debajo de una respuesta ya revisada (también al volver a abrir el chat) */
function revBadge(el, m){
  if (!m || !m.rev) return;
  if (m.rev === 'ok') revChip(el, 'ok', REV_ICO.ok + '<span>' + RL('Revisada: la lógica está bien', 'Reviewed: the logic is sound') + '</span>');
  else revChip(el, 'fix', REV_ICO.fix + '<span>' + RL('Mejorada en la revisión', 'Improved in review') + (m.revNote ? ': ' + esc(m.revNote) : '') + '</span>' + (m.orig ? '<button type="button" class="lnk qrev-o" aria-pressed="false">' + RL('Ver original', 'See original') + '</button>' : ''));
}
async function qualityAfter(el, chat, msg, mid, r){
  if (!revWanted(mid, msg, r)) return;
  const pk = revPacket(chat, msg); if (!pk) return;
  /* v3.7 · un saludo o charla corta («hola», «gracias», «cómo estás») no se revisa aunque la respuesta sea larga */
  if (pk.q.length < 40 && /^\W*(hola|holi|buenas|buenos d[ií]as|hey|hi|hello|gracias|thanks|thank you|ok|vale|listo|c[oó]mo est[aá]s|how are you|qu[eé] tal|chao|adi[oó]s|bye)\b/i.test(pk.q.trim())) return;
  if (SZ.isGuestQ() && !SZ.turnNow()) return;   /* sin el mensaje que la pidió, la revisión costaría otro mensaje de prueba: no se hace */
  const g0 = gen, draft = msg.content;
  revChip(el, 'run', '<i class="qspin" aria-hidden="true"></i><span>' + RL('Revisando la lógica de la respuesta…', 'Checking the logic of the answer…') + '</span>');
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), REV_MS); ctls.add(ctl);
  let d = null;
  try{
    const res = await fetch('/api/ai', { method:'POST', headers:SZ.szHeaders(), signal:ctl.signal, body:JSON.stringify({ action:'review', q:pk.q, imgs:pk.imgs, ctx:pk.ctx, draft, turn:SZ.turnNow() }) });
    d = await res.json().catch(() => null); if (!res.ok) d = null;
  }catch(e){ d = null; }
  finally{ clearTimeout(tm); ctls.delete(ctl); }
  if (d && d.limit) try{ SZ.szqSet({ used:+d.used || 0, limit:+d.limit }); }catch(e){}
  /* v3.6 · sin cuenta, la revisión cuenta en el mismo mensaje: igual se pinta lo que dice el servidor */
  if (d && /^\d+\/\d+(\/\d+)?$/.test(String(d.guest || ''))) try{ const [u, m, l] = String(d.guest).split('/'); SZ.szqSet({ guest:{ used:+u, max:+m, left:l != null ? +l : null } }); }catch(e){}
  /* si cambiaste de chat, la respuesta se borró o ya llegó otra encima, no se toca nada */
  const alive = chat.includes(msg) && msg.content === draft;
  if (!d || !alive || !d.verdict){ const c = $('.qrev', el); if (c) c.remove(); return; }
  if (d.verdict === 'ok'){ msg.rev = 'ok'; save(); if (g0 === gen && el.isConnected) revBadge(el, msg); return; }
  msg.rev = 'fix'; msg.orig = draft; msg.revNote = String(d.note || '').slice(0, 140); msg.revBy = d.by || ''; msg.content = d.text;
  touchThread(); save();
  if (g0 !== gen || !el.isConnected) return;
  const body = $('.body', el);
  el._raw = d.text; body.innerHTML = md(d.text); codeButtons(body); if (el._sources) citeLinks(body, el._sources);
  body.animate([{ opacity:.35, filter:'blur(3px)' }, { opacity:1, filter:'blur(0)' }], { duration:520, easing:'cubic-bezier(.22,1,.36,1)' });
  revBadge(el, msg);
  try{ SZ.BOT.react && SZ.BOT.react('done', { cool:120000 }); }catch(e){}
}
/* «Ver original» ↔ «Ver mejorada» */
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.qrev-o'); if (!b) return;
  const el = b.closest('.m'), m = el && chatArr()[+el.dataset.ci]; if (!m || !m.orig) return;
  const showO = b.getAttribute('aria-pressed') !== 'true', body = $('.body', el);
  body.innerHTML = md(showO ? m.orig : m.content); codeButtons(body);
  b.setAttribute('aria-pressed', String(showO)); b.textContent = showO ? RL('Ver mejorada', 'See improved') : RL('Ver original', 'See original');
});
