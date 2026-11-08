/* ---------- Premium con OpenRouter · PREPARADO PERO APAGADO ----------
   Idea de Sammuel (2026-11-08): él paga OpenRouter en «pay as you go» y quien pague el plan puede usar TODOS los modelos de pago
   de OpenRouter (Claude, ChatGPT, Gemini Pro…), además de las IAs gratis de siempre. Siempre dentro de los límites de la página:
   - cada persona tiene un CRÉDITO del mes en dólares (parte de lo que pagó). Cada respuesta premium descuenta lo que costó de verdad.
     Si se acaba, la premium se CORTA hasta el mes siguiente (sigue con las gratis). Así nadie se come más de lo que pagó.
   - además, la premium baja la pila de EnerX del día más rápido: más cuanto más caro sea el modelo (y Profundo el doble).
   Este archivo solo tiene las reglas (cuentas puras, sin internet ni Redis): nadie lo usa todavía y nada cambia en el sitio.
   Se enciende solo con SYNTHZ_PREMIUM=1 y SYNTHZ_PREMIUM_KEY (la llave pagada). Aun así nadie es premium sin SYNTHZ_PLANS_ON=1.
   Diseño completo: PREMIUM.md */

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
const list = v => String(v || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

/* la configuración sale de variables de entorno; la llave nunca se devuelve, solo si existe */
export function config(env = (typeof process !== 'undefined' && process.env) || {}){
  return {
    on: env.SYNTHZ_PREMIUM === '1' && String(env.SYNTHZ_PREMIUM_KEY || '').trim().length >= 20,
    plansOn:  env.SYNTHZ_PLANS_ON === '1',                         /* los planes siguen apagados: nadie es premium */
    credit:   num(env.SYNTHZ_PREMIUM_CREDIT, 2, 0.1, 500),         /* US$ de premium por persona al mes (parte de lo que pagó) */
    usdDay:   num(env.SYNTHZ_PREMIUM_USD_DAY, 5, 0.1, 5000),       /* tope de gasto de Sammuel por día, todos juntos */
    maxOut:   num(env.SYNTHZ_PREMIUM_MAX_OUT, 20, 0.1, 1000),      /* modelos con salida más cara que esto (US$/millón) no se ofrecen */
    ref:      num(env.SYNTHZ_PREMIUM_REF, 0.25, 0.01, 100),        /* US$/millón que «vale» 1 token de EnerX: más caro → baja más la pila */
    maxMult:  num(env.SYNTHZ_PREMIUM_MAX_MULT, 40, 2, 500),
    block:    list(env.SYNTHZ_PREMIUM_BLOCK),                      /* modelos que Sammuel no quiere ofrecer (trozos del id) */
    only:     list(env.SYNTHZ_PREMIUM_ONLY)                        /* si se llena, SOLO esos (vacío = todos) */
  };
}

/* ¿esta cuenta pagó? Solo cuenta si los planes están encendidos y su plan sigue vigente */
export function isPremium(me, cfg, now = Date.now()){
  return !!(cfg && cfg.on && cfg.plansOn && me && me.plan === 'premium' && +me.planUntil > now);
}

/* precio de un modelo de la lista de OpenRouter (/api/v1/models trae pricing en US$ por token, como texto) → US$ por millón */
export function price(m){
  const p = (m && m.pricing) || {}, i = +p.prompt, o = +p.completion;
  return Number.isFinite(i) && Number.isFinite(o) && i >= 0 && o >= 0 ? { in:i * 1e6, out:o * 1e6 } : null;
}

/* ¿se ofrece este modelo en premium? Solo los DE PAGO (los «:free» ya están en las gratis), con precio fijo, no carísimos ni bloqueados */
export function modelOk(m, cfg){
  const id = String((m && m.id) || '').toLowerCase(), p = price(m);
  if (!id || /:free$/.test(id) || !p || (p.in === 0 && p.out === 0)) return false;
  if (p.out > cfg.maxOut || p.in > cfg.maxOut) return false;
  if (cfg.block.some(b => id.includes(b))) return false;
  if (cfg.only.length && !cfg.only.some(b => id.includes(b))) return false;
  return true;
}
export const catalog = (models, cfg) => (Array.isArray(models) ? models : []).filter(m => modelOk(m, cfg));

/* cuántas veces más rápido baja la pila un modelo premium: según su precio (mínimo 2, nunca menos que una gratis) */
export function mult(m, cfg){
  const p = price(m); if (!p) return cfg.maxMult;
  return Math.min(cfg.maxMult, Math.max(2, Math.ceil(((p.in + p.out * 3) / 4) / cfg.ref)));
}

/* lo que costó de verdad una respuesta, en US$. OpenRouter lo dice en usage.cost; si no, se calcula con el precio */
export function usd(usage, m){
  const u = usage || {};
  if (Number.isFinite(+u.cost) && +u.cost >= 0 && u.cost !== null && u.cost !== '') return +u.cost;
  const p = price(m) || { in:0, out:0 };
  return (Math.max(0, +u.prompt_tokens || 0) * p.in + Math.max(0, +u.completion_tokens || 0) * p.out) / 1e6;
}

/* lo más que podría costar este mensaje (para no empezar uno que no alcanza a pagar el crédito) */
export function worst({ inTok = 0, maxOut = 4000 }, m){
  const p = price(m) || { in:0, out:0 };
  return (Math.max(0, inTok) * p.in + Math.max(0, maxOut) * p.out) / 1e6;
}

/* lo que baja la pila de EnerX: tokens reales × (premium ? mult del modelo : 1) × esfuerzo. Siempre entero y al menos 1 */
export function energy({ tokens = 0, model = null, effort = 'auto' }, cfg){
  const x = (model ? mult(model, cfg) : 1) * EFFORT[effortKey(effort)].x;
  return Math.max(1, Math.ceil(Math.max(0, tokens) * x));
}

/* ¿esta respuesta puede ir al modelo premium que eligió? Si no, se dice por qué; la persona siempre puede seguir con las gratis */
export function decide({ me, model = null, energyLeft = Infinity, creditUsed = 0, usdToday = 0, inTok = 0, maxOut = 4000 }, cfg, now = Date.now()){
  if (!model) return energyLeft <= 0 ? { tier:'none', why:'sin_enerx' } : { tier:'free', why:'eligio_gratis' };
  if (!cfg || !cfg.on) return { tier:'free', why:'apagado' };
  if (!isPremium(me, cfg, now)) return { tier:'free', why:'sin_plan' };
  if (!modelOk(model, cfg)) return { tier:'free', why:'no_ofrecido' };
  if (energyLeft <= 0) return { tier:'none', why:'sin_enerx' };
  const left = cfg.credit - creditUsed;
  if (left <= 0) return { tier:'cut', why:'sin_credito', left:0 };
  if (worst({ inTok, maxOut }, model) > left) return { tier:'cut', why:'no_alcanza', left };
  if (usdToday >= cfg.usdDay) return { tier:'free', why:'tope_dia' };
  return { tier:'premium', why:'ok', left, mult:mult(model, cfg) };
}

/* texto que ve la persona cuando no se pudo usar la premium (ES y EN) */
export const WHY = {
  apagado:    ['La IA premium todavía no está disponible.', 'Premium AIs are not available yet.'],
  sin_plan:   ['Ese modelo es del plan de pago. Puedes seguir con las IAs gratis.', 'That model is for the paid plan. You can keep using the free AIs.'],
  no_ofrecido:['Ese modelo no está en la lista premium. Elige otro.', 'That model is not on the premium list. Pick another one.'],
  sin_enerx:  ['Se te acabó la EnerX de hoy. Se renueva a medianoche.', 'You are out of EnerX for today. It renews at midnight.'],
  sin_credito:['Usaste todo tu crédito premium de este mes. Vuelve el mes que viene; mientras, sigues con las IAs gratis.', 'You used all your premium credit for this month. It comes back next month; meanwhile, keep using the free AIs.'],
  no_alcanza: ['Tu crédito premium no alcanza para este modelo. Prueba uno más barato o una IA gratis.', 'Your premium credit is not enough for this model. Try a cheaper one or a free AI.'],
  tope_dia:   ['La IA premium descansa por hoy. Te respondió la mejor IA gratis.', 'Premium AIs are resting for today. The best free AI answered.']
};

/* el paso que se le daría a _pool.js chat() (con la llave aparte, nunca mezclada con las gratis) */
export function step(m){
  return { id:'premium:' + m.id, prov:'openrouter', mid:m.id, name:String(m.name || m.id).slice(0, 60), premium:true };
}
