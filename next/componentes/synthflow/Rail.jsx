/* SynthFlow en React · barrita de íconos
   v3.7 · pasó de árbol JSON generado a componente JSX propio. Conserva IDs, clases y data-* porque el motor (chat.js) los usa.
   Para cambiar el marcado de SynthFlow se edita AQUÍ; chat.html queda solo para las pruebas viejas y build.mjs (verificar-migracion.mjs revisa que no se pierda ningún ID). */
export default function Rail(){
  return (
    <>
      <nav className="rail" id="rail" aria-label="Barra lateral">
        <div className="rin">
          <div className="rhead">
            <button className="rbtn rtog" id="railTog" type="button" aria-label="Abrir la barra" aria-expanded="false" data-tip="Abrir la barra">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3.5" y="4.5" width="17" height="15" rx="3.5" />
                <path d="M9.5 4.5v15" />
                <path className="chv" d="M13.5 10l2 2-2 2" />
              </svg>
            </button>
            <a className="rword" href="index.html" id="railWord" aria-label="SynthFlow" tabIndex="-1" />
          </div>
          <div className="rgrp">
            <button className="rbtn" type="button" data-r="chats" data-tip="Mis chats" style={{"--i":"0"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
                <path d="M20 9h1a1 1 0 0 1 1 1v8l-3-2h-6" />
              </svg>
              <span className="rl">Mis chats</span>
            </button>
            <button className="rbtn" type="button" data-r="new" data-tip="Nuevo chat" style={{"--i":"2"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h8" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
              <span className="rl">Nuevo chat</span>
            </button>
            <button className="rbtn" type="button" data-r="search" data-tip="Buscar en mis chats" style={{"--i":"3"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <span className="rl">Buscar en mis chats</span>
            </button>
            <button className="rbtn" type="button" data-r="favs" id="railFav" data-tip="Mensajes favoritos" style={{"--i":"4"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z" /></svg>
              <span className="rl">Favoritos</span>
            </button>
          </div>
          <span className="rsp" />
          <div className="rgrp rbot">
            <button className="rbtn rcoin" type="button" id="railCoin" data-tip="Tu l\u00edmite de hoy" style={{"--i":"4"}} />
            <a className="rbtn rpulse" href="pulsem.html" id="railPulse" data-tip="Pulsem (equipo)" style={{"--i":"4"}} hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2.5-6 4 12 3-8 1.5 2H22" /></svg>
              <span className="rl">Pulsem (equipo)</span>
            </a>
            <button className="rbtn" type="button" id="cfgBtn" data-tip="Ajustes" style={{"--i":"5"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></svg>
              <span className="rl">Ajustes</span>
            </button>
            <button className="rbtn rme" type="button" id="accBtn" data-clarity-mask="true" aria-label="Tu cuenta" data-tip="Tu cuenta" style={{"--i":"6"}} />
          </div>
        </div>
      </nav>
    </>
  );
}
