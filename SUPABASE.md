# Conectar SynthZ con Supabase (3 pasos, 5 minutos)

Ya creé las tablas en tu proyecto **SynthZ** de Supabase (cuentas, perfiles, preferencias, chats, logros y opiniones), con seguridad: nadie desde el navegador puede leerlas; solo tu servidor.

## 1. Pon la llave secreta en Vercel (la haces tú; nunca por chat)
1. Entra a supabase.com → proyecto **SynthZ** → **Project Settings** → **API Keys**.
2. En **Secret keys**, copia la llave que empieza por `sb_secret_…` (si no hay, crea una).
3. Entra a vercel.com → tu proyecto → **Settings** → **Environment Variables** → **Add**:
   - Nombre: `SUPABASE_SECRET_KEY`
   - Valor: la llave que copiaste
   - Entornos: Production (y Preview si quieres).
4. **Deployments** → los tres puntos del último → **Redeploy**.

Listo: Pulsem → Ajustes dirá «✓ Conectada».

## 2. Copia lo de antes a Supabase (una sola vez)
Pulsem → Ajustes → **Supabase** → «Copiar todo lo de antes a Supabase» (solo Prime).

## 3. «Entrar con Google» (opcional)
1. **Google Cloud** → APIs y servicios → Credenciales → **Crear credenciales** → ID de cliente de OAuth → Aplicación web.
   - Orígenes autorizados: `https://symphoria.pages.dev`
   - URI de redireccionamiento autorizado: `https://luvvlfoyatdmrxvhdxay.supabase.co/auth/v1/callback`
2. **Supabase** → Authentication → **Sign In / Providers** → **Google** → activar → pega el *Client ID* y el *Client Secret* de Google → Guardar.
3. **Supabase** → Authentication → **URL Configuration**:
   - Site URL: `https://symphoria.pages.dev`
   - Redirect URLs: `https://symphoria.pages.dev/**`

En cuanto esté activo, el botón «Continuar con Google» aparece solo en «Entrar».

## Seguridad
- La llave secreta solo vive en Vercel. Nunca va al navegador ni a las respuestas.
- Las tablas tienen RLS activado y sin permisos públicos.
- Si Supabase falla un momento, todo sigue funcionando con Redis y el error queda en Pulsem.
- Nada de esto cobra: el plan gratis de Supabase alcanza.
