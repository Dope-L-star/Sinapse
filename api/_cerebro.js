/* v4.0 · El «cerebro» de las IAs conectadas (pedido de Sammuel, 3 nov 2026: «que sean inteligentes, no tan estúpidas»).
   Las IAs gratis son más pequeñas que las de pago. No se puede cambiar lo que saben, pero sí CÓMO trabajan.
   Para cada mensaje que llega a /api/ai (sin gastar ninguna IA extra):
   1) LEE el último mensaje: qué tipo de trabajo es (código, escritura, razonamiento, resumen, traducción, datos)
      con el mismo clasificador de A.L.I.A.S. (api/_ruta.js), y si es DIFÍCIL o FÁCIL.
   2) ARMA las instrucciones de sistema para ESE trabajo: la fecha de hoy (las IAs gratis no la saben y se creen en 2024),
      cómo responde un experto en eso y el formato limpio, sin relleno.
   3) En lo difícil, la IA PIENSA ANTES: plan → resolver → revisar (rehacer cálculos, probar el código en la cabeza, casos raros).
      · Las que ya piensan solas (gpt-oss, Qwen3, DeepSeek R1, Gemini) reciben más esfuerzo de razonamiento.
      · Las demás piensan dentro de <think>…</think>: la página ya lo esconde y lo muestra aparte como «lo que pensó».
      En lo fácil (un saludo, un dato corto), responde directo y rápido.
   El texto de la persona nunca se guarda aquí: solo se mira para decidir. */
import { classify } from './_ruta.js';

/* ---------- 1) ¿qué tan difícil es? ---------- */
const HARD_RX = /\b(demuestra|demostrar|prueba que|resuelve|resolver|calcula|calcular|deriva|derivada|integral|ecuaci[oó]n|probabilidad|estad[ií]stic|optimiza|complejidad|algoritmo|depura|debug|refactor|arregla (el|este|mi) (c[oó]digo|error|bug)|por qu[eé] (falla|no funciona|da error)|paso a paso|a fondo|en detalle|detallad[oa]|analiza|an[aá]lisis|compara|eval[uú]a|estrategia|plan de|dise[nñ]a|arquitectura|acertijo|l[oó]gica|razona|cu[aá]nt[oa]s?|cu[aá]nto tiempo|prove|solve|calculate|derive|equation|probability|optimi[sz]e|complexity|algorithm|refactor|fix (this|my) (code|bug)|why does|step by step|in depth|detailed|analy[sz]e|compare|evaluate|strategy|design|architecture|riddle|puzzle|how many|how much|how long|how often)\b/i;
const EASY_RX = /^\W*(hola+|holi|buenas|buen(os)? d[ií]as|buenas (tardes|noches)|hey|hi|hello|gracias|muchas gracias|thanks|thank you|ok(ay)?|vale|listo|perfecto|genial|s[ií]|no|dale|c[oó]mo est[aá]s|how are you|qu[eé] tal|chao|adi[oó]s|bye|jaja+|xd)\b[\s\W]*$/i;
const MATH_RX = /\d\s*[-+*/^×÷=]\s*\d|\d+\s*%|\b\d+(\.\d+)?\s*(km|m|kg|g|l|h|min|s|usd|cop|\$|€)\b/i;
export function difficulty(text, cat, effort){
  const s = String(text || '').trim();
  if (effort === 'low') return 'easy';
  if (!s || EASY_RX.test(s)) return 'easy';
  if (effort === 'high') return 'hard';
  if (s.length < 25 && !MATH_RX.test(s) && !HARD_RX.test(s)) return 'easy';
  const asks = (s.match(/\?/g) || []).length, code = /```|\bfunction\b|=>|\bdef |\bclass |;\s*$|<\/?\w+>/m.test(s);
  let n = 0;
  if (HARD_RX.test(s)) n += 2;
  if (MATH_RX.test(s)) n += 2;
  if (code) n += 2;
  if (asks >= 3) n += 1;
  if (s.length > 400) n += 1;
  if (s.length > 1500) n += 1;
  if (cat === 'code' || cat === 'data' || cat === 'reason') n += 1;
  return n >= 3 ? 'hard' : 'normal';
}

/* ---------- idioma (para escribir las instrucciones en el idioma de la persona) ---------- */
const EN_W = /\b(the|and|is|are|what|how|why|can|you|please|with|for|this|that|write|make|give|me|my|of|to|in|it|do|does)\b/gi;
const ES_W = /\b(el|la|los|las|que|qu[eé]|c[oó]mo|por|para|con|una?|es|son|del|me|mi|hazme|dame|escribe|puedes|esto|eso|de|en|y)\b/gi;
export function langOf(text){ const s = String(text || ''); const en = (s.match(EN_W) || []).length, es = (s.match(ES_W) || []).length; return en > es * 1.3 && en >= 2 ? 'en' : 'es'; }

/* ---------- 2) cómo responde un experto en cada tipo de trabajo ---------- */
const OFICIO = {
  es: {
    code: 'Eres un ingeniero de software sénior. Entrega código COMPLETO que funcione a la primera (nada de «…» ni «aquí va tu lógica»), en un bloque con su lenguaje, con nombres claros y solo los comentarios que ayudan. Antes del código, una o dos frases de qué hace; después, cómo usarlo. Si hay un error, di la causa exacta y el arreglo. Considera casos raros (vacío, nulos, números grandes) y no inventes funciones ni librerías.',
    write: 'Eres un escritor profesional. Escribe con voz natural y frases con ritmo, adaptado a quién lo va a leer y para qué; nada de clichés ni frases de relleno («en el mundo de hoy», «es importante destacar»). Entrega el texto listo para usar; si el pedido no dice el largo, usa el que el formato pide.',
    reason: 'Eres un analista experto. Da primero la conclusión o recomendación en una o dos frases; luego las razones más fuertes en orden, con los supuestos claros. Si hay alternativas, compáralas con criterios concretos (una tabla si ayuda) y di cuál elegirías y por qué.',
    summary: 'Eres un experto en síntesis. Arranca con la idea central en una frase; luego los puntos clave en viñetas cortas, con cifras y nombres concretos. Nada que no esté en el material; no repitas.',
    translate: 'Eres un traductor profesional. Traduce el sentido, no palabra por palabra: natural en el idioma de destino, con el mismo tono y formato. Conserva nombres propios, código y cifras. Entrega solo la traducción, salvo que te pidan explicarla.',
    data: 'Eres un experto en matemáticas y datos. Plantea el problema, resuelve paso a paso mostrando cada operación y RECALCULA cada número antes de darlo. Termina con el resultado final en negrita y con sus unidades. Usa tablas para comparar cifras.'
  },
  en: {
    code: 'You are a senior software engineer. Deliver COMPLETE code that works the first time (no "…" or "your logic here"), in a fenced block with its language, clear names and only helpful comments. Before the code, one or two sentences on what it does; after it, how to use it. For a bug, give the exact cause and the fix. Handle edge cases (empty, null, large numbers) and never invent functions or libraries.',
    write: 'You are a professional writer. Write with a natural voice and rhythm, adapted to the reader and the purpose; no clichés or filler ("in today\'s world", "it is important to note"). Deliver ready-to-use text; if no length is given, use what the format calls for.',
    reason: 'You are an expert analyst. Give the conclusion or recommendation first in one or two sentences; then the strongest reasons in order, with assumptions stated. If there are options, compare them on concrete criteria (a table if it helps) and say which you would choose and why.',
    summary: 'You are an expert at synthesis. Open with the central idea in one sentence; then the key points as short bullets with concrete figures and names. Nothing that is not in the material; no repetition.',
    translate: 'You are a professional translator. Translate the meaning, not word by word: natural in the target language, same tone and format. Keep proper names, code and numbers. Deliver only the translation unless asked to explain it.',
    data: 'You are an expert in math and data. Set up the problem, solve it step by step showing each operation and RECHECK every number before giving it. End with the final result in bold, with units. Use tables to compare figures.'
  }
};
const BASE = {
  es: d => 'Hoy es ' + d + '. Eres una IA de SymphorIA: respondes como los mejores asistentes del mundo, con precisión y criterio. '
    + 'Empieza por la respuesta (sin saludo, sin repetir la pregunta, sin «¡Claro!» ni «¡Excelente pregunta!») y luego explica lo necesario. '
    + 'Sé exacto: no inventes datos, citas, enlaces, funciones ni fuentes; si algo no lo sabes con certeza o pudo cambiar después de lo que aprendiste, dilo en una frase. '
    + 'Si la pregunta es ambigua, elige la lectura más probable, dilo en una frase y responde. Mantén el hilo: usa lo que ya se dijo en esta conversación. '
    + 'Formato: Markdown limpio (títulos cortos solo si la respuesta es larga, listas, tablas al comparar, código en bloques con su lenguaje). El largo justo: completo pero sin relleno ni despedidas. '
    + 'Responde en el idioma de la persona.',
  en: d => 'Today is ' + d + '. You are a SymphorIA AI: you answer like the best assistants in the world, with precision and judgment. '
    + 'Start with the answer (no greeting, no restating the question, no "Sure!" or "Great question!") and then explain what is needed. '
    + 'Be accurate: never invent data, quotes, links, functions or sources; if you are not sure, or it may have changed after your training, say so in one sentence. '
    + 'If the question is ambiguous, pick the most likely reading, say so in one sentence and answer. Keep the thread: use what was already said in this conversation. '
    + 'Format: clean Markdown (short headings only for long answers, lists, tables when comparing, code in fenced blocks with the language). The right length: complete but no filler or sign-offs. '
    + 'Answer in the person\'s language.'
};
const RAPIDO = {
  es: 'Esto es sencillo: responde directo y breve, en una a tres frases, con calidez.',
  en: 'This is simple: answer directly and briefly, in one to three sentences, warmly.'
};
/* pensar antes: para las IAs que NO razonan solas, el razonamiento va dentro de <think> (la página lo esconde y lo muestra aparte) */
const PENSAR_TAG = {
  es: 'ES DIFÍCIL, así que piensa antes de responder. Escribe PRIMERO tu razonamiento dentro de <think> y </think>: 1) qué pide exactamente y qué datos hay; 2) un plan; 3) resuélvelo paso a paso; 4) REVÍSALO: rehaz los cálculos por otro camino, prueba el código con un ejemplo en la cabeza, busca casos raros y contradicciones, y corrige lo que esté mal. '
    + 'Cierra </think> y DESPUÉS escribe la respuesta final limpia para la persona (sin mencionar el razonamiento).',
  en: 'THIS IS HARD, so think before answering. FIRST write your reasoning inside <think> and </think>: 1) what exactly is asked and what data there is; 2) a plan; 3) solve it step by step; 4) CHECK it: redo calculations another way, run the code on an example in your head, look for edge cases and contradictions, and fix anything wrong. '
    + 'Close </think> and THEN write the clean final answer for the person (without mentioning the reasoning).'
};
const PENSAR_SOLA = {
  es: 'ES DIFÍCIL: razona con cuidado paso a paso antes de responder y revisa tu resultado (rehaz los cálculos, prueba el código con un ejemplo, busca casos raros). En la respuesta final, muestra los pasos clave, no todo el borrador.',
  en: 'THIS IS HARD: reason carefully step by step before answering and check your result (redo calculations, run the code on an example, look for edge cases). In the final answer, show the key steps, not the whole draft.'
};

/* ---------- 3) las que ya piensan solas y cómo pedirles más esfuerzo ---------- */
export const NATIVE_REASON = /gpt-oss|qwen3(?!-?coder)|deepseek-r1|qwq|glm-z1|magistral|gemini-(2\.5|[3-9])|gemini-flash-latest|gemini-flash-lite-latest|phi-4-reasoning|\br1\b/i;
/* parámetros extra que cada proveedor entiende (solo a los modelos que los aceptan: a otros les daría error 400) */
export function reasonParams(prov, mid, level){
  const id = String(mid || '');
  if (level !== 'hard' && level !== 'easy') return {};
  if (prov === 'groq' && /gpt-oss/i.test(id)) return { reasoning_effort:level === 'hard' ? 'high' : 'low' };
  if (prov === 'groq' && /qwen3/i.test(id)) return level === 'hard' ? { reasoning_effort:'default', reasoning_format:'parsed' } : { reasoning_effort:'none' };
  if (prov === 'google' && /gemini-(2\.5|[3-9])|flash-latest|flash-lite-latest/i.test(id)) return { reasoning_effort:level === 'hard' ? 'high' : 'low' };
  if (prov === 'openrouter' && NATIVE_REASON.test(id) && level === 'hard') return { reasoning:{ effort:'high' } };
  return {};
}

/* fecha de hoy en Colombia, escrita como persona («martes, 3 de noviembre de 2026») */
export function hoy(lang, now = new Date()){
  try{ return now.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'America/Bogota' }); }
  catch(e){ return now.toISOString().slice(0, 10); }
}

const textOf = m => !m ? '' : typeof m.content === 'string' ? m.content : Array.isArray(m.content) ? m.content.filter(p => p && p.type === 'text').map(p => p.text).join('\n') : '';
/* lo que se usa para decidir: la pregunta de la persona, sin los resultados de búsqueda ni los archivos que la página pegó debajo */
export function askOf(messages){
  const u = [...(Array.isArray(messages) ? messages : [])].reverse().find(m => m && m.role === 'user');
  return textOf(u).split(/\n\n---\nResultados de una búsqueda|\n\n\[Archivo adjunto/)[0].slice(0, 4000);
}
const CONTINUA = /^contin[uú]a exactamente donde te quedaste|^continue exactly where you (left|stopped)/i;

/* todo junto: lo que se decide de UN mensaje */
export function leer(messages, o = {}){
  const ask = askOf(messages), lang = o.lang || langOf(ask);
  if (CONTINUA.test(ask.trim())) return { cat:'write', level:'normal', lang, ask, cont:true };
  const hasFile = /\[Archivo adjunto/.test(textOf([...(messages || [])].reverse().find(m => m && m.role === 'user')));
  let cat = classify(ask + (hasFile && /resum|summar/i.test(ask) ? ' resumen' : ''), '', false);
  if (cat === 'plan') cat = 'reason';
  if (cat === 'reason' && MATH_RX.test(ask)) cat = 'data';   /* con números y operaciones, es un problema de cálculo */
  const level = difficulty(ask, cat, o.effort);
  return { cat, level, lang, ask, cont:false };
}
/* las instrucciones de sistema para ESE mensaje y ESA IA (mid = el modelo que va a responder) */
export function sistema(L, prov, mid, o = {}){
  const lang = L.lang === 'en' ? 'en' : 'es', parts = [BASE[lang](hoy(lang, o.now))];
  if (L.cont) return parts[0];
  if (L.level === 'easy'){ parts.push(RAPIDO[lang]); return parts.join(' '); }
  parts.push(OFICIO[lang][L.cat] || OFICIO[lang].reason);
  if (L.level === 'hard' && !o.short) parts.push(NATIVE_REASON.test(String(mid || '')) ? PENSAR_SOLA[lang] : PENSAR_TAG[lang]);
  return parts.join(' ');
}
/* temperatura: precisa en código y cálculos, más suelta al escribir */
export function temperatura(L){ return L.level === 'easy' ? .5 : { code:.2, data:.15, reason:.35, summary:.3, translate:.25, write:.75 }[L.cat] ?? .5; }
