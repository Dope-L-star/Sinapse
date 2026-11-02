'use client';
/* Pulsem › Llaves: las llaves gratis que comparten las IAs conectadas, y las tuyas. */
import { useState } from 'react';
import { Card, Html } from './comunes';

const PROVS = [
  ['groq', 'https://console.groq.com/keys'], ['mistral', 'https://console.mistral.ai/api-keys'],
  ['cloudflare', 'https://dash.cloudflare.com/profile/api-tokens'], ['openrouter', 'https://openrouter.ai/keys'],
  ['google', 'https://aistudio.google.com/apikey'], ['ollama', 'https://ollama.com/settings/keys'],
  ['siliconflow', 'https://cloud.siliconflow.com/account/ak'], ['tavily', 'https://app.tavily.com/home'],
  ['exa', 'https://dashboard.exa.ai/api-keys'], ['pollinations', 'https://enter.pollinations.ai'],
];
const vendor = (id) => ({ id, vendor: id === 'mistral' ? 'mistralai' : id });

/* Un botón que se apaga y dice «Probando…» mientras trabaja. */
function BotonOcupado({ className, label, busyLabel, onRun, ...rest }) {
  const [busy, setBusy] = useState(false);
  return (
    <button {...rest} className={className} type="button" disabled={busy || rest.disabled}
      onClick={async () => { setBusy(true); try { await onRun(); } finally { setBusy(false); } }}>
      {busy ? busyLabel : label}
    </button>
  );
}

function estado(k, t) {
  const c = k.check;
  if (k.down) return ['off', t.keyPaused(k.down)];
  if (c) return [c.ok ? (c.kind === 'busy' ? 'warn' : 'ok') : c.kind === 'limit' ? 'warn' : 'off', c.state + (c.t ? ' · ' + t.agoT(c.t) : '')];
  return ['', t.keyUntested];
}

export default function Llaves({ P, T, t, SZ, keysPost, delKey }) {
  const ks = (T && T.keys) || P.keys || [], can = !!P.canEdit;
  const mine = (T && T.mine) || {};
  const [val, setVal] = useState({});
  const [cfa, setCfa] = useState(null);
  const cfAcc = cfa ?? ((T && T.cfAccount) || '');

  const save = async (id) => {
    const v = (val[id] || '').trim(), body = { action: 'keys' };
    if (v) body[id] = v;
    if (id === 'cloudflare') body.cfAccount = cfAcc.trim();
    if (!v && !(id === 'cloudflare' && body.cfAccount)) { SZ.toast(t.pasteKey(t.provs[id][0])); return; }
    if (id === 'groq' && v && !/^gsk_/.test(v)) { SZ.toast(t.notGroq); return; }
    if (id === 'openrouter' && v && !/^sk-or-/.test(v)) { SZ.toast(t.notOR); return; }
    if (await keysPost(body)) setVal((o) => Object.assign({}, o, { [id]: '' }));
  };
  const quitar = async (id) => {
    if (!(await SZ.szConfirm(t.removeQ(t.provs[id][0]), t.removeP, t.remove, true))) return;
    await keysPost({ action: 'keys', [id]: '' });
  };

  return (
    <Card i={0} cg="#c9566c" id="cKeys">
      <h2>{t.keysH}<small id="kN">{t.keysN(ks.length, (T && T.models && T.models.n) || 0)}</small></h2>
      <p className="lead">{t.keysLead}</p>
      <div className="tbtn" style={{ justifyContent: 'flex-end', margin: '-6px 0 10px' }}>
        {can && ks.length ? <BotonOcupado className="mini" id="kAll" label={t.testAll} busyLabel={t.testingAll} onRun={() => keysPost({ action: 'check' })} /> : null}
      </div>
      <div className="ktab" id="kList">
        {ks.length ? ks.map((k, i) => {
          const [d, s] = estado(k, t);
          const isMine = k.mine || (k.owner && T && T.keys && T.keys.find((x) => x.id === k.id && x.mine));
          const pct = k.cap ? Math.min(1, (k.n || 0) / k.cap) : 0, name = k.provName || k.prov;
          return (
            <div className="krow" style={{ '--i': i }} key={k.id}>
              <i className={'dot ' + d} />
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Html html={SZ.glassIcon({ id: k.prov, vendor: k.prov === 'mistral' ? 'mistralai' : k.prov }, 'sm')} style={{ display: 'contents' }} />
                <div><b>{name}</b><small>{(k.owner ? k.owner.name + ' · ' + k.owner.rank : '') + (k.key ? ' · ' + k.key : '') + (k.src === 'vercel' ? ' · Vercel' : '')}</small></div>
              </div>
              <div><small>{s}</small>{k.check && !k.check.ok && k.check.detail ? <small style={{ color: '#ffc0b2' }}>{t.keySaid(name, k.check.detail)}</small> : null}</div>
              <div className="kmeter" style={{ minWidth: 110 }}><div className="meter"><i style={{ transform: 'scaleX(' + pct.toFixed(3) + ')' }} /></div><small>{t.keyToday(t.fmt(k.n || 0), t.fmt(k.cap || 0), t.fmt(k.tok || 0))}</small></div>
              <div className="kact">
                {can || isMine ? (
                  <>
                    <BotonOcupado className="mini" label={SZ.t('pm.test')} busyLabel={t.testing} onRun={() => keysPost({ action: 'check', id: k.id })} />
                    {k.src === 'vercel' ? null : <BotonOcupado className="mini kdel" label={SZ.t('pm.del')} busyLabel={SZ.t('pm.deling')} onRun={() => delKey(k.id, name, !!isMine)} />}
                  </>
                ) : null}
              </div>
            </div>
          );
        }) : <div className="empty">{t.noKeys}</div>}
      </div>

      <h2 style={{ marginTop: 22, fontSize: 22 }}>{t.myKeysH}</h2>
      <p className="lead" id="kMine">{P.rank === 'Symmetrix' ? t.myKeysSym : t.myKeysAll}</p>
      <div className="mykeys" id="myKeys">
        {PROVS.map(([id, url]) => {
          const on = !!mine[id], [name, ph, note] = t.provs[id];
          return (
            <div className="mk" data-p={id} key={id}>
              <div className="mh"><Html html={SZ.glassIcon(vendor(id), 'sm')} style={{ display: 'contents' }} /><b>{name}</b><em className={on ? 'on' : ''}>{on ? t.saved : t.noKey}</em></div>
              {note ? <p className="cnote" style={{ margin: '4px 0 8px' }}>{note}</p> : null}
              <label className="field">
                <input type="text" data-sec="1" data-k={id} placeholder={on ? t.pasteOther : ph} autoComplete="off" data-lpignore="true" data-1p-ignore="" data-form-type="other" spellCheck={false}
                  value={val[id] || ''} onChange={(e) => { const v = e.target.value; setVal((o) => Object.assign({}, o, { [id]: v })); }} />
              </label>
              {id === 'cloudflare' ? <label className="field"><input type="text" data-cfa="" placeholder={t.cfAccount} autoComplete="off" spellCheck={false} value={cfAcc} onChange={(e) => setCfa(e.target.value)} /></label> : null}
              <div className="acts">
                <BotonOcupado className="btn sm" label={t.saveTest} busyLabel={t.saving} onRun={() => save(id)} />
                {on ? <BotonOcupado className="lnk" label={t.remove} busyLabel={t.removing} onRun={() => quitar(id)} /> : null}
                <a className="lnk" href={url} target="_blank" rel="noopener noreferrer">{t.getFree}</a>
              </div>
            </div>
          );
        })}
      </div>
      <div className="note">{t.freeNote[0]}<b>{t.freeNote[1]}</b>{t.freeNote[2]}<a className="lnk" href="https://openrouter.ai/settings/privacy" target="_blank" rel="noopener noreferrer">settings/privacy</a>{t.freeNote[3]}</div>
    </Card>
  );
}
