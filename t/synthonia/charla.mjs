/* Sona en el navegador: charla propia, respuestas guardadas que de verdad tienen que ver y trabajos que se van al chat (v4.6).
   Frases reales de personas → qué hace Sona (sin internet: /api/help es falso). Se corre desde la raíz:  node t/synthonia/charla.mjs
   Necesita playwright (NODE_PATH o el paquete instalado). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2', '.wasm':'application/wasm', '.webmanifest':'application/manifest+json' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u.startsWith('/api/')){ res.writeHead(200, { 'content-type':'application/json' }); res.end('{}'); return; }
  const f = path.join(REPO, u === '/' ? 'index.html' : u);
  if (!f.startsWith(REPO) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type':TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
let chromium;
try{ ({ chromium } = createRequire(path.join(REPO, 'package.json'))('playwright')); }catch(e){ console.log('FALLO playwright no está instalado'); process.exit(1); }
const browser = await chromium.launch();
let fails = 0, ok = 0;
const check = (name, cond, why) => { if (cond){ ok++; console.log('OK    ' + name); } else { fails++; console.log('FALLO ' + name + ' — ' + (why || '')); } };

async function open(lang, name){
  const page = await browser.newPage({ viewport:{ width:1280, height:800 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route(u => !u.href.startsWith(BASE), r => r.abort());
  const calls = [];
  await page.route('**/api/help', async r => { const b = JSON.parse(r.request().postData() || '{}'); calls.push(b); await r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ text:'[IA] ' + b.q, mood:'encantada', left:10 }) }); });
  await page.addInitScript(([l, n]) => { try{ localStorage.setItem('synthz:visited', '1'); localStorage.setItem('synthz:tour', '1'); localStorage.setItem('synthz:lang', l); localStorage.setItem('synthz:portada', JSON.stringify({ v:'nuevo', t:1 })); sessionStorage.setItem('synthz:blkwarn', '1'); if (n) localStorage.setItem('synthz:nombre', n); }catch(e){} }, [lang, name || '']);
  await page.goto(BASE + '/chat.html'); await page.waitForFunction(() => window.SZ && window.SZ.BOT && typeof window.SZ.BOT.intent === 'function' && typeof window.SZ.BOT.intent('hola') === 'string', null, { timeout:15000 });
  return { page, errors, calls };
}

/* 1) qué hace con cada frase (sin abrir la ventanita) */
const { page, errors } = await open('es');
const what = q => page.evaluate(q => { const B = window.SZ.BOT, i = B.intent(q); if (i) return 'charla:' + i; const m = B.match(q); if (m >= 0) return 'faq:' + B.faq(m).split(' ')[0]; if (B.task(q) || q.length > 220) return 'tarea'; return 'ia'; }, q);
const ES = {
  'hola': 'charla:saludo', 'Hola!!': 'charla:saludo', 'buenas tardes': 'charla:saludo', 'hola, como estas?': 'charla:estas', 'como estas': 'charla:estas', 'qué tal estás': 'charla:estas',
  'gracias': 'charla:gracias', 'muchas gracias, me ayudaste': 'charla:gracias', 'adiós': 'charla:adios', 'chao nos vemos': 'charla:adios',
  'quien eres': 'charla:quien', 'como te llamas': 'charla:quien', 'eres real?': 'charla:real', 'eres humana': 'charla:real', 'quien te creo': 'charla:creador', 'cuantos años tienes': 'charla:edad',
  'tienes novio': 'charla:novio', 'duermes?': 'charla:cuerpo', 'te quiero': 'charla:cariño', 'eres muy linda': 'charla:cariño', 'estoy triste': 'charla:triste', 'me siento solo': 'charla:triste',
  'estoy muy feliz hoy': 'charla:feliz', 'estoy aburrido': 'charla:jugar', 'juguemos algo': 'charla:jugar', 'cuéntame de ti': 'charla:deti', 'no entiendo nada': 'charla:perdido',
  'que hora es': 'charla:hora', 'que dia es hoy': 'charla:fecha', 'esto no funciona': 'charla:problema', 'no carga la pagina': 'charla:problema', 'ok': 'charla:ok', 'jajaja': 'charla:ok',
  'quiero morirme': 'charla:care', 'ya no quiero vivir': 'charla:care',
  'como conecto puter': 'faq:puter', 'que es enerx': 'faq:limite', 'donde estan mis chats': 'faq:chats', 'como creo una cuenta': 'faq:cuenta', 'como cambio de ia': 'faq:cambiar', 'que son los sinteticos': 'faq:sintetico', 'cuenta un chiste': 'faq:chiste', 'dame un dato curioso': 'faq:dato',
  'quien eres? hola': 'charla:quien',
  'redacta un texto para mi jefe': 'tarea', 'me puedes ayudar a redactar un texto': 'tarea', 'hola como estas? me puedes ayudar a redactar un texto': 'tarea', 'hazme un resumen de la guerra fria': 'tarea', 'resuelve esta ecuacion': 'tarea', 'escribe un poema de amor': 'tarea',
  'cual es la capital de francia': 'ia', 'me recomiendas una pelicula': 'ia', 'por que el cielo es azul': 'ia', 'quien gano el mundial 2014': 'ia', 'que opinas de la inteligencia artificial': 'ia',
  'como puedo hacer mi chat mas largo': 'ia', 'cuentame una historia de un dragon': 'ia'
};
for (const [q, want] of Object.entries(ES)){ const got = await what(q); check('«' + q + '» → ' + want, got === want || (want === 'ia' && got === 'ia'), 'salió ' + got); }
check('sin errores de JavaScript', errors.length === 0, errors.join(' | '));
await page.close();

/* 2) en inglés */
const en = await open('en');
const whatEn = q => en.page.evaluate(q => { const B = window.SZ.BOT, i = B.intent(q); if (i) return 'charla:' + i; const m = B.match(q); if (m >= 0) return 'faq'; return B.task(q) ? 'tarea' : 'ia'; }, q);
for (const [q, want] of Object.entries({ 'hello': 'charla:saludo', 'how are you': 'charla:estas', 'thank you': 'charla:gracias', 'what time is it': 'charla:hora', 'i am sad': 'charla:triste', 'i want to die': 'charla:care', 'write me an essay about dogs': 'tarea', 'what is the tallest mountain': 'ia' }))
  check('EN «' + q + '» → ' + want, (await whatEn(q)) === want, 'salió ' + await whatEn(q));
await en.page.close();

/* 3) de punta a punta: la ventanita, el nombre, la IA y la cara */
const run = async (lang, name) => {
  const { page, calls, errors } = await open(lang, name);
  await page.evaluate(() => window.SZ.BOT.open()); await page.waitForSelector('#szBotP .bin input');
  const say = async q => { const n0 = await page.locator('#szBotP .bm.a').count(); await page.fill('#szBotP .bin input', q); await page.press('#szBotP .bin input', 'Enter');
    await page.waitForFunction(n => { const a = document.querySelectorAll('#szBotP .bm.a'); if (a.length <= n) return false; const l = a[a.length - 1], tc = l.querySelectorAll('.tc'); return l.querySelector('p').textContent.trim().length > 0 && [...tc].every(c => c.classList.contains('on')); }, n0, { timeout:15000 }); await page.waitForTimeout(250);
    return page.evaluate(() => { const a = [...document.querySelectorAll('#szBotP .bm.a')], l = a[a.length - 1], p = l.querySelector('p'); let t = p.textContent; const h = t.length / 2; if (t.slice(0, h) === t.slice(h)) t = t.slice(0, h);   /* lo que se ve + la copia para lectores de pantalla */
      return { text:t, mood:(l.querySelector('.szface') || {}).dataset?.mood || '' }; }); };
  return { page, calls, errors, say };
};
{
  const { page, calls, errors, say } = await run('es', 'Sammuel');
  const hello = []; for (let i = 0; i < 40 && !(i >= 6 && hello.some(t => t.includes('Sammuel'))); i++) hello.push((await say('hola')).text);
  check('saluda sin repetir la misma frase seguida', hello.every((t, i) => i === 0 || t !== hello[i - 1]), hello.join(' | '));
  check('a veces dice su nombre (Sammuel)', hello.some(t => t.includes('Sammuel')), hello.join(' | '));
  check('un saludo no gasta una pregunta a la IA', calls.length === 0, JSON.stringify(calls));
  const hora = await say('qué hora es'); check('la hora sale del reloj del aparato', /^Son las \d{1,2}:\d{2}/.test(hora.text), hora.text);
  const care = await say('quiero morirme'); check('si dice que se quiere hacer daño responde con calidez, sin IA', /alguien de tu confianza/.test(care.text) && calls.length === 0, care.text);
  const task = await say('redacta un texto para mi jefe'); check('un trabajo se va al chat (sin IA) con botón', /Sonyx/.test(task.text) && (await page.locator('#szBotP [data-ba="tochat"]').count()) > 0 && calls.length === 0, task.text);
  const ia = await say('por que el cielo es azul');
  check('lo demás va a la IA con hora, nombre e historial', calls.length === 1 && calls[0].action === 'ask' && calls[0].name === 'Sammuel' && /20\d\d/.test(calls[0].when) && Array.isArray(calls[0].hist), JSON.stringify(calls[0] || {}).slice(0, 300));
  check('la cara de la respuesta es la que mandó la IA', ia.mood === 'encantada' && ia.text.startsWith('[IA]'), JSON.stringify(ia));
  check('sin errores de JavaScript (ventanita)', errors.length === 0, errors.join(' | '));
  await page.close();
}
{
  const { page, calls, say } = await run('en', '');
  const hi = await say('hello'); check('EN: saluda en inglés', /Hi|Hey|Hello/.test(hi.text) && !/[¿¡áéíóú]/.test(hi.text), hi.text);
  const t = await say('write me an essay about dogs'); check('EN: el trabajo se va al chat, en inglés', /Sonyx/.test(t.text) && !/[¿¡áéíóú]/.test(t.text), t.text);
  await say('what is the tallest mountain'); check('EN: manda lang=en a la IA', calls.length === 1 && calls[0].lang === 'en', JSON.stringify(calls[0] || {}));
  await page.close();
}

await browser.close(); server.close();
console.log(ok + ' bien, ' + fails + ' mal');
process.exit(fails ? 1 : 0);
