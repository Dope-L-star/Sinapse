/* ---------- icono de la pestaña: la S de vidrio (SymphorIA) o la F de corriente (SynthFlow) ---------- */
function cradleAngles(t, A){
  const u = (t % 1150) / 1150, out = x => 1 - Math.pow(1 - x, 2.4), inn = x => Math.pow(x, 2.4);
  const L = u < .25 ? out(u / .25) : u < .5 ? 1 - inn((u - .25) / .25) : 0;
  const R = u >= .5 && u < .75 ? out((u - .5) / .25) : u >= .75 ? 1 - inn((u - .75) / .25) : 0;
  return [L * A, -R * A];
}
(function favCradle(){
  const link = document.getElementById('favi'); if (!link) return;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); if (!g) return;
  /* v4.4 · SynthFlow: la F de corriente (media/v44/synthflow.svg); la chispa de la punta late un poquito */
  const fimg = new Image(); fimg.src = 'media/v44/synthflow.svg'; fimg.onload = () => { if (isFlow()) drawFlow(performance.now()); };
  const drawFlow = now => {
    if (!fimg.complete || !fimg.naturalWidth) return;
    g.clearRect(0, 0, 64, 64);
    const ph = now ? now / 700 : 0, dy = Math.sin(ph) * 1.2;
    g.drawImage(fimg, -2, -2 + dy, 68, 68);
    const r = 5 + Math.sin(ph * 1.7) * 1.6, sp = g.createRadialGradient(55, 10 + dy, 0, 55, 10 + dy, r);
    sp.addColorStop(0, 'rgba(255,255,255,.95)'); sp.addColorStop(.4, 'rgba(255,233,168,.6)'); sp.addColorStop(1, 'rgba(255,200,87,0)');
    g.fillStyle = sp; g.beginPath(); g.arc(55, 10 + dy, r, 0, Math.PI * 2); g.fill();
    try{ link.href = c.toDataURL('image/png'); }catch(e){}
  };
  /* SymphorIA: la Z de vidrio del boceto, quieta */
  const draw = now => { if (isFlow()) return drawFlow(now); if (link.getAttribute('href') !== 'media/v30/fav-s.png') link.href = 'media/v30/fav-s.png'; };
  let last = 0;
  let on = false;
  /* v2.9: solo la esfera de SynthFlow se mueve, y a ~8 cuadros por segundo (cada cuadro es una imagen PNG nueva: a 20 por
     segundo pesaba). La Z de Sinapse es quieta: se pone una vez y el ciclo no corre */
  const tick = now => { if (!CFG.favAnim || !isFlow()){ on = false; draw(0); return; } if (now - last > 120){ last = now; draw(now); } requestAnimationFrame(tick); };
  window.__favStart = () => { if (!on){ on = true; requestAnimationFrame(tick); } };
  window.__favStart();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw(CFG.favAnim ? performance.now() : 0));
  setInterval(() => { if (document.hidden && CFG.favAnim) draw(performance.now()); }, 500);
})();

const total = id => { const u = state.usage[id]; return u ? (u.prompt || 0) + (u.completion || 0) : 0; };
const counted = new Set();
/* o: { est:true si es una estimación, free:true si fue a un modelo gratis, rid: id único de la petición } */
function addUsage(id, p = 0, c = 0, countReq = true, o = {}){
  if (!byId(id)) return false;
  if (o.rid){ if (counted.has(o.rid)) return false; counted.add(o.rid); }          /* la misma petición nunca cuenta dos veces */
  p = num(p); c = num(c);
  syncLedger();
  const L = state.ledger, mine = L.dev[DEV] || (L.dev[DEV] = {}), s = mine[id] || (mine[id] = cleanRow({})), d = today();
  s.p += p; s.c += c; s.days[d] = (s.days[d] || 0) + p + c;
  if (o.est){ s.e += p + c; s.de[d] = (s.de[d] || 0) + p + c; }
  if (countReq){ s.r += 1; s.rd[d] = (s.rd[d] || 0) + 1; if (o.free) s.fd[d] = (s.fd[d] || 0) + 1; }
  state.usage = usageOf(L);
  save(); hooks.usage();
  return true;
}
/* «Reiniciar contadores»: empieza una época nueva; los demás dispositivos la respetan al sincronizar */
function resetUsage(){ state.ledger = { ep:Date.now(), dev:{} }; state.usage = {}; writeLedger(); save(); hooks.usage(); }
/* otra pestaña sumó o guardó: lo traemos para no pisarlo */
addEventListener('storage', e => {
  if (e.key === LKEY){ syncLedger(); hooks.usage(); return; }
  if (e.key === KEY && e.newValue){
    try{ const o = JSON.parse(e.newValue); ['fav', 'cmp', 'model', 'models', 'keys', 'threads', 'pinned', 'del', 'arena', 'survey', 'useTeam', 'battle', 'syncKey', 'sx'].forEach(k => { if (k in o) state[k] = o[k]; }); normalizeLite(); hooks.chats(); hooks.usage(); }catch(_){}
  }
});
function normalizeLite(){ state.keys = cleanStrMap(state.keys); state.model = cleanStrMap(state.model); state.models = cleanModels(state.models); state.fav = strList(state.fav, 300); state.cmp = strList(state.cmp, 4); }

/* ---------- avisos ---------- */
let toastT;
function toast(msg){
  let t = $('#toast');
  if (!t){ t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200);
}
function hydrateIcons(scope){
  $$('[data-ico]', scope || document).forEach(el => {
    const p = byId(el.dataset.ico); if (!p) return;
    const t = document.createElement('template'); t.innerHTML = ico(p).trim();
    const n = t.content.firstChild; if (el.id) n.id = el.id;
    el.replaceWith(n);
  });
}

