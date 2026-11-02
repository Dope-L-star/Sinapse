/* SynthFlow en React · selector de IA («Elige tu IA» y «Comparar IAs»)
   v3.7 · pasó de árbol JSON generado a componente JSX propio. Conserva IDs, clases y data-* porque el motor (chat.js) los usa.
   v3.7 · ya trae las dos columnas armadas (antes el motor movía los nodos al arrancar).
   Para cambiar el marcado de SynthFlow se edita AQUÍ; chat.html queda solo para las pruebas viejas y build.mjs (verificar-migracion.mjs revisa que no se pierda ningún ID). */
export default function Selector(){
  return (
    <>
      <aside className="side two-p v37 two" id="side" aria-label="Elegir IA" aria-hidden="true" role="dialog" aria-modal="true">
        {/* izquierda: «Personalizar búsqueda» (se abre con el botón; en celular entra por encima) */}
        <div className="pf-l" role="group" aria-label="Personalizar búsqueda">
          <div className="pl-head">
            <b>Personalizar búsqueda</b>
            <button type="button" className="pr-back" id="pBack">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              <span>Listo</span>
            </button>
          </div>
          <p className="plbl">¿Para qué la quieres?</p>
          <div className="ptopics" id="pTopics" role="group" aria-label="Temas" />
          <p className="plbl">En qué son buenas</p>
          <div className="filters" id="filters" />
          <p className="plbl">De dónde</p>
          <div className="seg prov" id="provSeg" role="tablist" aria-label="De dónde">
            <span className="pill" />
            <button role="tab" data-p="all" aria-selected="true">Todos</button>
            <button role="tab" data-p="sz" aria-selected="false"><i className="pdot" data-pd="sz" /><span className="sz-logo" aria-hidden="true" />Gratis</button>
            <button role="tab" data-p="pu" aria-selected="false">
              <i className="pdot" data-pd="pu" />
              <span className="pu-logo"><img src="https://developer.puter.com/favicons/ms-icon-144x144.png" alt="" referrerpolicy="no-referrer" /></span>
              Puter
            </button>
          </div>
          <div className="sortrow">
            <span className="slbl" style={{margin:"0"}}><b id="liveN">0</b> IA</span>
            <div className="live" id="live" data-s="loading">
              <span className="live-dot" />
              <b id="liveLbl">Conectando…</b>
              <span id="liveAgo" />
              <span className="sp" />
              <button className="refresh" id="refreshBtn" aria-label="Actualizar la lista en vivo" title="Actualizar ahora">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg>
              </button>
            </div>
            <div className="seg mini" id="sortSeg" role="tablist" aria-label="Ordenar">
              <span className="pill" />
              <button role="tab" data-s="new" aria-selected="true">Más nuevas</button>
              <button role="tab" data-s="ctx" aria-selected="false">Textos largos</button>
              <button role="tab" data-s="az" aria-selected="false">A–Z</button>
            </div>
          </div>
        </div>
        {/* derecha: las IA (buscar, pestañas, lista y el botón de Comparar) */}
        <div className="pf-r" role="group" aria-label="Las IA">
          <div className="phead">
            <b id="pTitle">Elige tu IA</b>
            <span className="pr-n" id="prN" />
            <button className="x-close" id="sideClose" type="button" aria-label="Cerrar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <label className="field search" id="searchBox">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input id="q" type="text" placeholder="Busca una IA… o escribe lo que quieres hacer" autoComplete="off" spellCheck="false" aria-label="Buscar IA" />
            <kbd>/</kbd>
            <button type="button" className="qx" id="qClear" aria-label="Borrar búsqueda">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </label>
          <div className="pq">
            <div className="seg ptabs" id="pTabs" role="tablist" aria-label="Qué IA ver">
              <span className="pill" />
              <button role="tab" data-pt="forme" aria-selected="true">✦ Para ti</button>
              <button role="tab" data-pt="all" aria-selected="false">Todas</button>
              <button role="tab" data-pt="fav" aria-selected="false">Mis favoritas</button>
            </div>
            <button type="button" className="pcust" id="pCust" aria-expanded="false" aria-controls="side">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2.2" /><circle cx="10" cy="17" r="2.2" /></svg>
              <span>Personalizar búsqueda</span>
              <i className="pc-n" id="pCustN" hidden />
            </button>
          </div>
          <p className="pnote" id="pNote" hidden />
          <div className="mlist" id="mlist" role="listbox" aria-label="IA disponibles" />
          <div className="pfoot">
            <button type="button" className="btn sm flow pgo" id="pGo" hidden>Comparar estas 2 →</button>
          </div>
        </div>
        <button className="btn sm side-done" id="sideDone" type="button">Listo</button>
      </aside>
    </>
  );
}
