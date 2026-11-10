/* ===== v3.2 · barra de escribir, lista de chats y barra Simple: Sona lo cuenta y lo explica ===== */
WHATSNEW.v = '3.2';
WHATSNEW.items.unshift(
  ['chat', B.LANG === 'en'
    ? 'Tidier chat list: on top only «New chat» and search, and below all your chats. Projects and Synthetics stay in the icon bar; if you want them on top too, pick them in Settings › «Shortcuts in your chats».'
    : 'Lista de chats más limpia: arriba solo «Nuevo chat» y buscar, y debajo todos tus chats. Proyectos y Sintéticos siguen en la barrita de íconos; si los quieres arriba también, elígelos en Ajustes › «Atajos en tus chats».'],
  ['chat', B.LANG === 'en'
    ? 'The Simple style now has a sidebar like Claude\'s: Create, Projects, Synthetics, Customize and More on top, your recent chats in the middle, and your account and a magnifier to search at the bottom.'
    : 'El estilo Simple ahora tiene una barra como la de Claude: Crear, Proyectos, Sintéticos, Personalización y Más arriba, tus chats recientes en medio, y abajo tu cuenta y una lupa para buscar.'],
  ['chat', B.LANG === 'en'
    ? 'The writing box is lighter: «Short answers», Internet and Image are now little bubbles next to the «+» (hover to see the name, tap to turn off). And the EnerX battery is smaller.'
    : 'La caja de escribir quedó más liviana: «Respuestas cortas», Internet e Imagen ahora son bolitas junto al «+» (pasa el puntero para ver el nombre, tócalas para apagar). Y la batería EnerX es más pequeña.'],
  ['chat', B.LANG === 'en'
    ? 'Every new chat greets you with a different phrase. And if you don\'t know what «FlowIA» means, tap the button under the greeting: it is explained there.'
    : 'Cada chat nuevo te saluda con una frase distinta. Y si no sabes qué significa «FlowIA’r», toca el botón debajo del saludo: ahí te lo explicamos.'],
  ['synthonia', B.LANG === 'en'
    ? 'If you leave the page alone for 2 minutes I fall asleep in the middle of the screen. A minute and a half later I wake up and play with the page: I hang from titles, exercise, juggle… When you come back I get a fright, run to my corner and say «Oh, you\'re back!».'
    : 'Si dejas la página quieta 2 minutos me duermo en la mitad de la pantalla. Un minuto y medio después me despierto y juego con la página: me cuelgo de los títulos, hago ejercicio, malabares… Cuando vuelves me asusto, corro a mi rincón y te digo «¡Ah, volviste!».']
);
BOT_FAQ.push(
  { k:'flow flowia flowiar flowiando flowiamos que significa que es significado palabra ingles what does mean meaning word',
    a:'«Flow» (se dice «flou») es una palabra en inglés que significa fluir, como el agua de un río: cuando todo sale fácil, sin trabarse. «IA» es la inteligencia artificial. «FlowIA’r» es un verbo que inventamos uniendo las dos: hacer lo que necesitas (escribir, estudiar, crear, programar) de forma fácil, con ayuda de la IA. «¿Qué quieres FlowIA’r hoy?» = «¿Qué quieres hacer hoy con ayuda de la IA?».',
    en:'«Flow» means flowing, like water in a river: when everything goes easy, without getting stuck. «IA» is how Spanish says AI (artificial intelligence). «FlowIA» is a word we made up by joining them: doing what you need (write, study, create, code) the easy way, with the help of AI. «What do you want to FlowIA today?» = «What would you like to do today with the help of AI?».' },
  { k:'proyectos sinteticos barra lista chats arriba quitar poner atajos projects synthetics sidebar list shortcuts top remove add',
    a:'Arriba de tu lista de chats solo van «Nuevo chat» y buscar. Si quieres también Proyectos, Sintéticos o los dos, elígelo en Ajustes › Página › «Atajos en tus chats». Siempre los tienes en la barrita de íconos de la izquierda.',
    en:'Above your chat list there are only «New chat» and search. If you also want Projects, Synthetics or both, choose it in Settings › Page › «Shortcuts in your chats». They are always in the icon bar on the left.', pre:openCfg(), go:['#sAcc', '#cfgBtn', '[data-tab="cfg"]'] },
  { k:'frase frases saludo saludos bienvenida repite repiten cambia distinta greeting greetings phrase phrases repeat different welcome',
    a:'Al entrar siempre te saludo con «¿Qué quieres FlowIA’r hoy?». En cada chat nuevo sale otra frase, y ninguna se repite hasta que salgan las 40. Debajo del saludo está el botón «¿Qué significa FlowIA’r?»: sin cuenta sale siempre; con cuenta, la primera vez.',
    en:'When you come in I always greet you with «What do you want to FlowIA today?». Every new chat shows another phrase, and none repeats until all 40 have shown. Under the greeting there is the «What does FlowIA mean?» button: without an account it always shows; with an account, the first time.' },
  { k:'simple estilo barra lateral claude crear personalizacion mas cuenta lupa recientes sidebar create customize more account magnifier recents',
    a:'En el estilo Simple la barra es como la de Claude: arriba Crear (chat nuevo), Comparar IAs, Espacios, Obras y Favoritos. En medio, «Recientes» con tus chats, y abajo tu perfil y una lupa para buscar. Al tocar tu perfil sale un panelito con Ajustes, Idioma, Obtener ayuda, Planes y Más información (la guía, tu EnerX, Términos y Privacidad). Se elige en Ajustes › General › Estilo › Simple.',
    en:'In the Simple style the sidebar is like Claude\'s: on top Create (new chat), Compare AIs, Spaces, Works and Favorites. In the middle, «Recents» with your chats, and at the bottom your profile and a magnifier to search. Tap your profile for a little panel with Settings, Language, Get help, Plans and More info (the guide, your EnerX, Terms and Privacy). Choose it in Settings › General › Style › Simple.', pre:openCfg(), go:['#sAcc', '#cfgBtn', '[data-tab="cfg"]'] },
  { k:'bolita bolitas hojita junto mas chip chips encendido apagar internet imagen cortas bubble bubbles leaf next plus on off',
    a:'Lo que tengas encendido en la caja de escribir (Respuestas cortas, Internet, Crear imagen) aparece como una bolita junto al «+». Pasa el puntero para ver su nombre y tócala para apagarlo.',
    en:'Whatever you have on in the writing box (Short answers, Internet, Create image) shows as a little bubble next to the «+». Hover to see its name and tap it to turn it off.', go:['#onChips', '#attachBtn'] },
  { k:'dormida pantalla mitad duerme duermes dormirte despiertas despierta dormir sueño juega jugar inactiva quieta siesta ejercicio malabares volviste asleep sleep sleeping play plays idle nap exercise juggle back',
    a:'Si dejas la página quieta 2 minutos, salgo de mi rincón y me duermo en la mitad de la pantalla. Un minuto y medio después me despierto y juego con la página: me cuelgo de un título con mi antena, hago ejercicio, órbitas de luz, rebotes… Tres juegos y vuelvo a dormir. Cuando mueves el mouse me asusto, corro a mi rincón y te digo «¡Ah, volviste!». Nada se daña: todo vuelve a su lugar. Con Animaciones apagadas solo me duermo en mi botón.',
    en:'If you leave the page still for 2 minutes, I leave my corner and fall asleep in the middle of the screen. A minute and a half later I wake up and play with the page: I hang from a title by my antenna, exercise, make light orbits, bounce… Three games and I sleep again. When you move the mouse I get a fright, run to my corner and say «Oh, you\'re back!». Nothing breaks: everything goes back in place. With Animations off I just sleep in my button.' }
);
/* si alguien pregunta por «la barra del estilo Simple», gana la respuesta nueva (antes ganaba la de colores y temas) */
{ const i = BOT_FAQ.findIndex(f => f.k.startsWith('simple estilo barra lateral')); if (i > 0) BOT_FAQ.unshift(BOT_FAQ.splice(i, 1)[0]); }
