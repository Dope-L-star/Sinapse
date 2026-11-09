// Hecho por: HERRAMIENTAS
// window.ALIAS.plan / runStep: POST /api/alias con token del usuario, timeout 60 s, 1 reintento.
(function () {
  'use strict';
  var A = (window.ALIAS = window.ALIAS || {});
  A.tools = A.tools || {};

  var TIMEOUT_MS = 60000;
  var RETRY_WAIT_MS = 800;

  function T(k) {
    try {
      if (A.t) return A.t(k);
      if (typeof window.t === 'function') return window.t(k);
    } catch (e) {}
    return k;
  }
  function lang() {
    var d = window.ALIAS_DEPS || {};
    try { if (typeof d.lang === 'function') return d.lang(); } catch (e) {}
    return (A.lang && A.lang()) || document.documentElement.lang || 'es';
  }
  function headers() {
    var h = { 'Content-Type': 'application/json' };
    var d = window.ALIAS_DEPS || {};
    try {
      var extra = typeof d.authHeaders === 'function' ? d.authHeaders() : null;
      if (extra) { for (var k in extra) h[k] = extra[k]; }
      else if (typeof d.getToken === 'function') {
        var tk = d.getToken();
        if (tk) h.Authorization = 'Bearer ' + tk;
      }
    } catch (e) {}
    return h;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function once(body) {
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, TIMEOUT_MS);
    try {
      var res = await fetch('/api/alias', {
        method: 'POST', headers: headers(), body: JSON.stringify(body), signal: ctl.signal
      });
      var j = null;
      try { j = await res.json(); } catch (e) {}
      return { status: res.status, json: j };
    } finally { clearTimeout(timer); }
  }

  // Devuelve siempre {ok:true,...} o {ok:false,error,limit?}
  async function post(body) {
    body.lang = lang();
    var r, failMsg = T('alias_err_network');
    for (var i = 0; i < 2; i++) {
      try {
        r = await once(body);
        if (r.json && r.json.limit) return { ok: false, error: T('alias_err_limit'), limit: true };
        if (r.status === 429) return { ok: false, error: T('alias_err_limit'), limit: true };
        if (r.status >= 500 && i === 0) { failMsg = T('alias_err_server'); await wait(RETRY_WAIT_MS); continue; }
        if (!r.json) return { ok: false, error: T('alias_err_server') };
        return r.json;
      } catch (e) {
        failMsg = e && e.name === 'AbortError' ? T('alias_err_timeout') : T('alias_err_network');
        if (i === 0) await wait(RETRY_WAIT_MS);
      }
    }
    return { ok: false, error: failMsg };
  }

  function fill(txt, o) { return String(txt).replace(/\{(\w+)\}/g, function (m, k) { return o[k] == null ? m : o[k]; }); }
  function fail(s, e) { s.status = 'error'; s.output = ''; s.error = (e && e.message) || T('alias_err_server'); }

  // memory: lista lo que la cuenta ya guardó (solo lectura; si no hay o está apagada, lo dice sin fallar)
  // image: genera con el límite diario existente y deja un enlace local en file.blobUrl (no el base64 gigante)
  async function clientStep(s, kind, text) {
    if (kind === 'memory') {
      var items = [];
      try { items = (await A.tools.memory({ get: true })).items; } catch (e) { items = []; }
      s.output = items.length ? T('alias_mem_list') + '\n' + items.slice(0, 25).map(function (x) { return '• ' + x; }).join('\n') : T('alias_mem_empty');
      return;
    }
    try {
      var url = (await A.tools.image(text)).url;
      var blob = await (await fetch(url)).blob();
      var ext = /png/.test(blob.type) ? 'png' : /webp/.test(blob.type) ? 'webp' : 'jpg';
      s.file = { name: T('alias_img_nombre') + '.' + ext, mime: blob.type || 'image/jpeg', blobUrl: URL.createObjectURL(blob) };
      s.output = fill(T('alias_img_listo'), { prompt: text });
    } catch (e) { fail(s, e); }
  }

  A.plan = async function (goal) {
    goal = String(goal || '').trim().slice(0, 500);   /* mismo tope que el servidor y la pantalla */
    if (!goal) return { ok: false, error: T('alias_err_goal') };
    var r = await post({ action: 'plan', goal: goal });
    if (!r || !r.ok) return r || { ok: false, error: T('alias_err_server') };
    var p = r.plan;
    if (!p || !Array.isArray(p.steps) || p.steps.length < 3 || p.steps.length > 7) {
      return { ok: false, error: T('alias_err_plan') };
    }
    return r;
  };

  /* v3.9 · enrutador: 👍/👎 sobre la IA que eligió para un tipo de trabajo, y lo que ha aprendido (para mostrarlo) */
  A.feedback = function (cat, model, up) { return post({ action: 'feedback', cat: cat, model: model, up: !!up }); };
  A.routes = function () { return post({ action: 'rutas' }); };

  /* v4.3 · agente que trabaja solo: la persona escribe algo con el plan en marcha y A.L.I.A.S. rehace los pasos que faltan.
     done = ids de los pasos hechos o en marcha (no se tocan). Responde { ok, steps, reply, changed }. */
  A.adjust = async function (plan, done, note) {
    note = String(note || '').trim().slice(0, 300);
    if (!note) return { ok: false, error: T('alias_err_goal') };
    var r = await post({ action: 'ajustar', plan: plan, done: Array.isArray(done) ? done : [], note: note });
    if (!r || !r.ok) return r || { ok: false, error: T('alias_err_server') };
    if (!Array.isArray(r.steps)) return { ok: false, error: T('alias_err_server') };
    return r;
  };

  /* v3.0: opts.synth === false apaga la Síntesis del paso final (por defecto está encendida) */
  A.runStep = async function (plan, stepId, prev, opts) {
    var body = { action: 'step', plan: plan, stepId: stepId, prev: Array.isArray(prev) ? prev : [] };
    if (opts && opts.synth === false) body.synth = false;
    var r = await post(body);
    if (!r || !r.ok) return r || { ok: false, error: T('alias_err_server') };
    var s = r.step;
    if (!s) return { ok: false, error: T('alias_err_server') };
    /* Los archivos del servidor (texto, código o borrador de presentación en JSON) viajan en file.text;
       la pantalla arma el .pptx al descargar. Aquí NO se crean enlaces blob para no dejarlos sin liberar. */
    /* Los pasos de memoria e imagen los resuelve el navegador: el servidor deja un marcador. */
    var mk = typeof s.output === 'string' ? /^\[\[ALIAS:(memory|image)\]\]\s*/.exec(s.output) : null;
    if (mk && s.status !== 'error') await clientStep(s, mk[1], s.output.slice(mk[0].length));
    return r;
  };
})();
