/* ---------- v4.0 · Títulos con sentido y memoria con lógica (pedido de Sammuel, 3 nov 2026) ----------
   La IA que responde hace dos trabajitos más, en la misma respuesta (sin gastar otra IA):
   1) TÍTULO: al final escribe [titulo: …] con el tema real del chat en 2 a 6 palabras. Se le dice el título actual:
      si el tema sigue igual, lo repite (el título no cambia en cada mensaje); si el tema cambió de verdad
      (dejó los documentos y ahora pide una web), escribe uno nuevo. Un saludo solo → «-» (queda «Charla nueva»).
      Si tú le pusiste el nombre al chat a mano, la IA nunca lo cambia.
   2) MEMORIA: si pides «recuerda…», la IA saca el dato real y lo redacta corto y en tercera persona: [recordar: Se llama Ana.]
      Si no está claro qué recordar, escribe [recordar: ?] y te pregunta. La página te pregunta «¿Lo recuerdo?» como antes,
      y si ya había algo parecido (otro nombre, otra ciudad) se ACTUALIZA en vez de duplicarse (memAddCore en core 14).
   Las marcas nunca se ven: se quitan mientras la respuesta llega. */
/* v4.1 · la marca se reconoce aunque la IA la escriba con espacios «[ titulo: - ]», escapada «\[titulo: …\]»,
   en negrita «**[titulo: …]**», entre comillas invertidas o con «=» o «：» (antes se colaba en la respuesta visible) */
const MK_RX = /\s*(?:\*\*|__|`)?\\?\[\s*(titulo|título|title|recordar|remember)\s*[:=：]\s*([^\]\n]{0,240}?)\s*\\?\](?:\*\*|__|`)?/gi;
/* mientras llega: también se esconde una marca a medio escribir al final («[tit…», «[ titulo: Ide…») */
const MK_TAIL = /\s*(?:\*\*|__|`)?\\?\[\s*(?:t(?:[ií](?:t(?:u(?:l(?:o)?)?|l(?:e)?)?)?)?|r(?:e(?:c(?:o(?:r(?:d(?:a(?:r)?)?)?)?)?|m(?:e(?:m(?:b(?:e(?:r)?)?)?)?)?)?)?)?(?:\s*[:=：][^\]\n]*)?$/i;
const sinMarcas = t => String(t || '').replace(MK_RX, '').replace(MK_TAIL, '');
/* para lo ya guardado (historial, copiar, exportar): solo marcas completas, sin tocar un final cualquiera */
const quitaMarcas = t => String(t || '').replace(MK_RX, '').replace(/\s+$/, '');
function marcas(t){
  let title = null, mem = null;
  const text = String(t || '').replace(MK_RX, (m, k, v) => { v = v.replace(/^["'«“\s]+|["'»”\s]+$/g, '').trim(); if (/^t/i.test(k)){ if (title == null) title = v.replace(/[.\s]+$/, ''); } else if (mem == null) mem = v === '?' || !v ? v : /[.!?]$/.test(v) ? v : v + '.'; return ''; }).replace(MK_TAIL, '').trim();
  return { text, title, mem };
}
/* lo que se le pide a la IA (va en el mensaje de sistema de apiMsgs) */
function marcasSystem(chat){
  const e = thMeta(thModel(), curT(), false), cur = e && e.title && !e.auto0 ? e.title : '', en = SZ.lang() === 'en';
  const lu = [...chat].reverse().find(m => m.role === 'user'), q = lu ? String(lu.ask || lu.content || '') : '';
  let s = (en ? 'At the very end of your answer add one line: [titulo: the real topic of THIS chat in 2 to 6 words, in the chat\'s language, no quotes] (for example [titulo: Website for a bakery]). '
              : 'Al final de tu respuesta agrega una línea: [titulo: el tema real de ESTE chat en 2 a 6 palabras, en el idioma del chat, sin comillas] (por ejemplo [titulo: Página web para una panadería]). ')
    + (cur ? (en ? 'The current title is «' + cur + '»: if the topic is still the same, repeat it exactly; change it only if the topic really changed. ' : 'El título actual es «' + cur + '»: si el tema sigue siendo el mismo, repítelo exacto; cámbialo solo si el tema de verdad cambió. ') : '')
    + (en ? 'If so far it is only a greeting or small talk, write [titulo: -]. Never mention this line.' : 'Si hasta ahora solo es un saludo o charla, escribe [titulo: -]. Nunca menciones esta línea.');
  if (MEM_RX.test(q)) s += en
    ? ' The person asked you to remember something: confirm it in one sentence and add on the last line [recordar: the fact rewritten short and clear in third person, without "remember that", e.g. Is called Ana and studies design.]. If it is not clear what to remember, ask, and write [recordar: ?].'
    : ' La persona te pidió recordar algo: confírmalo en una frase y agrega en la última línea [recordar: el dato reescrito corto y claro en tercera persona, sin «recuerda que», por ejemplo Se llama Ana y estudia diseño.]. Si no está claro qué recordar, pregúntale y escribe [recordar: ?].';
  return s;
}
/* sin marca (o con «-»): un título sacado del primer mensaje que no sea un saludo */
const SALUDO = /^\W*((hola+|holi|buenas|buen(os)? d[ií]as|buenas (tardes|noches)|hey|hi|hello|qu[eé] (tal|m[aá]s|onda)|c[oó]mo (est[aá]s|vas|va todo)|how are you|what'?s up|gracias|thanks|ok|vale|listo)[\s,.!?¡¿]*)+/i;
function titleLocal(chat){
  const en = SZ.lang() === 'en';
  for (const m of chat || []){
    if (m.role !== 'user') continue;
    let t = String(m.ask || m.content || '').replace(/\s+/g, ' ').trim().replace(SALUDO, '').replace(/^(por favor|please|oye|mira|necesito que|quiero que|puedes|podr[ií]as|can you|could you|i want you to|me ayudas a|ay[uú]dame a)\s+/i, '').replace(/^[\s,.!?¡¿]+/, '');
    if (t.length < 4) { if (m.files && m.files[0]) return (en ? 'File: ' : 'Archivo: ') + m.files[0].name.slice(0, 40); continue; }
    const words = t.split(' '); t = words.slice(0, 7).join(' ').replace(/[\s,.;:!?¡¿]+$/, '');
    return t.charAt(0).toUpperCase() + t.slice(1) + (words.length > 7 ? '…' : '');
  }
  return en ? 'New chat' : 'Charla nueva';
}
/* pone el título que dio la IA en el chat donde respondió (no en el que estés mirando si cambiaste) */
function titleSet(chat, title){
  const k = Object.keys(st().chats).find(x => st().chats[x] === chat); if (!k) return;
  const { model, id } = parseKey(k), e = thMeta(model, id, true); if (e.manual) return;
  const t = String(title || '').replace(/[*_`#"«»“”]/g, '').replace(/\s+/g, ' ').trim().replace(/[.,;:!?]+$/, '');
  const fromAi = !!t && t !== '-' && t.length >= 3;
  if (!fromAi && e.title && !e.auto0) return;   /* ya tenía un título con sentido: un «-» no lo borra */
  const next = fromAi ? t.charAt(0).toUpperCase() + t.slice(1, 60) : titleLocal(chat);
  if (next === e.title && !!e.auto0 === !fromAi) return;
  e.title = next; if (fromAi) delete e.auto0; else e.auto0 = true; save(); renderThBtn();
}
/* «recuerda que me llamo Ana» → «Se llama Ana.» si la IA no dio el dato redactado */
function memLimpia(fact){
  let s = String(fact || '').replace(/\s+/g, ' ').trim().replace(/^(que|de que|esto|:)\s+/i, '').replace(/^(that|this|:)\s+/i, '');
  const R = [[/\bme llamo\b/gi, 'se llama'], [/\bll[aá]mame\b/gi, 'quiere que le digan'], [/\bdime\b/gi, 'quiere que le digan'], [/\bsoy\b/gi, 'es'], [/\bestoy\b/gi, 'está'], [/\btengo\b/gi, 'tiene'], [/\bvivo\b/gi, 'vive'],
    [/\btrabajo\b/gi, 'trabaja'], [/\bestudio\b/gi, 'estudia'], [/\bprefiero\b/gi, 'prefiere'], [/\bquiero\b/gi, 'quiere'], [/\bnecesito\b/gi, 'necesita'], [/\bhablo\b/gi, 'habla'], [/\bme gustan\b/gi, 'le gustan'], [/\bme gusta\b/gi, 'le gusta'],
    [/\bmis\b/gi, 'sus'], [/\bmi\b/gi, 'su'], [/\byo\s+/gi, ''], [/\bmy name is\b/gi, 'name is'], [/\bcall me\b/gi, 'wants to be called'], [/\bI am\b|\bI'm\b/g, 'is'], [/\bI live\b/g, 'lives'], [/\bI work\b/g, 'works'], [/\bI study\b/g, 'studies'],
    [/\bI like\b/g, 'likes'], [/\bI prefer\b/g, 'prefers'], [/\bI have\b/g, 'has'], [/\bI need\b/g, 'needs'], [/\bmy\b/gi, 'their']];
  for (const [rx, to] of R) s = s.replace(rx, to);
  s = s.replace(/\s+/g, ' ').trim().replace(/[\s,;:]+$/, '');
  if (!s) return '';
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return /[.!?]$/.test(s) ? s : s + '.';
}
let memNext = null;   /* el dato que redactó la IA en la última respuesta (lo usa memOffer) */
