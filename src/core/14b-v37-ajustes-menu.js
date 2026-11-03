/* ===== v3.7 · Ajustes con menú lateral (estilo del Uiverse #31 que mandó Sammuel: lista vertical con ícono, texto y barra activa)
   Cada título de Ajustes («Cómo se ve», «Idioma», «Color», «Lo que recuerdo de ti»…) es una entrada del menú.
   Tocarla abre su pestaña y baja hasta esa parte; al hacer scroll, la entrada activa sigue lo que estás viendo.
   Las pestañas viejas siguen en el código (la Guía las usa), pero no se ven. En el celular el menú es una fila de chips arriba. ===== */
const CFG_NAV_ICO = {
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  brush:'<path d="M14 4l6 6-9 9H5v-6z"/><path d="M12 6l6 6"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
  size:'<path d="M4 9V4h5M20 15v5h-5M4 4l7 7M20 20l-7-7"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  palette:'<path d="M12 3a9 9 0 100 18c1.2 0 1.8-.9 1.4-1.9-.5-1.2.3-2.1 1.5-2.1H18a3 3 0 003-3c0-6-4-11-9-11z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  phone:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  play:'<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/>',
  brain:'<path d="M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 006 0V4.5A2.5 2.5 0 009 4zM15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-6 0"/>',
  mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  link:'<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>'
};
const cfgNavIco = txt => { const s = String(txt || '').toLowerCase();
  const k = /c[oó]mo se ve|look/.test(s) ? 'eye' : /estilo|style/.test(s) ? 'brush' : /idioma|language/.test(s) ? 'globe' : /tama|size/.test(s) ? 'size' : /atajo|shortcut/.test(s) ? 'bolt'
    : /color|colou?r/.test(s) ? 'palette' : /celular|phone/.test(s) ? 'phone' : /intro/.test(s) ? 'play' : /responden|answer/.test(s) ? 'chat' : /recuerdo|remember|memor/.test(s) ? 'brain' : /dictado|dictation/.test(s) ? 'mic' : /tus ias|your ais/.test(s) ? 'link' : 'sliders';
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + CFG_NAV_ICO[k] + '</svg>'; };
function cfgSideMenu(o){
  const card = o && $('.cfgcard', o), body = card && $('.cfgbody', card), tabs = card && $('.cfgtabs', card); if (!card || !body || !tabs || $('.cfgnav', card)) return;
  const items = [];
  $$('.cfgpane', body).forEach(p => $$('.cfglbl', p).forEach(l => items.push({ pane:p.dataset.pane, l })));
  if (items.length < 2) return;
  const nav = document.createElement('nav'); nav.className = 'cfgnav'; nav.setAttribute('aria-label', 'Secciones de Ajustes');
  nav.innerHTML = items.map((it, i) => '<button type="button" class="cfgnav-i" data-ni="' + i + '">' + cfgNavIco(it.l.textContent) + '<span>' + esc(it.l.textContent) + '</span></button>').join('');
  card.classList.add('cfg-side'); body.before(nav);
  const btns = $$('.cfgnav-i', nav);
  const mark = i => btns.forEach((b, k) => { const on = k === i; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); if (on && nav.scrollWidth > nav.clientWidth + 4) b.scrollIntoView({ block:'nearest', inline:'nearest' }); });
  const paneOn = () => { const p = $('.cfgpane:not([hidden])', body); return p ? p.dataset.pane : ''; };
  let lock = 0;
  const follow = () => {
    if (Date.now() < lock) return;
    const top = body.getBoundingClientRect().top + 48, pane = paneOn(); let best = -1;
    items.forEach((it, i) => { if (it.pane === pane && it.l.getBoundingClientRect().top <= top) best = i; });
    if (best < 0) best = items.findIndex(it => it.pane === pane);
    mark(best);
  };
  nav.addEventListener('click', e => {
    const b = e.target.closest('.cfgnav-i'); if (!b) return;
    const it = items[+b.dataset.ni]; if (!it) return;
    if (paneOn() !== it.pane){ const tb = $('[data-tab="' + it.pane + '"]', tabs); if (tb) tb.click(); }
    lock = Date.now() + 700; mark(+b.dataset.ni);
    requestAnimationFrame(() => { body.scrollTo({ top:Math.max(0, it.l.offsetTop - body.offsetTop - 6), behavior:reduce ? 'auto' : 'smooth' }); });
  });
  body.addEventListener('scroll', () => requestAnimationFrame(follow), { passive:true });
  tabs.addEventListener('click', () => setTimeout(follow, 60));
  setTimeout(follow, 80);
}
