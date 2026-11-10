/* ---------- v2.3 · seguridad y acceso: cómo entras (usuario y contraseña, Google), vincular y cambiar contraseña ---------- */
const hasPass = u => !!(u && (u.kind === 'pass' || u.username));
const hasGoogle = u => !!(u && (u.google || u.kind === 'google' || u.sbUid || u.gsub));
/* al volver de Google para VINCULAR (no para entrar) */
async function linkGoogleDone(body){
  try{ const d = await api('auth', { method:'POST', keep:true, body:Object.assign({ mode:'link' }, body) }); if (d.user) ACC.user = Object.assign({}, ACC.user, d.user); await accStart(); toast(d.merged ? '¡Listo! Ese Google ya era otra cuenta tuya y quedó unida a esta.' : '¡Listo! Tu Google quedó vinculado: ya puedes entrar con él o con tu usuario.'); }
  catch(e){ toast((e && e.message) || 'No pude vincular tu Google. Intenta de nuevo.'); }
}
function securityModal(){
  if ($('#secm')) return;
  const o = document.createElement('div'); o.id = 'secm'; o.className = 'szm';
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Seguridad y acceso"><div class="word">' + zWord('Synth') + '</div><div class="tn">SEGURIDAD Y ACCESO</div><div class="tb" id="secBox"></div><div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Cerrar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const box = $('#secBox', o);
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  const GICO = '<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  const paint = () => {
    const u = ACC.user || {}, P = hasPass(u), G = hasGoogle(u);
    const L = Array.isArray(u.links) && u.links.length ? u.links : (G && u.email ? [{ email:u.email }] : []);   /* cuentas vinculadas antes de v2.4 no tenían lista */
    box.innerHTML = '<h3>Cómo entras</h3><div class="sacc">'
      + '<div class="sa-r' + (P ? ' on' : '') + '"><span class="sa-i">🔑</span><span class="sa-t"><b>Usuario y contraseña</b><small>' + (P ? '@' + esc(u.username || '') : 'Aún no tienes') + '</small></span>' + (P ? '<em class="sa-ok">✓ Activo</em>' : '<button class="btn sm" type="button" data-k="addp">Agregar</button>') + '</div>'
      + (G ? L.map(x => '<div class="sa-r on"><span class="sa-i">' + GICO + '</span><span class="sa-t"><b>Google</b><small>' + esc(x.email) + '</small></span>' + (P || L.length > 1 ? '<button class="lnk" type="button" data-un="' + esc(x.email) + '">Quitar</button>' : '<em class="sa-ok">✓ Vinculado</em>') + '</div>').join('') : '')
      + '<div class="sa-r"><span class="sa-i">' + GICO + '</span><span class="sa-t"><b>' + (G ? 'Otra cuenta de Google' : 'Google') + '</b><small>' + (G ? 'Entra con cualquiera de tus Google' : 'Sin vincular') + '</small></span>' + (ACC.google ? '<span class="sa-g"><button class="btn sm" type="button" data-k="link">Vincular</button></span>' : '<small class="sa-no">No disponible ahora</small>') + '</div>'
      + '</div><p class="cnote">Con cualquiera de estas formas entras a la <b>misma</b> cuenta, con tus chats y tu perfil. Si vinculas un Google que ya tenía una cuenta solo de Google, esa cuenta se une a esta.</p><div id="secForm"></div>';
    box.querySelectorAll('[data-un]').forEach(btn => btn.addEventListener('click', async () => {
      btn.disabled = true;
      try{ const d = await api('auth', { method:'POST', keep:true, body:{ mode:'unlink', email:btn.dataset.un } }); if (d.user) ACC.user = Object.assign({}, ACC.user, d.user); accFire('profile'); toast('Listo: quité ese Google de tu cuenta.'); paint(); }
      catch(e){ btn.disabled = false; toast((e && e.message) || 'No pude quitarlo. Intenta de nuevo.'); }
    }));
    const add = $('[data-k="addp"]', box); if (add) add.addEventListener('click', () => addPassForm());
    const ln = $('[data-k="link"]', box); if (ln) ln.addEventListener('click', () => linkGoogle(ln.parentNode));
    if (P) passForm();
  };
  /* vincular Google: por Supabase (vuelve a esta página) o con el botón de Google */
  const linkGoogle = async slot => {
    if (ACC.sbg && ACC.sb && ACC.sb.url){
      try{ sessionStorage.setItem('synthz:link', '1'); sessionStorage.setItem('synthz:sbback', location.pathname + location.search); }catch(e){}
      location.href = ACC.sb.url + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(location.origin + location.pathname); return;
    }
    try{ await loadGsi(); }catch(e){ toast('No pude cargar Google. Revisa si un bloqueador lo está frenando.'); return; }
    google.accounts.id.initialize({ client_id:ACC.cid, callback:async r => { await linkGoogleDone({ credential:r.credential }); paint(); }, auto_select:false, cancel_on_tap_outside:true, context:'use', itp_support:true });
    slot.innerHTML = ''; google.accounts.id.renderButton(slot, { theme:'filled_black', size:'medium', shape:'pill', text:'continue_with', locale:'es' });
  };
  const addPassForm = () => {
    const f0 = $('#secForm', box);
    f0.innerHTML = '<h3 style="margin-top:14px">Ponle usuario y contraseña</h3><form class="lform" novalidate>'
      + '<label>Usuario<span class="lin"><span class="at">@</span><input name="user" autocomplete="username" maxlength="20" required></span></label>'
      + '<label>Contraseña<span class="lin"><input name="pass" type="password" autocomplete="new-password" maxlength="200" required></span></label>'
      + '<p class="lerr" role="alert"></p><div class="aact"><button class="btn sm" type="submit">Guardar</button></div></form>';
    const f = $('form', f0), err = $('.lerr', f0); f.elements.user.focus();
    f.elements.user.addEventListener('input', () => { const v = f.elements.user.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_.]/g, ''); if (v !== f.elements.user.value) f.elements.user.value = v; });
    f.addEventListener('submit', async e => { e.preventDefault(); err.textContent = '';
      const user = f.elements.user.value.trim(), pass = f.elements.pass.value;
      if (user.length < 3){ err.textContent = 'Tu usuario debe tener al menos 3 letras o números.'; return; }
      if (pass.length < 8){ err.textContent = 'La contraseña debe tener al menos 8 caracteres.'; return; }
      try{ const d = await api('auth', { method:'POST', keep:true, body:{ mode:'addpass', user, pass } }); ACC.user = Object.assign({}, ACC.user, d.user); accFire('pull');
        recoveryPanel(box, d.recovery, user, () => { toast('¡Listo! Ya puedes entrar con @' + user + ' o con Google.'); paint(); }, false); }
      catch(x){ err.textContent = x.message || 'Algo falló.'; }
    });
  };
  const passForm = () => {
    const f0 = $('#secForm', box);
    f0.innerHTML = '<h3 style="margin-top:14px">Tu contraseña</h3><form class="lform" novalidate>'
      + '<input name="user" autocomplete="username" value="' + esc((ACC.user && ACC.user.username) || '') + '" hidden>'
      + '<label>Contraseña actual<span class="lin"><input name="old" type="password" autocomplete="current-password" required></span></label>'
      + '<label>Contraseña nueva <small>(déjala vacía si solo quieres un código nuevo)</small><span class="lin"><input name="pass" type="password" autocomplete="new-password" maxlength="200"></span></label>'
      + '<p class="lerr" role="alert"></p>'
      + '<div class="aact"><button class="btn sm" type="submit" data-k="change">Cambiar contraseña</button><button class="btn sm ghost" type="button" data-k="code">Código de recuperación nuevo</button></div>'
      + '<p class="cnote">Al cambiar la contraseña, tu cuenta se cierra en los demás dispositivos. Si pides un código nuevo, el anterior deja de servir.</p></form>';
    const f = $('form', f0), err = $('.lerr', f0);
    const run = async k => {
      err.textContent = '';
      const old = f.elements.old.value, pass = f.elements.pass.value;
      if (!old){ err.textContent = 'Escribe tu contraseña actual.'; f.elements.old.focus(); return; }
      if (k === 'change' && pass.length < 8){ err.textContent = 'La contraseña nueva debe tener al menos 8 caracteres.'; f.elements.pass.focus(); return; }
      try{
        const d = await api('auth', { method:'POST', keep:true, body: k === 'change' ? { mode:'change', old, pass } : { mode:'code', pass:old } });
        if (k === 'change'){ setSess(d.token, d.cookie); toast('Contraseña cambiada. Cerramos tu sesión en los demás dispositivos.'); close(); }
        else recoveryPanel(box, d.recovery, (ACC.user && ACC.user.username) || '', () => { toast('Listo: el código anterior ya no sirve.'); close(); }, true);
      }catch(x){ err.textContent = x.message || 'Algo falló.'; }
    };
    f.addEventListener('submit', e => { e.preventDefault(); run('change'); });
    $('[data-k="code"]', f0).addEventListener('click', () => run('code'));
  };
  paint();
}
/* ---------- configuración ---------- */
const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const miniPage = kind => '<div class="mp ' + kind + '"><i class="bl"></i><i class="bl"></i><i class="bl"></i><div class="gl"></div><div class="nv"><img class="lg" src="media/v30/symphoria.svg" alt="" draggable="false"><i></i><b></b><b></b><b></b></div><div class="h1"></div><div class="h2"></div><div class="cds"><b></b><b></b><b></b></div><span class="cu"></span><em>así se verá</em></div>';
function cfgChooser(box, cur, onPick){
  const paint = sel => {
    box.innerHTML = '<div class="cfgo"><button type="button" data-v="visual" aria-pressed="' + (sel === 'visual') + '"><b>Más bonito</b><span>Con todos los efectos: vidrio, fondo que se mueve, cursor propio y animaciones.</span></button>'
      + '<button type="button" data-v="speed" aria-pressed="' + (sel === 'speed') + '">' + (lowEnd ? '<i class="rec">Recomendado</i>' : '') + '<b>Más rápido</b><span>Para computadores o celulares lentos: menos efectos y todo responde al instante.</span></button></div>'
      + miniPage(sel);
    $$('[data-v]', box).forEach(b => b.addEventListener('click', () => { paint(b.dataset.v); if (onPick) onPick(b.dataset.v); }));
  };
  paint(cur);
}
const CFG_ROWS = [['cursor', 'Cursor ' + BRAND(), 'El cursor de vidrio con viento.'], ['smooth', 'Desplazamiento suave', 'La ruedita baja la página sin saltos.'], ['bg', 'Fondo animado', 'Los colores se mueven y giran al bajar.'], ['glass', 'Efecto vidrio', 'Ventanas y paneles que parecen de vidrio.'], ['anim', 'Animaciones', 'Escritura letra por letra, golpe de cristal y agua.'], ['favAnim', 'Icono animado', 'El péndulo (o el destello de Flow) en el icono de la pestaña.'], ['sound', 'Sonidos', 'La voz de Sona, las teclas, las transiciones y los avisos. Apágalos si te molestan.'], ['beginner', 'Modo principiante', 'Las IA te responden con palabras sencillas, paso a paso y con ejemplos.']];
/* v2.2 · Ajustes con 2 pestañas: «Página» (cómo se ve y se siente) e «IAs y memoria» (cómo te responden y qué recuerdan de ti) */
const CFG_PAGE = CFG_ROWS.filter(r => r[0] !== 'beginner');
const CFG_IA = [['beginner', 'Modo principiante', 'Te responden con palabras sencillas, paso a paso y con ejemplos.'], ['autoWeb', 'Buscar en internet cuando haga falta', 'Si preguntas por algo de hoy (precios, noticias, el clima…), la IA busca sola y te muestra sus fuentes.'], ['saver', 'Respuestas cortas', 'Respuestas más breves: gastas menos de tu límite de hoy.'], ['review', 'Revisión de calidad', 'Otra IA revisa la lógica de cada respuesta y la corrige si encuentra errores. Tarda unos segundos más.']];
/* v3.9 · modo dictado (solo en SynthFlow). v3.9.1 · viene encendido para todos; aquí se apaga */
const CFG_DIC = ['dictado', 'Modo dictado', 'Un micrófono en la caja de escribir: hablas y el texto aparece en vivo, con puntos, comas y signos de pregunta, para que lo revises antes de enviar.'];
const memSt0 = () => state.mem || (state.mem = { on:true, t:0, items:[] });
function memTouch(){ const m = memSt0(); m.t = Date.now(); save(); try{ if (ACC.ready) accPush(); }catch(e){} }
/* ¿dos datos hablan de lo mismo? Mismo «casillero» (cómo se llama, dónde vive, en qué trabaja, qué estudia, su edad, su idioma)
   o casi las mismas palabras (70 % o más). «Le gusta el café» y «Le gusta el té» NO son lo mismo: se guardan los dos. */
const MEM_SLOT = [/^(se llama|quiere que le digan|su nombre es|(their )?name is|wants to be called)\b/i, /^(vive en|es de|lives in|is from)\b/i, /^(trabaja|works)\b/i, /^(estudia|studies)\b/i, /\b(tiene \d+ a[nñ]os|is \d+ years old)\b/i, /^(habla|su idioma|speaks)\b/i, /^(su cumplea[nñ]os|their birthday)\b/i];
const memWords = s => new Set(String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9ñ]{3,}/g) || []);
function memSame(a, b){
  a = String(a || '').trim(); b = String(b || '').trim(); if (a.toLowerCase() === b.toLowerCase()) return true;
  if (MEM_SLOT.some(rx => rx.test(a) && rx.test(b))) return true;
  const A = memWords(a), B = memWords(b); if (!A.size || !B.size) return false;
  let n = 0; A.forEach(w => { if (B.has(w)) n++; }); return n / Math.max(A.size, B.size) >= 0.7;
}
function memAddCore(text){
  const m = memSt0(), t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 300); if (t.length < 3) return false;
  /* v4.0 · sin duplicar: si ya hay algo del mismo tipo (otro nombre, otra ciudad, otro trabajo) o casi igual, se ACTUALIZA */
  const old = m.items.find(x => memSame(x.text, t));
  if (old){ old.text = t; old.t = Date.now(); m.items = [old, ...m.items.filter(x => x !== old)]; }
  else m.items.unshift({ id:'m' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t:Date.now(), text:t });
  m.items = m.items.slice(0, 40); memTouch(); return true;
}
/* v3.7 · lo que SynthonIA puede usar: solo lo aprobado y solo si la memoria está encendida */
function memList(){ const m = memSt0(); return m.on ? m.items.slice(0, 12).map(x => x.text) : []; }
/* la lista de «Lo que recuerdo de ti»: se ve, se agrega, se olvida */
function memPanel(host){
  const paint = () => {
    const m = memSt0();
    host.innerHTML = '<div class="cfgrow"><p>Usar mi memoria<small>Las IAs usan esto para responderte mejor. Si la apagas, no se usa (pero no se borra).</small></p><button class="cfgsw" type="button" role="switch" data-mem="on" aria-checked="' + m.on + '" aria-pressed="' + m.on + '" aria-label="Usar mi memoria"><i></i></button></div>'
      + '<ul class="meml">' + (m.items.length ? m.items.map(x => '<li><span></span><button type="button" class="lnk" data-del="' + x.id + '">Olvidar</button></li>').join('') : '<li class="memnone">Todavía no recuerdo nada. Escribe «recuerda que…» en el chat o agrégalo aquí.</li>') + '</ul>'
      + '<form class="memadd"><label class="field"><input type="text" maxlength="300" placeholder="Ej.: Me llamo Ana y estudio diseño gráfico" aria-label="Algo para recordar"></label><button class="btn sm" type="submit">Agregar</button></form>'
      + (m.items.length ? '<button class="lnk memclr" type="button" data-mem="clear">Olvidar todo</button>' : '');
    const L = $$('.meml li span', host); m.items.forEach((x, i) => { if (L[i]) L[i].textContent = x.text; });
  };
  paint();
  host.addEventListener('submit', e => { e.preventDefault(); const i = $('.memadd input', host); if (memAddCore(i.value)){ paint(); toast('Agregado a tu memoria.'); } });
  host.addEventListener('click', async e => {
    const d = e.target.closest('[data-del]'); if (d){ const m = memSt0(); m.items = m.items.filter(x => x.id !== d.dataset.del); memTouch(); paint(); return; }
    const t = e.target.closest('[data-mem]'); if (!t) return; const m = memSt0();
    if (t.dataset.mem === 'on'){ m.on = !m.on; memTouch(); paint(); }
    else if (t.dataset.mem === 'clear' && await szConfirm('¿Olvidar todo?', 'Borro todo lo que recuerdo de ti. No se puede deshacer.', 'Olvidar todo', true)){ m.items = []; memTouch(); paint(); }
  });
}
/* cada página agrega aquí sus atajos de «Tus IAs» (elegir IA ideales, conectar, Drive…) */
const cfgLinks = [];
function cfgModal(tab){
  if ($('#cfgm')) return;
  const draft = Object.assign({ autoWeb:true, review:true, dictado:true }, CFG); draft.saver = !!(state.sx && state.sx.saver);
  const o = document.createElement('div'); o.id = 'cfgm'; o.className = 'szm';
  const row = ([k, t, s]) => '<div class="cfgrow"><p>' + t + '<small>' + s + '</small></p><button class="cfgsw" type="button" role="switch" data-k="' + k + '" aria-checked="' + !!draft[k] + '" aria-pressed="' + !!draft[k] + '" aria-label="' + t + '"></button></div>';
  const IN = [['always', 'Cada vez'], ['session', 'Una vez por visita'], ['never', 'Nunca']];
  const ia = tab === 'ia' || tab === 'mem';
  o.innerHTML = '<div class="tcard cfgcard" role="dialog" aria-modal="true" aria-label="Ajustes"><div class="cfghead"><h3>Ajustes</h3>'
    + '<div class="cfgtabs" role="tablist"><span class="pill"></span><button type="button" role="tab" data-tab="page" aria-selected="' + !ia + '">Página</button><button type="button" role="tab" data-tab="ia" aria-selected="' + ia + '">IAs y memoria</button></div></div>'
    + '<div class="cfgbody">'
    + '<section class="cfgpane" data-pane="page"' + (ia ? ' hidden' : '') + '>'
    + '<div class="cfglbl">Cómo se ve</div><div id="cfgCh"></div>'
    + '<div class="cfglbl">Estilo de Sonyx</div><div class="cfgseg" id="cfgUi"><button type="button" data-ui="full" aria-pressed="' + (draft.ui !== 'simple') + '">Sonyx</button><button type="button" data-ui="simple" aria-pressed="' + (draft.ui === 'simple') + '">Simple</button></div><p class="cnote">Simple: solo tus chats, la caja de escribir y las respuestas, con un diseño tranquilo y sin efectos.</p>'
    + '<div class="cfglbl">Idioma · Language</div><div class="cfgseg notr" id="cfgLang">' + LANGS.map(([id, nm]) => '<button type="button" data-lang="' + id + '" lang="' + id + '" aria-pressed="' + (lang() === id) + '">' + nm + '</button>').join('') + '</div>'
    + '<div class="cfglbl">Tamaño de Sonyx</div><div class="cfgseg" id="cfgSz"><button type="button" data-sz="compact" aria-pressed="' + (draft.size !== 'normal') + '">Compacto</button><button type="button" data-sz="normal" aria-pressed="' + (draft.size === 'normal') + '">Normal</button></div><p class="cnote">Compacto: todo un poco más pequeño, para ver más chat en la pantalla. Normal: el tamaño grande de antes.</p>'
    /* v3.7 · «Atajos en tus chats» salió: la barra nueva siempre muestra Crear, Proyectos y Sintéticos arriba de tus chats */
    + '<div class="cfglbl">Color de Sonyx</div><div class="cfgth" id="cfgTh">' + THEMES.map(([id, nm, c1, lock, c2]) => '<button type="button" data-th="' + id + '" aria-pressed="' + ((draft.theme || 'synthz') === id) + '"' + (lock ? ' aria-disabled="true" data-lock="1"' : '') + ' style="--t1:' + c1 + ';--t2:' + c2 + '"><i></i><span>' + esc(nm) + '</span>' + (lock ? '<em>Pronto</em>' : '') + '</button>').join('') + '</div><p class="cnote" id="cfgThN"></p>'
    + (matchMedia('(pointer:coarse), (max-width:820px)').matches ? '<div class="cfglbl">Barra del celular</div><div class="cfgseg" id="cfgNav"><button type="button" data-nav="bottom" aria-pressed="' + (draft.nav !== 'left') + '">Abajo</button><button type="button" data-nav="left" aria-pressed="' + (draft.nav === 'left') + '">A la izquierda</button></div><p class="cnote">A la izquierda: la barra se esconde y la abres con el botón ☰ de arriba.</p>' : '')
    + '<div class="cfglbl">Detalles</div><div id="cfgRows">' + CFG_PAGE.map(row).join('') + '</div>'
    + '<div class="cfglbl">Intro de la página</div><div class="cfgseg" id="cfgIn">' + IN.map(([v, l]) => '<button type="button" data-in="' + v + '" aria-pressed="' + (draft.intro === v) + '">' + l + '</button>').join('') + '</div><p class="cnote">La animación al entrar al chat siempre se ve.</p>'
    + '</section>'
    + '<section class="cfgpane" data-pane="ia"' + (ia ? '' : ' hidden') + '>'
    + '<div class="cfglbl">Cómo te responden</div>' + CFG_IA.map(row).join('')
    + (document.getElementById('composer') ? '<div class="cfglbl">Dictado por voz</div><p class="cnote">Siempre disponible: toca el micrófono de la caja (o Ctrl+Mayús+Espacio). Funciona en Chrome, Edge y Safari. El micrófono solo se usa cuando tocas el botón. La voz la pasa a texto tu navegador: Sinapse no la recibe ni la guarda.</p>' : '')
    + '<div class="cfglbl" id="cfgMemL">Lo que recuerdo de ti</div><div id="szMem" class="cfgmem"></div>'
    + (cfgLinks.length ? '<div class="cfglbl">Tus IAs</div><div class="cfglinks">' + cfgLinks.map(([l, , d], i) => '<button type="button" class="cfglk" data-lk="' + i + '"><b>' + esc(l) + '</b><small>' + esc(d || '') + '</small><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>').join('') + '</div>' : '')
    + '</section></div>'
    + '<div class="tbtn cfgfoot"><button class="lnk" type="button" data-close>Cerrar</button><button class="btn sm" type="button" id="cfgOk">Guardar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  $('.tcard', o).animate([{ transform:'scale(.94) translateY(16px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:560, easing:'cubic-bezier(.22,1,.36,1)' });
  const paintRows = () => $$('.cfgsw[data-k]', o).forEach(b => { b.setAttribute('aria-pressed', String(!!draft[b.dataset.k])); b.setAttribute('aria-checked', String(!!draft[b.dataset.k])); });
  cfgChooser($('#cfgCh', o), draft.perf, v => { draft.perf = v; Object.assign(draft, cfgPreset(v)); paintRows(); });
  memPanel($('#szMem', o));
  $$('.cfgsw[data-k]', o).forEach(b => b.addEventListener('click', () => { draft[b.dataset.k] = !draft[b.dataset.k]; paintRows(); }));
  $$('[data-in]', o).forEach(b => b.addEventListener('click', () => { draft.intro = b.dataset.in; $$('[data-in]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  const thNote = () => { const n = $('#cfgThN', o); if (n) n.textContent = draft.ui === 'simple' ? 'El estilo Simple usa sus propios colores: el color se ve en el estilo Sonyx.' : (szTeam ? 'Cambia el dorado y el rosado de Sonyx. Aurora y Oro negro ya son tuyos por ser del equipo (plan Orquesta).' : 'Cambia el dorado y el rosado de Sonyx. Aurora y Oro negro llegan con Syntonia.'); };
  thNote();
  $$('[data-ui]', o).forEach(b => b.addEventListener('click', () => { draft.ui = b.dataset.ui; $$('[data-ui]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); thNote(); }));
  $$('[data-lang]', o).forEach(b => b.addEventListener('click', () => { setLang(b.dataset.lang); $$('[data-lang]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));   /* el idioma cambia al instante, sin «Guardar» */
  $$('[data-lk2]', o).forEach(b => b.addEventListener('click', () => { draft.links = b.dataset.lk2; $$('[data-lk2]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  $$('[data-sz]', o).forEach(b => b.addEventListener('click', () => { draft.size = b.dataset.sz; $$('[data-sz]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  $$('[data-th]', o).forEach(b => b.addEventListener('click', () => { if (b.dataset.lock) return; draft.theme = b.dataset.th; $$('[data-th]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  $$('[data-nav]', o).forEach(b => b.addEventListener('click', () => { draft.nav = b.dataset.nav; $$('[data-nav]', o).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  const tabs = $('.cfgtabs', o), pill = $('.pill', tabs);
  const show = k => { $$('[role=tab]', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === k))); $$('.cfgpane', o).forEach(p => { p.hidden = p.dataset.pane !== k; }); const b = $('[data-tab="' + k + '"]', tabs); if (b && pill){ pill.style.width = b.offsetWidth + 'px'; pill.style.transform = 'translateX(' + (b.offsetLeft - 4) + 'px)'; } $('.cfgbody', o).scrollTop = 0; };
  tabs.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
  requestAnimationFrame(() => show(ia ? 'ia' : 'page'));
  try{ cfgSideMenu(o); }catch(e){}
  try{ cfgThemePreview(o, draft); }catch(e){}   /* v3.8 · vista previa de temas (core 14c + React VistaTemas) */   /* v3.7 · menú lateral (core 14b) */
  /* v3.7 · con Animaciones apagadas no hay intro: se dice en vez de dejar que parezca que no funciona */
  const inNote = () => { const n = $('#cfgIn + .cnote', o); if (n) n.textContent = draft.anim === false ? 'Con «Animaciones» apagadas no hay intro: enciéndelas para verla.' : 'La animación al entrar al chat siempre se ve.'; };
  inNote(); $$('.cfgsw[data-k="anim"]', o).forEach(b => b.addEventListener('click', inNote));
  if (tab === 'mem') setTimeout(() => { const l = $('#cfgMemL', o); if (l) l.scrollIntoView({ block:'start', behavior:reduce ? 'auto' : 'smooth' }); }, 350);
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 450); };
  $$('.cfglk', o).forEach(b => b.addEventListener('click', () => { const L = cfgLinks[+b.dataset.lk]; close(); if (L) setTimeout(L[1], 200); }));
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $('#cfgOk', o).addEventListener('click', () => { state.sx = state.sx || {}; if (!!state.sx.saver !== !!draft.saver){ state.sx.saver = !!draft.saver; save(); try{ hooks.usage(); }catch(e){} try{ dispatchEvent(new Event('synthz-saver')); }catch(e){} } const d = Object.assign({}, draft); delete d.saver; applyCfg(d, close); });
}
function applyCfg(draft, close){
  const reload = draft.anim !== CFG.anim || (draft.cursor !== CFG.cursor && matchMedia('(pointer: fine)').matches) || (draft.bg && !!$('.aurora') && !$('.aurora .orbit'));
  Object.assign(CFG, draft, { v:2 }); saveCfg(); cfgClasses();
  if (CFG.favAnim && window.__favStart) window.__favStart();
  if (close) close();
  if (reload){ toast('Aplicando tu configuración…'); setTimeout(() => location.reload(), 900); }
  else toast('Configuración guardada.');
}
/* Esc cierra la ventana flotante que esté arriba */
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const c = [...document.querySelectorAll('.szm [data-close], .szm [data-d="x"], #blk #bClose, #acc #aClose, #sx #sxClose, #conn #cClose, #szChat [data-cx]')].filter(x => x.isConnected && !x.closest('.bye')).pop();
  if (c){ e.preventDefault(); c.click(); }
});

/* el péndulo del logo se frena con suavidad cuando lo señalas y vuelve a moverse al salir */
function calmMark(host, on){
  host.querySelectorAll('.mark .sw').forEach(g => {
    if (on){
      if (g._calm) return; g._calm = true;
      const tf = getComputedStyle(g).transform;
      g.style.animation = 'none';
      if (tf && tf !== 'none' && !reduce) g.animate([{ transform:tf }, { transform:'rotate(0deg)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
    } else if (g._calm){ g._calm = false; g.style.animation = ''; }
  });
}
document.addEventListener('pointerover', e => { const h = e.target.closest && e.target.closest('.logo, a, button'); if (h && h.querySelector('.mark .sw')) calmMark(h, true); });
document.addEventListener('pointerout', e => { const h = e.target.closest && e.target.closest('.logo, a, button'); if (h && !(e.relatedTarget && h.contains(e.relatedTarget)) && h.querySelector('.mark .sw')) calmMark(h, false); });

/* clic con el botón del medio: el cursor cambia al de desplazamiento automático */
if (document.getElementById('cm')){
  let midT = 0;
  const midOff = () => root.classList.remove('cursor-mid');
  addEventListener('pointerdown', e => { if (e.button === 1){ if (e.target.closest && e.target.closest('a')) return; root.classList.toggle('cursor-mid'); midT = performance.now(); } else midOff(); }, true);
  addEventListener('pointerup', e => { if (e.button === 1 && performance.now() - midT > 350) midOff(); }, true);
  addEventListener('keydown', midOff); addEventListener('blur', midOff); addEventListener('wheel', e => { if (!e.buttons) midOff(); }, { passive:true });
}

