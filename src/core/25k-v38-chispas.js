/* ---------- v3.8 · CTAs que chispean (recurso de estilo Uiverse #54, «Generate Site» con partículas) ----------
   Solo en los botones de CREAR o EMPEZAR algo: al pasar el mouse (o tocar) saltan estrellitas de cuatro puntas que suben y se apagan.
   No cambia lo que hace el botón. Con Animaciones apagado no sale nada. Para sumar un botón: agrega su selector a CHISPA_SEL. */
const CHISPA_SEL = '#startBtn,.flowbtn,.pl-quiero,.pj-form .btn[type=submit],#imgBtn,.chispea';
const CHISPA_COL = ['#ffd27a', '#9fffd6', '#b48cff', '#ff7ac0', '#7fe3ff'];
const chispaQuieto = () => document.documentElement.classList.contains('noanim') || (typeof reduce !== 'undefined' && reduce);
function chispas(el, n = 9){
  if (chispaQuieto() || !el.isConnected) return;
  const r = el.getBoundingClientRect(); if (!r.width) return;
  for (let i = 0; i < n; i++){
    const s = document.createElement('i'); s.className = 'sz-chispa'; s.setAttribute('aria-hidden', 'true');
    const x = r.left + Math.random() * r.width, y = r.top + r.height * (.2 + Math.random() * .6), z = 9 + Math.random() * 8;
    s.style.cssText = 'left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px;width:' + z.toFixed(1) + 'px;height:' + z.toFixed(1) + 'px;color:' + CHISPA_COL[i % CHISPA_COL.length]
      + ';--dx:' + (Math.random() * 40 - 20).toFixed(1) + 'px;--dy:' + (-20 - Math.random() * 34).toFixed(1) + 'px;animation-delay:' + (i * 45) + 'ms';
    document.body.appendChild(s); setTimeout(() => s.remove(), 1100 + i * 45);
  }
}
let chispaUlt = null, chispaT = 0;
addEventListener('pointerover', e => {
  const b = e.target.closest && e.target.closest(CHISPA_SEL); if (!b || b === chispaUlt) return;
  chispaUlt = b; const now = Date.now(); if (now - chispaT < 350) return; chispaT = now; chispas(b);
}, { passive:true });
addEventListener('pointerout', e => { if (chispaUlt && !chispaUlt.contains(e.relatedTarget)) chispaUlt = null; }, { passive:true });
addEventListener('click', e => { const b = e.target.closest && e.target.closest(CHISPA_SEL); if (b) chispas(b, 10); }, true);
addEventListener('focusin', e => { const b = e.target.closest && e.target.closest(CHISPA_SEL); if (b && b.matches(':focus-visible')) chispas(b, 5); });
