/* ---------- comparar: las respuestas llegan en orden, sin cajas vacías, y puedes sumar IA después ---------- */
/* «Esta tiene más Flow»: cada respuesta trae una carita buena de SynthonIA, distinta a las demás */
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

