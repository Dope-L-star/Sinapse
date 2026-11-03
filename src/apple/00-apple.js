/* ===== v3.8 · Estilo Apple para Ayuda, Privacidad y Términos (los estilos están en src/apple-css/)
   · Las secciones suben al aparecer, en cascada; el titular brilla una vez y la bajada entra palabra por palabra.
   · Cabecera de vidrio que se encoge al bajar y barra de lectura arriba.
   · Índice «En esta página / On this page» (si hay 3 secciones o más) que marca lo que estás leyendo.
   · Preguntas que se abren y cierran suave; luz que sigue al puntero en las tarjetas.
   Cada idioma (div[lang]) tiene su propio índice, así el cambio ES/EN de ayuda.js sigue igual.
   Con «Animaciones» apagadas en Ajustes (html.noanim) todo queda quieto y visible desde el principio.
   El <main> lleva data-mv-no para que movimiento.js no anime dos veces lo mismo. ===== */
(() => {
'use strict';
const H = document.documentElement;
const still = () => H.classList.contains('noanim');
const go = () => {
  const main = document.querySelector('main');
  if (!main || H.classList.contains('ap-on')) return;
  H.classList.add('ap-on');
  const top = document.querySelector('.top');
  const setTop = () => H.style.setProperty('--ap-top', (top ? top.offsetHeight : 56) + 'px');
  setTop(); addEventListener('resize', setTop, { passive:true });
  /* en el celular los botones de arriba se deslizan: el de la página actual queda a la vista */
  const cur = top && top.querySelector('nav [aria-current]');
  if (cur && cur.parentNode.scrollWidth > cur.parentNode.clientWidth) cur.parentNode.scrollLeft = Math.max(0, cur.getBoundingClientRect().left - cur.parentNode.getBoundingClientRect().left - 12);

  /* barra de lectura y cabecera que se encoge */
  const bar = document.createElement('div'); bar.className = 'ap-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
  let tick = 0;
  const onScroll = () => {
    if (tick) return; tick = requestAnimationFrame(() => {
      tick = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      bar.style.setProperty('--p', Math.min(1, scrollY / max).toFixed(4));
      H.classList.toggle('ap-scrolled', scrollY > 24);
      H.classList.toggle('ap-far', scrollY > Math.min(700, innerHeight * .9));
    });
  };
  /* volver arriba (Uiverse · vinodjangid07): un círculo con flecha que, al pasarle el mouse, se estira y dice a dónde va */
  const up = document.createElement('button'); up.type = 'button'; up.className = 'ap-top';
  const upTx = () => { const en = H.lang === 'en'; up.setAttribute('aria-label', en ? 'Back to top' : 'Volver arriba'); up.dataset.t = en ? 'Back to top' : 'Arriba'; };
  up.innerHTML = '<svg viewBox="0 0 384 512" aria-hidden="true"><path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>';
  upTx(); new MutationObserver(upTx).observe(H, { attributes:true, attributeFilter:['lang'] });
  up.addEventListener('click', () => scrollTo({ top:0, behavior: still() || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  document.body.appendChild(up);
  addEventListener('scroll', onScroll, { passive:true }); onScroll();

  /* bajada palabra por palabra */
  main.querySelectorAll(':scope > div > .sub, :scope > .sub').forEach(p => {
    if (p.dataset.apw) return; p.dataset.apw = '1';
    let i = 0;
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3){
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)){ f.appendChild(document.createTextNode(w)); return; }
          const s = document.createElement('span'); s.className = 'ap-w'; s.style.setProperty('--i', i++); s.textContent = w; f.appendChild(s);
        });
        c.replaceWith(f);
      } else if (c.nodeType === 1) walk(c);
    });
    walk(p);
  });

  /* índice por idioma */
  const slug = (t, k) => 'ap-' + k + '-' + t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const tocs = [];
  const blocks = main.querySelectorAll(':scope > div[lang]');
  (blocks.length ? [...blocks] : [main]).forEach(box => {
    const cards = [...box.querySelectorAll(':scope > .card, :scope > section.card')].filter(c => c.querySelector('h2'));
    if (cards.length < 3 || box.querySelector('.ap-toc')) return;
    const en = (box.getAttribute('lang') || H.lang) === 'en';
    const nav = document.createElement('nav'); nav.className = 'ap-toc'; nav.setAttribute('aria-label', en ? 'On this page' : 'En esta página');
    nav.innerHTML = '<b>' + (en ? 'On this page' : 'En esta página') + '</b>';
    const links = cards.map(c => {
      const h = c.querySelector('h2');
      if (!c.id) c.id = slug(h.textContent, en ? 'en' : 'es');
      const a = document.createElement('a'); a.href = '#' + c.id; a.textContent = h.textContent.replace(/^\s*\d+[.)]\s*/, '');
      a.addEventListener('click', e => { e.preventDefault(); c.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block:'start' }); history.replaceState(null, '', '#' + c.id); });
      nav.appendChild(a); return [c, a];
    });
    const first = box.querySelector(':scope > .sub') || cards[0].previousElementSibling;
    (first && first.parentNode === box ? first : cards[0]).insertAdjacentElement(first && first.parentNode === box ? 'afterend' : 'beforebegin', nav);
    tocs.push({ nav, links });
  });
  const mark = () => {
    const y = (top ? top.offsetHeight : 56) + 90;
    tocs.forEach(({ nav, links }) => {
      if (nav.offsetParent === null) return;
      let cur = links[0];
      links.forEach(l => { if (l[0].getBoundingClientRect().top <= y) cur = l; });
      links.forEach(l => {
        const on = l === cur; if (l[1].classList.contains('on') === on) return;
        l[1].classList.toggle('on', on);
        if (on){ const r = l[1].offsetLeft - nav.clientWidth / 2 + l[1].offsetWidth / 2; nav.scrollTo({ left: r, behavior: still() ? 'auto' : 'smooth' }); }
      });
    });
  };
  if (tocs.length){ addEventListener('scroll', () => requestAnimationFrame(mark), { passive:true }); mark(); new MutationObserver(mark).observe(main, { attributes:true, subtree:true, attributeFilter:['hidden'] }); }

  /* secciones que suben al aparecer, en cascada */
  const cards = [...main.querySelectorAll('.card')];
  if ('IntersectionObserver' in window && !still()){
    let lot = 0, lotT = 0;
    const io = new IntersectionObserver(es => {
      es.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target; io.unobserve(el);
        el.style.setProperty('--d', (lot++ * 90) + 'ms');
        el.classList.add('ap-in');
      });
      clearTimeout(lotT); lotT = setTimeout(() => { lot = 0; }, 120);
    }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    cards.forEach(c => { c.classList.add('ap-rv'); io.observe(c); });
    /* las del idioma que está escondido: al mostrarse ya deben verse */
    new MutationObserver(() => cards.forEach(c => { if (c.offsetParent !== null && c.getBoundingClientRect().top < innerHeight) c.classList.add('ap-in'); }))
      .observe(main, { attributes:true, subtree:true, attributeFilter:['hidden'] });
  }

  /* luz que sigue al puntero */
  main.addEventListener('pointermove', e => {
    const c = e.target.closest && e.target.closest('.card'); if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive:true });

  /* preguntas que se abren suave */
  main.querySelectorAll('details').forEach(d => {
    const s = d.querySelector('summary'); if (!s || d.dataset.apd) return; d.dataset.apd = '1';
    const ans = document.createElement('div'); ans.className = 'ap-ans';
    while (s.nextSibling) ans.appendChild(s.nextSibling);
    d.appendChild(ans);
    s.addEventListener('click', e => {
      if (still() || !ans.animate) return;
      e.preventDefault();
      if (d.dataset.busy) return; d.dataset.busy = '1';
      const done = () => { delete d.dataset.busy; ans.style.height = ''; ans.style.opacity = ''; };
      if (d.open){
        const h = ans.offsetHeight;
        ans.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => { d.open = false; done(); };
      } else {
        d.open = true;
        const h = ans.offsetHeight;
        ans.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = done;
      }
    });
  });

  requestAnimationFrame(() => requestAnimationFrame(() => H.classList.add('ap-ready')));
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
