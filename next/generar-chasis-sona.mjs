/* Regenera el fragmento estático para las vistas que aún cargan synthonia.js. */
import { transform } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const source = new URL('./componentes/partitura/ChasisSona.jsx', import.meta.url);
const { code } = await transform(await readFile(source, 'utf8'), { loader: 'jsx', jsxFactory: 'h', format: 'cjs' });
const target = { exports: {} };
new Function('module', 'h', code)(target, createElement);
const markup = renderToStaticMarkup(createElement(target.exports.default));
const output = new URL('../src/synthonia/19-chasis-sona.js', import.meta.url);
await writeFile(output, '// Generado por next/generar-chasis-sona.mjs desde ChasisSona.jsx.\nconst SONA_CHASIS = ' + JSON.stringify(markup) + ';\n');
