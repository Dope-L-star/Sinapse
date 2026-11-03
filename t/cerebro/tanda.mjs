/* Tanda de preguntas de prueba para medir la calidad de las IAs (v4.0).
   · node t/cerebro/tanda.mjs --seco           → sin internet: muestra qué decide el cerebro para cada pregunta
                                                 (tipo de trabajo, fácil/difícil, si piensa antes) y las instrucciones que recibe la IA.
   · node t/cerebro/tanda.mjs <url> <nombre>   → pregunta de verdad a <url>/api/ai (sin cuenta) y guarda las respuestas en
                                                 t/cerebro/resultados/<nombre>.md. Ej.: «… https://symphoria.pages.dev antes»
   Sin cuenta hay 5 mensajes al día por dispositivo: cada 5 preguntas se usa otro «dispositivo» de prueba. */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const Q = JSON.parse(fs.readFileSync(path.join(here, 'preguntas.json'), 'utf8'));
const [, , url, name = 'resultado'] = process.argv;
if (!url || url === '--seco'){
  const { leer, sistema } = await import('../../api/_cerebro.js');
  let out = '# Qué decide el cerebro con cada pregunta de prueba\n\n';
  for (const x of Q){
    const L = leer([{ role:'user', content:x.q }]);
    out += '## ' + x.tipo + ' (' + x.lang.toUpperCase() + ')\n**Pregunta:** ' + x.q.replace(/\n/g, ' ') + '\n\n- Tipo de trabajo: **' + L.cat + '** · Nivel: **' + ({ easy:'fácil → directo y rápido', normal:'normal', hard:'DIFÍCIL → modelo grande + piensa y se revisa' })[L.level] + '**\n'
      + '- Instrucciones para una IA normal (Llama 3.3 70B):\n\n> ' + sistema(L, 'groq', 'llama-3.3-70b-versatile') + '\n\n';
  }
  console.log(out); process.exit(0);
}
const dir = path.join(here, 'resultados'); fs.mkdirSync(dir, { recursive:true });
let md = '# Respuestas «' + name + '» · ' + url + ' · ' + new Date().toISOString() + '\n\n', dev = '';
for (const [i, x] of Q.entries()){
  if (i % 5 === 0) dev = 'tanda' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  const t0 = Date.now(); let text = '', who = '', err = '';
  try{
    const r = await fetch(url.replace(/\/$/, '') + '/api/ai', { method:'POST', headers:{ 'content-type':'application/json', 'x-sz-device':dev }, body:JSON.stringify({ model:'sz:auto', messages:[{ role:'user', content:x.q }] }) });
    who = decodeURIComponent(r.headers.get('x-sz-name') || '') + (r.headers.get('x-sz-level') ? ' · ' + r.headers.get('x-sz-cat') + '/' + r.headers.get('x-sz-level') : '');
    if (!r.ok){ err = r.status + ' ' + (await r.text()).slice(0, 200); }
    else { const raw = await r.text(); for (const l of raw.split('\n')){ if (!l.startsWith('data:')) continue; try{ const j = JSON.parse(l.slice(5)); const d = j.choices && j.choices[0] && j.choices[0].delta; if (d && typeof d.content === 'string') text += d.content; }catch(e){} } }
  }catch(e){ err = String(e.message || e); }
  const vis = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  md += '## ' + x.tipo + ' (' + x.lang.toUpperCase() + ') · ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s · ' + (who || '?') + '\n**Pregunta:** ' + x.q + '\n\n**Lo correcto:** ' + x.espera + '\n\n**Respuesta:**\n\n' + (err ? '_(error: ' + err + ')_' : vis || '_(vacía)_') + '\n\n---\n\n';
  console.log((err ? 'ERROR ' : 'OK    ') + x.id + ' · ' + who);
}
fs.writeFileSync(path.join(dir, name + '.md'), md);
console.log('Guardado en t/cerebro/resultados/' + name + '.md');
