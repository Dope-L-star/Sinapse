'use client';
/* SymphorIA · «Entrada» · el telón de cada página.
   Sale ya dibujado en el HTML (sin esperar a JavaScript): tinta de la marca y, si la página tarda más de 0,2 s, el esqueleto
   de la página con su brillo. Cuando la página está lista se funde y llega el contenido (llegada.js: titular que destella y
   bloques en cascada). Así no hay fogonazos de color ni la página «armándose» a la vista.
   Con la píldora de la frase de carga (FraseTelon): una frase al azar, con tu nombre a veces, distinta cada vez (frases.js).
   «Lista» = React montado + la ventana cargada + las letras listas (+ los motores viejos si espera="legacy"), con un tope.
     <Telon />                     esqueleto de página normal (titular, bajada, tarjetas)
     <Telon centro />              titular centrado y una caja grande (portada, A.L.I.A.S.)
     <Telon espera="legacy" />     además espera a LegacyRuntime (páginas cuyo texto lo pone un motor viejo, p. ej. el idioma de Ayuda)
     <Telon llegada={false} />     solo el telón (la página ya trae su propia entrada) */
import { useEffect, useRef } from 'react';
import Esqueleto from './Esqueleto';
import { FraseTelon } from './FraseCarga';
import { llegar, sinAnimaciones } from './llegada';

const tope = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);

export default function Telon({ forma = 'pagina', centro = false, espera = null, max = 3500, llegada = true, raiz = null }) {
  const ref = useRef(null);
  useEffect(() => {
    let vivo = true;
    if (sinAnimaciones()) document.documentElement.classList.add('noanim');   /* sin brillo ni fundido, desde el primer momento */
    const t0 = performance.now();
    const cargada = document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r, { once: true }));
    const letras = document.fonts && document.fonts.ready ? tope(document.fonts.ready, 1200) : Promise.resolve();
    const motores = espera === 'legacy' && !window.__syLegacyListo
      ? new Promise((r) => addEventListener('symphoria:react-page-ready', r, { once: true })) : Promise.resolve();
    tope(Promise.all([cargada, letras, motores]), Math.max(0, max - (performance.now() - t0))).then(() => {
      if (!vivo || !ref.current) return;
      requestAnimationFrame(() => {
        if (!ref.current) return;
        ref.current.classList.add('fuera');
        document.documentElement.classList.add('sy-listo');
        if (llegada) llegar({ raiz: raiz ? document.querySelector(raiz) : null });
      });
    });
    return () => { vivo = false; };
  }, [espera, max, llegada, raiz]);
  return (
    <div className="sy-telon" ref={ref} aria-hidden="true" data-mv-no="">
      <span className="sy-pie" />
      <Esqueleto forma={forma} centro={centro} />
      <FraseTelon />
    </div>
  );
}
