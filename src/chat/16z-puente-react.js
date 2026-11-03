/* ===== v3.7 · puente entre el motor de SynthFlow (este chat.js) y sus componentes React =====
   Los componentes de next/componentes/synthflow/ llaman a estas funciones en vez de depender de IDs y clics simulados.
   Se avisa con el evento «synthflow-ready» (y queda en window.SZFlow) para que React sepa que ya puede usarlas. */
window.SZFlow = Object.freeze({
  newChat:() => newChat(),
  compare:anchor => cmpOpen(anchor),
  projects:() => pjOpen('list'),
  synthetics:() => synOpen(),
  settings:() => SZ.cfgModal(),
  favorites:() => showChats('favs'),
  energy:() => coinModal('panel'),
  guide:() => openGuide(),
  help:() => { location.href = 'ayuda.html'; },
  account:() => accModal(),
  hideBar:() => { const c = $('#chatsClose'); if (c) c.click(); },
  closeSheet:() => { if (isMobile()) closeChatsSheet(); },
  mode:() => mode,
  accInfo:() => accInfo,
  /* v3.8 · ventana «esta IA no responde»: la que mejor sirve para lo que escribiste, usarla, o seguir mirando */
  iaFor:(text, not) => iaFor(text, not),
  iaUse:id => { if (mode === 'cmp'){ if (!st().cmp.includes(id)) addToCompare(id, null); } else pickModel(id, null); setTimeout(() => inp.focus(), 60); },
  iaList:() => openSide(mode === 'cmp' ? 'add' : 'set'),
  lang:() => SZ.lang(),
  /* v4.1 · la ventana «Ver funcionando» (next/componentes/synthflow/VistaWeb.jsx) usa la lógica de src/chat/02c-web-proyecto.js */
  web:Object.freeze({
    doc:(P, path, o) => webDoc(P, path, o),
    go:(P, from, href) => webGo(P, from, href),
    zip:P => webZip(P),
    load:(f, html) => synLoad(f, html),
    tokens:(text, ext) => webTokens(text, ext),
    file:F => cnvDownload({ name:F.path, ext:F.ext, text:F.text })
  })
});
{ const w = $('#sNav .snw'); if (w && !w.firstChild) w.innerHTML = SZ.flowWord(); }
try{ dispatchEvent(new CustomEvent('synthflow-ready')); }catch(e){}
