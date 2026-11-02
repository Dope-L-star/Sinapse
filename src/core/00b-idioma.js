/* ===== v3.0 · idioma: toda la página en español o en inglés =====
   Textos en I18N.es / I18N.en con claves planas («nav.chat», «syn.title»…). Cada hilo/área pone sus textos en su propia pieza
   (00c-idioma-landing.js, 00d-idioma-flow.js…) con Object.assign(I18N.es, {…}); Object.assign(I18N.en, {…}).
   t('clave', { n:3 }) cambia {n}; {brand} es BRAND(). Si falta en inglés, sale el español; si falta del todo, sale la clave.
   HTML: data-i18n="clave" (texto), data-i18n-html="clave" (solo textos nuestros con <b>/<br>), data-i18n-attr="placeholder=clave;aria-label=clave2". */
const I18N = { es:{}, en:{} };
const LANGS = [['es', 'Español'], ['en', 'English']];
let LANG = (() => {
  try{ const s = localStorage.getItem('synthz:lang'); if (s === 'es' || s === 'en') return s; }catch(e){}
  return sysLang();
})();
/* v3.7 · primera visita: entra en el idioma del navegador o del computador (Sammuel, 2 nov).
   Se recorre la lista de idiomas preferidos: el primero que sea español o inglés manda.
   Si ninguno lo es (francés, alemán, japonés…), entra en inglés, que se entiende en más lugares. Lo que elijas a mano siempre se respeta. */
function sysLang(){
  const L = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || 'es'];
  for (const l of L){ const c = String(l).slice(0, 2).toLowerCase(); if (c === 'es' || c === 'en') return c; }
  return 'en';
}
document.documentElement.lang = LANG;
const lang = () => LANG;
function t(k, v){
  let s = (I18N[LANG] && I18N[LANG][k]) ?? I18N.es[k] ?? k;
  if (typeof s === 'function') return s(v || {});
  return String(s).replace(/\{(\w+)\}/g, (m, n) => n === 'brand' ? BRAND() : (v && v[n] != null ? v[n] : m));
}
function i18nApply(r = document){
  /* si el texto ya es el mismo no se toca: así no se borran las letras animadas (charify) ni se rompen referencias */
  r.querySelectorAll('[data-i18n]').forEach(el => { const v = t(el.dataset.i18n); if (el.textContent !== v) el.textContent = v; });
  const tp = document.createElement('template');
  r.querySelectorAll('[data-i18n-html]').forEach(el => { tp.innerHTML = t(el.dataset.i18nHtml); if (el.innerHTML !== tp.innerHTML) el.innerHTML = tp.innerHTML; });
  r.querySelectorAll('[data-i18n-attr]').forEach(el => el.dataset.i18nAttr.split(';').forEach(p => { const [a, k] = p.split('=').map(x => x && x.trim()); if (a && k) el.setAttribute(a, t(k)); }));
}
const langHooks = [];
function setLang(l){
  if (!I18N[l] || l === LANG) return;
  LANG = l; document.documentElement.lang = l;
  try{ localStorage.setItem('synthz:lang', l); }catch(e){}
  i18nApply(); langHooks.forEach(f => { try{ f(l); }catch(e){} });
}
const onLang = f => langHooks.push(f);
addEventListener('storage', e => { if (e.key === 'synthz:lang' && e.newValue && e.newValue !== LANG) setLang(e.newValue); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => i18nApply()); else setTimeout(() => i18nApply(), 0);
