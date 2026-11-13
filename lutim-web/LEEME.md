# lutim-web · primera vista previa web de LUTIM

Recorrido con datos ficticios, en Rust compilado a WebAssembly: **enviar un mensaje a Timo, retomar una conversación y abrir su creación**. Referencia visual: «Horizonte de noche».

**La interpretación es simulada.** Los mensajes los lee el intérprete por reglas de `ensayos/timo-p0`, no un modelo de IA. La página lo dice en una franja fija y en cada respuesta de Timo. No hay red, cuentas, servicios ni credenciales; lo único que se guarda es la conversación de muestra en el `localStorage` del navegador, para poder retomarla.

## Comandos (desde `lutim-web`)

```bash
cargo test --offline
```

```bash
node construir.mjs
```

```bash
node probar-wasm.mjs
```

```bash
node servir.mjs
```

- `construir.mjs` compila el Wasm y arma **`public/`**, la carpeta que se sube a Pages (`index.html`, `app.css`, `arranque.js`, `lutim_web.wasm`, `_headers`).
- `probar-wasm.mjs` recorre el Wasm ya compilado. `servir.mjs` lo abre en `http://127.0.0.1:4328`.

## Cómo está hecho

- `src/lib.rs`: estado, eventos y todo el HTML, en Rust. Sin dependencias externas ni `wasm-bindgen`.
- `web/arranque.js`: puente mínimo. Carga el Wasm, reenvía clics y envíos, pinta el HTML y guarda el estado.
- `web/_headers`: sin indexación y una política de contenido que solo permite archivos propios y Wasm.

## Límites conocidos

- **Dependencia incluida.** `Cargo.toml` usa `timo-p0/` dentro del repositorio. El comando de compilación genera `public/` con los archivos para Pages.
- El intérprete simulado entiende pocas frases; las sugeridas bajo el chat son las que sabe leer.
- La creación es una lámina de muestra: no se genera contenido.
- La interfaz incluye el símbolo oficial, una barra lateral con recientes y fijados, y una ruta propia para «Tu panel» (`/#/panel`).
- Solo en español. Sin probar: lector de pantalla, celular físico, Safari y Firefox.
