/* Arma la página de prueba del tablero de gestión (datos inventados) en cloudflare/public/gestion-demo.html. Solo para revisar en local. */
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const aqui = path.dirname(fileURLToPath(import.meta.url)), raiz = path.resolve(aqui, '../../../..'), sale = path.join(raiz, 'cloudflare/public');
fs.mkdirSync(sale, { recursive: true });
await build({ entryPoints: [path.join(aqui, 'entrada.jsx')], bundle: true, minify: true, format: 'iife', jsx: 'automatic', outfile: path.join(sale, 'gestion-demo.js'),
  nodePaths: [path.join(raiz, 'next/node_modules')], define: { 'process.env.NODE_ENV': '"production"' }, loader: { '.mjs': 'js' } });
fs.writeFileSync(path.join(sale, 'gestion-demo.html'), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Gestión · prueba</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Figtree:wght@300..800&display=swap">
<link rel="stylesheet" href="gestion-demo.css"></head><body><div id="raiz"></div><script src="gestion-demo.js"></script></body></html>`);
console.log('Listo: cloudflare/public/gestion-demo.html');
