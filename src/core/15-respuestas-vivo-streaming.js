/* ---------- respuestas en vivo (streaming) ---------- */
let ridN = 0;
const newRid = () => DEV + ':' + Date.now().toString(36) + ':' + (++ridN);
/* v3.6 · avisa cada vez que se gasta un mensaje de prueba (sin cuenta o la prueba guiada), con lo que queda de verdad según el servidor */
function spentNote(before, after){
  if (!(before > after)) return;
  try{ toast(after > 0 ? t('enerx.spent', { n:battPct() }) : t('enerx.spent0')); }catch(e){}   /* v4.3 · solo energía en %, nunca «mensajes» (Sammuel, 9 nov) */
}
async function askStream(p, messages, opts = {}, onDelta){
  const sig = opts.signal, t0 = performance.now(); let acc = '', ttft = 0, usage = null, fin = '', cut = '', via = '', provX = '', real = '', swap = false;
  /* lo que la IA «piensa» (campo reasoning o etiquetas <think>) se separa de la respuesta y se muestra aparte */
  let raw = '', tagR = '', fieldR = '';
  const emitR = () => { if (opts.onReason) try{ opts.onReason(fieldR + tagR); }catch(e){} };
  const push = d => {
    if (!d) return; raw += d; let vis = raw;
    const lead = raw.replace(/^\s+/, ''), i = raw.indexOf('<think>');
    if (i >= 0){ const j = raw.indexOf('</think>', i), r = raw.slice(i + 7, j < 0 ? undefined : j); if (r !== tagR){ tagR = r; emitR(); } vis = raw.slice(0, i) + (j < 0 ? '' : raw.slice(j + 8).replace(/^\s+/, '')); }
    else if (lead.length < 7 && '<think>'.startsWith(lead)) vis = '';
    if (vis === acc) return;
    if (!ttft && vis) ttft = performance.now() - t0; acc = vis; if (onDelta) onDelta(acc);
  };
  const pushR = d => { if (!d || typeof d !== 'string') return; fieldR += d; emitR(); };
  const inChars = messages.reduce((n, m) => n + (typeof m.content === 'string' ? m.content.length : 200), 0);
  const done = aborted => {
    if (!acc && aborted) throw Object.assign(new Error('Detenido.'), { aborted:true });
    const text = acc.trim() || '(La IA devolvió una respuesta vacía.)';
    const prompt = usage && usage.prompt_tokens != null ? usage.prompt_tokens : Math.ceil(inChars / 4);
    const completion = usage && usage.completion_tokens != null ? usage.completion_tokens : est(text);
    return { text, prompt, completion, ms:performance.now() - t0, ttft, model:opts.model, aborted:!!aborted, est:!usage, finish:fin, cut, rid:newRid(), via, prov:provX || undefined, real, swap, reasoning:(fieldR + tagR).trim().slice(0, 8000) };
  };
  const model0 = String(opts.model || state.model[p.id] || '');
  /* sin créditos de Puter: pasa sola a las IAs conectadas (el único aviso es «Usaste el saldo de este mes de Puter: sigo con las IAs conectadas») */
  /* v3.4 · las fotos ya viajan a las IAs conectadas (antes se cambiaban por «[imagen]» y el servidor las botaba) */
  const fallSz = () => { puterOutNote(); return askStream(SZ_P, messages, Object.assign({}, opts, { model:'sz:auto', _noFall:true }), onDelta).then(r => Object.assign(r, { swapped:true })); };
  if (/^pu:/.test(model0)){
    if (!window.puter) throw new Error('No pude abrir Puter. Revisa tu internet o apaga el bloqueador de anuncios para esta página.');
    if (!puter.auth.isSignedIn()) throw Object.assign(new Error('Conecta tu cuenta de Puter para usar esta IA.'), { needLogin:true });
    if (!opts._noFall && SZQ.on !== false && await puterOut()) return fallSz();
    let resp;
    const stop = new Promise(res => { if (sig){ if (sig.aborted) res({ stop:true }); else sig.addEventListener('abort', () => res({ stop:true }), { once:true }); } });
    try{
      try{ resp = await Promise.race([puter.ai.chat(messages, Object.assign({ model:model0.replace(/^pu:/, ''), stream:true }, opts.maxTokens ? { max_tokens:opts.maxTokens } : {})), stop]); }
      catch(e){ if (/stream/i.test(errText(e))) return askPuter(messages, opts).then(r => { push(r.text); return Object.assign(r, { ttft:ttft || r.ms, est:true, rid:newRid() }); }); throw e; }
      if (resp && resp.stop) return done(true);
      if (!resp || typeof resp[Symbol.asyncIterator] !== 'function'){ const c = resp && resp.message ? resp.message.content : resp; push(typeof c === 'string' ? c : String(c || '')); return done(false); }
      const it = resp[Symbol.asyncIterator]();
      while (true){
        const n = await Promise.race([it.next(), stop]);
        if (n.stop) return done(true);
        if (n.done) break;
        const part = n.value || {};
        if (part.type === 'error'){ if (acc){ cut = part.message || 'error'; return done(false); } throw new Error('Puter: ' + (part.message || 'el modelo falló a mitad de la respuesta.')); }
        if (part.finish_reason) fin = part.finish_reason;
        if (part.usage) usage = { prompt_tokens:part.usage.input_tokens ?? part.usage.prompt_tokens, completion_tokens:part.usage.output_tokens ?? part.usage.completion_tokens };
        if ((!part.type || part.type === 'text') && typeof part.text === 'string') push(part.text);
        else if (part.type === 'reasoning') pushR(part.reasoning || part.text);
      }
    }catch(e){
      if (e && e.aborted) throw e;
      const m = errText(e), code = String((e && (e.code || (e.error && e.error.code))) || '') + ' ' + m;
      if (/insufficient_funds|insufficient funds|low balance|402/i.test(code)){ puterSetOut(); if (!acc && !opts._noFall && SZQ.on !== false) return fallSz(); if (acc) return done(false); throw Object.assign(new Error('Usaste el saldo de este mes de Puter. Se llena otra vez el próximo mes; mientras tanto sigue con las IAs conectadas, que son gratis.'), { switchTo:'sz', limit:true }); }
      if (/too_many_requests|429/i.test(code)) throw Object.assign(new Error('Vas muy rápido para Puter. Espera unos segundos y vuelve a intentar.'), { limit:true });
      if (/auth|token|sign.?in|login|401|403/i.test(m)) throw Object.assign(new Error('Se cerró tu cuenta de Puter. Entra otra vez.'), { needLogin:true });
      if (acc) return done(false);
      throw Object.assign(new Error('Puter: ' + (m || 'no pudo responder con esta IA. Prueba con otra.')), { raw:m, gone:/model.{0,30}(not found|not available|does not exist|unknown|unsupported|invalid)|no (such|valid) model|model_not_found/i.test(m) });
    }
    return done(false);
  }
  const viaSz = /^sz:/.test(model0); if (viaSz){ p = SZ_P; provX = 'synthz'; }
  const viaGroq = /^gq:/.test(model0); if (viaGroq) p = GROQ_P;
  if (p.kind !== 'openai'){ const r = await ask(p, messages, opts); push(r.text); return Object.assign(r, { ttft:r.ms, rid:newRid() }); }
  const viaTrial = /^tr:/.test(model0);
  const viaTeam = !viaTrial && !viaGroq && p.id === 'openrouter' && !state.keys.openrouter && !!state.useTeam && !!SESS;
  const key = state.keys[p.id];
  if (!key && !viaTeam && !viaTrial && !viaSz) throw new Error('Falta la llave de ' + p.name + '.');
  /* v3.6 · el mismo «turn» que el mensaje que escribiste (10 min): «Continúa» y el arreglo automático del código no gastan otro mensaje de prueba */
  const turn = opts.turn || (TURN && Date.now() - TURN.at < 600000 ? TURN.id : turnId(messages));
  const body = viaSz ? { messages, model:model0, turn } : viaGroq ? { model:model0.replace(/^gq:/, ''), messages, stream:true, stream_options:{ include_usage:true } } : { model:model0.replace(/^or:/, ''), messages, stream:true, usage:{ include:true } };
  if (viaTeam) body.teamId = state.useTeam;
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  if (opts.effort && viaSz) body.effort = opts.effort;   /* v4.0 · el servidor usa el esfuerzo para decidir si la IA piensa antes (Alto) o responde directo (Bajo) */
  if (opts.effort && p.id === 'openrouter' && !viaSz && !viaGroq && !viaTrial) body.reasoning = { effort:opts.effort };   /* v2.3.1 · esfuerzo: OpenRouter lo ignora en las IA que no razonan */
  const ctl = new AbortController(); let idle = 0;
  const bump = () => { clearTimeout(idle); idle = setTimeout(() => ctl.abort(), 70000); };
  if (sig){ if (sig.aborted) ctl.abort(); else sig.addEventListener('abort', () => ctl.abort(), { once:true }); }
  let res; bump();
  try{ res = viaSz ? await fetch('/api/ai', { method:'POST', headers:szHeaders(), body:JSON.stringify(body), signal:ctl.signal })
     : viaTrial ? await fetch('/api/trial', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ action:'chat', token:(trialGet() || {}).token || '', messages, turn }), signal:ctl.signal })
     : viaTeam ? await fetch('/api/chat', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + SESS }, body:JSON.stringify(body), signal:ctl.signal })
                     : await fetch(p.url + '/chat/completions', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + key }, body:JSON.stringify(body), signal:ctl.signal }); }
  catch(e){ clearTimeout(idle); if (sig && sig.aborted) throw Object.assign(new Error('Detenido.'), { aborted:true }); throw new Error(e && e.name === 'AbortError' ? p.name + ' tardó demasiado en responder. Intenta de nuevo.' : netMsg(p)); }
  if (!res.ok && viaTrial){
    clearTimeout(idle); const data = await res.json().catch(() => ({}));
    if (data.code === 'trial_done' || data.code === 'trial_bad'){ const t = trialGet() || {}; t.left = 0; if (data.code === 'trial_bad') t.token = ''; trialSet(t); }
    throw Object.assign(new Error(typeof data.error === 'string' ? data.error : 'La prueba no respondió. Intenta de nuevo.'), { status:res.status, trial:data.code || 'trial_err', limit:data.code === 'trial_done' });
  }
  if (!res.ok && viaSz){
    clearTimeout(idle); const data = await res.json().catch(() => ({})), code = data.code || '';
    if (code === 'sz_guest'){ szqSet({ guest:{ max:(SZQ.guest && SZQ.guest.max) || 5, used:(SZQ.guest && SZQ.guest.max) || 5, left:0 } }); telEv('limit', code); setTimeout(() => guestGate(), 350); }
    else if (/^sz_limit/.test(code)){ szqSet({ used:SZQ.limit }); telEv('limit', code); }
    else if (code === 'sz_off'){ szqSet({ on:false }); telEv('noai', 'las IAs conectadas no tienen llaves'); }
    else telEv('error', 'IAs conectadas ' + res.status + ' ' + code);
    throw Object.assign(new Error(typeof data.error === 'string' ? data.error : 'La IA no respondió. Intenta de nuevo en un momento.'), { status:res.status, sz:code || 'sz_err', limit:/^sz_limit/.test(code) || code === 'sz_guest', guest:code === 'sz_guest', raw:code, gone:code === 'sz_model' && model0 !== 'sz:auto', switchTo:code === 'sz_down' || code === 'sz_off' ? 'pu' : null });
  }
  if (viaSz){ try{ real = decodeURIComponent(res.headers.get('x-sz-name') || ''); }catch(e){ real = ''; } swap = res.headers.get('x-sz-fallback') === '1';   /* v3.7 · la IA elegida no estaba o no ve fotos: respondió otra y se dice */ const u = +res.headers.get('x-sz-used'), l = +res.headers.get('x-sz-limit'), gq = /^(\d+)\/(\d+)(?:\/(\d+))?$/.exec(res.headers.get('x-sz-guest') || ''); const g0 = SZQ.guest && !signedish() ? guestLeft() : null; if (l) szqSet(Object.assign({ on:true, used:u || 0, limit:l }, gq ? { guest:{ used:+gq[1], max:+gq[2], left:gq[3] != null ? +gq[3] : null } } : {})); if (gq && g0 != null) spentNote(g0, guestLeft()); }
  if (viaTrial){ const t = trialGet() || {}; const l = res.headers.get('x-trial-left'), l0 = t.left; if (l != null){ t.left = +l; trialSet(t); if (res.headers.get('x-trial-spent') !== '0' && l0 != null) spentNote(+l0, +l); } via = res.headers.get('x-trial-provider') || ''; }
  if (!res.ok){ clearTimeout(idle); const data = await res.json().catch(() => ({})); if (viaTeam && typeof data.error === 'string') throw Object.assign(new Error('Equipo: ' + data.error), { status:res.status, switchTo:res.status === 429 ? 'pu' : null }); const raw = data && data.error ? String(data.error.message || data.error) : ''; throw Object.assign(new Error(friendly(res.status, data, p)), { status:res.status, raw, gone:modelGone(res.status, raw), switchTo: p.id === 'openrouter' && (res.status === 429 || res.status === 402) ? 'pu' : null }); }
  if (!/event-stream/.test(res.headers.get('content-type') || '') || !res.body){
    clearTimeout(idle); const data = await res.json().catch(() => ({}));
    if (data && data.error) throw new Error(friendly(+data.error.code || 502, data, p));
    push((((data.choices || [])[0] || {}).message || {}).content || ''); usage = data.usage || null; return done(false);
  }
  const rd = res.body.getReader(), dec = new TextDecoder(); let buf = '';
  try{
    while (true){
      const { value, done:end } = await rd.read(); if (end) break; bump();
      buf += dec.decode(value, { stream:true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0){
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        const d = line.slice(5).trim(); if (d === '[DONE]') continue;
        let j; try{ j = JSON.parse(d); }catch(e){ continue; }
        if (j.sz){ szqSet({ used:+j.sz.used || SZQ.used, limit:+j.sz.limit || SZQ.limit }); if (j.sz.spent){ const pp = Math.min(+j.sz.spent, Math.ceil(inChars / 4)); usage = { prompt_tokens:pp, completion_tokens:+j.sz.spent - pp }; }   /* v3.7 · lo que descontó el servidor es lo que se muestra: así «usó X %» y la pila cuadran */ continue; }
        if (j.error){ if (acc){ cut = String(j.error.message || 'error'); return done(false); } const raw = String(j.error.message || ''); throw Object.assign(new Error(friendly(+j.error.code || 502, j, p)), { status:+j.error.code || 502, raw, gone:modelGone(+j.error.code || 502, raw) }); }
        if (j.usage) usage = j.usage; else if (j.x_groq && j.x_groq.usage) usage = j.x_groq.usage;
        const ch = (j.choices || [])[0]; if (ch && ch.delta){ pushR(ch.delta.reasoning); pushR(ch.delta.reasoning_content); if (typeof ch.delta.content === 'string') push(ch.delta.content); }
        if (ch && ch.finish_reason) fin = ch.finish_reason;
      }
    }
  }catch(e){
    clearTimeout(idle);
    if (sig && sig.aborted) return done(true);
    if (acc){ cut = (e && e.message) || 'conexión'; return done(false); }
    if (e && e.name === 'AbortError') throw new Error(p.name + ' dejó de responder. Intenta de nuevo.');
    throw e;
  }
  clearTimeout(idle);
  return done(false);
}
/* muestra el texto que llega con un ritmo suave de escritura; Detener lo completa al instante */
const reveals = new Set();
function mkReveal(body, onPaint){
  let full = '', shown = 0, raf = 0, ended = false, skip = false, endRes; const fin = new Promise(r => { endRes = r; });
  const R = {
    push(t){ full = t; if (!raf) raf = requestAnimationFrame(frame); },
    end(){ ended = true; if (!raf){ if (shown >= full.length){ reveals.delete(R); endRes(); } else raf = requestAnimationFrame(frame); } return fin; },
    skip(){ skip = true; if (!raf) raf = requestAnimationFrame(frame); },
    get full(){ return full; }
  };
  reveals.add(R);
  let lastPaint = 0, painted = -1;
  function frame(now){
    raf = 0;
    if (!skip && !ended && now - lastPaint < 33){ raf = requestAnimationFrame(frame); return; }
    lastPaint = now || performance.now();
    const back = full.length - shown;
    shown = skip || reduce ? full.length : Math.min(full.length, shown + Math.max(3, Math.ceil(back / 6)));
    if (shown === painted && !(ended && shown >= full.length)){ if (shown < full.length) raf = requestAnimationFrame(frame); return; }
    painted = shown;
    body.innerHTML = md(full.slice(0, shown));
    if (!(ended && shown >= full.length)){ const last = body.lastElementChild; (last && !/^(PRE|UL|OL|TABLE)$/.test(last.tagName) ? last : body).insertAdjacentHTML('beforeend', '<i class="scaret"></i>'); }
    if (onPaint) onPaint(shown, full.length);
    if (shown < full.length) raf = requestAnimationFrame(frame);
    else if (ended){ reveals.delete(R); endRes(); }
  }
  return R;
}
