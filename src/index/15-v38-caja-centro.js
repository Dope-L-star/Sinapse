/* v3.8 · el cuadro de la portada, ahora al centro (ver src/index-css/11-v38-caja-centro.css):
   - la luz que lo rodea acelera mientras escribes
   - la tecla «/» te lleva al cuadro (como en los buscadores), salvo si ya estás escribiendo en otro lado
   - al enviar, la flecha despega como avión de papel mientras el cuadro se abre hacia SynthFlow */
(() => {
const form = document.getElementById('heroAsk'), inp = document.getElementById('heroInp');
if (!form || !inp) return;
const send = form.querySelector('.send');

/* avión de papel escondido detrás de la flecha */
if (send && !send.querySelector('.hk-avion')){
  send.insertAdjacentHTML('beforeend', '<svg class="hk-avion" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5 21 3l-6.5 18-3.2-7.3L3 11.5Z"/><path d="m11.3 13.7 4-4"/></svg>');
}
/* la tecla «/» dentro del cuadro, antes de la flecha */
if (send && !form.querySelector('.hk-tecla')){
  const k = document.createElement('kbd'); k.className = 'hk-tecla'; k.textContent = '/'; k.setAttribute('aria-hidden', 'true');
  form.insertBefore(k, send);
}

let tq = 0;
inp.addEventListener('input', () => { form.classList.add('tecleo'); clearTimeout(tq); tq = setTimeout(() => form.classList.remove('tecleo'), 700); });

addEventListener('keydown', e => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
  const a = document.activeElement;
  if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return;
  if (document.querySelector('dialog[open],.modal.on,#szWin.on')) return;
  e.preventDefault();
  form.scrollIntoView({ behavior:document.documentElement.classList.contains('noanim') ? 'auto' : 'smooth', block:'center' });
  inp.focus({ preventScroll:true });
});

/* va en captura: corre antes que el envío de siempre (01-lanzador), que abre SynthFlow */
form.addEventListener('submit', () => { if (send && inp.value.trim()) send.classList.add('vuela'); }, true);
addEventListener('pageshow', () => send && send.classList.remove('vuela'));
})();
