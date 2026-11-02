/* ===== SymphorIA · SynthonIA (su cara, su manita, sus sonidos, su ventanita, la guía, los eventos y el mantenimiento) =====
   Va aparte de core.js desde v3.4: así SynthFlow y Pulsem abren más livianos y SynthonIA llega justo después.
   Lo de core que necesita viene por SZ.__syn (LANG y SESS cambian, por eso se leen siempre como B.LANG y B.SESS).
   Al final devuelve lo suyo con B.ready({ … }) (ver src/core/00e-synthonia-puente.js). Se arma con «node build.mjs». */
(() => {
'use strict';
if (!window.SZ || !SZ.__syn) return;
const B = SZ.__syn;
const { root, $, $$, clamp, CFG, PERF, reduce, sleepRaw, esc, isFlow, BRAND, zWord, t, onLang, ENERX, trStr, ACC, accHooks, api, accName, toast, pixelGrid, pixelRun, typeIn, SZQ, szCatalog, telPage, telEv, burst, portalOut, portalLock, authBox, cfgModal, plansModal, memAddCore, memList } = B;
