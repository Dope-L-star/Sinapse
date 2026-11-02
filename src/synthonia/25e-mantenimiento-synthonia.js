/* ---------- v2.3 · aviso de mantenimiento: cubre la página y SynthonIA (la de verdad) charla un rato ----------
   Lo encienden Prime o ZFlow en Pulsem › Ajustes. Pulsem nunca se cubre (desde ahí se apaga).
   SynthonIA cambia de cara según lo que le dicen: con cariño se encanta, con chistes se ríe, si piensa pone cara de pensar.
   Si la IA no responde (puede ser justo la falla), contesta con frases propias para que la charla nunca se corte. */
const MT = { el:null, hist:[], timer:0, mood:'feliz', busy:false, since:0, idle:0 };
const MT_LOVE = /(gracias|te quiero|te amo|te adoro|eres (muy |la |una )?(linda|bonita|hermosa|genial|la mejor|incre[ií]ble|tierna|buena|top)|qu[eé] (linda|bonita|tierna|genial)|me (caes|encantas|gustas)|eres lo m[aá]ximo|abrazo|besito|❤|♥|💖|😍|🥰)/i;
const MT_FUN = /(ja(ja)+|je(je)+|xd|😂|🤣|chiste|gracios)/i;
const MT_SAD = /(fe[ao]|odio|aburr|mala|lent[ao]|demora|cu[aá]ndo vuelve)/i;
/* v3.7 · falta de respeto: ya no pide perdón; pone el límite con firmeza y elegancia (el servidor responde igual, sin gastar IA) */
const MT_RUDE = /\b(idiota|est[uú]pid[ao]|imb[eé]cil|pendej[ao]|malparid[ao]|gonorrea|hijueputa|hp|hdp|puta|maric[oó]n|perra|zorra|mierda|c[aá]llate|idiot|stupid|moron|bitch|fuck\w*|shit\w*|asshole|shut up)\b|\b(eres|you'?re|you are)\s+(una?\s+|muy\s+|so\s+|a\s+)?(tonta|in[uú]til|basura|fea|dumb|useless|trash|ugly)\b/i;
const mtOff = () => /pulsem/.test(location.pathname);
const mtAdmin = () => !!(ACC && ACC.user && ['owner', 'admin'].includes(ACC.user.role));
const mtTeam = () => !!(ACC && ACC.user && ['owner', 'admin', 'staff'].includes(ACC.user.role));
const mtSkipped = () => { try{ return sessionStorage.getItem('synthz:mtskip') === '1'; }catch(e){ return false; } };

/* frases propias por si la IA no está (la falla puede ser justo esa) */
const MT_LOCAL = {
  love:['¡Ay, me sonrojé! 💛 Gracias, de verdad. Tú también eres lo máximo.', '¡Me hiciste el día! Ya casi vuelvo con todo, gracias por esperarme.', 'Awww 🥰 Con gente como tú da gusto arreglar cosas.'],
  fun:['¡Jajaja! Me dio risa hasta en los circuitos.', 'Jaja, ¿te sabes otro? Mientras tanto el equipo sigue arreglando.', '¡Me hiciste reír! Eso me recarga más que la electricidad.'],
  rude:['Así no. Con respeto te ayudo en lo que quieras.', 'Ese tono no va conmigo. Si quieres seguimos, pero con respeto.'],
  sad:['Uy… tienes razón en estar molesto. Estamos trabajando para que vuelva pronto y mejor.', 'Perdón por la espera. El equipo está en ello, te lo prometo.'],
  any:['¡Te escucho! Ahora mismo no puedo pensar muy profundo porque estamos arreglando cosas, pero aquí sigo contigo.', 'Mientras se arregla todo, cuéntame: ¿qué es lo primero que quieres hacer cuando vuelva SynthFlow?', 'Buena pregunta. En cuanto termine el mantenimiento te respondo mejor. ¿Me cuentas algo más?']
};
const mtPick = L => L[Math.floor(Math.random() * L.length)];
const mtKind = q => MT_RUDE.test(q) ? 'rude' : MT_LOVE.test(q) ? 'love' : MT_FUN.test(q) ? 'fun' : MT_SAD.test(q) ? 'sad' : 'any';
const MT_MOOD_OF = { love:'encantada', fun:'riendo', sad:'disculpa', rude:'neutral', any:'feliz' };

function mtSetMood(m, hop){
  if (!MT.el) return;
  MT.mood = FACE[m] ? m : 'feliz';
  const w = $('.mt-face', MT.el); w.innerHTML = face(MT.mood, 168, 'mt-sz');
  if (hop && !reduce) w.animate([{ transform:'translateY(0) scale(1)' }, { transform:'translateY(-18px) scale(1.06)' }, { transform:'translateY(0) scale(.97)' }, { transform:'none' }], { duration:620, easing:'cubic-bezier(.3,1.6,.5,1)' });
}
function mtBurst(kind){
  if (!MT.el || reduce) return;
  const box = $('.mt-face', MT.el), ch = kind === 'love' ? ['💛', '💖', '✨', '💗'] : ['✨', '⭐', '😄'];
  for (let i = 0; i < 9; i++){
    const s = document.createElement('i'); s.className = 'mt-pt'; s.textContent = ch[i % ch.length];
    const a = (Math.PI * 2 * i) / 9 + Math.random() * .5, d = 70 + Math.random() * 60;
    box.appendChild(s);
    s.animate([{ transform:'translate(-50%,-50%) scale(.4)', opacity:0 }, { opacity:1, offset:.2 }, { transform:'translate(calc(-50% + ' + Math.cos(a) * d + 'px), calc(-50% + ' + (Math.sin(a) * d - 30) + 'px)) scale(1.15)', opacity:0 }], { duration:1300 + Math.random() * 500, easing:'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
  }
}
function mtAdd(role, text, mood){
  const L = $('.mt-msgs', MT.el), d = document.createElement('div');
  d.className = 'mt-m ' + (role === 'user' ? 'me' : 'ia');
  d.innerHTML = '<p></p>'; $('p', d).textContent = text; L.appendChild(d);
  L.scrollTo({ top:L.scrollHeight, behavior:reduce ? 'auto' : 'smooth' });
  MT.hist.push({ role, content:text });
  if (role !== 'user'){
    if (mood) mtSetMood(mood);
    typeIn($('p', d), { cps:42, max:4, onFrame:lipSync([$('.mt-face .szface', MT.el)], text) }).catch(() => {});
  }
}
async function mtSend(q){
  q = String(q || '').trim(); if (!q || MT.busy) return;
  const inp = $('.mt-in', MT.el); inp.value = '';
  mtAdd('user', q);
  const kind = mtKind(q);
  if (kind === 'love' || kind === 'fun'){ mtSetMood(MT_MOOD_OF[kind], true); mtBurst(kind); try{ SND.flow(); }catch(e){} }
  else mtSetMood('pensando');
  MT.busy = true; $('.mt-send', MT.el).disabled = true; MT.el.classList.add('thinking');
  let text = '', mood = MT_MOOD_OF[kind];
  try{
    const r = await fetch('/api/help', { method:'POST', headers:Object.assign({ 'content-type':'application/json' }, B.SESS ? { authorization:'Bearer ' + B.SESS } : {}), body:JSON.stringify({ action:'ask', ctx:'maint', q, lang:B.LANG, hist:MT.hist.slice(-7, -1) }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.text){ text = d.text; if (d.mood && FACE[d.mood]) mood = d.mood; }
  }catch(e){}
  if (!text) text = mtPick(MT_LOCAL[kind]);
  await sleepRaw(kind === 'love' ? 650 : 250);
  MT.busy = false; $('.mt-send', MT.el).disabled = false; MT.el.classList.remove('thinking');
  mtAdd('assistant', text, mood);
  clearTimeout(MT.back); MT.back = setTimeout(() => { if (MT.el && !MT.busy) mtSetMood('feliz'); }, 7000);
}
function mtExit(){
  const x = MT.el && $('.mt-exit', MT.el); if (!x) return;
  x.hidden = !mtAdmin();
  /* «Iniciar sesión»: se va si ya hay cuenta; si es del equipo aparece «Ir a Pulsem» (desde ahí se apaga el mantenimiento) */
  const lg = $('.mt-login', MT.el), box = $('.mt-auth', MT.el), pu = $('.mt-pulsem', MT.el), on = !!(ACC && ACC.user);
  if (lg) lg.hidden = on; if (box && on) box.hidden = true; if (pu) pu.hidden = !mtTeam();
}
function mtAgo(){
  if (!MT.el || !MT.since) return;
  const m = Math.max(1, Math.round((Date.now() - MT.since) / 60e3));
  $('.mt-ago', MT.el).textContent = m < 60 ? 'Trabajando en ello desde hace ' + m + ' min' : 'Trabajando en ello desde hace ' + Math.round(m / 60) + ' h';
}
function mtOpen(m){
  MT.since = m.t || MT.since || Date.now();
  if (MT.el){ $('.mt-text', MT.el).textContent = m.text; mtAgo(); return; }
  const el = document.createElement('div');
  el.id = 'szMaint'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'SymphorIA está en mantenimiento');
  el.innerHTML = '<div class="mt-bg" aria-hidden="true"><i></i><i></i><i></i></div>'
    + '<div class="mt-wrap"><div class="mt-face" title="¡Tócame!"></div>'
    + '<div class="mt-head"><span class="mt-chip"><i></i>Mantenimiento</span><h2>Volvemos en un momento</h2><p class="mt-text"></p><small class="mt-ago"></small></div>'
    + '<div class="mt-chat"><div class="mt-msgs" aria-live="polite"></div>'
    + '<div class="mt-sugs">' + ['Cuéntame un chiste', '¿Qué estás arreglando?', 'Eres la mejor 💛'].map(s => '<button type="button" class="mt-sug">' + esc(s) + '</button>').join('') + '</div>'
    + '<form class="mt-form" autocomplete="off"><input class="mt-in" maxlength="300" placeholder="Charla con SynthonIA…" aria-label="Escribir a SynthonIA"><button class="mt-send" type="submit" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></form></div>'
    + '<div class="mt-acct"><button class="mt-login" type="button"><span>Iniciar sesión</span></button><div class="mt-auth" hidden></div>'
    + '<a class="mt-pulsem" href="/pulsem" hidden><span>Ir a Pulsem</span><small>Ahí se activa y se desactiva el mantenimiento</small></a></div>'
    + '<button class="mt-exit" type="button" hidden>Entrar igual · solo Prime y ZFlow</button></div>';
  document.body.appendChild(el); document.documentElement.classList.add('mt-on');
  MT.el = el;
  $('.mt-text', el).textContent = m.text;
  mtSetMood('feliz'); mtAgo(); mtExit();
  $('.mt-form', el).addEventListener('submit', e => { e.preventDefault(); mtSend($('.mt-in', el).value); });
  $('.mt-sugs', el).addEventListener('click', e => { const b = e.target.closest('.mt-sug'); if (b){ mtSend(b.textContent); b.remove(); } });
  $('.mt-face', el).addEventListener('click', () => { const k = MT.mood === 'riendo' ? 'encantada' : 'riendo'; mtSetMood(k, true); mtBurst(k === 'encantada' ? 'love' : 'fun'); });
  $('.mt-login', el).addEventListener('click', () => {
    const box = $('.mt-auth', el), open = box.hidden;
    box.hidden = !open; el.classList.toggle('mt-authing', open);
    if (open){
      if (!box.firstChild) authBox(box, () => { box.hidden = true; el.classList.remove('mt-authing'); mtExit(); }, () => {}, 'login');
      if (!reduce) box.animate([{ opacity:0, transform:'translateY(10px)' }, { opacity:1, transform:'none' }], { duration:360, easing:'cubic-bezier(.22,1,.36,1)' });
      setTimeout(() => { const i = $('input', box); if (i) i.focus({ preventScroll:true }); }, 120);
    }
  });
  $('.mt-exit', el).addEventListener('click', () => { try{ sessionStorage.setItem('synthz:mtskip', '1'); }catch(e){} mtClose(); });
  if (!reduce) el.animate([{ opacity:0 }, { opacity:1 }], { duration:500 });
  setTimeout(() => { if (MT.el && !MT.hist.length) mtAdd('assistant', '¡Hola! Soy SynthonIA. Estamos dejando todo mejor para ti. Mientras tanto, ¿charlamos un rato?', 'feliz'); }, 650);
  /* de vez en cuando hace un gesto, para que se sienta viva */
  clearInterval(MT.idle); MT.idle = setInterval(() => { if (MT.el && !MT.busy && MT.mood === 'feliz' && !document.hidden){ const g = mtPick(['guino', 'flow', 'riendo']); mtSetMood(g); setTimeout(() => { if (MT.el && MT.mood === g) mtSetMood('feliz'); }, 1800); } }, 9000);
  if (matchMedia('(hover:hover)').matches) setTimeout(() => { const i = MT.el && $('.mt-in', MT.el); if (i) i.focus({ preventScroll:true }); }, 500);
}
function mtClose(){
  if (!MT.el) return;
  const el = MT.el; MT.el = null; clearInterval(MT.idle);
  document.documentElement.classList.remove('mt-on');
  if (reduce) el.remove(); else el.animate([{ opacity:1 }, { opacity:0 }], { duration:380 }).onfinish = () => el.remove();
}
async function mtCheck(){
  try{
    const r = await fetch('/api/config', { cache:'no-store' }); if (!r.ok) return;
    const m = (await r.json()).maint || {};
    if (m.on && !mtSkipped()) mtOpen({ text:m.text || 'Estamos presentando fallas o actualizaciones. Espera un momento.', t:m.t });
    else if (!m.on){ mtClose(); try{ sessionStorage.removeItem('synthz:mtskip'); }catch(e){} }
  }catch(e){}
}
if (!mtOff()){
  /* v3.7 · costo cero: con el aviso encendido se revisa cada 45 s (para saber cuándo termina); apagado, cada 5 min */
  let mtLast = 0;
  const go = () => { mtCheck(); mtLast = Date.now(); MT.timer = setInterval(() => { mtAgo(); if (document.hidden) return; if (MT.el || Date.now() - mtLast > 300000){ mtLast = Date.now(); mtCheck(); } }, 45000); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  addEventListener('synthz-acc', mtExit); accHooks.push(() => setTimeout(mtExit, 0));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) mtCheck(); });
}
