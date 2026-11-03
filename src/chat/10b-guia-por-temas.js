/* ===== v2.0 · Guía por temas: SynthonIA muestra solo lo que elegiste, en el orden en que lo elegiste ===== */
const TOPIC_STEPS = {
  chat:async () => {
    await gPoint(gT('#inp', '#inp'), 'Aquí escribes lo que necesitas. Entre más detalles le das (qué quieres, para qué y cómo), mejor te responde.');
    await gPoint(gT('#sendBtn', '#sendBtn'), 'Con esta flecha, o con Enter, lo envías. Si se demora mucho, el mismo botón la detiene.');
    const ex = gT('#hexR', '#hexR'); if (ex) await gPoint(ex, 'Si no sabes qué pedir, toca una de estas ideas: se escribe sola y tú decides cuándo enviarla.');
  },
  ia:async () => {
    if (agentOn()){ await gPoint(gT('#ssTop', '#ssTop'), 'Ahora estás con SuperiorSynth: él elige la IA por ti. Si quieres elegirla tú, toca aquí y «Elegir yo la IA».'); return; }
    await gPoint(gAny('#cPick', '#curChip'), 'Aquí eliges con qué IA hablas. Tócalo y se abre su ventana con temas, buscador y filtros.');
    const tc = gT('.tchip[data-topic]', '.tchip[data-topic]'); if (tc) await gPoint(tc, 'Cada tema te recomienda las IA que mejor lo hacen. Por ejemplo, «Código» te muestra las expertas en programar.');
  },
  comparar:async () => {
    if (agentOn()){ await gPoint(null, 'Comparar se usa sin SuperiorSynth: vuelve a «Chats» y verás el botón «Comparar con otra IA» abajo.'); return; }
    await gPoint(gAny('#sNav [data-sn="cmp"]', '#pickRow [data-add]'), 'Aquí, aparte, comparas IAs: eliges hasta 4. Todas responden la misma pregunta y aparecen lado a lado, en el orden en que llegan. Ojo: cada una gasta lo suyo.');
  },
  agente:async () => {
    await gPoint(gT('#cMode', '#cMode'), 'SuperiorSynth se elige aquí, en el botón de modo junto a la caja de escribir.');
    await gPoint(null, 'Con SuperiorSynth no eliges IA: tú escribes, él entiende tu pedido, lo mejora, elige la IA que más sabe de eso y te muestra cada paso. Al final decides si te quedas con esa IA o sigues con SuperiorSynth.', { mood:'guino' });
  },
  archivos:async () => {
    await gPoint(gT('#attachBtn', '#attachBtn'), 'Con el «+» le das a la IA fotos, PDF o archivos de texto. Ahí mismo creas imágenes, buscas en internet o pides respuestas cortas.');
    const fc = gT('.fcard', '.fcard');
    if (fc) await gPoint(fc, 'Y cuando la IA te da un archivo, sale así: tócalo para ver el código; si es una página, mira su vista previa y descárgala con su nombre.');
    else await gPoint(null, 'Y cuando la IA te da un archivo (una página, un código…), sale como una tarjeta: ves el código, su vista previa si se puede, y lo descargas con su nombre.');
  },
  extras:async () => {
    await gPoint(gT('#attachBtn', '#attachBtn'), 'En el «+» está «Buscar en internet»: la IA busca datos de hoy y te muestra de dónde los sacó. Si preguntas por algo de hoy, busca sola.');
    await gPoint(gT('#cfgBtn', '#tabbar [data-tab="cfg"]'), 'Y en Ajustes › «IAs y memoria» ves lo que recuerdo de ti y lo borras cuando quieras.', { side:true });
    await gPoint(null, 'Un truco más: escribe «hazme una presentación de…» y te la entrego lista para PowerPoint.', { mood:'guino' });
  },
  chats:async () => {
    await gPoint((gT('#thList', '#tabbar [data-tab="chats"]') || gT('#rail [data-r="chats"]', '#tabbar [data-tab="chats"]')), 'Tus chats quedan aquí. Si entras con tu cuenta, los ves en cualquier celular o computador.', { side:true });
    await gPoint((gT('#sNav [data-sn="more"]', '#tabbar [data-tab="chats"]') || gT('#railFav', '#tabbar [data-tab="chats"]')), 'Y aquí tus favoritos: las respuestas que guardas con la estrella ★.', { side:true });
  },
  limite:async () => {
    await gPoint(gAny('#payPill', '#railCoin', '#payL', '#payM'), 'Aquí ves cómo va tu límite gratis de hoy: el anillo se va vaciando y a medianoche se llena otra vez. Sin cuenta son 5 mensajes al día; con tu cuenta gratis, mucho más.', { pad:6 });
  },
  cuenta:async () => {
    await gPoint((gT('#sAcc', '#tabbar [data-tab="me"]') || gT('#accBtn', '#tabbar [data-tab="me"]')), 'Aquí entras o creas tu cuenta gratis: sin correo ni tarjeta. Tus chats y favoritos te siguen a todas partes.', { side:true });
    await gPoint(null, 'Y si quieres más, conecta Puter y usa la versión pro de las IAs más usadas (ChatGPT, Claude, Gemini…), gratis y con un clic.', { mood:'guino' });
  },
  ajustes:async () => {
    await gPoint(gT('#cfgBtn', '#tabbar [data-tab="cfg"]'), 'Ajustes tiene 2 pestañas: «Página» (más bonito o más rápido, sonidos, animaciones) e «IAs y memoria» (modo principiante, respuestas cortas, lo que recuerdo de ti y tus IAs).', { side:true });
  },
  synthonia:async () => {
    await gPoint(gT('#szBot', '#szBot'), 'Y yo siempre estoy aquí. Tócame y pregúntame cómo se hace algo: te lo explico o te lo señalo con mi manita.', { mood:'encantada' });
  }
};
async function runTopics(list){
  await SZ.synReady;
  list = (list || []).filter(k => TOPIC_STEPS[k]);
  if (G || !list.length) return;
  closeSide(); closeChatsSheet(); if (tourEl) closeTour(false);
  G = { skip:false, total:list.length, topics:[] };
  root.classList.add('guiding');
  try{
    if (mode !== 'solo') setMode('solo');
    H.show({ x:innerWidth - 60, y:innerHeight - 70 });
    await gWait(80);
    for (let i = 0; i < list.length; i++){
      const T = SZ.GTOPICS.find(t => t[0] === list[i]);
      gHud(i + 1, T ? T[1] : 'Guía');
      await TOPIC_STEPS[list[i]]();
      H.unspot && H.unspot();
    }
    endGuide(true);
  }catch(e){ if (!(e && e.guide)) console.error('[synthz] guía', e); endGuide(false); }
}
window.SynthFlowTopics = runTopics;
