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
   El texto de la persona nunca se guarda aquí: solo se mira para decidir.
   v4.5 · CÓDIGO Y ARCHIVOS (pedido de Sammuel, 9 nov 2026: «las IAs para programar y crear archivos son fatales»).
   Antes casi ningún pedido de programar se reconocía como código («hazme una calculadora» salía como cálculo fácil y se contestaba en 3 frases,
   «crea una landing page» como análisis, «cámbiale el color a azul» como charla corta). Ahora leer() distingue el TRABAJO (job):
     build = armar algo nuevo (página, app, juego, script) · edit = cambiar algo que ya se dio · fix = arreglo tras probar la página ·
     cont = seguir una respuesta cortada · file = crear un archivo (csv, json, svg, readme…) · debug = encontrar un error · explain = hablar de código.
   Cada trabajo lleva su manual (un solo manual, aquí en el servidor: el navegador ya no añade el suyo), su tope de respuesta y su temperatura. */
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

/* ---------- 1b) ¿es un pedido de código o de un archivo? ---------- */
/* palabras que casi siempre hablan de programar (espejo de CODE_RX en src/chat/02b-codigo-pro.js; t/cerebro/codigo.mjs comprueba que sigan iguales) */
export const CODE_RX_SRC = '```|c[oó]digo|program(?:a|ar|ming|aci[oó]n)|\\bscripts?\\b|\\bhtml5?\\b|\\bcss3?\\b|javascript|\\bjs\\b|typescript|python|\\bjava\\b|c\\+\\+|c#|\\bphp\\b|\\bsql\\b|react|\\bvue\\b|svelte|next\\.?js|node(?:\\.?js)?|django|flask|fastapi|\\bapi\\b|\\bbug|depura|debug|compil|algoritmo|regex|base de datos|backend|frontend|terminal|\\bbash\\b|\\bjson\\b|tailwind|flutter|kotlin|swift|\\brust\\b|golang|arduino|macro|github|\\bgit\\b|docker|\\bnpm\\b|\\bpip\\b|traceback|syntaxerror|typeerror';
const TECH_RX = new RegExp(CODE_RX_SRC, 'i');
/* verbos de «hazme / build» y cosas que se programan */
const V_STRONG = 'dib[uú]ja(?:me)?|dibujar|draw|haz|hazme|hacer|haga|cr[eé]a|cr[eé]ame|crear|genera|g[eé]nerame|generar|programa|progr[aá]mame|programar|codifica|escribe|escr[ií]beme|escribir|arma|arm[aá]me|armar|construye|constr[uú]yeme|construir|desarrolla|desarr[oó]llame|desarrollar|implementa|implementar|dis[eé][nñ]a|dis[eé][nñ]ame|dis[eé][nñ]ar|monta|montar|make|build|create|generate|write|code|develop|implement|design';
const V_WEAK = 'dame|quiero|necesito|me ayudas a (?:hacer|crear|armar|programar)|ay[uú]dame a (?:hacer|crear|armar|programar)|puedes (?:hacer|crear|armar|programar)|give me|i need|i want|help me (?:make|build|create|write|code)|can you (?:make|build|create|write|code)';
const T_WEB = 'p[aá]gina web|p[aá]ginas web|sitio web|web ?app|webapp|website|web ?page|landing(?: page)?|p[aá]gina de (?:inicio|aterrizaje|ventas|contacto|producto|presentaci[oó]n)|portafolio web|portfolio (?:site|website|page)|tienda (?:en l[ií]nea|online|virtual)|e-?commerce|online store|dashboard|panel de (?:control|administraci[oó]n)|admin panel|aplicaci[oó]n|app|juego|videojuego|game|calculadora|calculator|conversor|converter|cron[oó]metro|stopwatch|temporizador|timer|reloj (?:digital|anal[oó]gico)|lista de tareas|to-?do(?: list| app)?|kanban|formulario|chat ?bot|chat ?app|quiz|trivia|piano|metr[oó]nomo|snake|serpiente|tetris|buscaminas|ajedrez|tres en raya|3 en raya|animaci[oó]n (?:css|web|en css|con css|js)';
const T_PROG = 'script|programa(?! de (?:entrenamiento|ejercicio|estudio|dieta|alimentaci|televisi|radio|tv|fidelidad|actividades|gobierno|trabajo|capacitaci|formaci|becas|mentor|reuniones|evento))|program|bot|api|backend|frontend|servidor|server|funci[oó]n(?! (?:matem[aá]tica|cuadr[aá]tica|lineal|exponencial|logar[ií]tmica|trigonom))|function|componente|component|m[oó]dulo|librer[ií]a|scraper|crawler|plugin|widget|extensi[oó]n (?:de|para) (?:chrome|firefox|edge|vscode|navegador)|(?:chrome|browser) extension|generador|generator|simulador|simulator|prototipo|prototype|mvp|software|application';
const T_FILE = 'archivo|fichero|file|csv|json|xml|ya?ml|toml|svg|markdown|readme|\\.md\\b|\\btxt\\b|excel|xlsx?|hoja de c[aá]lculo|spreadsheet|\\bun word\\b|word doc(?:ument)?|documento (?:de|en) word|\\bdocx?\\b|pdf|dockerfile|gitignore|requirements';
const BUILD_RX = new RegExp('\\b(?:' + V_STRONG + ')\\b[^.\\n?!]{0,60}?\\b(?:' + T_WEB + '|' + T_PROG + ')\\b|\\b(?:' + V_WEAK + ')\\b[^.\\n?!]{0,40}?\\b(?:p[aá]gina web|sitio web|landing|aplicaci[oó]n|app|script|bot|api|calculadora|website|web ?app|web ?page|game|function|funci[oó]n)\\b', 'i');
const FILE_RX = new RegExp('\\b(?:' + V_STRONG + '|' + V_WEAK + ')\\b[^.\\n?!]{0,50}?(?:\\b(?:' + T_FILE + ')\\b|\\.(?:md|csv|json|txt|svg|xml|ya?ml)\\b)', 'i');
const EDIT_RX = /\b(c[aá]mbia(?:le|lo|la|r)?|cambi[aá]ndole|agr[eé]ga(?:le|lo|la|r)?|a[nñ][aá]de(?:le|lo|la|r)?|a[nñ]adir|pon(?:le|lo|la|er)?|quita(?:le|lo|la|r)?|qu[ií]tale|elimina(?:le|lo|r)?|borra(?:le|lo|r)?|mejora(?:le|lo|la|r)?|mej[oó]ralo|corrige(?:lo|la|r)?|arregla(?:lo|la|r)?|ajusta(?:lo|la|r)?|modifica(?:lo|la|r)?|actualiza(?:lo|la|r)?|refactoriza|optimiza|simplifica|traduce(?:lo|la)?|renombra|reemplaza|sustituye|hazlo|hazla|haz que|que (?:se vea|sea|tenga|use|muestre|guarde|no)|m[aá]s (?:grande|peque[nñ]o|corto|largo|r[aá]pido|bonito|moderno|limpio|simple)|otro color|add|change|remove|fix|update|replace|rename|translate|improve|refactor|optimi[sz]e|simplify|make it|make the|now make|also add)\b/i;
const QUESTION_RX = /^\W*(?:¿\s*)?(?:qué|que(?=[^\n]*\?)|c[oó]mo|por qu[eé]|para qu[eé]|cu[aá]l(?:es)?|d[oó]nde|cu[aá]ndo|expl[ií]ca|expl[ií]came|what|how|why|where|when|which|explain|does|is)\b/i;
const PROBLEM_RX = /\b(error|falla|fallo|bug|no funciona|no sirve|arregla|por qu[eé]|se rompe|excepci[oó]n|exception|traceback|fix|broken|not working|doesn'?t work|why)\b/i;
/* espejo para el navegador (src/chat/02b-codigo-pro.js · CODE_ASK_SRC): las IAs de Puter/OpenRouter no pasan por aquí, y la página necesita saber igual si es un pedido de código */
export const CODE_ASK_SRC = BUILD_RX.source + '|' + FILE_RX.source;
const FIX_TAG = '[Revisión automática de SynthFlow]';
const codeBlocks = t => (String(t || '').match(/```/g) || []).length;
const lastWithCode = messages => { for (let i = (messages || []).length - 1; i >= 0; i--){ const m = messages[i]; if (m && m.role === 'assistant' && /```[\s\S]{40,}/.test(textOf(m))) return textOf(m); } return ''; };
/* trabajos que producen archivos largos: necesitan el manual de archivos, respuesta larga y poca temperatura */
export const LONG_JOBS = new Set(['build', 'edit', 'fix', 'cont', 'file']);
/* ¿un pedido grande? (para usar un modelo grande si hay cupo) */
const BIG_HINT = /\b(completa?|completo|profesional|modern[oa]|espectacular|avanzad[oa]|con (?:login|usuarios|base de datos|backend|varias|m[uú]ltiples)|full|complete|advanced|professional|with (?:login|users|a database|backend|multiple))\b/i;
export function jobOf(messages, ask, cont){
  const t = String(ask || '').trim(), prev = lastWithCode(messages);
  if (t.startsWith(FIX_TAG)) return 'fix';
  if (cont){ const lastA = [...(messages || [])].reverse().find(m => m && m.role === 'assistant'); return lastA && /```/.test(textOf(lastA)) ? 'cont' : ''; }
  if (!t || EASY_RX.test(t)) return '';
  if (/```[\s\S]{30,}/.test(t) && PROBLEM_RX.test(t)) return 'debug';
  if (BUILD_RX.test(t)) return 'build';
  if (FILE_RX.test(t)) return 'file';
  if (prev){
    if (EDIT_RX.test(t) && !/^\W*(?:¿\s*)?(?:qué|que(?=[^\n]*\?)|por qu[eé]|para qu[eé]|what|why)\b/i.test(t)) return 'edit';
    if (t.length <= 100 && !/[?¿]/.test(t) && !QUESTION_RX.test(t) && !/^\W*(hola|hey|hi|hello|buen[oa]s|gracias|thanks|thank you|me llamo|soy |mi nombre)/i.test(t)) return 'edit';
  }
  /* palabras de programar suelta: solo es de código si lo que domina es el código (no «traduce: me encanta programar») */
  if (TECH_RX.test(t) && classify(t, '', false) === 'code'){ if (PROBLEM_RX.test(t) && /```|traceback|syntaxerror|typeerror|error:/i.test(t)) return 'debug'; return 'explain'; }
  return '';
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
/* parámetros extra que cada proveedor entiende (solo a los modelos que los aceptan: a otros les daría error 400).
   v4.5 · en los trabajos de código largos (job) el razonamiento va corto: lo que piensa una IA gasta el mismo tope que el código y lo deja cortado */
export function reasonParams(prov, mid, level, job = ''){
  const id = String(mid || '');
  if (LONG_JOBS.has(job)){
    if (prov === 'groq' && /gpt-oss/i.test(id)) return { reasoning_effort:'low' };
    if (prov === 'groq' && /qwen3/i.test(id)) return { reasoning_effort:'none' };
    if (prov === 'google' && /gemini-(2\.5|[3-9])|flash-latest|flash-lite-latest/i.test(id)) return { reasoning_effort:job === 'build' ? 'medium' : 'low' };
    return {};
  }
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

/* el idioma de la persona en una charla de código: el de lo último que escribió ELLA (no el «Continúa…» ni el aviso de arreglo que pone la página) */
function langOfChat(messages, ask){
  const us = (messages || []).filter(m => m && m.role === 'user').map(m => askOf([m])).filter(t => t && !CONTINUA.test(t.trim()) && !t.startsWith(FIX_TAG));
  return langOf(us.length ? us[us.length - 1] : ask);
}
/* todo junto: lo que se decide de UN mensaje.
   job = qué trabajo es de código ('' si no lo es) · code = trabajo que entrega archivos largos (manual de archivos, respuesta larga) · big = pedido grande */
export function leer(messages, o = {}){
  const ask = askOf(messages), cont = CONTINUA.test(ask.trim());
  const job = jobOf(messages, ask, cont), lang = o.lang || (job ? langOfChat(messages, ask) : langOf(ask));
  if (job){
    const code = LONG_JOBS.has(job);
    const level = job === 'debug' || o.effort === 'high' ? 'hard' : job === 'explain' ? difficulty(ask, 'code', o.effort) : 'normal';
    return { cat:'code', level, lang, ask, cont:job === 'cont', job, code, big:level === 'hard' || (job === 'build' && (ask.length >= 80 || BIG_HINT.test(ask))) };
  }
  if (cont) return { cat:'write', level:'normal', lang, ask, cont:true, job:'', code:false, big:false };
  const hasFile = /\[Archivo adjunto/.test(textOf([...(messages || [])].reverse().find(m => m && m.role === 'user')));
  let cat = classify(ask + (hasFile && /resum|summar/i.test(ask) ? ' resumen' : ''), '', false);
  if (cat === 'plan') cat = 'reason';
  if (cat === 'reason' && MATH_RX.test(ask)) cat = 'data';   /* con números y operaciones, es un problema de cálculo */
  const level = difficulty(ask, cat, o.effort);
  return { cat, level, lang, ask, cont:false, job:'', code:false, big:level === 'hard' };
}

/* ---------- el manual de archivos y código (uno solo: vive aquí, el navegador ya no añade el suyo a las IAs conectadas) ---------- */
const CODIGO = {
  es: [
    'ARCHIVOS Y CÓDIGO. En SymphorIA cada archivo que escribes aparece como una tarjeta (Ver, Vista previa, Descargar) y las páginas HTML se prueban solas en un navegador, en computador y en celular. Por eso:',
    '1. UN BLOQUE POR ARCHIVO, con cerca y lenguaje (```html, ```python, ```csv, ```json, ```svg, ```markdown…). Justo ANTES de cada bloque, en su propia línea, el nombre del archivo en negrita, por ejemplo **index.html**. Un archivo = un nombre = un bloque; nunca partas un archivo en varios bloques.',
    '2. ARCHIVOS COMPLETOS, de la primera a la última línea, listos para guardar y abrir. Prohibido «...», «// resto igual», «aquí va tu código», TODO o «sin cambios».',
    '3. NO PREGUNTES. Si el pedido es vago, elige lo más razonable, dilo en una frase y entrega.',
    '4. ESTRUCTURA: una frase antes del código (qué haces y qué decidiste), el o los archivos, y al final 2 a 4 líneas con cómo abrirlo o correrlo. Sin planes largos ni relleno: el espacio de tu respuesta es limitado y es para el código.',
    '5. TAMAÑO: tu respuesta tiene un tope de largo. Una página o app completa va en UN solo index.html (CSS en <style>, JS en <script>) de unas 300 a 600 líneas: CSS compacto con variables y sin reglas repetidas, JS sin comentarios de relleno, sin imágenes en base64 ni SVG enormes. Si el pedido es gigante, entrega primero una versión completa y funcional más pequeña y ofrece ampliarla.',
    '6. REVÍSATE antes de cerrar: etiquetas y llaves cerradas, variables definidas antes de usarse, ids y clases iguales en HTML, CSS y JS, casos borde (vacío, cero, error) y que todo lo que prometiste esté hecho.',
    'WEB',
    '- Sin imágenes de internet ni librerías externas (se rompen en la vista previa): íconos en SVG en línea o emoji, fondos con degradados CSS. Solo si de verdad hace falta una librería, UNA desde cdnjs.cloudflare.com con versión fija.',
    '- Debe verse como un producto real de 2026: variables CSS en :root (un color de acento + neutros), tipografía system-ui, espacios en múltiplos de 8px, bordes redondeados, sombras suaves, hover y :focus-visible, transiciones de 150 a 300 ms, textos reales (nunca lorem ipsum), mobile-first, sin scroll horizontal en 360px y botones táctiles de 44px.',
    '- Accesible: HTML semántico, <html lang>, <meta name="viewport">, <title>, labels y alt, contraste 4.5:1, usable con teclado.',
    '- JavaScript moderno: const/let, addEventListener (nada de onclick en el HTML), textContent en vez de innerHTML con texto de la persona, localStorage dentro de try/catch, todo en un <script> al final del <body>.',
    'OTROS LENGUAJES Y ARCHIVOS',
    '- Python: se ejecuta tal cual (if __name__ == "__main__":), PEP 8, biblioteca estándar si se puede (si no, di el pip install), errores concretos con mensajes claros. Node, Java, C y demás: igual de completo, con cómo correrlo.',
    '- CSV: encabezado, comas, UTF-8 y TODAS las filas pedidas (cuéntalas). JSON: siempre válido (sin comentarios ni comas finales). SVG: con xmlns y viewBox. Markdown: limpio y con títulos.',
    '- Excel, Word o PDF: SymphorIA entrega texto descargable. Dilo en media frase y entrega el equivalente: Excel → .csv (se abre en Excel y Google Sheets); Word → .md o .html con buen formato; PDF → una página .html lista para imprimir (Ctrl+P → Guardar como PDF).',
    '- Seguridad: nunca claves ni contraseñas en el código; consultas SQL con parámetros.'
  ].join('\n'),
  en: [
    'FILES AND CODE. In SymphorIA every file you write shows up as a card (View, Preview, Download) and HTML pages are tested automatically in a real browser, on desktop and on a phone. So:',
    '1. ONE BLOCK PER FILE, with a fence and language (```html, ```python, ```csv, ```json, ```svg, ```markdown…). Right BEFORE each block, on its own line, the file name in bold, for example **index.html**. One file = one name = one block; never split a file into several blocks.',
    '2. COMPLETE FILES, from the first line to the last, ready to save and open. Never "...", "// rest stays the same", "your code here", TODO or "unchanged".',
    '3. DO NOT ASK QUESTIONS. If the request is vague, pick the most reasonable option, say so in one sentence and deliver.',
    '4. STRUCTURE: one sentence before the code (what you are doing and what you decided), the file(s), and at the end 2 to 4 lines on how to open or run it. No long plans or filler: your answer has limited space and it is for the code.',
    '5. SIZE: your answer has a length limit. A complete page or app goes in ONE index.html (CSS in <style>, JS in <script>) of about 300 to 600 lines: compact CSS with variables and no repeated rules, JS without filler comments, no base64 images or huge SVGs. If the request is huge, deliver a smaller but complete and working version first and offer to expand it.',
    '6. CHECK YOURSELF before finishing: tags and braces closed, variables defined before use, matching ids and classes across HTML, CSS and JS, edge cases (empty, zero, error) and everything you promised is done.',
    'WEB',
    '- No images from the internet and no external libraries (they break in the preview): inline SVG icons or emoji, CSS gradient backgrounds. Only if a library is truly needed, ONE from cdnjs.cloudflare.com with a pinned version.',
    '- It must look like a real 2026 product: CSS variables on :root (one accent color + neutrals), system-ui type, spacing in multiples of 8px, rounded corners, soft shadows, hover and :focus-visible, 150-300 ms transitions, real copy (never lorem ipsum), mobile-first, no horizontal scroll at 360px and 44px touch targets.',
    '- Accessible: semantic HTML, <html lang>, <meta name="viewport">, <title>, labels and alt text, 4.5:1 contrast, keyboard friendly.',
    '- Modern JavaScript: const/let, addEventListener (no inline onclick), textContent instead of innerHTML with user text, localStorage inside try/catch, everything in one <script> at the end of <body>.',
    'OTHER LANGUAGES AND FILES',
    '- Python: runs as is (if __name__ == "__main__":), PEP 8, standard library when possible (otherwise say the pip install), specific errors with clear messages. Node, Java, C and the rest: equally complete, with how to run it.',
    '- CSV: header row, commas, UTF-8 and ALL the requested rows (count them). JSON: always valid (no comments or trailing commas). SVG: with xmlns and viewBox. Markdown: clean, with headings.',
    '- Excel, Word or PDF: SymphorIA delivers downloadable text. Say so in half a sentence and deliver the equivalent: Excel → .csv (opens in Excel and Google Sheets); Word → .md or .html with good formatting; PDF → an .html page ready to print (Ctrl+P → Save as PDF).',
    '- Security: never keys or passwords in code; parameterized SQL queries.'
  ].join('\n')
};
const CODIGO_CORTO = {
  es: 'ARCHIVOS Y CÓDIGO (modo ahorro). Cada archivo va en su propio bloque con lenguaje, con su nombre en negrita en la línea de antes (**index.html**). Entrégalo COMPLETO y funcional (nunca «...», TODO ni partes omitidas). Una página web = un solo index.html con <style> y <script>, responsive, sin imágenes ni librerías de internet. No preguntes: elige lo razonable. Una frase antes y 1 o 2 líneas de cómo usarlo después.',
  en: 'FILES AND CODE (saver mode). Each file goes in its own fenced block with its language, with the name in bold on the line before (**index.html**). Deliver it COMPLETE and working (never "...", TODO or omitted parts). A web page = one index.html with <style> and <script>, responsive, no internet images or libraries. Do not ask: pick the reasonable option. One sentence before and 1 or 2 lines on how to use it after.'
};
const TRABAJO = {
  es: {
    build: 'ESTO ES UN ENCARGO NUEVO: arma lo que se pide, completo y bonito, siguiendo las reglas de arriba.',
    edit: 'ESTO ES UNA MODIFICACIÓN de un archivo que ya diste. Parte del ÚLTIMO código completo de esta conversación, aplica SOLO lo que se pide y no cambies nada más (ni el diseño, ni los nombres, ni lo que ya funciona). Devuelve el archivo ENTERO con el cambio, con el mismo nombre, nunca solo el trozo. Una línea antes diciendo qué cambiaste.',
    fix: 'ESTO ES UN ARREGLO: SymphorIA probó tu código en un navegador real y encontró los problemas de la lista. Arregla TODO lo de la lista, primero los [ERROR]; devuelve cada archivo que cambies COMPLETO y con el mismo nombre; no toques lo que ya funciona. Cierra con «**Revisión**»: una línea por punto de la lista diciendo qué arreglaste.',
    cont: 'TU RESPUESTA ANTERIOR SE CORTÓ por el largo. Continúa EXACTAMENTE desde la última línea que escribiste: si estabas dentro de un bloque de código, sigue con el código sin volver a abrir el bloque con ``` y sin repetir nada; ciérralo con ``` cuando termine el archivo y sigue con lo que faltaba. No saludes ni expliques.',
    file: 'ESTO ES UN ARCHIVO: entrega SOLO el archivo pedido, en su bloque y con su nombre, y una línea de explicación.'
  },
  en: {
    build: 'THIS IS A NEW REQUEST: build what is asked, complete and good-looking, following the rules above.',
    edit: 'THIS IS A CHANGE to a file you already gave. Start from the LATEST complete code in this conversation, apply ONLY what is asked and change nothing else (not the design, not the names, not what already works). Return the ENTIRE file with the change, with the same name, never just the snippet. One line before saying what you changed.',
    fix: 'THIS IS A FIX: SymphorIA tested your code in a real browser and found the problems in the list. Fix EVERYTHING on the list, [ERROR] first; return every file you change COMPLETE and with the same name; do not touch what already works. Finish with "**Review**": one line per item saying what you fixed.',
    cont: 'YOUR PREVIOUS ANSWER WAS CUT OFF because of length. Continue EXACTLY from the last line you wrote: if you were inside a code block, keep writing the code without re-opening the block with ``` and without repeating anything; close it with ``` when the file ends and go on with what was missing. Do not greet or explain.',
    file: 'THIS IS A FILE: deliver ONLY the requested file, in its block and with its name, and one line of explanation.'
  }
};
/* las instrucciones de sistema para ESE mensaje y ESA IA (mid = el modelo que va a responder) */
export function sistema(L, prov, mid, o = {}){
  const lang = L.lang === 'en' ? 'en' : 'es', parts = [BASE[lang](hoy(lang, o.now))];
  if (L.code) return parts[0] + '\n\n' + (o.short ? CODIGO_CORTO[lang] : CODIGO[lang] + '\n\n' + TRABAJO[lang][L.job]);
  if (L.cont) return parts[0];
  if (L.level === 'easy'){ parts.push(RAPIDO[lang]); return parts.join(' '); }
  parts.push(OFICIO[lang][L.cat] || OFICIO[lang].reason);
  if (L.level === 'hard' && !o.short) parts.push(NATIVE_REASON.test(String(mid || '')) ? PENSAR_SOLA[lang] : PENSAR_TAG[lang]);
  return parts.join(' ');
}
/* temperatura: precisa en código y cálculos, más suelta al escribir */
export function temperatura(L){
  if (L.code) return { build:.35, edit:.15, fix:.1, cont:.1, file:.2 }[L.job] ?? .2;
  return L.level === 'easy' ? .5 : { code:.2, data:.15, reason:.35, summary:.3, translate:.25, write:.75 }[L.cat] ?? .5;
}
/* cuánto puede escribir la IA (cada proveedor lo recorta a su máximo, ver OUT_MAX en _pool.js): una página completa necesita mucho más que una charla */
export function tokensFor(L, short){
  if (L.code) return short ? 3000 : L.job === 'file' ? 8000 : 12000;
  if (L.level === 'hard' && !short) return 8000;
  return undefined;
}
