/* v4.3 · Umami: se carga en todas las páginas, sin cookies, y respeta «Rechazar» del aviso de cookies */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { umamiJs, UMAMI_ID, UMAMI_SRC, setUmamiOptOut, umamiOn } from '../lib/umami.mjs';

function run(store = {}) {
  const added = [];
  const el = () => { const a = {}; return { attrs: a, setAttribute: (k, v) => { a[k] = v; } }; };
  const doc = { head: { appendChild: s => added.push(s) }, documentElement: {}, createElement: el, querySelector: () => added.length ? added[0] : null };
  const ls = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  vm.runInNewContext(umamiJs, { document: doc, localStorage: ls, JSON });
  return added;
}

test('sin decisión: agrega la etiqueta de Umami con su id, solo el dominio publicado y «No rastrear»', () => {
  const a = run();
  assert.equal(a.length, 1);
  assert.equal(a[0].src, UMAMI_SRC);
  assert.equal(a[0].defer, true);
  assert.equal(a[0].attrs['data-website-id'], UMAMI_ID);
  assert.equal(a[0].attrs['data-domains'], 'symphoria.pages.dev');
  assert.equal(a[0].attrs['data-do-not-track'], 'true');
});
test('con cookies aceptadas también cuenta', () => {
  assert.equal(run({ 'symphoria:clarity-consent:v2': JSON.stringify({ version: 2, choice: 'granted', updatedAt: 1 }) }).length, 1);
});
test('«Rechazar» en el aviso de cookies: Umami no se carga', () => {
  assert.equal(run({ 'symphoria:clarity-consent:v2': JSON.stringify({ version: 2, choice: 'denied', updatedAt: 1 }) }).length, 0);
  assert.equal(run({ 'umami.disabled': '1' }).length, 0);
});
test('setUmamiOptOut pone y quita el interruptor propio de Umami', () => {
  const m = new Map(), s = { setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) };
  setUmamiOptOut(s, true); assert.equal(m.get('umami.disabled'), '1');
  setUmamiOptOut(s, false); assert.equal(m.has('umami.disabled'), false);
  assert.equal(setUmamiOptOut(null, true), false);
});
test('se puede apagar al armar con NEXT_PUBLIC_UMAMI=off', () => {
  assert.equal(umamiOn({}), true); assert.equal(umamiOn({ NEXT_PUBLIC_UMAMI: 'off' }), false);
});
test('la CSP deja cargar el script y enviar las visitas', () => {
  const v = JSON.parse(fs.readFileSync(new URL('../../cloudflare/rutas.json', import.meta.url), 'utf8'));
  const csp = v.headers[0].headers.find(h => h.key === 'Content-Security-Policy').value;
  assert.match(csp, /script-src [^;]*https:\/\/cloud\.umami\.is/);
  assert.match(csp, /connect-src [^;]*https:\/\/cloud\.umami\.is/);
  assert.ok(csp.length < 1900, 'la cabecera cabe en Cloudflare (' + csp.length + ')');
});
