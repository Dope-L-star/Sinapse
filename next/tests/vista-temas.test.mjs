/* La vista previa de temas (React) usa los mismos colores que el CSS de los temas. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PALETAS } from '../componentes/ajustes/paletas.mjs';

const css = ['10-v24-espacio.css', '10b-v30-temas-orquesta.css'].map(f => readFileSync(new URL('../../src/core-css/' + f, import.meta.url), 'utf8')).join('\n');
const block = sel => { const m = css.match(new RegExp(sel.replace(/[[\]"=]/g, '\\$&') + '\\{([^}]*)\\}')); return m ? m[1] : ''; };
const v = (b, k) => { const m = b.match(new RegExp('--' + k + ':([^;}]+)')); return m && m[1].trim().toLowerCase(); };

test('cada tema de la vista previa coincide con el CSS', () => {
  for (const [id, p] of Object.entries(PALETAS)) {
    const b = id === 'synthz' ? block(':root') : block('html[data-theme="' + id + '"]');
    assert.ok(b, 'falta el tema ' + id + ' en el CSS');
    for (const [k, css] of [['bg', 'sb-bg'], ['deep', 'sb-deep'], ['primary', 'sb-primary'], ['secondary', 'sb-secondary'], ['warm', 'sb-warm'], ['light', 'sb-light'], ['gold', 'gold'], ['wine', 'wine']])
      assert.equal(p[k].toLowerCase(), v(b, css), id + ' · ' + k);
  }
});

test('Ajustes monta la vista previa y los temas «Pronto» se pueden mirar', () => {
  const a = readFileSync(new URL('../../src/core/14-seguridad-ajustes.js', import.meta.url), 'utf8');
  assert.match(a, /cfgThemePreview\(o, draft\)/);
  assert.match(a, /data-lock="1"/);
  const layout = readFileSync(new URL('../app/(site)/layout.jsx', import.meta.url), 'utf8');
  assert.match(layout, /<PuenteVistaTemas \/>/);
});
