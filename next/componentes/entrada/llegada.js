/* SymphorIA · «Entrada» · la llegada: lo que pasa cuando algo terminó de cargar.
   · El titular principal destella una vez con los colores de la marca (si no tiene partes de otro color sólido).
   · Los bloques que se ven en pantalla suben y aparecen uno tras otro (28 px, 70 ms entre uno y otro), como las tarjetas de Gestión.
   Busca sola los bloques: entra en el contenedor principal hasta encontrar varios hijos visibles; si uno es muy alto, usa sus hijos.
   No toca cabeceras fijas, barras de navegación, nada escondido ni lo marcado con data-entra-no.
   Con Animaciones apagadas en Ajustes (html.noanim) no hace nada. Uso: llegar() o llegar({ raiz: elemento, titulo: false }). */
const EASE = 'cubic-bezier(.22,1,.36,1)';
const FUERA = 'script,style,link,template,[hidden],[aria-hidden="true"],.sy-telon,header,nav,footer,[data-entra-no],[role="dialog"]';

function visibles(lista, vh) {
  return [...lista].filter((el) => {
    if (!(el instanceof HTMLElement) || el.matches(FUERA)) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed' || cs.position === 'sticky') return false;
    const r = el.getBoundingClientRect();
    return r.height > 0 && r.width > 0 && r.top < vh && r.bottom > 0;
  });
}

/* solo si el destello no le quita el color a una parte del titular (un degradado propio sí se respeta) */
function puedeBrillar(h) {
  const cs = getComputedStyle(h);
  if (cs.backgroundClip === 'text' || cs.webkitBackgroundClip === 'text' || cs.backgroundImage !== 'none') return false;
  for (const e of h.querySelectorAll('*')) {
    const c = getComputedStyle(e);
    const clip = c.backgroundClip === 'text' || c.webkitBackgroundClip === 'text';
    if (!clip && c.color !== cs.color) return false;
  }
  return true;
}

/* Ajustes › Animaciones apagadas: core.js pone html.noanim, pero en páginas sin core.js (o antes de que cargue) se lee directo */
export function sinAnimaciones() {
  try { return (JSON.parse(localStorage.getItem('synthz:cfg')) || {}).anim === false; } catch (e) { return false; }
}

export function llegar({ raiz = null, titulo = true, cascada = true, max = 12 } = {}) {
  if (typeof window === 'undefined') return 0;
  const H = document.documentElement;
  if (H.classList.contains('noanim') || sinAnimaciones()) return 0;
  const vh = window.innerHeight;
  const base = raiz || document.querySelector('main') || document.body;
  if (titulo) {
    const h = base.querySelector('h1');
    if (h && visibles([h], vh).length && puedeBrillar(h)) {
      h.classList.add('sy-brilla');
      const fin = () => h.classList.remove('sy-brilla');
      h.addEventListener('animationend', fin, { once: true });
      setTimeout(fin, 2200);
    }
  }
  if (!cascada) return 0;
  let nivel = base;
  for (let k = 0; k < 5; k++) {
    const v = visibles(nivel.children, vh);
    if (v.length === 1 && v[0].children.length) nivel = v[0]; else break;
  }
  const items = visibles(nivel.children, vh)
    .flatMap((el) => (el.getBoundingClientRect().height > vh * 0.6 && visibles(el.children, vh).length > 1 ? visibles(el.children, vh) : [el]))
    .slice(0, max);
  items.forEach((el, n) => {
    if (!el.animate) return;
    const o = { duration: 800, easing: EASE, delay: 60 + n * 70, fill: 'backwards' };
    el.animate([{ opacity: 0 }, { opacity: 1 }], o);
    /* el movimiento se SUMA al que ya tenga cada bloque (no le pisa su translate/scale propio) */
    el.animate([{ translate: '0 28px', scale: 0.985 }, { translate: '0 0', scale: 1 }], { ...o, composite: 'add' });
  });
  return items.length;
}
