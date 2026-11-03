'use client';
/* ===== Pulsem en React (v3.8) =====
   Antes: pulsem.html + pulsem.js armaban el panel con innerHTML. Ahora cada parte es un componente React:
   · PulsemApp (este archivo): la puerta (iniciar sesión / solo el equipo) con su cabecera.
   · Cuando la cuenta es del equipo, se monta el panel nuevo: next/componentes/admin/PanelAdmin.jsx
     (Resumen, Llaves, Ajustes, Comentarios, Ayuda, «Para atender ahora», Ctrl+K), que se actualiza solo cada minuto.
   · textos.js: los textos de la puerta y la cabecera en español e inglés; cambian al instante al cambiar el idioma.
   De core.js se sigue usando lo compartido con el resto del sitio (cuenta, llamadas al servidor, avisos, íconos, SynthonIA). */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tx } from './textos';
import { useSZ, useLang, useReloj, still } from './usos';
import { Html, rc } from './comunes';
import PanelAdmin from '../admin/PanelAdmin';

const EKG = 'M3 17h13l4-10 6 18 5-13 4 5h26';

/* ---------- puerta: solo Prime, ZFlow y Symmetrix ---------- */
function Puerta({ kind, msg, SZ, t, onRetry, onLogin }) {
  const card = useRef(null), auth = useRef(null);
  useEffect(() => {
    if (card.current && card.current.animate && !still()) card.current.animate([{ opacity: 0, transform: 'translateY(20px) scale(.96)', filter: 'blur(8px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 700, easing: 'cubic-bezier(.22,1,.36,1)' });
  }, [kind]);
  useEffect(() => {
    if (kind !== 'login' || !SZ || !auth.current) return;
    auth.current.innerHTML = '';
    SZ.authBox(auth.current, () => setTimeout(onLogin, 300), () => SZ.toast(t.popupBlocked));
  }, [kind, SZ]); // eslint-disable-line react-hooks/exhaustive-deps
  const word = SZ ? <Html as="div" className="word" html={SZ.zWord('Synth')} /> : null;
  return (
    <section className="gate" id="gate">
      <div className="tcard" ref={card}>
        {kind === 'loading' ? <>
          <div className="tn">PULSEM</div>
          <div className="tb"><h3>{t.opening}</h3><p>{t.oneMoment}</p></div>
        </> : kind === 'login' ? <>
          {word}<div className="tn">{t.gateTeam}</div>
          <div className="tb"><h3>{t.gateLoginH}</h3><p>{t.gateLoginP}</p></div>
          <div id="gAuth" ref={auth} />
          <div className="tbtn" style={{ marginTop: 14 }}><a className="lnk" href="index.html">{t.back}</a></div>
        </> : kind === 'team' ? <>
          {word}<div className="tn">{t.gateTeam}</div>
          <div className="tb"><h3>{t.gateTeamH}</h3><p>{t.gateTeamP}</p></div>
          <div className="tbtn" style={{ marginTop: 14 }}><a className="lnk" href="index.html">{t.back}</a><a className="btn sm" href="chat.html">{t.toFlow}</a></div>
        </> : <>
          {word}<div className="tn">PULSEM</div>
          <div className="tb"><h3>{t.gateErrH}</h3><p>{msg || t.gateErrP}</p></div>
          <div className="tbtn" style={{ marginTop: 14 }}><a className="lnk" href="index.html">{t.back}</a><button className="btn sm" type="button" id="gRetry" onClick={onRetry}>{t.retry}</button></div>
        </>}
      </div>
    </section>
  );
}

/* ---------- cabecera ---------- */
function Cabecera({ SZ, t, P, live, spin, onRefresh }) {
  useReloj(5000);
  const liveTxt = !live.ok ? t.connecting : live.off ? t.offline : Date.now() - live.ok < 5000 ? t.liveNow : t.liveAgo(t.agoT(live.ok));
  return (
    <header className="ptop">
      {SZ ? <Html as="a" href="index.html" className="word" id="pWord" aria-label={t.back} html={SZ.zWord('Synth')} /> : <a href="index.html" className="word" id="pWord" aria-label={t.back} />}
      <div className="ptitle pmlogo" aria-label="Pulsem">
        <svg className="pmg" viewBox="0 0 64 30" aria-hidden="true">
          <defs>
            <linearGradient id="pmG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd0e4" stopOpacity=".95" /><stop offset=".45" stopColor="#c486e0" stopOpacity=".7" /><stop offset="1" stopColor="#ff9c8c" stopOpacity=".9" /></linearGradient>
            <linearGradient id="pmL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
          </defs>
          <path className="pm-t" d={EKG} /><path className="pm-h" d={EKG} /><path className="pm-r" d={EKG} pathLength="100" />
        </svg>
        <span className="pmw"><span className="gS">P</span>ulsem</span>
      </div>
      <span className={'rkp' + (P ? ' r-' + rc(P.rank) : '')} id="pRank">{P ? P.rank : ''}</span>
      <span className="sp" />
      <span className={'live' + (live.off ? ' off' : '')} id="pLive"><i /><span id="pLiveT">{liveTxt}</span></span>
      {/* v3.8 · idioma a un toque (antes había que ir a SynthFlow › Ajustes) */}
      <button className="ibtn plang" type="button" id="pLang" aria-label={t.langAria} title={t.langBtn} data-mv-no="" onClick={() => SZ && SZ.setLang(t.lang === 'es' ? 'en' : 'es')}>{t.lang === 'es' ? 'EN' : 'ES'}</button>
      <button className={'ibtn' + (spin ? ' spin' : '')} id="pRefresh" type="button" aria-label={t.refresh} title={t.refresh} onClick={onRefresh}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg>
      </button>
      <a className="ibtn" href="chat.html" aria-label={t.toFlow} title={t.toFlow}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" /><path d="M20 9h1a1 1 0 0 1 1 1v8l-3-2h-6" /></svg>
      </a>
    </header>
  );
}

export default function PulsemApp() {
  const SZ = useSZ();
  const lang = useLang();
  const t = useMemo(() => tx(lang), [lang]);
  const [P, setP] = useState(null);
  const [gate, setGate] = useState({ kind: 'loading' });
  const [live, setLive] = useState({ ok: 0, off: false });
  const [spin, setSpin] = useState(false);
  const Pref = useRef(null); Pref.current = P;
  const timer = useRef(0), panelOn = useRef(false);


  const load = useCallback(async (manual) => {
    if (!SZ) return;
    setSpin(true);
    try {
      if (!SZ.SESS_get()) { setGate({ kind: 'login' }); return; }
      const p = await SZ.api('health?panel=1', { keep: true });
      setP(p); setLive({ ok: Date.now(), off: false }); setGate(null); panelOn.current = true;
      if (manual) SZ.toast(tx(document.documentElement.lang === 'en' ? 'en' : 'es').upToDate);
    } catch (e) {
      if (e.status === 401) setGate({ kind: 'login' });
      else if (e.status === 403) setGate({ kind: 'team' });
      else if (!Pref.current) setGate({ kind: 'err', msg: e.message });
      else setLive((l) => Object.assign({}, l, { off: true }));
    } finally {
      setSpin(false);
      /* cada minuto, salvo con la pestaña escondida o mientras alguien escribe en un ajuste */
      clearTimeout(timer.current);
      if (panelOn.current) return;   /* el panel ya se actualiza solo cada minuto */
      const again = () => {
        timer.current = setTimeout(() => {
          const a = document.activeElement, busy = !!(a && a.closest && a.closest('.mk, .set, .hform, .szm') && a.value);
          if (!document.hidden && !busy) load(); else again();
        }, 60000);
      };
      again();
    }
  }, [SZ]);

  useEffect(() => { if (SZ) load(); return () => clearTimeout(timer.current); }, [SZ, load]);
  useEffect(() => {
    const vis = () => { if (!document.hidden && Pref.current && Date.now() - live.ok > 55000) load(); };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, [load, live.ok]);



  return (
    <>
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true"><defs>
      <linearGradient id="zgrad" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fb0ff" /><stop offset=".55" stopColor="#c9566c" /><stop offset="1" stopColor="#ff8f7a" /></linearGradient>
      <linearGradient id="ekgG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8fb0ff" /><stop offset=".6" stopColor="#c9566c" /><stop offset="1" stopColor="#e6b65f" /></linearGradient>
    </defs></svg>
    <div className="aurora"><i /><i /><i /></div>
    <div className="grain" />
    <div className="pz notr" data-react="pulsem">
      {gate ? <Cabecera SZ={SZ} t={t} P={P} live={live} spin={spin} onRefresh={() => load(true)} /> : null}
      {gate ? <Puerta kind={gate.kind} msg={gate.msg} SZ={SZ} t={t} onRetry={() => load()} onLogin={() => load()} /> : null}
      {!gate && P ? (
        <PanelAdmin api={SZ.api} toast={SZ.toast} onAuth={(st) => setGate({ kind: st === 401 ? 'login' : 'team' })} />
      ) : null}
      {SZ ? <Html as="div" className="corner" id="pCorner" aria-hidden="true" style={{ position: 'fixed', bottom: 8, right: 10, width: 15, height: 15, opacity: 0.55 }} html={'<svg viewBox="0 0 24 24">' + SZ.ICONS.claude('#d9805f', '#d9805f') + '</svg>'} /> : null}
    </div>
    </>
  );
}
