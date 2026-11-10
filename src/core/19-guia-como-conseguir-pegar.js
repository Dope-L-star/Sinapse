/* ---------- guía: cómo conseguir y pegar tu llave de OpenRouter ---------- */
function orGuide(onKey){
  if ($('#org')) return;
  const o = document.createElement('div'); o.id = 'org'; o.className = 'szm';
  const step = (n, t, d, art) => '<div class="ogs"><i class="ogn">' + n + '</i><div><b>' + t + '</b><p>' + d + '</p>' + (art || '') + '</div></div>';
  o.innerHTML = '<div class="tcard og" role="dialog" aria-modal="true" aria-label="Cómo conectar OpenRouter"><div class="word">' + zWord('Synth') + '</div><div class="tn">OPENROUTER · 3 MINUTOS</div><div class="tb"><h3>Desbloquea OpenRouter</h3><p>OpenRouter te da cientos de IA gratis con una llave personal. Así la consigues:</p></div>'
    + step(1, 'Crea tu cuenta gratis', 'Entra a openrouter.ai y regístrate (puedes usar Google).', '<a class="lnk" href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">Abrir openrouter.ai ↗</a>')
    + step(2, 'Crea una llave', 'Ve a <b>Keys</b> y pulsa <b>Create Key</b>. Ponle de nombre «Sinapse» y, si quieres, un límite de crédito de 0.', '<div class="ogk"><span>Keys</span><span class="pr">+ Create Key</span></div>')
    + step(3, 'Cópiala y pégala aquí', 'Empieza por <code>sk-or-</code>. Solo se muestra una vez, guárdala.', '<div class="cbox"><input id="ogKey" type="text" data-sec="1" placeholder="sk-or-…" autocomplete="off" data-lpignore="true" data-1p-ignore data-form-type="other" spellcheck="false"><button class="btn sm" id="ogGo" type="button">Conectar</button></div>')
    + '<p class="cnote">Tu llave se guarda en este navegador y solo viaja a OpenRouter. ¿No quieres crear una? Pídele a alguien de tu equipo que te comparta su OpenRouter desde «Tu cuenta».</p>'
    + '<div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Ahora no</button><a class="btn sm ghost" href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">Ir a mis llaves ↗</a></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  $('.tcard', o).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  const go = async () => {
    const k = $('#ogKey', o).value.trim(), b = $('#ogGo', o);
    if (!/^sk-or-/.test(k)){ toast('La llave empieza por sk-or-. Revisa que la copiaste completa.'); return; }
    const prev = state.keys.openrouter; state.keys.openrouter = k; b.textContent = 'Verificando…'; b.disabled = true;
    try{ await verify(byId('openrouter')); save(); close(); toast('¡OpenRouter desbloqueado!'); if (onKey) onKey(); }
    catch(e){ if (prev) state.keys.openrouter = prev; else delete state.keys.openrouter; save(); b.textContent = 'Conectar'; b.disabled = false; toast(e.message || 'No pude verificar la llave.'); }
  };
  $('#ogGo', o).addEventListener('click', go);
  $('#ogKey', o).addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); go(); } });
}
/* ---------- perfil personalizado ---------- */
const EMOJIS = ['✨', '🚀', '🦊', '🐼', '🌙', '🔥', '🎧', '🎮', '🌸', '🧠', '⚡', '🐉', '🍀', '🎨', '🛸', '👾'];
function profileModal(onSave){
  if ($('#pfm') || !ACC.ready) return;
  const u = ACC.user || {}, p0 = ACC.profile || {};
  const d = { name:p0.name || u.name || '', bio:p0.bio || '', pronouns:p0.pronouns || '', status:p0.status || '', color:p0.color || 'aurora', banner:p0.banner || p0.color || 'aurora', avatar:p0.avatar || { type:u.picture ? 'google' : 'initial' } };
  const o = document.createElement('div'); o.id = 'pfm'; o.className = 'szm';
  o.innerHTML = '<div class="tcard pf" role="dialog" aria-modal="true" aria-label="Editar perfil"><div class="pfprev"></div>'
    + '<div class="pfgrid"><label>Nombre<input id="pfName" maxlength="40"></label><label>Pronombres<input id="pfPro" maxlength="20" placeholder="opcional"></label></div>'
    + '<label class="pfl">Estado<input id="pfSt" maxlength="60" placeholder="Ej: aprendiendo a programar 🧑‍💻"></label>'
    + '<label class="pfl">Sobre ti<textarea id="pfBio" maxlength="160" rows="2" placeholder="Algo corto sobre ti"></textarea></label>'
    + '<div class="cfglbl">Foto</div><div class="pfav">' + (u.picture ? '<button type="button" data-av="google">Mi foto de Google</button>' : '') + '<button type="button" data-av="initial">Mi inicial</button></div><div class="pfemo">' + EMOJIS.map(e => '<button type="button" data-emo="' + e + '">' + e + '</button>').join('') + '</div>'
    + '<div class="cfglbl">Color</div><div class="pfcol">' + Object.keys(TINTS).map(k => '<button type="button" data-col="' + k + '" style="background:' + grad(k) + '" aria-label="' + k + '" title="' + k + '"></button>').join('') + '</div>'
    + '<div class="tbtn" style="margin-top:16px"><button class="lnk" type="button" data-close>Cancelar</button><button class="btn sm" type="button" id="pfOk">Guardar perfil</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  $('.tcard', o).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  const prev = () => {
    $('.pfprev', o).innerHTML = '<div class="pfban" style="background:' + grad(d.banner) + '"></div><div class="pfme">' + avatarHtml(d, u, 'xl') + '<div><b>' + esc(d.name || 'Tu nombre') + '</b>' + (d.pronouns ? '<i>' + esc(d.pronouns) + '</i>' : '') + '<span>' + esc(u.email || '') + '</span></div></div>' + (d.status ? '<p class="szps">' + esc(d.status) + '</p>' : '') + (d.bio ? '<p class="pfb">' + esc(d.bio) + '</p>' : '');
    $$('[data-col]', o).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.col === d.color)));
    $$('[data-av]', o).forEach(b => b.setAttribute('aria-pressed', String(d.avatar.type === b.dataset.av)));
    $$('[data-emo]', o).forEach(b => b.setAttribute('aria-pressed', String(d.avatar.type === 'emoji' && d.avatar.emoji === b.dataset.emo)));
  };
  [['#pfName', 'name'], ['#pfPro', 'pronouns'], ['#pfSt', 'status'], ['#pfBio', 'bio']].forEach(([s, k]) => { const el = $(s, o); el.value = d[k]; el.addEventListener('input', () => { d[k] = el.value; prev(); }); });
  o.addEventListener('click', e => {
    const c = e.target.closest('[data-col]'); if (c){ d.color = d.banner = c.dataset.col; prev(); return; }
    const a = e.target.closest('[data-av]'); if (a && !a.disabled){ d.avatar = { type:a.dataset.av }; prev(); return; }
    const m = e.target.closest('[data-emo]'); if (m){ d.avatar = { type:'emoji', emoji:m.dataset.emo }; prev(); }
  });
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $('#pfOk', o).addEventListener('click', async () => {
    const b = $('#pfOk', o); b.textContent = 'Guardando…'; b.disabled = true;
    try{ await saveProfile(d); toast('Perfil guardado.'); close(); if (onSave) onSave(); }catch(e){ b.textContent = 'Guardar perfil'; b.disabled = false; toast(e.message || 'No pude guardar tu perfil.'); }
  });
  prev();
}
/* ---------- el navegador no debe rellenar tu usuario o contraseña en buscadores ni en las cajas de llaves ----------
   Solo los campos de entrar/crear cuenta (autocomplete username / current-password / new-password) aceptan autorrelleno. */
(function noAutofill(){
  const CRED = /^(username|current-password|new-password|email)$/;
  const isCred = el => CRED.test(el.getAttribute('autocomplete') || '');
  const tame = el => {
    if (el._szAf || isCred(el) || !/^(INPUT|TEXTAREA)$/.test(el.tagName) || /^(checkbox|radio|file|hidden|range|color|submit|button)$/i.test(el.type)) return;
    el._szAf = 1;
    if (!el.hasAttribute('autocomplete')) el.setAttribute('autocomplete', 'off');
    el.setAttribute('data-lpignore', 'true'); el.setAttribute('data-1p-ignore', ''); el.setAttribute('data-form-type', 'other');
    let typed = false;
    el.addEventListener('keydown', () => { typed = true; });
    el.addEventListener('paste', () => { typed = true; });
    /* si Chrome lo rellena solo, se borra (no fue la persona) */
    el.addEventListener('animationstart', e => { if (e.animationName === 'szAutofill' && !typed){ el.value = ''; el.dispatchEvent(new Event('input', { bubbles:true })); } });
  };
  const scan = root => { if (root.querySelectorAll) root.querySelectorAll('input,textarea').forEach(tame); if (root.tagName) tame(root); };
  const go = () => { scan(document); new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && scan(n)))).observe(document.documentElement, { childList:true, subtree:true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  const st = document.createElement('style');
  st.textContent = '@keyframes szAutofill{from{opacity:1}to{opacity:1}}input:-webkit-autofill:not([autocomplete=username]):not([autocomplete=current-password]):not([autocomplete=new-password]):not([autocomplete=email]){animation:szAutofill .01s}input[data-sec]{-webkit-text-security:disc;text-security:disc}';
  (document.head || document.documentElement).appendChild(st);
})();
