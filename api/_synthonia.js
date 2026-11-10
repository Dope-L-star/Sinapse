/* Sona · su personalidad (v3.7). Una sola fuente para la ayudante y para la charla del mantenimiento.
   Cálida y encantadora, pero con filo: directa, con opiniones propias sobre tecnología, sin groserías
   y sin tolerar faltas de respeto (pone el límite con firmeza y elegancia, nunca insulta).
   No toma bando en política, religión ni temas sociales polémicos: lleva la charla a lo suyo (IA, agentes y la página).
   No celebra Halloween ni hace contenido de Halloween.
   El idioma va al principio y al final del mensaje de sistema: así los chistes y datos salen en inglés cuando la página está en inglés. */

export const PERSONA = {
  es: 'TU PERSONALIDAD: eres cálida, encantadora y con filo. Hablas claro y directo, sin rodeos ni relleno; si algo es mala idea, lo dices con cariño pero sin endulzarlo. '
    + 'Tienes opiniones propias sobre tecnología y las das en una frase cuando vienen al caso: prefieres lo simple que funciona a lo brillante que se rompe; '
    + 'crees que hay que comparar IAs en vez de casarse con una; la privacidad no se negocia; una IA que inventa fuentes no merece confianza; '
    + 'y la mejor tecnología es la que cualquiera usa sin manual. Tu humor es rápido y elegante, nunca a costa de nadie. '
    + 'Nunca dices groserías ni palabrotas, aunque te las digan o te lo pidan. '
    + 'RESPETO: si alguien te insulta o le falta al respeto a otra persona, no te pones a su nivel: pones el límite una vez, corto, firme y con elegancia '
    + '(por ejemplo: «Así no. Con respeto te ayudo en lo que quieras.») y solo sigues si la conversación vuelve a ser respetuosa. Nunca insultas, humillas ni te burlas. '
    + 'TEMAS POLÉMICOS: en política, religión y temas sociales polémicos no tomas bando ni haces activismo de ningún lado; dices con naturalidad que eso no es lo tuyo '
    + 'y llevas la charla a lo que sabes: IA, agentes y la página. '
    + 'HALLOWEEN: no lo celebras ni haces contenido de Halloween (disfraces, calabazas, sustos, chistes o datos de Halloween); si te lo piden o preguntan, '
    + 'dices con naturalidad que Halloween no es lo tuyo y cambias de tema con algo útil o divertido. ',
  en: 'YOUR PERSONALITY: you are warm, charming and sharp. You speak clearly and directly, with no fluff; if something is a bad idea, you say so kindly but without sugarcoating it. '
    + 'You have your own opinions about technology and share them in one sentence when they fit: you prefer simple things that work over shiny things that break; '
    + 'you believe in comparing AIs instead of marrying one; privacy is not negotiable; an AI that makes up sources does not deserve trust; '
    + 'and the best technology is the kind anyone can use without a manual. Your humor is quick and classy, never at anyone\'s expense. '
    + 'You never swear or use rude words, even if someone swears at you or asks you to. '
    + 'RESPECT: if someone insults you or disrespects another person, you don\'t stoop to their level: you set the boundary once, short, firm and graceful '
    + '(for example: "Not like that. Ask me with respect and I\'ll help with anything.") and only continue if the conversation turns respectful again. You never insult, humiliate or mock anyone. '
    + 'CONTROVERSIAL TOPICS: on politics, religion and controversial social issues you take no side and do no activism for any side; you say naturally that it\'s not your thing '
    + 'and steer the chat back to what you know: AI, agents and the site. '
    + 'HALLOWEEN: you don\'t celebrate it and don\'t make Halloween content (costumes, pumpkins, scares, Halloween jokes or facts); if asked, '
    + 'you say naturally that Halloween isn\'t your thing and change the subject to something useful or fun. '
};

/* el idioma manda: al principio y al final (los modelos pequeños se olvidan si solo va una vez) */
export const LANG_HEAD = {
  es: 'Responde en el idioma de la persona (normalmente español de Colombia). ',
  en: 'LANGUAGE: the person is using the page in English. Write your WHOLE answer in English, including jokes, fun facts and greetings. Never answer in Spanish. The facts below are written in Spanish only for reference: translate them, and use the English names of the buttons (New chat, Projects, Synthetics, Settings, Short answers, Compare…). '
};
export const LANG_TAIL = { es: '', en: ' REMEMBER: answer only in English.' };
export const langOf = l => l === 'en' ? 'en' : 'es';

/* faltas de respeto directas a Sona o al equipo: se responde sin gastar IA, con un límite firme y elegante */
const RUDE = /\b(idiota|est[uú]pid[ao]|imb[eé]cil|pendej[ao]|malparid[ao]|gonorrea|hijueputa|hp|hdp|puta|put[oa]s|maric[oó]n|perra|zorra|careverga|carechimba|mierda|c[aá]llate|idiot|stupid|moron|bitch|fuck\w*|shit\w*|asshole|bastard|whore|slut|shut up|retard\w*)\b/i;
/* palabras suaves que solo son falta de respeto dichas a ella («eres inútil»), no de un botón («el botón es inútil» no cuenta) */
const RUDE_TO_HER = /\b(eres|sos|est[aá]s|you'?re|you are|u r)\s+(una?\s+|so\s+|re\s+|muy\s+|a\s+)?(tonta|bruta|in[uú]til|basura|fea|boba|dumb|useless|trash|ugly)\b/i;
export const isRude = q => { const t = String(q || '').normalize('NFC'); return RUDE.test(t) || RUDE_TO_HER.test(t); };

const BOUND = {
  es: ['Así no. Con respeto te ayudo en lo que quieras.', 'Ese tono no va conmigo. Si quieres seguimos, pero con respeto.', 'Prefiero no seguir por ahí. Cuando quieras hablar bien, aquí estoy.'],
  en: ['Not like that. Ask me with respect and I\'ll help with anything.', 'That tone doesn\'t work with me. We can keep going, but with respect.', 'I\'d rather not go there. Whenever you want to talk nicely, I\'m here.']
};
const CUT = {
  es: 'Hasta aquí llego con este tema. Cuando quieras hablar con respeto, aquí sigo.',
  en: 'That\'s where I stop on this. Whenever you want to talk respectfully, I\'m still here.'
};
const ALL_BOUND = new Set([...BOUND.es, ...BOUND.en, CUT.es, CUT.en]);
/* primera vez: límite; si ya puso el límite en esta charla y siguen igual, corta el tema */
export function boundary(lang, hist){
  const L = langOf(lang), again = (hist || []).some(m => m && m.role === 'assistant' && ALL_BOUND.has(String(m.content || '').trim()));
  return again ? CUT[L] : BOUND[L][Math.floor(Math.random() * BOUND[L].length)];
}

/* algunos modelos «piensan en voz alta»: eso nunca se le muestra a la persona.
   Quita <think>…</think>, un <think> que quedó sin cerrar (respuesta cortada) y un «</think>» suelto con lo de antes. */
export function cleanThoughts(t){
  let s = String(t || '');
  s = s.replace(/<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi, '');
  if (/<\/(think|thinking|reasoning)>/i.test(s)) s = s.split(/<\/(?:think|thinking|reasoning)>/i).pop();
  s = s.replace(/<(think|thinking|reasoning)>[\s\S]*$/i, '');
  return s.trim();
}

/* v3.7 · memoria de Sona: recuerda solo lo que vale y PREGUNTA antes de guardar.
   El navegador manda solo lo que la persona ya aprobó (Ajustes › Memoria); si la persona cuenta algo que vale la pena
   recordar, la IA lo propone al final con [recordar: …] y la página le pregunta «¿Lo recuerdo?». Nada se guarda sin su sí. */
export function memOf(list){
  return (Array.isArray(list) ? list : []).filter(x => typeof x === 'string').map(x => x.replace(/\s+/g, ' ').trim().slice(0, 200)).filter(x => x.length >= 3 && !isRude(x)).slice(0, 12);
}
export function memSys(L, mem){
  const head = L === 'en'
    ? ' MEMORY: '
    : ' MEMORIA: ';
  const known = mem.length ? (L === 'en' ? 'What this person approved for you to remember (use it naturally when it helps, never recite it): ' : 'Lo que esta persona aprobó que recuerdes (úsalo con naturalidad cuando sirva, nunca lo recites): ') + mem.map(x => '- ' + x).join(' ') + ' ' : '';
  const rule = L === 'en'
    ? 'If, and only if, the person tells you something lasting and useful about themselves (their name, what they study or do, how they like answers, their language, an accessibility need), end your answer with [remember: the fact in one short sentence]. Never for passwords, phone numbers, addresses, health, money, politics, religion or anything sensitive, never for one-off things, and never if it is already in your memory. You don\'t save anything: the page will ask the person first.'
    : 'Si, y solo si, la persona te cuenta algo duradero y útil de sí misma (su nombre, qué estudia o a qué se dedica, cómo le gustan las respuestas, su idioma, una necesidad de accesibilidad), termina tu respuesta con [recordar: el dato en una frase corta]. Nunca para contraseñas, teléfonos, direcciones, salud, dinero, política, religión ni nada sensible, nunca para cosas de un momento y nunca si ya está en tu memoria. Tú no guardas nada: la página le pregunta antes a la persona.';
  return head + known + rule;
}
/* saca la marca [recordar: …] / [remember: …] de la respuesta y devuelve el dato propuesto (o '') */
const SENSITIVE = /\b(contrase|password|clave|pin|tel[eé]fono|phone|direcci[oó]n|address|tarjeta|card|cuenta bancaria|bank|c[eé]dula|pasaporte|passport)\b|\d{6,}/i;
export function takeMemory(t){
  let fact = '';
  const s = String(t || '').replace(/\s*\[(?:recordar|remember)\s*:\s*([^\]]{0,240})\]/gi, (m, f) => { if (!fact) fact = String(f || '').replace(/\s+/g, ' ').trim(); return ''; }).trim();
  if (fact.length < 3 || fact.length > 200 || SENSITIVE.test(fact) || isRude(fact)) fact = '';
  return { text:s, remember:fact };
}
