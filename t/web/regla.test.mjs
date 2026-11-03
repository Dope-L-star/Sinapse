/* v4.2 · Regla de internet: misma pregunta → misma decisión, siempre, en SynthFlow (chat.js) y en el servidor (A.L.I.A.S.).
   Uso: node --test t/web/regla.test.mjs */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { webRule as server } from '../../api/_web-regla.js';

const src = fs.readFileSync(new URL('../../chat.js', import.meta.url), 'utf8');
const a = src.indexOf('function webRule(text){'), b = src.indexOf("let webMode = 'auto';");
assert.ok(a > 0 && b > a, 'chat.js debe tener webRule y webMode');
const client = new Function(src.slice(a, b) + '\nreturn webRule;')();

/* [pregunta, ¿busca?] — de los dos tipos, en español e inglés */
export const CASOS = [
  ['¿Cuánto cuesta el dólar hoy en Colombia?', true],
  ['¿Qué noticias hay de inteligencia artificial esta semana?', true],
  ['¿Quién ganó el partido de anoche del Real Madrid?', true],
  ['¿Cómo va a estar el clima en Bogotá mañana?', true],
  ['¿Cuál es la última versión de Python?', true],
  ['Busca en internet reseñas del iPhone 17', true],
  ['Investiga los mejores portátiles para estudiantes', true],
  ['Dame las fuentes sobre el cambio climático', true],
  ['¿A qué hora abre el museo del Oro?', true],
  ['¿Cuál es el precio del bitcoin?', true],
  ['¿Qué está pasando con las elecciones?', true],
  ["What's the weather in Miami today?", true],
  ['Latest news about OpenAI', true],
  ['How much is a PS5 right now?', true],
  ['Who won the Champions League final?', true],
  ['Search the web for vegan restaurants in Medellín', true],
  ['What is the exchange rate from euros to pesos?', true],
  ['Hola, ¿cómo estás hoy?', false],
  ['Escribe un poema sobre el mar', false],
  ['Explícame la fotosíntesis paso a paso', false],
  ['¿Cuánto es 15 por 23?', false],
  ['Ayúdame con mi tarea de inglés', false],
  ['Resume tu última respuesta en tres puntos', false],
  ['Hazme una página web de una pizzería', false],
  ['¿Qué opinas de los gatos?', false],
  ['Traduce al inglés: buenos días', false],
  ['Corrige este código:\n```js\nconst a = 1\nconsole.log(a\n```', false],
  ['Dame 3 ideas para un regalo de cumpleaños', false],
  ['¿Qué es un agente de IA?', false],
  ['Hi! How are you today?', false],
  ['Write a short story about a dragon', false],
  ['Explain how a neural network works', false],
  ['Make your last answer shorter', false],
  ['What is 2 + 2?', false],
  ['Give me a workout plan for beginners', false],
];

test('la regla decide bien las preguntas de los dos tipos (ES/EN)', () => {
  const mal = CASOS.filter(([q, want]) => client(q).go !== want).map(([q, want]) => (want ? 'debía buscar: ' : 'no debía buscar: ') + q);
  assert.deepEqual(mal, []);
});

test('SynthFlow y el servidor (A.L.I.A.S.) dicen exactamente lo mismo', () => {
  for (const [q] of CASOS) assert.deepEqual(client(q), server(q), q);
});

test('la misma pregunta da siempre la misma decisión', () => {
  for (const [q] of CASOS){ const d = client(q); for (let i = 0; i < 20; i++) assert.deepEqual(client(q), d, q); }
});
