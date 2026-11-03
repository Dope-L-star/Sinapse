# Velocidad y calidad (Lighthouse)

La nota de partida, medida el 28 de octubre de 2026 con Lighthouse 12. Se midió sobre `dist/`, servido en local con compresión; en el celular, Lighthouse simula una conexión lenta y un procesador 4 veces más lento. Sirve para comparar los cambios: vuelve a medir con el mismo método antes y después.

| Página | Equipo | Velocidad | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portada (`index.html`) | Celular | 41 | 100 | 96 | 100 | 5,6 s | 2.510 ms | 0,008 |
| Portada (`index.html`) | Computador | 90 | 100 | 96 | 100 | 0,9 s | 70 ms | 0,146 |
| SynthFlow (`chat.html`) | Celular | 60 | 100 | 96 | 100 | 4,9 s | 420 ms | 0 |
| SynthFlow (`chat.html`) | Computador | 92 | 100 | 96 | 100 | 1,1 s | 20 ms | 0,02 |
| Ayuda (`ayuda.html`) | Celular | — | 100 | 96 | 100 | — | — | — |

Notas:
- Accesibilidad llegó a 100 después de cuatro arreglos: SynthonIA de la portada ya no está dentro de algo con `aria-hidden`, la burbujita del glosario no queda vacía, los botones de idioma y el logo del chat dicen lo mismo que se ve, y las pestañas Chats y Favoritos tienen su `tablist`.
- Buenas prácticas marca 96 solo porque en la prueba local se bloquea internet (fuentes, Puter): salen errores en la consola que en la página real no aparecen.

## Qué falta para el celular

1. **La portada en el celular (41).** El hilo principal trabaja 13,5 s: 6,5 s de «otros» y 4 s de estilos y diseño. Eso viene de las animaciones que corren al mismo tiempo (fondo espacial, aurora, SynthonIA, escenas). `core.js` tarda 1 s en arrancar. Lo que más ayudaría: pausar lo que no se ve, arrancar las escenas después del primer dibujo y bajar la cantidad de capas animadas en celulares lentos.
2. **JavaScript sin usar.** Se podrían ahorrar 87 KB en la portada y 151 KB en el chat cargando aparte lo que no se usa al entrar (Pulsem, A.L.I.A.S., eventos).
3. **La portada tiene 2.400 elementos.** Las escenas de abajo se podrían armar cuando la persona llega a ellas.

## Fase 4 · 3 de noviembre de 2026 (antes → después)

Medido en local sobre el mismo export de Cloudflare (`cloudflare/public`), con compresión. «Lista para usar» = todos los motores cargados (evento `symphoria:react-page-ready`), mediana de 5 cargas; celular = 4G lento (150 ms, 1,6 Mbps) y procesador 4× más lento.

| Página | Equipo | Lista para usar antes | Después |
| --- | --- | --- | --- |
| Portada | Celular | 7,4 s | 6,8 s |
| Portada | Computador | 1,74 s | 1,43 s |
| SynthFlow | Celular | 6,4 s | 5,5 s |
| SynthFlow | Computador | 1,01 s | 0,93 s |

Lighthouse (mediana de 3): portada en celular 42 → 51 (LCP 5,9 s → 3,7 s). En SynthFlow el LCP es el saludo que escribe chat.js: antes a veces quedaba fuera de la medición y la nota salía más alta de lo real; con los motores en paralelo el saludo sale ~1 s antes.

Servidor (prueba de carga local, `node t/carga/carga.mjs`): comandos de Redis por visita (config + salud + lista de IAs + latido) 20 → 7,2; con 500 visitas a la vez, 0 errores y p95 de 80 ms en nuestro código (sin contar a las IAs de afuera).

Qué sigue pesando: las animaciones de la portada (fondo, aurora, escenas) son la mayor parte del trabajo del celular, y el latido de cada 10 min es lo que más gasta Redis.
