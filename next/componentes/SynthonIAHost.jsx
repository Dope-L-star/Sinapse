'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * SynthonIA's visible controls are real React nodes. The mature assistant engine
 * still supplies faces, voice, its hand/panel and guide choreography through a
 * narrow adapter; it may attach pointer behaviour, but it never creates a second
 * avatar or BETA button beside React's nodes.
 */
export default function SynthonIAHost() {
  const [hidden, setHidden] = useState(false);
  /* v4.2 · ya estamos en ALFA: «ALFA» en español, «ALPHA» en inglés (cambia al instante con el idioma) */
  const [alfaTag, setAlfaTag] = useState('ALFA');
  useEffect(() => {
    const read = () => setAlfaTag(document.documentElement.lang === 'en' ? 'ALPHA' : 'ALFA');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => mo.disconnect();
  }, []);

  const activateAssistant = useCallback((event) => {
    if (typeof window === 'undefined') return;
    try {
      const api = window.SZ?.BOT;
      if (typeof api?.activate === 'function') {
        const result = api.activate(event?.nativeEvent || event);
        if (result && typeof result.catch === 'function') result.catch(() => {});
      }
    } catch {
      // An assistant interaction must never block chat controls.
    }
  }, []);

  const openFeedback = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof window === 'undefined') return;
    try {
      const result = window.SZ?.feedbackModal?.();
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch {
      // Keep the rest of SynthFlow usable if feedback fails to open.
    }
  }, []);

  useEffect(() => {
    let persistedHidden = false;
    try { persistedHidden = window.sessionStorage.getItem('synthz:bothide') === '1'; } catch {}
    if (persistedHidden) {
      setHidden(true);
      return undefined;
    }

    let disposed = false;
    const mount = () => {
      if (disposed || typeof window === 'undefined') return;
      try {
        const bot = window.SZ?.BOT;
        if (bot && typeof bot.mount === 'function') {
          const result = bot.mount();
          if (result && typeof result.catch === 'function') result.catch(() => {});
        }
      } catch {
        // SynthonIA is optional; the core chat must remain available.
      }
    };
    const hide = () => {
      // Antes de quitar los nodos React, limpia referencias y listeners del motor heredado.
      try { window.SZ?.BOT?.unmount?.(); } catch {}
      setHidden(true);
    };
    window.addEventListener('synthz-synthonia', mount);
    window.addEventListener('symphoria:react-page-ready', mount);
    window.addEventListener('symphoria:hide-synthonIA', hide);
    // Covers the case where the engine loaded before the React effect.
    if (window.SZ?.synReady && typeof window.SZ.synReady.then === 'function') {
      window.SZ.synReady.then(mount).catch(() => {});
    }
    mount();
    return () => {
      disposed = true;
      // Next client navigation can unmount/remount this route without reloading core.js.
      // Reset only the React-owned bot reference so the next SynthFlow visit mounts it again.
      try { window.SZ?.BOT?.unmount?.(); } catch {}
      window.removeEventListener('synthz-synthonia', mount);
      window.removeEventListener('symphoria:react-page-ready', mount);
      window.removeEventListener('symphoria:hide-synthonIA', hide);
    };
  }, []);

  return (
    <div id="synthonIA-react-host" data-react-component="SynthonIA" style={{ display: 'contents' }}>
      {hidden ? null : (
        <>
          <button
            id="szBot"
            type="button"
            aria-label="SynthonIA"
            data-tip="SynthonIA"
            data-react-component="synthonia-avatar"
            onClick={activateAssistant}
          >
            <span className="bf" aria-hidden="true" />
            <i className="bdot" hidden />
          </button>
          <button
            id="betaBot"
            type="button"
            className="beta-tag bb"
            title="Cuéntanos qué mejorar"
            data-tip="Cuéntanos qué mejorar"
            data-react-component="synthonia-beta"
            style={{ visibility: 'hidden' }}
            onClick={openFeedback}
          >{alfaTag}</button>
        </>
      )}
    </div>
  );
}
