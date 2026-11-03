/* ---------- v3.4 · Calidad de las respuestas (pedido de Sammuel, 28 oct) ----------
   Dos pasos, para que todas las IAs respondan con lógica y se entiendan:
   1) qualitySystem(): unas instrucciones cortas de «experto» que viajan con cada mensaje (las pone apiMsgs).
   2) qualityAfter(): cuando termina la respuesta, otra IA (la que mejor razona entre las gratis; con fotos, una que ve)
      la revisa: lógica, cálculos, datos, que responda lo pedido y lo que se ve en las fotos.
      Si está bien → «✓ Revisada». Si tiene errores → la respuesta se cambia por la corregida («✨ Mejorada» · Ver original).
      Tiene 28 s como máximo; si tarda más o falla, se queda la respuesta de antes (nunca se pierde nada).
   Se apaga en Ajustes › IAs y memoria › «Revisión de calidad». Las instrucciones del revisor viven en el servidor (api/ai.js). */
function qualitySystem(saver){
  if (saver) return 'Piensa en silencio antes de responder; revisa cálculos y lógica. No inventes datos.';
  return 'Responde como un experto de primer nivel en el tema. Antes de escribir, piensa en silencio qué pide de verdad la persona y cuál es la mejor respuesta.'
    + ' Empieza por la respuesta directa (sin saludos ni relleno) y luego explica lo necesario en orden lógico, paso a paso cuando ayude.'
    + ' Rehaz cada cálculo antes de darlo y comprueba que no te contradigas. No inventes datos, citas, enlaces ni funciones: si algo no lo sabes o depende de información que no tienes, dilo claro.'
    + ' Si la pregunta se puede entender de varias formas, elige la más probable, dilo en una frase y responde.'
    + ' Usa Markdown limpio: títulos cortos, listas, tablas cuando compares y bloques de código con su lenguaje.'
    + ' Si hay imágenes o archivos, básate en lo que de verdad se ve o dice en ellos y menciona detalles concretos.'
    + ' Responde siempre en el idioma en que te escribe la persona.';
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
