/* ---------- detener la respuesta (botón o Esc) ---------- */
const ctls = new Set();
function stopNow(){ let did = false; if (ctls.size){ ctls.forEach(c => c.abort()); ctls.clear(); did = true; } if (SZ.reveals.size){ SZ.reveals.forEach(r => r.skip()); did = true; } if (did) toast('Respuesta detenida.'); return did; }
addEventListener('keydown', e => { if (e.key === 'Escape' && !document.querySelector('.szm,#blk,#acc,#sx,#conn,#tour') && stopNow()) e.preventDefault(); });

/* borrar el chat actual (antes era el botón «Limpiar»; ahora vive en el menú «⋯») */
async function clearChat(ask){
  if (mode === 'cmp'){ stopNow(); cmpRun++; cmpLast = null; Object.keys(busy).forEach(k => delete busy[k]); renderMsgs(); renderNow(); return; }
  if (!chatArr().length) return;
  if (ask && !(await SZ.szConfirm('¿Borrar este chat?', 'Se borran sus mensajes de este dispositivo y de tu cuenta. No se puede deshacer.', 'Borrar', true))) return;
  gen++; Object.keys(busy).forEach(k => delete busy[k]);
  st().chats[ckey()] = []; save(); renderMsgs(); renderNow(); renderChats();
}
/* ---------- favoritos: la estrella vuela dorada hasta tu colección ---------- */
function toggleStar(el, btn){
  const chat = st().chats[el._ck], m = chat && chat[el._ci];
  if (!m || m.role !== 'assistant' || m.content !== el._raw){ toast('Esta respuesta cambió; vuelve a intentarlo.'); return; }
  m.star = !m.star || undefined; save();
  btn.setAttribute('aria-pressed', String(!!m.star)); $('span', btn).textContent = m.star ? 'Favorita' : 'Guardar';
  el.classList.toggle('starred', !!m.star);
  if (m.star){ flyStar(btn); toast('Guardada en tus favoritos ★'); } else toast('Quitada de tus favoritos.');
  if (cView === 'favs') renderChats();
}
function flyStar(from){
  const t = isMobile() ? $('#tabbar [data-tab="chats"]') : $('#railFav');
  const ping = () => { if (!t) return; t.classList.remove('got'); void t.offsetWidth; t.classList.add('got'); };
  if (!t || root.classList.contains('noanim') || SZ.reduce){ ping(); return; }
  const a = from.getBoundingClientRect(), b = t.getBoundingClientRect();
  const x0 = a.left + 16, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
  const cx = (x0 + x1) / 2 + (x1 < x0 ? 40 : -40), cy = Math.min(y0, y1) - Math.min(220, Math.abs(x1 - x0) * .4 + 80);
  const s = document.createElement('div'); s.className = 'flystar'; s.innerHTML = STAR; document.body.appendChild(s);
  const D = 950, t0 = performance.now(); let f = 0;
  const step = now => {
    const k = Math.min(1, (now - t0) / D), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, u = 1 - e;
    const x = u * u * x0 + 2 * u * e * cx + e * e * x1, y = u * u * y0 + 2 * u * e * cy + e * e * y1;
    s.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + (1 + Math.sin(e * Math.PI) * .9) + ') rotate(' + (e * 400) + 'deg)';
    if (++f % 2 === 0){ const d = document.createElement('i'); d.className = 'flytrail'; d.style.transform = 'translate(' + x + 'px,' + y + 'px)'; document.body.appendChild(d); d.animate([{ opacity:.9, transform:'translate(' + x + 'px,' + y + 'px) scale(1)' }, { opacity:0, transform:'translate(' + (x + (Math.random() * 10 - 5)) + 'px,' + (y + 8) + 'px) scale(.2)' }], { duration:620, easing:'ease-out' }).onfinish = () => d.remove(); }
    if (k < 1) requestAnimationFrame(step); else { s.remove(); ping(); burst(x1, y1, ['#e6b65f', '#ffe2a8', '#c9566c'], 10); }
  };
  requestAnimationFrame(step);
}

/* ---------- archivos: imágenes, PDF y texto/código ---------- */
const files = []; let fid = 0;
const TEXTX = /\.(txt|md|markdown|csv|tsv|json|jsonl|xml|html?|css|scss|less|js|cjs|mjs|jsx|ts|tsx|py|ipynb|java|c|h|cpp|hpp|cs|go|rs|rb|php|sh|bat|ps1|sql|yml|yaml|toml|ini|cfg|conf|env|log|tex|swift|kt|kts|dart|scala|pl|r|lua|vue|svelte|astro|graphql|gql|proto|srt|vtt|rtf|svg|gradle|properties)$/i;
/* v3.4 · Word, Excel, PowerPoint y OpenDocument: se sacan sus textos en el navegador (son un .zip con XML adentro) */
const OFFX = /\.(docx|xlsx|pptx|odt|ods|odp)$/i;
const FILES_MAX = 10, CAP = 40000, clip = t => t.length > CAP ? t.slice(0, CAP) + '\n…(archivo recortado)' : t;
function readImg(file){
  return new Promise((ok, no) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const mk = max => { const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * s)); c.height = Math.max(1, Math.round(im.height * s)); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); return c; };
      const r = { dataUrl: mk(1280).toDataURL('image/jpeg', .84), thumb: mk(96).toDataURL('image/jpeg', .7) };   /* v3.4 · 1280 px: se ve igual de bien y viaja más rápido */
      URL.revokeObjectURL(url); ok(r);
    };
    im.onerror = () => { URL.revokeObjectURL(url); no(new Error('No pude leer la imagen ' + file.name + '.')); };
    im.src = url;
  });
}
let pdfP;
function loadPdf(){
  return pdfP || (pdfP = (async () => {
    const B = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
    await new Promise((ok, no) => { const s = document.createElement('script'); s.src = B + 'pdf.min.js'; s.onload = ok; s.onerror = () => no(new Error('No pude cargar el lector de PDF. Revisa tu internet.')); document.head.appendChild(s); });
    const w = await (await fetch(B + 'pdf.worker.min.js')).text();
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([w], { type:'text/javascript' }));
    return window.pdfjsLib;
  })().catch(e => { pdfP = null; throw e; }));
}
async function readPdf(file){
  const lib = await loadPdf(), task = lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  /* v3.8 · PDF con contraseña: se la pide a la persona (antes salía «No pude leer el PDF») */
  task.onPassword = (give, why) => {
    const en = SZ.lang() === 'en', nm = file.name || 'PDF';
    const pw = prompt(why === 2 ? (en ? 'That password did not work. Try again for «' + nm + '»:' : 'Esa contraseña no sirvió. Prueba otra vez para «' + nm + '»:') : (en ? '«' + nm + '» is locked. Type its password:' : '«' + nm + '» tiene contraseña. Escríbela para abrirlo:'));
    if (pw == null) task.destroy(); else give(pw);
  };
  const pdf = await task.promise;
  let t = '';
  for (let i = 1; i <= Math.min(pdf.numPages, 60) && t.length < CAP; i++){
    const tc = await (await pdf.getPage(i)).getTextContent();
    t += '\n--- página ' + i + ' ---\n' + tc.items.map(x => x.str).join(' ');
  }
  /* v3.4 · PDF escaneado (sin texto): sus primeras páginas se mandan como fotos, así una IA que ve lo puede leer */
  if (t.replace(/--- página \d+ ---/g, '').trim().length < 20){
    const pics = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 4); i++){
      const pg = await pdf.getPage(i), v0 = pg.getViewport({ scale:1 }), k = Math.min(2, 1280 / Math.max(v0.width, v0.height)), vp = pg.getViewport({ scale:k });
      const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvasContext:g, viewport:vp }).promise; pics.push(c.toDataURL('image/jpeg', .8));
    }
    if (!pics.length) throw new Error('Ese PDF está vacío.');
    return { scanned:true, pics, pages:pdf.numPages };
  }
  return clip(t.trim());
}
/* lector mínimo de .zip (sin librerías): lee el índice del final y descomprime con DecompressionStream.
   v3.8 · trabaja por pedazos del archivo (Blob.slice): un .zip de 500 MB ya no se carga entero en memoria */
async function zipOpen(src){
  const file = src instanceof Blob ? src : new Blob([src]), size = file.size, td = new TextDecoder();
  const tn = Math.min(size, 65557), tail = new DataView(await file.slice(size - tn).arrayBuffer());
  let e = tn - 22; while (e >= 0 && tail.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('El archivo está dañado.');
  let n = tail.getUint16(e + 10, true), cdLen = tail.getUint32(e + 12, true), cdAt = tail.getUint32(e + 16, true);
  if ((cdAt === 0xffffffff || n === 0xffff) && e >= 20 && tail.getUint32(e - 20, true) === 0x07064b50){   /* zip64 (más de 4 GB o 65.535 archivos) */
    const at = Number(tail.getBigUint64(e - 12, true)), z = new DataView(await file.slice(at, at + 56).arrayBuffer());
    n = Number(z.getBigUint64(32, true)); cdLen = Number(z.getBigUint64(40, true)); cdAt = Number(z.getBigUint64(48, true));
  }
  const dv = new DataView(await file.slice(cdAt, cdAt + cdLen).arrayBuffer()), ent = {};
  for (let i = 0, p = 0; i < n && p + 46 <= dv.byteLength; i++){
    const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
    let cs = dv.getUint32(p + 20, true), us = dv.getUint32(p + 24, true), lo = dv.getUint32(p + 42, true);
    if (cs === 0xffffffff || us === 0xffffffff || lo === 0xffffffff){   /* tamaños de zip64 en el campo extra */
      for (let q = p + 46 + nl, end = q + xl; q + 4 <= end;){ const id = dv.getUint16(q, true), ln = dv.getUint16(q + 2, true); if (id === 1){ let r = q + 4; if (us === 0xffffffff){ us = Number(dv.getBigUint64(r, true)); r += 8; } if (cs === 0xffffffff){ cs = Number(dv.getBigUint64(r, true)); r += 8; } if (lo === 0xffffffff) lo = Number(dv.getBigUint64(r, true)); break; } q += 4 + ln; }
    }
    ent[td.decode(new Uint8Array(dv.buffer, p + 46, nl))] = { m:dv.getUint16(p + 10, true), fl:dv.getUint16(p + 8, true), cs, us, lo };
    p += 46 + nl + xl + cl;
  }
  const blob = async (name, max = 60 * 1048576) => {
    const x = ent[name]; if (!x) return new Blob([]);
    if (x.fl & 1) throw new Error('Ese archivo tiene contraseña.');
    const h = new DataView(await file.slice(x.lo, x.lo + 30).arrayBuffer()), at = x.lo + 30 + h.getUint16(26, true) + h.getUint16(28, true), raw = file.slice(at, at + x.cs);
    if (x.m === 0) return raw;
    if (x.m !== 8 || typeof DecompressionStream === 'undefined') throw new Error('Tu navegador no puede abrir este archivo. Guárdalo como PDF y súbelo otra vez.');
    return inflate(raw.stream().pipeThrough(new DecompressionStream('deflate-raw')), max);
  };
  return { names:Object.keys(ent), size:k => (ent[k] || {}).us || 0, locked:k => !!((ent[k] || {}).fl & 1), blob, read:async name => (await blob(name, 24 * 1048576)).text() };
}
const xmlTxt = x => x.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&amp;/g, '&');
const byNum = (a, b) => (+(a.match(/(\d+)\.xml$/) || [])[1] || 0) - (+(b.match(/(\d+)\.xml$/) || [])[1] || 0);
async function readOffice(file){
  const z = await zipOpen(file), ext = file.name.split('.').pop().toLowerCase();
  let t = '';
  if (ext === 'docx'){
    const x = await z.read('word/document.xml');
    t = xmlTxt(x.replace(/<w:tab\/>/g, '\t').replace(/<w:br[^>]*\/>/g, '\n').replace(/<\/w:p>/g, '\n').replace(/<\/w:tc>/g, ' | ').replace(/<\/w:tr>/g, '\n'));
  } else if (ext === 'pptx'){
    const sl = z.names.filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort(byNum);
    for (let i = 0; i < sl.length && t.length < CAP; i++) t += '\n--- diapositiva ' + (i + 1) + ' ---\n' + xmlTxt((await z.read(sl[i])).replace(/<\/a:p>/g, '\n'));
  } else if (ext === 'xlsx'){
    const ss = [...(await z.read('xl/sharedStrings.xml')).matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => xmlTxt(m[1]));
    const sh = z.names.filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort(byNum);
    for (let i = 0; i < sh.length && t.length < CAP; i++){
      t += '\n--- hoja ' + (i + 1) + ' ---\n';
      for (const row of (await z.read(sh[i])).matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)){
        const cells = [...row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)].map(c => {
          const ty = (/\bt="(\w+)"/.exec(c[1]) || [])[1], v = (/<v>([\s\S]*?)<\/v>/.exec(c[2] || '') || [])[1];
          return ty === 's' ? (ss[+v] || '') : ty === 'inlineStr' ? xmlTxt((/<is>([\s\S]*?)<\/is>/.exec(c[2] || '') || [])[1] || '') : v != null ? xmlTxt(v) : '';
        });
        if (cells.some(Boolean)) t += cells.join('\t') + '\n';
        if (t.length > CAP) break;
      }
    }
  } else {
    t = xmlTxt((await z.read('content.xml')).replace(/<\/text:(p|h)>/g, '\n').replace(/<text:tab\/>/g, '\t').replace(/<\/table:table-cell>/g, '\t').replace(/<\/table:table-row>/g, '\n'));
  }
  t = t.replace(/\n{3,}/g, '\n\n').trim();
  if (t.length < 2) throw new Error('No encontré texto en «' + file.name + '».');
  return clip(t);
}
function renderTray(){
  $('#tray').innerHTML = files.map(f => '<span class="fc ' + f.state + '" data-id="' + f.id + '">' + (f.thumb ? '<img src="' + esc(f.thumb) + '" alt="">' : (SZ.fileIco(f.name.split('.').pop()) ? '<i class="ic img">' + SZ.fileIco(f.name.split('.').pop()) + '</i>' : '<i class="ic">' + esc((f.name.split('.').pop() || 'file').slice(0, 4)) + '</i>')) + '<b>' + esc(f.name) + '</b>' + (f.prog ? '<small class="fcp">' + esc(f.prog) + '</small>' : '') + '<button class="x" type="button" aria-label="Quitar archivo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span>').join('');
}
async function addFiles(list){
  /* v3.8 · cualquier archivo, en Individual y en Comparar: readAny nunca falla (lo que no sea texto se convierte o se describe) */
  for (const file of [...list]){
    if (files.length >= FILES_MAX){ toast('Máximo ' + FILES_MAX + ' archivos por mensaje.'); break; }
    const f = { id:++fid, name:file.name || 'archivo', state:'load', kind:'text', size:file.size }; files.push(f); renderTray();
    try{ await readAny(file, f); }
    catch(e){ console.warn('[archivos]', e); f.kind = 'text'; f.text = fichaTxt(file); }
    if (!f.text && f.kind !== 'img') f.text = fichaTxt(file);
    f.state = 'ok'; delete f.prog;
    renderTray();
  }
}
$('#tray').addEventListener('click', e => { const x = e.target.closest('.x'); if (!x) return; const i = files.findIndex(f => f.id === +x.closest('.fc').dataset.id); if (i > -1){ files.splice(i, 1); renderTray(); } });
/* el clip ya no abre el buscador de golpe: muestra un menú con lo que puedes adjuntar */
const attMenu = $('#attMenu'), attBtn = $('#attachBtn');
function attOpen(){ attMenu.hidden = false; attMenu.classList.remove('bye'); attBtn.setAttribute('aria-expanded', 'true'); }
function attClose(){ if (attMenu.hidden) return; attBtn.setAttribute('aria-expanded', 'false'); attMenu.classList.add('bye'); setTimeout(() => { if (attMenu.classList.contains('bye')){ attMenu.hidden = true; attMenu.classList.remove('bye'); } }, 260); }
attBtn.addEventListener('click', () => { if (attMenu.hidden) attOpen(); else attClose(); });
attMenu.addEventListener('click', e => { const b = e.target.closest('[data-att]'); if (!b) return; attClose(); const k = b.dataset.att; if (k === 'mkimg') return setImgMode(!imgMode); if (k === 'web'){ if (imgMode) setImgMode(false); return setWeb(!webOn); } $({ file:'#fileIn', img:'#imgIn', cam:'#camIn' }[k]).click(); });
document.addEventListener('pointerdown', e => { if (!attMenu.hidden && !e.target.closest('.attw')) attClose(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !attMenu.hidden){ e.preventDefault(); attClose(); attBtn.focus(); } });
['#fileIn', '#imgIn', '#camIn'].forEach(s => $(s).addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; }));
let dragN = 0; const hasF = e => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
addEventListener('dragenter', e => { if (hasF(e)){ dragN++; document.body.classList.add('drag'); } });
addEventListener('dragleave', () => { dragN = Math.max(0, dragN - 1); if (!dragN) document.body.classList.remove('drag'); });
addEventListener('dragover', e => { if (hasF(e)) e.preventDefault(); });
addEventListener('drop', e => { dragN = 0; document.body.classList.remove('drag'); if (hasF(e)){ e.preventDefault(); addFiles(e.dataTransfer.files); } });
inp.addEventListener('paste', e => { const fl = [...((e.clipboardData && e.clipboardData.files) || [])]; if (fl.length){ e.preventDefault(); addFiles(fl); } });
SZ.mirrorType(inp);
/* mensajes que viajan a la IA. Para ahorrar SynXCoin's: los archivos solo se reenvían
   completos en el último mensaje que los trajo, y el modo ahorro manda menos historial */
function apiMsgs(chat, vision, o = {}){
  const saver = !o.naive && st().sx.saver, keepN = saver ? 6 : 20;
  let lastF = -1;
  if (!o.naive) for (let i = chat.length - 1; i >= 0; i--) if (chat[i].role === 'user' && chat[i].files && chat[i].files.length){ lastF = i; break; }
  const start = Math.max(0, chat.length - keepN);
  const h = chat.slice(start).map((m, j) => {
    if (m.imgId) return null;
    const dk = m.role === 'user' && m.deck && start + j === chat.length - 1 ? DECK_INSTR : '', noDk = s => String(s || '').split(DECK_INSTR).join('');   /* la orden de «arma una presentación» solo viaja en ESTE mensaje, no en los viejos */
    if (m.role !== 'user' || !m.files || !m.files.length) return { role:m.role, content:noDk((m.role === 'user' && m.ask) || m.content) + dk };
    const full = o.naive || start + j === lastF;
    let t = noDk(m.ask || m.content || '') + dk;
    m.files.forEach(f => {
      if (f.text) t += full ? '\n\n[Archivo adjunto: ' + f.name + ']\n```\n' + (saver && f.text.length > 12000 ? f.text.slice(0, 12000) + '\n…(recortado por el modo ahorro)' : f.text) + '\n```' : '\n\n[Archivo adjunto antes: ' + f.name + ' (no se reenvía para ahorrar SynXCoin\'s)]';
      else if (f.kind === 'img' && !(vision && m._imgs && full)) t += '\n\n[Imagen adjunta: ' + f.name + (full ? ' (ya no está disponible)' : ' (no se reenvía)') + ']';
    });
    const imgs = vision && m._imgs && full ? m._imgs : [];
    t = t.trim() || 'Mira la imagen.';
    return imgs.length ? { role:m.role, content:[{ type:'text', text:t }, ...imgs.map(u => ({ type:'image_url', image_url:{ url:u } }))] } : { role:m.role, content:t };
  }).filter(Boolean);
  while (h.length && h[0].role !== 'user') h.shift();
  const sys = [];
  if (!o.naive) sys.push(qualitySystem(saver));   /* v3.4 · calidad: piensa, revisa la lógica y no inventa */
  if (saver) sys.push('Responde en el idioma del usuario, de forma clara y breve, sin relleno.');
  { const cs = o.naive ? '' : codeSystem(chat, saver); if (cs) sys.push(cs); }   /* v2.4 · SynthCode: manual de programación cuando pides código */
  { const ef = effortHint(); if (ef && !o.naive) sys.push(ef); }   /* v2.3.1 · esfuerzo */
  { const mm = memSystem(); if (mm && !o.naive) sys.push(mm); }
  { const ps = o.naive ? '' : projSystem(chat, saver); if (ps) sys.push(ps); }   /* v2.6 · proyectos: instrucciones y archivos del proyecto */
  if (SZ.CFG.beginner) sys.push('Modo principiante: la persona no sabe nada del tema. Usa palabras sencillas y frases cortas, explica paso a paso, evita los tecnicismos (si usas uno, explícalo) y pon un ejemplo de la vida diaria.');
  if (sys.length) h.unshift({ role:'system', content:sys.join(' ') });
  return h;
}
function msgCost(msgs){ return msgs.reduce((n, m) => n + 4 + (typeof m.content === 'string' ? est(m.content) : m.content.reduce((k, x) => k + (x.type === 'text' ? est(x.text) : 800), 0)), 0); }
/* caché: la misma pregunta al mismo modelo no se vuelve a pagar */
const CACHE_KEY = 'synthz:cache';
function hashStr(s){ let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + s.length.toString(36); }
function cacheAll(){ try{ return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; }catch(e){ return {}; } }
function cacheGet(k){ const c = cacheAll()[k]; return c && Date.now() - c.t < 7 * 864e5 ? c : null; }
function cachePut(k, r){
  const c = cacheAll(); c[k] = { t:Date.now(), text:r.text, prompt:r.prompt, completion:r.completion, model:r.model };
  const ks = Object.keys(c).sort((a, b) => c[b].t - c[a].t); ks.slice(60).forEach(x => delete c[x]);
  try{ localStorage.setItem(CACHE_KEY, JSON.stringify(c)); }catch(e){}
}
