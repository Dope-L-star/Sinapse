/* Prueba y capturas de DESPUÉS: pedir una web de varios archivos (IA simulada, pipeline real de SynthFlow) y verla funcionando.
   Uso: node t/web/despues.mjs <carpeta-capturas>   (antes: node cloudflare/preparar.mjs) */
import { start } from './servidor.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = process.argv[2] || '/tmp';
let fails = 0;
const check = (n, c, why) => { if (c) console.log('OK    ' + n); else { fails++; console.log('FALLO ' + n + ' — ' + String(why || '').slice(0, 300)); } };
const s = await start();
const b = await chromium.launch();
async function go(W, o = {}){
  const mob = W < 700;
  const p = await b.newPage({ viewport:{ width:W, height:mob ? 844 : 800 }, locale:o.en ? 'en-US' : 'es-CO', isMobile:mob, hasTouch:mob, deviceScaleFactor:mob ? 2 : 1, acceptDownloads:true });
  p._errs = []; p.on('pageerror', e => p._errs.push(e.message));
  await p.route(u => !u.href.startsWith(s.base), r => r.abort());
  await p.addInitScript(cfg => { try{ localStorage.setItem('synthz:visited', '1'); localStorage.setItem('synthz:tour', '1'); sessionStorage.setItem('synthz:intro', '1'); if (cfg) localStorage.setItem('synthz:cfg', JSON.stringify(cfg)); }catch(e){} window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI)); }, o.cfg || null);
  await p.goto(s.base + '/chat.html'); await p.waitForTimeout(4000);
  await p.click('#blk .lnk').catch(() => {}); await p.waitForTimeout(500);
  await p.fill('#inp', o.en ? 'Make me a complete bakery website with several pages, in separate files (html, css and js).' : 'Hazme una página web completa para una panadería, con varias páginas, en archivos separados (html, css y js).');
  if (mob) await p.evaluate(() => document.getElementById('sendBtn').click()); else await p.press('#inp', 'Enter');
  await p.waitForSelector('.wproj', { timeout:20000 }).catch(() => {});
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const b = document.getElementById('blk'); if (b) b.remove(); document.querySelectorAll('.szgt, .gt-pop, .discover, [class*="descubr"]').forEach(x => x.remove()); });
  return p;
}
const frameOf = p => p.frames().find(f => f.url().includes('sintetico') && f.parentFrame() === p.mainFrame());
const styled = async p => { const f = frameOf(p); return f ? f.evaluate(() => getComputedStyle(document.body).backgroundColor + '|' + (document.querySelector('.top') ? getComputedStyle(document.querySelector('.top')).display : '')) : 'sin iframe'; };

/* computador */
const pc = await go(1280);
check('la respuesta trae UNA tarjeta «Página web» con los 4 archivos', await pc.evaluate(() => document.querySelectorAll('.wproj').length === 1 && document.querySelectorAll('.wproj .fcard').length === 4), await pc.evaluate(() => document.querySelector('#lane').innerText.slice(0, 300)));
check('la ventana «Ver funcionando» se abrió sola', await pc.evaluate(() => !!document.querySelector('.wv.on')));
const st = await styled(pc);
check('la página carga su CSS (css/estilos.css): fondo crema y menú en fila', /255, 247, 237/.test(st) && /flex/.test(st), st);
await pc.screenshot({ path:OUT + '/1-pc-ver-funcionando.png' });
/* el botón de la página hace lo suyo (js/app.js) */
await frameOf(pc).click('#pedir'); await pc.waitForTimeout(300);
check('el JS de la página funciona (js/app.js)', await frameOf(pc).evaluate(() => !document.getElementById('aviso').hidden));
/* navegar a Nosotros dentro de la vista previa */
await frameOf(pc).click('nav >> text=Nosotros'); await pc.waitForTimeout(1800);
const h1 = await frameOf(pc).evaluate(() => document.querySelector('h1').textContent + '|' + getComputedStyle(document.body).backgroundColor);
check('el enlace «Nosotros» navega dentro de la vista previa, con estilos', /Nuestra historia/.test(h1) && /255, 247, 237/.test(h1), h1);
check('la barra muestra nosotros.html y «Atrás» se activa', await pc.evaluate(() => document.querySelector('.wv-addr select').value === 'nosotros.html' && !document.querySelector('.wv-bar .wv-b').disabled));
await pc.screenshot({ path:OUT + '/2-pc-navega-a-nosotros.png' });
await frameOf(pc).click('text=Ver el menú'); await pc.waitForTimeout(1800);
check('«Ver el menú» vuelve a index.html#menu', await frameOf(pc).evaluate(() => !!document.getElementById('menu') && scrollY > 100));
/* pestaña Código */
await pc.click('.wv-tabs [role=tab]:nth-child(2)'); await pc.waitForTimeout(400);
await pc.click('.wv-files button:has-text("css/estilos.css")');
check('pestañas de archivos en «Código»', await pc.evaluate(() => document.querySelectorAll('.wv-files button').length === 4 && /--acento/.test(document.querySelector('.wv-pre').textContent) && !!document.querySelector('.wv-pre .hf, .wv-pre .hn')));
await pc.screenshot({ path:OUT + '/3-pc-codigo-pestanas.png' });
/* zip */
const [dl] = await Promise.all([pc.waitForEvent('download', { timeout:5000 }).catch(() => null), pc.click('.wv-h .wv-b:not(.ic)')]);
if (dl){ const fpath = OUT + '/panaderia-aurora.zip'; await dl.saveAs(fpath); check('descarga .zip con carpetas: ' + dl.suggestedFilename(), /\.zip$/.test(dl.suggestedFilename())); } else check('descarga .zip', false, 'no hubo descarga');
/* pantalla completa */
await pc.click('.wv-tabs [role=tab]:nth-child(1)'); await pc.waitForTimeout(1200);
await pc.click('.wv-h .wv-b.ic[aria-pressed]'); await pc.waitForTimeout(700);
check('pantalla completa ocupa todo el ancho', await pc.evaluate(() => Math.round(document.querySelector('.wv-in').getBoundingClientRect().width) >= 1270));
await pc.screenshot({ path:OUT + '/4-pc-pantalla-completa.png' });
/* el tamaño celular dentro de la vista */
await pc.click('.wv-sz button:nth-child(3)'); await pc.waitForTimeout(800);
await pc.screenshot({ path:OUT + '/5-pc-tamano-celular.png' });
await pc.keyboard.press('Escape'); await pc.keyboard.press('Escape'); await pc.waitForTimeout(600);
check('Escape sale de pantalla completa y luego cierra', await pc.evaluate(() => !document.querySelector('.wv')));
await pc.screenshot({ path:OUT + '/6-pc-tarjeta-pagina-web.png' });
/* seguridad: la vista previa no ve la sesión de SynthFlow */
const iso = await pc.evaluate(() => new Promise(res => {
  const P = document.querySelector('.wproj')._web;
  const f = document.createElement('iframe'); f.setAttribute('sandbox', 'allow-scripts'); document.body.appendChild(f);
  const id = 'iso'; const t = setTimeout(() => res('timeout'), 5000);
  addEventListener('message', e => { if (e.source === f.contentWindow && e.data && e.data.iso) { clearTimeout(t); res(e.data.iso); f.remove(); } });
  const P2 = { ...P, files:P.files.map(x => x.path === 'js/app.js' ? { ...x, text:'var r=[];try{localStorage.length;r.push("ls")}catch(e){}try{document.cookie;r.push("ck"+document.cookie.length)}catch(e){}try{parent.document;r.push("parent")}catch(e){}parent.postMessage({iso:r.join(",")||"aislado"},"*")' } : x) };
  SZFlow.web.load(f, SZFlow.web.doc(P2, 'index.html', {}));
}));
check('la vista previa no ve tu sesión (ni localStorage, ni cookies, ni la página de SynthFlow)', iso === 'aislado', iso);
/* Sintéticos */
await pc.evaluate(() => SZFlow.synthetics()); await pc.waitForTimeout(800);
check('en Sintéticos sale como una sola «Página web · 4 archivos»', await pc.evaluate(() => [...document.querySelectorAll('.syn-w.web')].length === 1 && /4 archivos/.test(document.querySelector('.syn-w.web').textContent)));
await pc.screenshot({ path:OUT + '/7-pc-sinteticos.png' });
await pc.click('.syn-w.web .syn-c'); await pc.waitForTimeout(2200);
check('tocarlo en Sintéticos la abre funcionando', /255, 247, 237/.test(await styled(pc)));
await pc.screenshot({ path:OUT + '/8-pc-sinteticos-abierta.png' });
check('sin errores de JavaScript ni de CSP en SynthFlow (computador)', !pc._errs.length && !(await pc.evaluate(() => window.__csp.length)), pc._errs.join(' | ') + ' ' + (await pc.evaluate(() => window.__csp.join(' | '))));

/* celular */
const cel = await go(390);
await cel.screenshot({ path:OUT + '/9-celular-tarjeta.png' });
await cel.click('.wproj .wp-b.go'); await cel.waitForTimeout(2500);
check('celular: la vista ocupa toda la pantalla y carga con estilos', (await cel.evaluate(() => Math.round(document.querySelector('.wv-in').getBoundingClientRect().width))) === 390 && /255, 247, 237/.test(await styled(cel)));
await cel.screenshot({ path:OUT + '/10-celular-ver-funcionando.png' });
await frameOf(cel).tap('nav >> text=Nosotros'); await cel.waitForTimeout(1800);
check('celular: tocar «Nosotros» navega', /Nuestra historia/.test(await frameOf(cel).evaluate(() => document.querySelector('h1').textContent)));
await cel.screenshot({ path:OUT + '/11-celular-nosotros.png' });
check('celular: nada se sale por los lados', await cel.evaluate(() => document.documentElement.scrollWidth <= 391));
check('sin errores de JavaScript (celular)', !cel._errs.length, cel._errs.join(' | '));

/* inglés */
const en = await go(1280, { en:true });
check('en inglés: tarjeta y ventana en inglés', await en.evaluate(() => /See it working/.test(document.querySelector('.wproj').textContent) && /Preview/.test(document.querySelector('.wv-tabs').textContent)));
await en.screenshot({ path:OUT + '/12-ingles.png' });

/* Simple y sin animaciones */
const sim = await go(1280, { cfg:{ v:2, perf:'visual', cursor:true, smooth:true, favAnim:true, bg:true, glass:true, anim:false, ui:'simple' } });
await sim.evaluate(() => [...document.body.children].filter(e => /Ya puedes chatear gratis/.test(e.textContent) && !e.querySelector('.wv') && !e.classList.contains('wv')).forEach(x => x.remove()));
await sim.screenshot({ path:OUT + '/13-simple-sin-animaciones.png' });
check('Simple/sin animaciones: abre igual', /255, 247, 237/.test(await styled(sim)) && await sim.evaluate(() => document.documentElement.classList.contains('simple') && document.documentElement.classList.contains('noanim')));

await b.close(); s.close();
console.log(fails ? fails + ' FALLAS' : 'TODO OK');
process.exit(fails ? 1 : 0);
