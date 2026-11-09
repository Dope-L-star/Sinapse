/* Pruebas del lector de «Importar chats y memoria» (src/chat/05h-importar-leer.js), sin navegador.
   Uso: node t/importar/importar.mjs */
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const IMP = new Function(fs.readFileSync(path.join(REPO, 'src/chat/05h-importar-leer.js'), 'utf8') + '\nreturn IMP;')();
let ok = 0, bad = 0;
const check = (name, cond, extra) => { if (cond){ ok++; console.log('  ✓ ' + name); } else { bad++; console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : '')); } };

/* ---- ChatGPT: árbol con una rama editada (solo debe quedar la rama abierta) ---- */
const gpt = [{
  title:'Receta de arepas', create_time:1730000000.5, update_time:1730000500.2, current_node:'d', conversation_id:'c-1',
  mapping:{
    r:{ id:'r', message:null, parent:null, children:['s'] },
    s:{ id:'s', parent:'r', children:['a', 'a2'], message:{ author:{ role:'system' }, content:{ content_type:'text', parts:[''] }, metadata:{ is_visually_hidden_from_conversation:true } } },
    a2:{ id:'a2', parent:'s', children:[], message:{ author:{ role:'user' }, content:{ content_type:'text', parts:['versión vieja'] } } },
    a:{ id:'a', parent:'s', children:['b'], message:{ author:{ role:'user' }, content:{ content_type:'text', parts:['¿Cómo hago arepas?'] } } },
    b:{ id:'b', parent:'a', children:['t'], message:{ author:{ role:'assistant' }, content:{ content_type:'code', text:'search("arepas")' } } },
    t:{ id:'t', parent:'b', children:['c'], message:{ author:{ role:'tool' }, content:{ content_type:'text', parts:['resultado'] } } },
    c:{ id:'c', parent:'t', children:['d'], message:{ author:{ role:'assistant' }, content:{ content_type:'text', parts:['Mezcla harina, agua y sal.'] } } },
    d:{ id:'d', parent:'c', children:[], message:{ author:{ role:'assistant' }, content:{ content_type:'text', parts:['Luego asa 10 minutos.'] } } },
  },
}];
console.log('ChatGPT');
let r = IMP.parseText(JSON.stringify(gpt), 'conversations.json');
check('una conversación', r.chats.length === 1, r);
const c0 = r.chats[0] || { msgs:[] };
check('título y fuente', c0.title === 'Receta de arepas' && c0.src === 'chatgpt', c0);
check('fecha en milisegundos', c0.t === 1730000500200, c0.t);
check('solo la rama abierta, sin sistema ni herramientas', c0.msgs.length === 2 && c0.msgs[0].content === '¿Cómo hago arepas?', c0.msgs);
check('las partes seguidas de la IA se unen', c0.msgs[1] && c0.msgs[1].content === 'Mezcla harina, agua y sal.\n\nLuego asa 10 minutos.', c0.msgs[1]);

/* ---- Claude: conversations.json + memories.json ---- */
console.log('Claude');
const claude = [
  { uuid:'u1', name:'Plan de estudio', created_at:'2025-05-01T10:00:00Z', updated_at:'2025-05-02T10:00:00Z', chat_messages:[
    { sender:'human', text:'Ayúdame a estudiar', content:[{ type:'text', text:'Ayúdame a estudiar' }], attachments:[{ file_name:'temario.pdf' }] },
    { sender:'assistant', text:'', content:[{ type:'text', text:'Claro, empecemos.' }, { type:'tool_use', name:'x' }] } ] },
  { uuid:'u2', name:'Vacía', chat_messages:[] },
];
r = IMP.parseText(JSON.stringify(claude), 'conversations.json');
check('una conversación (la vacía se salta)', r.chats.length === 1 && r.skipped === 1, r);
check('mensajes y adjunto anotado', r.chats[0] && r.chats[0].msgs.length === 2 && /Archivo: temario\.pdf/.test(r.chats[0].msgs[0].content) && r.chats[0].msgs[1].content === 'Claro, empecemos.', r.chats[0]);
check('fecha ISO', r.chats[0] && r.chats[0].t === Date.parse('2025-05-02T10:00:00Z'));
const cmem = [{ conversations_memory:'# Sobre Ana\n\n**Trabajo**\n- Ana es diseñadora gráfica en Medellín.\n- Prefiere respuestas cortas.\n\n**Gustos:**\n1. Le gusta el café.', project_memories:{ p1:'- Usa Figma a diario.' } }];
r = IMP.parseText(JSON.stringify(cmem), 'memories.json');
check('memoria de Claude: 4 recuerdos sin títulos', r.mem.length === 4 && r.mem.includes('Ana es diseñadora gráfica en Medellín.') && r.mem.includes('Usa Figma a diario.') && !r.mem.some(x => /Trabajo|Sobre Ana|Gustos/.test(x)), r.mem);

/* ---- JSON genérico ---- */
console.log('JSON genérico');
r = IMP.parseText(JSON.stringify([{ role:'user', content:'hola' }, { role:'assistant', content:'¡hola!' }]), 'chat.json');
check('lista de mensajes', r.chats.length === 1 && r.chats[0].msgs.length === 2, r);
r = IMP.parseText(JSON.stringify({ title:'Uno', messages:[{ role:'user', content:[{ type:'text', text:'a' }] }, { role:'model', parts:[{ text:'b' }] }] }), 'x.json');
check('{title, messages} con partes', r.chats.length === 1 && r.chats[0].title === 'Uno' && r.chats[0].msgs[1].content === 'b', r);
r = IMP.parseText(JSON.stringify({ chats:{ 'openrouter::llama::tabc':[{ role:'user', content:'x' }, { role:'assistant', content:'y' }] }, threads:{ llama:[{ id:'tabc', title:'Mío', t:5 }] } }), 'synthflow.json');
check('copia de SynthFlow con su título', r.chats.length === 1 && r.chats[0].title === 'Mío' && r.chats[0].src === 'synthflow', r);
r = IMP.parseText('{ esto no es json', 'roto.json');
check('JSON roto: se avisa, no se rompe', r.bad === true && !r.chats.length);

/* ---- Markdown / texto ---- */
console.log('Markdown y texto');
r = IMP.parseText('## Tú\n\n¿Qué es un agente?\n\n## Llama 3.3 70B\n\nUn programa que actúa solo.\n\n## Pasos\n\n1. Planea\n\n## Tú\n\nGracias', 'chat-Llama.md');
check('copia de SynthFlow («## Tú»): 3 mensajes, el ## dentro de la respuesta se queda', r.chats.length === 1 && r.chats[0].msgs.length === 3 && /## Pasos/.test(r.chats[0].msgs[1].content), r.chats[0] && r.chats[0].msgs);
r = IMP.parseText('Usuario: hola\nAssistant: ¡Hola! ¿En qué te ayudo?\n**Tú:** dime un chiste\n**ChatGPT**\nAhí va uno.', 'charla.txt');
check('marcas «Rol:» y «**Rol**»', r.chats.length === 1 && r.chats[0].msgs.length === 4 && r.chats[0].msgs[3].content === 'Ahí va uno.' && r.chats[0].title === 'charla', r.chats[0]);
r = IMP.parseText('Esto es lo que recuerdo de ti:\n- Te llamas Ana.\n- Vives en Medellín.\n- Nombre: Ana María\n• Te gusta el café', 'pegado.txt');
check('texto sin marcas = recuerdos (el «Nombre:» se queda como dato)', !r.chats.length && r.mem.length === 4 && r.mem[2] === 'Nombre: Ana María', r);

/* ---- .zip (deflate y sin comprimir), como el de ChatGPT/Claude ---- */
console.log('.zip');
function zip(files){
  const parts = [], cen = []; let off = 0;
  for (const [name, text, store] of files){
    const raw = Buffer.from(text), data = store ? raw : zlib.deflateRawSync(raw), nm = Buffer.from(name);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(store ? 0 : 8, 8); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nm.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(store ? 0 : 8, 10); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(off, 42);
    parts.push(lh, nm, data); cen.push(ch, nm); off += 30 + nm.length + data.length;
  }
  const c = Buffer.concat(cen), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(c.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, c, end]);
}
const z = zip([['conversations.json', JSON.stringify(gpt.concat(claude))], ['memories.json', JSON.stringify(cmem), true], ['users.json', JSON.stringify([{ email:'x@y.z' }])], ['chat.html', '<html>']]);
const file = (name, buf) => Object.assign(new Blob([buf]), { name });
r = await IMP.parseFiles([file('export.zip', z), file('notas.md', '- Estudio de noche.'), file('roto.json', '{')]);
check('zip: 2 chats (ChatGPT y Claude) ordenados por fecha', r.chats.length === 2 && r.chats[0].src === 'claude' && r.chats[1].src === 'chatgpt', r.chats.map(c => c.src + ' ' + c.t));
check('zip + notas: 5 recuerdos', r.mem.length === 5 && r.mem.includes('Estudio de noche.'), r.mem);
check('el archivo roto se nombra, no rompe lo demás', r.bad.length === 1 && r.bad[0] === 'roto.json', r.bad);
r = await IMP.parseFiles([file('export.zip', z), file('export (1).zip', z)]);
check('el mismo export dos veces no duplica', r.chats.length === 2, r.chats.length);
r = await IMP.parseFiles([file('nada.zip', Buffer.from('no soy un zip'))]);
check('zip dañado: se avisa', r.bad.length === 1 && !r.chats.length);

/* ---- límites ---- */
console.log('Límites');
const big = Array.from({ length:900 }, (_, i) => ({ role:i % 2 ? 'assistant' : 'user', content:'m' + i }));
r = IMP.parseText(JSON.stringify(big), 'big.json');
check('máximo 400 mensajes por chat (los últimos)', r.chats[0].msgs.length === 400 && r.chats[0].msgs[399].content === 'm899');
r = IMP.parseText(JSON.stringify([{ role:'user', content:'x'.repeat(50000) }, { role:'assistant', content:'y' }]), 'l.json');
check('mensajes muy largos se recortan', r.chats[0].msgs[0].content.length < 30100);

console.log('\n' + ok + ' bien, ' + bad + ' mal');
process.exit(bad ? 1 : 0);
