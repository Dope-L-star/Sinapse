'use client';
/* SynthFlow en React · el panelito del perfil, igual que el de Claude.
   Se abre al tocar tu perfil en la barra (o la «Tú» del celular): tu usuario arriba, Ajustes, Idioma, Obtener ayuda, Planes,
   Más información y Cerrar sesión. «Ajustes» abre la ventana de Ajustes (que tiene dentro la sección Cuenta).
   v4.6 · el motor (src/chat/16-cuenta-synthz.js) avisa con el evento «synthflow-menu-cuenta» { anchor }; si React no está listo,
   el motor abre Ajustes › Cuenta directo (window.__mcListo = false). Los textos van fijos en español: el motor los traduce al inglés (idioma-en.json). */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: '1.7', strokeLinecap: 'round', strokeLinejoin: 'round' };
const I = {
  user: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1.4-3.8 4.2-5.6 7.5-5.6s6.1 1.8 7.5 5.6" /></svg>,
  cfg: <svg viewBox="0 0 24 24" {...P}><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></svg>,
  globe: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></svg>,
  help: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></svg>,
  plans: <svg viewBox="0 0 24 24" {...P}><path d="M12 3l2.2 5.1 5.5.5-4.2 3.7 1.3 5.4L12 14.8 7.2 17.7l1.3-5.4L4.3 8.6l5.5-.5z" /></svg>,
  pulse: <svg viewBox="0 0 24 24" {...P}><path d="M2 12h4l2.5-6 4 12 3-8 1.5 2H22" /></svg>,
  info: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>,
  book: <svg viewBox="0 0 24 24" {...P}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13z" /></svg>,
  batt: <svg viewBox="0 0 24 24" {...P}><rect x="3" y="7.5" width="16" height="9" rx="2.2" /><path d="M21 10.5v3" /></svg>,
  doc: <svg viewBox="0 0 24 24" {...P}><path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z" /><path d="M14 3.5v4h4M9.5 12h5M9.5 15.5h5" /></svg>,
  shield: <svg viewBox="0 0 24 24" {...P}><path d="M12 3l7 3v5.5c0 4.2-2.8 7.4-7 9.5-4.2-2.1-7-5.3-7-9.5V6z" /></svg>,
  out: <svg viewBox="0 0 24 24" {...P}><path d="M10 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H10M15 8l4 4-4 4M19 12H9.5" /></svg>,
  chev: <svg viewBox="0 0 24 24" {...P} strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>,
  back: <svg viewBox="0 0 24 24" {...P} strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>,
  ok: <svg viewBox="0 0 24 24" {...P} strokeWidth="2.2"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>,
};

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
const phone = () => typeof window !== 'undefined' && window.matchMedia('(max-width:760px)').matches;
const SZ = () => (typeof window !== 'undefined' ? window.SZ : null);
const F = () => (typeof window !== 'undefined' ? window.SZFlow : null);

function leer(){
  const sz = SZ(), A = sz?.ACC || {}, u = A.user || {};
  return {
    ready: !!A.ready,
    handle: A.ready ? (sz.accHandle?.(u) || sz.accName?.() || '') : '',
    plan: A.ready ? (sz.ROLE_NAME?.[u.role || 'user'] || 'Synther') : '',
    team: ['owner', 'admin', 'staff'].includes(u.role),
    lang: sz?.lang?.() || 'es',
  };
}

export default function MenuCuenta(){
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState(null);          // null | 'lang' | 'more'
  const [info, setInfo] = useState(leer);
  const [pos, setPos] = useState(null);
  const [subTop, setSubTop] = useState(0);
  const [mounted, setMounted] = useState(false);
  const box = useRef(null), from = useRef(null);

  const close = useCallback((volver = true) => {
    setOpen(false); setSub(null);
    if (volver) { const a = from.current; if (a && a.isConnected && a.offsetParent !== null) a.focus?.({ preventScroll: true }); }
  }, []);

  useEffect(() => { setMounted(true); }, []);

  /* el motor avisa cuando hay que abrirlo */
  useEffect(() => {
    const on = e => {
      const a = e.detail?.anchor;
      from.current = (a && a.offsetParent !== null) ? a : (document.getElementById('sAcc') || a || null);
      setInfo(leer()); setSub(null); setOpen(o => !o);
    };
    addEventListener('synthflow-menu-cuenta', on);
    window.__mcListo = true;
    return () => { removeEventListener('synthflow-menu-cuenta', on); window.__mcListo = false; };
  }, []);

  /* Ctrl + , abre Ajustes (como en Claude) */
  useEffect(() => {
    const k = e => { if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key === ',') { e.preventDefault(); close(false); F()?.settings?.(); } };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [close]);

  /* dónde se dibuja: encima del botón del perfil (o a su derecha si es la barrita angosta); en el celular, como hoja desde abajo */
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (phone()) { setPos({ sheet: true }); return; }
      const a = from.current, r = a ? a.getBoundingClientRect() : null;
      if (!r) { setPos({ left: 12, bottom: 12, w: 280 }); return; }
      const narrow = r.width < 120, w = Math.min(300, Math.max(268, narrow ? 280 : r.width));
      if (narrow) setPos({ left: Math.min(r.right + 8, innerWidth - w - 8), bottom: Math.max(8, innerHeight - r.bottom), w });
      else setPos({ left: Math.max(8, Math.min(r.left, innerWidth - w - 8)), bottom: Math.max(8, innerHeight - r.top + 6), w });
    };
    place();
    addEventListener('resize', place);
    return () => removeEventListener('resize', place);
  }, [open]);

  /* clic afuera, Esc y flechas */
  useEffect(() => {
    if (!open) return;
    const down = e => { const b = box.current; if (b && !b.contains(e.target) && !(from.current && from.current.contains(e.target))) close(false); };
    const key = e => {
      const b = box.current; if (!b) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (sub && phone()) setSub(null); else close(); return; }
      const items = [...b.querySelectorAll(sub && !phone() && b.contains(document.activeElement) && document.activeElement.closest('.mc-sub') ? '.mc-sub [role^="menuitem"]' : '.mc-main [role^="menuitem"]')].filter(x => x.offsetParent !== null);
      const i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
      else if (e.key === 'Home') { e.preventDefault(); items[0]?.focus(); }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus(); }
      else if (e.key === 'ArrowRight' && document.activeElement?.dataset?.sub) { e.preventDefault(); document.activeElement.click(); }
      else if (e.key === 'ArrowLeft' && sub) { e.preventDefault(); const t = b.querySelector('.mc-main [data-sub="' + sub + '"]'); setSub(null); t?.focus(); }
    };
    addEventListener('pointerdown', down, true);
    addEventListener('keydown', key, true);
    return () => { removeEventListener('pointerdown', down, true); removeEventListener('keydown', key, true); };
  }, [open, sub, close]);

  /* al abrir, el foco va al primer renglón (teclado y lectores de pantalla) */
  useEffect(() => { if (open && pos) { const t = setTimeout(() => box.current?.querySelector('.mc-main [role^="menuitem"]')?.focus({ preventScroll: true }), 30); return () => clearTimeout(t); } }, [open, !!pos]);

  const act = fn => () => { close(false); try { window.SZ?.SND?.tap?.(); } catch {} setTimeout(() => { try { fn(); } catch {} }, 60); };
  const openSub = (k, e) => {
    if (sub === k) { setSub(null); return; }
    setSubTop(e.currentTarget.offsetTop - 6); setSub(k);
    if (phone()) setTimeout(() => box.current?.querySelector('.mc-sub [role^="menuitem"]')?.focus({ preventScroll: true }), 30);
  };
  const hoverSub = (k, e) => { if (!phone() && e.pointerType === 'mouse' && sub !== k) { setSubTop(e.currentTarget.offsetTop - 6); setSub(k); } };
  const nearSub = e => { if (!phone() && e.pointerType === 'mouse' && sub) setSub(null); };

  if (!mounted || !open || !pos) return null;
  const sheet = !!pos.sheet;
  const en = info.lang === 'en';
  const lang = id => act(() => { SZ()?.setLang?.(id); });
  const style = sheet ? undefined : { left: pos.left, bottom: pos.bottom, width: pos.w };
  const mac = isMac();

  return createPortal(
    <>
      {sheet && <div className="mc-scrim" onPointerDown={() => close(false)} />}
      <div className={'mc' + (sheet ? ' mc-sheet' : '') + (sub ? ' mc-insub' : '')} ref={box} style={style} role="presentation" data-sub-open={sub || undefined}>
        <div className="mc-main" role="menu" aria-label="Tu cuenta">
          {info.ready ? (
            <div className="mc-who" data-clarity-mask="true"><span className="mc-h notr">{info.handle}</span><span className="mc-plan notr">{info.plan}</span></div>
          ) : (
            <button type="button" role="menuitem" className="mc-i mc-in" onClick={act(() => F()?.signIn?.())}><span className="mc-ic">{I.user}</span><span className="mc-t">Entrar o crear cuenta</span></button>
          )}
          <button type="button" role="menuitem" className="mc-i" onClick={act(() => F()?.settings?.())} onPointerEnter={nearSub}>
            <span className="mc-ic">{I.cfg}</span><span className="mc-t">Ajustes</span><span className="mc-k mc-sc notr" aria-hidden="true">{mac ? '⌘,' : 'Ctrl+,'}</span>
          </button>
          <button type="button" role="menuitem" aria-haspopup="menu" aria-expanded={sub === 'lang'} data-sub="lang" className={'mc-i' + (sub === 'lang' ? ' on' : '')} onClick={e => openSub('lang', e)} onPointerEnter={e => hoverSub('lang', e)}>
            <span className="mc-ic">{I.globe}</span><span className="mc-t">Idioma</span><span className="mc-k notr" aria-hidden="true">{en ? 'English' : 'Español'}</span><span className="mc-ch" aria-hidden="true">{I.chev}</span>
          </button>
          <button type="button" role="menuitem" className="mc-i" onClick={act(() => F()?.help?.())} onPointerEnter={nearSub}><span className="mc-ic">{I.help}</span><span className="mc-t">Obtener ayuda</span></button>
          <div className="mc-sep" role="separator" />
          <button type="button" role="menuitem" className="mc-i" onClick={act(() => SZ()?.plansModal?.())} onPointerEnter={nearSub}><span className="mc-ic">{I.plans}</span><span className="mc-t">Planes</span></button>
          {info.team && <button type="button" role="menuitem" className="mc-i" onClick={act(() => { location.href = 'pulsem.html'; })} onPointerEnter={nearSub}><span className="mc-ic">{I.pulse}</span><span className="mc-t">Pulsem (equipo)</span></button>}
          <button type="button" role="menuitem" aria-haspopup="menu" aria-expanded={sub === 'more'} data-sub="more" className={'mc-i' + (sub === 'more' ? ' on' : '')} onClick={e => openSub('more', e)} onPointerEnter={e => hoverSub('more', e)}>
            <span className="mc-ic">{I.info}</span><span className="mc-t">Más información</span><span className="mc-ch" aria-hidden="true">{I.chev}</span>
          </button>
          {info.ready && <>
            <div className="mc-sep" role="separator" />
            <button type="button" role="menuitem" className="mc-i" onClick={act(() => SZ()?.accLogout?.())} onPointerEnter={nearSub}><span className="mc-ic">{I.out}</span><span className="mc-t">Cerrar sesión</span></button>
          </>}
        </div>
        {sub === 'lang' && (
          <div className="mc-sub" role="menu" aria-label="Idioma" style={sheet ? undefined : { bottom: 'auto', top: subTop }}>
            {sheet && <button type="button" role="menuitem" className="mc-i mc-bk" onClick={() => { setSub(null); setTimeout(() => box.current?.querySelector('.mc-main [data-sub="lang"]')?.focus(), 30); }}><span className="mc-ic">{I.back}</span><span className="mc-t">Idioma</span></button>}
            {[['es', 'Español'], ['en', 'English']].map(([id, nm]) => (
              <button key={id} type="button" role="menuitemradio" aria-checked={info.lang === id} lang={id} className="mc-i" onClick={lang(id)}>
                <span className="mc-t notr">{nm}</span>{info.lang === id && <span className="mc-ck" aria-hidden="true">{I.ok}</span>}
              </button>
            ))}
          </div>
        )}
        {sub === 'more' && (
          <div className="mc-sub" role="menu" aria-label="Más información" style={sheet ? undefined : { bottom: 'auto', top: subTop }}>
            {sheet && <button type="button" role="menuitem" className="mc-i mc-bk" onClick={() => { setSub(null); setTimeout(() => box.current?.querySelector('.mc-main [data-sub="more"]')?.focus(), 30); }}><span className="mc-ic">{I.back}</span><span className="mc-t">Más información</span></button>}
            <button type="button" role="menuitem" className="mc-i" onClick={act(() => F()?.guide?.())}><span className="mc-ic">{I.book}</span><span className="mc-t">Guía de Sonyx</span></button>
            <button type="button" role="menuitem" className="mc-i" onClick={act(() => F()?.energy?.())}><span className="mc-ic">{I.batt}</span><span className="mc-t">Tu EnerX de hoy</span></button>
            <button type="button" role="menuitem" className="mc-i" onClick={act(() => { location.href = 'terminos.html'; })}><span className="mc-ic">{I.doc}</span><span className="mc-t">Términos</span></button>
            <button type="button" role="menuitem" className="mc-i" onClick={act(() => { location.href = 'privacidad.html'; })}><span className="mc-ic">{I.shield}</span><span className="mc-t">Privacidad</span></button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
