/* Ayuda, Privacidad y Términos: la página sale en el idioma que elegiste en SymphorIA (o el de tu navegador) y se cambia con un toque.
   v3.7 · también cambia sola, sin recargar: si cambias el idioma en otra pestaña (SynthFlow, la portada…) o vuelves con «Atrás».
   Además respeta tus Ajustes de SymphorIA: con «Animaciones» apagadas no se mueve y con «Vidrio» apagado no hay blurry. */
(() => {
  const H = document.documentElement;
  const want = () => { try{ const s = localStorage.getItem('synthz:lang'); if (s === 'es' || s === 'en') return s; }catch(e){} return /^en\b/i.test(navigator.language || '') ? 'en' : 'es'; };
  let L = want();
  const set = l => {
    L = l; H.lang = l;
    document.querySelectorAll('[lang="es"],[lang="en"]').forEach(el => { if (el !== H) el.hidden = el.lang !== l; });
    const b = document.getElementById('ayLang'); if (b) b.textContent = l === 'en' ? 'Español' : 'English';
    document.title = (l === 'en' ? H.dataset.titleEn : H.dataset.titleEs) || (l === 'en' ? 'Help · SymphorIA' : 'Ayuda · SymphorIA');
  };
  const cfg = () => { let c = {}; try{ c = JSON.parse(localStorage.getItem('synthz:cfg')) || {}; }catch(e){} H.classList.toggle('noanim', c.anim === false); H.classList.toggle('noglass', c.glass === false); };
  cfg();
  const ready = () => {
    set(L);
    const b = document.getElementById('ayLang');
    if (b) b.addEventListener('click', e => { e.preventDefault(); set(L === 'en' ? 'es' : 'en'); try{ localStorage.setItem('synthz:lang', L); }catch(er){} });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
  /* otra pestaña cambió el idioma o los ajustes: se aplica al instante */
  addEventListener('storage', e => { if (e.key === 'synthz:lang'){ const l = want(); if (l !== L) set(l); } else if (e.key === 'synthz:cfg') cfg(); });
  /* volver con «Atrás» (la página sale de la memoria del navegador): se revisa otra vez */
  addEventListener('pageshow', () => { cfg(); const l = want(); if (l !== L) set(l); });
})();
