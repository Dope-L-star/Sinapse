/* ===== v3.8 · Vista previa de temas en Ajustes
   Antes de tocar «Guardar» ya ves cómo queda: una ventanita de SynthFlow (componente React VistaTemas, montado por
   next/componentes/ajustes/PuenteVistaTemas.jsx) pintada con el tema que señalas o eliges, con tu estilo y tamaño.
   En SynthFlow, además, la página de atrás cambia de color al instante; si cierras sin guardar, vuelve como estaba.
   Los temas «Pronto» (Aurora y Oro negro) se pueden mirar, pero no elegir. ===== */
let vtCur = null;
function vtSend(){
  const v = vtCur; if (!v || !v.host.isConnected) return;
  const id = v.hover || v.draft.theme || 'synthz', T0 = THEMES.find(t => t[0] === id), locked = !!(T0 && T0[3]);
  const d = { host:v.host, theme:id, ui:v.draft.ui === 'simple' ? 'simple' : 'full', size:v.draft.size === 'normal' ? 'normal' : 'compact', lang:lang(), locked, hovering:!!v.hover && id !== (v.draft.theme || 'synthz') };
  window.__symphoriaVistaTemas = d;
  try{ dispatchEvent(new CustomEvent('symphoria:vista-temas', { detail:d })); }catch(e){}
  /* en vivo detrás de la ventana: solo en SynthFlow, con el estilo SynthFlow y con temas que ya se pueden usar */
  if (v.chat){
    const live = v.draft.ui !== 'simple' ? (!locked ? id : (v.draft.theme || 'synthz')) : null;
    if (live && live !== 'synthz' && THEMES.some(t => t[0] === live && !t[3])) root.dataset.theme = live; else delete root.dataset.theme;
  }
}
onLang(() => vtSend());
function cfgThemePreview(o, draft){
  const grid = $('#cfgTh', o); if (!grid || $('#cfgThPrev', o)) return;
  const host = document.createElement('div'); host.id = 'cfgThPrev'; host.className = 'cfgthprev notr';
  grid.after(host);
  vtCur = { o, host, draft, hover:null, chat:!!document.getElementById('composer') || /chat(\.html)?$/.test(location.pathname) };
  const me = vtCur;
  $$('[data-th]', grid).forEach(b => {
    const on = () => { me.hover = b.dataset.th; vtSend(); }, off = () => { if (me.hover === b.dataset.th){ me.hover = null; vtSend(); } };
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') on(); }); b.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') off(); });
    b.addEventListener('focus', on); b.addEventListener('blur', off);
    /* el clic de 14 ya guardó el tema en el borrador; uno «Pronto» solo se muestra */
    b.addEventListener('click', () => { me.hover = b.dataset.lock ? b.dataset.th : null; vtSend(); if (b.dataset.lock) toast(lang() === 'en' ? 'Coming soon: you can look at it, but not choose it yet.' : 'Llega pronto: puedes mirarlo, pero todavía no elegirlo.'); });
  });
  $$('[data-ui], [data-sz]', o).forEach(b => b.addEventListener('click', () => setTimeout(vtSend, 0)));
  /* al cerrar (con o sin guardar) la página vuelve a lo que diga la configuración guardada */
  const mo = new MutationObserver(() => { if (o.classList.contains('on') && o.isConnected) return; mo.disconnect(); if (vtCur === me) vtCur = null; window.__symphoriaVistaTemas = null; try{ dispatchEvent(new Event('symphoria:vista-temas-fin')); }catch(e){} cfgClasses(); });
  mo.observe(o, { attributes:true, attributeFilter:['class'] });
  vtSend();
}
