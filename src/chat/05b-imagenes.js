/* ---------- v2.0 · crear imágenes (Pollinations): solo con cuenta, con su propio límite diario ----------
   La imagen se guarda en este equipo (IndexedDB) para no llenar tu espacio en la nube; el chat guarda solo la referencia. */
const IMGK = 'imagen';
const IMG_RX = /^(?:por favor\s+)?(?:crea(?:me)?|haz(?:me)?|genera(?:me)?|dib[uú]ja(?:me)?|pinta(?:me)?|dise[ñn]a(?:me)?)\s+(?:una?\s+|el\s+|la\s+)?(?:imagen|foto|fotograf[ií]a|dibujo|ilustraci[oó]n|p[oó]ster|logo|fondo de pantalla)\b/i;
let imgMode = false;
const imgDB = (() => {
  let p = null;
  const open = () => p || (p = new Promise((ok, no) => { try{ const r = indexedDB.open('synthz-img', 1); r.onupgradeneeded = () => r.result.createObjectStore('img'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }catch(e){ no(e); } }));
  const tx = async (mode, fn) => { const db = await open(); return new Promise((ok, no) => { const t = db.transaction('img', mode), s = t.objectStore('img'), r = fn(s); t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error); }); };
  return { put:(id, blob) => tx('readwrite', s => s.put(blob, id)), get:id => tx('readonly', s => s.get(id)) };
})();
/* botón «Crear imagen» junto al clip */
/* v3.7 · en la versión React el botón ya viene en CajaEscribir.jsx; aquí solo si falta */
const imgBtn = $('#imgBtn') || document.createElement('button');
if (!imgBtn.isConnected){ imgBtn.type = 'button'; imgBtn.className = 'attach imgb'; imgBtn.id = 'imgBtn'; imgBtn.setAttribute('aria-pressed', 'false'); imgBtn.setAttribute('aria-label', 'Crear una imagen'); imgBtn.dataset.tip = 'Crear una imagen';
imgBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 9"/></svg>';
{ const ab = $('#attachBtn'); if (ab) ab.after(imgBtn); } }
function setImgMode(on){
  if (on && !SZ.ACC.ready){ toast('Para crear imágenes entra a tu cuenta (es gratis).'); SZ.guestGate({ mode:'signup' }); return; }
  imgMode = !!on; imgBtn.setAttribute('aria-pressed', String(imgMode)); document.body.classList.toggle('imaging', imgMode);
  inp.placeholder = imgMode ? 'Describe la imagen que quieres crear…' : (agentOn() ? 'Apex: cuéntame qué necesitas…' : 'Escribe tu mensaje…');
  if (imgMode){ const q = SZ.SZQ.img; toast('Crear imagen: describe lo que quieres ver.' + (q && q.max ? ' Hoy te quedan ' + Math.max(0, q.max - q.used) + '.' : '')); inp.focus(); }
}
imgBtn.addEventListener('click', () => setImgMode(!imgMode));
/* pasa una imagen a JPEG liviano (máx. 1024 px) */
async function toJpeg(dataUrl){
  const im = new Image(); im.src = dataUrl; await im.decode();
  const k = Math.min(1, 1024 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
  c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
  c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  return new Promise(ok => c.toBlob(b => ok(b), 'image/jpeg', .86));
}
function imgWorkEl(){
  const el = document.createElement('div'); el.className = 'm bot brand think-wrap imgwork';
  el.innerHTML = '<div class="who"><b>Creador de imágenes</b></div><div class="work"><div class="wk-row"><span class="pxw">' + SZ.pixelGrid() + '</span><span class="wk-t"><b class="wk-w">Creando tu imagen</b><small class="wk-s">puede tardar unos segundos</small></span></div></div>';
  el._t0 = performance.now();
  /* v4.5 · con SynthFlow en React, mientras se crea la imagen sale el anillo de luz con una frase al azar en las letras («Generating», dexter-st) */
  const fx = document.createElement('div'); fx.className = 'fxhost';
  if (window.SZFx && window.SZFx.mount(fx, 'imagen', { lang:SZ.lang(), tam:170 })){ el.innerHTML = '<div class="who"><b>Creador de imágenes</b></div>'; el.appendChild(fx); el.classList.add('fxi'); el._fx = fx; el._px = { stop(){} }; return el; }
  el._px = SZ.pixelRun($('.pxw', el)); return el;
}
async function createImage(prompt){
  if (!SZ.ACC.ready){ toast('Para crear imágenes entra a tu cuenta (es gratis).'); SZ.guestGate({ mode:'signup' }); return; }
  if (Object.keys(busy).length) return toast('Espera a que termine la respuesta anterior.');
  const chat = chatArr(), g0 = gen;
  chat.push({ role:'user', content:prompt, imgReq:true }); touchThread(); save();
  inp.value = ''; autoGrow(); updateHint(); renderMsgs();
  const w = imgWorkEl(); lane.appendChild(w); jump(); busy[IMGK] = 'write';
  try{
    const r = await fetch('/api/ai', { method:'POST', headers:SZ.szHeaders(), body:JSON.stringify({ action:'image', prompt }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.img) throw Object.assign(new Error(d.error || 'No pude crear la imagen. Intenta en un rato.'), { code:d.code, status:r.status });
    const blob = await toJpeg(d.img), id = 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await imgDB.put(id, blob);
    if (SZ.SZQ.img) SZ.SZQ.img.used = (SZ.SZQ.img.max || 0) - (d.left || 0);
    chat.push({ role:'assistant', model:IMGK, content:'Imagen creada: «' + prompt.slice(0, 300) + '»', imgId:id, meta:'creada en ' + ((performance.now() - w._t0) / 1000 || 0).toFixed(0) + ' s · te quedan ' + (d.left || 0) + ' hoy' });
    touchThread(); save();
    try{ SZ.BOT.react && SZ.BOT.react('done', { cool:120000 }); }catch(e){}
  }catch(err){
    chat.pop(); save();
    if (g0 === gen){ renderMsgs(); showErr(Object.assign(err, { limit:/img_limit|img_login/.test(err.code || '') })); inp.value = prompt; autoGrow(); }
  }finally{ delete busy[IMGK]; try{ w._px.stop(); }catch(e){} w.remove(); if (g0 === gen) renderMsgs(); renderNow(); }
}
/* en el chat: la imagen con «Descargar» */
function imgFill(body, m){
  body.innerHTML = '<figure class="szimg"><div class="szimg-f"><span class="pxw">' + SZ.pixelGrid() + '</span></div><figcaption></figcaption><div class="szimg-b"><button type="button" class="cnv-b" data-imgdl>' + CNV_ICO.down + '<span>Descargar</span></button><button type="button" class="cnv-b" data-imgbig>' + CNV_ICO.eye + '<span>Ver en grande</span></button></div></figure>';
  $('figcaption', body).textContent = m.content.replace(/^Imagen creada: «|»$/g, '');
  const f = $('.szimg-f', body);
  imgDB.get(m.imgId).then(blob => {
    if (!blob){ f.innerHTML = '<p class="szimg-no">Esta imagen quedó guardada en el equipo donde la creaste.</p>'; $('.szimg-b', body).hidden = true; return; }
    const u = URL.createObjectURL(blob), im = document.createElement('img'); im.alt = m.content; im.src = u; f.innerHTML = ''; f.appendChild(im); body._imgUrl = u;
  }).catch(() => { f.innerHTML = '<p class="szimg-no">No pude abrir la imagen.</p>'; });
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-imgdl], [data-imgbig]'); if (!b) return;
  const body = b.closest('.body'), u = body && body._imgUrl; if (!u) return;
  if (b.hasAttribute('data-imgdl')){ const a = document.createElement('a'); a.href = u; a.download = 'synthz-imagen.jpg'; document.body.appendChild(a); a.click(); a.remove(); toast('Descargué tu imagen.'); }
  else { const o = document.createElement('div'); o.className = 'szm imgbig'; o.innerHTML = '<img alt="">'; $('img', o).src = u; document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on')); o.addEventListener('click', () => { o.classList.remove('on'); setTimeout(() => o.remove(), 300); }); }
});
