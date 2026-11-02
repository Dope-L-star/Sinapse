/* Portada nueva (v4): todo lo visible en español e inglés. */
export const T = {
  es: {
    nav: { demo: 'Demo', puertas: 'Puertas', entrar: 'Entrar al chat', idioma: 'EN', idiomaLabel: 'Cambiar a inglés' },
    beta: 'Beta gratis',
    titulo: ['¿Qué quieres', 'hacer hoy?'],
    sub: 'Escribe una vez y varias IAs gratis te responden a la vez. Tú comparas y te quedas con la mejor.',
    placeholder: ['Explícame qué es un agente de IA…', 'Hazme un plan para aprender Python…', 'Escribe un correo para pedir permiso…', 'Dame 5 nombres para mi marca…'],
    enviar: 'Ver la carrera',
    chips: [
      { k: 'explica', t: 'Explícame algo', q: 'Explícame qué es un agente de IA' },
      { k: 'codigo', t: 'Escribe un código', q: 'Escribe una función que cuente palabras' },
      { k: 'plan', t: 'Hazme un plan', q: 'Hazme un plan para aprender Python' },
      { k: 'ideas', t: 'Dame ideas', q: 'Dame 5 nombres para mi marca' },
    ],
    nota: 'Demo simulada: no gasta tu EnerX.',
    carrera: {
      kicker: 'La carrera',
      titulo: 'Tres IAs, una pregunta. Gana la que tú digas.',
      tuPregunta: 'Tu pregunta',
      escribiendo: 'escribiendo…',
      lista: 'lista',
      seg: 's',
      palabras: 'palabras',
      vota: '¿Cuál te gustó más?',
      elegir: 'Esta',
      ganadora: 'Tu favorita',
      deVerdad: 'Hacerlo de verdad en SynthFlow',
      otra: 'Otra pregunta',
      ejemplo: 'Ejemplo',
    },
    pasos: [
      { n: '01', t: 'Escribe', d: 'Una sola vez, como le hablarías a una persona.' },
      { n: '02', t: 'Compara', d: 'Varias IAs gratis responden lado a lado.' },
      { n: '03', t: 'Quédate', d: 'Elige la mejor y sigue la conversación con ella.' },
    ],
    puertas: {
      kicker: 'Puertas',
      titulo: 'Unas ya se abren. Otras las abres tú.',
      sub: 'Las puertas con luz ya funcionan. Las cerradas todavía no existen: si quieres una, dínoslo y la hacemos primero.',
      abierta: 'Abierta',
      cerrada: 'Próximamente',
      abrir: 'Entrar',
      tocar: 'Tocar la puerta',
      aunNo: 'Esta puerta aún no existe.',
      quieres: '¿La quieres? Tu voto decide qué hacemos primero.',
      meInteresa: 'La quiero',
      gracias: '¡Anotado! Gracias por empujar esta puerta.',
      correo: 'Tu correo (opcional, para avisarte)',
      avisame: 'Avísame',
      correoOk: 'Te escribiremos solo cuando esté lista.',
      correoMal: 'Ese correo no parece válido.',
      personas: (n) => (n === 1 ? '1 persona la pidió' : `${n} personas la pidieron`),
      gratis: 'Nada se cobra: solo queremos saber qué quieres.',
      cerrar: 'Cerrar',
      fallo: 'No pudimos guardarlo ahora. Tu voto quedó en este equipo.',
    },
    fondo: {
      t: 'Llegaste al fondo.',
      d: 'Aquí abajo no hay nada más… salvo una puerta que siempre está abierta.',
      cta: 'Empezar gratis',
      privacidad: 'Privacidad',
      terminos: 'Términos',
      ayuda: 'Ayuda',
    },
  },
  en: {
    nav: { demo: 'Demo', puertas: 'Doors', entrar: 'Open the chat', idioma: 'ES', idiomaLabel: 'Switch to Spanish' },
    beta: 'Free beta',
    titulo: ['What do you want', 'to do today?'],
    sub: 'Type once and several free AIs answer at the same time. You compare and keep the best one.',
    placeholder: ['Explain what an AI agent is…', 'Make me a plan to learn Python…', 'Write an email asking for a day off…', 'Give me 5 names for my brand…'],
    enviar: 'Watch the race',
    chips: [
      { k: 'explica', t: 'Explain something', q: 'Explain what an AI agent is' },
      { k: 'codigo', t: 'Write some code', q: 'Write a function that counts words' },
      { k: 'plan', t: 'Make me a plan', q: 'Make me a plan to learn Python' },
      { k: 'ideas', t: 'Give me ideas', q: 'Give me 5 names for my brand' },
    ],
    nota: 'Simulated demo: it does not use your EnerX.',
    carrera: {
      kicker: 'The race',
      titulo: 'Three AIs, one question. The winner is your call.',
      tuPregunta: 'Your question',
      escribiendo: 'typing…',
      lista: 'done',
      seg: 's',
      palabras: 'words',
      vota: 'Which one did you like best?',
      elegir: 'This one',
      ganadora: 'Your pick',
      deVerdad: 'Do it for real in SynthFlow',
      otra: 'Another question',
      ejemplo: 'Example',
    },
    pasos: [
      { n: '01', t: 'Type', d: 'Just once, the way you would talk to a person.' },
      { n: '02', t: 'Compare', d: 'Several free AIs answer side by side.' },
      { n: '03', t: 'Keep it', d: 'Pick the best one and keep chatting with it.' },
    ],
    puertas: {
      kicker: 'Doors',
      titulo: 'Some already open. Others, you open.',
      sub: 'Lit doors already work. Closed ones do not exist yet: if you want one, tell us and we will build it first.',
      abierta: 'Open',
      cerrada: 'Coming soon',
      abrir: 'Go in',
      tocar: 'Knock',
      aunNo: 'This door does not exist yet.',
      quieres: 'Want it? Your vote decides what we build first.',
      meInteresa: 'I want it',
      gracias: 'Got it! Thanks for pushing this door.',
      correo: 'Your email (optional, so we can tell you)',
      avisame: 'Let me know',
      correoOk: 'We will only write when it is ready.',
      correoMal: 'That email does not look right.',
      personas: (n) => (n === 1 ? '1 person asked for it' : `${n} people asked for it`),
      gratis: 'Nothing is charged: we just want to know what you want.',
      cerrar: 'Close',
      fallo: 'We could not save it right now. Your vote stayed on this device.',
    },
    fondo: {
      t: 'You reached the bottom.',
      d: 'There is nothing else down here… except a door that is always open.',
      cta: 'Start for free',
      privacidad: 'Privacy',
      terminos: 'Terms',
      ayuda: 'Help',
    },
  },
};

/* Las tres «IAs» de la demo. Son ejemplos: la demo no llama a ninguna IA. */
export const CORREDORAS = [
  { id: 'a', nombre: 'Llama', via: 'Groq', color: '#ff7a45', vel: 1.0 },
  { id: 'b', nombre: 'Mistral', via: 'Mistral', color: '#3de0ff', vel: 0.72 },
  { id: 'c', nombre: 'Gemini', via: 'Google', color: '#ff3d9a', vel: 0.86 },
];

/* Respuestas de ejemplo, por tipo de pregunta y por idioma (una por corredora). */
export const RESPUESTAS = {
  es: {
    explica: [
      'Un agente de IA es un programa que no solo responde: decide pasos, usa herramientas (buscar, calcular, escribir archivos) y revisa su propio resultado hasta cumplir la meta que le diste.',
      'Piensa en un asistente con manos. Le das un objetivo, lo parte en tareas pequeñas, usa lo que tenga a mano y te avisa cuando termina o cuando necesita tu ayuda.',
      'Corto: una IA que actúa. Mira, planea, hace y comprueba. Si algo sale mal, lo intenta de otra forma sin que se lo pidas.',
    ],
    codigo: [
      'Aquí tienes una función que cuenta palabras:\n\nfunction contar(t) {\n  return t.trim().split(/\\s+/).length;\n}\n\nFunciona con espacios dobles y saltos de línea.',
      'En Python sería:\n\ndef contar(t):\n    return len(t.split())\n\nsplit() sin argumentos ya ignora los espacios de más.',
      'Versión que no falla con texto vacío:\n\nconst contar = t => (t.match(/\\S+/g) || []).length;\n\nSi no hay palabras, devuelve 0.',
    ],
    plan: [
      'Plan de 4 semanas:\n1. Variables y tipos.\n2. Condiciones y bucles.\n3. Funciones y listas.\n4. Un proyecto pequeño: una agenda.\n30 minutos al día bastan.',
      'Empieza por un proyecto, no por la teoría: elige algo que quieras automatizar y aprende solo lo que ese proyecto te pida. Aprenderás el doble de rápido.',
      'Lunes a viernes, 20 minutos de ejercicios. Sábado, repaso. Domingo, descanso. Cada semana sube un poco la dificultad.',
    ],
    ideas: [
      '1. Nómada\n2. Brisa Norte\n3. Kora\n4. Faro & Co.\n5. Lumen\nCortos, fáciles de decir y con dominio probable.',
      'Si tu marca es de café: Tostadero 7, Grano Alto, Cumbre, Mañanero, Origen. Te puedo dar más si me dices el tono.',
      'Juega con tu ciudad o tu historia: un apodo, una calle, una palabra de tu abuela. Los nombres con historia se recuerdan más.',
    ],
  },
  en: {
    explica: [
      'An AI agent is a program that does more than answer: it decides steps, uses tools (search, math, writing files) and checks its own work until it reaches the goal you gave it.',
      'Think of an assistant with hands. You give it a goal, it breaks it into small tasks, uses whatever it has and tells you when it is done or needs your help.',
      'Short version: an AI that acts. It looks, plans, does and checks. If something fails, it tries another way without being asked.',
    ],
    codigo: [
      'Here is a function that counts words:\n\nfunction count(t) {\n  return t.trim().split(/\\s+/).length;\n}\n\nIt handles double spaces and line breaks.',
      'In Python it would be:\n\ndef count(t):\n    return len(t.split())\n\nsplit() with no arguments already ignores extra spaces.',
      'A version that does not break on empty text:\n\nconst count = t => (t.match(/\\S+/g) || []).length;\n\nIf there are no words, it returns 0.',
    ],
    plan: [
      '4-week plan:\n1. Variables and types.\n2. Conditions and loops.\n3. Functions and lists.\n4. A small project: a planner.\n30 minutes a day is enough.',
      'Start with a project, not with theory: pick something you want to automate and learn only what it needs. You will learn twice as fast.',
      'Monday to Friday, 20 minutes of exercises. Saturday, review. Sunday, rest. Raise the difficulty a little each week.',
    ],
    ideas: [
      '1. Nomad\n2. North Breeze\n3. Kora\n4. Lighthouse & Co.\n5. Lumen\nShort, easy to say and likely to have a free domain.',
      'If your brand sells coffee: Roastery 7, High Bean, Summit, Morning Ritual, Origin. Tell me the tone and I will give you more.',
      'Play with your city or your story: a nickname, a street, a word your grandma used. Names with a story stick.',
    ],
  },
};

/* qué tipo de pregunta es (para elegir las respuestas de ejemplo) */
export function tipoDe(texto) {
  const t = String(texto || '').toLowerCase();
  if (/c[oó]dig|code|funci[oó]n|function|python|javascript|programa|script/.test(t)) return 'codigo';
  if (/plan|aprend|learn|estudi|study|rutina|routine|semana|week/.test(t)) return 'plan';
  if (/idea|nombre|name|marca|brand|ocurr/.test(t)) return 'ideas';
  return 'explica';
}

/* Las puertas. abierta = ya existe (lleva a la página real). cerrada = puerta falsa: mide interés, no cobra nada. */
export const PUERTAS = [
  { id: 'synthflow', abierta: true, href: '/chat.html', icono: 'orbe',
    es: { t: 'SynthFlow', d: 'El chat con varias IAs gratis.' }, en: { t: 'SynthFlow', d: 'The chat with several free AIs.' } },
  { id: 'comparar', abierta: true, href: '/chat.html?mode=cmp', icono: 'balanza',
    es: { t: 'Comparar IAs', d: 'Dos o tres respuestas lado a lado.' }, en: { t: 'Compare AIs', d: 'Two or three answers side by side.' } },
  { id: 'alias', abierta: true, href: '/alias.html', icono: 'infinito',
    es: { t: 'A.L.I.A.S.', d: 'Agentes que hacen tareas por ti.' }, en: { t: 'A.L.I.A.S.', d: 'Agents that do tasks for you.' } },
  { id: 'voz', abierta: false, icono: 'onda',
    es: { t: 'Hablar en voz alta', d: 'Pregunta con tu voz y escucha la respuesta.' }, en: { t: 'Talk out loud', d: 'Ask with your voice and hear the answer.' } },
  { id: 'equipos', abierta: false, icono: 'grupo',
    es: { t: 'Chats en grupo', d: 'Tú, tus amigos y las IAs en la misma conversación.' }, en: { t: 'Group chats', d: 'You, your friends and the AIs in one conversation.' } },
  { id: 'agenda', abierta: false, icono: 'reloj',
    es: { t: 'Tareas que se hacen solas', d: 'Un agente que trabaja a la hora que le digas.' }, en: { t: 'Tasks that run themselves', d: 'An agent that works at the time you choose.' } },
  { id: 'extension', abierta: false, icono: 'pieza',
    es: { t: 'Extensión del navegador', d: 'Pregúntale a varias IAs desde cualquier página.' }, en: { t: 'Browser extension', d: 'Ask several AIs from any web page.' } },
  { id: 'mas-enerx', abierta: false, icono: 'rayo',
    es: { t: 'Más EnerX', d: 'Más energía al día para preguntar sin parar.' }, en: { t: 'More EnerX', d: 'More daily energy to keep asking.' } },
  { id: 'escritorio', abierta: false, icono: 'pantalla',
    es: { t: 'App de escritorio', d: 'SymphorIA en tu computador, con un atajo.' }, en: { t: 'Desktop app', d: 'SymphorIA on your computer, one shortcut away.' } },
];
