/* ---------- v3.0 · Planes (Chispa, Syntonia, Timeless y Orquesta) ----------
   Los pagos están APAGADOS (PENDIENTES.md › Plan de pagos): nadie puede pagar todavía y nada se cobra.
   Esta ventana solo muestra qué traerá cada plan y en cuál estás. Hoy todos están en Chispa (gratis, con las IAs gratis de siempre)
   y el equipo (Prime, ZFlow y Symmetrix) en Orquesta: sin límite de EnerX, búsquedas ni imágenes, y con los colores Aurora y Oro negro.
   El servidor es quien decide el límite (api/_pool.js › free); aquí solo se muestra. */
const PLANS = [
  { id:'chispa', n:'Chispa', p:'Gratis', c:'#e6b65f', L:['Las IAs gratis de hoy: Groq, Gemini Flash, Mistral y más', 'Tu EnerX diaria, que se carga a medianoche', 'Imágenes con límite, internet y memoria', 'Proyectos, Sintéticos y A.L.I.A.S.'] },
  { id:'syntonia', n:'Syntonia', p:'US$7,99 al mes', c:'#9fffd6', L:['Todo lo de Chispa con un límite mucho más amplio', '400 mensajes al mes con IAs pro (GPT, Claude, Grok, Gemini Pro)', '30 imágenes pro', 'Los colores Aurora y Oro negro'] },
  { id:'timeless', n:'Timeless', p:'US$17,99 al mes', c:'#a98bff', L:['Todo lo de Syntonia', '900 mensajes pro y 50 con lo más potente', '80 imágenes y 2 videos cortos', 'SynthFlow en WhatsApp y Telegram'] },
  { id:'orquesta', n:'Orquesta', p:'US$8,99 por persona', c:'#ffd27a', L:['Para equipos (desde 3 personas)', 'Lo de Syntonia para cada persona', 'Chats y panel de equipo', 'A.L.I.A.S. con 100 veces más pasos y búsquedas', 'Hoy lo usan Prime, ZFlow y Symmetrix, sin límites, para probar todo'] }
];
let szTeam = false; try{ szTeam = localStorage.getItem('synthz:team') === '1'; }catch(e){}
const planOf = () => szTeam ? 'orquesta' : 'chispa';
/* el equipo estrena los colores de pago (Aurora y Oro negro): se quita el «Pronto» y se vuelve a pintar el tema */
function planPerks(){
  THEMES.forEach(t => { if (t[0] === 'aurora' || t[0] === 'oro') t[3] = szTeam ? 0 : 1; });
  try{ cfgClasses(); }catch(e){}
}
planPerks();
addEventListener('synthz-szq', e => {
  const d = e.detail || {}; if (d.team == null) return;
  const t = !!d.team; if (t === szTeam) return;
  szTeam = t; try{ t ? localStorage.setItem('synthz:team', '1') : localStorage.removeItem('synthz:team'); }catch(er){}
  planPerks();
});
function plansModal(){
  if ($('#szPlans')) return;
  const me = planOf(), o = document.createElement('div'); o.id = 'szPlans'; o.className = 'szm';
  o.innerHTML = '<div class="tcard plans" role="dialog" aria-modal="true" aria-label="Planes de SymphorIA"><div class="word">' + zWord('Synth') + '</div><div class="tn">PLANES</div><div class="tb">'
    + '<h3>Elige cómo FlowIAr</h3><p>Las IAs gratis siempre van a estar. Los planes de pago llegan pronto: hoy nadie puede pagar y no se cobra nada. Toca «Me interesa» en el que quieras y sabremos cuál abrir primero.</p>'
    + '<div class="pl-grid">' + PLANS.map((P, i) => '<article class="pl-card' + (P.id === me ? ' me' : '') + '" style="--pc:' + P.c + ';--i:' + i + '"><header><b>' + esc(P.n) + '</b>' + (P.id === me ? '<em>Tu plan</em>' : '') + '</header><span class="pl-p">' + esc(P.p) + '</span><ul>' + P.L.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>'
      + (P.id === me ? '<span class="pl-on">Activo</span>' : P.id === 'chispa' ? '' : '<button type="button" class="pl-quiero" data-plan="' + P.id + '"></button><small class="pl-n" data-plan="' + P.id + '"></small>') + '</article>').join('') + '</div>'
    + '<form class="pl-correo" hidden novalidate><label for="plMail"></label><div><input id="plMail" type="email" autocomplete="email" inputmode="email" placeholder="Tu correo"><button type="submit" class="btn sm">Avísame</button></div><p class="pl-aviso" role="status"></p></form>'
    + '<p class="cnote">' + (me === 'orquesta' ? 'Eres del equipo: tienes todo como en Orquesta para probar la página: sin límite de EnerX, imágenes y búsquedas sin tope propio, A.L.I.A.S. (menú «⋯») y los colores Aurora y Oro negro.' : 'Cuando lleguen los pagos verás aquí cuánto te queda de cada cosa, y podrás cancelar con un clic.') + '</p>'
    + '<div class="tbtn"><button class="btn sm" type="button" data-close>Listo</button></div></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  plansDoor(o);
  $('[data-close]', o).addEventListener('click', close); o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  addEventListener('keydown', function k(e){ if (e.key === 'Escape'){ close(); removeEventListener('keydown', k); } });
}

/* v3.8 · Fase 3 · los planes de pago son una puerta falsa: «Me interesa» cuenta el interés (y deja un correo opcional)
   en el mismo lugar que los votos de «El laboratorio» de la portada (api/config.js › puertas). Nunca se cobra nada. */
const PL_VK = 'synthz:puertas';
let plCuentas = {};
function plansDoor(o){
  let votos = {}; try{ votos = JSON.parse(localStorage.getItem(PL_VK) || '{}') || {}; }catch(e){}
  let ultimo = '';
  const nom = id => (PLANS.find(P => P.id === id) || {}).n || '';
  const pinta = () => {
    $$('.pl-quiero', o).forEach(b => { const k = 'plan-' + b.dataset.plan, si = !!votos[k];
      b.textContent = si ? '✓ Te avisamos' : '✦ Me interesa'; b.classList.toggle('si', si); b.setAttribute('aria-pressed', si); });
    $$('.pl-n', o).forEach(s => { const n = plCuentas['plan-' + s.dataset.plan] || 0; s.textContent = n ? (n === 1 ? '1 persona lo quiere' : n + ' personas lo quieren') : ''; });
  };
  pinta();
  fetch('/api/config?puertas=1').then(r => r.ok ? r.json() : null).then(d => { if (d && d.puertas){ plCuentas = d.puertas; pinta(); } }).catch(() => {});
  const manda = (id, email) => fetch('/api/config', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ action:'puerta', id, email:email || undefined, lang:(window.SZ && SZ.lang && SZ.lang()) || 'es' }) })
    .then(r => r.ok ? r.json() : Promise.reject()).then(d => { if (d && typeof d.n === 'number'){ plCuentas[id] = Math.max(d.n, plCuentas[id] || 0); pinta(); } return true; });
  const f = $('.pl-correo', o), av = $('.pl-aviso', f);
  o.addEventListener('click', e => {
    const b = e.target.closest('.pl-quiero'); if (!b) return;
    const id = 'plan-' + b.dataset.plan; ultimo = id;
    if (!votos[id]){
      votos[id] = Date.now(); try{ localStorage.setItem(PL_VK, JSON.stringify(votos)); }catch(er){}
      plCuentas[id] = (plCuentas[id] || 0) + 1; pinta();
      const r = b.getBoundingClientRect(); try{ if (!document.documentElement.classList.contains('noanim')) burst(r.left + r.width / 2, r.top + r.height / 2, ['#ffd27a', '#9fffd6', '#a98bff', '#ff3d9a'], 22); }catch(er){}
      manda(id).catch(() => {});
    }
    $('label', f).textContent = '¿Te escribimos cuando abra ' + nom(b.dataset.plan) + '? (opcional)';
    av.textContent = ''; f.hidden = false; $('input', f).focus({ preventScroll:true });
  });
  f.addEventListener('submit', e => {
    e.preventDefault(); const c = $('input', f).value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)){ av.textContent = 'Ese correo no parece válido.'; return; }
    av.textContent = '…';
    manda(ultimo, c).then(() => { av.textContent = 'Listo: te escribimos solo cuando abra. Nada se cobra.'; $('input', f).value = ''; }).catch(() => { av.textContent = 'No pudimos guardarlo ahora. Intenta más tarde.'; });
  });
}
