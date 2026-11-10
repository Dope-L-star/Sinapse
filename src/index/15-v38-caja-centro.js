/* v3.8 · el cuadro de la portada, ahora al centro (ver src/index-css/11-v38-caja-centro.css):
   - la luz que lo rodea acelera mientras escribes
   - la tecla «/» te lleva al cuadro (como en los buscadores), salvo si ya estás escribiendo en otro lado
   - al enviar, la flecha despega como avión de papel mientras el cuadro se abre hacia Sonyx */
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

/* v3.8b · el cuadro deja de ser una barra: es una consola con la esfera de SynthFlow a la izquierda (gira y se agita
   mientras escribes) y, abajo, tres ideas que se escriben solas en el cuadro al tocarlas. */
if (!form.querySelector('.hk-orbe')){
  const o = document.createElement('span'); o.className = 'hk-orbe'; o.setAttribute('aria-hidden', 'true');
  o.innerHTML = '<svg viewBox="0 0 64 64" fill="none"><defs><linearGradient id="hkOG" x1="0" x2="1"><stop offset="0" stop-color="#3de0ff"/><stop offset=".4" stop-color="#7b3ff2"/><stop offset=".72" stop-color="#ff3d9a"/><stop offset="1" stop-color="#ff7a45"/></linearGradient></defs><path class="hk-ola" d="M-24 32c5-12 10-12 14 0s9 12 14 0 9-12 14 0 9 12 14 0 9-12 14 0 9 12 14 0 9-12 14 0" stroke="url(#hkOG)" stroke-width="5" stroke-linecap="round"/></svg>';
  form.insertBefore(o, inp);
}
const ideas = document.createElement('div');
ideas.className = 'hk-ideas';
const pintaIdeas = () => {
  const L = [['birrete', SZ.t('ix.sug1')], ['estrella', SZ.t('ix.sug2')], ['codigo', SZ.t('ix.sug3')]];
  ideas.setAttribute('aria-label', SZ.t('ix.sugT'));
  ideas.innerHTML = L.map(([ic, t], i) => '<button type="button" class="hk-idea" style="--i:' + i + '"><i class="gi" data-gi="' + ic + '"></i><span>' + t + '</span></button>').join('');
  if (SZ.giFill) SZ.giFill(ideas);
};
if (!form.querySelector('.hk-ideas')){ pintaIdeas(); form.appendChild(ideas); if (SZ.onLang) SZ.onLang(pintaIdeas); }
/* tocar una idea la escribe letra por letra en el cuadro (con sus chispas); luego solo falta enviar */
let escribiendo = 0;
ideas.addEventListener('click', e => {
  const b = e.target.closest('.hk-idea'); if (!b) return;
  const t = b.textContent.trim(); clearInterval(escribiendo);
  inp.focus();
  if (document.documentElement.classList.contains('noanim')){ inp.value = t; inp.dispatchEvent(new Event('input', { bubbles:true })); return; }
  let n = 0; inp.value = '';
  escribiendo = setInterval(() => { n++; inp.value = t.slice(0, n); inp.dispatchEvent(new Event('input', { bubbles:true })); if (n >= t.length){ clearInterval(escribiendo); form.classList.add('lista'); setTimeout(() => form.classList.remove('lista'), 1200); } }, 22);
});

let tq = 0;
const quieto = () => document.documentElement.classList.contains('noanim');
const bot = document.getElementById('heroBot');
const cv = document.createElement('canvas').getContext('2d');
/* dónde va el cursor de texto (en px desde la izquierda del cuadro) */
const caretX = () => {
  const cs = getComputedStyle(inp), ir = inp.getBoundingClientRect();
  cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
  const w = cv.measureText(inp.value.slice(0, inp.selectionStart == null ? inp.value.length : inp.selectionStart)).width - inp.scrollLeft;
  return ir.left + Math.max(0, Math.min(ir.width, w));
};
const COL = ['#3de0ff', '#b48cff', '#ff3d9a', '#ffb36b', '#ffc857'];
let ci = 0;
/* chispas que saltan del cursor al escribir (recurso de estilo Uiverse #54) */
const chispa = x => {
  if (quieto()) return;
  const fr = form.getBoundingClientRect();
  for (let k = 0; k < 2; k++){
    const i = document.createElement('i'); i.className = 'hk-chispa'; i.setAttribute('aria-hidden', 'true');
    const ir = inp.getBoundingClientRect(); i.style.left = (x - fr.left) + 'px'; i.style.setProperty('--y', (ir.top + ir.height / 2 - fr.top).toFixed(1) + 'px'); i.style.background = COL[ci++ % COL.length];
    i.style.setProperty('--dx', (Math.random() * 44 - 22).toFixed(1) + 'px'); i.style.setProperty('--dy', (-18 - Math.random() * 30).toFixed(1) + 'px');
    form.appendChild(i); setTimeout(() => i.remove(), 750);
  }
};
/* Sona mira lo que escribes y asiente con cada letra */
const mira = x => {
  if (!bot) return;
  const r = bot.getBoundingClientRect(), ir = inp.getBoundingClientRect();
  if (!r.width) return;
  const ex = Math.max(-1, Math.min(1, (x - r.left - r.width / 2) / 500)), ey = Math.max(-1, Math.min(1, (ir.top - r.top - 90) / 500));
  bot.style.setProperty('--ex', (ex * 3.2).toFixed(2) + 'px'); bot.style.setProperty('--ey', (ey * 2.4).toFixed(2) + 'px');
  if (!quieto()){ bot.classList.remove('hk-asiente'); void bot.offsetWidth; bot.classList.add('hk-asiente'); }
};
inp.addEventListener('input', () => {
  form.classList.add('tecleo'); clearTimeout(tq); tq = setTimeout(() => form.classList.remove('tecleo'), 700);
  /* la luz crece mientras más escribes (hasta ~80 letras) */
  form.style.setProperty('--hkF', Math.min(1, inp.value.length / 80).toFixed(2));
  const x = caretX(); chispa(x); mira(x);
});

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
