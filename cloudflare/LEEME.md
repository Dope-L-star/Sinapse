# Sinapse en Cloudflare Pages

El sitio se construye con `npm ci && node cloudflare/preparar.mjs`. El directorio de salida es `cloudflare/public`. Las rutas y cabeceras se definen en `cloudflare/rutas.json`.

Pages Functions ejecuta los handlers de `api/`. Configura las variables de Redis y proveedores en el entorno de Pages. Verifica el registro y el inicio de sesión en una vista previa con el mismo límite de CPU que producción antes de publicar, porque la comprobación de contraseña usa scrypt.
