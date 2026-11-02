'use client';
/* Pulsem › Ajustes (Prime y ZFlow cambian; Symmetrix solo mira). */
import { useState } from 'react';
import { Card } from './comunes';

/* Un ajuste con su caja de texto. `key` = valor del servidor: si cambia, la caja vuelve a ese valor. */
function useCampo(server) {
  const [v, setV] = useState(null);
  return [v ?? server, setV, () => setV(null)];
}

function Guardar({ className = 'btn sm', label, run, t, ...rest }) {
  const [busy, setBusy] = useState(false);
  return <button className={className} type="button" disabled={busy || rest.disabled} onClick={async () => { setBusy(true); try { await run(); } catch (e) { /* run ya avisó */ } finally { setBusy(false); } }}>{busy ? t.saving : label}</button>;
}

export default function Ajustes({ P, T, t, SZ, post, setP, setT, reloadT }) {
  const can = !!P.canEdit, g = (T && T.google) || {}, dv = (T && T.drive) || {}, sp = P.supa || {}, mt = (T && T.maint) || {}, nw = (T && T.now) || null;
  const src = (s) => s === 'vercel' ? t.fromVercel : s === 'panel' ? t.fromPanel : '';
  const day = P.dayLimit || 20000, img = T && T.imgDay != null ? T.imgDay : 3;
  const [now, setNow, resetNow] = useCampo(nw ? nw.text : '');
  const [lim, setLim] = useCampo(String(day));
  const [im, setIm] = useCampo(String(img));
  const [gid, setGid, resetG] = useCampo(g.clientId || '');
  const [did, setDid, resetD] = useCampo(dv.clientId || '');
  const [mtx, setMtx] = useCampo(mt.text || '');
  const [sync, setSync] = useState('');

  const guard = (fn) => async () => { try { await fn(); } catch (e) { SZ.toast(e.message); throw e; } };

  return (
    <Card i={0} cg="#7fd6b8" id="cSet">
      <h2>{t.setH}<small>{t.setSm}</small></h2>
      {can ? null : <p className="lead" id="setNote">{t.setNote}</p>}
      <div className="setg" id="setG">
        <div className="set setnow">
          <b>{t.nowH}{nw ? <> <span className="mtlive">{t.nowLive}</span></> : null}</b>
          <p>{t.nowP}</p>
          <label className="field"><textarea id="sNow" rows={2} maxLength={300} placeholder={t.nowPh} value={now} onChange={(e) => setNow(e.target.value)} /></label>
          <div className="acts" style={{ marginTop: 8 }}>
            <Guardar t={t} label={t.save} run={guard(async () => { const d = await post('trial', { action: 'now', text: now.trim() }); setT((o) => Object.assign({}, o, { now: d.now })); resetNow(); SZ.toast(d.now ? t.nowSaved : t.nowCleared); })} />
            {nw ? <>
              <Guardar t={t} className="btn sm ghost" label={t.clear} run={guard(async () => { const d = await post('trial', { action: 'now', text: '' }); setT((o) => Object.assign({}, o, { now: d.now })); resetNow(); SZ.toast(t.nowCleared); })} />
              <small style={{ color: 'var(--mute)' }}>{(nw.by || t.team) + ' · ' + t.when(nw.t)}</small>
            </> : null}
          </div>
        </div>

        <div className="set">
          <b>{t.capH}</b>
          <p>{SZ.t('pm.capP', { tok: t.fmt(day), w: SZ.coinsFmt(SZ.coinsOf(day)) })}</p>
          {can ? <>
            <label className="field"><input type="number" min="1000" max="500000" step="1000" id="sLimit" value={lim} onChange={(e) => setLim(e.target.value)} /></label>
            <div className="acts" style={{ marginTop: 8 }}><Guardar t={t} label={t.save} run={guard(async () => { const d = await post('trial', { action: 'limit', dayLimit: +lim }); setP((o) => Object.assign({}, o, { dayLimit: d.dayLimit })); SZ.toast(t.limitSaved(t.fmt(d.dayLimit), Math.round(d.dayLimit / 800))); })} /></div>
          </> : <div className="val">{SZ.coinsFmt(SZ.coinsOf(day))} SynXCoin&apos;s</div>}
        </div>

        <div className="set">
          <b>{t.imgH}</b>
          <p>{t.imgP}</p>
          {can ? <>
            <label className="field"><input type="number" min="0" max="50" step="1" id="sImg" value={im} onChange={(e) => setIm(e.target.value)} /></label>
            <div className="acts"><Guardar t={t} className="mini" label={t.save} run={guard(async () => { const d = await post('trial', { action: 'limit', imgDay: +im }); setT((o) => Object.assign({}, o, { imgDay: d.imgDay })); SZ.toast(t.imgSaved(d.imgDay)); })} /></div>
          </> : <p><b>{img}</b> {t.imgPerDay}</p>}
        </div>

        <div className="set">
          <b>{t.gH}</b>
          <p>{t.gP}</p>
          {can ? <>
            <label className="field"><input type="text" id="sGoogle" placeholder="123456-abc….apps.googleusercontent.com" value={gid} spellCheck={false} disabled={g.source === 'vercel'} onChange={(e) => setGid(e.target.value)} /></label>
            <div className="acts" style={{ marginTop: 8 }}>
              <Guardar t={t} label={t.save} disabled={g.source === 'vercel'} run={guard(async () => { const v = gid.trim(); await post('trial', { action: 'google', clientId: v }); SZ.toast(v ? t.gSaved : t.idRemoved); await reloadT(); resetG(); })} />
              <small style={{ color: 'var(--mute)' }}>{g.clientId ? t.on + src(g.source) : t.off}</small>
            </div>
          </> : <div className="val">{g.clientId ? g.clientId.slice(0, 18) + '…' + src(g.source) : t.off}</div>}
        </div>

        <div className="set">
          <b>{t.dH}</b>
          <p>{t.dP[0]}<code>drive.appdata</code>{t.dP[1]}</p>
          {can ? <>
            <label className="field"><input type="text" id="sDrive" placeholder={t.optional} value={did} spellCheck={false} disabled={dv.source === 'vercel'} onChange={(e) => setDid(e.target.value)} /></label>
            <div className="acts" style={{ marginTop: 8 }}>
              <Guardar t={t} label={t.save} disabled={dv.source === 'vercel'} run={guard(async () => { const v = did.trim(); await post('trial', { action: 'drive', clientId: v }); SZ.toast(v ? t.dSaved : t.idRemoved); await reloadT(); resetD(); })} />
              <small style={{ color: 'var(--mute)' }}>{dv.clientId ? t.on + src(dv.source) : g.clientId ? t.useGoogle : t.off}</small>
            </div>
          </> : <div className="val">{dv.clientId ? t.on + src(dv.source) : t.useGoogle}</div>}
        </div>

        <div className="set">
          <b>{t.sbH}</b>
          <p>{sp.on ? t.sbOn : <>{t.sbOff[0]}<code>SUPABASE_SECRET_KEY</code>{t.sbOff[1]}</>}</p>
          <p>{sp.google ? t.sbG : t.sbGOff}</p>
          {(sp.errs || []).length ? <p className="cnote">{t.sbErrs + sp.errs.slice(0, 3).map((x) => x.m).join(' · ')}</p> : null}
          {P.rank === 'Prime' && sp.on ? (
            <div className="acts" style={{ marginTop: 8 }}>
              <button className="mini" type="button" disabled={!!sync} onClick={async () => {
                let cur = 0, n = 0, c = 0; setSync(t.sbCopying(0));
                try {
                  for (let i = 0; i < 200; i++) { const d = await post('trial', { action: 'sbsync', cursor: cur }); n += d.accounts; c += d.chats; setSync(t.sbCopying(n)); cur = d.cursor; if (d.done) break; }
                  SZ.toast(t.sbDone(n, c));
                } catch (e) { SZ.toast(e.message); } finally { setSync(''); }
              }}>{sync || t.sbSync}</button>
            </div>
          ) : null}
        </div>

        {can ? (
          <div className={'set' + (mt.on ? ' mton' : '')}>
            <b>{t.mtH}{mt.on ? <> <span className="mtlive">{t.mtLive}</span></> : null}</b>
            <p>{t.mtP}</p>
            <label className="field"><textarea id="sMaint" rows={3} maxLength={300} placeholder={t.mtPh} value={mtx} onChange={(e) => setMtx(e.target.value)} /></label>
            <div className="acts" style={{ marginTop: 8 }}>
              {[...(mt.on ? [[true, t.mtChange, 'btn sm'], [false, t.mtOff, 'btn sm ghost']] : [[true, t.mtOn, 'btn sm']])].map(([on, label, cls]) => (
                <Guardar key={label} t={t} className={cls} label={label} run={guard(async () => { const d = await post('trial', { action: 'maint', on, text: mtx }); setT((o) => Object.assign({}, o, { maint: d.maint })); SZ.toast(on ? t.mtSavedOn : t.mtSavedOff); })} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
