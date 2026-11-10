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
