/* ---------- 2026-11-09 · aviso grande al elegir una IA de alto consumo (pedido de Sammuel) ----------
   «Que cada vez que elijan modelos de alto consumo, como Claude Fable, les salte un anuncio gigante que les avise».
   Sale cada vez que eliges a mano una de esas IAs (antes era un aviso chiquito, una vez por visita). No bloquea:
   «Usarla igual» la deja elegida y «Elegir otra» vuelve a la lista. Habla de EnerX, nunca de mensajes. ES/EN. */
const PT_CARAS = /claude|fable|opus|sonnet|gpt-5|gpt-4\.5|\bo1\b|\bo3\b|o1-pro|o3-pro|grok-4|gemini[- ]?(2\.5|3)[- ]?pro|deep[- ]?research/i;
function ptEsCara(mm){ return !!mm && !mm.free && (mm.spend === 3 || PT_CARAS.test((mm.id || '') + ' ' + (mm.name || ''))); }
function ptAvisoConsumo(mm, alVolver){
  if (!mm || document.getElementById('ptAviso')) return;
  const en = SZ.lang && SZ.lang() === 'en';
  const T = en
    ? { k:'HEADS UP · HIGH-CONSUMPTION AI', t:mm.name + ' uses a lot of energy', p:'It is one of the most powerful AIs, so each answer spends much more EnerX (or credit on your own key) than a normal one. Use it for hard tasks; for simple things, Auto picks a lighter AI and your energy lasts longer.', si:'Use it anyway', no:'Pick another AI' }
    : { k:'OJO · IA DE ALTO CONSUMO', t:mm.name + ' gasta mucha energía', p:'Es de las IAs más potentes, así que cada respuesta gasta mucha más EnerX (o saldo de tu llave) que una normal. Úsala para tareas difíciles; para lo sencillo, Auto elige una IA más liviana y tu energía te dura más.', si:'Usarla igual', no:'Elegir otra IA' };
  const o = document.createElement('div');
  o.id = 'ptAviso'; o.className = 'pt-aviso'; o.setAttribute('role', 'alertdialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'ptAvisoT');
  o.innerHTML = '<div class="pt-av-card"><div class="pt-av-bat" aria-hidden="true"><i></i></div><p class="pt-av-k">' + esc(T.k) + '</p><h2 id="ptAvisoT">' + esc(T.t) + '</h2><p class="pt-av-p">' + esc(T.p) + '</p>'
    + '<div class="pt-av-b"><button type="button" class="pt-av-no">' + esc(T.no) + '</button><button type="button" class="pt-av-si">' + esc(T.si) + '</button></div></div>';
  const cerrar = () => { o.classList.add('fuera'); setTimeout(() => o.remove(), 220); document.removeEventListener('keydown', tecla); };
  const tecla = e => { if (e.key === 'Escape') cerrar(); };
  o.addEventListener('click', e => {
    if (e.target === o || e.target.closest('.pt-av-si')) cerrar();
    else if (e.target.closest('.pt-av-no')){ cerrar(); if (typeof alVolver === 'function') setTimeout(alVolver, 240); }
  });
  document.addEventListener('keydown', tecla);
  document.body.appendChild(o);
  setTimeout(() => { const b = o.querySelector('.pt-av-si'); if (b) b.focus(); }, 60);
}
