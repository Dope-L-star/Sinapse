(() => {
'use strict';
const { root, $, $$, clamp, fmt, esc, est, zWord, API, byId, save, total, addUsage, toast, md, typeIn, ask, history, metaOf, countTo, burst, vendorLabel, vendorColor, today, SXC, coins } = SZ;
const st = () => SZ.state;
const OR = byId('openrouter');
const params = new URLSearchParams(location.search);

$('#sideWord').innerHTML = SZ.flowWord(); $('#sideZ').innerHTML = SZ.zMark('Synth');
$('#railWord').innerHTML = '<span class="word">' + SZ.flowWord() + '</span>'; $('#mLogo').innerHTML = '<span class="word">' + SZ.flowWord() + '</span>';
$('#corner').innerHTML = '<svg viewBox="0 0 24 24">' + SZ.ICONS.claude('#d9805f', '#d9805f') + '</svg>';

/* ---------- preferencias de la lista (se recuerdan) ---------- */
const UI_KEY = 'synthz:ui';
const ui = { free:true, fav:false, reason:false, vision:false, long:false, sort:'new', prov:'all' };
try{ const u = JSON.parse(localStorage.getItem(UI_KEY)) || {}; ['free', 'fav', 'reason', 'vision', 'long', 'forme', 'code', 'write', 'fast', 'math', 'newm'].forEach(k => { if (typeof u[k] === 'boolean') ui[k] = u[k]; }); if (['new', 'ctx', 'az'].includes(u.sort)) ui.sort = u.sort; if (['all', 'sz', 'pu', 'or', 'gq'].includes(u.prov)) ui.prov = u.prov; }catch(e){}
const saveUI = () => { try{ localStorage.setItem(UI_KEY, JSON.stringify(ui)); }catch(e){} };

let mode = params.get('mode') === 'cmp' ? 'cmp' : 'solo';
let pickMode = 'set';
let pickCmp = false;             /* v3.7 · «Comparar IAs» (su propio lugar en la barra): marcas 2 a 4 y empiezas */            /* 'set' = cambiar la IA · 'add' = sumar otra IA para comparar */
let cmpLast = null;              /* la última pregunta de Comparar: sus tarjetas siguen ahí aunque se repinte */
const jobOwn = {};               /* qué trabajo es dueño de cada «pensando…» */
const isMobile = () => matchMedia('(max-width:760px)').matches;
const isTablet = () => matchMedia('(max-width:1100px) and (min-width:761px)').matches;
let query = '';
const busy = {};                 /* id del modelo -> 'think' | 'write' */
let live = null;                 /* v3.3 · la respuesta que se está escribiendo ahora: si algo repinta el chat, vuelve a aparecer */
let gen = 0, cmpRun = 0, stick = true, loading = false;

/* ---------- catálogo en vivo ---------- */
let cat = { t:0, list:[], status:'loading' };
const idx = new Map(), newIds = new Set();
function setCatalog(list, t, status){ list = (list || []).filter(m => !SZ.isBad(m.id)); cat = { t, list, status }; idx.clear(); list.forEach(m => idx.set(m.id, m)); }
function stub(id){
  if (id === 'imagen') return { id, name:'Creador de imágenes', vendor:'synthz', vlabel:'Imágenes', ctx:0, free:true, created:0, vision:false, reasoning:false, tools:false, desc:'', stub:true };
  if (id === 'agente') return { id, name:'SuperiorSynth', vendor:'synthz', vlabel:'Elige la IA por ti', ctx:0, free:true, created:0, vision:false, reasoning:false, tools:false, desc:'', stub:true };
  if (id === 'sz:auto') return Object.assign({}, SZ.SZ_AUTO, { stub:true });
  if (/^sz:/.test(id)){ const mid = id.split(':').slice(2).join(':'); return { id, name:mid.replace(/^[^/]+\//, ''), vendor:'synthz', vlabel:'Gratis', ctx:0, free:true, created:0, vision:false, reasoning:false, tools:false, desc:'', stub:true }; }
  const v = id.split('/')[0] || 'otro', nm = (id.split('/').slice(1).join('/') || id).replace(/:free$/, '');
  return { id, name:nm, vendor:v, vlabel:vendorLabel(v), ctx:0, free:/:free$/.test(id), created:0, vision:false, reasoning:false, tools:false, desc:'', stub:true };
}
/* prueba guiada (modalidad C): un «modelo» propio que pasa por el servidor de SymphorIA */
const TRIAL_ID = 'tr:prueba';
const TRIAL_INFO = { id:TRIAL_ID, name:'Prueba de SymphorIA', vendor:'synthz', vlabel:'Prueba guiada', ctx:0, free:true, created:0, vision:false, reasoning:false, tools:false, desc:'' };
let trialOn = false;
const info = id => id === TRIAL_ID ? TRIAL_INFO : idx.get(id) || stub(id);
function fallbackList(){ return [...new Set(['sz:auto', ...(st().models.openrouter || []).filter(x => !orOn() ? /^(sz|pu):/.test(x) : true)])].map(stub); }
const cached = SZ.loadCatalog();
if (cached) setCatalog(cached.list, cached.t, 'cached'); else setCatalog([], 0, 'loading');

const APODEX = 'sz:auto';   /* «SymphorIA Auto»: las IAs conectadas elige sola el mejor modelo gratis que esté libre (beta 2) */
const selId = () => trialOn ? TRIAL_ID : (st().model.openrouter || APODEX);
const kfmt = n => !n ? '' : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1000 ? Math.round(n / 1000) + 'k' : String(n);
const isNew = m => newIds.has(m.id) || (m.created && Date.now() / 1000 - m.created < 14 * 86400);
const ago = t => { if (!t) return ''; const s = Math.max(0, Math.round((Date.now() - t) / 1000)); return s < 5 ? 'ahora' : s < 60 ? 'hace ' + s + ' s' : s < 3600 ? 'hace ' + Math.round(s / 60) + ' min' : 'hace ' + Math.round(s / 3600) + ' h'; };
/* cada IA con su icono real en vidrio líquido (si no hay, su inicial) */
const av = (m, cls) => '<span class="av gav' + (cls ? ' ' + cls : '') + '" style="--vc:' + vendorColor(m.vendor) + '">' + SZ.glassIcon(m) + '<i class="n"></i></span>';
const brandVars = m => { const b = SZ.brandOf(m); return b ? '--b1:' + b[2] + ';--b2:' + b[3] + ';--c:' + b[2] : '--b1:' + vendorColor(m.vendor) + ';--b2:#ffffff;--c:' + vendorColor(m.vendor); };
const works = {};          /* lo que está haciendo cada IA mientras responde */
const hl = (text, q) => { if (!q) return esc(text); const i = text.toLowerCase().indexOf(q); return i < 0 ? esc(text) : esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length)); };
function tags(m, full){
  let h = m.free ? '<i class="tg free">gratis</i>' : (m.stub ? '' : '<i class="tg paid">de pago</i>');
  if (isNew(m)) h += '<i class="tg new">nuevo</i>';
  if (full){ if (m.reasoning) h += '<i class="tg">piensa con calma</i>'; if (m.vision) h += '<i class="tg">ve fotos</i>'; }
  return h;
}
const exC = new Map();
const expert = m => { const k = SZ.lang() + m.id; let e = exC.get(k); if (!e){ e = SZ.expertOf(m); exC.set(k, e); } return e; };
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/></svg>';

/* familia de cada IA, con el nombre que la gente conoce */
const FAMN = { openai:'ChatGPT', 'claude-color':'Claude', 'gemini-color':'Gemini', 'gemma-color':'Gemma', 'meta-color':'Llama', 'mistral-color':'Mistral', 'deepseek-color':'DeepSeek', 'qwen-color':'Qwen', grok:'Grok', 'kimi-color':'Kimi', 'nvidia-color':'NVIDIA', 'microsoft-color':'Microsoft Phi', 'zhipu-color':'GLM', 'cohere-color':'Cohere', 'minimax-color':'MiniMax', 'perplexity-color':'Perplexity' };
const famOf = m => { const b = SZ.brandOf(m); return b ? (FAMN[b[0]] || b[1].replace(/\s*\(.*\)$/, '')) : 'Otras'; };
/* ---------- lista de modelos ---------- */
const listEl = $('#mlist');
/* selector: pestaña (Para ti · Todas · Mis favoritas), tema elegido y las que marcaste para comparar */
let ptab = 'forme', ptopic = null;
const pickSel = new Set();
const fold = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function topicFor(q){ const f = fold(q).trim(); if (f.length < 3) return null; const t = TOPICS.find(([k, e, l]) => fold(l).includes(f) || fold(k).startsWith(f)); return t ? t[0] : null; }
function visible(q){
  const fav = new Set(st().fav), qt = !ptopic && q ? topicFor(q) : null;
  const nameHit = m => (m.name + ' ' + m.id + ' ' + m.vlabel).toLowerCase().includes(q);
  let l = cat.list.filter(m => m.id !== 'sz:auto' && (ui.prov === 'all' || m.id.startsWith(ui.prov + ':')) && (!ui.free || m.free) && ((!ui.fav && ptab !== 'fav') || fav.has(m.id)) && (!ui.reason || m.reasoning) && (!ui.vision || m.vision) && (!ui.long || m.ctx >= 100000) && (!ui.code || expert(m).tags.includes('code')) && (!ui.write || expert(m).tags.includes('write')) && (!ui.fast || expert(m).tags.includes('fast')) && (!ui.math || expert(m).tags.includes('math')) && (!ui.newm || isNew(m)) && true
    && (!q || nameHit(m) || (qt && recommendTop(qt, 8).some(x => x.id === m.id))));
  const cmp = ui.sort === 'ctx' ? (a, b) => b.ctx - a.ctx || a.name.localeCompare(b.name) : ui.sort === 'az' ? (a, b) => a.name.localeCompare(b.name) : (a, b) => b.created - a.created || a.name.localeCompare(b.name);
  l.sort(cmp);
  if (!ui.fav) l = [...l.filter(m => fav.has(m.id)), ...l.filter(m => !fav.has(m.id))];
  /* «Para ti»: tus recomendadas suben arriba y se marcan, sin esconder las demás */
  const pk = forMe(); if (ptab === 'forme' && pk.size){ const order = [...pk]; l = [...order.map(id => l.find(m => m.id === id)).filter(Boolean), ...l.filter(m => !pk.has(m.id))]; }
  /* con un tema (elegido o escrito en el buscador), sus expertas van primero */
  const tk = ptopic || qt; if (tk){ const rec = recommendTop(tk, 6).map(m => m.id), rs = new Set(rec); l = [...rec.map(id => l.find(m => m.id === id)).filter(Boolean), ...l.filter(m => !rs.has(m.id))]; }
  return l;
}
/* cuánto gasta de tu Puter cada IA: rayitas como la señal del celular */
const SPEND = ['', 'Gasta poco de tu Puter', 'Gasta normal de tu Puter', 'Gasta mucho de tu Puter'];
const spendTag = m => /^pu:/.test(m.id) && m.spend ? '<i class="spend s' + m.spend + '" title="' + SPEND[m.spend] + '"><b></b><b></b><b></b><em>' + ['', 'gasta poco', 'gasta normal', 'gasta mucho'][m.spend] + '</em></i>' : '';
function itemHtml(m, i, q, anim){
  const fav = st().fav.includes(m.id), sel = mode === 'solo' && m.id === selId(), on = mode === 'cmp' && st().cmp.includes(m.id);
  const n = on ? st().cmp.indexOf(m.id) + 1 : '', add = pickMode === 'add', inCmp = add && (st().cmp.includes(m.id) || (mode === 'solo' && m.id === selId()));
  const tk = ptopic || (!ptopic && q ? topicFor(q) : null), rec = tk && recommendTop(tk, 6).some(x => x.id === m.id);
  const pay = payOf(m.id), ok = connected(m.id), ck = pickSel.has(m.id);
  const badge = '<i class="mpay ' + pay[0] + (ok ? '' : ' lock') + '">' + esc(ok ? pay[2] : (/^pu:/.test(m.id) ? 'Conecta tu Puter' : /^sz:/.test(m.id) ? 'Descansando' : 'No disponible')) + '</i>';
  const why = (rec ? '<b class="pti">Para ' + esc(TOPIC[tk].l) + '</b> · ' : forMe().has(m.id) && ptab === 'forme' ? '<b class="pti">Para ti</b> · ' : '') + esc(expert(m).line);
  const act = pickCmp ? '' : inCmp ? '<span class="mya">ya está</span>' : '<button type="button" class="btn sm' + (ok ? '' : ' ghost') + ' muse" data-use>' + (add ? (ok ? 'Sumar' : 'Conectar') : sel ? 'En uso' : ok ? 'Usar' : 'Conectar') + '</button>';
  return '<div class="mi' + (sel ? ' sel' : '') + (on ? ' on' : '') + (fav ? ' fav' : '') + (ck ? ' ck' : '') + (inCmp ? ' cmpd' : '') + (busy[m.id] ? ' busy' : '') + (anim ? ' in' : '') + '" role="option" tabindex="' + (sel || (mode === 'cmp' && i === 0) ? 0 : -1) + '" data-hover data-id="' + esc(m.id) + '" aria-selected="' + (sel || on) + '" style="--vc:' + vendorColor(m.vendor) + ';--i:' + i + '">' +
    av(m).replace('<i class="n"></i>', '<i class="n">' + n + '</i>') +
    '<div class="mi-t"><div class="mi-name"><span>' + hl(m.name, q) + '</span>' + badge + spendTag(m) + '</div><div class="mi-ex">' + why + '</div></div>' +
    '<div class="mi-a"><button class="star" type="button" aria-label="' + (fav ? 'Quitar de favoritos' : 'Añadir a favoritos') + '" aria-pressed="' + fav + '">' + STAR + '</button>' +
    (!pickCmp ? '' : '<label class="ckb"><input type="checkbox" data-ck' + (ck ? ' checked' : '') + '><span>Comparar</span></label>') + act + '</div></div>';
}
function paintProv(){
  $$('.pdot[data-pd]').forEach(d => d.classList.toggle('on', d.dataset.pd === 'sz' ? szOn() : d.dataset.pd === 'pu' ? puterOn() : d.dataset.pd === 'gq' ? gqOn() : orOn()));
  /* beta 2: OpenRouter y Groq solo se ven si ya tenías tu llave de antes; nadie más las necesita */
  const gb = $('#provSeg [data-p="gq"]'), ob = $('#provSeg [data-p="or"]'), was = [gb && gb.hidden, ob && ob.hidden].join();
  if (gb) gb.hidden = !gqOn(); if (ob) ob.hidden = !orOn();
  if ((ui.prov === 'gq' && !gqOn()) || (ui.prov === 'or' && !orOn())){ ui.prov = 'all'; saveUI(); $$('#provSeg button').forEach(x => x.setAttribute('aria-selected', String(x.dataset.p === 'all'))); }
  if (was !== [gb && gb.hidden, ob && ob.hidden].join()) requestAnimationFrame(() => placePill($('#provSeg')));
}
function renderList(o = {}){
  try{ paintProv(); }catch(e){}
  const q = query.trim().toLowerCase(), keep = listEl.scrollTop;
  $('#q').placeholder = cat.list.length ? 'Busca entre ' + cat.list.length + ' IA… o escribe lo que quieres hacer' : 'Busca una IA… o escribe lo que quieres hacer';
  if (!cat.list.length && cat.status === 'loading'){
    listEl.innerHTML = Array.from({ length:9 }, () => '<div class="msk"><i></i><div><b style="width:' + (60 + Math.random() * 30 | 0) + '%"></b><b></b></div></div>').join('');
    countTo($('#liveN'), 0); return;
  }
  const l = visible(q);
  countTo($('#liveN'), l.length); const prn = $('#prN'); if (prn) prn.textContent = l.length + (l.length === 1 ? ' IA' : ' IA');
  if (!l.length){
    const noCat = !cat.list.length;
    listEl.innerHTML = '<div class="mnone"><h4>' + (noCat ? 'No pude traer la lista' : 'Nada por aquí') + '</h4><p>' + (noCat ? 'Revisa tu internet y vuelve a intentarlo.' : 'Ninguna IA coincide con lo que buscaste o filtraste.') + '</p><button class="btn sm ghost" id="mReset">' + (noCat ? 'Reintentar' : 'Quitar filtros') + '</button></div>';
    return;
  }
  const warn = cat.status === 'offline' || cat.status === 'cached' ? '<div class="mwarn">' + (cat.status === 'offline' ? 'Sin internet: te muestro las IA que ya conocías.' : 'Sin conexión: muestro la última lista guardada (' + ago(cat.t) + ').') + '</div>' : '';
  const szq = SZ.SZQ, left = Math.max(0, (szq.limit || 20000) - (szq.used || 0));
  const grp = p => p === 'sz' ? '<div class="mgrp"><b><span class="sz-logo" aria-hidden="true"></span>IAs conectadas</b>' + (szOn() ? '<span class="on">gratis</span>' : '<span>descansando</span>') + '<small>' + esc(SZ.limTxt()) + '</small></div>' : p === 'gq' ? '<div class="mgrp"><b>Groq</b><span class="on">tu llave</span><small>Muy rápida · usa tu propia llave de Groq (gratis con límites)</small></div>' : '<div class="mgrp"><b>' + (p === 'pu' ? SZ.puterLogo() + 'Puter' : 'OpenRouter') + '</b>' + (p === 'pu' ? (puterOn() ? '<span class="on">conectada</span>' : '<span>opcional</span>') : (orOn() ? '<span class="on">' + (st().keys.openrouter ? 'conectada' : 'del equipo') + '</span>' : '<span>sin llave</span>')) + '<small>' + (p === 'pu' ? 'Opcional. Conecta tu versión pro de las IAs más usadas.' : '') + '</small></div>';
  const szl = l.filter(m => /^sz:/.test(m.id)), gql = l.filter(m => /^gq:/.test(m.id)), pu = l.filter(m => /^pu:/.test(m.id)), orl = l.filter(m => /^or:/.test(m.id)), rows = [];
  if (warn) rows.push({ t:'w', h:warn });
  if (!st().survey && !q) rows.push({ t:'w', h:'<div class="mwarn pask">✦ <button type="button" class="lnk" data-svy>Cuéntame qué usas</button> y te destaco tus IA</div>' });
  /* v1.3: dentro de cada grupo, las IA van juntas por familia (ChatGPT con sus versiones, Claude, Gemini…) */
  const byFam = !q && !ptopic;
  const add = (arr, p) => {
    if (!arr.length) return; rows.push({ t:'g', h:grp(p) });
    if (!byFam){ arr.forEach(m => rows.push({ t:'m', m })); return; }
    const top = arr.filter(m => m.id === APODEX), rest = arr.filter(m => m.id !== APODEX), fams = new Map();
    top.forEach(m => rows.push({ t:'m', m }));
    rest.forEach(m => { const f = famOf(m); if (!fams.has(f)) fams.set(f, []); fams.get(f).push(m); });
    for (const [f, ms] of fams){ rows.push({ t:'f', h:'<div class="mfam">' + SZ.glassIcon(ms[0], 'xs') + '<b>' + esc(f) + '</b><small>' + ms.length + (ms.length === 1 ? ' versión' : ' versiones') + '</small></div>' }); ms.forEach(m => rows.push({ t:'m', m })); }
  };
  if (ui.prov === 'all'){ add(szl, 'sz'); add(pu, 'pu'); add(gql, 'gq'); if (orOn()) add(orl, 'or'); } else add(l, ui.prov);
  vMeasure(itemHtml(l[0], 0, q, false), grp('pu'), warn);
  let y = 0; V.tops = rows.map(r => { const t0 = y; y += rowH(r) + 5; return t0; });
  V.rows = rows; V.q = q; V.anim = !!o.animate; V.from = V.to = -1;
  listEl.innerHTML = '<div class="vwin" style="height:' + y + 'px"></div>';
  listEl.scrollTop = o.keep ? keep : 0;
  vPaint(true);
}
/* lista virtual: con 1.000 modelos solo se dibujan los que caben en pantalla */
const V = { rows:[], tops:[], hM:0, hG:0, hW:0, from:-1, to:-1, q:'', anim:false };
let vQ = 0;
function vMeasure(item, grpHtml, warn){
  if (V.hM > 0) return;
  const pr = document.createElement('div'); pr.style.cssText = 'position:absolute;left:0;right:0;top:0;visibility:hidden;pointer-events:none';
  pr.innerHTML = item + grpHtml + '<div class="mwarn">x</div><div class="olock"><b>x</b><span>x</span><p>Cientos de IA gratis más, con una llave personal que sacas en 2 minutos.</p><button class="btn sm">x</button></div>'; listEl.appendChild(pr);
  const [a, b, c, d] = pr.children; V.hM = a.offsetHeight; V.hG = b.offsetHeight; V.hW = c.offsetHeight; V.hL = d.offsetHeight + 16; pr.remove();
  if (!V.hM){ V.hM = 0; return vFallback(); }
}
function vFallback(){ if (!V.hM){ V._fb = true; } }
function rowH(r){ return r.t === 'f' ? 34 : r.t === 'm' ? (V.hM || 80) : r.t === 'g' ? (V.hG || 62) : r.t === 'l' ? (V.hL || 150) : (V.hW || 40); }
function vPaint(force){
  const win = listEl.firstElementChild; if (!win || !win.classList.contains('vwin')) return;
  const n = V.rows.length; if (!n){ win.innerHTML = ''; return; }
  const top = listEl.scrollTop, vh = listEl.clientHeight || 700, pad = 500;
  let lo = 0, hi = n - 1;
  while (lo < hi){ const mid = (lo + hi) >> 1; if (V.tops[mid] + rowH(V.rows[mid]) < top - pad) lo = mid + 1; else hi = mid; }
  let b = lo; while (b < n - 1 && V.tops[b + 1] < top + vh + pad) b++;
  if (!force && lo === V.from && b === V.to) return;
  V.from = lo; V.to = b;
  let html = '', k = 0;
  for (let i = lo; i <= b; i++){ const r = V.rows[i]; html += '<div class="vrow" style="top:' + V.tops[i] + 'px">' + (r.t === 'm' ? itemHtml(r.m, k, V.q, V.anim && k++ < 14) : r.h) + '</div>'; }
  win.innerHTML = html; V.anim = false;
}
listEl.addEventListener('scroll', () => { if (!vQ) vQ = requestAnimationFrame(() => { vQ = 0; vPaint(false); }); }, { passive:true });
addEventListener('resize', () => { const h = V.hM; V.hM = 0; renderList({ keep:true }); if (!V.hM) V.hM = h; });
function paintSel(){
  try{ paintMode(); }catch(e){}   /* v2.3.1 · el modo (Automática · Chat · SuperiorSynth) sigue a la IA elegida */
  const cmpIds = st().cmp, id = selId();
  $$('.mi', listEl).forEach(el => {
    const sel = mode === 'solo' && el.dataset.id === id, i = cmpIds.indexOf(el.dataset.id), on = mode === 'cmp' && i > -1;
    el.classList.toggle('sel', sel); el.classList.toggle('on', on); el.setAttribute('aria-selected', String(sel || on));
    const n = $('.n', el); if (n) n.textContent = on ? i + 1 : '';
  });
}
function paintBusy(){ $$('.mi', listEl).forEach(el => el.classList.toggle('busy', !!busy[el.dataset.id])); }

/* barra "en vivo" */
function renderLive(){
  const box = $('#live'), s = cat.status;
  box.dataset.s = s === 'live' ? 'live' : s === 'loading' ? 'loading' : 'off';
  $('#liveLbl').textContent = s === 'live' ? 'Lista al día' : s === 'loading' ? 'Conectando…' : s === 'cached' ? 'Lista guardada' : 'Sin conexión';
  $('#liveAgo').textContent = s === 'loading' ? '' : ago(cat.t).replace('hace ', '');
  box.title = $('#liveLbl').textContent + (cat.t ? ' · ' + ago(cat.t) : '');
}
setInterval(() => { if (cat.status !== 'loading') $('#liveAgo').textContent = ago(cat.t).replace('hace ', ''); }, 1000);

async function refresh(silent){
  if (loading) return; loading = true; cat.status = cat.list.length && cat.status !== 'offline' ? cat.status : 'loading';
  $('#live').dataset.s = 'loading'; $('#liveLbl').textContent = 'Actualizando…';
  try{
    const r = await SZ.fetchCatalog(), before = new Set(cat.list.map(m => m.id));
    const hadPu = [...before].some(x => /^pu:/.test(x)), fresh = before.size ? r.list.filter(m => !before.has(m.id) && (hadPu || !/^pu:/.test(m.id))) : [];
    fresh.forEach(m => newIds.add(m.id));
    const lost = before.size && idx.has(selId()) && !r.list.some(m => m.id === selId());
    setCatalog(r.list, r.t, 'live');
    renderList({ keep:before.size > 0, animate:before.size === 0 }); renderLive(); paintSel(); renderTop(); renderNow();
    try{ applySurvey(false); }catch(e){}
    if (fresh.length) toast(fresh.length + (fresh.length === 1 ? ' modelo nuevo' : ' IA nuevas') + ' en la lista.');
    else if (!silent) toast('Lista al día: ' + r.list.length + ' modelos.');
    fixModel(true);
  }catch(e){
    if (!cat.list.length) setCatalog(fallbackList(), 0, 'offline'); else cat.status = 'cached';
    renderList({ keep:true, animate:true }); renderLive();
    if (!silent) toast('No pude actualizar en vivo. Uso la última lista guardada.');
  }finally{ loading = false; }
}
$('#refreshBtn').addEventListener('click', () => refresh(false));
setInterval(() => { if (!document.hidden) refresh(true); }, 600000);
/* v3.7 · costo cero: al volver a la pestaña solo se actualiza si la lista tiene más de 5 min (antes 1 min) */
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - cat.t > 300000) refresh(true); });

/* filtros y orden */
const FILTERS = [
  ['free', 'Gratis', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>'],
  ['fav', 'Favoritos', STAR.replace('<svg', '<svg fill="none" stroke="currentColor" stroke-width="2"')],
  ['forme', '✦ Para ti', ''], ['code', 'Código', ''], ['write', 'Escritura', ''], ['fast', 'Rápidas', ''], ['reason', 'Piensan con calma', ''], ['vision', 'Ven fotos', ''], ['math', 'Matemáticas', ''], ['long', 'Leen textos largos', ''], ['newm', 'Nuevas', '']
];
function renderFilters(){
  ui.forme = true;
  $('#filters').innerHTML = FILTERS.map(([k, lbl, svg]) => '<button class="fchip' + (k === 'forme' ? ' always' : '') + '" data-k="' + k + '" aria-pressed="' + ui[k] + '"' + (k === 'forme' ? ' title="Siempre activo: tus IA recomendadas van arriba. Tócalo para ajustar."' : '') + '>' + svg + lbl + '</button>').join('');
}
let forMeC = null, forMeK = '';
function forMe(){ const k = (st().survey ? st().survey.t : 0) + ':' + cat.list.length + ':' + (puterOn() ? 1 : 0) + (orOn() ? 1 : 0) + (szOn() ? 1 : 0); if (forMeK !== k){ forMeK = k; forMeC = new Set(SZ.surveyPicks(cat.list.filter(m => connected(m.id)), st().survey, 6)); } return forMeC; }
$('#filters').addEventListener('click', e => {
  const b = e.target.closest('.fchip'); if (!b) return;
  if (b.dataset.k === 'forme'){ askSurvey(); return; }   /* siempre activo: tocarlo ajusta tus recomendaciones */
  ui[b.dataset.k] = !ui[b.dataset.k]; b.setAttribute('aria-pressed', String(ui[b.dataset.k])); saveUI(); renderList({ animate:true });
});
function askSurvey(){ SZ.surveyModal(ok => { if (ok){ forMeK = ''; applySurvey(true); renderList({ animate:true }); toast('Listo: tus IA recomendadas quedaron arriba con ✦ Para ti.'); } }); }
function placePill(seg){
  const a = $('[aria-selected="true"]', seg), pill = $('.pill', seg);
  if (!a || !pill) return;
  pill.style.width = a.offsetWidth + 'px'; pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
}
$$('#sortSeg button').forEach(b => {
  b.setAttribute('aria-selected', String(b.dataset.s === ui.sort));
  b.addEventListener('click', () => { ui.sort = b.dataset.s; saveUI(); $$('#sortSeg button').forEach(x => x.setAttribute('aria-selected', String(x === b))); placePill($('#sortSeg')); placePill($('#provSeg')); renderList({ animate:true }); });
});
$$('#provSeg button').forEach(b => {
  b.setAttribute('aria-selected', String(b.dataset.p === ui.prov));
  b.addEventListener('click', () => { ui.prov = b.dataset.p; saveUI(); $$('#provSeg button').forEach(x => x.setAttribute('aria-selected', String(x === b))); placePill($('#provSeg')); renderList({ animate:true }); });
});

/* filtros: arrastrar, ruedita y flechas para ver todos */
(function(){
  const f = $('#filters'); if (!f) return;
  const w = document.createElement('div'); w.className = 'fwrap'; f.parentNode.insertBefore(w, f); w.appendChild(f);
  const ar = d => '<button class="farr ' + (d < 0 ? 'lft' : 'rgt') + '" type="button" aria-label="' + (d < 0 ? 'Ver filtros anteriores' : 'Ver más filtros') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="' + (d < 0 ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6') + '"/></svg></button>';
  w.insertAdjacentHTML('beforeend', ar(-1) + ar(1));
  $('.farr.lft', w).addEventListener('click', () => f.scrollBy({ left:-160 }));
  $('.farr.rgt', w).addEventListener('click', () => f.scrollBy({ left:160 }));
  const edges = () => { const m = f.scrollWidth - f.clientWidth; f.classList.toggle('l', f.scrollLeft > 3); f.classList.toggle('r', f.scrollLeft < m - 3); };
  f.addEventListener('scroll', edges, { passive:true }); addEventListener('resize', edges); setTimeout(edges, 200); setTimeout(edges, 1500);
  f.addEventListener('wheel', e => { if (f.scrollWidth > f.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)){ e.preventDefault(); f.scrollLeft += e.deltaY; } }, { passive:false });
  let down = null, moved = false;
  f.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button) return; down = { x:e.clientX, s:f.scrollLeft }; moved = false; });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - down.x; if (!moved && Math.abs(dx) > 5){ moved = true; f.classList.add('dragging'); } if (moved) f.scrollLeft = down.s - dx; });
  addEventListener('pointerup', () => { if (!down) return; down = null; setTimeout(() => f.classList.remove('dragging'), 0); });
  f.addEventListener('click', e => { if (moved){ e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
})();
let qT = 0;
$('#q').addEventListener('input', e => {
  $('#searchBox').classList.toggle('has', !!e.target.value);
  clearTimeout(qT); qT = setTimeout(() => { query = e.target.value; paintPNote(); renderList({ animate:true }); }, 90);
});
function clearQuery(){ $('#q').value = ''; query = ''; $('#searchBox').classList.remove('has'); renderList({ animate:true }); }
$('#qClear').addEventListener('click', () => { clearQuery(); $('#q').focus(); });

/* clics sobre la lista */
listEl.addEventListener('click', e => {
  if (e.target.closest('[data-org]')){ openOrGuide(); return; }
  if (e.target.closest('[data-svy]')){ askSurvey(); return; }
  if (e.target.closest('#mReset')){ if (!cat.list.length) refresh(false); else { Object.assign(ui, { free:false, fav:false, reason:false, vision:false, long:false, forme:false, code:false, write:false, fast:false, math:false, newm:false }); saveUI(); renderFilters(); clearQuery(); } return; }
  const star = e.target.closest('.star');
  if (star){ toggleFav(star.closest('.mi'), star); return; }
  if (e.target.closest('.ckb')) return;                  /* la casilla «Comparar» se maneja en «change» */
  const mi = e.target.closest('.mi'); if (!mi || mi.classList.contains('cmpd')) return;
  if (pickCmp){ const c = $('[data-ck]', mi); if (c){ c.checked = !c.checked; c.dispatchEvent(new Event('change', { bubbles:true })); } return; }
  pickModel(mi.dataset.id, mi);
});
/* marcar varias para compararlas (hasta 4; de OpenRouter, máximo 2) */
listEl.addEventListener('change', e => {
  const c = e.target.closest('[data-ck]'); if (!c) return;
  const mi = c.closest('.mi'), id = mi.dataset.id;
  if (c.checked){
    const why = cmpWhyNot(id, [...pickSel]);
    if (why && why !== 'ya'){ c.checked = false; toast(why); return; }
    pickSel.add(id);
    if (!sessionStorage.getItem('synthz:cmpwarn')){ try{ sessionStorage.setItem('synthz:cmpwarn', '1'); }catch(x){} toast('Ojo: en Comparar cada IA responde por separado y cuenta como un mensaje. Por eso se llama Comparar, no Unir.'); }
  } else pickSel.delete(id);
  mi.classList.toggle('ck', c.checked); paintPGo();
});
function paintPGo(){
  const b = $('#pGo'), n = pickSel.size;
  b.hidden = !pickCmp;
  b.disabled = n < 2;
  b.textContent = n < 2 ? (n ? 'Marca una más' : 'Marca 2 a 4 IA') : 'Comparar estas ' + n + ' →';
  if (n >= 2){ b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
}
$('#pGo').addEventListener('click', () => {
  const ids = [...pickSel]; if (ids.length < 2) return;
  const from = ids.map(id => { const el = $('.mi[data-id="' + CSS.escape(id) + '"] .av', listEl); return el ? el.getBoundingClientRect() : null; });
  pickSel.clear(); closeSide();
  startCompare(ids);
  flyChips(ids, from);
});
/* pestañas y temas del selector */
$('#pTabs').addEventListener('click', e => { const b = e.target.closest('[data-pt]'); if (!b) return; ptab = b.dataset.pt; $$('#pTabs button').forEach(x => x.setAttribute('aria-selected', String(x === b))); placePill($('#pTabs')); paintPNote(); renderList({ animate:true }); });
let ptopAll = false;
function renderPTopics(){
  const L = ptopAll ? TOPICS : TOPICS.slice(0, 8);
  $('#pTopics').innerHTML = L.map(([k, e, l], i) => '<button type="button" class="tchip sm" data-ptk="' + k + '" aria-pressed="' + (ptopic === k) + '" style="--i:' + i + '">' + esc(l) + '</button>').join('')
    + '<button type="button" class="tchip sm more" data-ptmore>' + (ptopAll ? 'Menos temas' : '+ ' + (TOPICS.length - 8) + ' temas') + '</button>';
}
$('#pTopics').addEventListener('click', e => {
  if (e.target.closest('[data-ptmore]')){ ptopAll = !ptopAll; smoothSwap($('#pTopics'), renderPTopics); return; }
  const b = e.target.closest('[data-ptk]'); if (!b) return;
  ptopic = ptopic === b.dataset.ptk ? null : b.dataset.ptk;
  $$('#pTopics [data-ptk]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.ptk === ptopic)));
  paintPNote(); renderList({ animate:true });
});
function paintPNote(){
  const note = $('#pNote'), q = query.trim(), tq = ptopic || (q ? topicFor(q) : null);
  note.hidden = false; note.classList.toggle('warn', pickMode === 'add');
  if (pickCmp) note.innerHTML = 'Marca de <b>2 a 4 IA</b> y toca «Comparar». Todas responden la misma pregunta, lado a lado. <b>Ojo:</b> cada una cuenta como un mensaje.';
  else if (pickMode === 'add') note.innerHTML = (cmpLast && cmpLast.text ? 'La que sumes responde a tu última pregunta y aparece al lado, sin volver a enviarla. ' : 'Responde la misma pregunta que las demás y aparece al lado. ') + '<b>Ojo:</b> cada IA cuenta como un mensaje de tu límite de hoy. Puedes poner hasta 4 a la vez.';
  else if (tq) note.innerHTML = 'Para <b>' + esc(TOPIC[tq].l) + '</b> te recomiendo estas.';
  else if (ptab === 'fav') note.innerHTML = st().fav.length ? 'Tus IA favoritas. Toca la estrella de cualquier IA para guardarla aquí.' : 'Aún no tienes favoritas: toca la ★ de una IA para guardarla aquí.';
  else if (ptab === 'all') note.innerHTML = 'Todas las IA que puedes usar. Toca una para empezar.';
  else note.innerHTML = 'Tus IA recomendadas van arriba ✦. Toca una para usarla.';
}
/* cambia un bloque con una transición suave de altura (para «+ temas») */
function smoothSwap(box, paint){
  if (!box) return; const h0 = box.offsetHeight;
  paint();
  if (SZ.reduce) return;
  const h1 = box.offsetHeight;
  box.animate([{ height:h0 + 'px', overflow:'hidden' }, { height:h1 + 'px', overflow:'hidden' }], { duration:520, easing:'cubic-bezier(.22,1,.36,1)' });
  $$('.tchip', box).forEach((b, i) => { b.style.animationDelay = Math.min(i, 24) * 22 + 'ms'; b.classList.remove('rise'); void b.offsetWidth; b.classList.add('rise'); });
}
listEl.addEventListener('keydown', e => {
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.target.classList.contains('mi')){ e.preventDefault(); const L = $$('.mi', listEl), j = L.indexOf(e.target), n = L[j + (e.key === 'ArrowDown' ? 1 : -1)]; if (n){ L.forEach(x => x.tabIndex = -1); n.tabIndex = 0; n.focus(); n.scrollIntoView({ block:'nearest' }); } return; } if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('mi')){ e.preventDefault(); pickModel(e.target.dataset.id, e.target); } });
listEl.addEventListener('scroll', () => requestAnimationFrame(SZ.S.retarget), { passive:true });

function toggleFav(el, star){
  const f = st().fav, id = el.dataset.id, i = f.indexOf(id);
  if (i > -1) f.splice(i, 1); else f.unshift(id);
  save(); el.classList.toggle('fav', i < 0); star.setAttribute('aria-pressed', String(i < 0));
  star.classList.remove('pop'); void star.offsetWidth; star.classList.add('pop');
  if (i < 0){ const r = star.getBoundingClientRect(); burst(r.left + 16, r.top + 16, ['#f2c46b', '#ffe3a1', '#ff8f7a'], 9); }
  setTimeout(() => renderList({ keep:true }), 420);
}
/* comparar: hasta 4 IA; de OpenRouter máximo 2 (su plan gratis da 50 mensajes al día y cada IA gasta uno) */
const CMP_MAX = 4, OR_CMP_MAX = 2;
function cmpWhyNot(id, base){
  const a = base || st().cmp;
  if (a.includes(id)) return 'ya';
  if (a.length >= CMP_MAX) return 'Puedes comparar hasta 4 IA a la vez.';

  return '';
}
function pickModel(id, node){
  { const mm = info(id); if (mm && mm.spend === 3 && node !== null){ try{ if (!sessionStorage.getItem('synthz:spendw')){ sessionStorage.setItem('synthz:spendw', '1'); setTimeout(() => toast('Ojo: ' + mm.name + ' gasta mucho de tu Puter. Para cosas sencillas usa una con rayitas verdes y tu saldo te dura más.'), 600); } }catch(e){} } }
  if (mode === 'cmp' || pickMode === 'add'){
    const base = mode === 'cmp' ? st().cmp : [selId()].filter(x => x !== TRIAL_ID), why = cmpWhyNot(id, base);
    if (why === 'ya'){ toast('Esa IA ya está en la comparación.'); return; }
    if (why){ toast(why); return; }
    if (node !== null) iaThenAdd(id, node); else addToCompare(id, node);   /* v3.8 · solo se suma si de verdad responde */
    return;
  }
  if (trialOn && id !== TRIAL_ID) exitTrial(true);
  const same = id === selId(), prev = selId();
  if (node) st().pinned = id;
  st().model.openrouter = id; save(); paintSel(); renderTop(!same); paintAccent();
  if (!same && node){ const r = node.getBoundingClientRect(); burst(r.left + 32, r.top + 24, [vendorColor(info(id).vendor), '#ffffff', vendorColor(info(id).vendor)], 8); }
  renderMsgs();
  closeSide();
  if (node !== null && !same) iaAfterPick(id, prev);   /* v3.8 · ¿responde? si no, vuelves a la de antes y te pregunto para qué la querías */
}

