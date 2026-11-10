/* ---------- v4.3 (8 nov) · esfuerzo: Auto · Veloz · Profundo · Creativo (antes Auto · Bajo · Medio · Alto) ----------
   Pedido de Sammuel: cuatro niveles, cada uno con una frase de para qué sirve. Profundo es el que más gasta.
   Cómo se aplica: (1) una pista en el mensaje de sistema, que sirve con cualquier IA; (2) Veloz además limita el largo;
   (3) al servidor va api: Veloz = 'low' (responde directo), Profundo = 'high' (IA grande, piensa y revisa, hasta 8000 tokens:
   por eso es el que más EnerX gasta, porque se descuenta el gasto real), Creativo = 'creative' (más temperatura).
   Con OpenRouter directo solo se manda reasoning.effort cuando es low/high. Profundo pide cuenta (entrar es gratis).
   Lo guardado con los nombres viejos se lee así: Bajo → Veloz, Alto → Profundo, Medio → Auto. */
const EFF = {
  auto:     { n:'Flow',     d:'La IA decide cuánto pensar según tu pregunta.',              api:'',         hint:'',  tok:0, ico:'<path d="M4.5 16a8 8 0 1 1 15 0"/><path d="M12 14l3.5-4"/>' },
  fast:     { n:'Fragment', d:'Respuestas rápidas y cortas, para lo del día a día.',          api:'low',      hint:'Responde rápido y directo, en pocas frases y sin rodeos.', tok:700, ico:'<path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/>' },
  deep:     { n:'Focus',    d:'Piensa a fondo y revisa su respuesta. Es el que más EnerX gasta.', api:'high', hint:'Razona con cuidado antes de responder: analiza el problema paso a paso, revisa tu respuesta y entrega una respuesta completa y bien fundamentada.', tok:0, ico:'<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/><path d="M11 8v3l2 1.5"/>' },
  creative: { n:'Horizon',  d:'Ideas originales y textos con chispa, para crear.',            api:'creative', hint:'Sé creativo y original: propone ideas poco obvias, usa imágenes y ejemplos vivos, juega con el tono y evita lo genérico, sin perder la claridad ni inventar datos.', tok:0, ico:'<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="2.5"/>' }
};
const EFF_KEYS = ['auto', 'fast', 'deep', 'creative'];
const EFF_OLD = { low:'fast', high:'deep', medium:'auto' };
function effKey(){ let e = st().sx && st().sx.effort; if (EFF_OLD[e]) e = EFF_OLD[e]; return EFF[e] ? e : 'auto'; }
function effortHint(){ return EFF[effKey()].hint; }
function effortOpts(saver){ const k = effKey(); if (k === 'auto') return {}; const o = { effort:EFF[k].api }; if (EFF[k].tok && !saver) o.maxTokens = EFF[k].tok; return o; }
(function esfuerzo(){
  const btn = $('#cEffort'), menu = $('#effMenu'), lab = $('#cEffortL'); if (!btn || !menu) return;
  const svg = k => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + EFF[k].ico + '</svg>';
  const locked = k => k === 'deep' && !SZ.ACC.ready;
  function paint(){
    const k = effKey(); lab.textContent = k === 'auto' ? '' : EFF[k].n; btn.classList.toggle('on', k !== 'auto');
    btn.title = 'Esfuerzo: ' + EFF[k].n + ' · cuánto piensa la IA antes de responder';
    menu.innerHTML = EFF_KEYS.map(x => '<button type="button" role="menuitemradio" data-eff="' + x + '" aria-checked="' + (x === k) + '"' + (locked(x) ? ' class="lk"' : '') + '><i aria-hidden="true">' + svg(x) + '</i><span><b>' + EFF[x].n + '</b><small>' + EFF[x].d + '</small></span>' + (locked(x) ? '<em>Con cuenta</em>' : x === k ? '<em class="ck">✓</em>' : '') + '</button>').join('');
  }
  function place(){ const r = btn.getBoundingClientRect(), w = Math.min(270, innerWidth - 16); menu.style.width = w + 'px'; menu.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px'; menu.style.bottom = (innerHeight - r.top + 10) + 'px'; }
  function open(on){ menu.hidden = !on; btn.setAttribute('aria-expanded', String(on)); if (on){ paint(); place(); const c = $('[aria-checked="true"]', menu); if (c) c.focus(); } }
  btn.addEventListener('click', e => { e.stopPropagation(); open(menu.hidden); });
  menu.addEventListener('click', e => {
    const b = e.target.closest('[data-eff]'); if (!b) return; const k = b.dataset.eff;
    if (locked(k)){ open(false); toast('El esfuerzo Focus es para cuentas (entrar es gratis).'); SZ.guestGate({ mode:'signup' }); return; }
    st().sx.effort = k; save(); paint(); open(false); btn.focus(); toast('Esfuerzo: ' + EFF[k].n + (k === 'auto' ? '' : ' · ' + EFF[k].d));
  });
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) open(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden){ open(false); btn.focus(); } });
  addEventListener('resize', () => { if (!menu.hidden) place(); });
  paint();
})();
