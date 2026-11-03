/* v4.2 · Puertas falsas: un clic NO cuenta como «se interesó». Solo cuenta quien deja su correo (Sammuel, 3 nov).
   Revisa la portada (laboratorio y candado de la demo) y los planes de SynthFlow contra el api/config.js real con un Redis de mentira.
   Uso: node cloudflare/preparar.mjs && node t/web/puertas.mjs [carpeta-capturas] */
import { start } from './servidor.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = process.argv[2] || '';
let fails = 0;
const check = (n, c, why) => { if (c) console.log('OK    ' + n); else { fails++; console.log('FALLO ' + n + (why ? ' — ' + String(why).slice(0, 200) : '')); } };
const s = await start({ reply:'Hola' });
const b = await chromium.launch();
const server = async () => { const d = await (await fetch(s.base + '/api/config?puertas=1')).json(); d.clics = d.clics || {}; return d; };
const shot = async (p, n, el) => { if (!OUT) return; if (el) await p.locator(el).first().scrollIntoViewIfNeeded().catch(() => {}); await p.waitForTimeout(300); await p.screenshot({ path:OUT + '/' + n + '.png' }); };

async function page(o = {}){
  const p = await b.newPage({ viewport:{ width:o.cel ? 390 : 1280, height:o.cel ? 844 : 800 }, isMobile:!!o.cel, hasTouch:!!o.cel, deviceScaleFactor:1 });
  await p.route(u => !u.href.startsWith(s.base), r => r.abort());
  await p.addInitScript(l => { try{ localStorage.setItem('synthz:lang', l); localStorage.setItem('synthz:visited', '1'); localStorage.setItem('synthz:portada', JSON.stringify({ v:'nuevo', t:1 })); localStorage.setItem('sz-alfa-visto', '1'); localStorage.setItem('synthz:tour', '1'); sessionStorage.setItem('synthz:intro', '1'); }catch(e){} }, o.en ? 'en' : 'es');
  return p;
}

/* ---- portada: laboratorio ---- */
{
  const p = await page();
  await p.goto(s.base + '/index.html'); await p.waitForTimeout(3500);
  await p.evaluate(() => { const l = document.getElementById('szLab'); if (l) l.scrollIntoView(); }); await p.waitForTimeout(600);
  const voz = '#szLab .lab-tubo[data-f="voz"]';
  check('el laboratorio está', await p.locator(voz).count() === 1);
  await p.click(voz + ' .lab-votar'); await p.waitForTimeout(700);
  let n = await p.textContent(voz + ' .lab-n'), sv = await server();
  check('clic sin correo: en pantalla NO dice que alguien se interesó', /nadie/.test(n), n);
  check('clic sin correo: el servidor no lo cuenta como interesado', sv.puertas.voz === 0, JSON.stringify(sv));
  check('clic sin correo: el clic se guarda aparte', sv.clics.voz === 1, JSON.stringify(sv));
  check('el botón no dice «Anotado» todavía', !/Anotado/.test(await p.textContent(voz + ' .lab-votar')));
  check('pide el correo para que cuente', /para que tu voto/i.test(await p.textContent('#szLab .lab-correo label')));
  await shot(p, 'lab-clic-sin-correo-es', '#szLab .lab-correo');
  await p.fill('#labMail', 'no-es-correo'); await p.click('#szLab .lab-correo button'); await p.waitForTimeout(300);
  check('correo malo: avisa y no cuenta', /no parece/.test(await p.textContent('#szLab .lab-aviso')) && (await server()).puertas.voz === 0);
  await p.fill('#labMail', 'persona@ejemplo.com'); await p.click('#szLab .lab-correo button'); await p.waitForTimeout(900);
  n = await p.textContent(voz + ' .lab-n'); sv = await server();
  check('con correo: ahora sí cuenta (1 persona dejó su correo)', /^1 persona dejó su correo$/.test(n) && sv.puertas.voz === 1, n + ' ' + JSON.stringify(sv));
  check('con correo: el botón dice «Anotado»', /Anotado/.test(await p.textContent(voz + ' .lab-votar')));
  await shot(p, 'lab-con-correo-es', '#szLab .lab-correo');
  /* candado de la demo */
  await p.evaluate(() => document.getElementById('szDemo').scrollIntoView()); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('#szDemo .dm-tab.lock[data-f="grupo"]').click()); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('#szDemo .dm-quiero').click()); await p.waitForTimeout(700);
  sv = await server();
  check('candado: «La quiero» pide el correo y no cuenta', await p.locator('#szDemo .dm-form').count() === 1 && sv.puertas.grupo === 0 && sv.clics.grupo === 1, JSON.stringify(sv));
  await shot(p, 'demo-candado-pide-correo-es', '#szDemo');
  await p.fill('#dmMail', 'otra@ejemplo.com'); await p.evaluate(() => document.querySelector('#szDemo .dm-form button').click()); await p.waitForTimeout(900);
  sv = await server();
  check('candado: con correo cuenta y dice «Anotado»', sv.puertas.grupo === 1 && /Anotado/.test(await p.textContent('#szDemo .dm-pop')), JSON.stringify(sv));
  await p.close();
}
/* ---- portada en inglés, celular ---- */
{
  const p = await page({ en:true, cel:true });
  await p.goto(s.base + '/index.html'); await p.waitForTimeout(3500);
  const ag = '#szLab .lab-tubo[data-f="agenda"]';
  await p.locator(ag + ' .lab-votar').scrollIntoViewIfNeeded(); await p.click(ag + ' .lab-votar'); await p.waitForTimeout(700);
  const n = await p.textContent(ag + ' .lab-n');
  check('EN: a click alone does not say anyone is interested', /Nobody/.test(n), n);
  check('EN: asks for the email so it counts', /to count/i.test(await p.textContent('#szLab .lab-correo label')));
  await shot(p, 'lab-clic-sin-correo-en-cel', '#szLab .lab-correo');
  await p.close();
}
/* ---- planes en SynthFlow ---- */
{
  const p = await page();
  await p.goto(s.base + '/chat.html'); await p.waitForTimeout(4000);
  await p.click('#blk .lnk').catch(() => {}); await p.evaluate(() => { const x = document.getElementById('blk'); if (x) x.remove(); });
  await p.evaluate(() => SZ.plansModal()); await p.waitForTimeout(800);
  const btn = '#szPlans .pl-quiero[data-plan="timeless"]', cnt = '#szPlans .pl-n[data-plan="timeless"]';
  check('los planes están', await p.locator(btn).count() === 1);
  await p.waitForTimeout(1200); await p.evaluate(q => document.querySelector(q).click(), btn); await p.waitForTimeout(700);
  let sv = await server();
  check('planes: «Me interesa» sin correo no cuenta ni dice «personas»', sv.puertas['plan-timeless'] === 0 && sv.clics['plan-timeless'] === 1 && !(await p.textContent(cnt)), JSON.stringify(sv));
  check('planes: el botón no dice «Te avisamos» sin correo', !/avisamos/.test(await p.textContent(btn)));
  await shot(p, 'planes-clic-sin-correo-es', '#szPlans .pl-correo');
  await p.fill('#plMail', 'tres@ejemplo.com'); await p.evaluate(() => document.querySelector('#szPlans .pl-correo button').click()); await p.waitForTimeout(900);
  sv = await server();
  check('planes: con correo cuenta (1 persona dejó su correo)', sv.puertas['plan-timeless'] === 1 && /1 persona dejó su correo/.test(await p.textContent(cnt)) && /avisamos/.test(await p.textContent(btn)), JSON.stringify(sv));
  await shot(p, 'planes-con-correo-es', '#szPlans .pl-correo');
  await p.close();
}
/* ---- el mismo correo dos veces no cuenta doble ---- */
{
  const r = await fetch(s.base + '/api/config', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ action:'puerta', id:'voz', email:'Persona@Ejemplo.com' }) });
  const d = await r.json();
  check('el mismo correo otra vez no cuenta doble', d.n === 1, JSON.stringify(d));
}
await b.close(); s.close();
console.log(fails ? '\n' + fails + ' FALLO(S)' : '\nTodo bien.');
process.exit(fails ? 1 : 0);
