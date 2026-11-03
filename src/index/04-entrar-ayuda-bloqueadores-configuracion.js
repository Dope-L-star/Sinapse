/* ---------- entrar, ayuda con bloqueadores, configuración y recorrido ---------- */
let FIRST = false, welcomed = false; try{ FIRST = !localStorage.getItem('synthz:visited'); }catch(e){}
/* v4.1 · llegó por «Soy nuevo» (la pantallita): se le muestra la portada como a alguien nuevo, con su recorrido */
try{ const u = new URL(location.href); if (u.searchParams.get('nuevo') === '1'){ FIRST = true; u.searchParams.delete('nuevo'); history.replaceState(null, '', u.pathname + u.search + u.hash); } }catch(e){}
const markVisited = () => { try{ localStorage.setItem('synthz:visited', '1'); }catch(e){} };
function puterSignIn(opts){
  if (!window.puter){ showBlockHelp('script'); return Promise.reject(Object.assign(new Error('sin puter'), { shown:true })); }
  return puter.auth.signIn(opts || {}).catch(e => { if (SZ.isBlocked(e)){ showBlockHelp('popup'); throw Object.assign(new Error('popup'), { shown:true }); } throw e; });
}
function afterConnect(msg){ toast(msg); updateTotals(); }
function openConnect(){ const c = document.getElementById('conectar'); if (c) scrollTo({ top:c.getBoundingClientRect().top + scrollY - 80, behavior:'smooth' }); }
function browserName(){ const u = navigator.userAgent; if (navigator.brave) return 'Brave'; if (/Edg\//.test(u)) return 'Edge'; if (/OPR\//.test(u)) return 'Opera'; if (/Firefox\//.test(u)) return 'Firefox'; if (/Safari\//.test(u) && !/Chrome\//.test(u)) return 'Safari'; return 'Chrome'; }
const ICO = {
  pop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/><path d="M10 12.5l4 4M14 12.5l-4 4" stroke="#ff8f7a"/></svg>',
  ext:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4a2 2 0 0 1 4 0v2h3a1 1 0 0 1 1 1v3h-1.5a2 2 0 0 0 0 4H18v3a1 1 0 0 1-1 1h-3v-1.5a2 2 0 0 0-4 0V20H7a1 1 0 0 1-1-1v-3h1.5a2 2 0 0 0 0-4H6V7a1 1 0 0 1 1-1h3z"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>',
  lock:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
};
let blkEl = null;
function showBlockHelp(kind){
  if (blkEl) return;
  const br = browserName(), pop = kind === 'popup', brave = br === 'Brave';
  const steps = pop
    ? (br === 'Firefox' ? ['Arriba aparece una barra amarilla: <b>Firefox impidió que este sitio abriera una ventana</b>.', 'Pulsa <b>Preferencias</b> y elige <b>Permitir ventanas emergentes</b> para este sitio.', 'Vuelve aquí y pulsa <b>Reintentar</b>.']
      : br === 'Safari' ? ['En el menú <b>Safari</b>, abre <b>Ajustes para este sitio web</b>.', 'En <b>Ventanas emergentes</b>, elige <b>Permitir</b>.', 'Vuelve aquí y pulsa <b>Reintentar</b>.']
      : ['Al final de la barra de direcciones apareció un icono de <b>ventana con una ✕</b> (el número 1).', 'Haz clic y elige <b>Permitir siempre ventanas emergentes</b> de este sitio.', 'Pulsa <b>Reintentar</b>. Si no ves el icono, revisa tu bloqueador de anuncios en <b>extensiones</b> (el paso 2).'])
    : (brave ? ['Haz clic en el <b>león de Brave Shields</b> en la barra (el número 1).', 'Baja los escudos para este sitio.', 'Pulsa <b>Recargar</b>.']
      : ['Haz clic en el icono de <b>extensiones</b>, la pieza de puzle a la derecha (el número 1).', 'Abre tu bloqueador (uBlock, AdBlock, AdGuard…) y <b>desactívalo para este sitio</b>.', 'Pulsa <b>Recargar</b>.']);
  const bi = (ico, n) => '<span class="bi' + (n ? ' hl' : '') + '">' + ico + (n ? '<i class="nb">' + n + '</i>' : '') + '</span>';
  const icons = pop ? bi(ICO.pop, br === 'Firefox' || br === 'Safari' ? 0 : 1) + bi(ICO.ext, br === 'Firefox' || br === 'Safari' ? 0 : 2) : (brave ? bi(ICO.shield, 1) + bi(ICO.ext, 0) : bi(ICO.ext, 1));
  blkEl = document.createElement('div'); blkEl.id = 'blk';
  blkEl.innerHTML = '<div class="tcard" role="dialog" aria-modal="true"><div class="word" id="bWord"></div><div class="tn">AVISO · ' + esc(br.toUpperCase()) + '</div><div class="tb"><h3>' + (pop ? 'Tu navegador no dejó abrir la ventanita de Puter' : 'Tu bloqueador de anuncios está frenando a Puter') + '</h3><p>' + (pop ? 'Para entrar a Puter se abre una ventanita, y ' + esc(br) + ' no la dejó abrir. Así la permites:' : 'Un bloqueador de anuncios no deja cargar Puter. Las IAs conectadas siguen funcionando. Así lo arreglas:') + '</p></div>'
    + '<div class="bbar" aria-hidden="true"><span class="dots"><i></i><i></i><i></i></span><span class="url">' + ICO.lock + esc(location.host || 'tu-sitio') + '</span>' + icons + '</div>'
    + '<ol class="bsteps">' + steps.map(s => '<li>' + s + '</li>').join('') + '</ol>'
    + (pop ? '<div class="bforce" id="bForce"><b>¿Lo intento de otra forma?</b> Pruebo entrar a Puter por otro camino. Puede que tampoco funcione si el bloqueo es muy fuerte.<div class="tbtn"><button class="lnk" id="bNo" type="button">No</button><button class="btn sm" id="bYes" type="button">Sí, forzar</button></div></div>' : '')
    + '<div class="tbtn" style="margin-top:16px"><button class="lnk" id="bClose" type="button">' + (pop ? 'Cerrar' : 'Seguir sin Puter') + '</button>' + (pop ? '<button class="lnk" id="bAsk" type="button">Forzar</button>' : '') + '<button class="btn sm" id="bGo" type="button">' + (pop ? 'Reintentar' : 'Recargar') + '</button></div></div>';
  document.body.appendChild(blkEl); $('#bWord').innerHTML = zWord('Synth');
  requestAnimationFrame(() => blkEl.classList.add('on'));
  $('.tcard', blkEl).animate([{ transform:'scale(.9) translateY(24px)', opacity:0, filter:'blur(10px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { if (!blkEl) return; const el = blkEl; blkEl = null; el.classList.remove('on'); setTimeout(() => el.remove(), 470); };
  $('#bClose').addEventListener('click', () => { close(); if (!pop) openConnect(); });
  blkEl.addEventListener('pointerdown', e => { if (e.target === blkEl) close(); });
  $('#bGo').addEventListener('click', () => {
    if (!pop){ location.reload(); return; }
    close(); puterSignIn().then(() => afterConnect('¡Puter conectado!')).catch(() => {});
  });
  if (pop){
    $('#bAsk').addEventListener('click', () => $('#bForce').classList.add('on'));
    $('#bNo').addEventListener('click', () => $('#bForce').classList.remove('on'));
    $('#bYes').addEventListener('click', () => {
      const ui2 = window.puter && puter.ui && puter.ui.authenticateWithPuter;
      if (!ui2){ toast('Ese camino no funcionó. Permite las ventanitas de este sitio y pulsa Reintentar.'); return; }
      close(); puter.ui.authenticateWithPuter().then(() => afterConnect('¡Puter conectado!')).catch(() => toast('Tampoco funcionó. Permite las ventanitas de este sitio y pulsa Reintentar.'));
    });
  }
}

function authModal(first, next, opts){
  opts = opts || {};
  if ($('#authm')) return $('#authm');
  const o = document.createElement('div'); o.id = 'authm'; o.className = 'szm';
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Entrar a SymphorIA"><div class="word">' + zWord('Synth') + '</div><div class="tn">' + (first ? 'BIENVENIDO' : 'TU CUENTA') + '</div><div class="tb"><h3>' + (first ? 'Bienvenido a SymphorIA' : 'Entra a SymphorIA') + '</h3><p>Crea tu cuenta gratis con un usuario y una contraseña: tus chats y favoritos te siguen a cualquier dispositivo y personalizas tu perfil.</p><div id="authBox"></div></div><div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>' + (first ? 'Continuar sin cuenta' : 'Cerrar') + '</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  if (!opts.hold) $('.tcard', o).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  let done = false;
  const out = ok => { o.classList.remove('on'); setTimeout(() => o.remove(), 450); if (!done){ done = true; if (next) next(ok); } };
  $('[data-close]', o).addEventListener('click', () => out(false));
  SZ.authBox($('#authBox', o), m => { toast(m === 'tmp' ? '¡Listo! Estás en una cuenta temporal.' : '¡Bienvenido a tu cuenta de SymphorIA!'); updateTotals(); out(true); }, k => showBlockHelp(k));
  return o;
}
function openHelp(){ SZ.helpGuide({ extra:[['Recorrido por la página', () => pageTour()], ['Abrir SynthFlow', () => openChat()]] }); }
/* Guía: Asistida (SynthonIA en SynthFlow, con la cinemática y 5 mensajes de prueba) o Lectura (aquí mismo) */
function openGuide(){ pageTour(() => setTimeout(() => { if (!SZ.ACC.ready) authModal(false, () => updateTotals()); }, 400)); }
$('#helpBtn').addEventListener('click', openGuide);
/* menú del celular */
{
  const nb = $('#navMenu'), nd = $('#navDrop');
  const setOpen = on => { nb.setAttribute('aria-expanded', String(on)); if (on){ nd.hidden = false; requestAnimationFrame(() => nd.classList.add('on')); } else { nd.classList.remove('on'); setTimeout(() => { if (!nd.classList.contains('on')) nd.hidden = true; }, 380); } };
  nb.addEventListener('click', e => { e.stopPropagation(); setOpen(nb.getAttribute('aria-expanded') !== 'true'); });
  nd.addEventListener('click', e => { const b = e.target.closest('[data-nd]'); setOpen(false); if (b){ if (b.dataset.nd === 'help') openGuide(); else if (b.dataset.nd === 'acc') $('#accBtn').click(); else if (b.dataset.nd !== 'lang') $('#cfgBtn').click(); } });
  document.addEventListener('click', e => { if (!nd.hidden && !e.target.closest('#navDrop')) setOpen(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !nd.hidden){ setOpen(false); nb.focus(); } });
}
/* primera vez: primero el tutorial; entrar o crear cuenta viene después (o con «Ahora no») */
function firstRun(){ pageTour(() => setTimeout(() => { if (!SZ.ACC.ready) authModal(true, () => updateTotals()); }, 500)); }
function pageTour(onEnd){
  if ($('#ptour')) return;
  let pick = SZ.CFG.perf;
  const vis = sel => { const e = sel && document.querySelector(sel); return !sel || !!(e && e.offsetWidth && e.getClientRects().length); };
  const first = (...L) => L.find(x => vis(x)) || L[L.length - 1];
  const steps = [
    { s:'.logo', t:SZ.t('tour.logo.t'), p:SZ.t('tour.logo.p') },
    { s:'.navlinks', t:SZ.t('tour.menu.t'), p:SZ.t('tour.menu.p') },
    { s:'.pill-total', t:SZ.t('tour.lim.t'), p:SZ.t('tour.lim.p') },
    { s:first('#railMe', '#accBtn', '#navMenu'), t:SZ.t('tour.acc.t'), p:SZ.t('tour.acc.p') },
    { s:first('#railCfg', '#cfgBtn', '#navMenu'), t:SZ.t('tour.cfg.t'), p:SZ.t('tour.cfg.p'), x:'cfg' },
    { s:'#como', t:SZ.t('tour.como.t'), p:SZ.t('tour.como.p') },
    { s:'#conectar', t:SZ.t('tour.con.t'), p:SZ.t('tour.con.p') },
    { s:'#chat', t:SZ.t('tour.chat.t'), p:SZ.t('tour.chat.p') },
    { s:'#consumo', t:SZ.t('tour.uso.t'), p:SZ.t('tour.uso.p') },
    { s:null, t:SZ.t('tour.fin.t'), p:SZ.t('tour.fin.p') }
  ].filter(x => vis(x.s));
  const o = document.createElement('div'); o.id = 'ptour';
  o.innerHTML = '<div class="catch"></div><div class="hole"></div><div class="pcard tcard" role="dialog" aria-modal="true" aria-label="' + SZ.t('tour.aria') + '"><div class="tn"></div><div class="tb"><h3></h3><p></p><div class="tx"></div></div><div class="tdots">' + steps.map(() => '<i></i>').join('') + '</div><div class="tbtn"><button class="lnk" type="button" data-skip>' + SZ.t('tour.skip') + '</button><span style="flex:1"></span><button class="lnk" type="button" data-back>' + SZ.t('tour.back') + '</button><button class="btn sm" type="button" data-next>' + SZ.t('tour.next') + '</button></div></div>';
  document.body.appendChild(o);
  const hole = $('.hole', o), card = $('.pcard', o);
  let i = 0, target = null, follow = 0;
  const gc = document.createElement('div'); gc.id = 'gcur';
  gc.innerHTML = '<i></i><svg viewBox="0 0 22 30" fill="none"><path d="M2.5 2.2V23L8 18.1L11.6 26.4L15.2 24.9L11.7 16.9L19 16.6Z" fill="#0d0e12" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.body.appendChild(gc);
  let gx = innerWidth / 2, gy = innerHeight / 2, gT = 0;
  const guide = () => {
    if (!target){ gc.classList.remove('on'); return; }
    const r = target.getBoundingClientRect(), x = Math.min(innerWidth - 30, Math.max(10, r.left + Math.min(r.width / 2, 120))), y = Math.min(innerHeight - 30, Math.max(10, r.top + Math.min(r.height / 2, 60)));
    gc.classList.add('on');
    if (Math.abs(x - gx) > 2 || Math.abs(y - gy) > 2){ gx = x; gy = y; gc.style.transform = 'translate(' + x + 'px,' + y + 'px)'; clearTimeout(gT); gT = setTimeout(() => { gc.classList.remove('tap'); void gc.offsetWidth; gc.classList.add('tap'); }, 900); }
  };
  gc.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';
  const place = () => {
    const W = innerWidth, H = innerHeight, sec = target && target.tagName === 'SECTION';
    const r = target ? target.getBoundingClientRect() : { left:W / 2, top:H / 2, width:0, height:0 }, pad = target ? 10 : 0;
    const x = Math.max(8, r.left - pad), y = Math.max(8, r.top - pad), w = Math.min(W - 16 - x, r.width + pad * 2);
    let h = Math.min(r.height + pad * 2, H - 8 - y); if (sec) h = Math.min(h, H * .42);
    hole.style.left = x + 'px'; hole.style.top = y + 'px'; hole.style.width = Math.max(0, w) + 'px'; hole.style.height = Math.max(0, h) + 'px'; hole.style.opacity = target ? '1' : '0';
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let cy = y + h + 16; if (cy + ch > H - 10) cy = y - ch - 16; if (cy < 10) cy = Math.max(10, H - ch - 12);
    if (!target) cy = (H - ch) / 2;
    const cx = target ? Math.min(W - cw - 10, Math.max(10, x + w / 2 - cw / 2)) : (W - cw) / 2;
    card.style.left = cx + 'px'; card.style.top = cy + 'px';
  };
  const chase = () => { const t0 = performance.now(); cancelAnimationFrame(follow); const f = now => { place(); if (now - t0 < 1100) follow = requestAnimationFrame(f); }; follow = requestAnimationFrame(f); };
  const show = () => {
    const x = steps[i], last = i === steps.length - 1;
    target = x.s ? document.querySelector(x.s) : null;
    if (target){ const r = target.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 40 || target.tagName === 'SECTION'){ if (getComputedStyle(target.closest('nav') || document.body).position !== 'fixed') scrollTo({ top:r.top + scrollY - (target.tagName === 'SECTION' ? 84 : innerHeight / 3), behavior:'smooth' }); } }
    $('.tn', card).textContent = String(i + 1).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0');
    $('h3', card).textContent = x.t; $('p', card).textContent = x.p;
    const tx = $('.tx', card); tx.innerHTML = '';
    if (x.x === 'cfg') SZ.cfgChooser(tx, pick, v => { pick = v; requestAnimationFrame(place); });
    $$('.tdots i', card).forEach((d, k) => d.classList.toggle('on', k === i));
    $('[data-back]', card).style.visibility = i ? 'visible' : 'hidden';
    $('[data-skip]', card).style.visibility = last ? 'hidden' : 'visible';
    $('[data-next]', card).textContent = last ? SZ.t(SZ.ACC.ready ? 'tour.start' : 'tour.signin') : SZ.t('tour.next');
    card.animate([{ opacity:.2, filter:'blur(6px)' }, { opacity:1, filter:'blur(0)' }], { duration:450, easing:'cubic-bezier(.22,1,.36,1)' });
    chase(); setTimeout(guide, 450);
  };
  const onMove = () => { place(); guide(); };
  addEventListener('scroll', onMove, { passive:true }); addEventListener('resize', onMove);
  const end = () => {
    gc.classList.remove('on'); setTimeout(() => gc.remove(), 400);
    removeEventListener('scroll', onMove); removeEventListener('resize', onMove); cancelAnimationFrame(follow);
    o.animate([{ opacity:1 }, { opacity:0 }], { duration:350 }).onfinish = () => o.remove();
    markVisited();
    if (pick !== SZ.CFG.perf) SZ.applyCfg(Object.assign({}, SZ.CFG, SZ.cfgPreset(pick), { perf:pick }));
    if (typeof onEnd === 'function') try{ onEnd(); }catch(e){}
  };
  $('[data-skip]', card).addEventListener('click', end);
  $('[data-back]', card).addEventListener('click', () => { if (i > 0){ i--; show(); } });
  $('[data-next]', card).addEventListener('click', () => { if (i < steps.length - 1){ i++; show(); } else { end(); toast(SZ.t('tour.enjoy')); } });
  o.animate([{ opacity:0 }, { opacity:1 }], { duration:400 });
  show();
}

