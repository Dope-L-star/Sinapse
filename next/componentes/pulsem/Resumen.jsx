'use client';
/* Pulsem › Resumen: salud de la página, quién está en línea, dificultades y carga. */
import { useState } from 'react';
import { Card, Av, Lista, Chips, rc } from './comunes';
import { useCuenta } from './usos';

const LV_COLOR = { ok: ['#7fd6b8', '✓'], busy: ['#f2b36b', '!'], down: ['#ff8f7a', '!!'], off: ['#8d909c', '–'] };

export function salud(P, t) {
  const keys = P.keys || [], tot = keys.length, ok = keys.filter((k) => !k.down).length, now = P.now;
  const recent = (P.events || []).filter((e) => now - e.t < 10 * 60e3), errs = recent.filter((e) => e.kind === 'error' || e.kind === 'jserror').length;
  const load5 = (P.perMin || []).slice(-5).reduce((a, b) => a + b, 0), d0 = (P.stat || [])[0] || {}, req = d0.req || 0, fail = d0.fail || 0, fr = fail / Math.max(1, req + fail);
  const why = []; let lv = 'ok';
  const up = (l) => { const o = ['ok', 'busy', 'down']; if (o.indexOf(l) > o.indexOf(lv)) lv = l; };
  if (!tot) { lv = 'off'; why.push(t.whyNoKeys); }
  else {
    why.push(t.whyKeys(ok, tot));
    if (!ok) up('down'); else if (ok < tot / 2) up('busy');
    if (fail >= 5 && fr > 0.3) up('down'); else if (fail >= 3 && fr > 0.1) up('busy');
    if (fail) why.push(t.whyFail(fail));
    if (errs >= 15) up('down'); else if (errs >= 5) up('busy');
    if (errs) why.push(t.whyErr(errs));
    if (load5 >= 120) up('busy');
    why.push(t.whyLoad(load5));
  }
  return { lv, why };
}

/* cuántas personas tuvieron dificultades en la última hora (también es el numerito del menú) */
export const conProblemas = (P) => new Set((P.events || []).filter((e) => P.now - e.t < 3600e3 && e.kind !== 'reload').map((e) => e.who)).size;

function Kpi({ v, label, t, dec }) {
  const n = useCuenta(dec ? 0 : v);
  return <div className="kpi"><b>{dec ? (v ? t.dec(v) : '–') : t.fmt(n)}</b><span>{label}</span></div>;
}

export function Alerta({ P, t }) {
  const L = P.alerts || [];
  if (!L.length) return null;
  return (
    <div id="pAlert" className="card palert">
      <b>{t.alertH}</b>
      <p>{L.map((a, i) => { const [n, rest] = t.alertLine(a.name); return <span key={i}>{i ? <br /> : null}<strong>{n}</strong>{rest}{a.t ? ' (' + t.agoT(a.t) + ')' : ''}{a.msg ? ': «' + a.msg + '»' : ''}</span>; })}</p>
      <p className="cnote">{t.alertNote}</p>
    </div>
  );
}

export function Salud({ P, t, SZ, i }) {
  const h = salud(P, t), [col, mark] = LV_COLOR[h.lv], [title, text] = t.lv[h.lv], d0 = (P.stat || [])[0] || {};
  const U = P.use || {};
  const B = [[t.useVercel, U.req || 0, 100000], [t.useUpstash, U.cmd || 0, 500000]];
  return (
    <Card i={i} id="cHealth" cg={col} style={{ '--hc': col }}>
      <h2>{t.healthH}<small>{t.healthSm}</small></h2>
      <div className="health">
        <div className="lamp" id="hLamp"><b>{mark}</b></div>
        <div className="hinfo"><h3 id="hTitle">{title}</h3><p id="hText">{text}</p><div className="hwhy" id="hWhy">{h.why.map((w, k) => <span key={k}>{w}</span>)}</div></div>
      </div>
      <svg className="ekgbig" viewBox="0 0 600 46" preserveAspectRatio="none" aria-hidden="true"><path d="M0 26h120l10-14 10 26 8-30 9 30 7-12h90l10-10 10 20 8-24 9 24 7-10h112l10-14 10 26 8-30 9 30 7-12h56" /></svg>
      <div className="kpis" id="hKpi">
        <Kpi t={t} v={(P.online || []).length} label={t.kOnline} />
        <Kpi t={t} v={d0.req || 0} label={t.kMsgs} />
        <Kpi t={t} v={SZ.coinsOf(d0.tok || 0)} label={SZ.t('pm.spent')} />
        <Kpi t={t} v={(d0.err || 0) + (d0.fail || 0)} label={t.kErr} />
        <Kpi t={t} v={d0.req ? (d0.ms || 0) / d0.req / 1000 : 0} label={t.kSec} dec />
      </div>
      <div className="use" id="hUse">
        <p className="usel">{t.useTitle(U.month || '')}</p>
        {B.map(([l, v, mx]) => {
          const p = Math.min(100, (v / mx) * 100), c = p >= 90 ? '#ff8f7a' : p >= 70 ? '#f2b36b' : '#7fd6b8';
          return <div className="ub" key={l}><span>{l}</span><i><b style={{ width: p.toFixed(1) + '%', background: c }} /></i><em>{t.useOf(t.fmt(v), t.fmt(mx), t.dec(p, p < 10 ? 1 : 0))}</em></div>;
        })}
        {B.some((x) => x[1] / x[2] >= 0.7) ? <p className="usew">{t.useWarn}</p> : null}
      </div>
    </Card>
  );
}

export function EnLinea({ P, t, i, onReach }) {
  const now = P.now, ev = P.events || [];
  const conf = new Set(ev.filter((e) => e.kind === 'confused' && now - e.t < 15 * 60e3).map((e) => e.who));
  const idle = (o) => !o.msgs && now - (o.since || now) > 4 * 60e3 && o.page === 'chat';
  const L = (P.online || []).map((o) => Object.assign({}, o, { trouble: (o.errs || 0) + (o.locked ? 3 : 0) + (conf.has(o.name) ? 2 : 0) + (idle(o) ? 1 : 0) }))
    .sort((a, b) => b.trouble - a.trouble || (b.t || 0) - (a.t || 0));
  return (
    <Card i={i} w="w7" cg="#8fb0ff" id="cOnline">
      <h2>{t.onlineH}<small id="oN">{t.people(L.length)}</small></h2>
      <p className="lead">{t.onlineLead}</p>
      <Lista id="oList">
        {L.length ? L.map((o, k) => {
          const sub = /^u:/.test(o.id) ? o.id.slice(2) : '';
          return (
            <div className="row" style={{ '--i': k }} key={o.id || k}>
              <Av rank={o.rank} name={o.name} />
              <div className="tx">
                <b>{o.name || t.someone} <span className={'rkp r-' + rc(o.rank)} style={{ fontSize: '9.5px', padding: '1px 7px', marginLeft: 4 }}>{o.rank || ''}</span></b>
                <small>{(t.pages[o.page] || o.page || '—') + ' · ' + (o.mobile ? t.phone : t.computer) + ' · ' + t.durT(now - (o.since || now))}</small>
              </div>
              <div className="tags">
                {o.locked ? <span className="tag bad">{t.tagNoAI}</span> : null}
                {o.errs ? <span className="tag bad">{t.tagErr(o.errs)}</span> : null}
                {conf.has(o.name) ? <span className="tag warn">{t.tagLost}</span> : null}
                {idle(o) ? <span className="tag warn">{t.tagIdle}</span> : null}
                {o.msgs ? <span className="tag ok">{t.tagMsgs(o.msgs)}</span> : null}
                {o.ai ? <span className="tag gold">{o.ai === 'synthz' ? t.connAIs : o.ai === 'puter' ? 'Puter' : o.ai}</span> : null}
                {sub ? <button className="mini gold" type="button" onClick={() => onReach(sub, o.name)}>{t.contact}</button> : null}
              </div>
            </div>
          );
        }) : <div className="empty">{t.noOne}</div>}
      </Lista>
    </Card>
  );
}

const KIND_CLS = { error: 'bad', jserror: 'bad', reload: 'warn', confused: 'warn', noai: 'bad', limit: 'warn', puter_out: 'warn', slow: 'warn' };

export function Dificultades({ P, t, i, onReach }) {
  const [filt, setFilt] = useState('all');
  const all = P.events || [];
  const match = (k) => (e) => k === 'all' || e.kind === k || (k === 'error' && e.kind === 'jserror');
  const ev = all.filter(match(filt));
  const n = conProblemas(P);
  return (
    <Card i={i} w="w5" cg="#ff8f7a" id="cTrouble">
      <h2>{t.troubleH}<small>{t.troubleSm}</small></h2>
      <p className="lead" id="tSum">{t.troubleSum(n)}</p>
      <Chips items={Object.entries(t.chips)} cur={filt} onPick={setFilt} counts={(k) => all.filter(match(k)).length} />
      <Lista id="tList">
        {ev.length ? ev.slice(0, 80).map((e, k) => (
          <div className="row" style={{ '--i': Math.min(k, 20) }} key={(e.t || 0) + ':' + k}>
            <Av rank={e.rank} name={e.who} />
            <div className="tx"><b>{e.who || t.someone}</b><small>{(e.detail || '—') + ' · ' + (t.pages[e.page] || e.page || '') + ' · ' + t.agoT(e.t)}</small></div>
            <div className="tags">
              <span className={'tag ' + (KIND_CLS[e.kind] || 'warn')}>{t.kind[e.kind] || e.kind}</span>
              {e.sub ? <button className="mini gold" type="button" onClick={() => onReach(e.sub, e.who)}>{t.contact}</button> : null}
            </div>
          </div>
        )) : <div className="empty">{t.nothing}</div>}
      </Lista>
    </Card>
  );
}

export function Carga({ P, t, i }) {
  const pm = P.perMin || [], mx = Math.max(1, ...pm);
  const st = (P.stat || []).slice().reverse(), m2 = Math.max(1, ...st.map((s) => s.req || 0));
  return (
    <Card i={i} cg="#e6b65f" id="cLoad">
      <h2>{t.loadH}<small id="lNow">{t.load5(pm.slice(-5).reduce((a, b) => a + b, 0))}</small></h2>
      <p className="lead">{t.loadLead}</p>
      <div className="bars" id="lBars">{pm.map((v, k) => <i key={k} className={v ? '' : 'z'} style={{ '--i': k, height: Math.max(4, (v / mx) * 100) + '%' }} title={t.barTip(v)} />)}</div>
      <div className="axis"><span>{t.ago30}</span><span>{t.now}</span></div>
      <div className="days" id="lDays">
        {st.map((s, k) => (
          <div className="day" key={s.day}><div className="col"><i style={{ '--i': k, height: Math.max(3, ((s.req || 0) / m2) * 100) + '%' }} /></div><b>{t.fmt(s.req || 0)}</b><small>{t.days[new Date(s.day + 'T12:00:00').getDay()] + ' ' + s.day.slice(8)}</small></div>
        ))}
      </div>
    </Card>
  );
}
