/* Pruebas de calidad de la portada (index.html) con Playwright, en 6 anchos de pantalla.
   Revisa lo que un usuario notaría: nada se sale de la pantalla, nada salta al cargar,
   SynthonIA nunca queda encima de un texto o un botón, botones de 24 px o más,
   imágenes con descripción, cero errores de JavaScript.
   Se corre desde la raíz del repo:  node t/portada/calidad.mjs
   Necesita el paquete playwright (sirve NODE_PATH apuntando a donde esté instalado).
   Cada prueba imprime OK o FALLO; el código de salida es 1 si alguna falla. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const WIDTHS = [[320, 640], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]];
const SECTIONS = ['como', 'modos', 'usos', 'comparar', 'conectar', 'chat', 'consumo', 'faq'];
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.webm':'video/webm', '.mp4':'video/mp4', '.webmanifest':'application/manifest+json' };
let fails = 0;
const ok = name => console.log('OK    ' + name);
const ko = (name, why) => { fails++; console.log('FALLO ' + name + ' — ' + String(why).slice(0, 1200)); };

/* servidor local: los archivos del repo tal cual; /api/* responde vacío (estas pruebas son de pantalla, no del servidor) */
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u.startsWith('/api/')){ res.writeHead(200, { 'content-type':'application/json' }); res.end('{}'); return; }
  const f = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type':TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

let chromium;
try{ ({ chromium } = createRequire(path.join(ROOT, 'package.json'))('playwright')); }
catch(e){ ko('playwright disponible', 'no se encontró el paquete playwright (instálalo o usa NODE_PATH)'); server.close(); process.exit(1); }
const browser = await chromium.launch();

/* lo que mide cada prueba, dentro de la página */
const PAGE_CHECKS = () => {
  const W = document.documentElement.clientWidth, out = {};
  const vis = e => { const s = getComputedStyle(e); return s.visibility !== 'hidden' && +s.opacity > .05 && e.getClientRects().length; };
  const shown = e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2)); if (y < 0 || y > innerHeight) return true; const h = document.elementFromPoint(x, y); return !!h; };
  out.overflowX = document.scrollingElement.scrollWidth - W;
  /* si algo se sale, quién es: los elementos que pasan el borde derecho (fuera de lo fijo, que no cuenta), para poder arreglar la causa */
  out.wide = out.overflowX > 1 ? [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); if (!r.width || r.right <= W + 1) return false; for (let p = e; p && p !== document.body; p = p.parentElement){ const c = getComputedStyle(p); if (c.position === 'fixed' || (p !== e && c.overflowX !== 'visible')) return false; } return true; })
    .map(e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : '') + ' [' + Math.round(r.left) + '→' + Math.round(r.right) + (c.transform !== 'none' ? ' ' + c.transform : '') + (e.getAnimations().length ? ' anim:' + e.getAnimations().map(a => a.animationName || a.id || 'waapi').join('+') : '') + ']'; }).slice(-6) : [];
  /* botones y enlaces sueltos de al menos 24 × 24 px (WCAG 2.5.8); los enlaces dentro de un texto no cuentan */
  out.small = [...document.querySelectorAll('main button, main a, nav button, nav a, footer a')].filter(e => vis(e) && !e.closest('p,li>span,details p')).filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.width < 24 || r.height < 24); }).map(e => (e.id || e.className || e.tagName) + ' «' + e.textContent.trim().slice(0, 20) + '»').slice(0, 5);
  out.noAlt = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).map(i => i.src.split('/').pop()).slice(0, 5);
  out.terms = [...document.querySelectorAll('.term')].filter(t => !t.dataset.def).length;
  /* SynthonIA (cuerpo entero) nunca encima de textos, botones, campos o tarjetas que no sean la suya */
  const content = [...document.querySelectorAll('main h1,main h2,main h3,main p,main a,main button,main input,main textarea,main summary,main .lqg,main .card,main .band,nav#nav')];
  out.botOver = [];
  document.querySelectorAll('.szbody').forEach(b => {
    if (!vis(b)) return; const host = b.closest('#heroBot,#readyFace,#szRoam,.hstage,div.ready') || b.parentElement;
    if (host.closest('[hidden]') || (host.id === 'szRoam' && !host.classList.contains('on'))) return;
    const R = b.getBoundingClientRect(), box = { l:R.left + R.width * .2, r:R.right - R.width * .2, t:R.top + R.height * .06, b:R.bottom - R.height * .06 };
    content.forEach(e => {
      if (e.contains(b) || host.contains(e) || !vis(e)) return;
      if (e.closest('details:not([open])') && !e.matches('summary')) return;   /* respuesta cerrada: no se ve */
      let r = e.getBoundingClientRect(); if (/^H[1-3]$|^P$/.test(e.tagName)){ const g = document.createRange(); g.selectNodeContents(e); r = g.getBoundingClientRect(); }
      if (e.matches('nav#nav')) return;   /* el menú es fijo: todo pasa por debajo al hacer scroll */
      const ix = Math.min(box.r, r.right) - Math.max(box.l, r.left), iy = Math.min(box.b, r.bottom) - Math.max(box.t, r.top);
      if (ix > 6 && iy > 6) out.botOver.push((host.id || host.className) + ' sobre ' + e.tagName + ' «' + e.textContent.trim().slice(0, 24) + '»');
    });
  });
  return out;
};

for (const [W, H] of WIDTHS){
  const page = await browser.newPage({ viewport:{ width:W, height:H }, hasTouch:W < 700, isMobile:W < 700 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(u => !u.href.startsWith(BASE), r => r.abort());   /* nada sale a internet */
  await page.addInitScript(() => {
    try{ localStorage.setItem('synthz:visited', '1'); localStorage.setItem('synthz:tour', '1'); sessionStorage.setItem('synthz:intro', '1'); }catch(e){}
    window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type:'layout-shift', buffered:true });
  });
  await page.goto(BASE + '/index.html'); await page.waitForTimeout(6500);
  const tag = '@' + W + ' ';
  const top = await page.evaluate(PAGE_CHECKS);
  const cls = await page.evaluate(() => window.__cls);
  cls <= 0.1 ? ok(tag + 'saltos al cargar (CLS ' + cls.toFixed(3) + ')') : ko(tag + 'saltos al cargar', 'CLS ' + cls.toFixed(3) + ' > 0,1');
  top.overflowX <= 1 ? ok(tag + 'nada se sale por los lados') : ko(tag + 'nada se sale por los lados', top.overflowX + ' px de más · ' + top.wide.join(' | '));
  await page.focus('#heroInp').then(() => ok(tag + 'cuadro «Pregúntale lo que sea»'), e => ko(tag + 'cuadro «Pregúntale lo que sea»', e.message));
  /* se recorre la página sección por sección, como alguien que baja leyendo */
  const over = new Set(top.botOver), small = new Set(top.small);
  for (const id of SECTIONS){
    const there = await page.evaluate(id => { const s = document.getElementById(id); if (!s) return false; scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight * .25); return true; }, id);
    if (!there){ ko(tag + 'sección ' + id, 'no existe'); continue; }
    await page.mouse.wheel(0, 1); await page.waitForTimeout(2300);
    const r = await page.evaluate(PAGE_CHECKS);
    r.botOver.forEach(x => over.add(id + ': ' + x)); r.small.forEach(x => small.add(x));
    if (r.overflowX > 1) ko(tag + 'nada se sale por los lados en ' + id, r.overflowX + ' px de más · ' + r.wide.join(' | '));
  }
  const ready = await page.evaluate(() => { const r = document.querySelector('div.ready'); if (r) r.scrollIntoView({ block:'center' }); return !!r; });
  if (ready){ await page.waitForTimeout(2000); (await page.evaluate(PAGE_CHECKS)).botOver.forEach(x => over.add('final: ' + x)); }
  over.size ? ko(tag + 'SynthonIA no tapa nada', [...over].slice(0, 4).join(' | ')) : ok(tag + 'SynthonIA no tapa nada');
  small.size ? ko(tag + 'botones de 24 px o más', [...small].join(' | ')) : ok(tag + 'botones de 24 px o más');
  top.noAlt.length ? ko(tag + 'imágenes con descripción', top.noAlt.join(', ')) : ok(tag + 'imágenes con descripción');
  top.terms ? ko(tag + 'nombres propios explicados', top.terms + ' sin explicación') : ok(tag + 'nombres propios explicados');
  errors.length ? ko(tag + 'cero errores de JavaScript', errors.join(' | ')) : ok(tag + 'cero errores de JavaScript');
  await page.close();
}
await browser.close(); server.close();
console.log(fails ? '\n' + fails + ' prueba(s) fallaron.' : '\nTodo bien.');
process.exit(fails ? 1 : 0);
