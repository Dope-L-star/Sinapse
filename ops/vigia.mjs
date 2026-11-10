/* Fase 4 · vigía: revisa que SymphorIA responda (la usa .github/workflows/vigia.yml cada 30 min).
   Uso: node ops/vigia.mjs https://sinapse.pages.dev   → sale con error si algo falla o va muy lento. */
const base = (process.argv[2] || 'https://sinapse.pages.dev').replace(/\/$/, '');
const PRUEBAS = [
  ['Portada', '/', r => r.status === 200, 4000],
  ['SynthFlow', '/chat', r => r.status === 200, 4000],
  ['Servidor: configuración', '/api/config', (r, j) => r.status === 200 && j && j.ok === true, 5000],
  ['Servidor: salud', '/api/health', (r, j) => r.status === 200 && j && Array.isArray(j.bad), 5000],
];
let malas = 0;
for (const [nombre, ruta, ok, maxMs] of PRUEBAS) {
  const t0 = Date.now(); let linea;
  try {
    const r = await fetch(base + ruta, { headers: { 'user-agent': 'SymphorIA-vigia' }, signal: AbortSignal.timeout(15000) });
    const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch (e) {}
    const ms = Date.now() - t0, bien = ok(r, j);
    if (!bien || ms > maxMs) malas++;
    linea = (bien ? (ms > maxMs ? 'LENTO ' : 'OK    ') : 'FALLA ') + nombre + ' · ' + r.status + ' · ' + ms + ' ms' + (!bien && j && j.error ? ' · ' + String(j.error).slice(0, 120) : '');
  } catch (e) { malas++; linea = 'FALLA ' + nombre + ' · no respondió (' + (e.name === 'TimeoutError' ? 'más de 15 s' : e.message) + ')'; }
  console.log(linea);
}
process.exit(malas ? 1 : 0);
