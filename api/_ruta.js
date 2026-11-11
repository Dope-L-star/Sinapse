/* v3.9 · Enrutador de A.L.I.A.S. (al estilo RouteLLM, pedido de Sammuel, 3 nov 2026).
   Para cada pedido:
   1) CLASIFICA qué tipo de trabajo es (código, escritura, razonamiento, resumen, traducción, datos o plan), sin gastar IA:
      palabras clave en español e inglés + la herramienta del paso.
   2) ELIGE entre las IAs gratis que están funcionando ahora (las caídas, pausadas o de pago ya no están en el catálogo de _pool.js)
      la que mejor resuelve ESE tipo de trabajo, mezclando:
        · lo que se sabe de cada modelo (tabla PERFIL, de 0 a 10 por tipo de trabajo),
        · lo que A.L.I.A.S. ha medido aquí mismo (cuántas veces salió bien, cuánto tardó y los 👍/👎 de las personas),
        · cuánta cuota gratis le queda hoy a ese proveedor (para no agotar uno solo) y lo rápido que es.
   3) Deja RESPALDOS de otros proveedores: si la primera falla o va lenta, responde la siguiente (eso lo hace chat() en _pool.js).
   4) MIDE: cada intento (salió bien o no, cuánto tardó) y cada 👍/👎 se guardan por tipo de trabajo y modelo; la próxima elección los usa.
   No guarda textos de nadie: solo contadores por modelo. */
import { pipe, redis, today } from './_lib.js';
import { PROV, ORDER, models } from './_pool.js';

export const CATS = ['code', 'write', 'reason', 'summary', 'translate', 'data', 'plan'];
const IDX = Object.fromEntries(CATS.map((c, i) => [c, i]));

/* ---------- 1) clasificar ---------- */
const RX = {
  code: /\b(c[oó]digo|code|program(a|ar|ming)?|funci[oó]n|function|script|python|javascript|typescript|\bjs\b|html|css|sql|json|api|regex|bug|depura|debug|clase|class|algoritmo|algorithm|compila|react|node|java\b|c\+\+|rust|golang|bash|terminal)\b/i,
  translate: /\b(traduc\w*|translat\w*|al (ingl[eé]s|espa[nñ]ol|franc[eé]s|portugu[eé]s|alem[aá]n)|(in|into|to) (english|spanish|french|portuguese|german))\b/i,
  summary: /\b(resum\w*|summar\w*|sintetiza\w*|s[ií]ntesis|puntos clave|key points|tl;?dr|en pocas palabras|brief(ly)?|overview)\b/i,
  data: /\b(tabla|table|csv|datos|data|estad[ií]stic\w*|statistic\w*|calcul\w*|porcentaje|percent\w*|promedio|average|presupuesto|budget|gr[aá]fic\w*|chart|n[uú]meros|numbers|matem\w*|math\w*|ecuaci[oó]n|equation|hoja de c[aá]lculo|spreadsheet)\b/i,
  reason: /\b(compar\w*|analiz\w*|analy[sz]\w*|por qu[eé]|why|decid\w*|decision|pros y contras|pros and cons|eval[uú]a\w*|evaluat\w*|razon\w*|reason\w*|l[oó]gic\w*|estrategia|strategy|recomienda\w*|recommend\w*|ventajas|advantages|riesgos|risks|diagn[oó]stic\w*|prioriza\w*|prioriti[sz]\w*)\b/i,
  write: /\b(escrib\w*|redact\w*|write|draft|correo|email|e-mail|carta|letter|ensayo|essay|art[ií]culo|article|post|historia|story|cuento|guion|script de video|poema|poem|discurso|speech|descripci[oó]n|description|presentaci[oó]n|diapositiv\w*|slides?|deck|blog|copy|anuncio|ad\b)\b/i,
};
/* tool: herramienta del paso (search, file, think…) · text: título + lo que hace el paso + objetivo */
export function classify(text, tool, isPlan){
  if (isPlan) return 'plan';
  const s = String(text || '');
  if (tool === 'search') return RX.translate.test(s) ? 'translate' : 'summary';   /* resumir lo encontrado con fuentes */
  const hits = {};
  for (const c of ['code', 'translate', 'summary', 'data', 'reason', 'write']){ const m = s.match(new RegExp(RX[c].source, 'gi')); hits[c] = m ? m.length : 0; }
  if (tool === 'file'){ if (hits.code) return 'code'; if (hits.data && !hits.write) return 'data'; return 'write'; }
  /* el más nombrado gana; en empate, este orden (lo más específico primero) */
  let best = 'reason', n = 0;
  for (const c of ['code', 'translate', 'data', 'summary', 'write', 'reason']) if (hits[c] > n){ best = c; n = hits[c]; }
  return best;
}

/* ---------- 2) lo que se sabe de cada modelo gratis ----------
   [patrón, [código, escritura, razonamiento, resumen, traducción, datos, plan], rapidez 1-10]
   Puntajes de partida (de pruebas públicas y de uso); lo medido aquí los va corrigiendo. */
const PERFIL = [
  /* v4.0 · «cerebro grande» (cat.smart): solo para preguntas difíciles en la Automática */
  [/gpt-oss-120b/,                                     [9, 7, 9, 8, 7, 9, 9], 7],
  [/kimi-k2/,                                          [9, 9, 8, 9, 9, 8, 9], 6],
  [/deepseek-r1(?!-0528-qwen3-8b)/,                    [8, 6, 9, 7, 7, 9, 8], 3],
  [/deepseek-(chat|v3)/,                               [9, 8, 8, 8, 8, 8, 8], 5],
  [/qwen3-coder/,                                      [9, 5, 7, 6, 6, 7, 7], 6],
  [/qwen3-235b|qwen3\.5/,                              [8, 8, 9, 8, 9, 9, 8], 5],
  [/qwen3-32b/,                                        [8, 6, 8, 7, 8, 8, 7], 7],
  [/glm-4\.[5-9]/,                                     [8, 7, 8, 8, 7, 8, 8], 5],
  [/mistral-large|mistral-medium/,                     [8, 9, 8, 9, 9, 8, 8], 5],
  [/magistral-medium/,                                 [7, 7, 9, 7, 8, 9, 8], 3],
  [/llama-4-maverick/,                                 [7, 8, 7, 8, 8, 7, 7], 7],
  [/gemini-(\d[\d.]*-)?flash-lite|flash-lite-latest/, [6, 7, 6, 8, 8, 6, 7], 9],
  [/gemini-(\d[\d.]*-)?flash|gemini-flash-latest/,     [8, 8, 8, 9, 9, 8, 9], 7],
  [/gemma-3-27b|gemma-3n?-?27/,                        [5, 7, 6, 7, 8, 5, 6], 6],
  [/gemma/,                                            [4, 6, 5, 6, 7, 4, 5], 7],
  [/gpt-oss-20b/,                                      [8, 6, 8, 7, 6, 8, 8], 9],
  [/llama-3\.3-70b/,                                   [7, 8, 7, 8, 7, 7, 8], 8],
  [/llama-4-scout|llama-4/,                            [7, 7, 7, 8, 8, 7, 7], 8],
  [/llama-3\.1-8b|llama-3\.2-3b|llama-3\.2-1b/,        [4, 5, 4, 6, 5, 4, 4], 10],
  [/mistral-small/,                                    [7, 8, 7, 8, 9, 7, 8], 7],
  [/open-mistral-nemo|mistral-nemo/,                   [5, 6, 5, 7, 8, 5, 6], 8],
  [/ministral-8b|ministral/,                           [5, 6, 5, 6, 7, 5, 5], 9],
  [/qwen3-8b/,                                         [7, 5, 6, 6, 7, 6, 6], 7],
  [/qwen2\.5-7b/,                                      [6, 5, 5, 6, 7, 6, 5], 8],
  [/glm-4-9b|glm-z1-9b/,                               [5, 5, 5, 6, 6, 5, 5], 7],
  [/deepseek-r1-0528-qwen3-8b/,                        [6, 4, 7, 5, 5, 6, 5], 4],
  [/hunyuan-mt/,                                       [2, 4, 2, 4, 9, 2, 1], 7],
];
const BASE = [5, 5, 5, 5, 5, 5, 5], BASE_SPEED = 6;
export function perfil(mid){
  const id = String(mid || '').toLowerCase();
  for (const [rx, q, sp] of PERFIL) if (rx.test(id)) return { q, sp };
  return { q:BASE, sp:BASE_SPEED };
}

/* ---------- 4) medir ----------
   rt:<tipo> (hash) · campos «<modelo>|ok», «|fail», «|ms» (suma de ms de los que salieron bien), «|up», «|down»
   rt:log (lista, últimas 500) · { t, cat, m, ok, ms, fb } para revisar a mano o desde Pulsem */
const hk = c => 'rt:' + c;
export async function record(cat, modelId, ok, ms){
  if (!IDX.hasOwnProperty(cat) || !modelId) return;
  const f = modelId + (ok ? '|ok' : '|fail');
  await pipe([['HINCRBY', hk(cat), f, '1'], ...(ok ? [['HINCRBY', hk(cat), modelId + '|ms', String(Math.max(0, Math.round(ms || 0)))]] : []),
    ['LPUSH', 'rt:log', JSON.stringify({ t:Date.now(), cat, m:modelId, ok:!!ok, ms:Math.round(ms || 0) })], ['LTRIM', 'rt:log', '0', '499'],
    ['HINCRBY', 'rt:dia:' + today(), ok ? 'ok' : 'fail', '1'], ['EXPIRE', 'rt:dia:' + today(), '2592000']]).catch(() => {});
}
export async function feedback(cat, modelId, up){
  if (!IDX.hasOwnProperty(cat) || !modelId) return;
  await pipe([['HINCRBY', hk(cat), modelId + (up ? '|up' : '|down'), '1'],
    ['LPUSH', 'rt:log', JSON.stringify({ t:Date.now(), cat, m:modelId, fb:up ? 1 : -1 })], ['LTRIM', 'rt:log', '0', '499']]).catch(() => {});
}
/* v4.0 · el chat también aprende, pero gastando poco Redis (techo de Upstash): solo los dos contadores, sin el registro */
export async function recordLite(cat, modelId, ok, ms){
  if (!IDX.hasOwnProperty(cat) || !modelId) return;
  await pipe([['HINCRBY', hk(cat), modelId + (ok ? '|ok' : '|fail'), '1'], ...(ok ? [['HINCRBY', hk(cat), modelId + '|ms', String(Math.max(0, Math.round(ms || 0)))]] : [])]).catch(() => {});
}
/* lo medido y la carga de hoy se guardan 60 s en cada servidor: elegir IA no cuesta lecturas de Redis en cada mensaje */
const MEMO = new Map();
const memo = (k, fn) => { const c = MEMO.get(k); if (c && Date.now() - c.t < 60e3) return c.p; const p = fn(); MEMO.set(k, { t:Date.now(), p }); p.catch(() => MEMO.delete(k)); return p; };
const statsOf = cat => memo('s:' + cat, () => statsOf0(cat));
async function statsOf0(cat){
  const raw = (await redis('HGETALL', hk(cat)).catch(() => [])) || [], S = {};
  for (let i = 0; i < raw.length; i += 2){ const [m, k] = String(raw[i]).split('|'); (S[m] = S[m] || { ok:0, fail:0, ms:0, up:0, down:0 })[k] = +raw[i + 1] || 0; }
  return S;
}
/* cuánto de su cuota gratis de hoy ya usó cada proveedor (0 = nada, 1 = lleno) */
const loadOf = () => memo('load', loadOf0);
async function loadOf0(){
  const d = today(), all = await pipe(ORDER.map(p => ['GET', 'rt:ld:' + p + ':' + d])).catch(() => []);
  return Object.fromEntries(ORDER.map((p, i) => [p, Math.min(1, (+all[i] || 0) / Math.max(1, PROV[p].cap))]));
}
export async function used(prov){ const k = 'rt:ld:' + prov + ':' + today(); await pipe([['INCR', k], ['EXPIRE', k, '172800']]).catch(() => {}); }

/* ---------- 2) puntaje de un modelo para un tipo de trabajo ---------- */
const K = 4;   /* cuántas pruebas «vale» lo que se sabe de antemano antes de confiar en lo medido */
/* v4.5 · respuestas LARGAS (una página, un archivo entero): cuentan más los proveedores que dejan escribir mucho y menos los de tope corto
   (Groq corta a 6.000 con su razonamiento incluido y Cloudflare a 3.500: el archivo queda a medias) */
const LONG_BONUS = { google:2, mistral:1, openrouter:.5, ollama:0, groq:-1, siliconflow:-2, cloudflare:-3 };
export function score(m, cat, S, load, long){
  const { q, sp } = perfil(m.mid), prior = q[IDX[cat]];
  const s = S[m.id] || { ok:0, fail:0, ms:0, up:0, down:0 }, n = s.ok + s.fail;
  const rate = (s.ok + 0.8 * K) / (n + K);                                    /* % de veces que salió bien (empieza en 80 %) */
  const fb = (s.up - s.down) / (s.up + s.down + 3);                           /* 👍/👎 de las personas, de -1 a 1 */
  const avg = s.ok ? s.ms / s.ok : 0;
  const speed = s.ok >= 3 ? Math.max(1, 10 - avg / 2500) : sp;                /* rapidez medida (o la conocida) */
  const total = prior + rate * 4 + fb * 2 + speed * 0.3 - (load[m.prov] || 0) * 2.5 + (long ? LONG_BONUS[m.prov] || 0 : 0);
  return { total, prior, rate, fb, n, avg, speed };
}

/* elige: la mejor para este tipo de trabajo + respaldos de OTROS proveedores (así una caída no tumba los dos intentos) */
export async function pick(cat, n = 4, o = {}){
  if (!IDX.hasOwnProperty(cat)) cat = 'reason';
  const [cat2, S, load] = await Promise.all([models(false), statsOf(cat), loadOf()]);
  const ranked = cat2.list.map(m => Object.assign({ m }, score(m, cat, S, load, o.long))).sort((a, b) => b.total - a.total);
  const out = [], provs = new Set();
  for (const r of ranked){ if (out.length >= n) break; if (provs.has(r.m.prov)) continue; out.push(r); provs.add(r.m.prov); }
  for (const r of ranked){ if (out.length >= n) break; if (!out.includes(r)) out.push(r); }
  return out;
}

/* v4.0 · para una pregunta difícil: los modelos grandes gratis (cat.smart) ordenados por lo que saben hacer en ESE trabajo y lo medido,
   seguidos de los normales (pick). Uno por proveedor primero, para que una caída no tumbe dos intentos. */
export async function pickHard(cat, n = 4, o = {}){
  if (!IDX.hasOwnProperty(cat)) cat = 'reason';
  const [cat2, S, load] = await Promise.all([models(false), statsOf(cat), loadOf()]);
  /* en lo difícil pesa más lo que sabe (×1.5) que lo rápido; los grandes llevan un punto extra */
  const sc = (m, big) => { const x = score(m, cat, S, load, o.long); return Object.assign({ m }, x, { total:x.total + x.prior * .5 + (big ? 1 : 0) - x.speed * .3 }); };
  const ranked = [...(cat2.smart || []).map(m => sc(m, true)), ...cat2.list.map(m => sc(m, false))].sort((a, b) => b.total - a.total);
  const out = [], provs = new Set();
  for (const r of ranked){ if (out.length >= n) break; if (provs.has(r.m.prov)) continue; out.push(r); provs.add(r.m.prov); }
  for (const r of ranked){ if (out.length >= n) break; if (!out.includes(r)) out.push(r); }
  return out;
}

/* por qué ganó (para decírselo a la persona sin tecnicismos): lo que más pesó */
export function why(r, ranked){
  if (!r) return 'quality';
  if (r.n >= 5 && r.rate >= 0.85 && r.fb >= 0) return 'learned';            /* aquí le ha ido bien una y otra vez */
  const second = ranked && ranked.find(x => x !== r);
  if (second && r.prior < second.prior && r.speed > second.speed) return 'fast';
  return 'quality';
}

/* lo aprendido, para mostrarlo: por tipo de trabajo, las 3 mejores con su % de éxito, tiempo y votos */
export async function learned(){
  const cat = await models(false), byId = Object.fromEntries(cat.list.map(m => [m.id, m]));
  const out = {};
  for (const c of CATS){
    const S = await statsOf0(c);
    out[c] = Object.entries(S).map(([id, s]) => ({ id, name:(byId[id] && byId[id].name) || id.split(':').pop(), prov:byId[id] ? PROV[byId[id].prov].name : '', n:s.ok + s.fail, ok:s.ok, rate:s.ok + s.fail ? s.ok / (s.ok + s.fail) : 0, ms:s.ok ? Math.round(s.ms / s.ok) : 0, up:s.up, down:s.down, live:!!byId[id] }))
      .filter(x => x.n || x.up || x.down).sort((a, b) => (b.live - a.live) || (b.rate * Math.log(2 + b.n)) - (a.rate * Math.log(2 + a.n))).slice(0, 3);
  }
  const d = (await redis('HGETALL', 'rt:dia:' + today()).catch(() => [])) || [], day = {};
  for (let i = 0; i < d.length; i += 2) day[d[i]] = +d[i + 1] || 0;
  return { cats:out, today:{ ok:day.ok || 0, fail:day.fail || 0 } };
}
