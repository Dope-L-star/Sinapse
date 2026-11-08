# Premium con OpenRouter (preparado, APAGADO)

Reglas en `api/_premium.js`, pruebas en `t/premium/premium.mjs` (`node t/premium/premium.mjs`). Nada del sitio lo usa todavía.

## Qué hace
- Quien paga usa las IAs gratis **y** una IA premium de OpenRouter (una sola, la paga Sammuel).
- Todo sale de la **misma pila de EnerX**: la premium la baja `SYNTHZ_PREMIUM_MULT` veces más rápido (4 por defecto).
- El esfuerzo también multiplica: Veloz ×0,75 · Auto ×1 · Creativo ×1,25 · Profundo ×2 (Bajo/Medio/Alto = Veloz/Auto/Profundo).
- Si se pasa un tope de dinero (del día para todos, o del mes por persona), responde la mejor IA gratis y se le dice por qué. Nunca se queda sin respuesta, salvo si se acabó la EnerX.

## Cómo se enciende (cuando Sammuel lo decida)
| Variable | Para qué |
|---|---|
| `SYNTHZ_PREMIUM=1` | interruptor |
| `SYNTHZ_PREMIUM_KEY` | llave **pagada** de OpenRouter, aparte. **Nunca** en `POOL_OPENROUTER_KEY` ni en las llaves de Pulsem |
| `SYNTHZ_PREMIUM_MODEL` | por ejemplo `deepseek/deepseek-chat` (no puede terminar en `:free`) |
| `SYNTHZ_PREMIUM_USD_IN` / `_OUT` | precio por millón de tokens, copiado de openrouter.ai/models |
| `SYNTHZ_PREMIUM_USD_DAY` | tope de gasto diario de Sammuel (1 US$ por defecto) |
| `SYNTHZ_PREMIUM_USER_MONTH` | tope por persona al mes (2 US$ por defecto) |
| `SYNTHZ_PLANS_ON=1` | sin esto nadie es premium (los planes siguen apagados) |

Además, en OpenRouter ponerle a la llave un **límite de crédito**: es la red de seguridad final.

## Lo que falta para conectarlo (no hecho a propósito)
1. En `api/ai.js`: leer `config()`, ver con `decide()` si toca premium, y si sí, llamar a `chat()` con `step(cfg)` y la llave aparte.
2. En `_pool.js chat()`: un parámetro opcional `weight` para que `account()` sume `energy()` en vez de los tokens tal cual (avisar a los demás hilos: es archivo compartido).
3. Contadores en Redis: `prem:usd:<día>` y `prem:usd:<sub>:<mes>`.
4. En el chat: la IA premium en la lista con su sello, y el aviso «esta respuesta gastó ×4».
