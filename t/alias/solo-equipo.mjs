/* v4.5 (Sammuel, 9 nov: «quita a todos el ALIAS excepto los admins. Lo de importar queda para todos»), puesta al día en v4.6:
   Quoryn (antes A.L.I.A.S.) ya no tiene página: vive dentro de SynthFlow. Esta prueba sigue cuidando que sea solo del equipo.
   Prueba de navegador contra la página armada (cloudflare/public) y los api/ reales con un Redis de mentira:
   · sin cuenta y con cuenta normal: no hay Quoryn en la portada (modo Agente, tarjeta, pestaña de abajo) ni en SynthFlow
     (modo Agente, menú «⋯»); si alguien llega con un enlace viejo (/alias.html o /alias) cae en SynthFlow, sin errores.
   · equipo (owner): todo lo de Quoryn se ve (portada y SynthFlow) y su enlace lleva a /chat.html?quoryn=1.
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
/* el aviso «Seguir sin Puter» (#blk) sale porque la prueba no deja salir a internet: NO se le hace clic (abre la ventana de conectar y tapa el chat), solo se esconde */
async function flow(p){
  await p.goto(s.base + '/chat.html'); await p.waitForTimeout(4500);
  await ocultar(p); await p.waitForTimeout(300);
}
const menuTxt = async p => { await p.evaluate(() => document.getElementById('moreBtn').click()); await p.waitForTimeout(600); const t = await p.evaluate(() => document.body.innerText); return t; };

for (const quien of ['', 'synther', 'equipo']){
  const n = quien || 'sin-cuenta', team = quien === 'equipo';
  const p = await nueva(quien);
  /* SynthFlow primero (así guarda si la cuenta tiene Quoryn) */
  await flow(p);
  const agente = await p.locator('#ptModos [data-pm="agente"]').count();
  check(n + ': SynthFlow · modo Agente ' + (team ? 'visible' : 'escondido'), team ? agente === 1 : agente === 0, 'agente=' + agente);
  const llave = await p.evaluate(() => localStorage.getItem('synthz:alias'));
  check(n + ': SynthFlow recuerda synthz:alias', team ? llave === '1' : llave === null, String(llave));
  if (OUT) await p.screenshot({ path:`${OUT}/1-synthflow-modos-${n}.png`, clip:{ x:0, y:420, width:1280, height:380 } });
  const m = await menuTxt(p);
  check(n + ': menú «⋯» · Quoryn ' + (team ? 'está' : 'no está'), team ? /Quoryn/.test(m) : !/Quoryn/.test(m));
  check(n + ': menú «⋯» · «Importar chats y memoria» para todos', /Importar chats y memoria/.test(m));
  check(n + ': el menú ya no habla de A.L.I.A.S.', !/A\.L\.I\.A\.S\./.test(m));
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
  const links = await p.locator('a[href="/chat.html?quoryn=1"]').count();
  check(n + ': portada · enlaces a Quoryn ' + (team ? 'visibles' : 'ninguno'), team ? links >= 2 : links === 0, 'links=' + links);
  const viejos = await p.locator('a[href="/alias.html"], a[href="/alias"]').count();
  check(n + ': portada · ningún enlace a la página vieja', viejos === 0, 'viejos=' + viejos);
  const h2 = await p.locator('.pt-sec .pt-cab h2').first().innerText().catch(() => '');
  if (OUT) await p.screenshot({ path:`${OUT}/4-portada-arriba-${n}.png` });
  const inst = p.locator('.pt-inst'); await inst.scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
  if (OUT) await inst.locator('xpath=ancestor::section[1]').screenshot({ path:`${OUT}/5-portada-instrumentos-${n}.png` });
  console.log('      título de instrumentos:', JSON.stringify(h2));

  /* enlaces viejos: /alias.html y /alias ya no son una página (en producción Cloudflare los manda a /chat: eso lo prueba t/alias/chat.mjs leyendo _redirects;
     este servidor local solo sirve archivos, así que aquí basta con que no abra una página ni dé errores) */
  for (const viejo of ['/alias.html?from=flow', '/alias']){
    const r = await p.goto(s.base + viejo, { waitUntil:'domcontentloaded' }).catch(() => null);
    await p.waitForTimeout(1500);
    const u = p.url();
    check(n + ': ' + viejo + ' ya no es una página (' + (r ? r.status() : 'sin respuesta') + ')', /\/chat(\.html)?(\?|$)/.test(u) || (r && r.status() === 404), u);
  }
  await p.context().close();
}

/* celular e inglés: la portada para quien no es del equipo */
{
  const p = await nueva('synther', 390, 'en');
  await p.goto(s.base + '/?nuevo=1'); await p.waitForTimeout(3500); await ocultar(p);
  const tab = await p.locator('.tabbar a[href="/chat.html?quoryn=1"]').count();
  check('celular: la pestaña de abajo no tiene Quoryn', tab === 0, String(tab));
  const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
  check('celular: sin scroll de lado', ancho <= 390, String(ancho));
  if (OUT) await p.screenshot({ path:`${OUT}/8-portada-cel-en.png` });
  await p.context().close();
}
/* celular e inglés: el equipo sí la ve */
{
  const p = await nueva('equipo', 390, 'en');
  await flow(p);   /* SynthFlow primero: ahí el aparato se entera de que la cuenta es del equipo */
  await p.goto(s.base + '/?nuevo=1'); await p.waitForTimeout(3500); await ocultar(p);
  const tab = await p.locator('.tabbar a[href="/chat.html?quoryn=1"]').count();
  check('celular: el equipo ve la pestaña «Quoryn»', tab === 1, String(tab));
  await p.context().close();
}

check('sin errores de página', !errs.length, errs.join(' | '));
await b.close(); s.close();
console.log(bad ? `\n${bad} con FALLO` : '\nTodo bien.');
process.exit(bad ? 1 : 0);
