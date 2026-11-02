/* ---------- cabecera ---------- */
function retype(el, text, o){ el.textContent = text; el._chars = null; el.removeAttribute('aria-label'); el.removeAttribute('data-typed'); return typeIn(el, o); }
/* la IA que usas va arriba (donde antes estaba la prueba); quién paga va abajo, junto a la caja */
const PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const CARET = '<svg class="cv" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const XS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
/* v2.3 · con SuperiorSynth encendido, arriba a la izquierda va su sello (en el celular, solo su logo) */
const ssTopHtml = () => '<button type="button" class="sstop" id="ssTop" aria-haspopup="menu" data-menu-owner aria-label="SuperiorSynth elige la IA por ti. Toca para opciones">' + ssIco('lg') + '<span class="sst-t"><b>SuperiorSynth</b><small>elige la IA por ti</small></span>' + CARET + '</button>';
function renderTop(animate){
  const row = $('#pickRow');
  try{ renderCPick(); }catch(e){}
  if (mode === 'solo' && agentOn()){
    row.classList.remove('n3', 'n4');
    row.innerHTML = ssTopHtml() + (document.body.classList.contains('fresh') ? '' : '<span class="paym" id="payM"></span>');
    paintPay(); return;
  }
  if (mode === 'solo' && document.body.classList.contains('fresh')){
    row.classList.remove('n3', 'n4');
    const ok0 = connected(selId()), [k1, long1] = payOf(selId()), k = ok0 ? k1 : 'off', long = ok0 ? long1 : /^pu:/.test(selId()) ? 'Puter · sin conectar (toca para conectarlo)' : long1, left = trialOn ? trialLeft() : 0;
    row.innerHTML = '<button type="button" class="paypill ' + k + '" id="payPill" title="Quién paga lo que escribes">' + '<i aria-hidden="true"></i>' + (trialOn ? 'Prueba guiada · te quedan <b>' + left + ' de ' + ((SZ.trialGet() || {}).max || 5) + '</b> · la paga SymphorIA' : esc(long)) + CARET + '</button>';
    return;
  }
  if (mode === 'solo'){
    row.classList.remove('n3', 'n4');
    const m = info(selId()), open = $('#side').classList.contains('open') && pickMode === 'set';
    row.innerHTML = '<button type="button" class="mchip" id="curChip" aria-haspopup="dialog" aria-expanded="' + open + '" title="Cambiar de IA" style="--vc:' + vendorColor(m.vendor) + '">' + av(m) + '<b id="curName"></b>' + CARET + '</button>'
      /* v3.7 · «Agregar otra IA» ya no va aquí: Comparar tiene su propio lugar en la barra («Comparar IAs») */
      + '<span class="paym" id="payM"></span>';
    const h1 = $('#curName'); h1.setAttribute('aria-label', m.name);
    if (animate) retype(h1, m.name, { cps:70, max:.7 }); else h1.textContent = m.name;
  } else {
    const ids = st().cmp;
    row.classList.remove('n3', 'n4'); if (ids.length >= 3) row.classList.add('n' + ids.length);
    row.innerHTML = ids.map(id => { const m = info(id); return '<span class="mchip c" style="--vc:' + vendorColor(m.vendor) + '">' + av(m) + '<b>' + esc(m.name) + '</b><button type="button" class="rm" data-rm="' + esc(id) + '" aria-label="Quitar ' + esc(m.name) + '">' + XS + '</button></span>'; }).join('')
      + (ids.length < CMP_MAX ? '<button type="button" class="addb ic" data-add aria-label="Agregar otra IA">' + PLUS + '<span>Agregar</span></button>' : '')
      + '<button type="button" class="bt-mini" id="btTog" aria-pressed="' + !!st().battle + '" title="No verás qué IA es hasta que votes">⚔ A ciegas</button>'
      + '<span class="paym" id="payM"></span>';
  }
  paintPay();
}
$('#cPick').addEventListener('click', e => { if (side.classList.contains('open')) closeSide(); else openSide('set', e.currentTarget); });
$('#cCmp').addEventListener('click', e => openSide('add', e.currentTarget));
$('#pickRow').addEventListener('click', e => {
  if (e.target.closest('#payPill')){ if (needsConn()) openConnect(); else coinModal('panel'); return; }
  const ss = e.target.closest('#ssTop'); if (ss){ const r = ss.getBoundingClientRect(); SZ.menuOpen([{ head:'SuperiorSynth' }, { label:'Elegir yo la IA', ico:'chats', fn:() => applyMode('chat') }, { label:'¿Qué hace SuperiorSynth?', ico:'help', fn:() => toast('Tú escribes; SuperiorSynth entiende tu pedido, lo mejora y elige la IA que más sabe de eso. Al final decides si te quedas con esa IA.') }], r.left, r.bottom + 6, 'sstm'); return; }
  const rm = e.target.closest('[data-rm]'); if (rm){ removeCmp(rm.dataset.rm, rm.closest('.mchip')); return; }
  const ad = e.target.closest('[data-add]'); if (ad){ if ($('#side').classList.contains('open') && pickMode === 'add') closeSide(); else openSide('add', ad); return; }
  const bt = e.target.closest('#btTog'); if (bt){ st().battle = !st().battle; save(); bt.setAttribute('aria-pressed', String(!!st().battle)); toast(st().battle ? 'A ciegas: no verás qué IA es hasta que votes (desde la próxima pregunta).' : 'Modo sorpresa apagado: ya ves el nombre de cada IA.'); return; }
  const ch = e.target.closest('#curChip'); if (ch){ if ($('#side').classList.contains('open')) closeSide(); else openSide('set', ch); }
});
/* quién paga lo que escribes: siempre a la vista (regla 5) */
function payOf(id){
  if (id === TRIAL_ID) return ['tr', 'Prueba guiada · la paga SymphorIA', 'Prueba · paga SymphorIA'];
  if (/^sz:/.test(id)) return ['sz', 'Gratis · ' + SZ.limTxt().replace(/^./, c => c.toLowerCase()), 'Gratis · ' + SZ.limShort().replace(/^[A-ZÁÉÍÓÚ]/, c => c.toLowerCase())];
  if (/^pu:/.test(id)) return ['pu', 'Con tu Puter · tu cuenta gratis', 'Con tu Puter'];
  return ['or off', 'Esta IA ya no está disponible: elige otra', 'Elige otra IA'];
}
function paintPay(){
  let c, l, s, ex = false;
  if (mode === 'cmp'){ c = ''; l = 'Comparando · cada IA cuenta como un mensaje'; s = 'Cada IA cuenta como un mensaje'; }
  else if (trialOn){ const left = trialLeft(), mx = (SZ.trialGet() || {}).max || 5; c = 'tr'; ex = true; l = left > 0 ? 'Prueba guiada · te quedan ' + left + ' de ' + mx + ' · la paga SymphorIA' : 'Prueba guiada terminada'; s = left > 0 ? 'Prueba · ' + left + ' de ' + mx + ' · paga SymphorIA' : 'Prueba terminada'; }
  else { const id = selId(), p = payOf(id); c = p[0]; l = p[1]; s = p[2]; if (!connected(id)){ c = 'off'; l = /^pu:/.test(id) ? 'Puter · sin conectar' : l; s = /^pu:/.test(id) ? 'Puter sin conectar' : s; } }
  const P = $('#payL'), M = $('#payM');
  if (P){ P.className = 'payl ' + c; P.innerHTML = '<i aria-hidden="true"></i>' + esc(l) + (ex ? '<button type="button" class="lnk" data-tx="exit">Salir</button>' : ''); }
  if (M){
    const bar = !document.body.classList.contains('fresh') && mode !== 'cmp' && !trialOn && (c === 'sz' || agentOn());
    if (bar){ const k = Math.max(0, 1 - SZ.limPct()), pc = Math.round(k * 100), lv = SZ.limLvl();
      M.className = 'paym tlim ' + lv; M.setAttribute('role', 'img'); M.setAttribute('aria-label', SZ.isGuestQ() ? SZ.limTxt() : 'Tu EnerX de hoy: ' + SZ.battPct() + ' %');
      M.innerHTML = '<span class="tl-l">Hoy</span>' + SZ.limRing(16) + '<em>' + pc + ' %</em>'; }
    else { M.className = 'paym ' + c; M.removeAttribute('role'); M.removeAttribute('aria-label'); M.innerHTML = '<i aria-hidden="true"></i>' + esc(s); }
  }
}
$('#payL').addEventListener('click', e => { if (e.target.closest('[data-tx="exit"]')) exitTrial(); });
function paintAccent(){
  const g = $('#glow'); g.classList.add('swap');
  setTimeout(() => { root.style.setProperty('--c', mode === 'cmp' ? '#b8c4ff' : vendorColor(info(selId()).vendor)); g.classList.remove('swap'); }, 220);
}

/* quién está escribiendo */
/* el estado de verdad: internet, conexión, catálogo y modelo elegido */
let idleK = '';
function readyState(){
  if (!navigator.onLine) return ['off', 'sin internet', ''];
  if (mode === 'cmp' && !st().cmp.length) return ['warn', 'elige las IA que quieres comparar', 'side'];
  if (trialOn) return trialLeft() > 0 ? ['ok', 'prueba guiada · ' + trialLeft() + ' mensajes', ''] : ['warn', 'prueba terminada · conectar', 'conn'];
  if (needsConn()) return ['off', 'sin conectar · conectar', 'conn'];
  if (loading && !cat.list.length) return ['wait', 'cargando la lista de IA…', ''];
  if (mode !== 'cmp' && cat.list.length && info(selId()).stub) return ['warn', 'esta IA no está disponible · cambiar', 'side'];
  return ['ok', 'listo para escribir', ''];
}
function refreshIdle(){ if (Object.keys(busy).length) return; const [k, txt] = readyState(); if (k + txt !== idleK) renderNow(); }
addEventListener('online', refreshIdle); addEventListener('offline', refreshIdle);
setInterval(refreshIdle, 2500);
$('#now').addEventListener('click', e => { const b = e.target.closest('[data-now]'); if (!b) return; if (b.dataset.now === 'conn') openConnect(); else openSide(); });
function renderNow(){
  const ids = Object.keys(busy), box = $('#now'); SZ.S.busy(ids.some(id => busy[id] === 'think')); document.title = ids.some(id => busy[id] === 'think') ? 'Pensando… · SynthFlow' : 'SynthFlow · SymphorIA';
  box.innerHTML = ''; box.classList.toggle('many', ids.length > 2);
  /* el letrero «conectado / sin conectar» ya no existe: si falta una IA, la caja de texto se bloquea y lo explica */
  if (!ids.length){ { const [k0, t0] = readyState(); idleK = k0 + t0; } box.classList.add('idle'); }
  else box.classList.remove('idle');
  ids.forEach(id => {
    const m = info(id), c = document.createElement('span');
    c.className = 'now-chip live'; c.style.setProperty('--vc', vendorColor(m.vendor));
    c.innerHTML = av(m, 'xs') + '<b>' + esc(m.name) + '</b><em>' + (busy[id] === 'think' ? 'pensando' : 'escribiendo') + '</em><span class="dots"><i></i><i></i><i></i></span>';
    box.appendChild(c);
  });
  $('#sendBtn').disabled = false; $('#sendBtn').classList.toggle('stop', ids.length > 0); $('#sendBtn').setAttribute('aria-label', ids.length ? 'Detener la respuesta' : 'Enviar');
  paintBusy(); renderFoot(); paintPay();
}
function renderFoot(){
  const left = SZ.msgsLeft(), lv = SZ.limLvl();
  /* v3.0 · «Medidor del día» como batería: la pila se descarga mientras chateas y se carga a medianoche */
  const k = Math.max(0, 1 - SZ.limPct()), g = SZ.isGuestQ(), big = g ? Math.max(0, (SZ.SZQ.guest.max || 5) - (SZ.SZQ.guest.used || 0)) + '' : Math.round(k * 100) + ' %', of = g ? 'de ' + (SZ.SZQ.guest.max || 5) + ' mensajes de prueba' : SZ.SZQ.team ? 'sin límite · equipo' : k > 0 ? 'se carga a medianoche' : 'sin EnerX · se carga a medianoche';
  $('#sideFoot').innerHTML = '<button class="sxfoot lim gauge gbatt ' + lv + '" id="sxBtn" type="button" title="Tu EnerX de hoy (tu batería): toca para ver el detalle">'
    + '<span class="gz-t">EnerX de hoy</span>' + SZ.limRing(40)
    + '<span class="gz-n"><b>' + esc(big) + '</b><small>' + esc(of) + '</small></span><span class="sr">' + esc(SZ.limTxt()) + '</span></button>';
  const rc = $('#railCoin'); if (rc) rc.innerHTML = SZ.limRing(22) + '<span class="rl">' + esc(SZ.limTxt()) + '</span>';
  const tc = $('#tabCoin .tci'); if (tc) tc.innerHTML = SZ.limRing(22);
}

