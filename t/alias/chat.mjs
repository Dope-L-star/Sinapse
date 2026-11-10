/* Quoryn (antes A.L.I.A.S.) DENTRO de SynthFlow (v4.6, 10 nov): la página alias.html ya no existe.
   Prueba de navegador contra la página armada (cloudflare/public), los api/ reales y una IA de mentira que contesta distinto al plan,
   a cada paso, al «ajustar» y a una charla. Cubre lo que pidió Sammuel:
     · un «hola» (o «gracias») NO arma plan: lo responde Relay (la IA Automática) y queda el chip «Hacerlo con Quoryn»;
     · «Hola, ¿cómo estás? ¿me puedes ayudar a redactar un texto…?» SÍ lo toma Quoryn (ahí te está pidiendo algo);
     · plan en una tarjeta del chat → se aprueba UNA vez → trabaja solo → lo que escribes a mitad se suma sin pararlo → resultado como mensaje;
     · Detener entrega lo que alcanzó a hacer; quien no es del equipo no ve el modo Agente;
     · /alias y /alias.html llevan a SynthFlow (reglas de Cloudflare) y ya no hay página.
   Uso: node cloudflare/preparar.mjs && node t/alias/chat.mjs [carpeta-de-capturas] */
import { start } from '../web/servidor.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const OUT = process.argv[2] || ''; if (OUT) fs.mkdirSync(OUT, { recursive:true });
const calls = { plan:0, paso:0, ajustar:0, charla:0 };
const lento = ms => new Promise(r => setTimeout(r, ms));
const mock = async b => {
  const txt = (b.messages || []).map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).join('\n');
  if (/Divide el objetivo en entre/.test(txt)){ calls.plan++; return JSON.stringify({ steps:[
    { title:'Entender lo que necesitas', tool:'think', input:'Aclarar para quién es el texto' },
    { title:'Armar un borrador', tool:'think', input:'Escribir el primer borrador' },
    { title:'Pulir el tono', tool:'think', input:'Ajustar el tono' },
    { title:'Entregar el resultado', tool:'think', input:'Dar el texto final' }] }); }
  if (/Responde SOLO con JSON, sin ```: \{"reply"/.test(txt)){ calls.ajustar++; return JSON.stringify({ reply:'Listo, lo hago más corto.', steps:[
    { title:'Hacerlo más corto', tool:'think', input:'Resumir el borrador' },
    { title:'Entregar el texto corto', tool:'think', input:'Dar el texto final corto' }] }); }
  if (/Tarea: haz SOLO este paso/.test(txt)){ calls.paso++; await lento(1400); return 'RESULTADO-QUORYN: texto de prueba para tu emprendimiento de velas.'; }
  calls.charla++; return 'Respuesta normal de prueba de Relay.';
};
const s = await start({ reply:mock });
const { sha } = await import('../../api/_lib.js');   /* después de start(): _lib.js lee las llaves de Redis al importarse */
const tok = {};
for (const [k, role] of [['equipo', 'owner'], ['synther', null]]){
  const sub = 'p:' + k, t = 'tok_' + k + '_'.repeat(30); tok[k] = t;
  s.kv.set('u:' + sub, JSON.stringify(Object.assign({ sub, username:k, email:k + '@x.test', name:k, kind:'pass', created:Date.now(), seen:Date.now() }, role ? { role } : {})));
  s.kv.set('s:' + sha(t), sub);
}
const b = await chromium.launch();
let bad = 0;
const check = (name, ok, extra = '') => { console.log((ok ? 'OK    ' : 'FALLO ') + name + (ok ? '' : '  ' + extra)); if (!ok) bad++; };
const errs = [];
async function nueva(quien, W = 1280, lang = 'es'){
  const mob = W < 700;
  const ctx = await b.newContext({ viewport:{ width:W, height:mob ? 844 : 800 }, locale:lang === 'en' ? 'en-US' : 'es-CO', isMobile:mob, hasTouch:mob });
  await ctx.route(u => !u.href.startsWith(s.base), r => r.abort());
  await ctx.addInitScript(([t, l]) => { try{
    if (!sessionStorage.getItem('pz:init')){ sessionStorage.setItem('pz:init', '1'); localStorage.setItem('synthz:tour', '1'); localStorage.setItem('synthz:lang', l); sessionStorage.setItem('synthz:in', '1'); if (t) localStorage.setItem('synthz:sess', t); }
  }catch(e){} }, [quien ? tok[quien] : '', lang]);
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(quien + ' ' + W + ': ' + e.message));
  return p;
}
const ocultar = p => p.addStyleTag({ content:'#blk,#letreroAlfa{display:none !important}' }).catch(() => {});
async function flow(p, query = ''){
  await p.goto(s.base + '/chat.html' + query); await p.waitForTimeout(4500);
  await p.click('#blk .lnk').catch(() => {}); await ocultar(p); await p.waitForTimeout(300);
}
/* en el celular Enter da salto de línea: ahí se envía con el botón de la flecha, como lo hace la gente */
const escribe = async (p, t) => { await p.fill('#inp', t); if (await p.evaluate(() => matchMedia('(hover: none) and (pointer: coarse)').matches)) await p.click('#sendBtn'); else await p.press('#inp', 'Enter'); };
const botN = p => p.locator('#lane .m.bot').count();

/* ---------- equipo, computador ---------- */
{
  const p = await nueva('equipo');
  await flow(p);
  check('equipo: el modo Agente se ve', await p.locator('#ptModos [data-pm="agente"]').count() === 1);
  await p.click('#ptModos [data-pm="agente"]'); await p.waitForTimeout(500);
  check('equipo: «Agente» no abre otra página, se queda en SynthFlow y deja el modo puesto', /chat/.test(p.url()) && await p.evaluate(() => document.body.classList.contains('aliasing')), p.url());
  check('equipo: el botón Agente queda marcado', await p.locator('#ptModos [data-pm="agente"][aria-checked="true"]').count() === 1);

  /* 1) lo fácil → Relay, sin plan */
  const antes = await botN(p);
  await escribe(p, 'hola'); await p.waitForTimeout(6000);
  check('«hola» NO arma plan ni gasta una IA de planear', calls.plan === 0 && await p.locator('.alrun').count() === 0, 'plan=' + calls.plan);
  check('«hola» lo responde la IA de siempre (Relay)', await botN(p) > antes && /Respuesta normal de prueba de Relay/.test(await p.locator('#lane').innerText()), String(await botN(p)));
  check('queda el chip «Quoryn vio que era algo fácil…» con «Hacerlo con Quoryn»', await p.locator('#lane .alhand').count() === 1 && /Relay/.test(await p.locator('#lane .alhand').innerText()) && await p.locator('#lane .alhand [data-alforce]').count() === 1);
  check('el modo Agente sigue puesto para el siguiente mensaje', await p.evaluate(() => document.body.classList.contains('aliasing')));
  if (OUT) await p.screenshot({ path:`${OUT}/1-hola-lo-responde-relay.png` });

  /* 2) el ejemplo de Sammuel: hola + pedido real → Quoryn arma el plan */
  await escribe(p, 'Hola como estas? me puedes ayudar a redactar un texto para presentar mi emprendimiento de velas');
  await p.waitForSelector('.alrun [data-al="go"]', { timeout:25000 });
  check('«Hola… ¿me puedes ayudar a redactar un texto…?» SÍ lo toma Quoryn: plan en una tarjeta', calls.plan === 1 && await p.locator('.alrun .al-s li').count() >= 3, 'plan=' + calls.plan);
  check('esa pregunta NO se manda a otra IA (sin chip de «lo respondió»)', await p.locator('#lane .alhand').count() === 1, 'chips=' + await p.locator('#lane .alhand').count());
  check('la tarjeta dice Quoryn y trae «Aprobar y empezar» + «Descartar»', /Quoryn/.test(await p.locator('.alrun .ag-t').innerText()) && await p.locator('.alrun [data-al="no"]').count() === 1);
  if (OUT) await p.screenshot({ path:`${OUT}/2-plan-en-el-chat.png` });

  /* 3) aprobar UNA vez, trabaja solo; escribirle a mitad se suma */
  await p.click('.alrun [data-al="go"]'); await p.waitForTimeout(1800);
  check('aprobado: empieza solo («Voy a empezar con…»)', /Voy a (empezar|continuar) con/.test(await p.locator('.alrun .ag-t small').innerText()) && await p.locator('.alrun [data-al="stop"]').count() === 1);
  await escribe(p, 'hazlo más corto'); await p.waitForTimeout(1500);
  check('lo que escribes mientras trabaja se suma (sin pararlo)', calls.ajustar === 1 && /más corto/.test(await p.locator('.alrun .al-log').innerText().catch(() => '')) && await p.locator('.alrun').count() === 1, 'ajustar=' + calls.ajustar);
  if (OUT) await p.screenshot({ path:`${OUT}/3-trabajando-y-sumando.png` });
  await p.waitForSelector('.m.bot.alias-msg', { timeout:40000 });
  const res = await p.locator('.m.bot.alias-msg').last().innerText();
  check('al terminar, el resultado queda como un mensaje del chat (de Quoryn)', /RESULTADO-QUORYN/.test(res) && /Quoryn/.test(res), res.slice(0, 160));
  check('y la tarjeta se va', await p.locator('.alrun').count() === 0);
  check('los pasos corrieron sin pedir «continuar» en cada uno', calls.paso >= 3, 'pasos=' + calls.paso);
  if (OUT) await p.screenshot({ path:`${OUT}/4-resultado.png` });

  /* 4) el chip: «Hacerlo con Quoryn» fuerza el plan de un «hola» */
  const pl = calls.plan;
  await p.locator('#lane .alhand [data-alforce]').first().click();
  await p.waitForSelector('.alrun [data-al="go"]', { timeout:25000 });
  check('«Hacerlo con Quoryn» arma el plan aunque era un «hola»', calls.plan === pl + 1);

  /* 5) Detener sin haber hecho nada: sin resultado vacío; con algo hecho: entrega lo que alcanzó */
  await p.click('.alrun [data-al="go"]'); await p.waitForSelector('.alrun .al-s li.done', { timeout:20000 });
  const n0 = await p.locator('.m.bot.alias-msg').count();
  await p.click('.alrun [data-al="stop"]'); await p.waitForTimeout(1200);
  check('Detener entrega lo que alcanzó a hacer', await p.locator('.m.bot.alias-msg').count() === n0 + 1 && /Detuve la misión/.test(await p.locator('.m.bot.alias-msg').last().innerText()));

  /* 6) apagar el modo */
  await p.click('#ptModos [data-pm="auto"]'); await p.waitForTimeout(400);
  check('al elegir Auto, Quoryn se apaga', !(await p.evaluate(() => document.body.classList.contains('aliasing'))));
  const menu = await p.evaluate(() => { document.getElementById('moreBtn').click(); return new Promise(r => setTimeout(() => r(document.body.innerText), 600)); });
  check('el menú «⋯» dice Quoryn (ya no A.L.I.A.S. ni otra página)', /Quoryn/.test(menu) && !/A\.L\.I\.A\.S\./.test(menu));
  await p.context().close();
}

/* ---------- desde la portada: ?quoryn=1&q=… deja el modo puesto y manda el pedido ---------- */
{
  const p = await nueva('equipo');
  await p.goto(s.base + '/chat.html?quoryn=1'); await p.waitForTimeout(4500); await p.click('#blk .lnk').catch(() => {}); await ocultar(p);
  check('?quoryn=1 deja puesto el modo Agente', await p.evaluate(() => document.body.classList.contains('aliasing')));
  await p.context().close();
}

/* ---------- celular + inglés ---------- */
{
  const p = await nueva('equipo', 390, 'en');
  await flow(p);
  await p.click('#ptModos [data-pm="agente"]').catch(() => {}); await p.waitForTimeout(500);
  await escribe(p, 'Research the best laptops under 800 dollars and compare them for a student'); await p.waitForSelector('.alrun [data-al="go"]', { timeout:25000 });
  const t = await p.locator('.alrun').innerText();
  check('celular EN: la tarjeta está en inglés', /Approve and start/.test(t) && /Discard/.test(t) && /Plan ready/.test(t), t.slice(0, 160));
  check('celular: sin scroll de lado', await p.evaluate(() => document.documentElement.scrollWidth) <= 390);
  await p.waitForTimeout(900);   /* que termine de aparecer la tarjeta */
  if (OUT) await p.screenshot({ path:`${OUT}/5-celular-en.png` });
  await p.context().close();
}

/* ---------- los que no son del equipo no ven el modo Agente ---------- */
for (const quien of ['', 'synther']){
  const p = await nueva(quien); await flow(p);
  check((quien || 'sin cuenta') + ': no ve el modo Agente', await p.locator('#ptModos [data-pm="agente"]').count() === 0);
  await p.context().close();
}

/* ---------- /alias y /alias.html ya no son una página: llevan a SynthFlow ---------- */
{
  const red = fs.readFileSync(path.join(ROOT, 'cloudflare/public/_redirects'), 'utf8');
  check('Cloudflare: /alias y /alias.html llevan a /chat', /^\/alias\.html \/chat 30[12]$/m.test(red) && /^\/alias \/chat 30[12]$/m.test(red), red.slice(0, 200));
  check('ya no se publica alias.html', !fs.existsSync(path.join(ROOT, 'cloudflare/public/alias.html')) && !fs.existsSync(path.join(ROOT, 'cloudflare/public/alias')));
}

check('sin errores de página', !errs.length, errs.join(' | '));
await b.close(); s.close();
console.log(bad ? `\n${bad} con FALLO` : '\nTodo bien.');
process.exit(bad ? 1 : 0);
