/* ---- ayuda de personas ---- */
async function helpApi(o){ return api('help' + (o && o.q ? o.q : ''), o && o.body ? { method:'POST', body:o.body, keep:true } : { keep:true }); }
async function botTeam(){
  if (!ACC.ready){ if (!BOT.open) botOpen(); botSay('Para hablar con una persona del equipo necesitas tu cuenta de SymphorIA (es gratis). Así te pueden responder aunque cierres la página.', 'guino', ['login', 'Entrar o crear cuenta']); return; }
  if (!(BOT.help && BOT.help.status !== 'done')) BOT.help = { status:'new', msgs:[] };
  BOT.mode = 'chat'; botClose(); chatOpen();
}
/* ---- «Chat con …»: ventana aparte que entra de derecha a izquierda (la persona que te atiende y su rango) ---- */
const CW = { el:null };
function chatTitle(r){ return r && r.by && r.by.name ? 'Chat con ' + r.by.name : 'Chat con el equipo de SymphorIA'; }
function chatOpen(){
  if (!CW.el){
    const w = document.createElement('aside'); w.id = 'szChat'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'Chat con el equipo');
    w.innerHTML = '<div class="cwh"><span class="cwa"></span><div class="cwt"><b></b><small></small></div><button type="button" class="cwx" data-cx aria-label="Cerrar">×</button></div><div class="cwl" aria-live="polite"></div>'
      + '<form class="cwin"><input type="text" maxlength="1000" placeholder="Escríbele al equipo…" aria-label="Escríbele al equipo" autocomplete="off"><button type="submit" class="bs" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></form>'
      + '<div class="cwf"><span>Nadie ve tus chats: solo lo que escribes aquí.</span><button type="button" class="lnk" data-cend>Terminar</button></div>';
    document.body.appendChild(w); CW.el = w;
    $('[data-cx]', w).addEventListener('click', chatClose);
    $('[data-cend]', w).addEventListener('click', async () => { const r = BOT.help; if (!r || !r.id || r.status === 'done'){ chatClose(); return; } try{ const d = await helpApi({ body:{ action:'close', id:r.id } }); BOT.help = d.item; chatRender(); toast('Terminaste la conversación con el equipo.'); setTimeout(chatClose, 900); }catch(er){ toast(er.message); } });
    $('.cwin', w).addEventListener('submit', async e => { e.preventDefault(); const i = $('.cwin input', w), v = i.value.trim(); if (!v) return; i.value = ''; const r = BOT.help; if (r && r.status === 'done') BOT.help = { status:'new', msgs:[] }; BOT.mode = 'team'; await botTeamSay(v); BOT.mode = 'chat'; chatRender(); });
  }
  chatRender(); SND.expand && SND.expand();
  requestAnimationFrame(() => requestAnimationFrame(() => CW.el && CW.el.classList.add('on')));
  setTimeout(() => { const i = CW.el && $('.cwin input', CW.el); if (i && matchMedia('(pointer: fine)').matches) i.focus(); }, 520);
  if (BOT.el){ const dot = $('.bdot', BOT.el); if (dot && !BOT.team) dot.hidden = true; }
}
function chatClose(){ if (CW.el) CW.el.classList.remove('on'); }
const chatIsOpen = () => !!(CW.el && CW.el.classList.contains('on'));
function chatRender(){
  const w = CW.el; if (!w) return; const r = BOT.help || { status:'new', msgs:[] };
  $('.cwt b', w).textContent = chatTitle(r);
  $('.cwt small', w).innerHTML = r.by && r.by.rank ? '<span class="rk r-' + esc(String(r.by.rank).toLowerCase()) + '">' + esc(r.by.rank) + '</span> te está atendiendo' : r.status === 'open' ? (r.urgent ? 'Avisando otra vez a un Prime, ZFlow o Symmetrix…' : 'Esperando a un Prime, ZFlow o Symmetrix…') : r.status === 'done' ? 'Conversación terminada' : 'Un Prime, ZFlow o Symmetrix te responde aquí';
  $('.cwa', w).innerHTML = r.by && r.by.name ? '<i class="cwi r-' + esc(String(r.by.rank || '').toLowerCase()) + '">' + esc(String(r.by.name).replace(/^@/, '').charAt(0).toUpperCase()) + '</i>' : face(r.status === 'open' ? 'esperando' : 'feliz', 40);
  const L = $('.cwl', w);
  const intro = botMsgHtml({ role:'assistant', mood:'feliz', content:'Cuéntame en qué te ayudamos y se lo paso a un Prime, ZFlow o Symmetrix. Te responden aquí mismo, aunque cierres la página.' });
  L.innerHTML = (!(r.msgs || []).length ? intro : '') + (r.msgs || []).map(m => botMsgHtml(m.from === 'team' ? { role:'team', name:m.name, rank:m.rank, content:m.text } : { role:'user', content:m.text })).join('')
    + (r.status === 'open' ? botMsgHtml({ role:'assistant', mood:r.urgent ? 'pensando' : 'esperando', content:r.urgent ? 'Ya pasaron más de 15 minutos: estoy avisando otra vez al equipo. ¡No te vas a quedar sin respuesta!' : 'Le avisé al equipo. Te respondo aquí apenas escriban (puedes seguir usando SymphorIA).' }) : '')
    + (r.status === 'done' ? '<p class="bempty">Conversación terminada. Escribe para abrir una nueva.</p>' : '');
  $('[data-cend]', w).hidden = !r.id || r.status === 'done';
  L.scrollTop = L.scrollHeight;
}
async function botTeamSay(text){
  if (CW.el && BOT.mode !== 'reply') BOT.mode = 'team';
  try{
    if (BOT.mode === 'reply' && BOT.cur){ const d = await helpApi({ body:{ action:'say', id:BOT.cur.id, text } }); BOT.cur = d.item; botRender(); botSyncSoon(); return; }
    const r = BOT.help;
    const d = r && r.id && r.status !== 'done' ? await helpApi({ body:{ action:'say', id:r.id, text } }) : await helpApi({ body:{ action:'open', text, page:document.title.slice(0, 60) } });
    BOT.help = d.item; BOT.mode = CW.el ? 'chat' : 'team'; BOT.seen = (d.item.msgs || []).length; if (CW.el) chatRender(); else botRender(); botSyncSoon();
  }catch(e){ toast(e.message || 'No pude enviar tu mensaje.'); }
}
function botSyncSoon(){ clearTimeout(BOT.poll); BOT.poll = setTimeout(botSync, 1500); }
async function botSync(){
  clearTimeout(BOT.poll);
  if (!ACC.ready || !B.SESS){ BOT.poll = setTimeout(botSync, 30000); return; }
  try{
    const d = await helpApi();
    const prev = BOT.help, mine = d.mine;
    if (mine){
      const newTeam = (mine.msgs || []).filter(m => m.from === 'team').length;
      let seenN = 0; try{ seenN = +localStorage.getItem('synthz:hseen:' + mine.id) || 0; }catch(e){}
      if (prev && prev.id === mine.id && prev.msgs) seenN = Math.max(seenN, prev.msgs.filter(m => m.from === 'team').length);
      if (newTeam > seenN){
        try{ localStorage.setItem('synthz:hseen:' + mine.id, String(newTeam)); }catch(e){}
        const m = mine.msgs.filter(x => x.from === 'team').pop();
        SND.expand(); botFace('dormida');
        if (!chatIsOpen()) botBubble(seenN ? m.name + ' (' + m.rank + ') te respondió.' : '¡Llegó ' + m.name + ' (' + m.rank + ')! Me tomo una siestita 😴 mientras te ayuda.', 7000);
        BOT.help = mine;
        if (!document.documentElement.classList.contains('guiding') && !document.querySelector('.szm')) chatOpen();
        else if (BOT.el){ const dot = $('.bdot', BOT.el); dot.hidden = false; }
      }
      if (prev && prev.status === 'open' && !prev.urgent && mine.urgent) botBubble('Estoy contactando a un Prime, ZFlow o Symmetrix… ¡ya casi!', 6000);
      BOT.help = mine;
    } else if (prev && prev.id){ BOT.help = Object.assign({}, prev, { status:'done' }); }
    BOT.team = !!d.team;
    if (d.team){
      const before = new Set(BOT.inbox.map(r => r.id + ':' + r.n));
      const fresh = (d.items || []).filter(r => r.status !== 'done' && !before.has(r.id + ':' + r.n) && !BOT.teamSeen[r.id + ':' + r.n]);
      BOT.inbox = d.items || [];
      fresh.forEach(r => { BOT.teamSeen[r.id + ':' + r.n] = 1; });
      if (fresh.length && BOT.synced){ SND.expand(); const r = fresh[0]; toast('@' + (r.user.username || r.user.name) + ' necesita ayuda: «' + r.text.slice(0, 60) + '»'); botBubble('@' + (r.user.username || r.user.name) + ' necesita ayuda. Toca para responder.', 7000); }
      BOT.synced = true;
      if (BOT.el){ const n = BOT.inbox.filter(r => r.status === 'open').length, dot = $('.bdot', BOT.el); dot.hidden = !n; dot.textContent = n || ''; }
      if (BOT.mode === 'reply' && BOT.cur){ const s = BOT.inbox.find(r => r.id === BOT.cur.id); if (s && s.n !== BOT.cur.msgs.length){ const x = await helpApi({ q:'?id=' + encodeURIComponent(BOT.cur.id) }); BOT.cur = x.item; } }
    }
    if (BOT.open) botRender();
    if (CW.el) chatRender();
  }catch(e){}
  const active = (BOT.help && BOT.help.status && BOT.help.status !== 'done') || BOT.team;
  /* sin conversación abierta no se pregunta cada rato (ahorra Redis): el «sigo aquí» de cada 3 min avisa si el equipo te escribió */
  if (!active){ BOT.poll = 0; return; }
  BOT.poll = setTimeout(botSync, document.hidden ? 60000 : BOT.open ? 8000 : 20000);
}
addEventListener('synthz-help-ping', () => { if (!BOT.poll) botSyncSoon(); });
async function botClick(e){
  const t = e.target;
  const bf = t.closest('[data-bf]'); if (bf){ const f = BOT_FAQ[+bf.dataset.bf]; BOT.hist.push({ role:'user', content:bf.textContent }); botRender(); await sleepRaw(300); return botAnswer(f); }
  const ba = t.closest('[data-ba]'); if (ba) return botAct(ba.dataset.ba);
  const tab = t.closest('[data-bt]'); if (tab){ BOT.mode = tab.dataset.bt === 'inbox' ? 'inbox' : 'chat'; return botRender(); }
  const bi = t.closest('[data-bi]'); if (bi){ try{ const d = await helpApi({ q:'?id=' + encodeURIComponent(bi.dataset.bi) }); BOT.cur = d.item; BOT.mode = 'reply'; botRender(); }catch(er){ toast(er.message); } return; }
  const b = t.closest('[data-b]'); if (!b) return;
  const k = b.dataset.b;
  if (k === 'min') botClose();
  else if (k === 'mic') botMic();
  else if (k === 'hide'){ botClose(); try{ sessionStorage.setItem('synthz:bothide', '1'); }catch(er){} const el = BOT.el; if (el && el.dataset.reactComponent === 'synthonia-avatar'){ el.classList.remove('on'); /* Deja BOT.el vivo hasta que React procese la retirada y el motor limpie listeners de posición. */ setTimeout(() => dispatchEvent(new Event('symphoria:hide-synthonIA')), 400); } else { BOT.el = null; if (el) setTimeout(() => el.remove(), 400); } toast('SynthonIA se escondió hasta que vuelvas a abrir la página.'); }
  else if (k === 'team') botTeam();
  else if (k === 'fb'){ botClose(); feedbackModal(); }
  else if (k === 'ia'){ BOT.mode = 'chat'; botRender(); }
  else if (k === 'back'){ BOT.mode = 'inbox'; botRender(); }
  else if (k === 'end' || k === 'done'){ const id = k === 'end' ? BOT.help && BOT.help.id : BOT.cur && BOT.cur.id; if (!id) return; try{ const d = await helpApi({ body:{ action:'close', id } }); if (k === 'end'){ BOT.help = d.item; botFace('feliz'); } else BOT.cur = d.item; botRender(); }catch(er){ toast(er.message); } }
}
