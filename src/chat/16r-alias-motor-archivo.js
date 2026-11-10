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
