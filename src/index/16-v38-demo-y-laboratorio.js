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
