/* Capturas antes/después (8 nov): aviso bajo la caja, menú de esfuerzo, Pulsem › Gestión nítido y Ayuda.
   Uso: node cloudflare/preparar.mjs && node next/componentes/admin/demo/armar.mjs && node t/web/capturas-8nov.mjs <carpeta> */
import { start } from './servidor.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive:true });
const s = await start({ reply:'Aquí tienes tres consejos:\n\n1. **Estudia en bloques cortos** de 25 minutos con descansos.\n2. **Explica en voz alta** lo que aprendiste.\n3. **Repasa al día siguiente** para que se quede.' });
const b = await chromium.launch();
async function flow(W, lang){
  const mob = W < 700;
  const p = await b.newPage({ viewport:{ width:W, height:mob ? 844 : 800 }, locale:lang === 'en' ? 'en-US' : 'es-CO', isMobile:mob, hasTouch:mob, deviceScaleFactor:2 });
  await p.route(u => !u.href.startsWith(s.base), r => r.abort());
  await p.addInitScript(l => { try{ localStorage.setItem('synthz:visited', '1'); localStorage.setItem('synthz:tour', '1'); localStorage.setItem('synthz:lang', l); sessionStorage.setItem('synthz:intro', '1'); }catch(e){} }, lang);
  await p.goto(s.base + '/chat.html'); await p.waitForTimeout(4000);
  await p.click('#blk .lnk').catch(() => {}); await p.waitForTimeout(600);
  await p.fill('#inp', lang === 'en' ? 'Give me three tips to study better' : 'Dame tres consejos para estudiar mejor');
  await p.press('#inp', 'Enter');
  await p.waitForTimeout(9000);
  await p.evaluate(() => { const b = document.getElementById('blk'); if (b) b.remove(); });
  return p;
}
for (const [W, lang, tag] of [[1280, 'es', 'pc-es'], [1280, 'en', 'pc-en'], [390, 'es', 'cel-es']]){
  const p = await flow(W, lang);
  await p.screenshot({ path:`${OUT}/1-aviso-caja-${tag}.png` });
  await p.evaluate(() => { const a = document.getElementById('letreroAlfa'); if (a) a.remove(); });
  await p.click('#cEffort', { timeout:5000 }).catch(e => console.log('effort', e.message)); await p.waitForTimeout(700);
  await p.screenshot({ path:`${OUT}/2-esfuerzo-${tag}.png` });
  console.log(tag, 'pie:', await p.evaluate(() => (document.getElementById('payL') || {}).textContent));
  console.log(tag, 'menú:', await p.evaluate(() => (document.getElementById('effMenu') || {}).innerText.replace(/\n+/g, ' | ')));
  await p.close();
}
/* Pulsem › Gestión (panel con datos de prueba) con la capa de animaciones de la página real */
for (const [W, tag] of [[1280, 'pc'], [390, 'cel']]){
  const mob = W < 700;
  const p = await b.newPage({ viewport:{ width:W, height:mob ? 844 : 900 }, isMobile:mob, hasTouch:mob, deviceScaleFactor:2 });
  await p.route(u => !u.href.startsWith(s.base), r => r.abort());
  await p.goto(s.base + '/panel-demo.html'); await p.waitForTimeout(1500);
  await p.addStyleTag({ url:s.base + '/movimiento.css' }); await p.addScriptTag({ url:s.base + '/movimiento.js' });
  await p.waitForTimeout(800);
  await p.mouse.wheel(0, 260); await p.waitForTimeout(1200);
  await p.screenshot({ path:`${OUT}/3-gestion-${tag}.png` });
  await p.close();
}
/* Ayuda: otra página con el mismo efecto */
{
  const p = await b.newPage({ viewport:{ width:1280, height:800 }, deviceScaleFactor:2 });
  await p.route(u => !u.href.startsWith(s.base), r => r.abort());
  await p.goto(s.base + '/ayuda.html'); await p.waitForTimeout(2000);
  await p.mouse.wheel(0, 700); await p.waitForTimeout(1200);
  await p.screenshot({ path:`${OUT}/4-ayuda-pc.png` });
  await p.close();
}
await b.close(); s.close();
