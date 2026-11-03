/* Tablero de gestión: textos en los dos idiomas y cuentas correctas con los datos de prueba de Pulsem. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEXTOS } from '../componentes/gestion/textos.mjs';
import { resumen, pct } from '../componentes/gestion/calculos.mjs';
import { apiDemo } from '../componentes/admin/demo-datos.mjs';

const forma = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? 'array' + v.length : v && typeof v === 'object' ? forma(v) : typeof v]));

test('español e inglés tienen las mismas claves', () => {
  assert.deepEqual(forma(TEXTOS.en), forma(TEXTOS.es));
  assert.notEqual(TEXTOS.es.ayuda(2, 1), TEXTOS.en.ayuda(2, 1));
  assert.match(TEXTOS.es.vozNuevos(1), /comentario sin leer$/);
});

test('las cuentas salen de los mismos datos de Pulsem', async () => {
  const R = resumen(await apiDemo()('health?panel=1'));
  assert.equal(R.norte.serie.length, 7);
  assert.equal(R.norte.hoy, 812 - 2);               /* pedidos de hoy menos los que no tuvieron respuesta */
  assert.equal(R.gente.online, 5);
  assert.equal(R.gente.invitados + R.gente.conCuenta, 5);
  assert.ok(R.calidad.errPct > 0 && R.calidad.errPct < 1);
  assert.equal(R.ayuda.urgentes, 1);
  assert.ok(R.tropiezos.length > 0);
});

test('sin datos no se rompe', () => {
  const R = resumen({});
  assert.equal(R.norte.hoy, 0); assert.equal(R.calidad.errPct, 0); assert.equal(R.capacidad.cupoPct, 0);
  assert.equal(pct(0.1234, 1), '12.3%');
});
