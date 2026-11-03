/* Capturas de ANTES: SynthFlow tal como está, pidiendo una web de varios archivos (IA simulada) */
import { start } from './servidor.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = process.argv[2];
const s = await start();
const b = await chromium.launch();
async function go(W){
  const mob = W < 700;
  const p = await b.newPage({ viewport:{ width:W, height:mob ? 844 : 800 }, locale:'es-CO', isMobile:mob, hasTouch:mob, deviceScaleFactor:mob ? 2 : 1 });
  await p.route(u => !u.href.startsWith(s.base), r => r.abort());
  await p.addInitScript(() => { try{ localStorage.setItem('synthz:visited', '1'); localStorage.setItem('synthz:tour', '1'); sessionStorage.setItem('synthz:intro', '1'); }catch(e){} });
  await p.goto(s.base + '/chat.html'); await p.waitForTimeout(4000);
  await p.click('#blk .lnk').catch(() => {}); await p.waitForTimeout(600);
  await p.fill('#inp', 'Hazme una página web completa para una panadería, con varias páginas, en archivos separados (html, css y js).');
  await p.press('#inp', 'Enter');
  await p.waitForTimeout(12000);
  await p.evaluate(() => { const b = document.getElementById('blk'); if (b) b.remove(); });
  return p;
}
const pc = await go(1280);
await pc.screenshot({ path:OUT + '/1-pc-respuesta-y-vista.png' });
/* abrir la vista previa de index.html (el que la persona tocaría primero) */
await pc.evaluate(() => { const c = [...document.querySelectorAll('.fcard')].find(c => /index\.html/.test(c.textContent)); c.querySelector('[data-fv="prev"]').click(); });
await pc.waitForTimeout(2500);
await pc.screenshot({ path:OUT + '/2-pc-index-sin-estilos.png' });
/* tocar «Nosotros» dentro de la vista previa */
const fr = pc.frames().find(f => f.url().includes('sintetico'));
if (fr){ await fr.click('text=Nosotros').catch(e => console.log('nav', e.message)); await pc.waitForTimeout(2000); }
await pc.screenshot({ path:OUT + '/3-pc-clic-en-nosotros.png' });
const cel = await go(390);
await cel.screenshot({ path:OUT + '/4-celular-respuesta.png' });
await b.close(); s.close();
