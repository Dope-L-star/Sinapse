/* ---------- ayuda con bloqueadores de ventanas y de anuncios ---------- */
function browserName(){ const u = navigator.userAgent; if (navigator.brave) return 'Brave'; if (/Edg\//.test(u)) return 'Edge'; if (/OPR\//.test(u)) return 'Opera'; if (/Firefox\//.test(u)) return 'Firefox'; if (/Safari\//.test(u) && !/Chrome\//.test(u)) return 'Safari'; return 'Chrome'; }
const ICO = {
  pop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/><path d="M10 12.5l4 4M14 12.5l-4 4" stroke="#ff8f7a"/></svg>',
  ext:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4a2 2 0 0 1 4 0v2h3a1 1 0 0 1 1 1v3h-1.5a2 2 0 0 0 0 4H18v3a1 1 0 0 1-1 1h-3v-1.5a2 2 0 0 0-4 0V20H7a1 1 0 0 1-1-1v-3h1.5a2 2 0 0 0 0-4H6V7a1 1 0 0 1 1-1h3z"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>',
  lock:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
};
let blkEl = null;
function showBlockHelp(kind){
  if (kind === 'popup') window.__popupBlocked = true;   /* recuerda que de verdad hubo una ventanita bloqueada */
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
addEventListener('puter-ready', () => { const go = () => loading ? setTimeout(go, 300) : (refresh(true), renderNow()); go(); });
if (window.puter && !cat.list.some(m => /^pu:/.test(m.id))) setTimeout(() => { const go = () => loading ? setTimeout(go, 300) : refresh(true); go(); }, 0);
addEventListener('puter-blocked', () => { toast('Tu bloqueador de anuncios está frenando a Puter.'); });
function warnBlocked(){
  if (!window.__puterBlocked) return;
  try{ if (sessionStorage.getItem('synthz:blkwarn')) { toast('Puter no carga en tu navegador. Toca «⋯ › Ayuda: algo no carga».'); return; } sessionStorage.setItem('synthz:blkwarn', '1'); }catch(e){}
  showBlockHelp('script');
}

/* ---------- SynXCoin's: medidor, límite diario, avisos y modo ahorro ---------- */
function todayUsed(){ return SZ.todayAll(); }
let sxEl = null;
function budgetOk(){ return true; }        /* ya no hay límite personal: el límite de hoy lo pone SymphorIA */
let limWarned = '';
function coinWatch(){
  const q = SZ.SZQ; if (!q.limit || q.on === false) return;
  const k = SZ.limPct(), d = today();
  if (k >= 1 && limWarned !== d + 'x'){ limWarned = d + 'x'; toast(puterOn() ? 'Llegaste al límite de hoy. Sigues con tu Puter.' : 'Usaste tu límite gratis de hoy. A medianoche se llenan otra vez, o sigue ya con Puter.'); try{ SZ.BOT.react && SZ.BOT.react('limit'); }catch(e){} }
  else if (k >= .8 && k < 1 && !limWarned.startsWith(d)){ limWarned = d; toast('Te queda poco por hoy: ' + SZ.limTxt().toLowerCase() + '.'); }
}
addEventListener('synthz-szq', coinWatch);
function coinModal(kind){
  if (sxEl) sxEl.remove();
  const T = {
    pu:['Usaste el saldo de este mes de Puter', 'Se llena otra vez el próximo mes. Mientras tanto sigues con las IAs conectadas, gratis.'],
    or:['Llegaste al límite de hoy', 'A medianoche se llenan otra vez. Si quieres seguir ya, conecta Puter. Conecta tu versión pro de las IAs más usadas.'],
    panel:['Tu límite de hoy', 'Tienes un límite gratis cada día. A medianoche se llena otra vez.']
  }[kind] || ['Tu límite de hoy', ''];
  sxEl = document.createElement('div'); sxEl.id = 'sx';
  sxEl.innerHTML = '<div class="tcard" role="dialog" aria-modal="true"><div class="word" id="sxWord"></div><div class="tn">TU LÍMITE</div><div class="tb"><h3>' + T[0] + '</h3><p>' + T[1] + '</p></div>'
    + '<div class="limbig">' + SZ.limRing(84) + '<div><b>' + esc(SZ.limShort()) + '</b><span>tu EnerX de hoy · se carga a medianoche</span></div></div>'
    + SZ.limBar({ title:'IAs conectadas', puter:!puterOn() })
    + '<div id="sxBal"><div class="bl-load">Revisando tu cuenta de Puter…</div></div>'
    + '<div class="sxlbl">RESPUESTAS CORTAS</div><div class="sxsave"><p>La IA responde más corto y usa menos de tu historial. Así te alcanza para más.</p><button class="sxsw" id="sxSw" type="button" aria-pressed="' + st().sx.saver + '" aria-label="Respuestas cortas"></button></div>'
    + '<div class="tbtn" style="margin-top:18px"><button class="lnk" id="sxClose" type="button">Cerrar</button>'
    + (kind === 'pu' && szOn() ? '<button class="btn sm" id="sxGo" type="button">Seguir gratis</button>' : kind === 'or' ? '<button class="btn sm" id="sxGo" type="button">' + (puterOn() ? 'Seguir con mi Puter' : 'Conectar Puter') + '</button>' : '') + '</div></div>';
  document.body.appendChild(sxEl); $('#sxWord').innerHTML = zWord('Synth');
  const bal = $('#sxBal', sxEl);
  if (bal) SZ.providerBalance(true).then(b => { if (bal.isConnected) bal.innerHTML = SZ.balanceHtml(b); });
  requestAnimationFrame(() => sxEl.classList.add('on'));
  $('.tcard', sxEl).animate([{ transform:'scale(.9) translateY(24px)', opacity:0, filter:'blur(10px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { if (!sxEl) return; const el = sxEl; sxEl = null; el.classList.remove('on'); setTimeout(() => el.remove(), 470); };
  $('#sxClose').addEventListener('click', close);
  sxEl.addEventListener('pointerdown', e => { if (e.target === sxEl) close(); });
  const go = $('#sxGo');
  if (go) go.addEventListener('click', () => { close(); if (kind === 'or' && !puterOn()) openConnect(); else switchProv(kind === 'pu' ? 'sz' : 'pu'); });
  const sw = $('#sxSw');
  if (sw) sw.addEventListener('click', () => setSaver(!st().sx.saver));
}
function setSaver(on){
  st().sx.saver = on; save();
  $$('#sxSw, #saverBtn').forEach(x => x.setAttribute('aria-pressed', String(on)));
  updateHint(); toast(on ? 'Modo ahorro activado.' : 'Modo ahorro desactivado.');
  try{ dispatchEvent(new Event('synthz-saver')); }catch(e){}   /* v3.2 · la bolita 🍃 junto al «+» aparece al instante */
}
$('#saverBtn').setAttribute('aria-pressed', String(st().sx.saver));
$('#saverBtn').addEventListener('click', () => setSaver(!st().sx.saver));
$('#sideFoot').addEventListener('click', e => { if (e.target.closest('#sxBtn')) coinModal('panel'); });

