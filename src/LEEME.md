# Piezas de SymphorIA

Cada archivo grande de la página está partido en piezas pequeñas aquí.
**Se editan las piezas, nunca el archivo armado.** Luego: `node build.mjs`.

| Archivo armado | Piezas |
|---|---|
| core.js (lo compartido: datos, IA, cursor, portal…) | src/core/ |
| core.css | src/core-css/ |
| synthonia.js (Sona: cara, puntero, sonidos, ventanita, guía, eventos, mantenimiento; va aparte desde v3.4) | src/synthonia/ |
| chat.js / chat.css (SynthFlow) | src/chat/ · src/chat-css/ |
| index.js / index.css (portada SymphorIA) | src/index/ · src/index-css/ |
| pulsem.js / pulsem.css (panel del equipo) | src/pulsem/ · src/pulsem-css/ |

Las piezas de core.js comparten todo entre sí (son un solo bloque de código partido en orden),
por eso una pieza sola no funciona: siempre se unen con `node build.mjs`.
`node build.mjs --check` avisa si alguien cambió un archivo armado a mano.

**Sona va en su propio archivo (v3.4).** `synthonia.js` usa lo de core por `SZ.__syn` y devuelve lo suyo con `SZ.__syn.ready({…})`
(ver `src/core/00e-synthonia-puente.js`). La portada la carga enseguida con su etiqueta (`<script src="synthonia.js" data-syn>`);
SynthFlow y Pulsem la piden solas cuando la página ya cargó. Si algo necesita a Sona apenas abre la página, espera `SZ.synReady`.
Si una pieza nueva de Sona usa algo más de core, agrégalo a `SZ.__syn` (src/core/26-sz-para-todos.js) y al inicio de src/synthonia/00-inicio.js.
