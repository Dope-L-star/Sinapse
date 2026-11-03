/* v4.2 · Prueba de punta a punta de «¿busca en internet?» en SynthFlow (IA simulada, pipeline real).
   Para cada pregunta abre SynthFlow, la envía y mira: ¿se llamó a la búsqueda? ¿salió «Busqué en internet · N fuentes»?
   Además: «Buscar en internet» y «No buscar» del menú «+» se respetan, y la misma pregunta decide igual dos veces.
   Uso: node cloudflare/preparar.mjs && node t/web/internet.mjs [carpeta-capturas] [raíz-del-sitio] */
import { start } from './servidor.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = process.argv[2] || '', ROOT = process.argv[3];
let fails = 0;
const check = (n, c, why) => { if (c) console.log('OK    ' + n); else { fails++; console.log('FALLO ' + n + (why ? ' — ' + String(why).slice(0, 200) : '')); } };
const s = await start(Object.assign({ reply:'Respuesta de prueba. Según la búsqueda, el dato es este [1].' }, ROOT ? { root:ROOT } : {}));
const b = await chromium.launch();
const RES = [{ t:'Fuente de prueba uno', u:'https://ejemplo.com/uno', s:'Dato de hoy.' }, { t:'Fuente de prueba dos', u:'https://ejemplo.org/dos', s:'Otro dato.' }];

async function ask(q, o = {}){
  const W = o.cel ? 390 : 1280, mob = !!o.cel;
  const p = await b.newPage({ viewport:{ width:W, height:mob ? 844 : 800 }, isMobile:mob, hasTouch:mob, deviceScaleFactor:1 });
  let searches = 0; const ip = '10.9.' + Math.floor(Math.random() * 250) + '.' + Math.floor(Math.random() * 250);   /* cada visita, como una persona distinta */
  await p.route(u => !u.href.startsWith(s.base), r => r.abort());
  await p.route(u => u.pathname === '/api/ai', async r => {
    const req = r.request(); let body = {}; try{ body = JSON.parse(req.postData() || '{}'); }catch(e){}
    if (req.method() === 'POST' && body.action === 'search'){ searches++; return r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ results:RES, via:'web' }) }); }
    return r.continue({ headers:Object.assign({}, req.headers(), { 'x-test-ip':ip }) });
  });
  await p.addInitScript(l => { try{ localStorage.setItem('synthz:visited', '1'); localStorage.setItem('synthz:tour', '1'); localStorage.setItem('sz-alfa-visto', '1'); localStorage.setItem('synthz:lang', l); sessionStorage.setItem('synthz:intro', '1'); }catch(e){} }, o.en ? 'en' : 'es');
  await p.goto(s.base + '/chat.html'); await p.waitForTimeout(4000);
  await p.click('#blk .lnk').catch(() => {}); await p.waitForTimeout(400);
  if (o.force){
    await p.evaluate(() => document.getElementById('attachBtn').click()); await p.waitForTimeout(400);
    if (o.shotMenu && OUT) await p.screenshot({ path:OUT + '/menu-' + (o.en ? 'en' : 'es') + (mob ? '-cel' : '') + '.png' });
    await p.evaluate(k => document.querySelector('[data-att="' + k + '"]').click(), o.force); await p.waitForTimeout(300);
  }
  await p.fill('#inp', q);
  await p.evaluate(() => document.getElementById('sendBtn').click());
  await p.waitForFunction(() => document.querySelectorAll('#lane .m.bot').length > 0, null, { timeout:20000 }).catch(() => {});
  await p.waitForTimeout(1800);
  const said = await p.evaluate(() => { const e = document.querySelector('#lane .websum .ag-tx'); return e ? e.textContent.trim() : ''; });
  if (o.shot && OUT){ await p.evaluate(() => { const b = document.getElementById('blk'); if (b) b.remove(); }); await p.screenshot({ path:OUT + '/' + o.shot + '.png' }); }
  await p.close();
  return { searches, said };
}

const CASOS = [
  ['¿Cuánto cuesta el dólar hoy en Colombia?', true, 'es'], ['¿Qué noticias hay de inteligencia artificial esta semana?', true, 'es'], ['Busca en internet reseñas del iPhone 17', true, 'es'],
  ['Escribe un poema sobre el mar', false, 'es'], ['Explícame la fotosíntesis paso a paso', false, 'es'], ['Hola, ¿cómo estás hoy?', false, 'es'],
  ["What's the weather in Miami today?", true, 'en'], ['Latest news about OpenAI', true, 'en'],
  ['Write a short story about a dragon', false, 'en'], ['Explain how a neural network works', false, 'en']
];
for (const [q, want, l] of CASOS){
  const r = await ask(q, { en:l === 'en' });
  check((want ? 'busca     ' : 'no busca  ') + '«' + q + '»', want ? r.searches === 1 && /fuente|source/i.test(r.said) : r.searches === 0 && !r.said, 'búsquedas=' + r.searches + ' letrero=«' + r.said + '»');
  if (want) check('   dice por qué: «' + r.said + '»', /porque|because/.test(r.said));
}
/* la misma pregunta, otra vez: misma decisión */
for (const [q, want, l] of [CASOS[0], CASOS[3]]){ const r = await ask(q, { en:l === 'en' }); check('misma decisión la 2.ª vez: «' + q + '»', (r.searches > 0) === want); }
/* tú mandas */
{ const r = await ask('Escribe un poema sobre el mar', { force:'web', shotMenu:true, shot:'forzado-buscar-es' }); check('«Buscar en internet» del menú busca aunque la regla diga que no', r.searches === 1 && /porque lo pediste/.test(r.said), r.said); }
{ const r = await ask('¿Cuánto cuesta el dólar hoy en Colombia?', { force:'noweb', shot:'forzado-no-buscar-es' }); check('«No buscar en internet» del menú no busca aunque la regla diga que sí', r.searches === 0 && !r.said, r.said); }
{ const r = await ask('Latest news about OpenAI', { en:true, force:'noweb', shotMenu:true }); check('EN: «Don\'t search the web» se respeta', r.searches === 0); }
/* capturas */
if (OUT){
  await ask('¿Cuánto cuesta el dólar hoy en Colombia?', { shot:'busca-es-pc' });
  await ask('Escribe un poema sobre el mar', { shot:'no-busca-es-pc' });
  await ask("What's the weather in Miami today?", { en:true, cel:true, shot:'busca-en-cel' });
  await ask('Write a short story about a dragon', { en:true, cel:true, shot:'no-busca-en-cel' });
}
await b.close(); s.close();
console.log(fails ? '\n' + fails + ' FALLO(S)' : '\nTodo bien.');
process.exit(fails ? 1 : 0);
