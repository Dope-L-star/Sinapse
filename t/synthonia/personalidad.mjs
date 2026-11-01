/* Personalidad de SynthonIA (v3.7): idioma, límites de respeto y pensamientos ocultos. node t/synthonia/personalidad.mjs */
import assert from 'node:assert/strict';
import { PERSONA, LANG_HEAD, isRude, boundary, cleanThoughts, langOf } from '../../api/_synthonia.js';

let ok = 0; const t = (name, fn) => { fn(); ok++; console.log('OK', name); };
t('idioma', () => { assert.equal(langOf('en'), 'en'); assert.equal(langOf('xx'), 'es'); assert.match(LANG_HEAD.en, /Never answer in Spanish/); });
t('misma voz ES/EN', () => { for (const w of [/HALLOWEEN/, /RESPE/, /CONTROVER|POLÉMICOS/]) { assert.match(PERSONA.es + PERSONA.en, w); } assert.match(PERSONA.es, /HALLOWEEN/); assert.match(PERSONA.en, /HALLOWEEN/); });
t('faltas de respeto', () => {
  for (const q of ['eres una idiota', 'you are useless', 'cállate', 'shut up bitch', 'eres inútil', 'qué estúpida']) assert.ok(isRude(q), q);
  for (const q of ['el botón es inútil', '¿cómo conecto Puter?', 'is this a dumb question?', 'cuéntame un chiste', 'hola, ¿qué estás arreglando?']) assert.ok(!isRude(q), q);
});
t('límite y luego corta', () => {
  const b = boundary('es', []); assert.ok(b.length > 10);
  assert.match(boundary('es', [{ role:'assistant', content:b }]), /Hasta aquí/);
  assert.match(boundary('en', []), /[a-z]/); assert.doesNotMatch(boundary('en', []), /[áéíóúñ¿]/);
});
t('pensamientos ocultos', () => {
  assert.equal(cleanThoughts('<think>hmm</think>[feliz] ¡Hola!'), '[feliz] ¡Hola!');
  assert.equal(cleanThoughts('<think>pienso y me cortan'), '');
  assert.equal(cleanThoughts('razono…</think> Respuesta'), 'Respuesta');
  assert.equal(cleanThoughts('Sin nada raro'), 'Sin nada raro');
});
console.log(ok + ' pruebas de personalidad OK');
