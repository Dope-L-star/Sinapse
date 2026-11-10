# Hecho por: PROBADOR (puesto al día el 10 nov, v4.6)

Pruebas de Quoryn (antes A.L.I.A.S.). Quoryn ya NO tiene página: vive dentro de SynthFlow
(src/chat/16w-alias-en-chat.js) y su motor (src/chat/16p…16u-alias-motor-*.js) es parte de chat.js.
No piden llaves ni tocan el build. Se corren desde la raíz del repo, con Node 20 o más:

  node t/alias/contrato.mjs       el servidor (api/alias.js): plan, paso, ajustar, límites y el cribado «¿es algo fácil?»
  node t/alias/triage.mjs         el cribado en sí (api/_triage.js): qué se lo queda Quoryn y qué va a Relay o a Apex
  node t/alias/ruta.mjs           el enrutador de herramientas (api/_ruta.js)
  node cloudflare/preparar.mjs && node t/alias/chat.mjs [capturas]      navegador: Quoryn dentro del chat, de punta a punta
  node cloudflare/preparar.mjs && node t/alias/solo-equipo.mjs [capturas]   navegador: solo lo ve el equipo; importar queda para todos

Las pruebas de navegador necesitan el paquete playwright y Chromium; si faltan, avisan FALLO
y no inventan un resultado verde. Cada prueba imprime OK o FALLO y el código de salida es 1 si alguna falla.

Lo que cuida cada una
- contrato.mjs llama al api/alias.js real (export default con fetch) con un Redis de mentira compatible con el REST de Upstash
  (KV_REST_API_URL). El modelo y la web no salen a internet: si el servidor los pide por fetch, la prueba responde.
  Un objetivo de más de 500 caracteres es demasiado largo; el cupo del día aparece en 40 usos; la trampa de la página web
  lleva la marca ZXALIAS-POISON-9F3C además de la frase «ignora tus instrucciones».
  Un «hola» o «gracias» solos devuelven {simple:true, to:'auto'} SIN gastar el cupo ni llamar al modelo; «Hola, ¿me puedes ayudar a
  redactar un texto…?» SÍ arma plan (ahí te está pidiendo algo); con force:true se arma el plan aunque sea fácil.
- triage.mjs: ejemplos en español e inglés de lo que se queda Quoryn y de lo fácil que se manda a Relay (IA Automática) o a Apex
  (SuperiorSynth). Regla: si hay duda, se queda con Quoryn; el saludo se quita antes de juzgar lo que viene después.
- chat.mjs abre chat.html armado (cloudflare/public) con los api/ reales y una IA de mentira que contesta distinto al plan, a cada
  paso, al «ajustar» y a una charla. Cubre: «hola» → Relay + chip «Hacerlo con Quoryn»; «Hola, ¿cómo estás? ¿me puedes ayudar a
  redactar un texto…?» → Quoryn arma plan; se aprueba UNA vez y trabaja solo; lo que escribes a mitad se suma sin parar; el resultado
  llega como mensaje del chat y la tarjeta se va; Detener entrega lo que alcanzó; ?quoryn=1 deja el modo puesto; celular en inglés;
  quien no es del equipo no ve el modo Agente; /alias y /alias.html llevan a /chat y ya no se publica alias.html.
- solo-equipo.mjs: sin cuenta y con cuenta normal no hay Quoryn en la portada ni en SynthFlow; el equipo (owner) sí; «Importar chats y
  memoria» está para todos; ningún enlace apunta a la página vieja.

Ganchos que usa la prueba de navegador (dentro del chat)
  #ptModos [data-pm="agente"]     botón del modo Agente (solo equipo)
  .alrun                          tarjeta del plan / de la misión en marcha
  .alrun [data-al="go"|"stop"]    Aprobar y empezar / Detener
  .alhand [data-alforce]          chip «Quoryn vio que era algo fácil…» y su botón «Hacerlo con Quoryn»
  .m.bot.alias-msg                mensaje de resultado de Quoryn
  window.ALIAS = { plan(goal, {force}), runStep, adjust, feedback, routes }   (motor; ya no hay herramientas en una página aparte)
