# SynthFlow: guía de inicio y Sona dentro de React

## Qué se arregló

La conversión a React había dejado el botón `#guideTop` sin su manejador vanilla: ese manejador ya no estaba conectado al árbol React y el botón no iniciaba la guía. Además, la bolita y el botón BETA se creaban con `document.createElement`, fuera del árbol React, por lo que podían duplicarse o quedar mal posicionados.

## Flujo nuevo

1. `ReactTree.jsx` convierte el botón `#guideTop` en el componente cliente `GuideButton.jsx`.
2. `GuideButton` llama a `window.SymphoriaOpenGuide`, que se asigna desde la función original `openGuide()` en `src/chat/11-primera-vez-synthflow-camino.js`. Por tanto, conserva el selector original de guía asistida o lectura (`SZ.guideAsk`); no salta directamente al tutorial completo.
3. Si el usuario hace clic antes de que `LegacyRuntime` haya terminado de cargar `core.js` y `chat.js`, el componente escribe `window.__symphoriaGuideQueued = true` y emite `symphoria:guide-request`. `LegacyRuntime` vuelve a intentarlo al terminar la carga y cuando llega `synthz-synthonia`.
4. `LegacyRuntime` carga `core.js` antes de `chat.js` y espera a `SZ.synReady` hasta cinco segundos. No añade una segunda etiqueta para `synthonia.js`: el cargador original conserva sus reintentos.
5. `SynthonIAHost.jsx` renderiza de verdad en React los nodos `#szBot` y `#betaBot`. El motor existente los reutiliza; no crea botones paralelos. React maneja los clics y el motor conserva expresiones, audio, arrastre, panel de conversación y puntero.
6. El BETA se coloca según el rectángulo real de la bolita, también en móvil. Permanece oculto hasta calcular una posición válida.
7. «Esconder» solicita al componente React que retire los botones después de limpiar las referencias y listeners de posicionamiento. El motor antiguo sigue siendo un adaptador de comportamiento, no propietario del nodo raíz.

## Verificación automática

Desde la raíz:

```bash
node build.mjs --check
node next/verificar-migracion.mjs
npm run test:guide --prefix next
npm run test:clarity --prefix next
node --check chat.js
node --check synthonia.js
```

`test:guide` comprueba el puente React, clics durante hidratación, selector original, orden de inicialización, propiedad React de la bolita/BETA, posición móvil, ocultamiento y que Clarity sigue apagado.

## Límites de la prueba en este entorno

No se ejecutó `next build` ni una prueba end-to-end en un navegador real. El entorno no logró instalar dependencias del registro npm y Chromium headless no pudo ejecutar siquiera una página de humo. Antes del despliegue, hay que ejecutar el build en un entorno con npm disponible y abrir una vista previa de Cloudflare para probar manualmente la guía asistida, «Lectura», el puntero, expresión/voz, movimiento de la bolita, BETA, ocultar/mostrar y viewport móvil.

## Privacidad

Microsoft Clarity no se activa ni cambia por esta corrección. Sus flags continúan desactivados; esta reparación no aprueba ni verifica la futura edición adulta.
