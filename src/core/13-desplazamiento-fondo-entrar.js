/* ---------- desplazamiento suave con la ruedita (sin saltos bruscos) ---------- */
let ssOn = false;
const ssState = new WeakMap();
function canScroll(n, dy){
  if (!n || n.nodeType !== 1) return false;
  const st = ssState.get(n), top = st && st.raf ? st.target : n.scrollTop, max = n.scrollHeight - n.clientHeight;
  if (max < 2) return false;
  if (n !== document.scrollingElement && n !== document.documentElement && n !== document.body){ const oy = getComputedStyle(n).overflowY; if (!/auto|scroll|overlay/.test(oy)) return false; }
  return dy > 0 ? top < max - 1 : top > 1;
}
function ssAnimate(se, px){
  let st = ssState.get(se); if (!st){ st = { target:se.scrollTop, cur:se.scrollTop, raf:0, last:0 }; ssState.set(se, st); }
  const max = se.scrollHeight - se.clientHeight;
  if (!st.raf){ st.target = st.cur = se.scrollTop; se.style.scrollBehavior = 'auto'; }
  st.target = Math.max(0, Math.min(max, st.target + px));
  if (st.raf) return;
  const tick = now => {
    const dt = st.last ? Math.min(3, (now - st.last) / 16.67) : 1; st.last = now;
    st.cur += (st.target - st.cur) * (1 - Math.pow(1 - .14, dt));
    if (Math.abs(st.target - st.cur) < .6) st.cur = st.target;
    se.scrollTop = st.cur;
    if (st.cur !== st.target && Math.abs(se.scrollTop - st.cur) < 3) st.raf = requestAnimationFrame(tick); else { st.raf = 0; st.last = 0; se.style.scrollBehavior = ''; }
  };
  st.raf = requestAnimationFrame(tick);
}
function ssStop(n){ const st = n && ssState.get(n); if (st && st.raf){ cancelAnimationFrame(st.raf); st.raf = 0; st.last = 0; n.style.scrollBehavior = ''; st.target = st.cur = n.scrollTop; } }
function smoothWheel(){
  if (ssOn) return; ssOn = true;
  addEventListener('wheel', e => {
    if (!CFG.smooth || e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (e.deltaMode === 0 && Math.abs(e.deltaY) < 40) return;     /* touchpad: ya es suave */
    if (root.classList.contains('lock') && !(e.target.closest && e.target.closest('.szm,#tour,#blk,#acc,#sx,#conn,#thPop,#ptour,#svm'))) return;
    const dy = e.deltaY, px = e.deltaMode === 1 ? dy * 40 : e.deltaMode === 2 ? dy * innerHeight : dy;
    let n = e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement;
    for (; n && n !== document.body && n !== document.documentElement; n = n.parentElement){
      if (/^(TEXTAREA|SELECT)$/.test(n.tagName) || n.dataset.nosmooth != null) return;
      if (canScroll(n, dy)){ e.preventDefault(); ssAnimate(n, px * 1.05); return; }
      if (/fixed/.test(getComputedStyle(n).position) && !n.closest('.ctxm')) { if (n.matches('.szm,#tour,#blk,#acc,#sx,#conn,#ptour,#svm')){ e.preventDefault(); return; } }
    }
    const se = document.scrollingElement || document.documentElement;
    if (canScroll(se, dy)){ e.preventDefault(); ssAnimate(se, px * 1.1); }
  }, { passive:false });
  addEventListener('scroll', ev => { const n = ev.target === document ? document.scrollingElement : ev.target; const st = n && ssState.get(n); if (st && !st.raf){ st.target = st.cur = n.scrollTop; } }, { passive:true, capture:true });
}
/* ---------- el fondo gira suave mientras bajas ---------- */
function orbitBg(src){
  const au = $('.aurora'); if (!au || !CFG.bg || $('.orbit', au)) return;
  const wrap = document.createElement('div'); wrap.className = 'orbit';
  [...au.querySelectorAll(':scope > i')].forEach(i => wrap.appendChild(i)); au.prepend(wrap);
  let q = 0;
  const upd = () => { q = 0; const se = src || document.scrollingElement || document.documentElement; const h = se.scrollHeight - se.clientHeight; au.style.setProperty('--sp', (h > 0 ? Math.min(1, se.scrollTop / h) : 0).toFixed(4)); };
  (src || window).addEventListener('scroll', () => { if (!q) q = requestAnimationFrame(upd); }, { passive:true });
  upd();
}
/* ---------- entrar a SymphorIA: usuario y contraseña (y Google, si el servidor lo tiene activado) ---------- */
const isBlocked = e => !!(e && (e.error === 'popup_blocked' || e.code === 'popup_blocked'));
let gsiP = null, gsiDone = null;
function loadGsi(){ return gsiP || (gsiP = new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = () => ok(window.google); s.onerror = () => { gsiP = null; no(new Error('gsi')); }; document.head.appendChild(s); })); }
async function signedIn(d){
  setSess(d.token, d.cookie); ACC.user = d.user; ACC.profile = d.profile || null; ACC.ready = false;
  await accStart();
  try{ dispatchEvent(new Event('synthz-acc')); }catch(e){}
  toast(d.isNew ? '¡Bienvenido a ' + BRAND() + ', ' + accName() + '!' : '¡Hola de nuevo, ' + accName() + '!');
}
/* al volver de Google por Supabase: el token llega en la dirección (#access_token=…), se cambia por tu sesión de SymphorIA y se borra de la barra */
(async function sbReturn(){
  const h = location.hash || ''; if (!/access_token=|error_description=/.test(h)) return;
  const p = new URLSearchParams(h.slice(1)); try{ window.history.replaceState(null, '', location.pathname + location.search); }catch(e){}
  if (p.get('access_token')){ ACC.joining = true; root.classList.add('joining'); }
  let linking = false; try{ linking = sessionStorage.getItem('synthz:link') === '1'; sessionStorage.removeItem('synthz:link'); }catch(e){}
  if (p.get('error_description')){ ACC.joining = false; root.classList.remove('joining'); setTimeout(() => toast('No se pudo ' + (linking ? 'vincular' : 'entrar con') + ' Google: ' + p.get('error_description')), 800); return; }
  if (linking && SESS){ ACC.joining = false; root.classList.remove('joining'); setTimeout(() => linkGoogleDone({ token:p.get('access_token') }), 600); return; }
  try{ const d = await api('auth', { method:'POST', body:{ mode:'supabase', token:p.get('access_token') } }); await signedIn(d); askDrive(); }
  catch(e){ ACC.joining = false; root.classList.remove('joining'); setTimeout(() => toast((e && e.message) || 'No pude entrar con Google. Intenta de nuevo.'), 800); }
})();
async function onGoogle(resp){
  try{ const d = await api('auth', { method:'POST', body:{ credential:resp.credential } }); await signedIn(d); if (gsiDone) gsiDone(d.isNew ? 'new' : 'in'); askDrive(); }
  catch(e){ toast(e.message || 'No pude entrar. Intenta de nuevo.'); }
}
/* después de entrar con Google: «¿Quieres conectar Drive?» sí / no (una sola vez por dispositivo) */
async function askDrive(){
  try{
    if (!(await driveCid())) return;
    const m = driveMeta(); if (m && m.linked) return;
    try{ if (localStorage.getItem('synthz:askdrive')) return; localStorage.setItem('synthz:askdrive', String(Date.now())); }catch(e){}
    await sleepRaw(900);
    const ok = await szConfirm('¿Quieres conectar tu Google Drive?', 'Guardo una copia de tus chats en una carpeta privada dentro de tu Google Drive, para que tengas más espacio. No puedo ver ni tocar tus otros archivos. Puedes cambiarlo cuando quieras.', 'Sí, conectar', false, 'No, gracias');
    if (!ok){ toast('Listo. Si cambias de idea, está en Ajustes › IAs y memoria › Google Drive.'); return; }
    const r = await DRIVE.sync(); if (r && !r.busy) toast('¡Listo! Tus chats también quedan en tu Google Drive.');
  }catch(e){ toast((e && e.message) || 'No pude conectar tu Drive. Inténtalo luego en Ajustes › IAs y memoria › Google Drive.'); }
}
const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
function passStrength(p, u){
  if (!p) return 0; let s = Math.min(4, Math.floor(p.length / 4));
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^\w]/.test(p)) s++;
  if (p.length < 8 || (u && p.toLowerCase().includes(u))) s = Math.min(s, 1);
  if (/^(.)\1+$|^(12345678|password|contraseña|qwerty)/i.test(p)) s = 1;
  return Math.max(1, Math.min(4, Math.round(s * 4 / 7)));
}
/* muestra el código de recuperación y no deja seguir hasta que confirmes que lo guardaste */
function recoveryPanel(box, code, user, onOk, again){
  box.innerHTML = '<div class="rcv"><div class="rcico">🔑</div><h4>' + (again ? 'Tu nuevo código de recuperación' : 'Guarda tu código de recuperación') + '</h4>'
    + '<p>Si olvidas tu contraseña, este código es la <b>única</b> forma de volver a entrar. Solo lo verás esta vez.</p>'
    + '<div class="rccode" tabindex="0">' + esc(code) + '</div>'
    + '<div class="rcact"><button class="btn sm ghost" type="button" data-cp>Copiar</button><button class="btn sm ghost" type="button" data-dl>Descargar .txt</button></div>'
    + '<label class="rcchk"><input type="checkbox"> Ya lo guardé en un lugar seguro</label>'
    + '<button class="btn" type="button" data-go disabled>Continuar</button></div>';
  const go = $('[data-go]', box), chk = $('.rcchk input', box);
  chk.addEventListener('change', () => { go.disabled = !chk.checked; });
  $('[data-cp]', box).addEventListener('click', e => { (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => { e.target.textContent = '¡Copiado!'; }).catch(() => { const r = document.createRange(); r.selectNodeContents($('.rccode', box)); getSelection().removeAllRanges(); getSelection().addRange(r); toast('Selecciónalo y cópialo con Ctrl+C.'); }); });
  $('[data-dl]', box).addEventListener('click', () => {
    const txt = 'SymphorIA · código de recuperación\r\n\r\nUsuario: @' + user + '\r\nCódigo: ' + code + '\r\n\r\nÚsalo en «¿Olvidaste tu contraseña?» si no recuerdas tu contraseña.\r\nNo se lo compartas a nadie.\r\n';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type:'text/plain' })); a.download = 'synthz-recuperacion-' + user + '.txt'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });
  go.addEventListener('click', onOk);
  box.animate([{ opacity:0, transform:'translateY(10px)', filter:'blur(6px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:450, easing:'cubic-bezier(.22,1,.36,1)' });
}
function authBox(box, done, onBlocked, start){
  let mode = start === 'signup' ? 'signup' : 'login';
  const say = h => { box.innerHTML = '<p class="gmsg">' + h + '</p>'; };
  box.innerHTML = '<div class="gbox"><span class="gload">' + (LANG === 'en' ? 'Getting ready…' : 'Preparando…') + '</span></div>';
  accConfig().then(ok => {
    if (!ok){ say(location.protocol === 'file:' ? 'Las cuentas funcionan cuando la página está publicada (por ejemplo en Vercel).' : (LANG === 'en' ? BRAND() + ' accounts open very soon. Meanwhile, your chats are saved on this device and you can use everything without an account.' : 'Las cuentas de ' + BRAND() + ' abren muy pronto. Mientras tanto, tus chats se guardan en este equipo y puedes usar todo sin cuenta.')); return; }   /* v4.4 · salía en español con la página en inglés */
    paint();
  });
  function paint(){
    const L = mode === 'login', N = mode === 'signup', R = mode === 'reset';
    box.innerHTML = '<div class="lbox">'
      + (R ? '<div class="ltop"><button class="lnk" type="button" data-back>← Volver</button><b>Recuperar tu cuenta</b></div>'
           : '<div class="lseg" role="tablist"><button type="button" role="tab" data-m="login" aria-selected="' + L + '">Entrar</button><button type="button" role="tab" data-m="signup" aria-selected="' + N + '">Crear cuenta</button><i></i></div>')
      + '<form class="lform" novalidate>'
      + '<label>Usuario<span class="lin"><span class="at">@</span><input name="user" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="21" placeholder="' + (N ? 'elige-uno' : 'tu usuario') + '" required></span></label>'
      + (N ? '<label>Tu nombre <small>(opcional)</small><span class="lin"><input name="name" autocomplete="nickname" maxlength="40" placeholder="Cómo quieres que te llamen"></span></label>' : '')
      + (R ? '<label>Código de recuperación<span class="lin"><input name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="24" placeholder="XXXX-XXXX-XXXX-XXXX" required></span></label>' : '')
      + '<label>' + (R ? 'Contraseña nueva' : 'Contraseña') + '<span class="lin"><input name="pass" type="password" autocomplete="' + (L ? 'current-password' : 'new-password') + '" maxlength="200" placeholder="' + (L ? 'Tu contraseña' : 'Mínimo 8 caracteres') + '" required><button class="eye" type="button" aria-label="Mostrar contraseña" aria-pressed="false">' + EYE + '</button></span></label>'
      + (L ? '' : '<div class="lstr" aria-hidden="true"><i></i><i></i><i></i><i></i><span></span></div>')
      + '<p class="lerr" role="alert"></p>'
      + '<button class="btn lgo" type="submit">' + (L ? 'Entrar' : N ? 'Crear mi cuenta' : 'Cambiar contraseña y entrar') + '</button>'
      + (L ? '<button class="lnk lforgot" type="button" data-forgot>¿Olvidaste tu contraseña?</button>' : '')
      + '</form>'
      + (ACC.google && !R ? '<div class="lor"><span>o</span></div><div class="gbtn" aria-live="polite"><span class="gload">Cargando Google…</span></div>' : '')
      + '<p class="cnote">' + (N ? 'No necesitas correo. Tu contraseña se guarda protegida (ni ' + BRAND() + ' puede leerla). Al crear la cuenta te damos un código para recuperarla.' : R ? 'Es el código que guardaste al crear tu cuenta. Al cambiar la contraseña, tu cuenta se cierra en los demás dispositivos.' : 'Tus chats y favoritos te siguen a cualquier dispositivo.') + ' Al entrar aceptas los <a href="terminos.html" target="_blank" rel="noopener">Términos</a> y la <a href="privacidad.html" target="_blank" rel="noopener">Privacidad</a>.</p>'
      + '</div>';
    const f = $('.lform', box), err = $('.lerr', box), go = $('.lgo', box), uIn = f.elements.user, pIn = f.elements.pass;
    $$('[data-m]', box).forEach(b => b.addEventListener('click', () => { if (b.dataset.m !== mode){ const u = uIn.value; mode = b.dataset.m; paint(); $('.lform', box).elements.user.value = u; } }));
    const back = $('[data-back]', box); if (back) back.addEventListener('click', () => { const u = uIn.value; swapDir(box, -1, () => { mode = 'login'; paint(); $('.lform', box).elements.user.value = u; }); });
    const fg = $('[data-forgot]', box); if (fg) fg.addEventListener('click', () => { const u = uIn.value; swapDir(box, 1, () => { mode = 'reset'; paint(); $('.lform', box).elements.user.value = u; }); });
    $('.eye', box).addEventListener('click', e => { const on = pIn.type === 'password'; pIn.type = on ? 'text' : 'password'; e.currentTarget.setAttribute('aria-pressed', String(on)); e.currentTarget.setAttribute('aria-label', on ? 'Ocultar contraseña' : 'Mostrar contraseña'); });
    uIn.addEventListener('input', () => { const v = uIn.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_.]/g, ''); if (v !== uIn.value) uIn.value = v; err.textContent = ''; });
    const str = $('.lstr', box);
    if (str) pIn.addEventListener('input', () => { const s = passStrength(pIn.value, uIn.value), W = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']; str.dataset.s = pIn.value ? s : 0; $('span', str).textContent = pIn.value ? W[s] : ''; err.textContent = ''; });
    f.addEventListener('submit', async e => {
      e.preventDefault(); err.textContent = '';
      const user = uIn.value.trim().replace(/^@/, '').toLowerCase(), pass = pIn.value;
      if (!/^[a-z0-9_.]{3,20}$/.test(user)){ err.textContent = 'Tu usuario debe tener de 3 a 20 letras, números, puntos o guiones bajos.'; uIn.focus(); return; }
      if (!L && pass.length < 8){ err.textContent = 'La contraseña debe tener al menos 8 caracteres.'; pIn.focus(); return; }
      if (!pass){ err.textContent = 'Escribe tu contraseña.'; pIn.focus(); return; }
      const bodyOut = { mode, user, pass };
      if (N) bodyOut.name = f.elements.name.value.trim();
      if (N && f.elements.setup) bodyOut.setup = f.elements.setup.value.trim();
      if (R){ bodyOut.code = f.elements.code.value.trim(); if (bodyOut.code.replace(/[^a-z0-9]/gi, '').length < 16){ err.textContent = 'El código tiene 16 letras y números.'; f.elements.code.focus(); return; } }
      go.disabled = true; const label = go.textContent; go.textContent = L ? 'Entrando…' : N ? 'Creando…' : 'Cambiando…';
      try{
        const d = await api('auth', { method:'POST', body:bodyOut, keep:true });
        const finish = async () => { await signedIn(d); if (done) done(d.isNew ? 'new' : 'in'); };
        if (d.recovery){ setSess(d.token, d.cookie); recoveryPanel(box, d.recovery, user, () => finish(), R); }
        else await finish();
      }catch(x){
        go.disabled = false; go.textContent = label;
        if (x.data && x.data.code === 'reserved' && !f.elements.setup){
          const l = document.createElement('label'); l.innerHTML = 'Código de configuración<span class="lin"><input name="setup" type="text" data-sec="1" autocomplete="off" data-lpignore="true" data-1p-ignore data-form-type="other" spellcheck="false" placeholder="Solo para el equipo de SymphorIA"></span>';
          f.insertBefore(l, err); l.animate([{ opacity:0, transform:'translateY(-6px)' }, { opacity:1, transform:'none' }], { duration:400, easing:'cubic-bezier(.22,1,.36,1)' }); l.querySelector('input').focus();
        }
        err.textContent = x.net ? 'No pude conectar con ' + BRAND() + '. Revisa tu internet.' : (x.message || 'Algo falló. Intenta de nuevo.');
        box.querySelector('.lbox').animate([{ transform:'translateX(0)' }, { transform:'translateX(-7px)' }, { transform:'translateX(6px)' }, { transform:'translateX(-3px)' }, { transform:'none' }], { duration:380 });
      }
    });
    if (ACC.google && !R) googleBtn($('.gbtn', box), done, onBlocked);
  }
}
async function googleBtn(slot, done, onBlocked){
  /* v1.4: si Supabase tiene Google activado, se entra por Supabase (sin ventanitas que los navegadores bloquean) */
  if (ACC.sbg && ACC.sb && ACC.sb.url){
    slot.innerHTML = '<button type="button" class="sbg"><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continuar con Google</button>';
    slot.querySelector('.sbg').addEventListener('click', () => {
      try{ sessionStorage.setItem('synthz:sbback', location.pathname + location.search); }catch(e){}
      location.href = ACC.sb.url + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(location.origin + location.pathname);
    });
    return;
  }
  try{ await loadGsi(); }catch(e){ slot.innerHTML = '<p class="gmsg">No pude cargar el botón de Google. Puedes entrar con usuario y contraseña.</p>'; if (onBlocked) onBlocked('script'); return; }
  gsiDone = done;
  google.accounts.id.initialize({ client_id:ACC.cid, callback:onGoogle, auto_select:false, cancel_on_tap_outside:true, context:'signin', itp_support:true });
  slot.innerHTML = '';
  google.accounts.id.renderButton(slot, { theme:'filled_black', size:'large', shape:'pill', text:'continue_with', logo_alignment:'left', locale:'es', width:Math.max(220, Math.min(340, (slot.clientWidth || 320) - 4)) });
}
