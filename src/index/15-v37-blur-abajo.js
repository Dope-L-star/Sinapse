/* v3.7 · desenfoque progresivo abajo (index-css 11). Se esconde cuando ya llegaste al final de la página, para que el pie se lea nítido. */
(function blurAbajo(){
  if (document.getElementById('szBlurAbajo')) return;
  const el = document.createElement('div'); el.id = 'szBlurAbajo'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = '<i></i><i></i><i></i>';
  document.body.appendChild(el);
  let raf = 0;
  const check = () => { raf = 0; const se = document.scrollingElement || document.documentElement; el.classList.toggle('fin', se.scrollTop + innerHeight >= se.scrollHeight - 140); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(check); }, { passive:true });
  addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(check); }, { passive:true });
  check();
})();
