# Cloudflare Web Analytics manual con consentimiento — SymphorIA

Estado por defecto: **desactivado**. Microsoft Clarity continúa desactivado y conserva sus propias puertas de activación para una futura edición adulta. La analítica técnica descrita aquí está pensada para la audiencia actual y no utiliza replay ni perfiles personales.

## Qué mide y qué no

La integración usa el beacon manual oficial de Cloudflare Web Analytics: `https://static.cloudflareinsights.com/beacon.min.js`. Solo proporciona métricas agregadas de páginas y rendimiento (tiempos de carga/Core Web Vitals). No se envían eventos personalizados ni contenido de aplicación; no se usan grabaciones, mapas de calor, IDs de usuario, identificadores de cuenta ni contenido de chats. El código de SymphorIA no añade prompts, mensajes, títulos, nombres, correos, adjuntos ni resultados de SynthonIA al beacon.

La documentación de Cloudflare dice que Web Analytics no recoge ni usa datos personales; su documentación técnica explica que el beacon de RUM mide datos de rendimiento, no escribe cookies o almacenamiento en el navegador, y descarta la IP en el punto de presencia en lugar de guardarla en sus bases de datos/logs principales. Cloudflare advierte que el procesamiento puede ocurrir en una región distinta de la de origen. La política de privacidad debe reflejar eso, y cualquier determinación jurídica final debe revisarse según el público y las jurisdicciones reales.

Fuentes oficiales:
- <https://developers.cloudflare.com/web-analytics/about/>
- <https://developers.cloudflare.com/web-analytics/get-started/>
- <https://developers.cloudflare.com/speed/observatory/rum-beacon/>
- <https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/>
- <https://developers.cloudflare.com/web-analytics/faq/>

## Consentimiento y controles implementados

- No se inserta ningún beacon hasta que la persona elige **Permitir métricas**.
- **No, gracias** guarda una preferencia de rechazo y no carga el beacon.
- La decisión se guarda en `localStorage` como un registro mínimo: versión, decisión y fecha; caduca a los 180 días. No contiene un ID de usuario ni se envía al servidor.
- El botón «Analítica» permite volver a abrir las preferencias. Al retirar un permiso activo, se guarda el rechazo, se retira el elemento `<script>` y se recarga la página para destruir listeners que el beacon pudiera haber instalado en memoria.
- Solo se miden rutas públicas de una lista exacta (`/`, `index.html`, chat, ayuda, offline, privacidad y términos). Las rutas desconocidas, privadas, Pulsem, Sintético, API y auth se excluyen. También se omite la medición si la URL o el referrer tiene query/fragmento o credenciales.
- El beacon se configura con `spa: false`: no observa cambios de ruta cliente de manera automática. Las navegaciones de documento completo se cuentan; transiciones futuras de cliente podrían no contarse, decisión intencional para reducir la posibilidad de enviar parámetros sensibles.
- La carga es idempotente y los errores del beacon no interrumpen el chat.
- El consentimiento es opcional; las funciones del producto no dependen de aceptar.
- Clarity queda independiente y desactivado por defecto.

## Configurar Cloudflare Pages

1. En Cloudflare Dashboard, abre **Web Analytics** y crea/selecciona un sitio para el hostname publicado. Copia el token del **snippet manual** que entrega Cloudflare.
2. En el proyecto de Pages, deja desactivada la inserción automática de Web Analytics / el setup de un clic. Si el dashboard inyecta el beacon por su cuenta, podría enviar datos antes del consentimiento que gestiona SymphorIA. Usa el modo manual con este componente.
3. En **Settings → Environment variables**, configura en el entorno Preview primero:
   - `NEXT_PUBLIC_CF_WEB_ANALYTICS_ENABLED=true`
   - `NEXT_PUBLIC_CF_WEB_ANALYTICS_PRIVACY_REVIEWED=true`
   - `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN=<token del sitio>`
4. Revisa el texto publicado de `/privacidad.html`; la variable `PRIVACY_REVIEWED` es una declaración de release, no una revisión automatizada. No la marques como `true` hasta comprobar que el texto coincide con el sitio, el token y el uso real.
5. Mantén todas las variables `NEXT_PUBLIC_CLARITY_*` relevantes a `false` o sin definir. La nueva integración no habilita Clarity.
6. Despliega una Preview y completa las pruebas de abajo. Después copia las variables al entorno Production y vuelve a desplegar. No habilites producción solo por pasar los tests de Node.

El token del sitio es visible en el navegador por diseño; no es una API key de privilegios. No pongas secretos de servidor en variables `NEXT_PUBLIC_*`.

## Pruebas antes de publicar

Automáticas:

```bash
node --test next/tests/cloudflare-analytics.test.mjs
npm run check
```

Manuales en un navegador limpio de Preview:

1. Sin variables de configuración válidas, no aparece el banner y no se solicitan recursos de Cloudflare Analytics.
2. Con el token y la revisión configurados, la primera visita muestra la elección, pero **antes de elegir** la pestaña Network no debe mostrar `static.cloudflareinsights.com` ni `cloudflareinsights.com`.
3. Pulsa **No, gracias**, recarga y navega: el beacon no debe cargarse. En localStorage solo existe la preferencia de rechazo, no datos de navegación.
4. Borra la preferencia de prueba o usa otro perfil, pulsa **Permitir métricas** y verifica que se solicita `beacon.min.js` solo después de aceptar y que las métricas aparecen en Cloudflare al cabo de unos minutos. El `spa: false` evita medir automáticamente transiciones internas de cliente.
5. Abre «Analítica», retira el permiso y confirma la recarga. La métrica del documento en el que diste permiso puede haber sido recibida por Cloudflare y no se puede retirar retroactivamente desde el navegador; después de recargar, no deben aparecer nuevas solicitudes del beacon.
6. Prueba `/chat.html?code=TEST` y un fragmento `#token=TEST`: la medición debe quedar omitida en esas URL. Prueba `/pulsem.html` y `/sintetico.html`: deben excluirse.
7. Comprueba CSP sin errores y que SynthFlow, login, chats, streaming, adjuntos y SynthonIA siguen funcionando.
8. Verifica en el panel que la inserción automática no está activada; de lo contrario, las pruebas de ausencia previa al consentimiento no son válidas.

## Retención y revisión

Esta app guarda solo la preferencia local por 180 días. Según las FAQ actuales de Cloudflare, los datos beacon sin muestrear se conservan 7 días y luego se agregan aproximadamente al 10 % para almacenamiento a largo plazo; el dashboard permite consultar los seis meses anteriores. Esta integración no puede borrar métricas ya recibidas individualmente ni impone una retención de servidor propia. Revisa las condiciones actuales del proveedor, limita el acceso al panel y define una periodicidad de revisión. No uses Cloudflare Web Analytics para intentar deducir conducta individual: no es una herramienta de replay ni de eventos de producto.

## Qué no afirma este documento

La ausencia de cookies no significa automáticamente que cualquier despliegue o jurisdicción esté exento de obligaciones de privacidad. No se promete cumplimiento legal automático ni anonimato absoluto. La configuración y política deben revisarse antes de producción.
