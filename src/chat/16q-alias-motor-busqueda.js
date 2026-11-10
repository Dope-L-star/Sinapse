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
