/* ---------- 2026-11-09 · Importar chats y memoria: LECTOR (sin pantalla, se puede probar aparte: t/importar/importar.mjs) ----------
   Entiende lo que exportan otras IAs y lo convierte en conversaciones y recuerdos de SynthFlow:
   · ChatGPT: el .zip de «Exportar datos» o su conversations.json (árbol «mapping»: se sigue la rama que estaba abierta).
   · Claude: el .zip de «Exportar datos» o su conversations.json (chat_messages) y memories.json (la memoria en texto).
   · JSON genérico: [{role, content}], {messages:[…]}, [{title, messages:[…]}] o la copia de SynthFlow ({chats:{…}}).
   · Markdown / texto: con marcas «## Tú», «Usuario:», «Assistant:»… es un chat; sin marcas, una lista de recuerdos.
   Nada sale del navegador: todo se lee aquí. Devuelve { chats:[{ src, sid, title, t, msgs:[{role, content}] }], mem:[texto], skipped }. */
const IMP = (() => {
  const MAX_MSG = 400, MAX_TXT = 30000, MAX_MEM = 300;
  const str = v => typeof v === 'string' ? v : '';
  const clip = s => s.length > MAX_TXT ? s.slice(0, MAX_TXT) + '\n\n[…]' : s;
  const ms = v => { if (v == null || v === '') return 0; if (typeof v === 'number') return v < 1e12 ? Math.round(v * 1000) : Math.round(v); const d = Date.parse(v); return Number.isFinite(d) ? d : 0; };
  const USER_R = /^(user|human|humano|usuario|you|t[uú]|yo|me|persona|prompt)$/i;
  const BOT_R = /^(assistant|asistente|ai|ia|bot|model|modelo|gpt|chatgpt|claude|gemini|copilot|llama|mistral|deepseek|grok|perplexity|synthflow|synthonia|response|respuesta)$/i;
  const role = r => { r = str(r).trim(); return USER_R.test(r) ? 'user' : BOT_R.test(r) ? 'assistant' : ''; };
  /* texto de un mensaje en cualquiera de las formas habituales */
  function textOf(c){
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) return c.map(x => typeof x === 'string' ? x : x && (x.type === 'text' || x.type == null) ? str(x.text) || str(x.content) : '').filter(Boolean).join('\n\n');
    if (c && typeof c === 'object'){ if (Array.isArray(c.parts)) return textOf(c.parts); return str(c.text) || str(c.content) || str(c.value); }
    return '';
  }
  /* une mensajes seguidos del mismo lado (ChatGPT parte una respuesta cuando usa herramientas) y descarta los vacíos */
  function tidy(list){
    const out = [];
    list.forEach(m => {
      const content = str(m.content).replace(/\r\n?/g, '\n').trim(); if (!m.role || !content) return;
      const last = out[out.length - 1];
      if (last && last.role === m.role) last.content = clip(last.content + '\n\n' + content); else out.push({ role:m.role, content:clip(content) });
    });
    return out.slice(-MAX_MSG);
  }
  const conv = (src, sid, title, t, msgs) => { msgs = tidy(msgs); return msgs.length ? { src, sid:String(sid || ''), title:str(title).replace(/\s+/g, ' ').trim().slice(0, 60), t:t || 0, msgs } : null; };

  /* ---- ChatGPT: cada conversación es un árbol; se camina desde el último mensaje (current_node) hacia arriba ---- */
  const isGpt = c => c && typeof c === 'object' && c.mapping && typeof c.mapping === 'object';
  function fromGpt(c){
    const M = c.mapping, path = [];
    let id = c.current_node && M[c.current_node] ? c.current_node : null;
    if (!id){ /* sin current_node: el último nodo sin hijos */ const ks = Object.keys(M).filter(k => !(M[k].children || []).length); id = ks[ks.length - 1]; }
    const seen = new Set();
    while (id && M[id] && !seen.has(id)){ seen.add(id); path.push(M[id]); id = M[id].parent; }
    path.reverse();
    const msgs = path.map(n => n && n.message).filter(m => m && m.author && !(m.metadata && (m.metadata.is_visually_hidden_from_conversation || m.metadata.is_user_system_message)))
      .map(m => {
        const r = role(m.author.role), ct = m.content && m.content.content_type;
        if (!r || (ct && !/^(text|multimodal_text)$/.test(ct))) return null;
        const parts = (m.content.parts || []).map(p => typeof p === 'string' ? p : p && p.content_type === 'image_asset_pointer' ? '[imagen]' : '').filter(Boolean);
        return { role:r, content:parts.join('\n\n') };
      }).filter(Boolean);
    return conv('chatgpt', c.conversation_id || c.id, c.title, ms(c.update_time) || ms(c.create_time), msgs);
  }
  /* ---- Claude: chat_messages con sender human/assistant y bloques de texto ---- */
  const isClaude = c => c && typeof c === 'object' && Array.isArray(c.chat_messages);
  function fromClaude(c){
    const msgs = c.chat_messages.map(m => {
      let t = Array.isArray(m.content) && m.content.some(b => b && b.type === 'text') ? textOf(m.content.filter(b => b && b.type === 'text')) : str(m.text);
      const att = (m.attachments || []).concat(m.files || []).map(a => a && (a.file_name || a.name)).filter(Boolean);
      if (att.length) t += '\n\n[' + att.map(n => 'Archivo: ' + n).join(' · ') + ']';
      return { role:role(m.sender), content:t };
    });
    return conv('claude', c.uuid, c.name, ms(c.updated_at) || ms(c.created_at), msgs);
  }
  /* ---- genérico: una lista de mensajes {role|sender|author|from, content|text|message} ---- */
  const msgRole = m => role(m.role || m.sender || (m.author && (m.author.role || m.author)) || m.from || m.speaker);
  const isMsgList = a => Array.isArray(a) && a.length > 0 && a.filter(m => m && typeof m === 'object' && msgRole(m)).length >= Math.max(1, a.length * 0.6);
  const fromList = (src, a, title, sid, t) => conv(src, sid, title, t, a.map(m => m && typeof m === 'object' ? { role:msgRole(m), content:textOf(m.content != null ? m.content : m.text != null ? m.text : m.message != null ? m.message : m.parts) } : null).filter(Boolean));

  /* ---- memoria en texto: una línea por recuerdo (viñetas, números o frases sueltas); fuera títulos y relleno ---- */
  function memLines(text){
    const out = [];
    str(text).replace(/\r\n?/g, '\n').split('\n').forEach(l => {
      l = l.trim(); if (!l || /^#{1,6}\s/.test(l) || /^(\*\*|__)[^*_]{1,60}(\*\*|__):?$/.test(l) || /^(-{3,}|\*{3,}|_{3,}|```)/.test(l)) return;
      l = l.replace(/^(?:[-*•·◦▪►‣]|\d{1,3}[.)])\s+/, '').replace(/\*\*|__|`/g, '').replace(/^\[[ x]\]\s*/i, '').trim();
      if (l.length < 4 || /:$/.test(l)) return;
      /* un párrafo largo se parte en frases */
      (l.length > 300 ? l.split(/(?<=[.!?])\s+/) : [l]).forEach(s => { s = s.trim(); if (s.length >= 4) out.push(s.slice(0, 300)); });
    });
    return [...new Set(out)].slice(0, MAX_MEM);
  }
  /* cualquier campo con «memor» en el nombre (memories.json de Claude: conversations_memory, project_memories…) */
  function memOf(o, depth){
    const out = []; if (!o || typeof o !== 'object' || depth > 4) return out;
    if (Array.isArray(o)){ o.forEach(x => { if (typeof x === 'string') out.push(...memLines(x)); else out.push(...memOf(x, depth + 1)); }); return out; }
    Object.keys(o).forEach(k => {
      const v = o[k];
      if (/memor|recuerd|facts?$/i.test(k)){
        if (typeof v === 'string') out.push(...memLines(v));
        else if (Array.isArray(v)) v.forEach(x => { if (typeof x === 'string') out.push(...memLines(x)); else if (x && typeof x === 'object') out.push(...memLines(str(x.text) || str(x.content) || str(x.memory) || str(x.value))); out.push(...memOf(x, depth + 1)); });
        else if (v && typeof v === 'object') Object.keys(v).forEach(kk => { if (typeof v[kk] === 'string') out.push(...memLines(v[kk])); else out.push(...memOf(v[kk], depth + 1)); });
      } else if (v && typeof v === 'object' && depth < 2) out.push(...memOf(v, depth + 1));
    });
    return out;
  }

  /* ---- JSON: decide qué es ---- */
  function fromJson(j, name){
    const res = { chats:[], mem:[], skipped:0 };
    const add = c => { if (c) res.chats.push(c); else res.skipped++; };
    const one = (x, i) => {
      if (isGpt(x)) return add(fromGpt(x));
      if (isClaude(x)) return add(fromClaude(x));
      if (x && typeof x === 'object' && isMsgList(x.messages)) return add(fromList('json', x.messages, x.title || x.name, x.id || x.uuid || name + ':' + i, ms(x.updated_at || x.update_time || x.created_at || x.date)));
      if (x && typeof x === 'object' && isMsgList(x.conversation)) return add(fromList('json', x.conversation, x.title || x.name, x.id || name + ':' + i, ms(x.updated_at || x.date)));
      return false;
    };
    if (isMsgList(j)) add(fromList('json', j, '', name, 0));
    else if (Array.isArray(j)) j.forEach((x, i) => { if (one(x, i) === false) res.mem.push(...memOf(x, 1)); });
    else if (j && typeof j === 'object'){
      if (one(j, 0) === false){
        if (Array.isArray(j.conversations)) j.conversations.forEach((x, i) => one(x, i));
        /* la copia de SynthFlow: { chats:{ 'openrouter::modelo::tid':[…] }, threads:{…} } */
        if (j.chats && typeof j.chats === 'object' && !Array.isArray(j.chats)) Object.keys(j.chats).forEach(k => { if (isMsgList(j.chats[k])){ const p = k.split('::'), tid = p[2] || '', th = ((j.threads || {})[p[1]] || []).find(e => e && e.id === tid) || {}; add(fromList('synthflow', j.chats[k], th.title, k, th.t || 0)); } });
        if (Array.isArray(j.chats)) j.chats.forEach((x, i) => one(x, i));
        res.mem.push(...memOf(j, 0));
      }
    }
    return res;
  }

  /* ---- Markdown / texto: ¿tiene marcas de quién habla? ---- */
  /* «Usuario: hola», «**Tú:** hola», «**Claude**: …», «### Assistant» o «**ChatGPT**» sola en su línea */
  const MARK_IN = /^\s*(?:#{1,4}\s*)?(?:\*\*|__)?([\p{L}][\p{L}\d .-]{0,30}?)(?:\*\*|__)?\s*[:：]\s*(?:\*\*|__)?\s*(.*)$/u;
  const MARK_SOLO = /^\s*(?:#{1,4}\s*(?:\*\*|__)?|\*\*|__)([\p{L}][\p{L}\d .-]{0,30}?)(?:\*\*|__)?\s*$/u;
  function fromText(text, name){
    text = str(text).replace(/\r\n?/g, '\n').replace(/^﻿/, '');
    const lines = text.split('\n'), msgs = []; let cur = null, mine = false, users = 0;
    /* la copia que hace SynthFlow («Descargar como texto»): «## Tú» y luego «## Nombre de la IA» */
    const own = /^##\s+(T[uú]|You)\s*$/m.test(text);
    lines.forEach(l => {
      let r = '', rest = '';
      const h = own && /^##\s+\S/.test(l) ? l.replace(/^##\s+/, '').trim() : null;
      if (h != null){ if (/^(T[uú]|You)$/i.test(h)){ r = 'user'; } else if (cur && cur.role === 'user'){ r = 'assistant'; } }
      else {
        const a = l.match(MARK_SOLO), b = !a && l.match(MARK_IN);
        if (a && role(a[1])) r = role(a[1]);
        else if (b && role(b[1])){ r = role(b[1]); rest = str(b[2]); }
      }
      if (r){ if (cur) msgs.push(cur); cur = { role:r, content:rest }; if (r === 'user') users++; mine = true; return; }
      if (cur) cur.content += (cur.content ? '\n' : '') + l;
    });
    if (cur) msgs.push(cur);
    if (mine && users && msgs.some(m => m.role === 'assistant')){
      const first = msgs.find(m => m.role === 'user'), title = str(name).replace(/\.(md|markdown|txt)$/i, '').replace(/[_-]+/g, ' ').trim();
      const c = conv(own ? 'synthflow' : 'texto', name, /^(chat( |$)|pegado$)/i.test(title) || !title ? (first ? first.content.split('\n')[0] : '') : title, 0, msgs);
      return { chats:c ? [c] : [], mem:[], skipped:c ? 0 : 1 };
    }
    return { chats:[], mem:memLines(text), skipped:0 };
  }

  /* ---- .zip sin librerías: se lee el índice del final y se descomprime con DecompressionStream ---- */
  async function unzip(buf, want){
    const v = new DataView(buf), u8 = new Uint8Array(buf), out = [];
    let e = -1; for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--){ if (v.getUint32(i, true) === 0x06054b50){ e = i; break; } }
    if (e < 0) throw new Error('zip');
    const n = v.getUint16(e + 10, true); let p = v.getUint32(e + 16, true);
    const dec = new TextDecoder();
    for (let k = 0; k < n && p + 46 <= buf.byteLength; k++){
      if (v.getUint32(p, true) !== 0x02014b50) break;
      const method = v.getUint16(p + 10, true), csize = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), off = v.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nl)); p += 46 + nl + xl + cl;
      if (/\/$/.test(name) || !want(name)) continue;
      const lo = off + 30 + v.getUint16(off + 26, true) + v.getUint16(off + 28, true), raw = u8.subarray(lo, lo + csize);
      let data;
      if (method === 0) data = raw;
      else if (method === 8 && typeof DecompressionStream === 'function') data = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
      else continue;
      out.push({ name, text:dec.decode(data) });
    }
    return out;
  }
  const NOISE = /(^|\/)(users?|projects?|message_feedback|shared_conversations|model_comparisons|user_settings|group_chats|sora|chat)\.(json|html)$/i;
  const wantIn = n => /\.(json|md|markdown|txt)$/i.test(n) && !NOISE.test(n) && !/(^|\/)(__MACOSX|\.)/.test(n);

  function merge(into, r){ into.chats.push(...r.chats); into.mem.push(...r.mem); into.skipped += r.skipped || 0; return into; }
  /* lee un texto ya abierto (sirve para el cuadro de «pegar» y para las pruebas) */
  function parseText(text, name){
    name = str(name) || 'pegado.txt';
    const t = str(text).trim(); if (!t) return { chats:[], mem:[], skipped:0 };
    if (/\.json$/i.test(name) || /^[[{]/.test(t)){ try{ return fromJson(JSON.parse(t), name); }catch(e){ if (/\.json$/i.test(name)) return { chats:[], mem:[], skipped:1, bad:true }; } }
    return fromText(t, name);
  }
  /* lee archivos del navegador (File/Blob con .name) */
  async function parseFiles(files){
    const all = { chats:[], mem:[], skipped:0, bad:[] };
    for (const f of files){
      try{
        if (/\.zip$/i.test(f.name) || f.type === 'application/zip' || f.type === 'application/x-zip-compressed'){
          const inner = await unzip(await f.arrayBuffer(), wantIn);
          if (!inner.length) all.bad.push(f.name);
          inner.forEach(x => merge(all, parseText(x.text, x.name.split('/').pop())));
        } else {
          const r = parseText(await f.text(), f.name); if (r.bad) all.bad.push(f.name); merge(all, r);
        }
      }catch(e){ all.bad.push(f.name); }
    }
    /* sin repetidos: misma fuente + mismo id, y recuerdos iguales */
    const seen = new Set(); all.chats = all.chats.filter(c => { const k = c.src + ':' + (c.sid || c.title + c.msgs.length); if (seen.has(k)) return false; seen.add(k); return true; });
    all.chats.sort((a, b) => (b.t || 0) - (a.t || 0));
    all.mem = [...new Set(all.mem)].slice(0, MAX_MEM);
    return all;
  }
  return { parseText, parseFiles, unzip, memLines, fromJson, fromText };
})();
