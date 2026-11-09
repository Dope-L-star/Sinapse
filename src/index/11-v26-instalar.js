/* ===== v2.6 · botón «Instalar la app» (en el pie, en el menú ☰ y en Preguntas).
   Android y computador (Chrome, Edge): abre el diálogo de instalar del navegador.
   iPhone: muestra los pasos (Compartir › Agregar a inicio). Si ya está instalada, los botones no aparecen. ===== */
(() => {
const btns = () => document.querySelectorAll('[data-install],[data-install-note]');
const hideAll = () => btns().forEach(b => { b.hidden = true; });
if (SZ.appStandalone && SZ.appStandalone()){ hideAll(); return; }
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('button[data-install]'); if (!b) return;
  e.preventDefault();
  const nd = document.getElementById('navDrop'); if (nd && nd.contains(b)) nd.hidden = true;
  /* sin instalación directa (iPhone, Firefox…), la ventana abre ya con los 3 pasos a la vista */
  /* v4.1 · en Windows primero se ve la ventana: ahí está el instalador propio (Obertura) y, debajo, el del navegador */
  if (SZ.appWin && SZ.appWin()){ SZ.appPromo(true); return; }
  Promise.resolve(SZ.appInstall ? SZ.appInstall() : SZ.appPromo(true)).then(ok => {
    if (ok){ hideAll(); return; }
    const go = document.querySelector('#appPromo [data-ap="go"]'); if (!go) return;
    go.click(); setTimeout(() => { const a = document.querySelector('#appPromo .ap-acts'); if (a) a.scrollIntoView({ block:'end', behavior:'smooth' }); }, 450);
  }).catch(() => {});
});
addEventListener('appinstalled', hideAll);
})();
