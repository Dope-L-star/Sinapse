/* ===== SymphorIA · SynthonIA (su cara, su manita, sus sonidos, su ventanita, la guía, los eventos y el mantenimiento) =====
   Va aparte de core.js desde v3.4: así SynthFlow y Pulsem abren más livianos y SynthonIA llega justo después.
   Lo de core que necesita viene por SZ.__syn (LANG y SESS cambian, por eso se leen siempre como B.LANG y B.SESS).
   Al final devuelve lo suyo con B.ready({ … }) (ver src/core/00e-synthonia-puente.js). Se arma con «node build.mjs». */
(() => {
'use strict';
if (!window.SZ || !SZ.__syn) return;
const B = SZ.__syn;
const { root, $, $$, clamp, CFG, PERF, reduce, sleepRaw, esc, isFlow, BRAND, zWord, t, onLang, ENERX, trStr, ACC, accHooks, api, accName, toast, pixelGrid, pixelRun, typeIn, SZQ, szCatalog, telPage, telEv, burst, portalOut, portalLock, authBox, cfgModal, plansModal, memAddCore, memList } = B;
/* v3.7 · lo que escribe SynthonIA sale con formato: **negrita**, *cursiva*, `código` y listas con «-».
   Antes se veían los asteriscos y cosas como «&gt;» (Sammuel, 2 nov). Primero se escapa todo (seguro) y después se pone el formato. */
const synMd = s => {
  let h = String(s == null ? '' : s).replace(/&(gt|lt|amp|quot|#39|nbsp);/g, (m, k) => ({ gt:'>', lt:'<', amp:'&', quot:'"', '#39':"'", nbsp:' ' })[k]);
  h = esc(h)
    .replace(/\*\*([^*\n][^\n]*?)\*\*/g, '<b>$1</b>').replace(/__([^_\n][^\n]*?)__/g, '<b>$1</b>')
    .replace(/(^|[\s(«"])\*([^*\s][^*\n]*?)\*(?=[\s).,;:!?»"]|$)/g, '$1<i>$2</i>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/^\s*#{1,4}\s+/gm, '').replace(/^\s*[-*•]\s+/gm, '• ')
    .replace(/\*\*/g, '').replace(/\n/g, '<br>');
  return h;
};
