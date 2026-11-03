/* ---------- v3.0 · Sintéticos en la barra lateral (como los artefactos de Claude) ----------
   Junta todo lo que la IA creó en tus chats (páginas, juegos, SVG, código, documentos) en una sola lista.
   Tocar uno lo abre al lado; «Ir al chat» te lleva a la conversación donde nació. Se arma al abrir la lista, nada se guarda aparte. */
const SYN_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.2 5.1L19.5 9l-4 3.7 1.1 5.4L12 15.5 7.4 18.1l1.1-5.4-4-3.7 5.3-.9z" opacity=".35"/><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M9 9l-2.5 3L9 15M15 9l2.5 3L15 15"/></svg>';
function synAll(){
  const out = [], box = document.createElement('div');
  allThreads().forEach(th => {
    st().chats[th.k].forEach((m, i) => {
      if (m.role !== 'assistant' || !/```/.test(m.content || '')) return;
      box.innerHTML = md(m.content);
      const files = $$('pre', box).map(pre => [cnvMeta(pre), pre]).filter(([M, pre]) => isFile(M, pre));
      /* v4.1 · una página de varios archivos sale como UN Sintético (se abre funcionando, con sus pestañas); el resto, archivo por archivo */
      const P = webProject(files.map(x => x[0]));
      if (P) out.push({ M:{ name:P.title || P.entry, label:'web', ext:'html', lines:P.files.length, key:'web:' + P.entry }, P, th, i });
      files.forEach(([M]) => { if (P && WEB_EXT.has(M.ext)) return; out.push({ M, th, i, sibs:() => { box.innerHTML = md(m.content); return $$('pre', box).map(cnvMeta).filter(x => x.name !== M.name); } }); });
    });
  });
  /* la última versión de cada archivo de cada chat (si la IA lo arregló, sale el arreglado) */
  const seen = new Set();
  return out.reverse().filter(x => { const k = x.th.k + '|' + (x.M.key || x.M.name); if (seen.has(k)) return false; seen.add(k); return true; });
}
const SV = document.createElement('section'); SV.className = 'synv'; SV.id = 'synv'; SV.hidden = true; SV.setAttribute('aria-label', 'Sintéticos'); SV.tabIndex = -1;
$('#shell .main').appendChild(SV);
let synList = [];
function synOpen(){
  try{ pjClose(); }catch(e){}
  try{ closeChatsSheet(); }catch(e){}
  SV.hidden = false; document.body.classList.add('synon'); $('#railSyn').setAttribute('aria-pressed', 'true');
  synList = synAll();
  SV.innerHTML = '<div class="pj-in"><div class="pj-bar"><span></span><button type="button" class="pj-close" data-sa="close">Volver al chat' + PJ_X + '</button></div>'
    + '<header class="pj-lh"><div><h1>Sintéticos</h1><p>Todo lo que la IA creó en tus chats: páginas, juegos, dibujos, código y documentos. Tócalo y se abre al lado.</p></div></header>'
    + (synList.length ? '<div class="syn-l">' + synList.map((x, n) => '<div class="syn-w' + (x.P ? ' web' : '') + '"><button type="button" class="syn-c" data-sn="' + n + '">' + (x.P ? '<span class="fc-ic wp-ic" aria-hidden="true">' + WEB_ICO.web + '</span>' : fcIc(x.M.ext)) + '<b>' + esc(x.M.name) + '</b><small>' + (x.P ? '<span class="notr">' + esc(webTxt(SZ.lang() === 'en').kind + ' · ' + webTxt(SZ.lang() === 'en').files(x.P.files.length)) + '</span>' : esc(x.M.label) + ' · ' + x.M.lines + (SZ.lang() === 'en' ? (x.M.lines === 1 ? ' line' : ' lines') : (x.M.lines === 1 ? ' línea' : ' líneas'))) + '</small><small>' + esc(x.th.title) + (x.th.t ? ' · ' + pjAgo(x.th.t) : '') + '</small></button><button type="button" class="syn-go" data-sg="' + n + '" title="Ir al chat donde nació">Ir al chat</button></div>').join('') + '</div>'
      : '<div class="pj-empty"><span class="pj-big">' + SYN_ICO + '</span><b>Aún no hay Sintéticos</b><p>Pídele a la IA una página, un juego o un dibujo (por ejemplo «hazme una calculadora bonita») y aparecerá aquí.</p></div>')
    + '</div>';
  SV.scrollTop = 0; SV.focus({ preventScroll:true });
}
function synClose(){ if (SV.hidden) return; SV.hidden = true; document.body.classList.remove('synon'); $('#railSyn').setAttribute('aria-pressed', 'false'); }
SV.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.sa === 'close'){ synClose(); return; }
  if (b.dataset.sg != null){ const x = synList[+b.dataset.sg]; if (x) openThread(x.th.model, x.th.id); return; }
  if (b.dataset.sn != null){ const x = synList[+b.dataset.sn]; if (x && x.P) webOpen(x.P, { tab:'prev' }); else if (x) openCanvas(x.M, x.sibs(), canPreview(x.M) ? 'prev' : 'code'); }
});
addEventListener('keydown', e => { if (e.key === 'Escape' && !SV.hidden && !cvEl && !document.querySelector('.szm.on')) synClose(); });
{
  const rb = document.createElement('button'); rb.type = 'button'; rb.className = 'rbtn'; rb.id = 'railSyn'; rb.dataset.tip = 'Sintéticos'; rb.style.setProperty('--i', '2');
  rb.innerHTML = SYN_ICO + '<span class="rl">Sintéticos</span>'; rb.setAttribute('aria-label', 'Sintéticos'); rb.setAttribute('aria-pressed', 'false');
  ($('#railProj') || $('#rail [data-r="new"]')).after(rb);
  rb.addEventListener('click', () => SV.hidden ? synOpen() : synClose());
  const cb = document.createElement('button'); cb.type = 'button'; cb.className = 'cnew cproj csyn'; cb.id = 'cSyn';
  cb.innerHTML = SYN_ICO + 'Sintéticos';
  ($('#cProj') || $('#cNew')).after(cb);
  cb.addEventListener('click', synOpen);
}
/* abrir un proyecto, un chat o uno nuevo cierra la lista */
const synPj0 = pjOpen; pjOpen = function(){ synClose(); return synPj0.apply(this, arguments); };
const synNew0 = newChat; newChat = function(){ synClose(); return synNew0.apply(this, arguments); };
const synOT0 = openThread; openThread = function(){ synClose(); return synOT0.apply(this, arguments); };
