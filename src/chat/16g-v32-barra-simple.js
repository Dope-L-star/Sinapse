/* ===== v3.2 · la barra de chats al estilo Claude en el modo Simple (pedido de Sammuel, 28 oct) =====
   Arriba Crear, Proyectos, Sintéticos, Personalización y Más; en medio tus chats («Recientes»);
   abajo tu cuenta y una lupa para buscar. La barrita de íconos se esconde mientras la lista está abierta.
   v3.7 · ahora también en el estilo SynthFlow (con los colores del tema): una sola barra, más simple, para todos. */
let accInfo = { ready:false, name:'Entrar', plan:'Gratis' };
{
  const cin = $('#chats .cin'), head = $('#chats .chead');
  const I = {
    new:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    proj:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-6.5L9.6 5.6A2 2 0 0 0 8 5H6a2 2 0 0 0-2 2.5z"/></svg>',
    syn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="12" height="14" rx="2.5"/><path d="M8.5 5V4.5A1.5 1.5 0 0 1 10 3h8.5A2 2 0 0 1 20.5 5v11A1.5 1.5 0 0 1 19 17.5h-.5"/><path d="M7.5 10l-1.5 2 1.5 2M11.5 10l1.5 2-1.5 2"/></svg>',
    cfg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7" width="17" height="12.5" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M3.5 12.5h17"/></svg>',
    more:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/></svg>',
    star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/></svg>',
    guide:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/></svg>',
    help:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13z"/></svg>',
    batt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7.5" width="16" height="9" rx="2.2"/><path d="M21 10.5v3"/><path d="M6 10.5v3M9 10.5v3" stroke-width="2.2"/></svg>',
    find:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>',
    side:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M9.5 4.5v15"/></svg>',
    cmp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="7.5" height="14" rx="2"/><rect x="13.5" y="5" width="7.5" height="14" rx="2"/></svg>',
    chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10l5 5 5-5"/></svg>'
  };
  const item = (k, ic, t, extra) => '<button type="button" class="sn-i" data-sn="' + k + '" style="--d:' + extra + '"><span class="sn-ic" aria-hidden="true">' + ic + '</span><span class="sn-t">' + t + '</span></button>';
  /* v3.7 · en la versión React el menú lo pinta y lo maneja el componente BarraNav (usa window.SZFlow); aquí solo si no está */
  const reactNav = !!document.getElementById('sNav');
  const nav = reactNav ? document.getElementById('sNav') : document.createElement('nav'); if (!reactNav){ nav.className = 'snav'; nav.id = 'sNav'; nav.setAttribute('aria-label', 'Menú de SynthFlow');
  nav.innerHTML = '<div class="sn-top"><a class="sn-logo" href="index.html" aria-label="Volver a SymphorIA">' + SZ.flowWord() + '</a><button type="button" class="sn-x" data-sn="hide" aria-label="Cerrar la barra" data-tip="Cerrar la barra">' + I.side + '</button></div>'
    + item('new', I.new, 'Crear', 0) + item('cmp', I.cmp, 'Comparar IAs', 1) + item('proj', I.proj, 'Proyectos', 2) + item('syn', I.syn, 'Sintéticos', 3) + item('cfg', I.cfg, 'Personalización', 4)
    + '<button type="button" class="sn-i sn-more" data-sn="more" aria-expanded="false" aria-controls="snMore" style="--d:5"><span class="sn-ic" aria-hidden="true">' + I.more + '</span><span class="sn-t">Más</span><span class="sn-chev" aria-hidden="true">' + I.chev + '</span></button>'
    + '<div class="sn-sub" id="snMore" hidden>' + item('favs', I.star, 'Mensajes favoritos', 0) + item('energy', I.batt, 'Tu EnerX de hoy', 1) + item('guide', I.guide, 'Guía de SynthFlow', 2) + item('help', I.help, 'Centro de ayuda', 3) + '</div>';
  head.after(nav); }
  /* v3.7 · «Recientes» y el pie (tu cuenta + lupa) también los pinta React (PieBarra); aquí solo el motor de la cuenta */
  const reactFoot = !!document.getElementById('sFoot');
  if (!reactFoot){
    const rh = document.createElement('p'); rh.className = 'sn-h'; rh.textContent = 'Recientes'; $('#thList').before(rh);
    const foot = document.createElement('div'); foot.className = 'sfoot'; foot.id = 'sFoot';
    foot.innerHTML = '<button type="button" class="sf-acc" id="sAcc"></button><button type="button" class="sf-find" id="sFind" aria-label="Buscar en tus chats" data-tip="Buscar en tus chats" aria-pressed="false">' + I.find + '</button>';
    cin.appendChild(foot);
  }

  /* tu cuenta: copia lo que muestra el botón de cuenta de la barrita (foto, nombre y plan) */
  const accPaint = () => {
    const A = SZ.ACC || {}, u = A.user || {}, sa = $('#sAcc');
    const plan = A.ready ? (SZ.ROLE_NAME && SZ.ROLE_NAME[u.role || 'user']) || 'Synther' : 'Gratis';
    const av = A.ready && SZ.myAvatar ? SZ.myAvatar() : '<span class="av-me" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></span>';
    const nm = A.ready ? SZ.accName() : 'Entrar';
    if (reactFoot){
      /* React pinta nombre y plan; la foto (HTML del motor) va en su hueco */
      const fa = $('#sAcc .sf-av'); if (fa) fa.innerHTML = av;
      accInfo = { ready:!!A.ready, name:nm.slice(0, 22), plan:A.ready ? plan : 'Gratis' };
      try{ dispatchEvent(new CustomEvent('synthflow-acc', { detail:accInfo })); }catch(e){}
      return;
    }
    sa.innerHTML = '<span class="sf-av">' + av + '</span><span class="sf-n"><b></b><small></small></span><span class="sf-chev" aria-hidden="true">' + I.chev + '</span>';
    $('.sf-n b', sa).textContent = nm.slice(0, 22); $('.sf-n small', sa).textContent = A.ready ? plan : 'Gratis';
    sa.setAttribute('aria-label', A.ready ? 'Tu cuenta: ' + nm : 'Entrar a tu cuenta');
  };
  accPaint();
  const ab = $('#accBtn'); if (ab) new MutationObserver(accPaint).observe(ab, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });

  if (!reactFoot){
    $('#sAcc').addEventListener('click', () => accModal());
    /* la lupa muestra la búsqueda arriba de los chats (y la esconde si está vacía) */
    const q = $('#thQ');
    const findOn = on => { cin.classList.toggle('sfind', on); $('#sFind').setAttribute('aria-pressed', String(on)); if (on) setTimeout(() => q.focus(), 60); };
    $('#sFind').addEventListener('click', () => { const on = !cin.classList.contains('sfind'); if (!on && q.value){ q.value = ''; q.dispatchEvent(new Event('input', { bubbles:true })); } findOn(on); });
    q.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('simple') && !q.value) findOn(false); });
  }

  if (!reactNav){
  const more = $('#snMore'), mb = $('[data-sn="more"]', nav);
  const moreOn = on => { more.hidden = !on; mb.setAttribute('aria-expanded', String(on)); nav.classList.toggle('mopen', on); };
  nav.addEventListener('click', e => {
    const b = e.target.closest('[data-sn]'); if (!b) return;
    const k = b.dataset.sn; SZ.SND && SZ.SND.tap && SZ.SND.tap();
    if (k === 'more'){ moreOn(more.hidden); return; }
    if (k === 'hide'){ $('#chatsClose').click(); return; }
    if (k === 'new') newChat();
    else if (k === 'cmp') cmpOpen(b);
    else if (k === 'proj') pjOpen('list');
    else if (k === 'syn') synOpen();
    else if (k === 'cfg') SZ.cfgModal();
    else if (k === 'favs') showChats('favs');
    else if (k === 'energy') coinModal('panel');
    else if (k === 'guide'){ openGuide(); }
    else if (k === 'help') location.href = 'ayuda.html';
    if (k !== 'new' && k !== 'favs') moreOn(false);
    if (isMobile() && k !== 'favs') closeChatsSheet();
  });
  /* el que está abierto se marca, como en Claude */
  const mark = () => {
    const on = { cmp:document.body.classList.contains('cmpm'), proj:document.body.classList.contains('pjon'), syn:!$('#synv') || $('#synv').hidden ? false : true };
    $$('.sn-i[data-sn]', nav).forEach(b => b.classList.toggle('on', !!on[b.dataset.sn]));
  };
  new MutationObserver(mark).observe(document.body, { attributes:true, attributeFilter:['class'] });
  const sv = $('#synv'); if (sv) new MutationObserver(mark).observe(sv, { attributes:true, attributeFilter:['hidden'] });
  mark();
  }
}
/* v3.7 · «Comparar IAs», aparte del chat normal: marcas de 2 a 4 IA y responden la misma pregunta lado a lado.
   Si ya estás comparando, te deja sumar otra (hasta 4). */
function cmpOpen(anchor){
  if (trialOn){ toast('La prueba guiada usa una sola IA. Para comparar, entra con tu cuenta o conecta Puter (es gratis).'); return; }
  if (mode === 'cmp'){ if (st().cmp.length < CMP_MAX) openSide('add', anchor); else { toast('Ya estás comparando 4 IA, el máximo.'); inp.focus(); } return; }
  openSide('cmp', anchor);
}
