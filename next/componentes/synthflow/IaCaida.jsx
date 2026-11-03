'use client';
/* v3.8 · «Esta IA no está respondiendo ahora»
   El motor (06c-ia-sana.js) avisa con el evento «sz-ia-caida» cuando la IA que elegiste no responde.
   Ya la quitó de la lista y te devolvió a la de antes; aquí se te pregunta para qué la querías:
   · «Solo quería probar» → sigues navegando (la lista ya está sin las caídas);
   · «La quiero para…» → te recomienda la que SÍ funciona y mejor sirve para eso, y te deja listo para escribir. */
import { useEffect, useRef, useState } from 'react';

const T = {
  es:{
    title:n => n + ' no está respondiendo ahora',
    down:'Parece que se tomó un descanso largo. Ya la quité de la lista para que no te vuelva a pasar.',
    busy:'Está muy ocupada en este momento. La escondí unos minutos de la lista; vuelve sola cuando se desocupe.',
    back:'Sigues con la IA que tenías.', q:'¿Para qué la querías?',
    tryit:'Solo quería probar', ph:'La quiero para… (ej.: mi tarea de inglés)', find:'Buscar otra',
    finding:'Buscando una que sí responda…', rec:(n, t) => t ? n + ' funciona ahora y es buena para ' + t.toLowerCase() + '.' : n + ' funciona ahora y te sirve para eso.',
    use:n => 'Usar ' + n, all:'Ver todas', none:'Ahora mismo no encontré otra libre. Prueba con «Automática» en un ratito.', close:'Cerrar',
    ok:'Listo: la lista ya solo muestra las IAs que funcionan.'
  },
  en:{
    title:n => n + " isn't answering right now",
    down:"Looks like it's taking a long break. I removed it from the list so it won't happen again.",
    busy:"It's very busy right now. I hid it from the list for a few minutes; it comes back on its own.",
    back:"You're still with the AI you had.", q:'What did you want it for?',
    tryit:'I was just trying it', ph:'I want it for… (e.g. my English homework)', find:'Find another',
    finding:'Looking for one that answers…', rec:(n, t) => t ? n + ' works right now and is good for ' + t.toLowerCase() + '.' : n + ' works right now and fits that.',
    use:n => 'Use ' + n, all:'See all', none:"I couldn't find another free one right now. Try «Automatic» in a moment.", close:'Close',
    ok:'Done: the list now only shows AIs that work.'
  }
};

function Recomendada({ t, rec, onUse, onAll }){
  if (rec === 'none') return <p className="iac-rec">{t.none}</p>;
  return (
    <div className="iac-rec">
      <p>{t.rec(rec.name, rec.topic)}</p>
      <div className="tbtn">
        <button type="button" className="lnk" onClick={onAll}>{t.all}</button>
        <button type="button" className="btn" onClick={() => onUse(rec.id)}>{t.use(rec.name)}</button>
      </div>
    </div>
  );
}

export default function IaCaida(){
  const [ev, setEv] = useState(null), [on, setOn] = useState(false), [txt, setTxt] = useState(''), [rec, setRec] = useState(null), [busy, setBusy] = useState(false);
  const inRef = useRef(null), boxRef = useRef(null);
  const F = () => (typeof window !== 'undefined' && window.SZFlow) || null;
  const lang = () => { try{ return (F() && F().lang()) === 'en' ? 'en' : 'es'; }catch(e){ return 'es'; } };
  const t = T[ev ? ev.lang : 'es'];

  useEffect(() => {
    const open = e => { setEv(Object.assign({}, e.detail, { lang:lang() })); setTxt(''); setRec(null); setBusy(false); requestAnimationFrame(() => setOn(true)); };
    addEventListener('sz-ia-caida', open);
    return () => removeEventListener('sz-ia-caida', open);
  }, []);
  useEffect(() => {
    if (!ev) return;
    const k = e => { if (e.key === 'Escape'){ e.stopPropagation(); close(); } };
    addEventListener('keydown', k, true);
    const f = boxRef.current && boxRef.current.querySelector('button'); if (f) f.focus();
    return () => removeEventListener('keydown', k, true);
  }, [ev]);

  if (!ev) return null;
  function close(msg){ setOn(false); setTimeout(() => setEv(null), 380); if (msg && window.SZ && window.SZ.toast) window.SZ.toast(msg); }
  async function find(e){
    e.preventDefault(); if (busy) return;
    setBusy(true); setRec(null);
    try{ const r = F() ? await F().iaFor(txt.trim(), ev.id) : null; setRec(r || 'none'); }catch(x){ setRec('none'); }
    setBusy(false);
  }
  const use = id => { close(); if (F()) F().iaUse(id); };
  const all = () => { close(); if (F()) setTimeout(() => F().iaList(), 400); };

  return (
    <div className={'szm iac notr' + (on ? ' on' : '')} id="iaCaida" onPointerDown={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="tcard" role="dialog" aria-modal="true" aria-labelledby="iacT" ref={boxRef}>
        <div className="iac-ico" aria-hidden="true"><span /><span /><span /></div>
        <h2 id="iacT">{t.title(ev.name)}</h2>
        <p className="iac-sub">{ev.why === 'down' ? t.down : t.busy}{ev.from === 'solo' ? ' ' + t.back : ''}</p>
        <div className="tn">{t.q}</div>
        <button type="button" className="iac-try" onClick={() => close(t.ok)}>{t.tryit}</button>
        <form className="iac-para" onSubmit={find}>
          <input ref={inRef} value={txt} onChange={e => setTxt(e.target.value)} placeholder={t.ph} aria-label={t.ph} maxLength={200} />
          <button type="submit" className="btn" disabled={busy}>{busy ? '…' : t.find}</button>
        </form>
        {busy ? <p className="iac-rec iac-wait">{t.finding}</p> : null}
        {rec && !busy ? <Recomendada t={t} rec={rec} onUse={use} onAll={all} /> : null}
        <div className="tbtn iac-foot"><span /><button type="button" className="lnk" onClick={() => close()}>{t.close}</button></div>
      </div>
    </div>
  );
}
