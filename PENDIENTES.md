# Para después (pedido por Sammuel, 20-oct-2026)
- **Pulsem con cara de dashboard típico**: tarjetas de números arriba, gráficas de uso por día, tablas de cuentas y llaves, filtros. (No tocar hasta que Sammuel diga.)
- **Dominio**: synthetismflow.com (US$11,25/año) o synthetismflow.app (US$9,99 y luego US$15). Lo compra Sammuel cuando quiera.
- **A.L.I.A.S. hay que rehacerlo (Sammuel, 28-oct-2026)**: dice que como está ahora es «horrible, feo, inservible». No se le suman cosas encima: cuando se retome, se replantea desde cero (qué hace, cómo se ve y para qué le sirve a la persona) y se le muestra antes de construir.
- **Video de la app**: si Sammuel consigue música con permiso de uso, se le agrega.

# Pendientes

## PLAN DE PAGOS — APAGADO (no se activa hasta que Sammuel lo diga)

Nada de esto está encendido. No hay llaves de pago, ni cobros, ni botones de comprar. Es el plan para cuando lleguen los pagos.

### Lo que se reserva para los planes de pago
- **Asistente en WhatsApp, Telegram y Slack** (como «Claw» de Abacus): SynthFlow responde en tus apps de mensajes y recuerda la conversación.
- **Estudio de video y voz** (como «Studio» de Abacus): videos cortos, voces y boca que habla al ritmo del audio.

### El agente de pago (cambia a las IAs de pago solo cuando haya pagos)
Para cada pedido elige la IA de pago que mejor lo hace. Lo demás sigue con las IAs gratis de hoy (Groq, Google Flash, Mistral, Cloudflare, Ollama, SiliconFlow, Pollinations, Tavily, Exa).
| Tarea | IA de pago |
|---|---|
| Textos difíciles, razonar, estudiar | GPT (OpenAI) o Claude (Anthropic) |
| Programar | Claude |
| Imágenes y **videos** | Gemini (Google: imágenes y Veo para video) |
| Actualidad y redes | Grok (xAI) |
| Todo lo demás, con muchos modelos y pago por uso | OpenRouter |
| Saludos y tareas muy simples | Siguen en las IAs gratis (no gasta) |
Reglas: un interruptor del servidor `PAGOS_ACTIVOS` (hoy apagado); las llaves de pago solo en el servidor; tope de gasto diario por persona y global; si se pasa el tope, vuelve a las gratis. Nunca cobra solo: la persona ve antes cuánto le queda.

### Lo que cuesta (precios de las APIs, octubre 2026, verificar antes de lanzar)
| Uso | Costo aprox. |
|---|---|
| 1 mensaje normal con GPT 6.1 Sol / Claude Sonnet / Grok 4.6 (≈1.500 de entrada + 600 de salida) | US$0,007–0,014 |
| 1 mensaje con lo más potente (GPT 6 Astra / Claude Opus) | ≈ US$0,045 |
| 1 imagen (GPT Image, calidad media) | ≈ US$0,05 |
| 1 video de 8 s con Veo 3.1 Fast 720p | ≈ US$0,80 (Veo normal ≈ US$3,20) |

### Tarifas recomendadas (más baratas y claras que Abacus: US$10 y US$20)
> Nombres confirmados por Sammuel (20-oct-2026): **Chispa** (gratis), **Syntonia**, **Timeless** y **Orquesta**. Ninguno está activo: no hay pagos. En Ajustes, los colores «Aurora» y «Oro negro» dicen «Pronto»: llegarían con Syntonia.

| Plan | Precio | Qué trae cada mes |
|---|---|---|
| **Chispa** (gratis) | US$0 | Lo de hoy: IAs gratis, imágenes con límite, internet, memoria |
| **Syntonia** | US$7,99 (≈ COP 32.000) | 400 mensajes con IAs pro (GPT, Claude, Grok, Gemini Pro) + 30 imágenes pro + todo lo gratis sin límite apretado |
| **Timeless** | US$17,99 (≈ COP 72.000) | 900 mensajes pro + 50 con lo más potente + 80 imágenes + 2 videos cortos + asistente en WhatsApp/Telegram |
| **Orquesta** (equipos) | US$8,99 por persona (mín. 3) | Lo de Syntonia para cada persona + chats y panel de equipo |
Contador siempre visible de «te quedan X mensajes pro» (lo que más le critican a Abacus es que no se sabe cuánto gasta cada tarea).

### Próximos descuentos recomendados
- **Lanzamiento:** 40 % los primeros 3 meses para quienes tengan el logro de 100 o 500 visitas (ya se les prometió).
- **Anual:** paga 10 meses y usa 12 (≈ 17 % menos).
- **Estudiantes:** 30 % menos con correo de universidad o colegio.
- **Invita amigos:** 1 mes gratis por cada 3 personas invitadas que paguen.
- **Siempre:** cancelar con un clic y aviso 3 días antes de cada cobro (nada de renovaciones sorpresa).


**Hechos en v1.9B:** archivos tipo Claude con vista previa, ejemplos en la caja, texto claro, guía que felicita y cierra lo abierto, saludo y boca de Sona, revisión de seguridad.

**Para Sammuel (opcional, en Supabase):** Authentication → Providers → apagar «Email» si solo se va a entrar con Google (SynthZ ya rechaza esas cuentas, pero así ni se crean).

**Hechos en v1.8B (19-oct-2026):** los 6 puntos de abajo.

## Anotados el 19-oct-2026

1. **Botón «Empezar a FlowIA'r» con la carita:** al seleccionarlo (hover/foco) no se ve bien.
2. **Texto de «Pregunta en SynthFlow»:** quitar «solo para conversar».
3. **Modo agente:** debe ir debajo de «Mis chats» en la barra lateral.
4. **Ajustes uno por uno:** cada opción debe funcionar sola, sin depender de las otras.
   - Apagar el cursor → se dejaba de ver el cursor (debe volver el normal del sistema).
   - Apagar animaciones → los logos no cargaban.
5. **Ventana de selección de IA:** al abrir los filtros sale un borde oscuro por fuera (con y sin animaciones).
6. **Flujo del modo agente:**
   - Al escribir: primero «Modo agente activado · ¿Qué quieres FlowIA'r?» como siempre.
   - En modo agente NO se elige IA (no sale el selector).
   - Se ven los pasos mientras carga, con su loguito pixelado: qué está haciendo el agente.
   - Luego dice qué IA escogió y muestra la respuesta.
   - Al final: «Quedarme con esta IA» o «Seguir en modo agente» (= repetir los mismos pasos en el próximo mensaje, sin fijar la IA).

## Plan después de esto
Confirmar Supabase/Google · Google AI Studio y GitHub Models · guía nueva («Guía rápida», Sona elige temas, «¡Descubriste algo nuevo!») · «Qué hay de nuevo» por Sona · vista previa de código · presentaciones PowerPoint · imágenes con su propio límite · compartir chat y voz.
