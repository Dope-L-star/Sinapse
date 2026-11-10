# SymphorIA en Next.js / React + Cloudflare Pages

## Rutas y renderizado

Estas rutas salen de `app/` como páginas React (Next App Router):

| URL de producción | Componente de página |
|---|---|
| `/` y `/index.html` | `app/(site)/page.jsx` |
| `/chat.html` (SynthFlow) | `app/(site)/chat/page.jsx` |
| ~~`/alias.html`~~ (A.L.I.A.S.) | **Borrada en v4.6**: Quoryn vive dentro de SynthFlow; `/alias` y `/alias.html` redirigen a `/chat` |
| `/ayuda.html` | `app/(site)/ayuda/page.jsx` |
| `/offline.html` | `app/(site)/offline/page.jsx` |
| `/pulsem.html` | `app/(panel)/pulsem/page.jsx` → **React de verdad** (`componentes/pulsem/*`, v3.8) |
| `/privacidad.html` y `/terminos.html` | componentes React propios |

Las páginas principales tienen su estructura renderizada como elementos de React mediante `ReactTree.jsx`; ya no dependen de `dangerouslySetInnerHTML` para inyectar todo el cuerpo de la página. Los árboles JSON versionados están en `contenido/arboles-react/` y conservan los IDs/clases/data-attributes que consumen los módulos existentes. Se generaron desde las páginas fuente con `python next/generar-arboles-react.py` (requiere `beautifulsoup4`, solo para desarrollo).

`LegacyRuntime` sigue cargando en orden los motores JS actuales —`core.js`, `chat.js`, `index.js`, `pulsem.js` y módulos auxiliares— para preservar autenticación, streaming, historial, Puter/OpenRouter, adjuntos, comparación y herramientas. Eso es un puente de compatibilidad, no una reescritura terminada de cada módulo a hooks. La migración de estado y efectos internos a React hooks debe hacerse módulo por módulo y no eliminarse este puente hasta que sus flujos pasen pruebas de navegador.

`/sintetico.html` queda deliberadamente como documento aislado con una CSP `sandbox` y un protocolo `postMessage` específico. No se debe colocar en el mismo árbol React que ejecuta la app: la separación evita que el HTML generado por una IA comparta el entorno privilegiado de SynthFlow.

## Pulsem ya es React (v3.8)

`componentes/pulsem/PulsemApp.jsx` reemplaza a `pulsem.js` en la versión publicada: hace la puerta (iniciar sesión / solo el equipo, con su cabecera y botón ES/EN) y, si la cuenta es del equipo, monta el panel nuevo `componentes/admin/PanelAdmin.jsx` (`api={SZ.api}`, `toast={SZ.toast}`, `onAuth` vuelve a la puerta). Textos de la puerta en `componentes/pulsem/textos.js`; los del panel en `componentes/admin/textos.mjs`. `src/pulsem/` queda solo para el `pulsem.html` estático (pruebas de humo y Vercel).

## Quoryn (antes A.L.I.A.S.): historia de la página React (v3.8–v4.5) — borrada en v4.6

> Desde v4.6 Quoryn no tiene página: vive en el chat (`src/chat/16w-alias-en-chat.js`) y `componentes/alias/`, `alias.js` y `alias-tools.js` ya no existen. Lo de abajo se deja como historia; el enrutador `api/_ruta.js` y los datos siguen vigentes.

`componentes/alias/` reemplaza a `alias.js` en la versión publicada: `AliasApp.jsx` (idioma, tema, inicio, plan, controles y el recorrido paso a paso), `Pasos.jsx`, `Resultado.jsx` (texto, Síntesis, descargas .pptx/archivos, fuentes) e `iconos.jsx`. El motor sigue igual: `alias-tools.js` (`window.ALIAS`). Textos en `alias-textos.json`. Se conservan IDs y `data-alias`; la suite de siempre corre contra la versión React con `ALIAS_UI_ROOT=next/out node t/alias/ui.mjs` (después de `node next/armar.mjs`).

**v3.9 · enrutador estilo RouteLLM (`api/_ruta.js`):** cada pedido de A.L.I.A.S. se clasifica (código, escritura, razonamiento, resúmenes, traducción, datos, plan) y va a la IA gratis que mejor lo resuelve entre las que funcionan ahora, con respaldos de otros proveedores (si la primera tarda más de 20 s, responde otra). Cada intento y cada 👍/👎 se guardan por tipo y modelo (`rt:<tipo>`, `rt:log`) y corrigen la siguiente elección. El paso trae `route` (qué IA y por qué); Agentes muestra lo aprendido (`action:'rutas'`). Pruebas: `node t/alias/ruta.mjs`.

**v3.9 · diseño de Sammuel («Mission workspace», `ALIAS_VISUAL_CONCEPT`):** barra lateral (Nueva misión · Misión actual · Mis misiones · Agentes), inicio con orbe, rutas rápidas, misiones recientes y equipo de agentes; la misión muestra la ruta de pasos y la «orquesta» (qué herramienta trabaja ahora). Solo tema oscuro (pedido de Sammuel). Estilos en `alias-mision.css` (todo bajo `.am`, encima de `alias.css`; la página estática `alias.html` no cambia). Del prototipo no se copió lo inventado: las misiones recientes son reales (solo en este navegador, `localStorage` `alias:misiones`) y los agentes son las herramientas del motor (search, memory, think, image, file).

## Pruebas de estructura

```bash
node build.mjs --check
node next/verificar-migracion.mjs
node --test next/tests/clarity-consent.test.mjs
```

Si modificas alguno de los documentos fuente (`index.html`, `chat.html`, etc.), regenera los árboles JSON antes de compilar:

```bash
python next/generar-arboles-react.py
node next/verificar-migracion.mjs
```

La comprobación detecta árboles desactualizados, IDs perdidos o duplicados, cambios en los cuerpos fuente y scripts/event handlers inline que no deberían ejecutarse.

## Build de producción en local

Desde la raíz del repositorio:

```bash
npm ci
node build.mjs --check
node next/verificar-migracion.mjs
node cloudflare/preparar.mjs
```

El último comando ejecuta la exportación Next y genera `cloudflare/public/` con `_headers`, `_redirects` y recursos estáticos. Requiere conexión al registro npm para instalar dependencias de Next/React.

## Cloudflare Pages

- **Root directory:** vacío (raíz del repositorio).
- **Build command:** `npm ci && node cloudflare/preparar.mjs`.
- **Build output directory:** `cloudflare/public`.
- **Environment variable:** `NODE_VERSION=22`.

No usar `out` como directorio de salida para este pipeline personalizado: `cloudflare/preparar.mjs` copia `next/out` y genera las reglas de Pages que necesita este proyecto. Las Pages Functions se conservan en el directorio raíz `functions/`.

## Pruebas funcionales pendientes

En una vista previa con los servicios configurados: envío y streaming, detener/reintentar, cambio de IA y modo, login/cierre/Google, historial/favoritos, adjuntos, comparación, búsqueda web, Sintéticos, A.L.I.A.S., idioma inglés, modo compacto, Pulsem y accesibilidad móvil. No publicar sobre la versión estable hasta completarlas.


## Microsoft Clarity: variante futura 18+

La integración de React está preparada, pero permanece apagada. Microsoft indica que Clarity no debe usarse en sitios o aplicaciones dirigidos a menores de 18 años: https://learn.microsoft.com/en-us/clarity/faq . Los términos actuales de SymphorIA permiten usuarios menores de 18 con permiso adulto; por tanto **no se debe activar Clarity en la versión actual**.

Para la futura variante adulta, consulta `next/CLARITY-ADULT-RELEASE.md`. El build exige cinco condiciones: `NEXT_PUBLIC_CLARITY_ENABLED=true`, `NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS=true`, `NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE=true`, `NEXT_PUBLIC_SYMPHORIA_AGE_CONTROL_VERIFIED=true` y `NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED=true`. Si se solicita Clarity sin todas ellas, el script de build falla de forma explícita. Estas variables son controles de release, no verifican la edad de una persona ni reemplazan controles efectivos de acceso y términos legales.

El proyecto configurado es `z5es3kuqoz`; antes de producción confirma en Clarity que pertenece exclusivamente al dominio adulto. Si se compartió con otro sitio/audiencia, crea un proyecto separado. El panel privado Pulsem no monta el tracker. Consent V2 se encola antes de insertar el script; Clarity no se carga hasta que la persona acepta la analítica y puede retirar el consentimiento desde «Privacidad».

El árbol React en `contenido/arboles-react/` conserva el marcado y los IDs originales, mientras `LegacyRuntime` carga los módulos interactivos antiguos. Esto protege funcionalidad durante la migración, pero no significa que todo el comportamiento ya esté reescrito con hooks de React.


## Guía y SynthonIA en React

Consulta `GUIA-REACT-SYNTHONIA.md`. La guía rápida se conecta a `openGuide` y mantiene `SZ.guideAsk`; SynthonIA y BETA son botones renderizados por React y el motor existente se limita a aportar su comportamiento. Ejecuta `npm run test:guide --prefix next` además de los controles de migración y Clarity. Las pruebas visuales end-to-end y `next build` todavía deben ejecutarse en una vista previa real.

### Analítica de privacidad mínima

```bash
node --test next/tests/cloudflare-analytics.test.mjs
```

Ver `next/CLOUDFLARE-WEB-ANALYTICS-PRIVACIDAD.md` para preparar Cloudflare Web Analytics con consentimiento explícito. Microsoft Clarity permanece desactivado.
