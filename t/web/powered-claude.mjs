/* v4.5 · «Powered by Claude» en la chispa de la esquina (pedido de Sammuel, 9-nov).
   Revisa en SynthFlow y Pulsem, en español e inglés, en computador y celular:
   al pasar el mouse (o tocar, o enfocar con el teclado) sale el letrerito, dice lo correcto, cabe en pantalla y se va.
   Uso: node cloudflare/preparar.mjs && node t/web/powered-claude.mjs [carpeta-capturas] */
import { start } from './servidor.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = process.argv[2] || '';
let fails = 0;
const check = (n, c, why) => { if (c) console.log('OK    ' + n); else { fails++; console.log('FALLO ' + n + (why ? ' — ' + String(why).slice(0, 200) : '')); } };
const s = await start({ reply:'Hola' });
const b = await chromium.launch();

async function page({ cel, en }){
  const p = await b.newPage({ viewport:{ width:cel ? 390 : 1280, height:cel ? 844 : 800 }, isMobile:!!cel, hasTouch:!!cel, deviceScaleFactor:cel ? 2 : 1 });
  await p.route(u => !u.href.startsWith(s.base), r => r.abort());
  await p.addInitScript(l => { try{ localStorage.setItem('synthz:lang', l); localStorage.setItem('synthz:visited', '1'); localStorage.setItem('synthz:portada', JSON.stringify({ v:'nuevo', t:1 })); localStorage.setItem('sz-alfa-visto', '1'); localStorage.setItem('synthz:tour', '1'); localStorage.setItem('synthz:blk', '1'); sessionStorage.setItem('synthz:intro', '1'); }catch(e){} }, en ? 'en' : 'es');
  /* sin internet, Puter no carga y SynthFlow muestra el aviso del bloqueador encima de todo: se quita para poder tocar la esquina */
  const sinAviso = () => p.evaluate(() => { const k = document.getElementById('blk'); if (k) k.remove(); });
  p.sinAviso = sinAviso;
  return p;
}
const visible = p => p.evaluate(() => { const e = document.getElementById('szPwr'); return !!e && e.classList.contains('on') && +getComputedStyle(e).opacity > .9; });
const texto = p => p.evaluate(() => (document.getElementById('szPwr') || {}).textContent || '');
const dentro = p => p.evaluate(() => { const r = document.getElementById('szPwr').getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; });

/* la portada nueva (React) no lleva esa chispa; solo SynthFlow y Pulsem */
for (const [pag, sel] of [['chat.html', '#corner'], ['pulsem.html', '#pCorner']]){
  for (const en of [false, true]){
    const quiero = en ? 'Powered by Claude' : 'Impulsado por Claude', n = pag + (en ? ' EN' : ' ES');
    /* computador: mouse */
    {
      const p = await page({ en });
      await p.goto(s.base + '/' + pag); await p.waitForTimeout(3200); await p.sinAviso();
      const c = p.locator(sel).first();
      check(n + ': la esquina existe', await c.count() === 1);
      check(n + ': se puede leer (rol y etiqueta)', await c.getAttribute('aria-label') === quiero && await c.getAttribute('role') === 'img', await c.getAttribute('aria-label'));
      check(n + ': no sale antes de pasar el mouse', !(await visible(p)));
      await c.hover(); await p.waitForTimeout(600);
      check(n + ': al pasar el mouse sale el letrerito', await visible(p));
      check(n + ': dice «' + quiero + '»', await texto(p) === quiero, await texto(p));
      check(n + ': cabe en la pantalla', await dentro(p));
      if (OUT && !en) await p.screenshot({ path:OUT + '/' + pag.replace('.html', '') + '-mouse-es.png', clip:{ x:880, y:660, width:400, height:140 } });
      if (OUT && en) await p.screenshot({ path:OUT + '/' + pag.replace('.html', '') + '-mouse-en.png', clip:{ x:880, y:660, width:400, height:140 } });
      await p.mouse.move(300, 300); await p.waitForTimeout(500);
      check(n + ': al quitar el mouse se va', !(await visible(p)));
      /* teclado */
      await p.focus(sel); await p.waitForTimeout(500);
      check(n + ': con el teclado también sale', await visible(p));
      await p.keyboard.press('Escape'); await p.waitForTimeout(400);
      check(n + ': Escape lo esconde', !(await visible(p)));
      /* cambio de idioma en vivo */
      await p.evaluate(l => { try{ localStorage.setItem('synthz:lang', l); }catch(e){} dispatchEvent(new StorageEvent('storage', { key:'synthz:lang', newValue:l })); }, en ? 'es' : 'en');
      await p.waitForTimeout(400);
      check(n + ': si cambias el idioma, cambia la etiqueta', await c.getAttribute('aria-label') === (en ? 'Impulsado por Claude' : 'Powered by Claude'), await c.getAttribute('aria-label'));
      await p.close();
    }
    /* celular: toque */
    {
      const p = await page({ cel:true, en });
      await p.goto(s.base + '/' + pag); await p.waitForTimeout(3200); await p.sinAviso();
      const vis = await p.locator(sel).first().isVisible();
      if (!vis){ console.log('--    ' + n + ' celular: la esquina no se ve en este estilo, se salta'); await p.close(); continue; }
      const box = await p.locator(sel).first().boundingBox();
      await p.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); await p.waitForTimeout(500);
      check(n + ' celular: un toque lo muestra', await visible(p));
      check(n + ' celular: dice «' + quiero + '»', await texto(p) === quiero, await texto(p));
      check(n + ' celular: cabe en la pantalla', await dentro(p));
      if (OUT) await p.screenshot({ path:OUT + '/' + pag.replace('.html', '') + '-cel-' + (en ? 'en' : 'es') + '.png', clip:{ x:140, y:704, width:250, height:140 } });
      await p.waitForTimeout(3300);
      check(n + ' celular: se va solo a los pocos segundos', !(await visible(p)));
      await p.close();
    }
  }
}
await b.close(); s.close();
console.log(fails ? '\n' + fails + ' FALLOS' : '\nTodo bien');
process.exit(fails ? 1 : 0);
