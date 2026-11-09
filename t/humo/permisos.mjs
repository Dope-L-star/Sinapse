/* Prueba de Pulsem › Usuarios (v4.4: permisos y límites por persona), contra los api/trial.js, api/ai.js y api/alias.js reales y un redis-server de verdad (local).
   Revisa: solo el equipo ve las cuentas; solo Prime/ZFlow cambian; la cuenta de Prime solo la cambia Prime; los permisos y límites propios
   se aplican en el servidor; el regalo premium; suspender saca de todos los dispositivos. No sale a internet.
   Se corre desde la raíz del repo:  node t/humo/permisos.mjs   (necesita redis-server instalado) */
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let fails = 0;
const check = (name, cond, why) => { if (cond) console.log('OK    ' + name); else { fails++; console.log('FALLO ' + name + ' — ' + String(why || 'no se cumple').slice(0, 300)); } };

/* ---------- redis-server local y un puente con el REST de Upstash ---------- */
const PORT = 6390 + Math.floor(Math.random() * 400);
const srv = spawn('redis-server', ['--port', String(PORT), '--save', '', '--appendonly', 'no'], { stdio:'ignore' });
process.on('exit', () => srv.kill());
await new Promise(r => setTimeout(r, 400));
const sock = net.connect(PORT, '127.0.0.1'); let buf = Buffer.alloc(0); const waiting = [];
sock.on('data', d => { buf = Buffer.concat([buf, d]); for (;;){ const r = parseResp(buf, 0); if (!r) break; buf = buf.subarray(r[1]); waiting.shift()(r[0]); } });
function parseResp(b, i){
  if (i >= b.length) return null;
  const e = b.indexOf('\r\n', i); if (e < 0) return null;
  const t = String.fromCharCode(b[i]), line = b.toString('utf8', i + 1, e), nx = e + 2;
  if (t === '+') return [line, nx];
  if (t === '-') return [{ error:line }, nx];
  if (t === ':') return [+line, nx];
  if (t === '$'){ const n = +line; if (n < 0) return [null, nx]; if (b.length < nx + n + 2) return null; return [b.toString('utf8', nx, nx + n), nx + n + 2]; }
  if (t === '*'){ const n = +line; if (n < 0) return [null, nx]; const out = []; let j = nx; for (let k = 0; k < n; k++){ const r = parseResp(b, j); if (!r) return null; out.push(r[0]); j = r[1]; } return [out, j]; }
  return null;
}
const cmd = c => new Promise(ok => { waiting.push(ok); sock.write('*' + c.length + '\r\n' + c.map(x => { const s = String(x); return '$' + Buffer.byteLength(s) + '\r\n' + s + '\r\n'; }).join('')); });
await new Promise(r => sock.once('connect', r));
await cmd(['FLUSHALL']);

process.env.KV_REST_API_URL = 'http://redis.test'; process.env.KV_REST_API_TOKEN = 't';
for (const k of ['SYNTHZ_SETUP_CODE', 'SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) delete process.env[k];
globalThis.fetch = async (url, o = {}) => {
  const u = String(url);
  if (!u.startsWith('http://redis.test')) return new Response('{}', { status:404 });
  const b = JSON.parse(o.body || '[]');
  const wrap = r => r && r.error ? { error:r.error } : { result:r };
  const out = u.endsWith('/pipeline') ? await Promise.all(b.map(async c => wrap(await cmd(c)))) : wrap(await cmd(b));
  return new Response(JSON.stringify(out), { headers:{ 'content-type':'application/json' } });
};

const { sha } = await import(path.join(ROOT, 'api/_lib.js'));
const trial = (await import(path.join(ROOT, 'api/trial.js'))).default;
const ai = (await import(path.join(ROOT, 'api/ai.js'))).default;
const alias = (await import(path.join(ROOT, 'api/alias.js'))).default;
const { perksOf, enerOf } = await import(path.join(ROOT, 'api/_permisos.js'));
const { chat } = await import(path.join(ROOT, 'api/_pool.js'));
const { isPremium, config } = await import(path.join(ROOT, 'api/_premium.js'));

/* cuentas: Prime, ZFlow, Symmetrix y dos Synthers. Y un ux: viejo de octubre que NO debe revivir */
const people = { prime:['owner', 'sammuersynth'], zflow:['admin', 'sammueladmin'], sym:['staff', 'sammuerbusiness'], ana:[null, 'ana'], beto:[null, 'beto'] };
const tok = {};
for (const [k, [role, user]] of Object.entries(people)){
  const sub = 'p:' + k, t = 'tok_' + k + '_'.repeat(30); tok[k] = t;
  await cmd(['SET', 'u:' + sub, JSON.stringify(Object.assign({ sub, username:user, email:user + '@x.test', name:user, kind:'pass', created:Date.now(), seen:Date.now() }, role ? { role } : {}))]);
  await cmd(['SET', 'n:' + user, sub]); await cmd(['SET', 'e:' + user + '@x.test', sub]);
  await cmd(['SET', 's:' + sha(t), sub]); await cmd(['SADD', 'ss:' + sub, sha(t)]);
}
await cmd(['SET', 'ux:p:beto', JSON.stringify({ day:-1, f:{ alias:false } })]);
const call = async (h, who, p, method, body) => { const r = await h.fetch(new Request('https://synthz.test/api/' + p, { method, headers:{ 'content-type':'application/json', 'x-real-ip':'10.0.0.' + (1 + Math.floor(Math.random() * 200)), authorization:'Bearer ' + tok[who] }, body:body ? JSON.stringify(body) : undefined })); return { s:r.status, d:await r.json().catch(() => ({})) }; };
const T = (who, body) => call(trial, who, 'trial', 'POST', body);
const me = k => ({ sub:'p:' + k, role:people[k][0] || undefined });

/* ver */
let r = await T('ana', { action:'users' });
check('un Synther no ve las cuentas', r.s === 403, r.s);
r = await T('sym', { action:'users' });
check('Symmetrix ve la lista (sin poder cambiar)', r.s === 200 && r.d.users.length === 5 && r.d.canEdit === false, JSON.stringify(r.d).slice(0, 200));
r = await T('prime', { action:'users', q:'@ana' });
check('buscar por @usuario encuentra justo esa cuenta', r.s === 200 && r.d.users.length === 1 && r.d.users[0].handle === '@ana', JSON.stringify(r.d).slice(0, 200));
r = await T('prime', { action:'users', q:'bet' });
check('buscar por un pedazo del nombre también', r.s === 200 && r.d.users.length === 1 && r.d.users[0].handle === '@beto', JSON.stringify(r.d).slice(0, 200));
r = await T('prime', { action:'user', sub:'p:beto' });
check('lo viejo de octubre (ux:) no revive', r.s === 200 && r.d.now.f.alias === false && r.d.now.day === r.d.base.day && !r.d.user.own, JSON.stringify(r.d).slice(0, 300));
r = await T('prime', { action:'user', sub:'p:ana' });
check('la ficha trae lo de todos y lo que vale ahora (A.L.I.A.S. apagado para los Synthers, v4.5)', r.s === 200 && r.d.now.f.alias === false && r.d.now.f.premium === false && r.d.now.day === r.d.base.day && r.d.canEdit && r.d.canBlock, JSON.stringify(r.d).slice(0, 300));
r = await T('sym', { action:'user', sub:'p:ana' });
check('Symmetrix ve la ficha pero no puede editar', r.s === 200 && !r.d.canEdit && !r.d.canBlock, JSON.stringify(r.d).slice(0, 200));

/* cambiar */
r = await T('sym', { action:'uset', sub:'p:ana', perm:{ img:9 } });
check('Symmetrix no puede cambiar', r.s === 403, r.s);
r = await T('ana', { action:'uset', sub:'p:ana', perm:{ day:-1 } });
check('un Synther no se puede dar permisos a sí mismo', r.s === 403, r.s);
r = await T('zflow', { action:'uset', sub:'p:prime', perm:{ img:9 } });
check('ZFlow no cambia la cuenta de Prime', r.s === 403, r.s);
r = await T('prime', { action:'uset', sub:'p:ana', perm:{ day:50000, img:12, search:99999, smart:7, aliasX:3, credit:0.75, f:{ alias:false, image:false, search:false, review:false, smart:false, premium:true, nada:true }, note:'prueba' } });
check('Prime guarda permisos y límites (y recorta lo que se pasa)', r.s === 200 && r.d.own.day === 50000 && r.d.own.search === 2000 && r.d.own.f.premium === true && !('nada' in r.d.own.f) && r.d.now.f.alias === false && r.d.now.credit === 0.75 && r.d.user.own, JSON.stringify(r.d).slice(0, 300));
const pa = await perksOf(me('ana'));
check('el servidor ve lo de Ana', pa.day === 50000 && pa.img === 12 && pa.aliasX === 3 && pa.smart === 7 && pa.f.premium && !pa.f.alias, JSON.stringify(pa));
check('regalo premium: vale con la llave premium aunque los planes estén apagados', isPremium({ ux:pa }, config({ SYNTHZ_PREMIUM:'1', SYNTHZ_PREMIUM_KEY:'x'.repeat(30) })) === true && isPremium({ ux:pa }, config({})) === false);
r = await T('prime', { action:'users' });
check('el historial guarda quién cambió qué', r.s === 200 && r.d.log && r.d.log[0] && r.d.log[0].who === '@ana' && /Prime/.test(r.d.log[0].by), JSON.stringify(r.d.log).slice(0, 200));

/* se aplica en el servidor */
r = await call(alias, 'ana', 'alias', 'POST', { action:'plan', goal:'hola mundo', lang:'en' });
check('A.L.I.A.S. quitada: 403 con su texto en el idioma pedido', r.s === 403 && /in testing/.test(r.d.error || ''), r.s + ' ' + JSON.stringify(r.d));
r = await call(ai, 'ana', 'ai', 'POST', { action:'image', prompt:'un gato' });
check('imágenes quitadas: 403', r.s === 403 && /no está activado/.test(r.d.error || ''), r.s + ' ' + JSON.stringify(r.d));
r = await call(ai, 'ana', 'ai', 'POST', { action:'search', q:'clima' });
check('internet quitado: 403', r.s === 403 && /no está activado/.test(r.d.error || ''), r.s + ' ' + JSON.stringify(r.d));
r = await call(ai, 'ana', 'ai', 'POST', { action:'review', q:'2+2', draft:'La respuesta es 4, porque dos más dos son cuatro.' });
check('revisión quitada: entrega el borrador sin revisar', r.s === 200 && r.d.off === true, r.s + ' ' + JSON.stringify(r.d));
r = await call(ai, 'ana', 'ai', 'GET');
check('la página recibe su tope propio (50.000) y sus permisos', r.s === 200 && r.d.limit === 50000 && r.d.perks && r.d.perks.f.alias === false && r.d.img.max === 0, JSON.stringify(r.d).slice(0, 300));
r = await call(ai, 'beto', 'ai', 'POST', { action:'search', q:'' });
check('a Beto (sin cambios) internet le sigue funcionando', r.s === 400, r.s + ' ' + JSON.stringify(r.d));
/* v4.5 (Sammuel, 9 nov): A.L.I.A.S. solo para el equipo. Un Synther sin cambios no entra por ninguna acción; el equipo sí */
for (const action of ['plan', 'step', 'ajustar', 'feedback', 'rutas']){
  r = await call(alias, 'beto', 'alias', 'POST', { action, goal:'hola mundo', lang:'es' });
  check('A.L.I.A.S. cerrado para un Synther sin cambios (' + action + ')', r.s === 403 && /solo lo usa el equipo/.test(r.d.error || ''), r.s + ' ' + JSON.stringify(r.d));
}
r = await call(ai, 'beto', 'ai', 'GET');
check('la página de Beto sabe que no tiene A.L.I.A.S.', r.s === 200 && r.d.perks && r.d.perks.f.alias === false, JSON.stringify(r.d.perks));
r = await call(alias, 'zflow', 'alias', 'POST', { action:'rutas', lang:'es' });
check('el equipo (ZFlow) sí entra a A.L.I.A.S.', r.s === 200, r.s + ' ' + JSON.stringify(r.d).slice(0, 200));
r = await call(ai, 'sym', 'ai', 'GET');
check('la página de Symmetrix (equipo) ve A.L.I.A.S.', r.s === 200 && r.d.perks && r.d.perks.f.alias === true, JSON.stringify(r.d.perks));

/* EnerX propia en chat(): subir, bajar a cero y sin límite */
const d = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
await cmd(['SET', 'q:u:p:beto:' + d, '30000']);
const tryChat = async extra => { try{ await chat(Object.assign({ who:'u:p:beto', ipKey:'ip:x', messages:[{ role:'user', content:'hola' }] }, extra)); return null; }catch(e){ return e.code || e.message; } };
let e1 = await tryChat({});
check('con lo de todos (20.000), 30.000 usados ya es el tope', e1 === 'sz_limit', e1);
let e2 = await tryChat({ dayLimit:50000 });
check('con 50.000 propios sigue (falla después, por no tener IAs en la prueba)', e2 !== 'sz_limit' && e2 !== 'sz_limit_ip', e2);
let e3 = await tryChat({ who:'u:p:nuevo', dayLimit:0 });
check('con tope 0 no puede usar las IAs conectadas', e3 === 'sz_limit', e3);
await T('prime', { action:'uset', sub:'p:beto', perm:{ day:-1 } });
const pb = await perksOf(me('beto'));
check('«sin límite»: no gasta EnerX', enerOf(pb).free === true, JSON.stringify(pb));
r = await call(ai, 'beto', 'ai', 'GET');
check('y la página lo sabe (unl)', r.d.unl === true && r.d.used === 0, JSON.stringify(r.d).slice(0, 200));
const pz = await perksOf(me('zflow'));
check('el equipo sigue sin tope y con todo prendido', enerOf(pz).free === true && pz.f.alias && pz.f.premium, JSON.stringify(pz));
await T('prime', { action:'uset', sub:'p:zflow', perm:{ day:5000 } });
check('al equipo también se le puede poner un tope a mano', enerOf(await perksOf(me('zflow'))).dayLimit === 5000);
await T('prime', { action:'uset', sub:'p:zflow', perm:{} });

/* suspender */
r = await T('zflow', { action:'ublock', sub:'p:sym', on:true });
check('no se suspende a alguien del equipo', r.s === 403, r.s);
r = await T('zflow', { action:'ublock', sub:'p:beto', on:true });
check('ZFlow suspende a Beto', r.s === 200 && r.d.user.blocked, JSON.stringify(r.d).slice(0, 200));
r = await call(ai, 'beto', 'ai', 'GET');
check('Beto queda fuera de todos sus dispositivos (su sesión ya no existe)', (await cmd(['EXISTS', 's:' + sha(tok.beto)])) === 0, r.s);
r = await T('zflow', { action:'ublock', sub:'p:beto', on:false });
check('y se puede reactivar', r.s === 200 && !r.d.user.blocked, JSON.stringify(r.d).slice(0, 200));

/* volver a lo de todos */
r = await T('prime', { action:'uset', sub:'p:ana', perm:{} });
check('«Volver a lo de todos» borra lo propio', r.s === 200 && !r.d.user.own && (await cmd(['EXISTS', 'perm:p:ana'])) === 0, JSON.stringify(r.d).slice(0, 200));

console.log(fails ? '\n' + fails + ' prueba(s) fallaron.' : '\nTodo bien.');
sock.end(); srv.kill();
process.exit(fails ? 1 : 0);
