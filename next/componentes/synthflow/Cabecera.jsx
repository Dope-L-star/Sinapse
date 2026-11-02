/* SynthFlow en React · cabecera de arriba (IA elegida, guía y menú ⋯)
   v3.7 · pasó de árbol JSON generado a componente JSX propio. Conserva IDs, clases y data-* porque el motor (chat.js) los usa.
   Para cambiar el marcado de SynthFlow se edita AQUÍ; chat.html queda solo para las pruebas viejas y build.mjs (verificar-migracion.mjs revisa que no se pierda ningún ID). */
export default function Cabecera(){
  return (
    <>
      <header className="top" id="top">
        <button className="navbtn" id="navBtn" type="button" aria-label="Abrir el men\u00fa" aria-expanded="false" aria-controls="tabbar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
        </button>
        <a className="mlogo" href="index.html" id="mLogo" aria-label="SynthFlow: volver a SymphorIA" />
        <div className="pickrow" id="pickRow" />
        <span className="tsp" />
        <div className="now" id="now" aria-live="polite" />
        <button className="guideb" id="guideTop" type="button" aria-label="Gu\u00eda r\u00e1pida">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01" /></svg>
          <span>Guía rápida</span>
        </button>
        <button className="moreb" id="moreBtn" type="button" aria-label="M\u00e1s opciones del chat" aria-haspopup="menu">
          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
        </button>
      </header>
    </>
  );
}
