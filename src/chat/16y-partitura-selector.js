/* ---------- 2026-11-09 · rediseño «Partitura»: el selector de 4 modos en la caja de escribir ----------
   Sammuel: «hay muchas IAs, el modo auto, comparar y Quoryn: ¿cómo se va a elegir?». Respuesta concreta, siempre a la vista:
     Auto      Sinapse elige la IA para cada pedido (y dice cuál usó).            → applyMode('auto')
     Una IA    tú eliges de la lista con buscador; abajo se ve cuál tienes.          → applyMode('chat') + abre la lista
     Comparar  2 a 3 IAs lado a lado; te quedas con la mejor.                         → cmpOpen()
     Agente    Quoryn: arma un plan, lo apruebas una vez y trabaja solo.          → abre alias.html con lo escrito
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
  const actual = () => mode === 'cmp' ? 'cmp' : selId() === 'sz:auto' && !agentOn() ? 'auto' : 'una';
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
        const q = (inp.value || '').trim();
        location.href = 'alias.html?' + new URLSearchParams(q ? { from:'flow', meta:q } : { from:'flow' }).toString();
        return;
      }
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
    else { if (agentOn()) setAgent(false); st().sx.effort = NIV[i]; save(); }
    pinta();
  });
  menu.addEventListener('keydown', ev => { if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return; ev.preventDefault(); const L = $$('button', menu), i = L.indexOf(document.activeElement); L[(i + (ev.key === 'ArrowDown' ? 1 : L.length - 1)) % L.length].focus(); });
  document.addEventListener('pointerdown', ev => { if (!menu.hidden && !menu.contains(ev.target) && !eBtn.contains(ev.target)) abreMenu(false); });
  addEventListener('keydown', ev => { if (ev.key === 'Escape' && !menu.hidden){ abreMenu(false); eBtn.focus(); } });
  addEventListener('resize', () => { if (!menu.hidden) colocaMenu(); });
  iaBtn.addEventListener('click', () => {
    if (side.classList.contains('open')){ closeSide(); return; }
    if (mode === 'cmp'){ openSide('add', iaBtn); return; }
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
