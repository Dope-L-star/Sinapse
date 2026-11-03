/* Fase 4 · Upstash «de mentira» para pruebas: habla la misma API REST que Upstash (POST / y POST /pipeline)
   y por dentro usa un redis-server local. Cuenta cada comando, para saber cuántos gasta cada llamada.
   Uso: redis-server --port 6390 --save '' &  luego  node t/carga/upstash-local.mjs 8790 6390 */
import http from 'node:http';
import net from 'node:net';

/* cliente RESP mínimo: una conexión, respuestas en orden */
export function clienteRedis(puerto = 6390) {
  const sock = net.connect(puerto, '127.0.0.1');
  let buf = Buffer.alloc(0); const cola = [];
  const leer = (b, i) => {
    const fin = b.indexOf('\r\n', i); if (fin < 0) return null;
    const t = String.fromCharCode(b[i]), linea = b.toString('utf8', i + 1, fin), sig = fin + 2;
    if (t === '+') return [linea, sig];
    if (t === '-') return [{ error: linea }, sig];
    if (t === ':') return [Number(linea), sig];
    if (t === '$') { const n = Number(linea); if (n < 0) return [null, sig]; if (b.length < sig + n + 2) return null; return [b.toString('utf8', sig, sig + n), sig + n + 2]; }
    if (t === '*') { const n = Number(linea); if (n < 0) return [null, sig]; const arr = []; let p = sig; for (let k = 0; k < n; k++) { const r = leer(b, p); if (!r) return null; arr.push(r[0]); p = r[1]; } return [arr, p]; }
    throw new Error('RESP raro: ' + t);
  };
  sock.on('data', d => {
    buf = Buffer.concat([buf, d]);
    for (;;) { const r = leer(buf, 0); if (!r) break; buf = buf.subarray(r[1]); cola.shift()(r[0]); }
  });
  return cmd => new Promise(ok => {
    cola.push(ok);
    sock.write('*' + cmd.length + '\r\n' + cmd.map(x => { const s = String(x); return '$' + Buffer.byteLength(s) + '\r\n' + s + '\r\n'; }).join(''));
  });
}

export const cuenta = { comandos: 0, llamadas: 0 };

export function servidor(puertoHttp = 8790, puertoRedis = 6390) {
  const r = clienteRedis(puertoRedis);
  const uno = async c => { cuenta.comandos++; const v = await r(c); return v && v.error ? { error: v.error } : { result: v }; };
  return http.createServer(async (q, s) => {
    let cuerpo = ''; for await (const p of q) cuerpo += p;
    cuenta.llamadas++;
    const datos = JSON.parse(cuerpo || '[]');
    const out = q.url.startsWith('/pipeline') ? await Promise.all(datos.map(uno)) : await uno(datos);
    s.writeHead(200, { 'content-type': 'application/json' }); s.end(JSON.stringify(out));
  }).listen(puertoHttp);
}

if (import.meta.url === 'file://' + process.argv[1]) {
  servidor(+process.argv[2] || 8790, +process.argv[3] || 6390);
  console.log('Upstash local en http://127.0.0.1:' + (+process.argv[2] || 8790));
}
