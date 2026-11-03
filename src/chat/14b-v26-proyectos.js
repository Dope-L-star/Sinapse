/* ---------- v2.6 · Proyectos: chats, instrucciones y archivos juntos en un solo lugar ----------
   · Cada proyecto tiene nombre, descripción, instrucciones y archivos (su «conocimiento»).
   · Los chats que empiezas dentro de un proyecto quedan guardados en él, y la IA recibe sus
     instrucciones y lo que más se relaciona de sus archivos en cada mensaje.
   · Se guardan en este equipo y, si entraste a tu cuenta, viajan con ella (core 02). */
const PJ_MAX = 200000, PJ_SEND = 8000, PJ_SEND_SAVER = 4000, PJ_COLORS = ['var(--sb-primary)', 'var(--sb-secondary)', 'var(--sb-warm)', 'var(--sb-spark)', 'var(--sb-light)', 'color-mix(in srgb,var(--sb-light) 55%,var(--sb-primary))'];   /* v2.9: los colores del tema, no fijos */
const PJ_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M3.5 10.5h17"/></svg>';
const PJ_STAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/></svg>';
const PJ_DOTS = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
const PJ_SEND_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
const PJ_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const PJ_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const PJ_EX = [
  ['Tesis de grado', 'Investigo, escribo y reviso mi tesis. Quiero respuestas con fuentes y un tono académico.'],
  ['Mi emprendimiento', 'Ideas, precios, publicaciones y mensajes para clientes de mi negocio.'],
  ['Aprender inglés', 'Practico conversación y gramática. Corrígeme con paciencia y explica cada error.'],
  ['Recetas de la semana', 'Menús fáciles y baratos para mi familia, con la lista de compras.']
];
const pjs = () => st().projects || (st().projects = []);
const pjOf = () => st().projOf || (st().projOf = {});
const pjGet = id => id ? pjs().find(p => p.id === id) : null;
const pjSize = p => (p.files || []).reduce((n, f) => n + (f.text || '').length, 0);
const pjColor = p => PJ_COLORS[(p.c != null ? p.c : [...p.id].reduce((n, ch) => n + ch.charCodeAt(0), 0)) % PJ_COLORS.length];
const pjKey = (model, id) => 'openrouter::' + model + (id ? '::' + id : '');
const pjChats = id => allThreads().filter(x => pjOf()[x.k] === id);
const pjNum = n => n >= 1000 ? Math.round(n / 1000) + ' mil' : String(n);
const pjAgo = t => { if (!t) return ''; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'hace un momento' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.round(m / 60) + ' h' : m < 2880 ? 'ayer' : 'hace ' + Math.round(m / 1440) + ' días'; };
function pjEdit(p){ p.u = Date.now(); save(); }
/* el proyecto del chat que estás viendo (o el del chat nuevo que empezaste desde un proyecto) */
function pjCur(){ const k = ckey(); return pjGet(pjOf()[k]) || (!chatArr().length ? pjGet(st().curProj) : null); }

/* ---------- lo que la IA recibe: instrucciones + lo más relacionado de los archivos ---------- */
const pjNorm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function pjPick(files, query, budget){
  const all = files.filter(f => f.text);
  if (all.reduce((n, f) => n + f.text.length + f.name.length + 20, 0) <= budget) return all.map(f => '[Archivo: ' + f.name + ']\n' + f.text).join('\n\n');
  /* mucho texto: se parte en trozos y viajan los que más se parecen a lo que preguntas (y el comienzo de cada archivo) */
  const words = [...new Set(pjNorm(query).split(/[^a-z0-9ñ]+/).filter(w => w.length > 3))];
  const parts = [];
  all.forEach(f => { for (let i = 0, n = 0; i < f.text.length; i += 1400, n++){ const t = f.text.slice(i, i + 1400), low = pjNorm(t); parts.push({ f, n, t, s:(n === 0 ? .5 : 0) + words.reduce((s, w) => s + (low.split(w).length - 1), 0) }); } });
  const pick = [], used = new Set(); let size = 0;
  parts.slice().sort((a, b) => b.s - a.s).forEach(p => { if (size + p.t.length + 60 > budget) return; pick.push(p); size += p.t.length + 60; used.add(p.f); });
  pick.sort((a, b) => all.indexOf(a.f) - all.indexOf(b.f) || a.n - b.n);
  return pick.map(p => '[Archivo: ' + p.f.name + ' · parte ' + (p.n + 1) + ']\n' + p.t).join('\n\n') + '\n\n(Solo van las partes de los archivos que más se relacionan con la pregunta.)';
}
function projSystem(chat, saver){
  const k = Object.keys(st().chats).find(x => st().chats[x] === chat);
  const p = pjGet(k && pjOf()[k]); if (!p) return '';
  let s = 'Esta conversación es parte del proyecto «' + p.name + '»' + (p.desc ? ' (' + p.desc + ')' : '') + '.';
  if (p.instr) s += '\nInstrucciones del proyecto (síguelas siempre):\n' + p.instr;
  if ((p.files || []).some(f => f.text)){
    const last = [...chat].reverse().find(m => m.role === 'user');
    s += '\nConocimiento del proyecto: archivos que la persona subió. Úsalos como fuente principal y di de qué archivo sacas cada dato.\n' + pjPick(p.files, last ? (last.ask || last.content) : '', saver ? PJ_SEND_SAVER : PJ_SEND);
  }
  return s;
}

/* ---------- los chats nuevos quedan dentro del proyecto desde el que los empezaste ---------- */
const pjTouch0 = touchThread;
touchThread = function(){
  pjTouch0();
  const k = ckey(), id = st().curProj;
  if (id && pjGet(id) && !pjOf()[k] && chatArr().length <= 2) pjOf()[k] = id;
  const p = pjGet(pjOf()[k]); if (p) p.t = Date.now();
};
const pjNew0 = newChat;
newChat = function(){ st().curProj = ''; pjClose(); pjNew0(); pjCrumb(); };
const pjOpenT0 = openThread;
openThread = function(model, id, ci){ pjClose(); pjOpenT0(model, id, ci); st().curProj = pjOf()[pjKey(model, id)] || ''; pjCrumb(); };
const pjRender0 = renderMsgs;
renderMsgs = function(){ pjRender0.apply(this, arguments); pjCrumb(); };

/* ---------- en la cabecera: «📁 Proyecto» cuando el chat es de un proyecto ---------- */
const PC = document.createElement('button'); PC.type = 'button'; PC.className = 'pjcrumb'; PC.id = 'pjCrumb'; PC.hidden = true;
$('#msgs').prepend(PC);   /* arriba de la conversación */
PC.addEventListener('click', () => { const p = pjCur(); if (p) pjOpen('page', p.id); });
function pjCrumb(){
  const p = mode === 'solo' ? pjCur() : null; PC.hidden = !p; if (!p) return;
  PC.style.setProperty('--pc', pjColor(p)); PC.innerHTML = PJ_ICO + '<span></span>'; $('span', PC).textContent = p.name;
  PC.setAttribute('aria-label', 'Proyecto ' + p.name + ': abrir el proyecto'); PC.title = 'Abrir el proyecto';
}

/* ---------- entradas: barra de íconos, panel de chats (y la hoja del celular) ---------- */
{
  const rb = document.createElement('button'); rb.type = 'button'; rb.className = 'rbtn'; rb.id = 'railProj'; rb.dataset.tip = 'Proyectos'; rb.style.setProperty('--i', '2');
  rb.innerHTML = PJ_ICO + '<span class="rl">Proyectos</span>'; rb.setAttribute('aria-label', 'Proyectos');
  $('#rail [data-r="new"]').after(rb);
  rb.addEventListener('click', () => PV.hidden || pjView.v !== 'list' ? pjOpen('list') : pjClose());
  const cb = document.createElement('button'); cb.type = 'button'; cb.className = 'cnew cproj'; cb.id = 'cProj';
  cb.innerHTML = PJ_ICO + 'Proyectos';
  $('#cNew').after(cb);
  cb.addEventListener('click', () => pjOpen('list'));
}

/* ---------- la página de proyectos (cubre la conversación; «Volver al chat» la cierra) ---------- */
const PV = document.createElement('section'); PV.className = 'pjv'; PV.id = 'pjv'; PV.hidden = true; PV.setAttribute('aria-label', 'Proyectos'); PV.tabIndex = -1;
$('#shell .main').appendChild(PV);
let pjView = { v:'list', id:'' }, pjQ = '', pjSort = 't', pjArch = false, pjFormBack = null;
function pjOpen(v, id){
  pjView = { v, id:id || '' }; PV.hidden = false; document.body.classList.add('pjon');
  try{ closeChatsSheet(); }catch(e){}
  if (isTablet() && RS.chats){ RS.chats = false; saveRS(); applyRail(); }
  $('#railProj').setAttribute('aria-pressed', 'true');
  pjRender(); PV.scrollTop = 0;
  requestAnimationFrame(() => { const f = $('[data-autofocus]', PV); (f && matchMedia('(pointer: fine)').matches ? f : PV).focus({ preventScroll:true }); });
}
function pjClose(){ if (PV.hidden) return; PV.hidden = true; document.body.classList.remove('pjon'); $('#railProj').setAttribute('aria-pressed', 'false'); pjMenuClose(); }
addEventListener('keydown', e => { if (e.key === 'Escape' && !PV.hidden && !document.querySelector('.szm.on,[role="dialog"]:not(.pjv)')){ if (pjMenu) pjMenuClose(); else if (pjView.v === 'list') pjClose(); else pjOpen('list'); } });

function pjRender(){
  const v = pjView.v, p = pjGet(pjView.id);
  if ((v === 'page' || v === 'edit') && !p){ pjView = { v:'list', id:'' }; return pjRender(); }
  PV.innerHTML = '<div class="pj-in">' + (v === 'list' ? pjListHtml() : v === 'new' || v === 'edit' ? pjFormHtml(v === 'edit' ? p : null) : pjPageHtml(p)) + '</div>';
  if (v === 'list') pjPaintList();
  const it = $('.pj-it', PV); if (it && p) it.textContent = p.instr;   /* las instrucciones van como texto, nunca como HTML */
}
const pjBar = (back) => '<div class="pj-bar">' + (back ? '<button type="button" class="pj-back" data-pa="list"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>Todos los proyectos</button>' : '<span></span>')
  + '<button type="button" class="pj-close" data-pa="close">Volver al chat' + PJ_X + '</button></div>';

function pjListHtml(){
  return pjBar(false) + '<header class="pj-lh"><div><h1>Proyectos</h1><p>Junta chats, instrucciones y archivos de un mismo tema. La IA los tiene en cuenta en cada chat del proyecto.</p></div>'
    + '<button type="button" class="btn pj-newb" data-pa="new">' + PJ_PLUS + 'Nuevo proyecto</button></header>'
    + '<div class="pj-tools"><label class="pj-q"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" id="pjQ" placeholder="Buscar proyectos" autocomplete="off" aria-label="Buscar proyectos"></label>'
    + '<label class="pj-sort"><span>Ordenar</span><select id="pjSort" aria-label="Ordenar proyectos"><option value="t">Actividad reciente</option><option value="n">Nombre</option><option value="c">Más nuevos</option></select></label>'
    + '<button type="button" class="pj-arch" id="pjArchB" aria-pressed="false">Archivados</button></div>'
    + '<div class="pj-list" id="pjList"></div>';
}
function pjPaintList(){
  const q = $('#pjQ', PV), so = $('#pjSort', PV), ab = $('#pjArchB', PV);
  q.value = pjQ; so.value = pjSort; ab.setAttribute('aria-pressed', String(pjArch));
  const nArch = pjs().filter(p => p.arch).length; ab.hidden = !nArch && !pjArch; ab.textContent = 'Archivados' + (nArch ? ' (' + nArch + ')' : '');
  const qq = pjNorm(pjQ.trim());
  const L = pjs().filter(p => !!p.arch === pjArch && (!qq || pjNorm(p.name + ' ' + (p.desc || '')).includes(qq)))
    .sort((a, b) => (!!b.star - !!a.star) || (pjSort === 'n' ? a.name.localeCompare(b.name, 'es') : pjSort === 'c' ? (b.c0 || 0) - (a.c0 || 0) : (b.t || 0) - (a.t || 0)));
  const box = $('#pjList', PV);
  if (!L.length){
    box.innerHTML = qq || pjArch ? '<div class="pj-none"><b>' + (qq ? 'Ningún proyecto coincide.' : 'No tienes proyectos archivados.') + '</b></div>'
      : '<div class="pj-empty"><span class="pj-big">' + PJ_ICO + '</span><b>Tu primer proyecto</b><p>Por ejemplo, tu tesis o tu negocio: le das instrucciones y archivos una sola vez y cada chat del proyecto ya los conoce.</p>'
        + '<div class="pj-exs">' + PJ_EX.map((x, i) => '<button type="button" class="pj-ex" data-ex="' + i + '">' + esc(x[0]) + '</button>').join('') + '</div></div>';
    return;
  }
  box.innerHTML = L.map((p, i) => {
    const n = pjChats(p.id).length, kf = (p.files || []).length;
    return '<article class="pjc" style="--pc:' + pjColor(p) + ';--i:' + Math.min(i, 12) + '"><button type="button" class="pjc-go" data-open="' + esc(p.id) + '"><span class="pjc-ic">' + PJ_ICO + '</span><b class="pjc-n"></b><span class="pjc-d"></span>'
      + '<small>' + (n === 1 ? '1 chat' : n + ' chats') + (kf ? ' · ' + (kf === 1 ? '1 archivo' : kf + ' archivos') : '') + (p.t ? ' · ' + pjAgo(p.t) : '') + '</small></button>'
      + '<button type="button" class="pjc-star" data-star="' + esc(p.id) + '" aria-pressed="' + !!p.star + '" aria-label="' + (p.star ? 'Quitar de destacados' : 'Destacar') + '">' + PJ_STAR + '</button></article>';
  }).join('');
  [...box.querySelectorAll('.pjc')].forEach((el, i) => { $('.pjc-n', el).textContent = L[i].name; $('.pjc-d', el).textContent = L[i].desc || 'Sin descripción'; });
}

function pjFormHtml(p){
  return pjBar(true) + '<form class="pj-form" id="pjForm" novalidate><h1>' + (p ? 'Editar el proyecto' : 'Nuevo proyecto') + '</h1>'
    + '<label class="pj-f"><span>¿En qué estás trabajando?</span><input id="pjName" maxlength="60" required placeholder="Ponle un nombre al proyecto" autocomplete="off" data-autofocus value="' + esc(p ? p.name : '') + '"></label>'
    + '<label class="pj-f"><span>¿Qué quieres lograr? <small>(opcional)</small></span><textarea id="pjDesc" maxlength="300" rows="3" placeholder="Cuéntale a la IA de qué se trata: tu objetivo, para quién es, el tono que prefieres…">' + esc(p ? p.desc || '' : '') + '</textarea></label>'
    + (p ? '' : '<div class="pj-exs sm"><span>Ideas:</span>' + PJ_EX.map((x, i) => '<button type="button" class="pj-ex" data-ex="' + i + '">' + esc(x[0]) + '</button>').join('') + '</div>')
    + '<div class="pj-acts"><button type="button" class="lnk" data-pa="' + (p ? 'page' : 'list') + '">Cancelar</button><button type="submit" class="btn">' + (p ? 'Guardar' : 'Crear proyecto') + '</button></div></form>';
}

function pjPageHtml(p){
  const L = pjChats(p.id), size = pjSize(p), pct = Math.min(100, Math.round(size / PJ_MAX * 100));
  return pjBar(true) + '<header class="pj-h" style="--pc:' + pjColor(p) + '"><span class="pj-ic">' + PJ_ICO + '</span><div class="pj-ht"><h1>' + esc(p.name) + '</h1>' + (p.desc ? '<p>' + esc(p.desc) + '</p>' : '') + (p.arch ? '<em class="pj-tag">Archivado</em>' : '') + '</div>'
    + '<button type="button" class="pjc-star" data-star="' + esc(p.id) + '" aria-pressed="' + !!p.star + '" aria-label="' + (p.star ? 'Quitar de destacados' : 'Destacar') + '">' + PJ_STAR + '</button>'
    + '<button type="button" class="pj-more" data-pa="menu" aria-haspopup="menu" aria-expanded="false" aria-label="Más opciones del proyecto">' + PJ_DOTS + '</button></header>'
    + '<div class="pj-grid"><div class="pj-main">'
    + '<form class="pj-ask" id="pjAsk"><label class="sr" for="pjAskIn">Empieza un chat en este proyecto</label><textarea id="pjAskIn" rows="2" maxlength="20000" placeholder="¿Qué quieres hacer en este proyecto?" data-autofocus></textarea><button type="submit" class="send" aria-label="Empezar el chat">' + PJ_SEND_ICO + '</button></form>'
    + '<h2 class="pj-sh">Chats del proyecto</h2>'
    + (L.length ? '<div class="pj-chats">' + L.map(x => '<button type="button" class="pj-chat" data-k="' + esc(x.k) + '"><b>' + esc(x.title) + '</b><small>' + esc(info(x.model).name || 'Automático') + ' · ' + pjAgo(x.t) + '</small></button>').join('') + '</div>'
      : '<p class="pj-none sm">Los chats que empieces aquí se guardan en este proyecto. También puedes mover un chat desde tu lista con el ícono de carpeta.</p>')
    + '</div><aside class="pj-side" aria-label="Conocimiento del proyecto"><div class="pj-kh"><h2>Conocimiento del proyecto</h2><small>Lo que la IA sabe en cada chat de «' + esc(p.name) + '»</small></div>'
    + '<section class="pj-card" id="pjInstr"><div class="pj-ch"><h3>Instrucciones</h3><button type="button" class="lnk" data-pa="instr">' + (p.instr ? 'Editar' : 'Agregar') + '</button></div>'
    + (p.instr ? '<p class="pj-it"></p>' : '<p class="pj-muted">Dile a la IA cómo responder en este proyecto: el tono, el formato, lo que debe saber de ti.</p>') + '</section>'
    + '<section class="pj-card" id="pjFiles"><div class="pj-ch"><h3>Archivos</h3><span class="pj-fb"><button type="button" class="lnk" data-pa="paste">Pegar texto</button><button type="button" class="btn sm ghost" data-pa="upload">' + PJ_PLUS + 'Subir</button></span></div>'
    + '<div class="pj-cap" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="Capacidad usada"><i style="width:' + Math.max(pct, size ? 2 : 0) + '%"></i></div><small class="pj-muted">' + (size ? 'Usas ' + (pct < 1 ? 'menos del 1 %' : 'el ' + pct + ' %') + ' del espacio · ' + pjNum(size) + ' de ' + pjNum(PJ_MAX) + ' caracteres. En cada mensaje la IA lee lo que más se relaciona con tu pregunta (hasta unas 1.300 palabras, que cuentan en tu límite).' : 'PDF, Word en texto, código, notas… La IA los usa como fuente en cada chat del proyecto.') + '</small>'
    + ((p.files || []).length ? '<ul class="pj-fl">' + p.files.map(f => '<li><span class="pj-fi">' + esc((f.name.split('.').pop() || 'txt').slice(0, 4).toUpperCase()) + '</span><span class="pj-fn"><b>' + esc(f.name) + '</b><small>' + (f.text ? pjNum(f.text.length) + ' caracteres' : 'Guardado en otro equipo') + '</small></span><button type="button" class="pj-fx" data-fdel="' + esc(f.id) + '" aria-label="Quitar ' + esc(f.name) + '">' + PJ_X + '</button></li>').join('') + '</ul>' : '')
    + '<input type="file" id="pjFileIn" multiple hidden></section>'
    + '</aside></div>';
}

/* ---------- acciones ---------- */
PV.addEventListener('input', e => { if (e.target.id === 'pjQ'){ pjQ = e.target.value; pjPaintList(); } });
PV.addEventListener('change', e => {
  if (e.target.id === 'pjSort'){ pjSort = e.target.value; pjPaintList(); }
  if (e.target.id === 'pjFileIn'){ pjAddFiles(pjGet(pjView.id), e.target.files); e.target.value = ''; }
});
PV.addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'pjForm'){
    const n = $('#pjName', PV).value.trim(), d = $('#pjDesc', PV).value.trim();
    if (!n){ $('#pjName', PV).focus(); toast('Ponle un nombre al proyecto.'); return; }
    if (pjView.v === 'edit'){ const p = pjGet(pjView.id); p.name = n; p.desc = d; pjEdit(p); toast('Proyecto guardado.'); pjOpen('page', p.id); return; }
    const p = { id:'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name:n, desc:d, instr:'', files:[], c0:Date.now(), t:Date.now(), u:Date.now(), c:pjs().length };
    pjs().push(p); save(); toast('Proyecto creado. Agrega instrucciones o archivos, o empieza un chat.'); pjOpen('page', p.id); return;
  }
  if (e.target.id === 'pjAsk'){
    const t = $('#pjAskIn', PV).value.trim(), p = pjGet(pjView.id);
    if (!t){ $('#pjAskIn', PV).focus(); return; }
    pjStart(p, t);
  }
});
PV.addEventListener('keydown', e => { if (e.target.id === 'pjAskIn' && e.key === 'Enter' && !e.shiftKey && !e.isComposing && matchMedia('(pointer: fine)').matches){ e.preventDefault(); $('#pjAsk', PV).requestSubmit(); } });
PV.addEventListener('click', async e => {
  const t = e.target.closest('button'); if (!t || !PV.contains(t)) return;
  const p = pjGet(pjView.id), a = t.dataset.pa;
  if (t.dataset.open){ pjOpen('page', t.dataset.open); return; }
  if (t.dataset.star){ const q = pjGet(t.dataset.star); q.star = !q.star; pjEdit(q); if (pjView.v === 'list') pjPaintList(); else pjRender(); return; }
  if (t.dataset.ex){ const x = PJ_EX[+t.dataset.ex]; if (pjView.v !== 'new') pjOpen('new'); $('#pjName', PV).value = x[0]; $('#pjDesc', PV).value = x[1]; $('#pjName', PV).focus(); return; }
  if (t.dataset.k){ const { model, id } = parseKey(t.dataset.k); openThread(model, id); return; }
  if (t.dataset.fdel){ const f = p.files.find(x => x.id === t.dataset.fdel); if (!f || !(await SZ.szConfirm('¿Quitar «' + f.name + '»?', 'La IA ya no lo usará en los chats de este proyecto.', 'Quitar', true))) return; p.files = p.files.filter(x => x !== f); pjEdit(p); pjRender(); return; }
  if (a === 'close'){ pjClose(); return; }
  if (a === 'list'){ pjOpen('list'); return; }
  if (a === 'new'){ pjOpen('new'); return; }
  if (a === 'page'){ pjOpen('page', p.id); return; }
  if (t.id === 'pjArchB'){ pjArch = !pjArch; pjPaintList(); return; }
  if (a === 'menu'){ pjMenuOpen(t, p); return; }
  if (a === 'upload'){ $('#pjFileIn', PV).click(); return; }
  if (a === 'instr'){ pjInline($('#pjInstr', PV), 'Instrucciones', p.instr || '', 8000, 'Por ejemplo: «Responde siempre en español neutro, con viñetas y ejemplos. Soy docente de primaria.»', v => { p.instr = v; pjEdit(p); toast(v ? 'Instrucciones guardadas.' : 'Instrucciones borradas.'); }); return; }
  if (a === 'paste'){ pjInline($('#pjFiles', PV), 'Pegar texto', '', PJ_MAX, 'Pega aquí notas, un artículo, datos de tu negocio…', v => { if (!v) return; pjAddText(p, 'Texto ' + ((p.files || []).filter(f => /^Texto \d+/.test(f.name)).length + 1) + '.txt', v); }, true); return; }
});
function pjInline(card, title, val, max, ph, done, named){
  card.innerHTML = '<div class="pj-ch"><h3>' + esc(title) + '</h3></div><textarea class="pj-ta" rows="7" maxlength="' + max + '" placeholder="' + esc(ph) + '"></textarea><div class="pj-acts sm"><button type="button" class="lnk" data-x>Cancelar</button><button type="button" class="btn sm" data-ok>Guardar</button></div>';
  const ta = $('.pj-ta', card); ta.value = val; ta.focus();
  $('[data-x]', card).addEventListener('click', e => { e.stopPropagation(); pjRender(); });
  $('[data-ok]', card).addEventListener('click', e => { e.stopPropagation(); done(ta.value.trim()); pjRender(); });
}
function pjRoom(p){ return PJ_MAX - pjSize(p); }
function pjAddText(p, name, text){
  const room = pjRoom(p); if (room <= 0){ toast('Este proyecto ya está lleno. Quita un archivo para hacer espacio.'); return false; }
  const cut = text.length > room;
  (p.files || (p.files = [])).push({ id:'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name:String(name).slice(0, 120), text:cut ? text.slice(0, room) : text });
  pjEdit(p); if (cut) toast('«' + name + '» era muy largo: guardé lo que cabe en el proyecto.');
  return true;
}
async function pjAddFiles(p, list){
  if (!p) return;
  for (const file of [...list]){
    try{
      let t;
      if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf'){ toast('Leyendo «' + file.name + '»…'); const lib = await loadPdf(), pdf = await lib.getDocument({ data:new Uint8Array(await file.arrayBuffer()) }).promise; t = ''; for (let i = 1; i <= Math.min(pdf.numPages, 300) && t.length < PJ_MAX; i++){ const tc = await (await pdf.getPage(i)).getTextContent(); t += '\n--- página ' + i + ' ---\n' + tc.items.map(x => x.str).join(' '); } if (t.replace(/--- página \d+ ---/g, '').trim().length < 20) throw new Error('«' + file.name + '» parece escaneado (sin texto que leer).'); }
      else if (TEXTX.test(file.name) || /^text\//.test(file.type) || file.type === 'application/json') t = await file.text();
      else if (OFFX.test(file.name)) t = await readOffice(file);   /* v3.4 · Word, Excel y PowerPoint también */
      else { const f = {}; toast('Leyendo «' + file.name + '»…'); await readAny(file, f, { textOnly:true }); t = f.text || fichaTxt(file); }   /* v3.8 · cualquier otro archivo: zip, RTF, EPUB, .doc viejo… */
      if (!pjAddText(p, file.name, t.trim())) break;
    }catch(err){ toast(err.message || 'No pude leer «' + file.name + '».'); }
  }
  if (pjView.id === p.id && !PV.hidden) pjRender();
}
function pjStart(p, text){
  pjClose(); pjNew0(); st().curProj = p.id; p.t = Date.now(); save(); pjCrumb();
  inp.value = text; inp.dispatchEvent(new Event('input', { bubbles:true }));
  if (Object.keys(busy).length) return;
  sendBtn.click();
}

/* ---------- menú «⋯» del proyecto y «mover a un proyecto» en la lista de chats ---------- */
let pjMenu = null;
function pjMenuClose(){ if (!pjMenu) return; const o = pjMenu.o; pjMenu.el.remove(); pjMenu = null; if (o){ o.setAttribute('aria-expanded', 'false'); } }
function pjMenuAt(anchor, items){
  pjMenuClose();
  const m = document.createElement('div'); m.className = 'pj-menu'; m.setAttribute('role', 'menu');
  m.innerHTML = items.map((x, i) => x ? '<button type="button" role="menuitem" data-i="' + i + '"' + (x.danger ? ' class="dg"' : '') + (x.on ? ' aria-checked="true"' : '') + '>' + (x.ic || '') + '<span></span></button>' : '<hr>').join('');
  items.forEach((x, i) => { if (x) $('[data-i="' + i + '"] span', m).textContent = x.label; });
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight;
  m.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + 'px';
  m.style.top = (r.bottom + h + 8 > innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6) + 'px';
  anchor.setAttribute('aria-expanded', 'true'); pjMenu = { el:m, o:anchor };
  m.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; const x = items[+b.dataset.i]; pjMenuClose(); x.go(); });
  requestAnimationFrame(() => { const f = $('button', m); if (f) f.focus(); });
}
document.addEventListener('pointerdown', e => { if (pjMenu && !pjMenu.el.contains(e.target) && !pjMenu.o.contains(e.target)) pjMenuClose(); }, true);
function pjMenuOpen(anchor, p){
  pjMenuAt(anchor, [
    { label:'Editar nombre y descripción', go:() => pjOpen('edit', p.id) },
    { label:p.arch ? 'Sacar de archivados' : 'Archivar', go:() => { p.arch = !p.arch; pjEdit(p); toast(p.arch ? 'Proyecto archivado. Lo encuentras en «Archivados».' : 'El proyecto volvió a tu lista.'); pjRender(); } },
    null,
    { label:'Borrar el proyecto', danger:true, go:async () => {
      if (!(await SZ.szConfirm('¿Borrar «' + p.name + '»?', 'Se borran sus instrucciones y archivos. Sus chats no se borran: quedan en tu lista de chats.', 'Borrar proyecto', true))) return;
      st().projects = pjs().filter(x => x !== p); st().pjDel = [...(st().pjDel || []), p.id].slice(-200);
      Object.keys(pjOf()).forEach(k => { if (pjOf()[k] === p.id) delete pjOf()[k]; });
      if (st().curProj === p.id) st().curProj = '';
      save(); toast('Proyecto borrado.'); pjOpen('list'); renderChats(false); pjCrumb();
    } }
  ]);
}
/* en tu lista de chats: la etiqueta del proyecto y el botón para moverlo */
const pjChats0 = renderChats;
renderChats = function(){
  pjChats0.apply(this, arguments);
  $$('#thList .thi').forEach(it => {
    if ($('.thpj-m', it)) return;
    const p = pjGet(pjOf()[it.dataset.k]);
    if (p){ const tg = document.createElement('span'); tg.className = 'thpj'; tg.style.setProperty('--pc', pjColor(p)); tg.innerHTML = PJ_ICO + '<span></span>'; $('span', tg).textContent = p.name; const tt = $('.tt', it); if (tt) tt.appendChild(tg); }
    const b = document.createElement('button'); b.type = 'button'; b.className = 'thpj-m'; b.setAttribute('aria-label', 'Mover a un proyecto'); b.setAttribute('aria-haspopup', 'menu'); b.innerHTML = PJ_ICO;
    const ren = $('[data-ren]', it); if (ren) ren.before(b); else it.appendChild(b);
  });
};
$('#thList').addEventListener('click', e => {
  const b = e.target.closest('.thpj-m'); if (!b) return;
  e.stopPropagation(); e.preventDefault();
  const k = b.closest('.thi').dataset.k, cur = pjOf()[k];
  const items = pjs().filter(p => !p.arch).sort((a, c) => (c.t || 0) - (a.t || 0)).slice(0, 8).map(p => ({ label:p.name, on:p.id === cur, ic:'<i class="pjdot" style="--pc:' + pjColor(p) + '"></i>', go:() => { pjOf()[k] = p.id; p.t = Date.now(); save(); renderChats(false); pjCrumb(); toast('Chat movido a «' + p.name + '».'); } }));
  if (cur) items.push(null, { label:'Sacar del proyecto', go:() => { delete pjOf()[k]; save(); renderChats(false); pjCrumb(); toast('El chat ya no está en un proyecto.'); } });
  items.push(null, { label:'Nuevo proyecto…', ic:PJ_PLUS, go:() => pjOpen('new') });
  pjMenuAt(b, items);
}, true);
pjCrumb();
if (params.get('proyectos') != null) pjOpen('list');
