/* ---------- modo, panel móvil y atajos ---------- */
function setMode(m){
  mode = m; document.body.classList.toggle('cmpm', m === 'cmp');
  if (m !== 'cmp') cmpLast = null;
  inp.placeholder = m === 'cmp' ? 'Una pregunta para todas las IA…' : 'Escribe tu mensaje…';
  paintSel(); renderTop(); renderMsgs(); renderNow(); renderFoot(); updateHint(); paintAccent();
}
/* ---------- selector de IA flotante (computador) u hoja que sube (celular) ---------- */
const side = $('#side'), scrim = $('#scrim');
/* ---------- v3.7 · selector de IA nuevo (Sammuel: «ese panel de escoger es muy confuso»)
   Antes abría con una pantalla llena de filtros y había que pulsar «Ver las IA» para ver alguna.
   Ahora abre directo en las IA: arriba buscas, al lado eliges Para ti / Todas / Favoritas y abajo tocas la que quieres.
   Los filtros (temas, en qué son buenas, de dónde, orden) quedan detrás de «Personalizar búsqueda».
   Comparar ya no se mezcla aquí: tiene su propio lugar en la barra («Comparar IAs»). ---------- */
const TUNE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/></svg>';
(function twoPanels(){
  /* v3.7 · la versión React (Selector.jsx) ya trae las dos columnas: no se mueve nada */
  if ($('.pf-l', side)) return;
  const L = document.createElement('div'); L.className = 'pf-l'; L.setAttribute('role', 'group'); L.setAttribute('aria-label', 'Personalizar búsqueda');
  const R = document.createElement('div'); R.className = 'pf-r'; R.setAttribute('role', 'group'); R.setAttribute('aria-label', 'Las IA');
  const head = $('.phead', side), fw = $('.fwrap', side) || $('#filters'), prov = $('#provSeg'), sortr = $('.sortrow', side), more = $('#pMore'), pfoot = $('.pfoot', side);
  const lbl = t => { const e = document.createElement('p'); e.className = 'plbl'; e.textContent = t; return e; };
  head.insertAdjacentHTML('beforeend', '<span class="pr-n" id="prN"></span>');
  head.appendChild($('#sideClose'));
  const lh = document.createElement('div'); lh.className = 'pl-head';
  lh.innerHTML = '<b>Personalizar búsqueda</b><button type="button" class="pr-back" id="pBack"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>Listo</span></button>';
  L.append(lh, lbl('¿Para qué la quieres?'), $('#pTopics'), lbl('En qué son buenas'), fw, lbl('De dónde'), prov, sortr);
  const qr = document.createElement('div'); qr.className = 'pq';
  qr.append($('#pTabs'));
  qr.insertAdjacentHTML('beforeend', '<button type="button" class="pcust" id="pCust" aria-expanded="false" aria-controls="side">' + TUNE + '<span>Personalizar búsqueda</span><i class="pc-n" id="pCustN" hidden></i></button>');
  R.append(head, $('#searchBox'), qr, $('#pNote'), $('#mlist'), pfoot);
  if (more) more.remove();
  side.append(L, R); side.classList.add('two-p', 'v37', 'two');
})();
const sideL = $('.pf-l', side), sideR = $('.pf-r', side);
const wide2 = () => matchMedia('(min-width:900px)').matches;
function sideShift(){}
/* cuántos filtros tienes puestos: se ve en el botón «Personalizar búsqueda» */
function paintCust(){
  const n = ['free', 'fav', 'reason', 'vision', 'long', 'forme', 'code', 'write', 'fast', 'math', 'newm'].filter(k => ui[k]).length + (ptopic ? 1 : 0) + (ui.prov !== 'all' ? 1 : 0);
  const c = $('#pCustN'); if (c){ c.hidden = !n; c.textContent = n; }
}
function custOn(on){
  side.classList.toggle('cust', on); $('#pCust').setAttribute('aria-expanded', String(on));
  requestAnimationFrame(() => { try{ placePill($('#provSeg')); placePill($('#sortSeg')); placePill($('#pTabs')); }catch(e){} });
  if (on && SZ.SND.expand) SZ.SND.expand();
}
function sideStage(two, o = {}){ custOn(!two); if (two && o.focus) setTimeout(() => $('#q').focus(), 60); }
$('#pCust').addEventListener('click', () => custOn(!side.classList.contains('cust')));
$('#pBack').addEventListener('click', () => { custOn(false); renderList({ keep:true, animate:true }); });
sideL.addEventListener('click', e => { if (e.target.closest('[data-ptk],.fchip,#provSeg button,#sortSeg button')) setTimeout(() => { paintCust(); if (wide2()) renderList({ keep:true }); }, 60); });
/* el selector se amplía desde donde lo tocaste hasta el centro, y al cerrarlo vuelve allí (animación al revés) */
let sideFrom = null;
function sideFlip(open){
  if (SZ.reduce) return Promise.resolve();
  const r = side.getBoundingClientRect(), a = sideFrom;
  const cx = a ? a.left + a.width / 2 : r.left + r.width / 2, cy = a ? a.top + a.height / 2 : r.top + r.height / 2;
  const dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2), sx = a ? Math.max(.12, a.width / r.width) : .9, sy = a ? Math.max(.08, a.height / r.height) : .9;
  const A = { transform:'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')', opacity:0, filter:'blur(10px)', borderRadius:'999px' }, B = { transform:'none', opacity:1, filter:'blur(0)', borderRadius:'28px' };
  if (isMobile()){ A.transform = 'translateY(70px)'; A.borderRadius = B.borderRadius = '26px 26px 0 0'; }
  /* si el navegador pausa la animación (pestaña en segundo plano), igual se termina: nunca queda la ventana trabada */
  const D = open ? 620 : 420;
  return Promise.race([side.animate(open ? [A, B] : [B, A], { duration:D, easing:open ? 'cubic-bezier(.22,1,.36,1)' : 'cubic-bezier(.55,0,.75,.2)' }).finished.catch(() => {}), new Promise(r => setTimeout(r, D + 180))]);
}
function placeSide(){}
function openSide(kind, anchor){
  if (isLocked()){ lockNudge(); toast('Primero conecta Puter: es gratis y con un clic.'); return; }
  if (agentOn() && mode === 'solo' && kind !== 'add' && kind !== 'cmp'){ toast('Con SuperiorSynth la IA la elige él. Si quieres elegirla tú, vuelve a «Chats».'); return; }
  pickMode = kind === 'add' || mode === 'cmp' ? 'add' : 'set';
  pickCmp = kind === 'cmp' && mode !== 'cmp'; if (!pickCmp) pickSel.clear();
  side.classList.toggle('pcmp', pickCmp);
  $('#pTitle').textContent = pickCmp ? 'Compara IAs lado a lado' : pickMode === 'add' ? 'Suma otra IA a la mesa' : 'Elige tu IA';
  const a = anchor && anchor.isConnected ? anchor : $('#curChip') || $('#cPick') || $('#pickRow');
  sideFrom = a ? a.getBoundingClientRect() : null;
  if (pickMode === 'set' && !ptopic && curTopic) ptopic = curTopic;
  renderPTopics(); paintPNote(); paintPGo();
  const wasOpen = side.classList.contains('open');
  if (!wasOpen) custOn(false);
  paintCust();
  side.classList.add('open'); side.setAttribute('aria-hidden', 'false'); scrim.classList.add('on', 'pick');
  $$('#pickRow .mchip').forEach(c => c.setAttribute('aria-expanded', String(pickMode === 'set')));
  setTab(isMobile() ? 'ia' : null);
  renderList({ keep:true });
  requestAnimationFrame(() => placePill($('#pTabs')));
  if (!wasOpen) sideFlip(true);
  if (pickMode === 'set') setTimeout(() => scrollToSel(), 60);
}
/* al abrir la lista, se ve la IA que estás usando (con su proveedor elegido) */
function scrollToSel(){
  const id = selId(); if (!V.rows) return;
  const i = V.rows.findIndex(r => r.t === 'm' && r.m.id === id); if (i < 0) return;
  listEl.scrollTop = Math.max(0, V.tops[i] - 80); vPaint(true);
}
let sideClosing = false;
function closeSide(){
  if (!side.classList.contains('open') || sideClosing) return;
  sideClosing = true;
  const fin = () => {
    sideClosing = false;
    side.classList.remove('open'); side.setAttribute('aria-hidden', 'true');
    if (!$('#chats').classList.contains('msheet')) scrim.classList.remove('on');
    scrim.classList.remove('pick');
    pickMode = 'set'; $$('#pickRow .mchip').forEach(c => c.setAttribute('aria-expanded', 'false'));
    setTab(null); paintSel();
  };
  scrim.classList.remove('pick');
  sideFlip(false).then(fin);
}
$('#sideClose').addEventListener('click', closeSide);
$('#sideDone').addEventListener('click', closeSide);
scrim.addEventListener('click', () => { closeSide(); closeChatsSheet(); });
document.addEventListener('pointerdown', e => {
  if (!side.classList.contains('open') || isMobile()) return;
  if (side.contains(e.target) || e.target.closest('.mchip, .addb, [data-pick], [data-add-cmp], .szm, .ctxm, #tour, #conn, #blk, #svm')) return;
  closeSide();
});
addEventListener('resize', () => { if (side.classList.contains('open') && !isMobile()) placeSide(); });
addEventListener('keydown', e => {
  const tag = e.target.tagName || '', typing = /INPUT|TEXTAREA|SELECT/.test(tag);
  if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')){ e.preventDefault(); openSide('set'); setTimeout(() => { $('#q').focus(); $('#q').select(); }, 60); }
  else if (e.key === 'Escape'){ if (document.activeElement === $('#q') && $('#q').value){ clearQuery(); } else if (side.classList.contains('open')){ closeSide(); const c = $('#curChip'); if (c) c.focus(); } else closeChatsSheet(); }
});

