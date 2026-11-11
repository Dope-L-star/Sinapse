/* Radiografía de las IAs de código y archivos (sin internet, sin llaves: Redis y proveedores de mentira).
   Para cada pedido típico muestra QUÉ DECIDE el servidor y QUÉ LE LLEGA de verdad a la IA (instrucciones, tope de respuesta,
   temperatura, historial). Sirve para comparar «antes» y «después» de tocar el cerebro.
   Uso:  node t/cerebro/codigo-radiografia.mjs [antes|despues] > salida.md
     antes   = como mandaba la página vieja (el navegador añade su manual SynthCode a las IAs conectadas)
     despues = como manda ahora (el servidor trae todo el manual; el navegador no lo repite) */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '../..');
const MODE = process.argv[2] === 'antes' ? 'antes' : 'despues';
const { sim, post, limpiar } = await import('./_simulado.mjs');
const calls = sim.calls;
/* el manual que el navegador viejo le añadía a las IAs conectadas cuando pedías código */
let clientCode = null;
{ const src = fs.readFileSync(path.join(ROOT, 'src/chat/02b-codigo-pro.js'), 'utf8'); const a = src.indexOf('const CODE_RX'), b = src.indexOf('function codeSystem');
  const end = src.indexOf('\n', b);
  try{ clientCode = new Function(src.slice(a, end) + '\nreturn { codeSystem };')().codeSystem; }catch(e){ clientCode = null; } }
const clientMsgs = chat => {
  const sys = MODE === 'antes' && clientCode ? clientCode(chat, false) : '';
  return sys ? [{ role:'system', content:sys }, ...chat] : chat;
};

const PAGE = (n) => '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<title>Cafetería</title>\n<style>\n' + Array.from({ length:n }, (_, i) => '.c' + i + ' { color: #' + (100000 + i * 37).toString(16).slice(0, 6) + '; margin: ' + (i % 9) + 'px; }').join('\n') + '\n</style>\n</head>\n<body>\n<main id="app"></main>\n<script>\nconst FIN_DEL_ARCHIVO = "ULTIMA LINEA";\ndocument.getElementById("app").textContent = FIN_DEL_ARCHIVO;\n</script>\n</body>\n</html>';
const BIG = PAGE(700);   /* ~28.000 letras, como una página «espectacular» completa */
const U = content => ({ role:'user', content }), A = content => ({ role:'assistant', content });
const withPage = (...tail) => [U('Hazme una página web de una cafetería con menú, galería y formulario de reservas'), A('Aquí tienes la página.\n\n**index.html**\n\n```html\n' + BIG + '\n```\n\nÁbrela en tu navegador.'), ...tail];
const CUT = BIG.slice(0, 20000);
const S = [
  ['Pedir una página completa', [U('Hazme una página web de una cafetería con menú, galería y formulario de reservas')]],
  ['Pedir algo corto: «hazme una calculadora»', [U('hazme una calculadora')]],
  ['Script de Python', [U('Escribe un script en Python que renombre todos los archivos de una carpeta por fecha')]],
  ['Archivo de datos: «créame un Excel»', [U('Créame un Excel con 20 productos, precio y stock')]],
  ['Archivo CSV', [U('Hazme un archivo CSV con 30 clientes de prueba (nombre, correo, ciudad)')]],
  ['Pedido en inglés', [U('Build me a todo app with local storage, dark mode and drag to reorder')]],
  ['Logo en SVG', [U('Dibújame un logo en SVG de un zorro')]],
  ['README', [U('Crea un README.md para mi proyecto de tienda online')]],
  ['Cambio chiquito sobre la página (≈28 mil letras)', withPage(U('Cámbiale el color a azul'))],
  ['Cambio con dos pedidos sobre la página', withPage(U('Agrégale un botón de modo oscuro y que el menú se vea en dos columnas'))],
  ['«Continúa» cuando la respuesta se cortó', [U('Hazme una página web de una cafetería con menú, galería y formulario de reservas'), A('**index.html**\n\n```html\n' + CUT), U('Continúa exactamente donde te quedaste: sigue desde la última palabra, sin repetir nada de lo anterior, sin saludar y sin decir que continúas. Escribe solo lo que falta.')]],
  ['Arreglo automático tras probar la página', withPage(U('[Revisión automática de SynthFlow] Probé tu página en un navegador real (computador de 1280px y celular de 390px, tocando los botones) y encontré esto:\n- [ERROR] index.html: al tocar «Reservar» sale el error x is not defined\n- [MEJORA] index.html: 2 botón(es) sin nombre (solo ícono, sin aria-label).\n\nArregla TODO lo de la lista, primero los errores. Devuelve cada archivo que cambie COMPLETO (sin «...» ni partes omitidas) y con el mismo nombre.'))],
  ['Depurar un error', [U('¿Por qué falla esto y cómo lo arreglo?\n```js\nconst nums = [1, 2, 3];\nconst total = nums.reduce((a, b) => { a + b });\nconsole.log(total);\n```')]],
  ['Control: pregunta normal', [U('¿Cuál es la capital de Francia y por qué se hizo famosa?')]],
  ['Control: saludo', [U('hola!')]]
];
const last = a => a[a.length - 1];
const tail = s => String(s).slice(-60).replace(/\n/g, '⏎');
let md = '# Radiografía de las IAs de código y archivos · ' + (MODE === 'antes' ? 'ANTES' : 'DESPUÉS') + '\n\n_Sin internet: se mira lo que el servidor le manda a cada IA (Redis y proveedores de mentira). Los números son los que reciben de verdad._\n\n';
md += '| # | Pedido | Tipo | Nivel | IA que responde primero | Tope de respuesta | Temp. | Piensa en <think> | Instrucciones (letras) | La IA ve lo anterior completo |\n|---|---|---|---|---|---|---|---|---|---|\n';
const detail = [];
let i = 0;
for (const [name, chat] of S){
  limpiar();
  const r = await post({ model:'sz:auto', messages:clientMsgs(chat) });
  await r.text().catch(() => '');
  const c = calls[0]; i++;
  if (!c){ md += '| ' + i + ' | ' + name + ' | ' + (r.headers.get('x-sz-cat') || '—') + ' | — | (sin respuesta: ' + r.status + ') | | | | | |\n'; continue; }
  const sysMsg = c.body.messages.find(m => m.role === 'system'), sys = sysMsg ? String(sysMsg.content) : '';
  const asst = chat.filter(m => m.role === 'assistant'), sent = c.body.messages.filter(m => m.role === 'assistant');
  let seen = '—';
  if (asst.length){ const o = last(asst).content, s = String(last(sent) ? last(sent).content : ''); seen = s.length >= o.length ? 'sí (' + o.length + ')' : 'NO: ' + s.length + ' de ' + o.length + ' letras' + (/ULTIMA LINEA/.test(s) ? '' : ' (le falta el final del archivo)'); }
  const x = c.body;
  md += '| ' + i + ' | ' + name + ' | ' + (r.headers.get('x-sz-cat') || '') + ' | ' + (r.headers.get('x-sz-level') || '') + (r.headers.get('x-sz-job') ? '/' + r.headers.get('x-sz-job') : '') + ' | ' + decodeURIComponent(r.headers.get('x-sz-name') || '') + ' (' + ({ 'api.groq.com':'Groq', 'generativelanguage.googleapis.com':'Google', 'api.mistral.ai':'Mistral', 'openrouter.ai':'OpenRouter' }[c.host] || c.host) + ') | ' + x.max_tokens + ' | ' + x.temperature + ' | ' + (/<think>/.test(sys) ? 'sí' : 'no') + ' | ' + sys.length + ' | ' + seen + ' |\n';
  detail.push('### ' + i + '. ' + name + '\n- Último mensaje de la persona: «' + String(last(chat).content).slice(0, 140).replace(/\n/g, ' ') + '»\n- Parámetros extra: `' + JSON.stringify(Object.fromEntries(Object.entries(x).filter(([k]) => !['model', 'messages', 'stream', 'max_tokens', 'temperature', 'stream_options', 'usage'].includes(k)))) + '`\n- Instrucciones que recibe la IA (' + sys.length + ' letras):\n\n> ' + sys.slice(0, 1500).replace(/\n/g, '\n> ') + (sys.length > 1500 ? '\n> …' : '') + '\n');
}
md += '\n## Detalle de lo que recibe la IA\n\n' + detail.join('\n');

/* la revisión de calidad sobre una respuesta larga con código: ¿se pierde la mitad del archivo? */
{
  limpiar();
  const draft = '**app.py**\n\n```python\n' + Array.from({ length:900 }, (_, k) => 'def f' + k + '(x): return x + ' + k).join('\n') + '\n# FIN\n```';
  sim.reply = b => { const q = b.messages[b.messages.length - 1].content; const m = q.match(/<<<\n([\s\S]*?)(?:\n>>>|$)/);   /* la IA de mentira «corrige» devolviendo lo que alcanzó a ver */ return 'MEJORAR\nNOTA: ajusté detalles\n' + (m ? m[1] : draft); };
  const r = await post({ action:'review', q:'Hazme un script con muchas funciones', draft, ctx:[] }), j = await r.json().catch(() => ({}));
  const rec = j.verdict === 'fix' ? j.text.length : draft.length;
  md += '\n## Revisión de calidad sobre un archivo largo (' + draft.length + ' letras)\n- Veredicto: **' + j.verdict + '** · el archivo que se le entrega a la persona queda de **' + rec + '** letras (' + Math.round(rec / draft.length * 100) + ' % del original)' + (rec < draft.length * .98 ? ' ⚠ PIERDE EL FINAL DEL ARCHIVO' : ' ✓ completo') + '\n';
}
console.log(md);
