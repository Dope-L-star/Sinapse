/* Fase 4 · respaldo de la base de datos (Redis de Upstash), gratis, con GitHub Actions (.github/workflows/respaldo.yml).
   Guarda solo lo que dura para siempre (llaves SIN fecha de vencimiento: cuentas, perfiles, chats guardados, ajustes del equipo).
   Lo que vence solo (sesiones de un rato, límites por minuto, quién está en línea…) no se respalda: se rehace solo.
   El archivo sale CIFRADO (AES-256-GCM) con la clave RESPALDO_CLAVE: sin ella nadie puede leerlo, ni siquiera en GitHub.

   Respaldar:   KV_REST_API_URL=… KV_REST_API_TOKEN=… RESPALDO_CLAVE=… node ops/respaldo-redis.mjs respaldar respaldo.enc
   Ver qué hay: RESPALDO_CLAVE=… node ops/respaldo-redis.mjs ver respaldo.enc
   Restaurar:   KV_REST_API_URL=… KV_REST_API_TOKEN=… RESPALDO_CLAVE=… node ops/respaldo-redis.mjs restaurar respaldo.enc --si
                (solo escribe llaves que NO existan; nunca borra ni pisa lo que ya está)
   Costo en Upstash: ~3 comandos por llave guardada + 1 por cada 500 llaves revisadas. Por eso corre una vez por semana. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const [, , accion, archivo = 'respaldo.enc'] = process.argv;
const URL_ = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const CLAVE = process.env.RESPALDO_CLAVE || '';
if (CLAVE.length < 16) { console.log('Falta RESPALDO_CLAVE (16 caracteres o más). No se hace nada.'); process.exit(accion === 'respaldar' ? 0 : 1); }

let gastados = 0;
async function pipe(cmds) {
  if (!cmds.length) return [];
  gastados += cmds.length;
  const r = await fetch(URL_ + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOK, 'content-type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('Upstash respondió ' + r.status);
  const d = await r.json();
  return d.map(x => { if (x.error) throw new Error('Redis: ' + x.error); return x.result; });
}
const cifrar = buf => {
  const sal = crypto.randomBytes(16), iv = crypto.randomBytes(12), k = crypto.scryptSync(CLAVE, sal, 32);
  const c = crypto.createCipheriv('aes-256-gcm', k, iv), datos = Buffer.concat([c.update(zlib.gzipSync(buf)), c.final()]);
  return Buffer.concat([Buffer.from('SZR1'), sal, iv, c.getAuthTag(), datos]);
};
const descifrar = buf => {
  if (buf.subarray(0, 4).toString() !== 'SZR1') throw new Error('No es un respaldo de SymphorIA.');
  const sal = buf.subarray(4, 20), iv = buf.subarray(20, 32), tag = buf.subarray(32, 48), k = crypto.scryptSync(CLAVE, sal, 32);
  const d = crypto.createDecipheriv('aes-256-gcm', k, iv); d.setAuthTag(tag);
  return JSON.parse(zlib.gunzipSync(Buffer.concat([d.update(buf.subarray(48)), d.final()])));
};

async function respaldar() {
  if (!URL_ || !TOK) { console.log('Faltan KV_REST_API_URL y KV_REST_API_TOKEN en los secretos del repositorio. No se hace nada.'); return; }
  let cursor = '0'; const llaves = [];
  do { const [[c, ks]] = await pipe([['SCAN', cursor, 'COUNT', '500']]); cursor = String(c); llaves.push(...ks); } while (cursor !== '0');
  const filas = [];
  for (let i = 0; i < llaves.length; i += 200) {
    const parte = llaves.slice(i, i + 200);
    const info = await pipe(parte.flatMap(k => [['TTL', k], ['TYPE', k]]));
    const duran = parte.map((k, j) => ({ k, ttl: +info[2 * j], tipo: info[2 * j + 1] })).filter(x => x.ttl === -1);
    const leer = { string: k => ['GET', k], hash: k => ['HGETALL', k], set: k => ['SMEMBERS', k], list: k => ['LRANGE', k, '0', '-1'], zset: k => ['ZRANGE', k, '0', '-1', 'WITHSCORES'] };
    const ok = duran.filter(x => leer[x.tipo]);
    const vals = await pipe(ok.map(x => leer[x.tipo](x.k)));
    ok.forEach((x, j) => filas.push([x.k, x.tipo, vals[j]]));
  }
  fs.writeFileSync(archivo, cifrar(Buffer.from(JSON.stringify({ v: 1, t: new Date().toISOString(), filas }))));
  console.log('Respaldo listo: ' + filas.length + ' llaves guardadas de ' + llaves.length + ' revisadas · ' + gastados + ' comandos de Upstash · ' + Math.round(fs.statSync(archivo).size / 1024) + ' KB cifrados');
}

async function restaurar() {
  const r = descifrar(fs.readFileSync(archivo));
  if (!process.argv.includes('--si')) { console.log('Esto escribiría ' + r.filas.length + ' llaves del ' + r.t + ' (solo las que falten). Agrega --si para hacerlo.'); return; }
  let puestas = 0;
  for (let i = 0; i < r.filas.length; i += 100) {
    const parte = r.filas.slice(i, i + 100);
    const existe = await pipe(parte.map(([k]) => ['EXISTS', k]));
    const cmds = [];
    parte.forEach(([k, tipo, v], j) => {
      if (+existe[j]) return; puestas++;
      if (tipo === 'string') cmds.push(['SET', k, v]);
      else if (tipo === 'hash' && v.length) cmds.push(['HSET', k, ...v]);
      else if (tipo === 'set' && v.length) cmds.push(['SADD', k, ...v]);
      else if (tipo === 'list' && v.length) cmds.push(['RPUSH', k, ...v]);
      else if (tipo === 'zset' && v.length) { const a = []; for (let n = 0; n < v.length; n += 2) a.push(v[n + 1], v[n]); cmds.push(['ZADD', k, ...a]); }
    });
    await pipe(cmds);
  }
  console.log('Restaurado: ' + puestas + ' llaves nuevas (las que ya existían no se tocaron).');
}

if (accion === 'respaldar') await respaldar();
else if (accion === 'restaurar') await restaurar();
else if (accion === 'ver') { const r = descifrar(fs.readFileSync(archivo)); const p = {}; for (const [k] of r.filas) { const x = k.split(':')[0]; p[x] = (p[x] || 0) + 1; } console.log('Respaldo del ' + r.t + ': ' + r.filas.length + ' llaves', p); }
else console.log('Uso: node ops/respaldo-redis.mjs respaldar|ver|restaurar archivo.enc');
