/* ---------- Premium con OpenRouter · PREPARADO PERO APAGADO ----------
   Idea de Sammuel (2026-11-08): quien pague usa las IAs gratis Y una IA premium (una sola, de OpenRouter, que paga él).
   Las dos gastan de la MISMA pila de EnerX, pero la premium la gasta más rápido (y el esfuerzo «Profundo» todavía más).
   Este archivo solo tiene las reglas (cuentas puras, sin internet ni Redis): nadie lo usa todavía y nada cambia en el sitio.
   Se enciende solo si existen las TRES cosas: SYNTHZ_PREMIUM=1, SYNTHZ_PREMIUM_KEY (la llave pagada) y SYNTHZ_PREMIUM_MODEL.
   Aun encendido, nadie es premium mientras los planes sigan apagados (plansOn = false). Diseño completo: PREMIUM.md */

/* cuánto multiplica cada esfuerzo el gasto de EnerX (los nombres viejos Bajo/Medio/Alto siguen sirviendo) */
export const EFFORT = {
  fast:     { n:'Veloz',     en:'Fast',     x:0.75 },
  auto:     { n:'Auto',      en:'Auto',     x:1 },
  creative: { n:'Creativo',  en:'Creative', x:1.25 },
  deep:     { n:'Profundo',  en:'Deep',     x:2 }
};
const ALIAS = { low:'fast', medium:'auto', high:'deep', veloz:'fast', profundo:'deep', creativo:'creative' };
export const effortKey = e => { const k = String(e || '').toLowerCase(); return EFFORT[k] ? k : ALIAS[k] || 'auto'; };

const num = (v, d, lo, hi) => { const n = +v; return Number.isFinite(n) && n > 0 ? Math.min(hi, Math.max(lo, n)) : d; };

/* la configuración sale de variables de entorno; la llave nunca se devuelve, solo si existe */
export function config(env = (typeof process !== 'undefined' && process.env) || {}){
  const model = String(env.SYNTHZ_PREMIUM_MODEL || '').trim(), hasKey = String(env.SYNTHZ_PREMIUM_KEY || '').trim().length >= 20;
  return {
    on: env.SYNTHZ_PREMIUM === '1' && hasKey && /^[\w.-]+\/[\w.:-]+$/.test(model) && !/:free$/i.test(model),
    model, name: String(env.SYNTHZ_PREMIUM_NAME || model.split('/').pop() || 'Premium').slice(0, 40),
    mult:     num(env.SYNTHZ_PREMIUM_MULT, 4, 1, 50),            /* 1 token premium = 4 de la pila (ajustable) */
    priceIn:  num(env.SYNTHZ_PREMIUM_USD_IN, 1, 0.01, 200),      /* US$ por millón de tokens de entrada (copiar de openrouter.ai/models) */
    priceOut: num(env.SYNTHZ_PREMIUM_USD_OUT, 4, 0.01, 400),     /* US$ por millón de tokens de salida */
    usdDay:   num(env.SYNTHZ_PREMIUM_USD_DAY, 1, 0.05, 1000),    /* tope de gasto de Sammuel por día, para todos juntos */
    userMonth:num(env.SYNTHZ_PREMIUM_USER_MONTH, 2, 0.05, 100),  /* tope en US$ por persona al mes */
    plansOn:  env.SYNTHZ_PLANS_ON === '1'                        /* los planes siguen apagados: nadie es premium */
  };
}

/* ¿esta cuenta pagó? Solo cuenta si los planes están encendidos y su plan sigue vigente */
export function isPremium(me, cfg, now = Date.now()){
  return !!(cfg && cfg.on && cfg.plansOn && me && me.plan === 'premium' && +me.planUntil > now);
}

/* lo que cuesta de verdad una respuesta, en US$ (para los topes de dinero) */
export function usd({ inTok = 0, outTok = 0 }, cfg){
  return (Math.max(0, inTok) * cfg.priceIn + Math.max(0, outTok) * cfg.priceOut) / 1e6;
}

/* lo que baja la pila de EnerX: tokens reales × (premium ? mult : 1) × esfuerzo. Siempre entero y al menos 1 */
export function energy({ tokens = 0, premium = false, effort = 'auto' }, cfg){
  const x = (premium ? cfg.mult : 1) * EFFORT[effortKey(effort)].x;
  return Math.max(1, Math.ceil(Math.max(0, tokens) * x));
}

/* ¿esta respuesta va a la IA premium o a las gratis? Nunca deja a la persona sin respuesta: si algo falta, va gratis y dice por qué */
export function decide({ me, want = 'premium', energyLeft = Infinity, usdToday = 0, usdUserMonth = 0 }, cfg, now = Date.now()){
  if (want !== 'premium') return { tier:'free', why:'eligio_gratis' };
  if (!cfg || !cfg.on) return { tier:'free', why:'apagado' };
  if (!isPremium(me, cfg, now)) return { tier:'free', why:'sin_plan' };
  if (energyLeft <= 0) return { tier:'none', why:'sin_enerx' };
  if (usdToday >= cfg.usdDay) return { tier:'free', why:'tope_dia' };
  if (usdUserMonth >= cfg.userMonth) return { tier:'free', why:'tope_mes' };
  return { tier:'premium', why:'ok' };
}

/* texto que ve la persona cuando no se pudo usar la premium (ES y EN) */
export const WHY = {
  apagado:  ['La IA premium todavía no está disponible.', 'The premium AI is not available yet.'],
  sin_plan: ['La IA premium es para el plan de pago. Te respondió una IA gratis.', 'The premium AI is for the paid plan. A free AI answered.'],
  sin_enerx:['Se te acabó la EnerX de hoy. Se renueva a medianoche.', 'You are out of EnerX for today. It renews at midnight.'],
  tope_dia: ['La IA premium descansa por hoy. Te respondió la mejor IA gratis.', 'The premium AI is resting for today. The best free AI answered.'],
  tope_mes: ['Usaste toda tu IA premium de este mes. Sigues con las IAs gratis.', 'You used all your premium AI for this month. You keep the free ones.']
};

/* el paso que se le daría a _pool.js chat() cuando toque usar la premium (con la llave aparte, nunca mezclada con las gratis) */
export function step(cfg){
  return { id:'premium:' + cfg.model, prov:'openrouter', mid:cfg.model, name:cfg.name, premium:true };
}
