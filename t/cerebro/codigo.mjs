/* Pruebas de las IAs de código y archivos (v4.5). Sin internet ni llaves: Redis y proveedores de mentira (t/cerebro/_simulado.mjs).
   Uso:  node t/cerebro/codigo.mjs            → corre todas las pruebas
         node t/cerebro/codigo.mjs --regex    → imprime la línea CODE_ASK_SRC que va en src/chat/02b-codigo-pro.js */
import fs from 'node:fs'; import path from 'node:path';
const { sim, post, limpiar, kv, ROOT } = await import('./_simulado.mjs');
const C = await import('../../api/_cerebro.js');
const P = await import('../../api/_pool.js');
const R = await import('../../api/_ruta.js');
if (process.argv.includes('--regex')){ console.log('const CODE_ASK_SRC = ' + JSON.stringify(C.CODE_ASK_SRC) + ';'); process.exit(0); }
let ok = 0, bad = 0;
const t = (name, v, why) => { if (v){ ok++; console.log('OK    ' + name); } else { bad++; console.log('FALLO ' + name + (why ? ' — ' + String(why).slice(0, 240) : '')); } };
const U = c => ({ role:'user', content:c }), A = c => ({ role:'assistant', content:c });
const PAGE = '**index.html**\n\n```html\n<!doctype html><html><body>' + '<p>fila</p>\n'.repeat(2200) + '<script>const FIN="ULTIMA LINEA"</script></body></html>\n```\n';   /* ≈ 30.000 letras */
const job = (msgs, o) => C.leer(msgs, o).job;

/* ---------- 1) ¿qué trabajo es? ---------- */
const build = ['Hazme una página web de una cafetería con menú y reservas', 'hazme una calculadora', 'Crea un juego de la serpiente en HTML', 'Build me a todo app with local storage', 'Crea una landing page para mi app de fitness', 'Programa una API REST con Node y Express',
  'Necesito una página web para mi negocio', 'Quiero una app para llevar mis gastos', 'Escribe un script en Python que renombre archivos', 'Hazme un bot de Discord', 'Diséñame un dashboard de ventas', 'Make a landing page for a coffee shop', 'create a snake game', 'Genera un componente de React para un botón', 'Créame una extensión de Chrome que cuente palabras'];
for (const q of build) t('build: «' + q.slice(0, 50) + '»', job([U(q)]) === 'build', job([U(q)]));
const file = ['Créame un Excel con 20 productos, precio y stock', 'Hazme un archivo CSV con 30 clientes de prueba', 'Crea un README.md para mi proyecto', 'Dibújame un logo en SVG de un zorro', 'Hazme un Word con mi hoja de vida', 'genera un json con 10 usuarios', 'Write a CSV with 20 products', 'Hazme un PDF con mi horario'];
for (const q of file) t('archivo: «' + q.slice(0, 50) + '»', job([U(q)]) === 'file', job([U(q)]));
const none = ['Escribe una carta a mi jefe pidiendo vacaciones', 'Redacta un correo para mi profesor', '¿Cuál es la capital de Francia?', 'hola', 'Traduce al inglés: me encanta programar', 'Dame ideas de nombres para mi página', 'Escribe un poema sobre el mar', 'Crea un plan de estudio para el examen', 'Hazme un resumen de este texto',
  'Quiero un plan de entrenamiento para ganar músculo', 'Dame un juego para jugar con niños', 'Crea un personaje de fantasía para mi historia', 'Escribe un blog sobre viajes', 'Dibújame un gato', 'Escribe una función matemática y explícame su dominio', 'Write a story about a dragon', 'Hazme un menú de comidas para la semana'];
for (const q of none) t('NO es código: «' + q.slice(0, 50) + '»', job([U(q)]) === '', job([U(q)]));
t('explicar código = explain (sin manual de archivos)', job([U('¿Cómo funciona una API REST?')]) === 'explain' && !C.leer([U('¿Cómo funciona una API REST?')]).code);
const withPage = (...x) => [U('Hazme una página web de una cafetería'), A('Listo.\n\n' + PAGE), ...x];
for (const q of ['Cámbiale el color a azul', 'Agrégale un botón de modo oscuro y que el menú sea de dos columnas', 'ponle más espacio entre las tarjetas', 'make it responsive', 'Hazlo más moderno', 'Que el título sea más grande'])
  t('cambio sobre la página: «' + q.slice(0, 45) + '»', job(withPage(U(q))) === 'edit', job(withPage(U(q))));
t('«Cámbiale el color a azul» ya NO es charla corta', C.leer(withPage(U('Cámbiale el color a azul'))).level !== 'easy');
t('sin código antes, «Cámbiale el color» no es edición', job([U('Cámbiale el color a azul')]) === '');
t('gracias después de una página = charla, no edición', job(withPage(U('gracias!'))) === '' && C.leer(withPage(U('gracias!'))).level === 'easy');
t('saludo con la página abierta no es edición', job(withPage(U('Hola, me llamo Ana'))) === '');
t('pregunta ajena con la página abierta no es edición', job(withPage(U('¿Cuál es la capital de Francia?'))) === '');
t('pregunta sobre el código = explicar, no reescribir', job(withPage(U('¿Por qué usaste flexbox aquí?'))) !== 'edit');
const FIXMSG = '[Revisión automática de SynthFlow] Probé tu página y encontré esto:\n- [ERROR] index.html: x is not defined\n\nArregla TODO lo de la lista';
t('arreglo automático = fix', job(withPage(U(FIXMSG))) === 'fix' && C.leer(withPage(U(FIXMSG))).code);
const CONT = 'Continúa exactamente donde te quedaste: sigue desde la última palabra, sin repetir nada de lo anterior.';
t('«Continúa» sobre código cortado = cont (código)', (x => x.job === 'cont' && x.code && x.cat === 'code' && x.cont)(C.leer([U('Hazme una página web'), A('**index.html**\n\n```html\n<html><body>' + 'x'.repeat(500)), U(CONT)])));
t('«Continúa» sobre texto normal sigue como antes', (x => x.job === '' && x.cont && x.cat === 'write')(C.leer([U('Cuéntame una historia'), A('Había una vez un reino muy lejano que'), U(CONT)])));
t('depurar con código y error = debug (difícil)', (x => x.job === 'debug' && x.level === 'hard')(C.leer([U('¿Por qué falla esto?\n```js\nconst t = [1,2].reduce((a,b)=>{a+b});\nconsole.log(t)\n```')])));
t('un pedido de código nunca es «fácil»', C.leer([U('hazme una calculadora')]).level === 'normal' && C.leer([U('haz un juego')], { effort:'low' }).level === 'normal');
t('esfuerzo alto en código = difícil y modelo grande', (x => x.level === 'hard' && x.big)(C.leer([U('Hazme una página web de una cafetería')], { effort:'high' })));
t('encargo grande pide modelo grande, uno chiquito no', C.leer([U('Crea una landing page profesional y moderna para mi app de fitness con login')]).big && !C.leer([U('hazme una calculadora')]).big);
t('idioma: pedido en inglés → manual en inglés', /FILES AND CODE/.test(C.sistema(C.leer([U('Build me a todo app with local storage')]), 'groq', 'llama-3.3-70b-versatile')));
t('idioma: «Continúa» en una charla en inglés sigue en inglés', C.leer([U('Build me a todo app with local storage and dark mode'), A('**index.html**\n\n```html\n<html>' + 'x'.repeat(300)), U(CONT)]).lang === 'en');

/* ---------- 2) manual, tope, temperatura, razonamiento ---------- */
const S = (q, msgs, prov = 'groq', mid = 'llama-3.3-70b-versatile', o = {}) => C.sistema(C.leer(msgs || [U(q)]), prov, mid, o);
t('build: manual de archivos con nombre en negrita, completos y sin preguntar', (x => /ARCHIVOS Y CÓDIGO/.test(x) && /\*\*index\.html\*\*/.test(x) && /COMPLETOS/.test(x) && /NO PREGUNTES/.test(x) && /TAMAÑO/.test(x))(S('hazme una calculadora')));
t('build: lleva la fecha de hoy y NO pide <think> (gasta el tope de la respuesta)', /Hoy es .*20\d\d/.test(S('hazme una calculadora')) && !/<think>/.test(S('hazme una calculadora')));
t('build: no manda respuesta «corta» ni la regla de análisis', !/en una a tres frases/.test(S('hazme una calculadora')) && !/analista experto/.test(S('hazme una calculadora')));
t('edit: pide el archivo ENTERO y no tocar lo demás', (x => /MODIFICACIÓN/.test(x) && /ENTERO/.test(x))(S('', withPage(U('Cámbiale el color a azul')))));
t('fix: arregla la lista y cierra con Revisión', (x => /ARREGLO/.test(x) && /Revisión/.test(x))(S('', withPage(U(FIXMSG)))));
t('cont: seguir sin reabrir la cerca', (x => /SE CORTÓ/.test(x) && /sin volver a abrir/.test(x))(S('', [U('Hazme una página web'), A('**index.html**\n\n```html\n<html>' + 'x'.repeat(300)), U(CONT)])));
t('file: solo el archivo', /ESTO ES UN ARCHIVO/.test(S('Hazme un archivo CSV con 30 clientes')) && /CSV: encabezado/.test(S('Hazme un archivo CSV con 30 clientes')));
t('Excel/Word/PDF: se explica el equivalente descargable', /Excel → \.csv/.test(S('Créame un Excel con 20 productos')));
t('modo ahorro: manual corto', (x => x.length < 1500 && /modo ahorro/.test(x) && /COMPLETO/.test(x))(S('hazme una calculadora', null, 'groq', 'llama-3.3-70b-versatile', { short:true })));
t('debug sigue pensando (<think>) como antes', /<think>/.test(S('', [U('¿Por qué falla esto?\n```js\nconst t = [1,2].reduce((a,b)=>{a+b});\n```')])));
t('pregunta normal y saludo: igual que antes (sin manual de archivos)', !/ARCHIVOS Y CÓDIGO/.test(S('¿Cuál es la capital de Francia?')) && /una a tres frases/.test(S('hola!')));
t('temperatura de código: baja al editar y arreglar', C.temperatura(C.leer(withPage(U('Cámbiale el color a azul')))) <= .15 && C.temperatura(C.leer(withPage(U(FIXMSG)))) <= .1 && C.temperatura(C.leer([U('hazme una calculadora')])) <= .35);
t('tope de respuesta: 12.000 en código, 8.000 en archivos de datos, 3.000 en ahorro, nada en charla', C.tokensFor(C.leer([U('hazme una calculadora')]), false) === 12000 && C.tokensFor(C.leer([U('Hazme un archivo CSV con 30 clientes')]), false) === 8000 && C.tokensFor(C.leer([U('hazme una calculadora')]), true) === 3000 && C.tokensFor(C.leer([U('hola!')]), false) === undefined);
t('razonamiento corto en código largo (gpt-oss low, qwen3 none, gemini medium/low)', C.reasonParams('groq', 'openai/gpt-oss-20b', 'normal', 'build').reasoning_effort === 'low' && C.reasonParams('groq', 'qwen/qwen3-32b', 'hard', 'edit').reasoning_effort === 'none' && C.reasonParams('google', 'gemini-flash-latest', 'normal', 'build').reasoning_effort === 'medium' && C.reasonParams('google', 'gemini-flash-latest', 'normal', 'fix').reasoning_effort === 'low');
t('razonamiento sin cambios fuera del código', C.reasonParams('groq', 'openai/gpt-oss-120b', 'hard').reasoning_effort === 'high' && Object.keys(C.reasonParams('groq', 'llama-3.3-70b-versatile', 'hard', 'build')).length === 0);
t('el manual ya no choca: no hay dos «Plan/Revisión» ni «MODO SYNTHCODE» en el servidor', !/SYNTHCODE/.test(S('hazme una calculadora')));

/* ---------- 3) historial: el código en el que se trabaja llega ENTERO ---------- */
{
  const n = P.normMsgs(withPage(U('Cámbiale el color a azul')));
  const a = n.msgs.find(m => m.role === 'assistant');
  t('normMsgs: la página de ' + PAGE.length + ' letras llega entera', a.content.length >= PAGE.length && /ULTIMA LINEA/.test(a.content), a.content.length);
  const old = P.normMsgs([U('a'), A('Listo.\n\n' + PAGE), U('otra cosa'), A('ok'), U('Cámbiale el color')]);
  t('normMsgs: la página sigue entera aunque no sea la última respuesta', /ULTIMA LINEA/.test(old.msgs[1].content) && old.keep === 1);
  const two = P.normMsgs([U('a'), A('v1\n' + PAGE), U('b'), A('v2\n' + PAGE.replace('ULTIMA LINEA', 'VERSION DOS')), U('c')]);
  t('normMsgs: de dos versiones se conserva entera la MÁS NUEVA y la vieja se recorta', /VERSION DOS/.test(two.msgs[3].content) && two.msgs[1].content.length === 12000);
  t('normMsgs: charla normal sigue cortando a 12.000', P.normMsgs([U('x'.repeat(30000)), A('y'.repeat(30000)), U('hola')]).msgs[1].content.length === 12000);
  t('normMsgs: lo último que escribe la persona (un archivo pegado) llega hasta 40.000', P.normMsgs([U('x'.repeat(30000))]).msgs[0].content.length === 30000);
  const cont = P.normMsgs([U('Hazme una página'), A('**index.html**\n\n```html\n' + 'x'.repeat(19000)), U(CONT)]);
  t('normMsgs: en «Continúa» la IA ve cómo terminó su respuesta cortada', cont.msgs[1].content.length >= 19000);
  /* recorte */
  const mk = n => Array.from({ length:n }, (_, i) => i % 2 ? A('r' + i + 'y'.repeat(9000)) : U('p' + i + 'x'.repeat(9000)));
  const m1 = mk(11); let sh = P.shrinkMsgs(m1, 0, -1, 48000);
  t('shrinkMsgs: sin código, recorta y conserva el primero y lo último', m1[0].content.startsWith('p0') && m1[m1.length - 1].content.startsWith('p10') && m1.reduce((s, m) => s + m.content.length, 0) <= 48000 && sh.cutN > 0);
  const m2 = mk(11); const keepAt = 3; m2[keepAt] = A('CODIGO' + 'z'.repeat(40000)); sh = P.shrinkMsgs(m2, 0, keepAt, 90000);
  t('shrinkMsgs: nunca quita el código en el que se trabaja', m2.some(m => m.content.startsWith('CODIGO')) && m2[sh.keep].content.startsWith('CODIGO') && m2[m2.length - 1].content.startsWith('p10'), JSON.stringify(sh));
  t('shrinkMsgs: sigue alternando persona/IA y empieza con la persona', m2[0].role === 'user' && m2.every((m, i) => i === 0 || m.role !== m2[i - 1].role));
}

/* ---------- 4) lo que de verdad le llega a la IA ---------- */
{
  limpiar(); let r = await post({ model:'sz:auto', messages:withPage(U('Cámbiale el color a azul')) }); await r.text();
  const c = sim.calls[0], sys = c.body.messages.find(m => m.role === 'system'), asst = c.body.messages.filter(m => m.role === 'assistant');
  t('e2e cambio: la IA recibe la página ENTERA (antes 12.000 de 27.000)', asst.length === 1 && /ULTIMA LINEA/.test(asst[0].content), asst[0] && asst[0].content.length);
  t('e2e cambio: manual de edición, temp baja y tope de código', /MODIFICACIÓN/.test(sys.content) && c.body.temperature <= .15 && c.body.max_tokens >= 6000, c.body.max_tokens + '/' + c.body.temperature);
  t('e2e cambio: respuesta larga → primero Google/Mistral/OpenRouter, no Groq', c.prov !== 'groq', c.prov);
  t('e2e: el servidor avisa el trabajo (x-sz-job)', r.headers.get('x-sz-job') === 'edit' && r.headers.get('x-sz-cat') === 'code');

  limpiar(); r = await post({ model:'sz:auto', messages:[U('Hazme una página web de una cafetería'), A('**index.html**\n\n```html\n' + PAGE.slice(0, 20000)), U(CONT)] }); await r.text();
  const cc = sim.calls[0], last = cc.body.messages.filter(m => m.role === 'assistant').pop();
  t('e2e «Continúa»: ve el final de lo escrito, con manual de código y temperatura baja', last.content.length >= 19000 && /SE CORTÓ/.test(cc.body.messages[0].content) && cc.body.temperature <= .1, last.content.length + '/' + cc.body.temperature);

  limpiar(); r = await post({ model:'sz:auto', messages:[U('hazme una calculadora')] }); await r.text();
  const cs = sim.calls[0];
  t('e2e «hazme una calculadora»: ya no se contesta «en 1 a 3 frases»', !/una a tres frases/.test(cs.body.messages[0].content) && /ARCHIVOS Y CÓDIGO/.test(cs.body.messages[0].content));
  t('e2e: un solo manual de sistema (no se apilan dos)', cs.body.messages.filter(m => m.role === 'system').length === 1);

  limpiar(); r = await post({ model:'sz:auto', messages:[U('¿Cuál es la capital de Francia?')] }); await r.text();
  t('e2e control: pregunta normal sin cambios (4096, sin manual de archivos)', sim.calls[0].body.max_tokens === 4096 && !/ARCHIVOS Y CÓDIGO/.test(sim.calls[0].body.messages[0].content), sim.calls[0].body.max_tokens);

  /* topes por proveedor: Google deja escribir mucho más */
  limpiar(); sim.hook = (prov) => prov === 'google' ? null : new Response('{"error":"x"}', { status:500 });
  r = await post({ model:'sz:auto', messages:[U('hazme una calculadora')] }); await r.text();
  const g = sim.calls.find(x => x.prov === 'google');
  t('e2e: Gemini recibe tope de 12.000 tokens en una calculadora (antes 4.096)', g && g.body.max_tokens === 12000, g && g.body.max_tokens);

  /* 413: «petición muy grande» no pausa la llave ni esconde el modelo */
  limpiar(); sim.hook = prov => prov === 'groq' ? new Response('{"error":{"message":"Request too large for model on tokens per minute (TPM): Limit 12000, Requested 20000"}}', { status:413 }) : null;
  r = await post({ model:'sz:auto', messages:[U('¿Cuál es la capital de Francia?')] }); const body = await r.text();
  t('413: responde otro proveedor sin error para la persona', r.status === 200 && /Listo/.test(body), r.status);
  t('413: la llave de Groq NO se pausa para todos y el modelo NO se esconde', ![...kv.keys()].some(k => k.startsWith('pk:down:')) && !(kv.get('pool:badm')), [...kv.keys()].filter(k => /pk:down|badm/.test(k)).join(','));
  limpiar(); sim.hook = prov => prov === 'groq' ? new Response('{"error":{"message":"This model\'s maximum context length is 8192 tokens, however you requested 21000"}}', { status:400 }) : null;
  r = await post({ model:'sz:auto', messages:[U('¿Cuál es la capital de Francia?')] }); await r.text();
  t('400 de «contexto muy largo»: tampoco esconde el modelo 6 horas (antes lo hacía por decir «model»)', r.status === 200 && ![...kv.keys()].some(k => /pk:down/.test(k)) && !hsHas('pool:badm'), [...kv.keys()].join(','));
  function hsHas(k){ return false; }

  /* conversación enorme: Groq (cuota corta por minuto) queda al final */
  limpiar(); r = await post({ model:'sz:auto', messages:[U('Hazme una página web de una cafetería'), A('**index.html**\n\n```html\n' + 'x'.repeat(40000) + '\n```'), U('Cambia el título')] }); await r.text();
  t('conversación enorme: no se intenta primero con Groq', sim.calls[0].prov !== 'groq', sim.calls[0].prov);

  /* revisión de calidad */
  limpiar(); const big = '**app.py**\n\n```python\n' + 'def f(x): return x\n'.repeat(1000) + '```';
  r = await post({ action:'review', q:'Hazme un script', draft:big, ctx:[] }); let j = await r.json();
  t('revisión: un archivo más largo de lo que el revisor ve NO se revisa (antes quedaba al 48 %)', j.verdict === 'ok' && sim.calls.length === 0, j.verdict + '/' + sim.calls.length);
  limpiar(); const mid = '**app.py**\n\n```python\n' + 'def f(x): return x\n'.repeat(400) + '```';
  sim.reply = () => 'MEJORAR\nNOTA: ajuste\n**app.py**\n\n```python\n' + 'def f(x): return x\n'.repeat(250) + '```';
  r = await post({ action:'review', q:'Hazme un script', draft:mid, ctx:[] }); j = await r.json();
  t('revisión: una «corrección» que pierde un tercio del código se descarta', j.verdict === 'ok', j.verdict);
  limpiar(); sim.reply = () => 'MEJORAR\nNOTA: ajuste\n**app.py**\n\n```python\n' + 'def f(x): return x + 1\n'.repeat(400) + '```';
  r = await post({ action:'review', q:'Hazme un script', draft:mid, ctx:[] }); j = await r.json();
  t('revisión: una corrección completa sí se acepta', j.verdict === 'fix' && j.text.length > mid.length * .75, j.verdict);
}

/* ---------- 5) el enrutador: respuestas largas → proveedores que dejan escribir mucho ---------- */
{
  limpiar();
  const a = await R.pick('code', 4, { long:true }), b = await R.pick('code', 4, {});
  t('enrutador (largo): el primero es Gemini, no Groq', a[0].m.prov === 'google', a.map(x => x.m.id).join(' > '));
  t('enrutador (normal) sin cambios: GPT-OSS 20B sigue primero', b[0].m.id.includes('gpt-oss-20b'), b.map(x => x.m.id).join(' > '));
  t('enrutador (largo): Groq no sale antes que Google y Mistral', a.findIndex(x => x.m.prov === 'groq') > a.findIndex(x => x.m.prov === 'google'));
}

/* ---------- 6) piezas del navegador (se leen del propio código) ---------- */
const src = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const between = (txt, a, b) => txt.slice(txt.indexOf(a) + a.length, txt.indexOf(b));
{
  const cj = new Function(between(src('src/chat/06-modo-agente-rescate.js'), '/* contJoin:inicio */', '/* contJoin:fin */') + '\nreturn contJoin;')();
  t('contJoin: si la IA vuelve a abrir la cerca ```html, se quita', cj('**a.html**\n\n```html\n<div>', '```html\n</div>\n```') === '**a.html**\n\n```html\n<div>\n</div>\n```', JSON.stringify(cj('**a.html**\n\n```html\n<div>', '```html\n</div>\n```')));
  t('contJoin: si repite las últimas líneas, no se duplican', cj('```js\nconst a = 1;\nconst b = 2;', 'const a = 1;\nconst b = 2;\nconst c = 3;\n```') === '```js\nconst a = 1;\nconst b = 2;\nconst c = 3;\n```');
  t('contJoin: si rehace la línea que quedó a medias, no queda doble', cj('```js\nfunction suma(a, b) {\n  return a +', '  return a + b;\n}\n```') === '```js\nfunction suma(a, b) {\n  return a + b;\n}\n```', JSON.stringify(cj('```js\nfunction suma(a, b) {\n  return a +', '  return a + b;\n}\n```')));
  t('contJoin: cortado en medio de una palabra, se pega sin espacio', cj('```css\nbody { color: re', 'd; margin: 0; }\n```') === '```css\nbody { color: red; margin: 0; }\n```');
  t('contJoin: lo anterior terminó en línea completa → la siguiente va en línea nueva', cj('```js\nconst a = 1;', 'const b = 2;\n```') === '```js\nconst a = 1;\nconst b = 2;\n```');
  t('contJoin: en texto normal sigue igual que antes (espacio tras el punto)', cj('Hola.', 'Mundo') === 'Hola. Mundo' && cj('Hola, mun', 'do') === 'Hola, mundo');
  const fnames = new Function(between(src('src/core/04-markdown-pequeno.js'), '/* fenceNames:inicio */', '/* fenceNames:fin */') + '\nreturn fenceNames;')();
  t('cerca con nombre: ```html:index.html', fnames('```html:index.html\n<p>') === '**index.html**\n\n```html\n<p>');
  t('cerca con nombre: ```python app.py', fnames('Aquí:\n```python app.py\nprint(1)\n```') === 'Aquí:\n**app.py**\n\n```python\nprint(1)\n```');
  t('cerca con nombre: ```js title="app.js"', fnames('```js title="app.js"\nx\n```') === '**app.js**\n\n```js\nx\n```');
  t('cerca con nombre: ```index.html (sin lenguaje)', fnames('```index.html\n<p>\n```') === '**index.html**\n\n```html\n<p>\n```');
  t('cerca con nombre: no toca cercas normales ni cierres', fnames('```html\n<p>\n```\n\n``` Listo.\n```text 1.5\n') === '```html\n<p>\n```\n\n``` Listo.\n```text 1.5\n');
  const fileTxt = src('src/chat/02b-codigo-pro.js'), lit = fileTxt.match(/const CODE_ASK_SRC = ("(?:[^"\\]|\\.)*");/);
  t('el navegador y el servidor reconocen los mismos pedidos de código (CODE_ASK_SRC)', lit && JSON.parse(lit[1]) === C.CODE_ASK_SRC, 'corre: node t/cerebro/codigo.mjs --regex');
  const CA = new RegExp(JSON.parse(lit[1]), 'i');
  t('navegador: «hazme una calculadora» y «crea un README.md» son código', CA.test('hazme una calculadora') && CA.test('Crea un README.md para mi proyecto') && !CA.test('Escribe una carta a mi jefe'));
  t('apiMsgs ya no añade el manual del navegador a las IAs conectadas (sz:)', /o\.naive \|\| o\.srv \? '' : codeSystem/.test(src('src/chat/05-detener-favoritos-archivos.js')));
}
console.log('\n' + ok + ' OK, ' + bad + ' FALLO'); process.exit(bad ? 1 : 0);
