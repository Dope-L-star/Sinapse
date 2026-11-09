/* Pruebas del plan premium (apagado). Sin internet ni Redis. Uso: node t/premium/premium.mjs */
import assert from 'node:assert/strict';
import { heavy, perMsg, listItem, config, isPremium, energy, decide, usd, worst, effortKey, step, WHY, price, modelOk, catalog, mult } from '../../api/_premium.js';
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('✓', name); };
const KEY = 'sk-or-v1-' + 'x'.repeat(40), NOW = Date.UTC(2026, 10, 8);
const ON = { SYNTHZ_PREMIUM:'1', SYNTHZ_PREMIUM_KEY:KEY, SYNTHZ_PLANS_ON:'1' };
const payer = { plan:'premium', planUntil:NOW + 864e5 };
/* precios de ejemplo en US$ por token, como los da OpenRouter */
const pm = (id, i, o) => ({ id, name:id, pricing:{ prompt:String(i / 1e6), completion:String(o / 1e6) } });
const cheap = pm('deepseek/deepseek-chat', 0.25, 1), mid = pm('anthropic/claude-sonnet', 3, 15), pricey = pm('openai/o1-pro', 150, 600);
const freeM = pm('meta-llama/llama-3.3-70b-instruct:free', 0, 0), auto = { id:'openrouter/auto', pricing:{ prompt:'-1', completion:'-1' } };

ok('sin variables está apagado', () => { const c = config({}); assert.equal(c.on, false); assert.equal(c.plansOn, false); });
ok('sin llave o sin interruptor → apagado', () => { assert.equal(config({ ...ON, SYNTHZ_PREMIUM:'0' }).on, false); assert.equal(config({ ...ON, SYNTHZ_PREMIUM_KEY:'' }).on, false); });
ok('la llave nunca sale en la configuración', () => assert.ok(!JSON.stringify(config(ON)).includes(KEY)));
ok('con planes apagados nadie es premium', () => assert.equal(isPremium(payer, config({ ...ON, SYNTHZ_PLANS_ON:'0' }), NOW), false));
ok('plan vencido no es premium', () => assert.equal(isPremium({ plan:'premium', planUntil:NOW - 1 }, config(ON), NOW), false));
ok('plan vigente sí es premium', () => assert.equal(isPremium(payer, config(ON), NOW), true));

const c = config(ON);
ok('precio por millón', () => assert.deepEqual(price(mid), { in:3, out:15 }));
ok('todos los de pago se ofrecen; gratis, carísimos y de precio variable no', () => {
  assert.deepEqual(catalog([cheap, mid, pricey, freeM, auto, {}], c).map(m => m.id), ['deepseek/deepseek-chat', 'anthropic/claude-sonnet']);
});
ok('Sammuel puede bloquear o dejar solo algunos', () => {
  assert.equal(modelOk(mid, config({ ...ON, SYNTHZ_PREMIUM_BLOCK:'anthropic' })), false);
  assert.equal(modelOk(cheap, config({ ...ON, SYNTHZ_PREMIUM_ONLY:'anthropic/,openai/' })), false);
  assert.equal(modelOk(mid, config({ ...ON, SYNTHZ_PREMIUM_ONLY:'anthropic/,openai/' })), true);
});
ok('modelo más caro baja la pila más rápido', () => { assert.equal(mult(cheap, c), 4); assert.equal(mult(mid, c), 40); assert.ok(mult(cheap, c) >= 2); });
ok('gratis en Auto gasta lo real', () => assert.equal(energy({ tokens:1000 }, c), 1000));
ok('premium barato ×4, Profundo el doble, Veloz menos, Creativo un poco más', () => {
  assert.equal(energy({ tokens:1000, model:cheap }, c), 4000);
  assert.equal(energy({ tokens:1000, model:cheap, effort:'deep' }, c), 8000);
  assert.equal(energy({ tokens:1000, effort:'fast' }, c), 750);
  assert.equal(energy({ tokens:1000, effort:'creative' }, c), 1250);
});
ok('nombres viejos Bajo/Medio/Alto siguen sirviendo', () => { assert.equal(effortKey('low'), 'fast'); assert.equal(effortKey('high'), 'deep'); assert.equal(effortKey('medium'), 'auto'); assert.equal(effortKey('raro'), 'auto'); });
ok('siempre entero y al menos 1', () => { assert.equal(energy({ tokens:0 }, c), 1); assert.ok(Number.isInteger(energy({ tokens:333, effort:'fast' }, c))); });
ok('costo real: usa el que dice OpenRouter, si no lo calcula', () => {
  assert.equal(usd({ cost:0.0123 }, mid), 0.0123);
  assert.equal(usd({ prompt_tokens:1e6, completion_tokens:1e6 }, mid), 18);
});
ok('peor caso de un mensaje', () => assert.equal(worst({ inTok:1000, maxOut:1000 }, mid), 0.018));

ok('apagado → gratis', () => assert.deepEqual(decide({ me:payer, model:mid }, config({}), NOW), { tier:'free', why:'apagado' }));
ok('sin plan → gratis', () => assert.equal(decide({ me:{ plan:'free' }, model:mid }, c, NOW).why, 'sin_plan'));
ok('modelo no ofrecido → elige otro', () => assert.equal(decide({ me:payer, model:pricey }, c, NOW).why, 'no_ofrecido'));
ok('pagó y hay de todo → premium', () => { const d = decide({ me:payer, model:mid, creditUsed:0.5 }, c, NOW); assert.equal(d.tier, 'premium'); assert.equal(d.left, 1.5); });
ok('crédito del mes agotado → se CORTA la premium', () => assert.deepEqual(decide({ me:payer, model:cheap, creditUsed:2 }, c, NOW), { tier:'cut', why:'sin_credito', left:0 }));
ok('crédito que no alcanza para este mensaje → se corta', () => assert.equal(decide({ me:payer, model:mid, creditUsed:1.99, inTok:2000, maxOut:4000 }, c, NOW).why, 'no_alcanza'));
ok('sin EnerX → no responde ninguna', () => { assert.equal(decide({ me:payer, model:mid, energyLeft:0 }, c, NOW).tier, 'none'); assert.equal(decide({ me:payer, energyLeft:0 }, c, NOW).tier, 'none'); });
ok('tope del día de Sammuel → pasa a gratis', () => assert.deepEqual(decide({ me:payer, model:cheap, usdToday:5 }, c, NOW), { tier:'free', why:'tope_dia' }));
ok('si elige una gratis, va gratis', () => assert.equal(decide({ me:payer }, c, NOW).tier, 'free'));
ok('cada aviso existe en ES y EN', () => { for (const w of Object.keys(WHY)) assert.equal(WHY[w].length, 2); });
ok('el paso premium va a OpenRouter con el modelo elegido', () => assert.deepEqual(step(mid), { id:'premium:anthropic/claude-sonnet', prov:'openrouter', mid:'anthropic/claude-sonnet', name:'anthropic/claude-sonnet', premium:true }));
ok('alto consumo: Claude Sonnet sí, DeepSeek no', () => { assert.equal(heavy(mid, c), true); assert.equal(heavy(cheap, c), false); });
ok('el umbral de alto consumo se puede ajustar', () => assert.equal(heavy(cheap, config({ ...ON, SYNTHZ_PREMIUM_HEAVY:'3' })), true));
ok('la lista del chat lleva ×N, alto consumo y costo por respuesta', () => {
  const li = listItem(mid, c); assert.equal(li.heavy, true); assert.equal(li.mult, 40); assert.equal(li.usdMsg, 0.018); assert.equal(li.premium, true);
  assert.equal(perMsg(cheap), 0.00125);
});
/* v4.4 · regalo del equipo (Pulsem › Usuarios) */
const gift = { ux:{ f:{ premium:true } } };
ok('regalo: es premium aunque los planes estén apagados', () => assert.equal(isPremium(gift, config({ ...ON, SYNTHZ_PLANS_ON:'0' }), NOW), true));
ok('regalo sin la llave premium puesta → no es premium', () => assert.equal(isPremium(gift, config({}), NOW), false));
ok('sin regalo y planes apagados → no es premium', () => assert.equal(isPremium({ ux:{ f:{ premium:false } } }, config({ ...ON, SYNTHZ_PLANS_ON:'0' }), NOW), false));
ok('crédito propio: con 0,5 US$ y 0,4 usados quedan 0,1', () => { const d = decide({ me:{ ux:{ f:{ premium:true }, credit:0.5 } }, model:cheap, creditUsed:0.4 }, c, NOW); assert.equal(d.tier, 'premium'); assert.ok(Math.abs(d.left - 0.1) < 1e-9); });
ok('crédito propio en 0 → se corta', () => assert.equal(decide({ me:{ ux:{ f:{ premium:true }, credit:0 } }, model:cheap }, c, NOW).why, 'sin_credito'));
console.log('\n' + n + ' pruebas OK');
