# Guía de diseño de SymphorIA («Partitura»)

Esta guía es para que cualquier pantalla nueva salga bien a la primera y se vea de la misma familia que el resto del sitio.
Antes de diseñar algo, léela entera. Y antes de entregarlo, pasa la lista del final.

Las piezas de código están en `next/componentes/partitura/` (la piel) y `next/componentes/entrada/` (la carga).
Todo diseño nuevo se hace directo en React (Next, `next/componentes/…`). Las páginas viejas (`src/…` + `build.mjs`) solo se arreglan.

---

## 1. La idea

Una sola piel para todo: **tinta oscura + las 5 líneas de la marca** (un pentagrama). Cada producto tiene su color de acento, el resto es tranquilo.

| Qué | Valor | Variable |
|---|---|---|
| Fondo (tinta) | `#0B0A12` · capas `#100F19`, `#171624` | `--ink`, `--ink-2`, `--ink-3` |
| Texto | `#F4F2FA` · suave `#B3AFC4` · tenue `#8E8AA2` | `--text`, `--muted`, `--faint` |
| Las 5 líneas | cian `#3DE0FF` · violeta `#7B3FF2` · rosa `#FF3D9A` · naranja `#FF7A45` · oro `#FFC857` | `--c`, `--v`, `--p`, `--o`, `--g` |
| Degradado de marca | cian → violeta → rosa → naranja | `--grad` |
| Vidrio | `rgba(255,255,255,.045)` / `.075`, borde `.09` / `.16` | `--glass`, `--glass-2`, `--line`, `--line-2` |
| Radios | 12 · 18 · 28 px | `--r-s`, `--r`, `--r-l` |
| Letras | titulares Bricolage Grotesque · texto Figtree · etiquetas IBM Plex Mono | `--display`, `--sans`, `--mono` |
| Movimiento | `cubic-bezier(.22,1,.36,1)`, 0,6–0,9 s | `--ease` |

Acento por producto: **SynthFlow cian**, **A.L.I.A.S. violeta** (solo tema oscuro), **Pulsem rosa**, **Obertura oro**.

El degradado de marca va en pocos lugares (3 a 5 por pantalla): una palabra del titular, el botón principal, el progreso, lo activo. Nunca de fondo de bloques grandes.

## 2. Las piezas que ya existen (úsalas, no las copies)

| Pieza | Para qué | Cómo |
|---|---|---|
| `partitura/partitura.css` | tokens, botones (`.btn`, `.btn-w`, `.btn-g`), `.card`, `.chip`, `.tag`, campos, pie, barra del celular | `import '../partitura/partitura.css'` |
| `partitura/BarraSuperior.jsx` | la misma barra arriba en todas las páginas (logo, productos, ES/EN, Entrar) | `<BarraSuperior producto="alias" idioma={lang} onIdioma={…} />` |
| `partitura/Pentagrama.jsx` | las 5 líneas animadas (motor en Rust/WebAssembly con respaldo en JS). `modo="afinando"`: las líneas se juntan en un latido | `<Pentagrama alto={60} />` |
| `partitura/Chispas.jsx` | chispas de fondo de la portada | `<Chispas />` |
| `.ai` | ícono de una IA: círculo oscuro con su logo (`ico/*.svg`) | `<span className="ai"><img src="/ico/x.svg" alt="" /></span>` |
| **`entrada/Esqueleto.jsx`** | mientras algo carga: su forma en vacío con un brillo que la recorre | ver §3 |
| **`entrada/Telon.jsx`** | al abrir una página: tinta + esqueleto hasta que está lista, y luego la llegada | ver §3 |
| **`entrada/llegada.js`** | el titular destella una vez y los bloques suben en cascada | `llegar()` |

## 3. La carga: «Entrada» (la animación de Gestión, en todo el sitio)

Nunca un «Cargando…» suelto, nunca un circulito que gira, nunca un fogonazo de color. Siempre en este orden:

1. **Esqueleto con brillo.** Se dibuja la *forma* de lo que va a llegar y una franja de luz (cian → violeta → rosa) la recorre, cada bloque 90 ms después del anterior.
   ```jsx
   import Esqueleto from '../entrada/Esqueleto';
   <p role="status">{t.cargando}</p>          {/* el texto para lectores de pantalla, ES/EN */}
   <Esqueleto forma="lista" n={3} />           {/* tablero · panel · lista · tarjeta · pagina · chat */}
   ```
   Elige la forma más parecida a lo que va a aparecer. Si ninguna sirve, agrega una en `Esqueleto.jsx` + `entrada.css` (y anótala aquí).
2. **Telón.** Cada página nueva lleva `<Telon />` como primer hijo (o `<Telon centro />` si su contenido va centrado; `espera="legacy"` si un motor viejo pone textos). Sale ya dibujado en el HTML: si la página está lista en menos de 0,2 s, el esqueleto ni se ve.
3. **Llegada.** Al quitarse el telón el titular destella una vez (solo si no tiene ya su propio brillo o partes de otro color) y los bloques visibles suben 28 px y aparecen, 70 ms entre uno y otro. Si una pantalla carga datos después (como Gestión), cuando lleguen haz lo mismo: tarjetas con `animation-delay: calc(var(--i) * 70ms)` o `llegar({ raiz })`.

Dónde está hoy: portada, SynthFlow (en el velo de arranque), A.L.I.A.S. (página y «Qué IA hace cada cosa»), Pulsem (puerta y panel), Gestión, Ayuda, Términos, Privacidad y Sin conexión.

## 4. Reglas fijas de Sammuel (no se discuten)

- **Todo texto visible en español e inglés.** Nada de inglés suelto en la versión en español ni al revés.
- **Celular primero en la revisión**: se prueba a 390 px. Nada de paneles enormes ni fondos estirados. Botones de 44 px o más.
- **Los arreglos van a TODAS las páginas**, también Privacidad, Términos, Ayuda y Sin conexión.
- **Las Animaciones las decide Ajustes** (`html.noanim`), no el sistema operativo. Con Animaciones apagadas nada se mueve; todo sigue funcionando.
- **Nada de pagar**: solo código propio o gratis. Sin CDNs nuevos (la CSP solo deja los que ya están); las librerías se guardan en `lib/`.
- **Íconos en SVG en línea**, sin fuentes de íconos.
- **Nunca mostrar cantidad de mensajes** a la gente: solo la energía EnerX en %, sin decimales.
- **Funciones nuevas y pagos: apagados** para todos hasta que Sammuel diga. Pagos simulados = piden correo, no cobran.
- **Nada del diseño viejo**: ni la Z vieja, ni el velo lila, ni videos o fondos de versiones anteriores.
- **Uiverse y similares son recursos de estilo**: se adaptan al tema (colores, ES/EN, celular), se quita el comentario «From Uiverse.io by…» y nunca reemplazan algo que funciona sin preguntar.

## 5. Cómo se ve bien (los 7 principios)

1. Una sola idea fuerte por pantalla: un titular, una frase, una acción principal. Si dudas entre añadir o quitar, quita.
2. Profundidad con vidrio (fondo translúcido + borde de 1 px + brillo arriba), no con cajas grises.
3. Color con disciplina: tinta de base, degradado solo en 3–5 lugares.
4. Movimiento que explica: entra de abajo, sale fundiéndose; 0,6–0,9 s con `--ease`. Nunca rebotes largos ni cosas que se mueven solas sin razón.
5. Pocos detalles bien hechos (4–5), no 20.
6. Contraste 4,5:1 o más, foco visible, la primera pantalla se entiende en 3 segundos.
7. Que se sienta de la misma familia: misma barra, mismas letras, mismos botones, misma carga.

## 6. Lista antes de entregar

- [ ] Usa `BarraSuperior`, los tokens de `partitura.css` y las piezas de §2 (nada copiado y pegado con otros colores).
- [ ] Lo que carga muestra `Esqueleto` con su forma; la página lleva `Telon`.
- [ ] Probado a 1280 px y a 390 px, en español y en inglés.
- [ ] Con Ajustes › Animaciones apagadas no se mueve nada y todo funciona.
- [ ] Sin errores en la consola.
- [ ] Pasan `node build.mjs --check`, `node next/verificar-migracion.mjs`, `node t/humo/humo.mjs` y `node t/portada/calidad.mjs` (y `node next/armar.mjs` arma sin errores).
- [ ] Capturas o video antes/después en la carpeta del proyecto.
