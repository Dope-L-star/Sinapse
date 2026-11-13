// Prueba el Wasm ya compilado en `public/`, igual que lo usa la página:
// rutas, enviar un mensaje, retomar tras "recargar", abrir la creación y Tu panel.
// Uso, desde lutim-web:  node probar-wasm.mjs

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bytes = readFileSync(new URL('./public/lutim_web.wasm', import.meta.url));
const modulo = await WebAssembly.compile(bytes);
assert.deepEqual(WebAssembly.Module.imports(modulo), [], 'el Wasm no debe pedir nada al exterior');

async function abrir(guardado) {
  const { exports: w } = await WebAssembly.instantiate(modulo, {});
  const llamar = (funcion, texto) => {
    const entrada = new TextEncoder().encode(texto);
    // Reservar puede agrandar la memoria: el búfer se lee siempre después de cada llamada.
    const puntero = w.lw_reservar(entrada.length);
    new Uint8Array(w.memory.buffer, puntero, entrada.length).set(entrada);
    const salida = w[funcion](entrada.length);
    return new TextDecoder().decode(new Uint8Array(w.memory.buffer, salida, w.lw_largo()));
  };
  return { html: llamar('lw_iniciar', guardado), llamar };
}

let pasos = 0;
const paso = (nombre, condicion) => { assert.ok(condicion, nombre); pasos += 1; console.log('ok  ' + nombre); };
const ruta = (html) => /data-ruta="([^"]*)"/.exec(html)[1];

const primera = await abrir('');
paso('el inicio avisa que la interpretación es simulada', primera.html.includes('interpretación simulada'));
paso('el inicio ofrece retomar la cafetería', primera.html.includes('href="#/c/cafeteria"'));
paso('la barra lateral lleva el símbolo de LUTIM y sus secciones',
  primera.html.includes('viewBox="1250 690 1870 1870"') && primera.html.includes('Recientes') && primera.html.includes('Fijados'));

let html = primera.llamar('lw_evento', 'ruta\t#/c/cafeteria');
paso('retomar muestra dónde quedó', html.includes('Dónde quedaste') && html.includes('del proyecto Casa Calma'));

html = primera.llamar('lw_evento', 'enviar\tCambia el color a terracota y conserva el título');
paso('enviar un mensaje cambia solo el color', html.includes('Cambié el color a «terracota»') && html.includes('Lo demás sigue igual'));

html = primera.llamar('lw_evento', 'enviar\tAbre la creación');
paso('con dos creaciones, Timo hace una pregunta', html.includes('¿Cuál abro') && !html.includes('role="dialog"'));

html = primera.llamar('lw_evento', 'ruta\t#/panel');
paso('Tu panel tiene ruta propia y muestra la pregunta abierta',
  ruta(html) === '#/panel' && html.includes('Timo espera tu respuesta') && !html.includes('id="mensajes"'));

const guardado = primera.llamar('lw_guardado', '');
const segunda = await abrir(guardado);
html = segunda.llamar('lw_evento', 'ruta\t#/c/cafeteria');
paso('tras recargar se conserva la corrección y la pregunta abierta',
  html.includes('color «terracota»') && html.includes('Timo espera tu respuesta'));

html = segunda.llamar('lw_evento', 'enviar\tLa presentación');
paso('la respuesta abre la creación en su versión 3 y cambia la ruta',
  html.includes('role="dialog"') && html.includes('versión 3') && html.includes('tinta-terracota') &&
  ruta(html) === '#/c/cafeteria/creacion/presentacion');

html = segunda.llamar('lw_evento', 'ruta\t#/c/cafeteria');
paso('volver al chat cierra la creación', !html.includes('role="dialog"') && html.includes('id="mensajes"'));

html = segunda.llamar('lw_evento', 'ruta\t#/biblioteca');
paso('la biblioteca lista las creaciones con su enlace', html.includes('href="#/c/cafeteria/creacion/menu"'));

html = segunda.llamar('lw_evento', 'buscar\tmenú');
paso('buscar encuentra el menú', ruta(html) === '#/buscar' && html.includes('Menú de temporada'));

html = segunda.llamar('lw_evento', 'ruta\t#/');
html = segunda.llamar('lw_evento', 'enviar\t<b>hola</b> ñandú 🙂');
paso('el texto con HTML, tildes y emoji se muestra como texto', html.includes('&lt;b&gt;hola&lt;/b&gt; ñandú 🙂'));

console.log(`\n${pasos} comprobaciones pasaron sobre public/lutim_web.wasm`);
