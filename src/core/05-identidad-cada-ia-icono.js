/* =====================================================================
   Identidad de cada IA: su icono real (vidrio líquido) y sus colores en el chat
   ===================================================================== */
const BRANDS = {
  openai:['openai', 'OpenAI', '#10a37f', '#7fe0c4'], anthropic:['claude-color', 'Claude (Anthropic)', '#d97757', '#f4b48f'], google:['gemini-color', 'Google Gemini', '#4c8df6', '#b39cff'],
  gemma:['gemma-color', 'Google Gemma', '#4c8df6', '#7fd6f0'], 'meta-llama':['meta-color', 'Meta Llama', '#0866ff', '#7fb0ff'], mistralai:['mistral-color', 'Mistral', '#fa520f', '#ffc06b'],
  deepseek:['deepseek-color', 'DeepSeek', '#4d6bfe', '#93a6ff'], qwen:['qwen-color', 'Qwen', '#6c5cf0', '#b5aaff'], 'x-ai':['grok', 'xAI Grok', '#d9d9de', '#8e8e96'],
  moonshotai:['kimi-color', 'Kimi (Moonshot)', '#1d7bff', '#8fc0ff'], nvidia:['nvidia-color', 'NVIDIA', '#76b900', '#c3f06b'], microsoft:['microsoft-color', 'Microsoft', '#22a6f0', '#ffb900'],
  'z-ai':['zhipu-color', 'Z.ai (GLM)', '#3859ff', '#8aa0ff'], ai21:['ai21', 'AI21', '#f3a6c8', '#ffd1e4'], cohere:['cohere-color', 'Cohere', '#d18ee2', '#ff9d7a'], nousresearch:['nousresearch', 'Nous', '#c9c9cf', '#8e8e96'],
  ibm:['ibm', 'IBM Granite', '#4589ff', '#a6c8ff'], minimax:['minimax-color', 'MiniMax', '#f23f5d', '#ff9e7a'], inception:['inception', 'Inception', '#a3a3ff', '#d6d6ff'], liquid:['liquid', 'Liquid', '#5b8cff', '#9fd0ff'],
  baidu:['baidu-color', 'Baidu', '#2932e1', '#7a82ff'], tencent:['tencent-color', 'Tencent', '#0052d9', '#6fa0ff'], bytedance:['bytedance-color', 'ByteDance', '#3c8cff', '#00c8d2'], 'stepfun-ai':['stepfun-color', 'StepFun', '#22c1c3', '#8ff0e6'],
  perplexity:['perplexity-color', 'Perplexity', '#20b8cd', '#9ff0f6'], allenai:['ai2-color', 'Ai2', '#f0529c', '#ff9fc8'], groq:['groq', 'Groq', '#f55036', '#ffb36b'], cloudflare:['cloudflare-color', 'Cloudflare', '#f6821f', '#ffc46b'],
  openrouter:['openrouter', 'OpenRouter', '#6467f2', '#a5a7ff'], synthz:['', 'Sinapse', '#7b3ff2', '#ff3d9a'], puter:['', 'Puter', '#3b82f6', '#6fd3d6']
};
const BALIAS = { meta:'meta-llama', llama:'meta-llama', mistral:'mistralai', claude:'anthropic', xai:'x-ai', grok:'x-ai', moonshot:'moonshotai', kimi:'moonshotai', zhipu:'z-ai', thudm:'z-ai', glm:'z-ai', stepfun:'stepfun-ai', ai2:'allenai', gemini:'google', 'openai-completion':'openai', 'ibm-granite':'ibm', 'nous':'nousresearch' };
function brandOf(m){
  if (!m) return BRANDS.synthz;
  const id = String(m.id || ''), v = String(m.vendor || '').toLowerCase().replace(/-completion$/, '');
  if (id === 'sz:auto' || v === 'synthz') return BRANDS.synthz;
  let k = BALIAS[v] || v;
  if (k === 'google' && /gemma/i.test(id)) k = 'gemma';
  if (!BRANDS[k]){ const g = Object.keys(BRANDS).find(b => new RegExp(b.replace(/-.*/, ''), 'i').test(id.split(':').pop())) || Object.keys(BALIAS).find(a => new RegExp('\\b' + a, 'i').test(id)); k = BRANDS[g] ? g : BALIAS[g] || ''; }
  return BRANDS[k] || null;
}
const ZMINI = '<img class="zmini" src="media/v30/symphoria.svg" alt="" draggable="false">';   /* v2.5 · la Z de vidrio del boceto */
/* icono de vidrio líquido: baldosa translúcida con brillo especular y el logo real adentro */
function glassIcon(m, cls){
  const b = brandOf(m), c1 = b ? b[2] : vendorColor(m && m.vendor), c2 = b ? b[3] : '#ffffff';
  const inner = b && b[0] ? '<img src="ico/' + b[0] + '.svg" alt="" loading="lazy" decoding="async" onerror="this.replaceWith(document.createTextNode(\'' + esc(((m && (m.vlabel || m.name)) || '?').charAt(0).toUpperCase()).replace(/'/g, '') + '\'))">'
    : b === BRANDS.synthz ? ZMINI : b === BRANDS.puter ? '<img src="' + PUTER_LOGO + '" alt="" referrerpolicy="no-referrer" loading="lazy">' : '<b>' + esc(((m && (m.vlabel || m.name)) || '?').charAt(0).toUpperCase()) + '</b>';
  return '<span class="gico' + (cls ? ' ' + cls : '') + '" style="--b1:' + c1 + ';--b2:' + c2 + '" title="' + esc(b ? b[1] : (m && m.vlabel) || '') + '">' + inner + '</span>';
}

/* =====================================================================
   Carga de las IA: un cuadradito de 8×8 píxeles de vidrio que va armando 16 dibujos
   mientras la IA trabaja, y al lado lo que está haciendo (con flechita para ver el detalle)
   ===================================================================== */
/* v3.1 · dibujos nuevos (Sammuel, 28 oct): más variados y livianos, de contorno, sin llenar todo el cuadro */
const PIXART = [
  ['Invasor', '........|..1..1..|.111111.|11211211|11111111|.1.11.1.|1......1|........'],
  ['Corazón', '........|.11..11.|1..11..1|12.....1|.1....1.|..1..1..|...11...|........'],
  ['Destello', '...1....|...1....|..121...|1112111.|..121...|...1....|...1...2|......2.'],
  ['Nota', '....111.|....1.11|....1...|....1...|..111...|.1221...|..11....|........'],
  ['Luna', '...111..|..11...2|.11.....|.11...2.|.11.....|..11....|...111..|........'],
  ['Flor', '..1.1...|.12121..|..1.1...|...2....|...2.1..|.1.22...|..12....|...2....'],
  ['Llave', '.111....|1...1...|1...1...|.111....|...2....|...22...|...2....|...22...'],
  ['Hongo', '..1111..|.1.22.1.|1.2..2.1|11111111|..1..1..|..1..1..|..1111..|........'],
  ['Poción', '...22...|...11...|..1..1..|.1....1.|1.2222.1|1.2222.1|.1....1.|..1111..'],
  ['Sona', '....2...|....1...|.111111.|1......1|1.2..2.1|1......1|.111111.|........'],
  ['Cohete', '...11...|..1..1..|..1.21..|..1..1..|.11..11.|1.1..1.1|..2..2..|...22...'],
  ['Gatito', '1.....1.|11...11.|1.111.1.|1.....1.|1.2.2.1.|1..1..1.|.11111..|........'],
  ['Diamante', '........|..1111..|.1.22.1.|11111111|.1....1.|..1..1..|...11...|........'],
  ['Planeta', '........|........|...111..|..1...1.|22222222|..1...1.|...111..|........'],
  ['Sonrisa', '..1111..|.1....1.|1.2..2.1|1......1|1.1..1.1|1..11..1|.1....1.|..1111..'],
  ['Café', '..2.2...|...2.2..|.11111..|.1...111|.1...1.1|.1...111|..111...|........']
].map(([n, s]) => [n, s.split('|').join('').replace(/ /g, '.')]);
const WORDS = ['Leyendo tu mensaje', 'Pensando', 'Sopesando ideas', 'Aclarando', 'Ordenando las ideas', 'Buscando las palabras', 'Revisando', 'Casi listo'];
/* v4.5 · las frases de «qué está haciendo la IA» ya no salen siempre en el mismo orden: son al azar, distintas cada vez, y a veces llevan tu nombre
   (como en Claude). Salen de next/componentes/entrada/frases.js (window.SZFrases, ES/EN); si no está, quedan las de siempre. */
const FR = (ctx, otra) => { try{ const f = window.SZFrases && window.SZFrases.frase(ctx, LANG === 'en' ? 'en' : 'es'); if (f) return f; }catch(e){} return otra; };
const pixelGrid = () => '<span class="pxg" aria-hidden="true">' + '<i></i>'.repeat(64) + '</span>';
/* motor del dibujo: se enciende píxel a píxel; al completarse brilla, se deshace y empieza otro */
function pixelRun(host, startAt){
  const cells = [...host.querySelectorAll('.pxg i')]; if (!cells.length) return { stop(){}, speed(){} };
  let art = (startAt == null ? Math.floor(Math.random() * PIXART.length) : startAt) % PIXART.length, order = [], k = 0, hold = 0, fast = 1, stopped = false, t = 0;
  const load = () => { const s = PIXART[art][1]; order = []; for (let i = 0; i < 64; i++) if (s[i] !== '.') order.push(i); order.sort(() => Math.random() - .5); k = 0; host.dataset.art = PIXART[art][0]; cells.forEach(c => { c.className = ''; }); };
  load();
  const tick = () => {
    if (stopped) return;
    if (hold > 0){ hold--; if (!hold){ cells.forEach(c => { if (c.className) c.className += ' out'; }); setTimeout(() => { art = (art + 1) % PIXART.length; load(); }, 260); } }
    else if (k < order.length){ for (let n = 0; n < fast && k < order.length; n++, k++){ const i = order[k]; cells[i].className = 'on c' + PIXART[art][1][i]; } if (k >= order.length){ hold = 7; host.classList.remove('done'); void host.offsetWidth; host.classList.add('done'); } }
    t = setTimeout(tick, 70);
  };
  t = setTimeout(tick, 60);
  return { stop(){ stopped = true; clearTimeout(t); }, speed(n){ fast = Math.max(1, Math.min(4, n | 0)); }, get art(){ return art; } };
}
/* «qué está haciendo la IA»: frases que cambian, segundos, palabras y el detalle real (si la IA lo comparte) */
function workView(o = {}){
  const el = document.createElement('div'); el.className = 'work';
  el.innerHTML = '<button type="button" class="wk-row" aria-expanded="false"><span class="pxw">' + pixelGrid() + '</span><span class="wk-t"><b class="wk-w">Leyendo tu mensaje</b><small class="wk-s"></small></span><svg class="wk-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button><div class="wk-d" hidden><ol class="wk-steps"></ol><div class="wk-r" hidden><b>Lo que pensó la IA</b><p></p></div></div>';
  const S = { t0:performance.now(), phase:'read', words:0, reason:'', steps:[], wi:0, done:false, n:-1 };
  const px = pixelRun($('.pxw', el), o.art);
  const w = $('.wk-w', el), sm = $('.wk-s', el), row = $('.wk-row', el), det = $('.wk-d', el);
  w.textContent = FR('leyendo', w.textContent);
  const secs = () => ((performance.now() - S.t0) / 1000).toFixed(1).replace('.', ',') + ' s';
  const step = txt => { S.steps.push([performance.now() - S.t0, txt]); if (!det.hidden) paintSteps(); };
  const paintSteps = () => { $('.wk-steps', el).innerHTML = S.steps.map(([ms, x]) => '<li><em>' + (ms / 1000).toFixed(1).replace('.', ',') + ' s</em>' + esc(x) + '</li>').join(''); const r = $('.wk-r', el); r.hidden = !S.reason; if (S.reason) $('p', r).textContent = S.reason.slice(-4000); };
  const setW = (txt) => { if (w.textContent === txt) return; w.classList.remove('sw'); void w.offsetWidth; w.textContent = txt; w.classList.add('sw'); };
  let iv = setInterval(() => {
    if (S.done) return;
    if (S.phase === 'read' && performance.now() - S.t0 > 700){ S.phase = 'think'; step('Leyó tu mensaje'); }
    if (S.phase === 'think'){ const n = Math.floor((performance.now() - S.t0 - 700) / 1700); if (n !== S.n){ S.n = n; setW(FR('pensando', WORDS[1 + (n % (WORDS.length - 1))])); } }
    else if (S.phase === 'reason'){ const n = Math.floor((performance.now() - S.t0) / 2400); if (n !== S.n){ S.n = n; setW(FR('razonando', 'Razonando')); } }
    sm.textContent = S.phase === 'write' ? secs() + ' · ' + fmt(S.words) + (S.words === 1 ? ' palabra' : ' palabras') : S.phase === 'reason' ? secs() + ' · pensando antes de responder' : secs();
  }, 250);
  row.addEventListener('click', () => { const on = det.hidden; det.hidden = !on; row.setAttribute('aria-expanded', String(on)); el.classList.toggle('open', on); if (on) paintSteps(); });
  if (o.model) step('Eligió ' + o.model);
  return {
    el, state:S,
    reason(txt){ if (S.done) return; if (!S.reason) step('Empezó a razonar'); S.reason = txt; if (S.phase !== 'write' && S.phase !== 'reason'){ S.phase = 'reason'; S.n = Math.floor((performance.now() - S.t0) / 2400); setW(FR('razonando', 'Razonando')); } px.speed(2); if (!det.hidden) paintSteps(); },
    write(txt){ if (S.done) return; if (S.phase !== 'write'){ step('Empezó a escribir'); S.phase = 'write'; setW(FR('escribiendo', 'Escribiendo')); } S.words = (String(txt).match(/\S+/g) || []).length; px.speed(1 + Math.floor(S.words / 120)); },
    note(txt){ step(txt); },
    finish(r = {}){
      if (S.done) return; S.done = true; clearInterval(iv); px.stop();
      step(r.error ? 'No pudo responder' : r.aborted ? 'La detuviste' : 'Terminó');
      const t = ((r.ms != null ? r.ms : performance.now() - S.t0) / 1000).toFixed(1).replace('.', LANG === 'en' ? '.' : ',');
      w.textContent = r.error ? 'No respondió' : S.reason ? 'Pensó y respondió en ' + t + ' s' : 'Respondió en ' + t + ' s';
      sm.textContent = fmt(S.words) + (S.words === 1 ? ' palabra' : ' palabras');
      el.classList.add('fin'); if (!det.hidden) paintSteps();
    },
    stop(){ S.done = true; clearInterval(iv); px.stop(); }
  };
}

/* resumen guardado de una respuesta vieja: «Respondió en 2,1 s · 120 palabras ▸» con su detalle */
function workSaved(sum){
  const el = document.createElement('div'); el.className = 'work fin';
  const t = ((sum.ms || 0) / 1000).toFixed(1).replace('.', LANG === 'en' ? '.' : ',');
  el.innerHTML = '<button type="button" class="wk-row" aria-expanded="false"><span class="wk-t"><b class="wk-w">' + (sum.reason ? 'Pensó y respondió en ' : 'Respondió en ') + t + ' s</b><small class="wk-s">' + fmt(sum.words || 0) + ((sum.words || 0) === 1 ? ' palabra' : ' palabras') + '</small></span><svg class="wk-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button><div class="wk-d" hidden><ol class="wk-steps">' + (sum.steps || []).map(([ms, x]) => '<li><em>' + (ms / 1000).toFixed(1).replace('.', ',') + ' s</em>' + esc(x) + '</li>').join('') + '</ol><div class="wk-r"' + (sum.reason ? '' : ' hidden') + '><b>Lo que pensó la IA</b><p></p></div></div>';
  if (sum.reason) $('.wk-r p', el).textContent = sum.reason;
  const row = $('.wk-row', el), det = $('.wk-d', el);
  row.addEventListener('click', () => { const on = det.hidden; det.hidden = !on; row.setAttribute('aria-expanded', String(on)); el.classList.toggle('open', on); });
  return el;
}
