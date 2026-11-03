/* ---------- v3.8 · adjuntar CUALQUIER archivo, sin errores ----------
   Antes, lo que no era texto, PDF, Office o foto salía «Tipo de archivo no compatible» y se borraba de la bandeja.
   Ahora todo se lee aquí, en el navegador y gratis, y la IA elegida recibe algo que entiende:
   · fotos (también HEIC del iPhone), PDF (con texto, escaneado o con contraseña), Word/Excel/PowerPoint/OpenDocument,
     .doc/.xls/.ppt viejos, RTF, EPUB, código y cualquier texto;
   · .zip (y .jar, .apk…), .tar, .gz y .tgz: se abren y se lee lo que traen adentro;
   · audio y video: se pasan a texto (Whisper, gratis, en /api/ai) y del video se sacan 3 fotos;
   · lo demás (programas, bases de datos, formatos raros): qué es, su tamaño y el texto que se pueda rescatar.
   readAny nunca lanza un error: si un camino falla, prueba el siguiente y al final siempre queda una ficha del archivo. */
const MB = 1048576;
const sizeTxt = n => n < 1024 ? n + ' B' : n < MB ? (n / 1024).toFixed(1).replace('.0', '') + ' KB' : n < 1024 * MB ? (n / MB).toFixed(1).replace('.0', '') + ' MB' : (n / 1024 / MB).toFixed(2) + ' GB';
const extOf = n => { const m = /\.([a-z0-9]{1,10})$/i.exec(String(n || '')); return m ? m[1].toLowerCase() : ''; };
const IMGX = /\.(png|jpe?g|jfif|pjpeg|gif|webp|bmp|ico|avif|apng|tiff?|heic|heif)$/i;
const AUDX = /\.(mp3|wav|wave|m4a|aac|ogg|oga|opus|flac|weba|amr|aiff?|wma|mid|midi|3ga)$/i;
const VIDX = /\.(mp4|m4v|mov|webm|mkv|avi|wmv|3gp|ogv|mpe?g|flv)$/i;
const ZIPX = /\.(zip|jar|apk|aab|xpi|crx|ipa|nupkg|whl|vsix|sketch|xd|kmz|cbz|odg|key|numbers|pages|xps|oxps|3mf)$/i;
const OLDX = /\.(doc|dot|xls|xlt|ppt|pps|pot|wps|wpd|pub|vsd|msg|mdb|accdb)$/i;
/* qué es un archivo según sus primeros bytes (sirve cuando el nombre no tiene extensión o miente) */
function magicOf(u){
  const s = (a, b) => String.fromCharCode(...u.slice(a, b)), h = (...x) => x.every((v, i) => u[i] === v);
  if (h(0xff, 0xfe) || h(0xfe, 0xff) || h(0xef, 0xbb, 0xbf)) return 'text';   /* marca de texto UTF-8/16 (FF FE se parece al comienzo de un mp3) */
  if (h(0x25, 0x50, 0x44, 0x46)) return 'pdf';
  if (h(0x50, 0x4b, 0x03, 0x04) || h(0x50, 0x4b, 0x05, 0x06)) return 'zip';
  if (h(0x1f, 0x8b)) return 'gz';
  if (u.length > 262 && s(257, 262) === 'ustar') return 'tar';
  if (h(0x49, 0x49, 0x2a, 0) || h(0x4d, 0x4d, 0, 0x2a)) return 'img';
  if (h(0x89, 0x50, 0x4e, 0x47) || h(0xff, 0xd8, 0xff) || s(0, 4) === 'GIF8' || (s(0, 4) === 'RIFF' && s(8, 12) === 'WEBP') || h(0x42, 0x4d)) return 'img';
  if (s(4, 8) === 'ftyp'){ const b = s(8, 12); return /^(heic|heix|hevc|mif1|msf1|avif)/.test(b) ? 'img' : /^(M4A |M4B |mp42?|isom|dash|M4V |qt  |3gp)/.test(b) ? 'av' : 'av'; }
  if (s(0, 3) === 'ID3' || (u[0] === 0xff && (u[1] & 0xe0) === 0xe0) || s(0, 4) === 'OggS' || s(0, 4) === 'fLaC' || (s(0, 4) === 'RIFF' && /WAVE|AVI /.test(s(8, 12))) || h(0x1a, 0x45, 0xdf, 0xa3)) return 'av';
  if (s(0, 5) === '{\\rtf') return 'rtf';
  if (h(0xd0, 0xcf, 0x11, 0xe0)) return 'ole';
  return '';
}
const KIND_TXT = { exe:'programa de Windows', msi:'instalador de Windows', dll:'librería de Windows', dmg:'imagen de disco de Mac', iso:'imagen de disco', deb:'paquete de Linux', rpm:'paquete de Linux', apk:'app de Android', ipa:'app de iPhone',
  sqlite:'base de datos SQLite', db:'base de datos', mdb:'base de datos de Access', accdb:'base de datos de Access', psd:'diseño de Photoshop', ai:'diseño de Illustrator', sketch:'diseño de Sketch', fig:'diseño de Figma', xd:'diseño de Adobe XD',
  rar:'archivo comprimido RAR', '7z':'archivo comprimido 7-Zip', bz2:'archivo comprimido', xz:'archivo comprimido', ttf:'fuente de letra', otf:'fuente de letra', woff:'fuente de letra', woff2:'fuente de letra',
  stl:'modelo 3D', obj:'modelo 3D', fbx:'modelo 3D', glb:'modelo 3D', gltf:'modelo 3D', blend:'proyecto de Blender', dwg:'plano de AutoCAD', dxf:'plano de AutoCAD', kml:'mapa', gpx:'ruta GPS', eml:'correo', msg:'correo de Outlook', ics:'evento de calendario', vcf:'contacto' };
function kindTxt(name, type, magic){
  const e = extOf(name);
  return KIND_TXT[e] || (magic === 'ole' ? 'documento viejo de Office' : type ? type : e ? 'archivo .' + e : 'archivo sin extensión');
}
function fichaTxt(file, extra){
  return '[Archivo adjunto: ' + (file.name || 'archivo') + ' · ' + kindTxt(file.name, file.type) + ' · ' + sizeTxt(file.size || 0) + (file.lastModified ? ' · modificado el ' + new Date(file.lastModified).toISOString().slice(0, 10) : '') + ']' + (extra ? '\n' + extra : '');
}
/* ¿es texto? Mira los primeros bytes: sin ceros y con pocos caracteres de control → texto (UTF-8, UTF-16 o Windows-1252) */
async function sniffText(blob, max = 1.2 * MB){
  const buf = new Uint8Array(await blob.slice(0, max).arrayBuffer()); if (!buf.length) return '';
  if (buf[0] === 0xff && buf[1] === 0xfe) return new TextDecoder('utf-16le').decode(buf.subarray(2));
  if (buf[0] === 0xfe && buf[1] === 0xff) return new TextDecoder('utf-16be').decode(buf.subarray(2));
  const n = Math.min(buf.length, 8192); let bad = 0;
  for (let i = 0; i < n; i++){ const b = buf[i]; if (b === 0) return null; if (b < 9 || (b > 13 && b < 32 && b !== 27)) bad++; }
  if (bad > n * .01) return null;
  let t = new TextDecoder('utf-8').decode(buf), rep = (t.match(/�/g) || []).length;
  if (rep > t.length * .002 + 2){ try{ t = new TextDecoder('windows-1252').decode(buf); }catch(e){} }
  if (blob.size > max) t += '\n…(archivo recortado: solo se lee el comienzo)';
  return t;
}
/* rescatar el texto legible de un archivo binario (como el comando «strings»): sirve para .doc/.xls/.ppt viejos, programas, bases de datos… */
async function binStrings(blob, min = 5){
  const u = new Uint8Array(await blob.slice(0, 12 * MB).arrayBuffer()), out = [], seen = new Set(), td = new TextDecoder('utf-8'), tw = new TextDecoder('windows-1252');
  let len = 0;
  const push = s => { s = s.replace(/\s+/g, ' ').trim(); if (s.length >= min && /\p{L}{3}/u.test(s) && (s.match(/[\p{L}\d\s.,;:!?¿¡()'"-]/gu) || []).length > s.length * .8 && !seen.has(s)){ seen.add(s); out.push(s); len += s.length + 1; } };
  /* primero el texto en UTF-16 (así guardan Word, Excel y PowerPoint viejos lo que escribiste): letra, 0, letra, 0… */
  for (const o of [0, 1]){
    let w = '';
    for (let i = o; i + 1 < u.length && len < CAP / 2; i += 2){
      const c = u[i] | (u[i + 1] << 8);
      if ((c >= 32 && c < 0x2000) || c === 9 || c === 10 || c === 13) w += String.fromCharCode(c);
      else { if (w.length >= min) push(w); w = ''; }
    }
    if (w.length >= min) push(w);
  }
  let a = -1;
  const ok = b => (b >= 32 && b < 127) || b === 9 || b >= 0xa0;
  for (let i = 0; i <= u.length && len < CAP; i++){
    if (i < u.length && ok(u[i])){ if (a < 0) a = i; continue; }
    if (a >= 0 && i - a >= min){ const sl = u.subarray(a, i), t = td.decode(sl); push(/�/.test(t) ? tw.decode(sl) : t); }
    a = -1;
  }
  return out.join('\n');
}
/* RTF → texto: fuera las palabras de control, los grupos ocultos y las llaves; acentos con \'e1 y \u225 */
function rtfTxt(r){
  let t = r.replace(/\{\\\*[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '').replace(/\{\\(fonttbl|colortbl|stylesheet|info|pict|header|footer)[\s\S]*?\}\s*\}/g, '');
  t = t.replace(/\\par[d]?\b ?|\\line\b ?|\\row\b ?/g, '\n').replace(/\\tab\b ?|\\cell\b ?/g, '\t');
  t = t.replace(/\\'([0-9a-f]{2})/gi, (_, h) => new TextDecoder('windows-1252').decode(new Uint8Array([parseInt(h, 16)])));
  t = t.replace(/\\u(-?\d+)\??/g, (_, d) => String.fromCharCode(d < 0 ? +d + 65536 : +d));
  t = t.replace(/\\[a-z]+-?\d* ?/gi, '').replace(/\\([{}\\])/g, '$1').replace(/[{}]/g, '');
  return t.replace(/\n{3,}/g, '\n\n').trim();
}
const htmlTxt = h => xmlTxt(String(h).replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h\d|li|tr|section|article)>/gi, '\n').replace(/&nbsp;/g, ' ')).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
/* bytes descomprimidos con un tope (un .gz de 20 KB puede esconder 2 GB) */
async function inflate(stream, max = 40 * MB){
  const rd = stream.getReader(), parts = []; let n = 0;
  try{ for (;;){ const { done, value } = await rd.read(); if (done) break; parts.push(value); n += value.length; if (n >= max){ rd.cancel().catch(() => {}); break; } } }catch(e){ if (!n) throw e; }
  return new Blob(parts);
}
async function readEpub(file){
  const z = await zipOpen(file); let order = [];
  try{
    const root = (/full-path="([^"]+)"/.exec(await z.read('META-INF/container.xml')) || [])[1];
    if (root){
      const opf = await z.read(root), dir = root.includes('/') ? root.replace(/[^/]+$/, '') : '', man = {};
      for (const m of opf.matchAll(/<item\b[^>]*>/g)){ const id = (/\bid="([^"]+)"/.exec(m[0]) || [])[1], hr = (/\bhref="([^"]+)"/.exec(m[0]) || [])[1]; if (id && hr) man[id] = dir + decodeURIComponent(hr); }
      order = [...opf.matchAll(/<itemref\b[^>]*idref="([^"]+)"/g)].map(m => man[m[1]]).filter(Boolean);
    }
  }catch(e){}
  if (!order.length) order = z.names.filter(n => /\.x?html?$/i.test(n)).sort();
  let t = '';
  for (const n of order){ if (t.length >= CAP) break; try{ const x = htmlTxt(await z.read(n)); if (x) t += x + '\n\n'; }catch(e){} }
  return t.trim();
}
/* dentro de un .zip/.tar: cada archivo se lee con las mismas reglas (hasta 30, y sin pasarse del tope de texto) */
async function readInner(blob, name, depth){
  const e = extOf(name);
  if (/\.pdf$/i.test(name)){ const p = await readPdf(blob); return typeof p === 'string' ? p : '(PDF escaneado de ' + p.pages + ' páginas: adjúntalo solo para verlo)'; }
  if (OFFX.test(name)) return readOffice(new File([blob], name.split('/').pop()));
  if (/\.epub$/i.test(name)) return readEpub(blob);
  if (/\.rtf$/i.test(name)) return rtfTxt(await blob.text());
  if (/\.x?html?$/i.test(name)) return htmlTxt(await sniffText(blob) || '');
  if (depth < 2 && (ZIPX.test(name) || /\.(tar|tgz|gz)$/i.test(name))) return (await readArchive(blob, name, depth + 1)).text;
  if (IMGX.test(name) || AUDX.test(name) || VIDX.test(name)) return null;   /* fotos, audio y video de adentro: se nombran en la lista */
  const t = await sniffText(blob, 400000);
  if (t != null) return t;
  if (OLDX.test(name) || e === 'sqlite' || e === 'db'){ const s = await binStrings(blob); return s || null; }
  return null;
}
async function readArchive(file, name, depth = 0){
  let list = [], get;
  if (/\.(tgz|gz)$/i.test(name) || magicOf(new Uint8Array(await file.slice(0, 4).arrayBuffer())) === 'gz'){
    if (typeof DecompressionStream === 'undefined') throw new Error('gz');
    const inner = await inflate(file.stream().pipeThrough(new DecompressionStream('gzip'))), iname = /\.tgz$/i.test(name) ? name.replace(/\.tgz$/i, '.tar') : name.replace(/\.gz$/i, '') || 'archivo';
    if (/\.tar$/i.test(iname) || magicOf(new Uint8Array(await inner.slice(0, 264).arrayBuffer())) === 'tar') return readArchive(inner, iname, depth);
    const t = await readInner(inner, iname, depth);
    return { text:'--- ' + iname + ' (' + sizeTxt(inner.size) + ' descomprimido) ---\n' + (t || '(sin texto legible)'), count:1 };
  }
  if (/\.tar$/i.test(name) || magicOf(new Uint8Array(await file.slice(0, 264).arrayBuffer())) === 'tar'){
    const td = new TextDecoder(), ents = {};
    for (let p = 0, k = 0; p + 512 <= file.size && k < 2000; k++){
      const h = new Uint8Array(await file.slice(p, p + 512).arrayBuffer()); if (!h[0]) break;
      const cut = (a, b) => td.decode(h.subarray(a, b)).replace(/\0[\s\S]*$/, ''), sz = parseInt(cut(124, 136).trim(), 8) || 0, ty = String.fromCharCode(h[156] || 48), pre = cut(345, 500);
      const nm = (pre ? pre + '/' : '') + cut(0, 100);
      if (ty === '0' || ty === '\0' || ty === '7') ents[nm] = { at:p + 512, size:sz };
      p += 512 + Math.ceil(sz / 512) * 512;
    }
    list = Object.keys(ents).map(n => ({ name:n, size:ents[n].size }));
    get = n => Promise.resolve(file.slice(ents[n].at, ents[n].at + ents[n].size));
  } else {
    const z = await zipOpen(file);
    list = z.names.filter(n => !/\/$/.test(n)).map(n => ({ name:n, size:z.size(n), locked:z.locked(n) }));
    get = n => z.blob(n);
  }
  const shown = list.filter(x => !/(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db)/.test(x.name));
  let t = 'Contiene ' + shown.length + (shown.length === 1 ? ' archivo' : ' archivos') + ':\n' + shown.slice(0, 200).map(x => '· ' + x.name + ' (' + sizeTxt(x.size) + ')' + (x.locked ? ' · con contraseña' : '')).join('\n') + (shown.length > 200 ? '\n· …y ' + (shown.length - 200) + ' más' : '');
  let n = 0;
  for (const x of shown){
    if (n >= 30 || t.length >= CAP) break;
    if (x.locked || !x.size || x.size > 60 * MB) continue;
    try{ const c = await readInner(await get(x.name), x.name, depth); if (c && c.trim()){ t += '\n\n--- ' + x.name + ' ---\n' + c.trim().slice(0, Math.max(2000, CAP - t.length)); n++; } }catch(e){}
  }
  return { text:t, count:shown.length };
}
/* ---------- fotos: HEIC del iPhone con heic2any (cdnjs, solo si hace falta) ---------- */
let heicP, tiffP;
/* TIFF: Chrome y Firefox no lo abren; UTIF.js (MIT, en /lib, sin internet extra) lo pasa a una foto normal */
function loadTiff(){
  return tiffP || (tiffP = new Promise((ok, no) => { const s = document.createElement('script'); s.src = '/lib/utif.min.js'; s.onload = () => window.UTIF ? ok(window.UTIF) : no(new Error('tiff')); s.onerror = () => { tiffP = null; no(new Error('tiff')); }; document.head.appendChild(s); }));
}
async function tiffToPng(file){
  const U = await loadTiff(), buf = await file.arrayBuffer(), ifds = U.decode(buf); if (!ifds.length) throw new Error('tiff');
  U.decodeImage(buf, ifds[0]); const rgba = U.toRGBA8(ifds[0]), w = ifds[0].width, h = ifds[0].height;
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer, 0, w * h * 4), w, h), 0, 0);
  return new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(new Error('tiff')), 'image/png'));
}
function loadHeic(){
  return heicP || (heicP = new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.4/heic2any.min.js'; s.onload = () => window.heic2any ? ok(window.heic2any) : no(new Error('heic')); s.onerror = () => { heicP = null; no(new Error('heic')); }; document.head.appendChild(s); }));
}
async function readAnyImg(file){
  try{ return await readImg(file); }
  catch(e){
    const mg = magicOf(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
    if (/\.tiff?$/i.test(file.name) || /tiff/.test(file.type) || (mg === 'img' && /^(II\*|MM\0\*)/.test(String.fromCharCode(...new Uint8Array(await file.slice(0, 4).arrayBuffer()))))) return readImg(await tiffToPng(file));
    if (!/\.(heic|heif)$/i.test(file.name) && !/hei[cf]/.test(file.type) && magicOf(new Uint8Array(await file.slice(0, 16).arrayBuffer())) !== 'img') throw e;
    const conv = await (await loadHeic())({ blob:file, toType:'image/jpeg', quality:.85 });
    return readImg(Array.isArray(conv) ? conv[0] : conv);
  }
}
/* ---------- audio y video ---------- */
const STT_SEC = 60, STT_MAX = 20;   /* trozos de 1 minuto (≈1,9 MB cada uno); hasta 20 minutos por archivo */
function wavOf(pcm, rate){
  const b = new ArrayBuffer(44 + pcm.length * 2), v = new DataView(b), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++){ const s = Math.max(-1, Math.min(1, pcm[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  return new Uint8Array(b);
}
function b64(u){ let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
const clock = s => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
async function decodePcm(file){
  /* archivos enormes: se decodifica el comienzo (en mp3/webm funciona aunque se corte) */
  const big = file.size > 120 * MB, src = big ? file.slice(0, 120 * MB) : file;
  const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!AC) throw new Error('audio');
  const ac = new AC(1, 16000, 16000), buf = await ac.decodeAudioData(await src.arrayBuffer());
  const ch = buf.numberOfChannels, n = buf.length, pcm = new Float32Array(n);
  for (let c = 0; c < ch; c++){ const d = buf.getChannelData(c); for (let i = 0; i < n; i++) pcm[i] += d[i] / ch; }
  return { pcm, rate:buf.sampleRate, dur:buf.duration, big };
}
async function sttChunk(pcm, rate, i){
  const part = pcm.subarray(i * STT_SEC * rate, (i + 1) * STT_SEC * rate);
  let e = 0; for (let k = 0; k < part.length; k += 16) e += part[k] * part[k];
  if (Math.sqrt(e / Math.max(1, part.length / 16)) < .004) return '';   /* silencio: no se manda */
  const r = await fetch('/api/ai', { method:'POST', headers:SZ.szHeaders(), body:JSON.stringify({ action:'transcribe', audio:b64(wavOf(part, rate)), lang:SZ.lang() === 'en' ? 'en' : '' }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'stt'), { status:r.status });
  return String(j.text || '').trim();
}
async function transcribe(file, f){
  const { pcm, rate, dur, big } = await decodePcm(file), n = Math.min(STT_MAX, Math.ceil(dur / STT_SEC)), out = new Array(n).fill(null);
  let next = 0, fails = 0, stop = null;
  f.prog = SZ.lang() === 'en' ? 'Transcribing…' : 'Pasando a texto…'; renderTray();
  const worker = async () => {
    while (next < n && !stop && files.includes(f)){
      const i = next++;
      try{ out[i] = await sttChunk(pcm, rate, i); }
      catch(e){ fails++; if (e.status === 429 || e.status === 401 || e.status === 503 || fails > 2) stop = e; }
      f.prog = (SZ.lang() === 'en' ? 'Transcribing ' : 'Pasando a texto ') + Math.min(n, out.filter(x => x != null).length) + '/' + n; renderTray();
    }
  };
  await Promise.all([worker(), worker()]);
  delete f.prog;
  const got = out.map((t, i) => t ? '[' + clock(i * STT_SEC) + '] ' + t : '').filter(Boolean).join('\n');
  const done = out.filter(x => x != null).length;
  return { dur, got, done, n, big, stopped:!!stop, more:dur > STT_MAX * STT_SEC };
}
function videoFrames(file){
  return new Promise(ok => {
    const url = URL.createObjectURL(file), v = document.createElement('video'), pics = [];
    let i = 0, stamps = [], meta = null, quit = setTimeout(() => end(), 20000);
    const end = () => { clearTimeout(quit); v.removeAttribute('src'); try{ v.load(); }catch(e){} URL.revokeObjectURL(url); ok({ pics, meta }); };
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.onloadedmetadata = () => { meta = { dur:v.duration, w:v.videoWidth, h:v.videoHeight }; if (!v.videoWidth || !isFinite(v.duration)) return end(); stamps = [.1, .5, .9].map(p => Math.max(0, Math.min(v.duration - .05, v.duration * p))); v.currentTime = stamps[0]; };
    v.onseeked = () => {
      try{ const s = Math.min(1, 960 / Math.max(v.videoWidth, v.videoHeight)), c = document.createElement('canvas'); c.width = Math.round(v.videoWidth * s); c.height = Math.round(v.videoHeight * s); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); pics.push(c.toDataURL('image/jpeg', .78)); }catch(e){}
      if (++i < stamps.length) v.currentTime = stamps[i]; else end();
    };
    v.onerror = () => end();
    v.src = url;
  });
}
async function readMedia(file, f, isVideo){
  const parts = [];
  if (isVideo){
    const fr = await videoFrames(file).catch(() => ({ pics:[], meta:null }));
    if (fr.pics.length){ f.kind = 'img'; f.dataUrls = fr.pics; f.dataUrl = fr.pics[0]; f.thumb = fr.pics[0]; f.frames = fr.pics.length; }
    if (fr.meta && fr.meta.w) parts.push('Video de ' + clock(fr.meta.dur) + ', ' + fr.meta.w + '×' + fr.meta.h + ' px.' + (fr.pics.length ? ' Van ' + fr.pics.length + ' fotos sacadas del video (al comienzo, a la mitad y al final).' : ''));
  }
  let tr = null;
  try{ tr = await transcribe(file, f); }catch(e){ delete f.prog; }
  if (tr){
    if (!isVideo) parts.push('Audio de ' + clock(tr.dur) + '.');
    if (tr.got) parts.push('Lo que se dice' + (tr.done < tr.n || tr.more ? ' (transcrito hasta el minuto ' + Math.round(tr.done * STT_SEC / 60) + ')' : '') + ':\n' + tr.got);
    else if (tr.done) parts.push('No se escucha voz: es música, ruido o silencio.');
    else parts.push('No se pudo pasar el audio a texto ahora (límite de hoy o sin conexión). Pídele a la persona que diga qué hay en el audio si lo necesitas.');
  } else parts.push((isVideo ? 'El sonido del video' : 'Este audio') + ' no se pudo abrir en el navegador.' + (isVideo ? '' : ' Formato: ' + (file.type || extOf(file.name))));
  return parts.join('\n');
}
/* ---------- el lector de todo ---------- */
async function readAny(file, f, o = {}){
  const name = file.name || 'archivo', type = String(file.type || '').toLowerCase();
  const head = new Uint8Array(await file.slice(0, 264).arrayBuffer().catch(() => new ArrayBuffer(0))), magic = magicOf(head);
  const tryIt = async fn => { try{ return await fn(); }catch(e){ return null; } };
  let t = null;
  if (!file.size){ f.text = fichaTxt(file, 'El archivo está vacío (0 bytes).'); return; }
  /* fotos */
  if (!o.textOnly && (/^image\//.test(type) && !/svg/.test(type) || IMGX.test(name) || (magic === 'img' && !TEXTX.test(name)))){
    const r = await tryIt(() => readAnyImg(file));
    if (r){ f.kind = 'img'; Object.assign(f, r); return; }
    /* foto que el navegador no abre: se manda su ficha (y si es TIFF/BMP raros, el texto que tenga) */
    f.kind = 'text'; f.text = fichaTxt(file, 'Es una imagen que este navegador no puede mostrar.'); return;
  }
  /* PDF: con texto → texto; escaneado → fotos de sus páginas; con contraseña → la pide; dañado → el texto que se rescate */
  if (/\.pdf$/i.test(name) || type === 'application/pdf' || magic === 'pdf'){
    f.kind = 'pdf';
    const p = await tryIt(() => readPdf(file));
    if (p && p.scanned){ if (o.textOnly){ f.text = fichaTxt(file, 'PDF escaneado de ' + p.pages + ' páginas (sin texto que copiar).'); return; } f.kind = 'img'; f.dataUrl = p.pics[0]; f.dataUrls = p.pics; f.thumb = p.pics[0]; f.scan = p.pages; return; }
    if (p){ f.text = p; return; }
    t = await tryIt(() => binStrings(file, 4));
    f.text = fichaTxt(file, t && t.length > 40 ? 'El PDF venía dañado; esto es lo que se pudo rescatar:\n' + clip(t) : 'El PDF está dañado o protegido y no se pudo abrir.'); return;
  }
  if (OFFX.test(name)){ f.kind = 'doc'; t = await tryIt(() => readOffice(file)); if (t){ f.text = t; return; } }
  if (/\.epub$/i.test(name)){ f.kind = 'doc'; t = await tryIt(() => readEpub(file)); if (t){ f.text = clip(t); return; } }
  if (/\.rtf$/i.test(name) || magic === 'rtf'){ f.kind = 'doc'; t = await tryIt(async () => rtfTxt(await sniffText(file, 8 * MB) || '')); if (t){ f.text = clip(t); return; } }
  /* audio y video */
  if (!o.textOnly && magic !== 'text' && (/^(audio|video)\//.test(type) || AUDX.test(name) || VIDX.test(name) || (magic === 'av' && !TEXTX.test(name)))){
    const isV = /^video\//.test(type) || VIDX.test(name);
    f.kind = 'media'; f.text = fichaTxt(file, await readMedia(file, f, isV).catch(() => '')); return;
  }
  /* comprimidos */
  if (ZIPX.test(name) || /\.(tar|tgz|gz)$/i.test(name) || /zip|x-tar|gzip/.test(type) || magic === 'zip' || magic === 'gz' || magic === 'tar'){
    f.kind = 'zip';
    const r = await tryIt(() => readArchive(file, name));
    if (r){ f.text = fichaTxt(file, clip(r.text)); return; }
  }
  /* código y cualquier texto (también sin extensión o con una que no conocemos) */
  if (magic !== 'ole' && !OLDX.test(name)){
    t = await tryIt(() => sniffText(file));
    if (t != null){ f.kind = 'text'; f.text = clip(/\.x?html?$/i.test(name) && t.length > CAP ? htmlTxt(t) : t); return; }
  }
  /* .doc/.xls/.ppt viejos, programas, bases de datos, formatos raros: qué es + el texto que se pueda rescatar */
  f.kind = magic === 'ole' || OLDX.test(name) ? 'doc' : 'bin';
  t = await tryIt(() => binStrings(file));
  f.text = fichaTxt(file, t && t.length > 30 ? (f.kind === 'doc' ? 'Documento de Office viejo; este es su texto:\n' : 'Texto legible que trae adentro:\n') + clip(t) : 'Es un archivo binario sin texto legible: puedes hablar de qué es, pero no de su contenido.');
}
