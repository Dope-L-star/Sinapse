/* Prueba de humo de SynthZ: lo mínimo que tiene que funcionar antes de pasar algo a main.
   · El servidor: sin variables de Vercel, nadie puede reclamar las cuentas del equipo ni sale ningún correo.
   · Las páginas (portada, SynthFlow, términos, privacidad, Pulsem) abren sin errores de JavaScript, a 390 y 1280 px.
   · Compartir: canonical, og:image y twitter:card; robots.txt y sitemap.xml; Pulsem no se indexa.
   · Accesibilidad: Animaciones apagadas en Ajustes apaga todo (el sistema ya no manda); el teclado ve el foco.
   Se corre desde la raíz del repo:  node t/humo/humo.mjs           (los archivos del repo)
                                      node t/humo/humo.mjs dist      (lo que publica Vercel, después de «node build.mjs --dist»)
   Necesita el paquete playwright (sirve NODE_PATH apuntando a donde esté instalado).
   Cada prueba imprime OK o FALLO; el código de salida es 1 si alguna falla. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROOT = path.resolve(REPO, process.argv[2] || '.');
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2', '.txt':'text/plain', '.xml':'application/xml', '.webmanifest':'application/manifest+json' };
let fails = 0;
const ok = name => console.log('OK    ' + name);
const ko = (name, why) => { fails++; console.log('FALLO ' + name + ' — ' + String(why).slice(0, 400)); };
const check = (name, cond, why) => cond ? ok(name) : ko(name, why || 'no se cumple');

/* ---------- servidor (api/_lib.js), sin variables de entorno ---------- */
delete process.env.SYNTHZ_SETUP_CODE;
const lib = await import(path.join(REPO, 'api/_lib.js'));
check('sin SYNTHZ_SETUP_CODE no se acepta ningún código', !lib.setupOk('A'.repeat(24)) && !lib.setupOk(''));
check('ningún correo da rango (ya no existe EMAIL_ROLES)', !('EMAIL_ROLES' in lib) && !('emailRole' in lib));
const libSrc = fs.readFileSync(path.join(REPO, 'api/_lib.js'), 'utf8');
check('api/_lib.js no trae correos ni huellas escritas', !/@gmail\.com|SETUP_HASH/.test(libSrc));

/* ---------- archivos para buscadores ---------- */
const read = f => { try{ return fs.readFileSync(path.join(ROOT, f), 'utf8'); }catch(e){ return ''; } };
check('robots.txt con sitemap y sin /api', /Sitemap:\s*https:\/\//.test(read('robots.txt')) && /Disallow: \/api\//.test(read('robots.txt')));
check('sitemap.xml con la portada y SynthFlow', /<loc>[^<]+\/<\/loc>/.test(read('sitemap.xml')) && /\/chat(\.html)?<\/loc>/.test(read('sitemap.xml')));
check('imagen para compartir existe', fs.existsSync(path.join(ROOT, 'media/og-symphoria.jpg')));
if (process.argv[2]) check('dist/ no publica piezas, pruebas ni notas', !['src', 't', 'api', 'INFORME.md', 'build.mjs', 'package.json'].some(f => fs.existsSync(path.join(ROOT, f))));

/* ---------- páginas en el navegador ---------- */
/* las mismas reglas de seguridad (CSP) que pone Vercel según vercel.json: la de la página y la de /sintetico.html */
const VJ = JSON.parse(fs.readFileSync(path.join(REPO, 'vercel.json'), 'utf8'));
const cspOf = src => ((VJ.headers.find(h => h.source === src) || { headers:[] }).headers.find(h => h.key === 'Content-Security-Policy') || {}).value || '';
const CSP_PAGE = cspOf('/((?!sintetico\\.html$).*)').replace(/;\s*upgrade-insecure-requests/, ''), CSP_SYN = cspOf('/sintetico.html');
check('vercel.json trae la CSP de la página y la de los Sintéticos', /script-src/.test(CSP_PAGE) && /frame-ancestors 'self'/.test(CSP_SYN));
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u.startsWith('/api/')){ res.writeHead(200, { 'content-type':'application/json' }); res.end('{}'); return; }
  const f = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type':TYPES[path.extname(f)] || 'application/octet-stream', 'content-security-policy':u === '/sintetico.html' ? CSP_SYN : CSP_PAGE }); fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

let chromium;
try{ ({ chromium } = createRequire(path.join(REPO, 'package.json'))('playwright')); }
catch(e){ ko('playwright disponible', 'no se encontró el paquete playwright (instálalo o usa NODE_PATH)'); server.close(); process.exit(1); }
const browser = await chromium.launch();

async function open(file, W, opts = {}){
  const page = await browser.newPage(Object.assign({ viewport:{ width:W, height:W < 700 ? 844 : 800 }, hasTouch:W < 700, isMobile:W < 700, deviceScaleFactor:W < 700 ? 3 : 1 }, opts));
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(u => !u.href.startsWith(BASE), r => r.abort());   /* nada sale a internet (Puter, fuentes, Google) */
  await page.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + (e.blockedURI || ''))); });
  await page.addInitScript(() => { try{ localStorage.setItem('synthz:visited', '1'); localStorage.setItem('synthz:tour', '1'); localStorage.setItem('synthz:portada', JSON.stringify({ v:'nuevo', t:1 }));  /* v4.1: quien ya entró no ve la portada salvo que elija «Soy nuevo» */ sessionStorage.setItem('synthz:intro', '1'); }catch(e){} });
  await page.goto(BASE + '/' + file); await page.waitForTimeout(3500);
  return { page, errors };
}
const PAGES = [['index.html', true], ['chat.html', true], ['terminos.html', true], ['privacidad.html', true], ['pulsem.html', false]];
for (const W of [390, 1280]){
  for (const [file, pub] of PAGES){
    const tag = '@' + W + ' ' + file;
    try{
      const { page, errors } = await open(file, W);
      check(tag + ' abre sin errores de JavaScript', !errors.length, errors.join(' | '));
      const csp = await page.evaluate(() => window.__csp);
      check(tag + ' la CSP no bloquea nada de la página', !csp.length, csp.join(' | '));
      const m = await page.evaluate(() => {
        const q = s => { const e = document.querySelector(s); return e ? (e.getAttribute('content') || e.getAttribute('href') || '') : ''; };
        return { title:document.title, desc:q('meta[name=description]'), canon:q('link[rel=canonical]'), img:q('meta[property="og:image"]'), card:q('meta[name="twitter:card"]'), robots:q('meta[name=robots]'),
                 wide:document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      check(tag + ' tiene título y descripción', m.title && m.desc, JSON.stringify(m));
      if (pub) check(tag + ' se ve bien al compartir (canonical, og:image, twitter:card)', /^https:\/\//.test(m.canon) && /^https:\/\/.+og-symphoria\.jpg$/.test(m.img) && m.card === 'summary_large_image', JSON.stringify(m));
      else check(tag + ' no se indexa', /noindex/.test(m.robots), m.robots);
      if (file !== 'pulsem.html') check(tag + ' nada se sale por los lados', m.wide <= 1, 'sobran ' + m.wide + ' px');
      if (file === 'chat.html'){
        const typed = await page.evaluate(() => { const i = document.getElementById('inp'); if (!i) return ''; i.focus(); i.value = 'Hola, prueba de humo'; i.dispatchEvent(new Event('input', { bubbles:true })); return i.value; });
        check(tag + ' la caja de escribir acepta texto', typed === 'Hola, prueba de humo', 'sin #inp');
      }
      await page.close();
    }catch(e){ ko(tag, e.message); }
  }
}

/* Sintéticos: lo que crea la IA corre en /sintetico.html, con sus propias reglas, aunque la página tenga CSP */
try{
  const { page, errors } = await open('chat.html', 1280);
  const r = await page.evaluate(() => new Promise(res => {
    const html = '<!doctype html><style>b{color:red}</style><b id=x>hola</b><script>parent.postMessage({ szt:eval("1+1"), red:getComputedStyle(document.getElementById("x")).color }, "*")<\/script>';
    const f = document.createElement('iframe'); f.setAttribute('sandbox', 'allow-scripts'); document.body.appendChild(f);
    const t = setTimeout(() => res({ timeout:true }), 5000);
    addEventListener('message', e => {
      if (e.source !== f.contentWindow || !e.data) return;
      if (e.data.szs === 'ready') f.contentWindow.postMessage({ szs:'doc', html }, '*');
      if ('szt' in e.data){ clearTimeout(t); res(e.data); }
    });
    f.src = '/sintetico.html?k=humo';
  }));
  check('un Sintético corre su propio código (scripts, eval y estilos) con la CSP puesta', r.szt === 2 && /255, 0, 0/.test(r.red || ''), JSON.stringify(r) + ' ' + errors.join(' | '));
  const top = await page.evaluate(async () => { const r = await fetch('/sintetico.html'); return r.headers.get('content-security-policy') || ''; });
  check('/sintetico.html va aislado aunque lo abran solo (sandbox en su CSP)', /sandbox allow-scripts/.test(top) && !/allow-same-origin/.test(top), top);
  await page.close();
}catch(e){ ko('Sintéticos', e.message); }

/* idioma: SynthFlow en inglés (idioma-en.json) y de vuelta a español, sin errores */
try{
  const { page, errors } = await open('chat.html', 1280);
  await page.evaluate(() => SZ.setLang('en')); await page.waitForTimeout(1500);
  const en = await page.evaluate(() => ({ nc:document.getElementById('cNew').textContent.trim(), ph:document.getElementById('inp').placeholder, lang:document.documentElement.lang }));
  check('SynthFlow se pasa a inglés (botones y caja de escribir)', en.nc === 'New chat' && !/[áéíóúñ]|Escribe|Conecta/.test(en.ph) && en.lang === 'en', JSON.stringify(en) + ' ' + errors.join(' | '));
  await page.evaluate(() => SZ.setLang('es')); await page.waitForTimeout(800);
  const es = await page.evaluate(() => document.getElementById('cNew').textContent.trim());
  check('y vuelve a español igual que antes', es === 'Nuevo chat' && !errors.length, es + ' ' + errors.join(' | '));
  await page.close();
}catch(e){ ko('idioma', e.message); }

/* accesibilidad: las preferencias del sistema y el teclado */
try{
  /* v3.1: manda Ajustes, no el sistema (Windows con sus efectos apagados pide «reducir movimiento» y dejaba la página sin animaciones) */
  const sys = await open('chat.html', 1280, { reducedMotion:'reduce' });
  check('«reducir movimiento» del sistema ya no apaga las animaciones', await sys.page.evaluate(() => !document.documentElement.classList.contains('noanim') && window.SZ && SZ.reduce === false), sys.errors.join(' | '));
  await sys.page.close();
  const off = await open('index.html', 1280);
  await off.page.evaluate(() => { localStorage.setItem('synthz:cfg', JSON.stringify({ v:2, perf:'visual', cursor:true, smooth:true, favAnim:true, bg:true, glass:true, anim:false })); });
  await off.page.reload(); await off.page.waitForTimeout(2500);
  check('Animaciones apagadas en Ajustes: la página no se mueve', await off.page.evaluate(() => document.documentElement.classList.contains('noanim') && SZ.reduce === true && document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.getTiming().duration > 50).length === 0), off.errors.join(' | '));
  await off.page.close();
  const { page, errors } = await open('chat.html', 1280);
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return 'nada enfocado'; const s = getComputedStyle(a); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 || s.boxShadow !== 'none' ? '' : (a.tagName + '.' + a.className + ' sin anillo'); });
  check('con el teclado se ve dónde está el foco', !ring, ring);
  await page.close();
}catch(e){ ko('accesibilidad', e.message); }

await browser.close(); server.close();
console.log(fails ? '\n' + fails + ' prueba(s) fallaron.' : '\nTodo bien.');
process.exit(fails ? 1 : 0);
