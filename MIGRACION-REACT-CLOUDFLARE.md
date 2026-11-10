# Migración React + Cloudflare: antes/después y QA

## Antes

- Cada ruta interactiva (`index.html`, `chat.html`, `alias.html` (borrada en v4.6: Quoryn vive en el chat), `ayuda.html`, `offline.html`, `pulsem.html`) se servía como documento HTML independiente.
- El chat usa una arquitectura madura de módulos y selectores DOM, con IDs `data-*` compartidos entre `src/chat/` y el marcado.
- El estilo Glass y las animaciones ya eran parte del diseño; la migración debe conservar el aspecto de SynthFlow y no sustituirlo por una plantilla genérica.

## Después de esta etapa

- Las rutas salen del App Router de Next.js y React.
- El marcado de las seis páginas principales se transformó en árboles de elementos React estáticos, en `next/contenido/arboles-react/`, y `ReactTree.jsx` crea los elementos. Se conservaron IDs, clases, atributos de datos y jerarquía visible necesaria para los estilos y manejadores existentes.
- Los atributos inline de evento se retiran del árbol y las dos acciones que estaban presentes (`onclick="location.reload()"` y `onerror="this.remove()"`) se traducen a `data-legacy-*` con listeners delegados controlados. No se evalúa código arbitrario guardado en atributos HTML.
- Las páginas legales continúan como componentes React propios. `/sintetico.html` permanece aislado a propósito por su CSP y sandbox.
- `LegacyRuntime` mantiene por ahora la lógica heredada del chat, cuentas, proveedores IA, streaming, historial, herramientas, alias y Pulsem. Esto conserva compatibilidad, pero significa que la migración completa de toda la lógica JS a hooks/context todavía no está terminada. Debe hacerse progresivamente y cubrirse con pruebas de extremo a extremo.

## Pruebas de migración

Ejecutar desde la raíz:

```bash
node build.mjs --check
node next/verificar-migracion.mjs
```

Se comprueba que cada página fuente coincide con el módulo de referencia, que el hash del árbol React está actualizado, que no se perdieron ni duplicaron IDs, que no quedaron scripts/event handlers inline y que se conserva el documento aislado de Sintéticos. Si se edita una página HTML, regenerar con `python next/generar-arboles-react.py` (solo hace falta `beautifulsoup4` en desarrollo) y repetir los tests.

## Build Cloudflare Pages

- Root directory: vacío, raíz del repositorio.
- Build command: `npm ci && node cloudflare/preparar.mjs`.
- Build output directory: `cloudflare/public`.
- `NODE_VERSION=22`.

`cloudflare/preparar.mjs` ejecuta la exportación estática de Next, copia `next/out` a `cloudflare/public` y genera las reglas `_headers` y `_redirects`. Las funciones Pages se mantienen en `functions/` en la raíz.

## Resultados en este entorno

- `node build.mjs --check`: debe mostrar todos los bundles JS/CSS sincronizados con sus piezas fuente.
- `node next/verificar-migracion.mjs`: debe pasar la paridad de árbol React, IDs y acciones seguras.
- La captura comparativa «antes/después» se adjunta como referencia visual de la capa de Glass/estilo y la prueba estática revisa layout desktop/mobile, controles críticos y overflow horizontal.
- El build integrado `next build`/Cloudflare no se pudo ejecutar aquí: el registro npm respondió `EAI_AGAIN` para `registry.npmjs.org`. No se marca como éxito; Cloudflare CI debe instalar las dependencias y construir en un runner con red.
- La prueba visual offline de `chat.html` no sustituye una prueba E2E de streaming/autenticación en servicios reales. Esa lista sigue pendiente en Preview.

## Checklist antes de producción

- [ ] `npm ci && node cloudflare/preparar.mjs` finaliza con código 0.
- [ ] Las rutas `/`, `/chat.html`, `/ayuda.html`, `/offline.html`, `/pulsem.html`, `/privacidad.html` y `/terminos.html` devuelven 200.
- [ ] SynthFlow: enviar, recibir streaming, parar/reintentar y cambiar de modelo.
- [ ] Login, cierre de sesión, Google, cuenta y persistencia de chats.
- [ ] Historial, favoritos, adjuntos, comparación, búsqueda web, Sintéticos y A.L.I.A.S.
- [ ] Selector IA, esfuerzo, menú de modo, ajustes, idioma, modo compacto, Pulsem y vista móvil.
- [ ] Sin errores de consola ni solicitudes locales 404; verificar CSP de `/sintetico.html`.
- [ ] No reemplazar el despliegue estable antes de completar la lista.

## Analítica y privacidad (Microsoft Clarity)

La integración futura usa Consent V2, no inserta el script hasta que la persona acepta, conserva el rechazo, permite revocar y limita el consentimiento aceptado a 180 días. `ad_Storage` permanece denegado. La integración está **apagada por defecto** y el build falla si se intenta activarla sin cinco flags válidos. Microsoft indica que Clarity no debe usarse en sitios/aplicaciones dirigidos a menores de 18 años: https://learn.microsoft.com/en-us/clarity/faq . Como los términos actuales de SymphorIA permiten menores con permiso adulto, no actives Clarity en la versión actual.

La guía de publicación para la futura edición adulta está en `next/CLARITY-ADULT-RELEASE.md`. Incluye configuración de Cloudflare, Consent Mode, masking, política, pruebas y verificación de CSP. Las flags son controles de release y no sustituyen la implementación real de una audiencia exclusiva para adultos.

Se marcan `#msgs`, `#thList`, `#sideFoot`, `#accBtn`, `#launch`, `#usagePanel`, `#vPlan` y `#vResult` con `data-clarity-mask` porque contienen mensajes, títulos de chats o resultados personales. Las cajas de texto también se enmascaran por defecto en Clarity. La prueba `node next/verificar-migracion.mjs` verifica que no se pierdan estas marcas.

## Qué está realmente migrado a React

Las ocho rutas de interfaz están en App Router: las seis páginas principales se renderizan con elementos creados por React y árboles verificados, y Privacidad/Términos son componentes JSX. **La lógica interactiva completa aún no ha pasado a hooks/context**: chat, autenticación, proveedores, streaming, historial, A.L.I.A.S. y Pulsem siguen usando módulos JavaScript antiguos cargados mediante `LegacyRuntime` para conservar compatibilidad. No se debe describir este estado como una reescritura React 100% terminada. La conversión de esos módulos debe hacerse por subsistema y con pruebas E2E reales.


## Corrección de regresión: marca SynthFlow y SynthonIA

La conversión del `body` a un árbol React no puede trasladar directamente el atributo del elemento raíz original, `html[data-brand="flow"]`. `core.js` usa `document.documentElement.dataset.brand` para identificar SynthFlow. Si falta, SynthonIA se trata como la bolita global de SymphorIA y el botón BETA no se adjunta a ella.

`next/componentes/LegacyRuntime.jsx` asigna `data-brand="flow"` sincrónicamente al iniciar la ruta de chat **antes** de cargar `core.js`, `chat.js` y `movimiento.js`; al salir de la ruta lo limpia de forma conservadora. `next/verificar-migracion.mjs` contiene una prueba de regresión que garantiza el orden. La integración de Clarity sigue desactivada por defecto y no se activa como parte de este arreglo.
