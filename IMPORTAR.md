# Importar chats y memoria (SynthFlow)

**Estado: ENCENDIDO para todos desde el 9 de noviembre de 2026 (v4.5, pedido de Sammuel).** `chat.html?importar=0` lo esconde solo en ese navegador; `?importar=1` lo vuelve a mostrar.
Para apagarlo para todos otra vez: hacer que `IMP_ON` en `src/chat/16i-importar.js` devuelva `false` y correr `node build.mjs`.

## Qué lee
| De dónde | Qué subir | Qué trae |
|---|---|---|
| ChatGPT | el `.zip` de Ajustes › Controles de datos › Exportar datos (o su `conversations.json`) | chats (solo la rama que estaba abierta, sin herramientas ni mensajes ocultos) |
| Claude | el `.zip` de Ajustes › Privacidad › Exportar datos (o `conversations.json` / `memories.json`) | chats y memoria |
| Otra IA | `.json` con mensajes (`[{role, content}]`, `{messages}`, `[{title, messages}]`) o la copia de SynthFlow | chats |
| Texto | `.md`/`.txt` con «Usuario:», «Asistente:», «## Tú»… | un chat |
| Texto sin marcas | una lista (o lo pegado en el cuadro) | cosas para recordar |

La memoria de ChatGPT no viene en su `.zip`: la ventana le dice a la persona que le pida a ChatGPT «Haz una lista de todo lo que recuerdas de mí» y lo pegue.

## Cómo funciona
- Todo se lee en el navegador (`src/chat/05h-importar-leer.js`, el `.zip` con `DecompressionStream`, sin librerías).
- 3 pasos: elegir archivos o pegar → vista previa con casillas (chats con buscador, recuerdos) → listo con «Abrir el más reciente».
- Los chats quedan como chats normales de la IA elegida, con su título y fecha, y una etiqueta «ChatGPT»/«Claude» en la lista.
- Los recuerdos pasan por `memAddCore` (sin duplicar, máx. 40). Si no caben, el botón lo dice.
- Lo ya importado no se vuelve a traer (`state.impIds`). Máx. 200 chats por vez, 400 mensajes por chat.
- Entradas (solo encendido): menú «⋯» › Importar chats y memoria, y Ajustes › Tus IAs › Importar de otra IA.

## Pruebas
- `node t/importar/importar.mjs` — 23 pruebas del lector (ChatGPT, Claude, JSON, Markdown, .zip, límites).
- `node cloudflare/preparar.mjs && node t/importar/capturas.mjs <carpeta> [antes|despues]` — capturas y prueba de punta a punta.
