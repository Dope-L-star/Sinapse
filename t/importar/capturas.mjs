/* Capturas de «Importar chats y memoria» en SynthFlow (servidor local, IA de mentira, sin internet).
   Uso: node cloudflare/preparar.mjs && node t/importar/capturas.mjs <carpeta> [antes|despues]
   · antes/después con la función APAGADA (como la ve todo el mundo): menú «⋯» y Ajustes › IAs y memoria.
   · después con la función ENCENDIDA (?importar=1): la ventana paso a paso, en computador y celular, ES y EN. */
import { start } from '../web/servidor.mjs';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = process.argv[2], CUAL = process.argv[3] || 'despues'; fs.mkdirSync(OUT, { recursive:true });
const s = await start({ reply:'¡Claro! Sigo desde donde lo dejaste.' });
const b = await chromium.launch();
const errs = [];
async function flow(W, lang, q = ''){
  const mob = W < 700;
  const p = await b.newPage({ viewport:{ width:W, height:mob ? 844 : 800 }, locale:lang === 'en' ? 'en-US' : 'es-CO', isMobile:mob, hasTouch:mob, deviceScaleFactor:mob ? 2 : 1 });
  p.on('pageerror', e => errs.push(W + lang + ': ' + e.message + ' @ ' + String(e.stack || '').split('\n')[1]));
  await p.route(u => !u.href.startsWith(s.base), r => r.abort());
  await p.addInitScript(l => { try{ localStorage.setItem('synthz:visited', '1'); localStorage.setItem('synthz:tour', '1'); localStorage.setItem('synthz:lang', l); sessionStorage.setItem('synthz:intro', '1'); }catch(e){} }, lang);
  await p.goto(s.base + '/chat.html' + q); await p.waitForTimeout(4000);
  await p.click('#blk .lnk').catch(() => {}); await p.waitForTimeout(400);
  /* se esconden con CSS (quitarlos del DOM rompe a React: «This page couldn't load») */
  await p.addStyleTag({ content:'#blk,#letreroAlfa{display:none !important}' });
  return p;
}
async function menuYAjustes(p, tag){
  await p.evaluate(() => document.getElementById('moreBtn').click()); await p.waitForTimeout(700);
  await p.screenshot({ path:`${OUT}/1-menu-${tag}.png` });
  await p.keyboard.press('Escape'); await p.mouse.click(5, 400); await p.waitForTimeout(300);
  await p.evaluate(() => SZ.cfgModal('mem')); await p.waitForTimeout(900);
  await p.screenshot({ path:`${OUT}/2-ajustes-memoria-${tag}.png` });
  const menu = await p.evaluate(() => document.body.innerText.includes('Importar') || document.body.innerText.includes('Import'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  return menu;
}
for (const [W, lang, tag] of [[1280, 'es', 'pc-es'], [390, 'es', 'cel-es']]){
  const p = await flow(W, lang);
  console.log(CUAL, tag, 'apagada; ¿se ve «Importar»?', await menuYAjustes(p, 'apagada-' + tag));
  await p.close();
}
if (CUAL === 'despues'){
  /* archivos de ejemplo: un .zip como el de ChatGPT y la memoria de Claude */
  const gpt = [{ title:'Plan para aprender inglés', update_time:1762000000, current_node:'b', conversation_id:'g1', mapping:{ a:{ parent:null, children:['b'], message:{ author:{ role:'user' }, content:{ content_type:'text', parts:['Hazme un plan de 30 días para aprender inglés'] } } }, b:{ parent:'a', children:[], message:{ author:{ role:'assistant' }, content:{ content_type:'text', parts:['Semana 1: 20 minutos diarios de vocabulario…'] } } } } },
    { title:'Ideas para mi tienda de ropa', update_time:1761000000, current_node:'b', conversation_id:'g2', mapping:{ a:{ parent:null, children:['b'], message:{ author:{ role:'user' }, content:{ content_type:'text', parts:['Dame nombres para una tienda de ropa'] } } }, b:{ parent:'a', children:[], message:{ author:{ role:'assistant' }, content:{ content_type:'text', parts:['1. Hilo Fino 2. Costura Viva…'] } } } } }];
  const claude = [{ uuid:'c1', name:'Resumen del libro Sapiens', updated_at:'2025-10-20T10:00:00Z', chat_messages:[{ sender:'human', text:'Resúmeme Sapiens' }, { sender:'assistant', text:'Sapiens cuenta la historia de…' }] }];
  const mem = [{ conversations_memory:'- Se llama Ana y vive en Medellín.\n- Estudia diseño gráfico.\n- Prefiere respuestas cortas y con ejemplos.\n- Le gusta el café.' }];
  const zip = files => { const parts = [], cen = []; let off = 0; for (const [n, t] of files){ const raw = Buffer.from(t), d = zlib.deflateRawSync(raw), nm = Buffer.from(n), lh = Buffer.alloc(30), ch = Buffer.alloc(46); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(8, 8); lh.writeUInt32LE(d.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nm.length, 26); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(8, 10); ch.writeUInt32LE(d.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(off, 42); parts.push(lh, nm, d); cen.push(ch, nm); off += 30 + nm.length + d.length; } const c = Buffer.concat(cen), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10); e.writeUInt32LE(c.length, 12); e.writeUInt32LE(off, 16); return Buffer.concat([...parts, c, e]); };
  const TMP = path.join(OUT, '_ejemplo'); fs.mkdirSync(TMP, { recursive:true });
  fs.writeFileSync(path.join(TMP, 'chatgpt-export.zip'), zip([['conversations.json', JSON.stringify(gpt)]]));
  fs.writeFileSync(path.join(TMP, 'claude-conversations.json'), JSON.stringify(claude));
  fs.writeFileSync(path.join(TMP, 'claude-memories.json'), JSON.stringify(mem));
  for (const [W, lang, tag] of [[1280, 'es', 'pc-es'], [1280, 'en', 'pc-en'], [390, 'es', 'cel-es']]){
    const p = await flow(W, lang, '?importar=1');
    console.log('encendida', tag, '¿se ve «Importar»?', await menuYAjustes(p, 'encendida-' + tag));
    await p.evaluate(() => SZ.importOpen()); await p.waitForTimeout(900);
    await p.screenshot({ path:`${OUT}/3-paso1-elegir-${tag}.png` });
    await p.setInputFiles('#impFile', ['chatgpt-export.zip', 'claude-conversations.json', 'claude-memories.json'].map(f => path.join(TMP, f)));
    await p.waitForSelector('#impm [data-step="2"]:not([hidden])', { timeout:8000 }).catch(e => console.log('paso2', e.message)); await p.waitForTimeout(700);
    await p.screenshot({ path:`${OUT}/4-paso2-vista-previa-${tag}.png` });
    console.log(tag, 'resumen:', await p.evaluate(() => (document.querySelector('#impm .imp-sum') || {}).textContent));
    await p.evaluate(() => document.querySelector('#impm [data-imp="go"]').click()); await p.waitForTimeout(1400);
    await p.screenshot({ path:`${OUT}/5-paso3-listo-${tag}.png` });
    const st = await p.evaluate(() => { const S = SZ.state; return { chats:Object.keys(S.chats).filter(k => /::t/.test(k) && S.chats[k].length).length, mem:S.mem.items.length }; });
    console.log(tag, 'guardado:', JSON.stringify(st));
    await p.evaluate(() => document.querySelector('#impm [data-imp="open"]').click()); await p.waitForTimeout(1500);
    console.log(tag, 'abierto:', await p.evaluate(() => document.body.innerText.slice(0, 80).replace(/\n/g, ' | ')));
    await p.screenshot({ path:`${OUT}/6-chat-importado-${tag}.png` });
    /* volver a importar lo mismo: no se duplica */
    await p.evaluate(() => SZ.importOpen()); await p.waitForTimeout(600);
    await p.setInputFiles('#impFile', ['chatgpt-export.zip', 'claude-conversations.json', 'claude-memories.json'].map(f => path.join(TMP, f)));
    await p.waitForTimeout(1500);
    console.log(tag, 'otra vez:', await p.evaluate(() => (document.querySelector('#impm .imp-sum') || document.querySelector('#impm .imp-empty') || {}).textContent));
    await p.screenshot({ path:`${OUT}/7-otra-vez-sin-duplicar-${tag}.png` });
    await p.close();
  }
  fs.rmSync(TMP, { recursive:true, force:true });
}
console.log('errores de la página:', errs.length ? errs : 'ninguno');
await b.close(); s.close();
