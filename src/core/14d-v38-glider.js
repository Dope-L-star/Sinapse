/* ===== v3.8 · Uiverse (#5, glider): en las opciones de Ajustes (Estilo, Idioma, Tamaño, Barra, Intro) la elección ya no
   salta de un botón a otro: una píldora con los colores del tema se desliza hasta la que tocas. Los botones siguen siendo
   los mismos (aria-pressed), así que nada cambia para el teclado ni para los lectores de pantalla.
   Con «Animaciones» apagadas la píldora aparece directo en su sitio. ===== */
{
  const glide = seg => {
    let g = seg.querySelector(':scope > .uvg');
    if (!g){ g = document.createElement('i'); g.className = 'uvg'; g.setAttribute('aria-hidden', 'true'); seg.prepend(g); seg.classList.add('uvg-on'); }
    const b = seg.querySelector('button[aria-pressed="true"]');
    if (!b || !b.offsetWidth){ g.style.opacity = '0'; return; }
    g.style.opacity = '1';
    g.style.transform = 'translate(' + b.offsetLeft + 'px,' + b.offsetTop + 'px)';
    g.style.width = b.offsetWidth + 'px'; g.style.height = b.offsetHeight + 'px';
  };
  const all = () => document.querySelectorAll('.cfgseg').forEach(glide);
  let raf = 0; const soon = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; all(); }); };
  new MutationObserver(ms => { if (ms.some(m => m.type === 'childList' ? [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches('.cfgseg,#cfgm') || n.querySelector('.cfgseg'))) : m.target.closest && m.target.closest('.cfgseg'))) soon(); })
    .observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['aria-pressed'] });
  addEventListener('resize', soon, { passive:true });
  /* las secciones de Ajustes se muestran/ocultan: al volverse visibles se recoloca */
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#cfgm')) setTimeout(soon, 30); }, true);
}
