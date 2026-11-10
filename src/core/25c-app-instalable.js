/* ---------- v2.3 · SynthFlow como app: se instala desde el navegador (sin tiendas) ----------
   - El «trabajador» (sw.js) no guarda la página: todo llega siempre fresco de internet. Solo guarda la pantalla de «sin conexión».
   - En el celular, una vez cada 7 días, sale «Descarga nuestra app Sonyx».
   - v2.9: la ventana es de vidrio, con un celular dibujado en código (sin el video viejo). Cuando haya video nuevo,
     basta con poner su ruta en APP_VIDEO y se ve dentro de la pantalla del celular.
   - v3.0: ya está el video de Sammuel (20 s, 768 × 432, sin sonido, 1,4 MB). Es horizontal, así que la ventana lo muestra
     entero en una pantalla 16:9 de vidrio en vez del celular; mientras carga se ve su póster.
   - Android/Chrome: botón «Instalar» de verdad. iPhone: pasos con dibujos (Compartir › Agregar a inicio). */
const APP = { evt:null, done:false };
const APP_VIDEO = '/media/app/synthflow-app.mp4?v=30', APP_POSTER = '/media/app/synthflow-app.webp?v=30';
const appStandalone = () => { try{ return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }catch(e){ return false; } };
const appIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
/* v4.1 · Obertura: en un computador con Windows, la ventana ofrece además bajar el instalador propio (functions/descargar/windows.js) */
const appWin = () => { try{ return /Windows NT/i.test(navigator.userAgent) && !matchMedia('(pointer:coarse)').matches; }catch(e){ return false; } };
const WIN_LOGO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M3 5.1 10.4 4v7.2H3zM11.3 3.9 21 2.5v8.7h-9.7zM3 12.1h7.4v7.2L3 18.2zM11.3 12.1H21v8.6l-9.7-1.4z"/></svg>';
function winBox(o){
  const b = document.createElement('div'); b.className = 'ap-win';
  b.innerHTML = '<a class="ap-win-go" href="/descargar/windows" rel="nofollow"><span class="ap-win-ico">' + WIN_LOGO + '</span><span class="ap-win-t"><b>Descargar para Windows</b><small class="ap-win-n">Obertura · instalador gratis · Windows 10 y 11</small></span>'
    + '<svg class="ap-win-ar" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg></a>'
    + '<ol class="ap-win-pasos" hidden><li><b>Abre el archivo</b> Sinapse-Obertura.exe desde tus descargas.</li><li>Si Windows dice «protegió tu PC»: <b>Más información › Ejecutar de todas formas</b>.</li><li><b>Haz clic en Instalar</b> y listo: queda en tu escritorio.</li></ol>';
  const go = $('.ap-win-go', b), n = $('.ap-win-n', b);
  const pronto = () => { b.classList.add('pronto'); go.removeAttribute('href'); go.setAttribute('aria-disabled', 'true'); $('b', go).textContent = 'Muy pronto para Windows'; n.textContent = 'Mientras tanto, instálala desde el navegador'; };
  fetch('/descargar/windows?info=1', { cache:'no-store' }).then(r => r.ok && /json/.test(r.headers.get('content-type') || '') ? r.json() : null).then(d => {
    if (!d || !d.ok){ pronto(); return; }
    n.textContent = 'Obertura ' + d.version + (d.tam ? ' · ' + Math.max(1, Math.round(d.tam / 1048576)) + ' MB' : '') + ' · gratis · Windows 10 y 11';
  }).catch(pronto);
  go.addEventListener('click', e => {
    if (b.classList.contains('pronto')){ e.preventDefault(); return; }
    $('.ap-win-pasos', b).hidden = false; b.classList.add('bajando');
  });
  return b;
}
const appPhone = () => { try{ return matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) <= 820; }catch(e){ return false; } };
try{
  if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { scope:'/' }).catch(() => {}));
  if (window.caches) caches.keys().then(ks => ks.filter(k => /^synthz-/.test(k)).forEach(k => caches.delete(k))).catch(() => {});   /* restos de la versión vieja */
}catch(e){}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); APP.evt = e; });
addEventListener('appinstalled', () => { APP.done = true; APP.evt = null; try{ localStorage.setItem('synthz:appok', '1'); }catch(e){} const o = document.getElementById('appPromo'); if (o && o._close) o._close(); toast('¡Listo! Sonyx quedó en tu pantalla de inicio.'); });
if (appStandalone()) root.classList.add('isapp');

function appSteps(box){
  const ios = appIOS();
  const share = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  const dots = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="5" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="12" cy="19" r="1.9"/></svg>';
  box.innerHTML = '<ol class="ap-steps">' + (ios
    ? '<li><span class="ap-n">1</span><span>Toca <b>Compartir</b> <i class="ap-k">' + share + '</i> abajo en Safari.</span></li><li><span class="ap-n">2</span><span>Baja y toca <b>Agregar a inicio</b>.</span></li><li><span class="ap-n">3</span><span>Toca <b>Agregar</b>. Sonyx aparece junto a tus apps.</span></li>'
    : '<li><span class="ap-n">1</span><span>Toca el menú <i class="ap-k">' + dots + '</i> de tu navegador (arriba a la derecha).</span></li><li><span class="ap-n">2</span><span>Toca <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.</span></li><li><span class="ap-n">3</span><span>Confirma. Sonyx aparece junto a tus apps.</span></li>') + '</ol>';
}
async function appInstall(fromBox){
  if (appStandalone()){ toast('Ya estás usando la app Sonyx.'); return true; }
  if (APP.evt){
    const e = APP.evt; APP.evt = null;
    try{ e.prompt(); const r = await e.userChoice; if (r && r.outcome === 'accepted') return true; toast('Cuando quieras, la instalas desde aquí.'); return false; }catch(x){}
  }
  if (fromBox){ appSteps(fromBox); return false; }
  appPromo(true); return false;
}
function appPromo(force){
  if ($('#appPromo') || appStandalone()) return;
  if (!force){
    if (!appPhone()) return;
    /* v2.6: no interrumpe la primera visita: se ofrece desde la tercera vez que abres SymphorIA (y una vez por semana) */
    try{ if (localStorage.getItem('synthz:appok')) return; if ((+localStorage.getItem('synthz:loads') || 0) < 3) return; const t = +localStorage.getItem('synthz:apppromo') || 0; if (Date.now() - t < 7 * 864e5) return; }catch(e){ return; }
    if (document.querySelector('.szm.on, #ptour, #guide, #szMaint, .tcard[role="dialog"]')) return;   /* no interrumpe otra ventana */
  }
  try{ localStorage.setItem('synthz:apppromo', String(Date.now())); }catch(e){}
  const o = document.createElement('div'); o.id = 'appPromo'; o.className = 'appp';
  const ios = appIOS(), canPrompt = !!APP.evt;
  const I = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  /* v2.9.1 · el video no se baja hasta que se abre esta ventana; con «ahorro de datos» o movimiento reducido no arranca solo */
  const lite = reduce || !!(navigator.connection && navigator.connection.saveData);
  const scr = APP_VIDEO ? '<video muted playsinline loop' + (lite ? ' controls' : ' autoplay') + ' preload="none" poster="' + APP_POSTER + '" width="768" height="432" aria-label="Sonyx en acción"><source src="' + APP_VIDEO + '" type="video/mp4"></video>'
    /* v2.9: la pantalla es la SynthFlow de hoy en el celular: esfera, plan, la pregunta, el cuadro con «Automática» y la barra de abajo */
    : '<span class="ap-top">' + flowOrb() + '<b>Sonyx</b><i class="ap-dots"></i></span><span class="ap-chip"><i></i>Gratis · EnerX 100 %</span>'
      + '<span class="ap-q">¿Qué quieres<br><em>FlowIA’r</em> hoy?</span>'
      + '<span class="ap-m me"></span><span class="ap-m ai"><i></i><i></i><i></i></span>'
      + '<span class="ap-in"><span class="ap-auto">Automática</span><i></i></span>'
      + '<span class="ap-tabs"><i></i><i></i><i class="ring"></i><i></i><i></i></span>';
  o.innerHTML = '<div class="ap-card" role="dialog" aria-modal="true" aria-label="Descarga la app Sonyx">'
    + '<div class="ap-hero' + (APP_VIDEO ? ' vid' : '') + '" aria-hidden="true"><i class="ap-glow"></i>' + (APP_VIDEO ? '<div class="ap-tv">' + scr + '</div>' : '<div class="ap-phone"><div class="ap-scr">' + scr + '</div></div>')
    + '<span class="ap-ico"><img src="/media/app/sf-192.png?v=44" alt="" width="54" height="54"></span><i class="ap-sp s1"></i><i class="ap-sp s2"></i><i class="ap-sp s3"></i></div>'
    + '<div class="ap-body"><span class="ap-kick">App gratis · sin tiendas</span><h3>Descarga nuestra app <em>Sonyx</em></h3>'
    + '<ul class="ap-why"><li><i>' + I('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>') + '</i><span><b>Va más fluida</b>: a pantalla completa, sin pestañas ni barra del navegador.</span></li>'
    + '<li><i>' + I('<path d="M2 12c2.5-4 5-4 7.5 0s5 4 7.5 0 3.5-3 5-1"/><path d="M2 18c2.5-4 5-4 7.5 0s5 4 7.5 0 3.5-3 5-1" opacity=".5"/>') + '</i><span><b>Más Flow</b>: tus chats y Apex a un toque, desde tu pantalla de inicio.</span></li>'
    + '<li><i>' + I('<path d="M20 4C10 4 5 10 4 20"/><path d="M20 4c0 8-5 12-12 12"/>') + '</i><span><b>Pesa casi nada</b> y siempre está al día: se instala desde aquí mismo.</span></li></ul>'
    + '<div class="ap-how"></div>'
    + '<div class="ap-acts"><button type="button" class="lnk" data-ap="no">Ahora no</button><button type="button" class="btn ap-go" data-ap="go">' + (canPrompt ? 'Instalar Sonyx' : ios ? 'Ver cómo instalarla' : 'Instalar Sonyx') + '</button></div></div></div>';
  if (appWin()){
    const how = $('.ap-how', o); how.before(winBox(o));
    const g = $('[data-ap="go"]', o); g.classList.add('ap-go-alt'); g.textContent = 'Desde el navegador';
  }
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const v = $('video', o); if (v){ v.play().catch(() => {}); v.addEventListener('error', () => v.remove(), true); }
  const close = () => { if (!o.isConnected) return; o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  o._close = close;
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $('[data-ap="no"]', o).addEventListener('click', close);
  $('[data-ap="go"]', o).addEventListener('click', async e => { const b = e.currentTarget; const ok = await appInstall($('.ap-how', o)); if (ok) close(); else if (!APP.evt){ b.textContent = 'Entendido'; b.dataset.ap = 'no'; b.onclick = close; } });   /* v2.6: currentTarget se borra después del await; se guarda antes */
  addEventListener('keydown', function k(e){ if (e.key === 'Escape'){ close(); removeEventListener('keydown', k); } });
}
/* en el celular, un ratico después de entrar (nunca encima de otra ventana) */
try{ localStorage.setItem('synthz:loads', String((+localStorage.getItem('synthz:loads') || 0) + 1)); }catch(e){}
if (!appStandalone() && !/pulsem/.test(location.pathname)) setTimeout(() => { try{ appPromo(false); }catch(e){} }, 24000);
