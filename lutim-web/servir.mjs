// Sirve `public/` en este equipo para revisar la vista previa.
// Uso, desde lutim-web:  node servir.mjs   →  http://127.0.0.1:4328

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('./public/', import.meta.url));
const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
};
// La misma política que `_headers` aplica en Pages.
const csp = "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

createServer(async (peticion, respuesta) => {
  const ruta = decodeURIComponent(new URL(peticion.url, 'http://x').pathname);
  const archivo = normalize(join(raiz, ruta === '/' ? 'index.html' : ruta));
  try {
    if (!archivo.startsWith(raiz) || archivo.endsWith(sep + '_headers')) throw new Error('fuera de public');
    const cuerpo = await readFile(archivo);
    respuesta.writeHead(200, {
      'Content-Type': tipos[extname(archivo)] || 'application/octet-stream',
      'Content-Security-Policy': csp,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    });
    respuesta.end(cuerpo);
  } catch {
    respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    respuesta.end('No encontrado');
  }
}).listen(4328, '127.0.0.1', () => console.log('LUTIM vista previa: http://127.0.0.1:4328'));
