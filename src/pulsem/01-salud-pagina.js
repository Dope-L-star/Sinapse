/* ---------- salud de la página ---------- */
function health(){
  const keys = P.keys || [], tot = keys.length, ok = keys.filter(k => !k.down).length, now = P.now;
  const recent = (P.events || []).filter(e => now - e.t < 10 * 60e3), errs = recent.filter(e => e.kind === 'error' || e.kind === 'jserror').length;
  const load5 = (P.perMin || []).slice(-5).reduce((a, b) => a + b, 0), d0 = (P.stat || [])[0] || {}, req = d0.req || 0, fail = d0.fail || 0, fr = fail / Math.max(1, req + fail);
  const why = []; let lv = 'ok';
  const up = l => { const o = ['ok', 'busy', 'down']; if (o.indexOf(l) > o.indexOf(lv)) lv = l; };
  if (!tot){ lv = 'off'; why.push('Las IAs conectadas no tiene llaves'); }
  else {
    why.push(ok + ' de ' + tot + ' llaves activas');
    if (!ok) up('down'); else if (ok < tot / 2) up('busy');
    if (fail >= 5 && fr > .3) up('down'); else if (fail >= 3 && fr > .1) up('busy');
    if (fail) why.push(fail + ' mensajes sin respuesta hoy');
    if (errs >= 15) up('down'); else if (errs >= 5) up('busy');
    if (errs) why.push(errs + (errs === 1 ? ' error' : ' errores') + ' en 10 min');
    if (load5 >= 120) up('busy');
    why.push(load5 + ' mensajes en 5 min');
  }
  return { lv, why, ok, tot };
}
const LV = { ok:['#7fd6b8', 'Funcionando bien', 'Todo responde con normalidad.', '✓'], busy:['#f2b36b', 'Con mucha carga', 'Responde, pero algo va lento o falla a ratos. Mira las llaves y las dificultades.', '!'], down:['#ff8f7a', 'A punto de caer', 'Muchas fallas ahora mismo: revisa las llaves (abajo) y quién tiene problemas.', '!!'], off:['#8d909c', 'IAs conectadas apagada', 'Agrega tus llaves abajo para activarla para todos. Mientras tanto, las personas solo pueden usar su Puter.', '–'] };
function renderHealth(){
  const h = health(), L = LV[h.lv], d0 = (P.stat || [])[0] || {};
  const c = $('#cHealth'); c.style.setProperty('--hc', L[0]); c.style.setProperty('--cg', L[0]);
  $('#hLamp').innerHTML = '<b>' + L[3] + '</b>';
  $('#hTitle').textContent = L[1]; $('#hText').textContent = L[2];
  $('#hWhy').innerHTML = h.why.map(w => '<span>' + esc(w) + '</span>').join('');
  const K = [[(P.online || []).length, 'en línea ahora'], [d0.req || 0, 'mensajes hoy'], [SZ.coinsOf(d0.tok || 0), SZ.t('pm.spent')], [(d0.err || 0) + (d0.fail || 0), 'errores de IA hoy'], [d0.req ? ((d0.ms || 0) / d0.req / 1000) : 0, 'segundos por respuesta']];
  $('#hKpi').innerHTML = K.map(([v, l], i) => '<div class="kpi"><b data-k="' + i + '">0</b><span>' + l + '</span></div>').join('');
  K.forEach(([v], i) => { const b = $('[data-k="' + i + '"]'); if (i === 4){ b.textContent = v ? v.toFixed(1).replace('.', ',') : '–'; } else SZ.countTo(b, v); });
  { const U = P.use || {}, B = [['Vercel · llamadas al servidor', U.req || 0, 100000], ['Upstash · comandos de datos', U.cmd || 0, 500000]];
    let m = $('#hUse'); if (!m){ m = document.createElement('div'); m.id = 'hUse'; m.className = 'use'; $('#hKpi').insertAdjacentElement('afterend', m); }
    m.innerHTML = '<p class="usel">Lo gratis de este mes (' + esc(U.month || '') + ')</p>' + B.map(([l, v, mx]) => { const p = Math.min(100, v / mx * 100), col = p >= 90 ? '#ff8f7a' : p >= 70 ? '#f2b36b' : '#7fd6b8'; return '<div class="ub"><span>' + l + '</span><i><b style="width:' + p.toFixed(1) + '%;background:' + col + '"></b></i><em>' + fmt(v) + ' de ' + fmt(mx) + ' · ' + p.toFixed(p < 10 ? 1 : 0).replace('.', ',') + ' %</em></div>'; }).join('')
      + (B.some(x => x[1] / x[2] >= .7) ? '<p class="usew">Ya pasaste el 70 %: cuando llegue al 100 % esa parte se detiene hasta el mes siguiente.</p>' : ''); }
  $('#pRank').textContent = P.rank; $('#pRank').className = 'rkp r-' + rc(P.rank);
}

/* ---------- en línea ---------- */
function renderOnline(){
  const now = P.now, ev = P.events || [];
  const conf = new Set(ev.filter(e => e.kind === 'confused' && now - e.t < 15 * 60e3).map(e => e.who));
  const L = (P.online || []).map(o => Object.assign({}, o, { trouble:(o.errs || 0) + (o.locked ? 3 : 0) + (conf.has(o.name) ? 2 : 0) + (!o.msgs && now - (o.since || now) > 4 * 60e3 && o.page === 'chat' ? 1 : 0) })).sort((a, b) => b.trouble - a.trouble || (b.t || 0) - (a.t || 0));
  $('#oN').textContent = L.length + (L.length === 1 ? ' persona' : ' personas');
  $('#oList').innerHTML = L.length ? L.map((o, i) => {
    const tg = [];
    if (o.locked) tg.push('<span class="tag bad">sin IA</span>');
    if (o.errs) tg.push('<span class="tag bad">' + o.errs + (o.errs === 1 ? ' error' : ' errores') + '</span>');
    if (conf.has(o.name)) tg.push('<span class="tag warn">se ve perdido/a</span>');
    if (!o.msgs && now - (o.since || now) > 4 * 60e3 && o.page === 'chat') tg.push('<span class="tag warn">no ha usado la IA</span>');
    if (o.msgs) tg.push('<span class="tag ok">' + o.msgs + ' mensajes</span>');
    if (o.ai) tg.push('<span class="tag gold">' + esc(o.ai === 'synthz' ? 'IAs conectadas' : o.ai === 'puter' ? 'Puter' : o.ai) + '</span>');
    const sub = /^u:/.test(o.id) ? o.id.slice(2) : '';
    return '<div class="row" style="--i:' + i + '"><span class="av r-' + rc(o.rank) + '">' + ini(o.name) + '</span><div class="tx"><b>' + esc(o.name || 'Alguien') + ' <span class="rkp r-' + rc(o.rank) + '" style="font-size:9.5px;padding:1px 7px;margin-left:4px">' + esc(o.rank || '') + '</span></b><small>' + esc(PAGES[o.page] || o.page || '—') + ' · ' + (o.mobile ? 'celular' : 'computador') + ' · ' + dur(now - (o.since || now)) + '</small></div><div class="tags">' + tg.join('') + (sub ? '<button class="mini gold" type="button" data-reach="' + esc(sub) + '" data-nm="' + esc(o.name) + '">Contactar</button>' : '') + '</div></div>';
  }).join('') : '<div class="empty">No hay nadie en línea en este momento. ✨</div>';
}

