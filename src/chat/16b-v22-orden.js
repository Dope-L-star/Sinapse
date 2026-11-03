/* ===== v2.2 · orden nuevo: todo donde lo buscarías (estilo Claude) ===== */
/* Ajustes › IAs y memoria: atajos a lo que antes estaba regado en menús */
SZ.cfgLinks.push(
  ['Elegir mis IA ideales', () => SZ.surveyModal(ok => { if (ok){ forMeK = ''; applySurvey(true); renderList({ keep:true }); } }), '3 preguntas y te digo cuáles te sirven más'],
  ['Conectar Puter u otra IA', () => openConnect(), 'Tu versión pro de las IAs más usadas, gratis'],
  ['Google Drive', () => driveModal(), 'Guarda una copia de tus chats en tu Drive'],
  ['Tu ranking (a ciegas)', () => rankModal(), 'Las IAs que más te gustan según tus votos']);
if (!SZ.appStandalone()) SZ.cfgLinks.push(['Descargar la app SynthFlow', () => SZ.appPromo(true), 'Se instala desde aquí: pantalla completa y a un toque']);
/* «Respuestas cortas» desde Ajustes también pinta su botón */
addEventListener('synthz-saver', () => { $$('#sxSw, #saverBtn').forEach(x => x.setAttribute('aria-pressed', String(!!st().sx.saver))); updateHint(); });
/* el «+» trae todo: archivos, crear imagen, buscar en internet y respuestas cortas */
{
  const am = $('#attMenu'), ab = $('#attachBtn');
  const reactBox = !!(am && $('[data-att="saver"]', am));   /* v3.7 · React ya pinta el «+», «Respuestas cortas» y las bolitas */
  if (ab && !reactBox){ ab.setAttribute('aria-label', 'Agregar: archivos, imagen, internet…'); ab.dataset.tip = 'Archivos, crear imagen, buscar en internet…'; ab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'; }
  if (am){
    let sv = $('[data-att="saver"]', am);
    if (!sv){
      $$('.only-small', am).forEach(x => x.classList.remove('only-small'));
      const hint = $('.ahint', am); sv = document.createElement('button');
      sv.type = 'button'; sv.setAttribute('role', 'menuitemcheckbox'); sv.dataset.att = 'saver';
      sv.innerHTML = '<i aria-hidden="true">🍃</i><span><b>Respuestas cortas</b><small>Gastas menos de tu límite de hoy</small></span><em class="mck" aria-hidden="true"></em>';
      am.insertBefore(sv, hint);
    }
    const paint = () => { const on = !!st().sx.saver; sv.setAttribute('aria-checked', String(on)); $('.mck', sv).textContent = on ? '✓' : ''; };
    paint(); addEventListener('synthz-saver', paint);
    sv.addEventListener('click', e => { e.stopPropagation(); setSaver(!st().sx.saver); paint(); attClose(); }, true);
    const wb = $('[data-att="web"]', am), nb = $('[data-att="noweb"]', am), ib = $('[data-att="mkimg"]', am);
    const mark = () => { if (wb) wb.setAttribute('aria-checked', String(webMode === 'on')); if (nb) nb.setAttribute('aria-checked', String(webMode === 'off')); if (ib) ib.setAttribute('aria-checked', String(imgMode)); };
    new MutationObserver(mark).observe(document.body, { attributes:true, attributeFilter:['class'] }); mark();
  }
}
/* chips de lo que está encendido (imagen, internet, cortas): se apagan con un toque.
   v3.2 (Sammuel, 28 oct): ya no van en una fila aparte debajo de la caja; son bolitas junto al «+» que muestran su nombre al pasar el puntero. */
{
  const host = $('#onChips') || document.createElement('div');
  if (!host.isConnected){ host.className = 'onchips'; host.id = 'onChips'; const aw = $('.comp-in .attw'); if (aw) aw.appendChild(host); else { const ci = $('.comp-in'); if (ci) ci.appendChild(host); } }
  const paint = () => {
    const L = [];
    if (imgMode) L.push(['img', '🎨', 'Crear imagen']);
    if (webMode === 'on') L.push(['web', '🌐', SZ.lang() === 'en' ? 'Web search' : 'Internet']);
    if (webMode === 'off') L.push(['noweb', '🚫', SZ.lang() === 'en' ? 'No web search' : 'Sin internet']);
    if (st().sx.saver) L.push(['saver', '🍃', 'Respuestas cortas']);
    const have = $$('[data-off]', host).map(b => b.dataset.off).join(), want = L.map(x => x[0]).join(); if (have === want) return;
    host.innerHTML = L.map(([k, ic, t]) => '<button type="button" class="onchip" data-off="' + k + '" data-tip="' + t + ' · toca para apagar" aria-label="' + t + ': encendido. Toca para apagar"><i aria-hidden="true">' + ic + '</i><span class="oc-l">' + t + '</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg></button>').join('');
  };
  host.addEventListener('click', e => { const b = e.target.closest('[data-off]'); if (!b) return; const k = b.dataset.off; if (k === 'img') setImgMode(false); else if (k === 'web' || k === 'noweb') setWebMode('auto', true); else setSaver(false); paint(); });
  new MutationObserver(paint).observe(document.body, { attributes:true, attributeFilter:['class'] });
  addEventListener('synthz-saver', paint); $('#saverBtn') && $('#saverBtn').addEventListener('click', () => setTimeout(paint, 0)); paint();
}
