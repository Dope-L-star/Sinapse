/* Vercel publica solo esto: la página del video con el link a Cloudflare. Las funciones de api/ siguen en Vercel aparte.
   Lo corre Vercel (vercel.json buildCommand). La página completa la arma cloudflare/preparar.mjs. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url)), raiz = path.resolve(aqui, '..'), sale = path.join(raiz, 'dist');
fs.rmSync(sale, { recursive: true, force: true });
fs.mkdirSync(sale);
for (const f of ['index.html', 'portal.css', 'portal.js', 'sw.js', 'robots.txt']) fs.cpSync(path.join(aqui, f), path.join(sale, f), { recursive: true });
for (const f of ['icon.svg']) if (fs.existsSync(path.join(raiz, f))) fs.cpSync(path.join(raiz, f), path.join(sale, f), { recursive: true });
fs.cpSync(path.join(raiz, 'media', 'og-symphoria.jpg'), path.join(sale, 'og-symphoria.jpg'));
/* el video y su foto de portada salen de media/app (los mismos de la ventana «Instalar»); sin ellos no hay página del video */
const video = path.join(raiz, 'media', 'app', 'synthflow-app.mp4'), poster = path.join(raiz, 'media', 'app', 'synthflow-app.webp');
if (!fs.existsSync(video) || !fs.existsSync(poster)) throw new Error('Faltan media/app/synthflow-app.mp4 o .webp: la página del video de Vercel los necesita');
fs.mkdirSync(path.join(sale, 'v'));
fs.cpSync(video, path.join(sale, 'v', 'synthz.mp4'));
fs.cpSync(poster, path.join(sale, 'v', 'synthz.webp'));
console.log('dist/ listo: página del video para Vercel');
