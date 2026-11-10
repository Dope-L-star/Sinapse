/* Títulos con sentido y memoria con lógica (v4.0), en SynthFlow de verdad con la IA simulada.
   Uso: node t/cerebro/titulos-memoria.mjs [carpeta-capturas] [carpeta-public]   (antes: node cloudflare/preparar.mjs)
   Con la carpeta de la versión anterior sirve para sacar las capturas de ANTES (las comprobaciones fallarán, es lo esperado). */
process.env.SYNTHZ_GUEST_MSGS = '30';
const { start } = await import('../web/servidor.mjs');
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = process.argv[2] || '', ROOT = process.argv[3] ? path.resolve(process.argv[3]) : undefined;
let fails = 0;
const check = (n, c, why) => { if (c) console.log('OK    ' + n); else { fails++; console.log('FALLO ' + n + (why ? ' — ' + String(why).slice(0, 300) : '')); } };
const s = await start(ROOT ? { root:ROOT } : {});
const b = await chromium.launch();
const p = await b.newPage({ viewport:{ width:1280, height:800 }, locale:'es-CO' });
p.on('pageerror', e => console.log('error de página:', e.message));
await p.route(u => !u.href.startsWith(s.base), r => r.abort());
await p.addInitScript(() => { try{ localStorage.setItem('synthz:visited', '1'); localStorage.setItem('synthz:tour', '1'); localStorage.setItem('sz-alfa-visto', '1'); sessionStorage.setItem('synthz:intro', '1'); localStorage.setItem('synthz:cfg', JSON.stringify({ review:false, autoWeb:false })); }catch(e){} });
await p.goto(s.base + '/chat.html'); await p.waitForTimeout(4000);
await p.click('#blk .lnk').catch(() => {});
await p.evaluate(() => { document.querySelectorAll('#blk, .szgt, .gt-pop').forEach(x => x.remove()); });
const title = () => p.evaluate(() => { const e = document.querySelector('#thList .tt b, #thList b'); return e ? e.textContent.trim() : ''; });
async function say(text, reply){
  /* la versión de antes no le pedía marcas a la IA: para sus capturas, la IA simulada responde sin ellas */
  s.setReply(ROOT ? reply.replace(/\s*\[(titulo|recordar):[^\]]*\]/g, '') : reply);
  await p.fill('#inp', text); await p.press('#inp', 'Enter');
  await p.waitForFunction(() => !document.querySelector('.m.writing') && !document.body.classList.contains('busy'), null, { timeout:20000 }).catch(() => {});
  await p.waitForTimeout(1800);
}
const shot = async n => { if (OUT) await p.screenshot({ path:path.join(OUT, n) }); };

await say('Hola, ¿cómo estás?', '¡Hola! Muy bien, gracias. ¿En qué te ayudo hoy?\n[titulo: -]');
const t1 = await title();
check('un saludo no se vuelve el título (queda «Charla nueva»)', t1 === 'Charla nueva', t1);
check('las marcas no se ven en la respuesta', await p.evaluate(() => !/\[titulo/i.test(document.querySelector('#lane').innerText)));
await shot('1-saludo.png');

/* bug 3 nov: la IA escribió la marca con espacios y se veía en la respuesta */
await say('¿Quién eres?', 'Soy Sona, tu guía en SymphorIA.\n\n[ titulo: - ]');
check('marca con espacios «[ titulo: - ]» no se ve', await p.evaluate(() => !/titulo/i.test(document.querySelector('#lane').innerText)));
await say('¿Y qué sabes hacer?', 'Te ayudo con chats, archivos y páginas web.\n\\[ titulo: Identidad de la IA \\]');
check('marca escapada «\\[ titulo: … \\]» no se ve', await p.evaluate(() => !/titulo/i.test(document.querySelector('#lane').innerText)));
await shot('1b-marca-con-espacios.png');
check('y su título sí se usa', (await title()) === 'Identidad de la IA', await title());
await p.reload(); await p.waitForTimeout(3500);
await p.evaluate(() => { document.querySelectorAll('#blk, .szgt, .gt-pop').forEach(x => x.remove()); });
check('al volver a abrir el chat (historial) tampoco se ve', await p.evaluate(() => !/titulo/i.test(document.querySelector('#lane').innerText)));

await say('Ayúdame a armar un documento de requisitos para mi app de recetas', 'Claro. Un documento de requisitos tiene estas partes:\n\n1. Objetivo\n2. Usuarios\n3. Funciones\n\n[titulo: Documento de requisitos para app de recetas]');
const t2 = await title();
check('con el tema real, el título lo resume', t2 === 'Documento de requisitos para app de recetas', t2);
await shot('2-tema-documento.png');

await say('Listo eso. Ahora hazme una página web para mi panadería', 'Perfecto, cambiamos a la web de tu panadería. Empiezo por la portada con el menú y los horarios.\n\n[titulo: Página web para una panadería]');
const t3 = await title();
check('cuando el tema cambia, el título cambia', t3 === 'Página web para una panadería', t3);
await shot('3-tema-cambia-a-web.png');

await say('Recuerda que vivo en Bogotá', 'Listo, lo tengo presente.\n\n[titulo: Página web para una panadería]\n[recordar: Vive en Bogotá.]');
const off1 = await p.evaluate(() => { const e = document.querySelector('.memoff b'); return e ? e.textContent : ''; });
check('la memoria guarda el dato redactado, no el mensaje copiado', off1 === 'Vive en Bogotá.', off1);
check('mismo tema: el título no cambia', (await title()) === 'Página web para una panadería', await title());
await shot('4-recordar-redactado.png');
await p.click('.memoff [data-mm=yes]').catch(() => {});

await say('Recuerda que ya no vivo en Bogotá, ahora vivo en Medellín', 'Anotado: ahora vives en Medellín.\n\n[titulo: Página web para una panadería]\n[recordar: Vive en Medellín.]');
await p.click('.memoff [data-mm=yes]').catch(() => {});
await p.waitForTimeout(400);
const mem = await p.evaluate(() => { try{ const S = JSON.parse(localStorage.getItem('synthz') || localStorage.getItem('synthz:state') || '{}'); return ((S.mem || {}).items || []).map(x => x.text); }catch(e){ return []; } });
const memAll = mem.length ? mem : await p.evaluate(() => Object.keys(localStorage).map(k => localStorage.getItem(k)).filter(v => v && v.includes('"mem"')).map(v => { try{ return (JSON.parse(v).mem.items || []).map(x => x.text); }catch(e){ return []; } }).flat());
check('si cambia el dato, se ACTUALIZA en vez de duplicarse', memAll.length === 1 && memAll[0] === 'Vive en Medellín.', JSON.stringify(memAll));

await say('recuerda que me llamo Ana', 'Mucho gusto, Ana.\n\n[titulo: Página web para una panadería]');
const off2 = await p.evaluate(() => { const e = document.querySelector('.memoff b'); return e ? e.textContent : ''; });
check('sin dato de la IA, igual se redacta en tercera persona', off2 === 'Se llama Ana.', off2);
await shot('5-recordar-sin-marca.png');

await b.close(); s.close();
console.log(fails ? '\n' + fails + ' FALLO' : '\nTodo bien.'); process.exit(fails ? 1 : 0);
