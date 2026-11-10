/* Personalidad de Sona (v3.7): idioma, límites de respeto, pensamientos ocultos y memoria que pregunta. node t/synthonia/personalidad.mjs */
import assert from 'node:assert/strict';
import { PERSONA, LANG_HEAD, isRude, boundary, cleanThoughts, langOf, memOf, memSys, takeMemory } from '../../api/_synthonia.js';

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
t('memoria: solo lo aprobado y pregunta antes', () => {
  assert.deepEqual(memOf(['Me llamo Ana', 7, '  ', 'eres una idiota', ...Array(20).fill('Estudio diseño')]).length, 12);
  assert.equal(memOf('no es lista').length, 0);
  assert.match(memSys('es', ['Me llamo Ana']), /Me llamo Ana/); assert.match(memSys('en', []), /\[remember:/);
  assert.deepEqual(takeMemory('¡Mucho gusto, Ana! [recordar: Se llama Ana y estudia diseño]'), { text:'¡Mucho gusto, Ana!', remember:'Se llama Ana y estudia diseño' });
  assert.deepEqual(takeMemory('Nice! [remember: Prefers short answers]'), { text:'Nice!', remember:'Prefers short answers' });
  assert.equal(takeMemory('Ok [recordar: su contraseña es 1234]').remember, '');
  assert.equal(takeMemory('Ok [recordar: su teléfono es 3001234567]').remember, '');
  assert.equal(takeMemory('Sin marca').remember, '');
});
console.log(ok + ' pruebas de personalidad OK');
