<!-- Hecho por: ESCRIBA -->

# A.L.I.A.S.

> **Solo para el equipo desde el 9 de noviembre de 2026 (v4.5).** Sammuel: «quita a todos el ALIAS excepto los admins».
> Servidor: `FEATS.alias = false` en `api/_permisos.js` (el equipo lo tiene; a una persona se le puede prender en Pulsem › Usuarios), y `api/alias.js` responde 403 en todas las acciones.
> Pantalla: `perks.f.alias` de `/api/ai` se recuerda en `localStorage` `synthz:alias`; sin eso no hay modo Agente, ni enlaces, ni tarjeta en la portada.
> `alias.html` monta `PuertaAlias.jsx`: pregunta al servidor y, si no tiene permiso, explica que está en pruebas y lleva a SynthFlow con lo escrito. Prueba: `node t/alias/solo-equipo.mjs`.

Sistema de lógica e inteligencia aumentada. En la interfaz el nombre se queda **A.L.I.A.S.** Agente aparte dentro de SynthFlow (Colombia). No es el chat, no es SuperiorSynth y no es SynthonIA.

## English summary

A.L.I.A.S. takes one goal, splits it into 3–7 visible steps, and runs them one at a time with tools: search (with sources), file (text, code, or PPTX), memory, image, and think. You can pause, approve, or redo a step. Copy lives in `alias-textos.json` (repo root) (`es` and `en`, same keys). The client calls `t('clave')`. Free plan, plain language: it is not a full browser and it does not publish apps. Another language later is a new object with the same keys, not a code change.

## Visión

La persona escribe un objetivo. A.L.I.A.S. muestra el plan y lo cumple de a un paso. El resultado se puede leer, copiar o descargar: un resumen con enlaces, un texto, un código, una presentación corta o una imagen de apoyo.

El plan de hoy es el gratis (Chispa). No cobra. No dice «ilimitado» ni «la mejor IA».

## Principios

1. **Transparente.** El plan y el paso actual siempre se ven. No hay un «trabajando…» sin decir qué hace.
2. **La persona manda.** Puede pausar, aprobar el paso o rehacerlo.
3. **Resultados reales.** Si busca, deja título y URL. Si no hay fuentes, lo dice y no inventa enlaces.
4. **Dos idiomas.** Español por defecto e inglés desde el día 1. Mismas claves.
5. **Honesto.** No promete un navegador completo ni publicar apps.

## Textos

- Diccionario único: `alias-textos.json` (en la raíz, porque `.vercelignore` no sube `/src` y el servidor y la página lo necesitan), forma `{ es:{…}, en:{…} }`. No se duplica en este archivo. Las claves del servidor llevan el prefijo `srv.*`.
- `t('clave')` lee el idioma activo y, si falta la clave, cae a `es`.
- Huecos que rellena el código, no el JSON: `{n}`, `{total}`, `{name}`.
- Cupo visible: `aviso.cupo` → «Gratis: {n} misiones al día». Agotado: `aviso.agotado`.
- Alcance visible: `aviso.alcance`.
- Los JSON son JSON válido (sin comentarios). La autoría va en la clave `_meta`, que no es un idioma.
- Un idioma nuevo = otro objeto junto a `es` y `en`, con las mismas claves.

## Contrato

`POST /api/alias`. JSON. Siempre `lang`: `"es"` o `"en"`. Los textos de la respuesta van en ese idioma. La sesión es la de `api/chat.js`: `Authorization: Bearer`, `auth(req)` en `api/_lib.js`, usuario `me.sub`.

**1. Plan**

`{ "action":"plan", "lang":"es", "goal":"texto" }`

`{ "ok":true, "plan":{ "id":"…", "goal":"…", "steps":[ { "id":1, "title":"…", "tool":"search", "input":"…" } ] } }`

De 3 a 7 pasos. `tool`: `search` | `file` | `memory` | `image` | `think`.

**2. Paso**

`{ "action":"step", "lang":"es", "plan":{ }, "stepId":1, "prev":[ ] }`

`{ "ok":true, "step":{ "id":1, "status":"done", "output":"…", "sources":[ { "title":"…", "url":"…" } ], "file":null, "error":null } }`

`status`: `done` | `error`. `file`: `{ "name", "mime", "text" }` o `null`. `sources` puede ir vacío.

**Errores:** `{ "ok":false, "error":"mensaje en el idioma de lang" }`.

**Límite diario:** `{ "ok":false, "error":"límite", "limit":true }`. La palabra `límite` no se traduce (`srv.limite` es igual en `es` y en `en`). La frase amable la pone el cliente con `aviso.agotado`.

**Cliente**

```js
window.ALIAS = {
  plan(goal) {},
  runStep(plan, id, prev) {},
  tools: { search() {}, file() {}, memory() {}, image() {} }
};
```

`think` no está en `tools`: lo resuelve el servidor dentro del paso.

## Límites del plan gratis (los pone `api/alias.js`)

- Por persona y día: 8 misiones (planes), 50 pasos y 15 búsquedas. El equipo (Prime, ZFlow, Symmetrix) tiene el doble.
- Para todos juntos: 2000 pasos al día. Se pueden cambiar con `SYNTHZ_ALIAS_PLANS`, `SYNTHZ_ALIAS_STEPS`, `SYNTHZ_ALIAS_SEARCHES` y `SYNTHZ_ALIAS_GLOBAL`.
- Objetivo: máximo 500 caracteres. Plan: 3 a 7 pasos.
- `memory` e `image` no gastan cupo en el servidor (los hace el cliente). Un paso que falla no gasta cupo.
- `aviso.cupo` debe mostrar `n = 8` (misiones al día).

## Fases

1. **Plan visible.** Objetivo → 3 a 7 pasos. Aún no corre herramientas. Se puede descartar y pedir otro.
2. **Paso a paso.** `search` y `think`, con fuentes. Pausar, aprobar, rehacer. Cupo diario del plan gratis.
3. **Archivos y memoria.** Texto, código y PPTX (`file`). Memoria solo de lo ya guardado en la cuenta (`memory`).
4. **Imágenes.** `image`, una imagen de apoyo por misión cuando exista. Sigue sin navegador completo y sin publicar apps.

`api/alias.js` ya existe (rama `alias-fase1`) y cubre `plan` y `step` de las fases 1 a 3 en el servidor. Falta la ventana (`alias.html`) y las herramientas del cliente (`window.ALIAS`).

## Cómo se prueba (sin claves)

1. `alias-textos.json` parsea y `es` y `en` tienen las mismas claves, ninguna vacía.
2. Cuando exista la API, con la misma sesión del chat: `plan` devuelve 3–7 pasos en el `lang` pedido; `step` devuelve `output` en ese idioma; si buscó, `sources` trae título y URL. Sin sesión: `ok:false` y `srv.sesion`. Pasado el cupo: `limit:true` y `error` igual a `límite`.
3. En la página, los rótulos salen de `t('clave')`. Existen `window.ALIAS.plan` y `runStep`.

## Qué no hace aún

- No abre un navegador completo ni entra a cuentas, bancos o páginas con login.
- No publica apps ni las sube a una tienda.
- No es SuperiorSynth ni SynthonIA. No sustituye el chat.
- No cobra y no enciende los planes de pago (Syntonia, Timeless, Orquesta).
- No guarda el archivo en el servidor para siempre: se copia o se descarga.
- No asegura que cada enlace siga vivo.

## Archivos de esta entrega

| Archivo | Qué es |
| --- | --- |
| `alias-textos.json` | Interfaz, estados, errores y frases del servidor |
| `api/alias.js` | Servidor: `plan` y `step` |
| `ALIAS.md` | Visión, principios, contrato y fases |
