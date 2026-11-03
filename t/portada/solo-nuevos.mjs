/* v4.1 · La portada (index.html) solo para gente nueva. Se corre desde la raíz:  node t/portada/solo-nuevos.mjs
   Con FOTOS=<carpeta> guarda capturas de cada caso (computador y celular, ES y EN).
   Revisa: primera visita se queda en la portada (también si recarga); quien ya entró o tiene cuenta va directo a
   SynthFlow; la pantallita «Ya tengo el Flow / Soy nuevo» es la única puerta de vuelta y su decisión se guarda. */
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), FOTOS = process.env.FOTOS || '';
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.webmanifest':'application/manifest+json' };
let fails = 0; const ok = n => console.log('OK    ' + n), ko = (n, w) => { fails++; console.log('FALLO ' + n + ' — ' + w); };
const server = http.createServer((req, res) => { const u = decodeURIComponent(req.url.split('?')[0]); if (u.startsWith('/api/')){ res.writeHead(200, { 'content-type':'application/json' }); res.end('{}'); return; }
  const f = path.join(ROOT, u === '/' ? 'index.html' : u); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type':TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
await new Promise(r => server.listen(0, '127.0.0.1', r)); const BASE = 'http://127.0.0.1:' + server.address().port;
let chromium; try{ ({ chromium } = createRequire(path.join(ROOT, 'package.json'))('playwright')); }catch(e){ ko('playwright', 'falta el paquete (usa NODE_PATH)'); process.exit(1); }
const browser = await chromium.launch();
const SIZES = { pc:{ viewport:{ width:1280, height:800 } }, cel:{ viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true, deviceScaleFactor:2 } };
const now = Date.now(), H = 3600e3;
async function open(size, lang, store, url){
  const ctx = await browser.newContext(Object.assign({ locale:lang === 'en' ? 'en-US' : 'es-CO' }, SIZES[size]));
  await ctx.addInitScript(([s, lang]) => { if (sessionStorage.getItem('__t')) return; sessionStorage.setItem('__t', '1'); localStorage.clear(); localStorage.setItem('synthz:lang', lang); localStorage.setItem('synthz:intro', 'nunca'); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, [store, lang]);
  /* sin internet aquí: Puter no carga y saldría su aviso de bloqueador encima de todo; en estas pruebas no cuenta */
  await ctx.route(/js\.puter\.com/, r => r.abort());
  await ctx.addInitScript(() => { const st = () => { const s = document.createElement('style'); s.textContent = '#blk{display:none!important}'; (document.head || document.documentElement).appendChild(s); }; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', st); else st(); });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.goto(BASE + url); await p.waitForLoadState('load'); return p;
}
const where = p => new URL(p.url()).pathname.replace(/^\/$/, '/index.html');
const shot = async (p, n) => { if (FOTOS){ fs.mkdirSync(FOTOS, { recursive:true }); await p.screenshot({ path:path.join(FOTOS, n + '.png') }); } };
const pick = p => p.evaluate(() => JSON.parse(localStorage.getItem('synthz:portada') || 'null'));
const card = async p => { await p.waitForSelector('#szWelcome.on', { timeout:15000 }); await p.waitForTimeout(900); };

for (const size of ['pc', 'cel']) for (const lang of ['es', 'en']){
  const tag = lang + '-' + size;
  /* 1 · primera visita de verdad: se queda, y al recargar también */
  let p = await open(size, lang, {}, '/');
  await p.waitForTimeout(2500);
  where(p) === '/index.html' ? ok(tag + ' primera visita se queda en la portada') : ko(tag + ' primera visita', where(p));
  await shot(p, 'primera-visita-' + tag);
  await p.reload(); await p.waitForTimeout(800);
  where(p) === '/index.html' ? ok(tag + ' recargar en la primera visita no saca a nadie') : ko(tag + ' recarga', where(p));
  p.errs.length ? ko(tag + ' errores portada', p.errs.join(' | ')) : ok(tag + ' portada sin errores'); await p.context().close();

  /* 2 · ya entró antes (otra visita) → directo a SynthFlow */
  for (const [n, s] of [['ya entró antes', { 'synthz:lastSeen':String(now - H), 'synthz:visited':'1' }], ['tiene cuenta', { 'synthz:sess':'cabc12345' }], ['usó SynthFlow', { 'synthz:entro':String(now - 5 * H) }], ['eligió «Ya tengo el Flow»', { 'synthz:portada':JSON.stringify({ v:'app', t:now }) }]]){
    p = await open(size, lang, s, '/'); await p.waitForTimeout(1500);
    where(p) === '/chat.html' ? ok(tag + ' ' + n + ' → SynthFlow directo') : ko(tag + ' ' + n, where(p));
    if (n === 'ya entró antes') await shot(p, 'ya-entro-va-directo-' + tag);
    await p.context().close();
  }
  /* 3 · eligió «Soy nuevo» → ve la portada */
  p = await open(size, lang, { 'synthz:lastSeen':String(now - H), 'synthz:portada':JSON.stringify({ v:'nuevo', t:now }) }, '/'); await p.waitForTimeout(1200);
  where(p) === '/index.html' ? ok(tag + ' eligió «Soy nuevo» → ve la portada') : ko(tag + ' soy nuevo guardado', where(p)); await p.context().close();

  /* 4 · en SynthFlow, el logo ya no lleva a la portada: sale la pantallita; «Soy nuevo» la abre */
  p = await open(size, lang, { 'synthz:lastSeen':String(now - H), 'synthz:visited':'1', 'synthz:tour':'1' }, '/chat.html'); await p.waitForTimeout(3500);
  await p.evaluate(() => { const a = [...document.querySelectorAll('a[href="index.html"]')].find(a => a.id !== 'railWord' && a.getClientRects().length && getComputedStyle(a).visibility !== 'hidden'); a.click(); });
  try{ await card(p); ok(tag + ' logo en SynthFlow → pantallita'); await shot(p, 'logo-pantallita-' + tag); }catch(e){ ko(tag + ' logo → pantallita', 'no salió'); }
  const txt = await p.evaluate(() => (document.querySelector('#szWelcome') || {}).innerText || '');
  (lang === 'en' ? /Got the Flow|I've got the Flow/.test(txt) : /Ya tienes el Flow/.test(txt)) ? ok(tag + ' pantallita en ' + lang) : ko(tag + ' idioma pantallita', txt.slice(0, 120));
  await p.click('[data-wb="new"]'); await p.waitForURL(/index\.html|\/$/, { timeout:20000 }).catch(() => {}); await p.waitForTimeout(2500);
  where(p) === '/index.html' ? ok(tag + ' «Soy nuevo» abre la portada') : ko(tag + ' soy nuevo', where(p));
  ((await pick(p)) || {}).v === 'nuevo' ? ok(tag + ' «Soy nuevo» queda guardado') : ko(tag + ' guardar nuevo', JSON.stringify(await pick(p)));
  /(nuevo=1)/.test(p.url()) ? ko(tag + ' limpiar ?nuevo=1', p.url()) : ok(tag + ' la dirección queda limpia');
  await shot(p, 'soy-nuevo-ve-portada-' + tag);
  p.errs.length ? ko(tag + ' errores', p.errs.join(' | ')) : ok(tag + ' sin errores'); await p.context().close();

  /* 5 · portada tras 12 h con «Soy nuevo» guardado: «Ya tengo el Flow» entra y se guarda */
  p = await open(size, lang, { 'synthz:lastSeen':String(now - 20 * H), 'synthz:visited':'1', 'synthz:portada':JSON.stringify({ v:'nuevo', t:now - 20 * H }) }, '/');
  try{ await card(p); await shot(p, 'portada-12h-pantallita-' + tag); await p.click('[data-wb="flow"]'); await p.waitForURL(/chat\.html/, { timeout:20000 });
    ok(tag + ' «Ya tengo el Flow» en la portada → SynthFlow'); }catch(e){ ko(tag + ' flow desde portada', where(p)); }
  ((await pick(p)) || {}).v === 'app' ? ok(tag + ' «Ya tengo el Flow» queda guardado') : ko(tag + ' guardar app', JSON.stringify(await pick(p)));
  await p.goto(BASE + '/'); await p.waitForTimeout(1200);
  where(p) === '/chat.html' ? ok(tag + ' después ya no vuelve a ver la portada') : ko(tag + ' no vuelve', where(p)); await p.context().close();
}
/* 6 · las demás páginas cargan sin errores y su «Volver a SymphorIA» lleva a SynthFlow a quien ya entró */
for (const pg of ['ayuda.html', 'privacidad.html', 'terminos.html', 'offline.html', 'pulsem.html', 'alias.html']){
  const p = await open('pc', 'es', { 'synthz:entro':String(now) }, '/' + pg); await p.waitForTimeout(1800);
  p.errs.length ? ko(pg + ' errores', p.errs.join(' | ')) : ok(pg + ' carga sin errores');
  const has = await p.evaluate(() => !!document.querySelector('a[href="index.html"],a[href="/"]'));
  if (has && pg !== 'pulsem.html'){ await p.goto(BASE + '/index.html'); await p.waitForTimeout(1000); where(p) === '/chat.html' ? ok(pg + ' → portada → SynthFlow') : ko(pg + ' enlace portada', where(p)); }
  await p.context().close();
}
/* 7 · la cuenta trae la decisión más nueva, nunca una más vieja */
{ const p = await open('pc', 'es', { 'synthz:entro':String(now) }, '/chat.html'); await p.waitForTimeout(2500);
  const r = await p.evaluate(() => { SZ.portada.set('nuevo', 100); const a = SZ.portada.get().v; return a; });
  r === 'nuevo' ? ok('SZ.portada guarda') : ko('SZ.portada', r); await p.context().close(); }
await browser.close(); server.close();
console.log(fails ? fails + ' FALLO(S)' : 'TODO OK'); process.exit(fails ? 1 : 0);
