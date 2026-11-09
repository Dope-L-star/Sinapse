/* v4.5 (Sammuel, 9 nov: «quita a todos el ALIAS excepto los admins. Lo de importar queda para todos»).
   Prueba de navegador contra la página armada (cloudflare/public) y los api/ reales con un Redis de mentira:
   · sin cuenta y con cuenta normal: no hay A.L.I.A.S. en la portada (modo Agente, tarjeta, pestaña, barra de arriba),
     ni en SynthFlow (modo Agente, menú «⋯»); alias.html muestra la puerta amable y lleva a SynthFlow con lo escrito.
   · equipo (owner): todo lo de A.L.I.A.S. se ve y alias.html abre A.L.I.A.S.
   · «Importar chats y memoria» está para todos (sin ?importar=1).
   Uso: node cloudflare/preparar.mjs && node t/alias/solo-equipo.mjs [carpeta-de-capturas] */
import { start } from '../web/servidor.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const OUT = process.argv[2] || ''; if (OUT) fs.mkdirSync(OUT, { recursive:true });
const s = await start({ reply:'Hola, aquí estoy.' });
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
    if (!sessionStorage.getItem('pz:init')){ sessionStorage.setItem('pz:init', '1'); localStorage.setItem('synthz:tour', '1'); localStorage.setItem('synthz:lang', l); sessionStorage.setItem('synthz:intro', '1'); if (t) localStorage.setItem('synthz:sess', t); }
  }catch(e){} }, [quien ? tok[quien] : '', lang]);
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(quien + ' ' + W + ': ' + e.message));
  return p;
}
const ocultar = p => p.addStyleTag({ content:'#blk,#letreroAlfa{display:none !important}' }).catch(() => {});
async function flow(p){
  await p.goto(s.base + '/chat.html'); await p.waitForTimeout(4500);
  await p.click('#blk .lnk').catch(() => {}); await ocultar(p); await p.waitForTimeout(300);
}
const menuTxt = async p => { await p.evaluate(() => document.getElementById('moreBtn').click()); await p.waitForTimeout(600); const t = await p.evaluate(() => document.body.innerText); return t; };

for (const quien of ['', 'synther', 'equipo']){
  const n = quien || 'sin-cuenta', team = quien === 'equipo';
  const p = await nueva(quien);
  /* SynthFlow primero (así guarda si la cuenta tiene A.L.I.A.S.) */
  await flow(p);
  const agente = await p.locator('#ptModos [data-pm="agente"]').count();
  check(n + ': SynthFlow · modo Agente ' + (team ? 'visible' : 'escondido'), team ? agente === 1 : agente === 0, 'agente=' + agente);
  const llave = await p.evaluate(() => localStorage.getItem('synthz:alias'));
  check(n + ': SynthFlow recuerda synthz:alias', team ? llave === '1' : llave === null, String(llave));
  if (OUT) await p.screenshot({ path:`${OUT}/1-synthflow-modos-${n}.png`, clip:{ x:0, y:420, width:1280, height:380 } });
  const m = await menuTxt(p);
  check(n + ': menú «⋯» · A.L.I.A.S. ' + (team ? 'está' : 'no está'), team ? /A\.L\.I\.A\.S\./.test(m) : !/A\.L\.I\.A\.S\./.test(m));
  check(n + ': menú «⋯» · «Importar chats y memoria» para todos', /Importar chats y memoria/.test(m));
  if (OUT) await p.screenshot({ path:`${OUT}/2-synthflow-menu-${n}.png` });
  await p.keyboard.press('Escape'); await p.mouse.click(5, 400); await p.waitForTimeout(300);
  await p.evaluate(() => SZ.importOpen && SZ.importOpen()); await p.waitForTimeout(800);
  check(n + ': la ventana de importar abre', await p.locator('#impm').count() === 1);
  if (OUT && !quien) await p.screenshot({ path:`${OUT}/3-importar-${n}.png` });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  /* portada */
  await p.goto(s.base + '/?nuevo=1'); await p.waitForTimeout(3500); await ocultar(p);
  const pm = await p.locator('.pt-modos [data-modo="agente"]').count();
  check(n + ': portada · modo Agente ' + (team ? 'visible' : 'escondido'), team ? pm === 1 : pm === 0, 'agente=' + pm);
  const links = await p.locator('a[href="/alias.html"]').count();
  check(n + ': portada · enlaces a A.L.I.A.S. ' + (team ? 'visibles' : 'ninguno'), team ? links >= 2 : links === 0, 'links=' + links);
  const h2 = await p.locator('.pt-sec .pt-cab h2').first().innerText().catch(() => '');
  if (OUT) await p.screenshot({ path:`${OUT}/4-portada-arriba-${n}.png` });
  const inst = p.locator('.pt-inst'); await inst.scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
  if (OUT) await inst.locator('xpath=ancestor::section[1]').screenshot({ path:`${OUT}/5-portada-instrumentos-${n}.png` });
  console.log('      título de instrumentos:', JSON.stringify(h2));

  /* alias.html directo, como vendría del modo Agente */
  await p.goto(s.base + '/alias.html?from=flow&meta=' + encodeURIComponent('Haz un plan de estudio')); await p.waitForTimeout(2500);
  const puerta = await p.locator('.pz-puerta .pz-tarjeta').count(), app = await p.locator('[data-react="alias"]').count();
  check(n + ': alias.html · ' + (team ? 'abre A.L.I.A.S.' : 'muestra la puerta amable'), team ? app === 1 && puerta === 0 : puerta === 1 && app === 0, `puerta=${puerta} app=${app}`);
  if (OUT) await p.screenshot({ path:`${OUT}/6-alias-${n}.png` });
  if (!team){
    await p.waitForURL(/chat\.html/, { timeout:9000 }).catch(() => {});
    const u = p.url();
    check(n + ': la puerta lleva sola a SynthFlow con lo escrito', /chat\.html\?from=alias&q=Haz/.test(u), u);
  }
  await p.context().close();
}

/* celular e inglés: la puerta */
{
  const p = await nueva('synther', 390, 'en');
  await p.goto(s.base + '/alias.html'); await p.waitForTimeout(2500);
  const txt = await p.locator('.pz-tarjeta').innerText().catch(() => '');
  check('celular EN: la puerta está en inglés', /still in the workshop/.test(txt) && /Go to SynthFlow/.test(txt), txt.slice(0, 120));
  const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
  check('celular: sin scroll de lado', ancho <= 390, String(ancho));
  if (OUT) await p.screenshot({ path:`${OUT}/7-alias-puerta-cel-en.png` });
  await p.goto(s.base + '/?nuevo=1'); await p.waitForTimeout(3500); await ocultar(p);
  const tab = await p.locator('.tabbar a[href="/alias.html"]').count();
  check('celular: la pestaña de abajo no tiene A.L.I.A.S.', tab === 0, String(tab));
  if (OUT) await p.screenshot({ path:`${OUT}/8-portada-cel-en.png` });
  await p.context().close();
}

check('sin errores de página', !errs.length, errs.join(' | '));
await b.close(); s.close();
console.log(bad ? `\n${bad} con FALLO` : '\nTodo bien.');
process.exit(bad ? 1 : 0);
