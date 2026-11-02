/* Hecho por: CONSTRUCTOR */
/* A.L.I.A.S. · pieza 30 · resultado final (texto, fuentes, archivos) y arranque. */
(function(){
'use strict';
const U = window.AliasUI;
const { $, el, t } = U;

/* junta lo que dejaron los pasos: texto final, fuentes sin repetir, archivos */
U.compile = function(){
  const S = U.S;
  const done = S.plan.steps.filter(s => S.results[s.id]);
  const last = done.slice().reverse().find(s => String(S.results[s.id].output || '').trim());
  const seen = new Set(), sources = [], files = [];
  done.forEach(s => {
    const r = S.results[s.id];
    (Array.isArray(r.sources) ? r.sources : []).forEach(x => {
      const url = x && U.safeUrl(x.url); if (!url || seen.has(url)) return;
      seen.add(url); sources.push({ url, title: String(x.title || url) });
    });
    if (r.file && r.file.name && (r.file.text != null || r.file.blobUrl)) files.push(r.file);
  });
  return {
    text: last ? String(S.results[last.id].output).trim() : '',
    synth: last && S.results[last.id].synth && Array.isArray(S.results[last.id].synth.voices) ? S.results[last.id].synth : null,
    sources, files: files.reverse(),
    skipped: S.plan.steps.filter(s => S.skipped[s.id]).length
  };
};

U.finish = function(){
  const S = U.S;
  S.phase = 'done'; S.cur = null; S.summary = U.compile();
  U.draw(); U.say(t('listo'));
  const h = $('#resTitle'); if (h) h.focus();
};

/* ---- descarga ---- */
function toBlob(f){
  const mime = f.mime || 'text/plain';
  const data = String(f.text == null ? '' : f.text);
  if (/presentationml|octet-stream|zip|pdf/i.test(mime) || /\.(pptx|zip|pdf)$/i.test(f.name || '')){
    try{                                    /* los binarios llegan en base64 */
      const s = atob(data.replace(/\s/g, '')), a = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
      return new Blob([a], { type: mime });
    }catch(e){}
  }
  return new Blob([data], { type: /^text\//i.test(mime) ? mime + ';charset=utf-8' : mime });
}
/* El servidor entrega la presentación como JSON {titulo,subtitulo,diapositivas[]} dentro de file.text.
   Aquí se arma el .pptx con la misma librería del chat (lib/pptxgen.bundle.js). Si no carga, se
   baja el esquema en texto: mejor algo útil que un .pptx roto. */
function deckOf(f){
  if (!/\.pptx$/i.test(f.name || '') && !/presentationml/i.test(f.mime || '')) return null;
  try{ const d = JSON.parse(String(f.text)); return d && Array.isArray(d.diapositivas) ? d : null; }catch(e){ return null; }
}
let pptxLib = null;
const loadPptx = () => pptxLib || (pptxLib = new Promise((ok, no) => {
  if (window.PptxGenJS) return ok(window.PptxGenJS);
  const sc = document.createElement('script'); sc.src = 'lib/pptxgen.bundle.js';
  sc.onload = () => window.PptxGenJS ? ok(window.PptxGenJS) : no(new Error('pptx'));
  sc.onerror = () => { pptxLib = null; no(new Error('pptx')); };
  document.head.append(sc);
}));
async function deckBlob(D){
  const P = await loadPptx(), pres = new P();
  pres.layout = 'LAYOUT_WIDE'; pres.author = 'SymphorIA'; pres.title = D.titulo || 'A.L.I.A.S.';
  const BG = '0B0C10', TX = 'ECEBE7', SOFT = 'C9C8C3', GOLD = 'E6B65F', ROSE = 'C9566C';
  const c = pres.addSlide(); c.background = { color: BG };
  c.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: .12, fill: { color: ROSE } });
  c.addText(D.titulo || '', { x: .9, y: 1.4, w: 11.5, h: 1.6, fontFace: 'Georgia', fontSize: 44, color: TX, valign: 'bottom', fit: 'shrink' });
  if (D.subtitulo) c.addText(D.subtitulo, { x: .9, y: 3.3, w: 11.5, h: 1.2, fontFace: 'Calibri', fontSize: 22, color: SOFT, valign: 'top', fit: 'shrink' });
  D.diapositivas.forEach((d, i) => {
    const sl = pres.addSlide(); sl.background = { color: BG };
    sl.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: .12, h: 7.5, fill: { color: GOLD } });
    sl.addText(d.titulo || String(i + 2), { x: .8, y: .45, w: 11.7, h: 1.0, fontFace: 'Georgia', fontSize: 32, color: TX, fit: 'shrink' });
    if ((d.puntos || []).length) sl.addText(d.puntos.map(p => ({ text: p, options: { bullet: { code: '25CF' }, color: 'D9D7D2', paraSpaceAfter: 10 } })), { x: .8, y: 1.8, w: 11.7, h: 4.8, fontFace: 'Calibri', fontSize: 22, valign: 'top', fit: 'shrink' });
    if (d.notas) sl.addNotes(d.notas);
  });
  return pres.write({ outputType: 'blob' });
}
function outline(D){
  return ['# ' + (D.titulo || ''), D.subtitulo || ''].concat(D.diapositivas.map((d, i) => '\n## ' + (i + 1) + '. ' + (d.titulo || '') + '\n' + (d.puntos || []).map(p => '- ' + p).join('\n'))).join('\n').trim() + '\n';
}
function save(blob, name){
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
async function download(f){
  const name = String(f.name).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 120) || 'alias.txt';
  const D = deckOf(f);
  if (D){
    try{ save(await deckBlob(D), name); return; }
    catch(e){ U.say(t('err_pptx')); save(new Blob([outline(D)], { type: 'text/markdown;charset=utf-8' }), name.replace(/\.pptx$/i, '') + '.md'); return; }
  }
  if (f.blobUrl && f.text == null){      /* imagen u otro archivo ya hecho en el navegador */
    const a = el('a', { href: f.blobUrl, download: name }); document.body.append(a); a.click(); a.remove(); return;
  }
  save(toBlob(f), name);
}

/* ---- v3.0 · Síntesis: cuántas IAs, cuánto coinciden, en qué no, y cada voz ---- */
function drawSynth(Y){
  const box = $('#resSynth'); if (!box) return;
  box.textContent = ''; box.hidden = !Y;
  if (!Y) return;
  const n = Y.voices.length;
  /* la respuesta de abajo ES la combinada; aquí solo se dice de dónde salió y, plegado, qué aportó cada IA */
  const head = el('div', { class: 'syn-h' }, el('span', { class: 'syn-dots', 'aria-hidden': 'true' }, ...Y.voices.map(() => el('i'))),
    el('div', {}, el('b', { text: n > 1 ? t(Y.fused ? 'syn_titulo' : 'syn_cons', { n }) : t('syn_una') }), n > 1 ? el('small', { text: Y.voices.map(v => v.name).join(' · ') }) : ''));
  box.append(head);
  if (n > 1){
    const d = el('details', { class: 'syn-v' }, el('summary', { text: t('syn_voces') }));
    Y.voices.forEach(v => {
      const b = el('div', { class: 'rtext' }); U.renderText(b, v.text);
      d.append(el('div', { class: 'syn-voz' }, el('span', { class: 'syn-ia', text: v.name + (v.prov ? ' · ' + v.prov : '') }),
        v.aporte ? el('p', { class: 'syn-ap' }, el('b', { text: t('syn_aporte') + ' ' }), document.createTextNode(v.aporte)) : '', b));
    });
    box.append(d);
  }
}

/* ---- dibujar el resultado ---- */
U.drawResult = function(){
  const S = U.S, box = $('#vResult');
  const on = S.phase === 'done' && S.summary;
  box.hidden = !on; if (!on) return;
  const R = S.summary;

  const txt = $('#resText');
  if (R.text) U.renderText(txt, R.text); else { txt.textContent = ''; txt.append(el('p', { class: 'hint', text: t('res_vacio') })); }

  drawSynth(R.synth);
  const note = $('#resNote'); note.textContent = R.skipped ? t('res_saltados', { n: R.skipped }) : ''; note.hidden = !R.skipped;

  const src = $('#resSources'); src.textContent = '';
  R.sources.forEach(s => src.append(el('li', {}, el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer nofollow', text: s.title }))));
  $('#resSrcWrap').hidden = !R.sources.length;

  const fb = $('#resFiles'); fb.textContent = '';
  R.files.forEach(f => fb.append(el('button', { type: 'button', class: 'btn primary', 'data-alias': 'download', onclick: () => download(f) }, U.icon('dl'), el('span', { text: t('res_archivo', { name: f.name }) }))));
  fb.hidden = !R.files.length;

  const wrap = $('#resSteps'); wrap.textContent = '';
  S.plan.steps.forEach((st, i) => {
    const r = S.results[st.id]; if (!r || !String(r.output || '').trim()) return;
    const d = el('details', { class: 'sout' }, el('summary', { text: t('paso_n', { n: i + 1 }) + ' · ' + st.title }));
    const b = el('div', { class: 'rtext' }); U.renderText(b, r.output); d.append(b); wrap.append(d);
  });
  $('#resStepsWrap').hidden = !wrap.children.length;
};

function copy(){
  const R = U.S.summary; if (!R || !R.text) return;
  const ok = () => { U.say(t('res_copiado')); const b = $('#bCopy span'); if (b){ b.textContent = t('res_copiado'); setTimeout(() => { b.textContent = t('res_copiar'); }, 1800); } };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(R.text).then(ok, () => {});
}

/* ---- arranque ---- */
async function boot(){
  /* v3.7 · respeta Ajustes de SymphorIA: «Animaciones» y «Vidrio» (blurry) apagados */
  try{ const c = JSON.parse(localStorage.getItem('synthz:cfg')) || {}; document.documentElement.classList.toggle('noanim', c.anim === false); document.documentElement.classList.toggle('noglass', c.glass === false); }catch(e){}
  const sc = document.documentElement.dataset.scheme;
  U.setScheme(sc === 'light' ? 'light' : 'dark');
  U.lang = U.detectLang();
  await U.loadTexts();
  U.applyI18n();
  U.bind();
  $('#bCopy').addEventListener('click', copy);
  $('#bNew').addEventListener('click', () => U.cancelAll(false));
  U.draw();
  document.documentElement.classList.add('ready');
  /* v3.7 · si cambias el idioma en otra pestaña de SymphorIA, A.L.I.A.S. cambia al instante, sin recargar */
  const follow = () => { const l = U.detectLang(); if (l === U.lang) return; U.lang = l; U.applyI18n(); U.draw(); window.dispatchEvent(new CustomEvent('alias:lang', { detail: { lang: U.lang } })); };
  addEventListener('storage', e => { if (e.key === 'synthz:lang') follow(); });
  addEventListener('pageshow', follow);
}
window.AliasUI.boot = boot;
/* se espera un instante para que todas las piezas del archivo armado ya hayan corrido */
setTimeout(boot, 0);
})();
