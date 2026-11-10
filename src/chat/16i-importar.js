/* ---------- 2026-11-09 · Importar chats y memoria desde otras IAs (ChatGPT, Claude, JSON, Markdown) ----------
   Encendido para todos desde v4.5. Sale en el menú «⋯» y en Ajustes › Tus IAs.
   Paso 1: eliges archivos (o pegas texto). Paso 2: ves todo y marcas qué traer. Paso 3: listo, con botón para abrirlo.
   Los archivos se leen aquí (IMP, 05h); se guardan como chats normales de la IA que tienes elegida y los recuerdos
   pasan por memAddCore (sin duplicar, máx. 40). Lo ya importado se recuerda (st().impIds) para no traerlo dos veces. */
/* v4.5 (Sammuel, 9 nov: «lo de importar queda para todos»): ENCENDIDO para todos. ?importar=0 lo esconde solo en ese navegador
   (por si alguien quiere probar sin él); ?importar=1 lo vuelve a mostrar. */
const IMP_ON = (() => {
  try{
    const q = new URLSearchParams(location.search).get('importar');
    if (q === '0') localStorage.setItem('synthz:f:importar', '0'); else if (q === '1') localStorage.removeItem('synthz:f:importar');
    return localStorage.getItem('synthz:f:importar') !== '0';
  }catch(e){ return true; }
})();
const IMP_SRC = { chatgpt:'ChatGPT', claude:'Claude', synthflow:'SynthFlow', json:'JSON', texto:'Texto' };
const IMP_MAX = 200, IMP_PRE = 50, MEM_CAP = 40;
const impL = (es, en) => SZ.lang() === 'en' ? en : es;
function impOpen(){
  if ($('#impm')) return;
  const o = document.createElement('div'); o.id = 'impm'; o.className = 'szm impm notr';
  const ICO_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>';
  const tip = (name, es, en) => '<details class="imp-how"><summary>' + name + '</summary><p>' + impL(es, en) + '</p></details>';
  o.innerHTML = '<div class="tcard imp-card" role="dialog" aria-modal="true" aria-labelledby="impT">'
    + '<i class="imp-staff" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b></i>'
    + '<button type="button" class="imp-x" data-imp="close" aria-label="' + impL('Cerrar', 'Close') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'
    /* paso 1 */
    + '<section data-step="1"><p class="imp-k">' + impL('Importar', 'Import') + '</p><h3 id="impT">' + impL('Trae tus chats y tu memoria', 'Bring your chats and memory') + '</h3>'
    + '<p class="imp-sub">' + impL('Desde ChatGPT, Claude u otra IA. Primero ves todo y eliges qué traer.', 'From ChatGPT, Claude or another AI. You see everything first and choose what to bring.') + '</p>'
    + '<label class="imp-drop" for="impFile">' + ICO_UP + '<b>' + impL('Arrastra aquí tus archivos', 'Drop your files here') + '</b><small>' + impL('o toca para elegirlos · .zip, .json, .md o .txt', 'or tap to choose them · .zip, .json, .md or .txt') + '</small>'
    + '<input id="impFile" type="file" multiple accept=".zip,.json,.md,.markdown,.txt,application/zip,application/json,text/plain,text/markdown"></label>'
    + '<div class="imp-hows">'
    + tip('ChatGPT', 'Ajustes › Controles de datos › <b>Exportar datos</b>. Te llega un correo con un .zip: súbelo tal cual. Su memoria no viene en el .zip: pregúntale «Haz una lista de todo lo que recuerdas de mí» y pega la respuesta abajo.', 'Settings › Data controls › <b>Export data</b>. You get an email with a .zip: upload it as is. Its memory is not in the .zip: ask it «Make a list of everything you remember about me» and paste the answer below.')
    + tip('Claude', 'Ajustes › Privacidad › <b>Exportar datos</b>. Sube el .zip que te llega: trae tus chats y, si la tienes, tu memoria.', 'Settings › Privacy › <b>Export data</b>. Upload the .zip you get: it brings your chats and, if you have it, your memory.')
    + tip(impL('Otra IA', 'Another AI'), 'Un .json con mensajes, o un .md/.txt con «Usuario:» y «Asistente:». Una lista sin esas marcas se lee como cosas para recordar.', 'A .json with messages, or a .md/.txt with «User:» and «Assistant:». A list without those marks is read as things to remember.')
    + '</div>'
    + '<div class="imp-paste"><textarea id="impTxt" rows="3" placeholder="' + impL('…o pega aquí lo que tu otra IA recuerda de ti (o una conversación)', '…or paste here what your other AI remembers about you (or a conversation)') + '" aria-label="' + impL('Pegar texto', 'Paste text') + '"></textarea><button type="button" class="btn sm ghost" data-imp="paste">' + impL('Leer', 'Read') + '</button></div>'
    + '<p class="imp-priv">' + impL('Se lee aquí mismo, en tu navegador. Solo se guarda lo que elijas, igual que tus otros chats.', 'It is read right here, in your browser. Only what you choose is saved, like your other chats.') + '</p></section>'
    /* leyendo */
    + '<section data-step="0" hidden class="imp-load"><i class="imp-tune" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b></i><p>' + impL('Leyendo tus archivos…', 'Reading your files…') + '</p></section>'
    /* paso 2 */
    + '<section data-step="2" hidden><p class="imp-k">' + impL('Vista previa', 'Preview') + '</p><h3>' + impL('Elige qué traer', 'Choose what to bring') + '</h3><p class="imp-sum" aria-live="polite"></p><div class="imp-lists"></div>'
    + '<div class="tbtn imp-foot"><button class="lnk" type="button" data-imp="back">' + impL('Volver', 'Back') + '</button><button class="btn sm" type="button" data-imp="go"></button></div></section>'
    /* paso 3 */
    + '<section data-step="3" hidden class="imp-done"><svg class="imp-ok" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/><path d="M15 27l7 7 15-16"/></svg><h3></h3><p class="imp-sub"></p>'
    + '<div class="tbtn imp-foot"><button class="lnk" type="button" data-imp="close">' + impL('Cerrar', 'Close') + '</button><button class="btn sm" type="button" data-imp="open">' + impL('Abrir el más reciente', 'Open the latest') + '</button></div></section>'
    + '</div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const back = document.activeElement; let gone = false, data = null, last = null;
  const step = n => { $$('section[data-step]', o).forEach(s => { s.hidden = s.dataset.step !== String(n); }); const f = $('section[data-step="' + n + '"] h3', o); if (f){ f.tabIndex = -1; f.focus({ preventScroll:true }); } };
  const close = () => { if (gone) return; gone = true; removeEventListener('keydown', key, true); o.classList.remove('on'); setTimeout(() => o.remove(), 400); try{ if (back && back.focus) back.focus(); }catch(e){} };
  const key = e => { if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); close(); } };
  addEventListener('keydown', key, true);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  const done0 = () => new Set(st().impIds || []);
  const idOf = c => c.src + ':' + (c.sid || c.title + ':' + c.msgs.length);
  async function read(fn){
    step(0);
    const t0 = Date.now(); let r;
    try{ r = await fn(); }catch(e){ r = { chats:[], mem:[], bad:['?'] }; }
    await new Promise(res => setTimeout(res, Math.max(0, 500 - (Date.now() - t0))));   /* que el «leyendo» se alcance a ver */
    const had = done0(), memNow = new Set(((st().mem || {}).items || []).map(x => x.text.toLowerCase()));
    r.chats.forEach(c => { c.id = idOf(c); c.old = had.has(c.id); });
    r.mem = r.mem.filter(x => !memNow.has(x.toLowerCase()));
    const fresh = r.chats.filter(c => !c.old); fresh.forEach((c, i) => { c.on = i < IMP_PRE; });
    const free = Math.max(0, MEM_CAP - ((st().mem || {}).items || []).length);
    data = { chats:r.chats, mem:r.mem.map((text, i) => ({ text, on:i < free })), bad:r.bad || [], free, q:'' };
    if (!r.chats.length && !r.mem.length){ step(1); toast(data.bad.length ? impL('No pude leer ' + data.bad.join(', ') + '. ¿Es el archivo que te mandó tu otra IA?', "I couldn't read " + data.bad.join(', ') + '. Is it the file your other AI sent you?') : impL('No encontré chats ni recuerdos ahí.', "I didn't find chats or memories there.")); return; }
    paint(); step(2);
  }
  const fmtD = t => t ? new Date(t).toLocaleDateString(SZ.lang() === 'en' ? 'en-US' : 'es-CO', { day:'numeric', month:'short', year:'numeric' }) : '';
  function paint(){
    const d = data, q = d.q.toLowerCase(), nC = d.chats.filter(c => c.on).length, nM = d.mem.filter(m => m.on).length, nOld = d.chats.filter(c => c.old).length;
    const L = d.chats.filter(c => !q || c.title.toLowerCase().includes(q) || c.msgs.some(m => m.content.toLowerCase().includes(q)));
    const firstU = c => { const u = c.msgs.find(m => m.role === 'user'); return u ? u.content.replace(/\s+/g, ' ').slice(0, 110) : ''; };
    let h = '';
    if (d.chats.length){
      h += '<div class="imp-grp"><div class="imp-gh"><b>' + impL('Chats', 'Chats') + ' <em>' + d.chats.length + '</em></b>'
        + (d.chats.length > 6 ? '<input class="imp-q" type="search" value="' + esc(d.q) + '" placeholder="' + impL('Buscar…', 'Search…') + '" aria-label="' + impL('Buscar en los chats', 'Search the chats') + '">' : '')
        + '<button type="button" class="lnk" data-imp="allc">' + (nC ? impL('Ninguno', 'None') : impL('Todos', 'All')) + '</button></div><ul class="imp-l" role="list">'
        + L.slice(0, 400).map(c => '<li' + (c.old ? ' class="old"' : '') + '><label><input type="checkbox" data-c="' + esc(c.id) + '"' + (c.on ? ' checked' : '') + (c.old ? ' disabled' : '') + '><span class="imp-t"><b></b><small>' + esc(IMP_SRC[c.src] || c.src) + ' · ' + impL(c.msgs.length + ' mensajes', c.msgs.length + ' messages') + (c.t ? ' · ' + esc(fmtD(c.t)) : '') + (c.old ? ' · ' + impL('ya lo trajiste', 'already imported') : '') + '</small><i></i></span></label></li>').join('')
        + (L.length > 400 ? '<li class="imp-more">' + impL('…y ' + (L.length - 400) + ' más: búscalos arriba', '…and ' + (L.length - 400) + ' more: search for them above') + '</li>' : '')
        + (!L.length ? '<li class="imp-more">' + impL('Nada coincide.', 'Nothing matches.') + '</li>' : '') + '</ul></div>';
    }
    if (d.mem.length){
      h += '<div class="imp-grp"><div class="imp-gh"><b>' + impL('Para recordar', 'To remember') + ' <em>' + d.mem.length + '</em></b><button type="button" class="lnk" data-imp="allm">' + (nM ? impL('Ninguno', 'None') : impL('Todos', 'All')) + '</button></div>'
        + '<p class="imp-note">' + (d.free ? impL('Tu memoria tiene espacio para ' + d.free + ' cosas más. Lo repetido se actualiza, no se duplica.', 'Your memory has room for ' + d.free + ' more things. Repeats are updated, not duplicated.') : impL('Tu memoria está llena (40). Olvida algo en Ajustes para hacer espacio.', 'Your memory is full (40). Forget something in Settings to make room.')) + '</p>'
        + '<ul class="imp-l mem" role="list">' + d.mem.map((m, i) => '<li><label><input type="checkbox" data-m="' + i + '"' + (m.on ? ' checked' : '') + '><span class="imp-t"><b></b></span></label></li>').join('') + '</ul></div>';
    }
    const box = $('.imp-lists', o); box.innerHTML = h;
    /* los textos que vienen de afuera van con textContent, nunca como HTML */
    $$('[data-c]', box).forEach(x => { const c = d.chats.find(cc => cc.id === x.dataset.c); const li = x.closest('li'); $('.imp-t b', li).textContent = c.title || firstU(c) || impL('Conversación', 'Conversation'); $('.imp-t i', li).textContent = c.title ? firstU(c) : ''; });
    $$('[data-m]', box).forEach(x => { $('.imp-t b', x.closest('li')).textContent = d.mem[+x.dataset.m].text; });
    const qi = $('.imp-q', box); if (qi && d.qf){ qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); d.qf = false; }
    sum();
  }
  function sum(){
    const d = data, nC = d.chats.filter(c => c.on).length, nM = d.mem.filter(m => m.on).length, nOld = d.chats.filter(c => c.old).length;
    const pl = (n, a, b) => n + ' ' + (n === 1 ? a : b);
    $('.imp-sum', o).textContent = impL('Encontré ' + pl(d.chats.length, 'chat', 'chats') + ' y ' + pl(d.mem.length, 'cosa para recordar', 'cosas para recordar') + '.', 'I found ' + pl(d.chats.length, 'chat', 'chats') + ' and ' + pl(d.mem.length, 'thing to remember', 'things to remember') + '.')
      + (nOld ? impL(' ' + nOld + ' ya los habías traído.', ' ' + nOld + ' you had already imported.') : '') + (d.bad.length ? impL(' No pude leer: ' + d.bad.join(', ') + '.', " Couldn't read: " + d.bad.join(', ') + '.') : '');
    const go = $('[data-imp="go"]', o), over = nC > IMP_MAX || nM > d.free;
    go.disabled = (!nC && !nM) || over;
    go.textContent = nC > IMP_MAX ? impL('Máximo ' + IMP_MAX + ' chats por vez', 'Up to ' + IMP_MAX + ' chats at a time') : nM > d.free ? impL('Solo caben ' + d.free + ' recuerdos', 'Only ' + d.free + ' memories fit')
      : !nC && !nM ? impL('Marca algo para traer', 'Pick something to bring') : impL('Traer ', 'Bring ') + [nC ? pl(nC, 'chat', 'chats') : '', nM ? pl(nM, impL('recuerdo', 'memory'), impL('recuerdos', 'memories')) : ''].filter(Boolean).join(impL(' y ', ' and '));
  }
  function apply(){
    const d = data, chats = d.chats.filter(c => c.on && !c.old), mem = d.mem.filter(m => m.on).slice(0, d.free);
    const model = st().model.openrouter || APODEX, ids = st().impIds || [];
    let n = 0, firstKey = null;
    chats.forEach((c, i) => {
      const tid = 't' + Date.now().toString(36) + i.toString(36) + Math.random().toString(36).slice(2, 5);
      st().chats['openrouter::' + model + '::' + tid] = c.msgs.map(m => ({ role:m.role, content:m.content }));
      const e = thMeta(model, tid, true); e.title = (c.title || (c.msgs.find(m => m.role === 'user') || { content:'' }).content).replace(/\s+/g, ' ').trim().slice(0, 60) || impL('Conversación importada', 'Imported conversation');
      e.t = c.t || Date.now() - i; e.manual = true; e.imp = c.src;
      ids.push(c.id); n++; if (!firstKey) firstKey = { model, id:tid };
    });
    st().impIds = ids.slice(-3000);
    save();
    let k = 0; mem.forEach(m => { if (SZ.memAddCore(m.text)) k++; });
    last = firstKey; renderChats(true);
    $('.imp-done h3', o).textContent = impL('¡Listo! Ya están aquí', 'Done! They are here');
    $('.imp-done .imp-sub', o).textContent = [n ? impL(n + (n === 1 ? ' chat quedó' : ' chats quedaron') + ' en tu lista de la izquierda, para seguirlos con cualquier IA.', n + (n === 1 ? ' chat is' : ' chats are') + ' in your list on the left, ready to continue with any AI.') : '', k ? impL(k + (k === 1 ? ' cosa nueva' : ' cosas nuevas') + ' en «Lo que recuerdo de ti».', k + (k === 1 ? ' new thing' : ' new things') + ' in «What I remember about you».') : ''].filter(Boolean).join(' ');
    $('[data-imp="open"]', o).hidden = !last;
    step(3);
  }
  o.addEventListener('change', e => {
    if (e.target.id === 'impFile'){ const fs = [...e.target.files]; e.target.value = ''; if (fs.length) read(() => IMP.parseFiles(fs)); return; }
    const c = e.target.closest('[data-c]'), m = e.target.closest('[data-m]');
    if (c){ const x = data.chats.find(cc => cc.id === c.dataset.c); if (x) x.on = c.checked; sum(); paintAll(); }
    if (m){ data.mem[+m.dataset.m].on = m.checked; sum(); paintAll(); }
  });
  const paintAll = () => { const nC = data.chats.some(c => c.on), nM = data.mem.some(m => m.on); const a = $('[data-imp="allc"]', o), b = $('[data-imp="allm"]', o); if (a) a.textContent = nC ? impL('Ninguno', 'None') : impL('Todos', 'All'); if (b) b.textContent = nM ? impL('Ninguno', 'None') : impL('Todos', 'All'); };
  o.addEventListener('input', e => { if (e.target.classList.contains('imp-q')){ data.q = e.target.value; data.qf = true; paint(); } });
  o.addEventListener('click', e => {
    const b = e.target.closest('[data-imp]'); if (!b) return; const a = b.dataset.imp;
    if (a === 'close') close();
    else if (a === 'paste'){ const t = $('#impTxt', o).value; if (!t.trim()){ $('#impTxt', o).focus(); return; } read(async () => { const r = IMP.parseText(t, 'pegado.txt'); return { chats:r.chats, mem:r.mem, bad:[] }; }); }
    else if (a === 'back') step(1);
    else if (a === 'go') apply();
    else if (a === 'allc'){ const on = !data.chats.some(c => c.on); data.chats.filter(c => !c.old).forEach((c, i) => { c.on = on && i < IMP_MAX; }); paint(); }
    else if (a === 'allm'){ const on = !data.mem.some(m => m.on); data.mem.forEach((m, i) => { m.on = on && i < data.free; }); paint(); }
    else if (a === 'open' && last){ const l = last; close(); setTimeout(() => openThread(l.model, l.id), 250); }
  });
  /* arrastrar y soltar */
  const drop = $('.imp-drop', o);
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('over')));
  drop.addEventListener('drop', e => { e.preventDefault(); const fs = [...(e.dataTransfer && e.dataTransfer.files || [])]; if (fs.length) read(() => IMP.parseFiles(fs)); });
  setTimeout(() => { const h = $('#impT', o); if (h){ h.tabIndex = -1; h.focus({ preventScroll:true }); } }, 60);
}
if (IMP_ON){
  SZ.importOpen = impOpen;
  SZ.cfgLinks.unshift(['Importar de otra IA', () => impOpen(), 'Trae tus chats y lo que recuerda ChatGPT, Claude u otra']);
}
