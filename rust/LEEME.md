# Rust en SymphorIA

`rust/pentagrama/` es el motor de animación del diseño «Partitura», escrito en Rust y compilado a WebAssembly.

Calcula, cuadro a cuadro:

- las 5 líneas del pentagrama (cian, violeta, rosa, naranja, oro) que ondulan detrás de la portada;
- el cargador «Afinando…», donde las líneas se juntan en un solo latido;
- las chispas de colores al tocar los botones principales.

JavaScript solo dibuja en un `<canvas>` lo que el módulo deja en memoria. No tiene dependencias ni pide memoria nueva en cada cuadro, así el recolector de basura del navegador nunca corta la animación. Pesa unos 23 KB.

## Compilar

```bash
rustup target add wasm32-unknown-unknown   # una sola vez
cd rust/pentagrama
cargo test                                 # 4 pruebas
cargo build --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/pentagrama.wasm ../../media/wasm/
```

`build.mjs` copia `media/` al sitio, así que el `.wasm` queda en `/media/wasm/pentagrama.wasm`.

## Cómo se usa en la página

- `next/componentes/partitura/motor.js` carga el `.wasm`. Si el navegador no puede (sin WebAssembly, red caída), usa la misma matemática en JavaScript: se ve igual.
- `Pentagrama.jsx` dibuja las líneas (`modo="lineas"` o `modo="afinando"`). `Chispas.jsx` lanza chispas en todo lo que tenga `data-chispas`.
- Se pausa fuera de pantalla y queda quieto si la persona pidió menos movimiento en su sistema.
- La CSP permite `'wasm-unsafe-eval'` (solo WebAssembly, no `eval` de JavaScript).

Si cambias `src/lib.rs`, cambia también `motorJS()` en `motor.js` para que el respaldo siga igual.
