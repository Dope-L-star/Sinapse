/* =====================================================================
   Primera vez en SynthFlow (camino B): 1 ¿qué quieres FlowIA'r? · 2 elige tu IA · 3 chatea
   «Siguiente» sube y «Atrás» baja (la animación al revés)
   ===================================================================== */
const BICO = {
  marketing:'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10',
  escribir:'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  codigo:'m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  estudiar:'M3 7l9-4 9 4-9 4zM7 9v5c0 1.5 2.2 3 5 3s5-1.5 5-3V9',
  planos:'M4 4h16v16H4zM4 12h7v8M11 4v5h9',
  negocios:'M4 20V10M10 20V4M16 20v-7M22 20H2',
  imagenes:'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01',
  mate:'M5 7h14M5 12h6M8 9v6M14 15l5 5M19 15l-5 5'
};
const BEX = { marketing:'Posts, anuncios, nombres y campañas', escribir:'Correos, textos, cuentos y correcciones', codigo:'Programas, errores y páginas web', estudiar:'Resúmenes, explicaciones y exámenes', planos:'Planos de casa, medidas y espacios', negocios:'Planes, precios y presupuestos', imagenes:'Leer documentos y describir fotos', mate:'Ejercicios paso a paso' };
const BCOL = { marketing:'#e6b65f', escribir:'#f2a07b', codigo:'#b8c4ff', estudiar:'#8fd3c7', planos:'#d6a0ff', negocios:'#e6b65f', imagenes:'#f2a07b', mate:'#b8c4ff' };
const BPRO = { write:'Escribe muy natural', code:'Buena con código', reason:'Piensa antes de responder', fast:'Responde rápido', vision:'Lee imágenes', long:'Lee textos largos', lang:'Buen español', math:'Buena con números' };
let BF = null;
function bflowOpen(delay){
  if (BF || $('#bflow')) return;
  setTimeout(() => {
    BF = { step:1, topic:null, all:false, sel:new Set() };
    const o = document.createElement('div'); o.id = 'bflow'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Empieza en SynthFlow');
    o.innerHTML = '<header class="bf-top"><span class="bf-logo">' + SZ.flowWord() + '</span><ol class="bf-steps" aria-label="Pasos"></ol><div class="bf-r"><button type="button" class="btn sm ghost bf-guide">Guía</button><button type="button" class="btn sm bf-acc">Entrar</button></div></header><div class="bf-stage"></div>';
    document.body.appendChild(o); root.classList.add('bflowing');
    requestAnimationFrame(() => o.classList.add('on'));
    $('.bf-guide', o).addEventListener('click', () => { bflowClose(false); setTimeout(openGuide, 500); });
    $('.bf-acc', o).addEventListener('click', () => accModal());
    o.addEventListener('click', bflowClick); o.addEventListener('change', bflowChange);
    bStep(1, 0);
  }, delay || 0);
}
function bStepsHtml(){
  const n = BF.step, T = BF.topic && TOPIC[BF.topic];
  const L = [[1, n > 1 && T ? T.l : 'Qué quieres hacer'], [2, 'Elige tu IA'], [3, 'Chatea']];
  return L.map(([k, l]) => '<li class="' + (k === n ? 'on' : k < n ? 'done' : '') + '"><b>' + (k < n ? '✓' : k) + '</b><span>' + esc(l) + '</span></li>').join('');
}
function bStep(n, dir){
  const o = $('#bflow'); if (!o) return;
  BF.step = n; $('.bf-steps', o).innerHTML = bStepsHtml();
  const st0 = $('.bf-stage', o), old = $('.bf-pane', st0);
  const pane = document.createElement('div'); pane.className = 'bf-pane'; pane.innerHTML = n === 1 ? bPane1() : bPane2();
  const D = SZ.reduce ? 1 : 1, E = 'cubic-bezier(.22,1,.36,1)', up = dir >= 0;
  if (old){
    /* se queda exactamente donde estaba mientras se va (sin saltar al borde) */
    const ol = old.offsetLeft, ot = old.offsetTop, ow = old.offsetWidth;
    Object.assign(old.style, { position:'absolute', left:ol + 'px', top:ot + 'px', width:ow + 'px', margin:'0', pointerEvents:'none' });
    old.animate([{ opacity:1, transform:'none', filter:'blur(0)' }, { opacity:0, transform:'translateY(' + (up ? -46 : 46) + 'px) scale(.98)', filter:'blur(8px)' }], { duration:SZ.reduce ? 1 : 420, easing:'cubic-bezier(.55,0,.75,.2)', fill:'forwards' }).onfinish = () => old.remove();
  }
  st0.appendChild(pane);
  if (dir !== 0 || !SZ.reduce) pane.animate([{ opacity:0, transform:'translateY(' + (up ? 54 : -54) + 'px) scale(.985)', filter:'blur(10px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:SZ.reduce ? 1 : 700, delay:old ? 140 : 0, easing:E, fill:'backwards' });
  st0.scrollTop = 0;
}
function bPane1(){
  const keys = BF.all ? TOPICS.map(t => t[0]) : (isMobile() ? Object.keys(BICO).slice(0, 7) : Object.keys(BICO));
  const card = (k, i) => { const T = TOPIC[k], ic = BICO[k], c = BCOL[k] || '#e6b65f'; return '<button type="button" class="bf-card" data-bt="' + k + '" style="--i:' + i + ';--tc:' + c + '"><span class="bf-ic">' + (ic ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ic + '"/></svg>' : '<i aria-hidden="true">' + T.e + '</i>') + '</span><b>' + esc(T.l) + '</b><small>' + esc(BEX[k] || T.ex.map(x => x[0]).join(' · ')) + '</small></button>'; };
  return '<div class="bf-h"><h1 class="greet">' + greetHtml(GREET[0]) + '</h1><p>Toca un tema. En el siguiente paso te muestro las IA que mejor lo hacen.</p></div>'
    + '<div class="bf-grid' + (BF.all ? ' all' : '') + '">' + keys.map(card).join('') + (BF.all || !isMobile() ? '' : '<button type="button" class="bf-card more" data-bmore style="--i:' + keys.length + '"><span class="bf-ic"><i aria-hidden="true">✦</i></span><b>' + (SZ.lang() === 'en' ? 'More topics' : 'Más temas') + '</b><small>' + (SZ.lang() === 'en' ? 'See all ' : 'Ver los ') + TOPICS.length + '</small></button>') + '</div>'
    + (BF.all || isMobile() ? '' : '<p class="bf-skip"><button type="button" class="btn sm ghost" data-bmore>✦ ' + (SZ.lang() === 'en' ? 'See all ' + TOPICS.length + ' topics' : 'Ver los ' + TOPICS.length + ' temas') + '</button></p>')
    + '<p class="bf-skip">¿Ya sabes qué IA quieres? <button type="button" class="lnk" data-bskip>Ir directo al chat →</button></p>';
}
function bPane2(){
  const T = TOPIC[BF.topic], R = recommendTop(BF.topic, 3);
  const pros = m => { const t = expert(m).tags, L = []; t.forEach(x => { if (BPRO[x] && L.length < 2) L.push(BPRO[x]); }); if (m.vision && L.length < 2 && !L.includes(BPRO.vision)) L.push(BPRO.vision); if (m.ctx >= 100000 && L.length < 2) L.push(kfmt(m.ctx) + ' de contexto'); if (!L.length) L.push('Gratis para empezar'); return L; };
  const card = (m, i) => { const p = payOf(m.id), ok = connected(m.id); return '<article class="bf-rec' + (BF.sel.has(m.id) ? ' on' : '') + '" data-id="' + esc(m.id) + '" style="--i:' + i + ';--vc:' + vendorColor(m.vendor) + '"><div class="bf-rh">' + av(m) + '<div><b>' + esc(m.name) + '</b><small>de ' + esc(m.vlabel) + '</small></div></div><p>' + esc(expert(m).line) + '</p><ul>' + pros(m).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><span class="mpay ' + p[0] + (ok ? '' : ' lock') + '">' + esc(ok ? p[2] : /^pu:/.test(m.id) ? 'Conecta tu Puter (gratis)' : 'Necesita tu llave de OpenRouter') + '</span><div class="bf-ra"><button type="button" class="btn sm" data-bstart>Empezar con esta</button><label class="ckb"><input type="checkbox" data-bck' + (BF.sel.has(m.id) ? ' checked' : '') + '><span>Comparar</span></label></div></article>'; };
  return '<div class="bf-h2"><div><button type="button" class="lnk bf-back" data-bback>← Cambiar tema</button><h2>Para <em>' + esc(T.l) + '</em>, te recomiendo estas</h2><p>Empieza con una, o marca dos y compáralas con el mismo mensaje.</p></div><button type="button" class="btn sm ghost" data-ball>Ver todas las IA</button></div>'
    + (R.length ? '<div class="bf-recs">' + R.map(card).join('') + '</div>' : '<p class="bf-wait">' + (cat.list.length ? 'Las IAs están descansando un momento. Vuelve a intentarlo en un ratito.' : 'Cargando las IA…') + '</p>')
    + '<div class="bf-go" hidden></div>';
}
function bPaintGo(){
  const g = $('#bflow .bf-go'); if (!g) return; const ids = [...BF.sel];
  $$('#bflow .bf-rec').forEach(c => c.classList.toggle('on', BF.sel.has(c.dataset.id)));
  if (ids.length < 2){ g.hidden = true; return; }
  g.hidden = false; g.innerHTML = '<span>Marcaste ' + ids.map(id => '<b>' + esc(info(id).name) + '</b>').join(' y ') + '</span><button type="button" class="btn sm flow" data-bcmp>Comparar estas ' + ids.length + ' →</button>';
  g.animate([{ opacity:0, transform:'translateY(16px) scale(.96)' }, { opacity:1, transform:'none' }], { duration:450, easing:'cubic-bezier(.22,1,.36,1)' });
}
function bflowClick(e){
  const t = e.target;
  if (t.closest('[data-bmore]')){ BF.all = true; const g = $('#bflow .bf-grid'); const h0 = g.offsetHeight; const pane = $$('#bflow .bf-pane').pop(); pane.innerHTML = bPane1(); const g2 = $('#bflow .bf-grid'); if (!SZ.reduce) g2.animate([{ height:h0 + 'px', overflow:'hidden' }, { height:g2.offsetHeight + 'px', overflow:'hidden' }], { duration:620, easing:'cubic-bezier(.22,1,.36,1)' }); return; }
  const c = t.closest('[data-bt]'); if (c){ BF.topic = c.dataset.bt; curTopic = BF.topic; BF.sel.clear(); bStep(2, 1); return; }
  if (t.closest('[data-bback]')){ bStep(1, -1); return; }
  if (t.closest('[data-bskip]')){ bflowClose(true); return; }
  if (t.closest('[data-ball]')){ bflowClose(true); setTimeout(() => openSide('set'), 520); return; }
  const st1 = t.closest('[data-bstart]'); if (st1){ const id = st1.closest('.bf-rec').dataset.id; bflowClose(true, () => { pickMode = 'set'; pickModel(id, null); const x = TOPIC[BF0].ex[0]; if (x) setTimeout(() => useText(x[1], x[2]), 300); if (isLocked()) setTimeout(() => { lockNudge(); openConnect(); }, 900); }); return; }
  if (t.closest('[data-bcmp]')){ const ids = [...BF.sel]; bflowClose(true, () => startCompare(ids), true); return; }
}
function bflowChange(e){
  const c = e.target.closest('[data-bck]'); if (!c) return;
  const id = c.closest('.bf-rec').dataset.id;
  if (c.checked){ const why = cmpWhyNot(id, [...BF.sel]); if (why && why !== 'ya'){ c.checked = false; toast(why); return; } BF.sel.add(id); } else BF.sel.delete(id);
  bPaintGo();
}
let BF0 = null;
function bflowClose(toChat, then, compareTo){
  const o = $('#bflow'); if (!o) return;
  BF0 = BF && BF.topic; BF = null;
  try{ localStorage.setItem('synthz:tour', '1'); localStorage.setItem('synthz:bflow', '1'); }catch(e){}
  if (toChat){ $('.bf-steps', o).innerHTML = '<li class="done"><b>✓</b><span>' + esc(BF0 && TOPIC[BF0] ? TOPIC[BF0].l : 'Qué quieres hacer') + '</span></li><li class="done"><b>✓</b><span>Elige tu IA</span></li><li class="on"><b>3</b><span>Chatea</span></li>'; }
  o.classList.add('bye');
  /* v3.0: la primera vez, al llegar al chat arranca sola la guía (sin repetir el tema ni la IA que ya elegiste) */
  let guided = true; try{ guided = !!localStorage.getItem('synthz:guide'); }catch(e){}
  const autoGuide = toChat && !guided && !compareTo;
  setTimeout(() => { o.remove(); root.classList.remove('bflowing'); if (then) then(); else if (!autoGuide && matchMedia('(pointer: fine)').matches) inp.focus(); if (autoGuide) setTimeout(() => runGuide({ topic:BF0 }), 900); }, SZ.reduce ? 10 : 620);
}
function openGuide(){ SZ.guideAsk({ full:runGuide, pick:list => runTopics(list), read:openHelp }); }
window.SymphoriaOpenGuide = openGuide; /* puente del botón Guía React al selector original */
window.SynthFlowGuide = { run:runGuide, end:() => endGuide(false), on:() => !!G };
addEventListener('keydown', e => {
  if (e.key === 'Escape' && tourEl) closeTour(false);
  else if (e.key === '?' && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '')) openHelp();
});
const chatMd = () => chatArr().map(m => (m.role === 'user' ? '## Tú' : '## ' + info(m.model || selId()).name) + '\n\n' + m.content).join('\n\n');
function exportMd(){
  if (!chatArr().length){ toast('Esta conversación está vacía.'); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([chatMd()], { type:'text/markdown' })); a.download = 'chat-' + info(selId()).name.replace(/[^\w.-]+/g, '_') + '.md'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
/* v2.2 · clic derecho: corto y según dónde hiciste clic (una respuesta, tu mensaje, un texto seleccionado o el chat) */
SZ.ctxMenu((e, sel) => {
  const L = [], m = e.target.closest && e.target.closest('.m.bot, .m.user'), act = k => () => { const b = m && m.querySelector('[data-a="' + k + '"]'); if (b) b.click(); };
  if (sel) L.push({ label:'Preguntarle a la IA sobre esto', ico:'quote', fn:() => { inp.value = '«' + sel.slice(0, 1500) + '»\n\n'; autoGrow(); updateHint(); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } }, '—');
  if (m && m.classList.contains('bot') && !sel){
    L.push({ head:'Esta respuesta' }, { label:'Copiar respuesta', ico:'copy', fn:act('copy') });
    if (m.querySelector('[data-a="voice"]')) L.push({ label:'Escuchar', ico:'sound', fn:act('voice') });
    if (m.querySelector('[data-a="star"]')) L.push({ label:m.querySelector('[data-a="star"][aria-pressed="true"]') ? 'Quitar de favoritos' : 'Guardar en favoritos', ico:'star', fn:act('star') });
    if (m.querySelector('[data-a="regen"]')) L.push({ label:'Pedir otra respuesta', ico:'regen', fn:act('regen') });
    L.push('—');
  } else if (m && !sel){
    const t = (m.querySelector('.bub') || m).innerText || '';
    L.push({ label:'Copiar mi mensaje', ico:'copy', fn:() => { copyText(t); toast('Copiado.'); } }, { label:'Escribirlo otra vez', ico:'new', fn:() => { inp.value = t; autoGrow(); updateHint(); inp.focus(); } }, '—');
  }
  L.push({ label:'Nuevo chat', ico:'new', fn:() => newChat() }, { label:'Buscar en mis chats', ico:'search', fn:() => thOpen() }, '—',
    { label:'Ajustes', ico:'cog', fn:() => SZ.cfgModal() }, { label:'Guía rápida', ico:'help', fn:() => openGuide() });
  return L;
});

