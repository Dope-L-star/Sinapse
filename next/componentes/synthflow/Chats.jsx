/* SynthFlow en React · barra de chats (lista, búsqueda y pie)
   v3.7 · pasó de árbol JSON generado a componente JSX propio. Conserva IDs, clases y data-* porque el motor (chat.js) los usa.
   Para cambiar el marcado de SynthFlow se edita AQUÍ; chat.html queda solo para las pruebas viejas y build.mjs (verificar-migracion.mjs revisa que no se pierda ningún ID). */
import BarraNav from './BarraNav';
import PieBarra from './PieBarra';

export default function Chats(){
  return (
    <>
      <aside className="chats" id="chats" aria-label="Tus chats">
        <div className="cin">
          <div className="chead">
            <a className="back sfb" href="index.html" id="backLink" aria-label="Volver a Sinapse">
              <svg className="arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              <span className="sfx">
                <span className="sf-a word" id="sideWord" />
                <span className="sf-b" aria-hidden="true">
                  <img className="lgz mark" src="media/v30/symphoria.svg" alt="" draggable="false" />
                  <span className="word" id="sideZ" />
                </span>
              </span>
            </a>
            <button className="x-close" id="chatsClose" type="button" aria-label="Cerrar tus chats">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <BarraNav />
          <div className="cseg" id="cSeg" role="tablist" aria-label="Chats y favoritos" hidden>
            <span className="pill" aria-hidden="true" />
            <button role="tab" data-v="chats" aria-selected="true">Chats</button>
            <button role="tab" data-v="favs" aria-selected="false">Favoritos</button>
          </div>
          <button type="button" className="cnew" id="cNew">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Nueva conversación
          </button>
          <div className="cfavh" id="cFavH" hidden><b>★ Favoritos</b><button type="button" className="lnk" id="cFavBack">← Mis chats</button></div>
          <label className="field csearch" id="cSearch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input id="thQ" type="search" placeholder="Buscar en mis chats…" autoComplete="off" spellCheck="false" aria-label="Buscar en mis chats" />
          </label>
          <p className="sn-h">Recientes</p>
          <div className="thlist" id="thList" data-clarity-mask="true" />
          <div className="side-foot" id="sideFoot" data-clarity-mask="true" />
          <PieBarra />
        </div>
      </aside>
    </>
  );
}
