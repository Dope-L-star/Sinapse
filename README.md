# SymphorIA / SynthFlow · React + Cloudflare Pages

Este proyecto conserva la app y sus funciones y suma una migración de las rutas públicas a Next.js/React con salida estática para Cloudflare Pages. Lee `next/LEEME.md` y `MIGRACION-REACT-CLOUDFLARE.md` antes de desplegar.

## Rutas React

- `/` y `/index.html`: portada.
- `/chat.html`: SynthFlow.
- Quoryn (antes A.L.I.A.S.): ya no tiene página; es el modo Agente dentro de SynthFlow (`/alias` y `/alias.html` llevan a `/chat`).
- `/ayuda.html`: Ayuda.
- `/offline.html`: página sin conexión.
- `/pulsem.html`: panel privado Pulsem.
- `/privacidad.html` y `/terminos.html`: páginas legales hechas con componentes React propios.

La estructura visual de las páginas principales se crea desde elementos React (no desde una cadena HTML inyectada). Los árboles de componentes se encuentran en `next/contenido/arboles-react/`; las piezas fuente permanecen en `src/`. Los motores de interacción JS se conservan temporalmente como una capa de compatibilidad para no romper login, historial, streaming, IA, adjuntos y herramientas mientras la lógica se migra a hooks por subsistema. Esta capa de lógica aún no está reescrita íntegramente en React.

`/sintetico.html` se mantiene aislado con sus propias cabeceras CSP y su protocolo de `postMessage`; no debe fusionarse con el runtime de la app. Las rutas `/api/*` siguen en el backend existente.

## Comprobaciones rápidas

```bash
npm ci
npm run check
```

Si cambias una página HTML fuente, regenera los árboles React antes de ejecutar los checks:

```bash
python next/generar-arboles-react.py  # requiere beautifulsoup4, solo desarrollo
npm run check
```

## Build para Cloudflare Pages

```bash
npm ci
node cloudflare/preparar.mjs
```

Configuración de Pages: root directory vacío, Build command `npm ci && node cloudflare/preparar.mjs`, Build output directory `cloudflare/public`, variable `NODE_VERSION=22`. Las Pages Functions continúan en `functions/` en la raíz del repositorio.

El build integrado y las pruebas con navegador tienen que ejecutarse en un entorno con acceso a npm y a los servicios reales antes de publicar; en el entorno de creación de este ZIP, npm devolvió `EAI_AGAIN` al resolver `registry.npmjs.org`, por lo que no se afirma que `next build` haya pasado.


## Migración React y Cloudflare Pages

La versión en `next/` usa Next.js App Router con export estático para Cloudflare Pages. Antes de desplegar, ejecutar `node build.mjs --check`, `node next/verificar-migracion.mjs` y `node cloudflare/preparar.mjs` con acceso a npm. Configuración de Pages: build `npm ci && node cloudflare/preparar.mjs`, directorio `cloudflare/public`, Node.js 22. La lógica interactiva del chat y autenticación continúa en módulos JavaScript heredados bajo el adaptador React; revisar `MIGRACION-REACT-CLOUDFLARE.md`.


### Microsoft Clarity (variante futura solo adultos)

Clarity permanece apagado en el build actual. La integración requiere consentimiento explícito y los cinco flags de release para una futura edición realmente dirigida a mayores de 18 años. Lee `next/CLARITY-ADULT-RELEASE.md` antes de configurarla. Las flags no son verificación de edad; no se activa Clarity mientras los términos, la política y la elegibilidad de la audiencia no se hayan cambiado y probado.


### Corrección importante de SynthFlow

El runtime React repone `data-brand="flow"` en `document.documentElement` antes de cargar los scripts del chat. Esto conserva la detección de SynthFlow usada por SynthonIA y por el botón BETA, y limpia la marca al abandonar la ruta. Hay una comprobación de regresión en `next/verificar-migracion.mjs`. Microsoft Clarity permanece desactivado; esta corrección no cambia su configuración.


### Guía rápida y SynthonIA en React

`#guideTop` ya es el componente cliente `GuideButton`. La bolita `#szBot` y el botón BETA también se renderizan como nodos React; el motor existente conserva las expresiones, el audio, la manita y el panel mediante un adaptador para no romper la experiencia. Los clics tempranos en la guía quedan en cola hasta que los módulos estén listos. Consulta `next/GUIA-REACT-SYNTHONIA.md`. Ejecuta `npm run test:guide --prefix next` para las diez pruebas de regresión. Clarity sigue desactivado.


### Reparación Guide/SynthonIA React

- `next/GUIA-REACT-SYNTHONIA.md` documenta el botón Guía rápida, el selector original y los controles React de SynthonIA/BETA.
- Validación: `node next/verificar-migracion.mjs`, `npm run test:guide --prefix next` (11 pruebas), `npm run test:clarity --prefix next` (10 pruebas).
- Clarity sigue desactivado; el build de Next y el E2E real requieren ejecutarse en un entorno con las dependencias instaladas y navegador disponible.


### Analítica compatible con la audiencia actual (opcional)

La alternativa preparada es **Cloudflare Web Analytics manual**, limitada a visitas y rendimiento de páginas/Core Web Vitals. No hay replay de sesiones, mapas de calor, eventos personalizados ni IDs de usuario; el código de SymphorIA no envía prompts, mensajes, títulos de chat ni datos de cuenta. El beacon no se carga hasta que la persona acepta; rechazo y revocación se respetan. Por defecto está desactivado y Microsoft Clarity sigue desactivado.

Guía de configuración y privacidad: `next/CLOUDFLARE-WEB-ANALYTICS-PRIVACIDAD.md`. Pruebas: `npm run test:privacy-analytics`.

**No actives la inserción automática de Web Analytics en Cloudflare Pages**: puede inyectar el beacon al margen del consentimiento de la app. Usa el token del snippet manual y las variables `NEXT_PUBLIC_CF_WEB_ANALYTICS_ENABLED=true`, `NEXT_PUBLIC_CF_WEB_ANALYTICS_PRIVACY_REVIEWED=true` y `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN=<token>`. Antes de habilitar, revisa la política de privacidad y despliega una vista previa. Las tres variables deben configurarse en el entorno de build; habilitar solo el dashboard de Cloudflare no respeta este flujo de consentimiento.

### Sobre el ZIP de fuente

El paquete fuente omite `cloudflare/public` porque es un artefacto generado y no se reconstruyó en este entorno. El build configurado lo recrea con `node cloudflare/preparar.mjs`; no publiques un directorio `cloudflare/public` antiguo por carga manual. Antes de producción, ejecuta ese build con las dependencias instaladas y completa la lista manual de `evidencia/QA-ANALITICA-PRIVACIDAD.md`.
