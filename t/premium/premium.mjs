/* Pruebas del plan premium (apagado). Sin internet ni Redis. Uso: node t/premium/premium.mjs */
import assert from 'node:assert/strict';
import { config, isPremium, energy, decide, usd, effortKey, step, WHY } from '../../api/_premium.js';
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('✓', name); };
const KEY = 'sk-or-v1-' + 'x'.repeat(40), NOW = Date.UTC(2026, 10, 8);
const ON = { SYNTHZ_PREMIUM:'1', SYNTHZ_PREMIUM_KEY:KEY, SYNTHZ_PREMIUM_MODEL:'deepseek/deepseek-chat', SYNTHZ_PLANS_ON:'1' };
const payer = { plan:'premium', planUntil:NOW + 864e5 };

ok('sin variables está apagado', () => { const c = config({}); assert.equal(c.on, false); assert.equal(c.plansOn, false); });
ok('falta una de las tres cosas → apagado', () => {
  assert.equal(config({ ...ON, SYNTHZ_PREMIUM:'0' }).on, false);
  assert.equal(config({ ...ON, SYNTHZ_PREMIUM_KEY:'' }).on, false);
  assert.equal(config({ ...ON, SYNTHZ_PREMIUM_MODEL:'' }).on, false);
});
ok('un modelo «:free» no puede ser el premium', () => assert.equal(config({ ...ON, SYNTHZ_PREMIUM_MODEL:'meta-llama/llama-3.3-70b-instruct:free' }).on, false));
ok('la llave nunca sale en la configuración', () => assert.ok(!JSON.stringify(config(ON)).includes(KEY)));
ok('con planes apagados nadie es premium', () => assert.equal(isPremium(payer, config({ ...ON, SYNTHZ_PLANS_ON:'0' }), NOW), false));
ok('plan vencido no es premium', () => assert.equal(isPremium({ plan:'premium', planUntil:NOW - 1 }, config(ON), NOW), false));
ok('plan vigente sí es premium', () => assert.equal(isPremium(payer, config(ON), NOW), true));

const c = config(ON);
ok('gratis en Auto gasta lo real', () => assert.equal(energy({ tokens:1000 }, c), 1000));
ok('premium gasta 4 veces más (por defecto)', () => assert.equal(energy({ tokens:1000, premium:true }, c), 4000));
ok('Profundo gasta el doble, Veloz menos, Creativo un poco más', () => {
  assert.equal(energy({ tokens:1000, effort:'deep' }, c), 2000);
  assert.equal(energy({ tokens:1000, effort:'fast' }, c), 750);
  assert.equal(energy({ tokens:1000, effort:'creative' }, c), 1250);
  assert.equal(energy({ tokens:1000, premium:true, effort:'deep' }, c), 8000);
});
ok('nombres viejos Bajo/Medio/Alto siguen sirviendo', () => { assert.equal(effortKey('low'), 'fast'); assert.equal(effortKey('high'), 'deep'); assert.equal(effortKey('medium'), 'auto'); assert.equal(effortKey('raro'), 'auto'); });
ok('siempre entero y al menos 1', () => { assert.equal(energy({ tokens:0 }, c), 1); assert.ok(Number.isInteger(energy({ tokens:333, effort:'fast' }, c))); });
ok('el multiplicador se puede ajustar', () => assert.equal(energy({ tokens:100, premium:true }, config({ ...ON, SYNTHZ_PREMIUM_MULT:'10' })), 1000));
ok('costo en dólares', () => assert.equal(usd({ inTok:1e6, outTok:1e6 }, c), 5));

ok('apagado → gratis', () => assert.deepEqual(decide({ me:payer }, config({}), NOW), { tier:'free', why:'apagado' }));
ok('sin plan → gratis', () => assert.equal(decide({ me:{ plan:'free' } }, c, NOW).why, 'sin_plan'));
ok('pagó y hay de todo → premium', () => assert.equal(decide({ me:payer }, c, NOW).tier, 'premium'));
ok('sin EnerX → no responde ninguna', () => assert.equal(decide({ me:payer, energyLeft:0 }, c, NOW).tier, 'none'));
ok('tope del día de Sammuel → pasa a gratis', () => assert.deepEqual(decide({ me:payer, usdToday:1 }, c, NOW), { tier:'free', why:'tope_dia' }));
ok('tope del mes de la persona → pasa a gratis', () => assert.equal(decide({ me:payer, usdUserMonth:2 }, c, NOW).why, 'tope_mes'));
ok('si elige una gratis, va gratis', () => assert.equal(decide({ me:payer, want:'free' }, c, NOW).tier, 'free'));
ok('cada aviso existe en ES y EN', () => { for (const w of ['apagado', 'sin_plan', 'sin_enerx', 'tope_dia', 'tope_mes']) assert.equal(WHY[w].length, 2); });
ok('el paso premium va a OpenRouter con el modelo elegido', () => assert.deepEqual(step(c), { id:'premium:deepseek/deepseek-chat', prov:'openrouter', mid:'deepseek/deepseek-chat', name:'deepseek-chat', premium:true }));
console.log('\n' + n + ' pruebas OK');
