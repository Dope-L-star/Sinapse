/* v3.7 · desenfoque progresivo abajo y arriba (index-css 11).
   Abajo se esconde al llegar al final, para que el pie se lea nítido; arriba aparece solo después de bajar un poco. */
(function blurBordes(){
  if (document.getElementById('szBlurAbajo')) return;
  const mk = id => { const el = document.createElement('div'); el.id = id; el.className = 'szBlur'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = '<i></i><i></i><i></i>'; document.body.appendChild(el); return el; };
  const abajo = mk('szBlurAbajo'), arriba = mk('szBlurArriba');
  let raf = 0;
  const check = () => { raf = 0; const se = document.scrollingElement || document.documentElement;
    abajo.classList.toggle('fin', se.scrollTop + innerHeight >= se.scrollHeight - 140);
    arriba.classList.toggle('on', se.scrollTop > 60); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(check); }, { passive:true });
  addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(check); }, { passive:true });
  check();
})();
