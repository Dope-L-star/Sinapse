/* ---------- v2.1 · presentaciones: pides «hazme una presentación de…», la IA arma las diapositivas,
   las ves en vista previa y las descargas como PowerPoint (.pptx) con el estilo de Sinapse ---------- */
const PPT_RX = /\b(?:hazme|haz|cr[eé]a(?:me)?|arma(?:me)?|genera(?:me)?|prepara(?:me)?|dise[ñn]a(?:me)?|elabora(?:me)?|redacta(?:me)?|necesito|quiero|dame|p[oó]n(?:me)?|make|create|build|generate|prepare|need|want)\b[^.\n?!]{0,40}\b(?:presentaci[oó]n(?:es)?|presentations?|diapositivas?|power ?point|pptx|slides?|slide ?deck)\b|\b(?:en|como|formato|archivo)\s+(?:un\s+)?(?:power ?point|pptx)\b|\.pptx\b/i;
const PPT_NO = /\b(consejos|tips|c[oó]mo (?:hacer|dar|hablar|mejorar|preparar|presentar)|nervios|exposici[oó]n oral|practicar|mejorar mi presentaci|presentaci[oó]n personal|presentarme)\b/i;
/* solo arma diapositivas si de verdad las pides (no porque la palabra aparezca en otra frase) */
const wantsDeck = t => { t = String(t || ''); return PPT_RX.test(t) && !PPT_NO.test(t); };
const DECK_INSTR = '\n\n---\nIMPORTANTE: arma una presentación. Responde con UNA frase corta y luego UN solo bloque ```json con este formato exacto: {"titulo":"...","subtitulo":"...","diapositivas":[{"titulo":"...","puntos":["...","..."],"notas":"lo que diría el presentador"}]}. Entre 6 y 10 diapositivas, máximo 5 puntos cortos por diapositiva (máximo 15 palabras cada uno), en el idioma del pedido. La última diapositiva es un cierre o conclusión. No pongas nada después del bloque.';
function deckFrom(text){
  const t = String(text || ''); let a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a < 0 || b <= a) return null;
  let j = null; try{ j = JSON.parse(t.slice(a, b + 1)); }catch(e){ try{ j = JSON.parse(t.slice(a, b + 1).replace(/,\s*([}\]])/g, '$1')); }catch(x){ return null; } }
  if (!j || !Array.isArray(j.diapositivas) || !j.diapositivas.length) return null;
  const s = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);
  return { titulo:s(j.titulo, 120) || 'Presentación', subtitulo:s(j.subtitulo, 200), slides:j.diapositivas.slice(0, 20).map(d => ({ titulo:s(d && d.titulo, 120), puntos:(Array.isArray(d && d.puntos) ? d.puntos : []).slice(0, 7).map(p => s(p, 200)).filter(Boolean), notas:s(d && d.notas, 1200) })) };
}
const fileSafe = t => (String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'presentacion') + '.pptx';
function deckCard(pre, D){
  const c = document.createElement('div'); c.className = 'fcard deck'; c.dataset.ext = 'pptx';
  c.innerHTML = '<button type="button" class="fc-main" data-dk="prev"><span class="fc-ic img" aria-hidden="true">' + SZ.fileIco('pptx') + '</span><span class="fc-t"><b></b><small>Presentación · ' + D.slides.length + ' diapositivas · con vista previa</small></span></button>'
    + '<button type="button" class="cnv-b" data-dk="prev">' + CNV_ICO.eye + '<span>Vista previa</span></button><button type="button" class="cnv-b" data-dk="down">' + CNV_ICO.down + '<span>Descargar .pptx</span></button>';
  $('.fc-t b', c).textContent = fileSafe(D.titulo);
  pre.before(c); pre.hidden = true; c.appendChild(pre); c._deck = D;
  return c;
}
/* vista previa: las diapositivas en el lienzo, tal como quedan en PowerPoint */
function slideHtml(D, i){
  if (i < 0) return '<div class="sl sl-t"><h2></h2><i class="sl-bar"></i><p></p><small>Hecho con Sinapse</small></div>';
  return '<div class="sl"><h3></h3><i class="sl-bar"></i><ul></ul><span class="sl-n">' + (i + 2) + '</span></div>';
}
function openDeck(D){
  closeCanvas(true);
  const o = document.createElement('div'); o.className = 'cvp'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', D.titulo);
  o.innerHTML = '<div class="cvp-in"><div class="cvp-h"><span class="fc-ic img" aria-hidden="true">' + SZ.fileIco('pptx') + '</span><span class="cnv-t"><b></b><small>' + D.slides.length + ' diapositivas</small></span><button type="button" class="cnv-b" data-dk="down">' + CNV_ICO.down + '<span>Descargar .pptx</span></button><button type="button" class="cnv-b ic" data-cx aria-label="Cerrar">✕</button></div><div class="cvp-b deckv"></div></div>';
  $('.cnv-t b', o).textContent = fileSafe(D.titulo);
  const box = $('.deckv', o);
  [-1, ...D.slides.map((_, i) => i)].forEach(i => {
    const w = document.createElement('div'); w.className = 'slw'; w.innerHTML = slideHtml(D, i);
    if (i < 0){ $('h2', w).textContent = D.titulo; $('p', w).textContent = D.subtitulo; }
    else { const S = D.slides[i]; $('h3', w).textContent = S.titulo; S.puntos.forEach(p => { const li = document.createElement('li'); li.textContent = p; $('ul', w).appendChild(li); }); if (S.notas){ const n = document.createElement('p'); n.className = 'sl-notes'; n.textContent = 'Notas: ' + S.notas; w.appendChild(n); } }
    box.appendChild(w);
  });
  document.body.appendChild(o); cvEl = o; document.body.classList.add('canvasing'); requestAnimationFrame(() => o.classList.add('on'));
  o.addEventListener('click', e => { if (e.target === o || e.target.closest('[data-cx]')) return closeCanvas(); const b = e.target.closest('[data-dk="down"]'); if (b) deckDownload(D, b); });
}
let pptxLib = null;
const loadPptx = () => pptxLib || (pptxLib = new Promise((ok, no) => { if (window.PptxGenJS) return ok(window.PptxGenJS); const s = document.createElement('script'); s.src = 'lib/pptxgen.bundle.js'; s.onload = () => window.PptxGenJS ? ok(window.PptxGenJS) : no(new Error('sin librería')); s.onerror = () => { pptxLib = null; no(new Error('no cargó')); }; document.head.appendChild(s); }));
async function deckBuild(D){
  const P = await loadPptx(), pres = new P();
  pres.layout = 'LAYOUT_WIDE'; pres.author = 'Sinapse'; pres.company = 'Sinapse'; pres.title = D.titulo;
  const BG = '0B0C10', TX = 'ECEBE7', SOFT = 'C9C8C3', GOLD = 'E6B65F', ROSE = 'C9566C', MUTE = '8D8C88';
  const t = pres.addSlide(); t.background = { color:BG };
  t.addShape(pres.ShapeType.rect, { x:0, y:0, w:13.33, h:.12, fill:{ color:ROSE } });
  t.addShape(pres.ShapeType.rect, { x:.9, y:3.05, w:1.6, h:.08, fill:{ color:GOLD } });
  t.addText(D.titulo, { x:.9, y:1.4, w:11.5, h:1.6, fontFace:'Georgia', fontSize:44, color:TX, bold:false, valign:'bottom', fit:'shrink' });
  if (D.subtitulo) t.addText(D.subtitulo, { x:.9, y:3.3, w:11.5, h:1.2, fontFace:'Calibri', fontSize:22, color:SOFT, valign:'top', fit:'shrink' });
  t.addText('Hecho con Sinapse', { x:.9, y:6.7, w:6, h:.4, fontFace:'Calibri', fontSize:12, color:MUTE });
  D.slides.forEach((S, i) => {
    const s = pres.addSlide(); s.background = { color:BG };
    s.addShape(pres.ShapeType.rect, { x:0, y:0, w:.12, h:7.5, fill:{ color:GOLD } });
    s.addText(S.titulo || ('Diapositiva ' + (i + 2)), { x:.8, y:.45, w:11.7, h:1.0, fontFace:'Georgia', fontSize:32, color:TX, fit:'shrink' });
    s.addShape(pres.ShapeType.rect, { x:.8, y:1.45, w:1.2, h:.06, fill:{ color:ROSE } });
    if (S.puntos.length) s.addText(S.puntos.map(p => ({ text:p, options:{ bullet:{ code:'25CF' }, color:'D9D7D2', paraSpaceAfter:10 } })), { x:.8, y:1.8, w:11.7, h:4.8, fontFace:'Calibri', fontSize:22, valign:'top', fit:'shrink' });
    s.addText(String(i + 2), { x:12.2, y:6.85, w:.8, h:.4, fontFace:'Calibri', fontSize:12, color:MUTE, align:'right' });
    if (S.notas) s.addNotes(S.notas);
  });
  return pres;
}
async function deckDownload(D, btn){
  const l = btn ? btn.innerHTML : ''; if (btn){ btn.disabled = true; $('span', btn) && ($('span', btn).textContent = 'Armando…'); }
  try{ const pres = await deckBuild(D); await pres.writeFile({ fileName:fileSafe(D.titulo) }); toast('Descargué ' + fileSafe(D.titulo) + '. Ábrelo con PowerPoint, Google Slides o Keynote.'); }
  catch(e){ toast('No pude armar el PowerPoint. Revisa tu conexión e intenta de nuevo.'); }
  finally{ if (btn){ btn.disabled = false; btn.innerHTML = l; } }
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.fcard.deck [data-dk]'); if (!b) return;
  const D = b.closest('.fcard')._deck; if (!D) return;
  if (b.dataset.dk === 'down') deckDownload(D, b); else openDeck(D);
});
window.SynthFlowDeck = { build:deckBuild, from:deckFrom };
