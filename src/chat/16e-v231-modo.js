/* ---------- v2.3.1 · modo de uso: Automática · Chat · SuperiorSynth ----------
   Automática: Sinapse elige sola la IA y no se muestra el selector.  Chat: eliges tú la IA (empieza en Gemini).
   Apex: el agente elige la IA; cuando la persona dice «me quedo con esta» pasa a Chat con esa IA al lado.
   El modo se deduce del estado (agente encendido, IA elegida), así que sigue funcionando con todo lo que ya cambia de IA. */
const MODES = {
  auto:  { n:'Automática',   d:'Elige sola la mejor IA para cada pedido.',          ico:'<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>' },
  chat:  { n:'Chat',         d:'Tú eliges con qué IA hablas.',                       ico:'<path d="M4 5h16v11H9l-5 4z"/>' },
  agent: { n:'Apex', d:'Tareas largas: elige la IA y mejora tu pedido.',   ico:'<path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/>' }
};
const MODE_KEYS = ['auto', 'chat', 'agent'];
const modeSvg = k => k === 'agent' && typeof ssIco === 'function' ? ssIco() : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + MODES[k].ico + '</svg>';
function modeKey(){ if (agentOn()) return 'agent'; return selId() === 'sz:auto' ? 'auto' : 'chat'; }   /* «Automática» es solo un modo; en Chat siempre hay una IA concreta */
/* la IA con la que empieza «Chat»: Gemini (la más nueva que esté disponible y gratis); si no hay, la que ya tenías */
function geminiDefault(){
  const g = (cat.list || []).filter(m => /gemini/i.test(m.id + ' ' + m.name) && !/embed|image|tts|live|audio/i.test(m.id)), pool = g.filter(m => connected(m.id));
  const best = (pool.length ? pool : g).slice().sort((a, b) => (b.free - a.free) || (b.created - a.created))[0];
  if (best) return best.id;
  const s = (st().models.openrouter || []).find(x => /gemini/i.test(x) && connected(x)); if (s) return s;
  const any = (cat.list || []).filter(m => m.id !== 'sz:auto' && connected(m.id)).sort((a, b) => (b.free - a.free) || (b.created - a.created))[0];   /* sin Gemini: cualquier IA concreta que esté disponible */
  return any ? any.id : '';
}
function setModel(id){ st().model.openrouter = id; st().pinned = id; save(); }
function applyMode(k){
  if (k === modeKey()) return;
  const sx = st().sx;
  if (k === 'agent'){ setAgent(true); return; }
  if (agentOn()) setAgent(false);
  if (k === 'auto'){ const cur = selId(); if (cur !== 'sz:auto') sx.lastChat = cur; sx.cmode = 'auto'; st().pinned = ''; st().model.openrouter = 'sz:auto'; }
  else { sx.cmode = 'chat'; const want = (sx.lastChat && connected(sx.lastChat) ? sx.lastChat : '') || geminiDefault(); if (want && want !== selId()) setModel(want); }
  save(); paintMode(); try{ paintSel(); renderTop(true); renderMsgs(); updateHint(); }catch(e){}
  toast(k === 'auto' ? 'Modo Automática: Sinapse elige la IA por ti.' : 'Modo Chat: tú eliges la IA (' + info(selId()).name + ').');
}
function paintMode(){
  const k = modeKey(), b = $('#cMode'); if (!b) return;
  document.body.dataset.cmode = k; $('#cModeL').textContent = MODES[k].n; $('#cModeI').innerHTML = modeSvg(k); b.title = 'Modo: ' + MODES[k].n;
}
(function modos(){
  const btn = $('#cMode'), menu = $('#modeMenu'); if (!btn || !menu) return;
  function paint(){ const k = modeKey(); menu.innerHTML = MODE_KEYS.map(x => '<button type="button" role="menuitemradio" data-mode="' + x + '" aria-checked="' + (x === k) + '"><i aria-hidden="true">' + modeSvg(x) + '</i><span><b>' + MODES[x].n + '</b><small>' + MODES[x].d + '</small></span>' + (x === k ? '<em class="ck">✓</em>' : '') + '</button>').join(''); }
  function place(){ const r = btn.getBoundingClientRect(), w = Math.min(300, innerWidth - 16); menu.style.width = w + 'px'; menu.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px'; menu.style.bottom = (innerHeight - r.top + 10) + 'px'; }
  function open(on){ menu.hidden = !on; btn.setAttribute('aria-expanded', String(on)); if (on){ paint(); place(); const c = $('[aria-checked="true"]', menu); if (c) c.focus(); } }
  btn.addEventListener('click', e => { e.stopPropagation(); open(menu.hidden); });
  menu.addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (!b) return; open(false); applyMode(b.dataset.mode); btn.focus(); });
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) open(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden){ open(false); btn.focus(); } });
  addEventListener('resize', () => { if (!menu.hidden) place(); });
  paintMode();
})();
