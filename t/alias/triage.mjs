/* Prueba del enrutado de A.L.I.A.S. (api/_triage.js): lo realmente fácil va a la Automática o a SuperiorSynth;
   un pedido de verdad (aunque empiece con «hola») lo toma A.L.I.A.S. Sin servidor, sin claves.   node t/alias/triage.mjs */
import { triage } from '../../api/_triage.js';

let bad = 0;
const row = (goal, want, extra) => {
  const r = triage(goal);
  const got = r.agent ? 'agent' : r.to;
  const ok = got === want && (!extra || r.kind === extra);
  if (!ok) { bad++; console.log('  ✗ «' + goal + '» → ' + got + (r.kind ? '/' + r.kind : '') + (r.why ? ' (' + r.why + ')' : '') + '  (esperaba ' + want + (extra ? '/' + extra : '') + ')'); }
  else console.log('  ✓ «' + goal.replace(/\n/g, '⏎').slice(0, 70) + '» → ' + got + (r.kind ? '/' + r.kind : '') + (r.why ? ' (' + r.why + ')' : ''));
};

console.log('— saludos, gracias y charla → Automática');
for (const g of ['hola', 'Hola!', 'holaaa', 'buenas', 'Buenos días', 'hola, ¿cómo estás?', 'Hola alias', 'hey', 'hello', 'hi there', 'Good morning!', 'how are you?', '¡Hola! ¿Qué tal?', 'hola 👋', 'ok', 'ok gracias', 'gracias!', 'muchas gracias', 'thanks', 'thank you so much'])
  row(g, 'auto');
row('gracias', 'auto', 'gracias'); row('hola', 'auto', 'saludo');
for (const g of ['quién eres', 'who are you?', 'qué puedes hacer', 'what can you do', 'cómo te llamas', 'hola, ¿en qué me puedes ayudar?'])
  row(g, 'auto', 'charla');
for (const g of ['¿me ayudas?', 'hola, necesito ayuda', 'buenas, me puedes ayudar?', 'can you help me?', 'i need help', 'ayuda', 'hola, quiero preguntarte algo'])
  row(g, 'auto', 'ayuda');

console.log('— preguntas y pedidos chiquitos → SuperiorSynth');
for (const g of ['cuánto es 2+2', 'qué es un token', 'capital de Francia', 'quién escribió Don Quijote', 'dame un chiste', 'cuéntame un chiste', 'what is photosynthesis', 'who won the world cup in 2022?', 'traduce hello world al español', 'explícame la fotosíntesis', 'qué hora es', 'hola, cuéntame un chiste', 'what does API mean?'])
  row(g, 'superior');

console.log('— un pedido de verdad (aunque empiece con «hola») → A.L.I.A.S.');
for (const g of [
  'Hola como estas? me puedes ayudar a redactar un texto para presentar mi emprendimiento de velas',   /* el ejemplo de Sammuel */
  'Hola, ¿me puedes ayudar a redactar un texto?',
  'hola! necesito un correo para mi jefe pidiendo vacaciones',
  'Hola. Soy estudiante de medicina y necesito organizar mi semana con cinco materias distintas',
  'Investiga el mercado de bicicletas eléctricas en Colombia',
  'Haz un plan de estudio para mi examen de cálculo',
  'hazme una presentación sobre el cambio climático',
  'Compara iPhone y Android',
  'escribe un poema sobre el mar',
  'ayúdame con mi tarea de matemáticas',
  'quiero aprender a tocar guitarra en un mes',
  'Programa una función que ordene una lista',
  'hello! can you help me write an email to my landlord?',
  'Research the best laptops under 800 dollars and compare them',
  'Summarize this article: https://example.com/noticia',
  'Hola\nAquí está mi texto, corrígelo por favor y ponle un título que enganche mucho a la gente que lo lea',
  'Necesito una estrategia de marketing para lanzar mi tienda en línea',
  'Make me a weekly meal plan',
  'redacta una carta de renuncia',
  'Summarize Bogota weather for a short trip',
  'Resumir el clima de Bogotá para alguien que va de viaje'
]) row(g, 'agent');

if (bad) { console.log('\nFALLAN ' + bad); process.exit(1); }
console.log('\nTodo bien: el enrutado decide con sentido.');
