/* SynthFlow en React · barra de abajo del celular
   v3.7 · pasó de árbol JSON generado a componente JSX propio. Conserva IDs, clases y data-* porque el motor (chat.js) los usa.
   Para cambiar el marcado de SynthFlow se edita AQUÍ; chat.html queda solo para las pruebas viejas y build.mjs (verificar-migracion.mjs revisa que no se pierda ningún ID). */
export default function TabBar(){
  return (
    <>
      <nav className="tabbar" id="tabbar" aria-label="Secciones">
        <button type="button" data-tab="chats">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
            <path d="M20 9h1a1 1 0 0 1 1 1v8l-3-2h-6" />
          </svg>
          <span>Chats</span>
        </button>
        <button type="button" data-tab="ia">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>IA</span>
        </button>
        <button type="button" data-tab="coins" id="tabCoin"><span className="tci" /><span>EnerX</span></button>
        <button type="button" data-tab="cfg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></svg>
          <span>Ajustes</span>
        </button>
        <button type="button" data-tab="me" id="tabMe"><span className="tme" /><span>Tú</span></button>
      </nav>
    </>
  );
}
