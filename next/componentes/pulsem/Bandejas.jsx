'use client';
/* Pulsem › Comentarios de la beta, Ayuda (bandeja + conversación) y la ventanita «Contactar». */
import { useEffect, useRef, useState } from 'react';
import { Card, Av, Lista, Chips } from './comunes';
import { still } from './usos';

export const nuevos = (P) => (P.feedback || []).filter((x) => x.status === 'nuevo').length;
export const esperando = (P) => (P.help || []).filter((r) => r.status === 'open').length;

export function Comentarios({ P, t, SZ, post, setP, onReach }) {
  const [ff, setFf] = useState('nuevo');
  const [busy, setBusy] = useState('');
  const F = P.feedback || [], c = (k) => F.filter((x) => k === 'todos' || x.status === k).length;
  const L = F.filter((x) => ff === 'todos' || x.status === ff);
  const mark = async (id, status) => {
    setBusy(id + status);
    try {
      const d = await post('help', { action: 'fbset', id, status });
      setP((o) => Object.assign({}, o, { feedback: (o.feedback || []).map((x) => x.id === d.item.id ? d.item : x) }));
      SZ.toast(t.fbMarked(t.fbStatus[d.item.status] || d.item.status));
    } catch (e) { SZ.toast(e.message); } finally { setBusy(''); }
  };
  return (
    <Card i={0} cg="#e6b65f" id="cFb">
      <h2>{t.fbH}<small id="fN">{t.fbN(c('nuevo'))}</small></h2>
      <p className="lead">{t.fbLead}</p>
      <Chips items={Object.entries(t.fbChips)} cur={ff} onPick={setFf} counts={c} />
      <Lista id="fList" style={{ maxHeight: 360 }}>
        {L.length ? L.map((x, i) => (
          <div className="row" style={{ '--i': i }} key={x.id}>
            <Av rank={x.rank} name={x.who} />
            <div className="tx">
              <b>{(t.fbCat[x.cat] || x.cat) + ' · ' + x.who}</b>
              <small style={{ whiteSpace: 'normal' }}>{x.text}</small>
              <small>{(t.pages[x.page] || x.page || '') + ' · ' + t.agoT(x.t) + (x.by ? ' · ' + t.fbBy(t.fbStatus[x.status] || x.status, x.by) : '')}</small>
            </div>
            <div className="tags">
              {['visto', 'resuelto'].filter((s) => s !== x.status).map((s) => (
                <button key={s} className={'mini' + (s === 'resuelto' ? ' gold' : '')} type="button" disabled={busy === x.id + s} onClick={() => mark(x.id, s)}>{s === 'visto' ? t.fbSeen : t.fbDone}</button>
              ))}
              {x.sub ? <button className="mini" type="button" onClick={() => onReach(x.sub, x.who)}>{t.reply}</button> : null}
            </div>
          </div>
        )) : <div className="empty">{t.nothingStar}</div>}
      </Lista>
    </Card>
  );
}

export function Ayuda({ P, t, SZ, post, reload, helpCur, setHelpCur }) {
  const w = (r) => r.status === 'open' ? (r.urgent ? 0 : 1) : 2;
  const H = (P.help || []).slice().sort((a, b) => w(a) - w(b) || a.t - b.t), late = H.filter((r) => r.urgent).length;
  const [txt, setTxt] = useState('');
  const box = useRef(null), msgs = useRef(null);

  const open = async (id, quiet) => {
    try {
      const d = await SZ.api('help?id=' + encodeURIComponent(id), { keep: true });
      setHelpCur(d.item);
      if (!quiet) requestAnimationFrame(() => box.current && box.current.scrollIntoView({ block: 'nearest', behavior: still() ? 'auto' : 'smooth' }));
    } catch (e) { if (!quiet) SZ.toast(e.message); }
  };
  /* cada vez que Pulsem se actualiza, la conversación abierta también */
  useEffect(() => { if (helpCur) open(helpCur.id, true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [P]);
  useEffect(() => { if (msgs.current) msgs.current.scrollTop = 1e6; }, [helpCur]);

  const send = async (e) => {
    e.preventDefault(); const v = txt.trim(); if (!v || !helpCur) return;
    try { const d = await post('help', { action: 'say', id: helpCur.id, text: v }); setTxt(''); setHelpCur(d.item); } catch (er) { SZ.toast(er.message); }
  };
  const end = async () => {
    if (!helpCur) return;
    try { await post('help', { action: 'close', id: helpCur.id }); SZ.toast(t.helpEnded); setHelpCur(null); reload(); } catch (er) { SZ.toast(er.message); }
  };

  return (
    <Card i={0} cg="#b8c4ff" id="cHelp">
      <h2>{t.helpH}<small id="hN">{t.helpN(H.filter((r) => r.status === 'open').length, late)}</small></h2>
      <p className="lead">{t.helpLead}</p>
      <Lista id="hList" style={{ maxHeight: 300 }}>
        {H.length ? H.map((r, i) => {
          const u = r.user || {};
          return (
            <div className={'row' + (r.urgent ? ' urg' : '')} style={{ '--i': i }} key={r.id}>
              <Av rank={u.rank} name={u.username || u.name} />
              <div className="tx"><b>@{u.username || u.name || ''}</b><small>{r.text + ' · ' + t.agoT(r.t)}</small></div>
              <div className="tags">
                {r.status === 'open' ? <span className={'tag ' + (r.urgent ? 'bad' : 'warn')}>{r.urgent ? t.helpLate : t.helpNew}</span> : <span className="tag ok">{t.helpWith((r.by || {}).name || '')}</span>}
                <button className="mini gold" type="button" onClick={() => open(r.id)}>{t.open}</button>
              </div>
            </div>
          );
        }) : <div className="empty">{t.noHelp}</div>}
      </Lista>
      {helpCur ? (
        <div id="hConv" ref={box} style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <div className="tbtn" style={{ marginBottom: 8 }}>
            <b id="hWho" style={{ fontWeight: 500 }}>{'@' + (helpCur.user.username || helpCur.user.name) + (helpCur.page ? ' · ' + helpCur.page : '')}</b>
            {helpCur.status === 'done' ? null : <button className="lnk" type="button" id="hEnd" onClick={end}>{t.end}</button>}
          </div>
          <div className="lwrap"><div className="hcv" id="hMsgs" ref={msgs} data-blur="">
            {helpCur.msgs.map((m, i) => (
              <div key={i} className={'bub ' + (m.from === 'team' ? 't' : 'u')}><small>{(m.name || '') + (m.rank ? ' · ' + m.rank : '') + ' · ' + t.agoT(m.t)}</small>{m.text}</div>
            ))}
          </div></div>
          <form className="hform" id="hForm" onSubmit={send}>
            <label className="field"><input type="text" id="hInp" maxLength={1000} placeholder={t.replyPh} autoComplete="off" value={txt} onChange={(e) => setTxt(e.target.value)} /></label>
            <button className="btn sm" type="submit">{t.send}</button>
          </form>
        </div>
      ) : null}
    </Card>
  );
}

/* «Contactar»: el equipo le escribe primero a alguien; le aparece «Chat con…» en SymphorIA. */
export function Contactar({ who, P, t, SZ, post, onClose, onSent }) {
  const [on, setOn] = useState(false);
  const [txt, setTxt] = useState('');
  const [busy, setBusy] = useState(false);
  const area = useRef(null);
  useEffect(() => { const r = requestAnimationFrame(() => setOn(true)); const f = setTimeout(() => area.current && area.current.focus(), 80); return () => { cancelAnimationFrame(r); clearTimeout(f); }; }, []);
  const close = () => { setOn(false); setTimeout(onClose, still() ? 0 : 420); };
  const go = async () => {
    const v = txt.trim(); if (v.length < 2) { SZ.toast(t.writeMsg); return; }
    setBusy(true);
    try { const d = await post('help', { action: 'reach', sub: who.sub, text: v }); close(); SZ.toast(t.reachSent); onSent(d.item); } catch (er) { setBusy(false); SZ.toast(er.message); }
  };
  return (
    <div className={'szm' + (on ? ' on' : '')} onPointerDown={(e) => { if (e.target === e.currentTarget) close(); }} onKeyDown={(e) => { if (e.key === 'Escape') close(); }}>
      <div className="tcard" role="dialog" aria-modal="true" aria-label={t.contact}>
        <div className="word" dangerouslySetInnerHTML={{ __html: SZ.zWord('Synth') }} />
        <div className="tn">{t.reachTn(String(P.rank || '').toUpperCase())}</div>
        <div className="tb"><h3>{t.reachH(who.name || t.thisPerson)}</h3><p>{t.reachP}</p></div>
        <label className="field" style={{ marginTop: 12 }}><textarea ref={area} rows={3} maxLength={1000} id="rTxt" placeholder={t.reachPh} value={txt} onChange={(e) => setTxt(e.target.value)} /></label>
        <div className="tbtn" style={{ marginTop: 14 }}>
          <button className="lnk" type="button" onClick={close}>{t.cancel}</button>
          <button className="btn sm" type="button" id="rGo" disabled={busy} onClick={go}>{t.send}</button>
        </div>
      </div>
    </div>
  );
}

