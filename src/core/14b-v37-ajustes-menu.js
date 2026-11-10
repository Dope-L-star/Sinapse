/* ===== Ajustes con menú a la izquierda, como los de Claude (v3.7 el menú; v4.6 cada entrada es una sección con su página) =====
   Cuenta · General · Efectos · Respuestas · Memoria · Tus IAs. Tocar una abre su página; no hay scroll largo ni dos pestañas.
   Aquí solo están los íconos; el menú y las páginas los arma cfgModal (14-seguridad-ajustes.js). En el celular el menú pasa a una fila de chips arriba. ===== */
const CFG_NAV_ICO = {
  user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.4-3.8 4.2-5.6 7.5-5.6s6.1 1.8 7.5 5.6"/>',
  sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/>',
  brain:'<path d="M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 006 0V4.5A2.5 2.5 0 009 4zM15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-6 0"/>',
  link:'<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>'
};
const cfgNavIco = k => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (CFG_NAV_ICO[k] || CFG_NAV_ICO.sliders) + '</svg>';
