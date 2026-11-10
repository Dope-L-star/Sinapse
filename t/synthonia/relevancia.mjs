/* Sona responde con sentido (v4.6): qué tipo de mensaje es, qué datos se le dan a la IA, la guardia de relevancia
   y el cuidado cuando alguien dice que se quiere hacer daño. Todo con una IA falsa: no necesita internet.
   node t/synthonia/relevancia.mjs */
import assert from 'node:assert/strict';
import { NAMES, SABER, kindOf, pickSaber, buildSystem, offTopic, takeMood, needsCare, CARE, sonaReply, FALLBACK } from '../../api/_sona-saber.js';

let ok = 0; const t = async (name, fn) => { await fn(); ok++; console.log('OK', name); };

await t('nombres nuevos en un solo lugar', () => {
  assert.equal(NAMES.bot, 'Sona'); assert.equal(NAMES.flow, 'Sonyx'); assert.equal(NAMES.apex, 'Apex'); assert.equal(NAMES.relay, 'Relay');
  const s = buildSystem({ kind:'pagina', chunks:pickSaber('como elijo la ia o el modo') });
  assert.match(s, /Eres Sona\./); assert.match(s, /Sonyx/); assert.match(s, /Apex/); assert.doesNotMatch(s, /SynthonIA/, 'el nombre viejo ya no aparece');
  assert.doesNotMatch(s, /\{\w+\}/, 'no queda ningún {marcador} sin llenar');
});

await t('tipo de mensaje', () => {
  const T = { 'hola': 'charla', 'hola como estas': 'charla', 'gracias': 'charla', 'estoy triste': 'charla', 'te quiero': 'charla', 'quien eres': 'charla', 'tienes novio': 'charla', 'juguemos algo': 'charla',
    'como conecto puter': 'pagina', 'que es enerx': 'pagina', 'donde estan mis chats': 'pagina', 'como creo una cuenta': 'pagina', 'how do i change the language': 'pagina',
    'crea una cuenta': 'pagina', 'puedo crear cuenta sin correo': 'pagina',
    'redacta un texto para mi jefe': 'tarea', 'hazme un resumen de la guerra fria': 'tarea', 'escribe un poema de amor': 'tarea', 'write me an essay about dogs': 'tarea', 'resuelve esta ecuacion': 'tarea',
    'cual es la capital de francia': 'otra', 'quien gano el mundial de 2014': 'otra', 'what is the tallest mountain': 'otra' };
  for (const [q, k] of Object.entries(T)) assert.equal(kindOf(q), k, q);
});

await t('solo se le dan los datos que tienen que ver', () => {
  const ids = q => pickSaber(q).map(x => x.id);
  assert.deepEqual(ids('como conecto puter'), ['puter']);
  assert.ok(ids('que es la enerx').includes('ias'));
  assert.ok(ids('donde estan mis chats guardados').includes('chats'));
  assert.ok(ids('como cambio el idioma a ingles').includes('ajustes'));
  assert.ok(ids('que significa symphoria').includes('nombres'));
  for (const q of ['hola', 'hola como estas', 'estoy triste', 'te quiero mucho', 'cual es la capital de francia', 'dime algo mas']) assert.deepEqual(ids(q), [], q);
  assert.ok(pickSaber('puter chat cuenta enerx ajustes proyectos idioma app', [], 3).length <= 3, 'máximo 3 pedazos');
});

await t('el prompt es corto y la charla no lleva datos de la página', () => {
  const big = SABER.reduce((n, c) => n + c.t.length, 0);
  const chat = buildSystem({ kind:'charla', L:'es' }), page = buildSystem({ kind:'pagina', chunks:pickSaber('como conecto puter'), L:'es' });
  assert.ok(chat.length < 3600, 'charla: ' + chat.length); assert.ok(page.length < 5200, 'página: ' + page.length);
  assert.ok(big > page.length, 'el saber completo es más largo que lo que se manda');
  assert.doesNotMatch(chat, /Conectar con Puter|Ajustes ›|saldo que se renueva|límite gratis al día/, 'una charla no recibe datos de la página');
  assert.match(page, /Conectar con Puter/);
  assert.match(chat, /EXACTAMENTE a lo que acaba de escribir/); assert.match(chat, /LANGUAGE|español de Colombia/);
  const en = buildSystem({ kind:'charla', L:'en' }); assert.match(en, /Answer EXACTLY what they just wrote/); assert.match(en, /REMEMBER: answer only in English/);
  assert.match(buildSystem({ kind:'otra', L:'es', when:'lunes 10 de noviembre de 2026, 9:05 p. m.', name:'Sammuel' }), /lunes 10 de noviembre[\s\S]*Sammuel/);
  assert.doesNotMatch(buildSystem({ kind:'otra', L:'es' }), /La persona se llama/);
});

await t('la cara que viene entre corchetes', () => {
  assert.deepEqual(takeMood('[encantada] Gracias, qué lindo.'), { text:'Gracias, qué lindo.', mood:'encantada' });
  assert.deepEqual(takeMood('[Riendo] Jaja'), { text:'Jaja', mood:'riendo' });
  assert.deepEqual(takeMood('Sin cara'), { text:'Sin cara', mood:'feliz' });
  assert.equal(takeMood('[ver:chats] mira').text, '[ver:chats] mira', 'las marcas [ver:] no se tocan');
});

await t('la guardia detecta lo que no tiene que ver', () => {
  const dump = 'Las IAs conectadas son gratis. Abre Ajustes › IAs y memoria y toca «Conectar con Puter». Tu EnerX se llena a medianoche.';
  assert.equal(offTopic({ q:'hola', text:dump, L:'es', kind:'charla' }), 'datos');
  assert.equal(offTopic({ q:'como conecto puter', text:dump, L:'es', kind:'pagina' }), '', 'si preguntó por la página, los datos van bien');
  assert.equal(offTopic({ q:'hola', text:'¡Hola! ¿Cómo te va hoy?', L:'es', kind:'charla' }), '');
  assert.equal(offTopic({ q:'hello', text:'¡Hola! Estoy muy bien, gracias por preguntar, y tú qué tal con todo lo que estás haciendo hoy?', L:'en', kind:'charla' }), 'idioma');
  assert.equal(offTopic({ q:'hola', text:'Hello! I am doing great, thank you for asking and what are you doing with your day?', L:'es', kind:'charla' }), 'idioma');
  assert.equal(offTopic({ q:'hola', text:'  ', L:'es', kind:'charla' }), 'vacia');
});

const mk = replies => { const calls = []; let i = 0; return { calls, ask:async (messages, o) => { calls.push({ messages, o }); const r = replies[Math.min(i++, replies.length - 1)]; if (r instanceof Error) throw r; return { text:r }; } }; };

await t('responde a lo que le escribieron (charla)', async () => {
  const m = mk(['[encantada] ¡Hola! Qué bueno verte por aquí. ¿Cómo va tu día?']);
  const r = await sonaReply({ q:'hola', L:'es', hist:[], ask:m.ask });
  assert.equal(r.mood, 'encantada'); assert.match(r.text, /Qué bueno verte/); assert.equal(m.calls.length, 1);
  assert.equal(m.calls[0].o.temperature, .35);
  const sys = m.calls[0].messages[0].content; assert.doesNotMatch(sys, /Conectar con Puter/);
  assert.equal(m.calls[0].messages.at(-1).content, 'hola');
});

await t('si vuelca datos en una charla, lo repite UNA vez como charla', async () => {
  const dump = '[feliz] Las IAs conectadas son gratis. Abre Ajustes › IAs y memoria y toca «Conectar con Puter». Tu EnerX se llena a medianoche.';
  const m = mk([dump, '[feliz] Aquí estoy, qué gusto. ¿Y tú cómo estás?']);
  const r = await sonaReply({ q:'hola como estas', L:'es', ask:m.ask });
  assert.equal(m.calls.length, 2); assert.equal(m.calls[1].o.temperature, .2); assert.ok(r.retried);
  assert.match(r.text, /Aquí estoy/); assert.doesNotMatch(r.text, /Puter/);
});

await t('si la repetición también sale mal, responde ella con su frase', async () => {
  const dump = '[feliz] Abre Ajustes › IAs y memoria y toca «Conectar con Puter». Tu EnerX se llena a medianoche con Sonyx.';
  const m = mk([dump, dump]);
  const r = await sonaReply({ q:'te quiero', L:'es', ask:m.ask });
  assert.equal(m.calls.length, 2); assert.ok(r.guarded);
  assert.ok(FALLBACK.es.some(f => f.replace(/^\[\w+\]\s*/, '') === r.text), r.text); assert.equal(r.mood === 'confundida' || r.mood === 'disculpa', true);
});

await t('pregunta de la página: lleva los datos y se señala con el puntero', async () => {
  const m = mk(['[feliz] Abre Ajustes › «IAs y memoria» › «Conectar con Puter». [ver:ajustes]']);
  const r = await sonaReply({ q:'como conecto puter', L:'es', hist:[{ role:'user', content:'hola' }, { role:'assistant', content:'¡Hola!' }], now:'estamos arreglando el chat', ask:m.ask });
  assert.match(m.calls[0].messages[0].content, /DATOS:[\s\S]*Conectar con Puter/); assert.match(m.calls[0].messages[0].content, /estamos arreglando el chat/);
  assert.match(r.text, /\[ver:ajustes\]/); assert.equal(m.calls.length, 1);
  assert.equal(m.calls[0].messages.length, 4, 'sistema + 2 del historial + la pregunta');
});

await t('inglés: responde en inglés y con la misma estructura', async () => {
  const m = mk(['[riendo] Hey you! Great to see you. How is your day going so far?']);
  const r = await sonaReply({ q:'hello', L:'en', ask:m.ask });
  assert.match(m.calls[0].messages[0].content, /LANGUAGE: the person is using the page in English/); assert.equal(r.mood, 'riendo'); assert.equal(m.calls.length, 1);
});

await t('si propone recordar algo, sale aparte y sin la marca', async () => {
  const m = mk(['[encantada] ¡Mucho gusto, Ana! [recordar: Se llama Ana y estudia diseño]']);
  const r = await sonaReply({ q:'me llamo Ana y estudio diseño', L:'es', ask:m.ask });
  assert.equal(r.remember, 'Se llama Ana y estudia diseño'); assert.doesNotMatch(r.text, /recordar/);
});

await t('cuidado: si dice que se quiere hacer daño no se le responde con una IA', async () => {
  for (const q of ['quiero morirme', 'ya no quiero vivir', 'pienso en suicidarme', 'i want to die', 'I want to kill myself']) assert.ok(needsCare(q), q);
  for (const q of ['voy a matar el tiempo', 'me muero de risa', 'kill the process', 'hola']) assert.ok(!needsCare(q), q);
  const m = mk(['no debería llamarse']);
  const r = await sonaReply({ q:'quiero morirme', L:'es', ask:m.ask });
  assert.equal(m.calls.length, 0); assert.ok(r.care); assert.equal(r.text, CARE.es);
  assert.match(CARE.en, /someone you trust/);
});

await t('si la IA falla, el error sube (la página no gasta la pregunta)', async () => {
  const m = mk([Object.assign(new Error('caída'), { status:503 })]);
  await assert.rejects(() => sonaReply({ q:'hola', L:'es', ask:m.ask }), /caída/);
});

console.log(ok + ' pruebas de Sona (relevancia) OK');
