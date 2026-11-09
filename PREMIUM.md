# Premium con OpenRouter (preparado, APAGADO)

Reglas en `api/_premium.js`, pruebas en `t/premium/premium.mjs` (`node t/premium/premium.mjs`). Nada del sitio lo usa todavía.

## Qué hace
- Sammuel paga OpenRouter en «pay as you go» (su llave «Prime»). Quien pague el plan puede usar **todos los modelos de pago de OpenRouter** (Claude, ChatGPT, Gemini Pro…) además de las IAs gratis.
- Cada persona tiene un **crédito premium del mes en dólares** (`SYNTHZ_PREMIUM_CREDIT`, 2 por defecto). Cada respuesta premium descuenta lo que costó de verdad (`usage.cost` de OpenRouter). Si se acaba, o no alcanza para el mensaje, **la premium se corta** hasta el mes siguiente; las gratis siguen.
- La premium también baja la pila de EnerX del día más rápido, según el precio del modelo (mínimo ×2, tope `SYNTHZ_PREMIUM_MAX_MULT`). El esfuerzo multiplica encima: Veloz ×0,75 · Auto ×1 · Creativo ×1,25 · Profundo ×2.
- No se ofrecen: modelos `:free` (ya están en las gratis), de precio variable (`openrouter/auto`), los más caros que `SYNTHZ_PREMIUM_MAX_OUT` (20 US$/millón) y los de `SYNTHZ_PREMIUM_BLOCK`.

## Cómo se enciende (cuando Sammuel lo decida; hoy NO)
| Variable | Para qué |
|---|---|
| `SYNTHZ_PREMIUM=1` | interruptor |
| `SYNTHZ_PREMIUM_KEY` | la llave pagada («Prime»). **Nunca** en `POOL_OPENROUTER_KEY` ni en las llaves de Pulsem |
| `SYNTHZ_PREMIUM_CREDIT` | US$ de premium por persona al mes |
| `SYNTHZ_PREMIUM_USD_DAY` | tope de gasto diario de Sammuel, todos juntos (5 por defecto) |
| `SYNTHZ_PREMIUM_MAX_OUT` | precio máximo de salida por millón que se ofrece |
| `SYNTHZ_PREMIUM_BLOCK` / `_ONLY` | quitar modelos / dejar solo algunos (trozos del id, separados por coma) |
| `SYNTHZ_PLANS_ON=1` | sin esto nadie es premium (los planes siguen apagados) |

Además, en OpenRouter ponerle a la llave un **límite de crédito**: es la red de seguridad final.

## Lo que falta para conectarlo (no hecho a propósito)
1. Leer `/api/v1/models` de OpenRouter y filtrar con `catalog()` (guardarlo 1 h).
2. En `api/ai.js`: `decide()` antes de cada mensaje; si es premium, `chat()` con `step(m)` y la llave aparte, `usage:{include:true}`.
3. En `_pool.js chat()`: parámetro opcional `weight` para que `account()` sume `energy()` (avisar a los demás hilos: archivo compartido).
4. Redis: `prem:usd:<día>` y `prem:cr:<sub>:<mes>` (crédito usado).
5. En el chat: sección «Premium» en el selector de IA (cada modelo con `listItem()`), sello «gastó ×N» y lo que queda de crédito (`SZ.SZQ.credit`).

## Aviso grande de alto consumo (hecho, dormido)
Al elegir un modelo premium con `heavy` (×20 o más, `SYNTHZ_PREMIUM_HEAVY`; p. ej. Claude Fable/Opus, GPT pro, Gemini Pro) sale una tarjeta grande ES/EN que dice ×N, cuánto del crédito usa cada respuesta y cuántas le quedan. Hay que aceptar «Usarla igual»; lo marcado por defecto es «Elegir una más liviana». Sale cada vez. Código: `src/chat/16h-premium-aviso.js` + `pickModel()`. Hoy no sale porque la lista no trae modelos premium.
