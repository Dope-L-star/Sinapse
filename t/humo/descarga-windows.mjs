/* Prueba: /descargar/windows manda a Obertura aunque la API de GitHub falle, y entiende el repo nuevo (Sinapse). */
import assert from 'node:assert/strict';
const { elegir, onRequestGet } = await import('../../functions/descargar/windows.js');
const rel = [{ tag_name: 'obertura-v1.1.0', assets: [{ name: 'SymphorIA-Obertura.exe', size: 6146048, browser_download_url: 'https://github.com/Dope-L-star/Sinapse/releases/download/obertura-v1.1.0/SymphorIA-Obertura.exe' }] }];
assert.equal(elegir(rel).version, '1.1.0');
globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };
globalThis.fetch = async () => new Response('{"message":"rate limit"}', { status: 403 });
const ctx = { waitUntil() {}, request: new Request('https://x.test/descargar/windows') };
const r = await onRequestGet(ctx);
assert.equal(r.status, 302); assert.match(r.headers.get('location'), /Sinapse\/releases\/download\/obertura-v1\.1\.0\/SymphorIA-Obertura\.exe$/);
const i = await onRequestGet({ ...ctx, request: new Request('https://x.test/descargar/windows?info=1') });
assert.equal((await i.json()).ok, true);
globalThis.fetch = async u => new Response(JSON.stringify(rel), { status: 200 });
assert.equal((await onRequestGet(ctx)).status, 302);
console.log('descarga-windows OK');
