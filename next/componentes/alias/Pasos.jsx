'use client';
/* A.L.I.A.S. · lista de pasos: mover, renombrar y borrar antes de ejecutar; rehacer después. */
import { useEffect, useRef, useState } from 'react';
import { Icono } from './iconos';
import { Texto } from './Resultado';

const TOOLS = ['search', 'file', 'memory', 'image', 'think'];

function Punto({ st }) {
  return <span className="sdot" aria-hidden="true">{st === 'done' ? <Icono n="check" /> : st === 'error' ? <Icono n="x" /> : st === 'running' ? <i className="ring" /> : <i className="hole" />}</span>;
}
function Btn({ act, icon, label, off, wide, onClick }) {
  return (
    <button type="button" className={'iconbtn' + (off ? ' is-off' : '') + (wide ? ' wide' : '')} data-act={act}
      data-alias={act === 'ren' ? 'step-edit' : act === 'redo' ? 'redo' : undefined} aria-label={label} title={label} disabled={off} onClick={onClick}>
      <Icono n={icon} />
    </button>
  );
}

/* el título en edición: Enter guarda, Escape cancela, salir del campo guarda */
function Renombrar({ st, n, t, onDone }) {
  const ref = useRef(null), done = useRef(false);
  useEffect(() => { if (ref.current) { ref.current.focus(); ref.current.select(); } }, []);
  const fin = (save) => { if (done.current) return; done.current = true; onDone(save ? ref.current.value : '', save); };
  return (
    <input ref={ref} type="text" className="ren" data-alias="step-title" maxLength={120} defaultValue={st.title || ''} aria-label={t('rename_label', { n })}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fin(true); } else if (e.key === 'Escape') fin(false); }}
      onBlur={() => fin(true)} />
  );
}

/* v3.9 · enrutador: qué IA hizo el paso y por qué, en palabras simples, con 👍/👎 para que aprenda */
export function porQue(rt, t) {
  const cat = t('rt_cat_' + rt.cat);
  if (rt.why === 'synth') return t('rt_why_synth', { n: (rt.voices || []).length || 2, name: rt.name || 'A.L.I.A.S.' });
  if (rt.why === 'backup' && rt.first) return t(rt.slow ? 'rt_why_backup_slow' : 'rt_why_backup', { first: rt.first });
  return t('rt_why_' + (['quality', 'fast', 'learned'].includes(rt.why) ? rt.why : 'quality'), { cat });
}
function Ruta({ rt, id, S, t }) {
  const [, re] = useState(0);
  const voted = S.voted && S.voted[id];
  const vote = (up) => {
    if (voted) return;
    (S.voted = S.voted || {})[id] = up ? 'up' : 'down'; re((x) => x + 1);
    try { if (window.ALIAS && window.ALIAS.feedback) window.ALIAS.feedback(rt.cat, rt.model, up); } catch (e) { /* sin voto */ }
  };
  return (
    <div className="sroute" data-alias="route" data-cat={rt.cat}>
      <span className="sr-ico" aria-hidden="true"><Icono n="route" /></span>
      <span className="sr-txt">
        <b>{rt.why === 'synth' ? t('rt_hizo', { name: (rt.voices || []).join(' · ') || rt.name }) : t('rt_hizo', { name: rt.name })}</b>
        <small>{porQue(rt, t)} · {t('rt_tipo', { cat: t('rt_cat_' + rt.cat) })}</small>
      </span>
      {rt.model ? (
        <span className="sr-vote" role="group" aria-label={t('rt_tipo', { cat: t('rt_cat_' + rt.cat) })}>
          {voted ? <small className="sr-thx" role="status">{t('rt_gracias')}</small> : <>
            <button type="button" className="iconbtn" data-alias="route-up" aria-label={t('rt_bien')} title={t('rt_bien')} onClick={() => vote(true)}><Icono n="up_t" /></button>
            <button type="button" className="iconbtn" data-alias="route-down" aria-label={t('rt_mal')} title={t('rt_mal')} onClick={() => vote(false)}><Icono n="down_t" /></button>
          </>}
        </span>
      ) : null}
    </div>
  );
}

export default function Pasos({ S, t, act, focusRef }) {
  const steps = S.plan.steps, total = steps.length;
  const editable = S.phase === 'edit', canRedo = S.phase !== 'edit' && S.phase !== 'running';
  /* el check salta solo en el paso que acaba de terminar */
  const prev = useRef({});
  const pop = {};
  steps.forEach((st) => { const was = prev.current[st.id]; if ((S.status[st.id] || 'pending') === 'done' && was && was !== 'done') pop[st.id] = true; });
  useEffect(() => { const o = {}; steps.forEach((st) => { o[st.id] = S.skipped[st.id] ? 'skipped' : S.status[st.id] || 'pending'; }); prev.current = o; });

  return (
    <ol id="stepList" className="steps" aria-label={t('pasos_lista_aria')}>
      {steps.map((st, i) => {
        const n = i + 1, stt = S.status[st.id] || 'pending', skipped = !!S.skipped[st.id], r = S.results[st.id];
        const key = String(st.id);
        return (
          <li key={key} className={'step' + (pop[st.id] ? ' pop' : '')} data-alias="step" data-id={key} data-status={skipped ? 'skipped' : stt}
            aria-current={S.cur === st.id && S.phase === 'running' ? 'step' : undefined} ref={(el) => { if (el) focusRef.current[key] = el; }}>
            <span className="num" aria-hidden="true">{n}</span>
            <Punto st={stt} />
            <div className="sbody">
              {S.editing === st.id
                ? <Renombrar st={st} n={n} t={t} onDone={(v, save) => act('rename', st.id, { v, save })} />
                : <div className="stitle" data-alias="step-title">{st.title || t('paso_n', { n })}</div>}
              <div className="smeta">
                <span className="stag">{t('paso_n', { n })}</span>
                {TOOLS.includes(st.tool) ? <span className="stool">{t('tool_' + st.tool)}</span> : null}
                <span className="sst">{t(skipped ? 'st_skipped' : 'st_' + stt)}</span>
              </div>
              {stt === 'error' && S.errors[st.id] ? <div className="serr">{S.errors[st.id]}</div> : null}
              {r && r.route && r.route.cat && stt === 'done' ? <Ruta rt={r.route} id={st.id} S={S} t={t} /> : null}
              {r && (r.output || '').trim() ? (
                <details className="sout" open={!!S.open[st.id]} onToggle={(e) => { S.open[st.id] = e.currentTarget.open; }}>
                  <summary>{t('ver_salida')}</summary>
                  <Texto text={r.output} data-alias="step-output" />
                </details>
              ) : null}
            </div>
            <div className="sacts">
              {editable ? <>
                <Btn act="up" icon="up" label={t('btn_subir', { n })} off={i === 0} onClick={() => act('move', st.id, -1)} />
                <Btn act="down" icon="down" label={t('btn_bajar', { n })} off={i === total - 1} onClick={() => act('move', st.id, 1)} />
                <Btn act="ren" icon="edit" label={t('btn_renombrar', { n })} onClick={() => act('edit', st.id)} />
                <Btn act="del" icon="del" label={t('btn_borrar', { n })} off={total <= 1} onClick={() => act('del', st.id)} />
              </> : canRedo && (stt === 'done' || stt === 'error') ? <Btn act="redo" icon="redo" label={t('btn_rehacer', { n })} wide onClick={() => act('redo', st.id)} /> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
