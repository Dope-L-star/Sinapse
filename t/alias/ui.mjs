// Hecho por: PROBADOR
/* Pruebas de la página alias.html con Playwright.
   El API de esta suite es un doble local del contrato (sin llaves y sin api/alias.js).
   La página se maneja por data-alias. Cada prueba imprime OK o FALLO. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ALIAS_UI_ROOT=next/out prueba la versión publicada (A.L.I.A.S. en React); sin ella, el alias.html de siempre */
const ROOT = process.env.ALIAS_UI_ROOT ? path.resolve(process.env.ALIAS_UI_ROOT) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PAGE_CANDIDATES = ['alias.html', path.join('src', 'alias', 'alias.html')];
const TEXTOS = path.join(ROOT, 'alias-textos.json');
const GOAL = 'Resumir el clima de Bogotá para un viaje corto';
const GOAL_ERROR = 'Probar un fallo ZXALIAS-UI-ERROR';
const GOAL_PPTX = 'Crear una presentación ZXALIAS-UI-PPTX';
const GOAL_FILE = 'Crear un archivo ZXALIAS-UI-FILE';
const TITLE = 'Título editado por la prueba';

const rows = [];
let baseUrl = '';
const runs = new Map();
let lastAdjust = null, lastNotes = null;
let seq = 0;

function clip(s) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > 220 ? t.slice(0, 220) + '…' : t;
}
function pass(name) {
  console.log('OK    ' + name);
  rows.push({ name, result: 'OK' });
}
function fail(name, err) {
  console.log('FALLO ' + name + ' — ' + clip(err && err.message ? err.message : err));
  rows.push({ name, result: 'FALLO' });
}
function leaves(obj, acc = []) {
  if (!obj || typeof obj !== 'object') return acc;
  for (const v of Object.values(obj)) {
    if (typeof v === 'string') acc.push(v);
    else if (v && typeof v === 'object') leaves(v, acc);
  }
  return acc;
}
function doble(body) {
  const lang = body && body.lang === 'en' ? 'en' : 'es';
  if (!body || body.action === 'plan') {
    const goal = body && typeof body.goal === 'string' ? body.goal.trim() : '';
    if (!goal) {
      return { status: 400, json: { ok: false, error: lang === 'en' ? 'The goal is empty.' : 'El objetivo está vacío.' } };
    }
    if (goal.length > 500) {
      return { status: 400, json: { ok: false, error: lang === 'en' ? 'The goal is too long.' : 'El objetivo es demasiado largo.' } };
    }
    const id = 'p' + (++seq);
    const steps = [
      { id: 1, title: lang === 'en' ? 'Search sources' : 'Buscar fuentes', tool: 'search', input: goal },
      { id: 2, title: lang === 'en' ? 'Check memory' : 'Mirar la memoria', tool: 'memory', input: goal },
      { id: 3, title: lang === 'en' ? 'Think it through' : 'Pensar el resumen', tool: 'think', input: goal },
      { id: 4, title: lang === 'en' ? 'Make an image' : 'Hacer una imagen', tool: 'image', input: goal },
      { id: 5, title: lang === 'en' ? 'Write the file' : 'Escribir el archivo', tool: 'file', input: goal }
    ];
    return { status: 200, json: { ok: true, plan: { id, goal, steps } } };
  }
  if (body.action === 'ajustar') {
    /* v4.3 · la persona escribió algo a mitad de camino: se añade un paso al final */
    lastAdjust = body;
    const plan = body.plan || {};
    const ids = (Array.isArray(plan.steps) ? plan.steps : []).map(s => +s.id || 0);
    const fixed = new Set((body.done || []).map(Number));
    const rest = (plan.steps || []).filter(s => !fixed.has(+s.id));
    const next = Math.max(0, ...ids) + 1;
    const steps = rest.map((s, i) => ({ id: next + i, title: s.title, tool: s.tool, input: s.input }));
    steps.push({ id: next + steps.length, title: lang === 'en' ? 'Step added by the note' : 'Paso añadido por la nota', tool: 'think', input: body.note || '' });
    return { status: 200, json: { ok: true, changed: true, steps, reply: lang === 'en' ? 'Got it, I added a step.' : 'Entendido, añadí un paso.' } };
  }
  if (body.action === 'step') {
    const plan = body.plan || {};
    if (Array.isArray(plan.notes) && plan.notes.length) lastNotes = plan.notes.slice();
    const steps = Array.isArray(plan.steps) ? plan.steps : [];
    const step = steps.find(s => String(s.id) === String(body.stepId)) || { id: body.stepId, tool: 'think', title: '' };
    const key = String(plan.id || 'x') + ':' + String(body.stepId);
    const n = (runs.get(key) || 0) + 1;
    runs.set(key, n);
    if (String(plan.goal || '').includes('ZXALIAS-UI-FLAKY') && n === 1) {
      return { status: 200, json: { ok: true, step: { id: body.stepId, status: 'error', output: '', sources: [], file: null, error: 'falló una vez' } } };
    }
    if (String(plan.goal || '').includes('ZXALIAS-UI-ERROR')) {
      return {
        status: 200,
        json: {
          ok: true,
          step: {
            id: body.stepId,
            status: 'error',
            output: '',
            sources: [],
            file: null,
            error: lang === 'en' ? 'This step could not be finished.' : 'No se pudo completar este paso.'
          }
        }
      };
    }
    const deck = { titulo: 'Clima de Bogotá', subtitulo: 'Resumen', diapositivas: [{ titulo: 'Temperatura', puntos: ['Entre 8 y 19 grados', 'Lluvia por la tarde'], notas: '' }, { titulo: 'Qué llevar', puntos: ['Chaqueta', 'Paraguas'], notas: '' }] };
    if (String(plan.goal || '').includes('ZXALIAS-UI-MARK') && (step.tool === 'memory' || step.tool === 'image')) {
      return { status: 200, json: { ok: true, step: { id: body.stepId, status: 'done', output: '[[ALIAS:' + step.tool + ']] ' + (step.input || 'x'), sources: [], file: null, error: null } } };
    }
    const file = step.tool === 'file' && String(plan.goal || '').includes('ZXALIAS-UI-PPTX')
      ? { name: 'Clima-de-Bogota.pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', text: JSON.stringify(deck) }
      : step.tool === 'file'
      ? { name: 'resumen.txt', mime: 'text/plain', text: 'Resumen de prueba ALIAS.' }
      : null;
    const sources = step.tool === 'search' ? [{ title: 'Ideam', url: 'https://ejemplo.test/clima-bogota' }] : [];
    return {
      status: 200,
      json: {
        ok: true,
        step: {
          id: body.stepId,
          status: 'done',
          output: 'Listo (' + n + '): ' + (step.title || 'paso'),
          sources,
          file,
          error: null
        }
      }
    };
  }
  return { status: 400, json: { ok: false, error: lang === 'en' ? 'Unknown action.' : 'Acción desconocida.' } };
}
function mime(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js' || ext === '.mjs') return 'text/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}
function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
function startServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    if (req.method === 'POST' && url.pathname === '/api/ai') {      /* doble de la imagen del chat */
      const b = JSON.parse((await readRaw(req)) || '{}');
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(b.action === 'image' ? { img: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', left: 1, max: 5 } : { error: 'no' }));
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/alias') {
      const raw = await readRaw(req);
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
      if (body.action === 'step' && String((body.plan && body.plan.goal) || '').includes('ZXALIAS-UI-SLOW')) await new Promise(r => setTimeout(r, 1500));
      const out = doble(body);
      res.writeHead(out.status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify(out.json));
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Método no permitido.' }));
      return;
    }
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const abs = path.normalize(path.join(ROOT, rel));
    if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) {
      res.writeHead(403); res.end('fuera'); return;
    }
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('no está ' + rel);
      return;
    }
    res.writeHead(200, { 'content-type': mime(abs), 'cache-control': 'no-store' });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(abs).pipe(res);
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      baseUrl = 'http://127.0.0.1:' + server.address().port;
      resolve(server);
    });
  });
}
function findPage() {
  for (const rel of PAGE_CANDIDATES) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) return '/' + rel.split(path.sep).join('/');
  }
  return '';
}
async function start(page) {
  await page.goto(baseUrl + findPage(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ALIAS && typeof window.ALIAS.plan === 'function');
}
async function must(page, name) {
  if (name === 'lang-en' || name === 'lang-es') {   /* v4.3 · en computador el idioma está en la barra común de arriba */
    const vis = page.locator('[data-alias="' + name + '"]:visible');
    if (await vis.count()) return vis;
    const top = page.locator('.top .lang button', { hasText: name.slice(-2).toUpperCase() });
    if (await top.count()) return top;
  }
  /* "run" está en Empezar, Aprobar y Seguir: la persona solo ve uno a la vez */
  const loc = page.locator('[data-alias="' + name + '"]' + (name === 'run' ? ':visible' : ''));
  if (!(await loc.count())) throw new Error('falta data-alias="' + name + '"');
  return loc;
}
async function inside(page, step, name) {
  if (step) {
    const loc = step.locator('[data-alias="' + name + '"]');
    if (await loc.count()) return loc.first();
  }
  const all = page.locator('[data-alias="' + name + '"]');
  if (!(await all.count())) throw new Error('falta data-alias="' + name + '"');
  return all.first();
}
async function countDone(page) {
  return page.evaluate(() => document.querySelectorAll('[data-alias="step"][data-status="done"], [data-alias="step"][data-state="done"]').length);
}
async function planFor(page, goal) {
  await start(page);
  const goalBox = await must(page, 'goal');
  await goalBox.first().fill(goal);
  await (await must(page, 'plan-submit')).first().click();
  await page.waitForFunction(() => {
    const n = document.querySelectorAll('[data-alias="step"]').length;
    return n >= 3 && n <= 7;
  });
}
async function readControl(loc) {
  return loc.evaluate(el => (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') ? el.value : el.textContent);
}
async function runNext(page) {
  const before = await countDone(page);
  const run = await must(page, 'run');
  await run.first().click();
  await page.waitForFunction(beforeN => {
    return document.querySelectorAll('[data-alias="step"][data-status="done"], [data-alias="step"][data-state="done"]').length > beforeN
      || !!(document.querySelector('[data-react="alias"] #vResult'))   /* v4.3: al terminar, los pasos se resumen en una línea */
      || !!(document.querySelector('[data-alias="error"]') && document.querySelector('[data-alias="error"]').innerText.trim());
  }, before);
}
async function testOpen(page) {
  await start(page);
  await must(page, 'goal');
  const why = await page.evaluate(() => {
    const a = window.ALIAS;
    if (!a) return 'no existe window.ALIAS';
    if (typeof a.plan !== 'function') return 'ALIAS.plan no es función';
    if (typeof a.runStep !== 'function') return 'ALIAS.runStep no es función';
    if (!a.tools) return 'faltan tools';
    for (const k of ['search', 'file', 'memory', 'image']) {
      if (typeof a.tools[k] !== 'function') return 'tools.' + k + ' no es función';
    }
    return '';
  });
  if (why) throw new Error(why);
}
async function testPlan(page) {
  await planFor(page, GOAL);
  const n = await page.locator('[data-alias="step"]').count();
  if (n < 3 || n > 7) throw new Error('se ven ' + n + ' pasos');
  await must(page, 'plan');
  const blob = await page.locator('[data-alias="plan"]').first().innerText();
  if (!blob.trim()) throw new Error('el plan está vacío');
  const goalText = await page.locator('body').innerText();
  if (!/bogot/i.test(goalText)) throw new Error('no se ve el objetivo en la página');
}
async function testEdit(page) {
  await planFor(page, GOAL);
  const step = page.locator('[data-alias="step"]').first();
  await (await inside(page, step, 'step-edit')).click();
  const title = await inside(page, step, 'step-title');
  await title.fill(TITLE);
  await title.evaluate(el => el.blur());
  const got = await readControl(title);
  if (!got.includes(TITLE)) throw new Error('el paso no guardó el título: ' + got);
}
async function testSteps(page) {
  await planFor(page, GOAL);
  const total = await page.locator('[data-alias="step"]').count();
  await (await must(page, 'run')).first().click();
  await page.waitForFunction(() => {
    return document.querySelectorAll('[data-alias="step"][data-status="done"], [data-alias="step"][data-state="done"]').length === 1;
  });
  const done = await countDone(page);
  if (done !== 1) throw new Error('de un clic quedaron ' + done + ' pasos hechos');
  if (done >= total) throw new Error('se ejecutaron todos de un golpe');
}
async function paused(page) {
  return page.evaluate(() => {
    const plan = document.querySelector('[data-alias="plan"]');
    const btn = document.querySelector('[data-alias="pause"]');
    const planPaused = !!(plan && (plan.dataset.state === 'paused' || plan.dataset.status === 'paused'));
    const btnPaused = !!(btn && (btn.getAttribute('aria-pressed') === 'true' || btn.dataset.state === 'on' || btn.dataset.state === 'paused'));
    return planPaused || btnPaused;
  });
}
async function testPause(page) {
  /* En modo "aprobar cada paso" la app ya se detiene sola; pausar tiene sentido en automático */
  await planFor(page, GOAL + ' ZXALIAS-UI-SLOW');
  const radio = page.locator('input[name="mode"][value="auto"]');
  if (await radio.count()) await radio.check();   /* la página estática; en React el automático es lo normal */
  await (await must(page, 'run')).first().click();
  await page.locator('[data-alias="step"][data-status="running"]').first().waitFor();
  await (await must(page, 'pause')).first().click();
  await page.waitForFunction(() => document.querySelector('[data-alias="plan"]').dataset.state === 'paused');
  if (!(await paused(page))) throw new Error('la pausa no se marcó (data-state="paused" en el plan)');
  const n0 = await countDone(page);
  await page.waitForTimeout(2200);
  const n = await countDone(page);
  if (n !== n0 || n !== 1) throw new Error('al pausar siguió: ' + n0 + ' → ' + n + ' pasos hechos (se esperaba 1 y quieto)');
  const resume = (await must(page, 'run')).first();
  await resume.click();
  await page.waitForFunction(() => document.querySelectorAll('[data-alias="step"][data-status="done"]').length >= 2);
}
async function testRedo(page) {
  await planFor(page, GOAL);
  await runNext(page);
  const step = page.locator('[data-alias="step"]').first();
  const output = await inside(page, step, 'step-output');
  const before = (await readControl(output)).trim();
  if (!before) throw new Error('el paso hecho no muestra data-alias="step-output"');
  await (await inside(page, step, 'redo')).click();
  await page.waitForFunction(prev => {
    const el = document.querySelector('[data-alias="step"] [data-alias="step-output"]') || document.querySelector('[data-alias="step-output"]');
    if (!el) return false;
    const text = (el.value != null && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) ? el.value : el.textContent;
    return text.trim() && text.trim() !== prev;
  }, before);
}
async function testError(page) {
  await planFor(page, GOAL_ERROR);
  await (await must(page, 'run')).first().click();
  const err = await must(page, 'error');
  await err.first().waitFor({ state: 'visible' });
  const msg = (await err.first().innerText()).trim();
  if (!msg) throw new Error('el aviso de error está vacío');
  const buttons = page.locator('[data-alias="decisions"] button');
  const n = await buttons.count();
  if (n < 2) throw new Error('se esperaban al menos 2 botones de decisión y hay ' + n);
  const visible = await buttons.evaluateAll(list => list.filter(b => b.offsetParent !== null || b.getClientRects().length).length);
  if (visible < 2) throw new Error('los botones de decisión no se ven');
}
async function testDownload(page) {
  await planFor(page, GOAL_FILE);
  for (let i = 0; i < 7; i++) {
    const btn = page.locator('[data-alias="download"]');
    if (await btn.count() && await btn.first().isVisible()) break;
    await runNext(page);
  }
  const btn = page.locator('[data-alias="download"]');
  if (!(await btn.count()) || !(await btn.first().isVisible())) throw new Error('no apareció data-alias="download"');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    btn.first().click()
  ]);
  const dest = path.join(ROOT, 't', 'alias', '.descarga-prueba.txt');
  let text = '';
  try {
    await download.saveAs(dest);
    text = fs.readFileSync(dest, 'utf8');
  } finally {
    fs.rmSync(dest, { force: true });
  }
  if (!download.suggestedFilename()) throw new Error('la descarga no tiene nombre');
  if (!text.includes('ALIAS')) throw new Error('el archivo no trae el texto del paso');
}
async function testPptx(page) {
  await planFor(page, GOAL_PPTX);
  for (let i = 0; i < 7; i++) {
    const btn = page.locator('[data-alias="download"]');
    if (await btn.count() && await btn.first().isVisible()) break;
    await runNext(page);
  }
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-alias="download"]').first().click()]);
  const dest = path.join(ROOT, 't', 'alias', '.descarga-prueba.pptx');
  let head = '', size = 0, xml = '';
  try {
    await download.saveAs(dest);
    const buf = fs.readFileSync(dest);
    size = buf.length; head = buf.subarray(0, 2).toString('latin1'); xml = buf.toString('latin1');
  } finally { fs.rmSync(dest, { force: true }); }
  if (!/\.pptx$/i.test(download.suggestedFilename())) throw new Error('el nombre no es .pptx: ' + download.suggestedFilename());
  if (head !== 'PK') throw new Error('no es un zip/pptx real (empieza con ' + JSON.stringify(head) + ', ' + size + ' bytes)');
  if (!xml.includes('ppt/slides/slide3.xml')) throw new Error('el pptx no trae las 3 diapositivas esperadas');
}
async function testMarkers(page) {
  await page.addInitScript(() => { localStorage.setItem('synthz:v1', JSON.stringify({ mem: { on: true, items: [{ text: 'Me llamo Sammuel ZXMEM' }] } })); localStorage.setItem('synthz:sess', 'tok-de-prueba'); });
  await planFor(page, GOAL + ' ZXALIAS-UI-MARK');
  /* el doble arma: search, memory, think, image, file -> corremos hasta que se vea la imagen para bajar */
  for (let i = 0; i < 4; i++) await runNext(page);
  const body = await page.locator('[data-alias="step"]').evaluateAll(l => l.map(x => x.textContent).join('\n'));
  if (/\[\[ALIAS/.test(body)) throw new Error('el marcador [[ALIAS:…]] quedó a la vista');
  if (!body.includes('ZXMEM')) throw new Error('el paso de memoria no mostró lo guardado');
  const dl = page.locator('[data-alias="step"]').nth(3);
  const text = await dl.textContent();
  if (!/Imagen lista|Image ready/.test(text)) throw new Error('el paso de imagen no dijo que quedó lista: ' + text.slice(0, 120));
  for (let i = 0; i < 3; i++) { const b = page.locator('[data-alias="download"]'); if (await b.count()) break; await runNext(page).catch(() => {}); }
  const imgBtn = page.locator('[data-alias="download"]').filter({ hasText: /imagen\.png|image\.png/ });
  await imgBtn.first().waitFor();
  const [d] = await Promise.all([page.waitForEvent('download'), imgBtn.first().click()]);
  if (!/\.png$/.test(d.suggestedFilename())) throw new Error('la imagen no se descarga como .png: ' + d.suggestedFilename());
}
function score(text, vals, other) {
  return vals.filter(v => v.trim().length > 3 && text.includes(v) && !other.includes(v)).length;
}
async function testLang(page) {
  if (!fs.existsSync(TEXTOS)) throw new Error('falta alias-textos.json');
  let dic;
  try { dic = JSON.parse(fs.readFileSync(TEXTOS, 'utf8')); } catch (e) { throw new Error('textos.json no es JSON: ' + e.message); }
  if (!dic.es || !dic.en) throw new Error('textos.json necesita es y en');
  const esVals = leaves(dic.es);
  const enVals = leaves(dic.en);
  if (!esVals.length || !enVals.length) throw new Error('el diccionario no tiene textos');
  await start(page);
  const esText = await page.locator('body').innerText();
  const esScore = score(esText, esVals, enVals);
  const enScore = score(esText, enVals, esVals);
  if (esScore < 1) throw new Error('no se vio ningún texto de textos.json en español');
  if (esScore <= enScore) throw new Error('en español se ven tantos textos en inglés como en español');
  await (await must(page, 'lang-en')).first().click();
  let enText = '';
  let changed = false;
  for (let i = 0; i < 20; i++) {
    enText = await page.locator('body').innerText();
    const esLeft = score(enText, esVals, enVals);
    const enNow = score(enText, enVals, esVals);
    if (enNow >= 1 && enNow > esLeft) { changed = true; break; }
    await page.waitForTimeout(100);
  }
  if (!changed) throw new Error('al pasar a inglés el texto visible no cambió');
}

/* ---- v4.3 · agente que trabaja solo (solo la versión React) ---- */
async function isAgent(page) { return page.evaluate(() => !!document.querySelector('[data-react="alias"]')); }
async function testAuto(page) {
  await planFor(page, GOAL);
  if (!(await isAgent(page))) return;
  const total = await page.locator('[data-alias="step"]').count();
  await (await must(page, 'run')).first().click();
  await page.waitForFunction(n => document.querySelectorAll('[data-alias="step"][data-status="done"]').length >= n || !!document.getElementById('vResult'), total, { timeout: 15000 });
  await page.locator('#vResult').waitFor({ timeout: 15000 });
  const runs = await page.locator('[data-alias="run"]:visible').count();
  if (runs) throw new Error('al terminar sigue habiendo un botón de continuar');
}
async function testSteer(page) {
  await planFor(page, GOAL + ' ZXALIAS-UI-SLOW');
  if (!(await isAgent(page))) return;
  lastAdjust = null; lastNotes = null;
  await (await must(page, 'run')).first().click();
  await page.locator('[data-alias="step"][data-status="running"]').first().waitFor();
  const box = page.locator('[data-alias="steer"]');
  await box.fill('Que sea en inglés ZXNOTA');
  await box.press('Enter');
  await page.waitForFunction(() => /añadí un paso|added a step/i.test(document.body.innerText));
  if (!lastAdjust || !Array.isArray(lastAdjust.done) || !lastAdjust.done.length) throw new Error('no mandó qué pasos ya estaban hechos o en marcha');
  /* no se detuvo: sigue solo hasta el final, con el paso nuevo */
  await page.locator('#vResult').waitFor({ timeout: 20000 });
  if (!lastNotes || !lastNotes.some(n => n.includes('ZXNOTA'))) throw new Error('la nota no viajó con el plan a los pasos siguientes');
  await page.getByRole('button', { name: /ver cada paso|see each step/i }).click();
  const titles = await page.locator('[data-alias="step"]').allInnerTexts();
  if (!titles.some(x => /Paso añadido por la nota|Step added by the note/.test(x))) throw new Error('el paso añadido no aparece en el plan');
}
async function testRetry(page) {
  await planFor(page, GOAL + ' ZXALIAS-UI-FLAKY');
  if (!(await isAgent(page))) return;
  await (await must(page, 'run')).first().click();
  await page.locator('#vResult').waitFor({ timeout: 15000 });
  const err = await page.locator('#errBox').isVisible();
  if (err) throw new Error('preguntó por un error que se arreglaba solo reintentando');
}
async function testStop(page) {
  await planFor(page, GOAL + ' ZXALIAS-UI-SLOW');
  if (!(await isAgent(page))) return;
  await (await must(page, 'run')).first().click();
  await page.waitForFunction(() => document.querySelectorAll('[data-alias="step"][data-status="done"]').length >= 1, null, { timeout: 8000 });
  await page.locator('#bCancel').click();
  await page.locator('#vResult').waitFor();
  const n0 = await page.evaluate(() => document.querySelectorAll('[data-alias="step"]').length);
  await page.waitForTimeout(1800);
  const plan = await page.locator('[data-alias="plan"]').getAttribute('data-state');
  if (plan !== 'done') throw new Error('Detener no dejó lo hecho como resultado: ' + plan + ' ' + n0);
}

const TESTS = [
  ['abre alias.html', 'Carga la página, el campo del objetivo y window.ALIAS con plan, runStep y tools search, file, memory e image.', testOpen],
  ['escribe el objetivo y ve el plan', 'Escribe un objetivo, pide el plan y aparecen de 3 a 7 pasos.', testPlan],
  ['edita un paso', 'Edita el título del primer paso y el cambio se queda en el plan.', testEdit],
  ['ejecuta paso a paso', 'Un clic en ejecutar completa un solo paso, no todos.', testSteps],
  ['pausa el recorrido', 'Pausar marca la pausa y el siguiente ejecutar no avanza otro paso.', testPause],
  ['rehace un paso', 'Rehacer vuelve a correr el paso y el texto del resultado cambia.', testRedo],
  ['muestra el error y los botones de decisión', 'Un paso con error muestra el aviso y al menos dos botones para decidir.', testError],
  ['descarga el archivo', 'Al llegar al paso file se puede descargar un archivo con texto.', testDownload],
  ['descarga la presentación', 'Un paso file que entrega el borrador de presentación baja un .pptx real (zip con las diapositivas), no el JSON.', testPptx],
  ['pasos de memoria e imagen se resuelven en el navegador', 'El marcador del servidor se cambia por lo guardado (solo lectura) y por una imagen descargable.', testMarkers],
  ['aprueba una vez y termina solo', 'v4.3: un solo toque en Aprobar y todos los pasos corren hasta el resultado, sin más botones de continuar.', testAuto],
  ['agrégale algo sin pararlo', 'v4.3: lo que se escribe a mitad de camino se suma (action ajustar), no lo detiene, añade el paso y la nota viaja a los pasos siguientes.', testSteer],
  ['reintenta solo con otra IA', 'v4.3: si un paso falla una vez, lo vuelve a intentar solo y no pregunta.', testRetry],
  ['detener entrega lo hecho', 'v4.3: Detener para el trabajo y muestra lo que alcanzó a hacer como resultado.', testStop],
  ['cambia el idioma con el diccionario', 'Los textos visibles salen de textos.json y cambian al pulsar inglés.', testLang]
];

const MANUAL = new Set(['ejecuta paso a paso', 'rehace un paso', 'descarga el archivo', 'descarga la presentación', 'pasos de memoria e imagen se resuelven en el navegador']);

function printTable() {
  console.log('\n| Prueba | Cubre | Resultado |');
  console.log('| --- | --- | --- |');
  for (let i = 0; i < TESTS.length; i++) {
    const result = rows[i] ? rows[i].result : 'FALLO';
    console.log('| ' + TESTS[i][0] + ' | ' + TESTS[i][1] + ' | ' + result + ' |');
  }
  const ok = rows.filter(r => r.result === 'OK').length;
  console.log('\n' + ok + ' OK, ' + (rows.length - ok) + ' FALLO');
}

async function main() {
  const pagePath = findPage();
  if (!pagePath) {
    for (const t of TESTS) fail(t[0], 'no está alias.html (raíz o src/alias/alias.html)');
    printTable();
    process.exitCode = 1;
    return;
  }
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch (e) {
    for (const t of TESTS) fail(t[0], 'falta el paquete playwright');
    printTable();
    process.exitCode = 1;
    return;
  }
  const server = await startServer();
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ acceptDownloads: true, locale: 'es-CO' });
  try {
    for (const t of TESTS) {
      const page = await context.newPage();
      const logs = [];
      page.setDefaultTimeout(8000);
      /* v4.3 · las pruebas de «un clic, un paso» usan el ajuste «Pedirme permiso en cada paso» (la página estática ya es así) */
      await page.addInitScript(v => { try { localStorage.setItem('alias:cada', v); } catch (e) {} }, MANUAL.has(t[0]) ? '1' : '0');
      page.on('pageerror', err => logs.push(String(err && err.message ? err.message : err)));
      try {
        await t[2](page);
        if (logs.length) throw new Error('error en la página: ' + logs[0]);
        pass(t[0]);
      } catch (e) {
        fail(t[0], e);
      } finally {
        await page.close().catch(() => {});
      }
    }
  } finally {
    await browser.close().catch(() => {});
    await new Promise(resolve => server.close(resolve));
  }
  printTable();
  if (rows.some(r => r.result !== 'OK')) process.exitCode = 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
