# Panel de administración nuevo (Pulsem en React)

Componentes listos para que la migración de Pulsem a React los monte. No tocan `pulsem.html` ni `src/pulsem/`.

| Archivo | Qué es |
|---|---|
| `PanelAdmin.jsx` | El panel completo: encabezado, menú (Resumen, Llaves, Ajustes, Comentarios, Ayuda) y cada sección. Importa `admin.css`. |
| `partes.jsx` | Piezas: saldo con ojo (Uiverse #40), radar de carga (#41), confirmación brutalista (#52), «Contactar» y la paleta Ctrl+K. |
| `textos.mjs` | Todo el texto visible en español e inglés. |
| `admin.css` | Estilos con prefijo `.pa-`. Sigue al tema (`--sb-*`, `--gold`), a `html.simple`, `html.compact`, `html.noanim` y `html.noglass`. |
| `demo-datos.mjs` | `apiDemo()`: datos inventados para revisar sin servidor. |
| `demo/` | Página de prueba: `node next/componentes/admin/demo/armar.mjs` → `cloudflare/public/panel-demo.html` (no se publica en el sitio). Parámetros: `?lang=en`, `&rank=Symmetrix`, `&simple`, `&compact`, `&theme=bosque`. |

## Cómo montarlo en la página de Pulsem

```jsx
'use client';
import PanelAdmin from '../../componentes/admin/PanelAdmin';
// cuando core.js ya cargó (window.SZ existe) y hay sesión:
<PanelAdmin api={window.SZ.api} onAuth={status => mostrarPuerta(status === 401 ? 'login' : 'team')} />
```

- `api(path, { method, body, keep })` es la misma de `core.js`. El panel pide `health?panel=1` y `trial` al abrir, cada minuto y al volver a la pestaña (no recarga si estás escribiendo).
- `onAuth(401|403)`: la puerta de entrada (iniciar sesión / solo el equipo) sigue siendo de la página, igual que hoy.
- `lang` es opcional: si no se pasa, sigue a `<html lang>` al instante. El botón ES/EN de la cabecera llama a `onLang(l)` si se pasa; si no, a `window.SZ.setLang`.
- `toast` es opcional: si no se pasa, el panel usa sus propios avisos.
- Usa las mismas llamadas del servidor que el Pulsem de hoy (`trial`, `help`, `health`); no hace falta cambiar nada en `api/`.

## Qué mejora frente al Pulsem de hoy (misma forma)

- **Para atender ahora**, arriba del Resumen: ayuda sin responder +15 min, llaves en pausa, alertas de proveedores, mantenimiento encendido, lo gratis del mes pasado el 70 % y comentarios nuevos, cada uno con su botón.
- **Ctrl+K** (o «Buscar»): ir a cualquier sección o hacer algo (probar llaves, escribir qué estamos arreglando, abrir el pedido de ayuda más viejo). Teclas **1–5** cambian de sección.
- **Ayuda en dos columnas** (lista + conversación) con respuestas rápidas; en el celular, una a la vez con botón para volver.
- **En línea**: buscar persona y «Solo con problemas». **Comentarios**: buscar y marcar al instante (si falla, vuelve).
- **Mantenimiento** y **copiar a Supabase** piden confirmación fuerte; quitar una llave también.
- **SynXCoin gastadas** oculto con un ojo, por si compartes pantalla.
- **Qué estamos arreglando**: muestra cómo lo contaría Sona mientras escribes.
- Celular: el menú pasa a una barra abajo con los numeritos.

## Usuarios: permisos y límites por persona (v4.4)

`Usuarios.jsx` es la sección 6 (tecla **6**, Ctrl+K «Dar permisos o límites a alguien», o el botón «Permisos» en «En línea»).
Busca cuentas y abre su ficha: lo que usó hoy, interruptores de permisos (A.L.I.A.S., imágenes, internet, revisión, cerebro grande e IAs premium de regalo) y límites (EnerX con atajos ×2 · ×5 · Sin límite · Sin IAs, imágenes, búsquedas, cerebro grande, A.L.I.A.S. ×, crédito premium). Vacío = como todos.
Servidor: `api/_permisos.js` (clave `perm:<sub>`, historial `perm:log`) y `api/_usuarios.js` por `/api/trial` (`users`, `user`, `uset`, `ublock`). Lo aplican `api/ai.js`, `api/alias.js` y `api/_premium.js` en cada pedido. Symmetrix ve; Prime y ZFlow cambian; a Prime solo lo cambia Prime. Prueba: `node t/humo/permisos.mjs` (redis-server local).
