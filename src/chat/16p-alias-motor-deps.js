// Hecho por: integrador (Claude). Punto de conexión que HERRAMIENTAS pidió: window.ALIAS_DEPS.
// v4.6 · A.L.I.A.S. ya no tiene página: su motor (16p–16u) viaja dentro de chat.js y lo usa 16w-alias-en-chat.js. Usa los mismos
// endpoints y la misma sesión que el chat:
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
