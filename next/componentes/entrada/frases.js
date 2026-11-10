/* SymphorIA · «Entrada» · las frases de carga.
   Mientras algo carga, la página habla: una frase al azar, distinta cada vez, y a veces con tu nombre (como hace Claude).
   Una sola fuente para todo el sitio: los componentes de React la importan y el motor viejo de SynthFlow la usa por window.SZFrases.

     frase('pensando', 'es')             → «Armando la melodía» / «Un momento, Sammuel»
     frase('pagina', lang, { n: 'Ana' })  → fuerza un nombre (si no, lo busca solo)
     nombre()                             → primer nombre de la persona, o '' si no ha entrado
     useFrase('datos', lang, { cada: 2600 })   (React) frase que cambia sola mientras dura la espera

   Reglas:
   · Nunca se repite la misma frase seguida: cada contexto reparte sus frases como una baraja (se mezclan todas y salen una por una)
     y además se recuerda la última que se vio en este navegador, así que dos cargas seguidas tampoco empiezan igual.
   · Las frases con {n} llevan el nombre; si la persona no ha entrado (o no tiene nombre) solo salen las que no lo llevan. Nunca queda un «{n}» ni una coma suelta.
   · Casi la mitad de cada lista lleva el nombre. Ninguna es larga (caben en una línea de celular).
   · El nombre se guarda solo en este navegador (localStorage «synthz:nombre»), lo escribe el motor de cuentas (core.js) y se borra al cerrar sesión.
   · Todo en español e inglés. */

export const FRASES = {
  /* se abre una página (el telón) */
  pagina: {
    es: ['Afinando los instrumentos', 'Preparando el escenario', 'Ensayando la entrada', 'Colocando cada nota en su lugar', 'Encendiendo las luces', 'Ordenando la partitura',
      'Calentando motores', 'Abriendo el telón', 'Poniendo todo a punto', 'Ya casi sale la primera nota',
      'Afinando todo para ti, {n}', 'Un momento, {n}, ya casi', 'Preparando tu sitio, {n}', 'Te estábamos esperando, {n}', 'Todo listo en un segundo, {n}', '{n}, ya abrimos el telón'],
    en: ['Tuning the instruments', 'Setting the stage', 'Rehearsing the entrance', 'Putting every note in place', 'Turning on the lights', 'Sorting the score',
      'Warming up the engines', 'Raising the curtain', 'Getting everything ready', 'The first note is almost here',
      'Tuning everything for you, {n}', 'One moment, {n}, almost there', 'Getting your spot ready, {n}', 'We were waiting for you, {n}', 'Ready in a second, {n}', '{n}, the curtain is going up'],
  },
  /* se leen datos dentro de una página (Gestión, Pulsem, A.L.I.A.S.) */
  datos: {
    es: ['Leyendo los datos', 'Juntando las cifras', 'Contando una por una', 'Poniendo todo en orden', 'Buscando lo que pediste', 'Revisando que todo cuadre',
      'Sacando las cuentas', 'Siguiendo el hilo', 'Haciendo lugar en la mesa',
      'Trayéndote todo, {n}', 'Un segundo, {n}, ya casi', 'Reuniendo lo tuyo, {n}', 'Lo estoy preparando, {n}', 'Ya viene, {n}'],
    en: ['Reading the data', 'Gathering the numbers', 'Counting them one by one', 'Putting everything in order', 'Looking for what you asked', 'Checking it all adds up',
      'Running the numbers', 'Following the thread', 'Clearing a spot on the table',
      'Bringing it all over, {n}', 'One second, {n}, almost there', 'Gathering your things, {n}', 'Getting it ready, {n}', 'Coming right up, {n}'],
  },
  /* la IA está leyendo tu mensaje (primer instante) */
  leyendo: {
    es: ['Leyendo tu mensaje', 'Entendiendo tu pedido', 'Escuchándote bien', 'Leyendo entre líneas', 'Mirando lo que me trajiste',
      'Te leo, {n}', 'A ver qué traes, {n}', 'Te escucho, {n}', 'Entendiendo lo que quieres, {n}'],
    en: ['Reading your message', 'Understanding your request', 'Listening closely', 'Reading between the lines', 'Looking at what you brought',
      'Reading you, {n}', 'Let’s see what you’ve got, {n}', 'I’m listening, {n}', 'Getting what you want, {n}'],
  },
  /* la IA está pensando (se renueva cada par de segundos) */
  pensando: {
    es: ['Pensando', 'Sopesando ideas', 'Aclarando', 'Ordenando las ideas', 'Buscando las palabras', 'Revisando', 'Afinando las ideas', 'Buscando la nota justa',
      'Armando la melodía', 'Probando acordes', 'Dándole forma a la respuesta', 'Escuchando entre líneas', 'Mezclando ideas', 'Siguiendo el hilo', 'Ensayando la respuesta',
      'Buscando el mejor ángulo', 'Poniendo todo en orden', 'Casi listo',
      'Un momento, {n}', 'Pensando en lo tuyo, {n}', 'Dándole vueltas a tu idea, {n}', 'Ya casi, {n}', 'Buscando lo mejor para ti, {n}', 'Afinando esto para ti, {n}',
      'Lo estoy pensando bien, {n}', 'Va saliendo, {n}', '{n}, déjame acomodar las ideas', 'Tu idea suena bien, {n}', 'Con calma y buena letra, {n}', 'Esto me gusta, {n}'],
    en: ['Thinking', 'Weighing ideas', 'Clearing things up', 'Sorting out the ideas', 'Finding the words', 'Double-checking', 'Tuning the ideas', 'Finding the right note',
      'Building the melody', 'Trying out chords', 'Shaping the answer', 'Listening between the lines', 'Mixing ideas', 'Following the thread', 'Rehearsing the answer',
      'Finding the best angle', 'Putting it all in order', 'Almost there',
      'One moment, {n}', 'Thinking about yours, {n}', 'Turning your idea over, {n}', 'Almost, {n}', 'Finding the best for you, {n}', 'Tuning this for you, {n}',
      'I’m thinking it through, {n}', 'It’s coming together, {n}', '{n}, let me line up the ideas', 'Your idea sounds good, {n}', 'Taking it slow and steady, {n}', 'I like this one, {n}'],
  },
  /* la IA razona antes de contestar */
  razonando: {
    es: ['Razonando', 'Razonando a fondo', 'Atando cabos', 'Pensándolo con calma', 'Probando caminos', 'Siguiendo la lógica',
      'Atando cabos por ti, {n}', 'Dándole una vuelta más, {n}', 'Esto pide calma, {n}', 'Lo razono bien, {n}'],
    en: ['Reasoning', 'Reasoning it through', 'Tying up loose ends', 'Taking it slowly', 'Trying paths', 'Following the logic',
      'Tying loose ends for you, {n}', 'One more turn, {n}', 'This one needs calm, {n}', 'Reasoning it out, {n}'],
  },
  /* la IA ya escribe */
  escribiendo: {
    es: ['Escribiendo', 'Poniéndolo en palabras', 'Redactando', 'Armando tu respuesta', 'Pasando las ideas a letras',
      'Ya te lo escribo, {n}', 'Escribiendo para ti, {n}', 'Te lo cuento, {n}', 'Va tomando forma, {n}'],
    en: ['Writing', 'Putting it into words', 'Drafting', 'Putting your answer together', 'Turning ideas into letters',
      'Writing it for you, {n}', 'Writing this for you, {n}', 'Telling you now, {n}', 'It’s taking shape, {n}'],
  },
  /* el agente (SuperiorSynth) trabaja en un pedido */
  agente: {
    es: ['Trabajando en tu pedido', 'Haciéndolo paso a paso', 'Repartiendo el trabajo', 'Armando el plan', 'Poniendo manos a la obra', 'Revisando cada paso',
      'Manos a la obra, {n}', 'Ya me pongo con lo tuyo, {n}', 'Voy paso a paso, {n}', 'Esto lo saco por ti, {n}'],
    en: ['Working on your request', 'Taking it step by step', 'Splitting up the work', 'Building the plan', 'Getting to work', 'Checking every step',
      'Getting to work, {n}', 'On it, {n}', 'Going step by step, {n}', 'I’ll get this done for you, {n}'],
  },
  /* se busca en internet */
  buscando: {
    es: ['Leo varias páginas para darte datos de hoy', 'Buscando fuentes de verdad', 'Mirando qué dice la gente que sabe', 'Cotejando lo que encuentro', 'Leyendo con lupa',
      'Siguiendo pistas por la web', 'Asomándome a la web', 'Comparando fuentes',
      'Buscándolo por ti, {n}', 'Esto lo averiguo, {n}', 'Revisando la web para ti, {n}', 'Ya casi lo encuentro, {n}', 'Con datos de hoy, {n}'],
    en: ['Reading a few pages to get you today’s facts', 'Looking for real sources', 'Checking what people who know say', 'Cross-checking what I find', 'Reading with a magnifying glass',
      'Following clues across the web', 'Peeking at the web', 'Comparing sources',
      'Looking it up for you, {n}', 'I’ll find this out, {n}', 'Checking the web for you, {n}', 'Almost found it, {n}', 'With today’s facts, {n}'],
  },
  /* se crea una imagen (cortas: se animan letra por letra) */
  imagen: {
    es: ['Pintando', 'Mezclando colores', 'Dibujando', 'Dando color', 'Revelando tu imagen', 'Afinando los trazos', 'Buscando la luz', 'Para ti, {n}', 'Ya casi, {n}', 'Con cariño, {n}'],
    en: ['Painting', 'Mixing colors', 'Drawing', 'Adding color', 'Developing your image', 'Fine-tuning the strokes', 'Finding the light', 'For you, {n}', 'Almost, {n}', 'With care, {n}'],
  },
  /* se prepara un Sintético (página, juego, dibujo) */
  sintetico: {
    es: ['Ya casi está', 'Armando las piezas', 'Encendiendo el escenario', 'Dándole los últimos toques', 'Probando que funcione',
      'Ya casi, {n}', 'Quedando listo para ti, {n}', 'Un momento, {n}', 'Esto va a gustarte, {n}'],
    en: ['Almost there', 'Putting the pieces together', 'Lighting the stage', 'Adding the final touches', 'Checking that it works',
      'Almost, {n}', 'Getting ready for you, {n}', 'One moment, {n}', 'You’re going to like this, {n}'],
  },
  /* se lee o se revisa algo (archivos, la respuesta) */
  archivo: {
    es: ['Leyendo tu archivo', 'Abriendo tu archivo', 'Revisando página por página', 'Subrayando lo importante',
      'Leyéndolo con atención, {n}', 'Lo leo todo, {n}', 'Ya casi termino de leerlo, {n}'],
    en: ['Reading your file', 'Opening your file', 'Going page by page', 'Underlining what matters',
      'Reading it closely, {n}', 'Reading all of it, {n}', 'Almost done reading, {n}'],
  },
};

const LS = 'synthz:nombre';
const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento: no pasa nada */ } } };

/* el primer nombre de la persona. Primero lo que dice la cuenta abierta ahora; si todavía no cargó, lo que guardó la última vez. */
export function limpiaNombre(x) {
  const s = String(x || '').trim().split(/\s+/)[0].replace(/^@/, '').replace(/[^\p{L}\p{M}\p{N}'’._-]/gu, '').slice(0, 24);   /* letras, números y . ' - _ ; nada más */
  return /\p{L}/u.test(s) ? s : '';
}
export function nombre() {
  if (typeof window === 'undefined') return '';
  try {
    const A = window.SZ && window.SZ.ACC;
    if (A && A.ready && A.user) { const n = limpiaNombre((A.profile && A.profile.name) || A.user.name); if (n) return n; }
  } catch (e) { /* la cuenta aún no está lista */ }
  return limpiaNombre(ls.get(LS));
}

const bolsas = {};
const mezcla = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function lang0() {
  try { const l = ls.get('synthz:lang') || (window.SZ && window.SZ.lang && window.SZ.lang()) || document.documentElement.lang || (/^en/i.test(navigator.language || '') ? 'en' : 'es');   /* lo que eligió la persona manda */ return String(l).slice(0, 2) === 'en' ? 'en' : 'es'; } catch (e) { return 'es'; }
}

/* una frase del contexto, al azar y distinta de la anterior. n: nombre a usar (si no, el de la persona). */
export function frase(ctx, lang, { n } = {}) {
  const L = lang === 'en' || lang === 'es' ? lang : lang0();
  const pool = (FRASES[ctx] || FRASES.datos)[L];
  const nom = n !== undefined ? limpiaNombre(n) : nombre();
  const sirve = (f) => nom || f.indexOf('{n}') < 0;
  const k = ctx + '|' + L + '|' + (nom ? 1 : 0);
  const last = ls.get('synthz:frase:' + ctx + L);
  let b = bolsas[k];
  if (!b || !b.length) {
    b = bolsas[k] = mezcla(pool.filter(sirve));
    if (b.length > 1 && b[b.length - 1] === last) b.unshift(b.pop());   /* la que sale primero no es la última que se vio */
  }
  const f = b.pop();
  ls.set('synthz:frase:' + ctx + L, f);
  return f.replace('{n}', () => nom);
}

/* para el motor viejo de SynthFlow (chat.js no usa módulos) */
if (typeof window !== 'undefined') {
  window.SZFrases = Object.freeze({ frase, nombre, FRASES });
}
