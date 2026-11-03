/* ---------- v2.1 · memoria: SynthFlow recuerda lo que tú le pides (tu nombre, a qué te dedicas, cómo te gustan las respuestas)
   Solo guarda lo que tú apruebas, lo ves y lo borras cuando quieras. Con cuenta, te sigue a todos tus equipos. ---------- */
const MEM_RX = /\b(recuerda|recu[eé]rdalo|acu[eé]rdate|no (te )?olvides|ten en cuenta|guarda en tu memoria)\b\s*(que|de|esto|:)?\s*/i;
const memSt = () => st().mem || (st().mem = { on:true, t:0, items:[] });
function memAdd(text){ return SZ.memAddCore(text); }
/* lo que la IA recibe (solo si la memoria está encendida) */
function memSystem(){ const m = memSt(); if (!m.on || !m.items.length) return ''; return 'Datos que la persona te pidió recordar (úsalos cuando sirvan, sin repetirlos todo el tiempo): ' + m.items.slice(0, 25).map(x => '- ' + x.text).join(' '); }
/* «¿Quieres que lo recuerde?» después de un mensaje que lo pide */
function memOffer(text){
  const i = text.search(MEM_RX); if (i < 0) return;
  /* v4.0 · el dato lo redacta la IA ([recordar: …]); si no lo dio, se limpia aquí (tercera persona, sin «recuerda que») */
  const ai = memNext; memNext = null;
  if (ai === '?') return;   /* la IA no entendió qué recordar y te lo preguntó: no se ofrece guardar nada todavía */
  let fact = ai && ai.length >= 3 ? ai : text.slice(i).replace(MEM_RX, '').replace(/^[,.:;\s]+/, '').split(/(?<=[.!?])\s/)[0].trim();
  if (fact.length < 3) fact = text.trim();
  fact = (ai && ai.length >= 3 ? fact : memLimpia(fact)).slice(0, 300); if (fact.length < 3) return;
  $$('.memoff', lane).forEach(x => x.remove());
  const d = document.createElement('div'); d.className = 'agkeep memoff';
  d.innerHTML = '<span>¿Quieres que lo recuerde para tus próximos chats? «<b></b>»</span><div class="agk-b"><button type="button" class="btn sm" data-mm="yes">Recordar</button><button type="button" class="btn sm ghost" data-mm="no">No</button></div><small>Lo ves y lo borras cuando quieras en Ajustes › IAs y memoria.</small>';
  $('span b', d).textContent = fact; lane.appendChild(d); follow();
  d.addEventListener('click', e => { const b = e.target.closest('[data-mm]'); if (!b) return; d.remove(); if (b.dataset.mm === 'yes' && memAdd(fact)) toast('¡Listo! Lo voy a recordar.'); });
}
/* v2.2 · «Lo que recuerdo de ti» vive en Ajustes › IAs y memoria */
function memModal(){ SZ.cfgModal('mem'); }
