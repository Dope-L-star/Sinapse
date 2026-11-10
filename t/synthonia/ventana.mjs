/* La ventanita de Sona como compañera (v4.6): escenario con ella grande, letrero de estado, píldora para escribir, micrófono con permiso,
   sugerencias que se deslizan y que en el celular (390 px) nada se salga ni se tape. ES y EN, sin internet (/api/help es falso).
   Se corre desde la raíz:  node t/synthonia/ventana.mjs   (necesita playwright) */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2', '.ico':'image/x-icon', '.webmanifest':'application/manifest+json' };
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

async function open(lang, { W = 1280, H = 800, mobile = false, mic = false, delay = 0, hash = '', ui = '' } = {}){
  const ctx = await browser.newContext({ viewport:{ width:W, height:H }, deviceScaleFactor:1, isMobile:mobile, hasTouch:mobile });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route(u => !u.href.startsWith(BASE), r => r.abort());
  await page.route('**/api/help', async r => { if (delay) await new Promise(x => setTimeout(x, delay)); await r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ text:lang === 'en' ? 'Sure, tell me more.' : 'Claro, cuéntame más.', mood:'encantada', left:19 }) }); });
  await page.addInitScript(([l, m, u]) => {
    try{ if (u) localStorage.setItem('synthz:cfg', JSON.stringify({ v:2, ui:u })); }catch(e){}
    try{ localStorage.setItem('synthz:visited', '1'); localStorage.setItem('synthz:tour', '1'); localStorage.setItem('synthz:lang', l); localStorage.setItem('synthz:portada', JSON.stringify({ v:'nuevo', t:1 })); localStorage.setItem('synthz:bloq', '1'); sessionStorage.setItem('synthz:blkwarn', '1'); }catch(e){}
    if (m){ window.__mic = { started:0 }; window.SpeechRecognition = window.webkitSpeechRecognition = function(){ this.start = () => { window.__mic.started++; window.__mic.self = this; }; this.stop = () => { if (this.onend) this.onend(); }; }; }
    else { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; }
  }, [lang, mic, ui]);
  await page.goto(BASE + '/chat.html' + (hash === '?sona' ? '?sona=1' : hash));
  await page.waitForFunction(() => window.SZ && window.SZ.BOT && typeof window.SZ.BOT.open === 'function', null, { timeout:15000 });
  const c = await page.$('text=Continuar sin Puter'); if (c) await c.click();
  if (hash){ await page.waitForSelector('#szBotP.on .bsc .szbody', { timeout:12000 }).catch(() => {}); await page.waitForTimeout(500); return { page, errors, ctx }; }
  await page.evaluate(() => window.SZ.BOT.open()); await page.waitForSelector('#szBotP.on .bsc .szbody', { timeout:8000 });
  await page.waitForTimeout(500);
  return { page, errors, ctx };
}
const box = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x:r.left, y:r.top, w:r.width, h:r.height, r:r.right, b:r.bottom }; }, sel);
const txt = (page, sel) => page.evaluate(s => (document.querySelector(s) || {}).textContent || '', sel);
const stateOf = page => page.evaluate(() => document.querySelector('#szBotP').dataset.state || '');

/* 1) computador, español */
{
  const { page, errors, ctx } = await open('es', { delay:900 });
  check('la ventanita se llama Sona y lo dice el letrero', (await txt(page, '#szBotP .bnm b')) === 'Sona' && await page.getAttribute('#szBotP', 'aria-label') === 'Sona');
  check('ella (la misma de la portada) está en el escenario', await page.evaluate(() => !!document.querySelector('#szBotP .bstage .bsc .szbody .syb-hsvg') && document.querySelectorAll('#szBotP .bs-l').length === 5));
  const st = await box(page, '#szBotP .bstage'), sc = await box(page, '#szBotP .bsc .szbody');
  check('ella es grande (más de 130 px) y queda dentro del escenario', sc && sc.w >= 130 && sc.x >= st.x && sc.r <= st.r + 1, JSON.stringify([st, sc]));
  check('el nombre y la X no se tapan con ella', await page.evaluate(() => { const a = document.querySelector('#szBotP .bnm').getBoundingClientRect(), b = document.querySelector('#szBotP .bx').getBoundingClientRect(), c = document.querySelector('#szBotP .bsc .syb-hsvg').getBoundingClientRect(); return a.right <= c.left + 4 && b.left >= c.right - 4; }));
  check('saluda en español con su letrero', (await txt(page, '#szBotP .bl')).includes('Soy Sona') && (await txt(page, '#szBotP .bst')).length > 3);
  check('sin micrófono en el navegador, el botón del micrófono no sale', await page.evaluate(() => document.querySelector('#szBotP .bmic').hidden === true));
  /* estados: pensando → hablando → disponible */
  await page.fill('#szBotP .bin input', 'cuéntame algo sobre el cielo'); await page.waitForTimeout(150);
  check('mientras escribes ella te escucha', (await stateOf(page)) === 'listen' && (await txt(page, '#szBotP .bst')).includes('Escuch'));
  check('al escribir, sus ojos y su pose son de escucha', await page.evaluate(() => { const b = document.querySelector('#szBotP .bsc .szbody'); return b.dataset.mood === 'escuchando' && b.dataset.pose === 'escucha'; }));
  await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  check('al mandar, ella piensa (letrero y pose)', (await stateOf(page)) === 'think' && await page.evaluate(() => { const b = document.querySelector('#szBotP .bsc .szbody'); return b.dataset.mood === 'pensando' && b.dataset.pose === 'piensa'; }));
  await page.waitForFunction(() => document.querySelector('#szBotP').dataset.state === 'talk', null, { timeout:9000 }).then(() => check('al responder, ella habla (letrero «Hablando…»)', true), () => check('al responder, ella habla (letrero «Hablando…»)', false, await_state(page)));
  await page.waitForFunction(() => document.querySelector('#szBotP').dataset.state === 'idle', null, { timeout:12000 }).then(() => check('al terminar de escribir, vuelve a «Siempre disponible»', true), () => check('al terminar de escribir, vuelve a «Siempre disponible»', false));
  check('la respuesta de la IA llega al chat con su cara (encantada)', (await txt(page, '#szBotP .bl')).includes('Claro, cuéntame más') && await page.evaluate(() => document.querySelector('#szBotP .bsc .szbody').dataset.mood === 'encantada'));
  check('las sugerencias se deslizan (una sola fila con scroll)', await page.evaluate(() => { const q = document.querySelector('#szBotP .bq'); return getComputedStyle(q).flexWrap === 'nowrap' && q.scrollWidth > q.clientWidth; }));
  const bin = await box(page, '#szBotP .bin'), pan = await box(page, '#szBotP');
  check('la píldora de escribir queda dentro de la ventanita y a todo el ancho', bin.x >= pan.x && bin.r <= pan.r && bin.w > pan.w * .85, JSON.stringify([bin, pan]));
  check('la ventanita cabe en pantalla', pan.x >= 0 && pan.y >= 0 && pan.r <= 1280 && pan.b <= 800, JSON.stringify(pan));
  await page.click('#szBotP .bx'); await page.waitForTimeout(500);
  check('se cierra con la X', await page.evaluate(() => !document.querySelector('#szBotP').classList.contains('on')));
  check('sin errores de JavaScript (PC, ES)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}
function await_state(page){ return ''; }

/* 2) micrófono: toca y habla (el navegador pide el permiso, como en el chat), sin aviso previo */
{
  const { page, errors, ctx } = await open('es', { mic:true });
  check('con micrófono en el navegador, el botón sale', await page.evaluate(() => document.querySelector('#szBotP .bmic').hidden === false));
  check('el botón del micrófono tiene nombre para lectores de pantalla', (await page.getAttribute('#szBotP .bmic', 'aria-label')) === 'Hablarle a Sona');
  await page.click('#szBotP .bmic'); await page.waitForTimeout(500);
  check('al tocarlo empieza a escuchar de una vez (sin aviso previo) y ella se inclina a oírte', (await page.evaluate(() => window.__mic.started)) === 1 && (await stateOf(page)) === 'listen' && await page.evaluate(() => document.querySelector('#szBotP .bmic').classList.contains('on')) && !(await page.$('#szBotP [data-ba="micok"]')));
  check('no depende del interruptor de dictado de Ajustes', await page.evaluate(() => !(window.SZ && window.SZ.CFG && window.SZ.CFG.dictado === false) || window.__mic.started === 1));
  await page.evaluate(() => { const r = window.__mic.self; r.onresult({ results:[[{ transcript:'hola sona' }]] }); r.stop(); }); await page.waitForTimeout(900);
  check('lo que dices se manda como mensaje', (await txt(page, '#szBotP .bl')).toLowerCase().includes('hola sona'));
  check('el micrófono se apaga al terminar', await page.evaluate(() => !document.querySelector('#szBotP .bmic').classList.contains('on')));
  check('sin errores de JavaScript (micrófono)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* 3) celular, español e inglés */
for (const [lang, hello] of [['es', 'hola'], ['en', 'hello']]){
  const { page, errors, ctx } = await open(lang, { W:390, H:844, mobile:true });
  const pan = await box(page, '#szBotP'), bin = await box(page, '#szBotP .bin'), foot = await box(page, '#szBotP .bfoot'), st = await box(page, '#szBotP .bstage');
  check(lang + ' · celular: la ventanita sube desde abajo y ocupa casi todo el alto', await page.evaluate(() => document.querySelector('#szBotP').classList.contains('sheet')) && pan.h > 844 * .75 && pan.r <= 391 && pan.x >= -1, JSON.stringify(pan));
  check(lang + ' · celular: la píldora y los links no se salen', bin.r <= pan.r && bin.x >= pan.x && foot.b <= 845 && foot.r <= 391, JSON.stringify([bin, foot]));
  check(lang + ' · celular: la zona de toque de enviar y del micrófono son de 40 px o más', await page.evaluate(() => [...document.querySelectorAll('#szBotP .bs,#szBotP .bx')].every(b => b.getBoundingClientRect().width >= 36)));
  check(lang + ' · celular: ella cabe y se ve completa la cara', await page.evaluate(() => { const h = document.querySelector('#szBotP .bsc .syb-hsvg').getBoundingClientRect(), s = document.querySelector('#szBotP .bstage').getBoundingClientRect(); return h.top >= s.top && h.bottom <= s.bottom && h.width > 90; }));
  check(lang + ' · celular: la página no se corre de lado', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.fill('#szBotP .bin input', hello); await page.keyboard.press('Enter'); await page.waitForTimeout(3500);
  const lastBubble = await page.evaluate(() => { const L = [...document.querySelectorAll('#szBotP .bm.a')].pop(), r = L.getBoundingClientRect(), p = document.querySelector('#szBotP .bl').getBoundingClientRect(); return { inside:r.left >= p.left - 1 && r.right <= p.right + 1, txt:L.textContent.trim().length }; });
  check(lang + ' · celular: la respuesta cabe en su burbuja y tiene texto', lastBubble.inside && lastBubble.txt > 10, JSON.stringify(lastBubble));
  check(lang + ' · celular: sin errores de JavaScript', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* 4) estilos: Simple y sin animaciones no rompen la ventanita */
for (const cls of ['simple', 'noanim']){
  const { page, errors, ctx } = await open('es');
  await page.evaluate(c => document.documentElement.classList.add(c), cls); await page.waitForTimeout(300);
  const pan = await box(page, '#szBotP'), sc = await box(page, '#szBotP .bsc .szbody');
  check('«' + cls + '»: la ventanita sigue completa y ella a la vista', pan.w > 300 && sc.w > 100 && pan.b <= 800);
  if (cls === 'noanim') check('«noanim»: el fondo y las ondas del escenario no se mueven', await page.evaluate(() => ['.bs-bg', '.bs-l', '.bs-sp'].every(s => getComputedStyle(document.querySelector('#szBotP ' + s)).animationName === 'none')));
  check('«' + cls + '»: sin errores de JavaScript', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* 5) el acceso a Sona se ve en TODOS los estilos y tamaños (en Simple estaba escondido: «no hay cómo abrir a Sona») y el enlace #sona la abre */
for (const [name, opts] of [['PC', {}], ['celular', { W:390, H:844, mobile:true }], ['PC · estilo Simple', { ui:'simple' }], ['celular · estilo Simple', { W:390, H:844, mobile:true, ui:'simple' }]]){
  const { page, errors, ctx } = await open('es', { ...opts, hash:'#nada' });
  await page.evaluate(() => { const c = document.querySelector('#szBotP'); if (c) c.remove(); });
  await page.waitForTimeout(1500);
  const b = await page.evaluate(() => { const e = document.getElementById('szBot'); if (!e) return null; const cs = getComputedStyle(e), r = e.getBoundingClientRect(); return { show:cs.display !== 'none' && cs.visibility !== 'hidden', w:r.width, h:r.height, inside:r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; });
  check(name + ': el botón de Sona se ve en pantalla (visible, con tamaño y dentro)', !!b && b.show && b.w >= 36 && b.h >= 36 && b.inside, JSON.stringify(b));
  /* la bolita se corre cuando carga la letra del logo: esperar a que quede quieta antes de tocarla (en el CI, más lento, se movía) */
  await page.evaluate(async () => { try{ await document.fonts.ready; }catch(e){} let last = '', same = 0; for (let i = 0; i < 40 && same < 3; i++){ const r = document.getElementById('szBot').getBoundingClientRect(), k = [r.x, r.y, r.width].map(Math.round).join(); same = k === last ? same + 1 : 0; last = k; await new Promise(x => setTimeout(x, 250)); } });
  await page.click('#szBot'); await page.waitForTimeout(900);
  check(name + ': tocar el botón abre a Sona', await page.evaluate(() => { const p = document.querySelector('#szBotP'); return !!p && p.classList.contains('on'); }));
  if (opts.mobile){
    /* en el celular, tocar justo su ojo o su antenita también la abre (antes solo decía «¡Ay! Ese es mi ojo.» y parecía que no había cómo abrirla) */
    for (const [que, fx, fy] of [['el ojo', .40, .52], ['la antenita', .5, .12]]){
      await page.evaluate(() => document.querySelector('#szBotP .bx').click()); await page.waitForTimeout(700);
      const pt = await page.evaluate(([fx, fy]) => { const r = document.getElementById('szBot').getBoundingClientRect(); return { x:r.left + ((fx - .5) * .667 + .5) * r.width, y:r.top + ((fy - .5) * .667 + .5) * r.height }; }, [fx, fy]);
      await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(900);
      check(name + ': tocar ' + que + ' de Sona también abre el panel', await page.evaluate(() => { const p = document.querySelector('#szBotP'); return !!p && p.classList.contains('on'); }));
    }
  }
  check(name + ': sin errores de JavaScript', errors.length === 0, errors.join(' | '));
  await ctx.close();
}
{
  const { page, errors, ctx } = await open('es', { ui:'simple', hash:'?sona' });
  check('enlace chat.html?sona=1: abre a Sona sola (también en estilo Simple)', await page.evaluate(() => { const p = document.querySelector('#szBotP'); return !!p && p.classList.contains('on'); }));
  await page.evaluate(() => { sessionStorage.setItem('synthz:bothide', '1'); document.querySelector('#szBotP .bx').click(); location.hash = '#nada'; });
  await page.waitForTimeout(400); await page.evaluate(() => { location.hash = '#sona'; }); await page.waitForTimeout(1200);
  check('«#sona» puesto después la trae de vuelta aunque la hayas escondido en esta visita', await page.evaluate(() => { const p = document.querySelector('#szBotP'); return !!p && p.classList.contains('on') && sessionStorage.getItem('synthz:bothide') !== '1'; }));
  check('sin errores de JavaScript (enlace #sona)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

await browser.close(); server.close();
console.log(ok + ' bien, ' + fails + ' mal');
process.exit(fails ? 1 : 0);
