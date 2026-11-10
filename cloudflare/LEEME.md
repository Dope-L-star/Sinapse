# SymphorIA en Cloudflare Pages (gratis, sinapse.pages.dev)

La página completa vive en Cloudflare Pages. `/api/*` lo atiende `functions/api/[[path]].js` (en la raíz del repo), que lo reenvía a https://synthz-style.vercel.app: las funciones de `api/` siguen en Vercel sin cambios. Vercel ya solo muestra la página del video (`vercel-portal/`) con el link a la nueva.

## Conectar (una sola vez, en el panel de Cloudflare)
Workers & Pages → Create → Pages → Connect to Git → `Dope-L-star/Sinapse`:
- Project name: `sinapse` (da sinapse.pages.dev)
- Production branch: `main`
- Build command: `npm ci && node cloudflare/preparar.mjs`
- Build output directory: `cloudflare/public`
- Node version: variable `NODE_VERSION=22`.

El builder personalizado valida los árboles React, ensambla las piezas `src/`, corre `next build` con export estático y copia `next/out/` a `cloudflare/public/` para añadir `_headers` y `_redirects`. Por eso el output no es `out` directamente. `functions/` tiene que permanecer en la raíz del repositorio.
- Root directory: vacío (raíz del repo)
- Variable de entorno: `NODE_VERSION` = `22`

Desde ahí cada push a `main` se publica solo, y cada rama tiene su vista previa.

La primera build de `main` falla mientras `cloudflare/preparar.mjs` no esté en main; la vista previa de la rama del PR sí construye. Al fusionar, Pages publica la producción sola.

## A mano (opcional, con Wrangler)
```
npm ci
node cloudflare/preparar.mjs
npx wrangler pages deploy cloudflare/public --project-name sinapse --branch vista-previa
```
(desde la raíz, para que Wrangler encuentre `functions/`).

## Clave del puente
Para que los límites por IP sigan siendo por persona, el puente manda la IP real firmada con `CF_PROXY_KEY` (32+ caracteres al azar). La misma clave va en dos sitios, nunca en el repo:
- Cloudflare: Pages → sinapse → Settings → Variables and Secrets → `CF_PROXY_KEY` (tipo Secret).
- Vercel: variable de entorno `CF_PROXY_KEY` (Production) y volver a desplegar.

Sin la clave todo funciona, pero todas las visitas comparten el mismo límite.

## Login con Google
Supabase solo vuelve a direcciones permitidas: añade `https://sinapse.pages.dev/**` en Supabase → Authentication → URL Configuration → Redirect URLs (y cámbiala como Site URL).

## Cambio de dominio

Antes de integrar el cambio de URL, crea o verifica el proyecto Pages `sinapse` conectado a Sinapse. Conserva el proyecto anterior disponible mientras validas el nuevo dominio. Replica los bindings y las variables desde el panel sin publicar valores secretos en el repositorio. Agrega el dominio nuevo en Supabase como URL de retorno antes de probar el inicio de sesión. Comprueba la portada, el chat, el inicio de sesión, la descarga y la API en el nuevo dominio antes de redirigir el tráfico.
