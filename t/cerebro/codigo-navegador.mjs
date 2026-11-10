/* SynthFlow de verdad (navegador) con la IA simulada: lo nuevo de código y archivos (v4.5).
   Uso: node t/cerebro/codigo-navegador.mjs [carpeta-capturas] [carpeta-public]   (antes: node cloudflare/preparar.mjs)
   Con la carpeta public de la versión anterior sirve para las capturas de ANTES (las comprobaciones fallarán, es lo esperado).
   Revisa: (1) a las IAs conectadas ya no les llega el manual viejo del navegador, (2) un archivo con el nombre DENTRO de la cerca
   (```html:calculadora.html) sale como archivo con su nombre, (3) si la respuesta se corta y la IA sigue, el archivo queda completo,
   sin cerca doble ni líneas repetidas. */
process.env.SYNTHZ_GUEST_MSGS = '30';
const { start } = await import('../web/servidor.mjs');
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = process.argv[2] || '', ROOT = process.argv[3] ? path.resolve(process.argv[3]) : undefined;
let fails = 0;
const check = (n, c, why) => { if (c) console.log('OK    ' + n); else { fails++; console.log('FALLO ' + n + (why ? ' — ' + String(why).slice(0, 400) : '')); } };
const s = await start(ROOT ? { root:ROOT } : {});
const b = await chromium.launch();
const p = await b.newPage({ viewport:{ width:1280, height:900 }, locale:'es-CO' });
p.on('pageerror', e => console.log('error de página:', e.message));
await p.route(u => !u.href.startsWith(s.base), r => r.abort());
await p.addInitScript(() => { try{ localStorage.setItem('synthz:visited', '1'); localStorage.setItem('synthz:tour', '1'); localStorage.setItem('sz-alfa-visto', '1'); sessionStorage.setItem('synthz:intro', '1'); localStorage.setItem('synthz:cfg', JSON.stringify({ review:false, autoWeb:false })); }catch(e){} });
/* la IA simulada: cada POST a /api/ai toma la siguiente respuesta de la cola ({ text, cut }) y se anota lo que se mandó */
const sent = [], queue = [];
await p.route('**/api/ai', async route => {
  const req = route.request();
  if (req.method() !== 'POST') return route.continue();
  const body = req.postDataJSON(); sent.push(body);
  const r = queue.shift() || { text:'Listo.' };
  const parts = r.text.match(/[\s\S]{1,120}/g) || [''];
  const sse = parts.map(x => 'data: ' + JSON.stringify({ choices:[{ delta:{ content:x } }] }) + '\n\n').join('') + (r.cut ? 'data: ' + JSON.stringify({ choices:[{ delta:{}, finish_reason:'length' }] }) + '\n\n' : '') + 'data: [DONE]\n\n';
  route.fulfill({ status:200, headers:{ 'content-type':'text/event-stream', 'x-sz-model':'sz:google:gemini-flash-latest', 'x-sz-name':'Gemini%20Flash', 'x-sz-prov':'Google', 'x-sz-used':'0', 'x-sz-limit':'25000', 'access-control-expose-headers':'x-sz-model,x-sz-name,x-sz-prov,x-sz-used,x-sz-limit' }, body:sse });
});
await p.goto(s.base + '/chat.html'); await p.waitForTimeout(4000);
await p.click('#blk .lnk').catch(() => {});
await p.evaluate(() => { document.querySelectorAll('#blk, .szgt, .gt-pop').forEach(x => x.remove()); });
async function say(text){
  await p.fill('#inp', text); await p.press('#inp', 'Enter');
  await p.waitForFunction(() => !document.querySelector('.m.writing') && !document.body.classList.contains('busy'), null, { timeout:25000 }).catch(() => {});
  await p.waitForTimeout(2200);
}
const shot = async n => { if (OUT) await p.screenshot({ path:path.join(OUT, n) }); };
const lastBot = () => p.evaluate(() => { const m = [...document.querySelectorAll('#lane .m.bot, #lane .m:not(.user)')].pop(); return m ? { cards:[...m.querySelectorAll('.fcard:not(.deck)')].map(c => ({ name:c.querySelector('.fc-t b').textContent, code:c.querySelector('pre').textContent })), text:m.innerText } : null; });

/* 1) nombre dentro de la cerca + sin manual viejo del navegador */
queue.push({ text:'Aquí tienes tu calculadora.\n\n```html:calculadora.html\n<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><title>Calculadora</title></head>\n<body><button id="b">2+2</button>\n<script>document.getElementById("b").addEventListener("click", () => { document.title = String(2 + 2); });</script>\n</body></html>\n```\n\nÁbrela en tu navegador.' });
await say('hazme una calculadora');
const first = sent[0], sysMsgs = (first && first.messages || []).filter(m => m.role === 'system');
check('a la IA conectada solo le llega lo del servidor: el navegador ya no manda «MODO SYNTHCODE»', first && !sysMsgs.some(m => /SYNTHCODE/.test(m.content)), JSON.stringify(sysMsgs.map(m => m.content.slice(0, 80))));
const L1 = await lastBot();
check('```html:calculadora.html sale como archivo con su nombre', L1 && L1.cards.length === 1 && L1.cards[0].name === 'calculadora.html', JSON.stringify(L1 && L1.cards.map(c => c.name)));
check('el archivo trae todo su código', L1 && /<\/html>\s*$/.test(L1.cards[0].code.trim()) && /addEventListener/.test(L1.cards[0].code));
await shot('1-nombre-en-la-cerca.png');

/* 2) se corta y la IA sigue: sin cerca doble ni líneas repetidas */
queue.push({ cut:true, text:'Te armé el juego.\n\n**juego.html**\n\n```html\n<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><title>Juego</title></head>\n<body><canvas id="c"></canvas>\n<script>\nconst a = 1;\nconst b = 2;' });
queue.push({ text:'```html\nconst b = 2;\nconst c = 3;\n</script></body></html>\n```\n\nListo, ábrelo en el navegador.' });
await say('crea un juego sencillo con canvas');
const cont = sent.find(x => x.messages && /^Continúa exactamente/.test(String(x.messages[x.messages.length - 1].content)));
check('la página sí pidió «Continúa» con lo escrito a medias', !!cont);
const L2 = await lastBot(), code2 = L2 && L2.cards[0] ? L2.cards[0].code : '';
check('el archivo queda completo (llega hasta </html>)', /<\/html>\s*$/.test(code2.trim()) && /const c = 3;/.test(code2), code2.slice(-120));
check('sin la línea repetida («const b = 2;» una sola vez)', (code2.match(/const b = 2;/g) || []).length === 1, code2);
check('sin una cerca ```html metida en medio del archivo', !/```/.test(code2) && L2.cards.length === 1, L2 && L2.cards.length + ' tarjetas');
check('las líneas no se pegaron entre sí', /const a = 1;\nconst b = 2;\nconst c = 3;/.test(code2), JSON.stringify(code2.slice(-140)));
await shot('2-continua-sin-repetir.png');
await b.close(); s.close();
console.log(fails ? '\n' + fails + ' FALLO' : '\nTodo bien.'); process.exit(fails ? 1 : 0);
