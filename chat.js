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
  if (id === 'agente') return { id, name:'Apex', vendor:'synthz', vlabel:'Elige la IA por ti', ctx:0, free:true, created:0, vision:false, reasoning:false, tools:false, desc:'', stub:true };
  if (id === 'sz:auto') return Object.assign({}, SZ.SZ_AUTO, { stub:true });
  if (/^sz:/.test(id)){ const mid = id.split(':').slice(2).join(':'); return { id, name:mid.replace(/^[^/]+\//, ''), vendor:'synthz', vlabel:'Gratis', ctx:0, free:true, created:0, vision:false, reasoning:false, tools:false, desc:'', stub:true }; }
  const v = id.split('/')[0] || 'otro', nm = (id.split('/').slice(1).join('/') || id).replace(/:free$/, '');
  return { id, name:nm, vendor:v, vlabel:vendorLabel(v), ctx:0, free:/:free$/.test(id), created:0, vision:false, reasoning:false, tools:false, desc:'', stub:true };
}
/* prueba guiada (modalidad C): un «modelo» propio que pasa por el servidor de SymphorIA */
const TRIAL_ID = 'tr:prueba';
const TRIAL_INFO = { id:TRIAL_ID, name:'Prueba de Sinapse', vendor:'synthz', vlabel:'Prueba guiada', ctx:0, free:true, created:0, vision:false, reasoning:false, tools:false, desc:'' };
let trialOn = false;
const info = id => id === TRIAL_ID ? TRIAL_INFO : idx.get(id) || stub(id);
function fallbackList(){ return [...new Set(['sz:auto', ...(st().models.openrouter || []).filter(x => !orOn() ? /^(sz|pu):/.test(x) : true)])].map(stub); }
const cached = SZ.loadCatalog();
if (cached) setCatalog(cached.list, cached.t, 'cached'); else setCatalog([], 0, 'loading');

const APODEX = 'sz:auto';   /* «Sinapse Auto»: las IAs conectadas elige sola el mejor modelo gratis que esté libre (beta 2) */
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
  try{ paintMode(); }catch(e){}   /* v2.3.1 · el modo (Automática · Chat · Apex) sigue a la IA elegida */
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
setInterval(() => { if (!document.hidden) refresh(true); }, 1200000);   /* Fase 4: cada 20 min (antes 10); tu EnerX igual se actualiza con cada respuesta */
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
    + '<button type="button" class="tchip sm more" data-ptmore>' + (ptopAll ? (SZ.lang() === 'en' ? 'Fewer topics' : 'Menos temas') : '+ ' + (TOPICS.length - 8) + (SZ.lang() === 'en' ? ' topics' : ' temas')) + '</button>';
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
function pickModel(id, node, avisado){
  /* v4.3 · Chispa+: un modelo premium de alto consumo pide confirmación con un aviso grande, cada vez que se elige (hoy apagado: no hay modelos premium en la lista) */
  { const pm = info(id); if (pm && pm.premium && pm.heavy && node !== null && !avisado && id !== selId()){ premiumAviso(pm).then(ok => { if (ok) pickModel(id, node, true); }); return; } }
  /* 2026-11-09 · Partitura: las demás IAs caras (gasto alto) también avisan en grande, con «Elegir otra IA» o «Usarla igual» (src/chat/16x) */
  { const mm = info(id); if (node !== null && !avisado && !(mm && mm.premium && mm.heavy) && ptEsCara(mm)) setTimeout(() => ptAvisoConsumo(mm, () => { try{ openSide('set'); }catch(e){} }), 350); }
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

/* ---------- cabecera ---------- */
function retype(el, text, o){ el.textContent = text; el._chars = null; el.removeAttribute('aria-label'); el.removeAttribute('data-typed'); return typeIn(el, o); }
/* la IA que usas va arriba (donde antes estaba la prueba); quién paga va abajo, junto a la caja */
const PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const CARET = '<svg class="cv" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const XS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
/* v2.3 · con SuperiorSynth encendido, arriba a la izquierda va su sello (en el celular, solo su logo) */
const ssTopHtml = () => '<button type="button" class="sstop" id="ssTop" aria-haspopup="menu" data-menu-owner aria-label="Apex elige la IA por ti. Toca para opciones">' + ssIco('lg') + '<span class="sst-t"><b>Apex</b><small>elige la IA por ti</small></span>' + CARET + '</button>';
function renderTop(animate){
  const row = $('#pickRow');
  try{ renderCPick(); }catch(e){}
  if (mode === 'solo' && agentOn()){
    row.classList.remove('n3', 'n4');
    row.innerHTML = ssTopHtml() + (document.body.classList.contains('fresh') ? '' : '<span class="paym" id="payM"></span>');
    paintPay(); return;
  }
  if (mode === 'solo' && document.body.classList.contains('fresh')){
    row.classList.remove('n3', 'n4');
    const ok0 = connected(selId()), [k1, long1] = payOf(selId()), k = ok0 ? k1 : 'off', long = ok0 ? long1 : /^pu:/.test(selId()) ? 'Puter · sin conectar (toca para conectarlo)' : long1, left = trialOn ? trialLeft() : 0;
    row.innerHTML = '<button type="button" class="paypill ' + k + '" id="payPill" title="Quién paga lo que escribes">' + '<i aria-hidden="true"></i>' + (trialOn ? 'Prueba guiada · te quedan <b>' + left + ' de ' + ((SZ.trialGet() || {}).max || 5) + '</b> · la paga Sinapse' : esc(long)) + CARET + '</button>';
    return;
  }
  if (mode === 'solo'){
    row.classList.remove('n3', 'n4');
    const m = info(selId()), open = $('#side').classList.contains('open') && pickMode === 'set';
    row.innerHTML = '<button type="button" class="mchip" id="curChip" aria-haspopup="dialog" aria-expanded="' + open + '" title="Cambiar de IA" style="--vc:' + vendorColor(m.vendor) + '">' + av(m) + '<b id="curName"></b>' + CARET + '</button>'
      /* v3.7 · «Agregar otra IA» ya no va aquí: Comparar tiene su propio lugar en la barra («Comparar IAs») */
      + '<span class="paym" id="payM"></span>';
    const h1 = $('#curName'); h1.setAttribute('aria-label', m.name);
    if (animate) retype(h1, m.name, { cps:70, max:.7 }); else h1.textContent = m.name;
  } else {
    const ids = st().cmp;
    row.classList.remove('n3', 'n4'); if (ids.length >= 3) row.classList.add('n' + ids.length);
    row.innerHTML = ids.map(id => { const m = info(id); return '<span class="mchip c" style="--vc:' + vendorColor(m.vendor) + '">' + av(m) + '<b>' + esc(m.name) + '</b><button type="button" class="rm" data-rm="' + esc(id) + '" aria-label="Quitar ' + esc(m.name) + '">' + XS + '</button></span>'; }).join('')
      + (ids.length < CMP_MAX ? '<button type="button" class="addb ic" data-add aria-label="Agregar otra IA">' + PLUS + '<span>Agregar</span></button>' : '')
      + '<button type="button" class="bt-mini" id="btTog" aria-pressed="' + !!st().battle + '" title="No verás qué IA es hasta que votes">⚔ A ciegas</button>'
      + '<span class="paym" id="payM"></span>';
  }
  paintPay();
}
$('#cPick').addEventListener('click', e => { if (side.classList.contains('open')) closeSide(); else openSide('set', e.currentTarget); });
$('#cCmp').addEventListener('click', e => openSide('add', e.currentTarget));
$('#pickRow').addEventListener('click', e => {
  if (e.target.closest('#payPill')){ if (needsConn()) openConnect(); else coinModal('panel'); return; }
  const ss = e.target.closest('#ssTop'); if (ss){ const r = ss.getBoundingClientRect(); SZ.menuOpen([{ head:'Apex' }, { label:'Elegir yo la IA', ico:'chats', fn:() => applyMode('chat') }, { label:'¿Qué hace Apex?', ico:'help', fn:() => toast('Tú escribes; Apex entiende tu pedido, lo mejora y elige la IA que más sabe de eso. Al final decides si te quedas con esa IA.') }], r.left, r.bottom + 6, 'sstm'); return; }
  const rm = e.target.closest('[data-rm]'); if (rm){ removeCmp(rm.dataset.rm, rm.closest('.mchip')); return; }
  const ad = e.target.closest('[data-add]'); if (ad){ if ($('#side').classList.contains('open') && pickMode === 'add') closeSide(); else openSide('add', ad); return; }
  const bt = e.target.closest('#btTog'); if (bt){ st().battle = !st().battle; save(); bt.setAttribute('aria-pressed', String(!!st().battle)); toast(st().battle ? 'A ciegas: no verás qué IA es hasta que votes (desde la próxima pregunta).' : 'Modo sorpresa apagado: ya ves el nombre de cada IA.'); return; }
  const ch = e.target.closest('#curChip'); if (ch){ if ($('#side').classList.contains('open')) closeSide(); else openSide('set', ch); }
});
/* quién paga lo que escribes: siempre a la vista (regla 5) */
function payOf(id){
  if (id === TRIAL_ID) return ['tr', 'Prueba guiada · la paga Sinapse', 'Prueba · paga Sinapse'];
  if (/^sz:/.test(id)) return ['sz', 'Gratis · ' + SZ.limTxt().replace(/^./, c => c.toLowerCase()), 'Gratis · ' + SZ.limShort().replace(/^[A-ZÁÉÍÓÚ]/, c => c.toLowerCase())];
  if (/^pu:/.test(id)) return ['pu', 'Con tu Puter · tu cuenta gratis', 'Con tu Puter'];
  return ['or off', 'Esta IA ya no está disponible: elige otra', 'Elige otra IA'];
}
function paintPay(){
  let c, l, s, ex = false;
  if (mode === 'cmp'){ c = ''; l = 'Comparando · cada IA cuenta como un mensaje'; s = 'Cada IA cuenta como un mensaje'; }
  else if (trialOn){ const left = trialLeft(), mx = (SZ.trialGet() || {}).max || 5; c = 'tr'; ex = true; l = left > 0 ? 'Prueba guiada · te quedan ' + left + ' de ' + mx + ' · la paga Sinapse' : 'Prueba guiada terminada'; s = left > 0 ? 'Prueba · ' + left + ' de ' + mx + ' · paga Sinapse' : 'Prueba terminada'; }
  else { const id = selId(), p = payOf(id); c = p[0]; l = p[1]; s = p[2]; if (!connected(id)){ c = 'off'; l = /^pu:/.test(id) ? 'Puter · sin conectar' : l; s = /^pu:/.test(id) ? 'Puter sin conectar' : s; } }
  const P = $('#payL');
  /* v4.3 (8 nov) · Sammuel: bajo la caja ya no va «Gratis · te queda 100 % de EnerX» (eso ya se ve arriba y en la barra),
     sino el aviso de siempre: «<la IA> puede equivocarse. Revisa lo importante.». Se queda el texto de antes solo cuando
     hay algo que hacer: la prueba guiada (con su «Salir») o una IA que no está disponible / sin conectar. */
  if (P && !ex && !/off/.test(c)){ P.className = 'payl note'; P.textContent = errTxt(); return paintPayM(c, s); }
  if (P){ P.className = 'payl ' + c; P.innerHTML = '<i aria-hidden="true"></i>' + esc(l) + (ex ? '<button type="button" class="lnk" data-tx="exit">Salir</button>' : ''); }
  paintPayM(c, s);
}
function errTxt(){
  if (mode === 'cmp') return 'Las IAs pueden equivocarse. Revisa lo importante.';
  const id = selId(), m = !agentOn() && id !== 'sz:auto' && info(id);
  return m && m.name && !/^Autom/i.test(m.name) ? m.name + ' puede equivocarse. Revisa lo importante.' : 'La IA puede equivocarse. Revisa lo importante.';
}
function paintPayM(c, s){
  const M = $('#payM');
  if (M){
    const bar = !document.body.classList.contains('fresh') && mode !== 'cmp' && !trialOn && (c === 'sz' || agentOn());
    if (bar){ const pc = SZ.battPct(), lv = SZ.limLvl();
      M.className = 'paym tlim ' + lv; M.setAttribute('role', 'img'); M.setAttribute('aria-label', SZ.isGuestQ() ? SZ.limTxt() : 'Tu EnerX de hoy: ' + SZ.battPct() + ' %');
      M.innerHTML = '<span class="tl-l">Hoy</span>' + SZ.limRing(16) + '<em>' + pc + ' %</em>'; }
    else { M.className = 'paym ' + c; M.removeAttribute('role'); M.removeAttribute('aria-label'); M.innerHTML = '<i aria-hidden="true"></i>' + esc(s); }
  }
}
$('#payL').addEventListener('click', e => { if (e.target.closest('[data-tx="exit"]')) exitTrial(); });
function paintAccent(){
  const g = $('#glow'); g.classList.add('swap');
  setTimeout(() => { root.style.setProperty('--c', mode === 'cmp' ? '#b8c4ff' : vendorColor(info(selId()).vendor)); g.classList.remove('swap'); }, 220);
}

/* quién está escribiendo */
/* el estado de verdad: internet, conexión, catálogo y modelo elegido */
let idleK = '';
function readyState(){
  if (!navigator.onLine) return ['off', 'sin internet', ''];
  if (mode === 'cmp' && !st().cmp.length) return ['warn', 'elige las IA que quieres comparar', 'side'];
  if (trialOn) return trialLeft() > 0 ? ['ok', 'prueba guiada · ' + trialLeft() + ' mensajes', ''] : ['warn', 'prueba terminada · conectar', 'conn'];
  if (needsConn()) return ['off', 'sin conectar · conectar', 'conn'];
  if (loading && !cat.list.length) return ['wait', 'cargando la lista de IA…', ''];
  if (mode !== 'cmp' && cat.list.length && info(selId()).stub) return ['warn', 'esta IA no está disponible · cambiar', 'side'];
  return ['ok', 'listo para escribir', ''];
}
function refreshIdle(){ if (Object.keys(busy).length) return; const [k, txt] = readyState(); if (k + txt !== idleK) renderNow(); }
addEventListener('online', refreshIdle); addEventListener('offline', refreshIdle);
setInterval(refreshIdle, 2500);
$('#now').addEventListener('click', e => { const b = e.target.closest('[data-now]'); if (!b) return; if (b.dataset.now === 'conn') openConnect(); else openSide(); });
function renderNow(){
  const ids = Object.keys(busy), box = $('#now'); SZ.S.busy(ids.some(id => busy[id] === 'think')); document.title = ids.some(id => busy[id] === 'think') ? 'Pensando… · Sonyx' : 'Sonyx · Sinapse';
  box.innerHTML = ''; box.classList.toggle('many', ids.length > 2);
  /* el letrero «conectado / sin conectar» ya no existe: si falta una IA, la caja de texto se bloquea y lo explica */
  if (!ids.length){ { const [k0, t0] = readyState(); idleK = k0 + t0; } box.classList.add('idle'); }
  else box.classList.remove('idle');
  ids.forEach(id => {
    const m = info(id), c = document.createElement('span');
    c.className = 'now-chip live'; c.style.setProperty('--vc', vendorColor(m.vendor));
    c.innerHTML = av(m, 'xs') + '<b>' + esc(m.name) + '</b><em>' + (busy[id] === 'think' ? 'pensando' : 'escribiendo') + '</em><span class="dots"><i></i><i></i><i></i></span>';
    box.appendChild(c);
  });
  $('#sendBtn').disabled = false; $('#sendBtn').classList.toggle('stop', ids.length > 0); $('#sendBtn').setAttribute('aria-label', ids.length ? 'Detener la respuesta' : 'Enviar');
  paintBusy(); renderFoot(); paintPay();
}
function renderFoot(){
  const left = SZ.msgsLeft(), lv = SZ.limLvl();
  /* v3.0 · «Medidor del día» como batería: la pila se descarga mientras chateas y se carga a medianoche */
  const k = Math.max(0, 1 - SZ.limPct()), g = SZ.isGuestQ(), big = SZ.battPct() + ' %', of = g ? SZ.t('enerx.ofGuest') : SZ.SZQ.team ? 'sin límite · equipo' : k > 0 ? 'se carga a medianoche' : 'sin EnerX · se carga a medianoche';
  $('#sideFoot').innerHTML = '<button class="sxfoot lim gauge gbatt ' + lv + '" id="sxBtn" type="button" title="Tu EnerX de hoy (tu batería): toca para ver el detalle">'
    + '<span class="gz-t">EnerX de hoy</span>' + SZ.limRing(40)
    + '<span class="gz-n"><b>' + esc(big) + '</b><small>' + esc(of) + '</small></span><span class="sr">' + esc(SZ.limTxt()) + '</span></button>';
  const rc = $('#railCoin'); if (rc) rc.innerHTML = SZ.limRing(22) + '<span class="rl">' + esc(SZ.limTxt()) + '</span>';
  const tc = $('#tabCoin .tci'); if (tc) tc.innerHTML = SZ.limRing(22);
}

/* v2.5 · el ícono del archivo es el del boceto; si no hay, la extensión en letras */
const fcIc = ext => SZ.fileIco(ext) ? '<span class="fc-ic img" aria-hidden="true">' + SZ.fileIco(ext) + '</span>' : '<span class="fc-ic" aria-hidden="true">' + esc(String(ext).slice(0, 4).toUpperCase()) + '</span>';
/* ---------- mensajes ---------- */
const msgsEl = $('#msgs'), lane = $('#lane'), inp = $('#inp'), sendBtn = $('#sendBtn');
/* v1.8: en modo agente la conversación es una sola aunque cada mensaje lo responda una IA distinta */
const AGK = 'agente';
const thModel = () => st().agent && !trialOn ? AGK : selId();
const ckey = () => 'openrouter::' + thModel() + (curT() ? '::' + curT() : '');
const chatArr = () => st().chats[ckey()] || (st().chats[ckey()] = []);
const near = () => msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight;
msgsEl.addEventListener('scroll', () => { stick = near() < 90; $('#toBottom').classList.toggle('show', near() > 240); SZ.S.retarget(); }, { passive:true });
const follow = () => { if (stick) msgsEl.scrollTop = msgsEl.scrollHeight; };
const jump = () => { stick = true; msgsEl.scrollTop = msgsEl.scrollHeight; };
$('#toBottom').addEventListener('click', () => { msgsEl.scrollTo({ top:msgsEl.scrollHeight, behavior:'smooth' }); });

const COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
const REGEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>';
function chipsHtml(fs){ return '<div class="fcs">' + fs.map(f => '<span class="fc ro">' + (f.thumb ? '<img src="' + esc(f.thumb) + '" alt="">' : '<i class="ic">' + esc((f.name.split('.').pop() || 'file').slice(0, 4)) + '</i>') + '<b>' + esc(f.name) + '</b></span>').join('') + '</div>'; }
function userEl(text, fs){ const u = document.createElement('div'); u.className = 'm user'; u.innerHTML = '<div class="who">tú ▸</div><div class="bub"></div>'; $('.bub', u).textContent = text; if (fs && fs.length) $('.bub', u).insertAdjacentHTML('beforeend', chipsHtml(fs)); return u; }
function botEl(mid){
  const m = info(mid), el = document.createElement('div'); el.className = 'm bot brand'; el.style.cssText = brandVars(m); el.dataset.brand = (SZ.brandOf(m) || [])[1] || '';
  el.innerHTML = '<div class="who">' + av(m, 'xs') + '<b>' + esc(m.name) + '</b><span class="md">' + esc(m.vlabel) + '</span><span class="wr">escribiendo<span class="dots"><i></i><i></i><i></i></span><span class="tk">0</span> palabras</span></div><div class="body"></div>';
  return el;
}
function thinkEl(mid){
  const m = info(mid), el = document.createElement('div'); el.className = 'm bot brand think-wrap'; el.style.cssText = brandVars(m);
  el.innerHTML = '<div class="who">' + av(m, 'xs') + '<b>' + esc(m.name) + '</b><span class="md">' + esc(m.vlabel || '') + '</span></div>';
  if (!works[mid]) works[mid] = SZ.workView({ model:m.name });
  /* v3.8 · con SynthFlow en React, mientras la IA piensa sale la lluvia Matrix (#47) con su nombre; el detalle (segundos, pasos) queda debajo */
  const fx = document.createElement('div'); fx.className = 'fxhost';
  if (window.SZFx && window.SZFx.mount(fx, 'matrix', { lang:SZ.lang(), ia:SZ.lang() === 'en' && SZ.__syn && SZ.__syn.trStr ? SZ.__syn.trStr(m.name) : m.name })){ el.classList.add('fxm'); el.appendChild(fx); }
  el.appendChild(works[mid].el);
  return el;
}
/* ---------- v1.3 · lienzos: cada código o archivo de texto que da la IA sale como un lienzo con «Copiar» y «Descargar» siempre a la vista ---------- */
const CNV_LANG = { js:['JavaScript', 'js'], javascript:['JavaScript', 'js'], jsx:['React', 'jsx'], ts:['TypeScript', 'ts'], typescript:['TypeScript', 'ts'], tsx:['React', 'tsx'], py:['Python', 'py'], python:['Python', 'py'], html:['HTML', 'html'], xml:['XML', 'xml'], svg:['SVG', 'svg'], css:['CSS', 'css'], scss:['SCSS', 'scss'], json:['JSON', 'json'], sql:['SQL', 'sql'], java:['Java', 'java'], c:['C', 'c'], cpp:['C++', 'cpp'], 'c++':['C++', 'cpp'], cs:['C#', 'cs'], csharp:['C#', 'cs'], go:['Go', 'go'], rust:['Rust', 'rs'], rs:['Rust', 'rs'], php:['PHP', 'php'], rb:['Ruby', 'rb'], ruby:['Ruby', 'rb'], kotlin:['Kotlin', 'kt'], swift:['Swift', 'swift'], dart:['Dart', 'dart'], sh:['Terminal', 'sh'], bash:['Terminal', 'sh'], shell:['Terminal', 'sh'], zsh:['Terminal', 'sh'], powershell:['PowerShell', 'ps1'], ps1:['PowerShell', 'ps1'], yaml:['YAML', 'yml'], yml:['YAML', 'yml'], toml:['TOML', 'toml'], ini:['Configuración', 'ini'], md:['Texto (Markdown)', 'md'], markdown:['Texto (Markdown)', 'md'], txt:['Texto', 'txt'], text:['Texto', 'txt'], plaintext:['Texto', 'txt'], csv:['Tabla (CSV)', 'csv'], tsv:['Tabla', 'tsv'], latex:['LaTeX', 'tex'], tex:['LaTeX', 'tex'], r:['R', 'r'], lua:['Lua', 'lua'], vue:['Vue', 'vue'], dockerfile:['Dockerfile', 'Dockerfile'] };
const CNV_ICO = { eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>', code:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg>', copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>', down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>', big:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>' };
function cnvMeta(pre){
  const code = $('code', pre), cls = (code && code.className) || '', m = cls.match(/language-([\w+#-]+)/i), k = m ? m[1].toLowerCase() : '';
  const txt = code ? code.textContent : pre.textContent, L = CNV_LANG[k] || (k ? [k.toUpperCase(), k.replace(/[^\w]/g, '') || 'txt'] : [/^\s*</.test(txt) ? 'HTML' : 'Texto', /^\s*</.test(txt) ? 'html' : 'txt']);
  /* si la IA puso el nombre del archivo justo antes («index.html», `app.py`…), se usa ese */
  let name = '', prev = pre.parentElement && /\b(cnv|fcard)\b/.test(pre.parentElement.className) ? pre.parentElement.previousElementSibling : pre.previousElementSibling;
  /* v4.1 · con su carpeta («css/estilos.css»), así la página encuentra su CSS y su JS */
  if (prev){ const f = (prev.textContent || '').match(/([\w.\/-]+\.(?:[a-z0-9]{1,6}))\s*[`*)]*\s*[:：]?\s*$/i); if (f && !/^\d+\.\d+$/.test(f[1])) name = f[1]; }
  /* o en un comentario en la primera línea del código: <!-- index.html -->, /* css/estilos.css *\/, // js/app.js, # app.py */
  if (!name){ const f = txt.split('\n', 1)[0].match(/^\s*(?:<!--|\/\*|\/\/|#)\s*(?:(?:archivo|file|filename|nombre)\s*[:：]\s*)?([\w.\/-]+\.([a-z0-9]{1,6}))\s*(?:-->|\*\/)?\s*$/i); if (f && (!k || f[2].toLowerCase() === L[1] || (L[1] === 'html' && /^htm$/i.test(f[2])) || (L[1] === 'js' && /^(mjs|cjs)$/i.test(f[2])))) name = f[1]; }
  name = name.replace(/^\.?\/+/, '');
  if (!name) name = (L[1] === 'Dockerfile' ? 'Dockerfile' : (k === 'md' || k === 'markdown' || k === 'txt' || k === 'text' || !k ? 'documento' : 'codigo') + '.' + L[1]);
  const named = !/^(documento|codigo)\./.test(name) && name !== 'Dockerfile', ext = (name.split('.').pop() || L[1] || 'txt').toLowerCase();
  return { label:L[0], name, named, ext, text:txt.replace(/\n$/, ''), lines:txt.replace(/\n$/, '').split('\n').length };
}
/* v1.9 · archivos como en Claude: cada archivo que da la IA es una tarjeta (nombre, tipo, líneas) con «Ver» y «Descargar»;
   al abrirla sale un lienzo con el código y, si se puede (HTML, SVG, Markdown), la vista previa en vivo.
   Los trozos cortos de código se quedan en el mensaje, solo con «Copiar». */
const FILE_EXT = new Set(['html', 'htm', 'css', 'scss', 'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cc', 'h', 'hpp', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'dart', 'lua', 'sql', 'sh', 'bash', 'ps1', 'json', 'xml', 'svg', 'yaml', 'yml', 'toml', 'md', 'csv', 'vue', 'svelte', 'r', 'm', 'pl', 'scala', 'ino', 'txt', 'ini', 'env', 'dockerfile']);
const canPreview = M => /^(html|htm|svg|md)$/.test(M.ext);
function isFile(M, pre){ return M.named || (M.lines >= 6 && FILE_EXT.has(M.ext)) || (M.lines >= 3 && /^(html|htm|svg)$/.test(M.ext)); }
function codeButtons(body){
  if (!body) return;
  const all = $$('pre', body).filter(pre => !pre.closest('.cnv, .fcard'));
  all.forEach(pre => {
    const old = $('.cpc', pre); if (old) old.remove();
    const M = cnvMeta(pre);
    if (/^(json|txt)$/.test(M.ext) || /"diapositivas"/.test(M.text)){ const D = deckFrom(M.text); if (D){ deckCard(pre, D); return; } }
    if (isFile(M, pre)){
      const c = document.createElement('div'); c.className = 'fcard'; c.dataset.ext = M.ext;
      c.innerHTML = '<button type="button" class="fc-main" data-fv="open" title="Abrir ' + esc(M.name) + '">' + fcIc(M.ext) + '<span class="fc-t"><b>' + esc(M.name) + '</b><small>' + esc(M.label) + ' · ' + M.lines + (M.lines === 1 ? ' línea' : ' líneas') + (canPreview(M) ? ' · con vista previa' : '') + '</small></span></button>'
        + (canPreview(M) ? '<button type="button" class="cnv-b" data-fv="prev">' + CNV_ICO.eye + '<span>Vista previa</span></button>' : '')
        + '<button type="button" class="cnv-b" data-fv="open">' + CNV_ICO.code + '<span>Ver</span></button>'
        + '<button type="button" class="cnv-b" data-fv="down" title="Descargar ' + esc(M.name) + '">' + CNV_ICO.down + '<span>Descargar</span></button>';
      { const pv = c.previousElementSibling, prev0 = pre.previousElementSibling; const h = prev0 && /^(P|H[1-6])$/.test(prev0.tagName) && prev0.textContent.trim().replace(/[:：`*]+$/, '').replace(/^[`*]+/, '').trim() === M.name ? prev0 : null; if (h) h.classList.add('fname-h'); }
      pre.before(c); pre.hidden = true; c.appendChild(pre);
    } else {
      const w = document.createElement('div'); w.className = 'cnv mini';
      w.innerHTML = '<button type="button" class="cnv-b cnv-cp" data-cv="copy" title="Copiar" aria-label="Copiar">' + CNV_ICO.copy + '<span>Copiar</span></button>';
      pre.before(w); w.appendChild(pre);
    }
  });  try{ webGroup(body); }catch(e){}   /* v4.1 · varios archivos de una página → una sola tarjeta «Página web» */
}
const MIME = { html:'text/html', htm:'text/html', css:'text/css', js:'text/javascript', json:'application/json', svg:'image/svg+xml', md:'text/markdown', csv:'text/csv', xml:'application/xml' };
function cnvDownload(M){
  try{ const blob = new Blob([M.text], { type:(MIME[M.ext] || 'text/plain') + ';charset=utf-8' }), u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = M.name.split('/').pop(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); toast('Descargué ' + M.name + '.'); }
  catch(e){ toast('No pude descargarlo. Usa «Copiar».'); }
}
/* los otros archivos del mismo mensaje (para que un HTML use su style.css y su script.js en la vista previa) */
function siblingsOf(card){ const b = card.closest('.body') || card.parentElement; return $$('.fcard pre', b).map(cnvMeta); }
const escRx = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function previewDoc(M, sibs){
  /* v4.1 · si es parte de una página de varios archivos, se arma con sus rutas (css/…, js/…) */
  if (/^(html|htm)$/.test(M.ext) && sibs && sibs.length){ const P = webProject(sibs.some(x => x.name === M.name) ? sibs : [M, ...sibs]); if (P && webFind(P, webNorm(M.name))) return webDoc(P, webNorm(M.name)); }
  if (M.ext === 'svg') return '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#fff}svg{max-width:96vw;max-height:96vh}svg:not([width]){width:96vw;height:96vh}</style>' + M.text;
  let h = M.text;
  if (!/<html[\s>]|<body[\s>]|<!doctype/i.test(h)) h = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + h + '</body></html>';
  (sibs || []).forEach(S => {
    if (S.ext === 'css'){ const rx = new RegExp('<link[^>]+href=["\'](?:\\./)?' + escRx(S.name) + '["\'][^>]*>', 'i'); h = rx.test(h) ? h.replace(rx, () => '<style>' + S.text + '</style>') : h; }
    if (S.ext === 'js'){ const rx = new RegExp('<script[^>]+src=["\'](?:\\./)?' + escRx(S.name) + '["\'][^>]*>\\s*</script>', 'i'); h = rx.test(h) ? h.replace(rx, () => '<script>' + S.text.replace(/<\/script/gi, '<\\/script') + '</script>') : h; }
  });
  return h;
}
/* v2.9.1 · «Sintéticos» (Synthetics): la vista previa ya no es un srcdoc (heredaba las reglas de seguridad de SynthFlow y se rompía con la CSP).
   Ahora carga /sintetico.html, una página aparte con reglas abiertas, y le pasa el código por postMessage. Igual que los artefactos de Claude. */
const SYN_URL = '/sintetico.html';
/* v4.5 · mientras un Sintético se prepara (vista previa a la vista, no las pruebas escondidas) sale la mancha de color de #6 con una frase al azar;
   se quita sola cuando la página ya corre (o a los 7 s, pase lo que pase) */
function synVeil(f){
  try{
    const host = f.parentElement;
    if (!host || f.getAttribute('aria-hidden') === 'true' || !window.SZFx) return () => {};
    const v = document.createElement('div'); v.className = 'fxsyn';
    if (!window.SZFx.mount(v, 'blob', { lang:SZ.lang(), alto:'100%' })) return () => {};
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.appendChild(v);
    let done = false;
    const end = () => { if (done) return; done = true; v.classList.add('off'); setTimeout(() => { try{ window.SZFx.unmount(v); }catch(e){} v.remove(); }, 380); };
    setTimeout(end, 7000);
    return end;
  }catch(e){ return () => {}; }
}
function synLoad(f, html){
  const k = 's' + Math.random().toString(36).slice(2, 10); f._synK = k;
  const veilEnd = synVeil(f);
  const on = e => {
    if (f._synK !== k || !f.isConnected){ removeEventListener('message', on); veilEnd(); return; }
    if (e.source !== f.contentWindow || !e.data || e.data.szs !== 'ready') return;
    removeEventListener('message', on); f.contentWindow.postMessage({ szs:'doc', html }, '*'); setTimeout(veilEnd, 650);
  };
  addEventListener('message', on);
  f.src = SYN_URL + '?k=' + k;
}
/* el lienzo: a la derecha en el computador, pantalla completa en el celular */
let cvEl = null;
function openCanvas(M, sibs, tab){
  closeCanvas(true);
  const pv = canPreview(M);
  const o = document.createElement('div'); o.className = 'cvp'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', M.name);
  o.innerHTML = '<div class="cvp-in"><div class="cvp-h">' + fcIc(M.ext) + '<span class="cnv-t"><b>' + esc(M.name) + '</b><small>' + (pv ? '<span class="cvp-syn" title="Obra (en inglés, Work): corre aparte y aislada, como en Claude">Sintético</span> · ' : '') + esc(M.label) + ' · ' + M.lines + ' líneas</small></span>'
    + '<button type="button" class="cnv-b" data-cv="copy">' + CNV_ICO.copy + '<span>Copiar</span></button><button type="button" class="cnv-b" data-cv="down">' + CNV_ICO.down + '<span>Descargar</span></button><button type="button" class="cnv-b ic" data-cx aria-label="Cerrar">✕</button></div>'
    + (pv ? '<div class="cvp-tabs" role="tablist"><button type="button" role="tab" data-tab="code">Código</button><button type="button" role="tab" data-tab="prev">Vista previa</button></div>' : '')
    + '<div class="cvp-b"><pre class="cvp-code"><code></code></pre>' + (pv ? '<div class="cvp-prev" hidden></div>' : '') + '</div></div>';
  const code = $('code', o); code.innerHTML = hlCode(M.text, M.ext);   /* v2.4 · colores en el código */
  document.body.appendChild(o); cvEl = o; document.body.classList.add('canvasing');
  requestAnimationFrame(() => o.classList.add('on'));
  const box = $('.cvp-prev', o);
  const show = t => {
    $$('[data-tab]', o).forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    $('.cvp-code', o).hidden = t === 'prev'; if (box) box.hidden = t !== 'prev';
    if (t === 'prev' && box && !box.firstChild){
      if (M.ext === 'md'){ const d = document.createElement('div'); d.className = 'cvp-md'; d.innerHTML = md(M.text); box.appendChild(d); }
      else {
        /* la vista previa corre aislada: sin acceso a tu cuenta, tus chats ni esta página */
        const f = document.createElement('iframe'); f.title = 'Obra: vista previa de ' + M.name; f.setAttribute('sandbox', 'allow-scripts allow-modals allow-forms allow-pointer-lock'); f.setAttribute('referrerpolicy', 'no-referrer');
        box.appendChild(f);
        if (M.ext === 'svg') synLoad(f, previewDoc(M, sibs)); else cvTools(o, box, M, sibs).load();   /* v2.4 · consola, tamaños de pantalla y volver a cargar */
      }
    }
  };
  show(pv && tab === 'prev' ? 'prev' : 'code');
  o.addEventListener('click', async e => {
    if (e.target === o || e.target.closest('[data-cx]')) return closeCanvas();
    const t = e.target.closest('[data-tab]'); if (t) return show(t.dataset.tab);
    const b = e.target.closest('[data-cv]'); if (!b) return;
    if (b.dataset.cv === 'copy'){ await copyText(M.text); flash(b, '¡Copiado!'); } else cnvDownload(M);
  });
}
/* v3.0 · al terminar una respuesta con un archivo, su Sintético se abre solo al lado (como en Claude): el que se ve en vivo, si hay; si no, el último.
   En el celular no se abre solo (taparía todo): queda la tarjeta para tocarla */
function synAuto(el){
  if (!el || !matchMedia('(min-width:900px)').matches) return;
  { const w = $('.wproj', el); if (w && w._web){ webOpen(w._web, { tab:'prev' }); return; } }
  const cards = $$('.fcard:not(.deck)', el); if (!cards.length) return;
  const pv = cards.filter(c => canPreview(cnvMeta($('pre', c)))), c = (pv.length ? pv : cards).pop(), M = cnvMeta($('pre', c));
  openCanvas(M, siblingsOf(c), canPreview(M) ? 'prev' : 'code');
}
function closeCanvas(now){ if (!cvEl) return; const o = cvEl; cvEl = null; document.body.classList.remove('canvasing'); if (now){ o.remove(); return; } o.classList.remove('on'); setTimeout(() => o.remove(), 380); }
addEventListener('keydown', e => { if (e.key === 'Escape' && cvEl){ e.stopPropagation(); closeCanvas(); } }, true);
document.addEventListener('click', async e => {
  const f = e.target.closest && e.target.closest('.fcard [data-fv]');
  if (f){
    const card = f.closest('.fcard'), M = cnvMeta($('pre', card));
    if (f.dataset.fv !== 'down' && webOf(card)){ const P = webOf(card); webOpen(P, { path:webNorm(M.name), tab:f.dataset.fv === 'prev' ? 'prev' : 'code' }); return; }
    if (f.dataset.fv === 'down') cnvDownload(M);
    else openCanvas(M, siblingsOf(card), f.dataset.fv === 'prev' ? 'prev' : 'code');
    return;
  }
  const b = e.target.closest && e.target.closest('.cnv.mini [data-cv]'); if (!b) return;
  const M = cnvMeta($('pre', b.closest('.cnv')));
  await copyText(M.text); flash(b, '¡Copiado!'); SZ.SND.tap && SZ.SND.tap();
});
const STAR_A = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/></svg>';
function finishBot(el, meta, last, cont, starred){
  codeButtons($('.body', el)); if (el._sources) citeLinks($('.body', el), el._sources);
  if (meta) el.insertAdjacentHTML('beforeend', '<div class="meta">' + esc(meta) + '</div>');
  el.classList.toggle('starred', !!starred);
  el.insertAdjacentHTML('beforeend', '<div class="acts"><button class="act" data-a="copy" data-tip="Copiar" aria-label="Copiar">' + COPY + 'Copiar</button><button class="act" data-a="voice" data-tip="Escuchar" aria-label="Escuchar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg><span>Escuchar</span></button><button class="act" data-a="star" aria-pressed="' + !!starred + '" data-tip="' + (starred ? 'Quitar de favoritos' : 'Guardar en favoritos') + '" aria-label="Guardar en favoritos">' + STAR_A + '<span>' + (starred ? 'Favorita' : 'Guardar') + '</span></button>' + (last ? '<button class="act" data-a="regen" data-tip="Otra respuesta (cuenta como un mensaje)" aria-label="Pedir otra respuesta">' + REGEN + 'Otra vez</button>' : '') + (last && cont ? '<button class="act" data-a="cont" data-tip="Que siga desde donde quedó" aria-label="Continuar">↪ Continuar</button>' : '') + '</div>');
  $$('.acts .act', el).forEach(b => { if (!b.title) b.title = b.textContent.trim(); if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', b.textContent.trim()); });
  el.classList.toggle('last', !!last);
}
/* ---------- saludo: al entrar siempre «¿Qué quieres FlowIA’r hoy?»; en cada chat nuevo, otra frase que no se repite ----------
   v3.2 (Sammuel, 28 oct): las frases van saliendo de una bolsa barajada que se guarda; ninguna se repite hasta usarlas todas,
   y al volver a barajar la última nunca sale primero. La única que se repite es la de entrada. */
const GREET = [
  ['¿Qué quieres ', 'FlowIA’r', ' hoy?'],
  ['Suelta la idea, la ', 'FlowIAmos', '.'],
  ['¿A qué problema le ponemos ', 'Flow', ' hoy?'],
  ['Una idea, mucho ', 'Flow', ', cero límites.'],
  ['Tú pones la idea, ', 'yo el Flow', '.'],
  ['¿Qué ', 'creamos', ' juntos hoy?'],
  ['¿Escribimos, programamos ', 'o soñamos', '?'],
  ['Modo Flow: ', 'activado', '. ¿Qué sigue?'],
  ['¿En qué te ', 'ayudo', ' hoy?'],
  ['Cuéntame, ¿qué tienes ', 'en mente', '?'],
  ['Hoy es buen día para ', 'aprender algo', '.'],
  ['¿Qué te da ', 'curiosidad', ' hoy?'],
  ['Pregunta sin miedo: ', 'aquí nada es tonto', '.'],
  ['Lo difícil, ', 'lo hacemos fácil', '.'],
  ['¿Arrancamos con ', 'una idea loca', '?'],
  ['Dime qué necesitas y ', 'lo armamos', '.'],
  ['¿Qué quieres ', 'entender mejor', '?'],
  ['De la idea al resultado, ', 'sin enredos', '.'],
  ['¿Un texto, un plan ', 'o un código', '?'],
  ['Hagamos que ', 'fluya', '.'],
  ['Tu idea merece ', 'un buen comienzo', '.'],
  ['¿Qué tarea te ', 'quito de encima', ' hoy?'],
  ['Escribe como hablas: ', 'yo te entiendo', '.'],
  ['¿Practicamos ', 'otro idioma', '?'],
  ['¿Organizamos ', 'tu semana', '?'],
  ['Una pregunta puede ', 'cambiarlo todo', '.'],
  ['¿Qué vamos a ', 'inventar', ' ahora?'],
  ['Tranqui, ', 'paso a paso', '.'],
  ['¿Le damos forma a ', 'ese proyecto', '?'],
  ['La página en blanco ', 'ya no asusta', '.'],
  ['¿Qué historia ', 'contamos', ' hoy?'],
  ['Tú pones el reto, ', 'yo las ideas', '.'],
  ['¿Resolvemos ', 'esa duda', ' de una vez?'],
  ['Menos vueltas, ', 'más Flow', '.'],
  ['¿Qué quieres ', 'mejorar', ' hoy?'],
  ['Varias IA, ', 'una sola caja', '.'],
  ['¿Estudiamos ', 'juntos', '?'],
  ['Tu próxima gran idea ', 'empieza aquí', '.'],
  ['¿Algo para explicar, ', 'crear o arreglar', '?'],
  ['A ver, ', 'sorpréndeme', '.']
];
/* los mismos saludos en inglés (la clave es la frase en español) */
const GREET_EN = {
  '¿Qué quieres FlowIA’r hoy?':['What do you want to ', 'FlowIA', ' today?'],
  '¿Qué quieres FlowIA’r?':['What do you want to ', 'FlowIA', '?'],
  'Suelta la idea, la FlowIAmos.':['Drop the idea, we\'ll ', 'FlowIA it', '.'],
  '¿A qué problema le ponemos Flow hoy?':['Which problem gets some ', 'Flow', ' today?'],
  'Una idea, mucho Flow, cero límites.':['One idea, lots of ', 'Flow', ', zero limits.'],
  'Tú pones la idea, yo el Flow.':['You bring the idea, ', 'I bring the Flow', '.'],
  '¿Qué creamos juntos hoy?':['What shall we ', 'create', ' together today?'],
  '¿Escribimos, programamos o soñamos?':['Shall we write, code ', 'or dream', '?'],
  'Modo Flow: activado. ¿Qué sigue?':['Flow mode: ', 'on', '. What\'s next?'],
  '¿En qué te ayudo hoy?':['How can I ', 'help', ' today?'],
  'Cuéntame, ¿qué tienes en mente?':['Tell me, what do you have ', 'in mind', '?'],
  'Hoy es buen día para aprender algo.':['Today is a good day to ', 'learn something', '.'],
  '¿Qué te da curiosidad hoy?':['What are you ', 'curious', ' about today?'],
  'Pregunta sin miedo: aquí nada es tonto.':['Ask freely: ', 'no silly questions', ' here.'],
  'Lo difícil, lo hacemos fácil.':['The hard stuff, ', 'made easy', '.'],
  '¿Arrancamos con una idea loca?':['Shall we start with ', 'a wild idea', '?'],
  'Dime qué necesitas y lo armamos.':['Tell me what you need and ', 'we\'ll build it', '.'],
  '¿Qué quieres entender mejor?':['What would you like to ', 'understand better', '?'],
  'De la idea al resultado, sin enredos.':['From idea to result, ', 'no hassle', '.'],
  '¿Un texto, un plan o un código?':['A text, a plan ', 'or some code', '?'],
  'Hagamos que fluya.':['Let\'s make it ', 'flow', '.'],
  'Tu idea merece un buen comienzo.':['Your idea deserves ', 'a great start', '.'],
  '¿Qué tarea te quito de encima hoy?':['Which task can I ', 'take off your plate', ' today?'],
  'Escribe como hablas: yo te entiendo.':['Write like you talk: ', 'I\'ll get it', '.'],
  '¿Practicamos otro idioma?':['Shall we practice ', 'another language', '?'],
  '¿Organizamos tu semana?':['Shall we plan ', 'your week', '?'],
  'Una pregunta puede cambiarlo todo.':['One question can ', 'change everything', '.'],
  '¿Qué vamos a inventar ahora?':['What shall we ', 'invent', ' now?'],
  'Tranqui, paso a paso.':['No rush, ', 'step by step', '.'],
  '¿Le damos forma a ese proyecto?':['Shall we shape ', 'that project', '?'],
  'La página en blanco ya no asusta.':['The blank page ', 'isn\'t scary', ' anymore.'],
  '¿Qué historia contamos hoy?':['What story shall we ', 'tell', ' today?'],
  'Tú pones el reto, yo las ideas.':['You bring the challenge, ', 'I bring ideas', '.'],
  '¿Resolvemos esa duda de una vez?':['Shall we settle ', 'that question', ' for good?'],
  'Menos vueltas, más Flow.':['Less fuss, ', 'more Flow', '.'],
  '¿Qué quieres mejorar hoy?':['What do you want to ', 'improve', ' today?'],
  'Varias IA, una sola caja.':['Many AIs, ', 'one single box', '.'],
  '¿Estudiamos juntos?':['Shall we ', 'study together', '?'],
  'Tu próxima gran idea empieza aquí.':['Your next big idea ', 'starts here', '.'],
  '¿Algo para explicar, crear o arreglar?':['Something to explain, ', 'create or fix', '?'],
  'A ver, sorpréndeme.':['Go on, ', 'surprise me', '.']
};
const GBAG = 'synthz:greetBag';
let greetI = 0;   /* al entrar, siempre la de entrada */
function nextGreet(){
  let bag = []; try{ bag = JSON.parse(localStorage.getItem(GBAG) || '[]'); }catch(e){}
  bag = Array.isArray(bag) ? bag.filter(i => i > 0 && GREET[i]) : [];
  if (!bag.length){
    bag = GREET.map((_, i) => i).slice(1);
    for (let i = bag.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    if (bag[0] === greetI) bag.push(bag.shift());
  }
  greetI = bag.shift();
  try{ localStorage.setItem(GBAG, JSON.stringify(bag)); }catch(e){}
}
/* «¿Qué es FlowIA’r?»: un botoncito bajo el saludo que lo explica para quien no sabe inglés ni conoce la página */
/* v3.2 · quién lo ve (Sammuel, 28 oct): sin cuenta (prueba) sale siempre; con cuenta, una sola vez
   (durante esa visita se queda aunque abras chats nuevos). Lleva el borde de luz (.mv-edge) para que se note. */
function flowQOn(){
  try{
    const acc = !!((SZ.ACC && SZ.ACC.ready) || (SZ.signedish && SZ.signedish()));
    if (!acc) return true;
    if (sessionStorage.getItem('synthz:flowqNow')) return true;
    if (localStorage.getItem('synthz:flowq')) return false;
    localStorage.setItem('synthz:flowq', '1'); sessionStorage.setItem('synthz:flowqNow', '1'); return true;
  }catch(e){ return true; }
}
function flowWhatHtml(){
  if (!flowQOn()) return '';
  return '<button type="button" class="flowq notr mv-edge" id="flowQ" aria-expanded="false" aria-controls="flowW">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
    + (SZ.lang() === 'en' ? 'What does «FlowIA» mean?' : '¿Qué significa «FlowIA’r»?') + '</button>';
}
function flowWhatCard(){
  const en = SZ.lang() === 'en';
  return en
    ? '<b class="flw-tt">FlowIA = Flow + IA</b>'
      + '<p><i>🌊</i><span><b>Flow</b> (say «flo») is an English word: it means <em>flowing</em>, like water in a river. When everything goes easy, without getting stuck, people say you are «in the flow».</span></p>'
      + '<p><i>🤖</i><span><b>IA</b> is how Spanish says <em>AI</em>: artificial intelligence, programs that understand what you write and answer you.</span></p>'
      + '<p><i>✨</i><span><b>FlowIA</b> (say «flo-ee-ah») is a word we made up by joining them: doing what you need (write, study, create, code) <em>the easy way, with the help of AI</em>.</span></p>'
      + '<p class="fw-ex">«What do you want to FlowIA today?» = «What would you like to do today with the help of AI?»</p>'
    : '<b class="flw-tt">FlowIA’r = Flow + IA</b>'
      + '<p><i>🌊</i><span><b>Flow</b> (se dice «flou») es una palabra en inglés que significa <em>fluir</em>, como el agua de un río. Cuando todo sale fácil, sin trabarse, se dice que estás «en flow».</span></p>'
      + '<p><i>🤖</i><span><b>IA</b> es la <em>inteligencia artificial</em>: programas que entienden lo que escribes y te responden.</span></p>'
      + '<p><i>✨</i><span><b>FlowIA’r</b> (se dice «flou-ia-ar») es un verbo que inventamos uniendo las dos: hacer lo que necesitas (escribir, estudiar, crear, programar) <em>de forma fácil, con ayuda de la IA</em>.</span></p>'
      + '<p class="fw-ex">«¿Qué quieres FlowIA’r hoy?» = «¿Qué quieres hacer hoy con ayuda de la IA?»</p>';
}
document.addEventListener('click', e => {
  const q = e.target.closest && e.target.closest('#flowQ'); if (!q) return;
  let w = $('#flowW');
  if (w){ q.setAttribute('aria-expanded', 'false'); w.classList.remove('on'); setTimeout(() => w.remove(), 260); return; }
  w = document.createElement('div'); w.id = 'flowW'; w.className = 'floww notr'; w.setAttribute('role', 'note'); w.innerHTML = flowWhatCard();
  q.after(w); q.setAttribute('aria-expanded', 'true'); requestAnimationFrame(() => w.classList.add('on'));
  SZ.SND && SZ.SND.tap && SZ.SND.tap();
});
/* v3.3 · con cuenta, el saludo te llama por tu nombre (Sammuel, 28 oct: «para que se sienta más amigable») */
function hiName(){
  try{
    if (!(SZ.ACC && SZ.ACC.ready && SZ.ACC.user)) return '';
    const full = String((SZ.ACC.profile && SZ.ACC.profile.name) || SZ.ACC.user.name || SZ.ACC.user.username || '').trim();
    const n = full.split(/\s+/)[0].replace(/^@/, '').slice(0, 24); if (!n) return '';
    const h = new Date().getHours(), en = SZ.lang() === 'en';
    const hi = en ? (h < 12 ? 'Good morning' : h < 19 ? 'Good afternoon' : 'Good evening') : (h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches');
    return '<p class="ghi notr">' + hi + ', <b>' + esc(n) + '</b> <span aria-hidden="true">👋</span></p>';
  }catch(e){ return ''; }
}
function greetHtml(g){
  if (SZ.lang() === 'en') g = GREET_EN[g.join('')] || g;
  let i = 0;
  const w = s => s.split(/(\s+)/).filter(Boolean).map(x => /^\s+$/.test(x) ? ' ' : '<span class="w" style="--i:' + (i++) + '">' + esc(x) + '</span>').join('');
  const tail = g[2].match(/^[.,!?;:]+/), rest = tail ? g[2].slice(tail[0].length) : g[2];
  /* la palabra resaltada y su punto van juntos: nunca queda un «.» solo al empezar la línea */
  return w(g[0]) + '<span class="wnb">' + '<em class="w" style="--i:' + (i++) + '">' + esc(g[1]) + '</em>' + (tail ? '<span class="w wp" style="--i:' + (i++) + '">' + esc(tail[0]) + '</span>' : '') + '</span>' + w(rest);
}
/* ---------- v2.4 · SynthCode: las IAs programan como profesionales ----------
   1) Cuando pides código, la IA recibe un manual de ingeniería (planear → escribir completo → revisarse).
   2) Cada página que da la IA se prueba sola en un navegador aislado (computador y celular):
      errores, botones que fallan, cosas que se salen de la pantalla, imágenes rotas, contraste, código incompleto…
   3) Si encuentra errores de verdad, la IA los arregla sola una vez; lo demás queda con «Arreglar con la IA».
   4) El lienzo trae consola, tamaños de pantalla y colores en el código. */
const CODE_RX = /```|c[oó]digo|program|\bscript|html|\bcss\b|javascript|\bjs\b|typescript|python|\bjava\b|c\+\+|c#|\bphp\b|\bsql\b|react|\bvue\b|svelte|next\.?js|node|\bapi\b|\bbug|depura|debug|compil|funci[oó]n|algoritmo|regex|base de datos|backend|frontend|\bapp\b|aplicaci[oó]n|p[aá]gina web|sitio web|landing|\bweb\b|juego|calculadora|formulario|\bbot\b|terminal|\bbash\b|\bjson\b|tailwind|flutter|kotlin|swift|\brust\b|golang|arduino|excel con macros|macro/i;
const CODE_FILE_RX = /\.(html?|css|scss|jsx?|tsx?|py|java|c|cpp|cs|go|rs|php|rb|swift|kt|dart|lua|sql|sh|json|vue|svelte|ino)$/i;
const CODE_SYS = [
  'MODO SYNTHCODE. Eres un ingeniero de software senior y diseñador de producto de primer nivel. Tu código funciona a la primera, es completo, limpio y hermoso. Eres perfeccionista: prefieres revisar dos veces antes que entregar algo roto.',
  'CÓMO TRABAJAS',
  '1. Entiende el pedido. Si algo importante es ambiguo, elige la opción más razonable y dilo en una línea (no frenes con preguntas).',
  '2. Plan: si el pedido no es trivial, empieza con «**Plan**» y 2 a 5 viñetas cortas (estructura, archivos, decisiones clave).',
  '3. Escribe el código COMPLETO. Nunca pongas «...», «// resto igual», «// tu código aquí», TODO ni partes omitidas: cada archivo que entregas se puede copiar y correr tal cual. Si cambias un archivo, devuélvelo entero.',
  '4. Revísate antes de terminar, línea por línea: sintaxis, llaves y etiquetas cerradas, variables definidas antes de usarse, nombres que coinciden entre HTML, CSS y JS, casos borde (vacío, cero, texto largo, error de red), y que todo lo que prometiste esté hecho.',
  '5. Cierra con «**Revisión**»: 2 a 4 viñetas con lo que comprobaste y cómo usarlo (cómo abrirlo o correrlo). Sin relleno.',
  'FORMATO',
  '- Antes de cada bloque de código escribe el nombre del archivo en su propia línea (por ejemplo: index.html). Un bloque por archivo, con el lenguaje correcto en la cerca (```html, ```css, ```js, ```python…).',
  '- Para una página o app web, si no piden otra cosa, entrega UN solo archivo index.html con el CSS en <style> y el JS en <script>: así se ve al instante en la vista previa. Sin librerías externas salvo que de verdad hagan falta (y entonces desde un CDN conocido con versión fija).',
  '- Explicaciones breves y claras, en el idioma de la persona. Nada de disculpas ni frases vacías.',
  'CALIDAD DE CÓDIGO',
  '- Nombres claros y descriptivos; funciones pequeñas con una sola tarea; nada de código muerto ni duplicado; comentarios solo donde explican el porqué.',
  '- JavaScript moderno: const/let, ===, funciones flecha, async/await con try/catch, addEventListener (nunca onclick en el HTML), módulos limpios, sin variables globales sueltas. Nunca metas texto del usuario con innerHTML: usa textContent o escápalo.',
  '- Valida entradas, maneja errores con mensajes amables para la persona y estados de carga, vacío y error. Guarda datos con localStorage cuando tenga sentido (siempre dentro de try/catch).',
  '- Python: PEP 8, type hints, funciones con docstring corto, pathlib, f-strings, if __name__ == "__main__":, manejo de excepciones concreto, sin dependencias innecesarias (si usas una, di cómo instalarla).',
  '- Otros lenguajes: sigue las convenciones oficiales del lenguaje y su herramienta de formato estándar.',
  '- Seguridad: nunca pongas claves ni contraseñas en el código; consultas SQL con parámetros; valida en el servidor.',
  'DISEÑO (cuando hay interfaz)',
  '- Se tiene que ver espectacular y profesional, como un producto real de 2026: jerarquía clara, tipografía del sistema o una buena de Google Fonts, escala de tamaños consistente, espacios en múltiplos de 8px, bordes suaves, sombras sutiles y una paleta de 1 color de acento + neutros definida con variables CSS en :root.',
  '- Responsive de verdad: mobile-first, sin scroll horizontal en un celular de 360px, imágenes con max-width:100%, grid/flex, botones de al menos 44px para el dedo.',
  '- Accesible: HTML semántico (header, main, nav, section, button), lang en <html>, <meta name="viewport">, <title>, alt en imágenes, labels en los campos, contraste mínimo 4.5:1, foco visible con :focus-visible, todo usable con teclado.',
  '- Detalles que enamoran: estados hover, active y focus, transiciones de 150 a 300ms, microanimaciones con prefers-reduced-motion respetado, modo oscuro con prefers-color-scheme si encaja, textos reales (nunca lorem ipsum) e íconos en SVG en línea en vez de imágenes que se pueden romper.',
  'Tu página se probará sola en un navegador (computador y celular): errores de consola, botones, desbordes, imágenes y contraste. Entrégala sin un solo error.'
].join('\n');
const CODE_SYS_SHORT = 'MODO SYNTHCODE (ahorro). Eres un ingeniero senior perfeccionista. Entrega código COMPLETO y funcional (nunca «...», TODO ni partes omitidas), con el nombre del archivo antes de cada bloque y el lenguaje en la cerca. Para webs: un solo index.html con <style> y <script>, responsive, accesible y bonito. Revisa sintaxis, nombres y casos borde antes de terminar. Explica en 1 a 3 líneas cómo usarlo.';
/* ¿esta conversación es de programar? (el último pedido, un archivo de código adjunto o seguir hablando de un código anterior) */
const FIX_TAG = '[Revisión automática de Sonyx]';
const isFix = m => !!m && m.role === 'user' && (!!m.fix || String(m.content || '').startsWith(FIX_TAG));
function codeMode(chat){
  const u = [...chat].reverse().find(m => m.role === 'user'); if (!u) return false;
  if (isFix(u)) return true;
  const t = String(u.ask || u.content || '');
  if (CODE_RX.test(t)) return true;
  if ((u.files || []).some(f => CODE_FILE_RX.test(f.name || ''))) return true;
  const i = chat.lastIndexOf(u), prev = chat.slice(Math.max(0, i - 3), i).filter(m => m.role === 'assistant');
  return t.length < 400 && prev.some(m => /```/.test(m.content || ''));
}
function codeSystem(chat, saver){ return codeMode(chat) ? (saver ? CODE_SYS_SHORT : CODE_SYS) : ''; }

/* ---------- el probador: corre la página aislada y avisa lo que ve ---------- */
/* va pegado al principio de la página, sin saltos de línea, para que los números de línea de los errores sigan siendo los del archivo */
const PROBE = (id, act) => '<script>(function(){var I=' + JSON.stringify(id) + ',A=' + (act ? 1 : 0) + ',cur="";'
  + 'function S(t,d){try{parent.postMessage({szp:I,t:t,d:d},"*")}catch(e){}}'
  + 'function str(v){try{return typeof v==="string"?v:v instanceof Error?v.name+": "+v.message:JSON.stringify(v)}catch(e){return String(v)}}'
  + '["error","warn","log","info"].forEach(function(k){var o=console[k];console[k]=function(){S("con",{k:k,m:[].slice.call(arguments).map(str).join(" ").slice(0,500)});return o&&o.apply(console,arguments)}});'
  + 'addEventListener("error",function(e){var t=e.target;if(t&&t!==window&&t.tagName){S("net",{tag:t.tagName,u:String(t.currentSrc||t.src||t.href||"").slice(0,200)});return}S("exc",{m:e.message||"Error",l:e.lineno||0,c:e.colno||0,a:cur})},true);'
  + 'addEventListener("unhandledrejection",function(e){S("exc",{m:"Promesa sin manejar: "+str(e.reason).slice(0,300),l:0,a:cur})});'
  + 'function rgb(s){var m=String(s).match(/[\\d.]+/g);return m&&m.length>=3?m.map(Number):null}'
  + 'function lum(c){var a=[c[0],c[1],c[2]].map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]}'
  + 'function bg(el){while(el&&el.nodeType===1){var cs=getComputedStyle(el);if(cs.backgroundImage&&cs.backgroundImage!=="none")return null;var c=rgb(cs.backgroundColor);if(c&&(c.length<4||c[3]>.85))return c;el=el.parentElement}return[255,255,255]}'
  + 'function who(el){var s=el.tagName.toLowerCase();if(el.id)s+="#"+el.id;var c=(typeof el.className==="string"?el.className:"").trim().split(/\\s+/).filter(Boolean).slice(0,2);if(c.length)s+="."+c.join(".");return s}'
  + 'function vis(el){var r=el.getBoundingClientRect();if(r.width<1||r.height<1)return false;var cs=getComputedStyle(el);return cs.visibility!=="hidden"&&cs.display!=="none"&&+cs.opacity>.05}'
  + 'function label(el){return(el.getAttribute("aria-label")||el.textContent||el.value||el.title||"").replace(/\\s+/g," ").trim().slice(0,40)}'
  + 'function audit(){var d=document,b=d.body,o={w:innerWidth};if(!b){S("audit",{empty:1});return}'
  + 'o.sw=d.documentElement.scrollWidth;o.over=[];if(o.sw>innerWidth+1){var all=b.querySelectorAll("*");for(var i=0;i<all.length&&o.over.length<4;i++){var r=all[i].getBoundingClientRect();if(r.right>innerWidth+1&&r.width>0&&getComputedStyle(all[i]).position!=="fixed"){var p=all[i].parentElement,pr=p&&p.getBoundingClientRect();if(!pr||pr.right<=innerWidth+1)o.over.push(who(all[i])+" ("+Math.round(r.right)+"px)")}}}'
  + 'o.text=(b.innerText||"").trim().length;o.media=b.querySelectorAll("canvas,svg,img,video,iframe").length;o.els=b.querySelectorAll("*").length;'
  + 'o.broken=[].slice.call(d.images).filter(function(im){return im.complete&&!im.naturalWidth&&im.getAttribute("src")}).map(function(im){return String(im.getAttribute("src")).slice(0,90)}).slice(0,4);'
  + 'o.noalt=[].slice.call(d.images).filter(function(im){return!im.hasAttribute("alt")}).length;'
  + 'o.unnamed=[].slice.call(b.querySelectorAll("button,a[href],[role=button]")).filter(function(el){return vis(el)&&!label(el)&&!el.querySelector("img[alt]:not([alt=\'\']),svg title")}).length;'
  + 'o.nolabel=[].slice.call(b.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]),select,textarea")).filter(function(el){return!(el.labels&&el.labels.length)&&!el.getAttribute("aria-label")&&!el.getAttribute("aria-labelledby")&&!el.getAttribute("title")}).length;'
  + 'o.title=!!(d.title||"").trim();o.vp=!!d.querySelector("meta[name=viewport]");o.lang=!!d.documentElement.getAttribute("lang");'
  + 'var low=[],tiny=0,seen=0,els=b.querySelectorAll("*");for(var j=0;j<els.length&&seen<500;j++){var el=els[j],own="";for(var n=el.firstChild;n;n=n.nextSibling)if(n.nodeType===3)own+=n.nodeValue;own=own.trim();if(!own||!vis(el))continue;seen++;var cs=getComputedStyle(el),fs=parseFloat(cs.fontSize)||16;if(fs<11.5)tiny++;var fg=rgb(cs.color),bk=bg(el);if(!fg||!bk||(fg.length>3&&fg[3]<.5))continue;var L1=lum(fg),L2=lum(bk),cr=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05),big=fs>=24||(fs>=18.6&&+cs.fontWeight>=700);if(cr<(big?3:4.5)&&low.length<3)low.push("«"+own.slice(0,30)+"» ("+cr.toFixed(1)+":1)")}'
  + 'o.low=low;o.tiny=tiny;o.btns=[].slice.call(b.querySelectorAll("button,[role=button],input[type=button]")).filter(vis).length;S("audit",o)}'
  + 'function poke(){var bs=[].slice.call(document.querySelectorAll("button:not([disabled]),[role=button],input[type=button]")).filter(vis).slice(0,14),k=0;'
  + '(function next(){if(k>=bs.length){cur="";S("done",{n:bs.length});return}var el=bs[k++];cur=label(el)||who(el);try{if(el.isConnected)el.click()}catch(e){S("exc",{m:str(e),l:0,a:cur})}setTimeout(next,140)})()}'
  + 'addEventListener("load",function(){setTimeout(function(){audit();if(A)setTimeout(poke,200);else S("done",{n:0})},600)});'
  + '})();<\/script>';
function probeDoc(html, id, act){
  /* el probador va primero que todo; si la página no tiene <head>, igual queda arriba */
  const p = PROBE(id, act);
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, m => m + p);
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, m => m + p);
  return p + html;
}
/* corre una página escondida con un ancho dado y junta lo que pasó */
function runProbe(doc, w, h, act){
  return new Promise(res => {
    const id = 'p' + Math.random().toString(36).slice(2, 10), out = { exc:[], con:[], net:[], audit:null, done:false, alive:false, w };
    const f = document.createElement('iframe');
    f.setAttribute('sandbox', 'allow-scripts'); f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    f.style.cssText = 'position:fixed;left:-30000px;top:0;width:' + w + 'px;height:' + h + 'px;border:0;opacity:0;pointer-events:none';
    let t = 0;
    const end = () => { clearTimeout(t); removeEventListener('message', on); f.remove(); res(out); };
    const on = e => {
      const d = e.data; if (!d || d.szp !== id || e.source !== f.contentWindow) return;
      out.alive = true;
      if (d.t === 'exc' && out.exc.length < 12) out.exc.push(d.d);
      else if (d.t === 'con' && out.con.length < 40) out.con.push(d.d);
      else if (d.t === 'net' && out.net.length < 8) out.net.push(d.d);
      else if (d.t === 'audit') out.audit = d.d;
      else if (d.t === 'done'){ out.done = true; setTimeout(end, 120); }
    };
    addEventListener('message', on);
    t = setTimeout(end, act ? 9000 : 6500);
    document.body.appendChild(f);
    synLoad(f, probeDoc(doc, id, act));
  });
}
/* ---------- revisión de cada archivo ---------- */
const PLACEHOLDER_RX = /(?:\/\/|#|<!--|\/\*)\s*(?:\.\.\.|…)|(?:\/\/|#|<!--|\/\*)[^\n]*\b(?:resto (?:del|igual|de)|el resto|rest of (?:the )?code|same as (?:before|above)|igual que (?:antes|arriba)|(?:tu|your) c[oó]digo aqu[ií]|(?:your )?code (?:goes )?here|agrega(?:r)? (?:aqu[ií]|el resto)|completa(?:r)? aqu[ií]|implementa(?:r)? aqu[ií])|(?:\/\/|#)\s*TODO\b|lorem ipsum/i;
const lineAt = (txt, n) => { const L = String(txt).split('\n')[n - 1]; return L ? L.trim().slice(0, 140) : ''; };
function staticIssues(M){
  const hard = [], soft = [], t = M.text;
  { const m = t.match(PLACEHOLDER_RX); if (m) (/lorem ipsum/i.test(m[0]) ? soft : hard).push(/lorem ipsum/i.test(m[0]) ? M.name + ': usa texto de relleno (lorem ipsum) en vez de texto real.' : M.name + ': está incompleto, tiene partes omitidas («' + lineAt(t, t.slice(0, m.index).split('\n').length).slice(0, 80) + '»). Hay que escribirlo entero.'); }
  if (/^(html|htm)$/.test(M.ext) && /<html[\s>]/i.test(t) && !/<\/html>\s*$/i.test(t.trim())) hard.push(M.name + ': el archivo se cortó antes de terminar (no llega hasta </html>).');
  if (M.ext === 'json'){ try{ JSON.parse(t); }catch(e){ hard.push(M.name + ': el JSON no es válido (' + String(e.message).slice(0, 120) + ').'); } }
  if (/^(css|scss)$/.test(M.ext)){ const o = (t.replace(/\/\*[\s\S]*?\*\//g, '').match(/\{/g) || []).length, c = (t.replace(/\/\*[\s\S]*?\*\//g, '').match(/\}/g) || []).length; if (o !== c) hard.push(M.name + ': las llaves { } no cuadran (' + o + ' abren y ' + c + ' cierran).'); }
  if (M.ext === 'svg'){ try{ const d = new DOMParser().parseFromString(t, 'image/svg+xml'); const pe = d.querySelector('parsererror'); if (pe) hard.push(M.name + ': el SVG está mal formado (' + pe.textContent.replace(/\s+/g, ' ').trim().slice(0, 120) + ').'); }catch(e){} }
  return { hard, soft };
}
/* JavaScript suelto: solo se revisa que esté bien escrito (se envuelve en una función que nunca se llama, así no corre nada) */
async function jsSyntax(M){
  if (!/^(js|mjs|cjs)$/.test(M.ext) || /^\s*(import|export)\s/m.test(M.text) || /<\/script/i.test(M.text)) return [];
  const code = M.text.replace(/^#!.*/, '');   /* el #! de node se deja como línea vacía: los números de línea no cambian */
  const r = await runProbe('<!doctype html><html><head></head><body><script>async function __sz(){\n' + code + '\n}<\/script></body></html>', 400, 300, false);
  return r.exc.filter(x => /SyntaxError|Unexpected|missing|Invalid|unterminated/i.test(x.m)).slice(0, 2).map(x => M.name + (x.l > 1 ? ' (línea ' + (x.l - 1) + ': ' + lineAt(M.text, x.l - 1) + ')' : '') + ': ' + x.m);
}
/* página HTML: computador con clics en los botones + celular */
async function pageIssues(M, sibs){
  const hard = [], soft = [], meta = { btns:0 };
  const doc = previewDoc(M, sibs);
  const [pc, cel] = await Promise.all([runProbe(doc, 1280, 800, true), runProbe(doc, 390, 844, false)]);
  if (!pc.alive && !cel.alive){ hard.push(M.name + ': la página no respondió (puede tener un ciclo infinito o un error que la congela).'); return { hard, soft, meta }; }
  const docLines = doc.split('\n'), seen = new Set();
  [...pc.exc, ...cel.exc].forEach(x => {
    const key = x.m + '|' + x.l + '|' + (x.a || ''); if (seen.has(key)) return; seen.add(key);
    const src = x.l ? (docLines[x.l - 1] || '').trim().slice(0, 140) : '';
    hard.push(M.name + ': ' + (x.a ? 'al tocar «' + x.a + '» sale el error ' : 'error al cargar: ') + x.m + (src ? ' — en la línea «' + src + '»' : ''));
  });
  [...new Set([...pc.con, ...cel.con].filter(c => c.k === 'error').map(c => c.m))].slice(0, 3).forEach(m => soft.push(M.name + ': la consola muestra un error: ' + m));
  [...new Map([...pc.net, ...cel.net].map(n => [n.u, n])).values()].slice(0, 3).forEach(n => soft.push(M.name + ': no cargó ' + n.tag.toLowerCase() + ' ' + (n.u || '(sin dirección)') + '.'));
  const a = pc.audit, c = cel.audit;
  if (a){
    meta.btns = a.btns || 0;
    if (!a.text && !a.media && (a.els || 0) < 4) hard.push(M.name + ': la página sale en blanco (no muestra nada).');
    if (a.over && a.over.length) soft.push(M.name + ': en computador algo se sale de la pantalla: ' + a.over.join(', ') + '.');
    if (a.broken && a.broken.length) soft.push(M.name + ': imágenes rotas: ' + a.broken.join(', ') + '. Mejor usa SVG o CSS.');
    if (a.low && a.low.length) soft.push(M.name + ': texto con poco contraste (difícil de leer): ' + a.low.join(', ') + '. Debe ser al menos 4.5:1.');
    if (a.noalt) soft.push(M.name + ': ' + a.noalt + ' imagen(es) sin texto alternativo (alt).');
    if (a.unnamed) soft.push(M.name + ': ' + a.unnamed + ' botón(es) o enlace(s) sin nombre (solo ícono, sin aria-label).');
    if (a.nolabel) soft.push(M.name + ': ' + a.nolabel + ' campo(s) sin etiqueta (label).');
    if (!a.vp) soft.push(M.name + ': falta <meta name="viewport"> (en el celular se verá diminuta).');
    if (!a.title) soft.push(M.name + ': falta el <title> de la página.');
    if (!a.lang) soft.push(M.name + ': falta lang en <html>.');
  }
  if (c){
    if (c.sw > c.w + 1) soft.push(M.name + ': en celular (390px) la página se sale de lado y hay que moverla con el dedo' + (c.over && c.over.length ? ' por: ' + c.over.join(', ') : '') + '.');
    if (c.tiny > 3) soft.push(M.name + ': en celular hay ' + c.tiny + ' textos demasiado pequeños (menos de 12px).');
  }
  return { hard, soft, meta };
}
/* revisa todos los archivos de una respuesta */
async function checkFiles(body){
  /* solo los archivos: los trocitos cortos de una explicación pueden estar incompletos a propósito */
  const cards = $$('.fcard:not(.deck) pre', body).map(cnvMeta);
  const hard = [], soft = [], pages = [];
  let btns = 0;
  for (const M of cards){
    const s = staticIssues(M); hard.push(...s.hard); soft.push(...s.soft);
    hard.push(...await jsSyntax(M));
  }
  const htmls = cards.filter(M => /^(html|htm)$/.test(M.ext)).slice(0, 2);
  for (const M of htmls){ const r = await pageIssues(M, cards); hard.push(...r.hard); soft.push(...r.soft); btns += r.meta.btns; pages.push(M.name); }
  return { hard:[...new Set(hard)], soft:[...new Set(soft)], pages, btns, files:cards.length };
}
const hasCode = body => !!$('.fcard:not(.deck)', body);
const isPage = body => $$('.fcard:not(.deck) pre', body).some(pre => /^(html|htm)$/.test(cnvMeta(pre).ext));

/* ---------- la barrita de revisión debajo de la respuesta ---------- */
const CK_ICO = {
  run:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9"/></svg>',
  ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
  fix:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/></svg>'
};
function ckBar(el){
  let b = $('.ckbar', el);
  if (!b){ b = document.createElement('div'); b.className = 'ckbar'; b.setAttribute('role', 'status'); b.setAttribute('aria-live', 'polite'); const meta = $('.meta', el) || $('.acts', el); if (meta) meta.before(b); else el.appendChild(b); }
  return b;
}
function ckIdle(el){
  if (!isPage($('.body', el)) || $('.ckbar', el)) return;
  const b = ckBar(el); b.className = 'ckbar idle';
  b.innerHTML = '<button type="button" class="ck-go">' + CK_ICO.ok + '<span>' + (isPage($('.body', el)) ? 'Comprobar la página en computador y celular' : 'Revisar el código') + '</span></button>';
  $('.ck-go', b).addEventListener('click', () => codeCheck(el, { auto:false }));
}
function ckPaint(el, r, o){
  const b = ckBar(el), n = r.hard.length + r.soft.length;
  const where = r.pages.length ? 'en computador y celular' : '';
  if (!n){
    b.className = 'ckbar ok';
    b.innerHTML = '<span class="ck-ic">' + CK_ICO.ok + '</span><span class="ck-t"><b>' + (r.pages.length ? 'Página comprobada' : 'Código revisado') + '</b><small>' + (r.pages.length ? 'Carga sin errores ' + where + (r.btns ? ' · probé ' + r.btns + (r.btns === 1 ? ' botón' : ' botones') : '') : 'Sin errores de sintaxis ni partes incompletas') + '</small></span>';
    return;
  }
  b.className = 'ckbar ' + (r.hard.length ? 'bad' : 'warn');
  b.innerHTML = '<button type="button" class="ck-row" aria-expanded="false"><span class="ck-ic">' + CK_ICO.warn + '</span><span class="ck-t"><b>' + (r.hard.length ? (r.hard.length === 1 ? '1 error' : r.hard.length + ' errores') + (r.soft.length ? ' y ' + r.soft.length + ' detalle' + (r.soft.length === 1 ? '' : 's') : '') : n + (n === 1 ? ' detalle por pulir' : ' detalles por pulir')) + '</b><small>' + (o.note || 'Toca para ver qué encontré') + '</small></span></button>'
    + '<button type="button" class="btn sm ck-fix">' + CK_ICO.fix + '<span>Arreglar con la IA</span></button>'
    + '<ul class="ck-l" hidden></ul>';
  const ul = $('.ck-l', b);
  [...r.hard.map(t => ['bad', t]), ...r.soft.map(t => ['warn', t])].forEach(([k, t]) => { const li = document.createElement('li'); li.className = k; li.textContent = t; ul.appendChild(li); });
  const row = $('.ck-row', b);
  row.addEventListener('click', () => { const on = ul.hidden; ul.hidden = !on; row.setAttribute('aria-expanded', String(on)); b.classList.toggle('open', on); });
  $('.ck-fix', b).addEventListener('click', () => fixWithAI(el, r, false));
}
let ckRun = 0;
async function codeCheck(el, o = {}){
  const body = $('.body', el); if (!body || !hasCode(body)) return null;
  const my = ++ckRun, b = ckBar(el), page = isPage(body);
  b.className = 'ckbar run'; b.innerHTML = '<span class="ck-ic spin">' + CK_ICO.run + '</span><span class="ck-t"><b>' + (page ? 'Probando la página…' : 'Revisando el código…') + '</b><small>' + (page ? 'La abro en un computador y en un celular, toco los botones y busco errores' : 'Busco errores de sintaxis y partes incompletas') + '</small></span>';
  let r; try{ r = await checkFiles(body); }catch(e){ b.remove(); return null; }
  if (!el.isConnected) return r;
  const can = o.auto && r.hard.length && !o.noAuto && my === ckRun;
  ckPaint(el, r, { note:can ? 'La IA los está arreglando sola…' : '' });
  if (can) fixWithAI(el, r, true);
  return r;
}
/* le pasa a la IA lo que encontró el probador, para que devuelva todo arreglado */
function fixPrompt(r){
  const L = [...r.hard.map(t => '- [ERROR] ' + t), ...r.soft.map(t => '- [MEJORA] ' + t)].join('\n');
  return FIX_TAG + ' ' + (r.pages.length ? 'Probé tu página en un navegador real (computador de 1280px y celular de 390px, tocando los botones)' : 'Revisé tu código') + ' y encontré esto:\n' + L
    + '\n\nArregla TODO lo de la lista, primero los errores. Devuelve cada archivo que cambie COMPLETO (sin «...» ni partes omitidas) y con el mismo nombre. No cambies lo que ya funciona ni el diseño que no tiene problemas. Al final, en «**Revisión**», di en una línea por punto qué arreglaste.';
}
function fixWithAI(el, r, auto){
  if (Object.keys(busy).length){ toast('Espera a que la IA termine de responder.'); return; }
  if (mode !== 'solo'){ toast('Arreglar funciona con una sola IA.'); return; }
  if (isLocked && isLocked()){ lockNudge(); return; }
  const chat = chatArr(), ci = +el.dataset.ci;
  if (!(ci === chat.length - 1)){ toast('Eso era de una respuesta anterior. Pídele a la IA el arreglo en un mensaje nuevo.'); return; }
  if (!budgetOk()) return;
  const msg = { role:'user', content:fixPrompt(r), fix:{ n:r.hard.length + r.soft.length, auto:!!auto } };
  chat.push(msg); touchThread(); save(); renderMsgs();
  const failed = err => {
    const i = chat.lastIndexOf(msg); if (i > -1) chat.splice(i, 1); save(); renderMsgs();
    if (!(err && err.aborted)) toast(auto ? 'No pude pedirle el arreglo a la IA ahora. Toca «Arreglar con la IA» para intentarlo otra vez.' : (err && err.message) || 'No pude pedir el arreglo. Intenta otra vez.');
  };
  /* v3.4 · con SuperiorSynth el proyecto no se detiene: si la IA falla, el arreglo lo sigue otra IA experta en código */
  if (agentOn()) runExpert('codigo').then(x => { if (!x.ok) failed(x.err); });
  else runSolo(failed);
}
/* tu mensaje de arreglo se ve como una notita, no como un muro de texto */
function fixNoteEl(m){
  const el = document.createElement('div'); el.className = 'fixnote';
  const n = (m.fix && m.fix.n) || (String(m.content || '').match(/^- \[/gm) || []).length;
  el.innerHTML = '<button type="button" class="fx-row" aria-expanded="false"><span class="fx-ic">' + CK_ICO.fix + '</span><span class="fx-t"></span></button><pre class="fx-d" hidden></pre>';
  $('.fx-t', el).textContent = (m.fix && m.fix.auto ? 'Revisión automática: ' : 'Le pediste a la IA que arregle ') + n + (n === 1 ? ' problema' : ' problemas') + (m.fix && m.fix.auto ? ' encontrados, la IA los arregla' : '');
  $('.fx-d', el).textContent = String(m.content || '').slice(String(m.content || '').startsWith(FIX_TAG) ? FIX_TAG.length : 0).trim();
  const row = $('.fx-row', el), d = $('.fx-d', el);
  row.addEventListener('click', () => { const on = d.hidden; d.hidden = !on; row.setAttribute('aria-expanded', String(on)); el.classList.toggle('open', on); });
  return el;
}
/* después de cada respuesta nueva con código: se prueba sola. Si la respuesta ya era un arreglo automático, no vuelve a arreglar sola (así no da vueltas) */
function codeAfter(el, chat){
  if (!el || !hasCode($('.body', el))) return;
  const ci = +el.dataset.ci, prevU = chat.slice(0, ci).reverse().find(m => m.role === 'user');
  const noAuto = isFix(prevU) || !!st().sx.saver;
  setTimeout(() => { if (el.isConnected) codeCheck(el, { auto:true, noAuto }); }, 350);
}

/* ---------- el lienzo con herramientas: consola, tamaños de pantalla y volver a cargar ---------- */
const CV_SIZES = [['pc', 'Computador', '100%'], ['tab', 'Tablet', '820px'], ['cel', 'Celular', '390px']];
function cvTools(o, box, M, sibs){
  const bar = document.createElement('div'); bar.className = 'cvt';
  bar.innerHTML = '<div class="cvt-sz" role="group" aria-label="Tamaño de pantalla">' + CV_SIZES.map(([k, l]) => '<button type="button" data-sz="' + k + '" aria-pressed="' + (k === 'pc') + '">' + l + '</button>').join('') + '</div>'
    + '<button type="button" class="cvt-b" data-cvt="reload" title="Volver a cargar" aria-label="Volver a cargar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg></button>'
    + '<button type="button" class="cvt-b cvt-con" data-cvt="con" aria-expanded="false"><span>Consola</span><b class="cvt-n">0</b></button>';
  const con = document.createElement('div'); con.className = 'cvt-log'; con.hidden = true; con.innerHTML = '<p class="cvt-empty">Aquí sale lo que la página escribe en la consola y sus errores.</p>';
  box.classList.add('tools'); box.prepend(bar); box.append(con);
  let id = '', errs = 0, lines = 0;
  const add = (k, t) => {
    const e = $('.cvt-empty', con); if (e) e.remove();
    const p = document.createElement('div'); p.className = 'cvt-ln ' + k; p.textContent = t; con.appendChild(p); con.scrollTop = con.scrollHeight;
    lines++; if (k === 'error') errs++;
    const n = $('.cvt-n', bar); n.textContent = errs ? errs + (errs === 1 ? ' error' : ' errores') : String(lines); bar.classList.toggle('has-err', errs > 0);
  };
  const on = e => {
    const d = e.data, f = $('iframe', box); if (!d || d.szp !== id || !f || e.source !== f.contentWindow) return;
    if (d.t === 'con') add(d.d.k, d.d.m);
    else if (d.t === 'exc') add('error', d.d.m + (d.d.l ? ' (línea ' + d.d.l + ')' : ''));
    else if (d.t === 'net') add('warn', 'No cargó: ' + d.d.u);
  };
  addEventListener('message', on);
  const obs = new MutationObserver(() => { if (!o.isConnected){ removeEventListener('message', on); obs.disconnect(); } }); obs.observe(document.body, { childList:true });
  const load = () => {
    const f = $('iframe', box); if (!f) return;
    id = 'v' + Math.random().toString(36).slice(2, 10); errs = 0; lines = 0;
    con.innerHTML = '<p class="cvt-empty">Aquí sale lo que la página escribe en la consola y sus errores.</p>'; $('.cvt-n', bar).textContent = '0'; bar.classList.remove('has-err');
    synLoad(f, probeDoc(previewDoc(M, sibs), id, false));
  };
  bar.addEventListener('click', e => {
    const s = e.target.closest('.cvt-sz [data-sz]');
    if (s){ $$('[data-sz]', bar).forEach(x => x.setAttribute('aria-pressed', String(x === s))); box.dataset.size = s.dataset.sz; const f = $('iframe', box); if (f) f.style.maxWidth = CV_SIZES.find(x => x[0] === s.dataset.sz)[2]; return; }
    const t = e.target.closest('[data-cvt]'); if (!t) return;
    if (t.dataset.cvt === 'reload') load();
    else { con.hidden = !con.hidden; t.setAttribute('aria-expanded', String(!con.hidden)); }
  });
  return { load };
}

/* ---------- colores en el código del lienzo (ligero, sin librerías) ---------- */
const HL_KW = 'abstract|and|as|async|await|break|case|catch|class|const|continue|def|default|del|do|elif|else|enum|except|export|extends|false|False|finally|fn|for|from|func|function|go|if|impl|import|in|interface|is|lambda|let|match|mut|new|nil|None|not|null|or|pass|private|protected|pub|public|raise|return|self|static|struct|super|switch|this|throw|true|True|try|type|typeof|undefined|use|var|void|while|with|yield';
const HL_RX = {
  c:new RegExp('(\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*)|(`(?:\\\\[\\s\\S]|[^`\\\\])*`|"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\')|\\b(' + HL_KW + ')\\b|\\b(\\d+(?:\\.\\d+)?)\\b|([A-Za-z_$][\\w$]*)(?=\\s*\\()', 'g'),
  py:new RegExp('(#[^\\n]*)|("""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|[rfb]?"(?:\\\\.|[^"\\\\\\n])*"|[rfb]?\'(?:\\\\.|[^\'\\\\\\n])*\')|\\b(' + HL_KW + ')\\b|\\b(\\d+(?:\\.\\d+)?)\\b|([A-Za-z_][\\w]*)(?=\\s*\\()', 'g'),
  css:/(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(@[\w-]+|!important)|(#[\da-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|rem|em|%|vh|vw|s|ms|deg|fr)?\b)|([\w-]+)(?=\s*:[^;{]*[;}])/g,
  html:/(<!--[\s\S]*?-->)|("[^"]*"|'[^']*')|(<\/?[\w-]+|\/?>)|(&\w+;)|(\s[\w:-]+)(?==)/g
};
function hlCode(text, ext){
  const k = /^(py)$/.test(ext) ? 'py' : /^(css|scss)$/.test(ext) ? 'css' : /^(html|htm|xml|svg|vue)$/.test(ext) ? 'html' : /^(js|mjs|jsx|ts|tsx|java|c|cpp|cs|go|rs|php|swift|kt|dart|json|lua|sh)$/.test(ext) ? 'c' : '';
  if (!k || text.length > 200000) return esc(text);
  const cls = ['', 'hc', 'hs', 'hk', 'hn', 'hf'];
  let out = '', last = 0;
  text.replace(HL_RX[k], (m, ...g) => { const at = g[g.length - 2]; const i = g.findIndex((x, j) => j < 5 && x !== undefined); out += esc(text.slice(last, at)) + (i > -1 ? '<span class="' + cls[i + 1] + '">' + esc(m) + '</span>' : esc(m)); last = at + m.length; return m; });
  return out + esc(text.slice(last));
}
/* ---------- v4.1 · Páginas web de varios archivos: se juntan y se ven funcionando (Sammuel, 3 nov) ----------
   Cuando la IA da una página en varios bloques (index.html, css/estilos.css, js/app.js, otra.html…):
   1) se agrupan como un proyecto con sus rutas (la tarjeta «Página web · N archivos»);
   2) cada HTML se arma con su CSS, su JS, sus SVG y sus JSON aunque vengan en bloques separados (rutas relativas resueltas);
   3) los enlaces entre páginas navegan DENTRO de la vista previa; los de afuera piden permiso para abrirse;
   4) todo se descarga en un .zip con sus carpetas.
   La vista previa sigue corriendo en /sintetico.html dentro de un iframe sandbox (sin allow-same-origin): no ve tu sesión ni tus chats.
   La ventana (pestañas, pantalla completa…) es React: next/componentes/synthflow/VistaWeb.jsx. Aquí solo va la lógica. */
const WEB_EXT = new Set(['html', 'htm', 'css', 'js', 'mjs', 'svg', 'json', 'md', 'txt', 'csv', 'xml']);
const webIsPage = p => /\.html?$/i.test(p);
/* «./css/../css/estilos.css» → «css/estilos.css» */
function webNorm(p){
  const out = [];
  String(p || '').replace(/\\/g, '/').split('/').forEach(s => { if (!s || s === '.') return; if (s === '..') out.pop(); else out.push(s); });
  return out.join('/');
}
const webDir = p => p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '';
/* ¿a qué archivo del proyecto apunta «ref» escrito dentro de «from»? null si es de internet, un #ancla, data:, mailto:… */
function webRef(from, ref){
  ref = String(ref || '').trim();
  if (!ref || /^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(ref)) return null;
  const hash = ref.includes('#') ? ref.slice(ref.indexOf('#')) : '';
  const clean = ref.replace(/[?#].*$/, '');
  if (!clean) return null;
  let path; try{ path = decodeURI(clean); }catch(e){ path = clean; }
  return { path:webNorm(clean.startsWith('/') ? path : webDir(from) + path), hash };
}
/* busca el archivo: ruta exacta, sin importar mayúsculas, o por su nombre si solo hay uno así (la IA a veces titula «estilos.css» y enlaza «css/estilos.css») */
function webFind(P, path){
  if (!path) return null;
  const F = P.files;
  return F.find(f => f.path === path) || F.find(f => f.path.toLowerCase() === path.toLowerCase())
    || (() => { const base = path.split('/').pop().toLowerCase(), m = F.filter(f => f.path.split('/').pop().toLowerCase() === base); return m.length === 1 ? m[0] : null; })();
}
/* junta los archivos de una respuesta; solo es «página web» si hay al menos un HTML y dos archivos web */
function webProject(metas){
  const map = new Map();
  (metas || []).forEach(M => {
    if (!M || !WEB_EXT.has(M.ext)) return;
    const path = webNorm(M.name) || M.name;
    map.set(path, { path, name:path.split('/').pop(), ext:M.ext, text:M.text, label:M.label, lines:M.lines, named:M.named });
  });
  const files = [...map.values()];
  const pages = files.filter(f => webIsPage(f.path));
  if (!pages.length || files.length < 2) return null;
  const entry = (pages.find(f => /^index\.html?$/i.test(f.path)) || pages.find(f => /(^|\/)index\.html?$/i.test(f.path)) || pages[0]).path;
  const t = (pages.find(f => f.path === entry).text.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  const title = t ? t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) : '';
  return { files, pages:pages.map(f => f.path), entry, title };
}
/* lo que usa cada página: para saber qué CSS o JS quedó sin enlazar (la IA lo dio pero olvidó el <link> o lo nombró distinto) */
function webUsed(P){
  const used = new Set();
  P.files.filter(f => webIsPage(f.path)).forEach(f => {
    f.text.replace(/<(?:link|script|img|source|use|a|iframe)\b[^>]*?\s(?:href|src)\s*=\s*["']([^"']+)["']/gi, (m, u) => { const r = webRef(f.path, u), x = r && webFind(P, r.path); if (x) used.add(x.path); return m; });
  });
  P.files.filter(f => f.ext === 'css').forEach(f => f.text.replace(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)/gi, (m, u) => { const r = webRef(f.path, u), x = r && webFind(P, r.path); if (x) used.add(x.path); return m; }));
  return used;
}
const webB64 = s => { try{ return btoa(unescape(encodeURIComponent(s))); }catch(e){ return ''; } };
const webData = f => 'data:' + (f.ext === 'svg' ? 'image/svg+xml' : f.ext === 'json' ? 'application/json' : f.ext === 'css' ? 'text/css' : /^m?js$/.test(f.ext) ? 'text/javascript' : 'text/plain') + ';charset=utf-8;base64,' + webB64(f.text);
/* url(…) dentro de un CSS: los SVG del proyecto van en línea */
function webCssUrls(P, from, css){
  return css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (m, q, u) => { const r = webRef(from, u), f = r && webFind(P, r.path); return f && f.ext === 'svg' ? 'url("' + webData(f) + '")' : m; });
}
function webCss(P, f, seen = new Set()){
  if (seen.has(f.path)) return ''; seen.add(f.path);
  let css = f.text.replace(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)["']?\s*\)?[^;]*;/gi, (m, u) => { const r = webRef(f.path, u), x = r && webFind(P, r.path); return x && x.ext === 'css' ? webCss(P, x, seen) : m; });
  return webCssUrls(P, f.path, css);
}
const webScriptText = t => String(t).replace(/<\/script/gi, '<\\/script');
/* un mismo renglón al principio: no mueve los números de línea de los errores. Avisa a SynthFlow de los clics en enlaces y formularios */
const WEB_NAV = (id, files, hash) => '<script>(function(){var I=' + JSON.stringify(id) + ',H=' + JSON.stringify(hash || '') + ',F=' + JSON.stringify(files).replace(/<\//g, '<\\/') + ';'
  + 'function S(t,d){try{parent.postMessage({szw:I,t:t,d:d},"*")}catch(e){}}'
  + 'function ext(h){return /^(https?:|mailto:|tel:)/i.test(h)}'
  + 'function local(h){return h&&!/^(#|javascript:|data:|blob:|about:)/i.test(h)&&!ext(h)&&!/^\\/\\//.test(h)}'
  + 'document.addEventListener("click",function(e){if(e.defaultPrevented||e.button)return;var a=e.target&&e.target.closest&&e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href")||"";if(a.hasAttribute("download"))return;'
  + 'if(ext(h)){e.preventDefault();S("ext",h);return}if(local(h)){e.preventDefault();S("nav",h)}},false);'
  + 'addEventListener("submit",function(e){if(e.defaultPrevented)return;var f=e.target,h=(f.getAttribute&&f.getAttribute("action"))||"";e.preventDefault();if(ext(h))S("ext",h);else if(local(h))S("nav",h);else S("form","")},false);'
  /* fetch("datos.json") y similares: los archivos del proyecto responden sin salir a internet */
  + 'var of=window.fetch;if(of)window.fetch=function(u,o){try{var s=typeof u==="string"?u:u&&u.url||"";if(!/^[a-z][\\w+.-]*:|^\\/\\//i.test(s)){var p=s.replace(/[?#].*$/,"").replace(/^\\.?\\//,"");for(var k in F){if(k===p||k.split("/").pop()===p.split("/").pop()){return Promise.resolve(new Response(F[k][1],{status:200,headers:{"content-type":F[k][0]}}))}}}}catch(e){}return of.apply(this,arguments)};'
  + 'if(H)addEventListener("load",function(){try{var e=document.getElementById(decodeURIComponent(H.slice(1)));if(e)e.scrollIntoView()}catch(x){}});'
  + '})();<\/script>';
/* arma una página del proyecto en un solo HTML que corre aislado */
function webDoc(P, path, o = {}){
  const f = webFind(P, path) || webFind(P, P.entry);
  let h = f.text;
  if (!/<html[\s>]|<body[\s>]|<!doctype/i.test(h)) h = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + h + '</body></html>';
  const from = f.path, used = new Set();
  /* <link rel="stylesheet" href="css/estilos.css"> → <style> con el CSS */
  h = h.replace(/<link\b[^>]*>/gi, tag => {
    const href = (tag.match(/\shref\s*=\s*["']([^"']+)["']/i) || [])[1]; const r = href && webRef(from, href), x = r && webFind(P, r.path);
    if (!x) return tag;
    if (x.ext === 'css' && (/rel\s*=\s*["']?[^"'>]*stylesheet/i.test(tag) || !/\srel\s*=/i.test(tag))){ used.add(x.path); return '<style data-sz-file="' + esc(x.path) + '">' + webCss(P, x) + '</style>'; }
    if (x.ext === 'svg') return tag.replace(/\shref\s*=\s*["'][^"']+["']/i, ' href="' + webData(x) + '"');
    return tag;
  });
  /* <script src="js/app.js"></script> → el código en línea (con sus otros atributos: type="module", defer…) */
  h = h.replace(/<script\b([^>]*?)\ssrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (m, a, src, b) => {
    const r = webRef(from, src), x = r && webFind(P, r.path); if (!x || !/^m?js$/.test(x.ext)) return m;
    used.add(x.path); const attrs = (a + b).replace(/\s(?:defer|async)\b(?:\s*=\s*["'][^"']*["'])?/gi, '');
    return '<script' + attrs + ' data-sz-file="' + esc(x.path) + '">' + webScriptText(x.text) + '</script>';
  });
  /* imágenes y fondos SVG del proyecto */
  h = h.replace(/(<(?:img|source|use|image)\b[^>]*?\s(?:src|href|xlink:href)\s*=\s*["'])([^"']+)(["'])/gi, (m, a, u, z) => { const r = webRef(from, u), x = r && webFind(P, r.path); return x && x.ext === 'svg' ? a + webData(x) + (r.hash || '') + z : m; });
  h = h.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, a, css, z) => /data-sz-file/.test(a) ? m : a + webCssUrls(P, from, css) + z);
  h = h.replace(/(\sstyle\s*=\s*")([^"]*url\([^"]*)(")/gi, (m, a, css, z) => a + webCssUrls(P, from, css).replace(/"/g, '&quot;') + z);
  /* lo que la IA dio pero no enlazó: igual se usa (CSS arriba, JS al final), si ninguna página lo enlaza */
  const all = webUsed(P);
  const orphanCss = P.files.filter(x => x.ext === 'css' && !all.has(x.path) && !used.has(x.path));
  const orphanJs = P.files.filter(x => /^m?js$/.test(x.ext) && !all.has(x.path) && !used.has(x.path) && !/^\s*(import|export)\s/m.test(x.text) && !/require\(|module\.exports|process\.env/.test(x.text));
  if (orphanCss.length){ const st = orphanCss.map(x => '<style data-sz-file="' + esc(x.path) + '">' + webCss(P, x) + '</style>').join(''); h = /<\/head>/i.test(h) ? h.replace(/<\/head>/i, m => st + m) : st + h; }
  if (orphanJs.length){ const sc = orphanJs.map(x => '<script data-sz-file="' + esc(x.path) + '">' + webScriptText(x.text) + '</script>').join(''); h = /<\/body>(?![\s\S]*<\/body>)/i.test(h) ? h.replace(/<\/body>(?![\s\S]*<\/body>)/i, m => sc + m) : h + sc; }
  /* el ayudante de navegación va primero que todo, en un solo renglón */
  if (o.nav !== false){
    const fx = {}; P.files.filter(x => !webIsPage(x.path) && !/^(css|m?js)$/.test(x.ext)).forEach(x => { if (x.text.length < 400000) fx[x.path] = [MIME[x.ext] || 'text/plain', x.text]; });
    const n = WEB_NAV(o.navId || '', fx, o.hash);
    if (/<head[^>]*>/i.test(h)) h = h.replace(/<head[^>]*>/i, m => m + n); else if (/<html[^>]*>/i.test(h)) h = h.replace(/<html[^>]*>/i, m => m + n); else h = n + h;
  }
  return o.probeId ? probeDoc(h, o.probeId, false) : h;
}
/* a qué página va un enlace tocado dentro de la vista previa */
function webGo(P, from, href){
  const r = webRef(from, href); if (!r) return null;
  let path = r.path;
  if (!path || /\/$/.test(href.replace(/[?#].*$/, ''))) path = webNorm(path + '/index.html');
  let x = webFind(P, path);
  if (!x && !/\.[a-z0-9]{1,5}$/i.test(path)) x = webFind(P, path + '.html') || webFind(P, webNorm(path + '/index.html'));
  return x ? { path:x.path, hash:r.hash, page:webIsPage(x.path) } : { path, hash:r.hash, missing:true };
}

/* ---------- el .zip (sin librerías: formato «stored», con carpetas y nombres UTF-8) ---------- */
const WEB_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function webCrc(u8){ let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = WEB_CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function webZipBytes(entries){
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  entries.forEach(([name, text]) => {
    const nm = enc.encode(name), data = enc.encode(text), crc = webCrc(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), nm, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), nm);
    off += 30 + nm.length + data.length;
  });
  const size = central.reduce((s, x) => s + x.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, entries.length, true); e.setUint16(10, entries.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
  return [...parts, ...central, new Uint8Array(e.buffer)];
}
const webSlug = P => (P.title || P.entry.replace(/\.html?$/i, '') || 'pagina-web').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'pagina-web';
function webZip(P){
  const en = SZ.lang() === 'en';
  try{
    const blob = new Blob(webZipBytes(P.files.map(f => [f.path, f.text])), { type:'application/zip' }), u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = webSlug(P) + '.zip'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
    toast(en ? 'Downloaded ' + a.download + ' (' + P.files.length + ' files).' : 'Descargué ' + a.download + ' (' + P.files.length + ' archivos).');
  }catch(e){ toast(en ? 'I couldn’t make the .zip. Download the files one by one.' : 'No pude armar el .zip. Descarga los archivos uno por uno.'); }
}

/* ---------- la tarjeta «Página web» en el mensaje ---------- */
const WEB_ICO = {
  web:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18"/><circle cx="6.5" cy="6.5" r=".6" fill="currentColor"/><circle cx="9" cy="6.5" r=".6" fill="currentColor"/><path d="M9.5 13l-2 2 2 2M14.5 13l2 2-2 2"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.8v12.4a.8.8 0 0 0 1.2.7l9.8-6.2a.8.8 0 0 0 0-1.4L9.2 5.1a.8.8 0 0 0-1.2.7z"/></svg>',
  zip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 20h14"/></svg>'
};
const webTxt = en => en
  ? { kind:'Website', files:n => n + (n === 1 ? ' file' : ' files'), pages:n => n + (n === 1 ? ' page' : ' pages'), run:'See it working', zip:'Download .zip', open:'Open the website' }
  : { kind:'Página web', files:n => n + (n === 1 ? ' archivo' : ' archivos'), pages:n => n + (n === 1 ? ' página' : ' páginas'), run:'Ver funcionando', zip:'Descargar .zip', open:'Abrir la página web' };
function webCardPaint(c, P){
  const T = webTxt(SZ.lang() === 'en');
  c.dataset.lang = SZ.lang();
  $('.wp-h', c).innerHTML = '<button type="button" class="wp-main" data-wp="prev" title="' + esc(T.open) + '"><span class="wp-ic">' + WEB_ICO.web + '</span><span class="wp-t"><small>' + esc(T.kind) + '</small><b>' + esc(P.title || P.entry) + '</b><span>' + esc(T.files(P.files.length)) + (P.pages.length > 1 ? ' · ' + esc(T.pages(P.pages.length)) : '') + ' · ' + P.files.slice(0, 4).map(f => esc(f.path)).join(', ') + (P.files.length > 4 ? '…' : '') + '</span></span></button>'
    + '<div class="wp-acts"><button type="button" class="wp-b go" data-wp="prev">' + WEB_ICO.play + '<span>' + esc(T.run) + '</span></button><button type="button" class="wp-b" data-wp="zip" title="' + esc(T.zip) + '">' + WEB_ICO.zip + '<span>' + esc(T.zip) + '</span></button></div>';
}
/* mete las tarjetas de los archivos dentro de una sola tarjeta de proyecto */
function webGroup(body){
  if (!body) return null;
  const cards = $$('.fcard:not(.deck)', body).filter(c => !c.closest('.wproj'));
  const old = $('.wproj', body);
  const metas = [...(old ? $$('.fcard pre', old) : []), ...cards.map(c => $('pre', c))].map(cnvMeta);
  const P = webProject(metas); if (!P) return null;
  const web = cards.filter(c => WEB_EXT.has(cnvMeta($('pre', c)).ext));
  let box = old;
  if (!box){
    box = document.createElement('div'); box.className = 'wproj notr';
    box.innerHTML = '<div class="wp-h"></div><div class="wp-files"></div>';
    web[0].before(box);
  }
  /* los títulos sueltos «📄 index.html» antes de cada tarjeta ya no hacen falta: la tarjeta trae el nombre */
  web.forEach(c => { const h = c.previousElementSibling; if (h && h.classList.contains('fname-h')) h.remove(); else { const t = c.previousElementSibling; if (t && /^(P|H[1-6])$/.test(t.tagName) && t.textContent.length < 90 && /[\w-]+\.[a-z0-9]{1,5}/i.test(t.textContent) && P.files.some(f => t.textContent.includes(f.name))) t.remove(); } $('.wp-files', box).appendChild(c); });
  { const t = box.previousElementSibling; if (t && /^(P|H[1-6])$/.test(t.tagName) && t.textContent.length < 90 && P.files.some(f => t.textContent.includes(f.name))) t.remove(); }
  box._web = P; webCardPaint(box, P);
  return P;
}
const webOf = el => { const b = el && (el.classList && el.classList.contains('wproj') ? el : el.closest && el.closest('.wproj')); return b ? b._web || null : null; };
/* abre la ventana React; si no está (chat.html viejo), el lienzo de siempre con la página principal */
function webOpen(P, o = {}){
  if (!P) return;
  if (window.SZWeb && window.SZWeb.open){ closeCanvas(true); window.SZWeb.open(P, o); return; }
  const M = { label:'HTML', name:o.path || P.entry, named:true, ext:'html', text:(webFind(P, o.path || P.entry) || {}).text || '', lines:0 };
  openCanvas(M, P.files.map(f => ({ label:f.label, name:f.path, named:true, ext:f.ext, text:f.text, lines:f.lines })), o.tab === 'code' ? 'code' : 'prev');
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.wproj [data-wp]'); if (!b) return;
  const P = webOf(b); if (!P) return;
  if (b.dataset.wp === 'zip') webZip(P); else webOpen(P, { tab:'prev' });
}, true);
/* al cambiar el idioma, las tarjetas se vuelven a escribir */
try{ SZ.onLang(() => $$('.wproj').forEach(c => { if (c._web) webCardPaint(c, c._web); })); }catch(e){}
/* el código con colores para React, en trocitos [clase, texto] (React lo escribe como texto: nada de HTML crudo) */
function webTokens(text, ext){
  const k = /^(py)$/.test(ext) ? 'py' : /^(css|scss)$/.test(ext) ? 'css' : /^(html|htm|xml|svg|vue)$/.test(ext) ? 'html' : /^(js|mjs|jsx|ts|tsx|json)$/.test(ext) ? 'c' : '';
  if (!k || text.length > 200000) return [['', text]];
  const cls = ['', 'hc', 'hs', 'hk', 'hn', 'hf'], out = [], rx = new RegExp(HL_RX[k].source, HL_RX[k].flags);
  let last = 0;
  text.replace(rx, (m, ...g) => { const at = g[g.length - 2]; const i = g.findIndex((x, j) => j < 5 && x !== undefined); if (at > last) out.push(['', text.slice(last, at)]); out.push([i > -1 ? cls[i + 1] : '', m]); last = at + m.length; return m; });
  if (last < text.length) out.push(['', text.slice(last)]);
  return out;
}
/* ---------- temas: «¿qué quieres hacer?» con IA recomendadas para cada uno ---------- */
const TOPICS = [
  ['escribir', '✍️', 'Escribir', { write:30, lang:10 }, [['Mejora un texto mío', 'Mejora este texto: hazlo más claro y natural, sin cambiar lo que quiero decir:\n\n'], ['Escribe un mensaje difícil', 'Ayúdame a escribir un mensaje amable pero firme para: ']]],
  ['marketing', '📣', 'Marketing', { write:30, lang:8, fast:4 }, [['3 ideas de post para vender', 'Dame 3 ideas de publicaciones para vender mi producto en Instagram. Mi producto es: '], ['Un eslogan para mi marca', 'Propón 10 eslóganes cortos y memorables para mi marca, que se dedica a: ']]],
  ['codigo', '💻', 'Código', { code:40, reason:8 }, [['Explícame este código', 'Explícame paso a paso qué hace este código y cómo podría mejorarlo:\n\n'], ['Arregla un error', 'Tengo este error. Dime por qué pasa y cómo arreglarlo:\n\n']]],
  ['estudiar', '📚', 'Estudiar', { reason:18, lang:10, long:6, write:6 }, [['Explícame un tema difícil', 'Explícame este tema como a un principiante, con un ejemplo y 3 preguntas para repasar. El tema es: '], ['Resume este documento', 'Resume este documento en 5 puntos clave y dime qué es lo más importante.', 'file']]],
  ['planos', '📐', 'Planos y arquitectura', { reason:22, math:16, vision:8 }, [['Distribuye un espacio', 'Ayúdame a distribuir un espacio. Mide ___ por ___ metros y necesito que tenga: '], ['Calcula materiales', 'Calcula cuánto material necesito (con un 10 % de margen) para: ']]],
  ['negocios', '📈', 'Negocios', { reason:22, write:16, long:4 }, [['Un plan para mi idea', 'Hazme un plan de negocio sencillo en pasos para esta idea: '], ['Ponle precio a lo que vendo', 'Ayúdame a calcular un precio justo y rentable. Vendo ___, me cuesta ___ hacerlo y mi competencia cobra ___.']]],
  ['ideas', '💡', 'Ideas', { write:20, fast:12, reason:6 }, [['Lluvia de ideas', 'Dame 15 ideas originales (de las más normales a las más locas) para: '], ['Aterriza mi idea', 'Hazme preguntas para aterrizar esta idea y luego propón un plan en pasos. Mi idea es: ']]],
  ['imagenes', '🖼️', 'Imágenes y PDF', { vision:45, long:10 }, [['Describe una imagen', 'Describe esta imagen con detalle y dime qué te llama la atención.', 'file'], ['Saca los datos de un PDF', 'Saca de este PDF los datos importantes en una tabla.', 'file']]],
  ['redes', '📱', 'Redes sociales', { write:25, fast:10, lang:6 }, [['Guion para un reel', 'Escribe un guion de 30 segundos para un reel sobre: '], ['Calendario de publicaciones', 'Hazme un calendario de publicaciones de 2 semanas para una cuenta de: ']]],
  ['ventas', '💼', 'Ventas', { write:25, reason:6 }, [['Responde a un cliente', 'Ayúdame a responder a este cliente de forma amable para cerrar la venta:\n\n'], ['Descripción de producto', 'Escribe una descripción de producto que convenza, para: ']]],
  ['correo', '✉️', 'Correos y trabajo', { write:28, fast:8 }, [['Escribe un correo formal', 'Escribe un correo formal y corto para: '], ['Resume una reunión', 'Convierte estas notas de reunión en un resumen con tareas y responsables:\n\n']]],
  ['empleo', '🧾', 'Hoja de vida y empleo', { write:28, lang:6 }, [['Mejora mi hoja de vida', 'Mejora mi hoja de vida para el cargo de ___. Aquí está:\n\n'], ['Prepárame una entrevista', 'Hazme 8 preguntas de entrevista para el cargo de ___ y dime qué responder.']]],
  ['web', '🌐', 'Páginas web', { code:36, vision:4 }, [['Crea una página sencilla', 'Crea una página web sencilla en un solo archivo HTML para: '], ['Revisa mi página', 'Revisa este código de mi página y dime qué mejorar en diseño y velocidad:\n\n']]],
  ['datos', '📊', 'Datos y Excel', { code:20, math:16, reason:10 }, [['Una fórmula de Excel', 'Dame la fórmula de Excel para: '], ['Analiza estos datos', 'Analiza estos datos y dime qué conclusiones sacas:\n\n']]],
  ['idiomas', '🌍', 'Idiomas', { lang:35, write:10 }, [['Traduce con naturalidad', 'Traduce esto al inglés de forma natural, no literal:\n\n'], ['Practica conmigo', 'Practica inglés conmigo: hazme preguntas sencillas y corrige mis errores con amabilidad.']]],
  ['mate', '➗', 'Matemáticas', { math:40, reason:20 }, [['Resuelve paso a paso', 'Resuelve este ejercicio paso a paso y explica cada paso: '], ['Explícame una fórmula', 'Explícame para qué sirve y cómo se usa esta fórmula, con un ejemplo: ']]],
  ['ciencia', '🔬', 'Ciencia', { reason:28, math:10, long:4 }, [['¿Por qué pasa esto?', 'Explícame de forma sencilla por qué pasa esto: '], ['Ayúdame con un experimento', 'Ayúdame a diseñar un experimento sencillo para comprobar: ']]],
  ['diseno', '🎨', 'Diseño', { vision:22, write:12 }, [['Paleta de colores', 'Propón 3 paletas de colores (con códigos HEX) para una marca de: '], ['Opina sobre mi diseño', 'Dame tu opinión honesta sobre este diseño y cómo mejorarlo.', 'file']]],
  ['finanzas', '💰', 'Finanzas personales', { math:20, reason:18 }, [['Organiza mi presupuesto', 'Ayúdame a organizar un presupuesto mensual. Gano ___ y mis gastos fijos son: '], ['Plan de ahorro', 'Hazme un plan para ahorrar ___ en ___ meses.']]],
  ['legal', '⚖️', 'Legal (orientación)', { reason:24, long:12, write:8 }, [['Explícame un contrato', 'Explícame en palabras sencillas qué dice este contrato y qué debería revisar con un abogado:\n\n'], ['Redacta una carta', 'Ayúdame a redactar una carta formal de reclamo por: ']]],
  ['salud', '🩺', 'Salud y bienestar', { reason:20, write:10 }, [['Rutina de ejercicio suave', 'Propón una rutina de ejercicio suave de 20 minutos para alguien que empieza.'], ['Hábitos para dormir mejor', 'Dame hábitos sencillos para dormir mejor.']]],
  ['cocina', '🍳', 'Recetas', { write:18, fast:12 }, [['¿Qué cocino con esto?', 'Tengo estos ingredientes: ___. ¿Qué puedo cocinar? Dame 3 opciones fáciles.'], ['Menú de la semana', 'Hazme un menú de almuerzos para la semana, económico y sano.']]],
  ['viajes', '✈️', 'Viajes', { write:16, fast:10, lang:8 }, [['Plan de viaje', 'Hazme un plan de viaje de ___ días a ___ con un presupuesto de ___.'], ['Qué empacar', 'Hazme una lista de qué empacar para un viaje de ___ días a ___.']]],
  ['musica', '🎵', 'Música y letras', { write:28 }, [['Ayúdame con una canción', 'Ayúdame a escribir la letra de una canción sobre: '], ['Ideas de acordes', 'Sugiere una progresión de acordes con un ambiente ___ para una canción.']]],
  ['historias', '📖', 'Historias y guiones', { write:36, long:6 }, [['Empieza una historia', 'Escribe el inicio de una historia corta sobre: '], ['Mejora mi guion', 'Mejora los diálogos de este guion:\n\n']]],
  ['juegos', '🎮', 'Videojuegos', { write:14, code:14, fast:8 }, [['Idea para un juego', 'Propón una idea de videojuego sencillo con sus reglas sobre: '], ['Estrategia', 'Dame una estrategia para mejorar en: ']]],
  ['productividad', '⏱️', 'Productividad', { fast:20, write:12 }, [['Organiza mi día', 'Organiza mi día en bloques de tiempo. Tengo que hacer: '], ['Divide una tarea grande', 'Divide esta tarea grande en pasos pequeños: ']]],
  ['complejo', '🧠', 'Tareas complejas', { reason:40, code:6, math:6, long:8 }, [['Piénsalo a fondo', 'Piensa a fondo y paso a paso antes de responder: '], ['Compara opciones', 'Compara estas opciones con ventajas, desventajas y una recomendación final:\n\n']]]
];
const TOPIC = Object.fromEntries(TOPICS.map(([k, e, l, w, ex]) => [k, { k, e, l, w, ex }]));
const TOPICS_SHOWN = 8;
let curTopic = null, topicsAll = false;
const recC = new Map();
function recommendTop(k, n){
  const T = TOPIC[k]; if (!T) return [];
  const ck = k + '|' + n + '|' + cat.list.length + '|' + (puterOn() ? 1 : 0) + (orOn() ? 1 : 0) + '|' + (st().survey ? st().survey.t : 0);
  if (recC.has(ck)) return recC.get(ck);
  const r = recommendTop0(T, n); if (recC.size > 80) recC.clear(); recC.set(ck, r); return r;
}
function recommendTop0(T, n){
  const usable = cat.list.filter(m => !m.stub && (m.free || /^pu:/.test(m.id)));
  const pool = usable.filter(m => connected(m.id)).length ? usable.filter(m => connected(m.id)) : usable.filter(m => /^pu:/.test(m.id));
  const sc = m => { const ex = expert(m).tags; let s = 0; Object.keys(T.w).forEach(t => { if (ex.includes(t)) s += T.w[t]; }); if (m.reasoning && T.w.reason) s += 4; if (T.w.long && m.ctx >= 120000) s += 6; if (T.w.vision && !m.vision) s -= 30; s += Math.min(6, SZ.surveyScore(m, st().survey) / 10); return s + mScore(m) / 40; };
  const out = [], seen = new Set();
  pool.map(m => [m, sc(m)]).sort((a, b) => b[1] - a[1]).forEach(([m]) => { const fam = m.name.split(/[\s:.-]/)[0].toLowerCase(); if (out.length < n && !seen.has(fam)){ seen.add(fam); out.push(m); } });
  return out;
}
/* 3 ejemplos que solo se escriben en la caja (cambian en cada chat nuevo) */
const EXK = ['marketing', 'estudiar', 'codigo', 'escribir', 'negocios', 'ideas', 'planos', 'redes', 'correo', 'idiomas', 'cocina', 'viajes'];
let exSeed = Math.floor(Math.random() * EXK.length);
function examplesHtml(){
  const ks = [0, 1, 2].map(i => EXK[(exSeed + i * 4) % EXK.length]);
  return '<div class="hexs">' + ks.map((k, i) => { const T = TOPIC[k], x = T.ex[0]; return '<button type="button" class="hex" data-hex="' + k + '" style="--i:' + i + '"><small>' + esc(T.l) + '</small><span>' + esc(x[0]) + '</span></button>'; }).join('') + '</div>';
}
/* v1.3: los ejemplos van debajo del saludo, cambian solos y desaparecen cuando ya usaste el chat más de 5 veces */
const sentN = () => { let n = 0; try{ n = +localStorage.getItem('synthz:sent') || 0; }catch(e){} if (!n){ try{ n = Object.values(st().chats || {}).filter(a => Array.isArray(a) && a.some(m => m.role === 'user')).length; }catch(e){} } return n; };
const showEx = () => sentN() <= 5;
function exRowHtml(){
  const ks = [0, 1, 2].map(i => EXK[(exSeed + i * 4) % EXK.length]);
  return ks.map((k, i) => { const T = TOPIC[k], x = T.ex[0]; return '<button type="button" class="hex hxs" data-hex="' + k + '" style="--i:' + i + '"><small>' + esc(T.l) + '</small><span>' + esc(x[0]) + '</span></button>'; }).join('');
}
setInterval(() => {
  const r = document.getElementById('hexR'); if (!r || !r.classList.contains('hexr') || document.hidden || root.classList.contains('idle-sleep') || r.matches(':hover') || r.contains(document.activeElement)) return;
  exSeed = (exSeed + 1) % EXK.length;
  if (SZ.reduce){ r.innerHTML = exRowHtml(); return; }
  r.animate([{ opacity:1, transform:'none', filter:'blur(0)' }, { opacity:0, transform:'translateY(-6px)', filter:'blur(4px)' }], { duration:320, easing:'ease-in' }).onfinish = () => { r.innerHTML = exRowHtml(); r.animate([{ opacity:0, transform:'translateY(6px)', filter:'blur(4px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:420, easing:'cubic-bezier(.22,1,.36,1)' }); };
}, 7000);
function topicsHtml(){
  return '';   /* v2.3: se quitó la zona de temas (ya estaba en los filtros) */
  const L = topicsAll ? TOPICS : TOPICS.slice(0, TOPICS_SHOWN);
  return '<div class="topics" role="group" aria-label="¿Qué quieres hacer?">' + L.map(([k, e, l], i) => '<button type="button" class="tchip" data-topic="' + k + '" aria-pressed="' + (curTopic === k) + '" style="--i:' + i + '">' + esc(l) + '</button>').join('')
    + (topicsAll ? '<button type="button" class="tchip more" data-topics-less>Menos temas</button>' : '<button type="button" class="tchip more" data-topics-more>Más temas →</button>') + '</div>';
}
function rcardHtml(m, i){
  const p = payOf(m.id), F = factsOf(m).filter(f => f[0] === 'ctx' || f[0] === 'lang').map(f => f[1]).join(' · ');
  return '<div class="rcard" data-id="' + esc(m.id) + '" style="--vc:' + vendorColor(m.vendor) + ';--i:' + i + '"><div class="rh">' + av(m) + '<div><b>' + esc(m.name) + '</b><small>' + esc(m.vlabel) + '</small></div></div>'
    + '<p>' + esc(expert(m).line + (F ? ' · ' + F : '')) + '</p><span class="rpay ' + esc(p[0].split(' ')[0]) + '">' + esc(p[2]) + '</span>'
    + '<div class="ra"><button class="btn sm" type="button" data-use>' + (connected(m.id) ? 'Usar esta' : 'Conectar y usar') + '</button><label class="ckb"><input type="checkbox" data-rc>Comparar</label></div></div>';
}
function topicPanelHtml(k){
  const T = TOPIC[k]; if (!T) return '';
  const r = recommendTop(k, 3);
  return '<div class="tphead"><h5>Para <em>' + esc(T.l) + '</em> te recomiendo</h5><small>Elegidas por lo que mejor saben hacer · marca 2 o más para compararlas</small></div>'
    + (r.length ? '<div class="rcards">' + r.map(rcardHtml).join('') + '</div>' : '<p class="cnote" style="text-align:center">' + (cat.list.length ? 'Las IAs están descansando un momento. Vuelve a intentarlo en un ratito.' : 'Cargando la lista de IA…') + '</p>')
    + '<div class="cmpgo" id="cmpGo" hidden></div>'
    + '<div class="texs">' + T.ex.map((x, i) => '<button type="button" data-tex="' + i + '" style="--i:' + i + '">' + esc(x[0]) + '</button>').join('') + '</div>';
}
function paintTopic(){
  const box = $('#tPanel'); if (!box) return;
  const h0 = box.offsetHeight;
  box.innerHTML = curTopic ? topicPanelHtml(curTopic) : '';
  if (!SZ.reduce){ const h1 = box.offsetHeight; box.animate([{ height:h0 + 'px', opacity:.4 }, { height:h1 + 'px', opacity:1 }], { duration:480, easing:'cubic-bezier(.22,1,.36,1)' }); }
  $$('.tchip[data-topic]', lane).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.topic === curTopic)));
}
function paintCmpGo(){
  const go = $('#cmpGo'); if (!go) return;
  const ids = $$('.rcard', lane).filter(c => $('[data-rc]', c).checked).map(c => c.dataset.id);
  $$('.rcard', lane).forEach(c => c.classList.toggle('on', $('[data-rc]', c).checked));
  if (ids.length < 2){ go.hidden = true; return; }
  go.hidden = false;
  go.innerHTML = '<span>Marcaste ' + ids.map(id => '<b>' + esc(info(id).name) + '</b>').join(' y ') + '</span><button type="button" class="btn sm flow" data-cmpgo>Comparar estas ' + ids.length + ' →</button>';
}
const LUMA_STARTERS = [
  {
    icon: '<path d="M12 3v3m0 12v3M3 12h3m12 0h3"/><circle cx="12" cy="12" r="4"/>',
    es: ['Dar forma a una idea', 'Del concepto al primer paso', 'Ayúdame a convertir una idea en un proyecto con pasos claros.'],
    en: ['Shape an idea', 'From concept to first step', 'Help me turn an idea into a project with clear steps.'],
  },
  {
    icon: '<path d="M4 6a2 2 0 0 1 2-2h14v16H6a2 2 0 0 1-2-2V6Zm0 12a2 2 0 0 1 2-2h14M8 8h8m-8 4h6"/>',
    es: ['Entender algo nuevo', 'Una explicación con ejemplos', 'Explícame un tema complejo de forma sencilla y con ejemplos.'],
    en: ['Learn something new', 'A clear explanation with examples', 'Explain a complex topic simply, with examples.'],
  },
  {
    icon: '<path d="m4 16 11-11a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Zm9-9 3 3"/>',
    es: ['Crear algo desde cero', 'Un primer borrador para editar', 'Ayúdame a escribir una primera versión de una propuesta creativa.'],
    en: ['Create from scratch', 'A first draft you can edit', 'Help me write a first draft of a creative proposal.'],
  },
];

function lumaWelcomeHtml(lang){
  const en = lang === 'en';
  const cards = LUMA_STARTERS.map(({ icon, [lang]: [title, detail] }, i) =>
    '<button type="button" class="luma-starter" data-luma-starter="' + i + '">' +
    '<svg aria-hidden="true" viewBox="0 0 24 24">' + icon + '</svg>' +
    '<span><b>' + title + '</b><small>' + detail + '</small></span></button>'
  ).join('');
  return '<svg class="luma-mark" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2.8 14.3 9.7 21.2 12 14.3 14.3 12 21.2 9.7 14.3 2.8 12 9.7 9.7Z"/></svg>' +
    '<h1>' + (en ? 'Good ideas start with a good question.' : 'Las buenas ideas empiezan con una buena pregunta.') + '</h1>' +
    '<p>' + (en ? 'Explore an idea, learn something new, or start a first draft.' : 'Explora una idea, aprende algo nuevo o empieza un primer borrador.') + '</p>' +
    '<div class="luma-starters" id="hexR" role="group" aria-label="' + (en ? 'Ideas to get started' : 'Ideas para empezar') + '">' + cards + '</div>';
}

function emptyEl(){
  const e = document.createElement('div'); e.className = 'hello';
  if (mode === 'cmp'){
    e.innerHTML = '<h1 class="greet">' + greetHtml(['Una pregunta, ', 'varias IA', '.']) + '</h1><p class="hsub">Escribe abajo: todas responden a la vez y aparecen en el orden en que van llegando.</p>'
      + (st().cmp.length < 2 ? '<button type="button" class="btn sm flow" data-add-cmp>+ Agregar otra IA</button>' : '');
    return e;
  }
  if (agentOn()){
    const ex = showEx();
    e.classList.add('aghello');
    e.innerHTML = '<p class="agbadge">' + AG_ICO + 'Modo Apex activado</p>' + hiName() + '<h1 class="greet">' + greetHtml(['¿Qué quieres ', 'FlowIA’r', '?']) + '</h1>' + flowWhatHtml()
      + (ex ? '<div class="hexs hexr" id="hexR" aria-label="Ideas para empezar">' + exRowHtml() + '</div>' : '')
      + '<p class="hsub2">Cuéntame qué necesitas. Apex entiende tu pedido, lo mejora, elige la IA que más sabe de eso y te muestra cada paso.</p><div class="hcomp"></div>';
    return e;
  }
  e.classList.add('luma-welcome');
  e.innerHTML = lumaWelcomeHtml(SZ.lang() === 'en' ? 'en' : 'es') + '<div class="hcomp"></div>' + flowWhatHtml();
  return e;
}
/* inicio limpio (como «A · Inicio»): la caja de escribir sube al centro y la IA se elige dentro de ella */
const composer = $('#composer');
function parkComposer(){ if (composer.parentElement !== $('.main')) $('.main').insertBefore(composer, $('#tabbar')); }
let wasFresh = null;
function setFresh(on){
  document.body.classList.toggle('fresh', on); composer.classList.toggle('big', on && !isMobile());
  renderCPick();
  if (on !== wasFresh){ wasFresh = on; renderTop(); }
}
function renderCPick(){
  const b = $('#cPick'); if (!b) return;
  const m = info(selId());
  b.style.setProperty('--vc', vendorColor(m.vendor));
  b.innerHTML = av(m) + '<b>' + esc(m.name) + '</b>' + (!st().pinned && m.id !== TRIAL_ID ? '<i class="sug">sugerida</i>' : '') + CARET;
  $('#cCmp').hidden = true;   /* v3.7 · Comparar salió de la caja de escribir: ahora está en la barra («Comparar IAs») */
}
function renderMsgs(){
  parkComposer();
  lane.innerHTML = '';
  if (mode === 'cmp'){ setFresh(false); if (cmpLast) lane.appendChild(cmpLast.node); else lane.appendChild(emptyEl()); jump(); return; }
  const chat = chatArr(), thinking = Object.keys(busy).find(k => busy[k] === 'think' && (k === selId() || agentOn()));
  const fresh = !chat.length && !thinking;
  if (fresh){ const e = emptyEl(); lane.appendChild(e); if (!isMobile()){ const hc = $('.hcomp', e); if (hc) hc.appendChild(composer); } }
  setFresh(fresh);
  const ck0 = ckey();
  let srcs = null;
  chat.forEach((m, i) => {
    if (isFix(m)){ lane.appendChild(fixNoteEl(m)); srcs = null; }
    else if (m.role === 'user'){ const u = userEl(m.content, m.files); u.style.animation = 'none'; lane.appendChild(u); if (m.agent) lane.appendChild(agentSumEl(m.agent)); if (m.alHand) lane.appendChild(alHandEl(m)); srcs = m.sources && m.sources.length ? m.sources : null; if (srcs) lane.appendChild(sourcesEl(m)); }
    else { const b = botEl(m.model || selId()); b.style.animation = 'none'; if (m.alias) alWho(b, m); b._raw = quitaMarcas(m.content); b._ck = ck0; b._ci = i; b.dataset.ci = i; if (m.work) b.insertBefore(SZ.workSaved(m.work), $('.body', b)); $('.body', b).innerHTML = md(quitaMarcas(m.content)); if (m.imgId) imgFill($('.body', b), m); b._sources = srcs; finishBot(b, m.meta, i === chat.length - 1, m.cont, m.star); revBadge(b, m); if (!isFix(chat[i + 1])) ckIdle(b); lane.appendChild(b); }
  });
  if (live && live.chat === chat && live.el){ $$('.m.last', lane).forEach(x => x.classList.remove('last')); lane.appendChild(live.el); }
  else if (AL && AL.el && AL.chat === chat){ $$('.m.last', lane).forEach(x => x.classList.remove('last')); lane.appendChild(AL.el); }   /* v4.6 · la misión de Quoryn sigue en su sitio */   /* v3.3 · la respuesta en vivo no se pierde al repintar */
  else if (thinking) lane.appendChild(thinkEl(thinking));
  if (fresh){ msgsEl.scrollTop = 0; requestAnimationFrame(() => { msgsEl.scrollTop = 0; }); } else jump();
}
function showErr(err, o){ if (err && err.aborted) return; showErr2(err, o || {}); }
function showErr2(err, o){
  const t0 = $('.think-wrap', lane); if (t0) t0.remove();               /* nunca se queda «Pensando…» después de un error */
  try{ SZ.telEv(err && err.limit ? 'limit' : 'error', String((err && (err.sz || err.status)) || '') + ' ' + String(err && err.message || '').slice(0, 90)); }catch(e2){}
  /* a dónde puedes cambiar de verdad: a las IAs conectadas si está activa, o a tu Puter si está conectado (nunca a algo que no tienes) */
  let sw = err && err.switchTo; if (sw === 'or') sw = 'sz';
  if (sw === 'sz' && (!szOn() || /^sz:/.test(selId()))) sw = puterOn() && !/^pu:/.test(selId()) ? 'pu' : null;
  if (sw === 'pu' && !puterOn()) sw = szOn() && !/^sz:/.test(selId()) ? 'sz' : null;
  if (err && err.sz === 'sz_limit' && puterOn()) sw = 'pu';
  if (err && err.needLogin) setTimeout(openConnect, 250);
  const e = document.createElement('div'); e.className = 'm err'; e.textContent = err.message;
  if (sw){ const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm swb'; b.textContent = sw === 'pu' ? 'Seguir con mi Puter' : 'Usar las IAs conectadas'; b.addEventListener('click', () => switchProv(sw)); e.appendChild(document.createElement('br')); e.appendChild(b); }
  if (err && err.guest){ [['Crear mi cuenta · gratis', 'signup', 'btn sm swb flow'], ['Ya tengo cuenta', 'login', 'lnk swb']].forEach(([t, m, c]) => { const b = document.createElement('button'); b.type = 'button'; b.className = c; b.textContent = t; b.addEventListener('click', () => SZ.guestGate({ mode:m, done:() => { e.remove(); lockWas = null; paintLock(); try{ renderAccBtn(); }catch(x){} } })); e.appendChild(document.createElement('br')); e.appendChild(b); }); }
  else if (err && err.sz === 'sz_limit' && !puterOn()){ const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm swb'; b.textContent = 'Conectar mi Puter (gratis)'; b.addEventListener('click', () => openConnect()); e.appendChild(document.createElement('br')); e.appendChild(b); }
  err = Object.assign(err || {}, { switchTo:sw || null });
  const note = document.createElement('small'); note.className = 'errnote';
  note.textContent = 'Este intento no gastó de tu límite. ' + (o.regen ? 'La respuesta anterior sigue igual.' : 'Tu mensaje volvió a la caja de texto.') + (err && err.limit ? '' : ' Si lo intentas otra vez, cuenta como un mensaje nuevo.');
  e.appendChild(note);
  if (!(err && (err.limit || err.needLogin || err.switchTo))){ const r = document.createElement('button'); r.type = 'button'; r.className = 'btn sm swb'; r.textContent = 'Reintentar'; r.addEventListener('click', () => { e.remove(); if (o.regen) regen(); else if (inp.value.trim()) send(); }); e.appendChild(document.createElement('br')); e.appendChild(r); }
  lane.appendChild(e); jump(); }

/* copiar / otra vez / sugerencias */
function copyText(txt){
  const done = () => true;
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt).then(done, () => fallbackCopy(txt));
  return Promise.resolve(fallbackCopy(txt));
}
function fallbackCopy(txt){ const t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); try{ document.execCommand('copy'); }catch(e){} t.remove(); return true; }
function flash(btn, label){ const old = btn.innerHTML; btn.classList.add('ok'); btn.textContent = label; setTimeout(() => { btn.classList.remove('ok'); btn.innerHTML = old; }, 1300); }
lane.addEventListener('click', async e => {
  const cp = e.target.closest('.cpc');
  if (cp){ const code = $('code', cp.parentElement); await copyText(code ? code.textContent : ''); cp.classList.add('ok'); cp.textContent = '¡copiado!'; setTimeout(() => { cp.classList.remove('ok'); cp.textContent = 'copiar'; }, 1300); return; }
  const act = e.target.closest('.act');
  if (act){
    const msg = act.closest('.m, .cmp-card');
    if (act.dataset.a === 'copy'){ await copyText(msg._raw || ''); flash(act, 'Copiado'); }
    else if (act.dataset.a === 'down'){ const t = (msg._raw || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim(); const first = (t.match(/^#+\s*(.+)$/m) || [, 'respuesta'])[1]; cnvDownload({ text:t, name:(fold(first).trim().replace(/\s+/g, '-').slice(0, 40) || 'respuesta') + '.md' }); }
    else if (act.dataset.a === 'star') toggleStar(msg, act);
    else if (act.dataset.a === 'flow') pickWinner(msg);
    else if (act.dataset.a === 'regen') regen();
    else if (act.dataset.a === 'cont'){ if (!Object.keys(busy).length){ inp.value = 'Continúa exactamente donde te quedaste, sin repetir lo anterior.'; autoGrow(); updateHint(); send(); } }
    return;
  }
  const fl = e.target.closest('.flowb'); if (fl){ pickWinner(fl.closest('.cmp-card')); return; }
  const sg = e.target.closest('.sugg button[data-x]'); if (sg){ useExample(+sg.dataset.x); return; }
  const tp = e.target.closest('[data-topic]'); if (tp){ curTopic = curTopic === tp.dataset.topic ? null : tp.dataset.topic; paintTopic(); if (curTopic){ const p = $('#tPanel'); setTimeout(() => { if (p && p.isConnected) p.scrollIntoView({ behavior:SZ.reduce ? 'auto' : 'smooth', block:'nearest' }); }, 120); } return; }
  if (e.target.closest('[data-topics-more]') || e.target.closest('[data-topics-less]')){
    topicsAll = !!e.target.closest('[data-topics-more]'); const t = $('.topics', lane); if (!t) return;
    const old = new Set($$('[data-topic]', t).map(x => x.dataset.topic));
    smoothSwap(t, () => { t.innerHTML = topicsHtml().replace(/^<div[^>]*>|<\/div>$/g, ''); });
    $$('.tchip', t).forEach(x => { if (old.has(x.dataset.topic)) x.classList.remove('rise'); });
    return;
  }
  const starter = e.target.closest('[data-luma-starter]');
  if (starter){
    const lang = SZ.lang() === 'en' ? 'en' : 'es';
    if (isLocked() || Object.keys(busy).length) return;
    if (!inp.value.trim()){
      inp.value = LUMA_STARTERS[+starter.dataset.lumaStarter][lang][2];
      autoGrow();
      updateHint();
    }
    inp.focus();
    return;
  }
  const hx = e.target.closest('[data-hex]'); if (hx){ const x = TOPIC[hx.dataset.hex].ex[0]; useText(x[1], x[2]); return; }
  const tx = e.target.closest('[data-tex]'); if (tx && curTopic){ const x = TOPIC[curTopic].ex[+tx.dataset.tex]; if (x) useText(x[1], x[2]); return; }
  const use = e.target.closest('[data-use]'); if (use){ const id = use.closest('.rcard').dataset.id; pickMode = 'set'; pickModel(id, use.closest('.rcard')); if (!connected(id)) ensureConn(); return; }
  if (e.target.closest('[data-cmpgo]')){ const ids = $$('.rcard', lane).filter(c => $('[data-rc]', c).checked).map(c => c.dataset.id); startCompare(ids); return; }
  if (e.target.closest('[data-pick]')){ openSide('set', e.target.closest('[data-pick]')); return; }
  if (e.target.closest('[data-add-cmp]')){ openSide('add', e.target.closest('[data-add-cmp]')); return; }
});
lane.addEventListener('change', e => {
  const c = e.target.closest('[data-rc]'); if (!c) return;
  if (c.checked){ const others = $$('.rcard', lane).filter(x => $('[data-rc]', x).checked && $('[data-rc]', x) !== c).map(x => x.dataset.id), why = cmpWhyNot(c.closest('.rcard').dataset.id, others); if (why && why !== 'ya'){ c.checked = false; toast(why); } }
  paintCmpGo();
});
/* rellenar con un ejemplo (y si pide archivo, señalar el clip) */
function useText(text, kind){
  typeIntoComposer(text, () => {
    if (kind === 'file' && !files.length){ const a = $('#attachBtn'); a.classList.remove('pulse'); void a.offsetWidth; a.classList.add('pulse'); toast('Adjunta el archivo con el clip 📎 y luego envía.'); }
    else toast('Completa el mensaje y envíalo cuando quieras.');
  });
}
/* rellena la caja de texto SIN enviar: tú decides cuándo mandarlo */
let typeTok = 0;
function typeIntoComposer(text, done){
  if (Object.keys(busy).length) return;
  const tok = ++typeTok;                                  /* un relleno nuevo cancela el anterior */
  inp.focus(); inp.value = '';
  const end = () => { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); autoGrow(); updateHint(); if (done) done(); };
  if (SZ.reduce){ inp.value = text; end(); return; }
  let i = 0;
  (function step(){ if (tok !== typeTok) return; i = Math.min(text.length, i + 3); inp.value = text.slice(0, i); autoGrow(); if (i < text.length) setTimeout(step, 14); else end(); })();
}
/* ---------- ejemplos listos para usar ---------- */
const EXAMPLES = [
  ['Explícame una función de JavaScript', 'Explícame paso a paso qué hace esta función de JavaScript y cómo podría mejorarla:\n\n'],
  ['Ayúdame a estudiar un tema difícil', 'Ayúdame a estudiar este tema. Explícamelo como a un principiante, con un ejemplo y 3 preguntas para repasar. El tema es: '],
  ['Resume este documento', 'Resume este documento en 5 puntos clave y dime qué es lo más importante.', 'file'],
  ['Compara dos soluciones para un problema', 'Compara estas dos soluciones para el mismo problema. Dime ventajas, desventajas y cuál conviene:\n\nSolución A:\n\nSolución B:\n']
];
const DRAFTS = { study:[1, 'study'], code:[0, 'code'], create:[null, 'fast', 'Ayúdame a desarrollar esta idea. Hazme preguntas para aterrizarla y propón un plan en pasos. Mi idea es: '] };
function useExample(i){
  const x = EXAMPLES[i]; if (!x) return;
  typeIntoComposer(x[1], () => {
    if (x[2] === 'file' && !files.length){
      const a = $('#attachBtn'); a.classList.remove('pulse'); void a.offsetWidth; a.classList.add('pulse');
      toast('Adjunta el documento con el «+» y luego envía.');
    } else toast('Completa el mensaje y envíalo cuando quieras.');
  });
}
/* ---------- modo principiante: eliges qué quieres hacer y te sugiero un modelo con datos reales ---------- */
const INTENTS = [['fast', '⚡', 'Rápido'], ['code', '💻', 'Programar'], ['study', '📚', 'Estudiar'], ['deep', '🧠', 'Tareas complejas']];
const INTENT_NAME = Object.fromEntries(INTENTS.map(([k, , l]) => [k, l]));
function factsOf(m){
  const ex = SZ.expertOf(m).tags, F = [];
  if (m.reasoning) F.push(['reason', 'Piensa antes de responder', 'catálogo']);
  else if (ex.includes('reason')) F.push(['reason', 'Hecha para pensar con calma', 'su nombre o descripción']);
  if (ex.includes('code')) F.push(['code', 'Pensado para programar', 'su nombre o descripción']);
  if (ex.includes('fast')) F.push(['fast', 'Versión ligera', 'su nombre (no hay medición de velocidad)']);
  if (ex.includes('math')) F.push(['math', 'Matemáticas', 'su nombre o descripción']);
  if (ex.includes('lang')) F.push(['lang', 'Buen soporte de español', 'su familia de IA']);
  if (m.ctx) F.push(['ctx', kfmt(m.ctx) + ' de contexto', 'catálogo']);
  return F;
}
function recommend(k){
  const avail = cat.list.filter(m => connected(m.id) && (m.free || /^pu:/.test(m.id)) && !m.stub);
  if (!avail.length) return { none:'conn' };
  const W = { fast:{ fast:30, reason:-8 }, code:{ code:40, reason:8 }, study:{ reason:18, lang:10, ctx:0, write:6 }, deep:{ reason:40, code:6, math:6 } }[k];
  const sc = m => {
    const F = factsOf(m), has = x => F.some(f => f[0] === x), ex = SZ.expertOf(m).tags;
    let s = 0; Object.keys(W).forEach(x => { if (has(x) || (x === 'write' && ex.includes('write'))) s += W[x]; });
    if ((k === 'deep' || k === 'study') && m.ctx >= 120000) s += k === 'deep' ? 12 : 8;
    if (m.reasoning && W.reason > 0) s += 4;                       /* dato del catálogo: pesa un poco más que el nombre */
    if (/apodex/i.test(m.id)) s += 3;
    s += Math.min(6, SZ.surveyScore(m, st().survey) / 10);
    return s;
  };
  const best = avail.map(m => [m, sc(m)]).sort((a, b) => b[1] - a[1] || (b[0].ctx || 0) - (a[0].ctx || 0))[0];
  if (!best || best[1] < 20) return { none:'data' };
  return { m:best[0] };
}
function limitsOf(m){
  const L = [];
  if (/^sz:/.test(m.id)) L.push('Gratis: usa tu EnerX de hoy');
  else if (/^pu:/.test(m.id)) L.push('Con tu cuenta gratis de Puter');

  L.push(m.vision ? 'Acepta imágenes y PDF' : /^pu:/.test(m.id) ? 'No sabemos si esta IA ve fotos; los PDF y textos sí los lee' : 'No ve imágenes; los PDF y textos se leen como texto');
  return L;
}
function intentHtml(){
  const cur = st().intent && st().intent.id === selId() ? st().intent : null;
  let h = '<div class="intent"><p class="ilbl">¿Qué quieres hacer? Te sugiero una IA</p><div class="iseg" role="group" aria-label="Qué quieres hacer">'
    + INTENTS.map(([k, e, l]) => '<button type="button" data-intent="' + k + '" aria-pressed="' + !!(cur && cur.k === k) + '"><span aria-hidden="true">' + e + '</span>' + l + '</button>').join('') + '</div>';
  if (cur && cur.none) h += '<div class="ipick"><p>' + esc(cur.none) + '</p></div>';
  else if (cur){
    const m = info(cur.id);
    h += '<div class="ipick"><p>Para <b>' + esc(INTENT_NAME[cur.k]) + '</b> elegí <b>' + esc(m.name) + '</b>.</p>'
      + '<ul class="ifacts">' + factsOf(m).slice(0, 4).map(f => '<li><b>' + esc(f[1]) + '</b><small>según ' + esc(f[2]) + '</small></li>').join('') + '</ul>'
      + '<p class="ilim">' + limitsOf(m).map(esc).join(' · ') + '</p>'
      + '<button type="button" class="lnk" data-ichange>Cambiar de IA</button></div>';
  }
  return h + '</div>';
}
function chooseIntent(k){
  const r = recommend(k);
  if (r.none){
    st().intent = { k, id:selId(), none: r.none === 'conn' ? 'Conecta Puter para que pueda recomendarte una.' : 'Todavía no sé qué IA recomendarte para «' + INTENT_NAME[k] + '». Sigues con ' + info(selId()).name + '; puedes cambiarlo en la lista.' };
    save(); renderMsgs(); if (r.none === 'conn') openConnect(); return;
  }
  st().intent = { k, id:r.m.id };
  if (r.m.id !== selId()) pickModel(r.m.id); else { save(); renderMsgs(); }
  toast('Elegí ' + r.m.name + ' para ' + INTENT_NAME[k].toLowerCase() + '.');
}

function autoGrow(){ if (inp._sync) inp._sync(); inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 170) + 'px'; }
function updateHint(){
  const h = $('#hintRight'); let rf = []; try{ rf = files.filter(f => f.state === 'ok'); }catch(e){}
  const has = inp.value.trim() || rf.length;
  let n = 0;
  if (has && mode === 'cmp') n = est(inp.value) * Math.max(1, st().cmp.length);
  else if (has){ try{ const draft = { role:'user', content:inp.value }; if (rf.length) draft.files = rf.map(f => ({ name:f.name, kind:f.kind, text:f.text })); n = msgCost(apiMsgs([...chatArr(), draft], info(selId()).vision)); }catch(e){ n = est(inp.value); } }
  const c = st().sx.saver && n ? 'respuestas cortas' : '';
  h.innerHTML = mode === 'cmp' ? (st().cmp.length ? 'Se envía a ' + st().cmp.length + (st().cmp.length === 1 ? ' modelo' : ' modelos') : 'Elige IA en la lista') + (c ? ' · ' + c : '')
    : (!needsConn() ? c : '<a href="#" data-conn>Conecta una IA para empezar</a>');
}
inp.addEventListener('input', () => { autoGrow(); updateHint(); });
/* en el celular (pantalla táctil) «Enter» da un salto de línea y se envía con el botón de enviar; en el computador Enter envía y Shift+Enter baja de línea */
const touchKb = () => { try{ return matchMedia('(hover: none) and (pointer: coarse)').matches; }catch(e){ return false; } };
{ const kh = document.querySelector('.kbdh'); if (kh && touchKb()) kh.textContent = 'Enter salta de línea · envía con la flecha'; }
inp.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
  if (touchKb() && !(e.ctrlKey || e.metaKey)) return;     /* deja el salto de línea normal */
  e.preventDefault(); send();
});
sendBtn.addEventListener('click', () => { if (Object.keys(busy).length) stopNow(); else send(); });

/* v1.9 · la caja de escribir va mostrando ejemplos (todos distintos) para que se note que ahí se escribe */
const PH_EX = ['Escribe un correo para pedir un día libre', 'Dame 3 ideas de regalo por menos de 50.000 pesos', 'Explícame la fotosíntesis como a un niño', 'Resume este texto en 5 puntos', 'Hazme una rutina de ejercicio en casa', 'Corrige la ortografía de mi párrafo', 'Dame 5 nombres para una panadería', 'Traduce «buenos días, equipo» al inglés', 'Planea un viaje de 3 días a Cartagena', 'Escribe un post de Instagram para mi tienda', '¿Cómo saco el 20 % de 85.000?', 'Haz una lista de compras para la semana', 'Escribe un poema corto para mi mamá', 'Explícame qué es una tasa de interés', 'Hazme 10 preguntas para estudiar historia', 'Dame una receta con arroz, huevo y tomate', 'Escribe un mensaje para cobrarle a un cliente', 'Crea una página web sencilla de un portafolio', 'Explícame este error de Python', 'Dame ideas para un cumpleaños en casa', 'Escribe la descripción de un producto', 'Ayúdame a preparar una entrevista de trabajo', '¿Qué estudiar si me gustan los números?', 'Haz un horario para estudiar en la tarde', 'Escribe un cuento corto de miedo', 'Ordena estas tareas de la más urgente a la menos', 'Dame un plan para ahorrar 500.000 pesos', 'Explícame cómo funciona internet', 'Escribe un saludo para un grupo de WhatsApp', 'Hazme un guion para un video de 30 segundos', 'Compara dos celulares para comprar', 'Escribe una carta de renuncia amable', 'Dame frases para motivar a mi equipo', 'Diseña el logo de mi marca con palabras', 'Ayúdame a entender una factura', 'Haz un resumen de la Segunda Guerra Mundial'];
let phOrder = [], phT = 0, phIdx = 0;
function phNext(){
  if (!phOrder.length){ phOrder = PH_EX.map((_, i) => i).sort(() => Math.random() - .5); try{ const last = +localStorage.getItem('synthz:phlast'); if (phOrder[0] === last) phOrder.push(phOrder.shift()); }catch(e){} }
  const i = phOrder.shift(); try{ localStorage.setItem('synthz:phlast', String(i)); }catch(e){} return PH_EX[i];
}
function phFree(){ return mode === 'solo' && !isLocked() && !trialOn && !inp.value && !inp.readOnly; }
function phTick(){
  clearTimeout(phT);
  if (document.hidden || !phFree()){ phT = setTimeout(phTick, 1500); return; }
  const full = 'Ej.: ' + phNext(); let k = 0;
  const type = () => {
    if (!phFree()){ phT = setTimeout(phTick, 1500); return; }
    k++; inp.placeholder = full.slice(0, k) + (k < full.length ? '▍' : '');
    if (k < full.length) phT = setTimeout(type, SZ.reduce ? 0 : 34); else phT = setTimeout(phTick, 4200);
  };
  if (SZ.reduce){ inp.placeholder = full; phT = setTimeout(phTick, 5000); } else type();
}
setTimeout(phTick, 2500);
/* ---------- detener la respuesta (botón o Esc) ---------- */
const ctls = new Set();
function stopNow(){ let did = false; if (ctls.size){ ctls.forEach(c => c.abort()); ctls.clear(); did = true; } if (SZ.reveals.size){ SZ.reveals.forEach(r => r.skip()); did = true; } if (did) toast('Respuesta detenida.'); return did; }
addEventListener('keydown', e => { if (e.key === 'Escape' && !document.querySelector('.szm,#blk,#acc,#sx,#conn,#tour') && stopNow()) e.preventDefault(); });

/* borrar el chat actual (antes era el botón «Limpiar»; ahora vive en el menú «⋯») */
async function clearChat(ask){
  if (mode === 'cmp'){ stopNow(); cmpRun++; cmpLast = null; Object.keys(busy).forEach(k => delete busy[k]); renderMsgs(); renderNow(); return; }
  if (!chatArr().length) return;
  if (ask && !(await SZ.szConfirm('¿Borrar este chat?', 'Se borran sus mensajes de este dispositivo y de tu cuenta. No se puede deshacer.', 'Borrar', true))) return;
  gen++; Object.keys(busy).forEach(k => delete busy[k]);
  st().chats[ckey()] = []; save(); renderMsgs(); renderNow(); renderChats();
}
/* ---------- favoritos: la estrella vuela dorada hasta tu colección ---------- */
function toggleStar(el, btn){
  const chat = st().chats[el._ck], m = chat && chat[el._ci];
  if (!m || m.role !== 'assistant' || m.content !== el._raw){ toast('Esta respuesta cambió; vuelve a intentarlo.'); return; }
  m.star = !m.star || undefined; save();
  btn.setAttribute('aria-pressed', String(!!m.star)); $('span', btn).textContent = m.star ? 'Favorita' : 'Guardar';
  el.classList.toggle('starred', !!m.star);
  if (m.star){ flyStar(btn); toast('Guardada en tus favoritos ★'); } else toast('Quitada de tus favoritos.');
  if (cView === 'favs') renderChats();
}
function flyStar(from){
  const t = isMobile() ? $('#tabbar [data-tab="chats"]') : $('#railFav');
  const ping = () => { if (!t) return; t.classList.remove('got'); void t.offsetWidth; t.classList.add('got'); };
  if (!t || root.classList.contains('noanim') || SZ.reduce){ ping(); return; }
  const a = from.getBoundingClientRect(), b = t.getBoundingClientRect();
  const x0 = a.left + 16, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
  const cx = (x0 + x1) / 2 + (x1 < x0 ? 40 : -40), cy = Math.min(y0, y1) - Math.min(220, Math.abs(x1 - x0) * .4 + 80);
  const s = document.createElement('div'); s.className = 'flystar'; s.innerHTML = STAR; document.body.appendChild(s);
  const D = 950, t0 = performance.now(); let f = 0;
  const step = now => {
    const k = Math.min(1, (now - t0) / D), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, u = 1 - e;
    const x = u * u * x0 + 2 * u * e * cx + e * e * x1, y = u * u * y0 + 2 * u * e * cy + e * e * y1;
    s.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + (1 + Math.sin(e * Math.PI) * .9) + ') rotate(' + (e * 400) + 'deg)';
    if (++f % 2 === 0){ const d = document.createElement('i'); d.className = 'flytrail'; d.style.transform = 'translate(' + x + 'px,' + y + 'px)'; document.body.appendChild(d); d.animate([{ opacity:.9, transform:'translate(' + x + 'px,' + y + 'px) scale(1)' }, { opacity:0, transform:'translate(' + (x + (Math.random() * 10 - 5)) + 'px,' + (y + 8) + 'px) scale(.2)' }], { duration:620, easing:'ease-out' }).onfinish = () => d.remove(); }
    if (k < 1) requestAnimationFrame(step); else { s.remove(); ping(); burst(x1, y1, ['#e6b65f', '#ffe2a8', '#c9566c'], 10); }
  };
  requestAnimationFrame(step);
}

/* ---------- archivos: imágenes, PDF y texto/código ---------- */
const files = []; let fid = 0;
const TEXTX = /\.(txt|md|markdown|csv|tsv|json|jsonl|xml|html?|css|scss|less|js|cjs|mjs|jsx|ts|tsx|py|ipynb|java|c|h|cpp|hpp|cs|go|rs|rb|php|sh|bat|ps1|sql|yml|yaml|toml|ini|cfg|conf|env|log|tex|swift|kt|kts|dart|scala|pl|r|lua|vue|svelte|astro|graphql|gql|proto|srt|vtt|rtf|svg|gradle|properties)$/i;
/* v3.4 · Word, Excel, PowerPoint y OpenDocument: se sacan sus textos en el navegador (son un .zip con XML adentro) */
const OFFX = /\.(docx|xlsx|pptx|odt|ods|odp)$/i;
const FILES_MAX = 10, CAP = 40000, clip = t => t.length > CAP ? t.slice(0, CAP) + '\n…(archivo recortado)' : t;
function readImg(file){
  return new Promise((ok, no) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const mk = max => { const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * s)); c.height = Math.max(1, Math.round(im.height * s)); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); return c; };
      const r = { dataUrl: mk(1280).toDataURL('image/jpeg', .84), thumb: mk(96).toDataURL('image/jpeg', .7) };   /* v3.4 · 1280 px: se ve igual de bien y viaja más rápido */
      URL.revokeObjectURL(url); ok(r);
    };
    im.onerror = () => { URL.revokeObjectURL(url); no(new Error('No pude leer la imagen ' + file.name + '.')); };
    im.src = url;
  });
}
let pdfP;
function loadPdf(){
  return pdfP || (pdfP = (async () => {
    const B = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
    await new Promise((ok, no) => { const s = document.createElement('script'); s.src = B + 'pdf.min.js'; s.onload = ok; s.onerror = () => no(new Error('No pude cargar el lector de PDF. Revisa tu internet.')); document.head.appendChild(s); });
    const w = await (await fetch(B + 'pdf.worker.min.js')).text();
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([w], { type:'text/javascript' }));
    return window.pdfjsLib;
  })().catch(e => { pdfP = null; throw e; }));
}
async function readPdf(file){
  const lib = await loadPdf(), task = lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  /* v3.8 · PDF con contraseña: se la pide a la persona (antes salía «No pude leer el PDF») */
  task.onPassword = (give, why) => {
    const en = SZ.lang() === 'en', nm = file.name || 'PDF';
    const pw = prompt(why === 2 ? (en ? 'That password did not work. Try again for «' + nm + '»:' : 'Esa contraseña no sirvió. Prueba otra vez para «' + nm + '»:') : (en ? '«' + nm + '» is locked. Type its password:' : '«' + nm + '» tiene contraseña. Escríbela para abrirlo:'));
    if (pw == null) task.destroy(); else give(pw);
  };
  const pdf = await task.promise;
  let t = '';
  for (let i = 1; i <= Math.min(pdf.numPages, 60) && t.length < CAP; i++){
    const tc = await (await pdf.getPage(i)).getTextContent();
    t += '\n--- página ' + i + ' ---\n' + tc.items.map(x => x.str).join(' ');
  }
  /* v3.4 · PDF escaneado (sin texto): sus primeras páginas se mandan como fotos, así una IA que ve lo puede leer */
  if (t.replace(/--- página \d+ ---/g, '').trim().length < 20){
    const pics = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 4); i++){
      const pg = await pdf.getPage(i), v0 = pg.getViewport({ scale:1 }), k = Math.min(2, 1280 / Math.max(v0.width, v0.height)), vp = pg.getViewport({ scale:k });
      const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvasContext:g, viewport:vp }).promise; pics.push(c.toDataURL('image/jpeg', .8));
    }
    if (!pics.length) throw new Error('Ese PDF está vacío.');
    return { scanned:true, pics, pages:pdf.numPages };
  }
  return clip(t.trim());
}
/* lector mínimo de .zip (sin librerías): lee el índice del final y descomprime con DecompressionStream.
   v3.8 · trabaja por pedazos del archivo (Blob.slice): un .zip de 500 MB ya no se carga entero en memoria */
async function zipOpen(src){
  const file = src instanceof Blob ? src : new Blob([src]), size = file.size, td = new TextDecoder();
  const tn = Math.min(size, 65557), tail = new DataView(await file.slice(size - tn).arrayBuffer());
  let e = tn - 22; while (e >= 0 && tail.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('El archivo está dañado.');
  let n = tail.getUint16(e + 10, true), cdLen = tail.getUint32(e + 12, true), cdAt = tail.getUint32(e + 16, true);
  if ((cdAt === 0xffffffff || n === 0xffff) && e >= 20 && tail.getUint32(e - 20, true) === 0x07064b50){   /* zip64 (más de 4 GB o 65.535 archivos) */
    const at = Number(tail.getBigUint64(e - 12, true)), z = new DataView(await file.slice(at, at + 56).arrayBuffer());
    n = Number(z.getBigUint64(32, true)); cdLen = Number(z.getBigUint64(40, true)); cdAt = Number(z.getBigUint64(48, true));
  }
  const dv = new DataView(await file.slice(cdAt, cdAt + cdLen).arrayBuffer()), ent = {};
  for (let i = 0, p = 0; i < n && p + 46 <= dv.byteLength; i++){
    const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
    let cs = dv.getUint32(p + 20, true), us = dv.getUint32(p + 24, true), lo = dv.getUint32(p + 42, true);
    if (cs === 0xffffffff || us === 0xffffffff || lo === 0xffffffff){   /* tamaños de zip64 en el campo extra */
      for (let q = p + 46 + nl, end = q + xl; q + 4 <= end;){ const id = dv.getUint16(q, true), ln = dv.getUint16(q + 2, true); if (id === 1){ let r = q + 4; if (us === 0xffffffff){ us = Number(dv.getBigUint64(r, true)); r += 8; } if (cs === 0xffffffff){ cs = Number(dv.getBigUint64(r, true)); r += 8; } if (lo === 0xffffffff) lo = Number(dv.getBigUint64(r, true)); break; } q += 4 + ln; }
    }
    ent[td.decode(new Uint8Array(dv.buffer, p + 46, nl))] = { m:dv.getUint16(p + 10, true), fl:dv.getUint16(p + 8, true), cs, us, lo };
    p += 46 + nl + xl + cl;
  }
  const blob = async (name, max = 60 * 1048576) => {
    const x = ent[name]; if (!x) return new Blob([]);
    if (x.fl & 1) throw new Error('Ese archivo tiene contraseña.');
    const h = new DataView(await file.slice(x.lo, x.lo + 30).arrayBuffer()), at = x.lo + 30 + h.getUint16(26, true) + h.getUint16(28, true), raw = file.slice(at, at + x.cs);
    if (x.m === 0) return raw;
    if (x.m !== 8 || typeof DecompressionStream === 'undefined') throw new Error('Tu navegador no puede abrir este archivo. Guárdalo como PDF y súbelo otra vez.');
    return inflate(raw.stream().pipeThrough(new DecompressionStream('deflate-raw')), max);
  };
  return { names:Object.keys(ent), size:k => (ent[k] || {}).us || 0, locked:k => !!((ent[k] || {}).fl & 1), blob, read:async name => (await blob(name, 24 * 1048576)).text() };
}
const xmlTxt = x => x.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&amp;/g, '&');
const byNum = (a, b) => (+(a.match(/(\d+)\.xml$/) || [])[1] || 0) - (+(b.match(/(\d+)\.xml$/) || [])[1] || 0);
async function readOffice(file){
  const z = await zipOpen(file), ext = file.name.split('.').pop().toLowerCase();
  let t = '';
  if (ext === 'docx'){
    const x = await z.read('word/document.xml');
    t = xmlTxt(x.replace(/<w:tab\/>/g, '\t').replace(/<w:br[^>]*\/>/g, '\n').replace(/<\/w:p>/g, '\n').replace(/<\/w:tc>/g, ' | ').replace(/<\/w:tr>/g, '\n'));
  } else if (ext === 'pptx'){
    const sl = z.names.filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort(byNum);
    for (let i = 0; i < sl.length && t.length < CAP; i++) t += '\n--- diapositiva ' + (i + 1) + ' ---\n' + xmlTxt((await z.read(sl[i])).replace(/<\/a:p>/g, '\n'));
  } else if (ext === 'xlsx'){
    const ss = [...(await z.read('xl/sharedStrings.xml')).matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => xmlTxt(m[1]));
    const sh = z.names.filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort(byNum);
    for (let i = 0; i < sh.length && t.length < CAP; i++){
      t += '\n--- hoja ' + (i + 1) + ' ---\n';
      for (const row of (await z.read(sh[i])).matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)){
        const cells = [...row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)].map(c => {
          const ty = (/\bt="(\w+)"/.exec(c[1]) || [])[1], v = (/<v>([\s\S]*?)<\/v>/.exec(c[2] || '') || [])[1];
          return ty === 's' ? (ss[+v] || '') : ty === 'inlineStr' ? xmlTxt((/<is>([\s\S]*?)<\/is>/.exec(c[2] || '') || [])[1] || '') : v != null ? xmlTxt(v) : '';
        });
        if (cells.some(Boolean)) t += cells.join('\t') + '\n';
        if (t.length > CAP) break;
      }
    }
  } else {
    t = xmlTxt((await z.read('content.xml')).replace(/<\/text:(p|h)>/g, '\n').replace(/<text:tab\/>/g, '\t').replace(/<\/table:table-cell>/g, '\t').replace(/<\/table:table-row>/g, '\n'));
  }
  t = t.replace(/\n{3,}/g, '\n\n').trim();
  if (t.length < 2) throw new Error('No encontré texto en «' + file.name + '».');
  return clip(t);
}
function renderTray(){
  $('#tray').innerHTML = files.map(f => '<span class="fc ' + f.state + '" data-id="' + f.id + '">' + (f.thumb ? '<img src="' + esc(f.thumb) + '" alt="">' : (SZ.fileIco(f.name.split('.').pop()) ? '<i class="ic img">' + SZ.fileIco(f.name.split('.').pop()) + '</i>' : '<i class="ic">' + esc((f.name.split('.').pop() || 'file').slice(0, 4)) + '</i>')) + '<b>' + esc(f.name) + '</b>' + (f.prog ? '<small class="fcp">' + esc(f.prog) + '</small>' : '') + '<button class="x" type="button" aria-label="Quitar archivo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span>').join('');
}
async function addFiles(list){
  /* v3.8 · cualquier archivo, en Individual y en Comparar: readAny nunca falla (lo que no sea texto se convierte o se describe) */
  for (const file of [...list]){
    if (files.length >= FILES_MAX){ toast('Máximo ' + FILES_MAX + ' archivos por mensaje.'); break; }
    const f = { id:++fid, name:file.name || 'archivo', state:'load', kind:'text', size:file.size }; files.push(f); renderTray();
    try{ await readAny(file, f); }
    catch(e){ console.warn('[archivos]', e); f.kind = 'text'; f.text = fichaTxt(file); }
    if (!f.text && f.kind !== 'img') f.text = fichaTxt(file);
    f.state = 'ok'; delete f.prog;
    renderTray();
  }
}
$('#tray').addEventListener('click', e => { const x = e.target.closest('.x'); if (!x) return; const i = files.findIndex(f => f.id === +x.closest('.fc').dataset.id); if (i > -1){ files.splice(i, 1); renderTray(); } });
/* el clip ya no abre el buscador de golpe: muestra un menú con lo que puedes adjuntar */
const attMenu = $('#attMenu'), attBtn = $('#attachBtn');
function attOpen(){ attMenu.hidden = false; attMenu.classList.remove('bye'); attBtn.setAttribute('aria-expanded', 'true'); }
function attClose(){ if (attMenu.hidden) return; attBtn.setAttribute('aria-expanded', 'false'); attMenu.classList.add('bye'); setTimeout(() => { if (attMenu.classList.contains('bye')){ attMenu.hidden = true; attMenu.classList.remove('bye'); } }, 260); }
attBtn.addEventListener('click', () => { if (attMenu.hidden) attOpen(); else attClose(); });
attMenu.addEventListener('click', e => { const b = e.target.closest('[data-att]'); if (!b) return; attClose(); const k = b.dataset.att; if (k === 'mkimg') return setImgMode(!imgMode); if (k === 'web'){ if (imgMode) setImgMode(false); return setWebMode(webMode === 'on' ? 'auto' : 'on'); } if (k === 'noweb') return setWebMode(webMode === 'off' ? 'auto' : 'off'); $({ file:'#fileIn', img:'#imgIn', cam:'#camIn' }[k]).click(); });
document.addEventListener('pointerdown', e => { if (!attMenu.hidden && !e.target.closest('.attw')) attClose(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !attMenu.hidden){ e.preventDefault(); attClose(); attBtn.focus(); } });
['#fileIn', '#imgIn', '#camIn'].forEach(s => $(s).addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; }));
let dragN = 0; const hasF = e => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
addEventListener('dragenter', e => { if (hasF(e)){ dragN++; document.body.classList.add('drag'); } });
addEventListener('dragleave', () => { dragN = Math.max(0, dragN - 1); if (!dragN) document.body.classList.remove('drag'); });
addEventListener('dragover', e => { if (hasF(e)) e.preventDefault(); });
addEventListener('drop', e => { dragN = 0; document.body.classList.remove('drag'); if (hasF(e)){ e.preventDefault(); addFiles(e.dataTransfer.files); } });
inp.addEventListener('paste', e => { const fl = [...((e.clipboardData && e.clipboardData.files) || [])]; if (fl.length){ e.preventDefault(); addFiles(fl); } });
SZ.mirrorType(inp);
/* mensajes que viajan a la IA. Para ahorrar SynXCoin's: los archivos solo se reenvían
   completos en el último mensaje que los trajo, y el modo ahorro manda menos historial */
function apiMsgs(chat, vision, o = {}){
  const saver = !o.naive && st().sx.saver, keepN = saver ? 6 : 20;
  let lastF = -1;
  if (!o.naive) for (let i = chat.length - 1; i >= 0; i--) if (chat[i].role === 'user' && chat[i].files && chat[i].files.length){ lastF = i; break; }
  const start = Math.max(0, chat.length - keepN);
  const h = chat.slice(start).map((m, j) => {
    if (m.imgId) return null;
    const dk = m.role === 'user' && m.deck && start + j === chat.length - 1 ? DECK_INSTR : '', noDk = s => String(s || '').split(DECK_INSTR).join('');   /* la orden de «arma una presentación» solo viaja en ESTE mensaje, no en los viejos */
    if (m.role !== 'user' || !m.files || !m.files.length) return { role:m.role, content:noDk((m.role === 'user' && m.ask) || m.content) + dk };
    const full = o.naive || start + j === lastF;
    let t = noDk(m.ask || m.content || '') + dk;
    m.files.forEach(f => {
      if (f.text) t += full ? '\n\n[Archivo adjunto: ' + f.name + ']\n```\n' + (saver && f.text.length > 12000 ? f.text.slice(0, 12000) + '\n…(recortado por el modo ahorro)' : f.text) + '\n```' : '\n\n[Archivo adjunto antes: ' + f.name + ' (no se reenvía para ahorrar SynXCoin\'s)]';
      else if (f.kind === 'img' && !(vision && m._imgs && full)) t += '\n\n[Imagen adjunta: ' + f.name + (full ? ' (ya no está disponible)' : ' (no se reenvía)') + ']';
    });
    const imgs = vision && m._imgs && full ? m._imgs : [];
    t = t.trim() || 'Mira la imagen.';
    return imgs.length ? { role:m.role, content:[{ type:'text', text:t }, ...imgs.map(u => ({ type:'image_url', image_url:{ url:u } }))] } : { role:m.role, content:t };
  }).filter(Boolean);
  while (h.length && h[0].role !== 'user') h.shift();
  const sys = [];
  /* v4.0 · con las IAs conectadas (sz:) el servidor pone unas instrucciones mejores para cada tipo de trabajo (api/_cerebro.js): aquí no se repiten */
  if (!o.naive && !o.srv){ const lu = [...chat].reverse().find(m => m.role === 'user'); sys.push(qualitySystem(saver, lu && String(lu.ask || lu.content || ''), o.mid)); }
  /* v4.0 · el hilo: si la charla es más larga de lo que viaja, la IA igual sabe de qué se habló antes (sin gastar otra IA) */
  if (!o.naive && start > 0){
    const old = chat.slice(0, start).filter(m => m.role === 'user' && !m.imgId).map(m => String(m.ask || m.content || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const first = old[0], rest = old.slice(1).slice(-8);
    if (first) sys.push('Contexto de esta conversación (mensajes anteriores que ya no se reenvían): empezó con «' + first.slice(0, 300) + '»' + (rest.length ? ' y después la persona preguntó: ' + rest.map(x => '«' + x.slice(0, 140) + '»').join('; ') : '') + '. Mantén coherencia con eso.');
  }
  if (o.webAsk) sys.push(webAskSys());   /* v3.8 · la IA puede pedir una búsqueda en internet ella sola */   /* v3.4 · calidad: piensa, revisa la lógica y no inventa */
  if (saver) sys.push('Responde en el idioma del usuario, de forma clara y breve, sin relleno.');
  { const cs = o.naive ? '' : codeSystem(chat, saver); if (cs) sys.push(cs); }   /* v2.4 · SynthCode: manual de programación cuando pides código */
  { const ef = effortHint(); if (ef && !o.naive) sys.push(ef); }   /* v2.3.1 · esfuerzo */
  { const mm = memSystem(); if (mm && !o.naive) sys.push(mm); }
  if (!o.naive && !o.noMarks) sys.push(marcasSystem(chat));   /* v4.0 · título con sentido y memoria redactada por la IA */
  { const ps = o.naive ? '' : projSystem(chat, saver); if (ps) sys.push(ps); }   /* v2.6 · proyectos: instrucciones y archivos del proyecto */
  if (SZ.CFG.beginner) sys.push('Modo principiante: la persona no sabe nada del tema. Usa palabras sencillas y frases cortas, explica paso a paso, evita los tecnicismos (si usas uno, explícalo) y pon un ejemplo de la vida diaria.');
  if (sys.length) h.unshift({ role:'system', content:sys.join(' ') });
  return h;
}
function msgCost(msgs){ return msgs.reduce((n, m) => n + 4 + (typeof m.content === 'string' ? est(m.content) : m.content.reduce((k, x) => k + (x.type === 'text' ? est(x.text) : 800), 0)), 0); }
/* caché: la misma pregunta al mismo modelo no se vuelve a pagar */
const CACHE_KEY = 'synthz:cache';
function hashStr(s){ let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + s.length.toString(36); }
function cacheAll(){ try{ return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; }catch(e){ return {}; } }
function cacheGet(k){ const c = cacheAll()[k]; return c && Date.now() - c.t < 7 * 864e5 ? c : null; }
function cachePut(k, r){
  const c = cacheAll(); c[k] = { t:Date.now(), text:r.text, prompt:r.prompt, completion:r.completion, model:r.model };
  const ks = Object.keys(c).sort((a, b) => c[b].t - c[a].t); ks.slice(60).forEach(x => delete c[x]);
  try{ localStorage.setItem(CACHE_KEY, JSON.stringify(c)); }catch(e){}
}
/* ---------- v3.8 · adjuntar CUALQUIER archivo, sin errores ----------
   Antes, lo que no era texto, PDF, Office o foto salía «Tipo de archivo no compatible» y se borraba de la bandeja.
   Ahora todo se lee aquí, en el navegador y gratis, y la IA elegida recibe algo que entiende:
   · fotos (también HEIC del iPhone), PDF (con texto, escaneado o con contraseña), Word/Excel/PowerPoint/OpenDocument,
     .doc/.xls/.ppt viejos, RTF, EPUB, código y cualquier texto;
   · .zip (y .jar, .apk…), .tar, .gz y .tgz: se abren y se lee lo que traen adentro;
   · audio y video: se pasan a texto (Whisper, gratis, en /api/ai) y del video se sacan 3 fotos;
   · lo demás (programas, bases de datos, formatos raros): qué es, su tamaño y el texto que se pueda rescatar.
   readAny nunca lanza un error: si un camino falla, prueba el siguiente y al final siempre queda una ficha del archivo. */
const MB = 1048576;
const sizeTxt = n => n < 1024 ? n + ' B' : n < MB ? (n / 1024).toFixed(1).replace('.0', '') + ' KB' : n < 1024 * MB ? (n / MB).toFixed(1).replace('.0', '') + ' MB' : (n / 1024 / MB).toFixed(2) + ' GB';
const extOf = n => { const m = /\.([a-z0-9]{1,10})$/i.exec(String(n || '')); return m ? m[1].toLowerCase() : ''; };
const IMGX = /\.(png|jpe?g|jfif|pjpeg|gif|webp|bmp|ico|avif|apng|tiff?|heic|heif)$/i;
const AUDX = /\.(mp3|wav|wave|m4a|aac|ogg|oga|opus|flac|weba|amr|aiff?|wma|mid|midi|3ga)$/i;
const VIDX = /\.(mp4|m4v|mov|webm|mkv|avi|wmv|3gp|ogv|mpe?g|flv)$/i;
const ZIPX = /\.(zip|jar|apk|aab|xpi|crx|ipa|nupkg|whl|vsix|sketch|xd|kmz|cbz|odg|key|numbers|pages|xps|oxps|3mf)$/i;
const OLDX = /\.(doc|dot|xls|xlt|ppt|pps|pot|wps|wpd|pub|vsd|msg|mdb|accdb)$/i;
/* qué es un archivo según sus primeros bytes (sirve cuando el nombre no tiene extensión o miente) */
function magicOf(u){
  const s = (a, b) => String.fromCharCode(...u.slice(a, b)), h = (...x) => x.every((v, i) => u[i] === v);
  if (h(0xff, 0xfe) || h(0xfe, 0xff) || h(0xef, 0xbb, 0xbf)) return 'text';   /* marca de texto UTF-8/16 (FF FE se parece al comienzo de un mp3) */
  if (h(0x25, 0x50, 0x44, 0x46)) return 'pdf';
  if (h(0x50, 0x4b, 0x03, 0x04) || h(0x50, 0x4b, 0x05, 0x06)) return 'zip';
  if (h(0x1f, 0x8b)) return 'gz';
  if (u.length > 262 && s(257, 262) === 'ustar') return 'tar';
  if (h(0x49, 0x49, 0x2a, 0) || h(0x4d, 0x4d, 0, 0x2a)) return 'img';
  if (h(0x89, 0x50, 0x4e, 0x47) || h(0xff, 0xd8, 0xff) || s(0, 4) === 'GIF8' || (s(0, 4) === 'RIFF' && s(8, 12) === 'WEBP') || h(0x42, 0x4d)) return 'img';
  if (s(4, 8) === 'ftyp'){ const b = s(8, 12); return /^(heic|heix|hevc|mif1|msf1|avif)/.test(b) ? 'img' : /^(M4A |M4B |mp42?|isom|dash|M4V |qt  |3gp)/.test(b) ? 'av' : 'av'; }
  if (s(0, 3) === 'ID3' || (u[0] === 0xff && (u[1] & 0xe0) === 0xe0) || s(0, 4) === 'OggS' || s(0, 4) === 'fLaC' || (s(0, 4) === 'RIFF' && /WAVE|AVI /.test(s(8, 12))) || h(0x1a, 0x45, 0xdf, 0xa3)) return 'av';
  if (s(0, 5) === '{\\rtf') return 'rtf';
  if (h(0xd0, 0xcf, 0x11, 0xe0)) return 'ole';
  return '';
}
const KIND_TXT = { exe:'programa de Windows', msi:'instalador de Windows', dll:'librería de Windows', dmg:'imagen de disco de Mac', iso:'imagen de disco', deb:'paquete de Linux', rpm:'paquete de Linux', apk:'app de Android', ipa:'app de iPhone',
  sqlite:'base de datos SQLite', db:'base de datos', mdb:'base de datos de Access', accdb:'base de datos de Access', psd:'diseño de Photoshop', ai:'diseño de Illustrator', sketch:'diseño de Sketch', fig:'diseño de Figma', xd:'diseño de Adobe XD',
  rar:'archivo comprimido RAR', '7z':'archivo comprimido 7-Zip', bz2:'archivo comprimido', xz:'archivo comprimido', ttf:'fuente de letra', otf:'fuente de letra', woff:'fuente de letra', woff2:'fuente de letra',
  stl:'modelo 3D', obj:'modelo 3D', fbx:'modelo 3D', glb:'modelo 3D', gltf:'modelo 3D', blend:'proyecto de Blender', dwg:'plano de AutoCAD', dxf:'plano de AutoCAD', kml:'mapa', gpx:'ruta GPS', eml:'correo', msg:'correo de Outlook', ics:'evento de calendario', vcf:'contacto' };
function kindTxt(name, type, magic){
  const e = extOf(name);
  return KIND_TXT[e] || (magic === 'ole' ? 'documento viejo de Office' : type ? type : e ? 'archivo .' + e : 'archivo sin extensión');
}
function fichaTxt(file, extra){
  return '[Archivo adjunto: ' + (file.name || 'archivo') + ' · ' + kindTxt(file.name, file.type) + ' · ' + sizeTxt(file.size || 0) + (file.lastModified ? ' · modificado el ' + new Date(file.lastModified).toISOString().slice(0, 10) : '') + ']' + (extra ? '\n' + extra : '');
}
/* ¿es texto? Mira los primeros bytes: sin ceros y con pocos caracteres de control → texto (UTF-8, UTF-16 o Windows-1252) */
async function sniffText(blob, max = 1.2 * MB){
  const buf = new Uint8Array(await blob.slice(0, max).arrayBuffer()); if (!buf.length) return '';
  if (buf[0] === 0xff && buf[1] === 0xfe) return new TextDecoder('utf-16le').decode(buf.subarray(2));
  if (buf[0] === 0xfe && buf[1] === 0xff) return new TextDecoder('utf-16be').decode(buf.subarray(2));
  const n = Math.min(buf.length, 8192); let bad = 0;
  for (let i = 0; i < n; i++){ const b = buf[i]; if (b === 0) return null; if (b < 9 || (b > 13 && b < 32 && b !== 27)) bad++; }
  if (bad > n * .01) return null;
  let t = new TextDecoder('utf-8').decode(buf), rep = (t.match(/�/g) || []).length;
  if (rep > t.length * .002 + 2){ try{ t = new TextDecoder('windows-1252').decode(buf); }catch(e){} }
  if (blob.size > max) t += '\n…(archivo recortado: solo se lee el comienzo)';
  return t;
}
/* rescatar el texto legible de un archivo binario (como el comando «strings»): sirve para .doc/.xls/.ppt viejos, programas, bases de datos… */
async function binStrings(blob, min = 5){
  const u = new Uint8Array(await blob.slice(0, 12 * MB).arrayBuffer()), out = [], seen = new Set(), td = new TextDecoder('utf-8'), tw = new TextDecoder('windows-1252');
  let len = 0;
  const push = s => { s = s.replace(/\s+/g, ' ').trim(); if (s.length >= min && /\p{L}{3}/u.test(s) && (s.match(/[\p{L}\d\s.,;:!?¿¡()'"-]/gu) || []).length > s.length * .8 && !seen.has(s)){ seen.add(s); out.push(s); len += s.length + 1; } };
  /* primero el texto en UTF-16 (así guardan Word, Excel y PowerPoint viejos lo que escribiste): letra, 0, letra, 0… */
  for (const o of [0, 1]){
    let w = '';
    for (let i = o; i + 1 < u.length && len < CAP / 2; i += 2){
      const c = u[i] | (u[i + 1] << 8);
      if ((c >= 32 && c < 0x2000) || c === 9 || c === 10 || c === 13) w += String.fromCharCode(c);
      else { if (w.length >= min) push(w); w = ''; }
    }
    if (w.length >= min) push(w);
  }
  let a = -1;
  const ok = b => (b >= 32 && b < 127) || b === 9 || b >= 0xa0;
  for (let i = 0; i <= u.length && len < CAP; i++){
    if (i < u.length && ok(u[i])){ if (a < 0) a = i; continue; }
    if (a >= 0 && i - a >= min){ const sl = u.subarray(a, i), t = td.decode(sl); push(/�/.test(t) ? tw.decode(sl) : t); }
    a = -1;
  }
  return out.join('\n');
}
/* RTF → texto: fuera las palabras de control, los grupos ocultos y las llaves; acentos con \'e1 y \u225 */
function rtfTxt(r){
  let t = r.replace(/\{\\\*[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '').replace(/\{\\(fonttbl|colortbl|stylesheet|info|pict|header|footer)[\s\S]*?\}\s*\}/g, '');
  t = t.replace(/\\par[d]?\b ?|\\line\b ?|\\row\b ?/g, '\n').replace(/\\tab\b ?|\\cell\b ?/g, '\t');
  t = t.replace(/\\'([0-9a-f]{2})/gi, (_, h) => new TextDecoder('windows-1252').decode(new Uint8Array([parseInt(h, 16)])));
  t = t.replace(/\\u(-?\d+)\??/g, (_, d) => String.fromCharCode(d < 0 ? +d + 65536 : +d));
  t = t.replace(/\\[a-z]+-?\d* ?/gi, '').replace(/\\([{}\\])/g, '$1').replace(/[{}]/g, '');
  return t.replace(/\n{3,}/g, '\n\n').trim();
}
const htmlTxt = h => xmlTxt(String(h).replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h\d|li|tr|section|article)>/gi, '\n').replace(/&nbsp;/g, ' ')).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
/* bytes descomprimidos con un tope (un .gz de 20 KB puede esconder 2 GB) */
async function inflate(stream, max = 40 * MB){
  const rd = stream.getReader(), parts = []; let n = 0;
  try{ for (;;){ const { done, value } = await rd.read(); if (done) break; parts.push(value); n += value.length; if (n >= max){ rd.cancel().catch(() => {}); break; } } }catch(e){ if (!n) throw e; }
  return new Blob(parts);
}
async function readEpub(file){
  const z = await zipOpen(file); let order = [];
  try{
    const root = (/full-path="([^"]+)"/.exec(await z.read('META-INF/container.xml')) || [])[1];
    if (root){
      const opf = await z.read(root), dir = root.includes('/') ? root.replace(/[^/]+$/, '') : '', man = {};
      for (const m of opf.matchAll(/<item\b[^>]*>/g)){ const id = (/\bid="([^"]+)"/.exec(m[0]) || [])[1], hr = (/\bhref="([^"]+)"/.exec(m[0]) || [])[1]; if (id && hr) man[id] = dir + decodeURIComponent(hr); }
      order = [...opf.matchAll(/<itemref\b[^>]*idref="([^"]+)"/g)].map(m => man[m[1]]).filter(Boolean);
    }
  }catch(e){}
  if (!order.length) order = z.names.filter(n => /\.x?html?$/i.test(n)).sort();
  let t = '';
  for (const n of order){ if (t.length >= CAP) break; try{ const x = htmlTxt(await z.read(n)); if (x) t += x + '\n\n'; }catch(e){} }
  return t.trim();
}
/* dentro de un .zip/.tar: cada archivo se lee con las mismas reglas (hasta 30, y sin pasarse del tope de texto) */
async function readInner(blob, name, depth){
  const e = extOf(name);
  if (/\.pdf$/i.test(name)){ const p = await readPdf(blob); return typeof p === 'string' ? p : '(PDF escaneado de ' + p.pages + ' páginas: adjúntalo solo para verlo)'; }
  if (OFFX.test(name)) return readOffice(new File([blob], name.split('/').pop()));
  if (/\.epub$/i.test(name)) return readEpub(blob);
  if (/\.rtf$/i.test(name)) return rtfTxt(await blob.text());
  if (/\.x?html?$/i.test(name)) return htmlTxt(await sniffText(blob) || '');
  if (depth < 2 && (ZIPX.test(name) || /\.(tar|tgz|gz)$/i.test(name))) return (await readArchive(blob, name, depth + 1)).text;
  if (IMGX.test(name) || AUDX.test(name) || VIDX.test(name)) return null;   /* fotos, audio y video de adentro: se nombran en la lista */
  const t = await sniffText(blob, 400000);
  if (t != null) return t;
  if (OLDX.test(name) || e === 'sqlite' || e === 'db'){ const s = await binStrings(blob); return s || null; }
  return null;
}
async function readArchive(file, name, depth = 0){
  let list = [], get;
  if (/\.(tgz|gz)$/i.test(name) || magicOf(new Uint8Array(await file.slice(0, 4).arrayBuffer())) === 'gz'){
    if (typeof DecompressionStream === 'undefined') throw new Error('gz');
    const inner = await inflate(file.stream().pipeThrough(new DecompressionStream('gzip'))), iname = /\.tgz$/i.test(name) ? name.replace(/\.tgz$/i, '.tar') : name.replace(/\.gz$/i, '') || 'archivo';
    if (/\.tar$/i.test(iname) || magicOf(new Uint8Array(await inner.slice(0, 264).arrayBuffer())) === 'tar') return readArchive(inner, iname, depth);
    const t = await readInner(inner, iname, depth);
    return { text:'--- ' + iname + ' (' + sizeTxt(inner.size) + ' descomprimido) ---\n' + (t || '(sin texto legible)'), count:1 };
  }
  if (/\.tar$/i.test(name) || magicOf(new Uint8Array(await file.slice(0, 264).arrayBuffer())) === 'tar'){
    const td = new TextDecoder(), ents = {};
    for (let p = 0, k = 0; p + 512 <= file.size && k < 2000; k++){
      const h = new Uint8Array(await file.slice(p, p + 512).arrayBuffer()); if (!h[0]) break;
      const cut = (a, b) => td.decode(h.subarray(a, b)).replace(/\0[\s\S]*$/, ''), sz = parseInt(cut(124, 136).trim(), 8) || 0, ty = String.fromCharCode(h[156] || 48), pre = cut(345, 500);
      const nm = (pre ? pre + '/' : '') + cut(0, 100);
      if (ty === '0' || ty === '\0' || ty === '7') ents[nm] = { at:p + 512, size:sz };
      p += 512 + Math.ceil(sz / 512) * 512;
    }
    list = Object.keys(ents).map(n => ({ name:n, size:ents[n].size }));
    get = n => Promise.resolve(file.slice(ents[n].at, ents[n].at + ents[n].size));
  } else {
    const z = await zipOpen(file);
    list = z.names.filter(n => !/\/$/.test(n)).map(n => ({ name:n, size:z.size(n), locked:z.locked(n) }));
    get = n => z.blob(n);
  }
  const shown = list.filter(x => !/(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db)/.test(x.name));
  let t = 'Contiene ' + shown.length + (shown.length === 1 ? ' archivo' : ' archivos') + ':\n' + shown.slice(0, 200).map(x => '· ' + x.name + ' (' + sizeTxt(x.size) + ')' + (x.locked ? ' · con contraseña' : '')).join('\n') + (shown.length > 200 ? '\n· …y ' + (shown.length - 200) + ' más' : '');
  let n = 0;
  for (const x of shown){
    if (n >= 30 || t.length >= CAP) break;
    if (x.locked || !x.size || x.size > 60 * MB) continue;
    try{ const c = await readInner(await get(x.name), x.name, depth); if (c && c.trim()){ t += '\n\n--- ' + x.name + ' ---\n' + c.trim().slice(0, Math.max(2000, CAP - t.length)); n++; } }catch(e){}
  }
  return { text:t, count:shown.length };
}
/* ---------- fotos: HEIC del iPhone con heic2any (cdnjs, solo si hace falta) ---------- */
let heicP, tiffP;
/* TIFF: Chrome y Firefox no lo abren; UTIF.js (MIT, en /lib, sin internet extra) lo pasa a una foto normal */
function loadTiff(){
  return tiffP || (tiffP = new Promise((ok, no) => { const s = document.createElement('script'); s.src = '/lib/utif.min.js'; s.onload = () => window.UTIF ? ok(window.UTIF) : no(new Error('tiff')); s.onerror = () => { tiffP = null; no(new Error('tiff')); }; document.head.appendChild(s); }));
}
async function tiffToPng(file){
  const U = await loadTiff(), buf = await file.arrayBuffer(), ifds = U.decode(buf); if (!ifds.length) throw new Error('tiff');
  U.decodeImage(buf, ifds[0]); const rgba = U.toRGBA8(ifds[0]), w = ifds[0].width, h = ifds[0].height;
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer, 0, w * h * 4), w, h), 0, 0);
  return new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(new Error('tiff')), 'image/png'));
}
function loadHeic(){
  return heicP || (heicP = new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.4/heic2any.min.js'; s.onload = () => window.heic2any ? ok(window.heic2any) : no(new Error('heic')); s.onerror = () => { heicP = null; no(new Error('heic')); }; document.head.appendChild(s); }));
}
async function readAnyImg(file){
  try{ return await readImg(file); }
  catch(e){
    const mg = magicOf(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
    if (/\.tiff?$/i.test(file.name) || /tiff/.test(file.type) || (mg === 'img' && /^(II\*|MM\0\*)/.test(String.fromCharCode(...new Uint8Array(await file.slice(0, 4).arrayBuffer()))))) return readImg(await tiffToPng(file));
    if (!/\.(heic|heif)$/i.test(file.name) && !/hei[cf]/.test(file.type) && magicOf(new Uint8Array(await file.slice(0, 16).arrayBuffer())) !== 'img') throw e;
    const conv = await (await loadHeic())({ blob:file, toType:'image/jpeg', quality:.85 });
    return readImg(Array.isArray(conv) ? conv[0] : conv);
  }
}
/* ---------- audio y video ---------- */
const STT_SEC = 60, STT_MAX = 20;   /* trozos de 1 minuto (≈1,9 MB cada uno); hasta 20 minutos por archivo */
function wavOf(pcm, rate){
  const b = new ArrayBuffer(44 + pcm.length * 2), v = new DataView(b), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++){ const s = Math.max(-1, Math.min(1, pcm[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  return new Uint8Array(b);
}
function b64(u){ let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
const clock = s => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
async function decodePcm(file){
  /* archivos enormes: se decodifica el comienzo (en mp3/webm funciona aunque se corte) */
  const big = file.size > 120 * MB, src = big ? file.slice(0, 120 * MB) : file;
  const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!AC) throw new Error('audio');
  const ac = new AC(1, 16000, 16000), buf = await ac.decodeAudioData(await src.arrayBuffer());
  const ch = buf.numberOfChannels, n = buf.length, pcm = new Float32Array(n);
  for (let c = 0; c < ch; c++){ const d = buf.getChannelData(c); for (let i = 0; i < n; i++) pcm[i] += d[i] / ch; }
  return { pcm, rate:buf.sampleRate, dur:buf.duration, big };
}
async function sttChunk(pcm, rate, i){
  const part = pcm.subarray(i * STT_SEC * rate, (i + 1) * STT_SEC * rate);
  let e = 0; for (let k = 0; k < part.length; k += 16) e += part[k] * part[k];
  if (Math.sqrt(e / Math.max(1, part.length / 16)) < .004) return '';   /* silencio: no se manda */
  const r = await fetch('/api/ai', { method:'POST', headers:SZ.szHeaders(), body:JSON.stringify({ action:'transcribe', audio:b64(wavOf(part, rate)), lang:SZ.lang() === 'en' ? 'en' : '' }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'stt'), { status:r.status });
  return String(j.text || '').trim();
}
async function transcribe(file, f){
  const { pcm, rate, dur, big } = await decodePcm(file), n = Math.min(STT_MAX, Math.ceil(dur / STT_SEC)), out = new Array(n).fill(null);
  let next = 0, fails = 0, stop = null;
  f.prog = SZ.lang() === 'en' ? 'Transcribing…' : 'Pasando a texto…'; renderTray();
  const worker = async () => {
    while (next < n && !stop && files.includes(f)){
      const i = next++;
      try{ out[i] = await sttChunk(pcm, rate, i); }
      catch(e){ fails++; if (e.status === 429 || e.status === 401 || e.status === 503 || fails > 2) stop = e; }
      f.prog = (SZ.lang() === 'en' ? 'Transcribing ' : 'Pasando a texto ') + Math.min(n, out.filter(x => x != null).length) + '/' + n; renderTray();
    }
  };
  await Promise.all([worker(), worker()]);
  delete f.prog;
  const got = out.map((t, i) => t ? '[' + clock(i * STT_SEC) + '] ' + t : '').filter(Boolean).join('\n');
  const done = out.filter(x => x != null).length;
  return { dur, got, done, n, big, stopped:!!stop, more:dur > STT_MAX * STT_SEC };
}
function videoFrames(file){
  return new Promise(ok => {
    const url = URL.createObjectURL(file), v = document.createElement('video'), pics = [];
    let i = 0, stamps = [], meta = null, quit = setTimeout(() => end(), 20000);
    const end = () => { clearTimeout(quit); v.removeAttribute('src'); try{ v.load(); }catch(e){} URL.revokeObjectURL(url); ok({ pics, meta }); };
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.onloadedmetadata = () => { meta = { dur:v.duration, w:v.videoWidth, h:v.videoHeight }; if (!v.videoWidth || !isFinite(v.duration)) return end(); stamps = [.1, .5, .9].map(p => Math.max(0, Math.min(v.duration - .05, v.duration * p))); v.currentTime = stamps[0]; };
    v.onseeked = () => {
      try{ const s = Math.min(1, 960 / Math.max(v.videoWidth, v.videoHeight)), c = document.createElement('canvas'); c.width = Math.round(v.videoWidth * s); c.height = Math.round(v.videoHeight * s); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); pics.push(c.toDataURL('image/jpeg', .78)); }catch(e){}
      if (++i < stamps.length) v.currentTime = stamps[i]; else end();
    };
    v.onerror = () => end();
    v.src = url;
  });
}
async function readMedia(file, f, isVideo){
  const parts = [];
  if (isVideo){
    const fr = await videoFrames(file).catch(() => ({ pics:[], meta:null }));
    if (fr.pics.length){ f.kind = 'img'; f.dataUrls = fr.pics; f.dataUrl = fr.pics[0]; f.thumb = fr.pics[0]; f.frames = fr.pics.length; }
    if (fr.meta && fr.meta.w) parts.push('Video de ' + clock(fr.meta.dur) + ', ' + fr.meta.w + '×' + fr.meta.h + ' px.' + (fr.pics.length ? ' Van ' + fr.pics.length + ' fotos sacadas del video (al comienzo, a la mitad y al final).' : ''));
  }
  let tr = null;
  try{ tr = await transcribe(file, f); }catch(e){ delete f.prog; }
  if (tr){
    if (!isVideo) parts.push('Audio de ' + clock(tr.dur) + '.');
    if (tr.got) parts.push('Lo que se dice' + (tr.done < tr.n || tr.more ? ' (transcrito hasta el minuto ' + Math.round(tr.done * STT_SEC / 60) + ')' : '') + ':\n' + tr.got);
    else if (tr.done) parts.push('No se escucha voz: es música, ruido o silencio.');
    else parts.push('No se pudo pasar el audio a texto ahora (límite de hoy o sin conexión). Pídele a la persona que diga qué hay en el audio si lo necesitas.');
  } else parts.push((isVideo ? 'El sonido del video' : 'Este audio') + ' no se pudo abrir en el navegador.' + (isVideo ? '' : ' Formato: ' + (file.type || extOf(file.name))));
  return parts.join('\n');
}
/* ---------- el lector de todo ---------- */
async function readAny(file, f, o = {}){
  const name = file.name || 'archivo', type = String(file.type || '').toLowerCase();
  const head = new Uint8Array(await file.slice(0, 264).arrayBuffer().catch(() => new ArrayBuffer(0))), magic = magicOf(head);
  const tryIt = async fn => { try{ return await fn(); }catch(e){ return null; } };
  let t = null;
  if (!file.size){ f.text = fichaTxt(file, 'El archivo está vacío (0 bytes).'); return; }
  /* fotos */
  if (!o.textOnly && (/^image\//.test(type) && !/svg/.test(type) || IMGX.test(name) || (magic === 'img' && !TEXTX.test(name)))){
    const r = await tryIt(() => readAnyImg(file));
    if (r){ f.kind = 'img'; Object.assign(f, r); return; }
    /* foto que el navegador no abre: se manda su ficha (y si es TIFF/BMP raros, el texto que tenga) */
    f.kind = 'text'; f.text = fichaTxt(file, 'Es una imagen que este navegador no puede mostrar.'); return;
  }
  /* PDF: con texto → texto; escaneado → fotos de sus páginas; con contraseña → la pide; dañado → el texto que se rescate */
  if (/\.pdf$/i.test(name) || type === 'application/pdf' || magic === 'pdf'){
    f.kind = 'pdf';
    const p = await tryIt(() => readPdf(file));
    if (p && p.scanned){ if (o.textOnly){ f.text = fichaTxt(file, 'PDF escaneado de ' + p.pages + ' páginas (sin texto que copiar).'); return; } f.kind = 'img'; f.dataUrl = p.pics[0]; f.dataUrls = p.pics; f.thumb = p.pics[0]; f.scan = p.pages; return; }
    if (p){ f.text = p; return; }
    t = await tryIt(() => binStrings(file, 4));
    f.text = fichaTxt(file, t && t.length > 40 ? 'El PDF venía dañado; esto es lo que se pudo rescatar:\n' + clip(t) : 'El PDF está dañado o protegido y no se pudo abrir.'); return;
  }
  if (OFFX.test(name)){ f.kind = 'doc'; t = await tryIt(() => readOffice(file)); if (t){ f.text = t; return; } }
  if (/\.epub$/i.test(name)){ f.kind = 'doc'; t = await tryIt(() => readEpub(file)); if (t){ f.text = clip(t); return; } }
  if (/\.rtf$/i.test(name) || magic === 'rtf'){ f.kind = 'doc'; t = await tryIt(async () => rtfTxt(await sniffText(file, 8 * MB) || '')); if (t){ f.text = clip(t); return; } }
  /* audio y video */
  if (!o.textOnly && magic !== 'text' && (/^(audio|video)\//.test(type) || AUDX.test(name) || VIDX.test(name) || (magic === 'av' && !TEXTX.test(name)))){
    const isV = /^video\//.test(type) || VIDX.test(name);
    f.kind = 'media'; f.text = fichaTxt(file, await readMedia(file, f, isV).catch(() => '')); return;
  }
  /* comprimidos */
  if (ZIPX.test(name) || /\.(tar|tgz|gz)$/i.test(name) || /zip|x-tar|gzip/.test(type) || magic === 'zip' || magic === 'gz' || magic === 'tar'){
    f.kind = 'zip';
    const r = await tryIt(() => readArchive(file, name));
    if (r){ f.text = fichaTxt(file, clip(r.text)); return; }
  }
  /* código y cualquier texto (también sin extensión o con una que no conocemos) */
  if (magic !== 'ole' && !OLDX.test(name)){
    t = await tryIt(() => sniffText(file));
    if (t != null){ f.kind = 'text'; f.text = clip(/\.x?html?$/i.test(name) && t.length > CAP ? htmlTxt(t) : t); return; }
  }
  /* .doc/.xls/.ppt viejos, programas, bases de datos, formatos raros: qué es + el texto que se pueda rescatar */
  f.kind = magic === 'ole' || OLDX.test(name) ? 'doc' : 'bin';
  t = await tryIt(() => binStrings(file));
  f.text = fichaTxt(file, t && t.length > 30 ? (f.kind === 'doc' ? 'Documento de Office viejo; este es su texto:\n' : 'Texto legible que trae adentro:\n') + clip(t) : 'Es un archivo binario sin texto legible: puedes hablar de qué es, pero no de su contenido.');
}
/* ---------- v2.0 · crear imágenes (Pollinations): solo con cuenta, con su propio límite diario ----------
   La imagen se guarda en este equipo (IndexedDB) para no llenar tu espacio en la nube; el chat guarda solo la referencia. */
const IMGK = 'imagen';
const IMG_RX = /^(?:por favor\s+)?(?:crea(?:me)?|haz(?:me)?|genera(?:me)?|dib[uú]ja(?:me)?|pinta(?:me)?|dise[ñn]a(?:me)?)\s+(?:una?\s+|el\s+|la\s+)?(?:imagen|foto|fotograf[ií]a|dibujo|ilustraci[oó]n|p[oó]ster|logo|fondo de pantalla)\b/i;
let imgMode = false;
const imgDB = (() => {
  let p = null;
  const open = () => p || (p = new Promise((ok, no) => { try{ const r = indexedDB.open('synthz-img', 1); r.onupgradeneeded = () => r.result.createObjectStore('img'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }catch(e){ no(e); } }));
  const tx = async (mode, fn) => { const db = await open(); return new Promise((ok, no) => { const t = db.transaction('img', mode), s = t.objectStore('img'), r = fn(s); t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error); }); };
  return { put:(id, blob) => tx('readwrite', s => s.put(blob, id)), get:id => tx('readonly', s => s.get(id)) };
})();
/* botón «Crear imagen» junto al clip */
/* v3.7 · en la versión React el botón ya viene en CajaEscribir.jsx; aquí solo si falta */
const imgBtn = $('#imgBtn') || document.createElement('button');
if (!imgBtn.isConnected){ imgBtn.type = 'button'; imgBtn.className = 'attach imgb'; imgBtn.id = 'imgBtn'; imgBtn.setAttribute('aria-pressed', 'false'); imgBtn.setAttribute('aria-label', 'Crear una imagen'); imgBtn.dataset.tip = 'Crear una imagen';
imgBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 9"/></svg>';
{ const ab = $('#attachBtn'); if (ab) ab.after(imgBtn); } }
function setImgMode(on){
  if (on && !SZ.ACC.ready){ toast('Para crear imágenes entra a tu cuenta (es gratis).'); SZ.guestGate({ mode:'signup' }); return; }
  imgMode = !!on; imgBtn.setAttribute('aria-pressed', String(imgMode)); document.body.classList.toggle('imaging', imgMode);
  inp.placeholder = imgMode ? 'Describe la imagen que quieres crear…' : (agentOn() ? 'Apex: cuéntame qué necesitas…' : 'Escribe tu mensaje…');
  if (imgMode){ const q = SZ.SZQ.img; toast('Crear imagen: describe lo que quieres ver.' + (q && q.max ? ' Hoy te quedan ' + Math.max(0, q.max - q.used) + '.' : '')); inp.focus(); }
}
imgBtn.addEventListener('click', () => setImgMode(!imgMode));
/* pasa una imagen a JPEG liviano (máx. 1024 px) */
async function toJpeg(dataUrl){
  const im = new Image(); im.src = dataUrl; await im.decode();
  const k = Math.min(1, 1024 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
  c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
  c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  return new Promise(ok => c.toBlob(b => ok(b), 'image/jpeg', .86));
}
function imgWorkEl(){
  const el = document.createElement('div'); el.className = 'm bot brand think-wrap imgwork';
  el.innerHTML = '<div class="who"><b>Creador de imágenes</b></div><div class="work"><div class="wk-row"><span class="pxw">' + SZ.pixelGrid() + '</span><span class="wk-t"><b class="wk-w">Creando tu imagen</b><small class="wk-s">puede tardar unos segundos</small></span></div></div>';
  el._t0 = performance.now();
  /* v4.5 · con SynthFlow en React, mientras se crea la imagen sale el anillo de luz con una frase al azar en las letras («Generating», dexter-st) */
  const fx = document.createElement('div'); fx.className = 'fxhost';
  if (window.SZFx && window.SZFx.mount(fx, 'imagen', { lang:SZ.lang(), tam:170 })){ el.innerHTML = '<div class="who"><b>Creador de imágenes</b></div>'; el.appendChild(fx); el.classList.add('fxi'); el._fx = fx; el._px = { stop(){} }; return el; }
  el._px = SZ.pixelRun($('.pxw', el)); return el;
}
async function createImage(prompt){
  if (!SZ.ACC.ready){ toast('Para crear imágenes entra a tu cuenta (es gratis).'); SZ.guestGate({ mode:'signup' }); return; }
  if (Object.keys(busy).length) return toast('Espera a que termine la respuesta anterior.');
  const chat = chatArr(), g0 = gen;
  chat.push({ role:'user', content:prompt, imgReq:true }); touchThread(); save();
  inp.value = ''; autoGrow(); updateHint(); renderMsgs();
  const w = imgWorkEl(); lane.appendChild(w); jump(); busy[IMGK] = 'write';
  try{
    const r = await fetch('/api/ai', { method:'POST', headers:SZ.szHeaders(), body:JSON.stringify({ action:'image', prompt }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.img) throw Object.assign(new Error(d.error || 'No pude crear la imagen. Intenta en un rato.'), { code:d.code, status:r.status });
    const blob = await toJpeg(d.img), id = 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await imgDB.put(id, blob);
    if (SZ.SZQ.img) SZ.SZQ.img.used = (SZ.SZQ.img.max || 0) - (d.left || 0);
    chat.push({ role:'assistant', model:IMGK, content:'Imagen creada: «' + prompt.slice(0, 300) + '»', imgId:id, meta:'creada en ' + ((performance.now() - w._t0) / 1000 || 0).toFixed(0) + ' s · te quedan ' + (d.left || 0) + ' hoy' });
    touchThread(); save();
    try{ SZ.BOT.react && SZ.BOT.react('done', { cool:120000 }); }catch(e){}
  }catch(err){
    chat.pop(); save();
    if (g0 === gen){ renderMsgs(); showErr(Object.assign(err, { limit:/img_limit|img_login/.test(err.code || '') })); inp.value = prompt; autoGrow(); }
  }finally{ delete busy[IMGK]; try{ w._px.stop(); }catch(e){} w.remove(); if (g0 === gen) renderMsgs(); renderNow(); }
}
/* en el chat: la imagen con «Descargar» */
function imgFill(body, m){
  body.innerHTML = '<figure class="szimg"><div class="szimg-f"><span class="pxw">' + SZ.pixelGrid() + '</span></div><figcaption></figcaption><div class="szimg-b"><button type="button" class="cnv-b" data-imgdl>' + CNV_ICO.down + '<span>Descargar</span></button><button type="button" class="cnv-b" data-imgbig>' + CNV_ICO.eye + '<span>Ver en grande</span></button></div></figure>';
  $('figcaption', body).textContent = m.content.replace(/^Imagen creada: «|»$/g, '');
  const f = $('.szimg-f', body);
  imgDB.get(m.imgId).then(blob => {
    if (!blob){ f.innerHTML = '<p class="szimg-no">Esta imagen quedó guardada en el equipo donde la creaste.</p>'; $('.szimg-b', body).hidden = true; return; }
    const u = URL.createObjectURL(blob), im = document.createElement('img'); im.alt = m.content; im.src = u; f.innerHTML = ''; f.appendChild(im); body._imgUrl = u;
  }).catch(() => { f.innerHTML = '<p class="szimg-no">No pude abrir la imagen.</p>'; });
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-imgdl], [data-imgbig]'); if (!b) return;
  const body = b.closest('.body'), u = body && body._imgUrl; if (!u) return;
  if (b.hasAttribute('data-imgdl')){ const a = document.createElement('a'); a.href = u; a.download = 'synthz-imagen.jpg'; document.body.appendChild(a); a.click(); a.remove(); toast('Descargué tu imagen.'); }
  else { const o = document.createElement('div'); o.className = 'szm imgbig'; o.innerHTML = '<img alt="">'; $('img', o).src = u; document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on')); o.addEventListener('click', () => { o.classList.remove('on'); setTimeout(() => o.remove(), 300); }); }
});
/* ---------- v2.0 · voz: cada familia de IA habla con su propia voz (GPT una, Mistral otra, Gemini otra…) ----------
   Usa la voz que ya trae tu navegador o tu celular: gratis y sin enviar nada a internet. */
const VOZ_FAM = {
  openai:[1.0, 1.02], gemini:[1.18, 1.05], gemma:[1.28, 1.08], google:[1.18, 1.05], anthropic:[.9, .96], claude:[.9, .96], meta:[.82, 1.0], llama:[.82, 1.0],
  mistral:[1.32, 1.1], mistralai:[1.32, 1.1], deepseek:[.74, .94], qwen:[1.4, 1.12], xai:[.66, 1.04], grok:[.66, 1.04], moonshot:[1.08, .92], kimi:[1.08, .92],
  microsoft:[.96, 1.06], nvidia:[.88, 1.02], cohere:[1.12, .98], synthz:[1.06, 1.0], imagen:[1.06, 1.0]
};
const famOfEl = el => String((el && el.dataset.brand) || 'synthz').toLowerCase();
let vozCur = null;
function vocesEs(){ const V = (window.speechSynthesis && speechSynthesis.getVoices()) || []; const es = V.filter(v => /^es/i.test(v.lang)); return es.length ? es : V; }
/* a cada familia le toca siempre la misma voz (si tu equipo tiene varias en español) y su propio tono y velocidad */
function vozDe(fam){
  const V = vocesEs(), keys = Object.keys(VOZ_FAM), i = Math.max(0, keys.indexOf(fam));
  const [pitch, rate] = VOZ_FAM[fam] || [1, 1];
  return { voice:V.length ? V[i % V.length] : null, pitch, rate };
}
const textoParaLeer = el => { const b = $('.body', el); if (!b) return ''; const c = b.cloneNode(true); $$('pre, .fcard, .cnv, .szimg, .katex-mathml, math', c).forEach(x => x.replaceWith(document.createTextNode(' (aquí hay un código o un archivo) '))); return c.textContent.replace(/\s+/g, ' ').trim().slice(0, 4000); };
function vozParar(){ try{ speechSynthesis.cancel(); }catch(e){} if (vozCur){ vozCur.classList.remove('on'); const s = $('span', vozCur); if (s) s.textContent = 'Escuchar'; vozCur = null; } }
function vozLeer(btn){
  if (!('speechSynthesis' in window)){ toast('Tu navegador no tiene voz. Prueba con Chrome, Edge o Safari.'); return; }
  if (vozCur === btn){ vozParar(); return; }
  vozParar();
  const el = btn.closest('.m.bot'), txt = textoParaLeer(el); if (!txt) return;
  const fam = famOfEl(el), V = vozDe(fam);
  /* se lee por frases (así no se corta en textos largos) */
  const parts = txt.match(/[^.!?¡¿\n]{1,220}[.!?]*|.+$/g) || [txt];
  vozCur = btn; btn.classList.add('on'); const s = $('span', btn); if (s) s.textContent = 'Detener';
  parts.forEach((t, i) => { const u = new SpeechSynthesisUtterance(t.trim()); if (V.voice) u.voice = V.voice; u.lang = (V.voice && V.voice.lang) || 'es-ES'; u.pitch = V.pitch; u.rate = V.rate; if (i === parts.length - 1) u.onend = () => { if (vozCur === btn) vozParar(); }; u.onerror = () => { if (vozCur === btn) vozParar(); }; speechSynthesis.speak(u); });
}
if ('speechSynthesis' in window){ try{ speechSynthesis.getVoices(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', () => {}); }catch(e){} }
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-a="voice"]'); if (b){ e.stopPropagation(); vozLeer(b); } }, true);
addEventListener('pagehide', vozParar);
/* ---------- v2.1 · «Buscar en internet»: la IA responde con información de hoy y te muestra sus fuentes ----------
   Se activa con el botón del globo, sola cuando la pregunta lo pide (hoy, precio, noticias…) o cuando el agente lo decide. */
/* v4.2 · REGLA FIJA (pedido de Sammuel, 3 nov: «las IAs buscan porque sí y porque no, ESO NO PUEDE PASAR»).
   Ya no decide la IA ni el azar: la misma pregunta da SIEMPRE la misma decisión, con cualquier IA, en Comparar y en Quoryn
   · Se busca: si lo pides («busca en internet», «con fuentes», «investiga»), o si preguntas algo que cambia con el tiempo
     (noticias, precios, cotizaciones, clima, resultados, horarios, «hoy», «esta semana», lo más reciente…).
   · No se busca: charla, opinión, código, tareas, explicaciones generales, escribir o crear algo.
   · Tú mandas: en «+» puedes forzar «Buscar en internet» o «No buscar» para el próximo mensaje, y en Ajustes apagar la búsqueda sola.
   La misma regla está en api/_web-regla.js (servidor, Quoryn); t/web/regla.test.mjs revisa que las dos digan lo mismo. */
function webRule(text){
  let s = String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/```/.test(s) || (s.split('\n').filter(l => /[;{}]\s*$|^\s*(def|function|const|let|var|import|class|return|if|for|while|<\w+)/.test(l)).length >= 3)) return { go:false, why:'codigo' };
  /* frases que nombran la conversación o saludan no cuentan («tu última respuesta», «¿cómo estás hoy?») */
  s = s.replace(/\b(tu|la|el|lo|mi|su) (ultim[oa]|anterior) (respuesta|mensaje|parrafo|linea|punto|pregunta|version que (me )?diste)\b|\blo ultimo que (dijiste|escribiste)\b|\b(your|the|my) (last|latest|previous) (answer|message|reply|paragraph|line|point)\b/g, ' ')
       .replace(/\b(como|que tal) (estas|te va|andas|amaneciste|te sientes)\b[^?.!]*|\bhow (are|r) (you|u)\b[^?.!]*|\bhow('s| is) (your|it going)\b[^?.!]*/g, ' ');
  for (const [why, rx] of WEB_RULES) if (rx.test(s)) return { go:true, why };
  return { go:false, why:'general' };
}
const WEB_RULES = [
  ['pedido', /\b(busca(r|me|lo)?|buscame|investiga(r|me)?|averigua(r|me)?)\b[^.?!]{0,40}\b(en )?(internet|google|la web|linea|online)\b|\b(investiga|averigua)\b|\bcon (sus )?fuentes\b|\b(dame|pasame|necesito|quiero) (las )?(fuentes|links?|enlaces?)\b|\b(pagina|sitio|web) oficial\b|\bsegun internet\b|\b(search|look up|google)\b[^.?!]{0,30}\b(web|online|internet|it)\b|\bwith sources\b|\b(find|give) me (the )?(sources|links)\b|\bofficial (site|website|page)\b/],
  ['hoy', /\b(noticias?|titulares|ultima hora|que (paso|esta pasando|ha pasado)|hoy en dia no|hoy|ayer|esta semana|este mes|este ano|ahora mismo|en este momento|actualmente|en vivo|news|headlines|breaking|what('s| is) happening|today|yesterday|this (week|month|year)|right now|currently|live)\b/],
  ['reciente', /\b(lo mas (nuevo|reciente)|mas recientes?|recientes?|ultim[oa]s? (version|versiones|modelo|modelos|actualizacion|novedades?|lanzamientos?|estrenos?|episodios?|temporadas?)|novedades|estrenos?|latest|newest|most recent|recent(ly)?|new release)\b/],
  ['precio', /\b(precios?|cuanto (cuesta|vale|sale|cobra)|cotizacion|tipo de cambio|a como (esta|va)|dolar|dolares|euros?|bitcoin|criptos?|acciones de|bolsa de valores|tarifa|prices?|how much (is|does|do|are)|cost of|exchange rate|stock price|crypto)\b/],
  ['evento', /\b(clima|pronostico|temperatura (en|de hoy)|va a llover|quien gano|ganador(es)? de|resultados? (del|de la|de los|de las) (partido|juego|elecciones?|sorteo|loteria|carrera|final|mundial)|marcador|tabla de posiciones|elecciones|weather|forecast|who won|winner of|score of|standings|election results?)\b/],
  ['lugar', /\b(horarios? de|a que hora (abre|cierra)|esta abierto|direccion de|telefono de|donde queda|como llego a|opening hours|is it open|address of|phone number of|how do i get to)\b/]
];
let webMode = 'auto';   /* 'auto' (sigue la regla) · 'on' (busca sí o sí) · 'off' (no busca); vale para el próximo mensaje */
const webBtn = $('#webBtn') || document.createElement('button');
if (!webBtn.isConnected){ webBtn.type = 'button'; webBtn.className = 'attach webb'; webBtn.id = 'webBtn'; webBtn.setAttribute('aria-pressed', 'false'); webBtn.setAttribute('aria-label', 'Buscar en internet'); webBtn.dataset.tip = 'Buscar en internet';
webBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3z"/></svg>';
{ const ib = $('#imgBtn') || $('#attachBtn'); if (ib) ib.after(webBtn); } }
function setWebMode(m, quiet){
  webMode = m === 'on' || m === 'off' ? m : 'auto';
  webBtn.setAttribute('aria-pressed', String(webMode === 'on')); document.body.classList.toggle('webbing', webMode === 'on'); document.body.classList.toggle('nowebbing', webMode === 'off');
  if (quiet) return;
  if (webMode === 'on') toast(SZ.lang() === 'en' ? 'Search the web: your next message is answered with today\'s information and its sources.' : 'Buscar en internet: tu próximo mensaje se responde con información de hoy y sus fuentes.');
  if (webMode === 'off') toast(SZ.lang() === 'en' ? 'No web search: your next message is answered only with what the AI knows.' : 'Sin internet: tu próximo mensaje se responde solo con lo que sabe la IA.');
}
function setWeb(on){ setWebMode(on ? 'on' : 'auto'); }
webBtn.addEventListener('click', () => { if (imgMode) setImgMode(false); setWebMode(webMode === 'on' ? 'auto' : 'on'); });
/* la decisión para un mensaje: qué se hace y por qué (se guarda en el mensaje para mostrarlo) */
function webDecide(text){
  if (webMode === 'on') return { go:true, why:'tu' };
  if (webMode === 'off') return { go:false, why:'apagado' };
  if (SZ.CFG.autoWeb === false) return { go:false, why:'ajustes' };
  return webRule(text);
}
const needsWeb = text => webDecide(text).go;
/* al enviar: se toma la decisión UNA vez, se anota en tu mensaje y lo que forzaste vuelve a «automático» */
function webTake(text){ const d = webDecide(text); if (webMode !== 'auto') setWebMode('auto', true); return d; }
/* v3.8 · la IA decide sola: si le falta un dato de hoy, en vez de inventar pide una búsqueda con [BUSCAR: …] y SynthFlow busca, lee y le vuelve a preguntar */
const webAskSys = () => 'Hoy es ' + new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) + '. Tienes una herramienta de búsqueda en internet. Si para responder bien necesitas información actual o que no conoces con certeza (noticias, precios, resultados, clima, versiones o lanzamientos recientes, personas, empresas o hechos posteriores a lo que aprendiste), NO inventes ni digas que no tienes internet: responde ÚNICAMENTE con una línea exacta así: [BUSCAR: consulta corta para un buscador, en el idioma de la persona] y nada más. Si no hace falta buscar, responde normal sin mencionar esta herramienta.';
const WEB_Q_RX = /^\s*\[(?:BUSCAR|SEARCH)\s*:\s*([^\]\n]{2,200})\]?/i;
const CUTOFF_RX = /(no tengo acceso a (internet|la web|informaci[oó]n (en tiempo real|actual(izada)?)|datos (en tiempo real|actuales))|no puedo (navegar|buscar en internet|acceder a internet|consultar internet)|mi (conocimiento|informaci[oó]n|entrenamiento) (llega|est[aá] actualizad[oa]|se actualiz[oó]|tiene fecha de corte) hasta|fecha de corte de mi|as of my (last )?(knowledge|training)|knowledge cut-?off|i (don'?t|do not|can'?t|cannot) (have )?(access|browse|search)( to)? (the )?(internet|real-time|current|web))/i;
/* mientras llega la respuesta: ¿empieza como «[BUSCAR…»? entonces no se muestra (se queda «pensando») */
const webMaybe = t => { t = String(t || '').replace(/^\s+/, ''); return !t || /^\[(?:B(?:U(?:S(?:C(?:A(?:R)?)?)?)?)?|S(?:E(?:A(?:R(?:C(?:H)?)?)?)?)?)?$/i.test(t) || /^\[(BUSCAR|SEARCH)\b/i.test(t); };
function webCard(){
  const el = document.createElement('div'); el.className = 'agrun webrun';
  el.innerHTML = '<div class="ag-h"><span class="pxw">' + SZ.pixelGrid() + '</span><span class="ag-t"><b>Buscando en internet</b><small>Leo varias páginas para responderte con datos de hoy…</small></span></div>';
  /* v3.8 · con SynthFlow en React la búsqueda se ve como un radar (#41) y, al llegar, las fuentes aparecen como chips
     v4.5 · mientras busca, el libro que hojea sus páginas (#10, lo pidió Sammuel «para cuando busque en la web»); al llegar las fuentes, el radar con sus chips */
  const fx = document.createElement('div'); fx.className = 'fxhost';
  if (window.SZFx && (window.SZFx.mount(fx, 'libro', { lang:SZ.lang() }) || window.SZFx.mount(fx, 'radar', { lang:SZ.lang(), modo:'web' }))){ el.innerHTML = ''; el.classList.add('fxr'); el.appendChild(fx); el._fx = fx; el._px = { stop(){} }; return el; }
  el._px = SZ.pixelRun($('.pxw', el)); return el;
}
async function webSearch(q){
  const r = await fetch('/api/ai', { method:'POST', headers:SZ.szHeaders(), body:JSON.stringify({ action:'search', q:q.slice(0, 300), lang:SZ.lang() === 'en' ? 'en' : 'es' }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || 'No pude buscar en internet ahora.'), { code:d.code, status:r.status });
  return d;
}
/* lo que le llega a la IA: tu mensaje + los resultados numerados (tú sigues viendo solo tu mensaje) */
function webAsk(text, R){
  const day = new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  /* v3.8 · además del resumen del buscador, va el texto que se leyó de las primeras páginas (cabe en ~9.000 letras) */
  return text + '\n\n---\nResultados de una búsqueda en internet hecha hoy, ' + day + (R.via === 'wikipedia' ? ' (en Wikipedia)' : R.via === 'noticias' ? ' (noticias)' : '') + '. Responde con estos datos, que son más nuevos que lo que sabes; cita cada dato con su número entre corchetes, por ejemplo [1]; si los resultados no lo dicen, dilo, y no inventes nada que no esté aquí:\n'
    + R.results.map((x, i) => '[' + (i + 1) + '] ' + x.t + ' — ' + x.u + '\n' + String(x.s || '').slice(0, 320) + (x.c ? '\nLo que dice la página:\n' + x.c.slice(0, 1900) : '')).join('\n\n');
}
/* busca antes de enviar; si falla, se envía igual (sin fuentes) */
async function webPrep(msg, text, why){
  const card = webCard(); lane.appendChild(card); jump();
  try{
    const R = await webSearch(text);
    if (R.results && R.results.length){
      msg.ask = webAsk(msg.ask || text, R); msg.sources = R.results.map(x => ({ t:x.t, u:x.u })); msg.web = R.via; if (why) msg.webWhy = why;
      if (card._fx){ const host = u => { try{ return new URL(u).hostname.replace(/^www\./, ''); }catch(e){ return ''; } }, hs = [...new Set(R.results.map(x => host(x.u)).filter(Boolean))];
        window.SZFx.mount(card._fx, 'radar', { lang:SZ.lang(), modo:'web', hallazgos:hs }); await new Promise(r => setTimeout(r, !SZ.CFG.anim ? 0 : 900)); }
    }
    else toast('No encontré nada en internet para eso; te respondo con lo que sabe la IA.');
  }catch(e){ toast(e.message + (e.code === 's_guest' ? '' : ' Te respondo con lo que sabe la IA.')); if (e.code === 's_guest') setTimeout(() => SZ.guestGate({ mode:'signup' }), 400); }
  finally{ try{ card._px.stop(); }catch(e){} card.remove(); }
}
const hostOf = u => { try{ return new URL(u).hostname.replace(/^www\./, ''); }catch(e){ return ''; } };
/* v4.2 · por qué se buscó, dicho claro (y en el idioma de la página) */
const WEB_WHY = { es:{ tu:'porque lo pediste', pedido:'porque lo pediste', hoy:'porque preguntaste por algo de hoy', reciente:'porque preguntaste por algo reciente', precio:'porque los precios cambian', evento:'porque preguntaste por un resultado o el clima', lugar:'porque preguntaste por un lugar u horario' },
  en:{ tu:'because you asked', pedido:'because you asked', hoy:'because you asked about something current', reciente:'because you asked about something recent', precio:'because prices change', evento:'because you asked about a result or the weather', lugar:'because you asked about a place or opening hours' } };
function webSaid(m){
  const en = SZ.lang() === 'en', n = m.sources.length, why = (WEB_WHY[en ? 'en' : 'es'] || {})[m.webWhy];
  return (en ? (m.web === 'wikipedia' ? 'Searched Wikipedia' : 'Searched the web') : (m.web === 'wikipedia' ? 'Busqué en Wikipedia' : 'Busqué en internet')) + (why ? ' ' + why : '') + ' · <b>' + n + (en ? (n === 1 ? ' source' : ' sources') : (n === 1 ? ' fuente' : ' fuentes')) + '</b>';
}
/* debajo de tu mensaje: «Busqué en internet · 5 fuentes ▸» */
function sourcesEl(m){
  const el = document.createElement('div'); el.className = 'agsum websum';
  el.innerHTML = '<button type="button" class="ag-row" aria-expanded="false"><span class="ag-ic">' + webBtn.innerHTML + '</span><span class="ag-tx">' + webSaid(m) + '</span><svg class="ag-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button><div class="ag-d" hidden><ol class="srcl"></ol></div>';
  const ol = $('.srcl', el);
  m.sources.forEach((x, i) => { const li = document.createElement('li'), a = document.createElement('a'); a.href = x.u; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.innerHTML = '<b></b><small></small>'; $('b', a).textContent = '[' + (i + 1) + '] ' + (x.t || hostOf(x.u)); $('small', a).textContent = hostOf(x.u); li.appendChild(a); ol.appendChild(li); });
  const row = $('.ag-row', el), d = $('.ag-d', el);
  row.addEventListener('click', () => { const on = d.hidden; d.hidden = !on; row.setAttribute('aria-expanded', String(on)); el.classList.toggle('open', on); });
  return el;
}
/* en la respuesta, cada [1], [2]… se vuelve un enlace a su fuente */
function citeLinks(body, sources){
  if (!body || !sources || !sources.length) return;
  const w = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, { acceptNode:n => n.parentElement && n.parentElement.closest('pre, code, a, .fcard') ? NodeFilter.FILTER_REJECT : /\[\d{1,2}\]/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP });
  const L = []; while (w.nextNode()) L.push(w.currentNode);
  L.forEach(n => {
    const frag = document.createDocumentFragment(); let last = 0; const s = n.nodeValue;
    s.replace(/\[(\d{1,2})\]/g, (all, num, at) => { const x = sources[+num - 1]; if (!x) return all; frag.appendChild(document.createTextNode(s.slice(last, at))); const a = document.createElement('a'); a.className = 'cite'; a.href = x.u; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.title = (x.t || '') + ' · ' + hostOf(x.u); a.textContent = num; frag.appendChild(a); last = at + all.length; return all; });
    if (last){ frag.appendChild(document.createTextNode(s.slice(last))); n.replaceWith(frag); }
  });
}
/* ---------- v2.1 · presentaciones: pides «hazme una presentación de…», la IA arma las diapositivas,
   las ves en vista previa y las descargas como PowerPoint (.pptx) con el estilo de Sinapse ---------- */
const PPT_RX = /\b(?:hazme|haz|cr[eé]a(?:me)?|arma(?:me)?|genera(?:me)?|prepara(?:me)?|dise[ñn]a(?:me)?|elabora(?:me)?|redacta(?:me)?|necesito|quiero|dame|p[oó]n(?:me)?|make|create|build|generate|prepare|need|want)\b[^.\n?!]{0,40}\b(?:presentaci[oó]n(?:es)?|presentations?|diapositivas?|power ?point|pptx|slides?|slide ?deck)\b|\b(?:en|como|formato|archivo)\s+(?:un\s+)?(?:power ?point|pptx)\b|\.pptx\b/i;
const PPT_NO = /\b(consejos|tips|c[oó]mo (?:hacer|dar|hablar|mejorar|preparar|presentar)|nervios|exposici[oó]n oral|practicar|mejorar mi presentaci|presentaci[oó]n personal|presentarme)\b/i;
/* solo arma diapositivas si de verdad las pides (no porque la palabra aparezca en otra frase) */
const wantsDeck = t => { t = String(t || ''); return PPT_RX.test(t) && !PPT_NO.test(t); };
const DECK_INSTR = '\n\n---\nIMPORTANTE: arma una presentación. Responde con UNA frase corta y luego UN solo bloque ```json con este formato exacto: {"titulo":"...","subtitulo":"...","diapositivas":[{"titulo":"...","puntos":["...","..."],"notas":"lo que diría el presentador"}]}. Entre 6 y 10 diapositivas, máximo 5 puntos cortos por diapositiva (máximo 15 palabras cada uno), en el idioma del pedido. La última diapositiva es un cierre o conclusión. No pongas nada después del bloque.';
function deckFrom(text){
  const t = String(text || ''); let a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a < 0 || b <= a) return null;
  let j = null; try{ j = JSON.parse(t.slice(a, b + 1)); }catch(e){ try{ j = JSON.parse(t.slice(a, b + 1).replace(/,\s*([}\]])/g, '$1')); }catch(x){ return null; } }
  if (!j || !Array.isArray(j.diapositivas) || !j.diapositivas.length) return null;
  const s = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);
  return { titulo:s(j.titulo, 120) || 'Presentación', subtitulo:s(j.subtitulo, 200), slides:j.diapositivas.slice(0, 20).map(d => ({ titulo:s(d && d.titulo, 120), puntos:(Array.isArray(d && d.puntos) ? d.puntos : []).slice(0, 7).map(p => s(p, 200)).filter(Boolean), notas:s(d && d.notas, 1200) })) };
}
const fileSafe = t => (String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'presentacion') + '.pptx';
function deckCard(pre, D){
  const c = document.createElement('div'); c.className = 'fcard deck'; c.dataset.ext = 'pptx';
  c.innerHTML = '<button type="button" class="fc-main" data-dk="prev"><span class="fc-ic img" aria-hidden="true">' + SZ.fileIco('pptx') + '</span><span class="fc-t"><b></b><small>Presentación · ' + D.slides.length + ' diapositivas · con vista previa</small></span></button>'
    + '<button type="button" class="cnv-b" data-dk="prev">' + CNV_ICO.eye + '<span>Vista previa</span></button><button type="button" class="cnv-b" data-dk="down">' + CNV_ICO.down + '<span>Descargar .pptx</span></button>';
  $('.fc-t b', c).textContent = fileSafe(D.titulo);
  pre.before(c); pre.hidden = true; c.appendChild(pre); c._deck = D;
  return c;
}
/* vista previa: las diapositivas en el lienzo, tal como quedan en PowerPoint */
function slideHtml(D, i){
  if (i < 0) return '<div class="sl sl-t"><h2></h2><i class="sl-bar"></i><p></p><small>Hecho con Sinapse</small></div>';
  return '<div class="sl"><h3></h3><i class="sl-bar"></i><ul></ul><span class="sl-n">' + (i + 2) + '</span></div>';
}
function openDeck(D){
  closeCanvas(true);
  const o = document.createElement('div'); o.className = 'cvp'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', D.titulo);
  o.innerHTML = '<div class="cvp-in"><div class="cvp-h"><span class="fc-ic img" aria-hidden="true">' + SZ.fileIco('pptx') + '</span><span class="cnv-t"><b></b><small>' + D.slides.length + ' diapositivas</small></span><button type="button" class="cnv-b" data-dk="down">' + CNV_ICO.down + '<span>Descargar .pptx</span></button><button type="button" class="cnv-b ic" data-cx aria-label="Cerrar">✕</button></div><div class="cvp-b deckv"></div></div>';
  $('.cnv-t b', o).textContent = fileSafe(D.titulo);
  const box = $('.deckv', o);
  [-1, ...D.slides.map((_, i) => i)].forEach(i => {
    const w = document.createElement('div'); w.className = 'slw'; w.innerHTML = slideHtml(D, i);
    if (i < 0){ $('h2', w).textContent = D.titulo; $('p', w).textContent = D.subtitulo; }
    else { const S = D.slides[i]; $('h3', w).textContent = S.titulo; S.puntos.forEach(p => { const li = document.createElement('li'); li.textContent = p; $('ul', w).appendChild(li); }); if (S.notas){ const n = document.createElement('p'); n.className = 'sl-notes'; n.textContent = 'Notas: ' + S.notas; w.appendChild(n); } }
    box.appendChild(w);
  });
  document.body.appendChild(o); cvEl = o; document.body.classList.add('canvasing'); requestAnimationFrame(() => o.classList.add('on'));
  o.addEventListener('click', e => { if (e.target === o || e.target.closest('[data-cx]')) return closeCanvas(); const b = e.target.closest('[data-dk="down"]'); if (b) deckDownload(D, b); });
}
let pptxLib = null;
const loadPptx = () => pptxLib || (pptxLib = new Promise((ok, no) => { if (window.PptxGenJS) return ok(window.PptxGenJS); const s = document.createElement('script'); s.src = 'lib/pptxgen.bundle.js'; s.onload = () => window.PptxGenJS ? ok(window.PptxGenJS) : no(new Error('sin librería')); s.onerror = () => { pptxLib = null; no(new Error('no cargó')); }; document.head.appendChild(s); }));
async function deckBuild(D){
  const P = await loadPptx(), pres = new P();
  pres.layout = 'LAYOUT_WIDE'; pres.author = 'Sinapse'; pres.company = 'Sinapse'; pres.title = D.titulo;
  const BG = '0B0C10', TX = 'ECEBE7', SOFT = 'C9C8C3', GOLD = 'E6B65F', ROSE = 'C9566C', MUTE = '8D8C88';
  const t = pres.addSlide(); t.background = { color:BG };
  t.addShape(pres.ShapeType.rect, { x:0, y:0, w:13.33, h:.12, fill:{ color:ROSE } });
  t.addShape(pres.ShapeType.rect, { x:.9, y:3.05, w:1.6, h:.08, fill:{ color:GOLD } });
  t.addText(D.titulo, { x:.9, y:1.4, w:11.5, h:1.6, fontFace:'Georgia', fontSize:44, color:TX, bold:false, valign:'bottom', fit:'shrink' });
  if (D.subtitulo) t.addText(D.subtitulo, { x:.9, y:3.3, w:11.5, h:1.2, fontFace:'Calibri', fontSize:22, color:SOFT, valign:'top', fit:'shrink' });
  t.addText('Hecho con Sinapse', { x:.9, y:6.7, w:6, h:.4, fontFace:'Calibri', fontSize:12, color:MUTE });
  D.slides.forEach((S, i) => {
    const s = pres.addSlide(); s.background = { color:BG };
    s.addShape(pres.ShapeType.rect, { x:0, y:0, w:.12, h:7.5, fill:{ color:GOLD } });
    s.addText(S.titulo || ('Diapositiva ' + (i + 2)), { x:.8, y:.45, w:11.7, h:1.0, fontFace:'Georgia', fontSize:32, color:TX, fit:'shrink' });
    s.addShape(pres.ShapeType.rect, { x:.8, y:1.45, w:1.2, h:.06, fill:{ color:ROSE } });
    if (S.puntos.length) s.addText(S.puntos.map(p => ({ text:p, options:{ bullet:{ code:'25CF' }, color:'D9D7D2', paraSpaceAfter:10 } })), { x:.8, y:1.8, w:11.7, h:4.8, fontFace:'Calibri', fontSize:22, valign:'top', fit:'shrink' });
    s.addText(String(i + 2), { x:12.2, y:6.85, w:.8, h:.4, fontFace:'Calibri', fontSize:12, color:MUTE, align:'right' });
    if (S.notas) s.addNotes(S.notas);
  });
  return pres;
}
async function deckDownload(D, btn){
  const l = btn ? btn.innerHTML : ''; if (btn){ btn.disabled = true; $('span', btn) && ($('span', btn).textContent = 'Armando…'); }
  try{ const pres = await deckBuild(D); await pres.writeFile({ fileName:fileSafe(D.titulo) }); toast('Descargué ' + fileSafe(D.titulo) + '. Ábrelo con PowerPoint, Google Slides o Keynote.'); }
  catch(e){ toast('No pude armar el PowerPoint. Revisa tu conexión e intenta de nuevo.'); }
  finally{ if (btn){ btn.disabled = false; btn.innerHTML = l; } }
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.fcard.deck [data-dk]'); if (!b) return;
  const D = b.closest('.fcard')._deck; if (!D) return;
  if (b.dataset.dk === 'down') deckDownload(D, b); else openDeck(D);
});
window.SynthFlowDeck = { build:deckBuild, from:deckFrom };
/* ---------- v2.1 · memoria: SynthFlow recuerda lo que tú le pides (tu nombre, a qué te dedicas, cómo te gustan las respuestas)
   Solo guarda lo que tú apruebas, lo ves y lo borras cuando quieras. Con cuenta, te sigue a todos tus equipos. ---------- */
const MEM_RX = /\b(recuerda|recu[eé]rdalo|acu[eé]rdate|no (te )?olvides|ten en cuenta|guarda en tu memoria)\b\s*(que|de|esto|:)?\s*/i;
const memSt = () => st().mem || (st().mem = { on:true, t:0, items:[] });
function memAdd(text){ return SZ.memAddCore(text); }
/* lo que la IA recibe (solo si la memoria está encendida) */
function memSystem(){ const m = memSt(); if (!m.on || !m.items.length) return ''; return 'Datos que la persona te pidió recordar (úsalos cuando sirvan, sin repetirlos todo el tiempo): ' + m.items.slice(0, 25).map(x => '- ' + x.text).join(' '); }
/* «¿Quieres que lo recuerde?» después de un mensaje que lo pide */
function memOffer(text){
  const i = text.search(MEM_RX); if (i < 0) return;
  /* v4.0 · el dato lo redacta la IA ([recordar: …]); si no lo dio, se limpia aquí (tercera persona, sin «recuerda que») */
  const ai = memNext; memNext = null;
  if (ai === '?') return;   /* la IA no entendió qué recordar y te lo preguntó: no se ofrece guardar nada todavía */
  let fact = ai && ai.length >= 3 ? ai : text.slice(i).replace(MEM_RX, '').replace(/^[,.:;\s]+/, '').split(/(?<=[.!?])\s/)[0].trim();
  if (fact.length < 3) fact = text.trim();
  fact = (ai && ai.length >= 3 ? fact : memLimpia(fact)).slice(0, 300); if (fact.length < 3) return;
  $$('.memoff', lane).forEach(x => x.remove());
  const d = document.createElement('div'); d.className = 'agkeep memoff';
  d.innerHTML = '<span>¿Quieres que lo recuerde para tus próximos chats? «<b></b>»</span><div class="agk-b"><button type="button" class="btn sm" data-mm="yes">Recordar</button><button type="button" class="btn sm ghost" data-mm="no">No</button></div><small>Lo ves y lo borras cuando quieras en Ajustes › Memoria.</small>';
  $('span b', d).textContent = fact; lane.appendChild(d); follow();
  d.addEventListener('click', e => { const b = e.target.closest('[data-mm]'); if (!b) return; d.remove(); if (b.dataset.mm === 'yes' && memAdd(fact)) toast('¡Listo! Lo voy a recordar.'); });
}
/* v2.2 · «Lo que recuerdo de ti» vive en Ajustes › Memoria */
function memModal(){ SZ.cfgModal('mem'); }
/* ---------- v4.0 · Títulos con sentido y memoria con lógica (pedido de Sammuel, 3 nov 2026) ----------
   La IA que responde hace dos trabajitos más, en la misma respuesta (sin gastar otra IA):
   1) TÍTULO: al final escribe [titulo: …] con el tema real del chat en 2 a 6 palabras. Se le dice el título actual:
      si el tema sigue igual, lo repite (el título no cambia en cada mensaje); si el tema cambió de verdad
      (dejó los documentos y ahora pide una web), escribe uno nuevo. Un saludo solo → «-» (queda «Charla nueva»).
      Si tú le pusiste el nombre al chat a mano, la IA nunca lo cambia.
   2) MEMORIA: si pides «recuerda…», la IA saca el dato real y lo redacta corto y en tercera persona: [recordar: Se llama Ana.]
      Si no está claro qué recordar, escribe [recordar: ?] y te pregunta. La página te pregunta «¿Lo recuerdo?» como antes,
      y si ya había algo parecido (otro nombre, otra ciudad) se ACTUALIZA en vez de duplicarse (memAddCore en core 14).
   Las marcas nunca se ven: se quitan mientras la respuesta llega. */
/* v4.1 · la marca se reconoce aunque la IA la escriba con espacios «[ titulo: - ]», escapada «\[titulo: …\]»,
   en negrita «**[titulo: …]**», entre comillas invertidas o con «=» o «：» (antes se colaba en la respuesta visible) */
const MK_RX = /\s*(?:\*\*|__|`)?\\?\[\s*(titulo|título|title|recordar|remember)\s*[:=：]\s*([^\]\n]{0,240}?)\s*\\?\](?:\*\*|__|`)?/gi;
/* mientras llega: también se esconde una marca a medio escribir al final («[tit…», «[ titulo: Ide…») */
const MK_TAIL = /\s*(?:\*\*|__|`)?\\?\[\s*(?:t(?:[ií](?:t(?:u(?:l(?:o)?)?|l(?:e)?)?)?)?|r(?:e(?:c(?:o(?:r(?:d(?:a(?:r)?)?)?)?)?|m(?:e(?:m(?:b(?:e(?:r)?)?)?)?)?)?)?)?(?:\s*[:=：][^\]\n]*)?$/i;
const sinMarcas = t => String(t || '').replace(MK_RX, '').replace(MK_TAIL, '');
/* para lo ya guardado (historial, copiar, exportar): solo marcas completas, sin tocar un final cualquiera */
const quitaMarcas = t => String(t || '').replace(MK_RX, '').replace(/\s+$/, '');
function marcas(t){
  let title = null, mem = null;
  const text = String(t || '').replace(MK_RX, (m, k, v) => { v = v.replace(/^["'«“\s]+|["'»”\s]+$/g, '').trim(); if (/^t/i.test(k)){ if (title == null) title = v.replace(/[.\s]+$/, ''); } else if (mem == null) mem = v === '?' || !v ? v : /[.!?]$/.test(v) ? v : v + '.'; return ''; }).replace(MK_TAIL, '').trim();
  return { text, title, mem };
}
/* lo que se le pide a la IA (va en el mensaje de sistema de apiMsgs) */
function marcasSystem(chat){
  const e = thMeta(thModel(), curT(), false), cur = e && e.title && !e.auto0 ? e.title : '', en = SZ.lang() === 'en';
  const lu = [...chat].reverse().find(m => m.role === 'user'), q = lu ? String(lu.ask || lu.content || '') : '';
  let s = (en ? 'At the very end of your answer add one line: [titulo: the real topic of THIS chat in 2 to 6 words, in the chat\'s language, no quotes] (for example [titulo: Website for a bakery]). '
              : 'Al final de tu respuesta agrega una línea: [titulo: el tema real de ESTE chat en 2 a 6 palabras, en el idioma del chat, sin comillas] (por ejemplo [titulo: Página web para una panadería]). ')
    + (cur ? (en ? 'The current title is «' + cur + '»: if the topic is still the same, repeat it exactly; change it only if the topic really changed. ' : 'El título actual es «' + cur + '»: si el tema sigue siendo el mismo, repítelo exacto; cámbialo solo si el tema de verdad cambió. ') : '')
    + (en ? 'If so far it is only a greeting or small talk, write [titulo: -]. Never mention this line.' : 'Si hasta ahora solo es un saludo o charla, escribe [titulo: -]. Nunca menciones esta línea.');
  if (MEM_RX.test(q)) s += en
    ? ' The person asked you to remember something: confirm it in one sentence and add on the last line [recordar: the fact rewritten short and clear in third person, without "remember that", e.g. Is called Ana and studies design.]. If it is not clear what to remember, ask, and write [recordar: ?].'
    : ' La persona te pidió recordar algo: confírmalo en una frase y agrega en la última línea [recordar: el dato reescrito corto y claro en tercera persona, sin «recuerda que», por ejemplo Se llama Ana y estudia diseño.]. Si no está claro qué recordar, pregúntale y escribe [recordar: ?].';
  return s;
}
/* sin marca (o con «-»): un título sacado del primer mensaje que no sea un saludo */
const SALUDO = /^\W*((hola+|holi|buenas|buen(os)? d[ií]as|buenas (tardes|noches)|hey|hi|hello|qu[eé] (tal|m[aá]s|onda)|c[oó]mo (est[aá]s|vas|va todo)|how are you|what'?s up|gracias|thanks|ok|vale|listo)[\s,.!?¡¿]*)+/i;
function titleLocal(chat){
  const en = SZ.lang() === 'en';
  for (const m of chat || []){
    if (m.role !== 'user') continue;
    let t = String(m.ask || m.content || '').replace(/\s+/g, ' ').trim().replace(SALUDO, '').replace(/^(por favor|please|oye|mira|necesito que|quiero que|puedes|podr[ií]as|can you|could you|i want you to|me ayudas a|ay[uú]dame a)\s+/i, '').replace(/^[\s,.!?¡¿]+/, '');
    if (t.length < 4) { if (m.files && m.files[0]) return (en ? 'File: ' : 'Archivo: ') + m.files[0].name.slice(0, 40); continue; }
    const words = t.split(' '); t = words.slice(0, 7).join(' ').replace(/[\s,.;:!?¡¿]+$/, '');
    return t.charAt(0).toUpperCase() + t.slice(1) + (words.length > 7 ? '…' : '');
  }
  return en ? 'New chat' : 'Charla nueva';
}
/* pone el título que dio la IA en el chat donde respondió (no en el que estés mirando si cambiaste) */
function titleSet(chat, title){
  const k = Object.keys(st().chats).find(x => st().chats[x] === chat); if (!k) return;
  const { model, id } = parseKey(k), e = thMeta(model, id, true); if (e.manual) return;
  const t = String(title || '').replace(/[*_`#"«»“”]/g, '').replace(/\s+/g, ' ').trim().replace(/[.,;:!?]+$/, '');
  const fromAi = !!t && t !== '-' && t.length >= 3;
  if (!fromAi && e.title && !e.auto0) return;   /* ya tenía un título con sentido: un «-» no lo borra */
  const next = fromAi ? t.charAt(0).toUpperCase() + t.slice(1, 60) : titleLocal(chat);
  if (next === e.title && !!e.auto0 === !fromAi) return;
  e.title = next; if (fromAi) delete e.auto0; else e.auto0 = true; save(); renderThBtn();
}
/* «recuerda que me llamo Ana» → «Se llama Ana.» si la IA no dio el dato redactado */
function memLimpia(fact){
  let s = String(fact || '').replace(/\s+/g, ' ').trim().replace(/^(que|de que|esto|:)\s+/i, '').replace(/^(that|this|:)\s+/i, '');
  const R = [[/\bme llamo\b/gi, 'se llama'], [/\bll[aá]mame\b/gi, 'quiere que le digan'], [/\bdime\b/gi, 'quiere que le digan'], [/\bsoy\b/gi, 'es'], [/\bestoy\b/gi, 'está'], [/\btengo\b/gi, 'tiene'], [/\bvivo\b/gi, 'vive'],
    [/\btrabajo\b/gi, 'trabaja'], [/\bestudio\b/gi, 'estudia'], [/\bprefiero\b/gi, 'prefiere'], [/\bquiero\b/gi, 'quiere'], [/\bnecesito\b/gi, 'necesita'], [/\bhablo\b/gi, 'habla'], [/\bme gustan\b/gi, 'le gustan'], [/\bme gusta\b/gi, 'le gusta'],
    [/\bmis\b/gi, 'sus'], [/\bmi\b/gi, 'su'], [/\byo\s+/gi, ''], [/\bmy name is\b/gi, 'name is'], [/\bcall me\b/gi, 'wants to be called'], [/\bI am\b|\bI'm\b/g, 'is'], [/\bI live\b/g, 'lives'], [/\bI work\b/g, 'works'], [/\bI study\b/g, 'studies'],
    [/\bI like\b/g, 'likes'], [/\bI prefer\b/g, 'prefers'], [/\bI have\b/g, 'has'], [/\bI need\b/g, 'needs'], [/\bmy\b/gi, 'their']];
  for (const [rx, to] of R) s = s.replace(rx, to);
  s = s.replace(/\s+/g, ' ').trim().replace(/[\s,;:]+$/, '');
  if (!s) return '';
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return /[.!?]$/.test(s) ? s : s + '.';
}
let memNext = null;   /* el dato que redactó la IA en la última respuesta (lo usa memOffer) */
/* ---------- 2026-11-09 · Importar chats y memoria: LECTOR (sin pantalla, se puede probar aparte: t/importar/importar.mjs) ----------
   Entiende lo que exportan otras IAs y lo convierte en conversaciones y recuerdos de Sonyx:
   · ChatGPT: el .zip de «Exportar datos» o su conversations.json (árbol «mapping»: se sigue la rama que estaba abierta).
   · Claude: el .zip de «Exportar datos» o su conversations.json (chat_messages) y memories.json (la memoria en texto).
   · JSON genérico: [{role, content}], {messages:[…]}, [{title, messages:[…]}] o la copia de Sonyx ({chats:{…}}).
   · Markdown / texto: con marcas «## Tú», «Usuario:», «Assistant:»… es un chat; sin marcas, una lista de recuerdos.
   Nada sale del navegador: todo se lee aquí. Devuelve { chats:[{ src, sid, title, t, msgs:[{role, content}] }], mem:[texto], skipped }. */
const IMP = (() => {
  const MAX_MSG = 400, MAX_TXT = 30000, MAX_MEM = 300;
  const str = v => typeof v === 'string' ? v : '';
  const clip = s => s.length > MAX_TXT ? s.slice(0, MAX_TXT) + '\n\n[…]' : s;
  const ms = v => { if (v == null || v === '') return 0; if (typeof v === 'number') return v < 1e12 ? Math.round(v * 1000) : Math.round(v); const d = Date.parse(v); return Number.isFinite(d) ? d : 0; };
  const USER_R = /^(user|human|humano|usuario|you|t[uú]|yo|me|persona|prompt)$/i;
  const BOT_R = /^(assistant|asistente|ai|ia|bot|model|modelo|gpt|chatgpt|claude|gemini|copilot|llama|mistral|deepseek|grok|perplexity|synthflow|synthonia|response|respuesta)$/i;
  const role = r => { r = str(r).trim(); return USER_R.test(r) ? 'user' : BOT_R.test(r) ? 'assistant' : ''; };
  /* texto de un mensaje en cualquiera de las formas habituales */
  function textOf(c){
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) return c.map(x => typeof x === 'string' ? x : x && (x.type === 'text' || x.type == null) ? str(x.text) || str(x.content) : '').filter(Boolean).join('\n\n');
    if (c && typeof c === 'object'){ if (Array.isArray(c.parts)) return textOf(c.parts); return str(c.text) || str(c.content) || str(c.value); }
    return '';
  }
  /* une mensajes seguidos del mismo lado (ChatGPT parte una respuesta cuando usa herramientas) y descarta los vacíos */
  function tidy(list){
    const out = [];
    list.forEach(m => {
      const content = str(m.content).replace(/\r\n?/g, '\n').trim(); if (!m.role || !content) return;
      const last = out[out.length - 1];
      if (last && last.role === m.role) last.content = clip(last.content + '\n\n' + content); else out.push({ role:m.role, content:clip(content) });
    });
    return out.slice(-MAX_MSG);
  }
  const conv = (src, sid, title, t, msgs) => { msgs = tidy(msgs); return msgs.length ? { src, sid:String(sid || ''), title:str(title).replace(/\s+/g, ' ').trim().slice(0, 60), t:t || 0, msgs } : null; };

  /* ---- ChatGPT: cada conversación es un árbol; se camina desde el último mensaje (current_node) hacia arriba ---- */
  const isGpt = c => c && typeof c === 'object' && c.mapping && typeof c.mapping === 'object';
  function fromGpt(c){
    const M = c.mapping, path = [];
    let id = c.current_node && M[c.current_node] ? c.current_node : null;
    if (!id){ /* sin current_node: el último nodo sin hijos */ const ks = Object.keys(M).filter(k => !(M[k].children || []).length); id = ks[ks.length - 1]; }
    const seen = new Set();
    while (id && M[id] && !seen.has(id)){ seen.add(id); path.push(M[id]); id = M[id].parent; }
    path.reverse();
    const msgs = path.map(n => n && n.message).filter(m => m && m.author && !(m.metadata && (m.metadata.is_visually_hidden_from_conversation || m.metadata.is_user_system_message)))
      .map(m => {
        const r = role(m.author.role), ct = m.content && m.content.content_type;
        if (!r || (ct && !/^(text|multimodal_text)$/.test(ct))) return null;
        const parts = (m.content.parts || []).map(p => typeof p === 'string' ? p : p && p.content_type === 'image_asset_pointer' ? '[imagen]' : '').filter(Boolean);
        return { role:r, content:parts.join('\n\n') };
      }).filter(Boolean);
    return conv('chatgpt', c.conversation_id || c.id, c.title, ms(c.update_time) || ms(c.create_time), msgs);
  }
  /* ---- Claude: chat_messages con sender human/assistant y bloques de texto ---- */
  const isClaude = c => c && typeof c === 'object' && Array.isArray(c.chat_messages);
  function fromClaude(c){
    const msgs = c.chat_messages.map(m => {
      let t = Array.isArray(m.content) && m.content.some(b => b && b.type === 'text') ? textOf(m.content.filter(b => b && b.type === 'text')) : str(m.text);
      const att = (m.attachments || []).concat(m.files || []).map(a => a && (a.file_name || a.name)).filter(Boolean);
      if (att.length) t += '\n\n[' + att.map(n => 'Archivo: ' + n).join(' · ') + ']';
      return { role:role(m.sender), content:t };
    });
    return conv('claude', c.uuid, c.name, ms(c.updated_at) || ms(c.created_at), msgs);
  }
  /* ---- genérico: una lista de mensajes {role|sender|author|from, content|text|message} ---- */
  const msgRole = m => role(m.role || m.sender || (m.author && (m.author.role || m.author)) || m.from || m.speaker);
  const isMsgList = a => Array.isArray(a) && a.length > 0 && a.filter(m => m && typeof m === 'object' && msgRole(m)).length >= Math.max(1, a.length * 0.6);
  const fromList = (src, a, title, sid, t) => conv(src, sid, title, t, a.map(m => m && typeof m === 'object' ? { role:msgRole(m), content:textOf(m.content != null ? m.content : m.text != null ? m.text : m.message != null ? m.message : m.parts) } : null).filter(Boolean));

  /* ---- memoria en texto: una línea por recuerdo (viñetas, números o frases sueltas); fuera títulos y relleno ---- */
  function memLines(text){
    const out = [];
    str(text).replace(/\r\n?/g, '\n').split('\n').forEach(l => {
      l = l.trim(); if (!l || /^#{1,6}\s/.test(l) || /^(\*\*|__)[^*_]{1,60}(\*\*|__):?$/.test(l) || /^(-{3,}|\*{3,}|_{3,}|```)/.test(l)) return;
      l = l.replace(/^(?:[-*•·◦▪►‣]|\d{1,3}[.)])\s+/, '').replace(/\*\*|__|`/g, '').replace(/^\[[ x]\]\s*/i, '').trim();
      if (l.length < 4 || /:$/.test(l)) return;
      /* un párrafo largo se parte en frases */
      (l.length > 300 ? l.split(/(?<=[.!?])\s+/) : [l]).forEach(s => { s = s.trim(); if (s.length >= 4) out.push(s.slice(0, 300)); });
    });
    return [...new Set(out)].slice(0, MAX_MEM);
  }
  /* cualquier campo con «memor» en el nombre (memories.json de Claude: conversations_memory, project_memories…) */
  function memOf(o, depth){
    const out = []; if (!o || typeof o !== 'object' || depth > 4) return out;
    if (Array.isArray(o)){ o.forEach(x => { if (typeof x === 'string') out.push(...memLines(x)); else out.push(...memOf(x, depth + 1)); }); return out; }
    Object.keys(o).forEach(k => {
      const v = o[k];
      if (/memor|recuerd|facts?$/i.test(k)){
        if (typeof v === 'string') out.push(...memLines(v));
        else if (Array.isArray(v)) v.forEach(x => { if (typeof x === 'string') out.push(...memLines(x)); else if (x && typeof x === 'object') out.push(...memLines(str(x.text) || str(x.content) || str(x.memory) || str(x.value))); out.push(...memOf(x, depth + 1)); });
        else if (v && typeof v === 'object') Object.keys(v).forEach(kk => { if (typeof v[kk] === 'string') out.push(...memLines(v[kk])); else out.push(...memOf(v[kk], depth + 1)); });
      } else if (v && typeof v === 'object' && depth < 2) out.push(...memOf(v, depth + 1));
    });
    return out;
  }

  /* ---- JSON: decide qué es ---- */
  function fromJson(j, name){
    const res = { chats:[], mem:[], skipped:0 };
    const add = c => { if (c) res.chats.push(c); else res.skipped++; };
    const one = (x, i) => {
      if (isGpt(x)) return add(fromGpt(x));
      if (isClaude(x)) return add(fromClaude(x));
      if (x && typeof x === 'object' && isMsgList(x.messages)) return add(fromList('json', x.messages, x.title || x.name, x.id || x.uuid || name + ':' + i, ms(x.updated_at || x.update_time || x.created_at || x.date)));
      if (x && typeof x === 'object' && isMsgList(x.conversation)) return add(fromList('json', x.conversation, x.title || x.name, x.id || name + ':' + i, ms(x.updated_at || x.date)));
      return false;
    };
    if (isMsgList(j)) add(fromList('json', j, '', name, 0));
    else if (Array.isArray(j)) j.forEach((x, i) => { if (one(x, i) === false) res.mem.push(...memOf(x, 1)); });
    else if (j && typeof j === 'object'){
      if (one(j, 0) === false){
        if (Array.isArray(j.conversations)) j.conversations.forEach((x, i) => one(x, i));
        /* la copia de SynthFlow: { chats:{ 'openrouter::modelo::tid':[…] }, threads:{…} } */
        if (j.chats && typeof j.chats === 'object' && !Array.isArray(j.chats)) Object.keys(j.chats).forEach(k => { if (isMsgList(j.chats[k])){ const p = k.split('::'), tid = p[2] || '', th = ((j.threads || {})[p[1]] || []).find(e => e && e.id === tid) || {}; add(fromList('synthflow', j.chats[k], th.title, k, th.t || 0)); } });
        if (Array.isArray(j.chats)) j.chats.forEach((x, i) => one(x, i));
        res.mem.push(...memOf(j, 0));
      }
    }
    return res;
  }

  /* ---- Markdown / texto: ¿tiene marcas de quién habla? ---- */
  /* «Usuario: hola», «**Tú:** hola», «**Claude**: …», «### Assistant» o «**ChatGPT**» sola en su línea */
  const MARK_IN = /^\s*(?:#{1,4}\s*)?(?:\*\*|__)?([\p{L}][\p{L}\d .-]{0,30}?)(?:\*\*|__)?\s*[:：]\s*(?:\*\*|__)?\s*(.*)$/u;
  const MARK_SOLO = /^\s*(?:#{1,4}\s*(?:\*\*|__)?|\*\*|__)([\p{L}][\p{L}\d .-]{0,30}?)(?:\*\*|__)?\s*$/u;
  function fromText(text, name){
    text = str(text).replace(/\r\n?/g, '\n').replace(/^﻿/, '');
    const lines = text.split('\n'), msgs = []; let cur = null, mine = false, users = 0;
    /* la copia que hace SynthFlow («Descargar como texto»): «## Tú» y luego «## Nombre de la IA» */
    const own = /^##\s+(T[uú]|You)\s*$/m.test(text);
    lines.forEach(l => {
      let r = '', rest = '';
      const h = own && /^##\s+\S/.test(l) ? l.replace(/^##\s+/, '').trim() : null;
      if (h != null){ if (/^(T[uú]|You)$/i.test(h)){ r = 'user'; } else if (cur && cur.role === 'user'){ r = 'assistant'; } }
      else {
        const a = l.match(MARK_SOLO), b = !a && l.match(MARK_IN);
        if (a && role(a[1])) r = role(a[1]);
        else if (b && role(b[1])){ r = role(b[1]); rest = str(b[2]); }
      }
      if (r){ if (cur) msgs.push(cur); cur = { role:r, content:rest }; if (r === 'user') users++; mine = true; return; }
      if (cur) cur.content += (cur.content ? '\n' : '') + l;
    });
    if (cur) msgs.push(cur);
    if (mine && users && msgs.some(m => m.role === 'assistant')){
      const first = msgs.find(m => m.role === 'user'), title = str(name).replace(/\.(md|markdown|txt)$/i, '').replace(/[_-]+/g, ' ').trim();
      const c = conv(own ? 'synthflow' : 'texto', name, /^(chat( |$)|pegado$)/i.test(title) || !title ? (first ? first.content.split('\n')[0] : '') : title, 0, msgs);
      return { chats:c ? [c] : [], mem:[], skipped:c ? 0 : 1 };
    }
    return { chats:[], mem:memLines(text), skipped:0 };
  }

  /* ---- .zip sin librerías: se lee el índice del final y se descomprime con DecompressionStream ---- */
  async function unzip(buf, want){
    const v = new DataView(buf), u8 = new Uint8Array(buf), out = [];
    let e = -1; for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--){ if (v.getUint32(i, true) === 0x06054b50){ e = i; break; } }
    if (e < 0) throw new Error('zip');
    const n = v.getUint16(e + 10, true); let p = v.getUint32(e + 16, true);
    const dec = new TextDecoder();
    for (let k = 0; k < n && p + 46 <= buf.byteLength; k++){
      if (v.getUint32(p, true) !== 0x02014b50) break;
      const method = v.getUint16(p + 10, true), csize = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), off = v.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nl)); p += 46 + nl + xl + cl;
      if (/\/$/.test(name) || !want(name)) continue;
      const lo = off + 30 + v.getUint16(off + 26, true) + v.getUint16(off + 28, true), raw = u8.subarray(lo, lo + csize);
      let data;
      if (method === 0) data = raw;
      else if (method === 8 && typeof DecompressionStream === 'function') data = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
      else continue;
      out.push({ name, text:dec.decode(data) });
    }
    return out;
  }
  const NOISE = /(^|\/)(users?|projects?|message_feedback|shared_conversations|model_comparisons|user_settings|group_chats|sora|chat)\.(json|html)$/i;
  const wantIn = n => /\.(json|md|markdown|txt)$/i.test(n) && !NOISE.test(n) && !/(^|\/)(__MACOSX|\.)/.test(n);

  function merge(into, r){ into.chats.push(...r.chats); into.mem.push(...r.mem); into.skipped += r.skipped || 0; return into; }
  /* lee un texto ya abierto (sirve para el cuadro de «pegar» y para las pruebas) */
  function parseText(text, name){
    name = str(name) || 'pegado.txt';
    const t = str(text).trim(); if (!t) return { chats:[], mem:[], skipped:0 };
    if (/\.json$/i.test(name) || /^[[{]/.test(t)){ try{ return fromJson(JSON.parse(t), name); }catch(e){ if (/\.json$/i.test(name)) return { chats:[], mem:[], skipped:1, bad:true }; } }
    return fromText(t, name);
  }
  /* lee archivos del navegador (File/Blob con .name) */
  async function parseFiles(files){
    const all = { chats:[], mem:[], skipped:0, bad:[] };
    for (const f of files){
      try{
        if (/\.zip$/i.test(f.name) || f.type === 'application/zip' || f.type === 'application/x-zip-compressed'){
          const inner = await unzip(await f.arrayBuffer(), wantIn);
          if (!inner.length) all.bad.push(f.name);
          inner.forEach(x => merge(all, parseText(x.text, x.name.split('/').pop())));
        } else {
          const r = parseText(await f.text(), f.name); if (r.bad) all.bad.push(f.name); merge(all, r);
        }
      }catch(e){ all.bad.push(f.name); }
    }
    /* sin repetidos: misma fuente + mismo id, y recuerdos iguales */
    const seen = new Set(); all.chats = all.chats.filter(c => { const k = c.src + ':' + (c.sid || c.title + c.msgs.length); if (seen.has(k)) return false; seen.add(k); return true; });
    all.chats.sort((a, b) => (b.t || 0) - (a.t || 0));
    all.mem = [...new Set(all.mem)].slice(0, MAX_MEM);
    return all;
  }
  return { parseText, parseFiles, unzip, memLines, fromJson, fromText };
})();
/* ---------- v1.8 · modo agente: tú escribes; el agente entiende y mejora tu pedido, elige la IA que más sabe de eso
   y te muestra cada paso. Al final decides: quedarte con esa IA o seguir en modo agente ---------- */
let agentBusy = false;
const agentOn = () => !!st().agent && !trialOn;
$('#agPill').addEventListener('click', () => { if (isMobile()) closeChatsSheet && closeChatsSheet(); setAgent(false); });
function paintAgent(){ try{ paintMode(); }catch(e){} $$('.agentb, #railAgent').forEach(b => { b.setAttribute('aria-pressed', String(agentOn())); b.classList.toggle('on', agentOn()); }); document.body.classList.toggle('agenting', agentOn()); inp.placeholder = agentOn() ? 'Apex: cuéntame qué necesitas…' : (isLocked() ? inp.placeholder : 'Escribe tu mensaje...'); }
function setAgent(on){
  if (on && st().alias) setAlias(false);   /* v4.6 · Quoryn y SuperiorSynth no van a la vez */
  if (!!st().agent === !!on){ paintAgent(); return; }
  if (mode !== 'solo'){ stopNow(); cmpRun++; cmpLast = null; mode = 'solo'; }
  st().agent = !!on; save(); paintAgent(); gen++;
  try{ renderMsgs(); updateHint(); renderTop(true); renderNow(); renderChats(false); }catch(e){}
  toast(on ? 'Modo Apex activado: tú escribes y Apex elige la IA que más sabe de eso.' : 'Modo Apex apagado: ahora eliges tú la IA.');
}
const AG_STEPS = ['Entendiendo tu pedido', 'Mejorando tu pedido para que la IA lo entienda mejor', 'Eligiendo la IA que más sabe de esto', 'Pasándole tu pedido a la IA'];
/* v2.3 · SuperiorSynth: su ícono propio, animado (una estrella que late con un satélite que la orbita) */
function ssIco(cls){
  const run = !SZ.reduce && !root.classList.contains('noanim');
  /* la órbita pasa por detrás de la estrella (arco de arriba) y por delante (arco de abajo): se siente en 3D */
  return '<svg class="ssi' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(-24 12 12)">'
    + '<path class="ssi-o" d="M1.3 12a10.7 3.7 0 0 1 21.4 0" fill="none" stroke="url(#ssG)" stroke-width="1.35" stroke-linecap="round" opacity=".55"/></g>'
    + '<path class="ssi-s" d="M12 2.6l2.05 7.35L21.4 12l-7.35 2.05L12 21.4l-2.05-7.35L2.6 12l7.35-2.05z" fill="url(#ssG)"/>'
    + '<g transform="rotate(-24 12 12)"><path class="ssi-o" d="M22.7 12a10.7 3.7 0 0 1-21.4 0" fill="none" stroke="url(#ssG)" stroke-width="1.35" stroke-linecap="round"/>'
    + '<circle class="ssi-d" r="1.6" fill="#fff4dc"' + (run ? '><animateMotion dur="3.6s" repeatCount="indefinite" path="M1.3 12a10.7 3.7 0 1 0 21.4 0a10.7 3.7 0 1 0-21.4 0"/></circle>' : ' cx="22.7" cy="12"/>') + '</g>'
    + '<path class="ssi-k" d="M19.6 2.2l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5z" fill="#ffe7b8"/></svg>';
}
if (!document.getElementById('ssDefs')) document.body.insertAdjacentHTML('afterbegin', '<svg id="ssDefs" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true" focusable="false"><defs><linearGradient id="ssG" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff1d2"/><stop offset=".45" stop-color="#e6b65f"/><stop offset="1" stop-color="#c9566c"/></linearGradient></defs></svg>');
const ssMount = () => $$('.ssmount').forEach(m => { if (!m.firstChild) m.innerHTML = ssIco(); });
ssMount();
const AG_ICO = ssIco();
/* lo que hace el agente, en vivo: su loguito de píxeles y los pasos que se van marcando */
function agentCard(){
  const el = document.createElement('div'); el.className = 'agrun';
  el.innerHTML = '<div class="ag-h"><span class="pxw">' + SZ.pixelGrid() + '</span><span class="ag-t"><b>Apex</b><small>Trabajando en tu pedido…</small></span></div><ol class="ag-s">' + AG_STEPS.map((t, i) => '<li data-i="' + i + '"><i aria-hidden="true"></i><span>' + t + '</span></li>').join('') + '</ol>';
  const px = SZ.pixelRun($('.pxw', el));
  /* v4.5 · la línea de abajo es una frase al azar (con tu nombre a veces) que cambia sola mientras trabaja */
  const sm = $('.ag-t small', el); let seen = false;
  const fr = () => { try{ if (el.isConnected) seen = true; else if (seen){ clearInterval(fiv); return; } const f = window.SZFrases && window.SZFrases.frase('agente', SZ.lang() === 'en' ? 'en' : 'es'); if (f && sm) sm.textContent = f + '…'; }catch(e){} };
  const fiv = setInterval(fr, 2800); fr();
  return {
    el,
    set(i, txt){ $$('li', el).forEach((li, j) => { li.classList.toggle('done', j < i); li.classList.toggle('on', j === i); }); if (txt) $('li[data-i="' + i + '"] span', el).textContent = txt; follow(); },
    stop(){ clearInterval(fiv); px.stop(); $$('li', el).forEach(li => { li.classList.remove('on'); li.classList.add('done'); }); }
  };
}
/* lo que queda guardado debajo de tu mensaje: «El agente eligió …» con el pedido mejorado para ver */
function agentSumEl(a){
  const el = document.createElement('div'); el.className = 'agsum';
  el.innerHTML = '<button type="button" class="ag-row" aria-expanded="false"><span class="ag-ic">' + AG_ICO + '</span><span class="ag-tx">Apex eligió <b></b><em></em></span>' + (a.ask ? '<svg class="ag-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>' : '') + '</button>' + (a.ask ? '<div class="ag-d" hidden><small>Tu pedido mejorado (esto le llegó a la IA)</small><p></p></div>' : '');
  $('.ag-tx b', el).textContent = a.name || 'una IA'; $('.ag-tx em', el).textContent = a.tl ? ', que sabe de ' + a.tl : '';
  if (a.ask){ $('.ag-d p', el).textContent = a.ask; const row = $('.ag-row', el), d = $('.ag-d', el); row.addEventListener('click', () => { const on = d.hidden; d.hidden = !on; row.setAttribute('aria-expanded', String(on)); el.classList.toggle('open', on); }); }
  return el;
}
/* v2.0 · tareas MUY simples: una IA rápida que gasta menos, pero buena (nunca la más pequeña si hay otra) */
const LIGHT = [/flash-lite/i, /mistral-small/i, /gpt-oss-20b/i, /gemma-3-27b/i, /qwen3-8b/i, /gemma-3-12b/i, /llama-3\.1-8b/i];
const isSimple = (text, plan) => !!(plan && plan.simple) && text.length < 180 && !/```|\n.*\n/.test(text) && !/c[oó]digo|program|ensayo|informe|analiza|compara|plan de|paso a paso/i.test(text);
function lightPick(){
  const L = cat.list.filter(m => /^sz:/.test(m.id) && connected(m.id));
  for (const rx of LIGHT){ const m = L.find(x => rx.test(x.id)); if (m) return m.id; }
  return null;
}
/* v3.4 · SuperiorSynth sigue aunque una IA se rompa: corre la respuesta y, si la IA falla, pasa el MISMO trabajo a otra
   IA experta en ese tema (nunca reintenta con la que falló). Hasta 3 IAs distintas; devuelve { ok, cur, err }. */
async function runExpert(tema, o = {}){
  const g0 = gen, tl = tema && TOPIC[tema] ? TOPIC[tema].l.toLowerCase() : '';
  let cur = selId(), lastErr = null; const tried = [cur];
  for (let n = 0; ; n++){
    lastErr = null;
    await runSolo(err => { lastErr = err; }, Object.assign({}, o, { noRescue:true }));
    if (!lastErr) return { ok:true, cur };
    const next = lastErr.aborted || lastErr.guest || g0 !== gen || n >= 2 ? null : agentNext(tema, tried, lastErr);
    if (!next) return { ok:false, err:lastErr, cur };
    tried.push(next);
    toast(info(cur).name + ' falló. Sigo con ' + info(next).name + (tl ? ', que sabe de ' + tl : '') + ': tu trabajo continúa.');
    try{ SZ.BOT.react && SZ.BOT.react('slow', { auto:next === 'sz:auto' }); }catch(e){}
    if (o.onSwap) try{ o.onSwap(next); }catch(e){}
    cur = next; st().model.openrouter = next; save(); paintSel(); renderTop(false); paintAccent();
  }
}
/* v3.4 · la siguiente IA experta cuando la elegida falló: otra del mismo tema, nunca una que ya falló.
   Si falló por límite, también se salta las del mismo proveedor (tendrían el mismo límite). */
function agentNext(tema, tried, err){
  const prov = id => /^sz:/.test(id) ? 'sz' : String(id).split(':')[0];
  const lastP = prov(tried[tried.length - 1]);
  const ok = m => m && !m.stub && !tried.includes(m.id) && connected(m.id) && !SZ.isBad(m.id) && !(err && err.limit && prov(m.id) === lastP);
  const L = tema ? recommendTop(tema, 15) : [];
  const m = L.find(ok) || [info(APODEX), bestUsable(true), bestUsable(false)].find(ok) || cat.list.find(ok);
  return m ? m.id : null;
}
function agentPick(tema){
  const L = tema ? recommendTop(tema, 10).filter(m => connected(m.id)) : [];
  const top = L.find(m => (info(m.id).spend || 1) < 3) || L[0];   /* no gasta tu Puter en las IA que más consumen si hay otra experta */
  if (top) return top.id;
  if (szOn()) return 'sz:auto';
  if (connected(selId())) return selId();
  const b = bestUsable(true) || bestUsable(false); return b ? b.id : selId();
}
/* después de la respuesta: ¿te quedas con esa IA o sigues en modo agente? */
function agentChoice(pick){
  $$('.agkeep', lane).forEach(x => x.remove());
  const nm = info(pick).name, d = document.createElement('div'); d.className = 'agkeep';
  d.innerHTML = '<span>¿Te quedas con <b></b> o sigues con Apex?</span><div class="agk-b"><button type="button" class="btn sm" data-ak="keep"></button><button type="button" class="btn sm ghost" data-ak="go">Seguir con Apex</button></div><small>Si sigues con Apex, en tu próximo mensaje vuelvo a elegir la IA que más sepa de eso.</small>';
  $('span b', d).textContent = nm; $('[data-ak="keep"]', d).textContent = 'Quedarme con ' + nm;
  lane.appendChild(d); follow();
  d.addEventListener('click', e => {
    const b = e.target.closest('[data-ak]'); if (!b) return; d.remove();
    if (b.dataset.ak === 'go'){ toast('Sigues con Apex: en tu próximo mensaje vuelvo a elegir la IA.'); return; }
    /* la conversación sigue igual, ahora con esa IA y sin el agente */
    const k0 = ckey(), msgs = (st().chats[k0] || []).slice(), tid = 't' + Date.now().toString(36), k1 = 'openrouter::' + pick + '::' + tid;
    st().chats[k1] = msgs; delete st().chats[k0]; st().del = [...(st().del || []), k0].slice(-300);
    const L = (st().threads || {})[AGK]; if (L){ const id0 = curT(), e0 = L.find(x => x.id === id0); st().threads[AGK] = L.filter(x => x.id !== id0); if (e0){ const e1 = thMeta(pick, tid, true); e1.title = e0.title; e1.t = Date.now(); } }
    (st().thread || (st().thread = {}))[pick] = tid; st().model.openrouter = pick; st().pinned = pick; st().agent = false;
    save(); paintAgent(); gen++; applyRail(); paintSel(); renderTop(true); paintAccent(); renderMsgs(); updateHint(); renderChats(false);
    toast('Listo: sigues con ' + nm + '. Apex quedó apagado; lo vuelves a activar en el botón de modo, junto a la caja de escribir.');
  });
}
async function agentPlan(text){
  const keys = TOPICS.map(t => t[0]).join(', ');
  const sys = 'Eres el planificador de Sonyx. Lees el pedido de una persona y lo mejoras para que otra IA lo entienda mejor. Responde SOLO con JSON válido y nada más: {"tema":"<una de: ' + keys + '>","internet":<true si para responder bien hacen falta datos actuales de internet (noticias, precios, fechas recientes, resultados, algo de hoy); si no, false>,"dificultad":"<muy_simple si es un saludo, una pregunta de una línea con respuesta corta, traducir o corregir una frase corta; si no, normal>","pedido":"<el pedido mejorado, en el mismo idioma de la persona, claro, con el contexto que dio y el formato de respuesta que le sirve; no inventes datos; máximo 120 palabras>"}';
  /* v3.3 · el plan nunca deja a SuperiorSynth colgado: si tarda más de 12 s (una IA que piensa mucho), sigue con tu pedido tal cual */
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 12000);
  let r; try{ r = await SZ.askStream(SZ.SZ_P, [{ role:'system', content:sys }, { role:'user', content:text.slice(0, 4000) }], { model:'sz:auto', _noFall:true, maxTokens:600, signal:ctl.signal }); }finally{ clearTimeout(tm); }
  const m = String((r && r.text) || '').match(/\{[\s\S]*\}/); if (!m) throw new Error('sin plan');
  const j = JSON.parse(m[0]); if (!j || typeof j.pedido !== 'string' || j.pedido.trim().length < 4) throw new Error('sin plan');
  return { tema:TOPIC[j.tema] ? j.tema : null, web:j.internet === true, simple:j.dificultad === 'muy_simple', pedido:j.pedido.trim().slice(0, 4000) };
}
async function send(){
  if (imgMode && mode === 'solo'){ const t = inp.value.trim(); if (t) createImage(t); return; }
  if (isLocked()){ lockNudge(); return; }
  if (mode === 'cmp') return compare();
  const text = inp.value.trim(), ready = files.filter(f => f.state === 'ok');
  if (!text && !ready.length) return;
  if (Object.keys(busy).length){ toast('Espera a que termine de responder, o detenla con el botón ■.'); return; }
  if (files.some(f => f.state === 'load')){ toast('Espera a que terminen de cargar los archivos.'); return; }
  try{ SZ.setTurn(text + '|' + Date.now()); }catch(e){}
  if (trialOn && trialLeft() <= 0){ toast('Se acabó tu EnerX de prueba.'); const tb = $('#trialBar'); tb.classList.remove('pulse'); void tb.offsetWidth; tb.classList.add('pulse'); return; }
  if (!budgetOk()) return;
  /* v3.8 · si todavía se está comprobando la IA que elegiste, espera esa respuesta (1-2 s); si no responde, tu texto se queda en la caja */
  { const h = HEALTH.get(selId()), m1 = selId(); if (h && h.p){ sendBtn.disabled = true; try{ await h.p; }finally{ sendBtn.disabled = false; } if (selId() !== m1) return; } }
  /* v4.6 · Quoryn (antes A.L.I.A.S.): con el modo Agente puesto, el pedido pasa primero por su enrutado: si es de verdad fácil lo responde Relay (Automática)
     o Apex (SuperiorSynth); si es un pedido de verdad, Quoryn arma el plan aquí mismo (16w-alias-en-chat.js) */
  let alJump = null;
  if (alOn() && mode === 'solo' && text){
    if (files.length) toast(alT('adjuntos'));
    else if (!alPass || Date.now() - alPass.t > 6000) return aliasSend(text);
    else { alJump = alPass; alPass = null; }
  }
  /* modo agente: no eliges IA; el agente entiende tu pedido, lo mejora, elige la IA experta y te muestra los pasos */
  if ((agentOn() || (alJump && alJump.to === 'superior')) && mode === 'solo' && text && !files.length){
    if (agentBusy) return;
    const alKeep = alJump ? { m:st().model.openrouter, p:st().pinned } : null;   /* Apex responde una vez: tu IA elegida no cambia */
    /* el agente ve que pides una imagen: la crea el creador de imágenes */
    if (IMG_RX.test(text) && SZ.ACC.ready){ toast('Apex vio que quieres una imagen: la crea el creador de imágenes.'); return createImage(text); }
    agentBusy = true; inp.readOnly = true; sendBtn.disabled = true;
    /* v3.3 · pase lo que pase (error, cambio de chat), la caja vuelve a quedar libre: antes un fallo a mitad dejaba SuperiorSynth mudo */
    const unlock = () => { agentBusy = false; inp.readOnly = false; sendBtn.disabled = false; };
    try{
    try{ localStorage.setItem('synthz:sent', String(sentN() + 1)); }catch(e){}
    try{ frustration(text, false); }catch(e){}
    const chat = chatArr(), msg = { role:'user', content:text }, g0 = gen;
    inp.value = ''; autoGrow(); updateHint();
    chat.push(msg); touchThread(); save(); renderMsgs();
    const card = agentCard(); lane.appendChild(card.el); jump();
    card.set(0);
    const t1 = setTimeout(() => card.set(1), 1100);
    let plan = null;
    if (szOn()){ try{ plan = await agentPlan(text); }catch(e){ try{ SZ.BOT.problem && SZ.BOT.problem('agent'); }catch(x){} } }
    clearTimeout(t1);
    if (!plan) plan = { tema:guessTopic(text), pedido:text, raw:true };
    const same = plan.raw || plan.pedido.trim() === text.trim();
    card.set(1, same ? 'Tu pedido ya era claro: lo paso tal cual' : 'Mejoré tu pedido para que la IA lo entienda mejor');
    await SZ.sleepRaw(550);
    const tl = plan.tema && TOPIC[plan.tema] ? TOPIC[plan.tema].l.toLowerCase() : '';
    const wd = webTake(text);
    const light = isSimple(text, plan) ? lightPick() : null;
    card.set(2, light ? 'Es algo sencillo: uso una IA rápida que gasta menos' : tl ? 'Eligiendo la IA que más sabe de ' + tl : 'Eligiendo la mejor IA para esto');
    const pick = light || agentPick(plan.tema);
    await SZ.sleepRaw(750);
    card.set(3, 'Le paso tu pedido a ' + info(pick).name);
    await SZ.sleepRaw(600); card.stop();
    unlock();
    if (g0 !== gen){ card.el.remove(); return; }                /* cambiaste de chat mientras tanto */
    if (!same) msg.ask = plan.pedido;
    /* v4.2 · internet: decide la regla fija (no el plan de la IA), con lo que escribiste tú */
    if (wd.go){ card.el.remove(); await webPrep(msg, plan.pedido || text, wd.why); if (g0 !== gen) return; }
    if (wantsDeck(text)) msg.deck = true;
    msg.agent = { pick, name:info(pick).name, tl:light ? 'cosas sencillas (gasta menos)' : tl, ask:same ? '' : plan.pedido };
    if (alJump) msg.alHand = 'superior';
    st().model.openrouter = pick; save(); paintSel(); renderTop(false); paintAccent();
    /* v3.4 · si la IA falla, SuperiorSynth NO reintenta con la misma (siempre volvería a fallar): pasa el trabajo a otra IA
       experta en ese tema y sigue sola, sin que tengas que hacer nada. Hasta 3 IAs distintas; solo si todas fallan ves el error. */
    const rx = await runExpert(plan.tema, { onSwap:next => { msg.agent = Object.assign({}, msg.agent, { pick:next, name:info(next).name }); } });
    const ok = rx.ok, cur = rx.cur, lastErr = rx.err;
    if (!ok){ chat.pop(); save(); renderMsgs(); showErr(lastErr); inp.value = text; autoGrow(); updateHint(); if (g0 === gen && !(lastErr && lastErr.aborted)) setTimeout(() => rescue(cur, lastErr), 900); }
    const pickF = cur;
    if (ok && g0 === gen && !alJump) agentChoice(pickF);
    if (ok && g0 === gen && MEM_RX.test(text)) memOffer(text);
    }catch(e){ console.error('[superiorsynth]', e); $$('.agrun', lane).forEach(x => x.remove()); renderMsgs(); toast('Apex tuvo un problema. Tu mensaje quedó guardado: vuelve a intentarlo.'); }
    finally{ unlock(); if (alKeep){ st().model.openrouter = alKeep.m; st().pinned = alKeep.p; save(); try{ paintSel(); renderTop(false); paintAccent(); }catch(e){} } }
    return;
  }
  const th0 = ckey(), m0 = selId(), at0 = Date.now(), needed = needsConn();
  if (!(await ensureConn())) return;
  /* si la ventanita de Puter tardó o cambiaste de chat o de IA mientras tanto, no envío solo: tu texto sigue en la caja */
  if (needed && (ckey() !== th0 || selId() !== m0 || Date.now() - at0 > 15000 || inp.value.trim() !== text)){ toast('¡Listo! Revisa tu mensaje y toca enviar.'); inp.focus(); return; }
  /* v3.4 · si la IA elegida no ve fotos, ya no te bloquea: esta respuesta la da una que sí ve (antes salía «Este modelo no ve imágenes» y no podías enviar) */
  /* v3.7 · y solo por esta respuesta: tu IA elegida se queda elegida (antes te la cambiaba para siempre al adjuntar una foto) */
  let oneModel = null;
  if (alJump && alJump.to === 'auto' && szOn() && selId() !== 'sz:auto') oneModel = 'sz:auto';   /* v4.6 · Relay = la IA Automática, solo por esta respuesta */
  /* v3.8 · foto (o PDF escaneado, o video) con una IA que no ve: una IA que sí ve la describe en texto y responde TU IA elegida.
     Solo si eso falla, responde esa vez la que ve (como antes). Y si ninguna ve, se manda la ficha de la foto: nunca te bloquea. */
  if (ready.some(f => f.kind === 'img') && !info(selId()).vision){
    const v = visionPick();
    if (v && !(await seeForMe(ready, v, text))){ oneModel = v.id; toast(info(selId()).name + ' no ve fotos: esta vez te responde ' + v.name + ', que sí las ve. Después sigues con ' + info(selId()).name + '.'); }
    else if (!v) ready.filter(f => f.kind === 'img' && !f.seen).forEach(f => { f.text = (f.text ? f.text + '\n\n' : '') + '[Foto adjunta: ' + f.name + '. Ahora no hay ninguna IA conectada que vea fotos; si la necesitas, pídele a la persona que cuente qué muestra.]'; });
  }
  try{ localStorage.setItem('synthz:sent', String(sentN() + 1)); }catch(e){}
  try{ frustration(text, false); }catch(e){}
  const chat = chatArr(), sent = files.splice(0).filter(f => f.state === 'ok');
  inp.value = ''; autoGrow(); updateHint(); renderTray();
  const msg = { role:'user', content:text };
  if (alJump) msg.alHand = 'auto';
  if (sent.length) msg.files = sent.map(f => ({ name:f.name, kind:f.kind, text:f.text, thumb:f.thumb }));
  const imgs = sent.filter(f => f.kind === 'img').flatMap(f => f.dataUrls || [f.dataUrl]);
  if (imgs.length) Object.defineProperty(msg, '_imgs', { value:imgs, enumerable:false, writable:true });
  if (text && wantsDeck(text)) msg.deck = true;
  chat.push(msg); touchThread(); save();
  { const wd = text ? webTake(text) : { go:false }; if (wd.why === 'apagado') msg.webNo = true; if (wd.go){ renderMsgs(); await webPrep(msg, text, wd.why); save(); } }
  let okSent = true;
  await runSolo(err => { okSent = false; chat.pop(); save(); renderMsgs(); showErr(err); inp.value = text; files.push(...sent); autoGrow(); updateHint(); renderTray(); }, oneModel ? { model:oneModel } : {});
  if (okSent && text && MEM_RX.test(text)) memOffer(text);
}

/* v3.8 · «mirar por ti»: una IA que ve describe las fotos (y lee su texto) para que la IA elegida, que no ve, entienda igual */
const SEE_PROMPT = 'Describe estas imágenes para alguien que no puede verlas, con todo el detalle útil: copia EXACTO todo el texto que aparezca (letreros, documentos, capturas de pantalla, código, tablas con sus números), y describe personas, objetos, colores, gráficos y lo que esté pasando. Si son páginas de un documento, transcríbelas completas. No respondas la pregunta: solo describe. Escribe en el idioma de esta pregunta: ';
async function seeForMe(list, v, text){
  const todo = list.filter(f => f.kind === 'img' && !f.seen);
  if (!todo.length) return true;
  const wait = setTimeout(() => toast(v.name + ' está mirando tu foto para que ' + info(selId()).name + ' la entienda…'), 600);
  sendBtn.disabled = true; todo.forEach(f => { f.state = 'load'; f.prog = SZ.lang() === 'en' ? 'Looking…' : 'Mirando…'; }); renderTray();
  try{
    for (const f of todo){
      const pics = (f.dataUrls || [f.dataUrl]).filter(Boolean).slice(0, 4), ctl = new AbortController(); ctls.add(ctl);
      let r;
      try{ r = await SZ.askStream(OR, [{ role:'user', content:[{ type:'text', text:SEE_PROMPT + '«' + (text || 'qué hay en la imagen') + '»' }, ...pics.map(u => ({ type:'image_url', image_url:{ url:u } }))] }], { model:v.id, maxTokens:1200, signal:ctl.signal }, () => {}); }finally{ ctls.delete(ctl); }
      if (!r || r.aborted || !String(r.text || '').trim()) return false;
      addUsage(r.prov || SZ.provOf(v.id), r.prompt, r.completion, true, { est:r.est, free:/:free$/.test(v.id) || r.prov === 'synthz', rid:r.rid });
      f.text = (f.text ? f.text + '\n\n' : '') + '[' + (f.scan ? 'PDF escaneado' : f.frames ? 'Fotos del video' : 'Foto') + ' «' + f.name + '», descrita por ' + v.name + ' porque esta IA no ve imágenes]\n' + String(r.text).trim();
      f.seen = true;
    }
    return true;
  }catch(e){ console.warn('[ver foto]', e); return false; }
  finally{ clearTimeout(wait); sendBtn.disabled = false; todo.forEach(f => { f.state = 'ok'; delete f.prog; }); renderTray(); }
}
/* v3.4 · la mejor IA conectada que ve fotos: primero la Automática de SymphorIA (elige sola una que ve), luego cualquiera de la lista */
function visionPick(){
  if (szOn()) return info('sz:auto');
  return cat.list.find(m => m.vision && connected(m.id) && !SZ.isBad(m.id)) || null;
}
/* ---------- v1.3 · Sona te rescata cuando una IA falla o cuando notas que no te entiende ---------- */
const TOPIC_RX = [['codigo', /c[oó]digo|program|funci[oó]n|javascript|python|html|css|sql|bug|error de|script|coding|code\b|website|app\b/i], ['mate', /ecuaci|matem|calcul|derivad|integral|math|equation|algebra|\d+\s*[x×*+\/-]\s*\d+/i], ['estudiar', /explica|estudi|examen|tarea|aprend|resum|homework|study|exam|learn|explain|summar/i], ['correo', /correo|email|e-mail/i], ['marketing', /marketing|publicidad|anuncio|vender|ventas|campa[ñn]a|advert|\bads?\b|sell|sales/i], ['redes', /instagram|tiktok|reel|post|redes|social media/i], ['idiomas', /traduc|ingl[eé]s|franc[eé]s|idioma|translat|english|spanish|french|language/i], ['negocios', /negocio|emprend|empresa|cliente|business|startup|company|customer/i], ['ideas', /idea|nombre para|lluvia de/i], ['escribir', /escrib|texto|carta|historia|poema|redact|writ|essay|letter|story|poem/i]];
function guessTopic(t){ const f = TOPIC_RX.find(([k, rx]) => TOPIC[k] && rx.test(t)); return f ? f[0] : null; }
function altFor(mid, text){
  const tk = guessTopic(text || '');
  const ok = m => m && m.id !== mid && connected(m.id) && !SZ.isBad(m.id);
  const alt = (tk ? recommendTop(tk, 12) : []).find(ok) || (mid !== APODEX && szOn() ? info(APODEX) : null) || [bestUsable(true), bestUsable(false)].find(ok);
  return { tk, alt };
}
async function rescue(mid, err){
  try{ SZ.BOT.problem && SZ.BOT.problem('error'); }catch(e){}
  if (!SZ.BOT || !SZ.BOT.offer || (err && err.aborted) || G) return;
  const q = [...chatArr()].reverse().find(m => m.role === 'user'); if (!q || typeof q.content !== 'string') return;
  const { tk, alt } = altFor(mid, q.content); if (!alt) return;
  let ready = q.content;
  if (szOn()) try{ ready = (await agentPlan(q.content)).pedido; }catch(e){}
  SZ.BOT.offer(info(mid).name + ' falló 😕 ' + (tk ? 'Querías ayuda con ' + TOPIC[tk].l.toLowerCase() + ', y ' : '') + alt.name + ' es parecida y está funcionando ahora. Aquí te dejo tu prompt listo (lo mejoré un poquito). Perdona las interrupciones en tu Flow.', 'disculpa', 'Ir con ' + alt.name, () => { pickModel(alt.id, null); inp.value = ready; autoGrow(); updateHint(); inp.focus(); });
}
/* frustración: palabras de enojo o pedir «Otra vez» seguido → «esa IA no tiene el flow» */
const FRUST = /no sirve|no entiendes|no entendiste|mal(a|isima)? respuesta|est[uú]pid|in[uú]til|que mal|otra vez no|no es eso|te equivocas|equivocad|horrible|p[eé]sim|ya te dije|😡|🤬|😤/i;
let frustN = 0, frustAt = 0;
function frustration(text, regen){
  if (G || mode !== 'solo') return;
  const angry = regen || FRUST.test(text || '') || /!{3,}/.test(text || '') || (text && text.length > 12 && text === text.toUpperCase() && /[A-ZÁÉÍÓÚ]{6}/.test(text));
  if (!angry) return;
  frustN = Date.now() - frustAt < 300000 ? frustN + 1 : 1; frustAt = Date.now();
  if (frustN < (regen ? 2 : 1)) return;
  frustN = 0; try{ SZ.BOT.problem && SZ.BOT.problem('frust'); }catch(e){}
  const mid = selId(), q = [...chatArr()].reverse().find(m => m.role === 'user');
  const { alt } = altFor(mid, (q && typeof q.content === 'string' ? q.content : '') + ' ' + (text || '')); if (!alt) return;
  SZ.BOT.offer('Mmm… parece que ' + info(mid).name + ' no tiene el flow para esto. ' + alt.name + ' tiene más flow 😎 ¿Probamos con ella?', 'guino', 'Cambiar a ' + alt.name, () => { pickModel(alt.id, null); toast('Ahora hablas con ' + alt.name + '. Vuelve a enviar tu mensaje o escribe uno nuevo.'); inp.focus(); });
}
/* v4.0 · las IAs pequeñas a veces se quedan en bucle y repiten la misma frase o el mismo párrafo: se deja una sola vez (fuera de los bloques de código) */
function limpiaBucles(t){
  const s = String(t || ''); if (s.length < 200) return s;
  let inCode = false, prev = '', n = 0; const out = [];
  for (const line of s.split('\n')){
    if (/^\s*```/.test(line)) inCode = !inCode;
    const k = line.trim();
    if (!inCode && k.length > 20 && k === prev){ n++; if (n >= 1) continue; } else { n = 0; }
    if (k) prev = k;
    out.push(line);
  }
  let r = out.join('\n');
  /* el mismo párrafo largo repetido seguido (separado por líneas en blanco) */
  r = r.replace(/(^|\n\n)([^\n`][^\n]{60,})(?:\n\n\2)+(?=\n\n|$)/g, '$1$2');
  return r;
}
async function runSolo(onFail, o = {}){
  const mid = o.model || selId(), chat = chatArr(), g = gen, vis = info(mid).vision, saver = st().sx.saver;
  const slowT = setTimeout(() => { if (busy[mid] === 'think' && SZ.BOT.react) SZ.BOT.react('slow', { auto:mid === 'sz:auto' }); }, 14000);
  /* v4.2 · la IA ya NO decide sola si busca (eso la hacía buscar «porque sí y porque no»): decide la regla fija al enviar.
     Si igual responde que no sabe datos de hoy, Sona te OFRECE buscar; nunca se busca a escondidas. */
  const lastU = [...chat].reverse().find(x => x.role === 'user'), webAuto = false, webOffer = !o.noWeb && mode === 'solo' && !!lastU && !lastU.sources && !lastU.webTried && !lastU.imgId && !lastU.webNo;
  const sent = apiMsgs(chat, vis, { webAsk:webAuto, srv:/^sz:/.test(mid), mid }), naive = apiMsgs(chat, vis, { naive:true }), ck = hashStr(mid + '|' + saver + '|' + effKey() + '|' + JSON.stringify(sent));
  let hold = webAuto ? null : false, webQ = null;
  const holdWeb = txt => { if (hold === false) return false; if (webMaybe(txt)){ hold = true; return true; } hold = false; return false; };
  const canCache = !sent.some(m => Array.isArray(m.content));
  if (works[mid]) works[mid].stop();
  works[mid] = SZ.workView({ model:info(mid).name, inTok:msgCost(sent) });
  const W = works[mid];
  busy[mid] = 'think'; renderMsgs(); renderNow();
  let el = null, rv = null;
  /* v3.3 · la respuesta se ve mientras sigas en ESA conversación (en SuperiorSynth la IA elegida puede cambiar en la lista mientras escribe) */
  const here = () => g === gen && mode === 'solo' && st().chats[ckey()] === chat;
  const mount = () => {
    if (el || !here()) return;
    busy[mid] = 'write'; renderNow();
    const t = $('.think-wrap', lane); if (t) t.remove();
    const e = $('.empty', lane); if (e) e.remove();
    $$('.m.last', lane).forEach(x => x.classList.remove('last'));
    el = botEl(mid); el.classList.add('writing'); el.insertBefore(W.el, $('.body', el)); lane.appendChild(el); stick = true; live = { el, chat };
    const body = $('.body', el), tk = $('.tk', el);
    rv = SZ.mkReveal(body, (s, n) => { tk.textContent = fmt(Math.ceil(s / 5.5)); el.style.setProperty('--p', n ? (s / n).toFixed(3) : 0); follow(); });
  };
  try{
    let r = !o.fresh && canCache ? cacheGet(ck) : null;
    if (r){ r = Object.assign({}, r, { ms:0, cached:true }); st().sx.saved += r.prompt + r.completion; st().sx.hits += 1; save(); mount(); if (rv) rv.push(sinMarcas(r.text)); }
    else {
      const ctl = new AbortController(); ctls.add(ctl);
      try{ r = await SZ.askStream(OR, sent, Object.assign({ model:mid, maxTokens: saver ? 700 : 0, signal:ctl.signal, onReason:t => W.reason(t) }, effortOpts(saver)), txt => { if (holdWeb(txt)) return; txt = sinMarcas(txt); mount(); W.write(txt); if (rv) rv.push(txt); }); }finally{ ctls.delete(ctl); }
      addUsage(r.prov || SZ.provOf(mid), r.prompt, r.completion, true, { est:r.est, free:/:free$/.test(mid) || r.prov === 'synthz', rid:r.rid });
      if (webOffer && !r.aborted && String(r.text || '').length < 2500 && CUTOFF_RX.test(r.text || '')) setTimeout(() => offerWeb(lastU, onFail, o), 1200);
      if (!r.aborted && !r.swapped) SZ.markGood(mid);
      SZ.TEL.msgs++; SZ.TEL.ai = (r.prov || SZ.provOf(mid)).slice(0, 12);
      st().sx.saved += Math.max(0, msgCost(naive) - msgCost(sent)); save();
      if (canCache && !r.aborted && !webQ) cachePut(ck, r);
      /* si la IA se quedó sin espacio (o se cortó la conexión), sigue sola donde quedó: la persona recibe la respuesta completa sin tocar «Continuar» */
      for (let n = 0; n < 3 && !webQ && !r.aborted && !r.swapped && g === gen && (r.finish === 'length' || r.cut); n++){
        const base = r.text, ctl2 = new AbortController(); ctls.add(ctl2);
        const glue = t => (!base || /\s$/.test(base) || /^[\s.,;:!?)\]]/.test(t) || !/[.!?:;)\]*_`]$/.test(base)) ? '' : ' ';
        let r2 = null;
        try{
          r2 = await SZ.askStream(OR, [...sent, { role:'assistant', content:base }, { role:'user', content:'Continúa exactamente donde te quedaste: sigue desde la última palabra, sin repetir nada de lo anterior, sin saludar y sin decir que continúas. Escribe solo lo que falta.' }],
            Object.assign({ model:mid, maxTokens:0, signal:ctl2.signal, onReason:t => W.reason(t) }, effortOpts(saver)), txt => { mount(); const full = sinMarcas(base + glue(txt) + txt); W.write(full); if (rv) rv.push(full); });
        }catch(e){ r2 = null; }
        finally{ ctls.delete(ctl2); }
        if (!r2 || r2.aborted && !r2.text) break;
        addUsage(r2.prov || SZ.provOf(mid), r2.prompt, r2.completion, true, { est:r2.est, free:/:free$/.test(mid) || r2.prov === 'synthz', rid:r2.rid });
        if (/^\(La IA devolvió una respuesta vacía\.\)$/.test(r2.text)) break;
        r = Object.assign({}, r, { text:base + glue(r2.text) + r2.text, prompt:r.prompt + r2.prompt, completion:r.completion + r2.completion, ms:r.ms + r2.ms, finish:r2.finish, cut:r2.cut, aborted:r2.aborted, est:r.est || r2.est });
      }
    }
    if (g !== gen){ if (rv) rv.skip(); return; }
    /* v3.8 · la IA pidió buscar (o dijo que no tiene internet): se busca, se leen las páginas y se le vuelve a preguntar, ya con los datos */
    if (webQ){
      const rv0 = rv; rv = null; W.stop && W.stop(); if (live && live.chat === chat) live = null; if (el) el.remove(); { const t = $('.think-wrap', lane); if (t) t.remove(); } try{ rv0 && rv0.skip(); }catch(e){} if (el) el.remove();
      lastU.webTried = true; delete busy[mid]; renderNow();
      await webPrep(lastU, webQ); save();
      if (g !== gen) return;
      return await runSolo(onFail, Object.assign({}, o, { noWeb:true, fresh:true }));
    }
    /* v4.0 · respuesta vacía: se pide otra vez UNA vez (el servidor ya cambia de IA si una contesta vacío; esto cubre Puter y las demás) */
    if (!r.aborted && !o.retried && /^\(La IA devolvió una respuesta vacía\.\)$/.test(String(r.text || '').trim())){
      const rv0 = rv; rv = null; W.stop && W.stop(); if (live && live.chat === chat) live = null; try{ rv0 && rv0.skip(); }catch(e){} if (el) el.remove();
      delete busy[mid]; renderNow();
      return await runSolo(onFail, Object.assign({}, o, { fresh:true, retried:true }));
    }
    if (!r.aborted) r.text = limpiaBucles(r.text);
    /* v4.0 · las marcas de título y memoria se quitan del texto y se usan */
    { const mk = marcas(r.text); if (mk.text !== String(r.text || '').trim()) r.text = mk.text || (SZ.lang() === 'en' ? '(The AI returned an empty answer.)' : '(La IA devolvió una respuesta vacía.)'); if (!r.aborted){ titleSet(chat, mk.title); memNext = mk.mem; } }
    const tail = r.aborted ? ' · detenido' : r.cut ? ' · se cortó la conexión' : r.finish === 'length' ? ' · se cortó porque era muy larga (toca «Continuar»)' : '';
    const who = r.swapped ? ' · se acabó tu saldo de Puter este mes; respondió ' + (r.real || 'otra IA') : '';
    W.write(r.text); W.finish({ ms:r.ms, real:r.real || '' });
    const work = { ms:Math.round(r.ms || 0), words:W.state.words, real:r.real || '', steps:W.state.steps.map(([a, b]) => [Math.round(a), b]), reason:(r.reasoning || '').slice(0, 4000) || undefined };
    const msg = { role:'assistant', content:r.text, work, meta:metaOf(r) + SZ.coinNote(mid, r) + tail + who + (r.via ? ' · vía ' + r.via + ' (prueba de Sinapse)' : ''), model:mid, cont: !!(r.cut || r.finish === 'length') || undefined };
    chat.push(msg); touchThread(); save();
    if (here()){
      if (el && !el.isConnected){ lane.appendChild(el); }   /* algo repintó la conversación mientras escribía: la respuesta vuelve a su sitio */
      mount(); rv.push(r.text);
      await rv.end();
      el.classList.remove('writing'); el.style.removeProperty('--p'); el._raw = r.text; el._ck = ckey(); el._ci = chat.length - 1; el.dataset.ci = el._ci;
      $('.body', el).innerHTML = md(r.text);
      { const u = [...chat].reverse().find(x => x.role === 'user'); el._sources = u && u.sources && u.sources.length ? u.sources : null; }
      finishBot(el, msg.meta, true, msg.cont); follow();
      qualityAfter(el, chat, msg, mid, r);   /* v3.4 · otra IA revisa la lógica y, si hace falta, la corrige */
      if (!r.aborted) synAuto(el);
      if (!r.aborted) codeAfter(el, chat);   /* v2.4 · la página se prueba sola y, si tiene errores, la IA la arregla */
      if (SZ.BOT.react && !r.aborted && !G) SZ.BOT.react('done', { cool:180000 });
    }
  }catch(err){
    if (rv) rv.skip();
    if (g === gen && !(err && err.aborted) && !o.noRescue) setTimeout(() => rescue(mid, err), 900);
    W.finish({ error:!(err && err.aborted), aborted:err && err.aborted });
    if (el) el.remove();
    if (err && err.gone) hideBadModel(mid, err);
    if (g === gen && onFail) onFail(err);
  }finally{ clearTimeout(slowT); if (live && live.chat === chat) live = null; if (g === gen){ delete busy[mid]; renderNow(); if (!el){ const t = $('.think-wrap', lane); if (t) t.remove(); } } }
}
/* una IA que falló por culpa del modelo (ya no existe o no tiene servidores) se esconde y se cambia por otra que sí funcione */
function hideBadModel(id, err){
  SZ.markBad(id);
  const name = info(id).name;
  setCatalog(cat.list.filter(m => m.id !== id), cat.t, cat.status);
  if (st().pinned === id) delete st().pinned;
  if (st().cmp.includes(id)) st().cmp = st().cmp.filter(x => x !== id);
  save();
  const b = bestUsable(true) || bestUsable(false);
  if (b && b.id !== id && selId() === id){ pickModel(b.id, null); if (err) err.message = name + ' no está funcionando ahora mismo, así que la escondí de la lista. Te cambié a ' + b.name + ': vuelve a enviar tu mensaje.'; }
  else if (err) err.message = name + ' no está funcionando ahora mismo, así que la escondí de la lista. Elige otra IA y vuelve a enviar.';
  renderList({ keep:true });
}
SZ.badReady.then(set => { if (!set.size || !cat.list.length) return; const before = cat.list.length; setCatalog(cat.list.filter(m => !SZ.isBad(m.id)), cat.t, cat.status); if (cat.list.length !== before){ renderList({ keep:true }); fixModel(true); } });
async function regen(){
  const chat = chatArr();
  try{ frustration('', true); }catch(e){}
  if (mode !== 'solo' || Object.keys(busy).length || !chat.length || chat[chat.length - 1].role !== 'assistant') return;
  /* si la respuesta era favorita, se queda: la nueva llega debajo (tu pregunta se repite) */
  if (chat[chat.length - 1].star){
    const q = [...chat].reverse().find(m => m.role === 'user'); if (!q) return;
    const again = { role:'user', content:q.content, again:true }; if (q.files) again.files = q.files;
    chat.push(again); touchThread(); save(); renderMsgs(); toast('Tu favorita se queda guardada ★ Te traigo otra respuesta debajo.');
    await runSolo(err => { const i = chat.lastIndexOf(again); if (i > -1) chat.splice(i, 1); save(); renderMsgs(); showErr(err, { regen:true }); }, { fresh:true });
    return;
  }
  const last = chat.pop(); save();
  await runSolo(err => { chat.push(last); save(); renderMsgs(); showErr(err, { regen:true }); }, { fresh:true });
}


/* v4.2 · la IA dijo que no tiene datos de hoy: Sona te pregunta antes de buscar (tú decides; no se busca a escondidas) */
function offerWeb(lastU, onFail, o){
  if (!lastU || lastU.sources || lastU.webTried || !SZ.BOT || !SZ.BOT.offer) return;
  const en = SZ.lang() === 'en';
  SZ.BOT.offer(en ? 'This AI says it has no current data for that. Want me to search the web and answer with sources?' : 'Esta IA dice que no tiene datos de hoy para eso. ¿Lo busco en internet y te respondo con fuentes?', 'pensando',
    en ? 'Search the web' : 'Buscar en internet', async () => { lastU.webTried = true; await webPrep(lastU, String(lastU.content || '').slice(0, 300), 'tu'); save(); renderMsgs(); await runSolo(onFail, Object.assign({}, o, { noWeb:true, fresh:true })); });
}
/* ---------- v3.4 · Calidad de las respuestas (pedido de Sammuel, 28 oct) ----------
   Dos pasos, para que todas las IAs respondan con lógica y se entiendan:
   1) qualitySystem(): unas instrucciones cortas de «experto» que viajan con cada mensaje (las pone apiMsgs).
   2) qualityAfter(): cuando termina la respuesta, otra IA (la que mejor razona entre las gratis; con fotos, una que ve)
      la revisa: lógica, cálculos, datos, que responda lo pedido y lo que se ve en las fotos.
      Si está bien → «✓ Revisada». Si tiene errores → la respuesta se cambia por la corregida («✨ Mejorada» · Ver original).
      Tiene 28 s como máximo; si tarda más o falla, se queda la respuesta de antes (nunca se pierde nada).
   Se apaga en Ajustes › Respuestas › «Revisión de calidad». Las instrucciones del revisor viven en el servidor (api/ai.js). */
/* v4.0 · las mismas reglas del «cerebro» del servidor (api/_cerebro.js) para CUALQUIER IA que elijas (Puter, OpenRouter, Groq…):
   la fecha de hoy, cómo responde un experto en ese tipo de trabajo y, si es difícil, pensar → resolver → revisar antes de responder. */
const Q_HARD = /\b(demuestra|resuelve|calcula|deriva|integral|ecuaci[oó]n|probabilidad|optimiza|algoritmo|depura|debug|refactor|por qu[eé] (falla|no funciona)|paso a paso|a fondo|analiza|compara|eval[uú]a|estrategia|dise[nñ]a|arquitectura|acertijo|l[oó]gica|cu[aá]nt[oa]s?|prove|solve|calculate|equation|probability|algorithm|step by step|in depth|analy[sz]e|compare|evaluate|strategy|design|riddle|puzzle|how (many|much))\b/i;
const Q_EASY = /^\W*(hola+|holi|buenas|buen(os)? d[ií]as|hey|hi|hello|gracias|thanks|thank you|ok(ay)?|vale|listo|s[ií]|no|dale|c[oó]mo est[aá]s|how are you|qu[eé] tal|chao|bye)\b[\s\W]*$/i;
const Q_KIND = [['code', /\b(c[oó]digo|code|programa|funci[oó]n|function|script|python|javascript|html|css|sql|bug|error|react|node|java|api)\b|```/i],
  ['translate', /\b(traduc\w*|translat\w*)\b/i], ['data', /\b(calcul\w*|porcentaje|percent|promedio|average|tabla|datos|data|matem\w*|math|ecuaci[oó]n|equation|\d+\s*[-+*/^x×÷]\s*\d+)\b/i],
  ['summary', /\b(resum\w*|summar\w*|puntos clave|key points|tl;?dr)\b/i], ['write', /\b(escrib\w*|redact\w*|write|correo|email|carta|ensayo|essay|art[ií]culo|historia|story|poema|poem|post|discurso)\b/i]];
const Q_JOB = {
  code:'Como ingeniero de software sénior: código COMPLETO que funcione a la primera, en bloques con su lenguaje, sin «…»; explica la causa exacta de los errores y considera casos raros. No inventes funciones ni librerías.',
  translate:'Como traductor profesional: traduce el sentido, natural y con el mismo tono y formato; conserva nombres, código y cifras.',
  data:'Como experto en matemáticas y datos: plantea, resuelve paso a paso mostrando cada operación, RECALCULA cada número y termina con el resultado en negrita y con unidades.',
  summary:'Como experto en síntesis: la idea central en una frase y luego los puntos clave en viñetas cortas con datos concretos; nada que no esté en el material.',
  write:'Como escritor profesional: voz natural, ritmo, adaptado a quién lo lee; sin clichés ni relleno; texto listo para usar.',
  reason:'Como analista experto: primero la conclusión o recomendación, luego las razones más fuertes con sus supuestos; si hay opciones, compáralas con criterios concretos y elige.'
};
const Q_NATIVE = /gpt-oss|qwen3|deepseek-r1|qwq|gemini-(2\.5|[3-9])|claude|gpt-[5-9]|\bo[34]\b|grok|kimi|glm-4\.[5-9]|magistral/i;
function qualitySystem(saver, ask, mid){
  const day = new Date().toLocaleDateString(SZ.lang() === 'en' ? 'en-US' : 'es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  if (saver) return 'Hoy es ' + day + '. Piensa en silencio antes de responder; revisa cálculos y lógica. No inventes datos.';
  const q = String(ask || '').trim(), easy = !q || Q_EASY.test(q);
  const kind = (Q_KIND.find(([, rx]) => rx.test(q)) || ['reason'])[0];
  const hard = !easy && (effKey() === 'deep' || (Q_HARD.test(q) ? 2 : 0) + (/\d\s*[-+*/^=]\s*\d/.test(q) ? 2 : 0) + (/```/.test(q) ? 2 : 0) + (q.length > 400 ? 1 : 0) + (/code|data/.test(kind) ? 1 : 0) >= 3);
  const base = 'Hoy es ' + day + '. Responde como los mejores asistentes del mundo, con precisión y criterio. Empieza por la respuesta (sin saludos, sin repetir la pregunta, sin relleno) y luego explica lo necesario.'
    + ' No inventes datos, citas, enlaces ni funciones: si no lo sabes con certeza o pudo cambiar después de lo que aprendiste, dilo en una frase. Si la pregunta es ambigua, elige la lectura más probable y dilo.'
    + ' Mantén el hilo de la conversación. Markdown limpio (listas, tablas al comparar, código en bloques con su lenguaje); el largo justo. Responde siempre en el idioma en que te escribe la persona.'
    + ' Si hay imágenes o archivos, básate en lo que de verdad se ve o dice en ellos.';
  if (easy) return base + ' Esto es sencillo: responde directo y breve, con calidez.';
  const think = !hard ? '' : Q_NATIVE.test(String(mid || ''))
    ? ' ES DIFÍCIL: razona con cuidado paso a paso antes de responder y revisa el resultado (rehaz los cálculos, prueba el código con un ejemplo, busca casos raros). En la respuesta muestra los pasos clave.'
    : ' ES DIFÍCIL: escribe PRIMERO tu razonamiento dentro de <think> y </think> (qué se pide, plan, resolverlo paso a paso y REVISARLO: rehaz los cálculos por otro camino, prueba el código con un ejemplo, busca contradicciones). Cierra </think> y DESPUÉS escribe la respuesta final limpia.';
  return base + ' ' + Q_JOB[kind] + think;
}
const REV_MS = 28000;
/* las IAs de primer nivel no necesitan que otra más pequeña las revise */
const REV_SKIP = /claude-(opus|sonnet|fable)|gpt-5(?![\w.-]*(nano|mini|lite))|gpt-6|gemini-[\d.]+-pro|grok-[4-9]|\bo[34]\b/i;
const revOn = () => SZ.CFG.review !== false;
function revWanted(mid, msg, r){
  if (!revOn() || G || trialOn || mode !== 'solo' || !szOn() || !r || r.aborted || msg.cont) return false;
  if (REV_SKIP.test(mid) || REV_SKIP.test(r.real || '')) return false;
  const t = msg.content || '';
  if (t.length < 160 || /^\(La IA devolvió una respuesta vacía\.\)$/.test(t)) return false;   /* un saludo o un «sí» no necesita revisión */
  if (/```html/i.test(t) && t.length > 4000) return false;                                 /* las páginas ya las prueba SynthCode */
  return true;
}
function revPacket(chat, msg){
  const i = chat.lastIndexOf(msg), u = [...chat.slice(0, i)].reverse().find(x => x.role === 'user');
  if (!u) return null;
  let q = String(u.ask || u.content || '');
  let room = 9000;
  (u.files || []).forEach(f => { if (f.text && room > 0){ const s = f.text.slice(0, Math.min(6000, room)); room -= s.length; q += '\n\n[Archivo adjunto: ' + f.name + ']\n' + s; } });
  const ui = chat.lastIndexOf(u);
  const ctx = chat.slice(Math.max(0, ui - 4), ui).filter(m => typeof m.content === 'string' && !m.imgId).map(m => ({ role:m.role, content:m.content.slice(0, 900) }));
  return { q:q.trim() || 'Mira la imagen.', imgs:(u._imgs || []).slice(0, 4), ctx };
}
/* v3.6 · estos avisos van dentro de la respuesta, donde el traductor no entra: se escriben ya en el idioma elegido */
const RL = (es, en) => SZ.lang() === 'en' ? en : es;
function revChip(el, cls, html){
  let c = $('.qrev', el);
  if (!c){ c = document.createElement('div'); const meta = $('.meta', el); if (meta) meta.before(c); else el.appendChild(c); }
  c.className = 'qrev ' + cls; c.innerHTML = html; return c;
}
const REV_ICO = { ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  fix:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>' };
/* lo que se ve debajo de una respuesta ya revisada (también al volver a abrir el chat) */
function revBadge(el, m){
  if (!m || !m.rev) return;
  if (m.rev === 'ok') revChip(el, 'ok', REV_ICO.ok + '<span>' + RL('Revisada: la lógica está bien', 'Reviewed: the logic is sound') + '</span>');
  else revChip(el, 'fix', REV_ICO.fix + '<span>' + RL('Mejorada en la revisión', 'Improved in review') + (m.revNote ? ': ' + esc(m.revNote) : '') + '</span>' + (m.orig ? '<button type="button" class="lnk qrev-o" aria-pressed="false">' + RL('Ver original', 'See original') + '</button>' : ''));
}
async function qualityAfter(el, chat, msg, mid, r){
  if (!revWanted(mid, msg, r)) return;
  const pk = revPacket(chat, msg); if (!pk) return;
  /* v3.7 · un saludo o charla corta («hola», «gracias», «cómo estás») no se revisa aunque la respuesta sea larga */
  if (pk.q.length < 40 && /^\W*(hola|holi|buenas|buenos d[ií]as|hey|hi|hello|gracias|thanks|thank you|ok|vale|listo|c[oó]mo est[aá]s|how are you|qu[eé] tal|chao|adi[oó]s|bye)\b/i.test(pk.q.trim())) return;
  if (SZ.isGuestQ() && !SZ.turnNow()) return;   /* sin el mensaje que la pidió, la revisión costaría otro mensaje de prueba: no se hace */
  const g0 = gen, draft = msg.content;
  revChip(el, 'run', '<i class="qspin" aria-hidden="true"></i><span>' + RL('Revisando la lógica de la respuesta…', 'Checking the logic of the answer…') + '</span>');
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), REV_MS); ctls.add(ctl);
  let d = null;
  try{
    const res = await fetch('/api/ai', { method:'POST', headers:SZ.szHeaders(), signal:ctl.signal, body:JSON.stringify({ action:'review', q:pk.q, imgs:pk.imgs, ctx:pk.ctx, draft, turn:SZ.turnNow() }) });
    d = await res.json().catch(() => null); if (!res.ok) d = null;
  }catch(e){ d = null; }
  finally{ clearTimeout(tm); ctls.delete(ctl); }
  if (d && d.limit) try{ SZ.szqSet({ used:+d.used || 0, limit:+d.limit }); }catch(e){}
  /* v3.6 · sin cuenta, la revisión cuenta en el mismo mensaje: igual se pinta lo que dice el servidor */
  if (d && /^\d+\/\d+(\/\d+)?$/.test(String(d.guest || ''))) try{ const [u, m, l] = String(d.guest).split('/'); SZ.szqSet({ guest:{ used:+u, max:+m, left:l != null ? +l : null } }); }catch(e){}
  /* si cambiaste de chat, la respuesta se borró o ya llegó otra encima, no se toca nada */
  const alive = chat.includes(msg) && msg.content === draft;
  if (!d || !alive || !d.verdict){ const c = $('.qrev', el); if (c) c.remove(); return; }
  if (d.verdict === 'ok'){ msg.rev = 'ok'; save(); if (g0 === gen && el.isConnected) revBadge(el, msg); return; }
  msg.rev = 'fix'; msg.orig = draft; msg.revNote = String(d.note || '').slice(0, 140); msg.revBy = d.by || ''; d.text = quitaMarcas(d.text); msg.content = d.text;
  touchThread(); save();
  if (g0 !== gen || !el.isConnected) return;
  const body = $('.body', el);
  el._raw = d.text; body.innerHTML = md(d.text); codeButtons(body); if (el._sources) citeLinks(body, el._sources);
  body.animate([{ opacity:.35, filter:'blur(3px)' }, { opacity:1, filter:'blur(0)' }], { duration:520, easing:'cubic-bezier(.22,1,.36,1)' });
  revBadge(el, msg);
  try{ SZ.BOT.react && SZ.BOT.react('done', { cool:120000 }); }catch(e){}
}
/* «Ver original» ↔ «Ver mejorada» */
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.qrev-o'); if (!b) return;
  const el = b.closest('.m'), m = el && chatArr()[+el.dataset.ci]; if (!m || !m.orig) return;
  const showO = b.getAttribute('aria-pressed') !== 'true', body = $('.body', el);
  body.innerHTML = md(quitaMarcas(showO ? m.orig : m.content)); codeButtons(body);
  b.setAttribute('aria-pressed', String(showO)); b.textContent = showO ? RL('Ver mejorada', 'See improved') : RL('Ver original', 'See original');
});
/* ---------- v3.8 · ¿la IA que elegiste funciona de verdad? ----------
   Al elegir una IA (o sumarla a Comparar) se le hace una pregunta mínima. Si no responde:
   · se esconde de la lista (si ya no existe, 12 h y para todos; si está llena, 10 min y vuelve sola),
   · vuelves a la IA que tenías, y una ventana te pregunta para qué la querías:
     «Solo quería probar» → sigues navegando, sin las IAs caídas;  «La quiero para…» → te recomienda la que sí funciona y mejor sirve para eso.
   Para no gastar: el resultado se guarda (bien 10 min, llena 2 min, caída 30 min) y en el servidor se comparte entre todos.
   Las de Sinapse se prueban en /api/ai (no gasta tu batería); Puter y tus llaves, con una respuesta de 4 palabras como mucho. */
const HEALTH = new Map(), H_TTL = { ok:10 * 60e3, busy:2 * 60e3, down:30 * 60e3 };
function iaCached(id){ const h = HEALTH.get(id); return h && h.v && Date.now() - h.t < H_TTL[h.v] ? h.v : null; }
const iaSkip = id => !id || id === 'sz:auto' || /^tr:/.test(id) || !connected(id);
function iaNote(id, v, shared){
  HEALTH.set(id, { v, t:Date.now() });
  if (v === 'ok'){ SZ.markGood(id); return; }
  if (v === 'down') SZ.markBad(id, !shared); else SZ.markSick(id, 10 * 60e3);
  iaDrop(id);
}
/* sacarla de todo: lista, Comparar, la fijada y los filtros (los filtros leen de cat.list) */
function iaDrop(id){
  if (!cat.list.some(m => m.id === id)) return;
  setCatalog(cat.list.filter(m => m.id !== id), cat.t, cat.status);
  if (st().pinned === id) delete st().pinned;
  if (st().cmp.includes(id) && mode !== 'cmp') st().cmp = st().cmp.filter(x => x !== id);
  save();
  try{ renderList({ keep:true }); }catch(e){}
}
async function szPing(ids){
  const r = await fetch('/api/ai', { method:'POST', headers:SZ.szHeaders(), body:JSON.stringify({ action:'ping', ids }) });
  if (!r.ok) throw new Error('ping ' + r.status);
  return (await r.json()).status || {};
}
function iaProbe(id){
  if (iaSkip(id)) return Promise.resolve('ok');
  const c = iaCached(id); if (c) return Promise.resolve(c);
  const h = HEALTH.get(id); if (h && h.p) return h.p;
  const p = (async () => {
    if (/^sz:/.test(id)){
      try{ const v = (await szPing([id]))[id]; return v === 'down' || v === 'busy' ? v : 'ok'; }
      catch(e){ return 'ok'; }   /* sin conexión con Sinapse: no es culpa de la IA, no se esconde */
    }
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 15000);
    try{ const r = await SZ.askStream(OR, [{ role:'user', content:'Responde solo: ok' }], { model:id, maxTokens:4, signal:ctl.signal }, () => {}); return r && r.aborted ? 'busy' : 'ok'; }
    catch(e){ return e && e.gone ? 'down' : e && (e.aborted || e.name === 'AbortError') ? 'busy' : 'ok'; }   /* un error de tu cuenta o tu saldo no es «IA caída» */
    finally{ clearTimeout(tm); }
  })();
  HEALTH.set(id, { p });
  return p.then(v => { iaNote(id, v, /^sz:/.test(id)); return v; });
}
/* al abrir la lista: las de SymphorIA se revisan de a 4 (una vez cada 10 min; el servidor guarda la respuesta para todos) */
let iaSweepT = 0;
async function iaSweep(){
  if (Date.now() - iaSweepT < 10 * 60e3 || !szOn()) return; iaSweepT = Date.now();
  const ids = cat.list.filter(m => /^sz:/.test(m.id) && !iaSkip(m.id) && !iaCached(m.id)).map(m => m.id);
  for (let i = 0; i < ids.length; i += 4){
    try{ const st0 = await szPing(ids.slice(i, i + 4)); Object.keys(st0).forEach(id => { if (['ok', 'busy', 'down'].includes(st0[id])) iaNote(id, st0[id], true); }); }
    catch(e){ break; }
  }
}
/* la IA que mejor sirve para lo que escribiste, entre las que SÍ responden ahora */
async function iaFor(text, not){
  const tk = guessTopic(text || ''), seen = new Set([not]);
  const list = [...(tk ? recommendTop(tk, 12) : []), bestUsable(true), bestUsable(false), ...cat.list.filter(m => m.free)].filter(m => m && !seen.has(m.id) && (seen.add(m.id), true) && connected(m.id) && !SZ.isBad(m.id));
  const tr = x => SZ.lang() === 'en' && SZ.__syn && SZ.__syn.trStr ? SZ.__syn.trStr(x) : x, topic = tk ? tr(TOPIC[tk].l) : '';
  for (const m of list.filter(m => m.id !== 'sz:auto').slice(0, 4)){ if ((await iaProbe(m.id)) === 'ok') return { id:m.id, name:tr(m.name), topic }; }
  return szOn() ? { id:'sz:auto', name:tr(info('sz:auto').name), topic } : null;
}
function iaAsk(id, why, from, name){
  name = name || (info(id) || {}).name || id;
  if (SZ.lang() === 'en' && SZ.__syn && SZ.__syn.trStr) name = SZ.__syn.trStr(name);
  try{ dispatchEvent(new CustomEvent('sz-ia-caida', { detail:{ id, name, why, from } })); }
  catch(e){ toast(name + ' no está respondiendo ahora. La quité de la lista: elige otra.'); }
}
/* elegiste una IA: se queda elegida mientras se comprueba (sin esperar); si no responde, vuelves a la de antes */
function iaAfterPick(id, prev){
  if (iaSkip(id)) return;
  const name = info(id).name;
  iaProbe(id).then(v => {
    if (v === 'ok' || selId() !== id) return;
    const back = prev && prev !== id && !SZ.isBad(prev) && connected(prev) ? prev : (bestUsable(true) || bestUsable(false) || {}).id;
    if (back) pickModel(back, null);
    iaAsk(id, v, 'solo', name);
  });
}
/* Comparar: primero se comprueba y solo se suma si responde */
async function iaThenAdd(id, node){
  if (iaSkip(id) || iaCached(id) === 'ok') return addToCompare(id, node);
  const name = info(id).name, slow = setTimeout(() => toast('Comprobando que ' + name + ' responde…'), 450);
  const v = await iaProbe(id); clearTimeout(slow);
  if (v === 'ok') return addToCompare(id, node);
  closeSide(); iaAsk(id, v, 'cmp', name);
}
/* ---------- comparar: las respuestas llegan en orden, sin cajas vacías, y puedes sumar IA después ---------- */
/* «Esta tiene más Flow»: cada respuesta trae una carita buena de Sona, distinta a las demás */
function flowBtn(C){ const f = SZ.randomGoodFace(C.faces); C.faces.add(f); return '<button class="flowb" type="button" title="Sigue la conversación con esta IA"><i aria-hidden="true">' + SZ.face(f, 24) + '</i>Esta tiene más Flow</button>'; }
function flipAdd(grid, el){
  const kids = [...grid.children].filter(k => k.classList.contains('cmp-card')), before = kids.map(k => k.getBoundingClientRect());
  el.classList.add('arrive');
  const vote = $('.vote', grid); if (vote) grid.insertBefore(el, vote); else grid.appendChild(el);
  if (SZ.reduce || root.classList.contains('noanim')) return;
  kids.forEach((k, i) => { const a = before[i], b = k.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top, sx = a.width / (b.width || 1); if (Math.abs(dx) + Math.abs(dy) > 1 || Math.abs(sx - 1) > .01) k.animate([{ transform:'translate(' + dx + 'px,' + dy + 'px) scaleX(' + sx + ')', transformOrigin:'left top' }, { transform:'none', transformOrigin:'left top' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' }); });
}
function newCmpRun(text, at){
  const run = ++cmpRun, node = document.createElement('div'); node.className = 'cmp-run';
  node.appendChild(userEl(text, at && at.files));
  const wait = document.createElement('div'); wait.className = 'cmp-wait';
  const grid = document.createElement('div'); grid.className = 'cmp-grid';
  const note = document.createElement('p'); note.className = 'cmp-note'; note.textContent = 'Para ahorrar, en Comparar cada IA responde más corto y sin el historial. Si repites la misma pregunta, sale de la caché gratis.';
  node.append(wait, grid, note);
  cmpLast = { run, text:at ? at.ask : text, node, grid, wait, cards:new Map(), done:[], blind:!!st().battle, n:0, faces:new Set() };
  parkComposer(); setFresh(false); lane.innerHTML = ''; lane.appendChild(node); jump();
  return cmpLast;
}
function cardEl(C, mid){
  const m = info(mid), card = document.createElement('div');
  C.n++; card._order = C.n; card._mid = mid;
  card.className = 'cmp-card live'; if (!C.blind) card.style.cssText = brandVars(m); else card.style.setProperty('--c', vendorColor(m.vendor));
  card.innerHTML = '<div class="who">' + (C.blind ? '<span class="av xs" style="--vc:#c9566c">?</span><b>IA sorpresa ' + 'ABCDEFGH'[C.n - 1] + '</b>' : av(m, 'xs') + '<b>' + esc(m.name) + '</b>') + '<span class="stat">escribiendo…</span></div><div class="body"></div><div class="meta"></div>';
  if (!C.blind) card.dataset.mid = mid;
  C.cards.set(mid, card);
  return card;
}
function finishCard(C, card, text, meta){
  card._raw = text; card._meta = meta; card.classList.remove('live');
  const body = $('.body', card); body.innerHTML = md(text); codeButtons(body);
  $('.meta', card).innerHTML = C.blind ? '<span>Datos ocultos hasta que votes</span>' : '<span>' + esc(meta) + '</span>' + (card._order === 1 ? '<span class="badge-fast">⚡ llegó primero</span>' : '');
  if (card._order === 1 && !C.blind) card.classList.add('fast');
  card.insertAdjacentHTML('beforeend', '<div class="acts"><button class="act" data-a="copy">' + COPY + 'Copiar</button>' + (C.blind ? '' : flowBtn(C)) + '</div>');
  $('.stat', card).textContent = 'listo';
}
function cmpJob(mid, C){
  if (C.cards.has(mid) || jobOwn[mid]) return;
  const m = info(mid), tok = {}, live = () => C.run === cmpRun && cmpLast === C;
  jobOwn[mid] = tok; busy[mid] = 'think'; renderNow();
  if (C.vote){ C.vote.remove(); C.vote = null; }
  const pill = document.createElement('span'); pill.style.cssText = C.blind ? '' : brandVars(m); pill.innerHTML = (C.blind ? '<span class="av xs" style="--vc:#c9566c">?</span>Una IA' : av(m, 'xs') + esc(m.name)) + ' está pensando <span class="pxw">' + SZ.pixelGrid() + '</span>'; C.wait.appendChild(pill);
  const pxr = SZ.pixelRun($('.pxw', pill), C.n + Math.floor(Math.random() * 10));
  let card = null, rv = null;
  const mount = () => {
    if (card || !live()) return;
    pill.classList.add('out'); setTimeout(() => pill.remove(), 420);
    card = cardEl(C, mid); flipAdd(C.grid, card); follow();
    busy[mid] = 'write'; renderNow();
    rv = SZ.mkReveal($('.body', card), () => follow());
  };
  const ck = hashStr('cmp|' + mid + '|' + C.text), hit = cacheGet(ck);
  const ctl = new AbortController(); ctls.add(ctl);
  const stopPx = () => { try{ pxr.stop(); }catch(e){} };
  const p = hit ? Promise.resolve(Object.assign({}, hit, { ms:0, cached:true })) : SZ.askStream(OR, [{ role:'user', content:C.text }], { model:mid, signal:ctl.signal, maxTokens:800 }, txt => { if (!live()) return; mount(); if (rv) rv.push(txt); });
  return p.finally(() => { ctls.delete(ctl); stopPx(); }).then(async r => {
    if (r.cached){ st().sx.hits += 1; st().sx.saved += (r.prompt || 0) + (r.completion || 0); save(); }
    else { addUsage(r.prov || SZ.provOf(mid), r.prompt, r.completion, true, { est:r.est, free:/:free$/.test(mid) || r.prov === 'synthz', rid:r.rid }); SZ.TEL.msgs++; if (!r.aborted){ cachePut(ck, r); if (!r.swapped) SZ.markGood(mid); } }
    if (!live()) return;
    mount(); if (!card) return;
    rv.push(r.text); await rv.end();
    finishCard(C, card, r.text, metaOf(r) + SZ.coinNote(mid, r) + (r.cached ? ' · respuesta guardada, no gastó nada' : '') + (r.aborted ? ' · detenido' : '') + (r.swapped ? ' · se acabó tu saldo de Puter este mes; respondió ' + (r.real || 'otra IA') : ''));
    C.done.push({ card, mid, ms:r.ms, ttft:r.ttft || r.ms });
  }).catch(err => {
    if (err && err.gone){ SZ.markBad(mid); setCatalog(cat.list.filter(m => m.id !== mid), cat.t, cat.status); err.message = info(mid).name + ' no está funcionando ahora mismo: la escondí de la lista. Quítala y suma otra.'; }
    if (rv) rv.skip();
    pill.classList.add('out'); setTimeout(() => pill.remove(), 420);
    if (!live()) return;
    if (!card){ card = cardEl(C, mid); flipAdd(C.grid, card); }
    card.classList.remove('live');
    $('.body', card).innerHTML = '<span style="color:#ffb3a7">' + esc(err.aborted ? 'Detenido.' : err.message) + '</span>'; $('.meta', card).textContent = 'sin respuesta'; $('.stat', card).textContent = err.aborted ? 'detenido' : 'no respondió';
  }).finally(() => {
    if (jobOwn[mid] === tok){ delete jobOwn[mid]; delete busy[mid]; }
    renderNow();
    if (live() && !Object.keys(jobOwn).length && C.blind && C.done.length > 1 && !C.voted){ C.vote = battleVote(C.grid, C.done, C); }
  });
}
async function compare(){
  if (isLocked()){ lockNudge(); return; }
  const text = inp.value.trim(), ready = files.filter(f => f.state === 'ok'); if (!text && !ready.length) return;
  if (Object.keys(busy).length){ toast('Espera a que terminen de responder, o detenlas con el botón ■.'); return; }
  const ids = st().cmp.slice();
  if (ids.length < 2){ toast('Agrega otra IA con el botón +.'); openSide('add'); return; }
  /* v3.8 · Comparar también con archivos: cada IA recibe el mismo texto sacado de los archivos (las fotos, descritas por una IA que ve) */
  if (files.some(f => f.state === 'load')){ toast('Espera a que terminen de cargar los archivos.'); return; }
  if (!budgetOk()) return;
  try{ SZ.setTurn(text + '|' + Date.now()); }catch(e){}
  if (!(await ensureConn())) return;
  if (ready.some(f => f.kind === 'img' && !f.seen)){
    const v = visionPick();
    if (!v || !(await seeForMe(ready, v, text))) ready.filter(f => f.kind === 'img' && !f.seen).forEach(f => { f.text = (f.text ? f.text + '\n\n' : '') + '[Foto adjunta: ' + f.name + ' (no se pudo describir ahora)]'; f.seen = true; });
  }
  const sent = files.splice(0).filter(f => f.state === 'ok'); renderTray();
  const ask = (text || 'Mira los archivos adjuntos.') + sent.map(f => f.text ? '\n\n[Archivo adjunto: ' + f.name + ']\n```\n' + f.text.slice(0, Math.floor(24000 / sent.length)) + '\n```' : '').join('');
  inp.value = ''; autoGrow(); updateHint();
  /* v4.2 · Comparar sigue la MISMA regla de internet que el chat normal: si toca buscar, se busca una sola vez y todas las IAs reciben los mismos resultados */
  const wd = text ? webTake(text) : { go:false }, wm = { role:'user', content:text };
  if (wd.go) await webPrep(wm, text, wd.why);
  const ask2 = wm.ask ? wm.ask + (ask.length > text.length ? ask.slice(text.length) : '') : ask;
  const C = newCmpRun(text, sent.length || wm.sources ? { ask:ask2, files:sent.map(f => ({ name:f.name, kind:f.kind, thumb:f.thumb })) } : null);
  if (sent.length || wm.sources) C.msg = Object.assign({ role:'user', content:text }, sent.length ? { files:sent.map(f => ({ name:f.name, kind:f.kind, text:f.text, thumb:f.thumb })) } : {}, wm.sources ? { sources:wm.sources, web:wm.web, webWhy:wm.webWhy } : {});
  if (wm.sources){ const u = C.node.querySelector('.m.user'); const se = sourcesEl(wm); if (u) u.after(se); else C.node.prepend(se); }
  ids.forEach(id => cmpJob(id, C));
}
/* entrar a Comparar con las IA marcadas (desde los temas) */
function startCompare(ids){
  ids = ids.filter((x, i) => ids.indexOf(x) === i).slice(0, CMP_MAX);
  if (ids.length < 2) return;
  if (trialOn) exitTrial(true);
  st().cmp = ids; save(); cmpLast = null; setMode('cmp');
  toast('Listo: escribe tu pregunta y responden las ' + ids.length + '.'); inp.focus();
}
/* la IA elegida vuela desde el selector hasta su lugar arriba, con una curva y un rebote suave */
function flyChips(ids, from){
  if (SZ.reduce) return;
  requestAnimationFrame(() => requestAnimationFrame(() => ids.forEach((id, k) => {
    const f = from[k], tg = $('#pickRow [data-rm="' + CSS.escape(id) + '"]'), chip = tg && tg.closest('.mchip'); if (!f || !chip) return;
    const t = chip.getBoundingClientRect(), m = info(id);
    chip.style.visibility = 'hidden';
    const g = document.createElement('div'); g.className = 'flychip'; g.style.setProperty('--vc', vendorColor(m.vendor)); g.innerHTML = av(m, 'xs') + '<b>' + esc(m.name) + '</b>'; document.body.appendChild(g);
    const x0 = f.left, y0 = f.top + f.height / 2 - g.offsetHeight / 2, x1 = t.left, y1 = t.top + t.height / 2 - g.offsetHeight / 2, mx = (x0 + x1) / 2 + (k % 2 ? 40 : -40), my = Math.min(y0, y1) - 90;
    g.animate([
      { transform:'translate(' + x0 + 'px,' + y0 + 'px) scale(.9)', opacity:0, filter:'blur(6px)' },
      { transform:'translate(' + x0 + 'px,' + (y0 - 8) + 'px) scale(1.05)', opacity:1, filter:'blur(0)', offset:.12 },
      { transform:'translate(' + mx + 'px,' + my + 'px) scale(1.12) rotate(' + (k % 2 ? 4 : -4) + 'deg)', offset:.55 },
      { transform:'translate(' + x1 + 'px,' + (y1 + 4) + 'px) scale(.97)', offset:.86 },
      { transform:'translate(' + x1 + 'px,' + y1 + 'px) scale(1)', opacity:1 }
    ], { duration:820, delay:k * 110, easing:'cubic-bezier(.65,0,.35,1)', fill:'both' }).onfinish = () => {
      g.remove(); chip.style.visibility = '';
      chip.animate([{ transform:'scale(1.12)', boxShadow:'0 0 0 2px rgba(230,182,95,.6), 0 0 26px rgba(230,182,95,.5)' }, { transform:'none', boxShadow:'0 0 0 0 rgba(230,182,95,0)' }], { duration:520, easing:'cubic-bezier(.22,1,.36,1)' });
      const r = chip.getBoundingClientRect(); burst(r.left + 18, r.top + r.height / 2, [vendorColor(m.vendor), '#e6b65f', '#ffffff'], 7);
    };
  })));
}
/* sumar una IA: si ya preguntaste algo, responde lo mismo sin volver a enviarlo */
function addToCompare(id, node){
  const fromR = node && $('.av', node) ? $('.av', node).getBoundingClientRect() : null;
  if (trialOn){ toast('La prueba guiada usa una sola IA. Para comparar, conecta Puter (es gratis).'); return; }
  setTimeout(() => { if (fromR) flyChips([id], [fromR]); }, 0);
  if (!sessionStorage.getItem('synthz:cmpwarn')){ try{ sessionStorage.setItem('synthz:cmpwarn', '1'); }catch(x){} setTimeout(() => toast('Ojo: cada IA que sumas responde por separado y cuenta como un mensaje. Por eso se llama Comparar, no Unir.'), 900); }
  closeSide();
  if (mode !== 'cmp'){
    const cur = selId(), chat = chatArr(), L = chat.length;
    const seed = L >= 2 && chat[L - 1].role === 'assistant' && chat[L - 2].role === 'user' && chat[L - 2].content && !(chat[L - 2].files && chat[L - 2].files.length) && !Object.keys(busy).length ? { text:chat[L - 2].content, ans:chat[L - 1] } : null;
    st().cmp = [cur, id]; save(); cmpLast = null; setMode('cmp');
    if (seed){
      const C = newCmpRun(seed.text), card = cardEl(C, cur);
      flipAdd(C.grid, card); finishCard(C, card, seed.ans.content, (seed.ans.meta || '') + ' · ya la tenías');
      C.done.push({ card, mid:cur, ms:0, ttft:0 });
      cmpJob(id, C);
      toast(info(id).name + ' responde a tu última pregunta, al lado.');
    } else toast('Escribe tu pregunta: responden las dos a la vez.');
    return;
  }
  st().cmp.push(id); save(); paintSel(); renderTop(); updateHint(); renderNow();
  if (cmpLast && cmpLast.text){ if (!budgetOk()) return; ensureConn().then(ok => { if (ok && cmpLast) cmpJob(id, cmpLast); }); toast(info(id).name + ' se suma a la misma pregunta.'); }
}
function removeCmp(id, chip){
  const a = st().cmp, i = a.indexOf(id); if (i < 0) return;
  const go = () => {
    a.splice(i, 1); save();
    if (cmpLast){ const c = cmpLast.cards.get(id); if (c){ c.animate([{ opacity:1, transform:'none' }, { opacity:0, transform:'scale(.95)', filter:'blur(8px)' }], { duration:320, easing:'ease-in' }).onfinish = () => c.remove(); cmpLast.cards.delete(id); } }
    if (a.length <= 1){ const left = a[0]; st().cmp = []; save(); cmpLast = null; if (left){ st().model.openrouter = left; save(); } setMode('solo'); return; }
    paintSel(); renderTop(); updateHint();
  };
  if (chip && !SZ.reduce){ chip.classList.add('out'); setTimeout(go, 300); } else go();
}
/* «Esta tiene más Flow»: sigues el chat solo con esa IA, con la pregunta y su respuesta */
function pickWinner(card){
  const C = cmpLast; if (!C || !card || !card._mid) return;
  const mid = card._mid; card.classList.add('picked');
  const r = card.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 30, ['#e6b65f', '#ffe2a8', '#c9566c', '#ffffff'], 18);
  setTimeout(() => {
    (st().thread || (st().thread = {}))[mid] = 't' + Date.now().toString(36);
    st().cmp = []; cmpLast = null; st().model.openrouter = mid; st().pinned = mid;
    const arr = st().chats[ckey()] = [];
    arr.push(C.msg || { role:'user', content:C.text }, { role:'assistant', content:card._raw || '', meta:(card._meta || '') + ' · la elegiste en Comparar', model:mid });
    touchThread(); save(); setMode('solo');
    toast(info(mid).name + ' tiene más Flow 😎 Sigues con ella.');
  }, 700);
}

/* ---------- modo, panel móvil y atajos ---------- */
function setMode(m){
  mode = m; document.body.classList.toggle('cmpm', m === 'cmp');
  if (m !== 'cmp') cmpLast = null;
  inp.placeholder = m === 'cmp' ? 'Una pregunta para todas las IA…' : 'Escribe tu mensaje…';
  paintSel(); renderTop(); renderMsgs(); renderNow(); renderFoot(); updateHint(); paintAccent();
}
/* ---------- selector de IA flotante (computador) u hoja que sube (celular) ---------- */
const side = $('#side'), scrim = $('#scrim');
/* ---------- v3.7 · selector de IA nuevo (Sammuel: «ese panel de escoger es muy confuso»)
   Antes abría con una pantalla llena de filtros y había que pulsar «Ver las IA» para ver alguna.
   Ahora abre directo en las IA: arriba buscas, al lado eliges Para ti / Todas / Favoritas y abajo tocas la que quieres.
   Los filtros (temas, en qué son buenas, de dónde, orden) quedan detrás de «Personalizar búsqueda».
   Comparar ya no se mezcla aquí: tiene su propio lugar en la barra («Comparar IAs»). ---------- */
const TUNE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/></svg>';
(function twoPanels(){
  /* v3.7 · la versión React (Selector.jsx) ya trae las dos columnas: no se mueve nada */
  if ($('.pf-l', side)) return;
  const L = document.createElement('div'); L.className = 'pf-l'; L.setAttribute('role', 'group'); L.setAttribute('aria-label', 'Personalizar búsqueda');
  const R = document.createElement('div'); R.className = 'pf-r'; R.setAttribute('role', 'group'); R.setAttribute('aria-label', 'Las IA');
  const head = $('.phead', side), fw = $('.fwrap', side) || $('#filters'), prov = $('#provSeg'), sortr = $('.sortrow', side), more = $('#pMore'), pfoot = $('.pfoot', side);
  const lbl = t => { const e = document.createElement('p'); e.className = 'plbl'; e.textContent = t; return e; };
  head.insertAdjacentHTML('beforeend', '<span class="pr-n" id="prN"></span>');
  head.appendChild($('#sideClose'));
  const lh = document.createElement('div'); lh.className = 'pl-head';
  lh.innerHTML = '<b>Personalizar búsqueda</b><button type="button" class="pr-back" id="pBack"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>Listo</span></button>';
  L.append(lh, lbl('¿Para qué la quieres?'), $('#pTopics'), lbl('En qué son buenas'), fw, lbl('De dónde'), prov, sortr);
  const qr = document.createElement('div'); qr.className = 'pq';
  qr.append($('#pTabs'));
  qr.insertAdjacentHTML('beforeend', '<button type="button" class="pcust" id="pCust" aria-expanded="false" aria-controls="side">' + TUNE + '<span>Personalizar búsqueda</span><i class="pc-n" id="pCustN" hidden></i></button>');
  R.append(head, $('#searchBox'), qr, $('#pNote'), $('#mlist'), pfoot);
  if (more) more.remove();
  side.append(L, R); side.classList.add('two-p', 'v37', 'two');
})();
const sideL = $('.pf-l', side), sideR = $('.pf-r', side);
const wide2 = () => matchMedia('(min-width:900px)').matches;
function sideShift(){}
/* cuántos filtros tienes puestos: se ve en el botón «Personalizar búsqueda» */
function paintCust(){
  const n = ['free', 'fav', 'reason', 'vision', 'long', 'forme', 'code', 'write', 'fast', 'math', 'newm'].filter(k => ui[k]).length + (ptopic ? 1 : 0) + (ui.prov !== 'all' ? 1 : 0);
  const c = $('#pCustN'); if (c){ c.hidden = !n; c.textContent = n; }
}
function custOn(on){
  side.classList.toggle('cust', on); $('#pCust').setAttribute('aria-expanded', String(on));
  requestAnimationFrame(() => { try{ placePill($('#provSeg')); placePill($('#sortSeg')); placePill($('#pTabs')); }catch(e){} });
  if (on && SZ.SND.expand) SZ.SND.expand();
}
function sideStage(two, o = {}){ custOn(!two); if (two && o.focus) setTimeout(() => $('#q').focus(), 60); }
$('#pCust').addEventListener('click', () => custOn(!side.classList.contains('cust')));
$('#pBack').addEventListener('click', () => { custOn(false); renderList({ keep:true, animate:true }); });
sideL.addEventListener('click', e => { if (e.target.closest('[data-ptk],.fchip,#provSeg button,#sortSeg button')) setTimeout(() => { paintCust(); if (wide2()) renderList({ keep:true }); }, 60); });
/* el selector se amplía desde donde lo tocaste hasta el centro, y al cerrarlo vuelve allí (animación al revés) */
let sideFrom = null;
function sideFlip(open){
  if (SZ.reduce) return Promise.resolve();
  const r = side.getBoundingClientRect(), a = sideFrom;
  const cx = a ? a.left + a.width / 2 : r.left + r.width / 2, cy = a ? a.top + a.height / 2 : r.top + r.height / 2;
  const dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2), sx = a ? Math.max(.12, a.width / r.width) : .9, sy = a ? Math.max(.08, a.height / r.height) : .9;
  const A = { transform:'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')', opacity:0, filter:'blur(10px)', borderRadius:'999px' }, B = { transform:'none', opacity:1, filter:'blur(0)', borderRadius:'28px' };
  if (isMobile()){ A.transform = 'translateY(70px)'; A.borderRadius = B.borderRadius = '26px 26px 0 0'; }
  /* si el navegador pausa la animación (pestaña en segundo plano), igual se termina: nunca queda la ventana trabada */
  const D = open ? 620 : 420;
  return Promise.race([side.animate(open ? [A, B] : [B, A], { duration:D, easing:open ? 'cubic-bezier(.22,1,.36,1)' : 'cubic-bezier(.55,0,.75,.2)' }).finished.catch(() => {}), new Promise(r => setTimeout(r, D + 180))]);
}
function placeSide(){}
let sideOpener = null; side.inert = !side.classList.contains('open');
function openSide(kind, anchor){
  if (isLocked()){ lockNudge(); toast('Primero conecta Puter: es gratis y con un clic.'); return; }
  if (agentOn() && mode === 'solo' && kind !== 'add' && kind !== 'cmp'){ toast('Con Apex la IA la elige él. Si quieres elegirla tú, vuelve a «Chats».'); return; }
  pickMode = kind === 'add' || mode === 'cmp' ? 'add' : 'set';
  pickCmp = kind === 'cmp' && mode !== 'cmp'; if (!pickCmp) pickSel.clear();
  side.classList.toggle('pcmp', pickCmp);
  $('#pTitle').textContent = pickCmp ? 'Compara IAs lado a lado' : pickMode === 'add' ? 'Suma otra IA a la mesa' : 'Elige tu IA';
  const a = anchor && anchor.isConnected ? anchor : $('#curChip') || $('#cPick') || $('#pickRow');
  if (!side.classList.contains('open')) sideOpener = document.activeElement && document.activeElement !== document.body && !side.contains(document.activeElement) ? document.activeElement : a;   /* a11y: a quién devolver el foco al cerrar */
  sideFrom = a ? a.getBoundingClientRect() : null;
  if (pickMode === 'set' && !ptopic && curTopic) ptopic = curTopic;
  renderPTopics(); paintPNote(); paintPGo();
  iaSweep();   /* v3.8 · las que no responden salen de la lista mientras la miras */
  const wasOpen = side.classList.contains('open');
  if (!wasOpen) custOn(false);
  paintCust();
  side.inert = false; side.classList.add('open'); side.setAttribute('aria-hidden', 'false'); scrim.classList.add('on', 'pick');
  $$('#pickRow .mchip').forEach(c => c.setAttribute('aria-expanded', String(pickMode === 'set')));
  setTab(isMobile() ? 'ia' : null);
  renderList({ keep:true });
  requestAnimationFrame(() => placePill($('#pTabs')));
  if (!wasOpen) sideFlip(true);
  if (pickMode === 'set') setTimeout(() => scrollToSel(), 60);
}
/* al abrir la lista, se ve la IA que estás usando (con su proveedor elegido) */
function scrollToSel(){
  const id = selId(); if (!V.rows) return;
  const i = V.rows.findIndex(r => r.t === 'm' && r.m.id === id); if (i < 0) return;
  listEl.scrollTop = Math.max(0, V.tops[i] - 80); vPaint(true);
}
let sideClosing = false;
function closeSide(){
  if (!side.classList.contains('open') || sideClosing) return;
  sideClosing = true;
  const fin = () => {
    sideClosing = false;
    side.classList.remove('open'); side.setAttribute('aria-hidden', 'true'); side.inert = true;
    if (!$('#chats').classList.contains('msheet')) scrim.classList.remove('on');
    scrim.classList.remove('pick');
    pickMode = 'set'; $$('#pickRow .mchip').forEach(c => c.setAttribute('aria-expanded', 'false'));
    setTab(null); paintSel();
    const o = sideOpener && sideOpener.isConnected && sideOpener.getClientRects().length ? sideOpener : $('#curChip') || $('#cPick');
    sideOpener = null; if (o && o.focus && (!document.activeElement || document.activeElement === document.body || side.contains(document.activeElement))) try{ o.focus({ preventScroll:true }); }catch(e){}
  };
  scrim.classList.remove('pick');
  sideFlip(false).then(fin);
}
$('#sideClose').addEventListener('click', closeSide);
$('#sideDone').addEventListener('click', closeSide);
scrim.addEventListener('click', () => { closeSide(); closeChatsSheet(); });
document.addEventListener('pointerdown', e => {
  if (!side.classList.contains('open') || isMobile()) return;
  if (side.contains(e.target) || e.target.closest('.mchip, .addb, [data-pick], [data-add-cmp], .szm, .ctxm, #tour, #conn, #blk, #svm')) return;
  closeSide();
});
addEventListener('resize', () => { if (side.classList.contains('open') && !isMobile()) placeSide(); });
/* a11y: Escape cierra «Elegir IA» desde cualquier control de dentro (también en celular, donde con texto escrito antes solo borraba la búsqueda) */
side.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || e.defaultPrevented || !side.classList.contains('open') || document.querySelector('.szm.on,.ctxm,#svm')) return;
  const q = $('#q'); if (!isMobile() && e.target === q && q.value) return;   /* en el computador, el primer Escape borra el texto (lo hace el manejador de abajo) */
  e.preventDefault(); e.stopPropagation(); closeSide();
}, true);
addEventListener('keydown', e => {
  const tag = e.target.tagName || '', typing = /INPUT|TEXTAREA|SELECT/.test(tag);
  if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')){ e.preventDefault(); openSide('set'); setTimeout(() => { $('#q').focus(); $('#q').select(); }, 60); }
  else if (e.key === 'Escape'){ if (document.activeElement === $('#q') && $('#q').value){ clearQuery(); } else if (side.classList.contains('open')){ closeSide(); const c = $('#curChip'); if (c) c.focus(); } else closeChatsSheet(); }
});

/* ---------- barrita lateral y tus chats ---------- */
const RAIL_KEY = 'synthz:rail';
const RS = { open:false, chats:null, view:'chats' };
try{ const r = JSON.parse(localStorage.getItem(RAIL_KEY)) || {}; if (typeof r.open === 'boolean') RS.open = r.open; if (typeof r.chats === 'boolean') RS.chats = r.chats; if (r.view === 'favs') RS.view = r.view; }catch(e){}
if (RS.chats === null) RS.chats = !isTablet();
let cView = RS.view;
const saveRS = () => { try{ localStorage.setItem(RAIL_KEY, JSON.stringify(RS)); }catch(e){} };
function applyRail(){
  const sh = $('#shell'), tg = $('#railTog');
  $('#rail').classList.toggle('open', !!RS.open); sh.classList.toggle('ropen', !!RS.open); sh.classList.toggle('nochats', !RS.chats);
  tg.setAttribute('aria-expanded', String(!!RS.open)); tg.setAttribute('aria-label', RS.open ? 'Cerrar la barra' : 'Abrir la barra'); tg.dataset.tip = RS.open ? 'Cerrar la barra' : 'Abrir la barra';
  $$('#rail [data-r]').forEach(b => { const r = b.dataset.r; b.setAttribute('aria-pressed', String((r === 'chats' && RS.chats && cView === 'chats') || (r === 'favs' && RS.chats && cView === 'favs'))); });
  $$('#cSeg button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.v === cView))); placePill($('#cSeg'));
  $('#railWord').tabIndex = RS.open ? 0 : -1;
}
function showChats(view, focus){
  if (isMobile()){ cView = view || cView; openChatsSheet(focus); return; }
  RS.chats = true; if (view){ cView = view; RS.view = view; } RS.open = false; saveRS(); applyRail(); renderChats(true);
  if (focus) setTimeout(() => $('#thQ').focus(), 380);
}
$('#railTog').addEventListener('click', () => { RS.open = !RS.open; saveRS(); applyRail(); });
$('#rail').addEventListener('click', e => {
  const b = e.target.closest('[data-r]'); if (!b) return;
  const r = b.dataset.r;
  if (r === 'new'){ newChat(); return; }
  if (r === 'search'){ showChats('chats', true); return; }
  if ((r === 'chats' || r === 'favs') && RS.chats && cView === r && !RS.open){ RS.chats = false; saveRS(); applyRail(); return; }
  showChats(r);
});
$('#railCoin').addEventListener('click', () => coinModal('panel'));
$('#chatsClose').addEventListener('click', () => { if (isMobile()) closeChatsSheet(); else { RS.chats = false; saveRS(); applyRail(); } });
$$('#cSeg button').forEach(b => b.addEventListener('click', () => { cView = b.dataset.v; RS.view = cView; saveRS(); applyRail(); renderChats(true); }));
/* celular: tus chats suben como una hoja */
function openChatsSheet(focus){ const c = $('#chats'); c.classList.add('msheet'); scrim.classList.add('on'); applyRail(); renderChats(true); setTab('chats'); if (focus) setTimeout(() => $('#thQ').focus(), 420); }
function closeChatsSheet(){ const c = $('#chats'); if (!c.classList.contains('msheet')) return; c.classList.remove('msheet'); if (!side.classList.contains('open')) scrim.classList.remove('on'); setTab(null); }
function setTab(t){ $$('#tabbar [data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === t))); }
$('#tabbar').addEventListener('click', e => {
  const b = e.target.closest('[data-tab]'); if (!b) return;
  const t = b.dataset.tab;
  if (t === 'chats'){ if ($('#chats').classList.contains('msheet')) closeChatsSheet(); else { closeSide(); openChatsSheet(); } }
  else if (t === 'ia'){ if (side.classList.contains('open')) closeSide(); else { closeChatsSheet(); openSide(mode === 'cmp' ? 'add' : 'set'); } }
  else { closeSide(); closeChatsSheet(); if (t === 'coins') coinModal('panel'); else if (t === 'cfg') SZ.cfgModal(); else if (t === 'me') accMenu(b); }
});
/* chat nuevo: también cambia la frase de bienvenida */
function newChat(){
  closeSide(); closeChatsSheet();
  if (mode !== 'solo'){ stopNow(); cmpRun++; setMode('solo'); }
  if (chatArr().length) (st().thread || (st().thread = {}))[thModel()] = 't' + Date.now().toString(36);
  save(); gen++; nextGreet(); curTopic = null; topicsAll = false;
  renderMsgs(); updateHint(); renderChats(); renderNow();
  if (matchMedia('(pointer: fine)').matches) inp.focus();
  if (isTablet() && RS.chats){ RS.chats = false; saveRS(); applyRail(); }
}

/* volver con un fundido */
/* volver a SymphorIA: la película del portal al revés */
/* v1.4: con la barra lateral abierta, el logo «SynthFlow» NO lleva a la portada (solo hace un brillito) */
document.addEventListener('click', e => { const w = e.target.closest && e.target.closest('#railWord'); if (w){ e.preventDefault(); e.stopPropagation(); w.classList.remove('tw'); void w.offsetWidth; w.classList.add('tw'); } }, true);
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href="index.html"]'); if (!a || a.id === 'railWord' || (e.defaultPrevented && !/^(backLink|mLogo)$/.test(a.id)) || e.button || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); toPortada(); });
/* v4.1 · la portada es solo para gente nueva: quien ya entró no vuelve a ella por el logo, sino por la pantallita
   «Ya tengo el Flow / Soy nuevo» (Soy nuevo → la abre; Ya tengo el Flow → se queda aquí). Si ya eligió verla, va directo. */
function toPortada(){
  const d = SZ.portada && SZ.portada.get();
  if (d && d.v === 'nuevo'){ SZ.portalBack('index.html'); return; }
  SZ.synReady.then(() => SZ.welcomeBack({ from:'logo', flow:() => { if (matchMedia('(pointer: fine)').matches) inp.focus(); } }));
}
addEventListener('pageshow', e => { if (e.persisted){ root.classList.remove('bye'); const pp = document.getElementById('portal'); if (pp) pp.remove(); SZ.S.busy(false); } });
SZ.hooks.usage = () => { renderFoot(); coinWatch(); };
SZ.hooks.md = () => { if (!Object.keys(busy).length && mode === 'solo' && chatArr().length) renderMsgs(); };
SZ.onLang(() => { if (!Object.keys(busy).length && mode === 'solo') renderMsgs(); });   /* v3.0 · el saludo cambia de idioma al momento */
SZ.onLang(() => { try{ renderList({ keep:true }); }catch(e){} });   /* v3.7 · la lista de IA (y su «Experta en…») también cambia de idioma al momento */

/* ---------- tutorial, mejor IA gratis y menú contextual ---------- */
const APODEX_NAME = 'Automática';
const TOUR = [
  { t:'Bienvenido a Sonyx', p:'Aquí chateas gratis con muchas IA. No tienes que configurar nada: escribe y listo.' },
  { t:'Tu Puter', p:'Cada día tienes un límite gratis para usar las IAs conectadas. A medianoche se vuelve a llenar. Si se te acaban, puedes seguir con Puter, que te da la versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis, tiene un límite que se renueva cada mes y se conecta con un clic.', x:'conn' },
  { t:'¿Dónde quieres empezar?', p:'Elige y te dejo en su pestaña con su mejor IA. Si no eliges, empiezas con ' + APODEX_NAME + '.', x:'pick' },
  { t:'Tu límite de hoy', p:'Cada día tienes un límite gratis. El anillo de la barrita se va vaciando mientras chateas y se llena otra vez a medianoche. «Respuestas cortas» te ayuda a que te alcancen más.' },
  { t:'Más trucos', p:'Adjunta imágenes, PDF o código con el «+». En "Comparar" le preguntas lo mismo a hasta 4 IAs. El botón «?» de arriba abre la guía rápida cuando quieras.' },
  { t:'Todo listo', p:'', x:'done' }
];
const TCOL = ['#8fb0ff', '#7fd6b8', '#c9566c', '#f2b36b', '#ff8f7a', '#c9566c'];
let tourI = 0, tourEl = null, tourPick = null;
function pickTarget(){ const m = tourPick === 'pu' ? bestOf('pu') : tourPick === 'sz' ? bestOf('sz') : null; return m ? m.id : APODEX; }
function tourBox(box, kind){
  if (kind === 'conn'){
    const hasP = puterOn(), on = szOn();
    box.innerHTML = '<div class="tconn"><div class="trow"><b><i class="pdot' + (on ? ' on' : '') + '"></i> <span class="sz-logo" aria-hidden="true"></span> IAs conectadas</b><span>' + (on ? 'Listas · gratis' : 'Descansando un momento') + '</span>' + (on ? '<i class="ok">✓ Lista</i>' : '') + '</div>'
      + '<div class="trow"><b><i class="pdot' + (hasP ? ' on' : '') + '"></i> ' + SZ.puterLogo() + ' Puter</b><span>Tus IAs pro · un clic</span>' + (hasP ? '<i class="ok">✓ Conectada</i>' : '<button class="btn sm" data-tpu type="button">Conectar</button><button class="lnk" data-tpt type="button">Sin cuenta de Puter</button>') + '</div></div>';
    const pu = $('[data-tpu]', box);
    if (pu) pu.addEventListener('click', () => { pu.textContent = 'Conectando…'; puterSignIn().then(() => { afterConnect('¡Puter conectado!'); tourBox(box, 'conn'); }).catch(e => { pu.textContent = 'Conectar'; if (!(e && e.shown)) toast('No terminaste de entrar a Puter. Inténtalo otra vez.'); }); });
    const pt = $('[data-tpt]', box);
    if (pt) pt.addEventListener('click', () => { pt.textContent = '…'; puterSignIn({ attempt_temp_user_creation:true }).then(() => { afterConnect('¡Puter conectado!'); tourBox(box, 'conn'); }).catch(e => { pt.textContent = 'Sin cuenta de Puter'; if (!(e && e.shown)) toast('No terminaste de entrar a Puter. Inténtalo otra vez.'); }); });
  } else if (kind === 'pick'){
    const bp = bestOf('pu'), bo = bestOf('sz');
    const card = (k, title, sub, model) => '<button type="button" class="tpick' + (tourPick === k ? ' on' : '') + '" data-k="' + k + '"><b>' + title + '</b><span>' + sub + '</span><em>' + esc(model) + '</em></button>';
    box.innerHTML = '<div class="tpicks">' + card('sz', 'IAs conectadas', 'Gratis · listas', bo ? bo.name : 'Automática') + card('pu', 'Puter', 'Tus IAs pro · un clic', bp ? bp.name : 'ChatGPT') + card('none', 'Ninguno', 'Por defecto', 'Automática') + '</div>';
    $$('.tpick', box).forEach(b => b.addEventListener('click', () => { tourPick = b.dataset.k; tourBox(box, 'pick'); }));
  } else if (kind === 'done'){
    const id = pickTarget(), where = tourPick === 'pu' ? 'Puter' : tourPick === 'sz' ? 'Sinapse' : 'Todos';
    box.innerHTML = '<div class="tsum">Empiezas con <b>' + esc(info(id).name) + '</b> en la pestaña <b>' + where + '</b>.' + (connected(id) ? '' : /^pu:/.test(id) ? ' Te pediré entrar a Puter cuando escribas tu primer mensaje.' : '') + '</div>';
  } else box.innerHTML = '';
}
function tourStep(anim, dir){
  const c = $('.tcard', tourEl), b = $('.tb', c), d = TOUR[tourI], last = tourI === TOUR.length - 1;
  const set = () => {
    $('h3', b).textContent = d.t; $('p', b).textContent = d.p; $('p', b).style.display = d.p ? '' : 'none';
    tourBox($('.tx', b), d.x);
    $('.tn', c).textContent = '0' + (tourI + 1) + ' / 0' + TOUR.length;
    $('#tNext').textContent = last ? 'Empezar' : d.x === 'conn' ? (puterOn() ? 'Siguiente' : 'Ahora no, siguiente') : 'Siguiente';
    $('#tBack').style.visibility = tourI ? 'visible' : 'hidden';
    tourEl.style.setProperty('--tc', TCOL[tourI]); $$('.tdots i', c).forEach((x, i) => x.classList.toggle('on', i === tourI)); $('#tSkip').style.visibility = last ? 'hidden' : 'visible';
  };
  if (!anim){ set(); return; }
  SZ.swapDir(b, dir || 1, set);
}
function openHelp(){ SZ.helpGuide({ extra:[['Ver la Guía Asistida', () => runGuide()], ['Conectar mi Puter', () => openConnect()], ['Ver mi límite de hoy', () => coinModal('panel')]] }); }
/* En la edición estática antigua, el HTML aún no contiene el componente cliente React.
   Solo ahí se instala el listener vanilla; en Next, GuideButton marca el nodo y gestiona el clic. */
const guideButton = $('#guideTop');
if (guideButton && guideButton.dataset.reactComponent !== 'guide') guideButton.addEventListener('click', () => openGuide());
function openTour(){
  if (tourEl) return; tourI = 0; tourPick = null;
  tourEl = document.createElement('div'); tourEl.id = 'tour';
  tourEl.innerHTML = '<div class="tcard" role="dialog" aria-modal="true"><div class="word" id="tWord"></div><div class="tn"></div><div class="tb"><h3></h3><p></p><div class="tx"></div></div><div class="tdots"></div><div class="tbtn"><button class="lnk" id="tSkip" type="button">Saltar</button><span style="flex:1"></span><button class="lnk" id="tBack" type="button">Atrás</button><button class="btn sm" id="tNext" type="button"></button></div></div>';
  document.body.appendChild(tourEl); $('#tWord').innerHTML = zWord('Synth');
  $('.tdots', tourEl).innerHTML = TOUR.map(() => '<i></i>').join('');
  tourStep(false); requestAnimationFrame(() => tourEl.classList.add('on'));
  $('.tcard', tourEl).animate([{ transform:'scale(.9) translateY(24px)', opacity:0, filter:'blur(10px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
  $('#tSkip').addEventListener('click', () => closeTour(false));
  $('#tBack').addEventListener('click', () => { if (tourI > 0){ tourI--; tourStep(true, -1); } });
  $('#tNext').addEventListener('click', () => { if (tourI < TOUR.length - 1){ tourI++; tourStep(true); } else closeTour(true); });
}
function closeTour(go){
  if (!tourEl) return; const el = tourEl; tourEl = null; setTimeout(warnBlocked, 700);
  try{ localStorage.setItem('synthz:tour', '1'); }catch(e){}
  el.classList.remove('on'); setTimeout(() => el.remove(), 520);
  if (!go && !tourPick) return;
  if (mode !== 'solo') setMode('solo');
  const id = pickTarget();
  st().pinned = id; pickModel(id, null);
  ui.prov = tourPick === 'pu' ? 'pu' : tourPick === 'sz' ? 'sz' : 'all'; saveUI();
  $$('#provSeg button').forEach(x => x.setAttribute('aria-selected', String(x.dataset.p === ui.prov))); placePill($('#provSeg')); renderList({ animate:true });
  toast('Empiezas con ' + info(id).name + '.');
  burst(innerWidth / 2, innerHeight / 2, ['#8fb0ff', '#c9566c', '#ff8f7a', '#7fd6b8'], 22);
}
/* =====================================================================
   Guía Asistida: Sona enseña Sonyx con su puntero (camino B)
   1 temas · 2 IA recomendadas · 3 recorrido · 4 comparar 2 · 5 prueba real · 6 conectar
   v3.0: arranca sola al terminar «Empieza en Sonyx» (ya elegiste tema e IA, así que salta 1 y 2) y el recorrido
   muestra también Nuevo chat, los modos, el esfuerzo, Espacios, Sintéticos y los Ajustes (temas, Simple, tamaño, rápido, idioma)
   ===================================================================== */
const H = SZ.HAND;
const GUIDE_PROMPTS = {
  marketing:'Dame 3 ideas cortas de publicaciones para vender postres caseros en Instagram.',
  escribir:'Escribe un mensaje corto y amable para invitar a mis amigos a una reunión el sábado.',
  codigo:'Explícame en 4 pasos qué hace un bucle «for» en JavaScript, con un ejemplo corto.',
  estudiar:'Explícame la fotosíntesis como a un principiante, con un ejemplo y 2 preguntas para repasar.',
  planos:'Ayúdame a distribuir una habitación de 3 x 4 metros con cama, escritorio y clóset.',
  negocios:'Dame un plan de 5 pasos para empezar a vender comida desde mi casa.',
  ideas:'Dame 8 ideas originales para un regalo de cumpleaños que no cueste mucho.',
  imagenes:'¿Qué cosas puede hacer una IA con una foto o un PDF? Dame 5 ejemplos cortos.',
  redes:'Escribe un guion de 20 segundos para un reel que presente mi emprendimiento.',
  ventas:'Ayúdame a responder a un cliente que dice que mi producto está caro, de forma amable.',
  correo:'Escribe un correo formal y corto pidiendo un día libre en el trabajo.',
  empleo:'Dame 5 preguntas típicas de una entrevista de trabajo y cómo responderlas.',
  web:'Explícame qué partes tiene una página web sencilla, en palabras fáciles.',
  datos:'¿Qué fórmula de Excel suma solo los valores mayores a 100? Explícala corto.',
  idiomas:'Enséñame 5 frases útiles en inglés para pedir comida en un restaurante.',
  mate:'Resuelve paso a paso: 3x + 7 = 22.',
  ciencia:'Explícame de forma sencilla por qué el cielo es azul.',
  diseno:'Propón 3 paletas de colores (con códigos HEX) para una marca de café.',
  finanzas:'Dame 5 consejos sencillos para ahorrar cada mes.',
  legal:'Explícame en palabras sencillas qué es un contrato de arrendamiento.',
  salud:'Propón una rutina suave de estiramientos de 10 minutos para empezar el día.',
  cocina:'Tengo arroz, huevos y tomate. ¿Qué puedo cocinar? Dame 2 opciones fáciles.',
  viajes:'Hazme un plan de 2 días para conocer una ciudad nueva con poco presupuesto.',
  musica:'Ayúdame con 4 versos para una canción sobre empezar de nuevo.',
  historias:'Escribe el inicio de una historia corta sobre un robot que aprende a pintar.',
  juegos:'Propón una idea sencilla de videojuego con sus reglas en 5 líneas.',
  productividad:'Divide en pasos pequeños la tarea de ordenar mi cuarto.',
  complejo:'Compara en una tabla corta estudiar de día o de noche: ventajas y desventajas.'
};
const GUIDE_DEMO = {
  marketing:[['Carrusel «antes y después»: la masa cruda y el postre terminado.', 'Encuesta en historias: «¿Cuál sale el viernes?».', 'Video de 10 s cortando la torta, con precio.'], ['Cuenta la historia de tu receta favorita en 3 frases.', 'Promo «Martes dulce» para quien comente.', 'Reseña real de un cliente, con su foto.']],
  codigo:[['Un «for» repite un bloque varias veces.', 'Tiene inicio, condición y paso: for (let i = 0; i < 3; i++).', 'Sirve para recorrer listas.'], ['Piensa en «haz esto N veces».', 'La variable i cuenta cada vuelta.', 'Cuando la condición es falsa, se detiene.']],
  estudiar:[['Las plantas usan luz para hacer su comida.', 'Toman agua y CO₂ y sueltan oxígeno.', 'Ejemplo: por eso crecen hacia la ventana.'], ['Es como una cocina solar dentro de la hoja.', 'La clorofila atrapa la luz.', 'Pregunta: ¿qué gas sueltan las plantas?']]
};
const GUIDE_DEMO_ANY = [['Primero te doy una respuesta corta y directa.', 'Luego un ejemplo práctico.', 'Al final, un consejo extra.'], ['Te lo explico con otras palabras.', 'Con un ejemplo distinto.', 'Y una idea que la otra no dio.']];
let G = null;
const gNeed = () => { if (!G || G.skip) throw Object.assign(new Error('guía cerrada'), { guide:true }); };
const gWait = ms => new Promise(r => setTimeout(r, SZ.reduce ? Math.min(ms, 260) : ms)).then(gNeed);
function gHud(n, label){
  if (!G) return;
  let h = $('#szgHud');
  if (!h){
    h = document.createElement('div'); h.id = 'szgHud'; h.setAttribute('role', 'status');
    h.innerHTML = '<span class="gh-f">' + SZ.face('feliz', 22) + '</span><span class="gh-t"><b>GUÍA</b> <i></i></span><span class="gh-bar"><i></i></span><button type="button" class="gh-x">Saltar guía</button>';
    document.body.appendChild(h); requestAnimationFrame(() => h.classList.add('on'));
    $('.gh-x', h).addEventListener('click', () => endGuide(false));
  }
  n -= G.off || 0;
  $('.gh-t i', h).textContent = n + ' de ' + G.total + ' · ' + label;
  $('.gh-bar i', h).style.transform = 'scaleX(' + (n / G.total).toFixed(3) + ')';
}
function gPanel(html, cls, say, mood, dir){
  gPanelClose(dir); H.quiet();
  const p = document.createElement('div'); p.id = 'szgPanel'; p.className = 'szgp' + (cls ? ' ' + cls : '') + (dir < 0 ? ' rev' : '');
  p.innerHTML = '<div class="gp-in">' + (say ? '<div class="gp-say"><span class="sf">' + SZ.face(mood || 'feliz', 58) + '</span><p>' + esc(say) + '</p></div>' : '') + html + '</div>';
  document.body.appendChild(p); requestAnimationFrame(() => p.classList.add('on'));
  if (say){ SZ.SND.blip(mood); if (!SZ.reduce) SZ.typeIn($('.gp-say p', p), { cps:50, max:4, delay:250, onFrame:SZ.lipSync([$('.gp-say .sf .szface', p), SZ.botFaceEl()], say) }).catch(() => {}); }
  return p;
}
/* la barra de la guía se aparta si tapa lo que Sona está señalando */
function gDodge(t){ const h = $('#szgHud'); if (!h || !t || !t.getBoundingClientRect) return; const r = t.getBoundingClientRect(); h.classList.toggle('low', r.top < 96); }
function gPanelClose(dir){ if (H.wander) H.wander(null); const p = $('#szgPanel'); if (!p) return; p.id = ''; p.classList.remove('on', 'rev'); p.classList.add('bye'); if (dir < 0) p.classList.add('back'); setTimeout(() => p.remove(), 520); }
/* lo primero que se vea de una lista de opciones (la pantalla cambia entre el inicio limpio y el chat) */
const gAny = (...L) => { for (const x of L){ const n = gT(x, x); if (n) return n; } return null; };
const gT = (desk, mob) => { const s = isMobile() ? mob : desk; const n = s && $(s); return n && n.getClientRects().length ? n : null; };
async function gPoint(target, text, o = {}){
  gNeed();
  if (!target){ return H.talk(text, Object.assign({ mood:o.mood || 'feliz', buttons:[{ label:o.next || 'Siguiente' }], auto:o.auto || Math.min(9000, 2600 + text.length * 48) }, o)).then(r => { gNeed(); return r; }); }
  try{ target.scrollIntoView({ block:'nearest', behavior:SZ.reduce ? 'auto' : 'smooth' }); }catch(e){}
  gDodge(target); H.spot(target, o.pad);
  await H.moveTo(target, { shape:o.shape || 'point', fx:o.fx, fy:o.fy }); gNeed();
  /* v1.9: si tocas lo que te señalo, ¡aprendiste! Te felicito, cierro lo que se abrió y seguimos.
     Y si das «Siguiente» con algo abierto (p. ej. la ventana de comparar), también se cierra para que no tape lo demás */
  const snap = gSnap(); let hit = null;
  const tapped = new Promise(res => { hit = e => { if (e.target && target.contains(e.target)) res('tap'); }; document.addEventListener('click', hit, true); });
  const said = H.talk(text, Object.assign({ near:target, mood:o.mood || 'senalando', buttons:[{ label:o.next || 'Siguiente' }], auto:o.auto || Math.min(9000, 2600 + text.length * 48) }, o));
  let r = await Promise.race([said, tapped]);
  document.removeEventListener('click', hit, true);
  gNeed();
  if (r === 'tap'){
    await gWait(650);
    H.unspot && H.unspot();
    await H.talk(gPraise(), { mood:'celebrando', buttons:[{ label:'Seguir' }], auto:2600 }); gNeed();
    r = 0;
  }
  gRestore(snap);
  return r;
}
const PRAISE = ['¡Muy bien, ya aprendiste! Sigamos.', '¡Eso es! Ya sabes usarlo.', '¡Perfecto! Lo hiciste tú solo.', '¡Así se hace! Vamos con lo siguiente.'];
let praiseI = 0;
const gPraise = () => PRAISE[praiseI++ % PRAISE.length];
/* qué estaba abierto antes de un paso, para cerrar solo lo que se abrió durante ese paso */
function gSnap(){ return { side:side.classList.contains('open') && !sideClosing, cv:!!cvEl, conn:!!$('#conn'), acc:!!$('#acc'), modals:new Set($$('.szm')) }; }
function gRestore(s){
  try{
    if (!s.side && side.classList.contains('open')) closeSide();
    if (!s.cv && cvEl) closeCanvas();
    if (!s.conn && $('#conn')){ const x = $('#conn #cClose'); if (x) x.click(); }
    if (!s.acc && $('#acc')){ const x = $('#acc #aClose'); if (x) x.click(); }
    $$('.szm').forEach(m => { if (s.modals.has(m) || m.classList.contains('bye')) return; const x = m.querySelector('[data-close], [data-cx]'); if (x) x.click(); else m.remove(); });
  }catch(e){}
}
async function waitCatalog(ms){ const t0 = Date.now(); while (!cat.list.length && Date.now() - t0 < ms){ await gWait(250); } }

async function runGuide(o = {}){
  await SZ.synReady;   /* v3.4 · Sona llega en su propio archivo: la guía la espera */
  if (G) return;
  const pre = o.topic && TOPIC[o.topic] ? o.topic : null;   /* v3.0: vienes de «Empieza en Sonyx»: ya elegiste tema e IA */
  closeSide(); closeChatsSheet(); if (tourEl) closeTour(false);
  if ($('#conn')) { const c = $('#cClose'); if (c) c.click(); }
  const off = pre ? 2 : 0;
  G = { skip:false, total:(SZ.ACC.dcid ? 7 : 6) - off, topics:pre ? [pre] : [], off };
  SZ.DRIVE.cid().then(c => { if (G && c && !(SZ.DRIVE.meta() || {}).linked){ G.total = 7 - off; const h = $('#szgHud .gh-t i'); if (h) h.textContent = h.textContent.replace(/de \d+/, 'de ' + G.total); } else if (G && !c) G.total = 6 - off; }).catch(() => {});
  root.classList.add('guiding');
  try{
    if (mode !== 'solo') setMode('solo');
    if (chatArr().length && !pre) newChat();
    H.show({ x:innerWidth - 60, y:innerHeight - 70 });
    await gWait(80);
    await H.moveTo({ x:innerWidth / 2, y:innerHeight * .26 }, { shape:'arrow' });
    H.wave(2);
    let r = await H.talk(pre ? '¡Aquí está la guía! Ya elegiste «' + TOPIC[pre].l + '» y tu IA. En unos 2 minutos te muestro cómo seguir: dónde está cada cosa, cómo comparar IAs y tu primer chat de verdad, gratis.'
      : '¡Hola! Soy Sona. Te enseño Sonyx en unos 2 minutos: eliges tus temas, te muestro las IA que mejor los hacen, comparamos 2 y chateas de verdad, gratis.', { mood:'feliz', buttons:[{ label:'¡Vamos!' }, { label:'Ahora no', ghost:true }] });
    if (r === 1){ endGuide(false); return; }
    gNeed();

    /* 1 · temas y 2 · IA recomendadas (camino B). «← Cambiar temas» vuelve con la animación al revés */
    let gdir = 1;
    for (;!pre;){
    gHud(1, 'Tus temas');
    H.quiet();
    const P = gPanel('<h3>¿Qué te interesa?</h3><div class="gp-topics">' + TOPICS.map(([k, e, l], i) => '<button type="button" class="tchip" data-gt="' + k + '" aria-pressed="' + G.topics.includes(k) + '" style="--i:' + i + '"><span aria-hidden="true">' + e + '</span>' + esc(l) + '</button>').join('') + '</div><div class="gp-act"><span class="gp-n">' + G.topics.length + ' de 3</span><button type="button" class="btn sm flow" data-gnext' + (G.topics.length ? '' : ' disabled') + '>Siguiente →</button></div>', 'pick', 'Elige hasta 3 temas que te interesen. Por ejemplo, si vendes algo: «Marketing» y «Ventas».', 'senalando', gdir);
    const pickN = () => $$('[data-gt][aria-pressed="true"]', P).length;
    P.addEventListener('click', e => {
      const b = e.target.closest('[data-gt]'); if (!b) return;
      const on = b.getAttribute('aria-pressed') === 'true';
      if (!on && pickN() >= 3){ toast('Máximo 3 temas: quita uno para elegir otro.'); return; }
      b.setAttribute('aria-pressed', String(!on)); SZ.SND.tap();
      const n = pickN(); $('.gp-n', P).textContent = n + ' de 3'; $('[data-gnext]', P).disabled = !n;
    });
    /* el botón responde desde el primer instante, aunque el puntero aún se esté moviendo */
    const go1 = new Promise(res => { $('[data-gnext]', P).addEventListener('click', res, { once:true }); const iv = setInterval(() => { if (!G || G.skip){ clearInterval(iv); res(); } }, 300); });
    await gWait(450);
    const firstChip = $('[data-gt]', P);
    /* señala un momento y luego flota por fuera del panel: no se queda tapando los temas */
    if (firstChip) H.moveTo(firstChip, { shape:'point' }).then(() => SZ.sleepRaw(1100)).then(() => { if (G && !G.skip && P.isConnected) H.wander(P); });
    await go1;
    gNeed();
    G.topics = $$('[data-gt][aria-pressed="true"]', P).map(b => b.dataset.gt);
    if (!G.topics.length) G.topics = ['ideas'];
    try{ st().guide = { topics:G.topics, t:Date.now() }; save(); }catch(e){}

    gHud(2, 'IA para ti');
    await waitCatalog(4000);
    const rows = G.topics.map(k => {
      const T = TOPIC[k], L = recommendTop(k, 3);
      return '<div class="gp-row"><b><span aria-hidden="true">' + T.e + '</span> ' + esc(T.l) + '</b><div class="gp-ias">' + (L.length ? L.map((m, i) => '<span class="gp-ia" style="--vc:' + vendorColor(m.vendor) + ';--i:' + i + '">' + av(m, 'xs') + '<span><em>' + esc(m.name) + '</em><small>' + esc(payOf(m.id)[2]) + '</small></span></span>').join('') : '<span class="gp-ia none">La lista de IA está cargando; aparecerá en «Temas».</span>') + '</div></div>';
    }).join('');
    const P2 = gPanel('<h3>Tus IA recomendadas</h3><p>En el mundo hay más de mil IA y cada una es experta en algo. Aquí tienes varias gratis y puedes usar una para escribir, otra para código…</p>' + rows + '<div class="gp-act"><button type="button" class="lnk gp-back" data-gback>← Cambiar temas</button><span style="flex:1"></span><button type="button" class="btn sm flow" data-gnext>Ver dónde está todo →</button></div>', 'recs', 'Estas son las mejores para lo que te gusta. ¡Todas gratis!', 'guino', 1);
    const go2 = new Promise(res => { $('[data-gnext]', P2).addEventListener('click', () => res('next'), { once:true }); $('[data-gback]', P2).addEventListener('click', () => res('back'), { once:true }); const iv = setInterval(() => { if (!G || G.skip){ clearInterval(iv); res('next'); } }, 300); });
    await gWait(500);
    const ia1 = $('.gp-ia', P2);
    if (ia1) H.moveTo(ia1, { shape:'point' }).then(() => SZ.sleepRaw(1300)).then(() => { if (G && !G.skip && P2.isConnected) H.wander(P2); });
    const how = await go2;
    gNeed();
    if (how === 'back'){ gdir = -1; continue; }
    break;
    }
    gPanelClose(); H.quiet();

    /* 3 · recorrido por la pantalla (camino A) */
    gHud(3, 'La pantalla');
    await gWait(350);
    await gPoint(gAny('#cPick', '#curChip'), 'Aquí eliges con qué IA hablas. Tócalo y se abre su ventana, con temas, buscador y filtros.');
    await gPoint(gAny('#sNav [data-sn="cmp"]', '#pickRow [data-add]'), 'Aquí, aparte, comparas IAs: eliges hasta 4. Todas responden la misma pregunta y las comparas. Ojo: cada una gasta lo suyo.');
    await gPoint(gAny('#payPill', '#payL', '#payM'), 'Aquí ves cómo va tu límite gratis de hoy.', { pad:6 });
    await gPoint((gT('#thList', '#tabbar [data-tab="chats"]') || gT('#rail [data-r="chats"]', '#tabbar [data-tab="chats"]')), 'Tus chats y tus mensajes favoritos quedan aquí, en cualquier dispositivo si entras con tu cuenta.', { side:true });
    await gPoint(gT('.tchip[data-topic]', '.tchip[data-topic]'), 'Toca un tema cuando quieras y te recomiendo IA expertas en eso.');
    /* v3.0: lo nuevo, para que nadie se quede sin saber dónde está */
    await gPoint(gT('#sNav [data-sn="new"]', '#rail [data-r="new"]') || gT('#cNew', '#rail [data-r="new"]') || gT('#rail [data-r="new"]', '#tabbar [data-tab="chats"]'), 'Con «Nuevo chat» empiezas una conversación limpia cuando cambies de tema. La anterior queda guardada.', { side:true });
    await gPoint(gAny('#cMode'), 'Aquí eliges el modo: «Automática» escoge la mejor IA por ti, «Chat» te deja elegirla, y «Apex» trabaja por pasos como un agente.');
    await gPoint(gAny('#cEffort'), 'Y aquí, cómo piensa: Flow (según tu pregunta), Fragment (rápido), Focus (a fondo, el que más gasta) u Horizon (ideas originales).');
    await gPoint(gT('#sNav [data-sn="proj"]', '#cProj') || gT('#railProj', '#cProj') || gT('#cProj', '#cProj'), '«Espacios» junta chats, instrucciones y archivos de un mismo tema. La IA los tiene en cuenta en cada chat del espacio, como en Claude.', { side:true });
    await gPoint(gT('#sNav [data-sn="syn"]', '#cSyn') || gT('#railSyn', '#cSyn') || gT('#cSyn', '#cSyn'), '«Obras» guarda todo lo que la IA crea: páginas, juegos, dibujos y documentos. Cuando una respuesta trae una, se abre sola al lado del chat.', { side:true });
    const cfgB = gT('#sAcc', '#tabbar [data-tab="cfg"]') || gT('#cfgBtn', '#tabbar [data-tab="cfg"]');
    const rr = await gPoint(cfgB, 'En «Ajustes» cambias cómo se ve todo. ¿Te muestro lo más útil?', { buttons:[{ label:'Muéstrame' }, { label:'Ahora no', ghost:true }], auto:15000, mood:'guino' });
    if (rr === 0 && cfgB){
      SZ.cfgModal(); await gWait(700);
      await gPoint(gAny('#cfgCh'), '«Más bonito» trae todos los efectos. Si tu equipo va lento, «Más rápido» quita efectos y todo responde al instante.');
      await gPoint(gAny('#cfgTh'), 'Aquí eliges el color: Sinapse, Océano, Bosque, Lavanda y los que vienen.');
      await gPoint(gAny('#cfgUi'), 'Y el estilo: «Sonyx» con vidrio y animaciones, o «Simple», el más limpio y parecido a Claude.');
      await gPoint(gAny('#cfgSz'), 'Si quieres que todo se vea más pequeño, usa el tamaño compacto.');
      await gPoint(gAny('#cfgLang'), 'Y aquí pones la página en inglés o en español.');
      const x = $('#cfgm [data-close]'); if (x) x.click();
      await gWait(400);
    }
    await gPoint(gT('#guideTop', '#guideTop'), 'Y si te pierdes, la Guía rápida siempre está aquí: la ves completa o solo lo que quieras. También puedes preguntarme lo que sea tocando mi botón.', { mood:'guino' });
    H.unspot(); H.quiet();

    /* 4 · comparar 2 IA (ejemplo animado: no gasta nada) */
    gHud(4, 'Comparar 2 IA');
    const k0 = G.topics[0], recs = recommendTop(k0, 2);
    const names = [recs[0] ? recs[0] : null, recs[1] ? recs[1] : null];
    const nm = i => names[i] ? esc(names[i].name) : (i ? 'Mistral Small' : 'Llama 3.3');
    const avx = i => names[i] ? av(names[i], 'xs') : '<span class="av xs" style="--vc:' + (i ? '#f5c46b' : '#f2a07b') + '">' + (i ? 'M' : 'L') + '</span>';
    const D = GUIDE_DEMO[k0] || GUIDE_DEMO_ANY, q = GUIDE_PROMPTS[k0] || 'Dame una idea útil para hoy.';
    const P3 = gPanel('<h3>Así se ve comparar</h3><p class="gp-tag">Ejemplo animado · no gasta mensajes</p><div class="gd-q">' + esc(q) + '</div><div class="gd-wait"></div><div class="gd-grid"></div><div class="gp-act"><button type="button" class="btn sm flow" data-gnext hidden>Ahora pruébalo tú →</button></div>', 'demo', 'Mira: le hago la misma pregunta a 2 IA a la vez. Aparecen en el orden en que llegan.', 'sorprendida');
    const wait = $('.gd-wait', P3), grid = $('.gd-grid', P3);
    const pill = i => { const s = document.createElement('span'); s.innerHTML = avx(i) + nm(i) + ' está pensando <span class="dots"><i></i><i></i><i></i></span>'; wait.appendChild(s); return s; };
    const card = (i, first) => { const c = document.createElement('div'); c.className = 'gd-card'; c.innerHTML = '<div class="gd-who">' + avx(i) + '<b>' + nm(i) + '</b>' + (first ? '<span class="gd-fast">⚡ llegó primero</span>' : '') + '</div><ol>' + D[i].map(x => '<li>' + esc(x) + '</li>').join('') + '</ol><button type="button" class="gd-flow" data-gf="' + i + '">' + SZ.face(SZ.randomGoodFace ? SZ.randomGoodFace() : 'feliz', 20) + 'Esta tiene más Flow</button>'; return c; };
    const p0 = pill(0), p1 = pill(1);
    await gWait(1100); p1.classList.add('out'); setTimeout(() => p1.remove(), 400); grid.appendChild(card(1, true)); SZ.SND.tap();
    await gWait(1200); p0.classList.add('out'); setTimeout(() => p0.remove(), 400); grid.appendChild(card(0, false)); SZ.SND.tap();
    await gWait(500);
    await H.moveTo(grid.firstChild, { shape:'arrow', fx:.5, fy:.3 });
    const gs = $('.gp-say p', P3); if (gs){ gs._chars = null; gs.textContent = 'Con «+» puedes sumar otra IA incluso después de preguntar: responde lo mismo y aparece al lado.'; if (!SZ.reduce) SZ.typeIn(gs, { cps:70, max:1.6 }).catch(() => {}); }
    await gWait(3400);
    const fb = $('[data-gf]', grid);
    await H.click(fb);
    fb.classList.add('won'); const fr = fb.getBoundingClientRect(); burst(fr.left + fr.width / 2, fr.top + fr.height / 2, ['#e6b65f', '#ffe2a8', '#c9566c'], 12);
    if (gs){ gs._chars = null; gs.textContent = 'Cuando una te gusta más: «Esta tiene más Flow» y sigues el chat solo con ella.'; const f = $('.gp-say .sf', P3); if (f) f.innerHTML = SZ.face('riendo', 58); SZ.SND.blip('riendo'); if (!SZ.reduce) SZ.typeIn(gs, { cps:70, max:1.6 }).catch(() => {}); }
    const nb = $('[data-gnext]', P3); nb.hidden = false;
    await new Promise(res => { nb.addEventListener('click', res, { once:true }); const iv = setInterval(() => { if (!G || G.skip){ clearInterval(iv); res(); } }, 300); });
    gNeed(); gPanelClose(); H.quiet();

    /* 5 · chatear de verdad: las IAs conectadas ya está activada (si no lo está, la prueba de 5 mensajes de la guía) */
    gHud(5, 'Tu primer chat');
    const useSz = szOn() && !trialOn;
    let ok = useSz || (trialOn && trialLeft() > 0);
    if (useSz){ const pk = recommendTop(k0, 8).find(m => /^sz:/.test(m.id)) || info(APODEX); if (selId() !== pk.id) pickModel(pk.id, null); }
    if (!ok){ H.talk('Preparando tu EnerX de prueba…', { mood:'pensando' }); ok = await enterTrial(); }
    gNeed();
    if (!ok){
      await H.talk(connected(selId()) ? 'La prueba no está disponible ahora, pero ya tienes una IA conectada: practica con ella.' : 'Las IAs gratis están descansando un momento. Ahora te muestro Puter: una cuenta gratis para seguir.', { mood:'disculpa', buttons:[{ label:'Siguiente' }] });
    } else {
      await H.talk(useSz ? 'Ya puedes chatear gratis. Te escribo un mensaje de ejemplo sobre «' + TOPIC[k0].l + '».' : '¡Listo! Tu EnerX de prueba está al 100 %, solo para aprender. Te escribo uno de ejemplo sobre «' + TOPIC[k0].l + '».', { mood:'celebrando', auto:3200, buttons:[{ label:'Siguiente' }] });
      gNeed(); H.quiet();
      const myN = $$('.m.user', lane).length, errN = $$('.m.err', lane).length, left0 = trialLeft();
      await H.type(inp, GUIDE_PROMPTS[k0] || q); autoGrow(); updateHint(); gNeed();
      H.spot(sendBtn, 6); inp.setAttribute('data-guide-ok', ''); await H.moveTo(sendBtn, { shape:'point' });
      H.talk('Ahora envíalo tú con este botón (o con Enter). También puedes cambiar el texto.', { near:sendBtn, mood:'senalando' });
      const sent = await new Promise(res => { const t0 = Date.now(); const iv = setInterval(() => { if (!G || G.skip){ clearInterval(iv); res(false); } else if ($$('.m.user', lane).length > myN){ clearInterval(iv); res(true); } else if (Date.now() - t0 > 120000){ clearInterval(iv); res(false); } }, 250); });
      inp.removeAttribute('data-guide-ok'); gNeed(); H.unspot();
      if (sent){
        H.talk('¡Eso! Mira cómo llega la respuesta en vivo…', { mood:'pensando' });
        await new Promise(res => { const t0 = Date.now(); const iv = setInterval(() => { if (!G || G.skip || (!Object.keys(busy).length && Date.now() - t0 > 600) || Date.now() - t0 > 60000){ clearInterval(iv); res(); } }, 250); });
        gNeed();
        const last = $$('.m.bot', lane).pop(), failed = $$('.m.err', lane).length > errN || (!useSz && trialLeft() >= left0);
        if (failed){
          const em = $$('.m.err', lane).pop();
          if (em) await H.moveTo(em, { shape:'arrow', fx:.1, fy:.2 });
          await H.talk('Uy, esta vez no respondió (no gastaste nada). Ahora te muestro Puter: una cuenta gratis para tener siempre otra opción.', { near:em || inp, mood:'disculpa', buttons:[{ label:'Siguiente' }], auto:9000 });
        } else {
        if (last) await H.moveTo(last, { shape:'arrow', fx:.15, fy:.2 });
        SZ.SND.done();
        await H.talk(useSz ? '¡Lo lograste! Puedes seguir chateando gratis. Abajo ves cómo va tu límite de hoy.' : '¡Lo lograste! Todavía tienes EnerX de prueba para seguir practicando. Abajo dice quién la paga: Sinapse.', { near:last || inp, mood:'celebrando', buttons:[{ label:'Siguiente' }], auto:9000 });
        }
      } else await H.talk('Puedes enviarlo después: el mensaje te espera en la caja.', { mood:'guino', buttons:[{ label:'Siguiente' }] });
    }
    gNeed();

    /* 6 · ¿qué es Puter?: más IA con tus créditos personales */
    gHud(6, 'Tu Puter');
    H.quiet();
    const P6 = gPanel('<h3>¿Qué es Puter?</h3><div class="gp-pu"><div class="gp-pc" style="--i:0"><span class="gp-pi">' + SZ.puterLogo() + '</span><b>Tu versión pro de las IAs más usadas</b><small>ChatGPT, Claude, Gemini y más, en su versión más potente. Gratis.</small></div><div class="gp-pc" style="--i:1"><span class="gp-pi">✨</span><b>Con un límite cada mes</b><small>Tienes un saldo gratis que se llena de nuevo cada mes. Se crea con un clic, sin tarjeta.</small></div><div class="gp-pc" style="--i:2"><span class="gp-pi"><span class="sz-logo" aria-hidden="true"></span></span><b>Es opcional</b><small>Si no lo conectas, sigues con las IAs conectadas y su límite gratis de cada día.</small></div></div><div class="gp-act"><button type="button" class="lnk" data-glater>Después</button><span style="flex:1"></span>' + (puterOn() ? '<span class="gp-ok">✓ Ya tienes tu Puter conectado</span><button type="button" class="btn sm flow" data-gnext>Siguiente →</button>' : '<button type="button" class="btn sm flow" data-gnext>Conectar mi Puter</button>') + '</div>', 'puter', puterOn() ? 'Ya tienes tu Puter conectado: si se acaba tu límite de hoy, sigues con él.' : 'Ya puedes chatear gratis. Y si quieres más, con Puter usas la versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis, tiene un límite que se renueva cada mes y se conecta con un clic.', puterOn() ? 'encantada' : 'guino', 1);
    await gWait(420);
    H.wander && H.wander(P6);
    const r6 = await new Promise(res => { $('[data-gnext]', P6).addEventListener('click', () => res('go'), { once:true }); $('[data-glater]', P6).addEventListener('click', () => res('later'), { once:true }); const iv = setInterval(() => { if (!G || G.skip){ clearInterval(iv); res('later'); } }, 300); });
    H.wander && H.wander(null);
    gNeed(); gPanelClose(); H.quiet();
    if (r6 === 'go' && !puterOn()){
      openConnect(); await gWait(650);
      const b = $('#cPU');
      if (b){ await H.moveTo(b, { shape:'point' }); await H.talk('Toca aquí para conectar Puter. Se abre una ventanita para entrar y listo.', { near:b, mood:'senalando', buttons:[{ label:'Siguiente' }] }); }
    }
    gNeed();

    /* 7 · tu Drive (opcional): más espacio y una copia de tus chats */
    if (SZ.ACC.dcid && !(SZ.DRIVE.meta() || {}).linked){
      gHud(7, 'Tu Drive'); SZ.DRIVE.preload(); H.quiet();
      const r7 = await H.talk('¿Quieres más espacio? Vincula tu Google Drive y guardo una copia de tus chats en una carpeta privada de Sonyx. No puedo ver tus otros archivos.', { mood:'encantada', buttons:[{ label:'Vincular mi Drive' }, { label:'Ahora no', ghost:true }] });
      gNeed();
      if (r7 === 0){ H.quiet(); const ok = await driveGo(null); gNeed(); if (ok) await H.talk('¡Hecho! Desde ahora tus chats también viven en tu Drive. Lo encuentras en «⋯ › Google Drive».', { mood:'celebrando', buttons:[{ label:'Terminar' }] }); }
      else { H.talk('Sin problema. Cuando quieras, está en Ajustes › Tus IAs › Google Drive.', { mood:'guino' }); await gWait(2400); }
      gNeed();
    }
    endGuide(true);
  }catch(e){ if (!(e && e.guide)) { console.error('[synthz] guía', e); endGuide(false); } }
}
function endGuide(done){
  if (!G) return;
  const was = G; G = null; was.skip = true;
  try{ localStorage.setItem('synthz:guide', '1'); localStorage.setItem('synthz:tour', '1'); }catch(e){}
  gPanelClose(); root.classList.remove('guiding'); try{ inp.removeAttribute('data-guide-ok'); }catch(e){}
  const h = $('#szgHud'); if (h){ h.classList.remove('on'); setTimeout(() => h.remove(), 500); }
  if (done){ SZ.SND.done(); burst(innerWidth / 2, innerHeight * .3, ['#e6b65f', '#c9566c', '#ffe2a8', '#8fb0ff'], 22); H.talk('¡Ya tienes el Flow! Si me necesitas, la Guía está siempre a mano.', { mood:'flow' }); setTimeout(() => H.hide(), 3200); }
  else H.hide();
}
addEventListener('keydown', e => { if (e.key === 'Escape' && G && !document.querySelector('.szm,#conn,#acc,#sx,#blk')){ e.preventDefault(); endGuide(false); } });
/* ===== v2.0 · Guía por temas: Sona muestra solo lo que elegiste, en el orden en que lo elegiste ===== */
const TOPIC_STEPS = {
  chat:async () => {
    await gPoint(gT('#inp', '#inp'), 'Aquí escribes lo que necesitas. Entre más detalles le das (qué quieres, para qué y cómo), mejor te responde.');
    await gPoint(gT('#sendBtn', '#sendBtn'), 'Con esta flecha, o con Enter, lo envías. Si se demora mucho, el mismo botón la detiene.');
    const ex = gT('#hexR', '#hexR'); if (ex) await gPoint(ex, 'Si no sabes qué pedir, toca una de estas ideas: se escribe sola y tú decides cuándo enviarla.');
  },
  ia:async () => {
    if (agentOn()){ await gPoint(gT('#ssTop', '#ssTop'), 'Ahora estás con Apex: él elige la IA por ti. Si quieres elegirla tú, toca aquí y «Elegir yo la IA».'); return; }
    await gPoint(gAny('#cPick', '#curChip'), 'Aquí eliges con qué IA hablas. Tócalo y se abre su ventana con temas, buscador y filtros.');
    const tc = gT('.tchip[data-topic]', '.tchip[data-topic]'); if (tc) await gPoint(tc, 'Cada tema te recomienda las IA que mejor lo hacen. Por ejemplo, «Código» te muestra las expertas en programar.');
  },
  comparar:async () => {
    if (agentOn()){ await gPoint(null, 'Comparar se usa sin Apex: vuelve a «Chats» y verás el botón «Comparar con otra IA» abajo.'); return; }
    await gPoint(gAny('#sNav [data-sn="cmp"]', '#pickRow [data-add]'), 'Aquí, aparte, comparas IAs: eliges hasta 4. Todas responden la misma pregunta y aparecen lado a lado, en el orden en que llegan. Ojo: cada una gasta lo suyo.');
  },
  agente:async () => {
    await gPoint(gT('#cMode', '#cMode'), 'Apex se elige aquí, en el botón de modo junto a la caja de escribir.');
    await gPoint(null, 'Con Apex no eliges IA: tú escribes, él entiende tu pedido, lo mejora, elige la IA que más sabe de eso y te muestra cada paso. Al final decides si te quedas con esa IA o sigues con Apex.', { mood:'guino' });
  },
  archivos:async () => {
    await gPoint(gT('#attachBtn', '#attachBtn'), 'Con el «+» le das a la IA fotos, PDF o archivos de texto. Ahí mismo creas imágenes, buscas en internet o pides respuestas cortas.');
    const fc = gT('.fcard', '.fcard');
    if (fc) await gPoint(fc, 'Y cuando la IA te da un archivo, sale así: tócalo para ver el código; si es una página, mira su vista previa y descárgala con su nombre.');
    else await gPoint(null, 'Y cuando la IA te da un archivo (una página, un código…), sale como una tarjeta: ves el código, su vista previa si se puede, y lo descargas con su nombre.');
  },
  extras:async () => {
    await gPoint(gT('#attachBtn', '#attachBtn'), 'En el «+» está «Buscar en internet»: la IA busca datos de hoy y te muestra de dónde los sacó. Si preguntas por algo de hoy, busca sola.');
    await gPoint(gT('#sAcc', '#tabbar [data-tab="cfg"]') || gT('#cfgBtn', '#tabbar [data-tab="cfg"]'), 'Y en Ajustes › «Memoria» ves lo que recuerdo de ti y lo borras cuando quieras.', { side:true });
    await gPoint(null, 'Un truco más: escribe «hazme una presentación de…» y te la entrego lista para PowerPoint.', { mood:'guino' });
  },
  chats:async () => {
    await gPoint((gT('#thList', '#tabbar [data-tab="chats"]') || gT('#rail [data-r="chats"]', '#tabbar [data-tab="chats"]')), 'Tus chats quedan aquí. Si entras con tu cuenta, los ves en cualquier celular o computador.', { side:true });
    await gPoint((gT('#sNav [data-sn="more"]', '#tabbar [data-tab="chats"]') || gT('#railFav', '#tabbar [data-tab="chats"]')), 'Y aquí tus favoritos: las respuestas que guardas con la estrella ★.', { side:true });
  },
  limite:async () => {
    await gPoint(gAny('#payPill', '#railCoin', '#payL', '#payM'), 'Aquí ves cómo va tu límite gratis de hoy: el anillo se va vaciando y a medianoche se llena otra vez. Sin cuenta tienes una EnerX de prueba; con tu cuenta gratis dura mucho más.', { pad:6 });
  },
  cuenta:async () => {
    await gPoint((gT('#sAcc', '#tabbar [data-tab="me"]') || gT('#accBtn', '#tabbar [data-tab="me"]')), 'Aquí entras o creas tu cuenta gratis: sin correo ni tarjeta. Tus chats y favoritos te siguen a todas partes.', { side:true });
    await gPoint(null, 'Y si quieres más, conecta Puter y usa la versión pro de las IAs más usadas (ChatGPT, Claude, Gemini…), gratis y con un clic.', { mood:'guino' });
  },
  ajustes:async () => {
    await gPoint(gT('#sAcc', '#tabbar [data-tab="cfg"]') || gT('#cfgBtn', '#tabbar [data-tab="cfg"]'), 'Ajustes está en tu perfil y tiene un menú a la izquierda: «Cuenta», «General» (estilo, color e idioma), «Efectos» (más bonito o más rápido, sonidos, animaciones), «Respuestas» (modo principiante, respuestas cortas), «Memoria» (lo que recuerdo de ti) y «Tus IAs».', { side:true });
  },
  synthonia:async () => {
    await gPoint(gT('#szBot', '#szBot'), 'Y yo siempre estoy aquí. Tócame y pregúntame cómo se hace algo: te lo explico o te lo señalo con mi puntero de luz.', { mood:'encantada' });
  }
};
async function runTopics(list){
  await SZ.synReady;
  list = (list || []).filter(k => TOPIC_STEPS[k]);
  if (G || !list.length) return;
  closeSide(); closeChatsSheet(); if (tourEl) closeTour(false);
  G = { skip:false, total:list.length, topics:[] };
  root.classList.add('guiding');
  try{
    if (mode !== 'solo') setMode('solo');
    H.show({ x:innerWidth - 60, y:innerHeight - 70 });
    await gWait(80);
    for (let i = 0; i < list.length; i++){
      const T = SZ.GTOPICS.find(t => t[0] === list[i]);
      gHud(i + 1, T ? T[1] : 'Guía');
      await TOPIC_STEPS[list[i]]();
      H.unspot && H.unspot();
    }
    endGuide(true);
  }catch(e){ if (!(e && e.guide)) console.error('[synthz] guía', e); endGuide(false); }
}
window.SynthFlowTopics = runTopics;
/* =====================================================================
   Primera vez en Sonyx (camino B): 1 ¿qué quieres FlowIA'r? · 2 elige tu IA · 3 chatea
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
    const o = document.createElement('div'); o.id = 'bflow'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Empieza en Sonyx');
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

/* ---------- conexión: las IAs conectadas (ya activada para todos) y, si quieres más, tu Puter ---------- */
let connEl = null;
function puterOn(){ return !!(window.puter && puter.auth && puter.auth.isSignedIn()); }
function orOn(){ return false; }   /* OpenRouter ya no se muestra a las personas */
function openOrGuide(){ SZ.orGuide(() => { afterConnect('¡OpenRouter desbloqueado!'); paintProv(); renderList({ keep:true }); updateHint(); }); }
function gqOn(){ return false; }
/* las IAs conectadas: activada salvo que el servidor diga que no tiene llaves (mientras carga, se asume que sí) */
function szOn(){ const q = SZ.SZQ; return q.on !== false && !(q.limit > 0 && (q.used || 0) >= q.limit) && !SZ.guestFull(); }
function connected(id){ return /^tr:/.test(String(id)) ? trialOn && trialLeft() > 0 : /^sz:/.test(String(id)) ? szOn() : /^pu:/.test(String(id)) ? puterOn() : /^gq:/.test(String(id)) ? gqOn() : orOn(); }
let szqT = 0; addEventListener('synthz-szq', () => { clearTimeout(szqT); szqT = setTimeout(() => { try{ paintPay(); paintProv(); paintLock(); renderFoot(); if (!Object.keys(busy).length) renderTop(); }catch(e){} }, 120); });
addEventListener('synthz-puter-out', () => { try{ paintPay(); }catch(e){} });
addEventListener('synthz-useputer', () => { try{ switchProv('pu'); }catch(e){} });
const trialLeft = () => { const t = SZ.trialGet(); return t && t.token ? +t.left || 0 : 0; };
/* entrar y salir de la prueba guiada */
async function enterTrial(){
  try{ await SZ.trialStart(); }
  catch(e){ toast(e.status === 429 ? 'Ya hiciste varias pruebas hoy. Para seguir, conecta Puter: es gratis y con un clic.' : e.status === 503 ? 'La prueba todavía no está lista. Conecta Puter: es gratis y con un clic.' : (e.message || 'No pude empezar la prueba.')); return false; }
  trialOn = true; if (mode !== 'solo') setMode && setMode('solo');
  renderTrialBar(); renderTop(true); renderMsgs(); renderNow(); updateHint(); paintSel();
  return true;
}
function exitTrial(quiet){ if (!trialOn) return; trialOn = false; renderTrialBar(); renderTop(true); renderMsgs(); renderNow(); updateHint(); paintSel(); if (!quiet) toast('Saliste de la prueba guiada.'); }
function renderTrialBar(){
  const bar = $('#trialBar'); if (!bar) return;
  paintPay();
  /* lo que queda de la prueba se ve abajo (computador) o junto a la IA (celular); esta barra solo sale al terminarse */
  if (!trialOn || trialLeft() > 0){ bar.hidden = true; return; }
  const max = (SZ.trialGet() || {}).max || 5;
  bar.hidden = false;
  bar.innerHTML = '<span class="tb-ico" aria-hidden="true">✨</span><span><b>Se acabaron tus ' + max + ' mensajes de prueba.</b> Para seguir, conecta Puter: es gratis y con un clic.</span><button type="button" class="btn sm" data-tx="conn">Conectar</button><button type="button" class="lnk" data-tx="exit">Salir</button>';
}
$('#trialBar').addEventListener('click', e => { const b = e.target.closest('[data-tx]'); if (!b) return; if (b.dataset.tx === 'conn'){ exitTrial(true); openConnect(); } else exitTrial(); });
addEventListener('synthz-trial', () => { if (trialOn){ renderTrialBar(); renderNow(); } });
window.SynthFlowTrial = { enter:enterTrial, exit:exitTrial, on:() => trialOn };

/* ---------- bloqueo: solo si las IAs conectadas está apagada y no hay Puter (ni prueba activa) ---------- */
let lockReady = !!(window.__puterOK || window.__puterBlocked), lockWas = null, lockAt = 0;
addEventListener('puter-ready', () => { lockReady = true; paintLock(); });
addEventListener('puter-blocked', () => { lockReady = true; paintLock(); });
setTimeout(() => { lockReady = true; paintLock(); }, 2600);
SZ.accHooks.push(() => { lockWas = null; paintLock(); }); addEventListener('synthz-acc', () => { lockWas = null; paintLock(); });
function isLocked(){ return lockReady && !G && !szOn() && !(trialOn && trialLeft() > 0) && !puterOn() && !orOn() && !gqOn(); }
function paintLock(){
  const L = isLocked(), gst = L && SZ.guestFull(), key = L + ':' + gst;
  if (key === lockWas) return;
  lockWas = key; lockAt = Date.now();
  document.body.classList.toggle('locked', L);
  const c = $('#lockCard'); if (c) c.hidden = !L;
  inp.readOnly = L; inp.setAttribute('aria-disabled', String(L));
  inp.placeholder = L ? (gst ? (isMobile() ? 'Entra para seguir…' : 'Entra a tu cuenta para seguir FlowIAndo…') : isMobile() ? 'Conecta tu Puter…' : 'Conecta tu Puter para escribir…') : 'Escribe tu mensaje…';
  $$('#lockCard [data-lk="acc"],#lockCard [data-lk="in"]').forEach(b => { b.hidden = !gst; });
  $$('#lockCard [data-lk="pu"],#lockCard [data-lk="guide"]').forEach(b => { b.hidden = !!gst; });
  SZ.TEL.locked = L;
  if (L){
    const done = trialOn && trialLeft() <= 0;
    const gm = (SZ.SZQ.guest && SZ.SZQ.guest.max) || 5;
    $('#lockT').textContent = gst ? 'Para seguir FlowIAndo, entra a tu cuenta' : done ? 'Se acabó tu EnerX de prueba' : SZ.SZQ.on === false ? 'Las IAs gratis están descansando' : 'Usaste tu límite gratis de hoy';
    $('#lockS').textContent = gst ? 'Se acabó tu EnerX de prueba de hoy. Crear tu cuenta es gratis, sin correo ni tarjeta, y te da mucho más límite cada día.' : done ? 'Para seguir chateando conecta tu cuenta de Puter (gratis, con un clic).' : 'Vuelve en un momento, o sigue ya con Puter. Conecta tu versión pro de las IAs más usadas.';
    SZ.telEv('noai', 'sin IA: la de Sinapse está apagada y no hay Puter');
    if (side.classList.contains('open')) closeSide();
  } else { wHide(); }
  try{ renderTop(); }catch(e){}
}
setInterval(paintLock, 1500);
{ paintAgent(); $$('.agentb-x').forEach(ab => { ab.addEventListener('click', () => { st().agent = !agentOn(); save(); paintAgent(); toast(agentOn() ? 'Apex encendido: antes de enviar, mejora tu pedido y elige la IA que más sabe de eso.' : 'Apex apagado: tu mensaje va tal cual.'); }); }); }
function lockNudge(){
  try{ SZ.BOT.problem && SZ.BOT.problem('lock'); }catch(e){}
  const c = $('#lockCard'); if (!c || c.hidden) return;
  c.classList.remove('nudge'); void c.offsetWidth; c.classList.add('nudge');
  confuse(1.5);
}
$('#lockCard').addEventListener('click', async e => {
  const b = e.target.closest('[data-lk]'); if (!b) return;
  const k = b.dataset.lk;
  if (k === 'acc' || k === 'in'){ SZ.guestGate({ mode:k === 'acc' ? 'signup' : 'login', done:() => { lockWas = null; paintLock(); renderAccBtn && renderAccBtn(); } }); return; }
  if (k === 'pu'){
    try{ await puterSignIn(); afterConnect('¡Puter conectado!'); paintLock(); }
    catch(err){ if (!(err && err.shown)) toast('No terminaste de entrar a Puter. Inténtalo otra vez.'); }
  } else openGuide();
});
inp.addEventListener('pointerdown', () => { if (isLocked()) lockNudge(); });
inp.addEventListener('keydown', e => { if (isLocked() && e.key.length === 1){ lockNudge(); } });

/* ---------- Sona preocupada: si te ve perdido (muchos clics al azar o el mouse por todas partes) ---------- */
const CF = { pts:[], hits:[], shows:0, last:0 };
function wBusy(){ return !!(G || document.querySelector('#szWorry,#conn,.szm,#szgPanel,#bflow,#tour,#side.open,#blk,#acc,#sx,#portal,#drv')); }
function confuse(w){
  if (!isLocked() || wBusy() || Date.now() - lockAt < 1800) return;
  const now = Date.now(); CF.hits = CF.hits.filter(h => now - h[0] < 6000); CF.hits.push([now, w || 1]);
  if (CF.hits.reduce((a, h) => a + h[1], 0) >= 6) worry();
}
document.addEventListener('pointerdown', e => {
  if (!isLocked() || e.target.closest('#lockCard,#szWorry,#inp')) return;
  /* los clics que no hacen nada (zonas vacías) cuentan más que los clics en botones */
  confuse(e.target.closest('button,a,input,textarea,select,label,[role=button]') ? .8 : 1.4);
}, true);
document.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || !isLocked() || wBusy()) return;
  const now = Date.now(); CF.pts.push([now, e.clientX, e.clientY]);
  CF.pts = CF.pts.filter(p => now - p[0] < 2600);
  if (CF.pts.length < 25) return;
  let d = 0, turns = 0, sx = 0;
  for (let i = 1; i < CF.pts.length; i++){
    const dx = CF.pts[i][1] - CF.pts[i - 1][1], dy = CF.pts[i][2] - CF.pts[i - 1][2]; d += Math.hypot(dx, dy);
    const sg = Math.sign(dx); if (Math.abs(dx) > 6 && sg && sx && sg !== sx) turns++; if (Math.abs(dx) > 6 && sg) sx = sg;
  }
  /* mucho recorrido y muchos cambios de dirección en ~2,5 s = mouse «perdido» */
  if (d > 1.7 * (innerWidth + innerHeight) && turns >= 6){ CF.pts = []; confuse(6); }
}, { passive:true });
const W_FAQ = [
  ['¿Por qué no puedo escribir?', 'Porque ahora no hay ninguna IA libre para ti: usaste tu límite gratis de hoy o las IAs están descansando. Conecta Puter y la caja se abre al instante.'],
  ['¿Qué es Puter?', 'Con Puter usas la versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis, tiene un límite que se renueva cada mes y se conecta con un clic.'],
  ['¿Me cobran algo?', 'No. Sinapse es gratis y nunca te cobra. Tienes un límite gratis cada día.'],
  ['¿Qué hay en la Guía?', 'Te muestro todo paso a paso con mi puntero de luz: temas, IA recomendadas para ti, cómo comparar dos y tu primer chat de verdad.']
];
let wTok = 0;
const zz = ms => new Promise(r => setTimeout(r, ms));
function wSay(text, mood){
  const w = $('#szWorry'); if (!w) return Promise.resolve();
  const p = $('.wb p', w); p._chars = null; p.textContent = text;
  if (mood){ const f = $('.wme', w); f.innerHTML = SZ.face(mood, isMobile() ? 60 : 72); }
  SZ.SND.blip(mood || 'preocupada');
  return SZ.reduce ? Promise.resolve() : SZ.typeIn(p, { cps:60, max:1.8 }).catch(() => {});
}
function wHide(){
  const w = $('#szWorry'); if (!w) return; wTok++;
  w.classList.add('out'); w.classList.remove('say'); document.body.classList.remove('szworrying');
  try{ SZ.HAND.unspot(); SZ.HAND.hide(); }catch(e){}
  setTimeout(() => w.remove(), 650);
}
async function worry(){
  if (wBusy() || CF.shows >= 3 || Date.now() - CF.last < 45000) return;
  CF.shows++; CF.last = Date.now(); CF.hits = []; CF.pts = [];
  const tok = ++wTok, H2 = SZ.HAND, alive = () => tok === wTok && $('#szWorry');
  const w = document.createElement('div'); w.id = 'szWorry'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'Sona');
  w.innerHTML = '<div class="wb"><button type="button" class="wx" data-w="x" aria-label="Cerrar">×</button><b>Sona</b><p></p><div class="wq" hidden>' + W_FAQ.map((q, i) => '<button type="button" data-wq="' + i + '">' + esc(q[0]) + '</button>').join('') + '</div><div class="wa" hidden><button type="button" class="btn sm flow" data-w="guide">Mostrarme la Guía</button><button type="button" class="btn sm ghost" data-w="conn">Conectar una IA</button></div></div>'
    + '<button type="button" class="wme" data-w="me" aria-label="Sona">' + SZ.face('preocupada', isMobile() ? 60 : 72) + '</button>';
  document.body.appendChild(w); document.body.classList.add('szworrying');
  /* en celular se para justo encima del aviso de bloqueo, sin taparlo */
  const lk0 = $('#lockCard'); if (isMobile() && lk0 && !lk0.hidden) w.style.bottom = Math.max(150, innerHeight - lk0.getBoundingClientRect().top + 12) + 'px';
  w.addEventListener('click', e => {
    const q = e.target.closest('[data-wq]'); if (q){ wTok++; const [t, a] = W_FAQ[+q.dataset.wq]; wSay(a, 'feliz'); return; }
    const b = e.target.closest('[data-w]'); if (!b) return;
    const k = b.dataset.w;
    if (k === 'x'){ wHide(); return; }
    if (k === 'me'){ w.classList.toggle('say'); return; }
    wHide();
    if (k === 'guide') setTimeout(openGuide, 300); else setTimeout(openConnect, 300);
  });
  requestAnimationFrame(() => w.classList.add('in'));
  await zz(SZ.reduce ? 60 : 650); if (!alive()) return;
  w.classList.add('say');
  await wSay('Ay… te veo un poquito perdido 😟', 'preocupada'); if (!alive()) return;
  await zz(SZ.reduce ? 200 : 700); if (!alive()) return;
  /* con su puntero: primero se señala a ella, luego la Guía (se nota el esfuerzo) */
  const me = $('.wme', w), gd = [$('#guideTop')].find(n => n && n.getClientRects().length && n.getBoundingClientRect().width);
  try{
    H2.show({ x:innerWidth * .55, y:innerHeight * .45 });
    wSay('Tranqui, aquí estoy yo. Si tienes dudas o necesitas ayuda, pregúntame sin pena…', 'senalando');
    await H2.moveTo(me, { shape:'point', fx:.3, fy:.2 }); if (!alive()) return;
    H2.spot(me, 6); await H2.click(null); await zz(SZ.reduce ? 300 : 1500); if (!alive()) return;
    if (gd){
      wSay('…o échale un ojo a la Guía: ahí te enseño todo paso a paso. 👀', 'guino');
      await H2.moveTo(gd, { shape:'point' }); if (!alive()) return;
      H2.spot(gd, 6); await H2.click(null); await zz(SZ.reduce ? 300 : 1700); if (!alive()) return;
    }
    const lk = $('#lockCard');
    if (lk && !lk.hidden){
      wSay('Y para escribir, solo falta conectar una IA aquí. ¡Es un clic!', 'senalando');
      await H2.moveTo($('[data-lk="pu"]', lk) || lk, { shape:'point' }); if (!alive()) return;
      H2.spot(lk, 6); await zz(SZ.reduce ? 300 : 1500); if (!alive()) return;
    }
  }catch(e){}
  try{ H2.unspot(); H2.hide(); }catch(e){}
  if (!alive()) return;
  $('.wq', w).hidden = false; $('.wa', w).hidden = false;
  if (!SZ.reduce) $$('.wq button,.wa .btn', w).forEach((n, i) => n.animate([{ opacity:0, transform:'translateY(8px)' }, { opacity:1, transform:'none' }], { duration:420, delay:i * 60, easing:'cubic-bezier(.22,1,.36,1)', fill:'backwards' }));
  wSay('¿Te ayudo con algo de esto? Toca una pregunta y te respondo al tiro.', 'feliz');
}
function needsConn(){ return (mode === 'cmp' ? st().cmp : [selId()]).some(id => !connected(id)); }
async function puterSignIn(opts){
  if (!window.puter){ showBlockHelp(window.__puterBlocked ? 'script' : 'script'); throw Object.assign(new Error('sin puter'), { shown:true }); }
  try{ return await puter.auth.signIn(opts || {}); }
  catch(e){ if (e && (e.error === 'popup_blocked' || e.code === 'popup_blocked')){ window.__popupBlocked = true; showBlockHelp('popup'); throw Object.assign(new Error('popup'), { shown:true }); } throw e; }
}
function mScore(m){ const b = (m.id.match(/(\d{2,3})b/i) || [])[1]; return (b ? +b : 20) + (m.reasoning ? 25 : 0) + Math.min(m.ctx, 262144) / 8000 + (/gpt-oss|deepseek|qwen|llama-3\.3|gemini|kimi|glm/i.test(m.id) ? 15 : 0) + (/^pu:/.test(m.id) && /gpt-5|gemini-3|claude|deepseek/i.test(m.id) ? 40 : 0) - (/nano|lite|mini/i.test(m.id) ? 10 : 0) + (/gpt-5\.6-luna$/i.test(m.id) ? 30 : 0) + (/^or:openrouter\/free$/.test(m.id) ? 20 : 0) + (/^gq:/.test(m.id) && gqOn() ? 60 : 0) + (m.id === 'sz:auto' ? 140 : /^sz:/.test(m.id) ? 10 : 0) - (/allam/i.test(m.id) ? 999 : 0) - (SZ.isBad(m.id) ? 999 : 0); }
function bestOf(prefix){ const l = cat.list.filter(m => m.id.startsWith(prefix + ':') && (m.free || prefix === 'pu')); if (prefix === 'sz' || prefix === 'or'){ const ap = l.find(m => m.id === APODEX); if (ap) return ap; } return l.length ? l.slice().sort((a, b) => mScore(b) - mScore(a))[0] : null; }
function switchProv(prefix){
  if (mode !== 'solo') setMode('solo');
  const b = bestOf(prefix);
  if (!b){ toast('No encontré IA de ' + (prefix === 'pu' ? 'Puter' : prefix === 'sz' ? 'las IAs conectadas' : 'ese lugar') + ' ahora mismo.'); return; }
  pickModel(b.id, null); toast('Cambié a ' + b.name + '.');
  if (!connected(b.id)) openConnect();
}
/* el mejor modelo que ya puedes usar; si no hay ninguno, el mejor de Puter (solo pide un clic) */
function bestUsable(strict){
  const l = cat.list.filter(m => m.free || /^pu:/.test(m.id)); if (!l.length) return null;
  const ok = l.filter(m => connected(m.id)), pu = l.filter(m => /^pu:/.test(m.id));
  const pool = ok.length ? ok : strict ? [] : pu;
  if (!pool.length) return null;
  return pool.slice().sort((a, b) => mScore(b) - mScore(a))[0];
}
/* si el modelo elegido no se puede usar pero hay otro conectado, cambia solo */
function fixModel(quiet){
  if (mode !== 'solo' || !cat.list.length) return false;
  if (Object.keys(busy).length) return false;   /* v3.3 · nunca cambia la IA mientras una está respondiendo */
  const cur = selId(), missing = !idx.has(cur);
  if (/^pu:/.test(cur) && !window.__puterBlocked && !cat.list.some(m => /^pu:/.test(m.id))) return false;
  if (!missing && st().pinned === cur) return false;
  if (!missing && connected(cur)) return false;
  const b = bestUsable(!missing);
  if (!b || b.id === cur) return false;
  pickModel(b.id, null);
  if (!quiet) toast('Te puse ' + b.name + ', que ya puedes usar.');
  return true;
}
function applySurvey(force){
  const s = st().survey; if (!s || !cat.list.length || (!force && s.applied)) return;
  const picks = SZ.surveyPicks(cat.list, s, 8).filter(id => connected(id) || /^pu:/.test(id));
  if (!picks.length) return;
  s.applied = Date.now(); save();
  if (mode !== 'solo') setMode('solo');
  st().pinned = picks[0]; pickModel(picks[0], null);
  toast('Según lo que me contaste, te recomiendo ' + info(picks[0]).name + '. Mira el filtro «Para ti».');
}
function afterConnect(msg){ try{ SZ.accStart(); }catch(e){} toast(msg); burst(innerWidth / 2, innerHeight / 2); fixModel(true); refresh(true); renderMsgs(); updateHint(); }
/* se llama dentro del clic/Enter: así el inicio de sesión de Puter no queda bloqueado */
async function ensureConn(){
  if (!needsConn()) return true;
  if (fixModel(false) && !needsConn()) return true;
  const ids = mode === 'cmp' ? st().cmp : [selId()];
  if (window.puter && ids.every(id => connected(id) || /^pu:/.test(id))){
    const slow = setTimeout(() => toast('Abriendo Puter… entra en la ventanita que aparece. Tu mensaje te espera en la caja.'), 900);
    try{ await puterSignIn(); clearTimeout(slow); afterConnect('¡Puter conectado!'); return !needsConn(); }
    catch(e){ clearTimeout(slow); if (!(e && e.shown)) toast('No terminaste de entrar a Puter. Inténtalo otra vez.'); return false; }
  }
  openConnect(); return false;
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-conn]')){ e.preventDefault(); openConnect(); } });
function openConnect(){
  if (connEl) return;
  const hasP = puterOn(), on = szOn(), q = SZ.SZQ, left = Math.max(0, (q.limit || 20000) - (q.used || 0)), legacy = !!(st().keys.openrouter || st().keys.groq);
  connEl = document.createElement('div'); connEl.id = 'conn';
  connEl.innerHTML = '<div class="tcard"><div class="word" id="cWord"></div><div class="tn">TU IA</div><div class="tb"><h3>' + (on ? 'Ya puedes chatear gratis' : 'Las IAs están descansando') + '</h3><p>' + (on ? 'No tienes que conectar nada. Solo escribe.' : 'Vuelve en un momento, o sigue ya con Puter.') + '</p></div>'
    + SZ.limBar({ title:'Tu EnerX de hoy' })
    + '<div class="cbox"><span>' + SZ.puterLogo() + 'Puter <small class="opt">tus IAs pro</small></span>' + (hasP ? '<i class="ok">✓ Conectado</i>' : '<button class="btn sm" id="cPU" type="button">Conectar Puter</button>') + '</div>'
    + '<p class="cnote"><b>¿Qué es Puter?</b> Con Puter usas la versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini. Es gratis, tiene un límite que se renueva cada mes y se conecta con un clic.</p>'
    + '<div class="tbtn" style="margin-top:18px"><button class="lnk" id="cClose" type="button">Cerrar</button></div></div>';
  document.body.appendChild(connEl); $('#cWord').innerHTML = zWord('Synth');
  requestAnimationFrame(() => connEl.classList.add('on'));
  $('.tcard', connEl).animate([{ transform:'scale(.9) translateY(24px)', opacity:0, filter:'blur(10px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { if (!connEl) return; const el = connEl; connEl = null; el.classList.remove('on'); setTimeout(() => el.remove(), 520); };
  connEl._close = close;
  $('#cClose').addEventListener('click', close);
  connEl.addEventListener('pointerdown', e => { if (e.target === connEl) close(); });
  const lx = $('#cLegx'); if (lx) lx.addEventListener('click', async () => { if (!(await SZ.szConfirm('¿Quitar tus llaves de antes?', 'Se borran solo de este equipo. Ya no las necesitas: las IAs conectadas son gratis para todos.', 'Quitar', true))) return; delete st().keys.openrouter; delete st().keys.groq; if (/^(or|gq):/.test(st().model.openrouter || '')) st().model.openrouter = APODEX; save(); close(); toast('Listo: quitaste tus llaves de este navegador.'); refresh(true); paintProv(); paintLock(); });
  const pu = $('#cPU');
  if (pu) pu.addEventListener('click', () => {
    if (!window.puter){ showBlockHelp('script'); return; }
    pu.textContent = 'Conectando…';
    puterSignIn().then(() => { close(); afterConnect('¡Puter conectado!'); }).catch(e => { pu.textContent = 'Conectar con Puter'; if (!(e && e.shown)) toast('No terminaste de entrar a Puter. Inténtalo otra vez.'); });
  });
}

/* ---------- ayuda con bloqueadores de ventanas y de anuncios ---------- */
function browserName(){ const u = navigator.userAgent; if (navigator.brave) return 'Brave'; if (/Edg\//.test(u)) return 'Edge'; if (/OPR\//.test(u)) return 'Opera'; if (/Firefox\//.test(u)) return 'Firefox'; if (/Safari\//.test(u) && !/Chrome\//.test(u)) return 'Safari'; return 'Chrome'; }
const ICO = {
  pop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/><path d="M10 12.5l4 4M14 12.5l-4 4" stroke="#ff8f7a"/></svg>',
  ext:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4a2 2 0 0 1 4 0v2h3a1 1 0 0 1 1 1v3h-1.5a2 2 0 0 0 0 4H18v3a1 1 0 0 1-1 1h-3v-1.5a2 2 0 0 0-4 0V20H7a1 1 0 0 1-1-1v-3h1.5a2 2 0 0 0 0-4H6V7a1 1 0 0 1 1-1h3z"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>',
  lock:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
};
let blkEl = null;
function showBlockHelp(kind){
  if (kind === 'popup') window.__popupBlocked = true;   /* recuerda que de verdad hubo una ventanita bloqueada */
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
addEventListener('puter-ready', () => { const go = () => loading ? setTimeout(go, 300) : (refresh(true), renderNow()); go(); });
if (window.puter && !cat.list.some(m => /^pu:/.test(m.id))) setTimeout(() => { const go = () => loading ? setTimeout(go, 300) : refresh(true); go(); }, 0);
addEventListener('puter-blocked', () => { toast('Tu bloqueador de anuncios está frenando a Puter.'); });
function warnBlocked(){
  if (!window.__puterBlocked) return;
  try{ if (sessionStorage.getItem('synthz:blkwarn')) { toast('Puter no carga en tu navegador. Toca «⋯ › Ayuda: algo no carga».'); return; } sessionStorage.setItem('synthz:blkwarn', '1'); }catch(e){}
  showBlockHelp('script');
}

/* ---------- SynXCoin's: medidor, límite diario, avisos y modo ahorro ---------- */
function todayUsed(){ return SZ.todayAll(); }
let sxEl = null;
function budgetOk(){ return true; }        /* ya no hay límite personal: el límite de hoy lo pone Sinapse */
let limWarned = '';
function coinWatch(){
  const q = SZ.SZQ; if (!q.limit || q.on === false) return;
  const k = SZ.limPct(), d = today();
  if (k >= 1 && limWarned !== d + 'x'){ limWarned = d + 'x'; toast(puterOn() ? 'Llegaste al límite de hoy. Sigues con tu Puter.' : 'Usaste tu límite gratis de hoy. A medianoche se llenan otra vez, o sigue ya con Puter.'); try{ SZ.BOT.react && SZ.BOT.react('limit'); }catch(e){} }
  else if (k >= .8 && k < 1 && !limWarned.startsWith(d)){ limWarned = d; toast('Te queda poco por hoy: ' + SZ.limTxt().toLowerCase() + '.'); }
}
addEventListener('synthz-szq', coinWatch);
function coinModal(kind){
  if (sxEl) sxEl.remove();
  const T = {
    pu:['Usaste el saldo de este mes de Puter', 'Se llena otra vez el próximo mes. Mientras tanto sigues con las IAs conectadas, gratis.'],
    or:['Llegaste al límite de hoy', 'A medianoche se llenan otra vez. Si quieres seguir ya, conecta Puter. Conecta tu versión pro de las IAs más usadas.'],
    panel:['Tu límite de hoy', 'Tienes un límite gratis cada día. A medianoche se llena otra vez.']
  }[kind] || ['Tu límite de hoy', ''];
  sxEl = document.createElement('div'); sxEl.id = 'sx';
  sxEl.innerHTML = '<div class="tcard" role="dialog" aria-modal="true"><div class="word" id="sxWord"></div><div class="tn">TU LÍMITE</div><div class="tb"><h3>' + T[0] + '</h3><p>' + T[1] + '</p></div>'
    + '<div class="limbig">' + SZ.limRing(84) + '<div><b>' + esc(SZ.limShort()) + '</b><span>tu EnerX de hoy · se carga a medianoche</span></div></div>'
    + SZ.limBar({ title:'IAs conectadas', puter:!puterOn() })
    + '<div id="sxBal"><div class="bl-load">Revisando tu cuenta de Puter…</div></div>'
    + '<div class="sxlbl">RESPUESTAS CORTAS</div><div class="sxsave"><p>La IA responde más corto y usa menos de tu historial. Así te alcanza para más.</p><button class="sxsw" id="sxSw" type="button" aria-pressed="' + st().sx.saver + '" aria-label="Respuestas cortas"></button></div>'
    + '<div class="tbtn" style="margin-top:18px"><button class="lnk" id="sxClose" type="button">Cerrar</button>'
    + (kind === 'pu' && szOn() ? '<button class="btn sm" id="sxGo" type="button">Seguir gratis</button>' : kind === 'or' ? '<button class="btn sm" id="sxGo" type="button">' + (puterOn() ? 'Seguir con mi Puter' : 'Conectar Puter') + '</button>' : '') + '</div></div>';
  document.body.appendChild(sxEl); $('#sxWord').innerHTML = zWord('Synth');
  const bal = $('#sxBal', sxEl);
  if (bal) SZ.providerBalance(true).then(b => { if (bal.isConnected) bal.innerHTML = SZ.balanceHtml(b); });
  requestAnimationFrame(() => sxEl.classList.add('on'));
  $('.tcard', sxEl).animate([{ transform:'scale(.9) translateY(24px)', opacity:0, filter:'blur(10px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { if (!sxEl) return; const el = sxEl; sxEl = null; el.classList.remove('on'); setTimeout(() => el.remove(), 470); };
  $('#sxClose').addEventListener('click', close);
  sxEl.addEventListener('pointerdown', e => { if (e.target === sxEl) close(); });
  const go = $('#sxGo');
  if (go) go.addEventListener('click', () => { close(); if (kind === 'or' && !puterOn()) openConnect(); else switchProv(kind === 'pu' ? 'sz' : 'pu'); });
  const sw = $('#sxSw');
  if (sw) sw.addEventListener('click', () => setSaver(!st().sx.saver));
}
function setSaver(on){
  st().sx.saver = on; save();
  $$('#sxSw, #saverBtn').forEach(x => x.setAttribute('aria-pressed', String(on)));
  updateHint(); toast(on ? 'Modo ahorro activado.' : 'Modo ahorro desactivado.');
  try{ dispatchEvent(new Event('synthz-saver')); }catch(e){}   /* v3.2 · la bolita 🍃 junto al «+» aparece al instante */
}
$('#saverBtn').setAttribute('aria-pressed', String(st().sx.saver));
$('#saverBtn').addEventListener('click', () => setSaver(!st().sx.saver));
$('#sideFoot').addEventListener('click', e => { if (e.target.closest('#sxBtn')) coinModal('panel'); });

/* ---------- equipos: comparte tu OpenRouter sin que nadie vea tu llave ---------- */
let TEAMS = { teams:[], invites:[], at:0 };
async function loadTeams(){ if (!SZ.ACC.ready) return TEAMS; try{ const d = await SZ.api('teams'); TEAMS = { teams:d.teams || [], invites:d.invites || [], at:Date.now() }; }catch(e){} if (st().useTeam && !TEAMS.teams.some(x => x.id === st().useTeam && x.hasKey)){ delete st().useTeam; save(); } paintProv(); return TEAMS; }
const LIMITS = [[0, 'Sin límite'], [10000, '10 mil'], [20000, '20 mil'], [50000, '50 mil'], [100000, '100 mil']];
function teamsHtml(){
  const T = TEAMS, me = SZ.ACC.user || {};
  let h = '<div class="sxlbl">EQUIPOS</div>' + (SZ.accHandle() ? '<p class="cnote tmme">Para que te inviten, comparte tu usuario: <b>' + esc(SZ.accHandle()) + '</b></p>' : '');
  h += T.invites.map(i => '<div class="tminv">' + SZ.avatarHtml(i.from, i.from) + '<p><b>' + esc(i.from.name) + '</b>' + (i.from.handle ? ' <small>' + esc(i.from.handle) + '</small>' : '') + ' te invitó a <b>«' + esc(i.name) + '»</b>' + (i.hasKey ? ' · comparte OpenRouter' : '') + '</p><button class="btn sm" type="button" data-ta="accept" data-id="' + esc(i.id) + '">Aceptar</button><button class="lnk" type="button" data-ta="decline" data-id="' + esc(i.id) + '">No</button></div>').join('');
  T.teams.forEach(x => {
    const lim = x.daily ? Math.min(1, x.myUse / x.daily) : 0;
    h += '<div class="tmc"><h4>' + esc(x.name) + '<small>' + (x.owner ? 'tuyo' : 'de ' + esc(x.ownerInfo.name)) + '</small></h4>';
    if (x.owner){
      h += x.hasKey ? '<div class="tmkey">🔒 <span>Compartes tu OpenRouter (' + esc(x.keyLabel) + '). Tu equipo lo usa sin ver la llave.</span><button class="lnk" type="button" data-ta="nokey" data-id="' + esc(x.id) + '">Dejar de compartir</button></div>'
        : '<div class="cfgrow"><p>Compartir mi OpenRouter<small>Pega una llave: se guarda cifrada en Sonyx y tu equipo nunca la ve. Mejor una llave solo para el equipo, con límite de crédito.</small></p></div><div class="tinv"><input type="text" data-sec="1" data-tk="' + esc(x.id) + '" placeholder="sk-or-…" autocomplete="off" data-lpignore="true" data-1p-ignore data-form-type="other" spellcheck="false"><button class="btn sm" type="button" data-ta="key" data-id="' + esc(x.id) + '">Compartir</button></div>';
      h += '<div class="sxlbl">MIEMBROS</div>' + (x.members.length ? x.members.map(m => '<div class="tmrow">' + SZ.avatarHtml(m, m) + '<div class="tx"><b>' + esc(m.name) + '</b><small>' + esc(m.handle || m.email || '') + ' · hoy ' + fmt(m.used) + (x.daily ? ' / ' + fmt(x.daily) : '') + '</small></div>' + (x.daily ? '<span class="tmbar"><i style="transform:scaleX(' + Math.min(1, m.used / x.daily).toFixed(3) + ')"></i></span>' : '') + '<button class="x" type="button" data-ta="remove" data-id="' + esc(x.id) + '" data-sub="' + esc(m.sub) + '" data-nm="' + esc(m.name) + '" aria-label="Quitar a ' + esc(m.name) + '">✕</button></div>').join('') : '<p class="cnote" style="margin:4px 0">Aún sin miembros.</p>')
        + x.invites.map(i => '<div class="tmrow"><span class="av-me" style="background:rgba(255,255,255,.1);color:var(--soft)">' + (/^@/.test(i.to || '') ? '@' : '✉') + '</span><div class="tx"><b>' + esc(i.to || i.email) + '</b><small>invitación pendiente</small></div><button class="x" type="button" data-ta="uninvite" data-id="' + esc(x.id) + '" data-to="' + esc(i.to || i.email) + '" aria-label="Cancelar invitación">✕</button></div>').join('')
        + '<div class="tinv"><input data-te="' + esc(x.id) + '" type="text" placeholder="@usuario de tu amigo" autocomplete="off" autocapitalize="none" spellcheck="false"><button class="btn sm" type="button" data-ta="invite" data-id="' + esc(x.id) + '">Invitar</button></div>'
        + '<div class="cfgrow"><p>Solo modelos gratis<small>Así nadie gasta crédito de tu llave.</small></p><button class="cfgsw" type="button" data-ta="free" data-id="' + esc(x.id) + '" aria-pressed="' + x.freeOnly + '" aria-label="Solo modelos gratis"></button></div>'
        + '<div class="sxlbl">LÍMITE DIARIO POR PERSONA</div><div class="tmseg">' + LIMITS.map(([v, l]) => '<button type="button" data-ta="daily" data-id="' + esc(x.id) + '" data-v="' + v + '" aria-pressed="' + (x.daily === v) + '">' + l + '</button>').join('') + '</div>'
        + '<div class="tbtn" style="margin-top:8px"><span></span><button class="lnk" type="button" data-ta="delete" data-id="' + esc(x.id) + '" data-nm="' + esc(x.name) + '">Borrar equipo</button></div>';
    } else {
      h += '<div class="tmrow">' + SZ.avatarHtml(x.ownerInfo, x.ownerInfo) + '<div class="tx"><b>' + esc(x.ownerInfo.name) + '</b><small>dueño · ' + x.members.length + ' miembros</small></div></div>';
      h += x.hasKey ? '<div class="cfgrow"><p>Usar el OpenRouter de este equipo<small>Hoy llevas ' + fmt(x.myUse) + (x.daily ? ' de ' + fmt(x.daily) + ' de ' + SZ.t('enerx.name') : ' de ' + SZ.t('enerx.name')) + (x.freeOnly ? ' · solo modelos gratis' : '') + '. El dueño ve cuánto usas, no lo que escribes.</small></p><button class="cfgsw" type="button" data-ta="use" data-id="' + esc(x.id) + '" aria-pressed="' + (st().useTeam === x.id) + '" aria-label="Usar su OpenRouter"></button></div>' + (x.daily ? '<span class="tmbar" style="width:100%;margin-top:6px"><i style="transform:scaleX(' + lim.toFixed(3) + ')"></i></span>' : '')
        : '<p class="cnote">El dueño todavía no comparte su OpenRouter.</p>';
      h += '<div class="tbtn" style="margin-top:8px"><span></span><button class="lnk" type="button" data-ta="leave" data-id="' + esc(x.id) + '" data-nm="' + esc(x.name) + '">Salir del equipo</button></div>';
    }
    h += '</div>';
  });
  h += '<div class="tinv" style="margin-top:12px"><input id="tNewName" maxlength="40" placeholder="Nombre de un equipo nuevo"><button class="btn sm ghost" type="button" data-ta="create">Crear equipo</button></div>';
  return h;
}
function teamsBind(box, reopen){
  box.addEventListener('click', async e => {
    const b = e.target.closest('[data-ta]'); if (!b) return;
    const a = b.dataset.ta, id = b.dataset.id, run = async (body, ok) => { const l = b.textContent; b.disabled = true; if (b.tagName === 'BUTTON' && !b.classList.contains('cfgsw') && !b.classList.contains('x')) b.textContent = '…'; try{ await SZ.api('teams', { method:'POST', body }); if (ok) toast(ok); await loadTeams(); reopen(); }catch(er){ b.disabled = false; b.textContent = l; toast(er.message); } };
    if (a === 'use'){ const on = st().useTeam === id; if (on) delete st().useTeam; else st().useTeam = id; save(); b.setAttribute('aria-pressed', String(!on)); paintProv(); fixModel(true); renderList({ keep:true }); updateHint(); toast(on ? 'Ya no usas el OpenRouter del equipo.' : 'Listo: usas el OpenRouter del equipo.'); return; }
    if (a === 'create'){ const n = $('#tNewName', box).value.trim(); if (!n){ toast('Ponle un nombre a tu equipo.'); return; } return run({ action:'create', name:n }, 'Equipo creado. Ahora invita a tus amigos.'); }
    if (a === 'invite'){ const v = $('[data-te="' + id + '"]', box).value.trim(); if (!v){ toast('Escribe el @usuario de tu amigo.'); return; } return run({ action:'invite', id, to:v }, 'Invitación enviada. Le aparecerá cuando entre a su cuenta de Sinapse.'); }
    if (a === 'key'){ const v = $('[data-tk="' + id + '"]', box).value.trim(); if (!v){ toast('Pega la llave de OpenRouter.'); return; } return run({ action:'key', id, key:v }, 'Tu equipo ya puede usar tu OpenRouter (sin ver la llave).'); }
    if (a === 'nokey') return run({ action:'key', id, key:'' }, 'Dejaste de compartir tu OpenRouter.');
    if (a === 'free') return run({ action:'settings', id, freeOnly:b.getAttribute('aria-pressed') !== 'true' }, 'Guardado.');
    if (a === 'daily') return run({ action:'settings', id, daily:+b.dataset.v }, 'Límite actualizado.');
    if (a === 'accept') return run({ action:'accept', id }, '¡Te uniste al equipo!');
    if (a === 'decline') return run({ action:'decline', id }, 'Invitación rechazada.');
    if (a === 'uninvite') return run({ action:'uninvite', id, to:b.dataset.to }, 'Invitación cancelada.');
    if (a === 'remove'){ if (await SZ.szConfirm('¿Quitar a ' + b.dataset.nm + '?', 'Dejará de poder usar el OpenRouter del equipo al instante.', 'Quitar', true)) run({ action:'remove', id, sub:b.dataset.sub }, 'Quitado del equipo.'); return; }
    if (a === 'leave'){ if (await SZ.szConfirm('¿Salir de «' + b.dataset.nm + '»?', 'Dejarás de poder usar su OpenRouter.', 'Salir', true)){ if (st().useTeam === id){ delete st().useTeam; save(); } run({ action:'leave', id }, 'Saliste del equipo.'); } return; }
    if (a === 'delete'){ if (await SZ.szConfirm('¿Borrar «' + b.dataset.nm + '»?', 'Todos pierden el acceso y la llave compartida se borra del servidor.', 'Borrar equipo', true)) run({ action:'delete', id }, 'Equipo borrado.'); return; }
  });
}

/* ---------- varias conversaciones por modelo ---------- */
const curT = () => ((st().thread || {})[thModel()] || '');
function parseKey(k){ const r = k.slice('openrouter::'.length), i = r.lastIndexOf('::'); return i > 0 && /^t[0-9a-z]+$/.test(r.slice(i + 2)) ? { model:r.slice(0, i), id:r.slice(i + 2) } : { model:r, id:'' }; }
function thMeta(model, id, create){
  st().threads = st().threads || {};
  const L = st().threads[model] || (create ? (st().threads[model] = []) : null); if (!L) return null;
  let e = L.find(x => x.id === id); if (!e && create){ e = { id, title:'', t:0 }; L.push(e); } return e;
}
function touchThread(){
  const e = thMeta(thModel(), curT(), true); e.t = Date.now();
  /* v4.0 · el primer título sale del primer mensaje con tema (no de «Hola, ¿cómo estás?»); luego la IA lo pone con sentido (05g) */
  if (!e.title || e.auto0){ const t = titleLocal(chatArr()); if (t !== e.title){ e.title = t; e.auto0 = true; } }
  renderThBtn();
}
function allThreads(){
  return Object.keys(st().chats).filter(k => /^openrouter::./.test(k) && Array.isArray(st().chats[k]) && st().chats[k].length).map(k => {
    const { model, id } = parseKey(k), e = thMeta(model, id, false) || {}, u = st().chats[k].find(x => x.role === 'user');
    return { k, model, id, title:e.title || (u ? titleLocal(st().chats[k]) : 'Conversación'), t:e.t || 0, n:st().chats[k].length, imp:e.imp };
  }).sort((a, b) => b.t - a.t);
}
/* ---------- tus chats y tus favoritos (panel de la izquierda) ---------- */
const PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';
const BIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>';
let chT = 0;
function renderThBtn(){ clearTimeout(chT); chT = setTimeout(() => renderChats(false), 120); }
function snipOf(text, q){ const t = text.replace(/\s+/g, ' '), i = t.toLowerCase().indexOf(q); if (i < 0) return ''; const a = Math.max(0, i - 28); return (a ? '…' : '') + t.slice(a, i + q.length + 46) + '…'; }
const plain = t => t.replace(/```[\s\S]*?```/g, ' [código] ').replace(/[*_#>`~]+/g, '').replace(/^\s*[-+]\s+/gm, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();
function allFavs(){
  const out = [];
  Object.keys(st().chats).forEach(k => { const arr = st().chats[k]; if (!Array.isArray(arr) || !/^openrouter::./.test(k)) return; arr.forEach((m, i) => { if (m.star && m.role === 'assistant') out.push({ k, i, model:m.model || parseKey(k).model, text:plain(m.content) }); }); });
  return out.reverse();
}
function renderChats(anim){
  const box = $('#thList'); if (!box) return;
  const q = $('#thQ').value.trim().toLowerCase();
  box.classList.toggle('still', !anim);
  $('#thQ').placeholder = cView === 'favs' ? 'Buscar en tus favoritos…' : 'Buscar en tus chats';
  $('#cFavH').hidden = cView !== 'favs'; $('#cNew').hidden = cView === 'favs';
  if (cView === 'favs'){
    const L = allFavs().filter(x => !q || (x.text + ' ' + info(x.model).name).toLowerCase().includes(q));
    box.innerHTML = L.length ? L.map((x, i) => '<div class="fvi" data-k="' + esc(x.k) + '" data-i="' + x.i + '" style="--i:' + Math.min(i, 20) + '"><b>' + esc(info(x.model).name) + '</b><p>' + esc(q ? snipOf(x.text, q) || x.text.slice(0, 220) : x.text.slice(0, 220)) + '</p></div>').join('')
      : '<div class="thnone">' + (q ? 'Ningún favorito coincide.' : 'Aún no tienes favoritos.') + '<em>Toca «Guardar» ★ debajo de una respuesta y vuela hasta aquí.</em></div>';
    return;
  }
  const now = new Date(), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const grp = t => !t ? 'Antes' : t >= d0 ? 'Hoy' : t >= d0 - 864e5 ? 'Ayer' : t >= d0 - 6 * 864e5 ? 'Esta semana' : 'Antes';
  const AG = st().agentT || {};
  const isAg = x => !!AG[x.k] || x.model === AGK;
  const L = allThreads().map(x => { if (!q) return x; const hitT = (x.title + ' ' + info(x.model).name).toLowerCase().includes(q); let sn = ''; if (!hitT){ const m = (st().chats[x.k] || []).find(mm => (mm.content || '').toLowerCase().includes(q)); if (!m) return null; sn = snipOf(m.content, q); } return Object.assign({}, x, { sn }); }).filter(Boolean);
  if (!L.length){ box.innerHTML = '<div class="thnone">' + (q ? 'Nada coincide en tus chats.' : 'Aún no tienes chats.') + '<em>' + (q ? 'Busco en los títulos y dentro de cada mensaje.' : 'Escribe tu primer mensaje y aparecerá aquí.') + '</em></div>'; return; }
  let h = '', g0 = '', n = 0;
  const hlq = t => q ? hl(t, q) : esc(t);
  L.forEach(x => {
    const g = grp(x.t); if (g !== g0){ h += '<div class="thg">' + g + '</div>'; g0 = g; }
    const cur = mode === 'solo' && x.model === thModel() && x.id === curT(), m = info(x.model);
    h += '<div class="thi' + (cur ? ' cur' : '') + '" data-k="' + esc(x.k) + '" title="' + esc(m.name + ' · ' + x.n + ' mensajes') + '" style="--i:' + Math.min(n++, 20) + ';--vc:' + vendorColor(m.vendor) + '"><i class="thd" aria-hidden="true"></i><div class="tt"><b>' + hlq(x.title) + '</b>' + (x.imp ? '<em class="thimp">' + esc({ chatgpt:'ChatGPT', claude:'Claude' }[x.imp] || (SZ.lang() === 'en' ? 'Imported' : 'Importado')) + '</em>' : '') + (x.sn ? '<span class="snip">' + hlq(x.sn) + '</span>' : '') + '</div>'
      + '<button type="button" data-ren aria-label="Renombrar">' + PEN + '</button><button type="button" data-del aria-label="Borrar">' + BIN + '</button></div>';
  });
  box.innerHTML = h;
}
$('#thQ').addEventListener('input', () => renderChats(false));
$('#cNew').addEventListener('click', () => newChat());
$('#cFavBack').addEventListener('click', () => { cView = 'chats'; RS.view = 'chats'; saveRS(); applyRail(); renderChats(true); });
function openThread(model, id, ci){
  if (mode !== 'solo'){ stopNow(); cmpRun++; cmpLast = null; mode = 'solo'; }
  (st().thread || (st().thread = {}))[model] = id;
  if (model === AGK){ st().agent = true; paintAgent(); gen++; save(); setMode('solo'); }
  else {
    if (st().agent){ st().agent = false; paintAgent(); }
    st().pinned = model;
    if (model !== selId()) pickModel(model, null); else { gen++; save(); setMode('solo'); }
  }
  if (isMobile()) closeChatsSheet(); else if (isTablet()){ RS.chats = false; saveRS(); applyRail(); }
  renderChats(false);
  if (ci != null) setTimeout(() => { const el = lane.querySelector('.m.bot[data-ci="' + ci + '"]'); if (el){ el.scrollIntoView({ behavior:SZ.reduce ? 'auto' : 'smooth', block:'center' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } }, 260);
}
$('#thList').addEventListener('click', async e => {
  const fv = e.target.closest('.fvi');
  if (fv){ const { model, id } = parseKey(fv.dataset.k); openThread(model, id, +fv.dataset.i); return; }
  const it = e.target.closest('.thi'); if (!it) return;
  const k = it.dataset.k, { model, id } = parseKey(k);
  if (e.target.closest('[data-del]')){
    if (!(await SZ.szConfirm('¿Borrar esta conversación?', 'Se borra de este dispositivo y de tu cuenta. No se puede deshacer.', 'Borrar', true))) return;
    delete st().chats[k]; st().del = [...(st().del || []), k].slice(-300);
    const L = (st().threads || {})[model]; if (L) st().threads[model] = L.filter(x => x.id !== id);
    save(); if (mode === 'solo' && model === thModel() && id === curT()){ gen++; renderMsgs(); updateHint(); }
    it.animate([{ opacity:1, transform:'none' }, { opacity:0, transform:'translateX(-14px)', filter:'blur(6px)' }], { duration:300, easing:'ease-in' }).onfinish = () => renderChats(false);
    toast('Conversación borrada.'); return;
  }
  if (e.target.closest('[data-ren]')){
    const b = $('.tt b', it), inp2 = document.createElement('input'); inp2.value = b.textContent; inp2.maxLength = 60; b.replaceWith(inp2); inp2.focus(); inp2.select();
    let canceled = false;
    const ok = () => { if (canceled) return; canceled = true; const v = inp2.value.trim(); if (v){ const m = thMeta(model, id, true); m.title = v; m.manual = true; delete m.auto0; if (!m.t) m.t = Date.now(); save(); } renderChats(false); };
    inp2.addEventListener('keydown', ev => { if (ev.key === 'Enter'){ ev.preventDefault(); ok(); } if (ev.key === 'Escape'){ ev.preventDefault(); ev.stopPropagation(); canceled = true; renderChats(false); } });
    inp2.addEventListener('blur', ok); return;
  }
  if (e.target.closest('input')) return;
  openThread(model, id);
});
/* compatibilidad: lo que antes abría la ventanita de conversaciones */
function thOpen(){ showChats('chats', true); }

/* ---------- v2.6 · Proyectos: chats, instrucciones y archivos juntos en un solo lugar ----------
   · Cada espacio tiene nombre, descripción, instrucciones y archivos (su «conocimiento»).
   · Los chats que empiezas dentro de un espacio quedan guardados en él, y la IA recibe sus
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
  let s = 'Esta conversación es parte del espacio «' + p.name + '»' + (p.desc ? ' (' + p.desc + ')' : '') + '.';
  if (p.instr) s += '\nInstrucciones del espacio (síguelas siempre):\n' + p.instr;
  if ((p.files || []).some(f => f.text)){
    const last = [...chat].reverse().find(m => m.role === 'user');
    s += '\nConocimiento del espacio: archivos que la persona subió. Úsalos como fuente principal y di de qué archivo sacas cada dato.\n' + pjPick(p.files, last ? (last.ask || last.content) : '', saver ? PJ_SEND_SAVER : PJ_SEND);
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
  PC.setAttribute('aria-label', 'Espacio ' + p.name + ': abrir el espacio'); PC.title = 'Abrir el espacio';
}

/* ---------- entradas: barra de íconos, panel de chats (y la hoja del celular) ---------- */
{
  const rb = document.createElement('button'); rb.type = 'button'; rb.className = 'rbtn'; rb.id = 'railProj'; rb.dataset.tip = 'Espacios'; rb.style.setProperty('--i', '2');
  rb.innerHTML = PJ_ICO + '<span class="rl">Espacios</span>'; rb.setAttribute('aria-label', 'Espacios');
  $('#rail [data-r="new"]').after(rb);
  rb.addEventListener('click', () => PV.hidden || pjView.v !== 'list' ? pjOpen('list') : pjClose());
  const cb = document.createElement('button'); cb.type = 'button'; cb.className = 'cnew cproj'; cb.id = 'cProj';
  cb.innerHTML = PJ_ICO + 'Espacios';
  $('#cNew').after(cb);
  cb.addEventListener('click', () => pjOpen('list'));
}

/* ---------- la página de proyectos (cubre la conversación; «Volver al chat» la cierra) ---------- */
const PV = document.createElement('section'); PV.className = 'pjv'; PV.id = 'pjv'; PV.hidden = true; PV.setAttribute('aria-label', 'Espacios'); PV.tabIndex = -1;
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
const pjBar = (back) => '<div class="pj-bar">' + (back ? '<button type="button" class="pj-back" data-pa="list"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>Todos los espacios</button>' : '<span></span>')
  + '<button type="button" class="pj-close" data-pa="close">Volver al chat' + PJ_X + '</button></div>';

function pjListHtml(){
  return pjBar(false) + '<header class="pj-lh"><div><h1>Espacios</h1><p>Junta chats, instrucciones y archivos de un mismo tema. La IA los tiene en cuenta en cada chat del espacio.</p></div>'
    + '<button type="button" class="btn pj-newb" data-pa="new">' + PJ_PLUS + 'Nuevo espacio</button></header>'
    + '<div class="pj-tools"><label class="pj-q"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" id="pjQ" placeholder="Buscar espacios" autocomplete="off" aria-label="Buscar espacios"></label>'
    + '<label class="pj-sort"><span>Ordenar</span><select id="pjSort" aria-label="Ordenar espacios"><option value="t">Actividad reciente</option><option value="n">Nombre</option><option value="c">Más nuevos</option></select></label>'
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
    box.innerHTML = qq || pjArch ? '<div class="pj-none"><b>' + (qq ? 'Ningún espacio coincide.' : 'No tienes espacios archivados.') + '</b></div>'
      : '<div class="pj-empty"><span class="pj-big">' + PJ_ICO + '</span><b>Tu primer espacio</b><p>Por ejemplo, tu tesis o tu negocio: le das instrucciones y archivos una sola vez y cada chat del espacio ya los conoce.</p>'
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
  return pjBar(true) + '<form class="pj-form" id="pjForm" novalidate><h1>' + (p ? 'Editar el espacio' : 'Nuevo espacio') + '</h1>'
    + '<label class="pj-f"><span>¿En qué estás trabajando?</span><input id="pjName" maxlength="60" required placeholder="Ponle un nombre al espacio" autocomplete="off" data-autofocus value="' + esc(p ? p.name : '') + '"></label>'
    + '<label class="pj-f"><span>¿Qué quieres lograr? <small>(opcional)</small></span><textarea id="pjDesc" maxlength="300" rows="3" placeholder="Cuéntale a la IA de qué se trata: tu objetivo, para quién es, el tono que prefieres…">' + esc(p ? p.desc || '' : '') + '</textarea></label>'
    + (p ? '' : '<div class="pj-exs sm"><span>Ideas:</span>' + PJ_EX.map((x, i) => '<button type="button" class="pj-ex" data-ex="' + i + '">' + esc(x[0]) + '</button>').join('') + '</div>')
    + '<div class="pj-acts"><button type="button" class="lnk" data-pa="' + (p ? 'page' : 'list') + '">Cancelar</button><button type="submit" class="btn">' + (p ? 'Guardar' : 'Crear espacio') + '</button></div></form>';
}

function pjPageHtml(p){
  const L = pjChats(p.id), size = pjSize(p), pct = Math.min(100, Math.round(size / PJ_MAX * 100));
  return pjBar(true) + '<header class="pj-h" style="--pc:' + pjColor(p) + '"><span class="pj-ic">' + PJ_ICO + '</span><div class="pj-ht"><h1>' + esc(p.name) + '</h1>' + (p.desc ? '<p>' + esc(p.desc) + '</p>' : '') + (p.arch ? '<em class="pj-tag">Archivado</em>' : '') + '</div>'
    + '<button type="button" class="pjc-star" data-star="' + esc(p.id) + '" aria-pressed="' + !!p.star + '" aria-label="' + (p.star ? 'Quitar de destacados' : 'Destacar') + '">' + PJ_STAR + '</button>'
    + '<button type="button" class="pj-more" data-pa="menu" aria-haspopup="menu" aria-expanded="false" aria-label="Más opciones del espacio">' + PJ_DOTS + '</button></header>'
    + '<div class="pj-grid"><div class="pj-main">'
    + '<form class="pj-ask" id="pjAsk"><label class="sr" for="pjAskIn">Empieza un chat en este espacio</label><textarea id="pjAskIn" rows="2" maxlength="20000" placeholder="¿Qué quieres hacer en este espacio?" data-autofocus></textarea><button type="submit" class="send" aria-label="Empezar el chat">' + PJ_SEND_ICO + '</button></form>'
    + '<h2 class="pj-sh">Chats del espacio</h2>'
    + (L.length ? '<div class="pj-chats">' + L.map(x => '<button type="button" class="pj-chat" data-k="' + esc(x.k) + '"><b>' + esc(x.title) + '</b><small>' + esc(info(x.model).name || 'Automático') + ' · ' + pjAgo(x.t) + '</small></button>').join('') + '</div>'
      : '<p class="pj-none sm">Los chats que empieces aquí se guardan en este espacio. También puedes mover un chat desde tu lista con el ícono de carpeta.</p>')
    + '</div><aside class="pj-side" aria-label="Conocimiento del espacio"><div class="pj-kh"><h2>Conocimiento del espacio</h2><small>Lo que la IA sabe en cada chat de «' + esc(p.name) + '»</small></div>'
    + '<section class="pj-card" id="pjInstr"><div class="pj-ch"><h3>Instrucciones</h3><button type="button" class="lnk" data-pa="instr">' + (p.instr ? 'Editar' : 'Agregar') + '</button></div>'
    + (p.instr ? '<p class="pj-it"></p>' : '<p class="pj-muted">Dile a la IA cómo responder en este espacio: el tono, el formato, lo que debe saber de ti.</p>') + '</section>'
    + '<section class="pj-card" id="pjFiles"><div class="pj-ch"><h3>Archivos</h3><span class="pj-fb"><button type="button" class="lnk" data-pa="paste">Pegar texto</button><button type="button" class="btn sm ghost" data-pa="upload">' + PJ_PLUS + 'Subir</button></span></div>'
    + '<div class="pj-cap" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="Capacidad usada"><i style="width:' + Math.max(pct, size ? 2 : 0) + '%"></i></div><small class="pj-muted">' + (size ? 'Usas ' + (pct < 1 ? 'menos del 1 %' : 'el ' + pct + ' %') + ' del espacio · ' + pjNum(size) + ' de ' + pjNum(PJ_MAX) + ' caracteres. En cada mensaje la IA lee lo que más se relaciona con tu pregunta (hasta unas 1.300 palabras, que cuentan en tu límite).' : 'PDF, Word en texto, código, notas… La IA los usa como fuente en cada chat del espacio.') + '</small>'
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
    if (!n){ $('#pjName', PV).focus(); toast('Ponle un nombre al espacio.'); return; }
    if (pjView.v === 'edit'){ const p = pjGet(pjView.id); p.name = n; p.desc = d; pjEdit(p); toast('Espacio guardado.'); pjOpen('page', p.id); return; }
    const p = { id:'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name:n, desc:d, instr:'', files:[], c0:Date.now(), t:Date.now(), u:Date.now(), c:pjs().length };
    pjs().push(p); save(); toast('Espacio creado. Agrega instrucciones o archivos, o empieza un chat.'); pjOpen('page', p.id); return;
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
  if (t.dataset.fdel){ const f = p.files.find(x => x.id === t.dataset.fdel); if (!f || !(await SZ.szConfirm('¿Quitar «' + f.name + '»?', 'La IA ya no lo usará en los chats de este espacio.', 'Quitar', true))) return; p.files = p.files.filter(x => x !== f); pjEdit(p); pjRender(); return; }
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
  const room = pjRoom(p); if (room <= 0){ toast('Este espacio ya está lleno. Quita un archivo para hacer espacio.'); return false; }
  const cut = text.length > room;
  (p.files || (p.files = [])).push({ id:'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name:String(name).slice(0, 120), text:cut ? text.slice(0, room) : text });
  pjEdit(p); if (cut) toast('«' + name + '» era muy largo: guardé lo que cabe en el espacio.');
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
    { label:p.arch ? 'Sacar de archivados' : 'Archivar', go:() => { p.arch = !p.arch; pjEdit(p); toast(p.arch ? 'Espacio archivado. Lo encuentras en «Archivados».' : 'El espacio volvió a tu lista.'); pjRender(); } },
    null,
    { label:'Borrar el espacio', danger:true, go:async () => {
      if (!(await SZ.szConfirm('¿Borrar «' + p.name + '»?', 'Se borran sus instrucciones y archivos. Sus chats no se borran: quedan en tu lista de chats.', 'Borrar espacio', true))) return;
      st().projects = pjs().filter(x => x !== p); st().pjDel = [...(st().pjDel || []), p.id].slice(-200);
      Object.keys(pjOf()).forEach(k => { if (pjOf()[k] === p.id) delete pjOf()[k]; });
      if (st().curProj === p.id) st().curProj = '';
      save(); toast('Espacio borrado.'); pjOpen('list'); renderChats(false); pjCrumb();
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
    const b = document.createElement('button'); b.type = 'button'; b.className = 'thpj-m'; b.setAttribute('aria-label', 'Mover a un espacio'); b.setAttribute('aria-haspopup', 'menu'); b.innerHTML = PJ_ICO;
    const ren = $('[data-ren]', it); if (ren) ren.before(b); else it.appendChild(b);
  });
};
$('#thList').addEventListener('click', e => {
  const b = e.target.closest('.thpj-m'); if (!b) return;
  e.stopPropagation(); e.preventDefault();
  const k = b.closest('.thi').dataset.k, cur = pjOf()[k];
  const items = pjs().filter(p => !p.arch).sort((a, c) => (c.t || 0) - (a.t || 0)).slice(0, 8).map(p => ({ label:p.name, on:p.id === cur, ic:'<i class="pjdot" style="--pc:' + pjColor(p) + '"></i>', go:() => { pjOf()[k] = p.id; p.t = Date.now(); save(); renderChats(false); pjCrumb(); toast('Chat movido a «' + p.name + '».'); } }));
  if (cur) items.push(null, { label:'Sacar del espacio', go:() => { delete pjOf()[k]; save(); renderChats(false); pjCrumb(); toast('El chat ya no está en un espacio.'); } });
  items.push(null, { label:'Nuevo espacio…', ic:PJ_PLUS, go:() => pjOpen('new') });
  pjMenuAt(b, items);
}, true);
pjCrumb();
if (params.get('espacios') != null) pjOpen('list');
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
/* ---------- menú «⋯» de la conversación (v2.2: corto, por grupos y con íconos) ---------- */
function mmClose(){ SZ.menuClose(); }
function mmOpen(){
  const mb = $('#moreBtn');
  if (mb.getAttribute('aria-expanded') === 'true' && document.querySelector('.ctxm.mm')){ SZ.menuClose(); mb.setAttribute('aria-expanded', 'false'); return; }
  const L = [{ label:'Nuevo chat', ico:'new', fn:() => newChat() }];
  if (mode === 'solo') L.push({ label:'Copiar la conversación', ico:'copy', fn:() => { copyText(chatMd()); toast('Conversación copiada.'); } }, { label:'Descargar como texto', ico:'down', fn:exportMd });
  else L.push({ label:'Empezar otra comparación', ico:'cmp', fn:() => clearChat() }, { label:'Volver a una sola IA', ico:'exit', fn:() => removeCmp(st().cmp[st().cmp.length - 1]) });
  L.push('—', { label:'Lo que recuerdo de ti', ico:'brain', fn:() => SZ.cfgModal('mem') }, ...(SZ.importOpen ? [{ label:'Importar chats y memoria', ico:'up', fn:() => SZ.importOpen() }] : []), { label:'Ajustes', ico:'cog', fn:() => SZ.cfgModal() }, { label:'Planes', ico:'trophy', fn:() => SZ.plansModal() }, ...(SZ.aliasOk() ? [{ label:'Quoryn · equipo', ico:'ai', fn:() => setAlias(true) }] : []), { label:SZ.lang() === 'en' ? 'Español' : 'English', ico:'globe', fn:() => SZ.setLang(SZ.lang() === 'en' ? 'es' : 'en') }, { label:'Ayuda: algo no carga', ico:'help', fn:helpLoad });
  if (trialOn) L.push({ label:'Salir de la prueba guiada', ico:'exit', fn:() => exitTrial() });
  if (mode === 'solo') L.push('—', { label:'Borrar este chat', ico:'trash', danger:true, fn:() => clearChat(true) });
  const r = mb.getBoundingClientRect(), m = SZ.menuOpen(L, 0, r.bottom + 8, 'mm');
  m.style.left = Math.max(10, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 10)) + 'px';
  mb.setAttribute('aria-expanded', 'true'); const f = $('button', m); if (f) f.focus();
}
/* v3.7 · «Ayuda: algo no carga» revisa primero qué pasa de verdad: antes mostraba siempre el aviso de la ventanita de Puter,
   aunque nada estuviera bloqueado (Sammuel lo vio al tocar el menú «⋯»). Ahora solo sale el aviso que corresponde. */
function helpLoad(){
  if (window.__puterBlocked || !window.puter) return showBlockHelp('script');
  if (window.__popupBlocked) return showBlockHelp('popup');
  toast('Todo está cargando bien. Si algo no funciona, pregúntale a Sona o abre la Ayuda.');
}
$('#moreBtn').dataset.menuOwner = '1'; $('#moreBtn').setAttribute('aria-expanded', 'false');
$('#moreBtn').addEventListener('click', mmOpen);
addEventListener('pointerdown', e => { if (!document.querySelector('.ctxm.mm')) $('#moreBtn').setAttribute('aria-expanded', 'false'); });

/* ---------- batalla ciega: votas sin saber qué IA es ---------- */
function arenaVote(winner, ids){
  /* cada voto cuenta como enfrentamientos de a dos; w + l + d = n siempre */
  const A = st().arena || (st().arena = {}), g = id => { const e = A[id] || (A[id] = { r:1000, w:0, l:0, d:0, n:0, t:0 }); e.d = e.d || 0; e.n = e.n || 0; return e; };
  const K = id => g(id).n < 10 ? 32 : 20, now = Date.now();
  if (winner === 'tie'){ for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++){ const a = g(ids[i]), b = g(ids[j]), ea = 1 / (1 + Math.pow(10, (b.r - a.r) / 400)); a.r += K(ids[i]) * (.5 - ea); b.r -= K(ids[j]) * (.5 - ea); a.d++; b.d++; a.n++; b.n++; } }
  else ids.filter(x => x !== winner).forEach(l => { const a = g(winner), b = g(l), ea = 1 / (1 + Math.pow(10, (b.r - a.r) / 400)); a.r += K(winner) * (1 - ea); b.r -= K(l) * (1 - ea); a.w++; b.l++; a.n++; b.n++; });
  ids.forEach(id => { g(id).t = now; });
  save();
}
function rankModal(){
  const A = st().arena || {}, all = Object.keys(A).map(id => Object.assign({ id }, A[id], { n:A[id].n || (A[id].w + A[id].l + (A[id].d || 0)) })).sort((a, b) => b.r - a.r);
  const firm = all.filter(x => x.n >= 3), few = all.filter(x => x.n < 3), votes = Math.round(all.reduce((s, x) => s + x.n, 0) / 2);
  const row = (x, i) => '<div><i>' + (i == null ? '·' : i + 1) + '</i><b>' + esc(info(x.id).name) + '</b><em>' + (i == null ? x.n + ' enfrent.' : Math.round(x.r) + ' · ' + x.w + 'G ' + x.l + 'P' + (x.d ? ' ' + x.d + 'E' : '')) + '</em></div>';
  const o = document.createElement('div'); o.className = 'szm';
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Tu ranking"><div class="word">' + zWord('Synth') + '</div><div class="tn">BATALLA CIEGA · ' + votes + ' enfrentamientos</div><div class="tb"><h3>Tu ranking</h3><p>Sale de tus votos en «Comparar» con los nombres escondidos: es tu gusto, no una verdad para todos. Una IA aparece aquí cuando ya votaste 3 veces por ella o contra ella.</p></div><div class="rank">'
    + (all.length ? (firm.length ? firm.map(row).join('') : '<p class="cnote">Todavía ninguna IA tiene 3 votos tuyos.</p>') + (few.length ? '<div class="sxlbl">CON POCOS VOTOS AÚN</div>' + few.map(x => row(x, null)).join('') : '') : '<p class="cnote">Aún no has votado. Activa la batalla ciega en Comparar.</p>')
    + '</div><div class="tbtn" style="margin-top:16px"><span></span><button class="lnk" type="button" data-close>Cerrar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 400); };
  $('[data-close]', o).addEventListener('click', close); o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
}
function battleVote(grid, done, C){
  const ids = done.map(d => d.mid);
  const v = document.createElement('div'); v.className = 'vote';
  v.innerHTML = '<span>¿Cuál respondió mejor?</span>' + done.map(d => '<button class="btn sm ghost" type="button" data-w="' + esc(d.mid) + '">' + esc($('.who b', d.card).textContent) + '</button>').join('') + '<button class="lnk" type="button" data-w="tie">Empate</button>';
  grid.appendChild(v); follow();
  v.addEventListener('click', e => {
    const b = e.target.closest('[data-w]'); if (!b) return;
    const w = b.dataset.w; arenaVote(w, ids);
    const f = done.reduce((a, b) => a.ttft <= b.ttft ? a : b);
    done.forEach(d => { const m = info(d.mid), who = $('.who', d.card); who.innerHTML = av(m, 'xs') + '<b>' + esc(m.name) + '</b><span class="stat">' + (d.mid === w ? 'ganó' : 'listo') + '</span>'; who.classList.add('reveal'); d.card.classList.toggle('win', d.mid === w); d.card.dataset.mid = d.mid; $('.meta', d.card).innerHTML = '<span>' + esc(d.card._meta || '') + '</span><span class="badge-fast">⚡ empezó primero</span>'; d.card.classList.toggle('fast', d === f); });
    if (C){ C.voted = true; C.vote = null; C.blind = false; done.forEach(d => { const a = $('.acts', d.card); if (a && !$('.flowb', a)) a.insertAdjacentHTML('beforeend', flowBtn(C)); }); }
    v.remove(); toast(w === 'tie' ? 'Empate guardado en tus favoritas.' : 'Ganó ' + info(w).name + '.');
  });
  return v;
}

/* ---------- Google Drive: más espacio y una copia de tus chats en TU Drive (opcional) ---------- */
const DRV_ICO = '<svg viewBox="0 0 48 48" width="54" height="54" aria-hidden="true"><path d="M14 36h21a8 8 0 0 0 1.4-15.9A11 11 0 0 0 15.3 18 9 9 0 0 0 14 36z" fill="rgba(143,211,232,.12)" stroke="#8fd3e8" stroke-width="2" stroke-linejoin="round"/><path d="M24 31V21M19.5 25.5 24 21l4.5 4.5" fill="none" stroke="#e6b65f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const agoTxt = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'hace un momento' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.round(m / 60) + ' h' : new Date(t).toLocaleDateString('es-CO', { day:'numeric', month:'short' }); };
async function driveGo(btn, quiet){
  const l = btn ? btn.textContent : ''; if (btn){ btn.disabled = true; btn.textContent = 'Conectando con Google…'; }
  try{
    const r = await SZ.DRIVE.sync(); if (r.busy) return false;
    if (!quiet) toast(r.got > 0 ? '¡Listo! Traje ' + r.got + (r.got === 1 ? ' chat' : ' chats') + ' de tu Drive y guardé la copia al día.' : '¡Listo! Tus chats quedaron guardados en tu Google Drive.');
    SZ.SND.done && SZ.SND.done(); burst(innerWidth / 2, innerHeight / 2, ['#8fd3e8', '#e6b65f', '#c9566c'], 16);
    return true;
  }catch(e){ toast(e.message || 'No pude conectar con Google Drive.'); return false; }
  finally{ if (btn && btn.isConnected){ btn.disabled = false; btn.textContent = l; } }
}
function driveModal(){
  if ($('#drv')) return;
  SZ.DRIVE.preload();
  const w = document.createElement('div'); w.id = 'drv'; w.className = 'szm';
  const paint = async () => {
    const cid = await SZ.DRIVE.cid(), m = SZ.DRIVE.meta();
    const body = !cid
      ? '<p class="cnote">Google Drive todavía no está activado en Sinapse. Cuando Prime o ZFlow lo activen, aquí podrás vincular tu Drive con un clic. Mientras tanto, tus chats siguen guardados en este dispositivo' + (SZ.ACC.ready ? ' y en tu cuenta.' : '.') + '</p>'
      : m && m.linked
        ? '<div class="drst"><i class="pdot2 ' + (SZ.DRIVE.live() ? 'ok' : 'wait') + '" aria-hidden="true"></i><div><b>Tu Drive está vinculado</b><span>' + (m.last ? 'Última copia ' + agoTxt(m.last) + ' · ' + fmt(m.n || 0) + (m.n === 1 ? ' chat · ' : ' chats · ') + ((m.size || 0) / 1048576).toFixed(2).replace('.', ',') + ' MB' : 'Aún sin copia') + '</span><small>' + (SZ.DRIVE.live() ? 'Mientras esta pestaña esté abierta, cada cambio se guarda solo.' : 'Toca «Guardar ahora» para guardar y traer tus chats.') + '</small></div></div>'
        : '<ul class="drl"><li><b>Más espacio:</b> tus chats viven también en tu Google Drive, no solo en este dispositivo.</li><li><b>Privado:</b> uso solo una carpeta oculta de Sonyx. No puedo ver ni tocar tus otros archivos.</li><li><b>Seguro:</b> nunca borro chats al traerlos (se mezclan) y tus llaves no van en la copia.</li></ul>';
    const cd = $('.tcard', w), h0 = cd.offsetHeight;
    $('.drb', w).innerHTML = body;
    $('.tbtn', w).innerHTML = '<button class="lnk" type="button" data-d="x">Cerrar</button>' + (!cid ? '' : m && m.linked ? '<button class="lnk" type="button" data-d="un">Desvincular</button><button class="btn sm flow" type="button" data-d="go">Guardar ahora</button>' : '<button class="btn sm flow" type="button" data-d="go">Vincular mi Google Drive</button>');
    const h1 = cd.offsetHeight; if (!SZ.reduce && h0 && Math.abs(h1 - h0) > 2){ cd.animate([{ height:h0 + 'px', overflow:'hidden' }, { height:h1 + 'px', overflow:'hidden' }], { duration:520, easing:'cubic-bezier(.22,1,.36,1)' }); $$('.drb > *, .drl li', w).forEach((n, k) => n.animate([{ opacity:0, transform:'translateY(8px)' }, { opacity:1, transform:'none' }], { duration:460, delay:80 + k * 60, easing:'cubic-bezier(.22,1,.36,1)', fill:'backwards' })); }
  };
  w.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Google Drive"><div class="drh">' + DRV_ICO + '<div><div class="tn">GOOGLE DRIVE</div><h3>Guarda tus chats en tu Drive</h3></div></div><div class="drb"><p class="cnote">Cargando…</p></div><div class="tbtn" style="margin-top:16px"></div></div>';
  document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  $('.tcard', w).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:SZ.reduce ? 10 : 600, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { w.classList.remove('on'); setTimeout(() => w.remove(), 420); };
  w.addEventListener('pointerdown', e => { if (e.target === w) close(); });
  w.addEventListener('click', async e => {
    const b = e.target.closest('[data-d]'); if (!b) return;
    if (b.dataset.d === 'x') return close();
    if (b.dataset.d === 'un'){ if (await SZ.szConfirm('¿Desvincular tu Drive?', 'Dejo de guardar copias en tu Drive. La copia que ya está allá no se borra, y tus chats siguen en este dispositivo.', 'Desvincular')){ SZ.DRIVE.unlink(); toast('Desvinculaste tu Google Drive.'); paint(); } return; }
    if (await driveGo(b)) paint();
  });
  paint();
}
/* ---------- tu cuenta de SymphorIA ---------- */
let accEl = null;
function renderAccBtn(){
  const b = $('#accBtn'); if (!b) return;
  const A = SZ.ACC, u = A.user || {}, tm = $('#tabMe .tme');
  if (A.ready){ b.className = 'rbtn rme'; b.dataset.tip = SZ.accName(); b.setAttribute('aria-label', 'Tu cuenta: ' + SZ.accName()); b.innerHTML = SZ.myAvatar() + '<span class="rl"><b>' + esc(SZ.accName().slice(0, 22)) + '</b><small>' + esc(SZ.ROLE_NAME[u.role || 'user'] || 'Synther') + ' · ' + (A.err ? 'sin guardar en tu cuenta' : 'guardado en tu cuenta') + '</small></span><i class="sy' + (A.err ? ' bad' : '') + '" title="' + (A.err ? esc(A.err) : 'Sincronizado') + '"></i>'; if (tm) tm.innerHTML = SZ.myAvatar(); }
  else if (A.busy || SZ.signedish()){ b.className = 'rbtn rme'; b.dataset.tip = 'Abriendo tu cuenta…'; b.innerHTML = '<span class="av-me">…</span><span class="rl"><b>Abriendo…</b><small>tu cuenta</small></span><i class="sy wait"></i>'; if (tm) tm.innerHTML = '<span class="av-me">…</span>'; }
  else { b.className = 'rbtn rme out'; b.dataset.tip = 'Entrar a tu cuenta'; b.setAttribute('aria-label', 'Entrar a tu cuenta'); b.innerHTML = '<span class="av-me" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></span><span class="rl"><b>Entrar</b><small>guarda tus chats</small></span>'; if (tm) tm.innerHTML = '<span class="av-me" style="background:rgba(255,255,255,.1);color:var(--soft)" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></span>'; }
  b.style.setProperty('--i', 6);
}
/* v4.6 · «Tu cuenta» ya no es una ventana aparte: perfil, seguridad, nube y cerrar sesión están en Ajustes › Cuenta (core 14e),
   y al tocar tu perfil en la barra sale el panelito corto de React (next/componentes/synthflow/MenuCuenta.jsx).
   Esta ventana solo queda para entrar o crear una cuenta (sin sesión). */
function accModal(){
  if (SZ.ACC.ready){ SZ.cfgModal('cuenta'); return; }
  if (accEl) return;
  accEl = document.createElement('div'); accEl.id = 'acc';
  accEl.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Tu cuenta">'
    + '<div class="word" id="aWord"></div><div class="tn">TU CUENTA</div><div class="tb"><h3>Entra a Sonyx</h3><p>Con tu cuenta tus chats y favoritos te siguen a cualquier dispositivo, personalizas tu perfil y puedes hablar con el equipo de Sinapse. Solo necesitas un usuario y una contraseña (o tu cuenta de Google). Puter sigue siendo solo para sus IA.</p><div id="aAuth"></div></div>'
    + '<div class="tbtn" style="margin-top:18px"><button class="lnk" id="aClose" type="button">Cerrar</button></div></div>';
  document.body.appendChild(accEl); const w = $('#aWord'); if (w) w.innerHTML = zWord('Synth');
  requestAnimationFrame(() => accEl.classList.add('on'));
  $('.tcard', accEl).animate([{ transform:'scale(.9) translateY(24px)', opacity:0, filter:'blur(10px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:700, easing:'cubic-bezier(.22,1,.36,1)' });
  const close = () => { if (!accEl) return; const el = accEl; accEl = null; el.classList.remove('on'); setTimeout(() => el.remove(), 470); };
  $('#aClose').addEventListener('click', close);
  accEl.addEventListener('pointerdown', e => { if (e.target === accEl) close(); });
  SZ.authBox($('#aAuth'), () => { close(); renderAccBtn(); }, k => { close(); showBlockHelp(k); });
}
/* el panelito del perfil (React); si React todavía no cargó, se abre lo de siempre */
function accMenu(anchor){
  if (window.__mcListo){ try{ dispatchEvent(new CustomEvent('synthflow-menu-cuenta', { detail:{ anchor:anchor || null } })); return; }catch(e){} }
  if (SZ.ACC.ready) SZ.cfgModal('cuenta'); else accModal();
}
/* lo que cambia en el perfil o en «Mis IA ideales» desde Ajustes se refleja en el chat */
SZ.cfgAcc.onSurvey = ok => { forMeK = ''; applySurvey(true); renderList({ keep:true }); };
SZ.cfgAcc.onChange = () => { renderAccBtn(); };
SZ.accHooks.push(kind => {
  renderAccBtn();
  if (kind === 'pull'){ renderMsgs(); renderFoot(); paintSel(); renderTop(); updateHint(); renderChats(false); loadTeams().then(() => { fixModel(true); renderList({ keep:true }); updateHint(); }); try{ renderList({ keep:true }); }catch(e){} }
  if (kind === 'out'){ delete st().useTeam; paintProv(); renderList({ keep:true }); updateHint(); }
});
$('#accBtn').addEventListener('click', e => accMenu(e.currentTarget));
SZ.hooks.chats = () => { renderMsgs(); updateHint(); renderFoot(); renderChats(false); };
$('#cfgBtn').addEventListener('click', () => SZ.cfgModal());
SZ.smoothWheel(); SZ.orbitBg(msgsEl);
delete st().teamKey; delete st().team; delete st().teams;
renderAccBtn();
if (params.get('acc') === '1') setTimeout(accModal, 2600);

/* ===== v2.2 · orden nuevo: todo donde lo buscarías (estilo Claude) ===== */
/* Ajustes › Tus IAs: atajos a lo que antes estaba regado en menús */
SZ.cfgLinks.push(
  ['Elegir mis IA ideales', () => SZ.surveyModal(ok => { if (ok){ forMeK = ''; applySurvey(true); renderList({ keep:true }); } }), '3 preguntas y te digo cuáles te sirven más'],
  ['Conectar Puter u otra IA', () => openConnect(), 'Tu versión pro de las IAs más usadas, gratis'],
  ['Google Drive', () => driveModal(), 'Guarda una copia de tus chats en tu Drive'],
  ['Tu ranking (a ciegas)', () => rankModal(), 'Las IAs que más te gustan según tus votos']);
if (!SZ.appStandalone()) SZ.cfgLinks.push(['Descargar la app Sonyx', () => SZ.appPromo(true), 'Se instala desde aquí: pantalla completa y a un toque']);
/* «Respuestas cortas» desde Ajustes también pinta su botón */
addEventListener('synthz-saver', () => { $$('#sxSw, #saverBtn').forEach(x => x.setAttribute('aria-pressed', String(!!st().sx.saver))); updateHint(); });
/* el «+» trae todo: archivos, crear imagen, buscar en internet y respuestas cortas */
{
  const am = $('#attMenu'), ab = $('#attachBtn');
  const reactBox = !!(am && $('[data-att="saver"]', am));   /* v3.7 · React ya pinta el «+», «Respuestas cortas» y las bolitas */
  if (ab && !reactBox){ ab.setAttribute('aria-label', 'Agregar: archivos, imagen, internet…'); ab.dataset.tip = 'Archivos, crear imagen, buscar en internet…'; ab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'; }
  if (am){
    let sv = $('[data-att="saver"]', am);
    if (!sv){
      $$('.only-small', am).forEach(x => x.classList.remove('only-small'));
      const hint = $('.ahint', am); sv = document.createElement('button');
      sv.type = 'button'; sv.setAttribute('role', 'menuitemcheckbox'); sv.dataset.att = 'saver';
      sv.innerHTML = '<i aria-hidden="true">🍃</i><span><b>Respuestas cortas</b><small>Gastas menos de tu límite de hoy</small></span><em class="mck" aria-hidden="true"></em>';
      am.insertBefore(sv, hint);
    }
    const paint = () => { const on = !!st().sx.saver; sv.setAttribute('aria-checked', String(on)); $('.mck', sv).textContent = on ? '✓' : ''; };
    paint(); addEventListener('synthz-saver', paint);
    sv.addEventListener('click', e => { e.stopPropagation(); setSaver(!st().sx.saver); paint(); attClose(); }, true);
    const wb = $('[data-att="web"]', am), nb = $('[data-att="noweb"]', am), ib = $('[data-att="mkimg"]', am);
    const mark = () => { if (wb) wb.setAttribute('aria-checked', String(webMode === 'on')); if (nb) nb.setAttribute('aria-checked', String(webMode === 'off')); if (ib) ib.setAttribute('aria-checked', String(imgMode)); };
    new MutationObserver(mark).observe(document.body, { attributes:true, attributeFilter:['class'] }); mark();
  }
}
/* chips de lo que está encendido (imagen, internet, cortas): se apagan con un toque.
   v3.2 (Sammuel, 28 oct): ya no van en una fila aparte debajo de la caja; son bolitas junto al «+» que muestran su nombre al pasar el puntero. */
{
  const host = $('#onChips') || document.createElement('div');
  if (!host.isConnected){ host.className = 'onchips'; host.id = 'onChips'; const aw = $('.comp-in .attw'); if (aw) aw.appendChild(host); else { const ci = $('.comp-in'); if (ci) ci.appendChild(host); } }
  const paint = () => {
    const L = [];
    if (imgMode) L.push(['img', '🎨', 'Crear imagen']);
    if (webMode === 'on') L.push(['web', '🌐', SZ.lang() === 'en' ? 'Web search' : 'Internet']);
    if (webMode === 'off') L.push(['noweb', '🚫', SZ.lang() === 'en' ? 'No web search' : 'Sin internet']);
    if (st().sx.saver) L.push(['saver', '🍃', 'Respuestas cortas']);
    const have = $$('[data-off]', host).map(b => b.dataset.off).join(), want = L.map(x => x[0]).join(); if (have === want) return;
    host.innerHTML = L.map(([k, ic, t]) => '<button type="button" class="onchip" data-off="' + k + '" data-tip="' + t + ' · toca para apagar" aria-label="' + t + ': encendido. Toca para apagar"><i aria-hidden="true">' + ic + '</i><span class="oc-l">' + t + '</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg></button>').join('');
  };
  host.addEventListener('click', e => { const b = e.target.closest('[data-off]'); if (!b) return; const k = b.dataset.off; if (k === 'img') setImgMode(false); else if (k === 'web' || k === 'noweb') setWebMode('auto', true); else setSaver(false); paint(); });
  new MutationObserver(paint).observe(document.body, { attributes:true, attributeFilter:['class'] });
  addEventListener('synthz-saver', paint); $('#saverBtn') && $('#saverBtn').addEventListener('click', () => setTimeout(paint, 0)); paint();
}
/* ===== v2.3 · en el celular, la barra puede ir a la izquierda: se abre con ☰ y se cierra al elegir ===== */
{
  const nb = $('#navBtn'), tb = $('#tabbar');
  let scrim = null;
  const isOpen = () => root.classList.contains('navopen');
  const setNav = on => {
    if (!root.classList.contains('navleft')) on = false;
    root.classList.toggle('navopen', on); nb.setAttribute('aria-expanded', String(on));
    if (on){ if (!scrim){ scrim = document.createElement('div'); scrim.className = 'navscrim'; scrim.addEventListener('click', () => setNav(false)); document.body.appendChild(scrim); } requestAnimationFrame(() => scrim.classList.add('on')); const f = $('button', tb); if (f) f.focus({ preventScroll:true }); }
    else if (scrim){ const s = scrim; scrim = null; s.classList.remove('on'); setTimeout(() => s.remove(), 320); }
  };
  nb.addEventListener('click', () => setNav(!isOpen()));
  tb.addEventListener('click', e => { if (isOpen() && e.target.closest('[data-tab]')) setTimeout(() => setNav(false), 60); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()){ setNav(false); nb.focus(); } });
  addEventListener('resize', () => { if (!isMobile()) setNav(false); });
  /* arriba del menú: el nombre de SynthFlow, para que se sienta un cajón de verdad */
  if (!$('.tb-head', tb)) tb.insertAdjacentHTML('afterbegin', '<div class="tb-head" aria-hidden="true"><span class="tbw"></span></div>');
  const w = $('.tbw', tb); if (w) w.innerHTML = SZ.zWord('Synth');
}
/* ---------- v4.3 (8 nov) · esfuerzo: Auto · Veloz · Profundo · Creativo (antes Auto · Bajo · Medio · Alto) ----------
   Pedido de Sammuel: cuatro niveles, cada uno con una frase de para qué sirve. Profundo es el que más gasta.
   Cómo se aplica: (1) una pista en el mensaje de sistema, que sirve con cualquier IA; (2) Veloz además limita el largo;
   (3) al servidor va api: Veloz = 'low' (responde directo), Profundo = 'high' (IA grande, piensa y revisa, hasta 8000 tokens:
   por eso es el que más EnerX gasta, porque se descuenta el gasto real), Creativo = 'creative' (más temperatura).
   Con OpenRouter directo solo se manda reasoning.effort cuando es low/high. Profundo pide cuenta (entrar es gratis).
   Lo guardado con los nombres viejos se lee así: Bajo → Veloz, Alto → Profundo, Medio → Auto. */
const EFF = {
  auto:     { n:'Flow',     d:'La IA decide cuánto pensar según tu pregunta.',              api:'',         hint:'',  tok:0, ico:'<path d="M4.5 16a8 8 0 1 1 15 0"/><path d="M12 14l3.5-4"/>' },
  fast:     { n:'Fragment', d:'Respuestas rápidas y cortas, para lo del día a día.',          api:'low',      hint:'Responde rápido y directo, en pocas frases y sin rodeos.', tok:700, ico:'<path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/>' },
  deep:     { n:'Focus',    d:'Piensa a fondo y revisa su respuesta. Es el que más EnerX gasta.', api:'high', hint:'Razona con cuidado antes de responder: analiza el problema paso a paso, revisa tu respuesta y entrega una respuesta completa y bien fundamentada.', tok:0, ico:'<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/><path d="M11 8v3l2 1.5"/>' },
  creative: { n:'Horizon',  d:'Ideas originales y textos con chispa, para crear.',            api:'creative', hint:'Sé creativo y original: propone ideas poco obvias, usa imágenes y ejemplos vivos, juega con el tono y evita lo genérico, sin perder la claridad ni inventar datos.', tok:0, ico:'<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="2.5"/>' }
};
const EFF_KEYS = ['auto', 'fast', 'deep', 'creative'];
const EFF_OLD = { low:'fast', high:'deep', medium:'auto' };
function effKey(){ let e = st().sx && st().sx.effort; if (EFF_OLD[e]) e = EFF_OLD[e]; return EFF[e] ? e : 'auto'; }
function effortHint(){ return EFF[effKey()].hint; }
function effortOpts(saver){ const k = effKey(); if (k === 'auto') return {}; const o = { effort:EFF[k].api }; if (EFF[k].tok && !saver) o.maxTokens = EFF[k].tok; return o; }
(function esfuerzo(){
  const btn = $('#cEffort'), menu = $('#effMenu'), lab = $('#cEffortL'); if (!btn || !menu) return;
  const svg = k => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + EFF[k].ico + '</svg>';
  const locked = k => k === 'deep' && !SZ.ACC.ready;
  function paint(){
    const k = effKey(); lab.textContent = k === 'auto' ? '' : EFF[k].n; btn.classList.toggle('on', k !== 'auto');
    btn.title = 'Esfuerzo: ' + EFF[k].n + ' · cuánto piensa la IA antes de responder';
    menu.innerHTML = EFF_KEYS.map(x => '<button type="button" role="menuitemradio" data-eff="' + x + '" aria-checked="' + (x === k) + '"' + (locked(x) ? ' class="lk"' : '') + '><i aria-hidden="true">' + svg(x) + '</i><span><b>' + EFF[x].n + '</b><small>' + EFF[x].d + '</small></span>' + (locked(x) ? '<em>Con cuenta</em>' : x === k ? '<em class="ck">✓</em>' : '') + '</button>').join('');
  }
  function place(){ const r = btn.getBoundingClientRect(), w = Math.min(270, innerWidth - 16); menu.style.width = w + 'px'; menu.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px'; menu.style.bottom = (innerHeight - r.top + 10) + 'px'; }
  function open(on){ menu.hidden = !on; btn.setAttribute('aria-expanded', String(on)); if (on){ paint(); place(); const c = $('[aria-checked="true"]', menu); if (c) c.focus(); } }
  btn.addEventListener('click', e => { e.stopPropagation(); open(menu.hidden); });
  menu.addEventListener('click', e => {
    const b = e.target.closest('[data-eff]'); if (!b) return; const k = b.dataset.eff;
    if (locked(k)){ open(false); toast('El esfuerzo Focus es para cuentas (entrar es gratis).'); SZ.guestGate({ mode:'signup' }); return; }
    st().sx.effort = k; save(); paint(); open(false); btn.focus(); toast('Esfuerzo: ' + EFF[k].n + (k === 'auto' ? '' : ' · ' + EFF[k].d));
  });
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) open(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden){ open(false); btn.focus(); } });
  addEventListener('resize', () => { if (!menu.hidden) place(); });
  paint();
})();
/* ---------- v2.3.1 · modo de uso: Automática · Chat · SuperiorSynth ----------
   Automática: Sinapse elige sola la IA y no se muestra el selector.  Chat: eliges tú la IA (empieza en Gemini).
   Apex: el agente elige la IA; cuando la persona dice «me quedo con esta» pasa a Chat con esa IA al lado.
   El modo se deduce del estado (agente encendido, IA elegida), así que sigue funcionando con todo lo que ya cambia de IA. */
const MODES = {
  auto:  { n:'Automática',   d:'Elige sola la mejor IA para cada pedido.',          ico:'<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>' },
  chat:  { n:'Chat',         d:'Tú eliges con qué IA hablas.',                       ico:'<path d="M4 5h16v11H9l-5 4z"/>' },
  agent: { n:'Apex', d:'Tareas largas: elige la IA y mejora tu pedido.',   ico:'<path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/>' }
};
const MODE_KEYS = ['auto', 'chat', 'agent'];
const modeSvg = k => k === 'agent' && typeof ssIco === 'function' ? ssIco() : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + MODES[k].ico + '</svg>';
function modeKey(){ if (agentOn()) return 'agent'; return selId() === 'sz:auto' ? 'auto' : 'chat'; }   /* «Automática» es solo un modo; en Chat siempre hay una IA concreta */
/* la IA con la que empieza «Chat»: Gemini (la más nueva que esté disponible y gratis); si no hay, la que ya tenías */
function geminiDefault(){
  const g = (cat.list || []).filter(m => /gemini/i.test(m.id + ' ' + m.name) && !/embed|image|tts|live|audio/i.test(m.id)), pool = g.filter(m => connected(m.id));
  const best = (pool.length ? pool : g).slice().sort((a, b) => (b.free - a.free) || (b.created - a.created))[0];
  if (best) return best.id;
  const s = (st().models.openrouter || []).find(x => /gemini/i.test(x) && connected(x)); if (s) return s;
  const any = (cat.list || []).filter(m => m.id !== 'sz:auto' && connected(m.id)).sort((a, b) => (b.free - a.free) || (b.created - a.created))[0];   /* sin Gemini: cualquier IA concreta que esté disponible */
  return any ? any.id : '';
}
function setModel(id){ st().model.openrouter = id; st().pinned = id; save(); }
function applyMode(k){
  if (k === modeKey()) return;
  const sx = st().sx;
  if (k === 'agent'){ setAgent(true); return; }
  if (agentOn()) setAgent(false);
  if (k === 'auto'){ const cur = selId(); if (cur !== 'sz:auto') sx.lastChat = cur; sx.cmode = 'auto'; st().pinned = ''; st().model.openrouter = 'sz:auto'; }
  else { sx.cmode = 'chat'; const want = (sx.lastChat && connected(sx.lastChat) ? sx.lastChat : '') || geminiDefault(); if (want && want !== selId()) setModel(want); }
  save(); paintMode(); try{ paintSel(); renderTop(true); renderMsgs(); updateHint(); }catch(e){}
  toast(k === 'auto' ? 'Modo Automática: Sinapse elige la IA por ti.' : 'Modo Chat: tú eliges la IA (' + info(selId()).name + ').');
}
function paintMode(){
  const k = modeKey(), b = $('#cMode'); if (!b) return;
  document.body.dataset.cmode = k; $('#cModeL').textContent = MODES[k].n; $('#cModeI').innerHTML = modeSvg(k); b.title = 'Modo: ' + MODES[k].n;
}
(function modos(){
  const btn = $('#cMode'), menu = $('#modeMenu'); if (!btn || !menu) return;
  function paint(){ const k = modeKey(); menu.innerHTML = MODE_KEYS.map(x => '<button type="button" role="menuitemradio" data-mode="' + x + '" aria-checked="' + (x === k) + '"><i aria-hidden="true">' + modeSvg(x) + '</i><span><b>' + MODES[x].n + '</b><small>' + MODES[x].d + '</small></span>' + (x === k ? '<em class="ck">✓</em>' : '') + '</button>').join(''); }
  function place(){ const r = btn.getBoundingClientRect(), w = Math.min(300, innerWidth - 16); menu.style.width = w + 'px'; menu.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px'; menu.style.bottom = (innerHeight - r.top + 10) + 'px'; }
  function open(on){ menu.hidden = !on; btn.setAttribute('aria-expanded', String(on)); if (on){ paint(); place(); const c = $('[aria-checked="true"]', menu); if (c) c.focus(); } }
  btn.addEventListener('click', e => { e.stopPropagation(); open(menu.hidden); });
  menu.addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (!b) return; open(false); applyMode(b.dataset.mode); btn.focus(); });
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) open(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden){ open(false); btn.focus(); } });
  addEventListener('resize', () => { if (!menu.hidden) place(); });
  paintMode();
})();
/* ===== v2.8 · el fondo se calma cuando conversas: apenas hay mensajes (escribiste o abriste un chat que ya tenías),
   la «seda» del cielo se apaga en «calma» y sube una ola de noche desde la caja de escribir, así todo se lee mejor.
   En un chat nuevo (o al comparar sin respuestas todavía) la ola se retira y vuelve la seda. ===== */
(() => {
  const A = SZ.AURORA; if (!A) return;
  const conv = () => !document.body.classList.contains('fresh') && !$(':scope > .hello', lane);
  let q = 0;
  const check = () => { q = 0; A.setCalm(conv()); };
  const mo = new MutationObserver(() => { if (!q) q = requestAnimationFrame(check); });
  /* al abrir, el cielo ya aparece como corresponde (sin ola); la ola es para los cambios */
  requestAnimationFrame(() => {
    A.setCalm(conv(), true);
    mo.observe(document.body, { attributes:true, attributeFilter:['class'] });
    mo.observe(lane, { childList:true });
  });
})();
/* ===== v3.2 · la barra de chats al estilo Claude en el modo Simple (pedido de Sammuel, 28 oct) =====
   Arriba Crear, Comparar IAs, Espacios, Obras y Favoritos (v4.6: sin «Personalización» ni «Más»; Ajustes, Idioma, Ayuda y Planes están en el panelito del perfil); en medio tus chats («Recientes»);
   abajo tu cuenta y una lupa para buscar. La barrita de íconos se esconde mientras la lista está abierta.
   v3.7 · ahora también en el estilo SynthFlow (con los colores del tema): una sola barra, más simple, para todos. */
let accInfo = { ready:false, name:'Entrar', plan:'Gratis' };
{
  const cin = $('#chats .cin'), head = $('#chats .chead');
  const I = {
    new:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    proj:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-6.5L9.6 5.6A2 2 0 0 0 8 5H6a2 2 0 0 0-2 2.5z"/></svg>',
    syn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="12" height="14" rx="2.5"/><path d="M8.5 5V4.5A1.5 1.5 0 0 1 10 3h8.5A2 2 0 0 1 20.5 5v11A1.5 1.5 0 0 1 19 17.5h-.5"/><path d="M7.5 10l-1.5 2 1.5 2M11.5 10l1.5 2-1.5 2"/></svg>',
    cfg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7" width="17" height="12.5" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M3.5 12.5h17"/></svg>',
    more:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/></svg>',
    star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/></svg>',
    guide:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/></svg>',
    help:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13z"/></svg>',
    batt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7.5" width="16" height="9" rx="2.2"/><path d="M21 10.5v3"/><path d="M6 10.5v3M9 10.5v3" stroke-width="2.2"/></svg>',
    find:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>',
    side:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M9.5 4.5v15"/></svg>',
    cmp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="7.5" height="14" rx="2"/><rect x="13.5" y="5" width="7.5" height="14" rx="2"/></svg>',
    chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10l5 5 5-5"/></svg>'
  };
  const item = (k, ic, t, extra) => '<button type="button" class="sn-i" data-sn="' + k + '" style="--d:' + extra + '"><span class="sn-ic" aria-hidden="true">' + ic + '</span><span class="sn-t">' + t + '</span></button>';
  /* v3.7 · en la versión React el menú lo pinta y lo maneja el componente BarraNav (usa window.SZFlow); aquí solo si no está */
  const reactNav = !!document.getElementById('sNav');
  const nav = reactNav ? document.getElementById('sNav') : document.createElement('nav'); if (!reactNav){ nav.className = 'snav'; nav.id = 'sNav'; nav.setAttribute('aria-label', 'Menú de SynthFlow');
  nav.innerHTML = '<div class="sn-top"><a class="sn-logo" href="index.html" aria-label="Volver a SymphorIA">' + SZ.flowWord() + '</a><button type="button" class="sn-x" data-sn="hide" aria-label="Cerrar la barra" data-tip="Cerrar la barra">' + I.side + '</button></div>'
    + item('new', I.new, 'Crear', 0) + item('cmp', I.cmp, 'Comparar IAs', 1) + item('proj', I.proj, 'Espacios', 2) + item('syn', I.syn, 'Obras', 3) + item('favs', I.star, 'Favoritos', 4);
  head.after(nav); }
  /* v3.7 · «Recientes» y el pie (tu cuenta + lupa) también los pinta React (PieBarra); aquí solo el motor de la cuenta */
  const reactFoot = !!document.getElementById('sFoot');
  if (!reactFoot){
    const rh = document.createElement('p'); rh.className = 'sn-h'; rh.textContent = 'Recientes'; $('#thList').before(rh);
    const foot = document.createElement('div'); foot.className = 'sfoot'; foot.id = 'sFoot';
    foot.innerHTML = '<button type="button" class="sf-acc" id="sAcc"></button><button type="button" class="sf-find" id="sFind" aria-label="Buscar en tus chats" data-tip="Buscar en tus chats" aria-pressed="false">' + I.find + '</button>';
    cin.appendChild(foot);
  }

  /* tu cuenta: copia lo que muestra el botón de cuenta de la barrita (foto, nombre y plan) */
  const accPaint = () => {
    const A = SZ.ACC || {}, u = A.user || {}, sa = $('#sAcc');
    const plan = A.ready ? (SZ.ROLE_NAME && SZ.ROLE_NAME[u.role || 'user']) || 'Synther' : 'Gratis';
    const av = A.ready && SZ.myAvatar ? SZ.myAvatar() : '<span class="av-me" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></span>';
    const nm = A.ready ? SZ.accName() : 'Entrar';
    if (reactFoot){
      /* React pinta nombre y plan; la foto (HTML del motor) va en su hueco */
      const fa = $('#sAcc .sf-av'); if (fa) fa.innerHTML = av;
      accInfo = { ready:!!A.ready, name:nm.slice(0, 22), plan:A.ready ? plan : 'Gratis' };
      try{ dispatchEvent(new CustomEvent('synthflow-acc', { detail:accInfo })); }catch(e){}
      return;
    }
    sa.innerHTML = '<span class="sf-av">' + av + '</span><span class="sf-n"><b></b><small></small></span><span class="sf-chev" aria-hidden="true">' + I.chev + '</span>';
    $('.sf-n b', sa).textContent = nm.slice(0, 22); $('.sf-n small', sa).textContent = A.ready ? plan : 'Gratis';
    sa.setAttribute('aria-label', A.ready ? 'Tu cuenta: ' + nm : 'Entrar a tu cuenta');
  };
  accPaint();
  const ab = $('#accBtn'); if (ab) new MutationObserver(accPaint).observe(ab, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });

  if (!reactFoot){
    $('#sAcc').addEventListener('click', e => accMenu(e.currentTarget));
    /* la lupa muestra la búsqueda arriba de los chats (y la esconde si está vacía) */
    const q = $('#thQ');
    const findOn = on => { cin.classList.toggle('sfind', on); $('#sFind').setAttribute('aria-pressed', String(on)); if (on) setTimeout(() => q.focus(), 60); };
    $('#sFind').addEventListener('click', () => { const on = !cin.classList.contains('sfind'); if (!on && q.value){ q.value = ''; q.dispatchEvent(new Event('input', { bubbles:true })); } findOn(on); });
    q.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('simple') && !q.value) findOn(false); });
  }

  if (!reactNav){
  nav.addEventListener('click', e => {
    const b = e.target.closest('[data-sn]'); if (!b) return;
    const k = b.dataset.sn; SZ.SND && SZ.SND.tap && SZ.SND.tap();
    if (k === 'hide'){ $('#chatsClose').click(); return; }
    if (k === 'new') newChat();
    else if (k === 'cmp') cmpOpen(b);
    else if (k === 'proj') pjOpen('list');
    else if (k === 'syn') synOpen();
    else if (k === 'favs') showChats('favs');
    if (isMobile() && k !== 'favs') closeChatsSheet();
  });
  /* el que está abierto se marca, como en Claude */
  const mark = () => {
    const on = { cmp:document.body.classList.contains('cmpm'), proj:document.body.classList.contains('pjon'), syn:!$('#synv') || $('#synv').hidden ? false : true };
    $$('.sn-i[data-sn]', nav).forEach(b => b.classList.toggle('on', !!on[b.dataset.sn]));
  };
  new MutationObserver(mark).observe(document.body, { attributes:true, attributeFilter:['class'] });
  const sv = $('#synv'); if (sv) new MutationObserver(mark).observe(sv, { attributes:true, attributeFilter:['hidden'] });
  mark();
  }
}
/* v3.7 · «Comparar IAs», aparte del chat normal: marcas de 2 a 4 IA y responden la misma pregunta lado a lado.
   Si ya estás comparando, te deja sumar otra (hasta 4). */
function cmpOpen(anchor){
  if (trialOn){ toast('La prueba guiada usa una sola IA. Para comparar, entra con tu cuenta o conecta Puter (es gratis).'); return; }
  if (mode === 'cmp'){ if (st().cmp.length < CMP_MAX) openSide('add', anchor); else { toast('Ya estás comparando 4 IA, el máximo.'); inp.focus(); } return; }
  openSide('cmp', anchor);
}
/* ---------- v4.3 · Chispa+ · aviso GRANDE al elegir un modelo premium de alto consumo (Sammuel, 9 nov) ----------
   Cuando alguien con Chispa+ elige un modelo caro (Claude Fable/Opus, GPT pro, Gemini Pro…) sale una tarjeta grande que dice cuánto
   gasta y hay que aceptarla. Sale CADA VEZ que se elige uno de esos. Hoy no sale nunca: la premium está apagada (api/_premium.js)
   y la lista de IAs aún no trae modelos con m.premium && m.heavy. pickModel() la llama antes de cambiar de IA. */
let premiumAvisoAbierto = false;
function premiumAviso(m){
  return new Promise(res => {
    if (premiumAvisoAbierto) return res(false);
    premiumAvisoAbierto = true;
    const en = SZ.lang() === 'en', N = Math.max(2, Math.round(+m.mult || 2)), usd = +m.usdMsg || 0;
    const Q = SZ.SZQ, left = Q && Number.isFinite(+Q.credit) ? Math.max(0, +Q.credit) : null;
    const pct = left ? Math.min(100, Math.max(1, Math.round(usd / left * 100))) : null;
    const veces = left && usd ? Math.floor(left / usd) : null;
    const T = en ? {
      tag:'HIGH USAGE', h:m.name + ' uses a lot', p:'This is one of the most powerful (and expensive) AIs. It is worth it for hard tasks; for everyday questions a lighter one gives the same answer and your EnerX lasts longer.',
      a:'Uses your EnerX ' + N + '× faster', b:pct ? 'Each answer uses about ' + pct + '% of the premium credit you have left' : 'Each answer uses part of your monthly premium credit',
      c:veces != null ? 'With what you have left: about ' + veces + ' answers' : 'When your credit runs out, you keep the free AIs', ok:'Use it anyway', no:'Pick a lighter one' } : {
      tag:'ALTO CONSUMO', h:m.name + ' gasta mucho', p:'Es una de las IAs más potentes (y caras). Vale la pena para tareas difíciles; para lo de todos los días una más liviana te da la misma respuesta y tu EnerX dura más.',
      a:'Gasta tu EnerX ' + N + ' veces más rápido', b:pct ? 'Cada respuesta usa cerca del ' + pct + ' % del crédito premium que te queda' : 'Cada respuesta usa parte de tu crédito premium del mes',
      c:veces != null ? 'Con lo que te queda: unas ' + veces + ' respuestas' : 'Si se acaba el crédito, sigues con las IAs gratis', ok:'Usarla igual', no:'Elegir una más liviana' };
    const o = document.createElement('div'); o.className = 'pav'; o.id = 'premiumAviso';
    o.innerHTML = '<div class="pav-card notr" role="alertdialog" aria-modal="true" aria-labelledby="pavH" aria-describedby="pavP">'
      + '<div class="pav-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>' + esc(T.tag) + '</div>'
      + '<div class="pav-x" aria-hidden="true">×' + N + '</div>'
      + '<h3 id="pavH">' + esc(T.h) + '</h3><p id="pavP">' + esc(T.p) + '</p>'
      + '<ul><li>' + esc(T.a) + '</li><li>' + esc(T.b) + '</li><li>' + esc(T.c) + '</li></ul>'
      + '<div class="pav-btn"><button type="button" class="btn" data-no>' + esc(T.no) + '</button><button type="button" class="lnk" data-ok>' + esc(T.ok) + '</button></div></div>';
    document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
    const back = document.activeElement; let gone = false;
    const out = v => { if (gone) return; gone = true; premiumAvisoAbierto = false; removeEventListener('keydown', key, true); o.classList.remove('on'); setTimeout(() => o.remove(), 400); try{ if (back && back.focus) back.focus(); }catch(e){} res(v); };
    const key = e => { if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); out(false); } else if (e.key === 'Tab'){ const f = [...o.querySelectorAll('button')]; const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); } };
    addEventListener('keydown', key, true);
    $('[data-no]', o).addEventListener('click', () => out(false));
    $('[data-ok]', o).addEventListener('click', () => out(true));
    o.addEventListener('pointerdown', e => { if (e.target === o) out(false); });
    setTimeout(() => { const b = $('[data-no]', o); if (b) b.focus({ preventScroll:true }); }, 60);   /* lo seguro primero: Enter no gasta de más */
  });
}
SZ.premiumAviso = premiumAviso;   /* para probarlo y para la vista previa de Pulsem */
/* ---------- 2026-11-09 · Importar chats y memoria desde otras IAs (ChatGPT, Claude, JSON, Markdown) ----------
   Encendido para todos desde v4.5. Sale en el menú «⋯» y en Ajustes › Tus IAs.
   Paso 1: eliges archivos (o pegas texto). Paso 2: ves todo y marcas qué traer. Paso 3: listo, con botón para abrirlo.
   Los archivos se leen aquí (IMP, 05h); se guardan como chats normales de la IA que tienes elegida y los recuerdos
   pasan por memAddCore (sin duplicar, máx. 40). Lo ya importado se recuerda (st().impIds) para no traerlo dos veces. */
/* v4.5 (Sammuel, 9 nov: «lo de importar queda para todos»): ENCENDIDO para todos. ?importar=0 lo esconde solo en ese navegador
   (por si alguien quiere probar sin él); ?importar=1 lo vuelve a mostrar. */
const IMP_ON = (() => {
  try{
    const q = new URLSearchParams(location.search).get('importar');
    if (q === '0') localStorage.setItem('synthz:f:importar', '0'); else if (q === '1') localStorage.removeItem('synthz:f:importar');
    return localStorage.getItem('synthz:f:importar') !== '0';
  }catch(e){ return true; }
})();
const IMP_SRC = { chatgpt:'ChatGPT', claude:'Claude', synthflow:'Sonyx', json:'JSON', texto:'Texto' };
const IMP_MAX = 200, IMP_PRE = 50, MEM_CAP = 40;
const impL = (es, en) => SZ.lang() === 'en' ? en : es;
function impOpen(){
  if ($('#impm')) return;
  const o = document.createElement('div'); o.id = 'impm'; o.className = 'szm impm notr';
  const ICO_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>';
  const tip = (name, es, en) => '<details class="imp-how"><summary>' + name + '</summary><p>' + impL(es, en) + '</p></details>';
  o.innerHTML = '<div class="tcard imp-card" role="dialog" aria-modal="true" aria-labelledby="impT">'
    + '<i class="imp-staff" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b></i>'
    + '<button type="button" class="imp-x" data-imp="close" aria-label="' + impL('Cerrar', 'Close') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'
    /* paso 1 */
    + '<section data-step="1"><p class="imp-k">' + impL('Importar', 'Import') + '</p><h3 id="impT">' + impL('Trae tus chats y tu memoria', 'Bring your chats and memory') + '</h3>'
    + '<p class="imp-sub">' + impL('Desde ChatGPT, Claude u otra IA. Primero ves todo y eliges qué traer.', 'From ChatGPT, Claude or another AI. You see everything first and choose what to bring.') + '</p>'
    + '<label class="imp-drop" for="impFile">' + ICO_UP + '<b>' + impL('Arrastra aquí tus archivos', 'Drop your files here') + '</b><small>' + impL('o toca para elegirlos · .zip, .json, .md o .txt', 'or tap to choose them · .zip, .json, .md or .txt') + '</small>'
    + '<input id="impFile" type="file" multiple accept=".zip,.json,.md,.markdown,.txt,application/zip,application/json,text/plain,text/markdown"></label>'
    + '<div class="imp-hows">'
    + tip('ChatGPT', 'Ajustes › Controles de datos › <b>Exportar datos</b>. Te llega un correo con un .zip: súbelo tal cual. Su memoria no viene en el .zip: pregúntale «Haz una lista de todo lo que recuerdas de mí» y pega la respuesta abajo.', 'Settings › Data controls › <b>Export data</b>. You get an email with a .zip: upload it as is. Its memory is not in the .zip: ask it «Make a list of everything you remember about me» and paste the answer below.')
    + tip('Claude', 'Ajustes › Privacidad › <b>Exportar datos</b>. Sube el .zip que te llega: trae tus chats y, si la tienes, tu memoria.', 'Settings › Privacy › <b>Export data</b>. Upload the .zip you get: it brings your chats and, if you have it, your memory.')
    + tip(impL('Otra IA', 'Another AI'), 'Un .json con mensajes, o un .md/.txt con «Usuario:» y «Asistente:». Una lista sin esas marcas se lee como cosas para recordar.', 'A .json with messages, or a .md/.txt with «User:» and «Assistant:». A list without those marks is read as things to remember.')
    + '</div>'
    + '<div class="imp-paste"><textarea id="impTxt" rows="3" placeholder="' + impL('…o pega aquí lo que tu otra IA recuerda de ti (o una conversación)', '…or paste here what your other AI remembers about you (or a conversation)') + '" aria-label="' + impL('Pegar texto', 'Paste text') + '"></textarea><button type="button" class="btn sm ghost" data-imp="paste">' + impL('Leer', 'Read') + '</button></div>'
    + '<p class="imp-priv">' + impL('Se lee aquí mismo, en tu navegador. Solo se guarda lo que elijas, igual que tus otros chats.', 'It is read right here, in your browser. Only what you choose is saved, like your other chats.') + '</p></section>'
    /* leyendo */
    + '<section data-step="0" hidden class="imp-load"><i class="imp-tune" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b></i><p>' + impL('Leyendo tus archivos…', 'Reading your files…') + '</p></section>'
    /* paso 2 */
    + '<section data-step="2" hidden><p class="imp-k">' + impL('Vista previa', 'Preview') + '</p><h3>' + impL('Elige qué traer', 'Choose what to bring') + '</h3><p class="imp-sum" aria-live="polite"></p><div class="imp-lists"></div>'
    + '<div class="tbtn imp-foot"><button class="lnk" type="button" data-imp="back">' + impL('Volver', 'Back') + '</button><button class="btn sm" type="button" data-imp="go"></button></div></section>'
    /* paso 3 */
    + '<section data-step="3" hidden class="imp-done"><svg class="imp-ok" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/><path d="M15 27l7 7 15-16"/></svg><h3></h3><p class="imp-sub"></p>'
    + '<div class="tbtn imp-foot"><button class="lnk" type="button" data-imp="close">' + impL('Cerrar', 'Close') + '</button><button class="btn sm" type="button" data-imp="open">' + impL('Abrir el más reciente', 'Open the latest') + '</button></div></section>'
    + '</div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const back = document.activeElement; let gone = false, data = null, last = null;
  const step = n => { $$('section[data-step]', o).forEach(s => { s.hidden = s.dataset.step !== String(n); }); const f = $('section[data-step="' + n + '"] h3', o); if (f){ f.tabIndex = -1; f.focus({ preventScroll:true }); } };
  const close = () => { if (gone) return; gone = true; removeEventListener('keydown', key, true); o.classList.remove('on'); setTimeout(() => o.remove(), 400); try{ if (back && back.focus) back.focus(); }catch(e){} };
  const key = e => { if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); close(); } };
  addEventListener('keydown', key, true);
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  const done0 = () => new Set(st().impIds || []);
  const idOf = c => c.src + ':' + (c.sid || c.title + ':' + c.msgs.length);
  async function read(fn){
    step(0);
    const t0 = Date.now(); let r;
    try{ r = await fn(); }catch(e){ r = { chats:[], mem:[], bad:['?'] }; }
    await new Promise(res => setTimeout(res, Math.max(0, 500 - (Date.now() - t0))));   /* que el «leyendo» se alcance a ver */
    const had = done0(), memNow = new Set(((st().mem || {}).items || []).map(x => x.text.toLowerCase()));
    r.chats.forEach(c => { c.id = idOf(c); c.old = had.has(c.id); });
    r.mem = r.mem.filter(x => !memNow.has(x.toLowerCase()));
    const fresh = r.chats.filter(c => !c.old); fresh.forEach((c, i) => { c.on = i < IMP_PRE; });
    const free = Math.max(0, MEM_CAP - ((st().mem || {}).items || []).length);
    data = { chats:r.chats, mem:r.mem.map((text, i) => ({ text, on:i < free })), bad:r.bad || [], free, q:'' };
    if (!r.chats.length && !r.mem.length){ step(1); toast(data.bad.length ? impL('No pude leer ' + data.bad.join(', ') + '. ¿Es el archivo que te mandó tu otra IA?', "I couldn't read " + data.bad.join(', ') + '. Is it the file your other AI sent you?') : impL('No encontré chats ni recuerdos ahí.', "I didn't find chats or memories there.")); return; }
    paint(); step(2);
  }
  const fmtD = t => t ? new Date(t).toLocaleDateString(SZ.lang() === 'en' ? 'en-US' : 'es-CO', { day:'numeric', month:'short', year:'numeric' }) : '';
  function paint(){
    const d = data, q = d.q.toLowerCase(), nC = d.chats.filter(c => c.on).length, nM = d.mem.filter(m => m.on).length, nOld = d.chats.filter(c => c.old).length;
    const L = d.chats.filter(c => !q || c.title.toLowerCase().includes(q) || c.msgs.some(m => m.content.toLowerCase().includes(q)));
    const firstU = c => { const u = c.msgs.find(m => m.role === 'user'); return u ? u.content.replace(/\s+/g, ' ').slice(0, 110) : ''; };
    let h = '';
    if (d.chats.length){
      h += '<div class="imp-grp"><div class="imp-gh"><b>' + impL('Chats', 'Chats') + ' <em>' + d.chats.length + '</em></b>'
        + (d.chats.length > 6 ? '<input class="imp-q" type="search" value="' + esc(d.q) + '" placeholder="' + impL('Buscar…', 'Search…') + '" aria-label="' + impL('Buscar en los chats', 'Search the chats') + '">' : '')
        + '<button type="button" class="lnk" data-imp="allc">' + (nC ? impL('Ninguno', 'None') : impL('Todos', 'All')) + '</button></div><ul class="imp-l" role="list">'
        + L.slice(0, 400).map(c => '<li' + (c.old ? ' class="old"' : '') + '><label><input type="checkbox" data-c="' + esc(c.id) + '"' + (c.on ? ' checked' : '') + (c.old ? ' disabled' : '') + '><span class="imp-t"><b></b><small>' + esc(IMP_SRC[c.src] || c.src) + ' · ' + impL(c.msgs.length + ' mensajes', c.msgs.length + ' messages') + (c.t ? ' · ' + esc(fmtD(c.t)) : '') + (c.old ? ' · ' + impL('ya lo trajiste', 'already imported') : '') + '</small><i></i></span></label></li>').join('')
        + (L.length > 400 ? '<li class="imp-more">' + impL('…y ' + (L.length - 400) + ' más: búscalos arriba', '…and ' + (L.length - 400) + ' more: search for them above') + '</li>' : '')
        + (!L.length ? '<li class="imp-more">' + impL('Nada coincide.', 'Nothing matches.') + '</li>' : '') + '</ul></div>';
    }
    if (d.mem.length){
      h += '<div class="imp-grp"><div class="imp-gh"><b>' + impL('Para recordar', 'To remember') + ' <em>' + d.mem.length + '</em></b><button type="button" class="lnk" data-imp="allm">' + (nM ? impL('Ninguno', 'None') : impL('Todos', 'All')) + '</button></div>'
        + '<p class="imp-note">' + (d.free ? impL('Tu memoria tiene espacio para ' + d.free + ' cosas más. Lo repetido se actualiza, no se duplica.', 'Your memory has room for ' + d.free + ' more things. Repeats are updated, not duplicated.') : impL('Tu memoria está llena (40). Olvida algo en Ajustes para hacer espacio.', 'Your memory is full (40). Forget something in Settings to make room.')) + '</p>'
        + '<ul class="imp-l mem" role="list">' + d.mem.map((m, i) => '<li><label><input type="checkbox" data-m="' + i + '"' + (m.on ? ' checked' : '') + '><span class="imp-t"><b></b></span></label></li>').join('') + '</ul></div>';
    }
    const box = $('.imp-lists', o); box.innerHTML = h;
    /* los textos que vienen de afuera van con textContent, nunca como HTML */
    $$('[data-c]', box).forEach(x => { const c = d.chats.find(cc => cc.id === x.dataset.c); const li = x.closest('li'); $('.imp-t b', li).textContent = c.title || firstU(c) || impL('Conversación', 'Conversation'); $('.imp-t i', li).textContent = c.title ? firstU(c) : ''; });
    $$('[data-m]', box).forEach(x => { $('.imp-t b', x.closest('li')).textContent = d.mem[+x.dataset.m].text; });
    const qi = $('.imp-q', box); if (qi && d.qf){ qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); d.qf = false; }
    sum();
  }
  function sum(){
    const d = data, nC = d.chats.filter(c => c.on).length, nM = d.mem.filter(m => m.on).length, nOld = d.chats.filter(c => c.old).length;
    const pl = (n, a, b) => n + ' ' + (n === 1 ? a : b);
    $('.imp-sum', o).textContent = impL('Encontré ' + pl(d.chats.length, 'chat', 'chats') + ' y ' + pl(d.mem.length, 'cosa para recordar', 'cosas para recordar') + '.', 'I found ' + pl(d.chats.length, 'chat', 'chats') + ' and ' + pl(d.mem.length, 'thing to remember', 'things to remember') + '.')
      + (nOld ? impL(' ' + nOld + ' ya los habías traído.', ' ' + nOld + ' you had already imported.') : '') + (d.bad.length ? impL(' No pude leer: ' + d.bad.join(', ') + '.', " Couldn't read: " + d.bad.join(', ') + '.') : '');
    const go = $('[data-imp="go"]', o), over = nC > IMP_MAX || nM > d.free;
    go.disabled = (!nC && !nM) || over;
    go.textContent = nC > IMP_MAX ? impL('Máximo ' + IMP_MAX + ' chats por vez', 'Up to ' + IMP_MAX + ' chats at a time') : nM > d.free ? impL('Solo caben ' + d.free + ' recuerdos', 'Only ' + d.free + ' memories fit')
      : !nC && !nM ? impL('Marca algo para traer', 'Pick something to bring') : impL('Traer ', 'Bring ') + [nC ? pl(nC, 'chat', 'chats') : '', nM ? pl(nM, impL('recuerdo', 'memory'), impL('recuerdos', 'memories')) : ''].filter(Boolean).join(impL(' y ', ' and '));
  }
  function apply(){
    const d = data, chats = d.chats.filter(c => c.on && !c.old), mem = d.mem.filter(m => m.on).slice(0, d.free);
    const model = st().model.openrouter || APODEX, ids = st().impIds || [];
    let n = 0, firstKey = null;
    chats.forEach((c, i) => {
      const tid = 't' + Date.now().toString(36) + i.toString(36) + Math.random().toString(36).slice(2, 5);
      st().chats['openrouter::' + model + '::' + tid] = c.msgs.map(m => ({ role:m.role, content:m.content }));
      const e = thMeta(model, tid, true); e.title = (c.title || (c.msgs.find(m => m.role === 'user') || { content:'' }).content).replace(/\s+/g, ' ').trim().slice(0, 60) || impL('Conversación importada', 'Imported conversation');
      e.t = c.t || Date.now() - i; e.manual = true; e.imp = c.src;
      ids.push(c.id); n++; if (!firstKey) firstKey = { model, id:tid };
    });
    st().impIds = ids.slice(-3000);
    save();
    let k = 0; mem.forEach(m => { if (SZ.memAddCore(m.text)) k++; });
    last = firstKey; renderChats(true);
    $('.imp-done h3', o).textContent = impL('¡Listo! Ya están aquí', 'Done! They are here');
    $('.imp-done .imp-sub', o).textContent = [n ? impL(n + (n === 1 ? ' chat quedó' : ' chats quedaron') + ' en tu lista de la izquierda, para seguirlos con cualquier IA.', n + (n === 1 ? ' chat is' : ' chats are') + ' in your list on the left, ready to continue with any AI.') : '', k ? impL(k + (k === 1 ? ' cosa nueva' : ' cosas nuevas') + ' en «Lo que recuerdo de ti».', k + (k === 1 ? ' new thing' : ' new things') + ' in «What I remember about you».') : ''].filter(Boolean).join(' ');
    $('[data-imp="open"]', o).hidden = !last;
    step(3);
  }
  o.addEventListener('change', e => {
    if (e.target.id === 'impFile'){ const fs = [...e.target.files]; e.target.value = ''; if (fs.length) read(() => IMP.parseFiles(fs)); return; }
    const c = e.target.closest('[data-c]'), m = e.target.closest('[data-m]');
    if (c){ const x = data.chats.find(cc => cc.id === c.dataset.c); if (x) x.on = c.checked; sum(); paintAll(); }
    if (m){ data.mem[+m.dataset.m].on = m.checked; sum(); paintAll(); }
  });
  const paintAll = () => { const nC = data.chats.some(c => c.on), nM = data.mem.some(m => m.on); const a = $('[data-imp="allc"]', o), b = $('[data-imp="allm"]', o); if (a) a.textContent = nC ? impL('Ninguno', 'None') : impL('Todos', 'All'); if (b) b.textContent = nM ? impL('Ninguno', 'None') : impL('Todos', 'All'); };
  o.addEventListener('input', e => { if (e.target.classList.contains('imp-q')){ data.q = e.target.value; data.qf = true; paint(); } });
  o.addEventListener('click', e => {
    const b = e.target.closest('[data-imp]'); if (!b) return; const a = b.dataset.imp;
    if (a === 'close') close();
    else if (a === 'paste'){ const t = $('#impTxt', o).value; if (!t.trim()){ $('#impTxt', o).focus(); return; } read(async () => { const r = IMP.parseText(t, 'pegado.txt'); return { chats:r.chats, mem:r.mem, bad:[] }; }); }
    else if (a === 'back') step(1);
    else if (a === 'go') apply();
    else if (a === 'allc'){ const on = !data.chats.some(c => c.on); data.chats.filter(c => !c.old).forEach((c, i) => { c.on = on && i < IMP_MAX; }); paint(); }
    else if (a === 'allm'){ const on = !data.mem.some(m => m.on); data.mem.forEach((m, i) => { m.on = on && i < data.free; }); paint(); }
    else if (a === 'open' && last){ const l = last; close(); setTimeout(() => openThread(l.model, l.id), 250); }
  });
  /* arrastrar y soltar */
  const drop = $('.imp-drop', o);
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('over')));
  drop.addEventListener('drop', e => { e.preventDefault(); const fs = [...(e.dataTransfer && e.dataTransfer.files || [])]; if (fs.length) read(() => IMP.parseFiles(fs)); });
  setTimeout(() => { const h = $('#impT', o); if (h){ h.tabIndex = -1; h.focus({ preventScroll:true }); } }, 60);
}
if (IMP_ON){
  SZ.importOpen = impOpen;
  SZ.cfgLinks.unshift(['Importar de otra IA', () => impOpen(), 'Trae tus chats y lo que recuerda ChatGPT, Claude u otra']);
}
// Hecho por: integrador (Claude). Punto de conexión que HERRAMIENTAS pidió: window.ALIAS_DEPS.
// v4.6 · A.L.I.A.S. ya no tiene página: su motor (16p–16u) viaja dentro de chat.js y lo usa 16w-alias-en-chat.js. Usa los mismos
// endpoints y la misma sesión que el chat:
//   token   -> localStorage "synthz:sess" (lo mismo que manda el chat en Authorization: Bearer)
//   buscar  -> POST /api/ai {action:"search"}   (Tavily/Exa/Wikipedia, con su propio límite)
//   imagen  -> POST /api/ai {action:"image"}    (requiere cuenta; límite diario propio)
//   memoria -> SOLO LECTURA de "synthz:v1".mem  (escribir desde aquí pisaría el guardado del chat y su sincronía)
(function () {
  'use strict';
  var A = (window.ALIAS = window.ALIAS || {});
  function token() { try { return localStorage.getItem('synthz:sess') || ''; } catch (e) { return ''; } }
  async function ai(body) {
    var h = { 'Content-Type': 'application/json' }, tk = token();
    if (tk) h.Authorization = 'Bearer ' + tk;
    var r = await fetch('/api/ai', { method: 'POST', headers: h, body: JSON.stringify(body) });
    var j = null; try { j = await r.json(); } catch (e) {}
    if (!r.ok || !j) throw new Error((j && (j.error || j.message)) || ((window.t && window.t('alias_err_server')) || 'error'));
    return j;
  }
  window.ALIAS_DEPS = window.ALIAS_DEPS || {
    getToken: token,
    lang: function () { var U = window.AliasUI; return (U && U.lang) || document.documentElement.lang || 'es'; },
    search: async function (q) {
      var j = await ai({ action: 'search', q: String(q).slice(0, 300) }), res = Array.isArray(j.results) ? j.results : [];
      return {
        text: res.map(function (x) { return (x.t || x.u) + (x.s ? ': ' + x.s : ''); }).join('\n'),
        sources: res.map(function (x) { return { title: x.t || x.u, url: x.u }; })
      };
    },
    image: async function (prompt) { var j = await ai({ action: 'image', prompt: prompt }); return { url: j.img }; },
    loadPptx: function () {
      return new Promise(function (ok, no) {
        if (window.PptxGenJS) return ok();
        var s = document.createElement('script'); s.src = 'lib/pptxgen.bundle.js';
        s.onload = function () { window.PptxGenJS ? ok() : no(new Error('pptx')); }; s.onerror = function () { no(new Error('pptx')); };
        document.head.appendChild(s);
      });
    },
    memoryGet: function () {
      try {
        var m = (JSON.parse(localStorage.getItem('synthz:v1')) || {}).mem;
        return m && m.on !== false && Array.isArray(m.items) ? m.items.map(function (x) { return x && x.text; }).filter(Boolean) : [];
      } catch (e) { return []; }
    }
    /* memoryAdd: a propósito no existe; ver arriba. */
  };
})();
// Hecho por: HERRAMIENTAS
// Herramienta de búsqueda con fuentes. Reutiliza la búsqueda existente vía window.ALIAS_DEPS.search.
(function () {
  'use strict';
  var A = (window.ALIAS = window.ALIAS || {});
  A.tools = A.tools || {};

  function T(k) {
    try {
      if (A.t) return A.t(k);
      if (typeof window.t === 'function') return window.t(k);
    } catch (e) {}
    return k;
  }
  function lang() {
    var d = window.ALIAS_DEPS || {};
    try { if (typeof d.lang === 'function') return d.lang(); } catch (e) {}
    return (A.lang && A.lang()) || document.documentElement.lang || 'es';
  }
  function normSources(s) {
    if (!Array.isArray(s)) return [];
    return s
      .map(function (x) { return { title: String((x && (x.title || x.name)) || (x && x.url) || ''), url: String((x && x.url) || '') }; })
      .filter(function (x) { return /^https?:\/\//i.test(x.url); });
  }

  A.tools.search = async function (q) {
    q = String(q || '').trim();
    if (!q) throw new Error(T('alias_err_empty'));
    var d = window.ALIAS_DEPS || {};
    if (typeof d.search !== 'function') throw new Error(T('alias_err_nosearch'));
    var r = await d.search(q, lang());
    if (typeof r === 'string') return { text: r, sources: [] };
    r = r || {};
    return { text: String(r.text || r.answer || ''), sources: normSources(r.sources) };
  };
})();
// Hecho por: HERRAMIENTAS
// Genera archivos en el navegador: pptx (PptxGenJS), txt y código. Devuelve {name,mime,blobUrl}.
(function () {
  'use strict';
  var A = (window.ALIAS = window.ALIAS || {});
  A.tools = A.tools || {};

  var PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  var MIMES = {
    txt: 'text/plain', md: 'text/markdown', js: 'text/javascript', mjs: 'text/javascript',
    ts: 'text/plain', py: 'text/x-python', html: 'text/html', css: 'text/css',
    json: 'application/json', csv: 'text/csv', xml: 'application/xml', sql: 'text/plain',
    java: 'text/plain', c: 'text/plain', cpp: 'text/plain', cs: 'text/plain',
    go: 'text/plain', rs: 'text/plain', php: 'text/plain', sh: 'text/plain'
  };

  function T(k) {
    try {
      if (A.t) return A.t(k);
      if (typeof window.t === 'function') return window.t(k);
    } catch (e) {}
    return k;
  }
  function cleanName(n) {
    return String(n || '').replace(/[\\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 100);
  }
  function ext(n) {
    var m = /\.([a-z0-9]+)$/i.exec(n);
    return m ? m[1].toLowerCase() : '';
  }

  // Convierte el contenido a {title, slides:[{title,bullets[],notes}]}
  function parseDeck(content) {
    var data = null;
    try { data = JSON.parse(content); } catch (e) {}
    if (data) {
      /* acepta {title,slides:[{title,bullets,notes}]} y el formato del servidor {titulo,subtitulo,diapositivas:[{titulo,puntos,notas}]} */
      var arr = Array.isArray(data) ? data : (data.slides || data.diapositivas);
      if (Array.isArray(arr)) {
        return {
          title: Array.isArray(data) ? '' : String(data.title || data.titulo || ''),
          slides: arr.map(function (s) {
            var b = s.bullets || s.puntos || s.points || s.content || [];
            if (typeof b === 'string') b = b.split('\n');
            return { title: String(s.title || s.titulo || ''), bullets: b.map(String).filter(Boolean), notes: String(s.notes || s.notas || '') };
          })
        };
      }
    }
    var deck = { title: '', slides: [] };
    var cur = null;
    String(content).split(/\r?\n/).forEach(function (line) {
      var h = /^(#{1,2})\s+(.*)$/.exec(line);
      if (h) {
        if (h[1] === '#' && !deck.title && !deck.slides.length) { deck.title = h[2].trim(); return; }
        cur = { title: h[2].trim(), bullets: [], notes: '' };
        deck.slides.push(cur);
        return;
      }
      if (!cur) { cur = { title: '', bullets: [], notes: '' }; deck.slides.push(cur); }
      var n = /^>\s?(.*)$/.exec(line);
      if (n) { cur.notes += (cur.notes ? '\n' : '') + n[1]; return; }
      var b = /^\s*[-*•]\s+(.*)$/.exec(line);
      if (b) cur.bullets.push(b[1].trim());
      else if (line.trim()) cur.bullets.push(line.trim());
    });
    return deck;
  }

  async function makePptx(content) {
    var d = window.ALIAS_DEPS || {};
    if (!window.PptxGenJS && typeof d.loadPptx === 'function') await d.loadPptx();
    if (!window.PptxGenJS) throw new Error(T('alias_err_pptx_lib'));
    var deck = parseDeck(content);
    if (!deck.slides.length && !deck.title) throw new Error(T('alias_err_empty'));
    var p = new window.PptxGenJS();
    p.layout = 'LAYOUT_16x9';
    if (deck.title) {
      var s0 = p.addSlide();
      s0.addText(deck.title, { x: 0.6, y: 2.0, w: 8.8, h: 1.5, fontSize: 36, bold: true, align: 'center' });
    }
    deck.slides.forEach(function (sl) {
      var s = p.addSlide();
      s.addText(sl.title || T('alias_slide_default'), { x: 0.5, y: 0.4, w: 9, h: 0.9, fontSize: 28, bold: true });
      if (sl.bullets.length) {
        s.addText(
          sl.bullets.map(function (b) { return { text: b, options: { bullet: true, breakLine: true } }; }),
          { x: 0.6, y: 1.5, w: 8.8, h: 3.8, fontSize: 18, valign: 'top' }
        );
      }
      if (sl.notes) s.addNotes(sl.notes);
    });
    return await p.write({ outputType: 'blob' });
  }

  // file({type:"pptx|txt|code", name, content}) -> {name,mime,blobUrl}
  A.tools.file = async function (o) {
    o = o || {};
    var type = String(o.type || '').toLowerCase();
    var content = String(o.content == null ? '' : o.content);
    var name = cleanName(o.name);
    if (['pptx', 'txt', 'code'].indexOf(type) < 0) throw new Error(T('alias_err_type'));
    if (!content.trim()) throw new Error(T('alias_err_empty'));
    var blob, mime;
    if (type === 'pptx') {
      if (!name) name = 'alias';
      if (ext(name) !== 'pptx') name = name.replace(/\.[a-z0-9]+$/i, '') + '.pptx';
      blob = await makePptx(content);
      mime = PPTX_MIME;
    } else {
      if (!name) name = type === 'txt' ? 'alias.txt' : '';
      if (!name) throw new Error(T('alias_err_empty'));
      if (!ext(name) && type === 'txt') name += '.txt';
      mime = MIMES[ext(name)] || 'text/plain';
      blob = new Blob([content], { type: mime + ';charset=utf-8' });
    }
    return { name: name, mime: mime, blobUrl: URL.createObjectURL(blob) };
  };
  A.tools.file.PPTX_MIME = PPTX_MIME;
})();
// Hecho por: HERRAMIENTAS
// Memoria del usuario. Reutiliza la memoria existente vía window.ALIAS_DEPS.memoryGet / memoryAdd.
// Solo guarda si el usuario ya la tiene activada (la decide la memoria existente, no esta herramienta).
(function () {
  'use strict';
  var A = (window.ALIAS = window.ALIAS || {});
  A.tools = A.tools || {};

  function T(k) {
    try {
      if (A.t) return A.t(k);
      if (typeof window.t === 'function') return window.t(k);
    } catch (e) {}
    return k;
  }

  // memory({get:true}) -> {items:[texto]}   |   memory({add:"texto"}) -> {ok:true}
  A.tools.memory = async function (o) {
    o = o || {};
    var d = window.ALIAS_DEPS || {};
    if (o.add != null) {
      var txt = String(o.add).trim().slice(0, 500);
      if (!txt) throw new Error(T('alias_err_empty'));
      if (typeof d.memoryAdd !== 'function') throw new Error(T('alias_err_nomemory'));
      await d.memoryAdd(txt);
      return { ok: true };
    }
    if (o.get) {
      if (typeof d.memoryGet !== 'function') throw new Error(T('alias_err_nomemory'));
      var r = await d.memoryGet();
      var arr = Array.isArray(r) ? r : (r && r.items) || [];
      return {
        items: arr
          .map(function (x) { return typeof x === 'string' ? x : String((x && (x.text || x.t)) || ''); })
          .filter(Boolean)
      };
    }
    throw new Error(T('alias_err_type'));
  };
})();
// Hecho por: HERRAMIENTAS
// Imágenes. Reutiliza la generación existente vía window.ALIAS_DEPS.image (respeta su límite diario).
(function () {
  'use strict';
  var A = (window.ALIAS = window.ALIAS || {});
  A.tools = A.tools || {};

  function T(k) {
    try {
      if (A.t) return A.t(k);
      if (typeof window.t === 'function') return window.t(k);
    } catch (e) {}
    return k;
  }

  // image(prompt) -> {url}
  A.tools.image = async function (prompt) {
    prompt = String(prompt || '').trim().slice(0, 800);
    if (!prompt) throw new Error(T('alias_err_prompt'));
    var d = window.ALIAS_DEPS || {};
    if (typeof d.image !== 'function') throw new Error(T('alias_err_noimage'));
    var r = await d.image(prompt);
    var url = typeof r === 'string' ? r : r && r.url;
    if (!url) throw new Error(T('alias_err_noimage'));
    return { url: String(url) };
  };
})();
// Hecho por: HERRAMIENTAS
// window.ALIAS.plan / runStep: POST /api/alias con token del usuario, timeout 60 s, 1 reintento.
(function () {
  'use strict';
  var A = (window.ALIAS = window.ALIAS || {});
  A.tools = A.tools || {};

  var TIMEOUT_MS = 60000;
  var RETRY_WAIT_MS = 800;

  function T(k) {
    try {
      if (A.t) return A.t(k);
      if (typeof window.t === 'function') return window.t(k);
    } catch (e) {}
    return k;
  }
  function lang() {
    var d = window.ALIAS_DEPS || {};
    try { if (typeof d.lang === 'function') return d.lang(); } catch (e) {}
    return (A.lang && A.lang()) || document.documentElement.lang || 'es';
  }
  function headers() {
    var h = { 'Content-Type': 'application/json' };
    var d = window.ALIAS_DEPS || {};
    try {
      var extra = typeof d.authHeaders === 'function' ? d.authHeaders() : null;
      if (extra) { for (var k in extra) h[k] = extra[k]; }
      else if (typeof d.getToken === 'function') {
        var tk = d.getToken();
        if (tk) h.Authorization = 'Bearer ' + tk;
      }
    } catch (e) {}
    return h;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function once(body) {
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, TIMEOUT_MS);
    try {
      var res = await fetch('/api/alias', {
        method: 'POST', headers: headers(), body: JSON.stringify(body), signal: ctl.signal
      });
      var j = null;
      try { j = await res.json(); } catch (e) {}
      return { status: res.status, json: j };
    } finally { clearTimeout(timer); }
  }

  // Devuelve siempre {ok:true,...} o {ok:false,error,limit?}
  async function post(body) {
    body.lang = lang();
    var r, failMsg = T('alias_err_network');
    for (var i = 0; i < 2; i++) {
      try {
        r = await once(body);
        if (r.json && r.json.limit) return { ok: false, error: T('alias_err_limit'), limit: true };
        if (r.status === 429) return { ok: false, error: T('alias_err_limit'), limit: true };
        if (r.status >= 500 && i === 0) { failMsg = T('alias_err_server'); await wait(RETRY_WAIT_MS); continue; }
        if (!r.json) return { ok: false, error: T('alias_err_server') };
        return r.json;
      } catch (e) {
        failMsg = e && e.name === 'AbortError' ? T('alias_err_timeout') : T('alias_err_network');
        if (i === 0) await wait(RETRY_WAIT_MS);
      }
    }
    return { ok: false, error: failMsg };
  }

  function fill(txt, o) { return String(txt).replace(/\{(\w+)\}/g, function (m, k) { return o[k] == null ? m : o[k]; }); }
  function fail(s, e) { s.status = 'error'; s.output = ''; s.error = (e && e.message) || T('alias_err_server'); }

  // memory: lista lo que la cuenta ya guardó (solo lectura; si no hay o está apagada, lo dice sin fallar)
  // image: genera con el límite diario existente y deja un enlace local en file.blobUrl (no el base64 gigante)
  async function clientStep(s, kind, text) {
    if (kind === 'memory') {
      var items = [];
      try { items = (await A.tools.memory({ get: true })).items; } catch (e) { items = []; }
      s.output = items.length ? T('alias_mem_list') + '\n' + items.slice(0, 25).map(function (x) { return '• ' + x; }).join('\n') : T('alias_mem_empty');
      return;
    }
    try {
      var url = (await A.tools.image(text)).url;
      var blob = await (await fetch(url)).blob();
      var ext = /png/.test(blob.type) ? 'png' : /webp/.test(blob.type) ? 'webp' : 'jpg';
      s.file = { name: T('alias_img_nombre') + '.' + ext, mime: blob.type || 'image/jpeg', blobUrl: URL.createObjectURL(blob) };
      s.output = fill(T('alias_img_listo'), { prompt: text });
    } catch (e) { fail(s, e); }
  }

  /* v4.6 · enrutado con sentido: si el pedido es de verdad fácil el servidor NO arma plan y responde { ok, simple:true, to:'auto'|'superior', kind, reply }.
     opts.force = true → armar el plan igual («hazlo con A.L.I.A.S.»). */
  A.plan = async function (goal, opts) {
    goal = String(goal || '').trim().slice(0, 500);   /* mismo tope que el servidor y la pantalla */
    if (!goal) return { ok: false, error: T('alias_err_goal') };
    var body = { action: 'plan', goal: goal };
    if (opts && opts.force) body.force = true;
    var r = await post(body);
    if (!r || !r.ok) return r || { ok: false, error: T('alias_err_server') };
    if (r.simple) return r;
    var p = r.plan;
    if (!p || !Array.isArray(p.steps) || p.steps.length < 3 || p.steps.length > 7) {
      return { ok: false, error: T('alias_err_plan') };
    }
    return r;
  };

  /* v3.9 · enrutador: 👍/👎 sobre la IA que eligió para un tipo de trabajo, y lo que ha aprendido (para mostrarlo) */
  A.feedback = function (cat, model, up) { return post({ action: 'feedback', cat: cat, model: model, up: !!up }); };
  A.routes = function () { return post({ action: 'rutas' }); };

  /* v4.3 · agente que trabaja solo: la persona escribe algo con el plan en marcha y A.L.I.A.S. rehace los pasos que faltan.
     done = ids de los pasos hechos o en marcha (no se tocan). Responde { ok, steps, reply, changed }. */
  A.adjust = async function (plan, done, note) {
    note = String(note || '').trim().slice(0, 300);
    if (!note) return { ok: false, error: T('alias_err_goal') };
    var r = await post({ action: 'ajustar', plan: plan, done: Array.isArray(done) ? done : [], note: note });
    if (!r || !r.ok) return r || { ok: false, error: T('alias_err_server') };
    if (!Array.isArray(r.steps)) return { ok: false, error: T('alias_err_server') };
    return r;
  };

  /* v3.0: opts.synth === false apaga la Síntesis del paso final (por defecto está encendida) */
  A.runStep = async function (plan, stepId, prev, opts) {
    var body = { action: 'step', plan: plan, stepId: stepId, prev: Array.isArray(prev) ? prev : [] };
    if (opts && opts.synth === false) body.synth = false;
    var r = await post(body);
    if (!r || !r.ok) return r || { ok: false, error: T('alias_err_server') };
    var s = r.step;
    if (!s) return { ok: false, error: T('alias_err_server') };
    /* Los archivos del servidor (texto, código o borrador de presentación en JSON) viajan en file.text;
       la pantalla arma el .pptx al descargar. Aquí NO se crean enlaces blob para no dejarlos sin liberar. */
    /* Los pasos de memoria e imagen los resuelve el navegador: el servidor deja un marcador. */
    var mk = typeof s.output === 'string' ? /^\[\[ALIAS:(memory|image)\]\]\s*/.exec(s.output) : null;
    if (mk && s.status !== 'error') await clientStep(s, mk[1], s.output.slice(mk[0].length));
    return r;
  };
})();
/* ---------- 2026-11-10 · Quoryn (antes A.L.I.A.S.) vive DENTRO de SynthFlow: ya no tiene página propia ----------
   Sammuel (9 nov): «ALIAS ya no tiene UI: elimina esa página» y «que no te responda un simple hola ni algo muy fácil: que te mande a la
   automática o a SuperiorSynth… PERO CON SENTIDO: si en el mismo mensaje te pide algo, ahí NO te manda a otra IA».
   Con el modo «Agente» puesto (solo equipo, SZ.aliasOk()):
     · lo que escribes pasa primero por el enrutado del servidor (api/_triage.js): si es de verdad fácil («hola», «gracias», una preguntita)
       lo responde Relay (la IA Automática) o Apex (SuperiorSynth) y debajo queda «Quoryn vio que era fácil… [Hacerlo con Quoryn]»;
     · si es un pedido de verdad (aunque empiece con «hola») Quoryn arma el plan en una tarjeta dentro del chat;
     · lo apruebas UNA vez y trabaja solo (voy a continuar con…); si un paso falla lo reintenta solo con otra IA;
     · lo que escribas mientras trabaja se suma encima sin pararlo (action 'ajustar'); Detener entrega lo que alcanzó a hacer;
     · el resultado queda como un mensaje más del chat (texto, archivos y fuentes) y la conversación sigue normal.
   El motor (plan, paso, ajustar) es window.ALIAS (16p–16u). Quoryn NO tiene interfaz propia (2026-11-10, «alias ya no debe tener su propio UI»): usa solo lo normal del chat
   (la tarjeta de agente .agrun con su ícono de píxeles, los botones .btn, la nota .agkeep y los mensajes del chat); aquí solo se marcan con data-quoryn para poder encontrarlos. */
var AL = null, alPass = null, alDict = null;           /* var: renderMsgs los mira antes de que esta pieza corra */
/* function y var (no const): renderMsgs puede pintar un chat guardado antes de que esta pieza termine de correr */
function alEn(){ return !!(SZ.lang && SZ.lang() === 'en'); }
function alOn(){ return !!st().alias && !!(SZ.aliasOk && SZ.aliasOk()) && !trialOn; }
var AL_TOTAL = 9;
/* solo una marca para saber si el modo está puesto (sin estilos): body[data-quoryn="on"] */
function alMark(){ if (alOn()) document.body.dataset.quoryn = 'on'; else delete document.body.dataset.quoryn; }
var AT = {
  es: { ph:'Quoryn: dime la meta y armo el plan…', activado:'Modo Quoryn: dime la meta; si es un pedido de verdad armo el plan y trabajo solo.', apagado:'Modo Quoryn apagado.',
    planListo:'Plan listo: revísalo y apruébalo una sola vez', empiezo:'Voy a empezar con:', sigo:'Voy a continuar con:', reint:'Este paso falló; lo intento otra vez con otra IA…',
    ajustando:'Ajustando el plan con lo que pediste…', fallo:'Este paso no salió ni en el segundo intento.', limite:'Hoy se acabaron tus misiones. Vuelven mañana.',
    go:'Aprobar y empezar', no:'Descartar', stop:'Detener', retry:'Reintentar', skip:'Saltar este paso',
    ayudaPlan:'¿Quieres cambiar algo del plan? Escríbelo en la caja de abajo.', ayudaRun:'Puedes escribirme algo y lo sumo sin pararme.',
    tu:'Tú', pista:'(Inténtalo de otra forma.)', notaErr:'No pude rehacer el plan, pero lo tendré en cuenta en lo que falta.', notaOk:'Anotado. Lo tendré en cuenta en lo que falta.',
    esperaPlan:'Estoy armando el plan: espera un momento.', otroChat:'Quoryn está trabajando en otro chat. Termina o detenlo allá.', adjuntos:'Quoryn todavía no lee adjuntos: esta vez te responde la IA de siempre.',
    detenida:'Misión detenida.', descartada:'Plan descartado.', red:'No hubo conexión. Revisa tu red e inténtalo de nuevo.', mision:'misión de {n} pasos', fuentes:'Fuentes', parcial:'_Detuve la misión: esto es lo que alcancé a hacer._', vacio:'No alcancé a terminar nada. Puedes pedirme otra vez.',
    handRelay:'Quoryn vio que era algo fácil y te respondió Relay.', handApex:'Quoryn vio que era algo sencillo y te respondió Apex.', hacerlo:'Hacerlo con Quoryn',
    tool:{ search:'Buscar', file:'Archivo', memory:'Memoria', image:'Imagen', think:'Pensar' }, con:'con {n}' },
  en: { ph:'Quoryn: tell me the goal and I will make a plan…', activado:'Quoryn mode: tell me the goal; if it is a real task I make the plan and work on my own.', apagado:'Quoryn mode is off.',
    planListo:'Plan ready: look it over and approve it once', empiezo:'I am going to start with:', sigo:'I am going to continue with:', reint:'This step failed; trying again with another AI…',
    ajustando:'Adjusting the plan with what you asked…', fallo:'This step did not work, not even on the second try.', limite:'You used all of today\'s missions. They come back tomorrow.',
    go:'Approve and start', no:'Discard', stop:'Stop', retry:'Try again', skip:'Skip this step',
    ayudaPlan:'Want to change something in the plan? Write it in the box below.', ayudaRun:'You can write to me and I will add it without stopping.',
    tu:'You', pista:'(Try a different approach.)', notaErr:'I could not redo the plan, but I will keep it in mind for what is left.', notaOk:'Noted. I will keep it in mind for what is left.',
    esperaPlan:'I am making the plan: wait a moment.', otroChat:'Quoryn is working in another chat. Finish or stop it there.', adjuntos:'Quoryn does not read attachments yet: this time the usual AI answers.',
    detenida:'Mission stopped.', descartada:'Plan discarded.', red:'Couldn\'t connect. Check your network and try again.', mision:'{n}-step mission', fuentes:'Sources', parcial:'_I stopped the mission: this is what I got done._', vacio:'I did not finish anything. You can ask me again.',
    handRelay:'Quoryn saw it was easy and Relay answered.', handApex:'Quoryn saw it was simple and Apex answered.', hacerlo:'Do it with Quoryn',
    tool:{ search:'Search', file:'File', memory:'Memory', image:'Image', think:'Think' }, con:'with {n}' }
};
function alT(k, v){
  const L = AT[alEn() ? 'en' : 'es']; let s = L[k]; if (s == null) s = AT.es[k]; if (s == null) s = k;
  return typeof s === 'string' && v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] == null ? m : v[x]) : s;
}
/* el motor busca sus textos en alias-textos.json (los mismos del servidor); se baja la primera vez que se usa */
function alLoadDict(){
  if (alDict) return alDict;
  alDict = fetch('alias-textos.json', { cache:'no-cache' }).then(r => r.ok ? r.json() : {}).catch(() => ({})).then(d => { alDict = Promise.resolve(d); window.ALIAS && (window.ALIAS.dict = d); return d; });
  return alDict;
}
function alEngine(){
  const A = window.ALIAS; if (!A) return null;
  if (!A.chatReady){
    A.chatReady = true;
    A.t = k => { const d = A.dict || {}, l = alEn() ? 'en' : 'es'; return (d[l] && d[l][k]) || (d.es && d.es[k]) || k; };
    A.lang = () => alEn() ? 'en' : 'es';
    const D = window.ALIAS_DEPS; if (D) D.lang = () => alEn() ? 'en' : 'es';
    alLoadDict();
  }
  return A;
}

/* ---------- el modo «Agente» ---------- */
function setAlias(on){
  on = !!on;
  if (!!st().alias === on) return;
  if (on){ if (agentOn()) setAgent(false); if (imgMode) setImgMode(false); if (mode !== 'solo') setMode('solo'); alEngine(); }
  st().alias = on; save();
  alMark();
  try{ inp.placeholder = on ? alT('ph') : 'Escribe tu mensaje…'; }catch(e){}
  toast(alT(on ? 'activado' : 'apagado'));
  if (on) setTimeout(() => { try{ inp.focus(); }catch(e){} }, 50);
  else alDrop(false);
}
alMark();
/* desde la portada (modo Agente) y desde los enlaces viejos de /alias: ?quoryn=1 (o ?alias=1) deja puesto el modo, y ?q= lo manda.
   Si la llave del equipo (synthz:alias) todavía no se conoce en este aparato, se espera a que el servidor la confirme. */
var alQuiere = params.get('quoryn') === '1' || params.get('alias') === '1';
function alQuiero(){ if (!alQuiere || !(SZ.aliasOk && SZ.aliasOk()) || trialOn) return; alQuiere = false; try{ setAlias(true); }catch(e){} }
addEventListener('synthz-alias', () => { alMark(); setTimeout(alQuiero, 0); });
setTimeout(alQuiero, 0);

/* ---------- lo que escribes en modo Agente ---------- */
async function aliasSend(text){
  const A = alEngine(); if (!A){ toast(alT('red')); return; }
  const here = chatArr();
  if (AL){
    if (AL.chat !== here){ toast(alT('otroChat')); return; }
    if (AL.phase === 'planning'){ toast(alT('esperaPlan')); return; }
    inp.value = ''; autoGrow(); updateHint();
    return alSteer(AL, text);
  }
  /* «hi», «ok», «sí»: no hace falta ni preguntarle al servidor */
  if (text.length < 3){ alPass = { to:'auto', kind:'saludo', t:Date.now() }; try{ await send(); }finally{ alPass = null; } return; }
  return alMission(text, {});
}
async function alMission(text, o){
  const A = alEngine(); if (!A) return;
  if (AL) alDrop(false);
  const chat = chatArr(); let msg = null;
  if (o.push !== false){
    msg = { role:'user', content:text }; chat.push(msg);
    inp.value = ''; autoGrow(); updateHint(); touchThread(); save(); renderMsgs();
  }
  const S = AL = { goal:text, chat, msg, phase:'planning', plan:null, status:{}, results:{}, errors:{}, skipped:{}, retried:{}, notes:[], log:[], run:0, t0:0, adjusting:null, cur:null, retrying:null, say:'' };
  S.el = document.createElement('div'); S.el.className = 'agrun'; S.el.dataset.quoryn = 'card'; S.el.setAttribute('aria-live', 'polite');
  const fr = () => { try{ return (window.SZFrases && window.SZFrases.frase('agente', alEn() ? 'en' : 'es')) || ''; }catch(e){ return ''; } };
  S.say = fr(); S.tm = setInterval(() => { if (AL !== S || S.phase !== 'planning'){ clearInterval(S.tm); return; } S.say = fr(); const sm = $('.ag-t small', S.el); if (sm) sm.textContent = S.say + '…'; }, 2800);
  if (chat === chatArr()) lane.appendChild(S.el);
  alPaint(S); jump();
  let r; try{ r = await A.plan(text, { force:!!o.force }); }catch(e){ r = { ok:false, error:alT('red') }; }
  clearInterval(S.tm);
  if (AL !== S) return;
  /* ¿era de verdad fácil? el servidor lo dijo: lo responde Relay o Apex, sin plan */
  if (r && r.ok && r.simple){ return alHandoff(S, r, text); }
  if (!r || !r.ok){
    alClear(S);
    if (msg && chat[chat.length - 1] === msg){ chat.pop(); save(); }
    if (chat === chatArr()){ renderMsgs(); if (msg){ inp.value = text; autoGrow(); updateHint(); } showErr({ message:(r && r.error) || alT('red'), limit:!!(r && r.limit) }); }
    return;
  }
  try{ localStorage.setItem('synthz:sent', String(sentN() + 1)); }catch(e){}
  const steps = (r.plan.steps || []).filter(s => s && s.id != null).map(alClean);
  S.plan = Object.assign({}, r.plan, { steps }); S.phase = 'plan'; alPaint(S); if (chat === chatArr()) follow();
}
const alClean = s => ({ id:s.id, title:String(s.title || ''), tool:s.tool, input:s.input });
/* lo fácil: se saca la pregunta del chat y se manda por el camino de siempre, pero con Relay (Automática) o Apex (SuperiorSynth) */
function alHandoff(S, r, text){
  const chat = S.chat;
  if (S.msg && chat[chat.length - 1] === S.msg){ chat.pop(); save(); }
  alClear(S);
  if (chat !== chatArr()) return;
  inp.value = text; autoGrow(); updateHint();
  alPass = { to:r.to === 'superior' ? 'superior' : 'auto', kind:r.kind, t:Date.now() };
  renderMsgs();
  Promise.resolve(send()).finally(() => { alPass = null; });
}
/* el chip que queda debajo de lo que escribiste: qué IA lo respondió y cómo hacerlo con Quoryn igual */
function alHandEl(m){
  const el = document.createElement('div'); el.className = 'agkeep'; el.dataset.quoryn = 'hand'; el._q = m.content;
  el.innerHTML = '<span></span><div class="agk-b"><button type="button" class="btn sm ghost" data-alforce="1"></button></div>';
  $('span', el).textContent = alT(m.alHand === 'superior' ? 'handApex' : 'handRelay'); $('button', el).textContent = alT('hacerlo');
  return el;
}
function alWho(b, m){
  const n = $('.who b', b), md = $('.who .md', b); if (n) n.textContent = 'Quoryn'; if (md) md.textContent = alT('mision', { n:(m.alias && m.alias.n) || '' });
  b.dataset.quoryn = 'msg';
}
const alPlace = () => { try{ if (alOn()) inp.placeholder = alT('ph'); }catch(e){} };
function alClear(S){ clearInterval(S.tm); S.run++; if (S.el) S.el.remove(); if (AL === S) AL = null; alPlace(); }
function alDrop(restore){
  const S = AL; if (!S) return; const chat = S.chat;
  alClear(S);
  if (restore && S.msg && chat[chat.length - 1] === S.msg){ chat.pop(); save(); if (chat === chatArr()){ renderMsgs(); inp.value = S.goal; autoGrow(); updateHint(); } }
}

/* ---------- la tarjeta ---------- */
const alFin = (S, id) => S.status[id] === 'done' || !!S.skipped[id];
function alPaint(S){
  const el = S.el; if (!el) return;
  const steps = S.plan ? S.plan.steps : [], done = steps.filter(s => alFin(S, s.id)).length, total = steps.length, p = S.phase;
  const cur = steps.find(s => !alFin(S, s.id)), n = cur ? steps.indexOf(cur) + 1 : total;
  let say = '';
  if (p === 'planning') say = (S.say || '') + '…';
  else if (p === 'plan') say = alT('planListo');
  else if (p === 'run') say = S.retrying != null ? alT('reint') : S.adjusting ? alT('ajustando') : cur ? alT(done ? 'sigo' : 'empiezo') + ' ' + cur.title : '';
  else if (p === 'error') say = alT('fallo');
  else if (p === 'limit') say = alT('limite');
  /* misma tarjeta que Apex: ícono de píxeles, título, lista de pasos y botones normales */
  let h = '<div class="ag-h"><span class="pxw" aria-hidden="true">' + SZ.pixelGrid() + '</span><span class="ag-t"><b>Quoryn</b><small>' + esc(say) + '</small></span></div>';
  if (steps.length){
    h += '<ol class="ag-s">' + steps.map(s => {
      const r = S.results[s.id], cls = S.skipped[s.id] ? 'done skip' : S.status[s.id] === 'done' ? 'done' : S.status[s.id] === 'running' ? 'on' : S.status[s.id] === 'error' ? 'bad' : '';
      const who = r && r.route ? (r.route.why === 'synth' && r.route.voices && r.route.voices.length ? r.route.voices.join(', ') : r.route.name) : '';
      return '<li class="' + cls + '"><i aria-hidden="true"></i><span>' + esc(s.title) + ' <small>· ' + esc(alT('tool')[s.tool] || s.tool) + (who ? ' · ' + esc(alT('con', { n:who })) : '') + '</small></span></li>';
    }).join('') + '</ol>';
  }
  if (S.log.length) h += '<div data-quoryn="log">' + S.log.slice(-4).map(x => '<p>' + (x.k === 'me' ? '<b>' + esc(alT('tu')) + ':</b> ' : '') + esc(x.text) + '</p>').join('') + '</div>';
  const btn = (a, k, ghost) => '<button type="button" class="btn sm' + (ghost ? ' ghost' : '') + '" data-al="' + a + '">' + esc(alT(k)) + '</button>';
  if (p === 'plan') h += '<div class="agk-b">' + btn('go', 'go') + btn('no', 'no', 1) + '</div><small>' + esc(alT('ayudaPlan')) + '</small>';
  else if (p === 'error') h += '<div class="agk-b">' + btn('retry', 'retry') + btn('skip', 'skip', 1) + btn('stop', 'stop', 1) + '</div>' + (S.errors[S.cur] ? '<small>' + esc(S.errors[S.cur]) + '</small>' : '');
  else if (p === 'limit') h += '<div class="agk-b">' + btn('stop', 'stop', 1) + '</div>';
  else if (p === 'run') h += '<div class="agk-b">' + btn('stop', 'stop', 1) + '</div><small>' + esc(alT('ayudaRun')) + '</small>';
  el.innerHTML = h; el.dataset.phase = p;
  try{ inp.placeholder = p === 'run' || p === 'plan' ? (p === 'run' ? alT('ayudaRun') : alT('ayudaPlan')) : alT('ph'); }catch(e){}
  if (S.chat === chatArr()) follow();
}
lane.addEventListener('click', ev => {
  const f = ev.target.closest('[data-alforce]');
  if (f){ const c = f.closest('[data-quoryn="hand"]'); if (c && c._q && !AL) alMission(c._q, { force:true, push:false }); return; }
  const b = ev.target.closest('[data-al]'); if (!b || !AL || !AL.el || !AL.el.contains(b)) return;
  const S = AL, a = b.dataset.al;
  if (a === 'go'){ if (S.phase === 'plan' && S.plan && S.plan.steps.length){ S.t0 = Date.now(); alDrive(S, false); } }
  else if (a === 'no'){ alDrop(true); toast(alT('descartada')); }
  else if (a === 'stop'){ alStop(S); }
  else if (a === 'retry'){ const st = S.plan.steps.find(s => S.status[s.id] === 'error'); if (st){ delete S.status[st.id]; delete S.errors[st.id]; } alDrive(S, true); }
  else if (a === 'skip'){ const st = S.plan.steps.find(s => S.status[s.id] === 'error'); if (st){ S.skipped[st.id] = true; delete S.status[st.id]; delete S.errors[st.id]; } alDrive(S, false); }
});

/* ---------- trabajar solo ---------- */
const alPlanOut = (S, hintId) => ({ id:S.plan.id, goal:S.plan.goal, notes:S.notes.slice(-6),
  steps:S.plan.steps.map(s => { const c = alClean(s); if (hintId != null && String(s.id) === String(hintId)) c.input = ((c.input || '') + ' ' + alT('pista')).trim(); return c; }) });
async function alExec(S, st, hint){
  const A = window.ALIAS, i = S.plan.steps.findIndex(s => String(s.id) === String(st.id));
  const prev = S.plan.steps.slice(0, i).map(s => S.results[s.id]).filter(Boolean);
  let r; try{ r = await A.runStep(alPlanOut(S, hint ? st.id : null), st.id, prev, {}); }catch(e){ return { err:alT('red') }; }
  if (!r || !r.ok) return { err:(r && r.error) || alT('red'), limit:!!(r && r.limit) };
  const sp = r.step || {}; if (sp.status === 'error') return { err:sp.error || alT('red') };
  return { step:sp };
}
async function alDrive(S, hint){
  if (S.running) return;
  const my = ++S.run, dead = () => AL !== S || S.run !== my;
  S.running = true; S.phase = 'run'; S.retrying = null; alPaint(S);
  while (!dead()){
    if (S.adjusting){ await S.adjusting; if (dead()) break; }
    const st = S.plan.steps.find(s => !alFin(S, s.id));
    if (!st){ S.running = false; return alFinish(S, false); }
    S.cur = st.id; S.status[st.id] = 'running'; S.retrying = null; delete S.errors[st.id]; alPaint(S);
    const out = await alExec(S, st, hint); hint = false;
    if (dead()) break;
    if (out.limit){ S.status[st.id] = 'pending'; S.phase = 'limit'; S.running = false; alPaint(S); return; }
    if (out.err){
      /* primera vez: lo vuelve a intentar solo (el enrutador cambia de IA); a la segunda, pregunta */
      if (!S.retried[st.id]){ S.retried[st.id] = true; S.retrying = st.id; hint = true; alPaint(S); continue; }
      S.retrying = null; S.status[st.id] = 'error'; S.errors[st.id] = out.err; S.phase = 'error'; S.running = false; alPaint(S); return;
    }
    S.status[st.id] = 'done'; S.results[st.id] = out.step; S.retrying = null; alPaint(S);
  }
  if (AL === S && S.run === my) S.running = false;
}
async function alSteer(S, raw){
  const text = String(raw || '').trim().slice(0, 300); if (!text || !S.plan || S.adjusting) return;
  const A = window.ALIAS;
  S.log.push({ k:'me', text }); S.notes = S.notes.concat(text).slice(-6);
  const fixed = S.plan.steps.filter(s => alFin(S, s.id) || S.status[s.id] === 'running' || S.status[s.id] === 'error').map(s => s.id);
  let r = null;
  S.adjusting = (async () => { try{ r = A && typeof A.adjust === 'function' ? await A.adjust(alPlanOut(S), fixed, text) : null; }catch(e){ r = null; } })();
  alPaint(S);
  await S.adjusting;
  if (AL !== S) return;
  if (r && r.ok && r.changed && Array.isArray(r.steps) && r.steps.length){
    const keep = S.plan.steps.filter(s => fixed.includes(s.id)), room = Math.max(0, AL_TOTAL - keep.length);
    S.plan.steps.filter(s => !fixed.includes(s.id)).forEach(s => { delete S.status[s.id]; delete S.results[s.id]; delete S.errors[s.id]; delete S.skipped[s.id]; });
    S.plan.steps = keep.concat(r.steps.slice(0, room).map(alClean));
  }
  S.adjusting = null;
  S.log.push({ k:'al', text:r && r.ok ? (r.reply || alT('notaOk')) : r && r.limit ? alT('limite') : alT('notaErr') });
  alPaint(S);
}
function alStop(S){
  S.run++; S.running = false; S.adjusting = null;
  S.plan && S.plan.steps.forEach(s => { if (S.status[s.id] === 'running') delete S.status[s.id]; });
  if (!S.plan || !Object.keys(S.results).length){ alDrop(true); toast(alT('detenida')); return; }
  alFinish(S, true);
}

/* ---------- el resultado: un mensaje más del chat ---------- */
const alSafeUrl = u => { try{ const x = new URL(String(u), location.href); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : ''; }catch(e){ return ''; } };
function alFinish(S, stopped){
  const done = S.plan.steps.filter(s => S.results[s.id]);
  const last = done.slice().reverse().find(s => String(S.results[s.id].output || '').trim());
  const seen = new Set(), sources = [], files = [];
  done.forEach(s => {
    const r = S.results[s.id];
    (Array.isArray(r.sources) ? r.sources : []).forEach(x => { const u = x && alSafeUrl(x.url); if (!u || seen.has(u)) return; seen.add(u); sources.push({ url:u, title:String(x.title || u).replace(/[\[\]]/g, '') }); });
    if (r.file && r.file.name && r.file.text != null) files.push(r.file);
  });
  let content = last ? String(S.results[last.id].output).trim() : alT('vacio');
  if (stopped) content = alT('parcial') + '\n\n' + content;
  files.reverse().forEach(f => {
    const ext = (String(f.name).split('.').pop() || 'txt').toLowerCase(), isDeck = /"diapositivas"/.test(String(f.text)) || /\.pptx$/i.test(f.name);
    const body = String(f.text).replace(/```/g, "'''");
    content += '\n\n' + (isDeck ? '' : '**' + String(f.name).replace(/[*`]/g, '') + '**\n\n') + '```' + (isDeck ? 'json' : (/^[a-z0-9]{1,6}$/.test(ext) ? ext : 'txt')) + '\n' + body + '\n```';
  });
  if (sources.length) content += '\n\n**' + alT('fuentes') + '**\n' + sources.map(x => '- [' + x.title + '](' + x.url + ')').join('\n');
  const chat = S.chat, msg = { role:'assistant', content, model:selId(), alias:{ n:S.plan.steps.length, secs:S.t0 ? Math.round((Date.now() - S.t0) / 1000) : 0 } };
  clearInterval(S.tm); S.run++; S.running = false; S.phase = 'done';
  if (S.el) S.el.remove(); if (AL === S) AL = null; alPlace();
  chat.push(msg); save();
  if (chat === chatArr()){ renderMsgs(); jump(); }
}
/* ---------- 2026-11-09 · aviso grande al elegir una IA de alto consumo (pedido de Sammuel) ----------
   «Que cada vez que elijan modelos de alto consumo, como Claude Fable, les salte un anuncio gigante que les avise».
   Sale cada vez que eliges a mano una de esas IAs (antes era un aviso chiquito, una vez por visita). No bloquea:
   «Usarla igual» la deja elegida y «Elegir otra» vuelve a la lista. Habla de EnerX, nunca de mensajes. ES/EN. */
const PT_CARAS = /claude|fable|opus|sonnet|gpt-5|gpt-4\.5|\bo1\b|\bo3\b|o1-pro|o3-pro|grok-4|gemini[- ]?(2\.5|3)[- ]?pro|deep[- ]?research/i;
function ptEsCara(mm){ return !!mm && !mm.free && (mm.spend === 3 || PT_CARAS.test((mm.id || '') + ' ' + (mm.name || ''))); }
function ptAvisoConsumo(mm, alVolver){
  if (!mm || document.getElementById('ptAviso')) return;
  const en = SZ.lang && SZ.lang() === 'en';
  const T = en
    ? { k:'HEADS UP · HIGH-CONSUMPTION AI', t:mm.name + ' uses a lot of energy', p:'It is one of the most powerful AIs, so each answer spends much more EnerX (or credit on your own key) than a normal one. Use it for hard tasks; for simple things, Auto picks a lighter AI and your energy lasts longer.', si:'Use it anyway', no:'Pick another AI' }
    : { k:'OJO · IA DE ALTO CONSUMO', t:mm.name + ' gasta mucha energía', p:'Es de las IAs más potentes, así que cada respuesta gasta mucha más EnerX (o saldo de tu llave) que una normal. Úsala para tareas difíciles; para lo sencillo, Auto elige una IA más liviana y tu energía te dura más.', si:'Usarla igual', no:'Elegir otra IA' };
  const o = document.createElement('div');
  o.id = 'ptAviso'; o.className = 'pt-aviso'; o.setAttribute('role', 'alertdialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'ptAvisoT');
  o.innerHTML = '<div class="pt-av-card"><div class="pt-av-bat" aria-hidden="true"><i></i></div><p class="pt-av-k">' + esc(T.k) + '</p><h2 id="ptAvisoT">' + esc(T.t) + '</h2><p class="pt-av-p">' + esc(T.p) + '</p>'
    + '<div class="pt-av-b"><button type="button" class="pt-av-no">' + esc(T.no) + '</button><button type="button" class="pt-av-si">' + esc(T.si) + '</button></div></div>';
  const cerrar = () => { o.classList.add('fuera'); setTimeout(() => o.remove(), 220); document.removeEventListener('keydown', tecla); };
  const tecla = e => { if (e.key === 'Escape') cerrar(); };
  o.addEventListener('click', e => {
    if (e.target === o || e.target.closest('.pt-av-si')) cerrar();
    else if (e.target.closest('.pt-av-no')){ cerrar(); if (typeof alVolver === 'function') setTimeout(alVolver, 240); }
  });
  document.addEventListener('keydown', tecla);
  document.body.appendChild(o);
  setTimeout(() => { const b = o.querySelector('.pt-av-si'); if (b) b.focus(); }, 60);
}
/* ---------- 2026-11-09 · rediseño «Partitura»: el selector de 4 modos en la caja de escribir ----------
   Sammuel: «hay muchas IAs, el modo auto, comparar y Quoryn: ¿cómo se va a elegir?». Respuesta concreta, siempre a la vista:
     Auto      Sinapse elige la IA para cada pedido (y dice cuál usó).            → applyMode('auto')
     Una IA    tú eliges de la lista con buscador; abajo se ve cuál tienes.          → applyMode('chat') + abre la lista
     Comparar  2 a 3 IAs lado a lado; te quedas con la mejor.                         → cmpOpen()
     Agente    Quoryn (antes A.L.I.A.S.): arma un plan, lo apruebas una vez y trabaja solo → setAlias(true), dentro del chat (16w)
               v4.5: solo para el equipo (SZ.aliasOk()); los demás ven 3 modos. Se repinta si cambia (evento synthz-alias).
   Y el esfuerzo, al lado: Auto · Veloz · Profundo · Creativo (los niveles de v4.3, Profundo pide cuenta) · Apex (el agente de Sonyx elige la IA y mejora tu pedido).
   Reemplaza a los botones «Modo», «Esfuerzo» y «Comparar con otra IA», que se esconden con CSS (siguen en el DOM para el motor). */
(function partituraSelector(){
  const row = $('#cPickRow'); if (!row || $('#ptModos')) return;
  const en = () => SZ.lang && SZ.lang() === 'en';
  const T = () => en()
    ? { modos:{ auto:'Relay', una:'One AI', cmp:'Compare', agente:'Agent' }, esf:['Flow', 'Fragment', 'Focus', 'Horizon', 'Apex'], modo:'Mode', esfuerzo:'Effort',
        ayuda:{ auto:'Sinapse picks the AI for each request and tells you which one.', una:'You pick the AI from the list.', cmp:'Several AIs answer side by side. Keep the best one.', agente:'Quoryn makes a plan, you approve it once and it works on its own.' } }
    : { modos:{ auto:'Relay', una:'Una IA', cmp:'Comparar', agente:'Agente' }, esf:['Flow', 'Fragment', 'Focus', 'Horizon', 'Apex'], modo:'Modo', esfuerzo:'Esfuerzo',
        ayuda:{ auto:'Sinapse elige la IA para cada pedido y te dice cuál usó.', una:'Tú eliges la IA de la lista.', cmp:'Varias IAs responden lado a lado. Te quedas con la mejor.', agente:'Quoryn arma un plan, lo apruebas una vez y trabaja solo.' } };
  const MODOS_TODOS = ['auto', 'una', 'cmp', 'agente'];
  const modos = () => MODOS_TODOS.filter(k => k !== 'agente' || (SZ.aliasOk && SZ.aliasOk()));
  const actual = () => mode === 'cmp' ? 'cmp' : alOn() ? 'agente' : selId() === 'sz:auto' && !agentOn() ? 'auto' : 'una';
  const NIV = ['auto', 'fast', 'deep', 'creative'], SS = NIV.length;
  const esfActual = () => agentOn() ? SS : Math.max(0, NIV.indexOf(effKey()));
  const bloqueado = i => NIV[i] === 'deep' && !SZ.ACC.ready;

  const bar = document.createElement('div');
  bar.className = 'pt-sel'; bar.id = 'ptModos';
  row.insertBefore(bar, row.firstChild);
  document.body.classList.add('pt-flow');

  function pinta(){
    const t = T(), m = actual();
    bar.innerHTML =
      '<div class="pt-m" role="radiogroup" aria-label="' + t.modo + '">' + modos().map(k => '<button type="button" role="radio" data-pm="' + k + '" aria-checked="' + (k === m) + '" title="' + esc(t.ayuda[k]) + '">' + t.modos[k] + '</button>').join('') + '</div>';
    document.body.dataset.ptModo = m;
    pintaTop();
  }
  function salirDeComparar(){ if (mode === 'cmp') setMode('solo'); }
  bar.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.pm){
      const k = b.dataset.pm;
      if (k === 'agente'){
        if (!(SZ.aliasOk && SZ.aliasOk())){ pinta(); return; }
        salirDeComparar(); setAlias(true); pinta(); return;      /* v4.6 · Quoryn vive aquí mismo: ya no abre otra página */
      }
      if (alOn()) setAlias(false);
      if (k === 'cmp'){ cmpOpen(b); setTimeout(pinta, 50); return; }
      salirDeComparar();
      if (k === 'auto'){ if (agentOn()) setAgent(false); applyMode('auto'); }
      if (k === 'una'){ if (agentOn()) setAgent(false); if (selId() === 'sz:auto') applyMode('chat'); openSide('set', b); }
      pinta(); return;
    }
  });
  /* ---------- 2026-11-10 · barra de arriba como la del demo Luma ----------
     Sammuel: migas «Espacio personal / Chat nuevo», el selector del Esfuerzo y el de la IA ARRIBA (antes iban bajo la caja), y el «+» de chat nuevo.
     Donde el demo dice «Modo oscuro» va la selección de IA. Lo demás se queda igual: abajo solo quedan Auto · Una IA · Comparar (· Agente). */
  const top = $('#top'), CAR = '<svg class="cv" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const TT = () => en()
    ? { raiz:'Personal space', nuevo:'New chat', esf:'Effort', ia:'Choose the AI', mas:'New chat', migas:'You are here',
        desc:['The AI decides how much to think.', 'Quick, short answers for everyday things.', 'Thinks it through and double-checks. Uses the most EnerX.', 'Original ideas and writing with spark.', 'The agent picks the AI and improves your request.'],
        n:['Flow', 'Fragment', 'Focus', 'Horizon', 'Apex'], cuenta:'Needs an account', cmp:'Comparing', pen:'Focus effort needs an account (signing in is free).' }
    : { raiz:'Espacio personal', nuevo:'Chat nuevo', esf:'Esfuerzo', ia:'Elegir la IA', mas:'Nuevo chat', migas:'Estás aquí',
        desc:['La IA decide cuánto pensar según tu pregunta.', 'Respuestas rápidas y cortas, para lo del día a día.', 'Piensa a fondo y revisa su respuesta. Es el que más EnerX gasta.', 'Ideas originales y textos con chispa, para crear.', 'El agente elige la IA y mejora tu pedido.'],
        n:['Flow', 'Fragment', 'Focus', 'Horizon', 'Apex'], cuenta:'Con cuenta', cmp:'Comparando', pen:'El esfuerzo Focus es para cuentas (entrar es gratis).' };
  const crumbs = document.createElement('nav'); crumbs.className = 'tb-crumbs'; crumbs.id = 'tbCrumbs';
  crumbs.innerHTML = '<span class="tb-root"></span><i aria-hidden="true">/</i><b class="tb-now" aria-current="page"></b>';
  const grp = document.createElement('div'); grp.className = 'tb-sel'; grp.id = 'tbSel';
  grp.innerHTML = '<button type="button" class="tb-b tb-eff" id="tbEff" aria-haspopup="menu" aria-expanded="false" aria-controls="tbEffMenu"><svg class="ei" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 16a8 8 0 1 1 15 0"/><path d="M12 14l3.5-4"/></svg><span class="tb-l"></span>' + CAR + '</button>'
    + '<button type="button" class="tb-b tb-ia" id="tbIA" aria-haspopup="dialog"><span class="tb-av"></span><span class="tb-l"></span>' + CAR + '</button>'
    + '<button type="button" class="tb-b tb-new" id="tbNew"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>';
  const menu = document.createElement('div'); menu.className = 'tb-menu'; menu.id = 'tbEffMenu'; menu.setAttribute('role', 'menu'); menu.hidden = true;
  const mlogo = $('#mLogo'); (mlogo || top.firstChild).after(crumbs); crumbs.after(grp); document.body.appendChild(menu);
  const eBtn = $('#tbEff', grp), iaBtn = $('#tbIA', grp);
  function threadTitle(){
    if (mode === 'cmp') return TT().cmp;
    try{ if (chatArr().length){ const x = allThreads().find(h => h.model === thModel() && h.id === curT()); if (x && x.title) return x.title; } }catch(e){}
    return TT().nuevo;
  }
  function pintaTop(){
    const t = TT(), e = esfActual(), m = mode === 'cmp' ? null : info(selId());
    $('.tb-root', crumbs).textContent = t.raiz; $('.tb-now', crumbs).textContent = threadTitle(); crumbs.setAttribute('aria-label', t.migas);
    $('.tb-l', eBtn).textContent = t.n[e]; eBtn.setAttribute('aria-label', t.esf + ': ' + t.n[e]); eBtn.title = t.esf + ': ' + t.desc[e]; eBtn.classList.toggle('on', e !== 0);
    $('.tb-l', iaBtn).textContent = m ? m.name : t.cmp; iaBtn.setAttribute('aria-label', t.ia + ': ' + (m ? m.name : t.cmp)); iaBtn.title = t.ia;
    const av0 = $('.tb-av', iaBtn); av0.innerHTML = m ? av(m, 'xs') : ''; av0.hidden = !m; if (m) iaBtn.style.setProperty('--vc', vendorColor(m.vendor));
    $('#tbNew', grp).setAttribute('aria-label', t.mas); $('#tbNew', grp).title = t.mas;
    menu.setAttribute('aria-label', t.esf);
    menu.innerHTML = t.n.map((n, i) => '<button type="button" role="menuitemradio" data-pe="' + i + '" aria-checked="' + (i === e) + '"' + (bloqueado(i) ? ' class="lk"' : '') + '><span><b>' + n + '</b><small>' + t.desc[i] + '</small></span>' + (bloqueado(i) ? '<em>' + t.cuenta + '</em>' : i === e ? '<em class="ck">✓</em>' : '') + '</button>').join('');
  }
  function colocaMenu(){ const r = eBtn.getBoundingClientRect(), w = Math.min(290, innerWidth - 16); menu.style.width = w + 'px'; menu.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px'; menu.style.top = (r.bottom + 8) + 'px'; }
  function abreMenu(on){ menu.hidden = !on; eBtn.setAttribute('aria-expanded', String(on)); if (on){ pintaTop(); colocaMenu(); const c = $('[aria-checked="true"]', menu); if (c) c.focus(); } }
  eBtn.addEventListener('click', ev => { ev.stopPropagation(); abreMenu(menu.hidden); });
  menu.addEventListener('click', ev => {
    const b = ev.target.closest('[data-pe]'); if (!b) return; const i = +b.dataset.pe; abreMenu(false); eBtn.focus();
    if (i === SS){ if (!agentOn()) setAgent(true); }
    else if (bloqueado(i)){ toast(TT().pen); SZ.guestGate({ mode:'signup' }); }
    else { if (alOn()) setAlias(false); if (agentOn()) setAgent(false); st().sx.effort = NIV[i]; save(); }
    pinta();
  });
  menu.addEventListener('keydown', ev => { if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return; ev.preventDefault(); const L = $$('button', menu), i = L.indexOf(document.activeElement); L[(i + (ev.key === 'ArrowDown' ? 1 : L.length - 1)) % L.length].focus(); });
  document.addEventListener('pointerdown', ev => { if (!menu.hidden && !menu.contains(ev.target) && !eBtn.contains(ev.target)) abreMenu(false); });
  addEventListener('keydown', ev => { if (ev.key === 'Escape' && !menu.hidden){ abreMenu(false); eBtn.focus(); } });
  addEventListener('resize', () => { if (!menu.hidden) colocaMenu(); });
  iaBtn.addEventListener('click', () => {
    if (side.classList.contains('open')){ closeSide(); return; }
    if (mode === 'cmp'){ openSide('add', iaBtn); return; }
    if (alOn()) setAlias(false);
    if (agentOn()) setAgent(false); if (selId() === 'sz:auto') applyMode('chat'); openSide('set', iaBtn); pinta();
  });
  $('#tbNew', grp).addEventListener('click', () => newChat());
  /* las migas siguen al chat: cuando cambian los mensajes o la lista de chats */
  ['#lane', '#thList'].forEach(q => { const n = $(q); if (n) new MutationObserver(() => pintaTop()).observe(n, { childList:true }); });
  const sig = () => actual() + '|' + esfActual() + '|' + selId() + '|' + (document.documentElement.lang || '');
  let ult = '';
  /* el motor cambia de IA o de modo por muchos caminos: se repinta cuando cambia algo que se ve */
  const obs = new MutationObserver(() => { const g = sig(); if (g !== ult){ ult = g; pinta(); } });
  obs.observe(document.body, { attributes:true, attributeFilter:['class', 'data-cmode'] });
  new MutationObserver(pinta).observe(document.documentElement, { attributes:true, attributeFilter:['lang'] });
  addEventListener('storage', e => { if (e.key === 'synthz:lang' || e.key === 'synthz:alias') setTimeout(pinta, 0); });
  addEventListener('synthz-alias', () => setTimeout(pinta, 0));

  /* lo que pidió la portada: ?esfuerzo=auto|veloz|profundo|creativo|superiorsynth y ?elegir=1 (Una IA).
     Se aceptan también los nombres de antes (rapido, normal) por si alguien tiene el enlace guardado. */
  const ef = params.get('esfuerzo'), DE = { auto:'auto', normal:'auto', veloz:'fast', rapido:'fast', profundo:'deep', creativo:'creative' };
  if (DE[ef]){ const k = DE[ef] === 'deep' && !SZ.ACC.ready ? 'auto' : DE[ef]; if (agentOn()) setAgent(false); st().sx.effort = k; save(); }
  else if (ef === 'superiorsynth' && !agentOn()) setTimeout(() => { try{ setAgent(true); pinta(); }catch(er){} }, 400);
  if (params.get('elegir') === '1') setTimeout(() => { try{ if (selId() === 'sz:auto') applyMode('chat'); openSide('set'); pinta(); }catch(er){} }, 1800);
  pinta();
})();
/* ===== v3.7 · puente entre el motor de SynthFlow (este chat.js) y sus componentes React =====
   Los componentes de next/componentes/synthflow/ llaman a estas funciones en vez de depender de IDs y clics simulados.
   Se avisa con el evento «synthflow-ready» (y queda en window.SZFlow) para que React sepa que ya puede usarlas. */
window.SZFlow = Object.freeze({
  newChat:() => newChat(),
  compare:anchor => cmpOpen(anchor),
  projects:() => pjOpen('list'),
  synthetics:() => synOpen(),
  settings:() => SZ.cfgModal(),
  favorites:() => showChats('favs'),
  energy:() => coinModal('panel'),
  guide:() => openGuide(),
  help:() => { location.href = 'ayuda.html'; },
  account:anchor => accMenu(anchor),
  signIn:() => { if (SZ.ACC.ready) SZ.cfgModal('cuenta'); else accModal(); },
  hideBar:() => { const c = $('#chatsClose'); if (c) c.click(); },
  closeSheet:() => { if (isMobile()) closeChatsSheet(); },
  mode:() => mode,
  accInfo:() => accInfo,
  /* v3.8 · ventana «esta IA no responde»: la que mejor sirve para lo que escribiste, usarla, o seguir mirando */
  iaFor:(text, not) => iaFor(text, not),
  iaUse:id => { if (mode === 'cmp'){ if (!st().cmp.includes(id)) addToCompare(id, null); } else pickModel(id, null); setTimeout(() => inp.focus(), 60); },
  iaList:() => openSide(mode === 'cmp' ? 'add' : 'set'),
  lang:() => SZ.lang(),
  /* v4.1 · la ventana «Ver funcionando» (next/componentes/synthflow/VistaWeb.jsx) usa la lógica de src/chat/02c-web-proyecto.js */
  web:Object.freeze({
    doc:(P, path, o) => webDoc(P, path, o),
    go:(P, from, href) => webGo(P, from, href),
    zip:P => webZip(P),
    load:(f, html) => synLoad(f, html),
    tokens:(text, ext) => webTokens(text, ext),
    file:F => cnvDownload({ name:F.path, ext:F.ext, text:F.text })
  })
});
{ const w = $('#sNav .snw'); if (w && !w.firstChild) w.innerHTML = SZ.flowWord(); }
try{ dispatchEvent(new CustomEvent('synthflow-ready')); }catch(e){}
/* ---------- arranque ---------- */
const wantModel = params.get('model');
if (wantModel && /^(pu|or):[\w.\/:@-]{2,120}$/.test(wantModel)){ st().model.openrouter = wantModel; save(); }
{ const PRE = /^(pu|or|gq|sz|tr):/, s0 = st().model.openrouter; if (s0 && !PRE.test(s0)){ st().model.openrouter = 'or:' + s0; save(); } st().cmp = st().cmp.map(x => PRE.test(x) ? x : 'or:' + x);
  /* beta 2: quien usaba OpenRouter o Groq sin llave pasa a las IAs conectadas (sus chats siguen en «Mis chats») */
  const s1 = st().model.openrouter || ''; if ((/^or:/.test(s1) && !(st().keys.openrouter || st().useTeam)) || (/^gq:/.test(s1) && !gqOn()) || !s1){ st().model.openrouter = APODEX; delete st().pinned; save(); }
  const c1 = st().cmp.filter(x => !(/^or:/.test(x) && !(st().keys.openrouter || st().useTeam)) && !(/^gq:/.test(x) && !gqOn())); if (c1.length !== st().cmp.length){ st().cmp = c1; save(); } }
{ const cc = st().chats; if (Array.isArray(cc.openrouter)){ if (cc.openrouter.length && !(cc[ckey()] || []).length) cc[ckey()] = cc.openrouter; delete cc.openrouter; save(); } }
root.style.setProperty('--c', mode === 'cmp' ? '#b8c4ff' : vendorColor(info(selId()).vendor));
if (mode === 'cmp' && st().cmp.length < 2) mode = 'solo';
document.body.classList.toggle('cmpm', mode === 'cmp');
inp.placeholder = mode === 'cmp' ? 'Una pregunta para todas las IA…' : 'Escribe tu mensaje…';
applyRail();
renderFilters(); renderLive(); renderList({ animate:true }); renderTop(true); renderMsgs(); renderNow(); updateHint(); renderChats(true);
const fixPills = () => { placePill($('#cSeg')); placePill($('#sortSeg')); placePill($('#provSeg')); };
/* «Más filtros»: al abrirse, sus píldoras se acomodan y el panel queda dentro de la ventana (con su propio scroll) */
/* (los filtros ya no van escondidos: viven en el panel «Filtros») */ requestAnimationFrame(fixPills);
requestAnimationFrame(fixPills);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fixPills);
addEventListener('resize', fixPills);
refresh(true);

/* la entrada continúa la expansión de la página anterior */
const enter = root.classList.contains('enter');
let po = ''; try{ po = sessionStorage.getItem('synthz:portal') || ''; sessionStorage.removeItem('synthz:portal'); }catch(e){}
/* v4.4 · «Entrada»: al abrir SynthFlow directo ya no se llena la pantalla con el velo lila y la Z vieja que se agranda (del diseño
   anterior). El velo es tinta con el esqueleto de Sonyx brillando (Fondo.jsx); al estar listo se funde y todo llega en cascada. */
/* desde la portada: el hueco de la «o» se abre (o un fundido en modo rendimiento) */
requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => { root.classList.add('go'); if (enter){ if (po === 'o'){ SZ.portalArrive($('#veil')); SZ.waterIn($('.shell')); } setTimeout(renderNow, 1500); } }, enter ? 120 : 0)));
let pendingQ = null; try{ const s0 = JSON.parse(sessionStorage.getItem('synthz:q') || 'null'); sessionStorage.removeItem('synthz:q'); if (s0 && typeof s0.q === 'string' && Date.now() - s0.t < 120000) pendingQ = s0.q; }catch(e){}
const q = pendingQ || params.get('q'), fromHome = !!pendingQ;
const draftK = params.get('draft');
if (params.get('prueba') === '1') setTimeout(() => enterTrial(), enter ? 1600 : 300);
if (!q && DRAFTS[draftK]){
  const [ex, ik, txt] = DRAFTS[draftK];
  setTimeout(() => {
    if (!st().pinned && cat.list.length) { const r = recommend(ik); if (r.m){ st().intent = { k:ik, id:r.m.id }; if (r.m.id !== selId()) pickModel(r.m.id); else renderMsgs(); } }
    typeIntoComposer(ex != null ? EXAMPLES[ex][1] : txt);
  }, enter ? 1700 : 600);
}
try{
  /* temas elegidos en la portada: Sona los muestra aquí, en ese orden */
  let gt = null; try{ gt = JSON.parse(sessionStorage.getItem('synthz:gtopics') || 'null'); sessionStorage.removeItem('synthz:gtopics'); }catch(e){}
  if (params.get('guia') === '1') setTimeout(runGuide, enter ? 2000 : 500);
  else if (Array.isArray(gt) && gt.length) setTimeout(() => runTopics(gt), enter ? 2000 : 600);
  else if (!q && !draftK && !localStorage.getItem('synthz:tour')) bflowOpen(enter ? 1500 : 200);
  else { setTimeout(warnBlocked, enter ? 2700 : 900); SZ.synReady.then(() => { if (!q && SZ.wasAway()) setTimeout(() => SZ.welcomeBack({ learn:runGuide, flow:() => { if (matchMedia('(pointer: fine)').matches) inp.focus(); } }), enter ? 2200 : 700); }); setTimeout(() => { if (!G && !document.querySelector('.szm, #szWelcome')) SZ.whatsNew(false, list => runTopics(list)); }, enter ? 4200 : 3000); }
}catch(e){}
try{ if (new URLSearchParams(location.search).get('conn') === '1') setTimeout(() => openConnect(), 1200); }catch(e){}
try{ const clean = new URLSearchParams(location.search); ['q', 'from', 'draft', 'prueba', 'guia', 'conn', 'quoryn', 'alias'].forEach(k => clean.delete(k)); window.history.replaceState(null, '', location.pathname + (clean.toString() ? '?' + clean.toString() : '')); }catch(e){}
if (q){ inp.value = q.slice(0, 4000); autoGrow(); updateHint(); if (fromHome) setTimeout(() => { send(); }, enter ? 1500 : 300); else inp.focus(); }
else if (enter) setTimeout(() => { if (matchMedia('(pointer: fine)').matches) inp.focus(); }, 1300);
})();
