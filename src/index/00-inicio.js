(() => {
'use strict';
const { root, $, $$, clamp, fmt, reduce, today, sleepRaw, esc, est, Z_PATH, ico, zWord, API, MANUAL, ALL, byId, save, total, addUsage, toast, hydrateIcons, countTo, charify, typeIn, showAll, S, coins } = SZ;
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

