// Hecho por: integrador (Claude). Punto de conexión que HERRAMIENTAS pidió: window.ALIAS_DEPS.
// A.L.I.A.S. es una página aparte (no carga core.js ni chat.js), así que aquí se usan los mismos
// endpoints y la misma sesión que el chat, sin copiar su código:
//   token   -> localStorage "synthz:sess" (lo mismo que manda el chat en Authorization: Bearer)
//   buscar  -> POST /api/ai {action:"search"}   (Tavily/Exa/Wikipedia, con su propio límite)
//   imagen  -> POST /api/ai {action:"image"}    (requiere cuenta; límite diario propio)
//   memoria -> SOLO LECTURA de "synthz:v1".mem  (escribir desde aquí pisaría el guardado del chat y su sincronía)
(function () {
  'use strict';
  var A = (window.ALIAS = window.ALIAS || {});
  function token() { try { return localStorage.getItem('synthz:sess') || ''; } catch (e) { return ''; } }
  async function ai(body) {
    var h = { 'Content-Type': 'application/json' }, tk = token();
    if (tk) h.Authorization = 'Bearer ' + tk;
    var r = await fetch('/api/ai', { method: 'POST', headers: h, body: JSON.stringify(body) });
    var j = null; try { j = await r.json(); } catch (e) {}
    if (!r.ok || !j) throw new Error((j && (j.error || j.message)) || ((window.t && window.t('alias_err_server')) || 'error'));
    return j;
  }
  window.ALIAS_DEPS = window.ALIAS_DEPS || {
    getToken: token,
    lang: function () { var U = window.AliasUI; return (U && U.lang) || document.documentElement.lang || 'es'; },
    search: async function (q) {
      var j = await ai({ action: 'search', q: String(q).slice(0, 300) }), res = Array.isArray(j.results) ? j.results : [];
      return {
        text: res.map(function (x) { return (x.t || x.u) + (x.s ? ': ' + x.s : ''); }).join('\n'),
        sources: res.map(function (x) { return { title: x.t || x.u, url: x.u }; })
      };
    },
    image: async function (prompt) { var j = await ai({ action: 'image', prompt: prompt }); return { url: j.img }; },
    loadPptx: function () {
      return new Promise(function (ok, no) {
        if (window.PptxGenJS) return ok();
        var s = document.createElement('script'); s.src = 'lib/pptxgen.bundle.js';
        s.onload = function () { window.PptxGenJS ? ok() : no(new Error('pptx')); }; s.onerror = function () { no(new Error('pptx')); };
        document.head.appendChild(s);
      });
    },
    memoryGet: function () {
      try {
        var m = (JSON.parse(localStorage.getItem('synthz:v1')) || {}).mem;
        return m && m.on !== false && Array.isArray(m.items) ? m.items.map(function (x) { return x && x.text; }).filter(Boolean) : [];
      } catch (e) { return []; }
    }
    /* memoryAdd: a propósito no existe; ver arriba. */
  };
})();
// Hecho por: HERRAMIENTAS
// Herramienta de búsqueda con fuentes. Reutiliza la búsqueda existente vía window.ALIAS_DEPS.search.
(function () {
  'use strict';
  var A = (window.ALIAS = window.ALIAS || {});
  A.tools = A.tools || {};

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
  function normSources(s) {
    if (!Array.isArray(s)) return [];
    return s
      .map(function (x) { return { title: String((x && (x.title || x.name)) || (x && x.url) || ''), url: String((x && x.url) || '') }; })
      .filter(function (x) { return /^https?:\/\//i.test(x.url); });
  }

  A.tools.search = async function (q) {
    q = String(q || '').trim();
    if (!q) throw new Error(T('alias_err_empty'));
    var d = window.ALIAS_DEPS || {};
    if (typeof d.search !== 'function') throw new Error(T('alias_err_nosearch'));
    var r = await d.search(q, lang());
    if (typeof r === 'string') return { text: r, sources: [] };
    r = r || {};
    return { text: String(r.text || r.answer || ''), sources: normSources(r.sources) };
  };
})();
// Hecho por: HERRAMIENTAS
// Genera archivos en el navegador: pptx (PptxGenJS), txt y código. Devuelve {name,mime,blobUrl}.
(function () {
  'use strict';
  var A = (window.ALIAS = window.ALIAS || {});
  A.tools = A.tools || {};

  var PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  var MIMES = {
    txt: 'text/plain', md: 'text/markdown', js: 'text/javascript', mjs: 'text/javascript',
    ts: 'text/plain', py: 'text/x-python', html: 'text/html', css: 'text/css',
    json: 'application/json', csv: 'text/csv', xml: 'application/xml', sql: 'text/plain',
    java: 'text/plain', c: 'text/plain', cpp: 'text/plain', cs: 'text/plain',
    go: 'text/plain', rs: 'text/plain', php: 'text/plain', sh: 'text/plain'
  };

  function T(k) {
    try {
      if (A.t) return A.t(k);
      if (typeof window.t === 'function') return window.t(k);
    } catch (e) {}
    return k;
  }
  function cleanName(n) {
    return String(n || '').replace(/[\\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 100);
  }
  function ext(n) {
    var m = /\.([a-z0-9]+)$/i.exec(n);
    return m ? m[1].toLowerCase() : '';
  }

  // Convierte el contenido a {title, slides:[{title,bullets[],notes}]}
  function parseDeck(content) {
    var data = null;
    try { data = JSON.parse(content); } catch (e) {}
    if (data) {
      /* acepta {title,slides:[{title,bullets,notes}]} y el formato del servidor {titulo,subtitulo,diapositivas:[{titulo,puntos,notas}]} */
      var arr = Array.isArray(data) ? data : (data.slides || data.diapositivas);
      if (Array.isArray(arr)) {
        return {
          title: Array.isArray(data) ? '' : String(data.title || data.titulo || ''),
          slides: arr.map(function (s) {
            var b = s.bullets || s.puntos || s.points || s.content || [];
            if (typeof b === 'string') b = b.split('\n');
            return { title: String(s.title || s.titulo || ''), bullets: b.map(String).filter(Boolean), notes: String(s.notes || s.notas || '') };
          })
        };
      }
    }
    var deck = { title: '', slides: [] };
    var cur = null;
    String(content).split(/\r?\n/).forEach(function (line) {
      var h = /^(#{1,2})\s+(.*)$/.exec(line);
      if (h) {
        if (h[1] === '#' && !deck.title && !deck.slides.length) { deck.title = h[2].trim(); return; }
        cur = { title: h[2].trim(), bullets: [], notes: '' };
        deck.slides.push(cur);
        return;
      }
      if (!cur) { cur = { title: '', bullets: [], notes: '' }; deck.slides.push(cur); }
      var n = /^>\s?(.*)$/.exec(line);
      if (n) { cur.notes += (cur.notes ? '\n' : '') + n[1]; return; }
      var b = /^\s*[-*•]\s+(.*)$/.exec(line);
      if (b) cur.bullets.push(b[1].trim());
      else if (line.trim()) cur.bullets.push(line.trim());
    });
    return deck;
  }

  async function makePptx(content) {
    var d = window.ALIAS_DEPS || {};
    if (!window.PptxGenJS && typeof d.loadPptx === 'function') await d.loadPptx();
    if (!window.PptxGenJS) throw new Error(T('alias_err_pptx_lib'));
    var deck = parseDeck(content);
    if (!deck.slides.length && !deck.title) throw new Error(T('alias_err_empty'));
    var p = new window.PptxGenJS();
    p.layout = 'LAYOUT_16x9';
    if (deck.title) {
      var s0 = p.addSlide();
      s0.addText(deck.title, { x: 0.6, y: 2.0, w: 8.8, h: 1.5, fontSize: 36, bold: true, align: 'center' });
    }
    deck.slides.forEach(function (sl) {
      var s = p.addSlide();
      s.addText(sl.title || T('alias_slide_default'), { x: 0.5, y: 0.4, w: 9, h: 0.9, fontSize: 28, bold: true });
      if (sl.bullets.length) {
        s.addText(
          sl.bullets.map(function (b) { return { text: b, options: { bullet: true, breakLine: true } }; }),
          { x: 0.6, y: 1.5, w: 8.8, h: 3.8, fontSize: 18, valign: 'top' }
        );
      }
      if (sl.notes) s.addNotes(sl.notes);
    });
    return await p.write({ outputType: 'blob' });
  }

  // file({type:"pptx|txt|code", name, content}) -> {name,mime,blobUrl}
  A.tools.file = async function (o) {
    o = o || {};
    var type = String(o.type || '').toLowerCase();
    var content = String(o.content == null ? '' : o.content);
    var name = cleanName(o.name);
    if (['pptx', 'txt', 'code'].indexOf(type) < 0) throw new Error(T('alias_err_type'));
    if (!content.trim()) throw new Error(T('alias_err_empty'));
    var blob, mime;
    if (type === 'pptx') {
      if (!name) name = 'alias';
      if (ext(name) !== 'pptx') name = name.replace(/\.[a-z0-9]+$/i, '') + '.pptx';
      blob = await makePptx(content);
      mime = PPTX_MIME;
    } else {
      if (!name) name = type === 'txt' ? 'alias.txt' : '';
      if (!name) throw new Error(T('alias_err_empty'));
      if (!ext(name) && type === 'txt') name += '.txt';
      mime = MIMES[ext(name)] || 'text/plain';
      blob = new Blob([content], { type: mime + ';charset=utf-8' });
    }
    return { name: name, mime: mime, blobUrl: URL.createObjectURL(blob) };
  };
  A.tools.file.PPTX_MIME = PPTX_MIME;
})();
// Hecho por: HERRAMIENTAS
// Memoria del usuario. Reutiliza la memoria existente vía window.ALIAS_DEPS.memoryGet / memoryAdd.
// Solo guarda si el usuario ya la tiene activada (la decide la memoria existente, no esta herramienta).
(function () {
  'use strict';
  var A = (window.ALIAS = window.ALIAS || {});
  A.tools = A.tools || {};

  function T(k) {
    try {
      if (A.t) return A.t(k);
      if (typeof window.t === 'function') return window.t(k);
    } catch (e) {}
    return k;
  }

  // memory({get:true}) -> {items:[texto]}   |   memory({add:"texto"}) -> {ok:true}
  A.tools.memory = async function (o) {
    o = o || {};
    var d = window.ALIAS_DEPS || {};
    if (o.add != null) {
      var txt = String(o.add).trim().slice(0, 500);
      if (!txt) throw new Error(T('alias_err_empty'));
      if (typeof d.memoryAdd !== 'function') throw new Error(T('alias_err_nomemory'));
      await d.memoryAdd(txt);
      return { ok: true };
    }
    if (o.get) {
      if (typeof d.memoryGet !== 'function') throw new Error(T('alias_err_nomemory'));
      var r = await d.memoryGet();
      var arr = Array.isArray(r) ? r : (r && r.items) || [];
      return {
        items: arr
          .map(function (x) { return typeof x === 'string' ? x : String((x && (x.text || x.t)) || ''); })
          .filter(Boolean)
      };
    }
    throw new Error(T('alias_err_type'));
  };
})();
// Hecho por: HERRAMIENTAS
// Imágenes. Reutiliza la generación existente vía window.ALIAS_DEPS.image (respeta su límite diario).
(function () {
  'use strict';
  var A = (window.ALIAS = window.ALIAS || {});
  A.tools = A.tools || {};

  function T(k) {
    try {
      if (A.t) return A.t(k);
      if (typeof window.t === 'function') return window.t(k);
    } catch (e) {}
    return k;
  }

  // image(prompt) -> {url}
  A.tools.image = async function (prompt) {
    prompt = String(prompt || '').trim().slice(0, 800);
    if (!prompt) throw new Error(T('alias_err_prompt'));
    var d = window.ALIAS_DEPS || {};
    if (typeof d.image !== 'function') throw new Error(T('alias_err_noimage'));
    var r = await d.image(prompt);
    var url = typeof r === 'string' ? r : r && r.url;
    if (!url) throw new Error(T('alias_err_noimage'));
    return { url: String(url) };
  };
})();
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
