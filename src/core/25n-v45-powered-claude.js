/* ---------- v4.5 · «Powered by Claude» en la chispa de la esquina ----------
   La chispita naranja de abajo a la derecha (.corner en SynthFlow y la portada, #pCorner en Pulsem) es la de Claude.
   Al pasar el mouse, al enfocarla con el teclado o al tocarla en el celular, muestra un letrerito «Powered by Claude»
   (en español: «Impulsado por Claude»). Se engancha por delegación de eventos: sirve aunque React vuelva a pintar la esquina. */
Object.assign(I18N.es, { 'pwr.claude':'Impulsado por <b>Claude</b>' });
Object.assign(I18N.en, { 'pwr.claude':'Powered by <b>Claude</b>' });
const PWR_SEL = '.corner';
let pwrEl = null, pwrTimer = 0, pwrDe = null;
const pwrTxt = () => t('pwr.claude').replace(/<[^>]+>/g, '');
/* la esquina se vuelve algo que se puede leer y enfocar (antes era solo adorno: aria-hidden) */
function pwrPrep(){
  document.querySelectorAll(PWR_SEL).forEach(c => {
    c.removeAttribute('aria-hidden'); c.setAttribute('role', 'img'); c.setAttribute('aria-label', pwrTxt()); c.tabIndex = 0;
    if (c === pwrDe && pwrEl) pwrEl.innerHTML = t('pwr.claude');
  });
}
function pwrOcultar(){
  clearTimeout(pwrTimer); pwrTimer = 0; pwrDe = null;
  if (pwrEl) pwrEl.classList.remove('on');
}
function pwrMostrar(c, ms){
  if (!c || !c.isConnected) return;
  clearTimeout(pwrTimer); pwrTimer = 0;
  if (!pwrEl){
    pwrEl = document.createElement('div'); pwrEl.id = 'szPwr'; pwrEl.setAttribute('role', 'tooltip'); pwrEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(pwrEl);
  }
  pwrDe = c; pwrPrep();
  pwrEl.innerHTML = t('pwr.claude');
  /* la posición sale del CSS de la esquina (no de su caja), porque la chispa crece y gira al pasar el mouse */
  const cs = getComputedStyle(c), w = c.offsetWidth || 15;
  const dr = (parseFloat(cs.right) || 10) + w + 10, db = parseFloat(cs.bottom) || 8;
  pwrEl.style.right = dr.toFixed(0) + 'px'; pwrEl.style.bottom = Math.max(4, db - 4).toFixed(0) + 'px';
  pwrEl.classList.add('on');
  if (ms) pwrTimer = setTimeout(pwrOcultar, ms);
}
addEventListener('pointerover', e => { if (e.pointerType === 'touch') return; const c = e.target.closest && e.target.closest(PWR_SEL); if (c) pwrMostrar(c); }, { passive:true });
addEventListener('pointerout', e => { if (e.pointerType === 'touch') return; const c = e.target.closest && e.target.closest(PWR_SEL); if (c && !c.contains(e.relatedTarget) && document.activeElement !== c) pwrOcultar(); }, { passive:true });
addEventListener('focusin', e => { const c = e.target.closest && e.target.closest(PWR_SEL); if (c) pwrMostrar(c); });
addEventListener('focusout', e => { if (e.target.closest && e.target.closest(PWR_SEL)) pwrOcultar(); });
/* celular (no hay «pasar el mouse»): un toque lo muestra unos segundos; otro toque lo esconde */
addEventListener('click', e => {
  const c = e.target.closest && e.target.closest(PWR_SEL); if (!c) return;
  if (pwrEl && pwrEl.classList.contains('on') && pwrDe === c && pwrTimer) pwrOcultar(); else pwrMostrar(c, 2800);
});
addEventListener('keydown', e => { if (e.key === 'Escape' && pwrEl && pwrEl.classList.contains('on')) pwrOcultar(); });
onLang(() => pwrPrep());
/* la esquina la pinta la página (o React) un poco después de cargar: se revisa un par de veces */
[0, 600, 2500].forEach(ms => setTimeout(pwrPrep, ms));
