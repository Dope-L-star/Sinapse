/* Fase 4 · caché larga para los archivos heredados (core.js, chat.css…).
   next/armar.mjs copia cada uno a /v/<huella>/<nombre> (huella = primeros 10 caracteres del sha256 de su contenido)
   y pasa el mapa en la variable SZ_VERSIONES al «next build». Como la URL cambia cuando cambia el archivo,
   /v/* se puede guardar un año (ver vercel.json → _headers). Sin el mapa (next dev) se usa la ruta de siempre.
   synthonia.js no pasa por aquí: core.js la pide por su nombre fijo (/synthonia.js) con su cargador con reintentos. */
let mapa = {};
try { mapa = JSON.parse(process.env.SZ_VERSIONES || '{}') || {}; } catch { mapa = {}; }

export const VERSIONABLES = ['core.js', 'chat.js', 'index.js', 'movimiento.js', 'alias.js', 'alias-tools.js', 'pulsem.js', 'ayuda.js',
  'core.css', 'chat.css', 'index.css', 'movimiento.css', 'alias.css', 'pulsem.css'];

export function versionado(nombre) {
  const limpio = String(nombre).replace(/^\/+/, '');
  return mapa[limpio] ? `/v/${mapa[limpio]}/${limpio}` : `/${limpio}`;
}
