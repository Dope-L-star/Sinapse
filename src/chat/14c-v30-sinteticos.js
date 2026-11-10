/* ---------- v3.0 · Sintéticos, desde v4.6 «Obras» (como los artefactos de Claude) ----------
   Junta todo lo que la IA creó en tus chats (páginas, juegos, SVG, código, documentos) en una sola lista.
   Tocar uno lo abre al lado; «Ir al chat» te lleva a la conversación donde nació. Se arma al abrir la lista, nada se guarda aparte. */
const SYN_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.2 5.1L19.5 9l-4 3.7 1.1 5.4L12 15.5 7.4 18.1l1.1-5.4-4-3.7 5.3-.9z" opacity=".35"/><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M9 9l-2.5 3L9 15M15 9l2.5 3L15 15"/></svg>';
function synAll(){
  const out = [], box = document.createElement('div');
  allThreads().forEach(th => {
    st().chats[th.k].forEach((m, i) => {
      if (m.role !== 'assistant' || !/```/.test(m.content || '')) return;
      box.innerHTML = md(m.content);
      const files = $$('pre', box).map(pre => [cnvMeta(pre), pre]).filter(([M, pre]) => isFile(M, pre));
      /* v4.1 · una página de varios archivos sale como UN Sintético (se abre funcionando, con sus pestañas); el resto, archivo por archivo */
      const P = webProject(files.map(x => x[0]));
      if (P) out.push({ M:{ name:P.title || P.entry, label:'web', ext:'html', lines:P.files.length, key:'web:' + P.entry }, P, th, i });
      files.forEach(([M]) => { if (P && WEB_EXT.has(M.ext)) return; out.push({ M, th, i, sibs:() => { box.innerHTML = md(m.content); return $$('pre', box).map(cnvMeta).filter(x => x.name !== M.name); } }); });
    });
  });
  /* la última versión de cada archivo de cada chat (si la IA lo arregló, sale el arreglado) */
  const seen = new Set();
  return out.reverse().filter(x => { const k = x.th.k + '|' + (x.M.key || x.M.name); if (seen.has(k)) return false; seen.add(k); return true; });
}
const SV = document.createElement('section'); SV.className = 'synv'; SV.id = 'synv'; SV.hidden = true; SV.setAttribute('aria-label', 'Obras'); SV.tabIndex = -1;
$('#shell .main').appendChild(SV);
let synList = [], synTab = 'mine', synQ = '';
/* v4.6 · «Obras» (antes Sintéticos) con el estilo de la página de Artefactos de Claude: título grande, «Tus obras» / «Inspiración»,
   buscador, botón «Crear nueva obra» y una cuadrícula de tarjetas con su vista en miniatura (el código, el dibujo o la página tal cual). */
const OBR_ICO = {
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  find:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>',
  chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>'
};
/* ideas para empezar (pestaña «Inspiración»): al tocar una se abre un chat nuevo con el pedido ya escrito, en tu idioma */
const OBR_IDEAS = [
  { k:'web', t:['Página de un café', 'A café website'], p:['Hazme una página web de un café con menú, horarios y contacto, bonita y que se vea bien en el celular.', 'Make me a café website with a menu, opening hours and contact details, good-looking and mobile friendly.'], x:['Página web', 'Website'] },
  { k:'calc', t:['Calculadora bonita', 'A pretty calculator'], p:['Hazme una calculadora bonita con tema oscuro que funcione con el teclado.', 'Make me a pretty dark-theme calculator that also works with the keyboard.'], x:['Herramienta', 'Tool'] },
  { k:'game', t:['Juego de la serpiente', 'Snake game'], p:['Hazme el juego de la serpiente para jugar con las flechas, con puntaje y reinicio.', 'Make me the snake game, played with the arrow keys, with a score and a restart button.'], x:['Juego', 'Game'] },
  { k:'svg', t:['Logo en SVG', 'A logo in SVG'], p:['Dibuja un logo sencillo en SVG para una tienda de plantas, con dos colores.', 'Draw a simple SVG logo for a plant shop, using two colors.'], x:['Dibujo', 'Drawing'] },
  { k:'todo', t:['Lista de tareas', 'To-do list'], p:['Crea una app de lista de tareas que guarde lo que escribo en el navegador.', 'Create a to-do list app that saves what I write in the browser.'], x:['Aplicación', 'App'] },
  { k:'cv', t:['Mi currículum', 'My résumé'], p:['Redacta mi currículum en un documento limpio; pregúntame lo que necesites saber de mí.', 'Write my résumé as a clean document; ask me whatever you need to know about me.'], x:['Documento', 'Document'] }
];
const OBR_HUE = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
/* la miniatura: lo que de verdad hay dentro (el título de la página, el dibujo, las primeras líneas del código o del texto) */
function obrThumb(x){
  const hue = OBR_HUE(x.P ? x.P.entry : x.M.name + x.th.k);
  let inner;
  if (x.P){
    const pg = x.P.files.find(f => f.path === x.P.entry) || x.P.files[0], h1 = ((pg.text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || x.P.title || x.P.entry).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 44);
    inner = '<span class="th-web"><i></i><i></i><i></i><b>' + esc(h1) + '</b><u></u><u></u><u class="s"></u></span>';
  } else if (x.M.ext === 'svg' && /<svg/i.test(x.M.text)){
    inner = '<img class="th-svg" alt="" loading="lazy" decoding="async" src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(x.M.text.replace(/<svg(?![^>]*xmlns)/i, '<svg xmlns="http://www.w3.org/2000/svg"')) + '">';
  } else if (/^(md|txt)$/.test(x.M.ext)){
    inner = '<span class="th-doc">' + esc(x.M.text.replace(/[#*_`>]/g, '').slice(0, 300)) + '</span>';
  } else {
    inner = '<pre class="th-code">' + esc(x.M.text.split('\n').filter(l => l.trim()).slice(0, 10).map(l => l.slice(0, 46)).join('\n')) + '</pre>';
  }
  return '<span class="syn-th notr" style="--h:' + hue + '" aria-hidden="true">' + inner + '<em class="th-k">' + esc(x.P ? 'WEB' : String(x.M.ext || '').toUpperCase().slice(0, 5)) + '</em></span>';
}
function obrCard(x, n){
  const en = SZ.lang() === 'en';
  const sub = x.P ? '<span class="notr">' + esc(webTxt(en).kind + ' · ' + webTxt(en).files(x.P.files.length)) + '</span>' : esc(x.M.label) + ' · ' + x.M.lines + (en ? (x.M.lines === 1 ? ' line' : ' lines') : (x.M.lines === 1 ? ' línea' : ' líneas'));
  const name = x.P ? (x.P.title || x.P.entry) : x.M.name;
  return '<div class="syn-w' + (x.P ? ' web' : '') + '" data-q="' + esc((name + ' ' + x.th.title + ' ' + x.M.label).toLowerCase()) + '"><button type="button" class="syn-c" data-sn="' + n + '">' + obrThumb(x)
    + '<span class="syn-m"><b class="notr">' + esc(name) + '</b><small>' + sub + '</small><small><span class="notr">' + esc(x.th.title) + '</span>' + (x.th.t ? ' · ' + pjAgo(x.th.t) : '') + '</small></span></button>'
    + '<button type="button" class="syn-go" data-sg="' + n + '" title="Ir al chat donde nació">' + OBR_ICO.chat + 'Ir al chat</button></div>';
}
function synPaint(){
  const en = SZ.lang() === 'en', mine = synTab === 'mine';
  const tab = (id, l) => '<button type="button" role="tab" class="obr-tab" data-ot="' + id + '" aria-selected="' + (synTab === id) + '">' + l + '</button>';
  const body = mine
    ? (synList.length
      ? '<div class="syn-l">' + synList.map(obrCard).join('') + '</div><p class="obr-none" hidden>No encontré obras con eso.</p>'
      : '<div class="pj-empty"><span class="pj-big">' + SYN_ICO + '</span><b>Aún no hay obras</b><p>Pídele a la IA una página, un juego o un dibujo (por ejemplo «hazme una calculadora bonita») y aparecerá aquí.</p><button type="button" class="obr-new" data-ot="insp">Ver ideas para empezar</button></div>')
    : '<div class="syn-l obr-ideas">' + OBR_IDEAS.map((d, i) => '<button type="button" class="obr-idea notr" data-ip="' + i + '" style="--h:' + OBR_HUE(d.k) + '"><span class="th-k">' + esc(d.x[en ? 1 : 0]) + '</span><b>' + esc(d.t[en ? 1 : 0]) + '</b><small>' + esc(d.p[en ? 1 : 0]) + '</small></button>').join('') + '</div>';
  SV.innerHTML = '<div class="pj-in obr"><div class="pj-bar"><span></span><button type="button" class="pj-close" data-sa="close">Volver al chat' + PJ_X + '</button></div>'
    + '<header class="obr-h"><div><h1>Obras</h1><p>Todo lo que la IA creó en tus chats: páginas, juegos, dibujos, código y documentos. Tócalo y se abre al lado.</p></div><button type="button" class="obr-new" data-sa="new">' + OBR_ICO.plus + 'Crear nueva obra</button></header>'
    + '<div class="obr-tools"><div class="obr-tabs" role="tablist" aria-label="Obras">' + tab('mine', 'Tus obras') + tab('insp', 'Inspiración') + '</div>'
    + (mine && synList.length ? '<label class="obr-s">' + OBR_ICO.find + '<input type="search" class="obr-q" placeholder="Buscar obras…" aria-label="Buscar obras" autocomplete="off" spellcheck="false"></label>' : '') + '</div>'
    + body + '</div>';
  const q = $('.obr-q', SV); if (q && synQ){ q.value = synQ; obrFilter(); }
}
function obrFilter(){
  const q = ($('.obr-q', SV) || {}).value || ''; synQ = q;
  const k = q.trim().toLowerCase(); let n = 0;
  $$('.syn-w', SV).forEach(w => { const on = !k || w.dataset.q.includes(k); w.hidden = !on; if (on) n++; });
  const none = $('.obr-none', SV); if (none) none.hidden = n > 0;
}
function synOpen(){
  try{ pjClose(); }catch(e){}
  try{ closeChatsSheet(); }catch(e){}
  SV.hidden = false; document.body.classList.add('synon'); $('#railSyn').setAttribute('aria-pressed', 'true');
  synList = synAll(); synTab = 'mine'; synQ = '';
  synPaint();
  SV.scrollTop = 0; SV.focus({ preventScroll:true });
}
function synClose(){ if (SV.hidden) return; SV.hidden = true; document.body.classList.remove('synon'); $('#railSyn').setAttribute('aria-pressed', 'false'); }
SV.addEventListener('input', e => { if (e.target.classList.contains('obr-q')) obrFilter(); });
SV.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.sa === 'close'){ synClose(); return; }
  if (b.dataset.sa === 'new'){ newChat(); setTimeout(() => inp.focus(), 80); return; }
  if (b.dataset.ot){ synTab = b.dataset.ot; synPaint(); const t = $('.obr-tab[aria-selected="true"]', SV); if (t) t.focus({ preventScroll:true }); return; }
  if (b.dataset.ip != null){ const d = OBR_IDEAS[+b.dataset.ip]; if (!d) return; newChat(); setTimeout(() => { inp.value = d.p[SZ.lang() === 'en' ? 1 : 0]; inp.dispatchEvent(new Event('input', { bubbles:true })); inp.focus(); }, 90); return; }
  if (b.dataset.sg != null){ const x = synList[+b.dataset.sg]; if (x) openThread(x.th.model, x.th.id); return; }
  if (b.dataset.sn != null){ const x = synList[+b.dataset.sn]; if (x && x.P) webOpen(x.P, { tab:'prev' }); else if (x) openCanvas(x.M, x.sibs(), canPreview(x.M) ? 'prev' : 'code'); }
});
SZ.onLang(() => { if (!SV.hidden) synPaint(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !SV.hidden && !cvEl && !document.querySelector('.szm.on')) synClose(); });
{
  const rb = document.createElement('button'); rb.type = 'button'; rb.className = 'rbtn'; rb.id = 'railSyn'; rb.dataset.tip = 'Obras'; rb.style.setProperty('--i', '2');
  rb.innerHTML = SYN_ICO + '<span class="rl">Obras</span>'; rb.setAttribute('aria-label', 'Obras'); rb.setAttribute('aria-pressed', 'false');
  ($('#railProj') || $('#rail [data-r="new"]')).after(rb);
  rb.addEventListener('click', () => SV.hidden ? synOpen() : synClose());
  const cb = document.createElement('button'); cb.type = 'button'; cb.className = 'cnew cproj csyn'; cb.id = 'cSyn';
  cb.innerHTML = SYN_ICO + 'Obras';
  ($('#cProj') || $('#cNew')).after(cb);
  cb.addEventListener('click', synOpen);
}
/* abrir un proyecto, un chat o uno nuevo cierra la lista */
const synPj0 = pjOpen; pjOpen = function(){ synClose(); return synPj0.apply(this, arguments); };
const synNew0 = newChat; newChat = function(){ synClose(); return synNew0.apply(this, arguments); };
const synOT0 = openThread; openThread = function(){ synClose(); return synOT0.apply(this, arguments); };
