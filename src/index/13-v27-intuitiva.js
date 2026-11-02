/* ===== v2.7 · portada más intuitiva (lo que se investigó y se aplicó):
   1. Nunca empezar en blanco: al tocar el cuadro de la portada aparecen 3 preguntas de ejemplo que funcionan tal cual
      (como las sugerencias de un buscador). Un toque y SynthFlow abre con esa pregunta. Se cierran con Esc o al escribir.
   2. La acción principal siempre a mano: cuando «Empezar gratis» sale de la pantalla, aparece en el menú de arriba.
   3. Los botones dicen a dónde llevan: «Ver demo» ahora es «Cómo funciona» (baja a «Así de fácil»).
   4. Más liviana: lo que se mueve en una sección se queda quieto mientras esa sección no se ve. ===== */
(() => {
const { $ } = SZ;
const form = $('#heroAsk'), inp = $('#heroInp');
if (form && inp){
  const box = document.createElement('div');
  box.className = 'hsug'; box.id = 'heroSug'; box.setAttribute('role', 'listbox'); box.hidden = true;
  /* v3.7 · se vuelve a escribir si cambias el idioma (aquí o en otra pestaña), sin recargar */
  const fill = () => {
    const SUG = [['birrete', SZ.t('ix.sug1')], ['estrella', SZ.t('ix.sug2')], ['codigo', SZ.t('ix.sug3')]];
    box.setAttribute('aria-label', SZ.t('ix.sugAria'));
    box.innerHTML = '<p class="hsug-t">' + SZ.t('ix.sugT') + '</p>' + SUG.map(([ic, t], i) => '<button type="button" class="hsug-i" role="option" style="--i:' + i + '"><i class="gi" data-gi="' + ic + '"></i><span>' + t + '</span></button>').join('');
    SZ.giFill(box);
  };
  fill(); form.appendChild(box); if (SZ.onLang) SZ.onLang(fill);
  inp.setAttribute('aria-controls', 'heroSug'); inp.setAttribute('aria-autocomplete', 'list');
  let y0 = 0;
  const show = on => { if (on && box.hidden) y0 = scrollY; box.hidden = !on; inp.setAttribute('aria-expanded', on ? 'true' : 'false'); form.classList.toggle('sugon', on); };
  /* si bajas por la página, el menú se cierra solo (no se queda flotando encima de otras cosas) */
  addEventListener('scroll', () => { if (!box.hidden && Math.abs(scrollY - y0) > 60) show(false); }, { passive:true });
  inp.addEventListener('focus', () => show(!inp.value.trim()));
  inp.addEventListener('click', () => show(!inp.value.trim()));
  inp.addEventListener('input', () => show(!inp.value.trim()));
  /* se cierra cuando el foco sale del cuadro y de las sugerencias */
  form.addEventListener('focusout', () => setTimeout(() => { if (!form.contains(document.activeElement)) show(false); }, 120));
  form.addEventListener('keydown', e => {
    if (box.hidden) return;
    const its = [...box.querySelectorAll('.hsug-i')], k = its.indexOf(document.activeElement);
    if (e.key === 'Escape'){ show(false); inp.focus(); }
    else if (e.key === 'ArrowDown'){ e.preventDefault(); its[Math.min(its.length - 1, k + 1)].focus(); }
    else if (e.key === 'ArrowUp'){ e.preventDefault(); k <= 0 ? inp.focus() : its[k - 1].focus(); }
  });
  box.addEventListener('click', e => {
    const b = e.target.closest('.hsug-i'); if (!b) return;
    inp.value = b.textContent.trim(); show(false);
    form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable:true }));
  });
}
/* «Ver demo» decía demo pero bajaba a los pasos: ahora dice lo que hace */
const demo = $('#demoBtn');
const demoTxt = () => { if (demo && demo.firstChild && demo.firstChild.nodeType === 3) demo.firstChild.textContent = SZ.t('ix.demo') + ' '; };
demoTxt(); if (SZ.onLang) SZ.onLang(demoTxt);
/* el botón principal en el menú de arriba, solo cuando el de la portada ya no se ve */
const nav = $('#nav'), start = $('#startBtn'), navr = nav && nav.querySelector('.navr');
if (nav && start && navr && 'IntersectionObserver' in window){
  const go = document.createElement('a');
  go.className = 'navgo'; go.href = 'chat.html'; go.tabIndex = -1;
  const goTxt = () => { go.innerHTML = '<span class="ng-l">' + SZ.t('ix.020') + '</span><span class="ng-s">' + SZ.t('tour.start') + '</span>'; go.setAttribute('aria-label', SZ.t('ix.goAria')); };
  goTxt(); if (SZ.onLang) SZ.onLang(goTxt);
  navr.insertBefore(go, $('#accBtn') || navr.firstChild);
  new IntersectionObserver(([e]) => {
    const on = !e.isIntersecting && e.boundingClientRect.top < 0;
    nav.classList.toggle('go', on); go.tabIndex = on ? 0 : -1;
  }).observe(start);
}
/* cada sección pausa sus animaciones cuando sale de la pantalla y las sigue al volver */
if ('IntersectionObserver' in window){
  const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('secoff', !e.isIntersecting)), { rootMargin:'120px' });
  document.querySelectorAll('main > section, main > header').forEach(s => io.observe(s));
}
})();
