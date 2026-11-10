/* ===== v3.1 · Movimiento: Sona sabe por qué todo se mueve, cómo apagarlo y qué cambió =====
   La capa de animaciones vive en movimiento.css / movimiento.js (src/movimiento*). Aquí solo va lo que Sona cuenta y las novedades. */
WHATSNEW.v = '3.1';
WHATSNEW.items.unshift(
  ['guia', B.LANG === 'en'
    ? 'Where to tap is easy to see now: «Start free», the Next and Show me buttons of the guide and «Connect Puter» have a light flowing around their edge. And the «this is how it will look» preview in Settings moves again, with the new design.'
    : 'Ahora se ve dónde tocar: «Empezar gratis», los botones de Siguiente y Muéstrame de la guía y «Conectar Puter» tienen una luz que corre por su borde. Y la vista previa «así se verá» de Ajustes se mueve otra vez, con el diseño nuevo.'],
  ['portada', B.LANG === 'en'
    ? 'Animations are back everywhere: blocks glide in as you scroll, cards glow under your pointer, buttons ripple when you tap them, and windows and lists come in one after another.'
    : 'Volvieron las animaciones en todo: los bloques entran al bajar, las tarjetas brillan bajo tu puntero, los botones dejan una onda al tocarlos y las ventanas y listas entran una tras otra.'],
  ['ajustes', B.LANG === 'en'
    ? 'Your Settings decide now, not your computer: if Windows has its visual effects off, ' + BRAND() + ' still looks complete. To make it calmer, turn off Animations or use the faster mode in Settings.'
    : 'Ahora mandan tus Ajustes, no tu computador: aunque Windows tenga apagados sus efectos visuales, ' + BRAND() + ' se ve completa. Si la quieres más tranquila, apaga Animaciones o usa el modo más rápido en Ajustes.']
);
BOT_FAQ.push(
  { k:'animacion animaciones movimiento mueve moverse brillo onda efecto efectos transicion transiciones smooth suave animation animations motion moving glow ripple effects transition',
    a:'Todo se mueve a propósito: los bloques entran al bajar, las tarjetas brillan bajo tu puntero, los botones dejan una onda al tocarlos, los íconos saltan y las ventanas entran en cascada. Solo se mueve lo que no pesa (posición y transparencia), así va fluido hasta en el celular. Si prefieres calma: Ajustes › «Animaciones», o el modo «Más rápido».',
    en:'Everything moves on purpose: blocks glide in as you scroll, cards glow under your pointer, buttons ripple when you tap them, icons hop and windows cascade in. Only light things move (position and transparency), so it stays smooth even on phones. If you prefer calm: Settings › Effects › «Animations», or the «Faster» mode.', pre:openCfg(), go:['#sAcc', '#cfgBtn', '[data-tab="cfg"]'] },
  { k:'apagar quitar animaciones lento lag laguea tranquilo marea mareo quieto rapido turn off disable animations slow laggy calm dizzy still faster',
    a:'Para que no se mueva nada: Ajustes › Efectos › «Animaciones» apagado. Si tu equipo va lento, elige «Más rápido» arriba en Efectos: quita vidrio, fondo animado y efectos pesados de una vez.',
    en:'To stop everything moving: Settings › Effects › «Animations» off. If your device is slow, pick «Faster» at the top of Effects: it removes glass, animated background and heavy effects at once.', pre:openCfg(), go:['#sAcc', '#cfgBtn', '[data-tab="cfg"]'] },
  { k:'windows sistema efectos visuales reducir movimiento transparencia accesibilidad por que no se movia simplona fea system visual effects reduce motion transparency accessibility why plain',
    a:'Antes, si Windows (o tu celular) tenía apagados los efectos visuales, ' + BRAND() + ' también apagaba sus animaciones y su vidrio, y se veía simplona. Desde la versión 3.1 mandan tus Ajustes de aquí, no los del sistema: así la ves completa, y la calmas tú cuando quieras.',
    en:'Before, if Windows (or your phone) had its visual effects off, ' + BRAND() + ' also turned off its animations and glass, and looked plain. Since version 3.1 your Settings here decide, not the system\'s: you see it complete, and you calm it down whenever you want.' },
  { k:'next nextjs react tecnologia hecha como esta hecha framework migracion migrar technology built how made migration',
    a:BRAND() + ' se está pasando a Next.js (React) por partes, sin romper nada: Términos y Privacidad ya están hechas así, y las demás páginas siguen el mismo camino una por una. Para ti no cambia nada: mismas direcciones, misma cuenta, más rápida de mantener y de mejorar.',
    en:BRAND() + ' is moving to Next.js (React) step by step, without breaking anything: Terms and Privacy are already built that way, and the other pages follow one by one. Nothing changes for you: same addresses, same account, quicker to maintain and improve.' }
);
