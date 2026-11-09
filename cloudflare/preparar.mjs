/* Construye el sitio estático y sus reglas de Cloudflare Pages. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sale = path.join(raiz, 'cloudflare', 'public');

/* con Next.js (next/armar.mjs) se publica su export estático next/out; sin él, dist/ de build.mjs */
const conNext = fs.existsSync(path.join(raiz, 'next', 'armar.mjs'));
execFileSync(process.execPath, conNext ? ['next/armar.mjs'] : ['build.mjs', '--dist'], { cwd: raiz, stdio: 'inherit' });
fs.rmSync(sale, { recursive: true, force: true });
fs.cpSync(path.join(raiz, conNext ? 'next/out' : 'dist'), sale, { recursive: true });

const v = JSON.parse(fs.readFileSync(path.join(raiz, 'cloudflare', 'rutas.json'), 'utf8'));
let cabecerasSintetico = null;
const ruta = s => s.replace(/\(\.\*\)/g, '*');
/* «/((?!x$).*)» = todo menos /x: en Pages es «/*». Pero _headers no puede quitarle esas reglas a /x sin quitarle también las suyas:
   la regla propia de /x.html se ignora aquí y esa página se sirve desde functions/ (functions/sintetico.js) con sus cabeceras exactas */
const propias = {};
const bloques = [];
for (const b of v.headers || []) {
  const m = /^\/\(\(\?!(.+)\$\)\.\*\)$/.exec(b.source);
  if (m) { bloques.push({ source: '/*', headers: b.headers }); propias['/' + m[1].replace(/\\/g, '')] = true; continue; }
  if (propias[b.source]) { cabecerasSintetico = Object.fromEntries(b.headers.map(x => [x.key, x.value])); continue; }
  bloques.push({ source: ruta(b.source), headers: b.headers });
}
if (!cabecerasSintetico) throw new Error('cloudflare/rutas.json ya no tiene reglas propias para /sintetico.html');
fs.mkdirSync(path.join(raiz, 'cloudflare', 'generado'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'cloudflare', 'generado', 'sintetico-cabeceras.js'), '/* generado por cloudflare/preparar.mjs desde cloudflare/rutas.json: no se edita */\nexport default ' + JSON.stringify(cabecerasSintetico, null, 2) + ';\n');
fs.writeFileSync(path.join(sale, '_headers'), bloques.map(b =>
  b.source + '\n' + b.headers.map(x => '  ' + x.key + ': ' + x.value).join('\n')
).join('\n\n') + '\n');
fs.writeFileSync(path.join(sale, '_redirects'), [
  ...(v.redirects || []).filter(r => r.destination.startsWith('/')).map(r => ruta(r.source) + ' ' + ruta(r.destination) + ' ' + (r.permanent ? 301 : 302)),
  /* /x → /x.html ya lo hace Pages solo; repetirlo crea un bucle con su redirección /x.html → /x */
  ...(v.rewrites || []).filter(r => !r.source.startsWith('/api') && r.destination !== r.source + '.html').map(r => ruta(r.source) + ' ' + ruta(r.destination) + ' 200')
].join('\n') + '\n');
console.log('Listo: cloudflare/public (' + fs.readdirSync(sale).length + ' entradas)');
