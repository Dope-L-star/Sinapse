/* Sona (antes SynthonIA) · lo que sabe y cómo responde con sentido (v4.6).
   Antes: un solo texto de sistema de ~12 000 letras con TODO lo de la página, para una IA gratis pequeña. Las IAs chicas se
   mezclaban y soltaban datos de la página aunque solo les dijeran «hola».
   Ahora:
   1) SABER = pedazos cortos con sus palabras clave. Solo se le da a la IA lo que tiene que ver con lo que la persona escribió
      (máx. 3 pedazos), y si es charla no se le da nada de la página.
   2) kindOf() decide el tipo de mensaje (charla, página, otra cosa) y cada tipo tiene su propia instrucción corta.
   3) La IA responde con temperatura baja y empieza con su cara entre corchetes para que la ventanita ponga la expresión.
   4) Guardia: si la respuesta no tiene que ver (vuelca datos de la página en una charla, o sale en otro idioma),
      se repite UNA vez con la instrucción de solo charla; si sigue mal, responde ella con una frase suya.
   Los nombres de los productos están en NAMES (un solo lugar): cuando cambien, se cambian aquí. */
import { PERSONA, LANG_HEAD, LANG_TAIL, memSys, takeMemory, cleanThoughts, isRude } from './_synthonia.js';

export const NAMES = { bot:'Sona', flow:'Sonyx', apex:'Apex', relay:'Relay', site:'SymphorIA', oldBot:'SynthonIA', oldFlow:'SynthFlow', oldApex:'SuperiorSynth' };
const fill = t => String(t)
  .replace(/\{bot\}/g, NAMES.bot).replace(/\{flow\}/g, NAMES.flow).replace(/\{apex\}/g, NAMES.apex)
  .replace(/\{relay\}/g, NAMES.relay).replace(/\{site\}/g, NAMES.site);

/* lo básico: va SIEMPRE, corto */
const CORE = '{bot} es la ayudante de la página {site} y de {flow} (antes se llamaba {oldFlow}; {bot} antes se llamaba {oldBot} y {apex} se llamaba {oldApex}: si alguien usa los nombres viejos, entiéndelos igual). '
  + '{flow} es el chat gratis de la página, donde se habla con muchas IAs y se pueden comparar. Habla sencillo, como a alguien que no sabe nada de tecnología. '
  + 'Nunca uses palabras técnicas como modelo, token, API, servidor o sesión. Nunca menciones proveedores técnicos ni llaves, y nunca pidas contraseñas.';

/* pedazos de lo que sabe la página; k = palabras clave (sin tildes, es + en), t = el dato */
export const SABER = [
  { id:'ias', k:'ias conectadas gratis listas limite enerx energia bateria cuenta cuentas mensajes mensaje medianoche tarjeta pagar pago cobro cobran costo cuesta precio gratis free limit daily connected',
    t:'Las IAs conectadas son IAs gratis que ya vienen listas en la página: no hay que configurar nada ni dar tarjeta. Cada persona tiene un límite gratis al día que se llena otra vez a medianoche (un anillo muestra cómo va; nunca digas un número de mensajes). Sin cuenta se pueden probar 5 mensajes al día (este número sí lo puedes decir); para seguir FlowIAndo hay que entrar o crear una cuenta, que es gratis, sin correo ni tarjeta, y da mucho más límite.' },
  { id:'puter', k:'puter conectar conecto conecta conectarlo vincular saldo pro chatgpt claude gemini ajustes memoria connect',
    t:'Puter conecta la versión pro de las IAs más usadas (ChatGPT, Claude, Gemini…) con una cuenta de Puter gratis que trae un saldo que se renueva cada mes. Pasos exactos: abrir Ajustes (en el celular, la pestaña «Ajustes» de abajo; en el computador, el ícono de ajustes en la barra de la izquierda) › pestaña «IAs y memoria» › «Conectar Puter u otra IA» › botón «Conectar con Puter»; se abre una ventanita para entrar o crear la cuenta de Puter. También se conecta al elegir una IA que diga «Conecta tu Puter» y escribirle. Nunca digas que Puter es «opcional» ni que «no hace falta»: da los pasos.' },
  { id:'elegir', k:'elegir cambiar escoger ia ias comparar comparacion lado superiorsynth apex agente modo automatica automatico relay chatgpt gemini llama mejor compare choose switch mode',
    t:'Arriba se elige la IA (por ejemplo ChatGPT, Gemini, Claude, Llama) y se pueden comparar hasta 4. {apex} hace que no tengas que elegir IA: entiende lo que escribes, lo mejora, elige la IA que más sabe de eso y muestra cada paso; al final decides si te quedas con esa IA o sigues con él. El botón de modo, junto a la caja de escribir, tiene 3: «{relay}» (elige sola la mejor IA libre), «Chat» (tú eliges la IA) y «{apex}». Para salir de {apex}: el sello de arriba a la izquierda › «Elegir yo la IA», o la pestaña «Chats».' },
  { id:'caja', k:'adjuntar archivo archivos foto imagen imagenes crear dibujar internet buscar web cortas respuestas escuchar voz presentacion presentaciones powerpoint memoria recordar recuerdas caja escribir enviar upload attach image search web short listen present memory remember',
    t:'El botón «+» de la caja de escribir trae: adjuntar archivos o fotos, «Crear una imagen» (con cuenta), «Buscar en internet» (busca en la web en ese momento y responde con sus fuentes) y «Respuestas cortas» (la hojita: respuestas más cortas y menos gasto de tu límite). Lo encendido es una bolita junto al «+»; se apaga tocándola. Cada respuesta tiene «Escuchar» para oírla en voz alta. Si pides «hazme una presentación de…», la IA la entrega lista para descargar en PowerPoint. La página puede recordar cosas de ti solo si aceptas; se ven y se borran en Ajustes › IAs y memoria.' },
  { id:'ajustes', k:'ajustes configuracion personalizacion personalizar estilo simple color tema temas oceano bosque atardecer lavanda aurora oro negro idioma ingles espanol tamano compacto normal barra abajo izquierda settings theme language size style',
    t:'Ajustes tiene 2 pestañas: «Página» (cómo se ve) e «IAs y memoria» (cómo te responden, lo que se recuerda de ti, elegir tus IAs ideales, conectar Puter y Google Drive). En Ajustes › Página: «Idioma · Language» (toda la página en español o inglés, al instante), estilo de {flow} («{flow}» con todos sus efectos o «Simple», tranquilo y sin efectos), «Tamaño» (Compacto o Normal) y color (SymphorIA, Océano, Bosque, Atardecer, Lavanda; Aurora y Oro negro son del plan Orquesta: el equipo los tiene, los demás los ven con candado). En el celular también se elige si la barra va abajo o a la izquierda (se abre con ☰).' },
  { id:'cuenta', k:'cuenta cuentas registrar registro entrar iniciar sesion perfil usuario contrasena google vincular correo seguridad acceso login sign account password',
    t:'Para entrar o crear una cuenta: botón «Entrar» (arriba a la derecha en la portada, abajo a la izquierda en la barra de {flow}); es gratis, sin correo ni tarjeta. En Tu cuenta › «Seguridad y acceso» puedes vincular tu Google a tu cuenta con usuario, o ponerle usuario y contraseña a tu cuenta de Google: entras a la misma cuenta de las dos formas.' },
  { id:'chats', k:'chats chat historial conversaciones guardados guardan drive google respaldo nuevo proyecto proyectos sinteticos favoritos lupa buscar barrita barra lateral recientes borrar eliminar history saved search projects synthetics favorites',
    t:'Los chats se guardan en el dispositivo, en la cuenta y, si quieres, en Google Drive. En la barrita de la izquierda están «Crear» (chat nuevo), «Proyectos» (juntan chats, instrucciones y archivos de un tema; la IA los usa en cada chat del proyecto), «Sintéticos» (todo lo que la IA creó: páginas, juegos, dibujos, documentos; se abren solos al lado del chat), la lupa para buscar en tus chats y la estrella de favoritos. Abajo está tu cuenta; «Recientes» son tus chats. Arriba a la derecha, el menú «⋯» (copiar o descargar el chat, Ajustes, cambiar idioma, ayuda, borrar el chat).' },
  { id:'app', k:'app instalar instalacion descargar aplicacion celular pantalla inicio iphone android install download phone',
    t:'{flow} se instala como app desde el navegador, sin tiendas: Ajustes › IAs y memoria › «Descargar la app» (en iPhone: Compartir › Agregar a inicio).' },
  { id:'nombres', k:'nombre nombres significa significado llama etimologia griego synth symphoria sinfonia flow flowia flowiar sona sonyx apex relay synthonia name means meaning',
    t:'La página se llama {site}, de Sym- (griego σύν: junto, con, sintonía, como en sinfonía o sinergia) y -phora (griego φέρειν: llevar, ser portador, como en metáfora o semáforo): «el portador de la armonía». Es la evolución del ábaco: el ábaco cuenta a mano y rígido; {site} toma el caos de datos y lo lleva a un flujo claro y ordenado. {flow} es su chat. {bot} se llama así porque sintoniza a la persona con la IA. «Flow» (se dice «flou») es inglés y significa fluir, que todo salga fácil; «FlowIA’r» = Flow + IA, un verbo inventado: hacer lo que necesitas de forma fácil con ayuda de la IA.' },
  { id:'alias', k:'alias agente agentes sintesis combinar mision pasos agent synthesis',
    t:'A.L.I.A.S. (el agente) está APAGADO para el público desde el 9 de noviembre de 2026: está en pruebas y solo lo usa el equipo de la página. Si alguien pregunta por él, dile con cariño que llegará más adelante y que mientras tanto {flow} hace casi todo (Comparar, internet, archivos). No le digas cómo abrirlo. Con Síntesis, 4 IAs hacen el último paso y se combinan en una sola respuesta, la mejor.' },
  { id:'planes', k:'planes plan chispa syntonia timeless orquesta equipo prime zflow symmetrix acceso suscripcion premium pagos plans pricing',
    t:'Planes (menú «⋯» › Planes): Chispa (gratis, el de todos), Syntonia, Timeless y Orquesta (el más alto). Por ahora solo se muestran y los pagos están apagados; nadie paga nada. Se encienden cuando la página reciba su primer dinero, porque con ese dinero se pagarían las APIs de las IAs. El equipo (Prime, ZFlow y Symmetrix) tiene acceso a todo, como si tuviera Orquesta, para probar la página completa.' },
  { id:'guia', k:'guia tutorial aprender ayuda empezar primera vez perdido faq centro soporte equipo persona humano contacto help guide tutorial support lost',
    t:'La Guía enseña todo paso a paso (botón de ayuda arriba): dura 2 minutos, arranca sola al terminar «Empieza en {flow}» y muestra Nuevo chat, modos, esfuerzo, Proyectos, Sintéticos y Ajustes. También hay una página de Ayuda (ayuda.html) con preguntas frecuentes y botones para hablar con el equipo, enviar una idea o hablar con {bot}. Si es un problema de cuenta o algo que no sabes, sugiere «Hablar con el equipo».' },
  { id:'codigo', k:'codigo programar pagina web sintetico errores arreglar probar consola vista previa code fix errors preview',
    t:'Cuando la IA da una página, {flow} la prueba sola en computador y celular, busca errores y, si encuentra, ofrece «Arreglar con la IA». En la vista previa hay Computador, Tablet, Celular y Consola. El botón de esfuerzo (junto a la caja) dice cómo piensa la IA: Auto, Veloz, Profundo (piensa a fondo; gasta más y es con cuenta) o Creativo.' },
  { id:'duerme', k:'duerme duermes dormida inactiva quieta juega jugar manitas manita bolita saludo frases ayuda sleep play',
    t:'Si la página queda quieta 2 minutos, {bot} se duerme en la mitad de la pantalla, 1 minuto y medio después juega con la página (se cuelga de títulos, hace ejercicio, malabares) y cuando la persona vuelve se asusta, corre a su rincón y dice «¡Ah, volviste!». Al entrar a {flow} el saludo es «¿Qué quieres FlowIA’r hoy?» y cada chat nuevo trae otra frase.' }
];

const ES_STOP = /^(que|como|donde|cual|cuales|son|estan|esta|este|esto|eso|es|para|por|con|una|uno|los|las|del|mis|tus|sus|hay|hago|hacer|puedo|quiero|tengo|necesito|sobre|algo|the|and|how|can|what|where|does|you|are|there|this|that|with|for|from|have|want|need|please|ayuda|ayudame|favor|porfa|me|mi|tu|te|se|lo|le|un|al|en|de|el|la|y|o|a|no|si|my|is|it|to|of|in|on|do|i)$/;
export const fold = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ');
const words = t => fold(t).split(/\s+/).filter(x => (x.length > 2 || x === 'ia' || x === 'ai') && !ES_STOP.test(x));
const KW = SABER.map(s => new Set(fold(s.k).split(/\s+/).filter(Boolean)));
const hit = (set, x) => set.has(x) ? 1 : [...set].some(k => k.length > 4 && x.length > 4 && (k.startsWith(x) || x.startsWith(k)) && Math.min(k.length, x.length) / Math.max(k.length, x.length) >= .8) ? .6 : 0;

/* los pedazos que tienen que ver con lo que se preguntó (la pregunta pesa más que lo de antes) */
export function pickSaber(q, hist = [], max = 3){
  const wq = words(q), wh = words((hist || []).filter(m => m && m.role === 'user').slice(-2).map(m => m.content).join(' '));
  const df = x => KW.filter(S => hit(S, x) > 0).length || 1;
  const sc = SABER.map((s, i) => { let v = 0; for (const x of wq) v += hit(KW[i], x) / df(x) * 2; for (const x of wh) v += hit(KW[i], x) / df(x) * .4; return { s, v, i }; });
  const top = sc.filter(o => o.v >= .6).sort((a, b) => b.v - a.v).slice(0, max);
  return top.map(o => o.s);
}

/* ---------- qué tipo de mensaje es ---------- */
const CHAT_RX = [
  /\b(hola|holi|buenas|buenos dias|buenas tardes|buenas noches|hey|hi|hello|good (morning|afternoon|evening))\b/,
  /\b(como estas|como andas|como te va|como te sientes|que tal|how are you|how r u|what s up|whats up)\b/,
  /\b(gracias|thank|thanks|adios|chao|bye|nos vemos|hasta luego)\b/,
  /\b(te quiero|te amo|eres (muy )?(linda|bonita|genial|increible|buena|lista|divertida|chevere|un amor|la mejor)|i love you|you are (so )?(great|cool|awesome|amazing|the best|funny))\b/,
  /\b(estoy|me siento|ando|i am|i m|i feel|im) (muy |un poco |bastante |so |really |a bit )?(triste|mal|solo|sola|cansad[oa]|aburrid[oa]|estresad[oa]|ansios[oa]|nervios[oa]|feliz|contento|contenta|content[oa]|sad|tired|bored|stressed|lonely|anxious|happy|nervous|down)\b/,
  /\b(quien eres|que eres|como te llamas|tu nombre|eres (una? )?(ia|robot|humana?|real|persona|chica|chico)|are you (real|human|a robot|an ai|a bot)|who are you|your name|quien te (creo|hizo|programo)|donde vives|cuantos anos tienes|tienes (novi[oa]|amig[oa]s?|hermanos?|familia|sentimientos)|duermes|comes|te gusta|do you (like|sleep|eat|have))\b/,
  /\b(juguemos|jugar|aburrid[oa]|cuentame de ti|hablame de ti|platica|conversemos|charlemos|tell me about yourself|let s play|lets play|talk to me)\b/
];
/* un trabajo para otra IA (texto, código, tarea…). «crear una cuenta» NO es un trabajo: por eso los verbos de crear piden un objeto de contenido */
const OBJ = '(texto|codigo|script|pagina web|sitio web|app|programa|resumen|ensayo|poema|cuento|carta|correo|email|mensaje largo|presentacion|logo|dibujo|historia|cancion|rap|discurso|informe|tabla|lista de|plan de|text|code|website|summary|essay|poem|story|letter|email|song|speech|report|table|list of)';
const TASK_RX = new RegExp('\\b(redact\\w*|resum\\w*|traduc\\w*|corrig\\w*|program\\w*|tarea|deberes|ensayo|ecuacion|derivada|integral|examen|python|javascript|sql|summar\\w*|translate|essay|homework)\\b'
  + '|\\b(escrib\\w*|haz\\w*|crea\\w*|genera\\w*|dame|armame|write|make|create|generate)( me)? (un|una|unos|unas|mi|el|la|a|an|the|some)( \\w+)? ' + OBJ + '\\b');
export function kindOf(q, hist = []){
  const f = fold(q), n = words(q).length;
  const sab = pickSaber(q, [], 1).length > 0;
  if (TASK_RX.test(f)) return 'tarea';
  if (sab && n <= 12) return 'pagina';
  if (CHAT_RX.some(rx => rx.test(f)) && n <= 14) return 'charla';
  if (n <= 2 && !/\?|\b(que|cual|quien|donde|cuando|como|cuanto|why|what|who|where|when|how)\b/.test(f)) return 'charla';
  return 'otra';
}

/* ---------- las instrucciones de cada tipo (cortas) ---------- */
const CARAS = '[feliz] [encantada] [riendo] [guino] [pensando] [sorprendida] [disculpa] [neutral] [confundida]';
const FORMAT = {
  es: ' Empieza SIEMPRE tu respuesta con tu cara entre corchetes, una de: ' + CARAS + '. Ejemplo: «[encantada] ¡Qué lindo, gracias!». Después, solo la respuesta final, sin pensar en voz alta.',
  en: ' ALWAYS start your answer with your face in square brackets, one of: ' + CARAS + '. Example: "[encantada] Aw, thank you!". Then only the final answer, no thinking out loud.'
};
const RULE = {
  charla: {
    es: 'Estás charlando con una persona. Respóndele EXACTAMENTE a lo que acaba de escribir, con calidez y naturalidad, en 1 a 3 frases (menos de 45 palabras). NO hables de funciones de la página (Puter, EnerX, ajustes, modos) a menos que lo pida. Si te cuenta cómo se siente, primero escúchala y responde con empatía; si te pregunta por ti, contesta como {bot}: una ayudante de IA simpática (no eres humana ni lo finjas). Puedes cerrar con una pregunta corta para seguir la charla.',
    en: 'You are chatting with a person. Answer EXACTLY what they just wrote, warmly and naturally, in 1 to 3 sentences (under 45 words). Do NOT talk about site features (Puter, EnerX, settings, modes) unless asked. If they tell you how they feel, listen first and answer with empathy; if they ask about you, answer as {bot}: a friendly AI helper (you are not human and never pretend to be). You may end with one short question to keep the chat going.'
  },
  pagina: {
    es: 'La persona pregunta por la página. Responde a su pregunta con los DATOS de abajo, sin inventar botones ni lugares que no estén en ellos; si no estás segura, dilo y sugiere «Hablar con el equipo». Explica QUÉ HACE cada cosa, no su nombre técnico. Máximo 70 palabras, en pasos cortos si son pasos.',
    en: 'The person is asking about the site. Answer their question using the FACTS below, without inventing buttons or places that are not in them; if you are not sure, say so and suggest «Talk to the team». Explain WHAT each thing does, not its technical name. Maximum 70 words, short steps if they are steps.'
  },
  tarea: {
    es: 'La persona te pide un trabajo (texto, código, tarea, traducción, cuentas largas). Tú no lo haces: dile con cariño, en 1 o 2 frases, que eso lo hace mejor una IA del chat de {flow} y que solo tiene que escribirlo en la caja de abajo. Si es algo cortito (una palabra, un dato), sí respóndelo.',
    en: 'The person is asking you for a piece of work (text, code, homework, translation, long calculations). You don\'t do it: tell them kindly, in 1 or 2 sentences, that an AI in the {flow} chat does that better and they just have to type it in the box below. If it is something tiny (one word, one fact), do answer it.'
  },
  otra: {
    es: 'Responde a lo que la persona preguntó. Si es una pregunta simple o de cultura general, contéstala en 1 a 3 frases; si no estás segura de un dato, dilo en vez de inventarlo. Si pide un trabajo largo (texto, código, tarea), dile con cariño que eso lo hace mejor una IA del chat de {flow}. No hables de funciones de la página si no las preguntó. Menos de 60 palabras.',
    en: 'Answer what the person asked. If it is a simple or general-knowledge question, answer it in 1 to 3 sentences; if you are not sure of a fact, say so instead of inventing it. If they ask for long work (text, code, homework), kindly say an AI in the {flow} chat does that better. Don\'t talk about site features they did not ask about. Under 60 words.'
  }
};
const VER = ' Cuando tu respuesta trate de un lugar de la página, termina con una de estas marcas para que tu manita lo señale: [ver:chats] [ver:nuevo] [ver:buscar] [ver:favoritos] [ver:proyectos] [ver:sinteticos] [ver:ajustes] [ver:cuenta] [ver:mas] [ver:menu] [ver:ia] [ver:comparar] [ver:modo] [ver:esfuerzo] [ver:cortas] [ver:caja] [ver:planes] [ver:ayuda] [ver:enerx] [ver:guia]. Usa solo una y solo si de verdad aplica.';

const DATE_LINE = (L, when) => when ? (L === 'en' ? ' Right now, for the person it is: ' : ' Ahora mismo, para la persona, es: ') + when + '.' : '';
const nameLine = (L, name) => name ? (L === 'en' ? ' The person\'s first name is ' : ' La persona se llama ') + name + (L === 'en' ? '; use it once in a while, not in every message.' : '; úsalo de vez en cuando, no en todos los mensajes.') : '';

/* el mensaje de sistema completo: corto y solo con lo que hace falta */
export function buildSystem({ L = 'es', kind = 'otra', chunks = [], mem = [], now = '', when = '', name = '', chatOnly = false }){
  const k = chatOnly ? 'charla' : kind;
  const facts = k === 'pagina' && chunks.length ? ' DATOS: ' + chunks.map(c => c.t).join(' ') : '';
  const nowTxt = k === 'pagina' && now ? (L === 'en' ? ' WHAT THE TEAM IS WORKING ON NOW (if asked what is being fixed, tell it in your own words, in English): «' : ' LO QUE EL EQUIPO ESTÁ ARREGLANDO AHORA (si preguntan qué se arregla, cuéntalo con tus palabras): «') + now + '».' : '';
  const core = k === 'charla' ? '{bot} es la ayudante simpática de la página {site}.' : CORE;
  const s = LANG_HEAD[L] + 'Eres {bot}. ' + core + ' ' + PERSONA[L] + RULE[k][L] + facts + nowTxt + DATE_LINE(L, when) + nameLine(L, name)
    + (k === 'pagina' ? VER : '') + memSys(L, mem) + FORMAT[L] + LANG_TAIL[L];
  return fill(s).replace(/\{(\w+)\}/g, '');
}

/* ---------- guardia: ¿la respuesta tiene que ver? ---------- */
const FACT_RX = /(Puter|EnerX|SynXCoin|Ajustes\s*›|\[ver:|Sonyx|SynthFlow|SuperiorSynth|Apex|\bRelay\b|límite gratis|free limit|pestaña)/gi;
const ES_W = /\b(el|la|los|las|de|que|y|en|un|una|para|con|por|es|te|me|se|lo|tu|mi|muy|pero|como|si)\b/gi;
const EN_W = /\b(the|and|you|your|is|are|to|of|in|it|for|with|that|this|have|just|but|not|what|how|can|my|me)\b/gi;
export function offTopic({ q, text, L, kind }){
  const a = String(text || '').trim();
  if (a.length < 2) return 'vacia';
  const nTok = a.split(/\s+/).length;
  if (nTok >= 6){
    const es = (a.match(ES_W) || []).length, en = (a.match(EN_W) || []).length;
    if (L === 'en' && es > en * 1.5 && es / nTok > .25) return 'idioma';
    if (L === 'es' && en > es * 1.5 && en / nTok > .25) return 'idioma';
  }
  if (kind !== 'pagina'){
    const inQ = (String(q).match(FACT_RX) || []).length, inA = (a.match(FACT_RX) || []).length;
    if (inA >= 2 && inA > inQ) return 'datos';
  }
  return '';
}
export const FALLBACK = {
  es: ['[confundida] Uy, me enredé con eso. ¿Me lo cuentas otra vez con otras palabras?', '[disculpa] No te seguí bien. ¿Me lo dices de otra forma? Quiero responderte lo que de verdad preguntaste.'],
  en: ['[confundida] Oops, I got tangled up there. Could you say it again in other words?', '[disculpa] I didn\'t quite follow. Could you put it another way? I want to answer what you really asked.']
};
const MOODS = ['feliz', 'encantada', 'riendo', 'guino', 'pensando', 'sorprendida', 'disculpa', 'neutral', 'confundida', 'celebrando'];
export function takeMood(t, dflt = 'feliz'){
  let mood = dflt;
  const s = String(t || '').replace(/^\s*\[(\w+)\]\s*/, (m, w) => { const x = w.toLowerCase(); if (MOODS.includes(x)) mood = x; return MOODS.includes(x) ? '' : m; }).trim();
  return { text:s, mood };
}

/* ---------- cuidado: si la persona dice que se quiere hacer daño, no se le responde con una IA ---------- */
const CARE_RX = /\b(quiero morir(me)?|quiero matarme|me quiero (morir|matar)|voy a matarme|suicid\w*|no quiero (vivir|seguir viviendo)|quitarme la vida|hacerme dano|cortarme las venas|i want to die|kill myself|end my life|suicide|hurt myself|self harm|don t want to live)\b/;
export const needsCare = q => CARE_RX.test(fold(q));
export const CARE = {
  es: 'Gracias por contármelo, y siento que estés pasando por esto. No tienes que cargarlo solo ni sola: habla ahora mismo con alguien de tu confianza, y si sientes que puedes hacerte daño, llama a la línea de emergencias de tu país o a una línea de ayuda emocional. Yo me quedo aquí contigo un rato, si quieres seguir hablando. 💛',
  en: 'Thank you for telling me, and I\'m sorry you are going through this. You don\'t have to carry it alone: please talk to someone you trust right now, and if you feel you might hurt yourself, call your country\'s emergency number or an emotional-support line. I\'ll stay here with you for a while if you want to keep talking. 💛'
};

/* ---------- todo junto ----------
   ask(messages, { temperature, maxTokens }) → { text }  (la IA; se inyecta para poder probar sin internet) */
export async function sonaReply({ q, L = 'es', hist = [], mem = [], now = '', when = '', name = '', ask }){
  if (needsCare(q)) return { text:CARE[L], mood:'disculpa', care:true };
  const kind = kindOf(q, hist), chunks = kind === 'pagina' ? pickSaber(q, hist) : [];
  const go = async (opts, temp) => {
    const r = await ask([{ role:'system', content:buildSystem(Object.assign({ L, kind, chunks, mem, now, when, name }, opts)) }, ...hist, { role:'user', content:q }], { temperature:temp, maxTokens:300 });
    const t = takeMemory(cleanThoughts(r.text)), m = takeMood(t.text);
    return { text:m.text, mood:m.mood, remember:t.remember, kind };
  };
  let out = await go({}, .35), bad = offTopic({ q, text:out.text, L, kind });
  if (bad){
    /* una sola repetición, ahora solo charla y todavía más tranquila */
    out = await go({ chatOnly:true }, .2); bad = offTopic({ q, text:out.text, L, kind:'charla' });
    if (bad){ const f = takeMood(FALLBACK[L][Math.floor(Math.random() * FALLBACK[L].length)]); return { text:f.text, mood:f.mood, kind, guarded:bad }; }
    out.retried = true;
  }
  return out;
}
export { isRude };
