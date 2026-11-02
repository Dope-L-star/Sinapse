/* El panel nuevo tiene todo su texto en español e inglés, con las mismas claves. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEXTOS } from '../componentes/admin/textos.mjs';
import { apiDemo } from '../componentes/admin/demo-datos.mjs';

const forma = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'object' && !Array.isArray(v) ? forma(v) : Array.isArray(v) ? 'array' + v.length : typeof v]));

test('español e inglés tienen las mismas claves', () => {
  assert.deepEqual(forma(TEXTOS.en), forma(TEXTOS.es));
});

test('los textos con números responden en cada idioma', () => {
  for (const l of ['es', 'en']) {
    const t = TEXTOS[l];
    for (const k of ['todoHelp', 'todoFb', 'todoKeys', 'people', 'fbNew']) { assert.equal(typeof t[k](1), 'string'); assert.equal(typeof t[k](3), 'string'); }
    assert.notEqual(t.ago(30), ''); assert.notEqual(t.stay(90), '');
  }
  assert.notEqual(TEXTOS.es.todoHelp(2), TEXTOS.en.todoHelp(2));
});

test('los datos de prueba responden como el servidor', async () => {
  const api = apiDemo();
  const p = await api('health?panel=1');
  for (const k of ['now', 'rank', 'online', 'events', 'stat', 'perMin', 'keys', 'help', 'feedback']) assert.ok(k in p, k);
  const t = await api('trial'); assert.ok(Array.isArray(t.keys));
  const d = await api('trial', { method: 'POST', body: { action: 'maint', on: true, text: 'x' } }); assert.equal(d.maint.on, true);
});
