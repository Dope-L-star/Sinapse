/* Pruebas de la lógica de páginas de varios archivos (src/chat/02c-web-proyecto.js), sin navegador.
   Se corre:  node --test t/web/proyecto.test.mjs */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(path.join(REPO, 'src/chat/02c-web-proyecto.js'), 'utf8');
const ctx = {
  MIME:{ html:'text/html', css:'text/css', js:'text/javascript', json:'application/json', svg:'image/svg+xml' },
  esc:s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]),
  probeDoc:(h, id) => h.replace(/<head[^>]*>/i, m => m + '<!--probe ' + id + '-->'),
  SZ:{ lang:() => 'es', onLang(){} }, document:{ addEventListener(){} }, toast(){}, $:() => null, $$:() => [],
  btoa:s => Buffer.from(s, 'binary').toString('base64'), unescape, encodeURIComponent, decodeURI, TextEncoder, DataView, Uint8Array, Uint32Array, ArrayBuffer, Date
};
vm.createContext(ctx);
vm.runInContext(src + ';this.api={webProject,webDoc,webGo,webNorm,webRef,webZipBytes,webCrc};', ctx);
const W = ctx.api;
const M = (name, text) => ({ name, ext:name.split('.').pop(), text, label:'', lines:text.split('\n').length, named:true });
const sitio = [
  M('index.html', '<!doctype html><html><head><title>Aurora</title><link rel="stylesheet" href="css/estilos.css"></head><body><a href="nosotros.html">N</a><a href="./blog/">B</a><img src="img/logo.svg"><script src="js/app.js"></script></body></html>'),
  M('nosotros.html', '<!doctype html><html><head><link rel="stylesheet" href="/css/estilos.css"></head><body><a href="index.html#menu">I</a></body></html>'),
  M('blog/index.html', '<!doctype html><html><head><link rel="stylesheet" href="../css/estilos.css"></head><body>blog</body></html>'),
  M('css/estilos.css', '@import "base.css"; body{background:url(../img/logo.svg)}'),
  M('css/base.css', 'html{color:red}'),
  M('js/app.js', 'document.title += "</script>";'),
  M('img/logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>'),
  M('datos.json', '{"a":1}')
];

test('agrupa una página de varios archivos y elige index.html', () => {
  const P = W.webProject(sitio);
  assert.equal(P.entry, 'index.html'); assert.equal(P.title, 'Aurora'); assert.equal(P.files.length, 8);
  assert.deepEqual([...P.pages], ['index.html', 'nosotros.html', 'blog/index.html']);
});
test('un solo archivo o sin HTML no es página web', () => {
  assert.equal(W.webProject([sitio[0]]), null);
  assert.equal(W.webProject([sitio[3], sitio[5]]), null);
});
test('rutas: carpetas, ./, ../ y /', () => {
  assert.equal(W.webNorm('./css/../css//estilos.css'), 'css/estilos.css');
  assert.equal(W.webRef('blog/index.html', '../css/estilos.css').path, 'css/estilos.css');
  assert.equal(W.webRef('blog/index.html', '/css/estilos.css').path, 'css/estilos.css');
  assert.equal(W.webRef('index.html', 'https://x.com/a.css'), null);
  assert.equal(W.webRef('index.html', '#menu'), null);
});
test('el HTML trae su CSS (con @import y SVG) y su JS en línea', () => {
  const P = W.webProject(sitio), h = W.webDoc(P, 'index.html', { navId:'n1' });
  assert.match(h, /<style data-sz-file="css\/estilos.css">html\{color:red\} body\{background:url\("data:image\/svg\+xml/);
  assert.match(h, /<script data-sz-file="js\/app.js">document.title \+= "<\\\/script>";<\/script>/);
  assert.match(h, /<img src="data:image\/svg\+xml;charset=utf-8;base64,/);
  assert.doesNotMatch(h, /href="css\/estilos.css"/);
  assert.match(h, /szw:I/); assert.match(h, /"datos.json":\["application\/json","\{\\"a\\":1\}"\]/);
  const b = W.webDoc(P, 'blog/index.html', {}); assert.match(b, /html\{color:red\}/);
  const n = W.webDoc(P, 'nosotros.html', {}); assert.match(n, /html\{color:red\}/);
});
test('si la IA nombró el CSS distinto o no lo enlazó, igual se usa', () => {
  const P = W.webProject([M('index.html', '<html><head><link rel="stylesheet" href="style.css"></head><body><p>x</p></body></html>'), M('codigo.css', 'p{color:blue}'), M('codigo.js', 'console.log(1)')]);
  const h = W.webDoc(P, 'index.html', {});
  assert.match(h, /p\{color:blue\}<\/style><\/head>/); assert.match(h, /console\.log\(1\)<\/script><\/body>/);
});
test('el título «estilos.css» encuentra el enlace «css/estilos.css» por su nombre', () => {
  const P = W.webProject([M('index.html', '<html><head><link rel="stylesheet" href="css/estilos.css"></head><body></body></html>'), M('estilos.css', 'b{x:1}')]);
  assert.match(W.webDoc(P, 'index.html', {}), /<style data-sz-file="estilos.css">b\{x:1\}/);
});
test('los enlaces navegan a las páginas del proyecto', () => {
  const P = W.webProject(sitio);
  assert.deepEqual({ ...W.webGo(P, 'index.html', 'nosotros.html') }, { path:'nosotros.html', hash:'', page:true });
  assert.deepEqual({ ...W.webGo(P, 'nosotros.html', 'index.html#menu') }, { path:'index.html', hash:'#menu', page:true });
  assert.equal(W.webGo(P, 'index.html', './blog/').path, 'blog/index.html');
  assert.equal(W.webGo(P, 'blog/index.html', '../nosotros').path, 'nosotros.html');
  assert.equal(W.webGo(P, 'index.html', 'contacto.html').missing, true);
});
test('el .zip tiene las carpetas y un CRC correcto', () => {
  assert.equal(W.webCrc(new TextEncoder().encode('123456789')), 0xCBF43926);
  const parts = W.webZipBytes([['css/a.css', 'b{}'], ['index.html', 'hola ñ']]);
  const all = Buffer.concat(parts.map(p => Buffer.from(p)));
  assert.equal(all.readUInt32LE(0), 0x04034b50);
  assert.ok(all.includes(Buffer.from('css/a.css'))); assert.ok(all.includes(Buffer.from('hola ñ')));
  assert.equal(all.readUInt32LE(all.length - 22), 0x06054b50); assert.equal(all.readUInt16LE(all.length - 12), 2);
});
