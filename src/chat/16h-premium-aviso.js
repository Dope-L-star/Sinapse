/* ---------- v4.3 · Chispa+ · aviso GRANDE al elegir un modelo premium de alto consumo (Sammuel, 9 nov) ----------
   Cuando alguien con Chispa+ elige un modelo caro (Claude Fable/Opus, GPT pro, Gemini Pro…) sale una tarjeta grande que dice cuánto
   gasta y hay que aceptarla. Sale CADA VEZ que se elige uno de esos. Hoy no sale nunca: la premium está apagada (api/_premium.js)
   y la lista de IAs aún no trae modelos con m.premium && m.heavy. pickModel() la llama antes de cambiar de IA. */
let premiumAvisoAbierto = false;
function premiumAviso(m){
  return new Promise(res => {
    if (premiumAvisoAbierto) return res(false);
    premiumAvisoAbierto = true;
    const en = SZ.lang() === 'en', N = Math.max(2, Math.round(+m.mult || 2)), usd = +m.usdMsg || 0;
    const Q = SZ.SZQ, left = Q && Number.isFinite(+Q.credit) ? Math.max(0, +Q.credit) : null;
    const pct = left ? Math.min(100, Math.max(1, Math.round(usd / left * 100))) : null;
    const veces = left && usd ? Math.floor(left / usd) : null;
    const T = en ? {
      tag:'HIGH USAGE', h:m.name + ' uses a lot', p:'This is one of the most powerful (and expensive) AIs. It is worth it for hard tasks; for everyday questions a lighter one gives the same answer and your EnerX lasts longer.',
      a:'Uses your EnerX ' + N + '× faster', b:pct ? 'Each answer uses about ' + pct + '% of the premium credit you have left' : 'Each answer uses part of your monthly premium credit',
      c:veces != null ? 'With what you have left: about ' + veces + ' answers' : 'When your credit runs out, you keep the free AIs', ok:'Use it anyway', no:'Pick a lighter one' } : {
      tag:'ALTO CONSUMO', h:m.name + ' gasta mucho', p:'Es una de las IAs más potentes (y caras). Vale la pena para tareas difíciles; para lo de todos los días una más liviana te da la misma respuesta y tu EnerX dura más.',
      a:'Gasta tu EnerX ' + N + ' veces más rápido', b:pct ? 'Cada respuesta usa cerca del ' + pct + ' % del crédito premium que te queda' : 'Cada respuesta usa parte de tu crédito premium del mes',
      c:veces != null ? 'Con lo que te queda: unas ' + veces + ' respuestas' : 'Si se acaba el crédito, sigues con las IAs gratis', ok:'Usarla igual', no:'Elegir una más liviana' };
    const o = document.createElement('div'); o.className = 'pav'; o.id = 'premiumAviso';
    o.innerHTML = '<div class="pav-card notr" role="alertdialog" aria-modal="true" aria-labelledby="pavH" aria-describedby="pavP">'
      + '<div class="pav-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>' + esc(T.tag) + '</div>'
      + '<div class="pav-x" aria-hidden="true">×' + N + '</div>'
      + '<h3 id="pavH">' + esc(T.h) + '</h3><p id="pavP">' + esc(T.p) + '</p>'
      + '<ul><li>' + esc(T.a) + '</li><li>' + esc(T.b) + '</li><li>' + esc(T.c) + '</li></ul>'
      + '<div class="pav-btn"><button type="button" class="btn" data-no>' + esc(T.no) + '</button><button type="button" class="lnk" data-ok>' + esc(T.ok) + '</button></div></div>';
    document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
    const back = document.activeElement; let gone = false;
    const out = v => { if (gone) return; gone = true; premiumAvisoAbierto = false; removeEventListener('keydown', key, true); o.classList.remove('on'); setTimeout(() => o.remove(), 400); try{ if (back && back.focus) back.focus(); }catch(e){} res(v); };
    const key = e => { if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); out(false); } else if (e.key === 'Tab'){ const f = [...o.querySelectorAll('button')]; const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); } };
    addEventListener('keydown', key, true);
    $('[data-no]', o).addEventListener('click', () => out(false));
    $('[data-ok]', o).addEventListener('click', () => out(true));
    o.addEventListener('pointerdown', e => { if (e.target === o) out(false); });
    setTimeout(() => { const b = $('[data-no]', o); if (b) b.focus({ preventScroll:true }); }, 60);   /* lo seguro primero: Enter no gasta de más */
  });
}
SZ.premiumAviso = premiumAviso;   /* para probarlo y para la vista previa de Pulsem */
