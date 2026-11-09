/* ===== v2.0 · Guía rápida con SynthonIA: «¿La quieres completa o qué quieres ver?»
   Eliges uno o varios temas (en el orden que los toques) y te los muestra con su manita.
   Además: «¡Descubriste algo nuevo!» la primera vez que usas algo, y «Qué hay de nuevo» contado por ella ===== */
const GTOPICS = [
  ['chat', 'Escribir y enviar', 'Dónde escribes y cómo envías.'],
  ['ia', 'Elegir la IA', 'Cambiar de IA y ver para qué sirve cada una.'],
  ['comparar', 'Comparar IAs', 'Varias IA responden lo mismo, lado a lado.'],
  ['agente', 'SuperiorSynth', 'Escribes y SuperiorSynth elige la IA por ti.'],
  ['archivos', 'Archivos y vista previa', 'Adjuntar archivos y ver los que te da la IA.'],
  ['extras', 'Internet y memoria', 'Buscar datos de hoy y que la IA te recuerde.'],
  ['chats', 'Mis chats y favoritos', 'Dónde quedan tus conversaciones.'],
  ['limite', 'Tu límite gratis', 'Cuánto te queda hoy y cuándo se llena.'],
  ['cuenta', 'Tu cuenta y Puter', 'Guardar tus chats y la versión pro de las IA.'],
  ['ajustes', 'Ajustes', 'Más bonito, más rápido, sonidos y más.'],
  ['synthonia', 'SynthonIA', 'Cómo pedirme ayuda cuando quieras.']
];
function guideAsk(o = {}){
  if ($('#szGq')) return;
  const L = (o.topics || GTOPICS), picked = [];
  const w = document.createElement('div'); w.id = 'szGq'; w.className = 'szm';
  w.innerHTML = '<div class="tcard gq" role="dialog" aria-modal="true" aria-label="Guía rápida">'
    + '<div class="gq-say"><span class="gq-f">' + face('feliz', 64) + '</span><div><b>SynthonIA</b><p></p></div></div>'
    + '<button type="button" class="gq-full" data-gq="full"><span>Completa</span><small>' + esc(o.fullTxt || 'Te muestro todo, paso a paso (unos 2 minutos).') + '</small></button>'
    + '<p class="gq-or">o elige lo que quieres ver <small>(puedes elegir varios; los veremos en el orden en que los toques)</small></p>'
    + '<div class="gq-chips">' + L.map(t => '<button type="button" class="gq-c" data-t="' + t[0] + '" aria-pressed="false" title="' + esc(t[2]) + '"><i></i>' + esc(t[1]) + '</button>').join('') + '</div>'
    + '<div class="tbtn gq-b"><button class="lnk" type="button" data-close>Ahora no</button>' + (o.read ? '<button class="lnk" type="button" data-gq="read">Leer a mi ritmo</button>' : '') + '<button class="btn sm flow" type="button" data-gq="go" disabled>Muéstrame lo que elegí</button></div></div>';
  document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  $('.tcard', w).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:600, easing:'cubic-bezier(.22,1,.36,1)' });
  const say = '¡Hola! ¿Quieres ver la guía completa o qué quieres aprender?';
  const p = $('.gq-say p', w); p.textContent = say; SND.blip('feliz');
  typeIn(p, { cps:46, max:3, onFrame:lipSync([$('.gq-f .szface', w), ballFace()], say) }).catch(() => {});
  const go = $('[data-gq="go"]', w);
  const paint = () => { $$('.gq-c', w).forEach(b => { const i = picked.indexOf(b.dataset.t); b.setAttribute('aria-pressed', String(i >= 0)); $('i', b).textContent = i >= 0 ? String(i + 1) : ''; }); go.disabled = !picked.length; go.textContent = picked.length ? 'Muéstrame ' + (picked.length === 1 ? 'eso' : 'estos ' + picked.length) : 'Muéstrame lo que elegí'; };
  const close = then => { w.classList.remove('on'); setTimeout(() => w.remove(), 420); if (then) setTimeout(then, 280); };
  w.addEventListener('click', e => {
    const c = e.target.closest('.gq-c');
    if (c){ const k = c.dataset.t, i = picked.indexOf(k); if (i >= 0) picked.splice(i, 1); else picked.push(k); SND.tap && SND.tap(); paint(); return; }
    const b = e.target.closest('[data-gq]');
    if (b){ const a = b.dataset.gq; if (a === 'full') close(o.full); else if (a === 'read') close(o.read); else if (a === 'go' && picked.length) close(() => o.pick && o.pick(picked.slice())); return; }
    if (e.target === w || e.target.closest('[data-close]')) close(o.later);
  });
  setTimeout(() => { const b = $('.gq-full', w); if (b) b.focus(); }, 80);
}

/* «¡Descubriste algo nuevo!»: la primera vez que usas algo, SynthonIA te cuenta en una línea para qué sirve */
const DISC = [
  ['#cCmp, #pickRow [data-add], [data-add-cmp]', 'comparar', 'Comparar IAs', 'Ahora varias IA responden lo mismo y ves cuál lo hace mejor.'],
  ['#modeMenu [data-mode="agent"]', 'agente', 'SuperiorSynth', 'Tú escribes; SuperiorSynth mejora tu pedido y elige la IA que más sabe de eso.'],
  ['.fcard [data-fv]', 'archivos', 'Archivos de la IA', 'Puedes ver el código, su vista previa y descargarlo con su nombre.'],
  ['[data-a="star"]', 'favoritos', 'Favoritos', 'Las respuestas que guardas con la estrella quedan en «Favoritos».'],
  ['#attachBtn', 'adjuntar', 'Adjuntar archivos', 'Le puedes dar a la IA fotos, PDF o archivos de texto para que los lea.'],
  ['.tchip[data-topic]', 'temas', 'Temas', 'Cada tema te recomienda las IA que mejor lo hacen.'],
  ['[data-r="search"], #thQ', 'buscar', 'Buscar en tus chats', 'Busco dentro de todos tus mensajes, no solo en los títulos.'],
  ['[data-a="regen"]', 'otra', 'Otra vez', 'La IA vuelve a responder lo mismo, con otras palabras.'],
  ['#ssTop', 'agente-off', 'Salir de SuperiorSynth', 'Toca su sello arriba y «Elegir yo la IA».']
];
const DISC_KEY = 'synthz:disc';
let discSeen = {}; try{ discSeen = JSON.parse(localStorage.getItem(DISC_KEY) || '{}') || {}; }catch(e){}
let discQ = [], discOn = false;
function discShow(){
  if (discOn || !discQ.length) return;
  if (document.querySelector('#szgHud, #szGq, #szWelcome, #vintro, #intro, #portal, .hackev') || root.classList.contains('guiding')){ setTimeout(discShow, 2500); return; }
  discOn = true; const [, , name, text] = discQ.shift();
  const d = document.createElement('div'); d.className = 'szdisc'; d.setAttribute('role', 'status');
  d.innerHTML = '<span class="dc-f">' + face('sorprendida', 46) + '</span><div><small>¡Descubriste algo nuevo!</small><b></b><p></p></div><button type="button" class="dc-x" aria-label="Cerrar">✕</button>';
  $('b', d).textContent = name; $('p', d).textContent = text;
  document.body.appendChild(d); requestAnimationFrame(() => d.classList.add('on')); SND.blip && SND.blip('sorprendida');
  typeIn($('p', d), { cps:44, max:3, onFrame:lipSync([$('.dc-f .szface', d)], text) }).catch(() => {});
  const bye = () => { if (!d.isConnected) return; d.classList.remove('on'); setTimeout(() => { d.remove(); discOn = false; setTimeout(discShow, 600); }, 400); };
  $('.dc-x', d).addEventListener('click', bye); setTimeout(bye, 6500);
}
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  for (const D of DISC){
    if (discSeen[D[1]] || !e.target.closest(D[0])) continue;
    discSeen[D[1]] = Date.now(); try{ localStorage.setItem(DISC_KEY, JSON.stringify(discSeen)); }catch(x){}
    discQ.push(D); setTimeout(discShow, 900); break;
  }
}, true);

/* «Qué hay de nuevo»: SynthonIA te lo cuenta una vez por versión (y está en el menú cuando quieras) */
const WHATSNEW = { v:'3.0', items:[
  ['portada', 'La página ahora se llama SymphorIA, «el portador de la armonía», y estrena icono.'],
  ['chat', ENERX + ': tu batería del día para usar las IAs conectadas. Baja con cada mensaje y se carga a medianoche.'],
  ['chat', 'Sintéticos como en Claude: cuando la IA te crea una página, un juego o un dibujo, se abre solo al lado del chat. Y en la barrita, «Sintéticos» los junta todos.'],
  ['ajustes', 'Toda la página en español o en inglés: botón ES/EN en la portada, y en SynthFlow, Ajustes › «Idioma · Language» o el menú «⋯».'],
  ['synthonia', 'Ahora me sé toda la página: pregúntame dónde está cualquier cosa (también en inglés) y te la señalo con mi manita.'],
  ['proyectos', 'Proyectos: junta chats, instrucciones y archivos de un mismo tema. Ahora se pintan con los colores de tu tema.'],
  ['ajustes', 'Modo compacto: SynthFlow ahora se ve un poco más pequeño. Si prefieres el tamaño de antes, Ajustes → Tamaño → Normal.'],
  ['chat', 'Más seguro: lo que crea la IA corre aparte, en su propio espacio, y tu sesión queda protegida.'],
  ['ajustes', 'Pulsem (equipo): ahora cada quien puede quitar su llave con «Quitar».'],
  ['chat', 'Planes en el menú «⋯» › Planes: Chispa (gratis), Chispa+, Syntonia, Timeless y Orquesta. Por ahora solo se muestran: los pagos están apagados y nadie te cobra.'],
  ['chat', 'Guía de 2 minutos: al terminar «Empieza en SynthFlow» arranca sola, sin preguntarte otra vez el tema ni la IA.'],
  ['chat', 'La caja para escribir ahora es más larga y más bajita, para que veas más chat.'],
  ['synthonia', 'Nueva página de Ayuda, en español y en inglés: preguntas frecuentes y botones para hablar con el equipo o conmigo.']
] };
function newsBang(onShow){
  const b = $('#szBot'); if (!b){ setTimeout(() => newsBang(onShow), 600); return; }
  if ($('.nwbang', b)) return;
  const x = document.createElement('span'); x.className = 'nwbang'; x.setAttribute('role', 'button'); x.setAttribute('tabindex', '0'); x.setAttribute('aria-label', '¿Qué hay de nuevo?'); x.dataset.tip = '¿Qué hay de nuevo?'; x.textContent = '!';
  const go = e => { e.preventDefault(); e.stopPropagation(); whatsNew(true, onShow); };
  x.addEventListener('click', go); x.addEventListener('pointerdown', e => e.stopPropagation()); x.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(e); });
  b.appendChild(x); b.setAttribute('aria-label', 'SynthonIA · hay novedades');
  try{ SND.blip('celebrando'); }catch(e){}
}
function whatsNew(force, onShow){
  let seen = ''; try{ seen = localStorage.getItem('synthz:newv') || ''; }catch(e){}
  const visited = (() => { try{ return !!localStorage.getItem('synthz:visited'); }catch(e){ return false; } })();
  if (!force && (seen === WHATSNEW.v || !visited)){ try{ localStorage.setItem('synthz:newv', WHATSNEW.v); }catch(e){} return false; }
  /* v2.2 · ya no se abre sola: sale un «!» sobre la cabeza de SynthonIA (una vez por versión) y se abre al tocarlo */
  if (!force){ newsBang(onShow); return false; }
  try{ localStorage.setItem('synthz:newv', WHATSNEW.v); }catch(e){}
  $$('.nwbang').forEach(x => { x.classList.add('out'); setTimeout(() => x.remove(), 400); }); const sb = $('#szBot'); if (sb) sb.setAttribute('aria-label', 'SynthonIA');
  if ($('#szNew')) return true;
  const w = document.createElement('div'); w.id = 'szNew'; w.className = 'szm';
  w.innerHTML = '<div class="tcard gq" role="dialog" aria-modal="true" aria-label="Qué hay de nuevo"><div class="gq-say"><span class="gq-f">' + face('celebrando', 64) + '</span><div><b>SynthonIA · Qué hay de nuevo</b><p></p></div></div>'
    + '<ul class="nw-l">' + WHATSNEW.items.map((x, i) => '<li style="--i:' + i + '">' + esc(x[1]) + '</li>').join('') + '</ul>'
    + '<div class="tbtn gq-b"><button class="lnk" type="button" data-close>Luego</button>' + (onShow ? '<button class="btn sm flow" type="button" data-nw="show">Muéstramelo</button>' : '') + '</div></div>';
  document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  const say = '¡Hay cosas nuevas en ' + BRAND() + '! Te cuento rapidito:';
  const p = $('.gq-say p', w); p.textContent = say; SND.blip('celebrando');
  typeIn(p, { cps:44, max:3, onFrame:lipSync([$('.gq-f .szface', w), ballFace()], say) }).catch(() => {});
  const close = then => { w.classList.remove('on'); setTimeout(() => w.remove(), 420); if (then) setTimeout(then, 280); };
  w.addEventListener('click', e => { if (e.target.closest('[data-nw="show"]')) return close(() => onShow(WHATSNEW.items.map(x => x[0]).filter((k, i, a) => a.indexOf(k) === i && GTOPICS.some(t => t[0] === k)))); if (e.target === w || e.target.closest('[data-close]')) close(); });
  return true;
}

/* ===== v2.0 · MODO ALERTA: si los proveedores dejan de ser gratis (todas las IAs conectadas piden pago),
   la página lo dice claro y espera; apenas vuelvan, te lleva de nuevo solita ===== */
let alertEl = null, alertT = 0;
function alertMode(on){
  if (on && !alertEl){
    if (document.querySelector('#vintro, #intro, #portal')){ setTimeout(() => alertMode(!!SZQ.alert), 3000); return; }
    const pu = (() => { try{ return !!(window.puter && puter.auth && puter.auth.isSignedIn()); }catch(e){ return false; } })();
    const o = document.createElement('div'); o.id = 'szAlert'; o.setAttribute('role', 'alertdialog'); o.setAttribute('aria-live', 'assertive');
    o.innerHTML = '<div class="al-in"><span class="al-f">' + face('preocupada', 84) + '</span><b class="al-t">Error: no podemos continuar</b>'
      + '<p>Las IAs gratis dejaron de responder por un cambio de los servicios que usamos. No es tu culpa y nadie te va a cobrar nada.</p>'
      + '<p class="al-w"><i></i>En cuanto volvamos a estar en línea, te redirigimos solito. No cierres la página.</p>'
      + (pu ? '<button type="button" class="btn sm flow" data-al="pu">Mientras tanto, seguir con mi Puter</button>' : '') + '</div>';
    document.body.appendChild(o); alertEl = o; requestAnimationFrame(() => o.classList.add('on'));
    const pb = $('[data-al="pu"]', o); if (pb) pb.addEventListener('click', () => { alertDismissed = true; alertMode(false); try{ dispatchEvent(new CustomEvent('synthz-useputer')); }catch(e){} });
    try{ telEv('noai', 'modo alerta: ninguna IA gratis responde'); }catch(e){}
    clearInterval(alertT); alertT = setInterval(async () => { if (document.hidden) return; try{ await szCatalog(); }catch(e){} if (!SZQ.alert) alertBack(); }, 60000);   /* Fase 4: cada minuto y solo con la pestaña a la vista (antes 30 s: con miles de personas esperando, era una avalancha justo cuando el servidor está mal) */
  } else if (!on && alertEl){ const o = alertEl; alertEl = null; clearInterval(alertT); o.classList.remove('on'); setTimeout(() => o.remove(), 500); }
}
let alertDismissed = false;
function alertBack(){
  if (!alertEl) return; clearInterval(alertT);
  const o = alertEl; $('.al-f', o).innerHTML = face('celebrando', 84); $('.al-t', o).textContent = '¡Volvimos!'; $$('p, button', o).forEach(x => x.remove());
  o.querySelector('.al-in').insertAdjacentHTML('beforeend', '<p>Ya todo funciona. Te llevo de vuelta…</p>');
  setTimeout(() => location.reload(), 1800);
}
addEventListener('synthz-szq', () => {
  if (SZQ.alert && !alertDismissed) alertMode(true); else if (!SZQ.alert && alertEl) alertBack();
  /* al equipo: SynthonIA avisa una vez por sesión que hay alertas en Pulsem */
  if (SZQ.alertN > 0 && ACC && ACC.user && ['owner', 'admin', 'staff'].includes(ACC.user.role)){
    let seen = false; try{ seen = sessionStorage.getItem('synthz:alertn') === String(SZQ.alertN); sessionStorage.setItem('synthz:alertn', String(SZQ.alertN)); }catch(e){}
    if (!seen) setTimeout(() => { try{ BOTAPI.offer && BOTAPI.offer('Ojo, equipo: hay ' + SZQ.alertN + (SZQ.alertN === 1 ? ' alerta' : ' alertas') + ' de las IAs (un proveedor pidió pago o cambió su plan gratis). Nada se cobró. Revísalo en Pulsem.', 'preocupada', 'Abrir Pulsem', () => { location.href = 'pulsem.html'; }); }catch(e){} }, 4000);
  }
});
