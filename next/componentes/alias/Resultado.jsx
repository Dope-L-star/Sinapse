'use client';
/* A.L.I.A.S. · resultado final: texto, Síntesis (qué IAs coincidieron), archivos para bajar, fuentes y lo de cada paso. */
import { useEffect, useState } from 'react';
import { Icono } from './iconos';

/* texto de la IA → elementos React (nunca HTML crudo): listas, títulos y párrafos */
export function Texto({ text, ...rest }) {
  const blocks = String(text || '').replace(/\r/g, '').trim().split(/\n{2,}/).filter((b) => b.trim());
  return (
    <div className="rtext" {...rest}>
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) return <ul key={i}>{lines.map((l, k) => <li key={k}>{l.replace(/^\s*[-*•]\s+/, '')}</li>)}</ul>;
        if (lines.length === 1 && /^#{1,4}\s+/.test(lines[0])) return <h4 key={i}>{lines[0].replace(/^#{1,4}\s+/, '')}</h4>;
        return <p key={i}>{b}</p>;
      })}
    </div>
  );
}

export const safeUrl = (u) => { try { const x = new URL(String(u), location.href); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : ''; } catch (e) { return ''; } };

/* junta lo que dejaron los pasos: texto final, fuentes sin repetir, archivos */
export function compilar(S) {
  const done = S.plan.steps.filter((s) => S.results[s.id]);
  const last = done.slice().reverse().find((s) => String(S.results[s.id].output || '').trim());
  const seen = new Set(), sources = [], files = [];
  done.forEach((s) => {
    const r = S.results[s.id];
    (Array.isArray(r.sources) ? r.sources : []).forEach((x) => {
      const url = x && safeUrl(x.url); if (!url || seen.has(url)) return;
      seen.add(url); sources.push({ url, title: String(x.title || url) });
    });
    if (r.file && r.file.name && (r.file.text != null || r.file.blobUrl)) files.push(r.file);
  });
  return {
    text: last ? String(S.results[last.id].output).trim() : '',
    synth: last && S.results[last.id].synth && Array.isArray(S.results[last.id].synth.voices) ? S.results[last.id].synth : null,
    sources, files: files.reverse(),
    skipped: S.plan.steps.filter((s) => S.skipped[s.id]).length,
  };
}

/* ---- descarga ---- */
function toBlob(f) {
  const mime = f.mime || 'text/plain', data = String(f.text == null ? '' : f.text);
  if (/presentationml|octet-stream|zip|pdf/i.test(mime) || /\.(pptx|zip|pdf)$/i.test(f.name || '')) {
    try { const s = atob(data.replace(/\s/g, '')), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return new Blob([a], { type: mime }); } catch (e) { /* no era base64 */ }
  }
  return new Blob([data], { type: /^text\//i.test(mime) ? mime + ';charset=utf-8' : mime });
}
/* El servidor manda la presentación como JSON {titulo,subtitulo,diapositivas[]}; aquí se arma el .pptx con lib/pptxgen.bundle.js. */
function deckOf(f) {
  if (!/\.pptx$/i.test(f.name || '') && !/presentationml/i.test(f.mime || '')) return null;
  try { const d = JSON.parse(String(f.text)); return d && Array.isArray(d.diapositivas) ? d : null; } catch (e) { return null; }
}
let pptxLib = null;
const loadPptx = () => pptxLib || (pptxLib = new Promise((ok, no) => {
  if (window.PptxGenJS) return ok(window.PptxGenJS);
  const sc = document.createElement('script'); sc.src = 'lib/pptxgen.bundle.js';
  sc.onload = () => (window.PptxGenJS ? ok(window.PptxGenJS) : no(new Error('pptx')));
  sc.onerror = () => { pptxLib = null; no(new Error('pptx')); };
  document.head.append(sc);
}));
async function deckBlob(D) {
  const P = await loadPptx(), pres = new P();
  pres.layout = 'LAYOUT_WIDE'; pres.author = 'SymphorIA'; pres.title = D.titulo || 'A.L.I.A.S.';
  const BG = '0B0C10', TX = 'ECEBE7', SOFT = 'C9C8C3', GOLD = 'E6B65F', ROSE = 'C9566C';
  const c = pres.addSlide(); c.background = { color: BG };
  c.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: ROSE } });
  c.addText(D.titulo || '', { x: 0.9, y: 1.4, w: 11.5, h: 1.6, fontFace: 'Georgia', fontSize: 44, color: TX, valign: 'bottom', fit: 'shrink' });
  if (D.subtitulo) c.addText(D.subtitulo, { x: 0.9, y: 3.3, w: 11.5, h: 1.2, fontFace: 'Calibri', fontSize: 22, color: SOFT, valign: 'top', fit: 'shrink' });
  D.diapositivas.forEach((d, i) => {
    const sl = pres.addSlide(); sl.background = { color: BG };
    sl.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: GOLD } });
    sl.addText(d.titulo || String(i + 2), { x: 0.8, y: 0.45, w: 11.7, h: 1.0, fontFace: 'Georgia', fontSize: 32, color: TX, fit: 'shrink' });
    if ((d.puntos || []).length) sl.addText(d.puntos.map((p) => ({ text: p, options: { bullet: { code: '25CF' }, color: 'D9D7D2', paraSpaceAfter: 10 } })), { x: 0.8, y: 1.8, w: 11.7, h: 4.8, fontFace: 'Calibri', fontSize: 22, valign: 'top', fit: 'shrink' });
    if (d.notas) sl.addNotes(d.notas);
  });
  return pres.write({ outputType: 'blob' });
}
const outline = (D) => ['# ' + (D.titulo || ''), D.subtitulo || ''].concat(D.diapositivas.map((d, i) => '\n## ' + (i + 1) + '. ' + (d.titulo || '') + '\n' + (d.puntos || []).map((p) => '- ' + p).join('\n'))).join('\n').trim() + '\n';
function bajar(href, name) { const a = document.createElement('a'); a.href = href; a.download = name; document.body.append(a); a.click(); a.remove(); }
function save(blob, name) { const url = URL.createObjectURL(blob); bajar(url, name); setTimeout(() => URL.revokeObjectURL(url), 4000); }
async function download(f, t, say) {
  const name = String(f.name).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 120) || 'alias.txt';
  const D = deckOf(f);
  if (D) {
    try { save(await deckBlob(D), name); return; } catch (e) { say(t('err_pptx')); save(new Blob([outline(D)], { type: 'text/markdown;charset=utf-8' }), name.replace(/\.pptx$/i, '') + '.md'); return; }
  }
  if (f.blobUrl && f.text == null) { bajar(f.blobUrl, name); return; }
  save(toBlob(f), name);
}

/* ---- Síntesis: cuántas IAs, y plegado, qué aportó cada una ---- */
function Sintesis({ Y, t }) {
  if (!Y) return null;
  const n = Y.voices.length;
  return (
    <div id="resSynth" className="al-syn">
      <div className="syn-h">
        <span className="syn-dots" aria-hidden="true">{Y.voices.map((v, i) => <i key={i} />)}</span>
        <div><b>{n > 1 ? t(Y.fused ? 'syn_titulo' : 'syn_cons', { n }) : t('syn_una')}</b>{n > 1 ? <small>{Y.voices.map((v) => v.name).join(' · ')}</small> : null}</div>
      </div>
      {n > 1 ? (
        <details className="syn-v"><summary>{t('syn_voces')}</summary>
          {Y.voices.map((v, i) => (
            <div className="syn-voz" key={i}>
              <span className="syn-ia">{v.name + (v.prov ? ' · ' + v.prov : '')}</span>
              {v.aporte ? <p className="syn-ap"><b>{t('syn_aporte') + ' '}</b>{v.aporte}</p> : null}
              <Texto text={v.text} />
            </div>
          ))}
        </details>
      ) : null}
    </div>
  );
}

const STAR_C = ['#3de0ff', '#7b3ff2', '#ff3d9a', '#ff7a45', '#ffc857'];

export default function Resultado({ S, t, say, onNew, titleRef, animar }) {
  const R = S.summary;
  const [copied, setCopied] = useState(false);
  const [stars, setStars] = useState([]);
  /* al aparecer, unas estrellitas salen del título (solo con Animaciones encendidas) */
  useEffect(() => {
    if (!animar) return undefined;
    const h = titleRef.current, x = h ? h.offsetLeft + h.offsetWidth / 2 : 60, y = h ? h.offsetTop + h.offsetHeight / 2 : 30;
    setStars(Array.from({ length: 14 }, (_, i) => { const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4, r = 60 + Math.random() * 70; return { x, y, c: STAR_C[i % 5], dx: (Math.cos(a) * r).toFixed(0), dy: (Math.sin(a) * r * 0.7).toFixed(0) }; }));
    const k = setTimeout(() => setStars([]), 1400);
    return () => clearTimeout(k);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = () => {
    if (!R.text || !navigator.clipboard) return;
    navigator.clipboard.writeText(R.text).then(() => { say(t('res_copiado')); setCopied(true); setTimeout(() => setCopied(false), 1800); }, () => {});
  };
  const pasos = S.plan.steps.map((st, i) => [st, i, S.results[st.id]]).filter(([, , r]) => r && String(r.output || '').trim());

  return (
    <section id="vResult" data-clarity-mask="true" className="result card" aria-labelledby="resTitle">
      <h2 id="resTitle" tabIndex={-1} ref={titleRef}>{t('res_titulo')}</h2>
      {R.skipped ? <p id="resNote" className="hint">{t('res_saltados', { n: R.skipped })}</p> : null}
      {R.text ? <Texto id="resText" text={R.text} /> : <div id="resText" className="rtext"><p className="hint">{t('res_vacio')}</p></div>}
      <Sintesis Y={R.synth} t={t} />
      {R.files.length ? (
        <div id="resFiles" className="btns">
          {R.files.map((f, i) => <button key={i} type="button" className="btn btn-w" data-alias="download" onClick={() => download(f, t, say)}><Icono n="dl" /><span>{t('res_archivo', { name: f.name })}</span></button>)}
        </div>
      ) : null}
      {R.sources.length ? (
        <div id="resSrcWrap"><h3 className="sub">{t('res_fuentes')}</h3>
          <ul id="resSources" className="srcs">{R.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer nofollow">{s.title}</a></li>)}</ul>
        </div>
      ) : null}
      {pasos.length ? (
        <div id="resStepsWrap"><h3 className="sub">{t('res_pasos')}</h3>
          <div id="resSteps">{pasos.map(([st, i, r]) => <details className="sout" key={st.id}><summary>{t('paso_n', { n: i + 1 }) + ' · ' + st.title}</summary><Texto text={r.output} /></details>)}</div>
        </div>
      ) : null}
      <div className="btns">
        <button type="button" className="btn" id="bCopy" onClick={copy}><Icono n="copy" /><span>{t(copied ? 'res_copiado' : 'res_copiar')}</span></button>
        <button type="button" className="btn ghost" id="bNew" onClick={onNew}>{t('res_nuevo')}</button>
      </div>
      {stars.map((s, i) => <i key={i} className="al-star" aria-hidden="true" style={{ left: s.x + 'px', top: s.y + 'px', '--c': s.c, '--dx': s.dx + 'px', '--dy': s.dy + 'px' }} />)}
    </section>
  );
}
