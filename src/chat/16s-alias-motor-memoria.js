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
