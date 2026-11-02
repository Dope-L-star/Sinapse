/* ---------- menú «⋯» de la conversación (v2.2: corto, por grupos y con íconos) ---------- */
function mmClose(){ SZ.menuClose(); }
function mmOpen(){
  const mb = $('#moreBtn');
  if (mb.getAttribute('aria-expanded') === 'true' && document.querySelector('.ctxm.mm')){ SZ.menuClose(); mb.setAttribute('aria-expanded', 'false'); return; }
  const L = [{ label:'Nuevo chat', ico:'new', fn:() => newChat() }];
  if (mode === 'solo') L.push({ label:'Copiar la conversación', ico:'copy', fn:() => { copyText(chatMd()); toast('Conversación copiada.'); } }, { label:'Descargar como texto', ico:'down', fn:exportMd });
  else L.push({ label:'Empezar otra comparación', ico:'cmp', fn:() => clearChat() }, { label:'Volver a una sola IA', ico:'exit', fn:() => removeCmp(st().cmp[st().cmp.length - 1]) });
  L.push('—', { label:'Lo que recuerdo de ti', ico:'brain', fn:() => SZ.cfgModal('mem') }, { label:'Ajustes', ico:'cog', fn:() => SZ.cfgModal() }, { label:'Planes', ico:'trophy', fn:() => SZ.plansModal() }, ...(SZ.planOf() === 'orquesta' ? [{ label:'A.L.I.A.S. · equipo', ico:'ai', fn:() => { location.href = 'alias.html'; } }] : []), { label:SZ.lang() === 'en' ? 'Español' : 'English', ico:'globe', fn:() => SZ.setLang(SZ.lang() === 'en' ? 'es' : 'en') }, { label:'Ayuda: algo no carga', ico:'help', fn:helpLoad });
  if (trialOn) L.push({ label:'Salir de la prueba guiada', ico:'exit', fn:() => exitTrial() });
  if (mode === 'solo') L.push('—', { label:'Borrar este chat', ico:'trash', danger:true, fn:() => clearChat(true) });
  const r = mb.getBoundingClientRect(), m = SZ.menuOpen(L, 0, r.bottom + 8, 'mm');
  m.style.left = Math.max(10, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 10)) + 'px';
  mb.setAttribute('aria-expanded', 'true'); const f = $('button', m); if (f) f.focus();
}
/* v3.7 · «Ayuda: algo no carga» revisa primero qué pasa de verdad: antes mostraba siempre el aviso de la ventanita de Puter,
   aunque nada estuviera bloqueado (Sammuel lo vio al tocar el menú «⋯»). Ahora solo sale el aviso que corresponde. */
function helpLoad(){
  if (window.__puterBlocked || !window.puter) return showBlockHelp('script');
  if (window.__popupBlocked) return showBlockHelp('popup');
  toast('Todo está cargando bien. Si algo no funciona, pregúntale a SynthonIA o abre la Ayuda.');
}
$('#moreBtn').dataset.menuOwner = '1'; $('#moreBtn').setAttribute('aria-expanded', 'false');
$('#moreBtn').addEventListener('click', mmOpen);
addEventListener('pointerdown', e => { if (!document.querySelector('.ctxm.mm')) $('#moreBtn').setAttribute('aria-expanded', 'false'); });

/* ---------- batalla ciega: votas sin saber qué IA es ---------- */
function arenaVote(winner, ids){
  /* cada voto cuenta como enfrentamientos de a dos; w + l + d = n siempre */
  const A = st().arena || (st().arena = {}), g = id => { const e = A[id] || (A[id] = { r:1000, w:0, l:0, d:0, n:0, t:0 }); e.d = e.d || 0; e.n = e.n || 0; return e; };
  const K = id => g(id).n < 10 ? 32 : 20, now = Date.now();
  if (winner === 'tie'){ for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++){ const a = g(ids[i]), b = g(ids[j]), ea = 1 / (1 + Math.pow(10, (b.r - a.r) / 400)); a.r += K(ids[i]) * (.5 - ea); b.r -= K(ids[j]) * (.5 - ea); a.d++; b.d++; a.n++; b.n++; } }
  else ids.filter(x => x !== winner).forEach(l => { const a = g(winner), b = g(l), ea = 1 / (1 + Math.pow(10, (b.r - a.r) / 400)); a.r += K(winner) * (1 - ea); b.r -= K(l) * (1 - ea); a.w++; b.l++; a.n++; b.n++; });
  ids.forEach(id => { g(id).t = now; });
  save();
}
function rankModal(){
  const A = st().arena || {}, all = Object.keys(A).map(id => Object.assign({ id }, A[id], { n:A[id].n || (A[id].w + A[id].l + (A[id].d || 0)) })).sort((a, b) => b.r - a.r);
  const firm = all.filter(x => x.n >= 3), few = all.filter(x => x.n < 3), votes = Math.round(all.reduce((s, x) => s + x.n, 0) / 2);
  const row = (x, i) => '<div><i>' + (i == null ? '·' : i + 1) + '</i><b>' + esc(info(x.id).name) + '</b><em>' + (i == null ? x.n + ' enfrent.' : Math.round(x.r) + ' · ' + x.w + 'G ' + x.l + 'P' + (x.d ? ' ' + x.d + 'E' : '')) + '</em></div>';
  const o = document.createElement('div'); o.className = 'szm';
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Tu ranking"><div class="word">' + zWord('Synth') + '</div><div class="tn">BATALLA CIEGA · ' + votes + ' enfrentamientos</div><div class="tb"><h3>Tu ranking</h3><p>Sale de tus votos en «Comparar» con los nombres escondidos: es tu gusto, no una verdad para todos. Una IA aparece aquí cuando ya votaste 3 veces por ella o contra ella.</p></div><div class="rank">'
    + (all.length ? (firm.length ? firm.map(row).join('') : '<p class="cnote">Todavía ninguna IA tiene 3 votos tuyos.</p>') + (few.length ? '<div class="sxlbl">CON POCOS VOTOS AÚN</div>' + few.map(x => row(x, null)).join('') : '') : '<p class="cnote">Aún no has votado. Activa la batalla ciega en Comparar.</p>')
    + '</div><div class="tbtn" style="margin-top:16px"><span></span><button class="lnk" type="button" data-close>Cerrar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 400); };
  $('[data-close]', o).addEventListener('click', close); o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
}
function battleVote(grid, done, C){
  const ids = done.map(d => d.mid);
  const v = document.createElement('div'); v.className = 'vote';
  v.innerHTML = '<span>¿Cuál respondió mejor?</span>' + done.map(d => '<button class="btn sm ghost" type="button" data-w="' + esc(d.mid) + '">' + esc($('.who b', d.card).textContent) + '</button>').join('') + '<button class="lnk" type="button" data-w="tie">Empate</button>';
  grid.appendChild(v); follow();
  v.addEventListener('click', e => {
    const b = e.target.closest('[data-w]'); if (!b) return;
    const w = b.dataset.w; arenaVote(w, ids);
    const f = done.reduce((a, b) => a.ttft <= b.ttft ? a : b);
    done.forEach(d => { const m = info(d.mid), who = $('.who', d.card); who.innerHTML = av(m, 'xs') + '<b>' + esc(m.name) + '</b><span class="stat">' + (d.mid === w ? 'ganó' : 'listo') + '</span>'; who.classList.add('reveal'); d.card.classList.toggle('win', d.mid === w); d.card.dataset.mid = d.mid; $('.meta', d.card).innerHTML = '<span>' + esc(d.card._meta || '') + '</span><span class="badge-fast">⚡ empezó primero</span>'; d.card.classList.toggle('fast', d === f); });
    if (C){ C.voted = true; C.vote = null; C.blind = false; done.forEach(d => { const a = $('.acts', d.card); if (a && !$('.flowb', a)) a.insertAdjacentHTML('beforeend', flowBtn(C)); }); }
    v.remove(); toast(w === 'tie' ? 'Empate guardado en tus favoritas.' : 'Ganó ' + info(w).name + '.');
  });
  return v;
}

/* ---------- Google Drive: más espacio y una copia de tus chats en TU Drive (opcional) ---------- */
const DRV_ICO = '<svg viewBox="0 0 48 48" width="54" height="54" aria-hidden="true"><path d="M14 36h21a8 8 0 0 0 1.4-15.9A11 11 0 0 0 15.3 18 9 9 0 0 0 14 36z" fill="rgba(143,211,232,.12)" stroke="#8fd3e8" stroke-width="2" stroke-linejoin="round"/><path d="M24 31V21M19.5 25.5 24 21l4.5 4.5" fill="none" stroke="#e6b65f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const agoTxt = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'hace un momento' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.round(m / 60) + ' h' : new Date(t).toLocaleDateString('es-CO', { day:'numeric', month:'short' }); };
async function driveGo(btn, quiet){
  const l = btn ? btn.textContent : ''; if (btn){ btn.disabled = true; btn.textContent = 'Conectando con Google…'; }
  try{
    const r = await SZ.DRIVE.sync(); if (r.busy) return false;
    if (!quiet) toast(r.got > 0 ? '¡Listo! Traje ' + r.got + (r.got === 1 ? ' chat' : ' chats') + ' de tu Drive y guardé la copia al día.' : '¡Listo! Tus chats quedaron guardados en tu Google Drive.');
    SZ.SND.done && SZ.SND.done(); burst(innerWidth / 2, innerHeight / 2, ['#8fd3e8', '#e6b65f', '#c9566c'], 16);
    return true;
  }catch(e){ toast(e.message || 'No pude conectar con Google Drive.'); return false; }
  finally{ if (btn && btn.isConnected){ btn.disabled = false; btn.textContent = l; } }
}
function driveModal(){
  if ($('#drv')) return;
  SZ.DRIVE.preload();
  const w = document.createElement('div'); w.id = 'drv'; w.className = 'szm';
  const paint = async () => {
    const cid = await SZ.DRIVE.cid(), m = SZ.DRIVE.meta();
    const body = !cid
      ? '<p class="cnote">Google Drive todavía no está activado en SymphorIA. Cuando Prime o ZFlow lo activen, aquí podrás vincular tu Drive con un clic. Mientras tanto, tus chats siguen guardados en este dispositivo' + (SZ.ACC.ready ? ' y en tu cuenta.' : '.') + '</p>'
      : m && m.linked
        ? '<div class="drst"><i class="pdot2 ' + (SZ.DRIVE.live() ? 'ok' : 'wait') + '" aria-hidden="true"></i><div><b>Tu Drive está vinculado</b><span>' + (m.last ? 'Última copia ' + agoTxt(m.last) + ' · ' + fmt(m.n || 0) + (m.n === 1 ? ' chat · ' : ' chats · ') + ((m.size || 0) / 1048576).toFixed(2).replace('.', ',') + ' MB' : 'Aún sin copia') + '</span><small>' + (SZ.DRIVE.live() ? 'Mientras esta pestaña esté abierta, cada cambio se guarda solo.' : 'Toca «Guardar ahora» para guardar y traer tus chats.') + '</small></div></div>'
        : '<ul class="drl"><li><b>Más espacio:</b> tus chats viven también en tu Google Drive, no solo en este dispositivo.</li><li><b>Privado:</b> uso solo una carpeta oculta de SynthFlow. No puedo ver ni tocar tus otros archivos.</li><li><b>Seguro:</b> nunca borro chats al traerlos (se mezclan) y tus llaves no van en la copia.</li></ul>';
    const cd = $('.tcard', w), h0 = cd.offsetHeight;
    $('.drb', w).innerHTML = body;
    $('.tbtn', w).innerHTML = '<button class="lnk" type="button" data-d="x">Cerrar</button>' + (!cid ? '' : m && m.linked ? '<button class="lnk" type="button" data-d="un">Desvincular</button><button class="btn sm flow" type="button" data-d="go">Guardar ahora</button>' : '<button class="btn sm flow" type="button" data-d="go">Vincular mi Google Drive</button>');
    const h1 = cd.offsetHeight; if (!SZ.reduce && h0 && Math.abs(h1 - h0) > 2){ cd.animate([{ height:h0 + 'px', overflow:'hidden' }, { height:h1 + 'px', overflow:'hidden' }], { duration:520, easing:'cubic-bezier(.22,1,.36,1)' }); $$('.drb > *, .drl li', w).forEach((n, k) => n.animate([{ opacity:0, transform:'translateY(8px)' }, { opacity:1, transform:'none' }], { duration:460, delay:80 + k * 60, easing:'cubic-bezier(.22,1,.36,1)', fill:'backwards' })); }
  };
  w.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Google Drive"><div class="drh">' + DRV_ICO + '<div><div class="tn">GOOGLE DRIVE</div><h3>Guarda tus chats en tu Drive</h3></div></div><div class="drb"><p class="cnote">Cargando…</p></div><div class="tbtn" style="margin-top:16px"></div></div>';
  document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  $('.tcard', w).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:SZ.reduce ? 10 : 600, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { w.classList.remove('on'); setTimeout(() => w.remove(), 420); };
  w.addEventListener('pointerdown', e => { if (e.target === w) close(); });
  w.addEventListener('click', async e => {
    const b = e.target.closest('[data-d]'); if (!b) return;
    if (b.dataset.d === 'x') return close();
    if (b.dataset.d === 'un'){ if (await SZ.szConfirm('¿Desvincular tu Drive?', 'Dejo de guardar copias en tu Drive. La copia que ya está allá no se borra, y tus chats siguen en este dispositivo.', 'Desvincular')){ SZ.DRIVE.unlink(); toast('Desvinculaste tu Google Drive.'); paint(); } return; }
    if (await driveGo(b)) paint();
  });
  paint();
}
