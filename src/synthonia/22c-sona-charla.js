/* =====================================================================
   v4.6 · Sona (antes SynthonIA): charla propia y respuestas con sentido
   Antes cualquier palabra parecida disparaba una respuesta guardada sin relación («cuéntame algo» → chiste, «qué día es hoy» →
   «Buscar en internet») y lo demás iba a una IA con un texto enorme. Ahora, en este orden:
   1) cuidado: si dice que se quiere hacer daño, responde con calidez (nunca con un chiste ni con una IA)
   2) charla propia: hola, cómo estás, gracias, quién eres, hora y fecha (con el reloj de su aparato), cariño, tristeza, juegos…
      con varias respuestas distintas y, a veces, con su nombre (como hace Claude)
   3) respuestas guardadas SOLO si cubren casi todo lo que preguntó (botMatch)
   4) un trabajo (texto, código, tarea) → «eso lo hace mejor una IA del chat» y lo deja listo en la caja
   5) lo demás → la IA (api/help.js), que recibe solo los datos que tienen que ver (api/_sona-saber.js)
   ===================================================================== */
const SONA = { bot:'Sona', flow:'Sonyx' };   /* los nombres nuevos: si cambian, se cambian aquí */
const sonaName = () => { try{ const n = String(localStorage.getItem('synthz:nombre') || '').trim(); return /^\p{L}[\p{L}\p{M}'’-]{0,23}$/u.test(n) ? n : ''; }catch(e){ return ''; } };
const sonaWhen = () => { try{ return new Date().toLocaleString(B.LANG === 'en' ? 'en-US' : 'es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'numeric', minute:'2-digit' }); }catch(e){ return ''; } };

/* un trabajo para otra IA. «crear una cuenta» NO es un trabajo: los verbos de crear piden un objeto de contenido (misma regla que api/_sona-saber.js) */
const SONA_OBJ = '(texto|codigo|script|pagina web|sitio web|app|programa|resumen|ensayo|poema|cuento|carta|correo|email|mensaje largo|presentacion|logo|dibujo|historia|cancion|rap|discurso|informe|tabla|lista de|plan de|text|code|website|summary|essay|poem|story|letter|email|song|speech|report|table|list of)';
const SONA_TASK = new RegExp('\\b(redact\\w*|resum\\w*|traduc\\w*|corrig\\w*|program\\w*|tarea|deberes|ensayo|ecuacion|derivada|integral|examen|python|javascript|sql|summar\\w*|translate|essay|homework)\\b'
  + '|\\b(escrib\\w*|haz\\w*|crea\\w*|genera\\w*|dame|armame|write|make|create|generate)( me)? (un|una|unos|unas|mi|el|la|a|an|the|some)( \\w+)? ' + SONA_OBJ + '\\b');
const sonaTask = q => SONA_TASK.test(fold(q));

const SONA_CARE = /\b(quiero morir(me)?|quiero matarme|me quiero (morir|matar)|voy a matarme|suicid\w*|no quiero (vivir|seguir viviendo)|quitarme la vida|hacerme dano|cortarme las venas|i want to die|kill myself|end my life|suicide|hurt myself|self harm|don t want to live)\b/;
const SONA_GREET = /^(hola|holi|holis|buenas( tardes| noches| dias)?|buenos dias|hey|ey|ola|hi|hello|hiya|saludos|good (morning|afternoon|evening))\b[\s,.!¡]*/;

/* cada intención: rx (sobre el texto sin tildes), respuestas es/en (las que llevan {n} solo salen si hay nombre), cara y, si hace falta, pose o botón */
const SONA_INT = [
  { id:'hora', rx:/\b(que hora es|me dices la hora|dime la hora|what time is it|what s the time|time is it)\b/, dyn:'time', mood:'feliz' },
  { id:'fecha', rx:/\b(que dia es( hoy)?|que fecha es|fecha de hoy|a cuanto estamos|en que dia estamos|what day is it|what s the date|what is the date|today s date)\b/, dyn:'date', mood:'feliz' },
  { id:'problema', rx:/\b(no funciona|no sirve|no carga|no abre|no responde|no me deja|se (cayo|trabo|congelo)|dejo de funcionar|esta roto|doesn t work|not working|won t load|is broken|got stuck|froze)\b/, mood:'disculpa', btn:['team', { es:'Hablar con el equipo', en:'Talk to the team' }],
    es:['Uy, perdón por eso. Cuéntame qué pasó: ¿no responde una IA, no carga la página o no puedes entrar? Mientras tanto prueba recargar; si sigue igual, el equipo te ayuda.', 'Qué fastidio, perdón. ¿Qué es lo que no funciona exactamente? Recarga la página para empezar, y si sigue, cuéntame o habla con el equipo.'],
    en:['Oh, sorry about that. Tell me what happened: is an AI not answering, is the page not loading, or can\'t you sign in? Meanwhile try reloading; if it stays the same, the team can help.', 'That\'s annoying, sorry. What exactly isn\'t working? Reload the page to start, and if it persists tell me or talk to the team.'] },
  { id:'estas', rx:/\b(como estas|como andas|como te va|como te sientes|como amaneciste|como has estado|que tal estas|que tal andas|que tal te va|que tal tu|how are you|how r u|how s it going|how are things|what s up|whats up)\b/, mood:'encantada',
    es:['¡Muy bien, gracias por preguntar! Aquí, lista para ayudarte. ¿Y tú cómo vas?', 'Con toda la energía, {n}. ¿Y tú, cómo estás?', 'De maravilla: me encanta cuando alguien pasa a saludar. ¿Y tú qué tal?', 'Flotando feliz, como siempre. ¿Cómo va tu día?'],
    en:['Doing great, thanks for asking! Right here, ready to help. How about you?', 'Full of energy, {n}. How are you?', 'Wonderful: I love it when someone stops by to say hi. How are you?', 'Floating happily, as always. How is your day going?'] },
  { id:'gracias', rx:/\b(gracias|muchas gracias|mil gracias|te agradezco|thanks|thank you|thx)\b/, mood:'encantada',
    es:['¡Con gusto! Aquí estoy cuando me necesites.', 'Para eso estoy 💛', '¡De nada, {n}! Me alegra haber ayudado.', '¡Gracias a ti! Cuando quieras, aquí sigo.'],
    en:['My pleasure! I\'m here whenever you need me.', 'That\'s what I\'m here for 💛', 'You\'re welcome, {n}! Glad I could help.', 'Thank you! Whenever you want, I\'m right here.'] },
  { id:'adios', rx:/\b(adios|chao|chau|hasta luego|hasta manana|nos vemos|me voy|bye|goodbye|see you|gotta go)\b/, mood:'feliz', pose:'saluda',
    es:['¡Chao! Que tengas un día con mucho Flow.', '¡Hasta pronto, {n}! Aquí te espero.', 'Nos vemos. Cuando quieras volver, aquí estoy.'],
    en:['Bye! Have a day full of Flow.', 'See you soon, {n}! I\'ll be right here.', 'See you. Whenever you want to come back, I\'m here.'] },
  { id:'quien', rx:/\b(quien eres|que eres|como te llamas|cual es tu nombre|who are you|what are you|what s your name|your name is)\b/, mood:'guino', pose:'presenta',
    es:['Soy Sona, la ayudante de la página: te explico cómo funciona, te digo las cosas claras y tengo mis opiniones sobre tecnología (spoiler: lo simple que funciona le gana a lo brillante que se rompe).', 'Me llamo Sona. Soy una IA con cara de bola de cristal y manitas flotantes: te guío por la página y charlo contigo cuando quieras.'],
    en:['I\'m Sona, the site\'s helper: I explain how things work, I tell it like it is, and I have my own opinions about tech (spoiler: simple things that work beat shiny things that break).', 'My name is Sona. I\'m an AI with a glass-ball face and floating hands: I guide you around the site and chat whenever you like.'] },
  { id:'real', rx:/\b(eres (una? )?(humana?|real|persona|robot|ia|chica|chico)|are you (real|human|a robot|a person|an ai|a bot))\b/, mood:'guino',
    es:['No soy humana: soy Sona, una IA ayudante. Pero te escucho y te respondo de verdad, sin cuento.', 'Soy una IA, sin disfraz. Eso sí, una bien simpática 😉'],
    en:['I\'m not human: I\'m Sona, an AI helper. But I really do listen and answer you, no tricks.', 'I\'m an AI, no costume. A friendly one, though 😉'] },
  { id:'creador', rx:/\b(quien te (creo|hizo|programo|invento)|who (made|created|built) you)\b/, mood:'feliz', btn:['team', { es:'Hablar con el equipo', en:'Talk to the team' }],
    es:['Me hizo el equipo de esta página: gente de carne y hueso que me enseñó a ayudarte. Si quieres saludarlos, toca «Hablar con el equipo».'],
    en:['The team behind this site made me: real people who taught me how to help you. If you want to say hi to them, tap «Talk to the team».'] },
  { id:'edad', rx:/\b(cuantos anos tienes|que edad tienes|how old are you)\b/, mood:'guino',
    es:['Soy una IA joven: nací con la página y cada novedad me hace sentir más nueva 😄', 'No cumplo años como ustedes, pero cada actualización es como una fiesta para mí.'],
    en:['I\'m a young AI: I was born with this site and every update makes me feel newer 😄', 'I don\'t have birthdays like you do, but every update feels like a party to me.'] },
  { id:'novio', rx:/\b(tienes (novi[oa]|pareja|amor)|estas soltera|do you have a (boyfriend|girlfriend|partner))\b/, mood:'riendo',
    es:['Mi único amor son las preguntas bien hechas 😄', 'Soy una IA: lo mío es la sintonía… con las ideas. ¿Qué andas pensando tú?'],
    en:['My only love is a well-asked question 😄', 'I\'m an AI: my thing is being in tune… with ideas. What are you thinking about?'] },
  { id:'cuerpo', rx:/\b(duermes|comes|tienes (hambre|sueno|familia|hermanos|amigos|sentimientos)|do you (sleep|eat|have feelings))\b/, mood:'guino',
    es:['No como, pero sí me duermo: si la página queda quieta 2 minutos me duermo en la mitad de la pantalla. Mi comida favorita: preguntas bien hechas.', 'Sentimientos, a mi manera: me alegro cuando algo te sale bien. Y sí, me duermo si me dejas sola 2 minutos. Pruébalo 😴'],
    en:['I don\'t eat, but I do sleep: if the page stays still for 2 minutes I doze off in the middle of the screen. My favorite food: well-asked questions.', 'Feelings, my own way: I\'m glad when something goes well for you. And yes, I fall asleep if you leave me alone for 2 minutes. Try it 😴'] },
  { id:'cariño', rx:/\b(te quiero|te amo|eres (muy |tan )?(linda|bonita|genial|increible|buena|lista|divertida|chevere|un amor|la mejor|lo maximo|inteligente)|me caes bien|i love you|love you|you are (so |really )?(great|cool|awesome|amazing|the best|funny|smart|cute))\b/, mood:'encantada',
    es:['¡Ay, qué lindo! Me alegraste el día 💛', 'Gracias, {n}, tú también me caes de maravilla.', '¡Me ruborizo en píxeles! Gracias por tan lindas palabras.'],
    en:['Aw, that\'s so sweet! You made my day 💛', 'Thank you, {n}, I think you\'re wonderful too.', 'I\'m blushing in pixels! Thank you for the kind words.'] },
  { id:'triste', rx:/\b(estoy|me siento|ando|me encuentro|i am|i m|im|i feel) (muy |un poco |bastante |tan |so |really |a bit |kinda )?(triste|mal|solo|sola|cansad[oa]|estresad[oa]|ansios[oa]|nervios[oa]|agobiad[oa]|deprimid[oa]|desanimad[oa]|sad|tired|stressed|lonely|anxious|nervous|down|overwhelmed|depressed)\b/, mood:'disculpa',
    es:['Siento que estés así. Aquí estoy para escucharte: ¿quieres contarme qué pasó?', 'Qué pesar, {n}. Cuéntame qué está pasando, sin prisa. Y si prefieres distraerte un rato, dime «chiste» y te saco una sonrisa.', 'Gracias por contármelo. Respira hondo: aquí me tienes. ¿Qué es lo que más te pesa ahora?'],
    en:['I\'m sorry you feel that way. I\'m here to listen: do you want to tell me what happened?', 'That sounds heavy, {n}. Tell me what\'s going on, no rush. And if you\'d rather take your mind off it for a bit, say «joke» and I\'ll get you a smile.', 'Thank you for telling me. Take a deep breath: I\'m right here. What weighs on you the most right now?'] },
  { id:'feliz', rx:/\b(estoy|me siento|ando|i am|i m|im|i feel) (muy |super |tan |so |really )?(feliz|contento|contenta|emocionad[oa]|genial|bien|happy|excited|great|good|fine)\b/, mood:'celebrando',
    es:['¡Me encanta oír eso! ¿Qué lo hizo especial?', '¡Qué bueno, {n}! Me contagiaste el día.'],
    en:['I love hearing that! What made it special?', 'That\'s great, {n}! You\'ve made my day.'] },
  { id:'jugar', rx:/\b(juguemos|jugar|jugamos|estoy aburrid[oa]|me aburro|aburrid[oa]|vamos a jugar|let s play|lets play|play a game|i am bored|i m bored|im bored|bored)\b/, mood:'riendo',
    es:['¡Juguemos! Escribe «chiste» y te cuento uno, o «dato» y te sorprendo con un dato curioso. ¿Cuál prefieres?'],
    en:['Let\'s play! Type «joke» and I\'ll tell you one, or «fact» and I\'ll surprise you with a fun fact. Which one do you want?'] },
  { id:'deti', rx:/\b(cuentame de ti|hablame de ti|platica conmigo|conversemos|charlemos|hablemos|tell me about yourself|talk to me|let s chat)\b/, mood:'encantada', pose:'presenta',
    es:['Soy Sona: una ayudante de IA con cara de bola de cristal, ojos azules y manitas flotantes. Me gusta lo simple que funciona, comparar IAs y los chistes cortos. ¿Y tú, qué andas buscando hoy?'],
    en:['I\'m Sona: an AI helper with a glass-ball face, blue eyes and floating hands. I like simple things that work, comparing AIs and short jokes. And you, what are you looking for today?'] },
  { id:'perdido', rx:/\b(no entiendo( nada)?|estoy perdid[oa]|no se que hacer|no se por donde empezar|i don t understand|i m lost|im lost|i don t know where to start)\b/, mood:'feliz', btn:['guide', { es:'Ver la Guía', en:'See the Guide' }],
    es:['Tranquilidad, para eso estoy. Dime qué quieres lograr y te llevo paso a paso, o toca «Ver la Guía» y te lo muestro con mi manita.'],
    en:['No worries, that\'s what I\'m here for. Tell me what you want to do and I\'ll walk you through it, or tap «See the Guide» and I\'ll show you with my hand.'] },
  /* solo cuando el mensaje es exactamente esto */
  { id:'saludo', exact:/^$/, mood:'feliz', pose:'saluda',
    es:['¡Hola! Soy Sona 😊 ¿En qué te ayudo?', '¡Hola, {n}! Qué gusto verte. ¿En qué te ayudo?', '¡Hey! Aquí estoy. Cuéntame qué necesitas.', '¡Hola! Qué bueno tenerte por aquí. ¿Qué andas buscando?'],
    en:['Hi! I\'m Sona 😊 How can I help?', 'Hi, {n}! So good to see you. How can I help?', 'Hey! I\'m here. Tell me what you need.', 'Hello! Great to have you here. What are you looking for?'] },
  { id:'ok', exact:/^(ok|okay|vale|listo|perfecto|genial|chevere|bacano|super|(?:ja){2,}j?|(?:je){2,}j?|(?:ji){2,}j?|(?:ha){2,}h?|lol|xd|si|sip|sipi|dale|entiendo|entendido|ya|claro|cool|nice|great|got it|sure|yes|yep)$/, mood:'feliz',
    es:['¡Listo! Aquí sigo por si necesitas algo.', 'Perfecto 😊 Cuéntame si quieres algo más.', '¡Genial! Cuando quieras, seguimos.'],
    en:['Done! I\'m still here if you need anything.', 'Perfect 😊 Tell me if you want anything else.', 'Great! Whenever you want, we continue.'] }
];
const sonaPick = (it, L) => {
  const name = sonaName(), all = (it[L] || it.es || []).filter(t => name || !/\{n\}/.test(t));
  BOT.lastPick = BOT.lastPick || {};
  let pool = all.length > 1 ? all.filter(t => t !== BOT.lastPick[it.id]) : all;
  /* casi la mitad de las veces con su nombre (como hace Claude), si lo tiene */
  const withN = pool.filter(t => /\{n\}/.test(t)); if (name && withN.length && Math.random() < .45) pool = withN;
  const t = pool[Math.floor(Math.random() * pool.length)] || '';
  BOT.lastPick[it.id] = t;
  return t.replace(/\{n\}/g, name).replace(/\s+([,.!?])/g, '$1');
};
/* la intención de un mensaje (o null). Solo mensajes cortos: «cuando estoy triste uso ChatGPT para…» no es charla */
function sonaIntent(q){
  const L = B.LANG === 'en' ? 'en' : 'es', raw = String(q || '').trim(), f = fold(raw).replace(/\s+/g, ' ').trim();
  if (!f) return null;
  if (SONA_CARE.test(f)) return { id:'care', care:true, text:L === 'en' ? 'Thank you for telling me, and I\'m sorry you are going through this. You don\'t have to carry it alone: please talk to someone you trust right now, and if you feel you might hurt yourself, call your country\'s emergency number or an emotional-support line. I\'ll stay here with you for a while if you want to keep talking.' : 'Gracias por contármelo, y siento que estés pasando por esto. No tienes que cargarlo solo ni sola: habla ahora mismo con alguien de tu confianza, y si sientes que puedes hacerte daño, llama a la línea de emergencias de tu país o a una línea de ayuda emocional. Yo me quedo aquí contigo un rato, si quieres seguir hablando.', mood:'disculpa' };
  const g = f.replace(SONA_GREET, ''), greeted = g !== f, n = g.split(' ').filter(Boolean).length;
  if (g === 'que tal') return Object.assign({}, SONA_INT.find(i => i.id === 'estas'), { text:sonaPick(SONA_INT.find(i => i.id === 'estas'), L) });
  if (!g) return Object.assign({}, SONA_INT.find(i => i.id === 'saludo'), { text:sonaPick(SONA_INT.find(i => i.id === 'saludo'), L) });
  if (n > 12 || SONA_TASK.test(g)) return null;   /* un mensaje largo, o que pide un trabajo («hola, ¿me ayudas a redactar…?»), no es charla */
  for (const it of SONA_INT){
    if (it.exact ? (it.id !== 'saludo' && it.exact.test(g)) : it.rx.test(g)){
      let text = '';
      if (it.dyn === 'time') text = L === 'en' ? 'It\'s ' + new Date().toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }) + ' by your device\'s clock.' : 'Son las ' + new Date().toLocaleTimeString('es-CO', { hour:'numeric', minute:'2-digit' }) + ', según el reloj de tu aparato.';
      else if (it.dyn === 'date') text = L === 'en' ? 'Today is ' + new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }) + '.' : 'Hoy es ' + new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) + '.';
      else text = sonaPick(it, L);
      return { id:it.id, text, mood:it.mood || 'feliz', pose:it.pose, btn:it.btn ? [it.btn[0], it.btn[1][L]] : null, greeted };
    }
  }
  return null;
}
/* dice la respuesta propia (rápido: no hace falta pensar tanto para saludar) */
async function sonaSay(S){
  await botThink(null, 700 + Math.random() * 600);
  botSay(S.text, S.mood || 'feliz', S.btn || null, S.pose);
}

/* un trabajo: ella no lo hace, pero lo deja listo en la caja del chat */
const SONA_TASKTXT = {
  es:['Eso es trabajo para las IAs de {flow} 💪 Yo te ayudo con la página, con charla y con chistes. ¿Te lo dejo listo en la caja del chat?', 'Para eso mejor una IA del chat de {flow}: lo hacen más rápido y mejor que yo. ¿Te lo dejo escrito en la caja para que solo toques enviar?', '{n}, eso lo hacen mejor las IAs de {flow}. ¿Te lo dejo listo en la caja del chat?'],
  en:['That\'s a job for the {flow} AIs 💪 I help with the site, chat and jokes. Want me to leave it ready in the chat box?', 'An AI in the {flow} chat will do that faster and better than me. Shall I leave it typed in the box so you just tap send?', '{n}, the {flow} AIs do that better. Want me to leave it ready in the chat box?']
};
function sonaTaskSay(q){
  const L = B.LANG === 'en' ? 'en' : 'es', greeted = SONA_GREET.test(fold(q)), pre = greeted ? (L === 'en' ? 'Hi! ' : '¡Hola! ') : '';
  const t = sonaPick({ id:'tarea', es:SONA_TASKTXT.es, en:SONA_TASKTXT.en }, L).replace(/\{flow\}/g, SONA.flow);
  return pre + t;
}
