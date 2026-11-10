/* ---------- guía breve: panel lateral que no tapa la conversación; se abre con el botón «?» ---------- */
function helpGuide(opts){
  opts = opts || {};
  const old = $('#szHelp'); if (old){ old.classList.remove('on'); setTimeout(() => old.remove(), 380); return; }
  const back = document.activeElement;
  const S = [
    ['¿Qué es Sinapse?', 'Un lugar para hablar con muchas IA, gratis. Escribes lo que necesitas y una IA te responde. No tienes que configurar nada.'],
    ['¿Cómo lo uso?', 'Entra a Sonyx, escribe tu pregunta abajo y pulsa Enter. Si no sabes qué pedir, toca un ejemplo. Tus chats quedan en la barrita de la izquierda (en el celular, abajo).'],
    ['¿Qué son las IAs conectadas?', 'Las IAs conectadas son IAs gratis que ya vienen listas en Sinapse. No tienes que configurar nada ni dar tarjeta: solo escribes. Sin cuenta pruebas con una EnerX de prueba cada día; con tu cuenta gratis dura mucho más.'],
    ['¿Qué es el límite de hoy?', 'Cada día tienes un límite gratis para usar las IAs conectadas. A medianoche se vuelve a llenar. El anillo se va vaciando mientras chateas.'],
    ['¿Qué es Puter y cómo lo conecto?', 'Con Puter usas la versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis y tiene un saldo que se renueva cada mes. Se conecta en Ajustes › Tus IAs › «Conectar Puter u otra IA» › «Conectar con Puter».'],
    ['Varias IA a la vez', 'Con «+» sumas otra IA (hasta 4). Todas responden lo mismo y tú eliges la que más te gusta con «Esta tiene más Flow».'],
    ['Archivos', 'Con el «+» agregas un archivo, un PDF o una foto (hasta 6 por mensaje). Todas las IA leen textos y PDF; las fotos solo las entienden las IA que «ven fotos». También puedes arrastrarlos o pegarlos.'],
    ['Modo principiante', 'En Ajustes puedes activar el modo principiante: las IA te responden con palabras sencillas, paso a paso y con ejemplos.'],
    ['Apex', 'Arriba de tus chats, «Apex»: una IA entiende lo que escribiste, lo mejora y se lo pasa a la IA que más sabe de ese tema. Luego decides si te quedas con esa IA. Esos chats se guardan aparte.'],
    ['Configuración', 'En Ajustes eliges si lo quieres «Más bonito» o «Más rápido», y enciendes o apagas cada detalle: cursor, fondo, vidrio, animaciones, sonidos e intro.']
  ];
  const o = document.createElement('aside'); o.id = 'szHelp'; o.setAttribute('aria-label', 'Guía rápida de Sinapse');
  o.innerHTML = '<div class="hh"><b>Guía rápida</b><button type="button" class="hx" data-hclose aria-label="Cerrar la guía">✕</button></div>'
    + '<div class="hb">' + S.map(([q, a], i) => '<details' + (i === (opts.open || 0) ? ' open' : '') + '><summary>' + q + '</summary><p>' + a + '</p></details>').join('')
    + (opts.extra ? '<div class="hx2">' + opts.extra.map(([l], i) => '<button type="button" class="btn sm ghost" data-hx="' + i + '">' + l + '</button>').join('') + '</div>' : '')
    + '<p class="cnote">Puedes volver a abrir esta guía cuando quieras con el botón «Guía».</p></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 380); document.removeEventListener('keydown', key, true); if (back && back.focus) try{ back.focus(); }catch(e){} };
  const key = e => { if (e.key === 'Escape' && !document.querySelector('.szm')){ e.stopPropagation(); close(); } };
  document.addEventListener('keydown', key, true);
  $('[data-hclose]', o).addEventListener('click', close);
  $$('[data-hx]', o).forEach(b => b.addEventListener('click', () => { close(); opts.extra[+b.dataset.hx][1](); }));
  smoothDetails(o);
  setTimeout(() => { const s = $('summary', o); if (s) s.focus(); }, 60);
}

/* cambia el contenido de un bloque con dirección: «siguiente» sube, «atrás» baja (la misma animación al revés) */
function swapDir(el, dir, set){
  if (!el || reduce || root.classList.contains('noanim')){ set(); return; }
  const d = dir < 0 ? -1 : 1;
  el.animate([{ opacity:1, transform:'none', filter:'blur(0)' }, { opacity:0, transform:'translateY(' + (-12 * d) + 'px)', filter:'blur(8px)' }], { duration:200, easing:'cubic-bezier(.55,0,.75,.2)', fill:'forwards' }).onfinish = () => {
    set(); el.animate([{ opacity:0, transform:'translateY(' + (14 * d) + 'px)', filter:'blur(8px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:380, easing:'cubic-bezier(.22,1,.36,1)', fill:'forwards' });
  };
}
/* ---------- pedir un dato con vidrio (contraseña, código…) ---------- */
function szPrompt(title, text, ok, o){
  o = o || {};
  return new Promise(res => {
    const w = document.createElement('div'); w.className = 'szm szc';
    w.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="word">' + zWord('Synth') + '</div><div class="tb"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div>'
      + '<form class="lform" novalidate><span class="lin"><input name="v" type="' + (o.type || 'text') + '"' + (o.sec ? ' data-sec="1" data-lpignore="true" data-1p-ignore data-form-type="other"' : '') + ' autocomplete="' + (o.ac || 'off') + '" placeholder="' + esc(o.placeholder || '') + '" aria-label="' + esc(o.label || title) + '"></span><p class="lerr" role="alert"></p>'
      + '<div class="tbtn" style="margin-top:6px"><button class="lnk" type="button" data-close>Cancelar</button><button class="btn sm' + (o.danger ? ' danger' : '') + '" type="submit">' + esc(ok) + '</button></div></form></div>';
    document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
    const back = document.activeElement, inp = $('input', w); let gone = false;
    const out = v => { if (gone) return; gone = true; removeEventListener('keydown', key, true); w.classList.remove('on'); setTimeout(() => w.remove(), 400); try{ if (back && back.focus) back.focus(); }catch(e){} res(v); };
    const key = e => { if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); out(null); } };
    addEventListener('keydown', key, true);
    $('[data-close]', w).addEventListener('click', () => out(null));
    $('form', w).addEventListener('submit', e => { e.preventDefault(); const v = inp.value.trim(); if (!v){ $('.lerr', w).textContent = o.empty || 'Escribe algo para seguir.'; inp.focus(); return; } out(v); });
    w.addEventListener('pointerdown', e => { if (e.target === w) out(null); });
    setTimeout(() => inp.focus(), 60);
  });
}

/* ---------- confirmación con vidrio (en vez del confirm() del navegador) ---------- */
/* un «mensaje» = lo que escribes una vez (comparar 3 IA o que el agente piense antes sigue siendo 1) */
let TURN = null;
const setTurn = text => { TURN = { id:turnId([{ role:'user', content:String(text || '') }]), at:Date.now() }; };
function turnId(messages){
  const u = [...(messages || [])].reverse().find(m => m && m.role === 'user'); let t = u ? (typeof u.content === 'string' ? u.content : JSON.stringify(u.content)) : '';
  let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
  return 't' + (h >>> 0).toString(36) + '-' + Math.floor(Date.now() / 600000).toString(36);
}
/* sin cuenta, después de los mensajes de prueba: «Para seguir FlowIAndo, entra o crea tu cuenta» */
let gateOpen = false;
function guestGate(o = {}){
  if (gateOpen || signedish() || document.querySelector('#authm,#acc,#szGate')) return;
  gateOpen = true;
  const g = SZQ.guest || { max:5 }, pu = !!(window.puter && puter.auth && puter.auth.isSignedIn && (() => { try{ return puter.auth.isSignedIn(); }catch(e){ return false; } })());
  const el = document.createElement('div'); el.id = 'szGate'; el.className = 'szm';
  el.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Entra para seguir"><div class="word">' + zWord('Synth') + '</div><div class="tn">SIGUE FLOWIANDO</div>'
    + '<div class="tb"><div class="gtface" aria-hidden="true">' + face('guino', 64) + '</div><h3>Para seguir FlowIAndo, entra a tu cuenta</h3>'
    + '<p>Se acabó tu EnerX de prueba de hoy. Crear tu cuenta es <b>gratis</b>, no pide correo ni tarjeta, y te da mucho más límite cada día. Además tus chats te siguen a cualquier celular o computador.</p>'
    + '<div id="gateBox"></div></div><div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Ahora no</button>' + (pu ? '<button class="lnk" type="button" data-pu>Seguir con mi Puter</button>' : '') + '</div></div>';
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on'));
  $('.tcard', el).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  const out = () => { gateOpen = false; el.classList.remove('on'); setTimeout(() => el.remove(), 450); };
  $('[data-close]', el).addEventListener('click', () => { out(); if (o.onClose) o.onClose(); });
  const pb = $('[data-pu]', el); if (pb) pb.addEventListener('click', () => { out(); try{ dispatchEvent(new CustomEvent('synthz-useputer')); }catch(e){} });
  el.addEventListener('pointerdown', e => { if (e.target === el){ out(); if (o.onClose) o.onClose(); } });
  authBox($('#gateBox', el), () => { out(); szqSet({ guest:null }); szCatalog().catch(() => {}); toast('¡Listo! Ya puedes seguir FlowIAndo.'); if (o.done) o.done(); }, () => {}, o.mode || 'signup');
}
/* apenas tu cuenta está lista: se cierra todo lo que te pedía entrar */
function accSettled(){
  if (!(ACC && ACC.ready)) return;
  szqSet({ guest:null }); szCatalog().catch(() => {});
  document.querySelectorAll('#szGate').forEach(g => { gateOpen = false; g.classList.remove('on'); setTimeout(() => g.remove(), 450); });
  ACC.joining = false; root.classList.add('signed'); root.classList.remove('joining');
}
accHooks.push(k => { if (k === 'out') root.classList.remove('signed'); });
addEventListener('synthz-acc', accSettled); accHooks.push(k => { if (k === 'pull') accSettled(); });
function szConfirm(title, text, ok, danger, no){
  return new Promise(res => {
    const o = document.createElement('div'); o.className = 'szm szc' + (danger ? ' szbru' : '');
    /* v3.8 · lo que no se puede deshacer va en una tarjeta brutalista (idea del Uiverse #52): borde grueso, sombra dura y un encabezado «OJO» */
    const head = danger ? '<div class="bru-h" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><path d="M12 10v4M12 18h.01"/></svg><span class="notr">' + (lang() === 'en' ? 'CAREFUL' : 'OJO') + '</span><i></i></div>' : '<div class="word">' + zWord('Synth') + '</div>';
    o.innerHTML = '<div class="tcard" role="alertdialog" aria-modal="true" aria-label="' + esc(title) + '">' + head + '<div class="tb"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div><div class="tbtn" style="margin-top:16px"><button class="lnk" type="button" data-close>' + esc(no || 'Cancelar') + '</button><button class="btn sm' + (danger ? ' warn' : '') + '" type="button" data-ok>' + esc(ok || 'Aceptar') + '</button></div></div>';
    document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
    const back = document.activeElement; let gone = false;
    const out = v => { if (gone) return; gone = true; removeEventListener('keydown', key, true); o.classList.remove('on'); setTimeout(() => o.remove(), 400); try{ if (back && back.focus) back.focus(); }catch(e){} res(v); };
    const key = e => { if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); out(false); } else if (e.key === 'Tab'){ const f = [...o.querySelectorAll('button')]; const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); } };
    addEventListener('keydown', key, true);
    $('[data-close]', o).addEventListener('click', () => out(false));
    $('[data-ok]', o).addEventListener('click', () => out(true));
    o.addEventListener('pointerdown', e => { if (e.target === o) out(false); });
    setTimeout(() => { const b = $(danger ? '[data-close]' : '[data-ok]', o); if (b) b.focus(); }, 50);
  });
}

