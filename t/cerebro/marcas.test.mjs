/* La marca interna del título y de la memoria nunca se ve en la respuesta (bug del 3 nov: «[ titulo: - ]» se colaba).
   Uso: node --test t/cerebro/marcas.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../../src/chat/05g-titulos-memoria-ia.js', import.meta.url), 'utf8');
const head = src.slice(0, src.indexOf('/* lo que se le pide a la IA'));
const { sinMarcas, quitaMarcas, marcas } = new Function(head + '\nreturn { sinMarcas, quitaMarcas, marcas };')();

const casos = [
  ['¡Hola! ¿En qué te ayudo?\n[titulo: -]', '-'],
  ['¡Hola! ¿En qué te ayudo?\n[ titulo: - ]', '-'],
  ['Soy SynthonIA, tu guía.\n\n[ titulo: Identidad de la IA ]', 'Identidad de la IA'],
  ['Soy SynthonIA.\n\\[ titulo: Identidad de la IA \\]', 'Identidad de la IA'],
  ['Soy SynthonIA.\n**[Título: Identidad de la IA]**', 'Identidad de la IA'],
  ['Soy SynthonIA.\n`[titulo: Identidad de la IA]`', 'Identidad de la IA'],
  ['I am SynthonIA.\n[ Title = AI identity ]', 'AI identity'],
  ['Soy SynthonIA.\n[titulo：Identidad de la IA]', 'Identidad de la IA'],
  ['Soy SynthonIA.\n[ titulo:-]', '-'],
];
for (const [raw, title] of casos) test('marca escondida: ' + JSON.stringify(raw.split('\n').pop()), () => {
  const mk = marcas(raw);
  assert.equal(mk.title, title);
  assert.doesNotMatch(mk.text, /titul|títul|title|\[|\]|\\$/i);
  assert.doesNotMatch(sinMarcas(raw), /titul|títul|title/i);
  assert.doesNotMatch(quitaMarcas(raw), /titul|títul|title/i);
});

test('memoria con espacios también se esconde y se usa', () => {
  const mk = marcas('Listo.\n[ titulo: Panadería ]\n[ recordar: Vive en Bogotá ]');
  assert.equal(mk.text, 'Listo.'); assert.equal(mk.title, 'Panadería'); assert.equal(mk.mem, 'Vive en Bogotá.');
});

test('mientras llega, una marca a medio escribir no asoma', () => {
  for (const parcial of ['Hola\n[', 'Hola\n[ ', 'Hola\n[ tit', 'Hola\n[ titulo:', 'Hola\n[ titulo: Identi', 'Hola\n\\[ titulo: -', 'Hola\n**[Títu', 'Hola\n[ recor'])
    assert.equal(sinMarcas(parcial).trim(), 'Hola', parcial);
});

test('lo demás del texto no se toca', () => {
  const t = 'Usa [enlaces](https://x.co) y listas:\n- [ ] tarea\n- [x] hecha\nEl título del libro es [Cien años].';
  assert.equal(quitaMarcas(t), t);
  assert.equal(marcas(t).text, t);
  assert.equal(marcas(t).title, null);
});

test('si solo vino la marca, el texto queda vacío (no se muestra la marca)', () => {
  assert.equal(marcas('[ titulo: - ]').text, '');
});
