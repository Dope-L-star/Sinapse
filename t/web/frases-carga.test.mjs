/* v4.5 · Prueba de las frases de carga (next/componentes/entrada/frases.js), sin navegador.
   Sammuel (9 nov): «que las frases sean cualquiera siempre, y diferentes, y con mi nombre, así como Claude».
   Revisa: las listas de español e inglés van parejas; ninguna frase es larga; el nombre solo entra donde hay {n} y nunca queda un «{n}» ni una coma suelta;
   sin nombre solo salen frases que no lo llevan; nunca se repite la misma frase seguida, ni al cambiar de contexto y volver;
   salen todas las frases con el tiempo (es «al azar» de verdad); el nombre se limpia (primer nombre, sin @ ni símbolos).
   Uso: node --test t/web/frases-carga.test.mjs */
import test from 'node:test';
import assert from 'node:assert/strict';

/* un localStorage de mentira (en Node no existe; el módulo lo usa para recordar la última frase y el nombre) */
const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const { FRASES, frase, limpiaNombre } = await import('../../next/componentes/entrada/frases.js');

const CTX = Object.keys(FRASES);
const nuevo = () => mem.clear();

test('hay frases para cada momento de carga y ES/EN van parejas', () => {
  for (const c of ['pagina', 'datos', 'leyendo', 'pensando', 'razonando', 'escribiendo', 'agente', 'buscando', 'imagen', 'sintetico', 'archivo']) assert.ok(FRASES[c], 'falta ' + c);
  for (const c of CTX) {
    assert.ok(FRASES[c].es.length >= 7 && FRASES[c].en.length >= 7, c + ': muy pocas frases para que no se repitan');
    assert.equal(FRASES[c].es.length, FRASES[c].en.length, c + ': español e inglés no van parejas');
    const conN = (a) => a.filter((f) => f.includes('{n}')).length;
    assert.equal(conN(FRASES[c].es), conN(FRASES[c].en), c + ': distinta cantidad de frases con nombre en ES y EN');
    assert.ok(conN(FRASES[c].es) >= 3 && FRASES[c].es.length - conN(FRASES[c].es) >= 4, c + ': tiene que haber con nombre y sin nombre');
  }
});

test('ninguna frase es larga ni trae símbolos raros; las de imagen son cortas', () => {
  for (const c of CTX) for (const l of ['es', 'en']) for (const f of FRASES[c][l]) {
    const sin = f.replace('{n}', 'Sammuel');
    assert.ok(sin.length <= (c === 'imagen' ? 24 : c === 'buscando' ? 56 : 44), c + '/' + l + ' muy larga: «' + f + '»');
    assert.ok(!/[<>&"]/.test(f), c + '/' + l + ' trae un símbolo que no va: «' + f + '»');
    assert.ok((f.match(/\{n\}/g) || []).length <= 1, c + '/' + l + ' lleva dos nombres: «' + f + '»');
  }
});

test('con nombre: lo lleva casi la mitad, nunca queda un {n}', () => {
  for (const c of CTX) for (const l of ['es', 'en']) {
    nuevo();
    let con = 0; const N = 600;
    for (let i = 0; i < N; i++) { const f = frase(c, l, { n: 'Sammuel' }); assert.ok(!f.includes('{n}'), 'quedó {n}: ' + f); if (f.includes('Sammuel')) con++; }
    assert.ok(con > N * 0.25 && con < N * 0.65, c + '/' + l + ': con nombre ' + Math.round((100 * con) / N) + '% (debería rondar la mitad)');
  }
});

test('sin nombre: solo frases sin nombre, sin comas sueltas ni espacios dobles', () => {
  for (const c of CTX) for (const l of ['es', 'en']) {
    nuevo();
    for (let i = 0; i < 200; i++) {
      const f = frase(c, l, { n: '' });
      assert.ok(!f.includes('{n}') && !/,\s*$/.test(f) && !/\s{2,}/.test(f) && !/^[\s,]/.test(f) && f.length > 3, c + '/' + l + ': «' + f + '»');
    }
  }
});

test('nunca la misma frase dos veces seguidas (ni al empezar otra carga)', () => {
  for (const c of CTX) for (const l of ['es', 'en']) for (const n of ['Sammuel', '']) {
    nuevo();
    let ant = null;
    for (let i = 0; i < 400; i++) { const f = frase(c, l, { n }); assert.notEqual(f, ant, c + '/' + l + ' repitió «' + f + '» seguida'); ant = f; }
  }
});

test('salen todas las frases con el tiempo (es al azar de verdad, no un orden fijo)', () => {
  for (const c of CTX) for (const l of ['es', 'en']) {
    nuevo();
    const vistas = new Set(), ordenes = [];
    for (let i = 0; i < FRASES[c][l].length * 4; i++) vistas.add(frase(c, l, { n: 'Sammuel' }));
    assert.equal(vistas.size, FRASES[c][l].length, c + '/' + l + ': no salieron todas');
    for (let k = 0; k < 6; k++) { nuevo(); ordenes.push(Array.from({ length: 6 }, () => frase(c, l, { n: 'Sammuel' })).join('|')); }
    assert.ok(new Set(ordenes).size > 1, c + '/' + l + ': siempre sale en el mismo orden');
  }
});

test('el idioma manda: en inglés no salen frases en español', () => {
  nuevo();
  const es = new Set(FRASES.pensando.es.map((f) => f.replace('{n}', 'Ana')));
  for (let i = 0; i < 200; i++) assert.ok(!es.has(frase('pensando', 'en', { n: 'Ana' })));
});

test('el nombre se limpia: primer nombre, sin @ ni símbolos, con tope', () => {
  assert.equal(limpiaNombre('Sammuel Loaiza'), 'Sammuel');
  assert.equal(limpiaNombre('  @dope_l  '), 'dope_l');
  assert.equal(limpiaNombre('<b>Ana</b>'), 'bAnab');
  assert.equal(limpiaNombre('$&{}'), '');
  assert.equal(limpiaNombre('O’Brien'), 'O’Brien');
  assert.equal(limpiaNombre('Jean-Luc Picard'), 'Jean-Luc');
  assert.equal(limpiaNombre('😀'), '');
  assert.equal(limpiaNombre(''), '');
  assert.equal(limpiaNombre(null), '');
  assert.equal(limpiaNombre('José'), 'José');
  assert.equal(limpiaNombre('x'.repeat(60)).length, 24);
  nuevo();
  const f = frase('pagina', 'es', { n: '<script>' });   /* nunca pasa nada raro al texto */
  assert.ok(!/[<>]/.test(f));
});
