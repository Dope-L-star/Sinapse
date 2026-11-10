/* ===== v2.6 · cada nombre propio se explica solo: pasas el mouse (o lo tocas) y dice qué es en pocas palabras.
   Se marca la primera vez que aparece en cada sección; los títulos, botones y enlaces quedan como están.
   Va antes que todo: la escritura letra por letra parte el texto en letras sueltas y ya no se podría encontrar la palabra. ===== */
(() => {
const DEF = {
  'Sonyx':     SZ.t('gl.0'),
  'Apex': SZ.t('gl.1'),
  'Sona':     SZ.t('gl.2'),
  'EnerX':         SZ.t('gl.3'),
  'Quoryn':    SZ.t('gl.4'),
  'Puter':         SZ.t('gl.5'),
  'IAs conectadas':SZ.t('gl.6')
};
const words = Object.keys(DEF).sort((a, b) => b.length - a.length);
const rx = new RegExp('(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ")(?:'s)?", 'g');
const SKIP = 'h1,h2,h3,a,button,summary,label,input,textarea,.term,#szRoam,.hub,.band,.ready,.v24foot';
document.querySelectorAll('main > section').forEach(sec => {
  const done = new Set(), walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest(SKIP) || !n.nodeValue.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(n => {
    const t = n.nodeValue; rx.lastIndex = 0; let m, last = 0, frag = null;
    while ((m = rx.exec(t))){
      const w = m[1]; if (done.has(w)) continue; done.add(w);
      frag = frag || document.createDocumentFragment();
      frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      const s = document.createElement('span'); s.className = 'term'; s.tabIndex = 0; s.dataset.def = DEF[w]; s.setAttribute('aria-description', DEF[w]); s.textContent = m[0];
      frag.appendChild(s); last = m.index + m[0].length;
    }
    if (frag){ frag.appendChild(document.createTextNode(t.slice(last))); n.replaceWith(frag); }
  });
});
})();
(() => {
'use strict';
const { root, $, $$, clamp, fmt, reduce, today, sleepRaw, esc, est, ico, zWord, API, MANUAL, ALL, byId, save, total, addUsage, toast, hydrateIcons, countTo, charify, typeIn, showAll, S, coins } = SZ;
const st = () => SZ.state;
root.classList.add('js', 'lock');

/* ---------- piezas fijas ---------- */
$('#navWord').innerHTML = zWord('Synth');
$('#corner').innerHTML = '<svg viewBox="0 0 24 24">' + SZ.ICONS.claude('#d9805f', '#d9805f') + '</svg>';
$('#chips').innerHTML = ALL.filter(p => p.id === 'synthz' || p.id === 'puter').map((p, i) => '<span class="chip" style="--i:' + i + '">' + ico(p) + p.name + '</span>').join('');
$('#track').innerHTML = Array(4).fill('<div class="set">' + [['ChatGPT', 'openai'], ['Gemini', 'google'], ['Claude', 'anthropic'], ['Llama', 'meta-llama'], ['Mistral', 'mistralai'], ['DeepSeek', 'deepseek'], ['Qwen', 'qwen'], ['Grok', 'x-ai'], ['Kimi', 'moonshotai'], ['Gemma', 'gemma'], ['Puter', 'puter']].map(([n, v]) => '<span class="bi">' + SZ.glassIcon({ id:v, vendor:v === 'gemma' ? 'google' : v, name:n }, 'xs') + n + '</span>').join('') + '</div>').join('');
hydrateIcons();

/* ---------- escritura al entrar en pantalla ---------- */
const typeIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(async en => {
  if (!en.isIntersecting) return;
  const el = en.target; typeIO.unobserve(el);
  const after = el.dataset.after && $(el.dataset.after);
  if (after && after._typing) await after._typing;
  typeIn(el, { cps: +el.dataset.cps || 90, max: 3 });
}), { threshold:.4 }) : null;
function armType(el){
  if (!el || el._armed) return; el._armed = true; charify(el);
  if (typeIO) typeIO.observe(el); else showAll(el);
}
const armTypes = scope => $$('[data-type]', scope || document).forEach(armType);

/* ---------- aparición de bloques ---------- */
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return;
  const el = en.target; el.classList.add('in'); io.unobserve(el);
  if (el.id === 'howMeasure'){ const f = $('#howFace'); if (f) f.innerHTML = SZ.face('senalando', 64); }
}), { threshold:.15, rootMargin:'0px 0px -6% 0px' }) : null;
function observeAll(){
  $$('[data-stagger]').forEach(c => [...c.children].forEach((ch, i) => { ch.setAttribute('data-reveal', ''); ch.style.setProperty('--d', (i * .1) + 's'); }));
  $$('[data-reveal]').forEach(el => { if (el.classList.contains('in')) return; if (io) io.observe(el); else el.classList.add('in'); });
}

/* ---------- tarjetas de conexión ---------- */
const eyeSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
function setStatus(card, text, cls){ const s = $('[data-st]', card); s.textContent = text; s.className = 'status ' + (cls || ''); }
function szCard(){
  const q = SZ.SZQ, on = q.on !== false, left = Math.max(0, (q.limit || 20000) - (q.used || 0));
  return '<article class="card" data-id="synthz" style="--c:#e6b65f"><div class="card-top">' + ico(byId('synthz')) + '<h3>' + SZ.t('ix.conn') + '</h3><span class="status ' + (on ? 'ok' : '') + '" data-st>' + SZ.t(on ? 'ix.stOn' : 'ix.stOff') + '</span></div><p class="desc">' + SZ.t('ix.connDesc') + '</p>'
    + SZ.limBar({ small:false }) + '<div class="actions"><button class="btn sm" data-szgo type="button">' + SZ.t('ixa.abrirsynthflow') + '</button></div></article>';
}
function paintSzCard(){ const c = $('#cards [data-id="synthz"]'); if (!c) return; c.outerHTML = szCard(); const b = $('#cards [data-szgo]'); if (b) b.addEventListener('click', () => { launchAI = 'synthz'; openChat(); }); }
addEventListener('synthz-szq', () => { paintSzCard(); updateTotals(); renderLaunch(); try{ renderUsage(); }catch(e){} });
function renderCards(){
  const wrap = $('#cards');
  wrap.innerHTML = szCard() + API.filter(p => false).map(p => `   /* v1.3: ya no se muestran cajas de llaves (OpenRouter, Groq…) */
    <article class="card" data-id="${p.id}" style="--c:${p.c}">
      <div class="card-top">${ico(p)}<h3 data-type data-cps="20">${p.name}</h3><span class="status" data-st>Sin llave</span></div>
      <p class="desc" data-type data-cps="130">${p.desc}</p>
      <label class="field"><input type="text" data-sec="1" data-key placeholder="Pega tu llave aquí" autocomplete="off" data-lpignore="true" data-1p-ignore data-form-type="other" spellcheck="false"><button type="button" class="eye" data-eye aria-label="Mostrar u ocultar llave">${eyeSvg}</button></label>
      <div class="actions">
        <button class="btn sm" data-verify>Verificar</button>
        <button class="btn sm ghost" data-refresh>Actualizar la lista de IA</button>
        <a class="lnk" href="${p.keyUrl}" target="_blank" rel="noopener noreferrer">Conseguir llave gratis</a>
      </div>
    </article>`).join('');
  const szb = $('[data-szgo]', wrap); if (szb) szb.addEventListener('click', () => { launchAI = 'synthz'; openChat(); });
  $$('.card', wrap).forEach(card => {
    if (card.dataset.id === 'synthz') return;
    const p = byId(card.dataset.id), inp = $('[data-key]', card);
    inp.value = st().keys[p.id] || '';
    setStatus(card, st().keys[p.id] ? 'Guardada' : 'Sin llave');
    inp.addEventListener('input', () => {
      const v = inp.value.trim();
      if (v) st().keys[p.id] = v; else delete st().keys[p.id];
      save(); setStatus(card, v ? 'Guardada' : 'Sin llave'); renderLaunch(); updateTotals();
    });
    $('[data-eye]', card).addEventListener('click', () => { inp.type = inp.type === 'password' ? 'text' : 'password'; });
    $('[data-verify]', card).addEventListener('click', async e => {
      const b = e.currentTarget; b.disabled = true; setStatus(card, 'Verificando…');
      try{ const n = await SZ.verify(p); setStatus(card, 'Lista, ' + n + ' modelos', 'ok'); toast(p.name + ' conectada.'); try{ const r = $('[data-verify]', card).getBoundingClientRect(); SZ.burst && SZ.burst(r.left + r.width/2, r.top + r.height/2, ['#8fb0ff','#c9566c','#ff8f7a','#7ee0b5'], 22); }catch(_){} setTimeout(() => { if (!leaving) openChat(); }, 1100); }
      catch(err){ setStatus(card, 'Error', 'bad'); toast(err.message); }
      b.disabled = false;
    });
    $('[data-refresh]', card).addEventListener('click', async e => {
      const b = e.currentTarget; b.disabled = true;
      try{ const n = await SZ.refreshModels(p); setStatus(card, 'Lista, ' + n + ' modelos', 'ok'); toast('Modelos de ' + p.name + ' actualizados.'); }
      catch(err){ toast(err.message); }
      b.disabled = false;
    });
  });

  const ext = $('#ext');
  ext.innerHTML = MANUAL.map(p => `
    <article class="card" data-id="${p.id}" style="--c:${p.c}">
      <div class="card-top">${ico(p)}<h3 data-type data-cps="20">${p.name}</h3><span class="status">Registro manual</span></div>
      <p class="desc" data-type data-cps="130">${p.desc}</p>
      <label class="field"><textarea rows="2" data-log placeholder="Pega un texto o escribe un número de mensajes"></textarea></label>
      <div class="actions">
        <button class="btn sm" data-add>Sumar al consumo</button>
        <a class="lnk" href="${p.site}" target="_blank" rel="noopener noreferrer">Abrir ${p.siteName}</a>
        ${p.id === 'chatgpt' ? '<button class="btn sm ghost" data-oss>Probar gpt-oss en Sonyx</button>' : ''}
      </div>
    </article>`).join('');
  $$('.card', ext).forEach(card => {
    const p = byId(card.dataset.id), ta = $('[data-log]', card);
    $('[data-add]', card).addEventListener('click', () => {
      const v = ta.value.trim(); if (!v){ toast('Escribe un texto o un número de mensajes.'); return; }
      const n = /^\d[\d.,\s]*$/.test(v) ? parseInt(v.replace(/\D/g, ''), 10) : est(v);
      addUsage(p.id, n, 0, false); ta.value = ''; toast('Sumé ' + coins(n) + ' a ' + p.name + '.');
    });
    const oss = $('[data-oss]', card);
    if (oss) oss.addEventListener('click', () => {
      const l = st().models.openrouter || (st().models.openrouter = API[0].models.slice());
      const free = l.find(m => /gpt-oss/.test(m)) || 'openai/gpt-oss-20b:free';
      if (!l.includes(free)) l.push(free);
      st().model.openrouter = free; save(); launchAI = 'openrouter'; renderLaunch(); openChat();
    });
  });
  $$('.card').forEach(card => card.addEventListener('pointermove', e => {
    const b = card.getBoundingClientRect();
    card.style.setProperty('--px', ((e.clientX - b.left) / b.width * 100) + '%'); card.style.setProperty('--py', ((e.clientY - b.top) / b.height * 100) + '%');
  }));
  armTypes(wrap); armTypes(ext);
}

/* ---------- lanzador: abre el chat en otra página con una expansión suave ---------- */
let launchAI = 'synthz', leaving = false;
function placePill(seg){
  const a = $('[aria-selected="true"]', seg), pill = $('.pill', seg);
  if (!a || !pill) return;
  pill.style.width = a.offsetWidth + 'px'; pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
}
function renderLaunch(){
  const seg = $('#launchSeg');
  $$('button', seg).forEach(b => b.remove());
  const items = [{ id:'synthz', label:SZ.t('ix.046'), p:byId('synthz') }];
  items.forEach(it => {
    const b = document.createElement('button');
    b.setAttribute('role', 'tab'); b.dataset.id = it.id;
    b.setAttribute('aria-selected', String(it.id === launchAI));
    if (it.p && st().keys[it.id]) b.classList.add('has');
    b.innerHTML = (it.p ? ico(it.p) : '') + it.label;
    b.addEventListener('click', () => { launchAI = it.id; renderLaunch(); });
    seg.appendChild(b);
  });
  placePill(seg);
  const p = byId(launchAI), hint = $('#launchHint');
  if (launchAI === 'cmp'){
    const n = API.filter(x => st().keys[x.id]).length;
    hint.textContent = n ? SZ.t(n === 1 ? 'ix.hint1' : 'ix.hintN', { n }) : SZ.t('ix.hint0');
  } else hint.textContent = SZ.t(SZ.SZQ.on !== false ? 'ix.hintOn' : (window.puter && puter.auth && puter.auth.isSignedIn()) ? 'ix.hintPu' : 'ix.hintOff');
  $('#launch').style.setProperty('--lc', p ? p.c + '2e' : 'rgba(184,196,255,.2)');
}
function expandTo(card, href, color){ return SZ.portalOut(href); }
function expandToOld(card, href, color){
  const r = card.getBoundingClientRect(), ov = document.createElement('div');
  ov.className = 'expand'; ov.style.setProperty('--lc', color + '55');
  ov.style.left = r.left + 'px'; ov.style.top = r.top + 'px'; ov.style.width = r.width + 'px'; ov.style.height = r.height + 'px'; ov.style.borderRadius = '30px';
  document.body.appendChild(ov); root.classList.add('leaving');
  let done = false; const go = () => { if (done) return; done = true; location.href = href; };
  const a = ov.animate([
    { left:r.left + 'px', top:r.top + 'px', width:r.width + 'px', height:r.height + 'px', borderRadius:'30px' },
    { left:'0px', top:'0px', width:innerWidth + 'px', height:innerHeight + 'px', borderRadius:'0px' }
  ], { duration:950, easing:'cubic-bezier(.77,0,.18,1)', fill:'forwards' });
  a.onfinish = () => setTimeout(go, 60);
  setTimeout(go, 1500);
}
function openChat(from){
  if (leaving) return; leaving = true;
  const box = from && from.nodeType ? from : $('#launch'), inp = box.id === 'heroAsk' ? $('#heroInp') : $('#launchInp');
  const q = inp.value.trim(), params = new URLSearchParams({ from:'home' });
  if (launchAI === 'cmp') params.set('mode', 'cmp'); else params.set('ai', launchAI);
  if (q) params.set('q', q);
  try{ if (q) sessionStorage.setItem('synthz:q', JSON.stringify({ q, t:Date.now() })); }catch(e){}
  const p = byId(launchAI);
  expandTo(box, 'chat.html?' + params.toString(), p ? p.c : '#b8c4ff');
}
$('#launchGo').addEventListener('click', () => openChat());
/* v2.6: en la portada misma se puede preguntar: el cuadro se agranda y SynthFlow abre con la pregunta ya enviada */
const hask = $('#heroAsk');
if (hask){
  hask.addEventListener('submit', e => { e.preventDefault(); if (!$('#heroInp').value.trim()){ $('#heroInp').focus(); hask.classList.remove('nudge'); void hask.offsetWidth; hask.classList.add('nudge'); return; } openChat(hask); });
  /* ideas que se van turnando en el cuadro vacío, para que se vea qué se puede pedir */
  const ideas = () => [SZ.t('ix.hold'), SZ.t('ix.idea1'), SZ.t('ix.idea2'), SZ.t('ix.idea3'), SZ.t('ix.idea4')];
  let ii = 0;
  if (!reduce) setInterval(() => { const i = $('#heroInp'); if (document.hidden || i.value || document.activeElement === i) return; const L = ideas(); ii = (ii + 1) % L.length; i.placeholder = L[ii]; }, 3200);
}

/* pasos que se animan con el scroll */
const hows = $$('.how-card');
function howScroll(){
  const vh = innerHeight;
  hows.forEach(c => {
    const r = c.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (vh * .98 - r.top) / (vh * .3)));
    const q = Math.min(1, Math.max(0, (vh * .85 - r.top) / (vh * .6)));
    c.style.setProperty('--p', p.toFixed(3)); c.style.setProperty('--q', q.toFixed(3));
    if (c.id === 'howMeasure'){ const f = $('#howFace'); if (f && !f.firstChild) f.innerHTML = SZ.face('senalando', 64); }
  });
}
let hsQ = 0; const howQ = () => { if (!hsQ) hsQ = requestAnimationFrame(() => { hsQ = 0; howScroll(); }); };
addEventListener('scroll', howQ, { passive:true }); addEventListener('resize', howQ); howScroll();
const sprog = document.createElement('i'); sprog.id = 'sprog'; document.body.appendChild(sprog);
let spQ = 0; addEventListener('scroll', () => { if (spQ) return; spQ = requestAnimationFrame(() => { spQ = 0; const h = document.documentElement.scrollHeight - innerHeight; sprog.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0).toFixed(4) + ')'; }); }, { passive:true });
const go = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior:'smooth' }); };
SZ.ctxMenu(() => [
  { get label(){ return SZ.t('ix.qOpen'); }, ico:'open', fn:() => openChat() },
  { get label(){ return SZ.t('ix.qUse'); }, ico:'chart', fn:() => go('consumo') },
  { get label(){ return SZ.t('ix.qUp'); }, ico:'up', fn:() => scrollTo({ top:0, behavior:'smooth' }) }, '—',
  { get label(){ return SZ.t('ix.qCfg'); }, ico:'cog', fn:() => SZ.cfgModal() },
  { get label(){ return SZ.t('ix.qHelp'); }, ico:'help', fn:() => openHelp() }]);
document.addEventListener('click', e => { const u = e.target.closest && e.target.closest('a[data-draft]'); if (!u || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); SZ.portalOut(u.getAttribute('href')); });
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href="chat.html"]'); if (!a || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); openChat(); });
$('#launchInp').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing){ e.preventDefault(); openChat(); } });
/* al volver con "atrás" se recarga para mostrar los datos al día */
addEventListener('pageshow', e => {
  if (e.persisted){ location.reload(); return; }
  leaving = false; root.classList.remove('leaving'); $$('.expand,#portal').forEach(x => x.remove()); SZ.S.busy(false); const lg = $('#nav .logo'); if (lg) lg.style.visibility = '';
});

/* ---------- consumo ---------- */
function updateTotals(){
  const on = SZ.SZQ.on !== false;
  $('#limRing').innerHTML = SZ.limRing(18); $('#navTotal').innerHTML = '<span class="nt-l">' + SZ.limShort() + '</span>';
  $('#limPill').className = 'pill-total lim ' + SZ.limLvl();
  $('#heroConn').textContent = SZ.t(on ? 'ix.ready' : 'ix.resting');
  $('#heroTotal').textContent = on ? SZ.limTxt().toLowerCase() : SZ.t('ix.back');
}
function renderUsage(){
  const U = st().usage || {}, d = today();
  $('#bigRing').innerHTML = SZ.limRing(76); $('#bigTotal').textContent = SZ.limShort();
  $('#useSplit').innerHTML = SZ.limBar({ title:SZ.t('ix.conn'), puter:true }); $('#useSync').innerHTML = SZ.syncNote();
  if (!renderUsage._b || Date.now() - renderUsage._b > 60000){ renderUsage._b = Date.now(); SZ.providerBalance().then(b => { $('#useBal').innerHTML = SZ.balanceHtml(b); }); }
  const req = id => ((U[id] || {}).reqDays || {});
  const SRC = [['synthz', SZ.t('ix.conn'), '#e6b65f'], ['puter', 'Puter', '#6fd3d6']];
  const tot = id => (U[id] || {}).requests || 0, max = Math.max(1, ...SRC.map(([id]) => tot(id)));
  $('#rows').innerHTML = SRC.map(([id, n, c], i) => '<div style="--c:' + c + '"><div class="row-h">' + SZ.glassIcon({ id, vendor:id }, 'sm') + '<b>' + n + '</b><small>' + fmt(req(id)[d] || 0) + ' ' + SZ.t('ix.today') + '</small><em>' + fmt(tot(id)) + '</em></div><div class="bar"><i style="--i:' + i + ';--w:' + (tot(id) / max).toFixed(4) + '"></i></div></div>').join('') + '<p class="cnote" style="margin-top:6px">' + SZ.t('ix.totalNote') + '</p>';
  const chart = $('#chart');
  if (!chart.children.length) chart.innerHTML = Array.from({ length:14 }, (_, i) => '<div class="col"><div class="tr"><div class="stack" style="--i:' + i + '"></div></div><span></span></div>').join('');
  const days = [];
  for (let k = 13; k >= 0; k--){ const dt = new Date(); dt.setDate(dt.getDate() - k); days.push(dt.toLocaleDateString('en-CA')); }
  const per = days.map(day => SRC.map(([id, , c]) => ({ c, v:req(id)[day] || 0 })));
  const dmax = Math.max(1, ...per.map(a => a.reduce((s2, x) => s2 + x.v, 0)));
  per.forEach((arr, i) => {
    const col = chart.children[i], sum = arr.reduce((s2, x) => s2 + x.v, 0), st2 = $('.stack', col);
    col.title = days[i] + ': ' + sum + ' ' + SZ.t(sum === 1 ? 'ix.msg1' : 'ix.msgN'); col.classList.toggle('today', i === 13);
    $('span', col).textContent = days[i].slice(8);
    st2.style.setProperty('--h', (sum / dmax * 100).toFixed(1) + '%');
    st2.innerHTML = arr.filter(x => x.v).map(x => '<u style="flex:' + x.v + ' 1 0;background:' + x.c + '"></u>').join('');
  });
  /* «día más activo»: siempre es la barra más alta (si hay empate, el más reciente) */
  const sums = per.map(a => a.reduce((s2, x) => s2 + x.v, 0)), top = sums.lastIndexOf(Math.max(...sums)), k = $('#chartKpi');
  [...chart.children].forEach((c, i) => c.classList.toggle('top', sums[top] > 0 && i === top));
  /* v2.6: la primera vez la gráfica está vacía: se dice qué va a aparecer ahí, en vez de dejar barras invisibles */
  const pan = $('#chartPanel'); if (pan){ pan.classList.toggle('empty', !sums.some(Boolean)); if (!$('.ch-empty', pan)) pan.insertAdjacentHTML('beforeend', '<p class="ch-empty" data-i18n="ix.chEmpty">' + SZ.t('ix.chEmpty') + '</p>'); }
  if (k){ const dl = s => new Date(s + 'T12:00').toLocaleDateString(SZ.lang ? SZ.lang() : 'es', { weekday:'long', day:'numeric' }), all = sums.reduce((a, b) => a + b, 0);
    k.innerHTML = '<span><b>' + fmt(sums[13]) + '</b> ' + SZ.t('ix.today') + '</span><span><b>' + fmt(all) + '</b> ' + SZ.t('ix.in14') + '</span>' + (sums[top] > 0 ? '<span class="ck-top"><b>' + esc(dl(days[top])) + '</b> ' + SZ.t('ix.topDay') + ' · ' + fmt(sums[top]) + ' ' + SZ.t(sums[top] === 1 ? 'ix.msg1' : 'ix.msgN') + '</span>' : '<span>' + SZ.t('ix.noTop') + '</span>'); }
}
SZ.hooks.usage = () => { renderUsage(); updateTotals(); };

$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ ledger:st().ledger, usage:st().usage, chats:st().chats, model:st().model }, null, 2)], { type:'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'synthz-datos-' + today() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(SZ.t('ix.exported'));
});
$('#importBtn').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try{
      const d = JSON.parse(r.result);
      if (!d || typeof d !== 'object') throw new Error('x');
      if (d.ledger || d.usage){ SZ.state.ledger = d.ledger ? SZ.cleanLedger(Object.assign({}, d.ledger, { ep:Date.now() })) : { ep:Date.now(), dev:{ legacy:SZ.legacyRow(d.usage) } }; try{ localStorage.setItem('synthz:ledger', JSON.stringify(SZ.state.ledger)); }catch(_){} SZ.normalize(); }
      if (d.chats) st().chats = SZ.cleanChats(d.chats);
      if (d.model) st().model = SZ.cleanStrMap(d.model);
      save(); renderUsage(); updateTotals(); toast(SZ.t('ix.imported'));
    }catch(err){ toast(SZ.t('ix.badFile')); }
  };
  r.readAsText(f); e.target.value = '';
});
false && $('#resetBtn').addEventListener('click', async () => { if (await SZ.szConfirm('¿Reiniciar tus contadores?', 'Tu historial de uso vuelve a cero.', 'Reiniciar', true)){ SZ.resetUsage(); renderUsage(); updateTotals(); toast('Contadores en cero.'); } });
$('#wipeBtn').addEventListener('click', async () => { if (await SZ.szConfirm(SZ.t('ix.wipeQ'), SZ.t('ix.wipeP'), SZ.t('ix.wipeOk'), true)){ SZ.state = { keys:{}, model:{}, models:{}, usage:{}, chats:{}, fav:[], cmp:[], ledger:{ ep:Date.now(), dev:{} } }; try{ localStorage.setItem('synthz:ledger', JSON.stringify(SZ.state.ledger)); }catch(_){} save(); renderCards(); observeAll(); renderLaunch(); renderUsage(); updateTotals(); toast(SZ.t('ix.wiped')); } });

/* ---------- scroll: solo lo esencial (barra, navegación y sección activa) ---------- */
const bar = $('#progress'), nav = $('#nav');
const secs = ['como', 'modos', 'usos', 'comparar', 'conectar', 'chat', 'consumo', 'faq'].map(id => document.getElementById(id));
let ticking = false;
function update(){
  ticking = false;
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
  nav.classList.toggle('scrolled', y > 30);
  let act = null; secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .45) act = s.id; });
  $$('.navlinks a, .rail .rbtn[data-sec]').forEach(a => a.classList.toggle('on', a.dataset.sec === act));
  S.retarget();
}
addEventListener('scroll', () => { if (!ticking){ ticking = true; requestAnimationFrame(update); } }, { passive:true });
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  e.preventDefault();
  const id = a.getAttribute('href').slice(1), el = document.getElementById(id); if (!el) return;
  scrollTo({ top: id === 'top' ? 0 : el.getBoundingClientRect().top + scrollY - 20, behavior:'smooth' });
});

/* ---------- movimiento ambiental: resplandores que siguen al mouse y cinta continua ---------- */
const blobs = $$('#aurora i'), bf = [[40, 40], [-50, -30], [30, 20], [-30, 25]];
let mxT = 0, myT = 0, mx = 0, my = 0, tx = 0, setW = 0, lastT = performance.now();
const track = $('#track');
/* v2.9: la cinta de nombres solo se mueve mientras se ve; fuera de la pantalla el ciclo se detiene del todo */
let trackOn = true, loopOn = false;
const measure = () => { setW = track.scrollWidth / 4; };
addEventListener('pointermove', e => { mxT = e.clientX / innerWidth - .5; myT = e.clientY / innerHeight - .5; }, { passive:true });
const wakeLoop = () => { if (!loopOn && trackOn && !document.hidden){ loopOn = true; lastT = performance.now(); requestAnimationFrame(loop); } };
if ('IntersectionObserver' in window) new IntersectionObserver(es => { trackOn = es[0].isIntersecting; wakeLoop(); }).observe(track);
document.addEventListener('visibilitychange', wakeLoop);
function loop(now){
  if (!trackOn || document.hidden){ loopOn = false; return; }
  loopOn = true; requestAnimationFrame(loop);
  const dt = Math.min(3, (now - lastT) / 16.67 || 1); lastT = now;
  const k = 1 - Math.pow(1 - .05, dt); mx += (mxT - mx) * k; my += (myT - my) * k;
  if (!reduce && setW > 0){ tx -= .55 * dt; if (tx <= -setW) tx += setW; track.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,0,0)'; }
}

/* ---------- hero: se escribe y luego aparece lo demás ---------- */
let heroDone = false;
async function heroSeq(){
  if (heroDone) return; heroDone = true;
  /* v2.6: Sona saluda mientras se escribe el título (antes aparecía 5 segundos después) */
  $$('.hstage.hero-fade').forEach(el => setTimeout(() => el.classList.add('show'), 350));
  /* v4.0 · quien saltó la intro quiere usar la página ya: el título se escribe rápido */
  const q = introSkipped ? .35 : 1;
  /* v4.0 · la caja de escribir y «Empezar gratis» salen al terminar el título (antes, después de las 3 frases:
     una persona nueva esperaba ~12 s en su primera visita antes de tener algo que tocar) */
  const showCta = () => $$('.hero-fade').forEach((el, i) => setTimeout(() => el.classList.add('show'), i * 160));
  await typeIn($('#h1'), { cps:22 / q, max:2.8 * q });
  showCta();
  /* v2.9: «En sintonía con la IA.» se escribe después del título (antes ya estaba ahí desde el principio) */
  const hs2 = $('.hsub2'); if (hs2) await typeIn(hs2, { cps:40 / q, max:1 * q });
  await typeIn($('#heroSub'), { cps:120 / q, max:2.4 * q });
}

/* ---------- intro: la Z se dibuja y se pinta de arriba-derecha a abajo-izquierda ---------- */
let pulsed = false, introSkipped = false;
const afterHero = () => { if (FIRST && !$('#authm') && !$('#ptour')) setTimeout(welcomed ? pageTour : firstRun, 700); else if (!FIRST && SZ.wasAway()) setTimeout(() => SZ.welcomeBack({ learn:openGuide }), 600); };
function pulseThenHero(){
  if (pulsed) return; pulsed = true;
  try{
    if (reduce || introSkipped){ root.classList.add('pulsed'); heroSeq().then(afterHero); return; }
    const nb = $('#navWord').getBoundingClientRect();
    if (!FIRST) SZ.thud(nb.left + nb.width / 2, nb.top + nb.height / 2);
    setTimeout(() => root.classList.add('pulsed'), 380);
    setTimeout(() => heroSeq().then(afterHero), 1400);
  }catch(e){ root.classList.add('pulsed'); heroSeq().then(afterHero); }
}
function finishIntro(){
  const o = $('#intro'); if (o) o.remove(); SZ.S.busy(false);
  root.classList.add('ready', 'landed'); root.classList.remove('lock');
  update(); pulseThenHero();
}
/* ---------- v3.0 · intro: la S de vidrio de SymphorIA (la de la barra) se dibuja con un cometa de luz, aparece su órbita, se escribe «SymphorIA»
   con la letra de la barra y todo vuela a su lugar arriba. Sin video. Quien ya vino la ve más rápida ---------- */
async function intro(){
  SZ.S.busy(true);
  const ov = $('#intro'), row = $('#intRow'), mk = $('#izMk'), wd = $('#izW'), skipEl = $('#intSkip'), holdBar = $('#intHold');
  let skip = false;
  const k = FIRST ? 1 : .7;
  const sleep = ms => sleepRaw(skip ? 0 : ms * k);
  ov.style.setProperty('--izd', (1.15 * k).toFixed(2) + 's');
    /* se salta manteniendo la barra espaciadora 1,5 s (en pantallas táctiles, manteniendo el dedo) */
  const HOLD = 1500; let holdT0 = 0, holding = false;
  function holdTick(now){
    if (!holding || skip) return;
    const q = clamp((now - holdT0) / HOLD, 0, 1);
    holdBar.style.transform = 'scaleX(' + q + ')';
    if (q >= 1){ skip = introSkipped = true; return; }
    requestAnimationFrame(holdTick);
  }
  const startHold = () => { if (holding) return; holding = true; holdT0 = performance.now(); skipEl.style.opacity = '1'; requestAnimationFrame(holdTick); };
  const stopHold = () => { holding = false; holdBar.style.transform = 'scaleX(0)'; };
  addEventListener('keydown', e => { if (e.code === 'Space' && $('#intro')){ e.preventDefault(); if (!e.repeat) startHold(); } });
  addEventListener('keyup', e => { if (e.code === 'Space') stopHold(); });
  if (matchMedia('(pointer: coarse)').matches){ ov.addEventListener('pointerdown', startHold); ov.addEventListener('pointerup', stopHold); ov.addEventListener('pointercancel', stopHold); }
  /* v4.0 · revisión de accesibilidad (3 nov): mantener 1,5 s era difícil para quien tiene poca motricidad o no entiende la instrucción,
     y en la PRIMERA visita no se podía saltar nada (hasta ~9 s mirando sin poder hacer nada). Ahora, primera visita o no,
     un toque, un clic, Esc o Enter la saltan, y el aviso aparece desde el principio. */
  const skipNow = () => { if (!skip && $('#intro')){ skip = introSkipped = true; holdBar.style.transform = 'scaleX(1)'; } };
  ov.addEventListener('click', skipNow);
  addEventListener('keydown', e => { if ((e.key === 'Escape' || e.key === 'Enter') && $('#intro')) skipNow(); });
  { const sk = $('span', skipEl), key = matchMedia('(pointer: coarse)').matches ? 'ix.skipTap' : 'ix.skipClick'; sk.dataset.i18nHtml = key; sk.innerHTML = SZ.t(key); }

  /* la marca y el nombre guardan las mismas proporciones que en la barra: así el vuelo final calza exacto */
  const navImg = $('#nav .logo .lgz'), navW = $('#navWord .zw') || $('#navWord');
  /* (la marca de la barra está achicada hasta que la intro aterriza: se mide su tamaño real, no el de la pantalla) */
  const nf = parseFloat(getComputedStyle(navW).fontSize) || 23, nw = navW.getBoundingClientRect();
  const ni = navImg && navImg.offsetHeight ? (b => { const w = navImg.offsetWidth, h = navImg.offsetHeight, cx = b.left + b.width / 2, cy = b.top + b.height / 2; return { left:cx - w / 2, right:cx + w / 2, top:cy - h / 2, width:w, height:h }; })(navImg.getBoundingClientRect()) : null;
  if (ni){ mk.style.height = (ni.height / nf).toFixed(3) + 'em'; wd.style.setProperty('--izg', ((nw.left - ni.right) / nf).toFixed(3) + 'em'); }
  wd.innerHTML = 'Symphor'.split('').map(c => '<span class="izc">' + c + '</span>').join('') + '<span class="izc zt">IA</span>';
  const letters = $$('.izc', wd);
  /* chispas del destello: salen en círculo, cada una con su color del tema */
  const cols = ['var(--sb-light)', 'var(--sb-secondary)', 'var(--sb-warm)', '#fff', 'var(--sb-primary)', 'var(--sb-spark)'];
  $('#izBurst').innerHTML = Array.from({ length:16 }, (_, i) => '<i style="--a:' + (i * 22.5 + (i % 3) * 7) + 'deg;--d:' + (1.1 + (i % 4) * .32).toFixed(2) + 'em;--dl:' + ((i % 5) * .03).toFixed(2) + 's;--c:' + cols[i % cols.length] + '"></i>').join('');

  await Promise.race([document.fonts ? document.fonts.ready : sleepRaw(0), sleepRaw(1200)]);
  await sleep(200);
  setTimeout(() => { if (!skip) skipEl.style.opacity = '1'; }, 400);
  /* 1. un cometa de luz dibuja la S de un solo trazo y el vidrio aparece detrás de él */
  void ov.offsetWidth; ov.classList.add('draw');
  await sleep(1150);
  /* 2. la S brilla y aparece su órbita: un reflejo la cruza, salen dos anillos de luz y chispas, y el cielo se enciende */
  ov.classList.add('shine', 'lit');
  await sleep(380);
  /* 3. se escribe «Symphor» letra por letra y el «IA» de color cae al final */
  for (const l of letters){ l.classList.add('on'); await sleep(l.classList.contains('zt') ? 0 : 70); }
  await sleep(900);
  /* 4. vuela hasta la barra de arriba: la marca dibujada se vuelve la imagen del logo mientras se achica */
  skipEl.style.opacity = '0';
  const r = row.getBoundingClientRect(), m = mk.getBoundingClientRect(), wr = wd.getBoundingClientRect();
  const s = nf / (parseFloat(getComputedStyle(wd).fontSize) || nf);
  const c = [r.left + r.width / 2, r.top + r.height / 2], from = ni && ni.width ? [m.left + m.width / 2, m.top + m.height / 2] : [wr.left + wr.width / 2, wr.top + wr.height / 2];
  const to = ni && ni.width ? [ni.left + ni.width / 2, ni.top + ni.height / 2] : [nw.left + nw.width / 2, nw.top + nw.height / 2];
  const dx = to[0] - c[0] - s * (from[0] - c[0]), dy = to[1] - c[1] - s * (from[1] - c[1]);
  const dur = skip ? .4 : FIRST ? 1 : .8;
  row.style.transition = 'transform ' + dur + 's cubic-bezier(.77,0,.18,1)';
  row.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
  ov.classList.add('fly', 'out');
  await sleepRaw(dur * 1000 + 40);
  try{ sessionStorage.setItem('synthz:intro', '1'); }catch(e){}
  finishIntro();
}

/* ---------- entrar, ayuda con bloqueadores, configuración y recorrido ---------- */
let FIRST = false, welcomed = false; try{ FIRST = !localStorage.getItem('synthz:visited'); }catch(e){}
/* v4.1 · llegó por «Soy nuevo» (la pantallita): se le muestra la portada como a alguien nuevo, con su recorrido */
try{ const u = new URL(location.href); if (u.searchParams.get('nuevo') === '1'){ FIRST = true; u.searchParams.delete('nuevo'); history.replaceState(null, '', u.pathname + u.search + u.hash); } }catch(e){}
const markVisited = () => { try{ localStorage.setItem('synthz:visited', '1'); }catch(e){} };
function puterSignIn(opts){
  if (!window.puter){ showBlockHelp('script'); return Promise.reject(Object.assign(new Error('sin puter'), { shown:true })); }
  return puter.auth.signIn(opts || {}).catch(e => { if (SZ.isBlocked(e)){ showBlockHelp('popup'); throw Object.assign(new Error('popup'), { shown:true }); } throw e; });
}
function afterConnect(msg){ toast(msg); updateTotals(); }
function openConnect(){ const c = document.getElementById('conectar'); if (c) scrollTo({ top:c.getBoundingClientRect().top + scrollY - 80, behavior:'smooth' }); }
function browserName(){ const u = navigator.userAgent; if (navigator.brave) return 'Brave'; if (/Edg\//.test(u)) return 'Edge'; if (/OPR\//.test(u)) return 'Opera'; if (/Firefox\//.test(u)) return 'Firefox'; if (/Safari\//.test(u) && !/Chrome\//.test(u)) return 'Safari'; return 'Chrome'; }
const ICO = {
  pop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/><path d="M10 12.5l4 4M14 12.5l-4 4" stroke="#ff8f7a"/></svg>',
  ext:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4a2 2 0 0 1 4 0v2h3a1 1 0 0 1 1 1v3h-1.5a2 2 0 0 0 0 4H18v3a1 1 0 0 1-1 1h-3v-1.5a2 2 0 0 0-4 0V20H7a1 1 0 0 1-1-1v-3h1.5a2 2 0 0 0 0-4H6V7a1 1 0 0 1 1-1h3z"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>',
  lock:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
};
let blkEl = null;
function showBlockHelp(kind){
  if (blkEl) return;
  const br = browserName(), pop = kind === 'popup', brave = br === 'Brave';
  const steps = pop
    ? (br === 'Firefox' ? ['Arriba aparece una barra amarilla: <b>Firefox impidió que este sitio abriera una ventana</b>.', 'Pulsa <b>Preferencias</b> y elige <b>Permitir ventanas emergentes</b> para este sitio.', 'Vuelve aquí y pulsa <b>Reintentar</b>.']
      : br === 'Safari' ? ['En el menú <b>Safari</b>, abre <b>Ajustes para este sitio web</b>.', 'En <b>Ventanas emergentes</b>, elige <b>Permitir</b>.', 'Vuelve aquí y pulsa <b>Reintentar</b>.']
      : ['Al final de la barra de direcciones apareció un icono de <b>ventana con una ✕</b> (el número 1).', 'Haz clic y elige <b>Permitir siempre ventanas emergentes</b> de este sitio.', 'Pulsa <b>Reintentar</b>. Si no ves el icono, revisa tu bloqueador de anuncios en <b>extensiones</b> (el paso 2).'])
    : (brave ? ['Haz clic en el <b>león de Brave Shields</b> en la barra (el número 1).', 'Baja los escudos para este sitio.', 'Pulsa <b>Recargar</b>.']
      : ['Haz clic en el icono de <b>extensiones</b>, la pieza de puzle a la derecha (el número 1).', 'Abre tu bloqueador (uBlock, AdBlock, AdGuard…) y <b>desactívalo para este sitio</b>.', 'Pulsa <b>Recargar</b>.']);
  const bi = (ico, n) => '<span class="bi' + (n ? ' hl' : '') + '">' + ico + (n ? '<i class="nb">' + n + '</i>' : '') + '</span>';
  const icons = pop ? bi(ICO.pop, br === 'Firefox' || br === 'Safari' ? 0 : 1) + bi(ICO.ext, br === 'Firefox' || br === 'Safari' ? 0 : 2) : (brave ? bi(ICO.shield, 1) + bi(ICO.ext, 0) : bi(ICO.ext, 1));
  blkEl = document.createElement('div'); blkEl.id = 'blk';
  blkEl.innerHTML = '<div class="tcard" role="dialog" aria-modal="true"><div class="word" id="bWord"></div><div class="tn">AVISO · ' + esc(br.toUpperCase()) + '</div><div class="tb"><h3>' + (pop ? 'Tu navegador no dejó abrir la ventanita de Puter' : 'Tu bloqueador de anuncios está frenando a Puter') + '</h3><p>' + (pop ? 'Para entrar a Puter se abre una ventanita, y ' + esc(br) + ' no la dejó abrir. Así la permites:' : 'Un bloqueador de anuncios no deja cargar Puter. Las IAs conectadas siguen funcionando. Así lo arreglas:') + '</p></div>'
    + '<div class="bbar" aria-hidden="true"><span class="dots"><i></i><i></i><i></i></span><span class="url">' + ICO.lock + esc(location.host || 'tu-sitio') + '</span>' + icons + '</div>'
    + '<ol class="bsteps">' + steps.map(s => '<li>' + s + '</li>').join('') + '</ol>'
    + (pop ? '<div class="bforce" id="bForce"><b>¿Lo intento de otra forma?</b> Pruebo entrar a Puter por otro camino. Puede que tampoco funcione si el bloqueo es muy fuerte.<div class="tbtn"><button class="lnk" id="bNo" type="button">No</button><button class="btn sm" id="bYes" type="button">Sí, forzar</button></div></div>' : '')
    + '<div class="tbtn" style="margin-top:16px"><button class="lnk" id="bClose" type="button">' + (pop ? 'Cerrar' : 'Seguir sin Puter') + '</button>' + (pop ? '<button class="lnk" id="bAsk" type="button">Forzar</button>' : '') + '<button class="btn sm" id="bGo" type="button">' + (pop ? 'Reintentar' : 'Recargar') + '</button></div></div>';
  document.body.appendChild(blkEl); $('#bWord').innerHTML = zWord('Synth');
  requestAnimationFrame(() => blkEl.classList.add('on'));
  $('.tcard', blkEl).animate([{ transform:'scale(.9) translateY(24px)', opacity:0, filter:'blur(10px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { if (!blkEl) return; const el = blkEl; blkEl = null; el.classList.remove('on'); setTimeout(() => el.remove(), 470); };
  $('#bClose').addEventListener('click', () => { close(); if (!pop) openConnect(); });
  blkEl.addEventListener('pointerdown', e => { if (e.target === blkEl) close(); });
  $('#bGo').addEventListener('click', () => {
    if (!pop){ location.reload(); return; }
    close(); puterSignIn().then(() => afterConnect('¡Puter conectado!')).catch(() => {});
  });
  if (pop){
    $('#bAsk').addEventListener('click', () => $('#bForce').classList.add('on'));
    $('#bNo').addEventListener('click', () => $('#bForce').classList.remove('on'));
    $('#bYes').addEventListener('click', () => {
      const ui2 = window.puter && puter.ui && puter.ui.authenticateWithPuter;
      if (!ui2){ toast('Ese camino no funcionó. Permite las ventanitas de este sitio y pulsa Reintentar.'); return; }
      close(); puter.ui.authenticateWithPuter().then(() => afterConnect('¡Puter conectado!')).catch(() => toast('Tampoco funcionó. Permite las ventanitas de este sitio y pulsa Reintentar.'));
    });
  }
}

function authModal(first, next, opts){
  opts = opts || {};
  if ($('#authm')) return $('#authm');
  const o = document.createElement('div'); o.id = 'authm'; o.className = 'szm';
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Entrar a Sinapse"><div class="word">' + zWord('Synth') + '</div><div class="tn">' + (first ? 'BIENVENIDO' : 'TU CUENTA') + '</div><div class="tb"><h3>' + (first ? 'Bienvenido a Sinapse' : 'Entra a Sinapse') + '</h3><p>Crea tu cuenta gratis con un usuario y una contraseña: tus chats y favoritos te siguen a cualquier dispositivo y personalizas tu perfil.</p><div id="authBox"></div></div><div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>' + (first ? 'Continuar sin cuenta' : 'Cerrar') + '</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  if (!opts.hold) $('.tcard', o).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  let done = false;
  const out = ok => { o.classList.remove('on'); setTimeout(() => o.remove(), 450); if (!done){ done = true; if (next) next(ok); } };
  $('[data-close]', o).addEventListener('click', () => out(false));
  SZ.authBox($('#authBox', o), m => { toast(m === 'tmp' ? '¡Listo! Estás en una cuenta temporal.' : '¡Bienvenido a tu cuenta de Sinapse!'); updateTotals(); out(true); }, k => showBlockHelp(k));
  return o;
}
function openHelp(){ SZ.helpGuide({ extra:[['Recorrido por la página', () => pageTour()], ['Abrir Sonyx', () => openChat()]] }); }
/* Guía: Asistida (Sona en SynthFlow, con la cinemática y 5 mensajes de prueba) o Lectura (aquí mismo) */
function openGuide(){ pageTour(() => setTimeout(() => { if (!SZ.ACC.ready) authModal(false, () => updateTotals()); }, 400)); }
$('#helpBtn').addEventListener('click', openGuide);
/* menú del celular */
{
  const nb = $('#navMenu'), nd = $('#navDrop');
  const setOpen = on => { nb.setAttribute('aria-expanded', String(on)); if (on){ nd.hidden = false; requestAnimationFrame(() => nd.classList.add('on')); } else { nd.classList.remove('on'); setTimeout(() => { if (!nd.classList.contains('on')) nd.hidden = true; }, 380); } };
  nb.addEventListener('click', e => { e.stopPropagation(); setOpen(nb.getAttribute('aria-expanded') !== 'true'); });
  nd.addEventListener('click', e => { const b = e.target.closest('[data-nd]'); setOpen(false); if (b){ if (b.dataset.nd === 'help') openGuide(); else if (b.dataset.nd === 'acc') $('#accBtn').click(); else if (b.dataset.nd !== 'lang') $('#cfgBtn').click(); } });
  document.addEventListener('click', e => { if (!nd.hidden && !e.target.closest('#navDrop')) setOpen(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !nd.hidden){ setOpen(false); nb.focus(); } });
}
/* primera vez: primero el tutorial; entrar o crear cuenta viene después (o con «Ahora no») */
function firstRun(){ pageTour(() => setTimeout(() => { if (!SZ.ACC.ready) authModal(true, () => updateTotals()); }, 500)); }
function pageTour(onEnd){
  if ($('#ptour')) return;
  let pick = SZ.CFG.perf;
  const vis = sel => { const e = sel && document.querySelector(sel); return !sel || !!(e && e.offsetWidth && e.getClientRects().length); };
  const first = (...L) => L.find(x => vis(x)) || L[L.length - 1];
  const steps = [
    { s:'.logo', t:SZ.t('tour.logo.t'), p:SZ.t('tour.logo.p') },
    { s:'.navlinks', t:SZ.t('tour.menu.t'), p:SZ.t('tour.menu.p') },
    { s:'.pill-total', t:SZ.t('tour.lim.t'), p:SZ.t('tour.lim.p') },
    { s:first('#railMe', '#accBtn', '#navMenu'), t:SZ.t('tour.acc.t'), p:SZ.t('tour.acc.p') },
    { s:first('#railCfg', '#cfgBtn', '#navMenu'), t:SZ.t('tour.cfg.t'), p:SZ.t('tour.cfg.p'), x:'cfg' },
    { s:'#como', t:SZ.t('tour.como.t'), p:SZ.t('tour.como.p') },
    { s:'#conectar', t:SZ.t('tour.con.t'), p:SZ.t('tour.con.p') },
    { s:'#chat', t:SZ.t('tour.chat.t'), p:SZ.t('tour.chat.p') },
    { s:'#consumo', t:SZ.t('tour.uso.t'), p:SZ.t('tour.uso.p') },
    { s:null, t:SZ.t('tour.fin.t'), p:SZ.t('tour.fin.p') }
  ].filter(x => vis(x.s));
  const o = document.createElement('div'); o.id = 'ptour';
  o.innerHTML = '<div class="catch"></div><div class="hole"></div><div class="pcard tcard" role="dialog" aria-modal="true" aria-label="' + SZ.t('tour.aria') + '"><div class="tn"></div><div class="tb"><h3></h3><p></p><div class="tx"></div></div><div class="tdots">' + steps.map(() => '<i></i>').join('') + '</div><div class="tbtn"><button class="lnk" type="button" data-skip>' + SZ.t('tour.skip') + '</button><span style="flex:1"></span><button class="lnk" type="button" data-back>' + SZ.t('tour.back') + '</button><button class="btn sm" type="button" data-next>' + SZ.t('tour.next') + '</button></div></div>';
  document.body.appendChild(o);
  const hole = $('.hole', o), card = $('.pcard', o);
  let i = 0, target = null, follow = 0;
  const gc = document.createElement('div'); gc.id = 'gcur';
  gc.innerHTML = '<i></i><svg viewBox="0 0 22 30" fill="none"><path d="M2.5 2.2V23L8 18.1L11.6 26.4L15.2 24.9L11.7 16.9L19 16.6Z" fill="#0d0e12" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.body.appendChild(gc);
  let gx = innerWidth / 2, gy = innerHeight / 2, gT = 0;
  const guide = () => {
    if (!target){ gc.classList.remove('on'); return; }
    const r = target.getBoundingClientRect(), x = Math.min(innerWidth - 30, Math.max(10, r.left + Math.min(r.width / 2, 120))), y = Math.min(innerHeight - 30, Math.max(10, r.top + Math.min(r.height / 2, 60)));
    gc.classList.add('on');
    if (Math.abs(x - gx) > 2 || Math.abs(y - gy) > 2){ gx = x; gy = y; gc.style.transform = 'translate(' + x + 'px,' + y + 'px)'; clearTimeout(gT); gT = setTimeout(() => { gc.classList.remove('tap'); void gc.offsetWidth; gc.classList.add('tap'); }, 900); }
  };
  gc.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';
  const place = () => {
    const W = innerWidth, H = innerHeight, sec = target && target.tagName === 'SECTION';
    const r = target ? target.getBoundingClientRect() : { left:W / 2, top:H / 2, width:0, height:0 }, pad = target ? 10 : 0;
    const x = Math.max(8, r.left - pad), y = Math.max(8, r.top - pad), w = Math.min(W - 16 - x, r.width + pad * 2);
    let h = Math.min(r.height + pad * 2, H - 8 - y); if (sec) h = Math.min(h, H * .42);
    hole.style.left = x + 'px'; hole.style.top = y + 'px'; hole.style.width = Math.max(0, w) + 'px'; hole.style.height = Math.max(0, h) + 'px'; hole.style.opacity = target ? '1' : '0';
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let cy = y + h + 16; if (cy + ch > H - 10) cy = y - ch - 16; if (cy < 10) cy = Math.max(10, H - ch - 12);
    if (!target) cy = (H - ch) / 2;
    const cx = target ? Math.min(W - cw - 10, Math.max(10, x + w / 2 - cw / 2)) : (W - cw) / 2;
    card.style.left = cx + 'px'; card.style.top = cy + 'px';
  };
  const chase = () => { const t0 = performance.now(); cancelAnimationFrame(follow); const f = now => { place(); if (now - t0 < 1100) follow = requestAnimationFrame(f); }; follow = requestAnimationFrame(f); };
  const show = () => {
    const x = steps[i], last = i === steps.length - 1;
    target = x.s ? document.querySelector(x.s) : null;
    if (target){ const r = target.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 40 || target.tagName === 'SECTION'){ if (getComputedStyle(target.closest('nav') || document.body).position !== 'fixed') scrollTo({ top:r.top + scrollY - (target.tagName === 'SECTION' ? 84 : innerHeight / 3), behavior:'smooth' }); } }
    $('.tn', card).textContent = String(i + 1).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0');
    $('h3', card).textContent = x.t; $('p', card).textContent = x.p;
    const tx = $('.tx', card); tx.innerHTML = '';
    if (x.x === 'cfg') SZ.cfgChooser(tx, pick, v => { pick = v; requestAnimationFrame(place); });
    $$('.tdots i', card).forEach((d, k) => d.classList.toggle('on', k === i));
    $('[data-back]', card).style.visibility = i ? 'visible' : 'hidden';
    $('[data-skip]', card).style.visibility = last ? 'hidden' : 'visible';
    $('[data-next]', card).textContent = last ? SZ.t(SZ.ACC.ready ? 'tour.start' : 'tour.signin') : SZ.t('tour.next');
    card.animate([{ opacity:.2, filter:'blur(6px)' }, { opacity:1, filter:'blur(0)' }], { duration:450, easing:'cubic-bezier(.22,1,.36,1)' });
    chase(); setTimeout(guide, 450);
  };
  const onMove = () => { place(); guide(); };
  addEventListener('scroll', onMove, { passive:true }); addEventListener('resize', onMove);
  const end = () => {
    gc.classList.remove('on'); setTimeout(() => gc.remove(), 400);
    removeEventListener('scroll', onMove); removeEventListener('resize', onMove); cancelAnimationFrame(follow);
    o.animate([{ opacity:1 }, { opacity:0 }], { duration:350 }).onfinish = () => o.remove();
    markVisited();
    if (pick !== SZ.CFG.perf) SZ.applyCfg(Object.assign({}, SZ.CFG, SZ.cfgPreset(pick), { perf:pick }));
    if (typeof onEnd === 'function') try{ onEnd(); }catch(e){}
  };
  $('[data-skip]', card).addEventListener('click', end);
  $('[data-back]', card).addEventListener('click', () => { if (i > 0){ i--; show(); } });
  $('[data-next]', card).addEventListener('click', () => { if (i < steps.length - 1){ i++; show(); } else { end(); toast(SZ.t('tour.enjoy')); } });
  o.animate([{ opacity:0 }, { opacity:1 }], { duration:400 });
  show();
}

/* ---------- arranque ---------- */
function boot(){
  renderCards(); puterCard(); renderLaunch(); renderUsage(); updateTotals(); measure(); SZ.mirrorType($('#launchInp'));
  SZ.szCatalog().catch(() => {});        /* estado de las IAs conectadas y el límite de hoy */
/* tarjeta de Puter + botón de cuenta */
function puterCard(){
  const wrap = $('#cards'); if (!wrap || $('[data-id="puter"]', wrap)) return;
  wrap.insertAdjacentHTML('beforeend', '<article class="card" data-id="puter" style="--c:#6fd3d6"><div class="card-top">' + SZ.puterLogo('lg') + '<h3>Puter</h3><span class="status" data-st>' + SZ.t('ix.puOff') + '</span></div><p class="desc">' + SZ.t('ix.puDesc') + '</p><div class="actions"><button class="btn sm" data-pu type="button">' + SZ.t('ix.puGo') + '</button></div></article>');
  const card = $('[data-id="puter"]', wrap), b = $('[data-pu]', card);
  const paint = () => { const on = !!(window.puter && puter.auth && puter.auth.isSignedIn()); setStatus(card, SZ.t(on ? 'ix.puOn' : 'ix.puOff'), on ? 'ok' : ''); b.textContent = SZ.t(on ? 'ix.qOpen' : 'ix.puGo'); };
  paint(); addEventListener('puter-ready', paint);
  b.addEventListener('click', () => {
    if (window.puter && puter.auth.isSignedIn()){ openChat(); return; }
    b.textContent = 'Conectando…';
    puterSignIn({}).then(() => { paint(); updateTotals(); toast(SZ.t('ix.puDone')); setTimeout(() => { if (!leaving) openChat(); }, 1000); }).catch(e => { paint(); if (!(e && e.shown)) toast(SZ.t('ix.puFail')); });
  });
}
function renderAccIdx(){
  const b = $('#accBtn'); if (!b) return; const A = SZ.ACC;
  if (A.ready){ b.className = 'accb'; b.innerHTML = SZ.myAvatar() + '<span>' + esc(SZ.accName().slice(0, 14)) + '</span><i class="sy' + (A.err ? ' bad' : '') + '"></i>'; }
  else if (A.busy || SZ.signedish()){ b.className = 'accb'; b.innerHTML = '<span class="av-me">…</span><span>' + SZ.t('ix.opening') + '</span><i class="sy wait"></i>'; }
  else { b.className = 'accb out'; b.textContent = SZ.t('ix.signin'); }
}
$('#accBtn').addEventListener('click', () => {
  if (SZ.ACC.ready){ SZ.portalOut('chat.html?acc=1'); return; }
  authModal(false, () => updateTotals());
});

$('#cfgBtn').addEventListener('click', () => SZ.cfgModal());
SZ.smoothWheel(); SZ.orbitBg();
SZ.accHooks.push(kind => { renderAccIdx(); if (kind === 'pull'){ updateTotals(); try{ renderUsage(); }catch(e){} } });
renderAccIdx();

  armTypes(); charify($('#h1')); if ($('.hsub2')) charify($('.hsub2')); charify($('#heroSub'));
  observeAll(); update();
  requestAnimationFrame(loop);
  addEventListener('resize', () => { placePill($('#launchSeg')); measure(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { placePill($('#launchSeg')); measure(); });
  if (!st().models.openrouter) SZ.refreshModels(API[0]).catch(() => {});
}
boot();
/* «Empezar a FlowIA'r»: Sona guiña el ojo y luego se pone fachera (gafas de Flow) con brillitos */
(function startFace(){
  const f = $('#startFace'), b = $('#startBtn'); if (!f || !b) return;
  const put = m => { f.innerHTML = '<span class="fl">' + SZ.face(m, 38) + '</span>'; };
  const cycle = () => { b.classList.remove('cool'); put('guino'); setTimeout(() => { put('flow'); b.classList.add('cool'); }, 1300); };
  cycle(); setInterval(() => { if (!document.hidden && !root.classList.contains('idle-sleep')) cycle(); }, 9000);
  b.addEventListener('mouseenter', () => { put('flow'); b.classList.add('cool'); });
})();
let seen = false, backIn = '';
/* v3.7 · «Intro de la página» en Ajustes manda: Nunca = nunca; Cada vez = siempre; Una vez por visita = una vez por pestaña.
   Antes, quien no terminaba el recorrido de bienvenida seguía siendo «primera vez» para siempre y veía la intro aunque eligiera «Nunca».
   Con Animaciones apagadas no hay intro (es una animación); la primera visita de alguien que no eligió nada sí la ve. */
try{
  const im = SZ.CFG.intro || 'session', once = sessionStorage.getItem('synthz:intro') === '1';
  seen = im === 'never' || !SZ.CFG.anim || (im === 'session' && once);
  if (!seen) sessionStorage.setItem('synthz:intro', '1');
}catch(e){}
/* de vuelta desde SynthFlow: «SymphorIA» ya llegó volando a su esquina; sin intro, la página aparece suave */
try{ backIn = sessionStorage.getItem('synthz:back') || ''; sessionStorage.removeItem('synthz:back'); }catch(e){}
if (backIn){ seen = !FIRST; requestAnimationFrame(() => requestAnimationFrame(() => { root.classList.add('backout'); setTimeout(() => root.classList.remove('backin', 'backout'), 950); })); }
if (seen) finishIntro();
else {
  const failsafe = setTimeout(finishIntro, 9000);
  intro().catch(finishIntro).finally(() => clearTimeout(failsafe));
}

/* v2.5 · ya no hay barrita lateral en la portada: todo está en el menú de arriba */
/* v3.0 · al cambiar de idioma, lo que pinta el JS se vuelve a pintar */
if (SZ.onLang) SZ.onLang(() => { try{ paintSzCard(); updateTotals(); renderLaunch(); renderUsage._b = 0; renderUsage(); }catch(e){} });
$('#limPill').addEventListener('click', () => { const u = $('#consumo'); if (u) u.scrollIntoView({ behavior:SZ.reduce ? 'auto' : 'smooth' }); });
})();

/* v2.2 · Ajustes › Tus IAs en la portada, y el «!» de novedades sobre Sona */
/* el texto se lee al abrir Ajustes, así sigue al idioma */
const lk = (l, fn, d) => { const a = [, fn]; Object.defineProperties(a, { 0:{ get:() => SZ.t(l) }, 2:{ get:() => SZ.t(d) } }); return a; };
SZ.cfgLinks.push(lk('ix.lk1', () => SZ.surveyModal(), 'ix.lk1d'), lk('ix.lk2', () => SZ.portalOut('chat.html?conn=1'), 'ix.lk2d'), lk('ixa.abrirsynthflow', () => { location.href = 'chat.html'; }, 'ix.lk3d'));
if (!SZ.appStandalone()) SZ.cfgLinks.push(lk('ix.lk4', () => SZ.appPromo(true), 'ix.lk4d'));
setTimeout(() => { if (!document.querySelector('.szm, #vintro, #intro')) SZ.whatsNew(false); }, 4000);

/* ===== v2.4 · portada del boceto: Sona de cuerpo entero, onda «synthonized», compáralas a ciegas y detalles ===== */
(() => {
const { $, $$, reduce } = SZ;
const q = s => document.querySelector(s);

/* v2.5 · Sona de cuerpo entero, igual al boceto (cabeza 45 %, torso 30 %, base 25 %) */
const body = (mood, pose, size) => SZ.synBody(mood, pose, size);
/* v2.6: cambia cara y pose sobre el mismo cuerpo, así los brazos se mueven suave */
const set = (host, mood, pose, size) => SZ.synSet(host, mood, pose, size);
const hb = q('#heroBot');
if (hb){
  set(hb, 'feliz', 'saluda', 300);
  /* después del saludo, señala la tarjeta de ejemplo (como en el boceto) */
  const calm = () => { if (!hb.matches(':hover')) set(hb, 'neutral', innerWidth > 980 ? 'senalaL' : 'presenta', 300); };
  setTimeout(calm, 3800);
  /* detalle: si la tocas, se emociona, celebra y suelta un destello */
  hb.parentElement.style.pointerEvents = 'auto';
  /* v3.0: ella se puede tocar y enfocar, así que no puede estar dentro de algo con aria-hidden: lo decorativo de al lado sí lo queda */
  { const st = hb.parentElement; st.removeAttribute('aria-hidden'); [...st.children].forEach(c => { if (c !== hb) c.setAttribute('aria-hidden', 'true'); }); }
  hb.addEventListener('click', () => {
    set(hb, 'celebrando', 'celebra', 300); hb.classList.remove('boop'); void hb.offsetWidth; hb.classList.add('boop');
    try{ SZ.SND && SZ.SND.blip && SZ.SND.blip('feliz'); SZ.burst && SZ.burst(hb); }catch(e){}
    setTimeout(() => { set(hb, 'feliz', 'saluda', 300); setTimeout(calm, 2600); }, 1600);
    /* v2.6: ella es la ayudante (ya no hay botón): tocarla abre su ventanita para hablarle */
    try{ SZ.BOT && SZ.BOT.open && SZ.BOT.open(); }catch(e){}
  });
  hb.setAttribute('role', 'button'); hb.tabIndex = 0; hb.setAttribute('aria-label', SZ.t('rb.aria'));
  hb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); hb.click(); } });
  /* detalle: los ojos y la cabeza siguen al mouse */
  if (!reduce && matchMedia('(pointer: fine)').matches){
    let raf = 0, ex = 0, ey = 0;
    addEventListener('pointermove', e => { const r = hb.getBoundingClientRect(); ex = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / 500)); ey = Math.max(-1, Math.min(1, (e.clientY - r.top - 90) / 500)); if (!raf) raf = requestAnimationFrame(() => { raf = 0; hb.style.setProperty('--ex', (ex * 3.2).toFixed(2) + 'px'); hb.style.setProperty('--ey', (ey * 2.4).toFixed(2) + 'px'); hb.style.setProperty('--tilt', (ex * 4).toFixed(2) + 'deg'); }); }, { passive:true });
  }
}
/* chispitas doradas que flotan alrededor de Sona */
const dust = q('#heroDust');
if (dust && !reduce) dust.innerHTML = Array.from({ length:26 }, (_, i) => '<i style="--x:' + (Math.random() * 100).toFixed(1) + '%;--y:' + (Math.random() * 100).toFixed(1) + '%;--t:' + (3 + Math.random() * 5).toFixed(1) + 's;--dl:-' + (Math.random() * 6).toFixed(1) + 's;--s:' + (1.5 + Math.random() * 2.5).toFixed(1) + 'px"></i>').join('');
const rf = q('#readyFace');
if (rf){
  rf.innerHTML = body('celebrando', 'celebra', 230);
  rf.removeAttribute('aria-hidden'); rf.setAttribute('role', 'button'); rf.tabIndex = 0; rf.setAttribute('aria-label', SZ.t('rb.aria'));
  const go = () => { try{ SZ.SND && SZ.SND.blip && SZ.SND.blip('feliz'); SZ.BOT && SZ.BOT.open && SZ.BOT.open(); }catch(e){} };
  rf.addEventListener('click', go); rf.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
}

/* «¿Qué es estar synthonized?»: una onda de estática que, al pasar, se vuelve una onda limpia */
const cv = q('#szWave');
if (cv){
  const ctx = cv.getContext('2d'); let w = 0, h = 0, raf = 0, on = false;
  const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const noise = (x, t) => Math.sin(x * .31 + t * 3.1) * Math.sin(x * .07 - t) + Math.sin(x * 1.7 + t * 5) * .45;
  const draw = now => {
    raf = 0; const t = now / 1000; ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#3de0ff'); g.addColorStop(.45, '#7b3ff2'); g.addColorStop(.75, '#ff3d9a'); g.addColorStop(1, '#ff7a45');
    for (let k = 0; k < 3; k++){
      ctx.beginPath(); ctx.lineWidth = k ? 1.2 : 2.4; ctx.strokeStyle = g; ctx.globalAlpha = k ? .45 : 1;
      for (let x = 0; x <= w; x += 2){
        const u = x / w, clean = Math.sin(u * 14 - t * 2 + k * .6) * h * .28, dirty = noise(x, t + k) * h * .3 * (1 - u);
        const y = h / 2 + clean * Math.min(1, u * 1.6) + dirty * (1 - Math.min(1, u * 1.6));
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (on && !reduce) raf = requestAnimationFrame(draw);
  };
  fit(); addEventListener('resize', fit);
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { on = es[0].isIntersecting; if (on && !raf) raf = requestAnimationFrame(draw); }).observe(cv);
  else { on = true; raf = requestAnimationFrame(draw); }
}

/* Compáralas a ciegas: eliges la que tiene más Flow y Sona te cuenta quién respondió (son IAs de ejemplo) */
const bf = q('#blFace'); if (bf) bf.innerHTML = SZ.face('guino', 44);
$$('.bl-v').forEach((b, i) => b.addEventListener('click', () => {
  $$('.bl-c').forEach((c, j) => { c.classList.toggle('won', i === j); c.classList.add('shown'); const n = c.querySelector('b'); if (n && !n.dataset.was){ n.dataset.was = n.textContent; n.textContent = 'IA de ejemplo ' + (j + 1); } });
  if (bf) bf.innerHTML = SZ.face('celebrando', 44);
  const say = q('#blSay'); if (say) say.textContent = SZ.t('ix.blindPick', { n:i + 1 });
  try{ SZ.burst && SZ.burst(b); }catch(e){}
}));

/* el centro «Todas las IAs»: las etiquetas se acomodan en círculo alrededor de la onda */
const hub = q('.hub');
/* v2.6: cada etiqueta se mide; nunca toca la onda, nunca se sale de su lado y nunca pisa a la de arriba o abajo */
if (hub){ const place = () => {
  const W = hub.clientWidth, c = $('.hub-c', hub), oR = c && c.offsetParent ? c.offsetWidth / 2 : 0;
  if (!c || getComputedStyle($('.hub-i', hub)).position === 'static') return;      /* celular: van en fila, sin círculo */
  const items = $$('.hub-i', hub), room = Math.max(120, W / 2 - oR - 16);
  items.forEach(el => { el.style.maxWidth = Math.min(220, room) + 'px'; });
  const hMax = Math.max(...items.map(el => el.offsetHeight));
  items.forEach(el => {
    const a = parseFloat(el.style.getPropertyValue('--a')) * Math.PI / 180, side = Math.cos(a) < 0 ? -1 : 1, row = Math.round(Math.sin(a) * 2), w = el.offsetWidth;
    const near = oR + 16 + w / 2 + (row ? 0 : 26), far = W / 2 - w / 2;
    const x = side * Math.max(Math.min(near, far), Math.min(far, oR + 8 + w / 2));
    el.style.transform = 'translate(-50%,-50%) translate(' + x.toFixed(1) + 'px,' + (row * (hMax + 12)).toFixed(1) + 'px)';
  });
}; place(); addEventListener('resize', place); if (document.fonts) document.fonts.ready.then(place); }

/* detalle: el «Ver demo» baja con suavidad hasta «Así de fácil» y lo hace brillar un momento */
const demo = q('#demoBtn');
if (demo) demo.addEventListener('click', e => { const c = q('#como'); if (!c) return; e.preventDefault(); c.scrollIntoView({ behavior:reduce ? 'auto' : 'smooth' }); setTimeout(() => { c.classList.remove('glint'); void c.offsetWidth; c.classList.add('glint'); }, 650); });
})();
/* ===== v2.5 · Sona viva: cuando sales de la portada te acompaña por toda la página.
   Vuela de un lado al otro según la sección, cambia de cara y de pose, dice una frase corta,
   te mira con los ojos y, si la tocas, abre su ventanita para hablar contigo. ===== */
(() => {
const { $, reduce } = SZ;
if (!SZ.synBody) return;
const STOPS = {
  como:     { side:'r', mood:'feliz',      pose:'saluda',   get say(){ return SZ.t('rb.como'); } },
  modos:    { side:'l', mood:'neutral',    pose:'senala',   get say(){ return SZ.t('rb.modos'); } },
  usos:     { side:'r', mood:'creando',    pose:'presenta', get say(){ return SZ.t('rb.usos'); } },
  comparar: { side:'l', mood:'pensando',   pose:'piensa',   get say(){ return SZ.t('rb.comparar'); }, at:'.blind h3|.cmp-top h2' },
  conectar: { side:'r', mood:'feliz',      pose:'presenta', get say(){ return SZ.t('rb.conectar'); } },
  chat:     { side:'l', mood:'hablando',   pose:'senala',   get say(){ return SZ.t('rb.chat'); } },
  consumo:  { side:'r', mood:'analizando', pose:'escribe',  get say(){ return SZ.t('rb.consumo'); } },
  faq:      { side:'l', mood:'escuchando', pose:'escucha',  get say(){ return SZ.t('rb.faq'); } }
};
const el = document.createElement('div');
el.id = 'szRoam'; el.className = 'szroam'; el.setAttribute('role', 'button'); el.tabIndex = 0;
el.setAttribute('aria-label', SZ.t('rb.aria'));
el.innerHTML = '<span class="rb-fig"></span><span class="rb-say" aria-live="polite"></span>';
document.body.appendChild(el);
const fig = el.querySelector('.rb-fig'), bub = el.querySelector('.rb-say');
const hero = document.getElementById('top');
let cur = '', said = new Set(), sayT = 0, heroOn = true, posed = '';
const small = () => matchMedia('(max-width:760px)').matches;
/* v3.8 · ancho visible de verdad: en el celular innerWidth crece si algo se sale un poco, y ella se paraba más afuera todavía
   (cada vez 28 px menos, pero ya fuera de la pantalla); clientWidth no cambia con eso */
const vw = () => document.documentElement.clientWidth || innerWidth;
function paint(k){
  const S = STOPS[k]; if (!S) return;
  const side = el.dataset.side || S.side, key = S.mood + S.pose + side;
  if (key !== posed){ SZ.synSet(fig, S.mood, S.pose === 'senala' ? (side === 'l' ? 'senala' : 'senalaL') : S.pose, small() ? 96 : 132); posed = key; }
}
/* en PC se para junto al título de cada sección (del lado con más espacio); en el celular, encima del título */
function anchor(k){
  const S = STOPS[k], sec = document.getElementById(k); if (!S || !sec) return;
  /* prueba cada título posible de la sección hasta encontrar uno donde quepa sin tapar nada */
  el.hidden = false;   /* v2.7: visible un instante (en el mismo cuadro) para medir su alto real; abajo se decide si se queda */
  const hs = [...new Set([...(S.at ? S.at.split('|') : []), '.head h2', 'h2'].map(q => sec.querySelector(q)).filter(Boolean))];
  for (const h of hs){ standAt(S, sec, h); if (!el.hidden) return; }
}
/* todo lo que se ve en la página (textos, tarjetas, botones, etiquetas): ella nunca se para encima de nada de esto */
const nearOf = h => [...document.querySelectorAll('main h2,main h3,main h4,main p,main a,main button,main img,main li,main summary,main .lqg,main .card,main .band,main .chip,main canvas,main .gi,main .uscene')].filter(e => e !== h && !h.contains(e) && !e.contains(h) && !el.contains(e));
const hitsIn = (near, x0, y0, ww, hh) => near.some(e => { const r = e.getBoundingClientRect(); return r.width && r.height && Math.min(x0 + ww, r.right) - Math.max(x0, r.left) > 4 && Math.min(y0 + hh, r.bottom) - Math.max(y0, r.top) > 4; });
/* celular: ya no flota fija tapando tarjetas; se para en el espacio libre encima del título de cada sección */
function standSmall(t, w, H){
  const near = nearOf(document.createElement('i')), x = vw() - w - 28, top = t.top - H * .9;   /* 28 px: deja espacio a su brazo cuando lo levanta */
  el.hidden = hitsIn(near, x + w * .15, top + H * .04, w * .7, H * .92) || top + scrollY < 90; if (el.hidden) return;
  el._mute = true; bub.style.marginLeft = ''; el.classList.add('abs'); el.classList.remove('bside'); el.dataset.side = 'r';
  el._x = Math.round(x + scrollX); el._top = Math.round(top + scrollY); stick();
}
function standAt(S, sec, h){
  /* el título se escribe letra por letra: se mide el texto completo (no lo que ya se ve) */
  const cs = getComputedStyle(h), R = h.getBoundingClientRect(), fs = parseFloat(cs.fontSize) || 40;
  const cx = (anchor.cv || (anchor.cv = document.createElement('canvas'))).getContext('2d'); cx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
  const txt = h.textContent.trim(), ls = parseFloat(cs.letterSpacing) || 0;
  /* v4.2 · si la letra de la página aún no cargó, el lienzo mide con otra letra (más angosta) y ella quedaba encima del título:
     se usa lo más ancho entre esa medida y lo que el texto ocupa de verdad en pantalla */
  const rg = document.createRange(); rg.selectNodeContents(h); const seen = rg.getBoundingClientRect().width || 0;
  const tw = Math.min(R.width, Math.max(seen, cx.measureText(txt).width + ls * txt.length));
  const lh = Math.min(R.height, parseFloat(cs.lineHeight) || fs * 1.1), al = cs.textAlign;
  const l0 = al === 'center' ? R.left + (R.width - tw) / 2 : al === 'right' || al === 'end' ? R.right - tw : R.left;
  const t = { left:l0, right:l0 + tw, top:R.top, height:lh };
  const w = el.offsetWidth || 132, H = el.offsetHeight || 176, gap = 26;
  if (small()) return standSmall(t, w, H);
  /* la frase va al lado de ella (no encima), así no tapa lo que hay arriba; se mide con el texto ya puesto */
  bub.textContent = S.say; const bw = Math.min(230, bub.offsetWidth || 200) + 10;
  const roomR = vw() - t.right - gap, roomL = t.left - gap;
  /* primero el lado donde caben ella y su frase; si no, donde quepa ella sola */
  const need = w + bw + 12, pr = S.side === 'r' ? roomR : roomL, ot = S.side === 'r' ? roomL : roomR, other = S.side === 'r' ? 'l' : 'r';
  const pick = pr >= need ? S.side : ot >= need ? other : pr >= w ? S.side : ot >= w ? other : S.side;
  const top = t.top + t.height - H + 14 + H * .08;   /* v2.9: sin cuerpo, lo de abajo de su caja es solo sombra: baja un poco */
  const xOf = sd => Math.max(8, Math.min(vw() - w - 8, sd === 'r' ? t.right + gap : t.left - gap - w));
  /* v2.6: nunca encima de nada: si de un lado pisa un texto, una tarjeta o una etiqueta, prueba el otro; si pisa en los dos, esa sección no la muestra */
  const near = nearOf(h);
  const hits = (x0, y0, ww, hh) => hitsIn(near, x0, y0, ww, hh);
  const figHits = sd => { const x0 = xOf(sd); return hits(x0 + w * .18, top + H * .04, w * .64, H * .92) || (sd === 'r' ? x0 < t.right - 6 : x0 + w > t.left + 6); };
  let side = pick; if (figHits(side)) side = side === 'r' ? 'l' : 'r';
  el.hidden = figHits(side); if (el.hidden) return;
  const x = xOf(side);
  /* la frase va a su lado solo si cabe sin tapar nada; si no, no habla sola (si la tocas, te contesta en su ventanita) */
  const bside = (side === 'r' ? vw() - (x + w) - 12 >= bw : x - 12 >= bw) && !hits(side === 'r' ? x + w + 6 : x - bw - 6, top + H * .15, bw, 64);
  el._mute = !bside; bub.style.marginLeft = '';
  el.classList.add('abs'); el.classList.toggle('bside', bside); el.dataset.side = side;
  /* parada sobre la línea del título: los pies a la altura de las letras, nunca encima del texto de abajo */
  el._x = Math.round(x + scrollX); el._top = Math.round(top + scrollY); stick();
  /* v3.0: la frase encima de ella se corre lo justo para no salirse de la pantalla (en inglés es más larga) */
  if (!bside){ const bw2 = bub.offsetWidth, L = x + w * (side === 'r' ? .3 : .7) - bw2 / 2; bub.style.marginLeft = Math.round(Math.min(0, vw() - 8 - L - bw2) || Math.max(0, 8 - L)) + 'px'; }
}
/* se queda junto a su título y sube con él: nunca flota encima de las tarjetas ni del texto */
function stick(){
  if (!el.classList.contains('abs') || el._top == null) return;
  el.style.left = el._x + 'px'; el.style.top = el._top + 'px';
}
function place(k, fly){
  const S = STOPS[k]; if (!S) return;
  const from = el.getBoundingClientRect();
  /* v2.7: se dibuja primero con su tamaño real (si no, la primera vez se medía con un alto de reserva y quedaba flotando más arriba) */
  paint(k); anchor(k); paint(k);
  if (fly && !reduce && from.width){
    const to = el.getBoundingClientRect(), dx = from.left - to.left, dy = from.top - to.top;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4)
      el.animate([
        { transform:'translate(' + dx + 'px,' + dy + 'px) rotate(0deg)' },
        { transform:'translate(' + dx * .5 + 'px,' + (dy * .5 - 90) + 'px) rotate(' + (dx > 0 ? -14 : 14) + 'deg) scale(1.06)', offset:.5 },
        { transform:'translate(0,0) rotate(0deg)' }
      ], { duration:1100, easing:'cubic-bezier(.45,0,.2,1)' });
  }
  /* en el celular no habla sola: la frase taparía las tarjetas (si la tocas, te habla en su ventanita) */
  if (!said.has(k) && !small() && !el._mute){ said.add(k); say(S.say, fly ? 1100 : 300); }
}
function say(t, delay){
  clearTimeout(sayT);
  sayT = setTimeout(() => {
    bub.textContent = t; el.classList.add('talk');
    const f = el.querySelector('.szbody'); if (f) f.classList.add('talking');
    sayT = setTimeout(() => { el.classList.remove('talk'); const g = el.querySelector('.szbody'); if (g) g.classList.remove('talking'); }, 3600);
  }, delay || 0);
}
function update(){
  heroOn = !!hero && hero.getBoundingClientRect().bottom > innerHeight * .45;
  const mid = innerHeight * .45; let best = '';
  for (const k of Object.keys(STOPS)){ const s = document.getElementById(k); if (!s) continue; const r = s.getBoundingClientRect(); if (r.top < mid && r.bottom > mid * .6){ best = k; } }
  const rd = document.querySelector('#faq .ready'), rr = rd && rd.getBoundingClientRect(), readyOn = rr && rr.top < innerHeight * .8 && rr.bottom > 0;
  const show = !heroOn && !readyOn && !!best && !document.querySelector('.szm.on, #intro, #vintro');
  el.classList.toggle('on', show);
  if (show && best !== cur){ const first = !cur; cur = best; place(best, !first); }
}

let raf = 0;
addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); stick(); }); }, { passive:true, capture:true });
addEventListener('resize', () => { posed = ''; if (cur){ paint(cur); anchor(cur); } update(); });
/* los títulos se escriben letra por letra: cuando cambian de tamaño, se vuelve a acomodar */
if ('ResizeObserver' in window){ const ro = new ResizeObserver(() => { if (cur) anchor(cur); }); Object.keys(STOPS).forEach(k => { const h = document.querySelector('#' + k + ' .head h2'); if (h) ro.observe(h); });
  /* v2.7: y si algo de arriba crece (una tarjeta que se llena después), el título baja: ella se vuelve a parar junto a él */
  const mn = document.querySelector('main'); if (mn) ro.observe(mn); }
/* los ojos la siguen: el puntero */
if (!reduce && matchMedia('(pointer: fine)').matches){
  let r2 = 0;
  addEventListener('pointermove', e => { if (r2 || !el.classList.contains('on')) return; r2 = requestAnimationFrame(() => { r2 = 0; const r = el.getBoundingClientRect(); const ex = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / 420)), ey = Math.max(-1, Math.min(1, (e.clientY - r.top - 40) / 420)); el.style.setProperty('--ex', (ex * 3.2).toFixed(2) + 'px'); el.style.setProperty('--ey', (ey * 2.4).toFixed(2) + 'px'); el.style.setProperty('--tilt', (ex * 5).toFixed(2) + 'deg'); }); }, { passive:true });
}
/* tocarla: se pone contenta y abre su ventanita */
const open = () => {
  posed = ''; SZ.synSet(fig, 'celebrando', 'celebra', small() ? 96 : 132);
  try{ SZ.SND && SZ.SND.blip && SZ.SND.blip('feliz'); }catch(e){}
  setTimeout(() => { if (cur) paint(cur); }, 1500);
  try{ SZ.BOT && SZ.BOT.open && SZ.BOT.open(); }catch(e){}
};
el.addEventListener('click', open);
el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); } });
/* de vez en cuando parpadea distinto o mira a su alrededor para que se sienta viva */
if (!reduce) setInterval(() => {
  if (!el.classList.contains('on') || el.classList.contains('talk') || document.hidden) return;
  const k = cur, S = STOPS[k]; if (!S) return;
  const alt = ['guino', 'feliz', 'sorprendida', 'pensando'][Math.floor(Math.random() * 4)];
  SZ.synSet(fig, alt, S.pose, small() ? 96 : 132); posed = '';
  setTimeout(() => { if (cur === k) paint(k); }, 1400);
}, 9000);
/* v2.6: en la portada Sona de cuerpo entero ES la ayudante: no hay botón, y su ventanita sale de donde esté parada
   (arriba en la portada, caminando por las secciones o celebrando al final) */
document.documentElement.classList.add('szlive');
const shown = n => { if (!n) return false; const r = n.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; };
if (SZ.BOT && SZ.BOT.anchor) SZ.BOT.anchor(() => el.classList.contains('on') ? el : shown(document.getElementById('heroBot')) ? document.getElementById('heroBot') : shown(document.getElementById('readyFace')) ? document.getElementById('readyFace') : el);
update();
})();
/* ===== v2.6 · un solo fondo liviano: cada sección solo se mueve mientras la ves
   y el fondo espacial de arriba se apaga cuando ya bajaste de la portada ===== */
(() => {
const bgs = [...document.querySelectorAll('.secbg')];
if (!('IntersectionObserver' in window)){ bgs.forEach(b => b.classList.add('run')); return; }
const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('run', e.isIntersecting)), { rootMargin:'60px 0px' });
bgs.forEach(b => io.observe(b));
const hero = document.getElementById('top'), H = document.documentElement;
/* el espacio de arriba (cinta de neón, estrellas, brillos) mide lo que mide la portada y baja con la página */
const fitHero = () => { if (hero) H.style.setProperty('--heroH', (hero.offsetHeight + 180) + 'px'); };
fitHero(); addEventListener('resize', fitHero); addEventListener('load', fitHero);
if (hero) new IntersectionObserver(([e]) => {
  H.classList.toggle('sb-off', !e.isIntersecting);
  if (e.isIntersecting && SZ.SPACE && SZ.SPACE.wake) SZ.SPACE.wake();
}).observe(hero);
})();
/* ===== v2.6 · la burbujita que explica cada nombre propio (las palabras se marcan en 00-aa-glosario.js) ===== */
(() => {
/* una sola burbujita para todos: se acomoda arriba de la palabra y nunca se sale de la pantalla */
const tip = document.createElement('div'); tip.id = 'szTip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true; document.body.appendChild(tip);   /* v3.0: escondida (sin nombre vacío) hasta que explica algo */
let on = null, at = 0;
const show = el => {
  if (on !== el) at = Date.now();
  on = el; tip.textContent = el.dataset.def; tip.hidden = false; tip.classList.add('on');
  const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  const x = Math.max(10, Math.min(innerWidth - w - 10, r.left + r.width / 2 - w / 2)), up = r.top - h - 10 > 70;
  tip.style.left = x + 'px'; tip.style.top = (up ? r.top - h - 10 : r.bottom + 10) + 'px'; tip.dataset.up = up ? '1' : '0';
  tip.style.setProperty('--ax', Math.max(14, Math.min(w - 14, r.left + r.width / 2 - x)) + 'px');
};
const hide = () => { on = null; tip.classList.remove('on'); };
document.addEventListener('pointerover', e => { const t = e.target.closest && e.target.closest('.term'); if (t && e.pointerType === 'mouse') show(t); });
document.addEventListener('pointerout', e => { const t = e.target.closest && e.target.closest('.term'); if (t && e.pointerType === 'mouse' && !t.contains(e.relatedTarget)) hide(); });
document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('term')) show(e.target); });
document.addEventListener('focusout', e => { if (e.target.classList && e.target.classList.contains('term')) hide(); });
document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('.term'); if (t){ e.preventDefault(); on === t && Date.now() - at > 400 ? hide() : show(t); }  /* al tocar, el foco ya la abrió: el mismo toque no la cierra */ else if (on) hide(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && on) hide(); });
addEventListener('scroll', () => { if (on) hide(); }, { passive:true });
})();
/* ===== v2.6 · «¿Qué IA es mejor para…?»: lo que más busca la gente, al lado de «Compáralas a ciegas» ===== */
(() => {
document.querySelectorAll('.bf-ais').forEach(el => {
  el.innerHTML = el.dataset.ais.split(',').map(x => { const [n, v] = x.split(':'); return '<span class="bf-ai">' + SZ.glassIcon({ id:v, vendor:v, name:n }, 'xs') + n + '</span>'; }).join('');
});
})();
/* ===== v2.6 · botón «Instalar la app» (en el pie, en el menú ☰ y en Preguntas).
   Android y computador (Chrome, Edge): abre el diálogo de instalar del navegador.
   iPhone: muestra los pasos (Compartir › Agregar a inicio). Si ya está instalada, los botones no aparecen. ===== */
(() => {
const btns = () => document.querySelectorAll('[data-install],[data-install-note]');
const hideAll = () => btns().forEach(b => { b.hidden = true; });
if (SZ.appStandalone && SZ.appStandalone()){ hideAll(); return; }
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('button[data-install]'); if (!b) return;
  e.preventDefault();
  const nd = document.getElementById('navDrop'); if (nd && nd.contains(b)) nd.hidden = true;
  /* sin instalación directa (iPhone, Firefox…), la ventana abre ya con los 3 pasos a la vista */
  /* v4.1 · en Windows primero se ve la ventana: ahí está el instalador propio (Obertura) y, debajo, el del navegador */
  if (SZ.appWin && SZ.appWin()){ SZ.appPromo(true); return; }
  Promise.resolve(SZ.appInstall ? SZ.appInstall() : SZ.appPromo(true)).then(ok => {
    if (ok){ hideAll(); return; }
    const go = document.querySelector('#appPromo [data-ap="go"]'); if (!go) return;
    go.click(); setTimeout(() => { const a = document.querySelector('#appPromo .ap-acts'); if (a) a.scrollIntoView({ block:'end', behavior:'smooth' }); }, 450);
  }).catch(() => {});
});
addEventListener('appinstalled', hideAll);
})();
/* ===== v2.7 · «Sona es para ti»: las tres escenas, dibujadas en código (antes eran imágenes pegadas).
   Cada escena es un escenario de 400 × 214 con sus cosas atrás, Sona (la misma de toda la página) y lo que va adelante.
   Todo se mueve en vivo: hojas que flotan, la página del libro que pasa, código que se escribe, errores que se arreglan,
   un documento que se arma solo. Cuando la escena no se ve, se queda quieta (cero trabajo de más). ===== */
(() => {
if (!SZ.synBody) return;
const G = (k, o) => 'fill="url(#gi' + k + ')" fill-opacity="' + (o == null ? .2 : o) + '" stroke="url(#gi' + k + ')"';
/* una hoja suelta, un libro acostado y una ventana de vidrio */
const sheet = (x, y, r, s, k, d) => '<g class="usc-fl" style="--d:' + d + 's"><g transform="translate(' + x + ' ' + y + ') rotate(' + r + ') scale(' + s + ')">'
  + '<path d="M0 0h28l9 9v33H0z" ' + G(k, .16) + ' stroke-width="1.6"/><path d="M28 0v9h9" fill="none" stroke="url(#gi' + k + ')" stroke-width="1.4"/>'
  + '<path d="M6 15h22M6 21h25M6 27h17M6 33h21" stroke="#e8fbff" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/></g></g>';
const book = (x, y, w, h, k) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3" ' + G(k, .3) + ' stroke-width="1.5"/>'
  + '<path d="M' + (x + w - 7) + ' ' + (y + 3) + 'v' + (h - 6) + 'M' + (x + 6) + ' ' + (y + h / 2) + 'h' + (w * .45) + '" stroke="#fff" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round"/>';
const win = (x, y, w, h, k, body, d) => '<g class="usc-fl" style="--d:' + d + 's"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="7" ' + G(k, .12) + ' stroke-width="1.5"/>'
  + '<path d="M' + x + ' ' + (y + 12) + 'h' + w + '" stroke="url(#gi' + k + ')" stroke-opacity=".5"/>'
  + [0, 1, 2].map(i => '<circle cx="' + (x + 8 + i * 6) + '" cy="' + (y + 6) + '" r="1.8" fill="url(#gi' + ['R', 'Y', 'G'][i] + ')"/>').join('') + body + '</g>';
/* líneas de código que se escriben solas (cada una con su color y su turno) */
const code = (x, y, rows) => rows.map(([dx, len, k], i) => '<path class="usc-type" pathLength="1" style="--i:' + i + ';--len:' + len + '" d="M' + (x + dx) + ' ' + (y + i * 7) + 'h' + len + '" stroke="url(#gi' + k + ')" stroke-width="2.6" stroke-linecap="round"/>').join('');
/* un error que se arregla: el triángulo de aviso se vuelve un visto verde, y vuelta a empezar */
const bug = (x, y, d) => '<g class="usc-bug" style="--d:' + d + 's" transform="translate(' + x + ' ' + y + ')"><g class="bw"><path d="M0-9L9 7H-9z" ' + G('Y', .35) + ' stroke-width="1.6" stroke-linejoin="round"/><path d="M0-3v4M0 4v.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g>'
  + '<g class="bo"><circle r="8.5" ' + G('G', .35) + ' stroke-width="1.6"/><path d="M-3.8 0l2.6 2.8 5-5.4" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></g></g>';
const star = (x, y, s, k, d) => '<path class="usc-star" style="--d:' + d + 's" transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M0-10c1 7 3 9 10 10-7 1-9 3-10 10-1-7-3-9-10-10 7-1 9-3 10-10z" fill="url(#gi' + k + ')"/>';
const dust = (cx, cy, n, k) => Array.from({ length:n }, (_, i) => '<circle class="usc-rise" style="--d:' + (-i * .7).toFixed(1) + 's" cx="' + (cx + ((i * 37) % 60) - 30) + '" cy="' + cy + '" r="' + (1 + (i % 3) * .5) + '" fill="url(#gi' + k + ')"/>').join('');
const SCENES = {
  /* estudia: Sona lee un libro que brilla, con hojas flotando y pilas de libros a los lados */
  study: { mood:'feliz', pose:'lee', bot:'--bx:50%;--bw:45%;--bb:-19%',
    back: sheet(56, 26, -14, 1, 'C', 0) + sheet(318, 20, 12, .95, 'V', -2.2) + sheet(300, 96, -8, .75, 'C', -3.6) + sheet(98, 104, 10, .7, 'P', -1.3)
      + book(28, 184, 72, 15, 'V') + book(36, 170, 62, 14, 'C') + book(30, 157, 58, 13, 'P') + book(302, 184, 70, 15, 'O') + book(310, 170, 56, 14, 'V')
      + star(150, 40, .7, 'C', 0) + star(262, 58, .5, 'Y', -1.1),
    front: '<g transform="translate(0 -9)"><ellipse class="usc-glow" cx="200" cy="190" rx="54" ry="16" fill="url(#uscGlowC)"/>'
      + '<path d="M200 196c-15-6-33-7-49-3v21c16-4 34-3 49 3z" ' + G('C', .26) + ' stroke-width="1.6"/><path d="M200 196c15-6 33-7 49-3v21c-16-4-34-3-49 3z" ' + G('C', .26) + ' stroke-width="1.6"/>'
      + '<path d="M160 200c11-3 23-3 33 0M160 206c11-3 23-3 33 0M207 200c11-3 23-3 33 0M207 206c9-2 17-2 24 0" stroke="#e8fbff" stroke-opacity=".7" stroke-width="1.3" stroke-linecap="round" fill="none"/>'
      + '<path class="usc-page" d="M200 196c15-6 33-7 49-3v21c-16-4-34-3-49 3z" fill="#dffaff" fill-opacity=".5" stroke="#fff" stroke-opacity=".8"/>'
      + dust(200, 188, 6, 'C') + '</g>' },
  /* programa: Sona escribe en su escritorio de vidrio; el código aparece en ventanas flotantes y los errores se vuelven vistos verdes */
  code: { mood:'analizando', pose:'escribe', bot:'--bx:50%;--bw:45%;--bb:-19%',
    back: win(24, 26, 108, 74, 'P', '<path d="M50 56l-10 10 10 10M80 56l10 10-10 10M70 52l-10 28" fill="none" stroke="url(#giP)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' + code(98, 50, [[0, 22, 'C'], [4, 18, 'V'], [4, 24, 'Y'], [0, 14, 'C']]), 0)
      + win(272, 18, 110, 60, 'C', code(282, 40, [[0, 46, 'P'], [8, 62, 'C'], [8, 38, 'Y'], [0, 54, 'V'], [8, 30, 'G']]), -2)
      + win(290, 92, 94, 50, 'V', '<path d="M300 116l6 4-6 4" fill="none" stroke="url(#giG)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' + code(312, 113, [[0, 40, 'G'], [0, 26, 'W'], [0, 34, 'W']]), -3.4)
      + bug(130, 28, 0) + bug(380, 90, -2.5) + bug(270, 20, -4.2),
    front: '<path d="M44 188h312l30 17H14z" fill="url(#giP)" fill-opacity=".14" stroke="url(#uscIri)" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 205h372v12H14z" fill="url(#giV)" fill-opacity=".18" stroke="url(#uscIri)" stroke-width="1.4"/>'
      + '<path d="M60 191h280" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>'
      + '<ellipse class="usc-glow" cx="200" cy="196" rx="70" ry="10" fill="url(#uscGlowP)"/>'
      + '<path d="M152 192h96l8 10H144z" fill="#c9f6ff" fill-opacity=".14" stroke="url(#giC)" stroke-width="1.3" stroke-linejoin="round"/><path d="M154 195.5h92M151 199h98" stroke="#bff6ff" stroke-opacity=".75" stroke-width="1.6" stroke-dasharray="4 2.4"/>'
      /* la taza de café, con su vapor */
      + '<path d="M318 172h20v14a5 5 0 0 1-5 5h-10a5 5 0 0 1-5-5z" ' + G('O', .3) + ' stroke-width="1.5"/><path d="M338 176h3a4 4 0 0 1 0 8h-3" fill="none" stroke="url(#giO)" stroke-width="1.5"/>'
      + '<path class="usc-steam" d="M324 166q-3-5 0-9t0-9M332 166q-3-5 0-9t0-9" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5" stroke-linecap="round"/>' },
  /* crea: un documento de luz se arma solo encima de su proyector; Sona lo señala */
  create: { mood:'creando', pose:'senalaL', bot:'--bx:74%;--bw:42%;--bb:-16%',
    back: '<ellipse cx="112" cy="200" rx="44" ry="9" ' + G('O', .25) + ' stroke-width="1.6"/><ellipse cx="112" cy="198" rx="26" ry="4.5" fill="#ffe1b0" fill-opacity=".7"/>'
      + '<path class="usc-beam" d="M74 198L58 160L172 146L150 198Z" fill="url(#uscBeam)"/>'
      + '<g transform="matrix(1.12 -.12 .077 .969 48 34)">'
      +   '<rect width="100" height="130" rx="7" fill="url(#giO)" fill-opacity=".12" stroke="url(#uscIri)" stroke-width="1.6"/><path d="M8 4h70" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round"/>'
      +   '<rect class="usc-title" x="11" y="12" width="52" height="8" rx="4" fill="url(#giM)"/>'
      +   [30, 40, 50, 60, 70].map((y, i) => '<path class="usc-write" pathLength="1" style="--i:' + i + '" d="M11 ' + y + 'h' + [76, 68, 78, 56, 70][i] + '" stroke="#ffe8cc" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/>').join('')
      +   '<path d="M11 116h78" stroke="#fff" stroke-opacity=".25"/>' + [[16, 22, 'C'], [32, 30, 'V'], [48, 18, 'P'], [64, 36, 'O']].map(([x, h, k], i) => '<rect class="usc-bar" style="--i:' + i + '" x="' + x + '" y="' + (116 - h) + '" width="11" height="' + h + '" rx="2.5" fill="url(#gi' + k + ')"/>').join('')
      + '</g>'
      + star(34, 54, .9, 'Y', 0) + star(190, 30, .7, 'C', -.8) + star(186, 126, .55, 'P', -1.6) + star(34, 150, .6, 'O', -2.3) + dust(112, 194, 7, 'O'),
    front: '' }
};
/* los degradados propios de las escenas (una sola vez) */
document.getElementById('giDefs').querySelector('defs').insertAdjacentHTML('beforeend',
  '<radialGradient id="uscGlowC"><stop offset="0" stop-color="#bff6ff" stop-opacity=".7"/><stop offset="1" stop-color="#3de0ff" stop-opacity="0"/></radialGradient>'
  + '<radialGradient id="uscGlowP"><stop offset="0" stop-color="#ffb3dd" stop-opacity=".6"/><stop offset="1" stop-color="#ff3d9a" stop-opacity="0"/></radialGradient>'
  + '<linearGradient id="uscBeam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd29a" stop-opacity=".6"/><stop offset="1" stop-color="#ff7a45" stop-opacity=".04"/></linearGradient>'
  + '<linearGradient id="uscIri" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bff6ff"/><stop offset=".4" stop-color="#9b7bff"/><stop offset=".75" stop-color="#ff3d9a"/><stop offset="1" stop-color="#ffc857"/></linearGradient>');
const svg = (cls, s) => '<svg class="usc-svg ' + cls + '" viewBox="0 0 400 214" fill="none" aria-hidden="true">' + s + '</svg>';
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('usc-off', !e.isIntersecting)), { rootMargin:'60px' }) : null;
document.querySelectorAll('.uscene[data-scene]').forEach(el => {
  const S = SCENES[el.dataset.scene]; if (!S) return;
  el.innerHTML = svg('usc-back', S.back) + '<span class="usc-bot" style="' + S.bot + '">' + SZ.synBody(S.mood, S.pose) + '</span>' + (S.front ? svg('usc-front', S.front) : '');
  if (io){ el.classList.add('usc-off'); io.observe(el); }
});
})();
/* ===== v2.7 · portada más intuitiva (lo que se investigó y se aplicó):
   1. Nunca empezar en blanco: al tocar el cuadro de la portada aparecen 3 preguntas de ejemplo que funcionan tal cual
      (como las sugerencias de un buscador). Un toque y Sonyx abre con esa pregunta. Se cierran con Esc o al escribir.
   2. La acción principal siempre a mano: cuando «Empezar gratis» sale de la pantalla, aparece en el menú de arriba.
   3. Los botones dicen a dónde llevan: «Ver demo» ahora es «Cómo funciona» (baja a «Así de fácil»).
   4. Más liviana: lo que se mueve en una sección se queda quieto mientras esa sección no se ve. ===== */
(() => {
const { $ } = SZ;
const form = $('#heroAsk'), inp = $('#heroInp');
if (form && inp){
  const box = document.createElement('div');
  box.className = 'hsug'; box.id = 'heroSug'; box.setAttribute('role', 'listbox'); box.hidden = true;
  /* v3.7 · se vuelve a escribir si cambias el idioma (aquí o en otra pestaña), sin recargar */
  const fill = () => {
    const SUG = [['birrete', SZ.t('ix.sug1')], ['estrella', SZ.t('ix.sug2')], ['codigo', SZ.t('ix.sug3')]];
    box.setAttribute('aria-label', SZ.t('ix.sugAria'));
    box.innerHTML = '<p class="hsug-t">' + SZ.t('ix.sugT') + '</p>' + SUG.map(([ic, t], i) => '<button type="button" class="hsug-i" role="option" style="--i:' + i + '"><i class="gi" data-gi="' + ic + '"></i><span>' + t + '</span></button>').join('');
    SZ.giFill(box);
  };
  fill(); form.appendChild(box); if (SZ.onLang) SZ.onLang(fill);
  inp.setAttribute('aria-controls', 'heroSug'); inp.setAttribute('aria-autocomplete', 'list');
  let y0 = 0;
  const show = on => { if (on && box.hidden) y0 = scrollY; box.hidden = !on; inp.setAttribute('aria-expanded', on ? 'true' : 'false'); form.classList.toggle('sugon', on); };
  /* si bajas por la página, el menú se cierra solo (no se queda flotando encima de otras cosas) */
  addEventListener('scroll', () => { if (!box.hidden && Math.abs(scrollY - y0) > 60) show(false); }, { passive:true });
  inp.addEventListener('focus', () => show(!inp.value.trim()));
  inp.addEventListener('click', () => show(!inp.value.trim()));
  inp.addEventListener('input', () => show(!inp.value.trim()));
  /* se cierra cuando el foco sale del cuadro y de las sugerencias */
  form.addEventListener('focusout', () => setTimeout(() => { if (!form.contains(document.activeElement)) show(false); }, 120));
  form.addEventListener('keydown', e => {
    if (box.hidden) return;
    const its = [...box.querySelectorAll('.hsug-i')], k = its.indexOf(document.activeElement);
    if (e.key === 'Escape'){ show(false); inp.focus(); }
    else if (e.key === 'ArrowDown'){ e.preventDefault(); its[Math.min(its.length - 1, k + 1)].focus(); }
    else if (e.key === 'ArrowUp'){ e.preventDefault(); k <= 0 ? inp.focus() : its[k - 1].focus(); }
  });
  box.addEventListener('click', e => {
    const b = e.target.closest('.hsug-i'); if (!b) return;
    inp.value = b.textContent.trim(); show(false);
    form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable:true }));
  });
}
/* «Ver demo» decía demo pero bajaba a los pasos: ahora dice lo que hace */
const demo = $('#demoBtn');
const demoTxt = () => { if (demo && demo.firstChild && demo.firstChild.nodeType === 3) demo.firstChild.textContent = SZ.t('ix.demo') + ' '; };
demoTxt(); if (SZ.onLang) SZ.onLang(demoTxt);
/* el botón principal en el menú de arriba, solo cuando el de la portada ya no se ve */
const nav = $('#nav'), start = $('#startBtn'), navr = nav && nav.querySelector('.navr');
if (nav && start && navr && 'IntersectionObserver' in window){
  const go = document.createElement('a');
  go.className = 'navgo'; go.href = 'chat.html'; go.tabIndex = -1;
  const goTxt = () => { go.innerHTML = '<span class="ng-l">' + SZ.t('ix.020') + '</span><span class="ng-s">' + SZ.t('tour.start') + '</span>'; go.setAttribute('aria-label', SZ.t('ix.goAria')); };
  goTxt(); if (SZ.onLang) SZ.onLang(goTxt);
  navr.insertBefore(go, $('#accBtn') || navr.firstChild);
  new IntersectionObserver(([e]) => {
    const on = !e.isIntersecting && e.boundingClientRect.top < 0;
    nav.classList.toggle('go', on); go.tabIndex = on ? 0 : -1;
  }).observe(start);
}
/* cada sección pausa sus animaciones cuando sale de la pantalla y las sigue al volver */
if ('IntersectionObserver' in window){
  const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('secoff', !e.isIntersecting)), { rootMargin:'120px' });
  document.querySelectorAll('main > section, main > header').forEach(s => io.observe(s));
}
})();
/* ===== v3.0 · SymphorIA: la S se dibuja cuando se ve la sección, la chispa recorre la órbita (portador). Quieto cuando no se ve. ===== */
(() => {
const { $ } = SZ;
/* ES / EN: el botón de la barra cambia el idioma de toda la página (lo guarda 00b-idioma) */
const lb = $('#langBtn'); if (lb && SZ.setLang) lb.addEventListener('click', () => SZ.setLang(SZ.lang() === 'es' ? 'en' : 'es'));
const nd = $('#navDrop'); if (nd && SZ.setLang) nd.addEventListener('click', e => { if (e.target.closest('[data-nd="lang"]')) SZ.setLang(SZ.lang() === 'es' ? 'en' : 'es'); });
/* título y descripción de la pestaña en el idioma elegido */
const meta = () => { document.title = SZ.t('ix.title'); const d = document.querySelector('meta[name="description"]'); if (d) d.content = SZ.t('ix.metaDesc'); };
meta(); if (SZ.onLang) SZ.onLang(meta);
const sec = $('#nombre'), svg = $('.sy-svg', sec || document);
if (!sec) return;
const pause = on => { try{ if (svg && svg.pauseAnimations) on ? svg.unpauseAnimations() : svg.pauseAnimations(); }catch(e){} };
pause(false);
if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) sec.classList.add('on'); pause(en.isIntersecting); }), { threshold:.25 }).observe(sec);
else sec.classList.add('on');
})();
/* v3.8 · el cuadro de la portada, ahora al centro (ver src/index-css/11-v38-caja-centro.css):
   - la luz que lo rodea acelera mientras escribes
   - la tecla «/» te lleva al cuadro (como en los buscadores), salvo si ya estás escribiendo en otro lado
   - al enviar, la flecha despega como avión de papel mientras el cuadro se abre hacia Sonyx */
(() => {
const form = document.getElementById('heroAsk'), inp = document.getElementById('heroInp');
if (!form || !inp) return;
const send = form.querySelector('.send');

/* avión de papel escondido detrás de la flecha */
if (send && !send.querySelector('.hk-avion')){
  send.insertAdjacentHTML('beforeend', '<svg class="hk-avion" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5 21 3l-6.5 18-3.2-7.3L3 11.5Z"/><path d="m11.3 13.7 4-4"/></svg>');
}
/* la tecla «/» dentro del cuadro, antes de la flecha */
if (send && !form.querySelector('.hk-tecla')){
  const k = document.createElement('kbd'); k.className = 'hk-tecla'; k.textContent = '/'; k.setAttribute('aria-hidden', 'true');
  form.insertBefore(k, send);
}

/* v3.8b · el cuadro deja de ser una barra: es una consola con la esfera de SynthFlow a la izquierda (gira y se agita
   mientras escribes) y, abajo, tres ideas que se escriben solas en el cuadro al tocarlas. */
if (!form.querySelector('.hk-orbe')){
  const o = document.createElement('span'); o.className = 'hk-orbe'; o.setAttribute('aria-hidden', 'true');
  o.innerHTML = '<svg viewBox="0 0 64 64" fill="none"><defs><linearGradient id="hkOG" x1="0" x2="1"><stop offset="0" stop-color="#3de0ff"/><stop offset=".4" stop-color="#7b3ff2"/><stop offset=".72" stop-color="#ff3d9a"/><stop offset="1" stop-color="#ff7a45"/></linearGradient></defs><path class="hk-ola" d="M-24 32c5-12 10-12 14 0s9 12 14 0 9-12 14 0 9 12 14 0 9-12 14 0 9 12 14 0 9-12 14 0" stroke="url(#hkOG)" stroke-width="5" stroke-linecap="round"/></svg>';
  form.insertBefore(o, inp);
}
const ideas = document.createElement('div');
ideas.className = 'hk-ideas';
const pintaIdeas = () => {
  const L = [['birrete', SZ.t('ix.sug1')], ['estrella', SZ.t('ix.sug2')], ['codigo', SZ.t('ix.sug3')]];
  ideas.setAttribute('aria-label', SZ.t('ix.sugT'));
  ideas.innerHTML = L.map(([ic, t], i) => '<button type="button" class="hk-idea" style="--i:' + i + '"><i class="gi" data-gi="' + ic + '"></i><span>' + t + '</span></button>').join('');
  if (SZ.giFill) SZ.giFill(ideas);
};
if (!form.querySelector('.hk-ideas')){ pintaIdeas(); form.appendChild(ideas); if (SZ.onLang) SZ.onLang(pintaIdeas); }
/* tocar una idea la escribe letra por letra en el cuadro (con sus chispas); luego solo falta enviar */
let escribiendo = 0;
ideas.addEventListener('click', e => {
  const b = e.target.closest('.hk-idea'); if (!b) return;
  const t = b.textContent.trim(); clearInterval(escribiendo);
  inp.focus();
  if (document.documentElement.classList.contains('noanim')){ inp.value = t; inp.dispatchEvent(new Event('input', { bubbles:true })); return; }
  let n = 0; inp.value = '';
  escribiendo = setInterval(() => { n++; inp.value = t.slice(0, n); inp.dispatchEvent(new Event('input', { bubbles:true })); if (n >= t.length){ clearInterval(escribiendo); form.classList.add('lista'); setTimeout(() => form.classList.remove('lista'), 1200); } }, 22);
});

let tq = 0;
const quieto = () => document.documentElement.classList.contains('noanim');
const bot = document.getElementById('heroBot');
const cv = document.createElement('canvas').getContext('2d');
/* dónde va el cursor de texto (en px desde la izquierda del cuadro) */
const caretX = () => {
  const cs = getComputedStyle(inp), ir = inp.getBoundingClientRect();
  cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
  const w = cv.measureText(inp.value.slice(0, inp.selectionStart == null ? inp.value.length : inp.selectionStart)).width - inp.scrollLeft;
  return ir.left + Math.max(0, Math.min(ir.width, w));
};
const COL = ['#3de0ff', '#b48cff', '#ff3d9a', '#ffb36b', '#ffc857'];
let ci = 0;
/* chispas que saltan del cursor al escribir (recurso de estilo Uiverse #54) */
const chispa = x => {
  if (quieto()) return;
  const fr = form.getBoundingClientRect();
  for (let k = 0; k < 2; k++){
    const i = document.createElement('i'); i.className = 'hk-chispa'; i.setAttribute('aria-hidden', 'true');
    const ir = inp.getBoundingClientRect(); i.style.left = (x - fr.left) + 'px'; i.style.setProperty('--y', (ir.top + ir.height / 2 - fr.top).toFixed(1) + 'px'); i.style.background = COL[ci++ % COL.length];
    i.style.setProperty('--dx', (Math.random() * 44 - 22).toFixed(1) + 'px'); i.style.setProperty('--dy', (-18 - Math.random() * 30).toFixed(1) + 'px');
    form.appendChild(i); setTimeout(() => i.remove(), 750);
  }
};
/* Sona mira lo que escribes y asiente con cada letra */
const mira = x => {
  if (!bot) return;
  const r = bot.getBoundingClientRect(), ir = inp.getBoundingClientRect();
  if (!r.width) return;
  const ex = Math.max(-1, Math.min(1, (x - r.left - r.width / 2) / 500)), ey = Math.max(-1, Math.min(1, (ir.top - r.top - 90) / 500));
  bot.style.setProperty('--ex', (ex * 3.2).toFixed(2) + 'px'); bot.style.setProperty('--ey', (ey * 2.4).toFixed(2) + 'px');
  if (!quieto()){ bot.classList.remove('hk-asiente'); void bot.offsetWidth; bot.classList.add('hk-asiente'); }
};
inp.addEventListener('input', () => {
  form.classList.add('tecleo'); clearTimeout(tq); tq = setTimeout(() => form.classList.remove('tecleo'), 700);
  /* la luz crece mientras más escribes (hasta ~80 letras) */
  form.style.setProperty('--hkF', Math.min(1, inp.value.length / 80).toFixed(2));
  const x = caretX(); chispa(x); mira(x);
});

addEventListener('keydown', e => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
  const a = document.activeElement;
  if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return;
  if (document.querySelector('dialog[open],.modal.on,#szWin.on')) return;
  e.preventDefault();
  form.scrollIntoView({ behavior:document.documentElement.classList.contains('noanim') ? 'auto' : 'smooth', block:'center' });
  inp.focus({ preventScroll:true });
});

/* va en captura: corre antes que el envío de siempre (01-lanzador), que abre SynthFlow */
form.addEventListener('submit', () => { if (send && inp.value.trim()) send.classList.add('vuela'); }, true);
addEventListener('pageshow', () => send && send.classList.remove('vuela'));
})();
/* v3.8c · Pedido de Sammuel (2-nov-2026, eligió «B y C juntas»):
   B · «Sona te lo muestra en vivo»: en «Así de fácil», una ventanita de Sonyx de mentira que Sona maneja sola con su
       puntero (escribe, elige 3 IAs, envía, las respuestas llegan y elige la mejor). No llama a ninguna IA ni gasta EnerX.
       Arriba tiene pestañas con candado (Voz, Chats en grupo): son puertas falsas que llevan a votar.
   C · «El laboratorio»: sección nueva con tubos de ensayo, uno por función que todavía no existe. Arrastras tu batería de EnerX
       (o tocas «Votar») al tubo que quieres y el líquido sube con los votos de todos. Correo opcional para avisarte. Nada se cobra.
   Votos: /api/config (GET ?puertas=1 · POST { action:'puerta', id, email? }). Sin servidor, el voto queda en este equipo. */
(() => {
const como = document.getElementById('como');
if (!como || document.getElementById('szDemo')) return;
const L = () => (SZ.lang && SZ.lang() === 'en') ? 'en' : 'es';
const quieto = () => document.documentElement.classList.contains('noanim');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const dormir = ms => new Promise(r => setTimeout(r, ms));

const T = {
  es:{ demoT:'Mírala hacerlo', demoS:'Sona usa Sonyx por ti. Es una demostración: no gasta tu EnerX.', ejemplo:'Ejemplo',
    tabs:['Chat', 'Comparar', 'Voz', 'Chats en grupo'], q:'¿Cómo aprendo a programar desde cero?', escribe:'Pregúntale lo que sea…',
    resp:['Empieza con Python: es claro y sirve para todo. 20 minutos al día y un proyecto pequeño cada semana.', 'Elige algo que quieras crear (un juego, una página) y aprende solo lo que ese proyecto te pida.', 'Primero lógica con juegos como Scratch, luego Python. Repite poco cada día, no mucho un solo día.'],
    elige:'Esta', mejor:'La mejor', listo:'lista', pensando:'pensando…', candado:'Aún no existe. ¿La quieres?', quiero:'La quiero', gracias:'¡Anotado! Te escribimos solo cuando esté.', alLab:'Ver el laboratorio',
    votos:n => n === 0 ? 'Aún nadie dejó su correo' : n === 1 ? '1 persona dejó su correo' : n + ' personas dejaron su correo',
    labK:'El laboratorio', labT:'Tú decides qué inventamos después', labS:'Arrastra tu batería al tubo de la función que más quieres (o toca «La quiero») y déjanos tu correo. Cada correo llena el tubo. No cuesta nada.',
    bat:'Tu voto', votar:'La quiero', votado:'Anotado', correoT:'Para que cuente, déjanos tu correo: te avisamos solo cuando esté lista.', correoF:n => 'Para que tu voto por «' + n + '» cuente, déjanos tu correo. Te avisamos solo cuando esté lista.', correo:'Tu correo', avisame:'Avísame', correoOk:'Listo, te escribimos solo cuando esté.', correoMal:'Ese correo no parece válido.', fallo:'No pudimos guardarlo ahora. Intenta más tarde.', gratis:'Nada se cobra: solo queremos saber qué quieres.', soltar:'Suelta aquí',
    f:{ voz:['Hablar en voz alta', 'Pregunta con tu voz y escucha la respuesta.'], grupo:['Chats en grupo', 'Tú, tus amigos y las IAs en la misma conversación.'], agenda:['Tareas que se hacen solas', 'Un agente que trabaja a la hora que le digas.'], extension:['Extensión del navegador', 'Pregúntale a varias IAs desde cualquier página.'], escritorio:['App de escritorio', 'Sinapse en tu computador, con un atajo.'] } },
  en:{ demoT:'Watch her do it', demoS:'Sona uses Sonyx for you. It is a demo: it does not use your EnerX.', ejemplo:'Example',
    tabs:['Chat', 'Compare', 'Voice', 'Group chats'], q:'How do I learn to code from scratch?', escribe:'Ask it anything…',
    resp:['Start with Python: it is clear and works for everything. 20 minutes a day and a small project every week.', 'Pick something you want to build (a game, a page) and learn only what that project needs.', 'First logic with games like Scratch, then Python. A little every day beats a lot in one day.'],
    elige:'This one', mejor:'The best', listo:'done', pensando:'thinking…', candado:'This does not exist yet. Want it?', quiero:'I want it', gracias:'Got it! We will only write when it is ready.', alLab:'See the lab',
    votos:n => n === 0 ? 'Nobody has left their email yet' : n === 1 ? '1 person left their email' : n + ' people left their email',
    labK:'The lab', labT:'You decide what we build next', labS:'Drag your battery to the tube of the feature you want most (or tap «I want it») and leave your email. Every email fills the tube. It costs nothing.',
    bat:'Your vote', votar:'I want it', votado:'Counted', correoT:'For it to count, leave your email: we will only write when it is ready.', correoF:n => 'For your vote for «' + n + '» to count, leave your email. We will only write when it is ready.', correo:'Your email', avisame:'Let me know', correoOk:'Done, we will only write when it is ready.', correoMal:'That email does not look right.', fallo:'We could not save it right now. Try again later.', gratis:'Nothing is charged: we just want to know what you want.', soltar:'Drop it here',
    f:{ voz:['Talk out loud', 'Ask with your voice and hear the answer.'], grupo:['Group chats', 'You, your friends and the AIs in one conversation.'], agenda:['Tasks that run themselves', 'An agent that works at the time you choose.'], extension:['Browser extension', 'Ask several AIs from any web page.'], escritorio:['Desktop app', 'Sinapse on your computer, one shortcut away.'] } }
};
const t = () => T[L()];
const IAS = [['Llama', '#ff7a45'], ['Mistral', '#3de0ff'], ['Gemini', '#ff3d9a']];
const FUNCS = ['voz', 'grupo', 'agenda', 'extension', 'escritorio'];
const COLF = { voz:'#3de0ff', grupo:'#ff3d9a', agenda:'#ffc857', extension:'#b48cff', escritorio:'#ff7a45' };

/* ---------- votos (compartidos por la demo y el laboratorio) ---------- */
const VK = 'synthz:puertas';
let votos = {}; try{ votos = JSON.parse(localStorage.getItem(VK)) || {}; }catch(e){}
let cuentas = {};
const pintores = [];
const repinta = () => pintores.forEach(f => { try{ f(); }catch(e){} });
fetch('/api/config?puertas=1').then(r => r.ok ? r.json() : null).then(d => { if (d && d.puertas){ cuentas = d.puertas; repinta(); } }).catch(() => {});
/* v4.2 (Sammuel, 3 nov): un clic NO es «se interesó». Sin correo solo se anota el clic aparte (no se muestra);
   el tubo y el «N personas» cuentan solo a quien dejó su correo, y «Anotado» sale solo cuando el correo se guardó. */
async function votar(id, email){
  try{
    const r = await fetch('/api/config', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ action:'puerta', id, email:email || undefined, lang:L() }) });
    const d = await r.json().catch(() => null);
    if (r.ok && d && typeof d.n === 'number'){ cuentas[id] = d.n; }
    if (r.ok && email && d && d.saved){ votos[id] = Date.now(); try{ localStorage.setItem(VK, JSON.stringify(votos)); }catch(e){} }
    repinta();
    return r.ok;
  }catch(e){ return false; }
}

/* =================== B · la demo =================== */
const demo = document.createElement('div');
demo.className = 'dm'; demo.id = 'szDemo';
const grid = como.querySelector('.how-grid');
(grid ? grid.nextSibling : null) ? como.insertBefore(demo, grid.nextSibling) : como.appendChild(demo);
const MANO = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 3l20 11.2-8.6 2.2L12 25.5z" fill="#0b0b12" stroke="url(#dmMG)" stroke-width="1.9" stroke-linejoin="round"/><circle cx="12.4" cy="17.4" r="1.5" fill="#ff7ac0"/><defs><linearGradient id="dmMG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ac0"/><stop offset=".5" stop-color="#a866ff"/><stop offset="1" stop-color="#3de0ff"/></linearGradient></defs></svg>';
function pintaDemo(){
  const x = t();
  demo.innerHTML =
    '<div class="dm-cab"><h3>' + esc(x.demoT) + '</h3><p>' + esc(x.demoS) + '</p></div>' +
    '<div class="dm-win lqg">' +
      '<div class="dm-bar"><i></i><i></i><i></i><div class="dm-tabs" role="tablist">' +
        x.tabs.map((n, i) => i < 2
          ? '<span class="dm-tab' + (i === 1 ? ' on' : '') + '" role="tab" aria-selected="' + (i === 1) + '">' + esc(n) + '</span>'
          : '<button type="button" class="dm-tab lock" data-f="' + (i === 2 ? 'voz' : 'grupo') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>' + esc(n) + '</button>').join('') +
      '</div><span class="dm-tag">' + esc(x.ejemplo) + '</span></div>' +
      '<div class="dm-pop" hidden></div>' +
      '<div class="dm-in"><span class="dm-orb">' + (SZ.flowOrb ? SZ.flowOrb() : '') + '</span><span class="dm-q" data-ph="' + esc(x.escribe) + '"></span><b class="dm-car"></b><span class="dm-send"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>' +
      '<div class="dm-ias">' + IAS.map(([n, c], i) => '<span class="dm-ia" style="--c:' + c + '" data-i="' + i + '"><i></i>' + n + '</span>').join('') + '</div>' +
      '<div class="dm-cols">' + IAS.map(([n, c], i) => '<div class="dm-col" style="--c:' + c + '" data-i="' + i + '"><header><i></i><b>' + n + '</b><small class="dm-st"></small></header><p class="dm-r"></p><footer><span class="dm-pick">' + esc(x.elige) + '</span></footer></div>').join('') + '</div>' +
      '<span class="dm-mano" aria-hidden="true">' + MANO + '<span class="dm-cara"></span></span>' +
    '</div>';
  const cara = demo.querySelector('.dm-cara'); if (cara && SZ.face) cara.innerHTML = SZ.face('feliz', 30);
}
pintaDemo();

/* pestañas con candado: puerta falsa */
demo.addEventListener('click', e => {
  const b = e.target.closest('.dm-tab.lock'), pop = demo.querySelector('.dm-pop');
  if (b){
    const f = b.dataset.f, x = t(), r = b.getBoundingClientRect(), w = demo.querySelector('.dm-win').getBoundingClientRect();
    pop.dataset.f = f; pop.style.left = Math.max(8, Math.min(w.width - 250, r.left - w.left)) + 'px';
    const pinta = () => { const y = t(), av = pop.querySelector('.dm-aviso'), m = av ? av.textContent : ''; pop.innerHTML = '<p><b>' + esc(x.tabs[f === 'voz' ? 2 : 3]) + '</b> · ' + esc(y.candado) + '</p>' + (votos[f] ? '<p class="dm-ok">' + esc(y.gracias) + '</p>' : pop.dataset.form === f ? '<form class="dm-form" novalidate><label for="dmMail">' + esc(y.correoT) + '</label><div><input id="dmMail" type="email" inputmode="email" autocomplete="email" maxlength="254" placeholder="' + esc(y.correo) + '"><button type="submit">' + esc(y.avisame) + '</button></div><p class="dm-aviso" role="status">' + esc(m) + '</p></form>' : '<button type="button" class="dm-quiero">♥ ' + esc(y.quiero) + '</button>') + '<small>' + esc(y.votos(cuentas[f] || 0)) + '</small><a href="#szLab">' + esc(y.alLab) + ' ↓</a>'; };
    pop.dataset.form = ''; pinta(); pop.hidden = false; pop._pinta = () => { const i = pop.querySelector('#dmMail'), v = i ? i.value : '', foco = i && document.activeElement === i; pinta(); const j = pop.querySelector('#dmMail'); if (j){ j.value = v; if (foco) j.focus(); } };
    return;
  }
  if (e.target.closest('.dm-quiero')){ const f = pop.dataset.f; votar(f); pop.dataset.form = f; pop._pinta && pop._pinta(); const i = pop.querySelector('#dmMail'); if (i) i.focus({ preventScroll:true }); return; }
  if (!e.target.closest('.dm-pop')) pop.hidden = true;
});
demo.addEventListener('submit', async e => {
  const fm = e.target.closest('.dm-form'); if (!fm) return; e.preventDefault();
  const pop = demo.querySelector('.dm-pop'), av = fm.querySelector('.dm-aviso'), x = t(), c = fm.querySelector('input').value.trim().toLowerCase();
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(c)){ av.textContent = x.correoMal; return; }
  av.textContent = '…';
  const ok = await votar(pop.dataset.f, c);
  if (!ok){ const a = pop.querySelector('.dm-aviso'); if (a) a.textContent = x.fallo; }
});
pintores.push(() => { const p = demo.querySelector('.dm-pop'); if (p && !p.hidden && p._pinta) p._pinta(); });

/* la película: Sona maneja la ventanita */
let corrida = 0, visible = false;
const $d = s => demo.querySelector(s);
function manoA(el, dx = .5, dy = .55){
  const w = $d('.dm-win'), m = $d('.dm-mano'); if (!w || !m || !el) return;
  const a = w.getBoundingClientRect(), b = el.getBoundingClientRect();
  m.style.transform = 'translate(' + (b.left - a.left + b.width * dx - 6).toFixed(0) + 'px,' + (b.top - a.top + b.height * dy - 4).toFixed(0) + 'px)';
}
const clic = async () => { const m = $d('.dm-mano'); if (!m) return; m.classList.remove('clic'); void m.offsetWidth; m.classList.add('clic'); await dormir(260); };
function final(){
  const x = t(); $d('.dm-q').textContent = x.q;
  demo.querySelectorAll('.dm-ia').forEach(i => i.classList.add('on'));
  demo.querySelectorAll('.dm-col').forEach((c, i) => { c.querySelector('.dm-r').textContent = x.resp[i]; c.classList.add('lista'); c.querySelector('.dm-st').textContent = x.listo; });
  const best = demo.querySelectorAll('.dm-col')[1]; best.classList.add('mejor'); best.querySelector('.dm-pick').textContent = '★ ' + x.mejor;
}
async function pelicula(){
  const mi = ++corrida, sigue = () => mi === corrida && visible;
  /* v4.2 · si la ventanita del candado está abierta (quizá escribiendo el correo), la película espera: no se borra lo que escribes */
  const abierta = () => { const p = demo.querySelector('.dm-pop'); return p && !p.hidden; };
  while (sigue() && abierta()) await dormir(800);
  if (!sigue()) return;
  pintaDemo();
  if (quieto()){ final(); return; }
  const x = t(), m = $d('.dm-mano');
  m.classList.add('on'); m.style.transition = 'none'; manoA($d('.dm-cols'), .9, .9); void m.offsetWidth; m.style.transition = '';
  await dormir(500); if (!sigue()) return;
  manoA($d('.dm-q'), .1); await dormir(800); if (!sigue()) return; await clic();
  const q = $d('.dm-q'); q.classList.add('escribe');
  for (let n = 1; n <= x.q.length; n++){ q.textContent = x.q.slice(0, n); await dormir(38 + Math.random() * 40); if (!sigue()) return; }
  q.classList.remove('escribe');
  for (const ia of demo.querySelectorAll('.dm-ia')){ manoA(ia); await dormir(520); if (!sigue()) return; await clic(); ia.classList.add('on'); }
  manoA($d('.dm-send')); await dormir(600); if (!sigue()) return; await clic();
  $d('.dm-send').classList.add('vuela');
  const cols = [...demo.querySelectorAll('.dm-col')], vel = [1, .8, .9];
  cols.forEach(c => { c.classList.add('piensa'); c.querySelector('.dm-st').textContent = x.pensando; });
  manoA($d('.dm-cols'), .5, 1.05);
  await dormir(700); if (!sigue()) return;
  const t0 = performance.now();
  await new Promise(res => { const tic = () => { if (!sigue()) return res(); const ms = performance.now() - t0; let fin = true;
    cols.forEach((c, i) => { const p = Math.min(1, ms / (2600 / vel[i])), r = x.resp[i]; c.querySelector('.dm-r').textContent = r.slice(0, Math.round(r.length * p)); if (p >= 1 && !c.classList.contains('lista')){ c.classList.remove('piensa'); c.classList.add('lista'); c.querySelector('.dm-st').textContent = x.listo; } if (p < 1) fin = false; });
    fin ? res() : requestAnimationFrame(tic); }; requestAnimationFrame(tic); });
  if (!sigue()) return;
  await dormir(500); manoA(cols[1].querySelector('.dm-pick')); await dormir(900); if (!sigue()) return; await clic();
  cols[1].classList.add('mejor'); cols[1].querySelector('.dm-pick').textContent = '★ ' + x.mejor;
  cols.forEach((c, i) => i !== 1 && c.classList.add('apagada'));
  if (SZ.burst){ const b = cols[1].getBoundingClientRect(); SZ.burst(b.left + b.width / 2, b.top + 20, undefined, 14); }
  manoA($d('.dm-tab.lock'), .5, 1.4); await dormir(1200); if (!sigue()) return;
  await dormir(3600); if (!sigue()) return;
  pelicula();
}
if ('IntersectionObserver' in window){
  new IntersectionObserver(([e]) => { const v = e.isIntersecting; if (v && !visible){ visible = true; pelicula(); } else if (!v && visible){ visible = false; corrida++; } }, { threshold:.35 }).observe(demo);
}else final();

/* =================== C · el laboratorio =================== */
const lab = document.createElement('section');
lab.id = 'szLab'; lab.className = 'lab';
const ancla = document.getElementById('faq');
ancla && ancla.parentNode ? ancla.parentNode.insertBefore(lab, ancla) : como.parentNode.appendChild(lab);
const BAT = '<svg viewBox="0 0 40 22" aria-hidden="true"><rect x="1" y="1" width="34" height="20" rx="5" fill="rgba(20,12,44,.7)" stroke="rgba(255,255,255,.7)" stroke-width="1.6"/><rect x="36" y="7" width="3" height="8" rx="1.5" fill="rgba(255,255,255,.7)"/><rect x="4" y="4" width="28" height="14" rx="3" fill="url(#labBG)"/><path d="M20 5.5 15 12h4l-1.5 5 5.5-7h-4l1-4.5Z" fill="#fff"/><defs><linearGradient id="labBG" x1="0" x2="1"><stop offset="0" stop-color="#3de0ff"/><stop offset="1" stop-color="#7fe0b8"/></linearGradient></defs></svg>';
function pintaLab(){
  const x = t();
  lab.setAttribute('aria-label', x.labK);
  lab.innerHTML = '<div class="head"><p class="lab-k">' + esc(x.labK) + '</p><h2>' + esc(x.labT) + '</h2><p class="lab-s">' + esc(x.labS) + '</p></div>' +
    '<div class="lab-mesa lqg">' +
      '<div class="lab-bat" tabindex="-1" aria-hidden="true">' + BAT + '<span>' + esc(x.bat) + '</span></div>' +
      '<div class="lab-tubos">' + FUNCS.map(f => '<div class="lab-tubo" data-f="' + f + '" style="--c:' + COLF[f] + '">' +
        '<div class="lab-vidrio"><span class="lab-liq"><i></i><i></i><i></i></span><span class="lab-soltar">' + esc(x.soltar) + '</span></div>' +
        '<strong>' + esc(x.f[f][0]) + '</strong><small>' + esc(x.f[f][1]) + '</small>' +
        '<span class="lab-n"></span><button type="button" class="lab-votar"></button></div>').join('') + '</div>' +
      '<form class="lab-correo" hidden novalidate><label for="labMail">' + esc(x.correoT) + '</label><div><input id="labMail" type="email" inputmode="email" autocomplete="email" maxlength="254" placeholder="' + esc(x.correo) + '"><button type="submit">' + esc(x.avisame) + '</button></div><p class="lab-aviso" role="status"></p></form>' +
      '<p class="lab-gratis">' + esc(x.gratis) + '</p>' +
    '</div>';
  niveles();
}
function niveles(){
  const x = t(), max = Math.max(20, ...FUNCS.map(f => cuentas[f] || 0));
  lab.querySelectorAll('.lab-tubo').forEach(tb => {
    const f = tb.dataset.f, n = cuentas[f] || 0;
    tb.style.setProperty('--nivel', (12 + 80 * n / max).toFixed(1) + '%');
    tb.querySelector('.lab-n').textContent = x.votos(n);
    const b = tb.querySelector('.lab-votar'); b.textContent = votos[f] ? '✓ ' + x.votado : x.votar; b.disabled = !!votos[f];
    tb.classList.toggle('votado', !!votos[f]);
  });
}
pintaLab(); pintores.push(niveles);
let ultimo = null;
async function votoTubo(tb){
  const f = tb.dataset.f; if (votos[f]) return;
  ultimo = f;
  tb.classList.add('burbujea'); setTimeout(() => tb.classList.remove('burbujea'), 1400);
  if (SZ.burst && !quieto()){ const r = tb.querySelector('.lab-vidrio').getBoundingClientRect(); SZ.burst(r.left + r.width / 2, r.top + 10, [COLF[f], '#ffffff', '#ffc857'], 12); }
  votar(f);   /* solo el clic, aparte: todavía no cuenta */
  const fm = lab.querySelector('.lab-correo'); fm.hidden = false; fm.querySelector('div').hidden = false; fm.querySelector('.lab-aviso').textContent = '';
  fm.querySelector('label').textContent = t().correoF(t().f[f][0]);
  lab.querySelectorAll('.lab-tubo').forEach(x => x.classList.toggle('elegido', x === tb));
  fm.querySelector('input').focus({ preventScroll:true });
}
lab.addEventListener('click', e => { const b = e.target.closest('.lab-votar'); if (b) votoTubo(b.closest('.lab-tubo')); });
lab.addEventListener('submit', async e => {
  e.preventDefault();
  const fm = e.target, inp = fm.querySelector('input'), av = fm.querySelector('.lab-aviso'), x = t(), c = inp.value.trim().toLowerCase();
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(c)){ av.textContent = x.correoMal; return; }
  if (!ultimo){ av.textContent = x.correoT; return; }
  av.textContent = '…';
  const ok = await votar(ultimo, c);
  const fm2 = lab.querySelector('.lab-correo'), av2 = fm2.querySelector('.lab-aviso');
  fm2.hidden = false; av2.textContent = ok ? x.correoOk : x.fallo; if (ok){ fm2.querySelector('div').hidden = true; fm2.querySelector('label').textContent = x.correoT; }
});
/* arrastrar la batería a un tubo (mouse o dedo) */
lab.addEventListener('pointerdown', e => {
  const bat = e.target.closest('.lab-bat'); if (!bat) return;
  e.preventDefault(); bat.setPointerCapture(e.pointerId);
  const r0 = bat.getBoundingClientRect(), ox = e.clientX - r0.left, oy = e.clientY - r0.top;
  bat.classList.add('arrastra'); lab.classList.add('arrastrando');
  let sobre = null;
  const mover = ev => {
    bat.style.transform = 'translate(' + (ev.clientX - ox - r0.left).toFixed(0) + 'px,' + (ev.clientY - oy - r0.top).toFixed(0) + 'px)';
    const el = document.elementsFromPoint(ev.clientX, ev.clientY).find(n => n.classList && n.classList.contains('lab-tubo'));
    if (el !== sobre){ sobre && sobre.classList.remove('sobre'); sobre = el || null; sobre && sobre.classList.add('sobre'); }
  };
  const soltar = () => {
    bat.removeEventListener('pointermove', mover); bat.removeEventListener('pointerup', soltar); bat.removeEventListener('pointercancel', soltar);
    bat.classList.remove('arrastra'); lab.classList.remove('arrastrando'); bat.style.transform = '';
    if (sobre){ sobre.classList.remove('sobre'); votoTubo(sobre); }
  };
  bat.addEventListener('pointermove', mover); bat.addEventListener('pointerup', soltar); bat.addEventListener('pointercancel', soltar);
});

if (SZ.onLang) SZ.onLang(() => { pintaLab(); corrida++; pintaDemo(); if (visible) pelicula(); else if (quieto()) final(); });
})();
