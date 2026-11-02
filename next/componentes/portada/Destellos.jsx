/* Destellos alrededor de un botón de «crear/empezar» (recurso de estilo Uiverse #54: partículas sparkle).
   Solo CSS: las estrellitas salen al pasar el mouse o al enfocar con teclado. */
export default function Destellos({ children }) {
  return (
    <span className="pn-destellos">
      {children}
      <span className="pn-chispas" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</span>
    </span>
  );
}
